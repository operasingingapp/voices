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
import type { ChunkedSpec } from "../audio/chunkedAudio";
import list from "./grandPiano.json";

/** the public Cloudflare R2 bucket the recordings are kept in */
const R2_BASE = "https://pub-d8d81ace089e4d0f9b94db0d9c548850.r2.dev/piano/";
/**
 * Where the recordings are served: on the app's own website through the site itself (/a/, a Pages Function in
 * front of the same bucket, cached at the edge), elsewhere (the claude.ai artifact, a local build) straight from the
 * bucket. A test may point it elsewhere (window.__SV_GRAND_BASE__).
 */
export const GRAND_BASE: string = (() => {
  if (typeof window === "undefined") return R2_BASE;
  const w = window as { __SV_GRAND_BASE__?: string };
  if (w.__SV_GRAND_BASE__) return w.__SV_GRAND_BASE__;
  const site = location.protocol === "https:" && !/claude|localhost|^127\.|^\[?::1/i.test(location.hostname);
  return site ? "/a/piano/" : R2_BASE;
})();

/** a recording as chunks (scripts/audio/chunk-grand.py): its folder, length and channels */
interface V2 {
  dir: string;
  samples: number;
  channels: number;
}
/** editionId -> its piano recording and the gain that matches it to the app's own piano (the recordings are left
 * untouched; the level is set here), and the singers' lines rendered with it */
const FILES = list as Record<string, { file: string; gainDb: number; v2?: V2; lines?: Record<string, { file: string; gainDb: number; v2?: V2 }> }>;

/** how the chunks are cut (chunk-grand.py): 48 kHz, 10 s each, with 0.25 s of each neighbour on either side */
const RATE = 48000;
const CHUNK = 10 * RATE;
const OVERLAP = RATE / 4;

const spec = (v: V2, priority: number): ChunkedSpec => ({
  base: GRAND_BASE + v.dir,
  calib: `${GRAND_BASE}v2/calib-${v.channels}.m4a`,
  // through the site, the bucket itself if the site cannot serve it
  alt: GRAND_BASE === R2_BASE ? undefined : R2_BASE,
  rate: RATE,
  chunk: CHUNK,
  overlap: OVERLAP,
  samples: v.samples,
  channels: v.channels,
  priority,
});

/** the recorded grand under the sung lines, at its own level (the lines sit below it: GRAND_LINE_DB) */
export const GRAND_GAIN_DB = 2;
/** a singer's line played on the grand, under the accompaniment: normalised to the same level as the whole piece, a single
 * line on its own sounds far louder than it should against the accompaniment, so it sits this far below */
export const GRAND_LINE_DB = -10;

export const grandPianoUrl = (editionId: string): string | undefined => {
  const f = FILES[editionId];
  return f ? GRAND_BASE + (f.v2 ? f.v2.dir : f.file) : undefined;
};
/** the accompaniment's chunks (loaded first) */
export const grandPianoChunks = (editionId: string): ChunkedSpec | undefined => {
  const v = FILES[editionId]?.v2;
  return v ? spec(v, 0) : undefined;
};
/** the recording's level against the app's piano (dB) */
export const grandPianoGain = (editionId: string): number => FILES[editionId]?.gainDb ?? 0;
/** a singer's line played on the same grand (rendered with the accompaniment, on the same clock), if there is one */
export const grandLineUrl = (editionId: string, partKey: string): string | undefined => {
  const f = FILES[editionId]?.lines?.[partKey];
  return f ? GRAND_BASE + (f.v2 ? f.v2.dir : f.file) : undefined;
};
/** a line's chunks: priority 0 for the singer's own line (loaded with the accompaniment), 1 for the others (after) */
export const grandLineChunks = (editionId: string, partKey: string, priority: number): ChunkedSpec | undefined => {
  const v = FILES[editionId]?.lines?.[partKey]?.v2;
  return v ? spec(v, priority) : undefined;
};
/** a line's level against the app's sound of it (dB): its own when it was rendered on its own, else the piece's */
export const grandLineGain = (editionId: string, partKey: string): number => {
  const f = FILES[editionId]?.lines?.[partKey];
  return (f ? f.gainDb : grandPianoGain(editionId)) + GRAND_LINE_DB;
};

/** where a sung line's notes fall on the playing timeline against the recording (as grandPianoMap, for one part) */
export function grandLineMap(edition: CompiledEdition, playing: Performance, partKey: string): RecordingMap {
  const rendered = new Performance(edition, [], { tempo: "score", pedal: true });
  const at = new Map<string, number>();
  for (const n of rendered.notes) if (n.part === partKey && !at.has(n.ids[0])) at.set(n.ids[0], rendered.qToSec(n.onQ));
  const pairs: [number, number, number][] = [];
  for (const n of playing.notes) {
    if (n.part !== partKey) continue;
    const a = at.get(n.ids[0]);
    if (a !== undefined) pairs.push([playing.qToSec(n.onQ), a, playing.qToSec(n.offQ)]);
  }
  pairs.sort((x, y) => x[0] - y[0]);
  return { perf: pairs.map((p) => p[0]), audio: pairs.map((p) => p[1]), ends: pairs.map((p) => p[2]) };
}

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
