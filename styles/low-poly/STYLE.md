# Low-Poly Illustration: the reference art style

Use this when the user says **"create in low poly"**.
This guide describes **the look of the user's reference reel**: an Instagram montage, 1280×960, about 18s, with 14 scenes cut roughly every 1.5–2s. It's the target to recreate. My first attempt at it (`dino-supermarket/`) is covered in the appendix as a starting toolkit, not as the definition of the style.

---

## 1. What the style is
**Faceted vector painting.** Each image is a cinematic digital illustration in which every surface is broken into **flat, angular polygon planes**, like a low-poly 3D model that has been **painted** rather than rendered.
- The planes are mostly flat colour, but many carry a **very soft gradient inside the facet**, which is what keeps it from looking like raw untextured 3D.
- Edges are **clean and sharp between facets**, with **no black outlines**. Forms are defined only by changes in value and hue from one facet to the next.
- The overall finish is smooth, polished and slightly soft. It's like a premium editorial illustration or poster, not a video-game screenshot.
- Detail is **simplified, not crude**:
  - Faces keep their likeness through a handful of planes (brow, cheekbone, nose bridge, jaw).
  - Hands and fabric folds are built from big angular shapes.
  - Small things such as text on jerseys or flags stay crisp and readable.

## 2. Colour and light
- **Rich, saturated, cinematic palettes, with one dominant temperature per scene:**
  - **Day sky:** deep cobalt blue (`#1a4aa8` to `#3c78d6`) with bright white clouds.
  - **Golden hour:** orange-red sky (`#e8642c` to `#ffb050`), mountains in layered purple-brown silhouettes, and figures in olive-green shadow.
  - **Night city:** navy-black (`#050a1c`), with **warm gold street grids** (`#ffb050` to `#ffd890`), small cyan and blue accents on skyscrapers, and red rooftop dots.
  - **Autumn aerial:** a sea of orange and red trees (`#e0631f`, `#f2a03a`) with white and grey city blocks.
  - **Festival night:** deep red and black, glowing red lanterns, gold fireworks, warm skin tones.
  - **Indoor and portrait:** muted warm browns and wood, with a single strong colour accent (a red flag).
- **Light is directional and theatrical.** One clear key light, warm against cool, with **strong value contrast between lit and shadow facets**. Rim light is used on subjects against the sky.
- **Emissive things glow softly.** Jet exhaust, headlights, windows, lanterns and fireworks get a gentle bloom, and the glow itself is **faceted**. The jet afterburner, for example, is a fan of angular shards going from white-yellow to orange, pink and violet.
- **Shadows** are shapes, not blur: dark faceted regions, often tinted blue or purple. Reflections (a polished desk, a river) are simplified mirrored facets.

## 3. Composition and camera
- **Cinematic framing** with strong diagonals, like movie stills:
  - Low-angle hero shots (a jet seen from below against the sky; a player from behind, looking up at the hoop).
  - Over-the-shoulder shots.
  - Symmetrical portrait shots (a person at a desk with a flag and a painting behind).
  - Sweeping aerial establishing shots (a river city at night, an autumn cityscape).
  - Packed action shots (cars racing out of a track corner, a dragon dance with crowds).
- **Depth:** a big foreground subject, a midground action layer and an atmospheric background, with haze and lighter values in the distance.
- **Background detail** is dense but simplified: crowds and buildings become rows of small faceted blocks.

## 4. Motion (it's AI image-to-video)
- **Each shot is one illustration given subtle life**, not a full animation:
  - Slow camera push, drift or parallax.
  - Small subject motion: eyes opening, a mouth moving, hands shifting, a ball rising, cars edging forward, fireworks blooming, lanterns swaying.
  - Background elements cross slowly (jets with thin white contrails, drones, boats on the river).
- The pace is calm and steady even in action scenes. Motion is smooth and continuous, with **no fast cuts inside a shot**.
- **Editing:** hard cuts about every 1.5–2s, a montage of themed scenes. Sometimes a scene repeats with a small change (a player shooting from two angles, two framings of the cars).
- **Audio and text in the original:** music, a few on-screen words (subtitle, Chinese characters drawn in fireworks), and a corner watermark. **Leave out the watermark**, and leave out text unless the user asks.

## 5. Recognisable signature details
- Faceted **fire and light trails**: exhaust, contrails and headlight beams as layered translucent shards.
- **Clouds** are the one soft-edged element. They're big anime cumulus with crisp lit tops and blue-grey undersides, in contrast with everything else being angular.
- City windows are a grid of tiny warm rectangles, with a few in cool blue.
- Skin uses about 3–5 tones per face, with the planes placed like a portrait painter's block-in.
- Fabric such as suits, jerseys and flags is big planes with one or two fold facets. Flags are bright red with gold stars and simple folds.

## 6. Recreating it in code (decision guide)
| Shot type | Best tool | Why |
|---|---|---|
| Hard objects (vehicles, buildings, robots, furniture) | **Three.js, flat-shaded low-poly models** | Faceted planes come for free |
| Creatures and animals | Three.js `loft()` bodies with per-face colour | Organic but still faceted |
| Faces and close-up people | **Canvas2D painted polygons** (hand-placed facets with a soft gradient fill each) | 3D primitives look crude on faces; painted facets keep the likeness and polish |
| Skies and clouds | Canvas2D painted backdrop | The style's clouds are painted, not modelled |
| Aerial cities | Three.js (instanced or merged boxes with window textures) plus a painted glowing ground texture | Thousands of lights cheaply |
| Fire, trails, beams | Translucent faceted shards (triangle fans with gradient colours, additive blending) | Matches the faceted exhaust |

**Rules for getting closer to the reference than my first try:**
1. **Paint the facets, don't just shade them.** Give each face a slight gradient, either per-vertex colour (blend 2 tones across the triangle) or a soft light term. Plain flat faces look like a game; graded facets look like the illustration.
2. **Push value contrast and colour temperature:** warm key, cool shadow facets, and a rim light on subjects against the sky.
3. **Keep it clean.** No noise, grain or dust clutter, and no outlines.
4. **Keep each shot to one illustration:** one subject and gentle motion. Avoid busy physics.
5. **Keep detail simplified but readable:** jersey numbers, flags and signs crisp, everything else blocked in.
6. **Format:** 4:3 at 1280×960, or 9:16 for reels. **25fps** (user preference). Hard cuts about every 1.5–2s.

---

## Appendix: toolkit from my first attempt (`dino-supermarket/`)
These are reusable parts, not the definition of the style.
- **`loft()` and `faceColored()`:** faceted organic bodies with per-face tone by normal (back, mid and belly colours, ±7% random variation).
- **`cloud()`:** painted anime cumulus. A shadow body plus 3 lit union layers offset up-left, clipped with `source-atop`. Don't add inner shading circles (they look like bubbles).
- **Post-processing:** ACES tone mapping, then bloom (day .25 strength / .85 threshold; night .7 / .62), then a grade (saturation 1.1, slight blue shadow lift, vignette .5). MSAA ×4.
- **Night city:** a 4096² painted ground with glowing roads, river and expressways; merged buildings with 3 window textures; red roof lights; instanced cars; building heights capped along the camera's sight line to keep the subject visible.
- **Motion helpers:** spring dents, camera shake, slow-motion debris with white trail ribbons, a jaw and roar rig, and a camera that tracks the subject's head.
- **Pipeline:**
  - Copy `dino-supermarket/vendor/` (Three.js r170 plus post-processing).
  - Render stills with `node core/render/still.mjs <dir> <t> --size 1280x960`, and video with `node core/render/video.mjs <dir> --fps 25 --size 1280x960 --workers 4`, both from `/home/user/lemomo-ai/lemo-opuscar`.
- **Pitfalls:**
  - Dust and debris near the lens hide the subject.
  - Deforming sheets need smooth shading and no self-shadow.
  - Night bloom above about 1 strength turns to yellow mush.
  - Check that the subject in an aerial shot is actually on screen.
  - Avoid GLSL reserved words such as `half`.

---

## Cinematic golden-hour variant (approved test: `lowpoly-autumn/`)
From the user's autumn-ghost reference: warm, aesthetic, cinematic.
- **Light:**
  - A low golden sun `#ffb866` (intensity ~6), coming from behind and to the side.
  - Crisp PCF soft shadows on a 4096 map over ±11m, so leaf cards cast **dappled shadows** on the ground and bench.
  - Hemisphere light `#ffd2a0`/`#7a3626`, and warm fog `#f0a06a` (14–42m).
- **Light shafts:** additive gradient planes, cylindrically billboarded around the sun direction so they always face the camera, at opacity .13–.21.
- **Foliage:** faceted icosahedron canopies (per-face autumn colours) plus ~700 instanced leaf cards per tree, which give the shadow dapple and a painterly edge. Leaf litter is instanced on the ground.
- **Drifting leaves:** 140 instanced, closed-form looping fall with sway and spin.
- **Glossy paving:** roughness .32, metalness .15, so it picks up warm reflections.
- **Post:**
  - BokehPass depth of field on close-ups, with focus set to the subject's distance (aperture .006).
  - Bloom .55–.65, threshold .78.
  - Grade: saturation ×1.14, **split tone** (rosy shadows +(.05,−.01,.04), amber highlights +(.04,.015,−.03)), a strong vignette and fine grain.
- **Camera language:** slow, eased, smooth 25fps moves with hard cuts between shots, using three shot types:
  - A crane down through the canopy.
  - A straight-down overhead with a slow turn.
  - A low dolly-in with shallow focus.
- **Characters:** a faceted loft body with per-face colour. Keep markings small (chest bib, socks, tail tip). Add idle life: breathing, tail sway, ear twitches, a head that follows events.
- **Render:** about 7 min per 10s with depth of field. Re-encode with `-crf 20` before committing (the raw output was 87MB).
