# price localization

## .what

price formats vary by locale — the same value can be written many ways:

| locale | one million and 50 cents |
|--------|--------------------------|
| US/UK (en-US) | `1,000,000.50` |
| Germany (de-DE) | `1.000.000,50` |
| France (fr-FR) | `1 000 000,50` |
| Switzerland (de-CH) | `1'000'000.50` |
| India (en-IN) | `10,00,000.50` |

the **decimal separator** and **thousands separator** both vary[¹](#sources):

| locale | decimal | thousands |
|--------|---------|-----------|
| en-US | `.` | `,` |
| de-DE | `,` | `.` |
| fr-FR | `,` | ` ` (space) |
| de-CH | `.` | `'` (apostrophe) |

**regional notes:**

- **US/UK**: period (`.`) for decimal is standard in English-speak countries[²](#sources)
- **Germany/France**: comma (`,`) for decimal is standard across most of continental Europe[²](#sources)
- **Switzerland**: uses apostrophe (`'`) as thousands separator with period decimal — unique in Europe[³](#sources)
- **India**: uses 3:2:2 digit group pattern (lakh/crore system) — `10,00,000` not `1,000,000`[⁴](#sources)

## .why IsoPriceWords uses numeric separator notation

`IsoPriceWords` uses **underscore** (`_`) as the thousands separator and **decimal point** (`.`) for decimals:

```ts
'USD 1_000_000.50'  // valid IsoPriceWords — numeric separator notation
'USD 1,000,000.50'  // invalid — locale-specific commas
'USD 1.000.000,50'  // invalid — locale-specific format
```

this follows the **ECMAScript numeric separators standard** (ES2021)[⁷](#sources):

> "this feature enables developers to make their numeric literals more readable by [addition of] a visual separation between groups of digits"[⁷](#sources)
>
> "large numeric literals are difficult for the human eye to parse quickly, especially when there are long digit repetitions"[⁷](#sources)

the underscore separator is also standard in TypeScript[⁸](#sources), Java, Python, Rust, Ruby, and C#[⁹](#sources).

**why this works for prices:**
1. **readable** — underscores group digits for human scanability (like `1_000_000` in code)
2. **unambiguous** — underscore is never a decimal separator in any locale
3. **parseable** — no locale detection required
4. **portable** — works across systems, languages, databases
5. **familiar** — developers already use this in numeric literals

## .why IsoPriceHuman handles localization

`IsoPriceHuman` is the display format — it should adapt to the user's locale:

```ts
// output adapts to locale
asIsoPriceHuman('USD 1000000.50', { locale: 'en-US' })  // => '$1,000,000.50'
asIsoPriceHuman('EUR 1000000.50', { locale: 'de-DE' })  // => '1.000.000,50 €'
asIsoPriceHuman('EUR 1000000.50', { locale: 'fr-FR' })  // => '1 000 000,50 €'
```

localization concerns:
- thousands separator (`,` vs `.` vs ` ` vs `'`)
- decimal separator (`.` vs `,`)
- symbol position (prefix `$100` vs suffix `100 €`)
- digit group pattern (3-digit vs lakh system in India)

## .input convenience

`asIsoPrice` accepts locale-formatted input as a convenience:

```ts
asIsoPrice('$1,000,000.50')   // => 'USD 1_000_000.50' (normalized from en-US)
asIsoPrice('1.000.000,50 €')  // => 'EUR 1_000_000.50' (normalized from de-DE)
```

the locale separators are normalized to numeric separator notation (`_` thousands, `.` decimal).

## .rule

> **IsoPriceWords** = numeric separator notation (`_` thousands, `.` decimal) — no locale ambiguity
>
> **IsoPriceHuman** = locale-aware display — adapts to user's region

## .sources

1. [Decimal separator - Wikipedia](https://en.wikipedia.org/wiki/Decimal_separator)
2. [Decimal Separators By Country - Smartick](https://www.smartick.com/blog/other-contents/curiosities/decimal-separators/)
3. [Switzerland Number Format - SpinifexIT](https://helpcenter.spinifexit.com/hc/en-us/articles/18889737257881-Switzerland-Number-Format)
4. [Indian number system - Wikipedia](https://en.wikipedia.org/wiki/Indian_numbering_system)
5. [Number formats - Microsoft Globalization](https://learn.microsoft.com/en-us/globalization/locale/number-formatting)
6. [Intl.NumberFormat - MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat)
7. [TC39 Numeric Separator Proposal - GitHub](https://github.com/tc39/proposal-numeric-separator) — ECMAScript standard for `_` digit grouping
8. [Numeric Separators in TypeScript - Marius Schulz](https://mariusschulz.com/blog/numeric-separators-in-typescript)
9. [Digit Separator Syntax Reference](https://syntaxreference.dev/programming-languages/digit-separator/) — cross-language comparison
