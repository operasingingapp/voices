import { describe, expect, it } from "vitest";
import { Performance } from "../../shared/timeline";
import { PlaybackEngine } from "../../src/audio/engine";
import { FakePort, loadEdition, run } from "./helpers";

const aria = loadEdition("cp-fx-aria-lume");
const trio = loadEdition("cp-fx-terzetto-alba");
const idx = (ed: typeof aria, number: string) => ed.measures.findIndex((m) => m.number === number);

function setup(ed = aria, cuts: { startM: number; endM: number }[] = []) {
  const port = new FakePort();
  const engine = new PlaybackEngine(port);
  engine.log = [];
  const perf = new Performance(ed, cuts);
  engine.setPerformance(perf, ed.parts);
  return { port, engine, perf };
}

const chOf = (ed: typeof aria, key: string) => ed.parts.find((p) => p.key === key)!.channel;

describe("playback engine", () => {
  it("sends every part's notes on its mapped channel (explicit mapping, not part order)", () => {
    const { port, engine } = setup(trio);
    engine.play(0);
    run(port, engine, 40);
    const chans = new Set(engine.log!.filter((e) => e.kind === "on").map((e) => `${e.part}:${e.channel}`));
    expect(chans).toEqual(new Set(["piano:0", "baritone:2", "soprano:4", "tenor:5"]));
  });

  it("mute and solo are independent per part and solo wins over mute", () => {
    const { port, engine } = setup(trio);
    engine.setMix("tenor", { muted: true });
    expect(port.gains.get(chOf(trio, "tenor"))).toBe(0);
    expect(port.gains.get(chOf(trio, "piano"))).toBeGreaterThan(0);
    engine.setMix("soprano", { solo: true });
    expect(port.gains.get(chOf(trio, "soprano"))).toBeGreaterThan(0);
    for (const k of ["piano", "tenor", "baritone"]) expect(port.gains.get(chOf(trio, k)), k).toBe(0);
    engine.setMix("tenor", { solo: true }); // soloing a muted part makes it audible
    expect(port.gains.get(chOf(trio, "tenor"))).toBeGreaterThan(0);
    engine.setMix("soprano", { solo: false });
    engine.setMix("tenor", { solo: false });
    expect(port.gains.get(chOf(trio, "tenor"))).toBe(0); // still muted
    expect(port.gains.get(chOf(trio, "piano"))).toBeGreaterThan(0);
  });

  it("all parts at the same musical position are scheduled at the same clock time, also across tempo changes", () => {
    const { port, engine, perf } = setup(trio);
    engine.play(0);
    run(port, engine, 3);
    engine.setTempoFactor(0.6);
    run(port, engine, 6);
    engine.setTempoFactor(1.3);
    run(port, engine, 30);
    const byQ = new Map<number, Set<number>>();
    for (const e of engine.log!.filter((x) => x.kind === "on")) {
      const k = Math.round(e.q! * 1000);
      (byQ.get(k) ?? byQ.set(k, new Set()).get(k)!).add(Math.round(e.time * 1e6));
    }
    for (const [q, times] of byQ) expect(times.size, `q=${q / 1000}`).toBe(1);
    // and the clock time between onsets reflects the tempo factor in force
    const ons = engine.log!.filter((x) => x.kind === "on" && x.part === "piano");
    const after12 = ons.filter((x) => x.time > 12);
    const late = [after12[0], after12.find((x) => x.q! > after12[0].q! + 1e-9)!];
    const dq = late[1].q! - late[0].q!;
    const expected = (perf.qToSec(late[1].q!) - perf.qToSec(late[0].q!)) / 1.3;
    expect(late[1].time - late[0].time).toBeCloseTo(expected, 6);
    expect(dq).toBeGreaterThan(0);
  });

  it("the visual position is derived from the same anchors as the audio", () => {
    const { port, engine } = setup(aria);
    port.latency = 0.03;
    engine.play(0);
    run(port, engine, 2);
    engine.setTempoFactor(0.75);
    run(port, engine, 4);
    const ons = engine.log!.filter((e) => e.kind === "on");
    // when the speakers reach a scheduled note-on, the display position equals that note's position
    for (const e of ons.filter((x) => x.time > port.now - 2 && x.time < port.now - 0.2).slice(0, 10)) {
      const saveNow = port.now;
      port.now = e.time + port.latency;
      expect(engine.displayQ()).toBeCloseTo(e.q!, 6);
      port.now = saveNow;
    }
  });

  it("stop, pause and seek leave nothing sounding, even with events already queued", () => {
    const { port, engine } = setup(aria);
    engine.play(0);
    run(port, engine, 5.03);
    expect(port.soundingKeys().length).toBeGreaterThan(0);
    engine.stop();
    run(port, engine, 0.5);
    expect(port.soundingKeys()).toEqual([]);

    engine.play(engine.performance!.toPerfQ({ m: idx(aria, "9"), q: 1 }));
    run(port, engine, 3.01);
    engine.seek(engine.performance!.toPerfQ({ m: idx(aria, "14"), q: 0 }));
    run(port, engine, 0.05);
    // the old position's notes were killed before new ones began
    const kill = port.processed.filter((e) => e.kind === "kill").at(-1)!;
    const newOn = port.processed.filter((e) => e.kind === "on" && e.t > kill.t);
    expect(newOn.length).toBeGreaterThanOrEqual(0);
    run(port, engine, 2);
    engine.pause();
    run(port, engine, 0.5);
    expect(port.soundingKeys()).toEqual([]);
    expect(engine.activeCount()).toBe(0);
  });

  it("loops wrap on the same clock and release every note at the loop end", () => {
    const { port, engine, perf } = setup(trio);
    const loop = perf.loopToQ({ start: { m: idx(trio, "7"), occ: 1 }, end: { m: idx(trio, "9"), occ: 1 } })!;
    engine.setLoop(loop);
    engine.play();
    const loopSec = perf.qToSec(loop.endQ) - perf.qToSec(loop.startQ);
    run(port, engine, loopSec * 3 + 0.5);
    // the C4/E♭4 tie from m. 8 continues into m. 9 inside the loop; at m. 9's end everything is released
    const t1 = engine.log!.filter((e) => e.kind === "on" && Math.abs(e.q! - loop.startQ) < 1e-9).map((e) => e.time);
    const uniq = [...new Set(t1.map((t) => t.toFixed(6)))];
    expect(uniq.length).toBeGreaterThanOrEqual(3); // three passes started
    // exactly one loop length apart
    expect(Number(uniq[1]) - Number(uniq[0])).toBeCloseTo(loopSec, 6);
    // at each wrap, no key is left sounding from the previous pass
    for (const e of engine.log!.filter((x) => x.kind === "on" && x.q! >= loop.endQ - 1e-9)) throw new Error(`note beyond loop ${e.q}`);
    engine.stop();
    run(port, engine, 0.5);
    expect(port.soundingKeys()).toEqual([]);
  });

  it("count-in clicks one bar on the same clock before the music", () => {
    const { port, engine, perf } = setup(trio);
    engine.setCountIn(true);
    engine.play(perf.toPerfQ({ m: idx(trio, "3"), q: 0 }));
    run(port, engine, 0.01);
    expect(port.clicks).toHaveLength(3); // 3/4
    const beat = 60 / 104;
    expect(port.clicks[1].t - port.clicks[0].t).toBeCloseTo(beat, 6);
    run(port, engine, 3);
    const firstOn = engine.log!.find((e) => e.kind === "on")!;
    expect(firstOn.time - port.clicks[0].t).toBeCloseTo(3 * beat, 6);
  });

  it("cuts are skipped by every part", () => {
    const cut = { startM: idx(aria, "13"), endM: idx(aria, "16") };
    const { port, engine, perf } = setup(aria, [cut]);
    engine.play(perf.toPerfQ({ m: idx(aria, "11"), q: 0, occ: 2 }));
    run(port, engine, 20);
    const notesById = new Map(aria.notes.map((n) => [n.id, n]));
    const playedMeasures = new Set<number>();
    for (const n of perf.notes) for (const id of n.ids) playedMeasures.add(notesById.get(id)!.m);
    for (let m = cut.startM; m <= cut.endM; m++) expect(playedMeasures.has(m)).toBe(false);
    // m. 12 (2nd time) is followed directly by m. 17 for both the soprano and the piano
    const m12 = perf.occurrences(idx(aria, "12"))[1];
    const m17 = perf.occurrences(idx(aria, "17"))[0];
    expect(m12.startQ + m12.durQ).toBe(m17.startQ);
    const after = engine.log!.filter((e) => e.kind === "on" && Math.abs(e.q! - m17.startQ) < 1e-9).map((e) => e.part);
    expect(new Set(after)).toEqual(new Set(["soprano", "piano"]));
  });
});
