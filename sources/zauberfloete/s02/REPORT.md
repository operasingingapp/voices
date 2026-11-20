# S02 — Die Zauberflöte, No. 1 Introduction (first part) "Zu Hülfe! zu Hülfe!"

Edition Peters vocal score (Kogel, Leipzig, plate 7794), 20 Nov 2026.

- **Printed pages:** 10 (Act I, "Rauhe Felsengegend", Nr. 1 Introduction) – 15 system 4 (fermata and double bar); PDF 14–19
- **Shape:** 119 bars, Allegro, 4/4 (C), three flats throughout (C minor at the start, E-flat major from the Ladies'
  "Triumph!", ending on D major harmony with the fermata in bar 119, leading into "Ich sollte fort?" in G). Fermatas in bar 42
  (the Ladies' "Macht!" chord and the piano) and bar 119 (on the rest, every staff). No tempo, key or time changes.
- **Singers:** T = Tamino (printed in treble clef, written here at sounding pitch an octave lower), D1 = Erste Dame,
  D2 = Zweite Dame, D3 = Dritte Dame (treble clef). Tamino sings bars 17–40 and faints; the Ladies sing from bar 40. The print
  puts two Ladies on one staff in places ("D 1/2", "D 2/3", "D 2/1"); each Lady has her own line here.
- **SEGS:** `1/4/4/-3/Allegro`
- **SINGERS:** `T:Tamino:Tam.:G/2/-1,D1:Erste Dame:1. D.:G/2,D2:Zweite Dame:2. D.:G/2,D3:Dritte Dame:3. D.:G/2`
- **REPEATS:** none.
- **xfix.txt:** `final` (the final double bar). In the build folder (ext/zf/b02) it is fixes.txt.
- **Process:** two readers per chunk (S02a pp. 10–12, bars 1–62; S02b pp. 13–15, bars 63–119) + judge + marks sweep, stitched,
  built, then fresh checks until clean.
- **Shared bars:** none. The next section S03 "Ich sollte fort?" starts after the double bar at the end of p. 15 (6/8, one
  sharp); no syllable carries over.

## Checks and fixes
- Judge: 50 sung-line and 98 piano remarks ("# JUDGE"). Mostly the notes printed only for the Italian (down-stem eighths and
  sixteenths, split quarters, whole notes beside the German dotted halves) and slurs settled on zoomed crops; pitches settled on
  crops: bar 40 Tamino "mich." C4 (written C5), bar 40 D3 "Stirb," Ab4, bar 69 D1 "und" C5, bars 80 and 95 D3 D natural (no
  flat), bars 81 and 96 D1 "weih'n"/"Mann" Bb4 (no Eb5 head). Bar 49 D1: the stem-up F5 dotted quarter + G5 eighth under a slur
  (melisma on "den-") that both readers had left out. Piano, chunk b bars 26/28/30/43/45 (global 88/90/92/105/107): short slur
  over the first two triplet notes only, staccato on the third.
- Marks sweep: 27 piano remarks (f / p / fp / sf / cresc. between the staves, a grace-note slur in bar 40, a slur fix in bar 86).
- Fresh check: 1 item, confirmed on the print and fixed ("# FIX" in PM_S02.txt): bar 114, no p printed (only the f on beat 4).
  Then clean.

Final build reproduced from this folder (TMPDIR on /dev/shm): `kit/cleanv.py VM_S02.txt` (gives b02/VM_S02.clean.txt byte for
byte) → `kit/build.sh` with SEGS/SINGERS above and title "Zu Hülfe! zu Hülfe!" (gives s02.raw.xml byte for byte) →
`kit/fix64.py` → `kit/clef0fix.py` → `kit/fixtup.py` (gives s02.xml byte for byte) → `kit/xfix.py` with xfix.txt gives
`S02_Introduction_-_Zu_Huelfe_zu_Huelfe.musicxml` byte for byte (the checked s02f.xml). 0 missing required accidentals; every
bar of every part adds up (barsum, 0 problems).

## Words
Kept as printed: "Zu Hülfe! zu Hülfe!" (the libretto has "Hilfe"), "Ungeheu'r!", "Heldenthat!", "ertheilen,", "geseh'n!",
"vor'ge", "Ruh'", "bleib'", "Würd'", "weih'n", "müsst'", "gewiss", "Lasst", "So geht und sagt es ihr", "sein" (not "seyn").
The repeats of the music are written out as sung ("er ist befreit", "durch unsres Armes Tapferkeit" twice, "so müsst' es dieser
Jüngling sein" twice, "die vor'ge Ruh' ihr geben kann" twice, then "Ich bleibe / ich wache / ich schütze" and "ich! ich! ich!").
German only: the Italian translation, the notes printed only for it, and the stage directions ("eilt von einer Schlange
verfolgt herbei", "Die Schlange wird sichtbar", "Er sinkt bewusstlos nieder", "Sie tödten die Schlange", "Tamino betrachtend")
are left out.

## Tempo
Allegro ♩ = 131 (half note ≈ 65). Basis: median length of this section 218 s (3:38), 476 quarters:
  - Haitink, Bavarian Radio SO (EMI, 1981): own track "Zu Hilfe! Zu Hilfe!" 3:34 ("Ich sollte fort?" 3:11)
  - Norrington, London Classical Players (EMI/Warner): own track 3:15 ("Ich sollte fort?" 2:32)
  - Klemperer, Philharmonia (EMI/Warner, 1964): No. 1 track 6:53 × 54.5% ≈ 3:45
  - Böhm, Berliner Philharmoniker (DG, 1964): No. 1 track 6:44 × 54.5% ≈ 3:40
  - Christie, Les Arts Florissants (Erato, 1995): No. 1 track 6:40 × 54.5% ≈ 3:38
54.5% = the mean share of this section in No. 1 in the two recordings that split it (Haitink 52.8%, Norrington 56.2%); the
other sets give No. 1 one track (as for S03, whose 45.5% is the complement). Seen, not used (No. 1 on one track): Sawallisch
6:24, Östman 6:18 (with the dialogue "Wo bin ich?"), Furtwängler (Salzburg live) 6:39. Set with `kit/tempomap.py
"1:131:Allegro"` (no rit./rall. in the print, no ramps), then `kit/tempodedupe.py`; the import gives 218 s at score tempo.

## Judgement calls and anything doubtful
- Throughout the Ladies' music (e.g. bars 41, 44, 46–49, 52–56, 70, 74, 78–79, 81, 84, 87, 91, 93–94, 96–97, 100–102, 117):
  one notehead or chord with two stem directions (German and Italian rhythms). The German rhythm (up stems) is kept.
- Bars 30 and 32, Tamino: a second note under a printed quarter rest serves only the Italian; the German has the rest.
- Bar 89: a half rest printed under the quarter rest belongs to the Italian; ignored.
- Bar 119: the fermata stands on the quarter rest (beat 3) in every staff; the bar ends with two eighth rests.
