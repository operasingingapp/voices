"""Build one number of Figaro pp. 16-36 from the checked sung lines (voices.txt) and the scan's piano.
usage: python3 build2.py PIECE voices.txt out.xml
Bars are PRINTED bars (barmap.json). The scan's measures are mapped to them (a bar the scan split at a system
break is joined again). Divisions 24 per quarter."""
import copy, re, sys, json
import xml.etree.ElementTree as ET
sys.argv_saved = sys.argv; sys.argv = sys.argv[:1]
from n1build import parse, serialize, tok_note, parse_line, Ev, SHARPS
sys.argv = sys.argv_saved
DIV = 24
PIECE, VOICES, OUT = sys.argv[1], sys.argv[2], sys.argv[3]

# printed bar -> list of scan measures (1-based) in the main scan
def main_map(b):
    if b <= 149: return [b]
    if b == 150: return [150, 151]
    if b <= 167: return [b + 1]
    if b == 168: return [169, 170]
    if b <= 172: return [b + 2]
    if b == 173: return [175, 176]
    if b <= 179: return [b + 3]
    if b == 180: return [183, 184]
    if b <= 329: return [b + 4]
    return RECIT3[b]
RECIT3 = {}  # filled from recit3map.json when present
try:
    RECIT3 = {int(k): v for k, v in json.load(open('recit3map.json')).items()}
except FileNotFoundError:
    pass
def aria_map(b):
    k = b - 351
    if k <= 64: return [k]
    if k == 65: return [65, 66]
    return [k + 1]

PIECES = {
    "no2": dict(bars=(1, 144), title="Le nozze di Figaro: No. 2 Duettino (Se a caso madama)",
                singers=[("S", "Susanna", "S.", ("G", "2")), ("F", "Figaro", "F.", ("F", "4"))], src="orig.xml", map=main_map, tempo="Allegro"),
    "recit2": dict(bars=(145, 184), title="Le nozze di Figaro: Recitativo (Or bene, ascolta e taci)",
                   singers=[("S", "Susanna", "S.", ("G", "2")), ("F", "Figaro", "F.", ("F", "4"))], src="orig.xml", map=main_map, tempo="Recitativo"),
    "bravo": dict(bars=(185, 198), title="Le nozze di Figaro: Recitativo (Bravo, signor padrone)",
                  singers=[("F", "Figaro", "F.", ("F", "4"))], src="orig.xml", map=main_map, tempo="Moderato"),
    "no3": dict(bars=(199, 329), title="Le nozze di Figaro: No. 3 Cavatina (Se vuol ballare)",
                singers=[("F", "Figaro", "F.", ("F", "4"))], src="orig.xml", map=main_map, tempo="Allegretto"),
    "recit3": dict(bars=(330, 351), title="Le nozze di Figaro: Recitativo (Ed aspettaste il giorno)",
                   singers=[("M", "Marcellina", "M.", ("G", "2")), ("B", "Bartolo", "B.", ("F", "4"))], src="orig.xml", map=main_map, tempo="Recitativo"),
    "no4": dict(bars=(352, 455), title="Le nozze di Figaro: No. 4 Aria (La vendetta)",
                singers=[("B", "Bartolo", "B.", ("F", "4"))], src="aria/orig.xml", map=aria_map, tempo="Allegro con spirito"),
}
P = PIECES[PIECE]
src = ET.parse(P["src"]).getroot()
SP = {p.get("id"): p.findall("measure") for p in src.findall("part")}
PIDS = list(SP)

# divisions, key, time in force at every scan measure (any part states them)
state = {"div": {}, "fifths": 0, "time": (4, 4)}
INFO = []
CLEF = {}   # (pid, staff) -> (sign, line), in force at the START of each scan measure: CLEFS[i]
CLEFS = []
for i in range(len(SP[PIDS[0]])):
    key_here = time_here = None
    for pid in PIDS:
        for at in SP[pid][i].findall("attributes"):
            if at.find("divisions") is not None:
                state["div"][pid] = int(at.findtext("divisions"))
            if at.find("key/fifths") is not None:
                key_here = int(at.findtext("key/fifths"))
            if at.find("time/beats") is not None:
                time_here = (int(at.findtext("time/beats")), int(at.findtext("time/beat-type")))
    if key_here is not None: state["fifths"] = key_here
    if time_here is not None: state["time"] = time_here
    INFO.append(dict(div=dict(state["div"]), fifths=state["fifths"], time=state["time"]))
    CLEFS.append(dict(CLEF))
    for pid in PIDS:
        for at in SP[pid][i].findall("attributes"):
            for c in at.findall("clef"):
                CLEF[(pid, int(c.get("number") or 1))] = (c.findtext("sign"), c.findtext("line"))

def has_lyrics(m): return m.find(".//lyric") is not None
def has_notes(m): return any(n.find("pitch") is not None for n in m.findall("note"))
def piano_pid(i):
    if P["src"] != "orig.xml": return "P2"
    m2 = SP["P2"][i]
    if has_lyrics(m2): return "P3"
    if has_notes(m2): return "P2"
    return "P3" if has_notes(SP["P3"][i]) else "P2"

def load_voices(path, codes):
    V = {}
    for line in open(path, encoding="utf-8"):
        line = line.strip()
        if not line or line.startswith("#"): continue
        mt = re.match(r"(\d+)\s+([A-Z]):\s*(.*)$", line)
        if not mt: raise SystemExit(f"bad line: {line}")
        if mt.group(2) in codes: V[(int(mt.group(1)), mt.group(2))] = parse_line(mt.group(3))
    return V

def main():
    codes = [s[0] for s in P["singers"]]
    V = load_voices(VOICES, codes)
    root = ET.Element("score-partwise", version="3.1")
    ET.SubElement(ET.SubElement(root, "work"), "work-title").text = P["title"]
    ident = ET.SubElement(root, "identification")
    ET.SubElement(ident, "creator", type="composer").text = "Wolfgang Amadeus Mozart"
    ET.SubElement(ident, "creator", type="lyricist").text = "Lorenzo Da Ponte"
    ET.SubElement(ident, "rights").text = "Music and text public domain. Piano reduction by Paul Klengel (Breitkopf & Härtel, Edition Breitkopf 1716)."
    pl = ET.SubElement(root, "part-list")
    vids = [f"P{k+1}" for k in range(len(P["singers"]))]
    pno = f"P{len(P['singers'])+1}"
    for pid, (code, name, ab, _) in zip(vids, P["singers"]):
        sp = ET.SubElement(pl, "score-part", id=pid); ET.SubElement(sp, "part-name").text = name; ET.SubElement(sp, "part-abbreviation").text = ab
    sp = ET.SubElement(pl, "score-part", id=pno); ET.SubElement(sp, "part-name").text = "Piano"; ET.SubElement(sp, "part-abbreviation").text = "Pno."
    parts = {pid: ET.SubElement(root, "part", id=pid) for pid in vids + [pno]}
    b0, b1 = P["bars"]
    fifths = time = None
    keys = {}
    for b in range(b0, b1 + 1):
        ms = P["map"](b)
        inf = INFO[ms[0] - 1]
        # the bar's time: a joined bar takes the first half's signature
        new_key = inf["fifths"] if inf["fifths"] != fifths else None
        new_time = inf["time"] if inf["time"] != time else None
        fifths, time = inf["fifths"], inf["time"]
        keys[b] = fifths
        barlen = DIV * 4 * time[0] // time[1]
        # ---- piano
        pm = ET.SubElement(parts[pno], "measure", number=str(b))
        keep, off = [], 0
        for i1 in ms:
            i = i1 - 1
            pid = piano_pid(i)
            sm = SP[pid][i]
            from fractions import Fraction
            scale = Fraction(DIV, INFO[i]["div"].get(pid, INFO[i]["div"].get(PIDS[0], 24)))
            evs = parse(sm, scale); vmap = {}; length = 0
            for e in evs: e.onset = int(round(e.onset))
            for e in evs:
                el = copy.deepcopy(e.el)
                if e.is_note:
                    st = e.staff
                    if st not in (1, 2): continue
                    for ly in el.findall("lyric"): el.remove(ly)
                    d = el.find("duration")
                    if d is not None: d.text = str(max(1, int(round(int(d.text) * scale))))
                    nv = vmap.setdefault((st, e.voice), (1 if st == 1 else 5) + len([k for k in vmap if k[0] == st]))
                    el.find("voice").text = str(nv)
                    keep.append(Ev(el, off + e.onset, e.idx))
                    if not e.grace and el.find("chord") is None: length = max(length, e.onset + int(d.text if d is not None else 0))
                elif el.tag == "attributes":
                    cl = el.findall("clef")
                    if cl:
                        at = ET.Element("attributes")
                        for c in cl: at.append(c)
                        keep.append(Ev(at, off + e.onset, e.idx))
                elif el.tag == "direction":
                    dyn = el.find("direction-type/dynamics")
                    words = [w.text for w in el.iter("words")]
                    if dyn is not None:
                        for dt in list(el.findall("direction-type")):
                            if dt.find("dynamics") is None: el.remove(dt)
                        for s in el.findall("sound"): el.remove(s)
                        keep.append(Ev(el, off + e.onset, e.idx))
                    elif any(w and w.strip() in ("cresc.", "dim.", "decresc.") for w in words):
                        keep.append(Ev(el, off + e.onset, e.idx))
            off += length if len(ms) > 1 else 0
        head = ET.Element("attributes")
        if b == b0: ET.SubElement(head, "divisions").text = str(DIV)
        if b == b0 or new_key is not None: ET.SubElement(ET.SubElement(head, "key"), "fifths").text = str(fifths)
        if b == b0 or new_time is not None:
            t = ET.SubElement(head, "time"); ET.SubElement(t, "beats").text = str(time[0]); ET.SubElement(t, "beat-type").text = str(time[1])
        if b == b0:
            ET.SubElement(head, "staves").text = "2"
            i0 = ms[0] - 1; pp = piano_pid(i0)
            for n, dflt in ((1, ("G", "2")), (2, ("F", "4"))):
                s_, l_ = CLEFS[i0].get((pp, n), dflt)
                c = ET.SubElement(head, "clef", number=str(n)); ET.SubElement(c, "sign").text = s_; ET.SubElement(c, "line").text = l_
        for e in [x for x in keep if x.el.tag == "attributes" and x.onset == 0]:
            if b != b0:
                for c in e.el.findall("clef"): head.append(c)
            keep.remove(e)
        if len(head): keep.insert(0, Ev(head, 0, -1))
        if b == b0:
            d = ET.Element("direction", placement="above")
            ET.SubElement(ET.SubElement(d, "direction-type"), "words").text = P["tempo"]
            keep.append(Ev(d, 0, -1))
        serialize(pm, keep)
        # ---- dynamics printed on the sung staves (the scan's parts that carry words), by onset in the bar
        vdyn, off2 = [], 0
        for i1 in ms:
            i = i1 - 1
            from fractions import Fraction
            for pid in PIDS:
                if pid == piano_pid(i) or (P["src"] != "orig.xml" and pid != "P1"): continue
                m_ = SP[pid][i]
                if P["src"] == "orig.xml" and pid != "P1" and not has_lyrics(m_): continue
                sc = Fraction(DIV, INFO[i]["div"].get(pid, 24))
                for e in parse(m_, sc):
                    if e.el.tag == "direction" and e.el.find("direction-type/dynamics") is not None:
                        vdyn.append((int(round(off2 + e.onset)), [c.tag for c in e.el.find("direction-type/dynamics")]))
            off2 += 0  # joined halves: second half's onsets follow the first half
        # ---- voices
        onsets = {}
        for pid, (code, name, ab, clef) in zip(vids, P["singers"]):
            pos = 0; ons = []
            for tok, ly in V.get((b, code), []):
                if not tok.startswith("r:") and not tok.startswith("g:"): ons.append(pos)
                if not tok.startswith("g:"):
                    n_, d_ = tok_note(tok.replace("!", ""), 1); pos += d_
            onsets[code] = ons
        def who(on):
            best = None
            for code in onsets:
                for o in onsets[code]:
                    d = abs(o - on)
                    if d <= 12 and (best is None or d < best[0]): best = (d, code)
            return best[1] if best else None
        dyn_for = {}
        for on, kinds in vdyn:
            c = who(on)
            if c and kinds: dyn_for.setdefault(c, []).append((min(onsets[c], key=lambda o: abs(o - on)), kinds[0]))
        for pid, (code, name, ab, clef) in zip(vids, P["singers"]):
            vm = ET.SubElement(parts[pid], "measure", number=str(b))
            evs = []; at = ET.Element("attributes")
            if b == b0: ET.SubElement(at, "divisions").text = str(DIV)
            if b == b0 or new_key is not None: ET.SubElement(ET.SubElement(at, "key"), "fifths").text = str(fifths)
            if b == b0 or new_time is not None:
                t = ET.SubElement(at, "time"); ET.SubElement(t, "beats").text = str(time[0]); ET.SubElement(t, "beat-type").text = str(time[1])
            if b == b0:
                c = ET.SubElement(at, "clef"); ET.SubElement(c, "sign").text = clef[0]; ET.SubElement(c, "line").text = clef[1]
            if len(at): evs.append(Ev(at, 0, -1))
            full = {96: "r:w", 72: "r:h.", 48: "r:h", 36: "r:q.", 24: "r:q"}.get(barlen, "r:w")
            toks = V.get((b, code))
            if toks is None:
                print(f"WARN bar {b} {code}: missing, rest", file=sys.stderr); toks = [(full, None)]
            pos = 0
            for k, (tok, ly) in enumerate(toks):
                fermata = tok.endswith("!") or "!~" in tok
                tok = tok.replace("!", "")
                n, d = tok_note(tok, 1)
                if fermata:
                    nt = n.find("notations")
                    if nt is None: nt = ET.SubElement(n, "notations")
                    ET.SubElement(nt, "fermata", type="upright")
                if ly:
                    l = ET.SubElement(n, "lyric", number="1"); l.set("_text", ly)
                evs.append(Ev(n, pos, k)); pos += d
            if pos != barlen: print(f"WARN bar {b} {code}: {pos / 24} quarters, bar is {barlen / 24}", file=sys.stderr)
            for on, kind in dyn_for.get(code, []):
                d = ET.Element("direction", placement="above")
                ET.SubElement(ET.SubElement(ET.SubElement(d, "direction-type"), "dynamics"), kind)
                evs.append(Ev(d, on, -1))
            serialize(vm, evs)
    for pid in vids:
        prev_open = False
        for n in parts[pid].iter("note"):
            l = n.find("lyric")
            if l is None: continue
            t = l.attrib.pop("_text"); opens = t.endswith("-"); t = t[:-1] if opens else t
            syl = ("middle" if opens else "end") if prev_open else ("begin" if opens else "single")
            ET.SubElement(l, "syllabic").text = syl
            ps = t.split("_"); ET.SubElement(l, "text").text = ps[0]
            for extra in ps[1:]:
                ET.SubElement(l, "elision"); ET.SubElement(l, "text").text = extra
            prev_open = opens
        for m in parts[pid].findall("measure"):
            f = keys[int(m.get("number"))]
            keyalt = {s: (1 if f > 0 and s in SHARPS[:f] else -1 if f < 0 and s in SHARPS[::-1][:-f] else 0) for s in "CDEFGAB"}
            st8 = {}
            for n in m.iter("note"):
                p = n.find("pitch")
                if p is None: continue
                s_, o = p.findtext("step"), p.findtext("octave")
                a = n.attrib.pop("_alter")
                alt = int(a) if a != "" else st8.get((s_, o), keyalt[s_])
                if a != "": st8[(s_, o)] = alt
                if alt:
                    e = ET.Element("alter"); e.text = str(alt); p.insert(1, e)
    ET.indent(root, space="  ")
    with open(OUT, "wb") as fo:
        fo.write(b'<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">\n')
        ET.ElementTree(root).write(fo, encoding="utf-8", xml_declaration=False)

main()
