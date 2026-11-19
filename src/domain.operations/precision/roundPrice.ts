import type { IsoPrice } from '@src/domain.objects/IsoPrice';
import type { IsoPriceExponent } from '@src/domain.objects/IsoPriceExponent';
import type { IsoPriceRoundMode } from '@src/domain.objects/IsoPriceRoundMode';
import type { IsoPriceWords } from '@src/domain.objects/IsoPriceWords';

import { setPricePrecision } from './setPricePrecision';

/**
 * .what = rounds a price to a target precision
 * .why = semantic alias for setPricePrecision when precision decrease is intended
 *
 * this is syntactic sugar for the common case of a precision reduction.
 * use setPricePrecision directly if you need to increase precision.
 *
 * @example
 * roundPrice({ of: 'USD 50.375', to: 'centi.x10^-2' })
 * // => 'USD 50.38' (default half-up)
 *
 * @example
 * roundPrice({ of: 'USD 50.375', to: 'centi.x10^-2' }, { round: 'floor' })
 * // => 'USD 50.37'
 */
export const roundPrice = <TCurrency extends string = string>(
  input: {
    of: IsoPrice<TCurrency> | string;
    to: IsoPriceExponent;
  },
  options?: { round?: IsoPriceRoundMode },
): IsoPriceWords<TCurrency> => {
  return setPricePrecision(input, options);
};
