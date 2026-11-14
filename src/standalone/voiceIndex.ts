/**
 * Where each word recording sits in its voice's pack (byte offset and length), from the packs' indexes. About
 * 1.4 MB of script, so it is loaded only when a recording is first needed (voicePack.ts imports it lazily).
 */
const indexes = import.meta.glob("./voicepacks/*.json", { eager: true, import: "default" }) as Record<string, Record<string, [number, number]>>;

export const where = new Map<string, { pack: string; off: number; len: number }>();
for (const [p, idx] of Object.entries(indexes)) {
  const pack = p.replace(/\.json$/, ".mp3");
  for (const [file, [off, len]] of Object.entries(idx)) where.set(file, { pack, off, len });
}
