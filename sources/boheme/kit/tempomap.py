"""tempomap.py SCORE "BAR[@Q]:BPM:TEXT;..." [--no-ramps]
Rewrite a score's playback tempo map (quarters per minute) for the app:
- every old <sound tempo> is removed (a voice part's tempo-only direction, hidden in the app anyway, goes whole);
- each section tempo is written at its bar (and quarter offset Q) on the first part, with its printed words TEXT
  (the app treats a tempo with words as a section's own tempo);
- the printed rall. / rit. / allarg. (and affrett. / string. / animando / accel.) are written out as gradual steps
  every eighth, so the app's steady practice tempo plays them: to about 0.80 of the tempo (poco 0.90, molto 0.68),
  over the span to the next "a tempo" or section tempo, at most two bars; then back to the section's tempo.
"""
import re, sys, xml.etree.ElementTree as ET

f, spec = sys.argv[1], sys.argv[2]
ramps_on = "--no-ramps" not in sys.argv
head = open(f).read().split("<score-partwise", 1)[0]
t = ET.parse(f); r = t.getroot()
parts = r.findall("part")
P1 = parts[0]
divs = int(P1.find("measure/attributes/divisions").text)

# bar starts (quarters) from the first part's notes
starts, lens, cur = {}, {}, 0.0
for m in P1.findall("measure"):
    b = int(m.get("number")); pos = mx = 0
    for el in m:
        if el.tag == "note" and el.find("chord") is None and el.find("grace") is None:
            pos += int(el.findtext("duration") or 0); mx = max(mx, pos)
        elif el.tag == "backup": pos -= int(el.findtext("duration"))
        elif el.tag == "forward": pos += int(el.findtext("duration")); mx = max(mx, pos)
    starts[b] = cur; lens[b] = mx / divs; cur += mx / divs
END = cur
bars = sorted(starts)

def bar_at(q):
    k = bars[0]
    for b in bars:
        if starts[b] <= q + 1e-9: k = b
    return k

# words in any part, with their position
words = []
for P in parts:
    for m in P.findall("measure"):
        b = int(m.get("number")); pos = 0
        for el in m:
            if el.tag == "note" and el.find("chord") is None and el.find("grace") is None: pos += int(el.findtext("duration") or 0)
            elif el.tag == "backup": pos -= int(el.findtext("duration"))
            elif el.tag == "forward": pos += int(el.findtext("duration"))
            elif el.tag == "direction":
                off = int(el.findtext("offset") or 0)
                for w in el.iter("words"):
                    if (w.text or "").strip(): words.append((starts[b] + (pos + off) / divs, w.text.strip()))

# 1. remove the old tempo map
voice_ids = [p.get("id") for p in parts[:-1]]
for P in parts:
    for m in P.findall("measure"):
        for d in list(m.findall("direction")):
            s = d.find("sound")
            if s is None or not s.get("tempo"): continue
            if P.get("id") in voice_ids: m.remove(d)
            else:
                del s.attrib["tempo"]
                if not s.attrib: d.remove(s)

# 2. section tempi
base = []
for item in spec.split(";"):
    a, bpm, *txt = item.split(":", 2)
    bar, _, q = a.partition("@")
    base.append((starts[int(bar)] + float(q or 0), float(bpm), (txt[0] if txt else "").strip()))
base.sort()

def add(q, bpm, text):
    b = bar_at(q); m = P1.find(f"measure[@number='{b}']")
    d = ET.Element("direction"); dt = ET.SubElement(d, "direction-type"); w = ET.SubElement(dt, "words"); w.text = text
    off = round((q - starts[b]) * divs)
    if off: ET.SubElement(d, "offset").text = str(off)
    ET.SubElement(d, "sound", tempo=f"{bpm:g}")
    kids = list(m); i = next((k for k, x in enumerate(kids) if x.tag in ("note", "backup", "forward", "direction")), len(kids))
    m.insert(i, d)

for q, bpm, text in base: add(q, bpm, text)

def base_at(q):
    v = base[0][1]
    for bq, bb, _ in base:
        if bq <= q + 1e-9: v = bb
    return v

# 3. the written-out rall. / accel.
made = []
if ramps_on:
    SLOW = re.compile(r"\b(rall|rit(?![a-z])|allarg|ritard|rallent|slent|stent)", re.I)
    FAST = re.compile(r"\b(affrett|string|accel|animando|incalz)", re.I)
    RESET = re.compile(r"\btempo\b", re.I)
    resets = sorted({q for q, w in words if RESET.search(w)} | {q for q, _, _ in base})
    seen = []; made_end = []
    for q, w in sorted(words):
        slow, fast = SLOW.search(w), FAST.search(w)
        if not (slow or fast) or RESET.search(w) and not slow: continue
        if any(abs(q - bq) < 0.01 for bq, _, _ in base): continue  # a section's own heading
        if any(abs(q - s) < 1.0 for s in seen) or (made_end and q < made_end[-1] - 1e-6): continue
        seen.append(q)
        b = bar_at(q)
        end = min([x for x in resets if x > q + 1e-6] + [q + 2 * max(lens[b], 1.0), END])
        if end - q < 0.75: continue
        lw = w.lower()
        f_ = (0.90 if "poco" in lw else 0.68 if "molto" in lw else 0.80) if slow else (1.06 if "poco" in lw else 1.12)
        b0 = base_at(q); n = max(3, round((end - q) / 0.5))
        for k in range(1, n + 1):
            add(q + (end - q) * (k - 1) / n, b0 * (1 + (f_ - 1) * k / n), "")
        if end < END - 1e-6 and not any(abs(end - x) < 1e-6 for x, _, _ in base): add(end, b0, "")
        made_end.append(end)
        made.append(f"{bar_at(q)}:{w}->{bar_at(end - 1e-6)}x{f_}")

# directions at one spot in the order they were added: sort each bar's new tempo directions by offset
ET.indent(t, space="  ")
open(f, "w").write(head + ET.tostring(r, encoding="unicode"))
print("sections", [(bar_at(q), bpm) for q, bpm, _ in base]); print("ramps", made)
