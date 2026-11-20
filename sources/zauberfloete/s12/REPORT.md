# S12 — Die Zauberflöte, No. 5 Quintett (last part) "Drei Knäbchen, jung, schön, hold und weise"

Edition Peters vocal score (Kogel, Leipzig, plate 7794), 20 Nov 2026.

- **Printed pages:** 43 system 2, bar 4 (Andante, after the fermata and double bar that end "Wie man die Burg wohl finden kann?") – 45 system 1 (final double bar of No. 5); PDF 47–49
- **Shape:** 34 bars, Andante, 4/4 (C), B-flat major throughout; no tempo, key or time changes, no fermatas, no repeats. Bars 1–3 and 33–34 are piano alone.
- **Singers:** D1 = Erste Dame, D2 = Zweite Dame, D3 = Dritte Dame (treble clef), T = Tamino (printed in treble clef, written here at sounding pitch an octave lower), G = Papageno (bass clef). The print shares staves: "D 1/2" and "D 3" (bars 4–11, 16–20), Tamino and Papageno on the Ladies' staves (bars 12–23: "D 1/2 / T" and "D 3 / P"), then one staff "D 1/2/3" for all three Ladies (bars 24–31: upper note First Lady, lower note Second and Third Ladies; three-note chords in bars 29 and 31, and in bar 30 the Third Lady's "auf" is D4). Each singer has their own line here.
- **SEGS:** `1/4/4/-2/Andante`
- **SINGERS:** `D1:Erste Dame:1. D.:G/2,D2:Zweite Dame:2. D.:G/2,D3:Dritte Dame:3. D.:G/2,T:Tamino:Tam.:G/2/-1,G:Papageno:Pap.:F/4`
- **xfix.txt:** `final` (final barline). In the build folder (ext/zf/b12) it is fixes.txt.
- **Process:** two readers (one chunk) + judge + marks sweep, built, then a fresh check: clean.
- **Shared bars:** none. The previous section S11 "Hm! hm! hm!" (not yet in the app) ends with Tamino and Papageno's "kann?" and the fermata and double bar in p. 43 system 2 bar 3; no syllable carries over (all S12 voices begin with rests; the first word is the Ladies' "Drei" in bar 4).

## Checks and fixes
- Judge: 12 sung-line and 19 piano remarks ("# JUDGE"). The readers differed in one sung bar only: bar 32 Papageno "seh'n." Bb2 (reader B, kept) against Bb3. Settled on zoomed crops: bar 30 the Ladies' "auf" is three voices (D1 Bb4, D2 Bb4, D3 D4); bars 29/31 beats 1–2 C5/A4/F4, beat 3 D5 over Bb4 (D2 and D3 both on Bb4, one printed note); bars 29/31 First Lady plain eighths with E natural.
- Marks sweep: 1 sung remark (bar 14 Papageno staccato on "hold"), 7 piano remarks (p, mf, sf, f printed between the staves, bars 1, 11, 19, 23, 25–27).
- Fresh check: clean, no fixes.

Final build reproduced from this folder (TMPDIR on /dev/shm): `kit/cleanv.py VM_S12.txt` → `kit/build.sh` with SEGS/SINGERS above and title "Drei Knäbchen, jung, schön, hold und weise" → `kit/fix64.py` → `kit/clef0fix.py` → `kit/fixtup.py` → `kit/xfix.py` with xfix.txt gives `S12_Quintett_-_Drei_Knaebchen_jung_schoen_hold_und_weise.musicxml` byte for byte (the checked s12f.xml). 0 missing required accidentals; every bar of every part adds up (barsum).

## Words
Kept as printed: "Rathe" (old spelling), "geh'n", "Wiederseh'n" (capital W, apostrophe), "sie werden" (bar 8) and "Sie werden" (bar 16). The Ladies sing "Sie werden eure Führer sein, folgt ihrem Rathe ganz allein" twice (bars 8–12 and 16–20); Tamino and Papageno sing "umschweben uns auf unsrer Reise" where the Ladies sing "euch … eurer". All five end with "auf Wiederseh'n" three times. German only: the Italian translation, the stage direction "Die drei Damen (zurückkommend)" and the staff labels are left out.

## Tempo
Andante ♩ = 78. Basis: median length of this section 104 s (1:44) for 136 quarters:
  - Haitink, Bavarian Radio SO (EMI, 1981): own track "Drei Knaben, jung, schön, hold und weise" 1:52 (the first part of No. 5, "Hm! hm! hm!", 5:05; so this section is 26.9% of No. 5)
  - Klemperer, Philharmonia (EMI/Warner, 1964): No. 5 track 6:44 × 26.9% ≈ 1:49
  - Böhm, Berliner Philharmoniker (DG, 1964): No. 5 track 6:27 × 26.9% ≈ 1:44
  - Christie, Les Arts Florissants (Erato, 1995): No. 5 track 5:50 × 26.9% ≈ 1:34
  - Abbado, Mahler Chamber Orchestra (DG, 2005): No. 5 track 5:46 × 26.9% ≈ 1:33
Haitink's is the only complete set found with this section on its own track; the others give No. 5 one track. Also seen, not
used: Norrington 5:45, Jacobs 5:46, Nézet-Séguin 5:36 (whole No. 5). Set with `kit/tempomap.py "1:78:Andante"`, then
`kit/tempodedupe.py`; the import gives 105 s at score tempo.

## Judgement calls and anything doubtful
- Bar 32 Papageno "seh'n." Bb2 (the judge's reading on the print; reader A had Bb3).
- Bars 24–31: one staff for three Ladies; the lower printed note is sung by both the Second and Third Ladies except where a third note is printed (bars 29–31).
- Bar 4: "sotto voce" is printed over the "D 1/2" staff only; it is on D1 and D2 here, not D3.
- Piano dynamics printed between the staves are attached to the right hand (not duplicated on the left).
