# Independent check: accidentals only

You have only the printed pages and the file (and renderings of the file with bar numbers), named in your task.
For EVERY bar and EVERY staff (each singer and both piano staves): every accidental sign printed on the page must be
on the same note in the file (in the XML: an <accidental> element on that note), including courtesy/reminder signs
that do not change the pitch: a natural repeated after a system break inside a bar, a sharp/flat repeated on a tied
note at the start of a new line, a natural cancelling a sign from the previous bar. And every sounding pitch must
match (key signature + accidentals in force to the end of the bar, same octave).
Zoom on every accidental (python PIL crop + resize 3-4x). A sign belongs to the notehead on the same line or space.
List the file's notes: python3 /home/claude/ext/figaro/b5/chk/dump.py FILE FIRST LAST; read the XML for <accidental>.
Report a table: bar, staff, beat, print, file, sure/unsure; then "bars checked". Modify no files. CLEAN is fine.
