import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import { beforeAll, describe, expect, it } from "vitest";

beforeAll(() => {
  const g = globalThis as Record<string, unknown>;
  g.DOMParser ??= DOMParser;
  g.XMLSerializer ??= XMLSerializer;
});

const note = (dur: number, extra = "") => `<note>${extra}<pitch><step>C</step><octave>4</octave></pitch><duration>${dur}</duration></note>`;
const xml = `<?xml version="1.0"?><score-partwise><part-list><score-part id="P1"/><score-part id="P2"/></part-list>
<part id="P1"><measure number="1"><attributes><divisions>2</divisions></attributes>${note(8)}</measure></part>
<part id="P2"><measure number="1"><attributes><divisions>2</divisions></attributes>${note(4)}${note(4)}<backup><duration>8</duration></backup>${note(8)}</measure>
<measure number="2">${note(3)}${note(2, "<chord/>")}${note(5)}</measure></part></score-partwise>`;

describe("notes written into the score for print", () => {
  it("puts each note in the singer's part, before the note sounding at its beat", async () => {
    const { annotateXml } = await import("../../src/score/printScore");
    const out = annotateXml(xml, "P2", [
      { m: 0, q: 2, words: "① Breathe" },
      { m: 1, q: 2, words: "② Lean" },
    ]);
    const doc = new DOMParser().parseFromString(out, "application/xml");
    const parts = Array.from(doc.getElementsByTagName("part"));
    expect(parts[0].getElementsByTagName("direction").length).toBe(0);
    const [m1, m2] = Array.from(parts[1].getElementsByTagName("measure"));
    // bar 1, beat 3 of 4/4 (2 quarters in): right before the second half note, no offset
    const kids1 = Array.from(m1.childNodes).filter((n) => n.nodeType === 1).map((n) => n.nodeName);
    expect(kids1).toEqual(["attributes", "note", "direction", "note", "backup", "note"]);
    expect(m1.getElementsByTagName("words")[0].textContent).toBe("① Breathe");
    expect(m1.getElementsByTagName("offset").length).toBe(0);
    // bar 2: 2 quarters = 4 divisions falls inside the second (non-chord) note, which starts at 3: offset 1
    const d2 = m2.getElementsByTagName("direction")[0];
    expect(d2.getAttribute("placement")).toBe("above");
    expect(d2.getElementsByTagName("offset")[0].textContent).toBe("1");
  });

  it("leaves the score alone when there is nothing to write", async () => {
    const { annotateXml } = await import("../../src/score/printScore");
    expect(annotateXml(xml, "P2", [])).toBe(xml);
  });
});
