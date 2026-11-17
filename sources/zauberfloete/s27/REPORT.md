# S27 — Die Zauberflöte, No. 11 Duett "Bewahret euch vor Weibertücken"

Edition Peters vocal score (Kogel, Leipzig, plate 7794), batch 2, 17 Nov 2026.

- **Printed pages:** 83 (to the final double bar); PDF 87
- **Shape:** 25 bars, Allegretto, 4/4 (C), C major; no changes. Bars 22–25 are piano only.
- **Singers:** I = Erster Priester (tenor), J = Zweiter Priester (bass). Both are printed on ONE treble staff marked "Ten. u. Bass." (upper notes I, lower notes J) and sound an octave lower; each has his own treble-8 staff in the file. A single notehead with stems both ways is sung by both.
- **SEGS:** `1/4/4/0/Allegretto`
- **SINGERS:** `I:Erster Priester:1. Pr.:G/2/-1,J:Zweiter Priester:2. Pr.:G/2/-1`
- **Process:** two readers + judge (16 Nov) + marks sweep + fresh check (3 rounds).
- **Shared bars:** none.

## Checks and fixes
- Marks sweep: nothing missing; the bar 4 LH slur ends on the C3 quarter (beat 4), as the file had it.
- Round 1: 1 item, confirmed and fixed: bar 8 LH beat 3 is the octave A2+A3 (the file had A2+B3).
- Round 2 (whole page): 1 item, confirmed and fixed: bar 5 RH lower voice, beat 3: D4 (the cross-staff note sits on the first ledger line above the bass staff), not C4.
- Round 3 (p. 83 system 1, bars 1–5): CLEAN.

Final build: `kit/build.sh` (+ `kit/xfix.py` with xfix.txt: final). 0 missing required accidentals; every bar of every part adds up (music21); music21 parses the file.

## Words
Kept as printed: "liess", "versah sich's", "Treu", "Ver-zweif-lung". Not compared with a libretto (blocked). German only; the Italian translation, stage directions and spoken dialogue are left out.

## Tempo
S27 Allegretto: 93 quarters per minute. Basis: complete recordings' track durations (median 64.5 s for 100 quarters), from the albums' streaming track lists:
  - Klemperer, Philharmonia (EMI/Warner, 1964): 1:09
  - Böhm, Berliner Philharmoniker (DG, 1964): 0:54
  - Abbado, Mahler Chamber Orchestra (DG, 2005): 1:00
  - Christie, Les Arts Florissants (Erato, 1995): 1:09

Solti's No. 11 track was not found on the page used. Track times include a little silence, so the true tempo may be slightly faster. Set with `kit/tempomap.py "1:93:Allegretto"`.

## Judgement calls and anything doubtful
- Bar 4: the extra eighth-note chord on beat 2 belongs to the Italian text ("pia-ce") and is left out; the German is a dotted quarter + eighth "des".
- Bar 1 RH: written as two voices (G4 half tied to an eighth over E4 dotted half).
