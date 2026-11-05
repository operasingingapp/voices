# La bohème: tempo audit and tempo map (Act 1 and the opening of Act 2)

Scope: the nine app pieces `puccini-{questo-mar-rosso, legna, si-puo, al-quartiere-latin, non-sono-in-vena,
che-gelida-manina, mi-chiamano-mimi, ehi-rodolfo, o-soave-fanciulla}` and `ext/boheme/b10/s10.xml`
("Aranci, datteri", pp. 83-99). Source: the Ricordi vocal score (plate 99000), `ext/boheme/src/vs.pdf`. I checked every
metronome mark on pp. 1-99 at 400 dpi.

No repo file was edited.

## 0. How the app reads tempo (verified in code)

- `<sound tempo>` is stored as-is as quarter notes per minute (`scripts/import-content.ts` handleSound;
  `shared/timeline.ts`, where `q` counts quarters and seconds = Δq·60/bpm). So 6/8 at ♩. = 108 must be written as
  162, and 2/8 at ♪ = 132 as 66.
- If bar 1 has no tempo at beat 0, the importer inserts **♩ = 120** (`import-content.ts` l. 503). Anything before the
  first written tempo plays at 120.
- Rall., rit., a piacere and the like are not played unless the file spells them out. Fermatas are held at about twice
  their length only in "steady" mode. All durations below therefore come from the tempo map alone (sum of bar lengths
  ÷ tempo), with no fermatas or rubato. They are a floor, not a prediction of a performance.
- The current maps in the brief leave out some entries that the files do contain. I worked from the files:
  - si-puo b122 (beat 3) Lento 78 and b154 (beat 2) Meno 138
  - non-sono b42 Lento a piacere 52
  - ehi-rodolfo b1 100
  - o-soave b31 at beat 2 (q=1), not bar start
  - mi-chiamano b1 at beat 3 (q=2), not bar start

## 1. Every printed tempo heading and metronome mark, pp. 1-99, checked on the page

| p. / sys | Print (exact) | Note value | Time | Piece, bar | App value now | OK? |
|---|---|---|---|---|---|---|
| 1/1 | ALL.º VIVACE ♩. = 108 | dotted crotchet | 3/8 | QMR b1 | 162 | ✓ |
| 4/2 | LO STESSO MOVIMENTO | (relation) | 6/8 | QMR b88 | 162 | ✓ ♩. kept |
| 6/1 | LO STESSO MOVIMENTO | (relation) | 3/8 | QMR b112 | 162 | ✓ |
| 10/1 | A tempo come prima | (relation) | 3/8 → 6/8 (b198) | QMR b197 | 162 | ✓ |
| 15/2 | voices change to 2/4 while the piano stays in 6/8, same bar lines | ♩(2/4) = ♩.(6/8) | 2/4 over 6/8 | QMR b276 | 108 | ✓ |
| 16/2 | LO STESSO MOVIMENTO / Sostenendo | (relation) | 2/4 | QMR b287 | 108 | ✓ |
| 17/3 | VIVO in 1 | none | 3/8 | QMR b305 | 162 (♩. = 108) | chosen, fine |
| 18/2 | ♩ = ♩. (old crotchet = new dotted crotchet) | equivalence | 3/4 → 3/8 | QMR b315 | 162 | ✓ |
| 18/3 | ♩. = ♩ | equivalence | 3/8 → 2/4 | QMR b321 | 108 | ✓ |
| 20/1 | ALLEGRO (no number) | none | 6/8 | QMR b335 = Legna b1 | 162 | chosen, fine |
| 29/1 | MENO, then **a tempo** in the same system (b110) | none | 6/8 | Legna b107 / **b110** | 144 / **none** | ✗ a tempo ignored |
| 29/3-4 | 2/4; POCO MENO | none | 2/4 | Legna b116 / b120 | 96 / 92 | ✗ (follows from the a tempo) |
| 31/1 | ALL.tto MOSSO ♪ = 132 | **quaver** | 2/8 | Legna b141 | 66 | ✓ |
| 32/2 | MODERATO | none | 3/4 | Legna b171 | 66 | chosen, fine |
| 32/3 | I.º TEMPO (All.º Brillante) | (relation) | 6/8 | Legna b176 | 162 | ✓ |
| 33/2 | ALL.º VIVO ♩. = 152 | dotted crotchet | 6/8 | Si può b7 | 228 | ✓ |
| 35/1 | ANDANTINO MOSSO ♩. = 100 | dotted crotchet | 6/8 | Si può b31 | 150 | ✓ |
| 39/1 | ANDANTINO ♩ = 56; bar 3 **Appena Meno** | crotchet | 3/4 | Si può b67 / **b69** | 56 / none | ✗ Appena meno ignored |
| 42/1 | LO STESSO MOVIMENTO ♩ = ♩. | equivalence | 3/4 → 6/8 | Si può b90 | 84 | relation applied to the wrong tempo (see b69) |
| 43/2, 44/1 | PIÙ MOSSO (twice) | none | 6/8 | Si può b99, b110 | 94.5, 103.5 | chosen |
| 44/4 | LENTO; 2/4 | none | 6/8 → 2/4 | Si può b122/b123 | 78 / 52 | chosen, fine |
| 45/1 | ALLEGRO ♩ = 152 | crotchet | 2/4 | Si può b126 | 152 | ✓ |
| 48/1 | Meno | none | 2/4 | Si può b154 | 138 | chosen, fine |
| 49/1 | ALLEGRETTO ♩ = 116 | crotchet | 2/4 | AQL b1 | 116 | ✓ |
| 49/3 | **Meno** … muovendo | none | 2/4 | AQL **b11** | **none** | ✗ Meno ignored |
| 51/2 | ANDANTINO ♩. = 92 | dotted crotchet | 6/8 | AQL b33 | 138 | ✓ |
| 52/2 | ALL.º VIVO (I.º tempo) | (relation) | 3/8 | AQL b47 | 162 | ✓ (the music is the Act 1 opening motive, so "I.º tempo" = p. 1's ♩. = 108) |
| 54/1-2 | ALLEGRETTO (piano, "a tempo"); ALLEGRETTO | none | 2/4 | Non sono b2, b7 | 116 | chosen, fine |
| 54/4 | LENTO | none | 3/4, then C | Non sono b18 | 52 | chosen |
| 55/3 | ALL.º AGITATO | none | 3/4 | Non sono b25 | 126 | chosen |
| 56/4 | ALL.tto SOST.to; Lento a piacere | none | 2/4 | Non sono b40, b42 | 104, 52 | chosen |
| 57/1 | AND.te MOD.to ♩ = 88 | crotchet | 2/4 | Non sono b45 | 88 | ✓ |
| 58/2 | I. TEMPO (come prima) | (relation) | 2/4 | Non sono b67 | 88 | ✓ |
| 59/1 | UN POCO PIÙ MOSSO ♩ = 126 | crotchet | 2/4 | Non sono b76 | 126 | ✓ |
| 64/1 | AND.no AFFETTUOSO ♩ = 58 | crotchet | 2/4 | Che gelida b1 | 58 | ✓ |
| 66/1 | AND.te SOSTENUTO | none | 3/4 | Che gelida b37 | 54 | chosen |
| 66/3 | AND.te LENTO ♩ = 52 | crotchet | C | Che gelida b46 | 52 | ✓ |
| 67/2 | Sostenendo largamente (piano; through to the end of the aria) | none | C | Che gelida b54 | none | proposed below |
| 69/3 | (Che gelida's Andante lento continues; Mimì "Sì") | none | C | Mi chiamano b1 | **52 only from beat 3; beats 1-2 at 120** | ✗ |
| 70/1 | AND.te LENTO ♩ = 40 | crotchet | 2/4 | Mi chiamano b2 | 40 | ✓ |
| 70/4 | AND.te CALMO ♩ = 54 | crotchet | C | Mi chiamano b15 | 54 | ✓ |
| 71/4 | LENTAMENTE | none | 2/4 | Mi chiamano b26 | 40 | chosen (the "Mi chiamano" phrase returns) |
| 72/1 | ALL.tto MODERATO ♩ = 144 | **crotchet** (zoomed: no flag) | 2/4 | Mi chiamano b31 | 144 | ✓ (fast against recordings: kept, flagged) |
| 73/1 | AND.te MOLTO SOST.to | none | C | Mi chiamano b49 | 46 | chosen |
| 74/1 | I.º TEMPO AND.te agitando appena | (relation) | C | Mi chiamano b60 | 54 | ✓ (same pp crotchet chords as the Andante calmo, so I.º tempo = ♩ 54) |
| 74/3 | I. TEMPO, ma calmo | (relation) | C | Mi chiamano b66 | 54 | ✓ ("calmo" = the Andante calmo itself, against b60's "agitando") |
| 75/1 | ALL.tto come prima ♩ = 100 | crotchet | 2/4 | Ehi Rodolfo b3 | 100 | ✓ |
| 78/1 | LARGO SOST.to ♩ = 58 | crotchet | C | O soave b1 | 58 | ✓ |
| 80/1 | SEMPRE PIÙ SOSTENUTO | none | C | O soave b17 | 52 | chosen |
| 81/1 | CALMO | none | C | O soave b24 | 52 | chosen |
| 81/3 | ♩ = 58 (after the double bar, at bar start) | crotchet | C | O soave b31 | 58 **at beat 2** | ✗ (small) |
| 83/1 | ♩ = 112 ALL.º FOCOSO (in due) | crotchet (= the whole 2/8 bar) | 2/8 | s10 b1 | **no map (plays 120)** | ✗ |
| 90/3 | LO STESSO MOVIMENTO, legato e un poco sostenuto | (relation) | 3/4 | s10 b104 | none | — |
| 94/2 | Sostenendo un poco | none | 3/4 | s10 b130 | none | — |
| 97/1 | LO STESSO MOVIMENTO ma un po' più animando | (relation) | 2/8 | s10 b147 | none | — |
| 98/1 | LO STESSO MOVIMENTO; piano "animando poco a poco" | (relation) | 3/4 | s10 b160 | none | — |
| 99/1 | I. TEMPO come prima | (relation) | 2/8 | s10 b168 | none | — |

The page map (`map_*.md`) is accurate for all of these. Every metronome mark's note value matches the app's
conversion. The app has no note-value misreadings.

## 2. Errors found

1. **Legna b110: "a tempo" ignored (real error).** Puccini's MENO on p. 29 covers only three bars
   (b107-109, "Lorito allargò l'ali…"). The "a tempo, f risoluto" at b110 restores the Allegro. The app keeps
   ♩. = 96 to b115, then carries the slower beat into the 2/4 (96) and Poco meno (92). The whole passage
   b110-140 is one or two steps too slow.
2. **Si può b69: "Appena Meno" ignored, and the p. 42 equivalence applied to the wrong tempo.** The printed ♩ = 56
   governs only the two-bar intro, which carries its own rall. From b69, "Dica: quant'anni ha", the scene is
   "appena meno" (just slower). "Lo stesso movimento ♩ = ♩." at b90 equates the 6/8 dotted crotchet to that slower crotchet.
   The current map uses ♩. = 56 and builds both Più mosso values (63, 69) on it.
3. **Al Quartiere Latin b11: "Meno" not mapped.** Elsewhere the app maps Meno as about a tenth slower (Legna b107,
   Si può b154). Here "Là ci son beltà scese dal cielo" stays at the Allegretto's 116. This breaks the
   app's own convention.
4. **Mi chiamano Mimì b1: tempo written at beat 3.** Beats 1-2 of bar 1 (the piano's last chord of "Che gelida
   manina", allargando e dim. molto) play at the importer's default ♩ = 120, then drop to 52. The value should be
   at q = 0.
5. **O soave fanciulla b31: printed ♩ = 58 written at beat 2 (q = 1).** The print puts it at the bar line after the
   double bar, so beat 1 of b31 plays at the Calmo's 52.
6. **Aranci, datteri (s10): no tempo map at all.** It plays at the default ♩ = 120 instead of the printed ♩ = 112, and the
   four printed "lo stesso movimento / più animando / I. tempo" relations are absent.
7. **PIECE_INFO wording:**
   - al-quartiere-latin's text calls "Allegro vivo ♩. = 108" a printed metronome mark. Nothing is printed there:
     the value comes from the "(I.º tempo)" relation.
   - legna's text describes the Meno as lasting to bar 116.
   - si-puo's text says "Appena meno left as a nuance".
   - These texts need updating with the new values.

Checked and fine:
- All metronome conversions.
- QMR's whole chain of "lo stesso movimento" and ♩ = ♩. relations, including the 2/4 voices over 6/8 piano at b276
  (the bars coincide, so ♩ = ♩.).
- I.º tempo readings in AQL b47, Legna b176, Non sono b67 and Mi chiamano b60/b66.
- Joins between consecutive pieces. Each piece starts at the tempo the previous one ends on, or at a new printed
  heading. The one exception was the 120 blip at Mi chiamano b1.

## 3. Recordings (track timings) and how they compare

Track splits differ by label. The span each track covers is given in app bars. The app value is the proposed map
over the same span (no fermatas or rubato).

| App span | Toscanini 1946 | Beecham 1956 | Votto 1956 | Karajan 1972 | Solti 1973 | Pappano (rec. 1995) | Median | App (proposed) | App vs median |
|---|---|---|---|---|---|---|---|---|---|
| QMR b1-331 (to "Abbasso l'autor") | 5:10 | 5:44 | 5:38 | 5:43 | 5:40 | 5:24 | **5:39** | 4:25 | −22 % |
|  · b1-86 | 0:50 | | | | 0:57 | | | 0:48 | −10 % |
|  · b87-246 | 2:21 | | | | 2:27 | | | 2:09 | −10 % |
|  · b247-289 | 0:54 | | | | 0:56 | | | 0:48 | −13 % |
|  · b290-331 (Pensier profondo … molto rall. e stent.) | 1:05 | | | 1:11 | 1:20 | | | 0:40 | −40 % |
| Legna (QMR b332 to Si può b4) | 3:37 | 3:39 | 3:47 | 3:49 | 3:41 | 3:41 | **3:41** | 3:36 | −2 % |
| Si può b1-98 | 2:46 | | | | 3:03 | | | 2:46 | 0 / −9 % |
| Si può (whole) | | 4:35 | 4:19 | | | 4:17 | **4:19** | 4:03 | −6 % |
| Si può b99 → Non sono b15 | 3:24 | | | | 3:36 | | | 2:50 | −19 % |
| AQL + Non sono b1-15 | | | 1:44 | | | 1:44 | **1:44** | 1:28 | −15 % |
| Non sono b16-155 (+ Che gelida b1-2) | 3:19 | | 3:49 | 3:54 | 3:37 | 3:51 | **3:49** | 3:05 | −19 % |
|  · b17-74 / b75-155 | 1:59 / 1:20 | | | | 2:02 / 1:35 | | | 1:42 / 1:18 | −15 % / −10 % |
| Che gelida manina | 4:11 | 5:00 | 5:01 | 4:38 | 4:26 | 4:26 | **4:32** | 3:51 (now 3:44) | −15 % |
| Sì. Mi chiamano Mimì | 4:18 | 5:12 | 4:55 | (6:00 incl. Ehi) | 4:40 | 4:49 | **4:49** | 3:49 | −21 % |
| Ehi! Rodolfo! | 0:41 | 0:47 | | | 0:38 | | **0:41** | 0:34 | −17 % |
| O soave fanciulla (alone) | 3:48 | 4:16 | | 4:17 | 4:03 | | **4:09** | 3:07 | −25 % |
| Ehi + O soave | 4:29 | 5:03 | 4:59 | | 4:41 | 3:58 | **4:41** | 3:41 | −21 % |
| Aranci, datteri (s10, to "Chi guardi?") | | 2:51 | 2:51 | 2:53 | | 2:49 | **2:51** | 2:38 (now 2:22) | −8 % |

What the comparison shows:

- **Where the printed marks are the only thing playing, they hold up.**
  - Toscanini, the nearest to the composer's era, matches the print almost exactly. Si può b1-98 has four printed
    marks plus a printed relation: 2:46 against 2:46. QMR b1-86 is within 4 %.
  - Legna as a whole is within 2 % of every recording.
  - "Aranci" is within 8 %.
- **The big gaps are in sections dense with written rubato, which the map does not play.**
  - QMR b290-331, at −40 %, is the stretch with rit./rall., "a piacere", "molto rall. e stent." and fermatas.
  - The love scene (Che gelida, Mi chiamano, O soave) has, per piece, 10-15 rall./allarg./rit. marks, several
    fermatas, a free cadenza and long held final notes.
  - At −15 to −25 % the app is faster than every recording, Toscanini included. Toscanini is still 9-16 % slower than
    the map in these pieces. That is the expected effect of unmodelled rubato added to a performance tradition broader than
    Puccini's marks.
  - The rule (keep the print) applies. These sections are flagged under each piece, and §5 gives an optional fix.
- Serafin/Tebaldi 1959: no complete track listing with timings could be found online, so it is not used.

## 4. Proposed tempo maps

Values are quarter notes per minute (the `<sound tempo>` number), then the same value in the print's own unit. "Beat
q" means the position inside the bar in quarters. Rows marked **NEW** or **CHANGED** differ from the current file.

### 4.1 Questo Mar Rosso (pp. 1-20, 335 bars): no change

| Bar | Time | Print | Current | Proposed | Print's unit | Basis |
|---|---|---|---|---|---|---|
| 1 | 3/8 | Allegro vivace ♩. = 108 | 162 | 162 | ♩. = 108 | printed |
| 88 | 6/8 | Lo stesso movimento | 162 | 162 | ♩. = 108 | printed relation |
| 112 | 3/8 | Lo stesso movimento | 162 | 162 | ♩. = 108 | printed relation |
| 197 | 3/8 (6/8 from 198) | A tempo come prima | 162 | 162 | ♩. = 108 | printed relation |
| 276 | 2/4 (piano 6/8) | — | 108 | 108 | ♩ = 108 (= ♩. 108) | printed relation: 2/4 and 6/8 bars coincide |
| 287 | 2/4 | Lo stesso movimento, Sostenendo | 108 | 108 | ♩ = 108 | printed relation |
| 305 | 3/8 | Vivo in 1 | 162 | 162 | ♩. = 108 | chosen: no number; one beat a bar, as the opening Allegro vivace |
| 312 | 2/4 (3/4 at 314) | — | 108 | 108 | ♩ = 108 | chosen: beat kept, consistent with the p. 18 equivalences |
| 315 | 3/8 | ♩ = ♩. | 162 | 162 | ♩. = 108 | printed relation |
| 321 | 2/4 | ♩. = ♩ | 108 | 108 | ♩ = 108 | printed relation |
| 335 | 6/8 | Allegro | 162 | 162 | ♩. = 108 | chosen: Legna's first bar, same value |

Duration: 4:29 → 4:29. The recording median is 5:39 (−22 %). The print is confirmed at the opening (Toscanini −4 %).
The deficit sits in the rubato-heavy b290-331 and in the "Nei cieli bigi" stretches (−10 %). Keep the print.

### 4.2 Legna! (pp. 20-33, 183 bars)

| Bar | Time | Print | Current | Proposed | Print's unit | Basis |
|---|---|---|---|---|---|---|
| 1 | 6/8 | Allegro | 162 | 162 | ♩. = 108 | chosen: QMR's beat kept (its last bar is this one); recordings agree (−2 %) |
| 107 | 6/8 | Meno | 144 | 144 | ♩. = 96 | chosen: a tenth slower, nearest metronome mark |
| **110** | 6/8 | **a tempo** | (144) | **162** | ♩. = 108 | **NEW: printed "a tempo" (p. 29 sys 1)** |
| 116 | 2/4 | — | 96 | **108** | ♩ = 108 | **CHANGED: beat kept (♩ = ♩.) from the restored Allegro** |
| 120 | 2/4 | Poco meno | 92 | **100** | ♩ = 100 | **CHANGED: "a little less" than 108, nearest metronome mark** |
| 141 | 2/8 | Allegretto mosso ♪ = 132 | 66 | 66 | ♪ = 132 | printed (quaver) |
| 171 | 3/4 | Moderato | 66 | 66 | ♩ = 66 | chosen: the crotchet of ♪ 132 kept |
| 176 | 6/8 | I.º Tempo (Allegro brillante) | 162 | 162 | ♩. = 108 | printed relation |

Duration: 3:31 → 3:28. Over the recordings' span the app gives 3:36 against a median of 3:41 (−2 %).

### 4.3 Si può? (pp. 33-48, 160 bars)

| Bar | Time | Print | Current | Proposed | Print's unit | Basis |
|---|---|---|---|---|---|---|
| 1 | 2/4 | (a piacere bars) | 108 | 108 | ♩ = 108 | chosen: Legna's I.º tempo beat kept |
| 7 | 6/8 | Allegro vivo ♩. = 152 | 228 | 228 | ♩. = 152 | printed |
| 31 | 6/8 | Andantino mosso ♩. = 100 | 150 | 150 | ♩. = 100 | printed |
| 67 | 3/4 | Andantino ♩ = 56 | 56 | 56 | ♩ = 56 | printed |
| **69** | 3/4 | **Appena Meno** | (56) | **54** | ♩ = 54 | **NEW: "just slower": one metronome step under 56** |
| 90 | 6/8 | Lo stesso movimento ♩ = ♩., Sostenendo | 84 | **81** | ♩. = 54 | **CHANGED: printed relation applied to the Appena meno** |
| 99 | 6/8 | Più mosso (after accel./string.) | 94.5 | **90** | ♩. = 60 | **CHANGED: a tenth faster, nearest mark (same rule as now, on the corrected base)** |
| 110 | 6/8 | Più mosso | 103.5 | **99** | ♩. = 66 | **CHANGED: a tenth faster again** |
| 122 (q 2) | 6/8 | Lento | 78 | 78 | ♩. = 52 | chosen (kept) |
| 123 | 2/4 | — | 52 | 52 | ♩ = 52 | chosen: beat kept |
| 126 | 2/4 | Allegro ♩ = 152 | 152 | 152 | ♩ = 152 | printed |
| 154 (q 1) | 2/4 | Meno | 138 | 138 | ♩ = 138 | chosen: a tenth slower (kept) |

Duration: 4:02 → 4:08. Recording median 4:19 (−6 %). b1-98 now matches Toscanini exactly (2:46).
Optional, not applied: the Lento (52) is only 7 % under the Andantino. A Lento could fairly go to 48, but the
passage is three bars full of fermatas, so this makes no audible difference.

### 4.4 Al Quartiere Latin (pp. 49-53, 79 bars)

| Bar | Time | Print | Current | Proposed | Print's unit | Basis |
|---|---|---|---|---|---|---|
| 1 | 2/4 | Allegretto ♩ = 116 | 116 | 116 | ♩ = 116 | printed |
| **11** | 2/4 | **Meno** (then "muovendo" b15, rit./a tempo b17-23) | (116) | **104** | ♩ = 104 | **NEW: a tenth slower, nearest mark (the app's Meno rule); muovendo, rit. and a tempo are nuances within it** |
| 33 | 6/8 | Andantino ♩. = 92 | 138 | 138 | ♩. = 92 | printed |
| 47 | 3/8 | Allegro vivo (I.º tempo) | 162 | 162 | ♩. = 108 | printed relation: Act 1's first tempo (the music is the opening motive) |

Duration: 1:10 → 1:12. Recording span (with Non sono b1-15): 1:28 against 1:44 (−15 %). The gap comes from the "VUOTA"
fermata bar b10, the a piacere and rit. bars, and the offstage farewells.

### 4.5 Non sono in vena (pp. 53-63, 155 bars): no change

| Bar | Time | Print | Current | Proposed | Print's unit | Basis |
|---|---|---|---|---|---|---|
| 1 | 3/8 | (last bar of the Allegro vivo) | 162 | 162 | ♩. = 108 | relation: AQL carried on |
| 2 | 2/4 | Allegretto (a tempo) | 116 | 116 | ♩ = 116 | chosen: the printed Allegretto of AQL |
| 18 | 3/4, C from b20 | Lento | 52 | 52 | ♩ = 52 | chosen (= Si può's Lento) |
| 25 | 3/4 | Allegro agitato | 126 | 126 | ♩ = 126 | chosen |
| 40 | 2/4 | Allegretto sostenuto | 104 | 104 | ♩ = 104 | chosen |
| 42 | 2/4 | Lento a piacere | 52 | 52 | ♩ = 52 | chosen |
| 45 | 2/4 | Andante moderato ♩ = 88 | 88 | 88 | ♩ = 88 | printed |
| 67 | 2/4 | I. Tempo (come prima) | 88 | 88 | ♩ = 88 | printed relation |
| 76 | 2/4 | Un poco più mosso ♩ = 126 | 126 | 126 | ♩ = 126 | printed |

Duration: 3:17 → 3:17. Recording median for b16 to the end: 3:49, app 3:05 (−19 %).
- The printed Più mosso stretch (b75-155) is close: −10 % against Toscanini/Solti.
- The deficit is in the Andante moderato dialogue, with "lentamente", fermatas and a piacere. That section is printed;
  keep it.

### 4.6 Che gelida manina (pp. 64-69, 72 bars)

| Bar | Time | Print | Current | Proposed | Print's unit | Basis |
|---|---|---|---|---|---|---|
| 1 | 2/4 | Andantino affettuoso ♩ = 58 | 58 | 58 | ♩ = 58 | printed |
| 37 | 3/4 | Andante sostenuto | 54 | 54 | ♩ = 54 | chosen (kept) |
| 46 | C | Andante lento ♩ = 52 | 52 | 52 | ♩ = 52 | printed |
| **54** | C | **Sostenendo largamente** ("Talor dal mio forziere", to the end) | (52) | **48** | ♩ = 48 | **NEW, chosen** |

Why b54 = 48:
- It is a section-length direction, unlike the "Sostenendo" that sits beside "Lo stesso movimento" elsewhere, and it
  is not cancelled until the aria ends. The "a tempo" at b63 only undoes the molto rall. of b62.
- 48 is about 8 % broader, the nearest metronome mark.
- The recordings point the same way: the aria is −18 % against the current map.

Duration: 3:44 → 3:51. Recording median 4:32 (−15 %). The remaining gap is the ten allarg./rall. marks and the
held top C.

### 4.7 Sì. Mi chiamano Mimì (pp. 69-74, 71 bars)

| Bar | Time | Print | Current | Proposed | Print's unit | Basis |
|---|---|---|---|---|---|---|
| 1 | C | (Che gelida's Andante lento continues) | 52 at q 2 (120 before) | **52 at q 0** | ♩ = 52 | **CHANGED position: relation, previous piece carried on** |
| 2 | 2/4 | Andante lento ♩ = 40 | 40 | 40 | ♩ = 40 | printed |
| 15 | C | Andante calmo ♩ = 54 | 54 | 54 | ♩ = 54 | printed |
| 26 | 2/4 | Lentamente | 40 | 40 | ♩ = 40 | chosen: the Andante lento phrase returns |
| 31 | 2/4 | Allegretto moderato ♩ = 144 | 144 | 144 | ♩ = 144 | printed (crotchet, verified at 400 dpi) |
| 49 | C | Andante molto sostenuto | 46 | 46 | ♩ = 46 | chosen (kept) |
| 60 | C | I.º tempo, Andante agitando appena | 54 | 54 | ♩ = 54 | printed relation (= Andante calmo) |
| 66 | C | I. tempo, ma calmo | 54 | 54 | ♩ = 54 | printed relation |

Duration: 3:47 → 3:49. Recording median 4:49 (−21 %).
Flag: the printed Allegretto moderato ♩ = 144 ("Sola, mi fo il pranzo") is very likely quicker than any of the
recordings. Track splits do not isolate it, so this cannot be measured. It is not a misreading: the mark is
unambiguously a crotchet. Keep it.

### 4.8 Ehi! Rodolfo! (pp. 75-77, 28 bars): no change

| Bar | Time | Print | Current | Proposed | Print's unit | Basis |
|---|---|---|---|---|---|---|
| 1 | 2/4 | a piacere (col canto) | 100 | 100 | ♩ = 100 | chosen: the Allegretto that follows |
| 3 | 2/4 | Allegretto come prima ♩ = 100 | 100 | 100 | ♩ = 100 | printed |

Duration 0:34. Median 0:41 (−17 %, from the a piacere calls and "perdendosi"). The "come prima" points back to an
Allegretto that was printed at 116, but the explicit 100 is what counts. Keep it.

### 4.9 O soave fanciulla (pp. 78-82, 44 bars)

| Bar | Time | Print | Current | Proposed | Print's unit | Basis |
|---|---|---|---|---|---|---|
| 1 | C | Largo sostenuto ♩ = 58 | 58 | 58 | ♩ = 58 | printed |
| 17 | C | Sempre più sostenuto | 52 | 52 | ♩ = 52 | chosen (kept) |
| 24 | C | Calmo | 52 | 52 | ♩ = 52 | chosen (kept); the reprinted ♩ = 58 at b31 implies the Calmo is not 58 |
| 31 | C | ♩ = 58 | 58 at q 1 | **58 at q 0** | ♩ = 58 | **CHANGED position: printed, at the bar line** |

Duration 3:07. Median 4:09 (−25 %). This is the largest gap.
- The printed Largo ♩ = 58 covers most of the duet. The gap is mostly the big final broadenings: "rall. e dim.
  molto", "rit. molto", "allargando", "molto rall. e dim.", and the held "Amor!" fermatas.
- Keep the print. See §5.

### 4.10 Aranci, datteri (Act 2, pp. 83-99, s10.xml, 183 bars): new map

| Bar | Time | Print | Current | Proposed | Print's unit | Basis |
|---|---|---|---|---|---|---|
| 1 | 2/8 | ♩ = 112 Allegro focoso (in due) | none (120) | **112** | ♩ = 112 (one beat a bar) | printed |
| 104 | 3/4 | Lo stesso movimento, legato e un poco sostenuto | — | **104** | ♩ = 104 | printed relation (♩ = ♩) less "un poco sostenuto", about 7 % |
| 130 | 3/4 | Sostenendo un poco | — | **96** | ♩ = 96 | chosen: a little more held, until the a tempo |
| 139 | 3/4 | a tempo | — | **104** | ♩ = 104 | printed relation (back to b104) |
| 147 | 2/8 | Lo stesso movimento ma un po' più animando | — | **120** | ♩ = 120 | chosen: the 2/8 crotchet of 112, "a little more animated" (I. tempo at b168 shows this is not 112) |
| 160 | 3/4 | Lo stesso movimento (piano: animando poco a poco) | — | **120** | ♩ = 120 | printed relation |
| 164 | 3/4 | (animando poco a poco continues) | — | **126** | ♩ = 126 | chosen: the animando spelled out in one step |
| 168 | 2/8 | I. Tempo come prima | — | **112** | ♩ = 112 | printed relation |

"In due" in 2/8 at ♩ = 112: the crotchet is the whole bar. Beating quavers at 224 is not playable, so "in due"
means bars grouped in pairs, one beat per bar. Either reading gives ♩ = 112 for playback.

Duration: 2:22 at the default 120 → 2:38. Recording median 2:51 (−8 %).

## 5. Optional (not part of the map): where to spend the missing minutes

If the owner wants the lyrical pieces to sound performed rather than metronomic, the honest fix is not to slow down
the printed tempi. It is to spell out the few big written broadenings as tempo steps, which "steady" mode then plays
as ramps (three or more steps half a beat or less apart). Ordered by payoff:
- QMR b328-334: dim. e rall. molto, molto rall. e stent., a piacere, corta.
- Che gelida b62 and b65-71: molto rall., allarg. sempre, allargando e dim. molto.
- Mi chiamano b55-58 and b69-71: poco allarg., rall. molto, and the senza rigore cadenza.
- O soave b28 and b39-44: rall. e rit. molto, allargando, molto rall. e dim.

## 6. Recording sources

- Toscanini, NBC SO, Albanese/Peerce, rec. 3-10 Feb 1946 (RCA): track list with lengths,
  https://musicbrainz-mirror.music-assistant.io/release/a7b6d444-e2f6-424c-aafa-ffa95e476ad4
- Beecham, RCA Victor SO, de los Angeles/Björling, rec. Mar-Apr 1956:
  - first three Act 1 track titles and lengths from Presto, https://prestomusic.com/classical/products/7931521--puccini-la-boheme
  - all track lengths (Act/scene only) from https://raygum.com/releases/RLjKdLTrdswW/la-boheme
  - Spans after Legna are matched by scene description, so they are less certain.
- Votto, La Scala, Callas/Di Stefano, rec. Aug-Sep 1956 (EMI; Callas Remastered),
  https://brainz.musichoarders.xyz/release/6a65d5fa-b984-4f1a-8b93-4bdd0cd65324
- Karajan, Berlin PO, Freni/Pavarotti, rec. Oct 1972 (Decca, 2024 remaster):
  - https://mag.highresaudio.com/album/view/226srf/luciano-pavarotti-berliner-philharmoniker-herbert-von-karajan-puccini-la-boheme-deluxe-edition-remastered-2024
  - track identity: https://mb.videolan.org/recording/cfece6be-ca92-46dd-b9c2-3074e4bd3d3f
- Solti, LPO, Caballé/Domingo, rec. 1973 (RCA), https://brainz.musichoarders.xyz/release/8a83ec5f-8dad-4a17-b6d4-958c904da2e3
  and https://brainz.musichoarders.xyz/release/87e2e294-5f2e-4ab2-868d-6a12971f63e0
- Pappano, Philharmonia, Vaduva/Alagna (EMI, rec. 1995, released 1996; the brief's "1999" is a later reissue date at
  most), https://www.qobuz.com/us-en/album/puccini-la-boheme-antonio-pappano/i3ga2j16dutva
- Serafin/Tebaldi 1959 (Decca): no timed track list found
  (https://www.allmusic.com/album/puccini-la-bohme-mw0002211041 gives only a total of 2:07:38, which looks like a set
  with fillers). Not used.

Scripts used for the durations (scratchpad, not in the repo):
- `/tmp/claude-0/-home-claude/3ebe1904-2cd5-5bf6-b252-ae0b967f4c22/scratchpad/tmap.py` reads the tempo maps and
  computes the durations.
- `/tmp/claude-0/-home-claude/3ebe1904-2cd5-5bf6-b252-ae0b967f4c22/scratchpad/prop.py` runs the proposed maps over
  the track spans.
