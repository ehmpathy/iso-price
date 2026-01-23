import { BadRequestError } from 'helpful-errors';

import type { IsoPrice } from '../../domain.objects/IsoPrice';
import type { IsoPriceWords } from '../../domain.objects/IsoPriceWords';
import { subPrices } from '../arithmetic/subPrices';
import { asIsoPriceWords } from './asIsoPriceWords';

/**
 * .what = sorts an array of prices by numeric value
 * .why = provides correct numeric sort instead of lexicographic string sort
 *
 * the javascript string comparison footgun:
 * ```ts
 * 'USD 100.00' > 'USD 9.00'  // false! ('1' < '9' in ascii)
 * ```
 *
 * this function provides a pit-of-success api for numeric price sort.
 *
 * features:
 * - accepts any price format (words, shape, human)
 * - returns IsoPriceWords[]
 * - default sort order is asc (lowest first)
 * - immutable — original array is not modified
 * - stable sort — equal values preserve relative order
 *
 * @throws BadRequestError if prices have different currencies
 *
 * @example
 * asIsoPriceSorted(['USD 100.00', 'USD 9.00', 'USD 50.00'])
 * // => ['USD 9.00', 'USD 50.00', 'USD 100.00']
 *
 * @example
 * asIsoPriceSorted(['USD 100.00', 'USD 9.00'], { order: 'desc' })
 * // => ['USD 100.00', 'USD 9.00']
 */
const _asIsoPriceSorted = <TCurrency extends string = string>(
  prices: (IsoPrice<TCurrency> | string)[],
  options?: { order?: 'asc' | 'desc' },
): IsoPriceWords<TCurrency>[] => {
  // handle empty array
  if (prices.length === 0) return [];

  // convert all prices to words with original index for stable sort
  const wordsWithIndex = prices.map((price, originalIndex) => ({
    words: asIsoPriceWords<TCurrency>(price as IsoPrice<TCurrency>),
    originalIndex,
  }));

  // handle single element — return new array with single element
  if (wordsWithIndex.length === 1) {
    return [wordsWithIndex[0]!.words];
  }

  // validate all prices have the same currency
  const currencies = new Set(
    wordsWithIndex.map((item) => item.words.split(' ')[0]),
  );
  if (currencies.size > 1) {
    throw new BadRequestError('cannot sort prices with different currencies', {
      currencies: Array.from(currencies),
    });
  }

  // determine sort order
  const order = options?.order ?? 'asc';

  // sort with stable comparison
  wordsWithIndex.sort((a, b) => {
    // compute numeric difference
    const diff = subPrices(a.words, b.words, { format: 'shape' });

    // if equal, preserve original order (stable sort)
    if (diff.amount === 0n) {
      return a.originalIndex - b.originalIndex;
    }

    // sort by numeric value
    const isNegative = diff.amount < 0n;
    return order === 'asc' ? (isNegative ? -1 : 1) : isNegative ? 1 : -1;
  });

  // return sorted words array
  return wordsWithIndex.map((item) => item.words);
};

/**
 * .what = sorts prices in asc order
 * .why = provides explicit asc method variant
 */
const asc = <TCurrency extends string = string>(
  prices: (IsoPrice<TCurrency> | string)[],
): IsoPriceWords<TCurrency>[] => _asIsoPriceSorted(prices, { order: 'asc' });

/**
 * .what = sorts prices in desc order
 * .why = provides explicit desc method variant
 */
const desc = <TCurrency extends string = string>(
  prices: (IsoPrice<TCurrency> | string)[],
): IsoPriceWords<TCurrency>[] => _asIsoPriceSorted(prices, { order: 'desc' });

/**
 * .what = export with attached method variants
 * .why = enables both asIsoPriceSorted(prices) and asIsoPriceSorted.asc(prices)
 */
export const asIsoPriceSorted = Object.assign(_asIsoPriceSorted, {
  asc,
  desc,
});
