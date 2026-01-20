# iso-price

![test](https://github.com/ehmpathy/iso-price/workflows/test/badge.svg)
![publish](https://github.com/ehmpathy/iso-price/workflows/publish/badge.svg)

a pit of success for prices. iso 4217 currencies. si metric precision. ecmascript numeric separators.

## why

money math is deceptively hard:

```ts
0.1 + 0.2 === 0.30000000000000004  // float math
```

most solutions add complexity: decimal libraries, bigint wrappers, money objects. iso-price takes the opposite approach — make the correct choice simple.

```ts
import { sumPrices } from 'iso-price';

sumPrices('USD 0.10', 'USD 0.20');  // => 'USD 0.30'
```

that's it. words in, words out. the precision, currency validation, and bigint arithmetic happen automatically.

## design

### **any input, safe output.**

throw any format at it — `'$50.37'`, `'USD 50.37'`,  `{ amount: 5037, currency: 'USD' }`, `{ amount: 5037n, currency: 'USD' }` — and get back `IsoPriceWords`: a string that is serializable, lossless, readable, composable, and standards-conformant.

```ts
asIsoPrice('$50.37');                              // => 'USD 50.37'
asIsoPrice('USD 50.37');                           // => 'USD 50.37'
asIsoPrice({ amount: 5037, currency: 'USD' });     // => 'USD 50.37'
asIsoPrice({ amount: 5037n, currency: 'USD' });    // => 'USD 50.37'
```

when you need structured access, cast as shape:

```ts
asIsoPriceShape('USD 50.37');
// => { amount: 5037n, currency: 'USD', exponent: 'centi.x10^-2' }
```

when you need a localized display, cast as human:

```ts
asIsoPriceHuman('USD 50.37');
// => '$50.37'
```

by default, you get the best of all worlds, as words:

```ts
'USD 50.37' === asIsoPrice('$50.37') === asIsoPriceWords('$50.37');
// => true
```

### **thin contract, deep behavior.**

the surface is simple: prices are strictly structured words formatted like `'USD 50.37'`. under the hood: sub-cent precision, currency exponents, lossless bigint arithmetic, automatic precision normalization.

**sub-cent precision**
```ts
// from inputs
asIsoPrice('$0.000001');
  // => 'USD 0.000_001'
asIsoPriceShape('$0.000001');
  // => { amount: 1n, currency: 'USD', exponent: 'micro.x10^-6' }
asIsoPriceHuman('$0.000001');
  // => '$0.000001'

// and from arithmatic
dividePrice({ of: '$0.25', by: 1_000_000 });
  // => 'USD 0.000_000_250'
asIsoPriceShape(dividePrice({ of: '$0.25', by: 1_000_000 }));
  // => { amount: 250n, currency: 'USD', exponent: 'nano.x10^-9' }
asIsoPriceHuman(dividePrice({ of: '$0.25', by: 1_000_000 }));
  // => '$0.00000025'
```

**currency exponents** (iso 4217 standard)
```ts
// knowns the iso 4217 standard exponent for each currency
asIsoPrice('¥1000');
  // => 'JPY 1_000'
asIsoPriceShape('¥1000');
  // => { amount: 1000n, currency: 'JPY', exponent: 'whole.x10^0' }
asIsoPriceHuman('¥1000');
  // => '¥1,000'

// expands to the standard exponent of the currency by default
asIsoPrice('BHD 1.23');
  // => 'BHD 1.230' (standardized to 3 decimals)
asIsoPriceShape('BHD 1.23');
  // => { amount: 1230n, currency: 'BHD', exponent: 'milli.x10^-3' }
asIsoPriceHuman('BHD 1.23');
  // => 'BHD 1.230'

// to guarantee that every price looks natural in that currency
asIsoPrice('$7');
  // => 'USD 7.00' (standardized to 2 decimals)
asIsoPriceShape('$7');
  // => { amount: 700n, currency: 'USD', exponent: 'centi.x10^-2' }
asIsoPriceHuman('$7');
  // => '$7.00'

// and yet still allow exponent override, for when you want control
asIsoPrice('$7', { exponent: 'whole.x10^0' });
  // => 'USD 7'
asIsoPriceShape('$7', { exponent: 'whole.x10^0' });
  // => { amount: 7n, currency: 'USD', exponent: 'whole.x10^0' }
asIsoPriceHuman('$7', { exponent: 'whole.x10^0' });
  // => '$7'

// and yet still preserves the maximum precision, to whatever was supplied
asIsoPrice('$7.12345');
  // => 'USD 7.123_450' (preserves the micro precision from the input)
asIsoPriceShape('$7.12345');
  // => { amount: 7123450n, currency: 'USD', exponent: 'micro.x10^-6' }
asIsoPriceHuman('$7.12345');
  // => '$7.12345'

// and yet still makes it easy to round, when you need to, too
asIsoPrice('$7.12345', { exponent: 'milli.x10^-3', round: 'half-up' });
  // => 'USD 7.123'
asIsoPriceShape('$7.12345', { exponent: 'milli.x10^-3', round: 'half-up' });
  // => { amount: 7123n, currency: 'USD', exponent: 'milli.x10^-3' }
asIsoPriceHuman('$7.12345', { exponent: 'milli.x10^-3', round: 'half-up' });
  // => '$7.123'
```

**custom currencies**
```ts
// custom currencies default to the 2 decimals exponent standard, common for 95%+ of currencies
asIsoPrice('BTC 1.5');
  // => 'BTC 1.50'
asIsoPriceShape('BTC 1.5');
  // => { amount: 150n, currency: 'BTC', exponent: 'centi.x10^-2' }
asIsoPriceHuman('BTC 1.5');
  // => 'BTC 1.50'
```

```ts
// automatic precision merger (retains the most granular)
sumPrices('USD 50.00', 'USD 0.000_005');
  // => 'USD 50.000_005'
asIsoPriceShape(sumPrices('USD 50.00', 'USD 0.000_005'));
  // => { amount: 50_000_005n, currency: 'USD', exponent: 'micro.x10^-6' }
asIsoPriceHuman(sumPrices('USD 50.00', 'USD 0.000_005'));
  // => '$50.000005'
```

### **explicit, not magic.**

precision is visible in the words. no hidden state, no surprises.

```ts
// precision is encoded in the output — what you see is what you have
'USD 50.37'           // centi (cents) — 2 decimal places
'USD 50.370_000'      // micro — 6 decimal places
'USD 0.000_000_250'   // nano — 9 decimal places

// the shape tells you exactly what's inside
asIsoPriceShape('USD 0.000_000_250');
// => { amount: 250n, currency: 'USD', exponent: 'nano.x10^-9' }
```

### **standards-based.**

- **iso 4217** — currency codes and exponents (USD=2, JPY=0, BHD=3)
- **si metric prefixes** — centi, milli, micro, nano, pico
- **ecmascript numeric separators** — underscores for readability

```ts
// iso 4217: currency codes with standard exponents
asIsoPrice('$50.37');      // => 'USD 50.37'  (code: USD, exponent: 2)
asIsoPrice('¥1000');       // => 'JPY 1000'   (code: JPY, exponent: 0)
asIsoPrice('BHD 1.234');   // => 'BHD 1.234'  (code: BHD, exponent: 3)

// si metric prefixes: centi (10⁻²), milli (10⁻³), micro (10⁻⁶), nano (10⁻⁹), pico (10⁻¹²)
setPricePrecision({ of: 'USD 1.00', to: 'micro.x10^-6' });
// => 'USD 1.000_000'

// ecmascript numeric separators: underscores group digits for readability
'USD 1_000_000.00'      // one million dollars
'USD 0.000_001'         // one micro-dollar
'USD 1_234.567_890'     // mixed — both sides of decimal
```

### **thorough and durable.**

`IsoPriceWords` is lossless, observable, and always safe to pass around in application code. serialize it, log it, store it, compare it — it just works.

```ts
// serialize
JSON.stringify({ total: 'USD 50.37' });
// => '{"total":"USD 50.37"}'

// log
console.log(`charged ${price} for order ${orderId}`);
// => 'charged USD 50.37 for order 123'

// compare
'USD 50.37' === 'USD 50.37';
// => true
```

`IsoPriceShape` eliminates numeric-float errors and integer overflow via automatic exponent scale and bigint internals. all arithmetic operations leverage this under the hood. it's hidden complexity — available when you need it, invisible by default.

```ts
// float math breaks
0.1 + 0.2;
// => 0.30000000000000004

// iso-price just works
sumPrices('USD 0.10', 'USD 0.20');
// => 'USD 0.30'

// bigint internals handle any scale — even pico (10⁻¹²)
sumPrices('USD 1_000_000_000.00', 'USD 0.000_000_000_001');
// => 'USD 1_000_000_000.000_000_000_001'
```

persistence is straightforward with both. since `IsoPriceWords` is lossless, if you don't need in-database computation, you can persist it directly — perfect for nosql and mvp sql storage. for extension-supported databases (postgres, sqlite), you can also leverage [extensions](#persistence) to make storage and manipulation of `IsoPriceShape` as natural as any other numeric type.

**nosql** — just store the words
```ts
await dynamodb.put({ pk: orderId, total: 'USD 50.37' });
const order = await dynamodb.get({ pk: orderId });
sumPrices(order.total, fee);
// => 'USD 58.37'
```

**postgres** with the iso_price extension — native operators against iso_price shapes and words
```ts
await sql`
  SELECT id, total FROM orders
  WHERE total > 'USD 10.00'
    AND (total).currency = 'USD'
  ORDER BY total DESC
`;
// => [
//   { id: 3, total: '(5037,USD,centi.x10^2)' },
//   { id: 1, total: '(2500,USD,centi.x10^2)' },
// ]

await sql`SELECT sum(total) FROM line_items WHERE order_id = ${orderId}`;
// => [{ sum: '(15037,USD,centi.x10^2)' }]
```

## install

```sh
npm install iso-price
```

## usage

### the basics

```ts
import { asIsoPrice, sumPrices, multiplyPrice } from 'iso-price';

// parse any format
const price = asIsoPrice('$50.37');           // => 'USD 50.37'
const price = asIsoPrice('EUR 100.00');       // => 'EUR 100.00'

// arithmetic just works, regardless of input format
sumPrices('$10', 'USD 20.00');                // => 'USD 30.00'
multiplyPrice({ of: '$100', by: 1.08 });      // => 'USD 108.00'
```

### sub-cent precision

llm token costs, serverless invocations, crypto — sometimes you need more than cents:

```ts
import { dividePrice, sumPrices } from 'iso-price';

// $0.25 per million tokens
const perToken = dividePrice({ of: '$0.25', by: 1_000_000 });
// => 'USD 0.000_000_250'

// track micro-costs, sum to invoice
const costs = ['USD 0.011_845_500', 'USD 47.370_001_970'];
sumPrices(costs);  // => 'USD 47.381_847_470'

// cross-precision arithmetic auto-resolves to most granular
sumPrices('USD 50.00', 'USD 0.000_005');  // => 'USD 50.000_005'
```

precision scales automatically. no configuration needed.

### three formats

| format          | example                                                        | use                      |
| --------------- | -------------------------------------------------------------- | ------------------------ |
| `IsoPriceWords` | `'USD 50.37'`                                                  | storage, logs, api, json |
| `IsoPriceShape` | `{ amount: 5037n, currency: 'USD', exponent: 'centi.x10^-2' }` | computation              |
| `IsoPriceHuman` | `'$50.37'`                                                     | display                  |

all operations accept any format. all return `IsoPriceWords` by default.

```ts
import { asIsoPriceShape, asIsoPriceHuman } from 'iso-price';

// need structured access for stripe or persistence?
asIsoPriceShape('USD 50.37');
// => { amount: 5037n, currency: 'USD', exponent: 'centi.x10^-2' }

// need display format?
asIsoPriceHuman('USD 50.37');  // => '$50.37'
```

### allocation without loss

money splits create remainders. iso-price handles them:

```ts
import { allocatePrice } from 'iso-price';

allocatePrice({ of: 'USD 10.00', into: { parts: 3 }, remainder: 'first' });
// => ['USD 3.34', 'USD 3.33', 'USD 3.33']
// sum: exactly $10.00
```

## api

### cast

- `asIsoPrice(input)` — normalize to words
- `asIsoPriceWords(input)` — convert to words
- `asIsoPriceShape(input)` — convert to shape
- `asIsoPriceHuman(input)` — convert to display

### arithmetic

- `sumPrices(...prices)` / `priceSum` / `addPrices` / `priceAdd`
- `subPrices(a, b)` / `priceSub`
- `multiplyPrice({ of, by })` / `priceMultiply`
- `dividePrice({ of, by })` / `priceDivide`
- `allocatePrice({ of, into, remainder })` / `priceAllocate`

### precision

- `setPricePrecision({ of, to }, options?)`
- `roundPrice({ of }, options?)`
- `getIsoPriceExponentByCurrency(currency)`

### statistics

- `calcPriceAvg(prices)`
- `calcPriceStdev(prices)`

### guards

- `isIsoPrice(input)` / `.assure(input)`
- `isIsoPriceWords(input)` / `.assure(input)`
- `isIsoPriceShape(input)` / `.assure(input)`
- `isIsoPriceHuman(input)` / `.assure(input)`

### types

- `IsoPrice<TCurrency>` — union of all formats
- `IsoPriceWords<TCurrency>` — branded string
- `IsoPriceShape<TCurrency>` — bigint object
- `IsoPriceHuman` — display string
- `IsoPriceExponent` — precision enum
- `IsoPriceRoundMode` — round mode enum
- `IsoCurrency` — top 25 currencies enum

## currency exponents

iso 4217 defines the standard precision (exponent) for each currency. iso-price applies these automatically:

```ts
asIsoPrice('$50.37');      // => 'USD 50.37'  (2 decimals — cents)
asIsoPrice('¥1000');       // => 'JPY 1000'   (0 decimals — no minor unit)
asIsoPrice('BHD 1.234');   // => 'BHD 1.234'  (3 decimals — fils)
```

| currency      | exponent | minor unit | example       |
| ------------- | -------- | ---------- | ------------- |
| USD, EUR, GBP | 2        | cents      | `'USD 50.37'` |
| JPY, KRW, VND | 0        | none       | `'JPY 1000'`  |
| BHD, KWD, OMR | 3        | fils/baisa | `'BHD 1.234'` |

when you need more precision than the standard (llm tokens, serverless), iso-price extends with si metric prefixes:

## exponents

si metric prefixes for explicit precision:

| exponent       | factor | iso 4217   | examples   |
| -------------- | ------ | ---------- | ---------- |
| `whole.x10^0`  | 10⁰    | 0 decimals | jpy, krw   |
| `centi.x10^-2` | 10⁻²   | 2 decimals | usd, eur   |
| `milli.x10^-3` | 10⁻³   | 3 decimals | bhd, kwd   |
| `micro.x10^-6` | 10⁻⁶   | —          | llm tokens |
| `nano.x10^-9`  | 10⁻⁹   | —          | serverless |
| `pico.x10^-12` | 10⁻¹²  | —          | extreme    |

## real-world examples

### e-commerce invoice

standard cents precision — the common case:

```ts
const lineItems = ['USD 29.99', 'USD 14.50', 'USD 5.99'];
const subtotal = sumPrices(lineItems);                    // => 'USD 50.48'
const withTax = multiplyPrice({ of: subtotal, by: 1.08 }); // => 'USD 54.52'
```

### llm api cost aggregation

nano-dollar precision for per-token costs:

```ts
// claude haiku: $0.25 per million input tokens
const costPerToken = dividePrice({ of: 'USD 0.25', by: 1_000_000 });
// => 'USD 0.000_000_250'

// accumulate usage across requests
const costsAccumulated = [
  'USD 0.000_047_250',   // 189 tokens
  'USD 0.000_125_000',   // 500 tokens
  'USD 0.002_847_500',   // 11,390 tokens
];

// sum micro-costs into invoiceable amount
const costTotal = sumPrices(costsAccumulated);  // => 'USD 0.003_019_750'

// combine with standard e-commerce charges
const platformFee = 'USD 9.99';
const invoice = sumPrices(platformFee, costTotal);
// => 'USD 9.993_019_750'
```

### bill allocation

allocate without remainder loss:

```ts
// split a $100 dinner bill 3 ways
allocatePrice({ of: 'USD 100.00', into: { parts: 3 }, remainder: 'first' });
// => ['USD 33.34', 'USD 33.33', 'USD 33.33']
// sum: exactly $100.00

// split by ratio (60/40)
allocatePrice({ of: 'USD 100.00', into: { ratios: [6, 4] }, remainder: 'first' });
// => ['USD 60.00', 'USD 40.00']
```

## currency symbols

currency symbols are lossy — `$` could be USD, CAD, AUD, or 20+ other currencies. iso-price defaults to the most common:

| symbol | default | also used by                      |
| ------ | ------- | --------------------------------- |
| `$`    | USD     | CAD, AUD, NZD, MXN, SGD, HKD, ... |
| `€`    | EUR     | (unique)                          |
| `£`    | GBP     | EGP, LBP, SYP, ...                |
| `¥`    | JPY     | CNY                               |

override when needed:

```ts
asIsoPrice('$50.37');                        // => 'USD 50.37'
asIsoPrice('$50.37', { currency: 'CAD' });   // => 'CAD 50.37'
asIsoPrice('$50.37', { currency: 'AUD' });   // => 'AUD 50.37'
```

for unambiguous storage and transmission, always use `IsoPriceWords` format (`'USD 50.37'`). use `IsoPriceHuman` (`'$50.37'`) only for display.

## serialization

`IsoPriceWords` is a string — it serializes trivially:

```ts
const price = sumPrices('USD 10.00', 'USD 20.00');  // => 'USD 30.00'

JSON.stringify({ total: price });
// => '{"total":"USD 30.00"}'
```

`IsoPriceShape` uses bigint, which cannot be serialized directly:

```ts
JSON.stringify({ amount: 5037n });
// => TypeError: Do not know how to serialize a BigInt
```

this is intentional — it pushes you toward `IsoPriceWords` for persistence, which is portable, human-readable, and lossless.

## persistence

| database                    | recommendation          | storage                        |
| --------------------------- | ----------------------- | ------------------------------ |
| dynamodb, mongodb, s3, json | `IsoPriceWords`         | `"USD 50.37"`                  |
| postgres, sqlite            | `iso_price` extension   | native arithmetic + comparison |
| mysql, mariadb              | see persistence catalog | many considerations            |

**nosql / json** — store as words. these databases don't support numeric price comparisons anyway, so use the portable, human-readable format:

```ts
await dynamodb.put({ total: 'USD 50.37' });
const price = asIsoPrice(item.total);  // => 'USD 50.37'
```

**postgres / sqlite** — use the `iso_price` extension for native operators:

```sql
SELECT * FROM items WHERE price > 'USD 10.00' ORDER BY price;
SELECT sum(price) FROM line_items;  -- auto-normalizes exponents
```

**other sql** (mysql, mariadb, etc) — these databases don't support extensions, so price comparisons across currencies and precisions require careful consideration. see the [persistence catalog](./.agent/repo=.this/role=dbadmin/briefs/per001.persistence._.[catalog].md) for patterns.

## round modes

when precision decreases, a round mode is required:

```ts
import { setPricePrecision, roundPrice } from 'iso-price';

// default: half-up (standard round behavior)
setPricePrecision({ of: 'USD 5.555', to: 'centi.x10^-2' });
// => 'USD 5.56'

// explicit round modes
setPricePrecision({ of: 'USD 5.555', to: 'centi.x10^-2' }, { round: 'floor' });
// => 'USD 5.55'

setPricePrecision({ of: 'USD 5.555', to: 'centi.x10^-2' }, { round: 'ceil' });
// => 'USD 5.56'

// round to currency's standard precision
roundPrice({ of: 'USD 5.555_555' });  // => 'USD 5.56'
```

| mode        | behavior                              | 5.555 → cents |
| ----------- | ------------------------------------- | ------------- |
| `half-up`   | round half toward +∞ (default)        | 5.56          |
| `half-down` | round half toward 0                   | 5.55          |
| `half-even` | round half to nearest even (banker's) | 5.56          |
| `floor`     | toward −∞                             | 5.55          |
| `ceil`      | toward +∞                             | 5.56          |
| `trunc`     | toward 0                              | 5.55          |

## supported currencies

`IsoCurrency` includes the top 25 currencies by forex volume plus the 3-decimal currencies:

```ts
enum IsoCurrency {
  // top by volume
  USD, EUR, JPY, GBP, CNY, AUD, CAD, CHF, HKD, NZD,
  SEK, KRW, SGD, NOK, MXN, INR, ZAR, BRL, DKK, PLN, THB,
  // 3-decimal (fils/baisa)
  BHD, KWD, OMR, TND,
}
```

custom currencies (BTC, ETH, or any 3-letter code) are supported — they default to 2-decimal precision unless explicitly specified.
