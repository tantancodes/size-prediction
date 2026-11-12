import { describe, expect, it } from 'vitest';
import { SAMPLE_GARMENTS } from '../data/sampleGarments';
import { DEFAULT_MEASUREMENTS } from '../models/measurements';
import { analyzeFit, recommendSize } from './fitAnalysis';

describe('measurement-based fit analysis', () => {
  it('calculates chest ease as garment minus body circumference', () => {
    const tee = SAMPLE_GARMENTS.find((garment) => garment.id === 'everyday-tee')!;
    const chest = analyzeFit(DEFAULT_MEASUREMENTS, tee, 'M').regions.find((region) => region.region === 'chest')!;
    expect(chest.difference).toBe(8);
    expect(chest.fit).toBe('regular');
  });

  it('responds to body measurement changes', () => {
    const tee = SAMPLE_GARMENTS[0];
    const baseline = analyzeFit(DEFAULT_MEASUREMENTS, tee, 'M').regions.find((region) => region.region === 'chest')!;
    const largerChest = analyzeFit({ ...DEFAULT_MEASUREMENTS, chest: 112 }, tee, 'M').regions.find((region) => region.region === 'chest')!;
    expect(baseline.fit).toBe('regular');
    expect(largerChest.difference).toBe(-8);
    expect(largerChest.fit).toBe('tight');
  });

  it('ranks the nearest candidate size and returns a report for every size', () => {
    const tee = SAMPLE_GARMENTS[0];
    const result = recommendSize(DEFAULT_MEASUREMENTS, tee);
    expect(result.reports).toHaveLength(5);
    expect(result.size).toBe('S');
  });

  it('uses inseam and hip measurements for pants', () => {
    const pants = SAMPLE_GARMENTS.find((garment) => garment.category === 'Pants')!;
    const report = analyzeFit(DEFAULT_MEASUREMENTS, pants, 'M');
    expect(report.regions.map((region) => region.region)).toContain('inseam');
    expect(report.regions.find((region) => region.region === 'inseam')?.difference).toBe(-1);
  });
});
