import type { IsoPrice } from './IsoPrice';
import type { IsoPriceHuman } from './IsoPriceHuman';
import type { IsoPriceShape } from './IsoPriceShape';
import type { IsoPriceWords } from './IsoPriceWords';

describe('IsoPrice', () => {
  const VARIANT_CASES = [
    {
      description: 'words variant',
      given: { input: 'USD 50.37' as IsoPriceWords },
      expect: { output: 'USD 50.37' },
    },
    {
      description: 'shape variant',
      given: { input: { amount: 5037n, currency: 'USD' } as IsoPriceShape },
      expect: { output: { amount: 5037n, currency: 'USD' } },
    },
    {
      description: 'human variant',
      given: { input: '$50.37' as IsoPriceHuman },
      expect: { output: '$50.37' },
    },
  ];

  VARIANT_CASES.forEach(({ description, given, expect: expected }) => {
    test(`union accepts ${description}`, () => {
      const price: IsoPrice = given.input;
      expect(price).toEqual(expected.output);
    });
  });

  test('union is parameterized by currency', () => {
    const usdWords: IsoPriceWords<'USD'> = 'USD 50.37' as IsoPriceWords<'USD'>;
    const usdShape: IsoPriceShape<'USD'> = { amount: 5037n, currency: 'USD' };

    const price1: IsoPrice<'USD'> = usdWords;
    const price2: IsoPrice<'USD'> = usdShape;

    expect(price1).toEqual('USD 50.37');
    expect(price2).toEqual({ amount: 5037n, currency: 'USD' });
  });

  test('all three variants can be stored in array of IsoPrice', () => {
    const prices: IsoPrice[] = [
      'USD 50.37' as IsoPriceWords,
      { amount: 5037n, currency: 'USD' },
      '$50.37' as IsoPriceHuman,
    ];

    expect(prices).toHaveLength(3);
  });
});
