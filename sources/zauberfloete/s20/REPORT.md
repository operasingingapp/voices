# S20 — Die Zauberflöte, No. 8 Finale (Act 1), "Es lebe Sarastro! Sarastro lebe!"

Edition Peters vocal score (Kogel, Leipzig, plate 7794), 20 Nov 2026.

- **Printed pages:** 69 system 4 (Allegro maestoso, after the double bar that ends "Könnte jeder brave Mann") – 71 system 4
  bar 2 (fermata and double bar, before the Larghetto "Herr! ich bin zwar Verbrecherin!"); PDF 73–75
- **Shape:** 44 bars, Allegro maestoso, 4/4 (C), C major (no sharps or flats) throughout. Fermata in bar 44 on the whole rest
  (Pamina's staff) and over the last rest in both piano staves. No tempo, key or time changes inside the section.
- **Singers:** P = Pamina (treble clef), G = Papageno (bass clef), K1–K4 = the chorus, sopranos, altos, tenors, basses (printed on
  two staves, Sopr./Alt. in treble and Ten./Bass in bass clef; the tenors written here in treble clef sounding an octave lower).
  The chorus sings offstage ("Chor (von innen)") in bars 2–4, then on stage ("Chor.") from bar 24. Papageno sings bars 4–16,
  Pamina bars 6–9 and 16–19; bars 20–23 are the march as Sarastro and his train appear; bars 41–44 piano alone.
- **SEGS:** `1/4/4/0/Allegro maestoso`
- **SINGERS:** `P:Pamina:Pam.:G/2,G:Papageno:Pap.:F/4,K1:Chor Sopran:S.:G/2,K2:Chor Alt:A.:G/2,K3:Chor Tenor:T.:G/2/-1,K4:Chor Bass:B.:F/4`
- **REPEATS:** none.
- **xfix.txt:** `final` (the final double bar). In the build folder (ext/zf/b20) it is fixes.txt.
- **Process:** one chunk (S20, pp. 69–71): two independent readers + judge + marks sweep, built, then a fresh check: clean.
- **Shared bars:** none. S19 ("Schnelle Füsse, rascher Muth", ending "ist kein Glück auf Erden.") ends at the double bar with
  the key change at the end of p. 69 system 3; S21 starts after the double bar on p. 71 system 4 (Larghetto, one flat, Pamina
  "Herr!"). No syllable carries over at either end.

## Checks and fixes
- Judge: 8 sung-line and 21 piano remarks ("# JUDGE"). Sung lines: three bare-letter naturals (Papageno bars 11 and 13, Pamina
  bar 17: same pitch, spelling kept); chorus slurs on the beamed melisma pairs in bars 31 and 33 settled on 400 dpi crops; bar 32
  basses: the down-stem G3 on beat 4 is a quarter for German "-bens" (the rests beside it serve the Italian). Piano: slurs and
  staccato placement in bars 5–14, the f between the staves in bars 1 and 19, the B3+D4 chord in bar 17.
- Marks sweep: 6 piano remarks (p in bars 4 and 31, f in bar 19, the trill slurs ending on the C6 dotted eighth in bars 28,
  41, 43).
- Fresh check: clean; no "# FIX" remarks.

Final build reproduced from this folder (TMPDIR on /dev/shm): `kit/cleanv.py VM_S20.txt` (gives b20/VM_S20.clean.txt byte for
byte) → `kit/build.sh` with SEGS/SINGERS above and title "Es lebe Sarastro! Sarastro lebe!" (gives s20.raw.xml byte for byte)
→ `kit/fix64.py` → `kit/clef0fix.py` → `kit/fixtup.py` (gives s20.xml byte for byte) → `kit/xfix.py` with xfix.txt gives
`S20_Finale_-_Es_lebe_Sarastro_Sarastro_lebe.musicxml` byte for byte (the checked s20f.xml). 0 missing required accidentals;
every bar of every part adds up (barsum, 0 problems).

## Words
Kept as printed: "Was soll das bedeuten? ich zittre, ich bebe!" (the libretto has "dies"), "O! Freund, nun ist's um uns
gethan;", "wollt'", "kröch'", "wär'", "Die Wahrheit, die Wahrheit! wär' sie auch Verbrechen!" (the libretto has "Die Wahrheit –
sei sie auch Verbrechen!"), "mög'", "freu'n", "weih'n". "zittre," and "Schnecken," are printed under two notes without a hyphen
and are split into syllables. The chorus's repeats are written out as sung; the sopranos and tenors sing "Stets mög' er des
Lebens als Weiser sich freu'n" twice (bars 30–34), the altos only "als Weiser sich freu'n" twice, the basses the whole line once
(bars 31–34). German only: the Italian translation, the notes printed only for it (extra sixteenths under "stro" in bar 4,
small notes in Papageno's bars 13 and 15, an extra eighth after Pamina's "heit!" in bar 18) and the stage directions
("Sarastro und Gefolge erscheinen") are left out.

## Tempo
Allegro maestoso ♩ = 98. Basis: median length of this section 108 s (1:48), 176 quarters, from four complete recordings whose
track holds exactly this section (from "Es lebe Sarastro!" to before "Herr! ich bin zwar Verbrecherin!"):
  - Norrington, London Classical Players (EMI/Warner; Apple Music Classical 697509977 and ototoy 255124): 1:29
  - Christie, Les Arts Florissants (Erato, 1995; ototoy 322115, track 15): 1:47
  - Haitink, Bavarian Radio SO (EMI, 1981; ototoy 128214, track 24): 1:49
  - Böhm, Vienna Philharmonic (Decca, 1955; Apple Music song 1452235743): 1:52
Median (1:47 + 1:49) / 2 = 1:48 → 176 / 108 × 60 = 97.8. Seen, not used (the track runs on into the next sections): Klemperer
1964, 5:04 ("Es lebe Sarastro" to before "Nun stolzer Jüngling"); Abbado 2005, 7:06 (to the end of the act); Toscanini
(Vienna Philharmonic, C.R. Digital Contents reissue), 7:22. Set with `kit/tempomap.py "1:98:Allegro maestoso"` (no rit./rall. in the print, no ramps), then
`kit/tempodedupe.py`; the import gives 108 s at score tempo.

## Judgement calls and anything doubtful
- Bar 15, Papageno: small extra notes serve the Italian; the rhythm q. e q. e is read from the main notes (marked unsure by the
  reader, unchanged by the judge and the fresh check).
- Bars 30–33: Sopr./Alt. and Ten./Bass divide on their staves (stems up and down), the altos and basses entering later; each
  part keeps its own words and rhythm.
- Bar 20: a second right-hand line in small notes gives the trumpets ("Tromp."), the left hand the timpani ("Pauke"); kept as
  printed, as are the trumpet and timpani lines in bars 1–2.
