"""words.py SCORE.musicxml [LYRICS.txt] : the sung words of the voice part (P1), per verse, with the bar each starts in.

OpenScore files often carry wrong syllabic flags ("hol" begin, then "de" single), so words are not built from the flags.
They come from the song's lyrics file (OpenScore's lc*.txt, one numbered line per verse: "1. Du holde Kunst, ..."),
and each word is matched by its letters to the stream of sung syllables, as the app's importer does, to find its bar.
Without a lyrics file the syllables are joined on their flags (check the result).
Prints JSON: {"parts", "measures", "repeats", "verses": {"1": [[bar, word], ...]}, "unmatched": {...}}.
"""
import json, re, sys, unicodedata
import xml.etree.ElementTree as ET

def norm(s):
    s = unicodedata.normalize("NFD", s.lower())
    return "".join(c for c in s if c.isalpha())

def syllables(path, part_id="P1"):
    root = ET.parse(path).getroot()
    part = root.find(f"part[@id='{part_id}']")
    measures, repeats, out = [], [], {}
    for m in part.findall("measure"):
        num = m.get("number")
        measures.append(num)
        for r in m.iter("repeat"):
            repeats.append([num, r.get("direction")])
        for n in m.findall("note"):
            for ly in n.findall("lyric"):
                v = ly.get("number", "1")
                txt = "".join(t.text or "" for t in ly.findall("text")).strip()
                txt = re.sub(r"^\d+\.\s*", "", txt)
                if norm(txt):
                    out.setdefault(v, []).append([num, txt, (ly.findtext("syllabic") or "single").strip()])
    parts = [(p.get("id"), p.findtext("part-name")) for p in root.find("part-list").findall("score-part")]
    return parts, measures, repeats, out

def verses_from_txt(path):
    text = open(path, encoding="utf-8").read()
    vs = {}
    for line in text.splitlines():
        m = re.match(r"\s*(\d+)\.\s*(.*)", line)
        if m:
            vs[m.group(1)] = m.group(2).strip()
    if not vs and text.strip():
        vs["1"] = " ".join(text.split())
    return vs

def words_of(path, txt=None, part_id="P1"):
    parts, measures, repeats, syl = syllables(path, part_id)
    verses, unmatched = {}, {}
    poem = verses_from_txt(txt) if txt else {}
    for v, stream in syl.items():
        if v in poem:
            words = poem[v].split()
            res, i, acc = [], 0, ""
            for w in words:
                target = norm(w)
                if not target:
                    if res:
                        res[-1][1] += " " + w
                    continue
                bar = None
                got = ""
                while i < len(stream) and len(got) < len(target):
                    s = norm(stream[i][1])
                    if bar is None:
                        bar = stream[i][0]
                    got += s
                    i += 1
                    if got == target:
                        break
                if got != target:
                    unmatched.setdefault(v, []).append(f"{w} (score: {got})")
                res.append([bar, w])
            verses[v] = res
        else:
            res, cur = [], None
            for bar, t, s in stream:
                if s in ("single", "begin") or cur is None:
                    if cur:
                        res.append(cur)
                    cur = [bar, t]
                else:
                    cur[1] += t
                if s in ("single", "end"):
                    res.append(cur)
                    cur = None
            if cur:
                res.append(cur)
            verses[v] = res
    return {"parts": parts, "measures": measures, "repeats": repeats, "verses": verses, "unmatched": unmatched}

if __name__ == "__main__":
    print(json.dumps(words_of(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else None), ensure_ascii=False))
