# Instruments for the sung line

**Oboe**, **clarinet** (B♭), **bassoon** and **flute** (with vibrato) from the **University of Iowa Electronic
Music Studios Musical Instrument Samples** (the 1997 sets, played at mf), which "may be downloaded and used for any
projects, without restrictions". Source: <https://theremin.music.uiowa.edu/MIS.html>. Built with
`scripts/instruments/iowa.py`: each chromatic scale cut into notes, every note's pitch checked, a whole-tone set kept.

**English horn** (cor anglais, sustain) from **Sonatina Symphonic Orchestra** by Mattias Westlund, released
under [Creative Commons Sampling Plus 1.0](https://creativecommons.org/licenses/sampling+/1.0/).
Source: <https://github.com/peastman/sso>.

Changed for this app: one loudness layer each. Each note is levelled to the same loudness, cut to
6 s (recordings shorter than that are lengthened by crossfading their steady middle) with a 0.5 s fade,
and re-encoded as 96 kbps MP3. Each Iowa instrument is one file, `<instrument>.kit.mp3`, its notes one
after another in 6.5 s slots; `<instrument>.kit.json` lists them in order with each recording's measured
pitch deviation in cents, which the player corrects. The English horn is one file per note,
`english-horn-<midi>.mp3`, with its tuning in `tuning.json`.
