/**
 * Entrance cues for a role, computed on the performance timeline (so cuts and repeats are
 * respected): where the role comes in after a rest, and what is heard just before.
 */
import type { Performance, PerfNote } from "./timeline";
import type { CompiledEdition, NoteInfo } from "./types";

export interface Entrance {
  q: number; // perfQ of the entrance
  m: number;
  noteQ: number;
  occ: number;
  restQ: number; // length of the preceding rest in quarters (Infinity at the start)
  firstWord: string | null;
  cue: string; // what to listen for
  cueFromQ: number; // a sensible place to start playback to hear the cue
}

const MIN_REST_Q = 1.5;

export function entrances(perf: Performance, partKey: string): Entrance[] {
  const ed = perf.edition;
  const byId = new Map(ed.notes.map((n) => [n.id, n]));
  const mine = perf.notes.filter((n) => n.part === partKey).sort((a, b) => a.onQ - b.onQ);
  const out: Entrance[] = [];
  let prevOff = -Infinity;
  for (const n of mine) {
    const rest = n.onQ - prevOff;
    if (rest >= MIN_REST_Q - 1e-6) {
      const loc = perf.locate(n.onQ);
      const pm = perf.measures[loc.p];
      const verse = pm.pass;
      const note = byId.get(n.ids[0]);
      const firstWord = note ? wordStartingAt(ed, note, verse) : null;
      const cueFromIdx = Math.max(0, loc.p - 2);
      out.push({
        q: n.onQ,
        m: loc.m,
        noteQ: loc.q,
        occ: loc.occ,
        restQ: rest,
        firstWord,
        cue: describeCue(perf, n, partKey, byId),
        cueFromQ: perf.measures[cueFromIdx].startQ,
      });
    }
    prevOff = Math.max(prevOff, n.offQ);
  }
  return out;
}

function lyricText(note: NoteInfo, verse: number) {
  const l = note.lyrics?.find((x) => x.verse === verse) ?? note.lyrics?.find((x) => x.verse === 1);
  return l?.syllables ?? [];
}

function wordStartingAt(ed: CompiledEdition, note: NoteInfo, verse: number): string | null {
  const syl = lyricText(note, verse);
  if (!syl.length) return null;
  // collect syllables forward until the word ends
  const line = ed.notes.filter((n) => n.part === note.part && n.lyrics).sort((a, b) => a.m - b.m || a.q - b.q);
  let i = line.findIndex((n) => n.id === note.id);
  let text = "";
  for (; i >= 0 && i < line.length; i++) {
    const s = lyricText(line[i], verse)[0];
    if (!s) break;
    text += s.text;
    if (s.syllabic === "end" || s.syllabic === "single") break;
    if (i > 0 && text.length > 30) break;
  }
  return text || null;
}

function describeCue(perf: Performance, entry: PerfNote, partKey: string, byId: Map<string, NoteInfo>): string {
  const ed = perf.edition;
  const windowStart = entry.onQ - 8; // up to two 4/4 bars back
  const others = perf.notes.filter((n) => n.part !== partKey && n.onQ < entry.onQ - 1e-6 && n.onQ >= windowStart);
  const voices = others.filter((n) => ed.parts.find((p) => p.key === n.part)?.kind === "voice");
  if (voices.length) {
    const last = voices.reduce((a, b) => (b.onQ >= a.onQ ? b : a));
    const who = ed.parts.find((p) => p.key === last.part)!.shortLabel;
    // find the last sung syllable chain before the entrance
    const pm = perf.measures[perf.locate(last.onQ).p];
    const lyricNotes = voices
      .filter((n) => n.part === last.part)
      .sort((a, b) => a.onQ - b.onQ)
      .map((n) => byId.get(n.ids[0])!)
      .filter((n) => lyricText(n, pm.pass).length);
    const tail = lyricNotes.slice(-4);
    let words = "";
    for (const n of tail) for (const s of lyricText(n, pm.pass)) words += s.syllabic === "begin" || s.syllabic === "single" ? ` ${s.text}` : s.text;
    words = words.trim().split(" ").slice(-3).join(" ");
    const where = perf.describe(last.onQ).replace(/, beat [\d.]+/, "");
    return words ? `${who} sings “…${words}” (${where})` : `${who} sings just before you (${where})`;
  }
  const piano = others.filter((n) => n.part !== partKey);
  if (piano.length) {
    const first = piano.reduce((a, b) => (b.onQ < a.onQ ? b : a));
    const bars = Math.max(1, Math.round((entry.onQ - first.onQ) / 4));
    return `Piano leads in (${bars === 1 ? "about a bar" : `about ${bars} bars`} from ${perf.describe(first.onQ).replace(/, beat [\d.]+/, "")})`;
  }
  return "You begin";
}
