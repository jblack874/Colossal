# COLOSSAL munitions, slewing-deck frame (three coords). Projectile magazines port/starboard of the HPU room
# (x 34..90, |z| 19..31, y 8..20), propellant charge magazines above them (y 21..34), transfer rails to the
# hoist foot at (46, 8, 0), and the shell used by the animated load cycle ('shell', origin at its centre).
# Projectile calibre follows the bore (r 2.7 m -> 5.3 m shell); everything else INVENTED. Visual only.
import sys, os, math; sys.path.insert(0, os.path.dirname(__file__))
from blib import *
OUT = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else '/tmp/b'
reset(); C = palette()
proj = mat('projectile_grey', 0x6c7378, 0.7, 0.4); band = mat('driving_band', 0xb87333, 1.0, 0.3); heb = mat('he_yellow', 0xe8c21a, 0.2, 0.45)
rack = mat('mag_rack', 0x5a6168, 0.6, 0.45); chg = mat('charge_case', 0x4c5a38, 0.3, 0.55); brass = mat('brass_case', 0xc9a24a, 1.0, 0.3)
red = mat('signal_red', 0xc23a2b, 0.1, 0.4); door = mat('blast_door', 0x8d9399, 0.7, 0.4); sp = mat('sprinkler_red', 0xb52a20, 0.3, 0.45)

def shell(x, y, z, L=16.0, R=2.65):
    cyl(R, L * 0.56, x - L * 0.22, y, z, proj, 'X', 40, 0.1)
    cyl(R, L * 0.34, x + L * 0.23, y, z, proj, 'X', 40, 0.0, r2=0.55)
    torus(R + 0.01, 0.12, x - L * 0.42, y, z, band, 'X', 40, 6); torus(R + 0.01, 0.12, x - L * 0.37, y, z, band, 'X', 40, 6)
    torus(R + 0.01, 0.18, x + L * 0.05, y, z, heb, 'X', 40, 6); cyl(0.55, 0.5, x + L * 0.42, y, z, C['steel'], 'X', 20)

for side in (1, -1):
    tag = 'P' if side > 0 else 'S'
    with part(f'shellmag{tag}', (62, 14, side * 25)):
        for xc in (42, 60, 78):                                                     # 3 bays along x
            for zc in (22.0, 28.0):
                for yc in (11.0, 16.6):
                    shell(xc, yc, side * zc)
                    for dx in (-4.5, 3.5): box(0.8, 0.5, 5.6, xc + dx, yc - 2.95, side * zc, rack, 0.05)   # cradles
        for x in range(34, 92, 6):                                                  # rack columns + tier beams
            for z in (19.2, 25.0, 30.8): box(0.35, 12, 0.35, x, 14, side * z, rack, 0.03)
            box(0.3, 0.3, 11.8, x, 13.65, side * 25, rack, 0.02)
        for x in range(36, 90, 9): pipe([(x, 19.6, side * 19.5), (x, 19.6, side * 30.5)], 0.06, sp, poly=True)    # flooding / sprinkler
        for x in range(36, 90, 6): cyl(0.08, 0.2, x, 19.4, side * 22, sp, 'Y', 8); cyl(0.08, 0.2, x, 19.4, side * 28, sp, 'Y', 8)
        box(56, 0.3, 0.3, 62, 8.2, side * 25, C['steel'], 0.02)                     # rail for the transfer trolley
    with part(f'chargemag{tag}', (62, 27, side * 25)):
        for xc in (42, 60, 78):
            for zc in (22.0, 28.0):
                for yc in (24.0, 29.6):
                    for k in range(3): cyl(2.5, 2.2, xc - 4.8 + k * 2.4 + 2.4, yc, side * zc, chg, 'X', 36, 0.08); torus(2.51, 0.08, xc - 4.8 + k * 2.4 + 2.4, yc, side * zc, brass, 'X', 36, 6)
                    box(0.5, 0.3, 4.8, xc - 3.6, yc - 2.65, side * zc, rack, 0.03); box(0.5, 0.3, 4.8, xc + 3.6, yc - 2.65, side * zc, rack, 0.03)
        box(56, 0.4, 13, 62, 21.0, side * 25, C['grate'], 0.0)                      # tier deck between shell + charge magazines
        for x in range(36, 90, 9): pipe([(x, 33.5, side * 19.5), (x, 33.5, side * 30.5)], 0.06, sp, poly=True)
    with part(f'blastdoor{tag}', (33.5, 14, side * 25)):                           # sliding blast doors to the HPU / hoist area
        box(0.8, 10, 10, 33.5, 14, side * 25, door, 0.15)
        for y in (10, 14, 18): box(0.9, 0.4, 10.2, 33.5, y, side * 25, rack, 0.03)
        box(0.9, 0.6, 3.0, 33.6, 20.0, side * 25, red, 0.05)                         # warning panel
    with part(f'transfer{tag}', (46, 9, side * 12)):                               # transfer trolley + rails to the hoist foot
        for dz in (-1.5, 1.5): box(0.25, 0.25, 22, 46 + dz, 8.15, side * 12, C['steel'], 0.02)
        box(4.0, 1.2, 3.0, 46, 8.9, side * 14, C['yellow'], 0.1)
        for dx in (-1.6, 1.6): cyl(0.35, 0.3, 46 + dx, 8.4, side * 14, C['dark'], 'Z', 16)
with part('hoistfoot', (46, 10, 0)):                                               # hoist foot: rotating loading tray
    cyl(4.0, 1.4, 46, 8.7, 0, C['steel'], 'Y', 40, 0.1); box(18, 0.8, 6, 46, 9.8, 0, rack, 0.1)
    for dz in (-2.6, 2.6): box(18, 1.6, 0.4, 46, 10.6, dz, rack, 0.05)
    box(2, 6, 2, 37, 12, 3.5, C['yellow'], 0.1); box(0.6, 0.4, 0.05, 37, 13.5, 4.55, mat('screen_amber', 0x1a1206, 0.0, 0.25, 0xf2a33a, 1.4), 0.0)
finalize(); export(f'{OUT}/magazine.glb')
reset(); C = palette()
proj = mat('projectile_grey', 0x6c7378, 0.7, 0.4); band = mat('driving_band', 0xb87333, 1.0, 0.3); heb = mat('he_yellow', 0xe8c21a, 0.2, 0.45)
with part('shell', (0, 0, 0)): shell(0, 0, 0)
finalize(); export(f'{OUT}/shell.glb')
print('DONE')
