/**
 * A sung line recorded once (a singer, or a singing synthesiser, rendered from the score) played in time with the
 * piano.
 *
 * Every sung note's onset in the recording is known (scripts/voice/align.py). For a tempo, the recording is laid
 * onto the app's timeline: wherever it already keeps the app's time (a render keeps the score's time exactly, but
 * for fermatas and the like) it is copied sample for sample, untouched; only where it really runs ahead or behind
 * is that stretch lengthened or shortened, with the pitch kept (WSOLA: overlapping slices, each nudged to where it
 * continues the last one most smoothly). The measured onsets scatter a few tens of ms around the true ones, so an
 * offset counts only when the notes around it agree on it. All channels are kept, at the device's rate.
 */

export interface RecordingMap {
  /** the onsets, in order: where each sits on the app's timeline (seconds at tempo 1) and in the recording */
  perf: number[];
  audio: number[];
  /** where each note ends on the app's timeline (seconds at tempo 1), to place cuts in rests */
  ends?: number[];
}

import { ChunkedRecording, type ChunkedSpec } from "./chunkedAudio";

/** how far the recording may drift from the beat before the next stretch is moved back onto it */
const DRIFT = 0.06;
const pause = () => new Promise<void>((r) => setTimeout(r, 0));

/**
 * Runs of notes that keep one offset between the recording and the app's time (d: recording minus app time, per
 * note, in order): each note's offset is cleaned first (the median of it and its two neighbours on each side, so
 * one misplaced onset does not count), and a run lasts while the cleaned offsets stay within DRIFT of its first.
 * Each run's offset is the median of its notes'.
 */
export function offsetRuns(d: number[], x?: number[]): { from: number; to: number; off: number }[] {
  const n = d.length;
  const med = d.map((_, i) => {
    const xs = d.slice(Math.max(0, i - 2), Math.min(n, i + 3)).sort((x, y) => x - y);
    return xs[xs.length >> 1];
  });
  const runs: { from: number; to: number; off: number }[] = [];
  let i = 0;
  while (i < n) {
    let j = i + 1;
    while (j < n && Math.abs(med[j] - med[i]) <= DRIFT) j++;
    const xs = d.slice(i, j).sort((x, y) => x - y);
    runs.push({ from: i, to: j - 1, off: xs[xs.length >> 1] });
    i = j;
  }
  if (!x) return runs;
  // a run whose offset would make the stretch from the last one run backwards or race (a trill or a run of fast
  // notes the analysis could not place) is not a drift: it joins the run before
  const kept: typeof runs = [];
  for (const r of runs) {
    const prev = kept[kept.length - 1];
    if (prev) {
      const dx = x[r.from] - x[prev.to];
      const ratio = (dx + r.off - prev.off) / Math.max(1e-6, dx);
      if (!(ratio > 0.1 && ratio < 10)) {
        prev.to = r.to;
        continue;
      }
    }
    kept.push({ ...r });
  }
  return kept;
}

/**
 * The recording's samples as far as they have arrived: a whole file decoded at once, or a chunked recording
 * growing from wherever playback needs it.
 */
export interface LineSource {
  readonly rate: number;
  readonly length: number;
  readonly chans: Float32Array[];
  /** all channels mixed (for finding where slices join) */
  readonly mono: Float32Array;
  /** the first sample at or after `from` not yet in place (length: all of it) */
  availEnd(from: number): number;
  onProgress(cb: () => void): () => void;
  /** playback needs the recording around sample s */
  want(s: number): void;
  dispose(): void;
}

class WholeSource implements LineSource {
  readonly rate: number;
  readonly length: number;
  readonly chans: Float32Array[];
  readonly mono: Float32Array;
  constructor(b: AudioBuffer) {
    this.rate = b.sampleRate;
    this.length = b.length;
    this.chans = Array.from({ length: b.numberOfChannels }, (_, c) => b.getChannelData(c));
    if (this.chans.length === 1) this.mono = this.chans[0];
    else {
      const m = new Float32Array(b.length);
      for (const d of this.chans) for (let i = 0; i < m.length; i++) m[i] += d[i] / this.chans.length;
      this.mono = m;
    }
  }
  availEnd() {
    return this.length;
  }
  onProgress() {
    return () => undefined;
  }
  want() {}
  dispose() {}
}

class ChunkSource implements LineSource {
  readonly rec: ChunkedRecording;
  constructor(spec: ChunkedSpec) {
    this.rec = new ChunkedRecording(spec);
  }
  get rate() {
    return this.rec.spec.rate;
  }
  get length() {
    return this.rec.spec.samples;
  }
  get chans() {
    return this.rec.stitcher.chans;
  }
  get mono() {
    return this.rec.stitcher.mono;
  }
  availEnd(from: number) {
    return this.rec.stitcher.availEnd(from);
  }
  onProgress(cb: () => void) {
    return this.rec.onProgress(cb);
  }
  want(s: number) {
    this.rec.want(s);
  }
  dispose() {
    this.rec.dispose();
  }
}

const SLICE = 0.016; // half a slice, seconds: slices of 32 ms
const SEEK_S = 0.006; // half a period of the lowest voices

/**
 * The recording laid onto the app's timeline at one tempo, built as its samples arrive: slice by slice (WSOLA,
 * as described above) from wherever playback is, on to the end, then from the start. An output sample is final
 * once both slices that overlap it are in (finalEnd); playback plays only final samples.
 */
export class TimedLine {
  readonly f: number;
  readonly rate: number;
  /** output length (samples at this tempo) */
  readonly length: number;
  readonly ys: Float32Array[];
  private src: LineSource;
  private oA: number[];
  private aA: number[];
  private N: number;
  private HOP: number;
  private SEEK: number;
  private WIN: Float32Array;
  private frames: number;
  private built: Uint8Array;
  private ps: Int32Array;
  private focusK = 0;
  private listeners = new Set<() => void>();
  private stopped = false;
  private wake: (() => void) | null = null;
  private unsub: () => void;

  constructor(src: LineSource, anchors: { out: number[]; aud: number[] }, f: number) {
    this.src = src;
    this.f = f;
    this.rate = src.rate;
    const RATE = src.rate;
    this.N = 2 * Math.round(SLICE * RATE);
    this.HOP = this.N / 2;
    this.SEEK = Math.round(SEEK_S * RATE);
    this.WIN = new Float32Array(this.N);
    for (let i = 0; i < this.N; i++) this.WIN[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / this.N);
    this.oA = anchors.out;
    this.aA = anchors.aud;
    const na = this.oA.length;
    // the app-time length the recording covers (what follows the last onset keeps its own pace)
    this.length = na
      ? Math.ceil((this.oA[na - 1] + (src.length / RATE - this.aA[na - 1])) * RATE + this.N)
      : src.length + this.N;
    this.ys = src.chans.map(() => new Float32Array(this.length));
    this.frames = Math.max(0, Math.floor((this.length - this.N) / this.HOP));
    this.built = new Uint8Array(this.frames);
    this.ps = new Int32Array(this.frames);
    this.unsub = src.onProgress(() => this.wake?.());
    void this.run();
  }

  /** recording seconds at app seconds o (at this tempo) */
  audAt(o: number) {
    const { oA, aA } = this;
    const na = oA.length;
    if (!na) return o;
    if (o <= oA[0]) return aA[0] + (o - oA[0]);
    if (o >= oA[na - 1]) return aA[na - 1] + (o - oA[na - 1]);
    let lo = 0;
    let hi = na - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (oA[mid] <= o) lo = mid;
      else hi = mid;
    }
    return aA[lo] + ((o - oA[lo]) * (aA[hi] - aA[lo])) / (oA[hi] - oA[lo]);
  }

  get complete() {
    return this.built.indexOf(0) < 0;
  }

  /** playback is at output sample s: build from there, and load what it needs first */
  focus(s: number) {
    this.focusK = Math.max(0, Math.min(this.frames, Math.floor(s / this.HOP) - 1));
    this.src.want(Math.max(0, Math.round(this.audAt(s / this.rate) * this.rate)));
    this.wake?.();
  }

  /** the first output sample at or after `from` that is not final yet (length: all final) */
  finalEnd(from: number): number {
    from = Math.max(0, Math.floor(from));
    if (from >= this.length) return this.length;
    const kk = Math.min(this.frames, Math.floor(from / this.HOP));
    if (kk > 0 && !this.built[kk - 1]) return from;
    const u = kk >= this.frames ? -1 : this.built.indexOf(0, kk);
    return u < 0 ? this.length : Math.max(from, u * this.HOP);
  }

  /** resolves once [from, from + ahead) is final (or the rest of it, near the end) */
  whenFinal(from: number, ahead: number): Promise<void> {
    const want = Math.min(this.length, from + ahead);
    if (this.finalEnd(from) >= want) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const off = this.onProgress(() => {
        if (this.stopped) (off(), reject(new Error("superseded")));
        else if (this.finalEnd(from) >= want) (off(), resolve());
      });
    });
  }

  onProgress(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  get alive() {
    return !this.stopped;
  }

  stop() {
    this.stopped = true;
    this.unsub();
    this.wake?.();
    for (const l of [...this.listeners]) l();
    this.listeners.clear();
  }

  private pAt(k: number) {
    return Math.round(this.audAt((k * this.HOP + this.N / 2) / this.rate) * this.rate - this.N / 2);
  }

  /** are the recording's samples frame k reads in place? */
  private canBuild(k: number) {
    const { N, HOP, SEEK } = this;
    const len = this.src.length;
    const need = (a: number, b: number) => {
      a = Math.max(0, a);
      b = Math.min(len, b);
      return b <= a || this.src.availEnd(a) >= b;
    };
    const p = this.pAt(k);
    if (!need(p - SEEK - HOP, p + N + SEEK + HOP)) return false;
    if (k > 0 && this.built[k - 1]) {
      const nat = this.ps[k - 1] + HOP;
      if (!need(nat, nat + HOP)) return false;
    }
    return true;
  }

  private buildFrame(k: number) {
    const { N, HOP, SEEK, WIN } = this;
    const x = this.src.mono;
    const chans = this.src.chans;
    const ys = this.ys;
    const o = k * HOP;
    let p = this.pAt(k);
    const prev = k > 0 && this.built[k - 1] ? this.ps[k - 1] : -1;
    const maxStart = this.src.length - N - 1;
    if (prev >= 0) {
      const nat = prev + HOP;
      if (Math.abs(nat - p) <= 1) p = nat;
      else if (nat >= 0 && nat + HOP < this.src.length) {
        let best = p;
        let bestC = -Infinity;
        const lo = Math.max(0, p - SEEK);
        const hi = Math.min(maxStart, p + SEEK);
        for (let c = lo; c <= hi; c += 2) {
          let acc = 0;
          for (let i = 0; i < HOP; i += 4) acc += x[c + i] * x[nat + i];
          if (acc > bestC) {
            bestC = acc;
            best = c;
          }
        }
        p = best;
      }
    }
    if (p >= 0 && p <= maxStart)
      for (let c = 0; c < chans.length; c++) {
        const xc = chans[c];
        const yc = ys[c];
        for (let i = 0; i < N; i++) yc[o + i] += xc[p + i] * WIN[i];
      }
    this.ps[k] = p;
    this.built[k] = 1;
  }

  private async run() {
    while (!this.stopped) {
      let k = this.built.indexOf(0, this.focusK);
      if (k < 0) k = this.built.indexOf(0);
      if (k < 0) break;
      let did = 0;
      while (k < this.frames && !this.built[k] && did < 512 && this.canBuild(k)) {
        this.buildFrame(k++);
        did++;
      }
      if (did) {
        for (const l of [...this.listeners]) l();
        await pause();
        continue;
      }
      // what playback needs next has not arrived: wait for it (or for playback to move)
      await new Promise<void>((r) => (this.wake = r));
      this.wake = null;
    }
    this.unsub();
    for (const l of [...this.listeners]) l();
  }
}

export class RecordedLine {
  readonly source: LineSource;
  /** the tempo factor it was rendered at */
  readonly tempo: number;
  private map: RecordingMap;
  private cur: TimedLine | null = null;

  private constructor(source: LineSource, map: RecordingMap, tempo: number) {
    this.source = source;
    this.map = map;
    this.tempo = tempo;
  }

  /** a whole file, fetched and decoded before it can play */
  static async load(ctx: BaseAudioContext, url: string, map: RecordingMap, tempo = 1): Promise<RecordedLine> {
    const res = await fetch(url);
    if (!res.ok) throw new Error("The singer could not be loaded");
    const buf = await ctx.decodeAudioData(await res.arrayBuffer());
    return new RecordedLine(new WholeSource(buf), map, tempo);
  }

  /** a chunked recording: usable at once, playing what has arrived (loading starts now) */
  static chunked(spec: ChunkedSpec, map: RecordingMap, tempo = 1): RecordedLine {
    return new RecordedLine(new ChunkSource(spec), map, tempo);
  }

  /** a new timeline for the same recording (the piece's tempo map changed) */
  setMap(map: RecordingMap) {
    const same = (a?: number[], b?: number[]) => a === b || (!!a && !!b && a.length === b.length && a.every((x, i) => x === b[i]));
    if (same(map.perf, this.map.perf) && same(map.audio, this.map.audio)) return;
    this.map = map;
    this.cur?.stop();
    this.cur = null;
  }

  /**
   * Where the recording sits on the app's timeline at tempo f: pairs (app seconds at f, recording seconds), in
   * order. Runs of notes that keep one offset (within DRIFT of their median, outliers aside) share it exactly, so
   * between them the recording is copied as it is; from one run to the next it is stretched.
   */
  private anchors(f: number): { out: number[]; aud: number[] } {
    const { perf, audio } = this.map;
    const out: number[] = [];
    const aud: number[] = [];
    for (const r of offsetRuns(perf.map((p, i) => audio[i] - p / f), perf.map((p) => p / f))) {
      out.push(perf[r.from] / f);
      aud.push(perf[r.from] / f + r.off);
      if (r.to > r.from) {
        out.push(perf[r.to] / f);
        aud.push(perf[r.to] / f + r.off);
      }
    }
    return { out, aud };
  }

  /** the recording laid onto the app's timeline at tempo factor f (one tempo kept; built as it arrives) */
  timed(f: number): TimedLine {
    f = Math.round(f * 100) / 100;
    if (this.cur?.f === f && this.cur.alive) return this.cur;
    this.cur?.stop();
    this.cur = new TimedLine(this.source, this.anchors(f), f);
    return this.cur;
  }

  dispose() {
    this.cur?.stop();
    this.cur = null;
    this.source.dispose();
  }
}
