"""cut.py IN OUT FIRST LAST KEEP(part ids) TITLE TEMPO: a section of the finale as its own score, bars renumbered from 1"""
import sys, copy, xml.etree.ElementTree as ET
IN, OUT, A, B, KEEP, TITLE, TEMPO = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), sys.argv[5].split(","), sys.argv[6], sys.argv[7]
head = open(IN).read().split("<score-partwise", 1)[0].replace('<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">\n', "")
t = ET.parse(IN); r = t.getroot(); r.find("work/work-title").text = TITLE
pl = r.find("part-list")
for sp in list(pl.findall("score-part")):
    if sp.get("id") not in KEEP: pl.remove(sp)
for p in list(r.findall("part")):
    if p.get("id") not in KEEP: r.remove(p); continue
    # state in force at bar A
    key = time = clefs = None; staves = None; div = None
    for m in p.findall("measure"):
        if int(m.get("number")) > A: break
        for at in m.findall("attributes"):
            if at.find("divisions") is not None: div = at.find("divisions")
            if at.find("key") is not None: key = at.find("key")
            if at.find("time") is not None: time = at.find("time")
            if at.find("staves") is not None: staves = at.find("staves")
            cl = at.findall("clef")
            if cl: clefs = {c.get("number"): c for c in cl} if clefs is None else {**clefs, **{c.get("number"): c for c in cl}}
    for m in list(p.findall("measure")):
        n = int(m.get("number"))
        if n < A or n > B: p.remove(m); continue
        m.set("number", str(n - A + 1))
        if n == A:
            at = m.find("attributes")
            if at is None: at = ET.Element("attributes"); m.insert(0, at)
            for e in list(at): at.remove(e)
            for e in [div, key, time, staves] + list((clefs or {}).values()):
                if e is not None: at.append(copy.deepcopy(e))
    for m in p.findall("measure"):
        if m.get("implicit"): del m.attrib["implicit"]
# keep piano last, renumber ids P1..
ids = [sp.get("id") for sp in pl.findall("score-part")]
ren = {old: f"P{k+1}" for k, old in enumerate(ids)}
for sp in pl.findall("score-part"): sp.set("id", ren[sp.get("id")])
for p in r.findall("part"): p.set("id", ren[p.get("id")])
# tempo on the first bar of the last part (piano)
pno = r.findall("part")[-1]; m = pno.find("measure")
ds = [d for d in m.findall("direction") if d.findtext("direction-type/words")]
if ds:
    s = ds[0].find("sound") or ET.SubElement(ds[0], "sound"); s.set("tempo", TEMPO)
else:
    d = ET.Element("direction", placement="above"); ET.SubElement(ET.SubElement(d, "direction-type"), "words").text = ""
    ET.SubElement(d, "sound", tempo=TEMPO); kids = list(m); j = next(i for i, x in enumerate(kids) if x.tag == "note"); m.insert(j, d)
ET.indent(t, space="  ")
with open(OUT, "wb") as o: o.write(head.encode()); t.write(o, encoding="utf-8", xml_declaration=False)
print(OUT, B - A + 1, "bars", ren)
