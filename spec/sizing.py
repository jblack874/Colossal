"""COLOSSAL v0 sizing. Every number tagged S (sourced), D (derived, formula shown), I (invented)."""
import math, json
g, rho_sw, rho_st = 9.81, 1025.0, 7850.0
# ---- SOURCED analogs
CT_shoe_m, CT_shoe_len, CT_shoe_pitch = 998.0, 2.286, 0.457   # S crawler shoe 2,200 lb, 7.5 ft x 1.5 ft
CT_P_trac, CT_v_load = 16*375*745.7, 0.447                    # S 16 x 375 hp; 1 mph loaded
CT_W_max = (6.65e6 + 18e6) * 0.4536 * g                       # S CT-2 6.65M lb + 18M lb capacity
CT_ratio = 168.0                                              # S drive gear ratio 168:1
B288_p = 1.71e5                                               # S Bagger 288 ground pressure 1.71 bar
PRE_steel, PRE_env = 260e6, 488*74*105                        # S Prelude steel 260 kt; envelope
SLP_disp, SLP_thr, SLP_plant = 273.7e6, 8*5.5e6, 12*8e6       # S Sleipnir
S690 = 690e6                                                  # S EN 10025-6 min yield (<=50 mm)
LIEB_ring = 23.4                                              # S largest Liebherr slewing bearing
# ---- INVENTED geometry (proportions read off the references, scale set by hull length)
G = dict(L_main_C=150.0, belt_w=13.0, belts_per_unit=2, unit_w=28.0, unit_h=30.0,
         pod_C=36.0, pod_belt_w=11.0, pod_unit_w=24.0, pod_h=24.0, beam=100.0,
         hull_L=230.0, hull_h=10.0, up_L=170.0, up_W=64.0, up_H=38.0, ring_D=48.0,
         boom_L=150.0, boom_D=12.0, boom_t_ratio=1/100, n_teeth=12, v_land=0.5)
R = {}
s = G['belt_w']/CT_shoe_len;            R['shoe_scale']=s                     # D
pitch = CT_shoe_pitch*s;                R['shoe_pitch_m']=pitch               # D
shoe_solid = CT_shoe_m*s**3;            R['shoe_solid_t']=shoe_solid/1e3      # D square-cube (rejected: open choice 1)
# ---- HOLLOW FABRICATED SHOE (open choice 1 = a). Box section: 2 flanges + n_web webs, S690.
SHOE = dict(h_frac=0.40, t_min=0.050, n_web=4, t_web=0.040, extra=0.30, SF=3.0, p_design=1.71e5)  # I
sig_a = S690/SHOE['SF']; tau_a = sig_a/3**0.5                                  # D allowables (SF 3: fatigue, crawler shoes cracked)
def hollow(b):
    c, h = pitch, SHOE['h_frac']*pitch
    t_bend = SHOE['p_design']*b**2/(32*sig_a*h)   # D: supports at b/4 and 3b/4 -> M = p c b^2/32, Z ~ t c h
    t = max(SHOE['t_min'], t_bend)
    V = 2*b*c*t + SHOE['n_web']*b*h*SHOE['t_web']
    return rho_st*V*(1+SHOE['extra']), t_bend, t, h
shoe_m, t_bend, t_fl, h_sh = hollow(G['belt_w'])
R.update(shoe_mass_t=shoe_m/1e3, shoe_t_bend_mm=t_bend*1e3, shoe_flange_mm=t_fl*1e3, shoe_depth_m=h_sh, shoe_cut_pct=100*(1-shoe_m/shoe_solid))
r_p = pitch/(2*math.sin(math.pi/G['n_teeth'])); R['sprocket_r_m']=r_p        # D chordal pitch radius
def loop(C, r):                          # open-belt loop, equal sprocket & idler
    L = 2*C + 2*math.pi*r; N = round(L/pitch); C_adj = (N*pitch - 2*math.pi*r)/2
    return L, N, C_adj
L_m, N_m, C_m = loop(G['L_main_C'], r_p); L_p, N_p, C_p = loop(G['pod_C'], r_p)
R.update(main_loop_m=L_m, main_links=N_m, main_C_adj=C_m, pod_loop_m=L_p, pod_links=N_p, pod_C_adj=C_p)
pod_shoe_m = hollow(G['pod_belt_w'])[0]
n_main_belts, n_pod_belts = 2*G['belts_per_unit'], 4
m_shoes = n_main_belts*N_m*shoe_m + n_pod_belts*N_p*pod_shoe_m
rho_env = PRE_steel/PRE_env;            R['steel_env_density']=rho_env       # D 69 kg/m3
V_units = 2*(2*C_m)*G['unit_w']*G['unit_h']*0.5 + 2*(2*C_p)*G['pod_unit_w']*G['pod_h']*0.5  # I 0.5 fill of frame
m_frames = rho_env*V_units*2.0          # I running gear 2x hull steel density (wheels, struts, axles)
m_hull = rho_env*G['hull_L']*G['beam']*G['hull_h']
m_up = rho_env*G['up_L']*G['up_W']*G['up_H']
t = G['boom_D']*G['boom_t_ratio']; m_boom = rho_st*math.pi*G['boom_D']*t*G['boom_L']
sig_boom = 2*rho_st*g*G['boom_L']**2/G['boom_D']; R['boom_selfweight_MPa']=sig_boom/1e6; R['boom_SF']=S690/sig_boom
m_dry = m_shoes+m_frames+m_hull+m_up+m_boom
m = m_dry*1.10                          # I +10% fuel, crew, outfitting
R.update(m_shoes_kt=m_shoes/1e6, m_frames_kt=m_frames/1e6, m_hull_kt=m_hull/1e6, m_up_kt=m_up/1e6, m_boom_kt=m_boom/1e6, mass_kt=m/1e6)
W = m*g
A = 2*G['belts_per_unit']*G['belt_w']*C_m*2 + n_pod_belts*G['pod_belt_w']*C_p*0.8   # I ground run = C on main, 0.8C on pods
A = n_main_belts*G['belt_w']*C_m + n_pod_belts*G['pod_belt_w']*C_p*0.8
R['contact_m2']=A; R['p_land_bar']=W/A/1e5; R['p_vs_B288']=W/A/B288_p
mu = CT_P_trac/CT_v_load/CT_W_max;     R['mu_effective_CT']=mu               # D resistance coeff from crawler
F = mu*W; R['tractive_MN']=F/1e6; R['P_land_MW']=F*G['v_land']/1e6
F_belt = F*(n_main_belts*G['belt_w']*C_m/A)/n_main_belts
R['sprocket_torque_MNm']=F_belt*r_p/1e6
R['belt_pull_MN']=F_belt/1e6; R['pin_d_m']=math.sqrt(4*F_belt/(2*tau_a)/math.pi)   # D double-shear track pin
w = G['v_land']/r_p; R['sprocket_rpm']=w*60/(2*math.pi); R['motor_rpm_168']=R['sprocket_rpm']*CT_ratio
R['link_pass_Hz'] = G['v_land']/pitch                                         # D clank frequency
V_disp = m/rho_sw; R['V_disp_m3']=V_disp
V_buoy = 2*(2*C_m+2*r_p)*G['unit_w']*G['unit_h']*0.6 + 2*(2*C_p+2*r_p)*G['pod_unit_w']*G['pod_h']*0.6  # I 0.6 sealed fraction
R['V_track_pontoons_m3']=V_buoy; R['float_draft_m']=G['unit_h']*V_disp/V_buoy
R['thrust_MW_admiralty'] = SLP_thr*(m/SLP_disp)**(2/3)/1e6                    # D Admiralty scaling from Sleipnir
R['thrusters_5p5MW'] = math.ceil(R['thrust_MW_admiralty']/5.5)
R['plant_MW_needed'] = max(R['P_land_MW'], R['thrust_MW_admiralty'])
R['ring_vs_Liebherr'] = G['ring_D']/LIEB_ring
L_ov = 2*C_p + 2*C_m*0 + G['hull_L']
R['overall_L_with_boom_m'] = G['up_L']/2 + G['boom_L'] + G['hull_L']/2
R['height_m'] = G['unit_h'] + G['hull_h'] + 8 + G['up_H']
# ---- UPLIFT CONCEPTS (Joe asked: any legs?). Target dW = load to shed to reach Bagger 288 pressure, if any.
rho_air = 1.225                                               # S ISA sea level
dW = max(W - B288_p*A, 0.0); R['dW_needed_MN']=dW/1e6
A_rot = G['up_L']*G['up_W']                                   # I whole upper-deck footprint as rotor disk
T_test = 0.10*W                                               # I test case: shed 10% of weight
R['rotor_P_ideal_GW_10pct'] = T_test**1.5/math.sqrt(2*rho_air*A_rot)/1e9   # D actuator disk, ideal
R['rotor_downwash_ms_10pct'] = 2*math.sqrt(T_test/(2*rho_air*A_rot))         # D far-wake velocity
HIND_V, HIND_L = 200000.0, 232e3                               # S Hindenburg gas volume, gross lift (kg)
lift_per_m3 = HIND_L/HIND_V; R['H2_lift_kg_m3']=lift_per_m3
R['balloon_m3_10pct'] = T_test/g/lift_per_m3; R['balloon_hindenburgs_10pct'] = R['balloon_m3_10pct']/HIND_V
R['air_vs_water_volume_ratio'] = rho_sw/lift_per_m3
for k,v in R.items(): print(f"{k:24s} {v:,.3f}" if isinstance(v,float) else f"{k:24s} {v}")
json.dump({'G':G,'R':R}, open(__import__('os').path.join(__import__('os').path.dirname(__file__),'sizing.json'),'w'), indent=1)
