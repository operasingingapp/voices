# Independent check: each singer's own line

You have only the printed pages and the file. In the file every singer has their own part (staff). In the print,
several singers often share one staff, and the speaker's name is printed above their entry. Check, for EVERY singer
part in the file, from its first bar to its last:
1. Who sings: every printed entry is in the part of the singer named in the print, and nothing is in the wrong
   singer's part. No sung phrase is missing, and none appears twice.
2. The melody: every pitch (with clef, key signature and accidentals in force), rhythm, rest and the beat each note
   starts on. A man's line printed in treble clef sounds an octave lower: check the file's octave is the sung one.
3. The words: every syllable, its spelling, accents and apostrophes, and the note it sits on.
4. Where singers sing together, each part has its own notes (for a chorus: soprano/alto from the upper staff's upper
   and lower stems, tenor/bass likewise below; a shared notehead belongs to both).
The piano is NOT part of this check. German words and the German duplicate staff are left out on purpose.
Confirm every finding on a zoomed crop (python PIL crop + resize 3-4x). Note dump of the file:
python3 /home/claude/ext/figaro/n1/dump.py FILE FIRST LAST (P1.. = parts in order; [words]).
Report a table per singer: bar (file numbering), beat, print, file, sure/unsure; or "correct" for that singer.
Modify no files. CLEAN is a fine answer.
