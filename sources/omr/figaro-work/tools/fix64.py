"""fix64.py IN OUT "PART:BAR:STAFF:ONSET;..." : a printed 64th-64th-dotted-16th turn that was built as 32nd-32nd-16th.
Doubles the file's divisions (so a 64th is a whole number), then retimes the three notes starting at ONSET (quarters)."""
import sys, xml.etree.ElementTree as ET
from fractions import Fraction as F
IN, OUT, spec = sys.argv[1:4]
head = open(IN).read().split("<score-partwise", 1)[0]
t = ET.parse(IN); r = t.getroot()
for e in r.iter():
    if e.tag in ("divisions", "duration"): e.text = str(int(e.text) * 2)
P = {p.get("id"): p for p in r.findall("part")}
for item in spec.split(";"):
    pid, bar, staff, on = item.split(":")
    m = next(x for x in P[pid].findall("measure") if x.get("number") == bar)
    div = None
    for x in P[pid].iter("divisions"): div = int(x.text)
    pos = 0; last = 0; hits = []
    for e in m:
        if e.tag == "backup": pos -= int(e.findtext("duration"))
        elif e.tag == "forward": pos += int(e.findtext("duration"))
        elif e.tag == "note":
            ch = e.find("chord") is not None; g = e.find("grace") is not None
            o = last if ch else pos
            if (e.findtext("staff") or "1") == staff and not g and F(o, div) >= F(on) and not ch: hits.append((o, e))
            if not ch and not g: last = pos; pos += int(e.findtext("duration") or 0)
    hits = [h for h in sorted(hits, key=lambda x: x[0])][:3]
    assert [h[1].findtext("type") for h in hits] == ["32nd", "32nd", "16th"], (item, [h[1].findtext("type") for h in hits])
    d64 = div // 16
    for k, (o, n) in enumerate(hits):
        n.find("duration").text = str(d64 if k < 2 else 6 * d64)
        n.find("type").text = "64th" if k < 2 else "16th"
        if k == 2 and n.find("dot") is None:
            kids = list(n); j = kids.index(n.find("type")) + 1; n.insert(j, ET.Element("dot"))
ET.indent(t, space="  ")
open(OUT, "w").write(head + ET.tostring(r, encoding="unicode"))
print("64ths fixed", spec)
