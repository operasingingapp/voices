# S01 — Die Zauberflöte, Ouverture

Edition Peters vocal score (Kogel, Leipzig, plate 7794, IMSLP #225460), 25 Nov 2026.

- **Printed pages:** 3–9 (p. 3 system 1, "Ouverture", Adagio, to the final double bar on p. 9). No. 1 (Introduction) follows.
- **Shape:** 226 bars, piano only. C (4/4) throughout, E-flat major (three flats) throughout; no repeats. Adagio, bars 1–15 (the
  three opening chords, each followed by fermatas on the rests in bars 1–3); Allegro, bars 16–96 (fugal; fermata on the half rest
  of bar 96); Adagio, bars 97–102: the threefold chord ("Harm."), three wind chords (f, a sixteenth upbeat onto a held chord), each
  followed by a fermata on the half rest (bars 98, 100, 102); Allegro, bars 103–226. 226 bars as played.
- **Singers:** none (instrumental; played before the curtain). singers.txt is empty; VM_S01.txt has no sung lines.
- **SEGS:** `1/4/4/-3/Adagio;16/4/4/-3/Allegro;97/4/4/-3/Adagio;103/4/4/-3/Allegro`
- **SINGERS:** (empty)
- **REPEATS:** none
- **xfix.txt:** `final`, `timesym 1 common` (in the build folder ext/zf/b01 it is fixes.txt).
- **Process:** two readers per half (S01a pp. 3–6, 132 bars; S01b pp. 7–9, 94 bars) + judge + marks sweep for each, stitched
  into one file (S01b renumbered from bar 133), built, then a fresh check by three proofreaders.
- **Shared bars:** none. The overture ends on its own final double bar; No. 1 begins on a new page.

## Checks and fixes
- Judge: 85 piano remarks ("# JUDGE": 50 in S01a, 35 in S01b), no sung lines. The judge settled the time signature as plain C
  (4/4), not alla breve, with no new signature at the Allegro.
- Marks sweep: 85 "# MARKS" remarks (dynamics, slurs and staccatos).
- Fresh check (three proofreaders); fixes applied:
  - bar 34 RH: A-natural half note;
  - bars 69 and 79 RH: F#5 in the half chord;
  - bar 75 LH: no staccato on the first chord;
  - bar 108 LH: F#4;
  - bar 196 LH: staccato on the first chord.
- At integration (import check): bar 124 RH2 had a tie on the G4 of the beat-1 chord that led nowhere (a rest follows; the import
  refused it: "tie from P1-m124-s1-g9 has no matching continuation"). The print (p. 6, system 6) shows the lower curve only from
  the beat-4 G4+Bb4 chord to the G4 of bar 125, as the judge's remark says; the stray "~" was removed from PM_S01.txt here and
  the file rebuilt (the only change from ext/zf/b01/s01f.xml: that tie start and its stop).

Final build reproduced from this folder (TMPDIR on /dev/shm): `kit/cleanv.py VM_S01.txt` → `kit/build.sh` with SEGS/SINGERS
above (title "Ouverture") → `kit/fix64.py` → `kit/clef0fix.py` → `kit/fixtup.py` → `kit/xfix.py` with xfix.txt gives
`S01_Ouverture.musicxml` byte for byte (before the bar-124 tie fix the same chain reproduced ext/zf/b01/s01.xml and s01f.xml
byte for byte). 0 missing required accidentals; every bar adds up (barsum 0 problems).

## Words
None sung. Kept: the tempo words Adagio (bars 1, 97) and Allegro (bars 16, 103), cresc., the dynamics. Left out: the instrument
cues (G.Orch., Vcello u. Fag., Fl., Ob., Clar., Fag., Pos., Quart., Harm., Streicher/Streich.) and the fingerings (kept as remarks
in PM_S01.txt). The app copy carries the tempo map on the printed tempo words (the duplicate words-only directions dropped).

## Tempo
Allegro ♩ = 180 (half note = 90), Adagio ♩ = 60, fermatas held. Basis: the Overture tracks of five complete recordings:
  - Norrington, London Classical Players (EMI/Warner; ototoy 255124, disc 1 track 1): 5:51
  - Christie, Les Arts Florissants (Erato, 1995; ototoy 322115, disc 1 track 1): 5:57
  - Jacobs, Akademie für Alte Musik Berlin (harmonia mundi HMC902068.70, 2010; booklet track list): 6:00
  - Klemperer, Philharmonia (EMI/Warner, 1964; Apple Music Classical 734557407): 7:17
  - Haitink, Bavarian Radio SO (EMI, 1981; ototoy 128214, disc 1 track 1; Apple Music Classical 702996203): 7:33
Median 6:00 (360 s). No recording's track is split at the sections, so the ratio is assumed: the Adagio's quarter is a third of
the Allegro's (Adagio ♩ = 60 against ♩ = 180), which gives the slow introduction about a minute (15 bars) and the threefold
chord 24 s; the Allegro fills the rest (820 quarters in about 273 s). Set with
`kit/tempomap.py "1:60:Adagio;16:180:Allegro;97:60:Adagio;103:180:Allegro"`, then `kit/dedupe_tempo.py` (4 duplicate tempo
words dropped). The import gives 226 performed bars, 357 s at score tempo (Adagio 60 s, Allegro to bar 96 108 s, chords 24 s,
Allegro 165 s), before the fermata holds: about 1.5 s under the median, as for the other pieces.

## Judgement calls and anything doubtful
- Single-chord tremolo strokes are written as held chords (the fingered two-note tremolos, bars 90–91 and 203, stay tremolos).
- Ties and slurs that pass from one voice to another in the print may not show.
- Dynamics printed between the staves are given to both hands.
- The Adagio's tempo is a proportion, not a measured value (see Tempo).
