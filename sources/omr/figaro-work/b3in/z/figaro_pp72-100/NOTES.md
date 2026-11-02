# Le nozze di Figaro, Breitkopf vocal score (Ed. Breitkopf 1716, Klengel), printed pages 72-100

Eight numbers, one `.musicxml` and one words `.json` each (same base name):

| File | Pages | Bars | Singers |
|---|---|---|---|
| Recit_after_No07_Basilio_in_traccia_tosto | 72-74 | 24 | Conte, Susanna, Basilio, Cherubino |
| No08_Coro_Giovani_liete | 74-76 | 40 | Chorus S, A, T, B |
| Recit_after_No08_Cos_e_questa_commedia | 76-79 | 35 | Conte, Figaro, Susanna, Coro (Tutti) |
| No08_Coro_Giovani_liete_reprise | 79-81 | 32 | Chorus S, A, T, B |
| Recit_after_No08_Evviva | 81-83 | 28 | Figaro, Susanna, Basilio, Cherubino, Conte |
| No09_Aria_Non_piu_andrai | 84-89 | 115 | Figaro |
| No10_Cavatina_Porgi_amor | 90-91 | 51 | Contessa |
| Recit_after_No10_Vieni_cara_Susanna | 92-100 | 99 | Contessa, Susanna, Figaro |

Bars are numbered from 1 in every file. Each piano part has two staves. Every singer has their own part, with rests where another singer has the music. Italian words only.

## How it was made

- **Sung lines:** two independent transcriptions from the PDF, diffed. Every difference was settled on a zoomed crop.
- **Libretto:** every sung word was checked against the Da Ponte libretto. Where the print differs, the print was kept (see below).
- **Piano:** transcribed twice independently and diffed with `pdiff.py`; every difference was settled on the page. The scanning app's XML was too garbled to keep for any staff, so nothing in these files comes from it. Your `next 11` had no XML (Evviva recitative, pp. 81-83); that made no difference, because that number was done from the PDF alone like the rest.
- **Checks:** three full rounds of note-by-note checks. The third round was clean. Then an accidentals-only round and a slur/reminder-accidental round, both fixed. Then a final fresh check by agents that had not seen the work (all clean; see the last fix below).
- **Missed by the checks:** the accidentals round caught a wrong note that the full rounds had passed (recit "Vieni, cara Susanna", bar 58, Figaro "na" = A natural, not B). It also caught about 40 printed reminder signs that were missing.

## Tempos (`<sound tempo>`, quarter-note bpm)

Basis: track durations of complete recordings. Muti/Vienna Phil. (EMI 1987); Gui/Glyndebourne (EMI); Nézet-Séguin/COE (DG 2015); Jacobs/Concerto Köln (HM 2004); Karajan/Vienna Phil. (Opera d'Oro) where its tracks are separate. Tempo = beats in the number ÷ median seconds × 60. Track times include short gaps, so these tempos are slightly low.

| Number | Recordings (m:ss) | Median | Tempo |
|---|---|---|---|
| Recit Basilio, in traccia (96 beats) | Muti 0:53, Gui 0:55, Jacobs 1:02, N-S 1:04 | 58.5 s | quarter = 98 |
| No. 8 Coro (240 eighths = 120 quarters) | Jacobs 1:07, N-S 1:08, Muti 1:16, Gui 1:25 | 72 s | quarter = 100 (dotted quarter = 67) |
| Recit Cos'è questa commedia (140 beats) | Muti 1:14, N-S 1:26, Jacobs 1:34 (Gui combines it with the chorus) | 86 s | quarter = 98 |
| Coro reprise (96 quarters) | N-S 0:53, Jacobs 0:54, Muti 1:03 | 54 s | quarter = 107 |
| Recit Evviva (112 beats) | Muti 1:06, Gui 1:07, N-S 1:11, Jacobs 1:16 | 69 s | quarter = 97 |
| No. 9 Non più andrai (460 beats) | Karajan 3:39, N-S 3:42, Muti 3:45, Gui 3:51, Jacobs 3:56 | 3:45 | quarter = 123 (half = 61) |
| No. 10 Porgi, amor (102 quarters) | Jacobs 3:26, Karajan 3:32, N-S 3:53, Gui 4:17 | 222.5 s | quarter = 27.5 (eighth = 55) |
| Recit Vieni, cara Susanna | Gui 3:02, N-S 3:28, Jacobs 4:02 | 208 s | recitative quarter = 103; Presto (bars 15-21) quarter = 176; Allegretto (bars 88-99, "Se vuol ballare") quarter = 130 |

- **Vieni, cara Susanna:** the Presto and Allegretto tempos are the kit's tempos for No. 3 (the same music). The rest of the median time gives the recitative tempo. Karajan's track for this number (4:53) was left out, because it probably runs into the next scene.
- **Printed tempo words:** Allegro (No. 8, the reprise, No. 9), Larghetto (No. 10), Presto, Allegretto.

## Judgement calls

- **Barlines:**
  - p. 99: bar 80 of "Vieni, cara Susanna" is one 4/4 bar over the system break ("Nel nostro caso…" / "Quand'egli è per-"). That makes 99 bars, not 100.
  - p. 90: No. 10 has 51 bars. A tied chord in bar 9 is not a barline.
- **Bars printed half a beat too long** ("Vieni, cara Susanna", Figaro):
  - Bar 32 ("Naturalissima"): the closing quarter rest is made an eighth rest.
  - Bar 41 ("d'onor, ch'ei le destina"): the first note "nor," (printed quarter) is made an eighth.
- **Tenor written in treble clef:** Basilio is printed in plain treble clef (in "Basilio, in traccia" and "Evviva"). His part uses a treble-8 clef: same written notes, sounding an octave lower.
- **Two singers on one staff:** in "Evviva", bar 18, Susanna and Figaro share the treble staff. Figaro's notes are written an octave lower in his own bass-clef part.
- **Chorus:**
  - The print's two staves are split into Soprano/Alto (treble) and Tenor/Bass (bass clef). Upper stems go to S/T, lower stems to A/B. A single shared notehead is given to both voices.
  - The reprise differs from No. 8 in three places, and each file follows its own page: alto last eighth of bar 1 vs No. 8 bar 9; LH bar 10 vs 18; LH bar 20 vs 28.
- **Word placement:** where the print squeezes text, syllables were placed by Italian syllabification and by where the words stand under the notes. Spelling was never changed. Two syllables printed under one note are joined as an elision (shown as ‿ in the IPA). Words printed whole under one note are kept whole, e.g. "era" ("Basilio, in traccia", bar 8) and "arri-" (bar 11).
- **Speakers follow the print:** "E dove è il tempo?" is sung by the Contessa, as printed ("Vieni, cara Susanna", bar 81). The libretto gives it to Susanna.
- **Tie or slur:**
  - No. 9, bars 20→21 and 22→23, LH: the A4 is tied (same pitch).
  - No. 10, bar 24, Contessa: the B-flat is tied, and the slur starts on the tied-to note.
- **Hairpins:** written as wedges where printed ("Vieni, cara Susanna", bars 16-18 crescendo; bar 68 diminuendo). The printed words "cresc.", "ten." and "p assai" are kept as words.
- **Reminder accidentals:** all printed courtesy and reminder signs are shown, including signs repeated on tied notes at a system break. Signs printed in brackets are shown without brackets.
- **Left out on purpose:** German text and the German duplicate staves, instrument cue words (Str., Fag., Ob., Fl., Klar., Hö., Bl., Tutti …), stage directions, character labels, and the dynamics printed on the sung staves of the recitatives (none in the arias).

## Possible misprints in the print

The files follow the print in every case below unless stated.

**Music**

- **No. 8 bar 29, RH:** a round blot on D5 under the trilled C6. It is not in the same figure in bars 2, 10 and 32 or in the reprise, so it was treated as an ink spot and left out.
- **No. 10 bar 38, RH (bassoon line):** a flat printed at G4 (G-flat) under A natural. Kept as G-flat; it may be meant as G.
- **Recit "Cos'è questa commedia" bar 14, RH:** the lower flat is printed low (at C4). It was read as the A-flat chord C4–E-flat4–A-flat4.
- **No. 9 bars 99, 109, 111:** the triplets have no printed "3" (bar 97 has it). They are written as triplets, matching bar 97.
- **No. 10 bar 42, LH:** two chords are beamed as eighths but must be 16ths to fit the bar. Written as 16ths.

**Text** (compared with the Da Ponte libretto; the print kept unless stated)

- "Basilio, in traccia": "tosto" (libretto: subito); "io vò che veda" (libretto: vo' ch'ei veda); "quì"; "pian" (libretto: piano); "si nascose" (libretto: ei si nascose).
- No. 8 / reprise: "Giovani lieti" (libretto: liete).
- "Cos'è questa commedia": the opening ends with a full stop, not a question mark. Also "coprir di questo" (libretto: questa, agreeing with "vesta"), "ne miei" / "de miei" without apostrophe, and "Della" (libretto: De la).
- "Evviva": "si bello" without accent (sense: sì); "perchè".
- No. 9: "leggiero" (libretto: leggero), "poffar Bacco" (poffarbacco), "colle nevi" (con le), "all' orecchio" (a l'orecchio), "o un gran casco, un gran turbante" (libretto: un gran casco o un gran turbante).
- "Vieni, cara Susanna":
  - "ven-nè a" (venne a; the grave accent looks spurious);
  - "ricuperar." has a full stop mid-sentence;
  - "imbarazzarlo confonderlo" has no comma;
  - "frastonarci" (frastornarci);
  - "sopporrà" (s'opporrà);
  - "attendati in giardino" (libretto: t'aspetti nel giardino);
  - "in sua vece" (libretto: tua);
  - "sorpresa" (libretto: sorpreso; it refers to Monsù);
  - "cosi" and "si" without accents;
  - "chitarino" (chitarrino);
  - "segreta" (secreta) and "Al fin" (Alfin) are edition spellings.

## Words files

These follow the format of `example/language_example_cinque.json`: phrases per singer with startMeasure, IPA, word glosses and a translation.

- **Phrase length:** at most 14 words. Phrases end at rests and at sentence ends, and runs of repeated text are split at each musical repeat.
- **No orphaned elisions:** no phrase starts with a word elided onto the previous phrase.
- **startMeasure:** every phrase's startMeasure was checked against the score (the first syllable of the first word is in that bar, in that singer's part).
- **Chorus:** the four chorus parts carry the same text, each in its own phrases.
