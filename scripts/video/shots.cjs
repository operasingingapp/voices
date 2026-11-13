const { chromium } = require('playwright');
(async () => {
  const ts = process.argv[2].split(',').map(Number);
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  await p.goto('file:///home/claude/work/video/frame.html'); await p.evaluate(() => document.fonts.ready);
  for (const t of ts) { await p.evaluate((t) => window.setTime(t), t); await p.screenshot({ path: `/home/claude/work/video/h_${t}.png` }); }
  await b.close();
})();
