import { IsoPriceExponent } from './IsoPriceExponent';

describe('IsoPriceExponent', () => {
  const EXPECTED_VALUES = [
    {
      description: 'whole units',
      given: { key: 'WHOLE' },
      expect: { value: 'whole.x10^0' },
    },
    {
      description: 'centi (cents)',
      given: { key: 'CENTI' },
      expect: { value: 'centi.x10^-2' },
    },
    {
      description: 'milli (fils)',
      given: { key: 'MILLI' },
      expect: { value: 'milli.x10^-3' },
    },
    {
      description: 'micro',
      given: { key: 'MICRO' },
      expect: { value: 'micro.x10^-6' },
    },
    {
      description: 'nano',
      given: { key: 'NANO' },
      expect: { value: 'nano.x10^-9' },
    },
    {
      description: 'pico',
      given: { key: 'PICO' },
      expect: { value: 'pico.x10^-12' },
    },
  ];

  EXPECTED_VALUES.forEach(({ description, given, expect: expected }) => {
    test(description, () => {
      expect(
        IsoPriceExponent[given.key as keyof typeof IsoPriceExponent],
      ).toEqual(expected.value);
    });
  });

  test('enum has exactly 6 values', () => {
    const values = Object.values(IsoPriceExponent);
    expect(values).toHaveLength(6);
  });

  test('enum is iterable via Object.values()', () => {
    const values = Object.values(IsoPriceExponent);
    expect(values).toContain('whole.x10^0');
    expect(values).toContain('centi.x10^-2');
    expect(values).toContain('milli.x10^-3');
    expect(values).toContain('micro.x10^-6');
    expect(values).toContain('nano.x10^-9');
    expect(values).toContain('pico.x10^-12');
  });

  test('enum values follow si metric prefix pattern', () => {
    const values = Object.values(IsoPriceExponent);

    for (const value of values) {
      expect(value).toMatch(/^[a-z]+\.x10\^-?\d+$/);
    }
  });
});
