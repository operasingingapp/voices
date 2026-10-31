# Filling in the words layer (IPA, word meanings, translations) for opera practice

Files: /home/claude/ext/figaro/b2/lang_PIECE.json — skeletons of phrases (Italian, Le nozze di Figaro, Da Ponte).
Model of a finished file (same app, same conventions): /home/claude/voices/content/pieces/mozart-cinque-dieci-venti/language.json
(read its "notes" and several phrases first, and follow them exactly).

For every phrase fill:
- "translation": a literal but natural English translation of the phrase (for meaning, not singable).
- "ipa": the phrase in IPA as SUNG in Italian: stressed syllable marked ˈ on polysyllables, syllables separated by .,
  elisions (two words sung on one note, or vowel meeting vowel across words in the score) joined with ‿, open e/o as
  ɛ/ɔ where standard Italian has them, intervocalic s voiced [z] where standard, double consonants written double
  (kk, tt, ll ...), gn = ɲ, gli = ʎ, sc(e/i) = ʃ, c(e/i) = tʃ, g(e/i) = dʒ, z = ts or dz as standard.
- "words": for each word [text, gloss, ipa]: keep text EXACTLY as given (do not change spelling, accents or
  punctuation: they match the sung syllables); gloss = short English meaning of that word in context (1-3 words);
  ipa = that word's IPA (no ‿).
- "glossGroups": optional, for idioms that mean something only together: {"words":[indices], "gloss":"..."}.
Also fill "notes" at the top: one or two sentences like the model's (libretto by Lorenzo Da Ponte (1786), words follow
the engraving's spelling — name notable spellings you see, e.g. pò, quà, nè, pugnendo, rovescierò —, IPA conventions,
translation literal, for meaning).
Do NOT change ids, roles, startMeasure, occurrence, original, the number or order of words, or the order of phrases.
Validate: the file must stay valid JSON (python3 -c "import json;json.load(open(...))").
