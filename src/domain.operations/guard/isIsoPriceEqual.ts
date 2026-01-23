import type { IsoPrice } from '../../domain.objects/IsoPrice';
import { subPrices } from '../arithmetic/subPrices';

/**
 * .what = checks if two prices are numerically equal
 * .why = enables safe price comparison without string comparison footgun
 *
 * handles precision normalization — two prices that represent the same
 * numeric value are equal regardless of format or exponent.
 *
 * @throws BadRequestError if currencies do not match
 *
 * @example
 * isIsoPriceEqual('USD 100.00', 'USD 100.00')      // => true
 * isIsoPriceEqual('USD 1_000.00', 'USD 1000.00')   // => true (underscores)
 * isIsoPriceEqual('USD 0.25', 'USD 0.250_000')     // => true (precision)
 * isIsoPriceEqual('USD 0.25', 'USD 0.250_001')     // => false
 */
export const isIsoPriceEqual = <TCurrency extends string = string>(
  a: IsoPrice<TCurrency> | string,
  b: IsoPrice<TCurrency> | string,
): boolean => {
  const diff = subPrices(a, b, { format: 'shape' });
  return diff.amount === 0n;
};
