import { UnexpectedCodePathError } from 'helpful-errors';
import { getError } from 'test-fns';

import { Price } from '@src/domain.objects/Price';

import { ofPriceWord } from './ofPriceWord';

describe('ofPriceWord', () => {
  const cases: {
    input: string;
    output?: Price;
    error?: { message: string };
  }[] = [
    {
      input: '$8.21',
      output: new Price({ amount: 821, currency: 'USD' }),
    },
    {
      input: '$8',
      output: new Price({ amount: 800, currency: 'USD' }),
    },
    {
      input: '8',
      error: { message: 'invalid price format in word' },
    },
  ];

  cases.forEach((thisCase) =>
    thisCase.output
      ? it(`should extract the price correctly for input '${thisCase.input}'`, () => {
          expect(ofPriceWord(thisCase.input)).toEqual(thisCase.output);
        })
      : thisCase.error
        ? it(`should throw an error for input '${thisCase.input}`, () => {
            const error = getError(() => ofPriceWord(thisCase.input));
            expect(error.message).toContain(thisCase.error?.message);
          })
        : (() => {
            throw new UnexpectedCodePathError(
              'neither output nor error were specified in the test case',
            );
          })(),
  );
});
