# Accidentals-only check

Compare EVERY printed accidental (sharp, flat, natural, double sharp/flat, including cautionary/reminder signs in
brackets or not) on every staff with the transcription, bar by bar. Also check that every note's sounding pitch
agrees with the print given the key signature and the accidentals earlier in the bar (same octave, same staff).
Images: c_bars*.png in the folder named in your task (printed bars above, transcription below). Full 300 dpi pages:
/home/claude/ext/figaro/b2/pg-NN.pgm (printed page = NN + 15); zoom (python PIL) on every accidental you are not sure
of. List the transcription's notes: python3 /home/claude/ext/figaro/n1/dump.py FILE FIRST LAST.
Report only discrepancies: bar, staff, beat, scan / file, confidence; finish with the number of bars checked.
Do not modify files; scratch in your own /tmp folder.
