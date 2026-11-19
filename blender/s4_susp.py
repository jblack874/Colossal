# System 4 - Running gear & hydropneumatic suspension. One station in its own frame (three coords): origin at
# (road-wheel x, 0, lane centre z) of the hull rig. Derived: 4 strut cylinders bore 0.84 m at dx +-1.3, dz +-6.5,
# barrel 16.4-21.6 m; 2 nitrogen accumulators r 0.75 m, 2.09 m tall at dx +-3.6, centre y 22.5; road wheel r 3.6,
# axle y 4.64 at static load. rod0-3 are unit-length (the explorer scales them to live strut extension).
# 'wheel' and 'trackrun' show only in the pull-out view (the hull model draws its own wheels and belt in place).
import sys, os, math; sys.path.insert(0, os.path.dirname(__file__))
from blib import *
OUT = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else '/tmp/b'
BORE, DX, DZ, Y0, Y1, AH, YAX, RW = 0.84, 1.3, 6.5, 16.4, 21.6, 2.09, 4.64, 3.6

reset(); C = palette(); cylc = mat('strut_grey', 0x5c6670, 0.7, 0.35); chrome = mat('chrome', 0xe8ecef, 1.0, 0.06)
accm = mat('accumulator', 0xd8d4c8, 0.4, 0.4, 0xff3b1f, 0.0)
with part('cyl', (0, 19, 0)):
    for dz in (DZ, -DZ):
        for dx in (DX, -DX):
            cyl(BORE / 2 + 0.05, 5.2, dx, 19, dz, cylc, 'Y', 40, 0.03)
            for y in (Y0 + 0.2, Y1 - 0.25): cyl(BORE / 2 + 0.14, 0.4, dx, y, dz, cylc, 'Y', 40, 0.04)    # end caps / gland
            bolts(12, BORE / 2 + 0.08, dx, Y0 + 0.42, dz, 'Y', 0.03, 0.08); bolts(12, BORE / 2 + 0.08, dx, Y1 - 0.47, dz, 'Y', 0.03, 0.08)
            box(0.5, 0.7, 0.35, dx, Y1 + 0.45, dz, cylc, 0.06); cyl(0.14, 0.7, dx, Y1 + 0.5, dz, C['steel'], 'Z', 16)   # top clevis + pin
            cyl(0.06, 0.25, dx + 0.45, 20.6, dz, C['steel'], 'X', 10)                                                    # hydraulic port
            cyl(0.04, 0.15, dx - 0.5, 17.2, dz, C['yellow'], 'X', 8)                                                     # position transducer
for k, (dx, dz) in enumerate([(DX, DZ), (-DX, DZ), (DX, -DZ), (-DX, -DZ)]):
    with part(f'rod{k}', (dx, 0, dz)):
        cyl(BORE / 2 * 0.62, 1.0, dx, 0, dz, chrome, 'Y', 32)
for k, dx in enumerate((-3.6, 3.6)):
    with part(f'acc{k}', (dx, 22.5, 0)):
        cyl(0.75, AH, dx, 22.5, 0, accm, 'Y', 40); sphere(0.75, dx, 22.5 + AH / 2, 0, accm, 32); sphere(0.75, dx, 22.5 - AH / 2, 0, accm, 32)
        cyl(0.18, 0.3, dx, 22.5 + AH / 2 + 0.75, 0, C['steel'], 'Y', 16)                                              # gas charging valve
        cyl(0.12, 0.06, dx, 22.5, 0.78, C['white'], 'Z', 24); cyl(0.1, 0.01, dx, 22.5, 0.815, C['glass'], 'Z', 24)    # pressure gauge
        for y in (22.5 - 0.6, 22.5 + 0.6): torus(0.78, 0.04, dx, y, 0, C['dark'], 'Y', 40, 6)                         # mounting bands
with part('manifold', (0, 21.8, 0)):
    box(4.4, 0.9, 14.0, 0, 21.8, 0, cylc, 0.08)
    for dz in (DZ, -DZ):
        for dx in (DX, -DX): cyl(0.32, 1.0, dx, 22.1, dz, cylc, 'Z', 24, 0.03)                                       # clevis bosses
    for z in (-3, 0, 3): box(4.6, 0.12, 0.25, 0, 22.3, z, cylc, 0.02)                                                  # stiffener ribs
    for x in (-1.9, 1.9): box(0.3, 0.4, 0.15, x, 22.45, 6.9, C['yellow'], 0.02)                                       # lifting lugs
    box(1.0, 0.5, 0.8, 0, 22.5, 4.0, C['oil'], 0.04); cyl(0.12, 0.3, 0.3, 22.9, 4.0, C['red'], 'Y', 12)               # isolation valve block
with part('hose', (0, 21.5, 0)):
    for dz in (DZ, -DZ):
        for dx in (DX, -DX): pipe([(math.copysign(3.6, dx), 21.5, 0), (dx * 1.6, 22.9, dz * 0.45), (dx + 0.45, 20.6, dz)], 0.07, C['rubber'])
    for dx in (-3.6, 3.6): pipe([(dx, 21.4, 0), (dx * 0.5, 22.9, 3.5), (0, 22.7, 4.0)], 0.09, C['rubber'])
    for dz in (DZ, -DZ):
        for dx in (DX, -DX): box(0.1, 0.12, 0.2, dx + 0.45, 20.6, dz, C['steel'], 0.01)
with part('arms', (0, 5.84, 0)):
    for dz in (DZ * 1.12, -DZ * 1.12):
        box(6.5, 0.9, 0.8, -2.2, 5.84, dz, cylc, 0.1, rz=0.32)
        cyl(0.55, 1.0, -5.2, 6.85, dz, cylc, 'Z', 32, 0.04); cyl(0.6, 1.0, 0, YAX, dz, cylc, 'Z', 32, 0.04)
        cyl(0.2, 1.2, -5.2, 6.85, dz, C['steel'], 'Z', 16)
with part('axle', (0, YAX, 0)):
    cyl(0.8, 15.0, 0, YAX, 0, chrome, 'Z', 40)
    for dz in (7.3, -7.3): cyl(0.95, 0.3, 0, YAX, dz, cylc, 'Z', 32, 0.03); bolts(8, 0.75, 0, YAX, dz + math.copysign(0.18, dz), 'Z', 0.05, 0.1)
with part('bearing', (0, YAX, 7.3)):
    tube(1.45, 0.82, 0.7, 0, YAX, 7.3, C['steel'], 'Z', 48)                   # cone
    for i in range(26):
        a = i / 26 * 2 * math.pi; cyl(0.16, 0.6, 1.1 * math.cos(a), YAX + 1.1 * math.sin(a), 7.3, chrome, 'Z', 12, 0.02, r2=0.2)
    tube(1.6, 1.38, 0.7, 0, YAX, 7.3, C['steel'], 'Z', 48)                    # cup (outer race)
with part('wheel', (0, YAX, 0)):
    for dz in (-5.6, 0.0, 5.6):
        tube(RW, RW - 0.5, 1.2 if dz else 0.8, 0, YAX, dz, C['gear'], 'Z', 96)           # rim / treads
        tube(RW - 0.5, 1.6, 0.25, 0, YAX, dz, cylc, 'Z', 96)                              # disc
        for k in range(8):
            a = k / 8 * 2 * math.pi + 0.2; cyl(0.45, 0.3, 2.5 * math.cos(a), YAX + 2.5 * math.sin(a), dz, C['dark'], 'Z', 24)
    tube(RW + 0.35, RW - 0.1, 0.25, 0, YAX, 0, C['gear'], 'Z', 96)                       # centre guide flange
    tube(1.8, 0.85, 12.0, 0, YAX, 0, cylc, 'Z', 64)                                       # hub
with part('trackrun', (0, 0.5, 0)):
    for i in range(-3, 4):
        x = i * 2.6
        box(2.45, 0.12, 13.0, x, 0.98, 0, C['steel'], 0.02); box(2.45, 0.12, 13.0, x, 0.06, 0, C['steel'], 0.02)  # flanges (hollow shoe)
        for w in range(4): box(2.45, 0.8, 0.05, x, 0.52, -6.0 + w * 4.0, C['steel'], 0.0)                          # webs
        box(0.4, 0.4, 13.0, x, -0.15, 0, C['steel'], 0.05)                                                           # grouser
        cyl(0.18, 13.6, x + 1.3, 0.52, 0, chrome, 'Z', 16); cyl(0.26, 12.4, x + 1.3, 0.52, 0, C['brass'], 'Z', 16)  # pin + bushing
        box(0.3, 1.2, 0.3, x, 1.5, 0, C['steel'], 0.05)                                                              # guide horn
finalize(); export(f'{OUT}/station.glb')
if os.environ.get('STILL'): still(f'{OUT}/station_still.png', (-20, 15, -24), (0, 12, 0), 34)
print('DONE')
