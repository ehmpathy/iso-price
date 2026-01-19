import { isIsoPriceHuman } from '../guard/isIsoPriceHuman';
import { asIsoPriceHuman } from './asIsoPriceHuman';

describe('asIsoPriceHuman', () => {
  const CASES = [
    // from shape format
    {
      description: 'basic USD price',
      given: { input: { amount: 5037n, currency: 'USD' } },
      expect: { output: '$50.37' },
    },
    {
      description: 'large amount with comma separators',
      given: { input: { amount: 100000000n, currency: 'USD' } },
      expect: { output: '$1,000,000.00' },
    },
    {
      description: 'zero price',
      given: { input: { amount: 0n, currency: 'USD' } },
      expect: { output: '$0.00' },
    },
    {
      description: 'negative price',
      given: { input: { amount: -5037n, currency: 'USD' } },
      expect: { output: '$-50.37' },
    },
    {
      description: 'euro currency',
      given: { input: { amount: 10000n, currency: 'EUR' } },
      expect: { output: '€100.00' },
    },
    {
      description: 'yen currency',
      given: { input: { amount: 1000n, currency: 'JPY' } },
      expect: { output: '¥1,000' },
    },
    {
      description: 'unknown currency uses code',
      given: { input: { amount: 5037n, currency: 'XYZ' } },
      expect: { output: 'XYZ50.37' },
    },
    // from words format
    {
      description: 'words to human USD',
      given: { input: 'USD 50.37' },
      expect: { output: '$50.37' },
    },
    {
      description: 'words to human EUR',
      given: { input: 'EUR 50.37' },
      expect: { output: '€50.37' },
    },
    {
      description: 'words with underscore separators',
      given: { input: 'USD 1_000_000.00' },
      expect: { output: '$1,000,000.00' },
    },
    {
      description: 'words to human JPY',
      given: { input: 'JPY 1_000' },
      expect: { output: '¥1,000' },
    },
    // from human format (normalization)
    {
      description: 'human passthrough',
      given: { input: '$50.37' },
      expect: { output: '$50.37' },
    },
    {
      description: 'human normalizes large numbers',
      given: { input: '$1000000.00' },
      expect: { output: '$1,000,000.00' },
    },
  ];

  CASES.forEach(({ description, given, expect: expected }) => {
    test(description, () => {
      expect(asIsoPriceHuman(given.input)).toEqual(expected.output);
    });
  });

  describe('.output-validation', () => {
    test('output is valid IsoPriceHuman', () => {
      const result = asIsoPriceHuman({ amount: 5037n, currency: 'USD' });
      expect(isIsoPriceHuman(result)).toBe(true);
    });
  });
});
