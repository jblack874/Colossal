// Seeded procedural detail: panels, vents, windows, railings, catwalks, pipes, ladders. Nothing hand-placed twice.
// Everything lands in a few InstancedMeshes per parent (one draw call per material).
import * as THREE from 'three';
import {rng as seeded} from 'teardown-kit/util.js';

const UNIT = new THREE.BoxGeometry(1, 1, 1);
const CYL = new THREE.CylinderGeometry(0.5, 0.5, 1, 10);
export function makeCollector() {
  const C = {panel: [], light: [], rail: [], win: [], pipe: []};
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
  C.box = (kind, pos, size, quat = null, color = null) => { C[kind].push({m: m4.clone().compose(p.copy(pos), quat ? quat.clone() : q.identity().clone(), s.copy(size)), c: color}); };
  C.build = (parent, mats) => {
    const out = [];
    for (const k of ['panel', 'light', 'rail', 'win', 'pipe']) {
      const L = C[k]; if (!L.length) continue;
      const mesh = new THREE.InstancedMesh(k === 'pipe' ? CYL : UNIT, mats[k], L.length);
      L.forEach((e, i) => { mesh.setMatrixAt(i, e.m); if (e.c) mesh.setColorAt(i, e.c); });
      mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      parent.add(mesh); out.push(mesh);
    }
    return out;
  };
  return C;
}
const V = (x, y, z) => new THREE.Vector3(x, y, z);
/** greeble a rectangular face. o = corner, u = along (unit), v = up (unit), n = outward normal (unit) */
export function face(C, seed, o, u, v, n, U, Vh, opt = {}) {
  const r = seeded(seed), minS = opt.min ?? 2.2, white = opt.white ?? 0.03, winP = (opt.win ?? 0.06) * 0.4;
  const rects = [[0, 0, U, Vh]];
  const out = [];
  while (rects.length) {
    const [a, b, w, h] = rects.pop();
    const splitW = w > minS * 2 && (w > h * 1.4 || r() < 0.5), splitH = h > minS * 2;
    if ((splitW || splitH) && (w * h > minS * minS * 3 || r() < 0.7)) {
      if (splitW && (!splitH || r() < 0.55)) { const k = w * (0.3 + 0.4 * r()); rects.push([a, b, k, h], [a + k, b, w - k, h]); }
      else { const k = h * (0.3 + 0.4 * r()); rects.push([a, b, w, k], [a, b + k, w, h - k]); }
    } else out.push([a, b, w, h]);
  }
  const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(u, v, n));
  const col = new THREE.Color();
  for (const [a, b, w, h] of out) {
    const gap = 0.18, d = (opt.depth ?? 0.25) + r() * (opt.relief ?? 0.9);
    const c = o.clone().addScaledVector(u, a + w / 2).addScaledVector(v, b + h / 2).addScaledVector(n, d / 2);
    const roll = r();
    if (roll < white) C.box('light', c, V(w - gap, h - gap, d), q);
    else if (roll < white + winP && h < 5) {      // window strip: dark recess + lit glass
      C.box('panel', c, V(w - gap, h - gap, d), q, col.setHSL(0.6, 0.04, 0.10 + r() * 0.05).clone());
      C.box('win', c.clone().addScaledVector(n, d / 2 + 0.02), V((w - gap) * 0.8, Math.min(1.1, (h - gap) * 0.5), 0.05), q);
    } else {
      C.box('panel', c, V(w - gap, h - gap, d), q, col.setHSL(0.6, 0.03, 0.30 + r() * 0.28).clone());
      if (w > 4 && h > 3 && r() < 0.25) {          // vent slats
        const ns = Math.floor(h / 0.9);
        for (let i = 0; i < ns; i++) C.box('rail', c.clone().addScaledVector(v, -h / 2 + 0.6 + i * 0.9).addScaledVector(n, d / 2 + 0.1), V(w * 0.7, 0.18, 0.2), q);
      }
    }
  }
  // horizontal pipe runs and a ladder or two
  for (let i = 0; i < (opt.pipes ?? 2); i++) {
    const y = Vh * (0.2 + 0.6 * r()), rad = 0.35 + r() * 0.5, len = U * (0.3 + 0.6 * r()), x0 = (U - len) * r();
    const c = o.clone().addScaledVector(u, x0 + len / 2).addScaledVector(v, y).addScaledVector(n, 1.4 + rad);
    const qq = q.clone().multiply(new THREE.Quaternion().setFromAxisAngle(V(0, 0, 1), Math.PI / 2));
    C.box('pipe', c, V(rad * 2, len, rad * 2), qq);
  }
  for (let i = 0; i < (opt.ladders ?? 1); i++) {
    const x = U * r(), c0 = o.clone().addScaledVector(u, x).addScaledVector(n, 1.2);
    for (const sx of [-0.35, 0.35]) C.box('rail', c0.clone().addScaledVector(u, sx).addScaledVector(v, Vh / 2), V(0.12, Vh, 0.12), q);
    for (let y = 0.4; y < Vh; y += 0.45) C.box('rail', c0.clone().addScaledVector(v, y), V(0.7, 0.06, 0.06), q);
  }
}
/** railing along a straight edge a→b at height y0, posts every 2 m, two rails */
export function railing(C, a, b, h = 1.1) {
  const d = b.clone().sub(a), L = d.length(), u = d.clone().normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(V(1, 0, 0), u);
  for (let s = 0; s <= L; s += 2) C.box('rail', a.clone().addScaledVector(u, s).add(V(0, h / 2, 0)), V(0.08, h, 0.08));
  for (const y of [h, h * 0.5]) C.box('rail', a.clone().addScaledVector(u, L / 2).add(V(0, y, 0)), V(L, 0.07, 0.07), q);
}
/** catwalk ledge with railing along a face edge */
export function catwalk(C, a, b, outward, w = 1.6) {
  const d = b.clone().sub(a), L = d.length(), u = d.clone().normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(V(1, 0, 0), u);
  const mid = a.clone().addScaledVector(u, L / 2).addScaledVector(outward, w / 2);
  C.box('rail', mid, V(L, 0.15, w), q);
  for (let s = 0; s <= L; s += 3) C.box('rail', a.clone().addScaledVector(u, s).addScaledVector(outward, w * 0.4).add(V(0, -0.6, 0)), V(0.1, 1.2, 0.1));
  railing(C, a.clone().addScaledVector(outward, w), b.clone().addScaledVector(outward, w));
}
