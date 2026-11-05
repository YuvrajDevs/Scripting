# PS2 style

When the user says **"create in PS2"**, this is what they mean. **Current target (latest references, supersedes the smear look below):**

## Current look: crisp console render with dither (7-Eleven night street and rainy-window cat references)
- **Crisp, readable detail:** sharp textures (signs, text, brick, wood grain, a payphone) and clear shapes. **No oil smear.**
- **Low-res console pixels:**
  - Render at **270×480** (a quarter of 1080×1920) with no antialiasing.
  - Upscale with **hard nearest-neighbour pixels**, so edges stair-step but stay sharp.
- **Ordered (Bayer 4×4) dithering into 5-bit colour (31 levels).** Gradients and shading show the classic PS1/PS2 dither pattern and slight banding.
- **Light:** warm practical lights (shop fronts, lamps, windows) with a gentle glow (bright pass above .7, small radius, ×.8), plus a mild vignette.
- **Motion:** smooth and continuous (30fps references). Slow, steady camera moves; characters animate every frame.
- **Dreamcore variant** (the user's hill picture): pale azure sky gradient, yellow-lime grass, white houses with orange roofs, soft sun from the front-left, neutral tone mapping (`THREE.NeutralToneMapping`) so the colours stay true.
- **Build:** `ps2-door/` (FPV: door opens onto the dreamcore hill, 10s). Its output shader is the reference implementation.
- **Tileable noise textures:** use a periodic lattice (lattice size must be at least period × 2^octaves, so N = 1024) and `f *= 2` per octave, so repeats have no seams.

---

## Earlier look (first references: wizard and genie): smeared and unclear
**References:** two Instagram reels by @gabrielbeniciobh (a wizard on a snowy peak, and a genie in a cave). Both are 720×1280 at **12fps**.
**First build:** `ps2-wizard/` (5s, a wizard running funny through a forest). Start from it.

## The look
- **Old-console 3D:** simple, smooth-shaded models with very few polygons.
  - **Characters are mannequins:** faceless egg heads, with a single warm-lit plane on the upper face.
  - **Costumes are big, readable shapes:** a huge floppy witch hat, a robe, a scarf, a strap, white gloves, a staff, a backpack.
  - **Materials are matte**, with flat colours or soft noisy textures and no fine detail.
- **"Unclear", low quality, dreamlike:**
  - The frame is rendered at **low resolution** and smeared by an **oil-paint (Kuwahara-like) filter**. Surfaces turn into soft blotches, edges get blobby and stair-stepped, and fine texture dissolves into patches.
  - The colour is slightly crushed and posterized, with a mild vignette.
  - It looks like an upscaled, filtered PS2 capture: soft, smeary and a little chunky. It's never crisp.
- **Lighting:**
  - Bright, natural daylight with a strong warm sun on the character (front or side-lit, never a silhouette).
  - Big soft skies with photo-like clouds, a sun glare, fog and haze in the distance.
  - Night or cave scenes are lit by warm flickering torches.
- **Atmosphere:** drifting particles (snow, dust, pollen) and sun shafts. They add a dreamy, quiet feel.
- **Motion:**
  - **12fps-style motion.** For our 25fps videos, step the animation at 12.5fps (`tq = floor(t*12.5)/12.5`).
  - **Floaty, game-like animation:** exaggerated idles, gestures and goofy runs, with a hat that lags and flops.
  - **Handheld camera:** slow drift, small shakes and a slight roll, often low and close on the character.
- **Text in the references:** white bold sans with a dark shadow or outline, typed on word by word. Comment bubbles from viewers sometimes appear. Use text only when the user asks for it.

## How to build it (`ps2-wizard/main.js`)
1. **3D scene** in Three.js r170 (vendor in the folder): `MeshStandardMaterial` with roughness .9, smooth shading, canvas blotch textures, `Fog`, hemisphere light plus a warm directional sun **in front of the subject**, basic PCF shadows.
2. **Render small:** use a 360×640 render target with **nearest filtering and no antialiasing**.
3. **Kuwahara pass** at 360×640: a 4-quadrant mean/variance filter with radius 4 (25 samples per quadrant). It picks the quadrant mean with the lowest variance. This makes the oil smear.
4. **Output pass** to 1080×1920:
   - Sample part-way between nearest and linear (`snap = (floor(p)+.5+(fract(p)-.5)*.55)/res`), so edges are soft but stepped.
   - Light posterize (26 levels), saturation ×1.12, contrast ×1.06, and a vignette.
5. **Render:** `node core/render/video.mjs <dir> --fps 25 --size 1080x1920`. 5s takes about 30s.

## Lessons from the first build
- A sun behind the character turns him into a black silhouette. Keep the sun in front or to the side.
- Particles that pass close to the camera become giant white squares. Spawn them at least 3m away.
- Light-shaft planes near the lens look like white boxes. Keep them deep in the background.
- **Second pass (done):**
  - Photo-like sky from fbm value noise (cumulus with lit tops and blue-grey undersides).
  - An additive sun-glare sprite in the sky.
  - Soft round particles (`frustumCulled=false`, round texture, size .11).
  - Kuwahara radius 5 (36 samples per quadrant).
  - Brighter fill light (hemisphere 1.9, exposure 1.25) and a warm yellow upper-face plane.

## Third pass: matching the reference character (approved direction)
- **Motion is smooth, not stepped.** The references are 12fps, but the animation curves are fluid and mocap-like. Animate continuously at 25fps.
- **Run cycle:**
  - 1.55 strides per second; hip swing ±.95 rad; knee bend `max(0, sin(ph+.9))·1.6`.
  - Torso counter-twist, a small body bob and a gentle side wobble.
  - One loose flapping arm (funny), and the staff arm pumping stiffly.
  - Hat sections follow a beat late (phase lag .5, .8, 1.3, 1.8).
- **Character build (smooth lathes, few polygons):**
  - Long coat in two lathes (torso, plus a flaring skirt to below the knee) in dusty mauve `#9a7082`.
  - Thick olive trim tubes `#7c6c4a` down both front edges, a purple tunic strip `#6c3f6c`, and a fat plum cowl torus `#8a4f86`.
  - Tapered sleeves, fur cuffs (white torus), puffy white glove spheres, baggy trousers `#5c4058` and capsule boots.
  - Thick wooden staff with a knob, and a bulky pack.
- **Head:**
  - A **faceted** icosahedron (flat shaded) in grey-blue, with **warm `#e3b25a` facets** on the sun-facing front.
  - A slight emissive glow so it reads under the brim.
- **Hat:**
  - A big **sagging circular brim** (edges droop −.16, with a soft wave).
  - A tall cone in three smooth jointed lathe sections that bend back. It's tilted back so the face shows.
  - The brim doesn't cast shadows (otherwise the face goes black).
- **World textures:** fbm noise ramps (grass, path, bark, leaves) instead of blotches. They smear into a believable, photo-ish mush. Canopies don't cast shadows, so the character stays sunlit.

## Photo-real environments (fourth pass, current)
- **Use real photographic HDRIs.** The reference worlds are photo-real, and procedural scenery never gets there.
  - Source: the npm package `@pmndrs/assets` (CC0 Poly Haven HDRIs, about 1k), reachable through the npm registry. Asset sites like polyhaven.com and ambientcg are blocked here.
  - Extract with `npm pack @pmndrs/assets`, then base64-decode `hdri/<name>.exr.js` into `assets/<name>.exr`.
  - Available: apartment, bridge, city, dawn, esplanade, **forest**, hall, lab, lobby, night, **park**, **sky**, studio, sunrise, sunset, venice, warehouse, workshop.
- **Setup:**
  - Load with `EXRLoader` (needs `libs/fflate.module.js`).
  - Use `GroundedSkybox(hdr, height 2.2, radius 90)` so the photo becomes ground you can run on.
  - Set `scene.environment = hdr` for image-based lighting, and rotate both together (`sky.rotation.y` and `scene.environmentRotation.y`) to face the sunlit side. For `forest`, that's 1.57.
  - Add a `ShadowMaterial` plane so the character casts onto the photo, plus a warm key light and exposure of about 1.55.
- **Why it works:** the HDRI's low resolution plus the Kuwahara smear produces exactly the reference's soft, unclear, photo-ish mush.
- **Limits:**
  - The projected ground stretches if the camera travels far (more than about 10m). Keep moves short, or let the smear hide it.
  - The HDRI is a single location, so you can't travel through it; it's one place per shot.
