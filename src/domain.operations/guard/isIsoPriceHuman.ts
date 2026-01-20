import { BadRequestError } from 'helpful-errors';

import type { IsoPriceHuman } from '../../domain.objects/IsoPriceHuman';

/**
 * .what = common currency symbols for human-readable price formats
 * .why = validates that the string contains a currency symbol (not a code)
 */
const CURRENCY_SYMBOLS = [
  '$', // USD, CAD, AUD, etc.
  '€', // EUR
  '£', // GBP
  '¥', // JPY, CNY
  '₹', // INR
  '₽', // RUB
  '₩', // KRW
  '₪', // ILS
  '฿', // THB
  '₫', // VND
  'kr', // SEK, NOK, DKK
  'R', // ZAR, BRL
  'zł', // PLN
  'Kč', // CZK
  'CHF', // note: CHF is a code but used as-is in human format
];

/**
 * .what = regex pattern for human-readable price format
 * .why = matches symbol-prefix or symbol-suffix patterns with optional separators
 *
 * examples:
 * - '$50.37' (symbol prefix)
 * - '€1,000.00' (symbol prefix with commas)
 * - '100 €' (symbol suffix, european style)
 * - '¥1,000' (no decimals)
 */
const hasSymbolPrefix = (value: string): boolean => {
  return CURRENCY_SYMBOLS.some((symbol) => value.startsWith(symbol));
};

const hasSymbolSuffix = (value: string): boolean => {
  return CURRENCY_SYMBOLS.some(
    (symbol) => value.endsWith(symbol) || value.endsWith(` ${symbol}`),
  );
};

/**
 * .what = type guard for IsoPriceHuman format
 * .why = validates strings match the symbol-based human-readable pattern
 *
 * valid examples:
 * - '$50.37'
 * - '€50.37'
 * - '¥1,000'
 * - '$1,000,000.00'
 * - '100 €' (suffix position)
 *
 * invalid examples:
 * - 'USD 50.37' (code-prefix is words format, not human)
 * - '50.37' (no symbol)
 * - { amount: 5037n, currency: 'USD' } (object, not string)
 */
export const isIsoPriceHuman = (value: unknown): value is IsoPriceHuman => {
  if (typeof value !== 'string') return false;

  // must not be words format (code-prefix pattern)
  if (/^[A-Z]{3} /.test(value)) return false;

  // must have a currency symbol (prefix or suffix)
  return hasSymbolPrefix(value) || hasSymbolSuffix(value);
};

/**
 * .what = assertion function that throws on invalid input
 * .why = enables fail-fast validation with helpful error messages
 */
isIsoPriceHuman.assure = (value: unknown): asserts value is IsoPriceHuman => {
  if (!isIsoPriceHuman(value))
    throw new BadRequestError('value is not a valid IsoPriceHuman', { value });
};
