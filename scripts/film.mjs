import {createRequire} from 'node:module';
const require = createRequire('/home/claude/colossal/kit/x.js'); const {chromium} = require('playwright');
// Film the guided tour: one MP4 per tour segment (30 fps, 1280x720), frames piped straight into ffmpeg.
// usage: SEGS=0,1,.. FPS=30 node film.mjs <outDir>
import {spawn} from 'node:child_process'; import fs from 'node:fs';
const out = process.argv[2] || '/tmp/film'; fs.mkdirSync(out, {recursive: true});
const FPS = +(process.env.FPS || 30), W = 1280, H = 720;
const b = await chromium.launch({executablePath: process.env.CHROMIUM, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files']});
const p = await b.newPage({viewport: {width: W, height: H}});
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto('file:///home/claude/colossal/teardown-out/dist/colossal.html');
await p.waitForFunction(() => window.__app?.ready && window.__glb, null, {timeout: 240000});
await p.evaluate(() => { window.__hold = 'film'; window.__app.film(true); });
const TT = await p.evaluate(() => window.__app.TT);
const segs = (process.env.SEGS || TT.map((_, i) => i).join(',')).split(',').map(Number);
for (const s of segs) {
  const tmp = `${out}/seg${s}.part.mp4`, fin = `${out}/seg${s}.mp4`;
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-vf', 'fps=30', '-r', '30', tmp], {stdio: ['pipe', 'inherit', 'inherit']});
  const n = Math.round(TT[s] * FPS), t0 = Date.now();
  await p.evaluate((s) => { const A = window.__app; A.tour.only = s; A.tour.seg = -1; A.tour.on = false; }, s);
  for (let f = 0; f < n; f++) {
    const T = f / FPS;
    await p.evaluate(([T]) => { const A = window.__app; A.tourAt(T); A.renderAt(120 + T * 3); }, [T]);
    const jpg = await p.screenshot({type: 'jpeg', quality: 92, timeout: 180000});
    if (!ff.stdin.write(jpg)) await new Promise((r) => ff.stdin.once('drain', r));
    if (f % 30 === 0) console.log(`seg ${s} frame ${f}/${n}  ${((Date.now() - t0) / (f + 1) / 1000).toFixed(2)} s/frame`);
  }
  ff.stdin.end(); const code = await new Promise((r) => ff.on('close', r));
  if (code === 0) fs.renameSync(tmp, fin); console.log('done', fin, code);
}
console.log('errors:', errs.length ? errs.join(' | ') : 'none'); await b.close();
