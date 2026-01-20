import { IsoPriceExponent } from '../../domain.objects/IsoPriceExponent';

/**
 * .what = currency codes that use whole units (no decimals)
 * .why = JPY, KRW, VND, IDR have no minor units per iso 4217
 */
const WHOLE_UNIT_CURRENCIES = new Set([
  'JPY',
  'KRW',
  'VND',
  'IDR',
  'CLP',
  'PYG',
  'UGX',
]);

/**
 * .what = currency codes that use 3 decimal places
 * .why = BHD, KWD, OMR, TND have fils/baisa (1/1000) per iso 4217
 */
const MILLI_UNIT_CURRENCIES = new Set(['BHD', 'KWD', 'OMR', 'TND']);

/**
 * .what = returns the standard iso 4217 exponent for a currency
 * .why = enables correct precision per currency standard
 *
 * defaults to centi.x10^-2 for unknown currencies, as >95% of currencies
 * use 2 decimal places (cents).
 *
 * @example
 * getIsoPriceExponentByCurrency('USD')  // => 'centi.x10^-2'
 * getIsoPriceExponentByCurrency('JPY')  // => 'whole.x10^0'
 * getIsoPriceExponentByCurrency('BHD')  // => 'milli.x10^-3'
 * getIsoPriceExponentByCurrency('BTC')  // => 'centi.x10^-2' (default)
 */
export const getIsoPriceExponentByCurrency = (
  currency: string,
): IsoPriceExponent => {
  // check for whole unit currencies (0 decimal places)
  if (WHOLE_UNIT_CURRENCIES.has(currency)) {
    return IsoPriceExponent.WHOLE;
  }

  // check for milli unit currencies (3 decimal places)
  if (MILLI_UNIT_CURRENCIES.has(currency)) {
    return IsoPriceExponent.MILLI;
  }

  // default to centi (2 decimal places) — covers >95% of currencies
  return IsoPriceExponent.CENTI;
};
