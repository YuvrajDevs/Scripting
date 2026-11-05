# PS2 style

When the user says **"create in PS2"** (or "PS2 style"), this is what they mean.
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
