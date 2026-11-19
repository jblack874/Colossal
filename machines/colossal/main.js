// COLOSSAL — pass 1 (motion). Every pose and number reads from kin.js state(t). No hand-keyed motion.
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import * as K from './kin.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {makeCollector, face, railing, catwalk} from './greeble.js';

const {I, MAIN, POD, ROAD, pitch, rS, rP} = K;
for (const c of K.CHECK) console.log(`hand check ${c.id} ${c.label}: ${c.got.toFixed(3)} vs ${c.want.toFixed(3)} ${c.unit} → ${K.checkOK(c) ? 'PASS' : 'FAIL'} (${c.note})`);

// ---------------------------------------------------------------- page shell
const css = `
:root{--bg:#eeece7;--ink:#1d1d1f;--mute:#857f75;--acc:#e8562a;--ok:#2e9d6a;--bad:#c8362a;--card:rgba(251,250,247,.94);--line:#d9d3c8}
html,body{margin:0;height:100%;background:var(--bg);color:var(--ink);font-family:'JetBrains Mono',monospace;overflow:hidden}
#c{position:fixed;inset:0}
#hud{position:fixed;left:0;top:0;width:1600px;height:900px;transform-origin:0 0;pointer-events:none}
.card{position:absolute;background:var(--card);border:1px solid var(--line);border-radius:6px;padding:10px 12px;pointer-events:auto}
.h{font-size:11px;letter-spacing:.18em;font-weight:700;display:flex;margin-bottom:8px}
.h::before{content:'';width:3px;height:12px;background:var(--acc);margin-right:8px}
.h span:first-child{flex:1}.n{color:var(--mute);font-weight:400}
.big{font-family:Inter,sans-serif;font-size:34px;font-weight:700}.u{font-size:12px;color:var(--mute);margin-left:4px}
.lab{font-size:9px;letter-spacing:.16em;color:var(--mute)}
.row{display:flex;justify-content:space-between;font-size:11px;padding:2px 0;gap:10px}
.btn{display:inline-block;font-size:10px;letter-spacing:.14em;font-weight:700;border:1px solid var(--line);border-radius:4px;padding:6px 9px;margin:0 6px 6px 0;cursor:pointer;background:#fff;user-select:none}
.btn.on{background:var(--acc);color:#fff;border-color:var(--acc)}
.ok{color:var(--ok);font-weight:700}.bad{color:var(--bad);font-weight:700}
#brand{position:absolute;left:0;top:0;background:var(--acc);color:#fff;font-weight:700;letter-spacing:.2em;padding:26px 28px;font-size:15px}
#title{position:absolute;left:190px;top:14px}
#title .k{font-size:10px;letter-spacing:.24em;color:var(--mute)}
#title .t{font-family:Inter,sans-serif;font-size:32px;font-weight:700;margin:2px 0}
#foot{position:absolute;bottom:10px;left:20px;right:20px;display:flex;justify-content:space-between;font-size:9px;letter-spacing:.2em;color:var(--mute)}
canvas.ch{width:100%;height:90px;display:block}
input[type=range]{width:100%}
body.field{--bg:#c9ccce;--card:rgba(240,240,238,.88)}
`;
document.head.insertAdjacentHTML('beforeend', `<style>${css}</style>`);
document.body.insertAdjacentHTML('beforeend', `
<canvas id="c"></canvas>
<div id="hud">
 <div id="brand">COLOSSAL</div>
 <div id="title"><div class="k">ORIGINAL AMPHIBIOUS TRACKED COLOSSUS · 230 M HULL</div>
  <div class="t">Colossal explorer</div><div class="k">PASS 2 · FIDELITY · EVERY NUMBER FROM state(t)</div></div>
 <div class="card" style="left:20px;top:110px;width:310px"><div class="h"><span>TRACK DRIVE</span><span class="n">01</span></div>
  <div style="display:flex;justify-content:space-between;align-items:baseline">
   <div><span class="big" id="v">0</span><span class="u">m/s</span><div class="lab">TRACK SPEED = r·ω</div></div>
   <div style="text-align:right"><span class="big" id="rpm" style="font-size:24px">0</span><span class="u">rpm</span><div class="lab">SPROCKET</div></div></div>
  <div class="row"><span class="lab">MOTOR @ 168:1</span><span id="mrpm"></span></div>
  <div class="row"><span class="lab">SPROCKET TORQUE / BELT</span><span id="tq"></span></div>
  <div class="row"><span class="lab">LINK PASS</span><span id="hz"></span></div>
  <div class="row"><span class="lab">DRIVE POWER</span><span id="pw"></span></div>
  <div class="row"><span class="lab">BELT TRAVEL</span><span id="bt"></span></div></div>
 <div class="card" style="left:20px;top:330px;width:310px"><div class="h"><span>GROUND & WATER</span><span class="n">02</span></div>
  <div><span class="big" id="p" style="font-size:28px">0</span><span class="u">bar</span><span class="lab" style="margin-left:8px" id="pr"></span></div>
  <div class="row"><span class="lab">WATER DEPTH</span><span id="dv"></span></div>
  <input type="range" id="depth" min="0" max="30" step="0.5" value="0">
  <div class="row"><span class="lab">BUOYANCY</span><span id="by"></span></div>
  <div class="row"><span class="lab">STATE</span><span id="fl"></span></div></div>
 <div class="card" style="right:20px;top:110px;width:330px"><div class="h"><span>SUSPENSION · 20 STRUTS</span><span class="n">03</span></div>
  <canvas class="ch" id="ch" width="620" height="180"></canvas>
  <div class="row"><span class="lab">HULL PITCH</span><span id="hp"></span><span class="lab">ROLL</span><span id="hr"></span></div>
  <div class="row"><span class="lab">MAX STRUT</span><span id="ms"></span><span class="lab">STROKE</span><span>±${I.stroke} m</span></div>
  <div class="row"><span class="lab">POD BOGIE P / S</span><span id="pp"></span></div></div>
 <div class="card" style="right:20px;top:340px;width:330px"><div class="h"><span>HAND CHECKS</span><span class="n">04</span></div><div id="checks"></div></div>
 <div class="card" style="left:20px;bottom:40px"><div class="lab" style="margin-bottom:6px">VIEW</div><div id="views"></div>
  <div class="lab" style="margin:4px 0 6px">MODE · DISPLAY · TIME</div><div id="modes"></div></div>
 <div id="foot"><span>COLOSSAL · PASS 1 · S = SOURCED · D = DERIVED · I = INVENTED</span><span id="clock"></span></div>
</div>`);
const $ = (id) => document.getElementById(id);
$('checks').innerHTML = K.CHECK.map((c) => `<div class="row"><span>${c.id} ${c.label}</span><span class="${K.checkOK(c) ? 'ok' : 'bad'}">${c.got.toFixed(2)} / ${c.want.toFixed(2)} ${c.unit}</span></div><div class="lab" style="margin-bottom:4px">${c.note}</div>`).join('');

// ---------------------------------------------------------------- renderer, scene
const renderer = new THREE.WebGLRenderer({canvas: $('c'), antialias: true, preserveDrawingBuffer: true});
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
const scene = new THREE.Scene();
const cam = new THREE.PerspectiveCamera(32, 16 / 9, 1, 30000);
const ctl = new OrbitControls(cam, renderer.domElement);
ctl.enableDamping = true;
const hemi = new THREE.HemisphereLight(0xffffff, 0x8a8578, 1.6);
const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(-400, 700, 500);
scene.add(hemi, key);
const pmrem = new THREE.PMREMGenerator(renderer); scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const M = {
  hull: new THREE.MeshStandardMaterial({color: 0xb8b3a9, roughness: 0.8, metalness: 0.1}),
  dark: new THREE.MeshStandardMaterial({color: 0x3a3c3f, roughness: 0.7, metalness: 0.3}),
  link: new THREE.MeshStandardMaterial({color: 0x2b2d30, roughness: 0.55, metalness: 0.6}),
  wheel: new THREE.MeshStandardMaterial({color: 0x9a968e, roughness: 0.6, metalness: 0.4}),
  acc: new THREE.MeshStandardMaterial({color: 0xe8562a, roughness: 0.6}),
  plate: new THREE.MeshStandardMaterial({color: 0xcfcac1, roughness: 0.85, transparent: true, opacity: 1}),
  strut: new THREE.MeshStandardMaterial({color: 0xc0bdb6, roughness: 0.3, metalness: 0.8}),
  panel: new THREE.MeshStandardMaterial({color: 0xffffff, roughness: 0.75, metalness: 0.25}),
  light: new THREE.MeshStandardMaterial({color: 0xdedcd6, roughness: 0.45, metalness: 0.3}),
  rail: new THREE.MeshStandardMaterial({color: 0x2a2c2f, roughness: 0.6, metalness: 0.5}),
  win: new THREE.MeshStandardMaterial({color: 0x1a1a18, emissive: 0xd8d2c4, emissiveIntensity: 0.35}),
  pipe: new THREE.MeshStandardMaterial({color: 0x45474b, roughness: 0.4, metalness: 0.7}),
};
M.link.metalness = 0.85; M.link.roughness = 0.32;

// ---------------------------------------------------------------- ground (treadmill: terrain scrolls under a fixed machine)
const GL = 1600, GW = 700, GX = 160, GZ = 60;
const gGeo = new THREE.PlaneGeometry(GL, GW, GX, GZ); gGeo.rotateX(-Math.PI / 2); gGeo.translate(115, 0, 0);
const gBase = Float32Array.from(gGeo.attributes.position.array);
const gTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d');
  x.fillStyle = '#e4e1da'; x.fillRect(0, 0, 512, 512); x.strokeStyle = '#cfcac0'; x.lineWidth = 2;
  for (let i = 0; i <= 512; i += 64) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 512); x.moveTo(0, i); x.lineTo(512, i); x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(GL / 50, GW / 50); t.colorSpace = THREE.SRGBColorSpace; return t;
})();
const gMat = new THREE.MeshStandardMaterial({map: gTex, roughness: 1});
const ground = new THREE.Mesh(gGeo, gMat); scene.add(ground);
const water = new THREE.Mesh(new THREE.PlaneGeometry(GL, GW), new THREE.MeshStandardMaterial({color: 0x6f8a96, transparent: true, opacity: 0.55, roughness: 0.2}));
water.rotation.x = -Math.PI / 2; water.position.x = 115; scene.add(water);
function groundAt(d, ton) {
  const p = gGeo.attributes.position.array;
  for (let i = 0; i < p.length; i += 3) p[i + 1] = K.terrain(d + gBase[i], gBase[i + 2], ton) - 0.05;
  gGeo.attributes.position.needsUpdate = true; gGeo.computeVertexNormals();
  gTex.offset.x = (d / 50) % 1;
}
// FIELD set: flat salt pan (scrolls under the machine), dark grass band in the foreground, overcast sky
const saltTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 1024; const x = c.getContext('2d');
  x.fillStyle = '#9fa2a3'; x.fillRect(0, 0, 1024, 1024);
  let sd = 7; const rnd = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 3400; i++) { const px = rnd() * 1024, py = rnd() * 1024, w = 10 + rnd() * 60, h = 4 + rnd() * 10;
    x.fillStyle = `rgba(${rnd() < 0.55 ? '255,255,255' : '96,98,100'},${0.35 + rnd() * 0.5})`; x.fillRect(px, py, w, h); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(400, 400); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
})();
const salt = new THREE.Mesh(new THREE.PlaneGeometry(12000, 12000), new THREE.MeshStandardMaterial({map: saltTex, roughness: 0.55, metalness: 0.05}));
salt.rotation.x = -Math.PI / 2; salt.position.set(115, -0.02, 0); scene.add(salt);
const contact = (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 64; const x = c.getContext('2d'); const g = x.createRadialGradient(128, 32, 4, 128, 32, 128);
  g.addColorStop(0, 'rgba(0,0,0,0.75)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 256, 64);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(300, 190), new THREE.MeshBasicMaterial({map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false}));
  m.rotation.x = -Math.PI / 2; m.position.set(110, 0.05, 0); scene.add(m); return m; })();
const grassTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d'); x.fillStyle = '#1b1a14'; x.fillRect(0, 0, 512, 512);
  let sd = 3; const rnd = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 9000; i++) { x.fillStyle = `rgba(${60 + rnd() * 40},${50 + rnd() * 30},${30 + rnd() * 20},${0.25 + rnd() * 0.4})`; x.fillRect(rnd() * 512, rnd() * 512, 1 + rnd() * 5, 1 + rnd() * 2); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(400, 40); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const grass = new THREE.Mesh(new THREE.PlaneGeometry(5000, 480), new THREE.MeshStandardMaterial({map: grassTex, roughness: 1}));
grass.rotation.x = -Math.PI / 2; scene.add(grass);
// 1.8 m figure, fixed in the world: scrolls with the ground
const fig = new THREE.Group();
{ const f = (w, h, d, x, y) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M.dark); o.position.set(x, y, 0); fig.add(o); };
  f(0.14, 0.85, 0.16, -0.1, 0.43); f(0.14, 0.85, 0.16, 0.1, 0.43); f(0.44, 0.62, 0.24, 0, 1.17); f(0.1, 0.6, 0.1, -0.28, 1.15); f(0.1, 0.6, 0.1, 0.28, 1.15);
  const h = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), M.dark); h.position.y = 1.66; fig.add(h); }
scene.add(fig);

// ---------------------------------------------------------------- machine
const rig = new THREE.Group(); scene.add(rig);            // heave / pitch / roll
const box = (w, h, d, m, x, y, z, parent = rig) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); parent.add(o); return o; };
const cyl = (r, len, m, seg = 24) => new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg), m);

// track units: per side, 2 belts at lane ± beltW/2; links are instanced on the true belt path
const SIDES = [I.laneZ, -I.laneZ];
const BZ = (zs) => [zs + I.beltW / 2, zs - I.beltW / 2];
const PODZ = (zs) => [zs + I.podBeltW / 2, zs - I.podBeltW / 2];
const linkGeo = (() => {
  const g = [];
  const b = (w, h, d, x, y, z) => { const o = new THREE.BoxGeometry(w, h, d); o.translate(x, y, z); g.push(o); };
  b(pitch * 0.94, 0.45, 1, 0, -0.3, 0);                                         // base plate
  for (const z of [-0.33, 0, 0.33]) b(pitch * 0.78, 0.75, 0.29, 0, 0.25, z);    // three tread blocks across the width
  b(pitch * 0.22, 0.35, 0.96, -pitch * 0.3, -0.68, 0);                          // grouser bar (ground side)
  for (const z of [-0.47, 0.47]) b(pitch * 0.98, 0.5, 0.05, 0, 0.1, z);        // pin lugs
  return mergeGeometries(g);
})();
const mainLinks = new THREE.InstancedMesh(linkGeo, M.link, 4 * MAIN.N); rig.add(mainLinks);
const pods = SIDES.map((zs) => { const g = new THREE.Group(); g.position.set(I.podX0 + I.podLen / 2, POD.yt, Math.sign(zs) * I.podZ); rig.add(g); return g; });
const podLinks = pods.map((g) => { const m = new THREE.InstancedMesh(linkGeo, M.link, 2 * POD.N); g.add(m); return m; });
const wheels = [], roads = [], struts = [];
function cornerWheels(B, parent, zList, off = new THREE.Vector3()) {
  for (const z of zList) for (const [x, y] of [[B.xa, B.yb], [B.xa, B.yt], [B.xb, B.yb], [B.xb, B.yt]]) {
    const w = cyl(B.r * 0.9, I.beltW * 0.55, M.wheel, 36); w.rotation.x = Math.PI / 2; w.position.set(x - off.x, y - off.y, z - off.z);
    for (const a of [0, Math.PI / 3, 2 * Math.PI / 3]) { const spoke = box(B.r * 1.7, 0.9, I.beltW * 0.6, M.dark, 0, 0, 0, w); spoke.rotation.set(-Math.PI / 2, 0, 0); spoke.rotateZ(a); }
    w.userData.pod = B === POD;
    parent.add(w); wheels.push(w);
  }
}
cornerWheels(MAIN, rig, SIDES.flatMap(BZ));
pods.forEach((g, i) => cornerWheels(POD, g, PODZ(0), new THREE.Vector3(I.podX0 + I.podLen / 2, POD.yt, 0)));
const yRoad = 1.04 + I.rRoad;
for (const zs of SIDES) for (const x of ROAD) {
  for (const z of BZ(zs)) { const w = cyl(I.rRoad, I.beltW * 0.7, M.wheel, 16); w.rotation.x = Math.PI / 2; w.position.set(x, yRoad, z); rig.add(w); roads.push(w);
    const sp = box(I.rRoad * 1.7, 0.5, I.beltW * 0.72, M.dark, 0, 0, 0, w); sp.rotation.x = -Math.PI / 2; }
  const s = cyl(0.7, 1, M.strut, 12); s.position.set(x, 0, zs); rig.add(s); struts.push(s);
}
// ---------------------------------------------------------------- detail (seeded greebles, instanced)
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const X = V3(1, 0, 0), Y = V3(0, 1, 0), Zp = V3(0, 0, 1);
const GR = makeCollector(), GS = makeCollector();          // GR: on the rig, GS: on the slewing deck
const plates = [];
SIDES.forEach((zs, si) => {
  const sg = Math.sign(zs), zo = zs + sg * (I.unitW / 2 + 0.6);
  plates.push(box(MAIN.xb - MAIN.xa, 18, 0.8, M.plate, (MAIN.xa + MAIN.xb) / 2, 15, zo));
  const o = sg > 0 ? V3(MAIN.xa, 6, zo + 0.4) : V3(MAIN.xb, 6, zo - 0.4), u = sg > 0 ? X : V3(-1, 0, 0), n = V3(0, 0, sg);
  face(GR, 11 + si, o, u, Y, n, MAIN.xb - MAIN.xa, 18, {min: 3, relief: 0.35, white: 0.0, win: 0, pipes: 1, ladders: 2});
  for (const x of [MAIN.xa, MAIN.xb]) { const h = cyl(rS * 0.62, 1.6, M.plate, 40); h.rotation.x = Math.PI / 2; h.position.set(x, MAIN.yb + MAIN.Ly / 2, zo + sg * 0.8); rig.add(h); plates.push(h);
    const hub = cyl(1.6, 2.2, M.light, 16); hub.rotation.x = Math.PI / 2; hub.position.set(x, MAIN.yb + MAIN.Ly / 2, zo + sg * 1.4); rig.add(hub); }
  for (let i = 0; i < 4; i++) { const x = MAIN.xa + (i + 1) * (MAIN.xb - MAIN.xa) / 5; const h = cyl(2.4, 1.4, M.plate, 24); h.rotation.x = Math.PI / 2; h.position.set(x, 21.5, zo + sg * 0.9); rig.add(h); plates.push(h);
    const c = cyl(0.8, 1.8, M.light, 12); c.rotation.x = Math.PI / 2; c.position.set(x, 21.5, zo + sg * 1.4); rig.add(c); }
});
// hull deck
box(I.hullL, I.hullH, I.beam, M.hull, I.hullL / 2, I.unitH + I.hullH / 2, 0);
face(GR, 21, V3(0, I.unitH, I.beam / 2), X, Y, Zp, I.hullL, I.hullH, {min: 2.4, relief: 0.6, win: 0.02, pipes: 2});
face(GR, 22, V3(I.hullL, I.unitH, -I.beam / 2), V3(-1, 0, 0), Y, V3(0, 0, -1), I.hullL, I.hullH, {min: 2.4, relief: 0.6, win: 0.02, pipes: 2});
for (const z of [I.beam / 2, -I.beam / 2]) railing(GR, V3(0, I.unitH + I.hullH, z), V3(I.hullL, I.unitH + I.hullH, z));
// slewing ring + upper deck: side profile extruded across the beam (rear block, chamfered nose, boom neck)
const slew = new THREE.Group(); slew.position.set(I.upX, I.ringY, 0); rig.add(slew);
{ const r = cyl(I.ringD / 2, 8, M.acc, 64); r.position.y = 4; slew.add(r); }
const PROF = [[-108, 8], [-108, 50], [30, 50], [58, 36], [92, 36], [92, 12], [70, 8]];
{ const sh = new THREE.Shape(PROF.map(([x, y]) => new THREE.Vector2(x, y)));
  const g = new THREE.ExtrudeGeometry(sh, {depth: I.upW, bevelEnabled: false}); g.translate(0, 0, -I.upW / 2);
  slew.add(new THREE.Mesh(g, M.hull)); }
const hw = I.upW / 2;
face(GS, 31, V3(-108, 8, hw), X, Y, Zp, 138, 42, {min: 2.2, relief: 0.9, win: 0.07, white: 0.02, pipes: 3, ladders: 2});
face(GS, 32, V3(30, 8, -hw), V3(-1, 0, 0), Y, V3(0, 0, -1), 138, 42, {min: 2.2, relief: 0.9, win: 0.07, white: 0.02, pipes: 3, ladders: 2});
face(GS, 33, V3(-108, 8, -hw), Zp, Y, V3(-1, 0, 0), I.upW, 42, {min: 2.2, relief: 0.9, win: 0.05, pipes: 2});
face(GS, 34, V3(58, 12, hw), X, Y, Zp, 34, 24, {min: 2, relief: 0.8, win: 0.03});
face(GS, 35, V3(92, 12, -hw), V3(-1, 0, 0), Y, V3(0, 0, -1), 34, 24, {min: 2, relief: 0.8, win: 0.03});
face(GS, 36, V3(-108, 50, hw), X, V3(0, 0, -1), Y, 138, I.upW, {min: 3, relief: 2.6, depth: 0.4, white: 0.04, win: 0, pipes: 2, ladders: 0});
{ // chamfer: lighter sloped plating, like the reference's bright glacis
  const a = V3(30, 50, hw), b = V3(58, 36, hw), u = b.clone().sub(a), L = u.length(); u.normalize();
  const n = Zp.clone().cross(u).normalize();
  face(GS, 37, V3(30, 50, -hw), Zp, u, n, I.upW, L, {min: 2.5, relief: 0.25, white: 0.55, win: 0, pipes: 0, ladders: 0});
}
for (const y of [22, 36]) for (const sg of [1, -1]) catwalk(GS, V3(-106, y, sg * hw), V3(28, y, sg * hw), V3(0, 0, sg));
for (const [a, b] of [[V3(-108, 50, hw), V3(30, 50, hw)], [V3(-108, 50, -hw), V3(30, 50, -hw)], [V3(-108, 50, hw), V3(-108, 50, -hw)]]) railing(GS, a, b);
{ const pad = cyl(11, 0.7, M.dark, 40); pad.position.set(14, 54, 0); slew.add(pad); const post = cyl(3, 3.5, M.dark, 12); post.position.set(14, 51.8, 0); slew.add(post); }
for (const [x, z, h] of [[-70, 18, 36], [-52, 22, 28], [-20, -20, 22], [-90, -12, 18], [-35, 4, 12]]) { const m = cyl(0.35, h, M.rail, 6); m.position.set(x, 50 + h / 2, z); slew.add(m); }
// boom: segmented mantle with rings and rails, long barrel, muzzle collar
const boom = new THREE.Group(); boom.position.set(80, 24, 0); slew.add(boom);
box(64, 20, 24, M.hull, 32, 0, 0, boom);
const GB = makeCollector();
face(GB, 41, V3(0, -10, 12), X, Y, Zp, 64, 20, {min: 1.8, relief: 0.6, win: 0, pipes: 2});
face(GB, 42, V3(64, -10, -12), V3(-1, 0, 0), Y, V3(0, 0, -1), 64, 20, {min: 1.8, relief: 0.6, win: 0, pipes: 2});
for (let x = 4; x < 64; x += 7) GB.box('rail', V3(x, 0, 0), V3(1.2, 21.4, 25.4));
for (const z of [12, -12]) railing(GB, V3(0, 10, z), V3(64, 10, z));
{ const tube = cyl(I.boomD / 2, I.boomL - 60, M.dark, 40); tube.rotation.z = Math.PI / 2; tube.position.x = 60 + (I.boomL - 60) / 2; boom.add(tube);
  const mz = cyl(I.boomD / 2 + 0.9, 5, M.dark, 40); mz.rotation.z = Math.PI / 2; mz.position.x = I.boomL - 2.5; boom.add(mz);
  for (let x = 66; x < 100; x += 8) GB.box('rail', V3(x, 0, 0), V3(0.8, I.boomD + 0.8, I.boomD + 0.8)); }
const rams = [-8, 8].map((z) => { const r = cyl(1.1, 1, M.strut, 12); slew.add(r); return {r, z}; });
GR.build(rig, M); GS.build(slew, M); GB.build(boom, M);

// ---------------------------------------------------------------- views (spherical camera moves)
const deg = Math.PI / 180;
const VIEWS = {
  HERO: {t: [115, 35, 0], az: -38, el: 13, r: 560},
  SIDE: {t: [140, 40, 0], az: -90, el: 3, r: 700},
  TRACK: {t: [70, 14, 40], az: -62, el: 8, r: 230},
  POD: {t: [201, 12, 40], az: -55, el: 10, r: 95},
  TOP: {t: [140, 30, 0], az: -90, el: 84, r: 760},
  FIELD: {t: [150, 44, 0], az: 86, el: -0.66, r: 1900, fov: 9},
};
const sph = (v) => { const t = new THREE.Vector3(...v.t); return t.clone().add(new THREE.Vector3(Math.cos(v.el * deg) * Math.cos(v.az * deg), Math.sin(v.el * deg), -Math.cos(v.el * deg) * Math.sin(v.az * deg)).multiplyScalar(v.r)); };
let camFrom = null, camTo = null, camK = 1;
const toSph = () => { const off = cam.position.clone().sub(ctl.target); const r = off.length(); return {t: ctl.target.toArray(), r, el: Math.asin(off.y / r) / deg, az: Math.atan2(-off.z, off.x) / deg, fov: cam.fov}; };
function view(name) { ui.view = name; camFrom = toSph(); camTo = VIEWS[name]; camK = 0; sync(); }
function camStep(dt) {
  if (camK >= 1 || !camTo) return; camK = Math.min(1, camK + dt / 1.4); const k = camK < 0.5 ? 4 * camK ** 3 : 1 - (-2 * camK + 2) ** 3 / 2;
  let daz = camTo.az - camFrom.az; daz = ((daz + 540) % 360) - 180;
  const v = {t: camFrom.t.map((a, i) => a + (camTo.t[i] - a) * k), r: camFrom.r * Math.pow(camTo.r / camFrom.r, k), el: camFrom.el + (camTo.el - camFrom.el) * k, az: camFrom.az + daz * k};
  cam.fov = camFrom.fov + ((camTo.fov ?? 32) - camFrom.fov) * k; cam.updateProjectionMatrix();
  ctl.target.set(...v.t); cam.position.copy(sph(v));
}

// ---------------------------------------------------------------- modes
const ui = {t: 0, rate: 10, view: 'HERO', mode: 'STUDIO', xray: false, terrain: true, depth: 0, paused: false};
function applyMode() {
  const f = ui.mode === 'FIELD';
  document.body.classList.toggle('field', f);
  scene.background = new THREE.Color(f ? 0xdcdedf : 0xeeece7);
  scene.fog = f ? new THREE.FogExp2(0xdcdedf, 0.00022) : null;
  M.hull.color.set(f ? 0x16181b : 0xb8b3a9); M.plate.color.set(f ? 0x15171a : 0xcfcac1); M.panel.color.set(f ? 0x24262a : 0xe9e6df); M.panel.metalness = f ? 0.1 : 0.25; M.panel.envMapIntensity = f ? 0.35 : 1;
  M.link.color.set(f ? 0x8a8d92 : 0x2b2d30); M.acc.color.set(f ? 0x1c1e21 : 0xe8562a); M.wheel.color.set(f ? 0x2c2e31 : 0x9a968e);
  scene.environmentIntensity = f ? 0.45 : 0.6;
  gTex.image.getContext('2d'); gMat.color.set(f ? 0xdcdad4 : 0xffffff);
  hemi.intensity = f ? 0.8 : 1.6; key.intensity = f ? 0.3 : 2.2; renderer.toneMappingExposure = f ? 0.8 : 1;
  fig.visible = true; salt.visible = f; grass.visible = f; ground.visible = !f;
  if (f) { const cp = sph(VIEWS.FIELD), t = new THREE.Vector3(...VIEWS.FIELD.t), dir = t.clone().sub(cp).setY(0).normalize();
    grass.position.copy(cp).addScaledVector(dir, 190).setY(0.02); grass.rotation.z = Math.atan2(dir.x, dir.z);
    fig.userData.field = cp.clone().addScaledVector(dir, 436).add(new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(28)).setY(0); }
}
function applyDisplay() { M.plate.opacity = ui.xray ? 0.12 : 1; M.hull.transparent = ui.xray; M.hull.opacity = ui.xray ? 0.25 : 1; M.hull.needsUpdate = true; }
function btns(el, items) { $(el).innerHTML = items.map(([k, l]) => `<span class="btn" data-k="${k}">${l}</span>`).join(''); $(el).onclick = (e) => { const k = e.target.dataset.k; if (k) act(k); }; }
btns('views', Object.keys(VIEWS).map((k) => [`v:${k}`, k]));
btns('modes', [['m:STUDIO', 'STUDIO'], ['m:FIELD', 'FIELD'], ['x', 'X-RAY'], ['g', 'TERRAIN'], ['r:1', '×1'], ['r:10', '×10'], ['r:30', '×30'], ['p', 'PAUSE']]);
function act(k) {
  if (k.startsWith('v:')) view(k.slice(2));
  else if (k.startsWith('m:')) { ui.mode = k.slice(2); applyMode(); if (ui.mode === 'FIELD') view('FIELD'); }
  else if (k === 'x') { ui.xray = !ui.xray; applyDisplay(); }
  else if (k === 'g') ui.terrain = !ui.terrain;
  else if (k.startsWith('r:')) ui.rate = +k.slice(2);
  else if (k === 'p') ui.paused = !ui.paused;
  sync();
}
function sync() {
  document.querySelectorAll('.btn').forEach((b) => { const k = b.dataset.k; b.classList.toggle('on', k === `v:${ui.view}` || k === `m:${ui.mode}` || (k === 'x' && ui.xray) || (k === 'g' && ui.terrain) || k === `r:${ui.rate}` || (k === 'p' && ui.paused)); });
}
addEventListener('keydown', (e) => { if (e.key === 'h' || e.key === 'H') $('hud').style.display = $('hud').style.display === 'none' ? '' : 'none'; });
$('depth').oninput = (e) => { ui.depth = +e.target.value; };

// ---------------------------------------------------------------- pose from state
const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e3 = new THREE.Euler(), sv = new THREE.Vector3(1, 1, 1), pv = new THREE.Vector3();
const strutInterp = (S, sideIdx, x) => {  // bottom-run deflection between road wheels (terrain-following belt)
  const a = S.strut.slice(sideIdx * I.nRoad, sideIdx * I.nRoad + I.nRoad);
  if (x <= ROAD[0]) return a[0] * Math.max(0, (x - MAIN.xa) / (ROAD[0] - MAIN.xa));
  if (x >= ROAD.at(-1)) return a.at(-1) * Math.max(0, (MAIN.xb - x) / (MAIN.xb - ROAD.at(-1)));
  const f = (x - ROAD[0]) / (ROAD[1] - ROAD[0]), i = Math.floor(f), u = f - i;
  return a.at(i) * (1 - u) + a.at(Math.min(i + 1, a.length - 1)) * u;
};
function pose(S) {
  rig.position.y = S.hull.heave; rig.rotation.set(-S.hull.roll, 0, S.hull.pitch);
  let n = 0;
  SIDES.forEach((zs, si) => BZ(zs).forEach((z, bi) => {
    for (let k = 0; k < MAIN.N; k++) {
      const p = K.beltAt(MAIN, k * pitch + S.belt + bi * pitch / 2);
      const dy = p.bottom ? strutInterp(S, si, p.x) : 0;
      e3.set(0, 0, p.a); q.setFromEuler(e3); pv.set(p.x, p.y + dy, z); sv.set(1, 1, I.beltW * 0.97);
      mainLinks.setMatrixAt(n++, m4.compose(pv, q, sv));
    }
  }));
  mainLinks.instanceMatrix.needsUpdate = true;
  pods.forEach((g, si) => {
    g.rotation.z = S.podPitch[si];
    let j = 0;
    PODZ(0).forEach((z, bi) => { for (let k = 0; k < POD.N; k++) {
      const p = K.beltAt(POD, k * pitch + S.belt + bi * pitch / 2);
      e3.set(0, 0, p.a); q.setFromEuler(e3); pv.set(p.x - (I.podX0 + I.podLen / 2), p.y - POD.yt, z); sv.set(1, 1, I.podBeltW * 0.97);
      podLinks[si].setMatrixAt(j++, m4.compose(pv, q, sv));
    } });
    podLinks[si].instanceMatrix.needsUpdate = true;
  });
  for (const w of wheels) w.rotation.y = -(w.userData.pod ? S.podAngle : S.sprocketAngle);
  roads.forEach((w, i) => { const si = Math.floor(i / (2 * I.nRoad)), ri = Math.floor((i % (2 * I.nRoad)) / 2); w.rotation.y = -S.roadAngle; w.position.y = yRoad + S.strut[si * I.nRoad + ri]; });
  struts.forEach((s, i) => { const y0 = yRoad + S.strut[i], y1 = 22; s.position.y = (y0 + y1) / 2; s.scale.y = y1 - y0; });
  slew.rotation.y = S.slew; boom.rotation.z = S.elev;
  for (const {r, z} of rams) {   // ram from deck front to boom underside, recomputed each frame
    const a = new THREE.Vector3(66, 12, z), b = new THREE.Vector3(30, -9, z).applyAxisAngle(new THREE.Vector3(0, 0, 1), S.elev).add(boom.position);
    r.position.copy(a).add(b).multiplyScalar(0.5); r.scale.y = a.distanceTo(b); r.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  }
  groundAt(S.d, ui.terrain);
  water.visible = S.h > 0; water.position.y = S.h;
  if (ui.mode === 'FIELD') { fig.position.copy(fig.userData.field); saltTex.offset.x = (S.d / (12000 / 400)) % 1; }
  else { const fx = 300 - (S.d % 1200); fig.position.set(fx < -300 ? fx + 1200 : fx, K.terrain(S.d + fig.position.x, 70, ui.terrain), 70); }
}
const fmt = (x, d = 1) => (Number.isFinite(x) ? x.toFixed(d) : 'NaN');
const cctx = $('ch').getContext('2d');
function panels(S) {
  $('v').textContent = fmt(S.trackSpeed, 2); $('rpm').textContent = fmt(S.sprocketRpm, 2);
  $('mrpm').textContent = `${fmt(S.motorRpm, 0)} rpm`; $('tq').textContent = `${fmt(S.torqueMNm, 0)} MN·m`;
  $('hz').textContent = `${fmt(S.linkHz, 2)} Hz · 1 per ${fmt(1 / S.linkHz, 1)} s`; $('pw').textContent = `${fmt(S.powerMW, 1)} MW · ${fmt(S.plantPct * 100, 0)}% plant`;
  $('bt').textContent = `${fmt(S.d, 0)} m`;
  $('p').textContent = fmt(S.pBar, 2); $('pr').textContent = `${fmt(S.pRatio, 2)}× BAGGER 288`; $('pr').className = 'lab ' + (S.pRatio <= 1 ? 'ok' : 'bad');
  $('dv').textContent = `${fmt(S.h, 1)} m`; $('by').textContent = `${fmt(S.buoyN / 1e9, 2)} GN of ${fmt(K.W / 1e9, 2)} GN`;
  $('fl').textContent = S.floating ? `AFLOAT · DRAFT ${fmt(K.DRAFT, 1)} M` : S.h > 0 ? 'WADING' : 'ON LAND';
  $('hp').textContent = `${fmt(S.hull.pitch / deg, 2)}°`; $('hr').textContent = `${fmt(S.hull.roll / deg, 2)}°`;
  $('ms').textContent = `${fmt(S.maxStrut, 2)} m`; $('pp').textContent = `${fmt(S.podPitch[0] / deg, 1)}° / ${fmt(S.podPitch[1] / deg, 1)}°`;
  const W = 620, H = 180; cctx.clearRect(0, 0, W, H); cctx.fillStyle = '#857f75'; cctx.fillRect(0, H / 2, W, 1);
  S.strut.forEach((s, i) => { const bw = W / S.strut.length; cctx.fillStyle = i < I.nRoad ? '#e8562a' : '#3a3c3f'; const h = (s / I.stroke) * (H / 2 - 6); cctx.fillRect(i * bw + 3, H / 2 - Math.max(h, 0), bw - 6, Math.abs(h)); });
  $('clock').textContent = `t ${fmt(S.t, 0)} s · TIME ×${ui.rate}${ui.rate > 1 ? ' (TIME-LAPSE)' : ''} · ${ui.mode} · ${ui.view}`;
}
function resize() {
  const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
  $('hud').style.transform = `scale(${Math.min(w / 1600, h / 900)})`;
}
addEventListener('resize', resize); resize();

const opts = () => (ui.mode === 'FIELD' ? {terrain: false, depth: ui.depth, slew: 0, elev: 0.012} : {terrain: ui.terrain, depth: ui.depth});
function renderAt(t) { ui.t = t; const S = K.state(t, opts()); pose(S); panels(S); renderer.render(scene, cam); }
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  if (!ui.paused && !window.__hold) ui.t += dt * ui.rate;
  camStep(dt); ctl.update();
  const S = K.state(ui.t, opts()); pose(S); panels(S);
  renderer.render(scene, cam); requestAnimationFrame(frame);
}
applyMode(); applyDisplay(); cam.position.copy(sph(VIEWS.HERO)); ctl.target.set(...VIEWS.HERO.t); sync();
requestAnimationFrame(frame);
window.__app = {ready: true, ui, view, act, renderAt, VIEWS, settle: () => { if (camTo) { camK = 0.999; camStep(1); } }, K, scene, cam, grass, salt, fig};
