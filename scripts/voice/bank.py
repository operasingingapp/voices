"""
Build a voice bank: what the app needs to sing a line live with one VocalSet singer.

For each note the singer recorded (one exercise, one vowel), the steady middle is analysed with the WORLD vocoder
and stored as:
  - a short "pulse" per frame (every STEP ms): the voice's colour for one glottal pulse, as a minimum-phase impulse
    response of the periodic part of the spectrum. The app adds one pulse per period of the pitch it wants, so any
    pitch and any length can be sung without resampling or looping audio;
  - one breath grain per note: noise shaped like the aperiodic (breathy) part, sliced a period at a time.
Pulses are levelled so every note has the same loudness; the app applies the line's dynamics.

    python3 scripts/voice/bank.py "FILES_GLOB" SEGMENTS_JSON OUT_DIR NAME

Writes NAME.bin (int16 data) and NAME.json (where each note's frames are, and the settings).
"""
import glob, json, os, sys
import numpy as np, pyworld as pw, soundfile as sf

STEP = 10.0     # ms between stored frames
R = 384         # samples per pulse (8.7 ms at 44.1 kHz; the responses have died away by then)
G = 4096        # samples of breath noise per note
FP = 5.0

files_glob, seg_json, out_dir, name = sys.argv[1:5]
files = sorted(glob.glob(files_glob))
segs = [s for s in json.load(open(seg_json)) if any(f.endswith(s["file"]) for f in files)]
os.makedirs(out_dir, exist_ok=True)

ana = {}
for f in files:
    x, fs = sf.read(f)
    x = x.astype(np.float64)
    f0, t = pw.harvest(x, fs, f0_floor=150, f0_ceil=1200, frame_period=FP)
    sp = pw.cheaptrick(x, f0, t, fs)
    ap = pw.d4c(x, f0, t, fs)
    ana[f] = (f0, sp, ap)
fs = 44100
nfft = (next(iter(ana.values()))[1].shape[1] - 1) * 2

def minphase(mag):
    """minimum-phase impulse response with this magnitude spectrum (rfft bins)"""
    logm = np.log(np.maximum(mag, 1e-9))
    cep = np.fft.irfft(logm, nfft)
    fold = np.zeros(nfft)
    fold[0] = cep[0]
    fold[1:nfft // 2] = 2 * cep[1:nfft // 2]
    fold[nfft // 2] = cep[nfft // 2]
    return np.fft.irfft(np.exp(np.fft.rfft(fold)), nfft)

tail = np.ones(R)
tail[-96:] = np.hanning(192)[96:]
rng = np.random.default_rng(3)
chosen = {}
for s in segs:
    f = next(f for f in files if f.endswith(s["file"]))
    f0, sp, ap = ana[f]
    a, b = int(s["start"] * 1000 / FP), int(s["end"] * 1000 / FP)
    n = b - a
    a, b = a + int(n * 0.2), b - int(n * 0.15)
    if b - a < 40 or (f0[a:b] > 0).mean() < 0.95:
        continue
    m = s["midi"]
    if m in chosen and chosen[m][3] >= s["len"]:
        continue
    chosen[m] = (f, a, b, s["len"], float(np.median(f0[a:b][f0[a:b] > 0])))

notes, chunks, pos = [], [], 0
for m in sorted(chosen):
    f, a, b, _, hz = chosen[m]
    f0, sp, ap = ana[f]
    frames = list(range(a, b, int(STEP / FP)))
    pulses = []
    for i in frames:
        per = np.sqrt(sp[i] * (1 - np.clip(ap[i], 0, 1) ** 2))
        pulses.append(minphase(per)[:R] * tail)
    pulses = np.array(pulses)
    # the breath: noise shaped by the average aperiodic spectrum of the note
    apmag = np.sqrt(np.mean(sp[a:b] * np.clip(ap[a:b], 0, 1) ** 2, axis=0))
    noise = np.fft.irfft(np.fft.rfft(rng.standard_normal(nfft * 2), nfft * 2)[: nfft + 1] * np.interp(np.linspace(0, 1, nfft + 1), np.linspace(0, 1, len(apmag)), apmag), nfft * 2)[:G]
    # level: the periodic energy one pulse per period of the note's own pitch should carry, the same for every note
    period = fs / hz
    e = np.sqrt(np.mean(np.sum(pulses ** 2, axis=1)) / period)
    pulses /= e
    noise /= e * np.sqrt(period)  # noise is added a period at a time: per-sample level relative to the pulses
    scale = 32767 / max(np.abs(pulses).max(), np.abs(noise).max()) * 0.98
    q_p = np.round(pulses * scale).astype(np.int16)
    q_n = np.round(noise * scale).astype(np.int16)
    notes.append({"midi": m, "hz": round(hz, 2), "frames": len(frames), "pulses": pos, "noise": pos + q_p.size, "scale": 1 / scale})
    chunks += [q_p.ravel(), q_n]
    pos += q_p.size + q_n.size

data = np.concatenate(chunks).astype("<i2")
data.tofile(os.path.join(out_dir, f"{name}.bin"))
json.dump({"name": name, "sampleRate": fs, "step": STEP / 1000, "pulse": R, "noise": G, "notes": notes,
           "source": "VocalSet (Wilkins, Seetharaman, Wahl, Pardo 2018), CC BY 4.0, https://doi.org/10.5281/zenodo.1442513"},
          open(os.path.join(out_dir, f"{name}.json"), "w"), indent=1)
print(name, len(notes), "notes", [n["midi"] for n in notes], f"{data.nbytes / 1e6:.2f} MB")
