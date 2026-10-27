/**
 * Sung syllables inside the written words: which letters of "bello" are "bel" and which are "lo", so the
 * text above the music can light up exactly what is being sung, one note at a time.
 */
import type { ReactNode } from "react";

export interface SylLine {
  words: { text: string }[];
  syllables?: { noteId: string; text: string; word: number }[];
}
export interface SylRange {
  word: number;
  from: number;
  to: number;
  noteId: string;
}
/** How far a line has been sung: syllable indices sung already, and those on the note sounding now. */
export interface SylProgress {
  done: Set<number>;
  now: Set<number>;
}
export interface Deco {
  from: number;
  to: number;
  cls: string;
}

const LETTER = /\p{L}/u;
const fold = (c: string) => c.toLowerCase();

/** Where each syllable sits in its word, in letters of the written text (punctuation stays outside). */
export function syllableRanges(line: SylLine): SylRange[] {
  const cursor = new Map<number, number>();
  return (line.syllables ?? []).map((s) => {
    const text = line.words[s.word]?.text ?? "";
    const letters = [...s.text].filter((c) => LETTER.test(c)).map(fold);
    let at = cursor.get(s.word) ?? 0;
    while (at < text.length && !(LETTER.test(text[at]) && fold(text[at]) === letters[0])) at++;
    const from = at;
    let j = 0;
    while (at < text.length && j < letters.length) {
      if (LETTER.test(text[at])) {
        if (fold(text[at]) !== letters[j]) break;
        j++;
      }
      at++;
    }
    cursor.set(s.word, at);
    // if the syllable cannot be found, light the whole word rather than nothing
    return j === letters.length && letters.length ? { word: s.word, from, to: at, noteId: s.noteId } : { word: s.word, from: 0, to: text.length, noteId: s.noteId };
  });
}

/** The text with each range wrapped in a span carrying its classes (ranges may overlap). */
export function decorate(text: string, ranges: Deco[]): ReactNode {
  const rs = ranges.filter((r) => r.to > r.from).map((r) => ({ ...r, from: Math.max(0, r.from), to: Math.min(text.length, r.to) }));
  if (!rs.length) return text;
  const cuts = [...new Set([0, text.length, ...rs.flatMap((r) => [r.from, r.to])])].sort((a, b) => a - b);
  const out: ReactNode[] = [];
  for (let i = 0; i < cuts.length - 1; i++) {
    const a = cuts[i];
    const b = cuts[i + 1];
    if (b <= a) continue;
    const cls = rs.filter((r) => r.from <= a && r.to >= b).map((r) => r.cls);
    out.push(cls.length ? <span key={a} className={cls.join(" ")}>{text.slice(a, b)}</span> : text.slice(a, b));
  }
  return out;
}
