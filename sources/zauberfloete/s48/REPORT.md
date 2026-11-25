# S48 — Die Zauberflöte, No. 21 Finale (Act 2), first scene "Bald prangt, den Morgen zu verkünden"

Edition Peters vocal score (Kogel, Leipzig, plate 7794, IMSLP #225460), 25 Nov 2026.

- **Printed pages:** 120 system 1 (No. 21 Finale, Andante, the first bar a one-beat upbeat) – 129 system 2 (the double bar before
  the change to alla breve and the Armed Men's Adagio "Der, welcher wandelt diese Strasse")
- **Shape:** 190 bars, E-flat major (three flats) throughout. Bar 1 is a one-beat upbeat (piano alone). Andante, alla breve (cut C),
  bars 1–94; Allegro, 3/4, from bar 95 (double bar). No fermatas, no repeats. The Boys sing bars 11–46, 50–67, 75–76, 84–85,
  94–106, 119–136, 139–146 and 147–183; Pamina bars 46–60, 67–94, 107–117, 135–146 and 147–183; all four together from bar 147
  ("Zwei Herzen"); bars 184–190 are the piano alone.
- **Singers:** B1 = Erster Knabe, B2 = Zweiter Knabe, B3 = Dritter Knabe, P = Pamina (all treble clef). The print shares staves:
  "K 1/2" (First Boy upper notes, Second Boy lower) and "K 3" in most of the piece; "K 1" and "K 2/3" in bars 29–39 (Second Boy upper,
  Third Boy lower); one staff each in bars 40–46; Pamina on the First Boy's staff ("K1 / Pm", "Pm / K1", "K 1/2 / Pm") where she
  enters, and on her own staff ("Pm") elsewhere. Each singer has their own line here.
- **SEGS:** `1/1/4/-3/Andante;2/2/2/-3/;95/3/4/-3/Allegro`
- **SINGERS:** `B1:Erster Knabe:1. K.:G/2,B2:Zweiter Knabe:2. K.:G/2,B3:Dritter Knabe:3. K.:G/2,P:Pamina:Pam.:G/2`
- **REPEATS:** none. **PICKUP:** `1 4 2 2` (kit/pickup.py: bar 1 built in 1/4, made an implicit upbeat bar in 2/2).
- **xfix.txt:** `final` (the final double bar), `timesym 1 cut` (the printed cut C). In the build folder (ext/zf/b48) it is fixes.txt.
- **Process:** three chunks, S48a (pp. 120–122, bars 1–51, 51 bars), S48b (pp. 123–125, bars 52–110, 59 bars) and S48c (pp. 126–129
  system 2, bars 111–190, 80 bars): for each, two independent readers + judge + marks sweep; stitched (no shared bars), built, then
  a fresh check by three proofreaders until clean.
- **Shared bars:** none. The piece starts with No. 21 after Papageno's aria No. 20 ("Ein Mädchen oder Weibchen"); bar 1's upbeat
  is piano alone. It ends at the double bar on p. 129 system 2, before the alla breve Adagio of the Armed Men (S49); no syllable
  carries over (all four singers end with "sie." in bar 183).

## Checks and fixes
- Judge: 57 sung-line remarks ("# JUDGE": 13 in S48a, 23 in S48b, 21 in S48c) and 156 piano remarks (65 + 42 + 49), every
  difference settled on the print. Sung lines: bar 12 the Second Boy's "gen" Bb4 (the third below D5 on the shared stem); bar 14
  the full stop after the Third Boy's "Sonn'." (kept as printed); bar 18 the First and Second Boys' 7th eighths Eb5 over C5; bar 22
  the underlay of "Men-schen Her-zen" on the shared stems; bars 38–39 the First Boy's Db5 tied over the bar line ("wä-re"); bar 47
  Pamina's "bist" on the stem-down quarter Eb5; bar 53 the First Boy's F#5 (the sharp carries); bars 57, 59, 69, 70, 88, 89, 93
  Pamina's heads read on the staff lines; bar 76 the Second Boy's Ab4 (diminished seventh B–D–F–Ab); bar 77 Pamina's A5 tied into
  bar 78; bar 95 the First Boy's Ab5 and the Third Boy's D4; bars 174/178 and 180/182 the crossing voices on "K 1/2" by stem
  direction. Piano: slurs, ties and staccatos as printed, grace notes, the between-staff dynamics, chords and clef changes.
- Marks sweep: 82 piano remarks ("# MARKS": 27 + 27 + 28; slurs and ties as printed, the between-staff p, f, mf, fp, mfp and
  cresc. put on both hands, unprinted slurs removed); no sung-line remarks.
- Fresh check (three proofreaders on the stitched build): three fixes ("# FC" in PM_S48.txt), applied and rebuilt:
  - bar 11 LH: the Bb3 of the first half note is tied to the beat-3 Bb3;
  - bar 60 RH: the p at beat 1.5 (after the first eighth), as on the left hand;
  - bar 70 LH: both whole notes (Bb2 and Bb1) tied into bar 71.
  Re-check of the fixed bars: clean.

Final build reproduced from this folder (TMPDIR on /dev/shm): `kit/cleanv.py VM_S48.txt` (gives b48/VM_S48.clean.txt byte for
byte) → `kit/build.sh` with SEGS/SINGERS above and title "Bald prangt, den Morgen zu verkünden" → `kit/fix64.py` →
`kit/clef0fix.py` → `kit/fixtup.py` → `kit/pickup.py s48.xml 1 4 2 2` (gives s48.xml byte for byte) → `kit/xfix.py` with
xfix.txt gives `S48_Finale_-_Bald_prangt_den_Morgen_zu_verkuenden.musicxml` byte for byte (the checked s48f.xml). 0 missing
required accidentals; every bar of every part adds up (barsum: only bar 1, the upbeat, is short, as expected).

## Words
Kept as printed: "Sonn'" (and "Sonn'." with the print's full stop in the Third Boy's line, bar 14), "gold'ner", "steig'", "kehr'",
"Erd'", "und Sterbliche sind Göttern gleich" (the libretto has "den Göttern"), "Paminen", "Sie kommt" (the libretto has "kömmt"),
"bei Seite" in two words, "nah'", "geh'n", "seh'n", "Welch'", "sieh'", "halt'", "vollend'", "möcht'", "Müh'", "Bräutigam", Pamina's
"Ha! des Jammers Maas ist voll!" (the libretto has "Ja, des Jammers Maß"), "Sieh Pamina stirbt durch dich!" (no comma), "tödte",
"er fühlet Gegenliebe" (the libretto has "fühlte"), the Boys' "vor Gram vergehen" (the libretto has "für Gram"). Repeats written
out as sung: "und Sterbliche sind Göttern gleich" twice; "damit wir, was sie mache, seh'n" twice (First Boy "damit, damit wir",
Third Boy "was sie mache, was sie mache"); Pamina's "bald werden wir vermählet sein", "Mutter, Mutter!" and "ich möcht' ihn
seh'n"; "Komm, wir wollen zu ihm geh'n" three times; "die Götter selbsten schützen sie" (four times for the First and Second
Boys, three for the Third, Pamina partly "die Götter schützen sie") and "schützen sie" at the end. Words printed as one over
several notes ("Himmelreich", "Göttern", "Worte", "Lieber", "schützen" in bar 162) are split at the syllables. German only: the
Italian translation, the notes printed only for it and the stage directions ("stürzt herein mit einem Dolche in der Hand",
"bei Seite", "zu Pamina", "auf den Dolch zeigend", "entreissen ihr den Dolch", "ab") are left out.

## Tempo
Andante ♩ = 102 (half note = 51), Allegro ♩ = 128; the import gives 354 s at score tempo. Basis: five complete recordings whose
track(s) hold exactly this scene (from "Bald prangt" to before "Der, welcher wandelt"; in each listing the next track is the
Armed Men's):
  - Klemperer, Philharmonia (EMI/Warner, 1964; Apple Music Classical 734557407): 6:22
  - Toscanini, Wiener Philharmoniker (Salzburg 1937; Apple Music Classical 454908028): 6:12
  - Haitink, Bavarian Radio SO (EMI, 1981; ototoy 128214, disc 3 track 1): 5:55
  - Christie, Les Arts Florissants (Erato, 1995; ototoy 322115, disc 1 track 37): 5:50
  - Nézet-Séguin, Chamber Orchestra of Europe (DG, live 2018; ototoy 416914, tracks 49–50): 1:38 ("Bald prangt", to Pamina's
    entry) + 3:54 ("Du also bist mein Bräutigam?") = 5:32
Median 5:55 (355 s). No recording found splits the scene at the Allegro, so the ratio comes from Nézet-Séguin's split: bars 1–45
(177 quarters, all Andante) in 98 s is ♩ ≈ 108; at that pace the rest of the Andante (bars 46–94, 196 quarters) takes about 109 s,
leaving 125 s for the Allegro's 288 quarters, ♩ ≈ 138, so the Allegro's quarter is taken as 1.27 times the Andante's (assumed: the
Andante keeps one pace through Pamina's scene). Scaled to 355 s: 373 Andante quarters at ♩ = 102 (219 s) + 288 Allegro quarters at
♩ = 128 (135 s) = 354 s. Also seen, not used: Colin Davis (live, Walhall) 5:47, a live set whose track titles do not match the
scenes cleanly. Set with `kit/tempomap.py "1:102:Andante;95:128:Allegro"` (no rit./rall. in the print, no ramps), then
`kit/dedupe_tempo.py` (2 words-only headings removed).

## Judgement calls and anything doubtful
- German only: the notes printed only for the Italian are left out (small notes or extra stems in bars 47 and 54 Pamina, bar 84
  the Boys' beat 2 and the doubled "willst" chord, bars 88 and 116 Pamina, bars 179 and 181 in every voice).
- Two Boys printed on one staff each get their own line; a note printed once for two Boys (one head on a shared stem, e.g. bar 66
  "uns" Ab4) is given to both.
- Bars 173–175, 180 and 182: the First and Second Boys' voices cross on "K 1/2"; they are assigned by stem direction (up = First
  Boy), which the print engraves differently in bars 180 and 182.
- "dun-kle" (bars 50–51): the print gives the word under two notes with no hyphen; it is split as German hyphenates it.
- Bar 14: "Sonn'." with the print's full stop in the Third Boy's line (probably an engraving slip), kept as printed.
- Single-chord tremolos in the piano are written as held chords.
- Dynamics printed between the piano staves are put on both hands.
