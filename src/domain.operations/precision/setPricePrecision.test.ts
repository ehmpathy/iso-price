import { IsoPriceExponent } from '../../domain.objects/IsoPriceExponent';
import { IsoPriceRoundMode } from '../../domain.objects/IsoPriceRoundMode';
import { setPricePrecision } from './setPricePrecision';

describe('setPricePrecision', () => {
  const CASES = [
    // precision increase (lossless)
    {
      description: 'centi to micro',
      given: { input: { of: 'USD 50.37', to: IsoPriceExponent.MICRO } },
      expect: { output: 'USD 50.370_000' },
    },
    {
      description: 'centi to milli',
      given: { input: { of: 'USD 50.37', to: IsoPriceExponent.MILLI } },
      expect: { output: 'USD 50.370' },
    },
    {
      description: 'whole to centi',
      given: {
        input: {
          of: {
            amount: 1000n,
            currency: 'JPY',
            exponent: IsoPriceExponent.WHOLE,
          },
          to: IsoPriceExponent.CENTI,
        },
      },
      expect: { output: 'JPY 1_000.00' },
    },
    // same precision (no change)
    {
      description: 'centi to centi',
      given: { input: { of: 'USD 50.37', to: IsoPriceExponent.CENTI } },
      expect: { output: 'USD 50.37' },
    },
    // from words format
    {
      description: 'words format input',
      given: { input: { of: 'USD 50.37', to: IsoPriceExponent.MICRO } },
      expect: { output: 'USD 50.370_000' },
    },
    // from human format
    {
      description: 'human format input',
      given: { input: { of: '$50.37', to: IsoPriceExponent.MICRO } },
      expect: { output: 'USD 50.370_000' },
    },
  ];

  CASES.forEach(({ description, given, expect: expected }) => {
    test(description, () => {
      expect(setPricePrecision(given.input)).toEqual(expected.output);
    });
  });

  describe('.round-modes', () => {
    const ROUND_CASES = [
      // default half-up
      {
        description: 'default half-up',
        given: {
          input: {
            of: {
              amount: 5555n,
              currency: 'USD',
              exponent: IsoPriceExponent.MILLI,
            },
            to: IsoPriceExponent.CENTI,
          },
        },
        expect: { output: 'USD 5.56' },
      },
      // explicit round modes
      {
        description: 'floor round mode',
        given: {
          input: {
            of: {
              amount: 5555n,
              currency: 'USD',
              exponent: IsoPriceExponent.MILLI,
            },
            to: IsoPriceExponent.CENTI,
          },
          options: { round: IsoPriceRoundMode.FLOOR },
        },
        expect: { output: 'USD 5.55' },
      },
      {
        description: 'ceil round mode',
        given: {
          input: {
            of: {
              amount: 5551n,
              currency: 'USD',
              exponent: IsoPriceExponent.MILLI,
            },
            to: IsoPriceExponent.CENTI,
          },
          options: { round: IsoPriceRoundMode.CEIL },
        },
        expect: { output: 'USD 5.56' },
      },
      {
        description: 'half-down round mode',
        given: {
          input: {
            of: {
              amount: 5555n,
              currency: 'USD',
              exponent: IsoPriceExponent.MILLI,
            },
            to: IsoPriceExponent.CENTI,
          },
          options: { round: IsoPriceRoundMode.HALF_DOWN },
        },
        expect: { output: 'USD 5.55' },
      },
      {
        description: 'half-even round 5.555',
        given: {
          input: {
            of: {
              amount: 5555n,
              currency: 'USD',
              exponent: IsoPriceExponent.MILLI,
            },
            to: IsoPriceExponent.CENTI,
          },
          options: { round: IsoPriceRoundMode.HALF_EVEN },
        },
        expect: { output: 'USD 5.56' },
      },
      {
        description: 'half-even round 5.565',
        given: {
          input: {
            of: {
              amount: 5565n,
              currency: 'USD',
              exponent: IsoPriceExponent.MILLI,
            },
            to: IsoPriceExponent.CENTI,
          },
          options: { round: IsoPriceRoundMode.HALF_EVEN },
        },
        expect: { output: 'USD 5.56' },
      },
    ];

    ROUND_CASES.forEach(({ description, given, expect: expected }) => {
      test(description, () => {
        const result =
          'options' in given
            ? setPricePrecision(given.input, given.options)
            : setPricePrecision(given.input);
        expect(result).toEqual(expected.output);
      });
    });
  });

  describe('.negative-amounts', () => {
    const NEGATIVE_CASES = [
      {
        description: 'negative with half-up',
        given: {
          input: {
            of: {
              amount: -5555n,
              currency: 'USD',
              exponent: IsoPriceExponent.MILLI,
            },
            to: IsoPriceExponent.CENTI,
          },
        },
        expect: { output: 'USD -5.56' },
      },
      {
        description: 'negative with floor',
        given: {
          input: {
            of: {
              amount: -5551n,
              currency: 'USD',
              exponent: IsoPriceExponent.MILLI,
            },
            to: IsoPriceExponent.CENTI,
          },
          options: { round: IsoPriceRoundMode.FLOOR },
        },
        expect: { output: 'USD -5.56' },
      },
    ];

    NEGATIVE_CASES.forEach(({ description, given, expect: expected }) => {
      test(description, () => {
        const result =
          'options' in given
            ? setPricePrecision(given.input, given.options)
            : setPricePrecision(given.input);
        expect(result).toEqual(expected.output);
      });
    });
  });
});
