# S54 — Die Zauberflöte, No. 21 Finale (Act 2), "Die Strahlen der Sonne vertreiben die Nacht" (Sarastro and the chorus "Heil sei euch Geweihten!", to the end of the opera)

Edition Peters vocal score (Kogel, Leipzig, plate 7794, IMSLP #225460), 26 Nov 2026.

- **Printed pages:** 159 system 3 (after "Offene Verwandlung", which ends the scene of the Queen of the Night, S53: the piano
  alone, alla breve continued, three flats) – 163 system 5 (the final chord and double bar, "Ende der Oper").
- **Shape:** 103 bars, E-flat major. Alla breve (¢), bars 1–10: the piano alone as the stage becomes the sun (bars 1–6), Sarastro's
  "Recit." from bar 7 ("Die Strahlen der Sonne vertreiben die Nacht"), "Maestoso" from bar 9 ("zernichten der Heuchler erschlichene
  Macht"), a fermata over the eighth rest of bar 10, double bar. Andante, 4/4 (C), bars 11–28: Sarastro ends his phrase (bars
  11–12), then the chorus "Heil sei euch Geweihten! Ihr dranget durch Nacht" and "Dank sei dir, Osiris, Dank dir, Isis, gebracht!"
  (bars 13–29). Allegro, 2/4, bars 29–103: the chorus's last chord (bar 29), the piano (bars 30–36), "Es siegte die Stärke und
  krönet zum Lohn die Schönheit und Weisheit mit ewiger Kron'!" (bars 37–91, with a fermata over the eighth rest of bar 60 in
  every part), the piano postlude to the end (bars 92–103). No repeats, no upbeat.
- **Singers:** S = Sarastro (bass clef), K1–K4 = the chorus: Sopran, Alt, Tenor (treble clef, an octave lower), Bass. The print
  puts the chorus on two to four staves (Sopran and Alt on one treble staff, Tenor and Bass on one bass-clef staff at sounding
  pitch, in places; three staves on p. 162 system 3; four on p. 161 system 1); each singer has their own line here. Sarastro sings
  bars 7–12, the chorus bars 13–29 and 37–91.
- **SEGS:** `1/2/2/-3/;7/2/2/-3/Recit.;9/2/2/-3/Maestoso;11/4/4/-3/Andante;29/2/4/-3/Allegro`
- **SINGERS:** `S:Sarastro:Sar.:F/4,K1:Chor Sopran:S.:G/2,K2:Chor Alt:A.:G/2,K3:Chor Tenor:T.:G/2/-1,K4:Chor Bass:B.:F/4`
- **REPEATS:** none. **PICKUP:** none. **post.txt:** none.
- **xfix.txt:** `final` (the final double bar), `timesym 1 cut` (the printed ¢), `timesym 11 common` (the printed C of the
  Andante). In the build folder (ext/zf/b54) it is fixes.txt.
- **Chorus:** the four chorus parts (P2–P5) have no role, as in "Es lebe Sarastro" and "Tamino mein!": they are heard with the
  piano and have no phrases in language.json (so there is no chorus-roles folder).
- **Process:** one chunk (pp. 159–163, bars 1–103): two independent readers + judge + marks sweep, built, then a fresh check by
  two proofreaders.
- **Shared bars:** none. The piece starts at p. 159 system 3, after the double bar and "Offene Verwandlung" that end S53 ("Nur
  stille"), and ends with the last bar of the opera.

## Checks and fixes
- Judge: 70 sung-line remarks ("# JUDGE") and 38 piano remarks, every difference settled on the print. Sung lines: bars 12 and 15
  the chorus's beat-4 upbeats, which carry only the Italian "Per" (written as rests, see below); bar 13 the Tenor and Bass sharing
  the E-flat of "Heil" (stems both ways), the Bass then on E-flat 3; bar 17 the Tenor's A-flat 4; bar 28 the Tenor's "I-sis"
  (E-flat, then the F half note; the up-stem F quarter beside it is Italian-only); bar 45 "Kron'!" with the apostrophe; bar 60 one
  fermata only, over the first eighth rest; bar 69 the Sopran's second eighth D5 (bar 61 has B-flat 4); bars 77 and 81 the Tenor
  and Bass in unison on one head. Many remarks are "slur marks only": sung slurs are not written (the house format has none), ties
  are. Piano: the two-voice right hand of bars 3–4 and 20–21, a stray speck read as no dot (bar 14 LH), the single p of bars 19 and
  22, the grace-note groups (three 32nds slurred into the main eighth: bars 30, 32, 38, 40, 92, 94), the staccato chords (bars
  47–48, 52), the tremolos and the fermata of bars 59–60, the chords of bars 24, 58, 66 and 73.
- Marks sweep: 29 piano remarks ("# MARKS"; slurs and ties as printed, the dynamics printed between the staves put on both hands);
  no sung-line remarks.
- Fresh check (two proofreaders on the build): one difference, fixed ("# FC" in PM_S54.txt) and rebuilt:
  - bars 19–20 RH, the lower-voice slur: the lower voice (E-flat 4 + G4 from beat 3 of bar 19) moved to a second right-hand voice so
    that its printed slur to the end of bar 20 can be written (the judge had left this slur out because it crossed between voices).

Final build reproduced from this folder (TMPDIR in the scratchpad): `kit/cleanv.py VM_S54.txt` (gives b54/VM_S54.clean.txt byte
for byte) → `kit/build.sh` with SEGS/SINGERS above and title "Die Strahlen der Sonne vertreiben die Nacht" (gives b54/s54.xml byte
for byte) → `kit/xfix.py` with xfix.txt gives `S54_Finale_-_Die_Strahlen_der_Sonne.musicxml` byte for byte (the checked
s54f.xml, with the fresh-check fix). 0 missing required accidentals; barsum: 0 problems, every bar of every part adds up.

## Words
Kept as printed: Sarastro's "Die Strahlen der Sonne vertreiben die Nacht, zernichten der Heuchler erschlichene Macht." (the old
"zernichten", as in the libretto); the chorus's "Heil sei euch Geweihten!", "Ihr dranget durch Nacht.", "Dank, Dank, Dank sei dir,
Osiris, Dank dir, Isis, gebracht!" (the print repeats "Dank"), "Es siegte die Stärke, und krönet zum Lohn" (in bar 77 "Stärke und"
without the comma, as printed), "die Schönheit und Weisheit mit ewiger Kron'" with the apostrophe. The chorus's repeats are written
out as each voice sings them. Words printed as one over several notes are split at the syllables. German only: the Italian
translation, the notes printed only for it and the stage directions are left out.

## Tempo
The opening (bars 1–6) ♩ = 118 (half note = 59), Recit. ♩ = 59 from bar 7, Maestoso ♩ = 59 from bar 9, Andante ♩ = 59 from bar 11,
Allegro ♩ = 118 from bar 29: at score tempo 24 quarters at 118 (12.2 s) + 16 at 59 (16.3 s) + 72 at 59 (73.2 s) + 150 at 118
(76.3 s) = 178 s, plus the two fermata holds, about 3:00. Basis: five complete recordings whose last track holds exactly this
ending (from "Die Strahlen der Sonne" to the end of the opera; in each listing the track before it is "Nur stille"):
  - Böhm, Berliner Philharmoniker (DG, 1964; Qobuz 0002894796491, track 46, "No. 21, Finale: i. Die Strahlen der Sonne – Heil sei
    euch"): 3:13
  - Toscanini, Wiener Philharmoniker (Salzburg 1937; Apple Music Classical 454908028, last track, "Finale"): 3:05
  - Klemperer, Philharmonia (EMI/Warner, 1964; Apple Music Classical 734557407, track 33, "Die Strahlen der Sonne vertreiben die
    Nacht" (Sarastro, Chorus)): 3:00
  - Solti, Wiener Philharmoniker (Decca, 1969; Qobuz 0002894780394, disc 3, last track, "Finale: i. Die Strahlen der Sonne – Heil
    sei euch"): 2:59
  - Haitink, Bavarian Radio SO (EMI, 1981; ototoy 128214, disc 3 track 9, "No. 21g, Finale, Die Strahlen der Sonne"): 2:55
Median 3:00 (180 s), Klemperer's. No recording splits the ending, so the proportion is assumed: the Andante's quarter half the
Allegro's (1:2), and the opening's half note equal to the Andante's quarter (the transformation music, in the alla breve of the
scene before). Sarastro's recitative is free; it is given the Andante's quarter, ♩ = 59, as is the Maestoso, a sensible pace for
his dotted declamation. The whole is then 175 Andante quarters long, which at ♩ = 59 is 178 s, leaving about 2 s for the
fermatas. Set with `kit/tempomap.py "1:118:;7:59:Recit.;9:59:Maestoso;11:59:Andante;29:118:Allegro"` (bar 1 has no printed tempo
word; no rit./rall. in the print, no ramps), then `kit/dedupe_tempo.py` (4 words-only headings removed).

## Judgement calls and anything doubtful
- German only: the notes printed only for the Italian are left out. The chorus's beat-4 upbeat quarters in bars 12 and 15 carry
  only the Italian "Per" (the German "Heil" starts on the next downbeat) and are written as rests; the small extra eighths of bar 24
  and the extra stem-the-other-way notes of bar 28 serve only the Italian.
- Where a chorus part's German is not printed under its staff it takes the German of the part singing the same rhythm: bars 12–26
  the Tenor and Bass (only the Italian under their shared staff; German from the Sopran and Alt), bar 27 the Alt (and the Bass)
  "Dank", bars 57–60 and 75–79 the Alt (only the Italian under the Alt staff; German from the Sopran and the Tenor/Bass staff).
- Voices sharing a staff (Sopran/Alt, Tenor/Bass) each get their own line; where they share a head (stems both ways) both sing it.
- Dynamics printed between the piano staves are put on both hands.
- Bar 82 Tenor/Bass: a dot printed after the first chord is read as a plain quarter (the bar holds only a quarter and two eighths).
- The chorus tenors, printed at sounding pitch on the shared bass-clef staff (in the treble clef on p. 161 system 1), are written
  in the tenor's treble clef (sounding an octave lower).
- The import takes the score as it is (no change was needed): 103 measures, 178 s at score tempo.
