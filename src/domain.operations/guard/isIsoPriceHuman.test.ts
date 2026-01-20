import { BadRequestError } from 'helpful-errors';
import { getError } from 'test-fns';

import { isIsoPriceHuman } from './isIsoPriceHuman';

describe('isIsoPriceHuman', () => {
  const CASES = [
    // valid human format
    {
      description: 'dollar symbol prefix',
      given: { input: '$50.37' },
      expect: { output: true },
    },
    {
      description: 'euro symbol prefix',
      given: { input: '€50.37' },
      expect: { output: true },
    },
    {
      description: 'yen symbol with commas',
      given: { input: '¥1,000' },
      expect: { output: true },
    },
    {
      description: 'pound symbol prefix',
      given: { input: '£100.00' },
      expect: { output: true },
    },
    {
      description: 'with comma separators',
      given: { input: '$1,000,000.00' },
      expect: { output: true },
    },
    {
      description: 'euro suffix position',
      given: { input: '100 €' },
      expect: { output: true },
    },
    {
      description: 'krona prefix',
      given: { input: 'kr500' },
      expect: { output: true },
    },
    {
      description: 'indian rupee',
      given: { input: '₹1,000' },
      expect: { output: true },
    },
    {
      description: 'korean won',
      given: { input: '₩50,000' },
      expect: { output: true },
    },
    // invalid human format
    {
      description: 'words format (code-prefix)',
      given: { input: 'USD 50.37' },
      expect: { output: false },
    },
    {
      description: 'eur words format',
      given: { input: 'EUR 100.00' },
      expect: { output: false },
    },
    {
      description: 'no symbol',
      given: { input: '50.37' },
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
    {
      description: 'just numbers',
      given: { input: '1000' },
      expect: { output: false },
    },
    {
      description: 'three letter code no space',
      given: { input: 'USD50.37' },
      expect: { output: false },
    },
  ];

  CASES.forEach(({ description, given, expect: expected }) => {
    test(description, () => {
      expect(isIsoPriceHuman(given.input)).toBe(expected.output);
    });
  });

  describe('.assure', () => {
    const ASSURE_CASES = [
      {
        description: 'valid human does not throw',
        given: { input: '$50.37' },
        expect: { throws: false },
      },
      {
        description: 'words format throws',
        given: { input: 'USD 50.37' },
        expect: { throws: true },
      },
      {
        description: 'plain number throws',
        given: { input: '50.37' },
        expect: { throws: true },
      },
    ];

    ASSURE_CASES.forEach(({ description, given, expect: expected }) => {
      test(description, async () => {
        if (expected.throws) {
          const error = await getError(() =>
            isIsoPriceHuman.assure(given.input),
          );
          expect(error).toBeInstanceOf(BadRequestError);
        } else {
          expect(() => isIsoPriceHuman.assure(given.input)).not.toThrow();
        }
      });
    });
  });
});
