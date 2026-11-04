# Independent final check of a corrected score against the printed page

You are a fresh proofreader. You have NOT seen any earlier work. Your job: find real differences between the printed
score (scan) and the transcription. The user said explicitly: "if it's good it's good, don't invent problems that don't
exist". A clean report is a perfectly good outcome. Do not pad the list. Every item you report must be something you
looked at on a zoomed crop of the scan and are sure about.

## NOT errors (never report these)
- Layout, spacing, stem direction, beam grouping, slur/tie curve shape or exact end point (a slur over the same notes is
  fine even if drawn shorter/longer), position of dynamics above/below, clef placement within a few notes when the
  pitches are right, courtesy accidentals that are present in one but not the other IF the pitch is unambiguous anyway
  (do report a printed accidental that changes the pitch and is missing, or a wrong pitch).
- Words/text that are deliberately left out: stage directions (italic text in brackets), character names, the tempo number,
  rehearsal figures, page headings, the 'due Ped.' / pedal marks, 'm.s.'/'m.d.'.
- Slurs in the SUNG lines are not checked (the app draws its own); piano slurs ARE checked.
- Rodolfo (and any tenor) is printed in plain treble clef but sounds an octave lower: the render shows a treble clef with
  a small 8 below and the SAME note positions. The dump lists sounding pitch (e.g. printed E5 = E4 in the dump). Not an error.
- 8va lines in the piano may be written out at sounding pitch in the render (a note an octave higher with no 8va line
  is fine IF it matches the print's sounding pitch).
- In vocal scores: the transcription gives each singer their own staff with rests where the other sings, even where the
  print puts both on one staff. Two syllables sung on one note are joined (shown with a small box or tie mark: OK).
- Rendering artefacts of the bottom image (a box glyph for an elision, odd spacing).

## DO check, note by note, every bar in your range, every staff
pitches (with key signature; accidentals last to the end of the bar), durations, dots, rests, which beat each note
starts on (inner voices!), chord notes, ties (same pitch joined), triplets, grace notes, trills, tremolo strokes,
staccato dots, tenuto, accents, marcato, arpeggios, dynamics on EVERY staff including the singers' (p, pp, f, ff, fp,
sfp), hairpins (< >: start and end roughly right), expression/tempo words printed in the music (cresc., dim., rall.,
a tempo, col canto, a piacere, dolce ...), clef changes, and (vocal) every syllable: spelling,
accents (sì/si, è/e, pò, più), apostrophes, punctuation, which note it sits on.

## How
Scan pages: /home/claude/ext/boheme/pages/p-NNN.png (printed page number = NNN, about 280 dpi). Transcription
renders, one image per printed system: the folder given in your task, named pPPP_sS_barsA-B.png (page, system, bars).
Compare each system of the page with its render. For any doubt zoom the page (python PIL crop + resize 3-4x) rather
than trusting the small image. To list the transcription's notes exactly:
`python3 /home/claude/ext/figaro/n1/dump.py FILE FIRST LAST` (onset in quarters:pitch/duration; parts P1.. in the
order of the render's staves; s=staff v=voice; [words]).

## Report
For each real difference: bar, staff (RH/LH or singer), beat, "scan: … / file: …", and that you confirmed it zoomed.
Things you noticed but are NOT sure of go in a short separate list marked "unsure" (keep it short; no style points).
End with: number of bars checked, and "CLEAN" if you found nothing. Do not modify any file (use /tmp for scratch).
