"""dropwords.py XML RULES : after build.sh, remove or rename text directions, as listed in RULES (one per line):
   drop PART TEXT        remove every word direction TEXT in part PART (P1, P2, ... or * for all)
   rename PART OLD NEW   change word direction OLD to NEW in part PART
   dedupe PART           keep one of each word printed twice in the same bar of part PART (a word put on both piano hands)
Used to drop tempo headings the segs already print and words doubled on the piano."""
import sys, xml.etree.ElementTree as ET
t = ET.parse(sys.argv[1]); r = t.getroot(); n = 0
rules = [l.rstrip("\n").split("\t") for l in open(sys.argv[2]) if l.strip() and not l.startswith("#")]
dd = {ru[1] for ru in rules if ru[0] == "dedupe"}
for p in r.findall("part"):
    for m in p.findall("measure"):
        if p.get("id") in dd:
            seen = set()
            for d in list(m.findall("direction")):
                w = d.find("direction-type/words")
                if w is None: continue
                if w.text in seen: m.remove(d); n += 1
                seen.add(w.text)
        for d in list(m.findall("direction")):
            w = d.find("direction-type/words")
            if w is None: continue
            for ru in rules:
                if ru[0] == "dedupe": continue
                if ru[1] not in ("*", p.get("id")) or w.text != ru[2]: continue
                if ru[0] == "drop": m.remove(d); n += 1; break
                if ru[0] == "rename": w.text = ru[3]; n += 1; break
t.write(sys.argv[1], encoding="UTF-8", xml_declaration=True)
print("dropwords:", n, "changed")
