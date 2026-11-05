// Cooking ramen: low-poly props animated on the user's flat table photo (top-down), 8 s.
// The photo is drawn untouched; the props are a transparent three.js layer with shadows on an invisible table plane.
// Prop motion is stepped at 12.5 fps (hand-animated feel); the words move smoothly; the video is 25 fps.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const W = 1080, H = 1920, STEP = 1 / 12.5;
const V3 = THREE.Vector3;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, s, d) => clamp((t - s) / d);
const oC = t => 1 - Math.pow(1 - t, 3), iC = t => t * t * t, ioC = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const oS = t => { t -= 1; return 1 + 2.2 * t * t * t + 1.2 * t * t; };
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// ---------------------------------------------------------------- renderer: transparent, composited over the photo
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H); renderer.setClearColor(0x000000, 0);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .82;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), .04).texture; scene.environmentIntensity = .25;
scene.add(new THREE.HemisphereLight('#fff6e6', '#3d6b4c', .5));
const key = new THREE.DirectionalLight('#fff2dc', 2.3); key.position.set(-.55, 1.5, -.6); scene.add(key);
key.castShadow = true; key.shadow.mapSize.set(1536, 1536); Object.assign(key.shadow.camera, { left: -.5, right: .5, top: .5, bottom: -.5, near: .2, far: 3 }); key.shadow.bias = -.0006; key.shadow.normalBias = .002;
const table = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), new THREE.ShadowMaterial({ color: '#03190d', opacity: .55 })); table.rotation.x = -Math.PI / 2; table.receiveShadow = true; scene.add(table);
// top-down camera: screen up = -z, screen right = +x, the frame covers the mat (~0.43 m wide)
const cam = new THREE.PerspectiveCamera(41.6, W / H, .05, 5); cam.position.set(0, 1, 0); cam.up.set(0, 0, -1); cam.lookAt(0, 0, 0);

const MS = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .7, metalness: 0, flatShading: true, ...o });
const add = (geo, mat, par, cast = true) => { const m = new THREE.Mesh(geo, mat); m.castShadow = cast; m.receiveShadow = true; par.add(m); return m; };
// per-face colouring on a non-indexed geometry (painted facets)
function paint(geo, fn, seed = 1) {
  geo = geo.index ? geo.toNonIndexed() : geo; const p = geo.attributes.position.array, col = [], R = mulberry(seed);
  const a = new V3(), b = new V3(), c = new V3(), n = new V3(), m = new V3();
  for (let i = 0; i < p.length; i += 9) {
    a.fromArray(p, i); b.fromArray(p, i + 3); c.fromArray(p, i + 6); n.crossVectors(b.clone().sub(a), c.clone().sub(a)).normalize(); m.copy(a).add(b).add(c).multiplyScalar(1 / 3);
    const k = fn(m, n).multiplyScalar(.95 + R() * .1); for (let j = 0; j < 3; j++) col.push(k.r, k.g, k.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.computeVertexNormals(); return geo;
}
const C = s => new THREE.Color(s);

// ---------------------------------------------------------------- the pot of boiling water
const pot = new THREE.Group(); scene.add(pot);
{
  const steel = MS('#aeb6c0', { metalness: .7, roughness: .34, side: THREE.DoubleSide });
  const prof = [[0, 0], [.1, 0], [.108, .006], [.11, .02], [.11, .112], [.117, .118], [.117, .124], [.106, .124], [.104, .118], [.104, .014], [.096, .01], [0, .01]].map(([r, y]) => new THREE.Vector2(r, y));
  add(new THREE.LatheGeometry(prof, 16), steel, pot);
  for (const s of [-1, 1]) {
    const h = add(new THREE.TorusGeometry(.022, .006, 5, 10, Math.PI), MS('#26272b', { roughness: .5 }), pot); h.position.set(s * .118, .1, 0); h.rotation.set(Math.PI / 2, 0, s > 0 ? -Math.PI / 2 : Math.PI / 2);
    const rv = add(new THREE.BoxGeometry(.012, .02, .03), steel, pot); rv.position.set(s * .112, .1, 0);
  }
}
const waterGeo = new THREE.CircleGeometry(.104, 28, 0, Math.PI * 2), waterBase = waterGeo.attributes.position.array.slice();
const water = add(waterGeo, MS('#5f8ea3', { roughness: .35, metalness: .05, transparent: true, opacity: .88 }), pot, false); water.rotation.x = -Math.PI / 2; water.position.y = .092;
const bubbles = []; { const R = mulberry(5), bm = MS('#e6f3f8', { roughness: .1, transparent: true, opacity: .85 });
  for (let i = 0; i < 26; i++) { const b = add(new THREE.IcosahedronGeometry(1, 0), bm, pot, false); b.userData = { x: (R() - .5) * .17, z: (R() - .5) * .17, ph: R(), r: .004 + R() * .007, per: .5 + R() * .5 }; if (Math.hypot(b.userData.x, b.userData.z) > .09) b.userData.x *= .6; bubbles.push(b); } }
// dried noodle block, wavy faceted top
const block = new THREE.Group(); scene.add(block);
{
  const geo = new THREE.BoxGeometry(.11, .026, .11, 12, 2, 12), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); if (y > 0) p.setY(i, y + .006 * Math.sin(x * 130) * Math.sin(z * 110)); p.setX(i, x + .003 * Math.sin(z * 90)); }
  geo.computeVertexNormals();
  add(paint(geo, (m, n) => n.y > .5 ? C('#efcd82') : C('#d9ad5c'), 3), MS('#ffffff', { vertexColors: true, roughness: .8 }), block);
  for (let i = 0; i < 6; i++) { const w = add(new THREE.TorusGeometry(.018, .003, 4, 8, Math.PI * 1.6), MS('#e7c072'), block); w.rotation.x = -Math.PI / 2; w.position.set(-.03 + (i % 3) * .03, .017, -.025 + Math.floor(i / 3) * .05); w.rotation.z = i; }
}

// ---------------------------------------------------------------- the ramen bowl
const bowl = new THREE.Group(); scene.add(bowl);
{
  const prof = [[0, 0], [.048, 0], [.05, .008], [.062, .012], [.084, .036], [.098, .066], [.102, .078], [.097, .08], [.092, .072], [.078, .044], [.05, .02], [0, .016]].map(([r, y]) => new THREE.Vector2(r, y));
  const geo = paint(new THREE.LatheGeometry(prof, 20), (m, n) => {
    const out = n.x * m.x + n.z * m.z > 0;                    // outward facing → glazed red-orange, inside → cream
    const ang0 = Math.atan2(m.z, m.x);
    if (!out) return m.y > .066 ? (Math.sin(ang0 * 14) > .2 ? C('#f4ead6') : C('#c8432c')) : C('#f4ead6');
    if (m.y > .074) return C('#f4ead6');
    const ang = Math.atan2(m.z, m.x); return (m.y > .045 && m.y < .058 && Math.sin(ang * 10) > 0) ? C('#f4ead6') : C('#c8432c');
  }, 7);
  add(geo, MS('#ffffff', { vertexColors: true, roughness: .35, side: THREE.DoubleSide }), bowl);
  // broth: golden, faceted shimmer, a few oil beads
  const bg = paint(new THREE.CircleGeometry(.086, 24), () => C('#c97f2e'), 9), bp = bg.attributes.position;
  const broth = add(bg, MS('#ffffff', { vertexColors: true, roughness: .15, metalness: .05 }), bowl, false); broth.rotation.x = -Math.PI / 2; broth.position.y = .062;
  const R = mulberry(13);
  for (let i = 0; i < 14; i++) { const d = add(new THREE.CircleGeometry(.004 + R() * .005, 6), MS('#f2b24a', { roughness: .1 }), bowl, false); d.rotation.x = -Math.PI / 2; const a = R() * 6.28, r = R() * .075; d.position.set(Math.cos(a) * r, .0625, Math.sin(a) * r); }
  // noodles: wavy faceted strands, half under the broth
  const nm = MS('#f3c457', { roughness: .55 });
  for (let i = 0; i < 20; i++) {
    const z0 = -.06 + i * .006 + (R() - .5) * .004, pts = [];
    for (let k = 0; k <= 30; k++) { const u = k / 30, x = lerp(-.07, .07, u); pts.push(new V3(x, .0625 + .0042 * Math.sin(u * 22 + i), z0 + .006 * Math.sin(u * 30 + i * 1.7))); }
    const tube = add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, .0032, 4, false), nm, bowl, false); tube.rotation.y = .5;
  }
}
// toppings
const top = {};
{
  const g = new THREE.Group(); scene.add(g); top.eggs = [];
  for (let i = 0; i < 2; i++) {
    const e = new THREE.Group(); g.add(e);
    const dome = add(new THREE.SphereGeometry(.022, 9, 5, 0, Math.PI * 2, 0, Math.PI / 2), MS('#f6f2ea', { roughness: .4 }), e); dome.rotation.x = Math.PI; dome.scale.set(1, .75, 1.35);
    const face = add(new THREE.CircleGeometry(.022, 12), MS('#fbf8f1', { roughness: .4 }), e, false); face.rotation.x = -Math.PI / 2; face.scale.set(1, 1.35, 1);
    const yolk = add(new THREE.CircleGeometry(.0125, 10), MS('#f08f1a', { roughness: .25 }), e, false); yolk.rotation.x = -Math.PI / 2; yolk.position.y = .0012; yolk.scale.set(1, 1.15, 1);
    const jam = add(new THREE.CircleGeometry(.0065, 8), MS('#f7b13d', { roughness: .15 }), e, false); jam.rotation.x = -Math.PI / 2; jam.position.y = .0018;
    top.eggs.push(e);
  }
  top.pork = [];
  for (let i = 0; i < 2; i++) {
    const p = new THREE.Group(); g.add(p);
    add(paint(new THREE.CylinderGeometry(.031, .03, .008, 14), (m, n) => n.y > .5 ? C('#d9927a') : C('#874124'), 20 + i), MS('#ffffff', { vertexColors: true, roughness: .55 }), p);
    const inner = add(new THREE.CircleGeometry(.021, 12), MS('#e8b49a', { roughness: .5 }), p, false); inner.rotation.x = -Math.PI / 2; inner.position.y = .0042;
    const sw = add(new THREE.TorusGeometry(.011, .0018, 3, 12, Math.PI * 1.5), MS('#b8704d'), p, false); sw.rotation.x = -Math.PI / 2; sw.position.y = .0046;
    top.pork.push(p);
  }
  // naruto: scalloped white disc with a pink swirl
  { const n = new THREE.Group(); g.add(n); const geo = new THREE.CylinderGeometry(.017, .017, .004, 16); const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const a = Math.atan2(p.getZ(i), p.getX(i)), r = Math.hypot(p.getX(i), p.getZ(i)); if (r > .001) { const k = 1 + .08 * Math.cos(a * 8); p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); } }
    geo.computeVertexNormals(); add(geo, MS('#fbf6f0', { roughness: .45 }), n);
    const pts = []; for (let k = 0; k <= 40; k++) { const u = k / 40, a = u * Math.PI * 4, r = .002 + u * .011; pts.push(new V3(Math.cos(a) * r, .0024, Math.sin(a) * r)); }
    add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, .0016, 3, false), MS('#ea5a8c'), n, false); top.naruto = n; }
  // nori sheet leaning on the rim
  { const n = new THREE.Group(); g.add(n); add(paint(new THREE.BoxGeometry(.052, .0018, .075, 3, 1, 4), (m, nn) => C(nn.y > 0 ? '#1f2d22' : '#16211a'), 31), MS('#ffffff', { vertexColors: true, roughness: .6 }), n); top.nori = n; }
  // scallion rings
  top.green = []; { const R = mulberry(41); for (let i = 0; i < 16; i++) { const r = add(new THREE.TorusGeometry(.0042, .0016, 4, 7), MS(R() > .4 ? '#5fbf5a' : '#a7dd7c', { roughness: .5 }), g); r.rotation.x = -Math.PI / 2; r.userData = { a: R() * 6.28, d: .02 + R() * .05, t: R() }; top.green.push(r); } }
  // chopsticks
  top.sticks = new THREE.Group(); scene.add(top.sticks);
  for (const s of [-1, 1]) { const geo = new THREE.CylinderGeometry(.0028, .0045, .24, 6); geo.rotateZ(Math.PI / 2); const st = add(paint(geo, (m) => m.x > .09 ? C('#2b2522') : C('#caa06a'), 51 + s), MS('#ffffff', { vertexColors: true, roughness: .5 }), top.sticks); st.position.set(0, .004, s * .009); st.rotation.y = s * .03; }
}
// low-poly steam: faceted puffs rising toward the camera
const steam = []; { const R = mulberry(61), sm = MS('#ffffff', { roughness: .9, transparent: true, opacity: .3, depthWrite: false });
  for (let i = 0; i < 14; i++) { const s = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 0), sm.clone()); scene.add(s); s.userData = { x: (R() - .5) * .1, z: (R() - .5) * .1, ph: R(), dx: (R() - .5) * .06, rot: R() * 6 }; steam.push(s); } }
// splash droplets when the block goes in
const drops = []; { const R = mulberry(71), dm = MS('#d9eef6', { roughness: .05, transparent: true, opacity: .9 });
  for (let i = 0; i < 18; i++) { const d = add(new THREE.TetrahedronGeometry(.004 + R() * .004, 0), dm, scene, false); const a = R() * 6.28; d.userData = { vx: Math.cos(a) * (.15 + R() * .25), vz: Math.sin(a) * (.15 + R() * .25), vy: .6 + R() * .7 }; drops.push(d); } }

// ---------------------------------------------------------------- timeline (prop time is stepped)
const CENTER = new V3(0, 0, .06);
const glide = (t, a, b) => .46 * (1 - oC(seg(t, a, 1.1))) - .5 * iC(seg(t, b, .8));
const dropY = (t, s, h, rest) => { const p = t - s; if (p < 0) return null; const d = .45; if (p < d) return rest + h * (1 - (p / d) ** 2); const q = p - d; return rest + (q < .16 ? Math.sin(q / .16 * Math.PI) * h * .05 : 0); };
function poseProps(t) {
  // pot: 0 → 4.5
  const px = glide(t, 0, 4.2); pot.visible = t < 5.1; pot.position.set(CENTER.x + px, 0, CENTER.z); pot.rotation.y = px * .8;
  const wp = waterGeo.attributes.position.array;
  for (let i = 0; i < wp.length; i += 3) { const x = waterBase[i], y = waterBase[i + 1], r = Math.hypot(x, y); wp[i + 2] = r < .1 ? .0018 * Math.sin(r * 160 - t * 9) + .0012 * Math.sin(x * 90 + t * 7) * Math.cos(y * 80 - t * 5) : 0; }
  waterGeo.attributes.position.needsUpdate = true; waterGeo.computeVertexNormals();
  bubbles.forEach(b => { const u = b.userData, c = ((t / u.per + u.ph) % 1), s = c < .8 ? u.r * Math.sin(c / .8 * Math.PI / 2) : u.r * (1 - (c - .8) / .2) * 1.3; b.scale.setScalar(Math.max(1e-4, s)); b.position.set(u.x, .093, u.z); });
  // noodle block: drops in at 2.6, softens, rides out with the pot
  const by = dropY(t, 2.6, .42, .092); block.visible = by !== null && t < 5.1;
  if (block.visible) { const soak = seg(t, 3.1, 1.0); block.position.set(pot.position.x + .005, t > 3.05 ? .088 - .004 * soak : by, pot.position.z - .004); block.rotation.set(0, .5 + soak * .25 + px * .8, 0); block.scale.set(1 + soak * .12, 1 - soak * .25, 1 + soak * .12); }
  drops.forEach(d => { const u = d.userData, q = t - 3.05; d.visible = q > 0 && q < .55; if (!d.visible) return; d.position.set(pot.position.x + u.vx * q, .095 + u.vy * q - 2.4 * q * q, pot.position.z + u.vz * q); d.rotation.set(q * 9, q * 7, 0); });
  // bowl: 4.4 → end
  const bx = glide(t, 4.4, 99); bowl.visible = t > 4.4; bowl.position.set(CENTER.x + bx, 0, CENTER.z); bowl.rotation.y = bx * .8;
  const at = (x, z) => new V3(bowl.position.x + x, 0, bowl.position.z + z);
  const place = (o, s, x, y, z, ry, h = .4) => { const yy = dropY(t, s, h, y); o.visible = yy !== null; if (!o.visible) return; const p = at(x, z); o.position.set(p.x, yy, p.z); o.rotation.y = ry; };
  place(top.eggs[0], 5.45, .038, .064, -.022, .5); place(top.eggs[1], 5.65, .05, .064, .018, -.2);
  place(top.pork[0], 5.85, -.035, .066, .03, 0); place(top.pork[1], 6.05, -.012, .068, .048, .8);
  place(top.naruto, 6.25, .012, .066, -.05, 0);
  { const s = 6.4, n = top.nori; n.visible = t > s; if (n.visible) { const k = oC(seg(t, s, .5)), p = at(-.055 - (1 - k) * .2, -.03); n.position.set(p.x, .075, p.z); n.rotation.set(0, .3, -.9 * k); } }
  top.green.forEach((r, i) => { const u = r.userData, s = 6.6 + u.t * .35, yy = dropY(t, s, .3, .066); r.visible = yy !== null; if (!r.visible) return; const p = at(Math.cos(u.a) * u.d, Math.sin(u.a) * u.d); r.position.set(p.x, yy, p.z); });
  { const st = top.sticks, k = oC(seg(t, 7.05, .7)); st.visible = t > 7.05; st.position.set(bowl.position.x + .02 + (1 - k) * .4, .084, bowl.position.z + .05 - (1 - k) * .1); st.rotation.set(0, -.55, 0); }
  // steam from whichever vessel is on the table
  steam.forEach((s, i) => { const u = s.userData, src = t < 4.5 ? pot : bowl, on = t < 4.5 ? seg(t, .6, .6) : seg(t, 5.3, .8), c = (t * .55 + u.ph) % 1;
    s.visible = on > 0 && src.visible; if (!s.visible) return; s.position.set(src.position.x + u.x + u.dx * c, .12 + c * .38, src.position.z + u.z - c * .05);
    s.scale.setScalar(.012 + c * .035); s.rotation.set(u.rot + c, u.rot, 0); s.material.opacity = .16 * Math.sin(c * Math.PI) * on; });
}

// ---------------------------------------------------------------- words (smooth), photo, composite
const out = document.getElementById('c'), g = out.getContext('2d');
const FONT = 'Poppins, sans-serif';
function text(s, x, y, size, fill, o = {}) { g.save(); g.globalAlpha = o.a ?? 1; g.translate(x, y); g.scale(o.sx ?? 1, o.sx ?? 1); g.font = `700 ${size}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.shadowColor = 'rgba(0,20,10,.28)'; g.shadowBlur = size * .12; g.shadowOffsetY = size * .03; g.fillStyle = fill; g.fillText(s, 0, 0); g.restore(); }
function words(arr, x, y, size, fill, t, outT, shadow = '#06261a') {
  g.font = `700 ${size}px ${FONT}`; const gap = size * .28; let ws = arr.map(([w]) => g.measureText(w).width), tot = ws.reduce((a, b) => a + b, 0) + gap * (arr.length - 1);
  if (tot > 900) { size *= 900 / tot; g.font = `700 ${size}px ${FONT}`; ws = arr.map(([w]) => g.measureText(w).width); tot = ws.reduce((a, b) => a + b, 0) + size * .28 * (arr.length - 1); }
  let cx = x - tot / 2; arr.forEach(([w, s, col], i) => { const p = seg(t, s, .55), f = 1 - seg(t, outT, .45), wx = cx + ws[i] / 2; cx += ws[i] + size * .28; if (p <= 0 || f <= 0) return;
    text(w, wx, y + (1 - oC(p)) * 30 - (1 - f) * 18, size, col || fill, { a: clamp(p * 2.5) * f, sx: .9 + .1 * oS(p), shadow }); });
}
const bg = new Image(); bg.src = 'bg.jpg';
window.DUR = 8; window.TEXTS = () => [];
window.render = t => {
  const tq = Math.floor(t / STEP + 1e-6) * STEP;           // props move on 12.5 fps steps
  poseProps(tq); renderer.render(scene, cam);
  g.drawImage(bg, 0, -7, W, 1934); g.drawImage(renderer.domElement, 0, 0);
  words([["let's", .25], ['make', .45]], 540, 210, 110, '#ffffff', t, 2.2);
  words([['ramen', .75]], 540, 370, 220, '#fff2a8', t, 2.3, '#c8432c');
  words([['noodles', 2.5], ['in', 2.8]], 540, 290, 170, '#ffffff', t, 4.3);
  words([['add', 5.2], ['toppings', 5.45]], 540, 290, 160, '#ffffff', t, 6.9);
  words([['ready', 7.1, '#fff2a8']], 540, 290, 200, '#fff2a8', t, 99, '#c8432c');
};
const faces = ['600', '700'].map(w => new FontFace('Poppins', `url(fonts/poppins-latin-${w}-normal.woff2)`, { weight: w }));
Promise.all([bg.decode(), ...faces.map(f => f.load().then(ff => document.fonts.add(ff)))]).then(() => { window.render(0); window.READY = true; });
