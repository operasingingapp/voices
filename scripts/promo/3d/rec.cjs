// Records the app on a phone screen with the DevTools screencast: every painted frame with its time, and marks
// where each moment of the promo starts.   node rec.cjs <out dir>
const { chromium } = require('playwright'); const fs = require('fs'), http = require('http'), path = require('path');
const O = process.argv[2];
const ROOT = '/home/claude/work/serve-pub';
const TY = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.mp4': 'audio/mp4', '.json': 'application/json', '.woff2': 'font/woff2', '.woff': 'font/woff', '.svg': 'image/svg+xml', '.wasm': 'application/wasm', '.png': 'image/png', '.jpg': 'image/jpeg' };
const srv = http.createServer((q, a) => {
  let u = decodeURIComponent(q.url.split('?')[0]); if (u.endsWith('/')) u += 'index.html';
  const f = path.join(ROOT, u);
  fs.readFile(f, (e, d) => { if (e) { a.writeHead(404); a.end(); return; } a.writeHead(200, { 'content-type': TY[path.extname(f)] || 'application/octet-stream' }); a.end(d); });
}).listen(8765);
(async () => {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const ctx = await b.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(2500);
  await p.getByText('Skip').first().click(); await p.waitForTimeout(1500);
  await p.locator('button:visible').filter({ hasText: /^Songs$/ }).first().click(); await p.waitForTimeout(2000);
  const cdp = await ctx.newCDPSession(p);
  const frames = [], marks = [];
  cdp.on('Page.screencastFrame', async (f) => { frames.push({ t: f.metadata.timestamp, d: f.data }); await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {}); });
  const mark = async (n) => { marks.push([n, Date.now() / 1000]); console.log('mark', n); };
  const wait = (ms) => p.waitForTimeout(ms);
  const taps = [];
  const tap = async (loc) => { const bx = await loc.boundingBox(); taps.push([Date.now() / 1000, bx.x + bx.width / 2, bx.y + bx.height / 2]); await wait(220); await loc.click(); };
  const smoothScroll = (dy, ms) => p.evaluate(([dy, ms]) => new Promise((ok) => {
    const el = [...document.querySelectorAll('main, .screen-body, *')].find((e) => e.scrollHeight > e.clientHeight + 50 && /(auto|scroll)/.test(getComputedStyle(e).overflowY)) || document.scrollingElement;
    const y0 = el.scrollTop, t0 = performance.now();
    const step = (t) => { const k = Math.min(1, (t - t0) / ms), e = k < .5 ? 4 * k ** 3 : 1 - (-2 * k + 2) ** 3 / 2; el.scrollTop = y0 + dy * e; if (k < 1) requestAnimationFrame(step); else ok(); };
    requestAnimationFrame(step); }), [dy, ms]);
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: 860, maxHeight: 1864, everyNthFrame: 1 });
  // 1. find your song: tap Schubert's face
  await wait(800); await mark('find');
  await wait(1200);
  await tap(p.locator('button:visible').filter({ hasText: /^Schubert$/ }).first());
  await wait(1400); await smoothScroll(260, 1100); await wait(700);
  // 2. know the song: open Heidenröslein, read down its page
  await tap(p.locator('.sg-home').getByText('Heidenröslein').first()); await wait(300); await mark('page');
  await wait(1500); await smoothScroll(700, 2400); await wait(800);
  // 3. every word: the practice with IPA on; tap Röslein, hear it
  await p.getByText('Practise this song').click(); await wait(3500);
  const nn = p.getByText('Not now'); if (await nn.count()) await nn.first().click();
  await p.locator('[aria-label="Show under the words: IPA, English, pronunciation tips"]').first().click(); await wait(500);
  await p.getByText('IPA', { exact: true }).first().click(); await wait(400); await p.keyboard.press('Escape'); await wait(800);
  await mark('words');
  await wait(1300);
  await tap(p.locator('[aria-label="Röslein: show meaning"]').first()); await wait(1500);
  await tap(p.getByText('Hear the word').first()); await wait(1600);
  await p.keyboard.press('Escape'); await wait(600);
  // 4. sing it with the piano
  await mark('sing');
  await wait(400); await tap(p.locator('[aria-label="Play"]:visible').first());
  await wait(7000); await mark('end');
  await cdp.send('Page.stopScreencast');
  fs.mkdirSync(O + '/f', { recursive: true });
  const idx = frames.map((f, i) => { fs.writeFileSync(`${O}/f/${String(i).padStart(5, '0')}.jpg`, Buffer.from(f.d, 'base64')); return [i, f.t]; });
  fs.writeFileSync(O + '/index.json', JSON.stringify({ frames: idx, marks, taps }));
  console.log('frames', frames.length);
  await b.close(); srv.close();
})();
