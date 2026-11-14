/**
 * A recording served in short chunks (scripts/audio/chunk-grand.py), put back together in the browser as they arrive.
 *
 * Chunk i holds the recording's samples [i*chunk - overlap, (i+1)*chunk + overlap) (zeros outside the recording),
 * encoded on its own. Browsers disagree about the codec's priming and the file's edit list, so where a chunk's
 * decoded samples begin is not taken on trust:
 *  - the decoder's lead (how many samples it puts before the first encoded one: 0 where the edit list is honoured,
 *    the encoder's priming where it is not) is measured once per session on a calibration file, a known noise burst
 *    encoded with the same settings (calibrationNoise; findLead);
 *  - each chunk is then lined up with a neighbour already in place by cross-correlating the overlap they share
 *    (bestLag), so it lands to the sample even if the lead were wrong;
 *  - the core of each chunk is copied as it is, and the seam with its predecessor is a short linear cross-fade
 *    inside the overlap (both decodes are valid there), so no edge of the codec is ever heard.
 * What is in place grows from wherever playback needs it (ChunkLoader's queue); availEnd says how far it reaches.
 */

export interface ChunkLayout {
  /** sample rate of the chunks (and of the stitched recording) */
  rate: number;
  /** samples per chunk (without its overlaps) */
  chunk: number;
  /** samples of each neighbour every chunk carries, on each side */
  overlap: number;
  /** the recording's length */
  samples: number;
  channels: number;
}

/** the seam between two chunks: a linear cross-fade this long, ending where the later chunk's core begins */
export const SEAM = 1024;
/** samples at the outer edge of a chunk's overlap left out of the alignment (the codec's edge) */
const GUARD = 2048;

/**
 * The calibration signal (as chunk-grand.py writes it): 2400 zeros, 9600 samples of xorshift32 noise at +-0.5,
 * 2400 zeros.
 */
export function calibrationNoise(): Float32Array {
  const out = new Float32Array(14400);
  let s = 0x9e3779b9 >>> 0;
  for (let i = 0; i < 9600; i++) {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    out[2400 + i] = ((s / 4294967296) * 2 - 1) * 0.5;
  }
  return out;
}

/**
 * The best lag of b against a: e maximising the normalised correlation of a[s] with b[s + e] for s in [from, to)
 * and e in [lo, hi], every lag tried (noise correlates at one lag only, so no coarse pass). Samples outside either
 * array do not count.
 */
export function bestLag(
  a: Float32Array,
  b: Float32Array,
  from: number,
  to: number,
  lo: number,
  hi: number,
): { lag: number; corr: number; energy: number } {
  let best = lo;
  let bestC = -Infinity;
  let bestE = 0;
  for (let e = lo; e <= hi; e++) {
    const s0 = Math.max(from, -e, 0);
    const s1 = Math.min(to, b.length - e, a.length);
    let ab = 0;
    let aa = 0;
    let bb = 0;
    for (let s = s0; s < s1; s++) {
      const x = a[s];
      const y = b[s + e];
      ab += x * y;
      aa += x * x;
      bb += y * y;
    }
    const c = aa > 0 && bb > 0 ? ab / Math.sqrt(aa * bb) : 0;
    if (c > bestC) ((bestC = c), (best = e), (bestE = aa / Math.max(1, s1 - s0)));
  }
  return { lag: best, corr: bestC, energy: bestE };
}

/** where a decoded calibration file's noise begins against where it was encoded: the decoder's lead (samples) */
export function findLead(decoded: Float32Array): { lead: number; corr: number } {
  const ref = calibrationNoise();
  // a[s] = ref[s], b[s + e] = decoded: the lead is e
  const r = bestLag(ref, decoded, 2400, 12000, -64, 4096);
  return { lead: r.lag, corr: r.corr };
}

const mix = (chans: Float32Array[]): Float32Array => {
  if (chans.length === 1) return chans[0];
  const m = new Float32Array(chans[0].length);
  for (const c of chans) for (let i = 0; i < m.length; i++) m[i] += c[i] / chans.length;
  return m;
};

/** the recording, put together from its chunks as they come */
export class ChunkStitcher {
  readonly layout: ChunkLayout;
  readonly n: number;
  readonly chans: Float32Array[];
  /** all channels mixed (the same array as chans[0] for a mono recording) */
  readonly mono: Float32Array;
  /** chunk i is in place */
  readonly loaded: Uint8Array;
  /** the seam before chunk i is cross-faded (both chunks in place) */
  private seam: Uint8Array;
  /** where each chunk's decoded samples were placed: the decoded index of its first sample, less the overlap */
  readonly shift: Int32Array;
  /** chunks in place, in order of arrival (for tests and the console) */
  readonly log: { i: number; lag: number; corr: number; by: "prev" | "next" | "lead" }[] = [];

  constructor(layout: ChunkLayout) {
    this.layout = layout;
    this.n = Math.max(1, Math.ceil(layout.samples / layout.chunk));
    this.chans = Array.from({ length: layout.channels }, () => new Float32Array(layout.samples));
    this.mono = layout.channels === 1 ? this.chans[0] : new Float32Array(layout.samples);
    this.loaded = new Uint8Array(this.n);
    this.seam = new Uint8Array(this.n);
    this.seam[0] = 1;
    this.shift = new Int32Array(this.n);
  }

  get complete() {
    return this.loaded.indexOf(0) < 0;
  }

  chunkOf(s: number) {
    return Math.min(this.n - 1, Math.max(0, Math.floor(s / this.layout.chunk)));
  }

  /** the first sample at or after `from` that is not yet in place for good (samples, at most the length) */
  availEnd(from: number): number {
    const { chunk, samples } = this.layout;
    let s = Math.max(0, from);
    while (s < samples) {
      const i = this.chunkOf(s);
      if (!this.loaded[i]) return s;
      const end = Math.min(samples, (i + 1) * chunk);
      if (i + 1 < this.n && !this.seam[i + 1]) return Math.max(s, end - SEAM);
      s = end;
    }
    return samples;
  }

  /**
   * Put chunk i in place: data are its decoded channels, lead the decoder's lead (null: not known). Returns where
   * it went (the lag against the lead) and how it was decided.
   */
  add(i: number, data: Float32Array[], lead: number | null) {
    if (this.loaded[i]) return this.log.find((l) => l.i === i)!;
    const { chunk: L, overlap: V, samples: T } = this.layout;
    const C = this.chans.length;
    const d = Array.from({ length: C }, (_, c) => data[Math.min(c, data.length - 1)]);
    const dm = mix(data.length === C ? d : data);
    const base = lead ?? 0;
    // decoded index of the recording's sample s: s - i*L + V + shift
    let shift = base;
    let by: "prev" | "next" | "lead" = "lead";
    let corr = 0;
    const lo = lead === null ? -64 : base - 64;
    const hi = lead === null ? 4096 : base + 64;
    const at = (from: number, to: number) => {
      // a: the recording as in place; b: this chunk shifted so that b[s + e] = dm[s - i*L + V + e]
      const off = -i * L + V;
      const r = bestLag(this.mono, dm, from, to, lo + off, hi + off);
      return { ...r, lag: r.lag - off };
    };
    const ok = (r: { corr: number; energy: number }) => r.corr > 0.8 && r.energy > 1e-8;
    if (i > 0 && this.loaded[i - 1]) {
      const r = at(i * L - V + GUARD, i * L - SEAM);
      if (ok(r)) ((shift = r.lag), (by = "prev"), (corr = r.corr));
    } else if (i + 1 < this.n && this.loaded[i + 1]) {
      const from = (i + 1) * L;
      const r = at(from, Math.min(T, from + V - GUARD));
      if (ok(r)) ((shift = r.lag), (by = "next"), (corr = r.corr));
    }
    this.shift[i] = shift;
    const o = -i * L + V + shift;
    const get = (x: Float32Array, s: number) => {
      const j = s + o;
      return j >= 0 && j < x.length ? x[j] : 0;
    };
    const write = (s0: number, s1: number, w: ((s: number) => number) | null, mine: "late" | "early") => {
      for (let c = 0; c < C; c++) {
        const y = this.chans[c];
        const x = d[c];
        for (let s = s0; s < s1; s++) {
          const v = get(x, s);
          if (!w) y[s] = v;
          else {
            const k = w(s); // the later chunk's weight
            y[s] = mine === "late" ? y[s] * (1 - k) + v * k : v * (1 - k) + y[s] * k;
          }
        }
      }
      if (C > 1)
        for (let s = s0; s < s1; s++) {
          let m = 0;
          for (let c = 0; c < C; c++) m += this.chans[c][s];
          this.mono[s] = m / C;
        }
    };
    const end = Math.min(T, (i + 1) * L);
    // the core
    const coreEnd = i + 1 < this.n ? end - SEAM : end;
    write(i * L, coreEnd, null, "late");
    // the seam before (this chunk is the later one) and after (it is the earlier one)
    if (i > 0) {
      const s0 = i * L - SEAM;
      const w = (s: number) => (s - s0 + 0.5) / SEAM;
      if (this.loaded[i - 1]) {
        write(s0, i * L, w, "late");
        this.seam[i] = 1;
      } else write(s0, i * L, null, "late");
    }
    if (i + 1 < this.n) {
      const s0 = end - SEAM;
      const w = (s: number) => (s - s0 + 0.5) / SEAM;
      if (this.loaded[i + 1]) {
        write(s0, end, w, "early");
        this.seam[i + 1] = 1;
      } else write(s0, end, null, "late");
    }
    this.loaded[i] = 1;
    const entry = { i, lag: shift - base, corr, by };
    this.log.push(entry);
    return entry;
  }
}

/* ---------------- fetching, decoding and caching ---------------- */

/** fetched chunks are kept here (a new name when the encoding changes) */
export const CHUNK_CACHE = "sottovoce-grand-v2";
const IN_FLIGHT = 4;

/** the same file under another base: alt replaces the part of url before "v2/" */
const altUrl = (url: string, alt?: string) => {
  const i = url.indexOf("v2/");
  return alt && i >= 0 ? alt + url.slice(i) : null;
};

async function cachedFetch(url: string, alt?: string): Promise<ArrayBuffer> {
  let cache: Cache | null = null;
  try {
    if (typeof caches !== "undefined") cache = await caches.open(CHUNK_CACHE);
  } catch {
    cache = null; // storage unavailable (private window, blocked site data)
  }
  if (cache) {
    try {
      const hit = await cache.match(url);
      if (hit) return await hit.arrayBuffer();
    } catch {
      /* fall through to the network */
    }
  }
  let res: Response | null = null;
  try {
    res = await fetch(url, { credentials: "same-origin" });
  } catch {
    res = null;
  }
  const other = altUrl(url, alt);
  if ((!res || !res.ok) && other) res = await fetch(other);
  if (!res || !res.ok) throw new Error(`A recording could not be loaded (${res?.status ?? "network"})`);
  const body = await res.arrayBuffer();
  // a copy goes to the cache (decoding detaches the original); not waited for
  if (cache)
    try {
      void cache
        .put(url, new Response(body.slice(0), { headers: { "Content-Type": res.headers.get("Content-Type") ?? "audio/mp4" } }))
        .catch(() => undefined);
    } catch {
      /* quota or storage errors: the chunk still plays */
    }
  return body;
}

let decoder: BaseAudioContext | null = null;
/** decode at the chunks' own rate (48 kHz), whatever the device's: an offline context decodes without playing */
function decodeAt(rate: number, bytes: ArrayBuffer): Promise<AudioBuffer> {
  if (!decoder || decoder.sampleRate !== rate) {
    const W = window as unknown as { OfflineAudioContext?: typeof OfflineAudioContext; webkitOfflineAudioContext?: typeof OfflineAudioContext };
    const Ctor = W.OfflineAudioContext ?? W.webkitOfflineAudioContext!;
    decoder = new Ctor(1, 1, rate);
  }
  const d = decoder;
  return new Promise<AudioBuffer>((resolve, reject) => {
    const p = d.decodeAudioData(bytes, resolve, reject) as unknown as Promise<AudioBuffer> | undefined;
    p?.then?.(resolve, reject);
  });
}

const channelsOf = (b: AudioBuffer) => Array.from({ length: b.numberOfChannels }, (_, c) => b.getChannelData(c));

const leads = new Map<string, Promise<number | null>>();
/** the decoder's lead for chunks encoded like this calibration file (once per session) */
export function decoderLead(url: string, rate: number, alt?: string): Promise<number | null> {
  let p = leads.get(url);
  if (!p) {
    p = cachedFetch(url, alt)
      .then((b) => decodeAt(rate, b))
      .then((buf) => {
        const r = findLead(channelsOf(buf)[0]);
        return r.corr > 0.5 ? r.lead : null;
      })
      .catch(() => null);
    leads.set(url, p);
  }
  return p;
}

/** a chunked recording to load: where its chunks are, how they are laid out, how urgent it is */
export interface ChunkedSpec extends ChunkLayout {
  /** the folder of its chunks (NNN.m4a), ending in "/" */
  base: string;
  /** the calibration file encoded with the same settings */
  calib: string;
  /** 0: load first (the accompaniment, the singer's own line); 1: after */
  priority?: number;
  /** where the same files are if base's server fails (its prefix replaces base's up to the shared tail) */
  alt?: string;
}

/** one recording being loaded */
export class ChunkedRecording {
  readonly spec: ChunkedSpec;
  readonly stitcher: ChunkStitcher;
  /** where playback needs it now (a chunk index): loading goes on from there */
  focus = 0;
  urgent = false;
  disposed = false;
  readonly inFlight = new Set<number>();
  private failed = new Map<number, number>();
  private listeners = new Set<() => void>();
  private lead: Promise<number | null>;
  /** when each chunk arrived (ms since this recording was asked for), for tests and the console */
  readonly arrivals: { i: number; ms: number }[] = [];
  private t0 = performance.now();

  constructor(spec: ChunkedSpec) {
    this.spec = spec;
    this.stitcher = new ChunkStitcher(spec);
    this.lead = decoderLead(spec.calib, spec.rate, spec.alt);
    loader.add(this);
  }

  url(i: number) {
    return `${this.spec.base}${String(i).padStart(3, "0")}.m4a`;
  }

  onProgress(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  /** playback needs the recording at sample s: what holds it comes next */
  want(s: number) {
    const i = this.stitcher.chunkOf(s);
    if (i !== this.focus) {
      this.focus = i;
      this.urgent = !this.stitcher.loaded[i];
      loader.pump();
    }
  }

  /** the next chunk to fetch, and how far it is from where playback is (null: none) */
  next(): { i: number; dist: number } | null {
    const { loaded, n } = this.stitcher;
    for (let k = 0; k < n; k++) {
      const i = (this.focus + k) % n;
      if (!loaded[i] && !this.inFlight.has(i) && (this.failed.get(i) ?? 0) < 3) return { i, dist: i >= this.focus ? k : n + k };
    }
    return null;
  }

  async fetchChunk(i: number) {
    this.inFlight.add(i);
    try {
      const bytes = await cachedFetch(this.url(i), this.spec.alt);
      const buf = await decodeAt(this.spec.rate, bytes);
      const lead = await this.lead;
      if (this.disposed) return;
      this.stitcher.add(i, channelsOf(buf), lead);
      this.arrivals.push({ i, ms: Math.round(performance.now() - this.t0) });
      if (i === this.focus) this.urgent = false;
      for (const l of this.listeners) l();
    } catch {
      this.failed.set(i, (this.failed.get(i) ?? 0) + 1);
    } finally {
      this.inFlight.delete(i);
    }
  }

  dispose() {
    this.disposed = true;
    this.listeners.clear();
    loader.remove(this);
  }
}

/**
 * All chunked recordings share a few connections: the chunk playback needs at once first (a seek, a loop), then
 * the recordings that matter most (priority 0) from where playback is, the others a little behind them.
 */
class ChunkLoader {
  private recs: ChunkedRecording[] = [];
  private active = 0;

  add(r: ChunkedRecording) {
    this.recs.push(r);
    this.pump();
  }

  remove(r: ChunkedRecording) {
    this.recs = this.recs.filter((x) => x !== r);
  }

  pump() {
    while (this.active < IN_FLIGHT) {
      let best: { r: ChunkedRecording; i: number; key: number } | null = null;
      this.recs.forEach((r, order) => {
        const nx = r.next();
        if (!nx) return;
        const urgent = r.urgent && nx.i === r.focus;
        const key = (urgent ? 0 : 1e6) + (nx.dist + (r.spec.priority ?? 0) * 3) * 100 + order;
        if (!best || key < best.key) best = { r, i: nx.i, key };
      });
      if (!best) return;
      const { r, i } = best as { r: ChunkedRecording; i: number };
      this.active++;
      void r.fetchChunk(i).finally(() => {
        this.active--;
        this.pump();
      });
    }
  }
}

const loader = new ChunkLoader();
