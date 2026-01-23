import type { IsoPrice } from '../../domain.objects/IsoPrice';
import { subPrices } from '../arithmetic/subPrices';

/**
 * .what = checks if first price is numerically lesser than second
 * .why = enables safe price comparison without string comparison footgun
 *
 * @throws BadRequestError if currencies do not match
 *
 * @example
 * isIsoPriceLesser('USD 9.00', 'USD 100.00')   // => true (9 < 100)
 * isIsoPriceLesser('USD 100.00', 'USD 9.00')   // => false
 * isIsoPriceLesser('USD 100.00', 'USD 100.00') // => false
 */
export const isIsoPriceLesser = <TCurrency extends string = string>(
  a: IsoPrice<TCurrency> | string,
  b: IsoPrice<TCurrency> | string,
): boolean => {
  const diff = subPrices(a, b, { format: 'shape' });
  return diff.amount < 0n;
};
