// ASCII / CRT Terminal: a single amber phosphor screen. Every image is real glyphs on a character grid, chosen by ink density.
import { W, H, WIN, FIGS, FAR, MOON, HORIZON, figureGeo, fillFigure, handShape, polyPath, blobPath, ellipsePath, rngOf, clamp, lerp, ss, canvasOf } from '../common.js';
const CW = 12, CH = 16, COLS = 90, ROWS = 120, SS = 4;

// the picture, painted as grey values aligned to the grid: dark = sparse dim glyphs, bright = dense bold ones
function paintTone(g) {
  const v = x => `rgb(${x},${x},${x})`, R = rngOf(2);
  g.fillStyle = v(0); g.fillRect(0, 0, W, H);
  g.save(); g.beginPath(); g.rect(WIN.x0, WIN.y0, 740, 1100); g.clip();
  const sky = g.createLinearGradient(0, WIN.y0, 0, HORIZON); sky.addColorStop(0, v(14)); sky.addColorStop(1, v(52)); g.fillStyle = sky; g.fillRect(WIN.x0, WIN.y0, 740, 1100);
  const mg = g.createRadialGradient(MOON.x, MOON.y, 20, MOON.x, MOON.y, 380); mg.addColorStop(0, 'rgba(210,210,210,.9)'); mg.addColorStop(1, 'rgba(210,210,210,0)'); g.fillStyle = mg; g.fillRect(WIN.x0, WIN.y0, 740, 1100);
  g.fillStyle = v(255); g.beginPath(); g.arc(MOON.x, MOON.y, MOON.r, 0, 7); g.fill();
  g.fillStyle = v(6); g.fillRect(WIN.x0, HORIZON, 740, 600); for (let i = 0; i < 14; i++) { const x = 170 + i * 56 + (i * 37 % 20), h = 80 + (i * 53 % 90); g.beginPath(); g.moveTo(x - 30, HORIZON); g.lineTo(x, HORIZON - h); g.lineTo(x + 30, HORIZON); g.fill(); }
  g.fillStyle = v(40); for (const f of FAR) { g.fillRect(f.x - 9, HORIZON - f.h, 18, f.h); g.beginPath(); g.arc(f.x, HORIZON - f.h, 14, 0, 7); g.fill(); }
  for (const f of FIGS) {
    const geo = figureGeo(f), { head } = geo;
    g.fillStyle = v(56); fillFigure(g, geo, { skipHead: true }); g.fillStyle = v(30); g.beginPath(); blobPath(g, geo.hood); g.fill();
    g.strokeStyle = v(150); g.lineWidth = 8; g.beginPath(); blobPath(g, geo.hood); g.stroke(); g.beginPath(); polyPath(g, geo.torso); g.stroke();         // a thin bright rim separates the planes
    g.fillStyle = v(225); g.beginPath(); ellipsePath(g, head); g.fill();
    g.fillStyle = v(4); for (const e of geo.eyes) { g.beginPath(); g.ellipse(e.cx, e.cy, e.rx * 1.3, e.ry * 1.6, 0, 0, 7); g.fill(); } g.beginPath(); g.ellipse(geo.mouth.cx, geo.mouth.cy, geo.mouth.w, geo.mouth.h * 1.3, 0, 0, 7); g.fill();
    g.fillStyle = v(235); g.strokeStyle = v(235); for (const h of geo.hands) handShape(g, h);
  }
  g.restore();
  g.fillStyle = v(120); const bars = [[WIN.x0 - 14, WIN.y0 - 14, 768, 20], [WIN.x0 - 14, WIN.y1 - 6, 768, 22], [WIN.x0 - 14, WIN.y0, 20, 1100], [WIN.x1 - 6, WIN.y0, 20, 1100], [530, WIN.y0, 20, 1100], [WIN.x0, 735, 740, 20], [WIN.x0, 1102, 740, 20]];
  for (const [x, y, w, h] of bars) g.fillRect(x, y, w, h); g.fillStyle = v(70); g.fillRect(150, 1486, 780, 54);
}

export function draw(ctx, t) {
  const tone = canvasOf(COLS * SS, ROWS * SS), tg = tone.getContext('2d'); tg.scale(COLS * SS / W, ROWS * SS / H); paintTone(tg);
  const d = tg.getImageData(0, 0, COLS * SS, ROWS * SS).data, TW = COLS * SS;
  const scr = canvasOf(W, H), g = scr.getContext('2d'); g.fillStyle = '#0b0603'; g.fillRect(0, 0, W, H);
  g.font = `${CH + 1}px "VT323", "Courier New", monospace`; g.textBaseline = 'top'; g.textAlign = 'center';
  const ramp = ' .,:;i1tfLCG08@', col = a => { const k = clamp(a, 0, 1.25); return k < .55 ? [lerp(70, 255, k / .55), lerp(26, 168, k / .55), lerp(2, 18, k / .55)] : [255, lerp(168, 236, (k - .55) / .7), lerp(18, 190, (k - .55) / .7)]; };
  for (let r = 4; r < ROWS - 6; r++) for (let c = 0; c < COLS; c++) {
    let s = 0; for (let y = 0; y < SS; y++) for (let x = 0; x < SS; x++) s += d[((r * SS + y) * TW + c * SS + x) * 4]; let L = s / (SS * SS) / 255;
    L = clamp(Math.pow(L, .7) * 1.45, 0, 1.2) + ((c * 7 + r * 13) % 5 - 2) * .008; const idx = Math.floor(clamp(L, 0, 1) * (ramp.length - 1)); if (idx < 1) continue;
    const [rr, gg, bb] = col(L); g.fillStyle = `rgb(${rr | 0},${gg | 0},${bb | 0})`; g.fillText(ramp[idx], c * CW + CW / 2, r * CH);
  }
  // typed lines at the top and bottom of the screen, a block cursor
  g.textAlign = 'left'; g.font = `${CH + 18}px "VT323", "Courier New", monospace`; g.fillStyle = '#ffb02a';
  const lines = ['> CAM_02.LOG   03:07:41', '> MOTION: 2 OBJECTS AT GLASS', '> AUDIO: tap. tap. tap.']; lines.forEach((s, i) => g.fillText(s, 34, 34 + i * 34));
  g.fillText('> THEY ARE TALLER THAN THE WINDOW', 34, 1760); g.fillText('> _', 34, 1802); if (Math.floor(t * 2) % 2 === 0 || t === 0) { g.fillStyle = '#ffd890'; g.fillRect(34 + 3 * 13 + 4, 1806, 15, 26); }
  // phosphor glow, scanlines, curved glass
  ctx.fillStyle = '#080402'; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.beginPath(); ctx.roundRect(22, 22, W - 44, H - 44, 90); ctx.clip();
  ctx.drawImage(scr, 0, 0); ctx.globalCompositeOperation = 'lighter'; ctx.filter = 'blur(7px)'; ctx.globalAlpha = .75; ctx.drawImage(scr, 0, 0); ctx.filter = 'blur(26px)'; ctx.globalAlpha = .6; ctx.drawImage(scr, 0, 0); ctx.filter = 'none'; ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  for (let y = 0; y < H; y += 3) { ctx.fillStyle = 'rgba(0,0,0,.26)'; ctx.fillRect(0, y + 1, W, 1); }
  const vg = ctx.createRadialGradient(540, 960, 500, 540, 960, 1250); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.6)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  const rf = ctx.createLinearGradient(0, 0, 700, 900); rf.addColorStop(0, 'rgba(255,230,200,.07)'); rf.addColorStop(.4, 'rgba(255,230,200,0)'); ctx.fillStyle = rf; ctx.fillRect(0, 0, W, H); ctx.restore();
  ctx.strokeStyle = 'rgba(255,190,90,.12)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(22, 22, W - 44, H - 44, 90); ctx.stroke();
}
