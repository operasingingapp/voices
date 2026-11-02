"""cutbars.py IN OUT FIRST LAST TITLE : keep bars FIRST..LAST, renumber from 1, carry divisions/key/time/clefs into the new bar 1."""
import sys, copy, xml.etree.ElementTree as ET
IN, OUT, A, B, TITLE = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), sys.argv[5]
head = open(IN).read().split("<score-partwise", 1)[0]
t = ET.parse(IN); r = t.getroot()
for wt in r.iter("work-title"): wt.text = TITLE
for mt in r.iter("movement-title"): mt.text = TITLE
for p in r.findall("part"):
    st = {"divisions": None, "key": None, "time": None, "staves": None, "clef": {}}
    for m in list(p.findall("measure")):
        n = int(m.get("number"))
        if n < A:
            for at in m.findall("attributes"):
                for k in ("divisions", "key", "time", "staves"):
                    if at.find(k) is not None: st[k] = copy.deepcopy(at.find(k))
                for c in at.findall("clef"): st["clef"][c.get("number", "1")] = copy.deepcopy(c)
            # clef changes inside the bar also count
            p.remove(m); continue
        if n > B: p.remove(m); continue
        if n == A:
            at = m.find("attributes")
            if at is None: at = ET.Element("attributes"); m.insert(0, at)
            order = ["divisions", "key", "time", "staves"]
            for k in reversed(order):
                if at.find(k) is None and st[k] is not None: at.insert(0, st[k])
            have = {c.get("number", "1") for c in at.findall("clef")}
            for num, c in sorted(st["clef"].items()):
                if num not in have: at.append(c)
            # MusicXML order inside attributes
            kids = list(at); rank = {"divisions": 0, "key": 1, "time": 2, "staves": 3, "clef": 5}
            for k in kids: at.remove(k)
            for k in sorted(kids, key=lambda e: rank.get(e.tag, 9)): at.append(k)
        m.set("number", str(n - A + 1))
        for pr in m.findall("print"):
            if n == A: m.remove(pr)
ET.indent(t, space="  ")
with open(OUT, "wb") as o: o.write(head.encode()); t.write(o, encoding="utf-8", xml_declaration=False)
print("ok", OUT, B - A + 1, "bars")
