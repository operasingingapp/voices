/**
 * Counterpart playback engine.
 *
 * One clock: every note-on/off, count-in click and loop jump is scheduled against the audio
 * device's clock (AudioContext.currentTime) through a short look-ahead. The visual position is
 * derived from the same anchors, so the highlight follows exactly what is scheduled.
 *
 * Anchors map clock time to the performance timeline: q(t) = secToQ(sec(anchor.q) + (t - anchor.t) * f).
 * A tempo change adds an anchor at the scheduling frontier, a loop wrap adds an anchor at the loop end.
 * Tempo changes therefore never change pitch (notes are synthesised, not resampled) and all parts
 * stay on the same anchor.
 */
import { beatInfo, type Performance, type PerfNote } from "../../shared/timeline";
import type { PlaybackPart } from "../../shared/types";

export interface SynthPort {
  currentTime(): number; // scheduling clock (seconds)
  outputTime(): number; // clock time currently reaching the speakers
  noteOn(channel: number, midi: number, velocity: number, time: number): void;
  noteOff(channel: number, midi: number, time: number): void;
  allSoundOff(channel: number, time: number): void;
  setChannelGain(channel: number, gain: number): void;
  setMasterMuted(muted: boolean, time: number): void;
  click(time: number, accent: boolean): void;
  cancelClicks(): void;
  /** how much of the sound goes into the room, 1 = the default hall (ports without a room ignore it) */
  setRoom?(level: number): void;
}

export interface MixState {
  volume: number; // 0..1
  muted: boolean;
  solo: boolean;
}

export type EngineState = "stopped" | "playing" | "paused";

export interface EngineEvent {
  kind: "on" | "off" | "kill" | "click";
  part?: string;
  channel: number;
  midi?: number;
  time: number;
  q?: number;
}

interface Anchor {
  t: number;
  q: number;
  f: number;
}

interface Active {
  ev: PerfNote;
  channel: number;
  offQ: number;
}

const EPS = 1e-6;

/** When a note's sound stops: its written end, or later when the sustain pedal holds it. */
const soundOff = (ev: PerfNote) => ev.soundOffQ ?? ev.offQ;

export class PlaybackEngine {
  readonly lookahead: number;
  readonly startDelay: number;
  private port: SynthPort;
  private perf?: Performance;
  private parts = new Map<string, PlaybackPart>();
  private mix = new Map<string, MixState>();
  private _state: EngineState = "stopped";
  private cursorQ = 0;
  private tempoFactor = 1;
  private loop: { startQ: number; endQ: number } | null = null;
  private countIn = false;
  private anchors: Anchor[] = [];
  private schedQ = 0;
  private noteIdx = 0;
  private active = new Map<string, Active>();
  private sounding = new Map<string, number>(); // `${ch}:${midi}` -> overlapping notes
  private quietUntil = 0;
  private lastScheduledT = 0;
  private endAt: number | null = null;
  private startT = 0;
  private countInBeats: number[] = [];
  private listeners = new Set<() => void>();
  /** Optional event log (tests and diagnostics). */
  log: EngineEvent[] | null = null;

  constructor(port: SynthPort, opts: { lookahead?: number; startDelay?: number } = {}) {
    this.port = port;
    // a generous look-ahead: on a busy tablet the page can stall for a moment (drawing the score),
    // and notes scheduled only 120 ms ahead would then arrive late and the pulse would wobble
    this.lookahead = opts.lookahead ?? 0.3;
    this.startDelay = opts.startDelay ?? 0.08;
  }

  /* ---------------- setup ---------------- */

  setPerformance(perf: Performance, parts: PlaybackPart[]) {
    const keepQ = this.perf ? this.perf.toPerfQ(this.perf.toPos(this.cursorQ)) : 0;
    if (this._state === "playing") this.silence();
    this.perf = perf;
    this.parts = new Map(parts.map((p) => [p.key, p]));
    for (const p of parts) if (!this.mix.has(p.key)) this.mix.set(p.key, { volume: p.defaultVolume, muted: false, solo: false });
    this.cursorQ = Math.min(keepQ, perf.totalQ);
    this._state = this._state === "playing" ? "paused" : this._state;
    this.applyMix();
    this.emit();
  }

  get performance() {
    return this.perf;
  }

  get state(): EngineState {
    return this._state;
  }

  get tempo() {
    return this.tempoFactor;
  }

  get countInEnabled() {
    return this.countIn;
  }

  get loopRange() {
    return this.loop;
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit() {
    for (const l of this.listeners) l();
  }

  /* ---------------- mix ---------------- */

  getMix(key: string): MixState {
    return this.mix.get(key) ?? { volume: 0.8, muted: false, solo: false };
  }

  setMix(key: string, patch: Partial<MixState>) {
    this.mix.set(key, { ...this.getMix(key), ...patch });
    this.applyMix();
    this.emit();
  }

  /** Effective gain per part: solo wins over mute; a part is audible if soloed, or if nothing is soloed and it is not muted. */
  effectiveGain(key: string): number {
    const anySolo = [...this.mix.values()].some((m) => m.solo);
    const m = this.getMix(key);
    const audible = anySolo ? m.solo : !m.muted;
    return audible ? m.volume : 0;
  }

  private applyMix() {
    for (const p of this.parts.values()) this.port.setChannelGain(p.channel, this.effectiveGain(p.key));
  }

  /* ---------------- transport ---------------- */

  setCountIn(on: boolean) {
    this.countIn = on;
    this.emit();
  }

  setTempoFactor(f: number) {
    f = Math.max(0.25, Math.min(2, f));
    if (Math.abs(f - this.tempoFactor) < EPS) return;
    this.tempoFactor = f;
    if (this._state === "playing") {
      const a = this.anchor();
      if (this.port.currentTime() < this.startT) {
        // still counting in: the music starts at the planned time with the new tempo
        a.f = f;
      } else {
        const t = this.timeOf(this.schedQ);
        this.anchors.push({ t, q: this.schedQ, f });
        this.trimAnchors();
      }
      if (this.endAt !== null) this.endAt = this.timeOf(this.segmentEnd());
    }
    this.emit();
  }

  setLoop(range: { startQ: number; endQ: number } | null) {
    const next = range && range.endQ > range.startQ + EPS ? { startQ: range.startQ, endQ: range.endQ } : null;
    const same = (!next && !this.loop) || (!!next && !!this.loop && Math.abs(next.startQ - this.loop.startQ) < EPS && Math.abs(next.endQ - this.loop.endQ) < EPS);
    if (same) return; // re-applying the same loop must not move the cursor
    this.loop = next;
    if (this._state === "playing" && this.loop) {
      const q = this.currentQ();
      if (q < this.loop.startQ - EPS || q >= this.loop.endQ - EPS || this.schedQ > this.loop.endQ + EPS) {
        this.seek(this.loop.startQ);
        return;
      }
      this.endAt = null;
    } else if (this._state !== "playing" && this.loop) {
      if (this.cursorQ < this.loop.startQ || this.cursorQ >= this.loop.endQ) this.cursorQ = this.loop.startQ;
    }
    this.emit();
  }

  play(fromQ?: number) {
    const perf = this.perf;
    if (!perf || this._state === "playing") return;
    let q0 = fromQ ?? this.cursorQ;
    if (this.loop && (q0 < this.loop.startQ - EPS || q0 >= this.loop.endQ - EPS)) q0 = this.loop.startQ;
    if (q0 >= perf.totalQ - EPS) q0 = this.loop ? this.loop.startQ : 0;
    q0 = Math.max(0, q0);

    const now = this.port.currentTime();
    const t0 = Math.max(now + this.startDelay, this.quietUntil + 0.01);
    this.port.setMasterMuted(false, t0 - 0.004);
    let tStart = t0;
    this.countInBeats = [];
    if (this.countIn) {
      const l = perf.locate(q0);
      const { unitQ, beats } = beatInfo(perf.edition.measures[l.m].time);
      const beatSec = (unitQ * 60) / (perf.bpmAt(q0) * this.tempoFactor);
      for (let k = 0; k < beats; k++) {
        const t = t0 + k * beatSec;
        this.port.click(t, k === 0);
        this.countInBeats.push(t);
        this.log?.push({ kind: "click", channel: -1, time: t });
      }
      tStart = t0 + beats * beatSec;
    }
    this.startT = tStart;
    this.anchors = [{ t: tStart, q: q0, f: this.tempoFactor }];
    this.endAt = null;
    this.resetCursor(q0, tStart);
    this._state = "playing";
    this.tick();
    this.emit();
  }

  pause() {
    if (this._state !== "playing") return;
    const q = this.displayQ();
    this.silence();
    this.cursorQ = q;
    this._state = "paused";
    this.emit();
  }

  stop() {
    if (this._state === "playing") this.silence();
    this.cursorQ = this.loop ? this.loop.startQ : 0;
    this._state = "stopped";
    this.emit();
  }

  seek(q: number) {
    if (!this.perf) return;
    q = Math.max(0, Math.min(q, this.perf.totalQ - EPS));
    if (this._state === "playing") {
      this.silence();
      this._state = "paused";
      this.cursorQ = q;
      this.play(q);
    } else {
      this.cursorQ = q;
      if (this._state === "stopped") this._state = "paused";
      this.emit();
    }
  }

  /** Stop everything that is sounding or queued. Queued events that the synth cannot cancel are killed by a timed "all sound off" before anything new can start. */
  private silence() {
    const now = this.port.currentTime();
    this.port.setMasterMuted(true, now);
    this.port.cancelClicks();
    const killT = Math.max(now, this.lastScheduledT) + 0.02;
    const channels = new Set([...this.parts.values()].map((p) => p.channel));
    for (const ch of channels) {
      this.port.allSoundOff(ch, killT);
      this.log?.push({ kind: "kill", channel: ch, time: killT });
    }
    this.quietUntil = killT + 0.01;
    this.active.clear();
    this.sounding.clear();
    this.endAt = null;
    this.countInBeats = [];
  }

  /** The piece has ended by itself: every note-off is already scheduled, so the last chord and the room ring out (no muting). */
  private finish() {
    this.quietUntil = Math.max(this.port.currentTime(), this.lastScheduledT);
    this.active.clear();
    this.sounding.clear();
    this.endAt = null;
    this.countInBeats = [];
  }

  /* ---------------- clock ---------------- */

  private anchor(): Anchor {
    return this.anchors[this.anchors.length - 1];
  }

  private trimAnchors() {
    const now = this.port.outputTime() - 1;
    while (this.anchors.length > 2 && this.anchors[1].t < now) this.anchors.shift();
  }

  /** Clock time at which performance position q sounds (current anchor, same loop pass). */
  timeOf(q: number): number {
    const a = this.anchor();
    const perf = this.perf!;
    return a.t + (perf.qToSec(q) - perf.qToSec(a.q)) / a.f;
  }

  private qAtWith(a: Anchor, t: number): number {
    const perf = this.perf!;
    return perf.secToQ(perf.qToSec(a.q) + (t - a.t) * a.f);
  }

  private segmentEnd(): number {
    return this.loop ? this.loop.endQ : this.perf!.totalQ;
  }

  /** Position at the scheduling clock (used when pausing). */
  currentQ(): number {
    return this.positionAt(this.port.currentTime());
  }

  private positionAt(t: number): number {
    if (this._state !== "playing" || !this.anchors.length) return this.cursorQ;
    let a = this.anchors[0];
    for (const x of this.anchors) if (x.t <= t + EPS) a = x;
    if (t < a.t) return a.q; // counting in
    const q = this.qAtWith(a, t);
    const next = this.anchors.find((x) => x.t > a.t);
    const segEnd = this.segmentEnd();
    return Math.min(q, next && this.loop ? this.loop.endQ : segEnd);
  }

  /** Position currently audible — drives the highlight and the shared marker. */
  displayQ(): number {
    return this.positionAt(this.port.outputTime());
  }

  /** Remaining count-in beats at the audible clock (0 when not counting in). */
  countInRemaining(): number {
    if (this._state !== "playing") return 0;
    const t = this.port.outputTime();
    return this.countInBeats.filter((b) => b >= t - EPS).length;
  }

  /** Current speed in quarters per (wall) second, for followers' extrapolation. */
  qPerSec(): number {
    if (this._state !== "playing" || !this.perf) return 0;
    if (this.port.outputTime() < this.startT) return 0;
    return this.perf.qPerSecAt(this.displayQ()) * this.anchor().f;
  }

  /* ---------------- scheduling ---------------- */

  private resetCursor(q0: number, t: number) {
    const perf = this.perf!;
    this.schedQ = q0;
    this.active.clear();
    this.sounding.clear();
    let i = 0;
    while (i < perf.notes.length && perf.notes[i].onQ < q0 - EPS) i++;
    this.noteIdx = i;
    // notes already sounding at q0 (held notes, ties into the start) are re-attacked at t
    const segEnd = this.segmentEnd();
    for (let k = 0; k < i; k++) {
      const ev = perf.notes[k];
      if (ev.offQ > q0 + 0.05) this.startNote(ev, t, Math.min(soundOff(ev), segEnd), q0);
    }
  }

  private channelOf(part: string): number {
    return this.parts.get(part)?.channel ?? 0;
  }

  private startNote(ev: PerfNote, t: number, offQ: number, q: number) {
    const ch = this.channelOf(ev.part);
    const p = this.parts.get(ev.part);
    const vel = Math.max(1, Math.min(127, Math.round(ev.vel * (p?.velocityScale ?? 1))));
    const k = `${ch}:${ev.midi}`;
    this.sounding.set(k, (this.sounding.get(k) ?? 0) + 1);
    this.port.noteOn(ch, ev.midi, vel, t);
    this.lastScheduledT = Math.max(this.lastScheduledT, t);
    this.log?.push({ kind: "on", part: ev.part, channel: ch, midi: ev.midi, time: t, q });
    this.active.set(ev.key, { ev, channel: ch, offQ });
  }

  private endNote(a: Active, t: number, q: number) {
    const k = `${a.channel}:${a.ev.midi}`;
    const n = (this.sounding.get(k) ?? 1) - 1;
    if (n <= 0) {
      this.sounding.delete(k);
      this.port.noteOff(a.channel, a.ev.midi, t);
      this.log?.push({ kind: "off", part: a.ev.part, channel: a.channel, midi: a.ev.midi, time: t, q });
    } else this.sounding.set(k, n);
    this.lastScheduledT = Math.max(this.lastScheduledT, t);
  }

  /** Called by the timer (every ~25 ms) and immediately after play. */
  tick() {
    if (this._state !== "playing" || !this.perf) return;
    const perf = this.perf;
    const now = this.port.currentTime();
    if (this.endAt !== null) {
      if (now > this.endAt + 0.05) {
        this.finish();
        this._state = "stopped";
        this.cursorQ = 0;
        this.emit();
      }
      return;
    }
    const horizon = now + this.lookahead;
    for (let guard = 0; guard < 64; guard++) {
      const segEnd = this.segmentEnd();
      const tEnd = this.timeOf(segEnd);
      const reach = tEnd <= horizon;
      const targetQ = reach ? segEnd : Math.min(segEnd, this.qAtWith(this.anchor(), horizon));
      if (targetQ > this.schedQ - EPS) this.scheduleRange(targetQ, segEnd, reach);
      if (!reach) break;
      if (this.loop) {
        // jump: everything still sounding ends at the loop end, then the loop start begins on the same clock
        this.anchors.push({ t: tEnd, q: this.loop.startQ, f: this.anchor().f });
        this.trimAnchors();
        this.resetCursor(this.loop.startQ, tEnd);
        continue;
      }
      this.endAt = tEnd;
      break;
    }
  }

  private scheduleRange(targetQ: number, segEnd: number, reachesEnd: boolean) {
    const perf = this.perf!;
    type Item = { q: number; off: boolean; ev?: PerfNote; a?: Active };
    const batch: Item[] = [];
    while (this.noteIdx < perf.notes.length && perf.notes[this.noteIdx].onQ < targetQ - EPS) {
      const ev = perf.notes[this.noteIdx++];
      if (ev.onQ < this.schedQ - EPS) continue;
      if (ev.onQ >= segEnd - EPS) continue;
      batch.push({ q: ev.onQ, off: false, ev });
    }
    // Note-offs: everything that ends inside this window; at the end of a segment (loop end or
    // end of piece) *everything* still sounding ends there, so nothing can hang across a jump.
    const ends = (offQ: number) => reachesEnd || offQ < targetQ - EPS;
    for (const a of this.active.values()) if (ends(a.offQ)) batch.push({ q: Math.min(a.offQ, segEnd), off: true, a });
    for (const b of [...batch]) {
      if (b.off) continue;
      const offQ = Math.min(soundOff(b.ev!), segEnd);
      if (ends(offQ)) batch.push({ q: offQ, off: true, a: { ev: b.ev!, channel: this.channelOf(b.ev!.part), offQ } });
    }
    // offs before ons at the same instant so repeated notes re-attack cleanly
    batch.sort((x, y) => x.q - y.q || (x.off === y.off ? 0 : x.off ? -1 : 1));
    for (const b of batch) {
      const t = this.timeOf(b.q);
      if (b.off) {
        this.active.delete(b.a!.ev.key);
        this.endNote(b.a!, t, b.q);
      } else {
        this.startNote(b.ev!, t, Math.min(soundOff(b.ev!), segEnd), b.q);
      }
    }
    // notes whose off is already queued are no longer "active"
    for (const b of batch) if (b.off) this.active.delete(b.a!.ev.key);
    this.schedQ = targetQ;
  }

  /** Number of notes the engine believes are sounding (for diagnostics/tests). */
  activeCount(): number {
    return this.active.size;
  }
}
