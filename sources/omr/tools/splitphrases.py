"""splitphrases.py EDITIONID [MAX] : split phrases longer than MAX characters (default 55) at punctuation (else near the middle,
never inside an elision) into shorter phrases, so the words box shows one short line. Words, glosses and IPA are carried
over; each new phrase's startMeasure comes from the compiled data (the bar of its first sung note). The new phrases get
"translation": "" and "split_from" (the old phrase's translation) so the translations can be redone for each part."""
import json, re, sys
ed = sys.argv[1]; MAX = int(sys.argv[2]) if len(sys.argv) > 2 else 55
V = "/home/claude/voices"
src = json.load(open(f"{V}/content/pieces/{ed}/language.json"))
comp = {p["id"]: p for p in json.load(open(f"{V}/data/content/{ed}/language.json"))["phrases"]}
def units(ipa):  # one IPA unit per word; a "‿" join covers two (or more) words
    out = []
    for tok in ipa.split():
        parts = tok.split("‿")
        out.append(tok if len(parts) == 1 else tok)  # keep joined tokens whole
    return out
def chunks(words, ipa_units, joined_after):
    # candidate cut points: after word i (exclusive end), not inside an elision
    n = len(words); text = lambda a, b: " ".join(w[0] for w in words[a:b])
    def best_cut(a, b):
        L = len(text(a, b)); cands = []
        for i in range(a + 1, b):
            if joined_after[i - 1]: continue
            left = len(text(a, i)); right = len(text(i, b))
            punct = bool(re.search(r"[,.;:!?…]$", words[i - 1][0]))
            if left < 12 or right < 12: continue
            cands.append(((0 if punct else 1), abs(left - right) if not punct else max(left, right), i))
        return min(cands)[2] if cands else None
    segs = [(0, n)]; changed = True
    while changed:
        changed = False; out = []
        for a, b in segs:
            if len(text(a, b)) > MAX:
                c = best_cut(a, b)
                if c: out += [(a, c), (c, b)]; changed = True; continue
            out.append((a, b))
        segs = out
    return segs
new = []; nsplit = 0
for p in src["phrases"]:
    if len(p["original"]) <= MAX or p["id"] not in comp:
        new.append(p); continue
    words = p["words"]
    # phrase IPA units → per word: a token with k joins covers k+1 words
    toks = p["ipa"].split(); per = []; joined_after = []
    for t in toks:
        k = t.count("‿") + 1
        for j in range(k): per.append(t if j == 0 else None); joined_after.append(j < k - 1)
    if len(per) != len(words):
        print("skip (IPA units != words):", ed, p["id"], file=sys.stderr); new.append(p); continue
    segs = chunks(words, per, joined_after)
    if len(segs) == 1: new.append(p); continue
    nsplit += 1
    cw = comp[p["id"]]["words"]
    for k, (a, b) in enumerate(segs):
        q = dict(p)
        q["id"] = p["id"] if k == 0 else f"{p['id']}_{k+1}"
        q["words"] = words[a:b]
        q["original"] = " ".join(w[0] for w in words[a:b])
        q["ipa"] = " ".join(t for t in per[a:b] if t is not None)
        ids = [i for w in cw[a:b] for i in w.get("noteIds", [])]
        if ids: q["startMeasure"] = re.match(r"P\d+-m(\d+)-", ids[0]).group(1)
        q["glossGroups"] = [{"words": [i - a for i in g["words"]], "gloss": g["gloss"]} for g in p.get("glossGroups", []) if all(a <= i < b for i in g["words"])]
        q["translation"] = ""; q["split_from"] = p["translation"]; q["audio"] = {}
        new.append(q)
src["phrases"] = new
json.dump(src, open(f"{V}/content/pieces/{ed}/language.json", "w"), ensure_ascii=False, indent=1)
print(ed, "phrases split:", nsplit, "now", len(new))
