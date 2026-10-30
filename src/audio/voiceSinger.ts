/**
 * A singing voice played live: one VocalSet singer (singer f1, a soprano, from her slow scales on "ah"), stored as a
 * voice bank (scripts/voice/bank.py) and sung note by note as the playback engine sends notes, so it follows any
 * tempo, loop or jump.
 *
 * The bank holds, for each note the singer recorded, a short pulse per 10 ms frame: the voice's colour for one
 * glottal pulse (a minimum-phase impulse response), plus one breath grain (shaped noise). A note is sung by adding
 * one pulse per period of a pitch curve: a short glide from the previous note when they touch, then one even
 * vibrato that fades in after the onset and keeps its phase across a legato join. Colour blends from the previous
 * note's pulse over the first 50 ms. Nothing is resampled or looped, so the voice keeps its colour at every pitch
 * and length. The same algorithm in Python (scripts/voice/singer.py) checks it offline.
 */

const VIB_RATE = 5.4; // Hz
const VIB_DEPTH = 0.32; // semitones, peak
const VIB_DELAY = 0.22; // s after the onset before the vibrato starts
const VIB_RISE = 0.35; // s for it to reach full depth
const GLIDE = 0.07; // s: pitch glide into a note joined to the last
const BLEND = 0.05; // s: colour blend from the last note
const ATTACK = 0.04; // s: onset of a note after a rest
export const VOICE_RELEASE = 0.09; // s: how a note ends
const LEGATO = 0.06; // s: a note starting this close to the last one's end is joined to it

export interface VoiceBankMeta {
  name: string;
  sampleRate: number;
  step: number;
  pulse: number;
  noise: number;
  notes: { midi: number; hz: number; frames: number; pulses: number; noise: number; scale: number }[];
}

interface BankNote {
  midi: number;
  pulses: Float32Array[]; // one per frame, each `pulse` samples
  noise: Float32Array;
}

export class VoiceBank {
  readonly notes: BankNote[];
  readonly sampleRate: number;
  readonly step: number;
  readonly R: number;
  readonly lo: number;
  readonly hi: number;

  constructor(meta: VoiceBankMeta, data: Int16Array) {
    this.sampleRate = meta.sampleRate;
    this.step = meta.step;
    this.R = meta.pulse;
    this.notes = meta.notes.map((n) => {
      const pulses: Float32Array[] = [];
      for (let f = 0; f < n.frames; f++) {
        const p = new Float32Array(meta.pulse);
        const o = n.pulses + f * meta.pulse;
        for (let i = 0; i < meta.pulse; i++) p[i] = data[o + i] * n.scale;
        pulses.push(p);
      }
      const noise = new Float32Array(meta.noise);
      for (let i = 0; i < meta.noise; i++) noise[i] = data[n.noise + i] * n.scale;
      return { midi: n.midi, pulses, noise };
    });
    this.lo = this.notes[0].midi;
    this.hi = this.notes[this.notes.length - 1].midi;
  }

  static async load(meta: VoiceBankMeta, binUrl: string): Promise<VoiceBank> {
    const res = await fetch(binUrl);
    if (!res.ok) throw new Error("The voice could not be loaded");
    return new VoiceBank(meta, new Int16Array(await res.arrayBuffer()));
  }

  /** the recorded note nearest this pitch (a note just above wins a tie: a voice darkens less going down) */
  nearest(midi: number): BankNote {
    let best = this.notes[0];
    for (const n of this.notes) {
      const d = Math.abs(n.midi - midi);
      const bd = Math.abs(best.midi - midi);
      if (d < bd || (d === bd && n.midi > best.midi)) best = n;
    }
    return best;
  }
}

/** One singer on one line: remembers the last note so the next can join it. */
export class VoiceSinger {
  private prev: { end: number; midi: number; pulse: Float32Array; phase: number } | null = null;
  private seed = 0x2545f491;

  constructor(private bank: VoiceBank) {}

  private rnd() {
    this.seed ^= this.seed << 13;
    this.seed ^= this.seed >>> 17;
    this.seed ^= this.seed << 5;
    return (this.seed >>> 0) / 4294967296;
  }

  /** forget the last note (after a stop or a jump, the next note starts fresh) */
  reset() {
    this.prev = null;
  }

  /**
   * Sing one note: `t` its start on the audio clock, `d` its length in seconds, `gain` its level. Returns the audio
   * (mono, at the bank's rate), which ends with a short release after `d`.
   */
  sing(t: number, d: number, midi: number, gain: number): Float32Array {
    const b = this.bank;
    const sr = b.sampleRate;
    const R = b.R;
    const prev = this.prev && Math.abs(t - this.prev.end) < LEGATO ? this.prev : null;
    const fromMidi = prev ? prev.midi : midi;
    let phase = prev ? prev.phase : this.rnd() * 2 * Math.PI;
    const note = b.nearest(midi);
    const L = note.pulses.length;
    const period2 = 2 * Math.max(1, L - 1);
    const n = Math.ceil((d + VOICE_RELEASE) * sr) + R + 2;
    const y = new Float32Array(n);
    const frame = (ts: number) => {
      const k = Math.floor(ts / b.step) % period2;
      return note.pulses[Math.min(L - 1, k < L ? k : period2 - k)];
    };
    const blend = new Float32Array(R);
    let tp = 0;
    const end = d * sr;
    while (tp < end) {
      const ts = tp / sr;
      let g = prev ? Math.min(1, ts / GLIDE) : 1;
      g = 0.5 - 0.5 * Math.cos(Math.PI * g);
      const base = fromMidi + (midi - fromMidi) * g;
      const ve = Math.min(1, Math.max(0, (ts - VIB_DELAY) / VIB_RISE));
      const baseHz = 440 * Math.pow(2, (base - 69) / 12);
      phase += (2 * Math.PI * VIB_RATE) / baseHz;
      const hz = 440 * Math.pow(2, (base + VIB_DEPTH * ve * Math.sin(phase) - 69) / 12);
      const period = sr / hz;
      let pulse = frame(ts);
      if (prev && ts < BLEND) {
        const w = 0.5 - 0.5 * Math.cos((Math.PI * ts) / BLEND);
        for (let i = 0; i < R; i++) blend[i] = prev.pulse[i] * (1 - w) + pulse[i] * w;
        pulse = blend;
      }
      const env = (prev ? 1 : Math.min(1, ts / ATTACK)) * gain;
      const i0 = Math.floor(tp);
      const frac = tp - i0;
      const a0 = (1 - frac) * env;
      const a1 = frac * env;
      for (let i = 0; i < R; i++) {
        const v = pulse[i];
        y[i0 + i] += v * a0;
        y[i0 + i + 1] += v * a1;
      }
      // breath: a period-long slice of the note's noise
      const pl = Math.floor(period);
      const o = Math.floor(this.rnd() * (note.noise.length - pl));
      for (let i = 0; i < pl && i0 + i < n; i++) y[i0 + i] += note.noise[o + i] * env;
      tp += period;
    }
    // release
    const e = Math.floor(end);
    const r = Math.floor(VOICE_RELEASE * sr);
    for (let i = e; i < n; i++) {
      const k = i - e;
      y[i] *= k < r ? 1 - k / r : 0;
    }
    this.prev = { end: t + d, midi, pulse: frame(d).slice(), phase };
    return y;
  }
}
