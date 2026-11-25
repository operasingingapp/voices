# S22 — Die Zauberflöte, No. 8 Finale (Act 1), "Nun stolzer Jüngling, nur hieher!"

Edition Peters vocal score (Kogel, Leipzig, plate 7794), 25 Nov 2026.

- **Printed pages:** 74 system 1 from its 2nd bar (Allegro, after the double bar that ends "Herr! ich bin zwar Verbrecherin!") –
  79 system 5 (final double bar, "Ende des ersten Acts"); PDF 78–83
- **Shape:** 146 bars, alla breve (cut C) throughout. Bars 1–71 Allegro, F major (one flat); bars 72–77 Sarastro's recitative
  ("Recit." over the piano in bar 72; "Adagio." before "sie müssen" and "a tempo" before "erst" in bar 76; fermata on the last
  rest of bar 77, double bar); bars 78–146 Presto, C major (the flat cancelled), the closing chorus to bar 132 and the piano
  alone in bars 133–146.
- **Singers:** N = Monostatos (treble clef printed an octave high, written at sounding pitch), P = Pamina, T = Tamino (as N),
  S = Sarastro (bass clef), K1–K4 = chorus sopranos, altos, tenors, basses. Monostatos sings bars 3–7, 22–45, 51–53, 57–60;
  Pamina bars 7–21; Tamino bars 8–21 (bar 21 "Beide": one note on the shared staff); Sarastro bars 45–62 and 72–77; the chorus
  bars 21–22 ("Was soll das heissen?", in unison on one treble staff, tenors and basses written an octave lower), 62–70 ("Es
  lebe Sarastro", sotto voce, two staves) and 78–132 ("Wenn Tugend und Gerechtigkeit").
- **SEGS:** `1/2/2/-1/Allegro;72/2/2/-1/Recit.;76/2/2/-1/Adagio;78/2/2/0/Presto`
- **SINGERS:** `N:Monostatos:Mon.:G/2/-1,P:Pamina:Pam.:G/2,T:Tamino:Tam.:G/2/-1,S:Sarastro:Sar.:F/4,K1:Chor Sopran:S.:G/2,K2:Chor Alt:A.:G/2,K3:Chor Tenor:T.:G/2/-1,K4:Chor Bass:B.:F/4`
- **REPEATS:** none.
- **xfix.txt:** `final` (the final double bar), `timesym 1 cut` (the printed cut C), `timesym 78 cut` (the cut C restated at
  the Presto; no effect in the XML, which writes no new time signature at bar 78 since the meter does not change). In the build
  folder (ext/zf/b22) it is fixes.txt.
- **Process:** two chunks, S22a (pp. 74–76, bars 1–67) and S22b (pp. 77–79, bars 68–146): for each, two independent readers +
  judge + marks sweep; stitched (no shared bars), built, then a fresh check until clean.
- **Shared bars:** none. S21 ends at the double bar on p. 74 system 1 bar 1; S22 starts with the next bar. The piece ends with
  Act 1; S23 (Marsch der Priester, Act 2) starts on p. 80. No syllable carries over.

## Checks and fixes
- Judge: 39 sung-line remarks ("# JUDGE": 29 in S22a, 10 in S22b) and 131 piano remarks (110 + 21), every difference settled on
  the print. Sung lines: printed naturals on the same pitch; slurs printed over two-note groups (bars 8, 9, 12, 13, 24, 26, 36);
  "wär'." with a period in bar 21 (no exclamation mark), "Frev'-ler" with the apostrophe (bar 32), "streich'!" (bar 56); the
  German rhythm separated from the Italian-only notes (bars 16, 18, 20, 25, 32, 38, 39, 43–45, 46, 50, 54, 57, 73, 74, 77); bar 43
  Monostatos's last F3 serves only the Italian, so "mei-" starts bar 44; bar 45 Sarastro's first head is A3; bar 73 "sern" is
  D4; "sotto voce" over the chorus in bars 62 and 66; in the closing chorus the heads of bars 103, 105, 111, 125 and 130 read on
  400-dpi profiles. Piano: grace notes as small slashed eighths with their slurs, the tied upper halves and stem-down "Fag." halves
  of the bass in bars 3–6, 17–18, 29, bar 20 F3+A3 after the clef change, dynamics printed between the staves kept on both, bar
  27 the first eighth D6 alone.
- Marks sweep: 1 sung-line remark (bar 76 "Adagio." / "a tempo" placed in Sarastro's line) and 53 piano remarks (grace-note
  slurs, long slurs in bars 17–19, 27–29, 49–51, 60–62, removed unprinted slurs in bars 5–6 and 17–18, p in bars 1, 73 and 76).
- Fresh check: clean after two fixes: "# FIX" bar 5 RH (no staccato on the first F4) and the cut-time symbol (xfix
  `timesym`); re-check clean.

Final build reproduced from this folder (TMPDIR on /dev/shm): `kit/cleanv.py VM_S22.txt` (gives b22/VM_S22.clean.txt byte for
byte) → `kit/build.sh` with SEGS/SINGERS above and title "Nun stolzer Jüngling, nur hieher!" (gives s22.raw.xml byte for byte)
→ `kit/fix64.py` → `kit/clef0fix.py` → `kit/fixtup.py` (gives s22.xml byte for byte) → `kit/xfix.py` with xfix.txt gives
`S22_Finale_-_Nun_stolzer_Juengling_nur_hieher.musicxml` byte for byte (the checked s22f.xml). 0 missing required accidentals;
every bar of every part adds up (barsum, 0 problems).

## Words
Kept as printed: "Nun stolzer Jüngling, nur hieher!" (the libretto has "Na"), "Hier ist Sarastro, unser Herr.", Pamina "Er
ist's! Ich glaub' es kaum. Er ist's!" and Tamino "Sie ist's! Sie ist's! Es ist kein Traum!" (the libretto gives both lines to
both), "Es schling' mein Arm sich um ihn her," / "… um sie her,", "und wenn es auch mein Ende wär'." (period), "Was soll das
heissen?", "Welch eine Dreistigkeit!", "Gleich auseinander, das geht zu weit!", "Dein Sclave liegt zu deinen Füssen, lass den
verweg'nen Frev'ler büssen.", "Bedenk',", "seltnen", "wollt' er Paminen dir entführen," (the print has "Pa-mi-nen", checked on
the page; the libretto draft's source line said "Pamina", wrongly), "allein ich wusst' ihn auszuspüren." (the libretto has
"aufzuspüren"), "Du kennst mich, meine Wachsamkeit" (no dash), "verdient, dass man ihr Lorbeer streut!", "He! gebt dem
Ehrenmann sogleich", "nur siebenundsiebenzig Sohlenstreich'!" (one word over six notes, split sie-ben-und-sie-ben-zig),
"Ach, Herr! ach, Herr! den Lohn verhofft' ich nicht!", "Nicht Dank! es ist ja meine Pflicht.", chorus "er lohnet, er strafet in
ähnlichem Kreise." (the libretto has "er lohnet und strafet"), Sarastro "Führt diese beiden Fremdlinge in unsern
Prüfungstempel ein, bedecket ihre Häupter dann, sie müssen erst gereinigt sein.", chorus "der Grossen Pfad", "dann ist die Erd'
ein Himmelreich, und Sterbliche den Göttern gleich." with the print's repeats. Words printed as one ("Füssen,", "führen,allein")
are split at the syllables. In the closing chorus (bars 92–105) the print gives some words under one staff only; the altos,
tenors or basses that move with that line are given the same words (an inference, noted in VM). German only: the Italian
translation, the notes printed only for it and the stage directions are left out.

## Tempo
Allegro ♩ = 168 (half note = 84), Recit. ♩ = 80, Adagio (bar 76, "sie müssen") ♩ = 40, a tempo ♩ = 80, Presto ♩ = 208 (half
note = 104); the map plays 200 s. Basis: five complete recordings whose track(s) hold exactly this section (from "Nun/Na,
stolzer Jüngling" to the end of Act 1; in each listing the next track is the Act 2 march):
  - Christie, Les Arts Florissants (Erato, 1995; ototoy 322115, disc 1 track 17): 3:12
  - Nézet-Séguin, Chamber Orchestra of Europe (DG, live 2018; Qobuz mwvxw92vhjn0b / ototoy 416914, disc 1 tracks 23–24):
    2:04 + 1:10 ("Wenn Tugend und Gerechtigkeit") = 3:14
  - Norrington, London Classical Players (EMI/Warner; Apple Music Classical 697509977, ototoy 255124): 1:52 + 1:28 (Chor "Wenn
    Tugend und Gerechtigkeit") = 3:20
  - Haitink, Bavarian Radio SO (EMI, 1981; ototoy 128214, disc 1 track 26): 3:22
  - Klemperer, Philharmonia (EMI, 1964; Apple Music Classical 734557407): 3:33
Median 3:20 (200 s). Nézet-Séguin and Norrington split the section at the Presto: bars 1–77 2:04 / 1:52 (median 118 s), bars
78–146 1:10 / 1:28 (median 79 s); scaled to 200 s: 120 s + 80 s. Presto: 276 quarters / 80 s → ♩ = 207 → 208. Bars 1–77: the
recitative at a grave speaking pace (♩ = 80, with the printed Adagio at half that) takes 19 s, leaving 101 s for the Allegro's
284 quarters → ♩ = 168. Set with `kit/tempomap.py "1:168:Allegro;72:80:Recit.;76@1.5:40:Adagio;76@3:80:a tempo;78:208:Presto"`
(no rit./rall. in the print, no ramps), then `kit/tempodedupe.py`; the words-only "Adagio" heading at the start of bar 76
(first part) was removed by hand, since its tempo now stands at the printed place (offset 1.5 quarters), and the bar's two tempo
directions put in offset order. The import gives 200 s at score tempo. The recitative tempi are this app's choice.

## Judgement calls and anything doubtful
- Bars 21–22 chorus: printed on one treble staff in unison; tenors and basses written an octave below; the print does not show
  whether the basses sing a further octave down.
- Bars 92–105: the alto, tenor and bass words in the closing chorus where only one staff carries them (see Words).
- Bar 75, Sarastro: "be-decket" printed with no hyphen inside "decket" over three notes; split be-de-cket.
- Bar 76: "Adagio." for "sie müssen" only, "a tempo" from "erst" (as printed over Sarastro's staff).
