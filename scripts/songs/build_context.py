#!/usr/bin/env python3
"""Writes src/standalone/songContext.json from context_data.py, adding each song's vocal range (lowest and highest
sung note of the voice part, cue notes left out) read from content/pieces/song-<id>/score.musicxml."""
import json, os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
from context_data import CYCLES, SONGS
import xml.etree.ElementTree as ET
REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
STEPS = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}
NAMES = ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"]
def rng(score, voice):
    root = ET.parse(score).getroot()
    part = next(p for p in root.iter("part") if p.get("id") == voice)
    ps = []
    for n in part.iter("note"):
        if n.find("rest") is not None or n.find("cue") is not None or n.find("pitch") is None: continue
        if n.get("print-object") == "no": continue
        p = n.find("pitch")
        alt = float(p.findtext("alter") or 0)
        acc = {-2: "𝄫", -1: "♭", 0: "", 1: "♯", 2: "𝄪"}[round(alt)]
        ps.append((12 * (int(p.findtext("octave")) + 1) + STEPS[p.findtext("step")] + round(alt),
                   f'{p.findtext("step")}{acc}{p.findtext("octave")}'))
    from collections import Counter
    lo, hi = min(m for m, _ in ps), max(m for m, _ in ps)
    name = lambda t: Counter(n for m, n in ps if m == t).most_common(1)[0][0]  # the extreme note's usual spelling
    lon, hin = name(lo), name(hi)
    return {"low": lon, "high": hin, "lowMidi": lo, "highMidi": hi}
out = {"cycles": CYCLES, "songs": {}}
for sid, c in SONGS.items():
    d = f"{REPO}/content/pieces/song-{sid}"
    man = json.load(open(f"{d}/manifest.json"))
    pid = next(m["source"]["xmlPartId"] for m in man["partMapping"] if m["key"] == "voice")
    out["songs"][sid] = {**c, "range": rng(f"{d}/score.musicxml", pid)}
json.dump(out, open(f"{REPO}/src/standalone/songContext.json", "w"), ensure_ascii=False, indent=1)
print(len(out["songs"]), "songs")
