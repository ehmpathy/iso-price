# design decision: no fluent api

iso-price uses standalone domain operations, not fluent methods on domain objects.

---

## the question

javascript does not support operator overload, so `priceA + priceB` is not possible.

the common alternative is a **fluent api** where methods live on the domain object:

```ts
// fluent api pattern (decimal.js, bignumber.js, dinero.js)
const total = priceA.add(priceB).mul(2).sub(discount);
```

should iso-price use this pattern?

---

## the decision

**no.** iso-price uses standalone domain operations:

```ts
// ✅ iso-price pattern — standalone domain operations
const subtotal = sumPrices(lineItems.map(i => i.price));
const withTax = sumPrices(subtotal, tax);
const total = subPrices(withTax, discount);
const perPerson = dividePrice({ of: total, by: 3 });
```

---

## why standalone functions?

### 1. domain objects should be data, not behavior

- `IsoPriceShape` is a domain object — it represents a value
- operations like `sum`, `multiply`, `allocate` are domain operations
- to mix data and behavior couples them unnecessarily
- ddd principle: keep the "what" separate from the "how"

### 2. standalone functions are more composable

- `sumPrices(a, b)` works with any `IsoPrice` input (shape or words)
- `a.add(b)` requires `a` to be a specific class instance
- standalone functions compose naturally with `map`, `reduce`, `filter`

### 3. easier to test

- pure functions with explicit inputs are trivial to unit test
- methods on objects require instance setup and state management
- no need to mock class internals

### 4. familiar pattern

- `sumPrices(a, b)` reads like standard function calls
- no need to learn a fluent dsl
- matches how most developers think about operations

### 5. better tree-shake

- bundlers can eliminate unused standalone functions
- class methods are harder to tree-shake

---

## comparison

| aspect | fluent api | standalone functions |
|--------|------------|---------------------|
| couple | tight (data + behavior) | loose (data separate) |
| input flexibility | class instances only | any IsoPrice format |
| testability | requires instance setup | pure function tests |
| learn curve | must learn dsl | standard function calls |
| tree-shake | harder | easy |

---

## what fluent looks like (rejected)

```ts
// ❌ NOT the iso-price pattern
class IsoPrice {
  add(other: IsoPrice): IsoPrice { ... }
  sub(other: IsoPrice): IsoPrice { ... }
  mul(scalar: number): IsoPrice { ... }
  div(scalar: number): IsoPrice { ... }
}

const total = price
  .add(tax)
  .mul(quantity)
  .sub(discount);
```

problems:
- `price` must be an `IsoPrice` instance, not a shape or words
- behavior lives on the domain object
- harder to extend without modify the class

---

## what iso-price looks like (chosen)

```ts
// ✅ the iso-price pattern
const total = subPrices(
  multiplyPrice({
    price: sumPrices(price, tax),
    by: quantity,
  }),
  discount,
);

// or step by step
const withTax = sumPrices(price, tax);
const scaled = multiplyPrice({ of: withTax, by: quantity });
const total = subPrices(scaled, discount);
```

benefits:
- works with `IsoPriceShape`, `IsoPriceWords`, or mixed
- pure functions, trivial to test
- no class instantiation required

---

## prior art

this aligns with how the ecosystem handles similar patterns:

| library | pattern | example |
|---------|---------|---------|
| lodash | standalone | `_.sum(prices)` |
| ramda | standalone | `R.add(a, b)` |
| sql | standalone | `SUM(column)` |
| decimal.js | fluent | `a.plus(b)` |
| dinero.js | fluent | `d.add(other)` |

iso-price follows the lodash/ramda/sql pattern, not the decimal.js/dinero.js pattern.

---

## summary

> prefer `sumPrices(a, b)` over `a.add(b)`
>
> domain objects hold data. domain operations transform data.
> keep them separate.
