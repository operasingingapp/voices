"""Replace piano bars of a score with bars written in the piano DSL. usage: apply_piano.py IN.xml DSL.txt OUT.xml"""
import sys, copy
import xml.etree.ElementTree as ET
from n1build import Ev, serialize
from piano_dsl import load, notes_for
IN, DSL, OUT = sys.argv[1:4]
head = open(IN).read().split("<score-partwise", 1)[0]
t = ET.parse(IN); r = t.getroot()
P = r.findall("part")[-1]
D = load(DSL)
have = {int(m.get("number")) for m in P.findall("measure")}
D = {b: v for b, v in D.items() if b in have}
for m in P.findall("measure"):
    b = int(m.get("number"))
    if b not in D: continue
    evs = []
    at0 = [c for c in m.findall("attributes")][:1]
    for a in at0:
        a2 = copy.deepcopy(a)
        for c in list(a2):
            if c.tag == "clef": a2.remove(c)
        if len(a2): evs.append(Ev(a2, 0, -2))
    for c in m.findall("direction"):
        if c.find("direction-type/words") is not None and c.find("direction-type/dynamics") is None and (c.findtext("direction-type/words") or "").strip() not in ("cresc.", "dim."):
            evs.append(Ev(copy.deepcopy(c), 0, -1))
    k = 0
    for (hand, v), toks in sorted(D[b].items()):
        staff = 1 if hand == "RH" else 2
        voice = (1 if staff == 1 else 5) + (v - 1)
        items, length = notes_for(toks, staff, voice)
        for on, el in items:
            evs.append(Ev(el, on, k)); k += 1
    for el in el_list if False else []: pass
    for c in list(m): m.remove(c)
    serialize(m, evs)
    for n in m.iter("note"): n.attrib.pop("_acc", None)
ET.indent(t, space="  ")
with open(OUT, "wb") as f:
    f.write(head.encode()); t.write(f, encoding="utf-8", xml_declaration=False)
print("applied", sorted(D)) if D else None
