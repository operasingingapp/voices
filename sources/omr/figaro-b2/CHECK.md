# Proofreading a corrected score against the printed page (Mozart, Le nozze di Figaro, Breitkopf vocal score)

Images: the folder named in your task holds c_barsAAA-BBB.png: ABOVE the black rule the printed bars (the crop may
show slivers of neighbouring systems: ignore them); BELOW it the transcription rendered, first bar numbered. Full
printed pages at 300 dpi: /home/claude/ext/figaro/b2/pg-NN.pgm (printed page = NN + 15). barmap.json in the same
folder gives each system's page, staves and the x-range of every bar. To list the transcription's notes exactly:
`python3 /home/claude/ext/figaro/n1/dump.py FILE FIRST LAST` (onset in quarters:pitch/duration[words]; the LAST
part is the piano, the others the singers; s=staff v=voice).

NOT errors (never report):
- The print sometimes puts two singers on one staff (with clef changes); the transcription gives each singer an
  own staff with rests where the other sings. In recitatives the print's second sung staff repeats the music with
  GERMAN words: left out on purpose. Only Italian words are transcribed.
- Instrument cue words (Str., Fag., Ob., Fl., Hö., Viol., Tutti, V. Orch., colla parte ...), stage directions,
  character names, page headings, tempo numbers.
- Style: beaming, stem direction, spacing, slur shape or exact end point, placement of dynamics, rests drawn in a
  different but equivalent way (r:q vs two eighth rests), cautionary accidentals that do not change the pitch.
- Two syllables sung on one note are joined (rendered with a small box or tie mark).

Check EVERY bar in your range, every staff, note by note: pitches (key signature, accidentals to the end of the bar),
durations, dots, rests, the beat each note starts on (inner piano voices especially), chord members, ties, triplets,
grace notes, trills/ornaments, tremolos, staccato/accents, dynamics (p, f, fp, sfp, pp, ff, cresc.), clef changes,
fermatas, and the Italian words letter by letter (accents, apostrophes, punctuation), each syllable on the right note.

Report only real discrepancies: bar, staff (singer / RH / LH), beat, "scan: … / file: …", confidence (sure / likely /
unsure). Confirm each 'sure' on a zoomed crop of the full page (python PIL). Finish with the number of bars checked.
Do not modify any file; use your own scratch folder under /tmp.
