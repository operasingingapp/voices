"""Find notes whose pitch needs an accidental by the rules (key + earlier in the bar, same staff and octave) but show none.
usage: reqacc.py FILE [--fix OUT]"""
import sys, xml.etree.ElementTree as ET
SH = "FCGDAEB"
ACC = {1: "sharp", -1: "flat", 0: "natural", 2: "double-sharp", -2: "flat-flat"}
f = sys.argv[1]; fix = sys.argv[3] if len(sys.argv) > 3 and sys.argv[2] == "--fix" else None
head = open(f).read().split("<score-partwise", 1)[0]
t = ET.parse(f); r = t.getroot(); out = []
names = {sp.get("id"): sp.findtext("part-name") for sp in r.iter("score-part")}
for p in r.findall("part"):
    fifths = 0
    for m in p.findall("measure"):
        k = m.find("attributes/key/fifths")
        if k is not None: fifths = int(k.text)
        ka = {s: (1 if fifths > 0 and s in SH[:fifths] else -1 if fifths < 0 and s in SH[::-1][:-fifths] else 0) for s in "ABCDEFG"}
        state = {}
        # notes in time order (voices are written one after another in the file)
        evs = []; pos = 0; last = 0
        for e in m:
            if e.tag == "backup": pos -= int(e.findtext("duration"))
            elif e.tag == "forward": pos += int(e.findtext("duration"))
            elif e.tag == "note":
                ch = e.find("chord") is not None; g = e.find("grace") is not None
                on = last if ch else pos
                evs.append((on, 0 if g else 1, len(evs), e))
                if not ch and not g: last = pos; pos += int(e.findtext("duration") or 0)
        shown = set()
        for on, _, _, n in sorted(evs, key=lambda x: (x[0], x[1], x[2])):
            pe = n.find("pitch")
            if pe is None or n.findtext("notehead") == "x": continue
            st, o = pe.findtext("step"), pe.findtext("octave"); alt = int(float(pe.findtext("alter") or 0))
            key = (n.findtext("staff") or "1", st, o)
            cur = state.get(key, ka[st])
            tied_in = any(x.get("type") == "stop" for x in n.findall("tie"))
            if n.find("accidental") is not None: shown.add((key, on, alt))
            if alt != cur and not tied_in and n.find("accidental") is None and (key, on, alt) not in shown:
                out.append((names.get(p.get("id")), m.get("number"), n.findtext("staff"), st + o, ACC[alt]))
                if fix:
                    a = ET.Element("accidental"); a.text = ACC[alt]
                    kids = list(n); j = max(i for i, x in enumerate(kids) if x.tag in ("type", "dot", "voice")) + 1; n.insert(j, a)
                shown.add((key, on, alt))
            state[key] = alt
for x in out: print(*x)
print("#", len(out), "missing required accidentals", file=sys.stderr)
if fix:
    ET.indent(t, space="  ")
    with open(fix, "wb") as o: o.write(head.encode()); t.write(o, encoding="utf-8", xml_declaration=False)
