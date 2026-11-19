// COLOSSAL — pass 1 (motion). Every pose and number reads from kin.js state(t). No hand-keyed motion.
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import * as K from './kin.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {makeCollector, face, railing, catwalk} from './greeble.js';
import {buildSystems, SYSMATS, EXTS} from './sys3d.js';
import * as D from './sysdata.js';
import {parseGLB, hideOld, place, repoint, mats as glbMats} from './glb.js';
import GENSET from './assets/genset.glb';
import ROOMKIT from './assets/roomkit.glb';
import SWB from './assets/swb.glb';
import TX from './assets/transformer.glb';
import SLIP from './assets/slipring.glb';
import BRUSH from './assets/brushgear.glb';
import DRIVES from './assets/drives.glb';
import TRAIN from './assets/train.glb';
import PODTRAIN from './assets/podtrain.glb';
import STATION from './assets/station.glb';
import SLEWFIXED from './assets/slewfixed.glb';
import SLEWINNER from './assets/slewinner.glb';
import SLEWDRIVE from './assets/slewdrive.glb';
import HPU from './assets/hpu.glb';
import GUN from './assets/gun.glb';
import THRUSTER from './assets/thruster.glb';
import PUMP from './assets/pump.glb';
import FIREPUMP from './assets/firepump.glb';
import LIFEBOAT from './assets/lifeboat.glb';
import HYDRANT from './assets/hydrant.glb';

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
.chip{display:inline-block;font-size:9px;font-weight:700;padding:1px 5px;border-radius:3px;margin-right:6px;color:#fff}.cS{background:#2e7d5b}.cD{background:#3a63a8}.cI{background:#8a6d3b}
.lbl{position:absolute;font-size:10px;letter-spacing:.06em;background:rgba(251,250,247,.95);border:1px solid var(--line);border-radius:3px;padding:2px 6px;white-space:nowrap;pointer-events:none}
#leads line{stroke:#1d1d1f;stroke-width:1}#leads circle{fill:var(--acc)}
.prow{padding:2px 0;border-bottom:1px dotted var(--line)}.prow .nt{color:var(--mute)}
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
 <svg id="leads" width="1600" height="900" style="position:absolute;left:0;top:0;pointer-events:none"></svg><div id="labels"></div>
 <div class="card" id="sysCard" style="right:20px;top:100px;width:430px;max-height:740px;overflow:auto;display:none">
  <div class="h"><span id="sysT">SYSTEM</span><span class="n" id="sysN"></span></div>
  <div id="sysRead"></div><div class="lab" style="margin:8px 0 4px">HAND CHECKS</div><div id="sysChk"></div>
  <div class="lab" style="margin:8px 0 4px">EXPLODE</div><input type="range" id="explode" min="0" max="1" step="0.01" value="0">
  <div class="lab" style="margin:6px 0 4px">SECTION · FAULTS</div><div id="sysBtns"></div>
  <div class="lab" style="margin:8px 0 4px">PARTS · <span id="sysPN"></span></div><div id="sysParts" style="font-size:10px;line-height:1.5"></div></div>
 <div class="card" style="left:20px;bottom:40px"><div class="lab" style="margin-bottom:6px">SYSTEM (CUT INTO)</div><div id="systems"></div><div class="lab" style="margin:4px 0 6px">VIEW</div><div id="views"></div>
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
const PROF = [[-150, 8], [-150, 50], [30, 50], [58, 36], [92, 36], [92, 12], [70, 8]];
{ const sh = new THREE.Shape(PROF.map(([x, y]) => new THREE.Vector2(x, y)));
  const g = new THREE.ExtrudeGeometry(sh, {depth: I.upW, bevelEnabled: false}); g.translate(0, 0, -I.upW / 2);
  slew.add(new THREE.Mesh(g, M.hull)); }
const hw = I.upW / 2;
face(GS, 31, V3(-150, 8, hw), X, Y, Zp, 180, 42, {min: 2.2, relief: 0.9, win: 0.07, white: 0.10, pipes: 3, ladders: 2});
face(GS, 32, V3(30, 8, -hw), V3(-1, 0, 0), Y, V3(0, 0, -1), 180, 42, {min: 2.2, relief: 0.9, win: 0.07, white: 0.10, pipes: 3, ladders: 2});
face(GS, 33, V3(-150, 8, -hw), Zp, Y, V3(-1, 0, 0), I.upW, 42, {min: 2.2, relief: 0.9, win: 0.05, pipes: 2});
face(GS, 34, V3(58, 12, hw), X, Y, Zp, 34, 24, {min: 2, relief: 0.8, win: 0.03});
face(GS, 35, V3(92, 12, -hw), V3(-1, 0, 0), Y, V3(0, 0, -1), 34, 24, {min: 2, relief: 0.8, win: 0.03});
face(GS, 36, V3(-150, 50, hw), X, V3(0, 0, -1), Y, 180, I.upW, {min: 3, relief: 2.6, depth: 0.4, white: 0.04, win: 0, pipes: 2, ladders: 0});
{ // chamfer: lighter sloped plating, like the reference's bright glacis
  const a = V3(30, 50, hw), b = V3(58, 36, hw), u = b.clone().sub(a), L = u.length(); u.normalize();
  const n = Zp.clone().cross(u).normalize();
  face(GS, 37, V3(30, 50, -hw), Zp, u, n, I.upW, L, {min: 2.5, relief: 0.25, white: 0.55, win: 0, pipes: 0, ladders: 0});
}
for (const y of [22, 36]) for (const sg of [1, -1]) catwalk(GS, V3(-148, y, sg * hw), V3(28, y, sg * hw), V3(0, 0, sg));
for (const [a, b] of [[V3(-150, 50, hw), V3(30, 50, hw)], [V3(-150, 50, -hw), V3(30, 50, -hw)], [V3(-150, 50, hw), V3(-150, 50, -hw)]]) railing(GS, a, b);
// white modules (~25%): bridge house with window band, equipment blocks, white hull band
box(26, 12, 30, M.light, 12, 56.5, 0, slew); box(26.4, 1.8, 30.4, M.win, 12, 59.5, 0, slew);
face(GS, 38, V3(-1, 50.5, 15), X, Y, Zp, 26, 12, {min: 1.6, relief: 0.2, white: 0.9, win: 0.0, pipes: 0, ladders: 1});
for (const [x, z, w, d] of [[-60, -18, 26, 16], [-30, 16, 18, 12], [-95, 0, 14, 10]]) box(w, 8, d, M.light, x, 54, z, slew);
for (const sg of [1, -1]) box(I.hullL, 2.2, 0.5, M.light, I.hullL / 2, I.unitH + I.hullH - 1.6, sg * (I.beam / 2 + 0.3));
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
const GREEB = [...GR.build(rig, M), ...GS.build(slew, M), ...GB.build(boom, M)];
const SYS = buildSystems({rig, slew, boom});
// ---------------------------------------------------------------- Blender hero assets (blender/*.py), swapped in once parsed
const GLB = {ready: false};
(async () => {
  const S1 = SYS[0];
  const [gen, kit] = await Promise.all([parseGLB(GENSET), parseGLB(ROOMKIT)]);
  GLB.eng = glbMats(gen).engine_grey.clone(); GLB.head = glbMats(gen).head_grey;
  for (const id of ['heads', 'rocker', 'fpump', 'doors', 'mounts']) S1.parts.find((p) => p.id === id).obj.layers.set(1);
  S1.hp.layers.set(1);
  S1.gensets.forEach((gs, i) => {
    hideOld(gs); const c = place(gen, gs);
    for (const n of ['block', 'doors']) c.getObjectByName(n).material = GLB.eng;
    if (i === 0) repoint(S1, c, ['block', 'heads', 'rocker', 'fpump', 'doors', 'mounts', 'exh', 'turbo', 'cac', 'alt']);
  });
  const keep = [...S1.parts.filter((p) => /^room\d/.test(p.id)).map((p) => p.obj), ...(SYS[6].ext || [])];
  S1.rooms.forEach((R, i) => { hideOld(R.g, {direct: true, keep}); const c = place(kit, R.g, {mirrorZ: R.s < 0}); if (i === 0) repoint(S1, c, ['day', 'gvu', 'sep', 'co2', 'crane', 'fans']); });
  // 2 electrical
  const S2 = SYS[1];
  const [swb, tx, slip, brush, drv] = await Promise.all([SWB, TX, SLIP, BRUSH, DRIVES].map(parseGLB));
  S2.swbs.forEach((sw, i) => { sw.layers.set(1); const R = S1.rooms[i].g.position, s = S1.rooms[i].s; const c = place(swb, S2.EG, {x: R.x - 7, y: 21.2, z: R.z + 6 * s, mirrorZ: s > 0}); if (i === 0) repoint(S2, c, ['swb']); });
  S2.txs.forEach((t, i) => { hideOld(t); const c = place(tx, t); if (i === 0) repoint(S2, c, ['tx']); });
  hideOld(S2.slipR); hideOld(S2.slipS); repoint(S2, place(slip, S2.slipR), ['slipring', 'swivel']); repoint(S2, place(brush, S2.slipS), ['brushes']);
  S2.drv.forEach((d, i) => { hideOld(d); const c = place(drv, d); if (i === 0) repoint(S2, c, ['drives']); });
  // 3 drivetrain: rotating GLB nodes copy the procedural model's transforms every frame
  const S3 = SYS[2]; GLB.sync = [];
  const [train, podtrain] = await Promise.all([TRAIN, PODTRAIN].map(parseGLB));
  const pair = (root, name, old, sg, off = null) => { const n = root.getObjectByName(name); if (n && old) GLB.sync.push([n, old, sg, off]); };
  for (const T of S3.trains) {
    const g = T.ring.parent, sg = Math.sign(g.position.z) || 1; hideOld(g); const c = place(train, g, {mirrorZ: sg < 0});
    (GLB.drums ??= []).push(c.getObjectByName('hubdrum'));
    pair(c, 'ringgear', T.ring, sg); pair(c, 'carrier', T.carrier, sg); pair(c, 'sun', T.sunM, sg); pair(c, 'bull', T.bullM, sg); pair(c, 'sprocket', T.rim, sg);
    T.planets.forEach((p, k) => pair(c, `planet${k}`, p, sg)); T.pinions.forEach((p, k) => pair(c, `pinion${k}`, p, sg)); T.motors.forEach((p, k) => pair(c, `motor${k}`, p, sg));
  }
  for (const T of S3.podTrains) {
    const g = T.bm.parent, sg = Math.sign(g.position.z) || 1; hideOld(g); const c = place(podtrain, g, {mirrorZ: sg < 0});
    pair(c, 'podbull', T.bm, sg); T.pins.forEach((p, k) => pair(c, `podpin${k}`, p, sg));
  }
  // 4 suspension stations: barrels static, rods + accumulators follow the live strut model
  const S4 = SYS[3]; const station = await parseGLB(STATION); GLB.acc = glbMats(station).accumulator; GLB.pullOnly = [];
  for (let i = 0; i < S4.nOld; i++) S4.SG.children[i].layers.set(1);
  S4.stations.forEach((st) => {
    const off = new THREE.Vector3(st.x, 0, st.zs), c = place(station, S4.SG, {x: st.x, z: st.zs});
    st.rod.forEach((r, k) => pair(c, `rod${k}`, r, 1, off)); st.acc.forEach((a, k) => pair(c, `acc${k}`, a, 1, off));
    GLB.pullOnly.push(c.getObjectByName('wheel'), c.getObjectByName('trackrun'));
    if (st.si === 0 && st.ri === 3) repoint(S4, c, ['cyl', 'manifold', 'hose', 'bearing', 'axle']);
  });
  // 5 slewing
  const S5 = SYS[4], [LG, LS] = S5.groups;
  const [sfix, sinn, sdrv] = await Promise.all([SLEWFIXED, SLEWINNER, SLEWDRIVE].map(parseGLB));
  hideOld(LG, {keep: S5.rows, direct: true}); repoint(S5, place(sfix, LG), ['outer', 'lowerRing', 'ringgear', 'bolts', 'pedestal', 'grease']);
  S5.parts.find((p) => p.id === 'inner').obj.layers.set(1); repoint(S5, place(sinn, LS), ['inner']);
  for (const d of S5.drives) { hideOld(d.dv); pair(place(sdrv, d.dv), 'pinion', d.pn, 1); }
  // 6 gun: HPU room + gun internals (visual only)
  const S6 = SYS[5]; const [hpu, gun] = await Promise.all([HPU, GUN].map(parseGLB));
  const H = S6.parts.find((p) => p.id === 'pumps').obj.parent; hideOld(H); repoint(S6, place(hpu, H), ['pumps', 'resv', 'accB', 'vblk', 'filt']);
  const GB = S6.groups[1]; hideOld(GB); repoint(S6, place(gun, GB), ['trunnion', 'cradle', 'recoil', 'breech', 'bring', 'tray', 'carrier', 'hoist', 'jacket', 'bore']);
  // 7 hull: thrusters, pumps, lifeboats, hydrants
  const S7 = SYS[6]; const [thrG, pumpG, fpG, boatG, hydG] = await Promise.all([THRUSTER, PUMP, FIREPUMP, LIFEBOAT, HYDRANT].map(parseGLB));
  S7.thr.forEach((t, i) => { hideOld(t.th); const c = place(thrG, t.th); pair(c, 'prop', t.prop, 1); if (i === 0) repoint(S7, c, ['nozzle']); });
  S7.bpumps.forEach((g, i) => { hideOld(g); place(pumpG, g); });
  S7.fpumps.forEach((g, i) => { hideOld(g); place(fpG, g); });
  S7.boats.forEach((b) => { hideOld(b); place(boatG, b, {mirrorZ: b.position.z < 0}); });
  { const im = S7.hyd, M4 = new THREE.Matrix4(), P = new THREE.Vector3(); im.layers.set(1);
    for (let i = 0; i < im.count; i++) { im.getMatrixAt(i, M4); P.setFromMatrixPosition(M4); const c = place(hydG, im.parent, {x: P.x, y: P.y, z: P.z}); if (P.z < 0) c.rotation.y = Math.PI; if (i === 0) repoint(S7, c, ['hydrant']); } }
  GLB.ready = true; window.__glb = true; applyShell();
})();

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
const ui = {t: 0, rate: 10, view: 'HERO', mode: 'STUDIO', xray: false, terrain: true, depth: 0, paused: false, sys: 0, explode: 0, ghost: false, pull: false, strobe: true, trip: {}};
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
  else if (k.startsWith('s:')) selectSys(+k.slice(2));
  else if (k === 'ghost') { ui.ghost = !ui.ghost; applyShell(); }
  else if (k === 'pull') { ui.pull = !ui.pull; applyShell(); selectSys(-1); }
  else if (k === 'strobe') ui.strobe = !ui.strobe;
  else if (k.startsWith('f:')) { const f = k.slice(2); ui.trip[f] = !ui.trip[f]; }
  sync();
}
function sync() {
  document.querySelectorAll('.btn').forEach((b) => { const k = b.dataset.k; b.classList.toggle('on', k === `v:${ui.view}` || k === `m:${ui.mode}` || (k === 'x' && ui.xray) || (k === 'g' && ui.terrain) || k === `r:${ui.rate}` || (k === 'p' && ui.paused) || k === `s:${ui.sys}` || (k === 'ghost' && ui.ghost) || (k === 'pull' && ui.pull) || (k === 'strobe' && ui.strobe) || (k.startsWith('f:') && ui.trip[k.slice(2)])); });
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
  S0 = S;
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
  updateSystems(S);
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
  const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); cam.aspect = w / h;
  const k = Math.min(w / 1600, h / 900); if (typeof ui !== 'undefined' && ui.sys) cam.setViewOffset(w, h, 90 * k, 0, w, h); else cam.clearViewOffset(); cam.updateProjectionMatrix();
  $('hud').style.transform = `scale(${Math.min(w / 1600, h / 900)})`;
}
addEventListener('resize', resize); resize();

// ---------------------------------------------------------------- systems runtime: select, cut, ghost, explode, labels, live update
const SHELL = [M.hull, M.plate, M.panel, M.light, M.rail, M.win, M.pipe, M.dark, M.acc, M.link, M.wheel, M.strut];
const cutPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0);
renderer.localClippingEnabled = true;
function applyShell() {
  for (const m of SHELL) {
    m.clippingPlanes = ui.sys && !ui.ghost ? [cutPlane] : null;
    const gh = ui.sys && ui.ghost; m.transparent = gh || m === M.plate && ui.xray; m.opacity = gh ? 0.07 : (m === M.plate && ui.xray ? 0.12 : 1); m.depthWrite = !gh; m.needsUpdate = true;
  }
  for (const g of GREEB) g.visible = !(ui.sys && ui.ghost);
  for (const s of SYS) for (const g of s.groups) g.visible = ui.sys ? s.n === ui.sys : ui.xray;
  const S = SYS[ui.sys - 1], P = ui.sys && ui.pull && S?.frame.pull;
  const ENV = [ground, water, salt, grass, fig, contact];
  if (P && !ui._env) ui._env = ENV.map((o) => o.visible);
  if (P) for (const o of ENV) o.visible = false; else if (ui._env) { ENV.forEach((o, i) => o.visible = ui._env[i]); ui._env = null; }
  for (const m of SHELL) { m.visible = !P; m.needsUpdate = true; }
  for (const s of SYS) for (const g of s.groups) g.traverse((o) => { if (o.isInstancedMesh) { o.userData.n0 ??= o.count; o.count = o.userData.n0; } });
  if (P) {
    const keep = new Set(S.parts.filter((p) => P.ids.includes(p.id)).map((p) => p.obj).filter(Boolean));
    scene.updateMatrixWorld(true);
    const box = new THREE.Box3(); for (const k of keep) if (!k.isInstancedMesh || P.count?.[S.parts.find((p) => p.obj === k).id] == null) box.expandByObject(k);
    box.expandByScalar(Math.max(1.5, box.getSize(new THREE.Vector3()).length() * 0.06));
    const inKeep = (o) => { for (let a = o; a; a = a.parent) if (keep.has(a)) return true; return false; };
    const tmp = new THREE.Box3(), cc = new THREE.Vector3();
    for (const g of S.groups) g.traverse((o) => {
      if (!o.isMesh) { o.visible = true; return; }
      if (inKeep(o)) { o.visible = true; return; }
      if (o.isInstancedMesh) { o.visible = false; return; }
      tmp.setFromObject(o); o.visible = box.containsPoint(tmp.getCenter(cc));
    });
    for (const p of S.parts) if (P.count?.[p.id] != null && p.obj?.isInstancedMesh) p.obj.count = P.count[p.id];
    if (P.hide) for (const g of S.groups) g.traverse((o) => { if (P.hide.includes(o.name)) o.visible = false; });
  } else if (ui.sys) for (const g of S.groups) g.traverse((o) => { o.visible = true; });
  if (GLB.pullOnly) for (const n of GLB.pullOnly) if (n && !(ui.pull && ui.sys === 4)) n.visible = false;
  if (GLB.drums) for (const d of GLB.drums) d.visible = ui.sys !== 3;
  if (GLB.eng) { const t = ui.sys === 1 && !ui.pull; GLB.eng.transparent = t; GLB.eng.opacity = t ? 0.28 : 1; GLB.eng.depthWrite = !t; GLB.eng.needsUpdate = true; }
  SYSMATS.eng.transparent = ui.sys === 1; SYSMATS.eng.opacity = ui.sys === 1 ? 0.3 : 1; SYSMATS.eng.needsUpdate = true;
}
const wp = (s) => { const f = s.frame; const p = new THREE.Vector3(...f.t); (f.in === 'slew' ? slew : rig).localToWorld(p); return p; };
function selectSys(n) {
  if (n !== -1) { ui.sys = ui.sys === n ? 0 : n; ui.explode = 0; $('explode').value = 0; ui.ghost = true; ui.pull = !!SYS[ui.sys - 1]?.frame.pull; } else n = ui.sys;
  const s = SYS[ui.sys - 1];
  $('sysCard').style.display = s ? '' : 'none';
  document.querySelectorAll('.card').forEach((c) => { if (/SUSPENSION|HAND CHECKS/.test(c.innerText) && c.id !== 'sysCard') c.style.display = s ? 'none' : ''; });
  if (s) {
    rig.updateMatrixWorld(true); applyShell();
    const bb = new THREE.Box3(); const fids = ui.pull && s.frame.pull ? s.frame.pull.ids : s.frame.focus; const fo = fids ? s.parts.filter((p) => fids.includes(p.id) && !(ui.pull && s.frame.pull?.count?.[p.id] != null) && !(p.obj?.isInstancedMesh && ui.pull)).map((p) => p.obj).filter(Boolean) : s.groups; for (const g of fo) bb.expandByObject(g);
    const c = s.frame.auto === false || bb.isEmpty() ? wp(s) : bb.getCenter(new THREE.Vector3());
    const sz = bb.getSize(new THREE.Vector3()), dim = Math.max(sz.x, sz.y * 1.6, sz.z);
    if (s.frame.auto !== false && !bb.isEmpty()) s.frame.r = dim / (2 * Math.tan(16 * Math.PI / 180)) * (ui.pull && s.frame.pull ? s.frame.pull.k ?? 1.4 : s.frame.k ?? 0.95);
    cutPlane.constant = c.z + (s.frame.in === 'slew' ? 2 : 1);
    resize();
    const ag = s.frame.in === 'slew' ? slew : rig; ui.anchor = {g: ag, l: ag.worldToLocal(c.clone()), w: c.clone()};
    VIEWS.SYS = {t: c.toArray(), az: s.frame.az, el: s.frame.el, r: s.frame.r}; view('SYS');
    $('sysT').textContent = `${s.n} · ${s.title.toUpperCase()}`; $('sysN').textContent = `${s.parts.length} PARTS`;
    $('sysPN').textContent = `${s.parts.filter((p) => p.tag === 'S').length} S · ${s.parts.filter((p) => p.tag === 'D').length} D · ${s.parts.filter((p) => p.tag === 'I').length} I`;
    $('sysParts').innerHTML = s.parts.map((p) => `<div class="prow"><span class="chip c${p.tag}">${p.tag}</span>${p.name}${p.note ? `<div class="nt">${p.note}${p.cite ? ` — <a href="${D.CITE[p.cite][1]}" target="_blank">${D.CITE[p.cite][0]}</a>` : ''}</div>` : (p.cite ? `<div class="nt"><a href="${D.CITE[p.cite][1]}" target="_blank">${D.CITE[p.cite][0]}</a></div>` : '')}</div>`).join('');
    const chks = D.SYS_CHECKS().filter((c) => c.sys === s.n);
    $('sysChk').innerHTML = chks.map((c) => `<div class="row"><span>${c.id} ${c.label}</span><span class="${D.sysOK(c) ? 'ok' : 'bad'}">${c.got.toFixed(2)} / ${c.want.toFixed(2)} ${c.unit}</span></div><div class="lab">${c.note}</div>`).join('') || '<div class="lab">—</div>';
    const fb = {1: [['f:gen', 'TRIP GENSET']], 2: [['f:gen', 'TRIP GENSET']], 3: [['f:motor', 'TRIP MOTOR'], ['strobe', 'STROBE 1/100']], 4: [], 5: [], 6: [], 7: [['f:flood', 'FLOOD COMPT']]}[s.n];
    btns('sysBtns', [...(s.frame.pull ? [['pull', 'PULL-OUT UNIT / IN-SITU']] : []), ['ghost', 'GHOST SHELL (OFF = SECTION CUT)'], ...fb]);
  } else view('HERO');
  applyShell(); sync();
}
btns('systems', SYS.map((s) => [`s:${s.n}`, `${s.n} ${s.key.toUpperCase()}`]));
$('explode').oninput = (e) => { ui.explode = +e.target.value; };
const tmpV = new THREE.Vector3();
let sysLive = null;
function updateSystems(S) {
  const Y = D.systems(S, {trip: ui.trip, elevRate: 0});
  sysLive = Y;
  const [s1, s2, s3, s4, s5, s6, s7] = SYS;
  // 1 power: online heads glow, pistons on a slider-crank (display slowed ×1/60 when STROBE is on)
  const nOn = Y.power.nOn, crank = (S.t / ui.rate) * (D.POWER.rpm / 60) * 2 * Math.PI * (ui.strobe ? 1 / 60 : 1);
  SYSMATS.head.emissiveIntensity = 0.35 + 0.25 * Y.power.loadPct;
  if (GLB.head) { GLB.head.emissive.setHex(0xff5a1f); GLB.head.emissiveIntensity = SYSMATS.head.emissiveIntensity * (ui.sys === 1 ? 1 : 0); }
  const r = D.POWER.stroke / 2, l = 1.2;
  s1.pistonList.forEach((pp, i) => {
    const gen = Math.floor(i / 8), on = gen < nOn, th = crank + pp.c * (Math.PI * 2 * 3 / 8) + gen;
    const yc = 8 + 0.4 + 3.4, py = yc + (on ? r * Math.cos(th) + Math.sqrt(l * l - (r * Math.sin(th)) ** 2) : r + l);
    m4.compose(pv.set(pp.x, py, pp.z), q.identity(), sv.set(1, 1, 1)); s1.pistons.setMatrixAt(i, m4);
    const cx = on ? r * Math.sin(th) : 0, cy = yc + (on ? r * Math.cos(th) : r);
    e3.set(0, 0, Math.atan2(-cx, py - cy)); q.setFromEuler(e3); m4.compose(pv.set(pp.x + cx / 2, (py + cy) / 2, pp.z), q, sv.set(1, 1, 1)); s1.rods.setMatrixAt(i, m4);
  });
  s1.pistons.instanceMatrix.needsUpdate = true; s1.rods.instanceMatrix.needsUpdate = true;
  // 2 electrical: cable glow by utilisation (green → amber → red), pulsing with load
  const u = Y.elec.cableUtil; SYSMATS.cab.emissive.setHSL(0.33 - 0.33 * Math.min(1, u), 1, 0.5); SYSMATS.cab.emissiveIntensity = 0.25 + 0.6 * u * (0.75 + 0.25 * Math.sin(performance.now() / 120));
  // 3 drivetrain: exact ratios; stages above the sprocket shown at 1/100 when STROBE is on
  const k3 = ui.strobe ? 0.01 : 1, aS = S.sprocketAngle, aP = aS * 12 * k3 * 10, aB = aS * D.DRIVE.finalRatio * k3, aM = aB * D.DRIVE.stage1;
  for (const T of s3.trains) { T.carrier.rotation.z = -aS; T.rim.rotation.z = -aS; T.sunM.rotation.z = -aB; T.bullM.rotation.z = -aB; T.planets.forEach((p) => (p.rotation.z = aB * 0.6)); T.pinions.forEach((p, i) => (p.rotation.z = i < Y.drive.motorsUp ? aM : p.rotation.z)); }
  for (const T of s3.podTrains) { T.bm.rotation.z = -aB; T.pins.forEach((p) => (p.rotation.z = aM)); }
  // 4 suspension: rod extension, accumulator colour by gas pressure ratio
  s4.stations.forEach((st, i) => {
    const x = S.strut[i], yAx = 1.04 + I.rRoad + x, yTop = 16.4;
    st.rod.forEach((rd) => { rd.position.y = (yAx + yTop) / 2; rd.scale.y = yTop - yAx; });
    const pr = Y.susp.p[i] / D.SUSP.pStatic; st.acc.forEach((a) => (a.scale.y = 1 / Math.max(0.4, pr) ** 0.35));
  });
  SYSMATS.acc.emissiveIntensity = Y.susp.bottom ? 0.9 : 0.3 * Math.max(0, Y.susp.pRatio - 1);
  // 5 slewing: rollers orbit at half the slew angle; pinions at 960/18 × slew
  s5.rows.forEach((im) => { for (let i = 0; i < D.SLEW.N; i++) { const a = i / D.SLEW.N * Math.PI * 2 + S.slew / 2; m4.compose(pv.set(im.userData.rad * Math.cos(a), im.userData.y, im.userData.rad * Math.sin(a)), q.setFromEuler(e3.set(0, -a, 0)), sv.set(1, 1, 1)); im.setMatrixAt(i, m4); } im.instanceMatrix.needsUpdate = true; });
  for (const d of s5.drives) d.pn.rotation.y = -S.slew * D.SLEW.ringT / D.SLEW.pinT;
  // 6 rams: barrel fixed on deck, rod to the boom lug (both live from elevation)
  for (const rm of s6.rams) {
    const a = tmpV.set(66, 9, rm.z).clone(), b = new THREE.Vector3(30, -10, rm.z).applyAxisAngle(new THREE.Vector3(0, 0, 1), S.elev).add(boom.position);
    const dir = b.clone().sub(a), L = dir.length(); dir.normalize(); const qq = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir), Lb = 14;
    rm.barrel.quaternion.copy(qq); rm.barrel.position.copy(a).addScaledVector(dir, Lb / 2); rm.barrel.scale.y = Lb;
    rm.rod.quaternion.copy(qq); rm.rod.position.copy(a).addScaledVector(dir, (Lb * 0.8 + L) / 2); rm.rod.scale.y = Math.max(1, L - Lb * 0.8);
  }
  // 7 hull: thrusters deploy when afloat, propellers turn; ballast level; flood heel
  const dep = S.floating ? 1 : 0; for (const t of s7.thr) { t.th.position.y = I.unitH + (dep ? 0 : 27.5); t.th.visible = true; t.prop.rotation.x += dep ? 0.08 : 0; }
  s7.ballast.forEach((b, i) => { const f = ui.trip.flood && i === 1 ? 1 : 0.35; b.scale.y = 16 * f; b.position.y = 6 + 8 * f; });
  if (ui.trip.flood) rig.rotation.x += -Y.hull.heel;
  // exploded view of the active system
  for (const s of SYS) for (const p of s.parts) if (p.base && p.obj.position) { if (s.n === ui.sys) p.obj.position.copy(p.base).addScaledVector(p.ex, ui.explode * 2.5); else if (p.obj.position.distanceToSquared(p.base) > 1e-6 && !(p.obj.isInstancedMesh)) p.obj.position.copy(p.base); }
  if (GLB.sync) for (const [n, o, sg, off] of GLB.sync) { n.position.copy(o.position); if (off) n.position.sub(off); n.position.z *= sg; n.quaternion.copy(o.quaternion); n.scale.copy(o.scale); }
  if (GLB.acc) { GLB.acc.emissive.setHex(0xff3b1f); GLB.acc.emissiveIntensity = SYSMATS.acc.emissiveIntensity; }
}
function labels() {
  const s = SYS[ui.sys - 1]; const box = $('labels'), lead = $('leads');
  if (!s) { box.innerHTML = ''; lead.innerHTML = ''; return; }
  const sc = Math.min(innerWidth / 1600, innerHeight / 900), pts = [];
  for (const p of s.parts.filter((p) => p.key)) {
    const bb = new THREE.Box3().setFromObject(p.obj); if (bb.isEmpty()) continue; bb.getCenter(tmpV); const v = tmpV.clone().project(cam);
    if (v.z > 1 || Math.abs(v.x) > 1 || Math.abs(v.y) > 1) continue;
    pts.push({p, x: (v.x + 1) / 2 * innerWidth / sc, y: (1 - v.y) / 2 * innerHeight / sc});
  }
  pts.sort((a, b) => a.y - b.y); let lastL = 90, lastR = 90;
  let html = '', svg = '';
  for (const t of pts) { const right = t.x > 760; const lx = right ? Math.min(1120, t.x + 90) : Math.max(360, t.x - 90); let ly = Math.max(t.y, (right ? lastR : lastL) + 22); if (right) lastR = ly; else lastL = ly;
    html += `<div class="lbl" style="left:${right ? lx + 4 : lx - 4}px;top:${ly - 9}px;transform:translateX(${right ? 0 : -100}%)"><span class="chip c${t.p.tag}">${t.p.tag}</span>${t.p.name}</div>`;
    svg += `<line x1="${t.x}" y1="${t.y}" x2="${lx}" y2="${ly}"/><circle cx="${t.x}" cy="${t.y}" r="3"/>`; }
  box.innerHTML = html; lead.innerHTML = svg;
}
function sysPanel() {
  const s = SYS[ui.sys - 1]; if (!s || !sysLive) return; const Y = sysLive; const R = (l, v, c = '') => `<div class="row"><span class="lab">${l}</span><span class="${c}">${v}</span></div>`;
  const rows = {
    1: [['DEMAND', `${fmt(Y.power.Pdem / 1e6, 1)} MW`], ['GENSETS ONLINE', `${Y.power.nOn} of 12${ui.trip.gen ? ' (1 TRIPPED)' : ''}`], ['LOAD / ONLINE CAP', `${fmt(Y.power.loadPct * 100, 0)}%`, Y.power.loadPct > 0.95 ? 'bad' : 'ok'], ['PER GENSET', `${fmt(Y.power.perGen / 1e6, 2)} MW`], ['FUEL (MGO, 177.5 g/kWh)', `${fmt(Y.power.fuelKgH / 1e3, 2)} t/h`], ['FIRING FREQUENCY', `${fmt(Y.power.firingHz, 1)} Hz (514 rpm × 8 cyl / 2)`], ['STATUS', Y.power.shed ? 'LOAD SHED' : 'NORMAL', Y.power.shed ? 'bad' : 'ok']],
    2: [['GENSET FEEDER @11 kV', `${fmt(Y.elec.genI, 0)} A`], ['SLIP RING (HULL LOADS)', `${fmt(Y.elec.slipI, 0)} A @ 11 kV`], ['MOTOR CURRENT @690 V', `${fmt(Y.elec.motorI, 0)} A`], ['CABLE UTILISATION', `${fmt(Y.elec.cableUtil * 100, 0)}% of 4 × 398 A`, Y.elec.cableUtil > 1 ? 'bad' : 'ok'], ['LOSS, 120 m MOTOR RUN', `${fmt(Y.elec.lossW(120) / 1e3, 1)} kW per motor`], ['CABLE RUNS ROUTED', `${SYS[1].cables.length} (${fmt(SYS[1].cables.reduce((a, c) => a + c.userData.len, 0), 0)} m modelled)`]],
    3: [['SPROCKET', `${fmt(Y.drive.sprRpm, 3)} rpm · ${fmt(Y.drive.Tspr / 1e6, 0)} MN·m`], ['BULL GEAR', `${fmt(Y.drive.s1Rpm, 1)} rpm`], ['MOTORS', `${fmt(Y.drive.motRpm, 0)} rpm · ${fmt(Y.drive.Tmot / 1e3, 1)} kN·m each`], ['MOTORS RUNNING / BELT', `${Y.drive.motorsUp} of ${D.DRIVE.motorsMain}`], ['MOTOR LOAD', `${fmt(Y.elec.motorLoad * 100, 0)}%`, Y.drive.overload ? 'bad' : 'ok'], ['PINION MESH', `${fmt(Y.drive.meshHz, 0)} Hz`], ['DISPLAY', ui.strobe ? 'STROBE: fast stages ×1/100' : 'TRUE SPEED (aliases)']],
    4: [['STATIC STRUT PRESSURE', '250 bar'], ['PEAK STRUT PRESSURE', `${fmt(Y.susp.pMax / 1e5, 0)} bar · ${fmt(Y.susp.pRatio, 2)}× static`, Y.susp.pRatio > 2.9 ? 'bad' : 'ok'], ['STATION STIFFNESS', `${fmt(Y.susp.k / 1e6, 1)} MN/m`], ['RIDE FREQUENCY', `${fmt(Y.susp.fn, 2)} Hz`], ['MAX COMPRESSION', `${fmt(S0.maxStrut, 2)} m of ${I.stroke} m`], ['BOTTOMING', Y.susp.bottom ? 'YES' : 'NO', Y.susp.bottom ? 'bad' : 'ok']],
    5: [['AXIAL LOAD (UPPER WORKS)', `${fmt(Y.slew.Fa / 1e6, 0)} MN`], ['OVERTURNING MOMENT', `${fmt(Y.slew.M / 1e9, 2)} GN·m`], ['MAX ROLLER LOAD', `${fmt(Y.slew.Pmax / 1e6, 2)} MN · ${fmt(Y.slew.ratio * 100, 0)}% of C0 (I)`, Y.slew.ratio > 1 ? 'bad' : 'ok'], ['SLEW TORQUE (μ 0.006, I)', `${fmt(Y.slew.Tslew / 1e6, 0)} MN·m`], ['SLEW POWER @0.05°/s', `${fmt(Y.slew.Pw / 1e3, 0)} kW`], ['SLEW ANGLE', `${fmt(S0.slew / deg, 1)}°`]],
    6: [['ELEVATION', `${fmt(S0.elev / deg, 2)}°`], ['BOOM MOMENT AT TRUNNION', `${fmt(Y.gun.Mt / 1e9, 2)} GN·m`], ['RAM PRESSURE', `${fmt(Y.gun.pRam / 1e5, 0)} bar of 350`, Y.gun.ratio > 1 ? 'bad' : 'ok'], ['HPU', `${D.GUN.pumps} × A4VSO 1000 · ${fmt(D.GUN.pumpkW * (D.GUN.pumps - 1) / 1e3, 1)} MW hydraulic`], ['MAX ELEVATION RATE', '0.1°/s (I)'], ['GUN INTERNALS', 'VISUAL ONLY — NO PERFORMANCE DATA']],
    7: [['DRAFT AFLOAT', `${fmt(K.DRAFT, 1)} m`], ['GM / BM', `${fmt(Y.hull.GM, 1)} m / ${fmt(Y.hull.BM, 1)} m`], ['HEEL (FLOOD 1 COMPT)', `${fmt(Y.hull.heel / deg, 2)}°`, ui.trip.flood ? 'bad' : 'ok'], ['BALLAST', `${fmt(Y.hull.ballastH, 2)} h per metre of draft`], ['THRUSTERS', `${D.HULL.thrusters} × 5.5 MW · ${Y.hull.thrusters}`], ['EXTINGUISHERS', `${EXTS.length} placed`]],
  }[s.n];
  $('sysRead').innerHTML = rows.map((r) => R(...r)).join('');
}
let S0 = null;
const opts = () => (ui.mode === 'FIELD' ? {terrain: false, depth: ui.depth, slew: 0, elev: 0.012} : {terrain: ui.terrain, depth: ui.depth});
function follow() {
  rig.updateMatrixWorld(true); if (ui.sys && ui.view === 'SYS' && ui.anchor) { const A = ui.anchor; const w = A.g.localToWorld(A.l.clone()); const d = w.clone().sub(A.w); A.w.copy(w);
    VIEWS.SYS.t = w.toArray(); if (camFrom) camFrom.t = camFrom.t.map((a, i) => a + d.getComponent(i)); ctl.target.add(d); cam.position.add(d); }
}
function renderAt(t) { ui.t = t; const S = K.state(t, opts()); pose(S); follow(); panels(S); sysPanel(); renderer.render(scene, cam); labels(); }
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  if (!ui.paused && !window.__hold) ui.t += dt * ui.rate;
  follow();
  camStep(dt); ctl.update();
  const S = K.state(ui.t, opts()); pose(S); panels(S); sysPanel();
  renderer.render(scene, cam); labels(); requestAnimationFrame(frame);
}
applyMode(); applyDisplay(); cam.position.copy(sph(VIEWS.HERO)); ctl.target.set(...VIEWS.HERO.t); sync();
requestAnimationFrame(frame);
window.__app = {ready: true, ui, view, act, renderAt, VIEWS, settle: () => { if (camTo) { camK = 0.999; camStep(1); } }, K, scene, cam, grass, salt, fig, SYS, selectSys, renderer, EXTS};
