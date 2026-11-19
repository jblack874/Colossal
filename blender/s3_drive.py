# System 3 - Traction drivetrain, in the explorer's train frame 'T' (three coords): origin on the sprocket axis,
# axis = +z, built for belt side sg = +1 (the explorer mirrors z for sg = -1). Rotating parts are separate named
# nodes with their pivot on their own axis; the explorer copies the procedural model's rotations onto them.
# Derived: bull 160 T r 6.0, pinion 23 T r = 6 / 17.83, ring 84 T r 7.0, sun 20 T r 1.6, planets 32 T r 2.6,
# sprocket 29 T, pitch radius 12.02 m (2.60 m shoe pitch). Motor 1.5 MW envelope INVENTED.
import sys, os, math; sys.path.insert(0, os.path.dirname(__file__))
from blib import *
OUT = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else '/tmp/b'
rS, TEETH, NM, ST1 = 12.02, 29, 10, 17.8282
rp = 6 / ST1; rr = 6 + rp

def parent(child, par):
    c, p = bpy.data.objects[child], bpy.data.objects[par]
    mw = c.matrix_world.copy(); c.parent = p; c.matrix_world = mw

reset(); C = palette()
with part('ringgear', (0, 0, 0)):
    gear(7.0, 2.4, 84, 0, 0, 0, C['gear'], 'Z', internal=True, rim=0.9)
    tube(8.6, 7.9, 3.0, 0, 0, 0, C['body'], 'Z', 96)                        # gearcase drum
    for z in (-1.55, 1.55): tube(9.0, 7.9, 0.2, 0, 0, z, C['body'], 'Z', 96); bolts(48, 8.75, 0, 0, z + math.copysign(0.12, z), 'Z', 0.06, 0.12)
    for k in range(4): box(0.6, 3.2, 0.6, 8.9 * math.cos(k * math.pi / 2 + 0.4), 8.9 * math.sin(k * math.pi / 2 + 0.4), 0, C['body'], 0.05, rz=k * math.pi / 2 + 0.4)  # torque arms
    cyl(0.2, 0.5, 6.2, 6.2, 0, C['glass'], 'Z', 16)                                          # sight glass
with part('carrier', (0, 0, 0)):
    torus(5.0, 0.35, 0, 0, 1.6, C['body'], 'Z', 64, 10)
    for k in range(4): box(10, 0.7, 0.5, 0, 0, 1.6, C['body'], 0.06, rz=k * math.pi / 4 + math.pi / 8)
    cyl(1.4, 0.8, 0, 0, 1.6, C['body'], 'Z', 40, 0.05)
    for k in range(4):
        a = k * math.pi / 2; cyl(0.45, 3.0, 4.3 * math.cos(a), 4.3 * math.sin(a), 0.3, C['steel'], 'Z', 24); cyl(0.7, 0.2, 4.3 * math.cos(a), 4.3 * math.sin(a), 1.25, C['dark'], 'Z', 24)
    bolts(36, 1.15, 0, 0, 2.05, 'Z', 0.05, 0.12)
for k in range(4):
    a = k * math.pi / 2
    with part(f'planet{k}', (4.3 * math.cos(a), 4.3 * math.sin(a), 0)):
        gear(2.6, 2.2, 32, 4.3 * math.cos(a), 4.3 * math.sin(a), 0, C['gear'], 'Z', hub=0.75)
        for s in (-1.15, 1.15): tube(0.75, 0.48, 0.15, 4.3 * math.cos(a), 4.3 * math.sin(a), s, C['dark'], 'Z', 32)
with part('sun', (0, 0, 0)):
    gear(1.6, 2.2, 20, 0, 0, 0, C['gear'], 'Z'); cyl(0.6, 3.4, 0, 0, -1.6, C['steel'], 'Z', 32)
    for k in range(8): box(0.12, 0.25, 1.0, 0.6 * math.cos(k * math.pi / 4), 0.6 * math.sin(k * math.pi / 4), -2.0, C['steel'], 0.01, rz=k * math.pi / 4)  # spline
with part('bull', (0, 0, -2.6)):
    gear(6.0, 1.2, 160, 0, 0, -2.6, C['gear'], 'Z', bore=4.9)
    tube(4.9, 1.2, 0.5, 0, 0, -2.6, C['body'], 'Z', 96)                                     # web
    for k in range(8):
        a = k * math.pi / 4 + math.pi / 8; cyl(0.75, 0.55, 3.0 * math.cos(a), 3.0 * math.sin(a), -2.6, C['dark'], 'Z', 32)   # lightening holes (dark plugs)
    tube(1.4, 0.6, 1.2, 0, 0, -2.6, C['body'], 'Z', 48); bolts(16, 1.1, 0, 0, -1.95, 'Z', 0.06, 0.12)
for k in range(NM):
    a = k / NM * 2 * math.pi; x, y = rr * math.cos(a), rr * math.sin(a)
    with part(f'pinion{k}', (x, y, -2.6)):
        gear(rp, 1.3, 23, x, y, -2.6, C['gear'], 'Z', hub=0.18)
    with part(f'motor{k}', (x, y, -4.6)):
        cyl(0.65, 2.6, x, y, -4.6, C['blue'], 'Z', 40, 0.04)
        for f in range(12):                                                                 # axial cooling ribs
            b = f / 12 * 2 * math.pi; box(0.06, 0.12, 2.4, x + 0.68 * math.cos(b), y + 0.68 * math.sin(b), -4.6, C['blue'], 0.01, rz=b)
        cyl(0.72, 0.7, x, y, -6.2, mat('fan_cowl', 0x24364f, 0.4, 0.45), 'Z', 40, 0.03)
        for f in range(6): torus(0.4 + f * 0.05, 0.015, x, y, -6.56, C['dark'], 'Z', 32, 4)   # cowl grille
        cyl(0.5, 0.12, x, y, -3.15, C['red'], 'Z', 32); box(0.25, 0.4, 0.3, x + 0.45, y, -3.15, C['red'], 0.02)   # disc brake + caliper
        box(0.5, 0.4, 0.6, x + 0.75 * math.cos(a), y + 0.75 * math.sin(a), -4.2, C['blue'], 0.03, rz=a)            # terminal box
        for s in (-0.9, 0.9): box(0.12, 0.3, 0.12, x + 0.7 * math.cos(a + math.pi / 2), y + 0.7 * math.sin(a + math.pi / 2), -4.6 + s, C['steel'], 0.01)   # lifting eyes
        box(0.3, 0.2, 0.01, x + 0.66 * math.cos(a - 0.5), y + 0.66 * math.sin(a - 0.5), -4.6, C['steel'], 0.0, rz=a - 0.5)   # nameplate
        pipe([(x + 0.9 * math.cos(a), y + 0.9 * math.sin(a), -4.2), (x + 1.6 * math.cos(a), y + 1.6 * math.sin(a), -4.6), (x + 1.9 * math.cos(a), y + 1.9 * math.sin(a), -7.5)], 0.08, C['cable'])
with part('sprocket', (0, 0, 0)):
    for dz in (-6, 6):
        tube(rS - 0.4, rS - 1.8, 1.1, 0, 0, dz, C['gear'], 'Z', 128)                          # rim
        for i in range(TEETH):
            a = i / TEETH * 2 * math.pi; box(1.5, 1.05, 1.1, (rS + 0.05) * math.cos(a), (rS + 0.05) * math.sin(a), dz, C['gear'], 0.22, rz=a)   # tooth
        tube(rS - 1.8, 9.2, 0.35, 0, 0, dz, C['body'], 'Z', 96)                               # web
        for k in range(10):
            a = k / 10 * 2 * math.pi; box(rS - 9.6, 0.5, 0.6, (9.6 + (rS - 9.6) / 2 - 0.6) * math.cos(a), (9.6 + (rS - 9.6) / 2 - 0.6) * math.sin(a), dz, C['body'], 0.04, rz=a)
        bolts(29, rS - 1.1, 0, 0, dz + math.copysign(0.6, dz), 'Z', 0.08, 0.15)
    for k in range(36): cyl(0.12, 0.5, 7.6 * math.cos(k / 36 * 2 * math.pi), 7.6 * math.sin(k / 36 * 2 * math.pi), 2.1, C['dark'], 'Z', 6)
with part('hubdrum', (0, 0, 0)):
    tube(9.3, 8.9, 12.0, 0, 0, 0, C['body'], 'Z', 96)                                        # hub drum between the two wheels (hidden when cut into)
with part('lube', (0, -9.5, 0)):
    box(1.6, 1.2, 1.2, 0, -9.5, 0, mat('lube_skid', 0x6a5a2a, 0.3, 0.5), 0.05); cyl(0.3, 1.0, -0.4, -9.5, 0.9, C['blue'], 'Z', 24)
    for k in range(6): box(0.04, 0.9, 1.0, 0.3 + k * 0.08, -9.5, 0, C['dark'], 0.0)
    for s in (-1, 1): elbow_pipe([(0.6, -8.9, s * 0.4), (0.6, -7.6, s * 0.4), (0.0, -7.6, s * 1.8)], 0.07, C['oil'])
finalize()
for k in range(4): parent(f'planet{k}', 'carrier')
export(f'{OUT}/train.glb')
if os.environ.get('STILL'):
    still(f'{OUT}/train_still.png', (-22, 10, -26), (0, 0, -2), 38)

# ============================================================ pod train (axis z, s = +1)
reset(); C = palette()
with part('podbull', (0, 0, 0)):
    gear(4.0, 1.0, 110, 0, 0, 0, C['gear'], 'Z', bore=3.2); tube(3.2, 0.8, 0.4, 0, 0, 0, C['body'], 'Z', 64); bolts(12, 1.0, 0, 0, 0.3, 'Z', 0.05, 0.1)
for k in range(4):
    a = k * math.pi / 2 + 0.785; x, y = 4.3 * math.cos(a), 4.3 * math.sin(a)
    with part(f'podpin{k}', (x, y, 0)): gear(0.3, 1.1, 23, x, y, 0, C['gear'], 'Z', hub=0.15)
    with part(f'podmotor{k}', (x, y, 2.2)):
        cyl(0.6, 2.4, x, y, 2.2, C['blue'], 'Z', 40, 0.04); cyl(0.66, 0.6, x, y, 3.7, mat('fan_cowl', 0x24364f, 0.4, 0.45), 'Z', 40, 0.03)
        for f in range(10):
            b = f / 10 * 2 * math.pi; box(0.05, 0.1, 2.2, x + 0.62 * math.cos(b), y + 0.62 * math.sin(b), 2.2, C['blue'], 0.01, rz=b)
        cyl(0.45, 0.12, x, y, 0.85, C['red'], 'Z', 32)
finalize(); export(f'{OUT}/podtrain.glb')
print('DONE')
