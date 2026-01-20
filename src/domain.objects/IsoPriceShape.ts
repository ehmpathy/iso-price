import type { IsoPriceExponent } from './IsoPriceExponent';

/**
 * .what = structured domain literal for iso-price with bigint precision
 * .why = enables lossless arithmetic and explicit precision control
 *
 * the shape provides:
 * - `amount: bigint` — integer representation in minor units (no float precision errors)
 * - `currency: TCurrency` — iso 4217 code or custom currency string
 * - `exponent?: TExponent` — explicit precision level (defaults to currency standard)
 *
 * example:
 * ```ts
 * // $50.37 in cents (default centi.x10^-2 for USD)
 * { amount: 5037n, currency: 'USD' }
 *
 * // $0.000003 in micro-dollars (llm token cost)
 * { amount: 3n, currency: 'USD', exponent: IsoPriceExponent.MICRO }
 * ```
 *
 * @template TCurrency - the currency code type (defaults to `string`)
 */
export interface IsoPriceShape<TCurrency extends string = string> {
  /** integer amount in minor units — always bigint for precision safety */
  amount: bigint;
  /** iso 4217 currency code or custom currency string */
  currency: TCurrency;
  /** explicit precision exponent — defaults to currency standard when omitted */
  exponent?: IsoPriceExponent;
}
