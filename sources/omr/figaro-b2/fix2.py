"""Apply a list of small fixes to a built score.  usage: fix2.py IN.xml FIXES.txt OUT.xml
Lines (bar numbers are printed bars; onsets in quarters from the start of the bar; PART = singer code S/F/B/M or RH/LH):
  dyn BAR PART ONSET KIND            add a dynamic (p, f, pp, ff, fp, sfp, mf ...)
  nodyn BAR PART KIND                remove that dynamic from the bar
  word BAR PART ONSET TEXT...        add a word direction (cresc., dim. ...)
  clef BAR STAFF ONSET SIGN          piano clef (STAFF 1/2, SIGN G or F) at ONSET
  untie BAR PART STEP OCT            remove a tie start from that note in BAR
  tie BAR PART STEP OCT              add a tie start to that note in BAR (and stop on the next same pitch)
  slur BAR PART ONSET BAR2 ONSET2    slur from the note at ONSET in BAR to the note at ONSET2 in BAR2
  noslur BAR PART ONSET              remove slur starts on the note at ONSET
  stacc BAR PART ONSET / nostacc BAR PART ONSET
  fermata BAR PART ONSET
  lyric BAR PART ONSET TEXT          set the syllable text on that note (keeps syllabic)
"""
import sys, copy
import xml.etree.ElementTree as ET
from fractions import Fraction
IN, FX, OUT = sys.argv[1:4]
head = open(IN).read().split("<score-partwise", 1)[0]
t = ET.parse(IN); r = t.getroot()
parts = r.findall("part")
names = [sp.findtext("part-name") for sp in r.find("part-list").findall("score-part")]
code_of = {"Susanna": "S", "Figaro": "F", "Bartolo": "B", "Marcellina": "M"}
PART = {code_of.get(n, n): p for n, p in zip(names, parts)}
pno = parts[-1]
def meas(part, b):
    for m in part.findall("measure"):
        if m.get("number") == str(b): return m
    raise SystemExit(f"no bar {b}")
def notes_at(part, staff, b):
    m = meas(part, b); pos = 0; last = 0; out = []
    for el in m:
        if el.tag == "backup": pos -= int(el.findtext("duration"))
        elif el.tag == "forward": pos += int(el.findtext("duration"))
        elif el.tag == "note":
            ch = el.find("chord") is not None; on = last if ch else pos
            if not ch:
                last = pos
                if el.find("grace") is None: pos += int(el.findtext("duration") or 0)
            if staff is None or el.findtext("staff") == str(staff): out.append((on, el))
    return m, out
def target(pc):
    if pc in ("RH", "LH"): return pno, 1 if pc == "RH" else 2
    return PART[pc], None
def at(b, pc, onset):
    part, st = target(pc)
    m, ns = notes_at(part, st, b)
    q = int(Fraction(onset) * 24)
    c = [n for o, n in ns if o == q and n.find("pitch") is not None and n.find("grace") is None]
    if not c: raise SystemExit(f"no note at {b} {pc} {onset}")
    return m, c[0], q
def notations(n):
    nt = n.find("notations")
    if nt is None: nt = ET.SubElement(n, "notations")
    return nt
def add_dir(m, q, el, staff=None):
    """put a direction at onset q (in divisions): appended at the end of the bar, reaching q with backup/forward"""
    if staff: ET.SubElement(el, "staff").text = str(staff)
    pos = 0; last = 0
    for c in m:
        if c.tag == "backup": pos -= int(c.findtext("duration"))
        elif c.tag == "forward": pos += int(c.findtext("duration"))
        elif c.tag == "note" and c.find("chord") is None and c.find("grace") is None: pos += int(c.findtext("duration") or 0)
    if pos > q:
        b = ET.SubElement(m, "backup"); ET.SubElement(b, "duration").text = str(pos - q)
    elif pos < q:
        f = ET.SubElement(m, "forward"); ET.SubElement(f, "duration").text = str(q - pos)
    m.append(el)
SLURN = [2]
NEXTN = {2: 3, 3: 4, 4: 5, 5: 6, 6: 14, 14: 15, 15: 16, 16: 3}   # numbers kept free of the piano rewrites' per-voice 7-13
for line in open(FX, encoding="utf-8"):
    line = line.strip()
    if not line or line.startswith("#"): continue
    w = line.split()
    op = w[0]
    if op == "slurx":   # slurx BAR PART ONSET PITCH BAR2 PART2 ONSET2 PITCH2 (e.g. across the piano staves)
        w = [w[0], w[1], w[2], w[3], w[4], w[5], w[7], w[8], w[6]]; op = "slurp"
    if op in ("dyn", "word"):
        b, pc, on = int(w[1]), w[2], w[3]
        part, st = target(pc)
        m = meas(part, b); q = int(Fraction(on) * 24)
        d = ET.Element("direction", placement="above" if pc not in ("RH", "LH") else "below")
        dt = ET.SubElement(d, "direction-type")
        if op == "dyn": ET.SubElement(ET.SubElement(dt, "dynamics"), w[4])
        else: ET.SubElement(dt, "words").text = " ".join(w[4:])
        add_dir(m, q, d, st)
    elif op == "acc":   # acc BAR PART ONSET SIGN: show a printed (reminder) accidental on that note
        _, n1, q = at(int(w[1]), w[2], w[3])
        if len(w) > 5:   # optional pitch, for a chord note: acc BAR PART ONSET SIGN STEPOCT
            part, st = target(w[2]); _, ns = notes_at(part, st, int(w[1]))
            n1 = [n for o, n in ns if o == q and n.find("pitch") is not None and n.findtext("pitch/step") + n.findtext("pitch/octave") == w[5]][0]
        a = n1.find("accidental")
        if a is None:
            a = ET.Element("accidental"); kids = list(n1)
            j = max(i for i, x in enumerate(kids) if x.tag in ("type", "dot", "voice")) + 1; n1.insert(j, a)
        a.text = w[4]; n1.set("_keep", "1")
    elif op == "graceslur":   # graceslur BAR PART ONSET: slur from the grace note(s) before the note at ONSET to it
        part, st = target(w[2]); m, ns = notes_at(part, st, int(w[1])); q = int(Fraction(w[3]) * 24)
        g = [n for o, n in ns if o == q and n.find("grace") is not None]
        main = [n for o, n in ns if o == q and n.find("grace") is None and n.find("pitch") is not None]
        if not g or not main: raise SystemExit(f"no grace at {w[1]} {w[2]} {w[3]}")
        SLURN[0] = NEXTN[SLURN[0]]; num = str(SLURN[0])
        ET.SubElement(notations(g[0]), "slur", type="start", number=num); ET.SubElement(notations(main[0]), "slur", type="stop", number=num)
    elif op == "noword":   # noword BAR PART TEXT
        part, st = target(w[2]); m = meas(part, int(w[1]))
        for d in m.findall("direction"):
            if (d.findtext("direction-type/words") or "").strip() == " ".join(w[3:]) and (st is None or d.findtext("staff") in (str(st), None)):
                m.remove(d); break
    elif op == "nodyn":
        b, pc, kind = int(w[1]), w[2], w[3]
        part, st = target(pc); m = meas(part, b)
        for d in m.findall("direction"):
            dy = d.find("direction-type/dynamics")
            if dy is not None and dy.find(kind) is not None and (st is None or d.findtext("staff") in (str(st), None)):
                m.remove(d); break
    elif op == "clef":
        b, st, on, sign = int(w[1]), int(w[2]), w[3], w[4]
        m = meas(pno, b); q = int(Fraction(on) * 24)
        a = ET.Element("attributes"); c = ET.SubElement(a, "clef", number=str(st))
        ET.SubElement(c, "sign").text = sign; ET.SubElement(c, "line").text = "4" if sign == "F" else "2"
        if q == 0:
            a0 = m.find("attributes")
            if a0 is not None:
                for old in a0.findall("clef"):
                    if old.get("number") == str(st): a0.remove(old)
                a0.append(c)
            else: m.insert(0, a)
        else: add_dir(m, q, a)
    elif op in ("untie", "tie"):
        b, pc, step, octv = int(w[1]), w[2], w[3], w[4]
        part, st = target(pc); m, ns = notes_at(part, st, b)
        for o, n in ns:
            p = n.find("pitch")
            if p is not None and p.findtext("step") == step and p.findtext("octave") == octv:
                if op == "untie":
                    for x in n.findall("tie"):
                        if x.get("type") == "start": n.remove(x)
                    nt = n.find("notations")
                    if nt is not None:
                        for x in nt.findall("tied"):
                            if x.get("type") == "start": nt.remove(x)
                else:
                    ET.SubElement(n, "tie", type="start"); ET.SubElement(notations(n), "tied", type="start")
                break
    elif op == "slur":
        _, n1, _ = at(int(w[1]), w[2], w[3]); _, n2, _ = at(int(w[4]), w[2], w[5])
        SLURN[0] = NEXTN[SLURN[0]]; num = str(SLURN[0])
        ET.SubElement(notations(n1), "slur", type="start", number=num); ET.SubElement(notations(n2), "slur", type="stop", number=num)
    elif op == "slurp":   # slurp BAR PART ONSET PITCH BAR2 ONSET2 PITCH2 (pitch like A3, Bb3)
        def atp(b, pc, on, pit):
            part, st = target(pc); m, ns = notes_at(part, st, b); q = int(Fraction(on) * 24)
            import re as _r
            mm = _r.fullmatch(r"([A-G])(#|b)?(\d)", pit); alt = {"#": "1", "b": "-1", None: None}[mm.group(2)]
            for o, n in ns:
                p = n.find("pitch")
                if o == q and p is not None and p.findtext("step") == mm.group(1) and p.findtext("octave") == mm.group(3) and (p.findtext("alter") and str(int(float(p.findtext("alter")))) or None) == alt:
                    return n
            raise SystemExit(f"no {pit} at {b} {pc} {on}")
        n1 = atp(int(w[1]), w[2], w[3], w[4]); n2 = atp(int(w[5]), w[8] if len(w) > 8 else w[2], w[6], w[7])
        SLURN[0] = NEXTN[SLURN[0]]
        num = str(SLURN[0])
        ET.SubElement(notations(n1), "slur", type="start", number=num); ET.SubElement(notations(n2), "slur", type="stop", number=num)
    elif op == "tempo":   # tempo BAR BPM (quarter notes per minute, for playback)
        m = meas(parts[0], int(w[1]))
        d = ET.Element("direction", placement="above"); ET.SubElement(ET.SubElement(d, "direction-type"), "words").text = ""
        ET.SubElement(d, "sound", tempo=w[2])
        d.remove(d.find("direction-type")); d.insert(0, ET.Element("direction-type")); ET.SubElement(d.find("direction-type"), "words")
        a = m.find("attributes"); m.insert(list(m).index(a) + 1 if a is not None else 0, d)
    elif op in ("dbar", "final"):   # dbar BAR: double barline at the end of BAR in every part; final BAR: light-heavy
        for part in parts:
            m = meas(part, int(w[1]))
            for old in m.findall("barline"): m.remove(old)
            bl = ET.SubElement(m, "barline", location="right")
            ET.SubElement(bl, "bar-style").text = "light-light" if op == "dbar" else "light-heavy"
    elif op == "noslur":   # every slur mark on every note at that onset in that staff
        part, st = target(w[2]); m, ns = notes_at(part, st, int(w[1])); q = int(Fraction(w[3]) * 24)
        for o, n in ns:
            if o == q and n.find("notations") is not None:
                for x in n.find("notations").findall("slur"): n.find("notations").remove(x)
    elif op in ("stacc", "nostacc"):
        _, n1, _ = at(int(w[1]), w[2], w[3]); nt = notations(n1)
        a = nt.find("articulations")
        if op == "stacc":
            if a is None: a = ET.SubElement(nt, "articulations")
            ET.SubElement(a, "staccato")
        elif a is not None:
            for x in a.findall("staccato"): a.remove(x)
    elif op == "fermata":
        _, n1, _ = at(int(w[1]), w[2], w[3]); ET.SubElement(notations(n1), "fermata", type="upright")
    elif op == "lyric":
        _, n1, _ = at(int(w[1]), w[2], w[3]); n1.find("lyric/text").text = " ".join(w[4:])
    else:
        raise SystemExit("unknown op " + op)
ET.indent(t, space="  ")
with open(OUT, "wb") as f:
    f.write(head.encode()); t.write(f, encoding="utf-8", xml_declaration=False)
