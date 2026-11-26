"""Per piece: the app's playing time (score tempo, fermatas and last bar held, written slowings added; tempo_measure.json from
scripts/tempo/measure.ts) against the recordings. Each piece uses the smallest group of pieces containing it that at least three
recordings time on their own (each track minus 1.5 s of silence); factor = app time / median recording time."""
import json, statistics, sys
exec(open(__file__.replace('tempo_calc.py', 'tempo_data.py')).read())
meas = json.load(open(sys.argv[1]))
GAP = 1.5
def sec(t): m, s = t.split(':'); return int(m) * 60 + int(s)
recs = {r: {g: sum(sec(x) - GAP for x in ts) for g, ts in d.items()} for r, d in P.items()}
def tile(r, S):
    """the recording's time for exactly the pieces S, if some of its tracks cover S and nothing else"""
    inside = [g for g in recs[r] if set(g) <= S]
    cov = [p for g in inside for p in g]
    return sum(recs[r][g] for g in inside) if sorted(cov) == sorted(S) else None
def now(g): return sum(meas['mozart-' + p]['steadySec'] + meas['mozart-' + p]['extraSec'] for p in g)
allg = {frozenset(g) for d in P.values() for g in d}
# unions of neighbouring groups, so a piece that some recordings join to the next one still gets three timings
order = ORDER
for i in range(len(order)):
    for j in range(i + 1, min(i + 4, len(order))):
        allg.add(frozenset(order[i:j + 1]))
out = {}
pieces = sorted({p for g in allg for p in g})
for p in pieces:
    best = None
    for S in sorted((S for S in allg if p in S), key=len):
        t = {NAMES[r]: tile(r, S) for r in recs}; t = {k: v for k, v in t.items() if v}
        if len(t) >= 3: best = (S, t); break
    if not best: out[p] = None; continue
    S, t = best; T = now(S); med = statistics.median(t.values())
    out[p] = dict(group=sorted(S, key=order.index), now=round(T, 1), median=round(med, 1), k=round(T / med, 3), recs=t)
json.dump(out, open('tempo_res.json', 'w'), indent=1, ensure_ascii=False)
for p, v in out.items():
    if v: print(f"{p:34s} k {v['k']:.3f}  app {v['now']:6.1f}s  median {v['median']:6.1f}s  n{len(v['recs'])}  group {len(v['group'])}")
    else: print(f"{p:34s} -- fewer than three recordings")
