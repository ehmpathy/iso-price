import { isIsoPriceWords } from '../guard/isIsoPriceWords';
import { asIsoPriceWords } from './asIsoPriceWords';

describe('asIsoPriceWords', () => {
  const CASES = [
    // from shape format
    {
      description: 'basic USD price',
      given: { input: { amount: 5037n, currency: 'USD' } },
      expect: { output: 'USD 50.37' },
    },
    {
      description: 'large amount with underscore separators',
      given: { input: { amount: 100000000n, currency: 'USD' } },
      expect: { output: 'USD 1_000_000.00' },
    },
    {
      description: 'zero price',
      given: { input: { amount: 0n, currency: 'USD' } },
      expect: { output: 'USD 0.00' },
    },
    {
      description: 'negative price',
      given: { input: { amount: -5037n, currency: 'USD' } },
      expect: { output: 'USD -50.37' },
    },
    {
      description: 'small amount (1 cent)',
      given: { input: { amount: 1n, currency: 'USD' } },
      expect: { output: 'USD 0.01' },
    },
    {
      description: 'micro precision shape',
      given: {
        input: { amount: 3n, currency: 'USD', exponent: 'micro.x10^-6' },
      },
      expect: { output: 'USD 0.000_003' },
    },
    // from human format
    {
      description: 'dollar symbol',
      given: { input: '$50.37' },
      expect: { output: 'USD 50.37' },
    },
    {
      description: 'euro symbol',
      given: { input: '€100.00' },
      expect: { output: 'EUR 100.00' },
    },
    {
      description: 'with comma separators',
      given: { input: '$1,000,000.00' },
      expect: { output: 'USD 1_000_000.00' },
    },
    // from words format (normalization)
    {
      description: 'words passthrough',
      given: { input: 'USD 50.37' },
      expect: { output: 'USD 50.37' },
    },
    {
      description: 'words normalizes large numbers',
      given: { input: 'USD 1000000.00' },
      expect: { output: 'USD 1_000_000.00' },
    },
  ];

  CASES.forEach(({ description, given, expect: expected }) => {
    test(description, () => {
      expect(asIsoPriceWords(given.input)).toEqual(expected.output);
    });
  });

  describe('.output-validation', () => {
    test('output is valid IsoPriceWords', () => {
      const result = asIsoPriceWords({ amount: 5037n, currency: 'USD' });
      expect(isIsoPriceWords(result)).toBe(true);
    });
  });
});
