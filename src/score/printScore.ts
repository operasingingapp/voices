/**
 * The score for print: the whole piece engraved on A4 pages by Verovio, with the singer's notes and marks written
 * into the score (above their part, at their bar and beat) and listed in full at the end. The document is printed
 * by the browser (Save as PDF in the print dialog): from a hidden frame where printing is allowed, otherwise from a
 * new tab, otherwise the caller says how to get there.
 */
import { filterXml, newVerovioToolkit } from "./vrv";

/** something to write on the score: the number it has in the list, and its short label */
export interface ScoreMark {
  /** bar: index among the part's <measure> elements (the edition's measure index) */
  m: number;
  /** offset in quarters inside the bar */
  q: number;
  words: string;
}

const isEl = (n: Node): n is Element => n.nodeType === 1;
const kids = (e: Element) => Array.from(e.childNodes).filter(isEl);
const child = (e: Element, name: string) => kids(e).find((c) => c.nodeName === name);
const num = (e: Element | undefined) => (e ? Number(e.textContent) || 0 : 0);

/** circled numbers ①–⑳ (then (21), (22)…): the same number on the score and in the list */
export const circled = (n: number) => (n >= 1 && n <= 20 ? String.fromCodePoint(0x2460 + n - 1) : `(${n})`);

/** the colour the notes are written in (a pencil red that prints in black and white as a mid grey) */
export const NOTE_INK = "#b03a1a";

/**
 * The score with a direction (words above the staff) for each mark, in the given part at its bar and beat: placed
 * before the note sounding there in the bar's first voice, offset into it when the beat falls inside a note.
 * Only DOM Level 2 calls are used, so it runs in the browser and in tests alike.
 */
export function annotateXml(xml: string, partId: string, marks: ScoreMark[]): string {
  if (!marks.length) return xml;
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.getElementsByTagName("parsererror").length) return xml;
  const part = Array.from(doc.getElementsByTagName("part")).find((p) => p.getAttribute("id") === partId);
  if (!part) return xml;
  const measures = kids(part).filter((c) => c.nodeName === "measure");
  // divisions per quarter in force in each bar
  const divs: number[] = [];
  let div = 1;
  for (const m of measures) {
    for (const a of kids(m).filter((c) => c.nodeName === "attributes")) {
      const d = num(child(a, "divisions"));
      if (d > 0) {
        div = d;
        break;
      }
    }
    divs.push(div);
  }
  for (const mk of marks) {
    const m = measures[mk.m];
    if (!m) continue;
    const t = mk.q * divs[mk.m];
    let cur = 0;
    let before: Element | null = null;
    let offset = 0;
    for (const c of kids(m)) {
      if (c.nodeName === "backup") {
        before = c;
        offset = t - cur;
        break;
      }
      if (c.nodeName === "forward") {
        cur += num(child(c, "duration"));
        continue;
      }
      if (c.nodeName !== "note" || child(c, "chord") || child(c, "grace")) continue;
      const dur = num(child(c, "duration"));
      if (cur + dur > t + 1e-6 || cur >= t - 1e-6) {
        before = c;
        offset = t - cur;
        break;
      }
      cur += dur;
    }
    if (!before) offset = t - cur;
    const dir = doc.createElement("direction");
    dir.setAttribute("placement", "above");
    const dt = doc.createElement("direction-type");
    const w = doc.createElement("words");
    w.setAttribute("font-weight", "bold");
    w.setAttribute("color", NOTE_INK);
    w.appendChild(doc.createTextNode(mk.words));
    dt.appendChild(w);
    dir.appendChild(dt);
    if (Math.abs(offset) > 1e-6) {
      const o = doc.createElement("offset");
      o.appendChild(doc.createTextNode(String(Math.round(offset * 1000) / 1000)));
      dir.appendChild(o);
    }
    m.insertBefore(dir, before);
  }
  return new XMLSerializer().serializeToString(doc);
}

/** A4 in Verovio's page units; the music's size is set by how many units the page is wide */
function pageUnits(staves: number) {
  const w = staves <= 2 ? 2300 : staves <= 4 ? 2450 : staves <= 6 ? 2650 : 2850;
  return { w, h: Math.round((w * 297) / 210), mm: w / 210 };
}

/** the title block on page 1 runs from 16 mm to about 44 mm; the music begins clear of it */
const TITLE_ROOM_MM = 50;

/** The engraved pages, and where the music begins on the first one (mm from the top), below its title block. */
export interface Engraved {
  pages: string[];
  firstTopMm: number;
}

/**
 * The score engraved on A4 pages: one SVG per page, sized to fill its page. The title block is set by printHtml in
 * the app's own type; the engraver only keeps the room for it on the first page (a placeholder heading, removed).
 */
export async function engravePages(xml: string, visibleParts: string[] | null): Promise<Engraved> {
  const tk = await newVerovioToolkit();
  try {
    // the score's own heading and credits make way for a placeholder that reserves the title block's height
    xml = xml
      .replace(/<credit\b[\s\S]*?<\/credit>/g, "")
      .replace(/<work>[\s\S]*?<\/work>/, "")
      .replace(/<movement-(?:title|number)>[\s\S]*?<\/movement-(?:title|number)>/g, "")
      .replace(/<creator\b[^>]*>[\s\S]*?<\/creator>/g, "")
      .replace(/(<score-partwise\b[^>]*>)/, "$1<movement-title>Title</movement-title>");
    if (!/<identification>/.test(xml)) xml = xml.replace(/(<part-list>)/, "<identification></identification>$1");
    // the placeholder's height: one creator line after another until the music starts below the title block
    const withLines = (k: number) => xml.replace(/<identification>/, `<identification>${'<creator type="composer">.</creator>'.repeat(k)}`);
    const f = filterXml(withLines(2), visibleParts, false);
    const staves = f.parts.reduce((n, p) => n + p.staves, 0);
    const { w, h, mm } = pageUnits(staves);
    tk.setOptions({
      pageWidth: w,
      pageHeight: h,
      scale: 100,
      adjustPageHeight: false,
      breaks: "auto",
      // the page number and the credits are written in the bottom margin (see printHtml)
      pageMarginTop: Math.round(19 * mm),
      pageMarginBottom: Math.round(17 * mm),
      pageMarginLeft: Math.round(14 * mm),
      pageMarginRight: Math.round(14 * mm),
      header: "auto",
      footer: "none",
      justifyVertically: true,
      condense: "none",
      mnumInterval: 0,
      lyricSize: 4.2,
      lyricTopMinMargin: 3,
      lyricWordSpace: 2.4,
      // Leland: an engraving font after the classic hand-engraved plates (more ink, rounder heads than Leipzig)
      font: "Leland",
      svgCss:
        "g.verse text,g.dir text,g.dynam text,g.label text,g.labelAbbr text{font-family:'Charis SIL',Charter,Georgia,'Times New Roman',serif}" +
        "g.tempo text{font-family:'Cormorant Garamond',Garamond,Georgia,serif;font-weight:600}" +
        "g.mNum text{font-family:'Cormorant Garamond',Garamond,Georgia,serif;font-style:italic;fill:#6b6560}",
    });
    // each page is put in the document out of sight, to measure the notes written on it
    const host = document.createElement("div");
    host.setAttribute("aria-hidden", "true");
    host.style.cssText = "position:absolute;left:-100000px;top:0;visibility:hidden;pointer-events:none";
    document.body.appendChild(host);
    const pages: string[] = [];
    let firstTopMm = TITLE_ROOM_MM;
    /** where the first system's highest mark sits on page 1 (mm; the page is A4, 297 mm high) */
    const firstTop = (svg: SVGSVGElement) => {
      const sys = svg.querySelector("g.system");
      const page = svg.getBoundingClientRect();
      return sys && page.height > 0 ? ((sys.getBoundingClientRect().top - page.top) / page.height) * 297 : TITLE_ROOM_MM;
    };
    try {
      for (let k = 2; ; k++) {
        tk.loadData(k === 2 ? f.xml : filterXml(withLines(k), visibleParts, false).xml);
        host.innerHTML = tk.renderToSVG(1) as string;
        const svg = host.querySelector("svg");
        firstTopMm = svg ? firstTop(svg) : TITLE_ROOM_MM;
        if (firstTopMm >= TITLE_ROOM_MM || k >= 12) break;
      }
      const n = tk.getPageCount() as number;
      for (let i = 1; i <= n; i++) {
        host.innerHTML = tk.renderToSVG(i) as string;
        const svg = host.querySelector("svg");
        if (!svg) continue;
        // the placeholder heading only kept the room: printHtml writes the title block there
        for (const g of svg.querySelectorAll("g.pgHead")) g.remove();
        spreadNotes(svg);
        // fill the page box it is put in (the drawing keeps its own proportions, which are A4's)
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        pages.push(svg.outerHTML);
      }
    } finally {
      host.remove();
    }
    return { pages, firstTopMm };
  } finally {
    try {
      tk.destroy?.();
    } catch {
      /* nothing to free */
    }
  }
}

/**
 * Notes close together would print over each other, and Verovio sets a note clear of the music but not of another
 * direction at the same beat. Each note's label is checked against the music, the score's words and the notes before
 * it: a note just before gives way by shortening its label (to its number and sign at the least); a note still in
 * the way moves up a line (up to three, never past the staff above), or else just under its own staff and words.
 */
function spreadNotes(svg: SVGSVGElement) {
  const GAP = 60;
  const ours = Array.from(svg.querySelectorAll<SVGGElement>("g.dir")).filter((g) => g.querySelector(`[fill="${NOTE_INK}"]`));
  if (!ours.length) return;
  type Rect = { x: number; y: number; w: number; h: number; dy: number };
  type Box = Rect & {
    g: SVGGElement;
    t: Element;
    full: string;
    head: string;
    others: Rect[];
    x0: number;
    y0: number;
    bar: [number, number];
  };
  // a little inside their edges: touching is not covering
  const boxOf = (g: SVGGraphicsElement) => g.getBBox();
  const rect = (b: DOMRect, inset = 10): Rect => ({
    x: b.x + inset,
    y: b.y + inset,
    w: Math.max(0, b.width - 2 * inset),
    h: Math.max(0, b.height - 2 * inset),
    dy: 0,
  });
  // each staff's five lines (one box per bar), and the music drawn on and around them
  const lines = Array.from(svg.querySelectorAll<SVGGraphicsElement>("g.staff"))
    .map((st) => {
      const ps = Array.from(st.querySelectorAll<SVGGraphicsElement>(":scope > path")).map(boxOf);
      if (!ps.length) return null;
      const x0 = Math.min(...ps.map((b) => b.x));
      const y0 = Math.min(...ps.map((b) => b.y));
      const x1 = Math.max(...ps.map((b) => b.x + b.width));
      const y1 = Math.max(...ps.map((b) => b.y + b.height));
      return { x: x0, y: y0, w: x1 - x0, h: y1 - y0, dy: 0, el: st };
    })
    .filter((r): r is Rect & { el: SVGGraphicsElement } => !!r);
  const music = Array.from(
    svg.querySelectorAll<SVGGraphicsElement>(
      "g.notehead, g.stem, g.flag, g.beam, g.artic, g.accid, g.dots, g.rest, g.mRest, g.multiRest, g.verse, g.tuplet, g.ledgerLines, g.clef, g.keySig, g.meterSig, g.barLine",
    ),
  )
    .map(boxOf)
    .filter((b) => b.width > 0 && b.height > 0)
    .map((b) => rect(b));
  const words = Array.from(
    svg.querySelectorAll<SVGGraphicsElement>("g.dir, g.tempo, g.dynam, g.hairpin, g.mNum, g.pgHead, g.reh, g.fermata, g.slur, g.tie, g.label, g.labelAbbr"),
  )
    .filter((g) => !ours.includes(g as SVGGElement))
    .map(boxOf)
    .filter((b) => b.width > 0 && b.height > 0)
    .map((b) => rect(b));
  // the other systems on the page, with everything printed around them: a note never strays into one
  const systems = Array.from(svg.querySelectorAll<SVGGraphicsElement>("g.system")).map((g) => ({ g, r: rect(g.getBBox()) }));
  const boxes: Box[] = [];
  for (const g of ours) {
    const t = Array.from(g.querySelectorAll("tspan")).find((s) => s.hasAttribute("font-size") && !s.querySelector("tspan")) ?? null;
    if (!t) continue;
    const b = g.getBBox();
    const full = t.textContent ?? "";
    // a label is never cut shorter than its number and its mark's sign (if any)
    const head = /^\S+(\s+[^\p{L}\p{N}\s]\S*)?/u.exec(full)?.[0] ?? full;
    const mine = g.closest("g.system");
    // the bar from barline to barline: its staff lines (the bar's words may reach beyond them)
    const mb = g.closest<SVGGraphicsElement>("g.measure")?.querySelector<SVGGraphicsElement>("g.staff > path")?.getBBox();
    boxes.push({
      g,
      t,
      full,
      head,
      x: b.x,
      y: b.y,
      w: b.width,
      h: b.height,
      dy: 0,
      x0: b.x,
      y0: b.y,
      others: systems.filter((x) => x.g !== mine).map((x) => x.r),
      bar: mb ? [mb.x, mb.x + mb.width] : [b.x, b.x],
    });
  }
  boxes.sort((a, b) => a.x - b.x || a.y - b.y);
  const hits = (a: Rect, b: Rect, gap = 0) => a.x < b.x + b.w + gap && b.x < a.x + a.w + gap && a.y - a.dy < b.y - b.dy + b.h && b.y - b.dy < a.y - a.dy + a.h;
  const show = (p: Box, k: number) => {
    p.t.textContent = k >= p.full.length ? p.full : k <= p.head.length ? p.head : `${p.full.slice(0, k).trimEnd()}…`;
    p.w = p.g.getBBox().width;
  };
  /** the longest start of the label no wider than `width` (at least its number) */
  const fit = (p: Box, width: number) => {
    let lo = p.head.length;
    let hi = p.full.length;
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2);
      show(p, mid);
      if (p.w <= width) lo = mid;
      else hi = mid - 1;
    }
    show(p, lo);
  };
  const place = (b: Box, dy: number, dx = 0) => {
    b.dy = dy;
    b.x = b.x0 + dx;
    if (dy || dx) b.g.setAttribute("transform", `translate(${dx},${-dy})`);
    else b.g.removeAttribute("transform");
  };
  const placed: Box[] = [];
  /**
   * The first place clear of everything: where the engraver put it, then up a line at a time (never past the staff
   * above), then under its own staff and the words sung there, then a little to the side within its bar.
   */
  const settle = (b: Box) => {
    const step = b.h + 20;
    const rows = [0, step, 2 * step, 3 * step];
    // its own staff: the first below where the engraver put it
    const own = lines.filter((s) => s.y > b.y0 && s.x < b.x0 + b.w && b.x0 < s.x + s.w).sort((s, t) => s.y - t.y)[0];
    if (own) {
      // just under it and the words sung there
      const ob = own.el.getBBox();
      for (let k = 0; k <= 2; k++) rows.push(-(ob.y + ob.height + 30 + k * step - b.y0));
    }
    /** a staff between where the engraver put it and here (its own staff may be passed, to go under it) */
    const wall = () =>
      b.others.some((s) => hits(s, b)) ||
      lines.some(
        (s) =>
          hits(s, b) ||
          (b.dy > 0 && s.y + s.h <= b.y0 && s.y + s.h > b.y0 - b.dy) ||
          (b.dy < 0 && !(own && Math.abs(s.y - own.y) < 1) && s.y >= b.y0 + b.h && s.y < b.y0 - b.dy + b.h),
      );
    const clear = () => !wall() && !placed.some((p) => hits(p, b, GAP)) && !words.some((o) => hits(o, b)) && !music.some((o) => hits(o, b));
    for (const dy of rows) {
      place(b, dy);
      if (clear()) return true;
    }
    for (const dy of rows)
      for (let dx = 100; b.x0 + dx < b.bar[1] - 100 || b.x0 - dx > b.bar[0]; dx += 100)
        for (const d of [dx, -dx]) {
          if (b.x0 + d >= b.bar[1] - 100 || b.x0 + d < b.bar[0]) continue;
          place(b, dy, d);
          if (clear()) return true;
        }
    place(b, 0);
    return false;
  };
  for (const b of boxes) {
    // a note just before this one gives way by shortening its label, while enough of it stays to read
    const near = placed.filter((p) => hits(p, b, GAP) && p.x + GAP < b.x);
    for (const p of near) {
      const before = p.t.textContent;
      fit(p, b.x - GAP - p.x);
      if (p.t.textContent !== p.full && (p.t.textContent ?? "").length < Math.min(p.full.length, p.head.length + 10)) {
        p.t.textContent = before;
        p.w = p.g.getBBox().width;
      }
    }
    if (settle(b)) {
      placed.push(b);
      continue;
    }
    // no room: the notes before keep only their numbers, then this one too
    for (const p of near) fit(p, Math.max(0, b.x - GAP - p.x));
    if (!settle(b)) {
      show(b, 0);
      settle(b);
    }
    placed.push(b);
  }
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export interface PrintDoc {
  title: string;
  /** the line under the folio on later pages, e.g. "Rodolfo · La bohème" */
  running: string;
  /** the score's credits line (its rights), printed at the foot of the first page */
  credits?: string;
  pages: string[];
  notes: { n: number; where: string; sign?: string; text: string }[];
  /** @font-face rules for the fonts the print uses (the app's: Cormorant Garamond, Jost, Charis SIL) */
  fontCss?: string;
  /** the title block on the first page */
  head?: PrintHead;
  /** where the music begins on the first page (mm from the top): the title block sits above it */
  firstTopMm?: number;
}

export interface PrintHead {
  eyebrow: string;
  title: string;
  role?: string;
  composer?: string;
  librettist?: string;
}

/** The title block of a printed page, in the app's type: the opera and kind, the title, then librettist, part and composer. */
export function headBlock(h: PrintHead, style = ""): string {
  return `<header class="head"${style ? ` style="${style}"` : ""}><div class="eyebrow">${esc(h.eyebrow)}</div><h1>${esc(h.title)}</h1><div class="byline"><span>${
    h.librettist ? `Libretto by ${esc(h.librettist)}` : ""
  }</span><span class="role">${h.role ? esc(h.role) : ""}</span><span>${h.composer ? esc(h.composer) : ""}</span></div></header>`;
}

/** The title block's type (the layout around it is the document's own) */
export const HEAD_CSS = `.head { text-align: center; color: #1c1a17; }
.head .eyebrow { font: 500 7pt/1.3 "Jost", "Helvetica Neue", Arial, sans-serif; letter-spacing: 0.24em; text-transform: uppercase; color: #8b7f70; }
.head h1 { margin: 2mm 0 4.2mm; font: 600 25pt/1.04 "Cormorant Garamond", Garamond, Georgia, serif; letter-spacing: 0.005em; }
.head .byline { display: grid; grid-template-columns: 1fr auto 1fr; align-items: baseline; gap: 4mm; padding-top: 3.4mm; border-top: 0.2mm solid #ddd6ca; font: italic 8.6pt/1.3 "Charis SIL", Charter, Georgia, serif; color: #4d4740; }
.head .byline span:first-child { text-align: left; }
.head .byline span:last-child { text-align: right; font-style: normal; font-family: "Cormorant Garamond", Garamond, Georgia, serif; font-weight: 600; font-size: 10.5pt; letter-spacing: 0.02em; color: #2a2622; }
.head .byline .role { font: 500 6.8pt/1.3 "Jost", Arial, sans-serif; font-style: normal; letter-spacing: 0.2em; text-transform: uppercase; color: #8b7f70; }`;

/** The print document: A4 sheets with page numbers, then the notes in full. Self-contained, so it can open anywhere. */
export function printHtml(d: PrintDoc): string {
  const total = d.pages.length;
  const h = d.head;
  const headHtml = h ? headBlock(h) : "";
  const sheets = d.pages
    .map(
      (svg, i) =>
        `<section class="sheet">${i === 0 ? headHtml : ""}${svg}<footer class="folio">${
          i === 0 ? `<span class="credits">${esc(d.credits ?? "")}</span>` : `<span class="run">${esc(d.title)} · ${esc(d.running)}</span>`
        }<span class="pno">${i + 1}<i> / ${total}</i></span></footer></section>`,
    )
    .join("");
  const list = d.notes.length
    ? `<table class="notes"><thead><tr><td class="sp-top"></td></tr></thead><tfoot><tr><td class="sp-bot"><span>${esc(d.title)} · ${esc(d.running)} · your notes</span></td></tr></tfoot><tbody><tr><td>
<h2>Your notes and marks</h2>
<p class="lede">Each number is written on the score above your part, at its bar and beat.</p>
<ol>${d.notes
        .map(
          (n) =>
            `<li><span class="num">${circled(n.n)}</span><span class="where">${esc(n.where)}</span><span class="body">${n.sign ? `<b class="sign">${esc(n.sign)}</b> ` : ""}${esc(n.text).replace(/\n/g, "<br>")}</span></li>`,
        )
        .join("")}</ol></td></tr></tbody></table>`
    : "";
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(d.title)} · score${d.notes.length ? " with your notes" : ""}</title>
<style>
${d.fontCss ?? ""}
@page { size: A4 portrait; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: #fff; color: #111; }
body { font-family: "Charis SIL", Charter, Georgia, "Times New Roman", serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.sheet { position: relative; width: 210mm; height: 297mm; overflow: hidden; background: #fff; break-after: page; page-break-after: always; break-inside: avoid; }
.sheet:last-of-type { break-after: auto; page-break-after: auto; }
.sheet > svg { display: block; position: absolute; inset: 0; width: 100%; height: 100%; }
.head { position: absolute; left: 16mm; right: 16mm; top: 16mm; }
${HEAD_CSS}
.folio { position: absolute; left: 16mm; right: 16mm; bottom: 8mm; display: flex; align-items: baseline; justify-content: space-between; gap: 8mm; padding-top: 1.8mm; border-top: 0.2mm solid #e2dccf; font: 7pt/1.4 "Charis SIL", Charter, Georgia, serif; color: #7a7268; }
.folio .credits { max-width: 140mm; font-style: italic; }
.folio .run { font: 500 6.6pt/1.4 "Jost", Arial, sans-serif; letter-spacing: 0.2em; text-transform: uppercase; color: #8b7f70; }
.folio .pno { white-space: nowrap; font: 600 10.5pt/1 "Cormorant Garamond", Garamond, Georgia, serif; color: #2a2622; font-variant-numeric: lining-nums; }
.folio .pno i { font-weight: 500; color: #9a9184; }
.notes { width: 210mm; border-collapse: collapse; break-before: page; page-break-before: always; }
.notes td { padding: 0 20mm; vertical-align: top; }
.notes .sp-top { height: 18mm; }
.notes .sp-bot { height: 16mm; vertical-align: bottom; padding-bottom: 8mm; font: 500 6.6pt/1.4 "Jost", Arial, sans-serif; letter-spacing: 0.2em; text-transform: uppercase; color: #8b7f70; }
.notes h2 { font: 600 22pt/1.1 "Cormorant Garamond", Garamond, Georgia, serif; margin: 0 0 2mm; color: #1c1a17; }
.notes .lede { margin: 0 0 6mm; font: italic 9.5pt/1.4 "Charis SIL", Georgia, serif; color: #6b6359; }
.notes ol { list-style: none; margin: 0; padding: 0; }
.notes li { display: grid; grid-template-columns: 8mm 34mm 1fr; gap: 2mm; padding: 2.6mm 0; border-top: 0.2mm solid #e2dccf; font: 10.5pt/1.45 "Charis SIL", Georgia, serif; break-inside: avoid; page-break-inside: avoid; }
.notes .num { color: ${NOTE_INK}; font-weight: 700; }
.notes .where { font: 500 7.5pt/2 "Jost", Arial, sans-serif; letter-spacing: 0.12em; text-transform: uppercase; color: #8b7f70; font-variant-numeric: tabular-nums; }
.notes .sign { color: ${NOTE_INK}; }
.bar { position: sticky; top: 0; z-index: 2; display: flex; flex-wrap: wrap; gap: 8px 16px; align-items: center; justify-content: center; padding: 10px 16px; background: #1d1d1b; color: #fff; font: 14px/1.4 system-ui, sans-serif; }
.bar button { font: inherit; padding: 6px 14px; border-radius: 999px; border: 0; background: #fff; color: #111; cursor: pointer; }
@media screen {
  html, body { background: #e7e7e3; } body { padding: 1px 0; }
  .sheet, .notes { margin: 16px auto; box-shadow: 0 1px 4px rgba(0,0,0,.18); background: #fff; }
  .sheet, .notes { zoom: var(--fit, 1); }
}
@media print {
  .bar { display: none !important; }
  body { background: #fff; }
}
</style></head><body>
<div class="bar"><span>To keep it as a PDF, print it and choose <b>Save as PDF</b> (Ctrl+P, or ⌘P on a Mac).</span><button type="button" onclick="window.print()">Print or save as PDF</button></div>
${sheets}${list}
</body></html>`;
}

/** the @font-face rules of this page for the given families, to carry into the print document */
export function fontFaceCss(families: string[]): string {
  const out: string[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue; // another origin's sheet
    }
    for (const r of Array.from(rules))
      if (r instanceof CSSFontFaceRule && families.some((f) => r.style.getPropertyValue("font-family").replace(/["']/g, "").trim() === f)) {
        // a relative url would not resolve in a document opened from a blob: make it absolute
        out.push(
          r.cssText.replace(/url\((["']?)(?!data:|blob:|https?:)([^"')]+)\1\)/g, (_m, _q, u) => `url("${new URL(u, sheet.href ?? document.baseURI).href}")`),
        );
      }
  }
  return out.join("\n");
}

export type PrintOutcome = "dialog" | "tab" | "blocked";

/**
 * Print the document from a hidden frame. True when the print dialog opened: the browser announces it with
 * beforeprint. In a sandboxed page without the right to open dialogs, print() returns at once and announces nothing.
 */
async function printInFrame(html: string): Promise<boolean> {
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.tabIndex = -1;
  // laid out at A4 width (so its pages are drawn as printed) but out of sight
  frame.style.cssText = "position:fixed;left:-10000px;top:0;width:210mm;height:297mm;border:0;opacity:0;pointer-events:none";
  const loaded = new Promise<void>((res) => frame.addEventListener("load", () => res(), { once: true }));
  frame.srcdoc = html;
  document.body.appendChild(frame);
  let began = false;
  try {
    await Promise.race([loaded, new Promise((r) => setTimeout(r, 8000))]);
    const win = frame.contentWindow;
    const fdoc = frame.contentDocument;
    if (!win || !fdoc || typeof win.print !== "function") return false;
    await Promise.race([(fdoc as Document & { fonts?: FontFaceSet }).fonts?.ready, new Promise((r) => setTimeout(r, 3000))]);
    win.addEventListener("beforeprint", () => (began = true));
    win.focus();
    win.print();
    // print() blocks while the dialog is open in most browsers; others announce it a moment later
    if (!began) await new Promise((r) => setTimeout(r, 600));
    return began;
  } catch {
    return false;
  } finally {
    if (!began) frame.remove();
    // a dialog that does not block may still be printing the frame: it goes once the dialog has closed
    else {
      const gone = () => setTimeout(() => frame.remove(), 1000);
      frame.contentWindow?.addEventListener("afterprint", gone, { once: true });
      setTimeout(() => frame.remove(), 120_000);
    }
  }
}

/** Open the document in a new tab, where it prints itself (or the reader prints it). False when the tab was refused. */
export function openInTab(html: string): boolean {
  try {
    // on a narrow screen the pages are shown smaller (on screen only); then the print dialog opens by itself
    const auto = html.replace(
      "</body>",
      `<script>function fit(){var w=document.documentElement.clientWidth;document.documentElement.style.setProperty("--fit",String(Math.min(1,(w-16)/794)))}fit();addEventListener("resize",fit);addEventListener("load",function(){setTimeout(function(){try{window.print()}catch(e){}},500)})</script></body>`,
    );
    const url = URL.createObjectURL(new Blob([auto], { type: "text/html" }));
    const w = window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 120_000);
    return !!w;
  } catch {
    return false;
  }
}

/** Print the document: in a print dialog here if the page may open one, else from a new tab. */
export async function printDocument(html: string): Promise<PrintOutcome> {
  if (await printInFrame(html)) return "dialog";
  return openInTab(html) ? "tab" : "blocked";
}
