# iso-price format defaults

## .what

`IsoPriceWords` is the recommended default format for iso-price consumers. all iso-price operations return `IsoPriceWords` by default — the library handles `IsoPriceShape` conversion internally, so consumers never need to touch bigint unless they explicitly opt in.

`IsoPriceWords` uses numeric separator notation (per ECMAScript ES2021): underscore (`_`) for thousands, decimal point (`.`) for decimals. e.g., `'USD 1_000_000.50'`

## .why words by default

bigint is a footgun for most developers:

| hazard | consequence |
|--------|-------------|
| `JSON.stringify({ amount: 5037n })` | TypeError — bigint cannot serialize |
| `bigint + number` | TypeError — mixed arithmetic forbidden |
| `bigint / bigint` | truncates — silent precision loss |
| `console.log(5037n)` | displays `5037n` — confuses developers |

`IsoPriceWords` sidesteps all of these:

```ts
const total = sumPrices([price1, price2]);
// => 'USD 30.00'

JSON.stringify({ total });
// => '{"total":"USD 30.00"}' — trivial serialization

const restored = asIsoPriceShape(json.total);
// => { amount: 3000n, currency: 'USD' } — lossless restore
```

## .when to use each format

| format | use case |
|--------|----------|
| `IsoPriceWords` | api responses, logs, storage, json persistence, general usage |
| `IsoPriceShape` | chained arithmetic, compute-sensitive workloads, explicit precision control |
| `IsoPriceHuman` | quick input (`'$5'`), ui display, invoices |

## .shape format for compute workloads

applications with compute-sensitive price operations can opt into shape format:

```ts
// chained arithmetic with shape format
const subtotal = sumPrices([p1, p2, p3], { format: 'shape' });
const withTax = multiplyPrice({ of: subtotal, by: 1.08 }, { format: 'shape' });
const final = asIsoPriceWords(withTax);
// => 'USD 108.00'
```

this avoids repeated words→shape→words conversions. however, most applications do not perform sequential price operations in volume — the parse overhead is negligible for typical use cases.

## .key insight

> **default to words = pit of success for devexp**

- json serializes trivially (it's a string)
- no bigint arithmetic required by consumer code
- console.log shows exactly what developers expect
- shape format available when explicit precision matters

## .see also

- `define.price-bigint.md` — why IsoPriceShape.amount is always bigint
- `define.currency-symbols-lossy.md` — why symbols are lossy compression
- `define.price-localization.md` — why numeric separator notation for IsoPriceWords
