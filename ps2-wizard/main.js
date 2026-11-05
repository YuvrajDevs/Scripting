// PS2 style: a wizard with a big hat runs, badly, through a forest. 5 s.
// Pipeline: render the 3D scene small (360×640, no AA) → Kuwahara oil-paint smear → soft upscale to 1080×1920 with a little posterize.
// Motion is stepped at 12.5 fps (like the 12 fps references) inside a 25 fps video.
import * as THREE from 'three';
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';
import { GroundedSkybox } from 'three/addons/objects/GroundedSkybox.js';

const W = 1080, H = 1920, LW = 360, LH = 640, STEP = 1 / 12.5;
const V3 = THREE.Vector3;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), lerp = (a, b, t) => a + (b - a) * t;
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H); document.body.appendChild(renderer.domElement);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.55;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;

function canvasTex(w, h, draw, rep = 1) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); return t; }
const blotch = (cols, n, rmin, rmax, seed) => (g, w, h) => { const R = mulberry(seed); g.fillStyle = cols[0]; g.fillRect(0, 0, w, h); for (let i = 0; i < n; i++) { g.fillStyle = cols[1 + Math.floor(R() * (cols.length - 1))]; g.globalAlpha = .35 + R() * .5; g.beginPath(); g.ellipse(R() * w, R() * h, rmin + R() * (rmax - rmin), rmin + R() * (rmax - rmin) * .6, R() * 3, 0, 7); g.fill(); } g.globalAlpha = 1; };
const NZ = (() => { const R = mulberry(77), N = 64, gr = Array.from({ length: N * N }, () => R()); const vn = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), at = (i, j) => gr[((j % N + N) % N) * N + ((i % N + N) % N)]; return lerp(lerp(at(xi, yi), at(xi + 1, yi), u), lerp(at(xi, yi + 1), at(xi + 1, yi + 1), u), v); };
  return (x, y) => { let a = 0, amp = .5, f = 1; for (let o = 0; o < 5; o++) { a += amp * vn(x * f, y * f); amp *= .5; f *= 2.07; } return a; }; })();
const noiseTex = (w, h, sx, sy, cols, rep) => canvasTex(w, h, (g) => { const im = g.createImageData(w, h), C = cols.map(c => new THREE.Color(c));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const n = clamp((NZ(x / sx, y / sy) - .2) / .6) * (C.length - 1), i0 = Math.min(C.length - 2, Math.floor(n)), k = C[i0].clone().lerp(C[i0 + 1], n - i0), i = (y * w + x) * 4; im.data[i] = k.r * 255; im.data[i + 1] = k.g * 255; im.data[i + 2] = k.b * 255; im.data[i + 3] = 255; }
  g.putImageData(im, 0, 0); }, rep);
const grassTex = noiseTex(256, 256, 22, 22, ['#4f7030', '#6a8c3c', '#8aa84e', '#a8bc68', '#c8cc8c'], 22);
const pathTex = noiseTex(256, 256, 18, 30, ['#7a6648', '#988260', '#b49e7a', '#cdbb96'], 8);
const barkTex = noiseTex(64, 256, 6, 40, ['#2e231a', '#4a3a2a', '#6a5640', '#7c6a52'], 1);
const leafTex = noiseTex(256, 256, 12, 12, ['#33582a', '#4f7a34', '#74a044', '#9cc062', '#c6d88e'], 2);
const skyTex = canvasTex(360, 640, (g, w, h) => {
  const R = mulberry(2), N = 64, grid = Array.from({ length: N * N }, () => R());
  const vn = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const at = (i, j) => grid[((j % N + N) % N) * N + ((i % N + N) % N)]; return lerp(lerp(at(xi, yi), at(xi + 1, yi), u), lerp(at(xi, yi + 1), at(xi + 1, yi + 1), u), v); };
  const fbm = (x, y) => { let a = 0, amp = .5, f = 1; for (let o = 0; o < 5; o++) { a += amp * vn(x * f, y * f); amp *= .5; f *= 2.03; } return a; };
  const img = g.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const k = y / h, sx = x / 70, sy = y / 45;
    let r = lerp(58, 170, k), gg = lerp(110, 200, k), bb = lerp(205, 232, k);
    const n = fbm(sx, sy) - k * .08, c = clamp((n - .4) / .14), lit = clamp((fbm(sx, sy - .25) - n) * 4 + .5);
    const cr = lerp(150, 252, lit), cg = lerp(160, 252, lit), cb = lerp(190, 255, lit);
    r = lerp(r, cr, c); gg = lerp(gg, cg, c); bb = lerp(bb, cb, c);
    const i = (y * w + x) * 4; img.data[i] = r; img.data[i + 1] = gg; img.data[i + 2] = bb; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
});
skyTex.repeat.set(1, 1);

const scene = new THREE.Scene(); scene.background = skyTex; scene.fog = new THREE.Fog('#c9d6c0', 9, 46);
scene.add(new THREE.HemisphereLight('#f0f4ff', '#94a070', .5));
const sun = new THREE.DirectionalLight('#fff0d0', 2.6); sun.position.set(-6, 12, -10); scene.add(sun, sun.target); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); sun.shadow.radius = 4; Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 50 });
const MS = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .9, ...o });
const mesh = (geo, mat, par = scene) => { const m = new THREE.Mesh(geo, mat); m.castShadow = m.receiveShadow = true; par.add(m); return m; };

// ---------------------------------------------------------------- photo-real environment: CC0 forest HDRI, projected onto the ground
const hdr = await new EXRLoader().loadAsync('assets/forest.exr'); hdr.mapping = THREE.EquirectangularReflectionMapping;
scene.environment = hdr; scene.environmentIntensity = 1.1; scene.background = null; scene.fog = null;
const ROT = +(new URLSearchParams(location.search).get('rot') ?? 1.57);
const sky = new GroundedSkybox(hdr, 2.2, 90); sky.position.y = 2.2 - .01; sky.rotation.y = ROT; scene.add(sky); scene.environmentRotation.y = ROT;
{ const sh = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ color: '#1a1408', opacity: .42 })); sh.rotation.x = -Math.PI / 2; sh.position.y = .005; sh.receiveShadow = true; scene.add(sh); }
const glareTex = canvasTex(256, 256, (g) => { const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128); gr.addColorStop(0, 'rgba(255,255,250,1)'); gr.addColorStop(.12, 'rgba(255,250,235,1)'); gr.addColorStop(.3, 'rgba(255,225,190,.45)'); gr.addColorStop(1, 'rgba(255,210,170,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); });
const glare = new THREE.Sprite(new THREE.SpriteMaterial({ map: glareTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); glare.scale.set(70, 70, 1); glare.material.opacity = .35; scene.add(glare);
// light shafts and floating pollen (the dreamy drift)
const shafts = [];
const pollen = (() => { const R = mulberry(21), n = 500, pos = new Float32Array(n * 3), seed = []; for (let i = 0; i < n; i++) seed.push([R() * 20 - 10, R() * 6, -3 - R() * 30, R()]);
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dot = canvasTex(32, 32, (g) => { const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.5, 'rgba(255,255,255,.8)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); });
  const p = new THREE.Points(geo, new THREE.PointsMaterial({ color: '#fffaf0', map: dot, size: .11, transparent: true, opacity: .9, depthWrite: false, fog: false })); p.frustumCulled = false; scene.add(p); return { p, seed, pos }; })();

// ---------------------------------------------------------------- the wizard (matched to the reference): smooth flowing coat, olive trim, plum cowl,
// faceted mannequin head with a warm sunlit patch, huge sagging brim + tall bent cone, puffy white gloves with fur cuffs, baggy trousers, boots, staff, pack
const coatM = MS('#8c7480'), tunicM = MS('#624868'), cowlM = MS('#7e5276'), trimM = MS('#7c6c4a'), pantsM = MS('#584654'), bootM = MS('#463a32'), gloveM = MS('#f0eee8'), furM = MS('#e6e2da'), hatM = MS('#6e5262', { emissive: '#2a1e24', emissiveIntensity: .8 }), packM = MS('#5e5a3a');
const wiz = new THREE.Group(); scene.add(wiz);
const hips = new THREE.Group(); hips.position.y = .98; wiz.add(hips);
const torso = new THREE.Group(); hips.add(torso);
const lathe = (pts, seg = 22) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);
// coat: one smooth lathe from shoulders to below the knee, slightly open at the front
const coat = mesh(lathe([[.0, .74], [.2, .73], [.27, .66], [.29, .45], [.26, .22], [.27, .05]], 26), coatM, torso);
const coatSkirt = mesh(lathe([[.27, .08], [.3, -.1], [.36, -.32], [.41, -.5], [.42, -.53]], 26), coatM, hips); coatSkirt.material.side = THREE.DoubleSide;
const tun = mesh(new THREE.CylinderGeometry(.12, .15, .6, 10, 1, true, -.7, 1.4), tunicM, torso); tun.position.set(0, .4, .135);
for (const s of [-1, 1]) {      // thick olive trim running down both front edges
  const pts = [new V3(s * .1, .74, .19), new V3(s * .14, .5, .27), new V3(s * .12, .2, .25), new V3(s * .15, -.1, .28), new V3(s * .2, -.5, .38)];
  const tr = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, .04, 6, false), trimM, torso); }
const cowl = mesh(new THREE.TorusGeometry(.15, .085, 10, 20), cowlM, torso); cowl.rotation.x = Math.PI / 2; cowl.position.y = .78; cowl.scale.set(1, 1.2, 1.25);
const pack = mesh(new THREE.BoxGeometry(.48, .58, .32, 3, 3, 3), packM, torso); pack.position.set(0, .45, -.36); { const p = pack.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const v = new V3(p.getX(i), p.getY(i), p.getZ(i)); const k = .8 + .2 * (1 - v.length() * 1.6); p.setXYZ(i, v.x * (1 + .1 * k), v.y, v.z * (1 + .2 * k)); } pack.geometry.computeVertexNormals(); }
// head: faceted mannequin; facets facing the sun go warm
const headG = new THREE.Group(); headG.position.y = .9; torso.add(headG);
{ let g = new THREE.IcosahedronGeometry(.155, 1); g = g.toNonIndexed(); const p = g.attributes.position.array, col = [], a = new V3(), b = new V3(), c = new V3(), n = new V3();
  for (let i = 0; i < p.length; i += 9) { a.fromArray(p, i); b.fromArray(p, i + 3); c.fromArray(p, i + 6); n.crossVectors(b.clone().sub(a), c.clone().sub(a)).normalize();
    const warm = n.z > .35 && n.y > -.25 && n.y < .55, k = warm ? new THREE.Color('#e3b25a') : new THREE.Color('#b4b8c2').lerp(new THREE.Color('#8f96a6'), clamp(-n.y)); for (let j = 0; j < 3; j++) col.push(k.r, k.g, k.b); }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.scale(.92, 1.2, .98);
  const hd = mesh(g, MS('#ffffff', { vertexColors: true, flatShading: true, roughness: .75, emissive: '#5a5040', emissiveIntensity: .6 }), headG); hd.position.y = .1; }
// hat: wide sagging brim + tall cone bending back, in three jointed sections for lag
const hat = new THREE.Group(); hat.position.y = .25; headG.add(hat);
{ const g = new THREE.CircleGeometry(.66, 28, 0, Math.PI * 2); g.rotateX(-Math.PI / 2); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const r = Math.hypot(p.getX(i), p.getZ(i)), a = Math.atan2(p.getZ(i), p.getX(i)); p.setY(i, -.16 * Math.pow(r / .66, 2) + .03 * Math.sin(a * 3)); } g.computeVertexNormals();
  const brim = mesh(g, hatM, hat); brim.material.side = THREE.DoubleSide; brim.castShadow = false; }
const cone1 = new THREE.Group(); hat.add(cone1); mesh(lathe([[.25, 0], [.235, .08], [.215, .17], [.19, .27], [.17, .35], [.15, .42]], 18), hatM, cone1);
const cone2 = new THREE.Group(); cone2.position.y = .42; cone1.add(cone2); mesh(lathe([[.15, 0], [.135, .08], [.118, .16], [.1, .24], [.083, .31], [.07, .36]], 16), hatM, cone2);
const cone3 = new THREE.Group(); cone3.position.y = .36; cone2.add(cone3); mesh(lathe([[.07, 0], [.058, .07], [.044, .14], [.03, .2], [.014, .26], [0, .3]], 14), hatM, cone3);
// limbs: smooth tapered sleeves / trousers
function seg(par, len, r0, r1, mat) { const g = new THREE.Group(); par.add(g); const m = mesh(lathe([[0, 0], [r0, -.02], [lerp(r0, r1, .5) * 1.04, -len * .5], [r1, -len], [0, -len - .02]], 14), mat, g); return g; }
function arm(s) { const sh = new THREE.Group(); sh.position.set(s * .27, .66, 0); torso.add(sh); const up = seg(sh, .33, .1, .085, coatM); const el = new THREE.Group(); el.position.y = -.33; up.add(el); const lo = seg(el, .3, .09, .1, coatM);
  const cuff = mesh(new THREE.TorusGeometry(.085, .045, 8, 14), furM, el); cuff.position.y = -.31; cuff.rotation.x = Math.PI / 2;
  const hand = mesh(new THREE.SphereGeometry(.1, 12, 10), gloveM, el); hand.position.y = -.4; hand.scale.set(.85, 1.1, .75); return [sh, el]; }
function leg(s) { const hp = new THREE.Group(); hp.position.set(s * .13, -.08, 0); hips.add(hp); seg(hp, .44, .13, .11, pantsM); const kn = new THREE.Group(); kn.position.y = -.44; hp.add(kn); seg(kn, .38, .11, .09, pantsM);
  const boot = mesh(new THREE.CapsuleGeometry(.08, .16, 4, 10), bootM, kn); boot.position.set(0, -.44, .06); boot.rotation.x = Math.PI / 2; return [hp, kn]; }
const armL = arm(1), armR = arm(-1), legL = leg(1), legR = leg(-1);
const staff = new THREE.Group(); armR[1].add(staff); staff.position.set(0, -.42, .04);
mesh(new THREE.CylinderGeometry(.04, .05, 1.7, 8), MS('#6a4a2e'), staff); const knob = mesh(new THREE.SphereGeometry(.08, 10, 8), MS('#5c3e26'), staff); knob.position.y = .86; knob.scale.y = 1.4;

// smooth, slightly goofy run: proper cycle with overlap and follow-through
function poseWizard(t) {
  const f = 1.55, ph = t * Math.PI * 2 * f, s = Math.sin(ph), c = Math.cos(ph);
  const z = -4 + t * 2.7, wob = Math.sin(t * 2.1) * .35;
  wiz.position.set(wob, .06 + Math.pow(Math.abs(Math.sin(ph)), 1.5) * .16, z); wiz.rotation.y = Math.cos(t * 2.1) * .28;
  hips.rotation.set(.08, s * .22, Math.sin(ph) * .06);
  torso.rotation.set(.22 + Math.abs(c) * .06, -s * .3, -s * .05);
  legL[0].rotation.x = -s * .95 - .1; legL[1].rotation.x = Math.max(0, Math.sin(ph + .9)) * 1.6 + .15;
  legR[0].rotation.x = s * .95 - .1; legR[1].rotation.x = Math.max(0, Math.sin(ph + .9 + Math.PI)) * 1.6 + .15;
  // the funny part: the free arm flaps high and loose, the staff arm pumps stiffly
  const flap = Math.sin(ph * 2 + .6);
  armL[0].rotation.set(s * 1.1 - .2, 0, .5 + .7 * (.5 + .5 * flap)); armL[1].rotation.set(-.6 - .5 * Math.max(0, flap), 0, 0);
  armR[0].rotation.set(-s * .9 - .3, 0, -.25); armR[1].rotation.set(-1.0 + c * .2, 0, 0); staff.rotation.set(1.25 + s * .2, 0, .1);
  headG.rotation.set(-.12 + Math.sin(ph * 2) * .06, s * .18, -s * .08);
  // the hat follows a beat late
  const lag = k => Math.sin(ph - k), lagA = k => Math.abs(Math.sin(ph - k));
  hat.rotation.set(-.3 - lag(.5) * .07, 0, lag(.5) * .1);
  cone1.rotation.set(-.15 - lagA(.8) * .12, 0, lag(.8) * .1); cone2.rotation.set(-.45 - lagA(1.3) * .2, 0, lag(1.3) * .2); cone3.rotation.set(-.6 - lagA(1.8) * .3, 0, lag(1.8) * .3);
  coatSkirt.rotation.set(-s * .04 - .03, 0, Math.sin(ph * 2) * .03);
}

// ---------------------------------------------------------------- PS2 look: low-res render → Kuwahara smear → soft upscale + posterize
const rtScene = new THREE.WebGLRenderTarget(LW, LH, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, type: THREE.HalfFloatType });
const rtPaint = new THREE.WebGLRenderTarget(LW, LH, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, type: THREE.HalfFloatType });
const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), quadGeo = new THREE.PlaneGeometry(2, 2);
const vs = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`;
const kuwa = new THREE.ShaderMaterial({ uniforms: { src: { value: rtScene.texture }, px: { value: new THREE.Vector2(1 / LW, 1 / LH) } }, vertexShader: vs, fragmentShader: `
  uniform sampler2D src; uniform vec2 px; varying vec2 vUv;
  void main(){
    vec3 m0 = vec3(0.), m1 = vec3(0.), m2 = vec3(0.), m3 = vec3(0.), q0 = vec3(0.), q1 = vec3(0.), q2 = vec3(0.), q3 = vec3(0.);
    for (int j = 0; j <= 5; j++) for (int i = 0; i <= 5; i++) {
      vec3 a = texture2D(src, vUv + vec2(-float(i), -float(j)) * px).rgb; m0 += a; q0 += a * a;
      vec3 b = texture2D(src, vUv + vec2( float(i), -float(j)) * px).rgb; m1 += b; q1 += b * b;
      vec3 c = texture2D(src, vUv + vec2(-float(i),  float(j)) * px).rgb; m2 += c; q2 += c * c;
      vec3 d = texture2D(src, vUv + vec2( float(i),  float(j)) * px).rgb; m3 += d; q3 += d * d;
    }
    float n = 36.; m0 /= n; m1 /= n; m2 /= n; m3 /= n;
    float v0 = dot(q0 / n - m0 * m0, vec3(1.)), v1 = dot(q1 / n - m1 * m1, vec3(1.)), v2 = dot(q2 / n - m2 * m2, vec3(1.)), v3 = dot(q3 / n - m3 * m3, vec3(1.));
    vec3 col = m0; float best = v0;
    if (v1 < best) { best = v1; col = m1; } if (v2 < best) { best = v2; col = m2; } if (v3 < best) { col = m3; }
    gl_FragColor = vec4(col, 1.);
  }` });
const outM = new THREE.ShaderMaterial({ uniforms: { src: { value: rtPaint.texture }, res: { value: new THREE.Vector2(LW, LH) } }, vertexShader: vs, fragmentShader: `
  uniform sampler2D src; uniform vec2 res; varying vec2 vUv;
  void main(){
    vec2 p = vUv * res, f = fract(p); vec2 snap = (floor(p) + .5 + (f - .5) * .55) / res;     // part-way to nearest: soft but stair-stepped edges
    vec3 c = texture2D(src, snap).rgb;
    c = floor(c * 26. + .5) / 26.;                                                         // light posterize
    float l = dot(c, vec3(.299, .587, .114)); c = mix(vec3(l), c, 1.0); c = (c - .5) * 1.06 + .5;
    vec2 d = vUv - .5; c *= 1. - dot(d, d) * .35;
    gl_FragColor = vec4(clamp(c, 0., 1.), 1.);
  }` });
const kQuad = new THREE.Mesh(quadGeo, kuwa), oQuad = new THREE.Mesh(quadGeo, outM), kScene = new THREE.Scene(), oScene = new THREE.Scene(); kScene.add(kQuad); oScene.add(oQuad);
const cam = new THREE.PerspectiveCamera(52, W / H, .1, 200);

window.DUR = 5; window.TEXTS = () => [];
window.render = t => {
  const tq = t;
  poseWizard(tq);
  // handheld camera, backing up ahead of him, low and slightly below
  const z = -4 + tq * 2.7, hx = Math.sin(tq * 1.7) * .12 + Math.sin(tq * 4.1) * .04, hy = Math.sin(tq * 2.3) * .06;
  cam.position.set(1.6 + hx, 1.25 + hy, z + 5.6 - tq * .15); cam.lookAt(wiz.position.x * .6, 1.45, z); cam.rotateZ(Math.sin(tq * 1.1) * .03);
  sun.position.set(5, 11, z + 12); sun.target.position.set(0, 0, z);
  const sp = pollen.pos; pollen.seed.forEach(([x, y, zz, r], i) => { sp[i * 3] = x + Math.sin(tq * .6 + r * 9) * .6; sp[i * 3 + 1] = (y + tq * (.15 + r * .2)) % 6; sp[i * 3 + 2] = zz + z; }); pollen.p.geometry.attributes.position.needsUpdate = true;
  glare.position.set(cam.position.x - 45, cam.position.y + 55, cam.position.z - 110);
  shafts.forEach((s, i) => s.material.opacity = .08 + .03 * Math.sin(tq * .8 + i));
  renderer.setRenderTarget(rtScene); renderer.render(scene, cam);
  renderer.setRenderTarget(rtPaint); renderer.render(kScene, quadCam);
  renderer.setRenderTarget(null); renderer.render(oScene, quadCam);
};
window.render(0); window.READY = true;
