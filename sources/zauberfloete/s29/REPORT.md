# S29 — Die Zauberflöte, No. 12 Quintett (Act 2), "Wie? wie? wie? ihr an diesem Schreckensort?"

Edition Peters vocal score (Kogel, Leipzig, plate 7794), 25 Nov 2026.

- **Printed pages:** 84 system 1 (top of No. 12, after the spoken dialogue) – 93 system 2 (final double bar of No. 12); PDF 88–97
- **Shape:** 164 bars, Allegro, alla breve (cut C), G major (one sharp) throughout; no tempo, key or time changes, no fermatas,
  no rit./rall.
- **Singers:** D1, D2, D3 = the three Ladies (printed "1. u. 2. Dame" on one staff and "3. Dame", later "D 1/2" / "D 2/3" in
  changing pairs; each Lady has her own line here), T = Tamino (treble clef printed an octave high, written at sounding pitch),
  G = Papageno (staff label "P", bass clef), K3/K4 = the chorus offstage ("Chor (von innen)", tenors and basses in unison,
  bars 151–155). The Ladies sing bars 2–16, 33–37, 47–69, 90–98, 112–157; Tamino bars 19–29, 39–44, 57–61, 76–90, 102–112,
  120–151; Papageno bars 17–39, 69–81, 99–112, 120–151, 160–164; bars 158–159 are the piano alone (thunder).
- **SEGS:** `1/2/2/1/Allegro`
- **SINGERS:** `D1:Erste Dame:1. D.:G/2,D2:Zweite Dame:2. D.:G/2,D3:Dritte Dame:3. D.:G/2,T:Tamino:Tam.:G/2/-1,G:Papageno:Pap.:F/4,K3:Chor Tenor:T.:G/2/-1,K4:Chor Bass:B.:F/4`
- **REPEATS:** none.
- **xfix.txt:** `final` (the final double bar), `timesym 1 cut` (the printed cut C). In the build folder (ext/zf/b29) it is
  fixes.txt.
- **Process:** three chunks, S29a (pp. 84–87, bars 1–79), S29b (pp. 88–90, bars 80–135) and S29c (pp. 91–93, bars 136–164):
  for each, two independent readers + judge + marks sweep; stitched (no shared bars), built, then a fresh check until clean.
- **Shared bars:** none. No. 12 starts at the top of p. 84 after the spoken dialogue (S28) and ends at its final double bar on
  p. 93, before the spoken "Heil dir, Jüngling!" (S30). No syllable carries over.

## Checks and fixes
- Judge: 39 sung-line remarks ("# JUDGE") and 48 piano remarks, every difference settled on the print. Sung lines: printed
  naturals on the same pitch (bars 54, 56, 58, 60); bar 68 First Lady "mit" on C#5; bar 73 Papageno "Ta-" D4; bar 77 Tamino
  "ge-" C4; bar 104 Papageno A3; the slurs printed over eighth pairs in bars 108–126; in bars 126–128 the second and third
  Ladies' "es plau-dert / kei-ner si-cher- / lich." placed in the right bars (one reader had dropped a bar) and bar 128 Third
  Lady "Von" A4 (pixel profile); bars 128–130 Tamino's and Papageno's entry "Von festem Geiste" (heads read on pixel profiles);
  bar 141 "was" G4+B4 for the second and third Ladies.
- Marks sweep: 43 piano remarks ("# MARKS": dynamics, slurs, staccatos, ties); no sung-line change.
- Fresh check: one fix, "# FIX" bars 31–32 piano right hand (no staccato on bar 31 beat 4 or on the bar 32 quarters); re-check
  clean.

Final build reproduced from this folder (TMPDIR on /dev/shm): `kit/cleanv.py VM_S29.txt` (gives b29/VM_S29.clean.txt byte for
byte) → `kit/build.sh` with SEGS/SINGERS above and title "Wie? wie? wie? ihr an diesem Schreckensort?" (gives s29.raw.xml byte
for byte) → `kit/fix64.py` → `kit/clef0fix.py` → `kit/fixtup.py` (gives s29.xml byte for byte) → `kit/xfix.py` with xfix.txt
gives `S29_Quintett_-_Wie_wie_wie_ihr_an_diesem_Schreckensort.musicxml` byte for byte (the checked s29f.xml). 0 missing required
accidentals; every bar of every part adds up (barsum, 0 problems).

## Words
Kept as printed: "Wie? wie? wie? ihr an diesem Schreckensort?" ("Schreckens" printed as one word under two notes, split
Schre-ckens-ort), "Nie, nie, nie, kommt ihr glücklich wieder fort." (the libretto has "kommt ihr wieder glücklich fort"),
"Tamino, dir ist Tod geschworen.", "Du, Papageno, bist verloren.", Papageno "Nein, nein, nein, das wär' zu viel.", Tamino
"Papageno, schweige still! Willst du dein Gelübde brechen, nichts mit Weibern hier zu sprechen?", "Du hörst ja, wir sind Beide
hin.", "Stille, sag' ich, schweige still!" (bar 27) and "Stille, sag' ich! schweige still!" (bar 39), "Immer still, und immer
still," with "und immer still" three times, "Ganz nah' ist euch die Königin," (the Third Lady sings only "Die Königin,"),
"sie drang im Tempel heimlich ein." (the libretto has "in Tempel"), "Wie, was? sie soll im Tempel sein?", "Wirst du immer so
vermessen deiner Eidespflicht vergessen?", "Tamino, hör', du bist verloren!", "Gedenke an die Königin!", "Man zischelt viel
sich in die Ohren von dieser Priester falschem Sinn." (twice; "falschem" printed as one word under two notes), "Ein Weiser
prüft und achtet nicht, was der gemeine Pöbel spricht.", "Man sagt, wer ihrem Bunde schwört, der fährt zur Höll' mit Haut und
Haar," with each Lady's repeat as printed, Papageno "Das wär' der Teufel, wär' der Teufel, wär' der Teufel, wär' der Teufel!
unerhört!", "Sag' an, Tamino, ist das wahr?", "Geschwätz, von Weibern nachgesagt, von Heuchlern aber ausgedacht.", "Doch sagt
es auch die Königin.", "Sie ist ein Weib, hat Weibersinn. Sei still, mein Wort sei dir genug: denk' deiner Pflicht und handle
klug!", "Warum bist du mit uns so spröde?", "Auch Papageno schweigt? so rede!", "Ich möchte gerne wohl...." (the libretto has
"woll"; "möchte" printed as one word under two notes), Tamino "Still!" twice, "Ihr seht, dass ich nicht soll!", "Dass du nicht
kannst das Plaudern lassen, ist wahrlich eine Schand' für dich." / Papageno "… für mich.", "Wir müssen sie mit Scham verlassen,"
/ Tamino and Papageno "Sie müssen uns mit Scham verlassen,", "es plaudert keiner sicherlich", "Von festem Geiste ist ein Mann,
er denket, was er sprechen kann," with the print's repeats, the chorus "Entweiht ist die heilige Schwelle, hinab mit den Weibern
zur Hölle!", the Ladies' "O weh!" (First Lady once, Second and Third twice) and Papageno's closing "O weh! o weh! o weh!".
German only: the Italian translation, the notes printed only for it (bars 13, 14, 18 of S29b = bars 92, 93, 97; the small
eighths for "Ta-ci!" in bars 102 and 106; bar 75 Papageno's G3 eighth) and the stage directions are left out.

## Tempo
Allegro, alla breve: ♩ = 192 (half note = 96); the map plays 205 s. Basis: five complete recordings whose No. 12 track holds
exactly this quintet (in each listing the track before is "Bewahret euch vor Weibertücken" or the dialogue, the track after the
dialogue "Heil dir, Jüngling" or "Alles fühlt der Liebe Freuden"):
  - Abbado, Mahler Chamber Orchestra (DG, 2005; Qobuz 0002894775789, disc 2 track 1): 3:04
  - Haitink, Bavarian Radio SO (EMI, 1981; ototoy 128214, disc 2 track 7): 3:09
  - Klemperer, Philharmonia (EMI, 1964; Apple Music Classical 734557407, track 18): 3:25
  - Böhm, Berliner Philharmoniker (DG, 1964; Qobuz 0002894796491, disc 1 track 24): 3:37
  - Christie, Les Arts Florissants (Erato, 1995; ototoy 322115, disc 1 track 23): 3:46
Median 3:25 (205 s): 656 quarters / 205 s × 60 = 192.0. Set with `kit/tempomap.py "1:192:Allegro"` (no rit./rall. in the print, no
ramps), then `kit/tempodedupe.py` (1 words-only heading dropped). Track times include the thunder and a little silence.

## Judgement calls and anything doubtful
- Bar 75 Papageno: the print's G3 eighth carries only an Italian syllable; German "ist" on the dotted quarter G3, "das" F#3.
- Bar 93 First and Second Lady: the German dotted half printed without a visible dot (the Third Lady's staff has it); read as a
  dotted half.
- Bar 122 Papageno: a dot above the second A3 read as a print speck (no staccato).
- Bars 120, 133, 141: where two Ladies share one notehead, both sing it.
- Bars 151–155: the chorus is printed in unison on tenor and bass staves; it is written out as two parts.
