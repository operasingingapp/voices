"""Corrections to the built score, each checked on the printed page (see FIXLIST.md)."""
import sys, copy
import xml.etree.ElementTree as ET
from build import parse, serialize, Ev

P = sys.argv[1]
OUT = sys.argv[2]
head = open(P).read().split("<score-partwise", 1)[0]
t = ET.parse(P)
r = t.getroot()
PARTS = {p.get("id"): {int(m.get("number")): m for m in p.findall("measure")} for p in r.findall("part")}
PIANO = PARTS["P3"]
FULL = 96
SHARPS = ["F", "C", "G", "D", "A", "E", "B"]


def name(e):
    if e.find("pitch") is None:
        return "r"
    a = int(float(e.findtext("pitch/alter") or 0))
    return e.findtext("pitch/step") + {1: "#", -1: "b", 0: ""}[a] + e.findtext("pitch/octave")


# 1. key of C from bar 89 in every part (the source states it only at bar 91)
for pid, ms in PARTS.items():
    for b in (89, 91, 99):
        m = ms[b]
        for at in m.findall("attributes"):
            k = at.find("key")
            if k is not None and b in (91, 99):
                at.remove(k)
    m = ms[89]
    at = m.find("attributes")
    if at is None:
        at = ET.Element("attributes")
        m.insert(0, at)
    k = ET.Element("key")
    ET.SubElement(k, "fifths").text = "0"
    # key must come before time/staves/clef
    at.insert(0, k)

# 2. bar 98 piano: nothing tied out of the bar
for n in PIANO[98].iter("note"):
    for x in n.findall("tie"):
        if x.get("type") == "start":
            n.remove(x)
    nt = n.find("notations")
    if nt is not None:
        for x in nt.findall("tied"):
            if x.get("type") == "start":
                nt.remove(x)

# 3. inner voices that start part-way through the bar: they end at the bar line
SHIFT = {2: [2, 4, 9, 19, 21, 23, 25, 26, 30, 37, 39, 49], 1: [9, 10, 11, 12, 13, 14, 30, 31, 32, 33, 49, 50, 51, 52, 56, 58, 67, 69, 71]}
for staff, bars in SHIFT.items():
    for b in bars:
        m = PIANO[b]
        evs = parse(m)
        notes = [e for e in evs if e.is_note and e.staff == staff and not e.grace]
        tot = {}
        for e in notes:
            if e.el.find("chord") is None:
                tot[e.voice] = tot.get(e.voice, 0) + e.dur
        part = [v for v, d in tot.items() if d < FULL]
        assert len(part) == 1, (b, staff, tot)
        v = part[0]
        shift = FULL - tot[v]
        for e in evs:
            if e.is_note and e.staff == staff and e.voice == v:
                e.onset += shift
        serialize(m, evs)

# 4. bar 27 grace notes: slashed eighths
for n in PIANO[27].iter("note"):
    if n.find("grace") is not None and n.findtext("staff") == "1":
        n.find("type").text = "eighth"
        n.find("grace").set("slash", "yes")
        for bm in n.findall("beam"):
            n.remove(bm)


# 5. dynamics
def dyn_events(b):
    evs = parse(PIANO[b])
    return evs, [e for e in evs if e.el.tag == "direction" and e.el.find("direction-type/dynamics") is not None]


def set_dyn(e, value):
    d = e.el.find("direction-type/dynamics")
    for c in list(d):
        d.remove(c)
    if value in ("mfp",):
        ET.SubElement(d, "other-dynamics").text = value
    else:
        ET.SubElement(d, value)


def add_dyn(b, onset, value, staff="1"):
    evs = parse(PIANO[b])
    d = ET.Element("direction", placement="below")
    dt = ET.SubElement(d, "direction-type")
    dy = ET.SubElement(dt, "dynamics")
    if value == "mfp":
        ET.SubElement(dy, "other-dynamics").text = "mfp"
    else:
        ET.SubElement(dy, value)
    ET.SubElement(d, "staff").text = staff
    evs.append(Ev(d, onset, 9999))
    serialize(PIANO[b], evs)


def dyn_at(b):
    evs, ds = dyn_events(b)
    return evs, sorted(ds, key=lambda e: e.onset)


# bar 30: mf on beat 1 (keep the p on beat 3)
add_dyn(30, 0, "mf")
# mf/mp that are mfp
for b, beats in ((51, [0]), (55, [48]), (57, [48]), (64, [0, 48])):
    evs, ds = dyn_at(b)
    for on in beats:
        hit = [e for e in ds if e.onset == on]
        assert hit, (b, on, [(e.onset, ET.tostring(e.el)[:80]) for e in ds])
        set_dyn(hit[0], "mfp")
        for extra in hit[1:]:
            evs.remove(extra)
    serialize(PIANO[b], evs)
# bars 53, 54: the 'p's are triplet figures
for b in (53, 54):
    evs, ds = dyn_at(b)
    for e in ds:
        if e.el.find("direction-type/dynamics/p") is not None:
            evs.remove(e)
    serialize(PIANO[b], evs)
# bar 32: mf + p on one beat is one mfp
evs, ds = dyn_at(32)
by = {}
for e in ds:
    by.setdefault(e.onset, []).append(e)
for on, es in by.items():
    kinds = {c.tag for e in es for c in e.el.find("direction-type/dynamics")}
    if {"mf", "p"} <= kinds:
        set_dyn(es[0], "mfp")
        for e in es[1:]:
            evs.remove(e)
serialize(PIANO[32], evs)


# 6. bar 53: the beat-3 group is a triplet, both hands
def make_triplet(b, staff, start, count=3):
    evs = parse(PIANO[b])
    ns = sorted([e for e in evs if e.is_note and e.staff == staff and e.onset >= start and not e.grace], key=lambda e: (e.onset, e.idx))
    heads = []
    for e in ns:
        if e.onset not in [h.onset for h in heads]:
            heads.append(e)
        if len(heads) == count:
            break
    onsets = [h.onset for h in heads]
    groups = [[x for x in ns if x.onset == on] for on in onsets]
    # what came after the three plain eighths moves up by the time the triplet saves
    after = [e for e in evs if e.is_note and e.staff == staff and e.onset >= onsets[-1] + 12]
    for e in after:
        e.onset -= 12
    for k, grp in enumerate(groups):
        for e in grp:
            e.onset = start + k * 8
            e.el.find("duration").text = "8"
            if e.el.find("time-modification") is None:
                tm = ET.Element("time-modification")
                ET.SubElement(tm, "actual-notes").text = "3"
                ET.SubElement(tm, "normal-notes").text = "2"
                kids = list(e.el)
                i = max(j for j, x in enumerate(kids) if x.tag in ("type", "dot", "accidental")) + 1
                e.el.insert(i, tm)
            if e.el.find("chord") is None and k in (0, 2):
                nt = e.el.find("notations")
                if nt is None:
                    nt = ET.SubElement(e.el, "notations")
                ET.SubElement(nt, "tuplet", type="start" if k == 0 else "stop", bracket="no")
    serialize(PIANO[b], evs)


make_triplet(53, 1, 48)
make_triplet(53, 2, 48)

ET.indent(t, space="  ")
with open(OUT, "wb") as f:
    f.write(head.encode())
    t.write(f, encoding="utf-8", xml_declaration=False)
print("fixes applied")


# 7. ties: bar 97 -> 98 the chords are tied (the stops were missing); 58 -> 59 LH the arc is a slur
def add_tie_stop(n):
    if any(x.get("type") == "stop" for x in n.findall("tie")):
        return
    kids = list(n)
    n.insert(kids.index(n.find("duration")) + 1, ET.Element("tie", type="stop"))
    nt = n.find("notations")
    if nt is None:
        nt = ET.SubElement(n, "notations")
    nt.insert(0, ET.Element("tied", type="stop"))


for n in PIANO[98].iter("note"):
    if n.find("pitch") is not None:
        add_tie_stop(n)


def tie_to_slur(start_bar, staff, start_pitch, stop_bar, stop_pitch):
    def find(b, nm):
        return [n for n in PIANO[b].iter("note") if n.findtext("staff") == staff and name(n) == nm][0]
    a, z = find(start_bar, start_pitch), find(stop_bar, stop_pitch)
    for n, ty in ((a, "start"), (z, "stop")):
        for x in n.findall("tie"):
            n.remove(x)
        nt = n.find("notations")
        if nt is None:
            nt = ET.SubElement(n, "notations")
        for x in nt.findall("tied"):
            nt.remove(x)
        ET.SubElement(nt, "slur", type=ty, number="5")


tie_to_slur(58, "2", "E4", 59, "D4")

ET.indent(t, space="  ")
with open(OUT, "wb") as f:
    f.write(head.encode())
    t.write(f, encoding="utf-8", xml_declaration=False)


# 8. round 2 (full check)
# bar 67: fermata over the sung half note, both singers
for pid in ("P1", "P2"):
    n = [x for x in PARTS[pid][67].iter("note") if x.find("pitch") is not None][0]
    nt = n.find("notations")
    if nt is None:
        nt = ET.SubElement(n, "notations")
    ET.SubElement(nt, "fermata", type="upright")
# bar 68 RH: two slurs in the upper voice (C5-B4, D5-C5 on beats 3-4); the lower D4 is slurred to F#4, not tied
m = PIANO[68]
evs = parse(m)
up = sorted([e for e in evs if e.is_note and e.staff == 1 and e.voice == 1], key=lambda e: e.onset)
lo = sorted([e for e in evs if e.is_note and e.staff == 1 and e.voice == 2], key=lambda e: e.onset)
for e in up + lo:
    nt = e.el.find("notations")
    if nt is not None:
        for x in list(nt):
            if x.tag in ("slur", "tied"):
                nt.remove(x)
    for x in e.el.findall("tie"):
        e.el.remove(x)
def slur(e, ty, num):
    nt = e.el.find("notations")
    if nt is None:
        nt = ET.SubElement(e.el, "notations")
    ET.SubElement(nt, "slur", type=ty, number=num)
on = {e.onset: e for e in up}
slur(on[0], "start", "1"); slur(on[36], "stop", "1"); slur(on[48], "start", "1"); slur(on[84], "stop", "1")
slur(lo[0], "start", "2"); slur(lo[-1], "stop", "2")
serialize(m, evs)
# bars 9 and 49 LH: the bass clef comes after the first eighth (beat 1.5)
for b in (9, 49):
    m = PIANO[b]
    evs = parse(m)
    cl = [e for e in evs if e.el.tag == "attributes" and e.el.find("clef[@number='2']") is not None and e.onset > 0]
    assert len(cl) == 1, (b, [e.onset for e in cl])
    cl[0].onset = 12
    serialize(m, evs)
# bars 23 and 25 LH: the printed '3' is a fingering, not an accent
for b in (23, 25):
    for n in PIANO[b].iter("note"):
        if n.findtext("staff") == "2":
            for ar in n.findall("notations/articulations"):
                for x in ar.findall("strong-accent"):
                    ar.remove(x)
                if len(ar) == 0:
                    n.find("notations").remove(ar)

ET.indent(t, space="  ")
with open(OUT, "wb") as f:
    f.write(head.encode())
    t.write(f, encoding="utf-8", xml_declaration=False)


# 9. round 3
# bar 2 -> 3 LH: the inner G3 is tied, not slurred
tie_to_slur  # (helper exists; here the opposite)
def slur_to_tie(b1, staff, p1, b2, p2):
    a = [n for n in PIANO[b1].iter("note") if n.findtext("staff") == staff and name(n) == p1][-1]
    z = [n for n in PIANO[b2].iter("note") if n.findtext("staff") == staff and name(n) == p2][0]
    for n, ty in ((a, "start"), (z, "stop")):
        nt = n.find("notations")
        if nt is not None:
            for s_ in list(nt.findall("slur")):
                if s_.get("type") == ty:
                    nt.remove(s_)
                    break
        else:
            nt = ET.SubElement(n, "notations")
        kids = list(n)
        n.insert(kids.index(n.find("duration")) + 1, ET.Element("tie", type=ty))
        nt.insert(0, ET.Element("tied", type=ty))
slur_to_tie(2, "2", "G3", 3, "G3")
# bar 15 RH: slur over the first two sixteenths of the lower voice (G5-F#5)
m = PIANO[15]
evs = parse(m)
lo = sorted([e for e in evs if e.is_note and e.staff == 1 and e.voice == 2], key=lambda e: e.onset)
slur(lo[0], "start", "3"); slur(lo[1], "stop", "3")
serialize(m, evs)
# bar 32: mf + p a sixteenth apart are one mfp
evs, ds = dyn_at(32)
mf = [e for e in ds if e.el.find("direction-type/dynamics/mf") is not None]
pp_ = [e for e in ds if e.el.find("direction-type/dynamics/p") is not None and e.onset <= 6]
if mf and pp_:
    set_dyn(mf[0], "mfp")
    evs.remove(pp_[0])
serialize(PIANO[32], evs)
# bar 98 Figaro: the printed (courtesy) natural on E3
n = [x for x in PARTS["P2"][98].iter("note") if x.find("pitch") is not None][0]
acc = ET.Element("accidental"); acc.text = "natural"
kids = list(n); n.insert(max(i for i, x in enumerate(kids) if x.tag in ("type", "dot")) + 1, acc)
n.set("_keep", "1")

ET.indent(t, space="  ")
with open(OUT, "wb") as f:
    f.write(head.encode())
    t.write(f, encoding="utf-8", xml_declaration=False)


# 10. round 4
# bar 107 Figaro: the breath mark printed after "lo"
n = [x for x in PARTS["P2"][107].iter("note") if x.find("lyric") is not None and x.findtext("lyric/text") == "lo"][0]
nt = n.find("notations")
if nt is None:
    nt = ET.SubElement(n, "notations")
ET.SubElement(ET.SubElement(nt, "articulations"), "breath-mark")
# clefs restated without a change (bars 37, 48): drop them
cur_clef = {}
for b in sorted(PIANO):
    for at in PIANO[b].findall("attributes"):
        for c in list(at.findall("clef")):
            k = c.get("number") or "1"
            v = (c.findtext("sign"), c.findtext("line"))
            if b > 1 and cur_clef.get(k) == v:
                at.remove(c)
            cur_clef[k] = v
        if len(at) == 0:
            PIANO[b].remove(at)

ET.indent(t, space="  ")
with open(OUT, "wb") as f:
    f.write(head.encode())
    t.write(f, encoding="utf-8", xml_declaration=False)
