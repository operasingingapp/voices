"""Remove repeated <tie>/<tied> marks of the same type on one note. usage: dedupe.py FILE"""
import sys, xml.etree.ElementTree as ET
f = sys.argv[1]; head = open(f).read().split("<score-partwise", 1)[0]
t = ET.parse(f); n_ = 0
for n in t.getroot().iter("note"):
    for parent, tag in ((n, "tie"), (n.find("notations"), "tied")):
        if parent is None: continue
        seen = set()
        for x in list(parent.findall(tag)):
            if x.get("type") in seen: parent.remove(x); n_ += 1
            else: seen.add(x.get("type"))
ET.indent(t, space="  ")
with open(f, "wb") as o: o.write(head.encode()); t.write(o, encoding="utf-8", xml_declaration=False)
print("removed", n_)
