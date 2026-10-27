import { useEffect, useLayoutEffect, useMemo, useRef, useState, type MutableRefObject, type ReactNode } from "react";
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";
import { buildLayout, type Lane, type ScoreLayout } from "./layout";
import type { Performance } from "../../shared/timeline";
import type { CompiledEdition, Cut } from "../../shared/types";

export interface CursorReading {
  q: number;
  show: boolean;
  playing: boolean;
  label: string;
}
export interface MarkerReading {
  q: number;
  live: boolean;
  label: string;
}

export interface Band {
  id: string;
  m: number; // measure idx where the phrase starts
  q: number;
  endM: number;
  text: string;
  ipa: string;
  translation?: string;
  words: string[];
  activeWord: number; // -1 when no word of this phrase is sounding
  active: boolean;
}

/** One sung line shown above the music as full text, with its IPA and translation. */
export interface SungLine {
  id: string;
  translation: string;
  ipa: string;
  words: { text: string }[];
  start: { m: number; q: number };
  activeWord: number; // -1 when no word of this line is sounding
  active: boolean;
}

export interface Flag {
  id: string;
  m: number;
  q: number;
  kind: "comment" | "correction" | "note" | "cue";
  label: string;
}

interface Props {
  xml: string;
  edition: CompiledEdition;
  perf: Performance;
  visibleXmlParts: string[] | null;
  zoom: number;
  cursor: MutableRefObject<() => CursorReading | null>;
  marker: MutableRefObject<() => MarkerReading | null>;
  scrollTarget: "cursor" | "marker" | "none";
  loop: { startQ: number; endQ: number } | null;
  selection: { startM: number; endM: number } | null;
  cuts: Cut[];
  flags: Flag[];
  onTap: (pos: { m: number; q: number }, ev: { shift: boolean }) => void;
  onFlag?: (flag: Flag) => void;
  onUserScroll: () => void;
  onLayout?: (layout: ScoreLayout) => void;
  /** Phrase bands drawn above the notes (full text, IPA, listen button). */
  bands?: Band[];
  bandRows?: { ipa: boolean; translation: boolean };
  speakingId?: string | null;
  onSpeak?: (id: string) => void;
  onBand?: (id: string) => void;
  /** Sung text drawn above the notes; replaces the renderer's own lyrics below the staff. */
  lyrics?: SungLine[];
  lyricRows?: { ipa: boolean; translation: boolean };
  /** Content of the card that opens when a word is tapped. */
  renderWordCard?: (lineId: string, word: number, close: () => void) => ReactNode;
  /** One single line of music that scrolls sideways under the playhead (no systems stacked vertically). */
  strip?: boolean;
  /** Row headers beside the single line: one per part, plus the sung-text band (strip mode). */
  renderLanes?: (lanes: Lane[], text: { top: number; bottom: number } | null) => ReactNode;
  /** Colour of the engraved music (follows the theme). */
  ink?: string;
  /** Colour the note sounding now, in the first of these parts that has one (xml part ids). */
  nowNoteParts?: string[];
  /** Parts drawn faded (still on the line, but quiet to the eye). */
  fadedXmlParts?: string[];
  /** false: the top staff (a sung line) stands on its own, and the system line at the left joins only the staves below it. */
  joinTopStaff?: boolean;
}

// Sizes of the sung-text rows at zoom 1 (px); they scale with the zoom.
const IT_PX = 22;
const IPA_PX = 15;
const TR_PX = 15;
const SANS = '"Jost", "Noto Music", "Futura", "Helvetica Neue", Arial, sans-serif';
const IPA_FONT = '"Noto Sans", "Charis SIL", "Segoe UI", sans-serif';
function rowsHeight(rows: { ipa: boolean; translation: boolean }): number {
  return 20 + IT_PX * 1.3 + (rows.ipa ? IPA_PX * 1.45 : 0) + (rows.translation ? TR_PX * 1.5 : 0) + 12;
}

type Rect = { x: number; y: number; w: number; h: number; first: boolean; last: boolean; m0: number; m1: number };

/** Merge consecutive measures on the same system into rectangles. */
function rangeRects(layout: ScoreLayout, ms: number[]): Rect[] {
  const out: Rect[] = [];
  const sorted = [...new Set(ms)].sort((a, b) => a - b);
  for (const m of sorted) {
    const b = layout.measures.get(m);
    if (!b) continue;
    const last = out[out.length - 1];
    const sys = layout.systems.find((s) => s.id === b.system)!;
    if (last && last.m1 === m - 1 && Math.abs(last.y - (sys.top - 26)) < 1) {
      last.w = b.x + b.w - last.x;
      last.m1 = m;
    } else out.push({ x: b.x, y: sys.top - 26, w: b.w, h: sys.bottom - sys.top + 52, first: false, last: false, m0: m, m1: m });
  }
  return out;
}

/** The band of the single line that holds anything drawn (slurs and marks above, syllables below), in px. */
export function stripCrop(layout: ScoreLayout): { top: number; h: number } | null {
  const s = layout.systems[0];
  if (!s) return null;
  const top = Math.max(0, Math.floor(Math.min(s.extentTop, s.top - 40) - 20));
  return { top, h: Math.ceil(Math.max(s.extentBottom, s.bottom + 30) + 16) - top };
}

const ENGRAVING_TEXT_FONT = "'Charis SIL', Charter, Georgia, 'Times New Roman', serif";

/**
 * House style, after the proportions of a good printed edition (Henle, Bärenreiter) and Elaine Gould's
 * "Behind Bars". All values are in staff spaces unless noted; OSMD draws 10 units per staff space.
 * - Bravura, the SMuFL reference font drawn after traditional European engraving, instead of VexFlow's
 *   light Gonville: rounder, heavier noteheads, firm clefs and accidentals.
 * - Firm lines: staff lines 0.13, stems 0.13, ledger lines 0.16 (1.6 units), barlines 0.16, beams 0.5.
 * - Lyrics a little larger than OSMD's default, since a phone or tablet shows the staff small.
 * - Slurs kept closer to the notes; more air between the sung line (with its words) and the piano.
 */
function engraveLikeAPrintedEdition(osmd: OpenSheetMusicDisplay) {
  const r = osmd.EngravingRules;
  r.DefaultVexFlowNoteFont = "bravura";
  r.StaffLineWidth = 0.13;
  r.StemWidth = 0.13;
  r.LedgerLineWidth = 1.6;
  r.SystemThinLineWidth = 0.16;
  r.SystemBoldLineWidth = 0.5;
  r.WedgeLineWidth = 0.13;
  r.LyricsHeight = 2.3;
  r.LyricsYMarginToBottomLine = 0.6;
  r.BetweenSyllableMinimumDistance = 0.8;
  r.MeasureNumberLabelHeight = 1.25;
  r.SlurHeightFactor = 0.55;
  r.DynamicExpressionSpacer = 1;
  r.StaffDistance = 8.5;
}

/**
 * A sung line above its accompaniment, as in many vocal scores: the line at the start (and end) of the system
 * joins only the accompaniment's staves, so the voice is not tied to the piano by a black stroke running
 * down through the space between them (which also crossed into the faded piano).
 */
function detachTopStaff(svg: SVGSVGElement) {
  const staves = [...svg.querySelectorAll<SVGGElement>(":scope > g.staffline")];
  if (staves.length < 2) return;
  const lineTop = (st: SVGGElement) => {
    const m = st.querySelector<SVGGElement>("g.vf-measure");
    const ys = [...(m?.children ?? [])].filter((c) => c.tagName === "path" && !c.getAttribute("class")).map((c) => (c as SVGGraphicsElement).getBBox().y);
    return ys.length ? Math.min(...ys) : null;
  };
  const top0 = lineTop(staves[0]);
  const top1 = lineTop(staves[1]);
  if (top0 === null || top1 === null) return;
  for (const r of svg.querySelectorAll<SVGRectElement>(".vf-connector rect")) {
    const y = Number(r.getAttribute("y"));
    const h = Number(r.getAttribute("height"));
    if (Math.abs(y - top0) > 3 || y + h <= top1) continue;
    r.setAttribute("y", String(top1));
    r.setAttribute("height", String(y + h - top1));
  }
}

/**
 * On the moving line the clef and key signature scroll away after a few bars. A printed page repeats them
 * at the start of every system, so here they stay pinned at the left edge. One panel per clef/key setting:
 * the panel shown is the last one whose bar has scrolled past the edge (the key changes at bar 5, say).
 */
interface Pinned {
  fromX: number; // svg units: where this setting starts
  html: string;
}
function buildPinned(svg: SVGSVGElement): { panels: Pinned[]; width: number; vbH: number; scale: number } | null {
  const vb = svg.viewBox.baseVal;
  if (!vb || !vb.width) return null;
  const scale = svg.getBoundingClientRect().width / vb.width;
  const staves = [...svg.querySelectorAll<SVGGElement>(":scope > g.staffline")];
  if (!staves.length) return null;
  const first = staves.map((st) => st.querySelector<SVGGElement>("g.vf-measure"));
  // the panel ends after the widest opening clef + key signature
  let end = 0;
  for (const m of first)
    for (const el of m?.querySelectorAll<SVGGraphicsElement>(".vf-clef, .vf-keysignature") ?? []) {
      const b = el.getBBox();
      end = Math.max(end, b.x + b.width);
    }
  if (!end) return null;
  const width = end + 12;
  const lines = staves
    .map((st, i) => {
      const m = first[i];
      if (!m) return "";
      // the five staff lines of the first bar, cut to the panel by the viewBox
      return [...m.children].filter((c) => c.tagName === "path" && !c.getAttribute("class")).map((c) => c.outerHTML).join("");
    })
    .join("");
  const connectors = [...svg.querySelectorAll<SVGGraphicsElement>(".vf-brace, .vf-connector")]
    .filter((c) => c.getBBox().x < 40)
    .map((c) => c.outerHTML)
    .join("");
  // every place a clef or key signature is printed, per staff
  const marks = staves.map((st) =>
    [...st.querySelectorAll<SVGGraphicsElement>(".vf-clef, .vf-keysignature")].map((el) => ({ x: el.getBBox().x, cls: el.getAttribute("class") ?? "", el })),
  );
  const starts = [...new Set(marks.flat().map((k) => Math.round(k.x)))].sort((a, b) => a - b);
  const panels: Pinned[] = [];
  for (const sx of starts) {
    const parts = staves.map((_, i) => {
      // the clef and key in force from sx on: the latest of each at or before sx, moved to the panel's place
      const upto = marks[i].filter((k) => Math.round(k.x) <= sx);
      const pick = (c: string) => [...upto].reverse().find((k) => k.cls.includes(c));
      const clef = pick("vf-clef");
      const key = pick("vf-keysignature");
      const place = (k: typeof clef, home: number) => {
        if (!k) return "";
        const dx = home - k.el.getBBox().x;
        return `<g transform="translate(${dx.toFixed(2)},0)">${k.el.outerHTML}</g>`;
      };
      const firstClef = first[i]?.querySelector<SVGGraphicsElement>(".vf-clef");
      const firstKey = first[i]?.querySelector<SVGGraphicsElement>(".vf-keysignature");
      return place(clef, firstClef?.getBBox().x ?? 35) + place(key, firstKey?.getBBox().x ?? (firstClef ? firstClef.getBBox().x + 35 : 70));
    });
    const html = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width.toFixed(1)} ${vb.height.toFixed(1)}" width="${(width * scale).toFixed(1)}" height="${(vb.height * scale).toFixed(1)}">${lines}${connectors}${parts.join("")}</svg>`;
    if (!panels.length || panels[panels.length - 1].html !== html) panels.push({ fromX: sx, html });
  }
  return { panels, width: width * scale, vbH: vb.height, scale };
}

/** The graphical note(s) sounding at (measure, quarter) in the first listed part that has one (not a rest). */
function findSoundingNote(osmd: OpenSheetMusicDisplay, m: number, q: number, parts: string[]): { key: string; els: Element[] } | null {
  const sheet = osmd.GraphicSheet;
  if (!sheet) return null;
  for (const partId of parts) {
    for (let mi = m; mi >= Math.max(0, m - 1); mi--) {
      const row = sheet.MeasureList[mi] ?? [];
      const gms = row.filter((gm) => gm?.ParentStaff?.ParentInstrument?.IdString === partId && gm.ParentStaff.ParentInstrument.Visible);
      // the latest onset at or before q (a held note keeps its colour; look one bar back for ties over the bar line)
      let best: { ts: number; ge: (typeof gms)[number]["staffEntries"][number] } | null = null;
      for (const gm of gms)
        for (const ge of gm.staffEntries ?? []) {
          const ts = ge.relInMeasureTimestamp.RealValue * 4;
          if (mi === m && ts > q + 1e-6) continue;
          if (!best || ts >= best.ts) best = { ts, ge };
        }
      if (!best) continue;
      const notes = best.ge.graphicalVoiceEntries.flatMap((v) => v.notes);
      const sounding = notes.filter((n) => !n.sourceNote.isRest());
      if (!sounding.length) break; // a rest: nothing sounds in this part
      const els = sounding
        .map((n) => (n as unknown as { getSVGGElement?: () => SVGGElement | null }).getSVGGElement?.())
        .filter((e): e is SVGGElement => !!e);
      if (els.length) return { key: `${partId}:${mi}:${best.ts}`, els };
      break;
    }
  }
  return null;
}

export function ScoreView(props: Props) {
  const { xml, visibleXmlParts, zoom } = props;
  const scrollRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const lanesRef = useRef<HTMLDivElement>(null);
  const haloEl = useRef<HTMLDivElement>(null);
  const litKey = useRef<string>("");
  const litEls = useRef<Element[]>([]);
  const strip = !!props.strip;
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);
  const cursorEl = useRef<HTMLDivElement>(null);
  const markerEl = useRef<HTMLDivElement>(null);
  const measureEl = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<ScoreLayout | null>(null);
  const [pinned, setPinned] = useState<ReturnType<typeof buildPinned>>(null);
  const [pinIdx, setPinIdx] = useState(-1);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [width, setWidth] = useState(0);
  const layoutRef = useRef<ScoreLayout | null>(null);
  const progScrollAt = useRef(0);
  const userScrollAt = useRef(0);
  const lastSystem = useRef<number | null>(null);
  const propsRef = useRef(props);
  propsRef.current = props;
  const [openWord, setOpenWord] = useState<{ line: string; word: number } | null>(null);
  const [, setFontTick] = useState(0);
  const measureCtx = useMemo(() => document.createElement("canvas").getContext("2d"), []);
  useEffect(() => {
    // re-measure once the web fonts have arrived
    (document as Document & { fonts?: FontFaceSet }).fonts?.ready.then(() => setFontTick((x) => x + 1));
  }, []);
  useEffect(() => {
    if (!openWord) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenWord(null);
    const onDown = (e: PointerEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest(".word-card") && !t.closest(".sung-word")) setOpenWord(null);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [openWord]);

  // load
  useEffect(() => {
    let cancelled = false;
    const host = hostRef.current!;
    host.replaceChildren(); // a previous score's emptied page must not stay above the new one
    const osmd = new OpenSheetMusicDisplay(host, {
      backend: "svg",
      autoResize: false,
      drawTitle: false,
      drawSubtitle: false,
      drawComposer: false,
      drawLyricist: false,
      drawCredits: false,
      drawPartNames: !strip,
      drawPartAbbreviations: !strip,
      drawMeasureNumbers: true,
      measureNumberInterval: 1,
      autoBeam: true,
      autoGenerateMultipleRestMeasuresFromRestMeasures: false,
      pageFormat: "Endless",
      followCursor: false,
      newSystemFromXML: false,
      renderSingleHorizontalStaffline: strip,
      // text in the score (lyrics, dynamics, bar numbers) in a book serif, as in a printed edition
      defaultFontFamily: ENGRAVING_TEXT_FONT,
    });
    osmd.EngravingRules.PageLeftMargin = 3;
    osmd.EngravingRules.PageRightMargin = 3;
    osmd.EngravingRules.PageTopMargin = 4;
    osmd.EngravingRules.MinimumDistanceBetweenSystems = 9;
    engraveLikeAPrintedEdition(osmd);
    osmdRef.current = osmd;
    setLoaded(false);
    // the text font must be loaded before the score is measured, or the lyrics are spaced for a fallback font
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    const fontsReady = fonts
      ? Promise.all([fonts.load("20px 'Charis SIL'"), fonts.load("italic 20px 'Charis SIL'"), fonts.load("italic 700 20px 'Charis SIL'")]).catch(() => undefined)
      : Promise.resolve();
    Promise.resolve(fontsReady)
      .then(() => osmd.load(xml))
      .then(() => {
        if (!cancelled) setLoaded(true);
      })
      .catch((e: Error) => !cancelled && setError(`The score could not be displayed: ${e.message}`));
    return () => {
      cancelled = true;
      osmd.clear();
      osmdRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xml, strip]);

  // which pinned clef/key is in force at the left edge (none while the opening ones are still in view)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !strip || !pinned) return;
    const update = () => {
      const edge = el.scrollLeft / pinned.scale;
      // always shown (at the very start it lies exactly over the printed clef and key)
      let idx = 0;
      pinned.panels.forEach((p, i) => p.fromX < edge + pinned.width / pinned.scale && (idx = i));
      setPinIdx(idx);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    return () => el.removeEventListener("scroll", update);
  }, [strip, pinned]);

  // on the single line, a vertical wheel or trackpad gesture moves along the line
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !strip) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX) || el.scrollWidth <= el.clientWidth) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
      userScrollAt.current = performance.now();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [strip]);

  // width tracking
  useLayoutEffect(() => {
    const el = scrollRef.current!;
    const ro = new ResizeObserver(() => setWidth(Math.round(el.clientWidth / 24) * 24));
    ro.observe(el);
    setWidth(Math.round(el.clientWidth / 24) * 24);
    return () => ro.disconnect();
  }, []);

  // render (view / zoom / width)
  const visKey = visibleXmlParts ? visibleXmlParts.join(",") : "all";
  const hasBands = !!props.bands?.length;
  const hasLyrics = !!props.lyrics?.length;
  const crop = strip && layout ? stripCrop(layout) : null;
  const rowSrc = hasLyrics ? props.lyricRows : props.bandRows;
  const rowsKey = `${rowSrc?.ipa ? "i" : ""}${rowSrc?.translation ? "t" : ""}`;
  useEffect(() => {
    const osmd = osmdRef.current;
    if (!osmd || !loaded || !width) return;
    for (const ins of osmd.Sheet.Instruments) ins.Visible = !visibleXmlParts || visibleXmlParts.includes(ins.IdString);
    if (props.ink) {
      osmd.EngravingRules.applyDefaultColorMusic(props.ink);
      osmd.EngravingRules.StaffLineColor = props.ink;
    }
    osmd.Zoom = zoom;
    // leave room above every system for the phrase bands (sized in pixels, converted to OSMD units)
    const unitPx = 10 * zoom;
    if (hasLyrics) {
      // the score's own syllables stay under the notes; the full line is drawn above, with room for its rows
      const rows = rowsHeight({ ipa: rowsKey.includes("i"), translation: rowsKey.includes("t") });
      osmd.EngravingRules.PageTopMargin = Math.ceil(rows / 10 + 3);
      osmd.EngravingRules.MinSkyBottomDistBetweenSystems = rows / 10 + 1.5;
      osmd.EngravingRules.MinimumDistanceBetweenSystems = 4;
    } else {
      osmd.EngravingRules.MinSkyBottomDistBetweenSystems = 5;
      const bandPx = hasBands ? 70 + (rowsKey.includes("t") ? 22 : 0) + (rowsKey.includes("i") ? 20 : 0) : 0;
      osmd.EngravingRules.PageTopMargin = hasBands ? Math.ceil((bandPx + 40) / unitPx) : 4;
      osmd.EngravingRules.MinimumDistanceBetweenSystems = hasBands ? Math.ceil((bandPx + 100) / unitPx) : 9;
    }
    try {
      osmd.render();
      litKey.current = "";
      litEls.current = [];
      const l = buildLayout(osmd);
      layoutRef.current = l;
      const drawn = hostRef.current?.querySelector("svg") as SVGSVGElement | null;
      if (drawn && props.joinTopStaff === false) detachTopStaff(drawn);
      if (strip) setPinned(drawn ? buildPinned(drawn) : null);
      lastSystem.current = null;
      setLayout(l);
      props.onLayout?.(l);
    } catch (e) {
      setError(`The score could not be displayed: ${(e as Error).message}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, visKey, zoom, width, hasBands, hasLyrics, rowsKey, props.ink]);

  // animation loop: cursor, marker, auto-scroll
  useEffect(() => {
    let raf = 0;
    const frame = () => {
      raf = requestAnimationFrame(frame);
      const l = layoutRef.current;
      const p = propsRef.current;
      if (!l) return;
      const place = (el: HTMLDivElement | null, q: number | null) => {
        if (!el) return null;
        if (q === null) {
          el.style.display = "none";
          return null;
        }
        const loc = p.perf.locate(q);
        const pt = l.point(loc.m, loc.q, p.edition.measures[loc.m].durQ);
        if (!pt) {
          el.style.display = "none";
          return null;
        }
        const sys = l.systems.find((s) => s.id === pt.system)!;
        el.style.display = "block";
        el.style.transform = `translate(${pt.x.toFixed(1)}px, ${(sys.top - 22).toFixed(1)}px)`;
        el.style.height = `${(sys.bottom - sys.top + 44).toFixed(1)}px`;
        return { pt, sys, loc };
      };
      const c = p.cursor.current();
      const placedC = place(cursorEl.current, c && c.show ? c.q : null);
      if (cursorEl.current && c) {
        cursorEl.current.dataset.playing = c.playing ? "true" : "false";
        const lab = cursorEl.current.querySelector(".cursor-label");
        if (lab && lab.textContent !== c.label) lab.textContent = c.label;
      }
      if (measureEl.current) {
        if (placedC && c?.playing) {
          const b = l.measures.get(placedC.loc.m)!;
          measureEl.current.style.display = "block";
          measureEl.current.style.transform = `translate(${b.x}px, ${placedC.sys.top - 22}px)`;
          measureEl.current.style.width = `${b.w}px`;
          measureEl.current.style.height = `${placedC.sys.bottom - placedC.sys.top + 44}px`;
        } else measureEl.current.style.display = "none";
      }
      // the note sounding now, in colour, with a soft halo behind it
      const osmd = osmdRef.current;
      const sheet = sheetRef.current;
      if (p.nowNoteParts && osmd && sheet) {
        let key = "";
        let els: Element[] = [];
        if (c && c.show) {
          const loc = p.perf.locate(c.q);
          const found = findSoundingNote(osmd, loc.m, loc.q, p.nowNoteParts);
          if (found) {
            key = found.key;
            if (key !== litKey.current) els = found.els;
          }
        }
        if (key !== litKey.current) {
          for (const e of litEls.current) e.classList.remove("cp-now-note");
          for (const e of els) e.classList.add("cp-now-note");
          litEls.current = els;
          litKey.current = key;
          const halo = haloEl.current;
          if (halo) {
            const head = els[0]?.querySelector(".vf-notehead") ?? els[0];
            if (head) {
              const r = head.getBoundingClientRect();
              const sr = sheet.getBoundingClientRect();
              halo.style.display = "block";
              halo.style.transform = `translate(${(r.left + r.width / 2 - sr.left).toFixed(1)}px, ${(r.top + r.height / 2 - sr.top).toFixed(1)}px)`;
            } else halo.style.display = "none";
          }
        }
      }
      const mk = p.marker.current();
      const placedM = place(markerEl.current, mk ? mk.q : null);
      if (markerEl.current && mk) {
        markerEl.current.dataset.live = mk.live ? "true" : "false";
        const lab = markerEl.current.querySelector(".marker-label");
        if (lab && lab.textContent !== mk.label) lab.textContent = mk.label;
      }
      // auto-scroll keeps the followed position's system comfortably in view
      const target = p.scrollTarget === "cursor" ? placedC : p.scrollTarget === "marker" ? placedM : null;
      const sc = scrollRef.current;
      // a person scrolling by hand always wins over auto-scroll for a moment
      const userRecently = performance.now() - userScrollAt.current < 2500;
      if (p.strip && sc && sheetRef.current && !userRecently) {
        // one line: the music moves, the playhead stays about a third of the way in
        const followed = target ?? placedC;
        if (followed) {
          const lanesW = lanesRef.current?.offsetWidth ?? 0;
          const x = sheetRef.current.offsetLeft + followed.pt.x;
          const viewL = sc.scrollLeft + lanesW;
          const viewR = sc.scrollLeft + sc.clientWidth;
          const want = Math.max(0, x - lanesW - (sc.clientWidth - lanesW) * 0.3);
          if (target) {
            if (Math.abs(want - sc.scrollLeft) > 0.5) sc.scrollLeft = want;
          } else if (x < viewL + 24 || x > viewR - 24) {
            sc.scrollLeft = want;
          }
        }
      } else if (target && sc && !userRecently) {
        const top = target.sys.top - 40;
        const bottom = target.sys.extentBottom + 30;
        const viewTop = sc.scrollTop;
        const viewBottom = sc.scrollTop + sc.clientHeight;
        const changed = lastSystem.current !== target.sys.id;
        const tall = bottom - top > sc.clientHeight;
        const out = tall ? top < viewTop - 2 || top > viewBottom - 80 : top < viewTop || bottom > viewBottom;
        if ((out || (changed && !tall && bottom > viewBottom - sc.clientHeight * 0.25)) && performance.now() - progScrollAt.current > 350) {
          progScrollAt.current = performance.now();
          sc.scrollTo({ top: Math.max(0, top - (tall ? 0 : sc.clientHeight * 0.12)), behavior: "smooth" });
        }
        lastSystem.current = target.sys.id;
      }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  const loopMeasures = useMemo(() => {
    if (!props.loop) return [];
    const ms: number[] = [];
    for (const pm of props.perf.measures) if (pm.startQ >= props.loop.startQ - 1e-6 && pm.startQ < props.loop.endQ - 1e-6) ms.push(pm.m);
    return ms;
  }, [props.loop, props.perf]);

  const selMeasures = useMemo(() => {
    if (!props.selection) return [];
    const out: number[] = [];
    for (let m = props.selection.startM; m <= props.selection.endM; m++) out.push(m);
    return out;
  }, [props.selection]);

  const onPointerUp = (e: React.PointerEvent) => {
    const l = layoutRef.current;
    const host = hostRef.current;
    if (!l || !host) return;
    if ((e.target as HTMLElement).closest("button, .word-card, .sung-block")) return;
    const r = host.getBoundingClientRect();
    const hit = l.hit(e.clientX - r.left, e.clientY - r.top);
    if (hit) props.onTap(hit, { shift: e.shiftKey });
  };

  // wheel, touch and paging keys only come from people, never from programmatic scrolling
  const userScrolled = () => {
    userScrollAt.current = performance.now();
    props.onUserScroll();
  };

  /** Where the full-line text band sits above the music (strip mode: one band for the whole line). */
  function textBand(l: ScoreLayout): { top: number; bottom: number } | null {
    if (!hasLyrics || !l.systems.length) return null;
    const rows = props.lyricRows ?? { ipa: true, translation: true };
    const sys = l.systems[0];
    const bottom = Math.min(sys.top - 10 * zoom, sys.extentTop - 8 * zoom);
    return { top: bottom - rowsHeight(rows) * zoom + 12 * zoom, bottom };
  }

  function renderSungText(l: ScoreLayout) {
    const rows = props.lyricRows ?? { ipa: true, translation: true };
    const z = zoom;
    const fIt = IT_PX * z;
    const fIpa = IPA_PX * z;
    const fTr = TR_PX * z;
    const measure = (text: string, font: string) => {
      if (!measureCtx) return text.length * 9 * z;
      measureCtx.font = font;
      return measureCtx.measureText(text).width;
    };
    const itFont = `500 ${fIt}px ${SANS}`;
    const ipaFont = `400 ${fIpa}px ${IPA_FONT}`;
    const trFont = `italic 400 ${fTr}px ${SANS}`;
    const out: ReactNode[] = [];
    const prevRight = new Map<number, number>();
    for (const line of props.lyrics ?? []) {
      const pt = l.point(line.start.m, line.start.q, props.edition.measures[line.start.m].durQ);
      if (!pt) continue;
      const sys = l.systems.find((x) => x.id === pt.system)!;
      const bottom = props.strip ? textBand(l)!.bottom : Math.min(sys.top - 10 * z, sys.extentTop - 8 * z);
      const textW = measure(line.words.map((w) => w.text).join(" "), itFont);
      const w = Math.max(textW, rows.ipa ? measure(`[${line.ipa}]`, ipaFont) : 0, rows.translation ? measure(line.translation, trFont) : 0) + 64 * z;
      // the block starts at the line's first note, or just after the previous block
      const left = Math.max(pt.x - 46 * z, (prevRight.get(sys.id) ?? -1e9) + 10 * z);
      prevRight.set(sys.id, left + w);
      const open = openWord?.line === line.id ? openWord.word : -1;
      out.push(
        <div key={line.id} className={`sung-block${line.active ? " now" : ""}`} style={{ left, top: bottom }} data-line={line.id}>
          <button
            type="button"
            className={`sung-speak${props.speakingId === line.id ? " speaking" : ""}`}
            style={{ width: 34 * z, height: 34 * z }}
            aria-label={`Hear the line spoken: ${line.words.map((x) => x.text).join(" ")}`}
            onClick={(e) => {
              e.stopPropagation();
              props.onSpeak?.(line.id);
            }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3.5 9H8l5-4.5v15L8 15H3.5z" />
              <path className="wave" d="M16.2 8.6a4.8 4.8 0 0 1 0 6.8M18.8 6a8.5 8.5 0 0 1 0 12" />
            </svg>
          </button>
          <div className="sung-body">
            <p className="sung-line" lang="it" style={{ fontSize: fIt }}>
              {line.words.map((wd, k) => (
                <span key={k}>
                  {k > 0 && " "}
                  <button
                    type="button"
                    className={`sung-word${k === line.activeWord ? " now" : ""}${k === open ? " open" : ""}`}
                    aria-label={`${wd.text}: show meaning`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenWord((o) => (o && o.line === line.id && o.word === k ? null : { line: line.id, word: k }));
                    }}
                  >
                    {wd.text}
                  </button>
                </span>
              ))}
            </p>
            {rows.ipa && (
              <p className="sung-ipa" lang="it-fonipa" style={{ fontSize: fIpa }}>
                [{line.ipa}]
              </p>
            )}
            {rows.translation && (
              <p className="sung-tr" style={{ fontSize: fTr }}>
                {line.translation}
              </p>
            )}
          </div>
        </div>,
      );
      if (open >= 0 && props.renderWordCard) {
        const before = measure(line.words.slice(0, open).map((x) => x.text + " ").join(""), itFont);
        const cardW = Math.min(330, l.width - 16);
        const cl = Math.max(8, Math.min(left + 46 * z + before - 14, l.width - cardW - 8));
        out.push(
          <div key={`${line.id}-card`} className="word-card" style={{ left: cl, top: bottom + 10 * z, width: cardW }} role="dialog" aria-label="Word meaning">
            {props.renderWordCard(line.id, open, () => setOpenWord(null))}
          </div>,
        );
      }
    }
    return out;
  }

  return (
    <div
      className={`score-scroll${strip ? " strip" : ""}`}
      ref={scrollRef}
      onWheel={userScrolled}
      onTouchMove={userScrolled}
      onKeyDown={(e) => ["PageDown", "PageUp", "ArrowDown", "ArrowUp", " "].includes(e.key) && userScrolled()}
      tabIndex={-1}
    >
      <div className={strip ? "strip-clip" : "sheet-clip"} style={strip && crop ? { height: crop.h } : undefined}>
      <div className={strip ? "strip-row" : "sheet-row"} style={strip && crop ? { marginTop: -crop.top } : undefined}>
      {strip && pinned && pinIdx >= 0 && (
        <div className="pin-clef" style={{ width: pinned.width, marginRight: -pinned.width, height: layout?.height }} aria-hidden="true">
          <div dangerouslySetInnerHTML={{ __html: pinned.panels[pinIdx].html }} />
          {layout &&
            props.fadedXmlParts?.map((pid) => {
              const i = layout.lanes.findIndex((l) => l.partId === pid);
              if (i < 0) return null;
              const lane = layout.lanes[i];
              const prev = layout.lanes[i - 1];
              const next = layout.lanes[i + 1];
              const top = prev ? (prev.extBottom + lane.extTop) / 2 : 0;
              const bottom = next ? (lane.extBottom + next.extTop) / 2 : layout.height;
              return <div key={pid} className="ov-fade" style={{ position: "absolute", left: 0, top, width: "100%", height: bottom - top }} />;
            })}
        </div>
      )}
      {strip && props.renderLanes && (
        <div className="lanes" ref={lanesRef} style={layout ? { height: layout.height } : undefined}>
          {layout && props.renderLanes(layout.lanes, textBand(layout))}
        </div>
      )}
      <div
        className={`score-sheet${strip ? " strip" : ""}`}
        ref={sheetRef}
        style={strip && layout ? { width: layout.width, height: layout.height } : undefined}
        onPointerUp={onPointerUp}
      >
        {error && <p className="score-error">{error}</p>}
        {!loaded && !error && <p className="score-loading">Engraving the score…</p>}
        <div ref={hostRef} className="osmd-host" />
        <div className="score-overlay" aria-hidden={false}>
          {layout &&
            rangeRects(layout, loopMeasures).map((r, i) => (
              <div key={`loop${i}`} className="ov-loop" style={{ left: r.x, top: r.y + 6, width: r.w, height: r.h - 12 }} />
            ))}
          {layout &&
            rangeRects(layout, selMeasures).map((r, i) => (
              <div key={`sel${i}`} className="ov-selection" style={{ left: r.x, top: r.y, width: r.w, height: r.h }} />
            ))}
          {layout &&
            props.cuts.map((c) => {
              const ms: number[] = [];
              for (let m = c.startM; m <= c.endM; m++) ms.push(m);
              const rects = rangeRects(layout, ms);
              return rects.map((r, i) => (
                <div
                  key={`${c.id}-${i}`}
                  className={`ov-cut${c.status === "flagged" ? " flagged" : ""}`}
                  style={{ left: r.x, top: r.y, width: r.w, height: r.h }}
                  title={c.status === "flagged" ? "Cut needs editorial correction" : "Production cut: skipped in playback"}
                >
                  {r.m0 === c.startM && <span className="vide vi">vi–</span>}
                  {r.m1 === c.endM && <span className="vide de">–de</span>}
                  {i === 0 && (
                    <span className="ov-cut-label">
                      {c.status === "flagged" ? "Cut needs correction" : "Cut"} m. {props.edition.measures[c.startM].number}–{props.edition.measures[c.endM].number}
                    </span>
                  )}
                </div>
              ));
            })}
          {layout &&
            props.flags.map((f) => {
              const pt = layout.point(f.m, f.q, props.edition.measures[f.m].durQ);
              if (!pt) return null;
              const sys = layout.systems.find((s) => s.id === pt.system)!;
              const stackIndex = props.flags.filter((g) => g.m === f.m && g.kind !== "cue" && props.flags.indexOf(g) < props.flags.indexOf(f)).length;
              return (
                <button
                  key={`${f.kind}-${f.id}`}
                  type="button"
                  className={`ov-flag ov-${f.kind}`}
                  style={{ left: pt.x - 4, top: f.kind === "cue" ? sys.extentBottom + 2 : sys.top - 50 - stackIndex * 24 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    props.onFlag?.(f);
                  }}
                  title={f.label}
                >
                  {f.kind === "comment" ? "Comment" : f.kind === "correction" ? "Correction" : f.kind === "note" ? "My note" : "Cue"}
                </button>
              );
            })}
          {layout &&
            (() => {
              const placed = (props.bands ?? [])
                .map((b) => {
                  const pt = layout.point(b.m, b.q, props.edition.measures[b.m].durQ);
                  if (!pt) return null;
                  let sys = layout.systems.find((x) => x.id === pt.system)!;
                  let left = pt.x - 14;
                  // a line that starts on a pickup at the end of a system is shown where it is sung: above the next system
                  const nextBox = layout.measures.get(b.m + 1);
                  if (b.endM > b.m && nextBox && nextBox.system !== pt.system && pt.x > sys.left + (sys.right - sys.left) * 0.62) {
                    sys = layout.systems.find((x) => x.id === nextBox.system)!;
                    left = (nextBox.entries[0]?.x ?? nextBox.x) - 14;
                  }
                  return { b, left, sys };
                })
                .filter((x): x is { b: Band; left: number; sys: (typeof layout.systems)[number] } => !!x);
              // width the band needs on one line (text and IPA), so it rarely has to wrap
              const need = (b: Band) =>
                Math.ceil(Math.max(b.text.length * 8.6, props.bandRows?.ipa ? (b.ipa.length + 2) * 7.6 : 0, props.bandRows?.translation && b.translation ? b.translation.length * 6.9 : 0) + 64);
              return placed.map(({ b, left, sys }, i) => {
                const next = placed.slice(i + 1).find((o) => o.sys.id === sys.id);
                const prev = placed.slice(0, i).reverse().find((o) => o.sys.id === sys.id);
                const want = need(b);
                let x = left;
                // near the end of a system there is no room to the right: slide left into free space
                if (!next && x + want > sys.right + 8) {
                  const floor = prev ? prev.left + Math.min(need(prev.b), sys.right - prev.left) + 8 : sys.left - 30;
                  x = Math.max(floor, sys.right + 8 - want);
                }
                const maxWidth = Math.max(150, (next ? next.left : sys.right + 12) - x - 8);
                return (
                  <div
                    key={b.id}
                    className={`ov-band${b.active ? " active" : ""}`}
                    style={{ left: x, top: Math.min(sys.top - 46, sys.extentTop - 10), maxWidth }}
                    data-testid={`band-${b.id}`}
                  >
                    <button
                      type="button"
                      className={`band-speak${props.speakingId === b.id ? " speaking" : ""}`}
                      aria-label={`Hear “${b.text}” spoken`}
                      onClick={(e) => {
                        e.stopPropagation();
                        props.onSpeak?.(b.id);
                      }}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
                        <path className="wave" d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="band-body"
                      onClick={(e) => {
                        e.stopPropagation();
                        props.onBand?.(b.id);
                      }}
                      title="Go to this phrase"
                    >
                      <span className="band-line" lang="it">
                        {b.words.map((w, k) => (
                          <span key={k} className={k === b.activeWord ? "w now" : "w"}>
                            {w}
                            {k < b.words.length - 1 ? " " : ""}
                          </span>
                        ))}
                      </span>
                      {props.bandRows?.ipa && <span className="band-ipa">[{b.ipa}]</span>}
                      {props.bandRows?.translation && b.translation && <span className="band-tr">{b.translation}</span>}
                    </button>
                  </div>
                );
              });
            })()}
          {layout && hasLyrics && renderSungText(layout)}
          {layout &&
            props.fadedXmlParts?.map((pid) => {
              const i = layout.lanes.findIndex((l) => l.partId === pid);
              if (i < 0) return null;
              const lane = layout.lanes[i];
              const prev = layout.lanes[i - 1];
              const next = layout.lanes[i + 1];
              const top = prev ? (prev.extBottom + lane.extTop) / 2 : 0;
              const bottom = next ? (lane.extBottom + next.extTop) / 2 : layout.height;
              return <div key={pid} className="ov-fade" style={{ left: 0, top, width: "100%", height: bottom - top }} />;
            })}
          <div ref={haloEl} className="ov-halo" style={{ display: "none" }} />
          <div ref={measureEl} className="ov-measure-now" style={{ display: "none" }} />
          <div ref={cursorEl} className="ov-cursor" style={{ display: "none" }}>
            <span className="cursor-label">Playback</span>
          </div>
          <div ref={markerEl} className="ov-marker" style={{ display: "none" }}>
            <span className="marker-label">Rehearsal</span>
          </div>
        </div>
      </div>
      </div>
      </div>
    </div>
  );
}
