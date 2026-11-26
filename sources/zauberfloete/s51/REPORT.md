# S51 — Die Zauberflöte, No. 21 Finale (Act 2), Papageno's scene "Papagena, Papagena, Papagena!"

Edition Peters vocal score (Kogel, Leipzig, plate 7794, IMSLP #225460), 26 Nov 2026.

- **Printed pages:** 141 system 1 ("Verwandlung. Garten.", Allegro, 6/8, the first bar a two-eighth upbeat) – 148 system 5 (the
  double bar after the Boys' "sieh dich um.", before the change to one sharp and the duet "Pa-pa-pa-pa-pa-pa-Papagena!")
- **Shape:** 204 bars. Bar 1 is a 2/8 upbeat (piano alone). Allegro, 6/8, G major (one sharp), bars 1–121; Andante, 6/8, from
  bar 122 (printed after the panpipe note); Allegretto, alla breve (cut C), C major, from bar 132 (double bar, the Boys' entrance);
  Allegro, alla breve, from bar 165 (double bar; the time signature is restated there, as printed). Fermatas: bar 52 (Papageno's
  "chen!" and the piano), bars 119–122 (the rests round the panpipe calls, where Papageno speaks "Eins", "zwei", "drei") and bar
  204 (every staff). No repeats. Papageno sings bars 14–132, 139–161 and 173–202; the Boys bars 132–139, 147–150 and 202–204;
  bars 162–172 are the piano alone (the glockenspiel from bar 165).
- **Singers:** G = Papageno (bass clef); B1 = Erster Knabe, B2 = Zweiter Knabe, B3 = Dritter Knabe (treble clef). The Boys have a
  staff each in bars 132–135 ("K 1", "K 2", "K 3"); the print puts the First and Second Boys on one staff ("K 1/2", First Boy the
  upper notes) in bars 136–139 and 147–150 (there labelled "1. u. 2. Knabe") and at the end (bars 202–204). Each singer has their
  own line here.
- **SEGS:** `1/2/8/1/Allegro;2/6/8/1/;122/6/8/1/Andante;132/2/2/0/Allegretto;165/2/2/0/Allegro`
- **SINGERS:** `G:Papageno:Pap.:F/4,B1:Erster Knabe:1. K.:G/2,B2:Zweiter Knabe:2. K.:G/2,B3:Dritter Knabe:3. K.:G/2`
- **REPEATS:** none. **PICKUP:** `2 8 6 8` (kit/pickup.py: bar 1 built in 2/8, made an implicit upbeat bar in 6/8).
- **xfix.txt:** `final` (the final double bar), `timesym 132 cut` (the printed cut C). In the build folder (ext/zf/b51) it is
  fixes.txt.
- **post.txt:** `kit/addtime.py s51f.xml 165 2 2 cut` (after xfix): the alla breve restated at bar 165, as printed.
- **Process:** two chunks, S51a (pp. 141–144, bars 1–106, 106 bars) and S51b (pp. 145–148, bars 107–204, 98 bars): for each, two
  independent readers + judge + marks sweep; stitched (no shared bars), built, then a fresh check by two proofreaders (one for
  pp. 141–144, one for pp. 145–148): clean, no fixes.
- **Shared bars:** none. The piece starts after the double bar that ends the chorus "Triumph! Triumph! du edles Paar!" (S50); bar
  1's upbeat is piano alone. It ends with the double bar on p. 148 system 5; the duet "Pa-pa-pa-pa-pa-pa-Papagena!" begins the
  next number, and no syllable carries over (the Boys end with "um." in bar 204).

## Checks and fixes
- Judge: 14 sung-line remarks ("# JUDGE": 7 in S51a, 7 in S51b) and 159 piano remarks (81 + 78), every difference settled on the
  print. Sung lines: bar 4 Papageno's rests kept by beat as printed; bar 30 "plau-der-te" on A3 (the top line); bar 31 "und" on C4
  (sharing its head with an Italian-only stem) and "war" D4; bar 32 "schlecht" B3; bar 50 "weib-" an eighth (printed without a
  flag; only an eighth fits); bars 58 and 104 the dotted D3 tied to the next D3 (melisma, no new syllable); bar 137 the Third
  Boy's "man lebt nur" on A4; bar 177 the lower-case "klinget"; bars 180, 192, 196 and 198 "her;" with the printed semicolon;
  bar 202 one C5 head with two stems, shared by the First and Second Boys. Piano: voices and chords, the panpipe's rests and
  slurs, clef changes, the trills' after-notes, the glockenspiel's 8va lines, the between-staff dynamics.
- Marks sweep: 37 piano remarks ("# MARKS": 25 + 12; slurs, staccatos, and the between-staff p, f, fp and cresc. put on both
  hands); no sung-line remarks.
- Fresh check (two proofreaders on the stitched build, one per chunk): clean; no fixes.

Final build reproduced from this folder (TMPDIR on /dev/shm): `kit/cleanv.py VM_S51.txt` (gives b51/VM_S51.clean.txt byte for
byte) → `kit/build.sh` with SEGS/SINGERS above and title "Papagena, Papagena, Papagena!" → `kit/pickup.py s51.xml 2 8 6 8` (gives
b51/s51.xml byte for byte) → `kit/xfix.py` with xfix.txt → `kit/addtime.py s51f.xml 165 2 2 cut` (post.txt) gives
`S51_Finale_-_Papagena_Papagena_Papagena.musicxml` byte for byte (the checked s51f.xml). 0 missing required accidentals; every
bar of every part adds up (barsum: only bar 1, the upbeat, is short, as expected). The import takes the score as it is (no change
was needed).

## Words
Kept as printed: "Weibchen! Täubchen, meine Schöne!", "ich plauderte, plauderte," (the libretto has it once), "schlecht und drum
geschieht es mir schon recht" (the libretto has "darum"), "Herzenskämmerlein" in one word, "'s ist umsonst" (the two words under
one note, written 's‿ist), "Lieb'", "End'", "wenn's", "brennt's", "mis-fällt" (divided so, with one s: the word is kept as
"misfällt"), "zuschnüren" in one word, "ist's", "eh'", "wohl so lass ich's diesmal sein" (no comma), "Rufet nur: ja oder nein",
"alles, alles stille!", "Papageno frisch hinauf" (no comma the second time), "Nun, ich warte noch, es sei! Ich warte noch, nun! es
sei,", "gute Nacht, du falsche! Welt!" the second time (with the print's exclamation mark after "falsche"), the Boys' "Halt' ein!"
and "O Papageno und sei klug" (no comma), "doch brennt' es euch", "geh'n", "vergass", "Erklinge Glockenspiel" (no comma), "seh'n",
"Klinget, Glöckchen, klinget!" (lower case after the first), "her;" with the semicolon (bars 180, 192, 196, 198). Repeats written
out as sung. Words printed as one over several notes are split at the syllables. German only: the Italian translation, the notes
printed only for it and the stage directions ("Verwandlung. Garten.", "mit einem Strick umgürtet", "pfeift", "nimmt den Strick",
"sieht sich um", "Die drei Knaben eilen herbei", "spielt das Glockenspiel", "Die 3 Knaben holen Papagena") are left out. The spoken
"Eins", "zwei", "drei" between the panpipe calls (bars 119–122) have no notes and are left out.

## Tempo
Allegro ♩ = 120 (♩. = 80), Andante ♩ = 60 (♩. = 40), Allegretto ♩ = 160 (half note = 80), Allegro ♩ = 192 (half note = 96); the
import gives 310 s at score tempo (5:10), before the fermata holds. Basis: five complete recordings whose track holds exactly this
scene (from "Papagena, Papagena, Papagena!" to before the duet; in each listing the next track begins with "Pa-pa-pa…"):
  - Klemperer, Philharmonia (EMI/Warner, 1964; Apple Music Classical 734557407, "Papagena! Papagena! Papagena!"): 5:36
  - Nézet-Séguin, Chamber Orchestra of Europe (DG, live 2018; ototoy 416914, track 53): 5:24
  - Toscanini, Wiener Philharmoniker (Salzburg 1937; Apple Music Classical 454908028, "Papagena! Weibchen! Täubchen!"): 5:22
  - Christie, Les Arts Florissants (Erato, 1995; ototoy 322115, disc 1 track 41): 5:12
  - Solti, Wiener Philharmoniker (Decca, 1969; Qobuz 0002894780394, disc 3 track 6, "No. 21, Finale: f"): 5:10
Median 5:22 (322 s). No recording found splits the scene, so the ratios are assumed: the Andante's beat half the Allegro's
(♩ = ♩ / 2), the Allegretto's half note equal to the Allegro's dotted quarter, and the closing Allegro a fifth faster than the
Allegretto (half note × 1.2). Fermatas held: one beat each in bars 52 and 204, one bar each in bars 119–122 (Papageno's spoken
count). 361 Allegro quarters (+ 10.5 held) at ♩ = 120 (186 s) + 30 Andante quarters (+ 3 held) at ♩ = 60 (33 s) + 132 Allegretto
quarters at ♩ = 160 (50 s) + 160 Allegro quarters (+ 2 held) at ♩ = 192 (51 s) = 319 s, against the median 322 s (the exact fit,
♩ ≈ 119, rounded to 120). Also seen, not used: Haitink 1981 (ototoy 128214, disc 3 track 6, 8:18), whose track title runs on
into the duet "Pa-pa-gena! Pa-pa-geno!", which follows again as track 7. Set with
`kit/tempomap.py "1:120:Allegro;122:60:Andante;132:160:Allegretto;165:192:Allegro"` (no rit./rall. in the print, no ramps), then
`kit/dedupe_tempo.py` (4 words-only headings removed).

## Judgement calls and anything doubtful
- German only: the notes printed only for the Italian are left out (bar 24 the extra stem-up note and the last eighth; bar 25 the
  flagged eighths round "Ach!"; bar 30 the stem-up A3; bar 31 the stem-up C4 quarter; bar 34 the stem-up flagged notes; bars
  46–47 the small flagged stems; bars 91 and 93 the small stem-up notes on "nur:"; bar 198 the two stem-up C4 quarters; bar 199 the
  half rest above the staff).
- Papageno's panpipe, printed on his staff (treble clef, 8va, "pfeift") in bars 4–6, 18–20 and 119–122, is written in the piano part
  as a third right-hand voice at sounding pitch, where his sung line rests.
- The spoken "Eins", "zwei", "drei" (bars 119–122) have no notes and are left out.
- The glockenspiel ("Glock. Sp.", "Gl.Sp.", from bar 165) is printed in the piano staves and is written there, its 8va lines
  written out at sounding pitch. The instrument cues ("Fl. Ob. 8va" in bar 91, "Tutti", "Bläs.") are not written as 8va lines.
- Trill endings (the two small after-notes, e.g. bars 7 and 107 LH) are written as grace notes at the end of the bar.
- The two Boys printed on one staff ("K 1/2") each get their own line; a note printed once for both (one head with two stems, e.g.
  bar 139 "nug." C5, bar 202 "Nun, Pa-pa-" C5) is given to both.
- Dynamics printed between the piano staves are put on both hands.
- Bar 50: Papageno's "weib-" is printed with no flag; read as an eighth (the only value that fits). Bar 131: "falsche!" with the
  print's exclamation mark before the final "Welt!" (bar 132) is kept as printed.
