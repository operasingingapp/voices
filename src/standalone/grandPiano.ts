/**
 * The grand piano: the accompaniment recorded on a modelled concert grand (Pianoteq, Steinway D), one file per piece,
 * played in place of the app's own piano where a piece has one. The recordings were rendered from this app's own
 * performance of the piece (the score's tempo map, the app's pedalling, the expressive shaping), so each note sits
 * where the app plays it; the map below lines the recording up with the timeline actually playing (steady or smooth
 * tempo, a slower practice tempo), and the recorded-line player re-times it with the pitch kept.
 * Pieces without a recording, and places it cannot follow, keep the app's own piano.
 */
import { Performance } from "../../shared/timeline";
import type { CompiledEdition } from "../../shared/types";
import type { RecordingMap } from "../audio/recordedLine";
import list from "./grandPiano.json";

/** where the recordings are served (a public Cloudflare R2 bucket) */
export const GRAND_BASE = "https://pub-d8d81ace089e4d0f9b94db0d9c548850.r2.dev/piano/";

/** editionId -> file name of its piano recording */
const FILES = list as Record<string, string>;

/** the recorded grand under the sung lines: a full concert grand masks piano-sounding lines far more than the app's piano */
export const GRAND_GAIN_DB = -6;

export const grandPianoUrl = (editionId: string): string | undefined => (FILES[editionId] ? GRAND_BASE + FILES[editionId] : undefined);

/**
 * Where the recording's notes fall on the playing timeline: each piano onset's time in the performance playing now
 * (seconds at tempo 1) against its time in the recording (the score-tempo performance it was rendered from).
 * Onsets closer than 0.15 s are thinned (a chord, a run): enough to keep the beat, few enough to be quick.
 */
export function grandPianoMap(edition: CompiledEdition, playing: Performance): RecordingMap {
  const rendered = new Performance(edition, [], { tempo: "score", pedal: true });
  const pianoParts = new Set(edition.parts.filter((p) => p.kind === "piano").map((p) => p.key));
  const at = new Map<string, number>();
  for (const n of rendered.notes) if (pianoParts.has(n.part) && !at.has(n.ids[0])) at.set(n.ids[0], rendered.qToSec(n.onQ));
  const pairs: [number, number, number][] = [];
  for (const n of playing.notes) {
    if (!pianoParts.has(n.part)) continue;
    const a = at.get(n.ids[0]);
    if (a === undefined) continue;
    pairs.push([playing.qToSec(n.onQ), a, playing.qToSec(n.offQ)]);
  }
  pairs.sort((x, y) => x[0] - y[0]);
  const out: [number, number, number][] = [];
  for (const p of pairs) if (!out.length || p[0] - out[out.length - 1][0] >= 0.15) out.push(p);
  return { perf: out.map((p) => p[0]), audio: out.map((p) => p[1]), ends: out.map((p) => p[2]) };
}
