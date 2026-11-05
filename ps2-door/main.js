// PS2 style, first person: a dim room, the door swings open, outside is a bright green hill with a winding path,
// little white houses and a water tower (after the user's reference image). 10 s, 25 fps, smooth.
import * as THREE from 'three';
const W = 1080, H = 1920, LW = 270, LH = 480;
const V3 = THREE.Vector3;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, s, d) => clamp((t - s) / d), io = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2, sm = t => t * t * (3 - 2 * t);
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true, logarithmicDepthBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H); document.body.appendChild(renderer.domElement);
renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// noise textures (fbm value noise ramps)
const NZ = (() => { const R = mulberry(77), N = 1024, gr = Array.from({ length: N * N }, () => R()); const vn = (x, y, px, py) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), at = (i, j) => gr[(((j % py) + py) % py) * N + (((i % px) + px) % px)]; return lerp(lerp(at(xi, yi), at(xi + 1, yi), u), lerp(at(xi, yi + 1), at(xi + 1, yi + 1), u), v); };
  return (x, y, px, py) => { let a = 0, amp = .5, f = 1; for (let o = 0; o < 5; o++) { a += amp * vn(x * f, y * f, px * f, py * f); amp *= .5; f *= 2; } return a; }; })();
function noiseTex(w, h, sx, sy, cols, rx = 1, ry = rx) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'), im = g.createImageData(w, h), C = cols.map(k => new THREE.Color(k));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const n = clamp((NZ(x / sx, y / sy, Math.round(w / sx), Math.round(h / sy)) - .2) / .6) * (C.length - 1), i0 = Math.min(C.length - 2, Math.floor(n)), k = C[i0].clone().lerp(C[i0 + 1], n - i0), i = (y * w + x) * 4; im.data[i] = k.r * 255; im.data[i + 1] = k.g * 255; im.data[i + 2] = k.b * 255; im.data[i + 3] = 255; }
  g.putImageData(im, 0, 0); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); return t; }
const grassTex = noiseTex(512, 512, 8, 8, ['#c4d850', '#cede5c', '#d6e468', '#deea76', '#e6ee8a'], 140);
const woodTex = noiseTex(64, 256, 3, 60, ['#3a2618', '#4e3420', '#64442a', '#77553a'], 1, 1);
const floorTex = noiseTex(128, 128, 4, 30, ['#a88e72', '#b89c80', '#c6ab8e', '#d2b89c'], 4, 3);
const wallTex = noiseTex(128, 128, 18, 18, ['#d8d2c6', '#e0dace', '#e8e2d6', '#f0eadf'], 3, 2);

const scene = new THREE.Scene();
scene.background = (() => { const c = document.createElement('canvas'); c.width = 4; c.height = 256; const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, '#a6cff6'); gr.addColorStop(.45, '#b4d8f6'); gr.addColorStop(.8, '#c8e2f8'); gr.addColorStop(1, '#d8ecf8'); g.fillStyle = gr; g.fillRect(0, 0, 4, 256); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
scene.fog = new THREE.Fog('#bcdcf4', 70, 330);
const hemi = new THREE.HemisphereLight('#eef4ff', '#d8d8a0', 1.9); scene.add(hemi);
const sun = new THREE.DirectionalLight('#fff6e4', 3.4); sun.position.set(-90, 110, -40); sun.target.position.set(0, 0, -140); scene.add(sun, sun.target);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -90, right: 90, top: 90, bottom: -90, near: 10, far: 400 }); sun.shadow.bias = -.0008; sun.shadow.normalBias = .04; sun.shadow.radius = 3;
const MS = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .9, ...o });
// a decal layer: a fixed depth priority over the surface underneath, so it never fights it
const DECAL = (m, k = 1) => { m.polygonOffset = true; m.polygonOffsetFactor = -2 * k; m.polygonOffsetUnits = -4 * k; return m; };
const meshX = 0; const mesh = (geo, mat, par = scene, cast = true) => { const m = new THREE.Mesh(geo, mat); m.castShadow = cast; m.receiveShadow = true; par.add(m); return m; };

// ---------------------------------------------------------------- outside: the hill (the door faces -z; the hill crest is ~50 m out)
const HX = 0, HZ = -175;
const hillH = (x, z) => 34 * Math.exp(-((x - HX) ** 2 + ((z - HZ) * 1.05) ** 2) / (2 * 70 ** 2)) + (1.6 * Math.sin(x * .05 + 1) * Math.cos(z * .045) + .9 * Math.sin(x * .09 - z * .04)) * clamp((-z - 20) / 30) - .3;
{ const g = new THREE.PlaneGeometry(400, 400, 220, 220); g.rotateX(-Math.PI / 2); const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), near = clamp((Math.hypot(x, z) - 6) / 10); p.setY(i, hillH(x, z) * near - .02 * (1 - near)); }
  g.computeVertexNormals(); mesh(g, MS('#ffffff', { map: grassTex, roughness: 1 }), scene, false); }
const groundH = (x, z) => { const near = clamp((Math.hypot(x, z) - 6) / 10); return hillH(x, z) * near - .02 * (1 - near); };
const onHill = (x, z) => new V3(x, groundH(x, z), z);
// winding gravel path from the door to the houses, plus a side branch
function path(pts, w) { const curve = new THREE.CatmullRomCurve3(pts.map(([x, z]) => onHill(x, z))), N = 160, pos = [], idx = [];
  for (let i = 0; i <= N; i++) { const u = i / N, c = curve.getPoint(u), tg = curve.getTangent(u), side = new V3(-tg.z, 0, tg.x).normalize().multiplyScalar(w * (.85 + .3 * Math.sin(u * 40)));
    for (const s of [-1, 1]) { const q = c.clone().addScaledVector(side, s); q.y = groundH(q.x, q.z) + .1; pos.push(q.x, q.y, q.z); } if (i) { const a = (i - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); const pm = mesh(g, DECAL(MS('#efe9dc', { roughness: 1 }), 2), scene, false); pm.renderOrder = 1; }
path([[0.3, -1.2], [.8, -12], [-4, -32], [-13, -58], [-9, -84], [3, -102], [-3, -118], [-13, -134], [-18, -150]], .26);
path([[3, -102], [18, -108], [34, -120], [46, -134]], .22);
// little white houses with orange roofs
function house(x, z, ry, s = 1) { const g = new THREE.Group(), y = hillH(x, z); g.position.set(x, y - .1, z); g.rotation.y = ry; g.scale.setScalar(s); scene.add(g);
  mesh(new THREE.BoxGeometry(6, 3.4, 4.4), MS('#f4f1ea'), g).position.y = 1.7;
  const roof = mesh(new THREE.ConeGeometry(4.6, 1.8, 4, 1), MS('#de8448', { roughness: .8 }), g); roof.position.y = 4.3; roof.rotation.y = Math.PI / 4; roof.scale.set(1.0, 1, .76);
  const dark = DECAL(MS('#2b2a2c', { roughness: .6 })); for (const [px, py, w, h] of [[-1.6, 1.9, .9, .9], [1.6, 1.9, .9, .9], [0, 1.1, .9, 2.0]]) mesh(new THREE.BoxGeometry(w, h, .04), dark, g, false).position.set(px, py, 2.24);
  mesh(new THREE.BoxGeometry(.04, .9, .9), dark, g, false).position.set(3.04, 1.9, 0);
  mesh(new THREE.BoxGeometry(.5, .9, .5), MS('#d8d2c6'), g).position.set(1.6, 5.0, -.6); return g; }
house(-38, -134, .25, 1.6); house(-14, -152, .1, 1.55); house(2, -130, -.05, 1.6); house(36, -138, -.3, 1.55); house(52, -156, -.2, 1.5);
// water tower on the crest
{ const x = 12, z = -168, y = hillH(x, z), g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(1.5); scene.add(g); const steel = MS('#5a5f66', { metalness: .3, roughness: .6 });
  for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const l = mesh(new THREE.CylinderGeometry(.08, .1, 7.5, 6), steel, g); l.position.set(a * 1.3, 3.7, b * 1.3); l.rotation.set(b * .08, 0, -a * .08); }
  for (const y2 of [2.4, 4.8]) { const r = mesh(new THREE.TorusGeometry(1.55, .05, 4, 4), steel, g); r.position.y = y2; r.rotation.set(Math.PI / 2, 0, Math.PI / 4); }
  mesh(new THREE.CylinderGeometry(1.7, 1.7, 3.0, 20), MS('#e8ebee', { roughness: .5 }), g).position.y = 8.9;
  mesh(new THREE.ConeGeometry(1.8, .8, 20), MS('#d8dce0'), g).position.y = 10.8; }

// ---------------------------------------------------------------- inside: a small dim wooden room around the door (door at z = 0)
const room = new THREE.Group(); scene.add(room);
{ const wall = MS('#ffffff', { map: wallTex }), floorM = MS('#ffffff', { map: floorTex, roughness: .8 }), wood = MS('#ffffff', { map: woodTex });
  const RW = 5, RD = 5, RH = 3.0, DW = 1.0, DH = 2.15;
  mesh(new THREE.BoxGeometry(RW, .1, RD), floorM, room).position.set(0, -.05, RD / 2);
  mesh(new THREE.BoxGeometry(RW, .1, RD), MS('#ece6dc'), room).position.set(0, RH, RD / 2);
  mesh(new THREE.BoxGeometry(.1, RH, RD), wall, room).position.set(-RW / 2, RH / 2, RD / 2); mesh(new THREE.BoxGeometry(.1, RH, RD), wall, room).position.set(RW / 2, RH / 2, RD / 2);
  // front wall with a door opening
  mesh(new THREE.BoxGeometry((RW - DW) / 2, RH, .2), wall, room).position.set(-(RW + DW) / 4, RH / 2, 0); mesh(new THREE.BoxGeometry((RW - DW) / 2, RH, .2), wall, room).position.set((RW + DW) / 4, RH / 2, 0);
  mesh(new THREE.BoxGeometry(DW, RH - DH, .2), wall, room).position.set(0, DH + (RH - DH) / 2, 0);
  for (const s of [-1, 1]) mesh(new THREE.BoxGeometry(.12, DH + .1, .28), wood, room).position.set(s * (DW / 2 + .06), DH / 2, 0);
  mesh(new THREE.BoxGeometry(DW + .36, .12, .28), wood, room).position.set(0, DH + .06, 0);
  mesh(new THREE.BoxGeometry(DW + .2, .05, .3), wood, room).position.set(0, .02, 0);
  // a few things in the room: a shelf, a stool, a hanging coat
  mesh(new THREE.BoxGeometry(1.2, .06, .3), wood, room).position.set(-1.7, 1.6, .25); mesh(new THREE.CylinderGeometry(.09, .09, .22, 10), MS('#6d7f8a'), room).position.set(-2.0, 1.74, .25); mesh(new THREE.BoxGeometry(.22, .3, .16), MS('#7a3a2a'), room).position.set(-1.6, 1.78, .25);
  const stool = new THREE.Group(); stool.position.set(1.6, 0, 1.0); room.add(stool); mesh(new THREE.CylinderGeometry(.24, .24, .06, 14), wood, stool).position.y = .5; for (let k = 0; k < 3; k++) { const a = k * 2.09; const l = mesh(new THREE.CylinderGeometry(.025, .03, .5, 5), wood, stool); l.position.set(Math.cos(a) * .17, .25, Math.sin(a) * .17); }
  mesh(new THREE.CapsuleGeometry(.18, .6, 4, 8), MS('#5a4a60'), room).position.set(1.1, 1.55, .2); }
// the door, hinged on its left edge
const door = new THREE.Group(); door.position.set(-.5, 0, -.0); room.add(door);
{ const panel = MS('#d6cec2'), dk = MS('#4a3020');
  const d = mesh(new THREE.BoxGeometry(1.0, 2.14, .06), panel, door); d.position.set(.5, 1.07, .04);
  for (const [y, h] of [[1.55, .75], [.6, .75]]) for (const x of [.27, .73]) mesh(new THREE.BoxGeometry(.34, h, .03), DECAL(MS('#e2dcd2')), door).position.set(x, y, .088);
  const knob = mesh(new THREE.SphereGeometry(.04, 10, 8), MS('#c9a24a', { metalness: .8, roughness: .3 }), door); knob.position.set(.9, 1.0, .12); mesh(new THREE.BoxGeometry(.06, .16, .02), DECAL(dk), door).position.set(.9, 1.0, .082); }
// warm dim lamp inside; daylight spill through the doorway
const lamp = new THREE.PointLight('#fff0dc', 6, 12, 1.2); lamp.position.set(-1.6, 2.4, 3.2); scene.add(lamp);
const spill = new THREE.SpotLight('#fff3dc', 0, 14, .7, .6, 1.2); spill.position.set(0, 2.1, -3); spill.target.position.set(0, 0, 3.5); scene.add(spill, spill.target);
const motes = (() => { const R = mulberry(5), n = 260, pos = new Float32Array(n * 3), seed = []; for (let i = 0; i < n; i++) seed.push([R() * 1.6 - .8, R() * 2.2, R() * 3.6 + .2, R()]);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const c = document.createElement('canvas'); c.width = c.height = 32; const x = c.getContext('2d'), gr = x.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 32, 32);
  const m = new THREE.PointsMaterial({ color: '#fff4dc', map: new THREE.CanvasTexture(c), size: .01, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }); const p = new THREE.Points(g, m); p.frustumCulled = false; scene.add(p); return { p, m, seed, pos }; })();
const beam = (() => { const m = new THREE.MeshBasicMaterial({ color: '#fff2d6', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-.5, 2.1, 0, .5, 2.1, 0, .5, 0, 0, -.5, 0, 0, -.9, 0, 3.6, .9, 0, 3.6], 3)); g.setIndex([0, 1, 2, 0, 2, 3, 3, 2, 5, 3, 5, 4]); const b = new THREE.Mesh(g, m); scene.add(b); return b; })();

// ---------------------------------------------------------------- PS2 look: low-res render → Kuwahara smear → soft upscale
const rtScene = new THREE.WebGLRenderTarget(LW, LH, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, type: THREE.HalfFloatType });
const rtPaint = new THREE.WebGLRenderTarget(LW, LH, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, type: THREE.HalfFloatType });
const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), quadGeo = new THREE.PlaneGeometry(2, 2);
const vs = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`;
const kuwa = new THREE.ShaderMaterial({ uniforms: { src: { value: rtScene.texture }, px: { value: new THREE.Vector2(1 / LW, 1 / LH) } }, vertexShader: vs, fragmentShader: `
  uniform sampler2D src; uniform vec2 px; varying vec2 vUv;
  void main(){
    vec3 m0 = vec3(0.), m1 = vec3(0.), m2 = vec3(0.), m3 = vec3(0.), q0 = vec3(0.), q1 = vec3(0.), q2 = vec3(0.), q3 = vec3(0.);
    for (int j = 0; j <= 2; j++) for (int i = 0; i <= 2; i++) {
      vec3 a = texture2D(src, vUv + vec2(-float(i), -float(j)) * px).rgb; m0 += a; q0 += a * a;
      vec3 b = texture2D(src, vUv + vec2( float(i), -float(j)) * px).rgb; m1 += b; q1 += b * b;
      vec3 c = texture2D(src, vUv + vec2(-float(i),  float(j)) * px).rgb; m2 += c; q2 += c * c;
      vec3 d = texture2D(src, vUv + vec2( float(i),  float(j)) * px).rgb; m3 += d; q3 += d * d;
    }
    float n = 9.; m0 /= n; m1 /= n; m2 /= n; m3 /= n;
    float v0 = dot(q0 / n - m0 * m0, vec3(1.)), v1 = dot(q1 / n - m1 * m1, vec3(1.)), v2 = dot(q2 / n - m2 * m2, vec3(1.)), v3 = dot(q3 / n - m3 * m3, vec3(1.));
    vec3 col = m0; float best = v0;
    if (v1 < best) { best = v1; col = m1; } if (v2 < best) { best = v2; col = m2; } if (v3 < best) { col = m3; }
    gl_FragColor = vec4(col, 1.);
  }` });
// console output: hard nearest-neighbour pixels, 4x4 ordered (Bayer) dither into 5-bit colour, soft glow on bright lights
const outM = new THREE.ShaderMaterial({ uniforms: { src: { value: rtScene.texture }, res: { value: new THREE.Vector2(LW, LH) }, time: { value: 0 } }, vertexShader: vs, fragmentShader: `
  uniform sampler2D src; uniform vec2 res; uniform float time; varying vec2 vUv;
  float bayer(vec2 p){ int x = int(mod(p.x, 4.)), y = int(mod(p.y, 4.)); int i = x + y * 4;
    float m[16]; m[0]=0.;m[1]=8.;m[2]=2.;m[3]=10.;m[4]=12.;m[5]=4.;m[6]=14.;m[7]=6.;m[8]=3.;m[9]=11.;m[10]=1.;m[11]=9.;m[12]=15.;m[13]=7.;m[14]=13.;m[15]=5.;
    float v = 0.; for (int k = 0; k < 16; k++) if (k == i) v = m[k]; return v / 16.; }
  void main(){
    vec2 lp = floor(vUv * res), uv = (lp + .5) / res;
    vec3 c = texture2D(src, uv).rgb;
    vec3 b = vec3(0.); for (int i = 0; i < 12; i++) { float a = float(i) * .5236; for (int k = 1; k <= 2; k++) b += max(texture2D(src, uv + vec2(cos(a), sin(a)) * float(k) * 3. / res).rgb - .7, 0.); } c += b / 24. * .8;
    float lv = 31.; c = floor(c * lv + bayer(lp)) / lv;
    vec2 d = vUv - .5; c *= 1. - dot(d, d) * .3;
    gl_FragColor = vec4(clamp(c, 0., 1.), 1.);
  }` });
const kQuad = new THREE.Mesh(quadGeo, kuwa), oQuad = new THREE.Mesh(quadGeo, outM), kScene = new THREE.Scene(), oScene = new THREE.Scene(); kScene.add(kQuad); oScene.add(oQuad);

const cam = new THREE.PerspectiveCamera(60, W / H, .1, 600);
window.DUR = 10; window.TEXTS = () => [];
window.render = t => {
  // timeline: 0–1.6 walk up to the door; 1.6–3.6 the door swings open; 3.6–7.6 step through and out; 7.6–10 stand on the path and take in the hill
  const walk = io(seg(t, 0, 1.7)), open = io(seg(t, 1.5, 2.1)), out = io(seg(t, 3.4, 4.6)), look = sm(seg(t, 6.6, 3.4));
  const z = lerp(3.6, 1.15, walk) - out * 6.0, bob = Math.sin(t * 7.2) * .022 * (seg(t, 0, .3) * (1 - seg(t, 1.5, .3)) + seg(t, 3.5, .4) * (1 - seg(t, 7.8, .6)));
  cam.position.set(Math.sin(t * .9) * .03 + out * .15, 1.62 + bob, z);
  const lx = lerp(.05, -2, out) + Math.sin(t * .7) * .1, ly = lerp(1.5, lerp(12, 26, look), out), lz = z - lerp(6, 45, out);
  cam.lookAt(lx, ly, lz); cam.rotateZ(Math.sin(t * .8) * .006 + Math.sin(t * 7.2) * .003 * bob * 30);
  door.rotation.y = -open * 1.9;
  spill.intensity = 30 * open; lamp.intensity = 6 * (1 - .3 * open);
  beam.material.opacity = .11 * open * (1 - out * .7);
  motes.m.opacity = .8 * open * (1 - seg(out, 0, .25)); motes.seed.forEach(([x, y, zz, r], i) => { motes.pos[i * 3] = x + Math.sin(t * .4 + r * 9) * .15; motes.pos[i * 3 + 1] = (y + t * (.04 + r * .05)) % 2.2; motes.pos[i * 3 + 2] = zz; }); motes.p.geometry.attributes.position.needsUpdate = true;
  renderer.toneMappingExposure = lerp(1.0, 1.2, out); outM.uniforms.time.value = Math.floor(t * 25) * 1.37;
  renderer.setRenderTarget(rtScene); renderer.render(scene, cam);
    renderer.setRenderTarget(null); renderer.render(oScene, quadCam);
};
window.render(0); window.READY = true;
