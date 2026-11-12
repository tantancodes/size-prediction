# Scene2Fit

Scene2Fit is a local, interactive prototype for exploring how body measurements, garment dimensions, and clothing ease relate. It creates an adjustable procedural avatar, wraps simplified garment geometry around it, and compares size charts with a transparent rule-based fit report.

> **Prototype limits:** The avatar is an approximation. Sample garment charts are invented for demonstration and are not retailer measurements. The 3D garments are parameterized shells, not sewn patterns or cloth simulations. Fit labels are preliminary estimates, not purchase guarantees.

## Run locally

Requirements: Node.js 20.19+ (or 22.12+) and npm. The project was built and verified with Node 26 on macOS.

```bash
npm install
npm run dev
```

Open the localhost URL printed by Vite. To create a production build:

```bash
npm run build
```

Run the calculation and geometry tests:

```bash
npm test
```

No account, camera permission, cloud service, paid API, or NVIDIA GPU is required. Profile data stays in React state in the current browser session; it is not uploaded or saved across reloads.

## Use the fitting room

1. Edit height, chest, waist, hips, shoulder width, inseam, arm length, and neck. Weight is optional and currently does not alter the avatar.
2. Use **Metric / US** to enter centimeters and kilograms or inches and pounds. Calculations stay in centimeters and kilograms internally.
3. Pick the illustrative T-shirt, hoodie, sweatshirt, or pants chart.
4. Select a size or turn on **Compare sizes** to see a second size as a translucent wireframe and compare its measurements in the analysis panel.
5. Drag the avatar to rotate, scroll to zoom, and use Front / Side / Back for camera presets. Hide the garment to inspect the avatar.
6. Read the per-region ease estimate and size recommendation. Green markers indicate regular / acceptable ease, rust indicates snug fit, and blue indicates extra room or length.

Invalid measurements show an inline error and do not update the last valid avatar dimensions. The metric bounds for each field are in `src/models/measurements.ts`.

## What the implementation does

- `src/models/` contains the metric body and garment types.
- `src/data/sampleGarments.ts` contains explicitly synthetic charts for five sizes across four garment types.
- `src/three/body/geometry.ts` converts circumferences to elliptical ring profiles and lofts smooth closed meshes.
- `src/three/AvatarViewer.tsx` builds the avatar, simplified garment meshes, camera presets, orbit controls, size overlay, and fit markers.
- `src/fitting/fitAnalysis.ts` calculates ease, classifies each region using garment-specific starting ranges, summarizes a size, and ranks the sample chart.
- `src/components/` contains the editable profile, garment selector, and fit report.

See the technical notes in [`docs/architecture.md`](docs/architecture.md), [`docs/body_modeling.md`](docs/body_modeling.md), [`docs/garment_modeling.md`](docs/garment_modeling.md), and [`docs/fit_analysis.md`](docs/fit_analysis.md).

## Add a sample garment

Add an entry to `src/data/sampleGarments.ts` with a unique `id`, name, category, description, colors, and a complete XS–XL `sizes` map. Use the same dimensions already defined in `src/models/garment.ts`: tops need chest/waist/hips/shoulder/sleeve/length; pants need waist/hips/inseam/rise. The garment selector reads this array automatically. The viewer currently treats non-pants categories as tops; add geometry in `src/three/AvatarViewer.tsx` if the new garment needs a different silhouette. Adjust `CATEGORY_EASE_THRESHOLDS` in `src/fitting/fitAnalysis.ts` only with a documented category-specific assumption. Add tests for its dimensions and fit response. Clearly mark any demonstration data as synthetic and keep its provenance with it.

## Limitations and next milestones

Current geometry has no rigged pose, body scanning, anatomical landmarks, sewn pattern topology, fabric properties, collision solver, or validation against wear trials. The default avatar is deliberately neutral and should not be mistaken for a reconstruction of any individual.

Suggested next engineering milestones:

1. Replace the ring-profile body with a licensed, riggable parametric mesh (or add a carefully evaluated SMPL-family adapter) and fit it to tape measurements while preserving explicit uncertainty.
2. Replace shell garments with panel-and-seam patterns imported from a versioned garment asset format; validate garment measurements against the source pattern and a sample garment.
3. Add a local cloth-simulation experiment and a small consented fit-validation study before presenting fit results as predictive.

Research tradeoffs and a study plan are in [`docs/research_questions.md`](docs/research_questions.md) and [`docs/future_roadmap.md`](docs/future_roadmap.md).
