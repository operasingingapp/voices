/**
 * For every piece: how long the app plays it in its default (steady) mode at the score's tempo, and how much time the
 * written slowings it does not play (rit., rall., allarg., calando, morendo, smorz.) would add in a performance.
 * Written to /tmp for scripts/tempo/propose.py.
 */
import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { Performance } from "../../shared/timeline";
import type { CompiledEdition } from "../../shared/types";
const SLOW = /\b(rit|ritard|ritenuto|riten|rall|rallent|allarg|calando|morendo|smorz|slentando|stringendo-no)\b|rit\.|rall\./i;
const out: Record<string, unknown> = {};
for (const id of readdirSync("data/content")) {
  const f = `data/content/${id}/edition.json`;
  if (!existsSync(f)) continue;
  const ed = JSON.parse(readFileSync(f, "utf8")) as CompiledEdition;
  const perf = new Performance(ed, [], { tempo: "steady", pedal: false });
  // extra time for each written slowing: the next two bars (or up to the next tempo word) about a quarter slower
  let extra = 0;
  let slowings = 0;
  for (const pm of perf.measures) {
    const mi = ed.measures[pm.m];
    for (const w of mi.words ?? []) {
      if (!SLOW.test(w.text) || /a tempo/i.test(w.text)) continue;
      slowings++;
      const q0 = pm.startQ + w.q;
      let q1 = Math.min(perf.totalQ, q0 + 2 * pm.durQ);
      // stop at an "a tempo" or a tempo word written before then
      for (const pm2 of perf.measures) {
        if (pm2.startQ + pm2.durQ <= q0 || pm2.startQ >= q1) continue;
        for (const w2 of ed.measures[pm2.m].words ?? []) {
          const q = pm2.startQ + w2.q;
          if (q > q0 && q < q1 && /a tempo|tempo i|tempo primo/i.test(w2.text)) q1 = q;
        }
      }
      extra += 0.25 * (perf.qToSec(q1) - perf.qToSec(q0));
    }
  }
  const tempos = ed.measures.flatMap((m) => m.tempos.map((t) => t.bpm));
  out[id] = { steadySec: +perf.totalSec.toFixed(2), extraSec: +extra.toFixed(2), slowings, firstBpm: tempos[0] ?? null, tempoCount: new Set(tempos).size };
}
writeFileSync("/tmp/claude-0/-home-claude/3ebe1904-2cd5-5bf6-b252-ae0b967f4c22/scratchpad/tempo_measure.json", JSON.stringify(out, null, 1));
console.log(Object.keys(out).length, "pieces");
