/**
 * The libretto of one piece for print: its words in the order they are sung, each speaker named (no pictures), with
 * the reader's choice of the translation, the IPA, the word-by-word glosses, only your lines or everyone's, and
 * repeated lines once or as sung. A self-contained page set in the app's type, for Save as PDF.
 */
import type { Phrase } from "../../shared/types";
import { HEAD_CSS, headBlock, type PrintHead } from "./printScore";

export interface LibrettoOptions {
  /** everyone's lines, or only yours */
  everyone: boolean;
  translation: boolean;
  ipa: boolean;
  /** word by word: each word with its meaning under it */
  gloss: boolean;
  /** each repetition as sung (otherwise a line a character repeats is printed once) */
  repeats: boolean;
}

export interface LibrettoDoc {
  head: PrintHead;
  /** running title for the page foot */
  running: string;
  phrases: Phrase[];
  /** roleId -> the character's name */
  names: Record<string, string>;
  /** your role */
  mine: string;
  /** the language of the sung words (BCP 47), for hyphenation and the reader */
  lang: string;
  /** its name, over the column of sung words */
  langName: string;
  fontCss?: string;
  credits?: string;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z]+/g, " ")
    .trim();

/**
 * The phrases to print, in sung order. A musical phrase may stop mid-sentence ("porgi amor qualche ristoro al" /
 * "mio duolo,"): a character's phrases are joined into verse lines that end at a punctuation mark, as a libretto
 * prints them.
 */
export function librettoPhrases(d: Pick<LibrettoDoc, "phrases" | "mine">, o: Pick<LibrettoOptions, "everyone" | "repeats">): Phrase[] {
  const seen = new Set<string>();
  const sung = [...d.phrases]
    .filter((p) => o.everyone || p.roleId === d.mine)
    .sort((a, b) => a.startM - b.startM || a.startQ - b.startQ || a.occurrence - b.occurrence);
  const verses: Phrase[] = [];
  for (const p of sung) {
    const last = verses[verses.length - 1];
    const open = last && last.roleId === p.roleId && !/[.,;:!?…»”"')]\s*$/.test(last.original);
    if (open && last.original.length + p.original.length < 90)
      verses[verses.length - 1] = {
        ...last,
        original: `${last.original} ${p.original}`,
        words: [...last.words, ...p.words],
        ipa: [last.ipa, p.ipa].filter(Boolean).join(" "),
        translation: [last.translation, p.translation].filter(Boolean).join(" "),
        endM: p.endM,
        endQ: p.endQ,
      };
    else verses.push(p);
  }
  return verses
    .filter((p) => {
      if (o.repeats) return true;
      const k = `${p.roleId}|${norm(p.original)}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
}

export function librettoHtml(d: LibrettoDoc, o: LibrettoOptions): string {
  const list = librettoPhrases(d, o);
  // consecutive lines of one character go under one name, as a libretto prints them
  const blocks: { role: string; lines: Phrase[] }[] = [];
  for (const p of list) {
    const last = blocks[blocks.length - 1];
    if (last && last.role === p.roleId) last.lines.push(p);
    else blocks.push({ role: p.roleId, lines: [p] });
  }
  const two = o.translation && !o.gloss;
  const line = (p: Phrase) => {
    const sung = o.gloss
      ? `<div class="words" lang="${esc(d.lang)}">${p.words
          .map(
            (w) =>
              `<span class="w"><span class="o">${esc(w.text)}</span>${o.ipa && w.ipa ? `<span class="i">${esc(w.ipa)}</span>` : ""}<span class="g">${esc(w.gloss || " ")}</span></span>`,
          )
          .join(" ")}</div>`
      : `<div class="orig" lang="${esc(d.lang)}">${esc(p.original)}</div>${o.ipa && p.ipa ? `<div class="ipa">${esc(p.ipa)}</div>` : ""}`;
    const tr = o.translation && p.translation ? `<div class="tr" lang="en">${esc(p.translation)}</div>` : "";
    return `<div class="ln${two ? " two" : ""}"><div class="sung">${sung}${two ? "" : tr}</div>${two ? tr : ""}</div>`;
  };
  const body = blocks
    .map(
      (b) =>
        `<section class="blk${b.role === d.mine && o.everyone && blocks.some((x) => x.role !== d.mine) ? " you" : ""}${o.gloss ? " wbw" : ""}"><h3>${esc(d.names[b.role] ?? b.role)}</h3>${b.lines.map(line).join("")}</section>`,
    )
    .join("");
  const empty = list.length ? "" : `<p class="none">No sung words to show with these choices.</p>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(d.head.title)} · libretto</title>
<style>
${d.fontCss ?? ""}
@page { size: A4 portrait; margin: 22mm 22mm 20mm;
  @bottom-left { content: "${esc(d.running).replace(/"/g, "")}"; font: 500 6.6pt "Jost", Arial, sans-serif; letter-spacing: 0.2em; text-transform: uppercase; color: #8b7f70; }
  @bottom-right { content: counter(page) " / " counter(pages); font: 600 10pt "Cormorant Garamond", Garamond, Georgia, serif; color: #2a2622; }
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: #fff; color: #1c1a17; }
body { font-family: "Charis SIL", Charter, Georgia, serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.doc { width: 210mm; }
${HEAD_CSS}
.head { margin-bottom: 9mm; }
.blk { margin: 0 0 6.5mm; }
.cols { display: grid; grid-template-columns: 1fr 1fr; gap: 10mm; margin: 0 0 4mm; padding-bottom: 1.4mm; border-bottom: 0.2mm solid #e2dccf; font: 500 6.4pt/1.3 "Jost", Arial, sans-serif; letter-spacing: 0.2em; text-transform: uppercase; color: #9a9184; }
.blk h3 { margin: 0 0 1.8mm; font: 600 10.5pt/1.2 "Cormorant Garamond", Garamond, Georgia, serif; letter-spacing: 0.14em; text-transform: uppercase; color: #2a2622; break-after: avoid; page-break-after: avoid; }
.blk.you h3 { color: #1f5139; }
.blk.you h3::after { content: "you"; margin-left: 2.2mm; padding: 0.3mm 1.6mm; border-radius: 3mm; background: #e3efe6; color: #1f5139; font: 500 5.8pt/1 "Jost", Arial, sans-serif; letter-spacing: 0.14em; vertical-align: 0.6mm; }
.ln { margin: 0 0 1.8mm; break-inside: avoid; page-break-inside: avoid; }
.ln.two { display: grid; grid-template-columns: 1fr 1fr; gap: 10mm; }
.orig { font: 12pt/1.4 "Charis SIL", Georgia, serif; }
.ipa { margin-top: 0.2mm; font: 8.4pt/1.35 "Charis SIL", Georgia, serif; color: #8b8378; }
.tr { font: italic 10.6pt/1.45 "Charis SIL", Georgia, serif; color: #5d564d; }
.sung > .tr { margin-top: 0.4mm; }
.ln.two > .tr { padding-top: 0.6mm; }
.ln.two .orig + .ipa { margin-bottom: 0.6mm; }
/* word by word: each verse a row of small columns (the word, how it sounds, what it means), its sense under it */
.wbw .ln { margin: 0 0 4.2mm; }
.words { display: flex; flex-wrap: wrap; gap: 1.2mm 2.6mm; }
.w { display: inline-flex; flex-direction: column; gap: 0.2mm; }
.w .o { font: 11.5pt/1.25 "Charis SIL", Georgia, serif; }
.w .i { font: 7.6pt/1.25 "Charis SIL", Georgia, serif; color: #8b8378; }
.w .g { font: 400 6.9pt/1.25 "Jost", Arial, sans-serif; color: #6b6359; letter-spacing: 0.01em; }
.wbw .sung > .tr { margin-top: 1.4mm; font-size: 10pt; }
.none { font: italic 11pt "Charis SIL", Georgia, serif; color: #6b6359; }
.credits { margin-top: 10mm; padding-top: 2mm; border-top: 0.2mm solid #e2dccf; font: italic 7pt/1.4 "Charis SIL", Georgia, serif; color: #7a7268; }
@media screen {
  html, body { background: #e7e7e3; } body { padding: 1px 0; }
  .doc { margin: 16px auto; padding: 22mm 22mm 20mm; min-height: 297mm; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,.18); zoom: var(--fit, 1); }
}
</style></head><body>
<div class="doc">${headBlock(d.head)}${two && list.length ? `<div class="cols"><span>${esc(d.langName)}</span><span>English</span></div>` : ""}${body}${empty}${d.credits ? `<div class="credits">${esc(d.credits)}</div>` : ""}</div>
</body></html>`;
}
