import { DomainLiteral } from 'domain-objects';
import Joi from 'joi';
import type { Literalize } from 'type-fns';

import { Currency } from './constants/Currency';

const schema = Joi.object().keys({
  amount: Joi.number().min(0).required(),
  currency: Joi.string()
    .valid(...Object.values(Currency))
    .required(),
});

/**
 * specifies a price
 *
 * def: price
 * > the amount of money expected, required, or given in payment for something.
 *
 * note
 * - amount is specified in terms of the lowest unit in the currency
 *   - i.e., always an integer to avoid [floating point sillyness](https://wiki.sei.cmu.edu/confluence/display/c/FLP02-C.+Avoid+using+floating-point+numbers+when+precise+computation+is+needed)
 *   - i.e., matches the pattern set forth by Stripe
 *   - e.g., cents for USD
 * - amount can be negative -> money is moved from "seller" (a.k.a. us) to "buyer"
 *   - used to support discounts, credits, or refunds
 *   - may feel like an odd concept, but negative pricing is a concept which apparently doesn't have a better name yet broadly 🤷
 *     - https://en.wikipedia.org/wiki/Negative_pricing
 */
export interface Price {
  id?: number; // included to support generating dao
  amount: number;
  currency: Literalize<Currency>;
}

export class Price extends DomainLiteral<Price> implements Price {
  public static schema = schema;
}
