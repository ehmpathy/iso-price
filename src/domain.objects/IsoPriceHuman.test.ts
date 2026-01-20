import type { IsoPriceHuman } from './IsoPriceHuman';

describe('IsoPriceHuman', () => {
  const VALID_FORMAT_CASES = [
    { description: 'usd with dollar sign', given: { input: '$50.37' } },
    { description: 'eur with euro sign', given: { input: '€50.37' } },
    { description: 'jpy with yen sign and commas', given: { input: '¥1,000' } },
    { description: 'large usd with commas', given: { input: '$1,000,000.00' } },
    { description: 'suffix position', given: { input: '100 €' } },
  ];

  VALID_FORMAT_CASES.forEach(({ description, given }) => {
    test(`accepts valid format: ${description}`, () => {
      const price: IsoPriceHuman = given.input as IsoPriceHuman;
      expect(typeof price).toEqual('string');
    });
  });

  test('branded type has _dglo property in type definition', () => {
    type BrandCheck = IsoPriceHuman extends { _dglo: 'iso-price-human' }
      ? true
      : false;
    const hasBrand: BrandCheck = true;
    expect(hasBrand).toEqual(true);
  });

  test('type is distinct from IsoPriceWords brand', () => {
    type NotWordsBrand = IsoPriceHuman extends { _dglo: 'iso-price-words' }
      ? false
      : true;
    const isDistinct: NotWordsBrand = true;
    expect(isDistinct).toEqual(true);
  });

  describe('.ts-expect-error', () => {
    test('rejects plain string assignment at compile time', () => {
      // @ts-expect-error - plain string is not assignable to branded type
      const _price: IsoPriceHuman = '$50.37';
      expect(_price).toBeDefined();
    });

    test('rejects number assignment at compile time', () => {
      // @ts-expect-error - number is not assignable to branded string type
      const _price: IsoPriceHuman = 50.37;
      expect(_price).toBeDefined();
    });

    test('accepts valid branded cast', () => {
      // this should compile without error - cast is allowed
      const price: IsoPriceHuman = '$50.37' as IsoPriceHuman;
      expect(price).toEqual('$50.37');
    });
  });
});
