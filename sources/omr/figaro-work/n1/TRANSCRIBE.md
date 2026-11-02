# Transcribing the sung lines (Mozart, Le nozze di Figaro, No. 1 Duettino and the recitative after it)

Images: /home/claude/ext/figaro/n1/vox/v_AAA-BBB.png, one per system of the printed vocal score (Breitkopf, Klengel).
Each shows the sung staff (or staves) of bars AAA-BBB with the Italian words (upright/italic, FIRST text line)
and a German translation (SECOND text line, ignore it completely). Bar numbers are marked along the top.
Full pages at 300 dpi: /home/claude/ext/figaro/n1/pg-1.pgm ... pg-8.pgm (zoom with python PIL whenever needed;
small noteheads, dots, accidentals, flags and ties matter).

Who sings:
- Bars 20-29: Figaro alone (bass clef).
- In systems with ONE sung staff, Figaro and Susanna share it: the name printed above and the clef change show
  who sings from where (Figaro = bass clef, Susanna = treble clef).
- In systems with TWO sung staves: top = Susanna (S.), bottom = Figaro (F.).
- Bars 89-107 (Recitativo): only the FIRST sung staff (Italian words) counts; the second staff below it repeats
  the music with German words: ignore it. The names Susanna / Figaro printed above the staff show who sings.
Key: bars 1-88 G major (F#). Recitative: check the key signature on the staff (it changes). Accidentals last to
the end of the bar in the same octave. Write the SOUNDING pitch.

Write one line per bar per singer who sings (or has rests) in that bar, both singers for every bar of your range
(write `r:w` for a bar a singer has a whole-bar rest, also when that singer's staff is absent in the system):

  BAR SINGER: token token ...

SINGER is S or F. Tokens, in time order:
- note: PITCH:DUR    e.g. D3:q  F#4:e.  Bb4:s   (PITCH = letter, optional # or b or n (n = natural), octave; C4 = middle C)
- rest: r:DUR
- DUR: w h q e s x (whole, half, quarter, eighth, 16th, 32nd); add '.' for dotted (q.), '3' for a triplet member (e3)
- tie to the next note: add ~ right after the token (D4:h~ D4:q)
- grace note: prefix g:  (g:D5:s)
- words: put the Italian syllable sung on that note in double quotes right after the note token, exactly as
  printed (keep accents, apostrophes and punctuation). End the syllable with - when a hyphen follows to the next
  syllable of the same word. Two syllables printed on one note (elision, e.g. "da un", "ch'io") stay together on
  that note as printed, joined by _ (e.g. "da_un"). Notes held under a slur without a new syllable get no words.
  Example: F#4:q "Guar-" G4:e "da_un" A4:e "pò,"

Example line:  24 F: r:q C4:q "ven-" A3:q "ti..." r:q

Check every bar twice before writing: count that the durations add up to 4 quarter notes (the whole piece is in
4/4), every notehead's line/space, every accidental, every dot, every word.
