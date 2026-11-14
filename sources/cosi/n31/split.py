"""split.py IN OUTDIR: cut the Così fan tutte No. 31 Finale (671 bars, Peters pp. 311-366) into the app's nine Act 2
finale pieces ([S66]-[S74] in app-cosi.md).

Each piece: bars renumbered from 1; divisions/key/time/clefs restated in bar 1; the tempo in force restated in bar 1
(every cut falls on a printed tempo mark, so none has to be supplied); only the singers who sing in the range, plus the
piano (the chorus staves are kept where the chorus sings); part ids renumbered P1.. (piano last); ties and slurs that
cross a cut ended cleanly (only the dangling half is dropped); light-heavy final barline; 2/2 shown as cut time;
identification fixed to Mozart / Da Ponte / Soldan (Peters; the input carries a Puccini/Ricordi template).
Bar 204, the first bar of the Allegro, ends the toast (the sisters' and Ferrando's "cor", Guglielmo's "-nor.)") and
starts the notary scene: it is the last bar of "E nel tuo, nel mio bicchiero" and the first of "Miei signori, tutto
è fatto", as bar 62 of No. 18 was.
Lyric fix (text only, no note changed): "vi-sta,o" (Despina and Don Alfonso, bars 58, 60, 64) carried "sta,o" as one
text, the comma glued to the elided "o"; it is written as "sta," + elision + "o", the file's own encoding of two words
on one note (bar 62 already has "sta" + elision + "o").
Bar 289 (piano): the <backup> after the RH's 9:8 run of 32nds is 3357 ticks; the bar is 3360 (the run's own durations,
8 x 93 + 96, already add up), so it is set to 3360 and the LH ends on the bar line. No note changes.
Lyric dots (the QUALITY rule): the print's "..." after "contradote" (Despina, bar 278), "vostri" (Don Alfonso, bar 319) and
"mio" (the sisters, bar 320) becomes one "…", where the libretto has its ellipsis. There are no other dot runs.
"""
import copy, sys, xml.etree.ElementTree as ET

IN, OUTDIR = sys.argv[1], sys.argv[2]
# (editionId, first bar, last bar, title)
PIECES = [
    ("mozart-fate-presto-o-cari-amici", 1, 65, "Fate presto, o cari amici"),
    ("mozart-benedetti-i-doppi-coniugi", 66, 172, "Benedetti i doppi conjugi"),
    ("mozart-e-nel-tuo-nel-mio-bicchiero", 173, 204, "E nel tuo, nel mio bicchiero"),
    ("mozart-miei-signori-tutto-e-fatto", 204, 289, "Miei signori, tutto è fatto"),
    ("mozart-bella-vita-militar-finale", 290, 371, "Bella vita militar"),
    ("mozart-sani-e-salvi", 372, 440, "Sani e salvi agli amplessi amorosi"),
    ("mozart-giusto-ciel-voi-qui-scriveste", 441, 495, "Giusto ciel! Voi qui scriveste"),
    ("mozart-a-voi-sinchina", 496, 575, "A voi s'inchina"),
    ("mozart-fortunato-luom-che-prende", 576, 671, "Fortunato l'uom che prende"),
]
TEMPO_WORD = {}
DOUBLE_BAR = []

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


def fix_backup(root):
    # bar 289, piano: the RH ends with the 9:8 run of 32nds (8 x 93 + 96 = 840 ticks, as REPORT.md says), but the
    # <backup> to the LH was left at 3357 instead of the bar's 3360, so the LH ran 3 ticks past the bar line.
    for p in root.findall("part"):
        for m in p.findall("measure"):
            if m.get("number") == "289":
                for b in m.findall("backup"):
                    if b.findtext("duration") == "3357":
                        b.find("duration").text = "3360"


def fix_lyrics(root):
    for ly in root.iter("lyric"):
        for t in ly.findall("text"):
            if t.text and t.text.endswith("..."):
                t.text = t.text[:-3] + "…"
        for i, t in enumerate(list(ly)):
            if t.tag == "text" and t.text == "sta,o":
                t.text = "sta,"
                el = ET.Element("elision")
                t2 = ET.Element("text")
                t2.text = "o"
                ly.insert(i + 1, el)
                ly.insert(i + 2, t2)


def cut(eid, A, B, title):
    t = ET.parse(IN)
    r = t.getroot()
    fix_lyrics(r)
    fix_backup(r)
    r.find("work/work-title").text = f"Così fan tutte: No. 31 Finale, {title}"
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
        # (also when the input's P1, which carries the tempo marks, is not kept: Fiordiligi does not sing in the first piece)
        if p is r.findall("part")[0] and tempo_dir and (tempo_dir[0] != A or parts[0].get("id") not in keep):
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
