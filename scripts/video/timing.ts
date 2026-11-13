import { readFileSync, writeFileSync } from "node:fs";
import { Performance } from "/home/claude/voices/shared/timeline";
const id = process.argv[2], role = process.argv[3];
const ed = JSON.parse(readFileSync(`/home/claude/voices/data/content/${id}/edition.json`, "utf8"));
const lang = JSON.parse(readFileSync(`/home/claude/voices/data/content/${id}/language.json`, "utf8"));
const perf = new Performance(ed, [], { tempo: "score", pedal: true });
const at = new Map<string, [number, number]>();
for (const n of perf.notes) for (const nid of n.ids) if (!at.has(nid)) at.set(nid, [perf.qToSec(n.onQ), perf.qToSec(n.offQ)]);
// note ties: a syllable lasts until the next syllable's note or its own note's end
const out = lang.phrases.filter((p: any) => p.roleId === role).map((p: any) => ({
  original: p.original, translation: p.translation, ipa: p.ipa,
  words: p.words.map((w: any) => w.text),
  syl: (p.syllables ?? []).map((s: any) => ({ text: s.text, word: s.word, t: at.get(s.noteId)?.[0] ?? null, end: at.get(s.noteId)?.[1] ?? null })),
}));
// beats for count-in: measure starts
const bars = ed.measures.map((m: any) => perf.qToSec(m.startQ));
const beats: number[] = [];
for (const m of ed.measures) { const [n, d] = m.time ?? [4, 4]; const step = (4 / d) * (d === 8 && n % 3 === 0 && n > 3 ? 3 : 1); for (let q = 0; q < m.durQ - 1e-6; q += step) beats.push(perf.qToSec(m.startQ + q)); }
writeFileSync(process.argv[4], JSON.stringify({ title: ed.title, total: perf.totalSec, phrases: out, bars, beats, qsec: Array.from({ length: Math.ceil((M => M[M.length-1].startQ + M[M.length-1].durQ)(ed.measures) * 8) + 1 }, (_, i) => [i / 8, perf.qToSec(i / 8)]) }, null, 1));
console.log(out.length, "phrases", perf.totalSec);
