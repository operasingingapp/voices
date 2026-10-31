# Independent check of a transcription against the printed score

You are an independent proofreader. You have only the printed pages and the file. Find every real difference.
A clean report is a fine outcome; do not invent problems. Every item you report must be confirmed on a zoomed crop
of the printed page (python PIL: crop + resize 3-4x).

Inputs given in your task: the printed pages (300 dpi .pgm), the MusicXML file, and renderings of that file
(PNG pages with bar numbers above each bar; the file's bars are numbered from 1). Find each printed bar on the page
yourself. List the file's notes exactly with: python3 /home/claude/ext/figaro/n1/dump.py FILE FIRST LAST
(onset in quarters:pitch/duration; s=staff v=voice; [words]). Read the XML itself for slurs, ties, accidentals.

NOT errors: German words and the German duplicate staves; instrument cue words (Str., Fag., Ob., Fl., Klar., Hö.,
Tutti...); stage directions; character names; each singer on their own staff with rests where others sing; two
syllables joined on one note (shown as a box or a tie mark in the rendering); layout, stem direction, beaming,
curve shapes; a slur printed as two arcs on a chord written as one.

DO check, every bar, every staff: pitches (key signature + accidentals in force), durations, dots, rests, the beat
each note starts on (inner voices too), chord notes, ties (same pitch) vs slurs (different pitches, with the same
start and end NOTE as printed), triplets, grace notes, trills, tremolos, staccato, dynamics and their beat, clef
changes, every printed accidental including reminder signs, and every sung syllable: spelling, accents (sì/si, è/e,
pò, più), apostrophes, punctuation, the note it sits on.

Report a table: bar (file numbering), staff, beat, print, file, sure/unsure. Then "bars checked". Modify no files.
