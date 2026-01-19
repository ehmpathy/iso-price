# currency symbols are lossy compression

## .what

currency symbols (e.g., `$`, `€`, `¥`) are a **lossy compression** of currency identity. multiple currencies share the same symbol, so the symbol alone cannot uniquely identify the currency.

## .why symbols are ambiguous

iso 4217 defines unique 3-letter currency **codes** (USD, EUR, JPY). it does **not** define symbols — those are cultural conventions that vary by region and overlap across currencies.

| symbol | currencies that use it |
|--------|----------------------|
| $ | USD, CAD, AUD, NZD, MXN, SGD, HKD, TWD, ARS, CLP, COP, and ~20 more |
| £ | GBP, EGP, LBP, SYP, SDG |
| ¥ | JPY, CNY |
| kr | SEK, NOK, DKK, ISK |
| ₹ | INR, PKR, NPR, LKR |
| R | ZAR, BRL |
| € | EUR (unique, but used across 20+ countries) |

**example**: `$50.37` could be:
- USD 50.37 (US dollar)
- CAD 50.37 (Canadian dollar)
- AUD 50.37 (Australian dollar)
- MXN 50.37 (Mexican peso)
- ...and many others

## .lossy compression analogy

| compression | original | compressed | reversible? |
|-------------|----------|------------|-------------|
| lossless | `USD 50.37` | `USD 50.37` | ✅ yes |
| lossy | `USD 50.37` | `$50.37` | ❌ no — could be CAD, AUD, etc. |

symbols are like JPEG compression for images: you lose information that cannot be recovered.

## .implications for iso-price

### `IsoPriceWords` = lossless (code-prefix, numeric separator notation)

```ts
'USD 50.37'       // unambiguous — valid for input AND output
'EUR 100.00'      // unambiguous — valid for input AND output
'JPY 1_000'       // unambiguous — underscores for readability
'USD 1_000_000'   // unambiguous — SI notation
```

### `IsoPriceHuman` = lossy but convenient (input with defaults, output)

```ts
// input: defaults to common currency
asIsoPrice('$50.37')                       // => 'USD 50.37'
asIsoPrice('$50.37', { currency: 'CAD' })  // => 'CAD 50.37'

// output: convert to symbol format
asIsoPriceHuman('USD 50.37')  // => '$50.37'
```

## .when to use each

| format | use case | direction |
|--------|----------|-----------|
| `IsoPriceWords` | api responses, logs, storage, serialization | input + output |
| `IsoPriceHuman` | quick input (`'$5'`), ui display, invoices | input (with default) + output |
| `IsoPriceShape` | computation, precision control, bigint amounts | input + output |

## .rule

> **symbols default to common currency** — `$` = USD, `€` = EUR, `¥` = JPY
>
> **override via options** — `asIsoPrice('$50', { currency: 'CAD' })` for other currencies
>
> **use code format for storage** — `IsoPriceWords` is unambiguous and portable

## .sources

- [ISO 4217 - Wikipedia](https://en.wikipedia.org/wiki/ISO_4217)
- [Currency Symbols - Unicode](https://www.unicode.org/charts/PDF/U20A0.pdf)
