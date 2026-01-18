import { BadRequestError, UnexpectedCodePathError } from 'helpful-errors';

import { Price } from '@src/domain.objects/Price';

/**
 * .what = extracts the price out of word it is defined in
 * .why =
 *   - enable convenient definitions of prices
 */
export const ofPriceWord = (word: string): Price => {
  const match = word.match(/^\$(\d+)(?:\.(\d{2}))?$/);
  if (!match)
    throw new BadRequestError('invalid price format in word', { word });
  if (!match[1])
    throw new UnexpectedCodePathError(
      'could not extract dollars from word. should not have matched',
      { word },
    );
  const dollars = parseInt(match[1], 10);
  const cents = match[2] ? parseInt(match[2], 10) : 0;
  const amount = dollars * 100 + cents;
  return new Price({ amount: amount, currency: 'USD' });
};

export { ofPriceWord as castWordToPrice };
