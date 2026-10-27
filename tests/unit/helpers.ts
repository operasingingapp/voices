import { readFileSync } from "node:fs";
import type { CompiledEdition, CompiledLanguage } from "../../shared/types";
import type { SynthPort } from "../../src/audio/engine";

export function loadEdition(id: string): CompiledEdition {
  return JSON.parse(readFileSync(`data/content/${id}/edition.json`, "utf8"));
}
export function loadLanguage(id: string): CompiledLanguage {
  return JSON.parse(readFileSync(`data/content/${id}/language.json`, "utf8"));
}

interface Timed {
  t: number;
  seq: number;
  kind: "on" | "off" | "kill";
  ch: number;
  midi?: number;
  vel?: number;
}

/**
 * A fake synthesiser that models timed MIDI events the way SpessaSynth does (a time-sorted queue
 * that cannot be cancelled) so tests can check what is actually sounding at any clock time.
 */
export class FakePort implements SynthPort {
  now = 0;
  latency = 0;
  gains = new Map<number, number>();
  masterMuted = false;
  clicks: { t: number; accent: boolean }[] = [];
  queue: Timed[] = [];
  processed: Timed[] = [];
  sounding = new Map<string, number>(); // `${ch}:${midi}` -> count of attacks without release
  private seq = 0;

  currentTime() {
    return this.now;
  }
  outputTime() {
    return this.now - this.latency;
  }
  noteOn(ch: number, midi: number, vel: number, t: number) {
    this.push({ t, kind: "on", ch, midi, vel });
  }
  noteOff(ch: number, midi: number, t: number) {
    this.push({ t, kind: "off", ch, midi });
  }
  allSoundOff(ch: number, t: number) {
    this.push({ t, kind: "kill", ch });
  }
  setChannelGain(ch: number, g: number) {
    this.gains.set(ch, g);
  }
  setMasterMuted(m: boolean) {
    this.masterMuted = m;
  }
  click(t: number, accent: boolean) {
    this.clicks.push({ t, accent });
  }
  cancelClicks() {
    this.clicks = this.clicks.filter((c) => c.t < this.now);
  }
  private push(e: Omit<Timed, "seq">) {
    this.queue.push({ ...e, t: Math.max(e.t, this.now), seq: this.seq++ });
    this.queue.sort((a, b) => a.t - b.t || a.seq - b.seq);
  }
  /** Advance the clock, executing due events in order (like the worklet's render loop). */
  advance(to: number) {
    while (this.queue.length && this.queue[0].t <= to + 1e-9) {
      const e = this.queue.shift()!;
      this.processed.push(e);
      if (e.kind === "on") {
        const k = `${e.ch}:${e.midi}`;
        this.sounding.set(k, 1); // a re-attack of a sounding key is still one key down
      } else if (e.kind === "off") {
        this.sounding.delete(`${e.ch}:${e.midi}`);
      } else {
        for (const k of [...this.sounding.keys()]) if (k.startsWith(`${e.ch}:`)) this.sounding.delete(k);
      }
    }
    this.now = to;
  }
  soundingKeys() {
    return [...this.sounding.keys()];
  }
}

/** Drive an engine for `seconds` of clock time with a 25 ms timer. */
export function run(port: FakePort, engine: { tick(): void }, seconds: number, step = 0.025) {
  const end = port.now + seconds;
  while (port.now < end - 1e-9) {
    port.advance(Math.min(end, port.now + step));
    engine.tick();
  }
  port.advance(port.now);
}
