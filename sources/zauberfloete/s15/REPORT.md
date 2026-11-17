# S15 — Die Zauberflöte, No. 7 Duett "Bei Männern, welche Liebe fühlen"

Edition Peters vocal score (Kogel, Leipzig, plate 7794), batch 2, 17 Nov 2026.

- **Printed pages:** 49 – 51 (system 2, final double bar); PDF 53–55
- **Shape:** 50 bars, Andantino, 6/8, E-flat major; bar 1 is a 3/8 pickup (built as 3/8 and turned into an implicit pickup bar shown in 6/8 by kit_local/pickup2.py). No other changes. The two verses are printed one after the other (the second from bar 19), not stacked.
- **Singers:** P = Pamina, G = Papageno (bass clef).
- **SEGS:** `1/3/8/-3/Andantino;2/6/8/-3/`
- **SINGERS:** `P:Pamina:Pam.:G/2,G:Papageno:Pap.:F/4`
- **Process:** two readers + judge (16 Nov) + marks sweep + fresh check (2 rounds).
- **Shared bars:** none.

## Checks and fixes
- Marks sweep: "dolce" added to the second hand in bars 2 and 33 (printed between the staves). It removed a LH slur in bars 36–37 because it joins two voice lines.
- Round 1: 1 item, confirmed on a 4x crop and fixed: that LH slur is printed (bar 36, from the Bb3 at the 4th eighth, under the down-stem eighths, to the Bb3 of bar 37 on the next system). The Bb3 head is shared by both LH voices, so the slur is written on LH1 from that head to bar 37's Bb3 (same printed notes).
- Round 2 (p. 50): CLEAN.

Final build: `kit/build.sh` (+ `kit/xfix.py` with xfix.txt: final). 0 missing required accidentals; every bar of every part adds up (music21); music21 parses the file.

## Words
Kept as printed: "versüsset", "süssen", "Creatur", "unsre", "Edler's", "freu'n", "Lieb'". Not compared with a libretto (blocked); read against the print by the judge and both fresh rounds. German only; the Italian translation, stage directions and spoken dialogue are left out.

## Tempo
S15 Andantino: 47 quarters per minute (eighth ≈ 94, dotted quarter ≈ 31). Basis: complete recordings' track durations (median 190 s for 148.5 quarters), from the albums' streaming track lists:
  - Klemperer, Philharmonia (EMI/Warner, 1964): 3:34
  - Böhm, Berliner Philharmoniker (DG, 1964): 3:18
  - Solti, Wiener Philharmoniker (Decca, 1969): 3:10
  - Abbado, Mahler Chamber Orchestra (DG, 2005): 2:59
  - Christie, Les Arts Florissants (Erato, 1995): 2:55

Jacobs (2:34) is not used. Track times include a little silence, so the true tempo may be slightly faster. Set with `kit/tempomap.py "1:47:Andantino"`.

## Judgement calls and anything doubtful
- Piano bars 23–31: one reader had copied them from bars 7–15; the judge checked every note on the print (the other reader was right).
- Bars 11–13 and 27–29: the arcs on the top B-flat are ties (only Bb4 tied).
- Papageno bars 46 and 48: the rests printed there belong to the Italian text and are left out.
- Bar 44 RH: the p sits before a 16th rest (as printed).
