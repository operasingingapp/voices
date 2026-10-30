"""
Pack the Noct-Salamander piano for the practice app: one MP3 per loudness layer (16), each holding the 30 recorded
notes one after another in fixed slots, and a manifest saying where each note sits, how loud it is and how the
88 keys are tuned.

    python3 scripts/piano/pack.py NOCT_WAV_DIR TUNED_SFZ_TXT OUT_DIR

NOCT_WAV_DIR holds the 480 files the Noct 6.2 build writes (021_A0v01.wav … 108_C8v16.wav, see build.sh);
TUNED_SFZ_TXT is src/tuned_sfz.txt from https://github.com/cyamauch/NoctSalamanderGrandPiano.
Needs ffmpeg and numpy.
"""
import json, os, re, subprocess, sys
import numpy as np

SR = 44100
GAP = 0.25          # silence before each note in its slot, so the player can find every onset
FLOOR_DB = -48      # a note is kept until it has died away this far below its peak…
MAX_S, MIN_S = 10.0, 3.0
FADE_S = 1.2        # …then faded out over this long
BITRATE = "80k"     # stereo, as the previous piano

src, tuned_txt, out = sys.argv[1:4]
os.makedirs(out, exist_ok=True)

def read(path):
    # ffmpeg honours each file's own sample rate, in which the Noct build bakes the tuning
    raw = subprocess.run(["ffmpeg", "-v", "quiet", "-i", path, "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2)

files = sorted(f for f in os.listdir(src) if re.match(r"\d{3}_[A-G]#?\d+v\d\d\.wav$", f))
keys = sorted({int(f[:3]) for f in files})
layers = sorted({int(f[-6:-4]) for f in files})
assert len(keys) * len(layers) == len(files), "every key needs every layer"

def trim(x):
    mono = np.abs(x).max(axis=1)
    peak = mono.max()
    # the sustained level in 50 ms windows, so one quiet sample does not end the note
    win = int(0.05 * SR)
    env = np.array([mono[i:i + win].max() for i in range(0, len(mono), win)])
    above = np.nonzero(env > peak * 10 ** (FLOOR_DB / 20))[0]
    n = min(len(x), int(MAX_S * SR), max(int(MIN_S * SR), (above[-1] + 1) * win if len(above) else len(x)))
    y = x[:n].copy()
    f = min(n, int(FADE_S * SR))
    y[n - f:] *= np.linspace(1, 0, f)[:, None]
    return y

def loudness(x):
    # the attack's level: RMS of the first 300 ms, in dB
    a = x[: int(0.3 * SR)]
    return 20 * np.log10(np.sqrt(np.mean(a ** 2)) + 1e-12)

manifest = {"source": "Noct-Salamander Grand Piano V6.2a (Accurate-Salamander Project, C. Yamauchi), built from "
            "the Salamander Grand Piano V3 (A. Holm), CC BY 3.0",
            "sampleRate": SR, "gap": GAP, "layers": {}, "notes": [], "cents": {}}
slots = {}
for li, layer in enumerate(layers):
    parts, at, entries = [], 0.0, []
    for k in keys:
        name = next(f for f in files if f.startswith(f"{k:03d}_") and f.endswith(f"v{layer:02d}.wav"))
        x = read(os.path.join(src, name))
        y = trim(x)
        parts.append(np.zeros((int(GAP * SR), 2), np.float32))
        parts.append(y.astype(np.float32))
        entries.append({"midi": k, "start": round(at + GAP, 4), "dur": round(len(y) / SR, 4), "db": round(float(loudness(x)), 2)})
        at += GAP + len(y) / SR
    parts.append(np.zeros((int(GAP * SR), 2), np.float32))
    pcm = np.concatenate(parts)
    fn = f"noct-v{layer:02d}.mp3"
    subprocess.run(["ffmpeg", "-v", "quiet", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-",
                    "-c:a", "libmp3lame", "-b:a", BITRATE, os.path.join(out, fn)], input=pcm.tobytes(), check=True)
    manifest["layers"][str(layer)] = {"file": fn, "notes": entries}
    print(fn, f"{at:.0f} s", f"{os.path.getsize(os.path.join(out, fn)) / 1e6:.2f} MB", flush=True)

for line in open(tuned_txt):
    m = re.match(r"(\d{3})_\S+\s+([+-]?\d+)", line)
    if m and int(m.group(2)):
        manifest["cents"][str(int(m.group(1)))] = int(m.group(2))
del manifest["notes"]
json.dump(manifest, open(os.path.join(out, "noct.json"), "w"), indent=1)
