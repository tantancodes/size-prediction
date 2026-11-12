import { useEffect, useState } from 'react';
import { Activity, Ruler } from 'lucide-react';
import { fromMetric, MEASUREMENT_META, toMetric, validateMeasurement } from '../models/measurements';
import type { BodyMeasurements, MeasurementKey, UnitSystem } from '../models/measurements';

const FIELD_ORDER: MeasurementKey[] = ['height', 'weight', 'chest', 'waist', 'hips', 'shoulder', 'inseam', 'armLength', 'neck'];

type Props = { measurements: BodyMeasurements; unit: UnitSystem; onUnitChange: (unit: UnitSystem) => void; onChange: (measurements: BodyMeasurements) => void };

function displayUnit(key: MeasurementKey, unit: UnitSystem) {
  const kind = MEASUREMENT_META[key].unit;
  return kind === 'weight' ? (unit === 'metric' ? 'kg' : 'lb') : (unit === 'metric' ? 'cm' : 'in');
}

export function BodyMeasurementForm({ measurements, unit, onUnitChange, onChange }: Props) {
  const [drafts, setDrafts] = useState<Record<MeasurementKey, string>>(() => Object.fromEntries(FIELD_ORDER.map((key) => [key, key === 'weight' && measurements.weight === undefined ? '' : fromMetric(measurements[key] ?? 0, MEASUREMENT_META[key].unit, unit).toFixed(MEASUREMENT_META[key].unit === 'weight' || unit === 'imperial' ? 1 : 0)])) as Record<MeasurementKey, string>);
  const [errors, setErrors] = useState<Partial<Record<MeasurementKey, string>>>({});

  useEffect(() => {
    setDrafts(Object.fromEntries(FIELD_ORDER.map((key) => [key, key === 'weight' && measurements.weight === undefined ? '' : fromMetric(measurements[key] ?? 0, MEASUREMENT_META[key].unit, unit).toFixed(MEASUREMENT_META[key].unit === 'weight' || unit === 'imperial' ? 1 : 0)])) as Record<MeasurementKey, string>);
    setErrors({});
  }, [unit]);

  const onInput = (key: MeasurementKey, value: string) => {
    setDrafts((current) => ({ ...current, [key]: value }));
    const numericValue = Number(value);
    if (value.trim() === '' && key === 'weight') {
      setErrors((current) => ({ ...current, [key]: undefined }));
      const next = { ...measurements };
      delete next.weight;
      onChange(next);
      return;
    }
    const metricValue = toMetric(numericValue, MEASUREMENT_META[key].unit, unit);
    const rangeError = validateMeasurement(key, metricValue);
    const precision = unit === 'imperial' || MEASUREMENT_META[key].unit === 'weight' ? 1 : 0;
    const lower = fromMetric(MEASUREMENT_META[key].min, MEASUREMENT_META[key].unit, unit).toFixed(precision);
    const upper = fromMetric(MEASUREMENT_META[key].max, MEASUREMENT_META[key].unit, unit).toFixed(precision);
    const error = rangeError?.includes('between')
      ? `${MEASUREMENT_META[key].label} should be between ${lower} and ${upper} ${displayUnit(key, unit)}.`
      : rangeError;
    setErrors((current) => ({ ...current, [key]: error }));
    if (!error) onChange({ ...measurements, [key]: metricValue });
  };

  return (
    <section className="panel measurement-panel" aria-labelledby="profile-title">
      <div className="panel-heading">
        <div className="panel-title-line"><span className="section-number">01</span><h2 id="profile-title">Your profile</h2></div>
        <div className="unit-switch" aria-label="Measurement units">
          <button className={unit === 'metric' ? 'active' : ''} onClick={() => onUnitChange('metric')}>Metric</button>
          <button className={unit === 'imperial' ? 'active' : ''} onClick={() => onUnitChange('imperial')}>US</button>
        </div>
      </div>
      <p className="panel-description">A few measurements shape your avatar and fit estimate.</p>
      <div className="measurement-grid">
        {FIELD_ORDER.map((key) => {
          const meta = MEASUREMENT_META[key];
          const isWeight = key === 'weight';
          const isError = Boolean(errors[key]);
          return (
            <label key={key} className={`measurement-field ${key === 'height' || key === 'weight' ? 'field-wide' : ''} ${isError ? 'has-error' : ''}`}>
              <span className="field-label">{meta.label}{isWeight && <span className="optional-label">Optional</span>}</span>
              <span className="input-unit-wrap">
                <input aria-label={meta.label} aria-invalid={isError} type="number" inputMode="decimal" min={fromMetric(meta.min, meta.unit, unit)} max={fromMetric(meta.max, meta.unit, unit)} step={unit === 'metric' && meta.unit === 'length' ? 1 : 0.1} value={drafts[key]} onChange={(event) => onInput(key, event.target.value)} />
                <span>{displayUnit(key, unit)}</span>
              </span>
              {isError ? <span className="field-hint error-hint">{errors[key]}</span> : <span className="field-hint">{meta.hint}</span>}
            </label>
          );
        })}
      </div>
      <div className="avatar-note">
        <div className="note-icon"><Activity size={16} /></div>
        <p><strong>Measurement-led approximation.</strong> A handful of inputs cannot recover your unique body shape. This avatar is a proportion guide, not a scan.</p>
      </div>
      <div className="profile-foot"><Ruler size={13} /><span>Metric values drive the model; units only change how you enter them.</span></div>
    </section>
  );
}
