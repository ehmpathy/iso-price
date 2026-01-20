import { BadRequestError } from 'helpful-errors';
import { getError } from 'test-fns';

import { isIsoPriceWords } from '../guard/isIsoPriceWords';
import { asIsoPrice } from './asIsoPrice';

describe('asIsoPrice', () => {
  const CASES = [
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
      description: 'euro symbol (€50.37)',
      given: { input: '€50.37' },
      expect: { output: 'EUR 50.37' },
    },
    {
      description: 'with comma separators',
      given: { input: '$1,000,000.00' },
      expect: { output: 'USD 1_000_000.00' },
    },
    {
      description: 'yen symbol',
      given: { input: '¥1,000' },
      expect: { output: 'JPY 1_000' },
    },
    {
      description: 'yen symbol (¥1000)',
      given: { input: '¥1000' },
      expect: { output: 'JPY 1_000' },
    },
    // from words format
    {
      description: 'words passthrough',
      given: { input: 'USD 50.37' },
      expect: { output: 'USD 50.37' },
    },
    {
      description: 'words with underscore separators',
      given: { input: 'USD 1_000_000.00' },
      expect: { output: 'USD 1_000_000.00' },
    },
    {
      description: 'words with comma separators normalized',
      given: { input: 'USD 1,000,000.00' },
      expect: { output: 'USD 1_000_000.00' },
    },
    // from shape format
    {
      description: 'shape to words (bigint)',
      given: { input: { amount: 5037n, currency: 'USD' } },
      expect: { output: 'USD 50.37' },
    },
    {
      description: 'shape to words (number)',
      given: { input: { amount: 5037, currency: 'USD' } },
      expect: { output: 'USD 50.37' },
    },
    // currency override
    {
      description: 'currency override CAD',
      given: { input: '$50.37', options: { currency: 'CAD' } },
      expect: { output: 'CAD 50.37' },
    },
    {
      description: 'currency override AUD',
      given: { input: '$50.37', options: { currency: 'AUD' } },
      expect: { output: 'AUD 50.37' },
    },
    // currency preservation
    {
      description: 'preserves currency from shape',
      given: { input: { amount: 5037n, currency: 'CAD' } },
      expect: { output: 'CAD 50.37' },
    },
    // symbol that fits currency
    {
      description: 'symbol fits currency USD',
      given: { input: '$50.37', options: { currency: 'USD' } },
      expect: { output: 'USD 50.37' },
    },
  ];

  CASES.forEach(({ description, given, expect: expected }) => {
    test(description, () => {
      const result =
        'options' in given
          ? asIsoPrice(given.input, given.options)
          : asIsoPrice(given.input);
      expect(result).toEqual(expected.output);
    });
  });

  describe('.error', () => {
    const ERROR_CASES = [
      {
        description: 'symbol/currency mismatch euro to usd',
        given: { input: '€50.37', options: { currency: 'USD' } },
        expect: { throws: true },
      },
      {
        description: 'symbol/currency mismatch dollar to eur',
        given: { input: '$50.37', options: { currency: 'EUR' } },
        expect: { throws: true },
      },
    ];

    ERROR_CASES.forEach(({ description, given, expect: expected }) => {
      test(description, async () => {
        if (expected.throws) {
          const error = await getError(() =>
            asIsoPrice(given.input, given.options),
          );
          expect(error).toBeInstanceOf(BadRequestError);
        }
      });
    });
  });

  describe('.output-validation', () => {
    test('output is valid IsoPriceWords', () => {
      const result = asIsoPrice('$50.37');
      expect(isIsoPriceWords(result)).toBe(true);
    });
  });
});
