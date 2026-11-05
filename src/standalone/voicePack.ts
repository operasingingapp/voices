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
/** clips fetched on their own (a byte range of their pack), by file */
const clipLoads = new Map<string, Promise<ArrayBuffer>>();
const clipReady = new Map<string, ArrayBuffer>();

/** "pack:<file>" for a packed recording, or undefined */
export const packedUrl = (file?: string) => (file && where.has(file) ? `pack:${file}` : undefined);

const lowPriority = { priority: "low" } as RequestInit;

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

/** Whether the file store answers a byte range (206) rather than the whole file: asked once, with a two-byte
    range; if it sends the whole file anyway, the download is cancelled at once. */
let rangeCheck: Promise<boolean> | null = null;
function rangesWork(): Promise<boolean> {
  if (!rangeCheck) {
    const any = Object.values(bins)[0];
    rangeCheck = !any
      ? Promise.resolve(false)
      : fetch(any, { headers: { Range: "bytes=0-1" } })
          .then(async (r) => {
            const ok = r.status === 206;
            try {
              await r.body?.cancel();
            } catch {
              /* already read */
            }
            return ok;
          })
          .catch(() => false);
  }
  return rangeCheck;
}

/** at most this many range requests at once, so the recordings never crowd out the music */
const MAX_PARALLEL = 3;
let running = 0;
const queue: (() => void)[] = [];
async function slot<T>(job: () => Promise<T>): Promise<T> {
  if (running >= MAX_PARALLEL) await new Promise<void>((r) => queue.push(r));
  running++;
  try {
    return await job();
  } finally {
    running--;
    queue.shift()?.();
  }
}

/** Fetch these clips as byte ranges of their packs: neighbouring clips (less than 96 KB apart) share one request. */
function loadClips(files: string[], low: boolean) {
  const byPack = new Map<string, { file: string; off: number; len: number }[]>();
  for (const file of new Set(files)) {
    if (clipLoads.has(file)) continue;
    const w = where.get(file);
    if (!w || !hasBin(w.pack) || ready.has(w.pack)) continue;
    const list = byPack.get(w.pack) ?? [];
    list.push({ file, off: w.off, len: w.len });
    byPack.set(w.pack, list);
  }
  for (const [pack, list] of byPack) {
    list.sort((a, b) => a.off - b.off);
    const groups: (typeof list)[] = [];
    for (const c of list) {
      const g = groups[groups.length - 1];
      const end = g ? g[g.length - 1].off + g[g.length - 1].len : -1;
      if (g && c.off - end < 96 * 1024) g.push(c);
      else groups.push([c]);
    }
    for (const g of groups) {
      const from = g[0].off;
      const to = g[g.length - 1].off + g[g.length - 1].len - 1;
      const range = slot(async () => {
        const r = await fetch(bins[pack], { ...(low ? lowPriority : {}), headers: { Range: `bytes=${from}-${to}` } });
        if (!r.ok) throw new Error("A recording could not be loaded");
        const buf = await r.arrayBuffer();
        // a store that ignores the range sends the whole pack: keep it as the pack
        if (r.status !== 206) {
          ready.set(pack, buf);
          loaded.set(pack, Promise.resolve(buf));
          return { buf, base: 0 };
        }
        return { buf, base: from };
      });
      for (const c of g) {
        const p = range.then(({ buf, base }) => {
          const b = buf.slice(c.off - base, c.off - base + c.len);
          clipReady.set(c.file, b);
          return b;
        });
        p.catch(() => clipLoads.delete(c.file));
        clipLoads.set(c.file, p);
      }
    }
  }
}

/** Warm this piece's recordings (a tap on a word then plays at once): only the clips it uses, as byte ranges, at
    low priority. Fetching whole packs (12 MB each, a typical piece touching 3 to 10 of them) used to download
    40 to 125 MB per piece and starved the piano, the score and the singers. If the store cannot send ranges,
    nothing is fetched ahead: a clip's pack loads when it is first asked for. */
export function preloadVoicePacks(files: string[]) {
  void rangesWork().then((ok) => {
    if (ok) loadClips(files.filter((f) => where.has(f)), true);
  });
}
/** packs that have no stored address yet are skipped (their words are simply silent until uploaded) */
function hasBin(pack: string) {
  return pack in bins;
}
function urlFor(file: string, bytes: ArrayBuffer) {
  let u = urls.get(file);
  if (!u) {
    u = URL.createObjectURL(new Blob([bytes], { type: "audio/mpeg" }));
    urls.set(file, u);
  }
  return u;
}
function clipUrl(file: string, buf: ArrayBuffer) {
  const w = where.get(file)!;
  return urls.get(file) ?? urlFor(file, buf.slice(w.off, w.off + w.len));
}
/** a playable URL: plain URLs pass through; packed clips resolve from their pack, or from their own range */
export function resolveAudio(u: string): string | Promise<string> {
  if (!u.startsWith("pack:")) return u;
  const file = u.slice(5);
  const w = where.get(file);
  if (!w || !hasBin(w.pack)) return u;
  const done = urls.get(file);
  if (done) return done;
  const buf = ready.get(w.pack);
  if (buf) return clipUrl(file, buf);
  const own = clipReady.get(file);
  if (own) return urlFor(file, own);
  return rangesWork().then(async (ok) => {
    if (ok) {
      loadClips([file], false);
      const p = clipLoads.get(file);
      if (p) return urlFor(file, await p);
    }
    const whole = ready.get(w.pack) ?? (await loadPack(w.pack));
    return clipUrl(file, whole);
  });
}
