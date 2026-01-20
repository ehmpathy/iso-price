# micro and nano price patterns

how big players handle sub-cent costs internally.

## summary table

| provider | internal precision | storage format | round point | min charge |
|----------|-------------------|----------------|-------------|------------|
| **aws** | 6-8 decimals | decimal | invoice line item | $0.01 (rounded up) |
| **google cloud** | 6 decimals | unrounded subtotal | invoice | varies |
| **stripe** | 12 decimals | `unit_amount_decimal` string | line item | $0.50 |
| **openai** | full token precision | accumulate tokens | bill period | $5 prepaid min |
| **anthropic** | decimal cents string | `"0.0015"` | bill period | prepaid credits |

---

## aws

### precision

- **internal**: 6 decimal places for allocated costs
- **aws marketplace**: 8 decimal places (as of jan 2025)
- **cost explorer csv**: up to 15 decimal places

source: [AWS Marketplace 8 Decimal Precision](https://aws.amazon.com/about-aws/whats-new/2025/01/aws-marketplace-8-decimal-place-precision-usage-pricing/)

### round rules

> "amounts between the smallest fractional unit and $0.01 are rounded up to $0.01"
> "for amounts greater than $0.01, AWS uses round half up"

examples:
- $0.001 → $0.01 (round up to minimum)
- $0.102 → $0.10 (round down, < half)
- $0.105 → $0.11 (round up, = half)
- $0.107 → $0.11 (round up, > half)

source: [AWS Bill FAQs](https://aws.amazon.com/aws-cost-management/aws-billing/faqs/)

### lambda example

```
$0.0000166667 per GB-second
$0.0000002 per request
```

internal: track at full precision
invoice: round to $0.01 per line item

---

## google cloud

### precision

- **unrounded subtotal**: up to 6 decimal places
- **invoice**: rounded, includes "round errors" line

source: [Google Cloud Bill Reports](https://docs.cloud.google.com/billing/docs/how-to/reports)

### cloud run example

```
$0.000024 per vCPU-second
$0.0000025 per GiB-second
$0.40 per million requests
```

> "a few seconds of compute here or there only amount to fractions of a cent"

source: [Cloud Run Price](https://cloud.google.com/run/pricing)

### vertex ai / gemini

```
gemini 2.0 flash: $0.00000015 per input token
gemini 2.5 pro: $0.00000125 per input token
```

billed per token, failed requests (400/500) not charged.

source: [Vertex AI Price](https://cloud.google.com/vertex-ai/generative-ai/pricing)

---

## stripe

### precision

- **unit_amount**: integer cents only
- **unit_amount_decimal**: up to 12 decimal places (string)

source: [Stripe Price Object](https://docs.stripe.com/api/prices/object)

### format

```ts
// integer cents
{ unit_amount: 1000, currency: 'usd' }  // $10.00

// decimal cents (sub-cent)
{ unit_amount_decimal: '0.05', currency: 'usd' }  // $0.0005
{ unit_amount_decimal: '105.5', currency: 'usd' } // $1.055
```

when decimal is used, `unit_amount` returns `null`.

source: [Stripe Decimal Price](https://docs.stripe.com/billing/subscriptions/usage-based-legacy/pricing-models)

### round behavior

> "usage quantity multiplied by decimal rate and rounded to the nearest whole cent"

metered usage accumulates, then rounds at invoice.

### limitations

- checkout: max 2 decimal places
- one-time charges: integer cents only
- subscriptions/invoices: full decimal support

---

## openai

### precision

> "OpenAI accumulates tokens until reach 1,000 in either direction, then applies the applicable rate"

internal precision unknown, but confirmed:
> "I was able to confirm that with my yesterday Usage Breakdown" — no intermediate round occurs

source: [OpenAI Precision Discussion](https://community.openai.com/t/pricing-precision-for-sub-cent-amounts/370856)

### example rates

```
gpt-4o: $0.000005 per input token ($5/1M)
gpt-4o-mini: $0.00000015 per input token ($0.15/1M)
gpt-5-nano: $0.00000005 per input token ($0.05/1M)
```

### track model

- usage api: 1m, 1h, 1d granularity
- costs api: reconciles to invoice
- dashboard: per-api-key track (after dec 2023)

source: [OpenAI Usage API](https://platform.openai.com/docs/api-reference/usage)

---

## anthropic

### precision

> "all costs in USD, reported as decimal strings in lowest units (cents)"

example: `"0.0015"` = 0.0015 cents = $0.000015

source: [Anthropic Usage and Cost API](https://platform.claude.com/docs/en/build-with-claude/usage-cost-api)

### example rates

```
claude-opus-4.5: $0.000005 per input token ($5/1M)
claude-sonnet-4.5: $0.000003 per input token ($3/1M)
claude-haiku-4.5: $0.000001 per input token ($1/1M)
claude-haiku-3: $0.00000025 per input token ($0.25/1M)
```

### track model

- cost api: daily granularity
- group by: workspace, description
- failed requests: not charged

---

## common patterns

### pattern 1: accumulate then round

all providers accumulate full-precision costs internally, round only at invoice/display.

```
per-request cost × request count = accumulated total (full precision)
accumulated total → round → invoice line item
```

### pattern 2: integer + exponent

avoid float by store as integer with implicit/explicit decimal position.

```ts
// stripe
{ unit_amount_decimal: '0.05' }  // string, 12 decimal max

// aws/gcp internal
6-8 decimal places stored

// proposed iso-price
{ amount: 5, exponent: 6 }  // integer + exponent
```

### pattern 3: minimum charge threshold

| provider | minimum |
|----------|---------|
| stripe | $0.50 per charge |
| aws | $0.01 per line item (rounded up) |
| openai | $5 prepaid |
| anthropic | prepaid credits |

### pattern 4: separate precision by use

| use | precision |
|-----|-----------|
| one-time charge | integer cents |
| subscription/metered | sub-cent decimal |
| internal track | full precision |
| invoice display | 2 decimals |

---

## implications for iso-price

1. **support up to 12 decimal places** (stripe max)
2. **use integer + exponent** (avoid float)
3. **exponent range**: 0-12 covers all usecases
4. **accumulation**: normalize to highest precision, sum integers
5. **display**: round per user preference at output time
6. **no implicit round**: preserve precision until explicit cast

---

## sources

- [AWS Marketplace 8 Decimal Precision (Jan 2025)](https://aws.amazon.com/about-aws/whats-new/2025/01/aws-marketplace-8-decimal-place-precision-usage-pricing/)
- [AWS Bill FAQs](https://aws.amazon.com/aws-cost-management/aws-billing/faqs/)
- [Google Cloud Bill Reports](https://docs.cloud.google.com/billing/docs/how-to/reports)
- [Cloud Run Price](https://cloud.google.com/run/pricing)
- [Vertex AI Price](https://cloud.google.com/vertex-ai/generative-ai/pricing)
- [Stripe Price Object](https://docs.stripe.com/api/prices/object)
- [Stripe Decimal Price](https://docs.stripe.com/billing/subscriptions/usage-based-legacy/pricing-models)
- [OpenAI Precision Discussion](https://community.openai.com/t/pricing-precision-for-sub-cent-amounts/370856)
- [OpenAI Usage API](https://platform.openai.com/docs/api-reference/usage)
- [Anthropic Usage and Cost API](https://platform.claude.com/docs/en/build-with-claude/usage-cost-api)
