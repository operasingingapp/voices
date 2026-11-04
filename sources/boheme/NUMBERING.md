# La bohème (Ricordi vocal score, Carignani reduction): pages, bars, singers

Page images: /home/claude/ext/boheme/pages/p-NNN.png (about 280 dpi; p-001.png = printed page 1; PDF page = printed
page). The score PDF is /home/claude/ext/boheme/src/vs.pdf (render one page at 400 dpi for zooming:
pdftoppm -r 400 -f N -l N /home/claude/ext/boheme/src/vs.pdf OUTPREFIX -png). A page-by-page map of the whole opera
(tempi, figures, who sings where) is in /home/claude/ext/boheme/map/*.md: use it to orient yourself, but write only
what the page shows.

The voice staves sit above the two braced piano staves; one voice staff often carries several singers in turn (the
printed name over each entry says who). Give each singer their own line in every bar of your range.

SINGER codes:
  R = Rodolfo   M = Marcello   C = Colline   S = Schaunard   B = Benoît   I = Mimì   U = Musetta   A = Alcindoro
  P = Parpignol   G = Sergente   D = Doganiere
  Chorus (Coro): codes by VOICE GROUP, constant through a scene (NOT by staff position, which changes per system). Act 2:
  K1, K2 Venditori basses (two staves); K3 La Folla sopranos (K3b a printed second soprano voice); K4 La Folla tenors;
  K5 Monelli; K6 Dal Caffè tenors; K7 Dal Caffè basses; other groups K8, K9 ... named in a header remark.
Rodolfo, Parpignol and tenor chorus lines printed in treble clef sound an octave lower: write the sounding pitch.

YOUR CHUNK is named in your task (pages and the exact first and last bar). Number its bars from 1 (bar 1 = the first
bar of your chunk). A bar running across a system or page break is ONE bar. At the start of every system write
"# page PPP system K starts bar N" (or "starts inside bar N"), and remark every tempo, metronome, key and time change.
Write a line for every singer who sings anywhere in your chunk, in every bar of the chunk.
