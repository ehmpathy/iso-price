import type { IsoPrice } from '../../domain.objects/IsoPrice';
import { IsoPriceExponent } from '../../domain.objects/IsoPriceExponent';
import type { IsoPriceWords } from '../../domain.objects/IsoPriceWords';
import { isIsoPriceWords } from '../guard/isIsoPriceWords';
import { getIsoPriceExponentByCurrency } from '../precision/getIsoPriceExponentByCurrency';
import { asIsoPriceShape } from './asIsoPriceShape';

/**
 * .what = gets the decimal places for an exponent
 * .why = determines how to format the amount string
 */
const getDecimalPlaces = (exponent: IsoPriceExponent): number => {
  const match = exponent.match(/\^(-?\d+)$/);
  if (!match) return 2; // default to 2 decimal places
  return Math.abs(parseInt(match[1]!, 10));
};

/**
 * .what = formats the decimal part with underscore separators for high precision
 * .why = improves readability of micro/nano/pico precision amounts
 */
const formatDecimalPart = (decPart: string): string => {
  // for 3+ digit decimals, add underscore separators every 3 digits from left
  if (decPart.length > 3) {
    const groups: string[] = [];
    for (let i = 0; i < decPart.length; i += 3) {
      groups.push(decPart.slice(i, i + 3));
    }
    return groups.join('_');
  }
  return decPart;
};

/**
 * .what = formats a bigint amount to a decimal string with underscores
 * .why = converts 5037n with exponent 2 to '50.37'
 */
const formatAmount = (
  amount: bigint,
  exponent: IsoPriceExponent = IsoPriceExponent.CENTI,
): string => {
  const decimalPlaces = getDecimalPlaces(exponent);
  const isNegative = amount < 0n;
  const absAmount = isNegative ? -amount : amount;

  // handle zero decimal places (whole units like JPY)
  if (decimalPlaces === 0) {
    const formattedInt = absAmount
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, '_');
    return isNegative ? `-${formattedInt}` : formattedInt;
  }

  // convert to string and pad with zeros at start if needed
  const amountStr = absAmount.toString().padStart(decimalPlaces + 1, '0');

  // split into integer and decimal parts
  const intPart = amountStr.slice(0, -decimalPlaces) || '0';
  const decPart = amountStr.slice(-decimalPlaces);

  // format integer part with underscore thousands separators
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '_');

  // build the result
  const sign = isNegative ? '-' : '';

  // for centi (2 decimal places), trim zeros at end but keep at least .00
  if (decimalPlaces === 2) {
    const trimmedDec = decPart.replace(/0+$/, '');
    if (trimmedDec.length === 0) {
      return `${sign}${formattedInt}.00`;
    }
    return `${sign}${formattedInt}.${trimmedDec.padEnd(2, '0')}`;
  }

  // for higher precision, preserve full precision with underscore separators
  const formattedDec = formatDecimalPart(decPart);
  return `${sign}${formattedInt}.${formattedDec}`;
};

/**
 * .what = converts any IsoPrice format to IsoPriceWords
 * .why = enables uniform representation as words for serialization
 *
 * @example
 * asIsoPriceWords({ amount: 5037n, currency: 'USD' })
 * // => 'USD 50.37'
 *
 * @example
 * asIsoPriceWords('$50.37')
 * // => 'USD 50.37'
 *
 * @example
 * asIsoPriceWords({ amount: 1000000n, currency: 'USD' })
 * // => 'USD 10_000.00'
 */
export const asIsoPriceWords = <TCurrency extends string = string>(
  input:
    | IsoPrice<TCurrency>
    | {
        amount: number | bigint;
        currency: TCurrency;
        exponent?: IsoPriceExponent;
      }
    | string,
  options?: { currency?: TCurrency },
): IsoPriceWords<TCurrency> => {
  // if already words format, normalize it (replace commas with underscores)
  if (isIsoPriceWords(input)) {
    // re-parse to ensure consistent format
    const shape = asIsoPriceShape(input);
    // use currency's standard exponent when shape.exponent is not set
    const exponent =
      shape.exponent ?? getIsoPriceExponentByCurrency(shape.currency);
    const formatted = formatAmount(shape.amount, exponent);
    return `${shape.currency} ${formatted}` as IsoPriceWords<TCurrency>;
  }

  // convert to shape first, then format
  const shape = asIsoPriceShape(input, options);
  // use currency's standard exponent when shape.exponent is not set
  const exponent =
    shape.exponent ?? getIsoPriceExponentByCurrency(shape.currency);
  const formatted = formatAmount(shape.amount, exponent);
  return `${shape.currency} ${formatted}` as IsoPriceWords<TCurrency>;
};
