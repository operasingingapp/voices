# frame_build.py PREFIX OUT.html "Title" "Opera line" "Role" "voice" : the karaoke frame as an HTML page (Chromium draws it)
import json, sys, re
import numpy as np
P, OUT, TITLE, OPERA, ROLE, VOICE = sys.argv[1:7]
d = json.load(open(f'{P}.json'))
sj = json.load(open(f'{P}-page.json'))
svg = open(f'{P}-page.svg').read().replace('>dri:gli<', '>dri: gli<')
qs = np.array([q for q, _ in d['qsec']]); ss = np.array([s for _, s in d['qsec']])
PM = float(re.search(r'class="page-margin" transform="translate\(([\d.]+)', svg).group(1)) / 10
notes = sorted([{'t': float(np.interp(q, qs, ss)), 'x': x / 10 + PM, 'id': i} for q, x, i in sj['pts']], key=lambda n: n['t'])


def clean(w):
    w = w.replace("'", '’'); w = re.sub(r':(?=\w)', ': ', w)
    w = re.sub(r'([,;:!?])\.{2,}$', r'\1', w)
    return re.sub(r'\.{2,}', '…', w).strip()


phrases = []
for p in d['phrases']:
    syl = [s for s in p['syl'] if s['t'] is not None]
    if not syl: continue
    words = [clean(w) for w in p['words']]
    per = [[] for _ in words]
    for i, s in enumerate(syl):
        nxt = syl[i + 1]['t'] if i + 1 < len(syl) else s['end']
        b = max(s['t'] + 0.12, min(s['end'], nxt) if nxt > s['t'] + 0.01 else s['end'])
        if 0 <= s['word'] < len(per): per[s['word']].append([s['t'], b, max(1, len(re.sub(r'[^\w]', '', s['text'])))])
    # split each word into its syllables' letters
    out = []
    for wi, w in enumerate(words):
        sy = per[wi]; parts = []; pos = 0
        for k, (a, b, c) in enumerate(sy):
            if k == len(sy) - 1: parts.append([w[pos:], a, b]); break
            n, j = 0, pos
            while j < len(w) and n < c:
                if re.match(r'\w', w[j]): n += 1
                j += 1
            parts.append([w[pos:j], a, b]); pos = j
        if not sy: parts = [[w, 1e9, 1e9]]
        out.append(parts)
    phrases.append({'words': out, 'start': syl[0]['t'], 'end': syl[-1]['end'], 'tr': p['translation']})

data = {'notes': notes, 'phrases': phrases, 'beats': d['beats'], 'dur': d['total'] + 2}
F = 'file:///home/claude/work/video/fonts/'
html = f'''<!doctype html><html><head><meta charset="utf-8"><style>
@font-face {{ font-family: Cormorant; font-weight: 600; src: url({F}cormorant-garamond-latin-600-normal.ttf); }}
@font-face {{ font-family: Cormorant; font-weight: 500; src: url({F}cormorant-garamond-latin-500-normal.ttf); }}
@font-face {{ font-family: Cormorant; font-weight: 500; font-style: italic; src: url({F}cormorant-garamond-latin-500-italic.ttf); }}
@font-face {{ font-family: 'Charis SIL'; src: url({F}CharisSIL-Regular.ttf); }}
@font-face {{ font-family: 'Charis SIL'; font-style: italic; src: url({F}CharisSIL-Italic.ttf); }}
@font-face {{ font-family: EBG; font-weight: 400; src: url({F}eb-garamond-latin-400-normal.woff2); }}
@font-face {{ font-family: EBG; font-weight: 500; src: url({F}eb-garamond-latin-500-normal.woff2); }}
@font-face {{ font-family: EBG; font-style: italic; src: url({F}eb-garamond-latin-400-italic.woff2); }}
@font-face {{ font-family: Jost; font-weight: 400; src: url({F}Jost-Regular.ttf); }}
@font-face {{ font-family: Jost; font-weight: 500; src: url({F}Jost-Medium.ttf); }}
:root {{ --ink: #151514; --grey: #8a8984; --faint: #b9b8b3; --green: #1f6b45; --desk: #efefee; }}
* {{ box-sizing: border-box; margin: 0; }}
html, body {{ width: 1920px; height: 1080px; overflow: hidden; background: var(--desk); color: var(--ink); }}
body {{ position: relative; font-family: 'Charis SIL', serif; -webkit-font-smoothing: antialiased; }}

/* one head, centred: the piece, then where it comes from and whose part it is */
.head {{ position: absolute; left: 72px; right: 72px; top: 58px; display: flex; align-items: baseline; justify-content: space-between; padding-bottom: 16px; }}
/* an engraver's rule under the head: a strong line and a fine one, the width of the sheet */
.head::after {{ content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 0; border-top: 1px solid var(--ink); }}
.title {{ font: 600 34px/1 Cormorant; letter-spacing: .006em; }}
.sub {{ font: 500 13px/1 Jost; letter-spacing: .32em; text-transform: uppercase; color: var(--grey); }}
.sub b {{ font-weight: 500; color: var(--green); }}

/* the part: a white sheet in the middle, two systems in view, moving on a system at a time */
.sheet {{ position: absolute; left: 72px; top: 148px; width: 1776px; height: 612px; background: #ffffff;
  box-shadow: 0 1px 1px rgba(0,0,0,.05), 0 6px 14px -6px rgba(0,0,0,.10), 0 40px 80px -44px rgba(0,0,0,.22); }}
.score {{ position: absolute; left: 48px; top: 40px; width: 1682px; height: 540px; overflow: hidden; }}
.score .roll {{ position: absolute; top: 0; left: 0; }}
.score svg {{ display: block; }}
.score svg g.verse text {{ font-family: EBG, serif; font-weight: 500; }}
.score svg g.dir text, .score svg g.tempo text, .score svg g.mNum text {{ font-family: EBG, serif; font-style: italic; font-weight: 400; }}
.score svg .definition-scale {{ color: #c3c2bd; fill: #c3c2bd; }}
.score svg g.staff > path, .score svg g.clef, .score svg g.keySig, .score svg g.meterSig, .score svg g.barLine, .score svg g.mNum, .score svg g.dir, .score svg g.tempo, .score svg g.dynam, .score svg g.hairpin {{ color: #74736e; fill: #74736e; }}
.score svg .past, .score svg .past * {{ color: var(--ink); fill: var(--ink); }}
.score svg .now, .score svg .now * {{ fill: var(--green) !important; color: var(--green) !important; }}
.score svg .now path, .score svg .now rect, .score svg .now polygon {{ stroke: var(--green) !important; }}
.folio {{ display: none; }}

/* the words, under the sheet */
.words {{ position: absolute; left: 160px; right: 160px; top: 800px; text-align: center; }}
.count {{ position: absolute; left: 0; right: 0; top: -22px; display: flex; gap: 16px; justify-content: center; }}
.count i {{ width: 8px; height: 8px; border-radius: 50%; background: #cfcec9; }}
.count .on {{ background: var(--ink); }}
.count .beat {{ background: var(--green); transform: scale(1.4); }}
.line {{ font: 600 72px/1.15 Cormorant; color: var(--faint); }}
.line .sung {{ color: var(--ink); }}
.line .now {{ color: var(--green); }}
.tr {{ margin-top: 14px; font: italic 500 34px/1.4 Cormorant; color: var(--grey); }}
.endc {{ position: absolute; left: 0; right: 0; top: 108px; bottom: 0; opacity: 0; }}
.ec-cap {{ position: absolute; left: 0; right: 0; top: 34px; text-align: center; font: italic 500 46px/1.1 Cormorant; color: var(--ink); }}
.ec-stage {{ position: absolute; left: 50%; top: 116px; width: 1024px; height: 768px; margin-left: -512px; }}
.sh {{ position: absolute; inset: 0; opacity: 0; }}
.sh img {{ display: block; width: 1024px; height: 768px; border-radius: 12px; border: 2px solid #1d1d1c; box-shadow: 0 1px 2px rgba(0,0,0,.06), 0 30px 70px -34px rgba(0,0,0,.32); }}
/* a fine green ring round the control that does it (positions in the 1366 x 1024 app, scaled to 1024 x 768) */
.ring {{ position: absolute; border: 3px solid var(--green); border-radius: 999px; transform: scale(.75); transform-origin: 0 0; box-shadow: 0 0 0 6px rgba(31,107,69,.12); margin: -6px; }}
.ec-dots {{ position: absolute; left: 0; right: 0; top: 912px; display: flex; gap: 12px; justify-content: center; }}
.ec-dots i {{ width: 7px; height: 7px; border-radius: 50%; background: #cfcec9; }}
.ec-dots i.on {{ background: var(--green); }}
.ec-final {{ position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 22px; padding-bottom: 108px; }}
.ec-tag {{ font: italic 500 34px/1.3 Cormorant; color: var(--grey); }}
.ec-logo {{ font: italic 500 96px/1 Cormorant; }}
.ec-link {{ font: 500 14px/1 Jost; letter-spacing: .3em; text-transform: uppercase; color: var(--green); }}
.intro {{ position: absolute; inset: 0; z-index: 5; display: flex; flex-direction: column; align-items: center; justify-content: center; background: var(--desk); }}
.intro .logo {{ font: italic 500 68px/1 Cormorant; color: var(--ink); letter-spacing: .01em; }}
.intro .tag {{ margin-top: 22px; font: 500 13px/1 Jost; letter-spacing: .34em; text-transform: uppercase; color: var(--grey); }}
.coach {{ position: absolute; left: 0; right: 0; text-align: center; opacity: 0; }}
.coach .ck {{ font: 500 13px/1 Jost; letter-spacing: .32em; text-transform: uppercase; color: var(--green); }}
.coach .ct {{ margin-top: 18px; font: italic 500 46px/1.2 Cormorant; color: var(--ink); }}
.coach .ct b {{ font-style: normal; font-weight: 600; }}
.coach .cs {{ margin-top: 16px; font: 400 18px/1.4 Jost; color: var(--grey); }}
.tip {{ position: absolute; z-index: 3; display: flex; align-items: center; gap: 14px; padding: 10px 22px 10px 10px; border-radius: 999px; background: var(--green); color: #fff; white-space: nowrap; opacity: 0;
  box-shadow: 0 10px 30px -10px rgba(20,60,40,.55); transform-origin: 50% 100%; }}
.tip::after {{ content: ''; position: absolute; left: var(--px, 50%); bottom: -9px; margin-left: -9px; border: 9px solid transparent; border-bottom: 0; border-top-color: var(--green); }}
.tip .tb {{ padding: 7px 12px; border-radius: 999px; background: rgba(255,255,255,.16); font: 500 12px/1 Jost; letter-spacing: .22em; text-transform: uppercase; }}
.tip .tt {{ font: 400 21px/1 Jost; }}
.tip .tt b {{ font: italic 600 27px/1 Cormorant; letter-spacing: .01em; margin-right: 2px; }}
.tip .tm {{ font: 500 12px/1 Jost; letter-spacing: .22em; text-transform: uppercase; color: rgba(255,255,255,.7); padding-left: 14px; border-left: 1px solid rgba(255,255,255,.3); }}
.mark {{ position: absolute; right: 72px; bottom: 40px; font: italic 500 24px/1 Cormorant; color: #9d9c97; }}
</style></head><body>
<div class="head"><div class="title">{TITLE}</div><div class="sub">{OPERA} &nbsp;·&nbsp; <b>{ROLE}, {VOICE}</b></div></div>
<div class="sheet"><div class="tip" data-at="6.21" data-from="3.6" data-to="10.5"><span class="tb">Tip</span><span class="tt"><b>gelida</b> · [ˈdʒɛ.li.da] · open e, as in “bet”</span><span class="tm">more in Sottovoce</span></div>
<div class="tip" data-at="58.48" data-from="53.0" data-to="60.6"><span class="tb">Highest note</span><span class="tt">B♭, held · Struggling? Loop this phrase, slower</span><span class="tm">in the Sottovoce app</span></div>
<div class="tip" data-at="157.74" data-from="153.4" data-to="161.5"><span class="tb">IPA</span><span class="tt"><b>gli</b> · [ʎ], like the “lli” in “million”</span><span class="tm">every word in Sottovoce</span></div>
<div class="score"><div class="roll">{svg}</div></div><div class="folio"></div></div>
<div class="words"><div class="count"></div><div class="line"><div></div></div><div class="tr"></div></div>
<div class="mark">Sottovoce</div>

<div class="endc"><div class="ec-final"><div class="ec-logo">Sottovoce</div><div class="ec-tag">Practise this aria at any tempo, line by line</div><div class="ec-link">Link in the description</div></div></div>
<div class="intro"><div class="logo">Sottovoce</div><div class="tag">Learn every role, line by line</div></div>
<script>
const D = {json.dumps(data)};
const PLAY = 0;
const roll = document.querySelector('.roll');
const byId = (id) => document.getElementById(id);
let lastNow = null, lastPh = -1;
function xAt(t) {{
  const n = D.notes; if (t <= n[0].t) return n[0].x - (n[0].t - t) * 120;
  for (let i = 1; i < n.length; i++) if (n[i].t >= t) {{ const a = n[i-1], b = n[i]; return a.x + (b.x - a.x) * (t - a.t) / Math.max(1e-3, b.t - a.t); }}
  return n[n.length-1].x + (t - n[n.length-1].t) * 60;
}}
const fmt = (s) => Math.floor(s/60) + ':' + String(Math.floor(s%60)).padStart(2,'0');
// words above the staff that Verovio set side by side over each other (dolciss. / molto rall.): the later one goes up a line
document.querySelectorAll('g.system').forEach((sys) => {{
  // hairpins stay where they are; words and dynamics give way to them
  const placed = [...sys.querySelectorAll('g.hairpin')].map((g) => g.getBoundingClientRect()).map((r) => ({{ left: r.left, right: r.right, top: r.top, bottom: r.bottom }}));
  const items = [...sys.querySelectorAll('g.dir, g.tempo, g.dynam')].map((g) => ({{ g, r: g.getBoundingClientRect() }})).sort((a, b) => a.r.left - b.r.left);
  for (const it of items) {{
    let dy = 0, r = it.r;
    for (let k = 0; k < 4; k++) {{
      const hit = placed.find((p) => r.left < p.right + 6 && r.right > p.left - 6 && r.top < p.bottom + 2 && r.bottom > p.top - 2);
      if (!hit) break;
      const up = r.bottom - hit.top + 3; dy -= up;
      r = {{ left: r.left, right: r.right, top: r.top - up, bottom: r.bottom - up }};
    }}
    if (dy) it.g.setAttribute('transform', `translate(0, ${{dy * (1 / (it.g.getScreenCTM()?.d || 1))}})`);
    placed.push(r);
  }}
}});
// each note's system, each system's top, and when the page moves on to it
const SYS = {{}}, TOP = [], SWITCH = [];
const svgEl = roll.querySelector('svg'), base = svgEl.getBoundingClientRect().top;
document.querySelectorAll('g.system').forEach((g, i) => {{
  TOP.push(Math.max(0, g.getBoundingClientRect().top - base - 14));
  g.querySelectorAll('g.note').forEach((n) => (SYS[n.id] = i));
}});
// the sheet is as tall as the tallest pair of systems; each pair sits centred in it; the words go under it
const HT = [...document.querySelectorAll('g.system')].map((g) => g.getBoundingClientRect().height);
const PAIR = TOP.map((t, i) => (i + 1 < TOP.length ? TOP[i + 1] + HT[i + 1] : TOP[i] + HT[i]) - t + 34);
const HMAX = Math.max(...PAIR);
{{
  const sh = document.querySelector('.sheet'), top = 150;
  sh.style.top = top + 'px'; sh.style.height = (HMAX + 84) + 'px';
  const sb = top + HMAX + 84; document.querySelector('.words').style.top = Math.round(sb + (1080 - 70 - sb) / 2 - 64) + 'px';
}}
for (const n of D.notes) {{ const k = SYS[n.id]; if (k !== undefined && SWITCH[k] === undefined) SWITCH[k] = n.t - 0.6; }}
// each slur / tie / tuplet mark: the time of the first note at or after its left edge, in its system
const ARCS = [];
{{
  const nx = D.notes.map((n) => {{ const el = byId(n.id); return el ? {{ t: n.t, k: SYS[n.id], x: el.getBoundingClientRect().left }} : null; }}).filter(Boolean);
  document.querySelectorAll('.score g.slur, .score g.tie, .score g.tupletNum, .score g.tupletBracket, .score g.tuplet > g.tupletNum').forEach((g) => {{
    const sys = g.closest('g.system'), k = [...document.querySelectorAll('g.system')].indexOf(sys), x = g.getBoundingClientRect().left;
    const first = nx.filter((n) => n.k === k && n.x >= x - 14).sort((a, b) => a.x - b.x)[0];
    if (first) ARCS.push([g, first.t]);
  }});
}}
window.setTime = function (t) {{

  // the close: after the last sung line the page gives way to the app
  {{ const e0 = D.phrases[D.phrases.length - 1].end + 1.2, cl2 = (x) => Math.min(1, Math.max(0, x));
    const out = cl2((t - e0) / 0.8), inn = cl2((t - e0 - 0.6) / 1.0);
    for (const sel of ['.sheet', '.words', '.mark']) document.querySelector(sel).style.opacity = 1 - out;
        const ec2 = document.querySelector('.endc'); ec2.style.opacity = inn; ec2.style.transform = `translateY(${{(1 - inn) * 10}}px)`; }}
  // the opening: the name alone, rising softly, then the page appears under it as the piano begins
  const it = document.querySelector('.intro'), lo = it.querySelector('.logo'), tg = it.querySelector('.tag');
  const cl = (x) => Math.min(1, Math.max(0, x));
  const fin = cl((t - 0.15) / 0.9), gone = cl((t - 1.9) / 0.5), fout = cl((t - 2.4) / 0.8);
  it.style.opacity = 1 - fout; it.style.display = fout >= 1 ? 'none' : 'flex';
  lo.style.opacity = fin * (1 - gone); lo.style.transform = `translateY(${{(1 - fin) * 10}}px)`; tg.style.opacity = cl((t - 0.6) / 0.9) * (1 - gone);
  // which system: the one holding the next note (a little ahead), sliding up when the voice reaches the next one
  let k = 0;
  for (const n of D.notes) {{ if (n.t <= t + 0.6) k = SYS[n.id] ?? k; else break; }}
  const sw = SWITCH[k] ?? 0, from = k > 0 ? TOP[k - 1] : TOP[0];
  const e = Math.min(1, Math.max(0, (t - sw) / 0.7)), ease = e < .5 ? 2*e*e : 1 - Math.pow(-2*e + 2, 2) / 2;
  roll.style.transform = `translateY(${{-Math.round(from + (TOP[k] - from) * ease)}}px)`;
  document.querySelector('.folio').textContent = '';
  const k3 = Math.min(TOP.length - 1, k + 3), cur = from + (TOP[k] - from) * ease;
  const ph2 = PAIR[k], sc = document.querySelector('.score');
  sc.style.height = ph2 + 'px'; sc.style.top = (42 + (HMAX - ph2) / 2) + 'px';
  // the note being sung
  let now = null;
  for (const n of D.notes) {{ if (n.t <= t + 0.02) now = n; else break; }}
  const ph = D.phrases.findIndex((p) => p.end + 0.35 > t);
  const singing = ph >= 0 && t >= D.phrases[ph].start - 0.05 && t <= D.phrases[ph].end + 0.1;
  if (lastNow) byId(lastNow)?.classList.remove('now');
  lastNow = singing && now ? now.id : null;
  if (lastNow) byId(lastNow)?.classList.add('now');
  // the part fills in as it is sung: notes still to come are pale, sung ones ink, the one being sung green
  for (const n of D.notes) {{ const el = byId(n.id); if (el) el.classList.toggle('past', n.t <= t + 0.02); }}
  for (const [g, at] of ARCS) g.classList.toggle('past', at <= t + 0.02);
  document.querySelectorAll('.score g.beam').forEach((b) => {{ const f = b.querySelector('g.note'); b.classList.toggle('past', !!(f && f.classList.contains('past'))); }});
  const first = D.phrases[0].start;
  const w = document.querySelector('.words');
  if (ph < 0 || t < first - 2.4) {{ document.querySelector('.line > div').innerHTML = ''; document.querySelector('.tr').textContent = ''; document.querySelector('.count').innerHTML = ''; }}
  else {{
    const p = D.phrases[ph];
    document.querySelector('.line > div').innerHTML = p.words.map((parts) => parts.map(([s, a, b]) => `<span class="${{t >= a ? (t < b ? 'now' : 'sung') : ''}}" style="--p:${{t >= a && t < b ? ((t - a) / (b - a)).toFixed(3) : 0}}">${{s}}</span>`).join('')).join(' ');
    document.querySelector('.tr').textContent = p.tr || '';
    // count-in before an entrance after a rest
    const gap = ph > 0 ? D.phrases[ph-1].end : 0, c = document.querySelector('.count');
    const bs = D.beats.filter((b) => b < p.start - 0.05).slice(-4);
    if (p.start - gap > 2.5 && t < p.start && bs.length && t > bs[0] - 0.7)
      c.innerHTML = bs.map((b, k) => `<i class="${{t >= b ? ((k + 1 === bs.length || t < bs[k+1]) ? 'beat' : 'on') : ''}}"></i>`).join('');
    else c.innerHTML = '';
  }}

  // the tips: green pills over the score, each pointing at its word, while it is sung and just before
  document.querySelectorAll('.tip').forEach((tip) => {{
    const T0 = +tip.dataset.from, T1 = +tip.dataset.to, at = +tip.dataset.at, c4 = (x) => Math.min(1, Math.max(0, x));
    const a = c4((t - T0) / 0.35) * (1 - c4((t - T1) / 0.4)); tip.style.opacity = a; if (a <= 0) return;
    const tn = D.notes.find((n) => Math.abs(n.t - at) < 0.06), el = tn && byId(tn.id), sh = document.querySelector('.sheet').getBoundingClientRect();
    if (!el) return; const r = el.getBoundingClientRect(), w = tip.offsetWidth;
    const x = Math.min(sh.width - w - 24, Math.max(24, r.left + r.width / 2 - sh.left - w / 2));
    const st = el.closest('g.staff')?.querySelector(':scope > path')?.getBoundingClientRect() || r;
    let top = Math.min(r.top, st.top); const sys = el.closest('g.system');
    sys.querySelectorAll('g.dir, g.tempo, g.dynam, g.hairpin, g.fermata, g.tupletNum, g.slur, g.artic').forEach((m) => {{ const b = m.getBoundingClientRect();
      if (b.right > sh.left + x - 6 && b.left < sh.left + x + w + 6 && b.bottom > top - 90 && b.top < top + 4) top = Math.min(top, b.top); }});
    tip.style.left = x + 'px'; tip.style.top = (top - sh.top - tip.offsetHeight - 16) + 'px';
    tip.style.setProperty('--px', (r.left + r.width / 2 - sh.left - x) + 'px');
    const pop = c4((t - T0) / 0.35); tip.style.transform = `scale(${{0.9 + 0.1 * (1 - Math.pow(1 - pop, 3))}})`;
  }});
}};
</script></body></html>'''
open(OUT, 'w').write(html)
print('ok', len(notes), 'notes', len(phrases), 'phrases')
