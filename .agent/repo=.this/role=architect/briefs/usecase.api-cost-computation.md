# usecase: api cost computation

how iso-price handles llm api cost calculations at micro-dollar precision.

## the scenario

an llm api charges **$3 per million tokens**.

per-token rate:
- $3 / 1,000,000 = $0.000003 per token
- = 3 micro-dollars per token
- = `{ amount: 3, currency: 'USD', exponent: 'micro.x10^-6' }`

---

## example 1: 100 tokens

```ts
// define the rate
const ratePerToken: IsoPrice = {
  amount: 3,
  currency: 'USD',
  exponent: 'micro.x10^-6',  // $0.000003
};

// compute cost for 100 tokens
const cost = multiplyPrice({
  price: ratePerToken,
  by: 100,
});
// => { amount: 300, currency: 'USD', exponent: 'micro.x10^-6' }

// display
asIsoPriceWords({ price: cost });
// => '$0.0003'
```

**math**: 100 × 3 micro-dollars = 300 micro-dollars = $0.0003

---

## example 2: 7 tokens

```ts
// compute cost for 7 tokens
const cost = multiplyPrice({
  price: ratePerToken,
  by: 7,
});
// => { amount: 21, currency: 'USD', exponent: 'micro.x10^-6' }

// display
asIsoPriceWords({ price: cost });
// => '$0.000021'
```

**math**: 7 × 3 micro-dollars = 21 micro-dollars = $0.000021

---

## example 3: 1,000,000,001 tokens

```ts
// compute cost for 1,000,000,001 tokens
const cost = multiplyPrice({
  price: ratePerToken,
  by: 1_000_000_001,
});
// => { amount: 3_000_000_003, currency: 'USD', exponent: 'micro.x10^-6' }

// display
asIsoPriceWords({ price: cost });
// => '$3000.000003'
```

**math**: 1,000,000,001 × 3 micro-dollars = 3,000,000,003 micro-dollars = $3,000.000003

note: the 1 extra token beyond a billion adds exactly $0.000003 to the total. no precision is lost.

---

## why micro.x10^-6 precision matters

### the problem with cents

if we used standard cents (`centi.x10^-2`):

```ts
// rate in cents: $0.000003 = 0.0003 cents
// cannot represent 0.0003 cents as an integer!

// forced to round:
const rateInCents = { amount: 0, currency: 'USD' };  // rounds to $0.00

// 7 tokens cost:
7 × 0 = 0 cents = $0.00  // WRONG! should be $0.000021
```

### the solution with micro.x10^-6

```ts
// rate in micro-dollars: $0.000003 = 3 micro-dollars
const rate = { amount: 3, currency: 'USD', exponent: 'micro.x10^-6' };

// 7 tokens cost:
7 × 3 = 21 micro-dollars = $0.000021  // CORRECT!
```

---

## accumulation across precision levels

combine api costs with standard e-commerce prices:

```ts
// e-commerce purchase: $50.37
const purchase: IsoPrice = { amount: 5037, currency: 'USD' };  // defaults to centi.x10^-2

// api usage: 7 tokens at $3/million
const apiCost: IsoPrice = { amount: 21, currency: 'USD', exponent: 'micro.x10^-6' };

// sum (auto-normalizes to highest precision)
const total = sumPrices([purchase, apiCost]);
// => { amount: 50_370_021, currency: 'USD', exponent: 'micro.x10^-6' }

// display
asIsoPriceWords({ price: total });
// => '$50.370021'
```

**normalization**:
- $50.37 at `centi.x10^-2` = 5037 cents
- convert to `micro.x10^-6`: 5037 × 10^4 = 50,370,000 micro-dollars
- add api cost: 50,370,000 + 21 = 50,370,021 micro-dollars
- display: $50.370021

---

## real-world rates

| model | rate per 1M tokens | per-token (micro.$) | exponent |
|-------|-------------------|---------------------|----------|
| claude-sonnet-4 | $3.00 | 3 | `micro.x10^-6` |
| claude-opus-4.5 | $15.00 | 15 | `micro.x10^-6` |
| claude-haiku-3 | $0.25 | 0.25 | needs `nano.x10^-9` |
| gpt-4o | $5.00 | 5 | `micro.x10^-6` |
| gpt-4o-mini | $0.15 | 0.15 | needs `nano.x10^-9` |

### haiku-3 at nano precision

```ts
// claude-haiku-3: $0.25 per million = $0.00000025 per token
// = 0.25 micro-dollars = 250 nano-dollars
const haikuRate: IsoPrice = {
  amount: 250,
  currency: 'USD',
  exponent: 'nano.x10^-9',
};

// 7 tokens
const cost = multiplyPrice({ of: haikuRate, by: 7 });
// => { amount: 1750, currency: 'USD', exponent: 'nano.x10^-9' }
// = $0.00000175

asIsoPriceWords({ price: cost });
// => '$0.00000175'
```

---

## invoice aggregation

monthly usage: 50 million tokens at $3/million

```ts
// total tokens
const tokens = 50_000_000;

// compute total
const total = multiplyPrice({
  price: { amount: 3, currency: 'USD', exponent: 'micro.x10^-6' },
  by: tokens,
});
// => { amount: 150_000_000, currency: 'USD', exponent: 'micro.x10^-6' }

asIsoPriceWords({ price: total });
// => '$150.00'

// can also cast down to cents for invoice display
const invoiceAmount = normalize(total, 'centi.x10^-2');
// => { amount: 15000, currency: 'USD', exponent: 'centi.x10^-2' }
```

---

## intuitive price comparison

raw `amount` values are unintuitive to compare across different exponents.

### the problem

```ts
const costA: IsoPrice = { amount: 300, currency: 'USD', exponent: 'micro.x10^-6' };
const costB: IsoPrice = { amount: 5037, currency: 'USD' };  // centi.x10^-2 default

// which is larger?
costA.amount < costB.amount  // true: 300 < 5037
// but costA = $0.0003, costB = $50.37
// costB is actually 167,900x larger!
```

direct `amount` comparison is deceptive when exponents differ.

### solution 1: compare via IsoPriceWords

```ts
// always compare via words for human review
asIsoPriceWords({ price: costA });  // '$0.0003'
asIsoPriceWords({ price: costB });  // '$50.37'

// obvious: $50.37 > $0.0003
```

### solution 2: enforce consistent exponent via type generic

```ts
// define a domain-specific price type with fixed exponent
type ApiCostPrice = IsoPriceShape<'USD', 'micro.x10^-6'>;

const costA: ApiCostPrice = { amount: 300, currency: 'USD', exponent: 'micro.x10^-6' };
const costB: ApiCostPrice = { amount: 5037_0000, currency: 'USD', exponent: 'micro.x10^-6' };

// now amounts are directly comparable
costA.amount < costB.amount  // true: 300 < 50,370,000
// correct! $0.0003 < $50.37
```

### recommendation

for **display and human review**: use `IsoPriceWords`
for **programmatic comparison**: enforce same exponent via type generic

```ts
// type-safe api cost domain
type LlmTokenCost = IsoPriceShape<'USD', 'micro.x10^-6'>;

const computeTokenCost = (input: { tokens: number; ratePerToken: LlmTokenCost }): LlmTokenCost => {
  return multiplyPrice({ of: input.ratePerToken, by: input.tokens });
};

// all costs in this domain share the same exponent → amounts are comparable
```

---

## why operations must use the most granular exponent

domain operations (`sumPrices`, `subPrices`, `calcPriceStdev`) must output at the **most granular exponent** from their inputs. otherwise, precision is lost.

### sumPrices: precision loss without granular output

```ts
// scenario: sum api costs from different models
const sonnetCost: IsoPrice = { amount: 3000, currency: 'USD', exponent: 'micro.x10^-6' };  // $0.003
const haikuCost: IsoPrice = { amount: 1750, currency: 'USD', exponent: 'nano.x10^-9' };    // $0.00000175

// WRONG: if sumPrices output at micro.x10^-6 (less granular)
// haikuCost = 1750 nano = 1.75 micro → rounds to 1 or 2 micro
// total = 3000 + 2 = 3002 micro = $0.003002
// LOST: the 0.75 micro-dollars (750 nano-dollars)

// CORRECT: sumPrices outputs at nano.x10^-9 (most granular)
const total = sumPrices([sonnetCost, haikuCost]);
// sonnetCost normalized: 3000 micro = 3,000,000 nano
// haikuCost: 1750 nano
// total = 3,000,000 + 1750 = 3,001,750 nano
// => { amount: 3_001_750, currency: 'USD', exponent: 'nano.x10^-9' }
// = $0.00300175 ✓ (no precision lost)
```

### subPrices: precision loss without granular output

```ts
// scenario: calculate refund (total minus partial credit)
const totalCharge: IsoPrice = { amount: 5037, currency: 'USD' };                        // $50.37 (centi)
const apiCredit: IsoPrice = { amount: 21, currency: 'USD', exponent: 'micro.x10^-6' };     // $0.000021

// WRONG: if subPrices output at centi.x10^-2 (less granular)
// apiCredit = 21 micro = 0.0021 centi → rounds to 0 centi
// diff = 5037 - 0 = 5037 centi = $50.37
// LOST: the entire $0.000021 credit!

// CORRECT: subPrices outputs at micro.x10^-6 (most granular)
const refund = subPrices([totalCharge, apiCredit]);
// totalCharge normalized: 5037 centi = 50,370,000 micro
// apiCredit: 21 micro
// diff = 50,370,000 - 21 = 50,369,979 micro
// => { amount: 50_369_979, currency: 'USD', exponent: 'micro.x10^-6' }
// = $50.369979 ✓ (credit preserved)
```

### calcPriceStdev: precision loss without granular output

```ts
// scenario: analyze variance in api costs across requests
const costs: IsoPrice[] = [
  { amount: 3, currency: 'USD', exponent: 'micro.x10^-6' },      // $0.000003
  { amount: 5, currency: 'USD', exponent: 'micro.x10^-6' },      // $0.000005
  { amount: 250, currency: 'USD', exponent: 'nano.x10^-9' },     // $0.00000025
  { amount: 4, currency: 'USD', exponent: 'micro.x10^-6' },      // $0.000004
];

// WRONG: if calcPriceStdev output at micro.x10^-6 (less granular)
// the nano-precision cost (250 nano = 0.25 micro) rounds to 0 micro
// stdev calculated with [3, 5, 0, 4] micro instead of [3000, 5000, 250, 4000] nano
// result is statistically incorrect

// CORRECT: calcPriceStdev outputs at nano.x10^-9 (most granular)
const stdev = calcPriceStdev(costs);
// all values normalized to nano:
// [3000, 5000, 250, 4000] nano
// mean = 3062.5 nano
// stdev ≈ 1718 nano
// => { amount: 1718, currency: 'USD', exponent: 'nano.x10^-9' }
// = $0.000001718 ✓ (statistically correct)
```

### the rule

> **all domain operations must output at the most granular exponent from their inputs**

this ensures:
1. no precision loss in arithmetic
2. small values are never rounded to zero
3. statistical calculations remain accurate
4. the result can always be cast to less granular exponents later (but not vice versa)

---

## safe number limits by exponent

`Number.MAX_SAFE_INTEGER` = 9,007,199,254,740,991

beyond this, javascript silently corrupts values. the practical limit depends on exponent:

| exponent | max safe amount | max safe display | tokens at $3/M rate |
|----------|-----------------|------------------|---------------------|
| `centi.x10^-2` | 9,007,199,254,740,991 | $90 trillion | 30 quadrillion |
| `micro.x10^-6` | 9,007,199,254,740,991 | $9 billion | 3 trillion |
| `nano.x10^-9` | 9,007,199,254,740,991 | $9 million | 3 billion |
| `pico.x10^-12` | 9,007,199,254,740,991 | $9,007 | 3 million |

### where the boundary hits

```ts
// at micro.x10^-6: safe up to $9 billion
const safeLimit = { amount: 9_007_199_254_740_991, currency: 'USD', exponent: 'micro.x10^-6' };
// = $9,007,199,254.740991 ✓

// at nano.x10^-9: safe up to $9 million
const safeLimit = { amount: 9_007_199_254_740_991, currency: 'USD', exponent: 'nano.x10^-9' };
// = $9,007,199.254740991 ✓

// at pico.x10^-12: safe up to $9,007
const safeLimit = { amount: 9_007_199_254_740_991, currency: 'USD', exponent: 'pico.x10^-12' };
// = $9,007.199254740991 ✓
```

### realistic scenario: when do you hit the limit?

```ts
// scenario: track all api costs for a large enterprise
// monthly usage: 500 billion tokens at $3/million

const tokens = 500_000_000_000;  // 500 billion
const ratePerToken = { amount: 3, currency: 'USD', exponent: 'micro.x10^-6' };

// cost = 500B × 3 micro = 1.5 trillion micro-dollars
const cost = multiplyPrice({ of: ratePerToken, by: tokens });
// => { amount: 1_500_000_000_000, currency: 'USD', exponent: 'micro.x10^-6' }
// = $1,500,000 ✓ (safe: 1.5T < 9 quadrillion)
```

**at micro.x10^-6**: safe up to **3 trillion tokens** ($9 billion)

```ts
// scenario: aggregate costs that need nano precision
// haiku-3 at $0.25/million = 250 nano per token

const tokens = 10_000_000_000;  // 10 billion tokens
const ratePerToken = { amount: 250, currency: 'USD', exponent: 'nano.x10^-9' };

// cost = 10B × 250 nano = 2.5 trillion nano-dollars
const cost = multiplyPrice({ of: ratePerToken, by: tokens });
// => { amount: 2_500_000_000_000, currency: 'USD', exponent: 'nano.x10^-9' }
// = $2,500 ✓ (safe: 2.5T < 9 quadrillion)
```

**at nano.x10^-9**: safe up to **36 billion tokens** at haiku rate ($9 million total)

### when bigint is required

```ts
// scenario: pico precision for extreme granularity
// track sub-nano costs: $0.0000000001 per operation

const ratePerOp = { amount: 100, currency: 'USD', exponent: 'pico.x10^-12' };  // $0.0000000001

// 100 million operations
const ops = 100_000_000;
const cost = multiplyPrice({ of: ratePerOp, by: ops });
// => { amount: 10_000_000_000, currency: 'USD', exponent: 'pico.x10^-12' }
// = $0.01 ✓ (safe)

// 100 billion operations
const ops = 100_000_000_000;
const cost = multiplyPrice({ of: ratePerOp, by: ops });
// => { amount: 10_000_000_000_000, currency: 'USD', exponent: 'pico.x10^-12' }
// = $10.00 ✓ (safe)

// 1 trillion operations
const ops = 1_000_000_000_000;
const cost = multiplyPrice({ of: ratePerOp, by: ops });
// => { amount: 100_000_000_000_000, currency: 'USD', exponent: 'pico.x10^-12' }
// = $100.00 ✓ (safe)

// 100 trillion operations — EXCEEDS SAFE LIMIT
const ops = 100_000_000_000_000;
// 100T × 100 pico = 10 quadrillion pico
// 10,000,000,000,000,000 > MAX_SAFE_INTEGER (9,007,199,254,740,991)
// ⚠️ UNSAFE with number, must use bigint

const cost = multiplyPrice({
  price: { amount: 100n, currency: 'USD', exponent: 'pico.x10^-12' },  // bigint
  by: 100_000_000_000_000n,  // bigint
});
// => { amount: 10_000_000_000_000_000n, currency: 'USD', exponent: 'pico.x10^-12' }
// = $10,000.00 ✓ (safe with bigint)
```

### practical guidance

| usecase | exponent | safe limit | bigint needed? |
|---------|----------|------------|----------------|
| e-commerce | `centi.x10^-2` | $90 trillion | never |
| llm api ($1-15/M) | `micro.x10^-6` | $9 billion | rare (enterprise) |
| cheap llm ($0.05-0.50/M) | `nano.x10^-9` | $9 million | uncommon |
| serverless micro-costs | `pico.x10^-12` | $9,007 | often |

**rule of thumb**:
- `centi.x10^-2` and `micro.x10^-6`: safe for virtually all usecases with `number`
- `nano.x10^-9`: safe for most usecases, consider bigint for $1M+ totals
- `pico.x10^-12`: use `bigint` by default for any non-trivial amounts

---

## key takeaways

1. **use `micro.x10^-6` for most llm rates** ($1-$15 per million)
2. **use `nano.x10^-9` for cheaper models** ($0.05-$0.50 per million)
3. **accumulation auto-normalizes** to highest precision
4. **no precision loss** even for fractional token counts
5. **integer math only** — no float errors ever
6. **compare via IsoPriceWords** or enforce same exponent via type generic
7. **operations output at most granular exponent** to preserve precision

---

## sources

- [OpenAI API price](https://openai.com/api/pricing/)
- [Anthropic Claude price](https://www.anthropic.com/pricing)
