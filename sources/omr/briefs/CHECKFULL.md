# Proofreading the full score (Mozart, Le nozze di Figaro, No. 1 Duettino bars 1-88 + Recitativo bars 89-107)

Folder /home/claude/ext/figaro/n1/. Images fc/f_barsAAA-BBB.png: ABOVE the black rule the printed scan of bars
AAA-BBB (the crop may show slivers of the system above/below: ignore them); BELOW the rule the transcription
(file cur.xml): staves S. (Susanna), F. (Figaro), Pno. (piano, two staves). First rendered bar is numbered.
Full printed pages, 300 dpi: pg-1.pgm ... pg-8.pgm (zoom with python PIL). Bars per page: p1 1-22, p2 23-36,
p3 37-47, p4 48-62, p5 63-78, p6 79-90, p7 91-98, p8 99-107. systems.json lists each system's page, bars and staff
y-ranges. List the transcription's notes and words: python3 dump.py cur.xml FIRST LAST (P1 = Susanna, P2 = Figaro,
P3 = piano; onset in quarters:pitch/duration[words]).

How the transcription is laid out (these are NOT errors):
- In the print, Figaro and Susanna sometimes share one staff (with a clef change). The transcription always gives
  Susanna her own staff (treble) and Figaro his (bass), with rests where the other sings.
- In the recitative (bars 89-107) the print repeats the sung line with German words on a second staff; the
  transcription leaves the German out entirely. Only Italian words are transcribed, on purpose.
- Instrument cue words (Viol., Fl., Str., Fag., Hö., V.Orch.), stage directions and character names are left out.
- Style: beam grouping in the sung lines, stem directions, slur shapes, spacing, placement of dynamics.
- Two syllables sung on one note are written joined (e.g. "da un" rendered with a tie mark between them).

Check EVERY bar in your range, every staff, note by note:
- pitches (key: G major bars 1-88; recitative C major from bar 89; accidentals last to the end of the bar),
  durations, dots, rests, the beat each note starts on (inner piano voices especially), chord members, ties,
  triplets, grace notes, ornaments, clef changes, dynamics (p, f, mf, mfp, sfp, fp, cresc.);
- the Italian words: every syllable on the right note, spelling exactly as printed (accents, apostrophes,
  punctuation, capitals), hyphens between syllables of one word, nothing missing or extra.

Report only discrepancies: bar, staff (S / F / RH / LH), beat, scan vs transcription, confidence (sure / likely /
unsure); confirm each 'sure' on a zoomed page crop. Finish with the number of bars checked. Do not modify files
(scratch files under /tmp are fine).
