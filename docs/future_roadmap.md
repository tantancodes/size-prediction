# Future roadmap

## Milestone 1 — Make the parametric body defensible

- Add a measurement guide with landmarks, pose, tape tension guidance, and a repeat-measurement estimate.
- Fit a licensed, riggable body model to measurement constraints and preserve explicit per-measurement residuals.
- Compare predicted surfaces and derived circumferences against a small, consented reference scan set.
- Document unsupported body variation and uncertainty; do not market the inferred surface as a scan.

## Milestone 2 — Use actual garment construction

- Pick one garment block and obtain a real sample with permission.
- Record garment measurement locations, size grading, pattern panels, seam map, fabric stretch/bending/weight, and source provenance.
- Build an importer that converts pattern assets to a stable internal schema.
- Check the digital pattern's finished measurements against the sewn sample before testing size recommendations.

## Milestone 3 — Validate static fit and simulation

- Capture a fixed-pose body surface and garment drape for multiple sizes and measured materials.
- Evaluate a Blender offline cloth baseline and a PBD/FEM alternative on the same asset.
- Compare penetration, hem position, circumferences, and blinded wearer fit judgments; profile CPU time on an Apple Silicon Mac.
- Only introduce predictive ML if measured labels and a suitable subject/style-held-out evaluation set exist.

## Milestone 4 — Evaluate body reconstruction inputs

- Start with a stationary multi-view capture protocol and a scale target; use Metashape to inspect alignment and dense geometry quality.
- Compare surface reconstruction quality and tape-measure error against a dedicated scanner or trusted manual measurements.
- Separately assess the clothed surface and the underlying body estimate; clothing may hide the surface the fit model needs.
- Test an SMPL-family fit and a multi-view neural model as alternate initializers, not as ground-truth truth.

## Milestone 5 — Responsible retail data integration

- Connect a retailer only through an approved API/feed, direct agreement, or user-supplied measurements.
- Track each source and measurement protocol; show uncertainty where charts are incomplete or inconsistent.
- Audit size recommendations by garment category, brand, body shape, and feedback source before broad release.
