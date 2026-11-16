# Zauberflöte batch 1: arias and songs (S05, S07, S09, S25, S32, S36, S40, S46)

Edition Peters vocal score (Kogel, plate 7794, IMSLP #225460). Each folder: the MusicXML, the checked VM_/PM_ text it
was built from, and REPORT.md. Method for every piece: two readers + judge + marks sweep + build + fresh check until clean.

## Strophic pieces (S05, S32, S36)
Verses are MusicXML lyric numbers 1, 2 (3) on one set of notes, with syllabic, elisions and extends per verse. The print's
segno / D.S. (signs only, no words in all three) is written as a forward repeat at the segno and a backward repeat with
times = number of verses at the end. No piece needed 1st/2nd endings. S32 was not in the original list of strophic pieces
but is printed the same way, so it got the same treatment. S36: the segno double bar falls inside printed bar 3, so that
bar is written as two bars (3/8 + 1/8); from there the file's numbering is the print's + 1 (in its REPORT).

## Kit changes (scripts in _kit_changes/)
- mk6.py: `"v1|v2|v3"` syllables per note -> lyric numbers; lyricist Schikaneder and the Peters rights line.
- finish2.py: extends worked out per verse.
- NEW repeats.py (repeat barlines, times, endings), hidetime.py (partial bars' time signatures not printed),
  clef0fix.py (a clef token at the very start of bar 1 replaces the opening clef), fixtup.py (tuplets such as nine 64ths
  in the time of eight get exact bar totals, backups kept in step), tempodedupe.py (no duplicate tempo words after
  tempomap.py), barsum.py (exact bar-length check of the XML), words.py (sung text per part/verse), mkpiece.sh (the
  whole build chain).
- pickup.py takes the pickup and real metre as optional arguments (1/16 pickups in S07, S36).

## Open points
- Words were checked against the print only. The comparison with the DME libretto (LV_421) could not be run: that
  site is not reachable from this session. Attach LV_421.pdf and I will add the libretto differences to each REPORT.
- Tempos are estimates (no recording timings were gathered).
