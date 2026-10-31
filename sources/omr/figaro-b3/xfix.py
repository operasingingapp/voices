"""Small fixes on a delivered MusicXML. usage: xfix.py IN OUT FIXES.txt
lines:  dyn PARTID BAR STAFF ONSET KIND        add a dynamic (onset in quarters)
        movedyn PARTID BAR KIND NEWONSET        move that dynamic in the bar to NEWONSET
        acc PARTID BAR STAFF ONSET STEPOCT SIGN  show a printed accidental on that note"""
import sys, xml.etree.ElementTree as ET
from fractions import Fraction
IN, OUT, FX = sys.argv[1:4]
head = open(IN).read().split("<score-partwise", 1)[0]
t = ET.parse(IN); r = t.getroot()
P = {p.get("id"): p for p in r.findall("part")}
def meas(pid, b): return next(m for m in P[pid].findall("measure") if m.get("number") == str(b))
def divs(pid, b):
    d = None
    for m in P[pid].findall("measure"):
        x = m.find("attributes/divisions")
        if x is not None: d = int(x.text)
        if m.get("number") == str(b): return d
def notes(m):
    pos = 0; last = 0; out = []
    for e in m:
        if e.tag == "backup": pos -= int(e.findtext("duration"))
        elif e.tag == "forward": pos += int(e.findtext("duration"))
        elif e.tag == "note":
            on = last if e.find("chord") is not None else pos
            if e.find("chord") is None and e.find("grace") is None: last = pos; pos += int(e.findtext("duration"))
            out.append((on, e))
    return out, pos
def place(m, q, el, staff):
    _, end = notes(m)
    # append at the end of the measure, stepping back to the onset
    if end > q: b = ET.SubElement(m, "backup"); ET.SubElement(b, "duration").text = str(end - q)
    if staff: ET.SubElement(el, "staff").text = str(staff)
    m.append(el)
    if end > q: f = ET.SubElement(m, "forward"); ET.SubElement(f, "duration").text = str(end - q)
def dynel(kind):
    d = ET.Element("direction", placement="below"); dt = ET.SubElement(d, "direction-type")
    ET.SubElement(ET.SubElement(dt, "dynamics"), kind); return d
for line in open(FX):
    w = line.split()
    if not w or w[0].startswith("#"): continue
    op = w[0]
    if op == "dyn":
        pid, b, st, on, kind = w[1], int(w[2]), w[3], w[4], w[5]
        m = meas(pid, b); q = int(Fraction(on) * divs(pid, b))
        place(m, q, dynel(kind), None if st == "-" else st)
    elif op == "movedyn":
        pid, b, kind, on = w[1], int(w[2]), w[3], w[4]
        m = meas(pid, b); q = int(Fraction(on) * divs(pid, b))
        d = next(x for x in m.findall("direction") if x.find(f"direction-type/dynamics/{kind}") is not None)
        st = d.findtext("staff"); m.remove(d)
        for s in d.findall("staff"): d.remove(s)
        # clean any dangling backup/forward pair left around it is harmless (zero net); just re-place
        place(m, q, d, st)
    elif op == "acc":
        pid, b, st, on, so, sign = w[1], int(w[2]), w[3], w[4], w[5], w[6]
        m = meas(pid, b); q = None if on == "*" else int(Fraction(on) * divs(pid, b))
        c = [n for o, n in notes(m)[0] if (q is None or o == q) and n.find("pitch") is not None and (st == "-" or n.findtext("staff") == st)
             and n.findtext("pitch/step") + n.findtext("pitch/octave") == so]
        if not c: raise SystemExit(f"no {so} at {pid} {b} {on}")
        n = c[0]; a = n.find("accidental")
        if a is None:
            a = ET.Element("accidental"); kids = list(n)
            j = max(i for i, x in enumerate(kids) if x.tag in ("type", "dot", "voice")) + 1; n.insert(j, a)
        a.text = sign
ET.indent(t, space="  ")
with open(OUT, "wb") as o: o.write(head.encode()); t.write(o, encoding="utf-8", xml_declaration=False)
print("ok", OUT)
