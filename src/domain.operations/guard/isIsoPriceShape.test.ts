import { BadRequestError } from 'helpful-errors';
import { getError } from 'test-fns';

import { IsoPriceExponent } from '../../domain.objects/IsoPriceExponent';
import { isIsoPriceShape } from './isIsoPriceShape';

describe('isIsoPriceShape', () => {
  const CASES = [
    // valid shape format
    {
      description: 'basic shape with bigint amount',
      given: { input: { amount: 5037n, currency: 'USD' } },
      expect: { output: true },
    },
    {
      description: 'jpy whole units',
      given: { input: { amount: 1000n, currency: 'JPY' } },
      expect: { output: true },
    },
    {
      description: 'shape with enum exponent',
      given: {
        input: {
          amount: 3n,
          currency: 'USD',
          exponent: IsoPriceExponent.MICRO,
        },
      },
      expect: { output: true },
    },
    {
      description: 'shape with string exponent',
      given: {
        input: { amount: 3n, currency: 'USD', exponent: 'micro.x10^-6' },
      },
      expect: { output: true },
    },
    {
      description: 'zero amount',
      given: { input: { amount: 0n, currency: 'USD' } },
      expect: { output: true },
    },
    {
      description: 'negative amount',
      given: { input: { amount: -5037n, currency: 'USD' } },
      expect: { output: true },
    },
    {
      description: 'large amount',
      given: { input: { amount: 9007199254740991n, currency: 'USD' } },
      expect: { output: true },
    },
    {
      description: 'bhd 3-decimal currency',
      given: { input: { amount: 1234n, currency: 'BHD' } },
      expect: { output: true },
    },
    // invalid shape format
    {
      description: 'number instead of bigint',
      given: { input: { amount: 5037, currency: 'USD' } },
      expect: { output: false },
    },
    {
      description: 'currency absent',
      given: { input: { amount: 5037n } },
      expect: { output: false },
    },
    {
      description: 'amount absent',
      given: { input: { currency: 'USD' } },
      expect: { output: false },
    },
    {
      description: 'words string',
      given: { input: 'USD 50.37' },
      expect: { output: false },
    },
    {
      description: 'human string',
      given: { input: '$50.37' },
      expect: { output: false },
    },
    { description: 'null', given: { input: null }, expect: { output: false } },
    {
      description: 'undefined',
      given: { input: undefined },
      expect: { output: false },
    },
    {
      description: 'array',
      given: { input: [5037n, 'USD'] },
      expect: { output: false },
    },
    {
      description: 'exponent as number',
      given: { input: { amount: 5037n, currency: 'USD', exponent: 2 } },
      expect: { output: false },
    },
    {
      description: 'empty object',
      given: { input: {} },
      expect: { output: false },
    },
    {
      description: 'currency as number',
      given: { input: { amount: 5037n, currency: 840 } },
      expect: { output: false },
    },
  ];

  CASES.forEach(({ description, given, expect: expected }) => {
    test(description, () => {
      expect(isIsoPriceShape(given.input)).toBe(expected.output);
    });
  });

  describe('.assure', () => {
    const ASSURE_CASES = [
      {
        description: 'valid shape does not throw',
        given: { input: { amount: 5037n, currency: 'USD' } },
        expect: { throws: false },
      },
      {
        description: 'number amount throws',
        given: { input: { amount: 5037, currency: 'USD' } },
        expect: { throws: true },
      },
      {
        description: 'words format throws',
        given: { input: 'USD 50.37' },
        expect: { throws: true },
      },
    ];

    ASSURE_CASES.forEach(({ description, given, expect: expected }) => {
      test(description, async () => {
        if (expected.throws) {
          const error = await getError(() =>
            isIsoPriceShape.assure(given.input),
          );
          expect(error).toBeInstanceOf(BadRequestError);
        } else {
          expect(() => isIsoPriceShape.assure(given.input)).not.toThrow();
        }
      });
    });
  });
});
