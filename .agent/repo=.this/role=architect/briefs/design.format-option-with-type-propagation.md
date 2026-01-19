# design: format option with type propagation

## .proposal

all iso-price operations should:
1. accept mixed `IsoPrice` (words or shapes) on input — internal cast handles normalization
2. support a `{ format: 'shape' | 'words' }` option on output
3. default to `format: 'words'`
4. propagate output type based on format option via generics

additionally:
- `IsoPriceWords` uses **code format only** (e.g., `'USD 50.37'`) — unambiguous for input AND output
- `IsoPriceHuman` uses **symbol format** (e.g., `'$50.37'`) — output only via `asIsoPriceHuman`

---

## .why symbols are output-only

currency symbols are **shared across currencies** — `$` is used by USD, CAD, AUD, MXN, and ~20 others. ISO 4217 does not govern symbols; it only defines unambiguous 3-letter codes.

| symbol | ambiguous currencies |
|--------|---------------------|
| $ | USD, CAD, AUD, NZD, MXN, SGD, HKD... |
| £ | GBP, EGP, LBP, SYP |
| ¥ | JPY, CNY |
| kr | SEK, NOK, DKK, ISK |

**therefore:**
- `IsoPriceWords` = code-based, unambiguous → valid for input AND output
- `IsoPriceHuman` = symbol-based, ambiguous → output only (we know the currency from shape)

---

## .why words as default

### avoids bigint hazards

bigint is a footgun for most users:

1. **json serialization fails** — `JSON.stringify({ amount: 5037n })` throws TypeError
2. **arithmetic surprises** — `bigint + number` throws, `bigint / bigint` truncates
3. **console.log confusion** — `5037n` vs `5037` causes hesitation

words format sidesteps all of these:

- `'USD 50.37'` serializes trivially
- no bigint arithmetic required by consumer code
- console.log shows exactly what the user expects

**default to words = pit of success for devexp**

### shape available when needed

users who need explicit precision or efficient chained arithmetic can opt-in:

```ts
const shape = sumPrices([p1, p2], { format: 'shape' });
// => { amount: 3000, currency: 'USD' } — explicit precision, efficient for chains
```

### mixed input reduces friction

operations accept both formats on input — users don't need to convert before use:

```ts
// just works — no manual cast required
sumPrices(['USD 10.00', { amount: 2000, currency: 'USD' }])
```

### human format for display

when you need symbol format for end-user display:

```ts
const human = asIsoPriceHuman({ amount: 5037, currency: 'USD' });
// => '$50.37' — symbol prefix, for display only

const human = asIsoPriceHuman({ amount: 5037, currency: 'USD' }, { format: 'suffix' });
// => '50.37 USD' — code suffix variant
```

---

## .tradeoffs

### 👍 advantages

| benefit | explanation |
|---------|-------------|
| zero bigint exposure | users never handle bigint unless they opt-in to shape |
| json-safe by default | words format serializes trivially |
| type-safe output | generics ensure correct return type at compile time |
| mixed input | no manual cast required — both formats accepted |
| pit of success | default path avoids common serialization and arithmetic hazards |

### 👎 disadvantages

| cost | explanation | mitigation |
|------|-------------|------------|
| parse overhead | words → shape → words on each operation | most apps do not do sequential price operations in volume; those that do can opt into shape format for better performance (cognizant of bigint hazards) |
| two formats to understand | users must know when to use each format | unavoidable regardless of default — both formats exist either way |

**net**: words as default provides "just works" with "no surprises" and "correct behavior" with "zero magic"

---

## .api implications

### mixed input acceptance

all operations accept `IsoPrice` (union of words and shapes):

```ts
// all valid inputs — internal cast normalizes
sumPrices(['USD 10.00', 'USD 20.00'])
sumPrices([{ amount: 1000, currency: 'USD' }, 'USD 20.00'])
sumPrices([shape1, shape2])
```

### format option with type propagation

```ts
type IsoPriceFormat = 'shape' | 'words';

// default: format = 'words'
const total = sumPrices([price1, price2]);
// => 'USD 30.00'  (IsoPriceWords)

// explicit words
const totalWords = sumPrices([price1, price2], { format: 'words' });
// => 'USD 30.00'  (IsoPriceWords)

// opt-in to shape
const totalShape = sumPrices([price1, price2], { format: 'shape' });
// => { amount: 3000, currency: 'USD' }  (IsoPriceShape)
```

### type-level propagation via generics

```ts
function sumPrices<TFormat extends IsoPriceFormat = 'words'>(
  prices: IsoPrice[],
  options?: { format?: TFormat },
): TFormat extends 'shape' ? IsoPriceShape : IsoPriceWords;

// compiler infers correct return type
const words = sumPrices([p1, p2]);                      // IsoPriceWords
const shape = sumPrices([p1, p2], { format: 'shape' }); // IsoPriceShape
```

### precision defaults (lossless → standard)

by default, `round` is **not enabled**. cast functions preserve lossless precision:

1. **lossless precision** if significant figures require it (e.g., `'USD 0.000003'` → `'micro.x10^-6'`)
2. **iso 4217 standard** for the currency if lossless fits (e.g., `'USD 50.37'` → `'centi.x10^-2'`)

```ts
// normalize to iso 4217 standard when lossless
asIsoPrice('USD 5')
// => 'USD 5.00' — expanded to centi.x10^-2 (iso 4217 standard for USD)

asIsoPrice('USD 5.000')
// => 'USD 5.00' — collapsed to centi.x10^-2 (no significant figures lost)

asIsoPrice('USD 50.37')
// => 'USD 50.37' — centi.x10^-2 (fits iso 4217 standard for USD)

// preserve higher precision when significant figures require it
asIsoPrice('USD 0.000003')
// => 'USD 0.000003' — micro.x10^-6 (lossless, significant figures preserved)

asIsoPrice({ amount: 3, currency: 'USD', exponent: 'micro.x10^-6' })
// => 'USD 0.000003' — micro.x10^-6 (lossless, exponent preserved)
```

### round option for explicit precision control

cast functions support an optional `round` to explicitly reduce precision:

```ts
asIsoPrice('USD 50.375', { round: { to: 'centi.x10^-2', by: 'half-up' } })
// => 'USD 50.38' — rounded to cents

asIsoPriceShape('USD 0.000003', { round: { to: 'centi.x10^-2', by: 'floor' } })
// => { amount: 0, currency: 'USD' } — micro-dollars floored to cents

asIsoPriceWords({ amount: 50375, currency: 'USD', exponent: 'milli.x10^-3' }, {
  round: { to: 'centi.x10^-2', by: 'half-up' },
})
// => 'USD 50.38' — milli-dollars rounded to cents
```

signature pattern:

```ts
type IsoPriceCastOptions<TFormat extends IsoPriceFormat = 'words'> = {
  format?: TFormat;
  round?: {
    to: IsoPriceExponent;
    by: IsoPriceRoundMode;
  };
};

function asIsoPrice<TFormat extends IsoPriceFormat = 'words'>(
  price: IsoPrice,
  options?: IsoPriceCastOptions<TFormat>,
): TFormat extends 'shape' ? IsoPriceShape : IsoPriceWords;
```

---

## .implementation notes

### IsoPriceShape remains a DomainLiteral

even as an internal representation, `IsoPriceShape` should be a `DomainLiteral` with:

```ts
class IsoPriceShape extends DomainLiteral<IsoPriceShape> {
  public static toJSON = (shape: IsoPriceShape) => ({
    amount: String(shape.amount),
    currency: shape.currency,
    ...(shape.exponent && { exponent: shape.exponent }),
  });
}
```

this ensures that if users do opt-in to shape, serialization still works.

### words format: code prefix only

`IsoPriceWords` uses **code prefix format only** (`'USD 50.37'`):

- unambiguous — code is always known
- consistent — one format to parse and produce
- no suffix variant — reduces complexity

```ts
'USD 0.000003'  // micro-dollars, not truncated
'USD 0.000000001'  // nano-dollars
```

the words format is not just "display format" — it's a lossless, unambiguous string encoded form.

### human format: output only

`IsoPriceHuman` is for end-user display only (via `asIsoPriceHuman`):

```ts
asIsoPriceHuman({ amount: 5037, currency: 'USD' })
// => '$50.37' — symbol prefix for display

asIsoPriceHuman({ amount: 5037, currency: 'USD' }, { format: 'code-suffix' })
// => '50.37 USD' — code suffix variant for display
```

symbols are ambiguous (`$` = USD, CAD, AUD...), so this is output-only — never valid input.

### json serialization: use IsoPriceWords

`IsoPriceWords` is the recommended format for json persistence:

```ts
// persist via words (recommended)
const price = { amount: 1_000_000_000_000_000_000n, currency: 'USD', exponent: 'pico.x10^-12' };
const words = asIsoPriceWords(price);
// => 'USD 1000000.000000000000'

JSON.stringify({ invoice: { total: words } });
// => '{"invoice":{"total":"USD 1000000.000000000000"}}'

// restore from json
const data = JSON.parse(json);
const restored = asIsoPriceShape(data.invoice.total);
// => { amount: 1_000_000_000_000_000_000n, currency: 'USD', exponent: 'pico.x10^-12' }
```

**why IsoPriceWords for persistence?**

| concern | IsoPriceWords | IsoPriceShape |
|---------|---------------|---------------|
| json serialization | ✅ trivial (it's a string) | ❌ bigint throws TypeError |
| portability | ✅ works in any language | ❌ bigint is js-specific |
| human readable | ✅ `'USD 50.37'` | ❌ `{ amount: 5037, ... }` |
| precision | ✅ lossless (decimal string) | ✅ lossless (bigint) |

this eliminates the need for separate `IsoPriceJson` types or `toJSON` converters.

---

## .decisions

| question | decision |
|----------|----------|
| accept mixed IsoPrice on input? | ✅ yes — internal cast handles normalization |
| format option on output? | ✅ yes — `{ format: 'shape' \| 'words' }` |
| default format? | `'words'` — avoids bigint hazards, better devexp |
| type propagation? | ✅ yes — generics infer return type from format option |
| precision in words? | full precision preserved (lossless) |
| default exponent? | lossless precision → iso 4217 standard if it fits |
| round option? | ✅ optional — `{ round: { to, by } }` for explicit precision reduction |
| words format? | code prefix only (`'USD 50.37'`) — unambiguous, consistent |
| symbol format? | output only via `asIsoPriceHuman` — symbols are ambiguous |
| json persistence? | use `IsoPriceWords` — avoids bigint hazards, portable, human readable |

## .decision status

**decided** — ready for implementation
