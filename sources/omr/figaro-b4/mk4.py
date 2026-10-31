"""Build a number from the sung lines (TRANSCRIBE DSL) and the piano (piano DSL), no scan.
usage: mk4.py VOICES.txt PIANO.txt OUT.xml FIFTHS BEATS TITLE TEMPO_WORD SINGERS(code:name:abbr:clef,...)"""
import sys, re, xml.etree.ElementTree as ET
sys.path.insert(0, "/home/claude/ext/figaro/b2")
from n1build import serialize, tok_note, parse_line, Ev, SHARPS
import piano_dsl as PD
VO, PI, OUT, FIFTHS, BEATS, TITLE, TEMPO, SING = sys.argv[1:9]
fifths = int(FIFTHS); beats = int(BEATS); DIV = 24; barlen = DIV * beats
singers = [s.split(":") for s in SING.split(",")]
V = {}
for line in open(VO, encoding="utf-8"):
    line = line.strip()
    if not line or line.startswith("#"): continue
    mt = re.match(r"(\d+)\s+([A-Z]):\s*(.*)$", line)
    V[(int(mt.group(1)), mt.group(2))] = parse_line(mt.group(3))
D = {}
for line in open(PI, encoding="utf-8"):
    line = line.strip()
    if not line or line.startswith("#"): continue
    m = re.match(r"(\d+)\s+(RH|LH)([1-4]):\s*(.*)$", line)
    D.setdefault(int(m.group(1)), {})[(m.group(2), int(m.group(3)))] = m.group(4).split()
bars = sorted(set(b for b, _ in V) | set(D))
root = ET.Element("score-partwise", version="3.1")
ET.SubElement(ET.SubElement(root, "work"), "work-title").text = TITLE
ident = ET.SubElement(root, "identification")
ET.SubElement(ident, "creator", type="composer").text = "Wolfgang Amadeus Mozart"
ET.SubElement(ident, "creator", type="lyricist").text = "Lorenzo Da Ponte"
ET.SubElement(ident, "rights").text = "Music and text public domain. Piano reduction by Paul Klengel (Breitkopf & Härtel, Edition Breitkopf 1716)."
pl = ET.SubElement(root, "part-list")
vids = [f"P{k+1}" for k in range(len(singers))]; pno = f"P{len(singers)+1}"
for pid, (code, name, ab, clef) in zip(vids, singers):
    sp = ET.SubElement(pl, "score-part", id=pid); ET.SubElement(sp, "part-name").text = name; ET.SubElement(sp, "part-abbreviation").text = ab
sp = ET.SubElement(pl, "score-part", id=pno); ET.SubElement(sp, "part-name").text = "Piano"; ET.SubElement(sp, "part-abbreviation").text = "Pno."
parts = {pid: ET.SubElement(root, "part", id=pid) for pid in vids + [pno]}
b0 = bars[0]
def head(first, staves=None, clefs=()):
    at = ET.Element("attributes")
    if first:
        ET.SubElement(at, "divisions").text = str(DIV)
        ET.SubElement(ET.SubElement(at, "key"), "fifths").text = str(fifths)
        t = ET.SubElement(at, "time"); ET.SubElement(t, "beats").text = str(beats); ET.SubElement(t, "beat-type").text = "4"
        if staves: ET.SubElement(at, "staves").text = str(staves)
        for num, (s_, l_) in clefs:
            c = ET.SubElement(at, "clef", **({"number": str(num)} if num else {})); ET.SubElement(c, "sign").text = s_; ET.SubElement(c, "line").text = l_
    return at
for b in bars:
    pm = ET.SubElement(parts[pno], "measure", number=str(b)); evs = []
    at = head(b == b0, 2, [(1, ("G", "2")), (2, ("F", "4"))])
    if len(at): evs.append(Ev(at, 0, -1))
    if b == b0:
        d = ET.Element("direction", placement="above"); ET.SubElement(ET.SubElement(d, "direction-type"), "words").text = TEMPO; evs.append(Ev(d, 0, -1))
    k = 0
    for (hand, v), toks in sorted(D.get(b, {}).items()):
        staff = 1 if hand == "RH" else 2; voice = (1 if staff == 1 else 5) + (v - 1)
        items, length = PD.notes_for(toks, staff, voice)
        if length != barlen: print(f"WARN piano {b} {hand}{v}: {length/24}", file=sys.stderr)
        for on, el in items: evs.append(Ev(el, on, k)); k += 1
    if not D.get(b): print(f"WARN piano {b}: missing", file=sys.stderr)
    serialize(pm, evs)
    for n in pm.iter("note"): n.attrib.pop("_acc", None)
    for pid, (code, name, ab, clef) in zip(vids, singers):
        vm = ET.SubElement(parts[pid], "measure", number=str(b)); evs = []
        cl = clef.split("/")
        at = head(b == b0, None, [(None, (cl[0], cl[1]))] + ([] if len(cl) < 3 else []))
        if b == b0 and len(cl) > 2:  # treble-8 (a tenor)
            c = at.find("clef"); ET.SubElement(c, "clef-octave-change").text = cl[2]
        if len(at): evs.append(Ev(at, 0, -1))
        toks = V.get((b, code)) or [({96: "r:w", 72: "r:h.", 48: "r:h"}[barlen], None)]
        pos = 0
        for kk, (tok, ly) in enumerate(toks):
            fermata = "!" in tok; tok = tok.replace("!", "")
            n, d = tok_note(tok, 1)
            if fermata:
                nt = n.find("notations") or ET.SubElement(n, "notations"); ET.SubElement(nt, "fermata", type="upright")
            if ly:
                l = ET.SubElement(n, "lyric", number="1"); l.set("_text", ly)
            evs.append(Ev(n, pos, kk)); pos += d
        if pos != barlen: print(f"WARN voice {b} {code}: {pos/24}", file=sys.stderr)
        serialize(vm, evs)
keyalt = {s: (1 if fifths > 0 and s in SHARPS[:fifths] else -1 if fifths < 0 and s in SHARPS[::-1][:-fifths] else 0) for s in "CDEFGAB"}
for pid in vids:
    prev_open = False
    for n in parts[pid].iter("note"):
        l = n.find("lyric")
        if l is None: continue
        t = l.attrib.pop("_text"); opens = t.endswith("-"); t = t[:-1] if opens else t
        syl = ("middle" if opens else "end") if prev_open else ("begin" if opens else "single")
        ET.SubElement(l, "syllabic").text = syl
        ps = t.split("_"); ET.SubElement(l, "text").text = ps[0]
        for extra in ps[1:]: ET.SubElement(l, "elision"); ET.SubElement(l, "text").text = extra
        prev_open = opens
    for m in parts[pid].findall("measure"):
        st8 = {}
        for n in m.iter("note"):
            p = n.find("pitch")
            if p is None: continue
            s_, o = p.findtext("step"), p.findtext("octave")
            a = n.attrib.pop("_alter")
            alt = int(a) if a != "" else st8.get((s_, o), keyalt[s_])
            if a != "": st8[(s_, o)] = alt
            if alt: e = ET.Element("alter"); e.text = str(alt); p.insert(1, e)
ET.indent(root, space="  ")
with open(OUT, "wb") as fo:
    fo.write(b'<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">\n')
    ET.ElementTree(root).write(fo, encoding="utf-8", xml_declaration=False)
print("built", OUT, len(bars), "bars")
