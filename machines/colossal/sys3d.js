// COLOSSAL — 3D build of the 7 internal systems. Every part registered with a tag (S/D/I), a note and a citation key.
// Frames: slew-local (upper deck, origin on the ring top centre, deck floor y = 8) and rig-local (hull, origin stern/ground/centre).
import * as THREE from 'three';
import * as K from './kin.js';
import * as D from './sysdata.js';
const {I, MAIN, POD, ROAD, rS, rP} = K;

const MAT = {};
export function mat(key, color, o = {}) {
  if (!MAT[key]) MAT[key] = new THREE.MeshStandardMaterial({color, roughness: o.r ?? 0.5, metalness: o.m ?? 0.5, emissive: o.e ?? 0x000000, emissiveIntensity: o.ei ?? 1, transparent: !!o.t, opacity: o.op ?? 1, side: o.side ?? THREE.FrontSide});
  return MAT[key];
}
export const SYSMATS = MAT;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const add = (o, parent, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => { o.position.set(x, y, z); o.rotation.set(rx, ry, rz); parent.add(o); return o; };
const box = (w, h, d, m, p, x, y, z) => add(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m), p, x, y, z);
const cylY = (r, len, m, p, x, y, z, seg = 24) => add(new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg), m), p, x, y, z);
const cylX = (r, len, m, p, x, y, z, seg = 24) => add(new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg), m), p, x, y, z, 0, 0, Math.PI / 2);
const cylZ = (r, len, m, p, x, y, z, seg = 24) => add(new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg), m), p, x, y, z, Math.PI / 2, 0, 0);
const sph = (r, m, p, x, y, z) => add(new THREE.Mesh(new THREE.SphereGeometry(r, 28, 18), m), p, x, y, z);
const grp = (p, x = 0, y = 0, z = 0) => add(new THREE.Group(), p, x, y, z);
function tube(pts, r, m, p, seg = 64) {
  const c = new THREE.CatmullRomCurve3(pts.map((q) => V(...q)), false, 'catmullrom', 0.05);
  const me = new THREE.Mesh(new THREE.TubeGeometry(c, seg, r, 8, false), m); me.userData.len = c.getLength(); p.add(me); return me;
}
/** spur gear about the local Z axis: hub disc + instanced-free merged teeth */
function gearGeo(r, w, teeth, th = null) {
  const t = th ?? Math.max(0.05, 2.2 * Math.PI * r / teeth / 2.4);
  const g = [new THREE.CylinderGeometry(r - t * 0.6, r - t * 0.6, w, Math.max(24, teeth)).rotateX(Math.PI / 2)];
  for (let i = 0; i < teeth; i++) { const a = (i / teeth) * Math.PI * 2; const b = new THREE.BoxGeometry(t * 1.1, Math.PI * r / teeth, w); b.translate(r - t * 0.1, 0, 0); b.rotateZ(a); g.push(b); }
  return mergeAll(g);
}
function mergeAll(list) {
  let n = 0; for (const g of list) n += (g.index ? g.index.count : g.attributes.position.count);
  const pos = [], nor = [];
  for (const g0 of list) { const g = g0.index ? g0.toNonIndexed() : g0; pos.push(...g.attributes.position.array); nor.push(...g.attributes.normal.array); }
  const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); return out;
}
function inst(geo, m, mats, p) { const im = new THREE.InstancedMesh(geo, m, mats.length); mats.forEach((x, i) => im.setMatrixAt(i, x)); im.instanceMatrix.needsUpdate = true; p.add(im); return im; }
const m4 = (x, y, z, rx = 0, ry = 0, rz = 0, s = 1) => new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), V(s, s, s));

// fire extinguisher (9 kg class B:C), merged: red body, black valve, hose, wall bracket
const EXT = mergeAll([new THREE.CylinderGeometry(0.09, 0.09, 0.52, 12).translate(0, 0.36, 0), new THREE.CylinderGeometry(0.05, 0.05, 0.1, 8).translate(0, 0.67, 0), new THREE.BoxGeometry(0.14, 0.03, 0.03).translate(0.06, 0.7, 0), new THREE.BoxGeometry(0.03, 0.4, 0.03).translate(0.1, 0.45, 0), new THREE.BoxGeometry(0.22, 0.06, 0.05).translate(0, 0.25, -0.1)]);
export const EXTS = [];   // {parent, x, y, z, where}

export function buildSystems(ctx) {
  const {rig, slew, boom} = ctx;
  const SYS = [];
  const sys = (n, key, title, frame) => { const s = {n, key, title, parts: [], groups: [], frame, ext0: EXTS.length}; SYS.push(s); return s; };
  const part = (s, id, name, tag, note, cite, obj, ex = [0, 0, 0], key = false) => { obj.userData.part = id; s.parts.push({id, name, tag, note, cite, obj, ex: V(...ex), base: obj.position.clone(), key}); return obj; };
  const ext = (parent, x, y, z, where) => EXTS.push({parent, x, y, z, where});

  // ================================================================ 1 POWER PLANT (upper deck, rear block)
  const S1 = sys(1, 'power', 'Power plant · 12 × 8 MW dual-fuel gensets', {focus: ['block', 'alt', 'turbo', 'cac', 'exh'], k: 3.2, pull: {ids: ['block', 'alt', 'turbo', 'cac', 'exh', 'heads', 'rocker', 'fpump', 'doors', 'mounts', 'pistons', 'gvu'], count: {heads: 8, rocker: 8, fpump: 8, doors: 16, mounts: 8, pistons: 8}, hide: ['crane', 'fans', 'lights', 'cable_tray'], k: 1.9}, in: 'slew', t: [-118, 11, 0], az: -32, el: 30, r: 125});
  const P = grp(slew); S1.groups.push(P);
  const E = D.POWER, mBlock = mat('eng', 0x46505a, {m: 0.6, r: 0.45}), mHead = mat('head', 0x7f8a94, {m: 0.7, r: 0.35, e: 0xff5a1f, ei: 0}), mAlt = mat('alt', 0x2f5d8a, {m: 0.5, r: 0.4}), mBase = mat('base', 0x2b2d30, {m: 0.6}), mPipe = mat('exh', 0x9b8f7e, {m: 0.8, r: 0.3}), mTank = mat('tank', 0xc9b25a, {m: 0.3, r: 0.6}), mWhite = mat('white', 0xe9e8e3, {m: 0.2, r: 0.5}), mCO2 = mat('co2', 0xb22222, {m: 0.4, r: 0.4});
  const ROOMS = [];
  const DET = {rocker: [], pump: [], door: [], hp: [], mount: []};
  for (const [rx, rz] of [[-133, 16], [-133, -16], [-99, 16], [-99, -16]]) ROOMS.push({x: rx, z: rz});
  const engines = [];
  const headGeo = new THREE.BoxGeometry(0.95, 1.1, 1.3), pistGeo = new THREE.CylinderGeometry(E.bore / 2 * 0.98, E.bore / 2 * 0.98, 0.7, 16), rodGeo = new THREE.BoxGeometry(0.16, 1.2, 0.2);
  const heads = [], pistons = [], rods = [];
  ROOMS.forEach((R, ri) => {
    const room = grp(P, R.x, 8, R.z); (S1.rooms ??= []).push({g: room, s: Math.sign(R.z)});
    box(30, 0.4, 26, mBase, room, 0, 0.2, 0);                                           // engine room floor plate
    const fr = part(S1, `room${ri}`, `Engine room ${ri + 1} (3 gensets)`, 'S', 'Sleipnir groups its 12 engines three per room in four engine rooms', 'khlRooms', box(30, 12, 0.3, mat('bulk', 0x6b6f73, {m: 0.3, t: true, op: 0.35}), room, 0, 6, 13 * Math.sign(R.z)), [0, 0, 0]);
    for (let k = 0; k < 3; k++) {
      const gz = (k - 1) * 7.5, gs = grp(room, 0, 0.4, gz); engines.push(gs); (S1.gensets ??= []).push(gs);
      const L = E.L, Lg = L + E.alt.L + 1;
      box(Lg, 0.9, 3.6, mBase, gs, 0, 0.45, 0);                                          // common base frame
      const blk = box(L, 4.2, E.Wd, mBlock, gs, -Lg / 2 + L / 2, 3.0, 0);                // crankcase + block
      for (let c = 0; c < E.cyl; c++) { const x = -Lg / 2 + 0.9 + c * (L - 1.8) / (E.cyl - 1); heads.push(m4(R.x + x, 8 + 0.4 + 5.7, R.z + gz)); pistons.push({x: R.x + x, z: R.z + gz, c});
        DET.rocker.push(m4(R.x + x, 8 + 0.4 + 6.5, R.z + gz)); DET.pump.push(m4(R.x + x, 8 + 0.4 + 3.6, R.z + gz - E.Wd / 2 - 0.35));
        DET.door.push(m4(R.x + x, 8 + 0.4 + 2.2, R.z + gz + E.Wd / 2 + 0.03)); DET.door.push(m4(R.x + x, 8 + 0.4 + 2.2, R.z + gz - E.Wd / 2 - 0.03));
        DET.hp.push(m4(R.x + x, 8 + 0.4 + 5.0, R.z + gz - E.Wd / 2 - 0.2, 0.5, 0, 0)); }
      for (const mx of [-Lg / 2 + 1, -Lg / 2 + L / 2, -Lg / 2 + L - 1, Lg / 2 - 2]) for (const mz of [-1.6, 1.6]) DET.mount.push(m4(R.x + mx, 8 + 0.4 + 0.05, R.z + gz + mz));
      box(L - 0.6, 0.9, E.Wd - 0.4, mBase, gs, -Lg / 2 + L / 2, 1.35, 0);                    // oil sump
      box(1.0, 1.0, 0.9, mat('tbox', 0x2a2d31), gs, Lg / 2 - E.alt.L / 2, 4.6, 0);              // alternator terminal box
      cylX(0.25, 2.2, mBase, gs, -Lg / 2 + L / 2, 4.9, -E.Wd / 2 - 0.15, 10);                   // fuel rail
      const tc = cylX(0.95, 2.2, mat('turbo', 0x8d939a, {m: 0.85, r: 0.25}), gs, -Lg / 2 - 0.6, 5.6, 0, 28);      // turbocharger at free end
      const cac = box(1.4, 2.0, 2.6, mBlock, gs, -Lg / 2 + 0.8, 4.0, 0);                // charge air cooler
      const exh = cylX(0.42, L - 0.8, mPipe, gs, -Lg / 2 + L / 2, 6.6, 0.9, 16);          // exhaust manifold
      const alt = cylX(E.alt.D / 2, E.alt.L, mAlt, gs, Lg / 2 - E.alt.L / 2, 2.6, 0, 40); // 8 MW alternator
      for (let f = 0; f < 18; f++) cylX(E.alt.D / 2 + 0.06, 0.08, mBase, gs, Lg / 2 - E.alt.L + 0.25 * f + 0.2, 2.6, 0, 40);
      cylX(1.5, 0.5, mBase, gs, -Lg / 2 + L + 0.3, 2.6, 0, 32);                          // flywheel + flexible coupling
      if (ri === 0 && k === 0) {
        part(S1, 'block', 'Engine block, MAN 8L51/60DF (8 cyl, 510/600 mm)', 'S', `8 × 1,000 kW at 514 rpm; block ${L.toFixed(2)} m long, ${E.mass.toFixed(0)} t dry (8L interpolated from 6L–9L data)`, 'manDF', blk, [0, 0, -6], true);
        part(S1, 'turbo', 'Turbocharger (free end)', 'I', 'Position from the product-guide note: turbocharger at free end; size invented', 'manDF', tc, [-6, 0, 0]);
        part(S1, 'cac', 'Charge-air cooler', 'I', 'Envelope invented', null, cac, [-4, 2, 0]);
        part(S1, 'exh', 'Exhaust manifold', 'I', 'Runs the cylinder row to the turbine', null, exh, [0, 4, 0]);
        part(S1, 'alt', 'Alternator, 8 MW', 'S', 'GE supplied the 12 × 8 MW generators on Sleipnir; envelope Ø3.4 × 4.6 m, 48 t invented', 'sleipnirGE', alt, [6, 0, 0], true);
      }
    }
    // per-room auxiliaries
    const day = box(6, 4, 3, mTank, room, 12, 2.4, -9 * Math.sign(R.z));
    const gvu = box(3, 2.4, 2.2, mWhite, room, -13, 1.6, 9 * Math.sign(R.z));
    const sep = cylY(0.7, 2.2, mat('sep', 0x8c8f60, {m: 0.4}), room, 12, 1.5, 9 * Math.sign(R.z));
    const co2 = inst(mergeAll([new THREE.CylinderGeometry(0.13, 0.13, 1.5, 10).translate(0, 0.75, 0), new THREE.CylinderGeometry(0.05, 0.05, 0.15, 6).translate(0, 1.55, 0)]), mCO2,
      Array.from({length: 48}, (_, i) => m4(-14 + (i % 12) * 0.32, 0.4, -11 * Math.sign(R.z) + Math.floor(i / 12) * 0.32 * Math.sign(R.z))), room);
    const crane = box(30, 0.6, 0.6, mat('craneY', 0xd9b51e, {m: 0.4}), room, 0, 11.4, 0);
    const fans = [-10, 10].map((x) => cylY(1.1, 1.8, mat('fan', 0x5a6168), room, x, 11, 11 * Math.sign(R.z), 20));
    if (ri === 0) {
      part(S1, 'day', 'Fuel day tank (MGO)', 'I', 'Dual-fuel engines run on MGO or LNG (Sleipnir); capacity invented', 'sleipnirWiki', day, [6, 0, 0]);
      part(S1, 'gvu', 'Gas valve unit (LNG)', 'I', 'One per engine room; envelope invented', null, gvu, [-5, 0, 0]);
      part(S1, 'sep', 'Lube oil separator', 'I', null, null, sep, [6, 0, 0]);
      part(S1, 'co2', 'CO₂ fixed suppression bank (48 bottles)', 'I', 'Per engine room; bottle count invented', null, co2, [-6, 0, 0], true);
      part(S1, 'crane', 'Engine room overhead crane rail', 'I', 'For piston and head overhauls', null, crane, [0, 4, 0]);
      part(S1, 'fans', 'Engine room supply fans', 'I', null, null, fans[0], [0, 3, 0]);
    }
    // portable extinguishers around the room at ≤ 15.25 m walking distance (46 CFR 34.50-10)
    for (let s = 0; s < 4; s++) for (const sx of [-14, -4, 6, 14]) ext(room, sx, 0.4, (s % 2 ? 12.4 : -12.4), 'engine room');
  });
  S1.heads = inst(headGeo, mHead, heads, P);
  const rock = inst(new THREE.BoxGeometry(0.8, 0.5, 1.1), mat('rock', 0x9aa3ab, {m: 0.8, r: 0.3}), DET.rocker, P);
  const fpump = inst(mergeAll([new THREE.BoxGeometry(0.5, 0.9, 0.5), new THREE.CylinderGeometry(0.05, 0.05, 1.4, 6).translate(0, 1.1, 0)]), mat('fp', 0x6c757d, {m: 0.8}), DET.pump, P);
  const doors = inst(mergeAll([new THREE.BoxGeometry(0.85, 1.1, 0.06), new THREE.CylinderGeometry(0.06, 0.06, 0.1, 8).rotateX(Math.PI / 2).translate(0, 0, 0.06)]), mat('door', 0x58616a, {m: 0.6}), DET.door, P);
  const hp = inst(new THREE.CylinderGeometry(0.035, 0.035, 1.3, 6), mat('hpline', 0xc9ced3, {m: 1, r: 0.2}), DET.hp, P); S1.hp = hp;
  const mounts = inst(new THREE.CylinderGeometry(0.22, 0.26, 0.3, 12), mat('mount', 0x141414, {m: 0.1, r: 0.9}), DET.mount, P); part(S1, 'heads', 'Cylinder heads, 96 (glow = engine online)', 'S', '12 engines × 8 cylinders', 'manDF', S1.heads, [0, 3, 0], true);
  S1.pistons = new THREE.InstancedMesh(pistGeo, mat('pist', 0xb8bcc0, {m: 0.9, r: 0.2}), pistons.length); P.add(S1.pistons);
  S1.rods = new THREE.InstancedMesh(rodGeo, mat('rod', 0x8a8f95, {m: 0.9, r: 0.3}), pistons.length); P.add(S1.rods); S1.pistonList = pistons;
  part(S1, 'rocker', 'Rocker covers, 96', 'I', null, null, rock, [0, 2, 0]);
  part(S1, 'fpump', 'Fuel injection pumps + HP lines, 96', 'I', 'Common-rail on the 51/60DF per MAN; layout invented', 'manDF', fpump, [0, 0, -2]);
  part(S1, 'doors', 'Crankcase doors with relief valves, 192', 'I', null, null, doors, [0, 0, 2]);
  part(S1, 'mounts', 'Resilient genset mounts, 96', 'I', null, null, mounts, [0, -1, 0]);
  part(S1, 'pistons', 'Pistons + connecting rods (slider-crank, live)', 'D', 'Bore 510 mm, stroke 600 mm from the 51/60 designation; conrod 1.2 m invented; firing order invented', 'manDF', S1.pistons, [0, 0, 0], true);
  // exhaust uptakes + funnels on the roof
  ROOMS.forEach((R, ri) => {
    for (let k = 0; k < 3; k++) tube([[R.x - 9, 16, R.z + (k - 1) * 7.5], [R.x - 9, 30, R.z + (k - 1) * 4], [R.x - 9, 50, R.z + (k - 1) * 2.2]], 0.55, mPipe, P, 24);
    const fun = box(8, 14, 9, mat('funnel', 0x1e2023, {m: 0.3}), P, R.x - 9, 57, R.z);
    box(8.2, 1.2, 9.2, mWhite, P, R.x - 9, 61.5, R.z);
    for (let k = 0; k < 3; k++) cylY(0.6, 3, mPipe, P, R.x - 9, 65.5, R.z + (k - 1) * 2.2, 16);
    if (ri === 0) { part(S1, 'uptake', 'Exhaust uptakes (3 per room)', 'I', 'Routing invented', null, P.children.at(-6), [0, 0, 0]); part(S1, 'funnel', 'Funnel casing with silencers', 'I', null, null, fun, [0, 8, 0], true); }
  });
  // LNG: two white spheres on the aft roof, coolers
  const lng = [16, -16].map((z) => { const s = sph(7, mWhite, P, -138, 58, z); for (let a = 0; a < 4; a++) box(0.8, 6, 0.8, mBase, P, -138 + 5 * Math.cos(a * 1.57), 53, z + 5 * Math.sin(a * 1.57)); return s; });
  part(S1, 'lng', 'LNG fuel tanks, 2 × Ø14 m spheres', 'I', 'Sleipnir is dual-fuel MGO/LNG; tank form and size invented', 'sleipnirWiki', lng[0], [0, 8, 0], true);
  const cool = box(20, 2, 10, mat('cool', 0x5d666e, {m: 0.6}), P, -75, 51, 18);
  for (let i = 0; i < 6; i++) cylY(1.2, 0.6, mBase, P, -82 + i * 2.8, 52.3, 18, 16);
  part(S1, 'cool', 'HT/LT central coolers + fans', 'I', null, null, cool, [0, 6, 0]);
  S1.engineGroups = engines;

  // ================================================================ 2 ELECTRICAL (switchboards, transformers, slip ring, cable trays, routed cables, drives)
  const S2 = sys(2, 'elec', 'Electrical · 11 kV ring, slip ring, 690 V drives, routed cables', {focus: ['swb', 'tx', 'slipring', 'brushes'], k: 0.55, pull: {ids: ['slipring', 'brushes', 'swivel', 'swb', 'tx', 'drives'], all: true, k: 0.62}, in: 'slew', t: [-95, 14, 0], az: -38, el: 40, r: 125});
  const EG = grp(slew), EH = grp(rig); S2.groups.push(EG, EH);
  const mSwb = mat('swb', 0xc7ccd1, {m: 0.3, r: 0.5}), mSwbD = mat('swbD', 0x8e959c, {m: 0.3}), mTx = mat('tx', 0x4c6b55, {m: 0.3, r: 0.6}), mCab = mat('cab', 0x1d1f22, {m: 0.1, r: 0.6, e: 0x22ff66, ei: 0}), mTray = mat('tray', 0x9a9ea3, {m: 0.6}), mCu = mat('cu', 0xb87333, {m: 1, r: 0.25}), mDrive = mat('drv', 0x3d4f73, {m: 0.3});
  const cubGeo = mergeAll([new THREE.BoxGeometry(1, 2.4, 1.8).translate(0, 1.2, 0), new THREE.BoxGeometry(0.8, 0.9, 0.04).translate(0, 1.7, 0.92), new THREE.BoxGeometry(0.1, 0.1, 0.05).translate(0.3, 1.2, 0.93)]);
  const swbs = [];
  ROOMS.forEach((R, ri) => {
    const mats = Array.from({length: 14}, (_, i) => m4(R.x - 7 + i * 1.02, 8 + 13.2, R.z + 6 * Math.sign(R.z)));
    const sw = inst(cubGeo, mSwb, mats, EG); swbs.push(sw);
    ext(slew, R.x - 9, 8 + 13.2, R.z + 4.5 * Math.sign(R.z), 'switchboard');   // 40-B:C immediately available at main switchboard
    if (ri === 0) part(S2, 'swb', 'MV switchboard line-ups, 4 × 14 cubicles', 'S', 'GE supplied medium-voltage switchboards; 11 kV and cubicle count invented', 'sleipnirGE', sw, [0, 3, 0], true);
  });
  const busTie = box(18, 0.6, 0.6, mCu, EG, -116, 22.2, 16); part(S2, 'bustie', 'Bus-tie (ring bus between rooms)', 'I', 'Open bus-tie splits the plant into halves', null, busTie, [0, 2, 0]);
  const txs = [];
  for (let i = 0; i < 6; i++) { const t = grp(EG, -78 + (i % 3) * 6, 9, (i < 3 ? 10 : -10)); box(3.4, 3.2, 2.2, mTx, t, 0, 1.6, 0); for (let f = 0; f < 10; f++) box(0.08, 2.6, 2.8, mTx, t, -1.5 + f * 0.33, 1.6, 0); cylY(0.18, 0.8, mWhite, t, -0.8, 3.6, 0, 8); cylY(0.18, 0.8, mWhite, t, 0, 3.6, 0, 8); cylY(0.18, 0.8, mWhite, t, 0.8, 3.6, 0, 8); txs.push(t); }
  S2.txs = txs; S2.swbs = swbs;
  part(S2, 'tx', 'Transformers 11 kV / 690 V, 6 (fin-cooled)', 'S', 'GE supplied transformers; rating split invented', 'sleipnirGE', txs[0], [0, 4, 0], true);
  // slip ring collector at the slew axis (rotating brushes on slew, rings on hull)
  const slipR = grp(rig, I.upX, I.ringY, 0), slipS = grp(slew, 0, 0, 0); S2.groups.push(slipR, slipS); S2.slipR = slipR; S2.slipS = slipS;
  const rings = []; for (let i = 0; i < 12; i++) rings.push(cylY(2.0, 0.28, mCu, slipR, 0, 0.6 + i * 0.6, 0, 48));
  cylY(1.6, 8.2, mat('ins', 0x3a3328, {m: 0.1}), slipR, 0, 4, 0, 24);
  const brushes = inst(new THREE.BoxGeometry(0.5, 0.18, 0.3), mat('brush', 0x222222, {m: 0.2}), Array.from({length: 48}, (_, i) => m4(2.25 * Math.cos(i * 0.5236), 0.6 + Math.floor(i / 4) * 0.6, 2.25 * Math.sin(i * 0.5236))), slipS);
  const swivel = cylY(1.0, 4, mat('swiv', 0x7d1f1f, {m: 0.6}), slipR, 0, -2.5, 0, 24);
  part(S2, 'slipring', 'HV slip ring, 12 rings (4 circuits × 3 phases)', 'I', 'Power plant rides the slewing deck; every hull load crosses these rings', null, rings[5], [0, 0, 0], true);
  part(S2, 'brushes', 'Brush gear, 48 carbon brushes (rotates with deck)', 'I', null, null, brushes, [0, 0, 0]);
  part(S2, 'swivel', 'Hydraulic swivel (below the slip ring)', 'I', 'Passes HPU oil to the hull', null, swivel, [0, -4, 0]);
  // cable trays + routed cables: alternators → switchboards → slip ring (deck side); slip ring → hull tray → drive rooms → motor banks
  const cables = [];
  ROOMS.forEach((R) => { for (let k = 0; k < 3; k++) cables.push(tube([[R.x + 6, 11.5, R.z + (k - 1) * 7.5], [R.x + 6, 20, R.z + (k - 1) * 4], [R.x, 22, R.z + 6 * Math.sign(R.z)]], 0.14, mCab, EG, 20)); });
  for (const z of [3, -3]) cables.push(tube([[-120, 24, 6 * Math.sign(z)], [-60, 24, z], [-10, 24, z * 0.6], [0, 14, 0.6 * z], [0, 7.2, 0.4 * z]], 0.22, mCab, EG, 60));
  box(120, 0.12, 1.2, mTray, EG, -60, 23.6, 0).name = 'tray';
  const DRV = [[MAIN.xa + 6, 1], [MAIN.xa + 6, -1], [I.podX0 + 20, 1], [I.podX0 + 20, -1]];
  const drives = [];
  DRV.forEach(([x, s], i) => {
    const dr = grp(EH, x, I.unitH + 0.5, s * 30);
    for (let c = 0; c < 10; c++) { box(1.2, 2.3, 1.0, mDrive, dr, -6 + c * 1.3, 1.15, 0); box(1.0, 0.8, 0.05, mSwbD, dr, -6 + c * 1.3, 1.6, 0.52); }
    drives.push(dr);
    cables.push(tube([[I.upX, I.ringY - 1, 0], [I.upX, I.unitH + 9, 0], [(I.upX + x) / 2, I.unitH + 9, s * 10], [x, I.unitH + 9, s * 24], [x, I.unitH + 3, s * 30]], 0.2, mCab, EH, 40));
    // riser down into the track unit to the motor bank on each belt
    for (const bz of (i < 2 ? [I.laneZ + I.beltW / 2, I.laneZ - I.beltW / 2] : [I.podZ])) cables.push(tube([[x, I.unitH + 0.5, s * 30], [x, I.unitH - 2, s * bz], [i < 2 ? MAIN.xa + 3 : I.podX0 + I.podLen / 2, (i < 2 ? MAIN.yb + MAIN.Ly / 2 : POD.yb + POD.Ly / 2) + 5, s * bz]], 0.16, mCab, EH, 30));
    ext(EH, x - 7, I.unitH + 0.5, s * 31.5, 'drive room');
  });
  box(200, 0.12, 1.4, mTray, EH, 110, I.unitH + 8.6, 0).name = 'tray'; S2.drv = drives; S2.EG = EG;
  part(S2, 'drives', 'MV7000 drive line-ups, 4 rooms × 10 cabinets', 'S', 'GE MV7000 drives on Sleipnir; placement in the hull is invented', 'sleipnirGE', drives[0], [0, 4, 0], true);
  part(S2, 'cables', `Routed power cables (${cables.length} runs, glow = load)`, 'D', `Motor feeders: ${D.ELEC.cablesPerMotor} × 3×240 mm² per 1.5 MW motor (398 A each at 45 °C); MV runs share the colour code`, 'cable240', cables[cables.length - 1], [0, 0, 0], true);
  part(S2, 'trays', 'Cable ladder trays (deck + hull spine)', 'I', null, null, EH.children.at(-1), [0, 2, 0]);
  const emg = box(6, 3, 3, mat('emg', 0xd8d0b4, {m: 0.3}), EG, -30, 51.5, -22); part(S2, 'emg', 'Emergency generator (roof, above the waterline)', 'I', null, null, emg, [0, 4, 0]);
  const ups = inst(new THREE.BoxGeometry(0.6, 1.6, 0.8), mat('bat', 0x2c4a2c, {m: 0.2}), Array.from({length: 40}, (_, i) => m4(-50 + (i % 10) * 0.7, 9.8, -20 + Math.floor(i / 10) * 1.0)), EG);
  part(S2, 'ups', 'UPS battery room (40 strings)', 'I', null, null, ups, [0, 3, 0]);
  S2.cables = cables;

  // ================================================================ 3 TRACTION DRIVETRAIN (inside each main sprocket; pods smaller)
  const S3 = sys(3, 'drive', 'Traction drivetrain · 10 motors → bull gear → 168:1 → sprocket', {focus: ['ringgear', 'bull', 'sprocket'], k: 1.2, in: 'rig', t: [MAIN.xa, MAIN.yb + MAIN.Ly / 2, I.laneZ + 6.5], az: -118, el: 14, r: 46});
  const DG = grp(rig); S3.groups.push(DG);
  const mMot = mat('mot', 0x2f4f7f, {m: 0.5, r: 0.4}), mGear = mat('gear', 0xa7abb0, {m: 0.95, r: 0.22}), mCar = mat('car', 0x5b6168, {m: 0.6}), mBrk = mat('brk', 0xb03a2e, {m: 0.4});
  const bull = gearGeo(6, 1.2, 160), pin = gearGeo(6 / D.DRIVE.stage1, 1.3, D.DRIVE.pinionT), sun = gearGeo(1.6, 2.2, 20), plan = gearGeo(2.6, 2.2, 32), ringG = gearGeo(7.0, 2.4, 84);
  S3.trains = [];
  const beltZs = [I.laneZ + I.beltW / 2, I.laneZ - I.beltW / 2, -I.laneZ + I.beltW / 2, -I.laneZ - I.beltW / 2];
  beltZs.forEach((bz, bi) => {
    const T = grp(DG, MAIN.xa, MAIN.yb + MAIN.Ly / 2, bz); const sg = Math.sign(bz);
    const ring = add(new THREE.Mesh(ringG, mCar), T, 0, 0, 0);
    const carrier = grp(T); const planets = [];
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; planets.push(add(new THREE.Mesh(plan, mGear), carrier, 4.3 * Math.cos(a), 4.3 * Math.sin(a), 0)); }
    add(new THREE.Mesh(new THREE.TorusGeometry(5.0, 0.35, 8, 48), mCar), carrier, 0, 0, 1.6);
    for (let k = 0; k < 4; k++) { const sp = box(10, 0.7, 0.5, mCar, carrier, 0, 0, 1.6); sp.rotation.z = k * Math.PI / 4 + Math.PI / 8; }
    const rim = grp(T); const tg = mergeAll(Array.from({length: I.teeth}, (_, i) => { const a = i / I.teeth * Math.PI * 2; const g0 = new THREE.BoxGeometry(1.4, 1.1, 1.0); g0.translate(rS - 0.4, 0, 0); g0.rotateZ(a); return g0; }));
    for (const dz of [-6, 6]) { add(new THREE.Mesh(new THREE.TorusGeometry(rS - 1.0, 0.55, 8, 72), mGear), rim, 0, 0, dz); add(new THREE.Mesh(tg, mGear), rim, 0, 0, dz); }
    T.userData.rim = rim;
    inst(new THREE.CylinderGeometry(0.12, 0.12, 0.5, 6).rotateX(Math.PI / 2), mat('hb', 0x222222, {m: 0.8}), Array.from({length: 36}, (_, i) => m4(7.6 * Math.cos(i / 36 * Math.PI * 2), 7.6 * Math.sin(i / 36 * Math.PI * 2), 1.3)), T);
    const sunM = add(new THREE.Mesh(sun, mGear), T, 0, 0, 0);
    const bullM = add(new THREE.Mesh(bull, mGear), T, 0, 0, -sg * 2.6);
    const motors = [], pinions = [];
    for (let k = 0; k < D.DRIVE.motorsMain; k++) {
      const a = (k / D.DRIVE.motorsMain) * Math.PI * 2, rr = 6 + 6 / D.DRIVE.stage1;
      const mo = grp(T, rr * Math.cos(a), rr * Math.sin(a), -sg * 4.6);
      cylZ(0.65, 2.6, mMot, mo, 0, 0, 0, 24); for (let f = 0; f < 8; f++) cylZ(0.7, 0.06, mCar, mo, 0, 0, -1.1 + f * 0.3, 24);
      box(0.5, 0.4, 0.6, mCar, mo, 0, 0.75, 0.4);                                            // terminal box
      cylZ(0.72, 0.7, mat('cowl', 0x24364f, {m: 0.4}), mo, 0, 0, -sg * 1.6, 24);               // fan cowl
      tube([[0, 0.9, 0.4], [0, 1.6, 0.8], [0, 2.4, 1.6]], 0.08, mat('cab', 0x1d1f22), mo, 8);   // motor feeder
      cylZ(0.5, 0.12, mBrk, mo, 0, 0, sg * 1.45, 24);                                         // spring-applied disc brake
      box(0.25, 0.4, 0.3, mBrk, mo, 0.45, 0, sg * 1.45);
      motors.push(mo); pinions.push(add(new THREE.Mesh(pin, mGear), T, rr * Math.cos(a), rr * Math.sin(a), -sg * 2.6));
    }
    const lube = box(1.6, 1.2, 1.2, mat('lube', 0x6a5a2a, {m: 0.3}), T, 0, -9.5, 0);
    S3.trains.push({ring, carrier, planets, sunM, bullM, pinions, motors, rim: T.userData.rim});
    if (bi === 0) {
      part(S3, 'motors', `Traction motors, ${D.DRIVE.motorsMain} × 1.5 MW, 690 V, 1,190 rpm per belt`, 'I', `Motor count and rating invented; sized so 4 main belts carry ${(D.DRIVE.motorsMain * 1.5 * 4)} MW against ~50 MW land drive`, null, motors[0], [0, 0, -sg * 5], true);
      part(S3, 'brakes', 'Spring-applied disc brakes (fail-safe)', 'I', null, null, motors[0].children[10], [0, 0, -sg * 2]);
      part(S3, 'pinion', `Motor pinions, ${D.DRIVE.pinionT} T`, 'D', `Stage 1 ratio 1:${D.DRIVE.stage1.toFixed(2)} = bull radius / pinion radius`, null, pinions[0], [0, 0, -sg * 3]);
      part(S3, 'bull', 'Combining bull gear Ø12 m, 160 T', 'D', 'Collects 10 motors; ratio derived from motor rpm ÷ (crawler 168:1 × sprocket rpm)', 'ct', bullM, [0, 0, -sg * 3], true);
      part(S3, 'sun', 'Planetary sun', 'I', 'Planetary stages make up the 168:1 final drive (crawler ratio, sourced); split invented', 'ct', sunM, [0, 0, sg * 2]);
      part(S3, 'planets', 'Planet gears, 4', 'I', null, null, planets[0], [0, 0, sg * 3]);
      part(S3, 'ringgear', 'Planetary ring gear Ø14 m, 84 T', 'I', null, null, ring, [0, 0, sg * 4], true);
      part(S3, 'carrier', 'Planet carrier → sprocket hub', 'I', null, null, carrier, [0, 0, sg * 6]);
      part(S3, 'lube', 'Gearbox lube pump + cooler', 'I', null, null, lube, [0, -4, 0]);
      part(S3, 'sprocket', `Drive sprocket, ${I.teeth} T, pitch radius ${rS.toFixed(2)} m`, 'D', 'p / (2 sin(π/29)) with the 2.60 m shoe pitch', null, T.userData.rim, [0, 0, 0], true);
      part(S3, 'cowl', 'Motor cooling-fan cowls', 'I', null, null, motors[0].children.at(-2), [0, 0, -sg * 2]);
    }
    ext(T, 0, -11.5, 0, 'drivetrain');
  });
  // pods: 4 motors each, smaller train
  S3.podTrains = [];
  for (const s of [1, -1]) {
    const T = grp(DG, POD.xa, POD.yb + POD.Ly / 2, s * I.podZ);
    const bm = add(new THREE.Mesh(gearGeo(4, 1, 110), mGear), T, 0, 0, 0); const pins = [];
    for (let k = 0; k < D.DRIVE.motorsPod; k++) { const a = k * Math.PI / 2 + 0.785, rr = 4.3; const mo = grp(T, rr * Math.cos(a), rr * Math.sin(a), s * 2.2); cylZ(0.6, 2.4, mMot, mo, 0, 0, 0); pins.push(add(new THREE.Mesh(pin, mGear), T, rr * Math.cos(a), rr * Math.sin(a), 0)); }
    S3.podTrains.push({bm, pins});
  }
  part(S3, 'podtrain', 'Pod drives, 4 × 1.5 MW per pod', 'I', null, null, S3.podTrains[0].bm, [0, 0, 3]);

  // ================================================================ 4 RUNNING GEAR & SUSPENSION
  const S4 = sys(4, 'susp', 'Running gear & hydropneumatic suspension · 20 stations', {focus: ['cyl', 'acc', 'manifold', 'bearing'], k: 1.9, pull: {ids: ['cyl', 'manifold', 'hose', 'bearing', 'axle'], frameNames: ['trackrun'], k: 1.05}, in: 'rig', t: [ROAD[4], 12, I.laneZ], az: -60, el: 22, r: 78});
  const SG = grp(rig); S4.groups.push(SG);
  const mCylB = mat('cylB', 0x5c6670, {m: 0.7, r: 0.35}), mRod = mat('rodC', 0xdfe3e6, {m: 1, r: 0.12}), mAcc = mat('acc', 0xd8d4c8, {m: 0.4, r: 0.4, e: 0xff3b1f, ei: 0}), mHose = mat('hose', 0x111111, {m: 0.1, r: 0.8});
  S4.stations = [];
  const bore = D.SUSP.bore, accH = D.SUSP.V0 / 2 / (Math.PI * 0.75 ** 2);
  [I.laneZ, -I.laneZ].forEach((zs, si) => ROAD.forEach((x, ri) => {
    const st = {cyl: [], rod: [], acc: []};
    for (const dz of [I.beltW / 2, -I.beltW / 2]) for (const dx of [-1.3, 1.3]) {
      st.cyl.push(cylY(bore / 2 + 0.05, 5.2, mCylB, SG, x + dx, 19, zs + dz, 20));
      st.rod.push(cylY(bore / 2 * 0.62, 1, mRod, SG, x + dx, 10, zs + dz, 16));
    }
    for (const dz of [I.beltW / 2, -I.beltW / 2]) for (const dx of [-1.3, 1.3]) { cylY(bore / 2 + 0.2, 0.4, mCylB, SG, x + dx, 21.7, zs + dz, 20); cylZ(0.3, 0.9, mCylB, SG, x + dx, 22.1, zs + dz, 12); }
    for (const dz of [I.beltW / 2, -I.beltW / 2]) { const arm = box(6.5, 0.9, 0.8, mCylB, SG, x - 2.2, 1.04 + I.rRoad + 1.2, zs + dz * 1.12); arm.rotation.z = 0.32; }
    for (const dx of [-3.6, 3.6]) { st.acc.push(cylY(0.75, accH, mAcc, SG, x + dx, 22.5, zs, 24)); sph(0.75, mAcc, SG, x + dx, 22.5 + accH / 2, zs); sph(0.75, mAcc, SG, x + dx, 22.5 - accH / 2, zs); cylZ(0.12, 0.2, mat('gauge', 0xf0f0f0, {m: 0.2}), SG, x + dx, 22.5, zs + 0.8, 12); }
    for (const dz of [I.beltW / 2, -I.beltW / 2]) for (const dx of [-1.3, 1.3]) tube([[x + Math.sign(dx) * 3.6, 21, zs], [x + dx * 1.5, 22.6, zs + dz * 0.5], [x + dx, 22.2, zs + dz]], 0.07, mHose, SG, 8);
    tube([[x - 3.6, 21, zs], [x - 2, 22, zs + 3], [x - 1.3, 21.6, zs + I.beltW / 2]], 0.09, mHose, SG, 10);
    box(4.4, 0.9, I.beltW + 1, mCylB, SG, x, 21.8, zs);                                    // manifold crosshead
    S4.stations.push({...st, x, zs, si, ri});
    if (si === 0 && ri === 3) {
      part(S4, 'cyl', `Strut cylinders, 4 per station × Ø${bore.toFixed(2)} m`, 'D', `Station load ${(D.SUSP.load / 1e6).toFixed(1)} MN ÷ 250 bar → ${D.SUSP.A.toFixed(2)} m²; 4 cylinders per corner echoes the crawler's JEL layout`, 'jel', st.cyl[0], [0, 4, 0], true);
      part(S4, 'rod', 'Piston rods (chrome)', 'D', 'Extension tracks strut compression live', null, st.rod[0], [0, -3, 0]);
      part(S4, 'acc', `Nitrogen accumulators, 2 × ${(D.SUSP.V0 / 2).toFixed(2)} m³ per station`, 'D', `Gas volume sized so pressure reaches 3× static at full 1.8 m bump; ride frequency ${D.SUSP.fn.toFixed(2)} Hz; 250 bar static under Parker's 4,000 psi chamber`, 'gastrut', st.acc[0], [0, 4, 0], true);
      part(S4, 'manifold', 'Crosshead manifold', 'I', null, null, SG.children.at(-1), [0, 3, 0]);
      part(S4, 'hose', 'High-pressure hoses', 'I', null, null, SG.children.at(-2), [0, 2, 0]);
    }
  }));
  S4.SG = SG;
  // road wheel bearing cutaway (one wheel shown sectioned): tapered rollers
  {
    const x = ROAD[3], z = I.laneZ + I.beltW / 2 + 1.0, y = 1.04 + I.rRoad;
    const brg = inst(new THREE.CylinderGeometry(0.16, 0.2, 0.6, 10), mat('roll', 0xe0e0e0, {m: 1, r: 0.15}), Array.from({length: 26}, (_, i) => { const a = i / 26 * Math.PI * 2; return m4(x + 1.1 * Math.cos(a), y + 1.1 * Math.sin(a), z, Math.PI / 2, 0, 0); }), SG);
    const axle = cylZ(0.8, I.beltW + 2, mRod, SG, x, y, I.laneZ, 24);
    part(S4, 'bearing', 'Road-wheel tapered roller bearing (26 rollers)', 'I', null, null, brg, [0, 0, 4]);
    part(S4, 'axle', 'Road-wheel axle', 'I', null, null, axle, [0, 0, 0]);
  }
  S4.nOld = SG.children.length;   // station + bearing/axle meshes end here (the GLB station replaces them)
  // return rollers, tensioner, shoe section, pin
  const rr = []; for (const zs of [I.laneZ, -I.laneZ]) for (let i = 0; i < 4; i++) rr.push(cylZ(1.2, I.unitW - 2, mCylB, SG, MAIN.xa + 25 + i * 28, MAIN.yt + rS - 1.9, zs, 20));
  part(S4, 'return', 'Return rollers, 4 per unit', 'I', null, null, rr[0], [0, 3, 0]);
  const tens = []; for (const zs of [I.laneZ, -I.laneZ]) { tens.push(cylX(0.9, 14, mCylB, SG, MAIN.xb - 10, MAIN.yb + MAIN.Ly / 2, zs, 20)); cylX(0.55, 8, mRod, SG, MAIN.xb - 1, MAIN.yb + MAIN.Ly / 2, zs, 16); }
  part(S4, 'tens', 'Idler recoil / tensioner cylinder', 'D', `Takes up the ${MAIN.take.toFixed(2)} m centre-distance remainder from link rounding (H1)`, null, tens[0], [-5, 0, 0], true);
  {
    const sec = grp(SG, MAIN.xa + 40, -6, I.laneZ + 16), p = K.pitch, h = K.SHOE.h, t = K.SHOE.t;
    for (const yy of [h / 2 - t / 2, -h / 2 + t / 2]) box(p, t, I.beltW, mat('shoeS', 0x9aa0a6, {m: 0.85, r: 0.3}), sec, 0, yy, 0);
    for (let w = 0; w < 4; w++) box(p, h - 2 * t, 0.04, mat('web', 0xc0c4c8, {m: 0.85}), sec, 0, 0, -I.beltW / 2 + 0.5 + w * (I.beltW - 1) / 3);
    cylZ(0.18, I.beltW + 0.6, mRod, sec, p / 2, 0, 0, 16); cylZ(0.26, I.beltW, mat('bush', 0xb08d57, {m: 0.9}), sec, p / 2, 0, 0, 16);
    part(S4, 'shoe', `Hollow shoe section: 2 × ${(t * 1000).toFixed(0)} mm S690 flanges, 4 × 40 mm webs, ${(K.SHOE.m / 1e3).toFixed(1)} t`, 'D', 'Bending needs 3.8 mm; 50 mm set by the roller-path fatigue minimum (crawler shoes cracked there)', 'shoeCrack', sec, [0, -4, 6], true);
    part(S4, 'pin', 'Track pin Ø0.36 m + bronze bushing', 'D', 'Double shear at 26.8 MN belt pull, τ = σ/√3 on S690/3', null, sec.children.at(-1), [0, 0, 3]);
  }

  // ================================================================ 5 SLEWING SYSTEM
  const S5 = sys(5, 'slew', 'Slewing system · Ø48 m three-row roller bearing, 24 drives', {k: 1.0, in: 'rig', t: [I.upX, I.ringY + 3, 0], az: -58, el: 30, r: 112});
  const LG = grp(rig, I.upX, I.ringY, 0), LS = grp(slew); S5.groups.push(LG, LS);
  const R0 = I.ringD / 2, mRing = mat('ringS', 0x6f767d, {m: 0.85, r: 0.3}), mRol = mat('rolS', 0xd6d9dc, {m: 1, r: 0.12}), mBolt = mat('bolt', 0x3a3a3a, {m: 0.8});
  const outer = add(new THREE.Mesh(new THREE.TorusGeometry(R0 + 0.9, 0.7, 12, 128).rotateX(Math.PI / 2), mRing), LG, 0, 3.0, 0);
  const lower = add(new THREE.Mesh(new THREE.TorusGeometry(R0 + 0.9, 0.5, 10, 128).rotateX(Math.PI / 2), mRing), LG, 0, 1.2, 0);
  const inner = add(new THREE.Mesh(new THREE.TorusGeometry(R0 - 0.9, 0.7, 12, 128).rotateX(Math.PI / 2), mRing), LS, 0, 3.0, 0);
  const rolGeoA = new THREE.CylinderGeometry(D.SLEW.roller / 2, D.SLEW.roller / 2, 0.55, 10).rotateZ(Math.PI / 2);
  const rolGeoR = new THREE.CylinderGeometry(D.SLEW.roller / 2 * 0.8, D.SLEW.roller / 2 * 0.8, 0.45, 10);
  const rollerSet = (y, geo, rad) => { const im = new THREE.InstancedMesh(geo, mRol, D.SLEW.N); LG.add(im); im.userData = {y, rad}; return im; };
  S5.rows = [rollerSet(3.9, rolGeoA, R0), rollerSet(3.0, rolGeoR, R0 + 0.05), rollerSet(2.1, rolGeoA, R0)];
  const teethGeo = new THREE.BoxGeometry(0.09, 0.9, 0.11);
  S5.ringTeeth = inst(teethGeo, mGear, Array.from({length: D.SLEW.ringT}, (_, i) => { const a = i / D.SLEW.ringT * Math.PI * 2; return m4((R0 - 2.2) * Math.cos(a), 1.4, (R0 - 2.2) * Math.sin(a), 0, -a, 0); }), LG);
  const bolts = inst(new THREE.CylinderGeometry(0.06, 0.06, 1.6, 6), mBolt, Array.from({length: 720}, (_, i) => { const a = (i % 360) / 360 * Math.PI * 2, r = i < 360 ? R0 + 1.6 : R0 - 1.6; return m4(r * Math.cos(a), 3.4, r * Math.sin(a)); }), LG);
  const pinG = gearGeo(D.SLEW.module * D.SLEW.pinT / 2 * 1.0 + 0.45, 0.9, D.SLEW.pinT); pinG.rotateX(Math.PI / 2);
  S5.drives = [];
  for (let k = 0; k < D.SLEW.drives; k++) {
    const a = (k / D.SLEW.drives) * Math.PI * 2, rr = R0 - 3.0;
    const dv = grp(LS, rr * Math.cos(a), 0, rr * Math.sin(a));
    const pn = add(new THREE.Mesh(pinG, mGear), dv, 0, 1.4, 0);
    cylY(0.55, 2.6, mat('slewG', 0x55606a, {m: 0.6}), dv, 0, 4.3, 0, 20); cylY(0.45, 1.8, mMot, dv, 0, 6.5, 0, 20); cylY(0.3, 0.5, mBrk, dv, 0, 7.7, 0, 12);
    S5.drives.push({dv, pn});
  }
  const ped = add(new THREE.Mesh(new THREE.CylinderGeometry(R0 + 2.5, R0 + 3.5, 3, 64, 1, true), mat('ped', 0x3f444a, {m: 0.4, side: THREE.DoubleSide})), LG, 0, -1.5, 0);
  const grease = tube(Array.from({length: 33}, (_, i) => { const a = i / 32 * Math.PI * 2; return [(R0 + 2.4) * Math.cos(a), 4.6, (R0 + 2.4) * Math.sin(a)]; }), 0.06, mat('grease', 0xd0a020, {m: 0.3}), LG, 128);
  part(S5, 'outer', 'Outer ring (bolted to hull)', 'S', 'Three-row roller slewing bearing: two axial rows + one radial row', 'slew3', outer, [0, -3, 0], true);
  part(S5, 'inner', 'Inner ring (turns with deck)', 'S', null, 'slew3', inner, [0, 3, 0]);
  part(S5, 'lowerRing', 'Lower retaining ring', 'S', null, 'slew3', lower, [0, -5, 0]);
  part(S5, 'axialU', `Upper axial rollers, ${D.SLEW.N}`, 'D', `π × 48 m ÷ 0.40 m pitch; rollers orbit at half the slew rate (cage speed)`, 'slew3', S5.rows[0], [0, 4, 0], true);
  part(S5, 'radial', `Radial rollers, ${D.SLEW.N}`, 'D', null, 'slew3', S5.rows[1], [0, 0, 0]);
  part(S5, 'axialL', `Lower axial (uplift) rollers, ${D.SLEW.N}`, 'D', null, 'slew3', S5.rows[2], [0, -4, 0]);
  part(S5, 'ringgear', `Internal ring gear, ${D.SLEW.ringT} T, module 50 mm`, 'D', '48 m ÷ 0.05 m module; module invented', null, S5.ringTeeth, [0, -2, 0], true);
  part(S5, 'drives', `Slew drives, ${D.SLEW.drives} × (motor + planetary + brake + ${D.SLEW.pinT} T pinion)`, 'I', 'Pinions turn 53× the slew rate (960/18)', null, S5.drives[0].dv, [0, 5, 0], true);
  part(S5, 'bolts', 'Ring bolts, 2 × 360', 'I', null, null, bolts, [0, 2, 0]);
  part(S5, 'pedestal', 'Pedestal skirt', 'I', null, null, ped, [0, -4, 0]);
  part(S5, 'grease', 'Auto-grease ring line', 'I', null, null, grease, [0, 2, 0]);
  part(S5, 'size', 'Bearing size check: Ø48 m = 2.05× largest built', 'I', 'Liebherr built a 23.4 m segmented bearing; this one is invented at 2×', 'lieb', outer, [0, 0, 0]);
  ext(LS, R0 - 6, 0.2, 0, 'slew deck');

  // ================================================================ 6 GUN & ELEVATION (hydraulics sourced; gun internals visual only)
  const S6 = sys(6, 'gun', 'Gun & elevation · trunnions, 2 rams, 12-pump HPU (gun internals visual only)', {focus: ['trunnion', 'ram', 'pumps', 'cradle', 'breech', 'resv'], k: 1.15, pull: {ids: ['trunnion', 'cradle', 'breech', 'bring', 'recoil', 'tray', 'carrier', 'shellmagP', 'chargemagP', 'hoistfoot', 'transferP'], hide: ['bore', 'jacket', 'floor', 'pumps', 'resv', 'accB', 'vblk', 'filt'], k: 1.0}, in: 'slew', t: [48, 14, 0], az: -55, el: 24, r: 125});
  const GG = grp(slew), GB = grp(boom); S6.groups.push(GG, GB);
  const mHyd = mat('hyd', 0x2f6b3a, {m: 0.4}), mPr = mat('pr', 0xb52a20, {m: 0.4, r: 0.4}), mRet = mat('ret', 0x2a4fb5, {m: 0.4, r: 0.4}), mGun = mat('gunM', 0x3a3e44, {m: 0.8, r: 0.35});
  const trn = [12.6, -12.6].map((z) => cylZ(3.2, 2.2, mRing, GB, 0, 0, z, 32));
  part(S6, 'trunnion', 'Trunnion bearings, 2 × Ø6.4 m', 'I', 'Boom pivot; elevation moment reacts here', null, trn[0], [0, 0, 4], true);
  // rams: barrel on deck, rod into the mantle underside (updated live)
  S6.rams = [-7, 7].map((z) => ({z, barrel: cylY(D.GUN.ramBore / 2 + 0.15, 1, mCylB, GG, 0, 0, z, 24), rod: cylY(D.GUN.ramBore / 2 * 0.65, 1, mRod, GG, 0, 0, z, 20)}));
  part(S6, 'ram', `Elevation rams, 2 × Ø${D.GUN.ramBore.toFixed(2)} m bore`, 'D', `Boom moment ${(D.GUN.Mmax / 1e9).toFixed(2)} GN·m at 0° ÷ 28 m lever ÷ 2 rams ÷ 350 bar`, 'a4vso', S6.rams[0].barrel, [0, 0, 4], true);
  part(S6, 'ramrod', 'Ram rods', 'D', null, null, S6.rams[0].rod, [0, 0, 4]);
  // HPU room under the glacis
  const H = grp(GG, 44, 8, 0);
  box(26, 0.4, 36, mBase, H, 0, 0.2, 0);
  const pumps = [];
  for (let i = 0; i < D.GUN.pumps; i++) { const px = -10 + (i % 6) * 4, pz = i < 6 ? 8 : -8; const pm = grp(H, px, 0.4, pz); cylX(0.55, 1.8, mMot, pm, 0, 1.0, 0, 18); box(0.9, 0.8, 0.8, mHyd, pm, 1.4, 1.0, 0); pumps.push(pm); tube([[px + 1.4, 1.4, pz], [px + 1.4, 5, pz * 0.6], [12, 6, 0]], 0.12, mPr, H, 12); }
  const resv = box(10, 5, 8, mat('resv', 0x3d6b46, {m: 0.3}), H, -6, 3, 0);
  const accB = inst(new THREE.CylinderGeometry(0.4, 0.4, 3, 14), mat('accB', 0x8a2b2b, {m: 0.5}), Array.from({length: 16}, (_, i) => m4(4 + (i % 8) * 1.0, 2.0, (i < 8 ? 3 : -3))), H);
  const vblk = box(3, 2, 4, mat('vb', 0x777777, {m: 0.8}), H, 11, 2, 0);
  const filt = [0, 1, 2].map((i) => cylY(0.3, 1.4, mat('filt', 0xc0a030, {m: 0.4}), H, 8, 1.1, -14 + i));
  for (const z of [-7, 7]) { tube([[55 - 44, 2 + 8, 0], [60, 12, z * 0.5], [64, 10, z]], 0.22, mPr, GG, 24); tube([[48, 9, 3], [58, 11, z * 0.6], [63.5, 10, z * 1.05]], 0.18, mRet, GG, 24); }
  part(S6, 'pumps', `HPU pumps, ${D.GUN.pumps} × A4VSO 1000 (350 bar)`, 'S', `${D.GUN.pumps - 1} duty + 1 standby; each 1,000 cm³ × 1,000 rpm = ${(D.GUN.pumpQ * 60000).toFixed(0)} L/min, ${D.GUN.pumpkW.toFixed(0)} kW hydraulic`, 'a4vso', pumps[0], [0, 3, 0], true);
  part(S6, 'resv', 'Hydraulic reservoir', 'I', null, null, resv, [-4, 0, 0]);
  part(S6, 'accB', 'Piston accumulator bank, 16', 'I', null, null, accB, [0, 3, 0]);
  part(S6, 'vblk', 'Main valve manifold', 'I', null, null, vblk, [3, 0, 0]);
  part(S6, 'filt', 'Return filters', 'I', null, null, filt[0], [0, 2, 0]);
  part(S6, 'lines', 'Pressure (red) and return (blue) lines', 'I', null, null, GG.children.at(-1), [0, 0, 0]);
  // gun internals — visual only, INVENTED, no performance numbers
  const cradle = box(60, 3, 20, mGun, GB, 32, -11.5, 0);
  const rec = [[6, 6], [6, -6], [-6, 6], [-6, -6]].map(([y, z]) => cylX(0.9, 26, mCylB, GB, 50, y * 0.9, z * 0.9, 18));
  const breech = box(10, 9, 9, mGun, GB, 6, 0, 0);
  const bring = cylX(6.2, 3, mGun, GB, 12.5, 0, 0, 40); cylX(5.0, 0.6, mat('bring2', 0x8b9096, {m: 0.9}), GB, 14.2, 0, 0, 40);
  const tray = box(14, 0.5, 3, mat('tray2', 0x9ea3a8, {m: 0.8}), GB, -2, -3.5, 0);
  for (let x = 6; x < 62; x += 6) box(0.6, 3.6, 20.4, mGun, GB, x, -11.5, 0);
  for (const [y, z] of [[5.4, 5.4], [5.4, -5.4], [-5.4, 5.4], [-5.4, -5.4]]) { box(2.4, 2.4, 2.4, mGun, GB, 37, y, z); box(2.4, 2.4, 2.4, mGun, GB, 63, y, z); }
  for (const z of [14.2, -14.2]) { cylZ(2.2, 0.5, mRing, GB, 0, 0, z, 32); inst(new THREE.CylinderGeometry(0.1, 0.1, 0.5, 6).rotateX(Math.PI / 2), mBolt, Array.from({length: 16}, (_, i) => m4(1.8 * Math.cos(i / 16 * Math.PI * 2), 1.8 * Math.sin(i / 16 * Math.PI * 2), z + Math.sign(z) * 0.4)), GB); }
  const carrier = box(8, 1.2, 10, mat('carrierG', 0xc8a02e, {m: 0.7}), GB, 6, -6, 0);
  const hoistPts = [[-34, -16, 0], [-12, -15, 0], [-2, -10, 0], [4, -6, 0]];
  const hoist = tube(hoistPts, 1.0, mat('hoist', 0x5a5f66, {m: 0.5}), GB, 30);
  const jacket = []; for (let x = 66; x < I.boomL - 4; x += 10) jacket.push(cylX(I.boomD / 2 + 0.4, 1.4, mGun, GB, x, 0, 0, 36));
  const gunBore = cylX(I.boomD / 2 * 0.45, I.boomL - 12, mat('boreD', 0x0c0c0c, {m: 0.2}), GB, I.boomL / 2 + 6, 0, 0, 24);
  part(S6, 'cradle', 'Cradle', 'I', 'Gun internals are visual only: no ballistic or performance data', null, cradle, [0, -6, 0], true);
  part(S6, 'recoil', 'Recoil cylinders, 4 (visual)', 'I', 'Visual only', null, rec[0], [0, 4, 4]);
  part(S6, 'breech', 'Breech block (visual)', 'I', 'Visual only', null, breech, [-8, 0, 0], true);
  part(S6, 'bring', 'Breech ring (visual)', 'I', 'Visual only', null, bring, [-4, 0, 0]);
  part(S6, 'tray', 'Loading tray (visual)', 'I', 'Visual only', null, tray, [-6, -3, 0]);
  part(S6, 'carrier', 'Loader carrier (visual)', 'I', 'Visual only', null, carrier, [-6, -4, 0]);
  part(S6, 'hoist', 'Hoist trunk from deck to breech (visual)', 'I', 'Visual only', null, hoist, [0, -6, 0]);
  part(S6, 'jacket', 'Barrel jacket rings', 'I', null, null, jacket[0], [0, 3, 0]);
  part(S6, 'bore', 'Barrel bore (section)', 'I', null, null, gunBore, [0, 0, 0]);
  ext(H, -12, 0.4, 15, 'HPU room'); ext(H, 12, 0.4, -15, 'HPU room');

  // ================================================================ 7 HULL, BUOYANCY, MARINE & FIRE SAFETY
  const S7 = sys(7, 'hull', 'Hull, buoyancy & fire safety · pontoons, ballast, 5 thrusters, fire main, extinguishers', {k: 0.85, pull: {ids: ['thr', 'nozzle'], k: 0.72}, in: 'rig', t: [115, 16, 0], az: -42, el: 30, r: 330});
  const HG = grp(rig), HS = grp(slew); S7.groups.push(HG, HS);
  const mBh = mat('bh', 0x9fb0bd, {m: 0.3, t: true, op: 0.55, side: THREE.DoubleSide}), mWater = mat('ballast', 0x2f6f9f, {m: 0.1, r: 0.2, t: true, op: 0.7}), mFire = mat('fire', 0xc81e1e, {m: 0.4, r: 0.4}), mOr = mat('orange', 0xf26b1d, {m: 0.2, r: 0.5}), mThr = mat('thr', 0xb7c0c7, {m: 0.8, r: 0.3});
  const bhs = [];
  for (const zs of [I.laneZ, -I.laneZ]) for (let i = 1; i < D.HULL.compartments; i++) bhs.push(box(0.3, 18, I.unitW - 1, mBh, HG, MAIN.xa + i * MAIN.Lx / D.HULL.compartments, 15, zs));
  S7.ballast = [];
  for (const zs of [I.laneZ, -I.laneZ]) for (let i = 2; i < 6; i++) { const b = box(MAIN.Lx / D.HULL.compartments - 2, 1, I.unitW - 4, mWater, HG, MAIN.xa + (i + 0.5) * MAIN.Lx / D.HULL.compartments, 7, zs); S7.ballast.push(b); }
  const bpumps = [0, 1, 2, 3].map((i) => { const g0 = grp(HG, 60 + i * 30, 6.5, 0); cylZ(0.6, 1.6, mMot, g0, 0, 0, 0); cylY(0.8, 1.2, mThr, g0, 0, -1, 0); return g0; });
  const sea = [0, 1, 2, 3].map((i) => box(2, 0.6, 2, mat('sea', 0x223344), HG, 60 + i * 30, I.unitH - 0.3, 0));
  part(S7, 'bulk', `Watertight bulkheads, ${D.HULL.compartments} compartments per track unit`, 'I', 'Track units are the buoyant pontoons; 0.6 sealed fraction (I)', null, bhs[3], [0, 0, 6], true);
  part(S7, 'ballast', 'Ballast tanks (level live)', 'I', `20% of pontoon volume; ${D.HULL.pumps} pumps at 2,000 m³/h`, null, S7.ballast[0], [0, 0, 8], true);
  part(S7, 'bpumps', 'Ballast pumps, 4', 'I', null, null, bpumps[0], [0, -3, 0]);
  part(S7, 'sea', 'Sea chests', 'I', null, null, sea[0], [0, -2, 0]);
  // retractable azimuth thrusters in the hull belly (between the track units)
  S7.thr = [];
  for (let i = 0; i < D.HULL.thrusters; i++) {
    const x = 30 + i * 42, z = i % 2 ? 9 : -9;
    const th = grp(HG, x, I.unitH, z), col = cylY(1.4, 26, mThr, th, 0, -13, 0, 24), pod = cylX(1.7, 7, mThr, th, 0.5, -27, 0, 24);
    const noz = add(new THREE.Mesh(new THREE.TorusGeometry(3.4, 0.45, 10, 40), mThr), th, 3.2, -27, 0, 0, Math.PI / 2, 0);
    const prop = grp(th, 3.2, -27, 0); for (let b = 0; b < 4; b++) box(0.3, 3.0, 0.9, mat('prop', 0xb59a3c, {m: 1, r: 0.2}), prop, 0, 1.5, 0).rotation.x = b * Math.PI / 2;
    prop.children.forEach((c, b) => { c.position.set(0, 1.5 * Math.cos(b * Math.PI / 2), 1.5 * Math.sin(b * Math.PI / 2)); c.rotation.set(b * Math.PI / 2, 0.3, 0); });
    const well = box(6, 1.2, 6, mat('well', 0x222830), HG, x, I.unitH + 0.6, z);
    S7.thr.push({th, prop});
    if (i === 0) { part(S7, 'thr', `Retractable azimuth thrusters, ${D.HULL.thrusters} × 5.5 MW (WST-65RU type)`, 'S', 'Sleipnir carries four 5,500 kW retractable WST-65RU forward; count here from Admiralty scaling (D); column length invented', 'wst65', th, [0, -10, 0], true); part(S7, 'nozzle', 'Thruster nozzle (8° tilt in the Wärtsilä design)', 'S', null, 'wst65', noz, [4, 0, 0]); part(S7, 'prop', 'Propeller, 4 blades', 'I', null, null, prop, [6, 0, 0]); part(S7, 'well', 'Thruster trunk / well', 'I', null, null, well, [0, 2, 0]); }
  }
  // fire main ring + hydrants + pumps; deluge on the LNG spheres; lifeboats
  const ringPts = [[2, I.unitH + 10.6, 48], [228, I.unitH + 10.6, 48], [228, I.unitH + 10.6, -48], [2, I.unitH + 10.6, -48], [2, I.unitH + 10.6, 47.9]];
  const main = tube(ringPts, 0.25, mFire, HG, 200);
  const hyd = inst(mergeAll([new THREE.CylinderGeometry(0.12, 0.12, 1.0, 8).translate(0, 0.5, 0), new THREE.BoxGeometry(0.45, 0.12, 0.12).translate(0, 0.85, 0)]), mFire,
    [...Array.from({length: 8}, (_, i) => m4(10 + i * 30, I.unitH + 10, 48)), ...Array.from({length: 8}, (_, i) => m4(10 + i * 30, I.unitH + 10, -48))], HG);
  const fpumps = [0, 1, 2].map((i) => { const g0 = grp(HG, 214, I.unitH + 1, -8 + i * 8); cylX(0.6, 1.8, mMot, g0, 0, 1, 0); cylY(0.7, 1.2, mFire, g0, 1.4, 1, 0); return g0; });
  const delu = [16, -16].map((z) => add(new THREE.Mesh(new THREE.TorusGeometry(7.4, 0.12, 6, 48), mFire), HS, -138, 61, z, Math.PI / 2, 0, 0));
  const boats = [1, -1].flatMap((s) => [-60, 0].map((x) => { const b = grp(HS, x, 30, s * 35); add(new THREE.Mesh(new THREE.CapsuleGeometry(1.6, 7, 6, 16).rotateZ(Math.PI / 2), mOr), b, 0, 0, 0); box(0.4, 4, 0.4, mBase, b, -3, 2, -s * 1.5); box(0.4, 4, 0.4, mBase, b, 3, 2, -s * 1.5); return b; }));
  S7.bpumps = bpumps; S7.fpumps = fpumps; S7.boats = boats; S7.hyd = hyd;
  part(S7, 'firemain', 'Fire main ring (hull deck)', 'I', null, null, main, [0, 2, 0], true);
  part(S7, 'hydrants', 'Hydrants, 16 (every 30 m)', 'I', null, null, hyd, [0, 1, 0]);
  part(S7, 'fpumps', 'Fire pumps, 3', 'I', null, null, fpumps[0], [0, 2, 0]);
  part(S7, 'deluge', 'LNG sphere deluge rings', 'I', null, null, delu[0], [0, 3, 0]);
  part(S7, 'boats', 'Enclosed lifeboats + davits, 4', 'I', null, null, boats[0], [0, 0, 4], true);
  // portable extinguishers on every catwalk (≤ 15.25 m spacing) + accommodation (1 per 250 m²)
  for (const y of [22, 36]) for (const s of [1, -1]) for (let x = -146; x <= 28; x += 15) ext(slew, x, y + 0.1, s * 33.4, 'catwalk');
  for (let i = 0; i < Math.ceil(25 * 28 / D.HULL.areaPerExt) * 2; i++) ext(slew, 2 + (i % 6) * 4, 50.3, -12 + Math.floor(i / 6) * 8, 'bridge/accommodation');
  for (const s of [1, -1]) for (let x = 5; x < 230; x += 15) ext(rig, x, I.unitH + 10.05, s * 49.4, 'hull deck');
  // build all extinguishers as instanced meshes per parent
  const byParent = new Map(); EXTS.forEach((e) => { if (!byParent.has(e.parent)) byParent.set(e.parent, []); byParent.get(e.parent).push(m4(e.x, e.y, e.z)); });
  S7.ext = []; for (const [p, list] of byParent) S7.ext.push(inst(EXT, mFire, list, p));
  S7.groups.push(...S7.ext);
  part(S7, 'ext', `Portable extinguishers, ${EXTS.length} (9 kg B:C)`, 'S', `Machinery spaces ≤ 15.25 m walking distance (46 CFR 34.50-10); accommodation 1 per 250 m² (MSC.1/Circ.1275); one at every switchboard and drive room`, 'cfr', S7.ext[0], [0, 0, 0], true);

  return SYS;
}
