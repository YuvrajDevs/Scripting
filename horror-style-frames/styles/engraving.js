// Copperplate Engraving: tone is made of lines, never fills. Every line swells and tapers. Paper and one warm black ink.
import { W, H, WIN, FIGS, FAR, MOON, HORIZON, figureGeo, fingersOf, polyPath, blobPath, ellipsePath, rngOf, vnoise, clamp, lerp, ss, canvasOf } from '../common.js';

export function draw(ctx, t) {
  const R = rngOf(6), g = ctx, INK = '#1c1510';
  g.fillStyle = '#f1e8d2'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 700; i++) { const x = R() * W, y = R() * H, a = R() * 6.28, l = 12 + R() * 50; g.strokeStyle = `rgba(120,98,60,${R() * .07})`; g.lineWidth = .7; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(150,100,40,${R() * .12})`; g.beginPath(); g.arc(R() * W, R() * H, 2 + R() * 7, 0, 7); g.fill(); }

  // hatching: lines run across a region, switch on where tone passes a threshold, swell mid-run and taper to a point
  function hatch(bbox, inside, tone, o) {
    const { angle, space, w, thr = 0, seed = 1 } = o, r = rngOf(seed), ca = Math.cos(angle), sa = Math.sin(angle), nx = -sa, ny = ca;
    g.save(); g.beginPath(); inside(g); g.clip(); g.lineCap = 'round'; g.strokeStyle = INK;
    let omin = 1e9, omax = -1e9, smin = 1e9, smax = -1e9;
    for (const [x, y] of [[bbox[0], bbox[1]], [bbox[2], bbox[1]], [bbox[0], bbox[3]], [bbox[2], bbox[3]]]) { const oo = x * nx + y * ny, s2 = x * ca + y * sa; omin = Math.min(omin, oo); omax = Math.max(omax, oo); smin = Math.min(smin, s2); smax = Math.max(smax, s2); }
    for (let o2 = omin; o2 <= omax; o2 += space * (.9 + r() * .2)) {
      let run = []; const flush = () => { const n = run.length; if (n > 1) for (let i = 1; i < n; i++) { const u = i / (n - 1), sw = .2 + .8 * Math.pow(Math.sin(Math.PI * u), .7), tv = run[i].t; g.lineWidth = Math.max(.35, w * sw * (.4 + .9 * clamp((tv - thr) / (1 - thr), 0, 1))); g.beginPath(); g.moveTo(run[i - 1].x, run[i - 1].y); g.lineTo(run[i].x, run[i].y); g.stroke(); } run = []; };
      for (let s = smin; s <= smax; s += 4) { const x = nx * o2 + ca * s, y = ny * o2 + sa * s; if (x < bbox[0] - 4 || x > bbox[2] + 4 || y < bbox[1] - 4 || y > bbox[3] + 4) { flush(); continue; } const tv = tone(x, y); if (tv > thr) run.push({ x, y, t: tv }); else flush(); }
      flush();
    }
    g.restore();
  }
  // a contour cut in swelling runs
  function contour(pts, w, closed = true) {
    const P = closed ? [...pts, pts[0]] : pts; g.strokeStyle = INK; g.lineCap = 'round';
    for (let i = 1; i < P.length; i++) { const u = i / (P.length - 1), sw = .55 + .8 * Math.abs(Math.sin(Math.PI * u * 2 + 1)); g.lineWidth = w * sw; g.beginPath(); g.moveTo(P[i - 1][0], P[i - 1][1]); g.lineTo(P[i][0], P[i][1]); g.stroke(); }
  }
  const ell = (e, n = 48) => Array.from({ length: n }, (_, i) => [e.cx + Math.cos(i / n * 6.283) * e.rx, e.cy + Math.sin(i / n * 6.283) * e.ry]);
  const win = [WIN.x0, WIN.y0, WIN.x1, WIN.y1], winPath = p => p.rect(WIN.x0, WIN.y0, 740, 1100);
  const dm = (x, y) => Math.hypot(x - MOON.x, y - MOON.y);
  // sky: bare paper at the moon, horizontal lines darkening away, a crossing family in the dark
  const sky = (x, y) => y > HORIZON ? 0 : (dm(x, y) < MOON.r + 12 ? 0 : clamp(.14 + .8 * ss(60, 760, dm(x, y)) - .12 * ss(HORIZON - 300, HORIZON, y), 0, 1));
  hatch(win, winPath, sky, { angle: .02, space: 7, w: 1.7, thr: .08, seed: 1 }); hatch(win, winPath, sky, { angle: .6, space: 9, w: 1.3, thr: .5, seed: 2 });
  g.strokeStyle = INK; g.lineWidth = 2.4; g.beginPath(); g.arc(MOON.x, MOON.y, MOON.r + 10, 0, 7); g.stroke(); g.lineWidth = 1; g.beginPath(); g.arc(MOON.x, MOON.y, MOON.r + 16, 0, 7); g.stroke();
  // ground and trees: dense, crossed
  const ground = (x, y) => y < HORIZON ? 0 : clamp(.8 - .25 * ss(HORIZON, 1400, y), 0, 1);
  const groundPath = p => p.rect(WIN.x0, HORIZON, 740, 600);
  hatch([WIN.x0, HORIZON, WIN.x1, WIN.y1], groundPath, ground, { angle: .9, space: 6, w: 1.8, thr: .1, seed: 3 }); hatch([WIN.x0, HORIZON, WIN.x1, WIN.y1], groundPath, ground, { angle: -.55, space: 7, w: 1.4, thr: .5, seed: 4 });
  const treePath = p => { for (let i = 0; i < 14; i++) { const x = 170 + i * 56 + (i * 37 % 20), h = 80 + (i * 53 % 90); p.moveTo(x - 30, HORIZON); p.lineTo(x, HORIZON - h); p.lineTo(x + 30, HORIZON); p.closePath(); } };
  hatch([WIN.x0, HORIZON - 200, WIN.x1, HORIZON], treePath, () => .95, { angle: 1.2, space: 4.5, w: 1.6, thr: .1, seed: 5 }); hatch([WIN.x0, HORIZON - 200, WIN.x1, HORIZON], treePath, () => .95, { angle: .4, space: 5, w: 1.2, thr: .5, seed: 6 });
  for (const f of FAR) hatch([f.x - 20, HORIZON - f.h - 20, f.x + 20, HORIZON], p => { p.rect(f.x - 9, HORIZON - f.h, 18, f.h); p.moveTo(f.x + 14, HORIZON - f.h); p.arc(f.x, HORIZON - f.h, 14, 0, 7); }, () => 1, { angle: 1.5, space: 3.2, w: 1.5, thr: 0, seed: 7 });
  // the two figures, lit from the upper left
  FIGS.forEach((f, k) => {
    const geo = figureGeo(f), { head } = geo; g.save(); g.fillStyle = '#f1e8d2'; g.strokeStyle = '#f1e8d2'; g.lineWidth = 18; g.lineJoin = 'round'; g.beginPath(); polyPath(g, geo.torso); g.fill(); g.stroke(); g.beginPath(); blobPath(g, geo.hood); g.fill(); g.stroke(); for (const a of geo.arms) { g.lineWidth = a.w + 18; g.beginPath(); polyPath(g, a.pts, false); g.stroke(); } g.beginPath(); ellipsePath(g, head); g.fill(); g.stroke(); g.restore();
    const bb = pts => [Math.min(...pts.map(p => p[0])), Math.min(...pts.map(p => p[1])), Math.max(...pts.map(p => p[0])), Math.max(...pts.map(p => p[1]))];
    const robe = (x, y) => clamp(.86 + .12 * Math.sin(x * .05 + k) - .1 * ss(1200, 1500, y), 0, 1);
    hatch(bb(geo.torso), p => polyPath(p, geo.torso), robe, { angle: .75 + k * .1, space: 6, w: 2, thr: .1, seed: 10 + k }); hatch(bb(geo.torso), p => polyPath(p, geo.torso), robe, { angle: -.6, space: 7, w: 1.5, thr: .45, seed: 12 + k }); hatch(bb(geo.torso), p => polyPath(p, geo.torso), robe, { angle: 1.57, space: 9, w: 1.2, thr: .8, seed: 14 + k });
    for (const a of geo.arms) { const pts = a.pts, x0 = Math.min(...pts.map(p => p[0])) - 40, x1 = Math.max(...pts.map(p => p[0])) + 40, y0 = Math.min(...pts.map(p => p[1])) - 40, y1 = Math.max(...pts.map(p => p[1])) + 40; hatch([x0, y0, x1, y1], p => { p.lineWidth = a.w; for (let i = 1; i < pts.length; i++) { p.moveTo(pts[i - 1][0] - a.w / 2, pts[i - 1][1]); p.lineTo(pts[i][0] - a.w / 2, pts[i][1]); p.lineTo(pts[i][0] + a.w / 2, pts[i][1]); p.lineTo(pts[i - 1][0] + a.w / 2, pts[i - 1][1]); p.closePath(); } }, () => .72, { angle: .5, space: 5, w: 1.6, thr: .1, seed: 20 + k }); }
    const hbb = bb(geo.hood), hood = () => .92; hatch(hbb, p => blobPath(p, geo.hood), hood, { angle: 1.0, space: 4.5, w: 1.9, thr: .1, seed: 30 + k }); hatch(hbb, p => blobPath(p, geo.hood), hood, { angle: -.7, space: 5.5, w: 1.4, thr: .45, seed: 32 + k });
    const face = (x, y) => clamp(-.12 + 1.05 * (((x - head.cx) / head.rx) * .5 + ((y - head.cy) / head.ry) * .5 + 1) / 2 + .08 * vnoise(x * .05, y * .05), 0, 1);
    hatch([head.cx - head.rx, head.cy - head.ry, head.cx + head.rx, head.cy + head.ry], p => ellipsePath(p, head), face, { angle: .4, space: 5, w: 1.0, thr: .3, seed: 40 + k }); hatch([head.cx - head.rx, head.cy - head.ry, head.cx + head.rx, head.cy + head.ry], p => ellipsePath(p, head), face, { angle: -.8, space: 6, w: 1.1, thr: .62, seed: 42 + k });
    contour(ell(head), 3.2);
    g.fillStyle = INK; for (const e of geo.eyes) { g.beginPath(); ellipsePath(g, { cx: e.cx, cy: e.cy, rx: e.rx * 1.1, ry: e.ry * 1.2 }); g.fill(); }
    g.beginPath(); g.ellipse(geo.mouth.cx, geo.mouth.cy, geo.mouth.w, geo.mouth.h, 0, 0, 7); g.fill();
    g.lineWidth = 1.8; g.beginPath(); g.moveTo(head.cx, head.cy - head.ry * .05); g.lineTo(head.cx - 8 * f.s, head.cy + head.ry * .3); g.lineTo(head.cx + 6 * f.s, head.cy + head.ry * .32); g.stroke();
    contour(geo.torso, 3.6); contour(geo.hood, 3.4);
    for (const a of geo.arms) contour(a.pts.map(p => [p[0] - a.w / 2, p[1]]), 2.6, false);
    for (const h of geo.hands) for (const fg of fingersOf(h)) { g.lineWidth = 2.4; g.beginPath(); g.moveTo(fg.x0 - fg.w / 2, fg.y0); g.lineTo(fg.x1 - fg.w / 2, fg.y1); g.moveTo(fg.x0 + fg.w / 2, fg.y0); g.lineTo(fg.x1 + fg.w / 2, fg.y1); g.stroke(); g.beginPath(); g.arc(fg.x1, fg.y1, fg.w / 2, Math.PI, 0); g.stroke(); }
  });
  // window frame: bars cut from parallel line families, with double contours
  const bars = [[WIN.x0 - 14, WIN.y0 - 14, 768, 20], [WIN.x0 - 14, WIN.y1 - 6, 768, 22], [WIN.x0 - 14, WIN.y0, 20, 1100], [WIN.x1 - 6, WIN.y0, 20, 1100], [530, WIN.y0, 20, 1100], [WIN.x0, 735, 740, 20], [WIN.x0, 1102, 740, 20]];
  bars.forEach(([x, y, w, h], i) => { hatch([x, y, x + w, y + h], p => p.rect(x, y, w, h), (px, py) => .7 + .2 * ss(0, w, px - x), { angle: w > h ? 0 : 1.5708, space: 3.4, w: 1.4, thr: .1, seed: 60 + i }); g.strokeStyle = INK; g.lineWidth = 2.6; g.strokeRect(x, y, w, h); });
  // the wall around, and the sill
  const wallPath = p => { p.rect(70, 110, 940, 1470); p.rect(WIN.x0 - 14, WIN.y0 - 14, 768, 1122); };
  const wall = (x, y) => clamp(.5 + .25 * ss(500, 1500, y) + .2 * vnoise(x * .02, y * .02), 0, 1);
  const hole = p => { p.rect(70, 110, 940, 1470); p.moveTo(WIN.x0 - 14, WIN.y0 - 14); p.lineTo(WIN.x0 - 14, WIN.y1 + 16); p.lineTo(WIN.x1 + 14, WIN.y1 + 16); p.lineTo(WIN.x1 + 14, WIN.y0 - 14); p.closePath(); };
  g.save(); g.beginPath(); hole(g); g.clip(); hatch([70, 110, 1010, 1580], p => p.rect(70, 110, 940, 1470), wall, { angle: 1.5708, space: 8, w: 1.5, thr: .35, seed: 80 }); g.restore();
  hatch([150, 1486, 930, 1540], p => p.rect(150, 1486, 780, 54), () => .55, { angle: 0, space: 5, w: 1.6, thr: .1, seed: 81 }); g.strokeStyle = INK; g.lineWidth = 3; g.strokeRect(150, 1486, 780, 54);
  // plate mark, ruled border, caption
  g.lineWidth = 3; g.strokeStyle = INK; g.strokeRect(70, 110, 940, 1470); g.lineWidth = 1; g.strokeRect(82, 122, 916, 1446);
  g.strokeStyle = 'rgba(90,70,40,.35)'; g.lineWidth = 5; g.strokeRect(46, 86, 988, 1518); g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 2; g.strokeRect(41, 81, 998, 1528);
  g.fillStyle = INK; g.font = 'italic 38px "Times New Roman", Georgia, serif'; g.textAlign = 'center'; g.fillText('Fig. 1.  Visitors at the glass, three o’clock.', 540, 1660); g.font = 'italic 28px "Times New Roman", Georgia, serif'; g.fillText('The elder knocks; its fellow waits.', 540, 1702); g.textAlign = 'left';
}
