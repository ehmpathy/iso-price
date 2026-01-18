import { Price } from '@src/domain.objects/Price';

export const calcPriceDivision = (input: {
  price: Price;
  by: number;
}): Price => {
  return new Price({
    amount: input.price.amount / input.by,
    currency: input.price.currency,
  });
};

export { calcPriceDivision as dividePrice };
