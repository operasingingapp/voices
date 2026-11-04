"""Piano DSL (PIANO.md) -> MusicXML measures for the piano part (24 divisions per quarter)."""
import re
import xml.etree.ElementTree as ET
TYPES = {"w": ("whole", 3360), "h": ("half", 1680), "q": ("quarter", 840), "e": ("eighth", 420), "s": ("16th", 210), "x": ("32nd", 105), "y": ("64th", 52)}
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
        if tok.startswith("hp:"):
            # hairpin: hp:< (crescendo starts here), hp:> (diminuendo starts here), hp:end (it ends here)
            d = ET.Element("direction", placement="below"); dt = ET.SubElement(d, "direction-type")
            k = tok[3:]
            ET.SubElement(dt, "wedge", type={"<": "crescendo", ">": "diminuendo"}.get(k, "stop"), number=str(staff))
            ET.SubElement(d, "staff").text = str(staff)
            out.append((pos, d)); continue
        if tok.startswith("dyn:") or tok.startswith("word:"):
            d = ET.Element("direction", placement="below")
            dt = ET.SubElement(d, "direction-type")
            if tok.startswith("dyn:"):
                dd = ET.SubElement(dt, "dynamics"); mk = tok[4:]
                if mk in ("p","pp","ppp","pppp","f","ff","fff","ffff","mp","mf","sf","sfp","sfpp","fp","rf","rfz","sfz","sffz","fz","pf"): ET.SubElement(dd, mk)
                else: ET.SubElement(dd, "other-dynamics").text = mk
            else: ET.SubElement(dt, "words").text = tok[5:].replace("_", " ")
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
            m2 = re.match(r"([whqesx])(\.?)([~()\[\]*>^!-]*)$", rest_)
            tfl = m2.group(3)
            typ, dur = TYPES[m2.group(1)]
            if m2.group(2): dur += dur // 2
            for side, chord in (("start", A_), ("stop", B_)):
                for k, p in enumerate(chord.split("+")):
                    ptie_t = p.endswith("~"); p = p.rstrip("~")
                    n = ET.Element("note")
                    if k > 0: ET.SubElement(n, "chord")
                    mm = re.fullmatch(r"([A-G])(#|b|n|##|bb)?(\d)", p)
                    pe = ET.SubElement(n, "pitch"); ET.SubElement(pe, "step").text = mm.group(1)
                    alt = {"#": 1, "b": -1, "n": 0, "##": 2, "bb": -2, None: None}[mm.group(2)]
                    if alt: ET.SubElement(pe, "alter").text = str(alt)
                    ET.SubElement(pe, "octave").text = mm.group(3)
                    ET.SubElement(n, "duration").text = str(dur // 2)
                    tie_here = side == "stop" and ("~" in tfl or ptie_t)
                    if tie_here: ET.SubElement(n, "tie", type="start")
                    ET.SubElement(n, "voice").text = str(voice); ET.SubElement(n, "type").text = typ
                    if m2.group(2): ET.SubElement(n, "dot")
                    tm = ET.SubElement(n, "time-modification"); ET.SubElement(tm, "actual-notes").text = "2"; ET.SubElement(tm, "normal-notes").text = "1"
                    ET.SubElement(n, "staff").text = str(staff)
                    ntt = ET.SubElement(n, "notations")
                    if tie_here: ET.SubElement(ntt, "tied", type="start")
                    if k == 0 and side == "start" and "(" in tfl: ET.SubElement(ntt, "slur", type="start", number=str(6 + voice))
                    if k == 0 and side == "stop" and ")" in tfl: ET.SubElement(ntt, "slur", type="stop", number=str(6 + voice))
                    if k == 0 and side == "start" and "[" in tfl: ET.SubElement(ntt, "slur", type="start", number=str(12 + voice))
                    if k == 0 and side == "stop" and "]" in tfl: ET.SubElement(ntt, "slur", type="stop", number=str(12 + voice))
                    if k == 0 and side == "start" and side == "start":
                        art = [x for x, c in (("staccato", "*"), ("accent", ">"), ("strong-accent", "^"), ("tenuto", "-")) if c in tfl]
                        if art:
                            a_ = ET.SubElement(ntt, "articulations")
                            for x in art: ET.SubElement(a_, x)
                        if "!" in tfl: ET.SubElement(ntt, "fermata", type="upright")
                    if k == 0:
                        ET.SubElement(ET.SubElement(ntt, "ornaments"), "tremolo", type=side).text = beams
                    if not len(ntt): n.remove(ntt)
                    out.append((pos, n))
                pos += dur // 2
            continue
        grace = tok.startswith("g:") or tok.startswith("G:")
        noslash = tok.startswith("G:")
        if grace: tok = tok[2:]
        pitches, rest = tok.split(":", 1)
        m = re.match(r"([whqesxy])(\.{0,2})(3?)(?:\{(\d+):(\d+)\})?([~*^>!()\[\]tam-]*)$", rest)
        if not m: raise SystemExit("bad token " + tok)
        typ, dur = TYPES[m.group(1)]
        if m.group(2): dur += dur // 2 + (dur // 4 if len(m.group(2)) == 2 else 0)
        tup = (3, 2) if m.group(3) else ((int(m.group(4)), int(m.group(5))) if m.group(4) else None)
        if tup: dur = dur * tup[1] // tup[0]
        fl = m.group(6)
        for k, p in enumerate(pitches.split("+")):
            ptie = p.endswith("~"); p = p.rstrip("~")
            n = ET.Element("note")
            if grace: ET.SubElement(n, "grace", **({} if noslash else {"slash": "yes"}))
            if k > 0: ET.SubElement(n, "chord")
            if p == "s": n.set("print-object", "no"); ET.SubElement(n, "rest")
            elif p == "r": ET.SubElement(n, "rest")
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
            for _ in m.group(2): ET.SubElement(n, "dot")
            if tup:
                tm = ET.SubElement(n, "time-modification"); ET.SubElement(tm, "actual-notes").text = str(tup[0]); ET.SubElement(tm, "normal-notes").text = str(tup[1])
            ET.SubElement(n, "staff").text = str(staff)
            nt = ET.Element("notations")
            if "~" in fl or ptie: ET.SubElement(nt, "tied", type="start")
            if "a" in fl: ET.SubElement(nt, "arpeggiate")
            if k == 0:
                if ")" in fl: ET.SubElement(nt, "slur", type="stop", number=str(6 + voice))
                if "]" in fl: ET.SubElement(nt, "slur", type="stop", number=str(12 + voice))
                if "(" in fl: ET.SubElement(nt, "slur", type="start", number=str(6 + voice))
                if "[" in fl: ET.SubElement(nt, "slur", type="start", number=str(12 + voice))
                if "!" in fl: ET.SubElement(nt, "fermata", type="upright")
                if "t" in fl: ET.SubElement(ET.SubElement(nt, "ornaments"), "trill-mark")
                if "m" in fl: ET.SubElement(ET.SubElement(nt, "ornaments"), "inverted-mordent")
                art = [x for x, c in (("staccato", "*"), ("strong-accent", "^"), ("accent", ">"), ("tenuto", "-")) if c in fl]
                if art:
                    a = ET.SubElement(nt, "articulations")
                    for x in art: ET.SubElement(a, x)
            if len(nt): n.append(nt)
            out.append((pos, n))
        if not grace: pos += dur
    return out, pos
