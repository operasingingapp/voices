# Bohème pipeline status notes
- Printed singer order (staff order when all present): S1 "Questo Mar Rosso": R, M (C later, check p.8+). S4: R, M, S, C.
- S4 built: b4/s4.xml (S,M,R,C order, used by fresh checkers) and b4/s4_order.xml (printed order R,M,S,C) -> use the latter after checks.
  Fix applied after judge: 29 LH1 dyn:f (f between staves). Segs "1/2/4/1/Allegretto;33/6/8/-6/Andantino;47/3/8/-6/Allegro vivo".
  Tempo from print: q=116, dotted q=92, Allegro vivo = I.o tempo dotted q=108 (3/8).
- S1a built: b1/s1a.xml (voice slurs stripped via VM_S1a.clean.txt). Fix: bar 15 LH F3:s + five plain 16ths (double flag confirmed on p.1).
  Segs "1/3/8/0/Allegro vivace;88/6/8/-2/Lo stesso movimento;112/3/8/-2/Lo stesso movimento".
- fc/FRESHCHECK.md = Bohème fresh-check brief; kit/mkrend.py renders per printed system from "# page NNN system K starts bar B".
- Voice DSL: judges may add ( ) slurs to sung lines; strip before build (see b1 cleaning snippet).
- PIPELINE per chunk (from 4 Nov): readers A+B -> barmatch/vdiff/pdiff -> judge (VM_/PM_) -> MARKS sweep (MARKS.md: singer dyn, hairpins hp:< hp:> hp:end,
  * > ^ -, word:...) -> build (strip sung slur parens) -> mkrend + fresh check (fc/FRESHCHECK.md) -> fixes -> stitch section -> words etc.
- KIT FIXES 4 Nov: sung pitch ABSOLUTE (bare letter = natural; old build applied key -> wrong flats, found in S1a); reqacc --fix in build.sh;
  sung dyn:/word:/hp: tokens; articulations on sung notes (* > ^ -); piano ^ = marcato (was staccatissimo), - tenuto, hp: hairpins; word "_" -> space.
- S4/S1a fixes applied from fresh checks (see # FIX lines). Marks sweeps running for S4, S1a (2 halves), S2a.
- 4 Nov 14:10: S4 and S1a marks sweeps done and rebuilt (b4/s4.xml now PRINTED order R,M,S,C; b1/s1a.xml order R,M). kit/cleanv.py strips sung slurs.
  S4 second fresh round running. S1a second fresh round: do it on the stitched S1 (S1a+S1b+S1c) once S1b/S1c are judged+swept.
- Figaro check (user asked): naturals bug does NOT affect Figaro (natscan /dev/shm/natscan.py: 0 hits in 37 files). Figaro lacks hairpins and
  sung articulations (format never captured them): offered a Figaro marks sweep after Bohème Act 1 is published.
- USER (14:05): Figaro marks sweep AFTER Bohème. Queue it.
- 14:25: S4 second fresh round CLEAN -> S4 DONE musically (b4/s4.xml). Next for S4: words (LANG), cfg/mkpiece, register, publish.
- S2a fresh fixes applied (grace slurs 4/19/34, staccatos 19, 57); S2a waits for S2b to stitch section 2.
- S1c judge running. Sidebar "Continue" row published (v347) and committed.
- 14:45: S1c judged (piano bars 10-16 as triplets in 2/4) -> marks sweep running. S1b B fixed (107 bars) -> judge running. S3a judge running.
  S5a B reader running; S6 A reader running; S2b B, S3b B readers running.
  S4 app integration agent running (words/IPA, manifest, operas/scenes wiring, tempo 116/138/162). Publish after it reports.
- S1 stitch plan: kit/stitch.py OUT S1a S1b S1c (offsets 0,159,266; total 335). SEGS for whole S1:
  1/3/8/0/Allegro vivace;88/6/8/-2/Lo stesso movimento;112/3/8/-2/Lo stesso movimento;160/3/8/-2/;165/2/8/-2/;166/3/8/-2/;198/6/8/-2/;223/6/8/0/;267/6/8/0/;276/2/4/0/;287/2/4/-6/Lo stesso movimento;305/3/8/-6/Vivo;312/2/4/-6/;314/3/4/-6/;315/3/8/-6/;321/2/4/-6/;335/6/8/2/Allegro
  Singers "R:Rodolfo:R.:G/2/-1,M:Marcello:M.:F/4,C:Colline:C.:F/4" (+ R2 ossia: check how mk6 handles R2). Waiting: S1b marks sweep.
