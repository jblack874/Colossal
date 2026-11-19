# COLOSSAL Blender kit. Author in THREE.js coordinates (x, y up, z); the kit converts to Blender (x, -z, y)
# so that the glTF export (+Y up) lands back exactly in three's frame. Every object created inside part('id')
# is joined into one mesh named 'id' with its origin at the given pivot, so the explorer can find, label,
# explode and animate it by name.
import bpy, bmesh, math, os, sys
from mathutils import Vector, Matrix

def B(x, y, z): return Vector((x, -z, y))
AX = {'X': (0, math.pi / 2, 0), 'Y': (0, 0, 0), 'Z': (math.pi / 2, 0, 0)}   # three axis -> Blender rotation of a Z-primitive

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    global COL, CUR, PARTS
    COL = bpy.data.collections.new('asset'); bpy.context.scene.collection.children.link(COL)
    CUR = None; PARTS = {}; MATS.clear()

def srgb(h): return tuple(((h >> s & 255) / 255) ** 2.2 for s in (16, 8, 0))
MATS = {}
def mat(name, hexc, metal=0.0, rough=0.5, emit=None, ei=0.0, alpha=1.0):
    if name in MATS: return MATS[name]
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*srgb(hexc), 1); b.inputs['Metallic'].default_value = metal; b.inputs['Roughness'].default_value = rough
    if emit is not None: b.inputs['Emission Color'].default_value = (*srgb(emit), 1); b.inputs['Emission Strength'].default_value = ei
    if alpha < 1: b.inputs['Alpha'].default_value = alpha; m.surface_render_method = 'BLENDED'
    MATS[name] = m; return m

# palette shared by every system (engineering paint conventions)
def palette():
    return dict(
        body=mat('engine_grey', 0x56636b, 0.35, 0.45), head=mat('head_grey', 0x6b7880, 0.5, 0.35, 0xff5a1f, 0.0),
        cover=mat('cover_alu', 0xb9c0c5, 0.7, 0.3), steel=mat('bright_steel', 0xd4d8db, 1.0, 0.18), dark=mat('dark_steel', 0x23272b, 0.8, 0.4),
        lag=mat('lagging', 0xc9cccf, 0.9, 0.42), blue=mat('machine_blue', 0x2c4a75, 0.3, 0.4), base=mat('base_frame', 0x2b3136, 0.5, 0.55),
        grate=mat('grating', 0x8d9399, 0.8, 0.5), yellow=mat('safety_yellow', 0xe3b320, 0.2, 0.45), red=mat('signal_red', 0xc23a2b, 0.1, 0.4),
        fuel=mat('fuel_pipe', 0xd9a72b, 0.2, 0.4), water=mat('water_pipe', 0x3f7d4e, 0.2, 0.45), air=mat('air_pipe', 0x8aa9c4, 0.3, 0.4),
        rubber=mat('rubber', 0x121212, 0.0, 0.85), hot=mat('turbine_hot', 0x6e5b4d, 0.9, 0.5), floor=mat('floor_plate', 0x3a3f44, 0.7, 0.6),
        white=mat('panel_white', 0xe6e4de, 0.1, 0.5), cabinet=mat('cabinet_ral7035', 0xc8cbc4, 0.15, 0.45), copper=mat('copper', 0xc07a45, 1.0, 0.28),
        brass=mat('brass', 0xb8963c, 1.0, 0.3), oil=mat('hydraulic_green', 0x3d5c3a, 0.3, 0.45), gear=mat('gear_steel', 0xa7abb0, 0.95, 0.22),
        glass=mat('gauge_glass', 0xf0f4f6, 0.0, 0.05), screen=mat('screen', 0x102030, 0.0, 0.2, 0x3ab0ff, 2.0), green=mat('status_green', 0x2fae5c, 0.0, 0.4, 0x2fae5c, 1.5),
        orange=mat('ral2004', 0xe85a1f, 0.1, 0.45), hullp=mat('hull_paint', 0x7d868c, 0.4, 0.5), navy=mat('navy', 0x23324a, 0.3, 0.45),
        cable=mat('cable_jacket', 0x151515, 0.0, 0.7), mvcable=mat('mv_cable_red', 0x8b1e1a, 0.0, 0.6),
    )

class part:
    """with part('id', pivot=(x,y,z)): ...  everything created inside is joined into object 'id'."""
    def __init__(self, pid, pivot=(0, 0, 0)): self.pid, self.pivot = pid, pivot
    def __enter__(self):
        global CUR; self.prev = CUR; CUR = self.pid; PARTS.setdefault(self.pid, {'pivot': self.pivot, 'objs': []}); return self
    def __exit__(self, *a):
        global CUR; CUR = self.prev

def _reg(o, m):
    if m is not None: o.data.materials.append(m)
    for c in list(o.users_collection): c.objects.unlink(o)
    COL.objects.link(o)
    PARTS.setdefault(CUR or '_static', {'pivot': (0, 0, 0), 'objs': []})['objs'].append(o)
    return o
def _bevel(o, w, seg=2):
    if w > 0:
        b = o.modifiers.new('bev', 'BEVEL'); b.width = w; b.segments = seg; b.limit_method = 'ANGLE'; b.angle_limit = math.radians(40)
    return o
def _rot(o, axis, extra=None):
    o.rotation_euler = AX[axis]
    if extra: o.rotation_euler.rotate(extra)
    return o

def box(sx, sy, sz, x, y, z, m, bev=0.02, ry=0.0, rx=0.0, rz=0.0):
    """sx along three x, sy along three y (up), sz along three z."""
    bpy.ops.mesh.primitive_cube_add(size=1, location=B(x, y, z)); o = bpy.context.object
    o.scale = (sx, sz, sy)
    from mathutils import Euler
    o.rotation_euler = Euler((rx, -rz, ry), 'XYZ') if (rx or ry or rz) else o.rotation_euler
    bpy.ops.object.transform_apply(scale=True)
    return _reg(_bevel(o, min(bev, 0.45 * min(sx, sy, sz))), m)
def cyl(r, h, x, y, z, m, axis='Y', v=32, bev=0.0, r2=None):
    if r2 is None: bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=h, vertices=v, location=B(x, y, z))
    else: bpy.ops.mesh.primitive_cone_add(radius1=r, radius2=r2, depth=h, vertices=v, location=B(x, y, z))
    o = bpy.context.object; _rot(o, axis); return _reg(_bevel(o, min(bev, 0.3 * r, 0.3 * h)), m)
def tube(r_out, r_in, h, x, y, z, m, axis='Y', v=48):
    """hollow cylinder (ring, liner, flange)"""
    bm = bmesh.new()
    bmesh.ops.create_circle(bm, cap_ends=False, radius=r_out, segments=v)
    inner = bmesh.ops.create_circle(bm, cap_ends=False, radius=r_in, segments=v)
    edges = [e for e in bm.edges]; bmesh.ops.bridge_loops(bm, edges=edges)
    ext = bmesh.ops.extrude_face_region(bm, geom=bm.faces[:]); bmesh.ops.translate(bm, vec=(0, 0, h), verts=[e for e in ext['geom'] if isinstance(e, bmesh.types.BMVert)])
    bmesh.ops.translate(bm, vec=(0, 0, -h / 2), verts=bm.verts[:]); bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    me = bpy.data.meshes.new('tube'); bm.to_mesh(me); o = bpy.data.objects.new('tube', me); bpy.context.scene.collection.objects.link(o)
    o.location = B(x, y, z); _rot(o, axis); return _reg(o, m)
def sphere(r, x, y, z, m, seg=24):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, segments=seg, ring_count=seg // 2, location=B(x, y, z)); return _reg(bpy.context.object, m)
def torus(R, r, x, y, z, m, axis='Y', seg=48, mseg=10):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, major_segments=seg, minor_segments=mseg, location=B(x, y, z))
    o = bpy.context.object; _rot(o, axis); return _reg(o, m)
def pipe(pts, r, m, res=8, poly=False):
    cu = bpy.data.curves.new('pipe', 'CURVE'); cu.dimensions = '3D'; cu.bevel_depth = r; cu.bevel_resolution = 2; cu.use_fill_caps = True; cu.resolution_u = res
    if poly:
        sp = cu.splines.new('POLY'); sp.points.add(len(pts) - 1)
        for p, c in zip(sp.points, pts): p.co = (*B(*c), 1)
    else:
        sp = cu.splines.new('BEZIER'); sp.bezier_points.add(len(pts) - 1)
        for p, c in zip(sp.bezier_points, pts): p.co = B(*c); p.handle_left_type = p.handle_right_type = 'AUTO'
    o = bpy.data.objects.new('pipe', cu); bpy.context.scene.collection.objects.link(o); return _reg(o, m)
def elbow_pipe(pts, r, m, bend=None):
    """straight runs with tight radiused bends (industrial piping), pts = polyline in three coords"""
    bend = bend or 2.5 * r
    out = [pts[0]]
    for i in range(1, len(pts) - 1):
        a, b, c = Vector(pts[i - 1]), Vector(pts[i]), Vector(pts[i + 1])
        d1, d2 = (b - a), (c - b); k = min(bend, d1.length * 0.45, d2.length * 0.45)
        p1, p2 = b - d1.normalized() * k, b + d2.normalized() * k
        for t in range(0, 6): s = t / 5; q = (1 - s) ** 2 * p1 + 2 * (1 - s) * s * b + s * s * p2; out.append(tuple(q))
    out.append(pts[-1]); return pipe(out, r, m, poly=True)
def ring_of(n, R, fn, start=0.0):
    for i in range(n):
        a = start + i / n * 2 * math.pi; fn(i, a, R * math.cos(a), R * math.sin(a))
def gear(r, w, teeth, x, y, z, m, axis='Z', internal=False, rim=None, hub=None, bore=None):
    """spur gear with trapezoid teeth (addendum 1 m, dedendum 1.25 m), about three axis"""
    mod = 2 * r / teeth; ad, de = mod, 1.25 * mod
    bm = bmesh.new(); pts = []
    for i in range(teeth):
        a0 = i / teeth * 2 * math.pi; da = 2 * math.pi / teeth
        rr_root, rr_tip = (r + de, r - ad) if internal else (r - de, r + ad)
        for f, rr in ((0.0, rr_root), (0.18, rr_root), (0.32, rr_tip), (0.68, rr_tip), (0.82, rr_root)):
            a = a0 + f * da; pts.append((rr * math.cos(a), rr * math.sin(a)))
    vb = [bm.verts.new((px, py, -w / 2)) for px, py in pts]; vt = [bm.verts.new((px, py, w / 2)) for px, py in pts]
    n = len(pts)
    ro = rim if internal else (bore if bore else r * 0.25)
    rim_r = (r + de + (rim or 2.5 * mod)) if internal else ro
    cb = [bm.verts.new((rim_r * math.cos(i / n * 2 * math.pi + 0.0), rim_r * math.sin(i / n * 2 * math.pi), -w / 2)) for i in range(n)]
    ct = [bm.verts.new((v.co.x, v.co.y, w / 2)) for v in cb]
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((vb[i], vb[j], vt[j], vt[i])); bm.faces.new((cb[i], cb[j], ct[j], ct[i]))
        bm.faces.new((vb[i], cb[i], cb[j], vb[j])); bm.faces.new((vt[i], vt[j], ct[j], ct[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    me = bpy.data.meshes.new('gear'); bm.to_mesh(me); o = bpy.data.objects.new('gear', me); bpy.context.scene.collection.objects.link(o)
    o.location = B(x, y, z); _rot(o, axis); _reg(o, m)
    if hub and not internal: cyl(hub, w * 1.3, x, y, z, m, axis, 32, 0.02)
    return o
def railing(p0, p1, h=1.1, m=None, post=1.5):
    m = m or MATS['safety_yellow']; a, b = Vector(p0), Vector(p1); L = (b - a).length; n = max(1, int(L / post))
    for i in range(n + 1):
        q = a + (b - a) * (i / n); cyl(0.025, h, q.x, q.y + h / 2, q.z, m, 'Y', 8)
    for hh in (h * 0.5, h): pipe([tuple(a + Vector((0, hh, 0))), tuple(b + Vector((0, hh, 0)))], 0.025, m, poly=True)
def grating(sx, sz, x, y, z, along='X', m=None, step=0.1):
    m = m or MATS['grating']; box(sx, 0.04, sz, x, y, z, m, 0.0)
    n = int((sx if along == 'X' else sz) / step)
    for i in range(n):
        if along == 'X': box(0.02, 0.05, sz, x - sx / 2 + (i + 0.5) * sx / n, y + 0.03, z, MATS['dark_steel'], 0.0)
        else: box(sx, 0.05, 0.02, x, y + 0.03, z - sz / 2 + (i + 0.5) * sz / n, MATS['dark_steel'], 0.0)
def ladder(x, y0, y1, z, w=0.5, along='X'):
    m = MATS['safety_yellow']
    for d in (-w / 2, w / 2):
        if along == 'X': box(0.05, y1 - y0, 0.06, x + d, (y0 + y1) / 2, z, m, 0.005)
        else: box(0.06, y1 - y0, 0.05, x, (y0 + y1) / 2, z + d, m, 0.005)
    k = int((y1 - y0) / 0.3)
    for i in range(k):
        yy = y0 + 0.2 + i * 0.3
        if along == 'X': box(w, 0.04, 0.04, x, yy, z, m, 0.0)
        else: box(0.04, 0.04, w, x, yy, z, m, 0.0)
def bolts(n, R, x, y, z, axis, rb=0.03, hb=0.08, m=None):
    m = m or MATS['dark_steel']
    for i in range(n):
        a = i / n * 2 * math.pi; c, s = R * math.cos(a), R * math.sin(a)
        if axis == 'X': cyl(rb, hb, x, y + c, z + s, m, 'X', 6)
        elif axis == 'Y': cyl(rb, hb, x + c, y, z + s, m, 'Y', 6)
        else: cyl(rb, hb, x + c, y + s, z, m, 'Z', 6)
def extinguisher(x, y, z):
    cyl(0.09, 0.52, x, y + 0.36, z, MATS['signal_red'], 'Y', 16, 0.02); cyl(0.05, 0.1, x, y + 0.67, z, MATS['dark_steel'], 'Y', 10)
    box(0.14, 0.03, 0.03, x + 0.06, y + 0.7, z, MATS['dark_steel'], 0.0); pipe([(x + 0.05, y + 0.68, z), (x + 0.12, y + 0.5, z + 0.02), (x + 0.1, y + 0.25, z + 0.02)], 0.012, MATS['rubber'])

# ---------------------------------------------------------------- finalize: join per part, set pivot, export
def finalize():
    out = []
    for pid, P in PARTS.items():
        objs = [o for o in P['objs'] if o.name in bpy.data.objects]
        if not objs: continue
        bpy.ops.object.select_all(action='DESELECT')
        for o in objs:
            o.select_set(True)
        bpy.context.view_layer.objects.active = objs[0]
        bpy.ops.object.convert(target='MESH')           # applies modifiers, converts curves
        objs = [o for o in bpy.context.selected_objects]
        bpy.context.view_layer.objects.active = objs[0]
        if len(objs) > 1: bpy.ops.object.join()
        o = bpy.context.view_layer.objects.active; o.name = pid; o.data.name = pid
        bpy.context.scene.cursor.location = B(*P['pivot']); bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
        try: bpy.ops.object.shade_auto_smooth(angle=math.radians(35))
        except Exception: pass
        out.append(o)
    return out
def export(path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', export_apply=True, export_yup=True, use_selection=True)
    tris = sum(len(o.data.loop_triangles) if o.data.calc_loop_triangles() is None else 0 for o in bpy.data.objects if o.type == 'MESH')
    print('EXPORT', path, os.path.getsize(path) // 1024, 'KB', len([o for o in bpy.data.objects if o.type == 'MESH']), 'parts', tris, 'tris')

# ---------------------------------------------------------------- Cycles still for review (studio light like the explorer)
def still(path, cam_three, tgt_three, lens=40, rx=1400, ry=788, samples=32):
    S = bpy.context.scene
    if not S.world:
        W = bpy.data.worlds.new('w'); S.world = W
        try: W.use_nodes = True
        except Exception: pass
        W.node_tree.nodes['Background'].inputs['Color'].default_value = (0.93, 0.92, 0.89, 1); W.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.6
        c = Vector(tgt_three)
        for name, off, e, sz, col in (('key', (-14, 18, -16), 9000, 10, (1, .95, .88)), ('fill', (16, 9, 14), 2500, 12, (.85, .9, 1)), ('rim', (20, 14, 8), 3500, 6, (.9, .95, 1))):
            l = bpy.data.lights.new(name, 'AREA'); l.energy = e; l.size = sz; l.color = col
            o = bpy.data.objects.new(name, l); S.collection.objects.link(o); o.location = B(*(c + Vector(off)))
            o.rotation_euler = (B(*c) - o.location).to_track_quat('-Z', 'Y').to_euler()
    if 'cam' not in bpy.data.objects:
        cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); S.collection.objects.link(cam); S.camera = cam
    cam = bpy.data.objects['cam']; cam.data.lens = lens
    cam.location = B(*cam_three); cam.rotation_euler = (B(*tgt_three) - cam.location).to_track_quat('-Z', 'Y').to_euler()
    S.render.engine = 'CYCLES'; S.cycles.samples = samples; S.cycles.use_denoising = True
    S.render.resolution_x, S.render.resolution_y = rx, ry; S.view_settings.view_transform = 'AgX'
    S.render.filepath = path; bpy.ops.render.render(write_still=True)
