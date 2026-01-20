# dynamic bigint usage

how iso-price handles `IsoPriceShapeAmount` (number | bigint) internally and ensures safe json serialization without global shims.

---

## why bigint support is required

javascript's `number` type uses IEEE 754 double-precision float with `MAX_SAFE_INTEGER` = 9,007,199,254,740,991.

for prices with high-precision exponents, this limit is reached at surprisingly low dollar amounts:

| exponent | unit | max safe display | real-world limit |
|----------|------|------------------|------------------|
| `centi.x10^-2` | cent | $90 trillion | never hit in practice |
| `milli.x10^-3` | mill | $9 trillion | never hit in practice |
| `micro.x10^-6` | micro | $9 billion | enterprise aggregation |
| `nano.x10^-9` | nano | $9 million | monthly bill totals |
| `pico.x10^-12` | pico | **$9,007** | single large transaction |

**critical insight**: at `pico.x10^-12` precision, a single $10,000 transaction exceeds `MAX_SAFE_INTEGER`. bigint is not optional — it's required for correctness.

```ts
// $10,000 at pico.x10^-12 precision
const amount = 10_000 * 10 ** 12;  // 10,000,000,000,000,000
// exceeds MAX_SAFE_INTEGER (9,007,199,254,740,991)
// javascript silently corrupts trail digits!

// safe with bigint
const amountSafe = 10_000n * 10n ** 12n;  // 10000000000000000n ✓
```

---

## the IsoPriceShapeAmount type

```ts
/**
 * .what = the amount of an iso-price in minor units
 * .why = supports both number (for common cases) and bigint (for high precision)
 *
 * use `number` when:
 * - exponent is `centi.x10^-2` or `milli.x10^-3` (standard currencies)
 * - amount is below MAX_SAFE_INTEGER for the given exponent
 *
 * use `bigint` when:
 * - exponent is `pico.x10^-12` and amount > $9,007
 * - exponent is `nano.x10^-9` and amount > $9 million
 * - exponent is `micro.x10^-6` and amount > $9 billion
 * - you want guaranteed precision regardless of scale
 *
 * note: javascript cannot mix number and bigint in arithmetic.
 * iso-price operations handle this internally via type coercion.
 */
type IsoPriceShapeAmount = number | bigint;
```

### why not always bigint?

bigint has tradeoffs:

| aspect | number | bigint |
|--------|--------|--------|
| literal syntax | `5037` | `5037n` |
| json serialization | works | throws TypeError |
| Math.* functions | works | not supported |
| arithmetic with number | works | TypeError |
| memory | 8 bytes | variable (larger) |
| performance (add/sub) | baseline | ~same |
| performance (mul/div) | baseline | 4-5x slower |

for most e-commerce usecases (`centi.x10^-2`), `number` is simpler and sufficient. bigint is only required when precision demands it.

### why not always number?

silent corruption. javascript doesn't throw when you exceed `MAX_SAFE_INTEGER` — it just gives wrong answers:

```ts
const a = 9_007_199_254_740_993;  // intended
const b = 9_007_199_254_740_992;  // what javascript stores
a === b;  // true — silent corruption!
```

for financial calculations, silent corruption is unacceptable. `IsoPriceShapeAmount` makes bigint available when needed.

---

## the problem with json serialization

javascript's native `BigInt` has two serialization hazards:

```ts
// hazard 1: JSON.stringify throws on bigint
JSON.stringify({ amount: 5n });
// TypeError: Do not know how to serialize a BigInt

// hazard 2: global shim affects all bigints in the process
BigInt.prototype.toJSON = function() { return this.toString(); };
// now ALL bigints serialize as strings — may break other code
```

---

## recommended pattern: use IsoPriceWords for persistence

`IsoPriceWords` is the recommended format for json persistence because:
- it's a string — serializes trivially
- avoids all bigint hazards
- portable across systems and languages
- human-readable in logs and databases

```ts
// persist via words (recommended)
const price = { amount: 1_000_000_000_000_000_000n, currency: 'USD', exponent: 'pico.x10^-12' };
const words = asIsoPriceWords(price);
// => 'USD 1000000.000000000000'

JSON.stringify({ total: words });
// => '{"total":"USD 1000000.000000000000"}'

// restore from words
const restored = asIsoPriceShape(json.total);
// => { amount: 1_000_000_000_000_000_000n, currency: 'USD', exponent: 'pico.x10^-12' }
```

this eliminates the need for separate `IsoPriceJson` types or conversion functions.

---

## internal operations: type coercion rules

when operations receive `number | bigint`, they must handle both types consistently.

### rule 1: bigint propagates

if any operand is `bigint`, the result is `bigint`:

```ts
const add = (a: IsoPriceShape, b: IsoPriceShape): IsoPriceShape => {
  const useBigInt = typeof a.amount === 'bigint' || typeof b.amount === 'bigint';

  const aAmount = useBigInt ? BigInt(a.amount) : a.amount as number;
  const bAmount = useBigInt ? BigInt(b.amount) : b.amount as number;

  return {
    amount: aAmount + bAmount,
    currency: a.currency,
    exponent: targetExponent,
  };
};
```

### rule 2: normalization preserves type

when the exponent changes, the amount type stays consistent:

```ts
const normalize = (
  price: IsoPriceShape,
  targetExponent: IsoPriceExponent,
): IsoPriceShape => {
  const fromVal = EXPONENT_VALUE[resolveExponent(price)];
  const toVal = EXPONENT_VALUE[targetExponent];
  const diff = toVal - fromVal;

  if (diff === 0) return price;

  const useBigInt = typeof price.amount === 'bigint';
  const multiplier = useBigInt ? 10n ** BigInt(Math.abs(diff)) : 10 ** Math.abs(diff);

  const newAmount = diff > 0
    ? (useBigInt ? price.amount * (multiplier as bigint) : (price.amount as number) * (multiplier as number))
    : (useBigInt ? price.amount / (multiplier as bigint) : (price.amount as number) / (multiplier as number));

  return {
    ...price,
    amount: newAmount,
    exponent: targetExponent,
  };
};
```

### rule 3: auto-promote when overflow is possible

for high-precision exponents, auto-promote to bigint:

```ts
const shouldUseBigInt = (exponent: IsoPriceExponent, amount: number): boolean => {
  // pico.x10^-12 can overflow quickly
  if (exponent === 'pico.x10^-12' && amount > 9_007) return true;

  // nano.x10^-9 with large amounts
  if (exponent === 'nano.x10^-9' && amount > 9_007_199) return true;

  return false;
};
```

---

## type guards for IsoPriceShapeAmount

```ts
/**
 * .what = checks if amount is bigint
 * .why = enables conditional logic based on precision needs
 */
const isBigIntAmount = (
  amount: IsoPriceShapeAmount,
): amount is bigint => typeof amount === 'bigint';

/**
 * .what = checks if amount is number
 * .why = enables safe number operations when precision allows
 */
const isNumberAmount = (
  amount: IsoPriceShapeAmount,
): amount is number => typeof amount === 'number';

/**
 * .what = checks if price uses bigint amount
 * .why = type guard for IsoPriceShape with bigint
 */
const isPriceBigInt = (
  price: IsoPriceShape,
): price is IsoPriceShape & { amount: bigint } =>
  typeof price.amount === 'bigint';

/**
 * .what = checks if price uses number amount
 * .why = type guard for IsoPriceShape with number
 */
const isPriceNumber = (
  price: IsoPriceShape,
): price is IsoPriceShape & { amount: number } =>
  typeof price.amount === 'number';

/**
 * .what = checks if amount is within safe integer range
 * .why = prevents silent precision loss
 */
const isSafeAmount = (amount: IsoPriceShapeAmount): boolean => {
  if (typeof amount === 'bigint') return true;
  return Number.isSafeInteger(amount);
};

/**
 * .what = asserts amount is safe, throws if not
 * .why = fail-fast on precision hazards
 */
const assertSafeAmount = (amount: IsoPriceShapeAmount): void => {
  if (!isSafeAmount(amount)) {
    throw new Error(
      `amount ${amount} exceeds MAX_SAFE_INTEGER. use bigint for precision.`,
    );
  }
};
```

### usage examples

```ts
// type-safe branching
const formatAmount = (price: IsoPriceShape): string => {
  if (isPriceBigInt(price)) {
    // typescript knows: price.amount is bigint
    return price.amount.toString();
  }
  // typescript knows: price.amount is number
  return price.amount.toFixed(0);
};

// safe conversion
const toNumber = (amount: IsoPriceShapeAmount): number => {
  assertSafeAmount(amount);
  return typeof amount === 'bigint' ? Number(amount) : amount;
};

// safe to bigint (always works)
const toBigInt = (amount: IsoPriceShapeAmount): bigint =>
  typeof amount === 'bigint' ? amount : BigInt(amount);
```

---

## api boundaries

### input validation

```ts
import { z } from 'zod';

const isoPriceWordsSchema = z.string().refine(
  (val) => isIsoPriceWords(val),
  { message: 'must be valid IsoPriceWords format (e.g., "USD 50.37")' },
);
```

### output contract

use `IsoPriceWords` at api boundaries:

```ts
// endpoint response
const getInvoice = async (id: string): Promise<{ total: IsoPriceWords }> => {
  const invoice = await invoiceDao.findById(id);
  return {
    total: asIsoPriceWords(invoice.total),
  };
};
```

---

## summary

| concern | solution |
|---------|----------|
| internal storage | `IsoPriceShape` with `amount: number \| bigint` |
| json persistence | `IsoPriceWords` — trivial serialization, portable |
| json restore | `asIsoPriceShape(words)` — restores bigint when needed |
| global pollution | none — no prototype shim needed |
| type coercion | bigint propagates if any operand is bigint |
| overflow safety | auto-promote for high-precision exponents |
| api contract | use `IsoPriceWords` for portability |
| type guards | `isBigIntAmount()`, `isPriceBigInt()`, `isSafeAmount()` |

---

## sources

- [MDN BigInt](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt)
- [JSON.stringify replacer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#the_replacer_parameter)
- [V8 BigInt implementation](https://v8.dev/features/bigint)
