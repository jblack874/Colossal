// COLOSSAL — pass 1 (motion). Every pose and number reads from kin.js state(t). No hand-keyed motion.
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import * as K from './kin.js';

const {I, MAIN, POD, ROAD, pitch, rS} = K;
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
  <div class="t">Track motion model</div><div class="k">PASS 1 · MOTION ONLY · EVERY NUMBER FROM state(t)</div></div>
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

const M = {
  hull: new THREE.MeshStandardMaterial({color: 0xb8b3a9, roughness: 0.8, metalness: 0.1}),
  dark: new THREE.MeshStandardMaterial({color: 0x3a3c3f, roughness: 0.7, metalness: 0.3}),
  link: new THREE.MeshStandardMaterial({color: 0x2b2d30, roughness: 0.55, metalness: 0.6}),
  wheel: new THREE.MeshStandardMaterial({color: 0x9a968e, roughness: 0.6, metalness: 0.4}),
  acc: new THREE.MeshStandardMaterial({color: 0xe8562a, roughness: 0.6}),
  plate: new THREE.MeshStandardMaterial({color: 0xcfcac1, roughness: 0.85, transparent: true, opacity: 1}),
  strut: new THREE.MeshStandardMaterial({color: 0xc0bdb6, roughness: 0.3, metalness: 0.8}),
};

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
// 1.8 m figure, fixed in the world: scrolls with the ground
const fig = new THREE.Group();
{ const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 1.3, 4, 8), M.dark); b.position.y = 0.87; fig.add(b); }
scene.add(fig);

// ---------------------------------------------------------------- machine
const rig = new THREE.Group(); scene.add(rig);            // heave / pitch / roll
const box = (w, h, d, m, x, y, z, parent = rig) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); parent.add(o); return o; };
const cyl = (r, len, m, seg = 24) => new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg), m);

// track units: per side, 2 belts at lane ± beltW/2; links are instanced on the true belt path
const SIDES = [I.laneZ, -I.laneZ];
const BZ = (zs) => [zs + I.beltW / 2, zs - I.beltW / 2];
const PODZ = (zs) => [zs + I.podBeltW / 2, zs - I.podBeltW / 2];
const linkGeo = new THREE.BoxGeometry(pitch * 0.9, 1.04, 1);
const mainLinks = new THREE.InstancedMesh(linkGeo, M.link, 4 * MAIN.N); rig.add(mainLinks);
const pods = SIDES.map((zs) => { const g = new THREE.Group(); g.position.set(I.podX0 + I.podLen / 2, POD.yt, zs); rig.add(g); return g; });
const podLinks = pods.map((g) => { const m = new THREE.InstancedMesh(linkGeo, M.link, 2 * POD.N); g.add(m); return m; });
const wheels = [], roads = [], struts = [];
function cornerWheels(B, parent, zList, off = new THREE.Vector3()) {
  for (const z of zList) for (const [x, y] of [[B.xa, B.yb], [B.xa, B.yt], [B.xb, B.yb], [B.xb, B.yt]]) {
    const w = cyl(rS * 0.9, I.beltW * 0.55, M.wheel, 12); w.rotation.x = Math.PI / 2; w.position.set(x - off.x, y - off.y, z - off.z);
    const spoke = box(rS * 1.6, 0.6, I.beltW * 0.6, M.dark, 0, 0, 0, w); spoke.rotation.x = -Math.PI / 2;
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
// side plates (outer face of each unit) — hidden in X-RAY
const plates = [];
for (const zs of SIDES) {
  const zo = zs + Math.sign(zs) * (I.unitW / 2 + 0.6);
  plates.push(box(MAIN.Lx + 2 * rS, 16, 0.8, M.plate, (MAIN.xa + MAIN.xb) / 2, 15, zo));
}
// hull, slewing ring, upper deck, boom
box(I.hullL, I.hullH, I.beam, M.hull, I.hullL / 2, I.unitH + I.hullH / 2, 0);
const slew = new THREE.Group(); slew.position.set(I.upX, I.ringY, 0); rig.add(slew);
{ const r = cyl(I.ringD / 2, 8, M.acc, 48); r.position.y = 4; slew.add(r); }
box(I.upL, I.upH, I.upW, M.hull, 0, 8 + I.upH / 2, 0, slew);
const boom = new THREE.Group(); boom.position.set(I.trunX - I.upX, I.trunY - I.ringY, 0); slew.add(boom);
box(40, 22, 22, M.hull, 20, 0, 0, boom);
{ const tube = cyl(I.boomD / 2, I.boomL - 40, M.dark, 32); tube.rotation.z = Math.PI / 2; tube.position.x = 40 + (I.boomL - 40) / 2; boom.add(tube); }
const rams = [-8, 8].map((z) => { const r = cyl(1.1, 1, M.strut, 12); slew.add(r); return {r, z}; });
for (const [x, h] of [[-55, 30], [-30, 24]]) { const m = cyl(0.4, h, M.dark, 8); m.position.set(x, 8 + I.upH + h / 2, 10); slew.add(m); }

// ---------------------------------------------------------------- views (spherical camera moves)
const deg = Math.PI / 180;
const VIEWS = {
  HERO: {t: [115, 35, 0], az: -38, el: 13, r: 560},
  SIDE: {t: [140, 40, 0], az: -90, el: 3, r: 700},
  TRACK: {t: [70, 14, 40], az: -62, el: 8, r: 230},
  POD: {t: [201, 12, 40], az: -55, el: 10, r: 95},
  TOP: {t: [140, 30, 0], az: -90, el: 84, r: 760},
  FIELD: {t: [150, 38, 0], az: -78, el: 0.9, r: 1900, fov: 12},
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
  scene.background = new THREE.Color(f ? 0xc6c9cb : 0xeeece7);
  scene.fog = f ? new THREE.FogExp2(0xc6c9cb, 0.00042) : null;
  M.hull.color.set(f ? 0x1b1d20 : 0xb8b3a9); M.plate.color.set(f ? 0x202226 : 0xcfcac1);
  M.link.color.set(f ? 0x5d6066 : 0x2b2d30); M.acc.color.set(f ? 0x2a2c30 : 0xe8562a);
  gTex.image.getContext('2d'); gMat.color.set(f ? 0xdcdad4 : 0xffffff);
  hemi.intensity = f ? 2.4 : 1.6; key.intensity = f ? 0.5 : 2.2;
  fig.visible = true;
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
  for (const w of wheels) w.rotation.y = -S.sprocketAngle;
  roads.forEach((w, i) => { const si = Math.floor(i / (2 * I.nRoad)), ri = Math.floor((i % (2 * I.nRoad)) / 2); w.rotation.y = -S.roadAngle; w.position.y = yRoad + S.strut[si * I.nRoad + ri]; });
  struts.forEach((s, i) => { const y0 = yRoad + S.strut[i], y1 = 22; s.position.y = (y0 + y1) / 2; s.scale.y = y1 - y0; });
  slew.rotation.y = S.slew; boom.rotation.z = S.elev;
  for (const {r, z} of rams) {   // ram from deck front to boom underside, recomputed each frame
    const a = new THREE.Vector3(60, 8, z), b = new THREE.Vector3(25, -10, z).applyAxisAngle(new THREE.Vector3(0, 0, 1), S.elev).add(boom.position);
    r.position.copy(a).add(b).multiplyScalar(0.5); r.scale.y = a.distanceTo(b); r.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  }
  groundAt(S.d, ui.terrain);
  water.visible = S.h > 0; water.position.y = S.h;
  const fx = 300 - (S.d % 1200); fig.position.set(fx < -300 ? fx + 1200 : fx, K.terrain(S.d + fig.position.x, 70, ui.terrain), 70);
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

const opts = () => ({terrain: ui.terrain, depth: ui.depth});
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
window.__app = {ready: true, ui, view, act, renderAt, VIEWS, settle: () => { if (camTo) { camK = 0.999; camStep(1); } }, K};
