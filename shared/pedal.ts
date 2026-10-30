/**
 * Sustain pedal for the piano parts, the way an accompanist pedals this kind of writing.
 *
 * A pedal only ever *lengthens* notes after their keys are released (sound, not notation: the score
 * and the highlighting keep the written lengths). The rules, in order:
 *
 * 1. The edition's own marks (Ped. … *) are followed exactly where it writes them.
 * 2. Elsewhere the pedal changes with the harmony, at a beat: when a new bass note is struck at the
 *    start of the beat, or when the left hand brings in notes that are not in the harmony being held.
 *    Changes are "legato": the old sound is damped at the very moment the new one begins, so nothing
 *    is left dry and nothing from the previous harmony bleeds in.
 * 3. Written silence stays silent: where the piano has a rest of an eighth or more, the pedal is up.
 * 4. Steps never blur: a note sounding only because of the pedal is damped as soon as a note a
 *    semitone or a tone away begins (a melody or a bass line moving by step), as a pianist's finger
 *    legato and half-pedalling would keep them clean. Thirds and wider, the harmony, ring on.
 * 5. Re-striking a key ends its previous sound, as on a real piano.
 * 6. Detached notes (staccato and the like) are never held, and where the left hand plays detached
 *    the pedal is up for that beat.
 * Voices are never pedalled; only parts of kind "piano".
 *
 * Style (the edition's `pedal`): "romantic" (the default: Puccini, Verdi) holds a harmony as long as
 * it lasts. "classical" (Mozart) pedals lightly: a fresh pedal on every beat, so a harmony never
 * rings past its beat and the texture stays clear, as on a fortepiano.
 */
import type { CompiledEdition } from "./types";
import type { PerfMeasure, PerfNote } from "./timeline";

const EPS = 1e-6;
/** a rest at least this long (quarters) lifts the pedal */
const REST_LIFT = 0.5 - EPS;

interface Span {
  s: number;
  e: number;
}

export function applyPedal(edition: CompiledEdition, measures: PerfMeasure[], notes: PerfNote[], totalQ: number, beatUnit: (time: [number, number]) => number): PerfNote[] {
  const staffOf = new Map(edition.notes.map((n) => [n.id, n.staff]));
  const detached = new Set(edition.notes.filter((n) => n.staccato).map((n) => n.id));
  for (const part of edition.parts) {
    if (part.kind !== "piano") continue;
    const pn = notes.filter((n) => n.part === part.key).sort((a, b) => a.onQ - b.onQ);
    if (!pn.length) continue;
    const spans = pedalSpans(edition, measures, pn, part.key, staffOf, detached, totalQ, beatUnit);
    sustain(pn, spans, detached);
    if (edition.pedal === "classical") legatoTouch(pn, detached);
  }
  return notes;
}

/** Where the pedal is down: back-to-back spans are legato changes. */
function pedalSpans(
  edition: CompiledEdition,
  measures: PerfMeasure[],
  pn: PerfNote[],
  partKey: string,
  staffOf: Map<string, number>,
  detached: Set<string>,
  totalQ: number,
  beatUnit: (time: [number, number]) => number,
): Span[] {
  // 1. the edition's marks, on the performance timeline
  const marked: Span[] = [];
  let open: number | null = null;
  for (const pm of measures) {
    for (const p of edition.measures[pm.m].pedals ?? []) {
      if (p.part !== partKey) continue;
      const q = pm.startQ + p.q;
      if (p.type === "start") open = q;
      else if (p.type === "stop" && open !== null) {
        marked.push({ s: open, e: q });
        open = null;
      } else if (p.type === "change") {
        if (open !== null) marked.push({ s: open, e: q });
        open = q;
      }
    }
  }
  if (open !== null) marked.push({ s: open, e: totalQ });

  // 3. silences: gaps between written notes of an eighth or more
  const rests: Span[] = [];
  let reach = 0;
  for (const n of pn) {
    if (n.onQ - reach >= REST_LIFT && reach > 0) rests.push({ s: reach, e: n.onQ });
    reach = Math.max(reach, n.offQ);
  }

  // 2. harmony changes at beats
  const pc = (m: number) => ((m % 12) + 12) % 12;
  const classical = edition.pedal === "classical";
  const changes: number[] = [];
  const dry: number[] = []; // beats played detached: the pedal is up
  let held: Set<number> | null = null; // pitch classes of the harmony being held
  let bass: number | null = null;
  const beats: number[] = [];
  for (const pm of measures) {
    const unit = beatUnit(edition.measures[pm.m].time);
    for (let q = pm.startQ; q < pm.startQ + pm.durQ - EPS; q += unit) beats.push(q);
  }
  // rests end where the next note begins: that is a fresh pedal too
  const starts = [...new Set([...beats, ...rests.map((r) => r.e)])].sort((a, b) => a - b);
  for (let i = 0; i < starts.length; i++) {
    const b0 = starts[i];
    const b1 = starts[i + 1] ?? totalQ;
    const inBeat = pn.filter((n) => n.onQ >= b0 - EPS && n.onQ < b1 - EPS);
    if (!inBeat.length) continue;
    const left = inBeat.filter((n) => staffOf.get(n.ids[0]) === 2);
    const harmony = left.length ? left : inBeat;
    // 6. a beat whose harmony is all detached gets no pedal
    if (harmony.every((n) => n.ids.every((id) => detached.has(id)))) {
      dry.push(b0);
      held = null;
      bass = null;
      continue;
    }
    const set = new Set(harmony.map((n) => pc(n.midi)));
    // a bass note: the left hand's lowest note of the beat, struck at its start
    const low = Math.min(...harmony.map((n) => n.midi));
    const first = harmony.filter((n) => Math.abs(n.onQ - b0) < EPS);
    const newBass = first.some((n) => n.midi === low) ? pc(low) : null;
    const fresh =
      classical ||
      held === null ||
      rests.some((r) => Math.abs(r.e - b0) < EPS) ||
      (newBass !== null && newBass !== bass) ||
      [...set].some((x) => !held!.has(x));
    if (fresh) {
      changes.push(b0);
      held = set;
      bass = newBass ?? pc(low);
    } else for (const x of set) held!.add(x);
  }

  // auto spans run from each change to the next change, a rest or the end
  const auto: Span[] = [];
  for (let i = 0; i < changes.length; i++) {
    const s = changes[i];
    let e = changes[i + 1] ?? totalQ;
    const d = dry.find((x) => x > s + EPS && x < e - EPS);
    if (d !== undefined) e = d;
    const r = rests.find((x) => x.s > s + EPS && x.s < e - EPS);
    if (r) e = r.s;
    auto.push({ s, e });
  }
  // inside the edition's marked passages its marks decide (including its "*", which may leave a
  // moment unpedalled); outside them the harmony rules apply
  const spans: Span[] = [...marked];
  for (const a of auto) {
    let pieces: Span[] = [a];
    for (const m of marked) {
      pieces = pieces.flatMap((x) =>
        m.e <= x.s + EPS || m.s >= x.e - EPS
          ? [x]
          : [
              ...(m.s > x.s + EPS ? [{ s: x.s, e: m.s }] : []),
              ...(m.e < x.e - EPS && changes.some((c) => c >= m.e - EPS && c < x.e - EPS) ? [{ s: changes.find((c) => c >= m.e - EPS)!, e: x.e }] : []),
            ],
      );
    }
    spans.push(...pieces.filter((x) => x.e > x.s + EPS));
  }
  return spans.sort((a, b) => a.s - b.s);
}

/** Lengthen notes released while the pedal is down, then apply rules 4 and 5. */
/**
 * Mozart, lightly pedalled, still sings: a pianist joins the notes with the fingers, each key let go a moment after
 * the next is struck. Every note the pedal does not hold (and that is not detached) rings on a little past its
 * written end, up to a third of its length and never more than a sixteenth, and never into a note a step away (a
 * line moving by step stays clean). Without it, fast figures on sampled keys sound dry and rough.
 */
function legatoTouch(pn: PerfNote[], detached: Set<string>) {
  for (const n of pn) {
    if (n.soundOffQ !== undefined || n.ids.every((id) => detached.has(id))) continue;
    let end = n.offQ + Math.min(0.25, (n.offQ - n.onQ) / 3);
    for (const o of pn) {
      if (o.onQ <= n.onQ + EPS) continue;
      if (o.onQ >= end - EPS) break;
      if (Math.abs(o.midi - n.midi) <= 2 && o.onQ > n.offQ - EPS) {
        end = Math.max(n.offQ, Math.min(end, o.onQ + 0.05));
        break;
      }
    }
    if (end > n.offQ + EPS) n.soundOffQ = end;
  }
}

function sustain(pn: PerfNote[], spans: Span[], detached: Set<string>) {
  for (const n of pn) {
    if (n.ids.every((id) => detached.has(id))) continue;
    // the pedal is caught if the key is still down just after the span begins (a legato change
    // goes down a moment after the new notes are struck), and the key is released before it ends
    const sp = spans.find((x) => n.offQ > x.s + 1e-3 && n.offQ < x.e - EPS && n.onQ < x.e - EPS);
    if (!sp) continue;
    let end = sp.e;
    for (const o of pn) {
      if (o === n || o.onQ <= n.onQ + EPS) continue;
      if (o.onQ >= end - EPS) break;
      const d = Math.abs(o.midi - n.midi);
      if (d === 0 || d <= 2) {
        end = Math.max(n.offQ, o.onQ);
        break;
      }
    }
    if (end > n.offQ + EPS) n.soundOffQ = end;
  }
}
