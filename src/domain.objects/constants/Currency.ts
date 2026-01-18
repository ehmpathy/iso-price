import { createIsOfEnum } from 'type-fns';

/**
 * an enum of ISO 4217 currency codes
 *
 * ref
 * - https://en.wikipedia.org/wiki/ISO_4217
 *
 * TODO: fill out
 */
export enum Currency {
  USD = 'USD',
}

export const isOfCurrency = createIsOfEnum(Currency);
