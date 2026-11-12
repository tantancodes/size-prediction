import { ArrowDownRight, ArrowRight, ArrowUpRight, Check, Info, Ruler, Sparkles } from 'lucide-react';
import { analyzeFit, recommendSize } from '../fitting/fitAnalysis';
import type { FitReport, RegionFit } from '../fitting/fitAnalysis';
import type { BodyMeasurements, UnitSystem } from '../models/measurements';
import type { Garment, SizeLabel } from '../models/garment';
import { fromMetric } from '../models/measurements';

function fitNumber(value: number, unit: UnitSystem) { return fromMetric(value, 'length', unit).toFixed(1); }

const FIT_LABEL: Record<RegionFit['fit'], string> = {
  'very-tight': 'Very tight', tight: 'Tight', regular: 'Regular', relaxed: 'Relaxed', oversized: 'Oversized', short: 'Short', long: 'Long', appropriate: 'On target',
};

function formatDelta(value: number) {
  return `${value > 0 ? '+' : ''}${value.toFixed(1)} cm`;
}

function RegionRow({ region, unit }: { region: RegionFit; unit: UnitSystem }) {
  const tone = region.fit === 'tight' || region.fit === 'very-tight' || region.fit === 'short' ? 'tight' : region.fit === 'oversized' || region.fit === 'long' ? 'loose' : 'good';
  return (
    <div className="region-row">
      <div className={`region-dot ${tone}`} />
      <div className="region-copy">
        <div className="region-title-line"><strong>{region.label}</strong><span className={`fit-tag ${tone}`}>{FIT_LABEL[region.fit]}</span></div>
        <span className="region-measure">Garment {fitNumber(region.garmentValue, unit)} {unit === 'metric' ? 'cm' : 'in'} <span>·</span> Body {fitNumber(region.bodyValue, unit)} {unit === 'metric' ? 'cm' : 'in'}</span>
      </div>
      <span className="region-delta">{fitNumber(region.difference, unit)} {unit === 'metric' ? 'cm' : 'in'}</span>
    </div>
  );
}

function SizeComparison({ garment, body, current, alternate, unit, onAlternateChange }: { garment: Garment; body: BodyMeasurements; current: FitReport; alternate: SizeLabel; unit: UnitSystem; onAlternateChange: (size: SizeLabel) => void }) {
  const alternateReport = analyzeFit(body, garment, alternate);
  return (
    <div className="size-comparison-panel">
      <div className="comparison-heading"><span><Sparkles size={15} /> SIZE CHECK</span><select value={alternate} onChange={(event) => onAlternateChange(event.target.value as SizeLabel)} aria-label="Compare against size">{(['XS', 'S', 'M', 'L', 'XL'] as SizeLabel[]).map((option) => <option key={option} value={option} disabled={option === current.size}>{option}</option>)}</select></div>
      <div className="comparison-sizes"><div className="comparison-size active"><span>Selected</span><strong>{current.size}</strong><em>{FIT_LABEL[current.summary]}</em></div><ArrowRight size={15} /><div className="comparison-size alternate"><span>Compare</span><strong>{alternateReport.size}</strong><em>{FIT_LABEL[alternateReport.summary]}</em></div></div>
      <div className="comparison-rows">
        {alternateReport.regions.filter((item) => ['chest', 'waist', 'hips', 'inseam'].includes(item.region)).slice(0, 3).map((region) => {
          const currentRegion = current.regions.find((item) => item.region === region.region);
          if (!currentRegion) return null;
          const delta = region.garmentValue - currentRegion.garmentValue;
          return <div className="compare-delta-row" key={region.region}><span>{region.label}</span><span>{fitNumber(currentRegion.garmentValue, unit)}<ArrowRight size={11} />{fitNumber(region.garmentValue, unit)} {unit === 'metric' ? 'cm' : 'in'} <small>{unit === 'metric' ? formatDelta(delta) : `${delta > 0 ? '+' : ''}${fitNumber(delta, unit)} in`}</small></span></div>;
        })}
      </div>
    </div>
  );
}

type Props = { body: BodyMeasurements; garment: Garment; size: SizeLabel; report: FitReport; unit: UnitSystem; comparison: boolean; comparisonSize: SizeLabel; onComparisonSizeChange: (size: SizeLabel) => void };

export function FitAnalysis({ body, garment, size, report, unit, comparison, comparisonSize, onComparisonSizeChange }: Props) {
  const recommendation = recommendSize(body, garment);
  const recommendedReport = recommendation.reports.find((candidate) => candidate.size === recommendation.size)!;
  const recommendationMatches = recommendation.size === size;
  return (
    <aside className="analysis-panel" aria-labelledby="analysis-title">
      <div className="analysis-heading">
        <div className="panel-title-line"><span className="section-number">03</span><h2 id="analysis-title">Fit analysis</h2></div>
        <button className="info-button" title="Ease-based estimate. Actual fabric and pattern construction are not simulated." aria-label="About this estimate"><Info size={15} /></button>
      </div>
      <div className="fit-summary-card">
        <div className="summary-meta"><span>OVERALL ESTIMATE</span><span className="estimate-badge"><span /> PRELIMINARY</span></div>
        <div className="summary-result"><strong>{FIT_LABEL[report.summary]}</strong><span className={`summary-pill tone-${report.summary}`}>{size}</span></div>
        <div className="summary-subline">{garment.name} · size {size}</div>
      </div>
      <div className="recommendation-card">
        <div className="recommend-icon"><Check size={16} /></div>
        <div className="recommend-copy"><span>BEST SIZE ESTIMATE</span><strong>Try size {recommendation.size}</strong><p>{recommendationMatches ? 'Your selected size is the closest match in this sample chart.' : `Size ${recommendation.size} has the lowest measurement mismatch.`}</p></div>
        {!recommendationMatches && <span className="recommended-ease">{FIT_LABEL[recommendedReport.summary]}</span>}
      </div>
      <div className="region-section">
        <div className="subsection-heading"><h3>By body region</h3><span><Ruler size={12} /> Ease estimate</span></div>
        <div className="region-list">{report.regions.map((region) => <RegionRow key={region.region} region={region} unit={unit} />)}</div>
      </div>
      {comparison && <SizeComparison garment={garment} body={body} current={report} alternate={comparisonSize} unit={unit} onAlternateChange={onComparisonSizeChange} />}
      <div className="analysis-caveat"><div><ArrowDownRight size={14} /></div><p>Fit tags use garment ease and category-specific ranges. They do not model fabric stretch, seams, posture, or movement.</p></div>
      <div className="analysis-source-note"><ArrowUpRight size={12} /> Sample garment measurements are illustrative, not retailer data.</div>
    </aside>
  );
}
