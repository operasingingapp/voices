"""Last touches: tie stops on the sung lines, accidentals the sung lines need, and checks."""
import sys
import xml.etree.ElementTree as ET
from n1build import parse

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
VOICE_IDS = [p.get("id") for p in r.findall("part")][:-1]
for part in r.findall("part"):
    pid = part.get("id")
    # ties on the sung lines: the next sung note takes the stop
    if pid in VOICE_IDS:
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
    if pid in VOICE_IDS:
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
                already = n.find("notations/slur[@type='start']") is not None
                if j > i and not tied_only and not already:
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
        if pid not in VOICE_IDS:
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

# the piano: a tie start needs a stop on the next note of the same pitch in the same staff (within two bars)
pno_part = r.findall("part")[-1]
seq = []
for mi, m in enumerate(pno_part.findall("measure")):
    for e in parse(m):
        if e.is_note and e.el.find("pitch") is not None and not e.grace:
            seq.append((mi, e.onset, e))
seq.sort(key=lambda x: (x[0], x[1]))
for k, (mi, on, e) in enumerate(seq):
    n = e.el
    if not any(x.get("type") == "start" for x in n.findall("tie")):
        continue
    for mj, on2, e2 in seq[k + 1:]:
        if mj > mi + 2: break
        if (mj, on2) <= (mi, on) or e2.staff != e.staff: continue
        if pitch(e2.el) == pitch(n):
            if not any(x.get("type") == "stop" for x in e2.el.findall("tie")):
                kids = list(e2.el); d_ = e2.el.find("duration")
                e2.el.insert(kids.index(d_) + 1 if d_ is not None else 0, ET.Element("tie", type="stop"))
                nt_ = e2.el.find("notations")
                if nt_ is None: nt_ = ET.SubElement(e2.el, "notations")
                nt_.insert(0, ET.Element("tied", type="stop"))
            break

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

# the same dynamic printed twice at one place (read from two of the scan's parts): keep one
for part in r.findall("part"):
    for m in part.findall("measure"):
        seen = set()
        for e in parse(m):
            el = e.el
            if el.tag == "direction" and el.find("direction-type/dynamics") is not None:
                key = (tuple(c.tag for c in el.find("direction-type/dynamics")), el.findtext("staff"), e.onset)
                if key in seen:
                    m.remove(el)
                seen.add(key)
# the piano: missing accidentals (a note whose pitch differs from what the key and the bar so far imply gets its sign)
fifths = 0
for m in r.findall("part")[-1].findall("measure"):
    k = m.find("attributes/key/fifths")
    if k is not None: fifths = int(k.text)
    ka = keyalt(fifths); state = {}
    evs = sorted([e for e in parse(m) if e.is_note and e.el.find("pitch") is not None], key=lambda e: (e.onset, e.idx))
    for e in evs:
        n = e.el; st, o, alt = pitch(n); key = (n.findtext("staff"), st, o)
        cur = state.get(key, ka[st])
        tied_in = any(x.get("type") == "stop" for x in n.findall("tie"))
        if alt != cur and not tied_in and n.find("accidental") is None:
            a = ET.Element("accidental"); a.text = ACC.get(alt, "natural")
            kids = list(n); j = max(i for i, x in enumerate(kids) if x.tag in ("type", "dot", "voice")) + 1
            n.insert(j, a)
        state[key] = alt
STAFF_OF = {}
# slurs: a start that is never closed (or is reopened before closing) is dropped
for part in r.findall("part"):
    open_ = {}
    for m in part.findall("measure"):
        for n in m.iter("note"):
            nt = n.find("notations")
            if nt is None: continue
            STAFF_OF[nt] = n.findtext("staff")
            for s_ in nt.findall("slur"):
                num = s_.get("number") or "1"
                if s_.get("type") == "start":
                    if num in open_:
                        old_n, old_s = open_[num]; old_n.remove(old_s)
                    open_[num] = (nt, s_)
                elif s_.get("type") == "stop":
                    if num not in open_:
                        # a piano slur that starts in a rewritten bar (numbered by voice) and ends in a scan bar, or the reverse
                        st = n.findtext("staff")
                        alt = [k for k, (nt0, s0) in open_.items() if k != num and (k == "1" or int(k) >= 7) and nt0 in STAFF_OF and STAFF_OF[nt0] == st]
                        if alt: num = alt[-1]; s_.set("number", num)
                    open_.pop(num, None)
    for nt_, s_ in open_.values(): nt_.remove(s_)
# a rest marked as a whole-bar rest that does not fill the bar (two halves of a bar joined): an ordinary rest
TYPE_OF = {96: "whole", 72: "half", 48: "half", 36: "quarter", 24: "quarter", 12: "eighth", 6: "16th"}
for part in r.findall("part"):
    blen = 96
    for m in part.findall("measure"):
        tm = m.find("attributes/time")
        if tm is not None: blen = 96 * int(tm.findtext("beats")) // int(tm.findtext("beat-type"))
        for n in m.findall("note"):
            rs = n.find("rest")
            if rs is not None and rs.get("measure") == "yes" and int(n.findtext("duration") or 0) < blen:
                del rs.attrib["measure"]
                d = int(n.findtext("duration")); ty = n.find("type")
                if ty is None:
                    ty = ET.Element("type"); kids = list(n); n.insert(kids.index(n.find("voice")) + 1 if n.find("voice") is not None else len(kids), ty)
                ty.text = TYPE_OF.get(d, "half")
                if d in (72, 36) and n.find("dot") is None:
                    n.insert(list(n).index(ty) + 1, ET.Element("dot"))
# a slur or tie drawn twice on one note: keep one
for n in r.iter("note"):
    nt = n.find("notations")
    if nt is None: continue
    seen = set()
    for x in list(nt):
        if x.tag in ("slur", "tied"):
            k = (x.tag, x.get("type"), x.get("number"))
            if k in seen: nt.remove(x)
            seen.add(k)

# checks: every bar of every part and staff is full; ties close
for part in r.findall("part"):
    blen = 96
    for m in part.findall("measure"):
        tm = m.find("attributes/time")
        if tm is not None:
            blen = 96 * int(tm.findtext("beats")) // int(tm.findtext("beat-type"))
        evs = parse(m)
        tot = {}
        for e in evs:
            if e.is_note and e.el.find("chord") is None and not e.grace:
                k = (e.staff, e.voice)
                tot[k] = max(tot.get(k, 0), e.onset + e.dur)
        for k, v in tot.items():
            if v > blen:
                problems.append(f"{part.get('id')} bar {m.get('number')} staff/voice {k}: ends at {v / 24} quarters")
        main = [v for (s, vv), v in tot.items() if vv in (1, 5)]
        if any(v != blen for v in main):
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
                    # a tie that ends without a start (the start was removed as wrong): drop the stop
                    for x in n.findall("tie"):
                        if x.get("type") == "stop": n.remove(x)
                    nt_ = n.find("notations")
                    if nt_ is not None:
                        for x in nt_.findall("tied"):
                            if x.get("type") == "stop": nt_.remove(x)
            if "start" in ty:
                if key in opens:
                    problems.append(f"tie restarted without stop {key} bar {m.get('number')}")
                opens[key] = m.get("number")
# ties still open: find the start note and drop the tie (reported)
for k, b in opens.items():
    problems.append(f"tie left open {k} from bar {b} (dropped)")
    for part in r.findall("part"):
        if part.get("id") != k[0]: continue
        for m in part.findall("measure"):
            if m.get("number") != b: continue
            for n in m.iter("note"):
                if n.find("pitch") is not None and (n.findtext("staff"), pitch(n)) == (k[1], k[2]) and any(x.get("type") == "start" for x in n.findall("tie")):
                    for x in n.findall("tie"):
                        if x.get("type") == "start": n.remove(x)
                    nt_ = n.find("notations")
                    if nt_ is not None:
                        for x in nt_.findall("tied"):
                            if x.get("type") == "start": nt_.remove(x)

for n in r.iter("note"):
    n.attrib.pop("_keep", None)
ET.indent(t, space="  ")
with open(OUT, "wb") as f:
    f.write(head.encode())
    t.write(f, encoding="utf-8", xml_declaration=False)
print("\n".join(problems) if problems else "no problems")
