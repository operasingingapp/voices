"""Last touches: tie stops on the sung lines, accidentals the sung lines need, and checks."""
import sys
import xml.etree.ElementTree as ET
from build import parse

P, OUT = sys.argv[1], sys.argv[2]
head = open(P).read().split("<score-partwise", 1)[0]
t = ET.parse(P)
r = t.getroot()
SHARPS = ["F", "C", "G", "D", "A", "E", "B"]
ACC = {1: "sharp", 0: "natural", -1: "flat"}


def keyalt(f):
    return {s: (1 if f > 0 and s in SHARPS[:f] else -1 if f < 0 and s in SHARPS[::-1][:-f] else 0) for s in "CDEFGAB"}


def pitch(n):
    return (n.findtext("pitch/step"), n.findtext("pitch/octave"), int(float(n.findtext("pitch/alter") or 0)))


problems = []
for part in r.findall("part"):
    pid = part.get("id")
    # ties on the sung lines: the next sung note takes the stop
    if pid in ("P1", "P2"):
        notes = [n for n in part.iter("note") if n.find("pitch") is not None and n.find("grace") is None]
        for i, n in enumerate(notes):
            if any(x.get("type") == "start" for x in n.findall("tie")):
                nxt = notes[i + 1]
                if pitch(nxt) != pitch(n):
                    problems.append(f"{pid}: tie from {pitch(n)} to {pitch(nxt)}")
                if not any(x.get("type") == "stop" for x in nxt.findall("tie")):
                    kids = list(nxt)
                    j = kids.index(nxt.find("duration")) + 1
                    nxt.insert(j, ET.Element("tie", type="stop"))
                    nt = nxt.find("notations")
                    if nt is None:
                        nt = ET.SubElement(nxt, "notations")
                    nt.insert(0, ET.Element("tied", type="stop"))
    # melismas: a slur from the sung syllable over the notes that carry no new syllable (as printed)
    if pid in ("P1", "P2"):
        seq = [n for n in part.iter("note") if n.find("grace") is None]
        i = 0
        while i < len(seq):
            n = seq[i]
            if n.find("pitch") is not None and n.find("lyric") is not None:
                j = i
                while (j + 1 < len(seq) and seq[j + 1].find("pitch") is not None and seq[j + 1].find("lyric") is None):
                    j += 1
                # notes only tied on (same pitch) need no slur
                tied_only = all(any(x.get("type") == "stop" for x in seq[k].findall("tie")) for k in range(i + 1, j + 1))
                if j > i and n.find("lyric/syllabic") is not None and n.findtext("lyric/syllabic") in ("single", "end") and n.find("lyric/extend") is None:
                    ET.SubElement(n.find("lyric"), "extend", type="start")
                if j > i and not tied_only:
                    for nn, ty in ((n, "start"), (seq[j], "stop")):
                        nt = nn.find("notations")
                        if nt is None:
                            nt = ET.SubElement(nn, "notations")
                        ET.SubElement(nt, "slur", type=ty, number="1")
                i = j + 1
            else:
                i += 1
    # accidentals the sung lines need (the piano keeps the signs read from the page)
    fifths = 0
    for m in part.findall("measure"):
        k = m.find("attributes/key/fifths")
        if k is not None:
            fifths = int(k.text)
        if pid not in ("P1", "P2"):
            continue
        ka = keyalt(fifths)
        state = {}
        for n in m.iter("note"):
            if n.find("pitch") is None:
                continue
            st, o, alt = pitch(n)
            cur = state.get((st, o), ka[st])
            tied_in = any(x.get("type") == "stop" for x in n.findall("tie"))
            a = n.find("accidental")
            if alt != cur and not tied_in:
                if a is None:
                    a = ET.Element("accidental")
                    kids = list(n)
                    j = max(i for i, x in enumerate(kids) if x.tag in ("type", "dot")) + 1
                    n.insert(j, a)
                a.text = ACC[alt]
            elif a is not None and not n.get("_keep"):
                n.remove(a)
            state[(st, o)] = alt

# <tie> (sound) must agree with <tied> (drawing) on every note
for n in r.iter("note"):
    nt = n.find("notations")
    drawn = {x.get("type") for x in nt.findall("tied")} if nt is not None else set()
    sound = {x.get("type") for x in n.findall("tie")}
    for ty in ("stop", "start"):
        if ty in drawn and ty not in sound:
            kids = list(n)
            j = kids.index(n.find("duration")) + 1 if n.find("duration") is not None else 0
            if ty == "start" and "stop" in sound:
                j = [i for i, x in enumerate(list(n)) if x.tag == "tie"][-1] + 1
            n.insert(j, ET.Element("tie", type=ty))
            sound.add(ty)
        if ty in sound and ty not in drawn:
            if nt is None:
                nt = ET.SubElement(n, "notations")
            nt.insert(0 if ty == "stop" else len([x for x in nt if x.tag == "tied"]), ET.Element("tied", type=ty))
    # no duplicate drawn ties
    if nt is not None:
        seen = set()
        for x in list(nt.findall("tied")):
            if x.get("type") in seen:
                nt.remove(x)
            seen.add(x.get("type"))
    # order: stop before start
    ties = [x for x in n.findall("tie")]
    if len(ties) == 2 and ties[0].get("type") == "start":
        i = list(n).index(ties[0])
        n.remove(ties[1]); n.insert(i, ties[1])

# checks: every bar of every part and staff is full; ties close
for part in r.findall("part"):
    for m in part.findall("measure"):
        evs = parse(m)
        tot = {}
        for e in evs:
            if e.is_note and e.el.find("chord") is None and not e.grace:
                k = (e.staff, e.voice)
                tot[k] = max(tot.get(k, 0), e.onset + e.dur)
        for k, v in tot.items():
            if v > 96:
                problems.append(f"{part.get('id')} bar {m.get('number')} staff/voice {k}: ends at {v / 24} quarters")
        main = [v for (s, vv), v in tot.items() if vv in (1, 5)]
        if any(v != 96 for v in main):
            problems.append(f"{part.get('id')} bar {m.get('number')}: main voice length {[v / 24 for v in main]}")
opens = {}
for part in r.findall("part"):
    for m in part.findall("measure"):
        for n in m.iter("note"):
            if n.find("pitch") is None:
                continue
            key = (part.get("id"), n.findtext("staff"), pitch(n))
            ty = [x.get("type") for x in n.findall("tie")]
            if "stop" in ty:
                if key in opens:
                    opens.pop(key)
                else:
                    problems.append(f"tie stop without start {key} bar {m.get('number')}")
            if "start" in ty:
                if key in opens:
                    problems.append(f"tie restarted without stop {key} bar {m.get('number')}")
                opens[key] = m.get("number")
for k, b in opens.items():
    problems.append(f"tie left open {k} from bar {b}")

for n in r.iter("note"):
    n.attrib.pop("_keep", None)
ET.indent(t, space="  ")
with open(OUT, "wb") as f:
    f.write(head.encode())
    t.write(f, encoding="utf-8", xml_declaration=False)
print("\n".join(problems) if problems else "no problems")
