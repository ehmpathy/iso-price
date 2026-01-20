import type { AsOfGlossary } from 'domain-glossaries';

/**
 * .what = branded type for iso-price in words format
 * .why = ensures type safety for price strings like 'USD 50.37'
 *
 * format: `{CURRENCY} {AMOUNT}`
 * - currency: 3-letter iso 4217 code (e.g., 'USD', 'EUR', 'JPY')
 * - amount: numeric with optional underscore separators and decimal point
 *
 * examples:
 * - 'USD 50.37'
 * - 'EUR 1_000_000.00'
 * - 'JPY 1_000'
 * - 'USD 0.000_003'
 *
 * note: commas are NOT valid in words format (use underscore separators)
 *
 * @template TCurrency - the currency code (defaults to `string` for any currency)
 */
export type IsoPriceWords<TCurrency extends string = string> = AsOfGlossary<
  `${TCurrency} ${string}`,
  'iso-price-words'
>;
