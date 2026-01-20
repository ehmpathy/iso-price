import { BadRequestError } from 'helpful-errors';
import { getError } from 'test-fns';

import { isIsoPriceWords } from './isIsoPriceWords';

describe('isIsoPriceWords', () => {
  const CASES = [
    // valid words format
    {
      description: 'basic usd price',
      given: { input: 'USD 50.37' },
      expect: { output: true },
    },
    {
      description: 'euro currency',
      given: { input: 'EUR 50.37' },
      expect: { output: true },
    },
    {
      description: 'jpy with underscore',
      given: { input: 'JPY 1_000' },
      expect: { output: true },
    },
    {
      description: 'micro precision',
      given: { input: 'USD 0.000_003' },
      expect: { output: true },
    },
    {
      description: 'underscore thousands separator',
      given: { input: 'USD 1_000_000.00' },
      expect: { output: true },
    },
    {
      description: 'no decimals (jpy)',
      given: { input: 'JPY 1000' },
      expect: { output: true },
    },
    {
      description: 'negative price',
      given: { input: 'USD -50.37' },
      expect: { output: true },
    },
    {
      description: 'zero price',
      given: { input: 'USD 0.00' },
      expect: { output: true },
    },
    {
      description: 'small amount',
      given: { input: 'USD 0.01' },
      expect: { output: true },
    },
    {
      description: 'gbp currency',
      given: { input: 'GBP 100.00' },
      expect: { output: true },
    },
    {
      description: 'bhd 3-decimal',
      given: { input: 'BHD 1.234' },
      expect: { output: true },
    },
    // comma separators rejected (use asIsoPrice to normalize)
    {
      description: 'comma separators (invalid)',
      given: { input: 'USD 1,000,000.00' },
      expect: { output: false },
    },
    // invalid words format
    {
      description: 'symbol format (human)',
      given: { input: '$50.37' },
      expect: { output: false },
    },
    {
      description: 'euro symbol',
      given: { input: '€50.37' },
      expect: { output: false },
    },
    {
      description: 'nonsense string',
      given: { input: 'fifty bucks' },
      expect: { output: false },
    },
    {
      description: 'lowercase currency',
      given: { input: 'usd 50.37' },
      expect: { output: false },
    },
    {
      description: 'two letter currency',
      given: { input: 'US 50.37' },
      expect: { output: false },
    },
    {
      description: 'four letter currency',
      given: { input: 'USDD 50.37' },
      expect: { output: false },
    },
    {
      description: 'no space separator',
      given: { input: 'USD50.37' },
      expect: { output: false },
    },
    {
      description: 'number type',
      given: { input: 50.37 },
      expect: { output: false },
    },
    { description: 'null', given: { input: null }, expect: { output: false } },
    {
      description: 'undefined',
      given: { input: undefined },
      expect: { output: false },
    },
    {
      description: 'object shape',
      given: { input: { amount: 5037n, currency: 'USD' } },
      expect: { output: false },
    },
    {
      description: 'empty string',
      given: { input: '' },
      expect: { output: false },
    },
  ];

  CASES.forEach(({ description, given, expect: expected }) => {
    test(description, () => {
      expect(isIsoPriceWords(given.input)).toBe(expected.output);
    });
  });

  describe('.assure', () => {
    const ASSURE_CASES = [
      {
        description: 'valid words does not throw',
        given: { input: 'USD 50.37' },
        expect: { throws: false },
      },
      {
        description: 'invalid string throws',
        given: { input: 'invalid' },
        expect: { throws: true },
      },
      {
        description: 'human format throws',
        given: { input: '$50.37' },
        expect: { throws: true },
      },
    ];

    ASSURE_CASES.forEach(({ description, given, expect: expected }) => {
      test(description, async () => {
        if (expected.throws) {
          const error = await getError(() =>
            isIsoPriceWords.assure(given.input),
          );
          expect(error).toBeInstanceOf(BadRequestError);
        } else {
          expect(() => isIsoPriceWords.assure(given.input)).not.toThrow();
        }
      });
    });
  });
});
