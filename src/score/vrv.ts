/**
 * Verovio: engraves the score as a printed edition does (spacing, lyrics, beams and stems after the engraver's
 * rules). Loaded on demand (its WebAssembly is large), drawn as SVG into the score host, and read back into the
 * same ScoreLayout the rest of the score view works with: where every bar and every onset landed on screen.
 */
import { ScoreLayout, type Lane, type MeasureBox, type SystemBox } from "./layout";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Toolkit = any;
let toolkit: Promise<Toolkit> | null = null;
let vrvModule: Promise<{ mod: any; esm: any }> | null = null;

function loadModule() {
  if (!vrvModule)
    vrvModule = (async () => {
      const [wasm, esm] = await Promise.all([import("verovio/wasm"), import("verovio/esm")]);
      return { mod: await (wasm as any).default(), esm };
    })();
  return vrvModule;
}

export function loadVerovio(): Promise<Toolkit> {
  if (!toolkit) toolkit = loadModule().then(({ mod, esm }) => new esm.VerovioToolkit(mod));
  return toolkit;
}

/** a toolkit of its own (e.g. for printing), so the score on screen keeps what it has loaded */
export async function newVerovioToolkit(): Promise<Toolkit> {
  const { mod, esm } = await loadModule();
  return new esm.VerovioToolkit(mod);
}

/** Verovio draws a staff space of 18 px at scale 100; the app's zoom 1 is 10 px, as with the old engine. */
const PX_PER_SPACE_AT_100 = 18;
/** width (px) of the names' column at the left of the single line */
export const LANE_GUTTER_PX = 104;

interface TimeEntry {
  qstamp: number;
  measureOn?: string;
  on?: string[];
  restsOn?: string[];
}

/** The xml with only the parts shown; in the single line the part names are left out (names are drawn beside it). */
export function filterXml(xml: string, visible: string[] | null, hideNames: boolean): { xml: string; parts: { id: string; staves: number }[] } {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const root = doc.documentElement;
  const parts: { id: string; staves: number }[] = [];
  for (const sp of [...root.querySelectorAll("part-list > score-part")]) {
    const id = sp.getAttribute("id")!;
    if (visible && !visible.includes(id)) {
      sp.remove();
      continue;
    }
    if (hideNames) for (const n of sp.querySelectorAll("part-name, part-abbreviation")) n.textContent = "";
  }
  for (const p of [...root.querySelectorAll(":scope > part")]) {
    const id = p.getAttribute("id")!;
    if (visible && !visible.includes(id)) {
      p.remove();
      continue;
    }
    const st = p.querySelector("measure attributes staves");
    parts.push({ id, staves: st ? Number(st.textContent) || 1 : 1 });
  }
  bracketSingers(doc, parts);
  return { xml: new XMLSerializer().serializeToString(doc), parts };
}

/** Singers next to each other in the score are joined by a bracket, as in a printed vocal score; the piano (two
 *  staves) keeps its brace. Works on whatever parts are shown, in the order they are shown. */
function bracketSingers(doc: Document, parts: { id: string; staves: number }[]) {
  const list = doc.querySelector("part-list");
  if (!list) return;
  const staves = new Map(parts.map((p) => [p.id, p.staves]));
  const runs: Element[][] = [];
  let run: Element[] = [];
  for (const sp of [...list.querySelectorAll(":scope > score-part")]) {
    if ((staves.get(sp.getAttribute("id") ?? "") ?? 1) === 1) run.push(sp);
    else if (run.length) (runs.push(run), (run = []));
  }
  if (run.length) runs.push(run);
  runs
    .filter((r) => r.length > 1)
    .forEach((r, i) => {
      const n = String(90 + i);
      const start = doc.createElement("part-group");
      start.setAttribute("type", "start");
      start.setAttribute("number", n);
      const sym = doc.createElement("group-symbol");
      sym.textContent = "bracket";
      start.appendChild(sym);
      const stop = doc.createElement("part-group");
      stop.setAttribute("type", "stop");
      stop.setAttribute("number", n);
      r[0].before(start);
      r[r.length - 1].after(stop);
    });
}

export interface VrvRenderOptions {
  visibleParts: string[] | null;
  zoom: number;
  width: number;
  strip: boolean;
  /** room above the first system (px), e.g. for the sung text drawn above the music */
  topPx: number;
  /** least room between systems (px) */
  systemGapPx: number;
}

export class VrvScore {
  private loadedKey = "";
  private parts: { id: string; staves: number }[] = [];
  private times: TimeEntry[] = [];
  /** per bar (index), per part: onsets with the notes that start there (empty = a rest) */
  private onsets = new Map<number, Map<string, { q: number; ids: string[] }[]>>();
  constructor(
    private tk: Toolkit,
    private host: HTMLElement,
    private xml: string,
  ) {}

  render(o: VrvRenderOptions): SVGSVGElement | null {
    const scale = Math.max(10, Math.round((1000 * o.zoom) / PX_PER_SPACE_AT_100));
    const unitsPerPx = 100 / scale;
    const key = `${o.visibleParts?.join(",") ?? "all"}|${o.strip}`;
    const options = {
      scale,
      breaks: o.strip ? "none" : "auto",
      pageWidth: o.strip ? 100000 : Math.max(800, Math.round(o.width * unitsPerPx)),
      pageHeight: 60000,
      adjustPageHeight: true,
      adjustPageWidth: o.strip,
      pageMarginTop: Math.round(o.topPx * unitsPerPx),
      pageMarginBottom: 40,
      // the single line keeps a gutter at its left for the parts' names, beside their staves
      pageMarginLeft: o.strip ? Math.round(LANE_GUTTER_PX * unitsPerPx) : 30,
      pageMarginRight: 30,
      spacingSystem: Math.max(6, Math.round(o.systemGapPx / (o.zoom * 10))),
      header: "none",
      footer: "none",
      mnumInterval: 1,
      lyricSize: 4.2,
      lyricTopMinMargin: 3,
      lyricWordSpace: 2.4,
      lyricHyphenLength: 0.9,
      font: "Leipzig",
      svgCss: "g.verse text{font-family:'Charis SIL',Charter,Georgia,serif} g.dir text,g.tempo text,g.dynam text,g.mNum text{font-family:'Charis SIL',Charter,Georgia,serif}",
    };
    this.tk.setOptions(options);
    if (key !== this.loadedKey) {
      const f = filterXml(this.xml, o.visibleParts, o.strip);
      this.parts = f.parts;
      this.tk.loadData(f.xml);
      this.loadedKey = key;
      this.times = this.tk.renderToTimemap({ includeMeasures: true, includeRests: true }) as TimeEntry[];
    } else this.tk.redoLayout();
    this.host.innerHTML = this.tk.renderToSVG(1);
    // a page line holds at least three bars (fewer reads as rushing): while a line other than the last holds fewer,
    // the music is engraved a step smaller, down to under half its size
    if (!o.strip) {
      let s = scale;
      const floor = Math.round(scale * 0.45);
      for (let k = 0; k < 9; k++) {
        const sys = [...this.host.querySelectorAll("g.system")];
        const thin = sys.slice(0, -1).some((g) => g.querySelectorAll("g.measure").length < 3);
        if (!thin || s <= floor) break;
        s = Math.max(floor, Math.round(s * 0.9));
        const upp = 100 / s;
        this.tk.setOptions({
          ...options,
          scale: s,
          pageWidth: Math.max(800, Math.round(o.width * upp)),
          pageMarginTop: Math.round(o.topPx * upp),
          spacingSystem: Math.max(6, Math.round(o.systemGapPx / ((o.zoom * s) / scale) / 10)),
        });
        this.tk.redoLayout();
        this.host.innerHTML = this.tk.renderToSVG(1);
      }
    }
    const svg = this.host.querySelector("svg");
    if (svg) svg.classList.add("vrv-score");
    this.indexOnsets();
    return svg;
  }

  /** the part a staff element belongs to: its position among the staves of its bar */
  private partOfStaff(staff: Element): string | null {
    const m = staff.closest("g.measure");
    if (!m) return null;
    const staves = [...m.querySelectorAll(":scope > g.staff")];
    let k = staves.indexOf(staff);
    for (const p of this.parts) {
      if (k < p.staves) return p.id;
      k -= p.staves;
    }
    return null;
  }

  private measureIndex(): Map<string, number> {
    const idx = new Map<string, number>();
    [...this.host.querySelectorAll("g.measure")].forEach((m, i) => idx.set(m.id, i));
    return idx;
  }

  private indexOnsets() {
    this.onsets.clear();
    const mIdx = this.measureIndex();
    let mi = 0;
    let mStart = 0;
    for (const e of this.times) {
      if (e.measureOn && mIdx.has(e.measureOn)) {
        mi = mIdx.get(e.measureOn)!;
        mStart = e.qstamp;
      }
      const q = e.qstamp - mStart;
      const add = (id: string, rest: boolean) => {
        const el = this.host.querySelector(`[id="${id}"]`);
        const staff = el?.closest("g.staff");
        const pid = staff ? this.partOfStaff(staff) : null;
        if (!pid) return;
        const per = this.onsets.get(mi) ?? new Map();
        this.onsets.set(mi, per);
        const list: { q: number; ids: string[] }[] = per.get(pid) ?? [];
        per.set(pid, list);
        let at = list.find((x) => Math.abs(x.q - q) < 1e-6);
        if (!at) {
          at = { q, ids: [] };
          list.push(at);
        }
        if (!rest) at.ids.push(id);
      };
      for (const id of e.on ?? []) add(id, false);
      for (const id of e.restsOn ?? []) add(id, true);
    }
    for (const per of this.onsets.values()) for (const list of per.values()) list.sort((a, b) => a.q - b.q);
  }

  /** where everything landed, in px from the top left of the host */
  layout(): ScoreLayout {
    const host = this.host;
    const hb = host.getBoundingClientRect();
    const rel = (r: DOMRect) => ({ x: r.left - hb.left, y: r.top - hb.top, w: r.width, h: r.height });
    const staffLines = (st: Element) => {
      const ys: number[] = [];
      let x0 = Infinity;
      let x1 = -Infinity;
      for (const p of st.querySelectorAll(":scope > path")) {
        const r = rel(p.getBoundingClientRect());
        ys.push(r.y + r.h / 2);
        x0 = Math.min(x0, r.x);
        x1 = Math.max(x1, r.x + r.w);
      }
      return ys.length ? { top: Math.min(...ys), bottom: Math.max(...ys), x0, x1 } : null;
    };
    const measures = new Map<number, MeasureBox>();
    const systems: SystemBox[] = [];
    const lanes0 = new Map<string, Lane>();
    const allLanes = new Map<number, Map<string, Lane>>();
    const sysEls = [...host.querySelectorAll("g.system")];
    let mi = 0;
    sysEls.forEach((sysEl, sid) => {
      const per = new Map<string, Lane>();
      allLanes.set(sid, per);
      const sb = rel(sysEl.getBoundingClientRect());
      let sys: SystemBox | null = null;
      for (const mEl of sysEl.querySelectorAll("g.measure")) {
        const mb = rel(mEl.getBoundingClientRect());
        let top = Infinity;
        let bottom = -Infinity;
        let x0 = Infinity;
        let x1 = -Infinity;
        for (const st of mEl.querySelectorAll(":scope > g.staff")) {
          const l = staffLines(st);
          if (!l) continue;
          top = Math.min(top, l.top);
          bottom = Math.max(bottom, l.bottom);
          x0 = Math.min(x0, l.x0);
          x1 = Math.max(x1, l.x1);
          const pid = this.partOfStaff(st);
          if (pid) {
            const ext = rel(st.getBoundingClientRect());
            const lane = per.get(pid);
            if (!lane) per.set(pid, { partId: pid, top: l.top, bottom: l.bottom, extTop: Math.min(ext.y, l.top), extBottom: Math.max(ext.y + ext.h, l.bottom) });
            else {
              lane.top = Math.min(lane.top, l.top);
              lane.bottom = Math.max(lane.bottom, l.bottom);
              lane.extTop = Math.min(lane.extTop, ext.y);
              lane.extBottom = Math.max(lane.extBottom, ext.y + ext.h);
            }
          }
        }
        if (!Number.isFinite(top)) continue;
        const box: MeasureBox = { m: mi, system: sid, x: x0, w: x1 - x0, top, bottom, extentTop: Math.min(mb.y, top), extentBottom: Math.max(mb.y + mb.h, bottom), entries: [] };
        // onsets: the leftmost notehead (or rest) starting at each time
        const xs = new Map<number, number>();
        for (const list of this.onsets.get(mi)?.values() ?? [])
          for (const o of list) {
            for (const id of o.ids) {
              const el = host.querySelector(`[id="${id}"]`);
              const head = el?.querySelector(".notehead") ?? el;
              if (!head) continue;
              const r = rel(head.getBoundingClientRect());
              const x = r.x + r.w / 2;
              xs.set(o.q, Math.min(xs.get(o.q) ?? Infinity, x));
            }
          }
        box.entries = [...xs.entries()].map(([q, x]) => ({ q, x })).sort((a, b) => a.q - b.q);
        measures.set(mi, box);
        if (!sys) sys = { id: sid, top, bottom, extentTop: box.extentTop, extentBottom: box.extentBottom, left: box.x, right: box.x + box.w };
        else {
          sys.top = Math.min(sys.top, top);
          sys.bottom = Math.max(sys.bottom, bottom);
          sys.extentTop = Math.min(sys.extentTop, box.extentTop);
          sys.extentBottom = Math.max(sys.extentBottom, box.extentBottom);
          sys.left = Math.min(sys.left, box.x);
          sys.right = Math.max(sys.right, box.x + box.w);
        }
        mi++;
      }
      if (sys) {
        sys.extentTop = Math.min(sys.extentTop, sb.y);
        systems.push(sys);
      }
      if (sid === 0) for (const [k, v] of per) lanes0.set(k, { ...v });
    });
    const svg = host.querySelector("svg");
    const r = svg?.getBoundingClientRect();
    return new ScoreLayout(
      measures,
      systems,
      r?.width ?? 0,
      r?.height ?? 0,
      new Map(),
      [...lanes0.values()].sort((a, b) => a.top - b.top),
      new Map([...allLanes].map(([sid, m]) => [sid, [...m.values()].sort((a, b) => a.top - b.top)])),
    );
  }

  /** the note(s) sounding at (bar, quarter) in the first of these parts that has one (a held note keeps it) */
  soundingNote(m: number, q: number, parts: string[]): { key: string; els: Element[] } | null {
    for (const pid of parts) {
      for (let mi = m; mi >= Math.max(0, m - 1); mi--) {
        const list = this.onsets.get(mi)?.get(pid);
        if (!list?.length) continue;
        let best: { q: number; ids: string[] } | null = null;
        for (const o of list) if (!(mi === m && o.q > q + 1e-6)) best = o;
        if (!best) continue;
        if (!best.ids.length) break; // a rest
        const els = best.ids.map((id) => this.host.querySelector(`[id="${id}"]`)).filter((e): e is Element => !!e);
        if (els.length) return { key: `${pid}:${mi}:${best.q}`, els };
        break;
      }
    }
    return null;
  }
}

/**
 * The single line scrolls its clef and key signature away; as a printed system repeats them, they stay pinned at the
 * left edge. One panel per clef/key setting: the panel shown is the last whose place has scrolled past the edge.
 * Same shape as the OSMD panels (positions in drawing units; scale = px per unit).
 */
export function buildPinnedVrv(svg: SVGSVGElement, ink: string | undefined): { panels: { fromX: number; html: string }[]; width: number; vbH: number; scale: number } | null {
  const inner = svg.querySelector<SVGSVGElement>("svg.definition-scale");
  const margin = inner?.querySelector<SVGGElement>("g.page-margin");
  const vb = inner?.viewBox.baseVal;
  if (!inner || !margin || !vb || !vb.width) return null;
  const scale = inner.getBoundingClientRect().width / vb.width;
  const t = /translate\(\s*([-\d.]+)[ ,]+([-\d.]+)/.exec(margin.getAttribute("transform") ?? "");
  const ox = t ? Number(t[1]) : 0;
  const oy = t ? Number(t[2]) : 0;
  const m0 = margin.querySelector<SVGGElement>("g.measure");
  if (!m0) return null;
  const staves0 = [...m0.querySelectorAll<SVGGElement>(":scope > g.staff")];
  // the panel ends after the widest opening clef + key signature
  let end = 0;
  for (const st of staves0)
    for (const el of st.querySelectorAll<SVGGraphicsElement>(":scope > g.clef, :scope > g.keySig")) {
      const b = el.getBBox();
      end = Math.max(end, b.x + b.width);
    }
  if (!end) return null;
  end += 120;
  const lines = staves0.map((st) => [...st.querySelectorAll(":scope > path")].map((p) => p.outerHTML).join("")).join("");
  const system = m0.closest("g.system");
  const connectors = system
    ? [...system.querySelectorAll<SVGGraphicsElement>(":scope > g.grpSym, :scope > path, :scope > g.barLine")]
        .filter((c) => c.getBBox().x < end)
        .map((c) => c.outerHTML)
        .join("")
    : "";
  // every clef and key signature in the piece, per staff (by its place among the staves of its bar)
  const marks: { x: number; staff: number; kind: "clef" | "key"; el: SVGGraphicsElement }[] = [];
  for (const m of margin.querySelectorAll<SVGGElement>("g.measure"))
    [...m.querySelectorAll<SVGGElement>(":scope > g.staff")].forEach((st, k) => {
      for (const el of st.querySelectorAll<SVGGraphicsElement>("g.clef, g.keySig"))
        marks.push({ x: el.getBBox().x, staff: k, kind: el.classList.contains("clef") ? "clef" : "key", el });
    });
  const home = (k: number, kind: "clef" | "key") => marks.find((m) => m.staff === k && m.kind === kind && m.x < end)?.el.getBBox().x;
  const starts = [...new Set(marks.map((m) => Math.round(m.x)))].sort((a, b) => a - b);
  const defs = svg.querySelector("defs")?.outerHTML ?? "";
  const w = (end + ox) * scale;
  const h = (vb.height + 0) * scale;
  const panels: { fromX: number; html: string }[] = [];
  for (const sx of starts) {
    const parts = staves0.map((_, k) => {
      const upto = marks.filter((m) => m.staff === k && Math.round(m.x) <= sx);
      const pick = (kind: "clef" | "key") => [...upto].reverse().find((m) => m.kind === kind);
      const place = (kind: "clef" | "key") => {
        const mk = pick(kind);
        const hx = home(k, kind);
        if (!mk || hx === undefined) return "";
        return `<g transform="translate(${(hx - mk.x).toFixed(1)},0)">${mk.el.outerHTML}</g>`;
      };
      return place("clef") + place("key");
    });
    const html = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w.toFixed(1)}" height="${h.toFixed(1)}" viewBox="0 0 ${(end + ox).toFixed(0)} ${vb.height}" style="color:${ink ?? "currentColor"}">${defs}<g transform="translate(${ox},${oy})">${lines}${connectors}${parts.join("")}</g></svg>`;
    if (!panels.length || panels[panels.length - 1].html !== html) panels.push({ fromX: sx + ox, html });
  }
  return { panels, width: (end + ox) * scale, vbH: vb.height, scale };
}
