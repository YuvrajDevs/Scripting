// Stained Glass: coloured glass in dark lead cames, faces painted in brown grisaille. It glows only with the light behind it.
import { W, H, WIN, FIGS, FAR, MOON, HORIZON, figureGeo, fingersOf, polyPath, blobPath, ellipsePath, rngOf, vnoise, clamp, lerp, ss, canvasOf } from '../common.js';

export function draw(ctx, t) {
  const R = rngOf(13), LEAD = '#0d0c0c';
  // the room: ashlar stone, a splayed embrasure
  ctx.fillStyle = '#5b5955'; ctx.fillRect(0, 0, W, H);
  for (let y = 0, row = 0; y < H; y += 92, row++) for (let x = -90 + (row % 2) * 90; x < W; x += 180) { const s = 84 + R() * 22; ctx.fillStyle = `rgb(${s},${s - 2},${s - 6})`; ctx.fillRect(x + 3, y + 3, 174, 86); for (let i = 0; i < 40; i++) { ctx.fillStyle = `rgba(${R() > .5 ? '20,20,18' : '200,196,186'},${R() * .12})`; ctx.fillRect(x + R() * 170, y + R() * 84, 2 + R() * 6, 2); } }
  let gr = ctx.createLinearGradient(0, 300, 0, 1560); gr.addColorStop(0, 'rgba(0,0,0,.55)'); gr.addColorStop(.5, 'rgba(0,0,0,.15)'); gr.addColorStop(1, 'rgba(0,0,0,.5)'); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#3a3835'; ctx.beginPath(); ctx.moveTo(100, 300); ctx.lineTo(980, 300); ctx.lineTo(WIN.x1 + 20, WIN.y0 - 20); ctx.lineTo(WIN.x0 - 20, WIN.y0 - 20); ctx.fill();
  ctx.fillStyle = '#4a4844'; ctx.beginPath(); ctx.moveTo(100, 300); ctx.lineTo(WIN.x0 - 20, WIN.y0 - 20); ctx.lineTo(WIN.x0 - 20, WIN.y1 + 20); ctx.lineTo(100, 1560); ctx.fill();
  ctx.fillStyle = '#34322f'; ctx.beginPath(); ctx.moveTo(980, 300); ctx.lineTo(WIN.x1 + 20, WIN.y0 - 20); ctx.lineTo(WIN.x1 + 20, WIN.y1 + 20); ctx.lineTo(980, 1560); ctx.fill();
  // the glass, painted onto its own canvas
  const gl = canvasOf(W, H), g = gl.getContext('2d'); g.save(); g.beginPath(); g.rect(WIN.x0, WIN.y0, 740, 1100); g.clip();
  const piece = (pts, color, o = {}) => {
    g.save(); g.beginPath(); o.smooth ? blobPath(g, pts) : polyPath(g, pts); g.fillStyle = color; g.fill(); g.clip();
    const a = R() * 3.1; g.strokeStyle = `rgba(255,255,255,${.05 + R() * .08})`; g.lineWidth = 2; for (let i = 0; i < 16; i++) { g.beginPath(); const x = pts[0][0] + (R() - .5) * 120, y = pts[0][1] + (R() - .5) * 120; g.moveTo(x - Math.cos(a) * 200, y - Math.sin(a) * 200); g.lineTo(x + Math.cos(a) * 200, y + Math.sin(a) * 200); g.stroke(); }
    g.lineWidth = 16; g.strokeStyle = 'rgba(0,0,0,.28)'; g.beginPath(); o.smooth ? blobPath(g, pts) : polyPath(g, pts); g.stroke(); g.restore();   // darker aged edge at the lead
    g.lineWidth = o.lead || 7; g.strokeStyle = LEAD; g.lineJoin = 'round'; g.beginPath(); o.smooth ? blobPath(g, pts) : polyPath(g, pts); g.stroke();
  };
  // quarries: a lattice of hand-cut lozenges in cobalt and indigo
  const blues = ['#1b3a8c', '#223f96', '#17306f', '#1f4aa0', '#142a63', '#2a4fa8'];
  for (let y = WIN.y0 - 90, row = 0; y < WIN.y1 + 90; y += 62, row++) for (let x = WIN.x0 - 74 + (row % 2) * 37; x < WIN.x1 + 74; x += 74) { const j = () => (R() - .5) * 8; piece([[x + j(), y - 47 + j()], [x + 37 + j(), y + j()], [x + j(), y + 47 + j()], [x - 37 + j(), y + j()]], blues[(R() * blues.length) | 0], { lead: 5 }); }
  // moon: a pale yellow piece in a ring of lighter blues
  for (let i = 0; i < 12; i++) { const a0 = i / 12 * 6.283, a1 = (i + 1) / 12 * 6.283, r0 = MOON.r + 10, r1 = MOON.r + 70; piece([[MOON.x + Math.cos(a0) * r0, MOON.y + Math.sin(a0) * r0], [MOON.x + Math.cos(a0) * r1, MOON.y + Math.sin(a0) * r1], [MOON.x + Math.cos(a1) * r1, MOON.y + Math.sin(a1) * r1], [MOON.x + Math.cos(a1) * r0, MOON.y + Math.sin(a1) * r0]], i % 2 ? '#5c86d6' : '#7a9ae0', { lead: 5 }); }
  piece(Array.from({ length: 20 }, (_, i) => [MOON.x + Math.cos(i / 20 * 6.283) * MOON.r, MOON.y + Math.sin(i / 20 * 6.283) * MOON.r]), '#f6e8a6', { smooth: true, lead: 7 });
  // ground and trees
  piece([[WIN.x0 - 10, HORIZON], [WIN.x1 + 10, HORIZON], [WIN.x1 + 10, 1140], [WIN.x0 - 10, 1140]], '#0f3b34'); piece([[WIN.x0 - 10, 1140], [WIN.x1 + 10, 1140], [WIN.x1 + 10, 1500], [WIN.x0 - 10, 1500]], '#0a2a2a');
  for (let i = 0; i < 14; i++) { const x = 170 + i * 56 + (i * 37 % 20), h = 80 + (i * 53 % 90); piece([[x - 30, HORIZON + 2], [x, HORIZON - h], [x + 30, HORIZON + 2]], i % 2 ? '#0d4a3a' : '#0a3a30', { lead: 5 }); }
  for (const f of FAR) { piece([[f.x - 10, HORIZON], [f.x - 9, HORIZON - f.h + 14], [f.x + 9, HORIZON - f.h + 14], [f.x + 10, HORIZON]], '#2a3a44', { lead: 4 }); }
  // two tall figures, built piece by piece
  FIGS.forEach((f, k) => {
    const geo = figureGeo(f), { head } = geo;
    piece(geo.torso, k ? '#5a2750' : '#1e5a5a'); piece(geo.hood, '#6f8a88', { smooth: true });
    for (const a of geo.arms) { g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = LEAD; g.lineWidth = a.w + 12; g.beginPath(); polyPath(g, a.pts, false); g.stroke(); g.strokeStyle = k ? '#7a3a68' : '#2e7a7a'; g.lineWidth = a.w; g.beginPath(); polyPath(g, a.pts, false); g.stroke(); }
    piece(Array.from({ length: 22 }, (_, i) => [head.cx + Math.cos(i / 22 * 6.283) * head.rx, head.cy + Math.sin(i / 22 * 6.283) * head.ry]), '#dfe8d8', { smooth: true });
    // grisaille: brows, eyes, mouth, folds, and a stippled shadow on one side of the face
    g.save(); g.beginPath(); ellipsePath(g, head); g.clip(); const sg = g.createLinearGradient(head.cx - head.rx, 0, head.cx + head.rx, 0); sg.addColorStop(.35, 'rgba(58,38,22,0)'); sg.addColorStop(1, 'rgba(58,38,22,.5)'); g.fillStyle = sg; g.fillRect(head.cx - head.rx, head.cy - head.ry, head.rx * 2, head.ry * 2); g.restore();
    g.strokeStyle = 'rgba(58,38,22,.85)'; g.lineCap = 'round'; g.lineWidth = 7;
    for (const e of geo.eyes) { g.beginPath(); g.moveTo(e.cx - e.rx * 1.4, e.cy - e.ry * 1.8); g.quadraticCurveTo(e.cx, e.cy - e.ry * 2.8, e.cx + e.rx * 1.4, e.cy - e.ry * 1.6); g.stroke(); g.fillStyle = '#2a1a10'; g.beginPath(); g.ellipse(e.cx, e.cy, e.rx * 1.2, e.ry * 1.25, 0, 0, 7); g.fill(); }
    g.lineWidth = 5; g.beginPath(); g.ellipse(geo.mouth.cx, geo.mouth.cy, geo.mouth.w, geo.mouth.h, 0, 0, 7); g.stroke(); g.lineWidth = 4;
    for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(f.cx - 150 * f.s + i * 60 * f.s, geo.sh + 120 * f.s); g.quadraticCurveTo(f.cx - 160 * f.s + i * 60 * f.s, 1100, f.cx - 140 * f.s + i * 60 * f.s, 1500); g.stroke(); }
    for (const h of geo.hands) { for (const fg of fingersOf(h)) { g.strokeStyle = LEAD; g.lineWidth = fg.w + 9; g.beginPath(); g.moveTo(fg.x0, fg.y0); g.lineTo(fg.x1, fg.y1); g.stroke(); g.strokeStyle = '#e6eadb'; g.lineWidth = fg.w; g.beginPath(); g.moveTo(fg.x0, fg.y0); g.lineTo(fg.x1, fg.y1); g.stroke(); } g.fillStyle = '#e6eadb'; g.strokeStyle = LEAD; g.lineWidth = 7; g.beginPath(); g.ellipse(h.x, h.y + 22 * h.s, 44 * h.s, 52 * h.s, 0, 0, 7); g.fill(); g.stroke(); }
  });
  g.restore();
  // backlight: glass eats into its own lead
  ctx.drawImage(gl, 0, 0); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.filter = 'blur(20px)'; ctx.globalAlpha = .5; ctx.drawImage(gl, 0, 0); ctx.filter = 'blur(60px)'; ctx.globalAlpha = .35; ctx.drawImage(gl, 0, 0); ctx.restore();
  // iron saddle bars, a stone mullion
  ctx.fillStyle = '#1a1a1c'; for (const y of [745, 1112]) { ctx.fillRect(WIN.x0, y - 7, 740, 14); ctx.fillStyle = 'rgba(160,90,50,.35)'; ctx.fillRect(WIN.x0, y - 7, 740, 3); ctx.fillStyle = '#1a1a1c'; }
  gr = ctx.createLinearGradient(520, 0, 560, 0); gr.addColorStop(0, '#47453f'); gr.addColorStop(.5, '#77746c'); gr.addColorStop(1, '#3a3834'); ctx.fillStyle = gr; ctx.fillRect(520, WIN.y0, 40, 1100);
  ctx.strokeStyle = '#2a2927'; ctx.lineWidth = 12; ctx.strokeRect(WIN.x0, WIN.y0, 740, 1100);
  // the floor catches the colours: a soft, mirrored, desaturated copy of the glass
  ctx.save(); ctx.beginPath(); ctx.rect(0, 1560, W, 360); ctx.clip(); ctx.fillStyle = '#2c2a27'; ctx.fillRect(0, 1560, W, 360);
  for (let y = 1560, row = 0; y < H; y += 74 + row * 10, row++) for (let x = -80 + (row % 2) * 110; x < W; x += 220 + R() * 20) { const s = 38 + R() * 14; ctx.fillStyle = `rgb(${s},${s - 1},${s - 3})`; ctx.fillRect(x + 4, y + 4, 205, 64 + row * 8); }
  ctx.globalCompositeOperation = 'screen'; ctx.setTransform(1, 0, 0, -.3, 0, 2014); ctx.filter = 'blur(10px)'; ctx.globalAlpha = .5; ctx.drawImage(gl, 0, 0); ctx.restore();
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; gr = ctx.createLinearGradient(0, 1480, 0, 1900); gr.addColorStop(0, 'rgba(150,170,230,.10)'); gr.addColorStop(1, 'rgba(150,170,230,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(WIN.x0, 1480); ctx.lineTo(WIN.x1, 1480); ctx.lineTo(1020, 1900); ctx.lineTo(60, 1900); ctx.fill(); ctx.restore();
  gr = ctx.createRadialGradient(540, 960, 520, 540, 960, 1300); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.5)'); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
}
