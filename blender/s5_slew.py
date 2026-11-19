# System 5 - Slewing. Frames (three coords):
#  slewfixed.glb  hull-fixed bearing parts, frame LG (rig at upX, ringY): outer ring, lower retaining ring,
#                 internal ring gear (960 T, module 50 mm, r 21.8), 2 x 360 bolts, pedestal skirt, grease line
#  slewinner.glb  inner ring, frame LS (slewing deck)
#  slewdrive.glb  one slew drive, frame dv (pinion pivot at y 1.4): pinion (18 T) + planetary gearbox + motor + brake
# Ring dia 48 m and the 24-drive count from sysdata; geometry INVENTED around the Liebherr/Rothe Erde three-row layout.
import sys, os, math; sys.path.insert(0, os.path.dirname(__file__))
from blib import *
OUT = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else '/tmp/b'
R0 = 24.0

reset(); C = palette(); ring = mat('bearing_ring', 0x6f767d, 0.85, 0.3); seal = mat('seal', 0x1a1a1a, 0.0, 0.7)
with part('outer', (0, 3.0, 0)):
    tube(R0 + 1.6, R0 + 0.25, 1.4, 0, 3.0, 0, ring, 'Y', 256)             # outer ring body (axial + radial raceways)
    tube(R0 + 1.9, R0 + 1.6, 0.35, 0, 3.55, 0, ring, 'Y', 256)            # mounting flange
    tube(R0 + 0.3, R0 + 0.2, 0.08, 0, 3.72, 0, seal, 'Y', 256)            # lip seal
    for k in range(12):                                                    # lifting / inspection plugs
        a = k / 12 * 2 * math.pi; cyl(0.15, 0.1, (R0 + 1.0) * math.cos(a), 3.72, (R0 + 1.0) * math.sin(a), C['red'], 'Y', 12)
with part('lowerRing', (0, 1.2, 0)):
    tube(R0 + 1.4, R0 - 0.2, 0.9, 0, 1.2, 0, ring, 'Y', 256)
with part('ringgear', (0, 1.4, 0)):
    gear(R0 - 2.2, 0.9, 960, 0, 1.4, 0, C['gear'], 'Y', internal=True, rim=0.6)
with part('bolts', (0, 3.4, 0)):
    for i in range(360):
        a = i / 360 * 2 * math.pi
        for r in (R0 + 1.75, R0 - 1.6):
            cyl(0.06, 1.0, r * math.cos(a), 3.6, r * math.sin(a), C['dark'], 'Y', 6); cyl(0.1, 0.12, r * math.cos(a), 4.0, r * math.sin(a), C['dark'], 'Y', 6)
with part('pedestal', (0, -1.5, 0)):
    tube(R0 + 3.5, R0 + 3.2, 3.0, 0, -1.5, 0, mat('pedestal', 0x3f444a, 0.4, 0.5), 'Y', 192)
    tube(R0 + 3.6, R0 + 1.2, 0.3, 0, 0.1, 0, mat('pedestal', 0x3f444a), 'Y', 192)
    for k in range(48):
        a = k / 48 * 2 * math.pi; box(2.2, 2.8, 0.12, (R0 + 2.3) * math.cos(a), -1.5, (R0 + 2.3) * math.sin(a), mat('pedestal', 0x3f444a), 0.02, ry=-a)   # gussets
    for k in range(4):
        a = k * math.pi / 2 + 0.3; box(1.6, 1.2, 0.1, (R0 + 3.56) * math.cos(a), -1.2, (R0 + 3.56) * math.sin(a), C['yellow'], 0.02, ry=-a + math.pi / 2)  # access hatches
with part('grease', (0, 4.6, 0)):
    pts = [((R0 + 2.4) * math.cos(i / 64 * 2 * math.pi), 4.6, (R0 + 2.4) * math.sin(i / 64 * 2 * math.pi)) for i in range(65)]
    pipe(pts, 0.06, mat('grease_line', 0xd0a020, 0.3, 0.5), poly=True)
    for k in range(16):
        a = k / 16 * 2 * math.pi; x, z = (R0 + 2.4) * math.cos(a), (R0 + 2.4) * math.sin(a)
        box(0.5, 0.4, 0.3, x, 4.6, z, C['steel'], 0.03, ry=-a); pipe([(x, 4.4, z), ((R0 + 1.7) * math.cos(a), 3.8, (R0 + 1.7) * math.sin(a))], 0.025, C['steel'])
    box(1.4, 1.6, 1.0, (R0 + 3.2), 4.4, 0, C['red'], 0.05); cyl(0.4, 1.0, R0 + 3.2, 5.7, 0, C['yellow'], 'Y', 24)   # central lube pump
finalize(); export(f'{OUT}/slewfixed.glb')

reset(); C = palette(); ring = mat('bearing_ring', 0x6f767d, 0.85, 0.3)
with part('inner', (0, 3.0, 0)):
    tube(R0 - 0.25, R0 - 1.6, 1.4, 0, 3.0, 0, ring, 'Y', 256)
    tube(R0 - 1.6, R0 - 1.9, 0.35, 0, 3.55, 0, ring, 'Y', 256)
    tube(R0 + 0.15, R0 - 0.25, 0.5, 0, 3.9, 0, ring, 'Y', 256)             # nose that runs over the upper axial row
finalize(); export(f'{OUT}/slewinner.glb')

reset(); C = palette(); gbx = mat('slew_gearbox', 0x55606a, 0.6, 0.4)
with part('pinion', (0, 1.4, 0)):
    gear(0.45 + 0.45, 0.9, 18, 0, 1.4, 0, C['gear'], 'Y', hub=0.35)
    cyl(0.3, 1.6, 0, 2.2, 0, C['steel'], 'Y', 24)
with part('drivebody', (0, 4.3, 0)):
    cyl(0.55, 2.6, 0, 4.3, 0, gbx, 'Y', 40, 0.04)                          # planetary gearbox
    for y in (3.2, 5.4): cyl(0.7, 0.18, 0, y, 0, gbx, 'Y', 40, 0.03); bolts(16, 0.63, 0, y + 0.1, 0, 'Y', 0.03, 0.06)
    box(1.8, 0.3, 1.8, 0, 3.0, 0, gbx, 0.05)                               # mounting flange to deck
    for dx in (-0.75, 0.75):
        for dz in (-0.75, 0.75): cyl(0.06, 0.4, dx, 3.2, dz, C['dark'], 'Y', 8)
    cyl(0.45, 1.8, 0, 6.5, 0, C['blue'], 'Y', 40, 0.03)                    # hydraulic / electric motor
    for f in range(10): box(0.05, 1.6, 0.1, 0.47 * math.cos(f * 0.628), 6.5, 0.47 * math.sin(f * 0.628), C['blue'], 0.005, ry=-f * 0.628)
    cyl(0.3, 0.5, 0, 7.7, 0, C['red'], 'Y', 32, 0.03)                     # holding brake
    box(0.4, 0.35, 0.3, 0.55, 6.8, 0, C['blue'], 0.03); pipe([(0.75, 6.8, 0), (1.2, 7.0, 0), (1.4, 8.5, 0.2)], 0.05, C['cable'])
    cyl(0.12, 0.3, 0.5, 4.8, 0, C['glass'], 'X', 12)                       # oil sight glass
finalize(); export(f'{OUT}/slewdrive.glb')
if os.environ.get('STILL'):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for f in ('slewfixed', 'slewinner'): bpy.ops.import_scene.gltf(filepath=f'{OUT}/{f}.glb')
    for k in range(6):
        a = k / 24 * 2 * math.pi; bpy.ops.import_scene.gltf(filepath=f'{OUT}/slewdrive.glb')
        for o in bpy.context.selected_objects:
            if o.parent is None: o.location = B(21 * math.cos(a), 0, 21 * math.sin(a))
    still(f'{OUT}/slew_still.png', (30, 9, 14), (20, 2.5, 4), 32)
print('DONE')
