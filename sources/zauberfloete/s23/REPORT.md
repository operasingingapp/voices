# S23 — Die Zauberflöte, No. 9 Marsch der Priester (Act 2)

Edition Peters vocal score (Kogel, Leipzig, plate 7794, IMSLP #225460), 25 Nov 2026.

- **Printed pages:** 80 (systems 1–5: "Act II", Nr. 9 Marsch der Priester, to the final double bar after the Adagio chords);
  PDF 84. The spoken dialogue printed below it (S24) is not transcribed.
- **Shape:** 34 bars, piano only. Andante, alla breve (cut time), F major, bars 1–28, with two repeated sections: bars 1–8
  (backward repeat at the end of bar 8) and bars 9–28 (forward repeat at bar 9, backward repeat at the end of bar 28). Then
  Adagio, alla breve, B-flat major, bars 29–34: "Dreimaliger Accord der Priester in die Hörner" (wind chords), three chords
  (f, a sixteenth upbeat onto a held chord), each followed by a fermata on the half rest (bars 30, 32, 34). 62 bars as played.
- **Singers:** none (instrumental; Sarastro and the priests are on stage). singers.txt is empty.
- **SEGS:** `1/2/2/-1/Andante;29/2/2/-2/Adagio`
- **SINGERS:** (empty)
- **REPEATS:** `fwd:9;back:8:2;back:28:2`
- **xfix.txt:** `final`, `timesym 1 cut`, `timesym 29 cut` (in the build folder ext/zf/b23 it is fixes.txt). The ¢ restated at
  bar 29 was added after xfix with `kit/addtime.py s23f.xml 29 2 2 cut` (post.txt), since the build has no time element there for
  timesym to mark.
- **Process:** two readers (one chunk, p. 80) + judge + marks sweep, built, then a fresh check (clean apart from the bar-29 ¢).
- **Shared bars:** none. The Act 1 finale ends before; the dialogue "Ihr, in dem Weisheitstempel eingeweihten Diener" (S24)
  follows after the final double bar.

## Checks and fixes
- Judge: 11 piano remarks ("# JUDGE"), no sung lines. Settled on the page: the three-voice right hand in bars 4, 6, 14 and 16
  (written as RH1/RH2/RH3 with real durations); bar 7 beat 2 lower chord F4+A4; bar 11 LH two voices (upper Bb3 C4 D4 on ledger
  lines above the bass staff); bar 12 RH tie D4–D4 (inner curve) and slur (outer curve); bar 25 beat 4 voices and the F natural;
  bars 29/31/33 one "f" between the staves, written once.
- Marks sweep: "sotto voce" bar 1 (both hands), sfp bars 22/24/26 (between the staves), f bars 29/31/33.
- Fresh check: clean except the alla-breve sign restated at bar 29 (with the key change), added with kit/addtime.py.

Final build reproduced from this folder (TMPDIR on /dev/shm): `kit/cleanv.py VM_S23.txt` → `kit/build.sh` with SEGS/SINGERS
above → `kit/fix64.py` → `kit/clef0fix.py` → `kit/fixtup.py` → `kit/repeats.py` with REPEATS above → `kit/xfix.py` with
xfix.txt → `kit/addtime.py OUT 29 2 2 cut` gives `S23_Marsch_der_Priester.musicxml` byte for byte (the checked s23f.xml; each
intermediate, VM_S23.clean.txt, s23.raw.xml and s23.xml, also byte for byte). 0 missing required accidentals; every bar adds
up (barsum 0 problems).

## Words
None sung. Kept: "sotto voce" (bar 1). Left out: the stage direction "(Dreimaliger Accord der Priester in die Hörner.)" and the
cue "Bläser" at bar 29 (kept as remarks in PM_S23.txt), the Italian, and the dialogue below the number. The checked file has no
tempo words; the app copy gets "Andante" (bar 1) and "Adagio" (bar 29) with the tempo map.

## Tempo
Andante ♩ = 83 (half note ≈ 41.5), Adagio ♩ = 50. Basis: the March tracks of five complete recordings, all taking both repeats
(56 bars played = 224 quarters; a track of this length without the repeats would mean a half note ≈ 21):
  - Abbado, Mahler Chamber Orchestra (DG, 2005): 2:23
  - Norrington, London Classical Players (EMI/Warner): 2:36
  - Haitink, Bavarian Radio SO (EMI, 1981): 2:42
  - Christie, Les Arts Florissants (Erato, 1995/96): 3:02
  - Klemperer, Philharmonia (EMI/Warner, 1964): 4:07
Median 2:42 (162 s): 224 / 162 × 60 = 83. Böhm (Berlin PO, DG 1964) takes no repeats: 1:23, i.e. half ≈ 40.5 for 56 halves, the
same pace; not in the median. Jacobs 2010 (2:36) agrees. No recording times the threefold chord on its own (sets with dialogue
sound it in the dialogue track), so the Adagio is set at 0.6 × the Andante's beat (as S18's Adagio), ♩ = 50, fermatas held.
Set with `kit/tempomap.py "1:83:Andante;29:50:Adagio"`, then `kit/tempodedupe.py` (nothing to drop). The import gives 62
performed bars, 191 s at score tempo (march 162 s + chords 29 s, before the fermata holds).

## Judgement calls and anything doubtful
- Bars 4, 6, 14, 16 RH: three printed voices, written out as three voices with their real durations.
- Bars 29–34: the "f" printed once between the staves is written once (RH), as the sfp in bars 22/24/26.
- The Adagio's tempo is a proportion, not a measured value (see Tempo).
