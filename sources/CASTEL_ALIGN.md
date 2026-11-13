# Castel alignment: IPA changes in La bohème, Così fan tutte and Le nozze di Figaro

Scope: `content/pieces/<id>/language.json` for the 30 Bohème pieces (all `puccini-*` except `puccini-o-mio-babbino-caro`),
the 32 Così pieces and the 74 Figaro pieces (`mozart-*`; Così/Figaro split by the manifest subtitle, `mozart-der-holle-rache`
excluded). Only word IPA (`words[k][2]`) and phrase `ipa` strings were changed: 89 files, 341 word IPAs, 313 phrase IPAs.
No word, gloss, translation, start bar or other field changed (checked by a field-by-field diff against a copy taken before
editing). Files are written in their original format (indent 1, UTF-8, no trailing newline). Castel was used only to check
pronunciation; none of his text, translations or notes was copied (this report gives his choices as "open/closed", not
his transcriptions).

Page numbers are PDF pages of each scan: Bohème `ext/boheme/src/castel.pdf` (printed page = PDF + 1), Così
`ext/cosi/src/castel.pdf`, Figaro `ext/figaro/castel/castel.pdf` (book page = PDF + 279).

## Method

1. Candidates: every class (d) item in the check notes (`boheme/draft/ipa_check.md`, `boheme/m1/integ_puccini-*.md`,
   `cosi/draft/ipa_check_act1.md` and `ipa_check_act2.md`, `figaro/ipa_check.md`), the "consistency fixes" made
   against Castel, and the app words those notes call inconsistent.
2. Every Castel token of each candidate (and its other occurrences in the same opera) was found by a fresh OCR of the
   page images, cropped (IPA line + Italian line) and read by eye, zoomed. Each word form was decided on its own Castel
   tokens in that opera's book.
3. Several (d) items in the notes turned out, at zoom, to agree with the app (Castel prints the same vowel), so they
   needed no change: Bohème *quartier(e), crêma, concetti, sospetto, intesser, bicchiere, Ehi, vengo, aspetta,
   desiderio, Balancez*; Figaro *maestro, ebben/ebbene, sensi, difenda, difendermi, prudente, pretende, impresso/a,
   oppresso, straniere, cede, decrepita, ripetimi, t'arresta, serbo, rimedio, esso, m'empie, alcun*; Così *desto,
   amorose, dopo, ora, forse, vostr-, conosco* (p. 41).
4. Changes followed the user's rule (open/closed stressed e/o, s/z, ts/dz, single/double consonants, stress, foreign
   words). Kept as app notation: *io* = jo on one note, nothing across word boundaries, unstressed e/o closed, syllable
   dots. Each word IPA and the matching phrase token were changed in every piece of that opera where the word form
   occurs. Then n → ŋ before k/g inside a word, in all three operas (word and phrase IPA; never across a space or ‿).

## Not changed, and why

- **Castel prints the same word form both ways in the same book** (no single Castel choice to follow): Bohème *colla*
  (57 closed, 73 open), *splendor* (73/82), *corri* (44/68), *amor*, *d'amor* (mostly closed, 88 and 111 open),
  *viso* (z at 39, 79; s at 98), *lascerem*, *presto*, *Son*, *Oh*; Così *esempio* (27 open; 43, 70 closed), *verso*
  (47/48, 134), *vien* (20/26), *buon* (24/54), *deggio* (18 closed; 85, 98, 99 open), *regio* (16 double, 128 single),
  *lei*, *sei* (open and closed), *amorosi* (46/84, 127), *presto* (13/64), *diletto* (78 against 32, 40, 87, 115);
  Figaro *contento* (105 open, 109 closed), *eccomi* (158/163), *sciolto* (74 both), *conosco* (83/165), *forse*
  (one open, 93, against four closed), *l'ora* (48/149), *loro* (127/168), *fè* = fece (7 open, 148 closed),
  *canzonetta* and *confuso* (s and z), *so*, *vo'*, *oh*, *presto* (as the Figaro note says).
- **Different spelling or text in Castel, or the score's notes decide the syllables** (no pronunciation choice):
  *secreto, femine, abbruci, scienza*, *sei/sai* sung on two notes, *andiam, paurosa, dee*, *l'autor*.
- **Evident misprints:** Bohème *Scoppietta* with one p; Così *capitale* and *così* with stress on the wrong syllable
  (the notes' finding; Castel prints the right form elsewhere); Figaro's doubtful *alcun/qualcun/fate* stresses.
  *giulebbe* (Così 35) was taken as closed e, but the double b was kept because Castel's mark after the e is read
  as his geminate colon put in the wrong place.
- **The three books differ from each other.** Castel's Figaro has closed *era, sei, lei, senti, spero, l'ho, vengo,
  venga, giova* and open *posto/posti, sembra*, while his Bohème has open *era, sei, lei, senti, giova* and closed
  *sembra* (checked at Bohème 96, 106, 12, 20, 30, 38, 64, 33, 54, 55). His Così has *lei/sei* both ways and open
  *spero, fè, cerca* (his Bohème has closed *cerca*, the app agrees). So each opera follows its own book, and these
  words differ between operas: *cerca, presento, fè, era, sei, lei, l'ho, spero, senti, avrei, vengo/venga, giova,
  posto/posti, sembra, spera*.

## Found and not touched (outside this task)

140 phrases have a phrase `ipa` whose tokens do not match the word IPAs one to one. Examples: `mozart-susanna-signore`
s5_2, s13, t7, s19, c31 mark nasal assimilation across words in the phrase IPA (*saŋ ˈko.me*, *nom ˈmɛr.tam*,
*uɱ ˈfɔʎ.ʎo*), against the app's convention; `mozart-scioccherie-di-poeti` f1 and g11 and `mozart-mi-par-che-stamattina`
a2 have word IPAs shorter than their phrase IPA (*scioccherie* = ˈri.e). The edits here kept these phrases' tokens in
step (each changed token was found exactly once). The phrase IPAs were not otherwise changed.

## Dry-run import

`CONTENT_SRC=/dev/shm/ca/src CONTENT_OUT=/dev/shm/ca/out npx tsx scripts/import-content.ts` over the 89 changed pieces:
exit 0, all 89 pieces and the catalog written, no errors (only the usual "spoken pronunciation not prepared" notes).
The scratch directory was deleted afterwards.

## Was every piece checked against Castel? (from the notes)

- **La bohème:** yes, all 30. Act 1 and Aranci, datteri (10 pieces) in `boheme/draft/ipa_check.md`; the other 20 in
  their `m1/integ_puccini-*.md` notes. `puccini-o-mio-babbino-caro` (Gianni Schicchi) has no Castel source and was not
  checked.
- **Così fan tutte:** yes, all 31 sung pieces. Every app piece is Act I, and its words are in the checked Act I libretto
  (`cosi/draft/lib` L01–L37, `ipa_check_act1.md`); 97 % of the app's word IPAs are identical to that checked text,
  and the rest are mostly elisions and syllable splits. `mozart-cosi-sinfonia` has no words. (Act II was checked too,
  but no Act II piece is in the app yet.)
- **Le nozze di Figaro:** yes, all 74 pieces (`figaro/ipa_check.md`), but that note lists 145 word types with a
  stressed e/o that had no readable Castel token (OCR missed the line or ensemble columns), so those were not checked.

## Every change

### La bohème: word changes (37 tokens)

| word | old → new | pieces (tokens) | Castel page(s) |
|---|---|---|---|
| allegra | alˈle.gra → alˈlɛ.gra | questo-mar-rosso (3), si-puo | 11, 23 |
| allegre | alˈle.gre → alˈlɛ.gre | aranci-datteri | 45 |
| allegri | alˈle.gri → alˈlɛ.gri | signorina-mimi (2) | 55 |
| collerico | kolˈlɛ.ri.ko → kolˈle.ri.ko | marcello-finalmente | 83 |
| coupè | kuˈpe → kuˈpɛ | in-un-coupe | 95 |
| desta | ˈde.sta → ˈdɛ.sta | mimi-marcello | 82 |
| espresso | eˈsprɛs.so → eˈspres.so | musetta | 109 |
| faraon | fa.raˈon → fa.raˈɔn | questo-mar-rosso | 4 |
| guizot | giˈzo → giˈzɔ | che-ora-sia | 101 |
| l'esil | ˈlɛ.zil → ˈle.zil | mimi-e-tanto-malata | 85 |
| momus | ˈmɔ.mus → mɔˈmys | al-quartiere-latin, ehi-rodolfo (20) | 25, 39, 43, 46-50 |
| ritorna | riˈtor.na → riˈtɔr.na | donde-lieta-usci | 87 |
| zucchero | ˈdzuk.ke.ro → ˈtsuk.ke.ro | si-puo | 24 |

### Così fan tutte: word changes (37 tokens)

| word | old → new | pieces (tokens) | Castel page(s) |
|---|---|---|---|
| accresce | akˈkreʃ.ʃe → akˈkrɛʃ.ʃe | bella-vita-militar (3), di-scrivermi-ogni-giorno (4) | 21 (cresce 68, 122) |
| cerca | ˈtʃer.ka → ˈtʃɛr.ka | come-scoglio | 44 |
| compensano | komˈpɛn.sa.no → komˈpen.sa.no | signora-dorabella | 30 |
| concorrenti | koŋ.korˈrɛn.ti → koŋ.korˈren.ti | che-silenzio | 36 |
| consola | konˈsɔ.la → konˈso.la | ah-scostati-smanie-implacabili, come-scoglio | 27, 43 |
| cresi | ˈkrɛ.zi → ˈkre.zi | rivolgete-a-lui-lo-sguardo | 48 |
| disinteresse | di.zin.teˈrɛs.se → di.zin.teˈres.se | scioccherie-di-poeti | 8 |
| fè | ˈfe → ˈfɛ | la-mia-dorabella (2), scioccherie-di-poeti | 4, 8, 94 |
| giulebbe | dʒuˈlɛb.be → dʒuˈleb.be | che-silenzio | 35 (Castel dʒu'le:be; the colon after e read as his misplaced geminate mark, so b kept double) |
| gonne | ˈgon.ne → ˈgɔn.ne | fuor-la-spada | 6 |
| guasterebbe | gwa.steˈrɛb.be → gwa.steˈreb.be | e-voi-ridete (2) | 50 (all Act I -ebbe closed: potrebbe 33, vorrebbe 35, farebbe 61) |
| immantinente | im.man.tiˈnɛn.te → im.man.tiˈnen.te | alla-bella-despinetta (6) | 39 |
| presento | preˈzɛn.to → preˈsen.to | alla-bella-despinetta | 37 |
| sembran | ˈsem.bran → ˈsɛm.bran | ah-guarda-sorella (3) | 12 |
| sfogo | ˈsfo.go → ˈsfɔ.go | non-piangere-idol-mio | 19 |
| spera | ˈspɛ.ra → ˈspe.ra | non-son-cattivo-comico | 25 |
| zecchinetto | dzek.kiˈnet.to → tsek.kiˈnet.to | che-silenzio | 103 (zecchinetti) |
| zecchini | dzekˈki.ni → tsekˈki.ni | non-son-cattivo-comico, scioccherie-di-poeti (2) | 9, 11, 25, 51 |

### Le nozze di Figaro: word changes (187 tokens)

| word | old → new | pieces (tokens) | Castel page(s) |
|---|---|---|---|
| avrei | aˈvrɛ.i → aˈvre.i | e-perche-fosti-meco, ed-aspettaste-il-giorno | 106 |
| ch'ho | ˈkɔ → ˈko | cosa-sento | 33 |
| ch'osi | ˈkɔ.zi → ˈko.zi | vieni-cara-susanna | 49 |
| codesto | koˈde.sto → koˈdɛ.sto | che-novita | 64 |
| compensi | komˈpɛn.si → komˈpen.si | pace-pace (6) | 166 |
| compiacente | kom.pjaˈtʃɛn.te → kom.pjaˈtʃen.te | partito-e-alfin-l-audace | 158 |
| comprendo | komˈprɛn.do → komˈpren.do | esci-omai-garzon-malnato (4) | 75 |
| conosce | koˈnoʃ.ʃe → koˈnɔʃ.ʃe | la-vendetta (2) | 17 |
| consigliera | kon.siʎˈʎɛ.ra → kon.siʎˈʎe.ra | vieni-cara-susanna | 47 |
| contenti | konˈtɛn.ti → konˈten.ti | gente-gente-all-armi (33), questo-giorno-di-tormenti (11) | 169 |
| demone | ˈdɛ.mo.ne → ˈde.mo.ne | eh-cospettate | 130 |
| diploma | diˈplɔ.ma → diˈplo.ma | vieni-cara-susanna | 48 |
| disposto | disˈpos.to → disˈpɔs.to | tutto-e-disposto | 41, 136, 149 |
| disposto | diˈspo.sto → diˈspɔ.sto | ecco-la-marcia, evviva | 41, 136, 149 |
| era | ˈɛ.ra → ˈe.ra | basilio-in-traccia-tosto, che-imbarazzo, che-novita, cosa-sento (2), ecco-la-marcia, eh-cospettate | 33, 64, 132, 135 |
| eran | ˈɛ.ran → ˈe.ran | eh-cospettate | 131 |
| giova | ˈdʒɔ.va → ˈdʒo.va | aprite-presto-aprite (2), hai-gia-vinta, in-quegli-anni | 69 |
| interesse | in.teˈrɛs.se → in.teˈres.se | presto-avvertiam-susanna | 141 |
| l'ebbi | ˈleb.bi → ˈlɛb.bi | bravo-che-bella-voce | 56 |
| l'ho | ˈlɔ → ˈlo | barbarina-coshai, cosa-stai-misurando, lho-perduta (3), voi-che-sapete (5) | 8, 137 |
| leggeva | ledˈdʒe.va → ledˈdʒɛ.va | cosa-mi-narri | 124 |
| lei | ˈlɛ.i → ˈle.i | aprite-presto-aprite, e-decisa-la-lite, in-quegli-anni, via-resti-servita (4), vieni-cara-susanna | 19, 70, 97, 147, 157 |
| lei | ˈlɛi → ˈlei | pian-pianin (3), voi-signor-che-giusto-siete | 19, 70, 97, 147, 157 |
| mento | ˈmen.to → ˈmɛn.to | signori-di-fuori (2) | 84, 105 |
| mentono | ˈmen.to.no → ˈmɛn.to.no | tutto-e-disposto (2) | 150 |
| menzogner | men.tsoɲˈɲɛr → men.tsoɲˈɲer | dove-sono (3) | 122 |
| mercede | merˈtʃe.de → merˈtʃɛ.de | susanna-signore | 79 |
| n'era | ˈnɛ.ra → ˈne.ra | or-bene-ascolta-e-taci | 12 |
| osa | ˈɔ.za → ˈo.za | susanna-or-via-sortite | 66 |
| pensa | ˈpɛn.sa → ˈpen.sa | che-imbarazzo | 102 |
| pensi | ˈpɛn.si → ˈpen.si | vieni-cara-susanna | 48 |
| porgi | ˈpɔr.dʒi → ˈpor.dʒi | porgi-amor (2) | 45 |
| posti | ˈpo.sti → ˈpɔ.sti | ecco-la-marcia (2) | 133 |
| posto | ˈpo.sto → ˈpɔ.sto | che-imbarazzo, evviva, via-resti-servita (2) | 20, 41, 100 |
| potrebbe | poˈtrɛb.be → poˈtreb.be | hai-diavoli-nel-corpo | 16, 100, 146 (all -ebbe closed: vorrebbe 17, dovrebbe 101) |
| prende | ˈprɛn.de → ˈpren.de | or-bene-ascolta-e-taci | 11 |
| ricompensa | ri.komˈpɛn.sa → ri.komˈpen.sa | va-la-vecchia-pedante | 23 |
| ripete | riˈpe.te → riˈpɛ.te | or-bene-ascolta-e-taci | 11 |
| sceglier | ˈʃeʎ.ʎer → ˈʃɛʎ.ʎer | vieni-cara-susanna | 47 |
| scelgo | ˈʃel.go → ˈʃɛl.go | evviva | 41 |
| seggio | ˈsɛd.dʒo → ˈsed.dʒo | cosa-sento | 32 |
| sei | ˈsɛ.i → ˈse.i | eh-cospettate, esci-omai-garzon-malnato, susanna-signore, va-la-vecchia-pedante | 8, 21, 77, 88, 132, 156, 165 |
| sei | ˈsɛi → ˈsei | ah-signor-signor (2), cosa-stai-misurando (2), pace-pace (2), pian-pianin (5) | 8, 21, 77, 88, 132, 156, 165 |
| selve | ˈsel.ve → ˈsɛl.ve | il-capro-e-la-capretta (2) | 142 |
| sembra | ˈsem.bra → ˈsɛm.bra | cinque-dieci-venti (6) | 6 |
| senti | ˈsɛn.ti → ˈsen.ti | riconosci-in-questo-amplesso (4), taci-vien-gente | 27, 115, 116 |
| sirene | siˈrɛ.ne → siˈre.ne | tutto-e-disposto (2) | 150 |
| sistema | siˈstɛ.ma → siˈste.ma | vieni-cara-susanna | 46 |
| soliti | ˈsɔ.li.ti → ˈso.li.ti | che-imbarazzo | 102 |
| sorger | ˈsor.dʒer → ˈsɔr.dʒer | ah-signor-signor (2) | 88 |
| sorprendere | sorˈprɛn.de.re → sorˈpren.de.re | tutto-e-tranquillo (2) | 163 |
| sorprendermi | sorˈprɛn.der.mi → sorˈpren.der.mi | tutto-e-tranquillo (2) | 163 |
| spero | ˈspɛ.ro → ˈspe.ro | e-decisa-la-lite | 111 |
| streghe | ˈstre.ge → ˈstrɛ.ge | tutto-e-disposto (2) | 150 |
| teneri | ˈtɛ.ne.ri → ˈte.ne.ri | e-decisa-la-lite | 112 |
| venere | ˈvɛ.ne.re → ˈve.ne.re | partito-e-alfin-l-audace (2), tutto-e-tranquillo | 160, 161 |
| venga | ˈvɛn.ga → ˈveŋ.ga | oh-guarda-il-demonietto | 71 |
| vengo | ˈvɛŋ.go → ˈveŋ.go | riconosci-in-questo-amplesso, voi-signor-che-giusto-siete (3) | 65, 97 |
| vengono | ˈvɛn.go.no → ˈveŋ.go.no | queste-sono-madama | 96 |
| vengono | ˈvɛŋ.go.no → ˈveŋ.go.no | voi-signor-che-giusto-siete (2) | 96 |
| venne | ˈven.ne → ˈvɛn.ne | basilio-in-traccia-tosto, quanto-duolmi-susanna | 35, 46 |

### La bohème: ŋ inside words (36 tokens)

| word | old → new | pieces (tokens) |
|---|---|---|
| ancor | anˈkor → aŋˈkor | addio-dolce-svegliare (2), al-quartiere-latin, ehi-rodolfo, musetta (2), o-mimi-tu-piu-non-torni, questo-mar-rosso |
| ancora | anˈko.ra → aŋˈko.ra | che-ha-detto-il-medico, si-puo, signorina-mimi, sono-andati |
| angoscie | anˈgɔʃ.ʃe → aŋˈgɔʃ.ʃe | quando-men-vo (2) |
| bianca | ˈbjan.ka → ˈbjaŋ.ka | mi-chiamano-mimi |
| cinguetta | tʃinˈgwet.ta → tʃiŋˈgwet.ta | sono-andati |
| cinguettio | tʃin.gwetˈti.o → tʃiŋ.gwetˈti.o | addio-dolce-svegliare |
| dunque | ˈdun.kwe → ˈduŋ.kwe | addio-dolce-svegliare, mimi-e-tanto-malata (2) |
| fingo | ˈfin.go → ˈfiŋ.go | mimi-marcello |
| ingrediat | inˈgre.djat → iŋˈgre.djat | chi-guardi |
| l'incanto | linˈkan.to → liŋˈkan.to | legna |
| lusinghier | lu.zinˈgjɛr → lu.ziŋˈgjɛr | marcello-finalmente |
| m'inchino | minˈki.no → miŋˈki.no | legna |
| panca | ˈpan.ka → ˈpaŋ.ka | mimi-marcello |
| pingo | ˈpin.go → ˈpiŋ.go | mimi-marcello |
| rancor | ranˈkor → raŋˈkor | donde-lieta-usci (2) |
| rincasate | rin.kaˈza.te → riŋ.kaˈza.te | mimi-marcello |
| ringhiera | rinˈgjɛ.ra → riŋˈgjɛ.ra | al-quartiere-latin |
| ringrazio | rinˈgrat.tsjo → riŋˈgrat.tsjo | addio-dolce-svegliare |
| stanca | ˈstan.ka → ˈstaŋ.ka | musetta |
| tranquilla | tranˈkwil.la → traŋˈkwil.la | che-ha-detto-il-medico, mi-chiamano-mimi |
| tranquilli | tranˈkwil.li → traŋˈkwil.li | vecchia-zimarra |

### Le nozze di Figaro: ŋ inside words (44 tokens)

| word | old → new | pieces (tokens) |
|---|---|---|
| ancor | anˈkor → aŋˈkor | barbarina-coshai, e-decisa-la-lite, eccovi-o-caro-amico, or-bene-ascolta-e-taci, tutto-ancor-non-ho-perso, tutto-e-tranquillo, via-resti-servita (10), vieni-cara-susanna |
| ancora | anˈko.ra → aŋˈko.ra | eccovi-o-caro-amico, evviva, presto-avvertiam-susanna, tutto-e-tranquillo, vieni-cara-susanna |
| dunque | ˈdun.kwe → ˈduŋ.kwe | or-bene-ascolta-e-taci |
| fianco | ˈfjan.ko → ˈfjaŋ.ko | non-piu-andrai |
| franco | ˈfran.ko → ˈfraŋ.ko | non-piu-andrai |
| ingrato | inˈgra.to → iŋˈgra.to | cos-e-questa-commedia |
| l'ingrato | linˈgra.to → liŋˈgra.to | dove-sono (9) |
| languire | lanˈgwi.re → laŋˈgwi.re | dove-sono (2) |
| lusingato | lu.zinˈga.to → lu.ziŋˈga.to | or-bene-ascolta-e-taci |
| mancai | manˈka.i → maŋˈka.i | evviva |
| manchi | ˈman.ki → ˈmaŋ.ki | e-perche-fosti-meco |
| manco | ˈman.ko → ˈmaŋ.ko | quanto-duolmi-susanna |
| ringrazio | rinˈgrat.tsjo → riŋˈgrat.tsjo | queste-sono-madama |
| stanco | ˈstan.ko → ˈstaŋ.ko | or-bene-ascolta-e-taci |
| tranquillo | tranˈkwil.lo → traŋˈkwil.lo | tutto-e-tranquillo |