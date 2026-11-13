/**
 * Expressive velocities, worked out once at import (light shaping, the strength the user chose by ear in Pianoteq).
 *
 * The printed marks: dynamics as levels (p … ff), hairpins and cresc./dim. as gradual ramps to the next level, sf/fp/accents
 * as accents on one note; a mark printed on one piano staff also governs the other (marks between the staves).
 * The piano's touch on top: the top of a right-hand chord sings and inner notes recede, the bass is felt, a low octave
 * doubling is lightened, a little weight on the downbeat, repeated chords even and light, a slur's last note relaxes (the
 * Mozart "sigh"), the piano yields under the voice and comes forward a little alone, and breathes with the sung phrases.
 * Sung lines get the printed dynamics at half range (the balance in the engine keeps them above the piano).
 * Tremolos are softened by the timeline (shared/timeline.ts); the tempo is never touched.
 * A part with no printed level marks keeps the velocities its <sound dynamics> gave it.
 */
import type { Element } from "@xmldom/xmldom";
import type { MeasureInfo, NoteInfo } from "../shared/types";

const S = 0.6; // shaping strength: light
const LEVEL: Record<string, number> = { ppp: 26, pp: 34, p: 46, mp: 57, mf: 67, f: 78, ff: 88, fff: 96 };
// accent size, and the level that follows (fp: loud then soft)
const ACC: Record<string, [number, string | null]> = {
  sf: [12, null], sfz: [12, null], fz: [12, null], rf: [9, null], rfz: [9, null], sffz: [15, null], accent: [7, null],
  fp: [0, "p"], sfp: [10, "p"], fpp: [0, "pp"], sfpp: [10, "pp"],
};
type Kind = "piano" | "voice" | "chorus" | string;
interface Mark { part: string; staff: number; aq: number; kind: "dyn" | "wedge" | "word"; val: string }

const kids = (el: Element, name?: string): Element[] =>
  Array.from(el.childNodes as unknown as ArrayLike<Element>).filter((n) => n.nodeType === 1 && (!name || n.nodeName === name));
const kid = (el: Element, name: string) => kids(el, name)[0];
const txt = (el?: Element) => (el?.textContent ?? "").trim();

/** the marks, at absolute positions in quarters */
function readMarks(root: Element, measures: MeasureInfo[]) {
  const marks: Mark[] = [];
  const slurs = new Map<string, { start: boolean; stop: boolean }>(); // xmlPart|staff|m|q|midi
  const STEP: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  for (const part of kids(root, "part")) {
    const pid = part.getAttribute("id")!;
    let div = 1;
    kids(part, "measure").forEach((meas, mi) => {
      let pos = 0, lastOn = 0;
      const base = measures[mi]?.startQ ?? 0;
      for (const el of kids(meas)) {
        const t = el.nodeName;
        if (t === "attributes") { const d = kid(el, "divisions"); if (d) div = Number(txt(d)); }
        else if (t === "backup") pos -= Number(txt(kid(el, "duration")));
        else if (t === "forward") pos += Number(txt(kid(el, "duration")));
        else if (t === "direction") {
          const st = Number(txt(kid(el, "staff")) || 1);
          const aq = base + (pos + Number(txt(kid(el, "offset")) || 0)) / div;
          for (const dt of kids(el, "direction-type")) {
            const dy = kid(dt, "dynamics");
            const first = dy && kids(dy)[0];
            if (first) marks.push({ part: pid, staff: st, aq, kind: "dyn", val: first.nodeName });
            const w = kid(dt, "wedge");
            if (w) marks.push({ part: pid, staff: st, aq, kind: "wedge", val: w.getAttribute("type") ?? "" });
            const wd = txt(kid(dt, "words")).toLowerCase();
            if (wd.startsWith("cresc")) marks.push({ part: pid, staff: st, aq, kind: "word", val: "cresc" });
            else if (/^(dim|decresc|calando|smorz|mancando)/.test(wd)) marks.push({ part: pid, staff: st, aq, kind: "word", val: "dim" });
          }
        } else if (t === "note") {
          const chord = !!kid(el, "chord");
          const on = chord ? lastOn : pos;
          const st = Number(txt(kid(el, "staff")) || 1);
          const p = kid(el, "pitch");
          const nots = kids(el, "notations");
          if (p && nots.length) {
            const midi = (Number(txt(kid(p, "octave"))) + 1) * 12 + STEP[txt(kid(p, "step"))] + Math.round(Number(txt(kid(p, "alter")) || 0));
            const types = nots.flatMap((n) => kids(n, "slur")).map((s) => s.getAttribute("type"));
            if (types.includes("start") || types.includes("stop"))
              slurs.set(`${pid}|${st}|${mi}|${(on / div).toFixed(3)}|${midi}`, { start: types.includes("start"), stop: types.includes("stop") });
            const aq = base + on / div;
            if (nots.flatMap((n) => kids(n, "articulations")).some((a) => kid(a, "accent") || kid(a, "strong-accent")))
              marks.push({ part: pid, staff: st, aq, kind: "dyn", val: "accent" });
            const nd = nots.map((n) => kid(n, "dynamics")).find(Boolean);
            const f = nd && kids(nd)[0];
            if (f) marks.push({ part: pid, staff: st, aq, kind: "dyn", val: f.nodeName });
          }
          if (!chord && !kid(el, "grace")) { lastOn = pos; pos += Number(txt(kid(el, "duration")) || 0); }
        }
      }
    });
  }
  return { marks, slurs };
}

interface Curve { lv: { q: number; v: number }[]; ramps: { a: number; b: number; d: number }[]; acc: Map<string, number>; printed: boolean }
function buildCurve(ds: Mark[]): Curve {
  ds = [...ds].sort((x, y) => x.aq - y.aq);
  const lv = [{ q: -1, v: LEVEL.mf }];
  const acc = new Map<string, number>();
  let printed = false;
  for (const d of ds) {
    if (d.kind !== "dyn") continue;
    if (LEVEL[d.val]) { lv.push({ q: d.aq, v: LEVEL[d.val] }); printed = true; }
    else if (ACC[d.val]) {
      const [size, after] = ACC[d.val];
      if (after) { acc.set(d.aq.toFixed(3), d.val.startsWith("fp") ? LEVEL.f - LEVEL[after] : size); lv.push({ q: d.aq + 0.01, v: LEVEL[after] }); printed = true; }
      else acc.set(d.aq.toFixed(3), size);
    }
  }
  const levelAt = (q: number) => lv.reduce((v, x) => (x.q <= q + 1e-6 ? x.v : v), lv[0].v);
  const nextLevel = (q: number) => lv.find((x) => x.q > q + 1e-6);
  const ramps: Curve["ramps"] = [];
  const wedges = ds.filter((d) => d.kind === "wedge");
  wedges.forEach((w, i) => {
    if (w.val !== "crescendo" && w.val !== "diminuendo") return;
    const stop = wedges.slice(i + 1).find((x) => x.val === "stop");
    const b = stop ? stop.aq : w.aq + 4;
    const nx = nextLevel(w.aq), cur = levelAt(w.aq);
    let d = w.val === "crescendo" ? 10 : -10;
    if (nx && nx.q <= b + 4 && Math.sign(nx.v - cur) === Math.sign(d)) d = nx.v - cur;
    ramps.push({ a: w.aq, b: Math.max(b, w.aq + 0.5), d });
  });
  for (const w of ds.filter((d) => d.kind === "word")) {
    const nx = nextLevel(w.aq), cur = levelAt(w.aq), sgn = w.val === "cresc" ? 1 : -1;
    if (nx && nx.q - w.aq <= 16 && Math.sign(nx.v - cur) === sgn) ramps.push({ a: w.aq, b: nx.q, d: nx.v - cur });
    else ramps.push({ a: w.aq, b: w.aq + 8, d: 10 * sgn });
  }
  return { lv, ramps, acc, printed };
}
function curveAt(c: Curve, q: number): number {
  let v = c.lv.reduce((v, x) => (x.q <= q + 1e-6 ? x.v : v), c.lv[0].v);
  for (const r of c.ramps) {
    const nextLv = c.lv.find((l) => l.q > r.a + 1e-6);
    const reachesLevel = !!nextLv && nextLv.q <= r.b + 1e-6;
    if (q >= r.a && q <= r.b + 1e-6) { if (!(reachesLevel && q >= nextLv!.q - 1e-6)) v += (r.d * (q - r.a)) / (r.b - r.a); }
    else if (q > r.b && !reachesLevel && (!nextLv || q < nextLv.q)) v += r.d; // an open cresc. holds until the next level
  }
  return v + (c.acc.get(q.toFixed(3)) ?? 0);
}

export function shapeVelocities(root: Element, measures: MeasureInfo[], notes: NoteInfo[], parts: { key: string; kind: Kind; source: { xmlPartId: string; staves?: number[] } }[]) {
  if (!notes.length || !measures.length) return;
  const { marks, slurs } = readMarks(root, measures);
  const kindOf = new Map(parts.map((p) => [p.key, p.kind]));
  const isPianoXml = (xp: string, st: number) => parts.find((p) => p.source.xmlPartId === xp && (!p.source.staves || p.source.staves.includes(st)))?.kind === "piano";
  // marks per (xml part, staff); piano staves share marks printed on only one of them
  const by = new Map<string, Mark[]>();
  const k = (xp: string, st: number) => `${xp}|${isPianoXml(xp, st) ? st : 0}`;
  for (const m of marks) (by.get(k(m.part, m.staff)) ?? by.set(k(m.part, m.staff), []).get(k(m.part, m.staff))!).push(m);
  for (const xp of new Set(parts.filter((p) => p.kind === "piano").map((p) => p.source.xmlPartId))) {
    const a = by.get(`${xp}|1`) ?? [], b = by.get(`${xp}|2`) ?? [];
    const near = (arr: Mark[], d: Mark) => arr.some((x) => x.kind === d.kind && Math.abs(x.aq - d.aq) < 1.01);
    const shared = (d: Mark) => d.kind !== "dyn" || !!LEVEL[d.val] || !!ACC[d.val]?.[1];
    by.set(`${xp}|2`, [...b, ...a.filter((d) => shared(d) && !near(b, d))]);
    by.set(`${xp}|1`, [...a, ...b.filter((d) => shared(d) && !near(a, d))]);
  }
  const curves = new Map<string, Curve>();
  const curve = (xp: string, st: number) => { const key = k(xp, st); if (!curves.has(key)) curves.set(key, buildCurve(by.get(key) ?? [])); return curves.get(key)!; };
  const absQ = (n: NoteInfo) => measures[n.m].startQ + n.q;

  // sung phrases: runs of vocal notes with less than an eighth's rest between them
  const vn = notes.filter((n) => kindOf.get(n.part) === "voice" || kindOf.get(n.part) === "chorus").map((n) => ({ a: absQ(n), b: absQ(n) + n.dur })).sort((x, y) => x.a - y.a);
  const phrases: { a: number; b: number }[] = [];
  for (const n of vn) { const l = phrases[phrases.length - 1]; if (l && n.a - l.b < 0.5) l.b = Math.max(l.b, n.b); else phrases.push({ ...n }); }
  const inPhrase = (q: number) => phrases.find((p) => q >= p.a - 0.01 && q < p.b);
  const arc = (q: number) => {
    const p = inPhrase(q); if (!p || p.b - p.a < 2) return 0;
    const x = (q - p.a) / (p.b - p.a), pk = 0.6;
    return x < pk ? Math.sin(((x / pk) * Math.PI) / 2) : Math.cos((((x - pk) / (1 - pk)) * Math.PI) / 2);
  };
  const beatWeight = (n: NoteInfo) => {
    const m = measures[n.m]; const [num, den] = m.time;
    const bq = (4 / den) * (den === 8 && num % 3 === 0 ? 3 : 1);
    if (Math.abs(n.q) < 1e-3) return 4;
    const b = n.q / bq;
    if (Math.abs(b - Math.round(b)) < 1e-3) return Math.round(m.durQ / bq) === 4 && Math.round(b) === 2 ? 2 : 0;
    return -3;
  };

  // piano: chords per staff at each onset
  const groups = new Map<string, NoteInfo[]>();
  for (const n of notes) if (kindOf.get(n.part) === "piano" && !n.tieStop) {
    const key = `${n.part}|${n.staff}|${absQ(n).toFixed(4)}`;
    (groups.get(key) ?? groups.set(key, []).get(key)!).push(n);
  }
  const prevSet = new Map<string, string>();
  const ordered = [...groups.values()].sort((a, b) => absQ(a[0]) - absQ(b[0]));
  for (const g of ordered) {
    g.sort((a, b) => a.midi - b.midi);
    const st = g[0].staff, q = absQ(g[0]);
    const c = curve(g[0].xmlPart, st);
    const sk = `${g[0].part}|${st}`, set = g.map((n) => n.midi).join(",");
    const repeated = prevSet.get(sk) === set; prevSet.set(sk, set);
    const sing = !!inPhrase(q);
    g.forEach((n, i) => {
      // printed levels when the part has them, else the level its <sound dynamics> gave (plus any accent)
      let v = c.printed ? curveAt(c, q) : n.vel + (c.acc.get(q.toFixed(3)) ?? 0);
      if (st === 1 || g.length === 1) v += i === g.length - 1 ? (g.length > 1 ? 5 : 1) : -6;
      else v += i === 0 ? 1 : -5;
      if (st !== 1 && i === 0 && g.length > 1 && g[1].midi - n.midi === 12) v -= 3;
      const bw = beatWeight(n);
      v += bw * 0.8 * S;
      if (repeated && bw < 4) v -= 3 * S;
      v += (phrases.length ? (sing ? -4 : 2) : 0) * S + arc(q) * 5 * S;
      const s = slurs.get(`${n.xmlPart}|${n.staff}|${n.m}|${n.q.toFixed(3)}|${n.midi}`);
      if (s?.start && !s.stop) v += 2 * S;
      if (s?.stop && !s.start) v -= 5 * S;
      n.vel = Math.max(14, Math.min(112, Math.round(v)));
    });
  }
  // sung lines: printed dynamics at half range, a breath of phrase shape
  for (const n of notes) {
    const kd = kindOf.get(n.part);
    if (kd !== "voice" && kd !== "chorus") continue;
    const c = curve(n.xmlPart, n.staff);
    if (!c.printed) continue;
    const q = absQ(n);
    n.vel = Math.max(30, Math.min(110, Math.round(72 + (curveAt(c, q) - LEVEL.mf) * 0.5 + arc(q) * 3 * S)));
  }
}
