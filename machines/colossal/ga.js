// COLOSSAL general arrangement: every volume of the machine is a numbered compartment with a role, a purpose and
// the equipment that does that job. Compartments that the 7 engineered systems already fill are tagged to that
// system (no duplicate furniture); everything else is fitted from the Blender equipment library (blender/s9_equip.py).
// Code format: REGION-DECK-FRAME-BAND, e.g. UP-08-F06-P2 (upper block, deck 8, frame 6, port band 2).
// Layout is INVENTED but follows carrier/cruise-ship practice: machinery low, hotel services mid, command high,
// magazines beside the gun, tanks in the double bottom, sensors/comms rooms under their antennas.
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// ------------------------------------------------------------------ roles: name, category, recipe, crew, purpose
export const CAT = {
  machinery: {c: '#7a5a3a', l: 'Machinery'}, electrical: {c: '#c79a1a', l: 'Electrical'}, hotel: {c: '#3f7d4e', l: 'Hotel / life support'},
  berthing: {c: '#2c6aa0', l: 'Accommodation'}, command: {c: '#a02c2c', l: 'Command & control'}, comms: {c: '#6a3fa0', l: 'Sensors & comms'},
  weapons: {c: '#8a1f1f', l: 'Weapons & munitions'}, stores: {c: '#7d7a72', l: 'Stores'}, tanks: {c: '#2a5f8a', l: 'Tanks'},
  safety: {c: '#d0451b', l: 'Safety & damage control'}, aviation: {c: '#4a6a2a', l: 'Aviation & boats'}, running: {c: '#55585c', l: 'Running gear'}, system: {c: '#1b1c1e', l: 'Engineered system'},
};
export const ROLES = {
  // machinery
  eng_workshop: ['Engine workshop', 'machinery', 'workshop', 4, 'Overhaul bay for genset cylinder heads, injectors and turbocharger cartridges; lathe, benches and a 5 t hoist.'],
  spares: ['Machinery spares store', 'stores', 'stores', 0, 'Critical spares for the 12 gensets: liners, pistons, valves, gaskets, bearings — racked by engine and labelled for 30-day autonomy.'],
  separator: ['Fuel separator room', 'machinery', 'pumps', 1, 'Centrifugal separators clean MGO pilot fuel before the day tanks; sludge drains to the double-bottom sludge tank.'],
  purifier: ['Lube oil purifier room', 'machinery', 'pumps', 1, 'Continuous lube-oil purification for the gensets and the 4 traction gearboxes; heaters, purifiers and transfer pumps.'],
  airroom: ['Starting & control air room', 'machinery', 'tanks_v', 0, '30 bar starting-air receivers and compressors for the gensets; 7 bar control air for valves and the gun hoist.'],
  ecr: ['Engine control room', 'command', 'consoles', 4, 'Machinery control: genset load sharing, fuel switch-over (LNG/MGO), alarms and the power-management system.'],
  hvac: ['HVAC plant room', 'hotel', 'hvac', 1, 'Air handling units, chillers and heat-recovery coils; keeps electronics rooms at 22 °C and berthing at positive pressure (citadel).'],
  chilled: ['Chilled water plant', 'hotel', 'hvac', 1, 'Chillers and pumps for the combat-system and server cooling loops (redundant A/B loops).'],
  water: ['Water maker room', 'hotel', 'water', 1, 'Reverse-osmosis units make fresh water from sea water; mineralisation and UV sterilisation before storage.'],
  sewage: ['Sewage treatment plant', 'hotel', 'water', 0, 'Biological treatment of black/grey water to MARPOL standard before discharge or holding.'],
  firepumps: ['Fire & bilge pump room', 'safety', 'pumps', 0, 'Duty/standby fire pumps pressurise the fire main; bilge ejectors serve the zone below.'],
  emgen: ['Emergency generator room', 'electrical', 'emgen', 0, 'Independent emergency diesel generator above the waterline; restores steering, lighting and fire pumps within 45 s.'],
  hydraulic: ['Hydraulic workshop', 'machinery', 'workshop', 2, 'Hose crimping, valve and cylinder overhaul for the suspension struts and gun rams; clean-room bench.'],
  heavy_ws: ['Heavy workshop', 'machinery', 'workshop', 4, 'Welding, machining and fabrication for structure and running-gear repairs; overhead crane to the hull hatch.'],
  track_ws: ['Track maintenance workshop', 'running', 'workshop', 4, 'Shoe, pin and bushing replacement; pin press and handling crane serving the belt access doors.'],
  shoe_store: ['Spare track-shoe store', 'stores', 'shoes', 0, 'Spare hollow cast shoes, pins and bushings: 2 % of fitted shoes carried, rotated in on crane.'],
  track_lube: ['Track lube station', 'running', 'pumps', 0, 'Centralised grease and oil for the road-wheel bearings and track pins on this belt.'],
  track_hpu: ['Belt hydraulic power unit', 'running', 'hydraulic', 0, 'Local hydraulic power for the belt tensioner and the strut isolation valves.'],
  cooling: ['Cooling water pump room', 'machinery', 'pumps', 0, 'Sea-water / fresh-water coolers and pumps for traction motors and gearboxes on this belt.'],
  inspection: ['Belt inspection gallery', 'running', 'gallery', 1, 'Walkway along the belt with inspection ports onto road wheels, struts and the upper belt run.'],
  // electrical
  battery: ['Battery room', 'electrical', 'battery', 0, 'Li-ion banks for UPS, black-start and combat-system ride-through; ventilated and gas-monitored.'],
  ups: ['UPS & LV distribution room', 'electrical', 'electrical', 1, 'Uninterruptible power for command, sensors and comms; 690/440/230 V distribution boards.'],
  cablespread: ['Cable spreading room', 'electrical', 'electrical', 0, 'Where the MV/LV cable routes split to each zone; fire-stopped transits and tray risers.'],
  elec_ws: ['Electrical workshop', 'electrical', 'workshop', 2, 'Motor rewinds, breaker testing and instrumentation calibration.'],
  // hotel
  cold: ['Provisions cold store', 'hotel', 'cold', 0, 'Chilled and frozen stores: 60 days of food for the crew.'],
  dry: ['Dry provisions store', 'stores', 'stores', 0, 'Dry goods, water, galley consumables on pallets.'],
  galley: ['Galley', 'hotel', 'galley', 6, 'Main kitchen feeding the crew in 4 sittings; ranges, kettles, prep benches, cold rooms adjacent.'],
  bakery: ['Bakery & scullery', 'hotel', 'galley', 2, 'Bread and dishwashing for the galley.'],
  laundry: ['Laundry', 'hotel', 'laundry', 1, 'Industrial washers and dryers for crew clothing and bedding.'],
  garbage: ['Garbage handling room', 'hotel', 'stores', 0, 'Sorting, compaction and incineration feed; MARPOL Annex V compliant.'],
  mess: ['Crew mess deck', 'hotel', 'mess', 10, 'Dining and recreation for junior rates; serving line from the galley.'],
  mess_sr: ['Senior rates mess', 'hotel', 'mess', 6, 'Dining for senior ratings.'],
  wardroom: ['Wardroom', 'hotel', 'mess', 4, 'Officers\' dining and meeting room.'],
  medical: ['Medical bay', 'hotel', 'medical', 2, 'Sick bay with 6 beds, treatment room and casualty reception; doubles as the first-aid post.'],
  gym: ['Gym', 'hotel', 'gym', 2, 'Treadmills and weights for crew fitness.'],
  lounge: ['Crew lounge', 'hotel', 'mess', 3, 'Recreation, video and quiet study.'],
  sanitary: ['Sanitary block', 'hotel', 'sanitary', 0, 'Heads and showers for the adjacent berthing.'],
  berth: ['Crew berthing (24)', 'berthing', 'berthing', 4, 'Three-tier bunks and lockers for 24 junior rates, one watch per section.'],
  berth_sr: ['Senior rates cabins', 'berthing', 'cabins', 2, 'Two-berth cabins for senior ratings.'],
  cabins: ['Officers\' cabins', 'berthing', 'cabins', 1, 'Single cabins with desk for officers.'],
  // command & comms
  cic: ['Combat Information Centre', 'command', 'cic', 10, 'Tactical picture: sensors, weapons and comms fused onto consoles and the display wall; command and weapons direction.'],
  server: ['Combat-system server room', 'comms', 'server', 1, 'Redundant processing for the combat management system; racks in hot/cold aisles on the chilled-water loop.'],
  sensorproc: ['Sensor processing room', 'comms', 'server', 1, 'Signal processors for the AESA faces and long-range radar, directly below the mast.'],
  ew: ['Electronic warfare suite', 'comms', 'consoles', 3, 'ESM intercept and jammer control; analysts on consoles with RF racks behind.'],
  commcen: ['Communications centre', 'comms', 'consoles', 4, 'HF/UHF/SATCOM radio rooms, message handling and the tactical data link.'],
  crypto: ['Crypto vault', 'comms', 'server', 1, 'Key management and encryption equipment; restricted access.'],
  ops: ['Operations planning room', 'command', 'briefing', 6, 'Mission planning and the daily operations brief.'],
  offices: ['Command offices', 'command', 'cabins', 2, 'Commanding officer, executive officer and heads of department.'],
  briefing: ['Briefing room', 'command', 'briefing', 0, 'Seating for 40 with a video wall: flight and boat crew briefings.'],
  radarroom: ['Radar equipment room', 'comms', 'server', 1, 'Transmit/receive cabinets and cooling for the AESA faces above.'],
  rfroom: ['RF & antenna feed room', 'comms', 'server', 0, 'Waveguides, combiners and amplifiers between the mast antennas and the comms centre.'],
  flightops: ['Flight operations room', 'aviation', 'consoles', 3, 'Helideck control, aviation weather and aircraft status.'],
  hangar_sup: ['Hangar support workshop', 'aviation', 'workshop', 2, 'Aircraft spares, tools and avionics bench next to the hangar.'],
  training: ['Training room', 'command', 'briefing', 0, 'Classroom and simulator stations.'],
  armoury: ['Armoury', 'weapons', 'armoury', 0, 'Small arms and ammunition for the security team; racked, alarmed.'],
  dchq: ['Damage control HQ', 'safety', 'consoles', 3, 'Watertight doors, flooding, fire detection and the firefighting teams are run from here.'],
  dclocker: ['Damage control locker', 'safety', 'stores', 0, 'Breathing apparatus, shoring timber, pumps and firefighting kit for the zone.'],
  // weapons
  firecontrol: ['Gun fire-control room', 'weapons', 'consoles', 4, 'Gun laying, ballistic computation (not modelled) and the load cycle are controlled here.'],
  ammo_ws: ['Ammunition workshop', 'weapons', 'ammo', 2, 'Fuze fitting and inspection of projectiles before they go to the hoist.'],
  hoistroom: ['Hoist machinery room', 'weapons', 'hydraulic', 1, 'Winches, brakes and hydraulic drives for the projectile/charge hoist.'],
  recoilfluid: ['Recoil fluid conditioning', 'weapons', 'hydraulic', 0, 'Filters, coolers and reserve fluid for the 4 recoil cylinders.'],
  readyroom: ['Gun crew ready room', 'weapons', 'briefing', 4, 'Standby space for the gun and magazine crews.'],
  floodvalve: ['Magazine flooding valve room', 'safety', 'pumps', 0, 'Remote and manual valves that flood the magazines with sea water in a fire.'],
  // stores / misc
  stores: ['General stores', 'stores', 'stores', 0, 'Consumables, spares and equipment for the zone.'],
  rope: ['Mooring & rope store', 'stores', 'stores', 0, 'Mooring lines, towing gear and fenders for water operations.'],
  paint: ['Paint store', 'stores', 'stores', 0, 'Flammable store with CO₂ protection.'],
  garage: ['Vehicle garage', 'aviation', 'garage', 1, 'All-terrain vehicles and a recovery tractor for operations off the machine.'],
  // tanks (double bottom)
  t_fuel: ['MGO fuel tank', 'tanks', 'tank', 0, 'Marine gas oil: pilot fuel and back-up for the dual-fuel gensets.', 0x8a6a2a],
  t_fw: ['Fresh water tank', 'tanks', 'tank', 0, 'Potable water from the water makers.', 0x4aa0d8],
  t_lube: ['Lube oil storage tank', 'tanks', 'tank', 0, 'Fresh lube oil for the gensets and gearboxes.', 0xa08a2a],
  t_sludge: ['Sludge & bilge holding tank', 'tanks', 'tank', 0, 'Separator sludge and oily bilge water held for shore disposal.', 0x3a3020],
  t_coff: ['Cofferdam', 'tanks', 'tank', 0, 'Void separating fuel from fresh water tanks — kept dry and inspected; required by class rules.', 0xbfbfbf],
  t_hyd: ['Hydraulic oil reserve tank', 'tanks', 'tank', 0, 'Make-up oil for suspension and gun hydraulics.', 0x7a8a3a],
  running: ['Running gear space', 'running', 'none', 0, 'Belt, road wheels and sprockets run here (see the drivetrain and suspension systems).'],
};

// ------------------------------------------------------------------ zoning tables (deck index -> role pool, chosen by band/frame)
const UPZ = [
  ['eng_workshop', 'spares', 'separator', 'purifier', 'airroom', 'firepumps'],
  ['ecr', 'elec_ws', 'spares', 'hvac', 'chilled', 'stores'],
  ['battery', 'ups', 'cablespread', 'transformer_x', 'hvac', 'dclocker'],
  ['water', 'sewage', 'firepumps', 'dclocker', 'stores', 'chilled'],
  ['cold', 'dry', 'galley', 'bakery', 'laundry', 'garbage'],
  ['mess', 'mess_sr', 'wardroom', 'medical', 'gym', 'lounge'],
  ['berth', 'berth', 'sanitary', 'lounge', 'berth', 'dchq'],
  ['berth', 'berth_sr', 'cabins', 'sanitary', 'training', 'armoury'],
  ['cic', 'server', 'sensorproc', 'ew', 'commcen', 'crypto'],
  ['ops', 'offices', 'briefing', 'radarroom', 'rfroom', 'flightops', 'hangar_sup', 'emgen'],
];
const NOSEZ = [['hoistroom', 'floodvalve', 'ammo_ws'], ['ammo_ws', 'recoilfluid', 'hoistroom'], ['firecontrol', 'readyroom', 'dclocker'],
  ['firecontrol', 'stores', 'hvac'], ['readyroom', 'ups', 'stores'], ['stores', 'rfroom', 'hvac']];
const HULLZ = [['t_fuel', 't_fw', 't_coff', 't_lube', 't_sludge', 't_hyd'], ['heavy_ws', 'track_ws', 'shoe_store', 'garage', 'hydraulic', 'firepumps'], ['stores', 'rope', 'paint', 'dclocker', 'stores', 'spares']];
const TFZ = [['track_lube', 'cooling', 'track_hpu'], ['inspection', 'shoe_store', 'track_lube'], ['cooling', 'track_hpu', 'inspection'], ['inspection', 'stores', 'dclocker']];
ROLES.transformer_x = ['Zone transformer room', 'electrical', 'electrical', 0, '690/440 V zone transformers feeding hotel and auxiliary loads.'];

function regions(I) {
  const up = [8, 12.2, 16.4, 20.6, 24.8, 29, 33.2, 37.4, 41.6, 45.8, 50];
  const nose = [8, 12.67, 17.33, 22, 26.67, 31.33, 36];
  const hull = [30, 33.33, 36.67, 40];
  const tf = [6, 10.5, 15, 19.5, 24];
  const R = [
    {id: 'UP', name: 'Upper block', frame: 'slew', x: [-150, 30], fx: 12, bands: [[-32, -16], [-16, -1.6], [1.6, 16], [16, 32]], corridor: [-1.6, 1.6], decks: up, zone: UPZ},
    {id: 'NO', name: 'Nose (gun) block', frame: 'slew', x: [30, 92], fx: 10.33, bands: [[-32, -18], [-18, -1.6], [1.6, 18], [18, 32]], corridor: [-1.6, 1.6], decks: nose, zone: NOSEZ,
      top: (x) => (x < 58 ? 50 - (x - 30) * 0.5 : 36), bot: (x) => (x > 70 ? 8 + (x - 70) * 4 / 22 : 8)},
    {id: 'HU', name: 'Hull', frame: 'rig', x: [0, 230], fx: 11.5, bands: [[-50, -37.5], [-37.5, -25], [-25, -12.5], [-12.5, -1.4], [1.4, 12.5], [12.5, 25], [25, 37.5], [37.5, 50]], corridor: [-1.4, 1.4], decks: hull, zone: HULLZ},
  ];
  for (const zs of [36, -36]) for (const sd of [1, -1]) {
    const a = zs + sd * 6.8, b = zs + sd * 14.2;
    R.push({id: `T${zs > 0 ? 'P' : 'S'}${sd > 0 ? 'O' : 'I'}`, name: `Track frame ${zs > 0 ? 'port' : 'starboard'} ${sd * Math.sign(zs) > 0 ? 'outboard' : 'inboard'} gallery`,
      frame: 'rig', x: [29, 142], fx: 11.3, bands: [[Math.min(a, b), Math.max(a, b)]], decks: tf, zone: TFZ});
  }
  return R;
}

// ------------------------------------------------------------------ build compartments + occupancy against the systems
export function buildGA({I, rig, slew, SYS, extraSys = []}) {
  rig.updateMatrixWorld(true);
  const invSlew = new THREE.Matrix4().copy(slew.matrixWorld).invert(), invRig = new THREE.Matrix4().copy(rig.matrixWorld).invert();
  // system mesh boxes in each frame
  const boxes = {slew: [], rig: []}, tmp = new THREE.Box3();
  const addBoxes = (n, root) => root.traverse((o) => {
    if (!(o.isMesh || o.isInstancedMesh) || o.userData.noOcc || o.geometry?.type === 'TubeGeometry' || (o.isInstancedMesh && o.count > 40)) return;   // cable runs + scattered instances don't occupy rooms
    let inSlew = false; for (let a = o; a; a = a.parent) if (a === slew) { inSlew = true; break; }
    tmp.setFromObject(o); if (tmp.isEmpty()) return;
    const b = tmp.clone().applyMatrix4(inSlew ? invSlew : invRig), s = b.getSize(new THREE.Vector3());
    if (Math.min(s.x, s.y, s.z) < 0.3 || s.x * s.y * s.z > 60000) return;          // skip plates/lines and whole-machine envelopes
    boxes[inSlew ? 'slew' : 'rig'].push({b, n, name: o.name});
  });
  for (const s of SYS) for (const g of s.groups) addBoxes(s.n, g);
  for (const [n, g] of extraSys) addBoxes(n, g);
  const comps = [], R = regions(I);
  for (const rg of R) {
    const nfx = Math.round((rg.x[1] - rg.x[0]) / rg.fx), fx = (rg.x[1] - rg.x[0]) / nfx;
    for (let d = 0; d < rg.decks.length - 1; d++) for (let f = 0; f < nfx; f++) for (let bi = 0; bi < rg.bands.length; bi++) {
      let x0 = rg.x[0] + f * fx, x1 = x0 + fx, y0 = rg.decks[d], y1 = rg.decks[d + 1]; const [z0, z1] = rg.bands[bi];
      if (rg.top) { const t = Math.min(rg.top(x0), rg.top(x1)); if (y0 >= t - 1.5) continue; y1 = Math.min(y1, t); }
      if (rg.bot) { const b = Math.max(rg.bot(x0), rg.bot(x1)); if (y1 <= b + 1.5) continue; y0 = Math.max(y0, b); }
      const cb = new THREE.Box3(new THREE.Vector3(x0, y0, z0), new THREE.Vector3(x1, y1, z1)), vol = (x1 - x0) * (y1 - y0) * (z1 - z0);
      const occ = {}; let tot = 0;
      for (const B of boxes[rg.frame]) { if (!B.b.intersectsBox(cb)) continue; const ib = B.b.clone().intersect(cb), s = ib.getSize(new THREE.Vector3()), v = s.x * s.y * s.z; occ[B.n] = (occ[B.n] || 0) + v; tot += v; }
      const side = (z0 + z1) / 2 > 0 ? 'P' : 'S', bandNo = rg.bands.length > 1 ? Math.min(bi, rg.bands.length - 1 - bi) + 1 : 1;
      const code = `${rg.id}-${String(d + 1).padStart(2, '0')}-F${String(f + 1).padStart(2, '0')}-${side}${bandNo}`;
      let role, sys = 0;
      if (tot / vol > 0.1) { sys = +Object.entries(occ).sort((a, b) => b[1] - a[1])[0][0]; role = `sys${sys}`; }
      else { const pool = rg.zone[Math.min(d, rg.zone.length - 1)]; role = pool[(f * 7 + bi * 3 + d * 5) % pool.length]; if (rg.id === 'HU' && d === 0 && (f + bi) % 5 === 2) role = 't_coff'; }
      if (rg.id[0] === 'T' && d === 0 && (f === 0 || f === nfx - 1)) { role = 'running'; }
      comps.push({code, region: rg, frame: rg.frame, d, f, bi, x0, x1, y0, y1, z0, z1, role, sys, occ: tot / vol});
    }
  }
  return comps;
}

// ------------------------------------------------------------------ furnishing (recipes) -> list of {type, x, y, z, ry, sy}
function lay(c) {
  const out = [], P = (type, x, z, ry = 0, sy = 1) => out.push({type, x, y: c.y0 + 0.12, z, ry, sy});
  const W = c.x1 - c.x0, Dz = c.z1 - c.z0, cx = (c.x0 + c.x1) / 2, cz = (c.z0 + c.z1) / 2, H = c.y1 - c.y0;
  const R = ROLES[c.role] || ROLES.stores, recipe = R[2], inner = Math.abs(c.z0) < Math.abs(c.z1) ? c.z0 : c.z1, outer = inner === c.z0 ? c.z1 : c.z0;
  const toIn = Math.sign(inner - outer) || 1;                                           // direction from outer wall toward the corridor
  const rowX = (step, m0 = 1.2) => { const n = Math.max(1, Math.floor((W - 2 * m0) / step)), o = []; for (let i = 0; i < n; i++) o.push(c.x0 + m0 + (i + 0.5) * (W - 2 * m0) / n); return o; };
  const wallZ = (wz, off) => wz + Math.sign(cz - wz) * off, faceIn = (wz) => (Math.sign(cz - wz) > 0 ? 0 : Math.PI);
  const crew = (n, kind = 'crew_stand') => { for (let i = 0; i < n; i++) P(i % 3 === 2 ? 'crew_orange' : kind, c.x0 + 2 + ((i * 3.7) % (W - 4)), cz + ((i * 1.9) % (Dz - 3)) - (Dz - 3) / 2, i * 1.3); };
  switch (recipe) {
    case 'berthing': for (const x of rowX(1.1, 1.0)) { P('bunk3', x, wallZ(outer, 0.5), faceIn(outer) + Math.PI / 2 * 0); P('bunk3', x, wallZ(inner, 1.4), faceIn(inner)); }
      for (const x of [c.x0 + 0.5, c.x1 - 0.5]) for (let k = 0; k < 4; k++) P('locker', x, c.z0 + Dz * (0.3 + k * 0.12), x < cx ? Math.PI / 2 : -Math.PI / 2); crew(R[3]); break;
    case 'cabins': for (const x of rowX(4)) { P('bunk3', x - 1, wallZ(outer, 0.5), faceIn(outer), 0.36); P('console', x + 0.6, wallZ(outer, 0.5), faceIn(outer)); P('chair', x + 0.6, wallZ(outer, 1.4), faceIn(outer) + Math.PI); P('locker', x + 1.6, wallZ(inner, 1.6), faceIn(inner)); }
      crew(R[3], 'crew_seated'); break;
    case 'consoles': case 'cic':
      P('displaywall', cx, wallZ(outer, 0.2), faceIn(outer));
      for (let r = 0; r < (recipe === 'cic' ? 3 : 2); r++) for (const x of rowX(1.6)) { const z = cz + (r - 0.5) * 2.6 * toIn * -1 + toIn * 0.8; P('console', x, z, faceIn(outer)); P('chair', x, z + Math.sign(cz - outer) * 0.9, faceIn(outer)); if ((x | 0) % 3 === 0) P('crew_seated', x, z + Math.sign(cz - outer) * 0.9, faceIn(outer) + Math.PI); }
      if (recipe === 'cic') P('plot_table', cx, wallZ(inner, 2.2), 0);
      for (const x of rowX(0.7, 2)) P('rack', x, wallZ(inner, 0.6), faceIn(inner));
      crew(2); break;
    case 'server': for (let r = 0; r < Math.max(1, Math.floor((Dz - 2) / 2.6)); r++) for (const x of rowX(0.65, 1.5)) P(r % 3 === 1 ? 'sensor_rack' : 'rack', x, c.z0 + 1.6 + r * 2.6, r % 2 ? Math.PI : 0); crew(R[3]); break;
    case 'workshop': for (const x of rowX(2.8)) P('workbench', x, wallZ(outer, 0.5), faceIn(outer));
      P('lathe', cx - W * 0.2, cz, 0); P('shelf', c.x1 - 1.6, wallZ(inner, 0.7), faceIn(inner)); P('shelf', c.x0 + 1.6, wallZ(inner, 0.7), faceIn(inner)); P('crane_hoist', cx, cz, 0, 1); out.at(-1).y = c.y1 - 0.1; crew(R[3], 'crew_orange'); break;
    case 'stores': for (let r = 0; r < Math.max(1, Math.floor((Dz - 1) / 2.8)); r++) for (const x of rowX(2.6, 1)) P(r % 2 ? 'shelf' : (x | 0) % 2 ? 'pallet' : 'shelf', x, c.z0 + 1.2 + r * 2.8, 0, Math.min(1, (H - 0.4) / 3.1));
      P('drums', c.x1 - 1.2, cz, 0); break;
    case 'cold': for (const x of rowX(1.4)) { P('fridge', x, wallZ(outer, 0.5), faceIn(outer)); P('fridge', x, wallZ(inner, 0.5), faceIn(inner)); } P('pallet', cx, cz, 0); break;
    case 'galley': P('galley', cx - W * 0.2, wallZ(outer, 0.5), faceIn(outer)); P('galley', cx + W * 0.2, wallZ(outer, 0.5), faceIn(outer));
      for (const x of rowX(2.8)) P('workbench', x, cz, 0); for (const x of rowX(1.4, 2)) P('fridge', x, wallZ(inner, 0.5), faceIn(inner)); crew(R[3], 'crew_stand'); break;
    case 'mess': for (let r = 0; r < Math.max(1, Math.floor((Dz - 2) / 2.6)); r++) for (const x of rowX(2.8)) { const z = c.z0 + 1.6 + r * 2.6; P('table_mess', x, z, 0); if ((r + (x | 0)) % 2) P('crew_seated', x - 0.6, z - 0.75, 0); }
      P('displaywall', cx, wallZ(outer, 0.2), faceIn(outer), 0.8); crew(2); break;
    case 'medical': for (const x of rowX(2.2)) P('med_bed', x, wallZ(outer, 0.8), faceIn(outer)); P('console', cx, wallZ(inner, 0.6), faceIn(inner)); P('rack', c.x1 - 1, wallZ(inner, 0.6), faceIn(inner)); crew(R[3]); break;
    case 'gym': for (const x of rowX(3.6)) { P('gym', x, cz - Dz * 0.2, 0); P('gym', x, cz + Dz * 0.2, Math.PI); } crew(2); break;
    case 'laundry': for (const x of rowX(2.4)) P('washer', x, wallZ(outer, 0.5), faceIn(outer)); P('shelf', cx, wallZ(inner, 0.7), faceIn(inner)); crew(R[3]); break;
    case 'sanitary': for (const x of rowX(3)) { P('toilet_block', x, wallZ(outer, 0.8), faceIn(outer)); P('toilet_block', x, wallZ(inner, 0.8), faceIn(inner)); } break;
    case 'hvac': P('ahu', cx - W * 0.22, cz, 0, Math.min(1, (H - 0.3) / 3.5)); P('chiller', cx + W * 0.22, cz, 0, Math.min(1, (H - 0.3) / 3.5)); for (const x of rowX(3)) P('pump_skid', x, wallZ(inner, 0.6), faceIn(inner)); crew(R[3], 'crew_orange'); break;
    case 'water': P('ro_unit', cx, wallZ(outer, 0.9), faceIn(outer)); P('tank_v', c.x0 + 2, cz, 0, Math.min(1, (H - 0.3) / 4.8)); P('tank_v', c.x1 - 2, cz, 0, Math.min(1, (H - 0.3) / 4.8)); P('pump_skid', cx, wallZ(inner, 0.6), faceIn(inner)); break;
    case 'pumps': for (const x of rowX(3)) { P('pump_skid', x, cz - Dz * 0.15, 0); } P('tank_v', c.x0 + 2, wallZ(outer, 1.5), 0, Math.min(1, (H - 0.3) / 4.8)); P('hyd_manifold', cx, wallZ(inner, 0.5), faceIn(inner)); crew(R[3], 'crew_orange'); break;
    case 'tanks_v': for (const x of rowX(3)) P('tank_v', x, cz, 0, Math.min(1, (H - 0.3) / 4.8)); P('pump_skid', cx, wallZ(inner, 0.6), faceIn(inner)); break;
    case 'battery': for (let r = 0; r < Math.max(1, Math.floor((Dz - 1) / 2)); r++) for (const x of rowX(2.6)) P('battery_rack', x, c.z0 + 1.1 + r * 2.0, r % 2 ? Math.PI : 0); break;
    case 'electrical': for (let r = 0; r < Math.max(1, Math.floor((Dz - 1) / 2.4)); r++) for (const x of rowX(3.2)) P('switch_panel', x, c.z0 + 1.0 + r * 2.4, r % 2 ? Math.PI : 0); crew(R[3]); break;
    case 'hydraulic': for (const x of rowX(3)) P('hyd_manifold', x, wallZ(outer, 0.6), faceIn(outer)); P('tank_v', cx, cz + 0.5, 0, Math.min(1, (H - 0.3) / 4.8)); for (const x of rowX(3)) P('pump_skid', x, wallZ(inner, 0.6), faceIn(inner)); break;
    case 'emgen': P('gen_emerg', cx, cz, 0); P('switch_panel', cx, wallZ(inner, 0.5), faceIn(inner)); P('tank_v', c.x1 - 2, wallZ(outer, 1.5), 0, Math.min(1, (H - 0.3) / 4.8)); break;
    case 'briefing': P('displaywall', cx, wallZ(outer, 0.2), faceIn(outer)); for (let r = 0; r < Math.max(1, Math.floor((Dz - 3) / 1.2)); r++) for (const x of rowX(0.8, 2)) { P('chair', x, c.z0 + (Math.sign(cz - outer) > 0 ? 2.2 + r * 1.2 : Dz - 2.2 - r * 1.2), faceIn(outer) + Math.PI); }
      crew(R[3], 'crew_seated'); break;
    case 'armoury': for (const x of rowX(0.8)) { P('locker', x, wallZ(outer, 0.4), faceIn(outer)); P('rack', x, wallZ(inner, 0.6), faceIn(inner)); } break;
    case 'shoes': for (let r = 0; r < Math.max(1, Math.floor((Dz - 1) / 4.4)); r++) for (const x of rowX(3)) P('spare_shoe', x, c.z0 + 2.4 + r * 4.4, 0); P('crane_hoist', cx, cz, 0); out.at(-1).y = c.y1 - 0.1; break;
    case 'garage': P('pallet', c.x0 + 2, cz, 0); P('workbench', cx, wallZ(outer, 0.5), faceIn(outer)); P('drums', c.x1 - 1.5, wallZ(inner, 1), 0); P('crane_hoist', cx, cz, 0); out.at(-1).y = c.y1 - 0.1; crew(1, 'crew_orange'); break;
    case 'ammo': P('projectile', cx, cz, 0); P('workbench', cx, wallZ(outer, 0.5), faceIn(outer)); P('crane_hoist', cx, cz, 0); out.at(-1).y = c.y1 - 0.1; crew(2, 'crew_orange'); break;
    case 'gallery': for (const x of rowX(6)) P('fire_station', x, wallZ(outer, 0.2), faceIn(outer)); crew(1, 'crew_orange'); break;
    default: break;
  }
  if (recipe !== 'tank' && recipe !== 'none' && !c.sys) {
    const ov = (type, z) => { out.push({type, x: cx, y: c.y1 - 0.05, z, ry: 0, sy: 1}); };
    if (H > 3.2) ov('hvac_duct', cz);                                                      // overhead services run
    out.push({type: 'door', x: c.x0 + Math.min(2, W / 3), y: c.y0 + 0.12, z: inner, ry: faceIn(inner) === 0 ? 0 : Math.PI, sy: Math.min(1, (H - 0.2) / 2.2)});
    if ((c.f + c.d) % 3 === 0) out.push({type: 'fire_station', x: c.x0 + 3.4, y: c.y0 + 0.12, z: wallZ(inner, 0.25), ry: faceIn(inner), sy: 1});
  }
  return out;
}

// ------------------------------------------------------------------ renderer: structure + furniture for the current slice
export class GAView {
  constructor({comps, equipScene, frames, finish}) {
    this.comps = comps; this.frames = frames; this.finish = finish;
    this.types = {}; equipScene.updateMatrixWorld(true);
    for (const n of equipScene.children) {
      const geos = [], mats = [];
      n.traverse((o) => { if (o.isMesh) { const g = o.geometry.clone().applyMatrix4(o.matrixWorld); for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k); geos.push(g); mats.push(o.material); } });
      if (geos.length) { const g = mergeGeometries(geos, true); g.computeBoundingBox(); this.types[n.name] = {g, mats, h: g.boundingBox.max.y}; }
    }
    this.pools = {}; this.root = {};
    for (const fr of Object.keys(frames)) { this.root[fr] = new THREE.Group(); this.root[fr].visible = false; frames[fr].add(this.root[fr]); }
    // structure: decks, bulkheads, tank fluid, pick volumes (instanced boxes, built once, all compartments)
    const box = new THREE.BoxGeometry(1, 1, 1);
    this.mats = {deck: new THREE.MeshStandardMaterial({color: 0x8d9195, roughness: 0.8, metalness: 0.3}), wall: new THREE.MeshStandardMaterial({color: 0xd3d4d0, roughness: 0.7, metalness: 0.15}),
      fluid: new THREE.MeshStandardMaterial({color: 0xffffff, transparent: true, opacity: 0.55, roughness: 0.1, metalness: 0}), web: new THREE.MeshStandardMaterial({color: 0x7a7f84, roughness: 0.6, metalness: 0.5}),
      floorTint: new THREE.MeshStandardMaterial({color: 0xffffff, roughness: 0.85, metalness: 0.1})};
    for (const m of [this.mats.deck, this.mats.wall, this.mats.web]) finish?.(m, {scale: 6, strength: 0.7, bump: 0.6});
    const perFrame = {};
    for (const c of comps) (perFrame[c.frame] ??= []).push(c);
    this.struct = {};
    for (const [fr, cs] of Object.entries(perFrame)) {
      const decks = [], walls = [], fluids = [], webs = [], tints = [];
      for (const c of cs) {
        const W = c.x1 - c.x0, D = c.z1 - c.z0, H = c.y1 - c.y0, cx = (c.x0 + c.x1) / 2, cz = (c.z0 + c.z1) / 2;
        decks.push([cx, c.y0 + 0.06, cz, W, 0.12, D]);
        tints.push([cx, c.y0 + 0.125, cz, W - 0.4, 0.01, D - 0.4, new THREE.Color(CAT[ROLES[c.role]?.[1] || 'system'].c).lerp(new THREE.Color(0x9a9a9a), 0.55)]);
        walls.push([c.x0 + 0.06, (c.y0 + c.y1) / 2, cz, 0.12, H, D], [cx, (c.y0 + c.y1) / 2, c.z0 + 0.06, W, H, 0.12]);
        const R = ROLES[c.role];
        if (R && R[2] === 'tank') { fluids.push([cx, c.y0 + H * 0.38, cz, W - 0.4, H * 0.72, D - 0.4, new THREE.Color(R[5])]); for (let x = c.x0 + 2.3; x < c.x1 - 0.5; x += 2.3) webs.push([x, (c.y0 + c.y1) / 2, cz, 0.12, H, D - 0.3]); }
      }
      const mk = (list, mat, color) => { const im = new THREE.InstancedMesh(box, mat, Math.max(1, list.length)); const M = new THREE.Matrix4();
        list.forEach((a, i) => { im.setMatrixAt(i, M.compose(new THREE.Vector3(a[0], a[1], a[2]), new THREE.Quaternion(), new THREE.Vector3(a[3], a[4], a[5]))); if (color) im.setColorAt(i, a[6]); });
        im.count = list.length; im.userData.noOcc = true; im.castShadow = false; im.receiveShadow = true; this.root[fr].add(im); return im; };
      this.struct[fr] = {deck: mk(decks, this.mats.deck), wall: mk(walls, this.mats.wall), fluid: mk(fluids, this.mats.fluid, true), web: mk(webs, this.mats.web), tint: mk(tints, this.mats.floorTint, true)};
      // pick volumes (invisible) for click-to-identify
      const pm = new THREE.MeshBasicMaterial({visible: false}); const pick = new THREE.InstancedMesh(box, pm, cs.length); const M = new THREE.Matrix4();
      cs.forEach((c, i) => pick.setMatrixAt(i, M.compose(new THREE.Vector3((c.x0 + c.x1) / 2, (c.y0 + c.y1) / 2, (c.z0 + c.z1) / 2), new THREE.Quaternion(), new THREE.Vector3(c.x1 - c.x0, c.y1 - c.y0, c.z1 - c.z0))));
      pick.userData.comps = cs; pick.userData.noOcc = true; this.root[fr].add(pick); this.struct[fr].pick = pick;
    }
    // furniture pools per frame x type
    for (const fr of Object.keys(frames)) for (const [t, T] of Object.entries(this.types)) {
      const im = new THREE.InstancedMesh(T.g, T.mats, 1600); im.count = 0; im.userData.noOcc = true; im.castShadow = false; im.receiveShadow = false; im.frustumCulled = false;
      this.root[fr].add(im); (this.pools[fr] ??= {})[t] = im;
    }
    for (const c of comps) c.items = lay(c);
  }
  show(on) { for (const r of Object.values(this.root)) r.visible = on; }
  /** furnish compartments selected by keep(c) (the slice next to the cut planes); returns counts */
  furnish(keep) {
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0), counts = {};
    for (const fr of Object.keys(this.pools)) for (const im of Object.values(this.pools[fr])) im.count = 0;
    let n = 0;
    for (const c of this.comps) { if (!keep(c)) continue; n++;
      for (const it of c.items) { const im = this.pools[c.frame]?.[it.type]; if (!im || im.count >= 1600) continue;
        im.setMatrixAt(im.count++, M.compose(V.set(it.x, it.y, it.z), Q.setFromAxisAngle(Y, it.ry), S.set(1, it.sy, 1))); counts[it.type] = (counts[it.type] || 0) + 1; } }
    for (const fr of Object.keys(this.pools)) for (const im of Object.values(this.pools[fr])) { im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere?.(); }
    return {rooms: n, counts};
  }
  pick(ray) {
    let best = null;
    for (const fr of Object.keys(this.struct)) { const pk = this.struct[fr].pick; const hits = ray.intersectObject(pk, false);
      for (const h of hits) { const c = pk.userData.comps[h.instanceId]; if (c && c.visibleNow && (!best || h.distance < best.d)) { best = {c, d: h.distance, p: h.point}; break; } } }
    return best?.c || null;
  }
}
export function describe(c, SYS) {
  const SN = {1: c.d < 3 || c.region.id !== 'UP' ? 'Engine room' : 'Engine uptake casing', 2: c.region.id === 'UP' && c.d > 4 ? 'HV cable trunk' : 'Switchboard / drive room', 3: 'Traction gear room', 4: 'Strut & running-gear bay',
    5: 'Slew bearing space', 6: c.region.id === 'NO' ? 'Magazine / HPU space' : 'Gun mechanism space', 7: c.region.id === 'HU' ? 'Ballast / thruster space' : 'Fire & lifesaving space'};
  const R = ROLES[c.role] || [SN[c.sys] || 'System space', 'system', 'none', 0, `Occupied by ${SYS[c.sys - 1]?.title || 'an engineered system'} (system ${c.sys}). Open the system to cut into its parts, readouts and faults.`];
  const counts = {}; for (const it of c.items || []) counts[it.type] = (counts[it.type] || 0) + 1;
  return {code: c.code, name: R[0], cat: CAT[R[1]] || CAT.system, purpose: R[4], crew: R[3], counts, size: `${(c.x1 - c.x0).toFixed(1)} × ${(c.z1 - c.z0).toFixed(1)} × ${(c.y1 - c.y0).toFixed(1)} m`, region: c.region.name, deck: c.d + 1, sys: c.sys};
}
