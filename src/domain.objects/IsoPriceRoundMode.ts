/**
 * .what = enum of supported round modes for iso-price precision operations
 * .why = explicit round mode selection prevents silent precision loss
 *
 * round modes follow IEEE 754-2008 names for mathematical precision:
 * - `floor` = toward negative infinity
 * - `ceil` = toward positive infinity
 * - `half-up` = ties go away from zero (most common expectation)
 * - `half-down` = ties go toward zero
 * - `half-even` = ties go to nearest even (banker's round)
 */
export enum IsoPriceRoundMode {
  /** round toward negative infinity — 5.5 → 5, -5.5 → -6 */
  FLOOR = 'floor',
  /** round toward positive infinity — 5.5 → 6, -5.5 → -5 */
  CEIL = 'ceil',
  /** ties go away from zero — 5.5 → 6, -5.5 → -6 (most common) */
  HALF_UP = 'half-up',
  /** ties go toward zero — 5.5 → 5, -5.5 → -5 */
  HALF_DOWN = 'half-down',
  /** ties go to nearest even — 5.5 → 6, 4.5 → 4 (banker's round) */
  HALF_EVEN = 'half-even',
}
