/**
 * Validation of production cuts. Only full-measure cuts are supported. Boundaries the playback
 * engine cannot honour faithfully (ties or words crossing the cut, partial repeat structures) are
 * flagged for editorial correction instead of being silently "fixed".
 */
import type { CompiledEdition, CutIssue, Phrase } from "./types";
import { Performance } from "./timeline";

export interface CutCandidate {
  startM: number;
  endM: number;
}

export function validateCut(
  edition: CompiledEdition,
  existing: (CutCandidate & { id?: string })[],
  cut: CutCandidate,
  phrases: Phrase[] = [],
): { status: "ok" | "flagged"; issues: CutIssue[] } {
  const issues: CutIssue[] = [];
  const M = edition.measures;
  const num = (m: number) => M[m]?.number ?? String(m + 1);
  const err = (code: string, message: string, m?: number) => issues.push({ severity: "error", code, message, m });
  const warn = (code: string, message: string, m?: number) => issues.push({ severity: "warning", code, message, m });

  if (!Number.isInteger(cut.startM) || !Number.isInteger(cut.endM) || cut.startM < 0 || cut.endM >= M.length || cut.startM > cut.endM) {
    err("range", "The cut must cover whole measures that exist in this edition.");
    return { status: "flagged", issues };
  }
  for (const c of existing) {
    if (cut.startM <= c.endM && cut.endM >= c.startM) err("overlap", `Overlaps the existing cut m. ${num(c.startM)}–${num(c.endM)}.`);
  }
  const allCut = new Set<number>();
  for (const c of [...existing, cut]) for (let m = c.startM; m <= c.endM; m++) allCut.add(m);
  if (allCut.size >= M.length) err("everything", "A cut cannot remove the whole piece.");

  const inCut = (m: number) => m >= cut.startM && m <= cut.endM;

  // Ties crossing either boundary
  for (const n of edition.notes) {
    if (!n.tieStart) continue;
    const endsOnBarline = Math.abs(n.q + n.dur - M[n.m].durQ) < 1e-6;
    if (!endsOnBarline) continue;
    const next = n.m + 1;
    if (next >= M.length) continue;
    if (!inCut(n.m) && inCut(next))
      err("tie-in", `A tied note in ${partLabel(edition, n.part)} (m. ${num(n.m)}) continues into the cut. Re-notate the tie before cutting here.`, n.m);
    if (inCut(n.m) && !inCut(next))
      err("tie-out", `A note in ${partLabel(edition, n.part)} is tied from inside the cut into m. ${num(next)}. Re-notate the tie before cutting here.`, next);
  }

  // Words split by the cut (a syllable chain that starts outside and continues inside, or vice versa)
  const byPartVerse = new Map<string, { m: number; syl: string; text: string }[]>();
  for (const n of [...edition.notes].sort((a, b) => a.m - b.m || a.q - b.q)) {
    for (const l of n.lyrics ?? []) {
      const key = `${n.part}|${l.verse}`;
      const arr = byPartVerse.get(key) ?? [];
      for (const s of l.syllables) arr.push({ m: n.m, syl: s.syllabic, text: s.text });
      byPartVerse.set(key, arr);
    }
  }
  for (const [key, syls] of byPartVerse) {
    for (let i = 0; i + 1 < syls.length; i++) {
      const a = syls[i];
      const b = syls[i + 1];
      const continues = a.syl === "begin" || a.syl === "middle";
      if (continues && inCut(a.m) !== inCut(b.m)) {
        err("word-split", `The word beginning “${a.text}” (${partLabel(edition, key.split("|")[0])}) is split by the cut boundary.`, b.m);
      }
    }
  }

  // Repeat structures cut partially
  const starts: number[] = [];
  M.forEach((mi, i) => {
    if (mi.repeatStart) starts.push(i);
    if (mi.repeatEnd) {
      const s = starts.pop() ?? 0;
      const a = inCut(s);
      const b = inCut(i);
      if (a !== b)
        err("repeat", `The cut crosses the repeat m. ${num(s)}–${num(i)}. Cut the whole repeated passage or ask for an editorial correction.`, a ? i : s);
      else if (!a && cut.startM > s && cut.endM < i)
        warn("repeat-both", `This cut applies to every pass through the repeat m. ${num(s)}–${num(i)}.`);
    }
    if (mi.endings?.length && inCut(i)) {
      const anyOutside = M.some((mj, j) => mj.endings?.length && !inCut(j));
      if (anyOutside) err("ending", `The cut includes part of a first/second ending (m. ${num(i)}).`, i);
    }
  });

  // Tempo / metre changes inside the cut
  for (let m = cut.startM; m <= cut.endM; m++) {
    for (const t of M[m].tempos) {
      const after = Math.min(cut.endM + 1, M.length - 1);
      const perf = new Performance(edition, [...existing, cut]);
      const occ = perf.occurrences(after)[0];
      const bpm = occ ? Math.round(perf.bpmAt(occ.startQ)) : t.bpm;
      warn("tempo", `Tempo change in m. ${num(m)}${t.text ? ` (${t.text})` : ""} is inside the cut; playback after the cut continues at ♩ = ${bpm}.`, m);
      break;
    }
    if (m > 0 && M[m].time.join("/") !== M[m - 1].time.join("/"))
      warn("metre", `Time signature change in m. ${num(m)} is inside the cut.`, m);
  }
  if (cut.endM + 1 < M.length && cut.startM > 0) {
    const before = M[cut.startM - 1].time.join("/");
    const after = M[cut.endM + 1].time.join("/");
    if (before !== after) warn("metre-join", `The music either side of the cut is in different metres (${before} → ${after}).`);
  }

  // Language phrases partly removed
  for (const ph of phrases) {
    const touches = ph.startM <= cut.endM && ph.endM >= cut.startM;
    const fully = ph.startM >= cut.startM && ph.endM <= cut.endM;
    if (touches && !fully) warn("phrase", `The phrase “${ph.original}” is only partly cut.`, ph.startM);
  }

  return { status: issues.some((i) => i.severity === "error") ? "flagged" : "ok", issues };
}

function partLabel(edition: CompiledEdition, key: string): string {
  return edition.parts.find((p) => p.key === key)?.shortLabel ?? key;
}
