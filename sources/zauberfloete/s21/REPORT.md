# S21 — Die Zauberflöte, No. 8 Finale (Act 1), "Herr! ich bin zwar Verbrecherin!"

Edition Peters vocal score (Kogel, Leipzig, plate 7794), 20 Nov 2026.

- **Printed pages:** 71 system 4 bar 3 (Larghetto, after the fermata and double bar that end "Es lebe Sarastro!") – 74 system 1
  bar 1 (Sarastro's "Wirkungskreis zu schreiten.", double bar, before the Allegro "Nun stolzer Jüngling, nur hieher!"); PDF 75–78
- **Shape:** 46 bars, Larghetto, 4/4 (C), F major (one flat) throughout; no tempo, key or time changes inside the section.
  Bars 45–46 are Sarastro's recitative ("Recit.", fermata on the first note of each bar; the piano "colla parte").
- **Singers:** P = Pamina (treble clef), S = Sarastro (bass clef). No chorus. Pamina sings bars 2–12, 31–34 and 37–41; Sarastro
  bars 12–31, 34–37 and 41–46.
- **SEGS:** `1/4/4/-1/Larghetto`
- **SINGERS:** `P:Pamina:Pam.:G/2,S:Sarastro:Sar.:F/4`
- **REPEATS:** none.
- **xfix.txt:** `final` (the final double bar). In the build folder (ext/zf/b21) it is fixes.txt.
- **Process:** one chunk (S21, pp. 71–74): two independent readers + judge + marks sweep, built, then a fresh check until clean.
- **Shared bars:** none. S20 ends at the fermata and double bar on p. 71 system 4 bar 2; S22 (S22a) starts after the double bar
  on p. 74 system 1 (Allegro, alla breve). No syllable carries over at either end.

## Checks and fixes
- Judge: 22 sung-line and 42 piano remarks ("# JUDGE"), every difference settled on 400-dpi crops. Sung lines: many
  bare-letter vs explicit naturals (same pitch, spelling only); carried accidentals in bars 9, 20, 32 and 36 (Sarastro's "ich" in
  bar 36 is F#3); the German rhythm separated from the Italian-only notes in bars 11, 23, 26, 28, 36, 41, 45 and 46; Pamina's
  "klingt" placed under the D5 of bar 38 (bar 37 "Mir" is a slurred melisma); the recitative bars 45–46 read to add up exactly
  (Ab3 dotted eighth with fermata on "Wir-" in bar 46). Piano: chords on p. 73 checked by pixel profile (bars 17, 40, 41), the
  second voice ("Fl.", "H.Bl." cues) in bars 16, 18 and 37, slurs vs ties in bars 34–36, dynamics printed between the staves
  kept on both staves.
- Marks sweep: 1 sung-line remark ("Recit." in bar 45) and 8 piano remarks (p in bar 3, the long slurs in bars 16 and 18, the
  slurs across bars 35–36, "colla parte" in bar 45).
- Fresh check: one finding, fixed ("# FIX" bar 36 RH: no staccato on the first chord; the dots are its dotting dots); re-check
  clean.

Final build reproduced from this folder (TMPDIR on /dev/shm): `kit/cleanv.py VM_S21.txt` (gives b21/VM_S21.clean.txt byte for
byte) → `kit/build.sh` with SEGS/SINGERS above and title "Herr! ich bin zwar Verbrecherin!" (gives s21.raw.xml byte for byte)
→ `kit/fix64.py` → `kit/clef0fix.py` → `kit/fixtup.py` (gives s21.xml byte for byte) → `kit/xfix.py` with xfix.txt gives
`S21_Finale_-_Herr_ich_bin_zwar_Verbrecherin.musicxml` byte for byte (the checked s21f.xml). 0 missing required accidentals;
every bar of every part adds up (barsum, 0 problems).

## Words
Kept as printed: "Herr! ich bin zwar Verbrecherin!", "entflieh'n.", "Allein die Schuld liegt nicht an mir." (the libretto has
"ist nicht an mir"), "Steh' auf, erheit're dich, o Liebe!", "weiss", "einen Andern sehr" (twice), "geb'", "Mich rufet ja die
Kindespflicht,", "denn meine Mutter" (no dash: Sarastro cuts in), "liesse.", "Mir klingt der Muttername süsse!" (the libretto
has "der Mutter Namen"), "Sie ist es, sie ist es", "muss". Sarastro's repeat "zur Liebe will ich dich nicht zwingen, doch, doch
geb' ich dir die Freiheit nicht." (bars 26–31) is written out as sung. Bar 26: the print has "zúr" with an acute-like mark on
the syllable, a slip; written "zur" (the judge read it as a stray mark, not an accent on the note). German only: the Italian
translation, the notes printed only for it (bars 11, 23, 26, 28, 36, 41, 45, 46) and the stage directions are left out.

## Tempo
Larghetto ♩ = 67. Basis: median length of this section 165 s (2:45), 184 quarters, from four complete recordings whose track
holds exactly this section (from "Herr! ich bin zwar Verbrecherin!" to before "Nun stolzer Jüngling"):
  - Norrington, London Classical Players (EMI/Warner; Apple Music Classical 697509977): 2:16
  - Nézet-Séguin, Chamber Orchestra of Europe (DG, live 2018; Qobuz mwvxw92vhjn0b, disc 1 track 22; Apple Music song 1468271900): 2:43
  - Christie, Les Arts Florissants (Erato, 1995; ototoy 322115, disc 1 track 16): 2:47
  - Haitink, Bavarian Radio SO (EMI, 1981; ototoy 128214, disc 1 track 25; MusicBrainz via notebeast): 3:15
Median (2:43 + 2:47) / 2 = 2:45 → 184 / 165 × 60 = 66.9. Each listing's next track is "Nun/Na, stolzer Jüngling". Set with
`kit/tempomap.py "1:67:Larghetto"` (no rit./rall. in the print, no ramps), then `kit/tempodedupe.py`; the import gives 165 s
at score tempo. Track times include a little silence and the held recitative fermatas.

## Judgement calls and anything doubtful
- Bar 41, Sarastro: the German "Und ein stolzes" is the four stem-down eighths on beats 3–4; the print's German voice has only a
  quarter rest and an eighth rest before them (an eighth short of the bar), written here as two quarter rests. The stem-up
  dotted eighth and 16ths are the Italian.
- Bars 45–46 (recitative): written in strict time as printed (fermatas on the first notes); the small 16ths serve the Italian.
- Bar 11, Pamina: "Herr!" is the stem-up half note; the two stem-down quarters serve the Italian.
- Bar 16 piano: the separate stem-up G5 quarter stands over beat 4 (RH2), as the judge read it.
