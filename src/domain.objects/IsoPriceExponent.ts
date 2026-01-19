/**
 * .what = enum of supported precision exponents for iso-price
 * .why = explicit exponent declarations avoid conflation between iso 4217 and scientific notation
 *
 * the `.x10^-N` suffix makes the math unambiguous:
 * - `'centi.x10^-2'` → `amount × 10^-2 = amount / 100`
 *
 * the si metric prefix provides human readability:
 * - `centi` = hundredths (cents)
 * - `milli` = thousandths (fils)
 * - `micro` = millionths (llm token costs)
 * - `nano` = billionths (serverless costs)
 * - `pico` = trillionths (extreme precision)
 */
export enum IsoPriceExponent {
  /** whole units — JPY, KRW, VND, etc */
  WHOLE = 'whole.x10^0',
  /** standard cents — USD, EUR, GBP, most currencies */
  CENTI = 'centi.x10^-2',
  /** thousandths — BHD, KWD, OMR, TND (fils/baisa) */
  MILLI = 'milli.x10^-3',
  /** millionths — llm token costs, api rates */
  MICRO = 'micro.x10^-6',
  /** billionths — serverless invocation costs */
  NANO = 'nano.x10^-9',
  /** trillionths — extreme precision, requires bigint */
  PICO = 'pico.x10^-12',
}
