import json, shutil, os, sys
V = "/home/claude/voices/content/pieces"
SRC = "Breitkopf & Härtel vocal score (Edition Breitkopf 1716, about 1900)"
ROLES = {"susanna": ("Susanna", "Soprano"), "figaro": ("Figaro", "Bass-baritone"), "bartolo": ("Bartolo", "Bass"), "marcellina": ("Marcellina", "Mezzo-soprano")}
PIECES = [
  ("no2", "mozart-se-a-caso-madama", "Se a caso madama", "Figaro and Susanna's duettino from Le nozze di Figaro, Act 1", "duet", ["susanna", "figaro"], "pages 16-20 (No. 2)",
   [("a", "Se a caso madama · Figaro", 1, 43), ("b", "Così se il mattino · Susanna", 44, 86), ("c", "Susanna, pian pian · Udir bramo il resto", 87, 144)]),
  ("recit2", "mozart-or-bene-ascolta-e-taci", "Or bene, ascolta e taci", "Susanna and Figaro's recitative from Le nozze di Figaro, Act 1", "recitative", ["susanna", "figaro"], "pages 21-24, after No. 2",
   [("a", "Or bene, ascolta e taci", 1, 20), ("b", "E Basilio · to the end", 21, 40)]),
  ("bravo", "mozart-bravo-signor-padrone", "Bravo, signor padrone!", "Figaro's recitative from Le nozze di Figaro, Act 1", "recitative", ["figaro"], "page 25, before No. 3",
   [("a", "Bravo, signor padrone · to the end", 1, 14)]),
  ("no3", "mozart-se-vuol-ballare", "Se vuol ballare", "Figaro's cavatina from Le nozze di Figaro, Act 1", "cavatina", ["figaro"], "pages 26-29 (No. 3)",
   [("a", "Se vuol ballare", 1, 32), ("b", "Se vuol venire", 33, 63), ("c", "Presto: L'arte schermendo", 64, 103), ("d", "Tempo I · Presto to the end", 104, 131)]),
  ("recit3", "mozart-ed-aspettaste-il-giorno", "Ed aspettaste il giorno", "Bartolo and Marcellina's recitative from Le nozze di Figaro, Act 1", "recitative", ["marcellina", "bartolo"], "pages 30-31, after No. 3",
   [("a", "Ed aspettaste il giorno · to the end", 1, 22)]),
  ("no4", "mozart-la-vendetta", "La vendetta", "Bartolo's aria from Le nozze di Figaro, Act 1", "aria", ["bartolo"], "pages 32-36 (No. 4)",
   [("a", "La vendetta, oh la vendetta", 1, 27), ("b", "Coll'astuzia, coll'arguzia", 28, 55), ("c", "Se tutto il codice", 56, 81), ("d", "Tutta Siviglia conosce Bartolo", 82, 104)]),
]
def renumber(src, dst, b0):
    import re
    x = open(src).read()
    x = re.sub(r'<measure([^>]*)number="(\d+)"', lambda m: f'<measure{m.group(1)}number="{int(m.group(2)) - b0 + 1}"', x)
    open(dst, "w").write(x)
B0 = {"no2": 1, "recit2": 145, "bravo": 185, "no3": 199, "recit3": 330, "no4": 352}
ONLY = sys.argv[1:]
for key, ed, title, sub, kind, roles, where, passages in PIECES:
    if ONLY and key not in ONLY: continue
    d = f"{V}/{ed}"; os.makedirs(d, exist_ok=True)
    renumber(f"{key}_cur.xml", f"{d}/score.musicxml", B0[key])
    shutil.copy(f"lang_{key}.json", f"{d}/language.json")
    parts = [{"key": "piano", "label": "Piano", "shortLabel": "Piano", "kind": "piano", "source": {"xmlPartId": f"P{len(roles)+1}", "staves": [1, 2]}, "channel": 0, "program": 0, "velocityScale": 0.8, "defaultVolume": 0.7}]
    for k, r in enumerate(roles):
        parts.append({"key": r, "label": f"{ROLES[r][0]} ({ROLES[r][1]})", "shortLabel": ROLES[r][0], "kind": "voice", "roleId": r, "source": {"xmlPartId": f"P{k+1}"}, "channel": 3 + k, "program": 0, "velocityScale": 0.85, "defaultVolume": 1.0})
    man = {"editionId": ed, "editionVersion": "1.0.0-klengel", "title": title, "subtitle": sub, "kind": kind, "fixture": False, "pedal": "classical",
           "composer": "Wolfgang Amadeus Mozart", "librettist": "Lorenzo Da Ponte", "language": "it",
           "files": {"musicxml": "score.musicxml", "language": "language.json", "audioDir": "audio"},
           "roles": [{"id": r, "name": ROLES[r][0], "voiceType": ROLES[r][1], "partKey": r} for r in roles],
           "partMapping": parts,
           "passages": [{"id": i, "label": l, "start": str(a), "end": str(b)} for i, l, a, b in passages],
           "licences": [
             {"item": "Music", "source": "W. A. Mozart, Le nozze di Figaro, K. 492 (1786), Act 1", "author": "Wolfgang Amadeus Mozart (1756–1791)", "licence": "Public domain", "notes": ""},
             {"item": "Libretto text", "source": "Lorenzo Da Ponte, libretto of Le nozze di Figaro (1786)", "author": "Lorenzo Da Ponte (1749–1838)", "licence": "Public domain", "notes": "Words as printed in the Breitkopf vocal score."},
             {"item": "Score (score.musicxml)", "source": f"{SRC}, {where}", "author": "Paul Klengel (1854–1935), piano reduction", "licence": "Public domain", "notes": "Read with Halbestunde by the user; the sung lines written out twice independently from the printed pages and reconciled; the piano corrected and partly rewritten; checked bar by bar until a full round was clean, then by fresh checkers."},
             {"item": "IPA, gloss and translation", "source": "Written for this app", "author": "Counterpart development team", "licence": "CC0 1.0", "notes": "Unreviewed by a diction coach."}]}
    json.dump(man, open(f"{d}/manifest.json", "w"), indent=1, ensure_ascii=False)
print("ok")
