import { BadRequestError } from 'helpful-errors';

import type { IsoPrice } from '../../domain.objects/IsoPrice';
import { IsoPriceExponent } from '../../domain.objects/IsoPriceExponent';
import type { IsoPriceShape } from '../../domain.objects/IsoPriceShape';
import type { IsoPriceWords } from '../../domain.objects/IsoPriceWords';
import { asIsoPriceShape } from '../cast/asIsoPriceShape';
import { asIsoPriceWords } from '../cast/asIsoPriceWords';

/**
 * .what = calculates the standard deviation of an array of prices
 * .why = enables statistical analysis of price variance with precision safety
 *
 * uses population standard deviation formula: sqrt(sum((x - mean)^2) / n)
 *
 * @example
 * calcPriceStdev(['USD 10.00', 'USD 20.00', 'USD 30.00'])
 * // => 'USD 8.16' (approx)
 *
 * @example
 * calcPriceStdev(['USD 10.00', 'USD 20.00'], { format: 'shape' })
 * // => { amount: 500n, currency: 'USD', exponent: 'centi.x10^-2' }
 */
export function calcPriceStdev<TCurrency extends string = string>(
  prices: (IsoPrice<TCurrency> | string)[],
  options?: { format?: 'words' },
): IsoPriceWords<TCurrency>;
export function calcPriceStdev<TCurrency extends string = string>(
  prices: (IsoPrice<TCurrency> | string)[],
  options: { format: 'shape' },
): IsoPriceShape<TCurrency>;
export function calcPriceStdev<TCurrency extends string = string>(
  prices: (IsoPrice<TCurrency> | string)[],
  options?: { format?: 'words' | 'shape' },
): IsoPriceWords<TCurrency> | IsoPriceShape<TCurrency> {
  // validate input
  if (prices.length === 0) {
    throw new BadRequestError('cannot calculate stdev of empty array', {
      prices,
    });
  }

  // single value has zero variance
  if (prices.length === 1) {
    const shape = asIsoPriceShape(prices[0]!);
    const resultShape: IsoPriceShape<TCurrency> = {
      amount: 0n,
      currency: shape.currency as TCurrency,
      exponent: (shape.exponent ?? IsoPriceExponent.CENTI) as IsoPriceExponent,
    };
    if (options?.format === 'shape') return resultShape;
    return asIsoPriceWords<TCurrency>(resultShape);
  }

  // convert all prices to shapes
  const shapes = prices.map((p) => asIsoPriceShape(p));

  // validate all currencies match
  const currency = shapes[0]!.currency as TCurrency;
  const mismatch = shapes.find((s) => s.currency !== currency);
  if (mismatch) {
    throw new BadRequestError('cannot calculate stdev of mixed currencies', {
      expected: currency,
      found: mismatch.currency,
    });
  }

  // find highest precision exponent
  const exponents = shapes.map((s) => s.exponent ?? IsoPriceExponent.CENTI);
  const targetExponent = findHighestPrecisionExponent(exponents);

  // normalize all amounts to target exponent
  const normalizedAmounts = shapes.map((s) =>
    normalizeAmount(
      s.amount,
      s.exponent ?? IsoPriceExponent.CENTI,
      targetExponent,
    ),
  );

  // calculate mean
  const sum = normalizedAmounts.reduce((acc, amt) => acc + amt, 0n);
  const count = BigInt(prices.length);
  const mean = sum / count;

  // calculate sum of squared deviations
  // note: we use number for intermediate sqrt calculation, then convert back
  let sumSquaredDev = 0n;
  for (const amt of normalizedAmounts) {
    const dev = amt - mean;
    sumSquaredDev += dev * dev;
  }

  // calculate variance and stdev
  // variance = sumSquaredDev / n (population stdev)
  const variance = sumSquaredDev / count;

  // sqrt via Newton's method for bigint (integer sqrt)
  const stdevAmount = bigintSqrt(variance);

  // build result shape
  const resultShape: IsoPriceShape<TCurrency> = {
    amount: stdevAmount,
    currency,
    exponent: targetExponent as IsoPriceExponent,
  };

  if (options?.format === 'shape') {
    return resultShape;
  }

  return asIsoPriceWords(resultShape) as IsoPriceWords<TCurrency>;
}

/**
 * .what = integer square root via Newton's method
 * .why = enables sqrt calculation for bigint values
 */
const bigintSqrt = (n: bigint): bigint => {
  if (n < 0n) {
    throw new BadRequestError('cannot calculate sqrt of negative number', {
      n,
    });
  }
  if (n === 0n) return 0n;
  if (n === 1n) return 1n;

  // initial guess
  let x = n;
  let y = (x + 1n) / 2n;

  // Newton's method iteration
  while (y < x) {
    x = y;
    y = (x + n / x) / 2n;
  }

  return x;
};

/**
 * .what = finds the highest precision exponent from an array
 * .why = ensures no precision loss when amounts are normalized
 */
const findHighestPrecisionExponent = (
  exponents: IsoPriceExponent[],
): IsoPriceExponent => {
  let highestPrecision = exponents[0]!;
  let highestValue = getExponentValue(highestPrecision);

  for (const exp of exponents) {
    const value = getExponentValue(exp);
    if (value < highestValue) {
      highestValue = value;
      highestPrecision = exp;
    }
  }

  return highestPrecision;
};

/**
 * .what = extracts numeric exponent value from exponent string
 * .why = enables comparison of exponent precision
 */
const getExponentValue = (exponent: IsoPriceExponent): number => {
  const match = exponent.match(/\^(-?\d+)$/);
  if (!match) return -2; // default to centi
  return parseInt(match[1]!, 10);
};

/**
 * .what = normalizes amount from source exponent to target exponent
 * .why = enables arithmetic on amounts with different precisions
 */
const normalizeAmount = (
  amount: bigint,
  sourceExponent: IsoPriceExponent,
  targetExponent: IsoPriceExponent,
): bigint => {
  const sourceValue = getExponentValue(sourceExponent);
  const targetValue = getExponentValue(targetExponent);
  const diff = sourceValue - targetValue;

  if (diff > 0) {
    return amount * 10n ** BigInt(diff);
  }
  if (diff < 0) {
    return amount / 10n ** BigInt(-diff);
  }
  return amount;
};
