# si metric prefixes

## .what

the international system of units (si) defines a set of metric prefixes that denote powers of ten. these prefixes provide a standard, universally understood way to express very large or very small quantities.

## .source

[NIST SI Metric Prefixes](https://www.nist.gov/pml/owm/metric-si-prefixes)

## .prefixes

### large scale (positive exponents)

| prefix | symbol | factor | example |
|--------|--------|--------|---------|
| yotta | Y | 10²⁴ | yottabyte |
| zetta | Z | 10²¹ | zettabyte |
| exa | E | 10¹⁸ | exabyte |
| peta | P | 10¹⁵ | petabyte |
| tera | T | 10¹² | terabyte |
| giga | G | 10⁹ | gigabyte |
| mega | M | 10⁶ | megabyte |
| kilo | k | 10³ | kilogram |
| hecto | h | 10² | hectare |
| deca | da | 10¹ | decameter |

### small scale (negative exponents)

| prefix | symbol | factor | example |
|--------|--------|--------|---------|
| deci | d | 10⁻¹ | deciliter |
| centi | c | 10⁻² | centimeter |
| milli | m | 10⁻³ | millisecond |
| micro | μ | 10⁻⁶ | microsecond |
| nano | n | 10⁻⁹ | nanosecond |
| pico | p | 10⁻¹² | picosecond |
| femto | f | 10⁻¹⁵ | femtosecond |
| atto | a | 10⁻¹⁸ | attosecond |
| zepto | z | 10⁻²¹ | zeptosecond |
| yocto | y | 10⁻²⁴ | yoctosecond |

## .usage in iso-price

iso-price uses si metric prefixes to name exponent levels for sub-unit precision:

| si prefix | factor | iso-price exponent | usecase |
|-----------|--------|-------------------|---------|
| (none) | 10⁰ | `'whole.x10^0'` | JPY, KRW (no decimals) |
| centi | 10⁻² | `'centi.x10^-2'` | standard cents (USD, EUR) |
| milli | 10⁻³ | `'milli.x10^-3'` | fils (BHD, KWD, OMR) |
| micro | 10⁻⁶ | `'micro.x10^-6'` | llm token costs |
| nano | 10⁻⁹ | `'nano.x10^-9'` | serverless costs |
| pico | 10⁻¹² | `'pico.x10^-12'` | extreme precision |

## .why si prefixes

benefits of si prefix names over numeric exponents:

1. **self-evident scale** — "micro" immediately conveys "millionths" to anyone with basic scientific literacy
2. **universal standard** — same prefixes used across all scientific and technical disciplines
3. **human readable** — `'micro.x10^-6'` is clearer than `'exp6'` or `'e-6'`
4. **no memorization** — developers already know these prefixes from bytes (KB, MB, GB) and time (ms, μs, ns)

## .note on binary vs decimal

in computers, prefixes like "kilo" and "mega" are sometimes used for binary powers (2¹⁰ = 1024 instead of 10³ = 1000). iso-price always uses the decimal (si) definition:

- kilo = 10³ = 1,000 (not 1,024)
- mega = 10⁶ = 1,000,000 (not 1,048,576)

for binary powers, iec prefixes exist (kibi, mebi, gibi), but iso-price does not use them.
