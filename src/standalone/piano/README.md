# Piano samples

The **Noct-Salamander Grand Piano V6.2a** (Accurate-Salamander Project by Chisato Yamauchi, tuned by Hiroharu
Narikawa: <https://www.ir.isas.jaxa.jp/~cyamauch/AccurateSalamander/>), built from the **Salamander Grand Piano V3**
by Alexander Holm (a Yamaha C5, <https://github.com/sfzinstruments/SalamanderGrandPiano>), licensed
[Creative Commons Attribution 3.0](https://creativecommons.org/licenses/by/3.0/).

Changed for this app: every minor third from A0 to C8 at all 16 loudness layers, each note kept until it has died
away 48 dB or ten seconds and then faded, 80 kbps stereo MP3 at 44.1 kHz, one file per layer (`noct-v01.mp3` …
`noct-v16.mp3`) with `noct.json` saying where each note sits. How to rebuild: `scripts/piano/README.md`.
`src/audio/samplerPort.ts` plays them; the credit is shown in the practice screen's About panel.
