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

const PRIORITY = ["double", "link", "open", "gli", "gn", "sc", "r", "hiatus", "ch", "softc", "softg", "z", "final", "stress"];
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
  /** every word a kind of tip applies to, as written, in order */
  const seen = new Map<string, string[]>();
  /** each line's own copy of a tip: worded for the word in that line, not the first one in the piece */
  const local: { tip: Tip; text: string }[] = [];
  /** first occurrence makes the piece's tip (the list); every occurrence gets its own wording */
  const hit = (kind: string, lineId: string, k: number, text: string, make: () => Omit<Tip, "id" | "lineId" | "word" | "also">) => {
    const key = `${lineId}:${k}`;
    let tip = found.get(kind);
    const anchor = !tip;
    const words = seen.get(kind) ?? [];
    if (!words.includes(text)) words.push(text);
    seen.set(kind, words);
    const own: Tip = { id: kind, lineId, word: k, also: [], ...make() };
    if (!tip) {
      tip = { ...own, also: [] };
      found.set(kind, tip);
      list.push(tip);
    } else if (!tip.also.includes(text) && text !== anchorText.get(kind)) tip.also.push(text);
    if (anchor) anchorText.set(kind, text);
    local.push({ tip: own, text });
    const arr = byWord.get(key) ?? [];
    if (!arr.some((t) => t.id === kind)) arr.push(own);
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

      // gn is one sound
      const gn = lower.indexOf("gn");
      if (gn >= 0) {
        const a = hit("gn", ln.id, k, shown, () => ({
          title: "gn",
          body: `gn is one sound, [ɲ]: like the ny in “canyon”, and held a little between vowels: ${shown} [${w.ipa}].`,
          short: "gn = [ɲ], as in “canyon”",
        }));
        mark(key, { from: gn, to: gn + 2, tip: "gn", anchor: a });
      }

      // sc before e or i is sh
      const sc = /sc[ie]/.exec(lower);
      if (sc) {
        const a = hit("sc", ln.id, k, shown, () => ({
          title: "sc is sh",
          body: `Before e or i, sc is one soft sound, [ʃ], as in “she”: ${shown} [${w.ipa}].`,
          short: "sc = sh",
        }));
        mark(key, { from: sc.index, to: sc.index + 2, tip: "sc", anchor: a });
      }

      // a plain c or g before e or i is soft (not ch, gh, sc, gli, or a doubled one, which has its own tip)
      const sftc = /(?<![sc])c(?=[ie])/.exec(lower);
      if (sftc && !dbl) {
        const a = hit("softc", ln.id, k, shown, () => ({
          title: "Soft c",
          body: `Before e or i, c is the “ch” of “church”: ${shown} [${w.ipa}]. Before a, o, u it is a hard k.`,
          short: "c = “ch” of “church”",
        }));
        mark(key, { from: sftc.index, to: sftc.index + 1, tip: "softc", anchor: a });
      }
      const sftg = /(?<!g)g(?=[ie])(?!li)/.exec(lower);
      if (sftg && !dbl) {
        const a = hit("softg", ln.id, k, shown, () => ({
          title: "Soft g",
          body: `Before e or i, g is the “j” of “jet”: ${shown} [${w.ipa}]. Before a, o, u it is a hard g.`,
          short: "g = “j” of “jet”",
        }));
        mark(key, { from: sftg.index, to: sftg.index + 1, tip: "softg", anchor: a });
      }

      // z is ts or dz, never an English z
      const zz = lower.indexOf("z");
      if (zz >= 0 && !dbl) {
        const voiced = /dz|ʣ/.test(w.ipa);
        const a = hit("z", ln.id, k, shown, () => ({
          title: "Italian z",
          body: `z is never a buzzing English z: here it is [${voiced ? "dz" : "ts"}], ${voiced ? "as in “adze”" : "as in “cats”"}: ${shown} [${w.ipa}].`,
          short: voiced ? "z = [dz]" : "z = [ts]",
        }));
        mark(key, { from: zz, to: zz + 1, tip: "z", anchor: a });
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
  // a line with none of the sounds above still gets a tip: where its longest word leans
  for (const ln of lines) {
    if (ln.words.some((_, k) => (byWord.get(`${ln.id}:${k}`) ?? []).length)) continue;
    let best = -1;
    let most = 1;
    ln.words.forEach((w, k) => {
      const n = w.ipa.split(".").length;
      if (n > most && w.ipa.includes("ˈ")) { most = n; best = k; }
    });
    if (best < 0) continue;
    const w = ln.words[best];
    const shown = w.text.replace(/[.,;:!?]+$/, "").replace(/'/g, "’");
    const syl = w.ipa.replace(/ˌ/g, "").split(".");
    const at = syl.findIndex((x) => x.includes("ˈ"));
    const loud = syl.map((x, i) => (i === at ? x.replace("ˈ", "").toUpperCase() : x)).join("-");
    hit("stress", ln.id, best, shown, () => ({
      title: "Where the word leans",
      body: `${shown[0].toUpperCase()}${shown.slice(1)} [${w.ipa}] leans on one syllable: ${loud}. Give it the weight and keep the others light and short, with pure vowels.`,
      short: `lean on ${syl[at]?.replace("ˈ", "") ?? ""}`,
    }));
  }
  // each line's copy lists the other words in the piece with the same sound
  for (const { tip, text } of local) tip.also = (seen.get(tip.id) ?? []).filter((x) => x !== text).slice(0, 4);
  for (const tip of list) tip.also = (seen.get(tip.id) ?? []).filter((x) => x !== anchorText.get(tip.id));

  const lineTips = new Map<string, { tip: Tip; word: number }[]>();
  let prevKind = "";
  for (const ln of lines) {
    const items: { tip: Tip; word: number }[] = [];
    ln.words.forEach((_, k) => {
      for (const tip of byWord.get(`${ln.id}:${k}`) ?? []) if (!items.some((x) => x.tip.id === tip.id)) items.push({ tip, word: k });
    });
    // what a coach would point out first: doubled consonants and vowels run together, then open vowels and the
    // rest; a tip met here for the first time before one already seen
    const rank = (t: Tip) => {
      const i = PRIORITY.indexOf(t.id.split(":")[0]);
      return i < 0 ? PRIORITY.length : i;
    };
    items.sort((a, b) => rank(a.tip) - rank(b.tip) || Number(found.get(b.tip.id)?.lineId === ln.id) - Number(found.get(a.tip.id)?.lineId === ln.id) || a.word - b.word);
    // vary the advice: if the previous line led with the same kind of tip, lead with the next one here
    if (items.length > 1 && items[0].tip.id === prevKind) items.push(items.shift()!);
    if (items.length) { lineTips.set(ln.id, items); prevKind = items[0].tip.id; }
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
