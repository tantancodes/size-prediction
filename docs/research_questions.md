# Research questions and tradeoffs

This note uses Scene2Fit's intended use—understanding garment/body fit—as the evaluation criterion. A representation that looks realistic is not automatically a good measurement surface or a usable cloth-collision mesh.

## Body acquisition approaches

| Input | Practical strengths | Fit-specific limitations | V0/V1 view |
|---|---|---|---|
| User-entered measurements | Cheap, easy to run locally, high user control, no image capture; useful now for circumference-based ease | Tape placement and tension vary; a few circumferences leave most shape ambiguous; no pose or asymmetry data | Best V0 foundation. Document a measurement guide, units, valid ranges, and uncertainty. |
| Multi-view photographs | More views constrain occluded sides and proportions; can estimate camera scale and body shape; fits a future guided capture flow | Requires consistent pose, image quality, calibrated scale, privacy safeguards, and stable capture; garment folds and occlusion hide the body; human movement complicates classic SfM | Promising research direction. Start with a controlled, stationary capture protocol and evaluate measurement error against a scan reference. |
| Single-image body reconstruction | Lowest capture burden; pretrained systems can return a plausible clothed surface quickly | Depth, scale, hidden body, pose, and garment shape are underdetermined from one image. A plausible textured avatar may hallucinate the back and is not a reliable anthropometric surface | Useful for visual avatar preview experiments, not fit recommendations without calibration and validated error bounds. HMR-style systems often infer parameters of a prior body model. |
| Dedicated 3D scanning | Better surface coverage and metric shape when calibrated; strong reference for fit-validation ground truth | Hardware, operator, calibration, capture pose, hair/occlusion, body motion, and limited accessibility; a scan through clothing still cannot reveal the body under clothing | Valuable for a research validation set or partner studio; likely excessive as the first consumer workflow. |
| Parametric body model | Compact, riggable, smooth, compatible with rendering and controlled variation; shape parameters can be fit to measurements or images | A prior cannot represent every individual; fitting is an inverse problem; model licensing and data terms matter; garment ease alone does not provide the latent coefficients | Strong V1 avatar substrate. Compare fitted SMPL-family meshes against measured scans before exposing scan-derived fit claims. |

### Photogrammetry and your Metashape experience

Agisoft Metashape uses image alignment to estimate camera poses and tie points, then dense matching to build a denser surface. Your Metashape experience transfers directly to capture planning, image overlap, focus/exposure consistency, camera alignment diagnostics, and mesh cleanup. The [Metashape 2.3 manual](https://www.agisoft.com/pdf/metashape_2_3_en.pdf) describes the image-alignment and dense matching pipeline.

A person creates extra constraints: they must hold still while views are captured; arms must leave enough silhouette separation; clothing and hair can hide shape; and the surface is the *clothed* person. A normal walk-around capture can introduce body movement between frames, so it does not behave exactly like a rigid tabletop object. A synchronized camera rig or multi-view video reconstruction method can reduce viewpoint timing inconsistency, but adds capture and calibration complexity. Start with a stationary pose, diffuse light, a measured scale reference, snug non-patterned clothing, and a scan or tape-measure comparison. Treat 3D surface reconstruction and the body underneath clothing as separate tasks.

### SMPL, monocular methods, and Gaussian splatting

The [SMPL model paper](https://files.is.tue.mpg.de/black/papers/SMPL2015.pdf) describes a learned skinned body mesh with shape and pose parameters. [Human Mesh Recovery](https://openaccess.thecvf.com/content_cvpr_2018/papers/Kanazawa_End-to-End_Recovery_of_CVPR_2018_paper.pdf) demonstrates estimating body model parameters from a single RGB image. [PIFu](https://openaccess.thecvf.com/content_ICCV_2019/papers/Saito_PIFu_Pixel-Aligned_Implicit_Function_for_High-Resolution_Clothed_Human_Digitization_ICCV_2019_paper.pdf) instead targets high-resolution clothed-human surfaces from image evidence. They answer different goals: a stable, controllable body prior versus a detailed outside surface.

3D Gaussian Splatting is a real-time novel-view rendering representation ([original paper](https://doi.org/10.1145/3592433)). It may be useful for a visually rich scan viewer, but a collection of radiance-oriented Gaussians is not automatically a clean, watertight, riggable body mesh with anatomical landmarks or robust cloth collision. If explored, keep it as a rendering layer or investigate mesh extraction separately; do not equate view synthesis quality with fit geometry.

## Cloth and garment interaction

| Approach | Where it helps | Tradeoffs |
|---|---|---|
| Blender cloth | Local offline experiments with mesh cloth and collision objects; useful for learning setup, pinning, collision, and baking | The official manual calls cloth CPU-intensive; Blender is a general DCC, not a garment chart or measurement engine. Excellent for a controlled prototype, not automatically a web runtime. |
| Position-based dynamics (PBD) | A practical route to interactive constraint-based cloth; handles collision constraints robustly and is controllable | Results can be stable and fast while only approximately matching physical material behavior. The original [PBD paper](https://diglib.eg.org/items/deb0a7a1-2ddf-496f-889a-fe0df1feeb73) includes a real-time cloth simulator. |
| Finite element methods | More direct route to material response for stretch, shear, and bending, if material parameters and numerical setup are sound | Harder to implement and calibrate; nonlinear behavior, self-contact, friction, and large deformation increase compute and solver complexity. A research paper or mature solver is preferable to building from scratch. |
| Differentiable simulation | Could optimize material/shape parameters against observed drape or measured outcomes | Differentiation through contact, friction, and changing collision state is challenging. It complements a simulation; it does not supply correct garment patterns or labels by itself. |
| NVIDIA Warp | Low-level Python framework for custom geometry, simulation, and differentiable kernels; current documentation says it can run on CPU and the Apple Silicon macOS wheel is CPU-only | It is not a drop-in sewn-garment simulator; performance on a MacBook Air should be profiled. The CPU route avoids requiring NVIDIA hardware but is not a promise of real-time interactive fitting. See [Warp documentation](https://nvidia.github.io/warp/stable/index.html). |
| CLO / Marvelous Designer | Existing garment-oriented pattern, sewing, fabric, and simulation workflows; useful to author and validate actual virtual garments before building an in-house solver | Commercial products and export/runtime licensing need review. Materials must be measured or selected carefully; a rendered garment asset without construction metadata may not be reusable for fitting. See [CLO](https://www.clo3d.com/en/product/clo) and [Marvelous Designer manuals](https://www.marvelousdesigner.com/manuals). |

Blender's [cloth workflow documentation](https://docs.blender.org/manual/en/latest/physics/cloth/introduction.html) describes a mesh cloth object interacting with collision objects and notes CPU cost. A practical student path is: make and sew one simple top pattern in CLO/Marvelous Designer or a 2D pattern tool, run a static drape study on a fixed avatar, export the simulated result, and compare body/garment circumferences and surface intersections. Do not start by writing a complete solver.

## Product garment data

Safe V0 inputs are user-provided measurements or a dataset with clear terms. For online product data, prefer a retailer API, licensed product feed, official size guide, or permission from a brand. Preserve provenance and the distinction between body-size recommendations and finished garment measurements. A 3D asset can be optimized for appearance rather than fit and may omit internal panel seams, physical fabric properties, or correct grading; request construction and measurement metadata before relying on it. Do not scrape stores or invent retailer values.

## Machine learning opportunities

| Problem | Geometry / rules sufficient? | Data needed before ML is meaningful |
|---|---|---|
| Circumference ease and chart comparison | Yes. Subtraction, interval rules, and ranking are deterministic. | None to compute it; validation is needed to select useful thresholds. |
| Size recommendation | Start with rules and fit-preference controls. ML can learn brand- and preference-specific patterns later. | Consented fit outcomes by person, brand/style/size, body + finished garment measures, material, and preference; hold out people and garment styles during evaluation. |
| Body measurements from photos | Geometry and calibration baselines should be compared first. ML may help locate landmarks or regress obscured measures. | Paired, standardized photos and trustworthy tape/scan labels across body shapes, poses, clothing, cameras, and lighting; independent subject-level validation. |
| Garment deformation | Pattern mechanics and cloth solvers give interpretable baselines. ML may learn residual deformation or fast surrogates of a calibrated solver. | Pattern topology, fabric properties, body surface, pose, and paired simulation or scanned drape observations. |
| Fabric behavior | Use measured textile parameters and a physical model first. ML can infer latent parameters or approximate a costly solver. | Fabric swatch measurements and drape/force data, not aesthetic labels alone. |
| Personalization from feedback | Simple preference learning may suffice. | Repeated, consented feedback connected to the exact garment, size, measurement protocol, and outcome. |

Do not train on fabricated outcomes. Split by person and garment, report measurement error and fit-class calibration, evaluate across demographic and body-shape groups, and avoid treating return history as a clean ground truth (returns have many causes besides fit). Body measurements and scans are sensitive personal data; minimize retention and obtain informed consent.

## Research question to answer first

**Given a person's tape measurements, a garment's finished measurements, and a controlled static pose, how well do circumference-ease bands agree with structured wearer feedback across garment categories?**

Start with a single garment block and several sample sizes. Record exact measurement protocol, finished garment measurements, fabric composition/weight/stretch, wearer feedback by region, and uncertainty. That isolates the ease model before adding image-derived body shape or dynamic cloth physics.
