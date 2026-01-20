# typescript pico-scale precision

how node.js and typescript handle arbitrary precision numbers for pico-scale (10^-12) amounts.

## the problem

javascript's `number` type uses IEEE 754 double-precision float:
- 53 bits for the integer portion
- `Number.MAX_SAFE_INTEGER` = 2^53 - 1 = 9,007,199,254,740,991

for pico-scale amounts (exponent 12), a $1 million value becomes:
- $1,000,000 × 10^12 = 1,000,000,000,000,000,000 (10^18)
- this exceeds `MAX_SAFE_INTEGER` by ~111x

beyond this threshold, javascript silently replaces trail digits with zeros — a critical defect for financial applications.

sources:
- [MDN Number.MAX_SAFE_INTEGER](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER)
- [V8 BigInt](https://v8.dev/features/bigint)

---

## solution 1: native bigint (recommended)

javascript's native `BigInt` supports arbitrary-precision integers.

### basic usage

```ts
// create bigint values
const amount = 5n;                    // literal syntax
const amount2 = BigInt(5);            // constructor
const amount3 = BigInt('12345678901234567890');  // from string

// arithmetic
const sum = 100n + 50n;               // 150n
const product = 100n * 50n;           // 5000n
const quotient = 100n / 3n;           // 33n (truncates, no decimals)
```

### iso-price with bigint

```ts
type IsoPriceExponent =
  | 'whole.x10^0'    // whole units (JPY, KRW)
  | 'centi.x10^-2'   // standard cents
  | 'milli.x10^-3'   // fils
  | 'micro.x10^-6'   // micro-dollars
  | 'nano.x10^-9'    // nano-dollars
  | 'pico.x10^-12';  // pico-dollars (requires bigint)

/**
 * .what = the amount of an iso-price in minor units
 * .why = supports number for common cases, bigint for high precision
 */
type IsoPriceShapeAmount = number | bigint;

interface IsoPriceShape {
  amount: IsoPriceShapeAmount;  // integer in minor units (bigint for pico)
  currency: string;             // ISO 4217 code
  exponent?: IsoPriceExponent;  // optional, defaults to currency standard
}

// $50.37 in cents
const price: IsoPriceShape = {
  amount: 5037n,
  currency: 'USD',
  exponent: 'centi.x10^-2',
};

// $0.000000000001 in pico-dollars
const picoCost: IsoPriceShape = {
  amount: 1n,
  currency: 'USD',
  exponent: 'pico.x10^-12',
};

// $1,000,000 in pico-dollars (safe with bigint)
const largePico: IsoPriceShape = {
  amount: 1_000_000_000_000_000_000n,  // 10^18, exceeds MAX_SAFE_INTEGER
  currency: 'USD',
  exponent: 'pico.x10^-12',
};
```

### bigint limitations

| limitation | workaround |
|------------|------------|
| no decimals | use integer + exponent pattern |
| no `Math.*` functions | implement custom or use library |
| no mix with `number` | explicit conversion required |
| json serialization | convert to string first |

### json serialization

```ts
// bigint to json
const toJson = (price: IsoPriceShape): string => {
  return JSON.stringify({
    amount: price.amount.toString(),  // bigint → string
    currency: price.currency,
    exponent: price.exponent,
  });
};

// json to bigint
const fromJson = (json: string): IsoPriceShape => {
  const parsed = JSON.parse(json);
  return {
    amount: BigInt(parsed.amount),    // string → bigint
    currency: parsed.currency,
    exponent: parsed.exponent,
  };
};
```

### performance

from [benchmark data](https://gist.github.com/wemeetagain/73a92ceb5f942b940898eea0aa578546):

| operation | number (ops/sec) | bigint (ops/sec) | ratio |
|-----------|------------------|------------------|-------|
| add | ~155M | ~154M | ~1x |
| subtract | ~155M | ~153M | ~1x |
| multiply | ~155M | ~33M | ~5x slower |
| divide | ~155M | ~36M | ~4x slower |

**recommendation**: bigint add/subtract is nearly as fast as number. multiply/divide are slower but still fast enough for most applications.

sources:
- [BigInt vs Number benchmark](https://www.measurethat.net/Benchmarks/Show/30977/0/bigint-vs-number)
- [BigInt performance article](https://dev.to/halented/are-bigint-math-calculations-more-expensive-than-using-numbers-in-javascript-19of)

---

## solution 2: decimal libraries

for applications that need decimal arithmetic (not just storage), use a library.

### library comparison

| library | size | precision | best for |
|---------|------|-----------|----------|
| [big.js](https://github.com/MikeMcl/big.js) | 6kb | decimal places | financial, simple |
| [bignumber.js](https://github.com/MikeMcl/bignumber.js) | 20kb | decimal places | financial, full-featured |
| [decimal.js](https://github.com/MikeMcl/decimal.js) | 32kb | significant digits | scientific, trig functions |
| [decimalish](https://decimali.sh/) | 5kb | exact results | immutable, json-safe |

all three major libraries (big.js, bignumber.js, decimal.js) are by the same author (MikeMcl) and have typescript support.

### big.js example

```ts
import Big from 'big.js';

// create decimal values
const a = new Big('0.1');
const b = new Big('0.2');

// precise arithmetic (no float errors)
const sum = a.plus(b);           // Big('0.3')
const product = a.times(b);      // Big('0.02')

// pico-scale
const pico = new Big('0.000000000001');
const result = pico.times(1000000);  // Big('0.000001')

// convert back
const asNumber = result.toNumber();  // 0.000001
const asString = result.toString();  // '0.000001'
```

### bignumber.js example

```ts
import BigNumber from 'bignumber.js';

// configure for financial use
BigNumber.config({
  DECIMAL_PLACES: 12,           // pico precision
  ROUNDING_MODE: BigNumber.ROUND_HALF_UP,
});

const price = new BigNumber('50.37');
const rate = new BigNumber('0.000005');  // $5 per million tokens

const cost = price.plus(rate.times(1000));  // add 1000 token costs
console.log(cost.toFixed(12));              // '50.375000000000'
```

### decimal.js example

```ts
import Decimal from 'decimal.js';

// configure precision (significant digits)
Decimal.set({
  precision: 24,                // 24 significant digits
  rounding: Decimal.ROUND_HALF_UP,
});

const amount = new Decimal('1000000000000000000');  // 10^18
const divisor = new Decimal('1000000000000');       // 10^12

const result = amount.div(divisor);  // Decimal('1000000')
```

sources:
- [decimal.js GitHub](https://github.com/MikeMcl/decimal.js)
- [big.js GitHub](https://github.com/MikeMcl/big.js)
- [Library comparison](https://dev.to/fvictorio/a-comparison-of-bignumber-libraries-in-javascript-2gc5)

---

## solution 3: tc39 decimal proposal (future)

a native `Decimal` type is in development for javascript.

### status

- **stage**: 2 (draft) as of 2025
- **base**: IEEE 754-2019 Decimal128 (128-bit decimal)
- **syntax**: no new literal syntax planned (`123.456m` was considered but rejected)
- **api**: new `Decimal` or `Decimal128` object in standard library

### proposed usage

```ts
// future native decimal (not yet available)
const price = new Decimal('50.37');
const rate = new Decimal('0.000005');
const total = price.add(rate);
```

### polyfill available

```sh
npm install proposal-decimal
```

```ts
import { Decimal128 } from 'proposal-decimal';

const d = new Decimal128('0.1');
const e = new Decimal128('0.2');
const sum = d.add(e);  // Decimal128('0.3')
```

sources:
- [TC39 Decimal proposal](https://github.com/tc39/proposal-decimal)
- [Decimal proposal polyfill](https://jessealama.net/decimal-proposal-polyfill/)

---

## recommendation for iso-price

### use IsoPriceShapeAmount + declarative exponent

for iso-price, the recommended pattern is:

```ts
type IsoPriceExponent =
  | 'whole.x10^0'
  | 'centi.x10^-2'
  | 'milli.x10^-3'
  | 'micro.x10^-6'
  | 'nano.x10^-9'
  | 'pico.x10^-12';

/**
 * .what = the amount of an iso-price in minor units
 * .why = supports number for common cases, bigint for high precision
 */
type IsoPriceShapeAmount = number | bigint;

interface IsoPriceShape {
  amount: IsoPriceShapeAmount;  // integer (bigint for pico)
  currency: string;             // ISO 4217 code
  exponent?: IsoPriceExponent;  // optional, defaults to currency standard
}
```

**why bigint over libraries?**

| aspect | bigint | decimal library |
|--------|--------|-----------------|
| native | yes | no (dependency) |
| bundle size | 0kb | 5-32kb |
| performance | fast | slower |
| json | needs serializer | needs serializer |
| decimal math | manual normalize | built-in |

### when to use libraries

use decimal.js or big.js when:
- you need built-in decimal division with configurable round mode
- you need trigonometric or scientific functions
- you prefer api ergonomics over raw performance

### iso-price implementation sketch

```ts
// types
type CurrencyCode = 'USD' | 'EUR' | 'JPY' | 'BHD';

type IsoPriceExponent =
  | 'whole.x10^0'
  | 'centi.x10^-2'
  | 'milli.x10^-3'
  | 'micro.x10^-6'
  | 'nano.x10^-9'
  | 'pico.x10^-12';

type IsoPriceShapeAmount = number | bigint;

interface IsoPriceShape {
  amount: IsoPriceShapeAmount;
  currency: CurrencyCode;
  exponent?: IsoPriceExponent;  // optional, defaults to currency standard
}

// exponent to numeric value
const EXPONENT_VALUE: Record<IsoPriceExponent, number> = {
  'centi.x10^-2': 2,
  'milli.x10^-3': 3,
  'micro.x10^-6': 6,
  'nano.x10^-9': 9,
  'pico.x10^-12': 12,
};

// iso 4217 standard exponents by currency
const CURRENCY_DEFAULT_EXPONENT: Record<string, IsoPriceExponent | null> = {
  USD: 'centi.x10^-2',
  EUR: 'centi.x10^-2',
  GBP: 'centi.x10^-2',
  JPY: null,  // no minor unit (whole yen)
  KRW: null,  // no minor unit (whole won)
  BHD: 'milli.x10^-3',
  KWD: 'milli.x10^-3',
  OMR: 'milli.x10^-3',
};

// resolve exponent (explicit or currency default)
const resolveExponent = (price: IsoPriceShape): IsoPriceExponent | null => {
  if (price.exponent) return price.exponent;
  return CURRENCY_DEFAULT_EXPONENT[price.currency] ?? 'centi.x10^-2';
};

// constructor
const isoPrice = (input: {
  amount: bigint | number;
  currency: CurrencyCode;
  exponent?: IsoPriceExponent;
}): IsoPriceShape => ({
  amount: input.amount,
  currency: input.currency,
  exponent: input.exponent,  // keep undefined if not specified
});

// normalize to target exponent
const normalize = (
  price: IsoPriceShape,
  targetExponent: IsoPriceExponent,
): IsoPriceShape => {
  const fromVal = EXPONENT_VALUE[price.exponent];
  const toVal = EXPONENT_VALUE[targetExponent];
  const diff = toVal - fromVal;
  if (diff === 0) return price;
  if (diff > 0) {
    // increase precision: multiply amount
    return {
      ...price,
      amount: price.amount * (10n ** BigInt(diff)),
      exponent: targetExponent,
    };
  }
  // decrease precision: divide amount (truncates)
  return {
    ...price,
    amount: price.amount / (10n ** BigInt(-diff)),
    exponent: targetExponent,
  };
};

// find highest precision exponent
const maxExponent = (a: IsoPriceExponent, b: IsoPriceExponent): IsoPriceExponent => {
  return EXPONENT_VALUE[a] >= EXPONENT_VALUE[b] ? a : b;
};

// add two prices
const add = (a: IsoPriceShape, b: IsoPriceShape): IsoPriceShape => {
  if (a.currency !== b.currency) {
    throw new Error('currency mismatch');
  }
  const targetExponent = maxExponent(a.exponent, b.exponent);
  const aNorm = normalize(a, targetExponent);
  const bNorm = normalize(b, targetExponent);
  return {
    amount: aNorm.amount + bNorm.amount,
    currency: a.currency,
    exponent: targetExponent,
  };
};

// usage
const ecommerce = isoPrice({ amount: 5037n, currency: 'USD', exponent: 'centi.x10^-2' });   // $50.37
const tokenCost = isoPrice({ amount: 5n, currency: 'USD', exponent: 'micro.x10^-6' });      // $0.000005
const total = add(ecommerce, tokenCost);  // { amount: 50370005n, currency: 'USD', exponent: 'micro.x10^-6' }
```

---

## safe integer ranges by exponent

| exponent | unit | max safe amount | max safe display |
|----------|------|-----------------|------------------|
| `centi.x10^-2` | cent | 9,007,199,254,740,991 | $90 trillion |
| `milli.x10^-3` | mill | 9,007,199,254,740,991 | $9 trillion |
| `micro.x10^-6` | micro | 9,007,199,254,740,991 | $9 billion |
| `nano.x10^-9` | nano | 9,007,199,254,740,991 | $9 million |
| `pico.x10^-12` | pico | 9,007,199,254,740,991 | $9,007 |

**critical**: for `pico.x10^-12`, javascript `number` can only safely represent up to ~$9,007. use `bigint` for any larger amounts.

---

## sources

- [MDN Number.MAX_SAFE_INTEGER](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER)
- [V8 BigInt](https://v8.dev/features/bigint)
- [decimal.js GitHub](https://github.com/MikeMcl/decimal.js)
- [big.js GitHub](https://github.com/MikeMcl/big.js)
- [TC39 Decimal proposal](https://github.com/tc39/proposal-decimal)
- [BigNumber library comparison](https://dev.to/fvictorio/a-comparison-of-bignumber-libraries-in-javascript-2gc5)
- [Decimal.js vs BigNumber.js](https://medium.com/@josephgathumbi/decimal-js-vs-c1471b362181)
- [LogRocket: Large numbers in Node.js](https://blog.logrocket.com/how-to-represent-large-numbers-node-js-app/)
