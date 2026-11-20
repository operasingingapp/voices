# S19 — Die Zauberflöte, No. 8 Finale (Act 1), "Schnelle Füsse, rascher Muth"

Edition Peters vocal score (Kogel, Leipzig, plate 7794), 20 Nov 2026.

- **Printed pages:** 64 (system 1, Andante, after the double bar that ends "Wie stark ist nicht dein Zauberton") – 69 system 3
  (double bar and key change, before the Allegro maestoso "Es lebe Sarastro!"); PDF 68–73
- **Shape:** 124 bars, G major (one sharp) throughout, 4/4 (C) throughout. Bar 1 is a one-beat upbeat (implicit bar; its missing
  three beats are the last bar of S18). Andante bars 1–38, Allegro from bar 39 (Monostatos catches them). No other tempo, key or
  time changes are printed (bars 53–124 continue in the Allegro). Fermatas: bar 100 (whole rests, Monostatos, the slaves and the
  piano) and bar 122 (Pamina, Papageno and the piano, on "-thie").
- **Singers:** P = Pamina (treble clef), G = Papageno (bass clef), N = Monostatos (printed in treble clef, written here at sounding
  pitch an octave lower), K3 = the slaves' tenors and K4 = the slaves' basses ("Sclaven", bars 75–99). From bar 75 Monostatos and the
  tenors share the "Ten." staff (Monostatos = upper notes, tenors = lower notes of the chords; one notehead where they meet); the basses
  have the "Bass" staff. Papageno's panpipe (bars 17–20, "pfeift", printed on his staff in treble clef under 8va) is the piano's third
  right-hand voice, at sounding pitch; Tamino's flute answers ("Tam. antwortet", "Fl.") are in the piano. Papageno's magic bells
  ("Glockenspiel u. Quart.", from beat 3 of bar 67 to bar 99) are in the piano's right hand, printed under 8va, written at sounding pitch.
- **SEGS:** `1/1/4/1/Andante;2/4/4/1/;39/4/4/1/Allegro`
- **SINGERS:** `P:Pamina:Pam.:G/2,G:Papageno:Pap.:F/4,N:Monostatos:Mon.:G/2/-1,K3:Chor Tenor:T.:G/2/-1,K4:Chor Bass:B.:F/4`
- **REPEATS:** none. **PICKUP:** `1 4 4 4` (kit/pickup2.py: bar 1 built in 1/4, made an implicit upbeat bar in 4/4).
- **xfix.txt:** `final` (the final double bar). In the build folder (ext/zf/b19) it is fixes.txt.
- **Process:** two chunks (S19a pp. 64–66, bars 1–52; S19b pp. 67–69, bars 53–124), each read by two independent readers, judged and
  swept for marks, stitched (no shared bars), built, then fresh-checked until clean.
- **Shared bars:** none. S18 ("Wie stark ist nicht dein Zauberton") ends with a 3-beat bar; the missing beat is this section's upbeat
  (bar 1); no syllable carries over. S20 ("Es lebe Sarastro!") starts after the double bar with the key change at the end of p. 69
  system 3; no syllable carries over.

## Checks and fixes
- Judge: 39 sung-line and 78 piano remarks ("# JUDGE"). Sung lines: the slurs over the melismas (bars 7–35), the grace notes in bars 22
  and 27 (small, stemmed, no flag: quarter appoggiaturas), bar 25 "hie-her" F#5, bar 33 Pamina D#5 then E5, bar 34 Pamina's "gè-"
  (printed with a grave accent, Papageno's "ge-" plain), bars 83 and 91 the single notehead G shared by Monostatos and the tenors,
  bar 95 "geseh'n" with the apostrophe, bar 100 Pamina's and Papageno's staves not printed (plain rests), bars 105/121 G# carried to
  the 4th quarter, bar 116 the D major chord. Piano: slurs, ties and staccatos, the between-staff dynamics, the chords in bars 16, 22,
  27, 48, 58–59, the 8va bells in bars 86–96, the cross-staff eighths in bar 106.
- Marks sweep: 34 piano remarks ("# MARKS": the between-staff p, f, sf, sfp, mf and cresc. copied to the left hand; the tie on A4 into
  bar 25; the slur from the grace chord in bar 27).
- Fresh check: three fixes, applied in VM_/PM_ and rebuilt: bar 14 Pamina's "Hol-" was missing under the half note F#5 (the
  syllable now on it); bar 67 RH: no staccato printed (removed); bar 115 Pamina and RH last eighth C#5 (the C# earlier in the bar
  carries; no natural printed). Re-check of the fixed bars: clean.

Final build reproduced from this folder (TMPDIR on /dev/shm): `kit/cleanv.py VM_S19.txt` (gives b19/VM_S19.clean.txt byte for
byte) → `kit/build.sh` with SEGS/SINGERS above and title "Schnelle Füsse, rascher Muth" (gives s19.raw.xml byte for byte) →
`kit/fix64.py` → `kit/clef0fix.py` → `kit/fixtup.py` → `kit/pickup2.py s19.xml 1 4 4 4` (gives s19.xml byte for byte) →
`kit/xfix.py` with xfix.txt gives `S19_Finale_-_Schnelle_Fuesse_rascher_Muth.musicxml` byte for byte (the checked s19f.xml). In one
step: `kit/buildpiece.sh 19 S19 "$SEGS" "Schnelle Füsse, rascher Muth" "$SINGERS" "" "1 4 4 4"`. 0 missing required accidentals;
every bar of every part adds up (barsum: only bar 1, the upbeat, is short, as expected).

## Words
Kept as printed: "Füsse", "Muth", "Wuth", "grösser", "hieher", "Flötenton" (the libretto has "der Flöte Ton"), "kann's", "ist's",
"hab'", "Wart', ich will euch Mores weisen" (the libretto has "wart', man wird euch Mores weisen"), "Sclaven", "lass", "dass",
"klinget", "gehört, noch geseh'n" (the libretto has "gehört und gesehn"), "la la ra" as printed, Pamina's "gè-" in bar 34. Repeats
written out as sung ("sonst erwischen", "nur geschwinde", Papageno's "stille" ×4, "wer viel wagt" ×3, "Mores weisen" ×3, "He! ihr
Sclaven, kommt herbei!" twice; Pamina's "in der besten, besten Harmonie" against Papageno's "in der besten Harmonie"). German only:
the Italian translation, the notes printed only for it (small notes in bars 2, 27, 33–35; the second G in bar 42; the Italian quarters
under Papageno's half note in bar 63; the two eighths on "so" in bar 76), and the stage directions ("eilen herbei", "nach
hinten rufend", "pfeift", "Tam. antwortet", "tritt ihnen entgegen, ihrer spottend", "Sie wollen davoneilen", "Sclaven kommen",
"Papageno spielt auf seinem Glockenspiel", "Die Sclaven tanzen", "Sie entfernen sich singend und tanzend") are left out.

## Tempo
Andante ♩ = 146, Allegro ♩ = 160. Basis: median length of the whole section 191 s (3:11), 149 Andante + 344 Allegro quarters and two
fermatas, from five complete recordings whose track (or tracks) hold exactly this section (from "Schnelle Füsse" to before "Es lebe
Sarastro!"):
  - Norrington, London Classical Players (EMI/Warner; ototoy 255124 and Apple Music Classical 697509977, track 20): 2:51
  - Christie, Les Arts Florissants (Erato, 1995; ototoy 322115, disc 1 track 14): 3:05
  - Böhm, Berlin Philharmonic (DG, 1964; Qobuz 0002894497492, track 16): 3:11
  - Klemperer, Philharmonia (EMI/Warner, 1964; ototoy 336134 and Apple Music Classical 734557407, tracks 11 + 12: 2:35 + 0:40): 3:15
  - Abbado, Mahler Chamber Orchestra (DG, 2005; ototoy 266060, track 15, "e-f"): 3:54
No recording splits the section at the Allegro (bar 39). Three split it elsewhere: Jacobs 2010 (Apple Music Classical 390669944:
scene 16, to Monostatos' entry in bar 37, 1:03, scene 17 to the end 2:24, 3:27 in all), Klemperer (to bar 100 / bars 101–124) and Haitink
1981 (ototoy 128214, tracks 21–23: to bar 74 3:13, bars 75–100 0:43, bars 101–124 0:46, 4:42 in all). From each, the ratio of the
Allegro's beat to the Andante's comes out 1.10 (Jacobs), 0.83 (Klemperer) and 1.95 (Haitink, whose Andante is much slower than the
others); the median 1.1 is used: 149/a + 346/(1.1 a) minutes = 191 s gives a = 145.6 → Andante ♩ = 146, Allegro ♩ = 160 (one extra
beat per fermata). The import gives 190 s at score tempo. Set with `kit/tempomap.py "1:146:Andante;39:160:Allegro"` (no rit./rall.
in the print, no ramps), then `kit/tempodedupe.py` (2 words-only headings dropped, so "Andante" and "Allegro" are printed once).

## Judgement calls and anything doubtful
- Bar 34: Pamina's syllable "gè-" (grave accent) is printed so; kept as the word text ("gèschwinde"), sung and transcribed as "geschwinde".
- Bars 75–99: Monostatos and the tenors share the "Ten." staff; where one notehead is printed (bars 83, 91, 99) both parts have it.
- Bar 100: only the "Ten." / "Bass" staves and the piano are printed (fermatas on the whole rests); Pamina and Papageno rest.
- Bars 105 and 121: the sharp is printed on the 3rd quarter only; the 4th-quarter G is read as G# (carried), as in the piano chord.
- Bar 14 RH: E5 printed as an eighth beamed to a 16th D5 without a visible dot; read as dotted eighth + 16th.
