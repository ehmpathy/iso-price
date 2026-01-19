# round modes for iso-price

how iso-price handles precision changes via `setPricePrecision` and round mode selection.

---

## setPricePrecision: the unified operation

`setPricePrecision` handles all precision changes — both increase and decrease:

- **increase precision** (e.g., `centi.x10^-2` → `micro.x10^-6`): lossless, no mode needed
- **decrease precision** (e.g., `micro.x10^-6` → `centi.x10^-2`): lossy, defaults to `half-up`

```ts
// increase precision: lossless, no mode needed
const highPrecision = setPricePrecision({
  of: { amount: 5037n, currency: 'USD', exponent: 'centi.x10^-2' },
  to: 'micro.x10^-6',
});
// => { amount: 50_370_000n, currency: 'USD', exponent: 'micro.x10^-6' }

// decrease precision: lossy, defaults to half-up
const apiCost: IsoPrice = { amount: 21n, currency: 'USD', exponent: 'micro.x10^-6' };
const rounded = setPricePrecision({ of: apiCost, to: 'centi.x10^-2' });
// => { amount: 0n, currency: 'USD', exponent: 'centi.x10^-2' }

// explicit mode when half-up isn't desired
const floored = setPricePrecision(
  { of: apiCost, to: 'centi.x10^-2' },
  { round: 'floor' },
);
```

---

## why explicit modes exist

when you reduce precision (e.g., `micro.x10^-6` → `centi.x10^-2`), information is lost. the `{ round }` option makes the round strategy auditable and controllable.

`half-up` is the default because it matches customer expectations for invoices, receipts, and prices. for specialized scenarios (ledger aggregation, revenue recognition, etc.), explicit mode selection ensures the correct behavior.

---

## supported round modes

| mode | description | example: 2.5 → integer |
|------|-------------|------------------------|
| `floor` | round toward negative infinity | 2.5 → 2, -2.5 → -3 |
| `ceil` | round toward positive infinity | 2.5 → 3, -2.5 → -2 |
| `half-up` | round half away from zero | 2.5 → 3, -2.5 → -3 |
| `half-down` | round half toward zero | 2.5 → 2, -2.5 → -2 |
| `half-even` | round half to nearest even (banker's round) | 2.5 → 2, 3.5 → 4 |

---

## mode details

### floor (truncate toward -∞)

always rounds down, regardless of the fractional part.

```ts
setPricePrecision({ of: 'USD 0.000_029', to: 'centi.x10^-2' }, { round: 'floor' })
// 29 micro = 0.0029 cents → 0 cents

setPricePrecision({ of: 'USD -0.000_029', to: 'centi.x10^-2' }, { round: 'floor' })
// -29 micro = -0.0029 cents → -1 cent (toward -∞)
```

**use when**: you want to understate amounts (e.g., conservative revenue recognition).

### ceil (round toward +∞)

always rounds up, regardless of the fractional part.

```ts
setPricePrecision({ of: 'USD 0.000_001', to: 'centi.x10^-2' }, { round: 'ceil' })
// 1 micro = 0.0001 cents → 1 cent

setPricePrecision({ of: 'USD -0.000_029', to: 'centi.x10^-2' }, { round: 'ceil' })
// -29 micro = -0.0029 cents → 0 cents (toward +∞)
```

**use when**: you want to overstate amounts (e.g., conservative expense provision).

### half-up (round half away from zero) — default

the most common "school" round mode. rounds 0.5 away from zero. **this is the default** when no mode is specified.

```ts
setPricePrecision({ of: 'USD 0.050_000', to: 'centi.x10^-2' })  // default: half-up
// 50000 micro = 5.0 cents → 5 cents (exact)

setPricePrecision({ of: 'USD 0.055_000', to: 'centi.x10^-2' })  // default: half-up
// 55000 micro = 5.5 cents → 6 cents (half rounds up)

setPricePrecision({ of: 'USD -0.055_000', to: 'centi.x10^-2' })  // default: half-up
// -55000 micro = -5.5 cents → -6 cents (half rounds away from zero)
```

**use when**: standard invoices, receipts, and customer-visible prices.

### half-down (round half toward zero)

rounds 0.5 toward zero. less common but useful for conservative estimates.

```ts
setPricePrecision({ of: 'USD 0.055_000', to: 'centi.x10^-2' }, { round: 'half-down' })
// 55000 micro = 5.5 cents → 5 cents (half rounds down)

setPricePrecision({ of: 'USD -0.055_000', to: 'centi.x10^-2' }, { round: 'half-down' })
// -55000 micro = -5.5 cents → -5 cents (half rounds toward zero)
```

**use when**: conservative estimates where you prefer to understate.

### half-even (banker's round)

rounds 0.5 to the nearest even number. eliminates statistical bias over many operations.

```ts
setPricePrecision({ of: 'USD 0.025_000', to: 'centi.x10^-2' }, { round: 'half-even' })
// 25000 micro = 2.5 cents → 2 cents (rounds to even)

setPricePrecision({ of: 'USD 0.035_000', to: 'centi.x10^-2' }, { round: 'half-even' })
// 35000 micro = 3.5 cents → 4 cents (rounds to even)

setPricePrecision({ of: 'USD 0.045_000', to: 'centi.x10^-2' }, { round: 'half-even' })
// 45000 micro = 4.5 cents → 4 cents (rounds to even)
```

**use when**: ledger systems, aggregate totals, or anywhere statistical bias matters over many transactions.

---

## when to use each mode

| scenario | recommended mode | rationale |
|----------|-----------------|-----------|
| customer invoices | `half-up` | matches customer expectations |
| tax calculations | `half-up` or `ceil` | regulatory compliance varies |
| ledger aggregation | `half-even` | eliminates bias over time |
| revenue recognition | `floor` | conservative, auditor-friendly |
| expense provision | `ceil` | conservative, auditor-friendly |
| api cost allocation | `ceil` | ensures costs are covered |
| refund calculation | `floor` | minimizes over-refund |

---

## implementation notes

### bigint division for round

javascript bigint division truncates (floor for positive, ceil for negative). to implement other modes:

```ts
const divide = (a: bigint, b: bigint, mode: RoundMode): bigint => {
  const quotient = a / b;
  const remainder = a % b;

  if (remainder === 0n) return quotient;

  switch (mode) {
    case 'floor':
      return a < 0n ? quotient - 1n : quotient;
    case 'ceil':
      return a < 0n ? quotient : quotient + 1n;
    case 'half-up': {
      const half = b / 2n;
      const absRemainder = remainder < 0n ? -remainder : remainder;
      if (absRemainder >= half) {
        return a < 0n ? quotient - 1n : quotient + 1n;
      }
      return quotient;
    }
    case 'half-down': {
      const half = b / 2n;
      const absRemainder = remainder < 0n ? -remainder : remainder;
      if (absRemainder > half) {
        return a < 0n ? quotient - 1n : quotient + 1n;
      }
      return quotient;
    }
    case 'half-even': {
      const half = b / 2n;
      const absRemainder = remainder < 0n ? -remainder : remainder;
      if (absRemainder > half) {
        return a < 0n ? quotient - 1n : quotient + 1n;
      }
      if (absRemainder === half) {
        // round to even
        if (quotient % 2n !== 0n) {
          return a < 0n ? quotient - 1n : quotient + 1n;
        }
      }
      return quotient;
    }
  }
};
```

### amount type

`IsoPriceShape.amount` is always `bigint` — cast functions accept `number` and convert internally. use the bigint division logic above for round operations.

```ts
const setPricePrecision = (
  input: { of: IsoPriceShape; to: IsoPriceExponent },
  options?: { round?: IsoPriceRoundMode; format?: 'words' | 'shape' },
): IsoPriceWords | IsoPriceShape => {
  const price = input.of;
  const precisionDelta = getExponentValue(input.to) - getExponentValue(price.exponent);

  // increase precision: lossless, no mode needed
  if (precisionDelta > 0) {
    const multiplier = 10n ** BigInt(precisionDelta);
    return {
      ...price,
      amount: price.amount * multiplier,
      exponent: input.to,
    };
  }

  // decrease precision: lossy, defaults to half-up
  const mode = options?.round ?? 'half-up';
  return setPricePrecisionWithRound(price, input.to, mode);
};
```

### roundPrice as semantic alias

`roundPrice` is a convenience alias for precision decrease — defaults to `half-up`, the most common round mode:

```ts
const roundPrice = (input: {
  of: IsoPrice;
  to: IsoPriceExponent;
  mode?: IsoPriceRoundMode;  // defaults to 'half-up'
}): IsoPriceWords => setPricePrecision(
  { of: input.of, to: input.to },
  { round: input.mode },
);
```

---

## precision change behavior

| direction | mode | information loss |
|-----------|------|------------------|
| increase (centi → micro) | not needed | none (lossless) |
| decrease (micro → centi) | defaults to half-up | yes (lossy) |

```ts
// increase precision: lossless, no mode needed
setPricePrecision({ of: 'USD 50.37', to: 'micro.x10^-6' })
// => 'USD 50.370_000'

// decrease precision: lossy, defaults to half-up
setPricePrecision({ of: 'USD 50.370_005', to: 'centi.x10^-2' })
// => 'USD 50.37'

// decrease precision: explicit mode when half-up isn't desired
setPricePrecision({ of: 'USD 50.370_005', to: 'centi.x10^-2' }, { round: 'floor' })
// => 'USD 50.37'
```

---

## sources

- [IEEE 754-2019 round modes](https://en.wikipedia.org/wiki/IEEE_754#Rounding_rules)
- [banker's round](https://en.wikipedia.org/wiki/Rounding#Rounding_half_to_even)
- [java BigDecimal round modes](https://docs.oracle.com/javase/8/docs/api/java/math/RoundingMode.html)
- [python decimal round modes](https://docs.python.org/3/library/decimal.html#rounding-modes)
