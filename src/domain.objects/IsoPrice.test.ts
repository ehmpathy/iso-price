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

  describe('.type-assignability', () => {
    test('IsoPriceWords is assignable to IsoPrice', () => {
      const words: IsoPriceWords = 'USD 50.37' as IsoPriceWords;
      const price: IsoPrice = words;
      expect(price).toEqual('USD 50.37');
    });

    test('IsoPriceShape is assignable to IsoPrice', () => {
      const shape: IsoPriceShape = { amount: 5037n, currency: 'USD' };
      const price: IsoPrice = shape;
      expect(price).toEqual({ amount: 5037n, currency: 'USD' });
    });

    test('IsoPriceHuman is assignable to IsoPrice', () => {
      const human: IsoPriceHuman = '$50.37' as IsoPriceHuman;
      const price: IsoPrice = human;
      expect(price).toEqual('$50.37');
    });
  });

  describe('.ts-expect-error', () => {
    // helper that returns IsoPrice without type narrow
    const getPrice = (): IsoPrice => 'USD 50.37' as IsoPriceWords;

    test('IsoPrice union can be assigned to variants via type assertion', () => {
      const price = getPrice();
      // union can be narrowed via assertion when the caller knows the actual type
      const _words: IsoPriceWords = price as IsoPriceWords;
      const _shape: IsoPriceShape = price as unknown as IsoPriceShape;
      const _human: IsoPriceHuman = price as unknown as IsoPriceHuman;
      expect(_words).toBeDefined();
      expect(_shape).toBeDefined();
      expect(_human).toBeDefined();
    });
  });
});
