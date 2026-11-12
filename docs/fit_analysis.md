# Measurement-based fit analysis

## Ease

For a region where the same kind of measurement is available:

```text
ease = finished garment measurement − body measurement
```

Circumference ease is in centimeters. Positive ease means the garment's circumference is larger than the entered body circumference; negative ease means the garment circumference is smaller. Shoulder width is a flat width difference. Length regions report garment length relative to a body reference, not circumference ease.

## Category ranges

`CATEGORY_EASE_THRESHOLDS` in `src/fitting/fitAnalysis.ts` contains configurable starting assumptions, in centimeters of circumference ease. The app applies them independently to chest/waist/hip for tops and waist/hip for pants. These are demonstration ranges, not universal apparel standards; brands, block patterns, fabric stretch, intended silhouette, and measurement technique shift the meaning of ease.

| Category | Very tight below | Tight below | Regular below | Relaxed below | Oversized at or above |
|---|---:|---:|---:|---:|---:|
| T-shirt | -8 | 0 | 10 | 20 | 20 |
| Hoodie | -5 | 4 | 16 | 28 | 28 |
| Sweatshirt | -6 | 2 | 14 | 25 | 25 |
| Pants | -5 | 1 | 8 | 16 | 16 |

At each boundary, the next band begins. Shoulder width uses separate width bands (`<-4`, `<-1`, `<4`, `<8`, then oversized). The exact code is authoritative if this table is edited.

## Length assumptions

- Tee sleeve target = `0.36 × arm length`.
- Hoodie/sweatshirt sleeve target = `arm length − 4 cm`.
- Top body-length reference = `0.37 × height`.
- Pants rise reference = `0.17 × height`.
- Sleeve is on target within ±2.5 cm; top length within ±3 cm; inseam within ±2 cm; rise within ±2.5 cm.

These are V0 fit heuristics chosen to make a complete report from the available fields. They need validation with pattern blocks and wear tests. Inseam and body length are not garment stresses or guaranteed aesthetic preferences.

## Overall summary and size ranking

Each region contributes a lightweight penalty: very-tight = 3; tight, short, or long = 2; oversized = 1.6; regular, relaxed, or appropriate = 0. The mean score maps to the overall label: above 2.2 is tight, above 1.1 is oversized, above 0.4 is relaxed, and otherwise regular. Size recommendations average per-region penalties (regular/on-target = 0, relaxed = .25, oversized = 1.2, long = 1, short = 1.5, tight = 2, very-tight = 4) and add one quarter of the summary score. The lowest score is recommended. This is an explainable ranking heuristic, not a trained prediction model.

## Interpretation and limits

The report is an ease estimate computed from the supplied measurements and selected sample chart. It does not simulate pressure, stretch, fabric weight, friction, seams, drape, body pose, movement, or personal preference. Body measurements and chart protocols may also mismatch. Treat the labels as a way to compare dimensions and candidate sizes, not as guaranteed real-world fit advice.
