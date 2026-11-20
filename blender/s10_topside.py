# COLOSSAL topside fit-out, slewing-deck frame (three coords; roof at y 50, block x -150..30, z +-32; glacis
# 30..58; nose top y 36 from x 58..92). Every item is a named node with an explicit function (see ga.js TOPSIDE).
# Fit modelled on how a carrier island / destroyer topside is laid out: command tower with fixed AESA faces,
# rotating long-range radar, integrated mast with ESM / IFF / comms, satcom radomes, EO/IR, point defence,
# vertical launch cells, canister missiles, decoys, aviation (helideck + hangar), boats, cranes, lighting.
# Geometry INVENTED; no performance data for any weapon or sensor.
import sys, os, math; sys.path.insert(0, os.path.dirname(__file__))
from blib import *
OUT = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else '/tmp/b'
reset(); C = palette()
W = mat('topside_white', 0xe4e2dc, 0.1, 0.5); G = mat('topside_grey', 0x9aa0a4, 0.3, 0.5); D = mat('topside_dark', 0x2b2e32, 0.5, 0.45)
AESA = mat('aesa_face', 0x2a3038, 0.6, 0.35); TILE = mat('aesa_tile', 0x3a434e, 0.7, 0.3); WIN = mat('bridge_glass', 0x16202a, 0.6, 0.06, 0xbfd8ff, 0.25)
LIT = mat('window_lit', 0x2a2416, 0.2, 0.2, 0xffe2a8, 1.4); RAD = mat('radome', 0xf2f1ec, 0.0, 0.35); BAR = mat('gun_black', 0x1a1c1f, 0.8, 0.35)
HD = mat('helideck_green', 0x3b4a3e, 0.1, 0.85); MARK = mat('deck_mark_white', 0xf0f0ea, 0.0, 0.6); MY = mat('deck_mark_yellow', 0xf2c21a, 0.0, 0.6)
NAVG = mat('nav_green', 0x0a3a14, 0, 0.3, 0x30ff60, 3.0); NAVR = mat('nav_red', 0x3a0a0a, 0, 0.3, 0xff3030, 3.0); FLOOD = mat('flood', 0xffffff, 0, 0.3, 0xfff2d0, 3.0)

def window_band(x0, x1, y, z, h, step=1.6, lit_every=3, face='z'):
    n = int((x1 - x0) / step)
    for i in range(n):
        x = x0 + (i + 0.5) * step; m = LIT if i % lit_every == 1 else WIN
        if face == 'z': box(step - 0.3, h, 0.12, x, y, z, m, 0.02); box(0.18, h + 0.2, 0.2, x - step / 2, y, z, W, 0.02)
        else: box(0.12, h, step - 0.3, z, y, x, m, 0.02); box(0.2, h + 0.2, 0.18, z, y, x - step / 2, W, 0.02)

# ---------------------------------------------------------------- command island (x -6..30, z -16..16)
with part('island', (12, 57, 0)):
    box(36, 14, 32, 12, 57, 0, W, 0.5)                                            # 01-03 levels (ops, offices, comms)
    for y in (52.6, 56.8, 61.0):
        window_band(-4, 28, y, 16.05, 1.3); window_band(-4, 28, y, -16.05, 1.3)
        window_band(-14, 14, y, 30.05, 1.3, face='x'); window_band(-14, 14, y, -6.05, 1.3, face='x')
    for y in (54.7, 58.9): box(36.4, 0.3, 32.4, 12, y, 0, G, 0.05)                 # deck-edge lines
    for s in (1, -1):
        for x in (-2, 26): box(1.3, 2.2, 0.12, x, 51.1, s * 16.06, mat('door_grey', 0xb7bdc1, 0.4, 0.4), 0.05)
        ladder(-6.6, 50, 64, s * 10, 0.6, 'Z')
with part('bridge', (12, 67, 0)):
    box(30, 6, 28, 12, 67, 0, W, 0.3)                                             # navigation bridge
    for s in (1, -1):                                                             # raked bridge windows (outward-leaning)
        for i in range(14): box(1.9, 2.4, 0.12, -1.0 + i * 2.0, 67.6, s * 14.2, WIN, 0.02, rx=s * 0.18)
    for i in range(12): box(0.12, 2.4, 1.9, 27.2, 67.6, -11.0 + i * 2.0, WIN, 0.02, rz=-0.18)
    for s in (1, -1):                                                             # bridge wings + repeaters + EO/IR
        box(8, 0.5, 7, 20, 64.2, s * 17.5, W, 0.1); box(8.2, 1.1, 0.12, 20, 65.0, s * 21.0, W, 0.02)
        box(0.6, 1.1, 0.5, 22, 65.0, s * 19.5, D, 0.05); box(0.4, 0.3, 0.02, 22, 65.6, s * 19.5 - 0.0, mat('screen_data', 0x0b1622, 0, 0.25, 0x2a9df4, 1.6), 0.0)
        cyl(0.5, 1.0, 23, 65.0, s * 20, G, 'Y', 16); sphere(0.75, 23, 66.2, s * 20, D, 20)   # EO/IR ball turret
    box(31, 0.6, 29, 12, 70.3, 0, G, 0.1)
    for s in (1, -1): box(0.4, 0.4, 0.3, 26.8, 70.0, s * 13.0, NAVG if s > 0 else NAVR, 0.02)
with part('mast', (8, 88, 0)):                                                    # integrated mast (octagonal, tapering)
    cyl(9.5, 4, 8, 72.5, 0, W, 'Y', 8, 0.2)
    cyl(8.0, 30, 8, 89.5, 0, W, 'Y', 8, 0.0, r2=5.5)
    for y in (78, 92): torus(8.0 - (y - 74.5) * 0.083, 0.25, 8, y, 0, G, 'Y', 8, 4)
with part('aesa', (8, 82, 0)):                                                    # 4 fixed S-band AESA faces + 4 X-band faces
    for k in range(4):
        a = k * math.pi / 2; r = 7.55; cx, cz = 8 + r * math.cos(a), r * math.sin(a)
        box(0.5, 6.6, 6.6, cx, 82, cz, AESA, 0.3, ry=-a)
        for i in range(-3, 4):                                                    # tile grid: vertical strips across the face
            off = i * 0.95; box(0.1, 6.2, 0.06, cx + 0.3 * math.cos(a) - off * math.sin(a), 82, cz + 0.3 * math.sin(a) + off * math.cos(a), TILE, 0.0, ry=-a)
        for j in range(6): box(0.1, 0.06, 6.2, cx + 0.3 * math.cos(a), 79.4 + j * 1.05, cz + 0.3 * math.sin(a), TILE, 0.0, ry=-a)
        r2 = 6.15; box(0.4, 3.0, 3.0, 8 + r2 * math.cos(a), 94.5, r2 * math.sin(a), AESA, 0.2, ry=-a)      # X-band faces
with part('lrradar', (8, 108, 0)):                                                # rotating long-range air-search radar
    cyl(1.6, 3.5, 8, 106.3, 0, G, 'Y', 24, 0.1)
    box(2.0, 4.6, 14, 8, 110.6, 0, D, 0.2)
    for j in range(8): box(2.1, 0.08, 13.6, 8, 108.7 + j * 0.55, 0, G, 0.0)
    box(1.2, 1.0, 3.0, 9.4, 108.6, 0, G, 0.1)
with part('esm', (8, 99, 0)):                                                     # ESM / IFF / comms ring + yardarms
    cyl(4.6, 2.2, 8, 99, 0, D, 'Y', 32, 0.1)
    for k in range(16): a = k / 16 * 2 * math.pi; box(0.25, 1.6, 0.9, 8 + 4.75 * math.cos(a), 99, 4.75 * math.sin(a), RAD, 0.05, ry=-a)
    for s in (1, -1):
        box(0.4, 0.4, 14, 8, 101.5, s * 7, G, 0.05)
        for k in range(5):
            z = s * (3 + k * 2.2); cyl(0.05, 3.5 + (k % 3), 8, 103.5 + (k % 3) * 0.5, z, D, 'Y', 6)                 # whips
            if k % 2 == 0: box(0.1, 1.4, 1.6, 8.6, 100.6, z, D, 0.0)                                                 # log-periodic
        cyl(0.7, 0.3, 8.6, 101.0, s * 13.5, RAD, 'X', 20)
    cyl(0.08, 8, 8, 116.5, 0, D, 'Y', 6); sphere(0.25, 8, 120.6, 0, NAVR, 10)                                       # lightning rod + aero light
with part('satcom', (0, 66, 0)):                                                  # 4 satcom radomes on sponsons
    for x, z in ((-8, 18), (-8, -18), (30, 12), (30, -12)):
        cyl(1.4, 2.0, x, 65, z, G, 'Y', 16, 0.05); sphere(2.4, x, 68.0, z, RAD, 32); cyl(2.4, 0.6, x, 66.6, z, RAD, 'Y', 32)
with part('eoir', (0, 0, 0)):                                                     # long-range EO/IR surveillance turrets on masts
    for x, z in ((-120, 28), (-120, -28), (-30, 0)):
        cyl(0.5, 9, x, 54.5, z, G, 'Y', 12); cyl(1.0, 1.0, x, 59.4, z, D, 'Y', 20); sphere(1.1, x, 60.6, z, D, 24); box(0.8, 0.5, 0.05, x + 1.05, 60.6, z, mat('lens', 0x101820, 1.0, 0.05, 0x203040, 0.3), 0.0)
# ---------------------------------------------------------------- weapons (visual only)
def ciws(x, y, z, rot=0.0):
    cyl(1.6, 1.2, x, y + 0.6, z, G, 'Y', 24, 0.1); cyl(1.2, 2.4, x, y + 2.2, z, W, 'Y', 24, 0.1); sphere(1.2, x, y + 3.4, z, W, 24)
    for k in range(6): a = k / 6 * 2 * math.pi; cyl(0.06, 3.2, x + 2.4 * math.cos(rot), y + 2.6 + 0.18 * math.sin(a), z + 2.4 * math.sin(rot) + 0.18 * math.cos(a), BAR, 'X', 6)
    box(0.9, 0.9, 0.9, x - 1.0, y + 2.4, z, G, 0.1)
with part('ciws', (0, 50, 0)):
    for x, y, z in ((-146, 50, 28), (-146, 50, -28), (26, 70.6, 13), (26, 70.6, -13), (88, 36, 26), (88, 36, -26)): ciws(x, y, z)
with part('vls', (-55, 50.5, 0)):                                                 # 4 x 64-cell vertical launch modules
    for mx, mz in ((-66, 12), (-66, -12), (-44, 12), (-44, -12)):
        box(19, 0.8, 9.4, mx, 50.4, mz, G, 0.05)
        for i in range(8):
            for j in range(8):
                x, z = mx - 8.0 + i * 2.28, mz - 3.9 + j * 1.11
                box(2.0, 0.12, 0.95, x, 50.85, z, D, 0.03); box(0.12, 0.08, 0.95, x - 0.95, 50.95, z, G, 0.0)
        box(19, 0.15, 0.6, mx, 50.9, mz + 4.95, MY, 0.0); box(0.6, 0.15, 9.4, mx + 9.7, 50.9, mz, MY, 0.0)
        box(19, 1.6, 0.8, mx, 51.2, mz - 5.0 * (1 if mz > 0 else -1), G, 0.05)                              # uptake plenum
with part('canisters', (-20, 52, 0)):                                             # 4 quad canister launchers (anti-ship), angled
    for x, z, s in ((-20, 26, 1), (-20, -26, -1), (-28, 26, 1), (-28, -26, -1)):
        box(3.0, 1.2, 2.4, x, 50.6, z, G, 0.05)
        for k in range(4): box(9.5, 1.0, 1.0, x, 52.4 + (k // 2) * 1.05, z - 0.55 + (k % 2) * 1.1, D, 0.12, rz=0.6)
with part('ram', (24, 71, 0)):                                                    # point-defence missile launchers (21 cell)
    for z in (6, -6):
        cyl(1.4, 1.0, 22, 71.1, z, G, 'Y', 20, 0.05); box(3.2, 2.2, 2.4, 22, 73.0, z, W, 0.15, rz=0.3)
        for i in range(3):
            for j in range(3): cyl(0.27, 0.12, 23.62, 72.3 + j * 0.62, z - 0.62 + i * 0.62, D, 'X', 12)
with part('decoys', (0, 51, 0)):                                                  # 6-tube decoy launchers
    for x, z in ((-140, 30), (-140, -30), (20, 30), (20, -30)):
        box(1.4, 0.8, 1.4, x, 50.4, z, G, 0.05)
        for k in range(6): cyl(0.14, 1.2, x - 0.4 + (k % 3) * 0.4, 51.2 + (k // 3) * 0.35, z, D, 'Y', 10)
with part('directed', (75, 37, 0)):                                               # directed-energy / dazzler turret on the nose
    cyl(2.2, 1.5, 75, 36.75, 0, G, 'Y', 24, 0.1); box(4, 2.6, 3.2, 75, 38.8, 0, W, 0.4); cyl(0.9, 1.2, 77.6, 38.9, 0, mat('lens', 0x101820, 1.0, 0.05, 0x203040, 0.3), 'X', 24)
# ---------------------------------------------------------------- aviation, boats, cranes, lighting, comms
with part('helideck', (-133, 50.6, 0)):
    box(32, 0.3, 54, -133, 50.35, 0, HD, 0.02)
    torus(9, 0.25, -133, 50.55, 0, MY, 'Y', 64, 4)
    for dx in (-2.6, 2.6): box(1.0, 0.05, 7.0, -133 + dx, 50.53, 0, MARK, 0.0)
    box(5.2, 0.05, 1.0, -133, 50.53, 0, MARK, 0.0)
    for k in range(28): a = k / 28 * 2 * math.pi; box(0.35, 0.18, 0.35, -133 + 15 * math.cos(a) * 0.98, 50.6, 25 * math.sin(a) * 0.98, NAVG, 0.02)
    for s in (1, -1): box(32, 0.15, 1.2, -133, 50.6, s * 26.6, mat('safety_net', 0x343434, 0, 0.8), 0.0)
with part('hangar', (-100, 55, 0)):
    box(26, 10, 40, -100, 55, 0, W, 0.4)
    for z in (-10, 10):
        box(0.2, 8.4, 17, -113.1, 54.2, z, mat('roller_door', 0xb0b4b6, 0.6, 0.4), 0.0)
        for k in range(14): box(0.25, 0.08, 17, -113.2, 50.4 + k * 0.6, z, G, 0.0)
    box(26.4, 0.4, 40.4, -100, 60.2, 0, G, 0.05)
    for s in (1, -1): box(1.0, 1.0, 1.0, -88, 60.9, s * 18, FLOOD, 0.02)
with part('boats', (-60, 44, 0)):                                                 # RHIBs on davits, both sides
    for x in (-70, -45):
        for s in (1, -1):
            cyl(1.0, 9, x, 44, s * 34.6, mat('rhib_orange', 0xe8622a, 0.1, 0.6), 'X', 20); box(8, 1.0, 2.4, x, 44.6, s * 34.6, C['white'], 0.2)
            for dx in (-3.5, 3.5): box(0.4, 7, 0.4, x + dx, 47.5, s * 33.3, G, 0.05); box(0.4, 0.4, 2.6, x + dx, 51.0, s * 34.3, G, 0.05)
with part('crane', (-80, 55, 26)):                                                # knuckle-boom deck crane
    cyl(1.6, 3, -80, 51.5, 26, mat('crane_yellow', 0xe8b81a, 0.3, 0.5), 'Y', 24, 0.1)
    box(12, 1.2, 1.2, -75, 56, 26, mat('crane_yellow', 0xe8b81a), 0.2, rz=0.55); box(9, 1.0, 1.0, -66.5, 58.0, 26, mat('crane_yellow', 0xe8b81a), 0.2, rz=-0.35)
    pipe([(-62.5, 56.5, 26), (-62.5, 52.0, 26)], 0.05, C['steel'], poly=True); box(0.5, 0.6, 0.4, -62.5, 51.6, 26, C['yellow'], 0.05)
with part('hf_whips', (0, 51, 0)):                                                # HF whips + LOS dishes along the roof edge
    for x in range(-145, 25, 20):
        for s in (1, -1): cyl(0.08, 11, x, 55.5, s * 31.6, D, 'Y', 6); cyl(0.35, 0.6, x, 50.3, s * 31.6, G, 'Y', 10)
    for x, z in ((-10, 24), (-10, -24)): cyl(0.3, 3, x, 51.5, z, G, 'Y', 10); cyl(1.4, 0.3, x + 0.5, 53.5, z, RAD, 'X', 24, 0.0, r2=0.4)
with part('lightmasts', (0, 51, 0)):
    for x, z in ((-145, 0), (-30, 30), (-30, -30), (-80, -28)):
        cyl(0.25, 8, x, 54, z, G, 'Y', 10)
        for k in range(3): box(0.6, 0.4, 0.3, x + 0.3, 57.6 + k * 0.1, z - 0.5 + k * 0.5, FLOOD, 0.02)
with part('vents', (0, 51, 0)):
    for x in range(-140, 10, 30):
        for s in (1, -1):
            box(4, 2.4, 3, x, 51.2, s * 22, G, 0.15)
            for k in range(6): box(4.1, 0.08, 0.2, x, 50.4 + k * 0.35, s * 22 + s * 1.55, D, 0.0)
with part('deckmarks', (0, 50.2, 0)):
    for s in (1, -1): box(178, 0.05, 0.25, -61, 50.16, s * 29, MY, 0.0)
    for x in range(-110, 30, 10): box(3.0, 0.05, 0.4, x, 50.16, 0, MARK, 0.0)
finalize(); export(f'{OUT}/topside.glb')
if os.environ.get('STILL'): still(f'{OUT}/topside_still.png', (95, 105, 115), (-30, 62, 0), 26, 1400, 788, 24)
print('DONE')
