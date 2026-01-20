import { BadRequestError, getError } from 'helpful-errors';

import { IsoPriceExponent } from '../../domain.objects/IsoPriceExponent';
import { subPrices } from './subPrices';

describe('subPrices', () => {
  const CASES = [
    // basic subtraction
    {
      description: 'positive result',
      given: { input: { a: 'USD 50.00', b: 'USD 20.00' } },
      expect: { output: 'USD 30.00' },
    },
    {
      description: 'negative result',
      given: { input: { a: 'USD 10.00', b: 'USD 50.00' } },
      expect: { output: 'USD -40.00' },
    },
    {
      description: 'zero result',
      given: { input: { a: 'USD 50.00', b: 'USD 50.00' } },
      expect: { output: 'USD 0.00' },
    },
    // mixed precision
    {
      description: 'centi - micro normalizes to micro',
      given: {
        input: {
          a: 'USD 50.37',
          b: { amount: 5n, currency: 'USD', exponent: IsoPriceExponent.MICRO },
        },
      },
      expect: { output: 'USD 50.369_995' },
    },
    // human format input
    {
      description: 'human format input',
      given: { input: { a: '$50.00', b: '$20.00' } },
      expect: { output: 'USD 30.00' },
    },
    // shape format input
    {
      description: 'shape format input',
      given: {
        input: {
          a: { amount: 5000n, currency: 'USD' },
          b: { amount: 2000n, currency: 'USD' },
        },
      },
      expect: { output: 'USD 30.00' },
    },
    // negative inputs
    {
      description: 'subtracts negative (adds)',
      given: {
        input: {
          a: { amount: 5000n, currency: 'USD' },
          b: { amount: -2000n, currency: 'USD' },
        },
      },
      expect: { output: 'USD 70.00' },
    },
  ];

  CASES.forEach(({ description, given, expect: expected }) => {
    test(description, () => {
      expect(subPrices(given.input.a, given.input.b)).toEqual(expected.output);
    });
  });

  describe('.format-option', () => {
    test('default format is words', () => {
      const result = subPrices('USD 50.00', 'USD 20.00');
      expect(result).toEqual('USD 30.00');
      expect(typeof result).toEqual('string');
    });

    test('shape format returns object', () => {
      const result = subPrices('USD 50.00', 'USD 20.00', { format: 'shape' });
      expect(result).toEqual({
        amount: 3000n,
        currency: 'USD',
        exponent: IsoPriceExponent.CENTI,
      });
    });
  });

  describe('.error', () => {
    test('throws on currency mismatch', async () => {
      const error = await getError(async () =>
        subPrices('USD 50.00', 'EUR 20.00' as any),
      );
      expect(error).toBeInstanceOf(BadRequestError);
      expect(error.message).toContain('currency mismatch');
    });
  });
});
