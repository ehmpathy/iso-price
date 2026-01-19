import { BadRequestError } from 'helpful-errors';

import type { IsoPriceWords } from '../../domain.objects/IsoPriceWords';

/**
 * .what = regex pattern for valid iso-price words format
 * .why = validates `{CURRENCY_CODE} {AMOUNT}` pattern
 *
 * pattern breakdown:
 * - `^[A-Z]{3}` — 3 uppercase letters for currency code
 * - ` ` — single space separator
 * - `-?` — optional negative sign
 * - `(\d+|\d{1,3}([_,]\d{3})+)` — either plain digits OR underscore/comma-separated groups
 * - `(\.(\d+|\d{1,3}([_,]\d{3})+))?$` — optional decimal point with underscore/comma-separated digits
 *
 * accepts both commas and underscores for input convenience; output uses underscores
 */
const WORDS_PATTERN =
  /^[A-Z]{3} -?(\d+|\d{1,3}([_,]\d{3})+)(\.(\d+|\d{1,3}([_,]\d{3})+))?$/;

/**
 * .what = type guard for IsoPriceWords format
 * .why = validates strings match the `{CURRENCY_CODE} {AMOUNT}` pattern
 *
 * valid examples:
 * - 'USD 50.37'
 * - 'USD 1_000_000.00'
 * - 'USD 1,000,000.00' (commas accepted, normalized to underscores on output)
 * - 'EUR 0.000003'
 * - 'JPY 1000'
 *
 * invalid examples:
 * - '$50.37' (symbol instead of code)
 * - 'usd 50.37' (lowercase currency)
 */
export const isIsoPriceWords = (value: unknown): value is IsoPriceWords => {
  if (typeof value !== 'string') return false;
  return WORDS_PATTERN.test(value);
};

/**
 * .what = assertion function that throws on invalid input
 * .why = enables fail-fast validation with helpful error messages
 */
isIsoPriceWords.assure = (value: unknown): asserts value is IsoPriceWords => {
  if (!isIsoPriceWords(value))
    throw new BadRequestError('value is not a valid IsoPriceWords', { value });
};
