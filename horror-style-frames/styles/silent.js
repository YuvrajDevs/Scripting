// 1920s Silent Film: an inked drawing in washed greys, printed on silver stock that flickers, weaves and scratches, between theatre curtains.
import { W, H, WIN, FIGS, FAR, MOON, HORIZON, figureGeo, fillFigure, handShape, polyPath, blobPath, ellipsePath, rngOf, vnoise, clamp, lerp, canvasOf } from '../common.js';
const PH = 1440, OY = 240;

function tonal(g) {
  const v = x => `rgb(${x | 0},${x | 0},${x | 0})`, R = rngOf(4);
  g.save(); g.translate(0, -OY);
  g.fillStyle = v(125); g.fillRect(0, OY, W, PH); for (let x = 0; x < W; x += 54) { g.fillStyle = v(104); g.fillRect(x, OY, 3, PH); }
  g.save(); g.beginPath(); g.rect(WIN.x0, WIN.y0, 740, 1100); g.clip();
  let gr = g.createLinearGradient(0, WIN.y0, 0, HORIZON); gr.addColorStop(0, v(28)); gr.addColorStop(1, v(84)); g.fillStyle = gr; g.fillRect(WIN.x0, WIN.y0, 740, 1100);
  gr = g.createRadialGradient(MOON.x, MOON.y, 20, MOON.x, MOON.y, 360); gr.addColorStop(0, 'rgba(240,240,240,.75)'); gr.addColorStop(1, 'rgba(240,240,240,0)'); g.fillStyle = gr; g.fillRect(WIN.x0, WIN.y0, 740, 1100);
  g.fillStyle = v(244); g.beginPath(); g.arc(MOON.x, MOON.y, MOON.r, 0, 7); g.fill();
  g.fillStyle = v(24); g.fillRect(WIN.x0, HORIZON, 740, 600); g.fillStyle = v(12); for (let i = 0; i < 14; i++) { const x = 170 + i * 56 + R() * 20, h = 70 + R() * 90; g.beginPath(); g.moveTo(x - 30, HORIZON); g.lineTo(x, HORIZON - h); g.lineTo(x + 30, HORIZON); g.fill(); }
  g.fillStyle = v(16); for (const f of FAR) { g.fillRect(f.x - 9, HORIZON - f.h, 18, f.h); g.beginPath(); g.arc(f.x, HORIZON - f.h, 14, 0, 7); g.fill(); }
  for (const f of FIGS) {
    const geo = figureGeo(f);
    g.fillStyle = v(48); fillFigure(g, geo, { skipHead: true }); g.fillStyle = v(28); g.beginPath(); blobPath(g, geo.hood); g.fill();
    g.fillStyle = v(216); g.beginPath(); ellipsePath(g, geo.head); g.fill();                                       // chalk-white make-up
    g.fillStyle = v(14); for (const e of geo.eyes) { g.beginPath(); g.ellipse(e.cx, e.cy, e.rx * 1.35, e.ry * 1.5, 0, 0, 7); g.fill(); }  // dark lids
    g.fillStyle = v(34); g.beginPath(); g.ellipse(geo.mouth.cx, geo.mouth.cy, geo.mouth.w, geo.mouth.h * 1.2, 0, 0, 7); g.fill();
    g.fillStyle = v(226); g.strokeStyle = v(226); for (const h of geo.hands) handShape(g, h);
  }
  g.restore();
  g.fillStyle = v(20); g.fillRect(WIN.x0 - 14, WIN.y0 - 14, 768, 20); g.fillRect(WIN.x0 - 14, WIN.y1 - 6, 768, 22); g.fillRect(WIN.x0 - 14, WIN.y0, 20, 1100); g.fillRect(WIN.x1 - 6, WIN.y0, 20, 1100); g.fillRect(530, WIN.y0, 20, 1100); g.fillRect(WIN.x0, 735, 740, 20); g.fillRect(WIN.x0, 1102, 740, 20);
  g.fillStyle = v(100); g.fillRect(150, 1486, 780, 54); g.fillStyle = v(40); g.fillRect(0, 1546, W, 30); g.fillStyle = v(66); g.fillRect(0, 1576, W, 104);
  g.restore();
}

export function draw(ctx, t) {
  const R = rngOf(17 + Math.floor(t * 24)), src = canvasOf(W, PH), g = src.getContext('2d'); tonal(g);
  const b1 = canvasOf(W, PH), b2 = canvasOf(W, PH); let q = b1.getContext('2d'); q.filter = 'blur(1.4px)'; q.drawImage(src, 0, 0); q = b2.getContext('2d'); q.filter = 'blur(4px)'; q.drawImage(src, 0, 0);
  const a = g.getImageData(0, 0, W, PH), A = a.data, B1 = b1.getContext('2d').getImageData(0, 0, W, PH).data, B2 = b2.getContext('2d').getImageData(0, 0, W, PH).data, flick = .96 + .04 * Math.sin(t * 13) + (R() - .5) * .02;
  for (let y = 0; y < PH; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4; let l = A[i] / 255; const edge = (B1[i] - B2[i]) / 255;
    if (edge < -.02) l *= 1 - clamp(-edge * 6, 0, .75);                                      // the Redraw: contours inked on the tone
    if (A[i] < 100 && ((x * .8 + y) % 9) < 1.3) l *= .78;                                     // hatching in the shadows
    l = l * l * (3 - 2 * l) * .6 + l * .4; l = (.055 + .875 * l) * flick;                    // S-curve, print black and white
    const grain = (R() - .5) * .07; l += grain;
    A[i] = clamp((l * 1.08 + .012) * 255, 0, 255); A[i + 1] = clamp(l * 255, 0, 255); A[i + 2] = clamp((l * .86 - .008) * 255, 0, 255); A[i + 3] = 255;   // a little silver-sepia
  }
  g.putImageData(a, 0, 0);
  for (let i = 0; i < 9; i++) { const x = R() * W, y0 = R() * PH * .5; g.strokeStyle = R() > .4 ? 'rgba(245,240,230,.55)' : 'rgba(10,8,6,.5)'; g.lineWidth = .8 + R() * 1.4; g.beginPath(); g.moveTo(x, y0); g.lineTo(x + (R() - .5) * 8, y0 + 200 + R() * 700); g.stroke(); }
  for (let i = 0; i < 120; i++) { g.fillStyle = R() > .5 ? 'rgba(245,240,230,.7)' : 'rgba(10,8,6,.6)'; g.beginPath(); g.arc(R() * W, R() * PH, .6 + R() * 2.2, 0, 7); g.fill(); }
  let gr = g.createRadialGradient(540, PH / 2, 420, 540, PH / 2, 900); gr.addColorStop(0, 'rgba(70,40,15,0)'); gr.addColorStop(1, 'rgba(70,40,15,.55)'); g.fillStyle = gr; g.fillRect(0, 0, W, PH);
  // the picture house: velvet above and below, a rounded aperture
  ctx.fillStyle = '#0a0304'; ctx.fillRect(0, 0, W, H);
  for (let x = 0; x < W; x += 6) { const f = .5 + .5 * Math.sin(x * .045 + 1), s = 40 + f * 50; ctx.fillStyle = `rgb(${s * .7 | 0},${s * .12 | 0},${s * .15 | 0})`; ctx.fillRect(x, 0, 6, OY - 4); ctx.fillRect(x, OY + PH + 4, 6, H - OY - PH - 4); }
  gr = ctx.createLinearGradient(0, OY + PH, 0, H); gr.addColorStop(0, 'rgba(255,170,80,.4)'); gr.addColorStop(.3, 'rgba(255,170,80,0)'); ctx.fillStyle = gr; ctx.fillRect(0, OY + PH, W, H - OY - PH);
  ctx.save(); ctx.beginPath(); ctx.roundRect(8, OY, W - 16, PH, 30); ctx.clip(); ctx.drawImage(src, Math.sin(t * 9) * 1.5, Math.cos(t * 7) * 1.2); ctx.restore();
  ctx.strokeStyle = 'rgba(0,0,0,.8)'; ctx.lineWidth = 16; ctx.beginPath(); ctx.roundRect(8, OY, W - 16, PH, 30); ctx.stroke();
}
