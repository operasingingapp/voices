# Additions to the Sottovoce score kit used in batch 2

- `READER.txt`: the reader brief (the Zauberflöte briefs package had none). Fill {CHUNK}, {SINGERS}, {NOTES}, {TAG}, {VOUT}, {POUT}.
- `pickup2.py FILE.xml BEATS TYPE`: kit/pickup.py for any metre (S15: bar 1 built as 3/8, shown as a pickup in 6/8).
- `dedupe_tempo.py FILE.xml`: after kit/tempomap.py, removes the build's own tempo word where tempomap wrote the same word with the tempo (otherwise "Allegro molto" appears twice).
- `barsum.py FILE.xml`: every bar of every part and voice adds up to its time signature (music21).
- `buildpiece.sh SNN [RENDDIR]`: clean + build + pickup + xfix + tempo + checks + renders, from SNN/config.sh (SEGS, TITLE, SINGERS, PICKUP, TEMPO) and SNN/xfix.txt. Paths assume /home/claude/work.
- `words.py VM.txt`: rebuilds each singer's text from the syllables, for the words check.
