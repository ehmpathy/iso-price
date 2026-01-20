import { IsoPriceExponent } from '../../domain.objects/IsoPriceExponent';
import { isIsoPriceWords } from '../guard/isIsoPriceWords';
import { asIsoPriceWords } from './asIsoPriceWords';

describe('asIsoPriceWords', () => {
  const CASES = [
    // from shape format
    {
      description: 'basic USD price',
      given: { input: { amount: 5037n, currency: 'USD' } },
      expect: { output: 'USD 50.37' },
    },
    {
      description: 'large amount with underscore separators',
      given: { input: { amount: 100000000n, currency: 'USD' } },
      expect: { output: 'USD 1_000_000.00' },
    },
    {
      description: 'zero price',
      given: { input: { amount: 0n, currency: 'USD' } },
      expect: { output: 'USD 0.00' },
    },
    {
      description: 'negative price',
      given: { input: { amount: -5037n, currency: 'USD' } },
      expect: { output: 'USD -50.37' },
    },
    {
      description: 'small amount (1 cent)',
      given: { input: { amount: 1n, currency: 'USD' } },
      expect: { output: 'USD 0.01' },
    },
    {
      description: 'micro precision shape',
      given: {
        input: {
          amount: 3n,
          currency: 'USD',
          exponent: IsoPriceExponent.MICRO,
        },
      },
      expect: { output: 'USD 0.000_003' },
    },
    // from human format
    {
      description: 'dollar symbol',
      given: { input: '$50.37' },
      expect: { output: 'USD 50.37' },
    },
    {
      description: 'euro symbol',
      given: { input: '€100.00' },
      expect: { output: 'EUR 100.00' },
    },
    {
      description: 'with comma separators',
      given: { input: '$1,000,000.00' },
      expect: { output: 'USD 1_000_000.00' },
    },
    // from words format (normalization)
    {
      description: 'words passthrough',
      given: { input: 'USD 50.37' },
      expect: { output: 'USD 50.37' },
    },
    {
      description: 'words normalizes large numbers',
      given: { input: 'USD 1000000.00' },
      expect: { output: 'USD 1_000_000.00' },
    },
    // c.13: serialize - high-precision round-trip
    {
      description: 'nano precision shape to words',
      given: {
        input: {
          amount: 25_000_000_000_000_000n,
          currency: 'USD',
          exponent: IsoPriceExponent.NANO,
        },
      },
      expect: { output: 'USD 25_000_000.000_000_000' },
    },
    // c.15: custom currencies (crypto)
    {
      description: 'btc satoshi precision',
      given: {
        input: {
          amount: 100_000_000n,
          currency: 'BTC',
          exponent: IsoPriceExponent.NANO,
        },
      },
      expect: { output: 'BTC 0.100_000_000' },
    },
    {
      description: 'eth wei precision',
      given: {
        input: {
          amount: 1_000_000_000_000_000_000n,
          currency: 'ETH',
          exponent: IsoPriceExponent.PICO,
        },
      },
      expect: { output: 'ETH 1_000_000.000_000_000_000' },
    },
  ];

  CASES.forEach(({ description, given, expect: expected }) => {
    test(description, () => {
      expect(asIsoPriceWords(given.input)).toEqual(expected.output);
    });
  });

  describe('.output-validation', () => {
    test('output is valid IsoPriceWords', () => {
      const result = asIsoPriceWords({ amount: 5037n, currency: 'USD' });
      expect(isIsoPriceWords(result)).toBe(true);
    });
  });
});
