// Low poly, cinematic golden hour: a faceted fox on a park bench under autumn trees. 10 s, 25 fps, three shots.
// Look: low warm sun, crisp dappled leaf shadows, light shafts, bloom, warm orange-pink grade, drifting leaves, shallow depth of field.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
const W = 1080, H = 1920, V3 = THREE.Vector3;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, s, d) => clamp((t - s) / d), sm = t => t * t * (3 - 2 * t), io = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .8, metalness: 0, flatShading: true, ...o });
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H); document.body.appendChild(renderer.domElement);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
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
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
scene.background = canvasTex(1024, 1820, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#3a6cc0'); gr.addColorStop(.38, '#7a9ad8'); gr.addColorStop(.62, '#f0b27a'); gr.addColorStop(.8, '#ffc27a'); gr.addColorStop(1, '#ffd89a'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  const Rc = mulberry(11);
  g.save(); g.filter = 'hue-rotate(-12deg) saturate(1.1)'; cloud(g, 260, 560, 620, 240, Rc); cloud(g, 820, 820, 520, 210, Rc); cloud(g, 520, 1080, 900, 260, Rc, 1); g.restore();
  g.globalCompositeOperation = 'multiply'; const warm = g.createLinearGradient(0, 600, 0, 1300); warm.addColorStop(0, 'rgba(255,255,255,1)'); warm.addColorStop(1, 'rgba(255,196,140,1)'); g.fillStyle = warm; g.fillRect(0, 0, w, h); });
scene.fog = new THREE.Fog('#f2c49a', 30, 110);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), .04).texture; scene.environmentIntensity = .25;
scene.add(new THREE.HemisphereLight('#8ea8e0', '#5a4a3a', 1.05));
const SUN_DIR = new V3(-1, .55, -.75).normalize();
const sun = new THREE.DirectionalLight('#ffc070', 4.6); sun.position.copy(SUN_DIR).multiplyScalar(30); scene.add(sun, sun.target);
sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); Object.assign(sun.shadow.camera, { left: -11, right: 11, top: 11, bottom: -11, near: 1, far: 70 }); sun.shadow.bias = -.0003; sun.shadow.normalBias = .02; sun.shadow.radius = 2;
const add = (geo, mat, par = scene, cast = true) => { const m = new THREE.Mesh(geo, mat); m.castShadow = cast; m.receiveShadow = true; par.add(m); return m; };
const R = mulberry(5), AUT0 = ['#f2a22a', '#e8822a', '#d8582a', '#c43a24', '#f6c43a', '#e86a2c'], AUT = AUT0;

// ---------------------------------------------------------------- ground: leaf litter, a glossy paved walk, scattered leaves
const tileTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); g.fillStyle = '#8a5a4a'; g.fillRect(0, 0, 256, 256); const r = mulberry(3);
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.fillStyle = `hsl(${12 + r() * 10},${30 + r() * 12}%,${44 + r() * 10}%)`; g.fillRect(x * 64 + 3, y * 64 + 3, 58, 58); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(10, 2); return t; })();
{ const g = new THREE.PlaneGeometry(120, 120, 60, 60); g.rotateX(-Math.PI / 2); const p = g.attributes.position, rr = mulberry(31); for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setY(i, Math.abs(z - 1.9) < 3 && Math.abs(x) < 25 ? 0 : (rr() - .3) * .12); }
  const gg = g.toNonIndexed(), q2 = gg.attributes.position.array, col = []; for (let i = 0; i < q2.length; i += 9) { const k = new THREE.Color(rr() < .5 ? '#5f8f3a' : '#6e9c42').multiplyScalar(.9 + rr() * .2); for (let j = 0; j < 3; j++) { const v = k.clone().multiplyScalar(.96 + rr() * .08); col.push(v.r, v.g, v.b); } }
  gg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); gg.computeVertexNormals(); add(gg, M('#ffffff', { vertexColors: true, roughness: .95 }), scene, false); }
{ const walk = add(new THREE.PlaneGeometry(40, 3.2), new THREE.MeshStandardMaterial({ map: tileTex, roughness: .32, metalness: .15 }), scene, false); walk.rotation.x = -Math.PI / 2; walk.position.set(0, .01, 1.9); }
const leafGeo = (() => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, -.07, .04, 0, 0, 0, 0, .07, -.04, 0, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]); g.computeVertexNormals(); return g; })();
{ const n = 500, im = new THREE.InstancedMesh(leafGeo, new THREE.MeshStandardMaterial({ roughness: .7, side: THREE.DoubleSide }), n), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), c = new THREE.Color();
  for (let i = 0; i < n; i++) { const x = (R() - .5) * 22, z = (R() - .5) * 18 + (R() < .3 ? 1.9 : 0); q.setFromEuler(new THREE.Euler((R() - .5) * .3, R() * 6, (R() - .5) * .3)); m4.compose(new V3(x, .02, z), q, new V3(1, 1, 1).multiplyScalar(.9 + R() * .8)); im.setMatrixAt(i, m4); im.setColorAt(i, c.set(AUT[Math.floor(R() * AUT.length)])); }
  im.receiveShadow = true; scene.add(im); }

// ---------------------------------------------------------------- trees: faceted canopy blobs + many leaf cards (they make the dappled shadows)
function tree(x, z, h, s) {
  const trunk = add(new THREE.CylinderGeometry(.16 * s, .28 * s, h, 7), M('#4a2e24'), scene); trunk.position.set(x, h / 2, z);
  for (let k = 0; k < 3; k++) { const b = add(new THREE.CylinderGeometry(.05 * s, .09 * s, 1.6 * s, 5), M('#4a2e24')); const a = k * 2.1 + R(); b.position.set(x + Math.cos(a) * .5 * s, h - .3, z + Math.sin(a) * .5 * s); b.rotation.set(Math.sin(a) * .7, 0, -Math.cos(a) * .7); }
  const leafM = new THREE.MeshStandardMaterial({ roughness: .75, side: THREE.DoubleSide }), n = 700, im = new THREE.InstancedMesh(leafGeo, leafM, n), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), c = new THREE.Color();
  for (let k = 0; k < 6; k++) {
    const r = (1.1 + R() * .8) * s, cx = x + (R() - .5) * 2.2 * s, cy = h + .6 * s + R() * 1.4 * s, cz = z + (R() - .5) * 2.2 * s;
    const geo = new THREE.IcosahedronGeometry(r, 1); geo.scale(1, .78, 1); geo.translate(cx, cy, cz);
    const g2 = geo.toNonIndexed(), p = g2.attributes.position.array, col = [];
    for (let i = 0; i < p.length; i += 9) { const k2 = new THREE.Color(AUT[Math.floor(R() * AUT.length)]).multiplyScalar(.85 + R() * .3); for (let j = 0; j < 3; j++) { const f = 1 + (j - 1) * .06; col.push(k2.r * f, k2.g * f, k2.b * f); } }
    g2.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g2.computeVertexNormals(); add(g2, M('#ffffff', { vertexColors: true, roughness: .85 }));
  }
  for (let i = 0; i < n; i++) { const a = R() * 6.283, el = R() * 1.6 - .3, rr = (1.6 + R() * 1.4) * s; q.setFromEuler(new THREE.Euler(R() * 6, R() * 6, R() * 6));
    m4.compose(new V3(x + Math.cos(a) * Math.cos(el) * rr, h + .9 * s + Math.sin(el) * rr * .75, z + Math.sin(a) * Math.cos(el) * rr), q, new V3(1, 1, 1).multiplyScalar(2.2 + R() * 1.8)); im.setMatrixAt(i, m4); im.setColorAt(i, c.set(AUT[Math.floor(R() * AUT.length)])); }
  im.castShadow = true; scene.add(im);
}
tree(-2.6, -1.4, 3.4, 1.15); tree(2.9, -2.2, 3.8, 1.25); tree(-.4, -4.6, 4.2, 1.3); tree(-6.5, 2.5, 3.6, 1.2); tree(6.8, 1.2, 3.4, 1.1); tree(-8, -6, 4.4, 1.4); tree(7, -7, 4.6, 1.4); tree(.5, 8, 3.8, 1.3);

// ---------------------------------------------------------------- a readable world behind: houses, lamp post, bin
{ const wallC = ['#f0e2c8', '#e8c9a4', '#d9e0e6', '#f2d6c2'], roofC = ['#b8452e', '#6a4a8a', '#3e5e8a', '#a85a2a'];
  for (let i = 0; i < 7; i++) { const x = -15 + i * 5 + R() * 1.2, z = -13 - R() * 2, w = 3.6 + R() * 1.2, h = 3.2 + R() * 2.2, g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
    add(new THREE.BoxGeometry(w, h, 3.2), M(wallC[i % 4]), g).position.y = h / 2;
    const roof = add(new THREE.ConeGeometry(w * .78, 1.6, 4), M(roofC[i % 4]), g); roof.position.y = h + .8; roof.rotation.y = Math.PI / 4; roof.scale.set(1, 1, .7);
    for (let k = 0; k < 2; k++) for (let j = 0; j < 2; j++) { const win = add(new THREE.BoxGeometry(.6, .7, .04), M(R() < .4 ? '#ffd890' : '#4a5a78', { emissive: '#ffb860', emissiveIntensity: R() < .4 ? .8 : 0 }), g, false); win.position.set(-w / 4 + j * w / 2, h * .35 + k * h * .35, 1.62); } } }
{ const iron = M('#2a2c46', { roughness: .45, metalness: .5 }); const lp = new THREE.Group(); lp.position.set(-1.9, 0, .9); scene.add(lp);
  add(new THREE.CylinderGeometry(.05, .08, 3.2, 8), iron, lp).position.y = 1.6; add(new THREE.CylinderGeometry(.2, .12, .28, 6), M('#ffe2a8', { emissive: '#ffc070', emissiveIntensity: 1.2 }), lp).position.y = 3.25; add(new THREE.ConeGeometry(.28, .16, 6), iron, lp).position.y = 3.46;
  const bin = add(new THREE.CylinderGeometry(.24, .2, .7, 8), M('#2e5a4a'), scene); bin.position.set(1.6, .35, .7); }

// ---------------------------------------------------------------- bench: orange slats on dark iron
{ const wood = M('#d06a2a', { roughness: .55 }), iron = M('#2a2c46', { roughness: .45, metalness: .5 });
  for (let i = 0; i < 4; i++) add(new THREE.BoxGeometry(2.2, .05, .11), wood).position.set(0, .46, .1 - i * .13);
  for (let i = 0; i < 3; i++) { const b = add(new THREE.BoxGeometry(2.2, .1, .045), wood); b.position.set(0, .66 + i * .16, -.36 - i * .02); b.rotation.x = -.18; }
  for (const s of [-1, 1]) { add(new THREE.BoxGeometry(.06, .46, .06), iron).position.set(s * .95, .23, .1); add(new THREE.BoxGeometry(.06, 1.1, .06), iron).position.set(s * .95, .55, -.38); add(new THREE.BoxGeometry(.06, .06, .55), iron).position.set(s * .95, .62, -.12); } }

// ---------------------------------------------------------------- the fox: faceted, sitting on the bench, facing +z
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
      const k = colorFn(m, n, i / 9); for (let j = 0; j < 3; j++) { const f = 1 + (j - 1) * .045; col.push(k.r * f, k.g * f, k.b * f); }
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  }
  g.computeVertexNormals(); return g;
}


const fox = new THREE.Group(); fox.position.set(.15, .49, -.1); scene.add(fox);
const ORANGE = new THREE.Color('#e2742a'), CREAM = new THREE.Color('#f6eee2'), DARK = new THREE.Color('#3a2620');
const furCol = (bib) => { const r = mulberry(9); return (m, n) => { const c = (bib && n.z > .55 && m.y > .16 && m.y < .44 && Math.abs(m.x) < .09) ? CREAM.clone() : ORANGE.clone(); return c.multiplyScalar(.9 + r() * .18); }; };
const furM = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: .8 });
const fadd = (g, par = fox) => add(g, furM, par);
const body = new THREE.Group(); fox.add(body);
fadd(loft([{ c: [0, 0, -.02], rx: .2, ry: .17 }, { c: [0, .14, .0], rx: .19, ry: .16 }, { c: [0, .3, .03], rx: .15, ry: .13 }, { c: [0, .42, .05], rx: .1, ry: .09 }], 9, { seed: 4, color: furCol(.5), jit: .05 }), body);
for (const s of [-1, 1]) { fadd(loft([{ c: [s * .08, .26, .1], rx: .04, ry: .04 }, { c: [s * .09, .06, .17], rx: .035, ry: .035 }, { c: [s * .09, -.02, .2], rx: .04, ry: .03 }], 6, { seed: 6 + s, color: (m) => (m.y < .05 ? DARK.clone() : ORANGE.clone().multiplyScalar(.95)) }), body);
  fadd(loft([{ c: [s * .13, .02, -.04], rx: .07, ry: .08 }, { c: [s * .14, -.02, .08], rx: .05, ry: .04 }, { c: [s * .12, -.03, .16], rx: .04, ry: .025 }], 6, { seed: 8 + s, color: furCol(0) }), body); }
const tail = new THREE.Group(); tail.position.set(0, .02, -.16); fox.add(tail);
fadd(loft([{ c: [0, 0, 0], rx: .06, ry: .06 }, { c: [.12, .0, -.1], rx: .1, ry: .1 }, { c: [.3, .02, -.08], rx: .11, ry: .1 }, { c: [.42, .04, .06], rx: .08, ry: .08 }, { c: [.44, .05, .16], rx: .04, ry: .04 }], 8, { seed: 12, color: (m, n) => (m.z > .1 ? CREAM.clone() : ORANGE.clone()) }), tail);
const head = new THREE.Group(); head.position.set(0, .5, .07); fox.add(head);
fadd(loft([{ c: [0, .02, -.1], rx: .12, ry: .11 }, { c: [0, .03, .0], rx: .13, ry: .12 }, { c: [0, .0, .09], rx: .08, ry: .07, bot: .6 }, { c: [0, -.02, .17], rx: .035, ry: .03 }], 9, { seed: 14, color: (m, n) => (m.z > .04 && n.y < .2 ? CREAM.clone() : ORANGE.clone()).multiplyScalar(.92 + mulberry(Math.floor(m.x * 997 + m.y * 557))() * .16) }), head);
const nose = add(new THREE.IcosahedronGeometry(.022, 0), M('#17110f'), head); nose.position.set(0, -.015, .19);
const ears = [];
for (const s of [-1, 1]) {
  const e = new THREE.Group(); e.position.set(s * .07, .11, -.02); head.add(e); ears.push(e);
  const g = new THREE.ConeGeometry(.055, .13, 4); g.translate(0, .065, 0); add(g, M('#d8662a'), e); const gi = new THREE.ConeGeometry(.03, .08, 4); gi.translate(0, .045, .02); add(gi, M('#2a1a16'), e);
  const eye = add(new THREE.IcosahedronGeometry(.02, 1), M('#120c0a', { roughness: .2, flatShading: false }), head); eye.position.set(s * .055, .03, .085);
  const glint = add(new THREE.IcosahedronGeometry(.006, 0), new THREE.MeshBasicMaterial({ color: '#ffffff' }), head, false); glint.position.set(s * .05, .04, .1);
}

// ---------------------------------------------------------------- drifting leaves, light shafts
const FALL = 140, fallIM = new THREE.InstancedMesh(leafGeo, new THREE.MeshStandardMaterial({ roughness: .6, side: THREE.DoubleSide }), FALL); fallIM.castShadow = true; scene.add(fallIM);
const fallD = []; { const c = new THREE.Color(); for (let i = 0; i < FALL; i++) { fallD.push({ x: (R() - .5) * 10, z: (R() - .5) * 8 + 1, h: 5 + R() * 2.5, sp: .35 + R() * .3, ph: R() * 50, sw: .3 + R() * .5, rot: R() * 6 }); fallIM.setColorAt(i, c.set(AUT[Math.floor(R() * AUT.length)])); } }
const shaftTex = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 256; const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 64, 0); gr.addColorStop(0, 'rgba(255,220,160,0)'); gr.addColorStop(.5, 'rgba(255,220,160,1)'); gr.addColorStop(1, 'rgba(255,220,160,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 256);
  const v = g.createLinearGradient(0, 0, 0, 256); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(.25, 'rgba(0,0,0,1)'); v.addColorStop(1, 'rgba(0,0,0,0)'); g.globalCompositeOperation = 'destination-in'; g.fillStyle = v; g.fillRect(0, 0, 64, 256); return new THREE.CanvasTexture(c); })();
const shafts = []; for (let i = 0; i < 9; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(.45 + R() * .6, 12), new THREE.MeshBasicMaterial({ map: shaftTex, transparent: true, opacity: .07 + R() * .05, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  m.userData.p = new V3((R() - .5) * 7, 3.2, (R() - .5) * 5); scene.add(m); shafts.push(m); }
function aimShafts() { shafts.forEach(m => { const p = m.userData.p; m.position.copy(p); const up = SUN_DIR.clone(), toCam = cam.position.clone().sub(p); const xAxis = new V3().crossVectors(up, toCam).normalize(), zAxis = new V3().crossVectors(xAxis, up).normalize();
  m.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(xAxis, up, zAxis)); }); }

// ---------------------------------------------------------------- post: depth of field, bloom, warm orange-pink grade
const cam = new THREE.PerspectiveCamera(45, W / H, .05, 200);
const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 }));
composer.addPass(new RenderPass(scene, cam));
const bokeh = new BokehPass(scene, cam, { focus: 2, aperture: .0025, maxblur: .006 }); composer.addPass(bokeh);
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), .28, .45, .85); composer.addPass(bloom);
const grade = new ShaderPass({ uniforms: { tDiffuse: { value: null }, t: { value: 0 } }, vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float t; varying vec2 vUv; float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
  void main(){ vec3 c = texture2D(tDiffuse, vUv).rgb; float l = dot(c, vec3(.299,.587,.114));
    c = mix(vec3(l), c, 1.1);
    c += vec3(0., .004, .014) * (1. - clamp(l * 2., 0., 1.));     // slight cool lift in the shadows
    vec2 d = vUv - .5; c *= 1. - dot(d, d) * .5;
    gl_FragColor = vec4(c, 1.); }` }); composer.addPass(grade); composer.addPass(new OutputPass());

// ---------------------------------------------------------------- animation
function poseFox(t) {
  const br = Math.sin(t * 2.4) * .006; body.scale.set(1 + br, 1 + br * 1.5, 1 + br); head.position.y = .5 + br * 2;
  tail.rotation.set(0, Math.sin(t * 1.3) * .25, Math.sin(t * .9) * .06);
  const lookUp = sm(seg(t, 7.3, .8)) * (1 - sm(seg(t, 9.1, .6)) * .4), bop = Math.exp(-Math.pow((t - 8.75) * 7, 2));
  head.rotation.set(-.08 - lookUp * .55 + bop * .25, Math.sin(t * .7) * .15 * (1 - lookUp), Math.sin(t * .5) * .05 + lookUp * .12);
  ears.forEach((e, i) => { const tw = Math.exp(-Math.pow(((t + i * .37) % 2.6 - 1.3) * 9, 2)); e.rotation.set(-.1 - tw * .4 - bop * .5, 0, (i ? -1 : 1) * (.25 + tw * .2)); });
}
const m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
function poseLeaves(t) {
  fallD.forEach((d, i) => { const k = ((t * d.sp + d.ph) % d.h), y = d.h - k; let x = d.x + Math.sin(t * 1.3 + d.ph) * d.sw, z = d.z + Math.cos(t * 1.1 + d.ph) * d.sw * .6;
    if (i === 0) { const lp = seg(t, 7.0, 1.75); x = lerp(.6, .17, io(lp)) + Math.sin(t * 3) * .1 * (1 - lp); z = lerp(.4, .02, io(lp)); }
    const yy = i === 0 ? lerp(2.4, 1.11, io(seg(t, 7.0, 1.75))) : y;
    q.setFromEuler(new THREE.Euler(Math.sin(t * 2 + d.rot) * 1.2, t * 1.5 + d.rot, Math.cos(t * 1.7 + d.rot))); const sc = i === 0 ? 1.1 : 2.2; m4.compose(new V3(x, yy, z), q, new V3(sc, sc, sc)); fallIM.setMatrixAt(i, m4); });
  fallIM.instanceMatrix.needsUpdate = true;
}
window.DUR = 10; window.TEXTS = () => [];
window.render = t => {
  poseFox(t); poseLeaves(t);
  bokeh.enabled = false; bloom.strength = .28;
  if (t < 3.6) {           // shot 1: crane down out of the canopy onto the bench
    const k = io(seg(t, 0, 3.6)); cam.fov = 42; cam.position.set(lerp(1.6, .9, k), lerp(7.2, 1.55, k), lerp(5.5, 4.4, k)); cam.lookAt(lerp(.6, .1, k), lerp(3.4, .75, k), lerp(-1, -.2, k));
  } else if (t < 6.6) {    // shot 2: straight down over the bench, slow turn, dappled light
    const k = (t - 3.6) / 3; cam.fov = 58; cam.position.set(.1 + k * .2, lerp(3.1, 2.8, k), -.05); cam.up.set(Math.sin(.4 + k * .35), 0, -Math.cos(.4 + k * .35)); cam.lookAt(.1, 0, -.05); cam.up.set(0, 1, 0);
  } else {                 // shot 3: low dolly in on the fox, shallow focus; a leaf lands on its nose
    const k = io(seg(t, 6.6, 3.4)); cam.fov = 38; cam.position.set(lerp(.62, .42, k), lerp(.78, .86, k), lerp(1.9, 1.15, k)); cam.lookAt(.15, lerp(1.0, 1.08, k), 0);
    bokeh.enabled = true; bokeh.uniforms.focus.value = cam.position.distanceTo(new V3(.15, 1.0, .05)); bloom.strength = .32;
  }
  cam.updateProjectionMatrix(); aimShafts(); grade.uniforms.t.value = Math.floor(t * 25);
  composer.render();
};
window.render(0); window.READY = true;
