import { BadRequestError } from 'helpful-errors';

import type { IsoPrice } from '../../domain.objects/IsoPrice';
import { IsoPriceExponent } from '../../domain.objects/IsoPriceExponent';
import { IsoPriceRoundMode } from '../../domain.objects/IsoPriceRoundMode';
import type { IsoPriceShape } from '../../domain.objects/IsoPriceShape';
import type { IsoPriceWords } from '../../domain.objects/IsoPriceWords';
import { asIsoPriceShape } from '../cast/asIsoPriceShape';
import { asIsoPriceWords } from '../cast/asIsoPriceWords';

/**
 * .what = gets the numeric exponent value from exponent string
 * .why = needed for precision calculation
 */
const getExponentValue = (exponent: IsoPriceExponent | string): number => {
  const match = exponent.match(/\^(-?\d+)$/);
  if (!match) return -2; // default to centi
  return parseInt(match[1]!, 10);
};

/**
 * .what = determines required precision based on divisor
 * .why = ensures result has meaningful precision for large divisors
 */
const getRequiredExponent = (
  inputExponent: IsoPriceExponent | string,
  divisor: number,
): IsoPriceExponent => {
  const absDivisor = Math.abs(divisor);

  // for small divisors (< 100), maintain input precision with round
  if (absDivisor < 100) return inputExponent as IsoPriceExponent;

  // for medium divisors (100 - 999,999), use milli precision
  if (absDivisor < 1_000_000) return IsoPriceExponent.MILLI;

  // for large divisors (1M - 999M), use nano precision
  if (absDivisor < 1_000_000_000) return IsoPriceExponent.NANO;

  // for huge divisors, use pico precision
  return IsoPriceExponent.PICO;
};

/**
 * .what = divides a price by a scalar
 * .why = enables per-unit calculations and cost breakdowns
 *
 * auto-scales precision when divisors are large.
 * for small divisors, maintains input precision with round.
 *
 * @throws BadRequestError if divisor is zero
 *
 * @example
 * dividePrice({ of: 'USD 10.00', by: 4 })
 * // => 'USD 2.50'
 *
 * @example
 * dividePrice({ of: '$0.25', by: 1_000_000 })
 * // => 'USD 0.000_000_250' (nano precision)
 */
export function dividePrice<TCurrency extends string = string>(
  input: { of: IsoPrice<TCurrency> | string; by: number },
  options?: { format?: 'words'; round?: IsoPriceRoundMode },
): IsoPriceWords<TCurrency>;
export function dividePrice<TCurrency extends string = string>(
  input: { of: IsoPrice<TCurrency> | string; by: number },
  options: { format: 'shape'; round?: IsoPriceRoundMode },
): IsoPriceShape<TCurrency>;
export function dividePrice<TCurrency extends string = string>(
  input: { of: IsoPrice<TCurrency> | string; by: number },
  options?: { format?: 'words' | 'shape'; round?: IsoPriceRoundMode },
): IsoPriceWords<TCurrency> | IsoPriceShape<TCurrency> {
  if (input.by === 0) {
    throw new BadRequestError('cannot divide by zero', { input });
  }

  const shape = asIsoPriceShape(input.of);
  const inputExponent = shape.exponent ?? IsoPriceExponent.CENTI;
  const roundMode = options?.round ?? IsoPriceRoundMode.HALF_UP;

  // determine output precision based on divisor
  const outputExponent = getRequiredExponent(inputExponent, input.by);
  const outputExpValue = getExponentValue(outputExponent);
  const inputExpValue = getExponentValue(inputExponent);

  // scale amount to output precision
  const scaleDiff = inputExpValue - outputExpValue;
  const scaledAmount = shape.amount * 10n ** BigInt(scaleDiff);

  // perform division with round
  const divisor = BigInt(Math.round(Math.abs(input.by)));
  const sign = input.by < 0 ? -1n : 1n;

  let quotient: bigint;
  const remainder = scaledAmount % divisor;

  // apply round mode
  if (remainder === 0n) {
    quotient = scaledAmount / divisor;
  } else {
    const baseQuotient = scaledAmount / divisor;
    const isNegative = scaledAmount < 0n;
    const absRemainder = remainder < 0n ? -remainder : remainder;
    // use doubled remainder for accurate half comparison (avoids truncation from divisor/2)
    const doubledRemainder = absRemainder * 2n;
    const isExactlyHalf = doubledRemainder === divisor;
    const isMoreThanHalf = doubledRemainder > divisor;

    switch (roundMode) {
      case IsoPriceRoundMode.FLOOR:
        quotient = isNegative ? baseQuotient - 1n : baseQuotient;
        break;
      case IsoPriceRoundMode.CEIL:
        quotient = isNegative ? baseQuotient : baseQuotient + 1n;
        break;
      case IsoPriceRoundMode.HALF_UP:
        quotient =
          isExactlyHalf || isMoreThanHalf
            ? isNegative
              ? baseQuotient - 1n
              : baseQuotient + 1n
            : baseQuotient;
        break;
      case IsoPriceRoundMode.HALF_DOWN:
        quotient = isMoreThanHalf
          ? isNegative
            ? baseQuotient - 1n
            : baseQuotient + 1n
          : baseQuotient;
        break;
      case IsoPriceRoundMode.HALF_EVEN: {
        const isEven = baseQuotient % 2n === 0n;
        if (isExactlyHalf) {
          quotient = isEven ? baseQuotient : baseQuotient + 1n;
        } else if (isMoreThanHalf) {
          quotient = isNegative ? baseQuotient - 1n : baseQuotient + 1n;
        } else {
          quotient = baseQuotient;
        }
        break;
      }
      default:
        quotient = baseQuotient;
    }
  }

  // apply divisor sign
  quotient = quotient * sign;

  // build result shape
  const resultShape: IsoPriceShape<TCurrency> = {
    amount: quotient,
    currency: shape.currency as TCurrency,
    exponent: outputExponent,
  };

  // return in requested format
  if (options?.format === 'shape') {
    return resultShape;
  }
  return asIsoPriceWords(resultShape);
}

/**
 * .what = alias for dividePrice
 * .why = provides price-prefixed variant
 */
export const priceDivide = dividePrice;
