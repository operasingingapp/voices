import { describe, expect, it } from "vitest";
import { validateCut } from "../../shared/cuts";
import { loadEdition, loadLanguage } from "./helpers";

const aria = loadEdition("cp-fx-aria-lume");
const trio = loadEdition("cp-fx-terzetto-alba");
const idx = (ed: typeof aria, n: string) => ed.measures.findIndex((m) => m.number === n);

describe("cut validation", () => {
  it("accepts a clean full-measure cut and warns about the tempo change inside it", () => {
    const r = validateCut(aria, [], { startM: idx(aria, "13"), endM: idx(aria, "16") }, loadLanguage(aria.editionId).phrases);
    expect(r.status).toBe("ok");
    expect(r.issues.map((i) => i.code)).toEqual(["tempo"]);
    expect(r.issues[0].message).toMatch(/♩ = 66/);
  });

  it("flags a tie running into the cut", () => {
    const r = validateCut(trio, [], { startM: idx(trio, "9"), endM: idx(trio, "10") });
    expect(r.status).toBe("flagged");
    expect(r.issues.find((i) => i.code === "tie-in")?.message).toMatch(/Piano.*m\. 8/);
  });

  it("flags a tie running out of the cut", () => {
    const r = validateCut(trio, [], { startM: idx(trio, "7"), endM: idx(trio, "8") });
    expect(r.issues.map((i) => i.code)).toContain("tie-out");
  });

  it("flags a word split by the cut boundary", () => {
    // Soprano 'scen-di' begins in m. 8 and ends in m. 9
    const r = validateCut(aria, [], { startM: idx(aria, "9"), endM: idx(aria, "10") });
    expect(r.issues.map((i) => i.code)).toContain("word-split");
    expect(r.status).toBe("flagged");
  });

  it("flags cuts that cross a repeat and warns for cuts inside one", () => {
    expect(validateCut(aria, [], { startM: idx(aria, "11"), endM: idx(aria, "13") }).issues.map((i) => i.code)).toContain("repeat");
    const inside = validateCut(aria, [], { startM: idx(aria, "6"), endM: idx(aria, "6") });
    expect(inside.issues.map((i) => i.code)).toContain("repeat-both");
  });

  it("rejects overlaps and cutting everything", () => {
    const existing = [{ startM: 2, endM: 3 }];
    expect(validateCut(aria, existing, { startM: 3, endM: 4 }).issues.map((i) => i.code)).toContain("overlap");
    expect(validateCut(aria, [], { startM: 0, endM: aria.measures.length - 1 }).issues.map((i) => i.code)).toContain("everything");
  });
});
