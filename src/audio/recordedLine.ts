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

/** how far the recording may drift from the beat before the next stretch is moved back onto it */
const DRIFT = 0.06;
const pause = () => new Promise<void>((r) => setTimeout(r, 0));

export class RecordedLine {
  /** the recording as decoded (all its channels, the device's rate) */
  readonly buffer: AudioBuffer;
  /** the tempo factor it was rendered at */
  readonly tempo: number;
  private map: RecordingMap;
  private mono: Float32Array | null = null;
  private cache: { f: number; buf: AudioBuffer }[] = [];
  private pending = new Map<number, Promise<AudioBuffer>>();
  private wanted = 1;

  private constructor(buffer: AudioBuffer, map: RecordingMap, tempo: number) {
    this.buffer = buffer;
    this.map = map;
    this.tempo = tempo;
  }

  static async load(ctx: BaseAudioContext, url: string, map: RecordingMap, tempo = 1): Promise<RecordedLine> {
    const res = await fetch(url);
    if (!res.ok) throw new Error("The singer could not be loaded");
    const buf = await ctx.decodeAudioData(await res.arrayBuffer());
    return new RecordedLine(buf, map, tempo);
  }

  /** a new timeline for the same recording (the piece's tempo map changed) */
  setMap(map: RecordingMap) {
    this.map = map;
    this.cache = [];
    this.pending.clear();
  }

  /**
   * Where the recording sits on the app's timeline at tempo f: pairs (app seconds at f, recording seconds), in
   * order. Runs of notes that keep one offset (within DRIFT of their median, outliers aside) share it exactly, so
   * between them the recording is copied as it is; from one run to the next it is stretched.
   */
  private anchors(f: number): { out: number[]; aud: number[] } {
    const { perf, audio } = this.map;
    const n = perf.length;
    const d = perf.map((p, i) => audio[i] - p / f);
    // each note's offset, cleaned: the median of it and its neighbours (one misplaced onset does not count)
    const med = d.map((_, i) => {
      const xs = d.slice(Math.max(0, i - 2), Math.min(n, i + 3)).sort((x, y) => x - y);
      return xs[xs.length >> 1];
    });
    const out: number[] = [];
    const aud: number[] = [];
    let i = 0;
    while (i < n) {
      // a run: the notes whose offset stays within DRIFT of the run's own (its first notes' median)
      let j = i + 1;
      while (j < n && Math.abs(med[j] - med[i]) <= DRIFT) j++;
      const run = d.slice(i, j).sort((x, y) => x - y);
      const off = run[run.length >> 1];
      out.push(perf[i] / f);
      aud.push(perf[i] / f + off);
      if (j - 1 > i) {
        out.push(perf[j - 1] / f);
        aud.push(perf[j - 1] / f + off);
      }
      i = j;
    }
    return { out, aud };
  }

  /** the recording laid onto the app's timeline at tempo factor f (cached; built in the background in small steps) */
  timed(ctx: BaseAudioContext, f: number): Promise<AudioBuffer> {
    f = Math.round(f * 100) / 100;
    this.wanted = f;
    const hit = this.cache.find((c) => c.f === f);
    if (hit) return Promise.resolve(hit.buf);
    let p = this.pending.get(f);
    if (!p) {
      p = this.build(ctx, f).then(
        (buf) => {
          this.cache = [{ f, buf }, ...this.cache.filter((c) => c.f !== f)].slice(0, 1);
          this.pending.delete(f);
          return buf;
        },
        (e) => {
          this.pending.delete(f);
          throw e;
        },
      );
      this.pending.set(f, p);
    }
    return p;
  }

  /** a ready copy for this tempo, if there is one */
  ready(f: number): AudioBuffer | null {
    f = Math.round(f * 100) / 100;
    return this.cache.find((c) => c.f === f)?.buf ?? null;
  }

  private async build(ctx: BaseAudioContext, f: number): Promise<AudioBuffer> {
    const RATE = this.buffer.sampleRate;
    const N = 2 * Math.round(0.016 * RATE); // slice: 32 ms
    const HOP = N / 2;
    const SEEK = Math.round(0.006 * RATE); // half a period of the lowest voices
    const WIN = new Float32Array(N);
    for (let i = 0; i < N; i++) WIN[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / N);
    if (!this.mono) {
      const b = this.buffer;
      const m = new Float32Array(b.length);
      for (let c = 0; c < b.numberOfChannels; c++) {
        const d = b.getChannelData(c);
        for (let i = 0; i < m.length; i++) m[i] += d[i] / b.numberOfChannels;
      }
      this.mono = m;
    }
    const x = this.mono;
    const { out: oA, aud: aA } = this.anchors(f);
    const na = oA.length;
    const audAt = (o: number) => {
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
    };
    // the app-time length the recording covers (what follows the last onset keeps its own pace)
    const outLen = Math.ceil((oA[na - 1] + (x.length / RATE - aA[na - 1])) * RATE + N);
    const chans = Array.from({ length: this.buffer.numberOfChannels }, (_, c) => this.buffer.getChannelData(c));
    const ys = chans.map(() => new Float32Array(outLen));
    const frames = Math.floor((outLen - N) / HOP);
    let prev = -1;
    const maxStart = x.length - N - 1;
    for (let k = 0; k < frames; k++) {
      const o = k * HOP;
      let p = Math.round(audAt((o + N / 2) / RATE) * RATE - N / 2);
      if (prev >= 0) {
        const nat = prev + HOP;
        if (Math.abs(nat - p) <= 1) p = nat;
        else if (nat >= 0 && nat + HOP < x.length) {
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
      prev = p;
      if ((k & 511) === 511) {
        await pause();
        if (this.wanted !== f) throw new Error("superseded");
      }
    }
    const buf = ctx.createBuffer(chans.length, outLen, RATE);
    ys.forEach((y, c) => buf.copyToChannel(y, c));
    return buf;
  }
}
