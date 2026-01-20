import { BadRequestError } from 'helpful-errors';

import type { IsoPrice } from '../../domain.objects/IsoPrice';
import { isIsoPriceHuman } from './isIsoPriceHuman';
import { isIsoPriceShape } from './isIsoPriceShape';
import { isIsoPriceWords } from './isIsoPriceWords';

/**
 * .what = type guard for IsoPrice union type
 * .why = validates that a value is any of the three iso-price formats
 *
 * accepts:
 * - IsoPriceWords: 'USD 50.37'
 * - IsoPriceShape: { amount: 5037n, currency: 'USD' }
 * - IsoPriceHuman: '$50.37'
 */
export const isIsoPrice = (value: unknown): value is IsoPrice => {
  return (
    isIsoPriceWords(value) || isIsoPriceShape(value) || isIsoPriceHuman(value)
  );
};

/**
 * .what = assertion function that throws on invalid input
 * .why = enables fail-fast validation with helpful error messages
 */
isIsoPrice.assure = (value: unknown): asserts value is IsoPrice => {
  if (!isIsoPrice(value))
    throw new BadRequestError('value is not a valid IsoPrice', { value });
};
