# price bigint

## .what

`IsoPriceShape.amount` is always `bigint` — never `number`. this is a deliberate design choice that maximizes precision while it avoids devexp impact.

## .why bigint-only

### precision safety

javascript `number` uses IEEE 754 double-precision (64-bit float):
- max safe integer: `9_007_199_254_740_991` (2^53 - 1)
- beyond this, integer operations silently lose precision

at different exponents, this limits the maximum safe amount:

| exponent | max safe amount | in dollars |
|----------|-----------------|------------|
| `centi.x10^-2` | 9_007_199_254_740_991 | ~$90 trillion |
| `micro.x10^-6` | 9_007_199_254_740_991 | ~$9 billion |
| `nano.x10^-9` | 9_007_199_254_740_991 | ~$9 million |
| `pico.x10^-12` | 9_007_199_254_740_991 | ~$9,007 |

for high-precision use cases (llm token costs, serverless invocations), `number` runs out of safe range quickly.

`bigint` has no precision limit — it handles any integer size exactly.

### no mixed-mode complexity

if `amount` were `number | bigint`:
- every arithmetic operation needs type guards
- "does this operation return number or bigint?" becomes a question
- edge cases multiply when inputs have different types

bigint-only means:
- consistent behavior everywhere
- no conditional logic in library internals
- predictable output type

### devexp is not impacted

most developers should use `IsoPriceWords`, not `IsoPriceShape`:

| format | use case | bigint exposure |
|--------|----------|-----------------|
| `IsoPriceWords` | storage, logs, api, json | none — it's a string |
| `IsoPriceHuman` | display, quick input | none — it's a string |
| `IsoPriceShape` | compute-heavy arithmetic | yes — bigint literals |

the recommended flow:

```ts
// input: string → words (no bigint)
const price = asIsoPrice('$50.37');  // => 'USD 50.37'

// storage: words (no bigint)
await db.insert({ total: price });

// display: words → human (no bigint)
const display = asIsoPriceHuman(price);  // => '$50.37'

// arithmetic: library handles bigint internally
const sum = sumPrices([price1, price2]);  // => 'USD 100.74'
```

developers only touch `bigint` when they explicitly work with `IsoPriceShape`:

```ts
// explicit shape usage (rare)
const shape: IsoPriceShape = { amount: 5037n, currency: 'USD' };
```

## .cast convenience

cast functions accept `number` and convert to `bigint`:

```ts
// number input accepted
asIsoPriceShape({ amount: 5037, currency: 'USD' })
// => { amount: 5037n, currency: 'USD' }

// string input works as expected
asIsoPriceShape('USD 50.37')
// => { amount: 5037n, currency: 'USD' }
```

this means even when you do work with shapes, you rarely need to write `n` literals.

## .json serialization

`bigint` cannot be serialized via `JSON.stringify`:

```ts
JSON.stringify({ amount: 5037n })
// => TypeError: Do not know how to serialize a BigInt
```

this is why `IsoPriceWords` is the recommended persistence format:

```ts
const price = { amount: 5037n, currency: 'USD' };

// ✗ don't persist shape directly
JSON.stringify(price);  // throws

// ✓ convert to words first
JSON.stringify({ total: asIsoPriceWords(price) });
// => '{"total":"USD 50.37"}'
```

the serialization constraint is a feature, not a bug — it pushes developers toward the portable, human-readable `IsoPriceWords` format.

## .database persistence

at the persistence boundary, you have two options:

### option 1: persist as IsoPriceWords (recommended)

store prices as strings — simple, portable, human-readable:

```ts
// app layer: words throughout
const price = asIsoPrice('$50.37');  // => 'USD 50.37'

// persistence: insert as string
await db.insert({ total: price });  // stores 'USD 50.37'

// retrieval: already words
const row = await db.findOne({ id });
const price = row.total;  // => 'USD 50.37' (IsoPriceWords)
```

works with any database — sql, nosql, json files. no special types required.

### option 2: cast to IsoPriceShape at boundary

if your database schema uses the shape format (composite type, 3-column pattern), cast at the boundary:

```ts
// app layer: words throughout
const price = asIsoPrice('$50.37');  // => 'USD 50.37'

// persistence: cast to shape at insert
const shape = asIsoPriceShape(price);
await db.insert({
  amount: shape.amount,      // 5037n → stored as BIGINT
  currency: shape.currency,  // 'USD' → stored as CHAR(3)
  exponent: 2,               // → stored as SMALLINT
});

// retrieval: cast back to words
const row = await db.findOne({ id });
const price = asIsoPrice({
  amount: row.amount,
  currency: row.currency,
  exponent: row.exponent,
});  // => 'USD 50.37'
```

this approach enables sql-level arithmetic and aggregation via the `iso_price` postgresql extension.

### which to choose?

| approach | best for |
|----------|----------|
| **IsoPriceWords** | most apps, nosql, json, portability |
| **IsoPriceShape** | sql aggregation, postgresql extension |

→ see [persistence catalog](../role=dbadmin/briefs/per001.persistence._.[catalog].md) for full database storage patterns

## .summary

| concern | resolution |
|---------|------------|
| precision | bigint handles any size exactly |
| complexity | no mixed-mode type guards |
| devexp | most use words, not shape |
| literals | cast functions accept number |
| json | use words for serialization |
| database | words for simplicity, shape for sql aggregation |

> **bigint-only = pit of success**
>
> precision is guaranteed, complexity is eliminated, and devexp remains smooth via `IsoPriceWords` as the default format.
