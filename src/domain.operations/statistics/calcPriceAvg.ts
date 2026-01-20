import { BadRequestError } from 'helpful-errors';

import type { IsoPrice } from '../../domain.objects/IsoPrice';
import { IsoPriceExponent } from '../../domain.objects/IsoPriceExponent';
import type { IsoPriceShape } from '../../domain.objects/IsoPriceShape';
import type { IsoPriceWords } from '../../domain.objects/IsoPriceWords';
import { asIsoPriceShape } from '../cast/asIsoPriceShape';
import { asIsoPriceWords } from '../cast/asIsoPriceWords';

/**
 * .what = calculates the average of an array of prices
 * .why = enables statistical analysis of price data with precision safety
 *
 * @example
 * calcPriceAvg(['USD 10.00', 'USD 20.00', 'USD 30.00'])
 * // => 'USD 20.00'
 *
 * @example
 * calcPriceAvg(['USD 10.00', 'USD 20.00'], { format: 'shape' })
 * // => { amount: 1500n, currency: 'USD', exponent: 'centi.x10^-2' }
 */
export function calcPriceAvg<TCurrency extends string = string>(
  prices: (IsoPrice<TCurrency> | string)[],
  options?: { format?: 'words' },
): IsoPriceWords<TCurrency>;
export function calcPriceAvg<TCurrency extends string = string>(
  prices: (IsoPrice<TCurrency> | string)[],
  options: { format: 'shape' },
): IsoPriceShape<TCurrency>;
export function calcPriceAvg<TCurrency extends string = string>(
  prices: (IsoPrice<TCurrency> | string)[],
  options?: { format?: 'words' | 'shape' },
): IsoPriceWords<TCurrency> | IsoPriceShape<TCurrency> {
  // validate input
  if (prices.length === 0) {
    throw new BadRequestError('cannot calculate average of empty array', {
      prices,
    });
  }

  // convert all prices to shapes
  const shapes = prices.map((p) => asIsoPriceShape(p));

  // validate all currencies match
  const currency = shapes[0]!.currency as TCurrency;
  const mismatch = shapes.find((s) => s.currency !== currency);
  if (mismatch) {
    throw new BadRequestError('cannot calculate average of mixed currencies', {
      expected: currency,
      found: mismatch.currency,
    });
  }

  // find highest precision exponent (most negative = highest precision)
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

  // calculate sum
  const sum = normalizedAmounts.reduce((acc, amt) => acc + amt, 0n);

  // calculate average via bigint division (truncates toward zero)
  const count = BigInt(prices.length);
  const avgAmount = sum / count;

  // build result shape
  const resultShape: IsoPriceShape<TCurrency> = {
    amount: avgAmount,
    currency,
    exponent: targetExponent as IsoPriceExponent,
  };

  if (options?.format === 'shape') {
    return resultShape;
  }

  return asIsoPriceWords<TCurrency>(resultShape);
}

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
    // source has lower precision, multiply to increase
    return amount * 10n ** BigInt(diff);
  }
  if (diff < 0) {
    // source has higher precision, divide to decrease (should not happen if target is highest)
    return amount / 10n ** BigInt(-diff);
  }
  return amount;
};
