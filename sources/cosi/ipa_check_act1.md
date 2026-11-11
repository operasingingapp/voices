# Così fan tutte, Act I: IPA check against Castel

Scope: sections L01-L37 of `lib/` (N° 1 Terzetto to N° 18 Finale, including N° 15a, KV 584): 4175 word tokens,
1538 distinct (word, IPA) pairs. Reference: Nico Castel's libretto, `src/castel.pdf`, PDF pages 4-68. Page numbers
below are **PDF pages**. Note: PDF pages 43 and 44 are swapped (printed 165 and 164), and the alignment allows for this.
Castel was used only to check the IPA. None of his text, translations or notes went into the app.

## Method

1. OCR: the existing tesseract hOCR (300 dpi, word boxes) for PDF pp. 4-68 was used. A line was taken as a Castel
   Italian line when most of its words are in the app's vocabulary and few start with a stress mark. The line directly
   above it was taken as the IPA line. Each Italian word was paired with the IPA token at the same left x (within 45 px).
2. Alignment: each section's word sequence was aligned (difflib, plus a small similarity DP for replace blocks) to
   Castel's Italian stream, restricted to the section's page window (L01 pp. 4-5 … L28 40-44, L29 43-44, L30 43-46,
   L31 [KV 584] 47-49, L32 [N° 15b] 46-47, L33 49-50 … L37 56-68).
3. Normalisation (counted as notation only, class b), as in the Bohème check: syllable dots removed; stress compared
   as a vowel count from the end of the word, and ignored on monosyllables; Castel's geminate split and his `ː` length mark
   (`'bɛlːla`, which OCR reads as `l:l`/`lil`) = app `ˈbɛl.la`; his unstressed ɛ/ɔ (only the stressed vowel's openness
   is compared); raddoppiamento sintattico (`'ddɛi`, `'kkɔza`) stripped; nasal assimilation `ŋ/ɱ/m` = `n`; `r` = `ɾ`;
   inherent geminates `ɲɲ ʎʎ ʃʃ` = single; affricate notation; diaeresis (`'mia`, `vi'ɛnna`, `ri'diamo`) = app `j`.
4. OCR cannot tell ɛ/e and ɔ/o apart, so all 716 distinct app words whose stressed (or only) vowel is e/ɛ/o/ɔ were
   checked by eye. Montages set zoomed Castel crops beside the app IPA (24 sheets). Every disagreement was then
   re-checked at 2.6x zoom with the bold Italian line under it (about 60 words). Words with no aligned Castel token
   were looked up on the page.
5. Stress, s/z, ts/dz and gemination differences picked up by the alignment (152 distinct words) were sorted. Almost all
   are OCR noise (ʃʃ→ff, ʎʎ→kk/AA, ɲɲ→pp, `ː`→i). Those that were not noise were checked on the page.
6. Tie-breaker: the standard dictionaries (DOP, Treccani). If the app goes against both Castel and the dictionaries, it is
   class (a). If the app agrees with the dictionaries and Castel goes his own way, it is class (d). For archaic or poetic
   forms (deggio, veggio, ponno, sien, vorrieno), Castel was followed, as the brief asks.

## Counts (word tokens)

| class | tokens | notes |
|---|---:|---|
| (a) real errors in the app | **11** | 10 distinct words, 10 sections, all fixed |
| (b) notation only (equal after the mapping above) | 3062 | 2408 of these are identical even as raw OCR strings |
| (c) OCR noise | 586 | ʃ→f/ff, ʎ→K/A/k, ɲ→pp/nn, ɔ→o/a/), ɛ→e/€, `ː`→i/l, dropped or extra stress marks, IPA token taken from the wrong column |
| (d) legitimate variants | 75 | including places where Castel prints a different text; see list below |
| no aligned Castel token | 441 | 384 of these are the same word with the same app IPA as a checked token. The other 52 distinct words were looked up on the page. Most are lines Castel prints once, or not at all (N° 9 chorus = N° 8; repeats in the Finale), or OCR misses (*esempi, giuramenti, Alfonsetto, riposi, fedeli, occhietti, dividere*…, all matching). |

Kinds of real errors: wrong stressed-vowel openness 7 words (8 tokens: ɛ→e in legge ×2, indiscreta, deggio, sien;
e→ɛ in veggio, ehi, ex; o→ɔ in ponno), wrong stress 1 (vorrieno), s/z 1 (susurro).

## Real errors (a), all fixed

| section | phrase | word | app IPA (before) | Castel | fixed to | PDF page |
|---|---|---|---|---|---|---:|
| L01 | L01-014 | ponno | ˈpon.no | 'pɔnːnɔ | ˈpɔn.no | 4 |
| L01 | L01-010 | ex (cathedra) | eks | 'ɛks | ɛks | 4 |
| L04 | L04-006 | sien | ˈsjɛn | 'sien | ˈsjen | 7 |
| L10 | L10-012 | deggio | ˈdɛd.dʒo | 'dedːdʒɔ | ˈded.dʒo | 18 |
| L11 | L11-006 | veggio | ˈved.dʒo | 'vɛdːdʒɔ | ˈvɛd.dʒo | 19 |
| L12 | L12-001 | legge (law) | ˈlɛd.dʒe | 'ledːdʒe | ˈled.dʒe | 20 |
| L36 | L36-021 | legge (law) | ˈlɛd.dʒe | 'ledːdʒe | ˈled.dʒe | 54 |
| L25 | L25-025 | indiscreta | in.diˈskrɛ.ta | indis'kreta | in.diˈskre.ta | 32 |
| L26 | L26-049 | vorrieno | vorˈrjɛ.no | vo'rːrienɔ | vorˈri.e.no | 36 |
| L27 | L27-024 | Ehi | ˈei | 'ɛi | ˈɛi | 38 |
| L28 | L28-001 | susurro | suˈzur.ro | su'sːsurːro | suˈsur.ro | 40 |

Notes:
- **legge:** both tokens mean "law" (*dan legge*, *è legge di natura*), which is *légge* (closed). The open vowel is for
  *lègge* ("reads").
- **ponno:** the app already had ˈpɔn.no in L24, and Castel prints it open there too (p. 29). L01 now matches.
- **deggio / veggio:** these are archaic forms, so Castel was followed as the brief asks (closed *deggio*, open
  *veggio*). The dictionaries are not clear here: DOP has *dèvo* open, and *véggio* goes back to *védo* closed. Revert
  these two if you prefer the dictionary forms.
- **sien, vorrieno:** Castel stresses the *i* (`'sien`, `vo'rːrienɔ`), so the *e* is unstressed and closed. This is the
  old *-ìeno* form (*vorrìeno* = vorrebbero). *sien* keeps the app's one-syllable glide notation, with the vowel now
  closed. *vorrieno* now follows the app's hiatus style (ˈpri.a, poˈtri.a).
- **susurro:** the app keeps the score's spelling with a single *s*, but the *s* is voiceless (Latin *susurrus*, DOP
  *sussurro* /s/). Castel prints *sussurro*.
- **Ehi:** Castel open, and this now matches the app's own `eh` = ˈɛ. **ex:** this is Latin *ex cathedra* (DOP ɛks).
- In each case the word's IPA and the same token in the phrase `ipa` were changed. Each phrase contained the old token
  exactly once. The files were written with `ensure_ascii=False, indent=1` and no trailing newline, as before. A diff
  of L01-L37 against the pre-fix copy shows exactly 11 changed word IPAs and 11 changed phrase IPAs. No other field
  changed.

## Legitimate variants (d), not changed

- **Castel goes against DOP on openness; the app follows DOP:** *gonne* ('gɔnne), *sembran* ('sɛmbran), *accresce*,
  *cresce* (ɛ), *sfogo* ('sfɔgɔ), *desto* ('dɛstɔ), *cerca* ('tʃɛrka), *d'un'esca* ('ɛska), *amorosi* (ɔ; but his
  *amorose/amorosa* are closed). He also writes closed vowels where DOP has open ones: *lei*, *disinteresse*, *consola*,
  *spera* (p. 25; open on p. 20), *verso*, *Creso/Cresi*, *cos'eran*, *evento*, *dolenti*, *svevo*, *Giove*, *compensano*,
  *concorrenti*, *immantinente*, *giulebbe* (dʒu'leːbe, also with a single b), *buon* (p. 24), *vien* (p. 20),
  *Alfonso* (al'fonso), *presento* (pre'sento, with s as well).
- **-ebbe conditionals:** Castel prints closed `'rebːbe` throughout Act I (*potrebbe, vorrebbe, guasterebbe, farebbe*).
  The app has open *guasterebbe* and *farebbe* (DOP -èbbe), so these are (d). The app's closed *potrebbe* and
  *vorrebbe* agree with Castel, so they count as matching. Note, though, that they disagree with DOP and with the app's
  own *guasterebbe/farebbe*. You may want to make them open for consistency, which I did not do because Castel matches.
- **fe'** (fece, L01): Castel 'fɛ, and his text has *fè*. The app has ˈfe (DOP *fé*). **Affé:** Castel a'fːfɛ, the app
  afˈfe (DOP *affé*).
- **zecchini, zecchinetto:** Castel has ttse-, the app dz- (DOP).
- **regio:** Castel geminates it ('rɛdːdʒo). The app has ˈrɛ.dʒo (standard).
- **Spelling forms the app keeps as in the score, where Castel normalises:** *femine/femina* (Castel `fɛmːm-`, and the
  app matches his open vowel), *machine/machina* ('makːk-), *sepellirmi* (sepːpe-), *comediola* (kɔmːm-), *secreto*
  (Castel *segreto*), *vallacchi* (Castel *valacchi*), *bebbero* (Castel *bevvero*), *Guilelmo* (Castel *Guglielmo*),
  *uscignuolo* (Castel *usignuolo*, z), *foco* (Castel *fuoco*), *monsieurs* (Castel *monsù*).
- **Castel's text differs, so there is no IPA comparison:** *perdendo* (Castel *perduto*), *astrolicarti* (*astrologarti*),
  *grazie* (*grazia*), *contra* (*contro*), *finora* (*ancora*), *pianger* (*piangere*), *menar* (*menare*), *avranno*
  (*avran*), *almen* (*almeno*).
- **Castel's slips:** *così* 'kozi on p. 18 (ko'zi on pp. 31, 44), and *capitale* ka'pitale (p. 49). The app is correct.

## Checked and matching (not errors, though they looked like candidates)

Flagged words: ponno (L24), dée ('de), Dee ('dɛː), pria, fia, sarian (sa'ri.an), potriali, tosco (ɔ), mensa (ɛ),
cenno (e), cospetto (ɛ), alletta (ɛ), Citerea (ɛ), Medoro (ɔ), Ciclopo (ɔ), Esopo (ɔ), Marcantoni (ɔ), Eumenidi (ɛ),
ei (e), venti (twenty ˈven.ti / winds ˈvɛn.ti, both as in Castel), così (z), spese (z). These flagged words were not in
Act I: venne, mansueti, discreti, rovescio, fer, cesse, mo, coquettizzar, negliger, denno, pon, malora, en bagatelle,
abrégé. *resister* (L37-171) has no Castel IPA.

Others: veston (ɛ), femmine (closed, p. 32), attendendo/attendermi (ɛ), furenti (ɛ), incolpa, ingannevoli, orecchio,
ordin, giovani, bombe, legno, sogno/segno/sdegno, entro/dentro, tocca/bocca, scherzo, sola, enorme (closed in both;
DOP has open ò), affetto/effetto, mezza (ɛddz), pezzo, ognor, riposi, fedeli, esempi, giuramenti, Alfonsetto,
occhietti, viscere, cangerassi.
