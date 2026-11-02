"""Find notes whose pitch needs an accidental by the rules (key + earlier in the bar, same staff and octave) but show none.
usage: reqacc.py FILE [--fix OUT]"""
import sys, xml.etree.ElementTree as ET
SH = "FCGDAEB"
ACC = {1: "sharp", -1: "flat", 0: "natural", 2: "double-sharp", -2: "flat-flat"}
f = sys.argv[1]; fix = sys.argv[3] if len(sys.argv) > 3 and sys.argv[2] == "--fix" else None
head = open(f).read().split("<score-partwise", 1)[0]
t = ET.parse(f); r = t.getroot(); out = []
names = {sp.get("id"): sp.findtext("part-name") for sp in r.iter("score-part")}
for p in r.findall("part"):
    fifths = 0
    for m in p.findall("measure"):
        k = m.find("attributes/key/fifths")
        if k is not None: fifths = int(k.text)
        ka = {s: (1 if fifths > 0 and s in SH[:fifths] else -1 if fifths < 0 and s in SH[::-1][:-fifths] else 0) for s in "ABCDEFG"}
        state = {}
        for n in m.iter("note"):
            pe = n.find("pitch")
            if pe is None: continue
            st, o = pe.findtext("step"), pe.findtext("octave"); alt = int(float(pe.findtext("alter") or 0))
            key = (n.findtext("staff") or "1", st, o)
            cur = state.get(key, ka[st])
            tied_in = any(x.get("type") == "stop" for x in n.findall("tie"))
            if alt != cur and not tied_in and n.find("accidental") is None:
                out.append((names.get(p.get("id")), m.get("number"), n.findtext("staff"), st + o, ACC[alt]))
                if fix:
                    a = ET.Element("accidental"); a.text = ACC[alt]
                    kids = list(n); j = max(i for i, x in enumerate(kids) if x.tag in ("type", "dot", "voice")) + 1; n.insert(j, a)
            state[key] = alt
for x in out: print(*x)
print("#", len(out), "missing required accidentals", file=sys.stderr)
if fix:
    ET.indent(t, space="  ")
    with open(fix, "wb") as o: o.write(head.encode()); t.write(o, encoding="utf-8", xml_declaration=False)
