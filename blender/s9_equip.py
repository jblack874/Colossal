# COLOSSAL interior equipment library. Every item is one named node, real size in metres, origin at floor centre,
# front facing +z (the explorer rotates items to face into the room). Used by ga.js to furnish every compartment.
import sys, os, math; sys.path.insert(0, os.path.dirname(__file__))
from blib import *
OUT = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else '/tmp/b'
reset(); C = palette()
scr = mat('screen_data', 0x0b1622, 0.0, 0.25, 0x2a9df4, 1.6); scr2 = mat('screen_amber', 0x1a1206, 0.0, 0.25, 0xf2a33a, 1.4); scr3 = mat('screen_green', 0x061a0e, 0.0, 0.25, 0x37d67a, 1.3)
led = mat('led_status', 0x0a2a0a, 0.0, 0.3, 0x39ff6a, 2.5); ledr = mat('led_red', 0x2a0a0a, 0.0, 0.3, 0xff3b30, 2.5)
navyc = mat('console_navy', 0x2b3442, 0.4, 0.45); grey = mat('equip_grey', 0x9aa1a7, 0.4, 0.45); dkg = mat('equip_dark', 0x3b4046, 0.5, 0.45)
fab = mat('fabric_blue', 0x34507a, 0.0, 0.85); mattress = mat('mattress', 0xd9d4c8, 0.0, 0.9); wood = mat('table_top', 0x7a6a55, 0.0, 0.6)
ss = mat('stainless', 0xc9ced2, 1.0, 0.22); skin = mat('skin', 0xc89a7a, 0.0, 0.6); cov = mat('coverall_orange', 0xe2662a, 0.0, 0.75); covb = mat('coverall_blue', 0x2c4a7a, 0.0, 0.75)
hel = mat('helmet_white', 0xf2f2ee, 0.1, 0.4); olive = mat('olive_drab', 0x4f5a3a, 0.2, 0.6); brassm = mat('brass_case', 0xc9a24a, 1.0, 0.3)
proj = mat('projectile_grey', 0x6c7378, 0.7, 0.4); band = mat('driving_band', 0xb87333, 1.0, 0.3); yellow_band = mat('he_yellow', 0xe8c21a, 0.2, 0.45)

def item(name):
    return part(name, (0, 0, 0))

with item('bunk3'):                               # 3-tier bunk, 2.0 x 0.9
    for y in (0.35, 1.15, 1.95):
        box(2.0, 0.08, 0.9, 0, y, 0, grey, 0.01); box(1.9, 0.14, 0.82, 0, y + 0.11, 0, mattress, 0.04)
        box(1.9, 0.02, 0.6, 0, y + 0.55, -0.15, fab, 0.0)                                # privacy curtain rail stub
        box(0.3, 0.05, 0.25, -0.75, y + 0.2, -0.25, hel, 0.02)                            # pillow
    for x in (-0.98, 0.98):
        for z in (-0.43, 0.43): box(0.05, 2.5, 0.05, x, 1.25, z, grey, 0.005)
    for y in (0.6, 1.4, 2.2): box(0.6, 0.04, 0.04, 0.6, y, 0.45, grey, 0.0)              # ladder rungs
with item('locker'):
    box(0.6, 1.9, 0.55, 0, 0.95, 0, mat('locker_grey', 0x7d8b97, 0.6, 0.4), 0.01)
    for y in (1.6, 1.65, 1.7): box(0.35, 0.02, 0.01, 0, y, 0.28, dkg, 0.0)
    box(0.03, 0.15, 0.03, 0.22, 1.0, 0.29, dkg, 0.0)
with item('console'):                             # operator console, 2 screens
    box(1.4, 0.75, 0.8, 0, 0.375, 0, navyc, 0.03); box(1.4, 0.06, 0.9, 0, 0.78, 0.05, navyc, 0.02)
    for dx in (-0.36, 0.36):
        box(0.66, 0.42, 0.06, dx, 1.12, -0.25, dkg, 0.01, rx=-0.2); box(0.6, 0.36, 0.01, dx, 1.12, -0.21, scr, 0.0, rx=-0.2)
    box(0.5, 0.03, 0.18, 0, 0.82, 0.25, dkg, 0.005); box(0.12, 0.02, 0.12, 0.42, 0.82, 0.25, dkg, 0.005)
    for k in range(6): box(0.04, 0.02, 0.03, -0.5 + k * 0.08, 0.83, 0.1, led if k % 3 else ledr, 0.0)
with item('chair'):
    cyl(0.25, 0.04, 0, 0.05, 0, dkg, 'Y', 12); cyl(0.03, 0.42, 0, 0.27, 0, ss, 'Y', 8); box(0.48, 0.08, 0.46, 0, 0.5, 0, fab, 0.03); box(0.46, 0.55, 0.07, 0, 0.82, -0.22, fab, 0.03)
with item('rack'):                                # 42U server / comms rack 0.6 x 2.0 x 1.1
    box(0.6, 2.0, 1.1, 0, 1.0, 0, mat('rack_black', 0x16181b, 0.6, 0.4), 0.01)
    for k in range(14): box(0.5, 0.1, 0.02, 0, 0.2 + k * 0.125, 0.555, dkg, 0.0); box(0.03, 0.02, 0.02, 0.18, 0.2 + k * 0.125, 0.57, led if k % 4 else scr2, 0.0)
    box(0.5, 0.02, 0.01, 0, 1.95, 0.56, led, 0.0)
with item('displaywall'):                         # 4 x 2 video wall
    for i in range(4):
        for j in range(2): box(1.0, 0.58, 0.08, -1.5 + i * 1.0, 1.4 + j * 0.6, 0, dkg, 0.005); box(0.96, 0.54, 0.01, -1.5 + i * 1.0, 1.4 + j * 0.6, 0.045, [scr, scr2, scr3][(i + j) % 3], 0.0)
    box(4.2, 0.1, 0.3, 0, 0.75, 0.05, dkg, 0.02)
with item('plot_table'):
    box(2.4, 0.9, 1.4, 0, 0.45, 0, navyc, 0.03); box(2.2, 0.02, 1.2, 0, 0.91, 0, scr3, 0.0)
with item('table_mess'):                          # 6-seat mess table with benches
    box(2.4, 0.05, 0.9, 0, 0.75, 0, wood, 0.01); cyl(0.05, 0.72, 0, 0.36, 0, ss, 'Y', 10)
    for z in (-0.75, 0.75): box(2.4, 0.06, 0.4, 0, 0.45, z, fab, 0.02); box(0.08, 0.42, 0.08, 0, 0.21, z, ss, 0.0)
with item('galley'):                              # range + hood line 3.6 m
    box(3.6, 0.9, 0.8, 0, 0.45, 0, ss, 0.02)
    for k in range(4): cyl(0.15, 0.02, -1.2 + k * 0.8, 0.91, 0.05, dkg, 'Y', 16)
    box(3.6, 0.4, 0.9, 0, 2.2, -0.05, ss, 0.02); box(3.6, 0.6, 0.1, 0, 1.4, -0.38, ss, 0.0)
    cyl(0.35, 0.5, 1.2, 1.15, 0.0, ss, 'Y', 20)                                         # kettle
with item('fridge'):
    box(1.2, 2.0, 0.8, 0, 1.0, 0, ss, 0.02); box(0.02, 1.8, 0.02, 0, 1.0, 0.41, dkg, 0.0); box(0.04, 0.4, 0.04, -0.1, 1.2, 0.42, dkg, 0.0); box(0.04, 0.4, 0.04, 0.1, 1.2, 0.42, dkg, 0.0)
with item('med_bed'):
    box(2.0, 0.06, 0.9, 0, 0.8, 0, ss, 0.01); box(1.9, 0.12, 0.8, 0, 0.9, 0, mattress, 0.04)
    for x in (-0.9, 0.9):
        for z in (-0.4, 0.4): cyl(0.03, 0.78, x, 0.39, z, ss, 'Y', 8)
    box(0.4, 0.3, 0.08, -1.1, 1.6, -0.3, dkg, 0.01); box(0.34, 0.24, 0.01, -1.1, 1.6, -0.25, scr3, 0.0); cyl(0.02, 1.8, 1.05, 0.9, -0.35, ss, 'Y', 6)
with item('workbench'):
    box(2.4, 0.08, 0.9, 0, 0.9, 0, mat('bench_top', 0x5a4e3f, 0.2, 0.7), 0.01); box(2.3, 0.75, 0.8, 0, 0.45, 0, mat('bench_red', 0x9a2c22, 0.3, 0.5), 0.02)
    for k in range(5): box(0.42, 0.12, 0.02, -0.9 + k * 0.45, 0.6, 0.41, dkg, 0.0)
    box(2.4, 1.0, 0.04, 0, 1.6, -0.43, mat('pegboard', 0x8a8f94, 0.3, 0.6), 0.0); box(0.3, 0.2, 0.25, 0.8, 1.04, 0.1, dkg, 0.02)  # vice
    for k in range(6): box(0.04, 0.3, 0.02, -1.0 + k * 0.3, 1.6, -0.4, dkg, 0.0)
with item('lathe'):
    box(3.0, 0.8, 0.8, 0, 0.4, 0, mat('machine_green', 0x4b6b5a, 0.4, 0.45), 0.04); box(0.8, 0.6, 0.7, -1.1, 1.1, 0, mat('machine_green', 0x4b6b5a), 0.04)
    cyl(0.18, 0.3, -0.6, 1.1, 0, ss, 'X', 20); box(1.6, 0.1, 0.2, 0.3, 1.0, 0, ss, 0.01); box(0.3, 0.3, 0.3, 0.8, 1.15, 0, mat('machine_green', 0x4b6b5a), 0.03)
with item('shelf'):                               # heavy pallet shelving 2.4 x 3.0
    for x in (-1.15, 1.15):
        for z in (-0.5, 0.5): box(0.08, 3.0, 0.08, x, 1.5, z, mat('rack_blue', 0x2a5ea8, 0.4, 0.5), 0.0)
    for y in (0.15, 1.1, 2.05): box(2.4, 0.1, 1.1, 0, y, 0, mat('rack_orange', 0xe0782a, 0.3, 0.5), 0.0)
    for y in (0.2, 1.15, 2.1):
        for x in (-0.6, 0.6): box(1.0, 0.8, 0.9, x, y + 0.45, 0, mat('crate', 0xb08a58, 0.0, 0.8), 0.03)
with item('pallet'):
    box(1.2, 0.15, 1.0, 0, 0.075, 0, mat('crate', 0xb08a58), 0.01); box(1.1, 1.0, 0.9, 0, 0.65, 0, mat('shrink_wrap', 0xd0d6d8, 0.0, 0.3), 0.06)
with item('ahu'):                                 # air handling unit 4.0 x 2.4 x 1.6
    box(4.0, 2.2, 1.6, 0, 1.2, 0, mat('ahu_grey', 0xc5c9c4, 0.3, 0.5), 0.04)
    for k in range(4): box(0.9, 1.9, 0.03, -1.5 + k * 1.0, 1.2, 0.81, mat('ahu_grey', 0xc5c9c4), 0.01); box(0.04, 0.18, 0.04, -1.1 + k * 1.0, 1.2, 0.84, dkg, 0.0)
    box(1.2, 1.2, 1.2, 0.6, 2.9, 0, mat('ahu_grey', 0xc5c9c4), 0.03); box(1.0, 0.4, 1.0, -1.2, 2.5, 0, mat('duct', 0xa9adb0, 0.9, 0.35), 0.02)
with item('chiller'):
    box(4.5, 1.8, 1.6, 0, 0.9, 0, mat('chiller_blue', 0x3b6a9a, 0.4, 0.45), 0.04)
    for x in (-1.2, 1.2): cyl(0.4, 2.0, x, 2.2, 0, ss, 'X', 24)
    box(0.6, 0.9, 0.3, 1.9, 1.3, 0.85, dkg, 0.02); box(0.4, 0.25, 0.01, 1.9, 1.5, 1.0, scr3, 0.0)
    for k in range(3): elbow_pipe([(-1.8 + k * 0.4, 1.8, -0.4), (-1.8 + k * 0.4, 3.3, -0.4)], 0.08, C['water'])
with item('ro_unit'):                             # reverse-osmosis water maker skid
    box(5.0, 0.2, 1.4, 0, 0.1, 0, C['base'], 0.01)
    for k in range(6): cyl(0.13, 4.2, 0, 0.6 + k * 0.28, -0.3, mat('membrane', 0xe8e6e0, 0.1, 0.4), 'X', 16)
    box(0.8, 1.2, 0.6, -2.0, 0.8, 0.35, C['blue'], 0.03); box(0.7, 1.4, 0.3, 1.9, 1.0, 0.45, mat('panel_cab', 0xd0d2cf, 0.2, 0.5), 0.02); box(0.4, 0.25, 0.01, 1.9, 1.3, 0.61, scr, 0.0)
with item('battery_rack'):
    box(2.4, 2.0, 0.8, 0, 1.0, 0, mat('rack_black', 0x16181b), 0.01)
    for i in range(6):
        for j in range(4): box(0.36, 0.42, 0.7, -1.0 + i * 0.4, 0.3 + j * 0.47, 0.02, mat('battery', 0x2f4f6f, 0.3, 0.5), 0.02); box(0.06, 0.03, 0.02, -1.0 + i * 0.4, 0.45 + j * 0.47, 0.38, led, 0.0)
with item('switch_panel'):                        # LV distribution board line-up 3.0 m
    for i in range(4):
        box(0.74, 2.1, 0.6, -1.12 + i * 0.75, 1.05, 0, C['cabinet'], 0.015)
        for k in range(6): box(0.5, 0.12, 0.02, -1.12 + i * 0.75, 0.5 + k * 0.22, 0.31, dkg, 0.0); box(0.04, 0.04, 0.02, -0.95 + i * 0.75, 0.5 + k * 0.22, 0.32, led if (i + k) % 5 else ledr, 0.0)
        box(0.2, 0.12, 0.01, -1.12 + i * 0.75, 1.85, 0.31, scr2, 0.0)
with item('pump_skid'):
    box(2.4, 0.2, 1.0, 0, 0.1, 0, C['base'], 0.01); cyl(0.32, 0.9, -0.5, 0.55, 0, C['blue'], 'X', 24, 0.02); cyl(0.38, 0.5, 0.45, 0.55, 0, mat('pump_red', 0xa83226, 0.4, 0.45), 'X', 24, 0.03)
    elbow_pipe([(0.45, 0.9, 0), (0.45, 1.8, 0), (1.3, 1.8, 0)], 0.1, mat('pump_red', 0xa83226)); cyl(0.12, 0.05, 0.8, 1.8, 0.12, C['yellow'], 'Z', 16)
with item('tank_v'):                              # vertical tank 2.4 dia
    cyl(1.2, 3.2, 0, 1.8, 0, mat('tank_white', 0xdcd9d1, 0.3, 0.5), 'Y', 32, 0.05); sphere(1.2, 0, 3.4, 0, mat('tank_white', 0xdcd9d1), 24)
    for a in range(4): cyl(0.08, 0.3, 1.05 * math.cos(a * 1.57), 0.15, 1.05 * math.sin(a * 1.57), C['base'], 'Y', 8)
    box(0.08, 2.6, 0.06, 1.22, 1.9, 0, C['glass'], 0.0); cyl(0.3, 0.1, 0, 4.65, 0, dkg, 'Y', 16); ladder(-1.3, 0.2, 4.4, 0, 0.45, 'Z')
with item('gym'):
    box(1.8, 0.2, 0.7, -1.2, 0.1, 0, dkg, 0.02); box(1.6, 0.04, 0.5, -1.2, 0.22, 0, mat('belt', 0x111111, 0, 0.8), 0.0); box(0.1, 1.2, 0.1, -0.35, 0.8, 0, dkg, 0.0); box(0.4, 0.3, 0.1, -0.35, 1.4, 0.05, scr, 0.0)
    box(1.2, 0.08, 0.3, 1.2, 0.45, 0, fab, 0.02)
    cyl(0.03, 1.8, 1.2, 1.2, 0, ss, 'X', 8); cyl(0.22, 0.05, 0.4, 1.2, 0, dkg, 'X', 16); cyl(0.22, 0.05, 2.0, 1.2, 0, dkg, 'X', 16)
    for x in (0.7, 1.7): box(0.06, 1.3, 0.06, x, 0.65, -0.2, ss, 0.0)
with item('washer'):
    for i in range(3): box(0.7, 0.9, 0.7, -0.75 + i * 0.75, 0.45, 0, mat('appliance_white', 0xeeeeea, 0.1, 0.35), 0.03); cyl(0.22, 0.03, -0.75 + i * 0.75, 0.5, 0.36, C['glass'], 'Z', 20)
with item('toilet_block'):
    for i in range(3):
        box(0.05, 2.1, 1.4, -0.9 + i * 0.9, 1.05, 0, mat('cubicle', 0xb9c4cc, 0.1, 0.5), 0.0); box(0.4, 0.4, 0.55, -0.45 + i * 0.9, 0.2, -0.3, mat('appliance_white', 0xeeeeea), 0.06)
    box(2.7, 0.05, 0.5, 0, 0.85, 0.6, ss, 0.0)
with item('crew_stand'):                          # standing crew member 1.78 m
    for dx in (-0.1, 0.1): box(0.14, 0.82, 0.16, dx, 0.41, 0, covb, 0.04)
    box(0.42, 0.62, 0.24, 0, 1.13, 0, covb, 0.08); sphere(0.11, 0, 1.6, 0, skin, 14); sphere(0.125, 0, 1.66, 0, hel, 14)
    for dx in (-0.27, 0.27): box(0.1, 0.62, 0.12, dx, 1.1, 0.02, covb, 0.04)
with item('crew_orange'):
    for dx in (-0.1, 0.1): box(0.14, 0.82, 0.16, dx, 0.41, 0, cov, 0.04)
    box(0.42, 0.62, 0.24, 0, 1.13, 0, cov, 0.08); sphere(0.11, 0, 1.6, 0, skin, 14); sphere(0.125, 0, 1.66, 0, hel, 14)
    for dx in (-0.27, 0.27): box(0.1, 0.62, 0.12, dx, 1.1, 0.05, cov, 0.04, rx=-0.4)
with item('crew_seated'):
    for dx in (-0.1, 0.1): box(0.14, 0.45, 0.16, dx, 0.22, 0.38, covb, 0.04); box(0.14, 0.14, 0.45, dx, 0.5, 0.18, covb, 0.04)
    box(0.42, 0.62, 0.24, 0, 0.88, 0, covb, 0.08); sphere(0.11, 0, 1.33, 0, skin, 14)
    for dx in (-0.25, 0.25): box(0.1, 0.12, 0.45, dx, 0.82, 0.22, covb, 0.04)
with item('hvac_duct'):                           # 6 m overhead duct + cable tray run (hung at ceiling, origin at top)
    box(6.0, 0.6, 0.9, 0, -0.35, 0.6, mat('duct', 0xa9adb0, 0.9, 0.35), 0.03)
    for x in (-2.95, 0, 2.95): box(0.06, 0.7, 1.0, x, -0.35, 0.6, mat('duct', 0xa9adb0), 0.0)
    box(6.0, 0.05, 0.6, 0, -0.25, -0.5, C['grate'], 0.0)
    for k in range(5): cyl(0.03, 6.0, 0, -0.2, -0.7 + k * 0.08, C['cable'] if k % 2 else C['mvcable'], 'X', 8)
    for k, m in enumerate((C['water'], C['fuel'], C['red'])): cyl(0.06, 6.0, 0, -0.85, -0.6 + k * 0.2, m, 'X', 10)
    box(1.2, 0.06, 0.3, 1.5, -0.1, 0.0, mat('light_panel', 0xffffff, 0.0, 0.3, 0xfff4e0, 2.2), 0.01)
with item('door'):                                # watertight door + frame 1.0 x 1.9 (in the bulkhead plane)
    box(1.3, 2.2, 0.12, 0, 1.1, 0, mat('door_frame', 0x7b8186, 0.6, 0.4), 0.04); box(0.95, 1.85, 0.1, 0, 1.05, 0.04, mat('door_grey', 0xb7bdc1, 0.4, 0.4), 0.15)
    for y in (0.4, 1.05, 1.7): box(0.12, 0.05, 0.05, 0.35, y, 0.12, dkg, 0.0)
    cyl(0.12, 0.04, -0.2, 1.05, 0.11, C['yellow'], 'Z', 16); box(0.3, 0.12, 0.01, 0, 1.95, 0.1, mat('sign_white', 0xf4f4f0, 0.0, 0.5), 0.0)
with item('fire_station'):
    box(0.9, 1.1, 0.3, 0, 1.4, 0, C['red'], 0.03); cyl(0.3, 0.2, 0, 1.4, 0.2, mat('hose', 0xd9c27a, 0.0, 0.7), 'Z', 20); extinguisher(0.6, 0, 0.1)
    box(0.5, 0.3, 0.01, 0, 2.15, 0.02, mat('sign_white', 0xf4f4f0), 0.0)
with item('stair'):                               # inclined ladder deck-to-deck 4.2 m
    for k in range(14): box(0.9, 0.04, 0.22, 0, 0.3 * k + 0.15, -1.5 + k * 0.23, mat('tread', 0x8d9399, 0.8, 0.5), 0.0)
    for x in (-0.47, 0.47): box(0.06, 0.2, 3.4, x, 2.1, 0.1, C['yellow'], 0.0, rx=-0.91); box(0.04, 0.04, 3.4, x, 3.0, 0.1, C['yellow'], 0.0, rx=-0.91)
with item('gen_emerg'):
    box(5.0, 0.3, 1.8, 0, 0.15, 0, C['base'], 0.02); box(2.6, 1.6, 1.4, -0.9, 1.1, 0, mat('engine_yellow', 0xd9a31a, 0.4, 0.45), 0.06)
    cyl(0.7, 1.6, 1.4, 1.0, 0, C['blue'], 'X', 32, 0.03); pipe([(-1.5, 1.9, 0), (-1.5, 3.0, 0), (-1.5, 4.0, 0.5)], 0.15, C['lag'])
with item('crane_hoist'):                         # overhead rail + chain hoist (origin at ceiling)
    box(8.0, 0.4, 0.2, 0, -0.2, 0, C['yellow'], 0.02); box(0.5, 0.4, 0.4, 0.5, -0.6, 0, dkg, 0.03); pipe([(0.5, -0.8, 0), (0.5, -2.2, 0)], 0.02, ss, poly=True); box(0.15, 0.2, 0.1, 0.5, -2.35, 0, C['yellow'], 0.02)
with item('spare_shoe'):                          # spare track shoe on cradle (2.6 x 1.5 x 12.6 is too long: half-shoe crate)
    box(2.6, 0.3, 4.0, 0, 0.15, 0, mat('crate', 0xb08a58), 0.02); box(2.5, 1.4, 3.8, 0, 1.0, 0, C['steel'], 0.06)
    for x in (-0.6, 0.6): box(0.35, 0.35, 3.8, x, 1.85, 0, C['steel'], 0.04)
with item('drums'):
    for i in range(4): cyl(0.29, 0.88, -0.35 + (i % 2) * 0.62, 0.44, -0.31 + (i // 2) * 0.62, [C['blue'], mat('drum_red', 0xa83226, 0.4, 0.4), C['yellow'], olive][i], 'Y', 20, 0.02)
with item('hyd_manifold'):
    box(2.4, 1.2, 0.8, 0, 0.9, 0, mat('hyd_block', 0x6a7a62, 0.6, 0.4), 0.04)
    for i in range(8): cyl(0.08, 0.35, -1.0 + i * 0.28, 1.65, 0, dkg, 'Y', 12); box(0.12, 0.12, 0.12, -1.0 + i * 0.28, 1.9, 0, C['yellow'], 0.01)
    for i in range(4): elbow_pipe([(-0.9 + i * 0.6, 0.3, 0.45), (-0.9 + i * 0.6, 0.3, 1.0), (-0.9 + i * 0.6, 0.05, 1.3)], 0.06, [C['red'], C['blue'], C['red'], C['blue']][i])
with item('projectile'):                          # 5.3 m calibre projectile lying on cradle, axis x, 16 m long
    cyl(2.65, 9.0, 0.5, 2.85, 0, proj, 'X', 48, 0.1); cyl(2.65, 5.5, 7.75, 2.85, 0, proj, 'X', 48, 0.0, r2=0.6)   # body + ogive
    torus(2.66, 0.12, -2.5, 2.85, 0, band, 'X', 48, 6); torus(2.66, 0.12, -3.2, 2.85, 0, band, 'X', 48, 6)            # driving bands
    torus(2.66, 0.18, 4.6, 2.85, 0, yellow_band, 'X', 48, 6); cyl(0.6, 0.5, 10.7, 2.85, 0, ss, 'X', 24)            # HE band + fuze
    cyl(2.5, 1.0, -4.5, 2.85, 0, proj, 'X', 48, 0.1)
    for x in (-2.5, 4.0): box(0.6, 0.4, 5.0, x, 0.2, 0, dkg, 0.05)
with item('charge'):                              # modular propellant charge canister (5 per stack), axis x
    for k in range(3): cyl(2.55, 2.2, -2.4 + k * 2.4, 2.75, 0, mat('charge_case', 0x4c5a38, 0.3, 0.55), 'X', 40, 0.08); torus(2.56, 0.08, -2.4 + k * 2.4, 2.75, 0, brassm, 'X', 40, 6)
    for x in (-3.0, 3.0): box(0.5, 0.3, 4.8, x, 0.15, 0, dkg, 0.04)
with item('sensor_rack'):                         # RF / sensor processing cabinet with waveguide
    box(1.2, 2.2, 0.9, 0, 1.1, 0, mat('rf_cab', 0xd8dad6, 0.2, 0.45), 0.02)
    for k in range(5): box(1.0, 0.3, 0.02, 0, 0.4 + k * 0.38, 0.46, dkg, 0.0); box(0.08, 0.03, 0.02, 0.4, 0.4 + k * 0.38, 0.47, led, 0.0)
    box(0.3, 0.12, 0.01, -0.3, 1.9, 0.46, scr2, 0.0); box(0.25, 1.4, 0.15, 0.3, 2.9, -0.2, mat('waveguide', 0xc07a45, 1.0, 0.28), 0.01)
finalize(); export(f'{OUT}/equip.glb')
print('DONE')
