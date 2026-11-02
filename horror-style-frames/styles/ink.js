// Chinese Ink Wash: black ink in five tones on warm rice paper, loaded brushstrokes, empty space, one vermilion seal.
import { W, H, WIN, FIGS, FAR, MOON, HORIZON, figureGeo, fingersOf, polyPath, blobPath, ellipsePath, rngOf, vnoise, fbm, lerp, clamp, canvasOf } from '../common.js';

export function draw(ctx, t) {
  const R = rngOf(21);
  ctx.fillStyle = '#f2ecde'; ctx.fillRect(0, 0, W, H);
  const nz = canvasOf(135, 240), n = nz.getContext('2d'), nd = n.createImageData(135, 240);
  for (let y = 0; y < 240; y++) for (let x = 0; x < 135; x++) { const k = (y * 135 + x) * 4; nd.data[k] = 60; nd.data[k + 1] = 48; nd.data[k + 2] = 30; nd.data[k + 3] = clamp((fbm(x * .07, y * .07, 3, 4) - .4) * 110, 0, 255); }
  n.putImageData(nd, 0, 0); ctx.imageSmoothingEnabled = true; ctx.drawImage(nz, 0, 0, W, H);
  for (let i = 0; i < 520; i++) { const x = R() * W, y = R() * H, a = R() * 6.28, l = 20 + R() * 70; ctx.strokeStyle = `rgba(120,100,70,${R() * .07})`; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + Math.cos(a) * l * .5 + R() * 8, y + Math.sin(a) * l * .5 + R() * 8, x + Math.cos(a) * l, y + Math.sin(a) * l); ctx.stroke(); }
  ctx.globalCompositeOperation = 'multiply';
  const INK = a => `rgba(32,28,26,${a})`;
  const BL = canvasOf(W, H), bc = BL.getContext('2d');
  // a loaded, bristled stroke: the dark edge is the contour
  function brush(pts, o) {
    const { w = 30, tone = .8, dry = .2, bristles = 16, seed = 1 } = o, r = rngOf(seed), P = [];
    for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1], m = Math.max(2, Math.hypot(b[0] - a[0], b[1] - a[1]) / 6 | 0); for (let k = 0; k < m; k++) P.push([lerp(a[0], b[0], k / m), lerp(a[1], b[1], k / m)]); }
    P.push(pts[pts.length - 1]); const N = P.length; bc.lineCap = 'round';
    for (let b = 0; b < bristles; b++) {
      const off = b / (bristles - 1) - .5, al = .62 * tone * Math.min(1, .55 + .9 * (b / (bristles - 1))) * (.6 + r() * .4); bc.lineWidth = Math.max(2.5, w / bristles * (2.4 + r() * 1.2));
      for (let i = 1; i < N; i++) {
        const u = i / N, press = Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.15 + .05)), .6) * (.45 + .55 * (1 - u * .5)), cut = dry * (.3 + .7 * u);
        if (vnoise(b * 7.1, i * .12, seed) < cut * 1.1) continue;
        const tx = P[i][0] - P[i - 1][0], ty = P[i][1] - P[i - 1][1], tl = Math.hypot(tx, ty) || 1, nx = -ty / tl, ny = tx / tl, o1 = off * w * press;
        bc.strokeStyle = INK(al * (1 - cut * .4)); bc.beginPath(); bc.moveTo(P[i - 1][0] + nx * o1, P[i - 1][1] + ny * o1); bc.lineTo(P[i][0] + nx * o1, P[i][1] + ny * o1); bc.stroke();
      }
    }
  }
  // a wet wash that bleeds, with pigment gathering at its edge
  function wash(pathFn, tone, blur = 8, edge = .5, evenodd = false) {
    const c = canvasOf(W, H), p = c.getContext('2d'), c2 = canvasOf(W, H), q = c2.getContext('2d');
    p.fillStyle = INK(tone); p.beginPath(); pathFn(p); p.fill(evenodd ? 'evenodd' : 'nonzero'); q.filter = `blur(${blur}px)`; q.drawImage(c, 0, 0);
    p.clearRect(0, 0, W, H); p.strokeStyle = INK(tone * edge); p.lineWidth = 5; p.beginPath(); pathFn(p); p.stroke(); q.filter = 'blur(2px)'; q.drawImage(c, 0, 0); q.filter = 'none';
    ctx.drawImage(c2, 0, 0);
  }
  // mist, far ground, moss dots
  wash(p => p.rect(120, 770, 840, 110), .16, 36); wash(p => p.rect(60, 1010, 960, 60), .14, 40);
  wash(p => { p.moveTo(160, HORIZON + 30); for (let x = 160; x <= 920; x += 40) p.lineTo(x, HORIZON - 40 - vnoise(x * .02, 1) * 90 + (x % 80 ? 0 : -30)); p.lineTo(920, HORIZON + 30); p.closePath(); }, .34, 12);
  ctx.fillStyle = INK(.9); for (let i = 0; i < 46; i++) { ctx.beginPath(); ctx.arc(170 + R() * 740, HORIZON - 10 - R() * 90, 2 + R() * 3, 0, 7); ctx.fill(); }
  ctx.strokeStyle = INK(.16); ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(MOON.x, MOON.y, MOON.r + 10, 2.4, 5.2); ctx.stroke();
  // the window, as dry loaded strokes
  brush([[150, 392], [932, 386]], { w: 44, tone: .84, dry: .35, seed: 2 }); brush([[176, 380], [172, 1480]], { w: 40, tone: .84, dry: .35, seed: 3 }); brush([[906, 380], [912, 1480]], { w: 40, tone: .84, dry: .35, seed: 4 });
  brush([[130, 1498], [950, 1502]], { w: 92, tone: .9, dry: .25, bristles: 26, seed: 5 });
  brush([[540, 392], [542, 1476]], { w: 24, tone: .6, dry: .5, seed: 6 }); brush([[180, 745], [900, 748]], { w: 20, tone: .5, dry: .5, seed: 7 }); brush([[180, 1112], [900, 1110]], { w: 20, tone: .5, dry: .5, seed: 8 });
  // two figures: a pale wash for the body, an empty face, loaded strokes for the hood
  FIGS.forEach((f, k) => {
    const geo = figureGeo(f), { head } = geo;
    wash(p => polyPath(p, geo.torso), .3, 10);
    wash(p => { blobPath(p, geo.hood); ellipsePath(p, head); }, .34, 8, .5, true);
    const rx = head.rx, ry = head.ry, cx = f.cx, cy = head.cy;
    brush([[cx - rx * .7, cy - ry * 1.15], [cx - rx * 1.3, cy - ry * .1], [cx - rx * 1.38, cy + ry * .95]], { w: 50 * f.s, tone: .82, dry: .2, bristles: 20, seed: 10 + k });
    brush([[cx + rx * .7, cy - ry * 1.15], [cx + rx * 1.3, cy - ry * .1], [cx + rx * 1.38, cy + ry * .95]], { w: 50 * f.s, tone: .82, dry: .2, bristles: 20, seed: 12 + k });
    brush([[cx - rx * .8, cy - ry * 1.2], [cx, cy - ry * 1.36], [cx + rx * .8, cy - ry * 1.2]], { w: 40 * f.s, tone: .86, dry: .15, seed: 14 + k });
    for (const e of geo.eyes) brush([[e.cx - e.rx * .7, e.cy], [e.cx + e.rx * .7, e.cy + 2]], { w: e.ry * 2.4, tone: .96, dry: 0, bristles: 8, seed: 20 + k });
    brush([[geo.mouth.cx - geo.mouth.w * .8, geo.mouth.cy], [geo.mouth.cx + geo.mouth.w * .8, geo.mouth.cy]], { w: 10, tone: .82, dry: 0, bristles: 6, seed: 25 });
    for (const a of geo.arms) brush(a.pts, { w: a.w * .75, tone: .6, dry: .3, seed: 30 + k });
    for (const h of geo.hands) for (const fg of fingersOf(h)) brush([[fg.x0, fg.y0], [fg.x1, fg.y1]], { w: 11, tone: .6, dry: .1, bristles: 6, seed: 40 });
    brush([[cx - 40 * f.s, geo.sh + 140 * f.s], [cx - 60 * f.s, 1500]], { w: 28, tone: .5, dry: .4, seed: 50 + k });
    brush([[cx + 60 * f.s, geo.sh + 140 * f.s], [cx + 80 * f.s, 1500]], { w: 28, tone: .5, dry: .4, seed: 52 + k });
  });
  ctx.save(); ctx.filter = 'blur(1.3px)'; ctx.drawImage(BL, 0, 0); ctx.restore();
  // the knocking: three small open rings, as water ripples
  ctx.strokeStyle = INK(.5); ctx.lineWidth = 4; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(200, 740, 70 + i * 26, -1.2, -.1); ctx.stroke(); }
  // the single vermilion seal
  ctx.save(); ctx.translate(150, 1690); ctx.rotate(-.05); ctx.fillStyle = 'rgba(176,46,34,.92)'; ctx.fillRect(-58, -58, 116, 116);
  ctx.globalCompositeOperation = 'source-over'; ctx.strokeStyle = '#f2ecde'; ctx.lineWidth = 9; ctx.lineCap = 'butt';
  ctx.beginPath(); ctx.moveTo(-30, -32); ctx.lineTo(30, -32); ctx.moveTo(0, -32); ctx.lineTo(0, 36); ctx.moveTo(-34, 0); ctx.lineTo(34, 0); ctx.moveTo(-26, 34); ctx.lineTo(-6, 18); ctx.moveTo(26, 34); ctx.lineTo(6, 18); ctx.stroke();
  ctx.lineWidth = 6; ctx.strokeRect(-52, -52, 104, 104); ctx.restore();
  ctx.globalCompositeOperation = 'multiply'; const gr = ctx.createRadialGradient(540, 960, 500, 540, 960, 1250); gr.addColorStop(0, 'rgba(240,230,205,0)'); gr.addColorStop(1, 'rgba(150,130,100,.35)'); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
}
