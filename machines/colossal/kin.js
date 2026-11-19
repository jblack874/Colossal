// COLOSSAL — the math. Metres, seconds, newtons, radians. No three.js: runs under Node for the hand checks.
// One input: time t (belt travel d = v·t). Secondary inputs: slew, elev, water depth h, terrain on/off.
// Tags: S = sourced (spec doc analog table), D = derived (formula here), I = invented (labelled).
// Frame: x forward (toward the boom), y up, z to port. Origin: hull stern, ground level, centreline.

export const S = { // sourced analogs
  CT_shoe_m: 998, CT_shoe_len: 2.286, CT_shoe_pitch: 0.457,   // crawler shoe 2,200 lb, 7.5 x 1.5 ft
  CT_P_trac: 16 * 375 * 745.7, CT_v: 0.447,                   // 16 x 375 hp; 1 mph loaded
  CT_W_max: (6.65e6 + 18e6) * 0.4536 * 9.81,                  // CT-2 + 18 M lb capacity, N
  CT_ratio: 168,                                              // drive gear ratio 168:1
  B288_p: 1.71e5,                                             // Bagger 288 ground pressure, Pa
  PRE_rho: 260e6 / (488 * 74 * 105),                          // Prelude steel per envelope, kg/m3
  SLP_disp: 273.7e6, SLP_thr: 8 * 5.5e6, SLP_plant: 96e6,     // Sleipnir
  S690: 690e6, rho_st: 7850, rho_sw: 1025, g: 9.81,
};
export const I = { // invented geometry (scale anchor = 230 m hull), see spec D1–D10
  hullL: 230, beam: 100, hullH: 10, unitH: 30, podH: 28, unitW: 28, podW: 24,
  beltW: 13, podBeltW: 11, laneZ: 36, podZ: 63, mainX0: 5, mainLen: 160.6, podX0: 150, podLen: 46.2,
  teeth: 29, podTeeth: 21, v: 0.5, nRoad: 10, rRoad: 3.6, stroke: 1.8,
  upL: 170, upW: 64, upH: 38, upX: 115, ringD: 48, ringY: 40, boomL: 150, boomD: 12, trunX: 200, trunY: 70,
  shoe: {hFrac: 0.40, tMin: 0.05, nWeb: 4, tWeb: 0.04, extra: 0.30, SF: 3, pDesign: 1.71e5},
  sealed: 0.6, outfit: 1.10, runningGearK: 2.0,
  terrain: {a1: 1.2, l1: 90, a2: 0.5, l2: 23, roll: 0.6},          // gentle salt-flat swell + ripples, m
};
// ---------------------------------------------------------------- derived: track geometry
const sc = I.beltW / S.CT_shoe_len;
export const pitch = S.CT_shoe_pitch * sc;                                   // D 2.60 m
export const rS = pitch / (2 * Math.sin(Math.PI / I.teeth));                 // D main sprocket/idler pitch radius (29T: 12.0 m)
export const rP = pitch / (2 * Math.sin(Math.PI / I.podTeeth));              // D pod sprocket/idler (21T: 8.7 m)
const tPin = I.shoe.hFrac * pitch;                                           // D shoe depth 1.04 m
const yPitch = tPin / 2;                                                     // belt pitch line above ground (flat)

/** rounded-rectangle belt: 4 equal corner wheels; returns centres, loop length, links (tensioner sets Lx) */
function belt(x0, len, H, r) {
  const Ly = H - 2 * r - tPin;                                      // vertical centre spacing (top pitch line at H - yPitch)
  const Lx0 = len - 2 * r;
  const L0 = 2 * Lx0 + 2 * Ly + 2 * Math.PI * r;
  const N = Math.round(L0 / pitch);
  const Lx = (N * pitch - 2 * Ly - 2 * Math.PI * r) / 2;                     // idler/tensioner takes the remainder
  const xa = x0 + r, xb = xa + Lx, yb = yPitch + r, yt = yb + Ly;
  return {N, L: N * pitch, L0, Lx, Lx0, Ly, r, xa, xb, yb, yt, take: Lx - Lx0};
}
export const MAIN = belt(I.mainX0, I.mainLen, I.unitH, rS);
export const POD = belt(I.podX0, I.podLen, I.podH, rP);

/** point on the belt at arc length s (CCW seen from port: bottom run goes aft as the vehicle drives forward) */
export function beltAt(B, s) {
  s = ((s % B.L) + B.L) % B.L;
  const {xa, xb, yb, yt, r, Lx, Ly} = B, q = Math.PI * r / 2;
  const seg = [Lx, q, Ly, q, Lx, q, Ly, q];
  let i = 0;
  while (s > seg[i]) { s -= seg[i]; i = (i + 1) % 8; }
  switch (i) {
    case 0: return {x: xb - s, y: yb - r, a: Math.PI, bottom: true};          // bottom run, front→rear
    case 1: { const t = -Math.PI / 2 - s / r; return {x: xa + r * Math.cos(t), y: yb + r * Math.sin(t), a: t - Math.PI / 2}; }
    case 2: return {x: xa - r, y: yb + s, a: Math.PI / 2};                  // rear upright
    case 3: { const t = Math.PI - s / r; return {x: xa + r * Math.cos(t), y: yt + r * Math.sin(t), a: t - Math.PI / 2}; }
    case 4: return {x: xa + s, y: yt + r, a: 0, top: true};                 // return run, rear→front
    case 5: { const t = Math.PI / 2 - s / r; return {x: xb + r * Math.cos(t), y: yt + r * Math.sin(t), a: t - Math.PI / 2}; }
    case 6: return {x: xb + r, y: yt - s, a: -Math.PI / 2};                 // front upright
    default: { const t = 0 - s / r; return {x: xb + r * Math.cos(t), y: yb + r * Math.sin(t), a: t - Math.PI / 2}; }
  }
}
// ---------------------------------------------------------------- derived: hollow shoe + mass
const sigA = S.S690 / I.shoe.SF, tauA = sigA / Math.sqrt(3);
function hollowShoe(b) {
  const h = tPin, tBend = I.shoe.pDesign * b * b / (32 * sigA * h), t = Math.max(I.shoe.tMin, tBend);
  const V = 2 * b * pitch * t + I.shoe.nWeb * b * h * I.shoe.tWeb;
  return {m: S.rho_st * V * (1 + I.shoe.extra), tBend, t, h};
}
export const SHOE = hollowShoe(I.beltW), PODSHOE = hollowShoe(I.podBeltW);
const env = (L, W, H) => L * W * H;
export const MASS = (() => {
  const shoes = 4 * MAIN.N * SHOE.m + 4 * POD.N * PODSHOE.m;
  const frames = S.PRE_rho * I.runningGearK * 0.5 * (2 * env(MAIN.Lx + 2 * rS, I.unitW, I.unitH) + 2 * env(POD.Lx + 2 * rP, I.podW, I.podH));
  const hull = S.PRE_rho * env(I.hullL, I.beam, I.hullH);
  const upper = S.PRE_rho * env(I.upL, I.upW, I.upH);
  const boom = S.rho_st * Math.PI * I.boomD * (I.boomD / 100) * I.boomL;
  const total = (shoes + frames + hull + upper + boom) * I.outfit;
  return {shoes, frames, hull, upper, boom, total};
})();
export const W = MASS.total * S.g;
export const A_CONTACT = 4 * I.beltW * MAIN.Lx + 4 * I.podBeltW * POD.Lx * 0.8;   // I: pods bear on 80% of run
export const V_BUOY = I.sealed * (2 * env(MAIN.Lx + 2 * rS, I.unitW, I.unitH) + 2 * env(POD.Lx + 2 * rP, I.podW, I.podH));
export const DRAFT = I.unitH * (MASS.total / S.rho_sw) / V_BUOY;
const MU = S.CT_P_trac / (S.CT_v * S.CT_W_max);
// road wheels: evenly spaced under the main bottom run, both sides
export const ROAD = Array.from({length: I.nRoad}, (_, i) => MAIN.xa + (i + 0.5) * MAIN.Lx / I.nRoad);

export function terrain(xw, z, on = true) {
  if (!on) return 0;
  const T = I.terrain;
  return T.a1 * Math.sin(2 * Math.PI * xw / T.l1) + T.a2 * Math.sin(2 * Math.PI * xw / T.l2 + 1.3) + T.roll * Math.sin(2 * Math.PI * xw / 170 + z / 40);
}

/** the whole machine at time t. opts: {v, slew, elev, depth, terrain} */
export function state(t, o = {}) {
  const v = o.v ?? I.v, d = v * t, h = o.depth ?? 0, ton = o.terrain ?? true;
  // suspension: least-squares plane through ground under every road wheel (both sides)
  const pts = [];
  for (const zs of [I.laneZ, -I.laneZ]) for (const x of ROAD) pts.push([x, zs, terrain(d + x, zs, ton)]);
  const n = pts.length, mx = pts.reduce((s, p) => s + p[0], 0) / n, mz = pts.reduce((s, p) => s + p[1], 0) / n, mg = pts.reduce((s, p) => s + p[2], 0) / n;
  let sxx = 0, sxg = 0, szz = 0, szg = 0;
  for (const [x, z, g] of pts) { sxx += (x - mx) ** 2; sxg += (x - mx) * (g - mg); szz += (z - mz) ** 2; szg += (z - mz) * (g - mg); }
  const bx = sxg / sxx, bz = szg / szz;
  const plane = (x, z) => mg + bx * (x - mx) + bz * (z - mz);
  const strut = pts.map(([x, z, g]) => Math.max(-I.stroke, Math.min(I.stroke, g - plane(x, z))));
  // buoyancy & floating
  const subFrac = Math.max(0, Math.min(1, h / I.unitH));
  const B = S.rho_sw * S.g * V_BUOY * subFrac;
  const floating = B >= W;
  const Wn = Math.max(0, W - B);
  const p = Wn / A_CONTACT;
  const heave = floating ? Math.max(0, h - DRAFT) : mg;
  // drive
  const F = MU * Wn, P = F * v + (floating ? 0 : 0);
  const share = (4 * I.beltW * MAIN.Lx) / A_CONTACT;
  const omega = v / rS;
  const sweepT = t * 0.02;
  const slew = o.slew ?? 0.35 * Math.sin(sweepT), elev = o.elev ?? (0.08 + 0.07 * Math.sin(sweepT * 0.7));
  // pods: bogie pitch from local ground slope under each pod
  const podPitch = [I.podZ, -I.podZ].map((z) => {
    const xa = I.podX0 + 6, xb = I.podX0 + I.podLen - 6;
    return Math.atan2(terrain(d + xb, z, ton) - terrain(d + xa, z, ton), xb - xa) - Math.atan(bx);
  });
  return {
    t, d, v, h, slew, elev, floating, buoyN: B, Wn,
    hull: {heave, pitch: Math.atan(bx), roll: Math.atan(bz)},
    strut, maxStrut: Math.max(...strut.map(Math.abs)), podPitch,
    belt: d,                                  // arc length travelled by every link (no slip)
    sprocketAngle: d / rS, podAngle: d / rP, roadAngle: d / I.rRoad, sprocketRpm: omega * 60 / (2 * Math.PI),
    motorRpm: omega * 60 / (2 * Math.PI) * S.CT_ratio,
    trackSpeed: rS * omega, linkHz: v / pitch,
    pBar: p / 1e5, pRatio: p / S.B288_p, tractiveMN: F / 1e6, powerMW: P / 1e6, plantPct: P / S.SLP_plant,
    torqueMNm: F * share / 4 * rS / 1e6,
  };
}

export const CHECK = (() => {
  const s0 = state(10, {terrain: false});
  return [
    {id: 'H1', label: 'links × pitch = loop', got: MAIN.N * pitch, want: 2 * MAIN.Lx + 2 * MAIN.Ly + 2 * Math.PI * rS, unit: 'm', note: `${MAIN.N} × ${pitch.toFixed(3)} m; tensioner ${MAIN.take >= 0 ? '+' : ''}${MAIN.take.toFixed(2)} m`},
    {id: 'H2', label: 'track speed = r·ω', got: s0.trackSpeed, want: I.v, unit: 'm/s', note: `${rS.toFixed(2)} m × ${(I.v / rS).toFixed(4)} rad/s`},
    {id: 'H3', label: 'ground pressure ≤ Bagger 288', got: s0.pBar, want: S.B288_p / 1e5, unit: 'bar', le: true, note: `${(W / 1e9).toFixed(2)} GN / ${A_CONTACT.toFixed(0)} m²`},
  ];
})();
export const checkOK = (c) => (c.le ? c.got <= c.want * 1.02 : Math.abs(c.got - c.want) <= 0.02 * Math.abs(c.want));
