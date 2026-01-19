import { BadRequestError } from 'helpful-errors';

import type { IsoPriceShape } from '../../domain.objects/IsoPriceShape';

/**
 * .what = type guard for IsoPriceShape format
 * .why = validates objects have the required shape properties
 *
 * required:
 * - amount: bigint
 * - currency: string
 *
 * optional:
 * - exponent: string (IsoPriceExponent value)
 *
 * valid examples:
 * - { amount: 5037n, currency: 'USD' }
 * - { amount: 3n, currency: 'USD', exponent: 'micro.x10^-6' }
 *
 * invalid examples:
 * - { amount: 5037, currency: 'USD' } (number instead of bigint)
 * - { amount: 5037n } (currency absent)
 * - 'USD 50.37' (string instead of object)
 */
export const isIsoPriceShape = (value: unknown): value is IsoPriceShape => {
  // must be an object
  if (typeof value !== 'object' || value === null) return false;

  const obj = value as Record<string, unknown>;

  // amount must be bigint
  if (typeof obj.amount !== 'bigint') return false;

  // currency must be string
  if (typeof obj.currency !== 'string') return false;

  // exponent is optional but must be string if present
  if (obj.exponent !== undefined && typeof obj.exponent !== 'string')
    return false;

  return true;
};

/**
 * .what = assertion function that throws on invalid input
 * .why = enables fail-fast validation with helpful error messages
 */
isIsoPriceShape.assure = (value: unknown): asserts value is IsoPriceShape => {
  if (!isIsoPriceShape(value))
    throw new BadRequestError('value is not a valid IsoPriceShape', { value });
};
