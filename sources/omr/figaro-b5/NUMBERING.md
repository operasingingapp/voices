# Pages, systems and bar numbers (Le nozze di Figaro, Breitkopf vocal score, printed pages 101-119)

Images: /home/claude/ext/figaro/b5/sys/sysSS_pagePP.png, one per system, in order (SS = system index, PP = printed
page). Full pages at 300 dpi: /home/claude/ext/figaro/b5/pg-01.pgm ... pg-19.pgm (printed page = file number + 100).
ZOOM whenever there is any doubt (python PIL crop + resize 3-4x on the 300 dpi page).

In every number, the sung staff carries the ITALIAN words (upper line of text). GERMAN words are printed either on a
second sung staff below (recitatives) or as a second text line under the Italian (No. 11, No. 12): ignore German
completely, and ignore the second (German) sung staff of the recitatives completely (its rhythm can differ).

Five numbers, each numbered from bar 1. A bar that runs across a system break (no barline at the end of the system)
is ONE bar. At the start of each system write a remark line "# sysSS starts bar N" (or "# sysSS starts inside bar N").

- RECIT_A "Quanto duolmi, Susanna" (Recitativo, 4/4, Scena III): from the top of page 101 (sys00) to the double bar
  at the end of sys09 (page 103, second system). Singers on the one Italian staff: C = La Contessa, S = Susanna,
  H = Cherubino; the printed names above the staff say who sings from where.
- CANZONA No. 11 "Voi che sapete" (Andante con moto, 2/4, B flat major): from "No 11 Canzona" (sys10, page 103) to the
  double bar ending sys25 (page 106, fourth system). Bar 1 = the first bar after "Andante con moto". Singer: H
  (Cherubino, staff marked "Ch."; treble clef, sounds as written).
- RECIT_B "Bravo! che bella voce!" (Recitativo, 4/4): from "Recitativo" (sys26, page 106, last system) to the double
  bar at the end of sys34 (page 108). Singers C, S, H as above.
- ARIA No. 12 "Venite, inginocchiatevi" (Allegretto, 2/4, G major): from "No 12 Aria" (sys35, page 109) to the end
  of sys60 (page 113). Singer: S (Susanna). (sys45 does not exist.)
- RECIT_C "Quante buffonerie!" (Recitativo, 4/4): from "Recitativo" (sys61, page 114) to the double bar at the end of
  sys82 (page 119, third system). STOP there: sys83 ("Scena V") is not part of this batch. Singers C, S, H and
  O = Il Conte (the Count, offstage, bass clef where printed).
- NOTE: page 118 has FOUR systems: sys77, sys78, sys78b (the third, "De-i! son morta..."), sys79. sys78b was added late; do not miss it.
