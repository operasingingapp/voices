"""Phrase skeletons for language.json from voices.txt: per singer, a phrase ends at a rest of a quarter or more,
or at a sentence end (. ! ? ; :) followed by any rest. Words split at elisions (_). usage: skel.py PIECE B0 B1 EDITION ROLES(code=role,...)"""
import re, json, sys
piece, b0, b1, ed, roles = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4], dict(x.split("=") for x in sys.argv[5].split(","))
QL = {"w": 4, "h": 2, "q": 1, "e": .5, "s": .25, "x": .125}
def dur(t):
    d = t.split(":")[-1].rstrip("~!"); trip = d.endswith("3"); d = d.rstrip("3"); dot = d.endswith("."); d = d.rstrip(".")
    v = QL[d] * (1.5 if dot else 1); return v * 2 / 3 if trip else v
V = {}
for line in open("voices.txt", encoding="utf-8"):
    m = re.match(r"(\d+) ([A-Z]): (.*)", line.strip())
    if m and b0 <= int(m.group(1)) <= b1 and m.group(2) in roles:
        V.setdefault(m.group(2), []).append((int(m.group(1)), re.findall(r'(\S+?)(?:\s+"([^"]*)")?(?=\s|$)', m.group(3))))
phrases = []
for code, bars in V.items():
    cur = None; word = ""; restacc = 0
    def close():
        global cur
        if cur and cur["words"]: phrases.append(cur)
        cur = None
    for b, toks in bars:
        for tok, ly in toks:
            if tok.startswith('"'): continue
            if tok.startswith("r:"):
                restacc += dur(tok)
                if cur and not word and (restacc >= 1 or re.search(r"[.!?;:…]$", cur["words"][-1])):
                    close()
                continue
            if tok.startswith("g:") or not ly:
                restacc = 0; continue
            restacc = 0
            pieces = ly.split("_")
            for k, p in enumerate(pieces):
                if cur is None:
                    if k > 0 and phrases and phrases[-1]["role"] == roles[code]:
                        cur = phrases.pop()   # an elided word can't start a phrase: keep it with the one before
                    else:
                        cur = {"role": roles[code], "start": b, "words": []}
                if k > 0 and word:
                    cur["words"].append(word); word = ""
                word += p.rstrip("-")
                if not p.endswith("-") or k < len(pieces) - 1:
                    if k == len(pieces) - 1:
                        cur["words"].append(word); word = ""
    if word and cur: cur["words"].append(word)
    close()
phrases.sort(key=lambda p: (p["start"], 0 if p["role"] == roles.get("S") else 1))
out = []
cnt = {}
for p in phrases:
    r = p["role"]; cnt[r] = cnt.get(r, 0) + 1
    out.append({"id": f"{r[0]}{cnt[r]}", "role": r, "verse": 1, "occurrence": 1, "startMeasure": str(p["start"] - b0 + 1),
                "original": " ".join(p["words"]), "translation": "", "ipa": "", "words": [[w, "", ""] for w in p["words"]], "glossGroups": [], "audio": {}})
json.dump({"editionId": ed, "language": "it", "review": {"status": "unreviewed-fixture"}, "notes": "", "phrases": out},
          open(f"lang_{piece}.json", "w"), ensure_ascii=False, indent=1)
print(piece, len(out), "phrases")
