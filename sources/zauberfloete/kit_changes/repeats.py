"""repeats.py IN.xml OUT.xml SPEC : repeat barlines and volta endings on every part.
SPEC, ';'-separated:  fwd:BAR          forward repeat at the start of BAR
                      back:BAR:TIMES   backward repeat at the end of BAR, played TIMES times in all
                      end:A-B:1,2      volta ending over bars A..B, numbers 1,2 (the ending's last bar gets the stop;
                                       a final ending with no backward repeat gets type discontinue)"""
import sys, xml.etree.ElementTree as ET
IN, OUT, SPEC = sys.argv[1:4]
head = open(IN).read().split("<score-partwise", 1)[0]
t = ET.parse(IN); r = t.getroot()
backs = {}
items = [x.split(":") for x in SPEC.split(";") if x]
for it in items:
    if it[0] == "back": backs[int(it[1])] = it[2]
def bl(m, loc):
    for x in m.findall("barline"):
        if x.get("location") == loc: return x
    x = ET.Element("barline", location=loc)
    if loc == "left":
        kids = list(m); j = 0
        while j < len(kids) and kids[j].tag in ("print",): j += 1
        m.insert(j, x)
    else: m.append(x)
    return x
def order(x):  # bar-style, ending, repeat
    rank = {"bar-style": 0, "ending": 1, "repeat": 2}
    kids = sorted(list(x), key=lambda e: rank.get(e.tag, 3))
    for k in list(x): x.remove(k)
    for k in kids: x.append(k)
for p in r.findall("part"):
    M = {int(m.get("number")): m for m in p.findall("measure")}
    for it in items:
        if it[0] == "fwd":
            x = bl(M[int(it[1])], "left")
            ET.SubElement(x, "bar-style").text = "heavy-light"; ET.SubElement(x, "repeat", direction="forward"); order(x)
        elif it[0] == "back":
            x = bl(M[int(it[1])], "right")
            for e in x.findall("bar-style"): x.remove(e)
            ET.SubElement(x, "bar-style").text = "light-heavy"; ET.SubElement(x, "repeat", direction="backward", times=it[2]); order(x)
        elif it[0] == "end":
            a, b = map(int, it[1].split("-")); nums = it[2]
            x = bl(M[a], "left"); ET.SubElement(x, "ending", number=nums, type="start"); order(x)
            y = bl(M[b], "right"); ET.SubElement(y, "ending", number=nums, type="stop" if b in backs else "discontinue"); order(y)
t.write(OUT, encoding="unicode")
s = open(OUT).read(); open(OUT, "w").write(head + s if not s.startswith("<?xml") else s)
