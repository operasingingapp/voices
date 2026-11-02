/**
 * The spoken and sung word recordings, packed one file per voice (scripts/pack-voices.mjs) so the app is a few
 * files rather than hundreds. A clip is named "pack:<file>"; resolveAudio turns that into a playable URL, at once
 * when the voice's pack is already loaded (preloadVoicePacks warms them), otherwise once it has been fetched.
 */
const indexes = import.meta.glob("./voicepacks/*.json", { eager: true, import: "default" }) as Record<string, Record<string, [number, number]>>;
// The packs themselves live in the artifact's file store (uploaded beside the app, outside its size limit), at
// full quality; voiceblobs.json maps each pack to its stored address.
import blobMap from "./voiceblobs.json";
const bins: Record<string, string> = {};
for (const [name, v] of Object.entries(blobMap as Record<string, { url: string }>)) bins[`./voicepacks/${name}`] = v.url;

const where = new Map<string, { pack: string; off: number; len: number }>();
for (const [p, idx] of Object.entries(indexes)) {
  const pack = p.replace(/\.json$/, ".mp3");
  for (const [file, [off, len]] of Object.entries(idx)) where.set(file, { pack, off, len });
}
const loaded = new Map<string, Promise<ArrayBuffer>>();
const ready = new Map<string, ArrayBuffer>();
const urls = new Map<string, string>();

/** "pack:<file>" for a packed recording, or undefined */
export const packedUrl = (file?: string) => (file && where.has(file) ? `pack:${file}` : undefined);

function loadPack(pack: string): Promise<ArrayBuffer> {
  let p = loaded.get(pack);
  if (!p) {
    p = fetch(bins[pack])
      .then((r) => r.arrayBuffer())
      .then((b) => (ready.set(pack, b), b));
    p.catch(() => loaded.delete(pack));
    loaded.set(pack, p);
  }
  return p;
}
/** fetch the packs (call when a piece opens, so a tap on a word can play at once) */
export function preloadVoicePacks() {
  for (const pack of Object.keys(bins)) loadPack(pack).catch(() => undefined);
}
/** packs that have no stored address yet are skipped (their words are simply silent until uploaded) */
function hasBin(pack: string) {
  return pack in bins;
}
function clipUrl(file: string, buf: ArrayBuffer) {
  const w = where.get(file)!;
  let u = urls.get(file);
  if (!u) {
    u = URL.createObjectURL(new Blob([buf.slice(w.off, w.off + w.len)], { type: "audio/mpeg" }));
    urls.set(file, u);
  }
  return u;
}
/** a playable URL: plain URLs pass through; packed clips resolve from their pack */
export function resolveAudio(u: string): string | Promise<string> {
  if (!u.startsWith("pack:")) return u;
  const file = u.slice(5);
  const w = where.get(file);
  if (!w || !hasBin(w.pack)) return u;
  const buf = ready.get(w.pack);
  if (buf) return clipUrl(file, buf);
  return loadPack(w.pack).then((b) => clipUrl(file, b));
}
