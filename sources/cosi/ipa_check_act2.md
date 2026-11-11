# Così fan tutte, Act II: IPA check against Castel

Scope: sections L38-L65 of the app libretto (`lib/L38.json` … `lib/L65.json`). That is 4292 word tokens and 750
distinct (word, IPA) pairs with a stressed (or only) e/ɛ/o/ɔ. Reference: Nico Castel's libretto, `src/castel.pdf`,
Act II = PDF pages 69-134. The end of Act I is on pp. 66-68, so none of my sections fall there. Page numbers below are
**PDF pages**. Castel was used only to check the IPA. None of his text or translations went into the app.

## Method

1. OCR: I used the existing tesseract hOCR (300 dpi, word boxes) for pp. 69-134. An Italian line is a line whose words
   are mostly app vocabulary and that has no IPA features (stress marks, k/j/w, IPA letters). The line directly above it
   was taken as its IPA line. Each Italian word was paired with the IPA token above it by a monotone alignment on left x.
   This gave 4548 Italian words, 3977 of them with an IPA token.
2. Alignment: the app word sequence L38→L65 was aligned to Castel's Italian stream with difflib, plus a second pass that
   paired OCR-garbled words of equal-length gaps. This matched 3919 of 4292 tokens, and 3849 of those have a Castel IPA
   token. Section page ranges came out as L38 69-74, L39 74-75, L40 75-77, L41 77-78, L42 78, L43 79, L44 79-81,
   L45 81-82, L46 82, L47 83-87, L48 87-89, L49 89-90, L50 90-91, L51 91-92, L52 92-93, L53 93-98, L54 99-100,
   L55-L56 101, L57 101-103, L58 103-107, L59 107-108, L60 108-112, L61 112-115, L62 115-118, L63 118-119, L64 119-120,
   L65 120-134. For a repeated word that Castel prints once, I used the same word in the same section's page range.
3. Normalisation (notation only, class b), as in the Bohème check: syllable dots removed; Castel's `'`/OCR `‘` = `ˈ`;
   stress on monosyllables ignored; Castel's geminate split `t:t` (the OCR often reads the colon as i/l/1) = app `t.t`;
   stress counted from the word end, so his mark before a geminate (`e'f:fɛt:ti`) is equal to `efˈfɛt.ti`; his unstressed
   ɛ/ɔ ignored (including his `'lɛ`, `'sɛ` for the unstressed article *le* and the conjunction *se*); word-initial
   raddoppiamento stripped; `ŋ/m/n` nasal assimilation; `r` = `ɾ`; `ɲɲ/ʎʎ/ʃʃ` vs single; affricate notation (`prekau'tsjon`
   = `pre.kautˈtsjon`); diaeresis (`'siamo`, `ottsi'ozi`, `mɔ'dɛstia`, `'kio`) vs `sj`/`tsj`/`stja`/`kjo`.
4. Openness: all 750 distinct e/ɛ/o/ɔ pairs were checked by eye on 18 montages of Castel's IPA crop next to the app IPA.
   Every mismatch, and every flagged word, was then checked again at 3x zoom with the Italian word underneath. Stress,
   s/z, ts/dz and gemination differences were taken from the automatic comparison (about 300 flagged tokens) and judged
   on the crops. Nearly all of them were OCR noise.
5. Tie-breaker: standard Italian (DOP, Treccani). If the app goes against both Castel and the dictionaries, it is class
   (a). If the app agrees with the dictionaries and Castel goes his own way, it is class (d). For archaic forms I
   followed Castel.

## Counts (word tokens)

| class | tokens | notes |
|---|---:|---|
| (a) real errors in the app | **16** | 13 tokens, 7 distinct words (real errors) + 3 tokens, 2 words (consistency, see notes); all fixed |
| (b) notation only (equal after the mapping above) | 2969 | |
| (c) OCR noise | 809 | ɔ/ɛ→o/e/€/a, ʃ→f/[/J, ʒ→3/g/z, ʎ→K/A, ɲ→p/pp/nn, `:`→i/l, `i`→l (`'vol`), dropped stress marks (159), merged tokens (`e'per'kwesto`), Castel's Italian differs from the app text (`fino`/sino, `intendersi`/intenderci, `uomin`/uomini, `foco`/fuoco, `romor`/rumor) |
| (d) legitimate variants | 65 | 47 distinct words, see list below |
| no aligned Castel token | 433 | Castel prints a repeat once ("etc."), or the OCR lost the Italian word. Repeated words were checked on the first printing in the same section's range. The montages carried 42 e/o words without an aligned crop; each is the same word with the same app IPA as a checked token, or the openness is unambiguous (e.g. *prendi*, *oggi*, *gloria*) |

Kinds of real errors: stressed-vowel openness only (e→ɛ in empia, t'empie, veggio, veggono; o→ɔ in tormi; ɔ→o in
Alfonso, innamorano). I found no real stress, s/z, ts/dz or gemination errors in Act II.

## Real errors (a), all fixed

| section | phrase | word | app IPA (before) | Castel | fixed to | PDF page |
|---|---|---|---|---|---|---:|
| L38, L55, L58 | L38-039, L55-005 (2×), L58-021 | Alfonso | alˈfɔn.so | al'fonso | alˈfon.so | 71, 101, 104 |
| L39 | L39-006 | innamorano | in.naˈmɔ.ra.no | in:na'morano | in.naˈmo.ra.no | 74 |
| L49 | L49-010 | tormi (*tòrre* = togliere) | ˈtor.mi | 'tɔrmi | ˈtɔr.mi | 90 |
| L50, L61, L65 | L50-001, L61-009, L65-145 | veggio | ˈved.dʒo | 'vɛd:dʒɔ | ˈvɛd.dʒo | 113, 129 |
| L65 | L65-108, L65-109 | veggono | ˈveg.go.no | 'vɛg:gɔnɔ | ˈvɛg.go.no | 126 |
| L59 | L59-011 | t'empie | ˈtem.pje | 'tɛmpje | ˈtɛm.pje | 108 |
| L65 | L65-020 | empia | ˈem.pja | 'ɛmpja | ˈɛm.pja | 121 |

Consistency fixes (the app had the same word both ways; I aligned all tokens to the dictionary form, against Castel):

| section | phrase | word | app IPA (before) | Castel | fixed to | PDF page |
|---|---|---|---|---|---|---:|
| L65 | L65-150 | venne | ˈvɛn.ne | 'vɛn:nɛ | ˈven.ne (as L48-015; DOP *vénne*) | 129 |
| L38 | L38-036 | v'adorano | vaˈdɔ.ra.no | va'dɔranɔ | vaˈdo.ra.no (as *adora*, *l'adora*; DOP *adóro*) | 71 |
| L47 | L47-056 | V'adoro | vaˈdɔ.ro | (no aligned token) | vaˈdo.ro | (not found in OCR, pp. 83-87) |

Notes:
- **veggio / veggono** (archaic) follow Castel's open ɛ, which he prints in all three places. *veggo* (L65-191) stays
  ˈveg.go because Castel prints it closed on p. 132. If you want the three forms to agree, ˈvɛg.go is the change.
- **empia/t'empie**: the app already had ˈlɛm.pja and kweˈstɛm.pja. The fixes make all four tokens agree (DOP *èmpio*).
- **Alfonso** is also ˈɔ in Act I (L07, L09, L28: 8 tokens). Those are outside this range and were not changed.
- **venne/adorare:** if you would rather follow Castel, revert these three tokens and change L48-015 *venne* and
  L53-059/L56-004 *adora* to open instead. Do not leave the app mixed.
- In each case the word's IPA and the same token in the phrase `ipa` were changed, matched to the word's position when a
  phrase repeats the word (L55-005, L65-108/109). Nothing else changed: the files round-trip byte-identically through
  json (`ensure_ascii=False, indent=1`), all 28 files parse, and a diff against the backup shows exactly 16 changed word
  IPAs and the 14 matching phrase `ipa` strings.

## Legitimate variants (d), not changed

- **Castel open where the dictionaries have closed é:** cimento (tʃi'mɛnto), mercede (mɛr'tʃɛdɛ), lega ('lɛga),
  lampeggia (lam'pɛd:dʒa), sceglier ('ʃʃɛʎʎer), fermati ('fɛrmati), vende ('vɛndɛ), cresce ('krɛʃʃe), becca ('bɛk:ka),
  fé ('fɛ), venne L48-015 and vennero ('vɛn:nɛ, 'vɛn:nero; DOP *vénni, vénne*).
- **Castel closed where the dictionaries have open è:** sei ('sei, pp. 76, 98), lei ('lei), pensi ('pensi), querele
  (kwe'rele), esempio (e'zempjo), zelo ('ddzelo), cioè (tʃɔ'e), cos'è (kɔ'ze on p. 74, but kɔ'zɛ on p. 128),
  sien ('sien, diaeresis, pp. 74, 122; flagged word), intendersi (Castel prints *intenderci*, in'tendertʃi).
- **Castel open where the dictionaries have closed ó:** dopo, coda, forme, mostro, nascosto, posto/posti, risposta,
  disposte/disposti, Sorgi, torni, Ora (but *s'ora* closed), adora/l'adora.
- **Castel closed where the dictionaries have open ò:** L'ho ('lo), coppie ('kop:pjɛ), trovin ('trovin), vostra
  (L47-040, 'vostra; his other vostr- forms are open).
- **Castel's stress slips:** diletto ('dilɛt:to on p. 78; di'lɛt:tɔ on p. 87), focosi ('fokozi), ragione ('radʒone).
- **zecchinetti:** Castel ttsek:ki'net:ti (voiceless). The app has the usual dz for initial z (cf. *zucchero* in the
  Bohème check). Not changed.
- **coquettizzar:** Castel spells it *coquetizzar* and writes koketi'd:dzar. The app follows its own double-t spelling.
- **en bagatelle:** Castel gives the French ã baga'tɛlə. The app has ɑ̃ ba.gaˈtɛl.le (French nasal, Italian ending).
  Worth a decision, but not an Italian IPA error.

## Checked and matching

Flagged words (decided on Castel's page): dée ('deː = app ˈdee), deggio ('dɛd:dʒɔ), discreti (dis'kreti), mansueti
(mansu'ɛti), rovescio (rɔ'vɛʃʃɔ), fer ('fer), Cesse/Cessa ('tʃɛs:se), denno ('den:no), pon ('pɔn), mensa ('mɛnsa),
cenno ('tʃen:no), cospetto (kɔs'pɛt:to), malora (ma'lora), ei ('ei), pria ('pria), fia ('fia), resister (re'zister),
così (ko'zi), -ese words (arnesi, albanesi, ferraresi, v'offese, presi, difesi: all z), negliger (ne'glidʒer, hard
gl), abrégé (abre'ʒe). *Mo* (L58-031): Castel prints *Ma* there, so there is nothing to compare; the app's ˈmɔ is
standard. *sien*, *venne*, *veggio*: see above. Ponno, tosco, giulebbe, vorrieno, sarian, Medoro, Ciclopo, Esopo,
Marcantoni, Eumenidi, susurro, uscignuolo, alletta, Citerea, potriali, legge, venti and monsieurs do not occur in
L38-L65.

Other candidates that turned out to match at zoom: modesti/modestia (ɛ), perso (ɛ), privilegio (ɛ), loro (closed),
s'è, mesto, testimonio, attonite, oziosi (diaeresis), precauzion (affricate notation), Vesuvio (z), quindeci,
occhietto, otterrà (geminates present at zoom).
