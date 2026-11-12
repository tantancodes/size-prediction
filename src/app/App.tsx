import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUpRight, ChevronDown, CircleHelp, Compass, Dot, Leaf, ScanLine, ShieldCheck, Sparkles } from 'lucide-react';
import { BodyMeasurementForm } from '../components/BodyMeasurementForm';
import { FitAnalysis } from '../components/FitAnalysis';
import { GarmentSelector } from '../components/GarmentSelector';
import { AvatarViewer } from '../three/AvatarViewer';
import { SAMPLE_GARMENTS } from '../data/sampleGarments';
import { analyzeFit } from '../fitting/fitAnalysis';
import { DEFAULT_MEASUREMENTS } from '../models/measurements';
import type { BodyMeasurements, UnitSystem } from '../models/measurements';
import type { SizeLabel } from '../models/garment';

export default function App() {
  const [body, setBody] = useState<BodyMeasurements>(DEFAULT_MEASUREMENTS);
  const [unit, setUnit] = useState<UnitSystem>('metric');
  const [garmentId, setGarmentId] = useState(SAMPLE_GARMENTS[0].id);
  const [size, setSize] = useState<SizeLabel>('M');
  const [comparisonSize, setComparisonSize] = useState<SizeLabel>('L');
  const [comparison, setComparison] = useState(false);
  const [garmentVisible, setGarmentVisible] = useState(true);

  const garment = SAMPLE_GARMENTS.find((item) => item.id === garmentId) ?? SAMPLE_GARMENTS[0];
  const report = useMemo(() => analyzeFit(body, garment, size), [body, garment, size]);

  const selectGarment = (id: string) => {
    setGarmentId(id);
    setSize('M');
    setComparisonSize('L');
    setGarmentVisible(true);
  };

  const selectSize = (nextSize: SizeLabel) => {
    setSize(nextSize);
    if (nextSize === comparisonSize) setComparisonSize(nextSize === 'XL' ? 'L' : 'XL');
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Scene2Fit home">
          <span className="brand-mark"><span /><span /><span /><span /></span>
          <span>scene<span>2</span>fit</span>
          <span className="brand-beta">BETA</span>
        </a>
        <nav className="top-nav" aria-label="Main navigation">
          <a className="nav-link active" href="#studio">Fit studio</a>
          <a className="nav-link" href="#how-it-works">How it works</a>
          <a className="nav-link" href="#research">Research notes <ArrowUpRight size={13} /></a>
        </nav>
        <div className="topbar-right"><span className="local-indicator"><span /> LOCAL PREVIEW</span><button className="help-button" title="Measurements are approximate and stay in this local prototype." aria-label="About Scene2Fit"><CircleHelp size={17} /></button></div>
      </header>

      <main id="top" className="workspace">
        <div className="page-intro">
          <div className="intro-copy">
            <div className="eyebrow"><span className="eyebrow-line" /> PERSONALIZED FIT, VISUALIZED</div>
            <h1>Know how it <em>might</em> fit.</h1>
            <p>A measurement-led preview of your proportions, garment dimensions, and estimated ease.</p>
          </div>
          <div className="intro-stats">
            <div><span className="intro-stat-icon"><ScanLine size={16} /></span><span><strong>Body-aware</strong><small>Your measurements shape the avatar</small></span></div>
            <span className="stat-separator" />
            <div><span className="intro-stat-icon"><Compass size={16} /></span><span><strong>Turn & compare</strong><small>Explore shape and size changes</small></span></div>
          </div>
        </div>

        <div id="studio" className="studio-grid">
          <div className="profile-column">
            <BodyMeasurementForm measurements={body} unit={unit} onUnitChange={setUnit} onChange={setBody} />
            <div className="privacy-card"><ShieldCheck size={15} /><span>Private by design</span><p>Measurements stay in this browser session. Nothing is uploaded.</p></div>
          </div>

          <section className="fitting-column" aria-label="Virtual fitting studio">
            <div className="column-title-row">
              <div><div className="section-kicker"><span className="section-number">02</span> FITTING ROOM</div><h2>Try it on, virtually.</h2></div>
              <button className="how-link" onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}><span>How this works</span><ArrowDown size={14} /></button>
            </div>
            <GarmentSelector garments={SAMPLE_GARMENTS} selectedId={garmentId} onSelect={selectGarment} />
            <AvatarViewer body={body} garment={garment} size={size} report={report} garmentVisible={garmentVisible} comparison={comparison} comparisonSize={comparisonSize} onSizeChange={selectSize} onToggleGarment={() => setGarmentVisible((shown) => !shown)} onToggleComparison={() => setComparison((active) => !active)} onComparisonSizeChange={setComparisonSize} />
            <div className="viewer-disclaimer"><InfoIcon /><span>3D preview is generated from parametric geometry. Garments are simplified shells; no cloth simulation is running.</span></div>
          </section>

          <FitAnalysis body={body} garment={garment} size={size} report={report} unit={unit} comparison={comparison} comparisonSize={comparisonSize} onComparisonSizeChange={setComparisonSize} />
        </div>

        <section id="how-it-works" className="method-strip">
          <div className="method-heading"><div className="method-icon"><Sparkles size={16} /></div><div><span>THE V0 METHOD</span><h2>A useful first approximation.</h2></div></div>
          <div className="method-step"><strong>01</strong><p>Measurements define a smooth, adjustable body profile.</p></div>
          <div className="method-step"><strong>02</strong><p>Example garment charts describe simplified 3D shells.</p></div>
          <div className="method-step"><strong>03</strong><p>Ease and category ranges produce explainable fit tags.</p></div>
          <a href="#research" className="method-more">Explore the method <ArrowUpRight size={14} /></a>
        </section>

        <section id="research" className="research-footer">
          <div className="research-copy"><div className="research-brand"><Leaf size={15} /> BUILT FOR WHAT COMES NEXT</div><h2>From measurements to more realistic fit.</h2><p>Scene2Fit is an early research prototype. Its modular body, garment, and fitting layers leave room for scan inputs, pattern-based garments, and future simulation.</p></div>
          <div className="research-pill-list"><span><Dot size={18} /> Parametric body models</span><span><Dot size={18} /> Garment patterns</span><span><Dot size={18} /> Cloth mechanics</span><span><Dot size={18} /> Fit data & validation</span></div>
          <a className="documentation-link" href="./docs/research_questions.md" target="_blank" rel="noreferrer">Read research notes <ArrowUpRight size={14} /></a>
        </section>
        <footer className="page-footer"><span>SCENE2FIT · PROTOTYPE 0.1</span><span>Built to make fit more understandable.</span><a href="./README.md" target="_blank" rel="noreferrer">Documentation <ChevronDown size={13} /></a></footer>
      </main>
    </div>
  );
}

function InfoIcon() {
  return <span className="info-dot"><span>i</span></span>;
}
