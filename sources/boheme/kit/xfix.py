"""Small fixes on a delivered MusicXML. usage: xfix.py IN OUT FIXES.txt
lines:  dyn PARTID BAR STAFF ONSET KIND        add a dynamic (onset in quarters)
        movedyn PARTID BAR KIND NEWONSET        move that dynamic in the bar to NEWONSET
        acc PARTID BAR STAFF ONSET STEPOCT SIGN  show a printed accidental on that note
        wedge PARTID BAR STAFF ONSET TYPE       hairpin: TYPE crescendo | diminuendo | stop
        timesym BAR common|cut                  the printed C / cut-C time signature
        final                                   light-heavy (final) barline at the end of every part
        tie PARTID BAR STAFF ONSET STEPOCT      tie that note to the next note of the same pitch on that staff
        slur PARTID BAR STAFF ONSET STEPOCT BAR2 ONSET2 STEPOCT2   a slur between two notes
        grace PARTID BAR STAFF ONSET            grace note there: no slash, slurred to its main note"""
import sys, re, xml.etree.ElementTree as ET
from fractions import Fraction
IN, OUT, FX = sys.argv[1:4]
head = open(IN).read().split("<score-partwise", 1)[0]
t = ET.parse(IN); r = t.getroot()
P = {p.get("id"): p for p in r.findall("part")}
def meas(pid, b): return next(m for m in P[pid].findall("measure") if m.get("number") == str(b))
def divs(pid, b):
    d = None
    for m in P[pid].findall("measure"):
        x = m.find("attributes/divisions")
        if x is not None: d = int(x.text)
        if m.get("number") == str(b): return d
def notes(m):
    pos = 0; last = 0; out = []
    for e in m:
        if e.tag == "backup": pos -= int(e.findtext("duration"))
        elif e.tag == "forward": pos += int(e.findtext("duration"))
        elif e.tag == "note":
            on = last if e.find("chord") is not None else pos
            if e.find("chord") is None and e.find("grace") is None: last = pos; pos += int(e.findtext("duration"))
            out.append((on, e))
    return out, pos
def place(m, q, el, staff):
    _, end = notes(m)
    # append at the end of the measure, stepping back to the onset
    if end > q: b = ET.SubElement(m, "backup"); ET.SubElement(b, "duration").text = str(end - q)
    if staff: ET.SubElement(el, "staff").text = str(staff)
    m.append(el)
    if end > q: f = ET.SubElement(m, "forward"); ET.SubElement(f, "duration").text = str(end - q)
def dynel(kind):
    d = ET.Element("direction", placement="below"); dt = ET.SubElement(d, "direction-type")
    ET.SubElement(ET.SubElement(dt, "dynamics"), kind); return d
for line in open(FX):
    w = line.split()
    if not w or w[0].startswith("#"): continue
    op = w[0]
    if op == "dyn":
        pid, b, st, on, kind = w[1], int(w[2]), w[3], w[4], w[5]
        m = meas(pid, b); q = int(Fraction(on) * divs(pid, b))
        place(m, q, dynel(kind), None if st == "-" else st)
    elif op == "movedyn":
        pid, b, kind, on = w[1], int(w[2]), w[3], w[4]
        m = meas(pid, b); q = int(Fraction(on) * divs(pid, b))
        d = next(x for x in m.findall("direction") if x.find(f"direction-type/dynamics/{kind}") is not None)
        st = d.findtext("staff"); m.remove(d)
        for s in d.findall("staff"): d.remove(s)
        # clean any dangling backup/forward pair left around it is harmless (zero net); just re-place
        place(m, q, d, st)
    elif op == "word":   # word PARTID BAR STAFF ONSET TEXT...
        pid, b, st, on = w[1], int(w[2]), w[3], w[4]
        m = meas(pid, b); q = int(Fraction(on) * divs(pid, b))
        d = ET.Element("direction", placement="above"); dt = ET.SubElement(d, "direction-type")
        ET.SubElement(dt, "words").text = " ".join(w[5:])
        place(m, q, d, None if st == "-" else st)
    elif op == "wedge":
        pid, b, st, on, kind = w[1], int(w[2]), w[3], w[4], w[5]
        m = meas(pid, b); q = int(Fraction(on) * divs(pid, b))
        d = ET.Element("direction", placement="below"); ET.SubElement(ET.SubElement(d, "direction-type"), "wedge", type=kind)
        place(m, q, d, st)
    elif op == "timesym":   # timesym BAR common|cut : the printed C / cut-C time signature
        b, sym = int(w[1]), w[2]
        for pid in P:
            for t_ in meas(pid, b).iter("time"): t_.set("symbol", sym)
    elif op == "final":
        for pp in P.values():
            m = pp.findall("measure")[-1]
            for x in m.findall("barline"):
                if x.get("location", "right") == "right": m.remove(x)
            bl = ET.SubElement(m, "barline", location="right"); ET.SubElement(bl, "bar-style").text = "light-heavy"
    elif op in ("tie", "slur", "grace"):
        def find(pid, b, st, on, so):
            m = meas(pid, b); q = int(Fraction(on) * divs(pid, b))
            c = [n for o, n in notes(m)[0] if o == q and n.find("pitch") is not None and n.findtext("staff") == st
                 and (so is None or n.findtext("pitch/step") + n.findtext("pitch/octave") == so)
                 and (so is not None or n.find("grace") is not None)]
            if not c: raise SystemExit(f"no {so} at {pid} {b} {on}")
            return c[0]
        def nots(n):
            no = n.find("notations")
            if no is None:
                no = ET.Element("notations"); ks = list(n)
                j = max(k for k, x in enumerate(ks) if x.tag in ("type", "dot", "accidental", "time-modification", "stem", "staff", "beam")) + 1
                n.insert(j, no)
            return no
        def nextin(pid, b, st, after, pred):
            seen = False
            for mm in P[pid].findall("measure"):
                if int(mm.get("number")) < b: continue
                for o, n in notes(mm)[0]:
                    if n is after: seen = True; continue
                    if seen and n.findtext("staff") == st and n.find("pitch") is not None and pred(n): return n
        if op == "tie":
            pid, b, st, on, so = w[1:6]; b = int(b); n = find(pid, b, st, on, so)
            m2 = nextin(pid, b, st, n, lambda x: x.findtext("pitch/step") + x.findtext("pitch/octave") == so and x.findtext("pitch/alter") == n.findtext("pitch/alter"))
            for x, ty in ((n, "start"), (m2, "stop")):
                if x.find(f"tie[@type='{ty}']") is None:
                    ks = list(x); j = max(k for k, y in enumerate(ks) if y.tag in ("pitch", "duration")) + 1
                    x.insert(j, ET.Element("tie", type=ty))
                ET.SubElement(nots(x), "tied", type=ty)
        else:
            sn = 3 + (sum(1 for _ in r.iter("slur")) // 2) % 4
            if op == "slur":
                pid, b, st, on, so, b2, on2, so2 = w[1:9]; n = find(pid, int(b), st, on, so); n2 = find(pid, int(b2), st, on2, so2)
            else:
                pid, b, st, on = w[1:5]; n = find(pid, int(b), st, on, None)
                g = n.find("grace"); g.attrib.pop("slash", None)
                n2 = nextin(pid, int(b), st, n, lambda x: x.find("grace") is None)
            ET.SubElement(nots(n), "slur", type="start", number=str(sn)); ET.SubElement(nots(n2), "slur", type="stop", number=str(sn))
    elif op in ("hiderest", "nostacc"):   # hiderest|nostacc PARTID BAR STAFF ONSET [VOICE]: rest not printed / no staccato
        pid, b, st, on = w[1], int(w[2]), w[3], w[4]; vv = w[5] if len(w) > 5 else None
        m = meas(pid, b); q = int(Fraction(on) * divs(pid, b))
        want_rest = op == "hiderest"
        c = [n for o, n in notes(m)[0] if o == q and (n.find("rest") is not None) == want_rest and (st == "-" or n.findtext("staff") == st) and (vv is None or n.findtext("voice") == vv)]
        if not c: raise SystemExit(f"{op}: nothing at {pid} {b} {st} {on}")
        if want_rest:
            for n in c: n.set("print-object", "no")
        else:
            for n in c:
                for nt in n.findall("notations"):
                    for ar in nt.findall("articulations"):
                        for s in ar.findall("staccato"): ar.remove(s)
                        if not list(ar): nt.remove(ar)
                    if not list(nt): n.remove(nt)
    elif op in ("pitch", "noacc"):   # pitch PARTID BAR STAFF ONSET STEPOCT ALTER / noacc PARTID BAR STAFF ONSET STEPOCT
        pid, b, st, on, so = w[1], int(w[2]), w[3], w[4], w[5]
        m = meas(pid, b); q = int(Fraction(on) * divs(pid, b))
        c = [n for o, n in notes(m)[0] if o == q and n.find("pitch") is not None and (st == "-" or n.findtext("staff") == st)
             and n.findtext("pitch/step") + n.findtext("pitch/octave") == so]
        if not c: raise SystemExit(f"{op}: no {so} at {pid} {b} {on}")
        for n in c:
            if op == "noacc":
                a = n.find("accidental")
                if a is not None: n.remove(a)
            else:
                p = n.find("pitch"); al = p.find("alter")
                if w[6] == "0":
                    if al is not None: p.remove(al)
                else:
                    if al is None: al = ET.Element("alter"); p.insert(1, al)
                    al.text = w[6]
    elif op == "addchord":   # addchord PARTID BAR STAFF ONSET STEPOCT NEWSTEPOCT : add a chord note (same rhythm) to that note
        import copy
        pid, b, st, on, so, ns = w[1], int(w[2]), w[3], w[4], w[5], w[6]
        m = meas(pid, b); q = int(Fraction(on) * divs(pid, b))
        c = [n for o, n in notes(m)[0] if o == q and n.find("pitch") is not None and (st == "-" or n.findtext("staff") == st)
             and n.findtext("pitch/step") + n.findtext("pitch/octave") == so]
        if not c: raise SystemExit(f"addchord: no {so} at {pid} {b} {on}")
        n = c[0]; x = copy.deepcopy(n)
        keeptie = len(w) > 7 and w[7] == "tie"   # the new note is tied just as that note is
        for e in x.findall("lyric"): x.remove(e)
        for e in x.findall("notations"):
            if not keeptie: x.remove(e)
            else:
                for k in list(e):
                    if k.tag != "tied": e.remove(k)
        if not keeptie:
            for e in x.findall("tie"): x.remove(e)
        p = x.find("pitch"); p.find("step").text = ns[0]; p.find("octave").text = ns[-1]
        al = p.find("alter")
        if al is not None and ns[0] != so[0]: p.remove(al)  # same letter (an octave): keep the flat/sharp
        for e in x.findall("accidental"): x.remove(e)
        x.insert(0, ET.Element("chord"))
        kids = list(m); m.insert(kids.index(n) + 1, x)
    elif op == "shortbar":   # shortbar BAR BEATS BEATTYPE : a bar printed shorter than the metre (a hidden time signature)
        b, bt, bty = int(w[1]), w[2], w[3]
        for pid in P:
            m = meas(pid, b); at = m.find("attributes")
            if at is None: at = ET.Element("attributes"); m.insert(0, at)
            tm = ET.SubElement(at, "time", **{"print-object": "no"}); ET.SubElement(tm, "beats").text = bt; ET.SubElement(tm, "beat-type").text = bty
            kids = list(at); rank = {"divisions": 0, "key": 1, "time": 2, "staves": 3, "clef": 5}
            for k in kids: at.remove(k)
            for k in sorted(kids, key=lambda e: rank.get(e.tag, 9)): at.append(k)
            # the following bar returns to the metre in force before the short bar (hidden, unless 'showtime' says otherwise)
            prev = None
            for mm in P[pid].findall("measure"):
                if int(re.sub(r"\D", "", mm.get("number")) or 0) >= b: break
                for t_ in mm.iter("time"):
                    if t_.get("print-object") != "no": prev = t_
            nxt = [mm for mm in P[pid].findall("measure") if mm.get("number") == str(b + 1)]
            if prev is not None and nxt and nxt[0].find("attributes/time") is None:
                m2 = nxt[0]; at2 = m2.find("attributes")
                if at2 is None: at2 = ET.Element("attributes"); m2.insert(0, at2)
                tm2 = ET.fromstring(ET.tostring(prev)); tm2.set("print-object", "no")
                kids = list(at2) + [tm2]
                for k in list(at2): at2.remove(k)
                for k in sorted(kids, key=lambda e: rank.get(e.tag, 9)): at2.append(k)
    elif op == "showtime":   # showtime BAR : print the time signature of that bar (e.g. after a short bar, at a new number)
        for pid in P:
            for t_ in meas(pid, int(w[1])).iter("time"): t_.attrib.pop("print-object", None)
    elif op == "tupnum":   # tupnum PARTID BAR : show the printed "3" on that bar's triplets
        m = meas(w[1], int(w[2]))
        for tu in m.iter("tuplet"):
            if tu.get("type") == "start": tu.set("show-number", "actual")
    elif op == "mrest":   # mrest PARTID BAR : that part's bar is one whole-bar rest (printed as such)
        pid, b = w[1], int(w[2]); m = meas(pid, b)
        rs = [n for o, n in notes(m)[0]]
        if not rs or any(n.find("rest") is None for n in rs): raise SystemExit(f"mrest: {pid} {b} not all rests")
        tot = sum(int(n.findtext("duration")) for n in rs if n.find("chord") is None)
        first = rs[0]
        for n in rs[1:]: m.remove(n)
        first.find("rest").set("measure", "yes"); first.find("duration").text = str(tot)
        for x in first.findall("type") + first.findall("dot"): first.remove(x)
    elif op == "acc":
        pid, b, st, on, so, sign = w[1], int(w[2]), w[3], w[4], w[5], w[6]
        m = meas(pid, b); q = None if on == "*" else int(Fraction(on) * divs(pid, b))
        c = [n for o, n in notes(m)[0] if (q is None or o == q) and n.find("pitch") is not None and (st == "-" or n.findtext("staff") == st)
             and n.findtext("pitch/step") + n.findtext("pitch/octave") == so]
        if not c: raise SystemExit(f"no {so} at {pid} {b} {on}")
        n = c[0]; a = n.find("accidental")
        if a is None:
            a = ET.Element("accidental"); kids = list(n)
            j = max(i for i, x in enumerate(kids) if x.tag in ("type", "dot", "voice")) + 1; n.insert(j, a)
        a.text = sign
ET.indent(t, space="  ")
with open(OUT, "wb") as o: o.write(head.encode()); t.write(o, encoding="utf-8", xml_declaration=False)
print("ok", OUT)
