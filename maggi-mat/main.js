// MAGGI 2-Minute Noodles, mat style (spec sample, not an official ad). Detailed low-poly items, top-down, on the user's green mat photo.
// Story: pack lands and tears open → 1½ cups of water boils → the noodle cake slides out, snaps in four, drops in → tastemaker sachet tears, masala pours,
// the water turns golden → stir, 2-minute timer → the pan slides away, a bowl of masala Maggi arrives and a fork twirls up a bite.
// Item motion is stepped at 12.5 fps (mat style); words move smoothly; 25 fps video.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const W = 1080, H = 1920, STEP = 1 / 12.5, V3 = THREE.Vector3;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, s, d) => clamp((t - s) / d);
const oC = t => 1 - Math.pow(1 - t, 3), iC = t => t * t * t, ioC = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const oS = t => { t -= 1; return 1 + 2.2 * t * t * t + 1.2 * t * t; };
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const RED = '#ed232a', YEL = '#ffe600';

// ---------------------------------------------------------------- renderer (transparent, composited over the mat photo)
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H); renderer.setClearColor(0x000000, 0);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .85;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), .04).texture; scene.environmentIntensity = .25;
scene.add(new THREE.HemisphereLight('#fff6e6', '#3d6b4c', .55));
const key = new THREE.DirectionalLight('#fff2dc', 2.3); key.position.set(-.55, 1.5, -.6); scene.add(key);
key.castShadow = true; key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -.5, right: .5, top: .5, bottom: -.5, near: .2, far: 3 }); key.shadow.bias = -.0006; key.shadow.normalBias = .002;
{ const tb = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), new THREE.ShadowMaterial({ color: '#03190d', opacity: .55 })); tb.rotation.x = -Math.PI / 2; tb.receiveShadow = true; scene.add(tb); }
const cam = new THREE.PerspectiveCamera(41.6, W / H, .05, 5); cam.position.set(0, 1, 0); cam.up.set(0, 0, -1); cam.lookAt(0, 0, 0);
const MS = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .7, metalness: 0, ...o });
const add = (geo, mat, par = scene, cast = true) => { const m = new THREE.Mesh(geo, mat); m.castShadow = cast; m.receiveShadow = true; par.add(m); return m; };
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
const FONT = 'Poppins, sans-serif';

// the red emblem (rounded cloud-like badge) with the white wordmark
function emblem(g, cx, cy, w, h, label = 'MAGGI') {
  g.save(); g.translate(cx, cy); g.fillStyle = RED; g.beginPath();
  const n = 14; for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2, r = 1 + .06 * Math.cos(a * 7); const x = Math.cos(a) * w / 2 * r, y = Math.sin(a) * h / 2 * r; i ? g.lineTo(x, y) : g.moveTo(x, y); }
  g.closePath(); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = h * .05; g.stroke();
  g.fillStyle = '#fff'; g.font = `italic 700 ${h * .5}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(label, 0, h * .04); g.restore();
}
// ---------------------------------------------------------------- the pack (pillow pack lying flat)
const packTex = canvasTex(1024, 760, (g, w, h) => {
  g.fillStyle = YEL; g.fillRect(0, 0, w, h);
  const gr = g.createRadialGradient(w * .62, h * .62, 40, w * .62, h * .62, 520); gr.addColorStop(0, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  emblem(g, 260, 150, 380, 170);
  g.fillStyle = RED; g.font = `700 64px ${FONT}`; g.fillText('2-MINUTE', 70, 340); g.fillText('NOODLES', 70, 410);
  g.fillStyle = '#1f7a3a'; g.beginPath(); g.roundRect(70, 440, 260, 70, 35); g.fill(); g.fillStyle = '#fff'; g.font = `700 44px ${FONT}`; g.fillText('MASALA', 100, 490);
  // the bowl of noodles on the pack
  g.save(); g.translate(720, 470); g.fillStyle = '#c8302c'; g.beginPath(); g.ellipse(0, 40, 250, 150, 0, 0, Math.PI); g.fill(); g.fillStyle = '#f6f0e4'; g.beginPath(); g.ellipse(0, 40, 250, 70, 0, 0, 7); g.fill();
  const R = mulberry(3); g.lineCap = 'round'; for (let i = 0; i < 70; i++) { g.strokeStyle = R() > .5 ? '#f2b740' : '#e39a2e'; g.lineWidth = 6; g.beginPath(); let x = (R() - .5) * 380, y = 20 + (R() - .5) * 90; g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (R() - .5) * 60; y += (R() - .5) * 30 - 6; g.quadraticCurveTo(x + 20, y - 18, x, y); } g.stroke(); }
  for (let i = 0; i < 14; i++) { g.fillStyle = ['#3fa34d', '#e8572a', '#f2d24a'][i % 3]; g.beginPath(); g.arc((R() - .5) * 300, (R() - .5) * 70, 9, 0, 7); g.fill(); }
  g.restore();
  g.fillStyle = 'rgba(160,30,30,.85)'; g.font = `600 30px ${FONT}`; g.fillText('with Masala Tastemaker', 70, 690);
  // crimped ends
  for (const x of [0, w - 46]) { g.fillStyle = 'rgba(0,0,0,.08)'; g.fillRect(x, 0, 46, h); g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 3; for (let y = 0; y < h; y += 14) { g.beginPath(); g.moveTo(x + 6, y); g.lineTo(x + 40, y); g.stroke(); } }
});
const PW = .14, PD = .104;
const pack = new THREE.Group(); scene.add(pack);
{ const yel = MS(YEL, { roughness: .35, metalness: .1 }), top = MS('#ffffff', { map: packTex, roughness: .32, metalness: .12 });
  const g = new THREE.BoxGeometry(PW, .014, PD, 10, 1, 8), p = g.attributes.position;           // puffy pillow: bulge the middle
  for (let i = 0; i < p.count; i++) { const x = p.getX(i) / (PW / 2), z = p.getZ(i) / (PD / 2), bulge = (1 - x * x) * (1 - z * z); p.setY(i, p.getY(i) * (.35 + .65 * bulge) + (p.getY(i) > 0 ? .002 * bulge : 0)); }
  g.computeVertexNormals(); add(g, [yel, yel, top, yel, yel, yel], pack); }
const strip = new THREE.Group(); strip.position.set(-PW / 2, .004, 0); pack.add(strip);                     // the tear-off end
add(new THREE.BoxGeometry(.012, .006, PD), MS(YEL, { roughness: .35 }), strip).position.x = .006;

// ---------------------------------------------------------------- the noodle cake: rows of wavy strands, built in four breakable quarters
const NOODLE_RAW = MS('#f1cf86', { roughness: .62 });
function cakeQuarter(qx, qz) {
  const geos = [], R = mulberry(10 + qx * 3 + qz * 7), CW = .072, CD = .052, layers = 4;
  for (let l = 0; l < layers; l++) for (let r = 0; r < 12; r++) {
    const z0 = (qz - .5) * CD / 2 + (r - 5.5) * (CD / 2 / 12), y = .002 + l * .0042, pts = [];
    for (let k = 0; k <= 26; k++) { const u = k / 26, x = (qx - .5) * CW / 2 + (u - .5) * CW / 2; pts.push(new V3(x, y + .0012 * Math.sin(u * 30 + l), z0 + .0018 * Math.sin(u * 46 + r * 1.3 + l * 2))); }
    geos.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 52, .00125 + R() * .0002, 5, false));
  }
  const grp = new THREE.Group(); add(mergeGeometries(geos), NOODLE_RAW, grp); return grp;
}
const cake = new THREE.Group(); scene.add(cake);
const quarters = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([a, b]) => { const q = cakeQuarter(a, b); q.userData.home = new V3((a - .5) * .0005, 0, (b - .5) * .0005); q.userData.ab = [a, b]; cake.add(q); return q; });

// ---------------------------------------------------------------- saucepan with a long handle, 1½ cups of water
const pan = new THREE.Group(); scene.add(pan);
{ const steel = MS('#b3bbc4', { metalness: .75, roughness: .3, side: THREE.DoubleSide, flatShading: true });
  const prof = [[0, 0], [.08, 0], [.086, .006], [.088, .018], [.088, .07], [.093, .075], [.087, .077], [.084, .072], [.084, .012], [.078, .009], [0, .009]].map(([r, y]) => new THREE.Vector2(r, y));
  add(new THREE.LatheGeometry(prof, 24), steel, pan);
  const hd = add(new THREE.BoxGeometry(.15, .014, .024), MS('#1d1d20', { roughness: .45 }), pan); hd.position.set(.165, .07, 0); hd.rotation.z = .12;
  add(new THREE.BoxGeometry(.03, .01, .02), steel, pan).position.set(.098, .064, 0); }
const waterGeo = new THREE.CircleGeometry(.083, 32), waterBase = waterGeo.attributes.position.array.slice();
const waterM = MS('#6f99ad', { roughness: .25, metalness: .05, transparent: true, opacity: .86 });
const water = add(waterGeo, waterM, pan, false); water.rotation.x = -Math.PI / 2; water.position.y = .052;
const bubbles = []; { const R = mulberry(5), bm = MS('#eef6f8', { roughness: .1, transparent: true, opacity: .8 });
  for (let i = 0; i < 30; i++) { const b = add(new THREE.IcosahedronGeometry(1, 1), bm, pan, false); const a = R() * 6.28, r = Math.sqrt(R()) * .07; b.userData = { x: Math.cos(a) * r, z: Math.sin(a) * r, ph: R(), r: .003 + R() * .005, per: .4 + R() * .5 }; bubbles.push(b); } }
// cooked noodles in the pan: loose curly strands (appear as the cake softens)
function looseNoodles(n, rad, y0, seed, col) {
  const R = mulberry(seed), geos = [];
  for (let i = 0; i < n; i++) { const pts = []; let x = (R() - .5) * rad * 1.4, z = (R() - .5) * rad * 1.4, a = R() * 6.28, y = y0 + R() * .012;
    for (let k = 0; k < 22; k++) { a += (R() - .5) * 1.1; x += Math.cos(a) * .006; z += Math.sin(a) * .006; const r = Math.hypot(x, z); if (r > rad) { x *= rad / r; z *= rad / r; a += Math.PI * .6; } pts.push(new V3(x + .0016 * Math.sin(k * 2.3), y + .002 * Math.sin(k * 1.7 + i), z + .0016 * Math.cos(k * 2.7))); }
    geos.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 44, .00135, 5, false)); }
  return mergeGeometries(geos);
}
const panNoodleM = MS('#f0c46a', { roughness: .45 });
const panNoodles = add(looseNoodles(70, .07, .046, 21), panNoodleM, pan, false);

// ---------------------------------------------------------------- the tastemaker sachet + masala powder
const sachetTex = canvasTex(512, 360, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#f4c23a'); gr.addColorStop(1, '#e8902a'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  emblem(g, 150, 90, 220, 100); g.fillStyle = '#8a1a14'; g.font = `700 58px ${FONT}`; g.fillText('MASALA', 40, 230); g.font = `600 38px ${FONT}`; g.fillText('TASTEMAKER', 40, 285);
  g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(0, 0, w, 14); g.fillRect(0, h - 14, w, 14);
  for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(200,60,20,.3)'; g.beginPath(); g.arc(330 + Math.random() * 160, 160 + Math.random() * 160, 4 + Math.random() * 6, 0, 7); g.fill(); } });
const sachet = new THREE.Group(); scene.add(sachet);
add(new THREE.BoxGeometry(.06, .004, .042), [MS('#e8a22a'), MS('#e8a22a'), MS('#ffffff', { map: sachetTex, roughness: .3, metalness: .15 }), MS('#e8a22a'), MS('#e8a22a'), MS('#e8a22a')], sachet);
const corner = new THREE.Group(); corner.position.set(.03, .002, -.021); sachet.add(corner); add(new THREE.BoxGeometry(.012, .004, .012), MS('#f0b03a', { roughness: .3 }), corner).position.set(-.006, 0, .006);
const POW = 160, powder = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.0016, 0), MS('#d9651e', { roughness: .8 }), POW); scene.add(powder);
const powD = (() => { const R = mulberry(9), a = []; for (let i = 0; i < POW; i++) a.push({ d: R() * .9, dx: (R() - .5) * .02, dz: (R() - .5) * .02, s: .7 + R() * .8 }); return a; })();

// ---------------------------------------------------------------- serving bowl with masala Maggi, and a fork
const bowl = new THREE.Group(); scene.add(bowl);
{ const prof = [[0, 0], [.045, 0], [.05, .008], [.07, .03], [.088, .062], [.092, .072], [.087, .074], [.082, .064], [.066, .034], [.044, .014], [0, .012]].map(([r, y]) => new THREE.Vector2(r, y));
  add(new THREE.LatheGeometry(prof, 32), MS('#fbf7ef', { roughness: .25 }), bowl);
  const band = add(new THREE.TorusGeometry(.09, .0035, 6, 48), MS(RED, { roughness: .35 }), bowl); band.rotation.x = Math.PI / 2; band.position.y = .072; }
const MASALA = MS('#e9a640', { roughness: .4 });
add(looseNoodles(120, .072, .045, 31), MASALA, bowl, false);
add(looseNoodles(60, .055, .058, 41), MS('#f0b24c', { roughness: .4 }), bowl, false);
{ const R = mulberry(51); for (let i = 0; i < 30; i++) { const s = add(new THREE.IcosahedronGeometry(.002 + R() * .0015, 0), MS(R() > .5 ? '#c8521c' : '#a8401a'), bowl, false); const a = R() * 6.28, r = Math.sqrt(R()) * .06; s.position.set(Math.cos(a) * r, .066 + R() * .006, Math.sin(a) * r); } }
const fork = new THREE.Group(); scene.add(fork);
{ const st = MS('#c9d0d8', { metalness: .8, roughness: .25 }); add(new THREE.BoxGeometry(.012, .004, .13), st, fork).position.z = .07;
  add(new THREE.BoxGeometry(.022, .004, .02), st, fork).position.z = .0; for (let i = 0; i < 4; i++) add(new THREE.BoxGeometry(.003, .004, .03), st, fork).position.set(-.0084 + i * .0056, 0, -.024); }
const twirl = new THREE.Group(); fork.add(twirl);
{ const geos = []; for (let i = 0; i < 12; i++) { const pts = []; for (let k = 0; k <= 40; k++) { const u = k / 40, a = u * Math.PI * 6 + i, r = .012 + .004 * Math.sin(i); pts.push(new V3(Math.cos(a) * r, -.004 - u * .02 + .003 * Math.sin(i * 3), -.034 + Math.sin(a) * r * .6)); } geos.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, .0014, 5, false)); }
  add(mergeGeometries(geos), MASALA, twirl, false); }
const steam = []; { const R = mulberry(61); for (let i = 0; i < 12; i++) { const s = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 0), MS('#ffffff', { roughness: .9, transparent: true, opacity: .2, depthWrite: false })); scene.add(s); s.userData = { x: (R() - .5) * .09, z: (R() - .5) * .09, ph: R(), rot: R() * 6 }; steam.push(s); } }
const drops = []; { const R = mulberry(71), dm = MS('#d9eef6', { roughness: .05, transparent: true, opacity: .9 }); for (let i = 0; i < 16; i++) { const d = add(new THREE.TetrahedronGeometry(.003 + R() * .003, 0), dm, scene, false); const a = R() * 6.28; d.userData = { vx: Math.cos(a) * (.12 + R() * .2), vz: Math.sin(a) * (.12 + R() * .2), vy: .5 + R() * .6 }; drops.push(d); } }

// ---------------------------------------------------------------- timeline
const PAN = new V3(.02, 0, .1), glide = (t, a, b, d = .48) => d * (1 - oC(seg(t, a, 1.0))) - .55 * iC(seg(t, b, .8));
const dropY = (t, s, h, rest) => { const p = t - s; if (p < 0) return null; const d = .4; if (p < d) return rest + h * (1 - (p / d) ** 2); const q = p - d; return rest + (q < .14 ? Math.sin(q / .14 * Math.PI) * h * .05 : 0); };
const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion();
function pose(t) {
  // pack: lands upper-left at 0.3, end strip tears at 2.5, stays till the end, returns to the bowl's side for the final shot
  const py = dropY(t, .3, .35, .008), pf = seg(t, 12.2, .9);
  pack.visible = py !== null; if (pack.visible) { pack.position.set(lerp(-.07, -.11, oC(pf)), py, lerp(-.14, -.16, oC(pf))); pack.rotation.set(0, lerp(.18, .32, pf), 0); }
  const tear = oC(seg(t, 2.5, .5)); strip.position.set(-PW / 2 - tear * .05, .004 + Math.sin(tear * Math.PI) * .03, tear * .02); strip.rotation.set(tear * .4, tear * .9, tear * 1.4); strip.visible = t > 2.4 && t < 3.1; strip.scale.setScalar(1 - seg(t, 2.8, .3));
  // pan slides in at 2.6, leaves at 10.8
  const px = glide(t, 2.6, 10.8); pan.visible = t > 2.6 && t < 11.8; pan.position.set(PAN.x + px, 0, PAN.z); pan.rotation.y = -px * .6;
  const wp = waterGeo.attributes.position.array; for (let i = 0; i < wp.length; i += 3) { const x = waterBase[i], y = waterBase[i + 1], r = Math.hypot(x, y); wp[i + 2] = r < .08 ? .0016 * Math.sin(r * 180 - t * 9) + .001 * Math.sin(x * 100 + t * 7) * Math.cos(y * 90 - t * 5) : 0; }
  waterGeo.attributes.position.needsUpdate = true; waterGeo.computeVertexNormals();
  const gold = seg(t, 7.7, 1.2); waterM.color.set('#6f99ad').lerp(new THREE.Color('#d98a2c'), gold); waterM.opacity = lerp(.86, .95, gold);
  bubbles.forEach(b => { const u = b.userData, c = ((t / u.per + u.ph) % 1), s = c < .8 ? u.r * Math.sin(c / .8 * Math.PI / 2) : u.r * (1 - (c - .8) / .2) * 1.3; b.scale.setScalar(Math.max(1e-4, s * seg(t, 3.2, .6))); b.position.set(u.x, .054, u.z); });
  // the cake: slides out of the torn end (4.4), snaps into quarters (5.2), quarters drop into the pan (5.6–6.3)
  const out = oC(seg(t, 4.4, .7)), snap = oC(seg(t, 5.2, .25)); cake.visible = t > 4.4 && t < 9.4;
  const cakeBase = new V3(lerp(pack.position.x - .06, .0, out), .012 + Math.sin(out * Math.PI) * .03, lerp(pack.position.z, -.06, out));
  quarters.forEach((q, i) => { const [a, b] = q.userData.ab, s = 5.6 + i * .18, fall = seg(t, s, .38), soft = seg(t, 7.0, 2.0);
    const spread = new V3((a - .5) * .016 * snap, 0, (b - .5) * .016 * snap);
    const target = new V3(PAN.x + px + (a - .5) * .03, .05, PAN.z + (b - .5) * .03);
    const p = cakeBase.clone().add(spread).lerp(target, ioC(fall)); p.y += Math.sin(fall * Math.PI) * .06;
    q.position.copy(p); q.rotation.set((b - .5) * .3 * snap * (1 - fall), (a - .5) * .4 * fall, (a - .5) * .3 * snap * (1 - fall)); q.scale.set(1 + soft * .3, Math.max(.05, 1 - soft * .9), 1 + soft * .3); q.visible = soft < .98; });
  const loose = seg(t, 7.4, 1.6); panNoodles.visible = loose > 0; panNoodles.scale.set(lerp(.6, 1, loose), loose, lerp(.6, 1, loose)); panNoodleM.color.set('#f1cf86').lerp(new THREE.Color('#e9a640'), gold); panNoodles.rotation.y = t * .5 * seg(t, 9, .3);
  drops.forEach(d => { const u = d.userData, q = t - 5.95; d.visible = q > 0 && q < .5; if (!d.visible) return; d.position.set(PAN.x + px + u.vx * q, .06 + u.vy * q - 2.4 * q * q, PAN.z + u.vz * q); d.rotation.set(q * 9, q * 7, 0); });
  // sachet: slides in at 6.9, corner tears 7.4, tips over the pan and pours 7.6–8.6, slides away 9.2
  const sx = glide(t, 6.9, 9.2, .4); sachet.visible = t > 6.9 && t < 10.2; const tilt = oC(seg(t, 7.55, .35)) * (1 - seg(t, 8.8, .3));
  sachet.position.set(PAN.x + .07 + sx, .1 + tilt * .03, PAN.z - .1); sachet.rotation.set(tilt * .9, -.6, tilt * .3);
  const ct = oC(seg(t, 7.35, .3)); corner.rotation.set(ct * .8, ct * 1.2, ct * .6); corner.position.set(.03 + ct * .02, .002 + Math.sin(ct * Math.PI) * .02, -.021 - ct * .015); corner.visible = ct < .97;
  for (let i = 0; i < POW; i++) { const d = powD[i], k = (t - 7.6 - d.d) / .45; const vis = k > 0 && k < 1 && t < 8.9; if (!vis) { m4.makeScale(0, 0, 0); powder.setMatrixAt(i, m4); continue; }
    m4.compose(new V3(PAN.x + .045 + d.dx * k + px, lerp(.12, .055, k * k), PAN.z - .075 + d.dz * k + k * .03), q4, new V3(d.s, d.s, d.s)); powder.setMatrixAt(i, m4); }
  powder.instanceMatrix.needsUpdate = true;
  // serving bowl arrives 11.0; fork dives in 12.2 and twirls up a bite 12.8–13.8
  const bx = glide(t, 11.0, 99); bowl.visible = t > 11; bowl.position.set(.03 + bx, 0, .08); bowl.rotation.y = -bx * .5;
  const fin = oC(seg(t, 12.1, .6)), lift = ioC(seg(t, 12.9, .9)); fork.visible = t > 12.1;
  fork.position.set(lerp(.3, .05, fin) + bx, lerp(.07, .066, fin) + lift * .26, lerp(.25, .1, fin) - lift * .02); fork.rotation.set(0, .5, 0);
  twirl.position.set(0, 0, -.034); twirl.children[0].position.z = .034; twirl.rotation.y = (t > 12.5 ? (t - 12.5) * 6 : 0) * (1 - lift * .6); twirl.visible = t > 12.6; twirl.scale.setScalar(1.4 * seg(t, 12.6, .4));
  // steam over whatever is hot
  steam.forEach(s => { const u = s.userData, src = t < 11 ? pan : bowl, on = t < 11 ? seg(t, 3.4, .8) : seg(t, 11.6, .6), c = (t * .55 + u.ph) % 1;
    s.visible = on > 0 && src.visible; if (!s.visible) return; s.position.set(src.position.x + u.x, .09 + c * .32, src.position.z + u.z - c * .05); s.scale.setScalar(.01 + c * .03); s.rotation.set(u.rot + c, u.rot, 0); s.material.opacity = .16 * Math.sin(c * Math.PI) * on; });
}

// ---------------------------------------------------------------- words: Poppins Bold, no outline, very slight soft shadow
const outC = document.getElementById('c'), g = outC.getContext('2d');
function text(s, x, y, size, fill, o = {}) { g.save(); g.globalAlpha = o.a ?? 1; g.translate(x, y); g.scale(o.sx ?? 1, o.sx ?? 1); g.font = `700 ${size}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.shadowColor = 'rgba(0,20,10,.3)'; g.shadowBlur = size * .12; g.shadowOffsetY = size * .03; g.fillStyle = fill; g.fillText(s, 0, 0); g.restore(); }
function words(arr, x, y, size, fill, t, outT) {
  g.font = `700 ${size}px ${FONT}`; const gap = size * .28; let ws = arr.map(([w]) => g.measureText(w).width), tot = ws.reduce((a, b) => a + b, 0) + gap * (arr.length - 1);
  if (tot > 920) { size *= 920 / tot; g.font = `700 ${size}px ${FONT}`; ws = arr.map(([w]) => g.measureText(w).width); tot = ws.reduce((a, b) => a + b, 0) + size * .28 * (arr.length - 1); }
  let cx = x - tot / 2; arr.forEach(([w, s, col], i) => { const p = seg(t, s, .55), f = 1 - seg(t, outT, .45), wx = cx + ws[i] / 2; cx += ws[i] + size * .28; if (p <= 0 || f <= 0) return;
    text(w, wx, y + (1 - oC(p)) * 30 - (1 - f) * 18, size, col || fill, { a: clamp(p * 2.5) * f, sx: .9 + .1 * oS(p) }); });
}
// the 2-minute timer ring (smooth, part of the graphics layer)
function timer(t) { const a = seg(t, 9.0, .3) * (1 - seg(t, 10.9, .3)); if (a <= 0) return; const k = seg(t, 9.2, 1.5), sec = Math.ceil(120 * (1 - k)), x = 820, y = 640;
  g.save(); g.globalAlpha = a; g.shadowColor = 'rgba(0,20,10,.3)'; g.shadowBlur = 14; g.fillStyle = 'rgba(255,255,255,.92)'; g.beginPath(); g.arc(x, y, 118, 0, 7); g.fill(); g.shadowBlur = 0;
  g.strokeStyle = RED; g.lineWidth = 16; g.lineCap = 'round'; g.beginPath(); g.arc(x, y, 96, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - k)); g.stroke();
  g.fillStyle = '#222'; g.font = `700 54px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(`${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`, x, y + 4); g.restore(); }
const bg = new Image(); bg.src = 'bg.jpg';
window.DUR = 14; window.TEXTS = () => [];
window.render = t => {
  const tq = Math.floor(t / STEP + 1e-6) * STEP;           // items move on 12.5 fps steps
  pose(tq); renderer.render(scene, cam);
  g.drawImage(bg, 0, -7, W, 1934); g.drawImage(renderer.domElement, 0, 0);
  words([["it's", .2], ['Maggi', .45, YEL], ['time', .75]], 540, 250, 150, '#ffffff', t, 2.4);
  words([['boil', 2.8], ['1½', 3.05, YEL], ['cups', 3.3], ['water', 3.55]], 540, 250, 120, '#ffffff', t, 4.5);
  words([['break', 4.7], ['it', 4.95], ['in', 5.1], ['four', 5.3, YEL]], 540, 250, 130, '#ffffff', t, 6.8);
  words([['add', 7.0], ['the', 7.2], ['masala', 7.4, YEL]], 540, 250, 140, '#ffffff', t, 8.9);
  words([['cook', 9.0], ['2', 9.25, YEL], ['minutes', 9.45]], 540, 250, 140, '#ffffff', t, 10.8);
  words([['ready', 11.2], ['in', 11.45], ['2', 11.65, YEL], ['minutes', 11.85, YEL]], 540, 250, 130, '#ffffff', t, 99);
  timer(t);
};
const faces = ['600', '700'].map(w => new FontFace('Poppins', `url(fonts/poppins-latin-${w}-normal.woff2)`, { weight: w }));
Promise.all([bg.decode(), ...faces.map(f => f.load().then(ff => document.fonts.add(ff)))]).then(() => { window.render(0); window.READY = true; });
