import { BadRequestError, getError } from 'helpful-errors';

import { asIsoPriceSorted } from './asIsoPriceSorted';

describe('asIsoPriceSorted', () => {
  // c.6: sort.default — default asc order
  describe('.default-order', () => {
    test('sorts in asc order by default', () => {
      const prices = ['USD 100.00', 'USD 9.00', 'USD 50.00'];
      const result = asIsoPriceSorted(prices);
      expect(result).toEqual(['USD 9.00', 'USD 50.00', 'USD 100.00']);
    });

    test('demonstrates string comparison footgun avoided', () => {
      // string comparison: '100' < '9' because '1' < '9'
      expect('USD 100.00' > 'USD 9.00').toBe(false); // footgun!

      // numeric sort: 100 > 9
      const sorted = asIsoPriceSorted(['USD 100.00', 'USD 9.00']);
      expect(sorted).toEqual(['USD 9.00', 'USD 100.00']);
    });
  });

  // c.7: sort.options — order option
  describe('.options-order', () => {
    test('asc option returns asc order', () => {
      const prices = ['USD 100.00', 'USD 9.00', 'USD 50.00'];
      const result = asIsoPriceSorted(prices, { order: 'asc' });
      expect(result).toEqual(['USD 9.00', 'USD 50.00', 'USD 100.00']);
    });

    test('desc option returns desc order', () => {
      const prices = ['USD 100.00', 'USD 9.00', 'USD 50.00'];
      const result = asIsoPriceSorted(prices, { order: 'desc' });
      expect(result).toEqual(['USD 100.00', 'USD 50.00', 'USD 9.00']);
    });
  });

  // c.8: sort.methods — .asc and .desc variants
  describe('.method-variants', () => {
    test('asIsoPriceSorted.asc returns asc order', () => {
      const prices = ['USD 100.00', 'USD 9.00', 'USD 50.00'];
      const result = asIsoPriceSorted.asc(prices);
      expect(result).toEqual(['USD 9.00', 'USD 50.00', 'USD 100.00']);
    });

    test('asIsoPriceSorted.desc returns desc order', () => {
      const prices = ['USD 100.00', 'USD 9.00', 'USD 50.00'];
      const result = asIsoPriceSorted.desc(prices);
      expect(result).toEqual(['USD 100.00', 'USD 50.00', 'USD 9.00']);
    });
  });

  // c.9: sort.immutable — returns new array
  describe('.immutable', () => {
    test('original array is not mutated', () => {
      const original = ['USD 100.00', 'USD 9.00'];
      const sorted = asIsoPriceSorted(original);

      expect(original).toEqual(['USD 100.00', 'USD 9.00']); // unchanged
      expect(sorted).toEqual(['USD 9.00', 'USD 100.00']); // sorted
    });

    test('returns different reference', () => {
      const original = ['USD 100.00', 'USD 9.00'];
      const sorted = asIsoPriceSorted(original);
      expect(original).not.toBe(sorted);
    });
  });

  // c.10: sort.precision-normalization
  describe('.precision-normalization', () => {
    test('sorts mixed precision correctly', () => {
      const prices = ['USD 1.00', 'USD 0.000_001', 'USD 0.50'];
      const result = asIsoPriceSorted(prices);
      expect(result).toEqual(['USD 0.000_001', 'USD 0.50', 'USD 1.00']);
    });

    test('sorts mixed precision desc correctly', () => {
      const prices = ['USD 1.00', 'USD 0.000_001', 'USD 0.50'];
      const result = asIsoPriceSorted.desc(prices);
      expect(result).toEqual(['USD 1.00', 'USD 0.50', 'USD 0.000_001']);
    });
  });

  // c.11: sort.currency-mismatch
  describe('.currency-mismatch', () => {
    test('failsfast with different currencies', async () => {
      const error = await getError(async () =>
        asIsoPriceSorted(['USD 100.00', 'EUR 50.00'] as any),
      );
      expect(error).toBeInstanceOf(BadRequestError);
      expect(error.message).toContain('different currencies');
    });
  });

  // c.12: sort.empty
  describe('.empty-array', () => {
    test('returns empty array for empty input', () => {
      expect(asIsoPriceSorted([])).toEqual([]);
    });

    test('does not throw for empty input', () => {
      expect(() => asIsoPriceSorted([])).not.toThrow();
    });
  });

  // c.13: sort.single
  describe('.single-element', () => {
    test('returns array with same element', () => {
      const result = asIsoPriceSorted(['USD 100.00']);
      expect(result).toEqual(['USD 100.00']);
    });

    test('returns new reference for single element', () => {
      const original = ['USD 100.00'];
      const sorted = asIsoPriceSorted(original);
      expect(original).not.toBe(sorted);
    });
  });

  // c.14: sort.duplicates
  describe('.duplicates', () => {
    test('preserves duplicates in output', () => {
      const prices = ['USD 50.00', 'USD 100.00', 'USD 50.00'];
      const result = asIsoPriceSorted(prices);
      expect(result).toEqual(['USD 50.00', 'USD 50.00', 'USD 100.00']);
    });
  });

  // c.15: sort.stable
  describe('.stable-sort', () => {
    test('preserves relative order of equal elements', () => {
      const prices = ['USD 50.00', 'USD 50.000_000', 'USD 50'];
      // all three represent the same numeric value
      const result = asIsoPriceSorted(prices);
      // order should be preserved: first 50.00, then 50.000_000, then 50
      // (note: output is normalized via asIsoPriceWords, so 'USD 50' becomes 'USD 50.00')
      expect(result).toEqual(['USD 50.00', 'USD 50.000_000', 'USD 50.00']);
    });
  });

  // c.16: input.mixed-formats
  describe('.mixed-formats', () => {
    test('accepts words format', () => {
      const result = asIsoPriceSorted(['USD 100.00', 'USD 9.00']);
      expect(result).toEqual(['USD 9.00', 'USD 100.00']);
    });

    test('accepts shape format', () => {
      const result = asIsoPriceSorted([
        { amount: 10000n, currency: 'USD' },
        { amount: 900n, currency: 'USD' },
      ]);
      expect(result).toEqual(['USD 9.00', 'USD 100.00']);
    });

    test('accepts human format', () => {
      const result = asIsoPriceSorted(['$100.00', '$9.00']);
      expect(result).toEqual(['USD 9.00', 'USD 100.00']);
    });

    test('accepts mixed formats and returns words', () => {
      const result = asIsoPriceSorted([
        'USD 100.00',
        { amount: 900n, currency: 'USD' },
        '$50.00',
      ]);
      expect(result).toEqual(['USD 9.00', 'USD 50.00', 'USD 100.00']);
    });
  });

  // additional boundary cases
  describe('.boundaries', () => {
    test('handles negative values', () => {
      const prices = ['USD 10.00', 'USD -5.00', 'USD 0.00'];
      const result = asIsoPriceSorted(prices);
      expect(result).toEqual(['USD -5.00', 'USD 0.00', 'USD 10.00']);
    });

    test('handles negative values desc', () => {
      const prices = ['USD 10.00', 'USD -5.00', 'USD 0.00'];
      const result = asIsoPriceSorted.desc(prices);
      expect(result).toEqual(['USD 10.00', 'USD 0.00', 'USD -5.00']);
    });

    test('handles very large values', () => {
      const prices = ['USD 1.00', 'USD 999_999_999.99', 'USD 500.00'];
      const result = asIsoPriceSorted(prices);
      expect(result).toEqual(['USD 1.00', 'USD 500.00', 'USD 999_999_999.99']);
    });

    test('handles very small values', () => {
      const prices = ['USD 0.01', 'USD 0.000_000_001', 'USD 0.001'];
      const result = asIsoPriceSorted(prices);
      expect(result).toEqual(['USD 0.000_000_001', 'USD 0.001', 'USD 0.01']);
    });

    test('works with euro', () => {
      const prices = ['EUR 100.00', 'EUR 9.00', 'EUR 50.00'];
      const result = asIsoPriceSorted(prices);
      expect(result).toEqual(['EUR 9.00', 'EUR 50.00', 'EUR 100.00']);
    });

    test('works with jpy (no decimals)', () => {
      const prices = ['JPY 1000', 'JPY 500', 'JPY 100'];
      const result = asIsoPriceSorted(prices);
      // note: output is normalized via asIsoPriceWords with underscore separators
      expect(result).toEqual(['JPY 100', 'JPY 500', 'JPY 1_000']);
    });
  });
});
