# S53 — Die Zauberflöte, No. 21 Finale (Act 2), "Nur stille, stille, stille, stille!" (Monostatos, the Queen of the Night and the three Ladies)

Edition Peters vocal score (Kogel, Leipzig, plate 7794, IMSLP #225460), 26 Nov 2026.

- **Printed pages:** 155 system 1 (after the double bar that ends Papageno and Papagena's duet, S52: "Verwandlung. Felsengegend.
  Es ist Nacht.", Più moderato, alla breve, three flats) – 159 system 2 (bar 74, the last bar of the system; system 3, the piano's
  forte before Sarastro's "Die Strahlen der Sonne", begins S54; no double bar between them)
- **Shape:** 74 bars, Più moderato, alla breve (cut C), three flats throughout, C minor (passing through E-flat). Bar 1 is a three-eighth
  upbeat (piano alone). The piano's creeping introduction (bars 1–6); Monostatos "Nur stille" (bars 7–11), the Queen and the Ladies
  answer (bars 11–15); Monostatos "Doch Fürstin, halte Wort" (bars 15–21), the Queen "Ich halte Wort" and the Ladies "Ihr Kind soll
  deine Gattin sein" (bars 21–30); thunder: Monostatos "Doch still, ich höre schrecklich rauschen" (bars 31–35), the women "Ja,
  fürchterlich ist dieses Rauschen" (bars 35–39); Monostatos "Nun sind sie in des Tempels Hallen" (bars 41–43), all five "Dort wollen
  wir sie überfallen … mit Feuersgluth und mächt'gem Schwert" (bars 43–51); kneeling, Monostatos and the Ladies "Dir, grosse Königin
  der Nacht, sei unsrer Rache Opfer gebracht!" (bars 52–63, the Queen silent); thunder, lightning and storm, all five in unison
  "Zerschmettert, zernichtet ist unsere Macht, wir alle gestürzet in ewige Nacht!" (bars 65–71); the piano's chords as they sink
  (bars 71–74). No fermatas, no repeats, no rit.
- **Singers:** N = Monostatos (staff "M", treble clef, written an octave higher: tenor), Q = Königin der Nacht, D1–D3 = the three
  Ladies. The print puts the Queen and the First Lady on one staff ("K D1") and the Second and Third Ladies on another ("D 2/3") on
  p. 155, the Queen and each Lady on her own staff on p. 156, the First and Second Ladies on one staff ("D 1/2") from p. 157, and from
  bar 64 the Queen and the First and Second Ladies in unison on one staff ("K D 1/2", "Königin und 2 Damen") with the Third Lady and
  Monostatos on their own staves. Each singer has their own line here. Monostatos sings bars 7–11, 15–21, 31–35, 41–71; the Queen
  bars 11–15, 21–30, 35–39, 43–51, 65–71; the Ladies bars 11–15, 26–30, 35–39, 43–71.
- **SEGS:** `1/3/8/-3/Più moderato;2/2/2/-3/`
- **SINGERS:** `N:Monostatos:Mon.:G/2/-1,Q:Königin der Nacht:Kön.:G/2,D1:Erste Dame:1. D.:G/2,D2:Zweite Dame:2. D.:G/2,D3:Dritte Dame:3. D.:G/2`
- **REPEATS:** none. **PICKUP:** `3 8 2 2` (kit/pickup.py: bar 1 built in 3/8, made an implicit upbeat bar in 2/2).
- **post.txt:** none (no step between the build and xfix).
- **xfix.txt:** `final` (the final double bar), `timesym 1 cut` (the printed cut C). In the build folder (ext/zf/b53) it is fixes.txt.
- **Process:** one chunk, S53 (pp. 155–159 system 2, 74 bars): two independent readers + judge + marks sweep; built, then a fresh
  check by two proofreaders: clean.
- **Shared bars:** none. The piece starts after the double bar on p. 155 that ends S52 (the duet, whose last bar is printed short);
  bar 1 is the upbeat to this number. It ends with bar 74; the piano's forte on p. 159 system 3 belongs to S54.

## Checks and fixes
- Judge: 21 sung-line remarks ("# JUDGE") and 34 piano remarks, every difference settled on the print. Sung lines: bar 13 the
  Second and Third Ladies sharing F4 on "bald drin-gen"; bar 14 the Queen's C5 and the First Lady's G4 on beat 2; bar 17 the
  hyphenation of "hal-te"; bar 28 the First Lady's "soll" B-flat4; bar 38 "Wie-der-hall" (all four women); bar 43 the Third Lady's
  "Dort wol-len" on G4; bar 48 the First Lady's B natural carrying through the bar; bar 58 the Third Lady's E-flat4; bar 61 the
  Second Lady's G4; bar 66 "schmet-" on G5 (G4 for Monostatos, sounding); bar 71 the unison "Nacht!" B3. Piano: ties against slurs
  in the trill figures, the between-staff dynamics, chords and accidentals (bars 26, 48, 53, 64, 68, 71, 72, 74).
- Marks sweep: 17 piano remarks ("# MARKS": the between-staff p, mfp and f put on both hands; bar 15's p left on the left hand only);
  no sung-line remarks.
- Fresh check (two proofreaders on the build): clean; no fixes.

Final build reproduced from this folder (TMPDIR in the scratchpad): `kit/cleanv.py VM_S53.txt` (gives b53/VM_S53.clean.txt byte
for byte) → `kit/build.sh` with SEGS/SINGERS above and title "Nur stille, stille, stille, stille!" → `kit/pickup.py s53.xml 3 8 2 2`
(gives b53/s53.xml byte for byte) → `kit/xfix.py` with xfix.txt gives `S53_Finale_-_Nur_stille.musicxml` byte for byte (the checked
s53f.xml). 0 missing required accidentals; every bar of every part adds up (barsum: only bar 1, the upbeat, is short, as expected).
The import takes the score as it is (no change was needed).

## Words
Kept as printed: "bald dringen wir in Tempel ein" (the libretto has "im Tempel"), "Doch Fürstin, halte Wort, erfülle," (commas),
"muss", "grosse", "Wiederhall", "Feuersgluth", "mächt'gem", "Erd'", "unsrer", "zernichtet", "gestürzet" (the libretto has
"gestürzt"). The Queen sings "Mein Kind soll deine Gattin sein", the Ladies "Ihr Kind", the Third Lady "Ihr Kind soll deine Gattin,
soll deine Gattin sein". Repeats written out as sung: "Nur stille, stille, stille, stille! bald dringen wir in Tempel ein" by
Monostatos and then by the women; "Dort wollen wir sie überfallen" twice (Monostatos only "überfallen" the second time); "Dir, grosse
Königin der Nacht" twice. Words printed as one over several notes are split at the syllables. German only: the Italian translation,
the notes printed only for it and the stage directions ("Verwandlung. Felsengegend. Es ist Nacht.", "Monostatos, Königin und die
drei Damen (erscheinen mit brennenden Fackeln)", "Donner, Geräusch von Wasser", "knieend", "Donner, Blitz und Sturm", "sie
versinken", "Offene Verwandlung. Sonnentempel. …") are left out.

## Tempo
Più moderato ♩ = 134 (half note = 67); 293.5 quarters (the upbeat's 1.5 + 73 bars of 4) at ♩ = 134 = 131 s (2:11) at score tempo.
Basis: five complete recordings whose track holds exactly this scene (from "Nur stille" to "… in ewige Nacht!"; in each listing the
next track begins with Sarastro's "Die Strahlen der Sonne"):
  - Haitink, Bavarian Radio SO (EMI, 1981; ototoy 128214, disc 3 track 8, "Nur stille, stille, stille"): 2:20
  - Böhm, Berliner Philharmoniker (DG, 1964; Qobuz 0002894796491, track 45): 2:15
  - Solti, Wiener Philharmoniker (Decca, 1969; Qobuz 0002894780394, disc 3 track 8, "h. Nur stille, stille"): 2:12
  - Klemperer, Philharmonia (EMI/Warner, 1964; Apple Music Classical 734557407, "Nur stille! stille! stille!"): 2:11
  - Toscanini, Wiener Philharmoniker (Salzburg 1937; Apple Music Classical 454908028, "Nur stille, stille"): 2:07
Median 2:12 (132 s), Solti's: 293.5 quarters in 132 s gives ♩ ≈ 133.4, set at ♩ = 134 (half note = 67). Assumed: each track ends
with bar 74, the next track beginning with the piano's forte on p. 159 system 3 that leads to Sarastro's entry (the listings name
the next track "Die Strahlen der Sonne"; Toscanini's next track is titled only "Finale", 3:05, taken to be the same). One tempo
throughout: the print has no other tempo word, no rit. and no fermata. Set with `kit/tempomap.py "1:134:Più moderato"` (no ramps),
then `kit/dedupe_tempo.py` (1 words-only heading removed).

## Judgement calls and anything doubtful
- German only: the notes printed only for the Italian are left out (bar 7 the extra stem-down quarter rest and two eighths in
  Monostatos's line; bar 11 the upper-stem variant with a quarter rest for "Zit-to"; bars 16, 18, 19 Monostatos's extra notes; bar 22
  the Queen's extra filled heads; bar 28 the Ladies' extra heads for "mi-na"; bar 35 the half notes for the Italian "Oh" beside the
  German quarters "Ja,").
- Singers sharing a staff each get their own line; a note printed once for two (one head with two stems, e.g. bar 13 the Second and
  Third Ladies' F4) is given to both, and the unison staff of bars 64–71 is written out for the Queen and the First and Second Ladies
  alike.
- Monostatos is printed in the treble clef and written in the tenor's treble clef (sounding an octave lower).
- Bar 71 "Nacht!": the Queen and the First and Second Ladies sing B3, as printed (two whole notes side by side below the C4 ledger
  line on the "K D 1/2" staff, one natural); the Third Lady also B3, Monostatos B2 (sounding).
- Dynamics printed between the piano staves are put on both hands, except bar 15's p, which belongs to the left hand's figure (the
  right hand only holds its chord, then rests).
