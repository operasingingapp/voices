"""reorder.py FILE "P3,P2,P1,P4,P5" : put the parts in this order (as printed: sopranos on top), ids unchanged."""
import sys, xml.etree.ElementTree as ET
f, order = sys.argv[1], sys.argv[2].split(",")
head = open(f).read().split("<score-partwise", 1)[0].replace('<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">\n', "")
t = ET.parse(f); r = t.getroot(); pl = r.find("part-list")
sps = {sp.get("id"): sp for sp in pl.findall("score-part")}; parts = {p.get("id"): p for p in r.findall("part")}
assert set(order) == set(sps), (order, list(sps))
for sp in sps.values(): pl.remove(sp)
for i in order: pl.append(sps[i])
for p in parts.values(): r.remove(p)
for i in order: r.append(parts[i])
ET.indent(t, space="  ")
open(f, "w").write(head + ET.tostring(r, encoding="unicode"))
print("order", order)
