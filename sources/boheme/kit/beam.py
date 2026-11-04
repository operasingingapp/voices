"""Beam eighths and shorter as an engraved edition does (Breitkopf-style):
- piano: eighths beamed by half bar in 4/4 (by beat when the half has 16ths), by beat in 2/4 and 3/4, the whole bar in
  3/8, by dotted quarter in 6/8; 16ths and shorter get their extra beams within the beat (hooks for a single one).
- sung lines: as printed in old vocal scores, a note with its own syllable keeps its flag; only the notes of one
  syllable (a melisma) are beamed together, within the same beat group.
Rests, longer notes and grace notes break a beam. Existing <beam> elements are replaced.
usage: beam.py IN.xml [OUT.xml]"""
import sys
import xml.etree.ElementTree as ET
from fractions import Fraction as F

IN = sys.argv[1]
OUT = sys.argv[2] if len(sys.argv) > 2 else IN
head = open(IN, encoding="utf-8").read().split("<score-partwise", 1)[0]
t = ET.parse(IN)
r = t.getroot()
LEVEL = {"eighth": 1, "16th": 2, "32nd": 3, "64th": 4, "128th": 5}
ORDER = ["pitch", "unpitched", "rest", "duration", "tie", "instrument", "footnote", "level", "voice", "type", "dot",
         "accidental", "time-modification", "stem", "notehead", "notehead-text", "staff", "beam", "notations", "lyric", "play", "listen"]


def put_beams(n, beams):
    for b in n.findall("beam"):
        n.remove(b)
    if not beams:
        return
    kids = list(n)
    # insert after the last child that comes before <beam> in the schema order
    pos = 0
    for i, k in enumerate(kids):
        if k.tag in ORDER and ORDER.index(k.tag) < ORDER.index("beam"):
            pos = i + 1
    for j, (lvl, kind) in enumerate(beams):
        e = ET.Element("beam", number=str(lvl))
        e.text = kind
        n.insert(pos + j, e)


def groups_for(beats, btype, has_short):
    """beam group length (in quarters) for level-1 beams"""
    bar = F(4 * beats, btype)
    if btype == 8 and beats % 3 == 0:
        return F(3, 2) if beats > 3 else bar
    if btype == 8:
        return bar
    if beats == 4 and btype == 4:
        return F(1) if has_short else F(2)
    if beats == 2 and btype == 2:
        return F(1) if has_short else F(2)
    return F(1)


for part in r.findall("part"):
    pid = part.get("id")
    is_piano = any((sp.get("id") == pid and (sp.findtext("part-name") or "").lower().startswith("piano")) for sp in r.iter("score-part"))
    divs = 1
    beats, btype = 4, 4
    for m in part.findall("measure"):
        for at in m.findall("attributes"):
            if at.find("divisions") is not None:
                divs = int(at.findtext("divisions"))
            if at.find("time") is not None:
                beats, btype = int(at.findtext("time/beats")), int(at.findtext("time/beat-type"))
        # notes by voice with onsets (in quarters)
        pos = 0
        last_on = 0
        byv = {}
        for e in m:
            if e.tag == "backup":
                pos -= int(e.findtext("duration"))
            elif e.tag == "forward":
                pos += int(e.findtext("duration"))
            elif e.tag == "note":
                for b in e.findall("beam"):
                    e.remove(b)
                if e.find("chord") is not None:
                    continue
                if e.find("grace") is not None:
                    continue
                d = int(e.findtext("duration") or 0)
                byv.setdefault((e.findtext("staff") or "1", e.findtext("voice") or "1"), []).append((F(pos, divs), F(d, divs), e))
                last_on = pos
                pos += d
        for notes in byv.values():
            has16 = {}
            for on, d, n in notes:
                if LEVEL.get(n.findtext("type"), 0) >= 2:
                    has16[int(on // 2)] = True
            # cut into beamable runs
            runs = []
            cur = []
            prev_g = None
            for on, d, n in notes:
                lvl = LEVEL.get(n.findtext("type"), 0)
                half = int(on // 2)
                g = groups_for(beats, btype, has16.get(half, False))
                gi = int(on // g)
                beamable = lvl >= 1 and n.find("rest") is None
                if beamable and not is_piano:
                    # a sung note with its own syllable starts a new group (it keeps its flag unless a melisma follows)
                    if n.find("lyric") is not None and cur:
                        runs.append(cur)
                        cur = []
                if not beamable or (cur and gi != prev_g):
                    if cur:
                        runs.append(cur)
                    cur = []
                if beamable:
                    cur.append((on, d, n, lvl))
                    prev_g = gi
            if cur:
                runs.append(cur)
            for run in runs:
                if len(run) < 2:
                    put_beams(run[0][2], [])
                    continue
                beams = {id(x[2]): [] for x in run}
                for L in range(1, 6):
                    k = 0
                    while k < len(run):
                        if run[k][3] < L:
                            k += 1
                            continue
                        j = k
                        # higher levels are broken at each beat
                        while j + 1 < len(run) and run[j + 1][3] >= L and (L == 1 or int(run[j + 1][0]) == int(run[k][0]) or btype == 8):
                            j += 1
                        if L == 1:
                            for q in range(k, j + 1):
                                beams[id(run[q][2])].append((1, "begin" if q == k else "end" if q == j else "continue"))
                        elif j > k:
                            for q in range(k, j + 1):
                                beams[id(run[q][2])].append((L, "begin" if q == k else "end" if q == j else "continue"))
                        else:
                            hook = "forward hook" if k == 0 or (k + 1 < len(run) and int(run[k + 1][0]) == int(run[k][0])) else "backward hook"
                            beams[id(run[k][2])].append((L, hook))
                        k = j + 1
                for x in run:
                    put_beams(x[2], beams[id(x[2])])

ET.indent(t, space="  ")
with open(OUT, "wb") as o:
    o.write(head.encode())
    t.write(o, encoding="utf-8", xml_declaration=False)
print("beamed", OUT, sum(1 for _ in r.iter("beam")))
