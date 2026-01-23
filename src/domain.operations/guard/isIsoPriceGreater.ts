import type { IsoPrice } from '../../domain.objects/IsoPrice';
import { subPrices } from '../arithmetic/subPrices';

/**
 * .what = checks if first price is numerically greater than second
 * .why = enables safe price comparison without string comparison footgun
 *
 * @throws BadRequestError if currencies do not match
 *
 * @example
 * isIsoPriceGreater('USD 100.00', 'USD 9.00')   // => true (100 > 9)
 * isIsoPriceGreater('USD 9.00', 'USD 100.00')   // => false
 * isIsoPriceGreater('USD 100.00', 'USD 100.00') // => false
 */
export const isIsoPriceGreater = <TCurrency extends string = string>(
  a: IsoPrice<TCurrency> | string,
  b: IsoPrice<TCurrency> | string,
): boolean => {
  const diff = subPrices(a, b, { format: 'shape' });
  return diff.amount > 0n;
};
