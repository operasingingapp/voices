"""fixscore.py SCORE.musicxml : make an OpenScore song file pass the app's importer, without changing what is played.

- a short first bar (a pickup) is marked implicit;
- a part shorter than the others in a bar (an empty voice bar) is filled with silence (<forward>);
- a bar whose length is not its time signature's (MuseScore's irregular bars: a cadenza, a final half bar) gets
  its own time signature, and the old one comes back in the next bar;
- cue notes (an ossia, a cue from another part) become silence;
- a tie that never arrives (tied into nothing, or into another voice) is taken off: the note is held as written.
Prints what it changed. Safe to run again.
"""
import sys, copy
import xml.etree.ElementTree as ET
from fractions import Fraction as F

path = sys.argv[1]
raw = open(path, encoding="utf-8").read()
i = raw.index("<score-partwise")
head, root = raw[:i], ET.fromstring(raw[i:])
parts = root.findall("part")
log = []

def walk(m, div):
    """notes with (start, end, pitch, voice, staff) in quarters, and the bar's length"""
    pos = F(0); mx = F(0); out = []; last_start = F(0)
    for el in m:
        if el.tag == "attributes" and el.findtext("divisions"):
            div[0] = int(el.findtext("divisions"))
        if el.tag == "note":
            d = F(int(el.findtext("duration") or 0), div[0])
            if el.find("grace") is not None:
                continue
            if el.find("chord") is not None:
                start = last_start
            else:
                start = pos; last_start = pos; pos += d
            out.append((el, start, start + d))
            mx = max(mx, pos)
        elif el.tag == "backup":
            pos -= F(int(el.findtext("duration")), div[0])
        elif el.tag == "forward":
            pos += F(int(el.findtext("duration")), div[0]); mx = max(mx, pos)
    return out, mx

# cue notes (an ossia, a cue from the other part) are not sung: each becomes the silence it takes up
for p in parts:
    for m in p.findall("measure"):
        for k, el in enumerate(list(m)):
            if el.tag == "note" and el.find("cue") is not None:
                idx = list(m).index(el)
                m.remove(el)
                if el.find("chord") is None and el.find("grace") is None:
                    f = ET.Element("forward"); ET.SubElement(f, "duration").text = el.findtext("duration") or "0"
                    m.insert(idx, f)
                log.append(f"bar {m.get('number')}: cue note in part {p.get('id')} made silent")

# bar lengths and time signatures
nbars = len(parts[0].findall("measure"))
divs = {p.get("id"): [1] for p in parts}
lengths = []
times = []
cur_time = None
for bi in range(nbars):
    row = {}
    for p in parts:
        m = p.findall("measure")[bi]
        t = m.find("attributes/time")
        if t is not None and p is parts[0]:
            cur_time = (int(t.findtext("beats")), int(t.findtext("beat-type")))
        _, mx = walk(m, divs[p.get("id")])
        row[p.get("id")] = mx
    lengths.append(row)
    times.append(cur_time)

divs = {p.get("id"): [1] for p in parts}
for bi in range(nbars):
    L = max(lengths[bi].values())
    exp = F(times[bi][0] * 4, times[bi][1])
    for p in parts:
        m = p.findall("measure")[bi]
        for el in m:  # keep each part's divisions current
            if el.tag == "attributes" and el.findtext("divisions"):
                divs[p.get("id")][0] = int(el.findtext("divisions"))
        short = L - lengths[bi][p.get("id")]
        if short > 0:
            # fill from the bar's end position: back to 0 then forward the whole bar is simplest
            _, mx = walk(m, [divs[p.get("id")][0]])
            f = ET.SubElement(m, "forward")
            ET.SubElement(f, "duration").text = str(int(short * divs[p.get("id")][0]))
            log.append(f"bar {m.get('number')}: part {p.get('id')} filled with {short} quarters of silence")
    if L != exp:
        if bi == 0 and L < exp:
            for p in parts:
                p.findall("measure")[0].set("implicit", "yes")
            log.append(f"bar 1: pickup of {L} quarters marked implicit")
            continue
        q = L
        den = 4
        while (q * den / 4).denominator != 1:
            den *= 2
        beats = int(q * den / 4)
        for p in parts:
            m = p.findall("measure")[bi]
            a = m.find("attributes")
            if a is None:
                a = ET.Element("attributes"); m.insert(0, a)
            t = a.find("time")
            if t is None:
                t = ET.Element("time")
                kids = list(a); idx = next((k for k, e in enumerate(kids) if e.tag in ("staves", "part-symbol", "instruments", "clef", "staff-details", "transpose", "directive", "measure-style")), len(kids))
                a.insert(idx, t)
            for c in list(t): t.remove(c)
            t.set("print-object", "no")
            ET.SubElement(t, "beats").text = str(beats); ET.SubElement(t, "beat-type").text = str(den)
            if bi + 1 < nbars:
                n = p.findall("measure")[bi + 1]
                if n.find("attributes/time") is None:
                    na = n.find("attributes")
                    if na is None:
                        na = ET.Element("attributes"); n.insert(0, na)
                    nt = ET.Element("time"); nt.set("print-object", "no")
                    ET.SubElement(nt, "beats").text = str(times[bi][0]); ET.SubElement(nt, "beat-type").text = str(times[bi][1])
                    kids = list(na); idx = next((k for k, e in enumerate(kids) if e.tag in ("staves", "part-symbol", "instruments", "clef", "staff-details", "transpose", "directive", "measure-style")), len(kids))
                    na.insert(idx, nt)
        log.append(f"bar {parts[0].findall('measure')[bi].get('number')}: {L} quarters, given its own time {beats}/{den}")

# ties that never arrive
for p in parts:
    div = [1]
    flat = []
    for bi, m in enumerate(p.findall("measure")):
        notes, _ = walk(m, div)
        off = sum(max(lengths[k].values()) for k in range(bi))
        for el, s, e in notes:
            pitch = el.find("pitch")
            if pitch is None:
                continue
            key = (pitch.findtext("step"), pitch.findtext("alter") or "0", pitch.findtext("octave"))
            flat.append((el, off + s, off + e, key))
    starts = [(el, s, e, k) for el, s, e, k in flat if any(t.get("type") == "start" for t in el.findall("tie"))]
    for el, s, e, k in starts:
        ok = any(k2 == k and s2 == e and any(t.get("type") == "stop" for t in el2.findall("tie")) for el2, s2, e2, k2 in flat)
        if not ok:
            for t in el.findall("tie"):
                if t.get("type") == "start": el.remove(t)
            for nt in el.findall("notations"):
                for t in nt.findall("tied"):
                    if t.get("type") == "start": nt.remove(t)
            log.append(f"part {p.get('id')}: tie from a note at quarter {float(s)} into nothing taken off")

if log:
    open(path, "w", encoding="utf-8").write(head + ET.tostring(root, encoding="unicode"))
print(path.split("/")[-2], "|", "; ".join(log) if log else "nothing to fix")
