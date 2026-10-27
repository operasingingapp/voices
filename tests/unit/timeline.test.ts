import { describe, expect, it } from "vitest";
import { Performance, unfoldRepeats } from "../../shared/timeline";
import { loadEdition } from "./helpers";

const aria = loadEdition("cp-fx-aria-lume");
const trio = loadEdition("cp-fx-terzetto-alba");
const idx = (ed: typeof aria, number: string) => ed.measures.findIndex((m) => m.number === number);

describe("performance timeline", () => {
  it("unfolds the aria's repeat into two occurrences of m. 5–12", () => {
    const seq = unfoldRepeats(aria.measures).map((u) => aria.measures[u.m].number);
    expect(seq).toEqual(["1", "2", "3", "4", ...["5", "6", "7", "8", "9", "10", "11", "12"], ...["5", "6", "7", "8", "9", "10", "11", "12"], "13", "14", "15", "16", "17", "18", "19", "20"]);
    const perf = new Performance(aria);
    const occ = perf.occurrences(idx(aria, "7"));
    expect(occ.map((o) => o.occ)).toEqual([1, 2]);
    expect(occ[1].startQ - occ[0].startQ).toBe(32); // 8 bars of 4/4 later
  });

  it("maps musical positions to the timeline and back, including occurrences", () => {
    const perf = new Performance(aria);
    const pos = { m: idx(aria, "9"), q: 2, occ: 2 };
    const q = perf.toPerfQ(pos);
    const back = perf.toPos(q);
    expect(back).toMatchObject(pos);
    expect(perf.describe(q)).toBe("m. 9, beat 3 (2nd time)");
  });

  it("builds the tempo map from MusicXML tempo marks (Andante, Più mosso, Tempo I, rit.)", () => {
    const perf = new Performance(aria);
    const at = (n: string, occ = 1, q = 0) => perf.bpmAt(perf.toPerfQ({ m: idx(aria, n), q, occ }));
    expect(at("1")).toBe(66);
    expect(at("13")).toBe(84);
    expect(at("17")).toBe(66);
    expect(at("19")).toBe(60);
    expect(at("19", 1, 2)).toBe(54);
    expect(at("20")).toBe(46);
    // seconds are consistent with the tempo map: 4 bars of 4/4 at 66 bpm
    expect(perf.qToSec(16)).toBeCloseTo((16 * 60) / 66, 6);
    expect(perf.secToQ(perf.qToSec(123.25))).toBeCloseTo(123.25, 6);
  });

  it("applies cuts to every part and keeps the tempo in force after a cut", () => {
    const b = { startM: idx(aria, "13"), endM: idx(aria, "16") };
    const perf = new Performance(aria, [b]);
    const performed = perf.measures.map((m) => aria.measures[m.m].number);
    expect(performed).not.toContain("13");
    expect(performed).not.toContain("16");
    expect(perf.measures.length).toBe(24);
    for (const part of aria.parts) {
      const inCut = perf.notes.filter((n) => n.part === part.key && n.ids.some((id) => aria.notes.find((x) => x.id === id)!.m >= b.startM && aria.notes.find((x) => x.id === id)!.m <= b.endM));
      expect(inCut, part.key).toHaveLength(0);
    }
    expect(perf.bpmAt(perf.toPerfQ({ m: idx(aria, "17"), q: 0 }))).toBe(66);
    // a position inside the cut resolves to the music after it
    expect(perf.toPerfQ({ m: idx(aria, "14"), q: 1 })).toBe(perf.toPerfQ({ m: idx(aria, "17"), q: 0 }));
  });

  it("merges tied notes only when the tie continues into the performed next measure", () => {
    const perf = new Performance(trio);
    const tied = perf.notes.filter((n) => n.ids.length > 1);
    expect(tied).toHaveLength(2); // C4 and E♭4 tied m. 8 → m. 9 in the piano
    for (const t of tied) expect(t.offQ - t.onQ).toBe(6);
    const cut = new Performance(trio, [{ startM: idx(trio, "9"), endM: idx(trio, "10") }]);
    expect(cut.notes.filter((n) => n.ids.length > 1)).toHaveLength(0);
    // the tie into the cut ends at the barline instead of hanging
    const m8 = cut.occurrences(idx(trio, "8"))[0];
    for (const n of cut.notes.filter((x) => x.p === m8.p)) expect(n.offQ).toBeLessThanOrEqual(m8.startQ + m8.durQ + 1e-9);
  });

  it("loops are expressed with measures and occurrences", () => {
    const perf = new Performance(aria);
    const l = perf.loopToQ({ start: { m: idx(aria, "5"), occ: 2 }, end: { m: idx(aria, "8"), occ: 2 } })!;
    expect(l.endQ - l.startQ).toBe(16);
    expect(perf.locate(l.startQ)).toMatchObject({ occ: 2 });
  });
});
