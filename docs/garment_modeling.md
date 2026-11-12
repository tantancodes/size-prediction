# Garment modeling in V0

## Current representation

The sample library includes a T-shirt, hoodie, sweatshirt, and pants in XS–XL. Each size is a small object of garment measurements: tops use chest, waist, hip/hem, shoulder, sleeve, and length; pants use waist, hip/seat, inseam, and rise.

Those values are deliberately synthetic examples for exercising the UI and fitting code. They are not sourced from brands, product catalogs, or a real sample garment. Every chart is labeled as illustrative in the app.

For tops, the viewer converts selected chest, waist, hip, and shoulder chart values into elliptical ring profiles. Short sleeves or long sleeves are tapered cylinders sized from body arm length and the chart sleeve value. Hoodies have a separate simple hood volume. Pants use a pelvis loft plus two tapered lofts whose hem position follows the selected inseam. Changing a garment size changes the dimensions and visible shell.

## What the approximation leaves out

The meshes are closed procedural shells. They do not have true armholes, neck openings, separate front/back panels, seam curves, seam allowance, grain direction, darts, pleats, cuffs, ribbing topology, pockets, or pattern grading. A chart circumference is treated as a simplified ring circumference; actual garment measurement protocols vary. Sleeves and legs can intersect the avatar or one another. This geometry cannot tell whether a garment could be sewn or draped into the depicted shape.

## Future garment-data interface

Add patterns and retailer data through a provenance-aware adapter, not by copying unknown measurements into the demo chart. The adapter should preserve units, measurement locations/protocols, source, retrieval date, permissions/license, brand/style/size identifiers, and whether values are body or finished-garment measurements.

Possible future sources, in order of validation ease:

1. User-entered garment measurements from a physical item, labeled by where each tape measurement was taken.
2. Retailer or manufacturer size charts obtained from an approved API, licensed feed, or direct permission.
3. User-supplied 2D patterns, DXF, or simulation-ready garment assets with licensing information.
4. Pattern assets built in CLO / Marvelous Designer or Blender and exported through a documented conversion step.

Do not scrape product sites or present inferred values as brand measurements. Compare extracted garment dimensions against a physical sample before using them in fit recommendations.

## Pattern-based next step

Use a garment asset with 2D pattern panels, panel grain directions, seam pairings, material data, and finished measurement metadata. Generate the 3D drape from the panels, then compare the simulated surface to the measured finished garment. Keep the measurement chart and the pattern as separate sources of truth so a grading or sewing mismatch can be found.
