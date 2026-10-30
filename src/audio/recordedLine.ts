/**
 * A sung line recorded once (a singer, or a singing synthesiser, rendered from the score) played in time with the
 * piano at any tempo.
 *
 * Every sung note's onset in the recording is known (scripts/voice/align.py). For a tempo, the recording is
 * re-timed onto the app's own timeline: each stretch between two onsets is lengthened or shortened to the time the
 * piano gives it, with the pitch kept (WSOLA: overlapping slices of the recording, each nudged to the place where
 * it continues the last one most smoothly). So held notes, fermatas the recording took its own way and the
 * slider's tempo all land exactly on the piano's beats. A re-timed copy is kept for the last two tempos.
 */

export interface RecordingMap {
  /** the onsets, in order: where each sits on the app's timeline (seconds at tempo 1) and in the recording */
  perf: number[];
  audio: number[];
}

const RATE = 32000; // the voice is decoded at this rate: clear enough for a voice, a third of the memory of 48 kHz
const N = 1024; // slice length (32 ms)
const HOP = N / 2;
const SEEK = 192; // how far a slice may move to join smoothly (6 ms: half a period of the lowest voices)
const WIN = (() => {
  const w = new Float32Array(N);
  for (let i = 0; i < N; i++) w[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / N);
  return w;
})();

const pause = () => new Promise<void>((r) => setTimeout(r, 0));

export class RecordedLine {
  private src: Float32Array;
  private map: RecordingMap;
  private cache: { f: number; buf: AudioBuffer }[] = [];
  private pending = new Map<number, Promise<AudioBuffer>>();
  /** the tempo asked for last: an older build still running for another tempo gives way to it */
  private wanted = 1;

  private constructor(src: Float32Array, map: RecordingMap) {
    this.src = src;
    this.map = map;
  }

  static async load(url: string, map: RecordingMap): Promise<RecordedLine> {
    const res = await fetch(url);
    if (!res.ok) throw new Error("The singer could not be loaded");
    const data = await res.arrayBuffer();
    // decode straight to mono at RATE
    const probe = new OfflineAudioContext(1, 1, RATE);
    const buf = await probe.decodeAudioData(data);
    let mono = buf.getChannelData(0);
    if (buf.numberOfChannels > 1) {
      const r = buf.getChannelData(1);
      mono = mono.map((v, i) => (v + r[i]) / 2);
    }
    return new RecordedLine(new Float32Array(mono), map);
  }

  /** a new timeline for the same recording (the piece's tempo map changed): re-timed copies are rebuilt */
  setMap(map: RecordingMap) {
    this.map = map;
    this.cache = [];
    this.pending.clear();
  }

  /** recording seconds at a point of the app's timeline (seconds at tempo 1): straight lines between onsets */
  private audioAt(s: number): number {
    const { perf, audio } = this.map;
    const n = perf.length;
    if (s <= perf[0]) return audio[0] + (s - perf[0]);
    if (s >= perf[n - 1]) return audio[n - 1] + (s - perf[n - 1]);
    let lo = 0;
    let hi = n - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (perf[mid] <= s) lo = mid;
      else hi = mid;
    }
    return audio[lo] + ((s - perf[lo]) * (audio[hi] - audio[lo])) / (perf[hi] - perf[lo]);
  }

  /** the recording re-timed for tempo factor f (cached; built in the background in small steps) */
  timed(ctx: BaseAudioContext, f: number): Promise<AudioBuffer> {
    f = Math.round(f * 100) / 100;
    this.wanted = f;
    const hit = this.cache.find((c) => c.f === f);
    if (hit) return Promise.resolve(hit.buf);
    let p = this.pending.get(f);
    if (!p) {
      p = this.build(ctx, f).then(
        (buf) => {
          this.cache = [{ f, buf }, ...this.cache.filter((c) => c.f !== f)].slice(0, 2);
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
    const x = this.src;
    const { perf, audio } = this.map;
    // the app-timeline length the recording covers (what follows the last onset keeps its own pace)
    const endS = perf[perf.length - 1] + (x.length / RATE - audio[audio.length - 1]);
    const outLen = Math.ceil(((endS / f) * RATE) + N);
    const y = new Float32Array(outLen);
    const frames = Math.floor((outLen - N) / HOP);
    let prev = -1;
    const maxStart = x.length - N - 1;
    for (let k = 0; k < frames; k++) {
      const o = k * HOP;
      // the slice whose middle belongs at this output time
      const s = ((o + N / 2) / RATE) * f;
      let p = Math.round(this.audioAt(s) * RATE - N / 2);
      if (prev >= 0) {
        const nat = prev + HOP; // where the last slice naturally continues
        if (Math.abs(nat - p) <= 1) p = nat;
        else {
          // find, near p, the start that best matches that natural continuation over the overlap
          let best = p;
          let bestC = -Infinity;
          const lo = Math.max(0, p - SEEK);
          const hi = Math.min(maxStart, p + SEEK);
          const nOk = nat >= 0 && nat + HOP < x.length;
          if (nOk) {
            for (let c = lo; c <= hi; c += 2) {
              let acc = 0;
              for (let i = 0; i < HOP; i += 4) acc += x[c + i] * x[nat + i];
              if (acc > bestC) {
                bestC = acc;
                best = c;
              }
            }
          }
          p = best;
        }
      }
      if (p >= 0 && p <= maxStart) {
        for (let i = 0; i < N; i++) y[o + i] += x[p + i] * WIN[i];
      }
      prev = p;
      if ((k & 511) === 511) {
        await pause(); // keep the page responsive
        if (this.wanted !== f) throw new Error("superseded");
      }
    }
    const buf = ctx.createBuffer(1, outLen, RATE);
    buf.copyToChannel(y, 0);
    return buf;
  }
}
