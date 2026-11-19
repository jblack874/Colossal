// Bug sweep: one still per view × mode × display; console errors; NaN/undefined in the HUD; draw calls + triangles.
// usage: CHROMIUM=... node scripts/sweep.mjs <page.html> <outDir> [t]
import {createRequire} from 'node:module';
import path from 'node:path'; import fs from 'node:fs';
const require = createRequire(path.resolve('kit/x.js'));
const {chromium} = require('playwright');
const [,, html, outDir, tArg] = process.argv; fs.mkdirSync(outDir, {recursive: true});
const b = await chromium.launch({executablePath: process.env.CHROMIUM, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader']});
const p = await b.newPage({viewport: {width: 1600, height: 900}});
const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); if (m.text().startsWith('hand check')) console.log(m.text()); });
await p.goto('file://' + path.resolve(html)); await p.waitForFunction(() => window.__app?.ready, null, {timeout: 60000});
await p.evaluate(() => { window.__hold = true; });
const shots = (process.env.SHOTS || 'hero:HERO:STUDIO:0:0,side:SIDE:STUDIO:0:0,track:TRACK:STUDIO:0:0,track-xray:TRACK:STUDIO:1:0,pod:POD:STUDIO:1:0,top:TOP:STUDIO:0:0,wade:HERO:STUDIO:0:8,float:SIDE:STUDIO:0:24,field:FIELD:FIELD:0:0').split(',').map((s) => s.split(':'));
const t = +(tArg ?? 120);
for (const [name, v, mode, xr, depth] of shots) {
  const info = await p.evaluate(([v, mode, xr, depth, t]) => {
    const A = window.__app; A.ui.mode = mode; A.act('m:' + mode); A.ui.xray = !!+xr; A.act('x'); A.act('x');
    A.ui.depth = +depth; A.view(v); A.settle(); A.renderAt(t);
    const hud = document.getElementById('hud').innerText; const nan = hud.match(/NaN|Infinity|undefined/g);
    return {nan};
  }, [v, mode, xr, depth, t]);
  await p.waitForTimeout(400);
  const ri = await p.evaluate(([t]) => { window.__app.renderAt(t); return null; }, [t]);
  if (info.nan) errs.push(`${name}: ${info.nan.join(',')}`);
  await p.screenshot({path: `${outDir}/${name}.jpg`, type: 'jpeg', quality: 82});
  console.log('shot', name);
}
console.log('errors:', errs.length ? errs.join(' | ') : 'none'); await b.close();
