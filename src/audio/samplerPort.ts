/**
 * SynthPort playing the Salamander Grand Piano (Yamaha C5, recorded by Alexander Holm, CC BY 3.0)
 * through the browser's own Web Audio: no AudioWorklet, no WebAssembly, so it works under strict page
 * policies and on iPad.
 *
 * Samples: every minor third from A0 to C8, at two loudness levels (Salamander layers 6 and 12),
 * trimmed to 9 s with a fade. A note uses the nearest recorded pitch, shifted by at most a semitone and
 * a half; the soft layer loads first so playback can start, the loud layer follows.
 * All timing uses the AudioContext clock, like the SoundFont port it replaces.
 */
import type { SynthPort } from "./engine";
import type { PlaybackPart } from "../../shared/types";

const files = import.meta.glob("../standalone/piano/*.mp3", { query: "?url", import: "default", eager: true }) as Record<string, string>;
// instruments for the sung line, loaded only when chosen (real recordings: VSCO 2 CE, CC0; the English horn
// from Sonatina Symphonic Orchestra, CC Sampling+ 1.0; see voices/README.md)
const lineFiles = import.meta.glob("../standalone/voices/*.mp3", { query: "?url", import: "default", eager: true }) as Record<string, string>;
const lineTuning = import.meta.glob("../standalone/voices/tuning.json", { import: "default", eager: true }) as Record<string, Record<string, number>>;

/** What the sung line can be played on. */
export type LineInstrument = "piano" | "oboe" | "clarinet" | "english-horn" | "bassoon";
const LINE_SOUND: Record<Exclude<LineInstrument, "piano">, { release: number; dbPerStep: number }> = {
  // a held, singing tone: let it go like a breath, not a damper
  oboe: { release: 0.07, dbPerStep: 0.12 },
  clarinet: { release: 0.08, dbPerStep: 0.12 },
  "english-horn": { release: 0.08, dbPerStep: 0.12 },
  bassoon: { release: 0.08, dbPerStep: 0.12 },
};
const isLineKit = (id: string): id is Exclude<LineInstrument, "piano"> => id in LINE_SOUND;

const NOTE: Record<string, number> = { C: 0, Cs: 1, Ds: 3, Fs: 6, A: 9 };
/** midi number of a sample file name such as "Fs3-v6.mp3" */
function sampleMidi(path: string): { midi: number; layer: number } | null {
  const m = /\/([A-G]s?)(\d)-v(\d+)\.mp3$/.exec(path);
  if (!m || NOTE[m[1]] === undefined) return null;
  return { midi: (Number(m[2]) + 1) * 12 + NOTE[m[1]], layer: Number(m[3]) };
}

interface Sample {
  midi: number;
  buffer: AudioBuffer;
  offset: number; // seconds of encoder silence to skip at the start
  cents?: number; // how sharp the recording is (corrected when played)
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
  /** piano samples by loudness layer, each sorted by pitch */
  private layers = new Map<number, Sample[]>();
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
    const byLayer = new Map<number, { midi: number; url: string }[]>();
    for (const [path, url] of Object.entries(files)) {
      const s = sampleMidi(path);
      if (!s) continue;
      byLayer.set(s.layer, [...(byLayer.get(s.layer) ?? []), { midi: s.midi, url }]);
    }
    const layers = [...byLayer.keys()].sort((a, b) => a - b);
    if (!layers.length) throw new Error("The piano samples are missing");
    onProgress?.("Loading the piano");
    // the softer layer first: enough to play; the louder one arrives in the background
    await port.loadLayer(layers[0], byLayer.get(layers[0])!);
    for (const l of layers.slice(1)) void port.loadLayer(l, byLayer.get(l)!).catch(() => undefined);
    return port;
  }

  private async loadLayer(layer: number, list: { midi: number; url: string }[]) {
    const samples = await Promise.all(
      list.map(async ({ midi, url }) => {
        const res = await fetch(url);
        if (!res.ok) throw new Error("A piano sample could not be loaded");
        const buffer = await this.ctx.decodeAudioData(await res.arrayBuffer());
        return { midi, buffer, offset: leadingSilence(buffer) };
      }),
    );
    this.layers.set(layer, samples.sort((a, b) => a.midi - b.midi));
  }

  configureParts(_parts: PlaybackPart[]) {
    /* every part plays on the piano unless setInstrument chooses otherwise */
  }

  /**
   * Play a channel on another instrument. Its recordings load now if they have not yet; until they have
   * arrived (and for notes outside its range) the piano plays, so nothing ever goes silent.
   */
  setInstrument(ch: number, id: string, range?: [number, number]): Promise<void> {
    const kit: LineInstrument = isLineKit(id) ? id : "piano";
    this.channelKit.set(ch, kit);
    this.channelShift.set(ch, 0);
    this.channelRange.set(ch, range);
    if (kit === "piano") return Promise.resolve();
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
   * The recording to use and how loud to play it. Loudness follows the velocity on a gentle scale
   * (0.2 dB per step, so pp to ff spans about 16 dB, which suits accompaniment on a tablet); from forte up
   * the louder recording is used, turned down by the 6 dB it is already louder, so its brighter tone
   * comes in without a jump in level.
   */
  private pick(midi: number, vel: number): { sample: Sample; gain: number } | null {
    const keys = [...this.layers.keys()].sort((a, b) => a - b);
    if (!keys.length) return null;
    const loud = vel >= 80 && keys.length > 1;
    const list = this.layers.get(loud ? keys[keys.length - 1] : keys[0])!;
    let best = list[0];
    for (const s of list) if (Math.abs(s.midi - midi) < Math.abs(best.midi - midi)) best = s;
    const db = (Math.max(1, Math.min(127, vel)) - 64) * 0.2 - (loud ? 6 : 0);
    return { sample: best, gain: 10 ** (db / 20) };
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
    if (!kit || kit === "piano") return null;
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
    const line = this.pickLine(ch, midi, vel);
    const picked = line ?? this.pick(midi, vel);
    if (!picked) return;
    const s = picked.sample;
    const t = Math.max(time, this.ctx.currentTime);
    // striking a key again ends its previous sound (the hammer stops the string), also for unisons
    for (const v of this.voices) if (!v.released && v.ch === ch && v.midi === midi) this.release(v, t, 0.03);
    const src = this.ctx.createBufferSource();
    src.buffer = s.buffer;
    src.playbackRate.value = 2 ** (((line?.midi ?? midi) - s.midi) / 12 - (s.cents ?? 0) / 1200);
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
