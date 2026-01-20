# allocatePrice

## .what

`allocatePrice` splits a monetary value into parts **without loss or gain**. the sum of allocated parts always equals the original amount.

```ts
allocatePrice({ of: 'USD 10.00', into: { parts: 3 }, remainder: 'first' })
// => ['USD 3.34', 'USD 3.33', 'USD 3.33']
// sum: $10.00 ✓
```

## .why

money has indivisible units (cents). division creates remainders that must go somewhere:

```
$10.00 ÷ 3 = $3.333...
```

no round mode solves this — floor loses $0.01, ceil gains $0.02. `allocatePrice` distributes the remainder fairly.

## .remainder

controls where leftover cents go:

| value | behavior |
|-------|----------|
| `'first'` | extra cents to first recipient |
| `'last'` | extra cents to last recipient |
| `'largest'` | extra cents to largest share (Hamilton method) |
| `'random'` | pseudo-random distribution |

## .modes

```ts
// equal parts
allocatePrice({ of: 'USD 100.00', into: { parts: 3 }, remainder: 'first' })
// => ['USD 33.34', 'USD 33.33', 'USD 33.33']

// by ratios (70/30 split)
allocatePrice({ of: 'USD 5.00', into: { ratios: [7, 3] }, remainder: 'first' })
// => ['USD 3.50', 'USD 1.50']
```

## .vs dividePrice

| operation | use case | handles remainder? |
|-----------|----------|-------------------|
| `dividePrice` | unit price from total | no — truncates |
| `allocatePrice` | distribute total | yes — no loss |

```ts
dividePrice({ of: 'USD 10.00', by: 3 })      // => 'USD 3.33' (loses $0.01)
allocatePrice({ of: 'USD 10.00', into: { parts: 3 }, remainder: 'first' })
// => ['USD 3.34', 'USD 3.33', 'USD 3.33'] (sum = $10.00)
```

## .use cases

- bill split (restaurant POS)
- tip pool (labor compliance)
- invoice proration (SaaS subscriptions)
- tax allocation across line items
- investment portfolio rebalance
- payroll distribution

## .see also

for detailed examples, real-world sources, and the largest remainder method algorithm:
→ `.agent/repo=.this/role=architect/briefs/ref.allocate-price.md`
