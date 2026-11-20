# COLOSSAL — project log

## Status (2026-11-19)
Steps 1–3 done; v0.1 = hollow track shoes (Joe's pick 1a). **Waiting on GO / STOP.** Pass 1 on GO: motion only (track loop, state(t), hand checks).

## v0 headline numbers (spec/sizing.py)
| Item | Value | Tag |
|---|---|---|
| Hull | 230 × 100 m | I (scale anchor) |
| Overall length, boom forward / height | 350 m / 86 m | D |
| Mass | 139.1 kt (221.8 kt with solid shoes) | D |
| Ground pressure | 1.50 bar (0.88× Bagger 288's 1.71 bar) | D — pass |
| Float draft | 11.0 m | D |
| Land power at 0.5 m/s | 62 MW vs 96 MW installed | D — pass |
| Thrusters | 6 × 5.5 MW azimuth | D |
| Main track shoe | hollow S690 box 13 × 2.6 × 1.04 m, 50 mm flanges, 56.5 t (solid: 183.5 t) | D |

## Resolved
- Ground pressure: hollow fabricated shoes (1a). Also clears the land-power shortfall.
- Uplift from rotors / balloons: zero (10% of W needs 9.8 GW of rotors or ~60 Hindenburgs of H2).

## Open
- Roller-path contact fatigue on the shoes is unmodelled; it governs the 50 mm flange (crawler shoes cracked there, NASA NTRS 20120003660).

## Coordinator decisions
- D1 Amphibious (land / wade / float), from Joe's buoyancy point.
- D2 Mass sized bottom-up per subsystem, not whole-machine crawler scaling.
- D3 three.js 0.186 for the template; Scramjet stays frozen on r128.
- D4 Track units double as sealed pontoons (0.6 sealed fraction, I).
- D5 230 m hull is the one invented scale anchor.
- D6 Shoes are hollow S690 box sections; SF 3 on yield for fatigue; 50 mm minimum flange (I).
- D10 Uplift from rotors and balloons taken as zero.
- D7 Jacking legs on the shelf only; DP thrusters in deep water.
- D8 Hydrofoils for trim and roll damping only (~53,000 m² would be needed to carry W at 10 m/s).
- D9 Original silhouette; no reference image's proportions, markings or text.

## Hand checks (print at load in the build)
| # | Check | Result |
|---|---|---|
| H1 | 128 links × 2.599 m = loop 332.7 m | Pass (tensioner takes 0.55 m) |
| H2 | v = r·ω = 5.02 × 0.0996 = 0.50 m/s | Pass |
| H3 | p = W/A = 1.36 GN / 9,103 m² = 1.50 bar | Pass (0.88× Bagger 288) |
| H4 | Boom σ = 2ρgL²/D = 289 MPa, SF 2.39 on S690 | Pass |
| H5 | Draft 11.0 m | Pass |
| H6 | Shoe bending needs 3.8 mm; 50 mm fitted | Pass |
| H7 | Track pin, double shear at 26.8 MN: Ø0.36 m | Pass |

Full criteria (M1–M15), inventory and template: see the spec doc linked in README.md.

## Pass 1 — motion (2026-11-19, 11:26–11:34)
Built: `machines/colossal/kin.js` (pure state(t)), `main.js` (pass-1 page), `scripts/sweep.mjs`; page `machines/colossal/dist/colossal.html` (725 KB).
- Links ride a rounded-rectangle belt path (4 corner wheels, 12T sprocket r 5.02 m), 143 links/main belt, 50/pod belt; bottom run follows 20 hydropneumatic struts over a terrain profile; pods pitch on a bogie; hull heave/pitch/roll from a least-squares plane; slew + boom elevation; water depth slider drives buoyancy, wade-in pressure and float.
- Sweep: 9 stills (HERO, SIDE, TRACK, TRACK x-ray, POD, TOP, wade 8 m, float 24 m, FIELD); errors none; no NaN.
- Hand checks at load: H1 143 × 2.599 = 371.64 m PASS (tensioner +0.57 m); H2 0.50 m/s PASS; H3 1.34 bar ≤ 1.71 PASS.

**Correction found while porting (kin.js supersedes spec/sizing.py):** sizing.py sized track-unit frames and pontoons on 2C (twice the sprocket–idler distance) instead of C + 2r. Fixed numbers: mass 124.9 kt (shoes 41.9, running gear 22.2, hull 15.8, upper 28.3, boom 5.3, +10%); ground pressure 1.34 bar (0.78× Bagger 288); float draft 18.8 m; land power 55.9 MW (58% of plant); thrusters 26.1 MW → 5 × 5.5 MW.

Known issues for pass 2: TOP view shows only the slewed upper deck (hull/tracks not reading); road wheels are plain drums; no callouts, explode or greebles yet; FIELD figure too small to see at 1,900 m.

## Pass 2a — fidelity (2026-11-19, after Joe's D- on pass 1)
- Big round track ends: 29T main sprocket (r 12.0 m, 138 links), 21T pods (r 8.7 m, 51 links); pods moved outboard (z ±63) alongside the track fronts. H1–H3 PASS (1.50 bar). Sprocket torque 290 MN·m, motor 67 rpm at 168:1 — flagged.
- Seeded greebles (`greeble.js`): recursive panel subdivision, vents, sparse lit windows, pipes, ladders, catwalks, railings — instanced. Upper deck is an extruded side profile with a light chamfer glacis, helideck, masts; segmented boom mantle; chunky 3-block shoes; hub covers on track plates.
- FIELD mode: telephoto (9°) at 22 m camera height (reference composition, not eye level), overcast haze, salt pan, grass foreground, 1.8 m figure at the boundary, contact shadow, env-map metal on shoes.
- Side-by-side: `stills/pass2-field-vs-ref.jpg`. Remaining gap: greebles read as flat boxes (no fine horizontal lattice / railing density), salt pan lacks the plate pattern, no bright shoe faces at the track ends, deck proportions taller than the reference.

## Pass 3 — 7-system internals (WIP, not shipped)
- Systems isolate on select (other systems + greebles hidden, shell ghosted 7%; section cut is the alternate).
- Cameras auto-frame on each system's key parts; subject centred in the free viewport between HUD panels.
- Detail added: genset rocker covers, fuel pumps + HP lines, crankcase doors, mounts, sump; sprocket rim (29 T) + spoked carrier + motor cowls/feeders; strut end caps, clevises, bogie arms, accumulator domes + gauges, per-cylinder hoses; breech ring, loading tray, cradle ribs, recoil blocks, trunnion caps.
- Side-by-side vs Solo-12 (stills/systems/compare1-2.jpg). Scramjet v8 does not render under SwiftShader (stalls at "Loading the test hull"), so its bar is taken from the v8 handoff brief, not stills.
- Grade vs bar: DRIVE, SLEW near pass; GUN, HULL borderline; POWER, ELEC, SUSP fail on composition (no clear hero, foreground clutter).
- Joe's calls (11/19): Power, Elec, Susp = pull-out unit by default + in-situ toggle; Scramjet bar = v8 handoff brief only (data/sourcing).
- Added: pull-out mode (isolates one genset room / slip ring / strut station, hides hull + ground), camera follows the system as the machine moves and slews.
- Grade vs Solo-12 composition: POWER, DRIVE, SLEW pass; ELEC, SUSP, GUN, HULL not yet (plain or sparse hero, off-centre or busy in-situ background). Not shipped.

## Pass 4 — Blender asset pipeline (all 7 systems, Joe's call 11/19: all 7 to Blender, bigger page OK)
- blender/blib.py authors in three.js coordinates, joins each part into one named mesh with its pivot, exports GLB.
- blender/s1..s7_*.py → machines/colossal/assets/*.glb (18 assets). glb.js inlines + swaps them in; old procedural meshes move to layer 1 so labels, explode and motion still run off them; rotating GLB nodes (gears, pinions, rods, accumulators, props) copy the live model's transforms every frame.
- Pull-out views now on 1, 2, 4, 6, 7. Page is 28.6 MB (over the 20 MB artifact file cap; ship needs assets external).
- Grade vs Solo-12: POWER, SLEW, GUN pass; DRIVE near; ELEC (slip ring alone), SUSP (no track run in frame), HULL (thruster small) not yet.

## Pass 5 — exterior in Blender, pull-out fixes, film
- blender/s8_exterior.py: hollow cast track shoe (instanced on the live belt path), sprocket/idler and road wheels (ride the animated wheels), hull deck + track frames, slewing upperworks (structured bays, catwalks, bridge house, helideck, masts), mantle + barrel. Greebles retired.
- Pull-outs: Electrical shows the whole power chain isolated; Suspension frames the nearest track run; Hull thruster tighter.
- Guided tours: ▶ FULL TOUR / ▶ 1–7 buttons; scripted camera, explode and cut-in states with captions; tourAt(T) deterministic.
- film/colossal_tour.mp4: 81 s, 1280x720, rendered at 15 fps in software and doubled to 30 (scripts/film.mjs). On a GPU the in-page tour runs at full frame rate.
- Known: suspension pull-out track run not visible yet; the 15 fps capture shows slight stepping on fast camera moves.

## Pass 6 — "LEGO or not" (Joe 11/19 23:03)
- Topside fit (s10_topside.py): command island, raked bridge, integrated mast with 4 S-band + 4 X-band AESA faces, rotating long-range radar, ESM/IFF ring, yardarms, satcom radomes, EO/IR turrets, 6 CIWS, 4×64 VLS, canister launchers, point-defence launchers, decoys, directed-energy turret, helideck + hangar, RHIBs, crane, HF whips, floodlights.
- Barrel doubled to 180 m (kin boomL 150→240; ground pressure 1.57→1.61 bar, still ≤ 1.71). Munitions (s11_magazine.py): 48 projectiles, charge magazines, blast doors, transfer trolleys, hoist foot; animated 14 s load cycle.
- General arrangement (ga.js): 1,380 numbered compartments over upper block, nose, hull and 4 track-frame galleries; system-occupied spaces detected from the 7 systems' geometry; every other room gets a role, purpose and equipment from a 40-item Blender library (s9_equip.py). Cutaway card: deck / block / side planes, presets, click a room for role, purpose, crew and equipment counts.
- Surface: world-space plating texture (seams, welds, bolts, grime, streaks) on every material; real shadows; GTAO ambient occlusion; facade services (s12_kitbash.py); stencils; palette moved to Joe's references (near-black gunmetal, white accents, haze).
- LEGO check: silhouette/palette now match the references at distance; close-up plating still reads as a repeating tile; deck labels crowd; tour video predates this pass.
