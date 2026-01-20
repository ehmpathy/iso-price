import type { IsoPrice } from '../../domain.objects/IsoPrice';
import { IsoPriceExponent } from '../../domain.objects/IsoPriceExponent';
import type { IsoPriceHuman } from '../../domain.objects/IsoPriceHuman';
import { getIsoPriceExponentByCurrency } from '../precision/getIsoPriceExponentByCurrency';
import { asIsoPriceShape } from './asIsoPriceShape';

/**
 * .what = currency code to symbol mappings
 * .why = enables conversion from iso 4217 codes to display symbols
 */
const CODE_TO_SYMBOL: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CNY: '¥',
  INR: '₹',
  RUB: '₽',
  KRW: '₩',
  ILS: '₪',
  THB: '฿',
  VND: '₫',
  SEK: 'kr',
  NOK: 'kr',
  DKK: 'kr',
  ZAR: 'R',
  BRL: 'R$',
  PLN: 'zł',
  CZK: 'Kč',
  CHF: 'CHF',
};

/**
 * .what = gets the decimal places for an exponent
 * .why = determines how to format the amount string
 */
const getDecimalPlaces = (exponent: IsoPriceExponent | string): number => {
  const match = exponent.match(/\^(-?\d+)$/);
  if (!match) return 2;
  return Math.abs(parseInt(match[1]!, 10));
};

/**
 * .what = formats a bigint amount to human-readable string with commas
 * .why = converts 5037n with exponent 2 to '50.37'
 */
const formatAmountHuman = (
  amount: bigint,
  exponent: IsoPriceExponent | string = IsoPriceExponent.CENTI,
): string => {
  const decimalPlaces = getDecimalPlaces(exponent);
  const isNegative = amount < 0n;
  const absAmount = isNegative ? -amount : amount;

  // handle zero decimal places (whole units like JPY)
  if (decimalPlaces === 0) {
    const formattedInt = absAmount
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return isNegative ? `-${formattedInt}` : formattedInt;
  }

  // convert to string and pad with zeros at start if needed
  const amountStr = absAmount.toString().padStart(decimalPlaces + 1, '0');

  // split into integer and decimal parts
  const intPart = amountStr.slice(0, -decimalPlaces) || '0';
  const decPart = amountStr.slice(-decimalPlaces);

  // format integer part with comma thousands separators (human format)
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  // build the result
  const sign = isNegative ? '-' : '';

  // for whole numbers at centi precision, show .00
  if (decPart === '00' && decimalPlaces === 2) {
    return `${sign}${formattedInt}.00`;
  }

  // omit zeros at end of decimal part for higher precision
  const trimmedDec = decPart.replace(/0+$/, '');
  if (trimmedDec.length === 0 && decimalPlaces > 2) {
    return `${sign}${formattedInt}`;
  }

  return `${sign}${formattedInt}.${decPart}`;
};

/**
 * .what = converts any IsoPrice format to IsoPriceHuman (symbol format)
 * .why = enables human-readable display with currency symbols
 *
 * @example
 * asIsoPriceHuman('USD 50.37')
 * // => '$50.37'
 *
 * @example
 * asIsoPriceHuman({ amount: 5037n, currency: 'USD' })
 * // => '$50.37'
 *
 * @example
 * asIsoPriceHuman('USD 1_000_000.00')
 * // => '$1,000,000.00'
 */
export const asIsoPriceHuman = <TCurrency extends string = string>(
  input:
    | IsoPrice<TCurrency>
    | { amount: number | bigint; currency: TCurrency; exponent?: string }
    | string,
  options?: { currency?: TCurrency },
): IsoPriceHuman => {
  // convert to shape first
  const shape = asIsoPriceShape(input, options);

  // get the symbol for this currency
  const symbol = CODE_TO_SYMBOL[shape.currency] ?? shape.currency;

  // use currency's standard exponent when shape.exponent is not set
  const exponent =
    shape.exponent ?? getIsoPriceExponentByCurrency(shape.currency);

  // format the amount with commas
  const formatted = formatAmountHuman(shape.amount, exponent);

  // build the human-readable string (symbol prefix)
  return `${symbol}${formatted}` as IsoPriceHuman;
};
