# Checking the Italian words letter by letter (Mozart, Le nozze di Figaro, No. 1 + Recitativo)

Folder /home/claude/ext/figaro/n1/. words.txt lists, bar by bar and singer by singer, the Italian syllables in the
transcription, one per sung note, in order (a trailing - means the word continues on the next note; ‿ joins two
syllables sung on one note). Printed pages, 300 dpi: pg-1.pgm ... pg-8.pgm; systems.json gives each system's page,
bars and staff y-ranges (sung staves come first in each system; in the recitative, bars 89-107, only the FIRST
staff of each system has Italian words: the second staff repeats the music in German, ignore it). vox/v_AAA-BBB.png
show the sung staves with bar numbers marked.

For every bar in your range, read the Italian words in the print at HIGH zoom (crop and enlarge 3-4x with python PIL:
small italic accents are easy to mistake: a grave accent on i (ì) is a short slanted stroke, a plain dot on i is
round) and compare letter by letter with words.txt: spelling, accents (à è é ì ò ù), apostrophes, capitals, commas,
full stops, question/exclamation marks, semicolons, ellipses (...), and that each syllable sits on the right note
(count notes against syllables). Hyphenation choices are fine as long as the letters and their order match.

Report only differences: bar, singer, the word as printed vs as transcribed, confidence (sure/likely/unsure).
Finish with the number of bars checked. Do not modify files.
