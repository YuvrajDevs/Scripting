# Low-Poly Cinematic: style reference

Use this when the user says **"create in low poly"** (or "low-poly style", "the dino style").
The reference build is `dino-supermarket/`: copy its structure, helpers and settings, and don't start from scratch.
The look was matched to the user's reference reel: Instagram AI-animation montages with low-poly faceted subjects, painted anime skies, a glowing night city and hard cuts.

---

## 1. Look in one line
Flat-shaded faceted 3D shapes (every polygon face carries its own tone), set against bold painted anime cumulus skies, or glowing warm-gold night cities. The colours are saturated but clean, the motion is slow and cinematic, and there are hard cuts about every 2 seconds.

## 2. Format and timing
- **Size:** 1280×960 (4:3, like the reference). For a reel use 1080×1920 with the same grammar.
- **Frame rate:** **25fps** (the user asked for 25 for this style). Use `--fps 25` when rendering.
- **Shot rhythm:** hard cuts, about 1.8–2.1s per shot. There are no transitions, fades or text.
- **Shot grammar** (from the reference's first 5s):
  1. **A still medium shot.** The subject barely moves, with micro-motion only (a blink, a thud, a shake).
  2. **A dramatic low-angle hero shot.** The subject is huge and on a diagonal against the sky. Small things cross the sky with white trails. The camera drifts slowly and rolls slightly (about −0.13 rad).
  3. **A wide establishing aerial at night.** It's a city with a river and glowing roads, with a slow push-in.
- **What's left out:** the user doesn't want subtitles, watermarks or voiceover in the video.

## 3. Materials and shading (the core of the look)
- Everything uses `MeshStandardMaterial({ flatShading: true, roughness ≈ .75–.85, metalness 0 })`.
  - Metal objects use `metalness .3–.55, roughness .4`.
- **Organic shapes** (animals, characters) are built with the `loft()` helper.
  - Each one is a run of oval cross-sections (7–10 sides) along a spine, with about 6% random vertex jitter.
  - The result is crisp facets that read as low-poly, never smooth.
- **Per-face colour** comes from `faceColored()`, where each triangle picks its tone from its normal:
  - Faces pointing up get the dark **back** colour.
  - Faces pointing sideways get the **mid** colour.
  - Faces pointing down get the light **belly** colour.
  - Each face also gets a random ±7% brightness variation, which gives the "painted facet" look.
  - Optional stripes come from `sin(z)`.
- **Large deforming sheets** (the dented gate) need **smooth shading** (`flatShading: false` with `computeVertexNormals`). Flat shading on tiny moving triangles gives blocky dark noise in SwiftShader.
- **Hard objects** (buildings, crates, cans) are plain boxes, cylinders with 4–8 sides, and dodecahedrons.
- **Signs and glass** use canvas textures drawn in code (bold DejaVu Sans, red on cream, posters reading SALE or FRESH). Set `emissiveIntensity` to about .1 by day and 1.6 at night.

### Palette that worked
| Use | Colours |
|---|---|
| Dino back / mid / belly / stripe | `#263f36` `#47654a` `#c9b384` `#1b2d27` |
| Eyes | `#ffb52e`, emissive `#ff9a1a` at about 2.2 (blooms a little) |
| Mouth / tongue / teeth | `#6a1b26` `#a8424f` `#f1e9d2` |
| Store facade / trim / green band | `#eadcc0` `#d2c09e` `#2e8a57` |
| Steel | `#9aa6b4` |
| Day sky gradient (top to bottom) | `#1847a6` `#2c69cc` `#6aa0e4` `#b6d2f2` |
| Cloud shadow / mid / lit / highlight | `#a7bde4` `#d0def4` `#f7faff` `#ffffff` |
| Night sky | `#040817` `#0b1533` `#1b2550` `#3a3456` |
| Night roads / lights | fill `#35200f`–`#5c3418`, lines `#ffc070`, lamp dots `#ffe0a0` |
| Windows | warm `#ffcf86` `#ffe3ab`, cool `#9fd6ff`, wall `#121828` |
| Product colours | `#e94b3c` `#f2b134` `#2f9e64` `#3a7bd5` `#f5f0e6` `#c0397a` `#ff7f2a` |

## 4. Skies (painted on a 2D canvas, used as `scene.background`)
- **Day:**
  - A vertical blue gradient, with a few thin white streaks for high cloud.
  - **Anime cumulus** come from `cloud()`. Circles are laid along a flat base, the middle ones bigger, with extra puffs on top.
  - The cloud is filled in the shadow colour first. **Three lit layers** are then drawn as unions (one canvas per layer, offset up-left by 0.07, 0.15 and 0.2 of the radius), clipped to the cloud with `source-atop`.
  - A soft blue gradient sits along the bottom of each cloud.
  - **Don't** draw separate shading circles inside, because that makes "soap bubble" outlines.
- **Drift:** set `texture.repeat ≈ .86` and animate `texture.offset` slowly, for a parallax feel when the camera moves.
- **Night:** a navy gradient, a few faint stars and a dusky glow at the horizon. Add `FogExp2('#0e1634', .0009)`.

## 5. Lighting
- **Day:**
  - Hemisphere light `#c3d9ff` / `#9a8a70` at 1.15, and a warm sun `#fff0d6` at 3.1 from the upper right-front.
  - PCF soft shadows with a 2048 map. Set the shadow camera to about ±16 and `normalBias .03`.
  - **Don't** let a deforming mesh receive its own shadow, because it causes acne.
- **Night:**
  - Hemisphere light `#3b4c86` / `#1a1008` at .45 and a faint blue moon light at .35.
  - Use no more than 3 PointLights in total (warm streetlamp, red sign spill, warm gate spill), with intensities of about 400–2600 and decay 2.
  - The city ground uses `MeshBasicMaterial`, so it's unlit and cheap.
- **Tone mapping:** ACES Filmic, exposure about 1.0.

## 6. Post-processing (EffectComposer, MSAA ×4, HalfFloat target)
`RenderPass → UnrealBloom → grade ShaderPass → OutputPass`

| Setting | Day | Night |
|---|---|---|
| Bloom strength / threshold / radius | .22–.32 / .82–.9 / .4–.45 | .7 / .62 / .5 |
| Saturation | 1.08–1.1 | 1.12 |
| Vignette | .5–.55 | .6 |
| Shadow lift (blue) | (0, .004, .012) | (0, .006, .02) |

- **Bloom levels:** too much night bloom turns everything to yellow mush, and a bloom strength above 1 is too much.
- **Bright light points:** use `MeshBasicMaterial` with `Color` values above 1 (for example `Color(5, .45, .4)` for red rooftop lights) so they bloom.

## 7. Motion language
- **Everything is a pure function of `t`:** the page exposes `window.render(t)`, `window.DUR` and `window.READY`. Use the seeded `mulberry()` and never `Math.random`.
- **Impacts:**
  - A spring dent (`A·(1 − e^{−14τ}·cos 26τ)`), a ripple ring and camera shake (`Σ A·e^{−7τ}·sin 47τ`).
  - Grit falls from above, and nearby props jolt.
- **Debris:**
  - Closed-form ballistics, `p0 + v·τ + ½gτ²`, with **slow motion** `τ = (t − tBreak)·0.55`.
  - Pieces are bent steel planes, coloured product boxes, cans, glass shards (transparent, slightly emissive) and plaster chunks.
  - Send them **up and away from the camera side**. Flying toward the lens hides the subject.
- **Contrails:** camera-facing ribbon strips sampled along each path, white with alpha fading to zero. They're the sky-crossing jet trails in the reference.
- **Dust:** soft radial sprites, **low and faint** (opacity about .16), because big ones wash out the frame.
- **Creatures:**
  - Hinged jaw (opens about 0.66 rad), head pitch up on a roar, and a small tremble (`sin(61t)·.015`).
  - Arms flail a little, and the body bobs slightly.
- **Hero camera:** aim it every frame at the subject's world position (`head.localToWorld`), placed low and to the side, so the subject stays big.

## 8. Night city recipe
- **Ground:** a 4096² canvas covering 2000m.
  - Orange glowing roads on a grid (60m pitch, 14m wide, with every third one a 22m avenue), plus two glowing curved Bézier expressways.
  - A river band with streaky reflections and lit embankments, and pools of lamp light.
- **Buildings:**
  - Merged box geometry using 3 window textures (512², 16×16 windows), with `emissiveIntensity` about .85.
  - UVs are scaled to metres so windows don't stretch, and roofs point at a dark texel.
  - Most heights are low (`9 + r³·40`). Only about 9% are towers of 70–180m, and some get a stepped top section.
- **Landmarks:** a cluster of tapered 4-sided towers with thin cyan edge lines and spires, and one TV tower with dim pink spheres.
- **Lights:** red rooftop lights only on buildings over 60m. Cars are 520 instanced glowing boxes moving along the roads.
- **Keep the subject visible:** cap building heights along the sight line from the camera to the subject, and leave an open plaza in front of it. Scale the subject up (×3–4) in aerial shots so it reads.

## 9. Pipeline
```bash
# project = folder with index.html (importmap → ./vendor/three.module.js, r170) + main.js
cp -r dino-supermarket/vendor <new>/          # three + postprocessing + BufferGeometryUtils
cd /home/user/lemomo-ai/lemo-opuscar
node core/render/still.mjs /home/user/Scripting/<new> 2.3 --size 1280x960 --out <scratch>   # test stills
node core/render/video.mjs /home/user/Scripting/<new> --fps 25 --size 1280x960 --workers 4 --out /home/user/Scripting/<new>/<name>.mp4
```
- **Speed:** SwiftShader renders about 1–3s per frame, so 125 frames take about 1.5 min with 4 workers.
- **Review:** make a contact sheet, with `ffmpeg -vf "fps=5,scale=320:-1,tile=5x5"` or PIL.
- **Debug switches:** use query flags (for example `?nodust=1`) to hide layers while framing.

## 10. Pitfalls already hit
- **GLSL reserved words:** don't use names like `half`, `input` or `output` as variables.
- **Dust and debris:** these are the main way a shot gets ruined. Keep them away from the lens and keep the subject unobstructed.
- **Deforming meshes:** use smooth shading and no self-shadow.
- **Aerial occlusion:** check that the subject is actually on screen. Project its position, or crop the still around where it should be.
- **Night bloom:** keep it under control (strength .7, threshold .6).
- **Large builds:** for 30s, keep models in their own files and one file per shot, and build in batches of 3–4 shots with a contact sheet after each.
