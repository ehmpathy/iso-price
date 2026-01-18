import { UnexpectedCodePathError } from 'helpful-errors';

import { Price } from '@src/domain.objects/Price';

export const calcPriceSubtraction = (...input: [Price, Price]): Price => {
  if (input[0].currency !== input[1].currency)
    throw new UnexpectedCodePathError(
      'can not subtract prices across different currencies',
      { input },
    );

  // and return the total price
  return new Price({
    amount: input[0].amount - input[1].amount,
    currency: input[0].currency,
  });
};

export {
  calcPriceSubtraction as subPrices,
  calcPriceSubtraction as calcPriceSub,
};
