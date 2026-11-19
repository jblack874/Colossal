// COLOSSAL — Blender asset loader + swap. Each system's hero units are modelled in Blender (blender/*.py), exported as
// GLB in the explorer's own local frames, inlined into the page (base64) and swapped in for the procedural stand-ins.
// Old meshes are moved to layer 1 (not rendered) so their transforms keep driving labels, explode and motion.
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

export async function parseGLB(src) {
  // inline base64, or 'url:<file>' when the build keeps models next to the page (build.json "external")
  const b64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0)).buffer;
  let buf;
  if (!src.startsWith('url:')) buf = b64(src);
  else { const u = src.slice(4).split('/').pop(), r = await fetch(u); buf = u.endsWith('.json') ? b64((await r.json())[0]) : await r.arrayBuffer(); }
  const g = await new GLTFLoader().parseAsync(buf, '');
  g.scene.traverse((o) => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; for (const m of [o.material].flat()) { m.envMapIntensity = 1; if (m.name === 'led' || m.name === 'screen' || /status/.test(m.name)) m.toneMapped = true; } } });
  return g.scene;
}
/** hide every mesh under `g` (recursively, or direct children only) except those in keep */
export function hideOld(g, {keep = [], direct = false} = {}) {
  const K = new Set(keep);
  const visit = (o) => { for (const c of o.children) { if (c.userData.glb || K.has(c)) continue; if (c.isMesh || c.isInstancedMesh) c.layers.set(1); if (!direct) visit(c); } };
  visit(g);
}
export function place(scene, parent, {mirrorZ = false, x = 0, y = 0, z = 0} = {}) {
  const c = scene.clone(true); c.userData.glb = true; c.traverse((o) => { o.userData.glb = true; });
  c.position.set(x, y, z); if (mirrorZ) c.scale.z = -1; parent.add(c); return c;
}
/** point system parts at the GLB nodes of the same name (labels, explode and pull-out framing follow) */
export function repoint(sys, root, ids) {
  for (const id of ids) {
    const n = root.getObjectByName(id), p = sys.parts.find((q) => q.id === id);
    if (!n || !p) continue; n.userData.part = id; p.obj = n; p.base = n.position.clone();
  }
}
/** materials by name inside a GLB scene */
export function mats(root) { const M = {}; root.traverse((o) => { if (o.isMesh) for (const m of [o.material].flat()) M[m.name] = m; }); return M; }
