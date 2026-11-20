# COLOSSAL exterior in Blender, in the explorer's frames (three coords):
#  shoe.glb    one hollow cast track shoe in the link frame: x along the belt (pitch 2.599 m), y out of the belt
#              (+y wheel side, -y ground side), z = unit width (the explorer scales z to 0.97 x belt width)
#  sprocket.glb corner wheel, axis y, pitch radius 12.02 m, 29 T, width 7.15 m (pods scale it to r 8.72, 21 T look)
#  roadwheel.glb road wheel, axis y, r 3.6 m, width 9.1 m
#  hull.glb    rig frame: hull deck (x 0-230, y 30-40, z +-50) + both track frames (outer/inner side plates, top deck, ties)
#  upper.glb   slewing-deck frame: side-profile extrusion (PROF, 64 m wide), structural bays, catwalks, bridge house,
#              roof modules, helideck, masts, glacis
#  boom.glb    boom frame (trunnion origin): armoured mantle 64 x 20 x 24 m and the 150 m barrel exterior
# All dimensions follow kin.js; surface detail INVENTED (Joe: "massive broad assumption for surface components").
import sys, os, math, random; sys.path.insert(0, os.path.dirname(__file__))
from blib import *
OUT = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else '/tmp/b'
ONLY = os.environ.get('ONLY', 'shoe,sprocket,roadwheel,hull,upper,boom').split(',')
PITCH = 2.598862642169729

def pal():
    C = palette()
    C.update(hull=mat('hull_warm', 0xb8b3a9, 0.15, 0.7), plate=mat('plate_light', 0xcfcac1, 0.1, 0.75), white=mat('module_white', 0xe9e7e1, 0.1, 0.45),
             frame=mat('frame_dark', 0x55585c, 0.5, 0.5), trim=mat('trim_dark', 0x2f3134, 0.5, 0.55), win=mat('window_band', 0x15181b, 0.4, 0.12, 0xd8d2c4, 0.35),
             accent=mat('accent_orange', 0xe8562a, 0.1, 0.55), track=mat('track_steel', 0x34363a, 0.85, 0.35), wear=mat('track_wear', 0x8c8e90, 0.95, 0.25),
             glacis=mat('glacis_bright', 0xe2ded6, 0.1, 0.55), deck=mat('deck_nonskid', 0x8f8c86, 0.05, 0.9))
    return C

# ------------------------------------------------------------------ face kit: structured bays on an axis-aligned face
def facekit(C, n, origin, W, H, seed, *, bay=10.0, belts=(), style='hull', win_rows=(), doors=0.12, louvre=0.18, white=0.0):
    """n: '+z' '-z' '+x' '-x'. origin = lower-left corner seen from outside. Places pilasters, belt strakes, panels."""
    rnd = random.Random(seed); ox, oy, oz = origin
    def P(u, v, du, dv, d, m, bev=0.05):        # u along the face (left->right from outside), v up, d proud distance
        if n == '+z': box(du, dv, d, ox + u + du / 2, oy + v + dv / 2, oz + d / 2, m, bev)
        elif n == '-z': box(du, dv, d, ox - u - du / 2, oy + v + dv / 2, oz - d / 2, m, bev)
        elif n == '+x': box(d, dv, du, ox + d / 2, oy + v + dv / 2, oz - u - du / 2, m, bev)
        else: box(d, dv, du, ox - d / 2, oy + v + dv / 2, oz + u + du / 2, m, bev)
    nb = max(1, round(W / bay)); bw = W / nb
    for i in range(nb + 1): P(i * bw - 0.35, 0, 0.7, H, 0.55, C['frame'], 0.12)                     # pilasters
    for v in belts: P(0, v - 0.3, W, 0.6, 0.45, C['frame'], 0.1)                                    # belt strakes
    rows = [0] + list(belts) + [H]
    for i in range(nb):
        for r in range(len(rows) - 1):
            v0, v1 = rows[r] + 0.45, rows[r + 1] - 0.45; u0 = i * bw + 0.55; du = bw - 1.1; dv = v1 - v0
            if dv < 1 or du < 1: continue
            k = rnd.random(); m = C['white'] if rnd.random() < white else C['plate']
            P(u0, v0, du, dv, 0.18, m, 0.08)                                                         # bay panel
            if r in win_rows:
                P(u0 + 0.3, v0 + dv * 0.55, du - 0.6, min(1.4, dv * 0.3), 0.26, C['win'], 0.04)
            elif k < doors and dv > 3:
                dw = 1.6; uu = u0 + rnd.uniform(0.4, du - dw - 0.4)
                P(uu - 0.15, v0, dw + 0.3, 2.6, 0.24, C['frame'], 0.04); P(uu, v0, dw, 2.4, 0.3, C['white'], 0.03)
                P(uu + dw - 0.35, v0 + 1.1, 0.12, 0.25, 0.36, C['trim'], 0.01)
            elif k < doors + louvre:
                lw, lh = min(du - 0.8, rnd.uniform(2.5, 5)), min(dv - 0.8, rnd.uniform(1.5, 3)); uu = u0 + (du - lw) / 2; vv = v0 + (dv - lh) / 2
                P(uu, vv, lw, lh, 0.22, C['trim'], 0.03)
                for j in range(int(lh / 0.22)): P(uu + 0.1, vv + 0.1 + j * 0.22, lw - 0.2, 0.06, 0.32, C['frame'], 0.0)
            elif k < 0.55:
                for j in range(rnd.randint(1, 3)):                                                    # sub-panels
                    sw = du * rnd.uniform(0.25, 0.45); sh = dv * rnd.uniform(0.25, 0.5)
                    P(u0 + rnd.uniform(0.3, du - sw - 0.3), v0 + rnd.uniform(0.3, dv - sh - 0.3), sw, sh, 0.27, C['plate'], 0.06)
            elif k < 0.7 and dv > 2:
                for j in range(rnd.randint(2, 4)): P(u0, v0 + 0.5 + j * 0.45, du, 0.22, 0.42, C['trim'], 0.02)   # pipe / cable run
            if rnd.random() < 0.25: P(u0 + du - 0.7, v0 + dv - 0.5, 0.4, 0.25, 0.3, C['accent'], 0.02)           # tag plate

def railing_run(C, a, b, h=1.1):
    railing(a, b, h, C['trim'], 1.8)

# ================================================================== shoe
if 'shoe' in ONLY:
    reset(); C = pal(); hp = PITCH / 2
    with part('shoe', (0, 0, 0)):
        box(PITCH * 0.9, 0.16, 1.0, 0, 0.38, 0, C['track'], 0.04)                     # wheel-side running plate
        for z in (-0.32, 0.32): box(PITCH * 0.86, 0.12, 0.26, 0, 0.5, z, C['wear'], 0.03)   # road-wheel rail pads (polished)
        box(0.5, 0.75, 0.09, 0.0, 0.8, 0, C['track'], 0.04)                          # centre guide horn
        box(PITCH * 0.9, 0.16, 1.0, 0, -0.46, 0, C['track'], 0.04)                    # ground-side plate
        for z in (-0.48, -0.16, 0.16, 0.48): box(PITCH * 0.86, 0.72, 0.035, 0, -0.04, z, C['track'], 0.01)   # webs (hollow box)
        for x in (-0.55, 0.55):
            for z in (-0.32, 0.32): box(0.5, 0.42, 0.25, x, -0.04, z, C['trim'], 0.05)   # lightening-hole shadows
        for x in (-0.62, 0.62): box(0.32, 0.36, 1.0, x, -0.72, 0, C['track'], 0.08)  # grousers
        for x in (-hp + 0.18, hp - 0.18):                                              # hinge knuckles
            for z in ((-0.42, -0.08, 0.26) if x < 0 else (-0.25, 0.09, 0.42)): cyl(0.24, 0.15, x, -0.04, z, C['track'], 'Z', 20, 0.03)
        cyl(0.1, 1.02, hp - 0.18, -0.04, 0, C['wear'], 'Z', 12)                        # pin
    finalize(); export(f'{OUT}/shoe.glb')
    if os.environ.get('STILL'):
        still(f'{OUT}/shoe_still.png', (-3, 2.2, 3.5), (0, 0, 0), 50, 900, 600, 24)

# ================================================================== corner sprocket / idler (axis y)
if 'sprocket' in ONLY:
    reset(); C = pal(); R = 12.02; Wd = 7.15
    with part('sprocket', (0, 0, 0)):
        for y in (-Wd / 2 + 0.6, Wd / 2 - 0.6):
            tube(R - 1.0, R - 2.1, 1.1, 0, y, 0, C['track'], 'Y', 128)
            for i in range(29):
                a = i / 29 * 2 * math.pi; box(1.25, 1.0, 0.85, (R - 0.75) * math.cos(a), y, (R - 0.75) * math.sin(a), C['wear'], 0.2, ry=-a)
            tube(R - 2.1, 3.0, 0.4, 0, y, 0, C['frame'], 'Y', 96)
            for k in range(6):
                a = k / 6 * 2 * math.pi + 0.5; cyl(1.7, 0.45, 6.4 * math.cos(a), y, 6.4 * math.sin(a), C['trim'], 'Y', 32)
            bolts(24, R - 1.6, 0, y + math.copysign(0.6, y), 0, 'Y', 0.09, 0.15)
        tube(3.2, 1.2, Wd, 0, 0, 0, C['frame'], 'Y', 64)                                # hub
        cyl(2.0, Wd + 0.6, 0, 0, 0, C['plate'], 'Y', 48, 0.1)
        bolts(16, 1.6, 0, Wd / 2 + 0.32, 0, 'Y', 0.12, 0.2); bolts(16, 1.6, 0, -Wd / 2 - 0.32, 0, 'Y', 0.12, 0.2)
    finalize(); export(f'{OUT}/sprocket.glb')

# ================================================================== road wheel (axis y)
if 'roadwheel' in ONLY:
    reset(); C = pal(); RW = 3.6; Wd = 9.1
    with part('roadwheel', (0, 0, 0)):
        for y, w in ((-Wd / 2 + 0.6, 1.2), (0, 0.8), (Wd / 2 - 0.6, 1.2)):
            tube(RW, RW - 0.5, w, 0, y, 0, C['wear'], 'Y', 80); tube(RW - 0.5, 1.4, 0.25, 0, y, 0, C['frame'], 'Y', 80)
            for k in range(8):
                a = k / 8 * 2 * math.pi + 0.2; cyl(0.42, 0.3, 2.45 * math.cos(a), y, 2.45 * math.sin(a), C['trim'], 'Y', 24)
        tube(RW + 0.3, RW - 0.1, 0.22, 0, 0, 0, C['wear'], 'Y', 80)
        tube(1.6, 0.8, Wd, 0, 0, 0, C['frame'], 'Y', 48); cyl(0.9, Wd + 0.4, 0, 0, 0, C['plate'], 'Y', 32, 0.06)
    finalize(); export(f'{OUT}/roadwheel.glb')

# ================================================================== hull deck + track frames (rig frame)
if 'hull' in ONLY:
    reset(); C = pal()
    L, Bm, H0, H1 = 230.0, 100.0, 30.0, 40.0
    with part('hulldeck', (115, 35, 0)):
        box(L, H1 - H0, Bm, L / 2, (H0 + H1) / 2, 0, C['hull'], 0.6)
        box(L - 2, 0.15, Bm - 2, L / 2, H1 + 0.075, 0, C['deck'], 0.0)                 # non-skid deck
        for x in range(10, 230, 20): box(0.12, 0.05, Bm - 4, x, H1 + 0.17, 0, C['trim'], 0.0)   # deck seams
        for s in (1, -1):
            box(L, 1.2, 0.4, L / 2, H1 + 0.6, s * (Bm / 2 - 0.2), C['plate'], 0.1)    # bulwark
            box(L + 0.4, 0.5, 0.6, L / 2, 33.0, s * (Bm / 2 + 0.25), C['trim'], 0.2)  # rubbing strake
            box(L, 2.2, 0.5, L / 2, 38.4, s * (Bm / 2 + 0.3), C['white'], 0.15)       # white band
            for x in range(8, 228, 14):
                cyl(0.5, 1.0, x, H1 + 0.5, s * (Bm / 2 - 2.2), C['trim'], 'Y', 20, 0.08); cyl(0.65, 0.12, x, H1 + 1.0, s * (Bm / 2 - 2.2), C['trim'], 'Y', 20)   # bollards
            for x in range(20, 220, 40): box(1.8, 1.0, 0.7, x, 35.5, s * (Bm / 2 + 0.3), C['trim'], 0.25)                                                       # hawse / fairleads
            for i, x in enumerate(range(6, 226, 8)):
                for k in range(3): box(0.12 if k else 0.6, 0.12, 0.05, x + k * 0.25 - 0.25, 31.0 + k * 0.6, s * (Bm / 2 + 0.03), C['white'], 0.0)   # draft marks
            for x in range(12, 224, 6): cyl(0.28, 0.12, x, 36.2, s * (Bm / 2 + 0.06), C['win'], 'Z', 16)                                                  # side scuttles
            facekit(C, '+z' if s > 0 else '-z', (0, H0, s * Bm / 2) if s > 0 else (L, H0, -Bm / 2), L, 8, 21 if s > 0 else 22, bay=11.5, belts=(), doors=0.05, louvre=0.12)
        for x0, n in ((0, '-x'), (L, '+x')):
            facekit(C, n, (x0, H0, -Bm / 2) if n == '-x' else (x0, H0, Bm / 2), Bm, 8, 23 if n == '-x' else 24, bay=10, doors=0.1)
        for x, z in ((30, 30), (60, -30), (190, 32), (210, -28), (100, 40), (140, -40)):                                           # deck hatches + vents
            box(6, 0.6, 4, x, H1 + 0.4, z, C['plate'], 0.15); bolts(12, 2.0, x, H1 + 0.72, z, 'Y', 0.08, 0.08)
            cyl(0.6, 2.2, x + 5, H1 + 1.1, z, C['plate'], 'Y', 20, 0.05); cyl(0.9, 0.4, x + 5, H1 + 2.3, z, C['plate'], 'Y', 20, 0.1)
        for s in (1, -1):
            railing_run(C, (1, H1 + 1.2, s * (Bm / 2 - 0.5)), (L - 1, H1 + 1.2, s * (Bm / 2 - 0.5)), 1.1)
    with part('trackframes', (85, 15, 36)):
        for zs in (36, -36):
            sg = 1 if zs > 0 else -1
            for zo, nn in ((zs + sg * 14.6, '+z' if sg > 0 else '-z'), (zs - sg * 14.6, '-z' if sg > 0 else '+z')):
                x0, x1 = 17.02, 153.66
                box(x1 - x0, 18, 0.8, (x0 + x1) / 2, 15, zo, C['plate'], 0.3)
                outside = (zo - zs) * sg > 0
                if outside:
                    facekit(C, nn, (x0, 6, zo + sg * 0.4) if sg > 0 else (x1, 6, zo - 0.4), x1 - x0, 18, 11 + (sg < 0), bay=13.66, belts=(9,), doors=0.04, louvre=0.2)
                    for x in (x0, x1):
                        cyl(7.4, 1.6, x, 15.0, zo + sg * 0.8, C['plate'], 'Z', 64, 0.3); cyl(2.6, 2.4, x, 15.0, zo + sg * 1.6, C['white'], 'Z', 40, 0.3)
                        bolts(24, 6.6, x, 15.0, zo + sg * 1.62, 'Z', 0.15, 0.2)
                    for i in range(4):
                        x = x0 + (i + 1) * (x1 - x0) / 5; cyl(2.4, 1.4, x, 21.5, zo + sg * 0.9, C['plate'], 'Z', 32, 0.2); cyl(0.8, 1.8, x, 21.5, zo + sg * 1.4, C['white'], 'Z', 16, 0.1)
            box(153.66 - 17.02, 1.0, 30.0, 85.3, 24.5, zs, C['plate'], 0.3)              # frame top deck
            for x in range(25, 150, 16):                                                  # carbody ties to the hull
                box(3.0, 5.6, 3.0, x, 27.6, zs + 10, C['frame'], 0.3); box(3.0, 5.6, 3.0, x, 27.6, zs - 10, C['frame'], 0.3)
                box(4.4, 0.6, 4.4, x, 25.2, zs + 10, C['frame'], 0.1); box(4.4, 0.6, 4.4, x, 25.2, zs - 10, C['frame'], 0.1)
            railing_run(C, (18, 25.0, zs + sg * 14.6), (152, 25.0, zs + sg * 14.6), 1.1)
            for x in (30, 90, 140): ladder(x, 6, 25, zs + sg * 15.6, 0.6, 'X')
    finalize(); export(f'{OUT}/hull.glb')

# ================================================================== slewing upperworks (slew frame)
if 'upper' in ONLY:
    reset(); C = pal(); hw = 32.0
    PROF = [(-150, 8), (-150, 50), (30, 50), (58, 36), (92, 36), (92, 12), (70, 8)]
    with part('upper', (-30, 30, 0)):
        bm = bmesh.new()
        f = [bm.verts.new(B(x, y, -hw)) for x, y in PROF]; b_ = [bm.verts.new(B(x, y, hw)) for x, y in PROF]
        n = len(PROF); bm.faces.new(f[::-1]); bm.faces.new(b_)
        for i in range(n): j = (i + 1) % n; bm.faces.new((f[i], f[j], b_[j], b_[i]))
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
        me = bpy.data.meshes.new('prof'); bm.to_mesh(me); o = bpy.data.objects.new('prof', me); bpy.context.scene.collection.objects.link(o)
        bv = o.modifiers.new('bev', 'BEVEL'); bv.width = 0.8; bv.segments = 3; bv.limit_method = 'ANGLE'
        from blib import _reg; _reg(o, C['hull'])
        facekit(C, '+z', (-150, 8, hw), 180, 42, 31, bay=12, belts=(14, 28), win_rows=(2,), doors=0.1, louvre=0.2, white=0.10)
        facekit(C, '-z', (30, 8, -hw), 180, 42, 32, bay=12, belts=(14, 28), win_rows=(2,), doors=0.1, louvre=0.2, white=0.10)
        facekit(C, '-x', (-150, 8, -hw), 64, 42, 33, bay=8, belts=(14, 28), doors=0.15, louvre=0.25)
        facekit(C, '+z', (58, 12, hw), 34, 24, 34, bay=8.5, belts=(12,), doors=0.05)
        facekit(C, '-z', (92, 12, -hw), 34, 24, 35, bay=8.5, belts=(12,), doors=0.05)
        facekit(C, '+x', (92, 12, hw), 64, 24, 36, bay=8, belts=(12,), doors=0.0, louvre=0.1)
        # glacis: sloped bright plating with frames
        ang = math.atan2(36 - 50, 58 - 30); Lg = math.hypot(28, 14)
        for i in range(8):
            z = -hw + 4 + i * 8
            box(Lg - 1.2, 0.3, 7.2, 44, 43.2, z, C['glacis'], 0.1, rz=ang); box(Lg, 0.5, 0.6, 44, 43.3, z - 4, C['frame'], 0.1, rz=ang)
        # catwalks y 22 / 36 both sides + stairs
        for y in (22, 36):
            for s in (1, -1):
                grating(178, 1.6, -61, y, s * (hw + 0.85), 'X', step=1.5)
                for x in range(-148, 30, 12): box(0.15, 0.15, 1.6, x, y - 0.25, s * (hw + 0.85), C['frame'], 0.0); box(0.2, 0.6, 0.15, x, y - 0.5, s * (hw + 0.1), C['frame'], 0.0)
                railing_run(C, (-148, y, s * (hw + 1.6)), (28, y, s * (hw + 1.6)), 1.1)
        for s in (1, -1):
            for x0 in (-130, -40):
                for k in range(22): box(0.6, 0.08, 1.2, x0 + k * 0.6, 22 + k * 0.62, s * (hw + 1.2), C['frame'], 0.0)
        box(178, 0.12, 62, -61, 50.06, 0, C['deck'], 0.0)                                       # roof deck (topside fit in s10_topside.py)
        for s in (1, -1): railing_run(C, (-149, 50.1, s * (hw - 0.4)), (29, 50.1, s * (hw - 0.4)), 1.1)
        railing_run(C, (-149.4, 50.1, hw - 0.4), (-149.4, 50.1, -hw + 0.4), 1.1)
        # rear face exhaust grilles + nose details
        for z in (-20, 0, 20): box(0.4, 10, 12, -150.2, 30, z, C['trim'], 0.1)
        for z in range(-28, 30, 7): box(0.6, 18, 0.6, 92.3, 24, z, C['frame'], 0.1)
    finalize(); export(f'{OUT}/upper.glb')

# ================================================================== boom: mantle + barrel (boom frame)
if 'boom' in ONLY:
    reset(); C = pal()
    with part('mantle', (32, 0, 0)):
        box(64, 20, 24, 32, 0, 0, C['hull'], 1.2)
        for x in range(4, 64, 7): box(1.2, 21.4, 25.4, x, 0, 0, C['frame'], 0.3)            # ring frames
        for s in (1, -1):
            for x in range(8, 60, 7): box(5.2, 7.6, 0.3, x + 0.4, 4.2, s * 12.2, C['plate'], 0.15); box(5.2, 7.6, 0.3, x + 0.4, -4.4, s * 12.2, C['plate'], 0.15)
            for k in range(3): box(60, 0.4, 0.4, 32, -8 + k * 0.7, s * 12.6, C['trim'], 0.1)    # hydraulic lines along the mantle
            railing_run(C, (2, 10, s * 11.5), (62, 10, s * 11.5), 1.1)
        box(62, 0.15, 22, 32, 10.08, 0, C['deck'], 0.0)
        for x in (10, 30, 50): box(4, 1.4, 4, x, 10.7, 0, C['white'], 0.2)
    with part('barrel', (150, 0, 0)):                                               # barrel doubled to 180 m (Joe 11/19)
        cyl(6.0, 180, 150, 0, 0, C['trim'], 'X', 64)
        for x in range(66, 236, 9): cyl(6.35, 1.6, x, 0, 0, C['frame'], 'X', 64, 0.3)         # thermal sleeve clamps
        cyl(7.0, 14, 172, 0, 0, C['trim'], 'X', 64, 0.6)                                       # bore evacuator
        cyl(6.9, 5, 237.5, 0, 0, C['trim'], 'X', 64, 0.6)                                      # muzzle collar
        for k in range(4):
            box(3.0, 1.6, 14.2, 237.5, -3 + k * 2, 0, C['frame'], 0.2)                          # muzzle brake baffles
        cyl(2.7, 1.0, 240.3, 0, 0, mat('bore_dark', 0x0c0c0c, 0.2, 0.6), 'X', 48)
    finalize(); export(f'{OUT}/boom.glb')
print('DONE')
