"""Split long skeleton phrases (> MAX words) at commas, at the musical repeats, with each part's own startMeasure.
usage: split4.py lang.json voices.txt CODE=role,... MAX"""
import json, re, sys
L, VO, RM, MAX = sys.argv[1], sys.argv[2], dict(x.split("=") for x in sys.argv[3].split(",")), int(sys.argv[4])
wb = {}
for line in open(VO, encoding="utf-8"):
    m = re.match(r"(\d+) ([A-Z]): (.*)", line.strip())
    if not m or m.group(2) not in RM: continue
    b = int(m.group(1)); role = RM[m.group(2)]
    for tok, ly in re.findall(r'(\S+?)(?:\s+"([^"]*)")?(?=\s|$)', m.group(3)):
        if not ly or tok.startswith('"'): continue
        acc = wb.setdefault(role, {"list": [], "open": None})
        for k, p in enumerate(ly.split("_")):
            if acc["open"] is None: acc["open"] = b
            if not p.endswith("-") or k < len(ly.split("_")) - 1:
                acc["list"].append(acc["open"]); acc["open"] = None
d = json.load(open(L)); out = []; pos = {r: 0 for r in wb}; cnt = {}
for ph in d["phrases"]:
    r = ph["role"]; o = pos[r]; n = len(ph["words"]); pos[r] += n
    bars = wb[r]["list"][o:o + n]
    assert str(bars[0]) == ph["startMeasure"], (ph["original"], bars[0], ph["startMeasure"])
    cuts = [0]
    if n > MAX:
        # cut after a word ending with , ! . when the chunk would otherwise pass MAX, preferring the latest comma
        start = 0
        while n - start > MAX:
            best = None
            for i in range(start + 3, min(n, start + MAX)):
                if re.search(r"[,!.;:]$", ph["words"][i - 1][0]): best = i
            if best is None: break
            cuts.append(best); start = best
    cuts.append(n)
    for a, b in zip(cuts, cuts[1:]):
        cnt[r] = cnt.get(r, 0) + 1
        ws = ph["words"][a:b]
        out.append({**ph, "id": f"{r[0]}{cnt[r]}", "startMeasure": str(bars[a]), "original": " ".join(w[0] for w in ws), "words": ws})
d["phrases"] = out; json.dump(d, open(L, "w"), ensure_ascii=False, indent=1)
for p in out: print(p["role"][:4], p["startMeasure"], len(p["words"]), p["original"])
