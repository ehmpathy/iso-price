import { BadRequestError } from 'helpful-errors';
import { getError } from 'test-fns';

import { isIsoPrice } from './isIsoPrice';

describe('isIsoPrice', () => {
  const CASES = [
    // valid iso-price (any of the three formats)
    {
      description: 'words format',
      given: { input: 'USD 50.37' },
      expect: { output: true },
    },
    {
      description: 'words with underscore',
      given: { input: 'USD 1_000_000.00' },
      expect: { output: true },
    },
    {
      description: 'shape format',
      given: { input: { amount: 5037n, currency: 'USD' } },
      expect: { output: true },
    },
    {
      description: 'shape with exponent',
      given: {
        input: { amount: 3n, currency: 'USD', exponent: 'micro.x10^-6' },
      },
      expect: { output: true },
    },
    {
      description: 'human format (dollar)',
      given: { input: '$50.37' },
      expect: { output: true },
    },
    {
      description: 'human format (euro)',
      given: { input: '€100.00' },
      expect: { output: true },
    },
    {
      description: 'human format (suffix)',
      given: { input: '100 €' },
      expect: { output: true },
    },
    {
      description: 'jpy words',
      given: { input: 'JPY 1_000' },
      expect: { output: true },
    },
    {
      description: 'yen human',
      given: { input: '¥1,000' },
      expect: { output: true },
    },
    // invalid iso-price
    {
      description: 'plain number',
      given: { input: 50.37 },
      expect: { output: false },
    },
    {
      description: 'plain string (no symbol or code)',
      given: { input: '50.37' },
      expect: { output: false },
    },
    { description: 'null', given: { input: null }, expect: { output: false } },
    {
      description: 'undefined',
      given: { input: undefined },
      expect: { output: false },
    },
    {
      description: 'empty string',
      given: { input: '' },
      expect: { output: false },
    },
    {
      description: 'empty object',
      given: { input: {} },
      expect: { output: false },
    },
    {
      description: 'shape with number amount',
      given: { input: { amount: 5037, currency: 'USD' } },
      expect: { output: false },
    },
    {
      description: 'array',
      given: { input: ['USD', 50.37] },
      expect: { output: false },
    },
    {
      description: 'lowercase currency code',
      given: { input: 'usd 50.37' },
      expect: { output: false },
    },
    {
      description: 'words with commas (valid for input)',
      given: { input: 'USD 1,000.00' },
      expect: { output: true },
    },
    {
      description: 'nonsense string',
      given: { input: 'invalid' },
      expect: { output: false },
    },
  ];

  CASES.forEach(({ description, given, expect: expected }) => {
    test(description, () => {
      expect(isIsoPrice(given.input)).toBe(expected.output);
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
        description: 'valid shape does not throw',
        given: { input: { amount: 5037n, currency: 'USD' } },
        expect: { throws: false },
      },
      {
        description: 'valid human does not throw',
        given: { input: '$50.37' },
        expect: { throws: false },
      },
      {
        description: 'invalid string throws',
        given: { input: 'invalid' },
        expect: { throws: true },
      },
      {
        description: 'null throws',
        given: { input: null },
        expect: { throws: true },
      },
    ];

    ASSURE_CASES.forEach(({ description, given, expect: expected }) => {
      test(description, async () => {
        if (expected.throws) {
          const error = await getError(() => isIsoPrice.assure(given.input));
          expect(error).toBeInstanceOf(BadRequestError);
        } else {
          expect(() => isIsoPrice.assure(given.input)).not.toThrow();
        }
      });
    });
  });
});
