"""mklang.py PHRASES.json DICT.py OUT.json EDITIONID : language.json from the score's phrases and the word/phrase tables"""
import sys, json, re, runpy
P = json.load(open(sys.argv[1])); M = runpy.run_path(sys.argv[2]); D, T, CTX = M["D"], M["T"], M.get("CTX", {})
out = []; miss = set(); n = {}
LETTER = {"violetta": "v", "flora": "f", "alfredo": "a", "gastone": "g", "douphol": "b", "dottore": "d", "marchese": "m", "annina": "n", "germont": "gm"}
seen = {}
for p in P:
    ws = p["words"]; joins = set(p.get("joins", []))
    orig = " ".join(ws)
    words = []; ipas = []
    for i, w in enumerate(ws):
        k = re.sub(r'[.,;:?!…"«»]+', "", w).lower()
        prev = re.sub(r'[.,;:?!…"«»]+', "", ws[i - 1]).lower() if i else ""
        g = CTX.get((k, prev)) or D.get(k)
        if not g: miss.add(k); g = ("?", "?")
        words.append([w, g[0], g[1]]); ipas.append(g[1])
    ipa = ""
    for i, x in enumerate(ipas):
        ipa += ("‿" if (i - 1) in joins else (" " if i else "")) + x
    tr = T.get(orig)
    if tr is None: miss.add("PHRASE: " + orig); tr = ""
    r = p["role"]; n[r] = n.get(r, 0) + 1
    key = (r, orig); seen[key] = seen.get(key, 0) + 1
    out.append({"id": f"{LETTER.get(r, r[:2])}{n[r]:02d}", "role": r, "verse": 1, "occurrence": seen[key], "startMeasure": p["startMeasure"],
                "original": orig, "translation": tr, "ipa": ipa, "words": words, "glossGroups": [], "audio": {}})
doc = {"editionId": sys.argv[4], "language": "it", "review": {"status": "unreviewed-fixture"},
       "notes": "Libretto by Francesco Maria Piave (1853). Words as printed in the Ricordi vocal score (gioje, perchè, nè). IPA follows sung Italian conventions: stressed syllable marked, elisions joined with ‿, open e/o as ɛ/ɔ, intervocalic s voiced. Translation literal, for meaning; written for this app.",
       "phrases": out}
json.dump(doc, open(sys.argv[3], "w"), ensure_ascii=False, indent=1)
print(len(out), "phrases; missing:", sorted(miss))
