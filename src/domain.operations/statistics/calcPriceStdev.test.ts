import { getError } from 'test-fns';

import { IsoPriceExponent } from '../../domain.objects/IsoPriceExponent';
import { calcPriceStdev } from './calcPriceStdev';

describe('calcPriceStdev', () => {
  const CASES = [
    // basic stdev
    {
      description: 'identical prices is zero',
      given: { input: ['USD 10.00', 'USD 10.00', 'USD 10.00'] },
      expect: { output: 'USD 0.00' },
    },
    {
      description: 'two values',
      given: { input: ['USD 10.00', 'USD 20.00'] },
      expect: { output: 'USD 5.00' },
    },
    {
      description: 'symmetric distribution',
      given: { input: ['USD 0.00', 'USD 10.00', 'USD 20.00'] },
      expect: { output: 'USD 8.16' },
    },
    // single value
    {
      description: 'single value is zero',
      given: { input: ['USD 50.00'] },
      expect: { output: 'USD 0.00' },
    },
    // input formats
    {
      description: 'words format input',
      given: { input: ['USD 10.00', 'USD 20.00'] },
      expect: { output: 'USD 5.00' },
    },
    {
      description: 'human format input',
      given: { input: ['$10.00', '$20.00'] },
      expect: { output: 'USD 5.00' },
    },
    // larger dataset
    {
      description: 'classic 8-value example',
      given: {
        input: [
          'USD 2.00',
          'USD 4.00',
          'USD 4.00',
          'USD 4.00',
          'USD 5.00',
          'USD 5.00',
          'USD 7.00',
          'USD 9.00',
        ],
      },
      expect: { output: 'USD 2.00' },
    },
  ];

  CASES.forEach(({ description, given, expect: expected }) => {
    test(description, () => {
      expect(calcPriceStdev(given.input)).toEqual(expected.output);
    });
  });

  describe('.format-option', () => {
    test('default format is words', () => {
      const result = calcPriceStdev(['USD 10.00', 'USD 20.00']);
      expect(typeof result).toBe('string');
    });

    test('shape format returns object', () => {
      const result = calcPriceStdev(['USD 10.00', 'USD 20.00'], {
        format: 'shape',
      });
      expect(result).toEqual({
        amount: 500n,
        currency: 'USD',
        exponent: IsoPriceExponent.CENTI,
      });
    });
  });

  describe('.precision', () => {
    test('preserves precision in result', () => {
      const result = calcPriceStdev(
        [
          { amount: 1000n, currency: 'USD', exponent: IsoPriceExponent.CENTI },
          { amount: 2000n, currency: 'USD', exponent: IsoPriceExponent.CENTI },
        ],
        { format: 'shape' },
      );
      expect(result.exponent).toEqual(IsoPriceExponent.CENTI);
    });
  });

  describe('.error', () => {
    test('throws on empty array', () => {
      const error = getError(() => calcPriceStdev([]));
      expect(error).toBeDefined();
      expect(error?.message).toContain('empty array');
    });

    test('throws on mixed currencies', () => {
      const error = getError(() => calcPriceStdev(['USD 10.00', 'EUR 20.00']));
      expect(error).toBeDefined();
      expect(error?.message).toContain('mixed currencies');
    });
  });
});
