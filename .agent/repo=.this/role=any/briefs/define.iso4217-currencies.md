# iso 4217 currencies

## .what

iso 4217 defines internationally recognized 3-letter codes for currencies. it is maintained by SIX Financial Information AG on behalf of the Swiss Association for Standardization.

## .how many currencies

| category | count |
|----------|-------|
| active national/regional currencies | ~180 |
| supranational currencies, funds, precious metals | ~120 |
| total (with historical codes) | ~300 |

the ~180 active currencies cover 195 countries. additional codes exist for:
- precious metals: gold (XAU), silver (XAG), palladium (XPD), platinum (XPT)
- supranational: SDR (XDR), European Currency Unit historical (XEU)
- procedural: test currency (XTS), no currency (XXX)
- historical/discontinued currencies (List 3)

## .how often it changes

iso 4217 has been amended **~180 times** since its first edition in 1978 — approximately **4 amendments per year** on average.

changes occur due to:
- new countries (e.g., South Sudan SSP in 2011)
- monetary unions (e.g., EUR replaced 12+ currencies in 1999)
- currency replacements (e.g., Bulgaria BGN → EUR in 2026)
- redenominations due to inflation (e.g., Zimbabwe ZWL)
- regional changes (e.g., Caribbean Guilder XCG in 2025)

recent amendments:
- **amendment 180** (2025): Bulgaria joins eurozone, BGN moves to historical
- **amendment 178** (2025): Cuban Peso Convertible (CUC) moved to historical
- **amendment 176** (2025): Caribbean Guilder (XCG) introduced

## .top 21 currencies by trade volume

based on forex market data (~$7 trillion daily volume):

| rank | code | currency | notes |
|------|------|----------|-------|
| 1 | USD | US Dollar | ~90% of forex transactions |
| 2 | EUR | Euro | 20 eurozone countries |
| 3 | JPY | Japanese Yen | major reserve currency |
| 4 | GBP | British Pound | London as global finance hub |
| 5 | CNY | Chinese Yuan | rapid growth in trade share |
| 6 | AUD | Australian Dollar | commodity-linked |
| 7 | CAD | Canadian Dollar | oil price correlation |
| 8 | CHF | Swiss Franc | safe-haven currency |
| 9 | HKD | Hong Kong Dollar | pegged to USD |
| 10 | NZD | New Zealand Dollar | commodity-linked |
| 11 | SEK | Swedish Krona | nordic economy |
| 12 | KRW | South Korean Won | tech export economy |
| 13 | SGD | Singapore Dollar | asian finance hub |
| 14 | NOK | Norwegian Krone | oil-linked |
| 15 | MXN | Mexican Peso | growth market |
| 16 | INR | Indian Rupee | large population economy |
| 17 | ZAR | South African Rand | commodity-linked |
| 18 | BRL | Brazilian Real | growth market |
| 19 | DKK | Danish Krone | pegged to EUR |
| 20 | PLN | Polish Zloty | EU non-eurozone |
| 21 | THB | Thai Baht | southeast asian economy |

## .exponent distribution

| exponent | currencies | examples |
|----------|------------|----------|
| 0 (whole units) | ~7 | JPY, KRW, VND, IDR |
| 2 (cents) | ~160 | USD, EUR, GBP, AUD |
| 3 (thousandths) | ~4 | BHD, KWD, OMR, TND |

most currencies (>95%) use exponent 2 (cents). iso-price defaults to the iso 4217 standard exponent for each currency.

## .appendix: default exponent

since >95% of currencies use exponent 2, iso-price can safely default to `'centi.x10^-2'` when no currency-specific override is registered. this covers:

- all major traded currencies (USD, EUR, GBP, AUD, CAD, etc.)
- most minor currencies
- unknown or custom currency codes (e.g., crypto: BTC, ETH)

only ~11 currencies need explicit overrides:
- exponent 0: JPY, KRW, VND, IDR, CLP, PYG, UGX
- exponent 3: BHD, KWD, OMR, TND

this "default to 2, override when known" approach minimizes configuration while it retains correctness for standard iso 4217 currencies.

## .appendix: IsoCurrency enum

iso-price provides an `IsoCurrency` enum for both compile-time and runtime use:

```ts
enum IsoCurrency {
  USD = 'USD', EUR = 'EUR', JPY = 'JPY', GBP = 'GBP', CNY = 'CNY',
  AUD = 'AUD', CAD = 'CAD', CHF = 'CHF', HKD = 'HKD', NZD = 'NZD',
  SEK = 'SEK', KRW = 'KRW', SGD = 'SGD', NOK = 'NOK', MXN = 'MXN',
  INR = 'INR', ZAR = 'ZAR', BRL = 'BRL', DKK = 'DKK', PLN = 'PLN',
  THB = 'THB', BHD = 'BHD', KWD = 'KWD', OMR = 'OMR', TND = 'TND',
}
```

this includes:
- top 21 currencies by forex trade volume
- 4 currencies with 3-decimal exponent (BHD, KWD, OMR, TND)

use with `IsoPriceShape<IsoCurrency>` for type-safe ISO 4217 enforcement. custom currencies (BTC, ETH) remain supported via `IsoPriceShape<string>` or `IsoPriceShape<'BTC'>`.

iso-price also exports `getIsoPriceExponentByCurrency` for lookup of the standard exponent per currency:

```ts
getIsoPriceExponentByCurrency('USD')  // => 'centi.x10^-2' (default)
getIsoPriceExponentByCurrency('JPY')  // => 'whole.x10^0'
getIsoPriceExponentByCurrency('BHD')  // => 'milli.x10^-3'
getIsoPriceExponentByCurrency('BTC')  // => 'centi.x10^-2' (default for unknown)
```

## .sources

- [ISO 4217 Currency Codes - ISO](https://www.iso.org/iso-4217-currency-codes.html)
- [ISO 4217 - Wikipedia](https://en.wikipedia.org/wiki/ISO_4217)
- [SIX Financial Information - Data Standards](https://www.six-group.com/en/products-services/financial-information/data-standards.html)
- [Most Traded Currencies 2025 - FOREX.com](https://www.forex.com/en-us/trading-guides/most-traded-currencies-in-the-world-in-2025/)
- [Currency Codes by Country - IBAN.com](https://www.iban.com/currency-codes)
