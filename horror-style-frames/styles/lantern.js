// Paper-cut Lightbox: parallel cut-paper sheets in a shallow box, lit from behind. Back layers pale and translucent, front layers dark.
import { W, H, FIGS, FAR, MOON, HORIZON, figureGeo, fillFigure, paneRects, polyPath, ellipsePath, rngOf, canvasOf } from '../common.js';

export function draw(ctx, t) {
  const R = rngOf(8);
  const bg = ctx.createRadialGradient(MOON.x, MOON.y, 20, MOON.x, MOON.y, 1300); bg.addColorStop(0, '#fff0c4'); bg.addColorStop(.25, '#ffd58a'); bg.addColorStop(1, '#7a4a28'); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  // one paper sheet: flat colour, cut holes, a warm rim on its top edge, a dark band on its bottom edge, fibre grain
  function sheet(color, build, carve, o = {}) {
    const c = canvasOf(W, H), p = c.getContext('2d'); p.fillStyle = color; p.strokeStyle = color; build(p);
    if (carve) { p.globalCompositeOperation = 'destination-out'; p.fillStyle = '#000'; p.strokeStyle = '#000'; carve(p); p.globalCompositeOperation = 'source-over'; }
    const rim = canvasOf(W, H), rp = rim.getContext('2d'); rp.drawImage(c, 0, 0); rp.globalCompositeOperation = 'destination-out'; rp.drawImage(c, 0, 4); rp.globalCompositeOperation = 'source-in'; rp.fillStyle = o.rim || 'rgba(255,225,170,.9)'; rp.fillRect(0, 0, W, H);
    const sh = canvasOf(W, H), sp = sh.getContext('2d'); sp.drawImage(c, 0, 0); sp.globalCompositeOperation = 'destination-out'; sp.drawImage(c, 0, -4); sp.globalCompositeOperation = 'source-in'; sp.fillStyle = 'rgba(0,0,10,.55)'; sp.fillRect(0, 0, W, H);
    p.drawImage(rim, 0, 0); p.drawImage(sh, 0, 0); p.globalCompositeOperation = 'source-atop';
    for (let i = 0; i < 700; i++) { p.strokeStyle = `rgba(${R() > .5 ? '255,255,255' : '0,0,20'},${R() * .07})`; p.lineWidth = 1; const x = R() * W, y = R() * H, a = R() * 6.28, l = 10 + R() * 30; p.beginPath(); p.moveTo(x, y); p.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); p.stroke(); }
    p.globalCompositeOperation = 'source-over'; return c;
  }
  const put = (c, shadow = true) => { ctx.save(); if (shadow) { ctx.shadowColor = 'rgba(0,0,12,.55)'; ctx.shadowBlur = 26; ctx.shadowOffsetY = 14; } ctx.drawImage(c, 0, 0); ctx.restore(); };
  const pines = (p, y0, hMin, hMax, step) => { for (let x = 140; x < 950; x += step) { const h = hMin + R() * (hMax - hMin); p.beginPath(); p.moveTo(x - 34, y0); p.lineTo(x + R() * 8, y0 - h); p.lineTo(x + 34, y0); p.fill(); } };
  // 1. sky: pale and translucent, the moon a hole that lets the lamp through
  put(sheet('#d3d8f0', p => p.fillRect(0, 0, W, H), p => { p.beginPath(); p.arc(MOON.x, MOON.y, MOON.r, 0, 7); p.fill(); for (let i = 0; i < 26; i++) { p.beginPath(); p.arc(180 + R() * 700, 400 + R() * 400, 2 + R() * 3, 0, 7); p.fill(); } }), false);
  // 2. far trees, 3. far watchers, 4. hills with a fence
  put(sheet('#9fb2dc', p => { p.fillRect(140, HORIZON, 800, 700); pines(p, HORIZON + 4, 90, 190, 44); }));
  put(sheet('#667fb6', p => { for (const f of FAR) { p.fillRect(f.x - 9, HORIZON - f.h + 10, 18, f.h); p.beginPath(); p.arc(f.x, HORIZON - f.h + 10, 14, 0, 7); p.fill(); } }));
  put(sheet('#5470a8', p => { p.beginPath(); p.moveTo(140, 1000); for (let x = 140; x <= 940; x += 40) p.lineTo(x, 960 + 30 * Math.sin(x * .01)); p.lineTo(940, 1500); p.lineTo(140, 1500); p.closePath(); p.fill(); for (let x = 170; x < 940; x += 70) p.fillRect(x, 940 + 30 * Math.sin(x * .01), 10, 70); }));
  // light that burns through the eye holes
  const geos = FIGS.map(figureGeo); ctx.save(); ctx.globalCompositeOperation = 'screen';
  for (const geo of geos) for (const e of geo.eyes) { const gr = ctx.createRadialGradient(e.cx, e.cy, 2, e.cx, e.cy, 120); gr.addColorStop(0, 'rgba(255,190,70,1)'); gr.addColorStop(.4, 'rgba(255,150,40,.8)'); gr.addColorStop(1, 'rgba(255,120,20,0)'); ctx.fillStyle = gr; ctx.fillRect(e.cx - 130, e.cy - 130, 260, 260); }
  ctx.restore();
  // 5. the two tall figures, cut with eyes, mouths and cloth slits
  put(sheet('#161f46', p => { for (const geo of geos) { p.fillStyle = '#161f46'; fillFigure(p, geo); } }, p => {
    for (const geo of geos) {
      for (const e of geo.eyes) { p.beginPath(); p.ellipse(e.cx, e.cy, e.rx * 1.7, e.ry * .95, e.cx < geo.cx ? .3 : -.3, 0, 7); p.fill(); }
      p.beginPath(); p.ellipse(geo.mouth.cx, geo.mouth.cy, geo.mouth.w * .6, geo.mouth.h * .5, 0, 0, 7); p.fill();
      for (let y = geo.sh + 140; y < 1500; y += 52) for (let x = geo.cx - 170 * geo.s; x < geo.cx + 170 * geo.s; x += 44) p.fillRect(x + (Math.round(y / 52) % 2) * 20, y, 6, 22);
    }
  }));
  // lamp spill on the back sheets only: the front stays opaque and dark
  ctx.save(); ctx.globalCompositeOperation = 'screen'; let gr = ctx.createRadialGradient(MOON.x, MOON.y, 30, MOON.x, MOON.y, 820); gr.addColorStop(0, 'rgba(255,200,110,.55)'); gr.addColorStop(1, 'rgba(255,170,80,0)'); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H); ctx.restore();
  // 6. the window sheet and curtains: nearest, almost black, with the panes cut out
  put(sheet('#0b1230', p => p.fillRect(0, 0, W, H), p => { for (const r of paneRects(10)) p.fillRect(r.x, r.y, r.w, r.h); }));
  put(sheet('#050818', p => { p.beginPath(); p.moveTo(0, 0); p.lineTo(150, 0); p.quadraticCurveTo(110, 900, 140, H); p.lineTo(0, H); p.fill(); p.beginPath(); p.moveTo(W, 0); p.lineTo(930, 0); p.quadraticCurveTo(970, 900, 940, H); p.lineTo(W, H); p.fill(); }, p => { for (let y = 200; y < 1700; y += 150) { p.fillRect(60, y, 5, 90); p.fillRect(W - 66, y + 40, 5, 90); } }));
  // bloom on the moon, soft vignette
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.filter = 'blur(26px)'; ctx.fillStyle = 'rgba(255,230,170,.7)'; ctx.beginPath(); ctx.arc(MOON.x, MOON.y, MOON.r + 10, 0, 7); ctx.fill(); ctx.restore();
  gr = ctx.createRadialGradient(540, 960, 520, 540, 960, 1250); gr.addColorStop(0, 'rgba(0,0,10,0)'); gr.addColorStop(1, 'rgba(0,0,10,.55)'); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
}
