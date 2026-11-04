# Transcribing piano bars from the printed page (Puccini, La bohème, Ricordi vocal score, Carignani reduction)
(Read NUMBERING.md in this folder first: it says which images, pages and bar numbers to use. The PIANO is the bottom two braced staves: RH upper, LH lower. ZOOM on every chord.)

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
- rest: r:DUR ; a rest that is NOT printed but needed to fill a second voice: s:DUR (hidden) ; DUR: w h q e s x (+ '.' dotted, '3' triplet member)
- suffixes after the duration, any order: ~ tie to next (same pitch; on a chord = all notes tied), * staccato,
  > accent, ! fermata, t trill (tr sign), a arpeggio (wavy line before a chord), ( slur starts on this note, ) slur ends on this note
- grace note: g:PITCH:DUR placed before its main note
- dynamics / hairpin words: put dyn:p (or f, pp, ff, fp, sfp, mf, sf) or word:cresc. as a separate token right
  before the note where it is printed
- alternating (fingered) tremolo between two notes or chords lasting DUR: trem1:A|B:DUR (eighth strokes), trem3:A|B:DUR (three strokes, 32nds) or
  trem2:A|B:DUR (sixteenth strokes), e.g. trem2:D5+F#5|A4:h ; LH trem1:D3|D4:h
- clef change: clef:F or clef:G as a token at the point where it appears
PUCCINI-SPECIFIC: tuplets other than triplets: append {n:m} to the duration (n notes in the time of m), e.g. A4:s{6:4}, E5:e{2:3}.
The piano may have three staves in places (a third staff for the orchestra's extra line): write it as RH3 (upper staff) and say so in a remark.
8va / 8va bassa / col 8 lines: write SOUNDING pitches, and remark where the sign starts and ends.
Tempo words, metronome marks, key/time changes: remark at the bar ("# bar N: ...").
Accidentals: write the sounding pitch (key signature and accidentals earlier in the bar applied).

Write your result to the file named in your task, nothing else except optional # remark lines. Do not open any
.xml file.

MARKS (added later): hairpins `hp:<` / `hp:>` where they start and `hp:end` where they stop (same line); `^` = marcato
(tall wedge), `-` = tenuto; expression/tempo words as `word:a_tempo` (underscores for spaces).
TIES ON ONE NOTE OF A CHORD: put ~ right after that pitch inside the chord: `Db4~+F4+Bb4:h.` ties only the D-flat
(a ~ after the duration ties every note of the chord).
DOUBLE SHARP / DOUBLE FLAT: write ## / bb (F##4, Bbb3), never x.
