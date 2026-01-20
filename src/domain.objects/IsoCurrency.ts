/**
 * .what = enum of iso 4217 currency codes for type-safe price operations
 * .why = provides compile-time safety for the most common currencies
 *
 * includes:
 * - top 21 currencies by forex trade volume (~$7 trillion daily)
 * - 4 currencies with 3-decimal exponent (BHD, KWD, OMR, TND)
 *
 * note: custom currencies (BTC, ETH, etc) are supported via string generics
 * this enum is for convenience, not restriction
 */
export enum IsoCurrency {
  // top 21 by forex trade volume

  /** US Dollar — ~90% of forex transactions */
  USD = 'USD',
  /** Euro — 20 eurozone countries */
  EUR = 'EUR',
  /** Japanese Yen — major reserve currency, 0-decimal */
  JPY = 'JPY',
  /** British Pound — London as global finance hub */
  GBP = 'GBP',
  /** Chinese Yuan — rapid growth in trade share */
  CNY = 'CNY',
  /** Australian Dollar — commodity-linked */
  AUD = 'AUD',
  /** Canadian Dollar — oil price correlation */
  CAD = 'CAD',
  /** Swiss Franc — safe-haven currency */
  CHF = 'CHF',
  /** Hong Kong Dollar — pegged to USD */
  HKD = 'HKD',
  /** New Zealand Dollar — commodity-linked */
  NZD = 'NZD',
  /** Swedish Krona — nordic economy */
  SEK = 'SEK',
  /** South Korean Won — tech export economy, 0-decimal */
  KRW = 'KRW',
  /** Singapore Dollar — asian finance hub */
  SGD = 'SGD',
  /** Norwegian Krone — oil-linked */
  NOK = 'NOK',
  /** Mexican Peso — growth market */
  MXN = 'MXN',
  /** Indian Rupee — large population economy */
  INR = 'INR',
  /** South African Rand — commodity-linked */
  ZAR = 'ZAR',
  /** Brazilian Real — growth market */
  BRL = 'BRL',
  /** Danish Krone — pegged to EUR */
  DKK = 'DKK',
  /** Polish Zloty — EU non-eurozone */
  PLN = 'PLN',
  /** Thai Baht — southeast asian economy */
  THB = 'THB',

  // 3-decimal exponent currencies (milli.x10^-3)

  /** Bahraini Dinar — 3-decimal, fils */
  BHD = 'BHD',
  /** Kuwaiti Dinar — 3-decimal, fils */
  KWD = 'KWD',
  /** Omani Rial — 3-decimal, baisa */
  OMR = 'OMR',
  /** Tunisian Dinar — 3-decimal, millimes */
  TND = 'TND',
}
