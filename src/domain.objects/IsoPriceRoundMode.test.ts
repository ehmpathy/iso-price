import { IsoPriceRoundMode } from './IsoPriceRoundMode';

describe('IsoPriceRoundMode', () => {
  const EXPECTED_VALUES = [
    {
      description: 'floor mode',
      given: { key: 'FLOOR' },
      expect: { value: 'floor' },
    },
    {
      description: 'ceil mode',
      given: { key: 'CEIL' },
      expect: { value: 'ceil' },
    },
    {
      description: 'half-up mode',
      given: { key: 'HALF_UP' },
      expect: { value: 'half-up' },
    },
    {
      description: 'half-down mode',
      given: { key: 'HALF_DOWN' },
      expect: { value: 'half-down' },
    },
    {
      description: 'half-even mode',
      given: { key: 'HALF_EVEN' },
      expect: { value: 'half-even' },
    },
  ];

  EXPECTED_VALUES.forEach(({ description, given, expect: expected }) => {
    test(description, () => {
      expect(
        IsoPriceRoundMode[given.key as keyof typeof IsoPriceRoundMode],
      ).toEqual(expected.value);
    });
  });

  test('enum has exactly 5 values', () => {
    const values = Object.values(IsoPriceRoundMode);
    expect(values).toHaveLength(5);
  });

  test('enum is iterable via Object.values()', () => {
    const values = Object.values(IsoPriceRoundMode);
    expect(values).toContain('floor');
    expect(values).toContain('ceil');
    expect(values).toContain('half-up');
    expect(values).toContain('half-down');
    expect(values).toContain('half-even');
  });

  test('enum values are lowercase kebab-case', () => {
    const values = Object.values(IsoPriceRoundMode);

    for (const value of values) {
      expect(value).toMatch(/^[a-z]+(-[a-z]+)?$/);
    }
  });
});
