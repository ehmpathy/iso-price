import { BadRequestError, getError } from 'helpful-errors';

import { IsoPriceExponent } from '../../domain.objects/IsoPriceExponent';
import { addPrices, sumPrices } from './sumPrices';

describe('sumPrices', () => {
  const CASES = [
    // spread syntax
    {
      description: 'two prices (spread)',
      given: { input: ['USD 10.00', 'USD 20.00'] },
      expect: { output: 'USD 30.00' },
    },
    {
      description: 'three prices (spread)',
      given: { input: ['USD 10.00', 'USD 20.00', 'USD 5.00'] },
      expect: { output: 'USD 35.00' },
    },
    {
      description: 'three prices fractional',
      given: { input: ['USD 1.11', 'USD 2.22', 'USD 3.33'] },
      expect: { output: 'USD 6.66' },
    },
    {
      description: 'single price',
      given: { input: ['USD 50.37'] },
      expect: { output: 'USD 50.37' },
    },
    // array syntax
    {
      description: 'array of prices',
      given: { input: ['USD 10.00', 'USD 20.00'], isArray: true },
      expect: { output: 'USD 30.00' },
    },
    {
      description: 'single item array',
      given: { input: ['USD 50.37'], isArray: true },
      expect: { output: 'USD 50.37' },
    },
    // mixed precision
    {
      description: 'centi + micro normalizes to micro',
      given: {
        input: [
          'USD 50.37',
          { amount: 5n, currency: 'USD', exponent: IsoPriceExponent.MICRO },
        ],
      },
      expect: { output: 'USD 50.370_005' },
    },
    {
      description: 'mixed exponents sum',
      given: {
        input: [
          {
            amount: 50370000n,
            currency: 'USD',
            exponent: IsoPriceExponent.MICRO,
          },
          { amount: 5n, currency: 'USD', exponent: IsoPriceExponent.MICRO },
        ],
      },
      expect: { output: 'USD 50.370_005' },
    },
    // human format input
    {
      description: 'human format input',
      given: { input: ['$10.00', '$20.00'] },
      expect: { output: 'USD 30.00' },
    },
    // shape format input
    {
      description: 'shape format input',
      given: {
        input: [
          { amount: 1000n, currency: 'USD' },
          { amount: 2000n, currency: 'USD' },
        ],
      },
      expect: { output: 'USD 30.00' },
    },
    {
      description: 'shape format number amount',
      given: {
        input: [
          { amount: 1000n, currency: 'USD' },
          { amount: 2000n, currency: 'USD' },
        ],
      },
      expect: { output: 'USD 30.00' },
    },
    // negative amounts
    {
      description: 'sums with negative',
      given: {
        input: [
          { amount: 5000n, currency: 'USD' },
          { amount: -2000n, currency: 'USD' },
        ],
      },
      expect: { output: 'USD 30.00' },
    },
    {
      description: 'result can be negative',
      given: {
        input: [
          { amount: -5000n, currency: 'USD' },
          { amount: -2000n, currency: 'USD' },
        ],
      },
      expect: { output: 'USD -70.00' },
    },
  ];

  CASES.forEach(({ description, given, expect: expected }) => {
    test(description, () => {
      const result = given.isArray
        ? sumPrices(given.input)
        : sumPrices(...given.input);
      expect(result).toEqual(expected.output);
    });
  });

  describe('.format-option', () => {
    test('default format is words', () => {
      const result = sumPrices(['USD 10.00', 'USD 20.00']);
      expect(result).toEqual('USD 30.00');
      expect(typeof result).toEqual('string');
    });

    test('explicit words format', () => {
      const result = sumPrices(['USD 10.00', 'USD 20.00'], { format: 'words' });
      expect(result).toEqual('USD 30.00');
    });

    test('shape format returns object', () => {
      const result = sumPrices(['USD 10.00', 'USD 20.00'], { format: 'shape' });
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
        sumPrices('USD 10.00', 'EUR 20.00' as any),
      );
      expect(error).toBeInstanceOf(BadRequestError);
      expect(error.message).toContain('currency mismatch');
    });

    test('throws on empty array', async () => {
      const error = await getError(async () => sumPrices([]));
      expect(error).toBeInstanceOf(BadRequestError);
      expect(error.message).toContain('empty');
    });
  });
});

describe('addPrices', () => {
  test('is alias for sumPrices', () => {
    const result = addPrices('USD 10.00', 'USD 20.00');
    expect(result).toEqual('USD 30.00');
  });
});
