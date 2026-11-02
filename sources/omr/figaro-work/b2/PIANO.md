# Transcribing piano bars from the printed page (Mozart, Le nozze di Figaro, Breitkopf vocal score)

Images: /home/claude/ext/figaro/b2/vox/vSSS_pPP_barsAAA-BBB.png (one per system; red numbers on top mark where each
bar starts). The PIANO is the bottom two staves (braced): RH = upper, LH = lower. Full 300 dpi pages:
/home/claude/ext/figaro/b2/pg-NN.pgm (printed page = NN + 15). ZOOM (python PIL crop + resize 3-4x) on every chord.
Ignore the sung staves and all words; ignore instrument cue words (Str., Fl., Ob., Fag., Hö., Viol., Tutti ...).

One line per bar per voice of each staff:
  BAR RH1: tokens      (RH upper or only voice)
  BAR RH2: tokens      (only if the RH has a second, independent rhythm: stems in the other direction)
  BAR LH1: tokens
  BAR LH2: tokens      (only if needed)
Every line must add up to the bar's time signature (read it from the page; key signature too). A staff with
nothing: a full-bar rest (r:h in 2/4, r:h. in 3/4, r:w in 4/4).

Tokens in time order:
- note: PITCH:DUR (e.g. Bb4:e, F#3:q.) ; chord: PITCH+PITCH+...:DUR (e.g. D4+F4+Bb4:q), lowest first
- rest: r:DUR ; DUR: w h q e s x (+ '.' dotted, '3' triplet member)
- suffixes after the duration, any order: ~ tie to next (same pitch; on a chord = all notes tied), * staccato,
  > accent, ! fermata, ( slur starts on this note, ) slur ends on this note
- grace note: g:PITCH:DUR placed before its main note
- dynamics / hairpin words: put dyn:p (or f, pp, ff, fp, sfp, mf, sf) or word:cresc. as a separate token right
  before the note where it is printed
- alternating (fingered) tremolo between two notes or chords lasting DUR: trem1:A|B:DUR (eighth strokes) or
  trem2:A|B:DUR (sixteenth strokes), e.g. trem2:D5+F#5|A4:h ; LH trem1:D3|D4:h
- clef change: clef:F or clef:G as a token at the point where it appears
Accidentals: write the sounding pitch (key signature and accidentals earlier in the bar applied).

Write your result to the file named in your task, nothing else except optional # remark lines. Do not open any
.xml file.
