// node render.cjs W H out.mp4 [stills: 30,90,...]
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const fs = require('fs'); const http = require('http'); const path = require('path');
const [W, H, OUT, STILLS] = [+process.argv[2], +process.argv[3], process.argv[4], process.argv[5]];
const ids = fs.readdirSync('faces').map((f) => f.slice(9, -10)).sort();
let s = 7; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647); for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.webp': 'image/webp', '.woff': 'font/woff', '.wasm': 'application/wasm' };
const srv = http.createServer((q, a) => { const f = path.join(__dirname, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { a.writeHead(404); a.end(); return; } a.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); a.end(d); }); }).listen(0);
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  p.on('console', (m) => console.log('page:', m.text())); p.on('pageerror', (e) => console.log('err:', e.message));
  await p.goto(`http://localhost:${srv.address().port}/index.html?w=${W}&h=${H}&ids=${encodeURIComponent(JSON.stringify(ids))}`);
  await p.waitForFunction(() => window.ready === true, null, { timeout: 120000 });
  const stills = STILLS ? STILLS.split(',').map(Number) : null;
  const N = stills ? Math.max(...stills) + 1 : 16 * 30;
  let ff;
  if (!stills) ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', OUT + '.tmp.mp4'], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let f = 0; f < N; f++) {
    const buf = Buffer.from(await p.evaluate(() => window.renderFrame()), 'base64');
    if (stills) { if (stills.includes(f)) fs.writeFileSync(`${OUT}-${f}.jpg`, buf); }
    else if (!ff.stdin.write(buf)) await new Promise((ok) => ff.stdin.once('drain', ok));
    if (f % 60 === 0) console.log('frame', f, ((Date.now() - t0) / 1000).toFixed(0) + 's');
  }
  if (ff) { ff.stdin.end(); await new Promise((ok) => ff.on('close', ok)); fs.renameSync(OUT + '.tmp.mp4', OUT); }
  await b.close(); srv.close();
})();
