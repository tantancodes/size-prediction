export type UnitSystem = 'metric' | 'imperial';

export type BodyMeasurements = {
  height: number;
  weight?: number;
  chest: number;
  waist: number;
  hips: number;
  shoulder: number;
  inseam: number;
  armLength: number;
  neck: number;
};

export type MeasurementKey = keyof BodyMeasurements;

export const DEFAULT_MEASUREMENTS: BodyMeasurements = {
  height: 172,
  weight: 66,
  chest: 96,
  waist: 78,
  hips: 98,
  shoulder: 42,
  inseam: 79,
  armLength: 58,
  neck: 36,
};

export const MEASUREMENT_META: Record<MeasurementKey, { label: string; unit: 'length' | 'weight'; min: number; max: number; hint: string }> = {
  height: { label: 'Height', unit: 'length', min: 130, max: 210, hint: 'Standing height' },
  weight: { label: 'Weight', unit: 'weight', min: 35, max: 220, hint: 'Optional · avatar shape is measurement-led' },
  chest: { label: 'Chest', unit: 'length', min: 60, max: 160, hint: 'Around the fullest part' },
  waist: { label: 'Waist', unit: 'length', min: 50, max: 150, hint: 'Natural waist' },
  hips: { label: 'Hips', unit: 'length', min: 65, max: 165, hint: 'Around the fullest part' },
  shoulder: { label: 'Shoulder width', unit: 'length', min: 30, max: 65, hint: 'Across shoulder points' },
  inseam: { label: 'Inseam', unit: 'length', min: 55, max: 100, hint: 'Crotch to ankle' },
  armLength: { label: 'Arm length', unit: 'length', min: 40, max: 85, hint: 'Shoulder point to wrist' },
  neck: { label: 'Neck', unit: 'length', min: 25, max: 55, hint: 'Around the base of the neck' },
};

export const LENGTH_KEYS: MeasurementKey[] = ['height', 'chest', 'waist', 'hips', 'shoulder', 'inseam', 'armLength', 'neck'];

export function fromMetric(value: number, kind: 'length' | 'weight', unit: UnitSystem): number {
  if (unit === 'metric') return value;
  return kind === 'length' ? value / 2.54 : value * 2.20462;
}

export function toMetric(value: number, kind: 'length' | 'weight', unit: UnitSystem): number {
  if (unit === 'metric') return value;
  return kind === 'length' ? value * 2.54 : value / 2.20462;
}

export function formatMeasurement(value: number, kind: 'length' | 'weight', unit: UnitSystem): string {
  const displayed = fromMetric(value, kind, unit);
  return kind === 'weight' ? displayed.toFixed(1) : displayed.toFixed(unit === 'metric' ? 0 : 1);
}

export function validateMeasurement(key: MeasurementKey, value: number): string | undefined {
  const { min, max, label, unit } = MEASUREMENT_META[key];
  if (!Number.isFinite(value)) return `${label} must be a number.`;
  if (value < min || value > max) return `${label} should be between ${min} and ${max} ${unit === 'weight' ? 'kg' : 'cm'}.`;
  return undefined;
}
