# S52 — Die Zauberflöte, No. 21 Finale (Act 2), the duet "Pa-pa-pa-pa-pa-pa-Papagena!" (Papageno and Papagena)

Edition Peters vocal score (Kogel, Leipzig, plate 7794, IMSLP #225460), 26 Nov 2026.

- **Printed pages:** 149 system 1 (after the double bar that ends Papageno's scene with the three Boys, S51: "Nun, Papageno,
  sieh dich um.") – 154 system 5 (the short last bar, fermata and double bar before the change to three flats, Più moderato,
  "Nur stille! stille! stille!", S53)
- **Shape:** 129 bars, Allegro, alla breve (cut C), G major (one sharp) throughout. The piano's introduction (bars 1–8); the two
  stammer each other's names (bars 9–24), "Bist du mir nun ganz ergeben?" and the vows (bars 25–36); "Welche Freude wird das sein"
  and the children (bars 37–59), ritard. from bar 53, a tempo at bar 60; "Erst einen kleinen Papageno" / "Dann eine kleine
  Papagena" and the four calls of the names (bars 60–72, fermata over the half rest of bar 72 in every staff); "Es ist das höchste
  der Gefühle" (bars 73–123: "der Eltern Sorgen werden sein" three times, then the closing round of stammered names); the piano
  alone to the end (bars 124–129). Bar 129 is printed short: a half note and an eighth rest with a fermata (5/8 of the alla-breve
  bar), with no time signature printed. Fermatas: bar 72 (every staff) and bar 129 (piano). No repeats.
- **Singers:** G = Papageno (staff "P", bass clef), H = Papagena (staff "Pa", treble clef). On p. 149 systems 2–3 (bars 9–21)
  the two share one staff with clef changes; from p. 149 system 4 (bar 22) Papagena has the upper staff and Papageno the lower.
  Each singer has their own line here. Both sing bars 9–123.
- **SEGS:** `1/2/2/1/Allegro;129/5/8/1/`
- **SINGERS:** `G:Papageno:Pap.:F/4,H:Papagena:Pa.:G/2`
- **REPEATS:** none. **PICKUP:** none.
- **post.txt:** `kit/hidetime.py s52.xml 129` (after the build, before xfix): bar 129's 5/8 is kept for counting but not printed.
- **xfix.txt:** `final` (the final double bar), `timesym 1 cut` (the printed cut C). In the build folder (ext/zf/b52) it is fixes.txt.
- **Process:** two chunks, S52a (pp. 149–151, bars 1–72, 72 bars) and S52b (pp. 152–154, bars 73–129, 57 bars): for each, two
  independent readers + judge + marks sweep; stitched (no shared bars), built, then a fresh check by two proofreaders (pp. 149–151
  and pp. 152–154): clean.
- **Shared bars:** none. The piece starts after the double bar that ends S51 ("Papagena, Papagena, Papagena!"); no syllable carries
  over. It ends with bar 129, short as printed; "Nur stille!" (S53) follows the double bar.

## Checks and fixes
- Judge: 27 sung-line remarks ("# JUDGE": 16 in S52a, 11 in S52b) and 48 piano remarks (24 + 24), every difference settled on the
  print. Sung lines: bars 50–57 the hyphen printed after "der" in "Kin-der - lein," (the word runs on into the next bar); bar 53
  the German half rest (the quarter rest, eighth rest and eighth below it carry only the Italian "a"); bar 60 "a tempo" over the
  voices; bar 62 Papageno's "no." on G3 (the top space, not above the staff); bar 68 his "no," on A3; bar 70 the German "pa" on the
  stem-down eighth (the up-stem 16ths serve the Italian); bars 78–80 Papagena's whole notes and dotted half on D5 (the fourth line,
  checked at 400 dpi); bar 129 no voice staves printed (rests only, no fermata). Several remarks are "slur marks only": sung slurs
  are not written (the house format has none), ties are. Piano: voices and chords, the between-staff dynamics ("Str.Quart. p" in
  bar 1: the p only), staccatos.
- Marks sweep: 23 piano remarks ("# MARKS": 15 + 8; the between-staff p, f, mfp and cresc. put on both hands, the ritard. of bar
  53, a staccato in bar 99) and 2 sung-line remarks (the ritard. of bar 53 over both voices).
- Before the fresh check, one piano fix from the main check ("# FC-MAIN" in PM_S52.txt, numbered bar 39 of S52b): bar 111 RH, the
  p stands over the second eighth.
- Fresh check (two proofreaders on the stitched build, s52f.xml): clean; no fixes.

Final build reproduced from this folder (TMPDIR in the scratchpad): `kit/cleanv.py VM_S52.txt` (gives b52/VM_S52.clean.txt byte for
byte) → `kit/build.sh` with SEGS/SINGERS above and title "Pa-pa-pa-pa-pa-pa-Papagena!" → `kit/hidetime.py s52.xml 129`
(post.txt; gives b52/s52.xml byte for byte) → `kit/xfix.py` with xfix.txt gives `S52_Finale_-_Pa-pa-pa_Papagena.musicxml` byte for
byte (the checked s52f.xml). 0 missing required accidentals; every bar of every part adds up (barsum: no problems; bar 129 counts
as 5/8). The import takes the score as it is (no change was needed): 129 measures, 2357 notes → 2342 sounding events.

## Words
Kept as printed: "Bist du mir nun ganz ergeben?" and Papagena's "Nun bin ich dir ganz ergeben." (the libretto has "gegeben"),
"unsrer" without an apostrophe, "der Eltern Sorgen werden sein" (the libretto has "Segen"), with "Sor-ge" in the singular where the
print has it (bars 110 and 112, both voices; "Sor-gen" in bars 84, 97, 104 and 114), Papagena's "wenn vie-le, vie-le" (bars 77–80)
and Papageno's "wenn vie-le vie-le" (bars 90–93) without a comma. Bars 34 and 47: "Weibchen," and "schenken," are printed without a
hyphen under two notes and are split at the syllables. The stammered names are kept syllable for syllable as printed (the number of
"pa"s differs from the libretto's "Pa-Pa-Pa-Pa-Pa-Pa-Papagena!"), and each run is one word in language.json: a run that ends in
"-ge-no" or "-ge-na" is written as the name after its stammered start ("Pa-pa-pa-pa-pa-Papagena." for the seven "pa"s and "ge-na."
of bars 23–24), and a run that stops short of the name as the syllables ("Pa-pa-pa,"). Repeats written out as sung. German only:
the Italian translation, the notes printed only for it and the stage directions ("Papageno (sie umtanzend)", "Papagena (ihn
umtanzend)", "Er.", "Sie.", "(ab)") are left out.

## Tempo
Allegro ♩ = 204 (half note = 102), one tempo for the whole duet; the import gives 152 s at score tempo (2:32), before the fermata holds. Basis: five complete recordings whose track holds
exactly this duet (from "Pa-pa-pa" to the double bar; in each listing the next track begins with "Nur stille!"):
  - Klemperer, Philharmonia (EMI/Warner, 1964; Apple Music Classical 734557407, "Duetto: Pa-pa-gena! … Pa-pa-geno!", also ototoy
    336134 disc 12 track 17): 2:49
  - Haitink, Bavarian Radio SO (EMI, 1981; ototoy 128214, disc 3 track 7, "Duetto"): 2:37
  - Christie, Les Arts Florissants (Erato, 1995; ototoy 322115, disc 1 track 42, "Pa - Pa - Pa - Papageno"): 2:33
  - Solti, Wiener Philharmoniker (Decca, 1969; Qobuz 0002894780394, disc 3 track 7, "No. 21, Finale: g (Duet)"): 2:26
  - Nézet-Séguin, Chamber Orchestra of Europe (DG, 2018; ototoy 416914, track 54, between Papageno's scene, track 53, 5:24, and
    "Nur stille", track 55, 1:47): 2:17
Median 2:33 (153 s). Assumed: the ritard. of bar 53 slows to 0.8 of the tempo over two bars (the app's written-out ramp, bars
53–54, then back to tempo; the print's a tempo is at bar 60), and each of the two fermatas (bars 72 and 129) is held one extra
half-note beat. 129 bars = 514.5 quarters; with the ramp (8 quarters taking the time of 9.0) and the fermatas (+4) that is 519.5
quarter-beats in 153 s, ♩ ≈ 203.7: ♩ = 204 gives 152.8 s (2:33). Also seen, not used: Böhm 1964 (Qobuz 0002894796491, track 44,
8:09) and Toscanini 1937 (Apple Music Classical 454908028, 5:22), whose tracks do not hold the duet alone.
Set with `kit/tempomap.py "1:204:Allegro"` (ramp: bar 53 ritard. → bar 54, ×0.8), then `kit/dedupe_tempo.py` (1 words-only
heading removed).

## Judgement calls and anything doubtful
- German only: the notes printed only for the Italian are left out (bars 51–53 the half notes on "lein," split into two quarters
  with extra stems for "lar; a", and in bar 53 the quarter rest, eighth rest and eighth under the German half rest; bars 68–70 the
  extra eighth rest + eighth at the start of each entry and the up-stem 16ths in bar 70).
- The two singers share one staff on p. 149 (bars 9–21, with clef changes); each gets their own line, Papageno in the bass clef and
  Papagena in the treble clef.
- "Sor-ge" (bars 110 and 112) and "Sor-gen" (elsewhere) as printed.
- The half note on "Erst"/"Dann" (bars 60, 62, 64, 66) is slurred to the D of the next bar under a word extender: written as a tie.
- Bar 129 is printed short (5/8, its time signature not printed), as the print has it; the next number begins after the double bar
  with a new key signature.
- Dynamics printed between the piano staves are put on both hands; instrument cue words ("Str.Quart.", "Hörn.") are left out.
