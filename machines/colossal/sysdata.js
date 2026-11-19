// COLOSSAL — the 7 internal systems: numbers, live sims, hand checks, failure states. Pure (runs under Node).
// Tags: S sourced (cite key), D derived (formula), I invented. Gun internals are visual only: no ballistic numbers.
import * as K from './kin.js';
const {I, MAIN, POD, MASS, W} = K;
const g = 9.81, rt3 = Math.sqrt(3);

export const CITE = {
  sleipnirGE: ['GE Power Conversion: Sleipnir case study', 'https://www.gepowerconversion.com/case-study/heerema-marine-contractors-semi-submersible-crane-vessel-sscv-sleipnir-the-worlds-largest-crane-vessel-powered-by-ge'],
  sleipnirWiki: ['SSCV Sleipnir (Wikipedia)', 'https://en.wikipedia.org/wiki/SSCV_Sleipnir'],
  khlRooms: ['KHL Cranes: 20,000 t heavy lift vessel completed', 'https://khl.com/1138754.article'],
  manDF: ['MAN L51/60DF product data (NauticExpo)', 'https://pdf.nauticexpo.com/pdf/man-energy-solutions-marine/man-l51-60df/21500-100450.html'],
  wst65: ['Wärtsilä: Sleipnir thrusters (WST-65RU / WST-65U)', 'https://www.wartsila.com/media/news/06-09-2019-wartsila-thrusters-contribute-to-successful-sea-trials-for-the-world-s-largest-sscv-2520128'],
  cable240: ['Nassau National Cable: 3×240 mm² BFOU, 398 A at 45 °C', 'https://nassaunationalcable.com/products/3-x-240-120-mm-bfou-p5-p12-power-and-control-0-6-1kv-fire-resistant-cable-03c240-z'],
  cableR: ['Caledonian P17 marine cable: 240 mm² 0.0762 Ω/km', 'https://caledonian-cables.net/product/Marine_Cables/P17_BU_0.6-1_kV.html'],
  a4vso: ['Bosch Rexroth A4VSO data (350 bar nominal, 1000 cm³, 1000 rpm)', 'https://paro.nl/library//storage/datasheets/BoschRexroth/EN/BR_re92020_2009-04.pdf/datasheet.html'],
  gastrut: ['Parker GaStrut: 4,000 psi nitrogen chamber (OEM Off-Highway)', 'https://www.oemoffhighway.com/drivetrains/article/10166605/mining-suspension'],
  jel: ['Hydraulics & Pneumatics: crawler JEL cylinders, 16 total, 4 per corner', 'https://www.hydraulicspneumatics.com/cylinders-actuators/new-jel-cylinders-give-youth-and-vitality-nasa-s-old-crawler-transporters'],
  ct: ['NASA KSC crawler-transporter fact sheet', 'https://www3.nasa.gov/centers/kennedy/pdf/167402main_crawlertransporters07.pdf'],
  slew3: ['THB three-row roller slewing bearing (2 axial + 1 radial rows)', 'https://directindustry.com/prod/thb-bearings/product-57112-2527190.html'],
  lieb: ['Liebherr 23.4 m segmented slewing bearing', 'https://www.liebherr.com/en-ca/n/new-dimensions-at-liebherr-%E2%80%93-slewing-bearing-with-a-diameter-of-23-metres-55360-3721326'],
  cfr: ['46 CFR 34.50-10: 40-B:C within 50 ft walking in machinery spaces', 'https://www.ecfr.gov/current/title-46/chapter-I/subchapter-D/part-34/subpart-34.50/section-34.50-10'],
  msc1275: ['IMO MSC.1/Circ.1275: public spaces 1 extinguisher per 250 m²', 'https://www.traficom.fi/files/media/regulation/22668-MSC_1-Circ_1275_-_Tulkinta_SOLAS_II-2.pdf'],
  shoeCrack: ['NASA NTRS: crawler shoe fatigue cracks (2003)', 'https://ntrs.nasa.gov/citations/20120003660'],
};

// ---------------------------------------------------------------- 1 POWER PLANT
const ENG = {n: 12, rooms: 4, perRoom: 3, P: 8e6, cyl: 8, kWcyl: 1000, rpm: 514, bore: 0.51, stroke: 0.60, swept: 122.6e-3, sfoc: 177.5};
// MAN L51/60DF: length 8,494 mm (6L) → 11,160 mm (9L); dry mass 106 → 148 t; width 3,165 → 3,283 mm. 8L interpolated (D).
ENG.L = 8.494 + (11.160 - 8.494) * (8 - 6) / 3; ENG.mass = 106 + (148 - 106) * 2 / 3; ENG.Wd = 3.165 + (3.283 - 3.165) * 2 / 3;
ENG.alt = {L: 4.6, D: 3.4, mass: 48};                                   // I: 8 MW alternator envelope
export const POWER = ENG;
const HOTEL = 4e6;                                                      // I: hotel + auxiliaries, W

// ---------------------------------------------------------------- 2 ELECTRICAL
export const ELEC = {Vmv: 11e3, Vlv: 690, pf: 0.9, eta: 0.96, cableA: 398, cableR: 0.0762e-3 /* Ω/m */, motorP: 1.5e6};
ELEC.motorI = ELEC.motorP / (rt3 * ELEC.Vlv * ELEC.pf * ELEC.eta);    // D 1,394 A
ELEC.cablesPerMotor = Math.ceil(ELEC.motorI / ELEC.cableA);           // D 4 × 3×240 mm²
ELEC.genI = ENG.P / (rt3 * ELEC.Vmv * ELEC.pf);                       // D 467 A at 11 kV

// ---------------------------------------------------------------- 3 TRACTION DRIVETRAIN
export const DRIVE = {motorsMain: 10, motorsPod: 4, rpm: 1190, finalRatio: K.S.CT_ratio, pinionT: 23};
DRIVE.sprocketRpmRated = I.v / K.rS * 60 / (2 * Math.PI);
DRIVE.totalRatio = DRIVE.rpm / DRIVE.sprocketRpmRated;                 // D
DRIVE.stage1 = DRIVE.totalRatio / DRIVE.finalRatio;                    // D first (combining) stage
DRIVE.installedMW = (4 * DRIVE.motorsMain + 4 * DRIVE.motorsPod) * ELEC.motorP / 1e6;

// ---------------------------------------------------------------- 4 SUSPENSION
export const SUSP = {pStatic: 250e5, nCyl: 4, pRatioMax: 3, gamma: 1.4, stations: 2 * I.nRoad};   // I: gas pressure reaches 3× static at full bump
{
  const mainShare = (4 * I.beltW * MAIN.Lx) / K.A_CONTACT;
  SUSP.load = W * mainShare / SUSP.stations;                           // D static load per wheel station, N
  SUSP.A = SUSP.load / SUSP.pStatic;                                   // D piston area per station
  SUSP.bore = Math.sqrt(4 * (SUSP.A / SUSP.nCyl) / Math.PI);           // D bore of each of 4 cylinders
  const r = Math.pow(SUSP.pRatioMax, 1 / SUSP.gamma);                 // V0/(V0 − A·s) = 3^(1/γ)
  SUSP.V0 = r * SUSP.A * I.stroke / (r - 1);                           // D gas volume per station
  SUSP.fn = Math.sqrt(SUSP.gamma * SUSP.A * g / SUSP.V0) / (2 * Math.PI);   // D ride frequency
}

// ---------------------------------------------------------------- 5 SLEWING
export const SLEW = {D: I.ringD, rows: 3, roller: 0.30, pitch: 0.40, drives: 24, module: 0.05, pinT: 18, mu: 0.006, C0: 30e6, rate: 0.05 * Math.PI / 180};
SLEW.N = Math.round(Math.PI * SLEW.D / SLEW.pitch);                   // D rollers per axial row
SLEW.ringT = Math.round(SLEW.D / SLEW.module);                         // D ring gear teeth
SLEW.massUp = MASS.upper + MASS.boom + ENG.n * (ENG.mass + ENG.alt.mass) * 1e3;
// ---------------------------------------------------------------- 6 GUN / ELEVATION (hydraulics sourced, gun internals visual only)
export const GUN = {rCG: 70, lever: 28, rams: 2, p: 350e5, pump: {V: 1e-3, rpm: 1000}, rateMax: 0.1 * Math.PI / 180};   // I: 0.1°/s elevation rate
GUN.Mmax = MASS.boom * g * GUN.rCG;                                    // D at 0° elevation
GUN.Fram = GUN.Mmax / GUN.lever / GUN.rams;                            // D per ram
GUN.ramA = GUN.Fram / GUN.p; GUN.ramBore = Math.sqrt(4 * GUN.ramA / Math.PI);
GUN.pumpQ = GUN.pump.V * GUN.pump.rpm / 60;                            // D m³/s per pump
GUN.Qneed = GUN.rams * GUN.ramA * GUN.lever * GUN.rateMax;             // D at max elevation rate
GUN.pumps = Math.ceil(GUN.Qneed / GUN.pumpQ) + 1;                      // D +1 standby
GUN.pumpkW = GUN.p * GUN.pumpQ / 1e3;

// ---------------------------------------------------------------- 7 HULL, BUOYANCY, MARINE & FIRE SAFETY
export const HULL = {compartments: 8, ballastFrac: 0.2, pumps: 4, pumpQ: 2000 / 3600, thrusters: Math.ceil(K.S.SLP_thr * (MASS.total / K.S.SLP_disp) ** (2 / 3) / 5.5e6), KG: 38, extSpacing: 15.25, areaPerExt: 250};
{
  const L = MAIN.Lx + 2 * K.rS, B = I.unitW, y = I.laneZ;
  HULL.Iwp = 2 * (L * B ** 3 / 12 + L * B * y * y);                    // D waterplane inertia, two pontoons
  HULL.Awp = 2 * L * B;
}

/** live state of all 7 systems, from the machine state S and toggles */
export function systems(S, o = {}) {
  const trip = o.trip || {};
  // 1 power demand
  const slewW = (() => { const Fa = SLEW.massUp * g; const T = SLEW.mu * (Fa * SLEW.D / 2); return T * SLEW.rate; })();
  const gunW = o.elevRate ? GUN.pumpkW * 1e3 * Math.min(1, Math.abs(o.elevRate) / GUN.rateMax) * (GUN.pumps - 1) : 0.15 * GUN.pumpkW * 1e3;
  const thrustW = S.floating ? 0.4 * HULL.thrusters * 5.5e6 : 0;
  const tracW = S.powerMW * 1e6;
  const Pdem = tracW + slewW + gunW + thrustW + HOTEL;
  let nOn = Math.max(2, Math.ceil(Pdem / (0.9 * ENG.P)) + 1);           // N+1 spinning reserve
  nOn = Math.min(nOn, ENG.n - (trip.gen ? 1 : 0));
  const cap = nOn * ENG.P, loadPct = Pdem / cap, shed = Pdem > cap;
  const fuelKgH = Pdem / 1e3 * ENG.sfoc / 1e3;
  const firingHz = ENG.rpm / 60 * ENG.cyl / 2;
  // 2 electrical
  const genI = ELEC.genI * Math.min(1, Pdem / nOn / ENG.P);
  const hullW = tracW + thrustW;                                         // crosses the slip ring
  const slipI = hullW / (rt3 * ELEC.Vmv * ELEC.pf);
  const beltW = tracW * ((4 * I.beltW * MAIN.Lx) / K.A_CONTACT) / 4;
  const motorsUp = DRIVE.motorsMain - (trip.motor ? 1 : 0);
  const motorLoad = beltW / (motorsUp * ELEC.motorP);
  const motorI = ELEC.motorI * motorLoad;
  const cableUtil = motorI / (ELEC.cablesPerMotor * ELEC.cableA);
  const lossW = (len) => 3 * (motorI / ELEC.cablesPerMotor) ** 2 * ELEC.cableR * len * ELEC.cablesPerMotor;
  // 3 drivetrain
  const wS = I.v / K.rS * (S.v / I.v), sprRpm = wS * 60 / (2 * Math.PI);
  const motRpm = sprRpm * DRIVE.totalRatio, s1Rpm = motRpm / DRIVE.stage1;
  const Tspr = beltW / Math.max(wS, 1e-9), Tmot = beltW / motorsUp / Math.max(motRpm * 2 * Math.PI / 60, 1e-9);
  const meshHz = motRpm / 60 * DRIVE.pinionT;
  // 4 suspension (gas spring per station, compression from terrain)
  const p = S.strut.map((x) => SUSP.pStatic * Math.pow(SUSP.V0 / Math.max(1e-6, SUSP.V0 - SUSP.A * x), SUSP.gamma) * (S.Wn / W));
  const pMax = Math.max(...p), bottom = S.maxStrut >= I.stroke * 0.98, pRatio = pMax / SUSP.pStatic;
  const k = SUSP.gamma * SUSP.pStatic * SUSP.A ** 2 / SUSP.V0;
  // 5 slewing
  const Fa = SLEW.massUp * g;
  const deckArm = -40;                                                   // I: deck centroid aft of the slew axis (40 m aft overhang)
  const M = g * (MASS.boom * (80 + GUN.rCG) * Math.cos(S.elev) + MASS.upper * deckArm);
  const Pmax = Fa / SLEW.N + 4 * Math.abs(M) / (SLEW.N * SLEW.D);
  const Tslew = SLEW.mu * (Fa * SLEW.D / 2 + 2.2 * Math.abs(M));
  // 6 gun elevation
  const Mt = MASS.boom * g * GUN.rCG * Math.cos(S.elev);
  const pRam = Mt / GUN.lever / GUN.rams / GUN.ramA;
  // 7 hull & marine
  const Vdisp = MASS.total / K.S.rho_sw, KB = K.DRAFT / 2, BM = HULL.Iwp / Vdisp, GM = KB + BM - HULL.KG;
  const floodV = trip.flood ? (K.V_BUOY / 2) / HULL.compartments : 0;
  const heel = Math.atan(floodV * I.laneZ / (Vdisp * Math.max(GM, 0.1)));
  const ballastH = (HULL.Awp * 1) / (HULL.pumps * HULL.pumpQ) / 3600;    // h per metre of draft
  return {
    power: {Pdem, nOn, cap, loadPct, shed, fuelKgH, firingHz, perGen: Pdem / nOn},
    elec: {genI, slipI, motorI, cableUtil, lossW, motorLoad},
    drive: {sprRpm, motRpm, s1Rpm, Tspr, Tmot, meshHz, motorsUp, overload: motorLoad > 1},
    susp: {p, pMax, pRatio, bottom, k, fn: SUSP.fn},
    slew: {Fa, M, Pmax, ratio: Pmax / SLEW.C0, Tslew, Pw: Tslew * SLEW.rate},
    gun: {Mt, pRam, ratio: pRam / GUN.p},
    hull: {GM, BM, heel, ballastH, floodV, thrusters: S.floating ? 'DEPLOYED' : 'RETRACTED'},
  };
}

export const SYS_CHECKS = () => {
  const out = [];
  const add = (sys, id, label, got, want, unit, note, le = false) => out.push({sys, id, label, got, want, unit, note, le});
  add(1, 'P1', '12 gensets × 8 MW = plant', ENG.n * ENG.P / 1e6, 96, 'MW', 'Sleipnir: 12 × 8 MW, 3 per engine room × 4 rooms');
  add(1, 'P2', 'cyl × kW/cyl = genset', ENG.cyl * ENG.kWcyl / 1e3, ENG.P / 1e6, 'MW', '8L51/60DF: 8 × 1,000 kW at 514 rpm');
  add(2, 'E1', 'motor current ≤ cable rating', ELEC.motorI, ELEC.cablesPerMotor * ELEC.cableA, 'A', `${ELEC.cablesPerMotor} × 3×240 mm² at 398 A`, true);
  add(3, 'T1', 'motor rpm ÷ total ratio = sprocket rpm', DRIVE.rpm / DRIVE.totalRatio, DRIVE.sprocketRpmRated, 'rpm', `1:${DRIVE.stage1.toFixed(2)} × 168:1`);
  add(4, 'S1', 'station load ÷ piston area = 250 bar', SUSP.load / SUSP.A / 1e5, 250, 'bar', `${SUSP.nCyl} × Ø${SUSP.bore.toFixed(2)} m cylinders`);
  add(4, 'S2', 'gas pressure ≤ GaStrut ceiling', SUSP.pStatic / 1e5, 4000 * 0.0689476, 'bar', 'Parker nitrogen chamber 4,000 psi', true);
  add(5, 'R1', 'max roller load ≤ C0 (I)', (SLEW.massUp * g / SLEW.N + 4 * Math.abs(g * (MASS.boom * 150 - MASS.upper * 40)) / (SLEW.N * SLEW.D)) / 1e6, SLEW.C0 / 1e6, 'MN', `${SLEW.N} rollers per axial row`, true);
  add(6, 'G1', 'ram pressure at 0° = 350 bar', GUN.Mmax / GUN.lever / GUN.rams / GUN.ramA / 1e5, 350, 'bar', `2 rams Ø${GUN.ramBore.toFixed(2)} m on a ${GUN.lever} m lever`);
  const Vd = MASS.total / K.S.rho_sw, GM = K.DRAFT / 2 + HULL.Iwp / Vd - HULL.KG;
  add(7, 'H1', 'metacentric height GM > 0', GM, 0, 'm', `BM ${(HULL.Iwp / Vd).toFixed(1)} m, KG ${HULL.KG} m (I)`, false);
  return out;
};
export const sysOK = (c) => (c.id === 'H1' ? c.got > c.want : c.le ? c.got <= c.want * 1.02 : Math.abs(c.got - c.want) <= 0.02 * Math.abs(c.want));
