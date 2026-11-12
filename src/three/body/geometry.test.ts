import { describe, expect, it } from 'vitest';
import { DEFAULT_MEASUREMENTS } from '../../models/measurements';
import { SAMPLE_GARMENTS } from '../../data/sampleGarments';
import { bodyTorsoProfile, createLoftGeometry, garmentTorsoProfile } from './geometry';

describe('procedural profile response', () => {
  it('widens the chest ring when the chest measurement increases', () => {
    const baseline = bodyTorsoProfile(DEFAULT_MEASUREMENTS);
    const updated = bodyTorsoProfile({ ...DEFAULT_MEASUREMENTS, chest: 112 });
    expect(updated.find((point) => point.y === DEFAULT_MEASUREMENTS.height / 100 * 0.75)!.width)
      .toBeGreaterThan(baseline.find((point) => point.y === DEFAULT_MEASUREMENTS.height / 100 * 0.75)!.width);
  });

  it('scales vertical landmarks when height changes', () => {
    const baseline = bodyTorsoProfile(DEFAULT_MEASUREMENTS);
    const taller = bodyTorsoProfile({ ...DEFAULT_MEASUREMENTS, height: 184 });
    expect(taller[0].y).toBeGreaterThan(baseline[0].y);
    expect(taller[0].width).toBeCloseTo(baseline[0].width);
  });

  it('nudges the hip line and leg proportions when inseam changes', () => {
    const baseline = bodyTorsoProfile(DEFAULT_MEASUREMENTS);
    const longerInseam = bodyTorsoProfile({ ...DEFAULT_MEASUREMENTS, inseam: 90 });
    expect(longerInseam[1].y).toBeGreaterThan(baseline[1].y);
  });

  it('changes the top garment profile across size chart entries', () => {
    const tee = SAMPLE_GARMENTS[0];
    const small = garmentTorsoProfile(DEFAULT_MEASUREMENTS, tee.sizes.S);
    const large = garmentTorsoProfile(DEFAULT_MEASUREMENTS, tee.sizes.L);
    const y = DEFAULT_MEASUREMENTS.height / 100 * 0.75;
    expect(large.find((point) => point.y === y)!.width).toBeGreaterThan(small.find((point) => point.y === y)!.width);
  });

  it('builds finite indexed triangle geometry for a loft', () => {
    const geometry = createLoftGeometry(bodyTorsoProfile(DEFAULT_MEASUREMENTS), 24, 30);
    const positions = geometry.getAttribute('position');
    expect(positions.count).toBeGreaterThan(700);
    expect(Number.isFinite(positions.getY(positions.count - 1))).toBe(true);
    expect(geometry.index?.count).toBeGreaterThan(1000);
    geometry.dispose();
  });
});
