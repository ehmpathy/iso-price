import type { IsoPriceHuman } from './IsoPriceHuman';
import type { IsoPriceShape } from './IsoPriceShape';
import type { IsoPriceWords } from './IsoPriceWords';

/**
 * .what = union type that accepts any iso-price format
 * .why = enables functions to accept prices in any format for convenience
 *
 * three formats:
 * - `IsoPriceWords` — code-prefixed string: 'USD 50.37' (recommended for storage)
 * - `IsoPriceShape` — structured object: { amount: 5037n, currency: 'USD' }
 * - `IsoPriceHuman` — symbol-prefixed string: '$50.37' (for display and quick input)
 *
 * @template TCurrency - the currency code type (defaults to `string`)
 */
export type IsoPrice<TCurrency extends string = string> =
  | IsoPriceWords<TCurrency>
  | IsoPriceShape<TCurrency>
  | IsoPriceHuman;
