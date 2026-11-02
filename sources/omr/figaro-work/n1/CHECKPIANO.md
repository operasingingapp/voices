# Proofreading the piano part (Mozart, Le nozze di Figaro, No. 1 Duettino + Recitativo, Klengel's piano reduction)

Folder /home/claude/ext/figaro/n1/. Images pc/p_barsAAA-BBB.png: ABOVE the black rule a crop of the printed scan for
bars AAA-BBB (the crop also shows parts of the sung staff above and the next system below: look only at the TWO
piano staves, the treble+bass pair joined by a brace, of the bars AAA-BBB); BELOW the rule the transcription's piano
part for those bars (file pcheck.xml, part P3; first rendered bar numbered).
Full printed pages, 300 dpi: pg-1.pgm ... pg-8.pgm; zoom with python PIL when anything is small. Bars per page:
p1 1-22, p2 23-36, p3 37-47, p4 48-62, p5 63-78, p6 79-90, p7 91-98, p8 99-107. systems.json lists every system:
page, bars, and the staff y-ranges (the last two staves of each system are the piano).
List the transcription's notes: python3 dump.py pcheck.xml FIRST LAST (prints per part P1/P2/P3, staff s1/s2,
voice: onset in quarters:pitch/duration; durations in quarters; ignore P1 and P2).

NOT errors: beam angles, stem directions, slur/tie curve shapes, spacing, instrument cue words (Viol., Fl., Str.,
Fag., Hö. are deliberately not transcribed), placement of dynamics.

Check EVERY bar of your range, both piano staves, every voice, note by note: pitch and octave of every notehead
(key signature: G major = F# in bars 1-88; the recitative from bar 89 has its own key signature; accidentals last to
the end of the bar), durations and dots, rests, the beat each note starts on (inner voices especially), chord
members, ties, triplets (marked 3), grace notes, trills/ornaments, staccato dots and accents are minor,
clef changes, and dynamics (p, f, mf, mfp, sfp, fp, cresc.) present in the scan and absent in the transcription or
vice versa (the transcription may contain dynamics the scan does not have, e.g. a 'p' where the scan has a '3').

Report only discrepancies: bar, staff (RH/LH), beat, scan vs transcription, confidence (sure/likely/unsure); confirm
every 'sure' on a zoomed page crop. Finish with the number of bars checked. Do not modify any files except that you
may write scratch images under /tmp.
