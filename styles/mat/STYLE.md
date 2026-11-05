# Mat style

When the user says **"create in mat style"**, this is what they mean.
**Reference build:** `ramen-lowpoly/` (8s cooking ramen, approved). Copy it and change the props and beats; don't start from scratch.

## What it is
- **The format:** the Zomato-style video format (see `styles/flat-on-photo/STYLE.md`).
  - **The user's flat table photo is the background, untouched.** By default that's the green cutting mat, `ramen-lowpoly/bg.jpg`; use any new photo the user gives instead.
  - Objects are placed on the table and animated, with short kinetic words at the top pacing the beats.
- **The items:** made in the **low-poly art style** (see `styles/low-poly/STYLE.md`).
  - Faceted, flat-shaded 3D models built in Three.js with high detail and great attention to detail. They are not flat halftone cutouts.
- **View:** **top-down** (the camera looks straight down on the flat table). Light perspective shows rims and sides.

## Format
- **Size:** 1080×1920 (9:16).
- **Frame rates:**
  - The **video is 25fps**.
  - **Item animation is stepped at 12.5fps** (each pose held for 2 frames: `tq = floor(t*12.5)/12.5`), for a hand-animated feel.
  - **Words animate smoothly** at 25fps.
- **Pace:** slow, about 2–2.5s per beat, with no hard cuts. Items glide in from the right (1.1s ease-out) and leave to the left (0.8s ease-in).
- **Sound:** none. The voiceover is added later, so words pace the beats until it exists.

## How it's built (`ramen-lowpoly/main.js`)
- **Layers:**
  - A transparent Three.js renderer (`alpha:true`, clear alpha 0) draws only the props.
  - A 2D canvas draws the photo (cover-fit, `drawImage(bg,0,-7,1080,1934)`), then the 3D layer, then the words.
- **Camera:** perspective, `fov 41.6`, at height 1m looking down, with `up = (0,0,-1)`. The frame covers about 0.43m of table, so props are at **real scale** (a pot about 0.22m, a bowl about 0.2m).
- **Shadows on the photo:**
  - An invisible table plane uses `ShadowMaterial({ color: <dark tint of the surface>, opacity .55 })`.
  - The key light comes from the upper left (`DirectionalLight(-.55,1.5,-.6)`), with PCF soft shadows on a 1536 map.
- **Light that keeps colours rich:**
  - ACES exposure .82, RoomEnvironment PMREM at intensity .25, hemisphere light `#fff6e6`/`#3d6b4c` at .5, key light 2.3.
  - More light than this washes everything out to white.
- **Models:**
  - Lathe profiles with 14–20 segments (pots, bowls).
  - Per-face painted colours via `paint()` (for example, glazed outside versus cream inside).
  - Faceted tubes for noodles, low-segment cylinders, tori and icospheres for toppings.
  - Faceted translucent steam puffs (opacity about .16).
  - Bubbles and splash droplets.
- **Motion:**
  - Items land by **dropping from height** (real 3D, so they shrink and their shadow tightens and sharpens), with a small bounce.
  - Liquids ripple through vertex animation.
  - Things soften as they cook (a block flattens and spreads).
- **Words:**
  - **Font:** **Poppins Bold (700)**. It's in `ramen-lowpoly/fonts/` (woff2 from the npm package `@fontsource/poppins`, because the font CDNs are blocked). Load it with `FontFace` before setting `READY`.
  - **No outline or border.** Use only a **very slight soft shadow**: `shadowColor rgba(0,20,10,.28)`, `shadowBlur = size*.12`, `shadowOffsetY = size*.03`.
  - **Colours:** white, with cream `#fff2a8` for the key word.
  - **Animation:** words pop in one by one (rise, fade and a slight scale overshoot). They sit at the top of the frame, clear of the props.

## Render
```bash
cd /home/user/lemomo-ai/lemo-opuscar
node core/render/still.mjs /home/user/Scripting/<dir> <t> --size 1080x1920 --out <scratch>
node core/render/video.mjs /home/user/Scripting/<dir> --fps 25 --size 1080x1920 --workers 4 --out /home/user/Scripting/<dir>/<name>.mp4
```
- About 0.5s per frame. 8s takes about 1.5 minutes.
- Check a few stills (contact sheet) before rendering the full video.
