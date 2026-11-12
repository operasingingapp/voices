# La bohème: whole-opera review (30 pieces, S1-S30)

Repo: /home/claude/voices. puccini-o-mio-babbino-caro is not included. No note, rhythm, lyric word or start bar was changed.
I checked that every edited language.json is unchanged except for `ipa` fields. I did not run the real import or the build,
and I did not commit.

Dry run: the 17 changed pieces were copied to /dev/shm/rv/after and imported with
`CONTENT_SRC=/dev/shm/rv/after/src CONTENT_OUT=/dev/shm/rv/after/out npx tsx scripts/import-content.ts`. All 17 imported
(✔). Every phrase aligned, with the same phrase counts as the baseline dry run of all 30 pieces. There were no
alignment messages, only the usual "spoken pronunciation / slow recording not prepared yet". /dev/shm/rv has been deleted.

## 1. What I changed

### 1a. IPA (word IPA and the same token in the phrase IPA; 17 language.json files)

| Piece (phrase) | Word | Old → new | Why |
|---|---|---|---|
| che-gelida-manina (r21, ×2) | poichè | poiˈkɛ → poiˈke | closed e (the known case); now the same as S24 |
| non-sono-in-vena (r7, r12) | sente | ˈsen.te → ˈsɛn.te | sentire has open è (sènto); now the same as S19 |
| quando-men-vo (r5) | spento | ˈspen.to → ˈspɛn.to | open ɛ (-ɛnto); now the same as S5, S20, S28 |
| mi-chiamano-mimi (m13), o-soave-fanciulla (i11) | signor | siˈɲor → siɲˈɲor | intervocalic ɲ is always long, as in the 12 other cases |
| che-gelida-manina (r11) | signore | siˈɲo.re → siɲˈɲo.re | same reason |
| che-gelida-manina (r5) | signorina | si.ɲoˈri.na → siɲ.ɲoˈri.na | same reason (S12 and S22 have ɲɲ) |
| sono-andati (i15) | signorino | si.ɲoˈri.no → siɲ.ɲoˈri.no | same stem and rule |
| 14 phrases: al-quartiere-latin r2; aranci-datteri m1, m4; chi-guardi c6, r8, s1; legna s13; o-soave-fanciulla i12; questo-mar-rosso r6; si-puo b16, b33, b34; signorina-mimi i13, m20 | io | ˈi.o → jo | every one is sung on a single note (checked in the import). The app's convention, as in the other 24 cases, is jo on one note |
| si-puo (m23), signorina-mimi (u19) | lui | ˈlu.i → ˈlui | sung on one note ("lui", one syllable); the same as S18 and S26 |
| legna (s1) | voi | ˈvoi → ˈvo.i | the score sets it "vo-i" on two notes; the same as S6 r24 and S18 m8 |
| ahi-qual-dolore (m4), quando-men-vo (m1) | alla | al.la → ˈal.la | stress mark on the two-syllable word, as in the 13 other cases |
| che-ora-sia (r12), quando-men-vo (u7) | alle | al.le → ˈal.le | same reason (the app's own earlier notation fix, S18) |
| si-puo (m14) | in | im → in | cross-word nasal assimilation is written nowhere else in the opera (50 × "in") |
| si-puo (m20; b25, b26) | un | uŋ, um → un | same reason (63 × "un") |
| ohe-la-le-guardie (d1) | vengo | ˈvɛn.go → ˈvɛŋ.go | the same as si-puo b11; word-internal ŋ before k/g is the majority convention in the app |
| che-ha-detto-il-medico (s1) | è (phrase only) | marˈtʃɛl.lo‿ɛ → marˈtʃɛl.lo‿ˈɛ | this was the only phrase in the 30 pieces whose IPA token did not match its word's IPA |

### 1b. Tempo (one `<sound tempo>` value)

| File | Bar | Old → new | Why |
|---|---|---|---|
| puccini-mi-chiamano-mimi/score.musicxml | b1 ("con semplicità", q 0) | 52 → **48** | S7 b1 is the dying last chord of "Che gelida manina". tempi.md §4.7 defines it as "Che gelida's tempo carried on". But S6's map (per tempi.md §4.6) ends in **Sostenendo largamente ♩ = 48, "to the end"** (b54-72), so the join jumped 48 → 52 → 40. It now runs 48 → 48 → 40 (Andante lento). Length is unchanged (238 s). |

Two places still say 52 for this bar and need updating: the PIECE_INFO text (edit 4c below) and `sources/boheme/tempi.md` §4.7 row 1 (52 → 48). I did not edit tempi.md, because it is outside the allowed edits.

## 2. Pronunciation table: the words that still have more than one IPA

Only 56 of the 1782 distinct words had more than one IPA. After the fixes above, these remain, all of them on purpose:

- **Sung on one note or on two, as printed (checked against the score's syllables):**
  - miei ˈmjɛi / ˈmjɛ.i (S6 r18 "mie-i")
  - sai ˈsai / ˈsa.i (S13 u10 "sa-i")
  - vai ˈvai / ˈva.i (S21 r1 "Va-i?")
  - sei ˈsɛi / ˈsɛ.i (S14 m2 "se-i")
  - voi ˈvoi / ˈvo.i (S6 r24, S18 m8, S2 s1)
- **Different word:** re ˈre (king, S2, S25) / ˈrɛ (the note D, S10 s1-s2, "Falso questo Re!").
- **Stress mark on monosyllables only, with no difference in sound.** The integ notes already class these as notation, and their stress depends on context:
  - ah, buon, ch'io, che, chi, chè, dai, di, dir, dà, fan, far, già, giù, gran, ha, ho
  - l'ha, l'ho, me, no, oh, or, poi, pur, quel, qui, s'è, sei, si, son, sta, tal, te, tre, tu, vuol, è

  I left these alone.

Glosses: I read all 247 words that have more than one gloss in their contexts. None contradict each other. All the
differences come from context: "pian" is softly / floor / plain, "sol" is sun / alone, "volo" is flight / I fly, "civetta" is
flirt or the owl in Marcello's simile, "pranzo" is dinner or lunch, and "vivo" is I live or lively. I made no gloss or
translation edits.

Notes, not changed (not same-word conflicts):
- **Word-internal ŋ before k/g is split across the opera.** Act 1 and some Act 2 pieces write ŋ (ˈaŋ.ke, iŋˈgle.ze), while
  most Act 3-4 pieces write n (anˈkor, ˈdun.kwe, tranˈkwil.la). Each word is still consistent with itself across pieces.
  The Mozart pieces are split the same way (aŋˈkor 54, anˈkor 34). If you want one convention, say which and I will apply
  it.
- sa-dirmi i5 "Ditegli" is ˈdi.te.ʎi with a short ʎ. Everywhere else, intervocalic ʎ is long (ˈeʎ.ʎi, ˈdeʎ.ʎi). It appears only once, so it is not in the table.

## 3. Tempo joins, S1 → S30

The values are quarter notes per minute as in the maps (6/8 ♩. = 108 is 162). "Close" is the last section tempo, then the
value the written rall. ramps reach.

| S | Piece | Open | Close | Join to next: print / maps |
|---|---|---|---|---|
| 1 | questo-mar-rosso | 162 Allegro vivace (printed) | Allegro 162 (b335 = Legna's first beat) | 162 → 162 ✓ (same beat) |
| 2 | legna | 162 Allegro | I° tempo 162 | ♩ = ♩. into 2/4: 162 → 108 ✓ |
| 3 | si-puo | 108 (b1-6, Legna's beat) | Meno 138 | new printed Allegretto ✓ |
| 4 | al-quartiere-latin | 116 (printed) | Allegro vivo (I° tempo) 162 | S5 b1 continues it at 162 ✓ |
| 5 | non-sono-in-vena | 162 → b2 Allegretto 116 | Un poco più mosso 126, rall. to 101 | new printed ♩ = 58 ✓ |
| 6 | che-gelida-manina | 58 (printed) | Sostenendo largamente 48, allarg. to 38, back to 48 | **was 48 → 52: fixed, see 1b** |
| 7 | mi-chiamano-mimi | **48** (was 52) → b2 40 | I tempo ma calmo 54, rall. to 43 | new heading (39), a piacere ✓ |
| 8 | ehi-rodolfo | 100 | 100 | new printed Largo ♩ = 58 ✓ |
| 9 | o-soave-fanciulla | 58 | ♩ = 58, rall. to 46 | end of act ✓ |
| 10 | aranci-datteri | 112 (printed) | I tempo 112 | "Lo stesso movimento **ma sostenendo**": 112 → 100 (judgement, see 7) |
| 11 | chi-guardi | 100 | Tempo I 132, rall. to 106 | S12 b1 132 ✓ (no new heading) |
| 12 | signorina-mimi | 132 | Sostenendo 112, rall. to 90 | new heading, Valzer lento 104 ✓ |
| 13 | quando-men-vo | 104 | un poco sostenendo 96, rall. to 77 | S14 b1 96 ✓ (the integ notes agree) |
| 14 | ahi-qual-dolore | 96 | ancora più Lento 76 | new printed ♩ = 132 ✓ |
| 15 | caro | 132 | sostenendo 104, rall. to 83 | end of act ✓ |
| 16 | ohe-la-le-guardie | 112 | a tempo 112 | S17 b1 112 ✓ |
| 17 | sa-dirmi | 112 | I° tempo 112 | S18 b1-3 112, then printed Allegro ✓ |
| 18 | mimi-marcello | 112 → b4 120 | Poco meno 92 | new heading ✓ |
| 19 | marcello-finalmente | 150 (6/8, ♩. = 100) | 126, rall. to 101 | S20 upbeat 100 ✓ |
| 20 | mimi-e-tanto-malata | 100 → Lento triste 48 | Allegretto mosso 144, rall. molto to 98 | new printed Lento molto ✓ |
| 21 | donde-lieta-usci | 33 (♪ = 66) | a tempo 84 (shared bar) | shared bar 84 = 84 ✓ |
| 22 | addio-dolce-svegliare | 84 (a tempo) | Sostenendo 69, rall. to 55 | end of act ✓ |
| 23 | in-un-coupe | 162 (printed) | Andantino 60, rall. to 48 | new printed ♩ = 84 ✓ |
| 24 | o-mimi-tu-piu-non-torni | 84 | 84, rall. molto to 57 | S25 b1 back to 84 at once (judgement, see 7) |
| 25 | che-ora-sia | 84 → b2 92 → b3 84 | Allegro spigliato 132, incalzando to 148 | S26 b1 148 ✓ |
| 26 | musetta | 148 → b2 104 | Allegretto mosso 120, rall. to 96 | new printed ♩ = 63 ✓ |
| 27 | vecchia-zimarra | 63 | Andantino mosso 84 (♩. = 56), rall. to 67 | Più sostenuto 50 (judgement, see 7) |
| 28 | sono-andati | 50 | Andantino affettuoso 58, rall. to 46 | new printed ♩ = 120 ✓ |
| 29 | oh-dio-mimi | 120 | Andante lento 40, held 22 | new heading ✓ |
| 30 | che-ha-detto-il-medico | 52 | Grave 40 | end ✓ |

No other join contradicts the print. Two things inside pieces are worth knowing:
- che-gelida-manina b62 beat 3 has two tempo marks at the same spot (48 and 44.16). This is tempomap's reset meeting the next
  ramp's first step. Either value only lasts an eighth, so it makes no audible difference.
- The two-bar ramp cap stops some written rall. early. The integ notes already record this.

### Map length against recordings (gaps over about 35 %)

| S | Map | Recording median | Gap | Why |
|---|---|---|---|---|
| 21 donde-lieta-usci | 2:02 | ~3:30 | −42 % | b16-39 run at the printed Andantino mosso ♩ = 84 (69 s of the 122). The many rit./allarg. are played only as two-bar ramps, and fermatas are held only in steady mode |
| 22 addio-dolce-svegliare | 3:07 | 5:21 | −42 % | b1-32 run at the printed ♩ = 92: 1:07 on the map against Beecham's 1:51. Plus ritenendo/allarg. and fermatas, and the Più lento ending |
| 24 o-mimi-tu-piu-non-torni | 1:25 | 3:03 | **−54 %** | the printed ♩ = 84 throughout, with eight rall./sost./allarg. marks and three fermatas. Toscanini (2:29) is still about 40 % slower than the map |

Parts of pieces with large gaps, where the whole piece is under 35 %:
- QMR b290-331 (molto rall. e stent., a piacere) is −40 %.
- musetta b60-107 is −30 to −39 %. The whole piece is −22 %.

All other pieces with recording data are between −2 and −23 % (S1 −20, S2 −2, S3 −4, S5 −19, S6 −12, S7 −18, S8 −17,
S9 −23, S10 −8, S23 −4, S25 −9, S26 −22, S27 −9, S28 −17, S29 −17, S30 −10). S11-S20 have no recording timings.

None of these is a misreading: every gap sits on a printed metronome mark. I did not retime anything.

## 4. Pieces that share a bar

Only S21/S22 share a bar. I compared the piano content of the last and first bars at all 29 joins, and only this pair matches.
- **S21 donde-lieta-usci b39 = S22 addio-dolce-svegliare b1.**
  - S21 keeps Mimì's "rancor" (i11, whose "-cor" falls in b39). It leaves out Rodolfo's "Dunque è proprio fi-", as its notes say.
  - S22 keeps Rodolfo's "Dunque è proprio finita!" (r1, from b1). Mimì's "-cor....." in b1 has no phrase (her first phrase is i1 at b8).
  - Nothing is lost or sung twice.

## 5. Labels (src/standalone; NOT edited, apply these yourself)

What I checked:
- **UNPLACED:** exactly the 5 known Figaro items (runtime check with tsx).
- **Runtime role lists** (built from scenes.ts): every Bohème role's list is in opera order, and every piece has an editionId.
  - The raw `pieces` arrays in operas.ts are *not* in opera order. The first-pass entries come first and later ones are appended.
  - Keep it that way: FIRST_PASS_KEYS maps saved places by their position in the raw array.
- **Raw lists:** each of the 11 roles has exactly one entry with an editionId for every piece whose manifest lists that role. None is missing, extra or doubled.
- **PIECE_INFO portraits:** each one is a role that sings in its piece.
- **PIECE_INFO kinds:** they match the plan's kinds except S12 (see 5b).

The same piece is shown under different titles depending on the role. Each title in a role's list is the raw `title`, and
the manifest title is shown on the piece page. The edits below make every list entry use the manifest title. They keep every
progress key (`id`), so saved places still resolve. I applied them to a scratch copy: the runtime lists differ only in these
titles, the ids are unchanged, and UNPLACED is unchanged.

### 5a. operas.ts

1. Replace all 4 occurrences (Rodolfo, Marcello, Schaunard, Colline):
   - old: `"title": "Al Quartiere Latin ci attende Momus.",`
   - new: `"title": "Al Quartiere Latin ci attende Momus",`
2. Replace both occurrences (Rodolfo, Mimì):
   - old: `"title": "Non sono in vena.",`
   - new: `"title": "Non sono in vena",`
3. Mimì:
   - old: `"title": "Ah!… Che gelida manina",`
   - new: `"title": "Che gelida manina",`
4. Rodolfo:
   - old: `"title": "Si. Mi chiamano Mimì",`
   - new: `"title": "Mi chiamano Mimì",`
5. Mimì (adds the id so her old key is kept):
   ```
   old:
         "title": "Sì, mi chiamano Mimì",
         "kind": "Aria · Act 1",
   new:
         "title": "Mi chiamano Mimì",
         "kind": "Aria · Act 1",
         "id": "Sì, mi chiamano Mimì",
   ```
6. Mimì:
   ```
   old:
         "title": "Donde lieta uscì",
         "kind": "Aria · Act 3",
   new:
         "title": "Vai?… Donde lieta uscì",
         "kind": "Aria · Act 3",
         "id": "Donde lieta uscì",
   ```
7. Colline:
   ```
   old:
         "title": "Vecchia zimarra, senti",
         "kind": "Aria · Act 4",
   new:
         "title": "Vecchia zimarra",
         "kind": "Aria · Act 4",
         "id": "Vecchia zimarra, senti",
   ```
8. ALIAS. The fuzzy match already finds the scene without this, but the alias makes it explicit:
   ```
   old:
     "Sì, mi chiamano Mimì": "Si. Mi chiamano Mimì",
   new:
     "Sì, mi chiamano Mimì": "Si. Mi chiamano Mimì",
     "Mi chiamano Mimì": "Si. Mi chiamano Mimì",
   ```

The raw `kind` strings in operas.ts are never shown. The list shows scenes.ts's kind. Some of them differ: "Duet with Mimì",
Musetta's "Waltz · Act 2", and signorina-mimi's "Scene with chorus". They are harmless, so I have not given edits for them.

### 5b. scenes.ts

S12 has a chorus: the manifest has chorus-sopranos and chorus-tenors, and PIECE_INFO and operas.ts say "Scene with chorus".
The running order (and so the kind shown in every list) says "Scene", copied from app-boheme.md.
- old: `["Signorina Mimì, che dono raro", "Scene", [`
- new: `["Signorina Mimì, che dono raro", "Scene with chorus", [`

Also make the same change to draft/app-boheme.md [S12] if it is kept as the source.

### 5c. pieces.tsx (PIECE_INFO "puccini-mi-chiamano-mimi", tempo; follows 1b)

- old: `bar 1 ♩ = 52 (the Andante lento ♩ = 52 of “Che gelida manina” carried on, as nothing new is printed over Mimì’s “Si. Mi”);`
- new: `bar 1 ♩ = 48 (the Sostenendo largamente ♩ = 48 that ends “Che gelida manina” carried on, as nothing new is printed over Mimì’s “Si. Mi”);`

### 5d. Other label differences (manifests are not in the allowed edits; I am only listing them)

- manifest titles drop the plan's final period on S4 and S5. They also differ from the plan on S6 (no "Ah!…"), S7 ("Mi
  chiamano Mimì", not "Si. Mi chiamano Mimì") and S24 (comma after "O Mimì"). This is fine: the manifest uses the familiar title.
- manifest `kind`: S15 caro is "scene", but S30 is "finale" and both are Finales in the plan. If the kinds should agree, set caro's to "finale".

## 6. Small roles (fewer than about 8 sung words in a piece)

| S | Role: words |
|---|---|
| 6 | Mimì: "Ah!" (1) |
| 7 | Rodolfo: "Sì." (1) |
| 8 | Mimì: "Chi son?" (2) |
| 9 | Marcello: "trovò la poesia" (3) |
| 13 | Marcello: "Legatemi alla seggiola!" (3) |
| 14 | Mimì: 7 |
| 15 | Mimì: "Lesti, lesti, lesti!" (3) |
| 16 | Doganiere: 5 |
| 17 | Sergente: 5; Doganiere: "Vuoto!" (1) |
| 19 | Mimì: 6 |
| 21 | Rodolfo: "Vai?" (1) |
| 26 | Colline: "Nulla!" (1) |
| 27 | Schaunard: 6 |
| 29 | Musetta 4, Rodolfo 7, Schaunard 2 |
| 30 | Marcello 2, Schaunard 3, Colline 5 |

The app offers every one of these as an entry with music in that role's list.

**Recommendation: keep them all.** Dropping one from operas.ts alone has no effect. I tested this on a scratch copy by
removing Rodolfo's S21 entry: the list is rebuilt from scenes.ts, and the musicOf fallback put the entry straight back with
its editionId. To drop one you would have to remove the role from that scene's `who` in scenes.ts. That also changes the
running order, the role's story and its progress positions, which costs more than a one-word entry. If you still want to
hide the 1-word cases, the candidates are:
- Rodolfo in S7 and S21
- Mimì in S6
- Colline in S26
- the Doganiere in S17. He also sings in S16, so his list would not be empty.

## 7. For your ear (tempo judgement calls; nothing changed)

1. **S24 "O Mimì, tu più non torni" at the printed ♩ = 84 lasts 1:25. Recordings take 2:29-3:16 (−54 %).** S21 (−42 %) and
   S22 (−42 %) show the same pattern.
   - Listen to S24 b1-11. If it sounds hurried, spell out its eight broadenings as tempo steps (tempi.md §5): sostenendo 76 →
     molto sost. 69 → 60, and the b29 rall. molto ending near 45 instead of 57.
   - Do the same for S21 b33-38 and S22 b61-86 before touching any printed number.
2. **S10 → S11 "Lo stesso movimento ma sostenendo": 112 → 100.** If the café scene sounds like it brakes, try 104. That is
   "sostenendo" as about 7 %, the value Aranci itself uses for its own "un poco sostenuto" at b104.
3. **S24 → S25: S25 b1 snaps back to 84 straight after S24's rall. molto (57).** Rodolfo's "Che ora sia?" is sung over the
   duet's last chord. Suggestion: give S25 b1 the ramp's end value (about 57), with b2 "mosso" 92 as now.
4. **S27 → S28: Andantino mosso ♩. = 56 (6/8) → Più sostenuto ♩ = 50 (4/4).** The beat carries over a little slower. If the
   start of "Sono andati?" sounds static, try 54, the Andante calmo that follows at b5.
5. **S16 → S17 bars 1-3 at 112** (the open question in sa-dirmi's notes). If the Poco più mosso of p. 173 is meant to be still
   in force, set S16's last a tempo, S17 b1-3 and the Lento molto one step up (120 / ♩ = 30).
