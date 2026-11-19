# COLOSSAL - MAN 8L51/60DF genset, modelled in Blender (bpy) for render + GLB export.
# Sourced: 8 cyl inline, 510 mm bore / 600 mm stroke, block length 10.27 m, 8 MW alternator (Sleipnir GE).
# Everything else (envelopes, piping runs, gallery) is INVENTED for visual fidelity.
import bpy, math, sys, os
from mathutils import Vector

OUT = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else '/tmp/genset'
os.makedirs(OUT, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
S = bpy.context.scene
COL = bpy.data.collections.new('genset'); S.collection.children.link(COL)

# ---------------------------------------------------------------- materials
def mat(name, rgb, metal=0.0, rough=0.5, emit=None, ei=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*rgb, 1); b.inputs['Metallic'].default_value = metal; b.inputs['Roughness'].default_value = rough
    if emit: b.inputs['Emission Color'].default_value = (*emit, 1); b.inputs['Emission Strength'].default_value = ei
    return m
def srgb(h): return tuple(((h >> s & 255) / 255) ** 2.2 for s in (16, 8, 0))
M = dict(
    body=mat('engine_body', srgb(0x56636b), 0.35, 0.45), head=mat('cyl_head', srgb(0x6b7880), 0.5, 0.35),
    cover=mat('rocker_cover', srgb(0xb9c0c5), 0.7, 0.3), steel=mat('bright_steel', srgb(0xd4d8db), 1.0, 0.18),
    dark=mat('dark_steel', srgb(0x23272b), 0.8, 0.4), lag=mat('lagging', srgb(0xc9cccf), 0.9, 0.42),
    alt=mat('alternator', srgb(0x2c4a75), 0.3, 0.4), base=mat('base_frame', srgb(0x2b3136), 0.5, 0.55),
    grate=mat('grating', srgb(0x8d9399), 0.8, 0.5), rail=mat('handrail', srgb(0xe3b320), 0.2, 0.45),
    red=mat('signal_red', srgb(0xc23a2b), 0.1, 0.4), pipeY=mat('fuel_pipe', srgb(0xd9a72b), 0.2, 0.4),
    pipeG=mat('water_pipe', srgb(0x3f7d4e), 0.2, 0.45), pipeB=mat('air_pipe', srgb(0x8aa9c4), 0.3, 0.4),
    rubber=mat('rubber', srgb(0x121212), 0.0, 0.85), hot=mat('turbine_hot', srgb(0x6e5b4d), 0.9, 0.5),
    floor=mat('floor_plate', srgb(0x3a3f44), 0.7, 0.6),
)

# ---------------------------------------------------------------- helpers
def link(o):
    for c in o.users_collection: c.objects.unlink(o)
    COL.objects.link(o); return o
def fin(o, m, bev=0.0, seg=2, smooth=True):
    o.data.materials.append(M[m] if isinstance(m, str) else m)
    if bev:
        b = o.modifiers.new('bev', 'BEVEL'); b.width = bev; b.segments = seg; b.limit_method = 'ANGLE'; b.harden_normals = False
    if smooth:
        try: bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o; bpy.ops.object.shade_auto_smooth(angle=0.6)
        except Exception: pass
    return link(o)
def box(sx, sy, sz, x, y, z, m, bev=0.03, name='box'):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y, z)); o = bpy.context.object; o.scale = (sx, sy, sz); o.name = name
    bpy.ops.object.transform_apply(scale=True); return fin(o, m, bev)
def cyl(r, h, x, y, z, m, axis='Z', v=32, bev=0.0, name='cyl', r2=None):
    if r2 is None: bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=h, vertices=v, location=(x, y, z))
    else: bpy.ops.mesh.primitive_cone_add(radius1=r, radius2=r2, depth=h, vertices=v, location=(x, y, z))
    o = bpy.context.object; o.name = name
    if axis == 'X': o.rotation_euler = (0, math.pi / 2, 0)
    if axis == 'Y': o.rotation_euler = (math.pi / 2, 0, 0)
    bpy.ops.object.transform_apply(rotation=True); return fin(o, m, bev)
def torus(R, r, x, y, z, m, axis='Z', name='tor'):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, major_segments=48, minor_segments=12, location=(x, y, z))
    o = bpy.context.object; o.name = name
    if axis == 'X': o.rotation_euler = (0, math.pi / 2, 0)
    if axis == 'Y': o.rotation_euler = (math.pi / 2, 0, 0)
    bpy.ops.object.transform_apply(rotation=True); return fin(o, m)
def pipe(pts, r, m, name='pipe', res=10):
    cu = bpy.data.curves.new(name, 'CURVE'); cu.dimensions = '3D'; cu.bevel_depth = r; cu.bevel_resolution = 3; cu.use_fill_caps = True
    sp = cu.splines.new('BEZIER'); sp.bezier_points.add(len(pts) - 1)
    for p, c in zip(sp.bezier_points, pts): p.co = c; p.handle_left_type = p.handle_right_type = 'AUTO'
    o = bpy.data.objects.new(name, cu); COL.objects.link(o); o.data.materials.append(M[m]); return o
def bolt_ring(n, R, x, y, z, rb, hb, m='dark', axis='Z', name='bolts'):
    for i in range(n):
        a = i / n * 2 * math.pi
        if axis == 'Z': cyl(rb, hb, x + R * math.cos(a), y + R * math.sin(a), z, m, 'Z', 6, name=name)
        elif axis == 'X': cyl(rb, hb, x, y + R * math.cos(a), z + R * math.sin(a), m, 'X', 6, name=name)
        else: cyl(rb, hb, x + R * math.cos(a), y, z + R * math.sin(a), m, 'Y', 6, name=name)

# ---------------------------------------------------------------- dimensions (x = crank axis, z up)
NC, BORE, PITCH = 8, 0.51, 1.0          # pitch invented to fit the 10.27 m block
L, W = 10.27, 2.9
x0 = -L / 2
cx = [x0 + 1.0 + i * (L - 2.0) / (NC - 1) for i in range(NC)]
Zb = 0.0                                  # top of floor

# common base frame: two I-beams + cross members + resilient mounts
for y in (-1.55, 1.55):
    box(17.6, 0.06, 0.9, 2.6, y, 0.62, 'base', 0.01, 'base_web')
    for dz in (0.17, 1.07): box(17.6, 0.5, 0.06, 2.6, y, dz, 'base', 0.01, 'base_flange')
for xi in range(12):
    xx = -6.0 + xi * 1.55
    box(0.08, 3.1, 0.7, xx, 0, 0.62, 'base', 0.01, 'cross_member')
    for y in (-1.55, 1.55): cyl(0.2, 0.16, xx, y, 0.06, 'rubber', v=20, name='mount'); cyl(0.24, 0.04, xx, y, 0.15, 'dark', v=20, name='mount_plate')

# crankcase / frame with crankcase doors (each door: plate + 12 bolts + relief valve)
box(L, W, 2.4, 0, 0, 2.3, 'body', 0.08, 'crankcase')
box(L - 0.3, W - 0.6, 0.8, 0, 0, 0.95, 'body', 0.06, 'oil_sump')
for x in cx:
    for s in (-1, 1):
        yy = s * (W / 2 + 0.03)
        box(0.72, 0.06, 1.05, x, yy, 2.2, 'body', 0.025, 'crankcase_door')
        for k in range(10):
            a = k / 10 * 2 * math.pi
            cyl(0.022, 0.05, x + 0.31 * math.cos(a), yy + s * 0.04, 2.2 + 0.46 * math.sin(a), 'dark', 'Y', 6, name='door_bolt')
        cyl(0.13, 0.12, x, yy + s * 0.1, 2.2, 'steel', 'Y', 20, name='relief_valve')
        cyl(0.09, 0.05, x, yy + s * 0.18, 2.2, 'red', 'Y', 16, name='relief_cap')

# cylinder block (upper) with vertical ribs between cylinders
box(L, W - 0.4, 1.5, 0, 0, 4.25, 'body', 0.07, 'cyl_block')
for i in range(NC + 1):
    xx = x0 + 0.5 + i * (L - 1.0) / NC
    for s in (-1, 1): box(0.14, 0.12, 1.4, xx, s * (W / 2 - 0.15), 4.25, 'body', 0.03, 'block_rib')

# cylinder heads: forged head, 4 hydraulic studs + nuts, rocker cover with ribs, indicator valve, starting air valve
for i, x in enumerate(cx):
    box(0.95, 1.4, 0.75, x, 0, 5.4, 'head', 0.06, f'cyl_head_{i+1}')
    for dx in (-0.36, 0.36):
        for dy in (-0.55, 0.55):
            cyl(0.045, 0.32, x + dx, dy, 5.9, 'steel', v=12, name='head_stud')
            cyl(0.085, 0.12, x + dx, dy, 5.83, 'dark', v=6, name='head_nut')
    box(0.78, 1.0, 0.42, x, 0, 6.0, 'cover', 0.08, f'rocker_cover_{i+1}')
    for dy in (-0.3, 0, 0.3): box(0.7, 0.05, 0.05, x, dy, 6.23, 'cover', 0.015, 'cover_rib')
    cyl(0.05, 0.25, x + 0.3, -0.62, 5.95, 'steel', v=12, name='indicator_valve')
    cyl(0.07, 0.2, x - 0.3, 0.62, 5.55, 'red', 'Y', 14, name='start_air_valve')

# exhaust side (y-): lagged exhaust manifold with segmented bands + branch per cylinder
ye, ze = -1.15, 6.35
cyl(0.42, L + 0.6, 0.3, ye, ze, 'lag', 'X', 40, name='exhaust_manifold')
for k in range(int(L / 0.45)): torus(0.425, 0.025, x0 + 0.2 + k * 0.45, ye, ze, 'steel', 'X', name='lagging_band')
for x in cx: pipe([(x, -0.5, 5.6), (x, -0.85, 5.95), (x, ye, ze - 0.2)], 0.17, 'lag', 'exhaust_branch')

# air side (y+): charge-air receiver, fuel rail + HP lines, cooling water, lube oil
cyl(0.38, L, 0, 1.12, 4.55, 'body', 'X', 36, 0.0, 'charge_air_receiver')
for x in cx: pipe([(x, 1.12, 4.9), (x, 0.9, 5.2), (x, 0.55, 5.35)], 0.12, 'body', 'air_inlet_branch')
cyl(0.07, L, 0, 1.38, 3.55, 'pipeY', 'X', 12, name='fuel_rail_mgo')
cyl(0.09, L, 0, 1.42, 3.3, 'pipeY', 'X', 12, name='gas_rail_lng')
for x in cx:
    pipe([(x, 1.38, 3.55), (x + 0.15, 1.6, 4.2), (x + 0.15, 1.0, 5.6), (x + 0.1, 0.62, 5.6)], 0.022, 'steel', 'hp_fuel_line')
    cyl(0.12, 0.35, x - 0.25, 1.48, 3.55, 'dark', v=14, name='fuel_pump_hp')
cyl(0.11, L, 0, 1.25, 5.95, 'pipeG', 'X', 14, name='ht_cooling_water')
cyl(0.11, L, 0, -1.3, 3.6, 'pipeG', 'X', 14, name='lt_cooling_water')
cyl(0.09, L, 0, -1.35, 1.25, 'pipeB', 'X', 12, name='lube_oil_main')

# free end (x-): turbocharger (compressor volute, turbine casing, intake silencer), charge-air cooler, front-end box
tx = x0 - 1.6
box(1.6, 2.4, 2.8, x0 - 0.8, 0, 2.6, 'body', 0.07, 'front_end_box')
box(1.4, 2.0, 1.4, tx + 0.2, 0.2, 4.75, 'body', 0.06, 'charge_air_cooler')
for k in range(9): box(1.42, 0.04, 1.2, tx + 0.2, -0.6 + k * 0.2, 4.75, 'dark', 0.0, 'cooler_fin_frame')
cyl(0.95, 0.9, tx, -0.25, 6.3, 'steel', 'Y', 48, 0.02, 'tc_compressor_volute')
torus(0.95, 0.18, tx, -0.25, 6.3, 'steel', 'Y', 'tc_volute_lip')
cyl(0.75, 0.9, tx, -1.15, 6.3, 'hot', 'Y', 40, 0.02, 'tc_turbine_casing')
bolt_ring(24, 0.85, tx, -0.72, 6.3, 0.03, 0.12, 'dark', 'Y', 'tc_split_bolts')
cyl(1.05, 1.1, tx, 0.75, 6.3, 'grate', 'Y', 48, 0.0, 'tc_intake_silencer')
for k in range(7): torus(1.06, 0.03, tx, 0.3 + k * 0.15, 6.3, 'dark', 'Y', 'silencer_rib')
cyl(0.5, 0.02, tx, 1.31, 6.3, 'dark', 'Y', 32, name='silencer_face')
pipe([(tx, -1.6, 6.3), (tx, -1.9, 7.0), (tx + 0.4, -1.9, 7.9), (tx + 0.4, -1.9, 8.8)], 0.5, 'lag', 'exhaust_uptake')
pipe([(x0 - 0.1, ye, ze), (tx + 0.4, ye, ze), (tx, -1.6, 6.3)], 0.42, 'lag', 'manifold_to_turbine')

# coupling end (x+): flywheel housing, flexible coupling, alternator with ribs, terminal box, air cooler
ax = L / 2 + 0.6
cyl(1.45, 0.9, ax, 0, 3.4, 'body', 'X', 48, 0.03, 'flywheel_housing')
bolt_ring(28, 1.35, ax + 0.46, 0, 3.4, 0.035, 0.1, 'dark', 'X', 'flywheel_bolts')
cyl(1.0, 0.6, ax + 0.9, 0, 3.4, 'dark', 'X', 40, 0.02, 'flexible_coupling')
AL, AR, acx = 4.6, 1.7, ax + 1.2 + 2.3
cyl(AR, AL, acx, 0, 3.4, 'alt', 'X', 64, 0.04, 'alternator_8MW')
for k in range(15): torus(AR + 0.02, 0.05, acx - AL / 2 + 0.3 + k * 0.29, 0, 3.4, 'alt', 'X', 'alt_rib')
box(4.2, 2.6, 1.3, acx, 0, 5.55, 'alt', 0.08, 'alt_air_cooler')
for k in range(6): cyl(0.09, 1.2, acx - 1.6 + k * 0.64, 1.4, 5.55, 'pipeG', 'Y', 12, name='cooler_header')
box(1.3, 0.9, 1.1, acx + 0.6, 1.95, 3.9, 'alt', 0.05, 'alt_terminal_box')
for k in range(3): pipe([(acx + 0.4 + k * 0.2, 2.4, 3.9), (acx + 0.4 + k * 0.2, 2.9, 3.4), (acx + 0.4 + k * 0.2, 3.2, 1.2)], 0.07, 'rubber', 'mv_cable')
for x in (acx - AL / 2 - 0.2, acx + AL / 2 + 0.2): box(0.6, 3.0, 1.9, x, 0, 1.55, 'alt', 0.05, 'alt_bearing_pedestal')
cyl(0.45, 0.3, acx + AL / 2 + 0.5, 0, 3.4, 'dark', 'X', 32, 0.01, 'alt_exciter_cover')

# maintenance gallery (air side): grating deck, stanchions, double handrail, ladder
gy, gz = 2.45, 3.9
box(L + 2, 1.1, 0.06, 0, gy, gz, 'grate', 0.005, 'gallery_grating')
for k in range(int((L + 2) / 0.12)): box(0.025, 1.1, 0.04, -L / 2 - 1 + k * 0.12, gy, gz + 0.04, 'dark', 0.0, 'grating_bar')
for k in range(8):
    xx = -L / 2 - 0.9 + k * (L + 1.8) / 7
    cyl(0.03, 1.1, xx, gy + 0.52, gz + 0.55, 'rail', v=10, name='stanchion')
    box(0.08, 0.6, 0.08, xx, gy + 0.2, gz - 0.12, 'base', 0.01, 'gallery_bracket')
for zz in (0.55, 1.08): cyl(0.03, L + 1.9, 0, gy + 0.52, gz + zz, 'rail', 'X', 10, name='handrail')
for k in range(14): box(0.5, 0.04, 0.04, -L / 2 - 0.5, gy + 0.3, 0.3 + k * 0.27, 'rail', 0.005, 'ladder_rung')
for dx in (-0.25, 0.25): box(0.05, 0.06, 3.9, -L / 2 - 0.5 + dx, gy + 0.3, 1.95, 'rail', 0.005, 'ladder_rail')

# local control panel, fire extinguisher at the gallery head (46 CFR spacing)
box(0.8, 0.4, 1.4, L / 2 + 0.2, gy + 0.2, gz + 0.8, 'cover', 0.03, 'local_control_panel')
box(0.6, 0.02, 0.35, L / 2 + 0.2, gy - 0.01, gz + 1.0, mat('screen', srgb(0x102030), 0.0, 0.2, srgb(0x3ab0ff), 2.0), 0.0, 'lcp_screen')
cyl(0.09, 0.55, -L / 2 - 1.0, gy + 0.45, gz + 0.35, 'red', v=20, name='fire_extinguisher_9kg')

# floor plate under the genset
box(28, 9, 0.1, 2.0, 0.8, -0.05, 'floor', 0.0, 'engine_room_floor')

# ---------------------------------------------------------------- export GLB (game-ready, modifiers applied)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=f'{OUT}/genset.glb', export_format='GLB', export_apply=True, export_yup=True)

# ---------------------------------------------------------------- Cycles still: studio light like the explorer
W_ = bpy.data.worlds.new('w'); S.world = W_; W_.use_nodes = True
W_.node_tree.nodes['Background'].inputs['Color'].default_value = (0.93, 0.92, 0.89, 1); W_.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.6
def lamp(name, kind, loc, energy, size, rgb=(1, 1, 1)):
    l = bpy.data.lights.new(name, kind); l.energy = energy; l.color = rgb
    if kind == 'AREA': l.size = size
    o = bpy.data.objects.new(name, l); S.collection.objects.link(o); o.location = loc
    d = Vector((2, 0, 3)) - Vector(loc); o.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler(); return o
lamp('key', 'AREA', (-14, -16, 18), 9000, 10, (1.0, 0.95, 0.88))
lamp('fill', 'AREA', (16, 14, 9), 2500, 12, (0.85, 0.9, 1.0))
lamp('rim', 'AREA', (20, -8, 14), 3500, 6, (0.9, 0.95, 1.0))
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); S.collection.objects.link(cam); S.camera = cam
cam.data.lens = 40
def shoot(name, loc, tgt):
    cam.location = loc; cam.rotation_euler = (Vector(tgt) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    S.render.filepath = f'{OUT}/{name}.png'; bpy.ops.render.render(write_still=True)
S.render.engine = 'CYCLES'; S.cycles.samples = int(os.environ.get('SAMPLES', 48)); S.cycles.use_denoising = True
try: S.cycles.denoiser = 'OPENIMAGEDENOISE'
except Exception: pass
S.render.resolution_x, S.render.resolution_y = int(os.environ.get('RX', 1600)), int(os.environ.get('RY', 900))
S.view_settings.view_transform = 'AgX'
shoot('genset_air_side', (-12, 19, 11), (1.5, 0, 3.6))
shoot('genset_exhaust_side', (-15, -16, 10), (0, 0, 4.2))
print('DONE', OUT)
