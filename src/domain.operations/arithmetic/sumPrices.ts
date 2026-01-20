import { BadRequestError } from 'helpful-errors';

import type { IsoPrice } from '../../domain.objects/IsoPrice';
import { IsoPriceExponent } from '../../domain.objects/IsoPriceExponent';
import type { IsoPriceShape } from '../../domain.objects/IsoPriceShape';
import type { IsoPriceWords } from '../../domain.objects/IsoPriceWords';
import { asIsoPriceShape } from '../cast/asIsoPriceShape';
import { asIsoPriceWords } from '../cast/asIsoPriceWords';

/**
 * .what = gets the numeric exponent value from exponent string
 * .why = needed for precision comparison and normalization
 */
const getExponentValue = (exponent: IsoPriceExponent | string): number => {
  const match = exponent.match(/\^(-?\d+)$/);
  if (!match) return -2; // default to centi
  return parseInt(match[1]!, 10);
};

/**
 * .what = sums multiple prices
 * .why = enables price aggregation with mixed precision support
 *
 * supports two call signatures:
 * - spread: `sumPrices('USD 10.00', 'USD 20.00')`
 * - array: `sumPrices(['USD 10.00', 'USD 20.00'])`
 * - with options: `sumPrices(['USD 10.00'], { format: 'shape' })`
 *
 * @throws BadRequestError if currencies do not match
 *
 * @example
 * sumPrices('USD 10.00', 'USD 20.00')
 * // => 'USD 30.00'
 *
 * @example
 * sumPrices(['USD 10.00', 'USD 20.00'], { format: 'shape' })
 * // => { amount: 3000n, currency: 'USD' }
 */
export function sumPrices<TCurrency extends string = string>(
  ...args: (IsoPrice<TCurrency> | string)[]
): IsoPriceWords<TCurrency>;
export function sumPrices<TCurrency extends string = string>(
  prices: (IsoPrice<TCurrency> | string)[],
  options?: { format?: 'words' },
): IsoPriceWords<TCurrency>;
export function sumPrices<TCurrency extends string = string>(
  prices: (IsoPrice<TCurrency> | string)[],
  options: { format: 'shape' },
): IsoPriceShape<TCurrency>;
export function sumPrices<TCurrency extends string = string>(
  ...args:
    | [(IsoPrice<TCurrency> | string)[], { format?: 'words' | 'shape' }?]
    | (IsoPrice<TCurrency> | string)[]
): IsoPriceWords<TCurrency> | IsoPriceShape<TCurrency> {
  // parse args: array syntax vs spread syntax
  let prices: IsoPrice<TCurrency>[];
  let options: { format?: 'words' | 'shape' } | undefined;

  if (Array.isArray(args[0])) {
    prices = args[0] as IsoPrice<TCurrency>[];
    options = args[1] as { format?: 'words' | 'shape' } | undefined;
  } else {
    prices = args as IsoPrice<TCurrency>[];
    options = undefined;
  }

  // handle empty array
  if (prices.length === 0) {
    throw new BadRequestError('cannot sum empty price array', { prices });
  }

  // convert all to shapes
  const shapes = prices.map((p) => asIsoPriceShape(p));

  // verify all currencies match
  const currency = shapes[0]!.currency as TCurrency;
  const mismatch = shapes.find((s) => s.currency !== currency);
  if (mismatch) {
    throw new BadRequestError('currency mismatch in price sum', {
      expected: currency,
      found: mismatch.currency,
      prices,
    });
  }

  // find the highest precision (lowest exponent value)
  const exponents = shapes.map(
    (s) => s.exponent ?? IsoPriceExponent.CENTI,
  ) as IsoPriceExponent[];
  const exponentValues = exponents.map(getExponentValue);
  const targetExponentValue = Math.min(...exponentValues);
  const targetExponent =
    exponents[exponentValues.indexOf(targetExponentValue)]!;

  // normalize all amounts to target precision and sum
  let total = 0n;
  for (let i = 0; i < shapes.length; i++) {
    const shape = shapes[i]!;
    const currentExp = getExponentValue(
      shape.exponent ?? IsoPriceExponent.CENTI,
    );
    const shift = currentExp - targetExponentValue;
    const normalizedAmount = shape.amount * 10n ** BigInt(shift);
    total += normalizedAmount;
  }

  // build result shape
  const resultShape: IsoPriceShape<TCurrency> = {
    amount: total,
    currency,
    exponent: targetExponent,
  };

  // return in requested format
  if (options?.format === 'shape') {
    return resultShape;
  }
  return asIsoPriceWords(resultShape);
}

/**
 * .what = alias for sumPrices
 * .why = provides semantic name for binary addition
 */
export const addPrices = sumPrices;

/**
 * .what = alias for sumPrices
 * .why = provides price-prefixed variant
 */
export const priceSum = sumPrices;

/**
 * .what = alias for sumPrices
 * .why = provides price-prefixed variant
 */
export const priceAdd = sumPrices;
