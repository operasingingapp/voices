/**
 * Chunked grand-piano recordings: synthetic signals cut as scripts/audio/chunk-grand.py cuts them, through ffmpeg's
 * AAC encoder and decoder (standing in for the browser's), put back together by ChunkStitcher. Two decoders are
 * imitated: one that honours the file's edit list (lead 0) and one that ignores it (the encoder's 1024 samples of
 * priming come first). The result must sit on the original to the sample, with nothing at the seams.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { bestLag, calibrationNoise, ChunkStitcher, findLead, SEAM, type ChunkLayout } from "../../src/audio/chunkedAudio";
import { TimedLine, type LineSource } from "../../src/audio/recordedLine";

const RATE = 48000;
const L = 10 * RATE;
const V = RATE / 4;
const dir = mkdtempSync(join(tmpdir(), "chunks-"));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

/** a piano-like test signal: decaying partials struck every 0.3-0.7 s, a little noise, and a silence across 10 s */
function synth(seconds: number, channels: number, seed = 1): Float32Array[] {
  const n = Math.round(seconds * RATE);
  let s = seed;
  const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  const out = Array.from({ length: channels }, () => new Float32Array(n));
  let t = 0;
  while (t < n) {
    const freq = 110 * 2 ** (Math.floor(rnd() * 36) / 12);
    const amp = 0.05 + rnd() * 0.15;
    const len = Math.min(n - t, Math.round(RATE * 2.5));
    for (let c = 0; c < channels; c++) {
      const pan = channels === 1 ? 1 : 0.6 + 0.4 * rnd();
      const y = out[c];
      for (let i = 0; i < len; i++) {
        const e = Math.exp(-i / (RATE * 0.6)) * amp * pan;
        y[t + i] += e * (Math.sin((2 * Math.PI * freq * i) / RATE) + 0.4 * Math.sin((4 * Math.PI * freq * i) / RATE + 0.3) + 0.2 * Math.sin((6 * Math.PI * freq * i) / RATE));
      }
    }
    t += Math.round(RATE * (0.3 + rnd() * 0.4));
  }
  for (const y of out) for (let i = 0; i < n; i++) y[i] += (rnd() - 0.5) * 0.002;
  // a rest across the first seam: the overlap is silent, so the alignment must fall back to the decoder's lead
  for (const y of out) y.fill(0, 9.6 * RATE, 10.4 * RATE);
  return out;
}

const interleave = (chans: Float32Array[], a: number, b: number) => {
  const C = chans.length;
  const buf = new Float32Array((b - a) * C);
  for (let i = a; i < b; i++) for (let c = 0; c < C; c++) buf[(i - a) * C + c] = i >= 0 && i < chans[c].length ? chans[c][i] : 0;
  return Buffer.from(buf.buffer);
};

function encode(chans: Float32Array[], a: number, b: number, file: string) {
  const C = chans.length;
  execFileSync("ffmpeg", ["-v", "error", "-y", "-f", "f32le", "-ar", String(RATE), "-ac", String(C), "-i", "-", "-c:a", "aac", "-b:a", C === 2 ? "160k" : "96k", "-ar", String(RATE), "-movflags", "+faststart", file], {
    input: interleave(chans, a, b),
  });
}

function decode(file: string, C: number, ignoreEditList: boolean): Float32Array[] {
  const raw = execFileSync("ffmpeg", ["-v", "error", "-ignore_editlist", ignoreEditList ? "1" : "0", "-i", file, "-f", "f32le", "-ac", String(C), "-"], { maxBuffer: 1 << 28 });
  const all = new Float32Array(raw.buffer, raw.byteOffset, raw.byteLength / 4);
  const n = all.length / C;
  return Array.from({ length: C }, (_, c) => {
    const y = new Float32Array(n);
    for (let i = 0; i < n; i++) y[i] = all[i * C + c];
    return y;
  });
}

/** the chunk files of a signal, as chunk-grand.py writes them: chunk i = the recording's [i*L - V, (i+1)*L + V) */
function chunkFiles(x: Float32Array[], tag: string) {
  const T = x[0].length;
  const n = Math.ceil(T / L);
  return Array.from({ length: n }, (_, i) => {
    const f = join(dir, `${tag}-${i}.m4a`);
    encode(x, i * L - V, (i + 1) * L + V, f);
    return f;
  });
}

function calibration(C: number, ignore: boolean) {
  const f = join(dir, `calib-${C}.m4a`);
  const c = calibrationNoise();
  encode(Array.from({ length: C }, () => c), 0, c.length, f);
  return findLead(decode(f, C, ignore)[0]);
}

const snrDb = (ref: Float32Array, y: Float32Array, a: number, b: number) => {
  let s = 0;
  let e = 0;
  for (let i = a; i < b; i++) ((s += ref[i] * ref[i]), (e += (ref[i] - y[i]) ** 2));
  return 10 * Math.log10(s / Math.max(e, 1e-20));
};

describe("chunk alignment", () => {
  it("finds the decoder's lead on the calibration file, to the sample", () => {
    for (const C of [1, 2]) {
      expect(calibration(C, false).lead).toBe(0);
      expect(calibration(C, true).lead).toBe(1024);
    }
  });

  it("bestLag finds a known shift", () => {
    const a = calibrationNoise();
    const b = new Float32Array(a.length + 500);
    b.set(a, 321);
    expect(bestLag(a, b, 2400, 12000, -64, 2000).lag).toBe(321);
    expect(bestLag(a, b, 2400, 12000, 300, 340).lag).toBe(321);
  });

  for (const C of [2, 1])
    for (const ignore of [false, true])
      it(`stitches ${C === 2 ? "stereo 160k" : "mono 96k"} chunks sample-accurately (${ignore ? "edit list ignored" : "edit list honoured"}), in any order`, () => {
        const x = synth(27.3, C);
        const T = x[0].length;
        const files = chunkFiles(x, `s${C}`);
        const decoded = files.map((f) => decode(f, C, ignore));
        const { lead } = calibration(C, ignore);
        const layout: ChunkLayout = { rate: RATE, chunk: L, overlap: V, samples: T, channels: C };
        const n = files.length;
        expect(n).toBe(3);
        const orders = [
          [0, 1, 2],
          [2, 1, 0],
          [1, 0, 2],
          [2, 0, 1],
        ];
        // what a single continuous encode gets at best: the stitched result must be as good
        for (const order of orders) {
          const st = new ChunkStitcher(layout);
          for (const i of order) st.add(i, decoded[i], lead);
          expect(st.complete).toBe(true);
          expect(st.availEnd(0)).toBe(T);
          // every chunk where it belongs: no lag against the decoder's lead
          for (const l of st.log) expect(l.lag, `chunk ${l.i} (${l.by})`).toBe(0);
          // the seam at 10 s is in a rest (no correlation): that chunk was placed by the lead alone
          for (let c = 0; c < C; c++) {
            // to the sample: the best lag of the whole stitched recording against the original is 0
            expect(bestLag(x[c], st.chans[c], RATE, T - RATE, -50, 50).lag).toBe(0);
            // as close as the codec allows, everywhere, and as close at the seams as elsewhere
            const all = snrDb(x[c], st.chans[c], 0, T);
            expect(all).toBeGreaterThan(C === 2 ? 25 : 20);
            for (let i = 1; i < n; i++) {
              const at = snrDb(x[c], st.chans[c], i * L - SEAM - 2048, i * L + 2048);
              if (i === 1) continue; // silence (only the noise floor)
              expect(at).toBeGreaterThan(all - 6);
            }
          }
        }
      });

  it("lines a chunk up with its neighbour even when the lead is not known", () => {
    const C = 2;
    const x = synth(27.3, C, 7);
    const T = x[0].length;
    const files = chunkFiles(x, "u");
    const decoded = files.map((f) => decode(f, C, true)); // 1024 samples of priming in front of each
    const layout: ChunkLayout = { rate: RATE, chunk: L, overlap: V, samples: T, channels: C };
    // chunk 1 is placed by the lead (1024, measured), chunk 2 by correlation alone against it
    const st = new ChunkStitcher(layout);
    st.add(1, decoded[1], 1024);
    st.add(2, decoded[2], null);
    expect(st.log[1]).toMatchObject({ i: 2, by: "prev" });
    expect(st.shift[2]).toBe(1024);
    for (let c = 0; c < C; c++) expect(bestLag(x[c], st.chans[c], 21 * RATE, T - RATE, -50, 50).lag).toBe(0);
  });

  it("knows how far it reaches", () => {
    const st = new ChunkStitcher({ rate: RATE, chunk: L, overlap: V, samples: 3 * L - 5, channels: 1 });
    const z = [new Float32Array(L + 2 * V)];
    expect(st.availEnd(0)).toBe(0);
    st.add(0, z, 0);
    expect(st.availEnd(0)).toBe(L - SEAM); // the seam waits for chunk 1
    st.add(2, z, 0);
    expect(st.availEnd(L)).toBe(L);
    expect(st.availEnd(2 * L)).toBe(3 * L - 5);
    st.add(1, z, 0);
    expect(st.availEnd(0)).toBe(3 * L - 5);
  });
});

/** a source that reveals a recording a little at a time, in a given order of chunks */
class Revealing implements LineSource {
  rate = RATE;
  length: number;
  chans: Float32Array[];
  mono: Float32Array;
  private full: Float32Array[];
  private have: Uint8Array;
  private cbs = new Set<() => void>();
  constructor(full: Float32Array[], private piece: number) {
    this.full = full;
    this.length = full[0].length;
    this.chans = full.map(() => new Float32Array(this.length));
    this.mono = this.chans.length === 1 ? this.chans[0] : new Float32Array(this.length);
    this.have = new Uint8Array(Math.ceil(this.length / piece));
  }
  reveal(i: number) {
    const a = i * this.piece;
    const b = Math.min(this.length, a + this.piece);
    this.full.forEach((y, c) => this.chans[c].set(y.subarray(a, b), a));
    if (this.chans.length > 1) for (let s = a; s < b; s++) this.mono[s] = this.chans.reduce((m, y) => m + y[s], 0) / this.chans.length;
    this.have[i] = 1;
    for (const cb of this.cbs) cb();
  }
  availEnd(from: number) {
    let s = from;
    while (s < this.length && this.have[Math.floor(s / this.piece)]) s = (Math.floor(s / this.piece) + 1) * this.piece;
    return Math.min(s, this.length);
  }
  onProgress(cb: () => void) {
    this.cbs.add(cb);
    return () => this.cbs.delete(cb);
  }
  want() {}
  dispose() {}
}

const settle = async (tl: TimedLine) => {
  for (let i = 0; i < 2000 && !tl.complete; i++) await new Promise((r) => setTimeout(r, 0));
};

describe("re-timing as the recording arrives", () => {
  const x = synth(12, 2, 3);
  // a stretch in the middle (the app's timeline 5% slower between 3 s and 8 s), copied as it is elsewhere
  const anchors = { out: [0, 3, 8.25, 11], aud: [0, 3, 8, 10.75] };

  it("lays out what has arrived, and the result equals laying out the whole recording at once", async () => {
    const whole = new Revealing(x, RATE);
    for (let i = 0; i < 12; i++) whole.reveal(i);
    const ref = new TimedLine(whole, anchors, 1);
    await settle(ref);

    const src = new Revealing(x, RATE);
    const tl = new TimedLine(src, anchors, 1);
    expect(tl.finalEnd(0)).toBe(0);
    for (let i = 0; i < 4; i++) src.reveal(i);
    await settle(tl);
    const part = tl.finalEnd(0);
    expect(part).toBeGreaterThan(2.5 * RATE); // playable as far as the recording is in
    expect(part).toBeLessThan(4.2 * RATE);
    for (let i = 4; i < 12; i++) src.reveal(i);
    await settle(tl);
    expect(tl.complete).toBe(true);
    expect(tl.finalEnd(0)).toBe(tl.length);
    for (let c = 0; c < 2; c++) {
      let d = 0;
      for (let i = 0; i < tl.length; i++) d = Math.max(d, Math.abs(tl.ys[c][i] - ref.ys[c][i]));
      expect(d).toBe(0);
    }
  });

  it("starts where playback is (a seek), then fills in the rest", async () => {
    const src = new Revealing(x, RATE);
    const tl = new TimedLine(src, anchors, 1);
    tl.focus(9 * RATE);
    for (const i of [8, 9, 10, 11]) src.reveal(i);
    await settle(tl);
    expect(tl.finalEnd(0)).toBe(0);
    expect(tl.finalEnd(9 * RATE)).toBeGreaterThanOrEqual(11 * RATE);
    for (let i = 0; i < 8; i++) src.reveal(i);
    await settle(tl);
    expect(tl.complete).toBe(true);
  });
});
