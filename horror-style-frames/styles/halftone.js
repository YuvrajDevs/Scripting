// Halftone Dossier: the whole film is paper. Shading is dots in two or three angled screens, flat spot inks, one dark ink, case-file apparatus.
import { W, H, WIN, FIGS, FAR, MOON, HORIZON, figureGeo, fingersOf, polyPath, blobPath, ellipsePath, rngOf, vnoise, clamp, lerp, ss, canvasOf } from '../common.js';
const NAVY = '#1c2540', COBALT = '#2f58c9', PINK = '#f0508a', YEL = '#f5c92b', RED = '#d6322a', CREAM = '#f3e9d2', MANILA = '#e7d6a8';

export function draw(ctx, t) {
  const R = rngOf(14);
  ctx.fillStyle = CREAM; ctx.fillRect(0, 0, W, H);
  // halftone: a rotated grid of dots, radius following a density field, clipped to a region
  function dots(clip, angle, step, dens, color, k = .68) {
    ctx.save(); ctx.beginPath(); clip(ctx); ctx.clip(); ctx.fillStyle = color; const ca = Math.cos(angle), sa = Math.sin(angle); ctx.beginPath();
    for (let v = -1500; v < 2600; v += step) for (let u = -1500; u < 2600; u += step) { const x = u * ca - v * sa, y = u * sa + v * ca; if (x < -10 || x > W + 10 || y < -10 || y > H + 10) continue; const d = dens(x, y); if (d < .03) continue; const r = step * k * Math.sqrt(clamp(d, 0, 1)) * .55; ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, 7); }
    ctx.fill(); ctx.restore();
  }
  const OUT = 7, line = () => { ctx.strokeStyle = NAVY; ctx.lineWidth = OUT; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; };
  // wall
  ctx.fillStyle = MANILA; ctx.fillRect(40, 300, 1000, 1330); dots(p => p.rect(40, 300, 1000, 1330), .26, 22, (x, y) => .22 + .35 * ss(300, 1500, y), YEL, .6);
  // the night through the glass: a dark ink ground with a lighter dot layer
  const winPath = p => p.rect(WIN.x0, WIN.y0, 740, 1100);
  ctx.fillStyle = NAVY; ctx.fillRect(WIN.x0, WIN.y0, 740, 1100);
  dots(winPath, .4, 20, (x, y) => y > HORIZON ? .18 : .15 + .85 * (1 - ss(40, 640, Math.hypot(x - MOON.x, y - MOON.y))), COBALT, .7);
  ctx.fillStyle = YEL; ctx.beginPath(); ctx.arc(MOON.x, MOON.y, MOON.r, 0, 7); ctx.fill(); line(); ctx.beginPath(); ctx.arc(MOON.x, MOON.y, MOON.r, 0, 7); ctx.stroke();
  ctx.save(); ctx.beginPath(); ctx.rect(WIN.x0, WIN.y0, 740, 1100); ctx.clip(); ctx.fillStyle = NAVY; for (let i = 0; i < 14; i++) { const x = 170 + i * 56 + (i * 37 % 20), h = 80 + (i * 53 % 90); ctx.beginPath(); ctx.moveTo(x - 30, HORIZON); ctx.lineTo(x, HORIZON - h); ctx.lineTo(x + 30, HORIZON); ctx.fill(); }
  ctx.fillRect(WIN.x0, HORIZON, 740, 600); for (const f of FAR) { ctx.fillRect(f.x - 9, HORIZON - f.h, 18, f.h); ctx.beginPath(); ctx.arc(f.x, HORIZON - f.h, 14, 0, 7); ctx.fill(); }
  // two chunky figures: flat fills, heavy outline, halftone shading, glossy eyes
  FIGS.forEach((f, k) => {
    const geo = figureGeo(f), { head } = geo, torsoCol = k ? YEL : PINK;
    for (const a of geo.arms) { ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = NAVY; ctx.lineWidth = a.w + OUT * 2; ctx.beginPath(); polyPath(ctx, a.pts, false); ctx.stroke(); ctx.strokeStyle = torsoCol; ctx.lineWidth = a.w; ctx.beginPath(); polyPath(ctx, a.pts, false); ctx.stroke(); }
    ctx.fillStyle = torsoCol; ctx.beginPath(); polyPath(ctx, geo.torso); ctx.fill(); dots(p => polyPath(p, geo.torso), .5 + k * .1, 18, (x, y) => .15 + .7 * ss(f.cx - 240 * f.s, f.cx + 250 * f.s, x), NAVY, .7); line(); ctx.beginPath(); polyPath(ctx, geo.torso); ctx.stroke();
    ctx.fillStyle = COBALT; ctx.beginPath(); blobPath(ctx, geo.hood); ctx.fill(); dots(p => blobPath(p, geo.hood), .2, 16, (x, y) => .2 + .6 * ss(f.cx, f.cx + 150, x), NAVY, .65); line(); ctx.beginPath(); blobPath(ctx, geo.hood); ctx.stroke();
    ctx.fillStyle = CREAM; ctx.beginPath(); ellipsePath(ctx, head); ctx.fill(); dots(p => ellipsePath(p, head), .8, 14, (x, y) => .06 + .5 * ss(head.cx - 10, head.cx + head.rx, x) * ss(head.cy - head.ry, head.cy + head.ry, y), PINK, .7); line(); ctx.beginPath(); ellipsePath(ctx, head); ctx.stroke();
    for (const e of geo.eyes) { ctx.fillStyle = NAVY; ctx.beginPath(); ctx.ellipse(e.cx, e.cy, e.rx * 1.3, e.ry * 1.55, 0, 0, 7); ctx.fill(); ctx.fillStyle = CREAM; ctx.beginPath(); ctx.arc(e.cx - e.rx * .4, e.cy - e.ry * .5, e.rx * .42, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(e.cx + e.rx * .45, e.cy + e.ry * .5, e.rx * .22, 0, 7); ctx.fill(); }
    ctx.fillStyle = NAVY; ctx.beginPath(); ctx.ellipse(geo.mouth.cx, geo.mouth.cy, geo.mouth.w, geo.mouth.h * 1.3, 0, 0, 7); ctx.fill();
    for (const h of geo.hands) { for (const fg of fingersOf(h)) { ctx.strokeStyle = NAVY; ctx.lineWidth = fg.w + OUT * 2; ctx.beginPath(); ctx.moveTo(fg.x0, fg.y0); ctx.lineTo(fg.x1, fg.y1); ctx.stroke(); } for (const fg of fingersOf(h)) { ctx.strokeStyle = CREAM; ctx.lineWidth = fg.w; ctx.beginPath(); ctx.moveTo(fg.x0, fg.y0); ctx.lineTo(fg.x1, fg.y1); ctx.stroke(); } ctx.fillStyle = CREAM; ctx.beginPath(); ctx.ellipse(h.x, h.y + 22 * h.s, 44 * h.s, 52 * h.s, 0, 0, 7); ctx.fill(); line(); ctx.stroke(); }
  });
  ctx.restore();
  // the window frame
  ctx.fillStyle = '#d9c89a'; const bars = [[WIN.x0 - 14, WIN.y0 - 14, 768, 20], [WIN.x0 - 14, WIN.y1 - 6, 768, 22], [WIN.x0 - 14, WIN.y0, 20, 1100], [WIN.x1 - 6, WIN.y0, 20, 1100], [530, WIN.y0, 20, 1100], [WIN.x0, 735, 740, 20], [WIN.x0, 1102, 740, 20]];
  for (const [x, y, w, h] of bars) { ctx.fillStyle = '#d9c89a'; ctx.fillRect(x, y, w, h); line(); ctx.lineWidth = 5; ctx.strokeRect(x, y, w, h); }
  ctx.fillStyle = '#d9c89a'; ctx.fillRect(150, 1486, 780, 54); line(); ctx.strokeRect(150, 1486, 780, 54);
  // a measured height chart down the right-hand margin
  ctx.strokeStyle = NAVY; ctx.fillStyle = NAVY; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(1000, 420); ctx.lineTo(1000, 1480); ctx.stroke(); ctx.font = 'bold 22px "Arial Narrow", Arial, sans-serif';
  for (let y = 1480, i = 0; y >= 420; y -= 53, i++) { ctx.beginPath(); ctx.moveTo(1000, y); ctx.lineTo(i % 2 ? 1016 : 1030, y); ctx.stroke(); if (!(i % 2)) ctx.fillText(`${(i * .1).toFixed(1)}`, 1034 - 0, y + 6); }
  ctx.strokeStyle = RED; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(330, 510); ctx.lineTo(905, 510); ctx.stroke(); ctx.fillStyle = RED; ctx.font = 'bold 30px "Arial Narrow", Arial, sans-serif'; ctx.fillText('2.31 m', 912, 500);
  // header: file chips, headline
  ctx.fillStyle = NAVY; ctx.beginPath(); ctx.roundRect(40, 60, 500, 86, 14); ctx.fill(); ctx.fillStyle = CREAM; ctx.font = '900 42px "Arial Black", Impact, sans-serif'; ctx.fillText('CASE FILE No. 0417', 66, 118);
  ctx.strokeStyle = RED; ctx.lineWidth = 6; ctx.beginPath(); ctx.roundRect(720, 66, 320, 74, 12); ctx.stroke(); ctx.fillStyle = RED; ctx.font = '900 34px "Arial Black", Impact, sans-serif'; ctx.fillText('EXHIBIT A', 770, 116);
  ctx.fillStyle = PINK; ctx.font = '900 100px Impact, "Arial Black", sans-serif'; ctx.fillText('THEY WERE TALL.', 46 + 7, 256 + 7); ctx.fillStyle = NAVY; ctx.fillText('THEY WERE TALL.', 46, 256);
  // the red stamp, tilted, through a rough ink grain
  const st = canvasOf(W, H), s = st.getContext('2d'); s.translate(540, 1560); s.rotate(-.14); s.strokeStyle = RED; s.fillStyle = RED; s.lineWidth = 11; s.beginPath(); s.roundRect(-330, -80, 660, 160, 22); s.stroke(); s.lineWidth = 4; s.beginPath(); s.roundRect(-316, -66, 632, 132, 16); s.stroke(); s.font = '900 104px Impact, "Arial Black", sans-serif'; s.textAlign = 'center'; s.textBaseline = 'middle'; s.fillText('UNRESOLVED', 0, 6);
  s.setTransform(1, 0, 0, 1, 0, 0); s.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 1800; i++) { s.fillStyle = `rgba(0,0,0,${.5 + R() * .5})`; s.beginPath(); s.arc(300 + R() * 480, 1440 + R() * 240, .8 + R() * 2.6, 0, 7); s.fill(); } ctx.globalAlpha = .93; ctx.drawImage(st, 0, 0); ctx.globalAlpha = 1;
  // caption bar
  ctx.fillStyle = NAVY; ctx.fillRect(0, 1700, W, 120); ctx.fillStyle = PINK; ctx.font = '900 40px Impact, "Arial Black", sans-serif'; ctx.fillText('Three knocks. Nobody was outside.', 62, 1772); ctx.fillStyle = CREAM; ctx.fillText('Three knocks. Nobody was outside.', 58, 1768);
  // the sheet itself: paper mottling, dust, a centre fold
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; for (let i = 0; i < 40; i++) { const x = R() * W, y = R() * H, r = 80 + R() * 240, gr = ctx.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(190,160,110,${R() * .1})`); gr.addColorStop(1, 'rgba(190,160,110,0)'); ctx.fillStyle = gr; ctx.fillRect(x - r, y - r, r * 2, r * 2); }
  const fold = ctx.createLinearGradient(0, 940, 0, 980); fold.addColorStop(0, 'rgba(120,100,70,0)'); fold.addColorStop(.5, 'rgba(120,100,70,.3)'); fold.addColorStop(1, 'rgba(120,100,70,0)'); ctx.fillStyle = fold; ctx.fillRect(0, 940, W, 40);
  const vg = ctx.createRadialGradient(540, 960, 600, 540, 960, 1300); vg.addColorStop(0, 'rgba(255,255,255,0)'); vg.addColorStop(1, 'rgba(120,95,60,.4)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H); ctx.restore();
  for (let i = 0; i < 600; i++) { ctx.fillStyle = R() > .3 ? 'rgba(243,233,210,.8)' : 'rgba(28,37,64,.6)'; ctx.fillRect(R() * W, R() * H, 1 + R() * 2, 1 + R() * 2); }
}
