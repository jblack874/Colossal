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
