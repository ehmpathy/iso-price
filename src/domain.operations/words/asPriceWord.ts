import type { Price } from '@src/domain.objects/Price';

export const asPriceWord = (
  price: Price,
  options: { cents?: boolean } = { cents: true },
): string => {
  const string = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: price.currency,
  }).format(price.amount / 100);
  if (!options.cents) return string.split('.')[0]!;
  return string;
};

export { asPriceWord as castPriceToWord };
