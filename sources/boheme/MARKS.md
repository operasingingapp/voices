# Marks sweep: add every printed performance mark the transcription lacks (Puccini, La bohème, Ricordi vocal score)

The notes, rhythms and words of your chunk are already settled by two readers and a judge: do NOT change pitches,
durations, ties or syllables (if you are SURE one is wrong, do not fix it: list it at the end as "possible note error").
Your job is only the MARKS, for EVERY staff (each singer and both piano hands), bar by bar against the page:

1. Dynamics: p pp ppp f ff fff mf mp fp sf sfp rf ... as `dyn:X` tokens placed right before the note where the mark
   stands (sung lines too: Ricordi prints singers' dynamics by their staff). A dynamic printed between the piano staves
   goes to BOTH hands.
2. Hairpins: `hp:<` where a crescendo hairpin starts, `hp:>` where a diminuendo hairpin starts, `hp:end` where it ends
   (before the note it ends on, or at the end of the line when it runs to the bar line; a hairpin crossing bars: hp:<
   in the first bar, hp:end in the bar where it stops). Every hp:< / hp:> needs its hp:end, in the same line (same bar
   line code: same singer, or same hand and number, e.g. RH1). Between the piano staves: both hands.
3. Articulations, as suffixes after the duration (before any ( or ) ): `*` staccato, `>` accent, `^` marcato (the
   tall ^ or v wedge), `-` tenuto (the short dash). Several may combine (`*-` = portato). Sung notes too.
   Piano: `a` arpeggio (wavy line before a chord), `!` fermata.
4. Expression and tempo words printed in the music (not stage directions): cresc., cres., dim., rall., rit.,
   allarg., a tempo, col canto, a piacere, sostenuto, string., dolce, ruvido, marcato, leggero, sempre..., etc. as
   `word:TEXT` with "_" for spaces (word:a_tempo, word:col_canto), placed before the note where it stands; tempo words
   at the top of a system go on the TOP sung line present (or the RH if no singer) in that bar. Keep the print's
   spelling (cres. vs cresc.). Do NOT add the big section tempo headings already given as remarks (ALLEGRO VIVACE
   etc.) and do NOT add metronome numbers, rehearsal figures, stage directions (italic in brackets), "m.s.", "m.d.".
5. Replace any legacy `word:cresc.hairpin` with proper hp:< ... hp:end.

How: page images /home/claude/ext/boheme/pages/p-NNN.png (~280 dpi; zoom: crop + resize 3-4x; for finer detail
pdftoppm -r 400 -f N -l N /home/claude/ext/boheme/src/vs.pdf OUT -png). Scratch only in your /dev/shm folder.
Formats: TB.md (sung) and PB.md (piano) in this folder. Remarks "# page NNN system K starts bar B" tell you where
each system is. Edit the given files IN PLACE, adding tokens only; mark each changed line with a remark line before it
"# MARKS bar N CODE: what you added". Afterwards check by script that every line still adds up to its bar's metre
(tokens dyn:, word:, hp: take no time) and that every hairpin start has its hp:end.
Reply with: number of marks added by kind, anything unsure, and any "possible note error".
