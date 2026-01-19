import { BadRequestError, getError } from 'helpful-errors';

import { IsoPriceExponent } from '../../domain.objects/IsoPriceExponent';
import { IsoPriceRoundMode } from '../../domain.objects/IsoPriceRoundMode';
import { dividePrice } from './dividePrice';

describe('dividePrice', () => {
  const CASES = [
    // even division
    {
      description: 'divide by 4',
      given: { input: { of: 'USD 10.00', by: 4 } },
      expect: { output: 'USD 2.50' },
    },
    {
      description: 'divide by 2',
      given: { input: { of: 'USD 50.00', by: 2 } },
      expect: { output: 'USD 25.00' },
    },
    {
      description: 'divide by 1 (identity)',
      given: { input: { of: 'USD 50.37', by: 1 } },
      expect: { output: 'USD 50.37' },
    },
    // uneven division with round
    {
      description: 'default half-up round',
      given: { input: { of: 'USD 100.00', by: 3 } },
      expect: { output: 'USD 33.33' },
    },
    // large divisor (precision increase)
    {
      description: 'divide by million scales to nano',
      given: { input: { of: '$0.25', by: 1_000_000 } },
      expect: { output: 'USD 0.000_000_250' },
    },
    {
      description: 'divide by thousand',
      given: { input: { of: 'USD 10.00', by: 1000 } },
      expect: { output: 'USD 0.010' },
    },
    // negative divisor
    {
      description: 'negative divisor produces negative result',
      given: { input: { of: 'USD 10.00', by: -2 } },
      expect: { output: 'USD -5.00' },
    },
    // human format input
    {
      description: 'human format input',
      given: { input: { of: '$10.00', by: 4 } },
      expect: { output: 'USD 2.50' },
    },
    // shape format input
    {
      description: 'shape format input',
      given: { input: { of: { amount: 1000n, currency: 'USD' }, by: 4 } },
      expect: { output: 'USD 2.50' },
    },
    // high-precision input
    {
      description: 'micro precision divide',
      given: {
        input: {
          of: {
            amount: 21n,
            currency: 'USD',
            exponent: IsoPriceExponent.MICRO,
          },
          by: 3,
        },
      },
      expect: { output: 'USD 0.000_007' },
    },
  ];

  CASES.forEach(({ description, given, expect: expected }) => {
    test(description, () => {
      expect(dividePrice(given.input)).toEqual(expected.output);
    });
  });

  describe('.format-option', () => {
    test('default format is words', () => {
      const result = dividePrice({ of: 'USD 10.00', by: 4 });
      expect(result).toEqual('USD 2.50');
      expect(typeof result).toEqual('string');
    });

    test('shape format returns object', () => {
      const result = dividePrice(
        { of: 'USD 10.00', by: 4 },
        { format: 'shape' },
      );
      expect(result).toEqual({
        amount: 250n,
        currency: 'USD',
        exponent: IsoPriceExponent.CENTI,
      });
    });
  });

  describe('.round-option', () => {
    const ROUND_CASES = [
      {
        description: 'explicit ceil round',
        given: {
          input: { of: 'USD 10.00', by: 3 },
          options: { round: IsoPriceRoundMode.CEIL },
        },
        expect: { output: 'USD 3.34' },
      },
      {
        description: 'explicit floor round',
        given: {
          input: { of: 'USD 10.00', by: 3 },
          options: { round: IsoPriceRoundMode.FLOOR },
        },
        expect: { output: 'USD 3.33' },
      },
    ];

    ROUND_CASES.forEach(({ description, given, expect: expected }) => {
      test(description, () => {
        const result = dividePrice(given.input, given.options);
        expect(result).toEqual(expected.output);
      });
    });
  });

  describe('.error', () => {
    test('throws on divide by zero', async () => {
      const error = await getError(async () =>
        dividePrice({ of: 'USD 10.00', by: 0 }),
      );
      expect(error).toBeInstanceOf(BadRequestError);
      expect(error.message).toContain('divide by zero');
    });
  });
});
