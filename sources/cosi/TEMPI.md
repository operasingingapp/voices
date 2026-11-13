# Così fan tutte: tempo review (all 32 pieces in the app)

Date: 2026-11-13. Scope: every Così piece listed under `cosi` in `src/standalone/scenes.ts` that exists in `content/pieces/` (32 pieces, Sinfonia to No. 16 “E voi ridete?”, including No. 15a “Rivolgete a lui lo sguardo”).

## Method

- **Current length** is the playback length the app's Listen view uses (`Performance` from `shared/timeline.ts` in `"steady"` mode: section tempos, fermatas held, gentle final broadening), computed from a dry-run import of the current files. It differs from the import's "at score tempo" figure by a second or two at most.
- **Recordings**: track timings of complete Così sets (and, for No. 15a, of aria recitals), read from store and catalogue track lists (sources at the end). 1.5 s is taken off each track for leading/trailing silence (same convention as `sources/figaro-tempi/tempo_calc.py`), so the medians below are ~1.5 s below the raw track times.
- **Exact coverage / adjustments**: where a track covers exactly the piece (or the section), its length is used directly. Where a track spans two units (e.g. Böhm's and Haitink's aria track for “Vorrei dir” starts at “Barbaro fato!”, the last line of the recitative before; their quintet track No. 9 starts at “Muoio d'affanno”, the last line of “Non v'è più tempo”; most “Che sussurro” tracks run on into the accompagnato “Temerari”; Haitink's “Che vita maledetta” track runs through “Ah scostati”; Marriner's tracks pair numbers), the combined track is compared with the combined current length of the units it covers, and that recording's ratio is applied to each unit. The table shows such entries as “a+b for X + Y (≈ m:ss here)”, the second figure being the length implied for this piece. Section-level comparisons were possible for Smanie (recit / aria), Come scoglio (Temerari / aria) and Di scrivermi (quintet / chorus reprise), because the recordings put those on separate tracks; everything else is compared as a whole piece.
- **Median**: the median of the per-recording ratios, times the current length (for directly-covered pieces this is just the median of the track lengths).
- **Rule**: a piece changes only if its current length is more than 10% off that median (or a section relation is wrong). Changed pieces were rescaled so their length lands on the median, keeping printed relations (only one `<sound tempo>` per section in every changed piece, so no ramps were affected). Only `<sound tempo="…">` values were edited.
- **Section relations checked**: Sinfonia Andante ♩ 67 / Presto 𝅗𝅥 136; Ah guarda Andante ♪ 70 / Allegro ♩ 93 / Adagio ♩ 40; Smanie; Come scoglio (Andante maestoso 66 / Allegro 126 / Più Allegro 144); Alla bella Despinetta (132 / 165 / 𝅗𝅥 110); Rivolgete (138 / 𝅗𝅥 108); In uomini (♩ 60 / ♩. 72); none is wrong against the printed words, so none was changed for relation reasons. One relation was *created*: the chorus reprise in No. 9 and No. 8 “Bella vita militar” (same music, both Maestoso) both land on the recording medians at 𝅗𝅥 = 67, so they now share that value (before: 56½ and 57½).
- **Not verifiable from tracks**: the Andante/Allegro split inside “Ah guarda, sorella” and the Andante/Presto split of the Sinfonia (tracks are not split there). Both pieces are within 5% of the median as a whole and were left as they are.

## Result table

Lengths m:ss. “off” = current vs median. “(n)” = number of recordings used.

| Piece / section | Current | Median (n) | off | Recordings used (track times) | New | Changed |
|---|---|---|---|---|---|---|
| `cosi-sinfonia` | 4:28 | 4:26 (9) | +1.0% | Böhm 1962 4:48; Haitink 1986 4:32; Solti 1994 4:07; Nézet-Séguin 2012 4:10; Currentzis 2013 3:52; Gardiner 1992 4:17; Muti 1982 4:27; Marriner 1989 4:35; Davis 1974 4:27 | 4:28 | no |
| `la-mia-dorabella` | 1:59 | 1:58 (7) | +0.7% | Böhm 1962 2:03; Haitink 1986 2:00; Solti 1994 1:52; Currentzis 2013 1:53; Gardiner 1992 2:03; Muti 1982 1:59; Marriner 1989 3:07 for la-mia-dorabella + fuor-la-spada (≈2:01 here) | 1:59 | no |
| `fuor-la-spada` | 1:04 | 1:02 (7) | +1.7% | Böhm 1962 0:59; Haitink 1986 1:23; Solti 1994 1:04; Nézet-Séguin 2012 1:07; Currentzis 2013 1:02; Gardiner 1992 1:04; Marriner 1989 3:07 for la-mia-dorabella + fuor-la-spada (≈1:04 here) | 1:04 | no |
| `e-la-fede-delle-femmine` | 1:09 | 1:06 (7) | +5.6% | Böhm 1962 1:12; Haitink 1986 1:12; Solti 1994 1:02; Nézet-Séguin 2012 1:06; Currentzis 2013 1:01; Gardiner 1992 1:07; Marriner 1989 2:54 for e-la-fede-delle-femmine + scioccherie-di-poeti (≈1:20 here) | 1:09 | no |
| `scioccherie-di-poeti` | 1:20 | 1:30 (7) | -11.8% | Böhm 1962 1:04; Haitink 1986 1:32; Solti 1994 1:17; Nézet-Séguin 2012 1:33; Currentzis 2013 1:19; Gardiner 1992 1:35; Marriner 1989 2:54 for e-la-fede-delle-femmine + scioccherie-di-poeti (≈1:32 here) | 1:31 | yes — ♩ 117 → 103 |
| `una-bella-serenata` | 2:23 | 2:18 (7) | +3.1% | Böhm 1962 2:22; Haitink 1986 2:25; Solti 1994 2:20; Nézet-Séguin 2012 2:24; Currentzis 2013 2:15; Gardiner 1992 2:20; Marriner 1989 2:20 | 2:23 | no |
| `ah-guarda-sorella` | 5:02 | 4:48 (6) | +5.2% | Böhm 1962 4:44; Haitink 1986 4:54; Solti 1994 4:33; Nézet-Séguin 2012 4:37; Currentzis 2013 5:09; Muti 1982 5:04 | 5:02 | no |
| `mi-par-che-stamattina` | 1:02 | 1:14 (5) | -15.0% | Böhm 1962 1:02+0:40 for mi-par-che-stamattina + vorrei-dir (≈1:02 here); Haitink 1986 1:05+0:39 for mi-par-che-stamattina + vorrei-dir (≈1:03 here); Solti 1994 1:16; Nézet-Séguin 2012 1:20; Currentzis 2013 1:15 | 1:13 | yes — ♩ 110 → 94 |
| `vorrei-dir` | 0:37 | 0:39 (6) | -5.3% | Böhm 1962 1:02+0:40 for mi-par-che-stamattina + vorrei-dir (≈0:37 here); Haitink 1986 1:05+0:39 for mi-par-che-stamattina + vorrei-dir (≈0:38 here); Solti 1994 0:36; Nézet-Séguin 2012 0:44; Currentzis 2013 0:44; Marriner 1989 1:44 for vorrei-dir + stelle-per-carita (≈0:41 here) | 0:37 | no |
| `stelle-per-carita` | 0:56 | 1:01 (6) | -8.8% | Böhm 1962 0:56; Haitink 1986 1:01; Solti 1994 1:03; Nézet-Séguin 2012 1:03; Currentzis 2013 1:05; Marriner 1989 1:44 for vorrei-dir + stelle-per-carita (≈1:02 here) | 0:56 | no |
| `sento-o-dio` | 3:53 | 4:08 (5) | -5.9% | Haitink 1986 4:55; Solti 1994 3:57; Nézet-Séguin 2012 4:00; Currentzis 2013 4:09; Marriner 1989 5:58 for sento-o-dio + non-piangere-idol-mio (≈4:58 here) | 3:53 | no |
| `non-piangere-idol-mio` | 0:46 | 0:54 (5) | -16.1% | Haitink 1986 1:02; Solti 1994 0:48; Nézet-Séguin 2012 0:56; Currentzis 2013 0:55; Marriner 1989 5:58 for sento-o-dio + non-piangere-idol-mio (≈0:59 here) | 0:55 | yes — ♩ 90 → 75 |
| `al-fato-dan-legge` | 1:32 | 1:24 (5) | +10.7% | Haitink 1986 1:37; Solti 1994 1:12; Nézet-Séguin 2012 1:25; Currentzis 2013 1:24; Marriner 1989 1:57 for al-fato-dan-legge + la-commedia-e-graziosa (≈1:32 here) | 1:24 | yes — ♩ 51 → 56 |
| `la-commedia-e-graziosa` | 0:24 | 0:28 (6) | -15.9% | Böhm 1962 0:23; Haitink 1986 0:31; Solti 1994 0:31; Nézet-Séguin 2012 0:28; Currentzis 2013 0:43; Marriner 1989 1:57 for al-fato-dan-legge + la-commedia-e-graziosa (≈0:23 here) | 0:28 | yes — ♩ 83 → 70 |
| `bella-vita-militar` | 1:47 | 1:30 (6) | +19.6% | Böhm 1962 1:47; Haitink 1986 1:32; Solti 1994 1:30; Nézet-Séguin 2012 1:28; Currentzis 2013 1:25; Marriner 1989 2:17 for bella-vita-militar + non-ve-piu-tempo-amici (≈1:47 here) | 1:30 | yes — ♩ 113 → 134 (𝅗𝅥 56½ → 67) |
| `non-ve-piu-tempo-amici` | 0:28 | 0:29 (6) | -2.2% | Böhm 1962 0:28+1:58 for non-ve-piu-tempo-amici + di-scrivermi-ogni-giorno[0] (≈0:27 here); Haitink 1986 0:37+1:55 for non-ve-piu-tempo-amici + di-scrivermi-ogni-giorno[0] (≈0:28 here); Solti 1994 0:31; Nézet-Séguin 2012 0:34; Currentzis 2013 0:31; Marriner 1989 2:17 for bella-vita-militar + non-ve-piu-tempo-amici (≈0:28 here) | 0:28 | no |
| `di-scrivermi-ogni-giorno` — quintet bars 1–27 | 2:01 | 2:01 (5) | +0.3% | Böhm 1962 0:28+1:58 for non-ve-piu-tempo-amici + di-scrivermi-ogni-giorno[0] (≈1:56 here); Haitink 1986 0:37+1:55 for non-ve-piu-tempo-amici + di-scrivermi-ogni-giorno[0] (≈2:01 here); Solti 1994 1:42; Nézet-Séguin 2012 2:07; Currentzis 2013 2:23 | 2:01 | no |
| `di-scrivermi-ogni-giorno` — chorus bars 28–53 | 0:53 | 0:46 (5) | +16.5% | Böhm 1962 0:57; Haitink 1986 0:50; Solti 1994 0:47; Nézet-Séguin 2012 0:45; Currentzis 2013 0:45 | 0:45 | yes — chorus bar 28: ♩ 115 → 134 (𝅗𝅥 57½ → 67); quintet ♩ = 53 kept |
| `dove-son` | 1:04 | 0:54 (5) | +17.9% | Böhm 1962 0:51; Haitink 1986 1:02; Solti 1994 1:03; Nézet-Séguin 2012 0:56; Currentzis 2013 0:56 | 0:55 | yes — ♩ 64 → 75 |
| `soave-sia-il-vento` | 3:06 | 3:00 (7) | +3.8% | Böhm 1962 3:03; Haitink 1986 3:01; Solti 1994 2:46; Nézet-Séguin 2012 2:51; Currentzis 2013 3:26; Gardiner 1992 2:56; Muti 1982 3:21 | 3:06 | no |
| `non-son-cattivo-comico` | 1:09 | 1:02 (5) | +10.3% | Böhm 1962 1:04; Haitink 1986 1:18; Solti 1994 1:00; Nézet-Séguin 2012 1:05; Currentzis 2013 1:00 | 1:03 | yes — ♩ 91 → 100 |
| `che-vita-maledetta` | 1:05 | 0:58 (5) | +10.5% | Böhm 1962 0:51; Haitink 1986 1:56 for che-vita-maledetta + ah-scostati-smanie-implacabili[0] (≈0:55 here); Solti 1994 1:00; Nézet-Séguin 2012 1:10; Currentzis 2013 1:08 | 0:58 | yes — ♩ 85 → 94 |
| `ah-scostati-smanie-implacabili` — recit. bars 1–24 | 1:11 | 1:03 (6) | +12.1% | Böhm 1962 0:56; Haitink 1986 1:56 for che-vita-maledetta + ah-scostati-smanie-implacabili[0] (≈1:00 here); Solti 1994 1:10; Nézet-Séguin 2012 1:04; Currentzis 2013 1:05; Gardiner 1992 1:16 | 1:03 | yes — recit ♩ 79 → 89; aria ♩ 175 → 214 (𝅗𝅥 87½ → 107) |
| `ah-scostati-smanie-implacabili` — aria bars 25–126 | 2:21 | 1:56 (5) | +21.9% | Böhm 1962 1:57; Haitink 1986 1:46; Solti 1994 2:03; Nézet-Séguin 2012 1:59; Currentzis 2013 1:42 | 1:55 | yes — recit ♩ 79 → 89; aria ♩ 175 → 214 (𝅗𝅥 87½ → 107) |
| `signora-dorabella` | 2:16 | 2:06 (5) | +7.4% | Böhm 1962 1:50; Haitink 1986 2:08; Solti 1994 2:03; Nézet-Séguin 2012 2:16; Currentzis 2013 2:11 | 2:16 | no |
| `in-uomini-in-soldati` | 2:44 | 2:35 (6) | +6.3% | Böhm 1962 2:37; Haitink 1986 2:55; Solti 1994 2:35; Nézet-Séguin 2012 2:35; Currentzis 2013 2:34; Muti 1982 2:46 | 2:44 | no |
| `che-silenzio` | 2:48 | 2:56 (5) | -4.8% | Böhm 1962 2:11; Haitink 1986 2:58; Solti 1994 2:38; Nézet-Séguin 2012 3:00; Currentzis 2013 3:14 | 2:48 | no |
| `alla-bella-despinetta` | 4:38 | 4:32 (7) | +2.4% | Böhm 1962 4:42; Haitink 1986 4:33; Solti 1994 4:15; Nézet-Séguin 2012 4:15; Currentzis 2013 4:17; Gardiner 1992 4:36; Marriner 1989 7:00 for alla-bella-despinetta + che-susurro (≈4:58 here) | 4:38 | no |
| `che-susurro` | 1:53 | 2:06 (6) | -10.9% | Böhm 1962 2:26+0:49 for che-susurro + come-scoglio[0] (≈1:55 here); Haitink 1986 3:10+1:03 for che-susurro + come-scoglio[0] (≈2:30 here); Solti 1994 2:14; Nézet-Séguin 2012 3:40 for che-susurro + come-scoglio[0] (≈2:11 here); Currentzis 2013 3:24 for che-susurro + come-scoglio[0] (≈2:02 here); Marriner 1989 7:00 for alla-bella-despinetta + che-susurro (≈2:01 here) | 2:06 | yes — ♩ 92 → 82 |
| `come-scoglio` — recit. “Temerari” bars 1–25 | 1:15 | 1:21 (5) | -7.4% | Böhm 1962 2:26+0:49 for che-susurro + come-scoglio[0] (≈1:17 here); Haitink 1986 3:10+1:03 for che-susurro + come-scoglio[0] (≈1:40 here); Solti 1994 1:12; Nézet-Séguin 2012 3:40 for che-susurro + come-scoglio[0] (≈1:27 here); Currentzis 2013 3:24 for che-susurro + come-scoglio[0] (≈1:21 here) | 1:15 | no |
| `come-scoglio` — aria bars 26–153 | 4:24 | 4:28 (5) | -1.7% | Böhm 1962 4:30; Haitink 1986 4:36; Solti 1994 4:31; Nézet-Séguin 2012 4:09; Currentzis 2013 3:58 | 4:24 | no |
| `ah-non-partite` | 1:09 | 1:00 (5) | +13.3% | Böhm 1962 0:45; Haitink 1986 1:02; Solti 1994 0:58; Nézet-Séguin 2012 1:02; Currentzis 2013 1:03 | 1:00 | yes — ♩ 81 → 92 |
| `non-siate-ritrosi` | 1:47 | 1:32 (7) | +15.3% | Böhm 1962 1:28; Haitink 1986 1:34; Solti 1994 1:28; Nézet-Séguin 2012 1:39; Currentzis 2013 1:44; Gardiner 1992 1:29; Marriner 1989 1:37 | 1:32 | yes — ♩ 76 → 88 |
| `rivolgete-a-lui-lo-sguardo` | 4:58 | 5:26 (5) | -8.5% | Hampson/Harnoncourt 2003 5:45; Gerhaher/Freiburg BO 2015 5:23; Rose/Cohen (Arcangelo) 2013 5:27; Fingerlos/Hager 2021 5:16; Mertens/Hagel 2011 6:00 | 4:58 | no |
| `e-voi-ridete` | 0:55 | 0:52 (6) | +6.9% | Böhm 1962 1:00; Haitink 1986 0:54; Solti 1994 0:50; Nézet-Séguin 2012 0:53; Currentzis 2013 0:46; Gardiner 1992 0:53 | 0:55 | no |

**14 pieces changed** (15 sections): scioccherie-di-poeti, mi-par-che-stamattina, non-piangere-idol-mio, al-fato-dan-legge, la-commedia-e-graziosa, bella-vita-militar, di-scrivermi-ogni-giorno (chorus only), dove-son, non-son-cattivo-comico, che-vita-maledetta, ah-scostati-smanie-implacabili (both sections), che-susurro, ah-non-partite, non-siate-ritrosi. Borderline cases changed because they are just over 10%: al-fato-dan-legge (+10.7%), che-vita-maledetta (+10.5%), non-son-cattivo-comico (+10.3%). Borderline cases left alone: stelle-per-carita (−8.8%), rivolgete-a-lui-lo-sguardo (−8.5%), come-scoglio recit (−7.4%).

**“Soave sia il vento”** stays at 𝅗𝅥 ≈ 27 (♩ = 53): seven recordings give a median of 3:01 (raw), and the app plays it in 3:06, 4% longer. Böhm 1962 (3:03), Haitink (3:01) and Gardiner (2:56) all sit right on it; only Solti 1994 (2:46) and Nézet-Séguin (2:51) are clearly quicker, and Muti (3:21) and Currentzis (3:26) are slower. So the current speed is not a slow outlier, even though Rattle and Klemperer were a thin basis for it. If it still feels slow, the cause is not the overall tempo. Using the quickest mainstream reading (Solti, 2:46) would mean ♩ ≈ 59. (Note: the 2:56 credited to Rattle in the old REPORT is exactly Gardiner's track time on DG's highlights disc; I could not check Rattle's own track list.)

Edits made (all in `content/pieces/<id>/score.musicxml`, nothing else touched):

| Piece | Line | Old | New |
|---|---|---|---|
| mozart-scioccherie-di-poeti | 50 | `<sound tempo="117" />` | `<sound tempo="103" />` |
| mozart-mi-par-che-stamattina | 49 | `<sound tempo="110" />` | `<sound tempo="94" />` |
| mozart-non-piangere-idol-mio | 57 | `<sound tempo="90" />` | `<sound tempo="75" />` |
| mozart-al-fato-dan-legge | 46 | `<sound tempo="51" />` | `<sound tempo="56" />` |
| mozart-la-commedia-e-graziosa | 53 | `<sound tempo="83" />` | `<sound tempo="70" />` |
| mozart-bella-vita-militar | 53 | `<sound tempo="113" />` | `<sound tempo="134" />` |
| mozart-di-scrivermi-ogni-giorno | 1513 (bar 28) | `<sound tempo="115" />` | `<sound tempo="134" />` (line 73, ♩ = 53, unchanged) |
| mozart-dove-son | 49 | `<sound tempo="64" />` | `<sound tempo="75" />` |
| mozart-non-son-cattivo-comico | 41 | `<sound tempo="91" />` | `<sound tempo="100" />` |
| mozart-che-vita-maledetta | 49 | `<sound tempo="85" />` | `<sound tempo="94" />` |
| mozart-ah-scostati-smanie-implacabili | 41 / 1456 (bar 25) | `79` / `175` | `89` / `214` |
| mozart-che-susurro | 61 | `<sound tempo="92" />` | `<sound tempo="82" />` |
| mozart-ah-non-partite | 58 | `<sound tempo="81" />` | `<sound tempo="92" />` |
| mozart-non-siate-ritrosi | 41 | `<sound tempo="76" />` | `<sound tempo="88" />` |

Dry-run import of the 14 changed pieces (copies in `/dev/shm/cr`, `CONTENT_SRC=/dev/shm/cr/src2 CONTENT_OUT=/dev/shm/cr/out2 npx tsx scripts/import-content.ts`): all 14 imported cleanly (✔, exit 0), and their new lengths are the “New” column above. Before the changes, all 32 Così pieces had also been dry-run imported cleanly to measure the current lengths. The real import, build, commit and publish were not run.

## pieces.tsx edits (PIECE_INFO `tempo:`), for someone else to apply

Each is the full string value of `tempo:` in `src/standalone/pieces.tsx`.

**mozart-scioccherie-di-poeti** (line ~3071)
- Old: `Free, as recitative is sung: played here at a speaking pace, ♩ = 117, from the only two separate recordings of it found (Böhm 1:04, Gardiner 1:35; about 1½ minutes)`
- New: `Free, as recitative is sung: played here at a speaking pace, ♩ = 103, from the median length of seven recordings (Böhm, Haitink, Solti, Nézet-Séguin, Currentzis, Gardiner, Marriner; about 1½ minutes)`

**mozart-mi-par-che-stamattina**
- Old: `Free, as recitative is sung: played here at a speaking pace, ♩ = 110, from the only separate recording of it found (Böhm, about 1 minute)`
- New: `Free, as recitative is sung: played here at a speaking pace, ♩ = 94, from the median length of five recordings (Böhm, Haitink, Solti, Nézet-Séguin, Currentzis; about 1¼ minutes)`

**mozart-non-piangere-idol-mio**
- Old: `Free, as recitative is sung: played here at a speaking pace, ♩ = 90, a nominal estimate rather than a recording's pace (about 45 seconds)`
- New: `Free, as recitative is sung: played here at a speaking pace, ♩ = 75, from the median length of five recordings (Haitink, Solti, Nézet-Séguin, Currentzis, Marriner; just under a minute)`

**mozart-al-fato-dan-legge**
- Old: `Andante, played at ♩ = 51 (about 1½ minutes), from Kuijken's recording: his track also holds the recitative that follows, so Böhm's 23 seconds for that recitative were taken off; Mozart gives the word only`
- New: `Andante, played at ♩ = 56 (about 1½ minutes, the median of five recordings: Haitink, Solti, Nézet-Séguin, Currentzis, Marriner); Mozart gives the word only`

**mozart-la-commedia-e-graziosa**
- Old: `Free, as recitative is sung: played here at a speaking pace, ♩ = 83, from Böhm's recording (under half a minute)`
- New: `Free, as recitative is sung: played here at a speaking pace, ♩ = 70, from the median length of six recordings (Böhm, Haitink, Solti, Nézet-Séguin, Currentzis, Marriner; about half a minute)`

**mozart-bella-vita-militar**
- Old: `Maestoso, played at a half note = 56 (♩ = 113), about 1¾ minutes, from Böhm's recording; Mozart gives the word only`
- New: `Maestoso, played at a half note = 67 (♩ = 134), about 1½ minutes, the median of six recordings (Böhm, Haitink, Solti, Nézet-Séguin, Currentzis, Marriner); Mozart gives the word only`

**mozart-di-scrivermi-ogni-giorno**
- Old: `Andante, played at ♩ = 53, then the chorus Maestoso at a half note ≈ 58 (♩ = 115); about 3 minutes in all, from two recordings (Rattle 1:55 and 0:48, Klemperer 2:06 and 0:57); Mozart gives the words only`
- New: `Andante, played at ♩ = 53, then the chorus Maestoso at a half note = 67 (♩ = 134, the pace of “Bella vita militar”); about 2¾ minutes in all, from the median lengths of five recordings (Böhm, Haitink, Solti, Nézet-Séguin, Currentzis); Mozart gives the words only`

**mozart-dove-son**
- Old: `Free, as recitative is sung: played here at a speaking pace, ♩ = 64, from two recordings (Rattle 1:05, Klemperer 1:03; about 1 minute)`
- New: `Free, as recitative is sung: played here at a speaking pace, ♩ = 75, from the median length of five recordings (Böhm, Haitink, Solti, Nézet-Séguin, Currentzis; just under a minute)`

**mozart-non-son-cattivo-comico**
- Old: `Free, as recitative is sung: played here at a speaking pace, ♩ = 91, kept for the closing Allegro moderato too, from two recordings (Rattle 1:03, Klemperer 1:14; just over a minute)`
- New: `Free, as recitative is sung: played here at a speaking pace, ♩ = 100, kept for the closing Allegro moderato too, from the median length of five recordings (Böhm, Haitink, Solti, Nézet-Séguin, Currentzis; about 1 minute)`

**mozart-che-vita-maledetta**
- Old: `Free, as recitative is sung: played here at a speaking pace, ♩ = 85, from two recordings (Rattle 1:05, Klemperer 1:03; about 1 minute)`
- New: `Free, as recitative is sung: played here at a speaking pace, ♩ = 94, from the median length of five recordings (Böhm, Haitink, Solti, Nézet-Séguin, Currentzis; about 1 minute)`

**mozart-ah-scostati-smanie-implacabili**
- Old: `The recitative at ♩ = 79, then the aria Allegro agitato at a half note ≈ 87 (♩ = 175); about 3½ minutes in all, from two recordings (Rattle 1:03 and 2:00, Klemperer 1:19 and 2:40); the recitative's Allegro assai and Maestoso keep its pace; Mozart gives the words only`
- New: `The recitative at ♩ = 89, then the aria Allegro agitato at a half note = 107 (♩ = 214); about 3 minutes in all, from the median lengths of six recordings (Böhm, Haitink, Solti, Nézet-Séguin, Currentzis, and Gardiner for the recitative); the recitative's Allegro assai and Maestoso keep its pace; Mozart gives the words only`

**mozart-che-susurro**
- Old: `Free, as recitative is sung: played here at a speaking pace, ♩ = 92, estimated (no separate timing of this recitative was found; just under 2 minutes)`
- New: `Free, as recitative is sung: played here at a speaking pace, ♩ = 82, from the median of six recordings (Böhm, Haitink, Solti, Nézet-Séguin, Currentzis, Marriner; most of their tracks run on into “Temerari”, so this recitative's share was taken in proportion; about 2 minutes)`

**mozart-ah-non-partite**
- Old: `Free, as recitative is sung: played here at a speaking pace, ♩ = 81, from a recording (Jacobs 1:08; about 1 minute)`
- New: `Free, as recitative is sung: played here at a speaking pace, ♩ = 92, from the median length of five recordings (Böhm, Haitink, Solti, Nézet-Séguin, Currentzis; about 1 minute)`

**mozart-non-siate-ritrosi**
- Old: `Andantino, played at ♩ = 76, estimated (about 1¾ minutes; no separate timing was found); Mozart gives the word only`
- New: `Andantino, played at ♩ = 88, about 1½ minutes, the median of seven recordings (Böhm, Haitink, Solti, Nézet-Séguin, Currentzis, Gardiner, Marriner); Mozart gives the word only`

### Other text now out of date (not edited; I was asked to change only `<sound tempo>`)

- Each changed piece's `manifest.json` has a licence note starting “Playback tempo …” that still gives the old value and sources (e.g. `bella-vita-militar`: “Playback tempo: a half note = 56 (♩ = 113), from Böhm's recording (1:47) …”). These should be updated along the same lines as the pieces.tsx sentences above. Note that the manifest feeds the import's content hash.
- The `**Tempo:**` lines in `sources/cosi/<short>/REPORT.md` for n07, n08, n09, n11, n15, r04, r07, r11, r13, r17, r19, r20, r26, r28 now describe the old values.
- Unchanged pieces keep their tempo values, but several pieces.tsx/manifest sentences cite only one or two recordings (e.g. Soave: “Rattle 2:56, Klemperer 3:15”; Sento: “Kuijken, Hager”). The values hold up against the wider median in the table above, so only the cited sources would change if someone wants to refresh them.

## Sources

Track lists (read through a fetch tool that summarises each page; durations as printed on the page):

- Böhm 1962 (EMI; Philharmonia; Schwarzkopf, Ludwig, Kraus, Taddei, Berry, Steffek), Act I CD 1: https://brainz.musichoarders.xyz/track/a71dfdcb-1b2c-3b96-9237-a73da19433fc (also https://brainz.musichoarders.xyz/track/976cdbe5-818e-30ae-a5ae-e26765e87525). No “Al fato dan legge” track: its quintet track 11 (4:48) seems to hold “Sento” + “Non piangere” with No. 7 cut, so Böhm is not used for those three.
- Haitink 1986 (EMI/Warner; London PO, Glyndebourne Chorus): https://www.qobuz.com/au-en/album/cosi-fan-tutte-wolfgang-amadeus-mozart/5099920883058
- Solti 1994 (Decca; Chamber Orchestra of Europe; Fleming, von Otter): https://www.qobuz.com/at-de/album/wa-mozart-cosi-fan-tutte-1994-renee-fleming-anne-sofie-von-otter-frank-lopardo-olaf-bar-michele-pertusi-adelina-scarabelli-chamber-orchestra-of-europe-sir-georg-solti/0002894441742 (matches https://brainz.musichoarders.xyz/track/21696e19-b43c-4fc0-b283-9b67b2a458e5 within a second)
- Nézet-Séguin 2012 (DG; Chamber Orchestra of Europe; Persson, Erraught): https://blog.highresaudio.com/album/view/3j6z6c/m-persson-mozart-cosi-fan-tutte-k588 (the page gives 0:00 for “La mia Dorabella”, so that one is left out)
- Currentzis 2013 (Sony; MusicAeterna): https://www.qobuz.com/au-en/album/mozart-cosi-fan-tutte-teodor-currentzis/0886443822993
- Gardiner 1992 (Archiv/DG; English Baroque Soloists): highlights disc taken from the complete set, https://classical.music.apple.com/gr/album/1452624034. Only tracks of whole pieces were used, not tracks marked “(Excerpt)”. The complete set's Presto page confirms the first tracks (Ouverture 4:15, La mia Dorabella 2:03, Fuor la spada 1:04): https://www.prestomusic.com/classical/products/7930799--mozart-cosi-fan-tutte-k588
- Muti 1982 (EMI; Vienna PO, Salzburg; Marshall, Baltsa, Battle; the page labels it 1992): tracks of whole numbers, https://koramusic.app/release/wolfgang-amadeus-mozart-margaret-marshall-agnes-baltsa-kathleen-battle-francisco-araiza-james-morris-jose-van-dam-wiener-staatsoper-wiener-philharmoniker-riccardo-muti/cosi-fan-tutte
- Marriner 1989 (Philips; ASMF), paired tracks: https://www.prestomusic.com/classical/products/7980572--mozart-cosi-fan-tutte-k588 and https://www.qobuz.com/au-en/album/mozart-cosi-fan-tutte-mattila-von-otter-araiza-allen-van-dam-sir-neville-marriner/0002894830407
- Davis 1974 (Philips; ROH), overture only (other tracks pair numbers ambiguously): https://www.qobuz.com/lu-de/album/mozart-cosi-fan-tutte-montserrat-caballe-dame-janet-baker-nicolai-gedda-wladimiro-ganzarolli-sir-colin-davis/0002894757380
- No. 15a “Rivolgete a lui lo sguardo” (left out of most complete sets), aria recordings: Hampson / Harnoncourt, Concentus Musicus 2003, 5:45 https://www.heinrichvontrotta.eu/Harnoncourt/Etichette-varie/2005-WC-2564-62257-2-Hampson.html ; Gerhaher / Freiburger Barockorchester 5:23 https://highresaudio.com/en/album/view/64uahk/christian-gerhaher-freiburger-barockorchester-mozart-arias ; Matthew Rose / Cohen, Arcangelo 5:27 https://brainz.musichoarders.xyz/track/ad2abd03-849d-4d80-a0cd-99f8aae1dbda ; Fingerlos / Hager, Mozarteumorchester 5:16 https://mag.highresaudio.com/en/album/view/ncszpx/rafael-fingerlos-mozarteumorchester-salzburg-leopold-hager-mozart-made-in-salzburg ; Mertens / Hagel, Capella Weilburgensis 6:00 https://classical.music.apple.com/gh/album/411961817

Looked at but not used: Jacobs 1998 (the harmonia mundi booklet PDF came back through the summariser with missing and 0'00 timings: https://www.harmoniamundi.com/wp-content/uploads/pdf/mozart-cosi-fan-tutte-HMC901663.65-de.pdf); Böhm 1974 Vienna (tracks merge several numbers, with cuts): https://ototoy.jp/_/default/p/1615034 ; Levine 1988 (merged tracks): https://brainz.musichoarders.xyz/track/383b65c8-8977-4e83-84c5-e8753c0cceef ; Hager 1991 Met live (merged tracks): https://classical.music.apple.com/do/album/1060297717 . Karajan 1954, Klemperer, Rattle and Östman: no per-track timings could be fetched (MusicBrainz itself is blocked from this environment; Pristine's and Spotify-mirror pages showed no durations).

Caveat: all timings come from model-made summaries of store pages, not from the pages read directly. Spot checks agree across sources (Solti 1994 matches on two sites; Gardiner's first tracks on two), but a single misread track is possible. The median over five to nine recordings limits the effect of any one.
