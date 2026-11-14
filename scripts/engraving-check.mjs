// engraving-check.mjs: engraves every score as the app does (desktop page, phone page, single line), runs the app's own
// marking placement (src/score/declutter.ts, built to /home/claude/work/engrave/declutter.js with esbuild), and lists
// what is drawn on top of something else. SHOW=<bars> renders those bars with the collisions outlined. Then
// scripts/layout_fix.py moves the markings that still collide, and scripts/same_music.py proves no note changed.
// check.mjs: engraves each score as the app's page view does and reports what collides on the page.
// node check.mjs out.json score1.musicxml [score2 ...]
import createVerovioModule from '/home/claude/voices/node_modules/verovio/dist/verovio-module.mjs';
import { VerovioToolkit } from '/home/claude/voices/node_modules/verovio/dist/verovio.mjs';
import fs from 'node:fs';
import { chromium } from 'playwright';
const [, , outFile, ...files0] = process.argv; const SHOW = process.env.SHOW; const files = files0;
const VerovioModule = await createVerovioModule();
const tk = new VerovioToolkit(VerovioModule);
const b = await chromium.launch(); let page = await b.newPage({ viewport: { width: 2400, height: 1200 } });
const results = {};
const DECLUTTER = fs.readFileSync('/home/claude/work/engrave/declutter.js', 'utf8');
const LAYOUTS = process.env.SHOW ? [{ name: 'desk', o: { breaks: 'auto', pageWidth: Number(process.env.W || 2600) } }] : [{ name: 'desk', o: { breaks: 'auto', pageWidth: 2600 } }, { name: 'phone', o: { breaks: 'auto', pageWidth: 950 } }, { name: 'line', o: { breaks: 'none', pageWidth: 100000, adjustPageWidth: true } }];
for (const f of files) {
  const id = f.split('/').slice(-2)[0]; const all = [];
  try {
  for (const L of LAYOUTS) {
  tk.setOptions({ ...L.o, scale: 40, pageHeight: 60000, adjustPageHeight: true, svgAdditionalAttribute: ['staff@n'], header: 'none', footer: 'none', font: 'Leipzig', systemDivider: 'none', lyricSize: 4.2, lyricTopMinMargin: 3, lyricWordSpace: 2.4, mnumInterval: 1 });
  tk.loadData(fs.readFileSync(f, 'utf8')); if (SHOW) { tk.select({ measureRange: SHOW }); tk.redoLayout(); }
  const n = tk.getPageCount(); const found = [];
  for (let p = 1; p <= n; p++) {
    let svg = tk.renderToSVG(p);
    svg = svg.replace(/<g id="([^"]+)" class="(dir|tempo)"/g, (all, gid, cls) => { let st = ''; try { st = String(tk.getElementAttr(gid).staff || '').split(' ')[0]; } catch {} return st ? `<g id="${gid}" class="${cls}" data-staff="${st}"` : all; });
    await page.setContent(`<body style="margin:0;position:relative">${svg}</body>`); if (SHOW) await page.evaluate(() => { window.__show = true; });
    await page.addScriptTag({ content: DECLUTTER }); await page.evaluate(() => DC.declutterMarks(document));
    found.push(...await page.evaluate(() => {
      const R = (el) => { const r = el.getBoundingClientRect(); return { x0: r.left, y0: r.top, x1: r.right, y1: r.bottom }; };
      const shrink = (r, d) => ({ x0: r.x0 + d, y0: r.y0 + d, x1: r.x1 - d, y1: r.y1 - d });
      const hit = (a, b) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1 && a.x1 > a.x0 && b.x1 > b.x0;
      const meas = (el) => { const m = el.closest('g.measure'); return m ? m.id : null; };
      const sysOf = (el) => el.closest('g.system');
      const grab = (sel) => [...document.querySelectorAll(sel)].map((el) => ({ el, r: R(el), sys: sysOf(el), m: meas(el) })).filter((o) => o.r.x1 - o.r.x0 > 0.5);
      const heads = grab('g.notehead'); const rests = grab('g.rest');
      // a syllable is its letters: the elision mark's glyph box is far taller than what it draws
      const syls = [...document.querySelectorAll('g.syl')].map((el) => { const t = [...el.querySelectorAll('tspan.text')].filter((x) => x.textContent.trim()); if (!t.length) return null; const rs = t.map(R); const r = { x0: Math.min(...rs.map((q) => q.x0)), y0: Math.min(...rs.map((q) => q.y0)), x1: Math.max(...rs.map((q) => q.x1)), y1: Math.max(...rs.map((q) => q.y1)) }; return { el, r, sys: sysOf(el), m: meas(el) }; }).filter(Boolean);
      const tight = (el) => { const parts = [...el.querySelectorAll('tspan')].filter((t) => !t.querySelector('tspan') && t.textContent.trim()); if (!parts.length) return R(el); const rs = parts.map((t) => { const r = R(t); const glyph = /Leipzig|Bravura/.test(t.getAttribute('font-family') || t.closest('[font-family]')?.getAttribute('font-family') || '') && /[\ue000-\uf8ff]/.test(t.textContent); if (!glyph) return r; const h = r.y1 - r.y0; return { x0: r.x0, x1: r.x1, y0: r.y0 + h * 0.3, y1: r.y1 - h * 0.45 }; }); return { x0: Math.min(...rs.map((q) => q.x0)), y0: Math.min(...rs.map((q) => q.y0)), x1: Math.max(...rs.map((q) => q.x1)), y1: Math.max(...rs.map((q) => q.y1)) }; };
      const texts = [...document.querySelectorAll('g.dynam, g.dir, g.tempo')].map((el) => ({ el, r: tight(el), sys: sysOf(el), m: meas(el) })).filter((o) => o.r.x1 - o.r.x0 > 0.5);
      const accids = grab('g.accid'); const artics = grab('g.artic'); const hairpins = grab('g.hairpin');
      const out = [];
      const add = (kind, a, b) => out.push({ kind, m: a.m || b.m, a: a.el.id, b: b.el.id, ta: a.el.textContent.trim().slice(0, 40), tb: b.el.textContent.trim().slice(0, 40), ca: a.el.getAttribute('class'), cb: b.el.getAttribute('class') });
      const pairs = (A, B, kind, d, ok = () => true) => { for (const a of A) for (const b of B) if (a !== b && a.sys === b.sys && ok(a, b) && hit(shrink(a.r, d), shrink(b.r, d))) add(kind, a, b); };
      const sameNote = (a, b) => { const na = a.el.closest('g.chord') || a.el.closest('g.note'); const nb = b.el.closest('g.chord') || b.el.closest('g.note'); return na && na === nb; };
      pairs(rests, heads, 'rest-on-note', 1.5);
      pairs(syls, syls, 'lyrics-overlap', 1, (a, b) => a.el.id < b.el.id);
      pairs(texts, texts, 'text-on-text', 1, (a, b) => a.el.id < b.el.id);
      pairs(texts, syls, 'text-on-lyrics', 1);
      pairs(texts, heads, 'text-on-note', 1.5);
      pairs(hairpins, syls, 'hairpin-on-lyrics', 1);
      pairs(hairpins, texts, 'hairpin-on-text', 1);
      pairs(accids, heads, 'accidental-on-note', 1.5, (a, b) => !sameNote(a, b));
      pairs(artics, heads, 'mark-on-note', 1.5, (a, b) => !sameNote(a, b));
      // slurs and ties: points along the curve inside a notehead that is not at either end of the curve
      for (const s of [...grab('g.slur'), ...grab('g.tie')]) {
        const path = s.el.querySelector('path'); if (!path) continue;
        const L = path.getTotalLength(); const pts = []; const ctm = path.getScreenCTM();
        for (let i = 2; i <= 38; i++) { const q = path.getPointAtLength((L * i) / 40); pts.push({ x: ctm.a * q.x + ctm.c * q.y + ctm.e, y: ctm.b * q.x + ctm.d * q.y + ctm.f }); }
        const ends = [pts[0], pts[pts.length - 1]];
        for (const h of heads) {
          if (h.sys !== s.sys) continue;
          const r = shrink(h.r, 1.5);
          if (ends.some((e) => Math.abs(e.x - (h.r.x0 + h.r.x1) / 2) < 3 * (h.r.x1 - h.r.x0))) continue;
          if (pts.some((q) => q.x > r.x0 && q.x < r.x1 && q.y > r.y0 && q.y < r.y1)) { add(s.el.classList.contains('tie') ? 'tie-through-note' : 'slur-through-note', s, h); break; }
        }
      }
      if (window.__show) for (const o of out) for (const id of [o.a, o.b]) { const el = document.getElementById(id); if (!el) continue; const r = el.getBoundingClientRect(); const d = document.createElement('div'); d.style.cssText = `position:absolute;left:${r.left-2}px;top:${r.top-2}px;width:${r.width+4}px;height:${r.height+4}px;border:2px solid red;`; document.body.appendChild(d); }
      return out;
    }));
    if (SHOW) await page.screenshot({ path: outFile.replace('.json', `-${p}.png`), fullPage: true });
  }
  const desc = (eid) => { try { const a = tk.getElementAttr(eid); return a; } catch { return {}; } };
  for (const c of found) { c.layout = L.name; try { c.bar = c.m ? tk.getElementAttr(c.m).n : null; } catch { c.bar = null; } c.A = desc(c.a); c.B = desc(c.b); }
  all.push(...found);
  }
  } catch (e) { console.error('FAILED', id, e.message); try { await page.close(); } catch {} page = await b.newPage({ viewport: { width: 2400, height: 1200 } }); results[id] = null; continue; }
  results[id] = all;
  const by = {}; for (const c of all) by[c.kind] = (by[c.kind] || 0) + 1;
  console.log(id, JSON.stringify(by));
}
fs.writeFileSync(outFile, JSON.stringify(results));
await b.close();
