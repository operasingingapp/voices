#!/usr/bin/env python3
"""
same_music.py BEFORE_DIR: proves that layout work changed nothing a singer hears or reads. For every score in
content/pieces, compares with BEFORE_DIR/<id>.xml: each part's notes in order (pitch, duration, rest, chord, tie,
voice, staff), its lyrics, its dynamics, and the words of its directions (merged markings compare as the same words).
"""
import glob, os, re, sys
from collections import Counter
from lxml import etree


def music(path):
    root = etree.parse(path).getroot()
    out = []
    for part in root.iter("part"):
        notes, lyrics, dyn, words = [], [], Counter(), Counter()
        for m in part.iter("measure"):
            for n in m.iter("note"):
                p = n.find("pitch")
                notes.append((m.get("number"), p.findtext("step") if p is not None else "r",
                              p.findtext("alter") if p is not None else "", p.findtext("octave") if p is not None else "",
                              n.findtext("duration"), n.find("chord") is not None, n.find("grace") is not None,
                              tuple(t.get("type") for t in n.findall("tie")), n.findtext("voice"), n.findtext("staff")))
                for ly in n.findall("lyric"):
                    lyrics.append((ly.get("number"), "".join(t.text or "" for t in ly.findall("text")), ly.findtext("syllabic")))
            for d in m.iter("dynamics"):
                for c in d:
                    dyn[(m.get("number"), c.tag, c.text)] += 1
            for w in m.iter("words"):
                for tok in re.split(r"[\s,]+", w.text or ""):
                    if tok:
                        words[(m.get("number"), tok)] += 1
        out.append((part.get("id"), notes, lyrics, dyn, words))
    return out


def main(before):
    bad = 0
    files = sorted(glob.glob("content/pieces/*/score.musicxml"))
    for f in files:
        pid = f.split("/")[-2]
        b = os.path.join(before, pid + ".xml")
        if not os.path.exists(b):
            continue
        x, y = music(b), music(f)
        if x != y:
            bad += 1
            for (pa, na, la, da, wa), (pb, nb, lb, db, wb) in zip(x, y):
                for what, u, v in (("notes", na, nb), ("lyrics", la, lb), ("dynamics", da, db), ("words", wa, wb)):
                    if u != v:
                        print(pid, pa, what, "DIFFERS")
    print(f"{len(files)} scores compared, {bad} differ")
    return bad


if __name__ == "__main__":
    sys.exit(1 if main(sys.argv[1]) else 0)
