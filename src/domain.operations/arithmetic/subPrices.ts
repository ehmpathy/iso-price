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
const getExponentValue = (exponent: IsoPriceExponent): number => {
  const match = exponent.match(/\^(-?\d+)$/);
  if (!match) return -2; // default to centi
  return parseInt(match[1]!, 10);
};

/**
 * .what = subtracts second price from first
 * .why = enables price difference computation
 *
 * @throws BadRequestError if currencies do not match
 *
 * @example
 * subPrices('USD 50.00', 'USD 20.00')
 * // => 'USD 30.00'
 *
 * @example
 * subPrices('USD 10.00', 'USD 50.00')
 * // => 'USD -40.00' (negative allowed)
 */
export function subPrices<TCurrency extends string = string>(
  minuend: IsoPrice<TCurrency> | string,
  subtrahend: IsoPrice<TCurrency> | string,
  options?: { format?: 'words' },
): IsoPriceWords<TCurrency>;
export function subPrices<TCurrency extends string = string>(
  minuend: IsoPrice<TCurrency> | string,
  subtrahend: IsoPrice<TCurrency> | string,
  options: { format: 'shape' },
): IsoPriceShape<TCurrency>;
export function subPrices<TCurrency extends string = string>(
  minuend: IsoPrice<TCurrency> | string,
  subtrahend: IsoPrice<TCurrency> | string,
  options?: { format?: 'words' | 'shape' },
): IsoPriceWords<TCurrency> | IsoPriceShape<TCurrency> {
  // convert to shapes
  const minuendShape = asIsoPriceShape(minuend);
  const subtrahendShape = asIsoPriceShape(subtrahend);

  // verify currencies match
  if (minuendShape.currency !== subtrahendShape.currency) {
    throw new BadRequestError('currency mismatch in price subtraction', {
      minuend: minuendShape.currency,
      subtrahend: subtrahendShape.currency,
    });
  }

  const currency = minuendShape.currency as TCurrency;

  // find the highest precision (lowest exponent value)
  const minuendExp = getExponentValue(
    minuendShape.exponent ?? IsoPriceExponent.CENTI,
  );
  const subtrahendExp = getExponentValue(
    subtrahendShape.exponent ?? IsoPriceExponent.CENTI,
  );
  const targetExponentValue = Math.min(minuendExp, subtrahendExp);
  const targetExponent =
    minuendExp <= subtrahendExp
      ? (minuendShape.exponent ?? IsoPriceExponent.CENTI)
      : (subtrahendShape.exponent ?? IsoPriceExponent.CENTI);

  // normalize amounts to target precision
  const minuendShift = minuendExp - targetExponentValue;
  const subtrahendShift = subtrahendExp - targetExponentValue;
  const normalizedMinuend = minuendShape.amount * 10n ** BigInt(minuendShift);
  const normalizedSubtrahend =
    subtrahendShape.amount * 10n ** BigInt(subtrahendShift);

  // compute difference
  const difference = normalizedMinuend - normalizedSubtrahend;

  // build result shape
  const resultShape: IsoPriceShape<TCurrency> = {
    amount: difference,
    currency,
    exponent: targetExponent as IsoPriceExponent,
  };

  // return in requested format
  if (options?.format === 'shape') {
    return resultShape;
  }
  return asIsoPriceWords<TCurrency>(resultShape);
}

/**
 * .what = alias for subPrices
 * .why = provides price-prefixed variant
 */
export const priceSub = subPrices;
