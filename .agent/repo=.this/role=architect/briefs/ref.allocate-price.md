# allocatePrice

how iso-price handles fair distribution of monetary values across multiple recipients.

---

## the problem: indivisible units

money has a smallest unit — cents, fils, satoshis. you cannot split a penny in half. this creates a fundamental problem when you need to distribute a sum across multiple recipients.

**example**: split $10.00 three ways equally.

```
$10.00 ÷ 3 = $3.333333...
```

you cannot charge $3.33̅ — the smallest unit is $0.01. no matter how you round, you either lose or gain money:

| round mode | result | sum | error |
|------------|--------|-----|-------|
| floor (truncate) | $3.33 × 3 | $9.99 | **lost $0.01** |
| ceil | $3.34 × 3 | $10.02 | **gained $0.02** |
| half-up | $3.33 × 3 | $9.99 | **lost $0.01** |

this is the **penny problem** — multiplication works for proportional charges (like tax), but fails for allocation. the solution is an allocator that distributes the remainder fairly.

---

## what allocatePrice does

`allocatePrice` splits a monetary value into parts **without loss or gain**. the sum of allocated parts always equals the original amount.

```ts
allocatePrice({ of: 'USD 10.00', into: { parts: 3 }, remainder: 'first' })
// => ['USD 3.34', 'USD 3.33', 'USD 3.33']
// sum: $3.34 + $3.33 + $3.33 = $10.00 ✓
```

the extra penny goes to the first recipient. no money is lost or created.

---

## the remainder parameter

when a sum cannot be divided evenly, there is a **remainder** — the leftover cents that must go somewhere. the `remainder` parameter controls where those cents are distributed.

### remainder options

| value | behavior | example: $10.00 ÷ 3 |
|-------|----------|---------------------|
| `'first'` | extra cents go to first recipient | `['USD 3.34', 'USD 3.33', 'USD 3.33']` |
| `'last'` | extra cents go to last recipient | `['USD 3.33', 'USD 3.33', 'USD 3.34']` |
| `'largest'` | extra cents go to largest share | varies by ratios |
| `'random'` | extra cents distributed pseudo-randomly | varies |

### why multiple strategies?

different business contexts demand different fairness guarantees:

- **`'first'`**: simple, deterministic. good for invoices where order is arbitrary.
- **`'last'`**: useful when the last recipient is a catch-all (e.g., "other expenses").
- **`'largest'`**: proportionally fair — larger shares absorb more remainder. matches the [largest remainder method](https://en.wikipedia.org/wiki/Largest_remainder_method) used in political seat allocation.
- **`'random'`**: statistically fair over many allocations — no recipient is systematically favored.

---

## allocation modes

### equal parts

split into N equal portions:

```ts
allocatePrice({ of: 'USD 100.00', into: { parts: 3 }, remainder: 'first' })
// => ['USD 33.34', 'USD 33.33', 'USD 33.33']

allocatePrice({ of: 'USD 100.00', into: { parts: 4 }, remainder: 'first' })
// => ['USD 25.00', 'USD 25.00', 'USD 25.00', 'USD 25.00']
```

### by ratios

split proportionally by ratios:

```ts
// 70/30 split
allocatePrice({ of: 'USD 5.00', into: { ratios: [7, 3] }, remainder: 'first' })
// => ['USD 3.50', 'USD 1.50']

// 50/30/20 split
allocatePrice({ of: 'USD 10.00', into: { ratios: [5, 3, 2] }, remainder: 'largest' })
// => ['USD 5.00', 'USD 3.00', 'USD 2.00']

// uneven split with remainder
allocatePrice({ of: 'USD 5.00', into: { ratios: [1, 1, 2] }, remainder: 'first' })
// => ['USD 1.26', 'USD 1.25', 'USD 2.49']
// (5.00 / 4 parts: 1.25 + 1.25 + 2.50 = 5.00, but round creates remainder)
```

---

## real-world use cases

### 1. bill split (restaurant, roommates)

split a dinner bill among friends:

```ts
const bill = 'USD 127.43';
const diners = 4;

allocatePrice({ of: bill, into: { parts: diners }, remainder: 'first' })
// => ['USD 31.86', 'USD 31.86', 'USD 31.86', 'USD 31.85']
// first person pays the extra penny
```

**why it matters**: restaurant POS systems must ensure the sum of individual payments equals the bill total. a 1-cent discrepancy causes reconciliation errors.

source: [Bill Split](https://billsplit.io/), [LetsPayTheBill](https://www.letspaythebill.com/expenses-splitting-example.html)

### 2. tip pool (service industry)

distribute tips among staff by hours worked:

```ts
const totalTips = 'USD 450.00';
const hoursWorked = [8, 6, 4]; // server A: 8h, B: 6h, C: 4h

allocatePrice({ of: totalTips, into: { ratios: hoursWorked }, remainder: 'largest' })
// => ['USD 200.00', 'USD 150.00', 'USD 100.00']
```

**why it matters**: federal law requires fair tip distribution. an unfair algorithm can violate labor regulations.

source: [Kickfin Tip Distribution](https://kickfin.com/blog/tip-pooling-tip-sharing-tipping-out-how-and-why-restaurants-split-tips/), [Connecteam](https://connecteam.com/e-tip-pooling-sharing/)

### 3. invoice proration (subscriptions)

prorate a subscription charge across periods:

```ts
const monthlyCharge = 'USD 99.00';
const daysUsed = 15;
const daysInMonth = 30;

// first, calculate prorated amount
const proratedAmount = multiplyPrice({ of: monthlyCharge, by: daysUsed / daysInMonth });
// => 'USD 49.50'

// or allocate across two periods
allocatePrice({ of: monthlyCharge, into: { ratios: [daysUsed, daysInMonth - daysUsed] }, remainder: 'first' })
// => ['USD 49.50', 'USD 49.50']
```

**why it matters**: SaaS systems must handle mid-cycle upgrades, downgrades, and cancellations. proration errors compound across thousands of customers.

source: [Maxio Credit Notes & Proration](https://docs.maxio.com/hc/en-us/articles/24252261284749-Credit-Notes-Proration)

### 4. tax allocation across line items

distribute a total tax amount across invoice line items:

```ts
const totalTax = 'USD 8.25';
const lineItemSubtotals = [5000, 3000, 2000]; // cents: $50, $30, $20

allocatePrice({ of: totalTax, into: { ratios: lineItemSubtotals }, remainder: 'largest' })
// => ['USD 4.13', 'USD 2.47', 'USD 1.65']
// sum: $8.25 ✓
```

**why it matters**: tax authorities audit line-item allocations. the sum of allocated taxes must equal the total tax charged.

source: [Microsoft Dynamics 365 Account Distributions](https://learn.microsoft.com/en-us/dynamics365/finance/accounts-payable/accounting-distributions)

### 5. investment portfolio rebalance

allocate a deposit across portfolio positions:

```ts
const deposit = 'USD 1000.00';
const targetAllocation = [60, 30, 10]; // 60% stocks, 30% bonds, 10% cash

allocatePrice({ of: deposit, into: { ratios: targetAllocation }, remainder: 'largest' })
// => ['USD 600.00', 'USD 300.00', 'USD 100.00']
```

**why it matters**: fractional shares may not be available. the allocator ensures the full deposit is invested without leftover cash.

source: [Betterment Penny-Precise Allocation](https://www.betterment.com/engineering/penny-precise-allocation-functions)

### 6. payroll distribution (direct deposit)

split a paycheck across multiple bank accounts:

```ts
const netPay = 'USD 3547.82';
const distribution = { savings: 500, investment: 200, remainder: 'primary' };

// fixed amounts first, remainder to primary account
allocatePrice({
  of: subPrices(netPay, 'USD 500.00', 'USD 200.00'),
  into: { parts: 1 },
  remainder: 'first',
})
// => ['USD 2847.82'] (to primary account)
```

**why it matters**: payroll systems must ensure the sum of deposits equals net pay. discrepancies trigger compliance audits.

source: [Sage Direct Deposit Allocations](https://help-sage50.na.sage.com/en-us/2019/Content/Transactions/Direct_Deposit/Direct_Deposit_Allocations.htm)

---

## the largest remainder method

the `'largest'` remainder strategy implements the [largest remainder method](https://en.wikipedia.org/wiki/Largest_remainder_method), also known as the Hamilton method.

**historical note**: this algorithm was proposed by Alexander Hamilton to solve congressional seat apportionment — how to fairly distribute 435 House seats among 50 states based on population. a seat, like a penny, cannot be divided.

the algorithm:
1. calculate each recipient's exact share (may have fractional part)
2. give each recipient the floor of their share
3. distribute leftover units to recipients with the largest fractional remainders

```ts
// $100 split 33/33/34
allocatePrice({ of: 'USD 100.00', into: { ratios: [33, 33, 34] }, remainder: 'largest' })
// exact: $33.00, $33.00, $34.00 — no remainder needed

// $100 split 1/1/1 (equal thirds)
allocatePrice({ of: 'USD 100.00', into: { ratios: [1, 1, 1] }, remainder: 'largest' })
// exact: $33.333..., $33.333..., $33.333...
// floor: $33.33, $33.33, $33.33 = $99.99
// remainder: $0.01 goes to first recipient (all have equal fractional part)
// result: ['USD 33.34', 'USD 33.33', 'USD 33.33']
```

---

## comparison: division vs allocation

| operation | use case | handles remainder? |
|-----------|----------|-------------------|
| `dividePrice` | calculate unit price from total | no — truncates |
| `allocatePrice` | distribute total across recipients | yes — no loss |

```ts
// division: loses remainder
dividePrice({ of: 'USD 10.00', by: 3 })
// => 'USD 3.33' (loses $0.01)

// allocation: preserves total
allocatePrice({ of: 'USD 10.00', into: { parts: 3 }, remainder: 'first' })
// => ['USD 3.34', 'USD 3.33', 'USD 3.33'] (sum = $10.00)
```

**rule of thumb**:
- use `dividePrice` when you need a **single result** (e.g., "what is the price per unit?")
- use `allocatePrice` when you need to **distribute a total** (e.g., "how much does each person pay?")

---

## fowler's insight

Martin Fowler articulated this distinction in his [Money pattern](https://martinfowler.com/eaaCatalog/money.html):

> "the fundamental issue is between to use multiplication to determine proportional charge (such as a tax charge) and to use multiplication to allocate a sum of money across multiple places. multiplication works well for the former, but an allocator works better for the latter."

the key insight: **multiplication creates money** (e.g., $100 × 1.08 tax = $108), but **allocation distributes money** (e.g., $108 ÷ 3 people). these are fundamentally different operations.

---

## sources

- [Martin Fowler's Money Pattern](https://martinfowler.com/eaaCatalog/money.html)
- [Dinero.js allocate](https://v2.dinerojs.com/docs/api/mutations/allocate)
- [Betterment: Penny-Precise Allocation](https://www.betterment.com/engineering/penny-precise-allocation-functions)
- [Largest Remainder Method - Wikipedia](https://en.wikipedia.org/wiki/Largest_remainder_method)
- [Kickfin: Tip Distribution Guide](https://kickfin.com/blog/tip-pooling-tip-sharing-tipping-out-how-and-why-restaurants-split-tips/)
- [Microsoft Dynamics 365: Account Distributions](https://learn.microsoft.com/en-us/dynamics365/finance/accounts-payable/accounting-distributions)
