// collide.cjs : open a piece in the app (Page view), find overlapping marks in the engraved score
const { chromium } = require('playwright');
(async () => {
  const list = JSON.parse(require('fs').readFileSync('/home/claude/work/video/pieces.json', 'utf8'));
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  await p.goto('http://localhost:8799/');
  const all = [];
  for (const it of list) {
  try {
  await p.evaluate((it) => { localStorage.setItem('cp:onboarded','true'); localStorage.setItem('cp:tourSeen','true'); localStorage.setItem('cp:guide3','1'); localStorage.setItem('p:layout', 'page');
    localStorage.setItem('cp:myRoles', JSON.stringify([{opera: it.opera, character: it.character}]));
    localStorage.setItem('cp:place', JSON.stringify({screen:'piece',opera: it.opera,character: it.character,piece: it.piece})); }, it);
  await p.reload(); await p.waitForTimeout(3500);
  const pg = p.getByRole('button', { name: 'Page' }).first(); if (await pg.getAttribute('aria-pressed') !== 'true') { await pg.click(); }
  await p.waitForTimeout(2500);
  const res = await p.evaluate(() => {
    const cls = { syl: 'g.syl', dir: 'g.dir', dynam: 'g.dynam', tempo: 'g.tempo', tuplet: 'g.tupletNum', mnum: 'g.mNum', artic: 'g.artic', accid: 'g.accid', head: 'g.notehead', fermata: 'g.fermata', hairpin: 'g.hairpin', slur: 'g.slur' };
    const items = [];
    for (const [k, sel] of Object.entries(cls)) document.querySelectorAll('.p-stage ' + sel + ', .score-sheet ' + sel).forEach((el) => { const r = el.getBoundingClientRect(); if (r.width && r.height) items.push({ k, r, el }); });
    const hit = (a, b, pad) => a.left < b.right - pad && a.right > b.left + pad && a.top < b.bottom - pad && a.bottom > b.top + pad;
    const pairs = { 'syl-syl': 1, 'syl-dir': 1, 'syl-tuplet': 1, 'syl-head': 1, 'syl-accid': 1, 'dir-dir': 1, 'dir-dynam': 1, 'dir-tempo': 1, 'tempo-dynam': 1, 'dir-head': 1, 'dynam-head': 1, 'mnum-dir': 1, 'mnum-tempo': 1, 'tuplet-head': 1, 'tuplet-artic': 1, 'dynam-hairpin': 1, 'dir-hairpin': 1, 'fermata-dir': 1, 'slur-syl': 1 };
    const out = [];
    for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
      const a = items[i], c = items[j]; const key = [a.k, c.k].sort().join('-'), k2 = a.k + '-' + c.k, k3 = c.k + '-' + a.k;
      if (!(pairs[k2] || pairs[k3])) continue;
      if (a.el.contains(c.el) || c.el.contains(a.el)) continue;
      if (hit(a.r, c.r, 1.5)) { const m = a.el.closest('g.measure') || c.el.closest('g.measure');
        const bar = [...document.querySelectorAll('.p-stage g.measure, .score-sheet g.measure')].indexOf(m) + 1;
        out.push({ kinds: key, bar, a: (a.el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 24), b: (c.el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 24) }); }
    }
    return { out, title: document.querySelector('.p-title h1')?.textContent, n: items.length };
  });
  all.push({ ...it, title: res.title, marks: res.n, hits: res.out }); console.log(it.id, res.title, res.n, res.out.length);
  } catch (e) { console.log('ERR', it.id, e.message.slice(0, 80)); all.push({ ...it, error: true }); }
  }
  require('fs').writeFileSync('/home/claude/work/video/audit.json', JSON.stringify(all));
  await b.close();
})();
