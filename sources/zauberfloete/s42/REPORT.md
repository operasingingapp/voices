# S42 — Die Zauberflöte, No. 18 Chor der Priester (Act 2), "O Isis und Osiris! welche Wonne!"

Edition Peters vocal score (Kogel, Leipzig, plate 7794, IMSLP #225460), 25 Nov 2026.

- **Printed pages:** 107 (system 1, "Verwandlung. Das Innere einer Pyramide", Nr. 18 Chor der Priester) – 108 system 3
  (final double bar); PDF 111–112. The spoken dialogue below it ("Prinz, dein Betragen war bis hieher männlich", S43) is not
  transcribed.
- **Shape:** 42 bars, Adagio, alla breve (¢), D major (two sharps) throughout; no tempo, key or time changes.
- **Singers:** the priests' chorus only (men's voices). K3 = Tenor I and K3b = Tenor II (the upper and lower notes of the one
  "Tenor I. u. II." staff, written here as two parts in treble clef sounding an octave lower), K4 = Bass (own staff). The German
  words are printed once between the staves and sung by all; in bars 24–28 the basses have their own text line ("sein Geist ist
  kühn, sein Herz ist rein,"), a beat ahead of the tenors. Sarastro is on stage (he leads the priests in) but does not sing.
- **SEGS:** `1/2/2/2/Adagio`
- **SINGERS:** `K3:Chor Tenor I:T. I:G/2/-1,K3b:Chor Tenor II:T. II:G/2/-1,K4:Chor Bass:B.:F/4`
- **REPEATS:** none.
- **xfix.txt:** `final`, `timesym 1 cut` (the final double bar and the ¢ sign). In the build folder (ext/zf/b42) it is fixes.txt.
- **Process:** one chunk (S42, pp. 107–108): two independent readers + judge + marks sweep, built, then a fresh check (one fix,
  then clean).
- **Shared bars:** none. No. 17 (Pamina's "Ach, ich fühl's") and the dialogue "Nicht wahr, Tamino, ich kann auch schweigen"
  come before; the dialogue S43 and then No. 19 Terzett ("Soll ich dich, Theurer! nicht mehr seh'n?", p. 109) follow.

## Checks and fixes
- Readers: the sung lines agreed in every bar (vsem: 0 differing lines of 126). Piano: 7 differences (bar 19 RH B3/E4, bar 21
  RH A4/B4, and on which hand five between-the-staves dynamics sit), settled by the judge on the page (26 "# JUDGE" remarks in
  PM, 1 in VM): bar 19 RH B3 (ledger line), bar 21 RH beat 4 F#4 A4 D#5 F#5.
- Marks sweep: 16 "# MARKS" remarks in PM (the dynamics printed once between the staves, written for both hands; the bar 27→28
  RH tie). Nothing added to the sung lines.
- Fresh check: one fix, bar 10 RH: the A4 is tied into beat 3 (the lower arc is a tie, the upper arc the chord slur) ("# FIX" in
  PM_S42.txt). Rebuilt and re-checked: clean.

Final build reproduced from this folder (TMPDIR on /dev/shm): `kit/cleanv.py VM_S42.txt` → `kit/build.sh` with SEGS/SINGERS
above → `kit/fix64.py` → `kit/clef0fix.py` → `kit/fixtup.py` → `kit/xfix.py` with xfix.txt gives
`S42_Chor_der_Priester_-_O_Isis_und_Osiris_welche_Wonne.musicxml` byte for byte (the checked s42f.xml; each intermediate,
VM_S42.clean.txt, s42.raw.xml and s42.xml, also byte for byte). 0 missing required accidentals; every bar adds up (barsum 0
problems).

## Words
Kept as printed: "ganz ergeben" and "unser würdig" (the libretto has "ganz gegeben", "unsrer würdig"); "unserm Dienste";
"Osiris!" with an exclamation mark; "wür" in bar 37 printed without a hyphen (written as "wür-dig"). German only; the Italian
translation, the notes printed only for it and the stage direction are left out (see below).

## Tempo
Adagio ♩ = 52 (half note = 26). Basis: the No. 18 tracks of five complete recordings (42 bars = 168 quarters):
  - Sawallisch, Bavarian State Opera (EMI/Warner, 1972-73): 3:10 (ototoy 255125, disc 2 track 17, between two dialogue tracks)
  - Klemperer, Philharmonia (EMI/Warner, 1964): 3:12 (Apple Music Classical album 734557407, No. 18; no dialogue in this set)
  - Haitink, Bavarian Radio SO (EMI, 1981): 3:13 (ototoy 128214, disc 2 track 19, between two dialogue tracks)
  - Christie, Les Arts Florissants (Erato, 1995/96): 3:18 (ototoy 322115, disc 1 track 33)
  - Solti, Vienna Philharmonic (Decca, 1969): 3:35 (AcousticBrainz decbb563-cfe7-4c9a-ba27-8e54ec46c19b, "No. 18 Chorus")
Median 3:13 (193 s): 168 / 193 × 60 = 52.2 → 52. Set with `kit/tempomap.py "1:52:Adagio"` (no rit./rall. in the print),
then `kit/tempodedupe.py` (1 words-only "Adagio" dropped). The import gives 194 s at score tempo.

## Judgement calls and anything doubtful
- Bars 5, 22, 26, 32, 37: small notes and extra stems printed only for the Italian text are left out; the German rhythm is kept
  (bars 32/37: Tenor II and Bass sing the half notes).
- Bar 8: the basses' "dü-stre" over the E-flat and C halves ("stre" on the second half).
- Bar 10 Bass: "der" on the slurred F#3–D3 eighth pair (the German syllable is not printed separately under the bass).
- Bars 24–28: the basses' own text line, as printed.
