"""tempi.py SONG_ID FACTOR : put a song's printed tempo changes back, scaled by FACTOR.

finish.py gives a song one playback tempo (from recordings). Where the OpenScore file has more than one <sound tempo>
(a slower middle section, a Recitativo, a ritardando written out as steps), this copies every one of them into the
voice part at its own place, multiplied by FACTOR, replacing the single tempo. Run with FACTOR = (tempo from
recordings) / (first printed tempo), import, then once more with the factor that brings the length back to the
recordings' median (see restore-all in the same folder's README note).
"""
import sys, re, glob, os, zipfile, json, unicodedata
ROOT = "/home/claude/voices"
sid, factor = sys.argv[1], float(sys.argv[2])
meta = json.load(open(f"{ROOT}/src/standalone/songMeta.json"))[sid]
path = meta["openscore"].replace("https://github.com/OpenScore/Lieder/tree/main/", "/home/claude/ext/Lieder/")
d = [p for p in glob.glob(os.path.dirname(path) + "/*") if unicodedata.normalize("NFC", p) == unicodedata.normalize("NFC", path)][0]
z = zipfile.ZipFile(glob.glob(d + "/*.mxl")[0])
orig = z.read(next(n for n in z.namelist() if n.endswith(".xml") and "META" not in n)).decode()

def marks(part_xml):
    out = []
    for m in re.finditer(r'<measure number="([^"]+)"[^>]*>(.*?)</measure>', part_xml, re.S):
        pos, last = 0, 0
        for el in re.finditer(r"<(note|backup|forward|direction)\b.*?</\1>|<sound\b[^>]*/>", m.group(2), re.S):
            t, body = (el.group(1) or "direction"), el.group(0)
            dur = int((re.search(r"<duration>(\d+)</duration>", body) or [0, 0])[1]) if t != "direction" else 0
            if t == "note":
                if "<chord" in body or "<grace" in body: continue
                last = pos; pos += dur
            elif t == "backup": pos -= dur
            elif t == "forward": pos += dur
            else:
                s = re.search(r'<sound tempo="([\d.]+)"', body)
                if s:
                    w = re.search(r"<words[^>]*>([^<]*)</words>", body)
                    out.append((m.group(1), pos, float(s.group(1)), (w.group(1).strip() if w else "")))
    return out

parts = re.findall(r'<part id="(P\d+)">(.*?)</part>', orig, re.S)
ms = sorted((mk for _, px in parts for mk in marks(px)), key=lambda mk: (int(re.sub(r"\D", "", mk[0]) or 0), mk[1]))
seen, marks_u = set(), []
for mk in ms:
    k = (mk[0], mk[1])
    if k not in seen: seen.add(k); marks_u.append(mk)

p = f"{ROOT}/content/pieces/song-{sid}/score.musicxml"
x = open(p, encoding="utf-8").read()
x = re.sub(r'<direction placement="above"><direction-type><words/></direction-type><sound tempo="[\d.]+"/></direction>', "", x)
x = re.sub(r'<direction placement="above" id="t\d+"><direction-type><words/></direction-type><sound tempo="[\d.]+"/></direction>', "", x)
x = re.sub(r'<sound tempo="[\d.]+"\s*/>', "", x)
i = x.index('<part id="P1"'); j = x.index("</part>", i)
part = x[i:j]
for k, (num, pos, bpm, _) in enumerate(marks_u):
    m = re.search(r'(<measure number="%s"[^>]*>)(.*?)(</measure>)' % re.escape(num), part, re.S)
    if not m: continue
    body = m.group(2)
    cur, at = 0, len(body)
    for el in re.finditer(r"<(note|backup|forward)\b.*?</\1>", body, re.S):
        t, b = el.group(1), el.group(0)
        dur = int((re.search(r"<duration>(\d+)</duration>", b) or [0, 0])[1])
        if t == "note" and ("<chord" in b or "<grace" in b): continue
        if t != "backup" and cur >= pos and (t == "note" or t == "forward"):
            at = el.start(); break
        cur = cur - dur if t == "backup" else cur + dur
    d_xml = f'<direction placement="above" id="t{k}"><direction-type><words/></direction-type><sound tempo="{round(bpm * factor, 2)}"/></direction>'
    body = body[:at] + d_xml + body[at:]
    part = part[:m.start(2)] + body + part[m.end(2):]
x = x[:i] + part + x[j:]
open(p, "w", encoding="utf-8").write(x)
print(sid, len(marks_u), "tempo marks:", [(n, round(b * factor, 1)) for n, _, b, _ in marks_u])
