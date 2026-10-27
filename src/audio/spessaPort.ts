/**
 * SynthPort backed by SpessaSynth (AudioWorklet) and a piano-only SoundFont derived from
 * GeneralUser GS. All timing uses the AudioContext clock; SpessaSynth executes timed MIDI
 * events at render-quantum accuracy (~3 ms).
 */
import { WorkletSynthesizer } from "spessasynth_lib";
import processorUrl from "spessasynth_lib/dist/spessasynth_processor.min.js?url";
import type { SynthPort } from "./engine";
import type { PlaybackPart } from "../../shared/types";

const SOUNDBANK_URL = "/soundbank/counterpart-piano.sf2";

/** How the piano sound bank is obtained; the standalone build embeds it instead of fetching. */
let soundbankLoader: () => Promise<ArrayBuffer> = async () => {
  const res = await fetch(SOUNDBANK_URL);
  if (!res.ok) throw new Error("The piano sound bank could not be loaded");
  return res.arrayBuffer();
};
export function setSoundbankLoader(fn: () => Promise<ArrayBuffer>) {
  soundbankLoader = fn;
}

/**
 * iPhone and iPad play Web Audio as "ambient" sound by default: silent when the device is muted or the
 * ring switch is off. Asking for the "playback" audio session (and, on older systems, playing a short
 * silent media element inside the tap) makes the music sound like any music app. Must run in a user gesture.
 */
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
    // 0.1 s of silence as a WAV file, built in memory
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
    el.loop = false;
    el.volume = 0.01;
    void el.play().catch(() => undefined);
  } catch {
    /* media element not available */
  }
}

export class SpessaPort implements SynthPort {
  readonly ctx: AudioContext;
  private synth!: WorkletSynthesizer;
  private master: GainNode;
  private clickBus: GainNode;
  private clicks: AudioScheduledSourceNode[] = [];
  /** Per-channel analysers, created on demand (used by the in-browser self-test). */
  readonly analysers = new Map<number, AnalyserNode>();
  readonly masterAnalyser: AnalyserNode;

  private constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.master = ctx.createGain();
    // The SoundFont piano renders quietly (about -33 dB RMS): lift it by +12 dB into a gentle
    // limiter so it is clearly audible on a tablet speaker without clipping on loud chords.
    const makeup = ctx.createGain();
    makeup.gain.value = 4;
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -12;
    limiter.knee.value = 8;
    limiter.ratio.value = 8;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.25;
    this.master.connect(makeup).connect(limiter).connect(ctx.destination);
    this.masterAnalyser = ctx.createAnalyser();
    this.masterAnalyser.fftSize = 2048;
    limiter.connect(this.masterAnalyser);
    this.clickBus = ctx.createGain();
    this.clickBus.gain.value = 0.35;
    this.clickBus.connect(this.master);
  }

  static async create(onProgress?: (msg: string) => void): Promise<SpessaPort> {
    const ctx = new AudioContext({ latencyHint: "interactive" });
    const port = new SpessaPort(ctx);
    onProgress?.("Loading synthesiser");
    await ctx.audioWorklet.addModule(processorUrl);
    port.synth = new WorkletSynthesizer(ctx);
    onProgress?.("Loading piano sound bank");
    await port.synth.soundBankManager.addSoundBank(await soundbankLoader(), "piano");
    await port.synth.isReady;
    port.synth.connect(port.master);
    port.synth.setSystemParameter("reverbGain", 0.6);
    return port;
  }

  configureParts(parts: PlaybackPart[]) {
    for (const p of parts) {
      this.synth.programChange(p.channel, p.program);
      this.synth.controllerChange(p.channel, 7, 127); // channel volume at full; mixing uses gain
      this.synth.controllerChange(p.channel, 91, p.kind === "voice" ? 50 : 35); // reverb send
    }
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

  noteOn(ch: number, midi: number, vel: number, time: number) {
    this.synth.noteOn(ch, midi, vel, { time });
  }

  noteOff(ch: number, midi: number, time: number) {
    this.synth.noteOff(ch, midi, { time });
  }

  allSoundOff(ch: number, time: number) {
    this.synth.controllerChange(ch, 123, 0, { time }); // all notes off
    this.synth.controllerChange(ch, 120, 0, { time }); // all sound off
  }

  setChannelGain(ch: number, gain: number) {
    this.synth.midiChannels[ch]?.setSystemParameter("gain", gain);
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

  /** Analyser on one MIDI channel's dry output (diagnostics only). */
  channelAnalyser(ch: number): AnalyserNode {
    let a = this.analysers.get(ch);
    if (!a) {
      a = this.ctx.createAnalyser();
      a.fftSize = 2048;
      this.synth.connectChannel(a, ch);
      this.analysers.set(ch, a);
    }
    return a;
  }

  voiceCount(): number {
    return this.synth.voiceCount;
  }

  channelVoiceCount(ch: number): number {
    return this.synth.midiChannels[ch]?.voiceCount ?? 0;
  }

  setMasterVolume(v: number) {
    this.clickBus.gain.value = 0.35 * v;
  }
}
