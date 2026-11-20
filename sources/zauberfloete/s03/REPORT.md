# S03 — Die Zauberflöte, No. 1 Introduction (second part) "Ich sollte fort?"

Edition Peters vocal score (Kogel, Leipzig, plate 7794), 20 Nov 2026.

- **Printed pages:** 16 (top, after the double bar at the end of p. 15) – 21 system 4 (final double bar of No. 1); PDF 20–25
- **Shape:** 86 bars. Allegretto 6/8, G major (bars 1–33); Allegro alla breve (cut time), C major (bars 34–86), with a repeat:
  forward repeat at bar 55, 1st ending bar 68 (backward repeat), 2nd ending bar 69. Fermatas in bars 24, 54 and 68.
- **Singers:** D1 = Erste Dame, D2 = Zweite Dame, D3 = Dritte Dame (all treble clef). The print puts two Ladies on one staff in
  places ("D 2/1", "1 2", "D 1/2"); each Lady has her own line here. Tamino lies unconscious on stage and does not sing.
- **SEGS:** `1/6/8/1/Allegretto;34/2/2/0/Allegro`
- **SINGERS:** `D1:Erste Dame:1. D.:G/2,D2:Zweite Dame:2. D.:G/2,D3:Dritte Dame:3. D.:G/2`
- **REPEATS:** `fwd:55;back:68:2;end:68-68:1;end:69-69:2`
- **xfix.txt:** `final` and `timesym 34 cut` (the alla-breve sign at bar 34). In the build folder (ext/zf/b03) it is fixes.txt.
- **Process:** two readers per chunk (S03a pp. 16–18, bars 1–42; S03b pp. 19–21, bars 43–86) + judge + marks sweep, stitched,
  built, then fresh checks until clean.
- **Shared bars:** none. The previous section S02 "Zu Hülfe! zu Hülfe!" ends at the double bar at the end of p. 15; no syllable
  carries over.

## Checks and fixes
- Judge: 39 sung-line and 44 piano remarks ("# JUDGE"); the readers differed little (mostly on the notes printed only for the
  Italian, and a few pitches settled on zoomed crops: bars 38 D3, 54 D1, 66 D1/D3, 69 D3).
- Marks sweep: 2 sung staccatos (bar 27, D1/D2 "nicht", printed only there; could be a speck, kept as read), piano f / fp /
  cresc. / dolce between the staves (bars 34–42, 44, 52, 53, 56).
- Fresh check: 3 items, confirmed on the print and fixed ("# FIX" in PM_S03.txt): bar 6 RH, no staccato on the first chord;
  bars 71 and 73 RH, the "8"-like sign is a C5+E5 whole-note chord with old-style heads, not a rest. Then clean.

Final build reproduced from this folder (TMPDIR on /dev/shm): `kit/cleanv.py VM_S03.txt` → `kit/build.sh` with SEGS/SINGERS above
→ `kit/fix64.py` → `kit/clef0fix.py` → `kit/fixtup.py` → `kit/repeats.py` with REPEATS above → `kit/xfix.py` with xfix.txt gives
`S03_Introduction_-_Ich_sollte_fort.musicxml` byte for byte (the checked s03f.xml). 0 missing required accidentals; every bar of
every part adds up (barsum).

## Words
Kept as printed: "Ich sollte fort?" (question mark; the libretto has "!"), "könnt'", "Hätt'", "geh'", "wiederseh'" (one word),
"sein" (not the 1791 libretto's "seyn"). The repeats of the music are written out as sung. German only: the Italian translation,
the notes printed only for it (split quarters, extra eighths and down-stem voices, e.g. bars 14, 42, 47, 54, 56, 63–66, 69, 74),
stage directions ("für sich", "Die drei Damen entfernen sich") and cue words ("Holzbl.", "Viol.", "G. Orch.") are left out.

## Tempo
Allegretto ♩ = 75 (♩. = 50), Allegro ♩ = 150 (half note = 75): the Allegro's quarter is set to the Allegretto's eighth, since no
recording found splits the two sections. Basis: median length of this section 184 s (3:04), with the repeat:
  - Haitink, Bavarian Radio SO (EMI, 1981): own track "Ich sollte fort?" 3:11 (first part of No. 1: 3:34)
  - Norrington, London Classical Players (EMI/Warner): own track 2:32 (first part: 3:15)
  - Klemperer, Philharmonia (EMI/Warner, 1964): No. 1 track 6:53 × 45.5% ≈ 3:08
  - Böhm, Berliner Philharmoniker (DG, 1964): No. 1 track 6:44 × 45.5% ≈ 3:04
  - Christie, Les Arts Florissants (Erato, 1995): No. 1 track 6:40 × 45.5% ≈ 3:02
45.5% = the mean share of this section in No. 1 in the two recordings that split it (Haitink 47.2%, Norrington 43.8%); the other
sets give No. 1 one track. Set with `kit/tempomap.py "1:75:Allegretto;34:150:Allegro"`, then `kit/tempodedupe.py`; the import
gives 185 s at score tempo (99 performed bars with the repeat).

## Judgement calls and anything doubtful
- Bar 32, Third Lady: the main note G3 is kept; a small G4 printed on the same stem as an alternative (for a higher voice) is
  left out.
- Bars 42, 47, 63–66 and others: one notehead or chord with two stem directions (German and Italian rhythms). The German rhythm
  (up stems) is kept.
- Bar 27 D1/D2: the staccato on "nicht" is printed only there (not in bars 20, 29, 31); kept as read.
- Bar 54: fermata on the quarter rest; the first of the two eighths after it is for the Italian only, so the German is an eighth
  rest and "Du".
