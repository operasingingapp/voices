# The practice app's piano

The piano is the **Noct-Salamander Grand Piano V6.2a** of the Accurate-Salamander Project (Chisato Yamauchi, tuning by
Hiroharu Narikawa), built from the **Salamander Grand Piano V3** (Alexander Holm, a Yamaha C5), CC BY 3.0. Noct is the
project's gentlest voicing, meant for accompaniment.

## Rebuilding

1. Get the sources (all public on GitHub):
   - `git clone https://github.com/sfzinstruments/SalamanderGrandPiano sal` (the original recordings, FLAC)
   - `git clone https://github.com/cyamauch/NoctSalamanderGrandPiano noct` (the Noct build: sh, awk and ffmpeg)
2. Convert the originals to the layout the build expects:
   `mkdir -p noct/SalamanderGrandPianoV3_48khz24bit/48khz24bit` and, for each `sal/Samples/*.flac`,
   `ffmpeg -i X.flac -c:a pcm_s24le noct/SalamanderGrandPianoV3_48khz24bit/48khz24bit/X.wav`.
3. In `noct/src`: `make -f Makefile.Noct6.2 vol_factor.txt FFMPEG=$(which ffmpeg)`, then for each recorded key
   (A0, C1, D#1, F#1 … A7, C8) run
   `VERSION5=0 FS_SRC=48000 FFMPEG=$(which ffmpeg) SELECTED_KEY="<key>" sh build.sh make ../SalamanderGrandPianoV3_48khz24bit/48khz24bit ../out 1.0`.
   Keys can run in parallel only in separate copies of `src` (the script writes temporary files there).
   The result is 480 WAV files, `021_A0v01.wav` … `108_C8v16.wav`; the tuning is baked into each file's sample rate.
4. Pack them for the app: `python3 scripts/piano/pack.py noct/out noct/src/tuned_sfz.txt src/standalone/piano`.
   This writes `noct-v01.mp3` … `noct-v16.mp3` (one per loudness layer, the 30 notes one after another, each kept
   until it has died away 48 dB or ten seconds, then faded) and `noct.json` (where each note sits, its level, and the
   small per-key tuning from the tuner's table).

`src/audio/samplerPort.ts` plays them: a middle layer first over the whole keyboard, then the layers each piece uses.
