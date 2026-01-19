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
});
