# S17 — Die Zauberflöte, No. 8 Finale: Tamino's scene "Die Weisheitslehre dieser Knaben"

Edition Peters vocal score (Kogel, Leipzig, plate 7794), batch 3, Nov 2026.

- **Printed pages:** 53 (system 2, bar 4: "Recit." after the double bar) – 60 (system 4: fermata and double bar before the
  flute Andante "Wie stark ist nicht dein Zauberton"); PDF 57–64. Read in two chunks, S17a (pp. 53–56) and S17b (pp. 57–60),
  stitched with no shared bars.
- **Shape:** 121 bars of 4/4, no key signature throughout (C major / A minor written with accidentals). Tempo words as printed:
  Recit. (1), Allegro (12), Allegro assai (18), Adagio (47), Recit. (48), Andante. a tempo (50), a tempo Adagio (55), Recit.
  (56), Andante. a tempo (99), Andante. (105, the offstage chorus). Bar 121 has only three beats as printed (quarter, quarter
  rest, two eighth rests with the fermata); its 3/4 time is hidden (`kit/hidetime.py s17.xml 121`, post.txt). Fermatas in
  bars 3, 27, 28, 68 (Tamino) and 121.
- **Singers:** T = Tamino (printed in the treble clef, written here at sounding pitch an octave lower); R = the Speaker (the
  print's "Priester", bass clef); K3/K3b/K4/K4b = the offstage chorus "Chor (von innen)", tenors I and II, basses I and II,
  sotto voce, bars 105–113 (printed on two staves). K4 also carries the offstage voice "Eine Stimme (von innen)" that calls
  "Zurück!" (bars 32–33 and 39–40, f, printed on Tamino's staff in the bass clef).
- **SEGS:** `1/4/4/0/Recit.;12/4/4/0/Allegro;18/4/4/0/Allegro assai;47/4/4/0/Adagio;48/4/4/0/Recit.;50/4/4/0/Andante. a tempo;55/4/4/0/a tempo Adagio;56/4/4/0/Recit.;99/4/4/0/Andante. a tempo;105/4/4/0/Andante.;121/3/4/0/`
- **SINGERS:** `T:Tamino:Tam.:G/2/-1,R:Sprecher:Spr.:F/4,K3:Chor Tenor I:T. I:G/2/-1,K3b:Chor Tenor II:T. II:G/2/-1,K4:Chor Bass I:B. I:F/4,K4b:Chor Bass II:B. II:F/4`
- **Process:** two readers + judge per chunk + marks sweep + stitch + fresh check with fixes applied until clean.
- **Shared bars:** none. S16 ("Zum Ziele führt dich diese Bahn") ends on the piano's chord before "Recit."; S18 starts after
  the double bar at the end of p. 60. No syllable carries over at either end.

## Build
`kit/cleanv.py` + `kit/build.sh` + `fix64.py` + `clef0fix.py` + `fixtup.py`, then `kit/hidetime.py s17.xml 121` (post.txt),
then `kit/xfix.py` with xfix.txt (`final`). Reproduced here from VM_S17.txt / PM_S17.txt / segs.txt / singers.txt / xfix.txt:
VM_S17.clean.txt, s17.raw.xml and the final s17f.xml (= S17_Finale_-_Die_Weisheitslehre_dieser_Knaben.musicxml) byte for
byte. 0 missing required accidentals; every bar of every part adds up (barsum 0 problems).

## Fresh-check fixes (applied before the final build)
- Bar 24 piano RH: the C♯5 carried through two chords.
- Bar 26 piano RH: the F in the D major scale run is printed without a sharp; F♯5 is written (a corrected misprint).
- Bar 63 piano RH: C4+E♭4+G4 (the flat carried).
- Bars 36 and 58 (Tamino), 60 (Speaker): notes split only for the Italian syllables merged back into the German note.
- Marks sweep / fresh check: bar 46 no staccato on the first note (slur end only); bar 86 the Speaker's "doch" is a dotted
  note (shared head with the Italian); bar 105 one A3 head with two stems = both basses.

## Words
Kept as printed: "Es zeigen die Pforten" (DME libretto "Doch zeigen"), "in dem Weisheitstempel" (DME "in der Weisheit Tempel"),
Tamino's "Sarastro wohnet hier?" (a question), "So gieb" (DME "Nun gib"), "das Gram und Jammer" (DME "die"), "jetzund" (DME
"itzund"), "alles" with a small a, and the old spellings Thätigkeit, Müssiggang, muthig, Thür, Heiligthum, Eigenthum, thut,
Räthsel, theurer. The music's repeats: "Paminen retten, Paminen retten" (bars 27–29), Tamino's "Zurück! Zurück!" (33–35),
"Bald, bald, bald, sagt ihr;" (107–108), "Sie lebt? sie lebt?" (113–114), "wie er hier hier entsprang" (bar 120, "auf's Herz
deutend"); the chorus "Bald, bald, Jüngling, oder nie." and "Pamina, Pamina lebet noch." German only; the Italian
translation, the notes printed only for it (many bars: see the "# bar" and "# JUDGE" remarks) and the stage directions are
left out.

## Tempo
Section tempi (quarters per minute): Recit. 60, Allegro 100, Allegro assai 136, Adagio 36, the Speaker's Recit. 46, Andante
48 (bars 50, 99, 105), a tempo Adagio 36: 496 s at score tempo (8:16) before the fermata holds. Basis: the median of five
complete recordings whose tracks hold exactly this section (from "Die Weisheitslehre" to "wie er hier entsprang", before
"Wie stark ist nicht dein Zauberton"), from streaming / store track lists:
  - Norrington, London Classical Players (EMI/Warner): 7:14 (one track)
  - Jacobs, Akademie für Alte Musik Berlin (Harmonia Mundi, 2010): 7:16 (one track)
  - Böhm, Vienna PO (Decca, 1955): 1:55 + 6:24 = 8:19
  - Haitink, Bavarian Radio SO (EMI, 1981): 1:58 + 6:28 = 8:26
  - Christie, Les Arts Florissants (Erato, 1995): 8:43 (one track)
Median 8:19 (499 s). Also seen: Wåhlberg, Orkester Nord (2025) 8:40 and Colin Davis (live, 2014 release) 7:12 + 1:57 = 9:09;
with them the median of seven is 8:26. Not used: Klemperer 1964 (10:04, the finale's first sections on one track), Abbado 2005
(9:00, "No. 8 a–c"), Toscanini 1937 (10:16, a track that runs on). The split between Tamino's part (bars 1–47) and the Speaker's
scene (48–121) follows Böhm's and Haitink's tracks (1:55, 1:58 → about 116 s for bars 1–47); the relations between the
sections are this app's choice. Set with `kit/tempomap.py` (no rit./rall. in the print, so no ramps) and `kit/tempodedupe.py`.

## Judgement calls and anything doubtful
- Bar 56: the Speaker's last eighth and Tamino's first sixteenth overlap by a sixteenth, as printed (recitative); each line is
  kept as printed.
- Bar 121: three beats only, as printed (time hidden).
- Recitative bars throughout carry stacked Italian notes and rests; the German line was read from its own stems (see the
  "# JUDGE" remarks in VM_S17.txt), e.g. bars 2, 4, 10, 26, 29, 36, 42, 48, 49, 103, 104, 108, 110, 117.
- Bar 106 Bass II "bald," lower notes a cluster, read F3; bar 112 an extra eighth chord at the end of the chorus bar (Italian)
  is not counted.
