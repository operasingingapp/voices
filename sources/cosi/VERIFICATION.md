# Così fan tutte: how the content was checked

Sources of truth
- Libretto: the Digitale Mozart-Edition critical text of the libretto as Mozart set it (LV_311, "Kritische Edition des vertonten Textes"). Source for the story, stage action, who is on stage, and the list of characters (PERSONAGGI).
- Score: Edition Peters vocal score, edited by Georg Schünemann and Kurt Soldan (plate 11446; IMSLP #826407). Source for what Mozart set: numbering, kinds of piece, who sings, sung words where they differ from the libretto, and the place of every entry in the print.

What was checked: the opera's story (summary and act-by-act synopsis), 6 cast lines (name, voice type, description), the running order (74 entries: every number and recitative, with who sings, who is on stage without singing, what happens), each character's list of pieces (derived from the running order), 12 act-by-act arcs and 26 "when" lines. About 130 items.

Files
- app-cosi.md: the checked text the app's content was taken from (story, cast, running order S1–S74, lists of pieces, arcs, "when" lines). Its open questions are notes for later decisions and are not in the app.
- libretto_dme.json: the libretto parsed section by section (kit/parse_lv.py, from the DME text).
- numbers.tsv: the first skeleton of numbers and recitatives from the score's pages (who sings marked tentative there; the running order in app-cosi.md is the checked version).
- lib/: the 65 libretto sections (L01–L65) with IPA, word meanings and translations written for this app.
- ipa_check_act1.md, ipa_check_act2.md: the word-by-word IPA check.

Method
1. Drafted from the sources: the libretto parsed section by section; the running order written entry by entry against it; numbering, kinds, singers and page places taken from the score.
2. Independent review rounds. Each round, three fresh reviewers who had not seen the text or earlier findings checked it from three directions:
   - from the app to the sources: every sentence against the libretto and the score;
   - from the sources to the app: every libretto section and the score page by page at every entry boundary;
   - role by role, as a singer would read it (each list of pieces rebuilt from the running order, every "sings" field against the speakers, arcs and "when" lines).
   Findings were classed ERROR / OMISSION / MINOR, fixed, and the next round started on the corrected text.
3. Stopping rule: a round with no ERROR from any reviewer.

Rounds: three rounds of three reviewers each.
- Round 1: 10 ERROR, 6 OMISSION, 45 MINOR; 60 applied, 1 rejected (both readings correct for their source).
- Round 2: 1 ERROR, 3 OMISSION, 26 MINOR; all 30 applied.
- Round 3: no ERROR; 2 OMISSION, 20 MINOR; 18 applied, 4 rejected. No "sings" field changed in round 3.

IPA: written for the app, then checked word by word against Nico Castel's libretto, used only as a check: none of its text, translations or notes is in the app or in this folder. Act I: 4175 word tokens, 11 real errors (10 words) fixed; Act II: 4292 tokens, 16 fixed (13 real errors, mostly the openness of a stressed e or o, and 3 tokens made consistent with the dictionary form). 27 tokens in all, followed by a consistency pass over the whole libretto.

Conventions: "on stage" lists everyone present at any point of the entry who does not sing; "sings" lists named cast only (choruses are described in the text); kinds use the score's Italian terms (Duetto, Terzetto, Quintetto, Sestetto, Coro); titles are as Peters prints them, with one misprint corrected (S3, "Fuor la spada: scegliete"); voice types are modern casting, with the score's original noted where it differs (Dorabella, Don Alfonso).

Judgement calls: No. 15a (Mozart's first aria for Guglielmo, "Rivolgete a lui lo sguardo", KV 584) is kept as its own entry beside No. 15, which replaced it; the Act 1 Finale is split into six entries and the Act 2 Finale into nine, at the score's changes of tempo, key or metre; what Despina knows of the disguise is given as "apparently", since the libretto never says when she learns it; the texts do not say which couples Don Alfonso joins at the end.
