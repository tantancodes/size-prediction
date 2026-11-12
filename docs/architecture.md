# Architecture

## Runtime shape

Scene2Fit V0 is a client-only React + TypeScript + Vite application. Three.js provides mesh and material primitives; React Three Fiber owns the scene lifecycle; Drei provides orbit controls and contact shadows. There is no API server, account system, camera input, product scraper, or external runtime service.

The application state in `src/app/App.tsx` holds the current body profile, unit display, selected sample garment, selected size, comparison size, visibility, and comparison toggle. Metric values are the source of truth. `BodyMeasurementForm` converts typed values into centimeters or kilograms and rejects out-of-range values before they reach the scene.

## Data flow

```text
BodyMeasurementForm ── metric measurements ──┬── body loft profiles ── avatar meshes
                                             ├── ease calculations ── fit report
Garment selector + size ── sample dimensions ├── garment loft profiles ── garment meshes
                                             └── recommendation ranking ── size estimate
```

The viewer and report consume the same body and garment data. `analyzeFit()` is a pure calculation module; it does not read React state or scene geometry. This separation makes a future simulation adapter possible without making the interface depend on a solver.

## Module map

| Area | Responsibility |
|---|---|
| `src/models/measurements.ts` | Internal metric units, field bounds, unit conversion, validation |
| `src/models/garment.ts` | Category, size, dimension, and region types |
| `src/data/sampleGarments.ts` | Synthetic sample size charts, garment labels, colors |
| `src/three/body/geometry.ts` | Circumference conversion, profile interpolation, mesh loft generation |
| `src/three/AvatarViewer.tsx` | Avatar, garment scene, comparison overlay, camera controls, fit markers |
| `src/fitting/fitAnalysis.ts` | Ease, region classifications, summary, recommendation |
| `src/components/` | Measurement form, garment tabs, report and comparison presentation |

## Scene conventions

- Y is up; Z positive points toward the avatar's front.
- Body measurements remain metric. Geometry converts centimeters to meters when creating Three.js coordinates.
- Circumferences map to elliptical cross-sections. The front/back depth ratio is a chosen V0 parameter, not an inferred personal measurement.
- Mesh geometry is created from typed measurement profiles and memoized in the scene components. The scene uses a low vertex count suitable for an integrated Mac GPU.
- Preset views adjust the camera; OrbitControls remains enabled so those presets do not block free inspection.
- Fit markers encode measurement classifications only. They do not encode strain, pressure, contact force, or simulated fabric tension.

## Extension boundary for simulation

Keep solver-specific code behind an interface that accepts a body surface, garment panels and seam graph, material parameters, pose, gravity, and contact settings. The output should be a deforming garment mesh plus diagnostics such as penetration and solver convergence. The existing `analyzeFit()` report can remain a fast pre-simulation estimate; a future calibrated simulation can add results beside it rather than overloading the current meanings.

An eventual asset boundary could look like:

```ts
type GarmentAsset = {
  sizeId: string;
  panels: PatternPanel[];
  seams: SeamPair[];
  measurements: GarmentMeasurements;
  material: FabricParameters;
  provenance: { source: string; license: string; verifiedAt?: string };
};

type SimulationResult = {
  positions: Float32Array;
  normals: Float32Array;
  diagnostics: { maxPenetration: number; converged: boolean };
};
```

The types above are design sketches, not implemented runtime types.
