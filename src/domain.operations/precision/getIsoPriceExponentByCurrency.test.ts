import { IsoPriceExponent } from '../../domain.objects/IsoPriceExponent';
import { getIsoPriceExponentByCurrency } from './getIsoPriceExponentByCurrency';

describe('getIsoPriceExponentByCurrency', () => {
  const CASES = [
    // centi exponent currencies (2 decimals)
    {
      description: 'USD returns centi',
      given: { input: 'USD' },
      expect: { output: IsoPriceExponent.CENTI },
    },
    {
      description: 'EUR returns centi',
      given: { input: 'EUR' },
      expect: { output: IsoPriceExponent.CENTI },
    },
    {
      description: 'GBP returns centi',
      given: { input: 'GBP' },
      expect: { output: IsoPriceExponent.CENTI },
    },
    {
      description: 'AUD returns centi',
      given: { input: 'AUD' },
      expect: { output: IsoPriceExponent.CENTI },
    },
    {
      description: 'CAD returns centi',
      given: { input: 'CAD' },
      expect: { output: IsoPriceExponent.CENTI },
    },
    {
      description: 'CHF returns centi',
      given: { input: 'CHF' },
      expect: { output: IsoPriceExponent.CENTI },
    },
    {
      description: 'CNY returns centi',
      given: { input: 'CNY' },
      expect: { output: IsoPriceExponent.CENTI },
    },
    // whole exponent currencies (0 decimals)
    {
      description: 'JPY returns whole',
      given: { input: 'JPY' },
      expect: { output: IsoPriceExponent.WHOLE },
    },
    {
      description: 'KRW returns whole',
      given: { input: 'KRW' },
      expect: { output: IsoPriceExponent.WHOLE },
    },
    {
      description: 'VND returns whole',
      given: { input: 'VND' },
      expect: { output: IsoPriceExponent.WHOLE },
    },
    {
      description: 'IDR returns whole',
      given: { input: 'IDR' },
      expect: { output: IsoPriceExponent.WHOLE },
    },
    {
      description: 'CLP returns whole',
      given: { input: 'CLP' },
      expect: { output: IsoPriceExponent.WHOLE },
    },
    {
      description: 'PYG returns whole',
      given: { input: 'PYG' },
      expect: { output: IsoPriceExponent.WHOLE },
    },
    {
      description: 'UGX returns whole',
      given: { input: 'UGX' },
      expect: { output: IsoPriceExponent.WHOLE },
    },
    // milli exponent currencies (3 decimals)
    {
      description: 'BHD returns milli',
      given: { input: 'BHD' },
      expect: { output: IsoPriceExponent.MILLI },
    },
    {
      description: 'KWD returns milli',
      given: { input: 'KWD' },
      expect: { output: IsoPriceExponent.MILLI },
    },
    {
      description: 'OMR returns milli',
      given: { input: 'OMR' },
      expect: { output: IsoPriceExponent.MILLI },
    },
    {
      description: 'TND returns milli',
      given: { input: 'TND' },
      expect: { output: IsoPriceExponent.MILLI },
    },
    // unknown currencies default to centi
    {
      description: 'BTC defaults to centi',
      given: { input: 'BTC' },
      expect: { output: IsoPriceExponent.CENTI },
    },
    {
      description: 'ETH defaults to centi',
      given: { input: 'ETH' },
      expect: { output: IsoPriceExponent.CENTI },
    },
    {
      description: 'XYZ defaults to centi',
      given: { input: 'XYZ' },
      expect: { output: IsoPriceExponent.CENTI },
    },
    {
      description: 'DOGE defaults to centi',
      given: { input: 'DOGE' },
      expect: { output: IsoPriceExponent.CENTI },
    },
  ];

  CASES.forEach(({ description, given, expect: expected }) => {
    test(description, () => {
      expect(getIsoPriceExponentByCurrency(given.input)).toEqual(
        expected.output,
      );
    });
  });
});
