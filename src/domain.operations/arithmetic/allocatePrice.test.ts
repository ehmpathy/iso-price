import { getError } from 'test-fns';

import { allocatePrice } from './allocatePrice';
import { sumPrices } from './sumPrices';

describe('allocatePrice', () => {
  const CASES = [
    // equal parts
    {
      description: '$10.00 into 3 parts (first)',
      given: {
        input: {
          of: 'USD 10.00',
          into: { parts: 3 },
          remainder: 'first' as const,
        },
      },
      expect: { output: ['USD 3.34', 'USD 3.33', 'USD 3.33'] },
    },
    {
      description: '$10.00 into 3 parts (last)',
      given: {
        input: {
          of: 'USD 10.00',
          into: { parts: 3 },
          remainder: 'last' as const,
        },
      },
      expect: { output: ['USD 3.33', 'USD 3.33', 'USD 3.34'] },
    },
    {
      description: 'even divide no remainder',
      given: {
        input: {
          of: 'USD 10.00',
          into: { parts: 2 },
          remainder: 'first' as const,
        },
      },
      expect: { output: ['USD 5.00', 'USD 5.00'] },
    },
    {
      description: 'single part',
      given: {
        input: {
          of: 'USD 10.00',
          into: { parts: 1 },
          remainder: 'first' as const,
        },
      },
      expect: { output: ['USD 10.00'] },
    },
    // ratio allocation
    {
      description: '70/30 split',
      given: {
        input: {
          of: 'USD 10.00',
          into: { ratios: [7, 3] },
          remainder: 'first' as const,
        },
      },
      expect: { output: ['USD 7.00', 'USD 3.00'] },
    },
    {
      description: '50/50 split',
      given: {
        input: {
          of: 'USD 10.00',
          into: { ratios: [1, 1] },
          remainder: 'first' as const,
        },
      },
      expect: { output: ['USD 5.00', 'USD 5.00'] },
    },
    {
      description: '$5.00 70/30',
      given: {
        input: {
          of: 'USD 5.00',
          into: { ratios: [7, 3] },
          remainder: 'first' as const,
        },
      },
      expect: { output: ['USD 3.50', 'USD 1.50'] },
    },
    // remainder modes
    {
      description: '$1.00 into 3 (first)',
      given: {
        input: {
          of: 'USD 1.00',
          into: { parts: 3 },
          remainder: 'first' as const,
        },
      },
      expect: { output: ['USD 0.34', 'USD 0.33', 'USD 0.33'] },
    },
    {
      description: '$1.00 into 3 (last)',
      given: {
        input: {
          of: 'USD 1.00',
          into: { parts: 3 },
          remainder: 'last' as const,
        },
      },
      expect: { output: ['USD 0.33', 'USD 0.33', 'USD 0.34'] },
    },
    // human format input
    {
      description: 'human format input',
      given: {
        input: {
          of: '$10.00',
          into: { parts: 2 },
          remainder: 'first' as const,
        },
      },
      expect: { output: ['USD 5.00', 'USD 5.00'] },
    },
    // shape format input
    {
      description: 'shape format input',
      given: {
        input: {
          of: { amount: 1000n, currency: 'USD' },
          into: { parts: 2 },
          remainder: 'first' as const,
        },
      },
      expect: { output: ['USD 5.00', 'USD 5.00'] },
    },
  ];

  CASES.forEach(({ description, given, expect: expected }) => {
    test(description, () => {
      expect(allocatePrice(given.input)).toEqual(expected.output);
    });
  });

  describe('.lossless-invariant', () => {
    const INVARIANT_CASES = [
      {
        description: 'sum of 3 parts equals original',
        given: {
          input: {
            of: 'USD 10.00',
            into: { parts: 3 },
            remainder: 'first' as const,
          },
        },
      },
      {
        description: 'sum of ratio parts equals original',
        given: {
          input: {
            of: 'USD 5.00',
            into: { ratios: [7, 3] },
            remainder: 'first' as const,
          },
        },
      },
      {
        description: 'sum of equal thirds equals original',
        given: {
          input: {
            of: 'USD 10.00',
            into: { ratios: [1, 1, 1] },
            remainder: 'first' as const,
          },
        },
      },
      {
        description: 'sum of 7 parts equals original',
        given: {
          input: {
            of: 'USD 100.00',
            into: { parts: 7 },
            remainder: 'largest' as const,
          },
        },
      },
    ];

    INVARIANT_CASES.forEach(({ description, given }) => {
      test(description, () => {
        const parts = allocatePrice(given.input);
        expect(sumPrices(parts)).toEqual(given.input.of);
      });
    });
  });

  describe('.format-option', () => {
    test('default format is words', () => {
      const result = allocatePrice({
        of: 'USD 10.00',
        into: { parts: 2 },
        remainder: 'first',
      });
      expect(typeof result[0]).toBe('string');
    });

    test('shape format returns objects', () => {
      const result = allocatePrice(
        {
          of: 'USD 10.00',
          into: { parts: 2 },
          remainder: 'first',
        },
        { format: 'shape' },
      );
      expect(result[0]).toEqual({
        amount: 500n,
        currency: 'USD',
        exponent: 'centi.x10^-2',
      });
    });
  });

  describe('.remainder-random', () => {
    test('deterministic pseudo-random distribution', () => {
      const result1 = allocatePrice({
        of: 'USD 1.00',
        into: { parts: 3 },
        remainder: 'random',
      });
      const result2 = allocatePrice({
        of: 'USD 1.00',
        into: { parts: 3 },
        remainder: 'random',
      });
      expect(result1).toEqual(result2);
      expect(sumPrices(result1)).toEqual('USD 1.00');
    });
  });

  describe('.negative-amounts', () => {
    test('allocates negative amount correctly', () => {
      const result = allocatePrice({
        of: 'USD -10.00',
        into: { parts: 3 },
        remainder: 'first',
      });
      expect(sumPrices(result)).toEqual('USD -10.00');
    });
  });

  describe('.error', () => {
    test('throws on zero parts', () => {
      const error = getError(() =>
        allocatePrice({
          of: 'USD 10.00',
          into: { parts: 0 },
          remainder: 'first',
        }),
      );
      expect(error).toBeDefined();
    });

    test('throws on negative ratio', () => {
      const error = getError(() =>
        allocatePrice({
          of: 'USD 10.00',
          into: { ratios: [7, -3] },
          remainder: 'first',
        }),
      );
      expect(error).toBeDefined();
    });

    test('throws on all-zero ratios', () => {
      const error = getError(() =>
        allocatePrice({
          of: 'USD 10.00',
          into: { ratios: [0, 0] },
          remainder: 'first',
        }),
      );
      expect(error).toBeDefined();
    });
  });
});
