import { UnexpectedCodePathError } from 'helpful-errors';

import { Price } from '@src/domain.objects/Price';

/**
 * .ref = https://stackoverflow.com/a/77664868/3068233
 */
const calcStandardDeviation = (array: number[]): number | null => {
  if (array.length < 2) return null;
  const n = array.length;
  const mean = array.reduce((a, b) => a + b) / n;
  return Math.sqrt(
    array.map((x) => (x - mean) ** 2).reduce((a, b) => a + b) / (n - 1),
  );
};

/**
 * .what = calculates the standard-deviation of the set of prices
 * .note =
 *   - this will return `null` if there are not enough prices to calculate with
 */
export const calcPriceStdev = (prices: Price[]): Price | null => {
  const priceFirst = prices[0];
  if (!priceFirst) return null;

  // verify each price is in the same currency
  const hasDiffCurrencies = prices.some(
    (price) => price.currency !== priceFirst.currency,
  );
  if (hasDiffCurrencies)
    throw new UnexpectedCodePathError(
      'different currencies found. cant calculate',
      {
        prices,
      },
    );

  // otherwise, get the total amount
  const amountStdev = calcStandardDeviation(
    prices.map((price) => price.amount),
  );

  // and return the total price
  return amountStdev === null
    ? null
    : new Price({
        amount: amountStdev,
        currency: priceFirst.currency,
      });
};
