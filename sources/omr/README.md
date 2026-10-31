# Score sources and the cleanup kit

Not part of the app. For each score cleaned from a scan: the printed PDF (the source of truth), the scanning app's
original MusicXML, the corrected file, and the scripts used, so a piece can be re-checked or redone later and the next
one starts from ready tools. The method is described in the omr-score-cleanup skill.

- `figaro-overture/`: Sinfonia. `detect2.py` finds systems and barlines on 300 dpi page images
  (`pdftoppm -r 300 -gray scan.pdf hi/p`), giving `sys300.json`; `mkov.py FILE OUTDIR` makes scan-vs-file images.
- `figaro-no1/`: No. 1 Duettino + recitative. `voices.txt` (sung lines, DSL) → `build.py` → `fixes.py` → `finish.py`;
  `mkfull.py` / `mkpiano.py` comparison images; `dump.py FILE A B` lists notes; `split.py` cuts the app pieces;
  `mklang.py` writes the words (IPA, gloss, translation). Scripts expect the page images (`pg-N.pgm`, 300 dpi) and
  their inputs in the working folder; adjust paths when reusing.
- `briefs/`: instructions given to the transcribing and checking helpers.

Page images are not stored: re-render them from the PDF.
