import type { IsoPrice } from '../../domain.objects/IsoPrice';
import { IsoPriceExponent } from '../../domain.objects/IsoPriceExponent';
import { IsoPriceRoundMode } from '../../domain.objects/IsoPriceRoundMode';
import type { IsoPriceWords } from '../../domain.objects/IsoPriceWords';
import { asIsoPriceShape } from '../cast/asIsoPriceShape';
import { asIsoPriceWords } from '../cast/asIsoPriceWords';

/**
 * .what = extracts numeric exponent from exponent string
 * .why = enables arithmetic on exponent values
 */
const getExponentValue = (exponent: IsoPriceExponent): number => {
  const match = exponent.match(/\^(-?\d+)$/);
  if (!match) return -2; // default to centi
  return parseInt(match[1]!, 10);
};

/**
 * .what = applies round mode to a bigint value
 * .why = enables precision decrease with correct round behavior
 */
const applyRoundMode = (
  value: bigint,
  divisor: bigint,
  mode: IsoPriceRoundMode,
): bigint => {
  const quotient = value / divisor;
  const remainder = value % divisor;

  // no remainder = no need to round
  if (remainder === 0n) return quotient;

  const isNegative = value < 0n;
  const absRemainder = isNegative ? -remainder : remainder;
  const halfDivisor = divisor / 2n;

  switch (mode) {
    case IsoPriceRoundMode.FLOOR:
      // always toward negative infinity
      return isNegative ? quotient - 1n : quotient;

    case IsoPriceRoundMode.CEIL:
      // always toward positive infinity
      return isNegative ? quotient : quotient + 1n;

    case IsoPriceRoundMode.HALF_UP:
      // round half toward positive infinity
      if (absRemainder >= halfDivisor) {
        return isNegative ? quotient - 1n : quotient + 1n;
      }
      return quotient;

    case IsoPriceRoundMode.HALF_DOWN:
      // round half toward zero
      if (absRemainder > halfDivisor) {
        return isNegative ? quotient - 1n : quotient + 1n;
      }
      return quotient;

    case IsoPriceRoundMode.HALF_EVEN:
      // round half to nearest even (bankers round)
      if (absRemainder > halfDivisor) {
        return isNegative ? quotient - 1n : quotient + 1n;
      }
      if (absRemainder === halfDivisor) {
        // round to even
        const absQuotient = isNegative ? -quotient : quotient;
        if (absQuotient % 2n !== 0n) {
          return isNegative ? quotient - 1n : quotient + 1n;
        }
      }
      return quotient;

    default:
      return quotient;
  }
};

/**
 * .what = changes the precision of a price to a target exponent
 * .why = enables precision increase (lossless) and decrease (with round)
 *
 * @example
 * // increase precision (lossless)
 * setPricePrecision({ of: 'USD 50.37', to: 'micro.x10^-6' })
 * // => 'USD 50.370000'
 *
 * @example
 * // decrease precision (requires round)
 * setPricePrecision({ of: 'USD 5.555', to: 'centi.x10^-2' })
 * // => 'USD 5.56' (default half-up)
 *
 * @example
 * // decrease precision with explicit round mode
 * setPricePrecision({ of: 'USD 5.555', to: 'centi.x10^-2' }, { round: 'floor' })
 * // => 'USD 5.55'
 */
export const setPricePrecision = <TCurrency extends string = string>(
  input: {
    of: IsoPrice<TCurrency> | string;
    to: IsoPriceExponent;
  },
  options?: { round?: IsoPriceRoundMode },
): IsoPriceWords<TCurrency> => {
  // parse the input price
  const shape = asIsoPriceShape(input.of);

  // get current and target exponent values
  const currentExp = getExponentValue(shape.exponent ?? IsoPriceExponent.CENTI);
  const targetExp = getExponentValue(input.to);

  // calculate the scale difference
  const scaleDiff = currentExp - targetExp;

  let newAmount: bigint;

  if (scaleDiff > 0) {
    // precision increase — multiply (lossless)
    const multiplier = 10n ** BigInt(scaleDiff);
    newAmount = shape.amount * multiplier;
  } else if (scaleDiff < 0) {
    // precision decrease — divide with round
    const divisor = 10n ** BigInt(-scaleDiff);
    const mode = options?.round ?? IsoPriceRoundMode.HALF_UP;
    newAmount = applyRoundMode(shape.amount, divisor, mode);
  } else {
    // same precision
    newAmount = shape.amount;
  }

  // build new shape with target exponent
  const newShape = {
    amount: newAmount,
    currency: shape.currency as TCurrency,
    exponent: input.to,
  };

  return asIsoPriceWords(newShape);
};
