import { given, then, when } from 'test-fns';

import {
  asIsoPriceShape,
  dividePrice,
  IsoPriceExponent,
  multiplyPrice,
  roundPrice,
  sumPrices,
} from './index';

/**
 * .what = acceptance tests for iso-price contract
 * .why = blackbox tests that verify the vision.experience.1 llm cost track flow
 */
describe('iso-price acceptance', () => {
  given('[case1] llm inference cost track', () => {
    when('[t0] before any changes', () => {
      then('dividePrice computes per-token rate at nano precision', () => {
        // claude input cost: $0.25 per 1M tokens
        const inputRate = dividePrice({ of: '$0.25', by: 1_000_000 });
        expect(inputRate).toEqual('USD 0.000_000_250');
      });
    });

    when('[t1] track each inference', () => {
      then('multiplyPrice computes token cost', () => {
        // per-token rate from previous step
        const inputRate = dividePrice({ of: '$0.25', by: 1_000_000 });

        // one inference: 47,382 input tokens
        const inputCost = multiplyPrice({ of: inputRate, by: 47_382 });
        expect(inputCost).toEqual('USD 0.011_845_500');
      });
    });

    when('[t2] accumulate for bill period', () => {
      then('sumPrices accumulates costs', () => {
        // accumulated costs over bill period
        const costs = ['USD 0.011_845_500', 'USD 47.370_001_970'];
        const subtotal = sumPrices(costs);
        expect(subtotal).toEqual('USD 47.381_847_470');
      });
    });

    when('[t3] apply markup and invoice', () => {
      then('multiplyPrice applies markup', () => {
        const subtotal = 'USD 47.381_847_470';

        // 1% markup (maintains nano precision with round)
        const withMarkup = multiplyPrice({ of: subtotal, by: 1.01 });
        expect(withMarkup).toEqual('USD 47.855_665_945');
      });

      then('roundPrice rounds to cents for stripe', () => {
        const withMarkup = 'USD 47.855_665_945';

        // round to cents for payment processor
        const invoiceRounded = roundPrice({
          of: withMarkup,
          to: IsoPriceExponent.CENTI,
        });
        expect(invoiceRounded).toEqual('USD 47.86');

        // convert to shape for stripe integration
        const invoiceTotal = asIsoPriceShape(invoiceRounded);
        expect(invoiceTotal).toEqual({
          amount: 4786n,
          currency: 'USD',
          exponent: 'centi.x10^-2',
        });
      });
    });

    when('[t4] integrate with stripe', () => {
      then('shape provides integer cents', () => {
        const invoiceTotal = { amount: 4786n, currency: 'USD' };

        // stripe expects amount in cents as integer
        expect(Number(invoiceTotal.amount)).toEqual(4786);
        expect(invoiceTotal.currency.toLowerCase()).toEqual('usd');
      });
    });
  });
});
