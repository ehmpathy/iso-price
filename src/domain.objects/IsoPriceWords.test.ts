import type { IsoPriceWords } from './IsoPriceWords';

describe('IsoPriceWords', () => {
  const VALID_FORMAT_CASES = [
    { description: 'usd price', given: { input: 'USD 50.37' } },
    { description: 'eur price', given: { input: 'EUR 1000.00' } },
    { description: 'jpy whole units', given: { input: 'JPY 1000' } },
    { description: 'micro precision', given: { input: 'USD 0.000003' } },
    { description: 'million dollars', given: { input: 'USD 1000000.00' } },
  ];

  VALID_FORMAT_CASES.forEach(({ description, given }) => {
    test(`accepts valid format: ${description}`, () => {
      const price: IsoPriceWords = given.input as IsoPriceWords;
      expect(typeof price).toEqual('string');
    });
  });

  test('type accepts valid words format when currency matches', () => {
    const price: IsoPriceWords<'USD'> = 'USD 50.37' as IsoPriceWords<'USD'>;
    expect(price).toEqual('USD 50.37');
  });

  test('type is parameterized by currency', () => {
    type UsdPrice = IsoPriceWords<'USD'>;
    type EurPrice = IsoPriceWords<'EUR'>;

    const usd: UsdPrice = 'USD 50.37' as UsdPrice;
    const eur: EurPrice = 'EUR 50.37' as EurPrice;

    expect(typeof usd).toEqual('string');
    expect(typeof eur).toEqual('string');
  });

  test('branded type has _dglo property in type definition', () => {
    type BrandCheck = IsoPriceWords extends { _dglo: 'iso-price-words' }
      ? true
      : false;
    const hasBrand: BrandCheck = true;
    expect(hasBrand).toEqual(true);
  });

  describe('.ts-expect-error', () => {
    test('rejects plain string assignment at compile time', () => {
      // @ts-expect-error - plain string is not assignable to branded type
      const _price: IsoPriceWords = 'USD 50.37';
      expect(_price).toBeDefined();
    });

    test('rejects number assignment at compile time', () => {
      // @ts-expect-error - number is not assignable to branded string type
      const _price: IsoPriceWords = 50.37;
      expect(_price).toBeDefined();
    });

    test('accepts valid branded cast', () => {
      // this should compile without error - cast is allowed
      const price: IsoPriceWords = 'USD 50.37' as IsoPriceWords;
      expect(price).toEqual('USD 50.37');
    });
  });
});
