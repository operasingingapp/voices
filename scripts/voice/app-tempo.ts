// Usage (from the repository): npx esbuild scripts/voice/app-tempo.ts --bundle --platform=node --outfile=/tmp/app-tempo.cjs && node /tmp/app-tempo.cjs PIECE OUT.json
// then: TEMPO_JSON=OUT.json python3 scripts/voice/vocalise.py score.musicxml out.musicxml 1 ah
import { Performance } from "../../shared/timeline";
import { readFileSync, writeFileSync } from "fs";
// The app's steady timing as tempo marks a notation program keeps: one at each point where some part has a note
// (or a bar starts), giving the average speed to the next such point, so every note lands where the app plays it.
const piece = process.argv[2];
const ed = JSON.parse(readFileSync(`data/content/${piece}/edition.json`, "utf8"));
const p = new Performance(ed, [], { tempo: "steady", pedal: true });
const grid = [...new Set([...p.notes.map((n) => +n.onQ.toFixed(4)), ...p.notes.map((n) => +n.offQ.toFixed(4)), ...p.measures.map((m) => m.startQ), p.totalQ])].sort((a, b) => a - b);
const out: { measure: string; q: number; bpm: number }[] = [];
let last = -1;
for (let i = 0; i < grid.length - 1; i++) {
  const a = grid[i], b = grid[i + 1];
  const bpm = ((b - a) * 60) / (p.qToSec(b) - p.qToSec(a));
  if (Math.abs(bpm - last) < 0.05) continue;
  const l = p.locate(a);
  out.push({ measure: ed.measures[l.m].number, q: +(a - p.measures[l.p].startQ).toFixed(4), bpm: +bpm.toFixed(3) });
  last = bpm;
}
writeFileSync(process.argv[3], JSON.stringify(out));
console.log(piece, out.length, "tempo points; length", p.totalSec.toFixed(1), "s");
