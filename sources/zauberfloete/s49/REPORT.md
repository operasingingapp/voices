# S49 — Die Zauberflöte, No. 21 Finale (Act 2), the Armed Men's scene "Der, welcher wandelt diese Strasse voll Beschwerden"

Edition Peters vocal score (Kogel, Leipzig, plate 7794, IMSLP #225460), 25 Nov 2026.

- **Printed pages:** 129 system 3 (the change to alla breve, Adagio, after the double bar that ends "Bald prangt", S48) – 133 (the
  double bar before the change to one flat and 3/4, the Andante of Pamina's "Tamino mein!")
- **Shape:** 88 bars, three flats throughout. Adagio, alla breve (cut C), bars 1–59, C minor: the piano's fugal introduction
  (bars 1–16), the Armed Men's chorale in octaves over the fugal accompaniment (bars 17–48; the tune is the Lutheran chorale
  "Ach Gott, vom Himmel sieh' darein"), Tamino's "Mich schreckt kein Tod" (bars 50–58), Pamina's "Tamino halt!" from within (bars
  58–60). Allegretto, alla breve, from bar 60 (no new time or key signature printed), opening in D-flat and settling in A-flat major
  (the Armed Men and Tamino end on A-flat in bar 85; in bars 85–88 the piano alone turns towards F). Bar 88 has three beats as
  printed (its fourth beat is Pamina's upbeat in the next number); its 3/4 is not printed. Fermatas: bar 79 (all three men on
  "scheut,") and bar 88 (the last rest, every staff). No repeats.
- **Singers:** W1 = Erster Geharnischter ("Tenor", the upper stems), W2 = Zweiter Geharnischter ("Bass", the lower stems), both on
  one bass-clef staff; T = Tamino, who enters in bar 50 on that same staff in treble clef (tenor, an octave lower); P = Pamina, on a
  staff "T / Pm" shared with Tamino in bars 56–59 and labelled "Pam." in bar 60. Each singer has their own line here. The Armed Men
  sing bars 17–48 and 61–85, Tamino bars 50–58 and 60–85, Pamina bars 58–60.
- **SEGS:** `1/2/2/-3/Adagio;60/2/2/-3/Allegretto;88/3/4/-3/`
- **SINGERS:** `W1:Erster Geharnischter:1. G.:F/4,W2:Zweiter Geharnischter:2. G.:F/4,T:Tamino:Tam.:G/2/-1,P:Pamina:Pam.:G/2`
- **REPEATS:** none. **PICKUP:** none.
- **post.txt:** `kit/hidetime.py s49.xml 88` (after the build, before xfix): bar 88's 3/4 is kept for counting but not printed.
- **xfix.txt:** `final` (the final double bar), `timesym 1 cut` (the printed cut C). In the build folder (ext/zf/b49) it is fixes.txt.
- **Process:** one chunk, S49 (pp. 129 system 3 – 133, 88 bars): two independent readers + judge + marks sweep; built, then a
  fresh check by two proofreaders until clean.
- **Shared bars:** none. The piece starts after the double bar on p. 129 system 2 that ends S48 ("Bald prangt"); no syllable carries
  over. It ends with bar 88, short as printed; Pamina's upbeat to "Tamino mein!" belongs to the next number.

## Checks and fixes
- Judge: 15 sung-line remarks ("# JUDGE") and 76 piano remarks, every difference settled on the print. Sung lines: bar 48 the two
  whole notes C4 (First Armed Man, on a ledger line) and C3 (Second); bar 53 Tamino's "gend" on B-flat; bar 65 the First Armed Man's
  syllables placed by the Second's eighths (the words are printed once, under the lower voice); bars 69, 71, 75, 77, 78, 79, 81, 82
  the heads of the two men on the shared staff (by stem direction and staff position); bar 88 Pamina's rests grouped as printed.
  Piano: voices and chords, clef changes, the accidentals that carry, the tremolos, the between-staff dynamics.
- Marks sweep: 108 piano remarks ("# MARKS": slurs, staccatos, and the between-staff f, p and fp put on both hands) and one sung-line
  remark (bar 88 Pamina's fermata, printed on the shared T/Pm staff).
- Fresh check (two proofreaders on the build): fixes ("# FC" in VM_S49.txt and PM_S49.txt), applied and rebuilt:
  - bars 47–48 LH: staccato on the last two eighths of bar 47 too; no staccato on the B-flat4 of bar 48;
  - bars 70–71: no staccato printed on the bar-70 chords (both hands); staccato on the beat-4 chord of bar 71 (RH);
  - bar 82 W2: C3 on "ist" (the head in the C space, the stem shared with the First Armed Man);
  - bars 75 and 77 W1: beat 4 D-flat4 as printed (the flat earlier in the bar holds and no natural is printed; E-flat 7 harmony).
  Re-check of the fixed bars: clean.

Final build reproduced from this folder (TMPDIR on /dev/shm): `kit/cleanv.py VM_S49.txt` (gives b49/VM_S49.clean.txt byte for
byte) → `kit/build.sh` with SEGS/SINGERS above and title "Der, welcher wandelt diese Strasse voll Beschwerden" → `kit/fix64.py` →
`kit/clef0fix.py` → `kit/fixtup.py` → `kit/hidetime.py s49.xml 88` (post.txt) → `kit/xfix.py` with xfix.txt gives
`S49_Finale_-_Der_welcher_wandelt.musicxml` byte for byte (the checked s49f.xml). 0 missing required accidentals; every bar of
every part adds up (barsum: no problems; bar 88 counts as 3/4). The import takes the score as it is (no change was needed).

## Words
Kept as printed: "Der, welcher wandelt" (the libretto has "wandert"), "Strasse", "Beschwerde," and "Erde." (the libretto has
"Beschwerden" and "Erden"), "schwingt er sich von der Erde" (the libretto has "aus der Erde"), "himmel an;" in two words, "im
Stande", "weih'n", Tamino's "fort zu wandeln" in three words (the libretto has "fortzuwandeln"), "schliesst", Pamina's "Tamino halt!
ich muss dich seh'n." (no comma after "Tamino"), "hör'", "geh'n", "wär'", "Welch'", "wiederseh'n", the Armed Men's "Dir ist erlaubt"
(the libretto has "Es ist erlaubt") and "wenn wir euch wiederseh'n" (Tamino "uns"). Repeats written out as sung: "wenn auch der Tod
beschieden wär'" and "ist würdig und wird eingeweiht" twice. Words printed as one over several notes are split at the syllables.
German only: the Italian translation, the notes printed only for it and the stage directions ("Verwandlung. Felsenhöhlen …",
"Zwei geharnischte Männer", "Tamino (wird von den beiden Priestern hereingeführt)", "von innen", "Die beiden Priester gehen ab",
"Die beiden Priester kommen mit Pamina") are left out.

## Tempo
Adagio ♩ = 57, Allegretto ♩ = 114 (half note = 57); the import gives 309 s at score tempo (5:09), before the fermata holds. Basis:
five complete recordings whose track holds exactly this scene (from "Der, welcher wandelt" to before "Tamino mein!"; in each listing
the next track begins with "Tamino mein!"):
  - Böhm, Berliner Philharmoniker (DG, 1964; Qobuz 0002894796491, track 42, "No. 21, Finale: c. Chorale Prelude"): 5:24
  - Klemperer, Philharmonia (EMI/Warner, 1964; Apple Music Classical 734557407, also ototoy 336134 disc 12 track 14): 5:14
  - Solti, Wiener Philharmoniker (Decca, 1969; Qobuz 0002894780394, disc 3 track 3, "c. Chorale Prelude"): 5:11
  - Haitink, Bavarian Radio SO (EMI, 1981; ototoy 128214, disc 3 track 2): 5:08
  - Toscanini, Wiener Philharmoniker (Salzburg 1937; Apple Music Classical 454908028): 4:25
Median 5:11 (311 s). No recording found splits the scene at the Allegretto, so the ratio is assumed: the Allegretto's quarter is
twice the Adagio's (the Adagio's quarter becomes the Allegretto's half note, both being alla breve), with one extra beat for each of
the two fermatas. 236 Adagio quarters + (115 + 2) Allegretto quarters at twice the speed = 294.5 Adagio quarters in 311 s gives
♩ ≈ 56.8: 236 quarters at ♩ = 57 (248 s) + 117 at ♩ = 114 (62 s) = 310 s. Two recordings split the scene elsewhere, at Pamina's
"Tamino, halt!" (bar 58), and bracket that Adagio pace: Jacobs 2010 (Apple Music Classical 390669944, scene 28 "Zwei Männer,
Tamino") 4:16 for bars 1–58, ♩ ≈ 54, and Christie 1995 (ototoy 322115, disc 1 track 38) 3:15, ♩ ≈ 71; their next tracks run on into
"Tamino mein!", so they are not used. Also seen, not used: Nézet-Séguin 2018 (ototoy 416914, track 51, 7:53), Abbado 2005 (Qobuz
0002894775789, disc 2 track 19, 10:57) and Sawallisch (ototoy 255142, track 24, 11:49), whose tracks run on past "Tamino mein!".
Set with `kit/tempomap.py "1:57:Adagio;60:114:Allegretto"` (no rit./rall. in the print, no ramps), then `kit/dedupe_tempo.py`
(2 words-only headings removed).

## Judgement calls and anything doubtful
- German only: the notes printed only for the Italian are left out (bar 61 the small F5 eighths over Tamino's dotted F; bar 62 the
  extra flagged note over the Armed Men's eighth rest; bars 81 and 84 the extra stems and flags on beat 3 in Tamino's and the Armed
  Men's lines).
- The two Armed Men printed on one bass-clef staff each get their own line; the upper stems ("Tenor") are the First, the lower
  ("Bass") the Second. A note printed once for both (one head with two stems, e.g. bar 63 "Stim-" D-flat4, bar 68 "wär'," A-flat3,
  bar 73 "chen." E-flat3, bar 79 "und" B-flat3) is given to both.
- Tamino enters on that staff in treble clef (bar 50) and is written in the tenor's treble clef (sounding an octave lower).
- Bar 65: the words are printed once, under the Second Armed Man; the First's syllables are placed by the Second's eighths (the
  slurs over his last two pairs read as slurs for the Italian text). Bar 67: the two men's notes are told apart by the stems. Both
  are marked unsure in VM_S49.txt.
- Single-chord tremolos in the piano (bars 28–29, LH) are written as held notes.
- Dynamics printed between the piano staves are put on both hands.
- Bar 88 is printed short (three beats, with no time signature), as the print has it; the following number opens with Pamina's
  upbeat.
