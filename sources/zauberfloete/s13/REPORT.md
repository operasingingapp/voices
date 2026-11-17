# S13 — Die Zauberflöte, No. 6 Terzett "Du feines Täubchen, nur herein!"

Edition Peters vocal score (Kogel, Leipzig, plate 7794), batch 2, 17 Nov 2026.

- **Printed pages:** 45 (system 2) – 47 (final double bar); PDF 49–51
- **Shape:** 71 bars, Allegro molto, 4/4 (C), G major throughout; no tempo, key or time changes.
- **Singers:** M = Monostatos (printed in treble clef, written here at sounding pitch an octave lower), P = Pamina, G = Papageno. M and P share one staff on pp. 45–46 ("M / Pm"); Papageno has his own bass-clef staff from p. 46.
- **SEGS:** `1/4/4/1/Allegro molto`
- **SINGERS:** `M:Monostatos:Mon.:G/2/-1,P:Pamina:Pam.:G/2,G:Papageno:Pap.:F/4`
- **Process:** two readers + judge (16 Nov) + marks sweep + fresh check (2 rounds).
- **Shared bars:** none.

## Checks and fixes
- Marks sweep: 4 marks added (2 sung staccatos bar 57, 2 RH2 slurs bars 35/39). It also flagged bars 53 and 57: the German "das" is the long down-stem QUARTER through a head shared with the Italian dotted eighth + 16th. Confirmed on 4x crops and fixed (M and G, both bars).
- Round 1 (two checkers, pp. 45–46 and p. 47): 2 items, both confirmed on 4x crops and fixed:
  - bar 16 Pamina: the small E5 is an unflagged quarter without a slash (appoggiatura); the build had slashed it. Fixed with `kit/xfix.py` ("grace P2 16 1 0", in xfix.txt), which also slurs it to the D5.
  - bars 67→68 and 68→69 piano LH: D4 is tied (upper arc = tie, lower arc = slur). Ties added.
- Round 2 (p. 45 system 4 and p. 47): CLEAN.

Final build: `kit/build.sh` (+ `kit/xfix.py` with xfix.txt: grace P2 16 1 0; final). 0 missing required accidentals; every bar of every part adds up (music21); music21 parses the file.

## Words
Kept as printed: "Sclaven", "Hass", "Nichts" (capital N), "weisser", "A ha!", "Hab' Mitleid!", "find'", "geh'". Papageno's "Kreide" has no punctuation (a stage direction follows in the print). The words have not been compared with a libretto (the libretto site is blocked from this session); every syllable was read against the print by the judge and both fresh rounds. German only; the Italian translation, stage directions and spoken dialogue are left out.

## Tempo
S13 Allegro molto: 154 quarters per minute (half note ≈ 77). Basis: complete recordings' track durations (median 110.5 s for 284 quarters), from the albums' streaming track lists:
  - Klemperer, Philharmonia (EMI/Warner, 1964): 1:55
  - Böhm, Berliner Philharmoniker (DG, 1964): 1:47
  - Abbado, Mahler Chamber Orchestra (DG, 2005): 1:48
  - Christie, Les Arts Florissants (Erato, 1995): 1:53

Solti's track includes the following dialogue, so it is not used. Track times include a little silence, so the true tempo may be slightly faster. Set with `kit/tempomap.py "1:154:Allegro molto"`.

## Judgement calls and anything doubtful
- Bars 53, 57, 61–64: one notehead with two stems (German and Italian rhythms). The German rhythm is kept: quarter "das" (53, 57), quarter rest + quarter "Hab'"/"ver-" (61–64).
- Bar 70: Papageno's "Hu!" is D4 (the judge's reading; both readers had C4).
- Bar 53: the piano fermatas are on beat 3; Monostatos/Papageno have the fermata on the quarter rest.
- Bar 71 RH: the 8va line covers beats 2–4 only; written at sounding pitch.
- Bar 11 RH: the p stands under the RH's opening eighth rest, so it sits before that rest in the file (the LH has it on its first chord).
