/**
 * Builds the app's playback sound bank from GeneralUser GS 2.0.3.
 * Keeps only the presets Counterpart needs (Acoustic Grand Piano, bank 0 program 0)
 * so the browser downloads a few MB instead of 32 MB.
 *
 *   npx tsx scripts/build-soundbank.ts
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { SoundBankLoader } from "spessasynth_core";

const SRC = "content/vendor/generaluser-gs/GeneralUser-GS.sf2";
const OUT_DIR = "public/soundbank";
const KEEP = [{ bankMSB: 0, program: 0 }]; // Acoustic Grand Piano

const buf = readFileSync(SRC);
const bank = SoundBankLoader.fromArrayBuffer(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
const before = bank.presets.length;
for (const p of [...bank.presets]) {
  const keep = KEEP.some((k) => k.bankMSB === p.bankMSB && k.program === p.program && !p.isGMGSDrum && p.bankLSB === 0);
  if (!keep) bank.deletePreset(p);
}
bank.removeUnusedElements();
bank.flush();
const kept = bank.presets.map((p) => `${p.bankMSB}:${p.program} ${p.name}`);
const out = bank.writeSF2({});
mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(`${OUT_DIR}/counterpart-piano.sf2`, Buffer.from(out));
const sha = createHash("sha256").update(Buffer.from(out)).digest("hex");
const srcSha = createHash("sha256").update(buf).digest("hex");
const record = {
  file: "counterpart-piano.sf2",
  sha256: sha,
  bytes: out.byteLength,
  presets: kept,
  derivedFrom: {
    name: "GeneralUser GS",
    version: "2.0.3",
    author: "S. Christian Collins",
    source: "https://github.com/mrbumpy409/GeneralUser-GS (commit 684543d5e5efaef08d02be50dcda8d552478fa60)",
    sourceSha256: srcSha,
    licence: "GeneralUser GS License v2.0 — free use in software projects; modification permitted (see LICENSE.txt)",
    licenceCaveat:
      "Author states that the origin of some samples cannot be confirmed with 100% certainty. Review before commercial release, or replace with a bank with fully documented sample provenance.",
  },
  modification: "All presets except Acoustic Grand Piano (bank 0, program 0) removed with spessasynth_core; samples otherwise unchanged.",
  builtAt: new Date().toISOString(),
};
writeFileSync(`${OUT_DIR}/counterpart-piano.licence.json`, JSON.stringify(record, null, 2));
console.log(`presets ${before} -> ${kept.length}:`, kept, `size ${(out.byteLength / 1e6).toFixed(2)} MB`);
