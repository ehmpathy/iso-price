import { IsoPriceExponent } from '../../domain.objects/IsoPriceExponent';
import { IsoPriceRoundMode } from '../../domain.objects/IsoPriceRoundMode';
import { multiplyPrice } from './multiplyPrice';

describe('multiplyPrice', () => {
  const CASES = [
    // integer multiplier
    {
      description: 'multiply by 3',
      given: { input: { of: 'USD 10.00', by: 3 } },
      expect: { output: 'USD 30.00' },
    },
    {
      description: 'multiply by 1 (identity)',
      given: { input: { of: 'USD 50.37', by: 1 } },
      expect: { output: 'USD 50.37' },
    },
    {
      description: 'multiply by 0',
      given: { input: { of: 'USD 50.37', by: 0 } },
      expect: { output: 'USD 0.00' },
    },
    // decimal multiplier
    {
      description: 'tax markup (1.08)',
      given: { input: { of: 'USD 100.00', by: 1.08 } },
      expect: { output: 'USD 108.00' },
    },
    {
      description: 'fractional multiplier (0.333)',
      given: { input: { of: 'USD 10.00', by: 0.333 } },
      expect: { output: 'USD 3.33' },
    },
    {
      description: 'percentage discount (0.85)',
      given: { input: { of: 'USD 100.00', by: 0.85 } },
      expect: { output: 'USD 85.00' },
    },
    {
      description: 'percentage discount (0.90)',
      given: { input: { of: 'USD 100.00', by: 0.9 } },
      expect: { output: 'USD 90.00' },
    },
    // negative multiplier
    {
      description: 'negative multiplier produces negative result',
      given: { input: { of: 'USD 10.00', by: -3 } },
      expect: { output: 'USD -30.00' },
    },
    // human format input
    {
      description: 'human format input',
      given: { input: { of: '$10.00', by: 3 } },
      expect: { output: 'USD 30.00' },
    },
    // shape format input
    {
      description: 'shape format input',
      given: { input: { of: { amount: 1000n, currency: 'USD' }, by: 3 } },
      expect: { output: 'USD 30.00' },
    },
    // precision preservation
    {
      description: 'micro precision input',
      given: {
        input: {
          of: { amount: 5n, currency: 'USD', exponent: IsoPriceExponent.MICRO },
          by: 1000,
        },
      },
      expect: { output: 'USD 0.005_000' },
    },
    {
      description: 'micro precision multiply by 7',
      given: { input: { of: 'USD 0.000_001', by: 7 } },
      expect: { output: 'USD 0.000_007' },
    },
  ];

  CASES.forEach(({ description, given, expect: expected }) => {
    test(description, () => {
      expect(multiplyPrice(given.input)).toEqual(expected.output);
    });
  });

  describe('.format-option', () => {
    test('default format is words', () => {
      const result = multiplyPrice({ of: 'USD 10.00', by: 3 });
      expect(result).toEqual('USD 30.00');
      expect(typeof result).toEqual('string');
    });

    test('shape format returns object', () => {
      const result = multiplyPrice(
        { of: 'USD 10.00', by: 3 },
        { format: 'shape' },
      );
      expect(result).toEqual({
        amount: 3000n,
        currency: 'USD',
        exponent: IsoPriceExponent.CENTI,
      });
    });
  });

  describe('.round-option', () => {
    const ROUND_CASES = [
      {
        description: 'default half-up',
        given: { input: { of: 'USD 10.00', by: 0.335 } },
        expect: { output: 'USD 3.35' },
      },
      {
        description: 'explicit floor',
        given: {
          input: { of: 'USD 10.00', by: 0.339 },
          options: { round: IsoPriceRoundMode.FLOOR },
        },
        expect: { output: 'USD 3.39' },
      },
      {
        description: 'explicit ceil',
        given: {
          input: { of: 'USD 10.00', by: 0.3361 },
          options: { round: IsoPriceRoundMode.CEIL },
        },
        expect: { output: 'USD 3.37' },
      },
    ];

    ROUND_CASES.forEach(({ description, given, expect: expected }) => {
      test(description, () => {
        const result =
          'options' in given
            ? multiplyPrice(given.input, given.options)
            : multiplyPrice(given.input);
        expect(result).toEqual(expected.output);
      });
    });
  });
});
