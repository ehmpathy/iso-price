import { given, then, when } from 'test-fns';

import { Currency } from '@src/domain.objects/constants/Currency';
import { Price } from '@src/domain.objects/Price';

import { asPriceWord } from './asPriceWord';

describe('asPriceWord', () => {
  given('a $821.12 price', () => {
    const price = new Price({ amount: 82112, currency: Currency.USD });
    when('casting', () => {
      then('it should return $821.12', () => {
        expect(asPriceWord(price)).toBe('$821.12');
      });
    });
    when('casting with option.cents enabled', () => {
      then('it should return $821.12', () => {
        expect(asPriceWord(price, { cents: true })).toBe('$821.12');
      });
    });
    when('casting with option.cents disabled', () => {
      then('it should return $821', () => {
        expect(asPriceWord(price, { cents: false })).toBe('$821');
      });
    });
  });
});
