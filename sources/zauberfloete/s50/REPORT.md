# S50 — Die Zauberflöte, No. 21 Finale (Act 2), "Tamino mein! O welch ein Glück!" (the trial by fire and water, to the chorus "Triumph")

Edition Peters vocal score (Kogel, Leipzig, plate 7794, IMSLP #225460), 25 Nov 2026.

- **Printed pages:** 134 system 1 (after the double bar that ends the Armed Men's scene, S49: one flat, 3/4, Andante, Pamina's
  upbeat "Ta-") – 140 system 4 (the final chord and double bar before the change to one sharp and 6/8, "Verwandlung. Garten",
  Papageno's "Papagena, Papagena!")
- **Shape:** 137 bars. Andante, 3/4, F major, bars 1–85: bar 1 a one-beat upbeat (Pamina's "Ta-"); Pamina and Tamino reunited
  (bars 1–17), Pamina's "Ich werde aller Orten" and the story of the flute (bars 17–54), both with the Armed Men, "Wir wandeln
  durch des Tones Macht" (bars 54–76), the piano alone to the fermata on the last rest of bar 85 (double bar, the key signature
  cancelled). "Marsch. Adagio", 4/4 (C), C major, bars 86–113: the march through the fire (bars 86–94, piano alone: "Solo Flöte",
  brass and timpani), Pamina and Tamino's "Wir wandelten durch Feuergluthen" (bars 95–101), the march again through the water
  (bars 102–110), "Ihr Götter, welch ein Augenblick" (bars 111–113). Bar 113 is a 7/8 bar and bar 114 a one-eighth upbeat, as
  printed (the double bar falls inside the printed 4/4 bar; both time signatures hidden). Allegro, 4/4 (C), from bar 114: the
  chorus from within, "Triumph, Triumph, du edles Paar!" (bars 115–132), and the piano postlude to the end (bars 132–137).
  One fermata (bar 85, piano). No repeats.
- **Singers:** P = Pamina, T = Tamino (treble clef, an octave lower), W1 = Erster Geharnischter (treble clef, an octave lower),
  W2 = Zweiter Geharnischter (bass clef), K1–K4 = the chorus from within: Sopran, Alt, Tenor (treble clef, an octave lower), Bass.
  Pamina and Tamino share one staff ("T / Pm") in places on p. 134–135 and have their own staves from bar 49; the Armed Men have
  their own staves (six staves on p. 136); the chorus has four staves on pp. 139–140. Each singer has their own line here. Pamina
  sings bars 1–5, 17–76, 95–101 and 111–113; Tamino bars 5–17, 55–76, 95–101 and 111–113; the Armed Men bars 56–76; the chorus
  bars 115–132.
- **SEGS:** `1/1/4/-1/Andante;2/3/4/-1/;86/4/4/0/Marsch. Adagio;113/7/8/0/;114/1/8/0/Allegro;115/4/4/0/`
- **SINGERS:** `P:Pamina:Pam.:G/2,T:Tamino:Tam.:G/2/-1,W1:Erster Geharnischter:1. G.:G/2/-1,W2:Zweiter Geharnischter:2. G.:F/4,K1:Chor Sopran:S.:G/2,K2:Chor Alt:A.:G/2,K3:Chor Tenor:T.:G/2/-1,K4:Chor Bass:B.:F/4`
- **REPEATS:** none. **PICKUP:** `1 4 3 4` (kit/pickup.py: bar 1 built in 1/4, made an implicit upbeat bar in 3/4).
- **post.txt:** `kit/fix64.py s50.xml s50.xml; kit/hidetime.py s50.xml 113,114,115` (after the build, before xfix): the 64th notes
  stored as 52/53-unit pairs, and the time signatures of bars 113 (7/8), 114 (1/8) and 115 (the 4/4 restated) kept for counting
  but not printed.
- **xfix.txt:** `final` (the final double bar), `timesym 86 common` (the printed C of the march). In the build folder (ext/zf/b50)
  it is fixes.txt.
- **Chorus:** the four chorus parts (P5–P8) have no role, as in "Es lebe Sarastro": they are heard with the piano and have no
  phrases in language.json (so there is no chorus-roles folder).
- **Process:** two chunks, S50a (pp. 134–136, bars 1–69, 69 bars) and S50b (pp. 137–140, bars 70–137, 68 bars): for each, two
  independent readers + judge + marks sweep; stitched (no shared bars), built, then a fresh check by three proofreaders until clean.
- **Shared bars:** none. The piece starts after the double bar that ends S49 ("Der, welcher wandelt"), whose last bar is short so
  that Pamina's upbeat opens this number. It ends with the final chord on p. 140 system 4; Papageno's scene follows the double bar.

## Checks and fixes
- Judge: 122 sung-line remarks ("# JUDGE": 51 in S50a, 71 in S50b) and 112 piano remarks (70 + 42), every difference settled on
  the print. Sung lines: bar 4 Pamina's German "O" on the F5 quarter (the dotted-eighth pair serves the Italian "O qual"); bar 14
  Tamino's "sind" F4; bars 19, 28, 30, 53 Pamina's grace notes (small quarters, no flag); bar 54 "Bahn." G4; bar 55 Tamino's "Wir"
  on beat 3; bars 59 and 68 the ties after "froh" (Tamino, Pamina, First Armed Man) and "froh" under the second eighth pair; bars
  61–62 Tamino's E4, then D4 C4 E4; bar 96 the 16th rests and a stray dot in Tamino's line; bar 99 Pamina's "Feu-er" with a stray
  hyphen after it; bar 121 the Sopran's F5 on "he"; bar 132 the Tenor's C4 on "ein.". Many remarks are "slur marks only": sung
  slurs are not written (the house format has none), ties are. Piano: ties against slurs, voices and chords, clef changes, grace
  notes, the tremolos, the between-staff dynamics.
- Marks sweep: 35 piano remarks ("# MARKS": 14 + 21; slurs and ties as printed, the between-staff p, fp and cresc. put on both
  hands); no sung-line remarks.
- Fresh check (three proofreaders on the stitched build): one fix ("# FC" in PM_S50.txt), applied and rebuilt:
  - bar 15 LH: no staccato (none is printed).
  Re-check of the fixed bar: clean.

Final build reproduced from this folder (TMPDIR in the scratchpad): `kit/cleanv.py VM_S50.txt` (gives b50/VM_S50.clean.txt byte
for byte) → `kit/build.sh` with SEGS/SINGERS above and title "Tamino mein! O welch ein Glück!" → `kit/pickup.py s50.xml 1 4 3 4`
→ `kit/fix64.py s50.xml s50.xml` → `kit/hidetime.py s50.xml 113,114,115` (post.txt; gives b50/s50.xml byte for byte) →
`kit/xfix.py` with xfix.txt gives `S50_Finale_-_Tamino_mein.musicxml` byte for byte (the checked s50f.xml). 0 missing required
accidentals; every bar of every part adds up (barsum: only bar 1, the upbeat, is short, as expected; bars 113 and 114 add up as
7/8 and 1/8). The import takes the score as it is (no change was needed).

## Words
Kept as printed: "Tamino mein! O welch' ein Glück!" and Tamino's "Pamina mein! o welch' ein Glück!" (lower-case "o"), "Noth",
"dräu'n", "aller Orten" in two words (as in Mozart's score; the libretto has "allerorten"), "Ich selber führe dich" (the libretto
has "selbsten"), "streu'n", "Spiel' du die Zauberflöte an", "uns'rer" (the libretto has "unsrer"), "tausendjähr'gen", "Nun komm
und spiel die Flöte an;", the Armed Men's "Ihr wandelt" where Pamina and Tamino sing "Wir wandeln", "Wir wandelten durch
Feuergluthen" (no comma after it), "muthig", "Wasserfluthen", "Ihr Götter, welch ein Augenblick" (no apostrophe on "welch"),
"Isis Glück" (no apostrophe), the chorus's "besieget hast du die Gefahr!" and "der Isis Weihe". Repeats written out as sung:
"Wir wandeln durch des Tones Macht froh durch des Todes düstre Nacht" twice, with "düstre Nacht" three times at the end; "Dein Ton
sei Schutz in Wasserfluthen, so wie er es im Feuer war" twice; the chorus's "Triumph" three times and its "kommt" and "tretet in den
Tempel ein" as each voice sings them. Words printed as one over several notes ("Schreckens-", "Rosen", "Zauber-", "tiefstem",
"tausendjähr'gen", the Armed Men's "wandelt") are split at the syllables. German only: the Italian translation, the notes printed
only for it and the stage directions ("Tamino umarmend", "zeigt nach den Felsenhöhlen", "umarmen sich", "zur Flöte", "Offene
Verwandlung. Tempel, hell erleuchtet.", "Chor (von innen)", "Sarastro führt Tamino und Pamina in den Tempel.") are left out.

## Tempo
Andante ♩ = 74, march (Adagio) ♩ = 40 from bar 86, Allegro ♩ = 113 from bar 114; the import gives 422 s at score tempo (7:02),
before the fermata hold. Basis: five complete recordings whose track(s) hold exactly this scene (from "Tamino mein!" to the end of
the chorus "Triumph"; in each listing the next track begins with Papageno's "Papagena!"):
  - Haitink, Bavarian Radio SO (EMI, 1981; ototoy 128214, disc 3 tracks 3–5): 4:10 ("Tamino mein!") + 2:33 ("Wir wandelten") +
    0:45 ("Triumph! Triumph!") = 7:28
  - Böhm, Berliner Philharmoniker (DG, 1964; Qobuz 0002894796491, track 43, "d-e. Tamino mein, o welch ein Glück – Wir
    wandelten"): 7:03
  - Solti, Wiener Philharmoniker (Decca, 1969; Qobuz 0002894780394, disc 3 tracks 4–5, "Finale: d" and "e"): 3:27 + 3:35 = 7:02
  - Klemperer, Philharmonia (EMI/Warner, 1964; Apple Music Classical 734557407, "Tamino mein! O welch ein Glück!"): 6:59
  - Toscanini, Wiener Philharmoniker (Salzburg 1937; Apple Music Classical 454908028): 6:04
Median 7:02 (422 s), Solti's. Two of the recordings split the scene, and their splits give the three tempos. Solti's tracks
divide at the double bar before the march (bar 86): 207 s for the Andante (253 quarters plus one for the fermata) gives ♩ ≈ 74.
Haitink's divide at the march and at the chorus: the march 111.5 quarters in 153 s (♩ ≈ 44) and the Allegro 92.5 quarters in 45 s
(♩ ≈ 123), so the Allegro's quarter is taken as 2.8 times the march's. Solti's remaining 215 s at that ratio gives march ♩ ≈ 40,
Allegro ♩ ≈ 113: 253 quarters at ♩ = 74 (205 s) + 111.5 at ♩ = 40 (167 s) + 92.5 at ♩ = 113 (49 s) = 421 s, plus the fermata.
Assumed: Solti's track "e" and Haitink's "Wir wandelten" begin with the march at bar 86, not with the singing at bar 95; only that
reading fits Solti's timings (starting at bar 95 would put his Andante at ♩ ≈ 119). Also seen, not used: Jacobs 2010 (Apple Music
Classical 390669944; scene 28 "Pamina, Tamino, Chor", 3:27, but the track before runs from Pamina's "Tamino, halt!" in S49 into
"Tamino mein!") and Sawallisch (ototoy 255142, track 24, 11:49, from "Der, welcher wandert" to the end of the chorus). Set with
`kit/tempomap.py "1:74:Andante;86:40:Marsch. Adagio;114:113:Allegro"` (no rit./rall. in the print, no ramps), then
`kit/dedupe_tempo.py` (3 words-only headings removed).

## Judgement calls and anything doubtful
- German only: the notes printed only for the Italian are left out (bars 3–4 and 7–8 the extra eighths and the dotted pair for
  "O qual"; bars 19–20 the second heads and the small D5; bars 39 and 41–43 the extra stem-down notes; bar 47 the small notes
  around "und").
- The chorus German is printed under only some staves (the Sopran and the Tenor; the Alt and Bass carry the Italian, except where
  they carry their own German, e.g. "Kommt," in bar 122): each voice takes the German of the staff singing the same rhythm (the
  Alt the Sopran's, the Bass the Tenor's, the Tenor the Bass's "Kommt," in bar 122).
- The flute solo of the march ("Solo Flöte") is in the piano part, as printed, with the brass and timpani in the left hand.
- Timpani strokes on one note or chord (the "Pauk." figure, e.g. bar 114 the C2+C3 eighth with two tremolo strokes) are written
  as held notes; the fingered tremolos between two notes or chords (bars 46–47, 99) are kept as tremolos.
- The 64th notes after the trills in the march are stored as 52/53-unit pairs (kit/fix64.py), so each pair fills a 32nd exactly at
  840 divisions per quarter.
- Bars 113–114 are printed as one 4/4 bar divided by the double bar at the Allegro: written as a 7/8 bar and a one-eighth upbeat
  bar, their time signatures hidden.
- Dynamics printed between the piano staves are put on both hands.
- Tamino, the First Armed Man and the chorus tenors are printed in the treble clef and written in the tenor's treble clef (sounding
  an octave lower).
