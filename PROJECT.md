# COLOSSAL — project log

## Status (2026-11-19)
Steps 1–3 done. **Waiting on GO / STOP.** Pass 1 on GO: motion only (track loop, state(t), hand checks).

## v0 headline numbers (spec/sizing.py)
| Item | Value | Tag |
|---|---|---|
| Hull | 230 × 100 m | I (scale anchor) |
| Overall length, boom forward / height | 350 m / 86 m | D |
| Mass | 221.8 kt | D |
| Ground pressure | 2.39 bar (1.40× Bagger 288's 1.71 bar) | D — **H3 fails** |
| Float draft | 17.5 m (Sleipnir 12–32 m) | D |
| Land power at 0.5 m/s | 99 MW vs 96 MW installed | D — 3% short |
| Thrusters | 7 × 5.5 MW azimuth | D |

## Open choices for Joe
1. Ground pressure: (a) fabricated hollow shoes, (b) accept, land on prepared ground only, (c) wider belts.
2. Land power: drop speed to 0.48 m/s, or add a 13th genset.

## Coordinator decisions
- D1 Amphibious (land / wade / float), from Joe's buoyancy point.
- D2 Mass sized bottom-up per subsystem, not whole-machine crawler scaling.
- D3 three.js 0.186 for the template; Scramjet stays frozen on r128.
- D4 Track units double as sealed pontoons (0.6 sealed fraction, I).
- D5 230 m hull is the one invented scale anchor.
- D6 Shoes scaled solid (square-cube), the worst case.
- D7 Jacking legs on the shelf only; DP thrusters in deep water.
- D8 Hydrofoils for trim and roll damping only (~85,000 m² would be needed to carry W at 10 m/s).
- D9 Original silhouette; no reference image's proportions, markings or text.

## Hand checks (print at load in the build)
| # | Check | Result |
|---|---|---|
| H1 | 128 links × 2.599 m = loop 332.7 m | Pass (tensioner takes 0.55 m) |
| H2 | v = r·ω = 5.02 × 0.0996 = 0.50 m/s | Pass |
| H3 | p = W/A = 2.18 GN / 9,103 m² = 2.39 bar | Fail ×1.40 vs Bagger 288 |
| H4 | Boom σ = 2ρgL²/D = 289 MPa, SF 2.39 on S690 | Pass |
| H5 | Draft 17.5 m | Pass |

Full criteria (M1–M15), inventory and template: see the spec doc linked in README.md.
