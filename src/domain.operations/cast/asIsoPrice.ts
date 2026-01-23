import { BadRequestError } from 'helpful-errors';

import type { IsoPrice } from '../../domain.objects/IsoPrice';
import type { IsoPriceExponent } from '../../domain.objects/IsoPriceExponent';
import type { IsoPriceWords } from '../../domain.objects/IsoPriceWords';
import { isIsoPriceHuman } from '../guard/isIsoPriceHuman';
import { asIsoPriceSorted } from './asIsoPriceSorted';
import { asIsoPriceWords } from './asIsoPriceWords';

/**
 * .what = currency symbol to code mappings
 * .why = validates symbol/currency consistency
 */
const SYMBOL_TO_CODE: Record<string, string> = {
  $: 'USD',
  '€': 'EUR',
  '£': 'GBP',
  '¥': 'JPY',
  '₹': 'INR',
  '₽': 'RUB',
  '₩': 'KRW',
  '₪': 'ILS',
  '฿': 'THB',
  '₫': 'VND',
  kr: 'SEK',
  R: 'ZAR',
  zł: 'PLN',
  Kč: 'CZK',
  CHF: 'CHF',
};

/**
 * .what = currencies that have unique, unambiguous symbols
 * .why = throw on currency override if the target has a different unique symbol
 *
 * when a currency has a unique symbol (like EUR → €), a different input
 * symbol (like $) with that currency is a clear mismatch.
 *
 * see `define.currency-symbols-lossy.md` for why symbols are ambiguous
 */
const UNIQUE_SYMBOL_CURRENCIES: Record<string, string> = {
  EUR: '€',
  // note: most other currencies share symbols ($ used by USD/CAD/AUD, etc.)
  // so we only list currencies with truly unique symbols here
};

/**
 * .what = detects the symbol used in a human format string
 * .why = enables symbol/currency mismatch detection
 */
const detectSymbol = (value: string): string | null => {
  for (const symbol of Object.keys(SYMBOL_TO_CODE)) {
    if (
      value.startsWith(symbol) ||
      value.endsWith(symbol) ||
      value.endsWith(` ${symbol}`)
    ) {
      return symbol;
    }
  }
  return null;
};

/**
 * .what = normalizes any price input to IsoPriceWords format
 * .why = provides a single entry point for price conversion
 *
 * this is the recommended entry point for all price conversion:
 * - accepts human format: '$50.37', '€100.00'
 * - accepts words format: 'USD 50.37', 'EUR 100.00'
 * - accepts shape format: { amount: 5037n, currency: 'USD' }
 * - normalizes commas to underscores in output
 *
 * @example
 * asIsoPrice('$50.37')
 * // => 'USD 50.37'
 *
 * @example
 * asIsoPrice('$50.37', { currency: 'CAD' })
 * // => 'CAD 50.37'
 *
 * @example
 * asIsoPrice('€50.37', { currency: 'USD' })
 * // throws BadRequestError (symbol/currency mismatch)
 *
 * @example
 * asIsoPrice('USD 1,000,000.00')
 * // => 'USD 1_000_000.00'
 */
export const asIsoPrice = <TCurrency extends string = string>(
  input:
    | IsoPrice<TCurrency>
    | string
    | {
        amount: number | bigint;
        currency: TCurrency;
        exponent?: IsoPriceExponent;
      },
  options?: { currency?: TCurrency },
): IsoPriceWords<TCurrency> => {
  // validate symbol/currency consistency for human format
  if (typeof input === 'string' && isIsoPriceHuman(input)) {
    const symbol = detectSymbol(input);
    if (symbol && options?.currency) {
      const expectedCode = SYMBOL_TO_CODE[symbol];
      // check if input symbol belongs to a unique-symbol currency
      const expectedUniqueSymbol = expectedCode
        ? UNIQUE_SYMBOL_CURRENCIES[expectedCode]
        : undefined;
      // check if override currency has a unique symbol
      const targetUniqueSymbol = UNIQUE_SYMBOL_CURRENCIES[options.currency];

      // if input symbol is unique to a currency, override must match that currency
      // e.g., €50.37 + USD → throw (€ uniquely identifies EUR)
      if (expectedUniqueSymbol && expectedCode !== options.currency) {
        throw new BadRequestError('symbol/currency mismatch', {
          symbol,
          expectedCode,
          providedCurrency: options.currency,
        });
      }

      // if target currency has a unique symbol that differs from input, throw
      // e.g., $50.37 + EUR → throw (EUR requires €, not $)
      if (targetUniqueSymbol && targetUniqueSymbol !== symbol) {
        throw new BadRequestError('symbol/currency mismatch', {
          symbol,
          expectedCode,
          providedCurrency: options.currency,
        });
      }
    }
  }

  return asIsoPriceWords(input as IsoPrice<TCurrency>, options);
};

/**
 * .what = sorts an array of prices by numeric value
 * .why = provides correct numeric sort instead of lexicographic string sort
 */
asIsoPrice.sorted = asIsoPriceSorted;
