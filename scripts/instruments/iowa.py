"""
Line instruments from the University of Iowa Musical Instrument Samples (MIS, 1997 sets): "may be downloaded and
used for any projects, without restrictions" (https://theremin.music.uiowa.edu/MIS.html).

Each file there is a chromatic scale, one note after another with silence between. This cuts the notes out, checks
each one's pitch, and writes every other semitone (a whole-tone set: the player moves a recording at most one
semitone) in the app's format: the note from its attack, 6 s long (a shorter note is lengthened by crossfading its
steady middle), levelled to the same loudness, a 0.5 s fade. All of an instrument's notes go into one 96 kbps mono
MP3, <kit>.kit.mp3, each in a slot of SLOT seconds (the note, then silence), listed with their measured tuning (cents)
in <kit>.kit.json; the app cuts the file apart when it loads (one file per instrument keeps the artifact small in
file count).

    python3 iowa.py SRC_DIR KIT DYNAMIC OUT_DIR TUNING_JSON
"""
import glob, json, os, re, subprocess, sys
import numpy as np, soundfile as sf, pyworld as pw

src, kit, dyn, out, tuning_path = sys.argv[1:6]
NAMES = {'C': 0, 'Db': 1, 'D': 2, 'Eb': 3, 'E': 4, 'F': 5, 'Gb': 6, 'G': 7, 'Ab': 8, 'A': 9, 'Bb': 10, 'B': 11}
def midi(n):
    m = re.match(r'([A-G]b?)(\d)', n); return NAMES[m.group(1)] + 12 * (int(m.group(2)) + 1)

LEN, FADE, SR = 6.0, 0.5, 44100
SLOT = 6.5  # each note, then silence, so the encoder never smears one into the next
notes = {}
for f in sorted(glob.glob(f'{src}/*.{dyn}.*.aif*')):
    rng = re.findall(r'([A-G]b?\d)', os.path.basename(f).split(f'.{dyn}.')[1])
    lo = midi(rng[0]); hi = midi(rng[-1]) if len(rng) > 1 else lo
    x, fs = sf.read(f, always_2d=True); x = x.mean(axis=1)
    if fs != SR:
        from scipy.signal import resample_poly
        x = resample_poly(x, SR, fs); fs = SR
    hop = int(0.01 * fs)
    rms = np.array([np.sqrt(np.mean(x[i:i + hop] ** 2) + 1e-12) for i in range(0, len(x) - hop, hop)])
    db = 20 * np.log10(rms / rms.max())
    # the room's own noise differs per file: notes are what rises well above it (and above -40 dB)
    floor = np.percentile(db, 10)
    db = np.convolve(db, np.ones(5) / 5, 'same')
    on = db > max(-40, floor + 0.45 * (0 - floor))
    # notes: runs above the threshold lasting at least 0.25 s, joined across dips shorter than 0.15 s
    segs, i = [], 0
    while i < len(on):
        if on[i]:
            j = i
            while j < len(on) and (on[j] or (j + 15 < len(on) and on[j:j + 15].any())): j += 1
            if j - i >= 25: segs.append((i * hop, j * hop))
            i = j
        else: i += 1
    want = list(range(lo, hi + 1))
    if len(segs) != len(want):
        print(f'{os.path.basename(f)}: {len(segs)} notes found, {len(want)} expected; matching by pitch', file=sys.stderr)
    for a, b in segs:
        seg = x[a:b]
        mid = seg[int(len(seg) * 0.3):int(len(seg) * 0.7)].astype(np.float64)
        f0, _ = pw.dio(np.ascontiguousarray(mid), fs, f0_floor=50, f0_ceil=2500, frame_period=10)
        f0 = pw.stonemask(np.ascontiguousarray(mid), f0, _, fs)
        v = f0[f0 > 0]
        if len(v) < 10: continue
        m_float = 69 + 12 * np.log2(np.median(v) / 440)
        m = int(round(m_float))
        if m not in want:  # an octave error of the pitch tracker
            for k in (m - 12, m + 12):
                if k in want: m = k; m_float += k - int(round(m_float))
        if m not in want: continue
        cents = round(100 * (m_float - m), 1)
        if m not in notes or len(seg) > len(notes[m][0]): notes[m] = (seg, cents)

def build(seg):
    n = int(LEN * fs)
    st = max(0, int(np.argmax(np.abs(seg) > np.abs(seg).max() * 0.02)) - int(0.003 * fs))
    seg = seg[st:]
    # level: the steady middle at one loudness
    mid = seg[int(len(seg) * 0.3):int(len(seg) * 0.7)]
    seg = seg / (np.sqrt(np.mean(mid ** 2)) + 1e-9) * 0.09  # about -22 dBFS sounding, as the earlier wind samples
    if len(seg) < n:
        # lengthen: repeat the steady middle with long crossfades until 6 s, then the note's own ending
        a, b = int(len(seg) * 0.35), int(len(seg) * 0.75)
        body = seg[a:b]; xf = min(int(0.25 * fs), len(body) // 3)
        tail = seg[b:]
        y = seg[:b].copy()
        w = np.linspace(0, 1, xf)
        while len(y) + len(tail) < n:
            y = np.concatenate([y[:-xf], y[-xf:] * (1 - w) + body[:xf] * w, body[xf:]])
        seg = np.concatenate([y[:-xf], y[-xf:] * (1 - w) + tail[:xf] * w if len(tail) >= xf else y[-xf:], tail[xf:]])
    seg = seg[:n].copy()
    if len(seg) < n: seg = np.pad(seg, (0, n - len(seg)))
    seg[-int(FADE * fs):] *= np.linspace(1, 0, int(FADE * fs))
    return seg

have = sorted(notes)
if not have: sys.exit(f'no notes found for {kit}')
# a whole-tone set: for every other semitone, the recorded note nearest it
keep = []
for t in range(have[0], have[-1] + 1, 2):
    m = min(have, key=lambda h: abs(h - t))
    if abs(m - t) <= 1 and m not in keep: keep.append(m)
if have[-1] not in keep: keep.append(have[-1])
os.makedirs(out, exist_ok=True)
tuning = json.load(open(tuning_path)) if os.path.exists(tuning_path) else {}
for k in [k for k in tuning if k.startswith(kit + '-')]: del tuning[k]
json.dump(tuning, open(tuning_path, 'w'), indent=1)
for f in glob.glob(f'{out}/{kit}-*.mp3'): os.remove(f)
keep.sort()
slot = int(SLOT * fs)
y = np.zeros(slot * len(keep), np.float32)
for i, m in enumerate(keep):
    y[i * slot:i * slot + int(LEN * fs)] = build(notes[m][0])
subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(fs), '-ac', '1', '-i', '-', '-c:a', 'libmp3lame', '-b:a', '96k', f'{out}/{kit}.kit.mp3'], input=y.tobytes(), check=True)
json.dump({'slot': SLOT, 'notes': [{'midi': m, 'cents': notes[m][1]} for m in keep]}, open(f'{out}/{kit}.kit.json', 'w'), indent=1)
print(kit, dyn, f'{len(have)} notes found ({have[0]}-{have[-1]}), kept {len(keep)}:', keep)
