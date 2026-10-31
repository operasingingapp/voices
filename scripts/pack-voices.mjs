// Packs each voice's recordings (content/voice-bank/<id>/{sung,words}/*.mp3) into one file, so the published app
// stays under the host's file-count limit: src/standalone/voicepacks/<id>.mp3 (the clips one after another)
// and <id>.json ({ "content/voice-bank/<id>/words/x.mp3": [offset, length] }).
import fs from "node:fs";
import path from "node:path";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const bank = path.join(root, "content/voice-bank");
const out = path.join(root, "src/standalone/voicepacks");
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
for (const id of fs.readdirSync(bank).sort()) {
  const parts = [];
  const index = {};
  let off = 0;
  for (const sub of ["sung", "words"]) {
    const dir = path.join(bank, id, sub);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".mp3")).sort()) {
      const b = fs.readFileSync(path.join(dir, f));
      index[`content/voice-bank/${id}/${sub}/${f}`] = [off, b.length];
      parts.push(b);
      off += b.length;
    }
  }
  // a line with no music-shaped version plays its spoken recording: pack those too, or the app falls back to the
  // device's own voice for them
  const pieces = path.join(root, "content/pieces");
  for (const ed of fs.readdirSync(pieces)) {
    const mf = path.join(pieces, ed, "voice", id, "manifest.json");
    if (!fs.existsSync(mf)) continue;
    const clips = JSON.parse(fs.readFileSync(mf, "utf8")).clips ?? {};
    for (const c of Object.values(clips)) {
      const f = c.sung?.file ?? c.file;
      if (!f || index[f] || !fs.existsSync(path.join(root, f))) continue;
      const b = fs.readFileSync(path.join(root, f));
      index[f] = [off, b.length];
      parts.push(b);
      off += b.length;
    }
  }
  if (!parts.length) continue;
  fs.writeFileSync(path.join(out, `${id}.mp3`), Buffer.concat(parts));
  fs.writeFileSync(path.join(out, `${id}.json`), JSON.stringify(index));
  console.log(id, Object.keys(index).length, "clips", off, "bytes");
}
