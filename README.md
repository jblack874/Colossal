# COLOSSAL

An original amphibious tracked colossus, built as a 3D motion model on a merged Solo-12 + Scramjet explorer toolkit. **Status: Steps 1–3 (inventory, template, design spec) done; build is gated on GO.**

## Folders
| Path | What it is |
|---|---|
| `PROJECT.md` | Status, coordinator decisions, open choices, criteria summary |
| `spec/sizing.py` | v0 sizing model. Every number tagged S (sourced), D (derived), I (invented). Run `python3 spec/sizing.py` |
| `spec/sizing.json` | Output of the sizing model (geometry inputs + results) |
| `spec/schematic_v0.png` | Side elevation and top view, to scale |

The full spec (inventory, conflicts, template, analog table with citations, hand checks, merged criteria) is the Claude doc **"COLOSSAL — Toolkit, Template and Design Spec v0"**: https://claude.ai/artifact/7KD4YffJZZmknB4hGqToyj

## Sources and credit
- Toolkit inputs: [jblack874/Solo-12-Teardown](https://github.com/jblack874/Solo-12-Teardown) and [jblack874/X-51A-scramjet](https://github.com/jblack874/X-51A-scramjet) (Scramjet Explorer v8)
- teardown skill (MIT): https://github.com/elvarofficial/teardown — will be vendored unchanged under `kit/` at build time
- Analog data: NASA crawler-transporter fact sheets, Bagger 288/293, Big Muskie, Liebherr 23.4 m slewing bearing, Prelude FLNG, SSCV Sleipnir, EN 10025-6 S690QL, rack-and-pinion jack-up systems. Links are in the spec doc's analog table.
- The 16 reference images (mood and scale only) are not in this repo.
