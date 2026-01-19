# input-options pattern

## .what

the `(input, options?)` pattern is a narrowed form of the standard `(input, context)` procedure signature. it applies when the second argument contains only **operation configuration**, not runtime dependencies.

```ts
// standard (input, context) — context holds dependencies
const sendInvoice = async (
  input: { invoice: Invoice },
  context: { emailService: EmailService; log: LogMethods },
) => { ... };

// narrowed (input, options) — options holds configuration
const setPricePrecision = (
  input: { of: IsoPrice; to: IsoPriceExponent },
  options?: { round?: IsoPriceRoundMode; format?: 'words' | 'shape' },
) => { ... };
```

## .why

the `(input, context)` pattern serves two purposes:
1. **separate data from dependencies** — `input` is upstream data, `context` is runtime environment
2. **enable dependency injection** — context can be swapped for tests

for pure domain operations (no external dependencies), the second purpose doesn't apply. the operation only needs configuration — output format, round mode, precision level, etc. call it `options` to signal this narrower scope.

## .when to use each

| pattern | second arg contains | examples |
|---------|---------------------|----------|
| `(input, context)` | dependencies (db, log, services) | `sendInvoice`, `syncCustomer`, `processPayment` |
| `(input, options)` | configuration (format, mode, flags) | `setPricePrecision`, `sumPrices`, `allocatePrice` |

**rule of thumb**: if the second argument could be a static constant (no runtime state), use `options`. if it requires runtime injection (services, connections, loggers), use `context`.

## .anatomy

### input: the data to operate on

the primary argument — what the operation transforms or processes.

```ts
input: { of: IsoPrice; to: IsoPriceExponent }
input: { of: IsoPrice; by: number }
input: { of: IsoPrice; into: { parts: number } | { ratios: number[] } }
```

- always an object with named keys
- contains the essential data for the operation
- required — the operation cannot proceed without it

### options: operation configuration

the secondary argument — how the operation should behave.

```ts
options?: { round?: IsoPriceRoundMode; format?: 'words' | 'shape' }
options?: { format?: 'words' | 'shape' }
options?: { remainder: 'first' | 'last' | 'largest' }
```

- always optional (sensible defaults exist)
- contains configuration, not data
- pure values — no functions, services, or stateful objects

## .defaults

options should have sensible defaults that cover the common case:

```ts
// format defaults to 'words' (recommended for most use)
sumPrices('USD 10.00', 'USD 20.00')
// => 'USD 30.00'

// round defaults to 'half-up' (most common expectation)
setPricePrecision({ of: 'USD 5.555', to: 'centi.x10^-2' })
// => 'USD 5.56'

// explicit options when defaults don't fit
setPricePrecision({ of: 'USD 5.555', to: 'centi.x10^-2' }, { round: 'floor', format: 'shape' })
// => { amount: 555n, currency: 'USD' }
```

## .comparison with context

| aspect | `context` | `options` |
|--------|-----------|-----------|
| purpose | dependency injection | operation configuration |
| contents | services, connections, loggers | formats, modes, flags |
| testability | swap dependencies for mocks | no swap needed (pure) |
| optionality | often required | always optional |
| statefulness | may hold runtime state | pure values only |

### context example (dependencies)

```ts
const syncCustomerPhone = async (
  input: { customerId: string },
  context: { customerDao: CustomerDao; whodisClient: WhodisClient; log: LogMethods },
) => {
  context.log.info('sync.start', { customerId: input.customerId });
  const phone = await context.whodisClient.getPhone(input.customerId);
  await context.customerDao.update({ id: input.customerId, phone });
};
```

here `context` holds:
- `customerDao` — database access (stateful, injectable)
- `whodisClient` — external service (stateful, injectable)
- `log` — logger (stateful, injectable)

### options example (configuration)

```ts
const setPricePrecision = (
  input: { of: IsoPrice; to: IsoPriceExponent },
  options?: { round?: IsoPriceRoundMode; format?: 'words' | 'shape' },
) => {
  const mode = options?.round ?? 'half-up';
  const format = options?.format ?? 'words';
  // pure computation — no external dependencies
};
```

here `options` holds:
- `round` — which round algorithm (pure value)
- `format` — output format preference (pure value)

no injection needed — the operation is deterministic given its inputs.

## .hybrid: input + options + context

some operations need both configuration and dependencies:

```ts
const generateInvoice = async (
  input: { customerId: string; lineItems: LineItem[] },
  options: { taxMode: 'inclusive' | 'exclusive'; currency: IsoCurrency },
  context: { invoiceDao: InvoiceDao; taxService: TaxService; log: LogMethods },
) => { ... };
```

this is valid but rare. prefer to split into:
1. a pure operation with `(input, options)` for computation
2. a composed operation with `(input, context)` for orchestration

## .iso-price examples

```ts
// sum: spread syntax, options only when needed
sumPrices('USD 10.00', 'USD 20.00')
sumPrices(['USD 10.00', 'USD 20.00'], { format: 'shape' })

// precision: input + options
setPricePrecision({ of: 'USD 50.37', to: 'micro.x10^-6' })
setPricePrecision({ of: 'USD 5.555', to: 'centi.x10^-2' }, { round: 'floor' })

// multiply: input only (no options needed)
multiplyPrice({ of: 'USD 10.00', by: 3 })
multiplyPrice({ of: 'USD 10.00', by: 3 }, { format: 'shape' })

// allocate: input + options (remainder is required config)
allocatePrice({ of: 'USD 10.00', into: { parts: 3 }, remainder: 'first' })
allocatePrice({ of: 'USD 10.00', into: { parts: 3 }, remainder: 'first' }, { format: 'shape' })
```

## .summary

> `(input, options)` is `(input, context)` for pure operations
>
> when there are no dependencies to inject, call it `options`
