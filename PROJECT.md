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
