// Woodcut Print: black is the wood, white is what the knife removed. Light is carved; the print edge is ragged ink.
import { W, H, WIN, FIGS, FAR, MOON, HORIZON, figureGeo, fingersOf, polyPath, blobPath, ellipsePath, rngOf, vnoise, clamp, lerp, canvasOf } from '../common.js';

export function draw(ctx, t) {
  const R = rngOf(31);
  ctx.fillStyle = '#efe6d0'; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 600; i++) { const x = R() * W, y = R() * H, a = R() * 6.28, l = 10 + R() * 40; ctx.strokeStyle = `rgba(120,98,60,${R() * .07})`; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); ctx.stroke(); }
  const blk = canvasOf(W, H), b = blk.getContext('2d'), M = { x0: 70, y0: 90, x1: 1010, y1: 1730 };
  // the block: a black field with a ragged printed edge
  b.fillStyle = '#0c0a09'; b.beginPath(); const e = (x, y) => [x + (vnoise(x * .05, y * .05) - .5) * 14, y + (vnoise(y * .05, x * .05, 2) - .5) * 14];
  b.moveTo(...e(M.x0, M.y0)); for (let x = M.x0; x < M.x1; x += 12) b.lineTo(...e(x, M.y0)); for (let y = M.y0; y < M.y1; y += 12) b.lineTo(...e(M.x1, y)); for (let x = M.x1; x > M.x0; x -= 12) b.lineTo(...e(x, M.y1)); for (let y = M.y1; y > M.y0; y -= 12) b.lineTo(...e(M.x0, y)); b.closePath(); b.fill();
  b.lineCap = 'round'; b.lineJoin = 'round';
  const cut = fn => { b.save(); b.globalCompositeOperation = 'destination-out'; b.fillStyle = '#000'; b.strokeStyle = '#000'; fn(b); b.restore(); };
  const ink = fn => { b.save(); b.globalCompositeOperation = 'source-over'; b.fillStyle = '#0c0a09'; b.strokeStyle = '#0c0a09'; fn(b); b.restore(); };
  // sky inside the window panes: a pale moon, a ring, and U-gouge rays that sweep out and taper
  b.save(); b.beginPath(); b.rect(WIN.x0, WIN.y0, 740, 1100); b.clip();
  cut(p => { p.beginPath(); p.arc(MOON.x, MOON.y, MOON.r, 0, 7); p.fill(); p.lineWidth = 9; p.beginPath(); p.arc(MOON.x, MOON.y, MOON.r + 26, .3, 5.9); p.stroke(); p.lineWidth = 5; p.beginPath(); p.arc(MOON.x, MOON.y, MOON.r + 48, 1, 6); p.stroke(); });
  cut(p => { for (let k = 0; k < 44; k++) { const a = k / 44 * 6.283 + (R() - .5) * .08, r0 = 120 + R() * 30, r1 = r0 + 200 + R() * 560, wd = 5 + R() * 11; p.beginPath(); p.moveTo(MOON.x + Math.cos(a - wd / r0 * .5) * r0, MOON.y + Math.sin(a - wd / r0 * .5) * r0); p.lineTo(MOON.x + Math.cos(a) * r1, MOON.y + Math.sin(a) * r1); p.lineTo(MOON.x + Math.cos(a + wd / r0 * .5) * r0, MOON.y + Math.sin(a + wd / r0 * .5) * r0); p.closePath(); p.fill(); } });
  cut(p => { p.lineWidth = 3; for (let y = 400; y < HORIZON - 20; y += 20) { const d = Math.abs(y - MOON.y); if (R() < d / 500) continue; p.beginPath(); const x0 = 180 + R() * 400; p.moveTo(x0, y); p.quadraticCurveTo(x0 + 120, y - 10, x0 + 180 + R() * 140, y + 2); p.stroke(); } });
  // far trees and watchers: black silhouettes with a white knife line
  const pine = (x, h) => { b.beginPath(); b.moveTo(x - 34, HORIZON + 6); b.lineTo(x, HORIZON - h); b.lineTo(x + 34, HORIZON + 6); b.closePath(); };
  b.fillStyle = '#0c0a09'; b.fillRect(WIN.x0, HORIZON, 740, 600);
  for (let i = 0; i < 14; i++) { const x = 170 + i * 56 + (i * 37 % 20), h = 80 + (i * 53 % 90); cut(p => { p.lineWidth = 9; pine(x, h); p.stroke(); }); ink(() => { pine(x, h); b.fill(); }); }
  for (const f of FAR) { cut(p => { p.lineWidth = 12; p.strokeRect(f.x - 9, HORIZON - f.h, 18, f.h); p.beginPath(); p.arc(f.x, HORIZON - f.h, 14, 0, 7); p.stroke(); }); ink(() => { b.fillRect(f.x - 9, HORIZON - f.h, 18, f.h); b.beginPath(); b.arc(f.x, HORIZON - f.h, 14, 0, 7); b.fill(); }); }
  cut(p => { p.lineWidth = 2.5; for (let y = HORIZON + 50; y < 1450; y += 36) for (let k = 0; k < 6; k++) { const x = 180 + R() * 700; p.beginPath(); p.moveTo(x, y); p.quadraticCurveTo(x + 14, y - 14, x + 28, y - 4); p.stroke(); } for (let i = 0; i < 160; i++) { p.beginPath(); p.arc(180 + R() * 720, HORIZON + 30 + R() * 500, 1.2 + R() * 2.6, 0, 7); p.fill(); } });
  b.restore();
  // frame bars stay black but get a white knife line either side
  const bars = [[WIN.x0 - 14, WIN.y0 - 14, 768, 20], [WIN.x0 - 14, WIN.y1 - 6, 768, 22], [WIN.x0 - 14, WIN.y0, 20, 1100], [WIN.x1 - 6, WIN.y0, 20, 1100], [530, WIN.y0, 20, 1100], [WIN.x0, 735, 740, 20], [WIN.x0, 1102, 740, 20]];
  ink(() => { for (const [x, y, w, h] of bars) b.fillRect(x, y, w, h); });
  // interior wall: mostly black, a few long knife lines
  cut(p => { p.lineWidth = 3; for (let x = 100; x < 1000; x += 38) { if (x > WIN.x0 - 30 && x < WIN.x1 + 30) continue; p.beginPath(); p.moveTo(x, 140 + R() * 40); p.lineTo(x + (R() - .5) * 10, 700 + R() * 700); p.stroke(); } p.lineWidth = 2.5; p.strokeRect(150, 1486, 780, 54); for (let x = 170; x < 920; x += 24) { p.beginPath(); p.moveTo(x, 1500); p.lineTo(x + 8, 1530); p.stroke(); } });
  // the figures: black body, white knife halo, carved white skin, features left black, grazing light on the upper-left edges
  FIGS.forEach((f, k) => {
    const geo = figureGeo(f), { head } = geo;
    cut(p => { p.lineWidth = 16; p.lineJoin = 'round'; p.beginPath(); polyPath(p, geo.torso); p.stroke(); p.beginPath(); blobPath(p, geo.hood); p.stroke(); for (const a of geo.arms) { p.lineWidth = a.w + 16; p.beginPath(); polyPath(p, a.pts, false); p.stroke(); } });
    ink(() => { b.beginPath(); polyPath(b, geo.torso); b.fill(); b.beginPath(); blobPath(b, geo.hood); b.fill(); for (const a of geo.arms) { b.lineWidth = a.w; b.beginPath(); polyPath(b, a.pts, false); b.stroke(); } });
    cut(p => {
      p.lineWidth = 3.2; for (let i = 1; i <= 9; i++) { p.beginPath(); p.moveTo(f.cx - 62 * f.s - i * 4, geo.sh + 6 * f.s + i * 14); p.quadraticCurveTo(f.cx - 130 * f.s - i * 5, geo.sh + 50 * f.s + i * 16, f.cx - 168 * f.s - i * 8, geo.sh + 220 * f.s + i * 18); p.stroke(); }
      for (let i = 0; i < 6; i++) { p.beginPath(); p.moveTo(head.cx - head.rx * 1.18 + i * 7, head.cy - head.ry * .4 + i * 10); p.quadraticCurveTo(head.cx - head.rx * 1.3 + i * 6, head.cy + head.ry * .3, head.cx - head.rx * 1.22 + i * 5, head.cy + head.ry * .8); p.stroke(); }
      for (const a of geo.arms) { p.lineWidth = 3; p.beginPath(); p.moveTo(a.pts[0][0] - a.w * .25, a.pts[0][1]); p.lineTo(a.pts[1][0] - a.w * .3, a.pts[1][1]); p.stroke(); }
    });
    cut(p => { p.beginPath(); ellipsePath(p, { cx: head.cx, cy: head.cy, rx: head.rx + 8, ry: head.ry + 8 }); p.fill(); });
    ink(() => { b.beginPath(); ellipsePath(b, head); b.fill(); });
    cut(p => { p.beginPath(); ellipsePath(p, { cx: head.cx, cy: head.cy, rx: head.rx - 8, ry: head.ry - 8 }); p.fill(); });   // skin carved white
    ink(() => {
      for (const e of geo.eyes) { b.beginPath(); b.ellipse(e.cx, e.cy, e.rx * 1.15, e.ry * 1.2, e.cx < f.cx ? .2 : -.2, 0, 7); b.fill(); }
      b.beginPath(); b.ellipse(geo.mouth.cx, geo.mouth.cy, geo.mouth.w, geo.mouth.h, 0, 0, 7); b.fill();
      b.lineWidth = 3.4; b.beginPath(); b.moveTo(head.cx, head.cy - head.ry * .05); b.lineTo(head.cx - 9 * f.s, head.cy + head.ry * .3); b.lineTo(head.cx + 7 * f.s, head.cy + head.ry * .32); b.stroke();
      b.lineWidth = 2.6; for (let i = 0; i < 6; i++) { b.beginPath(); b.moveTo(head.cx + head.rx * .5 + i * 6, head.cy - head.ry * .6 + i * 18); b.quadraticCurveTo(head.cx + head.rx * .9, head.cy + i * 14, head.cx + head.rx * .7 - i * 4, head.cy + head.ry * .9); b.stroke(); }
    });
    for (const h of geo.hands) {
      cut(p => { p.lineWidth = 30 * h.s; p.beginPath(); p.ellipse(h.x, h.y + 22 * h.s, 52 * h.s, 60 * h.s, 0, 0, 7); p.fill(); for (const fg of fingersOf(h)) { p.lineWidth = fg.w + 14; p.beginPath(); p.moveTo(fg.x0, fg.y0); p.lineTo(fg.x1, fg.y1); p.stroke(); } });
      ink(() => { b.beginPath(); b.ellipse(h.x, h.y + 22 * h.s, 44 * h.s, 52 * h.s, 0, 0, 7); b.fill(); for (const fg of fingersOf(h)) { b.lineWidth = fg.w; b.beginPath(); b.moveTo(fg.x0, fg.y0); b.lineTo(fg.x1, fg.y1); b.stroke(); } });
      cut(p => { p.beginPath(); p.ellipse(h.x, h.y + 22 * h.s, 36 * h.s, 44 * h.s, 0, 0, 7); p.fill(); for (const fg of fingersOf(h)) { p.lineWidth = fg.w - 8; p.beginPath(); p.moveTo(fg.x0, fg.y0); p.lineTo(fg.x1, fg.y1); p.stroke(); } });
    }
  });
  // printing: wood grain streaks, spots where the ink did not take
  b.save(); b.globalCompositeOperation = 'source-atop'; for (let i = 0; i < 260; i++) { b.strokeStyle = `rgba(70,58,46,${.04 + R() * .1})`; b.lineWidth = .8 + R() * 2; const y = R() * H, x = R() * W; b.beginPath(); b.moveTo(x, y); b.lineTo(x + 120 + R() * 380, y + (R() - .5) * 16); b.stroke(); } b.restore();
  b.save(); b.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 1100; i++) { b.fillStyle = `rgba(0,0,0,${.5 + R() * .5})`; b.beginPath(); b.arc(R() * W, R() * H, .6 + R() * 1.9, 0, 7); b.fill(); } b.restore();
  ctx.drawImage(blk, 0, 0);
  ctx.fillStyle = '#1a1410'; ctx.font = 'italic 40px "Times New Roman", Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText('Three knocks, and then the fourth.', 540, 1812); ctx.textAlign = 'left';
}
