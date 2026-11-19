# System 7 - Hull, buoyancy, marine & fire safety. Frames (three coords):
#  thruster.glb   retractable azimuth thruster, frame th (top of column y 0, pod centre y -27, nozzle at x 3.2);
#                 'prop' pivots on the shaft (x axis) so the explorer can spin it
#  pump.glb       ballast pump set, frame g0 (motor axis z at y 0)        firepump.glb  fire pump set, frame g0 (y 1)
#  lifeboat.glb   enclosed lifeboat on davits, frame b (hull centre at 0, davits on the -z side; mirrored for s = -1)
#  hydrant.glb    fire hydrant + hose box, frame = hydrant base
# Thruster count/rating from sysdata (WST-65RU type, 5.5 MW). Geometry INVENTED.
import sys, os, math; sys.path.insert(0, os.path.dirname(__file__))
from blib import *
OUT = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else '/tmp/b'

reset(); C = palette(); thr = mat('thruster_grey', 0xb7c0c7, 0.8, 0.3); af = mat('antifoul', 0x8b2a20, 0.2, 0.6); bronze = mat('ni_al_bronze', 0xb59a3c, 1.0, 0.22)
with part('column', (0, -13, 0)):
    cyl(1.4, 26, 0, -13, 0, thr, 'Y', 48, 0.03)
    for y in range(-24, 0, 4): torus(1.42, 0.06, 0, y, 0, C['dark'], 'Y', 48, 6)
    for s in (-1, 1): cyl(0.25, 24, s * 1.8, -12, 0, C['steel'], 'Y', 16); box(0.4, 24, 0.3, s * 1.6, -12, 0, thr, 0.03)   # lifting rack guides
    box(5.0, 2.0, 5.0, 0, 1.0, 0, thr, 0.1)                                     # steering gear housing (top)
    for k in range(4): cyl(0.45, 1.2, 1.8 * math.cos(k * math.pi / 2 + 0.785), 2.6, 1.8 * math.sin(k * math.pi / 2 + 0.785), C['blue'], 'Y', 24, 0.03)  # steering motors
    cyl(2.2, 0.4, 0, 0.1, 0, C['dark'], 'Y', 48)
    for k in range(3): pipe([(1.2, 2.0, -0.6 + k * 0.6), (2.6, 3.4, -0.6 + k * 0.6), (3.0, 6.0, -0.6 + k * 0.6)], 0.09, C['mvcable'])
with part('pod', (0.5, -27, 0)):
    cyl(1.7, 6.0, 0.2, -27, 0, af, 'X', 48, 0.05); sphere(1.7, -2.8, -27, 0, af, 32)
    cyl(1.0, 1.2, 3.6, -27, 0, af, 'X', 40, 0.0, r2=0.6)                      # shaft hub fairing
    box(2.0, 3.8, 0.6, 0, -24.6, 0, af, 0.15)                                  # strut fin
    box(1.6, 0.6, 0.4, -1.5, -28.9, 0, af, 0.1)                                # skeg
with part('nozzle', (3.2, -27, 0)):
    tube(3.9, 3.3, 3.0, 3.2, -27, 0, af, 'X', 64)
    torus(3.6, 0.32, 1.7, -27, 0, af, 'X', 64, 10)
    for k in range(3):
        a = k / 3 * 2 * math.pi + math.pi / 2; box(0.2, 1.8, 0.5, 3.2, -27 + 2.3 * math.sin(a), 2.3 * math.cos(a), af, 0.05, rx=a)  # nozzle struts
with part('prop', (3.2, -27, 0)):
    cyl(0.6, 1.0, 3.2, -27, 0, bronze, 'X', 32, 0.05)
    for b in range(4):
        a = b * math.pi / 2
        box(0.18, 2.6, 1.0, 3.2, -27 + 1.8 * math.cos(a), 1.8 * math.sin(a), bronze, 0.08, rx=a, ry=0.35)
finalize(); export(f'{OUT}/thruster.glb')
if os.environ.get('STILL'): still(f'{OUT}/thruster_still.png', (-14, -16, 16), (0.5, -18, 0), 35)

reset(); C = palette(); thr = mat('thruster_grey', 0xb7c0c7, 0.8, 0.3)
with part('pumpset', (0, 0, 0)):
    box(2.0, 0.3, 3.2, 0, -1.95, 0.2, C['base'], 0.02)
    cyl(0.6, 1.6, 0, 0, 0, C['blue'], 'Z', 40, 0.04)
    for f in range(12): box(0.1, 0.06, 1.4, 0.62 * math.cos(f * 0.524), 0.62 * math.sin(f * 0.524), 0, C['blue'], 0.005, rz=f * 0.524)
    cyl(0.65, 0.4, 0, 0, -1.0, mat('fan_cowl', 0x24364f, 0.4, 0.45), 'Z', 40, 0.02)
    cyl(0.4, 0.6, 0, 0, 1.1, C['steel'], 'Z', 32)                               # coupling guard
    cyl(0.8, 1.2, 0, -1.0, 1.9, thr, 'Y', 48, 0.05)                              # volute casing (vertical)
    for s in (-1, 1): cyl(0.35, 0.8, s * 1.2, -1.0, 1.9, thr, 'X', 32); cyl(0.5, 0.12, s * 1.6, -1.0, 1.9, thr, 'X', 32); bolts(8, 0.42, s * 1.66, -1.0, 1.9, 'X', 0.03, 0.06)
    for s in (-1, 1): box(0.5, 0.7, 0.5, s * 2.0, -1.0, 1.9, C['red'], 0.04); cyl(0.3, 0.06, s * 2.0, -0.4, 1.9, C['yellow'], 'Y', 24)   # isolation valves + handwheels
finalize(); export(f'{OUT}/pump.glb')

reset(); C = palette()
with part('firepump', (0, 1, 0)):
    box(3.2, 0.3, 1.8, 0.5, 0.15, 0, C['base'], 0.02)
    cyl(0.6, 1.8, 0, 1, 0, C['blue'], 'X', 40, 0.04); cyl(0.65, 0.4, -1.1, 1, 0, mat('fan_cowl', 0x24364f, 0.4, 0.45), 'X', 40, 0.02)
    cyl(0.7, 1.2, 1.4, 1, 0, C['red'], 'Y', 48, 0.05); elbow_pipe([(1.4, 1.6, 0), (1.4, 3.5, 0), (2.5, 3.5, 0)], 0.25, C['red'], 0.4)
    cyl(0.12, 0.3, 1.4, 2.4, 0.3, C['white'], 'Z', 16)
finalize(); export(f'{OUT}/firepump.glb')

reset(); C = palette(); orange = mat('lifeboat_orange', 0xf26b1d, 0.2, 0.5); win = mat('lifeboat_window', 0x18222c, 0.3, 0.1)
with part('boat', (0, 0, 0)):
    cyl(1.6, 7, 0, 0, 0, orange, 'X', 48, 0.0); sphere(1.6, -3.5, 0, 0, orange, 32); sphere(1.6, 3.5, 0, 0, orange, 32)
    box(9.6, 1.2, 3.1, 0, -0.9, 0, C['white'], 0.4)                             # white hull bottom band
    for x in range(-3, 4): box(0.5, 0.35, 0.05, x, 0.6, 1.58, win, 0.03); box(0.5, 0.35, 0.05, x, 0.6, -1.58, win, 0.03)
    for x in (-2.5, 2.5): cyl(0.5, 0.2, x, 1.62, 0, orange, 'Y', 24, 0.04)       # hatches
    box(1.2, 0.8, 1.0, 3.6, 1.3, 0, orange, 0.2); box(0.6, 0.25, 0.05, 3.6, 1.35, 0.51, win, 0.02)   # helm position
    for x in (-3, 3): box(0.08, 0.6, 0.08, x, 1.9, 0, C['dark'], 0.01)          # hook points
    box(0.15, 0.15, 3.5, 0, 0.4, 0, C['steel'], 0.01)
with part('davit', (0, 2, -1.5)):
    for x in (-3, 3):
        box(0.4, 4, 0.4, x, 2, -1.5, C['base'], 0.04); box(0.4, 0.4, 2.2, x, 4.0, -0.6, C['base'], 0.04)
        pipe([(x, 4.0, 0.4), (x, 1.9, 0.0)], 0.02, C['steel'], poly=True)
    box(1.0, 0.8, 0.8, 0, 3.2, -1.7, C['blue'], 0.05); cyl(0.3, 0.6, 0.0, 3.2, -1.2, C['dark'], 'X', 24)   # winch
finalize(); export(f'{OUT}/lifeboat.glb')

reset(); C = palette()
with part('hydrant', (0, 0.5, 0)):
    cyl(0.12, 1.0, 0, 0.5, 0, C['red'], 'Y', 20, 0.02); box(0.45, 0.12, 0.12, 0, 0.85, 0, C['red'], 0.02)
    for s in (-1, 1): cyl(0.08, 0.15, s * 0.28, 0.85, 0, C['brass'], 'X', 16); cyl(0.12, 0.05, 0, 1.05, 0, C['yellow'], 'Y', 16)
    box(0.8, 1.0, 0.3, 0.8, 1.0, 0, C['red'], 0.03); box(0.6, 0.3, 0.01, 0.8, 1.2, 0.16, C['white'], 0.0)   # hose box
finalize(); export(f'{OUT}/hydrant.glb')
print('DONE')
