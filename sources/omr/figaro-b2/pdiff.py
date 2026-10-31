"""Semantic diff of two piano DSL files: per bar and hand, the set of (onset, pitch, duration, tie), dynamics; voices ignored."""
import sys, piano_dsl as P
ST = {"C":0,"D":2,"E":4,"F":5,"G":7,"A":9,"B":11}
def ev(path):
    import re
    D = {}
    for line in open(path):
        line = line.strip()
        if not line or line.startswith("#"): continue
        m = re.match(r"(\d+)\s+(RH|LH)(\d):\s*(.*)$", line); D.setdefault(int(m.group(1)), {})[(m.group(2), int(m.group(3)))] = m.group(4).split()
    out = {}
    for bar, vs in D.items():
        for (h, v), toks in vs.items():
            S = out.setdefault((bar, h), [set(), set()])
            for on, el in P.notes_for(toks, 1 if h == "RH" else 2, v)[0]:
                if el.tag == "direction":
                    S[1].add((on, "".join(el.itertext()))); continue
                if el.tag != "note" or el.find("rest") is not None: continue
                p = el.find("pitch"); a = int(p.findtext("alter") or 0)
                midi = 12 * (int(p.findtext("octave")) + 1) + ST[p.findtext("step")] + a
                name = p.findtext("step") + {0: "", 1: "#", -1: "b", 2: "##", -2: "bb"}[a] + p.findtext("octave")
                g = el.find("grace") is not None
                S[0].add((on, name, 0 if g else int(el.findtext("duration")), el.find("tie") is not None, el.find("notations/ornaments/tremolo") is not None))
    return out
a, b = ev(sys.argv[1]), ev(sys.argv[2]); n = 0
for k in sorted(set(a) | set(b)):
    A = a.get(k, [set(), set()]); B = b.get(k, [set(), set()])
    if A[0] != B[0] or A[1] != B[1]:
        n += 1; print(k[0], k[1])
        for lab, x, y in (("notes", A[0], B[0]), ("dyn", A[1], B[1])):
            if x - y: print("  A only", lab, sorted(x - y))
            if y - x: print("  B only", lab, sorted(y - x))
print("#", n, "differing bar/hands of", len(set(a) | set(b)), file=sys.stderr)
