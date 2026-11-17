# S38 — Die Zauberflöte, No. 16 Terzett "Seid uns zum zweitenmal willkommen"

Edition Peters vocal score (Kogel, Leipzig, plate 7794), batch 2, 17 Nov 2026.

- **Printed pages:** 102 (from No. 16) – 104 (final double bar); PDF 106–108
- **Shape:** 36 bars, Allegretto, 6/8, A major; no changes. Bars 1–4 and 33–36 are piano only.
- **Singers:** U = Erster Knabe, V = Zweiter Knabe, W = Dritter Knabe (trebles, written = sounding). Printed staves "1. u. 2. Knabe" (labelled "K 1/2": upper notes U, lower V; a single notehead = both) and "3. Knabe" ("K 3" = W); each boy has his own staff in the file.
- **SEGS:** `1/6/8/3/Allegretto`
- **SINGERS:** `U:Erster Knabe:1. Kn.:G/2,V:Zweiter Knabe:2. Kn.:G/2,W:Dritter Knabe:3. Kn.:G/2`
- **Process:** two readers + judge + marks sweep + fresh check (1 round). Restarted from bar 1 this session (the 16 Nov partial readings were not in the zip).
- **Shared bars:** none.

## Checks and fixes
- The two readers agreed on every sung note and syllable and every piano note and dynamic; the judge changed only the RH voice split in bar 14.
- Marks sweep: p added to the LH in bar 1 (printed between the staves). No other dynamics exist on any staff.
- Round 1 (all three pages): CLEAN.

Final build: `kit/build.sh` (+ `kit/xfix.py` with xfix.txt: final). 0 missing required accidentals; every bar of every part adds up (music21); music21 parses the file.

## Words
Kept as printed: "zweitenmal", "drittenmal", "Sarastro's", "Muthes", "Muth!", "nah'", "verschmähen". Bar 10, the Third Boy's "abgenommen" has no comma (the upper staff has one). Not compared with a libretto (blocked). German only; the Italian translation, stage directions and spoken dialogue are left out.

## Tempo
S38 Allegretto: 72 quarters per minute (dotted quarter ≈ 48). Basis: complete recordings' track durations (median 90.5 s for 108 quarters), from the albums' streaming track lists:
  - Klemperer, Philharmonia (EMI/Warner, 1964): 1:55
  - Abbado, Mahler Chamber Orchestra (DG, 2005): 1:34
  - Christie, Les Arts Florissants (Erato, 1995): 1:24
  - Jacobs, Akademie für Alte Musik Berlin (HM, 2010): 1:27

Solti's track includes dialogue and Böhm's No. 16 was not found on the page used. Track times include a little silence, so the true tempo may be slightly faster. Set with `kit/tempomap.py "1:72:Allegretto"`.

## Judgement calls and anything doubtful
- Bars 16, 22, 28, 30, 32: notes printed only for the Italian syllables are left out (bar 16 "von." quarter + eighth rest; bar 22 "Muth!" eighth + eighth rest).
- Bar 4 RH: the last A4 is a 16th followed by a 16th rest (bars 24, 28, 36 end on an eighth).
- Bars 21 and 25 LH: upper arc = tie on A4, lower arc = slur C#4–B3. Bars 24 and 28 LH: two separate printed slurs written as one chord slur.
- Bar 30 RH: an ink blot above the second chord (read A5+C#6, as in bar 32).
- The doubled 16th rests in the RH 32nd figures are written once.
