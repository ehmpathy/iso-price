import { IsoPriceExponent } from './IsoPriceExponent';
import type { IsoPriceShape } from './IsoPriceShape';

describe('IsoPriceShape', () => {
  const SHAPE_CASES = [
    {
      description: 'basic usd shape',
      given: { input: { amount: 5037n, currency: 'USD' } },
      expect: {
        amountType: 'bigint',
        amount: 5037n as bigint | undefined,
        exponent: undefined as string | undefined,
      },
    },
    {
      description: 'with explicit exponent',
      given: {
        input: {
          amount: 3n,
          currency: 'USD',
          exponent: IsoPriceExponent.MICRO,
        },
      },
      expect: {
        amountType: 'bigint',
        amount: undefined as bigint | undefined,
        exponent: 'micro.x10^-6' as string | undefined,
      },
    },
  ];

  SHAPE_CASES.forEach(({ description, given, expect: expected }) => {
    test(description, () => {
      const shape: IsoPriceShape = given.input;
      expect(typeof shape.amount).toEqual(expected.amountType);
      if (expected.amount !== undefined)
        expect(shape.amount).toEqual(expected.amount);
      if (expected.exponent !== undefined)
        expect(shape.exponent).toEqual(expected.exponent);
    });
  });

  test('interface accepts explicit currency type', () => {
    const usdShape: IsoPriceShape<'USD'> = {
      amount: 5037n,
      currency: 'USD',
    };

    expect(usdShape.currency).toEqual('USD');
  });

  test('interface accepts explicit exponent type', () => {
    const microShape: IsoPriceShape<string, IsoPriceExponent.MICRO> = {
      amount: 3n,
      currency: 'USD',
      exponent: IsoPriceExponent.MICRO,
    };

    expect(microShape.exponent).toEqual('micro.x10^-6');
  });

  test('exponent is optional and defaults to undefined', () => {
    const shape: IsoPriceShape = {
      amount: 5037n,
      currency: 'USD',
    };

    expect(shape.exponent).toBeUndefined();
  });
});
