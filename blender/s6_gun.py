# System 6 - Gun & elevation. Frames (three coords):
#  hpu.glb  HPU room, frame H (slewing deck at x 44, y 8): 12 pump sets at (-10 + 4 (i % 6), 0.4, +-8),
#           reservoir, 16 piston accumulators, valve manifold, return filters, coolers
#  gun.glb  boom frame GB (origin on the trunnion axis, barrel along +x): trunnions, cradle, recoil cylinders,
#           breech, breech ring, loading tray, carrier, hoist trunk, jacket rings, bore
# Pump type/count/pressure from sysdata (A4VSO 1000, 350 bar). Gun internals VISUAL ONLY - no ballistic data.
import sys, os, math; sys.path.insert(0, os.path.dirname(__file__))
from blib import *
OUT = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else '/tmp/b'

reset(); C = palette(); hyd = mat('hyd_green', 0x2f6b3a, 0.4, 0.45); pr = mat('pressure_red', 0xb52a20, 0.4, 0.4); ret = mat('return_blue', 0x2a4fb5, 0.4, 0.4)
with part('floor', (0, 0.2, 0)):
    box(26, 0.4, 36, 0, 0.2, 0, C['floor'], 0.0)
    for z in (-12, 0, 12): box(26, 0.01, 0.1, 0, 0.405, z, C['yellow'], 0.0)
    box(26, 0.3, 0.6, 0, 0.55, 3.5, C['grate'], 0.0); box(26, 0.3, 0.6, 0, 0.55, -3.5, C['grate'], 0.0)   # drip trays
with part('pumps', (-10, 1.0, 8)):
    for i in range(12):
        px, pz = -10 + (i % 6) * 4, (8 if i < 6 else -8)
        box(3.4, 0.25, 1.4, px + 0.5, 0.55, pz, C['base'], 0.02)                          # skid
        cyl(0.55, 1.8, px - 0.4, 1.25, pz, C['blue'], 'X', 40, 0.04)                       # 1,000 rpm motor
        for f in range(12): box(1.6, 0.05, 0.1, px - 0.4, 1.25 + 0.57 * math.sin(f * 0.524), pz + 0.57 * math.cos(f * 0.524), C['blue'], 0.005, rx=f * 0.524)
        cyl(0.6, 0.4, px - 1.45, 1.25, pz, mat('fan_cowl', 0x24364f, 0.4, 0.45), 'X', 40, 0.02)
        box(0.5, 0.4, 0.45, px - 0.4, 1.95, pz, C['blue'], 0.03)
        cyl(0.42, 0.6, px + 0.8, 1.25, pz, C['steel'], 'X', 32, 0.02)                      # bellhousing + coupling
        box(1.0, 0.85, 0.8, px + 1.55, 1.25, pz, hyd, 0.06)                                 # A4VSO swashplate pump
        cyl(0.18, 0.4, px + 1.55, 1.85, pz, hyd, 'Y', 20); box(0.35, 0.25, 0.35, px + 2.2, 1.25, pz, hyd, 0.03)   # control + port block
        elbow_pipe([(px + 1.55, 2.05, pz), (px + 1.55, 4.6, pz), (12, 4.6, pz * 0.4)], 0.11, pr, 0.4)
        elbow_pipe([(px + 1.55, 0.9, pz - 0.5), (px + 1.55, 0.9, pz - 1.4), (-6, 0.9, pz * 0.45)], 0.13, ret, 0.4)
        cyl(0.1, 0.3, px + 1.55, 3.2, pz, C['white'], 'Z', 16)                              # pressure gauge
with part('resv', (-6, 3.0, 0)):
    box(10, 5, 8, -6, 3.0, 0, hyd, 0.08)
    for x in (-9, -3): cyl(0.6, 0.15, x, 5.55, 0, C['steel'], 'Y', 24); bolts(12, 0.52, x, 5.6, 0, 'Y', 0.03, 0.06)   # manways
    for x in (-10, -6, -2): cyl(0.15, 0.5, x, 5.75, 2.5, C['dark'], 'Y', 16)                                          # breathers
    box(0.25, 3.5, 0.08, -0.95, 3.0, 4.05, C['glass'], 0.0); box(0.06, 2.0, 0.09, -0.95, 2.4, 4.06, mat('oil_level', 0xc9a227, 0.1, 0.3), 0.0)  # level gauge
    ladder(-11.3, 0.4, 5.5, 2.0, 0.5, 'Z'); railing((-11, 5.5, -4), (-1, 5.5, -4), 1.0); railing((-11, 5.5, 4), (-1, 5.5, 4), 1.0)
    for k in range(3): box(1.4, 2.2, 0.4, -9 + k * 3, 2.0, -4.25, C['steel'], 0.03)                                   # plate coolers
with part('accB', (7.5, 2.0, 0)):
    for i in range(16):
        x, z = 4 + (i % 8) * 1.0, (3 if i < 8 else -3)
        cyl(0.4, 3.0, x, 2.0, z, mat('acc_red', 0x8a2b2b, 0.5, 0.4), 'Y', 32, 0.04); sphere(0.4, x, 3.5, z, mat('acc_red', 0x8a2b2b), 24)
        cyl(0.08, 0.3, x, 3.95, z, C['steel'], 'Y', 12)
    for z in (3, -3):
        for y in (1.2, 2.8): box(8.4, 0.12, 0.12, 7.5, y, z + 0.45, C['yellow'], 0.01)   # rack
        pipe([(4, 0.6, z), (11, 0.6, z)], 0.12, pr, poly=True)
with part('vblk', (11, 2.0, 0)):
    box(3, 2, 4, 11, 2.0, 0, C['steel'], 0.06)
    for i in range(12): cyl(0.14, 0.5, 9.9 + (i % 4) * 0.7, 3.2, -1.4 + (i // 4) * 1.4, C['dark'], 'Y', 16); box(0.25, 0.25, 0.25, 9.9 + (i % 4) * 0.7, 3.6, -1.4 + (i // 4) * 1.4, C['yellow'], 0.02)  # cartridge valves + solenoids
    for z in (-1.2, 1.2): elbow_pipe([(12.5, 2.4, z), (13.6, 2.4, z), (13.6, 6.0, z)], 0.22, pr, 0.6)
with part('filt', (8, 1.1, -13)):
    for i in range(3): cyl(0.3, 1.4, 8, 1.1, -14 + i, mat('filter_y', 0xc0a030, 0.4, 0.4), 'Y', 24, 0.04); cyl(0.32, 0.12, 8, 1.85, -14 + i, C['dark'], 'Y', 24)
    elbow_pipe([(8, 1.9, -14), (8, 2.3, -14), (8, 2.3, -12)], 0.1, ret)
finalize(); export(f'{OUT}/hpu.glb')
if os.environ.get('STILL'): still(f'{OUT}/hpu_still.png', (22, 14, 26), (0, 1.5, 0), 34)

# ============================================================ gun internals (boom frame), VISUAL ONLY
reset(); C = palette(); gm = mat('gun_metal', 0x3a3e44, 0.8, 0.35); cy = mat('cradle_grey', 0x4a5058, 0.7, 0.4); chrome = mat('chrome', 0xe8ecef, 1.0, 0.06)
with part('trunnion', (0, 0, 12.6)):
    for z in (12.6, -12.6):
        cyl(3.2, 2.2, 0, 0, z, C['body'], 'Z', 64, 0.06); cyl(2.2, 0.5, 0, 0, z + math.copysign(1.35, z), C['steel'], 'Z', 48, 0.03)
        bolts(16, 1.8, 0, 0, z + math.copysign(1.65, z), 'Z', 0.1, 0.4)
        box(5.5, 7.0, 2.6, 0, -4.0, z, C['body'], 0.1)                                     # trunnion bracket to the deck
with part('cradle', (32, -11.5, 0)):
    box(60, 3, 20, 32, -11.5, 0, cy, 0.12)
    for x in range(6, 62, 6): box(0.6, 3.6, 20.4, x, -11.5, 0, cy, 0.05)
    for z in (-9.6, 9.6): box(60, 0.5, 0.5, 32, -9.7, z, C['steel'], 0.04)                 # slide rails
    for x in range(8, 60, 8):
        for z in (-9.0, 9.0): cyl(0.25, 0.3, x, -9.8, z, C['dark'], 'Y', 12)
with part('recoil', (50, 0, 0)):
    for y, z in ((5.4, 5.4), (5.4, -5.4), (-5.4, 5.4), (-5.4, -5.4)):
        cyl(0.9, 26, 50, y, z, cy, 'X', 40, 0.03); cyl(0.5, 4, 35, y, z, chrome, 'X', 24)
        for x in (37, 63): box(2.4, 2.4, 2.4, x, y, z, gm, 0.15)
        for x in range(40, 62, 5): torus(0.92, 0.05, x, y, z, C['dark'], 'X', 40, 6)
with part('breech', (6, 0, 0)):
    box(10, 9, 9, 6, 0, 0, gm, 0.35)
    cyl(1.2, 1.5, 1.0, 0, 0, C['steel'], 'X', 40, 0.1)                                     # block hinge boss
    box(0.8, 1.6, 6, 0.6, 3.0, 0, C['steel'], 0.1)                                         # operating lever
    for y in (-3, 3): cyl(0.6, 10.2, 6, y, 4.6, C['dark'], 'X', 24)
with part('bring', (12.5, 0, 0)):
    cyl(6.2, 3, 12.5, 0, 0, gm, 'X', 64, 0.12); cyl(5.0, 0.6, 14.2, 0, 0, C['steel'], 'X', 64, 0.05); bolts(24, 5.6, 14.5, 0, 0, 'X', 0.12, 0.4)
with part('tray', (-2, -3.5, 0)):
    box(14, 0.5, 3, -2, -3.5, 0, C['steel'], 0.05)
    for z in (-1.4, 1.4): box(14, 0.8, 0.2, -2, -3.0, z, C['steel'], 0.03)
    for x in range(-8, 5, 3): cyl(0.25, 2.6, x, -3.05, 0, chrome, 'Z', 16)                 # rollers
with part('carrier', (6, -6, 0)):
    box(8, 1.2, 10, 6, -6, 0, mat('carrier_gold', 0xc8a02e, 0.7, 0.35), 0.1)
    for x in (3, 9): cyl(0.4, 3, x, -7.8, 4, chrome, 'Y', 24); cyl(0.4, 3, x, -7.8, -4, chrome, 'Y', 24)
with part('hoist', (-12, -15, 0)):
    pipe([(-34, -16, 0), (-12, -15, 0), (-2, -10, 0), (4, -6, 0)], 1.0, mat('hoist_grey', 0x5a5f66, 0.5, 0.45))
    for x in (-30, -20, -10): torus(1.05, 0.08, x, -15.9 + (x + 34) * 0.045, 0, C['dark'], 'X', 40, 6)
with part('jacket', (66, 0, 0)):
    for x in range(66, 236, 10):
        cyl(6.4, 1.4, x, 0, 0, gm, 'X', 64, 0.1)
        bolts(24, 6.0, x + 0.72, 0, 0, 'X', 0.1, 0.25)
with part('bore', (120, 0, 0)):
    cyl(2.7, 228, 120, 0, 0, mat('bore_dark', 0x0c0c0c, 0.2, 0.6), 'X', 48)
finalize(); export(f'{OUT}/gun.glb')
if os.environ.get('STILL'): still(f'{OUT}/gun_still.png', (-30, 18, 50), (20, -2, 0), 30)
print('DONE')
