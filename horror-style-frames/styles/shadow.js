// Shadow Puppetry: dyed, carved hide pressed to a cotton screen and lit from behind by oil lamps. Colour is transmitted light.
import { W, H, FIGS, FAR, MOON, HORIZON, figureGeo, paneRects, handShape, armStroke, polyPath, blobPath, ellipsePath, rngOf, vnoise, canvasOf } from '../common.js';

export function draw(ctx, t) {
  const T = canvasOf(W, H), g = T.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
  const R = rngOf(3);
  const hide = p => { p.globalCompositeOperation = 'source-atop'; for (let i = 0; i < 220; i++) { p.fillStyle = `rgba(${R() > .5 ? '60,25,5' : '255,230,170'},${R() * .16})`; p.beginPath(); p.arc(R() * W, R() * H, 4 + R() * 26, 0, 7); p.fill(); } p.globalCompositeOperation = 'source-over'; };
  const piece = (dye, build, carve) => {
    const c = canvasOf(W, H), p = c.getContext('2d'); p.fillStyle = dye; p.strokeStyle = dye; build(p);
    if (carve) { p.globalCompositeOperation = 'destination-out'; p.fillStyle = '#000'; p.strokeStyle = '#000'; carve(p); p.globalCompositeOperation = 'source-over'; }
    hide(p); g.globalCompositeOperation = 'multiply'; g.drawImage(c, 0, 0); g.globalCompositeOperation = 'source-over';
  };
  const lattice = (p, x0, y0, x1, y1, step) => { for (let y = y0, row = 0; y < y1; y += step * .5, row++) for (let x = x0 + (row % 2) * step * .5; x < x1; x += step) { p.beginPath(); p.moveTo(x, y - step * .3); p.lineTo(x + step * .22, y); p.lineTo(x, y + step * .3); p.lineTo(x - step * .22, y); p.closePath(); p.fill(); } };
  // the window: an ochre frame carved like lace, open panes
  piece('#d98f2b', p => p.fillRect(110, 320, 860, 1220), p => {
    for (const r of paneRects(22)) p.fillRect(r.x, r.y, r.w, r.h);
    lattice(p, 134, 338, 950, 372, 36); lattice(p, 134, 1486, 950, 1520, 36); lattice(p, 128, 380, 158, 1480, 36); lattice(p, 922, 380, 952, 1480, 36);
    for (let y = 400; y < 1470; y += 58) { p.beginPath(); p.arc(540, y, 7, 0, 7); p.fill(); }
    for (const yy of [745, 1112]) for (let x = 200; x < 900; x += 58) { p.beginPath(); p.arc(x, yy, 6, 0, 7); p.fill(); }
  });
  // moon, carved with a ring of coin holes
  piece('#f2cf6a', p => { p.beginPath(); p.arc(MOON.x, MOON.y, MOON.r, 0, 7); p.fill(); }, p => { for (let a = 0; a < 6.28; a += .5) { p.beginPath(); p.arc(MOON.x + Math.cos(a) * 52, MOON.y + Math.sin(a) * 52, 8, 0, 7); p.fill(); } });
  // a carved ground strip and the far watchers
  piece('#1f8a5c', p => p.fillRect(170, HORIZON, 740, 70), p => { for (let x = 190; x < 900; x += 30) { p.beginPath(); p.arc(x, HORIZON + 22, 9, .1 * Math.PI, .9 * Math.PI); p.lineWidth = 5; p.stroke(); } });
  piece('#2a1810', p => { for (const f of FAR) { p.fillRect(f.x - 9, HORIZON - f.h, 18, f.h); p.beginPath(); p.arc(f.x, HORIZON - f.h, 14, 0, 7); p.fill(); } });
  // the two tall puppets
  FIGS.forEach((f, k) => {
    const geo = figureGeo(f), robe = k ? '#8a1f1a' : '#2b3f9c', sleeve = k ? '#d98f2b' : '#cf3a22';
    piece(robe, p => { p.beginPath(); polyPath(p, geo.torso); p.fill(); p.beginPath(); blobPath(p, geo.hood); p.fill(); }, p => {
      p.lineWidth = 7; for (let y = geo.sh + 130 * f.s; y < 1520; y += 46) for (let x = f.cx - 210 * f.s + (Math.round(y / 46) % 2) * 28; x < f.cx + 210 * f.s; x += 56) { p.beginPath(); p.arc(x, y, 16, .1 * Math.PI, .9 * Math.PI); p.stroke(); }
    });
    piece(sleeve, p => { for (const a of geo.arms) armStroke(p, a); });
    piece('#2a1810', p => { p.beginPath(); ellipsePath(p, geo.head); p.fill(); }, p => {
      for (const e of geo.eyes) { p.beginPath(); p.ellipse(e.cx, e.cy, e.rx * 1.15, e.ry * .5, e.cx < f.cx ? .3 : -.3, 0, 7); p.fill(); }
      p.beginPath(); p.ellipse(geo.mouth.cx, geo.mouth.cy, geo.mouth.w * .7, geo.mouth.h * .45, 0, 0, 7); p.fill();
    });
    piece('#e3b25c', p => { for (const h of geo.hands) handShape(p, h); });
    // thin rods, joint rivets
    g.globalCompositeOperation = 'multiply'; g.strokeStyle = 'rgba(70,60,50,.55)'; g.lineWidth = 5;
    g.beginPath(); g.moveTo(f.cx, geo.head.cy - geo.head.ry * 1.3); g.lineTo(f.cx + 10, 0); g.stroke();
    for (const h of geo.hands) { g.beginPath(); g.moveTo(h.x, h.y - 130 * h.s); g.lineTo(h.x + (k ? 30 : -20), 0); g.stroke(); }
    g.globalCompositeOperation = 'source-over';
    for (const a of geo.arms) { const [x, y] = a.pts[0]; g.fillStyle = 'rgba(40,20,8,.85)'; g.beginPath(); g.arc(x, y, 15, 0, 7); g.fill(); g.fillStyle = '#fbefc9'; g.beginPath(); g.arc(x, y, 6, 0, 7); g.fill(); }
  });
  // the knocking: three short strokes by the raised hand
  g.globalCompositeOperation = 'multiply'; g.strokeStyle = 'rgba(40,20,8,.7)'; g.lineWidth = 6; g.lineCap = 'round';
  for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(202, 733, 90 + i * 26, -.9, -.2 + i * .05); g.stroke(); } g.globalCompositeOperation = 'source-over';
  // lamp behind the cloth: a broad lobe and a tight hotspot, tonemapped
  const id = g.getImageData(0, 0, W, H), d = id.data, flick = 1 + .03 * Math.sin(t * 7) + .015 * Math.sin(t * 19);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4, dx = x - 540, dy = y - 1000, r2 = dx * dx + dy * dy;
    const L = (.7 * Math.exp(-r2 / (2 * 700 * 700)) + .9 * Math.exp(-r2 / (2 * 230 * 230))) * flick * (1 + .04 * Math.sin(x * .95) * Math.sin(y * .95) + (vnoise(x * .02, y * .02) - .5) * .12), e = 1.8 * L;
    d[i] = 255 * (1 - Math.exp(-e * d[i] / 255)); d[i + 1] = 255 * (1 - Math.exp(-e * .74 * d[i + 1] / 255)); d[i + 2] = 255 * (1 - Math.exp(-e * .42 * d[i + 2] / 255));
  }
  g.putImageData(id, 0, 0); ctx.drawImage(T, 0, 0);
  // warm vignette, lacquered stage frame
  let gr = ctx.createRadialGradient(540, 960, 500, 540, 960, 1250); gr.addColorStop(0, 'rgba(120,60,10,0)'); gr.addColorStop(1, 'rgba(90,40,5,.55)'); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#34100a'; ctx.fillRect(0, 0, W, 96); ctx.fillRect(0, H - 110, W, 110); ctx.fillRect(0, 0, 58, H); ctx.fillRect(W - 58, 0, 58, H);
  ctx.strokeStyle = '#c8962e'; ctx.lineWidth = 4; ctx.strokeRect(58, 96, W - 116, H - 206);
  gr = ctx.createLinearGradient(0, 96, 0, 200); gr.addColorStop(0, 'rgba(255,170,70,.35)'); gr.addColorStop(1, 'rgba(255,170,70,0)'); ctx.fillStyle = gr; ctx.fillRect(58, 96, W - 116, 104);
}
