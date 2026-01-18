import { UnexpectedCodePathError } from 'helpful-errors';

import { Price } from '@src/domain.objects/Price';

export const calcPriceSummation = (prices: Price[]): Price => {
  // if no prices, throw error, invalid request
  const priceFirst = prices[0];
  if (!priceFirst)
    throw new UnexpectedCodePathError('no prices to sum. invalid operation', {
      prices,
    });

  // verify each price is in the same currency
  const hasDiffCurrencies = prices.some(
    (price) => price.currency !== priceFirst.currency,
  );
  if (hasDiffCurrencies)
    throw new UnexpectedCodePathError('different currencies found. cant sum', {
      prices,
    });

  // otherwise, get the total amount
  const amountTotal = prices.reduce(
    (summary, thisPrice) => summary + thisPrice.amount,
    0,
  );

  // and return the total price
  return new Price({
    amount: amountTotal,
    currency: priceFirst.currency,
  });
};

export { calcPriceSummation as sumPrices, calcPriceSummation as calcPriceSum };
