# (Read NUMBERING.md in this folder first: it says which pages, which bars and the SINGER codes.)
# Transcribing the sung lines (Puccini, La bohème, Ricordi vocal score, Carignani reduction)

ZOOM whenever there is any doubt (python PIL crop + resize 3-4x): noteheads on lines vs spaces, ledger lines, dots,
flags/beams (eighth vs sixteenth), accidentals, ties vs slurs, small grace notes, accents on words.

Read the key signature and time signature from the page (they change). Accidentals last to the end of the bar in the
same octave. Write SOUNDING pitch (C4 = middle C; a tenor line printed in treble clef sounds an octave lower: write the sounding pitch).

Write one line per bar for EVERY singer of the section (both singers in duets/recitatives), even when a singer
rests the whole bar (write `r:<full bar>` e.g. `r:h` in 2/4, `r:h.` in 3/4, `r:w` in 4/4):

  BAR SINGER: token token ...

SINGER: the codes in NUMBERING.md. Write a line for every singer who sings anywhere on your pages, in every bar, resting ones included. Tokens, in time order:
- note: PITCH:DUR    e.g. D3:q  F#4:e.  Bb4:s   (PITCH = letter, optional # / b / n (natural), octave)
- rest: r:DUR
- DUR: w h q e s x (whole, half, quarter, eighth, 16th, 32nd); '.' for dotted (q.); '3' for a triplet member (e3)
- tie to the next note: ~ right after the token (D4:h~ D4:q)
- grace note: prefix g: (g:D5:s)
- fermata: append ! to the token (C4:q!) ; trill sign (tr): append t (C4:qt)
- words: the Italian syllable on that note in double quotes right after the note token, EXACTLY as printed (accents,
  apostrophes, punctuation, capitals). End with - when a hyphen follows (next syllable of the same word). Two
  syllables printed on one note (elision) stay together joined by _ (e.g. "da_un"). Notes under a slur/melisma
  without a new syllable get no words.
  Example: 20 F: r:e F3:e "Se_a" | (no bar separators needed)


PUCCINI-SPECIFIC (in addition to the above):
- Tuplets other than triplets: append {n:m} to the duration = n notes in the time of m of that value, e.g. a
  sextuplet of 16ths D5:s{6:4}, a quintuplet E5:s{5:4}, a duplet in 6/8 C4:e{2:3}. ('3' alone = {3:2}.)
- Metronome marks, tempo words (ALL.º, AND.te, rall., a tempo, col canto, sostenuto ...), key and time changes:
  write a remark at the bar where they appear: "# bar N: ALL.º VIVACE, dotted-quarter = 108, 3/8, C major".
- Spoken or half-spoken notes (parlato, cross noteheads), "a piacere", "ad lib.": remark at the bar; still write the
  rhythm as printed.
- Staccato/accent on sung notes: append * or > after the duration, like the piano.
- Words: Italian only, exactly as printed (Ricordi spellings, accents, apostrophes, punctuation, capitals). Ignore
  any other language and all stage directions (but remark briefly where a stage direction says who sings, e.g.
  "(a Rodolfo)" is not needed; "(dall'interno)" offstage is worth a remark).

Check every bar before writing it: durations add up to the bar's time signature, every notehead, every accidental,
every dot, every syllable. Do not open any .xml file (do not use the scanning app's reading).

Write your result to the file named in your task, bars in order, nothing else in the file except optional lines
starting with # for remarks (e.g. "# 87 F: unclear accent, read as sì").

- Shouted notes printed without noteheads (stems and flags only, "gridato"): write the rhythm with the pitch X
  (e.g. X:e "Le-") and remark it; if an accidental or the position clearly shows a pitch, write that pitch instead.
- A printed alternative line for the singer (ossia, "Opp.", small notes): write the MAIN line on the singer's line
  and the alternative on an extra line with the singer code followed by 2 (e.g. "42 R2: ..."), only in the bars it
  covers; remark it.

MARKS (sung lines, added later): put each printed dynamic as a token `dyn:p` (f, pp, mf, ...) right before its note;
hairpins `hp:<` / `hp:>` where they start and `hp:end` where they stop; articulations as suffixes after the duration:
`*` staccato, `>` accent, `^` marcato, `-` tenuto; expression/tempo words printed by the staff as `word:a_tempo`
(underscores for spaces). Pitch is ABSOLUTE (sounding): a bare letter means a natural; write flats/sharps from the key
signature explicitly (Bb4 in B-flat major).
DOUBLE SHARP / DOUBLE FLAT: write ## / bb (F##4, Bbb3), never x.
