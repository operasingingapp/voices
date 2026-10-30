"""Refine note onsets of an alignment to 5 ms: a pitch change counts where the voice gets nearer the new note than
the old; a note after a rest starts where the voice sounds.   python3 refine.py AUDIO ALIGN_JSON"""
import json, sys
import numpy as np, soundfile as sf, pyworld as pw
audio, path = sys.argv[1], sys.argv[2]
A = json.load(open(path)); R = A['notes']
x, fs = sf.read(audio)
if x.ndim > 1: x = x.mean(axis=1)
x = np.ascontiguousarray(x, dtype=np.float64)
# pitch needs no more than 16 kHz, and WORLD's memory grows with the rate (a 5-minute take at 44.1 kHz needs >6 GB)
if fs > 16000:
    from scipy.signal import resample_poly
    from math import gcd
    g = gcd(int(fs), 16000); x = resample_poly(x, 16000 // g, int(fs) // g); fs = 16000
FP = 5.0
f0, t = pw.harvest(x, fs, f0_floor=70, f0_ceil=1400, frame_period=FP)
w = int(FP / 1000 * fs)
rms = np.sqrt(np.convolve(x ** 2, np.ones(w) / w, 'same')[(t * fs).astype(int).clip(0, len(x) - 1)] + 1e-12)
db = 20 * np.log10(rms); thr = db.max() - 40
m = np.where(f0 > 0, 69 + 12 * np.log2(np.maximum(f0, 1) / 440), np.nan)
moved = []
for i, r in enumerate(R):
    a = r['audio']; c = int(a * 1000 / FP); W = int(80 / FP)
    lo, hi = max(0, c - W), min(len(m) - 3, c + W)
    prev = R[i - 1] if i else None
    new = None
    if prev and abs(prev['end'] - r['q']) < 1e-6 and prev['midi'] != r['midi']:
        for j in range(lo, hi):
            seg = m[j:j + 3]
            if np.all(np.abs(seg - r['midi']) < np.abs(seg - prev['midi'])): new = j; break
    elif not prev or prev['end'] < r['q'] - 1e-6:
        for j in range(lo, hi):
            if np.all(db[j:j + 3] > thr) and np.all(f0[j:j + 3] > 0): new = j; break
    if new is not None:
        r['audio'] = round(new * FP / 1000, 3); moved.append(r['audio'] - a)
for i in range(1, len(R)):
    if R[i]['audio'] <= R[i - 1]['audio'] + 0.02: R[i]['audio'] = round(R[i - 1]['audio'] + 0.02, 3)
A['duration'] = round(len(x) / fs, 3)
json.dump(A, open(path, 'w'), indent=0)
mv = np.array(moved)
print(f'refined {len(mv)} of {len(R)} onsets; shift ms median {np.median(mv)*1000:.0f}, p90 |{np.percentile(np.abs(mv),90)*1000:.0f}|')
