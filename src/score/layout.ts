/**
 * Layout index: where each notated measure and each onset landed on THIS client's screen.
 *
 * Built from OSMD's graphical model after every render. Different clients (full score vs. one
 * role's line, different widths and zoom) get different indexes; shared positions are exchanged
 * as musical identifiers and resolved locally through this index.
 */
import type { OpenSheetMusicDisplay } from "opensheetmusicdisplay";

export interface MeasureBox {
  m: number;
  system: number;
  x: number;
  w: number;
  top: number; // top staff line of the highest visible staff
  bottom: number; // bottom staff line of the lowest visible staff
  extentBottom: number; // lowest drawn element of the system (lyrics, dynamics)
  extentTop: number; // highest drawn element of the system (tempo marks, rehearsal letters, dynamics above)
  entries: { q: number; x: number }[];
}

export interface SystemBox {
  id: number;
  top: number;
  bottom: number;
  extentBottom: number;
  extentTop: number;
  left: number;
  right: number;
}

/** Skyline of the top visible staff of a system: everything drawn above it, sampled along x. */
export interface SystemSky {
  x0: number; // px of sample 0
  step: number; // px between samples
  y: number[]; // px, top of what is drawn at each sample
}

/** Vertical extent of one part on the first system (the single line in strip mode). */
export interface Lane {
  partId: string;
  top: number; // top staff line
  bottom: number; // bottom staff line
  extTop: number; // highest drawn element of the part (slurs, dynamics above)
  extBottom: number; // lowest drawn element of the part (syllables, pedal marks)
}

export class ScoreLayout {
  constructor(
    readonly measures: Map<number, MeasureBox>,
    readonly systems: SystemBox[],
    readonly width: number,
    readonly height: number,
    readonly skies: Map<number, SystemSky> = new Map(),
    readonly lanes: Lane[] = [],
  ) {}

  /** Highest drawn point above the top staff of a system between x0 and x1 (px). */
  skyTop(system: number, x0: number, x1: number): number | null {
    const sky = this.skies.get(system);
    if (!sky || !sky.y.length) return null;
    const a = Math.max(0, Math.floor((x0 - sky.x0) / sky.step));
    const b = Math.min(sky.y.length - 1, Math.ceil((x1 - sky.x0) / sky.step));
    let min = Infinity;
    for (let i = a; i <= b; i++) if (sky.y[i] < min) min = sky.y[i];
    return Number.isFinite(min) ? min : null;
  }

  /** Screen point for a musical position (measure idx, quarters into the measure). */
  point(m: number, q: number, durQ: number): { x: number; top: number; bottom: number; system: number } | null {
    const b = this.measures.get(m);
    if (!b) return null;
    const e = b.entries;
    let x: number;
    if (!e.length) x = b.x + (b.w * q) / durQ;
    else if (q <= e[0].q) x = e[0].x;
    else {
      let i = 0;
      while (i + 1 < e.length && e[i + 1].q <= q) i++;
      const a = e[i];
      const nb = e[i + 1] ?? { q: durQ, x: b.x + b.w - 6 };
      const span = nb.q - a.q;
      x = span > 0 ? a.x + ((q - a.q) / span) * (nb.x - a.x) : a.x;
    }
    return { x, top: b.top, bottom: b.bottom, system: b.system };
  }

  /** Musical position under a screen point, snapped to the nearest onset. */
  hit(x: number, y: number): { m: number; q: number } | null {
    let best: MeasureBox | null = null;
    for (const b of this.measures.values()) {
      if (x < b.x || x > b.x + b.w) continue;
      if (y < b.top - 60 || y > b.bottom + 70) continue;
      best = b;
      break;
    }
    if (!best) return null;
    let q = 0;
    let d = Infinity;
    for (const e of best.entries) {
      const dd = Math.abs(e.x - x);
      if (dd < d) {
        d = dd;
        q = e.q;
      }
    }
    return { m: best.m, q };
  }

  systemOf(m: number): SystemBox | undefined {
    const b = this.measures.get(m);
    return b ? this.systems.find((s) => s.id === b.system) : undefined;
  }
}

interface GLike {
  PositionAndShape: { AbsolutePosition: { x: number; y: number }; Size: { width: number; height: number }; BorderMarginBottom?: number; BorderBottom?: number };
}

export function buildLayout(osmd: OpenSheetMusicDisplay): ScoreLayout {
  const unit = 10 * osmd.Zoom;
  const sampling = (osmd.EngravingRules as unknown as { SamplingUnit?: number }).SamplingUnit ?? 3;
  const topStaff = new Map<number, { y: number; line: unknown }>();
  const lanes = new Map<string, Lane>();
  const measures = new Map<number, MeasureBox>();
  const systemIds = new Map<unknown, number>();
  const list = osmd.GraphicSheet?.MeasureList ?? [];
  list.forEach((row, mi) => {
    let box: MeasureBox | null = null;
    const qx = new Map<number, number[]>();
    for (const gm of row ?? []) {
      if (!gm) continue;
      const staff = gm.ParentStaff;
      if (staff && staff.ParentInstrument && !staff.ParentInstrument.Visible) continue;
      const ps = (gm as unknown as GLike).PositionAndShape;
      const sys = gm.ParentMusicSystem;
      if (!ps || !sys) continue;
      if (!systemIds.has(sys)) systemIds.set(sys, systemIds.size);
      const x = ps.AbsolutePosition.x * unit;
      const w = ps.Size.width * unit;
      const top = ps.AbsolutePosition.y * unit;
      const bottom = top + 4 * unit;
      const sid = systemIds.get(sys)!;
      const known = topStaff.get(sid);
      if (gm.ParentStaffLine && (!known || top < known.y)) topStaff.set(sid, { y: top, line: gm.ParentStaffLine });
      const partId = staff?.ParentInstrument?.IdString;
      const sl = (gm.ParentStaffLine as unknown as GLike | undefined)?.PositionAndShape;
      const ext = sl ? (sl.AbsolutePosition.y + (sl.BorderMarginBottom ?? sl.BorderBottom ?? 4)) * unit : bottom;
      // the staff line's skyline holds everything OSMD drew above the staff (in units, negative = above)
      const sky = (gm.ParentStaffLine as unknown as { SkyLine?: number[] } | undefined)?.SkyLine;
      let skyMin = 0;
      if (sky) for (const v of sky) if (Number.isFinite(v) && v < skyMin) skyMin = v;
      const extTop = sl ? Math.min(top, (sl.AbsolutePosition.y + skyMin) * unit) : top;
      if (partId && sid === 0) {
        const lane = lanes.get(partId);
        if (!lane) lanes.set(partId, { partId, top, bottom, extTop, extBottom: Math.max(ext, bottom) });
        else {
          lane.top = Math.min(lane.top, top);
          lane.bottom = Math.max(lane.bottom, bottom);
          lane.extTop = Math.min(lane.extTop, extTop);
          lane.extBottom = Math.max(lane.extBottom, ext);
        }
      }
      if (!box) box = { m: mi, system: systemIds.get(sys)!, x, w, top, bottom, extentBottom: Math.max(ext, bottom), extentTop: extTop, entries: [] };
      else {
        box.top = Math.min(box.top, top);
        box.bottom = Math.max(box.bottom, bottom);
        box.extentBottom = Math.max(box.extentBottom, ext);
        box.extentTop = Math.min(box.extentTop, extTop);
      }
      for (const gse of gm.staffEntries ?? []) {
        const q = gse.relInMeasureTimestamp.RealValue * 4;
        const ex = (gse as unknown as GLike).PositionAndShape.AbsolutePosition.x * unit;
        const arr = qx.get(q) ?? [];
        arr.push(ex);
        qx.set(q, arr);
      }
    }
    if (box) {
      box.entries = [...qx.entries()].map(([q, xs]) => ({ q, x: Math.min(...xs) + 0.55 * unit })).sort((a, b) => a.q - b.q);
      measures.set(mi, box);
    }
  });
  const systems: SystemBox[] = [];
  for (const b of measures.values()) {
    const s = systems.find((x) => x.id === b.system);
    if (!s) systems.push({ id: b.system, top: b.top, bottom: b.bottom, extentBottom: b.extentBottom, extentTop: b.extentTop, left: b.x, right: b.x + b.w });
    else {
      s.top = Math.min(s.top, b.top);
      s.extentTop = Math.min(s.extentTop, b.extentTop);
      s.bottom = Math.max(s.bottom, b.bottom);
      s.extentBottom = Math.max(s.extentBottom, b.extentBottom);
      s.left = Math.min(s.left, b.x);
      s.right = Math.max(s.right, b.x + b.w);
    }
  }
  systems.sort((a, b) => a.top - b.top);
  const skies = new Map<number, SystemSky>();
  for (const [sid, t] of topStaff) {
    const line = t.line as { SkyLine?: number[]; PositionAndShape: { AbsolutePosition: { x: number; y: number } } };
    if (!line.SkyLine?.length) continue;
    const ox = line.PositionAndShape.AbsolutePosition.x;
    const oy = line.PositionAndShape.AbsolutePosition.y;
    skies.set(sid, { x0: ox * unit, step: unit / sampling, y: line.SkyLine.map((v) => (oy + Math.min(0, v)) * unit) });
  }
  const svg = (osmd as unknown as { container: HTMLElement }).container?.querySelector("svg");
  return new ScoreLayout(measures, systems, svg?.clientWidth ?? 0, svg?.clientHeight ?? 0, skies, [...lanes.values()].sort((a, b) => a.top - b.top));
}
