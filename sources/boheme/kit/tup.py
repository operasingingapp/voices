"""Add <tuplet> start/stop to runs of triplet notes (time-modification 3:2), three by three per voice;
the tuplet number is always shown (the Ricordi score prints it).
usage: tup.py IN OUT [BAR,BAR...]"""
import sys, xml.etree.ElementTree as ET
IN, OUT = sys.argv[1:3]; show = set(sys.argv[3].split(",")) if len(sys.argv) > 3 else set()
head = open(IN).read().split("<score-partwise", 1)[0]
t = ET.parse(IN); r = t.getroot()
for p in r.findall("part"):
    for m in p.findall("measure"):
        byv = {}
        for n in m.findall("note"):
            if n.find("chord") is not None or n.find("grace") is not None: continue
            byv.setdefault((n.findtext("staff"), n.findtext("voice")), []).append(n)
        BASE = {"whole": 4, "half": 2, "quarter": 1, "eighth": 0.5, "16th": 0.25, "32nd": 0.125, "64th": 0.0625}
        divs = 840
        for ns in byv.values():
            # tuplet groups of any ratio n:m: a group closes when its notes fill m notes of the first note's value
            grp = []; key = None; acc = 0; span = 0
            def close():
                if len(grp) >= 2:
                    for n, ty in ((grp[0], "start"), (grp[-1], "stop")):
                        nt = n.find("notations")
                        if nt is None: nt = ET.SubElement(n, "notations")
                        if any(x.get("type") == ty for x in nt.findall("tuplet")): continue
                        tp = ET.SubElement(nt, "tuplet", type=ty, bracket="no")
                        if ty == "start": tp.set("show-number", "actual")  # Ricordi prints every tuplet number
                grp.clear()
            for n in ns:
                tm = n.find("time-modification")
                k = (int(tm.findtext("actual-notes")), int(tm.findtext("normal-notes"))) if tm is not None else None
                if k != key or not grp:
                    close(); key = k; acc = 0
                    if k: span = BASE.get(n.findtext("type"), 0.5) * divs * k[1]
                if not k: continue
                grp.append(n); acc += int(n.findtext("duration") or 0)
                if acc >= span - 1: close(); acc = 0
            close()
ET.indent(t, space="  ")
with open(OUT, "wb") as o: o.write(head.encode()); t.write(o, encoding="utf-8", xml_declaration=False)
print("ok")
