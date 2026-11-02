// One moment, drawn ten ways: first person at a night window; two tall pale figures press to the glass, one taps.
export const W = 1080, H = 1920;
export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const ss = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
export function rngOf(seed) { let a = seed | 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const h2 = (x, y, s) => { const n = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453; return n - Math.floor(n); };
export function vnoise(x, y, s = 0) { const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy); return lerp(lerp(h2(ix, iy, s), h2(ix + 1, iy, s), u), lerp(h2(ix, iy + 1, s), h2(ix + 1, iy + 1, s), u), v); }
export function fbm(x, y, s = 0, o = 4) { let a = .5, v = 0; for (let i = 0; i < o; i++) { v += a * vnoise(x, y, s + i); x *= 2.03; y *= 2.03; a *= .5; } return v; }
export const canvasOf = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
export const WIN = { x0: 170, y0: 380, x1: 910, y1: 1480 };
export const GRID = { cols: [170, 540, 910], rows: [380, 745, 1112, 1480] };
export function paneRects(inset = 10) { const out = []; for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) out.push({ x: GRID.cols[c] + inset, y: GRID.rows[r] + inset, w: GRID.cols[c + 1] - GRID.cols[c] - 2 * inset, h: GRID.rows[r + 1] - GRID.rows[r] - 2 * inset }); return out; }
export const FIGS = [{ cx: 392, top: 540, s: 1, pose: 'tap' }, { cx: 706, top: 650, s: .9, pose: 'press' }];
export const FAR = [{ x: 228, h: 120 }, { x: 560, h: 110 }, { x: 872, h: 124 }];
export const MOON = { x: 800, y: 520, r: 84 };
export const HORIZON = 900;
export function figureGeo({ cx, top, s, pose }) {
  const rx = 100 * s, ry = 138 * s, cy = top + ry, nb = cy + ry + 10 * s, sh = nb + 50 * s;
  const head = { cx, cy, rx, ry };
  const hood = [[cx - rx * 1.35, cy + ry * .9], [cx - rx * 1.25, cy - ry * .25], [cx - rx * .8, cy - ry * 1.18], [cx, cy - ry * 1.3], [cx + rx * .8, cy - ry * 1.18], [cx + rx * 1.25, cy - ry * .25], [cx + rx * 1.35, cy + ry * .9], [cx + rx * .6, sh + 20 * s], [cx - rx * .6, sh + 20 * s]];
  const torso = [[cx - 60 * s, nb], [cx - 200 * s, sh], [cx - 240 * s, sh + 80 * s], [cx - 262 * s, 1560], [cx + 262 * s, 1560], [cx + 240 * s, sh + 80 * s], [cx + 200 * s, sh], [cx + 60 * s, nb]];
  const eyes = [-1, 1].map(k => ({ cx: cx + k * rx * .38, cy: cy - ry * .1, rx: rx * .2, ry: ry * .15 }));
  const mouth = { cx, cy: cy + ry * .52, w: rx * .34, h: ry * .13 };
  const arms = [], hands = [];
  if (pose === 'tap') {
    const hx = cx - rx * 1.9, hy = cy + ry * .4;
    arms.push({ pts: [[cx - 205 * s, sh + 25 * s], [cx - 330 * s, sh + 230 * s], [hx - 10 * s, hy + 190 * s], [hx, hy + 60 * s]], w: 64 * s }); hands.push({ x: hx, y: hy, s });
    arms.push({ pts: [[cx + 215 * s, sh + 25 * s], [cx + 270 * s, sh + 260 * s], [cx + 250 * s, 1560]], w: 64 * s });
  } else {
    const y = sh + 170 * s;
    arms.push({ pts: [[cx - 205 * s, sh + 25 * s], [cx - 300 * s, sh + 150 * s], [cx - 170 * s, y + 40 * s]], w: 62 * s }); hands.push({ x: cx - 160 * s, y: y - 30 * s, s });
    arms.push({ pts: [[cx + 205 * s, sh + 25 * s], [cx + 300 * s, sh + 150 * s], [cx + 170 * s, y + 40 * s]], w: 62 * s }); hands.push({ x: cx + 160 * s, y: y - 30 * s, s });
  }
  return { head, hood, torso, eyes, mouth, arms, hands, sh, nb, s, cx };
}
export function fingersOf(h) { const out = []; for (let i = 0; i < 5; i++) { const a = (i - 2) * .2, bx = h.x + (i - 2) * 21 * h.s, len = (i === 2 ? 150 : i === 0 || i === 4 ? 105 : 135) * h.s; out.push({ x0: bx, y0: h.y, x1: bx + Math.sin(a) * len, y1: h.y - Math.cos(a) * len, w: 15 * h.s }); } return out; }
export function polyPath(g, pts, close = true) { g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); if (close) g.closePath(); }
export function blobPath(g, pts) { const n = pts.length, mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], m0 = mid(pts[n - 1], pts[0]); g.moveTo(m0[0], m0[1]); for (let i = 0; i < n; i++) { const p = pts[i], m = mid(p, pts[(i + 1) % n]); g.quadraticCurveTo(p[0], p[1], m[0], m[1]); } g.closePath(); }
export function ellipsePath(g, e) { g.moveTo(e.cx + e.rx, e.cy); g.ellipse(e.cx, e.cy, e.rx, e.ry, 0, 0, Math.PI * 2); }
export function armStroke(g, a) { g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = a.w; g.beginPath(); polyPath(g, a.pts, false); g.stroke(); }
export function handShape(g, h) { g.beginPath(); g.ellipse(h.x, h.y + 22 * h.s, 44 * h.s, 52 * h.s, 0, 0, Math.PI * 2); g.fill(); g.lineCap = 'round'; for (const f of fingersOf(h)) { g.lineWidth = f.w; g.beginPath(); g.moveTo(f.x0, f.y0); g.lineTo(f.x1, f.y1); g.stroke(); } }
// every body part in the current fill/stroke colour
export function fillFigure(g, geo, o = {}) {
  g.save(); g.strokeStyle = g.fillStyle;
  for (const a of geo.arms) armStroke(g, a);
  g.beginPath(); polyPath(g, geo.torso); g.fill(); g.beginPath(); blobPath(g, geo.hood); g.fill();
  if (!o.skipHead) { g.beginPath(); ellipsePath(g, geo.head); g.fill(); }
  for (const h of geo.hands) handShape(g, h);
  g.restore();
}
export function paperNoise(g, w, h, rgb, amt, seed = 1) { const r = rngOf(seed); for (let i = 0; i < w * h / 90; i++) { g.fillStyle = `rgba(${rgb},${r() * amt})`; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); } }
