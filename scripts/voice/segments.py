"""
Find the steady sung notes in VocalSet recordings: for each file, the stretches where the pitch holds one note
(vibrato allowed), with their pitch, length, loudness and vibrato. Writes one JSON per singer.

    python3 scripts/voice/segments.py VOCALSET_FULL_DIR OUT_DIR [singer ...]
"""
import json, os, sys, glob
import numpy as np, librosa

FULL, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
singers = sys.argv[3:] or sorted(os.listdir(FULL))
SR = 22050
HOP = 256
KINDS = ["long_tones/forte", "long_tones/pp", "long_tones/messa", "scales/slow_forte", "scales/slow_piano", "scales/vibrato"]

def segments(path):
    y, sr = librosa.load(path, sr=SR)
    f0, voiced, _ = librosa.pyin(y, fmin=65, fmax=1300, sr=SR, frame_length=2048, hop_length=HOP)
    m = librosa.hz_to_midi(f0)
    t = librosa.times_like(f0, sr=SR, hop_length=HOP)
    rms = librosa.feature.rms(y=y, frame_length=2048, hop_length=HOP)[0]
    # the pitch smoothed over ~200 ms (about one vibrato cycle) decides which note is sung
    k = int(0.2 * SR / HOP)
    sm = np.array([np.nanmedian(m[max(0, i - k): i + k + 1]) if np.any(voiced[max(0, i - k): i + k + 1]) else np.nan for i in range(len(m))])
    out, start = [], None
    for i in range(len(sm) + 1):
        note = round(sm[i]) if i < len(sm) and not np.isnan(sm[i]) and abs(sm[i] - round(sm[i])) < 0.45 else None
        if start is not None and (note != cur or i == len(sm)):
            a, b = start, i
            # trim the glide in and out: keep frames within 0.6 semitone of the note's median
            seg = m[a:b]
            if b - a > 0.35 * SR / HOP:
                med = np.nanmedian(seg)
                vib = seg[~np.isnan(seg)] - med
                # vibrato: rate from zero crossings of the detrended pitch, extent from its spread
                zc = np.sum(np.abs(np.diff(np.sign(vib - np.mean(vib)))) > 0) / 2 / max(1e-6, (b - a) * HOP / SR)
                out.append({"file": os.path.relpath(path, FULL), "start": round(float(t[a]), 3), "end": round(float(t[b - 1]), 3),
                            "midi": int(cur), "cents": round(float((med - cur) * 100), 1), "len": round(float((b - a) * HOP / SR), 3),
                            "db": round(float(20 * np.log10(np.mean(rms[a:b]) + 1e-9)), 1),
                            "vib_rate": round(float(zc), 2), "vib_ext": round(float(np.nanstd(vib) * 100), 1)})
            start = None
        if i < len(sm) and note is not None and start is None:
            start, cur = i, note
    return out

for s in singers:
    files = []
    for kind in KINDS:
        files += sorted(glob.glob(os.path.join(FULL, s, kind, "*.wav")))
    res = []
    for f in files:
        try:
            res += segments(f)
        except Exception as e:
            print("skip", f, e)
    json.dump(res, open(os.path.join(OUT, f"{s}.json"), "w"))
    notes = sorted({r["midi"] for r in res})
    print(s, len(files), "files", len(res), "notes", notes[0] if notes else "-", "-", notes[-1] if notes else "-", flush=True)
