"""WORLD's harvest pitch tracker over a long take in pieces (its memory grows with the length: a 5-minute take
needs several GB at once). Pieces of about a minute overlap by a second; each frame comes from the piece where it
sits furthest from an edge."""
import numpy as np, pyworld as pw

def harvest(x, fs, f0_floor, f0_ceil, frame_period, piece=60.0, overlap=1.0):
    hop = frame_period / 1000
    n = int(len(x) / fs / hop) + 1
    f0 = np.zeros(n)
    step = int(round(piece / hop)); ov = int(round(overlap / hop))
    for a in range(0, n, step):
        lo, hi = max(0, a - ov), min(n, a + step + ov)
        seg = np.ascontiguousarray(x[int(lo * hop * fs):int(hi * hop * fs) + 1])
        g, _ = pw.harvest(seg, fs, f0_floor=f0_floor, f0_ceil=f0_ceil, frame_period=frame_period)
        take = g[a - lo:a - lo + min(step, n - a)]
        f0[a:a + len(take)] = take
    return f0, np.arange(n) * hop
