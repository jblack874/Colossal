# System 2 - Electrical. Assets in the explorer's local frames (three coords):
#  swb.glb        14-cubicle 11 kV switchboard line-up; origin = base centre of cubicle 1, line-up runs +x (pitch 1.02 m), front +z
#  transformer.glb 11 kV / 690 V oil transformer; origin = floor centre
#  slipring.glb   12-ring HV slip ring + hydraulic swivel; origin = slip-ring frame (rings at y 0.6..7.2, R 2.0 m)
#  brushgear.glb  rotating brush gear (rides the slewing deck), same origin
#  drives.glb     MV7000-type drive line-up, 10 cabinets at x = -6 + 1.3 c, front +z
# Counts from sysdata (12 rings = 4 circuits x 3 phases, 48 brushes, 14 cubicles, 10 cabinets); all geometry INVENTED.
import sys, os, math; sys.path.insert(0, os.path.dirname(__file__))
from blib import *
OUT = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else '/tmp/b'
ST = os.environ.get('STILL')

# ============================================================ switchboard line-up
reset(); C = palette()
with part('swb', (6.63, 1.2, 0)):
    n, p = 14, 1.02
    box(n * p + 0.1, 0.1, 1.9, (n - 1) * p / 2, 0.05, 0, C['base'], 0.01)                     # base channel
    for i in range(n):
        x = i * p
        box(1.0, 2.3, 1.8, x, 1.25, 0, C['cabinet'], 0.02)
        box(0.94, 0.62, 0.03, x, 2.05, 0.915, C['cabinet'], 0.01)                               # LV / relay door
        cyl(0.09, 0.03, x - 0.25, 2.12, 0.935, C['white'], 'Z', 24); cyl(0.075, 0.01, x - 0.25, 2.12, 0.952, C['glass'], 'Z', 24)   # ammeter
        box(0.2, 0.15, 0.02, x + 0.12, 2.12, 0.94, C['screen'], 0.0)                            # protection relay HMI
        for k, col in enumerate(('status_green', 'signal_red', 'safety_yellow')): cyl(0.022, 0.03, x - 0.3 + k * 0.08, 1.88, 0.94, MATS[col] if col in MATS else C['red'], 'Z', 12)
        box(0.94, 1.05, 0.03, x, 1.18, 0.915, C['cabinet'], 0.01)                               # breaker compartment door
        box(0.3, 0.2, 0.012, x, 1.35, 0.935, C['glass'], 0.0)                                   # inspection window
        box(0.04, 0.22, 0.05, x + 0.38, 1.1, 0.95, C['dark'], 0.005)                            # handle
        box(0.6, 0.03, 0.02, x, 1.62, 0.935, C['green'], 0.0)                                   # mimic bus line
        box(0.03, 0.2, 0.02, x, 1.52, 0.935, C['green'], 0.0)
        box(0.94, 0.5, 0.03, x, 0.35, 0.915, C['cabinet'], 0.01)                                # cable compartment door
        for k in range(5): box(0.6, 0.02, 0.01, x, 0.25 + k * 0.05, 0.935, C['dark'], 0.0)      # louvres
        box(0.12, 0.04, 0.02, x, 0.6, 0.93, C['white'], 0.0)                                    # feeder label
    box(n * p, 0.45, 1.0, (n - 1) * p / 2, 2.65, -0.3, C['cabinet'], 0.02)                    # busbar chamber
    for i in range(n): box(0.7, 0.03, 0.5, i * p, 2.89, -0.3, C['dark'], 0.0)                  # pressure-relief flaps
    for x in (-0.53, (n - 1) * p + 0.53): box(0.04, 2.4, 1.85, x, 1.25, 0, C['cabinet'], 0.01)  # end panels
    box(n * p + 1, 0.02, 1.0, (n - 1) * p / 2, 0.01, 1.5, C['rubber'], 0.0)                   # insulating mat
    box(n * p, 0.05, 0.05, (n - 1) * p / 2, 0.15, -0.95, C['copper'], 0.0)                     # earth bar
    for k in range(6): pipe([(-0.3 + k * 2.4, 2.9, -0.5), (-0.3 + k * 2.4, 3.8, -0.5)], 0.09, C['mvcable'], poly=True)
    extinguisher(-1.3, 0, 1.4)
finalize(); export(f'{OUT}/swb.glb')
if ST: still(f'{OUT}/swb_still.png', (2, 3.2, 8), (6.6, 1.3, 0), 35)

# ============================================================ transformer 11 kV / 690 V
reset(); C = palette(); tg = mat('tx_green', 0x4c6b55, 0.3, 0.55); por = mat('porcelain', 0x7a3b2a, 0.0, 0.25)
with part('tx', (0, 1.6, 0)):
    for z in (-0.8, 0.8): box(3.6, 0.12, 0.15, 0, 0.06, z, C['dark'], 0.01)                    # rails
    for x in (-1.2, 1.2):
        for z in (-0.8, 0.8): cyl(0.14, 0.1, x, 0.24, z, C['dark'], 'Z', 16)                   # wheels
    box(2.4, 2.6, 1.6, 0, 1.7, 0, tg, 0.04)                                                    # tank
    box(2.5, 0.12, 1.7, 0, 3.05, 0, tg, 0.02); box(2.5, 0.12, 1.7, 0, 0.42, 0, tg, 0.02)
    for s in (-1, 1):
        for k in range(16): box(0.04, 2.3, 0.28, -1.12 + k * 0.149, 1.7, s * 0.94, tg, 0.005)  # corrugated fins
        for k in range(8): box(0.06, 2.2, 0.7, s * (1.3 + k * 0.08), 1.7, 0, tg, 0.005)        # radiator panels
        for y in (0.7, 2.7): cyl(0.06, 0.8, s * 1.55, y, 0, tg, 'X', 12)                       # radiator headers
    cyl(0.32, 1.9, 0, 3.75, -0.4, tg, 'X', 24, 0.03)                                          # conservator
    elbow_pipe([(0, 3.45, -0.4), (0, 3.25, -0.4), (0, 3.12, -0.2)], 0.04, tg); box(0.2, 0.15, 0.15, 0, 3.3, -0.4, C['dark'], 0.01)   # Buchholz
    cyl(0.1, 0.05, 0.96, 3.75, -0.4, C['glass'], 'X', 16)                                      # oil level gauge
    for k in range(3):                                                                         # HV bushings (porcelain sheds)
        x = -0.7 + k * 0.7; cyl(0.06, 0.9, x, 3.55, 0.35, C['steel'], 'Y', 10)
        for j in range(7): cyl(0.13 - 0.005 * j, 0.04, x, 3.2 + j * 0.1, 0.35, por, 'Y', 16)
        cyl(0.05, 0.08, x, 3.95, 0.35, C['copper'], 'Y', 10)
    for k in range(4):                                                                         # LV bushings
        x = -0.75 + k * 0.5
        cyl(0.07, 0.5, x, 1.9, 0.95, C['white'], 'Z', 12); box(0.12, 0.3, 0.05, x, 1.9, 1.22, C['copper'], 0.005)
    box(2.2, 0.9, 0.5, 0, 1.9, 1.35, tg, 0.03)                                                 # LV cable box
    box(0.5, 0.7, 0.25, -0.9, 1.1, -0.95, C['cabinet'], 0.02)                                  # marshalling box
    box(0.3, 0.2, 0.01, 0.6, 1.4, -0.81, C['steel'], 0.0)                                      # rating plate
    for x in (-1.1, 1.1):
        for z in (-0.75, 0.75): box(0.12, 0.2, 0.04, x, 3.2, z, tg, 0.01)                      # lifting lugs
    for k in range(3): pipe([(-0.7 + k * 0.7, 4.0, 0.35), (-0.7 + k * 0.7, 4.6, 0.6), (-0.7 + k * 0.7, 5.6, 0.6)], 0.05, C['mvcable'])
finalize(); export(f'{OUT}/transformer.glb')
if ST: still(f'{OUT}/tx_still.png', (5, 4, 6), (0, 1.9, 0), 40)

# ============================================================ HV slip ring + hydraulic swivel (hull side, stationary)
reset(); C = palette(); ins = mat('insulator', 0x3a3328, 0.1, 0.5); glass_ep = mat('epoxy_barrier', 0x6b5a2e, 0.1, 0.4)
with part('slipring', (0, 4, 0)):
    cyl(1.6, 8.2, 0, 4, 0, ins, 'Y', 48)                                                       # insulating core
    for i in range(12):
        y = 0.6 + i * 0.6
        tube(2.0, 1.6, 0.28, 0, y, 0, C['copper'], 'Y', 64)                                    # ring
        if i < 11: tube(2.35, 1.6, 0.06, 0, y + 0.3, 0, glass_ep, 'Y', 64)                     # inter-ring barrier
        a = i * 0.52; cyl(0.06, 0.5, 1.75 * math.cos(a), y, 1.75 * math.sin(a), C['copper'], 'Y', 8)   # ring riser stud
    for y in (-0.15, 8.15): tube(2.6, 0.5, 0.3, 0, y, 0, C['body'], 'Y', 64); bolts(24, 2.4, 0, y + 0.16, 0, 'Y', 0.04, 0.1)
    for k in range(6):                                                                         # tie rods
        a = k / 6 * 2 * math.pi + 0.26; cyl(0.06, 8.3, 2.5 * math.cos(a), 4.0, 2.5 * math.sin(a), C['steel'], 'Y', 10)
    for i in range(12):                                                                        # outgoing MV cables, bundled down the core
        a = i / 12 * 2 * math.pi; pipe([(0.6 * math.cos(a), 0.6 + i * 0.6, 0.6 * math.sin(a)), (0.8 * math.cos(a), -0.5, 0.8 * math.sin(a)), (1.2 * math.cos(a), -6.0, 1.2 * math.sin(a))], 0.07, C['mvcable'])
with part('swivel', (0, -2.5, 0)):
    cyl(1.0, 4, 0, -2.5, 0, mat('swivel_red', 0x7d1f1f, 0.6, 0.4), 'Y', 40, 0.04)
    for k in range(5):
        y = -4.0 + k * 0.7; tube(1.15, 1.0, 0.12, 0, y, 0, C['steel'], 'Y', 40)
        for s in (-1, 1): cyl(0.14, 0.5, s * 1.2, y, 0, C['steel'], 'X', 16); pipe([(s * 1.45, y, 0), (s * 2.3, y - 0.3, 0.3), (s * 2.6, y - 2.0, 0.6)], 0.08, C['rubber'])
    tube(1.5, 0.3, 0.25, 0, -4.6, 0, C['body'], 'Y', 40)
finalize(); export(f'{OUT}/slipring.glb')

# ============================================================ brush gear (slewing deck side, rotates)
reset(); C = palette()
with part('brushes', (0, 4, 0)):
    for k in range(4):
        a = k / 4 * 2 * math.pi; ca, sa = math.cos(a), math.sin(a)
        box(0.25, 8.0, 0.4, 2.85 * ca, 4.0, 2.85 * sa, mat('frp_arm', 0x8a6d2a, 0.1, 0.5), 0.03, ry=-a)   # insulated arm
        for i in range(12):
            y = 0.6 + i * 0.6
            box(0.5, 0.18, 0.3, 2.3 * ca, y, 2.3 * sa, C['dark'], 0.02, ry=-a)                # brush holder
            box(0.12, 0.12, 0.2, 2.05 * ca, y, 2.05 * sa, mat('carbon', 0x101010, 0.0, 0.9), 0.01, ry=-a)   # carbon
            pipe([(2.45 * ca, y + 0.05, 2.45 * sa), (2.75 * ca, y + 0.2, 2.75 * sa)], 0.02, C['copper'])    # pigtail
    for y in (-0.1, 8.1): torus(2.85, 0.12, 0, y, 0, C['body'], 'Y', 64, 8)
    for k in range(4):
        a = k / 4 * 2 * math.pi; pipe([(2.85 * math.cos(a), 8.1, 2.85 * math.sin(a)), (3.5 * math.cos(a), 9.5, 3.5 * math.sin(a)), (3.5 * math.cos(a), 14, 3.5 * math.sin(a))], 0.12, C['mvcable'])
finalize(); export(f'{OUT}/brushgear.glb')

if ST:
    reset(); C = palette()
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for f in ('slipring', 'brushgear'): bpy.ops.import_scene.gltf(filepath=f'{OUT}/{f}.glb')
    still(f'{OUT}/slip_still.png', (9, 7, 11), (0, 3.0, 0), 38)

# ============================================================ MV drive line-up (10 cabinets)
reset(); C = palette(); dg = mat('drive_grey', 0xd6d8d4, 0.15, 0.45)
with part('drives', (0, 1.15, 0)):
    box(13.4, 0.1, 1.2, -0.15, 0.05, 0, C['base'], 0.01)
    for c in range(10):
        x = -6 + c * 1.3
        box(1.2, 2.3, 1.0, x, 1.25, 0, dg, 0.02)
        box(0.56, 2.1, 0.03, x - 0.29, 1.25, 0.515, dg, 0.01); box(0.56, 2.1, 0.03, x + 0.29, 1.25, 0.515, dg, 0.01)   # double doors
        for s in (-1, 1): box(0.03, 0.25, 0.05, x + s * 0.05, 1.3, 0.54, C['dark'], 0.005)
        for s in (-0.29, 0.29):
            box(0.36, 0.36, 0.03, x + s, 0.45, 0.535, C['dark'], 0.01)                          # filter fan grilles
            for k in range(6): box(0.32, 0.015, 0.02, x + s, 0.32 + k * 0.05, 0.55, C['grate'], 0.0)
        box(0.9, 0.25, 0.8, x, 2.55, 0, C['grate'], 0.02)                                       # roof exhaust hood
        cyl(0.18, 0.08, x, 2.7, 0, C['dark'], 'Y', 20)
        box(0.2, 0.06, 0.01, x - 0.29, 2.15, 0.535, C['white'], 0.0)                            # tag
        if c in (0, 9): box(0.4, 0.3, 0.02, x - 0.29, 1.65, 0.535, C['screen'], 0.0)            # HMI
        if c == 4:
            box(0.12, 0.12, 0.02, x + 0.29, 1.7, 0.54, C['red'], 0.0)                           # e-stop
        for k in range(3): pipe([(x - 0.3 + k * 0.3, 2.75, -0.3), (x - 0.3 + k * 0.3, 3.4, -0.3)], 0.05, C['cable'], poly=True)
    box(2.0, 2.3, 1.0, 7.6, 1.25, 0, C['water'], 0.03)                                          # water-cooling unit
    for k in range(2): elbow_pipe([(7.0 + k * 1.2, 2.4, -0.2), (7.0 + k * 1.2, 3.0, -0.2), (5.5, 3.0, -0.2)], 0.06, C['water'])
    box(14.5, 0.06, 0.6, 0.5, 3.4, -0.3, C['grate'], 0.0)                                       # overhead tray
    for s in (-0.3, 0.3): box(14.5, 0.12, 0.03, 0.5, 3.46, -0.3 + s, C['grate'], 0.0)
    box(14, 0.02, 0.9, -0.15, 0.01, 1.2, C['rubber'], 0.0)
finalize(); export(f'{OUT}/drives.glb')
if ST: still(f'{OUT}/drives_still.png', (-9, 3, 8), (0, 1.3, 0), 35)
print('DONE')
