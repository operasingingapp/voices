/**
 * Performance timeline.
 *
 * Turns the notated score (measures in written order, with repeats and tempo marks) into the
 * sequence actually performed, applies a production's cuts, and provides the single mapping
 * between musical time (quarters on the performance timeline, "perfQ") and clock time.
 *
 * Everything that needs to know "where are we" — audio scheduling, the visual cursor, the
 * shared rehearsal marker, loops and the language panel — goes through this one model.
 */
import type { CompiledEdition, LoopRange, MeasureInfo, MusicalPos, NoteInfo } from "./types";
import { applyPedal } from "./pedal";

export interface PerfMeasure {
  p: number; // index in the performance sequence
  m: number; // notated measure idx
  occ: number; // 1-based occurrence of this notated measure in the (cut) performance
  pass: number; // repeat pass (1 = first time through)
  startQ: number; // start on the performance timeline (quarters)
  durQ: number;
}

export interface PerfNote {
  key: string; // stable within a performance: `${firstNoteId}@${p}`
  ids: string[]; // notated note ids sounding in this event (several when tied)
  part: string;
  midi: number;
  vel: number;
  onQ: number;
  offQ: number; // where the key is released (the written length)
  /** where the sound stops, when the sustain pedal holds it beyond the key release (piano parts) */
  soundOffQ?: number;
  p: number; // perf measure of the onset
}

export interface TempoSeg {
  q: number;
  bpm: number;
  sec: number; // clock seconds at q (tempo factor 1)
}

export interface Located {
  p: number;
  m: number;
  occ: number;
  q: number; // quarters into the measure
  beat: number; // 1-based beat (fractional), in the measure's beat unit
  number: string; // printed measure number
}

export interface CutLike {
  startM: number;
  endM: number;
}

/** Unfold repeats (with first/second endings) into the written-order measure sequence performed. */
export function unfoldRepeats(measures: MeasureInfo[]): { m: number; pass: number }[] {
  const out: { m: number; pass: number }[] = [];
  let i = 0;
  let repeatStart = 0;
  let pass = 1;
  let jumped = false;
  const taken = new Map<number, number>();
  let guard = 0;
  while (i < measures.length) {
    if (++guard > 20000) throw new Error("repeat structure does not terminate");
    const mi = measures[i];
    if (mi.repeatStart && !jumped) {
      repeatStart = i;
      pass = 1;
    }
    jumped = false;
    const endingStart = mi.endings?.find((e) => e.type === "start");
    if (endingStart && !endingStart.numbers.includes(pass)) {
      // skip this ending up to (and including) the measure where it stops
      let j = i;
      while (j < measures.length && !measures[j].endings?.some((e) => e.type === "stop" || e.type === "discontinue")) j++;
      i = j + 1;
      continue;
    }
    out.push({ m: i, pass });
    if (mi.repeatEnd) {
      const times = mi.repeatEnd.times || 2;
      const t = taken.get(i) ?? 1;
      if (t < times) {
        taken.set(i, t + 1);
        pass = t + 1;
        i = repeatStart;
        jumped = true;
        continue;
      }
      taken.delete(i);
      pass = 1;
    }
    i++;
  }
  return out;
}

const EPS = 1e-6;

export class Performance {
  readonly edition: CompiledEdition;
  readonly measures: PerfMeasure[];
  readonly notes: PerfNote[];
  readonly tempo: TempoSeg[];
  readonly totalQ: number;
  readonly totalSec: number;
  readonly cutSet: Set<number>;
  readonly cuts: CutLike[];
  private byM = new Map<number, PerfMeasure[]>();

  /**
   * opts.warp: move the timing by `off` seconds at performance position `q` (straight lines between the points,
   * held before the first and after the last): to follow a recording that took its own time somewhere (a fermata,
   * a ritardando), so the piano plays with it.
   */
  constructor(edition: CompiledEdition, cuts: CutLike[] = [], opts: { tempo?: TempoMode; pedal?: boolean; warp?: { q: number; off: number }[] } = {}) {
    this.edition = edition;
    this.cuts = cuts;
    this.cutSet = new Set<number>();
    for (const c of cuts) for (let m = c.startM; m <= c.endM; m++) this.cutSet.add(m);

    const unfolded = unfoldRepeats(edition.measures);

    // Tempo is walked over the uncut performance so that a cut never changes the tempo
    // that is in force when playback resumes after it.
    let bpm = edition.measures[0]?.tempos.find((t) => t.q === 0)?.bpm ?? 100;
    const tempoAtStart: number[] = [];
    for (const u of unfolded) {
      const mi = edition.measures[u.m];
      const at0 = mi.tempos.find((t) => t.q === 0);
      if (at0) bpm = at0.bpm;
      tempoAtStart.push(bpm);
      for (const t of mi.tempos) if (t.q > 0) bpm = t.bpm;
    }

    const measures: PerfMeasure[] = [];
    const occCount = new Map<number, number>();
    const tempo: TempoSeg[] = [];
    const named: number[] = []; // where a tempo is written in words ("Andantino ingenuo") or the music begins
    const fermatas: { onQ: number; offQ: number }[] = [];
    let q = 0;
    unfolded.forEach((u, k) => {
      if (this.cutSet.has(u.m)) return;
      const mi = edition.measures[u.m];
      const occ = (occCount.get(u.m) ?? 0) + 1;
      occCount.set(u.m, occ);
      const pm: PerfMeasure = { p: measures.length, m: u.m, occ, pass: u.pass, startQ: q, durQ: mi.durQ };
      measures.push(pm);
      const list = this.byM.get(u.m) ?? [];
      list.push(pm);
      this.byM.set(u.m, list);
      pushTempo(tempo, q, tempoAtStart[k]);
      for (const t of mi.tempos) if (t.q > 0) pushTempo(tempo, q + t.q, t.bpm);
      if (measures.length === 1) named.push(q);
      for (const t of mi.tempos) if (t.text && !/^\s*\.\d+\s*$/.test(t.text)) named.push(q + t.q);
      // a new movement within the piece (recitative → aria → Allegro): a tempo written where the time signature
      // changes starts a section too, even as a bare number
      const prevM = k > 0 ? edition.measures[unfolded[k - 1].m] : undefined;
      if (prevM && mi.tempos.some((t) => t.q === 0) && (prevM.time[0] !== mi.time[0] || prevM.time[1] !== mi.time[1])) named.push(q);
      for (const n of edition.notes) if (n.m === u.m && n.fermata) fermatas.push({ onQ: q + n.q, offQ: q + n.q + n.dur });
      q += mi.durQ;
    });
    this.measures = measures;
    this.totalQ = q;
    const mode = opts.tempo ?? "score";
    if (mode !== "score") {
      const shaped = shapeTempo(tempo, mode, named, fermatas, q);
      tempo.length = 0;
      tempo.push(...shaped);
    }
    // seconds
    for (let i = 0; i < tempo.length; i++) {
      if (i === 0) tempo[i].sec = 0;
      else tempo[i].sec = tempo[i - 1].sec + ((tempo[i].q - tempo[i - 1].q) * 60) / tempo[i - 1].bpm;
    }
    this.tempo = tempo.length ? tempo : [{ q: 0, bpm: 100, sec: 0 }];
    if (opts.warp?.length) this.tempo = warpTempo(this.tempo, opts.warp, q);
    this.totalSec = this.qToSec(this.totalQ);
    this.notes = buildNotes(edition, measures);
    if (opts.pedal) applyPedal(edition, measures, this.notes, this.totalQ, (t) => beatInfo(t).unitQ);
  }

  qToSec(q: number): number {
    const t = this.tempo;
    let lo = 0;
    let hi = t.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (t[mid].q <= q + EPS) lo = mid;
      else hi = mid - 1;
    }
    return t[lo].sec + ((q - t[lo].q) * 60) / t[lo].bpm;
  }

  secToQ(s: number): number {
    const t = this.tempo;
    let lo = 0;
    let hi = t.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (t[mid].sec <= s + EPS) lo = mid;
      else hi = mid - 1;
    }
    return t[lo].q + ((s - t[lo].sec) * t[lo].bpm) / 60;
  }

  /** Instantaneous speed in quarters per second (tempo factor 1). */
  qPerSecAt(q: number): number {
    const t = this.tempo;
    let k = 0;
    for (let i = 0; i < t.length; i++) if (t[i].q <= q + EPS) k = i;
    return t[k].bpm / 60;
  }

  bpmAt(q: number): number {
    return this.qPerSecAt(q) * 60;
  }

  perfIndexAt(q: number): number {
    const ms = this.measures;
    if (!ms.length) return 0;
    let lo = 0;
    let hi = ms.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (ms[mid].startQ <= q + EPS) lo = mid;
      else hi = mid - 1;
    }
    return lo;
  }

  locate(q: number): Located {
    const pm = this.measures[this.perfIndexAt(Math.max(0, Math.min(q, this.totalQ - EPS)))];
    const mi = this.edition.measures[pm.m];
    const inQ = Math.max(0, Math.min(q - pm.startQ, pm.durQ));
    const { unitQ } = beatInfo(mi.time);
    return { p: pm.p, m: pm.m, occ: pm.occ, q: inQ, beat: 1 + inQ / unitQ, number: mi.number };
  }

  toPos(q: number, noteId?: string): MusicalPos {
    const l = this.locate(q);
    return { m: l.m, q: round(l.q), occ: l.occ, ...(noteId ? { noteId } : {}) };
  }

  occurrences(m: number): PerfMeasure[] {
    return this.byM.get(m) ?? [];
  }

  isCut(m: number): boolean {
    return this.cutSet.has(m);
  }

  /** Map a musical position to the performance timeline. Positions inside a cut resolve to the music after it. */
  toPerfQ(pos: MusicalPos): number {
    const occs = this.occurrences(pos.m);
    if (occs.length) {
      const pm = occs.find((o) => o.occ === (pos.occ ?? 1)) ?? occs[0];
      return pm.startQ + Math.max(0, Math.min(pos.q, pm.durQ));
    }
    // measure is cut (or unknown): first performed measure after it in written order
    const after = this.measures.find((pm) => pm.m > pos.m);
    return after ? after.startQ : this.totalQ;
  }

  loopToQ(loop: LoopRange | null): { startQ: number; endQ: number } | null {
    if (!loop) return null;
    const a = this.occurrences(loop.start.m).find((o) => o.occ === loop.start.occ) ?? this.occurrences(loop.start.m)[0];
    const b = this.occurrences(loop.end.m).find((o) => o.occ === loop.end.occ) ?? this.occurrences(loop.end.m).slice(-1)[0];
    if (!a || !b) return null;
    const startQ = a.startQ;
    const endQ = b.startQ + b.durQ;
    if (endQ <= startQ + EPS) return null;
    return { startQ, endQ };
  }

  /** Describe a position for people: "m. 12, beat 3 (2nd time)". */
  describe(q: number): string {
    const l = this.locate(q);
    const repeated = this.occurrences(l.m).length > 1;
    const beat = Math.round(l.beat * 100) / 100;
    return `m. ${l.number}, beat ${beat}${repeated ? ` (${ordinal(l.occ)} time)` : ""}`;
  }
}

/**
 * How tempo changes in the score file are played.
 * - "score": exactly as written in the file, including an arranger's bar-by-bar rubato as sudden steps.
 * - "smooth": the same rubato, but every change eases in over the half beat before it instead of jumping.
 * - "steady": a steady pulse for learning: the written tempo of each section, with only the gradual
 *   ritardandi / accelerandi that the file spells out step by step, fermatas held, and a gentle
 *   broadening into the last bar. Single, sudden changes (rubato) are left to the singer.
 */
export type TempoMode = "score" | "smooth" | "steady";

function shapeTempo(src: TempoSeg[], mode: TempoMode, named: number[], fermatas: { onQ: number; offQ: number }[], totalQ: number): TempoSeg[] {
  const pts = src.map((t) => ({ q: t.q, bpm: t.bpm }));
  const out: TempoSeg[] = [];
  const ramp = (q0: number, q1: number, b0: number, b1: number) => {
    const n = Math.max(1, Math.round((q1 - q0) / 0.0625));
    for (let i = 0; i < n; i++) pushTempo(out, q0 + ((q1 - q0) * i) / n, b0 + ((b1 - b0) * (i + 0.5)) / n);
  };
  if (mode === "smooth") {
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const prev = pts[i - 1];
      if (!prev) {
        pushTempo(out, p.q, p.bpm);
        continue;
      }
      // a held note (the tempo halves or more for a moment) stays a clean hold; other changes ease in
      const hold = p.bpm < prev.bpm * 0.55;
      const w = Math.min(0.5, (p.q - prev.q) / 2);
      if (hold || w < 0.06) pushTempo(out, p.q, p.bpm);
      else {
        ramp(p.q - w, p.q, prev.bpm, p.bpm);
        pushTempo(out, p.q, p.bpm);
      }
    }
    return out;
  }
  // steady: find the spelled-out ramps (three or more changes, half a quarter or less apart, all one way)
  const inRamp = new Array(pts.length).fill(false);
  for (let i = 1; i < pts.length; ) {
    let j = i;
    const dir = Math.sign(pts[i].bpm - pts[i - 1].bpm);
    while (j + 1 < pts.length && pts[j + 1].q - pts[j].q <= 0.5 + EPS && Math.sign(pts[j + 1].bpm - pts[j].bpm) === dir) j++;
    if (j - i >= 2) for (let k = i; k <= j; k++) inRamp[k] = true;
    i = j + 1;
  }
  const isNamed = (q: number) => named.some((n) => Math.abs(n - q) < EPS);
  // each section's steady tempo is the one written at its start ("Andantino ingenuo", ♪ = 100), not the
  // average of the arranger's rubato: an editor's many small holdings-back would otherwise drag the
  // whole section below its marked tempo
  const starts = [...new Set([0, ...named.filter((n) => n > EPS)])].sort((a, b) => a - b);
  const sectionBase = starts.map((s) => bpmIn(src, s));
  const baseAt = (q: number) => {
    let k = 0;
    starts.forEach((s, i) => s <= q + EPS && (k = i));
    return sectionBase[k];
  };
  let base = baseAt(0);
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    base = baseAt(p.q);
    if (inRamp[i]) {
      // ease into a ramp from the steady tempo rather than dropping into it: over half a beat for a small
      // change, over a whole dotted-quarter beat when the music slows (or speeds up) by more than a quarter
      const ease = Math.abs(p.bpm - base) > base * 0.25 ? 1.5 : 0.5;
      if (i > 0 && !inRamp[i - 1]) ramp(Math.max(pts[i - 1].q, p.q - ease), p.q, base, p.bpm);
      pushTempo(out, p.q, p.bpm);
    }
    else if (i > 0 && inRamp[i - 1]) pushTempo(out, p.q, base); // a ramp ends: back to the section's tempo
    else pushTempo(out, p.q, base);
  }
  // fermatas: the note is held about twice its written length
  // (a fermata over the voice and the piano together counts once, for its longest note)
  const held = new Map<number, number>();
  for (const f of fermatas) held.set(Math.round(f.onQ * 1e4), Math.max(held.get(Math.round(f.onQ * 1e4)) ?? 0, f.offQ));
  for (const [on4, offQ] of held) {
    const onQ = on4 / 1e4;
    const b = bpmIn(out, onQ);
    const after = bpmIn(out, offQ);
    pushTempoAt(out, onQ, b / 2);
    pushTempoAt(out, offQ, after);
  }
  // a gentle broadening through the last bar
  const lastBar = Math.max(0, totalQ - 3);
  const bEnd = bpmIn(out, lastBar);
  const tail = out.filter((t) => t.q < lastBar - EPS);
  out.length = 0;
  out.push(...tail);
  ramp(lastBar, totalQ, bEnd, bEnd * 0.7);
  return out;
}

function bpmIn(list: TempoSeg[], q: number): number {
  let b = list[0]?.bpm ?? 100;
  for (const t of list) if (t.q <= q + EPS) b = t.bpm;
  return b;
}

/** Insert a tempo point into a sorted list, keeping it sorted. */
/** the tempo list with its timing moved by warp (see the Performance constructor) */
function warpTempo(segs: TempoSeg[], warp: { q: number; off: number }[], totalQ: number): TempoSeg[] {
  const w = [...warp].sort((a, b) => a.q - b.q);
  const secOf = (q: number) => {
    let k = 0;
    for (let i = 0; i < segs.length; i++) if (segs[i].q <= q + EPS) k = i;
    return segs[k].sec + ((q - segs[k].q) * 60) / segs[k].bpm;
  };
  const offAt = (q: number) => {
    if (q <= w[0].q) return w[0].off;
    if (q >= w[w.length - 1].q) return w[w.length - 1].off;
    let k = 0;
    while (w[k + 1].q < q) k++;
    const a = w[k];
    const b = w[k + 1];
    return a.off + ((q - a.q) * (b.off - a.off)) / Math.max(EPS, b.q - a.q);
  };
  const qs = [...new Set([...segs.map((s) => s.q), ...w.map((x) => x.q).filter((x) => x > 0 && x < totalQ), totalQ])].sort((a, b) => a - b);
  const out: TempoSeg[] = [];
  for (let i = 0; i < qs.length - 1; i++) {
    const a = qs[i];
    const b = qs[i + 1];
    if (b - a < EPS) continue;
    const sa = secOf(a) + offAt(a);
    const sb = secOf(b) + offAt(b);
    // never backwards or frozen: at most eight times slower or faster than written
    const plain = secOf(b) - secOf(a);
    const dur = Math.min(plain * 8, Math.max(plain / 8, sb - sa));
    out.push({ q: a, bpm: ((b - a) * 60) / dur, sec: 0 });
  }
  for (let i = 0; i < out.length; i++) out[i].sec = i ? out[i - 1].sec + ((out[i].q - out[i - 1].q) * 60) / out[i - 1].bpm : 0;
  return out.length ? out : segs;
}

function pushTempoAt(list: TempoSeg[], q: number, bpm: number) {
  const i = list.findIndex((t) => t.q > q - EPS);
  if (i < 0) list.push({ q, bpm, sec: 0 });
  else if (Math.abs(list[i].q - q) < EPS) list[i].bpm = bpm;
  else list.splice(i, 0, { q, bpm, sec: 0 });
}

function pushTempo(list: TempoSeg[], q: number, bpm: number) {
  const last = list[list.length - 1];
  if (last && Math.abs(last.q - q) < EPS) {
    last.bpm = bpm;
    // a change at the same point replaces the previous one; drop it if now redundant
    const prev = list[list.length - 2];
    if (prev && prev.bpm === bpm) list.pop();
    return;
  }
  if (last && last.bpm === bpm) return;
  list.push({ q, bpm, sec: 0 });
}

/**
 * Build sounding note events on the performance timeline. Tied notes are merged only when the
 * tie continues into the measure that is actually performed next; a tie into a cut or across a
 * repeat jump is ended at the barline, so nothing can hang.
 */
function buildNotes(edition: CompiledEdition, measures: PerfMeasure[]): PerfNote[] {
  const byMeasure = new Map<number, NoteInfo[]>();
  for (const n of edition.notes) {
    const list = byMeasure.get(n.m) ?? [];
    list.push(n);
    byMeasure.set(n.m, list);
  }
  for (const list of byMeasure.values()) list.sort((a, b) => a.q - b.q);

  const out: PerfNote[] = [];
  let carry = new Map<string, PerfNote>(); // tie chains reaching the previous barline
  let prev: PerfMeasure | undefined;
  for (const pm of measures) {
    const contiguous = !!prev && prev.m === pm.m - 1 && Math.abs(prev.startQ + prev.durQ - pm.startQ) < EPS;
    const open = contiguous ? carry : new Map<string, PerfNote>();
    for (const n of byMeasure.get(pm.m) ?? []) {
      const onQ = pm.startQ + n.q;
      const offQ = onQ + n.dur;
      const k = `${n.part}|${n.staff}|${n.voice}|${n.midi}`;
      let ev: PerfNote | undefined;
      if (n.tieStop) {
        const chain = open.get(k) ?? findOpenAt(open, n, onQ);
        if (chain && Math.abs(chain.offQ - onQ) < EPS) {
          chain.offQ = offQ;
          chain.ids.push(n.id);
          ev = chain;
        }
      }
      if (!ev) {
        ev = { key: `${n.id}@${pm.p}`, ids: [n.id], part: n.part, midi: n.midi, vel: n.vel, onQ, offQ, p: pm.p };
        out.push(ev);
      }
      if (n.tieStart) open.set(k, ev);
      else open.delete(k);
    }
    // only ties that reach this barline may continue into the next performed measure
    const end = pm.startQ + pm.durQ;
    carry = new Map([...open].filter(([, ev]) => Math.abs(ev.offQ - end) < EPS));
    prev = pm;
  }
  out.sort((a, b) => a.onQ - b.onQ || a.midi - b.midi);
  return expandTremolos(edition, out);
}

/**
 * A tremolo is written as one or two long notes with strokes. Measured ones (one or two strokes) are played as
 * written; a real tremolo (three or more) as held notes touched again softly every half second or so.
 * Fingered (two-note) tremolos alternate the two pitches across both notes' time; single-note tremolos
 * repeat the note. The strokes give the note value (3 = demisemiquavers, an eighth of a quarter).
 * The repeats keep the written notes' ids, so the score still lights the notated notehead.
 */
function expandTremolos(edition: CompiledEdition, events: PerfNote[]): PerfNote[] {
  const info = new Map(edition.notes.map((n) => [n.id, n]));
  const trem = (ev: PerfNote) => info.get(ev.ids[0])?.tremolo;
  const trill = (ev: PerfNote) => info.get(ev.ids[0])?.trill;
  if (!events.some((e) => trem(e) || trill(e))) return events;
  const out: PerfNote[] = [];
  const used = new Set<PerfNote>();
  const repeat = (base: PerfNote, pitches: { midi: number; id: string }[], onQ: number, offQ: number, marks: number) => {
    if (marks >= 3) {
      // A real tremolo (three or more strokes) is the orchestra's strings, reduced for piano. Hammered out on
      // sampled keys it rattles, so it is played as a répétiteur plays it: the notes held together, and touched
      // again softly about every half second (on the beat or a division of it, so it keeps time), the later
      // touches lighter than the first.
      const qps = tempoNear(edition, base.ids[0]) / 60;
      const step = Math.max(0.25, Math.min(2, 2 ** Math.round(Math.log2(qps * 0.55))));
      let k = 0;
      for (let t = onQ; t < offQ - EPS; t += step, k++) {
        const end = Math.min(offQ, t + step);
        const vel = k === 0 ? base.vel * 0.8 : base.vel * (k % 2 ? 0.46 : 0.52);
        for (const p of pitches) out.push({ ...base, key: `${base.key}~${k}~${p.midi}`, ids: [p.id], midi: p.midi, vel: Math.max(1, Math.round(vel)), onQ: t, offQ: end });
      }
      return;
    }
    // one or two strokes are measured: eighths or sixteenths, as written, but light, with only the beat leaning a
    // little (a row of equal strikes on the same sampled key rattles)
    const step = 1 / 2 ** marks;
    let k = 0;
    for (let t = onQ; t < offQ - EPS; t += step, k++) {
      const p = pitches[k % pitches.length];
      const onBeat = Math.abs(t - Math.round(t)) < EPS;
      const vel = k === 0 ? base.vel * 0.85 : base.vel * (onBeat ? 0.66 : 0.54);
      out.push({ ...base, key: `${base.key}~${k}`, ids: [p.id], midi: p.midi, vel: Math.max(1, Math.round(vel)), onQ: t, offQ: Math.min(offQ, t + step) });
    }
  };
  for (const ev of events) {
    if (used.has(ev)) continue;
    const tr = trill(ev);
    if (tr && !trem(ev)) {
      // A trill, as Mozart's time played it: from the upper note, in sixteenths (thirty-seconds in a slow tempo),
      // settling on the written note for the last part of its length. Tied notes are one trill.
      const bpm = tempoNear(edition, ev.ids[0]);
      const step = bpm >= 90 ? 0.25 : 0.125;
      const len = ev.offQ - ev.onQ;
      const settle = Math.min(len / 4, 0.5);
      const pitches = [
        { midi: tr.upper, id: ev.ids[0] },
        { midi: ev.midi, id: ev.ids[0] },
      ];
      let k = 0;
      let t = ev.onQ;
      for (; t < ev.offQ - settle - step / 2; t += step, k++) {
        const p = pitches[k % 2];
        out.push({ ...ev, key: `${ev.key}~t${k}`, ids: [p.id], midi: p.midi, vel: Math.max(1, Math.round(ev.vel * (k === 0 ? 1 : 0.8))), onQ: t, offQ: t + step });
      }
      // end on the written note (after the upper one, so the alternation closes cleanly)
      out.push({ ...ev, key: `${ev.key}~t${k}`, vel: Math.max(1, Math.round(ev.vel * 0.85)), onQ: t, offQ: ev.offQ });
      continue;
    }
    const t = trem(ev);
    if (!t || t.type === "stop") {
      if (!t) out.push(ev);
      continue;
    }
    if (t.type === "single") {
      repeat(ev, [{ midi: ev.midi, id: ev.ids[0] }], ev.onQ, ev.offQ, t.marks);
      continue;
    }
    // start: its partner is the stop note in the same part that begins where this one ends
    const partner = events.find((o) => !used.has(o) && o !== ev && o.part === ev.part && trem(o)?.type === "stop" && Math.abs(o.onQ - ev.offQ) < EPS);
    if (!partner) {
      out.push(ev);
      continue;
    }
    used.add(partner);
    repeat(ev, [{ midi: ev.midi, id: ev.ids[0] }, { midi: partner.midi, id: partner.ids[0] }], ev.onQ, partner.offQ, t.marks);
  }
  // stop notes whose start was not found still sound as written
  for (const ev of events) if (trem(ev)?.type === "stop" && !used.has(ev) && !out.some((o) => o.ids[0] === ev.ids[0])) out.push(ev);
  out.sort((a, b) => a.onQ - b.onQ || a.midi - b.midi);
  return out;
}

/** The written tempo (bpm) in force at a note, from the edition's marks. */
function tempoNear(edition: CompiledEdition, noteId: string): number {
  const n = edition.notes.find((x) => x.id === noteId);
  let bpm = 100;
  if (!n) return bpm;
  for (let m = 0; m <= n.m; m++) for (const t of edition.measures[m].tempos) if (m < n.m || t.q <= n.q) bpm = t.bpm;
  return bpm;
}

function findOpenAt(open: Map<string, PerfNote>, n: NoteInfo, onQ: number): PerfNote | undefined {
  for (const [k, ev] of open) if (k.startsWith(`${n.part}|`) && ev.midi === n.midi && Math.abs(ev.offQ - onQ) < EPS) return ev;
  return undefined;
}

/** Felt beats of a bar: compound metres (6/8, 9/8, 12/8) count dotted quarters. */
export function beatInfo(time: [number, number]): { unitQ: number; beats: number } {
  const compound = time[1] === 8 && time[0] % 3 === 0 && time[0] > 3;
  return compound ? { unitQ: 1.5, beats: time[0] / 3 } : { unitQ: 4 / time[1], beats: time[0] };
}

export function round(x: number, d = 4): number {
  const f = 10 ** d;
  return Math.round(x * f) / f;
}

export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/** Notes sounding or starting in [q0, q1) for a set of parts — used for cue descriptions and tests. */
export function notesBetween(perf: Performance, q0: number, q1: number, parts?: Set<string>): PerfNote[] {
  return perf.notes.filter((n) => n.onQ < q1 - EPS && n.offQ > q0 + EPS && (!parts || parts.has(n.part)));
}
