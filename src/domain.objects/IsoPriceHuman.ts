import type { AsOfGlossary } from 'domain-glossaries';

/**
 * .what = branded type for iso-price in human-readable format
 * .why = ensures type safety for price strings with currency symbols like '$50.37'
 *
 * format: `{SYMBOL}{AMOUNT}` or `{AMOUNT} {SYMBOL}` (locale-dependent)
 * - symbol: currency symbol (e.g., '$', '€', '¥', '£')
 * - amount: numeric with optional comma separators and decimal point
 *
 * examples:
 * - '$50.37'
 * - '€1,000,000.00'
 * - '¥1,000'
 * - '100 €' (suffix position, some locales)
 *
 * note: this is a LOSSY format — symbols are ambiguous ($ could be USD, CAD, AUD, etc)
 * use IsoPriceWords for unambiguous storage and serialization
 */
export type IsoPriceHuman = AsOfGlossary<string, 'iso-price-human'>;
