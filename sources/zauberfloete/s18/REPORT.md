# S18 — Die Zauberflöte, No. 8 Finale (Tamino's flute scene) "Wie stark ist nicht dein Zauberton"

Edition Peters vocal score (Kogel, Leipzig, plate 7794), batch 3, Nov 2026.

- **Printed pages:** 61 (system 1, Andante, Tamino's flute) – 63 (system 5, the double bar before "Schnelle Füsse"); PDF 65–67
- **Shape:** 69 bars, C major, 4/4 throughout. Bar 1 is a one-beat pickup (implicit bar). Andante bars 1–53, Presto from the
  upbeat of bar 53, Adagio from the upbeat of bar 57, Presto from the upbeat of bar 59 (checked score: words at bars 54, 58, 60;
  app copy: on the upbeat with the tempo). Bar 69 has 3 beats as printed (time signature hidden).
- **Singers:** T = Tamino (treble clef, sounding an octave lower). Tamino's flute and Papageno's panpipe answers (bars 49, 51, 52)
  are in the piano part (panpipe as RH voice 3).
- **SEGS:** `1/1/4/0/Andante;2/4/4/0/;54/4/4/0/Presto;58/4/4/0/Adagio;60/4/4/0/Presto;69/3/4/0/`
- **SINGERS:** `T:Tamino:Tam.:G/2/-1`
- **Process:** two readers + judge + marks sweep + fresh check (clean).

## Build
`kit/buildpiece.sh 18 S18 "$SEGS" "Wie stark ist nicht dein Zauberton" "$SINGERS" "" "1 4 4 4"`, then post.txt
(`kit/hidetime.py s18.xml 69`), then `kit/xfix.py` with xfix.txt (`final`). Reproduces s18f.xml byte for byte.

## Words
As printed: "Thiere", "Papageno's", "find'". Bar 28: "fühlen*" is printed above the staff with the footnote "Das Wort 'fühlen'
fehlt in der Partitur"; it is not sung. German only; Italian-only notes and stage directions left out.

## Tempo
Andante ♩ = 90, Presto ♩ = 180, Adagio ♩ = 54 — median 2:54 of Jacobs 2010 (2:39), Norrington (2:39), Klemperer 1964 (2:54),
Christie 1995 (2:54), Haitink 1981 (3:05). Section ratios assumed (Presto 2×, Adagio 0.6×, one beat per fermata).

## Judgement calls
- Bar 12 Tamino: half note A tied to the eighth A. Bars 15/27: "selbst" = the up-stem eighths C B. Bar 49: "Ha!" on G3.
- Bar 6 piano RH: the 16th F has no accidental after the F# earlier in the bar: read as F#.
- Bar 62 piano RH: lower sixths F E E D as RH voice 2.
