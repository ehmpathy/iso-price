# IsoPriceWords as string

## .what

`IsoPriceWords` is a branded string type, not a class. this is a deliberate design choice with tradeoffs.

## .why not native comparison operators

javascript comparison operators (`>`, `<`, `===`) cannot be overridden for strings or string subclasses:

**`===` is reference equality for objects**
```ts
class IsoPriceWords extends String {}
new IsoPriceWords('USD 50') === new IsoPriceWords('USD 50'); // false
```

**`>` `<` use `valueOf()` but with problems**
```ts
class IsoPriceWords extends String {
  valueOf(): number {
    return parseFloat(this.split(' ')[1].replace(/_/g, ''));
  }
}
```

this breaks:
- **precision** — `valueOf()` returns `number`, not `bigint`. sub-cent precision is lost.
- **currency safety** — `'USD 100' > 'EUR 50'` silently returns `true` instead of error.
- **type enforcement** — typescript allows any two `IsoPriceWords` to be compared, even different currencies.

**object pool partially solves `===`**
```ts
const pool = new Map<string, IsoPriceWords>();
// return cached instance for identical strings
```

but:
- memory grows unbounded
- precision variants are different pool entries (`'USD 50.00' !== 'USD 50.000_000'`)
- still doesn't fix `>` `<`

## .why string is still correct

### `===` works for identical representations

```ts
const a = asIsoPrice('$50.37'); // => 'USD 50.37'
const b = asIsoPrice('$50.37'); // => 'USD 50.37'
a === b; // true — same string value
```

branded strings get value equality for free. class instances would need an object pool.

### serialization is trivial

```ts
JSON.stringify({ total: 'USD 50.37' });
// => '{"total":"USD 50.37"}'

JSON.parse(json).total;
// => 'USD 50.37' — already valid IsoPriceWords
```

no custom serializers, no `.toJSON()`, no reviver functions. the format is the serialization.

### deserialization is zero-cost

```ts
const price = row.total; // from database, api, file
// already usable — no parse step required
```

class instances would need `new IsoPriceWords(raw)` or `IsoPriceWords.from(raw)` at every boundary.

### template literals work

```ts
console.log(`charged ${price} for order ${orderId}`);
// => 'charged USD 50.37 for order 123'
```

no `.toString()` needed. strings interpolate naturally.

### precision is visible

```ts
'USD 50.37'         // centi precision
'USD 50.370_000'    // micro precision
'USD 0.000_000_250' // nano precision
```

the string encodes its own precision. no hidden state.

### currency is explicit

```ts
'USD 50.37' // unambiguous — not '$50.37' which could be CAD, AUD, etc.
```

the iso 4217 code is part of the value.

## .explicit comparison methods

since operators can't be safe, iso-price provides explicit methods:

```ts
isIsoPrice.greater('USD 100.00', 'USD 9.00');  // true
isIsoPrice.lesser('USD 9.00', 'USD 100.00');   // true
isIsoPrice.equal('USD 0.25', 'USD 0.250_000'); // true (precision-aware)

asIsoPrice.sorted(['USD 100', 'USD 9', 'USD 50']);
// => ['USD 9', 'USD 50', 'USD 100']
```

benefits:
- **bigint precision** — no float errors
- **currency validation** — throws on mismatch
- **explicit intent** — code clearly shows numeric comparison

## .recommendation

use a linter rule to forbid direct comparison operators on `IsoPriceWords`:

```ts
// forbidden by linter
price1 > price2
price1 < price2
price1 === price2  // only when precision may differ

// required
isIsoPrice.greater(price1, price2)
isIsoPrice.lesser(price1, price2)
isIsoPrice.equal(price1, price2)
```

## .summary

| concern | string | class with valueOf |
|---------|--------|-------------------|
| `===` value equality | works | needs object pool |
| `>` `<` numeric | impossible | works but unsafe |
| bigint precision in `>` `<` | n/a | no — valueOf returns number |
| currency mismatch in `>` `<` | n/a | silent bug — no validation |
| serialization | trivial | needs custom logic |
| deserialization | zero-cost | needs instantiation |
| memory overhead | none | pool or per-instance |
| precision visible | yes | depends on toString |
| currency explicit | yes | depends on toString |

| concern | explicit methods |
|---------|-----------------|
| bigint precision | yes — lossless |
| currency mismatch | throws BadRequestError |
| intent | clear — `isIsoPrice.greater()` |

the string tradeoff: explicit comparison methods in exchange for trivial serialization, zero-cost deserialization, and no memory overhead. the explicit methods also provide bigint precision and currency validation that native operators cannot.
