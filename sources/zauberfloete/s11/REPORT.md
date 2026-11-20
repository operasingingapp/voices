# S11 — Die Zauberflöte, No. 5 Quintett (first part) "Hm! hm! hm!"

Edition Peters vocal score (Kogel, Leipzig, plate 7794), 20 Nov 2026.

- **Printed pages:** 32 (top of No. 5) – 43 system 2, bar 3 (fermata and double bar after "Wie man die Burg wohl finden kann?"); PDF 36–47
- **Shape:** 213 bars, Allegro, alla breve (cut time) throughout, B-flat major throughout; no tempo, key or time changes, no repeats. Fermata in bar 213 (Tamino, Papageno and piano, over the rest after "kann?").
- **Chunks:** S11a bars 1–73 (pp. 32–35), S11b bars 74–159 (pp. 36–39), S11c bars 160–213 (pp. 40–43); stitched with no shared bars.
- **Singers:** D1 = Erste Dame, D2 = Zweite Dame, D3 = Dritte Dame (treble clef), T = Tamino (printed in treble clef, written here at sounding pitch an octave lower), G = Papageno (bass clef). The print shares staves: "P / T" (Papageno and Tamino on one staff, bars 7–16), "T / D1" (bar 33ff.), "D 1/2" (First and Second Lady, upper and lower notes) and "D 3"; each singer has their own line here.
- **SEGS:** `1/2/2/-2/Allegro`
- **SINGERS:** `D1:Erste Dame:1. D.:G/2,D2:Zweite Dame:2. D.:G/2,D3:Dritte Dame:3. D.:G/2,T:Tamino:Tam.:G/2/-1,G:Papageno:Pap.:F/4`
- **xfix.txt:** `final` (final barline) and `timesym 1 cut` (the alla-breve sign). In the build folder (ext/zf/b11) it is fixes.txt.
- **Process:** two readers per chunk + judge (61 sung and 141 piano remarks, "# JUDGE") + marks sweep (33 piano remarks, "# MARKS"), stitched, built, then fresh checks until clean.
- **Shared bars:** none. The quintet goes on after the double bar with S12 "Drei Knäbchen, jung, schön, hold und weise" (Andante, already in the app as mozart-drei-knabchen); no syllable carries over.

## Checks and fixes
- The print sets the Italian translation under the German with extra stems and notes for it (dotted rhythms, split notes, extra rests). Throughout, the German rhythm is kept (the up-stem notes) and notes printed only for the Italian are left out (judge remarks e.g. bars 25, 31, 32, 34, 42, 44, 46, 48, 50–52, 63–64, 66, 138, 211).
- Fresh check: one fix, bar 163 Papageno "der" is D4 ("# FIX", measured on the scan); the re-check of that bar was clean.

Final build reproduced from this folder (TMPDIR on /dev/shm): `kit/cleanv.py VM_S11.txt` → `kit/build.sh` with SEGS/SINGERS above and title "Hm! hm! hm!" → `kit/fix64.py` (0 changed) → `kit/clef0fix.py` → `kit/fixtup.py` → `kit/xfix.py` with xfix.txt gives `S11_Quintett_-_Hm_hm_hm.musicxml` byte for byte (the checked s11f.xml). 0 missing required accidentals; every bar of every part adds up (barsum).

## Words
Kept as printed: "erlässt" (libretto "entlässt"), "Verläumdung" (libretto "Verleumdung"), "bestände" (libretto "bestünde"), "selber" (libretto "selbsten"), "darinnen" (libretto "da drinnen"), "wie man die Burg" (libretto "wo man die Burg"), the old spellings "thun", "werth", "grössten", "Tigerthier", "vonnöthen", "Sarastro's", the apostrophes "Lieb'", "ohn'", "trau'", "empfehl'", "bedank'", "Werd'", "geh'n", "Wiederseh'n", and "Die Zauberflöte, wird dich schützen" with the print's comma (bar 90). All five sing "eurem" in "sind zu eurem Schutz vonnöthen" (the libretto gives Tamino and Papageno "unserm"). Papageno's "Hm!" (bars 3–33) is hummed with the mouth closed: he still wears the padlock. In bar 66 Papageno rests while the others sing "bestände Lieb'" and comes in on "und Bruderbund". German only: the Italian translation, its extra notes, the stage directions and the staff labels are left out.

## Tempo
Allegro (alla breve), ♩ = 180 (half note = 90). Basis: median length of this section 283 s (4:43) for 852 quarters:
  - Haitink, Bavarian Radio SO (EMI, 1981): own track "Hm! hm! hm! hm!" 5:05 (the following "Drei Knaben, jung, schön, hold und weise" is its own track, 1:52; so this section is 73.1% of No. 5)
  - Klemperer, Philharmonia (EMI/Warner, 1964): No. 5 track 6:44 × 73.1% ≈ 4:55
  - Böhm, Berliner Philharmoniker (DG, 1964): No. 5 track 6:27 × 73.1% ≈ 4:43
  - Christie, Les Arts Florissants (Erato, 1995): No. 5 track 5:50 × 73.1% ≈ 4:16
  - Abbado, Mahler Chamber Orchestra (DG, 2005): No. 5 track 5:46 × 73.1% ≈ 4:13
The same five sets as S12's tempo (whose share is the other 26.9%). Haitink's is the only complete set found with this section on its own track. Also seen, not used (whole No. 5 on one track): Karajan 1980 6:27, Böhm 1955 6:33, Toscanini (Salzburg) 6:11, Norrington 5:45, Jacobs 5:46, Nézet-Séguin 5:36, Halasz (Naxos) 6:08. Haitink alone would give ♩ ≈ 168. Set with `kit/tempomap.py "1:180:Allegro"`, then `kit/tempodedupe.py`; the import gives 284 s at score tempo.

## Judgement calls and anything doubtful
- Bar 159 Second Lady "der": D5 (one head carrying the First and Second Ladies' stems; the judge marked it uncertain).
- Bar 42 Papageno: German "ge-no wie-der." on four quarters (the eighths and the rest under beat 4 are the Italian).
- "sotto voce" (bars 54, 184) is printed over the upper voice staff; the file carries it where printed (First Lady; Tamino at 184), not copied to every voice.
- Piano dynamics printed between the staves are attached to the right hand (not duplicated on the left).
