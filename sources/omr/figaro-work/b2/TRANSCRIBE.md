# Transcribing the sung lines (Mozart, Le nozze di Figaro, printed pages 16-36, Breitkopf vocal score)

Images: /home/claude/ext/figaro/b2/vox/vSSS_pPP_barsAAA-BBB.png, one per system (SSS = system index, PP = printed
page). Red numbers along the top mark where each bar starts. A system may START with the end of a bar begun on the
previous system (then its first red number repeats the previous bar's number), or END with a bar that continues
on the next system: write such a bar as ONE line containing all of it (both halves, in order).
Full pages at 300 dpi: /home/claude/ext/figaro/b2/pg-01.pgm ... pg-21.pgm (printed page = file number + 15).
ZOOM whenever there is any doubt (python PIL crop + resize 3-4x): noteheads on lines vs spaces, ledger lines, dots,
flags/beams (eighth vs sixteenth), accidentals, ties vs slurs, small grace notes, accents on words.

What is sung where:
- Bars 1-144, No. 2 Duettino (2/4): Figaro (F) and Susanna (S). Staff labels F. / S. or names show who; a system
  may have one sung staff (shared, with name changes) or two (top = Susanna, bottom = Figaro).
- Bars 145-184, Recitativo (4/4): Susanna (S) and Figaro (F) share the FIRST sung staff (Italian words); names
  printed above show who sings from where, and the clef changes (treble = Susanna, bass = Figaro). The SECOND staff
  repeats the music with GERMAN words in a different rhythm: ignore it completely.
- Bars 185-198, Recitativo "Bravo, signor padrone" (Figaro, F): first staff only (Italian); second staff German:
  ignore. Watch tempo/time changes (Moderato, Andante).
- Bars 199-329, No. 3 Cavatina "Se vuol ballare" (Figaro, F): one sung staff. 3/4, with Presto sections in 2/4.
- Bars 330-351, Recitativo (4/4): Bartolo (B) and Marcellina (M) share the first sung staff (Italian); second staff
  German: ignore.
- Bars 352-455, No. 4 Aria "La vendetta" (Bartolo, B): one sung staff (Brt.).
Read the key signature and time signature from the page (they change). Accidentals last to the end of the bar in the
same octave. Write SOUNDING pitch (the tenor/bass clefs here are plain bass or treble clefs; C4 = middle C).

Write one line per bar for EVERY singer of the section (both singers in duets/recitatives), even when a singer
rests the whole bar (write `r:<full bar>` e.g. `r:h` in 2/4, `r:h.` in 3/4, `r:w` in 4/4):

  BAR SINGER: token token ...

SINGER: F, S, B or M. Tokens, in time order:
- note: PITCH:DUR    e.g. D3:q  F#4:e.  Bb4:s   (PITCH = letter, optional # / b / n (natural), octave)
- rest: r:DUR
- DUR: w h q e s x (whole, half, quarter, eighth, 16th, 32nd); '.' for dotted (q.); '3' for a triplet member (e3)
- tie to the next note: ~ right after the token (D4:h~ D4:q)
- grace note: prefix g: (g:D5:s)
- fermata: append ! to the token (C4:q!)
- words: the Italian syllable on that note in double quotes right after the note token, EXACTLY as printed (accents,
  apostrophes, punctuation, capitals). End with - when a hyphen follows (next syllable of the same word). Two
  syllables printed on one note (elision) stay together joined by _ (e.g. "da_un"). Notes under a slur/melisma
  without a new syllable get no words.
  Example: 20 F: r:e F3:e "Se_a" | (no bar separators needed)

Check every bar before writing it: durations add up to the bar's time signature, every notehead, every accidental,
every dot, every syllable. Do not open any .xml file (do not use the scanning app's reading).

Write your result to the file named in your task, bars in order, nothing else in the file except optional lines
starting with # for remarks (e.g. "# 87 F: unclear accent, read as sì").
