# GLB -> base64 JSON beside the page (claude.ai artifacts serve .json, not .glb) + build.json "external" map
import os, json, base64
os.chdir(os.path.join(os.path.dirname(__file__), '..', 'machines', 'colossal'))
os.makedirs('assets_json', exist_ok=True)
fs = sorted(f for f in os.listdir('assets') if f.endswith('.glb'))
for f in fs:
    j = f'assets_json/{f[:-4]}.json'
    if not os.path.exists(j) or os.path.getmtime(j) < os.path.getmtime(f'assets/{f}'):
        json.dump([base64.b64encode(open(f'assets/{f}', 'rb').read()).decode()], open(j, 'w'))
json.dump({"external": {f: f"../assets_json/{f[:-4]}.json" for f in fs}}, open('build.json', 'w'), indent=1)
print(len(fs), 'assets packed')
