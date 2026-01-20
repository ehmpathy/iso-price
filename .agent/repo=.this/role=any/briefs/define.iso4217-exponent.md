# iso 4217 exponent

## .what

iso 4217 defines a standard for currency codes and their "exponent" — the number of decimal places in the minor unit.

## .formula

```
displayValue = amount / 10^exponent
```

the exponent is **positive** and represents "how many decimal places" to shift.

## .standard exponents

| currency | code | exponent | minor unit | example |
|----------|------|----------|------------|---------|
| us dollar | USD | 2 | cent (1/100) | 5037 → $50.37 |
| euro | EUR | 2 | cent (1/100) | 5037 → €50.37 |
| japanese yen | JPY | 0 | none | 1000 → ¥1000 |
| korean won | KRW | 0 | none | 1000 → ₩1000 |
| bahraini dinar | BHD | 3 | fils (1/1000) | 1234567 → 1234.567 BHD |
| kuwaiti dinar | KWD | 3 | fils (1/1000) | 1234567 → 1234.567 KWD |
| omani rial | OMR | 3 | baisa (1/1000) | 1234567 → 1234.567 OMR |

source: [ISO 4217 Wikipedia](https://en.wikipedia.org/wiki/ISO_4217)

## .why explicit enum avoids conflation

iso 4217 uses a positive "exponent" that represents decimal places (e.g., `2` for cents).
scientific notation uses a negative exponent for the same concept (e.g., `10^-2`).

this creates conflation:
- iso 4217: `exponent = 2` means `amount / 10^2`
- scientific: `exponent = -2` means `amount × 10^-2`

both yield the same result, but the sign differs.

**we avoid this conflation via explicit enum values:**

```ts
type IsoPriceExponent =
  | 'whole.x10^0'    // explicit: amount × 10^0 (no shift)
  | 'centi.x10^-2'   // explicit: amount × 10^-2
  | 'milli.x10^-3'   // explicit: amount × 10^-3
  | 'micro.x10^-6'   // explicit: amount × 10^-6
  | ...
```

the `.x10^-N` suffix makes the math unambiguous:
- `'centi.x10^-2'` → `amount × 10^-2 = amount / 100`
- no confusion about whether "2" means positive or negative

this aligns with scientific notation while the `centi`/`milli`/`micro` prefix provides human readability.

## .si metric prefixes

the exponent names (centi, milli, micro, nano, pico) derive from the international system of units (si) metric prefixes, as defined by nist.

| prefix | symbol | factor | iso-price exponent |
|--------|--------|--------|-------------------|
| (none) | — | 10⁰ | `'whole.x10^0'` |
| centi | c | 10⁻² | `'centi.x10^-2'` |
| milli | m | 10⁻³ | `'milli.x10^-3'` |
| micro | μ | 10⁻⁶ | `'micro.x10^-6'` |
| nano | n | 10⁻⁹ | `'nano.x10^-9'` |
| pico | p | 10⁻¹² | `'pico.x10^-12'` |

these prefixes provide a standard, universally understood name convention for powers of ten. via si prefixes in our exponent type:
- developers immediately understand the scale (e.g., "micro" = millionths)
- the names are self-evident and consistent with scientific usage
- no need to memorize arbitrary numeric exponents

source: [NIST SI Metric Prefixes](https://www.nist.gov/pml/owm/metric-si-prefixes)

see also: [define.si-metric-prefixes.md](./define.si-metric-prefixes.md) for complete prefix tables and binary vs decimal notes.

## .extended exponents for sub-cent

iso 4217 only defines exponents 0, 2, and 3. for sub-cent usecases (api costs, micro-payments), we extend the pattern:

| name | exponent type | numeric | relation to dollar | usecase |
|------|---------------|---------|-------------------|---------|
| whole | `'whole.x10^0'` | 0 | 1 | JPY, KRW (no decimals) |
| cent | `'centi.x10^-2'` | 2 | 0.01 | standard e-commerce |
| mill | `'milli.x10^-3'` | 3 | 0.001 | tax calculations, fils |
| micro-dollar | `'micro.x10^-6'` | 6 | 0.000001 | llm token costs |
| nano-dollar | `'nano.x10^-9'` | 9 | 0.000000001 | serverless invocation costs |
| pico-dollar | `'pico.x10^-12'` | 12 | 0.000000000001 | extreme precision |

### declarative exponent type

```ts
type IsoPriceExponent =
  | 'whole.x10^0'    // whole units (JPY, KRW)
  | 'centi.x10^-2'   // standard cents (USD, EUR, GBP)
  | 'milli.x10^-3'   // fils (BHD, KWD, OMR)
  | 'micro.x10^-6'   // micro-dollars (llm token costs)
  | 'nano.x10^-9'    // nano-dollars (serverless costs)
  | 'pico.x10^-12';  // pico-dollars (extreme precision, requires bigint)

/**
 * .what = the amount of an iso-price in minor units
 * .why = supports number for common cases, bigint for high precision
 *
 * see ref.dynamic-bigint-usage.md for why both are needed
 */
type IsoPriceShapeAmount = number | bigint;

interface IsoPriceShape {
  amount: IsoPriceShapeAmount;
  currency: string;
  exponent?: IsoPriceExponent;  // optional, defaults to currency standard
}
```

the `.x10^-N` suffix makes the math explicit: `amount / 10^N = displayValue`

when exponent is omitted, the iso 4217 standard for the currency is used:
- USD, EUR, GBP → `'centi.x10^-2'`
- JPY, KRW → `'whole.x10^0'`
- BHD, KWD, OMR → `'milli.x10^-3'`

## .examples

### standard e-commerce (exponent 2)

```ts
{ amount: 5037, currency: 'USD' }  // exponent defaults to 2
// 5037 / 10^2 = $50.37
```

### llm api token cost (micro.x10^-6)

```ts
// claude-haiku-3: $0.000001 per input token
{ amount: 1, currency: 'USD', exponent: 'micro.x10^-6' }
// 1 / 10^6 = $0.000001

// gpt-4o: $0.000005 per input token
{ amount: 5, currency: 'USD', exponent: 'micro.x10^-6' }
// 5 / 10^6 = $0.000005
```

### aws lambda cost (nano.x10^-9)

```ts
// $0.0000166667 per GB-second
{ amount: 16667, currency: 'USD', exponent: 'nano.x10^-9' }
// 16667 / 10^9 = $0.000016667

// $0.0000002 per request
{ amount: 200, currency: 'USD', exponent: 'nano.x10^-9' }
// 200 / 10^9 = $0.0000002
```

## .accumulation

when prices have different exponents, normalize to the highest before arithmetic:

```ts
const ecommerce = { amount: 5037, currency: 'USD', exponent: 'centi.x10^-2' };      // $50.37
const apiCost = { amount: 5, currency: 'USD', exponent: 'micro.x10^-6' };           // $0.000005

// normalize ecommerce to micro.x10^-6
// 5037 × 10^(6-2) = 5037 × 10^4 = 50_370_000
const ecommerceNormalized = { amount: 50_370_000, currency: 'USD', exponent: 'micro.x10^-6' };

// now sum integers
const total = { amount: 50_370_005, currency: 'USD', exponent: 'micro.x10^-6' };    // $50.370005
```

## .comparison with other systems

| system | representation | $0.000005 |
|--------|---------------|-----------|
| iso-price | `{ amount: 5, exponent: 'micro.x10^-6' }` | integer + declarative exponent |
| stripe | `{ unit_amount_decimal: '0.0005' }` | decimal string in cents |
| commercetools | `{ centAmount: 5, fractionDigits: 6 }` | integer + fractionDigits |
| openai | accumulate tokens, bill at period end | internal precision unknown |
| anthropic | `"0.0015"` (decimal cents string) | string in cents |

## .sources

- [NIST SI Metric Prefixes](https://www.nist.gov/pml/owm/metric-si-prefixes)
- [ISO 4217 Wikipedia](https://en.wikipedia.org/wiki/ISO_4217)
- [ISO 4217 Official](https://www.iso.org/iso-4217-currency-codes.html)
- [Adyen Currency Codes](https://docs.adyen.com/development-resources/currency-codes/)
- [Stripe Price Object](https://docs.stripe.com/api/prices/object)
- [commercetools Money Types](https://docs.commercetools.com/api/types)
- [OpenAI Price Precision Discussion](https://community.openai.com/t/pricing-precision-for-sub-cent-amounts/370856)
