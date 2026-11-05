// PS2 style: a wizard with a big hat runs, badly, through a forest. 5 s.
// Pipeline: render the 3D scene small (360×640, no AA) → Kuwahara oil-paint smear → soft upscale to 1080×1920 with a little posterize.
// Motion is stepped at 12.5 fps (like the 12 fps references) inside a 25 fps video.
import * as THREE from 'three';

const W = 1080, H = 1920, LW = 360, LH = 640, STEP = 1 / 12.5;
const V3 = THREE.Vector3;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), lerp = (a, b, t) => a + (b - a) * t;
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H); document.body.appendChild(renderer.domElement);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;

function canvasTex(w, h, draw, rep = 1) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); return t; }
const blotch = (cols, n, rmin, rmax, seed) => (g, w, h) => { const R = mulberry(seed); g.fillStyle = cols[0]; g.fillRect(0, 0, w, h); for (let i = 0; i < n; i++) { g.fillStyle = cols[1 + Math.floor(R() * (cols.length - 1))]; g.globalAlpha = .35 + R() * .5; g.beginPath(); g.ellipse(R() * w, R() * h, rmin + R() * (rmax - rmin), rmin + R() * (rmax - rmin) * .6, R() * 3, 0, 7); g.fill(); } g.globalAlpha = 1; };
const grassTex = canvasTex(512, 512, blotch(['#4f7a32', '#3d6427', '#6a9440', '#7fa64c', '#5a6b2c', '#8a8a4a'], 900, 4, 26, 3), 18);
const pathTex = canvasTex(512, 512, blotch(['#8a7350', '#7a6444', '#a08a62', '#6a5638', '#5f7a36'], 700, 4, 22, 5), 6);
const barkTex = canvasTex(128, 512, (g, w, h) => { const R = mulberry(7); g.fillStyle = '#5a4430'; g.fillRect(0, 0, w, h); for (let i = 0; i < 80; i++) { g.fillStyle = R() > .5 ? '#3f2f22' : '#6e5640'; g.fillRect(R() * w, R() * h, 4 + R() * 10, 30 + R() * 90); } });
const leafTex = canvasTex(256, 256, blotch(['#3f6a2c', '#2f5422', '#5a8a3a', '#78a84a', '#a6c46a'], 500, 4, 18, 9), 2);
const skyTex = canvasTex(256, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#5f8fd0'); gr.addColorStop(.6, '#a9c7e6'); gr.addColorStop(1, '#e8eedc'); g.fillStyle = gr; g.fillRect(0, 0, w, h); const R = mulberry(2);
  g.filter = 'blur(6px)'; for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(255,255,255,${.3 + R() * .5})`; g.beginPath(); g.ellipse(R() * w, R() * h * .6, 10 + R() * 30, 6 + R() * 14, 0, 0, 7); g.fill(); } });
skyTex.repeat.set(1, 1);

const scene = new THREE.Scene(); scene.background = skyTex; scene.fog = new THREE.Fog('#c9d6c0', 9, 46);
scene.add(new THREE.HemisphereLight('#e4eeff', '#6a7a48', 1.5));
const sun = new THREE.DirectionalLight('#fff0d0', 3.2); sun.position.set(-6, 12, -10); scene.add(sun, sun.target); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 50 });
const MS = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .9, ...o });
const mesh = (geo, mat, par = scene) => { const m = new THREE.Mesh(geo, mat); m.castShadow = m.receiveShadow = true; par.add(m); return m; };

// ---------------------------------------------------------------- forest along a path running toward +z
{ const g = mesh(new THREE.PlaneGeometry(200, 200), MS('#ffffff', { map: grassTex })); g.rotation.x = -Math.PI / 2;
  const p = mesh(new THREE.PlaneGeometry(3.2, 200), MS('#ffffff', { map: pathTex })); p.rotation.x = -Math.PI / 2; p.position.y = .01;
  const R = mulberry(11), bark = MS('#ffffff', { map: barkTex }), leaf = MS('#ffffff', { map: leafTex });
  for (let i = 0; i < 90; i++) {
    const side = R() > .5 ? 1 : -1, x = side * (2.6 + R() * 14), z = -30 + R() * 90, h = 5 + R() * 7, r = .18 + R() * .25;
    const tr = mesh(new THREE.CylinderGeometry(r * .7, r, h, 7), bark); tr.position.set(x, h / 2, z);
    for (let k = 0; k < 3; k++) { const b = mesh(new THREE.IcosahedronGeometry(1.3 + R() * 1.2, 1), leaf); b.position.set(x + (R() - .5) * 1.6, h - .6 + R() * 1.6, z + (R() - .5) * 1.6); b.scale.y = .8; }
  }
  for (let i = 0; i < 70; i++) { const side = R() > .5 ? 1 : -1, b = mesh(new THREE.IcosahedronGeometry(.4 + R() * .5, 1), leaf); b.position.set(side * (1.9 + R() * 6), .25, -30 + R() * 90); b.scale.y = .6; }
  for (let i = 0; i < 40; i++) { const f = mesh(new THREE.ConeGeometry(.05, .5, 4), MS(R() > .5 ? '#e8e0f0' : '#f2d36a')); f.position.set((R() > .5 ? 1 : -1) * (1.7 + R() * 3), .25, -30 + R() * 90); }
}
// light shafts and floating pollen (the dreamy drift)
const shafts = []; { const m = new THREE.MeshBasicMaterial({ color: '#fff6d8', transparent: true, opacity: .1, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
  for (let i = 0; i < 7; i++) { const s = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 16), m); s.position.set(-7 + i * 2.2, 7, -16 + i * 2.5); s.rotation.set(0, .5, .45); scene.add(s); shafts.push(s); } }
const pollen = (() => { const R = mulberry(21), n = 500, pos = new Float32Array(n * 3), seed = []; for (let i = 0; i < n; i++) seed.push([R() * 20 - 10, R() * 6, -3 - R() * 30, R()]);
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const p = new THREE.Points(geo, new THREE.PointsMaterial({ color: '#ffffff', size: .04, transparent: true, opacity: .85, depthWrite: false })); scene.add(p); return { p, seed, pos }; })();

// ---------------------------------------------------------------- the wizard: smooth low-poly mannequin, faceless, big floppy hat
const robe = MS('#ad7480'), plum = MS('#4b3349'), scarfM = MS('#8c3b7c'), face = MS('#d5d3d6', { roughness: .6 }), glove = MS('#f2f0ec'), strap = MS('#6c5c3c'), hatM = MS('#9a6472');
const wiz = new THREE.Group(); scene.add(wiz);
const hips = new THREE.Group(); hips.position.y = 1.0; wiz.add(hips);
const torso = new THREE.Group(); hips.add(torso);
mesh(new THREE.CapsuleGeometry(.24, .5, 4, 10), robe, torso).position.y = .4;
const skirt = mesh(new THREE.CylinderGeometry(.27, .42, .55, 12, 1, true), robe, hips); skirt.position.y = -.12; skirt.material.side = THREE.DoubleSide;
mesh(new THREE.TorusGeometry(.2, .07, 6, 14), scarfM, torso).position.set(0, .78, 0); torso.children.at(-1).rotation.x = Math.PI / 2;
const sc = mesh(new THREE.BoxGeometry(.12, .45, .05), scarfM, torso); sc.position.set(.08, .55, .24); sc.rotation.z = .15;
mesh(new THREE.BoxGeometry(.07, .8, .06), strap, torso).position.set(.12, .42, .23); torso.children.at(-1).rotation.z = .35;
const pack = mesh(new THREE.BoxGeometry(.5, .6, .3), MS('#6f6a42'), torso); pack.position.set(0, .45, -.32);
const headG = new THREE.Group(); headG.position.y = .95; torso.add(headG);
const hd = mesh(new THREE.SphereGeometry(.17, 12, 10), face, headG); hd.scale.set(.95, 1.15, 1); hd.position.y = .08;
mesh(new THREE.BoxGeometry(.2, .12, .12), MS('#e0b64e', { roughness: .5 }), headG).position.set(0, .14, .1);   // the warm-lit upper face plane
const hat = new THREE.Group(); hat.position.y = .27; headG.add(hat);
mesh(new THREE.CylinderGeometry(.62, .62, .03, 20), hatM, hat);
const cone1 = new THREE.Group(); hat.add(cone1); mesh(new THREE.CylinderGeometry(.17, .27, .45, 14), hatM, cone1).position.y = .22;
const cone2 = new THREE.Group(); cone2.position.y = .44; cone1.add(cone2); mesh(new THREE.CylinderGeometry(.08, .17, .38, 12), hatM, cone2).position.y = .19;
const cone3 = new THREE.Group(); cone3.position.y = .38; cone2.add(cone3); mesh(new THREE.ConeGeometry(.08, .32, 10), hatM, cone3).position.y = .16;
function limb(par, x, y, len1, len2, r, matA, matB, end) {
  const a = new THREE.Group(); a.position.set(x, y, 0); par.add(a); mesh(new THREE.CapsuleGeometry(r, len1, 3, 8), matA, a).position.y = -len1 / 2;
  const b = new THREE.Group(); b.position.y = -len1; a.add(b); mesh(new THREE.CapsuleGeometry(r * .85, len2, 3, 8), matB, b).position.y = -len2 / 2;
  const e = mesh(end, end.type === 'SphereGeometry' ? glove : MS('#3a2e28'), b); e.position.y = -len2 - .05; return [a, b, e];
}
const armL = limb(torso, .3, .78, .32, .3, .08, robe, robe, new THREE.SphereGeometry(.09, 8, 6)), armR = limb(torso, -.3, .78, .32, .3, .08, robe, robe, new THREE.SphereGeometry(.09, 8, 6));
const legL = limb(hips, .13, -.05, .45, .45, .1, plum, plum, new THREE.BoxGeometry(.16, .1, .3)), legR = limb(hips, -.13, -.05, .45, .45, .1, plum, plum, new THREE.BoxGeometry(.16, .1, .3));
legL[2].position.z = legR[2].position.z = .06;
const staff = mesh(new THREE.CylinderGeometry(.03, .04, 1.6, 6), MS('#6a4a2c'), armR[1]); staff.position.set(0, -.3, .1); staff.rotation.x = 1.2;

function poseWizard(t) {
  const ph = t * Math.PI * 2 * 1.7, s = Math.sin(ph), c = Math.cos(ph);
  const z = -4 + t * 3.1, wob = Math.sin(t * 2.3) * .5;                  // runs toward the camera, wobbling side to side
  wiz.position.set(wob, Math.abs(Math.sin(ph)) * .22, z); wiz.rotation.y = Math.cos(t * 2.3) * .35;
  hips.rotation.set(0, s * .25, Math.sin(ph * .5) * .12);
  torso.rotation.set(.35 + Math.abs(s) * .12, -s * .35, c * .12);
  legL[0].rotation.x = -s * 1.15; legL[1].rotation.x = Math.max(0, s) * 1.5 + .2; legR[0].rotation.x = s * 1.15; legR[1].rotation.x = Math.max(0, -s) * 1.5 + .2;
  // flailing arms: big windmill loops, out of sync
  armL[0].rotation.set(Math.sin(ph * 1.5) * 2.2, 0, .9 + Math.cos(ph * 1.5) * .7); armL[1].rotation.x = -.8 - Math.sin(ph * 3) * .6;
  armR[0].rotation.set(-Math.sin(ph * 1.5 + 1) * 1.6, 0, -.7 - Math.cos(ph) * .5); armR[1].rotation.x = -.5;
  headG.rotation.set(-.3 + c * .15, s * .25, -c * .2);
  // the hat lags and flops
  hat.rotation.set(-.15 - c * .18, 0, s * .25); cone1.rotation.set(-.2 - Math.abs(c) * .25, 0, s * .2); cone2.rotation.set(-.55 - Math.abs(Math.sin(ph - .6)) * .35, 0, Math.sin(ph - .6) * .35); cone3.rotation.set(-.7 - Math.abs(Math.sin(ph - 1.2)) * .4, 0, Math.sin(ph - 1.2) * .5);
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
    for (int j = 0; j <= 4; j++) for (int i = 0; i <= 4; i++) {
      vec3 a = texture2D(src, vUv + vec2(-float(i), -float(j)) * px).rgb; m0 += a; q0 += a * a;
      vec3 b = texture2D(src, vUv + vec2( float(i), -float(j)) * px).rgb; m1 += b; q1 += b * b;
      vec3 c = texture2D(src, vUv + vec2(-float(i),  float(j)) * px).rgb; m2 += c; q2 += c * c;
      vec3 d = texture2D(src, vUv + vec2( float(i),  float(j)) * px).rgb; m3 += d; q3 += d * d;
    }
    float n = 25.; m0 /= n; m1 /= n; m2 /= n; m3 /= n;
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
    float l = dot(c, vec3(.299, .587, .114)); c = mix(vec3(l), c, 1.12); c = (c - .5) * 1.06 + .5;
    vec2 d = vUv - .5; c *= 1. - dot(d, d) * .35;
    gl_FragColor = vec4(clamp(c, 0., 1.), 1.);
  }` });
const kQuad = new THREE.Mesh(quadGeo, kuwa), oQuad = new THREE.Mesh(quadGeo, outM), kScene = new THREE.Scene(), oScene = new THREE.Scene(); kScene.add(kQuad); oScene.add(oQuad);
const cam = new THREE.PerspectiveCamera(52, W / H, .1, 200);

window.DUR = 5; window.TEXTS = () => [];
window.render = t => {
  const tq = Math.floor(t / STEP + 1e-6) * STEP;
  poseWizard(tq);
  // handheld camera, backing up ahead of him, low and slightly below
  const z = -4 + tq * 3.1, hx = Math.sin(tq * 1.7) * .12 + Math.sin(tq * 4.1) * .04, hy = Math.sin(tq * 2.3) * .06;
  cam.position.set(1.4 + hx, 1.15 + hy, z + 4.2 - tq * .12); cam.lookAt(wiz.position.x * .6, 1.45, z); cam.rotateZ(Math.sin(tq * 1.1) * .03);
  sun.position.set(5, 11, z + 12); sun.target.position.set(0, 0, z);
  const sp = pollen.pos; pollen.seed.forEach(([x, y, zz, r], i) => { sp[i * 3] = x + Math.sin(tq * .6 + r * 9) * .6; sp[i * 3 + 1] = (y + tq * (.15 + r * .2)) % 6; sp[i * 3 + 2] = zz + z; }); pollen.p.geometry.attributes.position.needsUpdate = true;
  shafts.forEach((s, i) => s.material.opacity = .08 + .03 * Math.sin(tq * .8 + i));
  renderer.setRenderTarget(rtScene); renderer.render(scene, cam);
  renderer.setRenderTarget(rtPaint); renderer.render(kScene, quadCam);
  renderer.setRenderTarget(null); renderer.render(oScene, quadCam);
};
window.render(0); window.READY = true;
