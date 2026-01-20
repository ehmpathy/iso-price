import { getError } from 'test-fns';

import { IsoPriceExponent } from '../../domain.objects/IsoPriceExponent';
import { calcPriceAvg } from './calcPriceAvg';

describe('calcPriceAvg', () => {
  const CASES = [
    // basic average
    {
      description: 'average of two prices',
      given: { input: ['USD 10.00', 'USD 20.00'] },
      expect: { output: 'USD 15.00' },
    },
    {
      description: 'average of three prices',
      given: { input: ['USD 10.00', 'USD 20.00', 'USD 30.00'] },
      expect: { output: 'USD 20.00' },
    },
    {
      description: 'single price',
      given: { input: ['USD 50.00'] },
      expect: { output: 'USD 50.00' },
    },
    {
      description: 'four prices',
      given: {
        input: ['USD 100.00', 'USD 200.00', 'USD 300.00', 'USD 400.00'],
      },
      expect: { output: 'USD 250.00' },
    },
    // truncation behavior
    {
      description: 'truncates toward zero',
      given: { input: ['USD 10.00', 'USD 20.00', 'USD 21.00'] },
      expect: { output: 'USD 17.00' },
    },
    {
      description: 'non-divisible amounts',
      given: { input: ['USD 1.00', 'USD 1.00', 'USD 2.00'] },
      expect: { output: 'USD 1.33' },
    },
    // input formats
    {
      description: 'words format input',
      given: { input: ['USD 10.00', 'USD 20.00'] },
      expect: { output: 'USD 15.00' },
    },
    {
      description: 'shape format input',
      given: {
        input: [
          { amount: 1000n, currency: 'USD' },
          { amount: 2000n, currency: 'USD' },
        ],
      },
      expect: { output: 'USD 15.00' },
    },
    {
      description: 'human format input',
      given: { input: ['$10.00', '$20.00'] },
      expect: { output: 'USD 15.00' },
    },
    {
      description: 'mixed input formats',
      given: {
        input: ['USD 10.00', { amount: 2000n, currency: 'USD' }, '$30.00'],
      },
      expect: { output: 'USD 20.00' },
    },
    // negative amounts
    {
      description: 'negative average',
      given: { input: ['USD -10.00', 'USD -20.00'] },
      expect: { output: 'USD -15.00' },
    },
    {
      description: 'mixed positive and negative',
      given: { input: ['USD 10.00', 'USD -10.00'] },
      expect: { output: 'USD 0.00' },
    },
  ];

  CASES.forEach(({ description, given, expect: expected }) => {
    test(description, () => {
      expect(calcPriceAvg(given.input)).toEqual(expected.output);
    });
  });

  describe('.format-option', () => {
    test('default format is words', () => {
      const result = calcPriceAvg(['USD 10.00', 'USD 20.00']);
      expect(typeof result).toBe('string');
      expect(result).toEqual('USD 15.00');
    });

    test('shape format returns object', () => {
      const result = calcPriceAvg(['USD 10.00', 'USD 20.00'], {
        format: 'shape',
      });
      expect(result).toEqual({
        amount: 1500n,
        currency: 'USD',
        exponent: IsoPriceExponent.CENTI,
      });
    });
  });

  describe('.mixed-precision', () => {
    test('normalizes to highest precision', () => {
      const result = calcPriceAvg(
        [
          { amount: 1000n, currency: 'USD', exponent: IsoPriceExponent.CENTI }, // $10.00
          {
            amount: 2000000n,
            currency: 'USD',
            exponent: IsoPriceExponent.MICRO,
          }, // $2.00
        ],
        { format: 'shape' },
      );
      // $10.00 + $2.00 = $12.00, avg = $6.00 = 6000000 micro
      expect(result).toEqual({
        amount: 6000000n,
        currency: 'USD',
        exponent: IsoPriceExponent.MICRO,
      });
    });
  });

  describe('.error', () => {
    test('throws on empty array', () => {
      const error = getError(() => calcPriceAvg([]));
      expect(error).toBeDefined();
      expect(error?.message).toContain('empty array');
    });

    test('throws on mixed currencies', () => {
      const error = getError(() => calcPriceAvg(['USD 10.00', 'EUR 20.00']));
      expect(error).toBeDefined();
      expect(error?.message).toContain('mixed currencies');
    });
  });
});
