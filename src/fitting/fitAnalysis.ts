import type { BodyMeasurements } from '../models/measurements';
import type { Garment, GarmentRegion, GarmentSize, SizeLabel } from '../models/garment';
import { SIZES } from '../models/garment';

export type FitLevel = 'very-tight' | 'tight' | 'regular' | 'relaxed' | 'oversized' | 'short' | 'long' | 'appropriate';
export type RegionFit = { region: GarmentRegion; label: string; garmentValue: number; bodyValue: number; difference: number; unit: 'cm'; fit: FitLevel; message: string };
export type FitReport = { regions: RegionFit[]; summary: FitLevel; size: SizeLabel; score: number };

type Thresholds = { veryTight: number; tight: number; regular: number; relaxed: number };
export const CATEGORY_EASE_THRESHOLDS: Record<Garment['category'], Thresholds> = {
  // Intended ease ranges (garment circumference minus body circumference), in cm.
  // They are starting design assumptions, separately configurable for each category.
  'T-shirt': { veryTight: -8, tight: 0, regular: 10, relaxed: 20 },
  Hoodie: { veryTight: -5, tight: 4, regular: 16, relaxed: 28 },
  Sweatshirt: { veryTight: -6, tight: 2, regular: 14, relaxed: 25 },
  Pants: { veryTight: -5, tight: 1, regular: 8, relaxed: 16 },
};

function classifyEase(ease: number, thresholds: Thresholds): FitLevel {
  if (ease < thresholds.veryTight) return 'very-tight';
  if (ease < thresholds.tight) return 'tight';
  if (ease < thresholds.regular) return 'regular';
  if (ease < thresholds.relaxed) return 'relaxed';
  return 'oversized';
}

function classifyDifference(difference: number, tolerance: number, shorter: FitLevel = 'short', longer: FitLevel = 'long'): FitLevel {
  if (difference < -tolerance) return shorter;
  if (difference > tolerance) return longer;
  return 'appropriate';
}

function makeEaseRegion(region: GarmentRegion, label: string, garmentValue: number | undefined, bodyValue: number, category: Garment['category'], shoulder = false): RegionFit | undefined {
  if (garmentValue === undefined) return undefined;
  const difference = garmentValue - bodyValue;
  const thresholds = CATEGORY_EASE_THRESHOLDS[category];
  const fit = shoulder ? classifyEase(difference, { veryTight: -4, tight: -1, regular: 4, relaxed: 8 }) : classifyEase(difference, thresholds);
  return { region, label, garmentValue, bodyValue, difference, unit: 'cm', fit, message: `${Math.abs(difference).toFixed(1)} cm ${difference >= 0 ? 'ease' : 'negative ease'}` };
}

function makeLengthRegion(region: GarmentRegion, label: string, garmentValue: number | undefined, bodyValue: number, tolerance: number): RegionFit | undefined {
  if (garmentValue === undefined) return undefined;
  const difference = garmentValue - bodyValue;
  const fit = classifyDifference(difference, tolerance);
  return { region, label, garmentValue, bodyValue, difference, unit: 'cm', fit, message: `${Math.abs(difference).toFixed(1)} cm ${difference >= 0 ? 'longer' : 'shorter'} than reference` };
}

export function analyzeFit(body: BodyMeasurements, garment: Garment, size: SizeLabel): FitReport {
  const dimensions: GarmentSize = garment.sizes[size];
  const regions: RegionFit[] = [];
  if (garment.category === 'Pants') {
    const candidates = [
      makeEaseRegion('waist', 'Waist', dimensions.waist, body.waist, garment.category),
      makeEaseRegion('hips', 'Seat / hips', dimensions.hips, body.hips, garment.category),
      makeLengthRegion('inseam', 'Inseam', dimensions.inseam, body.inseam, 2),
      makeLengthRegion('rise', 'Rise', dimensions.rise, body.height * 0.17, 2.5),
    ];
    regions.push(...candidates.filter((value): value is RegionFit => Boolean(value)));
  } else {
    const sleeveTarget = garment.category === 'T-shirt' ? body.armLength * 0.36 : body.armLength - 4;
    const candidates = [
      makeEaseRegion('chest', 'Chest', dimensions.chest, body.chest, garment.category),
      makeEaseRegion('waist', 'Waist', dimensions.waist, body.waist, garment.category),
      makeEaseRegion('hips', 'Hem / hips', dimensions.hips, body.hips, garment.category),
      makeEaseRegion('shoulder', 'Shoulders', dimensions.shoulder, body.shoulder, garment.category, true),
      makeLengthRegion('sleeve', 'Sleeve', dimensions.sleeve, sleeveTarget, 2.5),
      makeLengthRegion('length', 'Body length', dimensions.length, body.height * 0.37, 3),
    ];
    regions.push(...candidates.filter((value): value is RegionFit => Boolean(value)));
  }

  const severity = regions.map((region) => {
    if (region.fit === 'very-tight') return 3;
    if (region.fit === 'tight' || region.fit === 'short' || region.fit === 'long') return 2;
    if (region.fit === 'oversized') return 1.6;
    return 0;
  });
  const score = severity.reduce<number>((sum, value) => sum + value, 0) / Math.max(1, severity.length);
  const summary: FitLevel = score > 2.2 ? 'tight' : score > 1.1 ? 'oversized' : score > 0.4 ? 'relaxed' : 'regular';
  return { regions, summary, size, score };
}

export function recommendSize(body: BodyMeasurements, garment: Garment): { size: SizeLabel; reports: FitReport[] } {
  const reports = SIZES.map((size) => analyzeFit(body, garment, size));
  const preferencePenalty = (fit: FitLevel) => ({ regular: 0, relaxed: 0.25, appropriate: 0, tight: 2, short: 1.5, long: 1, 'very-tight': 4, oversized: 1.2 }[fit]);
  const ranked = reports.map((report) => {
    const regionPenalty = report.regions.reduce((sum, region) => sum + preferencePenalty(region.fit), 0) / Math.max(1, report.regions.length);
    return { size: report.size, score: regionPenalty + report.score * 0.25 };
  }).sort((a, b) => a.score - b.score);
  return { size: ranked[0].size, reports };
}
