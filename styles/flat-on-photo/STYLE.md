# Flat Illustration on a Photo: the "Zomato" style

Use this when the user gives **a photo background (usually a flat table or surface)** and asks to "create on this", or mentions **the Zomato style**.
Reference reel: Instagram, by arundhati_bose (a Zomato/Domino's paid partnership). It's a talking-voice reel with illustrated props that pop, drop and slide in time with what's said.
The final version the user approved is `reel-zomato-mat/`, which has flat-lay props on a green cutting-mat photo at 25fps.

---

## 1. The workflow the user wants
1. **The user's photo is the background, untouched.** Don't repaint, crop creatively, colour-grade, blur or zoom it. Cover-fit it to the frame, and keep it static unless the user asks for camera motion.
2. **Only the props and text move.** Everything illustrated sits on the photo's surface as if it were really there.
3. **Read the surface before placing anything:**
   - **Flat, top-down table** (cutting mat, desk shot from above): props are **flat-lay**.
     - Draw them top-down (bowl, plate and pizza as circles from above), or as **paper cutouts lying flat** (a bag or fridge drawn front-on but lying on the table).
     - There's no perspective tilt.
   - **Angled table photo** (laptop deck, café table): props stand on the surface and follow its slope.
     - Base points go along the surface's edge line, and props get smaller as they move away.
     - Shadows are skewed onto the plane.
   - The user's latest preference is **flat**: "Keep it flat, see this is flat table".
4. **Pace:** slow and calm, with each beat held about 2.5s. **25fps** ("Keep 25 fps for each").
5. **Voiceover comes later.** For now the on-screen words pace the beats, and they get retimed to the voiceover once it's recorded.
6. **Size:** 1080×1920 (9:16 reel).

## 2. The illustration style (from the reference reel)
- **Flat colour fills with halftone-dot texture.** Each shape is a solid colour with a regular dot pattern a shade darker. A **shadow band of bigger dots** sits on one side, giving cheap shading without gradients.
- **Thin hand-inked outlines** in near-black (`#16201c`), about 4–5px with rounded joins, on every shape.
- **A bold, limited palette:**
  - Orange `#f2902a`, tomato red `#e23b2e` / `#e8323c`, cobalt blue `#2a3fdc`, leaf green `#4caf50` / `#7cc24a`.
  - Mustard `#e2a62a`, cream `#f7f3ea`, steel grey `#c8d0da`.
- **Small white highlight strokes** (curved lines at 35–50% opacity) on the lit side of round things: tomatoes, bowls, the cloche.
- **The subjects are everyday objects drawn simply but with care:**
  - A delivery bag with groceries peeking out (baguette, leek, tomato), a stitched flap and a barcode tag.
  - A retro fridge with freezer, shelves and stocked items.
  - A bowl with speckles, sliced onion rings, tomatoes with leafy stems, and a plate with pizza (crust bumps, cheese blobs, pepperoni with shine, basil).
  - A silver cloche.
- **Text:**
  - Bold rounded sans (the real reel uses hand lettering).
  - White or lime/cream, with a **dark outline in the background's colour** (on a green mat, a dark green `rgba(6,38,24,.9)` stroke) and an offset drop shadow.
  - Brand words or key numbers get a red shadow (`zomato`, `60%`).
  - Words appear **one by one**, in time with speech.
- The reference reel's own backgrounds (black grid, cream dotted grid, mustard texture) are replaced by **the user's photo** in this workflow.

## 3. Motion language ("cutout" animation)
- **Word reveal:** each word rises about 30px, fades in and scales from .9 to 1 with a soft overshoot, over 0.55s. On exit it fades and lifts slightly.
- **Props enter by gliding in** from the right over about 1.15s with an ease-out, hold, then **exit left** with an ease-in over about 0.9s. There are no hard cuts.
- **Lowering onto a flat table (top-down):** the prop starts about 45% bigger and shrinks to its size over about 0.85s. Its shadow **tightens, sharpens and darkens** as it lands, which is the height cue.
- **Dropping into a bowl:** each item shrinks from about 1.9× into its spot, then gets a small squash pulse and a ripple ring on landing.
- **Reveals:** a cloche lifts toward the camera (grows, its shadow moves away and softens), slides off, and the pizza pops in underneath.
- **Life while holding:**
  - A gentle sway (±0.01 rad sine).
  - A "boil" jitter, quantised to 6fps (±0.006 rad), for the hand-made cutout feel.
  - Steam wisps where relevant.
- **Light interactions:** an opened fridge spills light onto the surface, and a landing bag kicks up a dust puff (on angled tables).

## 4. Sitting props into the photo (the important part)
- **Shadows:**
  - Use `multiply` blending in a tint taken from the surface (dark green on a green mat, cool grey on a silver laptop, dark red in red light).
  - Offset down-right like paper on a table: about (14, 18)px at rest, growing with height.
  - Blur about 3px on the ground, up to about 17px when lifted.
- **Tone-matching:** draw all props on their own layer, then:
  - On neutral photos, apply `saturate(.95–.97) brightness(.95–.97)`.
  - In strongly coloured light, add a `source-atop` colour wash on the prop layer only (for example `rgba(255,110,100,.2)` in red light).
- **Placement:**
  - Find the photo's clear surface area.
  - Put text over empty or low-detail regions (a wall, sky, an empty band of the mat) and never over a screen or the subject.
  - Keep text within about 450–900px wide, depending on the space.
- **Scale:** props should look like objects on that table (bag about 670px tall, bowl and plate about 570px across in a 1080-wide frame), with room for the text above.

## 5. Beat template (10s version)
| Time | Beat | Prop action |
|---|---|---|
| 0–2.5s | "order from **zomato**" | Bag lowers onto the table |
| 2.6–5s | "what should **I cook?**" | Fridge slides in, door swings open |
| 5–7.5s | "add onions", then "add tomatoes" | Bowl slides in, items drop in with ripples |
| 7.7–10s | "your first order", "**upto 60% off**" | Plate slides in, cloche lifts, pizza pops in, big number appears |

## 6. Pipeline
- **Starting point:** copy `reel-zomato-mat/` for a flat table, or `reel-zomato-photo/` for an angled table.
- **Background:** replace `bg.jpg` with the new photo (resize to 1440 wide). Draw it in `render()` with cover-fit.
- **Re-placement:** retune the prop stage line (`yb` / base-line function), the text block position (`tx`, y values, `maxW`), the shadow tint and the tone wash for each new photo.
- **Render:**
  - Stills: `node core/render/still.mjs <dir> <t> --size 1080x1920`.
  - Video: `node core/render/video.mjs <dir> --fps 25 --size 1080x1920 --workers 4`.
  - Run both from `/home/user/lemomo-ai/lemo-opuscar`, then check a contact sheet before sending.
- **Pitfalls:**
  - Text running past the frame edge: always fit to a maximum width.
  - Items overlapping during swaps: stagger the exit and entry.
  - Props touching the frame bottom: lift the base line.
  - The page must wait for `bg.jpg` to decode before setting `READY`.

## Related versions
`reel-zomato/` (v1, own backgrounds), `reel-zomato-desk/` (drawn desk), `reel-zomato-photo/` (laptop photo, angled), `reel-zomato-bunny/` (café photo, red light), `reel-zomato-mat/` (cutting mat, flat-lay, **approved direction**).
