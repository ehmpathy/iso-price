import { isIsoPriceShape } from '../guard/isIsoPriceShape';
import { asIsoPriceShape } from './asIsoPriceShape';

describe('asIsoPriceShape', () => {
  const CASES = [
    // from words format
    {
      description: 'basic USD price',
      given: { input: 'USD 50.37' },
      expect: { output: { amount: 5037n, currency: 'USD' } },
    },
    {
      description: 'price with underscore separators',
      given: { input: 'USD 1_000_000.00' },
      expect: { output: { amount: 100000000n, currency: 'USD' } },
    },
    {
      description: 'no decimals (JPY style)',
      given: { input: 'JPY 1000' },
      expect: { output: { amount: 1000n, currency: 'JPY' } },
    },
    {
      description: 'micro precision',
      given: { input: 'USD 0.000_003' },
      expect: {
        output: { amount: 3n, currency: 'USD', exponent: 'micro.x10^-6' },
      },
    },
    {
      description: 'negative price',
      given: { input: 'USD -50.37' },
      expect: { output: { amount: -5037n, currency: 'USD' } },
    },
    {
      description: 'zero price',
      given: { input: 'USD 0.00' },
      expect: { output: { amount: 0n, currency: 'USD' } },
    },
    {
      description: 'bhd 3-decimal',
      given: { input: 'BHD 1.234' },
      expect: { output: { amount: 1234n, currency: 'BHD' } },
    },
    // from shape format
    {
      description: 'bigint amount passthrough',
      given: { input: { amount: 5037n, currency: 'USD' } },
      expect: { output: { amount: 5037n, currency: 'USD' } },
    },
    {
      description: 'number amount converts to bigint',
      given: { input: { amount: 5037, currency: 'USD' } },
      expect: { output: { amount: 5037n, currency: 'USD' } },
    },
    {
      description: 'preserves exponent',
      given: {
        input: { amount: 3n, currency: 'USD', exponent: 'micro.x10^-6' },
      },
      expect: {
        output: { amount: 3n, currency: 'USD', exponent: 'micro.x10^-6' },
      },
    },
    // from human format
    {
      description: 'dollar symbol',
      given: { input: '$50.37' },
      expect: { output: { amount: 5037n, currency: 'USD' } },
    },
    {
      description: 'dollar shorthand ($5)',
      given: { input: '$5' },
      expect: { output: { amount: 500n, currency: 'USD' } },
    },
    {
      description: 'euro symbol',
      given: { input: '€100.00' },
      expect: { output: { amount: 10000n, currency: 'EUR' } },
    },
    {
      description: 'with comma separators',
      given: { input: '$1,000,000.00' },
      expect: { output: { amount: 100000000n, currency: 'USD' } },
    },
    {
      description: 'yen symbol',
      given: { input: '¥1,000' },
      expect: { output: { amount: 1000n, currency: 'JPY' } },
    },
  ];

  CASES.forEach(({ description, given, expect: expected }) => {
    test(description, () => {
      const result = asIsoPriceShape(given.input);
      expect(result.amount).toEqual(expected.output.amount);
      expect(result.currency).toEqual(expected.output.currency);
      if (expected.output.exponent) {
        expect(result.exponent).toEqual(expected.output.exponent);
      }
    });
  });

  describe('.type-coercion', () => {
    test('number amount converts to bigint type', () => {
      const result = asIsoPriceShape({ amount: 5037, currency: 'USD' });
      expect(typeof result.amount).toEqual('bigint');
    });
  });

  describe('.output-validation', () => {
    test('output is valid IsoPriceShape', () => {
      const result = asIsoPriceShape('USD 50.37');
      expect(isIsoPriceShape(result)).toBe(true);
    });
  });
});
