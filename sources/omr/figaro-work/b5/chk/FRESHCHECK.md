# Independent final check of a corrected score against the printed page

You are a fresh proofreader. You have NOT seen any earlier work. Your job: find real differences between the printed
score (scan) and the transcription. The user said explicitly: "if it's good it's good, don't invent problems that don't
exist". A clean report is a perfectly good outcome. Do not pad the list. Every item you report must be something you
looked at on a zoomed crop of the scan and are sure about.

## NOT errors (never report these)
- Layout, spacing, stem direction, beam grouping, slur/tie curve shape or exact end point (a slur over the same notes is
  fine even if drawn shorter/longer), position of dynamics above/below, clef placement within a few notes when the
  pitches are right, an accidental shown in the file that the print does not have when the pitch is the same (do report
  EVERY printed accidental missing from the file, courtesy/reminder signs included, and any wrong pitch).
- Words/text that are deliberately left out: instrument cue words (Str., Fag., Ob., Fl., Viol., V. Orch., Volles Orch.,
  Klar., Hö., Vcl.), German words, stage directions, character names, the tempo number, page headings.
- In vocal scores: the transcription gives each singer their own staff with rests where the other sings, even where the
  print puts both on one staff. Two syllables sung on one note are joined (shown with a small box or tie mark: OK).
- Rendering artefacts in the renderings (a box glyph for an elision, odd spacing).

## DO check, note by note, every bar in your range, every staff
pitches (with key signature; accidentals last to the end of the bar), durations, dots, rests, which beat each note
starts on (inner voices!), chord notes, ties (same pitch joined), triplets, grace notes, trills, tremolo strokes,
staccato dots/tenuto, dynamics (p, pp, f, ff, fp, sfp, cresc.), clef changes, and (vocal) every syllable: spelling,
accents (sì/si, è/e, pò, più), apostrophes, punctuation, which note it sits on.

## How
Inputs (named in your task): the printed pages (300 dpi), the file, and renderings of the file with a bar number
over every bar. Find each bar on the page yourself; for any doubt zoom the page (python PIL crop + resize 3-4x)
rather than trusting a small image.
notes exactly: `python3 /home/claude/ext/figaro/b5/chk/dump.py FILE FIRST LAST` (onset in quarters:pitch/duration; parts
P1.. ; s=staff v=voice; [words]).

## Report
For each real difference: bar, staff (RH/LH or singer), beat, "scan: … / file: …", and that you confirmed it zoomed.
Things you noticed but are NOT sure of go in a short separate list marked "unsure" (keep it short; no style points).
End with: number of bars checked, and "CLEAN" if you found nothing. Do not modify any file (use /tmp for scratch).
