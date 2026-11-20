// COLOSSAL surface finish: procedural plating texture applied in world space (triplanar), so every face - Blender or
// procedural - gets plate seams, weld beads, bolt rows, grime and rain streaks at true scale without UVs.
// One 1024 px tile = TILE metres. Albedo modulation + roughness variation + bump (derivative normal perturbation).
import * as THREE from 'three';

function rng(seed) { let s = seed >>> 0; return () => ((s = Math.imul(s ^ (s >>> 15), 0x2c1b3c6d) + 0x9e3779b9 >>> 0) / 4294967296); }
function noise2(N, seed) {             // value noise, octaves summed, tileable
  const r = rng(seed), g = new Float32Array(N * N); const out = new Float32Array(N * N);
  for (let i = 0; i < g.length; i++) g[i] = r();
  for (const [f, w] of [[8, 0.5], [16, 0.25], [32, 0.15], [64, 0.1]]) {
    const c = N / f;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const gx = x / c, gy = y / c, x0 = Math.floor(gx) % f, y0 = Math.floor(gy) % f, x1 = (x0 + 1) % f, y1 = (y0 + 1) % f, tx = gx - Math.floor(gx), ty = gy - Math.floor(gy);
      const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty), G = (a, b) => g[(b * 97 + a * 13 + f * 7) % g.length];
      out[y * N + x] += w * ((G(x0, y0) * (1 - sx) + G(x1, y0) * sx) * (1 - sy) + (G(x0, y1) * (1 - sx) + G(x1, y1) * sx) * sy);
    }
  }
  return out;
}
/** RGBA: R = albedo factor, G = height, B = roughness offset, A = streak */
export function plateTexture(N = 1024, seed = 7) {
  const r = rng(seed), nz = noise2(N, seed), D = new Uint8ClampedArray(N * N * 4);
  const H = new Float32Array(N * N).fill(0.5), A = new Float32Array(N * N), R = new Float32Array(N * N);
  const px = N / 8;                                                            // 1 m in px (tile = 8 m)
  // plate layout: courses 2 m tall, plates 4 m long, staggered every other course
  const seamsH = [0, 2, 4, 6].map((m) => m * px), plates = [];
  for (let c = 0; c < 4; c++) { const off = c % 2 ? 2 * px : 0; for (let k = 0; k < 2; k++) plates.push({y0: c * 2 * px, x: (off + k * 4 * px) % N}); }
  const line = (x0, y0, x1, y1, w, h, a) => {                                  // weld seam: recessed groove with bead
    const L = Math.hypot(x1 - x0, y1 - y0), n = Math.ceil(L);
    for (let i = 0; i <= n; i++) { const x = Math.round(x0 + (x1 - x0) * i / n), y = Math.round(y0 + (y1 - y0) * i / n);
      for (let d = -w; d <= w; d++) { const xx = ((x1 === x0 ? x + d : x) % N + N) % N, yy = ((y1 === y0 ? y + d : y) % N + N) % N, k = yy * N + xx, t = Math.abs(d) / w;
        H[k] = Math.min(H[k], 0.5 - h * (1 - t) + (t > 0.55 && t < 0.85 ? h * 0.8 : 0)); A[k] = Math.max(A[k], a * (1 - t)); } }
  };
  for (const y of seamsH) line(0, y, N - 1, y, 2, 0.3, 0.45);
  for (const p of plates) line(p.x, p.y0, p.x, p.y0 + 2 * px - 1, 2, 0.3, 0.45);
  // stiffener shadow lines (internal frames telegraphing through the plate) every 0.8 m
  for (let x = 0; x < N; x += Math.round(0.8 * px)) for (let y = 0; y < N; y++) { const k = y * N + x; H[k] -= 0.04; }
  // bolt rows along some seams + access panels with fasteners
  for (let i = 0; i < 26; i++) {
    const x0 = Math.floor(r() * N), y0 = Math.floor(r() * N), w = Math.floor((0.4 + r() * 1.2) * px), h = Math.floor((0.3 + r() * 0.8) * px);
    line(x0, y0, x0 + w, y0, 1, 0.2, 0.35); line(x0, y0 + h, x0 + w, y0 + h, 1, 0.2, 0.35); line(x0, y0, x0, y0 + h, 1, 0.2, 0.35); line(x0 + w, y0, x0 + w, y0 + h, 1, 0.2, 0.35);
    for (let b = 0; b <= w; b += 14) for (const yy of [y0 + 5, y0 + h - 5]) { const k = (((yy % N) + N) % N) * N + ((x0 + b) % N); H[k] += 0.25; if (k + 1 < H.length) H[k + 1] += 0.25; if (k + N < H.length) H[k + N] += 0.2; }
  }
  // vertical rain streaks + grime from noise
  for (let i = 0; i < 90; i++) { const x = Math.floor(r() * N), y0 = Math.floor(r() * N), len = Math.floor((0.5 + r() * 3) * px), w = 2 + Math.floor(r() * 5), s = 0.1 + r() * 0.25;
    for (let y = 0; y < len; y++) for (let d = -w; d <= w; d++) { const k = (((y0 + y) % N) * N + ((x + d + N) % N)); R[k] = Math.max(R[k], s * (1 - y / len) * (1 - Math.abs(d) / (w + 1))); } }
  for (let k = 0; k < N * N; k++) {
    const g = nz[k];
    const alb = 0.94 + 0.16 * (g - 0.5) - 0.16 * A[k] - 0.42 * R[k];
    D[k * 4] = Math.max(0, Math.min(255, alb * 230)); D[k * 4 + 1] = Math.max(0, Math.min(255, H[k] * 255));
    D[k * 4 + 2] = Math.max(0, Math.min(255, 128 + 90 * (g - 0.5) + 70 * R[k])); D[k * 4 + 3] = 255;
  }
  const t = new THREE.DataTexture(D, N, N, THREE.RGBAFormat); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.anisotropy = 8; t.needsUpdate = true; return t;
}

let TEX = null;
/** patch a MeshStandardMaterial so it samples the plate texture triplanar in world space. scale = metres per tile */
export function finish(m, {scale = 8, strength = 1, bump = 1} = {}) {
  if (!m || m.userData.finished || !(m.isMeshStandardMaterial || m.isMeshPhysicalMaterial)) return;
  TEX ??= plateTexture();
  m.userData.finished = true;
  const U = {uPlate: {value: TEX}, uPlateScale: {value: 1 / scale}, uPlateStr: {value: strength}, uPlateBump: {value: bump}};
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP; varying vec3 vWN;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\n#ifdef USE_INSTANCING\n vec4 wpP = modelMatrix * instanceMatrix * vec4(transformed, 1.0); vWN = normalize(mat3(modelMatrix * instanceMatrix) * objectNormal);\n#else\n vec4 wpP = modelMatrix * vec4(transformed, 1.0); vWN = normalize(mat3(modelMatrix) * objectNormal);\n#endif\n vWP = wpP.xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
varying vec3 vWP; varying vec3 vWN; uniform sampler2D uPlate; uniform float uPlateScale, uPlateStr, uPlateBump;
vec4 plateTri() { vec3 n = abs(normalize(vWN)); n = pow(n, vec3(6.0)); n /= (n.x + n.y + n.z);
  vec3 p = vWP * uPlateScale; return texture2D(uPlate, p.zy) * n.x + texture2D(uPlate, p.xz) * n.y + texture2D(uPlate, p.xy) * n.z; }
vec3 plateBump(vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float fd) {
  vec3 vSigmaX = dFdx(surf_pos.xyz), vSigmaY = dFdy(surf_pos.xyz), vN = surf_norm;
  vec3 R1 = cross(vSigmaY, vN), R2 = cross(vN, vSigmaX); float fDet = dot(vSigmaX, R1) * fd;
  vec3 vGrad = sign(fDet) * (dHdxy.x * R1 + dHdxy.y * R2); return normalize(abs(fDet) * surf_norm - vGrad); }`)
      .replace('#include <color_fragment>', '#include <color_fragment>\n vec4 PL = plateTri(); diffuseColor.rgb *= mix(1.0, PL.r / 0.9, uPlateStr);')
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n roughnessFactor = clamp(roughnessFactor + (PL.b - 0.5) * 0.5 * uPlateStr, 0.04, 1.0);')
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n { float h = PL.g; normal = plateBump(-vViewPosition, normal, vec2(dFdx(h), dFdy(h)) * 1.6 * uPlateBump, faceDirection); }');
  };
  m.customProgramCacheKey = () => 'plate1';
  m.needsUpdate = true;
}
/** canvas text decal (stencil / hull number / signage) as a plane mesh */
export function decal(text, {w = 10, h = 3, color = '#f4f2ec', bg = null, font = '700 180px Arial', px = 1024} = {}) {
  const c = document.createElement('canvas'); c.width = px; c.height = Math.round(px * h / w); const g = c.getContext('2d');
  if (bg) { g.fillStyle = bg; g.fillRect(0, 0, c.width, c.height); }
  g.fillStyle = color; g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle';
  const lines = String(text).split('\n'), lh = c.height / lines.length; lines.forEach((l, i) => g.fillText(l, c.width / 2, lh * (i + 0.5)));
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  const m = new THREE.MeshStandardMaterial({map: t, transparent: !bg, roughness: 0.7, metalness: 0.1, polygonOffset: true, polygonOffsetFactor: -2});
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
}
