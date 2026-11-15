"""Proposes corrected tempos: the app should take as long as the recordings, counting the time it already gives
fermatas and the last bar and the time written slowings (rit., rall. ...) take, instead of spreading that time over
the whole piece. Reads tempo_measure.json (measure.ts), the songs' tempo notes (songMeta.json) and the operas'
(pieces.tsx)."""
import json, re, statistics, sys
S = '/tmp/claude-0/-home-claude/3ebe1904-2cd5-5bf6-b252-ae0b967f4c22/scratchpad/'
meas = json.load(open(S + 'tempo_measure.json'))
basis = {}
for k, v in json.load(open('src/standalone/songMeta.json')).items():
    basis['song-' + k] = v.get('tempoBasis', '')
src = open('src/standalone/pieces.tsx').read()
for m in re.finditer(r'\n  "([a-z0-9-]+)": \{', src):
    seg = src[m.end(): m.end() + 4000]
    t = re.search(r'tempo: "((?:[^"\\]|\\.)*)"', seg)
    if t: basis.setdefault(m.group(1), t.group(1))
def secs(s):
    p = s.split(':'); return int(p[0]) * 60 + float(p[1])
rows = []
for eid, b in basis.items():
    if eid not in meas or not b: continue
    md = re.search(r'median (\d+:\d\d(?:\.\d+)?)', b)
    durs = [secs(x) for x in re.findall(r'(?<![\d:])(\d{1,2}:\d\d(?:\.\d)?)(?![\d:])', b)]
    if md: med = secs(md.group(1))
    elif len(durs) >= 2: med = statistics.median(durs)
    else: continue
    target = med - 1.5
    m = meas[eid]
    if not m['firstBpm'] or target <= 5: continue
    plays = m['steadySec'] + m['extraSec']
    k = plays / target
    rows.append(dict(id=eid, bpm=m['firstBpm'], new=round(m['firstBpm'] * k, 1), k=round(k, 3), med=med, plays=round(plays, 1),
                     steady=m['steadySec'], extra=m['extraSec'], n=len(durs), multi=m['tempoCount'] > 1))
json.dump(rows, open(S + 'tempo_rows.json', 'w'), indent=1)
ks = sorted(r['k'] for r in rows)
print(len(rows), 'pieces with recording timings; k median', statistics.median(ks), 'min', ks[0], 'max', ks[-1])
big = [r for r in rows if abs(r['k'] - 1) > 0.05]
print(len(big), 'differ by more than 5%:', sum(r['k'] > 1 for r in big), 'faster,', sum(r['k'] < 1 for r in big), 'slower')
for r in sorted(big, key=lambda r: -abs(r['k'] - 1))[:25]: print(r)
