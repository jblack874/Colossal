# System 1 - Power plant. Two assets, both in the explorer's own local frames (three coords):
#  genset.glb : one MAN 8L51/60DF genset in the 'gs' frame (x = crank axis, turbo at -x, alternator at +x,
#               y = 0 at the resilient mounts, exhaust side +z, fuel/air side -z). Block centre at x = -2.8.
#  roomkit.glb: engine-room auxiliaries in the 'room' frame (floor plate top y = 0.4).
# Sourced: 8 cyl, 510/600 mm, block 10.27 m, 8 MW alternator. Everything else INVENTED for visual fidelity.
import sys, os, math; sys.path.insert(0, os.path.dirname(__file__))
from blib import *
OUT = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else '/tmp/b'

# ============================================================ genset
reset(); C = palette()
NC, L, W, X0 = 8, 10.27, 2.9, -2.8
cx = [X0 - L / 2 + 1.0 + i * (L - 2.0) / (NC - 1) for i in range(NC)]

with part('mounts', (X0, 0.4, 0)):
    for z in (-1.55, 1.55):
        box(17.6, 0.9, 0.06, X0 + 2.6, 0.62, z, C['base'], 0.01)
        for y in (0.17, 1.07): box(17.6, 0.06, 0.5, X0 + 2.6, y, z, C['base'], 0.01)
    for i in range(12):
        xx = X0 - 6.0 + i * 1.55; box(0.08, 0.7, 3.1, xx, 0.62, 0, C['base'], 0.01)
        for z in (-1.55, 1.55): cyl(0.2, 0.16, xx, 0.06, z, C['rubber'], 'Y', 20); cyl(0.24, 0.04, xx, 0.15, z, C['dark'], 'Y', 20)
with part('block', (X0, 3.0, 0)):
    box(L, 2.4, W, X0, 2.3, 0, C['body'], 0.08); box(L - 0.3, 0.8, W - 0.6, X0, 0.95, 0, C['body'], 0.06)
    box(L, 1.5, W - 0.4, X0, 4.25, 0, C['body'], 0.07)
    for i in range(NC + 1):
        xx = X0 - L / 2 + 0.5 + i * (L - 1.0) / NC
        for s in (-1, 1): box(0.14, 1.4, 0.12, xx, 4.25, s * (W / 2 - 0.15), C['body'], 0.03)
    for s in (-1, 1): box(L - 0.2, 0.12, 0.1, X0, 3.52, s * (W / 2 + 0.02), C['body'], 0.02)   # frame/block joint flange
with part('doors', (X0, 2.2, W / 2)):
    for x in cx:
        for s in (-1, 1):
            zz = s * (W / 2 + 0.03); box(0.72, 1.05, 0.06, x, 2.2, zz, C['body'], 0.025)
            for k in range(10):
                a = k / 10 * 2 * math.pi; cyl(0.022, 0.05, x + 0.31 * math.cos(a), 2.2 + 0.46 * math.sin(a), zz + s * 0.04, C['dark'], 'Z', 6)
            cyl(0.13, 0.12, x, 2.2, zz + s * 0.1, C['steel'], 'Z', 20); cyl(0.09, 0.05, x, 2.2, zz + s * 0.18, C['red'], 'Z', 16)
with part('heads', (X0, 5.4, 0)):
    for x in cx:
        box(0.95, 0.75, 1.4, x, 5.4, 0, C['head'], 0.06)
        for dx in (-0.36, 0.36):
            for dz in (-0.55, 0.55): cyl(0.045, 0.32, x + dx, 5.9, dz, C['steel'], 'Y', 12); cyl(0.085, 0.12, x + dx, 5.83, dz, C['dark'], 'Y', 6)
        cyl(0.05, 0.25, x + 0.3, 5.95, 0.62, C['steel'], 'Y', 12); cyl(0.07, 0.2, x - 0.3, 5.55, -0.62, C['red'], 'Z', 14)
with part('rocker', (X0, 6.0, 0)):
    for x in cx:
        box(0.78, 0.42, 1.0, x, 6.0, 0, C['cover'], 0.08)
        for dz in (-0.3, 0, 0.3): box(0.7, 0.05, 0.05, x, 6.23, dz, C['cover'], 0.015)
with part('exh', (X0, 6.35, 1.15)):
    ze, ye = 1.15, 6.35
    cyl(0.42, L + 0.6, X0 + 0.3, ye, ze, C['lag'], 'X', 40)
    for k in range(int(L / 0.45)): torus(0.425, 0.025, X0 - L / 2 + 0.2 + k * 0.45, ye, ze, C['steel'], 'X', 40, 6)
    for x in cx: elbow_pipe([(x, 5.6, 0.5), (x, 5.95, 0.85), (x, ye - 0.15, ze)], 0.17, C['lag'])
    elbow_pipe([(X0 - L / 2 - 0.1, ye, ze), (X0 - L / 2 - 1.2, ye, ze), (X0 - L / 2 - 1.2, 6.3, 0.75)], 0.42, C['lag'], 0.6)
    elbow_pipe([(X0 - L / 2 - 1.9, 7.0, 0.0), (X0 - L / 2 - 1.9, 8.4, 0.0), (X0 - L / 2 - 1.9, 9.2, 0.0)], 0.5, C['lag'], 0.6)
with part('turbo', (X0 - L / 2 - 2.4, 6.3, 0)):
    tx = X0 - L / 2 - 2.4
    cyl(0.75, 0.9, tx + 0.55, 6.3, 0, C['hot'], 'X', 40, 0.02)                 # turbine casing (engine side)
    bolts(24, 0.85, tx + 0.1, 6.3, 0, 'X', 0.03, 0.12)
    cyl(0.95, 0.9, tx - 0.35, 6.3, 0, C['steel'], 'X', 48, 0.02); torus(0.95, 0.18, tx - 0.35, 6.3, 0, C['steel'], 'X')
    cyl(1.05, 1.1, tx - 1.35, 6.3, 0, C['grate'], 'X', 48)
    for k in range(7): torus(1.06, 0.03, tx - 1.8 + k * 0.15, 6.3, 0, C['dark'], 'X', 48, 6)
    cyl(0.5, 0.02, tx - 1.91, 6.3, 0, C['dark'], 'X', 32)
    box(1.0, 0.9, 1.0, tx + 0.55, 7.0, 0, C['hot'], 0.05)                       # turbine outlet to uptake
with part('cac', (X0 - L / 2 - 0.8, 4.75, 0)):
    box(1.6, 2.8, 2.4, X0 - L / 2 - 0.8, 2.6, 0, C['body'], 0.07)                 # front-end box (pumps, thermostats)
    box(1.4, 1.4, 2.0, X0 - L / 2 - 1.4, 4.75, -0.2, C['body'], 0.06)
    for k in range(9): box(1.42, 1.2, 0.04, X0 - L / 2 - 1.4, 4.75, -1.0 + k * 0.2, C['dark'], 0.0)
    elbow_pipe([(X0 - L / 2 - 2.75, 6.3, -0.6), (X0 - L / 2 - 2.75, 5.3, -1.3), (X0 - L / 2 - 1.4, 5.3, -1.3)], 0.32, C['body'], 0.4)
    for p0 in ((-0.6, 2.0), (0.6, 2.0)): elbow_pipe([(X0 - L / 2 - 1.62, p0[1], p0[0]), (X0 - L / 2 - 2.2, p0[1], p0[0]), (X0 - L / 2 - 2.2, 0.5, p0[0])], 0.13, C['water'])
with part('fpump', (X0, 3.55, -1.4)):
    cyl(0.38, L, X0, 4.55, -1.12, C['body'], 'X', 36)                              # charge-air receiver
    for x in cx: elbow_pipe([(x, 4.85, -1.12), (x, 5.25, -0.95), (x, 5.35, -0.55)], 0.12, C['body'])
    cyl(0.07, L, X0, 3.55, -1.38, C['fuel'], 'X', 12); cyl(0.09, L, X0, 3.3, -1.42, C['fuel'], 'X', 12)
    for x in cx:
        cyl(0.12, 0.35, x - 0.25, 3.75, -1.5, C['dark'], 'Y', 14); box(0.18, 0.1, 0.18, x - 0.25, 3.95, -1.5, C['steel'], 0.01)
        elbow_pipe([(x - 0.25, 3.98, -1.5), (x - 0.25, 4.15, -1.55), (x - 0.1, 5.2, -1.55), (x - 0.1, 5.4, -0.74)], 0.022, C['steel'], 0.08)
with part('pipes', (X0, 5.95, 0)):
    cyl(0.11, L, X0, 5.95, -1.25, C['water'], 'X', 14); cyl(0.11, L, X0, 3.6, 1.3, C['water'], 'X', 14); cyl(0.09, L, X0, 1.25, 1.35, C['air'], 'X', 12)
    for x in cx[::2]: elbow_pipe([(x, 5.95, -1.25), (x, 5.95, -0.75), (x, 5.6, -0.72)], 0.05, C['water'])
with part('coupling', (X0 + L / 2 + 0.6, 3.0, 0)):
    ax = X0 + L / 2 + 0.6
    cyl(1.45, 0.9, ax, 3.0, 0, C['body'], 'X', 48, 0.03); bolts(28, 1.35, ax + 0.46, 3.0, 0, 'X', 0.035, 0.1)
    cyl(1.0, 0.6, ax + 0.9, 3.0, 0, C['dark'], 'X', 40, 0.02)
with part('alt', (X0 + L / 2 + 3.5, 3.0, 0)):
    AL, AR, acx = 4.6, 1.7, X0 + L / 2 + 3.5
    cyl(AR, AL, acx, 3.0, 0, C['blue'], 'X', 64, 0.04)
    for k in range(15): torus(AR + 0.02, 0.05, acx - AL / 2 + 0.3 + k * 0.29, 3.0, 0, C['blue'], 'X', 64, 6)
    box(4.2, 1.3, 2.6, acx, 5.15, 0, C['blue'], 0.08)
    for k in range(6): cyl(0.09, 1.2, acx - 1.6 + k * 0.64, 5.15, -1.4, C['water'], 'Z', 12)
    box(1.3, 1.1, 0.9, acx + 0.6, 3.5, 1.95, C['blue'], 0.05)
    for k in range(3): elbow_pipe([(acx + 0.4 + k * 0.2, 3.5, 2.4), (acx + 0.4 + k * 0.2, 3.5, 2.9), (acx + 0.4 + k * 0.2, 0.3, 2.9)], 0.07, C['mvcable'], 0.3)
    for x in (acx - AL / 2 - 0.2, acx + AL / 2 + 0.2): box(0.6, 1.9, 3.0, x, 1.55, 0, C['blue'], 0.05)
    cyl(0.45, 0.3, acx + AL / 2 + 0.5, 3.0, 0, C['dark'], 'X', 32, 0.01)
with part('gallery', (X0, 3.9, -2.45)):
    gz, gy = -2.45, 3.9
    grating(L + 2, 1.1, X0, gy, gz)
    for k in range(8):
        xx = X0 - L / 2 - 0.9 + k * (L + 1.8) / 7; box(0.08, 0.08, 0.6, xx, gy - 0.12, gz + 0.25, C['base'], 0.01)
    railing((X0 - L / 2 - 1, gy, gz - 0.52), (X0 + L / 2 + 1, gy, gz - 0.52), 1.1, C['yellow'], 1.5)
    ladder(X0 - L / 2 - 0.5, 0.0, gy, gz - 0.3)
    box(0.8, 1.4, 0.4, X0 + L / 2 + 0.2, gy + 0.8, gz - 0.2, C['cover'], 0.03); box(0.6, 0.35, 0.02, X0 + L / 2 + 0.2, gy + 1.0, gz + 0.01, C['screen'], 0.0)
    extinguisher(X0 - L / 2 - 1.0, gy, gz - 0.45)
finalize(); export(f'{OUT}/genset.glb')
if os.environ.get('STILL'): still(f'{OUT}/genset_still.png', (-14, 10, -19), (0, 3.6, 0))

# ============================================================ engine-room kit (room frame, z+ side; mirrored in three for z- rooms)
reset(); C = palette()
with part('floor', (0, 0.2, 0)):
    box(30, 0.4, 26, 0, 0.2, 0, C['floor'], 0.0)
    for i in range(-14, 15, 2): box(0.02, 0.01, 26, i, 0.405, 0, C['dark'], 0.0)       # chequer plate seams
    for z in (-11.5, -4.0, 4.0, 11.5): box(30, 0.012, 0.08, 0, 0.41, z, C['yellow'], 0.0)  # walkway lines
with part('day', (12, 2.4, -9)):
    box(6, 4, 3, 12, 2.4, -9, mat('tank_ochre', 0xc9b25a, 0.3, 0.55), 0.06)
    for x in (9.6, 14.4): box(0.25, 0.6, 3.2, x, 0.7, -9, C['base'], 0.02)
    cyl(0.1, 3.0, 15.05, 2.6, -8.0, C['glass'], 'Y', 12); cyl(0.04, 3.0, 15.05, 2.6, -8.0, C['red'], 'Y', 8)   # sight glass
    railing((9.2, 4.4, -10.5), (14.8, 4.4, -10.5), 1.0); ladder(15.2, 0.4, 4.4, -9.8, 0.5, 'Z')
    for k in range(3): elbow_pipe([(10 + k * 1.5, 0.9, -7.5), (10 + k * 1.5, 0.6, -6.5), (10 + k * 1.5, 0.6, -2.0)], 0.07, C['fuel'])
with part('gvu', (-13, 1.6, 9)):
    box(3, 2.4, 2.2, -13, 1.6, 9, C['white'], 0.05)
    for k in range(3): box(0.9, 2.0, 0.03, -14.0 + k * 1.0, 1.6, 7.89, C['white'], 0.01); cyl(0.04, 0.2, -13.65 + k * 1.0, 1.7, 7.86, C['dark'], 'Y', 8)
    elbow_pipe([(-13, 2.8, 9), (-13, 3.6, 9), (-13, 3.6, 4.5)], 0.15, C['fuel']); box(0.3, 0.3, 0.3, -13, 3.6, 6.5, C['red'], 0.02)
with part('sep', (12, 1.5, 9)):
    box(3.4, 0.4, 2.4, 12.6, 0.6, 9, C['base'], 0.02); cyl(0.7, 2.2, 12, 1.9, 9, mat('separator', 0x8c8f60, 0.4, 0.45), 'Y', 32, 0.05)
    sphere(0.7, 12, 3.0, 9, mat('separator', 0x8c8f60)); cyl(0.4, 0.9, 13.6, 1.25, 9, C['blue'], 'X', 24, 0.02)
with part('co2', (-12, 1.2, -10.5)):
    for i in range(48):
        x, z = -14 + (i % 12) * 0.32, -11 + (i // 12) * 0.32
        cyl(0.13, 1.5, x, 1.15, z, C['red'], 'Y', 14, 0.03); cyl(0.05, 0.15, x, 1.98, z, C['dark'], 'Y', 8)
    for r in range(4): cyl(0.05, 3.9, -12.24, 2.15, -11 + r * 0.32, C['steel'], 'X', 10)
    box(4.2, 0.08, 1.4, -12.24, 1.8, -10.52, C['dark'], 0.0); box(4.2, 0.06, 1.4, -12.24, 0.42, -10.52, C['dark'], 0.0)
    elbow_pipe([(-10, 2.15, -10.5), (-9.5, 2.15, -10.5), (-9.5, 11.0, -10.5)], 0.08, C['red'])
    for x in range(-12, 13, 4): cyl(0.05, 0.3, x, 10.85, -2, C['red'], 'Y', 8)                 # discharge nozzles
    pipe([(-9.5, 11.0, -10.5), (-9.5, 11.0, -2), (12, 11.0, -2)], 0.06, C['red'], poly=True)
with part('crane', (0, 11.4, 0)):
    for z in (-11.6, 11.6): box(30, 0.6, 0.4, 0, 11.4, z, C['yellow'], 0.02)
    box(0.6, 0.7, 23.2, 2, 11.2, 0, C['yellow'], 0.03)
    box(1.2, 0.8, 1.2, 2, 10.6, 3, C['dark'], 0.03); pipe([(2, 10.2, 3), (2, 8.5, 3)], 0.02, C['steel'], poly=True); box(0.3, 0.4, 0.15, 2, 8.3, 3, C['yellow'], 0.02)
with part('fans', (-10, 11, 11)):
    for x in (-10, 10):
        cyl(1.1, 1.8, x, 11, 11, C['body'], 'Y', 32, 0.03); cyl(1.25, 0.1, x, 10.1, 11, C['dark'], 'Y', 32); cyl(0.3, 0.6, x, 11, 11, C['blue'], 'Y', 16)
        box(2.4, 2.4, 0.4, x, 11, 12.8, C['grate'], 0.02)
with part('lights', (0, 10.5, 0)):
    for x in range(-12, 13, 6):
        for z in (-6, 6): box(1.2, 0.1, 0.3, x, 10.5, z, mat('led', 0xffffff, 0.0, 0.3, 0xfff6e0, 3.0), 0.01)
with part('cable_tray', (0, 9.6, 0)):
    for z in (-3.75, 3.75):
        box(28, 0.04, 0.6, 0, 9.6, z, C['grate'], 0.0)
        for s in (-0.3, 0.3): box(28, 0.15, 0.03, 0, 9.67, z + s, C['grate'], 0.0)
        for k in range(8): pipe([(-14, 9.68, z - 0.2 + k * 0.055), (14, 9.68, z - 0.2 + k * 0.055)], 0.025, C['cable'], poly=True)
finalize(); export(f'{OUT}/roomkit.glb')
print('DONE')
