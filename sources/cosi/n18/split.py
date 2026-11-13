"""split.py IN OUTDIR: cut the Così fan tutte No. 18 Finale (697 bars, Peters) into the app's six finale pieces.

Each piece: bars renumbered from 1; divisions/key/time/clefs restated in bar 1; the tempo in force restated in bar 1;
only the singers who sing in the range, plus the piano; part ids renumbered P1.. (piano last); ties and slurs that
cross a cut ended cleanly (only the dangling half is dropped); light-heavy final barline; 2/2 shown as cut time;
identification fixed to Mozart / Da Ponte / Soldan (Peters). No pitch, duration or note is changed.
Lyric fix (text only): bar 471 "or-or.)" (two words printed under one quarter) is written as "or" + elision + "or.)",
the file's own encoding of two words on one note.
Barline fix: the print has a double barline (light-light) at the end of bar 656, before the Presto; the input has a
single one (REPORT.md, "Minor"). It is added in every kept part (mozart-dammi-un-bacio bar 172).
"""
import copy, sys, xml.etree.ElementTree as ET

IN, OUTDIR = sys.argv[1], sys.argv[2]
# (editionId, first bar, last bar, title)
PIECES = [
    ("mozart-ah-che-tutta-in-un-momento", 1, 62, "Ah che tutta in un momento"),
    ("mozart-si-mora-si-si-mora", 62, 137, "Si mora si, si mora"),
    ("mozart-giacche-a-morir-vicini", 138, 291, "Giacchè a morir vicini"),
    ("mozart-eccovi-il-medico", 292, 428, "Eccovi il medico"),
    ("mozart-dove-son-cosi", 429, 484, "Dove son"),
    ("mozart-dammi-un-bacio", 485, 697, "Dammi un bacio, o mio tesoro"),
]
# printed tempo word in force at a cut that has none of its own
TEMPO_WORD = {138: "Allegro"}
# printed double barlines missing from the input (right barline of these source bars)
DOUBLE_BAR = [656]

src_text = open(IN, encoding="utf-8").read()
head = src_text.split("<score-partwise", 1)[0]


def tie_key(n):
    p = n.find("pitch")
    if p is None:
        return None
    return (p.findtext("step"), p.findtext("alter") or "0", p.findtext("octave"), n.findtext("staff") or "1", n.findtext("voice") or "1")


def drop_tie(n, kind):
    for t in list(n.findall("tie")):
        if t.get("type") == kind:
            n.remove(t)
    no = n.find("notations")
    if no is not None:
        for t in list(no.findall("tied")):
            if t.get("type") == kind:
                no.remove(t)
        if len(no) == 0:
            n.remove(no)


def fix_lyrics(root):
    # "scop-pia_or- or," (bars 453/455/477/479/483): the print hyphenates the two words "or or" like one word; the
    # syllabic flags are set so that "or" and "or" are two words (pia ends "scoppia", elided "or", then "or").
    for p in root.findall("part"):
        prev = None
        for n in p.iter("note"):
            for l in n.findall("lyric"):
                tx = [t.text for t in l.findall("text")]
                if prev is not None and (tx[0] or "").rstrip(".,)") == "or" and l.findtext("syllabic") == "end":
                    l.find("syllabic").text = "single"
                    prev.find("syllabic").text = "end"
                prev = l if (len(tx) == 2 and tx[1] == "or" and l.findtext("syllabic") == "middle") else None
    for t in root.iter("text"):
        if t.text == "or-or.)":
            ly = None
            for l in root.iter("lyric"):
                if t in list(l):
                    ly = l
                    break
            i = list(ly).index(t)
            t.text = "or"
            el = ET.Element("elision")
            t2 = ET.Element("text")
            t2.text = "or.)"
            ly.insert(i + 1, el)
            ly.insert(i + 2, t2)


def cut(eid, A, B, title):
    t = ET.parse(IN)
    r = t.getroot()
    fix_lyrics(r)
    r.find("work/work-title").text = f"Così fan tutte: No. 18 Finale, {title}"
    ident = r.find("identification")
    for c in list(ident):
        ident.remove(c)
    ET.SubElement(ident, "creator", type="composer").text = "Wolfgang Amadeus Mozart"
    ET.SubElement(ident, "creator", type="lyricist").text = "Lorenzo Da Ponte"
    ET.SubElement(ident, "rights").text = "Music and text public domain. Piano reduction by Kurt Soldan (Edition Peters Nr. 4474, plate 11446)."

    parts = r.findall("part")
    # tempo in force at A (tempo marks are on P1 only in the input)
    tempo_dir = None
    for m in parts[0].findall("measure"):
        if int(m.get("number")) > A:
            break
        for d in m.findall("direction"):
            if d.find("sound") is not None and d.find("sound").get("tempo"):
                tempo_dir = (int(m.get("number")), d)
    # which parts sing in the range
    keep = []
    for p in parts:
        name = r.find(f"part-list/score-part[@id='{p.get('id')}']").findtext("part-name")
        sings = any(m.find("note/lyric") is not None for m in p.findall("measure") if A <= int(m.get("number")) <= B)
        if name == "Piano" or sings:
            keep.append(p.get("id"))
    pl = r.find("part-list")
    for sp in list(pl.findall("score-part")):
        if sp.get("id") not in keep:
            pl.remove(sp)
    for p in parts:
        if p.get("id") not in keep:
            r.remove(p)
    report = []
    for p in r.findall("part"):
        state = {}
        for m in p.findall("measure"):
            if int(m.get("number")) > A:
                break
            for at in m.findall("attributes"):
                for c in at:
                    state[c.tag + (c.get("number") or "")] = c
        for m in list(p.findall("measure")):
            n = int(m.get("number"))
            if n < A or n > B:
                p.remove(m)
                continue
            if n in DOUBLE_BAR and n != B and m.find("barline[@location='right']") is None:
                bl = ET.SubElement(m, "barline", location="right")
                ET.SubElement(bl, "bar-style").text = "light-light"
            m.set("number", str(n - A + 1))
            if "implicit" in m.attrib:
                del m.attrib["implicit"]
        ms = p.findall("measure")
        first, last = ms[0], ms[-1]
        # restate attributes in bar 1, in MusicXML order
        old = first.find("attributes")
        cur = {}
        if old is not None:
            for c in old:
                cur[c.tag + (c.get("number") or "")] = c
        merged = {**state, **cur}
        new = ET.Element("attributes")
        for k in ["divisions", "key", "time", "staves", "clef", "clef1", "clef2"]:
            if k in merged:
                new.append(copy.deepcopy(merged[k]))
        if old is not None:
            first.remove(old)
        first.insert(0, new)
        # tempo restated in P1 bar 1
        if p is r.findall("part")[0] and tempo_dir and tempo_dir[0] != A:
            d = copy.deepcopy(tempo_dir[1])
            w = d.find("direction-type/words")
            w.text = TEMPO_WORD.get(A, w.text)
            first.insert(1, d)
        # ties crossing the cuts
        for n in first.findall("note"):
            if any(x.get("type") == "stop" for x in n.findall("tie")):
                k = tie_key(n)
                before = first.findall("note")[: first.findall("note").index(n)]
                if not any(tie_key(b) == k and any(x.get("type") == "start" for x in b.findall("tie")) for b in before):
                    drop_tie(n, "stop")
                    report.append(f"{p.get('id')} bar 1: tie stop from the bar before the cut dropped ({k})")
        lnotes = last.findall("note")
        for i, n in enumerate(lnotes):
            if any(x.get("type") == "start" for x in n.findall("tie")):
                k = tie_key(n)
                if not any(tie_key(b) == k and any(x.get("type") == "stop" for x in b.findall("tie")) for b in lnotes[i + 1:]):
                    drop_tie(n, "start")
                    report.append(f"{p.get('id')} bar {len(ms)}: tie start into the bar after the cut dropped ({k})")
        # slurs crossing the cuts (by number, in document order over the piece)
        open_ = {}
        for m in ms:
            for n in m.findall("note"):
                no = n.find("notations")
                if no is None:
                    continue
                for s in list(no.findall("slur")):
                    num = s.get("number") or "1"
                    if s.get("type") == "start":
                        open_[num] = (m, n, no, s)
                    elif s.get("type") == "stop":
                        if num in open_:
                            del open_[num]
                        else:
                            no.remove(s)
                            report.append(f"{p.get('id')} bar {m.get('number')}: slur stop from before the cut dropped")
                if len(no) == 0:
                    n.remove(no)
        for num, (m, n, no, s) in open_.items():
            no.remove(s)
            report.append(f"{p.get('id')} bar {m.get('number')}: slur start running past the cut dropped")
            if len(no) == 0:
                n.remove(no)
        # final barline
        for bl in list(last.findall("barline")):
            if bl.get("location") == "right":
                last.remove(bl)
        bl = ET.SubElement(last, "barline", location="right")
        ET.SubElement(bl, "bar-style").text = "light-heavy"
    # cut time
    for tm in r.iter("time"):
        if tm.findtext("beats") == "2" and tm.findtext("beat-type") == "2":
            tm.set("symbol", "cut")
    # renumber part ids P1.. (piano is already last)
    ids = [sp.get("id") for sp in pl.findall("score-part")]
    ren = {o: f"P{i+1}" for i, o in enumerate(ids)}
    for sp in pl.findall("score-part"):
        sp.set("id", ren[sp.get("id")])
    for p in r.findall("part"):
        p.set("id", ren[p.get("id")])
    ET.indent(t, space="  ")
    import os
    os.makedirs(f"{OUTDIR}/{eid}", exist_ok=True)
    with open(f"{OUTDIR}/{eid}/score.musicxml", "wb") as o:
        o.write(head.encode())
        t.write(o, encoding="utf-8", xml_declaration=False)
        o.write(b"\n")
    names = [r.find(f"part-list/score-part[@id='{ren[i]}']").findtext("part-name") for i in ids]
    print(f"{eid}: bars {A}-{B} -> 1-{B-A+1}; parts {list(zip(ren.values(), names))}")
    for x in report:
        print("   ", x)


for pc in PIECES:
    cut(*pc)
