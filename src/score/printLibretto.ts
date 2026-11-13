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

/** the phrases to print, in sung order */
export function librettoPhrases(d: Pick<LibrettoDoc, "phrases" | "mine">, o: Pick<LibrettoOptions, "everyone" | "repeats">): Phrase[] {
  const seen = new Set<string>();
  return [...d.phrases]
    .filter((p) => o.everyone || p.roleId === d.mine)
    .sort((a, b) => a.startM - b.startM || a.startQ - b.startQ || a.occurrence - b.occurrence)
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
        `<section class="blk${b.role === d.mine && o.everyone ? " you" : ""}"><h3>${esc(d.names[b.role] ?? b.role)}</h3>${b.lines.map(line).join("")}</section>`,
    )
    .join("");
  const empty = list.length ? "" : `<p class="none">No sung words to show with these choices.</p>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(d.head.title)} · libretto</title>
<style>
${d.fontCss ?? ""}
@page { size: A4 portrait; margin: 18mm 20mm 20mm;
  @bottom-left { content: "${esc(d.running).replace(/"/g, "")}"; font: 500 6.6pt "Jost", Arial, sans-serif; letter-spacing: 0.2em; text-transform: uppercase; color: #8b7f70; }
  @bottom-right { content: counter(page) " / " counter(pages); font: 600 10pt "Cormorant Garamond", Garamond, Georgia, serif; color: #2a2622; }
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: #fff; color: #1c1a17; }
body { font-family: "Charis SIL", Charter, Georgia, serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.doc { width: 210mm; }
${HEAD_CSS}
.head { margin-bottom: 9mm; }
.blk { margin: 0 0 5.5mm; }
.blk h3 { margin: 0 0 1.6mm; font: 500 7.2pt/1.3 "Jost", Arial, sans-serif; letter-spacing: 0.22em; text-transform: uppercase; color: #8b7f70; break-after: avoid; page-break-after: avoid; }
.blk.you h3 { color: #1f5139; }
.blk.you h3::after { content: " · you"; letter-spacing: 0.12em; text-transform: none; font-style: italic; font-family: "Charis SIL", Georgia, serif; font-size: 7.6pt; }
.blk.you .ln { border-left: 0.6mm solid #a9d8b9; padding-left: 3mm; margin-left: -3.6mm; }
.ln { margin: 0 0 2.4mm; break-inside: avoid; page-break-inside: avoid; }
.ln.two { display: grid; grid-template-columns: 1fr 1fr; gap: 8mm; }
.orig { font: 12pt/1.38 "Charis SIL", Georgia, serif; }
.ipa { margin-top: 0.4mm; font: 8.6pt/1.35 "Charis SIL", Georgia, serif; color: #6b6359; }
.tr { font: italic 10.4pt/1.42 "Charis SIL", Georgia, serif; color: #4d4740; }
.sung > .tr { margin-top: 0.6mm; }
.ln.two > .tr { padding-top: 0.5mm; }
.words { display: flex; flex-wrap: wrap; gap: 1.6mm 3.2mm; }
.w { display: inline-flex; flex-direction: column; }
.w .o { font: 12pt/1.3 "Charis SIL", Georgia, serif; }
.w .i { font: 8pt/1.3 "Charis SIL", Georgia, serif; color: #6b6359; }
.w .g { font: 500 7.2pt/1.35 "Jost", Arial, sans-serif; color: #8b7f70; }
.none { font: italic 11pt "Charis SIL", Georgia, serif; color: #6b6359; }
.credits { margin-top: 10mm; padding-top: 2mm; border-top: 0.2mm solid #e2dccf; font: italic 7pt/1.4 "Charis SIL", Georgia, serif; color: #7a7268; }
@media screen {
  body { background: #e7e7e3; }
  .doc { margin: 16px auto; padding: 18mm 20mm 20mm; min-height: 297mm; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,.18); zoom: var(--fit, 1); }
}
</style></head><body>
<div class="doc">${headBlock(d.head)}${body}${empty}${d.credits ? `<div class="credits">${esc(d.credits)}</div>` : ""}</div>
</body></html>`;
}
