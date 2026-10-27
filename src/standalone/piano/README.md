# Piano samples

From the **Salamander Grand Piano V3** by Alexander Holm (a Yamaha C5), licensed
[Creative Commons Attribution 3.0](https://creativecommons.org/licenses/by/3.0/).
Source: <https://github.com/sfzinstruments/SalamanderGrandPiano>, taken via the npm packages
`@audio-samples/piano-mp3-velocity6` and `@audio-samples/piano-mp3-velocity12` (v1.0.5).

Changed for this app: every minor third from A0 to C8 (A, C, D♯, F♯), velocity layers 6 (soft) and 12
(loud) only, each note cut to 9 s with a 2 s fade-out, re-encoded as 80 kbps stereo MP3 at 44.1 kHz.
`src/audio/samplerPort.ts` plays them; the credit is shown in the practice screen's About panel.
