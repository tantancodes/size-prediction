# Body modeling in V0

## Approximation and uncertainty

Height and selected circumferences control a neutral standing figure. The implementation does not claim to infer a person's true surface from a small set of tape measurements. Many distinct bodies can share chest, waist, and hip circumferences, and those measurements do not specify posture, muscle/fat distribution, asymmetry, breast shape, shoulder slope, or soft-tissue behavior. Optional weight is collected only as an optional profile field; it is not used to change geometry in V0.

## Coordinate system and proportions

The model uses meters in Three.js, with Y vertical and the front facing +Z. Height is `H = heightCm / 100`. The avatar is made of a smoothly shaded lofted torso and overlapping head, neck, arms, hands, legs, and feet. Its main landmarks use normalized height fractions: hip around `0.51H`, waist `0.62H`, chest `0.75H`, shoulder `0.79H`, neck `0.835H`, head center `0.916H`.

The torso is a sequence of elliptical horizontal rings. Ring diameter values are interpolated across height with Catmull–Rom interpolation, then joined into triangles. Chest, waist, hip, shoulder width, and neck circumference modify the corresponding profile points. Arm length scales the arm segments. Inseam makes a modest, bounded adjustment to the hip line and knee placement; it does not uniquely determine leg proportions. Height scales all vertical locations and segment lengths.

For a supplied circumference `C` and fixed depth ratio `r`, the implementation solves Ramanujan's ellipse perimeter approximation for semi-major radius `a`:

```text
P ≈ π [3(a + b) − √((3a + b)(a + 3b))],  b = r a
a = C / {π [3(1 + r) − √((3 + r)(1 + 3r))]}
width = 2a,  depth = 2ra
```

The chosen ratios (for example, about 0.74 around the chest) are art-direction assumptions. They are not learned from scans or uniquely justified by the entered circumferences. The relation changes as profiles interpolate between landmark rings.

## Why this is not SMPL

The V0 mesh is a compact custom profile model and has no learned shape basis, skeletal skinning, pose blend shapes, or scan-derived population statistics. A later integration could fit a licensed SMPL-family model to measurements or image evidence. SMPL is a learned skinned vertex model with shape and pose parameters, which is substantially more useful for posing and shape variation, but fitting those latent parameters still requires a measurement-to-model method and attention to model license and distribution terms. The [SMPL project](https://smpl.is.tue.mpg.de/) and [MPI-IS publication entry](https://is.mpg.de/en/publications/smpl-2015) are starting points.

## Future input options

See [research_questions.md](research_questions.md) for comparisons of hand measurements, photogrammetry, single-view reconstruction, scanners, parametric body models, and Gaussian splatting. The recommended V1 path is to retain a measurement-first workflow and evaluate fitting those measurements to a licensed parametric body mesh before asking users for images.
