// Liminal Found Footage: a 1990s camcorder, held upright, in an empty office at night. The medium tells the story.
import { W, H, WIN, FIGS, FAR, MOON, HORIZON, figureGeo, fillFigure, handShape, rngOf, vnoise, clamp, canvasOf, blobPath, ellipsePath } from '../common.js';
const LW = 540, LH = 720, OY = 240;

function scene(g) {
  const R = rngOf(5);
  g.fillStyle = '#a8944c'; g.fillRect(0, OY, W, 1440);
  for (let x = 0; x < W; x += 36) { g.fillStyle = 'rgba(60,45,10,.08)'; g.fillRect(x, OY, 14, 1440); }
  g.fillStyle = '#cfc6a2'; g.fillRect(0, OY, W, 150);
  g.strokeStyle = '#8c8460'; g.lineWidth = 4;
  for (let x = 0; x <= W; x += 180) { g.beginPath(); g.moveTo(x, OY); g.lineTo(x, OY + 150); g.stroke(); }
  g.beginPath(); g.moveTo(0, OY + 75); g.lineTo(W, OY + 75); g.stroke();
  for (const x of [60, 660]) { g.fillStyle = '#fffbe2'; g.fillRect(x, OY + 18, 360, 52); g.strokeStyle = '#9a9270'; g.lineWidth = 5; g.strokeRect(x, OY + 18, 360, 52); }
  let gr = g.createLinearGradient(0, OY + 150, 0, OY + 620); gr.addColorStop(0, 'rgba(255,245,200,.28)'); gr.addColorStop(1, 'rgba(255,245,200,0)'); g.fillStyle = gr; g.fillRect(0, OY + 150, W, 470);
  // outside, through the glass
  g.save(); g.beginPath(); g.rect(WIN.x0, WIN.y0, WIN.x1 - WIN.x0, WIN.y1 - WIN.y0); g.clip();
  gr = g.createLinearGradient(0, WIN.y0, 0, HORIZON); gr.addColorStop(0, '#061317'); gr.addColorStop(1, '#173a40'); g.fillStyle = gr; g.fillRect(WIN.x0, WIN.y0, 740, 1100);
  g.fillStyle = '#0a1c1f'; g.fillRect(WIN.x0, HORIZON, 740, 600);
  g.fillStyle = '#e2ece4'; g.beginPath(); g.arc(MOON.x, MOON.y, MOON.r, 0, 7); g.fill();
  g.fillStyle = '#030c0c'; for (let i = 0; i < 14; i++) { const x = 170 + i * 56 + R() * 20, h = 70 + R() * 90; g.beginPath(); g.moveTo(x - 30, HORIZON); g.lineTo(x, HORIZON - h); g.lineTo(x + 30, HORIZON); g.fill(); }
  g.fillStyle = '#071314'; for (const f of FAR) { g.fillRect(f.x - 9, HORIZON - f.h, 18, f.h); g.beginPath(); g.arc(f.x, HORIZON - f.h, 14, 0, 7); g.fill(); }
  for (const f of FIGS) {
    const geo = figureGeo(f);
    g.fillStyle = '#56615d'; fillFigure(g, geo, { skipHead: true });
    g.fillStyle = '#7e8a86'; g.beginPath(); blobPath(g, geo.hood); g.fill();
    g.fillStyle = '#e3ebe7'; g.beginPath(); ellipsePath(g, geo.head); g.fill();
    g.fillStyle = '#0a0f0e'; for (const e of geo.eyes) { g.beginPath(); ellipsePath(g, e); g.fill(); }
    g.beginPath(); g.ellipse(geo.mouth.cx, geo.mouth.cy, geo.mouth.w, geo.mouth.h, 0, 0, 7); g.fill();
    g.fillStyle = '#dfe7e2'; g.strokeStyle = '#dfe7e2'; for (const h of geo.hands) handShape(g, h);
  }
  gr = g.createLinearGradient(170, 380, 700, 1100); gr.addColorStop(0, 'rgba(255,255,255,.12)'); gr.addColorStop(.4, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(WIN.x0, WIN.y0, 740, 1100);
  g.restore();
  g.fillStyle = '#ddd6b8';
  g.fillRect(WIN.x0 - 14, WIN.y0 - 14, 768, 20); g.fillRect(WIN.x0 - 14, WIN.y1 - 6, 768, 22); g.fillRect(WIN.x0 - 14, WIN.y0, 20, 1100); g.fillRect(WIN.x1 - 6, WIN.y0, 20, 1100);
  g.fillRect(530, WIN.y0, 20, 1100); g.fillRect(WIN.x0, 735, 740, 20); g.fillRect(WIN.x0, 1102, 740, 20);
  g.fillStyle = '#b5ab86'; g.fillRect(150, 1486, 780, 54);
  g.fillStyle = '#4d3d26'; g.fillRect(0, 1546, W, 30);
  g.fillStyle = '#7c6a34'; g.fillRect(0, 1576, W, 104); for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(${R() > .5 ? '40,30,5' : '200,180,110'},${R() * .25})`; g.fillRect(R() * W, 1576 + R() * 104, 5 + R() * 9, 3); }
  // the one saturated colour: a red alarm lamp
  g.fillStyle = '#ff2a1a'; g.beginPath(); g.arc(90, OY + 330, 17, 0, 7); g.fill(); g.fillStyle = '#4a0a05'; g.fillRect(68, OY + 348, 44, 9);
  // taped notice
  g.fillStyle = '#ece6d0'; g.fillRect(940, 700, 118, 164); g.fillStyle = '#2a2820'; g.fillRect(950, 714, 98, 12);
  for (let i = 0; i < 9; i++) g.fillRect(950, 742 + i * 11, 70 + (i % 3) * 12, 4);
}

export function draw(ctx, t) {
  const lo = canvasOf(LW, LH), g = lo.getContext('2d'); g.scale(.5, .5); g.translate(0, -OY); scene(g); g.setTransform(1, 0, 0, 1, 0, 0);
  const d = g.getImageData(0, 0, LW, LH).data, o = new Uint8ClampedArray(d.length), R = rngOf(11);
  for (let y = 0; y < LH; y++) {
    let jit = Math.sin(y * .045 + t * 3) * .4 + (vnoise(3, y * .15, 0) - .5) * 1.1;          // line wobble
    if (y > LH - 74 && y < LH - 56) jit += 8 + Math.sin(y * 1.3) * 3;                          // tracking tear
    if (y > LH - 8) jit += (R() - .5) * 26;                                                    // head-switching band
    for (let x = 0; x < LW; x++) {
      const sx = clamp(Math.round(x - jit), 0, LW - 1), row = y * LW, i = (row + x) * 4;
      const ir = (row + clamp(sx - 2, 0, LW - 1)) * 4, ig = (row + sx) * 4, ib = (row + clamp(sx + 2, 0, LW - 1)) * 4, il = (row + clamp(sx - 1, 0, LW - 1)) * 4, ir2 = (row + clamp(sx + 1, 0, LW - 1)) * 4;
      const r = d[ir], gg = d[ig + 1] * .6 + d[il + 1] * .2 + d[ir2 + 1] * .2, b = d[ib + 2];    // chroma smeared right, luma softened
      const lum = (r + gg + b) / 3, n = (R() - .5) * (30 * (1 - lum / 255) + 9);                  // AGC noise in the darks
      o[i] = r * .88 + 18 + n; o[i + 1] = gg * .88 + 18 + n; o[i + 2] = b * .88 + 16 + n; o[i + 3] = 255;
    }
  }
  g.putImageData(new ImageData(o, LW, LH), 0, 0);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  ctx.imageSmoothingEnabled = true; ctx.drawImage(lo, 0, OY, W, 1440);
  let gr = ctx.createRadialGradient(540, OY + 720, 400, 540, OY + 720, 980); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.5)'); ctx.fillStyle = gr; ctx.fillRect(0, OY, W, 1440);
  ctx.save(); ctx.globalCompositeOperation = 'screen'; gr = ctx.createRadialGradient(90, OY + 330, 4, 90, OY + 330, 120); gr.addColorStop(0, 'rgba(255,60,40,.9)'); gr.addColorStop(1, 'rgba(255,40,20,0)'); ctx.fillStyle = gr; ctx.fillRect(0, OY + 200, 260, 260); ctx.restore();
  // camcorder on-screen display
  ctx.font = 'bold 46px "Courier New", monospace'; ctx.lineWidth = 8; ctx.lineJoin = 'round'; ctx.strokeStyle = '#000';
  const txt = (s, x, y) => { ctx.strokeText(s, x, y); ctx.fillStyle = '#fff'; ctx.fillText(s, x, y); };
  ctx.fillStyle = '#ff2a1a'; ctx.beginPath(); ctx.arc(80, OY + 78, 15, 0, 7); ctx.fill(); txt('REC', 108, OY + 94);
  txt('SP', 880, OY + 94); ctx.lineWidth = 5; ctx.strokeStyle = '#fff'; ctx.strokeRect(950, OY + 62, 66, 34); ctx.fillStyle = '#fff'; ctx.fillRect(1016, OY + 72, 7, 14); ctx.fillRect(956, OY + 68, 20, 22); ctx.fillRect(980, OY + 68, 20, 22);
  ctx.lineWidth = 8; ctx.strokeStyle = '#000'; txt('3:07 AM', 64, OY + 1352); txt('NOV 02 1996', 64, OY + 1400);
}
