import { IsoPriceExponent } from '../../domain.objects/IsoPriceExponent';
import { isIsoPriceShape } from '../guard/isIsoPriceShape';
import { asIsoPriceShape } from './asIsoPriceShape';

describe('asIsoPriceShape', () => {
  const CASES = [
    // from words format
    {
      description: 'basic USD price',
      given: { input: 'USD 50.37' },
      expect: {
        output: { amount: 5037n, currency: 'USD', exponent: 'centi.x10^-2' },
      },
    },
    {
      description: 'price with underscore separators',
      given: { input: 'USD 1_000_000.00' },
      expect: {
        output: {
          amount: 100000000n,
          currency: 'USD',
          exponent: 'centi.x10^-2',
        },
      },
    },
    {
      description: 'no decimals (JPY style)',
      given: { input: 'JPY 1000' },
      expect: {
        output: { amount: 1000n, currency: 'JPY', exponent: 'whole.x10^0' },
      },
    },
    {
      description: 'micro precision',
      given: { input: 'USD 0.000_003' },
      expect: {
        output: { amount: 3n, currency: 'USD', exponent: 'micro.x10^-6' },
      },
    },
    {
      description: 'negative price',
      given: { input: 'USD -50.37' },
      expect: {
        output: { amount: -5037n, currency: 'USD', exponent: 'centi.x10^-2' },
      },
    },
    {
      description: 'zero price',
      given: { input: 'USD 0.00' },
      expect: {
        output: { amount: 0n, currency: 'USD', exponent: 'centi.x10^-2' },
      },
    },
    {
      description: 'bhd 3-decimal',
      given: { input: 'BHD 1.234' },
      expect: {
        output: { amount: 1234n, currency: 'BHD', exponent: 'milli.x10^-3' },
      },
    },
    // from shape format
    {
      description: 'bigint amount passthrough',
      given: { input: { amount: 5037n, currency: 'USD' } },
      expect: {
        output: { amount: 5037n, currency: 'USD', exponent: 'centi.x10^-2' },
      },
    },
    {
      description: 'number amount converts to bigint',
      given: { input: { amount: 5037, currency: 'USD' } },
      expect: {
        output: { amount: 5037n, currency: 'USD', exponent: 'centi.x10^-2' },
      },
    },
    {
      description: 'preserves exponent',
      given: {
        input: {
          amount: 3n,
          currency: 'USD',
          exponent: IsoPriceExponent.MICRO,
        },
      },
      expect: {
        output: { amount: 3n, currency: 'USD', exponent: 'micro.x10^-6' },
      },
    },
    // from human format
    {
      description: 'dollar symbol',
      given: { input: '$50.37' },
      expect: {
        output: { amount: 5037n, currency: 'USD', exponent: 'centi.x10^-2' },
      },
    },
    {
      description: 'dollar shorthand ($5)',
      given: { input: '$5' },
      expect: {
        output: { amount: 500n, currency: 'USD', exponent: 'centi.x10^-2' },
      },
    },
    {
      description: 'euro symbol',
      given: { input: '€100.00' },
      expect: {
        output: { amount: 10000n, currency: 'EUR', exponent: 'centi.x10^-2' },
      },
    },
    {
      description: 'with comma separators',
      given: { input: '$1,000,000.00' },
      expect: {
        output: {
          amount: 100000000n,
          currency: 'USD',
          exponent: 'centi.x10^-2',
        },
      },
    },
    {
      description: 'yen symbol',
      given: { input: '¥1,000' },
      expect: {
        output: { amount: 1000n, currency: 'JPY', exponent: 'whole.x10^0' },
      },
    },
    // c.13: serialize round-trip restoration
    {
      description: 'nano precision words to shape (round-trip)',
      given: { input: 'USD 25_000_000.000_000_000' },
      expect: {
        output: {
          amount: 25_000_000_000_000_000n,
          currency: 'USD',
          exponent: 'nano.x10^-9',
        },
      },
    },
    // c.15: custom currencies (crypto)
    {
      description: 'btc shape passthrough',
      given: {
        input: {
          amount: 100_000_000n,
          currency: 'BTC',
          exponent: IsoPriceExponent.NANO,
        },
      },
      expect: {
        output: {
          amount: 100_000_000n,
          currency: 'BTC',
          exponent: 'nano.x10^-9',
        },
      },
    },
    {
      description: 'eth from words',
      given: { input: 'ETH 1.00' },
      expect: {
        output: { amount: 100n, currency: 'ETH', exponent: 'centi.x10^-2' },
      },
    },
  ];

  CASES.forEach(({ description, given, expect: expected }) => {
    test(description, () => {
      const result = asIsoPriceShape(given.input);
      expect(result.amount).toEqual(expected.output.amount);
      expect(result.currency).toEqual(expected.output.currency);
      expect(result.exponent).toEqual(expected.output.exponent);
    });
  });

  describe('.type-coercion', () => {
    test('number amount converts to bigint type', () => {
      const result = asIsoPriceShape({ amount: 5037, currency: 'USD' });
      expect(typeof result.amount).toEqual('bigint');
    });
  });

  describe('.output-validation', () => {
    test('output is valid IsoPriceShape', () => {
      const result = asIsoPriceShape('USD 50.37');
      expect(isIsoPriceShape(result)).toBe(true);
    });
  });
});
