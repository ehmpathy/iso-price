import { BadRequestError, getError } from 'helpful-errors';

import { isIsoPriceEqual } from './isIsoPriceEqual';

describe('isIsoPriceEqual', () => {
  const CASES = [
    // c.3: predicate.equal — same value
    {
      description: 'returns true when equal (same format)',
      given: { a: 'USD 100.00', b: 'USD 100.00' },
      expect: { output: true },
    },
    {
      description: 'returns true when equal (underscore difference)',
      given: { a: 'USD 1_000.00', b: 'USD 1000.00' },
      expect: { output: true },
    },
    // c.3/c.4: predicate.precision-normalization
    {
      description: 'returns true when equal (precision normalization 0.25)',
      given: { a: 'USD 0.25', b: 'USD 0.250_000' },
      expect: { output: true },
    },
    {
      description: 'returns true when equal (precision normalization 0.10)',
      given: { a: 'USD 0.10', b: 'USD 0.100_000' },
      expect: { output: true },
    },
    {
      description: 'returns true when equal (precision normalization 1.00)',
      given: { a: 'USD 1.00', b: 'USD 1.000_000_000' },
      expect: { output: true },
    },
    {
      description: 'returns false when different (precision reveals diff)',
      given: { a: 'USD 0.25', b: 'USD 0.250_001' },
      expect: { output: false },
    },
    // not equal cases
    {
      description: 'returns false when first is greater',
      given: { a: 'USD 100.00', b: 'USD 9.00' },
      expect: { output: false },
    },
    {
      description: 'returns false when first is lesser',
      given: { a: 'USD 9.00', b: 'USD 100.00' },
      expect: { output: false },
    },
    // c.16: input.mixed-formats
    {
      description: 'accepts human format input',
      given: { a: '$50.00', b: 'USD 50.00' },
      expect: { output: true },
    },
    {
      description: 'accepts shape format input',
      given: {
        a: { amount: 5000n, currency: 'USD' },
        b: { amount: 5000n, currency: 'USD' },
      },
      expect: { output: true },
    },
    {
      description: 'accepts mixed formats (shape vs words)',
      given: {
        a: { amount: 5000n, currency: 'USD' },
        b: 'USD 50.00',
      },
      expect: { output: true },
    },
    // boundary: zero values
    {
      description: 'returns true for zero values',
      given: { a: 'USD 0.00', b: 'USD 0' },
      expect: { output: true },
    },
    // boundary: negative values
    {
      description: 'returns true for equal negative values',
      given: { a: 'USD -50.00', b: 'USD -50.00' },
      expect: { output: true },
    },
    {
      description: 'returns false for different negative values',
      given: { a: 'USD -50.00', b: 'USD -51.00' },
      expect: { output: false },
    },
    // boundary: very large values
    {
      description: 'handles very large equal values',
      given: { a: 'USD 999_999_999.99', b: 'USD 999_999_999.99' },
      expect: { output: true },
    },
    // boundary: very small values
    {
      description: 'handles very small equal values',
      given: { a: 'USD 0.000_000_001', b: 'USD 0.000_000_001' },
      expect: { output: true },
    },
    // non-usd currencies
    {
      description: 'works with euro',
      given: { a: 'EUR 100.00', b: 'EUR 100.00' },
      expect: { output: true },
    },
    {
      description: 'works with jpy (no decimals)',
      given: { a: 'JPY 1000', b: 'JPY 1000' },
      expect: { output: true },
    },
  ];

  CASES.forEach(({ description, given, expect: expected }) => {
    test(description, () => {
      expect(isIsoPriceEqual(given.a as any, given.b as any)).toBe(
        expected.output,
      );
    });
  });

  describe('.error', () => {
    // c.5: predicate.currency-mismatch
    test('failsfast on currency mismatch', async () => {
      const error = await getError(async () =>
        isIsoPriceEqual('USD 100.00', 'EUR 100.00' as any),
      );
      expect(error).toBeInstanceOf(BadRequestError);
      expect(error.message).toContain('currency mismatch');
    });
  });
});
