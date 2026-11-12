import { describe, expect, it } from 'vitest';
import { fromMetric, toMetric, validateMeasurement } from './measurements';

describe('measurement units and validation', () => {
  it('round-trips a body circumference through inches', () => {
    expect(toMetric(fromMetric(96, 'length', 'imperial'), 'length', 'imperial')).toBeCloseTo(96);
  });

  it('round-trips optional weight through pounds', () => {
    expect(toMetric(fromMetric(66, 'weight', 'imperial'), 'weight', 'imperial')).toBeCloseTo(66);
  });

  it('rejects out-of-range dimensions and non-numeric values', () => {
    expect(validateMeasurement('height', 240)).toContain('130 and 210 cm');
    expect(validateMeasurement('weight', Number.NaN)).toContain('must be a number');
  });
});
