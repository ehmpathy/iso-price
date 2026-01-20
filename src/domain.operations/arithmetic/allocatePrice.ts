import { BadRequestError } from 'helpful-errors';

import type { IsoPrice } from '../../domain.objects/IsoPrice';
import { IsoPriceExponent } from '../../domain.objects/IsoPriceExponent';
import type { IsoPriceShape } from '../../domain.objects/IsoPriceShape';
import type { IsoPriceWords } from '../../domain.objects/IsoPriceWords';
import { asIsoPriceShape } from '../cast/asIsoPriceShape';
import { asIsoPriceWords } from '../cast/asIsoPriceWords';

/**
 * .what = remainder distribution mode
 * .why = determines where leftover cents go in allocation
 */
type AllocationRemainderMode = 'first' | 'last' | 'largest' | 'random';

/**
 * .what = allocates a price into equal parts or by ratios
 * .why = enables fair distribution without loss (sum always equals original)
 *
 * @example
 * allocatePrice({ of: 'USD 10.00', into: { parts: 3 }, remainder: 'first' })
 * // => ['USD 3.34', 'USD 3.33', 'USD 3.33']
 *
 * @example
 * allocatePrice({ of: 'USD 5.00', into: { ratios: [7, 3] }, remainder: 'first' })
 * // => ['USD 3.50', 'USD 1.50']
 */
export function allocatePrice<TCurrency extends string = string>(
  input: {
    of: IsoPrice<TCurrency> | string;
    into: { parts: number } | { ratios: number[] };
    remainder: AllocationRemainderMode;
  },
  options?: { format?: 'words' },
): IsoPriceWords<TCurrency>[];
export function allocatePrice<TCurrency extends string = string>(
  input: {
    of: IsoPrice<TCurrency> | string;
    into: { parts: number } | { ratios: number[] };
    remainder: AllocationRemainderMode;
  },
  options: { format: 'shape' },
): IsoPriceShape<TCurrency>[];
export function allocatePrice<TCurrency extends string = string>(
  input: {
    of: IsoPrice<TCurrency> | string;
    into: { parts: number } | { ratios: number[] };
    remainder: AllocationRemainderMode;
  },
  options?: { format?: 'words' | 'shape' },
): IsoPriceWords<TCurrency>[] | IsoPriceShape<TCurrency>[] {
  const shape = asIsoPriceShape(input.of);
  const exponent = shape.exponent ?? IsoPriceExponent.CENTI;

  // handle equal parts allocation
  if ('parts' in input.into) {
    const parts = input.into.parts;
    if (parts < 1) {
      throw new BadRequestError('cannot allocate into less than 1 part', {
        input,
      });
    }
    return allocateEqualParts(
      shape.amount,
      shape.currency as TCurrency,
      exponent,
      parts,
      input.remainder,
      options?.format,
    );
  }

  // handle ratio allocation
  const ratios = input.into.ratios;
  if (ratios.length < 1) {
    throw new BadRequestError('cannot allocate into less than 1 part', {
      input,
    });
  }
  return allocateByRatios(
    shape.amount,
    shape.currency as TCurrency,
    exponent,
    ratios,
    input.remainder,
    options?.format,
  );
}

/**
 * .what = allocates amount into equal parts
 * .why = splits evenly with remainder distribution
 */
const allocateEqualParts = <TCurrency extends string>(
  amount: bigint,
  currency: TCurrency,
  exponent: IsoPriceExponent | string,
  parts: number,
  remainderMode: AllocationRemainderMode,
  format?: 'words' | 'shape',
): IsoPriceWords<TCurrency>[] | IsoPriceShape<TCurrency>[] => {
  const divisor = BigInt(parts);
  const baseAmount = amount / divisor;
  const remainder = amount % divisor;

  // create base allocations
  const allocations: bigint[] = Array(parts).fill(baseAmount);

  // distribute remainder
  distributeRemainder(allocations, remainder, remainderMode, baseAmount);

  return formatAllocations(allocations, currency, exponent, format);
};

/**
 * .what = allocates amount by ratios
 * .why = splits proportionally with remainder distribution
 */
const allocateByRatios = <TCurrency extends string>(
  amount: bigint,
  currency: TCurrency,
  exponent: IsoPriceExponent | string,
  ratios: number[],
  remainderMode: AllocationRemainderMode,
  format?: 'words' | 'shape',
): IsoPriceWords<TCurrency>[] | IsoPriceShape<TCurrency>[] => {
  // validate ratios
  if (ratios.some((r) => r < 0)) {
    throw new BadRequestError('ratios must be non-negative', { ratios });
  }

  const totalRatio = ratios.reduce((sum, r) => sum + r, 0);
  if (totalRatio === 0) {
    throw new BadRequestError('total ratio cannot be zero', { ratios });
  }

  // calculate base allocations via largest remainder method
  const totalRatioBigInt = BigInt(totalRatio);
  const allocations: bigint[] = [];
  let allocated = 0n;

  for (let i = 0; i < ratios.length; i++) {
    const ratio = BigInt(ratios[i]!);
    const allocation = (amount * ratio) / totalRatioBigInt;
    allocations.push(allocation);
    allocated += allocation;
  }

  // calculate remainder from truncation
  const remainder = amount - allocated;

  // distribute remainder
  distributeRemainder(
    allocations,
    remainder,
    remainderMode,
    0n, // for ratio mode, pass 0 as baseAmount (not used for largest)
    ratios, // pass ratios for largest remainder method
  );

  return formatAllocations(allocations, currency, exponent, format);
};

/**
 * .what = distributes remainder per mode
 * .why = ensures no cent is lost in allocation
 */
const distributeRemainder = (
  allocations: bigint[],
  remainder: bigint,
  mode: AllocationRemainderMode,
  baseAmount: bigint,
  ratios?: number[],
): void => {
  // handle negative remainder (can happen with negative amounts)
  const isNegative = remainder < 0n;
  const absRemainder = isNegative ? -remainder : remainder;
  const increment = isNegative ? -1n : 1n;

  // get indices for distribution
  const indices = getDistributionIndices(
    allocations.length,
    Number(absRemainder),
    mode,
    allocations,
    ratios,
  );

  // apply remainder distribution
  for (const idx of indices) {
    allocations[idx] = allocations[idx]! + increment;
  }
};

/**
 * .what = determines which indices receive remainder cents
 * .why = implements different distribution strategies
 */
const getDistributionIndices = (
  length: number,
  count: number,
  mode: AllocationRemainderMode,
  allocations: bigint[],
  ratios?: number[],
): number[] => {
  if (count === 0) return [];
  if (count >= length) {
    // each gets at least one
    const indices = Array.from({ length }, (_, i) => i);
    // distribute extra to first positions
    const extra = count - length;
    for (let i = 0; i < extra; i++) {
      indices.push(i % length);
    }
    return indices;
  }

  switch (mode) {
    case 'first':
      return Array.from({ length: count }, (_, i) => i);

    case 'last':
      return Array.from({ length: count }, (_, i) => length - 1 - i);

    case 'largest': {
      // hamilton/largest remainder method: give to those with largest fractional parts
      // for equal parts, all have same fractional part, so fall back to first
      // for ratios, calculate fractional remainders
      if (!ratios) {
        return Array.from({ length: count }, (_, i) => i);
      }

      // calculate fractional remainders for each ratio
      const totalRatio = ratios.reduce((sum, r) => sum + r, 0);
      const fractions = ratios.map((r, i) => ({
        index: i,
        fraction:
          (r / totalRatio) * Number(allocations.reduce((a, b) => a + b, 0n)) -
          Number(allocations[i]!),
      }));

      // sort by fraction (largest first)
      fractions.sort((a, b) => b.fraction - a.fraction);
      return fractions.slice(0, count).map((f) => f.index);
    }

    case 'random': {
      // pseudo-random but deterministic based on allocation values
      const indices = Array.from({ length }, (_, i) => i);
      // use a simple deterministic shuffle based on allocation sum
      const seed = Number(allocations.reduce((a, b) => a + b, 0n) % 1000000n);
      indices.sort((a, b) => {
        const hashA = (a * 31 + seed) % 1000;
        const hashB = (b * 31 + seed) % 1000;
        return hashA - hashB;
      });
      return indices.slice(0, count);
    }

    default:
      return Array.from({ length: count }, (_, i) => i);
  }
};

/**
 * .what = converts bigint allocations to output format
 * .why = enables both words and shape output
 */
const formatAllocations = <TCurrency extends string>(
  allocations: bigint[],
  currency: TCurrency,
  exponent: IsoPriceExponent | string,
  format?: 'words' | 'shape',
): IsoPriceWords<TCurrency>[] | IsoPriceShape<TCurrency>[] => {
  const shapes: IsoPriceShape<TCurrency>[] = allocations.map((amount) => ({
    amount,
    currency,
    exponent: exponent as IsoPriceExponent,
  }));

  if (format === 'shape') {
    return shapes;
  }

  return shapes.map((s) => asIsoPriceWords(s));
};

/**
 * .what = alias for allocatePrice
 * .why = provides price-prefixed variant
 */
export const priceAllocate = allocatePrice;
