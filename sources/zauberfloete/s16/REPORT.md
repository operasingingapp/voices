# S16 — Die Zauberflöte, No. 8 Finale (opening) "Zum Ziele führt dich diese Bahn"

Edition Peters vocal score (Kogel, Leipzig, plate 7794), batch 3, Nov 2026.

- **Printed pages:** 51 (system 3, "Nr. 8 Finale") – 53 (system 2, bar 3: the chord and double bar before "Recit."); PDF 55–57
- **Shape:** 38 bars, Larghetto, alla breve (cut time, 2/2), C major throughout; no tempo, key or time changes. Bars 1–8 and 36–38 are piano alone.
- **Singers:** B1, B2, B3 = the three Boys ("K 1/2" share one staff, "K 3" has his own); T = Tamino, printed on the Third Boy's staff (bars 18–22, treble clef, written here at sounding pitch an octave lower). No chorus.
- **SEGS:** `1/2/2/0/Larghetto` (the bars are counted as four quarters; `timesym 1 cut` in xfix.txt restores the printed alla-breve sign)
- **SINGERS:** `B1:Erster Knabe:1. K.:G/2,B2:Zweiter Knabe:2. K.:G/2,B3:Dritter Knabe:3. K.:G/2,T:Tamino:Tam.:G/2/-1`
- **Process:** two readers + judge + marks sweep (73 piano marks) + fresh check (clean).
- **Shared bars:** none. S17 (Tamino's Recit. "Die Weisheitslehre dieser Knaben") starts after the double bar with its own eighth rest; no syllable carries over.

## Build
`kit/cleanv.py` + `kit/build.sh` + `fix64.py` + `clef0fix.py` + `fixtup.py`, then `kit/xfix.py` with xfix.txt (`final`, `timesym 1 cut`).
Reproduced here from VM_S16.txt / PM_S16.txt / segs.txt / singers.txt / xfix.txt: VM_S16.clean.txt, s16.raw.xml, s16.xml and
the final s16f.xml (= S16_Finale_-_Zum_Ziele_fuehrt_dich_diese_Bahn.musicxml) byte for byte. 0 missing required accidentals;
every bar of every part adds up (barsum 0 problems).

## Words
Kept as printed: "Dies kund zu thun" (three words, "thun"), "sagt mir an" (DME libretto: "saget an"), "Kleinen" without a comma
(checked on the print, p. 52), "Sei" (DME "Sey"), "musst". The Boys' last line "dann, Jüngling, wirst du männlich siegen" is sung
twice (bars 30–35; the Third Boy follows half a bar behind the other two, from bar 31 and again in bar 33). German only; the Italian translation, the
notes printed only for it (bars 19, 28, 30) and the stage directions ("mit seiner Flöte umgehängt", "ab.") are left out.

## Tempo
Larghetto: 100 quarters per minute (half note = 50). Basis: complete recordings whose track is exactly this section (median
91 s for 152 quarters), from the albums' streaming track lists:
  - Jacobs, Akademie für Alte Musik Berlin (Harmonia Mundi, 2010): 1:14
  - Norrington, London Classical Players (EMI/Warner): 1:24
  - Christie, Les Arts Florissants (Erato, 1995): 1:31
  - Toscanini, Vienna PO (Salzburg live, 1937): 1:33
  - Haitink, Bavarian Radio SO (EMI, 1981): 1:48
Klemperer 1964 (10:04), Abbado 2005 (9:00) and Sawallisch (9:37) put the finale's first sections on one track, so they are not
used. Set with `kit/tempomap.py "1:100:Larghetto"` and `kit/tempodedupe.py`.

## Judgement calls and anything doubtful
- Bar 19 Tamino: the small up-stem D after "Klei-" carries only the Italian syllable; German = D dotted quarter "Klei-", B eighth "nen".
- Bars 28 and 30: extra notes/stems on the Boys' staves that serve only the Italian text are left out.
- Bar 22 Tamino: slashed grace note (acciaccatura) C4 before "kann?".
- Bar 38: the plan (ACTS.md) mentions a fermata chord; the print has no fermata here (judge, fresh check), so none is written.
- Bars 35–38 piano: several voicing calls by the judge (see the "# JUDGE" remarks in PM_S16.txt).
