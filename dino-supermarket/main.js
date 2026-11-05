// Dinosaur breaks out of a supermarket gate. 5 s, three shots, cut on the same beats as the reference:
// 1) still medium shot, the gate takes three hits   2) low angle, it bursts through into a painted sky   3) the night city from above.
// Everything is a pure function of t (window.render(t)), so any frame can be rendered on its own.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const DBG = Object.fromEntries(new URLSearchParams(location.search)); const W = 1280, H = 960, CUT1 = 1.84, CUT2 = 3.92, TB = 1.80;
const V3 = THREE.Vector3;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, s, d) => clamp((t - s) / d), sm = t => t * t * (3 - 2 * t);
const oC = t => 1 - Math.pow(1 - t, 3), ioC = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

function canvasTex(w, h, draw, srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .82, metalness: 0, flatShading: true, ...o });

// ---------------------------------------------------------------- painted skies
// anime-style cumulus: flat shadow body, a mid tone and a crisp lit cap, all clipped to the cloud's own outline
function cloud(g, cx, cy, cw, ch, R, tone = 0) {
  const c = document.createElement('canvas'); c.width = Math.ceil(cw * 1.4); c.height = Math.ceil(ch * 1.9);
  const q = c.getContext('2d'), ox = c.width / 2, base = c.height * .88, P = [];
  const n = 7 + Math.floor(R() * 7);
  for (let i = 0; i < n; i++) {
    const u = (i + .5) / n, hg = Math.pow(Math.sin(u * Math.PI), .8), r = (.12 + .2 * hg) * cw * (.6 + R() * .4);
    P.push([ox + (u - .5) * cw * .92 + (R() - .5) * cw * .05, base - r * .5 - hg * ch * .42 - R() * ch * .1, r]);
  }
  for (let k = 0; k < 7; k++) { const p = P[1 + Math.floor(R() * (n - 2))]; P.push([p[0] + (R() - .5) * p[2], p[1] - p[2] * (.45 + R() * .3), p[2] * (.4 + R() * .3)]); }
  q.fillStyle = tone ? '#8fa6d4' : '#a7bde4'; for (const [x, y, r] of P) { q.beginPath(); q.arc(x, y, r, 0, 7); q.fill(); }
  q.clearRect(0, base, c.width, c.height);
  q.globalCompositeOperation = 'source-atop';
  const layer = (col, dx, dy, k) => { const l = document.createElement('canvas'); l.width = c.width; l.height = c.height; const lq = l.getContext('2d'); lq.fillStyle = col;
    for (const [x, y, r] of P) { lq.beginPath(); lq.arc(x + dx * r, y + dy * r, r * k, 0, 7); lq.fill(); } q.drawImage(l, 0, 0); };
  layer('#d0def4', -.07, -.1, .95); layer('#f7faff', -.15, -.22, .82); layer('#ffffff', -.2, -.3, .62);
  const gr = q.createLinearGradient(0, base - ch * .35, 0, base); gr.addColorStop(0, 'rgba(120,150,205,0)'); gr.addColorStop(1, 'rgba(120,150,205,.5)');
  q.fillStyle = gr; q.fillRect(0, 0, c.width, c.height);
  g.drawImage(c, cx - ox, cy - base);
}
const daySky = canvasTex(2048, 1536, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1847a6'); gr.addColorStop(.42, '#2c69cc'); gr.addColorStop(.78, '#6aa0e4'); gr.addColorStop(1, '#b6d2f2');
  g.fillStyle = gr; g.fillRect(0, 0, w, h); const R = mulberry(11);
  for (let i = 0; i < 12; i++) {              // high thin streaks
    g.strokeStyle = `rgba(255,255,255,${.06 + R() * .1})`; g.lineWidth = 2 + R() * 6; g.lineCap = 'round';
    const x = R() * w, y = 120 + R() * 700, l = 200 + R() * 500; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + l * .5, y - 40 + R() * 80, x + l, y + (R() - .5) * 60); g.stroke();
  }
  cloud(g, 330, 330, 640, 250, R); cloud(g, 1560, 560, 520, 210, R); cloud(g, 1050, 330, 330, 120, R);
  cloud(g, 260, 1240, 980, 520, R); cloud(g, 1720, 1130, 1100, 640, R); cloud(g, 1020, 1480, 1300, 420, R, 1); cloud(g, 700, 900, 420, 170, R);
});
daySky.wrapS = daySky.wrapT = THREE.MirroredRepeatWrapping; daySky.repeat.set(.86, .86);
const nightSky = canvasTex(1024, 768, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#040817'); gr.addColorStop(.5, '#0b1533'); gr.addColorStop(.85, '#1b2550'); gr.addColorStop(1, '#3a3456');
  g.fillStyle = gr; g.fillRect(0, 0, w, h); const R = mulberry(5);
  for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(255,255,255,${R() * .5})`; g.fillRect(R() * w, R() * h * .5, 1.4, 1.4); }
});

// ---------------------------------------------------------------- low-poly loft (organic faceted shapes)
function loft(secs, sides, o = {}) {
  const R = mulberry(o.seed || 1), jit = o.jit ?? .06, rings = [], n = secs.length;
  for (let i = 0; i < n; i++) {
    const s = secs[i], c = new V3(...s.c), a = new V3(...secs[Math.max(0, i - 1)].c), b = new V3(...secs[Math.min(n - 1, i + 1)].c);
    const T = b.sub(a).normalize(); let hint = new V3(0, 1, 0); if (Math.abs(T.dot(hint)) > .9) hint = new V3(0, 0, 1);
    const X = new V3().crossVectors(hint, T).normalize(), Y = new V3().crossVectors(T, X).normalize(), ring = [];
    for (let k = 0; k < sides; k++) {
      const an = k / sides * Math.PI * 2 + (o.rot || 0), sn = Math.sin(an), j = 1 + (R() - .5) * 2 * jit;
      const px = Math.cos(an) * s.rx * j, py = sn * s.ry * (sn < 0 ? (s.bot ?? 1) : (s.top ?? 1)) * j;
      ring.push(c.clone().addScaledVector(X, px).addScaledVector(Y, py));
    }
    rings.push(ring);
  }
  const pos = [], tri = (p, q, r) => pos.push(p.x, p.y, p.z, q.x, q.y, q.z, r.x, r.y, r.z);
  for (let i = 0; i < n - 1; i++) for (let k = 0; k < sides; k++) {
    const a = rings[i][k], b = rings[i][(k + 1) % sides], c = rings[i + 1][(k + 1) % sides], d = rings[i + 1][k]; tri(a, b, c); tri(a, c, d);
  }
  const cen = r => r.reduce((s, p) => s.add(p), new V3()).multiplyScalar(1 / r.length);
  if (o.cap0 !== false) { const cc = cen(rings[0]); for (let k = 0; k < sides; k++) tri(cc, rings[0][(k + 1) % sides], rings[0][k]); }
  if (o.cap1 !== false) { const cc = cen(rings[n - 1]); if (o.tip) cc.add(new V3(...o.tip)); for (let k = 0; k < sides; k++) tri(cc, rings[n - 1][k], rings[n - 1][(k + 1) % sides]); }
  return faceColored(pos, o.color);
}
// per-face colour: a painted look where each facet carries its own tone
function faceColored(pos, colorFn) {
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  if (colorFn) {
    const col = [], a = new V3(), b = new V3(), c = new V3(), n = new V3(), m = new V3();
    for (let i = 0; i < pos.length; i += 9) {
      a.set(pos[i], pos[i + 1], pos[i + 2]); b.set(pos[i + 3], pos[i + 4], pos[i + 5]); c.set(pos[i + 6], pos[i + 7], pos[i + 8]);
      n.crossVectors(b.clone().sub(a), c.clone().sub(a)).normalize(); m.copy(a).add(b).add(c).multiplyScalar(1 / 3);
      const k = colorFn(m, n, i / 9); for (let j = 0; j < 3; j++) col.push(k.r, k.g, k.b);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  }
  g.computeVertexNormals(); return g;
}

// ---------------------------------------------------------------- the dinosaur
const SKIN = { back: new THREE.Color('#263f36'), mid: new THREE.Color('#47654a'), belly: new THREE.Color('#c9b384'), stripe: new THREE.Color('#1b2d27') };
function skin(seed) {
  const R = mulberry(seed);
  return (m, n) => {
    const up = n.y, c = new THREE.Color();
    if (up > .35) c.copy(SKIN.mid).lerp(SKIN.back, sm(clamp((up - .35) / .5)));
    else if (up < -.25) c.copy(SKIN.mid).lerp(SKIN.belly, sm(clamp((-up - .25) / .45)));
    else c.copy(SKIN.mid);
    if (up > .1 && Math.sin(m.z * 2.4 + m.x * .3) > .55) c.lerp(SKIN.stripe, .55);
    return c.multiplyScalar(.93 + R() * .14);
  };
}
function buildDino() {
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: .74, metalness: .02, side: THREE.DoubleSide });
  const mk = (geo, parent) => { const m = new THREE.Mesh(geo, mat); m.castShadow = m.receiveShadow = true; parent.add(m); return m; };
  const root = new THREE.Group();
  // tail → hips → belly → chest → neck, one continuous faceted body
  const S = (z, y, rx, ry, bot = 1) => ({ c: [0, y, z], rx, ry, bot });
  mk(loft([S(-7.6, 2.9, .1, .1), S(-6.2, 3.1, .3, .34), S(-4.6, 3.35, .55, .62), S(-3.0, 3.6, .85, .95), S(-1.5, 3.75, 1.08, 1.18), S(0, 3.72, 1.18, 1.32, .95), S(1.15, 3.95, 1.0, 1.15), S(1.9, 4.5, .74, .8), S(2.45, 5.0, .62, .66)], 9, { seed: 3, color: skin(3), jit: .07 }), root);
  // legs and arms
  for (const s of [-1, 1]) {
    mk(loft([{ c: [s * .7, 3.6, -1.3], rx: .62, ry: .7 }, { c: [s * .95, 2.2, -.55], rx: .44, ry: .48 }, { c: [s * .9, .85, -1.25], rx: .2, ry: .22 }, { c: [s * .9, .25, -.95], rx: .17, ry: .14 }], 7, { seed: 7 + s, color: skin(8 + s) }), root);
    mk(loft([{ c: [s * .85, .14, -1.05], rx: .3, ry: .12 }, { c: [s * .9, .1, -.4], rx: .34, ry: .1 }, { c: [s * .92, .08, .1], rx: .12, ry: .06 }], 6, { seed: 11 + s, color: skin(12 + s) }), root);
    const arm = new THREE.Group(); arm.position.set(s * .72, 3.55, 1.45); root.add(arm); arm.userData.side = s;
    mk(loft([{ c: [0, 0, 0], rx: .17, ry: .2 }, { c: [s * .1, -.45, .35], rx: .12, ry: .13 }, { c: [s * .02, -.55, .75], rx: .08, ry: .07 }], 6, { seed: 15 + s, color: skin(16 + s) }), arm);
    for (const d of [-.05, .05]) { const cl = new THREE.Mesh(new THREE.ConeGeometry(.035, .16, 4), M('#e9dfc6')); cl.position.set(s * .02 + d, -.6, .8); cl.rotation.x = 2.2; arm.add(cl); }
    root.userData['arm' + s] = arm;
  }
  // head: upper skull, a hinged jaw, teeth, eyes under a heavy brow
  const head = new THREE.Group(); head.position.set(0, 5.05, 2.4); root.add(head);
  const HS = (z, y, rx, ry, bot = .35) => ({ c: [0, y, z], rx, ry, bot });
  mk(loft([HS(-.3, .22, .46, .52), HS(.1, .28, .56, .6), HS(.6, .25, .48, .5), HS(1.05, .2, .38, .38), HS(1.5, .17, .3, .3), HS(1.88, .14, .21, .2)], 10, { seed: 21, color: skin(21), jit: .05, tip: [0, -.02, .1] }), head);
  for (const s of [-1, 1]) {
    const brow = mk(loft([{ c: [s * .3, .62, .25], rx: .1, ry: .07 }, { c: [s * .36, .66, .55], rx: .13, ry: .09 }, { c: [s * .3, .56, .85], rx: .08, ry: .05 }], 5, { seed: 25 + s, color: () => SKIN.back.clone().multiplyScalar(.85) }), head);
    const sock = new THREE.Mesh(new THREE.IcosahedronGeometry(.1, 0), M('#151c1a')); sock.position.set(s * .43, .47, .55); head.add(sock);
    const eye = new THREE.Mesh(new THREE.IcosahedronGeometry(.065, 1), new THREE.MeshStandardMaterial({ color: '#ffb52e', emissive: '#ff9a1a', emissiveIntensity: 2.2, roughness: .3 }));
    eye.position.set(s * .47, .48, .58); head.add(eye);
    const pup = new THREE.Mesh(new THREE.BoxGeometry(.02, .1, .03), M('#120806')); pup.position.set(s * .52, .48, .6); head.add(pup);
    const nos = new THREE.Mesh(new THREE.IcosahedronGeometry(.045, 0), M('#101513')); nos.position.set(s * .13, .3, 1.8); head.add(nos);
  }
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(.66, .05, 1.65), M('#6a1b26')); mouth.position.set(0, .03, .9); head.add(mouth);
  const toothM = M('#f1e9d2', { roughness: .5 });
  for (let i = 0; i < 9; i++) for (const s of [-1, 1]) {
    const z = .35 + i * .17, rx = lerp(.5, .22, z / 1.85) * .9, tl = .11 + .07 * Math.sin(i * 1.7 + 1) ** 2;
    const tt = new THREE.Mesh(new THREE.ConeGeometry(.038, tl, 4), toothM); tt.position.set(s * rx, .04 - tl / 2, z); tt.rotation.x = Math.PI; head.add(tt);
  }
  const jaw = new THREE.Group(); jaw.position.set(0, .04, -.02); head.add(jaw);
  mk(loft([{ c: [0, -.12, 0], rx: .44, ry: .28, top: .3 }, { c: [0, -.12, .6], rx: .4, ry: .24, top: .3 }, { c: [0, -.09, 1.2], rx: .3, ry: .18, top: .3 }, { c: [0, -.05, 1.68], rx: .19, ry: .11, top: .3 }], 8, { seed: 31, color: skin(31), jit: .05 }), jaw);
  const tongue = mk(loft([{ c: [0, -.03, .15], rx: .22, ry: .05 }, { c: [0, -.02, .8], rx: .2, ry: .06 }, { c: [0, -.04, 1.25], rx: .12, ry: .04 }], 6, { seed: 33, color: () => new THREE.Color('#a8424f') }), jaw);
  for (let i = 0; i < 8; i++) for (const s of [-1, 1]) {
    const z = .4 + i * .16, rx = lerp(.42, .2, z / 1.7) * .85, tl = .09 + .05 * Math.sin(i * 2.1) ** 2;
    const tt = new THREE.Mesh(new THREE.ConeGeometry(.034, tl, 4), toothM); tt.position.set(s * rx, -.04 + tl / 2, z); jaw.add(tt);
  }
  root.userData.head = head; root.userData.jaw = jaw; root.userData.tongue = tongue;
  return root;
}

// ---------------------------------------------------------------- the supermarket set
const signTex = canvasTex(1536, 180, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#fffdf6'); gr.addColorStop(1, '#efe6d2'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = '#2f8a57'; g.beginPath(); g.arc(105, 90, 62, 0, 7); g.fill();
  g.fillStyle = '#fffdf6'; g.beginPath(); g.moveTo(80, 120); g.quadraticCurveTo(70, 55, 135, 50); g.quadraticCurveTo(140, 115, 80, 120); g.fill();
  g.strokeStyle = '#2f8a57'; g.lineWidth = 5; g.beginPath(); g.moveTo(84, 116); g.lineTo(128, 58); g.stroke();
  g.font = '900 122px "DejaVu Sans", Arial, sans-serif'; g.textBaseline = 'middle';
  g.fillStyle = '#7d1218'; g.fillText('SUPERMART', 207, 98); g.fillStyle = '#d8282f'; g.fillText('SUPERMART', 200, 92);
  g.font = '700 34px "DejaVu Sans", Arial, sans-serif'; g.fillStyle = '#2f8a57'; g.textAlign = 'right'; g.fillText('FRESH  •  DAILY', w - 40, 92);
});
const windowTex = canvasTex(768, 410, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#30465f'); gr.addColorStop(1, '#5c7898'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  const R = mulberry(41), cols = ['#e94b3c', '#f2b134', '#2f9e64', '#3a7bd5', '#f5f0e6', '#c0397a'];
  for (let r = 0; r < 4; r++) { g.fillStyle = 'rgba(20,28,40,.5)'; g.fillRect(0, 80 + r * 85, w, 8); for (let x = 0; x < w; x += 22) { g.fillStyle = cols[Math.floor(R() * cols.length)]; g.globalAlpha = .35; g.fillRect(x, 40 + r * 85, 16, 38); } g.globalAlpha = 1; }
  g.fillStyle = '#ffd23f'; g.fillRect(50, 70, 230, 170); g.fillStyle = '#d62830'; g.font = '900 72px "DejaVu Sans", sans-serif'; g.fillText('SALE', 66, 140); g.font = '900 64px "DejaVu Sans", sans-serif'; g.fillText('50%', 86, 214);
  g.fillStyle = '#2f8a57'; g.fillRect(470, 110, 230, 120); g.fillStyle = '#fff'; g.font = '900 54px "DejaVu Sans", sans-serif'; g.fillText('FRESH', 488, 188);
  g.fillStyle = 'rgba(255,255,255,.2)'; g.beginPath(); g.moveTo(300, 0); g.lineTo(420, 0); g.lineTo(220, h); g.lineTo(100, h); g.fill();
  g.fillStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.moveTo(560, 0); g.lineTo(600, 0); g.lineTo(400, h); g.lineTo(360, h); g.fill();
});
function buildStore(night) {
  const g = new THREE.Group(), R = mulberry(night ? 77 : 7);
  const facadeM = M('#eadcc0'), trimM = M('#d2c09e'), wallM = M('#c9b996'), darkM = M('#3e434c'), greenM = M('#2e8a57'), steelM = M('#8f9aa8', { metalness: .5, roughness: .42 });
  const box = (w, h, d, m, x, y, z, par = g) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; par.add(b); return b; };
  // building shell with an opening for the gate (interior is a deep hall)
  box(7.3, 7.2, 15, wallM, -7.35, 3.6, -7.5); box(7.3, 7.2, 15, wallM, 7.35, 3.6, -7.5); box(7.4, 3.0, 15, wallM, 0, 5.7, -7.5);
  box(7.4, .3, 15, M('#77706a'), 0, 4.35, -7.5);
  box(7.4, 4.2, .3, M('#2a2420'), 0, 2.1, -15);
  box(22.4, .45, .9, trimM, 0, 7.35, -.1);                           // parapet
  box(7.3, .5, .15, darkM, -7.35, .25, .08); box(7.3, .5, .15, darkM, 7.35, .25, .08);
  box(22.2, .34, .3, greenM, 0, 4.66, .14);
  box(12.8, 1.8, .26, trimM, 0, 5.62, .14);
  const signM = new THREE.MeshStandardMaterial({ map: signTex, emissiveMap: signTex, emissive: '#ffffff', emissiveIntensity: night ? 1.6 : .12, roughness: .6 });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(12.2, 1.45), signM); sign.position.set(0, 5.62, .28); g.add(sign);
  box(7.9, .52, .6, steelM, 0, 4.46, .22);                          // gate housing
  for (const s of [-1, 1]) {
    box(.2, 4.2, .28, steelM, s * 3.75, 2.1, .1);
    const win = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 3.0), new THREE.MeshStandardMaterial({ map: windowTex, emissiveMap: windowTex, emissive: '#ffffff', emissiveIntensity: night ? .9 : .08, roughness: .25, metalness: .1 }));
    win.position.set(s * 7.4, 2.45, .03); g.add(win);
    box(5.9, .14, .18, trimM, s * 7.4, 3.98, .08); box(5.9, .14, .18, trimM, s * 7.4, .92, .08); box(.14, 3.1, .18, trimM, s * 4.55, 2.45, .08); box(.14, 3.1, .18, trimM, s * 10.25, 2.45, .08); box(.1, 3.0, .12, trimM, s * 7.4, 2.45, .06);
    box(.5, 4.4, .45, trimM, s * 10.85, 2.2, .15);
  }
  // inside the hall: shelves of goods and strip lights
  const colsP = ['#e94b3c', '#f2b134', '#2f9e64', '#3a7bd5', '#f5f0e6', '#c0397a', '#ff7f2a'];
  for (const s of [-1, 1]) for (let lv = 0; lv < 3; lv++) {
    box(.9, .08, 13, M('#b9b2a6'), s * 3.15, .5 + lv * 1.1, -7.5);
    for (let z = -14; z < -.6; z += .55) box(.32 + R() * .2, .4 + R() * .35, .4, M(colsP[Math.floor(R() * colsP.length)]), s * 3.1, .75 + lv * 1.1, z);
  }
  const lightM = new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#fff6e0', emissiveIntensity: night ? 3 : 2 });
  for (let z = -13; z < -1; z += 3) box(.25, .06, 2.0, lightM, 0, 4.15, z);
  box(7.4, .05, 15, M('#d8d4cc'), 0, .02, -7.5);
  // sidewalk, curb
  box(40, .16, 6.2, M('#c9c4b8'), 0, -.08, 3.1); box(40, .22, .26, M('#9c978d'), 0, .0, 6.3);
  if (!night) {
    box(60, .1, 30, M('#3c3f46'), 0, -.16, 21.3);
    for (let x = -28; x < 28; x += 4) box(2, .02, .18, M('#e9e4d6'), x, -.1, 13);
    for (let x = -18; x < 18.5; x += 1.5) { const b = box(.04, .015, 6, M('#b5afa3'), x, .005, 3.1); b.castShadow = false; }
  }
  return { g, signM, box };
}
function cart(par, x, z, ry) {
  const c = new THREE.Group(), m = M('#b9c1ca', { metalness: .6, roughness: .35 }), red = M('#d8282f');
  const bar = (w, h, d, px, py, pz, mm = m) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mm); b.position.set(px, py, pz); b.castShadow = true; c.add(b); };
  for (const sx of [-.32, .32]) for (const sz of [-.45, .45]) bar(.04, .55, .04, sx, .75, sz);
  for (const sz of [-.45, .45]) bar(.68, .04, .04, 0, 1.02, sz); for (const sx of [-.32, .32]) bar(.04, .04, .94, sx, 1.02, 0);
  for (let i = -3; i <= 3; i++) bar(.02, .5, .9, i * .1, .77, 0); bar(.66, .03, .9, 0, .5, 0);
  bar(.72, .06, .06, 0, 1.12, -.6, red); bar(.04, .2, .04, -.3, 1.05, -.55); bar(.04, .2, .04, .3, 1.05, -.55);
  for (const sx of [-.28, .28]) for (const sz of [-.4, .4]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, .05, 8), M('#2a2c30')); w.rotation.z = Math.PI / 2; w.position.set(sx, .07, sz); c.add(w); bar(.03, .4, .03, sx, .3, sz); }
  c.position.set(x, 0, z); c.rotation.y = ry; par.add(c); return c;
}

// ================================================================= DAY SET (shots 1 and 2)
const day = new THREE.Scene(); day.background = daySky;
day.add(new THREE.HemisphereLight('#c3d9ff', '#9a8a70', 1.15));
const sun = new THREE.DirectionalLight('#fff0d6', 3.1); sun.position.set(14, 22, 20); sun.target.position.set(0, 2, 0); day.add(sun, sun.target);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 80 }); sun.shadow.bias = -.0004; sun.shadow.normalBias = .03;
const store = buildStore(false); day.add(store.g);
const carts = [cart(day, -6.9, 2.4, .25), cart(day, -6.3, 3.0, .28)];
for (const x of [-5.3, 5.3]) { const b = store.box(.26, .9, .26, M('#f2c230'), x, .45, 1.9, day); store.box(.28, .12, .28, M('#26282c'), x, .7, 1.9, day); }
store.box(.7, 1.0, .7, M('#2f6f4f'), 5.9, .5, 1.4, day); store.box(.76, .1, .76, M('#24543c'), 5.9, 1.04, 1.4, day);
{ const pot = store.box(.8, .6, .8, M('#b8653d'), -4.6 - 6.2, .3, 1.0, day); const bush = new THREE.Mesh(new THREE.IcosahedronGeometry(.75, 0), M('#3f8a46')); bush.position.set(-10.8, 1.2, 1.0); bush.castShadow = true; day.add(bush); }
{ const pole = store.box(.14, 6.4, .14, M('#3a3f48'), 9.2, 3.2, 5.6, day); store.box(1.4, .1, .1, M('#3a3f48'), 8.6, 6.35, 5.6, day); store.box(.6, .18, .34, M('#f6f1e0', { emissive: '#fff4d0', emissiveIntensity: .4 }), 8.0, 6.25, 5.6, day); }
// the roll-up gate: one corrugated sheet that dents outward when hit
const SW = 7.3, SH = 4.15, shGeo = new THREE.PlaneGeometry(SW, SH, 72, 48), shBase = shGeo.attributes.position.array.slice();
const shutter = new THREE.Mesh(shGeo, M('#9aa6b4', { metalness: .3, roughness: .45, side: THREE.DoubleSide, flatShading: false })); shutter.position.set(0, SH / 2 + .02, .13); shutter.castShadow = false; shutter.receiveShadow = false; day.add(shutter);
const HITS = [{ t: .36, x: -.7, y: 2.3, A: .13, sh: .006 }, { t: 1.0, x: .85, y: 2.85, A: .22, sh: .012 }, { t: 1.55, x: -.1, y: 2.55, A: .36, sh: .02 }];
const tri = x => { const f = x - Math.floor(x); return Math.abs(f - .5) * 2; };
function shutterAt(t) {
  const p = shGeo.attributes.position.array;
  for (let i = 0; i < p.length; i += 3) {
    const x = shBase[i], yw = shBase[i + 1] + SH / 2;
    let z = .05 * tri(yw / .26), b = 0, rip = 0;
    for (const h of HITS) {
      const tau = t - h.t; if (tau <= 0) continue;
      const amp = h.A * (1 - Math.exp(-14 * tau) * Math.cos(26 * tau)), dx = x - h.x, dy = (yw - h.y) * 1.25, r2 = dx * dx + dy * dy;
      b += amp * Math.exp(-r2 / (2 * .75 * .75)); const r = Math.sqrt(r2), front = 7 * tau;
      if (r < front) rip += .035 * Math.sin(10 * (r - front)) * Math.exp(-3.2 * tau);
    }
    const fx = 1 - Math.pow(Math.abs(x) / (SW / 2), 6), fy = 1 - Math.pow(Math.abs(yw - SH / 2) / (SH / 2), 6);
    p[i + 2] = z + (b + rip) * fx * fy;
    p[i + 1] = shBase[i + 1] + (HITS.reduce((s, h) => s + (t > h.t ? .025 * Math.exp(-9 * (t - h.t)) * Math.sin(55 * (t - h.t)) : 0), 0));
  }
  shGeo.attributes.position.needsUpdate = true; shGeo.computeVertexNormals();
}
// pigeons on the sign, they leave on the first hit
const pigeons = []; {
  const bodyM = M('#8b909b'), wingM = M('#6d727d', { side: THREE.DoubleSide }), R = mulberry(9);
  for (const x of [-4.4, -2.6, 1.7, 3.9]) {
    const p = new THREE.Group(), b = new THREE.Mesh(new THREE.IcosahedronGeometry(.13, 0), bodyM); b.scale.set(1, .85, 1.55); p.add(b);
    const hd = new THREE.Mesh(new THREE.IcosahedronGeometry(.07, 0), M('#5e6b76')); hd.position.set(0, .1, .17); p.add(hd);
    const wg = []; for (const s of [-1, 1]) { const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, .08, s * .34, 0, -.02, 0, 0, -.14], 3)); geo.computeVertexNormals(); const w = new THREE.Mesh(geo, wingM); p.add(w); wg.push(w); }
    p.userData = { x, wg, dir: R() > .5 ? 1 : -1, rnd: R() }; p.position.set(x, 6.62, .26); p.rotation.y = (R() - .5) * 1.4; p.traverse(o => o.castShadow = true); day.add(p); pigeons.push(p);
  }
}
// soft sprites for dust
const puffTex = canvasTex(128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.5, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
function sprites(n, color, scene) { const a = []; for (let i = 0; i < n; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex, color, transparent: true, depthWrite: false })); scene.add(s); a.push(s); } return a; }
const grit = sprites(42, '#d9cfbf', day), gritR = mulberry(17), gritD = grit.map(() => [gritR(), gritR(), gritR(), gritR()]);
const dust = sprites(30, '#e2d8c8', day), dustR = mulberry(23), dustD = dust.map(() => [dustR(), dustR(), dustR(), dustR(), dustR()]);
// the dinosaur, and what it throws out of the gate
const dino = buildDino(); day.add(dino);
const torn = []; { const m = M('#8f9cab', { metalness: .55, roughness: .4, side: THREE.DoubleSide });
  for (const [x, w, len, curl] of [[-3.0, .9, 1.6, .7], [-2.3, .7, 1.1, .5]]) {
    const geo = new THREE.PlaneGeometry(w, len, 3, 10), p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const v = (len / 2 - p.getY(i)) / len; p.setZ(i, v * v * curl + .04 * tri((p.getY(i) + 9) / .26)); }
    geo.translate(0, -len / 2, 0); geo.computeVertexNormals();
    const s = new THREE.Mesh(geo, m); s.position.set(x, 4.2, .2); s.castShadow = true; s.userData = { x, curl }; day.add(s); torn.push(s);
  } }
const debris = []; {
  const R = mulberry(31), steel = M('#97a3b1', { metalness: .55, roughness: .38, side: THREE.DoubleSide }), glass = new THREE.MeshStandardMaterial({ color: '#cfe8ff', emissive: '#bfe2ff', emissiveIntensity: .5, roughness: .08, metalness: .2, transparent: true, opacity: .8, flatShading: true });
  const plaster = M('#e3d5b8'), cols = ['#e94b3c', '#f2b134', '#2f9e64', '#3a7bd5', '#f5f0e6', '#c0397a', '#ff7f2a'];
  const kinds = [...Array(18).fill('steel'), ...Array(12).fill('box'), ...Array(8).fill('can'), ...Array(10).fill('glass'), ...Array(7).fill('plaster')];
  for (const k of kinds) {
    let geo, mat;
    if (k === 'steel') { const w = .3 + R() * .6, h = .15 + R() * .3; geo = new THREE.PlaneGeometry(w, h, 4, 2); const p = geo.attributes.position, bend = (R() - .5) * .6; for (let i = 0; i < p.count; i++) p.setZ(i, bend * p.getX(i) * p.getX(i) + .04 * tri(p.getY(i) / .26)); geo.computeVertexNormals(); mat = steel; }
    else if (k === 'box') { geo = new THREE.BoxGeometry(.3 + R() * .2, .45 + R() * .25, .18 + R() * .1); mat = M(cols[Math.floor(R() * cols.length)]); }
    else if (k === 'can') { geo = new THREE.CylinderGeometry(.09, .09, .24, 8); mat = M(R() > .5 ? '#d8282f' : '#c9d2dc', { metalness: .5, roughness: .35 }); }
    else if (k === 'glass') { geo = new THREE.TetrahedronGeometry(.12 + R() * .18, 0); geo.scale(1, 1.6, .25); mat = glass; }
    else { geo = new THREE.DodecahedronGeometry(.15 + R() * .2, 0); mat = plaster; }
    const m = new THREE.Mesh(geo, mat); m.castShadow = true; day.add(m);
    const side = R() * 2 - 1;
    m.userData = { k, p0: new V3(side * 3.3, .6 + R() * 3.4, .2 + R() * .4), v: new V3(R() < .8 ? -(1 + R() * 4.5) : R() * 1.5, 4 + R() * 6.5, .4 + R() * 2.2), ax: new V3(R() - .5, R() - .5, R() - .5).normalize(), w: 2 + R() * 6, q0: new THREE.Quaternion().setFromEuler(new THREE.Euler(R() * 6, R() * 6, R() * 6)) };
    debris.push(m);
  }
}
const SLOW = .55, G = -9.8;
const debrisPos = (d, tau, out) => out.copy(d.p0).addScaledVector(d.v, tau).add(new V3(0, .5 * G * tau * tau, 0));
// white contrail ribbons behind the fastest pieces, like the jets' trails in the reference
const trails = debris.filter(d => d.userData.k === 'steel' || d.userData.k === 'glass').slice(0, 14).map(d => {
  const K = 18, geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(K * 2 * 3), 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(K * 2 * 4), 4));
  const idx = []; for (let i = 0; i < K - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } geo.setIndex(idx);
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide })); m.frustumCulled = false; day.add(m);
  return { m, d, K };
});

// ================================================================= NIGHT CITY (shot 3)
const city = new THREE.Scene(); city.background = nightSky; city.fog = new THREE.FogExp2('#0e1634', .0009);
city.add(new THREE.HemisphereLight('#3b4c86', '#1a1008', .45));
{ const moon = new THREE.DirectionalLight('#9fb4ff', .35); moon.position.set(-30, 60, 20); city.add(moon); }
const RIVER = x => -270 + 110 * Math.sin(x / 380 + .6), RW = 130;
const inRiver = (x, z, pad = 0) => Math.abs(z - RIVER(x)) < RW / 2 + pad;
const GS = 4096, GM = 2000, gx = x => (x + GM / 2) / GM * GS, gz = z => (z + GM / 2) / GM * GS, gm = m => m / GM * GS;
const roadX = k => 60 * k + 30, roadZ = k => 60 * k + 13;
const groundTex = canvasTex(GS, GS, (g, w, h) => {
  const R = mulberry(99);
  g.fillStyle = '#060a15'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 26000; i++) { const a = R(); g.fillStyle = a > .7 ? 'rgba(255,190,110,.5)' : 'rgba(150,170,220,.25)'; g.fillRect(R() * w, R() * h, 1.5, 1.5); }
  const road = (horiz, c, wid, bright) => {
    g.save(); g.shadowColor = '#ff9a3a'; g.shadowBlur = bright ? 18 : 8;
    g.fillStyle = bright ? '#5c3418' : '#35200f'; if (horiz) g.fillRect(0, gz(c) - gm(wid) / 2, w, gm(wid)); else g.fillRect(gx(c) - gm(wid) / 2, 0, gm(wid), h);
    g.strokeStyle = bright ? '#ffc070' : '#d98a3c'; g.lineWidth = bright ? 4 : 2.2; g.beginPath();
    for (const o of bright ? [-.32, -.1, .1, .32] : [-.25, .25]) { if (horiz) { g.moveTo(0, gz(c) + gm(wid) * o); g.lineTo(w, gz(c) + gm(wid) * o); } else { g.moveTo(gx(c) + gm(wid) * o, 0); g.lineTo(gx(c) + gm(wid) * o, h); } }
    g.stroke(); g.fillStyle = '#ffe0a0';
    for (let s = 0; s < (horiz ? w : h); s += gm(28)) { const a = s, b = horiz ? gz(c) : gx(c); for (const o of [-.5, .5]) { if (horiz) g.fillRect(a, b + gm(wid) * o - 2, 4, 4); else g.fillRect(b + gm(wid) * o - 2, a, 4, 4); } }
    g.restore();
  };
  for (let k = -17; k <= 17; k++) { road(true, roadZ(k), k % 3 === 0 ? 22 : 14, k % 3 === 0); road(false, roadX(k), k % 3 === 0 ? 22 : 14, k % 3 === 0); }
  // two glowing curved expressways
  g.save(); g.lineCap = 'round'; g.shadowColor = '#ffb04a'; g.shadowBlur = 26;
  for (const [pts, wid] of [[[-1000, 420, -300, 120, 200, 330, 1000, -120], 20], [[-900, -900, -450, -420, 150, -520, 900, -980], 18]]) {
    g.strokeStyle = '#7a4a1a'; g.lineWidth = gm(wid); g.beginPath(); g.moveTo(gx(pts[0]), gz(pts[1])); g.bezierCurveTo(gx(pts[2]), gz(pts[3]), gx(pts[4]), gz(pts[5]), gx(pts[6]), gz(pts[7])); g.stroke();
    g.strokeStyle = '#ffd08a'; g.lineWidth = 3; for (const o of [-6, -2, 2, 6]) { g.beginPath(); g.moveTo(gx(pts[0]), gz(pts[1]) + o); g.bezierCurveTo(gx(pts[2]), gz(pts[3]) + o, gx(pts[4]), gz(pts[5]) + o, gx(pts[6]), gz(pts[7]) + o); g.stroke(); }
  }
  g.restore();
  // river with light reflections and lit embankments
  g.fillStyle = '#081633'; g.beginPath(); for (let x = -1000; x <= 1000; x += 10) g.lineTo(gx(x), gz(RIVER(x) - RW / 2)); for (let x = 1000; x >= -1000; x -= 10) g.lineTo(gx(x), gz(RIVER(x) + RW / 2)); g.fill();
  for (let i = 0; i < 700; i++) { const x = -1000 + R() * 2000, z = RIVER(x) + (R() - .5) * RW * .9; g.fillStyle = R() > .7 ? 'rgba(120,220,255,.35)' : 'rgba(255,190,110,.35)'; g.fillRect(gx(x), gz(z), 2 + R() * 3, 10 + R() * 30); }
  g.save(); g.shadowColor = '#ffc070'; g.shadowBlur = 14; g.strokeStyle = '#ffcf80'; g.lineWidth = 3;
  for (const o of [-1, 1]) { g.beginPath(); for (let x = -1000; x <= 1000; x += 10) g.lineTo(gx(x), gz(RIVER(x) + o * RW / 2)); g.stroke(); }
  g.restore();
  g.fillStyle = '#0e1a14'; g.fillRect(gx(-83), gz(20), gm(166), gm(46)); for (let i = 0; i < 160; i++) { g.fillStyle = 'rgba(40,70,50,.9)'; g.beginPath(); g.arc(gx(-80 + R() * 160), gz(22 + R() * 42), gm(2 + R() * 2.5), 0, 7); g.fill(); }
  for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(255,214,150,.8)'; g.fillRect(gx(-80 + R() * 160), gz(22 + R() * 42), 3, 3); }
  // the supermarket's lot: lit asphalt, bays, pools of lamp light
  g.fillStyle = '#26252a'; g.fillRect(gx(-23), gz(-40), gm(46), gm(46)); g.fillStyle = '#5c5650'; g.fillRect(gx(-23), gz(0), gm(46), gm(6));
  g.strokeStyle = 'rgba(255,255,255,.45)'; g.lineWidth = 2; for (let x = -21; x < 21; x += 3) { g.beginPath(); g.moveTo(gx(x), gz(-38)); g.lineTo(gx(x), gz(-33)); g.stroke(); }
  for (const [x, z] of [[-18, 3], [18, 3], [-18, -30], [18, -30]]) { const gr = g.createRadialGradient(gx(x), gz(z), 2, gx(x), gz(z), gm(14)); gr.addColorStop(0, 'rgba(255,200,130,.6)'); gr.addColorStop(1, 'rgba(255,200,130,0)'); g.fillStyle = gr; g.fillRect(gx(x) - gm(14), gz(z) - gm(14), gm(28), gm(28)); }
  { const gr = g.createRadialGradient(gx(0), gz(2), 4, gx(0), gz(4), gm(16)); gr.addColorStop(0, 'rgba(255,225,170,.9)'); gr.addColorStop(1, 'rgba(255,225,170,0)'); g.fillStyle = gr; g.fillRect(gx(-16), gz(-12), gm(32), gm(32)); }
});
{ const gnd = new THREE.Mesh(new THREE.PlaneGeometry(GM, GM), new THREE.MeshBasicMaterial({ map: groundTex })); gnd.rotation.x = -Math.PI / 2; gnd.position.y = -.05; city.add(gnd); }
function windowsTex(seed, dens, warm) {
  const t = canvasTex(512, 512, (g) => {
    const R = mulberry(seed); g.fillStyle = '#121828'; g.fillRect(0, 0, 512, 512);
    for (let r = 0; r < 16; r++) { const floorOn = R(); for (let c = 0; c < 16; c++) {
      const on = R() < dens * (floorOn > .25 ? 1 : .3), k = R();
      g.fillStyle = on ? (k < warm ? (R() > .5 ? '#ffcf86' : '#ffe3ab') : '#9fd6ff') : '#1c2539'; g.fillRect(c * 32 + 7, r * 32 + 8, 18, 17);
    } }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
const camLine = z => ({ x: 40 * z / 330, y: 8 + 202 * z / 330 });
{
  const R = mulberry(123), groups = [[], [], []], tops = [];
  for (let i = -16; i <= 16; i++) for (let j = -16; j <= 16; j++) {
    const x0 = roadX(i) + 7, x1 = roadX(i + 1) - 7, z0 = roadZ(j) + 7, z1 = roadZ(j + 1) - 7;
    if (x0 < 0 && x1 > 0 && z0 < 0 && z1 > -10) continue;                    // the supermarket's block
    if (z0 > 0 && z0 < 80 && x1 > -100 && x0 < 100) continue;              // open plaza in front, so the street stays in view
    const nb = 1 + Math.floor(R() * 3);
    for (let b = 0; b < nb; b++) {
      const w = 14 + R() * 20, d = 14 + R() * 20, x = lerp(x0 + w / 2, x1 - w / 2, R()), z = lerp(z0 + d / 2, z1 - d / 2, R());
      if (inRiver(x, z, 25)) continue;
      const dist = Math.hypot(x, z + 200);
      let h = 9 + Math.pow(R(), 3) * 40; if (R() < (dist < 600 ? .09 : .03)) h = 70 + R() * 110;
      if (z > 120) h = Math.min(h, 22 + R() * 30);
      if (z > -60 && z < 360) { const L = camLine(z); if (Math.abs(x - L.x) < w / 2 + 26) h = Math.min(h, Math.max(8, L.y - 14)); if (z > -60 && z < 40 && Math.abs(x) < 70) h = Math.min(h, 14 + R() * 8); }
      const geo = new THREE.BoxGeometry(w, h, d), uv = geo.attributes.uv, ox = R(), oy = R();
      for (let f = 0; f < 6; f++) for (let v = 0; v < 4; v++) { const k = f * 4 + v; if (f === 2 || f === 3) uv.setXY(k, .004, .004); else uv.setXY(k, uv.getX(k) * (f < 2 ? d : w) / 48 + ox, uv.getY(k) * h / 48 + oy); }
      geo.translate(x, h / 2, z); const gi = Math.floor(R() * 3); groups[gi].push(geo);
      if (h > 30 && R() < .35) { const w2 = w * (.5 + R() * .25), d2 = d * (.5 + R() * .25), h2 = 8 + R() * h * .35, g2 = new THREE.BoxGeometry(w2, h2, d2), u2 = g2.attributes.uv;
        for (let f = 0; f < 6; f++) for (let v = 0; v < 4; v++) { const k = f * 4 + v; if (f === 2 || f === 3) u2.setXY(k, .004, .004); else u2.setXY(k, u2.getX(k) * (f < 2 ? d2 : w2) / 48 + ox, u2.getY(k) * h2 / 48 + oy); }
        g2.translate(x, h + h2 / 2, z); groups[gi].push(g2); h += h2; }
      if (h > 60 && R() < .7) tops.push([x + w / 2 - 1, h + .6, z + d / 2 - 1], [x - w / 2 + 1, h + .6, z - d / 2 + 1]);
    }
  }
  const tex = [windowsTex(1, .55, .8), windowsTex(2, .4, .6), windowsTex(3, .7, .9)];
  groups.forEach((gs, i) => { const m = new THREE.Mesh(mergeGeometries(gs), new THREE.MeshStandardMaterial({ color: ['#7d8aa3', '#6a7a96', '#8a8fa0'][i], map: tex[i], emissiveMap: tex[i], emissive: '#ffffff', emissiveIntensity: .85, roughness: .9 })); city.add(m); });
  const red = new THREE.InstancedMesh(new THREE.BoxGeometry(1.4, 1.4, 1.4), new THREE.MeshBasicMaterial({ color: new THREE.Color(5, .45, .4) }), tops.length), mm = new THREE.Matrix4();
  tops.forEach((p, i) => red.setMatrixAt(i, mm.makeTranslation(...p))); city.add(red);
  // a cluster of tall towers in the distance, with lit edges
  const edgeM = new THREE.MeshBasicMaterial({ color: new THREE.Color(.25, 1.1, 1.4) }), towerTex = windowsTex(7, .75, .55);
  for (const [x, z, hgt, r, taper] of [[-140, -420, 230, 26, .55], [-60, -470, 290, 30, .4], [40, -430, 210, 24, .7], [120, -520, 250, 28, .5], [-230, -520, 180, 22, .8], [210, -440, 160, 22, .85]]) {
    const geo = new THREE.CylinderGeometry(r * taper, r, hgt, 4, 1), uv = geo.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) * r * 5.6 / 48, uv.getY(k) * hgt / 48);
    const tw = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: '#8fa0c0', map: towerTex, emissiveMap: towerTex, emissive: '#ffffff', emissiveIntensity: 1.3, roughness: .7 })); tw.rotation.y = Math.PI / 4; tw.position.set(x, hgt / 2, z); city.add(tw);
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2, e = new THREE.Mesh(new THREE.CylinderGeometry(.45 * taper, .45, hgt, 4), edgeM); e.position.set(x + Math.cos(a) * r * .99 * (1 + taper) / 2, hgt / 2, z + Math.sin(a) * r * .99 * (1 + taper) / 2); city.add(e); }
    const spire = new THREE.Mesh(new THREE.ConeGeometry(r * taper * .5, 40, 4), new THREE.MeshStandardMaterial({ color: '#a8b8d8', emissive: '#7fd8ff', emissiveIntensity: .8 })); spire.position.set(x, hgt + 20, z); city.add(spire);
  }
  const tvM = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.3, .45, .8) });
  { const x = -300, z = -360; const sh = new THREE.Mesh(new THREE.CylinderGeometry(3, 6, 260, 8), new THREE.MeshStandardMaterial({ color: '#c8b8d8', emissive: '#ff79b8', emissiveIntensity: .35 })); sh.position.set(x, 130, z); city.add(sh);
    for (const [y, r] of [[80, 11], [190, 7]]) { const s = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), tvM); s.position.set(x, y, z); city.add(s); } }
}
// cars as moving light points
const CARS = 520, carsW = new THREE.InstancedMesh(new THREE.BoxGeometry(2.2, .9, 1.2), new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 2.8, 2.2) }), CARS), carsR = new THREE.InstancedMesh(new THREE.BoxGeometry(2.2, .9, 1.2), new THREE.MeshBasicMaterial({ color: new THREE.Color(3.5, .35, .25) }), CARS);
city.add(carsW, carsR); const carD = (() => { const R = mulberry(55), a = []; for (let i = 0; i < CARS; i++) a.push({ hz: R() > .5, k: Math.floor(R() * 30) - 15, o: R() * 2000 - 1000, v: 9 + R() * 9, lane: (R() > .5 ? 1 : -1) * (2 + R() * 2.5), red: R() > .5 }); return a; })();
const nightStore = buildStore(true); city.add(nightStore.g);
{ const gate = new THREE.Mesh(new THREE.PlaneGeometry(7.3, 4.1), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 2.2, 1.6) })); gate.position.set(0, 2.05, -.8); city.add(gate);
  const R = mulberry(61), steel = M('#8f9aa8', { metalness: .5, roughness: .4 });
  for (let i = 0; i < 26; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(.4 + R() * .9, .05, .2 + R() * .3), i % 3 ? steel : M(['#e94b3c', '#f2b134', '#3a7bd5'][i % 3])); s.position.set((R() - .5) * 12, .05, 1 + R() * 9); s.rotation.y = R() * 6; city.add(s); }
  for (const [x, z] of [[-18, 3], [18, 3], [-18, -30], [18, -30]]) { const p = new THREE.Mesh(new THREE.BoxGeometry(.25, 7, .25), M('#30343c')); p.position.set(x, 3.5, z); city.add(p); const hd = new THREE.Mesh(new THREE.BoxGeometry(1, .25, .5), new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 3.2, 2) })); hd.position.set(x, 7, z); city.add(hd); }
  for (const [x, z, r] of [[-9, 12, .2], [14, 15, 3.0]]) { const c = new THREE.Group(), body = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.3, 1.9), M('#c9ccd4', { metalness: .4, roughness: .4 })), top = new THREE.Mesh(new THREE.BoxGeometry(2.2, .8, 1.7), M('#2a3040')); body.position.y = .75; top.position.y = 1.7; c.add(body, top);
    for (const s of [-1, 1]) { const hl = new THREE.Mesh(new THREE.BoxGeometry(.1, .25, .4), new THREE.MeshBasicMaterial({ color: new THREE.Color(5, 4.4, 3.4) })); hl.position.set(2.12, .8, s * .6); c.add(hl); }
    c.position.set(x, 0, z); c.rotation.y = r; city.add(c); }
}
const dinoN = buildDino(); city.add(dinoN);
const lampN = new THREE.PointLight('#ffc27a', 2600, 0, 2); lampN.position.set(-16, 16, 32); city.add(lampN);
const signN = new THREE.PointLight('#ff3a3a', 500, 0, 2); signN.position.set(0, 6, 5); city.add(signN);
const gateN = new THREE.PointLight('#ffd9a8', 400, 0, 2); gateN.position.set(0, 2.5, 3); city.add(gateN);

// ================================================================= cameras, post
const cam = new THREE.PerspectiveCamera(38, W / H, .1, 4000);
const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 }));
const rp = new RenderPass(day, cam); composer.addPass(rp);
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), .3, .5, .85); composer.addPass(bloom);
const grade = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, vig: { value: .5 }, sat: { value: 1.08 }, lift: { value: new THREE.Vector3(0, 0, 0) } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float vig, sat; uniform vec3 lift; varying vec2 vUv;
    void main(){ vec3 c = texture2D(tDiffuse, vUv).rgb; float l = dot(c, vec3(.299,.587,.114)); c = mix(vec3(l), c, sat);
      c += lift * (1. - clamp(l * 2., 0., 1.)); vec2 d = vUv - .5; c *= 1. - vig * dot(d, d) * 1.4; gl_FragColor = vec4(c, 1.); }`
}); composer.addPass(grade); composer.addPass(new OutputPass());

const shake = (t, f = 1) => HITS.reduce((s, h) => s + (t > h.t ? h.sh * f * Math.exp(-7 * (t - h.t)) * Math.sin(47 * (t - h.t)) : 0), 0);
function poseDino(d, t, o) {
  const U = d.userData; d.position.set(o.x, o.y, o.z); d.rotation.set(0, o.ry || 0, 0);
  U.head.rotation.set(-o.pitch, o.yaw || 0, o.roll || 0); U.jaw.rotation.x = o.jaw;
  for (const s of [-1, 1]) { const a = U['arm' + s]; a.rotation.x = .2 + Math.sin(t * 9 + s) * .15 * (o.flail || 0); a.rotation.z = s * (.15 + Math.sin(t * 7 + s * 2) * .1 * (o.flail || 0)); }
}

function shot1(t) {
  rp.scene = day; bloom.strength = .22; bloom.threshold = .9; bloom.radius = .4; grade.uniforms.vig.value = .55; grade.uniforms.sat.value = 1.08; grade.uniforms.lift.value.set(.0, .004, .012);
  renderer.toneMappingExposure = 1.0; daySky.offset.set(.08 + t * .004, .14);
  shutter.visible = true; torn.forEach(s => s.visible = false); debris.forEach(d => d.visible = false); trails.forEach(r => r.m.visible = false); dust.forEach(s => s.visible = false);
  shutterAt(t); store.signM.emissiveIntensity = .12 + (t > 1.0 && t < 1.25 && Math.sin(t * 90) > 0 ? .4 : 0);
  poseDino(dino, t, { x: 0, y: -1.6, z: -5.2, pitch: 0, jaw: .05 });
  carts.forEach((c, i) => { c.rotation.z = shake(t, 1.6 + i) * 2; c.position.x = [-6.9, -6.3][i] + shake(t + .02 * i, 3) * 3; });
  pigeons.forEach(p => { const u = p.userData, ft = t - (HITS[0].t + u.rnd * .12);
    if (ft <= 0) { p.position.set(u.x, 6.62, .26); u.wg.forEach(w => w.rotation.z = 0); return; }
    p.position.set(u.x + u.dir * ft * 2.6, 6.62 + ft * 3.4 + ft * ft * .8, .26 + ft * 2.2); p.rotation.set(-.5, u.dir * .6, 0);
    u.wg.forEach((w, i) => w.rotation.z = (i ? 1 : -1) * Math.sin(ft * 44 + u.rnd * 6) * .9); });
  // grit falling from the housing after each hit
  grit.forEach((s, i) => { const [a, b, c, e] = gritD[i], h = HITS[i % 3], ft = t - h.t - b * .1;
    if (ft <= 0 || ft > 1.6) { s.visible = false; return; } s.visible = true;
    s.position.set(h.x + (a - .5) * 4, 4.25 - 4.9 * ft * ft * .6, .35 + c * .4); s.scale.setScalar(.06 + e * .12); s.material.opacity = .9 * (1 - ft / 1.6); });
  const k = t / CUT1, sx = shake(t), sy = shake(t + .013);
  cam.fov = 40; cam.position.set(lerp(.7, .45, k), lerp(1.15, 1.22, k), lerp(17.2, 16.2, ioC(k)));
  cam.lookAt(0, 4.1, 0); cam.rotateX(sy); cam.rotateY(sx); cam.updateProjectionMatrix();
}
function shot2(t) {
  rp.scene = day; bloom.strength = .32; bloom.threshold = .82; bloom.radius = .45; grade.uniforms.vig.value = .5; grade.uniforms.sat.value = 1.1; grade.uniforms.lift.value.set(0, .004, .014);
  renderer.toneMappingExposure = 1.02; const st = t - CUT1, k = st / (CUT2 - CUT1); daySky.offset.set(.02 + st * .012, .02 + st * .004);
  shutter.visible = false; pigeons.forEach(p => p.visible = false); grit.forEach(s => s.visible = false); store.signM.emissiveIntensity = .12;
  torn.forEach((s, i) => { s.visible = true; const u = s.userData; s.rotation.set(-.25 - .2 * Math.sin(st * 5 + i), Math.sign(u.x) * .45, Math.sin(st * 6 + i * 2) * .06 * Math.exp(-st)); });
  const roar = ioC(seg(t, 2.42, .42)), tr = roar * Math.sin(t * 61) * .015;
  poseDino(dino, t, { x: -.2, y: -1.55 + Math.sin(st * 3) * .03, z: lerp(-3.6, -1.55, oC(seg(t, TB - .04, 1.6))), pitch: lerp(-.12, .42, roar) + tr, yaw: .3 + roar * .05, roll: roar * .05, jaw: .06 + .66 * ioC(seg(t, 2.38, .38)) + tr * 2, flail: 1 });
  const tau = (t - TB) * SLOW, tmp = new V3();
  debris.forEach(d => { const u = d.userData; d.visible = tau > 0; if (!d.visible) return; debrisPos(u, tau, d.position); d.quaternion.copy(u.q0).multiply(new THREE.Quaternion().setFromAxisAngle(u.ax, u.w * tau)); });
  cam.updateMatrixWorld(); const camP = cam.position.clone();
  trails.forEach(({ m, d, K }) => { const u = d.userData, p = m.geometry.attributes.position.array, c = m.geometry.attributes.color.array; m.visible = tau > 0;
    for (let i = 0; i < K; i++) { const tt = Math.max(0, tau - i * .028); debrisPos(u, tt, tmp); const nx = new V3(); debrisPos(u, Math.max(0, tt - .01), nx); const dir = tmp.clone().sub(nx).normalize(), side = new V3().crossVectors(dir, camP.clone().sub(tmp)).normalize().multiplyScalar(.045 * (1 - i / K));
      p.set([tmp.x + side.x, tmp.y + side.y, tmp.z + side.z, tmp.x - side.x, tmp.y - side.y, tmp.z - side.z], i * 6); const al = .7 * (1 - i / K) * clamp(tau * 6); c.set([1, 1, 1, al, 1, 1, 1, al], i * 8); }
    m.geometry.attributes.position.needsUpdate = true; m.geometry.attributes.color.needsUpdate = true; });
  dust.forEach((s, i) => { const [a, b, c, e, f] = dustD[i], age = t - TB - b * .2; s.visible = age > 0; if (!s.visible) return;
    const r = 1 - Math.exp(-age * 1.3); s.position.set((a - .5) * 8 + (a - .5) * 4 * r, .15 + c * .5 + r * (.3 + e * .9), .5 + r * (1.5 + f * 3)); s.scale.setScalar((.5 + e * .7) * (1 + age * .9)); s.material.opacity = (DBG.nodust ? 0 : .16) * (1 - sm(clamp(age / 2.4))); });
  const sx = Math.sin(st * 17) * .012 * Math.exp(-st * 2.5) + roar * Math.sin(t * 53) * .004;
  dino.updateMatrixWorld(true); const hp = new V3(0, .2, .9); dino.userData.head.localToWorld(hp);
  cam.fov = 46; cam.position.set(hp.x + lerp(2.6, 3.0, k), .5, hp.z + lerp(3.3, 3.7, k)); cam.lookAt(hp.x + .7, hp.y + .55, hp.z - .3); cam.rotateZ(-.13 + st * .015); cam.rotateY(sx); cam.updateProjectionMatrix();
}
function shot3(t) {
  rp.scene = city; bloom.strength = .7; bloom.threshold = .62; bloom.radius = .5; grade.uniforms.vig.value = .6; grade.uniforms.sat.value = 1.12; grade.uniforms.lift.value.set(0, .006, .02);
  renderer.toneMappingExposure = 1.0; const st = t - CUT2, k = st / (5 - CUT2);
  dinoN.scale.setScalar(4); poseDino(dinoN, t, { x: 4 + st * 2.4, y: Math.abs(Math.sin(st * 3)) * .3, z: 22, ry: Math.PI / 2, pitch: .32, jaw: .5 + Math.sin(t * 9) * .05, flail: .6 });
  const mm = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new V3(1, 1, 1), p = new V3();
  carD.forEach((c, i) => { let s = ((c.o + c.v * (c.lane > 0 ? 1 : -1) * t + 1000) % 2000 + 2000) % 2000 - 1000; const road = c.hz ? roadZ(c.k) : roadX(c.k);
    if (c.hz) { p.set(s, .6, road + c.lane); q.setFromAxisAngle(new V3(0, 1, 0), 0); } else { p.set(road + c.lane, .6, s); q.setFromAxisAngle(new V3(0, 1, 0), Math.PI / 2); }
    if (inRiver(p.x, p.z) || (c.hz && c.k === 0 && Math.abs(p.x) < 60)) p.y = -50;
    mm.compose(p, q, sc); (c.red ? carsR : carsW).setMatrixAt(i, mm); (c.red ? carsW : carsR).setMatrixAt(i, mm.clone().makeTranslation(0, -60, 0)); });
  carsW.instanceMatrix.needsUpdate = carsR.instanceMatrix.needsUpdate = true;
  cam.fov = 42; const p0 = new V3(40, 210, 330), look = new V3(-20, 0, -200), dir = look.clone().sub(p0).normalize();
  cam.position.copy(p0).addScaledVector(dir, 14 * ioC(k) + 4 * k); cam.lookAt(look.x + k * 3, look.y, look.z); cam.rotateZ(.02 - k * .01); cam.updateProjectionMatrix();
}
window.DUR = 5; window.TEXTS = () => [];
window.render = t => { t = clamp(t, 0, 4.999); if (t < CUT1) shot1(t); else if (t < CUT2) shot2(t); else shot3(t); rp.camera = cam; composer.render(); };
window.render(0); window.READY = true;
