/**
 * Pronunciation tips for spoken Italian, worked out from each word's spelling and IPA.
 *
 * Each kind of tip is anchored where it first occurs in the piece (shown in full there) and lists the
 * other words it applies to. Only sounds are covered: meanings live in the word cards. The same rules work
 * for every Italian piece.
 */

export interface TipWord {
  text: string;
  ipa: string;
}
export interface TipLine {
  id: string;
  ipa: string;
  words: TipWord[];
}
export interface Tip {
  id: string;
  title: string;
  /** one or two sentences, shown under the line and in the word card */
  body: string;
  /** a few words, shown on the music card */
  short: string;
  lineId: string;
  /** the word the tip is anchored to */
  word: number;
  /** other words in the piece it applies to, as written */
  also: string[];
}
export interface Mark {
  from: number;
  to: number;
  tip: string;
  anchor: boolean;
}
export interface Tips {
  list: Tip[];
  byLine: Map<string, Tip[]>;
  /** every tip that applies to a word, keyed "lineId:wordIndex" */
  byWord: Map<string, Tip[]>;
  /** letters to underline in a word, keyed "lineId:wordIndex" */
  marks: Map<string, Mark[]>;
  /** words joined to the next one in speech, keyed "lineId:wordIndex" */
  links: Set<string>;
  /** the tips that matter in each line: those that start there first, then the ones that recur */
  lineTips: Map<string, { tip: Tip; word: number }[]>;
}

const bare = (t: string) => t.toLowerCase().replace(/[.,;:!?«»“”"()]/g, "");
const VOWELS = "aeiouɛɔ";

export function buildTips(lines: TipLine[]): Tips {
  const list: Tip[] = [];
  const marks = new Map<string, Mark[]>();
  const links = new Set<string>();
  const byWord = new Map<string, Tip[]>();
  const found = new Map<string, Tip>();
  const anchorText = new Map<string, string>();

  const mark = (key: string, m: Mark) => {
    const arr = marks.get(key) ?? [];
    arr.push(m);
    marks.set(key, arr);
  };
  /** first occurrence makes the tip; later ones are added to "also" */
  const hit = (kind: string, lineId: string, k: number, text: string, make: () => Omit<Tip, "id" | "lineId" | "word" | "also">) => {
    const key = `${lineId}:${k}`;
    let tip = found.get(kind);
    const anchor = !tip;
    if (!tip) {
      tip = { id: kind, lineId, word: k, also: [], ...make() };
      found.set(kind, tip);
      list.push(tip);
    } else if (!tip.also.includes(text) && text !== anchorText.get(kind)) tip.also.push(text);
    if (anchor) anchorText.set(kind, text);
    const arr = byWord.get(key) ?? [];
    if (!arr.includes(tip)) arr.push(tip);
    byWord.set(key, arr);
    return anchor;
  };

  // examples from the piece itself, so each tip points at words the singer is learning
  const closed: string[] = [];
  const openEx: string[] = [];
  const softC: string[] = [];
  const tapR: string[] = [];
  const add = (arr: string[], t: string) => !arr.includes(t) && arr.push(t);
  for (const ln of lines)
    for (const w of ln.words) {
      const t = w.text.replace(/[.,;:!?]+$/, "").replace(/'/g, "’");
      const low = bare(w.text);
      const stressed = w.ipa.split("ˈ")[1]?.split(".")[0] ?? "";
      if (/[eo]/.test(stressed) && !/[ɛɔ]/.test(w.ipa) && low.length > 3) add(closed, t);
      if (/[ɛɔ]/.test(w.ipa) && low.length > 3) add(openEx, t);
      if (/c[ie]/.test(low) && !/ch[ie]|sc[ie]/.test(low)) add(softC, t);
      if (/r/.test(low) && !/rr/.test(low)) add(tapR, t);
    }
  const few = (arr: string[], n = 2) => arr.slice(0, n).join(", ");

  for (const ln of lines) {
    // which words are joined to the next in the line's IPA (vɔ‿anˈda.re)
    const parts = ln.ipa.split(/( |‿)/).filter((p) => p !== "");
    const tokens: { join: boolean }[] = [];
    for (let i = 0; i < parts.length; i++) {
      if (parts[i] === " " || parts[i] === "‿") continue;
      tokens.push({ join: parts[i + 1] === "‿" });
    }
    const aligned = tokens.length === ln.words.length;

    ln.words.forEach((w, k) => {
      const text = bare(w.text);
      const shown = w.text.replace(/[.,;:!?]+$/, "").replace(/'/g, "’");
      const key = `${ln.id}:${k}`;
      const lower = w.text.toLowerCase();

      // vowels run together across words
      if (aligned && tokens[k]?.join && ln.words[k + 1]) {
        links.add(key);
        const pair = `${shown} ${ln.words[k + 1].text.replace(/[.,;:!?]+$/, "").replace(/'/g, "’")}`;
        hit("link", ln.id, k, pair, () => ({
          title: "Join the words",
          body: `${pair}: when one word ends in a vowel and the next begins with one, run them together without a break, as Italians do.`,
          short: "join the vowels, no break",
        }));
      }

      // double consonants (rr, cch and gli have tips of their own)
      const dbl = /([bcdfglmnpstvz])\1/.exec(lower);
      if (dbl && !/cch[ie]|ggh[ie]/.test(lower)) {
        const a = hit("double", ln.id, k, shown, () => ({
          title: "Double consonant",
          body: `Hold the ${dbl[0]} a moment longer: ${spell(shown, dbl.index)}. The vowel before it stays short.`,
          short: `hold the ${dbl[0]}`,
        }));
        mark(key, { from: dbl.index, to: dbl.index + 2, tip: "double", anchor: a });
      }

      // two vowels, two syllables (mi.o)
      const ipaNoStress = w.ipa.replace(/[ˈˌ]/g, "");
      const hi = new RegExp(`[${VOWELS}]\\.[${VOWELS}]`).exec(ipaNoStress);
      if (hi && !/gli|[cg]i[aou]/.test(lower)) {
        const at = lower.search(/[aeiouàèéìòóù][aeiouàèéìòóù]/);
        const a = hit("hiatus", ln.id, k, shown, () => ({
          title: "Two syllables",
          body: `Say both vowels: ${syllables(w.ipa, shown)}, not one gliding sound.`,
          short: "two vowels, two syllables",
        }));
        if (at >= 0) mark(key, { from: at, to: at + 2, tip: "hiatus", anchor: a });
      }

      // open e and o
      const open = /[ɛɔ]/.exec(w.ipa);
      if (open) {
        const letter = open[0] === "ɛ" ? /[eèé]/ : /[oòó]/;
        const at = lower.search(letter);
        const a = hit("open", ln.id, k, shown, () => ({
          title: "Open and closed e, o",
          body:
            `${shown[0].toUpperCase()}${shown.slice(1)} has an open ${open[0] === "ɛ" ? "e [ɛ], as in “bet”" : "o [ɔ], as in “thought”"}. ` +
            `Italian e and o can be open or closed, and the IPA shows which: open in ${few(openEx.filter((x) => x !== shown))}` +
            `${closed.length ? `, closed in ${few(closed)}` : ""}.`,
          short: open[0] === "ɛ" ? "open e [ɛ], as in “bet”" : "open o [ɔ], as in “thought”",
        }));
        if (at >= 0) mark(key, { from: at, to: at + 1, tip: "open", anchor: a });
      }

      // gli
      const g = /gli[aeiou]?/.exec(lower);
      if (g) {
        const a = hit("gli", ln.id, k, shown, () => ({
          title: "gli",
          body: `gli is one sound, [ʎ]: like the lli in “million” with the tongue flat, and held double between vowels (${syllables(w.ipa, shown)}).`,
          short: "gli = [ʎ], held",
        }));
        mark(key, { from: g.index, to: g.index + 3, tip: "gli", anchor: a });
      }

      // ch before e/i is a hard k
      const ch = /c?ch[ie]/.exec(lower);
      if (ch) {
        const a = hit("ch", ln.id, k, shown, () => ({
          title: "ch is k",
          body: `Before i or e, ch is a hard k: ${shown} [${w.ipa}].${softC.length ? ` A plain c before i or e is the “ch” of “church”: ${few(softC)}.` : ""}`,
          short: "ch = hard k",
        }));
        mark(key, { from: ch.index, to: ch.index + ch[0].length - 1, tip: "ch", anchor: a });
      }

      // rolled rr and tapped r
      const rr = lower.indexOf("rr");
      if (rr >= 0) {
        const a = hit("r", ln.id, k, shown, () => ({
          title: "Two r sounds",
          body: `Double rr is rolled (${shown}); a single r is one quick tap of the tongue${tapR.length ? ` (${few(tapR)})` : ""}.`,
          short: "rr rolled, r tapped",
        }));
        mark(key, { from: rr, to: rr + 2, tip: "r", anchor: a });
      }

      // stress on a final accented vowel (pietà), not one-syllable words like sì
      const fin = /[àèìòù]$/.exec(text);
      if (fin && text.length > 2) {
        const a = hit("final", ln.id, k, shown, () => ({
          title: "Stress at the end",
          body: `The accent shows where the stress falls: ${shown} is stressed on its last syllable.`,
          short: "stress the last syllable",
        }));
        mark(key, { from: fin.index, to: fin.index + 1, tip: "final", anchor: a });
      }
    });
  }

  const byLine = new Map<string, Tip[]>();
  for (const t of list) byLine.set(t.lineId, [...(byLine.get(t.lineId) ?? []), t]);
  const lineTips = new Map<string, { tip: Tip; word: number }[]>();
  for (const ln of lines) {
    const items: { tip: Tip; word: number }[] = [];
    ln.words.forEach((_, k) => {
      for (const tip of byWord.get(`${ln.id}:${k}`) ?? []) if (!items.some((x) => x.tip === tip)) items.push({ tip, word: k });
    });
    items.sort((a, b) => Number(b.tip.lineId === ln.id) - Number(a.tip.lineId === ln.id) || a.word - b.word);
    if (items.length) lineTips.set(ln.id, items);
  }
  return { list, byLine, byWord, marks, links, lineTips };
}

/** "babbino" with the double letters split: bab-bino */
function spell(word: string, at: number) {
  return `${word.slice(0, at + 1)}-${word.slice(at + 1)}`;
}
/** the IPA's syllables written with the word's own letters where possible: mi-o */
function syllables(ipa: string, word: string) {
  const n = ipa.replace(/ˈ|ˌ/g, "").split(".").length;
  return n > 1 ? `${word} [${ipa}]` : word;
}
