import { describe, expect, it } from "vitest";
import { foldIpa, foldTranslation, trailingRepeat } from "../../src/standalone/repeat";

describe("repeated words in a line", () => {
  it("folds a line sung three times", () => {
    const w = "mi vo' tosto vendicar, mi vo' tosto vendicar, mi vo' tosto vendicar.".split(" ");
    expect(trailingRepeat(w)).toEqual({ head: 0, len: 4, times: 3 });
    expect(foldIpa("mi ˈvɔ ˈtos.to ven.diˈkar mi ˈvɔ ˈtos.to ven.diˈkar mi ˈvɔ ˈtos.to ven.diˈkar", 3)).toBe("mi ˈvɔ ˈtos.to ven.diˈkar");
    expect(foldTranslation("I want to take revenge at once, I want to take revenge at once, I want to take revenge at once.", 3)).toBe("I want to take revenge at once.");
  });
  it("keeps the words before the repeats", () => {
    const w = "quest' alma a conoscervi apprender potrà, a conoscervi apprender potrà, a conoscervi apprender potrà.".split(" ");
    expect(trailingRepeat(w)).toEqual({ head: 2, len: 4, times: 3 });
  });
  it("leaves a line with no repeats alone", () => {
    expect(trailingRepeat("Esci omai, garzon malnato".split(" "))).toBeNull();
    expect(foldTranslation("Come out now, ill-born boy.", 2)).toBe("Come out now, ill-born boy.");
  });
});
