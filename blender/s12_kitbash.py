# COLOSSAL facade services (anti-"box" pass): the systems inside surface on the outside the way they do on real
# ships and plants - pipe racks, cable/duct risers, enclosed stair towers, condenser sponsons, exhaust trunks,
# floodlights, life-saving and fire stations, fenders, sea chests, mooring winches. Two assets:
#  facade_up.glb  slewing-deck frame (upper block sides z = +-32, rear face x = -150)
#  facade_hull.glb rig frame (hull sides z = +-50, bow x = 230, stern x = 0)
import sys, os, math, random; sys.path.insert(0, os.path.dirname(__file__))
from blib import *
OUT = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else '/tmp/b'
rnd = random.Random(11)

def P(C):
    return dict(rack=mat('rack_dark', 0x3c4044, 0.6, 0.45), pipeW=mat('pipe_water', 0x3f7d4e, 0.3, 0.45), pipeF=mat('pipe_fuel', 0x9b7b2a, 0.3, 0.45),
                pipeR=mat('pipe_fire', 0xb5352a, 0.3, 0.45), pipeB=mat('pipe_air', 0x6f8fae, 0.3, 0.45), pipeG=mat('pipe_grey', 0x8d9399, 0.6, 0.4),
                riser=mat('riser_grey', 0x7d8287, 0.4, 0.5), tower=mat('tower_light', 0xc9c6bf, 0.2, 0.6), dark=mat('skirt_dark', 0x45484c, 0.5, 0.55),
                fan=mat('fan_black', 0x18191b, 0.5, 0.5), win=mat('stair_glass', 0x1a2229, 0.5, 0.1, 0xd8cfb8, 0.3), flood=mat('flood', 0xffffff, 0, 0.3, 0xfff2d0, 3.0),
                red=C['red'], yellow=C['yellow'], orange=mat('lifebuoy', 0xe8562a, 0.0, 0.6), black=mat('fender_black', 0x141414, 0.0, 0.85), steel=C['steel'])

def pipe_rack(K, x0, x1, y, zface, s, n=6):
    """horizontal pipe rack on brackets along a z face (s = +1 outward +z)"""
    cols = [K['pipeW'], K['pipeF'], K['pipeR'], K['pipeB'], K['pipeG'], K['pipeW'], K['pipeG']]
    for x in range(int(x0), int(x1), 6):
        box(0.25, 0.25, 1.6, x, y - 0.2, zface + s * 0.8, K['rack'], 0.02); box(0.2, 1.2, 0.2, x, y + 0.35, zface + s * 1.55, K['rack'], 0.01)
    for k in range(n):
        r = 0.12 + 0.05 * (k % 3); z = zface + s * (0.45 + (k % 4) * 0.36); yy = y + (k // 4) * 0.55
        cyl(r, x1 - x0, (x0 + x1) / 2, yy, z, cols[k % len(cols)], 'X', 12)
        for x in range(int(x0) + 3, int(x1), 12): torus(r + 0.03, 0.04, x, yy, z, K['rack'], 'X', 12, 4)        # flanges
        if k % 3 == 0:
            for x in range(int(x0) + 9, int(x1), 24): box(0.4, 0.4, 0.4, x, yy, z, K['red'] if k == 0 else K['steel'], 0.05); cyl(0.2, 0.05, x, yy + 0.45, z, K['yellow'], 'Y', 12)   # valves + handwheels

def facade_side(K, s, zf, x0, x1, ybot, ytop):
    pipe_rack(K, x0 + 2, x1 - 2, ybot + 4.0, zf, s, 7)
    pipe_rack(K, x0 + 2, x1 - 2, ybot + 17.8, zf, s, 5)
    box(x1 - x0, 3.6, 0.6, (x0 + x1) / 2, ybot + 1.8, zf + s * 0.3, K['dark'], 0.08)                          # machinery skirt
    for x in range(int(x0) + 4, int(x1) - 4, 9): box(4.2, 2.4, 0.15, x, ybot + 1.9, zf + s * 0.65, K['fan'], 0.02)  # skirt louvres
    for x in range(int(x0) + 12, int(x1) - 6, 24):                                                            # cable / duct risers
        box(1.6, ytop - ybot - 2, 1.0, x, (ybot + ytop) / 2, zf + s * 0.5, K['riser'], 0.06)
        for y in range(int(ybot) + 6, int(ytop) - 2, 8): box(1.2, 1.0, 0.1, x, y, zf + s * 1.05, K['dark'], 0.02)
    for x in (x0 + 30, x0 + 110):                                                                            # enclosed stair towers
        box(5, ytop - ybot + 3, 4.4, x, (ybot + ytop + 3) / 2, zf + s * 2.2, K['tower'], 0.25)
        for y in range(int(ybot) + 3, int(ytop), 4): box(0.9, 2.2, 0.1, x - 1.4, y, zf + s * 4.45, K['win'], 0.02); box(0.9, 2.2, 0.1, x + 1.4, y + 2, zf + s * 4.45, K['win'], 0.02)
        box(5.6, 0.6, 5.0, x, ytop + 3.3, zf + s * 2.2, K['riser'], 0.1)
    for x in (x0 + 55, x0 + 80, x0 + 140, x0 + 165):                                                          # condenser sponsons
        box(10, 0.5, 3.6, x, ybot + 29.5, zf + s * 1.8, K['rack'], 0.05)
        for k in range(3):
            box(2.8, 1.6, 2.8, x - 3.2 + k * 3.2, ybot + 30.6, zf + s * 1.8, mat('condenser', 0xdedbd2, 0.2, 0.5), 0.1)
            cyl(1.05, 0.12, x - 3.2 + k * 3.2, ybot + 31.45, zf + s * 1.8, K['fan'], 'Y', 24); box(0.15, 0.06, 2.0, x - 3.2 + k * 3.2, ybot + 31.5, zf + s * 1.8, K['steel'], 0.0)
        for k in range(3): box(10.2, 0.06, 0.06, x, ybot + 30.3 + k * 0.4, zf + s * 3.6, K['yellow'], 0.0)
    for x in (x0 + 18, x0 + 95, x0 + 150):                                                                     # exhaust trunks to the roof
        box(2.6, ytop - ybot - 22, 2.0, x, ytop - (ytop - ybot - 22) / 2 + 0.5, zf + s * 1.2, K['pipeG'], 0.15)
        box(3.0, 1.2, 2.4, x, ytop + 1.2, zf + s * 1.2, K['dark'], 0.1)
    for x in range(int(x0) + 6, int(x1), 12):                                                                 # fire + lifebuoy stations on the catwalks
        for y in (ybot + 14.2, ybot + 28.2):
            box(0.8, 1.0, 0.3, x, y + 0.8, zf + s * 0.3, K['red'], 0.04)
            torus(0.32, 0.08, x + 2.0, y + 1.1, zf + s * 0.25, K['orange'], 'Z', 20, 6)
    for x in range(int(x0) + 10, int(x1), 20):                                                                # floodlights
        box(0.5, 0.35, 0.4, x, ytop - 1.0, zf + s * 0.7, K['flood'], 0.03); box(0.08, 0.6, 0.6, x, ytop - 0.7, zf + s * 0.4, K['rack'], 0.0)

reset(); C = palette(); K = P(C)
with part('facade_up', (-60, 30, 32)):
    for s in (1, -1): facade_side(K, s, s * 32, -150, 30, 8, 50)
    for z in range(-28, 30, 8):                                                                              # rear face: exhaust stacks + ladders
        box(1.6, 40, 1.2, -150.6, 29, z, K['riser'], 0.08)
    for z in (-18, 0, 18): box(0.6, 14, 10, -150.4, 30, z, K['fan'], 0.05)
    pipe_rack(K, -148, 28, 8.9, 32, 1, 3); pipe_rack(K, -148, 28, 8.9, -32, -1, 3)
finalize(); export(f'{OUT}/facade_up.glb')

reset(); C = palette(); K = P(C)
with part('facade_hull', (115, 35, 50)):
    for s in (1, -1):
        zf = s * 50.0
        pipe_rack(K, 4, 226, 38.0, zf + s * 0.3, s, 4)
        for x in range(10, 225, 12): box(1.4, 3.2, 0.9, x, 33.2, zf + s * 0.75, K['black'], 0.25)                 # fenders
        for x in range(18, 220, 32): box(4.0, 1.6, 0.2, x, 31.2, zf + s * 0.15, K['fan'], 0.02)                   # sea chest gratings
        for x in (40, 120, 200):                                                                                  # mooring winches on deck edge
            cyl(1.2, 2.6, x, 41.5, zf - s * 4, mat('winch_blue', 0x2c4a75, 0.4, 0.45), 'X', 24, 0.05); cyl(1.6, 0.3, x - 1.4, 41.5, zf - s * 4, K['rack'], 'X', 24); cyl(1.6, 0.3, x + 1.4, 41.5, zf - s * 4, K['rack'], 'X', 24)
            box(3.6, 0.6, 2.6, x, 40.4, zf - s * 4, K['rack'], 0.05)
        box(3.0, 2.4, 0.2, 75, 37.0, zf + s * 0.15, mat('door_grey', 0xb7bdc1, 0.4, 0.4), 0.05)                     # gangway door
        box(14, 0.4, 1.4, 90, 37.4, zf + s * 0.9, K['steel'], 0.05)                                                  # stowed accommodation ladder
        for x in range(8, 228, 16): box(0.5, 0.35, 0.4, x, 39.3, zf + s * 0.5, K['flood'], 0.03)
    for z in range(-40, 44, 16): box(0.3, 6, 6, 230.2, 34.5, z, K['dark'], 0.1)                                  # bow access + anchor pockets
    for z in (-30, 30): cyl(2.2, 0.8, 230.4, 34.5, z, K['black'], 'X', 24); box(3.2, 1.6, 2.4, 231.4, 33.5, z, K['steel'], 0.1)
    for z in range(-40, 44, 20): box(0.3, 5, 8, -0.2, 34.5, z, K['dark'], 0.1)
finalize(); export(f'{OUT}/facade_hull.glb')
print('DONE')
