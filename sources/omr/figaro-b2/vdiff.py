"""Compare two transcriptions: prints bars/singers where they differ (normalised)."""
import re, sys
def load(p):
    V = {}
    for line in open(p, encoding="utf-8"):
        line = line.strip()
        if not line or line.startswith("#"): continue
        m = re.match(r"(\d+)\s+([A-Z]+[12]?):\s*(.*)$", line)
        if m: V[(int(m.group(1)), m.group(2))] = " ".join(m.group(3).split())
    return V
a, b = load(sys.argv[1]), load(sys.argv[2])
n = 0
for k in sorted(set(a) | set(b)):
    if a.get(k) != b.get(k):
        n += 1
        print(f"{k[0]} {k[1]}\n  A: {a.get(k)}\n  B: {b.get(k)}")
print(f"# {n} differences of {len(set(a)|set(b))} lines", file=sys.stderr)
