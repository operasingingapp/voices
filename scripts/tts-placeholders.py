"""
Generates clearly-labelled PLACEHOLDER pronunciation audio for the development fixtures with
eSpeak NG (offline). These are robotic machine renderings, not pronunciation models; the import
script marks them as placeholder-tts / unreviewed and the app labels them as such.

Real recordings (e.g. produced externally with ElevenLabs and reviewed by a diction coach)
replace these files one-for-one; set "kind": "recorded" and "reviewed": true in language.json.

    pip install espeakng-loader   # bundles libespeak-ng + data
    python3 scripts/tts-placeholders.py
"""
import ctypes, json, os, struct, subprocess, sys, tempfile, wave
import espeakng_loader

lib = ctypes.CDLL(espeakng_loader.get_library_path())
data_dir = os.path.dirname(espeakng_loader.get_data_path())
SYNCHRONOUS = 2
rate_hz = lib.espeak_Initialize(SYNCHRONOUS, 0, data_dir.encode(), 0)
if rate_hz <= 0:
    sys.exit("eSpeak NG failed to initialise")

CALLBACK = ctypes.CFUNCTYPE(ctypes.c_int, ctypes.POINTER(ctypes.c_short), ctypes.c_int, ctypes.c_void_p)
buf = bytearray()

@CALLBACK
def on_audio(wav, n, events):
    if n > 0:
        buf.extend(ctypes.string_at(wav, n * 2))
    return 0

lib.espeak_SetSynthCallback(on_audio)
if lib.espeak_SetVoiceByName(b"it") != 0:
    sys.exit("Italian voice not available")
ESPEAK_RATE, ESPEAK_PITCH = 1, 3
CHARS_UTF8 = 1

def synth(text: str, wpm: int, out_mp3: str):
    buf.clear()
    lib.espeak_SetParameter(ESPEAK_RATE, wpm, 0)
    lib.espeak_SetParameter(ESPEAK_PITCH, 55, 0)
    b = text.encode("utf-8") + b"\0"
    lib.espeak_Synth(b, len(b), 0, 1, 0, CHARS_UTF8, None, None)
    lib.espeak_Synchronize()
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        w = wave.open(tmp.name, "wb"); w.setnchannels(1); w.setsampwidth(2); w.setframerate(rate_hz)
        w.writeframes(bytes(buf)); w.close()
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", tmp.name, "-ac", "1", "-ar", "44100",
                        "-codec:a", "libmp3lame", "-b:a", "64k",
                        "-metadata", "comment=PLACEHOLDER eSpeak NG machine speech - not a pronunciation model",
                        out_mp3], check=True)
        os.unlink(tmp.name)
    return len(buf) / 2 / rate_hz

root = os.path.join(os.path.dirname(__file__), "..", "content", "pieces")
for piece in sorted(os.listdir(root)):
    lang_path = os.path.join(root, piece, "language.json")
    if not os.path.exists(lang_path):
        continue
    lang = json.load(open(lang_path, encoding="utf-8"))
    audio_dir = os.path.join(root, piece, "audio")
    os.makedirs(audio_dir, exist_ok=True)
    for ph in lang["phrases"]:
        for speed, wpm in (("normal", 150), ("slow", 90)):
            a = ph.get("audio", {}).get(speed)
            if not a or a.get("kind") != "placeholder-tts":
                continue
            out = os.path.join(audio_dir, a["file"])
            secs = synth(ph["original"], wpm, out)
            print(f"{piece}/{a['file']}: {secs:.1f}s")
