import { IsoPriceExponent } from '../../domain.objects/IsoPriceExponent';
import { IsoPriceRoundMode } from '../../domain.objects/IsoPriceRoundMode';
import { roundPrice } from './roundPrice';

describe('roundPrice', () => {
  const CASES = [
    // default half-up round
    {
      description: 'default half-up 50.375',
      given: {
        input: {
          of: {
            amount: 50375n,
            currency: 'USD',
            exponent: IsoPriceExponent.MILLI,
          },
          to: IsoPriceExponent.CENTI,
        },
      },
      expect: { output: 'USD 50.38' },
    },
    {
      description: 'default half-up 50.374',
      given: { input: { of: 'USD 50.374', to: IsoPriceExponent.CENTI } },
      expect: { output: 'USD 50.37' },
    },
    {
      description: 'half-up 47.856_675',
      given: { input: { of: 'USD 47.856_675', to: IsoPriceExponent.CENTI } },
      expect: { output: 'USD 47.86' },
    },
    // explicit round modes
    {
      description: 'explicit floor round',
      given: {
        input: {
          of: {
            amount: 50375n,
            currency: 'USD',
            exponent: IsoPriceExponent.MILLI,
          },
          to: IsoPriceExponent.CENTI,
        },
        options: { round: IsoPriceRoundMode.FLOOR },
      },
      expect: { output: 'USD 50.37' },
    },
    {
      description: 'explicit ceil round',
      given: {
        input: {
          of: {
            amount: 50371n,
            currency: 'USD',
            exponent: IsoPriceExponent.MILLI,
          },
          to: IsoPriceExponent.CENTI,
        },
        options: { round: IsoPriceRoundMode.CEIL },
      },
      expect: { output: 'USD 50.38' },
    },
    {
      description: 'floor 5.555',
      given: {
        input: { of: 'USD 5.555', to: IsoPriceExponent.CENTI },
        options: { round: IsoPriceRoundMode.FLOOR },
      },
      expect: { output: 'USD 5.55' },
    },
    // from words format
    {
      description: 'from words format',
      given: { input: { of: 'USD 50.375', to: IsoPriceExponent.CENTI } },
      expect: { output: 'USD 50.38' },
    },
    // from human format
    {
      description: 'from human format',
      given: { input: { of: '$50.375', to: IsoPriceExponent.CENTI } },
      expect: { output: 'USD 50.38' },
    },
  ];

  CASES.forEach(({ description, given, expect: expected }) => {
    test(description, () => {
      const result =
        'options' in given
          ? roundPrice(given.input, given.options)
          : roundPrice(given.input);
      expect(result).toEqual(expected.output);
    });
  });
});
