"""Piano DSL (PIANO.md) -> MusicXML measures for the piano part (24 divisions per quarter)."""
import re
import xml.etree.ElementTree as ET
TYPES = {"w": ("whole", 96), "h": ("half", 48), "q": ("quarter", 24), "e": ("eighth", 12), "s": ("16th", 6), "x": ("32nd", 3)}
def load(path):
    D = {}
    for line in open(path, encoding="utf-8"):
        line = line.strip()
        if not line or line.startswith("#"): continue
        m = re.match(r"(\d+)\s+(RH|LH)([1-4]):\s*(.*)$", line)
        if not m: raise SystemExit("bad piano line: " + line)
        D.setdefault(int(m.group(1)), {})[(m.group(2), int(m.group(3)))] = m.group(4).split()
    return D
def notes_for(tokens, staff, voice):
    """-> list of (onset, element) ; onsets in divisions"""
    out, pos, pend = [], 0, []
    for tok in tokens:
        if tok.startswith("dyn:") or tok.startswith("word:"):
            d = ET.Element("direction", placement="below")
            dt = ET.SubElement(d, "direction-type")
            if tok.startswith("dyn:"): ET.SubElement(ET.SubElement(dt, "dynamics"), tok[4:])
            else: ET.SubElement(dt, "words").text = tok[5:]
            ET.SubElement(d, "staff").text = str(staff)
            out.append((pos, d)); continue
        if tok.startswith("clef:"):
            a = ET.Element("attributes"); c = ET.SubElement(a, "clef", number=str(staff))
            ET.SubElement(c, "sign").text = tok[5:]; ET.SubElement(c, "line").text = "4" if tok[5:] == "F" else "2"
            out.append((pos, a)); continue
        if tok.startswith("trem"):
            # fingered tremolo: tremN:A|B:DUR  (N = beams, 1 = eighths, 2 = sixteenths); A and B may be chords (+)
            mt = re.match(r"trem(\d):([^|]+)\|([^:]+):(.+)$", tok)
            beams, A_, B_, rest_ = mt.group(1), mt.group(2), mt.group(3), mt.group(4)
            m2 = re.match(r"([whqesx])(\.?)$", rest_)
            typ, dur = TYPES[m2.group(1)]
            if m2.group(2): dur += dur // 2
            for side, chord in (("start", A_), ("stop", B_)):
                for k, p in enumerate(chord.split("+")):
                    n = ET.Element("note")
                    if k > 0: ET.SubElement(n, "chord")
                    mm = re.fullmatch(r"([A-G])(#|b|n|##|bb)?(\d)", p)
                    pe = ET.SubElement(n, "pitch"); ET.SubElement(pe, "step").text = mm.group(1)
                    alt = {"#": 1, "b": -1, "n": 0, "##": 2, "bb": -2, None: None}[mm.group(2)]
                    if alt: ET.SubElement(pe, "alter").text = str(alt)
                    ET.SubElement(pe, "octave").text = mm.group(3)
                    ET.SubElement(n, "duration").text = str(dur // 2)
                    ET.SubElement(n, "voice").text = str(voice); ET.SubElement(n, "type").text = typ
                    if m2.group(2): ET.SubElement(n, "dot")
                    tm = ET.SubElement(n, "time-modification"); ET.SubElement(tm, "actual-notes").text = "2"; ET.SubElement(tm, "normal-notes").text = "1"
                    ET.SubElement(n, "staff").text = str(staff)
                    if k == 0:
                        ET.SubElement(ET.SubElement(ET.SubElement(n, "notations"), "ornaments"), "tremolo", type=side).text = beams
                    out.append((pos, n))
                pos += dur // 2
            continue
        grace = tok.startswith("g:")
        if grace: tok = tok[2:]
        pitches, rest = tok.split(":", 1)
        m = re.match(r"([whqesx])(\.?)(3?)([~*>!()]*)$", rest)
        if not m: raise SystemExit("bad token " + tok)
        typ, dur = TYPES[m.group(1)]
        if m.group(2): dur += dur // 2
        if m.group(3): dur = dur * 2 // 3
        fl = m.group(4)
        for k, p in enumerate(pitches.split("+")):
            ptie = p.endswith("~"); p = p.rstrip("~")
            n = ET.Element("note")
            if grace: ET.SubElement(n, "grace", slash="yes")
            if k > 0: ET.SubElement(n, "chord")
            if p == "r": ET.SubElement(n, "rest")
            else:
                mm = re.fullmatch(r"([A-G])(#|b|n|##|bb)?(\d)", p)
                pe = ET.SubElement(n, "pitch"); ET.SubElement(pe, "step").text = mm.group(1)
                alt = {"#": 1, "b": -1, "n": 0, "##": 2, "bb": -2, None: None}[mm.group(2)]
                if alt: ET.SubElement(pe, "alter").text = str(alt)
                ET.SubElement(pe, "octave").text = mm.group(3)
                n.set("_acc", "" if mm.group(2) is None else mm.group(2))
            if not grace: ET.SubElement(n, "duration").text = str(dur)
            if "~" in fl or ptie: ET.SubElement(n, "tie", type="start")
            ET.SubElement(n, "voice").text = str(voice)
            ET.SubElement(n, "type").text = typ
            if m.group(2): ET.SubElement(n, "dot")
            if m.group(3):
                tm = ET.SubElement(n, "time-modification"); ET.SubElement(tm, "actual-notes").text = "3"; ET.SubElement(tm, "normal-notes").text = "2"
            ET.SubElement(n, "staff").text = str(staff)
            nt = ET.Element("notations")
            if "~" in fl or ptie: ET.SubElement(nt, "tied", type="start")
            if k == 0:
                if ")" in fl: ET.SubElement(nt, "slur", type="stop", number=str(6 + voice))
                if "(" in fl: ET.SubElement(nt, "slur", type="start", number=str(6 + voice))
                if "!" in fl: ET.SubElement(nt, "fermata", type="upright")
                art = [x for x, c in (("staccato", "*"), ("accent", ">")) if c in fl]
                if art:
                    a = ET.SubElement(nt, "articulations")
                    for x in art: ET.SubElement(a, x)
            if len(nt): n.append(nt)
            out.append((pos, n))
        if not grace: pos += dur
    return out, pos
