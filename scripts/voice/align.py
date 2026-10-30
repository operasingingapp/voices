"""Align a sung render to the score: returns, for every sung note (ties joined), where it starts in the audio.
    python3 align.py PIECE PART AUDIO SCALE OUT_JSON"""
import json, sys
import numpy as np, soundfile as sf, pyworld as pw
from numba import njit
piece, part, audio, scale, out = sys.argv[1], sys.argv[2], sys.argv[3], float(sys.argv[4]), sys.argv[5]
E = json.load(open(f'/home/claude/voices/data/content/{piece}/edition.json'))
meas = {m['idx']: m for m in E['measures']}
ch = sorted((m['startQ'] + t['q'], t['bpm'] * scale) for m in E['measures'] for t in m.get('tempos', []))
def sec(Q):
    s, pq, bpm = 0.0, 0.0, ch[0][1]
    for q, b in ch:
        if q >= Q: break
        s += (q - pq) * 60 / bpm; pq, bpm = q, b
    return s + (Q - pq) * 60 / bpm
S = sorted((n for n in E['notes'] if n['part'] == part), key=lambda n: meas[n['m']]['startQ'] + n['q'])
ev = []
for n in S:
    Q = meas[n['m']]['startQ'] + n['q']
    if n['tieStop'] and ev and ev[-1][2] == n['midi'] and abs(ev[-1][1] - Q) < 1e-6:
        ev[-1][1] = Q + n['dur']; continue
    ev.append([Q, Q + n['dur'], n['midi'], n['id']])
FP = 20.0
x, fs = sf.read(audio)
if x.ndim > 1: x = x.mean(axis=1)
x = np.ascontiguousarray(x, dtype=np.float64)
f0, t = pw.harvest(x, fs, f0_floor=120, f0_ceil=1400, frame_period=FP)
rms = np.array([np.sqrt(np.mean(x[int(a * fs):int(a * fs) + int(FP / 1000 * fs)] ** 2) + 1e-12) for a in t])
loud = 20 * np.log10(rms) > 20 * np.log10(rms.max()) - 45
am = np.where((f0 > 0) & loud, 69 + 12 * np.log2(np.maximum(f0, 1) / 440), 0.0)
endS = sec(ev[-1][1]) + 1
N = int(endS * 1000 / FP)
sm = np.zeros(N)
for q0, q1, m, _ in ev:
    a, b = int(sec(q0) * 1000 / FP), int(sec(q1) * 1000 / FP)
    sm[a:b] = m
@njit(cache=True)
def dtw(sm, am, band):
    N, M = len(sm), len(am)
    INF = 1e18
    D = np.full((N + 1, M + 1), INF); D[0, 0] = 0.0
    for i in range(1, N + 1):
        c = int(i * M / N)
        lo, hi = max(1, c - band), min(M, c + band)
        for j in range(lo, hi + 1):
            s, a = sm[i - 1], am[j - 1]
            if s > 0 and a > 0:
                d = abs(s - a); d = min(d, 3.0)
                if d > 12.5: d = 3.0
                # octave-tolerant
                o = abs(abs(s - a) - 12.0)
                if o < d: d = o + 0.5
            elif s == 0 and a == 0: d = 0.0
            else: d = 1.5
            D[i, j] = d + min(D[i - 1, j - 1], D[i - 1, j] + 0.3, D[i, j - 1] + 0.3)
    # backtrack
    path_i = np.empty(N + M, np.int64); path_j = np.empty(N + M, np.int64)
    i, j, k = N, M, 0
    while i > 0 and j > 0:
        path_i[k] = i - 1; path_j[k] = j - 1; k += 1
        a, b, c = D[i - 1, j - 1], D[i - 1, j], D[i, j - 1]
        if a <= b and a <= c: i -= 1; j -= 1
        elif b <= c: i -= 1
        else: j -= 1
    return path_i[:k][::-1], path_j[:k][::-1], D[N, M]
# trim audio to the sung span (leading silence handled by DTW too)
pi, pj, cost = dtw(sm, am, int(30 * 1000 / FP))
first = {}
for i, j in zip(pi, pj):
    if i not in first: first[i] = j
def a_of(s):  # score seconds -> audio seconds
    i = min(N - 1, int(s * 1000 / FP))
    return first.get(i, 0) * FP / 1000
rows = []
for q0, q1, m, nid in ev:
    s0 = sec(q0); a0 = a_of(s0)
    # refine onset: look +-60 ms for where the pitch reaches the note
    rows.append({'id': nid, 'q': q0, 'end': q1, 'midi': m, 'score': round(s0, 3), 'audio': round(a0, 3)})
# check: pitch in the middle of each note
ok = 0
for r in rows:
    nxt = a_of(sec(r['end']))
    seg = am[int(r['audio'] * 1000 / FP):max(int(r['audio'] * 1000 / FP) + 1, int(nxt * 1000 / FP))]
    v = seg[seg > 0]
    med = float(np.median(v)) if len(v) else 0
    r['heard'] = round(med, 2)
    if len(v) and abs(med - r['midi']) < 0.8: ok += 1
json.dump({'audio': audio, 'scale': scale, 'notes': rows}, open(out, 'w'), indent=0)
print(f'{ok}/{len(rows)} notes heard at the right pitch; audio {len(x)/fs:.1f}s, score {endS:.1f}s, cost {cost:.0f}')
d = [r['audio'] - r['score'] for r in rows]
for k in range(0, len(rows), 25): print(rows[k]['q'], rows[k]['score'], rows[k]['audio'], rows[k]['midi'], rows[k]['heard'])
