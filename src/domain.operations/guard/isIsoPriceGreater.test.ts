import { BadRequestError, getError } from 'helpful-errors';

import { isIsoPriceGreater } from './isIsoPriceGreater';

describe('isIsoPriceGreater', () => {
  const CASES = [
    // c.1: predicate.greater — first > second
    {
      description: 'returns true when first is greater (100 > 9)',
      given: { a: 'USD 100.00', b: 'USD 9.00' },
      expect: { output: true },
    },
    {
      description: 'returns false when first is lesser (9 < 100)',
      given: { a: 'USD 9.00', b: 'USD 100.00' },
      expect: { output: false },
    },
    {
      description: 'returns false when equal (100 === 100)',
      given: { a: 'USD 100.00', b: 'USD 100.00' },
      expect: { output: false },
    },
    // c.4: predicate.precision-normalization
    {
      description: 'handles mixed precision (0.01 > 0.000_001)',
      given: { a: 'USD 0.01', b: 'USD 0.000_001' },
      expect: { output: true },
    },
    {
      description: 'handles mixed precision (0.000_001 < 0.01)',
      given: { a: 'USD 0.000_001', b: 'USD 0.01' },
      expect: { output: false },
    },
    // c.16: input.mixed-formats
    {
      description: 'accepts human format input',
      given: { a: '$100.00', b: '$9.00' },
      expect: { output: true },
    },
    {
      description: 'accepts shape format input',
      given: {
        a: { amount: 10000n, currency: 'USD' },
        b: { amount: 900n, currency: 'USD' },
      },
      expect: { output: true },
    },
    {
      description: 'accepts mixed formats',
      given: {
        a: 'USD 100.00',
        b: { amount: 900n, currency: 'USD' },
      },
      expect: { output: true },
    },
    // boundary: negative values
    {
      description: 'handles negative values (-5 > -10)',
      given: { a: 'USD -5.00', b: 'USD -10.00' },
      expect: { output: true },
    },
    {
      description: 'handles mixed sign (1 > -1)',
      given: { a: 'USD 1.00', b: 'USD -1.00' },
      expect: { output: true },
    },
    // boundary: zero
    {
      description: 'handles zero comparison (0 > -1)',
      given: { a: 'USD 0.00', b: 'USD -1.00' },
      expect: { output: true },
    },
    {
      description: 'handles zero comparison (1 > 0)',
      given: { a: 'USD 1.00', b: 'USD 0.00' },
      expect: { output: true },
    },
    // boundary: very large values
    {
      description: 'handles very large values',
      given: { a: 'USD 999_999_999.99', b: 'USD 1.00' },
      expect: { output: true },
    },
    // boundary: very small values
    {
      description: 'handles very small values',
      given: { a: 'USD 0.000_000_002', b: 'USD 0.000_000_001' },
      expect: { output: true },
    },
    // non-usd currencies
    {
      description: 'works with euro',
      given: { a: 'EUR 100.00', b: 'EUR 50.00' },
      expect: { output: true },
    },
    {
      description: 'works with jpy (no decimals)',
      given: { a: 'JPY 1000', b: 'JPY 500' },
      expect: { output: true },
    },
  ];

  CASES.forEach(({ description, given, expect: expected }) => {
    test(description, () => {
      expect(isIsoPriceGreater(given.a as any, given.b as any)).toBe(
        expected.output,
      );
    });
  });

  describe('.error', () => {
    // c.5: predicate.currency-mismatch
    test('failsfast on currency mismatch', async () => {
      const error = await getError(async () =>
        isIsoPriceGreater('USD 100.00', 'EUR 50.00' as any),
      );
      expect(error).toBeInstanceOf(BadRequestError);
      expect(error.message).toContain('currency mismatch');
    });
  });
});
