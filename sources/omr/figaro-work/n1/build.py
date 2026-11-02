"""Build the corrected No. 1 (Duettino + Recitativo) from the Halbestunde reading and the checked sung lines.

Output parts: P1 Susanna, P2 Figaro, P3 Piano (2 staves). Divisions 24 per quarter.
Piano notes come from the OMR file (the stream that held the piano in each system); the sung lines come from
voices.txt (one line per bar and singer, see TRANSCRIBE.md), so the OMR's mixed-up vocal staves are not used.
Per-bar corrections to the piano are applied afterwards by fixes.py.
"""
import copy, re, sys
import xml.etree.ElementTree as ET

SRC = "orig.xml"
VOICES = sys.argv[1] if len(sys.argv) > 1 else "voices.txt"
OUT = sys.argv[2] if len(sys.argv) > 2 else "built.xml"
DIV = 24
SCALE = 2  # source divisions 12 -> 24
NBARS = 107

src = ET.parse(SRC).getroot()
SP = {p.get("id"): p.findall("measure") for p in src.findall("part")}


def piano_src(b):
    if b <= 36:
        return "P2"
    if b <= 47:
        return "P3"
    if b <= 62:
        return "P2"
    return "P3"


# ------------------------------------------------------------------ events
class Ev:
    def __init__(self, el, onset, idx, staff=None, voice=None):
        self.el, self.onset, self.idx = el, onset, idx
        self._staff, self._voice = staff, voice

    @property
    def is_note(self):
        return self.el.tag == "note"

    @property
    def staff(self):
        return int(self.el.findtext("staff") or 1)

    @property
    def voice(self):
        return int(self.el.findtext("voice") or 1)

    @property
    def grace(self):
        return self.el.find("grace") is not None

    @property
    def dur(self):
        return int(self.el.findtext("duration") or 0)


def parse(m, scale=1):
    evs, pos, last, idx = [], 0, 0, 0
    for el in list(m):
        if el.tag == "backup":
            pos -= int(el.findtext("duration")) * scale
        elif el.tag == "forward":
            pos += int(el.findtext("duration")) * scale
        elif el.tag == "note":
            ch = el.find("chord") is not None
            on = last if ch else pos
            evs.append(Ev(el, on, idx))
            if not ch:
                last = pos
                if el.find("grace") is None:
                    pos += int(el.findtext("duration")) * scale
        else:
            evs.append(Ev(el, pos, idx))
        idx += 1
    return evs


def serialize(m, evs):
    for c in list(m):
        m.remove(c)
    notes = [e for e in evs if e.is_note]
    others = sorted([e for e in evs if not e.is_note], key=lambda e: (e.onset, e.idx))
    attrs0 = [e for e in others if e.el.tag == "attributes" and e.onset == 0]
    others = [e for e in others if e not in attrs0]
    for e in attrs0:
        m.append(e.el)
    voices = sorted({(e.staff, e.voice) for e in notes})
    cur = 0
    first = True
    pending = others
    for sv in voices:
        if not first and cur > 0:
            b = ET.SubElement(m, "backup")
            ET.SubElement(b, "duration").text = str(cur)
            cur = 0
        vn = sorted([e for e in notes if (e.staff, e.voice) == sv], key=lambda e: (e.onset, e.idx))
        prev_on = None
        for e in vn:
            if first:
                while pending and pending[0].onset <= e.onset:
                    p = pending.pop(0)
                    if p.onset > cur:
                        fw = ET.SubElement(m, "forward")
                        ET.SubElement(fw, "duration").text = str(p.onset - cur)
                        cur = p.onset
                    if p.onset < cur:
                        # inside a note that is already sounding (e.g. a clef after an eighth under a quarter)
                        bk = ET.SubElement(m, "backup")
                        ET.SubElement(bk, "duration").text = str(cur - p.onset)
                        m.append(p.el)
                        fw = ET.SubElement(m, "forward")
                        ET.SubElement(fw, "duration").text = str(cur - p.onset)
                    else:
                        m.append(p.el)
            if e.onset > cur:
                fw = ET.SubElement(m, "forward")
                ET.SubElement(fw, "duration").text = str(e.onset - cur)
                cur = e.onset
            c = e.el.find("chord")
            want = (not e.grace) and prev_on is not None and prev_on == e.onset and cur > e.onset
            if e.grace:
                want = c is not None
            if want and c is None:
                e.el.insert(1 if e.el.find("grace") is not None else 0, ET.Element("chord"))
            if not want and c is not None:
                e.el.remove(c)
            m.append(e.el)
            if not e.grace and not want:
                cur = e.onset + e.dur
                prev_on = e.onset
        if first:
            for p in pending:
                if p.onset > cur:
                    fw = ET.SubElement(m, "forward")
                    ET.SubElement(fw, "duration").text = str(p.onset - cur)
                    cur = p.onset
                m.append(p.el)
            pending = []
        first = False


# ------------------------------------------------------------------ sung lines
TYPES = {"w": ("whole", 96), "h": ("half", 48), "q": ("quarter", 24), "e": ("eighth", 12), "s": ("16th", 6), "x": ("32nd", 3)}
KEYS = {}  # bar -> fifths in force (filled below from the piano's key signatures)
SHARPS = ["F", "C", "G", "D", "A", "E", "B"]


def tok_note(tok, voice, staff=1):
    """'F#4:q.' / 'r:h' / 'g:D5:s' / 'D4:h~' -> (element, duration in divisions)"""
    grace = tok.startswith("g:")
    if grace:
        tok = tok[2:]
    tie = tok.endswith("~")
    tok = tok.rstrip("~")
    p, d = tok.split(":")
    trip = d.endswith("3")
    d = d.rstrip("3")
    dots = d.count(".")
    base = d.rstrip(".")
    typ, dur = TYPES[base]
    dur = dur + (dur // 2 if dots else 0)
    if trip:
        dur = dur * 2 // 3
    n = ET.Element("note")
    if grace:
        ET.SubElement(n, "grace", slash="yes")
    if p == "r":
        ET.SubElement(n, "rest")
    else:
        mt = re.fullmatch(r"([A-G])(#|b|n)?(\d)", p)
        st, acc, o = mt.group(1), mt.group(2), mt.group(3)
        pe = ET.SubElement(n, "pitch")
        ET.SubElement(pe, "step").text = st
        alt = {"#": 1, "b": -1, "n": 0, None: None}[acc]
        n.set("_alter", "" if alt is None else str(alt))
        ET.SubElement(pe, "octave").text = o
    if not grace:
        ET.SubElement(n, "duration").text = str(dur)
    if tie:
        ET.SubElement(n, "tie", type="start")
    ET.SubElement(n, "voice").text = str(voice)
    ET.SubElement(n, "type").text = typ
    for _ in range(dots):
        ET.SubElement(n, "dot")
    if trip:
        tm = ET.SubElement(n, "time-modification")
        ET.SubElement(tm, "actual-notes").text = "3"
        ET.SubElement(tm, "normal-notes").text = "2"
    ET.SubElement(n, "staff").text = str(staff)
    if tie:
        ET.SubElement(ET.SubElement(n, "notations"), "tied", type="start")
    return n, (0 if grace else dur)


def parse_line(s):
    """tokens with optional "lyric" after each"""
    out = []
    for m in re.finditer(r'(\S+?)(?:\s+"([^"]*)")?(?=\s|$)', s.strip()):
        tok, ly = m.group(1), m.group(2)
        if tok.startswith('"'):
            continue
        out.append((tok, ly))
    return out


def load_voices(path):
    V = {}
    for line in open(path, encoding="utf-8"):
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        mt = re.match(r"(\d+)\s+([SF]):\s*(.*)$", line)
        if not mt:
            raise SystemExit(f"bad line: {line}")
        V[(int(mt.group(1)), mt.group(2))] = parse_line(mt.group(3))
    return V


def add_lyric(n, text):
    syl = "single"
    t = text
    # syllabic from hyphens: "ven-" begins/continues a word; previous hyphen handled by caller
    return t


# ------------------------------------------------------------------ build
def new_score():
    root = ET.Element("score-partwise", version="3.1")
    w = ET.SubElement(root, "work")
    ET.SubElement(w, "work-title").text = "Le nozze di Figaro: No. 1 Duettino and Recitativo"
    ident = ET.SubElement(root, "identification")
    ET.SubElement(ident, "creator", type="composer").text = "Wolfgang Amadeus Mozart"
    ET.SubElement(ident, "creator", type="lyricist").text = "Lorenzo Da Ponte"
    ET.SubElement(ident, "rights").text = "Music and text public domain. Piano reduction by Paul Klengel (Breitkopf & Härtel, Edition Breitkopf 1716)."
    pl = ET.SubElement(root, "part-list")
    for pid, name, ab in (("P1", "Susanna", "S."), ("P2", "Figaro", "F."), ("P3", "Piano", "Pno.")):
        sp = ET.SubElement(pl, "score-part", id=pid)
        ET.SubElement(sp, "part-name").text = name
        ET.SubElement(sp, "part-abbreviation").text = ab
    return root


def main():
    V = load_voices(VOICES)
    root = new_score()
    parts = {pid: ET.SubElement(root, "part", id=pid) for pid in ("P1", "P2", "P3")}
    fifths = 1
    for b in range(1, NBARS + 1):
        sm = SP[piano_src(b)][b - 1]
        # key / time changes stated in the source at this bar (any part)
        key_here = None
        time_here = None
        for pid in ("P1", "P2", "P3"):
            for at in SP[pid][b - 1].findall("attributes"):
                if at.find("key") is not None:
                    key_here = int(at.findtext("key/fifths"))
                if at.find("time") is not None:
                    time_here = (at.findtext("time/beats"), at.findtext("time/beat-type"))
        if key_here is not None and key_here != fifths or b == 1:
            fifths = key_here if key_here is not None else fifths
        else:
            key_here = None
        KEYS[b] = fifths
        # ---- piano
        pm = ET.SubElement(parts["P3"], "measure", number=str(b))
        evs = parse(sm, SCALE)
        keep = []
        vmap = {}
        for e in evs:
            el = copy.deepcopy(e.el)
            if e.is_note:
                st = e.staff
                if st not in (1, 2):
                    continue
                for ly in el.findall("lyric"):
                    el.remove(ly)
                d = el.find("duration")
                if d is not None:
                    d.text = str(int(d.text) * SCALE)
                ov = e.voice
                nv = vmap.setdefault((st, ov), (1 if st == 1 else 5) + len([k for k in vmap if k[0] == st]))
                el.find("voice").text = str(nv)
                keep.append(Ev(el, e.onset, e.idx))
            elif el.tag == "attributes":
                # clef changes for the piano's staves; key/time handled below
                cl = [c for c in el.findall("clef")]
                if not cl:
                    continue
                at = ET.Element("attributes")
                for c in cl:
                    at.append(c)
                keep.append(Ev(at, e.onset, e.idx))
            elif el.tag == "direction":
                dyn = el.find("direction-type/dynamics")
                words = [w.text for w in el.iter("words")]
                if dyn is not None:
                    for dt in list(el.findall("direction-type")):
                        if dt.find("dynamics") is None:
                            el.remove(dt)
                    for s in el.findall("sound"):
                        el.remove(s)
                    keep.append(Ev(el, e.onset, e.idx))
                elif any(w and w.strip() in ("cresc.", "dim.", "decresc.") for w in words):
                    keep.append(Ev(el, e.onset, e.idx))
        head = ET.Element("attributes")
        if b == 1:
            ET.SubElement(head, "divisions").text = str(DIV)
        if b == 1 or key_here is not None:
            ET.SubElement(ET.SubElement(head, "key"), "fifths").text = str(fifths)
        if b == 1 or time_here is not None:
            t = ET.SubElement(head, "time", symbol="common")
            ET.SubElement(t, "beats").text = "4"
            ET.SubElement(t, "beat-type").text = "4"
        if b == 1:
            ET.SubElement(head, "staves").text = "2"
            for n, (s, l) in ((1, ("G", "2")), (2, ("F", "4"))):
                c = ET.SubElement(head, "clef", number=str(n))
                ET.SubElement(c, "sign").text = s
                ET.SubElement(c, "line").text = l
        # a clef stated at onset 0 joins the bar's first attributes
        for e in [x for x in keep if x.el.tag == "attributes" and x.onset == 0]:
            for c in e.el.findall("clef"):
                if b == 1:
                    continue
                head.append(c)
            keep.remove(e)
        if len(head):
            keep.insert(0, Ev(head, 0, -1))
        if b == 1:
            d = ET.Element("direction", placement="above")
            ET.SubElement(ET.SubElement(d, "direction-type"), "words").text = "Allegro"
            keep.append(Ev(d, 0, -1))
        if b == 89:
            d = ET.Element("direction", placement="above")
            ET.SubElement(ET.SubElement(d, "direction-type"), "words").text = "Recitativo"
            keep.append(Ev(d, 0, -1))
        serialize(pm, keep)
        # ---- voices
        for pid, sing, clef in (("P1", "S", ("G", "2")), ("P2", "F", ("F", "4"))):
            vm = ET.SubElement(parts[pid], "measure", number=str(b))
            evs = []
            at = ET.Element("attributes")
            if b == 1:
                ET.SubElement(at, "divisions").text = str(DIV)
            if b == 1 or key_here is not None:
                ET.SubElement(ET.SubElement(at, "key"), "fifths").text = str(fifths)
            if b == 1 or time_here is not None:
                t = ET.SubElement(at, "time", symbol="common")
                ET.SubElement(t, "beats").text = "4"
                ET.SubElement(t, "beat-type").text = "4"
            if b == 1:
                c = ET.SubElement(at, "clef")
                ET.SubElement(c, "sign").text = clef[0]
                ET.SubElement(c, "line").text = clef[1]
            if len(at):
                evs.append(Ev(at, 0, -1))
            toks = V.get((b, sing), [("r:w", None)])
            pos = 0
            for k, (tok, ly) in enumerate(toks):
                n, d = tok_note(tok, 1)
                if ly:
                    l = ET.SubElement(n, "lyric", number="1")
                    l.set("_text", ly)
                evs.append(Ev(n, pos, k))
                pos += d
            if pos != 96:
                print(f"WARN bar {b} {sing}: {pos / 24} quarters", file=sys.stderr)
            serialize(vm, evs)
    # ---- lyrics: syllabic from hyphens, across bars, per singer
    for pid in ("P1", "P2"):
        prev_open = False
        for n in parts[pid].iter("note"):
            l = n.find("lyric")
            if l is None:
                continue
            t = l.attrib.pop("_text")
            opens = t.endswith("-")
            t = t[:-1] if opens else t
            syl = ("middle" if opens else "end") if prev_open else ("begin" if opens else "single")
            ET.SubElement(l, "syllabic").text = syl
            parts_ = t.split("_")
            ET.SubElement(l, "text").text = parts_[0]
            for extra in parts_[1:]:
                ET.SubElement(l, "elision")
                ET.SubElement(l, "text").text = extra
            prev_open = opens
    # ---- sung notes: alter from key signature and accidentals in the bar
    for pid in ("P1", "P2"):
        for m in parts[pid].findall("measure"):
            b = int(m.get("number"))
            f = KEYS[b]
            keyalt = {s: (1 if f > 0 and s in SHARPS[:f] else -1 if f < 0 and s in SHARPS[::-1][: -f] else 0) for s in "CDEFGAB"}
            state = {}
            for n in m.iter("note"):
                p = n.find("pitch")
                if p is None:
                    continue
                st, o = p.findtext("step"), p.findtext("octave")
                a = n.attrib.pop("_alter")
                alt = int(a) if a != "" else state.get((st, o), keyalt[st])
                if a != "":
                    state[(st, o)] = alt
                if alt:
                    e = ET.Element("alter")
                    e.text = str(alt)
                    p.insert(1, e)
                if alt != state.get((st, o), keyalt[st]) or (a != "" and alt != keyalt[st]):
                    pass
    ET.indent(root, space="  ")
    with open(OUT, "wb") as fo:
        fo.write(b'<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">\n')
        ET.ElementTree(root).write(fo, encoding="utf-8", xml_declaration=False)


if __name__ == "__main__":
    main()
