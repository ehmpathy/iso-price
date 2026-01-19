# tc39 decimal proposal

the future of native decimal arithmetic in javascript.

## status

| attribute | value |
|-----------|-------|
| stage | 2 (draft) as of 2025 |
| champions | jesse alama (igalia) |
| spec | IEEE 754-2019 Decimal128 |
| proposal | [tc39/proposal-decimal](https://github.com/tc39/proposal-decimal) |
| polyfill | [proposal-decimal](https://www.npmjs.com/package/proposal-decimal) |

tc39 has considered native decimal support for over 12 years. the proposal reached stage 2 in 2024-2025.

---

## the problem

javascript's `number` type uses ieee 754 binary64 (double-precision float):

```ts
0.1 + 0.2 === 0.3  // false (0.30000000000000004)
0.1 * 0.1          // 0.010000000000000002
```

this causes real, user-visible errors in financial applications.

current workarounds:
- scale to integers (`5037` instead of `50.37`)
- use string representation (`"50.37"`)
- use userland libraries (decimal.js, bignumber.js)

all have tradeoffs: complexity, bundle size, or performance.

---

## the solution

a native `Decimal` or `Decimal128` type based on ieee 754-2019 Decimal128:

- 128-bit decimal float
- 34 significant digits
- exponent range: -6143 to +6144
- exact decimal arithmetic (no binary float errors)

### proposed api

```ts
// construction (no literal syntax planned)
const price = new Decimal('50.37');
const rate = new Decimal('0.000005');

// arithmetic
const sum = price.add(rate);
const product = price.multiply(new Decimal('1.5'));
const quotient = price.divide(new Decimal('3'));

// comparison
price.equals(new Decimal('50.37'))     // true
price.lessThan(new Decimal('100'))     // true
price.compare(new Decimal('50.37'))    // 0

// conversion
price.toString()        // '50.37'
price.toNumber()        // 50.37 (may lose precision)
```

### no literal syntax

the proposal does **not** include literal syntax like `123.456m`:

```ts
// NOT planned
const price = 50.37m;  // ❌ no literal syntax
```

this decision was made based on feedback from javascript engine implementors.

---

## polyfill

try the proposal today via npm:

```sh
npm install proposal-decimal
```

```ts
import { Decimal128 } from 'proposal-decimal';

const a = new Decimal128('0.1');
const b = new Decimal128('0.2');
const sum = a.add(b);

console.log(sum.toString());  // '0.3' (exact)
console.log(sum.equals(new Decimal128('0.3')));  // true
```

### polyfill api

```ts
// construction
new Decimal128('50.37')
new Decimal128(50.37)           // from number (may lose precision)
new Decimal128(5037n, -2)       // from bigint + scale

// arithmetic
d.add(other)
d.subtract(other)
d.multiply(other)
d.divide(other)

// comparison
d.equals(other)
d.lessThan(other)
d.compare(other)                // -1, 0, or 1

// conversion
d.toString()
d.toNumber()
d.toBigInt()                    // truncates decimal
```

---

## design decisions

### why Decimal128?

| option | precision | range | notes |
|--------|-----------|-------|-------|
| Decimal32 | 7 digits | modest | too small for finance |
| Decimal64 | 16 digits | wide | possible but limited |
| Decimal128 | 34 digits | huge | matches other langs |

Decimal128 aligns with:
- python `decimal.Decimal`
- java `BigDecimal`
- c# `decimal`
- sql `DECIMAL`

### why no literal syntax?

engine implementors raised concerns:
- parse complexity
- backwards compat with prior code
- alternative: string constructor is sufficient

### object vs primitive

the current proposal uses objects (`new Decimal(...)`), not primitives.

implications:
- `typeof new Decimal('1')` → `'object'`
- not usable as object keys directly
- gc overhead for many instances

future proposals may add primitive decimal if objects prove to have limits.

---

## relation to iso-price

### current state

iso-price uses integer + exponent pattern:

```ts
// iso-price today
{ amount: 5037, currency: 'USD', exponent: 'centi.x10^-2' }  // $50.37
{ amount: 5, currency: 'USD', exponent: 'micro.^-6' }     // $0.000005
```

this works without native decimal support via:
- integer storage (no float errors)
- explicit exponent (declarative precision)
- bigint for pico precision

### future integration

when tc39 Decimal ships, iso-price could:

1. **internal use**: use Decimal for intermediate calculations
2. **optional output**: add `asDecimal()` cast method
3. **input acceptance**: accept Decimal as input alongside shape/words

```ts
// future possibility
import { Decimal128 } from 'decimal';  // native

const price: IsoPrice = { amount: 5037, currency: 'USD' };
const decimal = asDecimal(price);  // Decimal128('50.37')
```

### why not wait for native Decimal?

1. **stage 2 is not stage 4** — may take years to ship, if ever
2. **integer + exponent works now** — no external dependency
3. **bigint solves precision** — handles pico-scale without Decimal
4. **explicit exponent is valuable** — documents intent in the type

---

## timeline

| date | milestone |
|------|-----------|
| 2017 | initial discussion |
| 2020 | stage 1 |
| 2024 | stage 2 |
| 202? | stage 3 (spec complete) |
| 202? | stage 4 (ship in engines) |

conservative estimate: 2-4 years until available in browsers/node.

---

## sources

- [TC39 Decimal proposal](https://github.com/tc39/proposal-decimal)
- [Decimal proposal spec](http://tc39.es/proposal-decimal/)
- [Polyfill announcement](https://jessealama.net/decimal-proposal-polyfill/)
- [Decimal proposal npm](https://www.npmjs.com/package/proposal-decimal)
- [IEEE 754-2019](https://en.wikipedia.org/wiki/IEEE_754)
- [TC39 2025 proposals overview](https://medium.com/@codewithrajat/tc39-2025-unveiling-the-future-of-javascript-innovation-b69db4b39a77)
