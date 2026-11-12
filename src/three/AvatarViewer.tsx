import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { ContactShadows, OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { Camera, Eye, EyeOff, Rotate3D, ScanFace } from 'lucide-react';
import type { BodyMeasurements } from '../models/measurements';
import type { Garment, GarmentSize, GarmentRegion, SizeLabel } from '../models/garment';
import type { FitReport, RegionFit } from '../fitting/fitAnalysis';
import { bodyHipLineY, bodyTorsoProfile, circumferenceToEllipse, createLimbGeometry, createLoftGeometry, garmentTorsoProfile } from './body/geometry';

type ViewAngle = 'front' | 'side' | 'back';

type AvatarViewerProps = {
  body: BodyMeasurements;
  garment: Garment;
  size: SizeLabel;
  report: FitReport;
  garmentVisible: boolean;
  comparison: boolean;
  comparisonSize: SizeLabel;
  onSizeChange: (size: SizeLabel) => void;
  onToggleGarment: () => void;
  onToggleComparison: () => void;
  onComparisonSizeChange: (size: SizeLabel) => void;
};

function Segment({ start, end, topRadius, bottomRadius, material }: { start: THREE.Vector3; end: THREE.Vector3; topRadius: number; bottomRadius: number; material: THREE.Material }) {
  const geometry = useMemo(() => createLimbGeometry(topRadius, bottomRadius, start.distanceTo(end)), [topRadius, bottomRadius, start, end]);
  const position = useMemo(() => start.clone().add(end).multiplyScalar(0.5), [start, end]);
  const quaternion = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.clone().sub(start).normalize()), [start, end]);
  return <mesh geometry={geometry} material={material} position={position} quaternion={quaternion} castShadow receiveShadow />;
}

function Avatar({ body }: { body: BodyMeasurements }) {
  const h = body.height / 100;
  const skin = useMemo(() => new THREE.MeshStandardMaterial({ color: '#bf9077', roughness: 0.68 }), []);
  const hair = useMemo(() => new THREE.MeshStandardMaterial({ color: '#40352f', roughness: 0.82 }), []);
  const torso = useMemo(() => createLoftGeometry(bodyTorsoProfile(body), 40, 56, true), [body]);
  const headRadius = h * 0.064;
  const neckDims = circumferenceToEllipse(body.neck, 0.88);
  const shoulderHalf = Math.max(body.shoulder / 200, circumferenceToEllipse(body.chest).width * 0.45);
  const armLength = body.armLength / 100;
  const thighRadius = Math.max(0.07, body.hips / 100 * 0.082);
  const hipLineY = bodyHipLineY(body);
  const legLengthAdjustment = hipLineY - h * 0.51;

  return (
    <group>
      <mesh geometry={torso} material={skin} castShadow receiveShadow />
      {/* The mesh segments overlap at joints to read as a continuous, softly shaped figure. */}
      <mesh position={[0, h * 0.86, 0]} material={skin} castShadow receiveShadow>
        <cylinderGeometry args={[neckDims.width * 0.43, neckDims.width * 0.52, h * 0.075, 24, 1]} />
      </mesh>
      <mesh position={[0, h * 0.916, 0]} material={skin} scale={[headRadius * 0.88, headRadius * 1.2, headRadius * 0.9]} castShadow receiveShadow>
        <sphereGeometry args={[1, 32, 24]} />
      </mesh>
      {/* A simple hair cap and subtle nose give the blank avatar a clear front orientation. */}
      <mesh position={[0, h * 0.951, -headRadius * 0.015]} material={hair} scale={[headRadius * 0.88, headRadius * 0.52, headRadius * 0.91]} castShadow>
        <sphereGeometry args={[1, 28, 18]} />
      </mesh>
      <mesh position={[0, h * 0.912, headRadius * 0.79]} material={skin} scale={[headRadius * 0.12, headRadius * 0.19, headRadius * 0.15]}>
        <sphereGeometry args={[1, 18, 12]} />
      </mesh>
      {[-1, 1].map((side) => {
        const shoulder = new THREE.Vector3(side * shoulderHalf * 0.88, h * 0.785, 0);
        const elbow = new THREE.Vector3(side * (shoulderHalf + armLength * 0.13), h * 0.785 - armLength * 0.49, 0.005);
        const wrist = new THREE.Vector3(side * (shoulderHalf + armLength * 0.21), h * 0.785 - armLength * 0.96, 0.025);
        const hip = new THREE.Vector3(side * h * 0.055, hipLineY, 0);
        const knee = new THREE.Vector3(side * h * 0.06, h * 0.275 + legLengthAdjustment * 0.55, 0.005);
        const ankle = new THREE.Vector3(side * h * 0.055, h * 0.075, 0.015);
        return (
          <group key={side}>
            <Segment start={shoulder} end={elbow} topRadius={h * 0.037} bottomRadius={h * 0.031} material={skin} />
            <mesh position={elbow} material={skin} castShadow><sphereGeometry args={[h * 0.032, 18, 16]} /></mesh>
            <Segment start={elbow} end={wrist} topRadius={h * 0.031} bottomRadius={h * 0.025} material={skin} />
            <mesh position={wrist} material={skin} scale={[h * 0.032, h * 0.06, h * 0.023]} castShadow><sphereGeometry args={[1, 18, 16]} /></mesh>
            <Segment start={hip} end={knee} topRadius={thighRadius} bottomRadius={thighRadius * 0.8} material={skin} />
            <mesh position={knee} material={skin} castShadow><sphereGeometry args={[thighRadius * 0.78, 18, 16]} /></mesh>
            <Segment start={knee} end={ankle} topRadius={thighRadius * 0.75} bottomRadius={thighRadius * 0.48} material={skin} />
            <mesh position={[ankle.x, h * 0.038, h * 0.035]} material={skin} scale={[h * 0.055, h * 0.035, h * 0.13]} castShadow receiveShadow><sphereGeometry args={[1, 24, 16]} /></mesh>
            {[-1, 1].map((earSide) => <mesh key={earSide} position={[earSide * headRadius * 0.84, h * 0.918, 0]} material={skin} scale={[headRadius * 0.12, headRadius * 0.23, headRadius * 0.12]}><sphereGeometry args={[1, 14, 12]} /></mesh>)}
          </group>
        );
      })}
    </group>
  );
}

function GarmentBody({ body, garment, dimensions, color, opacity = 1, wireframe = false }: { body: BodyMeasurements; garment: Garment; dimensions: GarmentSize; color: string; opacity?: number; wireframe?: boolean }) {
  const h = body.height / 100;
  const material = useMemo(() => new THREE.MeshStandardMaterial({ color, roughness: 0.82, side: THREE.DoubleSide, transparent: opacity < 1, opacity, depthWrite: opacity === 1, wireframe }), [color, opacity, wireframe]);
  const rib = useMemo(() => new THREE.MeshStandardMaterial({ color: garment.accent, roughness: 0.9, side: THREE.DoubleSide, transparent: opacity < 1, opacity, depthWrite: opacity === 1 }), [garment.accent, opacity]);
  const isPants = garment.category === 'Pants';
  const pantWaistY = h * 0.62 + ((dimensions.rise ?? body.height * 0.17) - body.height * 0.17) / 100;
  const pantCrotchY = pantWaistY - (dimensions.rise ?? body.height * 0.17) / 100;
  const trunkProfile = useMemo(() => isPants
    ? [
        { y: pantCrotchY, ...circumferenceToEllipse(dimensions.hips * 0.76, 0.74) },
        { y: h * 0.5, ...circumferenceToEllipse(dimensions.hips, 0.74) },
        { y: h * 0.57, ...circumferenceToEllipse((dimensions.waist + dimensions.hips) / 2, 0.74) },
        { y: pantWaistY, ...circumferenceToEllipse(dimensions.waist, 0.72) },
      ]
    : garmentTorsoProfile(body, dimensions, 0), [body, dimensions, h, isPants, pantCrotchY, pantWaistY]);
  const trunk = useMemo(() => createLoftGeometry(trunkProfile, 36, 44, true), [trunkProfile]);
  const legEase = useMemo(() => Math.max(0, (dimensions.hips - body.hips) / 450), [dimensions.hips, body.hips]);
  const pantHemY = Math.max(h * 0.015, pantCrotchY - (dimensions.inseam ?? body.inseam) / 100);
  const legProfiles = useMemo(() => {
    const length = pantCrotchY - pantHemY;
    return [
      { y: pantHemY, width: h * 0.064 + legEase * 0.65, depth: h * 0.052 + legEase * 0.5 },
      { y: pantHemY + length * 0.08, width: h * 0.088 + legEase * 0.75, depth: h * 0.068 + legEase * 0.6 },
      { y: pantHemY + length * 0.36, width: h * 0.105 + legEase * 0.8, depth: h * 0.078 + legEase * 0.65 },
      { y: pantHemY + length * 0.78, width: h * 0.128 + legEase, depth: h * 0.098 + legEase * 0.75 },
      { y: pantCrotchY, width: h * 0.17 + legEase, depth: h * 0.128 + legEase * 0.75 },
    ];
  }, [h, legEase, pantCrotchY, pantHemY]);
  const legGeometry = useMemo(() => createLoftGeometry(legProfiles, 28, 48, true), [legProfiles]);
  const sleeveLength = dimensions.sleeve ?? body.armLength * (garment.category === 'T-shirt' ? 0.36 : 0.93);
  const sleeveEndRatio = garment.category === 'T-shirt' ? 0.36 : Math.min(0.96, sleeveLength / body.armLength);
  const shoulderX = Math.max(body.shoulder / 200, circumferenceToEllipse(dimensions.chest ?? dimensions.waist).width * 0.43);
  const sleeveMaterial = material;

  return (
    <group>
      <mesh geometry={trunk} material={material} castShadow receiveShadow />
      {isPants ? <>
        {[-1, 1].map((side) => <mesh key={side} geometry={legGeometry} material={material} position={[side * h * 0.06, 0, 0]} castShadow receiveShadow />)}
        <mesh position={[0, pantWaistY, 0]} material={rib} castShadow>
          <cylinderGeometry args={[trunkProfile[trunkProfile.length - 1].width * 0.48, trunkProfile[trunkProfile.length - 1].width * 0.5, h * 0.025, 36]} />
        </mesh>
      </> : <>
        {[-1, 1].map((side) => {
          const start = new THREE.Vector3(side * shoulderX * 0.9, h * 0.78, 0);
          const end = garment.category === 'T-shirt'
            ? new THREE.Vector3(side * (shoulderX + body.armLength / 100 * 0.12), h * 0.78 - body.armLength / 100 * sleeveEndRatio * 0.64, 0)
            : new THREE.Vector3(side * (shoulderX + body.armLength / 100 * 0.2), h * 0.78 - body.armLength / 100 * sleeveEndRatio * 0.98, 0.015);
          return <Segment key={side} start={start} end={end} topRadius={garment.category === 'T-shirt' ? 0.068 : 0.08} bottomRadius={garment.category === 'T-shirt' ? 0.055 : 0.058} material={sleeveMaterial} />;
        })}
        {garment.category === 'Hoodie' && <mesh position={[0, h * 0.844, -0.105]} material={rib} scale={[0.17, 0.19, 0.14]} castShadow><sphereGeometry args={[1, 24, 18]} /></mesh>}
        <mesh position={[0, trunkProfile[0].y + 0.008, 0]} material={rib}>
          <cylinderGeometry args={[trunkProfile[0].width * 0.495, trunkProfile[0].width * 0.5, 0.018, 36]} />
        </mesh>
      </>}
    </group>
  );
}

function FitDots({ body, garment, report, visible }: { body: BodyMeasurements; garment: Garment; report: FitReport; visible: boolean }) {
  if (!visible) return null;
  const h = body.height / 100;
  const get = (region: GarmentRegion) => report.regions.find((item) => item.region === region);
  const mapColor = (item: RegionFit | undefined) => {
    if (!item) return '#bbb8ae';
    if (item.fit === 'tight' || item.fit === 'very-tight' || item.fit === 'short') return '#c16c51';
    if (item.fit === 'oversized' || item.fit === 'long') return '#788aa5';
    return '#6d9277';
  };
  const isPants = garment.category === 'Pants';
  const dots = isPants ? [
    { item: get('waist'), y: h * 0.59, z: 0.22 },
    { item: get('hips'), y: h * 0.51, z: 0.22 },
  ] : [
    { item: get('chest'), y: h * 0.735, z: 0.22 },
    { item: get('waist'), y: h * 0.63, z: 0.2 },
    { item: get('hips'), y: h * 0.53, z: 0.19 },
  ];
  return <group>{dots.map(({ item, y, z }, index) => <mesh key={`${item?.region}-${index}`} position={[index % 2 === 0 ? -0.07 : 0.07, y, z]}>
    <sphereGeometry args={[0.026, 18, 14]} />
    <meshBasicMaterial color={mapColor(item)} depthTest={false} />
  </mesh>)}</group>;
}

function ViewController({ view, height, controlsRef }: { view: ViewAngle; height: number; controlsRef: React.RefObject<OrbitControlsImpl | null> }) {
  const { camera } = useThree();
  useEffect(() => {
    const target = new THREE.Vector3(0, height * 0.5, 0);
    const distance = Math.max(3.0, height * 2.2);
    const locations: Record<ViewAngle, [number, number, number]> = {
      front: [0, height * 0.53, distance],
      side: [distance, height * 0.53, 0],
      back: [0, height * 0.53, -distance],
    };
    camera.position.set(...locations[view]);
    camera.lookAt(target);
    if (controlsRef.current) {
      controlsRef.current.target.copy(target);
      controlsRef.current.update();
    }
  }, [view, height, camera, controlsRef]);
  return null;
}

function Stage({ body, garment, size, report, garmentVisible, comparison, comparisonSize, view, controlsRef }: Omit<AvatarViewerProps, 'onSizeChange' | 'onToggleGarment' | 'onToggleComparison' | 'onComparisonSizeChange'> & { view: ViewAngle; controlsRef: React.RefObject<OrbitControlsImpl | null> }) {
  const h = body.height / 100;
  return (
    <>
      <color attach="background" args={['#f0eee8']} />
      <ambientLight intensity={1.5} />
      <directionalLight position={[3.5, 5, 4]} intensity={2.2} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-3, 2.5, -2]} intensity={1.0} color="#d9e4e1" />
      <group position={[0, 0, 0]}>
        <Avatar body={body} />
        {garmentVisible && <>
          {comparison && <group position={[0, 0.006, -0.028]}>
            <GarmentBody body={body} garment={garment} dimensions={garment.sizes[comparisonSize]} color="#d19a6b" opacity={0.4} wireframe />
          </group>}
          <GarmentBody body={body} garment={garment} dimensions={garment.sizes[size]} color={garment.color} />
      <FitDots body={body} garment={garment} report={report} visible={view === 'front'} />
        </>}
      </group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <shadowMaterial opacity={0.12} />
      </mesh>
      <ContactShadows position={[0, 0.001, 0]} opacity={0.25} scale={3.2} blur={2.6} far={2} resolution={256} />
      <ViewController view={view} height={h} controlsRef={controlsRef} />
      <OrbitControls ref={controlsRef} makeDefault enablePan={false} minDistance={2.6} maxDistance={7.5} minPolarAngle={0.22} maxPolarAngle={Math.PI - 0.22} />
    </>
  );
}

export function AvatarViewer(props: AvatarViewerProps) {
  const { body, garment, size, garmentVisible, comparison, comparisonSize, onSizeChange, onToggleGarment, onToggleComparison, onComparisonSizeChange } = props;
  const [view, setView] = useState<ViewAngle>('front');
  const controlsRef = useRef<OrbitControlsImpl>(null);
  return (
    <section className="viewer-card" aria-label="Interactive 3D fitting room">
      <div className="viewer-topline">
        <div className="viewer-mode"><span className="live-dot" /><span>LIVE FITTING ROOM</span><span className="viewer-divider">/</span><span className="muted-inline">Procedural preview</span></div>
        <button className={`icon-button visibility-button ${garmentVisible ? 'selected' : ''}`} onClick={onToggleGarment} aria-label={garmentVisible ? 'Hide garment' : 'Show garment'}>
          {garmentVisible ? <Eye size={15} /> : <EyeOff size={15} />}<span>{garmentVisible ? 'Garment on' : 'Garment off'}</span>
        </button>
      </div>
      <div className="canvas-wrap">
        <Canvas shadows dpr={[1, 1.5]} camera={{ position: [0, 1.5, 3.9], fov: 32 }} gl={{ antialias: true, alpha: false }}>
          <Stage {...props} view={view} controlsRef={controlsRef} />
        </Canvas>
        <div className="canvas-label"><span className="label-eyebrow">YOUR AVATAR</span><span>{(body.height / 100).toFixed(2)} m · {body.chest} cm chest</span></div>
        <div className="view-switch" role="group" aria-label="Camera view">
          {(['front', 'side', 'back'] as ViewAngle[]).map((angle) => <button key={angle} onClick={() => setView(angle)} className={view === angle ? 'active' : ''}>{angle}</button>)}
        </div>
        <div className="drag-hint"><Rotate3D size={14} /> Drag to rotate <span>·</span> scroll to zoom</div>
        {comparison && garmentVisible && <div className="compare-legend"><span className="legend-current" /> {size} selected <span className="legend-alt" /> {comparisonSize} comparison</div>}
      </div>
      <div className="viewer-controls">
        <div className="garment-current">
          <div className="garment-chip" style={{ backgroundColor: garment.color }}><ScanFace size={18} /></div>
          <div><strong>{garment.name}</strong><span>{garment.description}</span></div>
        </div>
        <div className="size-control-wrap">
          <span className="control-label">SIZE</span>
          <div className="size-selector" role="group" aria-label="Garment size">
            {['XS', 'S', 'M', 'L', 'XL'].map((option) => <button key={option} className={size === option ? 'active' : ''} onClick={() => onSizeChange(option as SizeLabel)}>{option}</button>)}
          </div>
        </div>
        <button className={`compare-button ${comparison ? 'active' : ''}`} onClick={onToggleComparison} aria-pressed={comparison}>
          <Camera size={15} />{comparison ? 'Comparing' : 'Compare sizes'}
        </button>
        {comparison && <label className="comparison-size-picker">with
          <select value={comparisonSize} onChange={(event) => onComparisonSizeChange(event.target.value as SizeLabel)} aria-label="Comparison size">
            {(['XS', 'S', 'M', 'L', 'XL'] as SizeLabel[]).map((option) => <option key={option} value={option} disabled={option === size}>{option}</option>)}
          </select>
        </label>}
      </div>
      <div className="viewer-footnote"><span>FIT INDICATORS</span><div className="fit-legend"><span><i className="dot-regular" /> Good ease</span><span><i className="dot-tight" /> Snug</span><span><i className="dot-loose" /> Extra room</span></div><span className="indicator-note">Ease-based · not fabric stress</span></div>
    </section>
  );
}
