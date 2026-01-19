import { IsoCurrency } from './IsoCurrency';

describe('IsoCurrency', () => {
  // top 21 currencies by forex trade volume
  const TOP_21_CURRENCIES = [
    { description: 'usd', given: { currency: 'USD' } },
    { description: 'eur', given: { currency: 'EUR' } },
    { description: 'jpy', given: { currency: 'JPY' } },
    { description: 'gbp', given: { currency: 'GBP' } },
    { description: 'cny', given: { currency: 'CNY' } },
    { description: 'aud', given: { currency: 'AUD' } },
    { description: 'cad', given: { currency: 'CAD' } },
    { description: 'chf', given: { currency: 'CHF' } },
    { description: 'hkd', given: { currency: 'HKD' } },
    { description: 'nzd', given: { currency: 'NZD' } },
    { description: 'sek', given: { currency: 'SEK' } },
    { description: 'krw', given: { currency: 'KRW' } },
    { description: 'sgd', given: { currency: 'SGD' } },
    { description: 'nok', given: { currency: 'NOK' } },
    { description: 'mxn', given: { currency: 'MXN' } },
    { description: 'inr', given: { currency: 'INR' } },
    { description: 'zar', given: { currency: 'ZAR' } },
    { description: 'brl', given: { currency: 'BRL' } },
    { description: 'dkk', given: { currency: 'DKK' } },
    { description: 'pln', given: { currency: 'PLN' } },
    { description: 'thb', given: { currency: 'THB' } },
  ];

  // 4 currencies with 3-decimal exponent (milli.x10^-3)
  const THREE_DECIMAL_CURRENCIES = [
    { description: 'bhd (bahraini dinar)', given: { currency: 'BHD' } },
    { description: 'kwd (kuwaiti dinar)', given: { currency: 'KWD' } },
    { description: 'omr (omani rial)', given: { currency: 'OMR' } },
    { description: 'tnd (tunisian dinar)', given: { currency: 'TND' } },
  ];

  TOP_21_CURRENCIES.forEach(({ description, given }) => {
    test(`contains top currency: ${description}`, () => {
      const values = Object.values(IsoCurrency);
      expect(values).toContain(given.currency);
    });
  });

  THREE_DECIMAL_CURRENCIES.forEach(({ description, given }) => {
    test(`contains 3-decimal currency: ${description}`, () => {
      const values = Object.values(IsoCurrency);
      expect(values).toContain(given.currency);
    });
  });

  test('enum has exactly 25 values', () => {
    const values = Object.values(IsoCurrency);
    expect(values).toHaveLength(25);
  });

  test('enum values are uppercase 3-letter iso 4217 codes', () => {
    const values = Object.values(IsoCurrency);

    for (const value of values) {
      expect(value).toMatch(/^[A-Z]{3}$/);
    }
  });

  test('enum key matches value for all currencies', () => {
    const entries = Object.entries(IsoCurrency);

    for (const [key, value] of entries) {
      expect(key).toEqual(value);
    }
  });
});
