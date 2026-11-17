# S44 — Die Zauberflöte, No. 19 Terzett "Soll ich dich, Theurer! nicht mehr seh'n?"

Edition Peters vocal score (Kogel, Leipzig, plate 7794), batch 2, 17 Nov 2026.

- **Printed pages:** 109 – 113 (final double bar); PDF 113–117; one chunk
- **Shape:** 78 bars, Andante moderato, alla breve (cut C, 2/2; the cut-C symbol set with xfix "timesym 1 cut"), B-flat major; no changes.
- **Singers:** P = Pamina, T = Tamino (printed in treble clef, written here at sounding pitch an octave lower), S = Sarastro (bass clef). They share staves that change from system to system (Pm/S, Pm/T, S); each has his or her own staff in the file, in the order of p. 113 (Pm, T, S).
- **SEGS:** `1/2/2/-2/Andante moderato`
- **SINGERS:** `P:Pamina:Pam.:G/2,T:Tamino:Tam.:G/2/-1,S:Sarastro:Sar.:F/4`
- **Process:** two readers + judge + marks sweep + fresh check (1 round, two checkers). New this session.
- **Shared bars:** none.

## Checks and fixes
- Judge: 23 X / 15 Y / 5 own decisions; all Italian-only extra lines (P2/T2/S2 in bars 41, 55, 65, 70, 72–74) dropped.
- Marks sweep: 3 LH dynamics (bars 1, 63, 64) and F4 ties in the RH half chords of bars 53 and 54. I also gave the p (bar 61) and the p and second f (bar 63), printed between the staves, to the second hand.
- Round 1, pp. 109–110: 1 item, no change (see bar 37 below). Round 1, pp. 111–113: CLEAN.

Final build: `kit/build.sh` (+ `kit/xfix.py` with xfix.txt: timesym 1 cut; grace P1 17 1 0; grace P1 25 1 0; grace P2 31 1 0; tie P4 55 1 2 F4; final). 0 missing required accidentals; every bar of every part adds up (music21); music21 parses the file.

## Words
The print has "sehn?" (bar 3) and "wiedersehn" (bar 5) without an apostrophe, but "seh'n" in Sarastro's "wir seh'n uns wieder" (bars 64–73); all kept as printed. Also kept: "Theurer", "tödtliche", "gold'ne", "Getreuer", "werd'", "Glaub'". Not compared with a libretto (blocked). German only; the Italian translation, stage directions and spoken dialogue are left out.

## Tempo
S44 Andante moderato: 101 quarters per minute (half note ≈ 50). Basis: complete recordings' track durations (median 185 s for 312 quarters), from the albums' streaming track lists:
  - Klemperer, Philharmonia (EMI/Warner, 1964): 3:16
  - Abbado, Mahler Chamber Orchestra (DG, 2005): 2:54
  - Jacobs, Akademie für Alte Musik Berlin (HM, 2010): 2:39
  - Christie, Les Arts Florissants (Erato, 1995): 4:41

Christie's track is much longer than the others and may include more than the number; the median is not affected. Solti's track includes dialogue. Track times include a little silence, so the true tempo may be slightly faster. Set with `kit/tempomap.py "1:101:Andante moderato"`.

## Judgement calls and anything doubtful
- **Bar 37, Tamino:** the print has no German syllable under his F (only the Italian "ah!"), although Pamina has "wie" on the same note and Tamino goes on with "bit-ter sind der Trennung Leiden!" in bar 38. "wie" is kept (a print slip); the fresh checker flagged it.
- Grace notes: the small flagged eighths (bars 8, 12, 16, 24, 30) are printed with a stroke and stay slashed; the small unflagged quarters (bars 17, 25, 31) are unslashed appoggiaturas (xfix "grace"). Bar 76 RH: the small beamed 32nds (turn) are unslashed (G: tokens).
- Bar 55→56 RH: the F4 of bar 55's half chord (upper voice) is tied to the F4 of bar 56's lower voice; added with xfix "tie P4 55 1 2 F4".
- Bar 52 RH: three printed layers kept (RH3 = the lowest). Bar 65: a RH chord beamed to chords printed on the LH staff; the notes are written by the staff they are printed on. Bar 66 RH beat 1: nothing printed (hidden rest).
- Bar 76: the vertical bracket with "m.d." is not encoded. Bar 62: the mf is in the LH only (the RH rests until bar 63, which has its own f).
