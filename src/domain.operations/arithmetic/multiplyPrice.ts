import type { IsoPrice } from '../../domain.objects/IsoPrice';
import { IsoPriceExponent } from '../../domain.objects/IsoPriceExponent';
import { IsoPriceRoundMode } from '../../domain.objects/IsoPriceRoundMode';
import type { IsoPriceShape } from '../../domain.objects/IsoPriceShape';
import type { IsoPriceWords } from '../../domain.objects/IsoPriceWords';
import { asIsoPriceShape } from '../cast/asIsoPriceShape';
import { asIsoPriceWords } from '../cast/asIsoPriceWords';

/**
 * .what = gets the numeric exponent value from exponent string
 * .why = needed for precision scale
 */
const getExponentValue = (exponent: IsoPriceExponent | string): number => {
  const match = exponent.match(/\^(-?\d+)$/);
  if (!match) return -2; // default to centi
  return parseInt(match[1]!, 10);
};

/**
 * .what = applies round mode to a bigint
 * .why = needed to round back to input precision
 */
const applyRound = (
  amount: bigint,
  divisor: bigint,
  mode: IsoPriceRoundMode,
): bigint => {
  const quotient = amount / divisor;
  const remainder = amount % divisor;

  if (remainder === 0n) return quotient;

  const isNegative = amount < 0n;
  const absRemainder = remainder < 0n ? -remainder : remainder;
  const halfDivisor = divisor / 2n;

  switch (mode) {
    case IsoPriceRoundMode.FLOOR:
      return isNegative ? quotient - 1n : quotient;
    case IsoPriceRoundMode.CEIL:
      return isNegative ? quotient : quotient + 1n;
    case IsoPriceRoundMode.HALF_UP:
      return absRemainder >= halfDivisor
        ? isNegative
          ? quotient - 1n
          : quotient + 1n
        : quotient;
    case IsoPriceRoundMode.HALF_DOWN:
      return absRemainder > halfDivisor
        ? isNegative
          ? quotient - 1n
          : quotient + 1n
        : quotient;
    case IsoPriceRoundMode.HALF_EVEN: {
      const isEven = quotient % 2n === 0n;
      if (absRemainder === halfDivisor) {
        return isEven ? quotient : quotient + 1n;
      }
      return absRemainder > halfDivisor
        ? isNegative
          ? quotient - 1n
          : quotient + 1n
        : quotient;
    }
    default:
      return quotient;
  }
};

/**
 * .what = multiplies a price by a scalar
 * .why = enables quantity calculations and percentage markups
 *
 * maintains input precision by default. uses higher internal precision
 * to avoid intermediate loss, then rounds back to input precision.
 *
 * @example
 * multiplyPrice({ of: 'USD 10.00', by: 3 })
 * // => 'USD 30.00'
 *
 * @example
 * multiplyPrice({ of: 'USD 100.00', by: 1.08 })
 * // => 'USD 108.00' (tax markup)
 */
export function multiplyPrice<TCurrency extends string = string>(
  input: { of: IsoPrice<TCurrency> | string; by: number },
  options?: { format?: 'words'; round?: IsoPriceRoundMode },
): IsoPriceWords<TCurrency>;
export function multiplyPrice<TCurrency extends string = string>(
  input: { of: IsoPrice<TCurrency> | string; by: number },
  options: { format: 'shape'; round?: IsoPriceRoundMode },
): IsoPriceShape<TCurrency>;
export function multiplyPrice<TCurrency extends string = string>(
  input: { of: IsoPrice<TCurrency> | string; by: number },
  options?: { format?: 'words' | 'shape'; round?: IsoPriceRoundMode },
): IsoPriceWords<TCurrency> | IsoPriceShape<TCurrency> {
  const shape = asIsoPriceShape(input.of);
  const inputExponent = shape.exponent ?? IsoPriceExponent.CENTI;
  const roundMode = options?.round ?? IsoPriceRoundMode.HALF_UP;

  // scale multiplier to avoid float precision issues (use 12 decimal places)
  const scaleFactor = BigInt(Math.round(input.by * 1e12));
  const multiplied = shape.amount * scaleFactor;

  // round back to original precision
  const rounded = applyRound(multiplied, BigInt(1e12), roundMode);

  // build result shape
  const resultShape: IsoPriceShape<TCurrency> = {
    amount: rounded,
    currency: shape.currency as TCurrency,
    exponent: inputExponent,
  };

  // return in requested format
  if (options?.format === 'shape') {
    return resultShape;
  }
  return asIsoPriceWords(resultShape);
}

/**
 * .what = alias for multiplyPrice
 * .why = provides price-prefixed variant
 */
export const priceMultiply = multiplyPrice;
