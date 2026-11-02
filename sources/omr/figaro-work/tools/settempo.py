"""settempo.py SCORE "BAR:QPM;BAR:QPM" : add <sound tempo> (quarters per minute) to the tempo-word direction of those bars."""
import sys, xml.etree.ElementTree as ET
f, spec = sys.argv[1], sys.argv[2]
head = open(f).read().split("<score-partwise", 1)[0]
t = ET.parse(f); r = t.getroot()
want = {int(a): b for a, b in (x.split(":") for x in spec.split(";"))}
done = set()
for P in r.findall("part"):
    for m in P.findall("measure"):
        b = int(m.get("number"))
        if b not in want or b in done: continue
        for d in m.findall("direction"):
            if d.find("direction-type/words") is not None and (d.findtext("direction-type/words") or "").strip():
                for s in d.findall("sound"): d.remove(s)
                ET.SubElement(d, "sound", tempo=want[b]); done.add(b); break
for P in r.findall("part")[:1]:
    for m in P.findall("measure"):
        b = int(m.get("number"))
        if b in want and b not in done:
            d = ET.Element("direction"); dt = ET.SubElement(d, "direction-type"); ET.SubElement(dt, "words")
            ET.SubElement(d, "sound", tempo=want[b])
            kids = list(m); i = next((k for k, x in enumerate(kids) if x.tag in ("note", "backup", "forward", "direction")), len(kids))
            m.insert(i, d); done.add(b)
ET.indent(t, space="  ")
open(f, "w").write(head + ET.tostring(r, encoding="unicode"))
print("tempo set", sorted(done))
