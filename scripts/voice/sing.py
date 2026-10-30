"""
Sing a vocal line with one VocalSet singer, as one continuous performance.

The singer's recordings of one exercise on one vowel (e.g. female1, slow forte scales, "a") are analysed with the
WORLD vocoder into pitch, spectral envelope (the voice's colour) and aperiodicity (breath). For each note of the
line the envelope frames of the nearest sung note are reused (steady middle only, run forwards and backwards so a
long note never jumps), the pitch is a fresh smooth curve (a short glide into each note, one even vibrato that
starts a moment after the note begins), and neighbouring notes blend their colour over a few tens of ms. Each
phrase between rests is synthesised in one piece, so there are no joins to hear.

    python3 scripts/voice/sing.py SINGER_DIR_GLOB SEGMENTS_JSON NOTES_JSON OUT_WAV

NOTES_JSON: [{"t": seconds, "d": seconds, "midi": n, "vel": 1..127}, ...] in time order.
"""
import glob, json, sys
import numpy as np, pyworld as pw, soundfile as sf

FP = 5.0  # frame period, ms
VIB_RATE, VIB_DEPTH, VIB_DELAY, VIB_RISE = 5.4, 0.32, 0.22, 0.35  # Hz, semitones (peak), s, s
GLIDE = 0.07       # s: pitch glide into a new note
BLEND = 0.05       # s: colour crossfade between notes
REST = 0.12        # s: a gap at least this long ends a phrase

files_glob, seg_json, notes_json, out_wav = sys.argv[1:5]
files = sorted(glob.glob(files_glob))
segs = [s for s in json.load(open(seg_json)) if any(f.endswith(s["file"]) for f in files)]

# ---- analyse the recordings once
ana = {}
for f in files:
    x, fs = sf.read(f)
    x = x.astype(np.float64)
    f0, t = pw.harvest(x, fs, f0_floor=150, f0_ceil=1200, frame_period=FP)
    sp = pw.cheaptrick(x, f0, t, fs)
    ap = pw.d4c(x, f0, t, fs)
    ana[f] = (f0, sp, ap, fs)
fs = next(iter(ana.values()))[3]

# ---- one template per sung note: the steady middle frames, levelled to the same loudness
templates = {}
for s in segs:
    f = next(f for f in files if f.endswith(s["file"]))
    f0, sp, ap, _ = ana[f]
    a, b = int(s["start"] * 1000 / FP), int(s["end"] * 1000 / FP)
    n = b - a
    a, b = a + int(n * 0.2), b - int(n * 0.15)
    voiced = f0[a:b] > 0
    if b - a < 40 or voiced.mean() < 0.95:
        continue
    m = s["midi"]
    if m in templates and templates[m]["len"] >= s["len"]:
        continue
    templates[m] = {"sp": sp[a:b].copy(), "ap": ap[a:b].copy(), "len": s["len"]}
for t in templates.values():
    t["sp"] /= np.mean(t["sp"])  # equal energy per template (the line's dynamics are applied later)
have = sorted(templates)
print("templates at", have)

def frames_for(m, n, seed):
    """n envelope frames for note m: the nearest template, read forwards and backwards (ping-pong)."""
    k = min(have, key=lambda h: (abs(h - m), h < m))  # nearest, preferring a recording just above
    sp, ap = templates[k]["sp"], templates[k]["ap"]
    L = len(sp)
    period = 2 * (L - 1)
    pos = (seed + np.arange(n)) % period
    idx = np.where(pos < L, pos, period - pos)
    return sp[idx], ap[idx]

notes = json.load(open(notes_json))
# group into phrases
phrases, cur = [], []
for nt in notes:
    if cur and nt["t"] - (cur[-1]["t"] + cur[-1]["d"]) > REST:
        phrases.append(cur)
        cur = []
    cur.append(nt)
if cur:
    phrases.append(cur)

total = notes[-1]["t"] + notes[-1]["d"] + 2
out = np.zeros(int(total * fs))
rng = np.random.default_rng(7)
for ph in phrases:
    t0 = ph[0]["t"]
    t1 = ph[-1]["t"] + ph[-1]["d"]
    N = int((t1 - t0) * 1000 / FP) + 1
    tt = np.arange(N) * FP / 1000  # seconds from phrase start
    pitch = np.zeros(N)
    gain = np.zeros(N)
    sp = np.zeros((N, templates[have[0]]["sp"].shape[1]))
    ap = np.zeros_like(sp)
    vib_env = np.zeros(N)
    # note by note: target pitch, frames, gain
    for j, nt in enumerate(ph):
        a = int((nt["t"] - t0) * 1000 / FP)
        b = N if j == len(ph) - 1 else int((ph[j + 1]["t"] - t0) * 1000 / FP)
        b = max(b, a + 1)
        pitch[a:b] = nt["midi"]
        s_, a_ = frames_for(nt["midi"], b - a, int(rng.integers(0, 1000)))
        sp[a:b], ap[a:b] = s_, a_
        gain[a:b] = 10 ** ((nt["vel"] - 80) * 0.25 / 20)
        # vibrato fades in after the onset (short notes get little or none)
        local = tt[a:b] - tt[a]
        vib_env[a:b] = np.clip((local - VIB_DELAY) / VIB_RISE, 0, 1)
    # glide: smooth the stepwise pitch with a short raised-cosine kernel (about GLIDE long), so each note is
    # approached from the last one instead of jumping
    g = max(1, int(GLIDE * 1000 / FP))
    ker = np.hanning(2 * g + 1)
    ker /= ker.sum()
    smooth = np.convolve(np.pad(pitch, g, mode="edge"), ker, mode="valid")
    # one continuous vibrato through the phrase (no phase jumps), with a little natural wander in rate and depth
    rate = VIB_RATE * (1 + 0.04 * np.sin(2 * np.pi * 0.23 * tt + rng.uniform(0, 6)))
    phase = 2 * np.pi * np.cumsum(rate) * FP / 1000
    depth = VIB_DEPTH * (1 + 0.15 * np.sin(2 * np.pi * 0.31 * tt + rng.uniform(0, 6)))
    vib_env_s = np.convolve(np.pad(vib_env, g, mode="edge"), ker, mode="valid")
    curve = smooth + depth * vib_env_s * np.sin(phase)
    f0 = 440.0 * 2 ** ((curve - 69) / 12)
    # colour: blend neighbouring notes' envelopes in the log domain over BLEND
    bk = max(1, int(BLEND * 1000 / FP))
    kb = np.hanning(2 * bk + 1)
    kb /= kb.sum()
    lsp = np.log(sp + 1e-12)
    lsp = np.apply_along_axis(lambda c: np.convolve(np.pad(c, bk, mode="edge"), kb, mode="valid"), 0, lsp)
    ap = np.apply_along_axis(lambda c: np.convolve(np.pad(c, bk, mode="edge"), kb, mode="valid"), 0, ap)
    sm_gain = np.convolve(np.pad(gain, bk, mode="edge"), kb, mode="valid")
    sp2 = np.exp(lsp) * (sm_gain[:, None] ** 2)
    y = pw.synthesize(np.ascontiguousarray(f0), np.ascontiguousarray(sp2), np.ascontiguousarray(np.clip(ap, 0, 1)), fs, FP)
    # breath in and out of the phrase
    fi, fo = int(0.04 * fs), int(0.12 * fs)
    y[:fi] *= np.linspace(0, 1, fi)
    y[-fo:] *= np.linspace(1, 0, fo)
    i = int(t0 * fs)
    out[i:i + len(y)] += y[: len(out) - i]

out /= np.max(np.abs(out)) + 1e-9
sf.write(out_wav, (out * 0.9).astype(np.float32), fs)
print("wrote", out_wav, len(phrases), "phrases")
