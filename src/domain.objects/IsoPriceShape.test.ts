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

  test('interface accepts enum exponent', () => {
    const microShape: IsoPriceShape = {
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

  describe('.ts-expect-error', () => {
    test('rejects number amount at compile time', () => {
      // @ts-expect-error - amount must be bigint, not number
      const _shape: IsoPriceShape = { amount: 5037, currency: 'USD' };
      expect(_shape).toBeDefined(); // runtime passes, but compile fails
    });

    test('rejects absent currency at compile time', () => {
      // @ts-expect-error - currency is required
      const _shape: IsoPriceShape = { amount: 5037n };
      expect(_shape).toBeDefined();
    });

    test('rejects absent amount at compile time', () => {
      // @ts-expect-error - amount is required
      const _shape: IsoPriceShape = { currency: 'USD' };
      expect(_shape).toBeDefined();
    });

    test('rejects invalid exponent at compile time', () => {
      const _shape: IsoPriceShape = {
        amount: 5037n,
        currency: 'USD',
        // @ts-expect-error - exponent must be IsoPriceExponent, not arbitrary string
        exponent: 'invalid',
      };
      expect(_shape).toBeDefined();
    });
  });
});
