/**
 * SynthPort playing the Noct-Salamander Grand Piano (the Salamander Grand Piano V3, a Yamaha C5 recorded by
 * Alexander Holm, retuned and evened out by Chisato Yamauchi's Accurate-Salamander Project; CC BY 3.0)
 * through the browser's own Web Audio: no AudioWorklet, no WebAssembly, so it works under strict page
 * policies and on iPad.
 *
 * Samples: every minor third from A0 to C8 at all 16 loudness layers, each layer one MP3 holding its 30 notes
 * one after another (see scripts/piano/pack.py and piano/noct.json). A note uses the nearest recorded pitch,
 * shifted by at most a semitone and a half, and the layer that matches its velocity.
 *
 * Memory: 16 decoded layers would not fit a tablet, so only the layers a piece uses are loaded (prepare()),
 * only for the keys it plays, decoded at 32 kHz; until a layer has arrived the nearest loaded one plays.
 * All timing uses the AudioContext clock, like the SoundFont port it replaces.
 */
import type { SynthPort } from "./engine";
import { RecordedLine, type RecordingMap } from "./recordedLine";
import type { PlaybackPart } from "../../shared/types";

import NOCT from "../standalone/piano/noct.json";

const files = import.meta.glob("../standalone/piano/noct-v*.mp3", { query: "?url", import: "default", eager: true }) as Record<string, string>;
interface PianoNote {
  midi: number;
  start: number; // seconds into the layer's file where the note's slot begins (after its gap)
  dur: number;
}
const PIANO = NOCT as unknown as { gap: number; layers: Record<string, { file: string; notes: PianoNote[] }>; cents: Record<string, number> };
/** the lowest velocity of each of the 16 layers (the Accurate-Salamander SFZ's mapping) */
const LAYER_FROM = [1, 27, 33, 38, 43, 48, 53, 59, 65, 72, 80, 88, 96, 104, 112, 120];
const layerOf = (vel: number) => {
  let l = 1;
  for (let i = 0; i < LAYER_FROM.length; i++) if (vel >= LAYER_FROM[i]) l = i + 1;
  return l;
};
/** every layer is recorded at the same loudness; this matches the old piano's level at velocity 64 */
const PIANO_LEVEL_DB = -7.5;
/** decoding rate for the piano: enough for a piano's overtones, a third less memory than 48 kHz */
const PIANO_RATE = 32000;
// instruments for the sung line, loaded only when chosen (real recordings: VSCO 2 CE, CC0; the English horn
// from Sonatina Symphonic Orchestra, CC Sampling+ 1.0; see voices/README.md)
const lineFiles = import.meta.glob("../standalone/voices/*.mp3", { query: "?url", import: "default", eager: true }) as Record<string, string>;
const lineTuning = import.meta.glob("../standalone/voices/tuning.json", { import: "default", eager: true }) as Record<string, Record<string, number>>;

/** What the sung line can be played on. */
export type LineInstrument = "piano" | "oboe" | "clarinet" | "english-horn" | "bassoon" | "singer";
const LINE_SOUND: Record<Exclude<LineInstrument, "piano" | "singer">, { release: number; dbPerStep: number }> = {
  // a held, singing tone: let it go like a breath, not a damper
  oboe: { release: 0.07, dbPerStep: 0.12 },
  clarinet: { release: 0.08, dbPerStep: 0.12 },
  "english-horn": { release: 0.08, dbPerStep: 0.12 },
  bassoon: { release: 0.08, dbPerStep: 0.12 },
};
const isLineKit = (id: string): id is Exclude<LineInstrument, "piano" | "singer"> => id in LINE_SOUND;

/** how loud a recorded singer plays against the piano (the recordings are levelled to -20 LUFS) */
const SINGER_LEVEL_DB = -3;

interface SingerSource {
  /** the tempo factor it was rendered at (1: the score's tempo) */
  tempo: number;
  url: string;
  map: RecordingMap;
  line: RecordedLine | null;
  load: Promise<RecordedLine> | null;
}

interface Singer {
  key: string;
  sources: SingerSource[];
  ready: Promise<void>;
  /** where playback last (re)started: clock time, app-timeline seconds there, tempo factor */
  follow: { t: number; s: number; f: number } | null;
  playing: { src: AudioBufferSourceNode; env: GainNode } | null;
}


interface Sample {
  midi: number;
  buffer: AudioBuffer;
  offset: number; // seconds of encoder silence to skip at the start
  cents?: number; // how sharp the recording is (corrected when played)
}
/** a layer of the piano: its notes so far (only the keys a piece needs), and the keys still loading */
interface PianoLayer {
  notes: Map<number, Sample>;
  loading: Promise<void> | null;
  keys: Set<number>;
}

interface Voice {
  ch: number;
  midi: number;
  src: AudioBufferSourceNode;
  env: GainNode;
  start: number;
  released: boolean;
  release: number; // seconds (time constant) the sound takes to die away when the note ends
}

/** iPhone/iPad: play as media (not "ambient"), so the music sounds even with the silent switch on. */
let unlocked = false;
function unlockMediaPlayback() {
  if (unlocked) return;
  unlocked = true;
  try {
    const nav = navigator as Navigator & { audioSession?: { type: string } };
    if (nav.audioSession) nav.audioSession.type = "playback";
  } catch {
    /* not supported */
  }
  try {
    const rate = 8000;
    const n = rate / 10;
    const buf = new ArrayBuffer(44 + n);
    const v = new DataView(buf);
    const w = (o: number, t: string) => [...t].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
    w(0, "RIFF");
    v.setUint32(4, 36 + n, true);
    w(8, "WAVE");
    w(12, "fmt ");
    v.setUint32(16, 16, true);
    v.setUint16(20, 1, true);
    v.setUint16(22, 1, true);
    v.setUint32(24, rate, true);
    v.setUint32(28, rate, true);
    v.setUint16(32, 1, true);
    v.setUint16(34, 8, true);
    w(36, "data");
    v.setUint32(40, n, true);
    for (let i = 0; i < n; i++) v.setUint8(44 + i, 128);
    const el = new Audio(URL.createObjectURL(new Blob([buf], { type: "audio/wav" })));
    el.setAttribute("playsinline", "");
    el.volume = 0.01;
    void el.play().catch(() => undefined);
  } catch {
    /* media element not available */
  }
}

const MAX_VOICES = 72;
/** level sent to the room; with the impulse below this sits about 14 dB under the direct sound */
const REVERB_SEND = 0.8;

/**
 * The impulse response of a small recital hall, generated rather than downloaded: a few early
 * reflections, then a diffuse tail of about 1.4 s (to -60 dB) that grows darker as it fades, as
 * high frequencies are absorbed faster than low ones. Each side gets its own noise, for width.
 */
function roomImpulse(ctx: BaseAudioContext, rt60 = 1.4, seconds = 1.6): AudioBuffer {
  const rate = ctx.sampleRate;
  const len = Math.round(rate * seconds);
  const buf = ctx.createBuffer(2, len, rate);
  const early = [
    [0.007, 0.5, 0],
    [0.011, 0.42, 1],
    [0.017, 0.35, 0],
    [0.023, 0.3, 1],
    [0.031, 0.24, 0],
    [0.037, 0.2, 1],
  ];
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    let seed = c ? 0x2545f491 : 0x9e3779b9;
    const rnd = () => {
      seed ^= seed << 13;
      seed ^= seed >>> 17;
      seed ^= seed << 5;
      return ((seed >>> 0) / 4294967296) * 2 - 1;
    };
    let lp = 0;
    for (let i = 0; i < len; i++) {
      const t = i / rate;
      const a = 0.25 + 0.6 * (t / seconds); // low-pass that closes from ~7 kHz to ~1.5 kHz
      lp = lp * a + rnd() * (1 - a);
      const swell = Math.min(1, t / 0.03); // the diffuse tail builds up over the first 30 ms
      d[i] = lp * Math.exp((-6.91 * t) / rt60) * swell;
    }
    for (const [at, gain, side] of early) d[Math.round(at * rate)] += side === c ? gain : gain * 0.5;
  }
  return buf;
}

export class SamplerPort implements SynthPort {
  readonly ctx: AudioContext;
  readonly masterAnalyser: AnalyserNode;
  private master: GainNode;
  private clickBus: GainNode;
  private clicks: AudioScheduledSourceNode[] = [];
  private channels = new Map<number, GainNode>();
  private voices: Voice[] = [];
  /** piano layers that have (some) notes loaded, by layer number 1..16 */
  private layers = new Map<number, PianoLayer>();
  /** what the current piece needs: its layers and the recorded keys under its notes */
  private want = { layers: new Set<number>(), keys: new Set<number>() };
  /** the other instruments, once loaded (sorted by pitch) */
  private kits = new Map<string, Sample[]>();
  private kitLoads = new Map<string, Promise<void>>();
  /** what each channel plays on (default: the piano) */
  private channelKit = new Map<number, LineInstrument>();
  /** semitones a channel's line is moved on its instrument (an octave down when the voice sits above its range) */
  private channelShift = new Map<number, number>();

  /** the room's impulse response (also used by the sound checks) */
  static roomImpulse = (ctx: BaseAudioContext) => roomImpulse(ctx);
  /** how much of the piano goes into the room (0 = dry) */
  readonly reverbSend: GainNode;

  private constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.master = ctx.createGain();
    // a little make-up gain into a gentle limiter, so chords never clip on a tablet speaker
    const makeup = ctx.createGain();
    makeup.gain.value = 2.3;
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -10;
    limiter.knee.value = 8;
    limiter.ratio.value = 6;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.25;
    this.master.connect(makeup).connect(limiter).connect(ctx.destination);
    // The room: the piano as heard a few metres away in a small recital hall. The bass is kept out of it
    // (below ~220 Hz a room only muddies the harmony), and a short pre-delay keeps every attack clear,
    // so rhythm and words stay as precise as the dry sound.
    this.reverbSend = ctx.createGain();
    this.reverbSend.gain.value = REVERB_SEND;
    const lowCut = ctx.createBiquadFilter();
    lowCut.type = "highpass";
    lowCut.frequency.value = 220;
    lowCut.Q.value = 0.5;
    const preDelay = ctx.createDelay(0.1);
    preDelay.delayTime.value = 0.022;
    const room = ctx.createConvolver();
    room.buffer = roomImpulse(ctx);
    this.master.connect(this.reverbSend).connect(lowCut).connect(preDelay).connect(room).connect(makeup);
    this.masterAnalyser = ctx.createAnalyser();
    this.masterAnalyser.fftSize = 2048;
    limiter.connect(this.masterAnalyser);
    this.clickBus = ctx.createGain();
    this.clickBus.gain.value = 0.35;
    this.clickBus.connect(this.master);
  }

  /** more or less room (1 = the default send); eased so a change mid-piece never clicks */
  setRoom(level: number) {
    this.reverbSend.gain.setTargetAtTime(REVERB_SEND * level, this.ctx.currentTime, 0.05);
  }

  static async create(onProgress?: (msg: string) => void): Promise<SamplerPort> {
    const ctx = new AudioContext({ latencyHint: "interactive" });
    const port = new SamplerPort(ctx);
    if (!Object.keys(files).length) throw new Error("The piano samples are missing");
    onProgress?.("Loading the piano");
    // a middle layer over the whole keyboard first: enough to play anything; a piece's own layers follow (prepare)
    await port.loadLayer(8, new Set(PIANO.layers["8"].notes.map((n) => n.midi)));
    return port;
  }

  private fileUrl(layer: number): string {
    const name = PIANO.layers[String(layer)].file;
    const url = Object.entries(files).find(([path]) => path.endsWith("/" + name))?.[1];
    if (!url) throw new Error("A piano layer is missing");
    return url;
  }

  /** Load one layer's notes for these recorded keys (the ones not loaded yet), cut out of its file. */
  private loadLayer(layer: number, keys: Set<number>): Promise<void> {
    let L = this.layers.get(layer);
    if (!L) {
      L = { notes: new Map(), loading: null, keys: new Set() };
      this.layers.set(layer, L);
    }
    const missing = [...keys].filter((k) => !L!.keys.has(k));
    if (!missing.length) return L.loading ?? Promise.resolve();
    for (const k of missing) L.keys.add(k);
    const prev = L.loading ?? Promise.resolve();
    const layerRef = L;
    const run = prev.then(async () => {
      const res = await fetch(this.fileUrl(layer));
      if (!res.ok) throw new Error("A piano layer could not be loaded");
      const data = await res.arrayBuffer();
      // decode at 32 kHz (an offline context decodes at its own rate), then keep only the notes asked for
      let whole: AudioBuffer;
      try {
        whole = await new OfflineAudioContext(2, 1, PIANO_RATE).decodeAudioData(data);
      } catch {
        whole = await this.ctx.decodeAudioData(data);
      }
      const rate = whole.sampleRate;
      for (const n of PIANO.layers[String(layer)].notes) {
        if (!missing.includes(n.midi)) continue;
        // find the onset near the slot's start (MP3 encoders and decoders shift audio by a few ms)
        const ch0 = whole.getChannelData(0);
        const from = Math.max(0, Math.round((n.start - PIANO.gap * 0.8) * rate));
        const limit = Math.min(ch0.length, Math.round((n.start + 0.15) * rate));
        let on = Math.round(n.start * rate);
        for (let i = from; i < limit; i++)
          if (Math.abs(ch0[i]) > 0.002) {
            on = Math.max(0, i - 8);
            break;
          }
        const len = Math.min(ch0.length - on, Math.round(n.dur * rate));
        const buf = new AudioBuffer({ numberOfChannels: whole.numberOfChannels, length: len, sampleRate: rate });
        for (let c = 0; c < whole.numberOfChannels; c++) buf.copyToChannel(whole.getChannelData(c).subarray(on, on + len), c);
        layerRef.notes.set(n.midi, { midi: n.midi, buffer: buf, offset: 0 });
      }
    });
    L.loading = run.catch(() => {
      for (const k of missing) layerRef.keys.delete(k);
    });
    return run;
  }

  configureParts(_parts: PlaybackPart[]) {
    /* every part plays on the piano unless setInstrument chooses otherwise */
  }

  /**
   * The piece's notes (pitch and the velocity they will be played at): load the layers it uses, for the recorded
   * keys under its notes, one layer at a time (the most used first), and let go of layers it does not use.
   */
  prepare(notes: { midi: number; vel: number }[]) {
    const recorded = PIANO.layers["8"].notes.map((n) => n.midi);
    const nearest = (m: number) => recorded.reduce((b, k) => (Math.abs(k - m) < Math.abs(b - m) ? k : b), recorded[0]);
    const count = new Map<number, number>();
    const keys = new Set<number>();
    for (const n of notes) {
      const l = layerOf(n.vel);
      count.set(l, (count.get(l) ?? 0) + 1);
      keys.add(nearest(n.midi));
    }
    // at most the six layers the piece uses most (a handful of notes in another layer play on the nearest one)
    const layers = [...count.keys()].sort((a, b) => count.get(b)! - count.get(a)!).slice(0, 6);
    this.want = { layers: new Set([8, ...layers]), keys };
    // free what this piece does not need (layer 8 stays: it covers everything while others load)
    for (const [l] of this.layers) if (!this.want.layers.has(l)) this.layers.delete(l);
    let chain = Promise.resolve();
    for (const l of layers) chain = chain.then(() => this.loadLayer(l, keys).catch(() => undefined));
    // once the piece's own layers are in, the whole-keyboard layer keeps only the piece's keys too
    const want = this.want;
    void chain.then(() => {
      const L8 = this.layers.get(8);
      if (!L8 || this.want !== want) return;
      for (const k of [...L8.notes.keys()]) if (!keys.has(k)) {
        L8.notes.delete(k);
        L8.keys.delete(k);
      }
    });
  }

  /**
   * Play a channel on another instrument. Its recordings load now if they have not yet; until they have
   * arrived (and for notes outside its range) the piano plays, so nothing ever goes silent.
   */
  setInstrument(ch: number, id: string, range?: [number, number]): Promise<void> {
    const kit: LineInstrument = isLineKit(id) || id === "singer" ? id : "piano";
    const sg = this.singers.get(ch);
    if (sg && kit !== "singer") this.stopSinger(sg, this.ctx.currentTime);
    this.channelKit.set(ch, kit);
    this.channelShift.set(ch, 0);
    this.channelRange.set(ch, range);
    if (kit === "piano") return Promise.resolve();
    if (kit === "singer") return this.singers.get(ch)?.ready ?? Promise.resolve();
    let load = this.kitLoads.get(kit);
    if (!load) {
      const tuning = Object.values(lineTuning)[0] ?? {};
      const list = Object.entries(lineFiles)
        .map(([path, url]) => ({ m: new RegExp(`/${kit}-(\\d+)\\.mp3$`).exec(path), url }))
        .filter((x) => x.m)
        .map(({ m, url }) => ({ midi: Number(m![1]), url, cents: tuning[`${kit}-${m![1]}`] ?? 0 }));
      load = Promise.all(
        list.map(async ({ midi, url, cents }) => {
          const res = await fetch(url);
          if (!res.ok) throw new Error("A recording could not be loaded");
          const buffer = await this.ctx.decodeAudioData(await res.arrayBuffer());
          return { midi, buffer, offset: leadingSilence(buffer), cents };
        }),
      ).then((samples) => {
        this.kits.set(kit, samples.sort((a, b) => a.midi - b.midi));
      });
      load.catch(() => this.kitLoads.delete(kit));
      this.kitLoads.set(kit, load);
    }
    return load.then(() => this.fitRanges());
  }

  /* ---------------- a recorded singer ---------------- */

  private singers = new Map<number, Singer>();

  /**
   * The recordings a channel sings when its instrument is "singer" (null: none): one per tempo it was rendered at
   * (the score's own, and 70%). The one nearest the tempo plays, so it is barely re-timed. Each is fetched the
   * first time it is needed. Resolves once the line can play at the score's tempo.
   */
  setRecording(ch: number, recs: { tempo: number; url: string; map: RecordingMap }[] | null): Promise<void> {
    const old = this.singers.get(ch);
    const key = recs?.map((r) => r.url).join("|");
    if (old && recs && old.key === key) {
      for (const r of recs) {
        const src = old.sources.find((x) => x.url === r.url)!;
        src.map = r.map;
        src.line?.setMap(r.map);
      }
      return old.ready;
    }
    if (old) this.stopSinger(old, this.ctx.currentTime);
    this.singers.delete(ch);
    if (!recs?.length) return Promise.resolve();
    const sg: Singer = { key: key!, sources: recs.map((r) => ({ ...r, line: null, load: null })), follow: null, playing: null, ready: Promise.resolve() };
    sg.ready = this.lineFor(sg, 1).then(async (line) => {
      await line.timed(this.ctx, sg.follow?.f ?? 1).catch(() => undefined);
      if (sg.follow) this.startSinger(ch, sg); // playback may already be running: join in where it is now
    });
    sg.ready.catch(() => this.singers.get(ch) === sg && this.singers.delete(ch));
    this.singers.set(ch, sg);
    return sg.ready;
  }

  /** forget the recorded singers on every channel but these (the port outlives a piece) */
  keepRecordings(channels: number[]) {
    for (const [ch, sg] of [...this.singers]) {
      if (channels.includes(ch)) continue;
      this.stopSinger(sg, this.ctx.currentTime);
      this.singers.delete(ch);
    }
  }

  /** the recording to use at tempo f (the one rendered nearest it), loaded */
  private lineFor(sg: Singer, f: number): Promise<RecordedLine> {
    const src = sg.sources.reduce((a, b) => (Math.abs(b.tempo - f) < Math.abs(a.tempo - f) ? b : a));
    if (!src.load) {
      src.load = RecordedLine.load(src.url, src.map).then((line) => {
        line.setMap(src.map); // the map may have changed while it loaded
        src.line = line;
        return line;
      });
      src.load.catch(() => (src.load = null));
    }
    return src.load;
  }

  /** the engine (re)starts the timeline: at clock time t, app-timeline seconds s, at tempo f */
  follow(t: number, s: number, f: number) {
    for (const [ch, sg] of this.singers) {
      if (this.channelKit.get(ch) !== "singer") continue;
      this.stopSinger(sg, t);
      sg.follow = { t, s, f };
      this.startSinger(ch, sg);
    }
  }

  private startSinger(ch: number, sg: Singer) {
    const fl = sg.follow;
    if (!fl || !sg.sources.some((x) => x.line)) return;
    const go = (buf: AudioBuffer) => {
      if (sg.follow !== fl) return; // stopped or restarted meanwhile
      const t = Math.max(fl.t, this.ctx.currentTime + 0.03);
      const offset = (fl.s + (t - fl.t) * fl.f) / fl.f;
      if (offset >= buf.duration) return;
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const env = this.ctx.createGain();
      const g = 10 ** (SINGER_LEVEL_DB / 20);
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(g, t + 0.02);
      src.connect(env).connect(this.channel(ch));
      src.start(t, Math.max(0, offset));
      const playing = { src, env };
      src.onended = () => {
        env.disconnect();
        if (sg.playing === playing) sg.playing = null;
      };
      sg.playing = playing;
    };
    this.lineFor(sg, fl.f)
      .then((line) => line.ready(fl.f) ?? line.timed(this.ctx, fl.f))
      .then(go, () => undefined);
  }

  private stopSinger(sg: Singer, time: number) {
    sg.follow = null;
    const p = sg.playing;
    if (!p) return;
    sg.playing = null;
    const t = Math.max(time, this.ctx.currentTime);
    p.env.gain.cancelScheduledValues(t);
    p.env.gain.setValueAtTime(p.env.gain.value, t);
    p.env.gain.linearRampToValueAtTime(0, t + 0.02);
    try {
      p.src.stop(t + 0.03);
    } catch {
      /* already stopped */
    }
  }

  /** is this channel's line sung by its recording (so its notes stay silent)? */
  private sung(ch: number) {
    return this.channelKit.get(ch) === "singer" && !!this.singers.get(ch)?.sources.some((x) => x.line);
  }

  async resume() {
    unlockMediaPlayback();
    if (this.ctx.state !== "running") await this.ctx.resume();
  }

  currentTime() {
    return this.ctx.currentTime;
  }

  outputTime() {
    const ts = this.ctx.getOutputTimestamp?.();
    if (ts && ts.contextTime !== undefined && ts.performanceTime !== undefined && ts.contextTime > 0) {
      return ts.contextTime + (performance.now() - ts.performanceTime) / 1000;
    }
    return this.ctx.currentTime - (this.ctx.outputLatency || 0) - (this.ctx.baseLatency || 0);
  }

  private channel(ch: number): GainNode {
    let g = this.channels.get(ch);
    if (!g) {
      g = this.ctx.createGain();
      g.connect(this.master);
      this.channels.set(ch, g);
    }
    return g;
  }

  /**
   * The recording to use and how loud to play it. The layer follows the velocity (its tone: softer layers are
   * darker); the loudness follows it on a gentle scale (0.2 dB per step, so pp to ff spans about 16 dB, which
   * suits accompaniment on a tablet), as every layer is recorded at the same level. Until the right layer has
   * loaded, the nearest loaded one plays.
   */
  private pick(midi: number, vel: number): { sample: Sample; gain: number; cents: number } | null {
    const want = layerOf(vel);
    let best: Sample | null = null;
    let bestScore = Infinity;
    for (const [l, L] of this.layers)
      for (const s of L.notes.values()) {
        // the nearest pitch first, then the nearest layer
        const score = Math.abs(s.midi - midi) * 100 + Math.abs(l - want);
        if (score < bestScore) {
          bestScore = score;
          best = s;
        }
      }
    if (!best) return null;
    const db = (Math.max(1, Math.min(127, vel)) - 64) * 0.2 + PIANO_LEVEL_DB;
    return { sample: best, gain: 10 ** (db / 20), cents: PIANO.cents[String(midi)] ?? 0 };
  }

  private channelRange = new Map<number, [number, number] | undefined>();
  /**
   * A line above (or below) an instrument's range is played an octave down (or up) as a whole, as a bassoon
   * would double a soprano, rather than jumping between the instrument and the piano within a phrase.
   */
  private fitRanges() {
    for (const [ch, kit] of this.channelKit) {
      const list = kit === "piano" ? undefined : this.kits.get(kit);
      const r = this.channelRange.get(ch);
      if (!list?.length || !r) continue;
      const lo = list[0].midi - 3;
      const hi = list[list.length - 1].midi + 3;
      const fits = (s: number) => r[0] + s >= lo && r[1] + s <= hi;
      this.channelShift.set(ch, [0, -12, 12, -24].find(fits) ?? 0);
    }
  }

  /** A recording of another instrument for this note, if the channel uses one and it covers the pitch. */
  private pickLine(ch: number, midiAsked: number, vel: number): { sample: Sample; gain: number; release: number; midi: number } | null {
    const kit = this.channelKit.get(ch);
    if (!kit || kit === "piano" || kit === "singer") return null;
    const list = this.kits.get(kit);
    if (!list?.length) return null;
    const midi = midiAsked + (this.channelShift.get(ch) ?? 0);
    // no more than a minor third beyond the recorded range: further, a stretched recording sounds false
    if (midi < list[0].midi - 3 || midi > list[list.length - 1].midi + 3) return null;
    let best = list[0];
    for (const x of list) if (Math.abs(x.midi - midi) < Math.abs(best.midi - midi)) best = x;
    const db = (Math.max(1, Math.min(127, vel)) - 64) * LINE_SOUND[kit].dbPerStep;
    return { sample: best, gain: 10 ** (db / 20), release: LINE_SOUND[kit].release, midi };
  }

  noteOn(ch: number, midi: number, vel: number, time: number) {
    if (this.sung(ch)) return;
    const line = this.pickLine(ch, midi, vel);
    const picked = line ?? this.pick(midi, vel);
    if (!picked) return;
    const s = picked.sample;
    const t = Math.max(time, this.ctx.currentTime);
    // striking a key again ends its previous sound (the hammer stops the string), also for unisons
    for (const v of this.voices) if (!v.released && v.ch === ch && v.midi === midi) this.release(v, t, 0.03);
    const src = this.ctx.createBufferSource();
    src.buffer = s.buffer;
    const tune = line ? -(s.cents ?? 0) : "cents" in picked ? picked.cents : 0;
    src.playbackRate.value = 2 ** (((line?.midi ?? midi) - s.midi) / 12 + tune / 1200);
    const env = this.ctx.createGain();
    env.gain.value = picked.gain;
    src.connect(env).connect(this.channel(ch));
    src.start(t, s.offset);
    const voice: Voice = { ch, midi, src, env, start: t, released: false, release: line?.release ?? 0.12 };
    src.onended = () => {
      this.voices = this.voices.filter((x) => x !== voice);
      env.disconnect();
    };
    this.voices.push(voice);
    // too many ringing notes (long tremolos): let the oldest go quickly
    if (this.voices.length > MAX_VOICES) this.release(this.voices[0], t, 0.03);
  }

  private release(v: Voice, time: number, tau: number) {
    if (v.released) return;
    v.released = true;
    const t = Math.max(time, v.start, this.ctx.currentTime);
    v.env.gain.cancelScheduledValues(t);
    v.env.gain.setValueAtTime(v.env.gain.value, t);
    v.env.gain.setTargetAtTime(0, t, tau);
    try {
      v.src.stop(t + tau * 6);
    } catch {
      /* already stopped */
    }
  }

  noteOff(ch: number, midi: number, time: number) {
    // the oldest sounding note on this key that began before the release
    const v = this.voices.find((x) => !x.released && x.ch === ch && x.midi === midi && x.start <= time + 1e-4);
    // a piano damper (or a breath, a bow lifting): a short, soft release rather than a click
    if (v) this.release(v, time, v.release);
  }

  allSoundOff(ch: number, time: number) {
    for (const v of this.voices) if (v.ch === ch) this.release(v, time, 0.01);
    const sg = this.singers.get(ch);
    if (sg) this.stopSinger(sg, time);
  }

  setChannelGain(ch: number, gain: number) {
    this.channel(ch).gain.value = gain;
  }

  setMasterMuted(muted: boolean, time: number) {
    const g = this.master.gain;
    const t = Math.max(time, this.ctx.currentTime);
    g.cancelScheduledValues(t);
    if (muted) {
      g.setValueAtTime(g.value, t);
      g.linearRampToValueAtTime(0, t + 0.012);
    } else {
      g.setValueAtTime(0, t);
      g.linearRampToValueAtTime(1, t + 0.004);
    }
  }

  click(time: number, accent: boolean) {
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.frequency.value = accent ? 1760 : 1320;
    env.gain.setValueAtTime(0, time);
    env.gain.linearRampToValueAtTime(accent ? 1 : 0.6, time + 0.002);
    env.gain.exponentialRampToValueAtTime(0.0001, time + 0.06);
    osc.connect(env).connect(this.clickBus);
    osc.start(time);
    osc.stop(time + 0.08);
    this.clicks.push(osc);
    osc.onended = () => (this.clicks = this.clicks.filter((c) => c !== osc));
  }

  cancelClicks() {
    for (const c of this.clicks) {
      try {
        c.stop();
      } catch {
        /* already stopped */
      }
    }
    this.clicks = [];
  }

  setMasterVolume(v: number) {
    this.clickBus.gain.value = 0.35 * v;
  }
}

/** MP3 files begin with a few milliseconds of encoder silence; skip it so every note starts on time. */
function leadingSilence(b: AudioBuffer): number {
  const data = b.getChannelData(0);
  const limit = Math.min(data.length, Math.round(b.sampleRate * 0.1));
  for (let i = 0; i < limit; i++) if (Math.abs(data[i]) > 0.002) return Math.max(0, i - 8) / b.sampleRate;
  return 0;
}
