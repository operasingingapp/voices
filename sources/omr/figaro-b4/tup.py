"""Add <tuplet> start/stop to runs of triplet notes (time-modification 3:2), three by three per voice;
the '3' is shown only in the bars listed (as printed), elsewhere the grouping is implied.
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
        for ns in byv.values():
            run = []
            def flush():
                for k in range(0, len(run) - len(run) % 3, 3):
                    for n, ty in ((run[k], "start"), (run[k + 2], "stop")):
                        nt = n.find("notations")
                        if nt is None: nt = ET.SubElement(n, "notations")
                        if any(x.get("type") == ty for x in nt.findall("tuplet")): continue
                        tp = ET.SubElement(nt, "tuplet", type=ty, bracket="no")
                        if ty == "start": tp.set("show-number", "actual" if m.get("number") in show else "none")
                run.clear()
            for n in ns:
                tm = n.find("time-modification")
                if tm is not None and tm.findtext("actual-notes") == "3": run.append(n)
                else: flush()
            flush()
ET.indent(t, space="  ")
with open(OUT, "wb") as o: o.write(head.encode()); t.write(o, encoding="utf-8", xml_declaration=False)
print("ok")
