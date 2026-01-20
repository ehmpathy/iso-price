import { BadRequestError } from 'helpful-errors';

import type { IsoPrice } from '../../domain.objects/IsoPrice';
import { IsoPriceExponent } from '../../domain.objects/IsoPriceExponent';
import type { IsoPriceShape } from '../../domain.objects/IsoPriceShape';
import { isIsoPriceHuman } from '../guard/isIsoPriceHuman';
import { isIsoPriceWords } from '../guard/isIsoPriceWords';
import { getIsoPriceExponentByCurrency } from '../precision/getIsoPriceExponentByCurrency';

/**
 * .what = currency symbol to code mappings
 * .why = enables conversion from human format symbols to iso 4217 codes
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
 * .what = parses amount string to bigint in minor units
 * .why = converts decimal string like '50.37' to bigint 5037n
 */
const parseAmountToMinorUnits = (input: {
  amountStr: string;
  exponent: IsoPriceExponent;
}): { amount: bigint; exponent: IsoPriceExponent } => {
  const { amountStr, exponent } = input;
  // get the decimal places for this exponent
  const decimalPlaces = Math.abs(parseInt(exponent.split('^')[1] ?? '-2', 10));

  // clean the string: remove underscores and commas
  const cleaned = amountStr.replace(/[_,]/g, '');

  // split into integer and decimal parts
  const [intPart, decPart = ''] = cleaned.split('.');

  // pad or truncate decimal part to match exponent
  const paddedDecimal = decPart.padEnd(decimalPlaces, '0');
  const truncatedDecimal = paddedDecimal.slice(0, decimalPlaces);

  // detect if we need higher precision
  if (decPart.length > decimalPlaces) {
    // use the actual decimal length to determine exponent
    const actualDecPlaces = decPart.length;
    const exponentMap: Record<number, IsoPriceExponent> = {
      0: IsoPriceExponent.WHOLE,
      2: IsoPriceExponent.CENTI,
      3: IsoPriceExponent.MILLI,
      6: IsoPriceExponent.MICRO,
      9: IsoPriceExponent.NANO,
      12: IsoPriceExponent.PICO,
    };
    // find the smallest exponent that fits
    const newExponent =
      Object.entries(exponentMap)
        .filter(([places]) => parseInt(places) >= actualDecPlaces)
        .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))[0]?.[1] ??
      IsoPriceExponent.PICO;

    const newDecPlaces = Math.abs(
      parseInt(newExponent.split('^')[1] ?? '-2', 10),
    );
    const fullDecimal = decPart.padEnd(newDecPlaces, '0');

    return {
      amount: BigInt(`${intPart ?? '0'}${fullDecimal}`),
      exponent: newExponent,
    };
  }

  // combine integer and decimal parts
  const combined = `${intPart ?? '0'}${truncatedDecimal}`;
  return {
    amount: BigInt(combined),
    exponent,
  };
};

/**
 * .what = extracts currency code and amount from words format
 * .why = parses 'USD 50.37' into { currency: 'USD', amount: '50.37' }
 */
const parseWordsFormat = (input: {
  value: string;
}): { currency: string; amountStr: string } => {
  const match = input.value.match(/^([A-Z]{3}) (.+)$/);
  if (!match)
    throw new BadRequestError('invalid words format', { value: input.value });
  return { currency: match[1]!, amountStr: match[2]! };
};

/**
 * .what = relaxed pattern for words-like format that may have commas
 * .why = enables asIsoPrice to normalize 'USD 1,000,000.00' → 'USD 1_000_000.00'
 *
 * this pattern accepts commas for input convenience; isIsoPriceWords is stricter
 */
const isWordsLikeFormat = (value: unknown): value is string => {
  if (typeof value !== 'string') return false;
  return /^[A-Z]{3} -?[\d,_.]+$/.test(value);
};

/**
 * .what = extracts currency code and amount from human format
 * .why = parses '$50.37' or '50.37 €' into { currency: 'USD', amount: '50.37' }
 */
const parseHumanFormat = (
  input: { value: string },
  options?: { currency?: string },
): { currency: string; amountStr: string } => {
  // try prefix symbols
  for (const [symbol, code] of Object.entries(SYMBOL_TO_CODE)) {
    if (input.value.startsWith(symbol)) {
      const amountStr = input.value.slice(symbol.length);
      const currency = options?.currency ?? code;
      return { currency, amountStr };
    }
  }

  // try suffix symbols
  for (const [symbol, code] of Object.entries(SYMBOL_TO_CODE)) {
    if (input.value.endsWith(symbol) || input.value.endsWith(` ${symbol}`)) {
      const amountStr = input.value.replace(
        new RegExp(`\\s*${symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`),
        '',
      );
      const currency = options?.currency ?? code;
      return { currency, amountStr };
    }
  }

  throw new BadRequestError('unable to parse human format', {
    value: input.value,
  });
};

/**
 * .what = converts any IsoPrice format to IsoPriceShape
 * .why = enables uniform representation as shape for arithmetic operations
 *
 * @example
 * asIsoPriceShape('USD 50.37')
 * // => { amount: 5037n, currency: 'USD' }
 *
 * @example
 * asIsoPriceShape({ amount: 5037, currency: 'USD' })
 * // => { amount: 5037n, currency: 'USD' }  // number → bigint
 *
 * @example
 * asIsoPriceShape('$50.37')
 * // => { amount: 5037n, currency: 'USD' }
 */
export const asIsoPriceShape = <TCurrency extends string = string>(
  input:
    | IsoPrice<TCurrency>
    | {
        amount: number | bigint;
        currency: TCurrency;
        exponent?: IsoPriceExponent;
      }
    | string,
  options?: { currency?: TCurrency },
): IsoPriceShape<TCurrency> => {
  // handle shape format (may need number → bigint conversion)
  if (
    typeof input === 'object' &&
    input !== null &&
    'amount' in input &&
    'currency' in input
  ) {
    const amount =
      typeof input.amount === 'bigint' ? input.amount : BigInt(input.amount);
    // always include exponent for observability and recomposition
    const exponent =
      (input.exponent as IsoPriceExponent) ??
      getIsoPriceExponentByCurrency(input.currency);
    return {
      amount,
      currency: input.currency as TCurrency,
      exponent,
    };
  }

  // handle words format (strict) or words-like format with commas (relaxed)
  if (isIsoPriceWords(input) || isWordsLikeFormat(input)) {
    const { currency, amountStr } = parseWordsFormat({ value: input });
    const currencyExponent = getIsoPriceExponentByCurrency(currency);
    const { amount, exponent } = parseAmountToMinorUnits({
      amountStr,
      exponent: currencyExponent,
    });
    // always include exponent for observability and recomposition
    return {
      amount,
      currency: currency as TCurrency,
      exponent,
    };
  }

  // handle human format
  if (isIsoPriceHuman(input)) {
    const { currency, amountStr } = parseHumanFormat({ value: input }, options);
    const currencyExponent = getIsoPriceExponentByCurrency(currency);
    const { amount, exponent } = parseAmountToMinorUnits({
      amountStr,
      exponent: currencyExponent,
    });
    // always include exponent for observability and recomposition
    return {
      amount,
      currency: currency as TCurrency,
      exponent,
    };
  }

  throw new BadRequestError('unable to convert to IsoPriceShape', { input });
};
