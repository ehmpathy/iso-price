# proposal: IsoPriceWords generic constraint

## .what

add a `TCurrency` generic parameter to `IsoPriceWords` via template literal types. this enables compile-time currency constraints that mirror `IsoPriceShape<TCurrency>`.

## .current

```ts
type IsoPriceWords = string;  // no compile-time currency constraint

const price: IsoPriceWords = 'USD 50.37';  // ✓
const oops: IsoPriceWords = 'INVALID 50.37';  // ✓ no error
```

## .proposed

```ts
type IsoPriceWords<TCurrency extends string = string> = `${TCurrency} ${string}`;

// default: any currency (backwards compatible)
const price: IsoPriceWords = 'USD 50.37';  // ✓
const any: IsoPriceWords = 'XYZ 50.37';    // ✓

// constrained: specific currency
const usd: IsoPriceWords<'USD'> = 'USD 50.37';  // ✓
const bad: IsoPriceWords<'USD'> = 'EUR 50.37';  // ✗ compile error

// constrained: currency union
const multi: IsoPriceWords<'USD' | 'EUR'> = 'USD 50.37';  // ✓
const nope: IsoPriceWords<'USD' | 'EUR'> = 'GBP 50.37';   // ✗ compile error

// constrained: iso 4217 only
const iso: IsoPriceWords<IsoCurrency> = 'USD 50.37';  // ✓
const crypto: IsoPriceWords<IsoCurrency> = 'BTC 1.00';  // ✗ compile error
```

## .why

### consistency with IsoPriceShape

`IsoPriceShape` already supports `TCurrency` constraint:

```ts
interface IsoPriceShape<TCurrency extends string = string> {
  amount: bigint;
  currency: TCurrency;
}
```

`IsoPriceWords` should offer the same capability for type-safe currency operations.

### pit of success

developers who work with single-currency systems (e.g., USD-only e-commerce) can enforce currency at compile time:

```ts
// all prices in this module must be USD
type UsdPrice = IsoPriceWords<'USD'>;

const checkout = (total: UsdPrice) => { ... };

checkout('USD 50.37');  // ✓
checkout('EUR 50.37');  // ✗ compile error — caught before runtime
```

### cast function alignment

cast functions can preserve the generic constraint:

```ts
// cast preserves currency constraint
asIsoPriceWords<'USD'>({ amount: 5037n, currency: 'USD' })
// => IsoPriceWords<'USD'>

// sum preserves currency constraint
sumPrices<'USD'>(['USD 10.00', 'USD 20.00'])
// => IsoPriceWords<'USD'>
```

## .template literal precision

the template literal can be more precise if needed:

```ts
// basic: currency + space + any numeric string
type IsoPriceWords<TCurrency extends string = string> = `${TCurrency} ${string}`;

// stricter: currency + space + numeric pattern
type IsoPriceWords<TCurrency extends string = string> =
  `${TCurrency} ${number}` |
  `${TCurrency} ${number}.${string}` |
  `${TCurrency} -${number}` |
  `${TCurrency} -${number}.${string}`;
```

recommendation: start with basic pattern (`${TCurrency} ${string}`) for simplicity. the runtime cast functions already validate the full format.

## .api surface

### types

```ts
// words with optional currency constraint
type IsoPriceWords<TCurrency extends string = string> = `${TCurrency} ${string}`;

// human format (symbol-based) — no constraint needed (symbols are lossy)
type IsoPriceHuman = string;
```

### cast functions

```ts
// cast functions accept generic
function asIsoPriceWords<TCurrency extends string = string>(
  input: IsoPriceShape<TCurrency> | IsoPriceWords<TCurrency>
): IsoPriceWords<TCurrency>;

function asIsoPrice<TCurrency extends string = string>(
  input: string,
  options?: { currency?: TCurrency }
): IsoPriceWords<TCurrency>;
```

### arithmetic functions

```ts
// arithmetic preserves currency constraint
function sumPrices<TCurrency extends string = string>(
  prices: IsoPriceWords<TCurrency>[],
  options?: { format?: 'words' }
): IsoPriceWords<TCurrency>;

function sumPrices<TCurrency extends string = string>(
  prices: IsoPriceWords<TCurrency>[],
  options: { format: 'shape' }
): IsoPriceShape<TCurrency>;
```

## .examples

### e-commerce (USD only)

```ts
type UsdPrice = IsoPriceWords<'USD'>;

interface CartItem {
  name: string;
  price: UsdPrice;
}

const cart: CartItem[] = [
  { name: 'Widget', price: 'USD 10.00' },  // ✓
  { name: 'Gadget', price: 'EUR 20.00' },  // ✗ compile error
];

const total: UsdPrice = sumPrices(cart.map(i => i.price));
```

### multi-currency (explicit set)

```ts
type SupportedCurrency = 'USD' | 'EUR' | 'GBP';
type Price = IsoPriceWords<SupportedCurrency>;

const convert = (from: Price, to: SupportedCurrency): Price => { ... };
```

### iso 4217 enforcement

```ts
type IsoPrice = IsoPriceWords<IsoCurrency>;

// only standard currencies accepted
const price: IsoPrice = 'USD 50.37';  // ✓
const crypto: IsoPrice = 'BTC 1.00';  // ✗ compile error
```

## .backwards compatibility

the default generic parameter (`string`) ensures prior code continues to work:

```ts
// prior code — no change needed
const price: IsoPriceWords = 'USD 50.37';  // ✓
sumPrices(['USD 10.00', 'USD 20.00']);     // ✓
```

## .decision

**recommend: implement**

- aligns with current `IsoPriceShape<TCurrency>` pattern
- enables compile-time currency safety
- backwards compatible via default generic
- minimal implementation complexity (template literal type)

## .see also

- `define.iso4217-currencies.md` — IsoCurrency enum
- `define.currency-symbols-lossy.md` — why IsoPriceHuman doesn't need constraint
