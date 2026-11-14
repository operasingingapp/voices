#!/usr/bin/env python3
"""
layout_fix.py: moves what collides on the engraved page, as an engraver would, from the collisions found by
check.mjs (each piece engraved as a desktop page, a phone page and the single line). Only positions change: no
note, word or marking is added or taken away.

  - Two performance words at the same beat of the same staff: one marking, "poco allargando, con anima" (Verovio
    sets each piece's words on one line and never moves one out of the other's way).
  - Words or dynamics that still run into another marking, a hairpin or the notes: stacked one line further from
    the staff (relative-y), the later of the two moving.
  - Words below a sung staff that run into its lyrics: set above the staff instead.

  python3 scripts/layout_fix.py collisions.json content/pieces          (rewrites the scores it names)
"""
import json, re, sys
from collections import defaultdict
from lxml import etree

STEP = 22  # tenths of a staff space: about one line of text


def staff_map(root):
    """MEI's staff numbers (counted through the whole score) -> (part element, its own staff number)"""
    out, n = {}, 0
    for part in root.iter("part"):
        st = 1
        for a in part.iter("staves"):
            st = max(st, int(a.text))
            break
        for k in range(1, st + 1):
            n += 1
            out[n] = (part, k)
    return out


def direction_text(d):
    t = " ".join((w.text or "").strip() for w in d.iter("words"))
    dyn = " ".join(c.tag for dd in d.iter("dynamics") for c in dd if c.tag != "other-dynamics")
    dyn += " ".join((c.text or "") for dd in d.iter("dynamics") for c in dd if c.tag == "other-dynamics")
    return (t + " " + dyn).strip()


def norm(s):
    return re.sub(r"\s+", " ", s.replace(" ", " ")).strip().lower()


def measure_context(part, bar):
    """the bar element, with the divisions per quarter and the beat unit (time signature's lower number) in force"""
    div, beat_type = 1, 4
    for m in part.iter("measure"):
        for a in m.iter("attributes"):
            if a.findtext("divisions"):
                div = int(a.findtext("divisions"))
            if a.findtext("time/beat-type"):
                beat_type = int(a.findtext("time/beat-type"))
        if m.get("number") == str(bar):
            return m, div, beat_type
    return None, div, beat_type


def find_direction(part, bar, local_staff, text, kind=None, tstamp=None):
    """the direction a drawn marking comes from: by its words, else by its kind (dynamics or words) and beat"""
    m, div, beat_type = measure_context(part, bar)
    if m is None:
        return None
    want = norm(text)
    mine = [d for d in m.iter("direction") if int(d.findtext("staff") or 1) == local_staff]
    if want:
        for d in mine:
            got = norm(direction_text(d))
            if got and (got == want or want.replace(" ", "") == got.replace(" ", "") or want in got):
                return d
    if tstamp is None:
        return None
    t = float(tstamp)
    for d in mine:
        is_dyn = d.find(".//dynamics") is not None
        if kind == "dynam" and not is_dyn:
            continue
        if kind == "dir" and (is_dyn or d.find(".//words") is None):
            continue
        if kind == "tempo" and (is_dyn or (d.find(".//words") is None and d.find(".//metronome") is None)):
            continue
        beat = 1 + onset(d) / div * beat_type / 4
        if abs(beat - t) < 0.02:
            return d
    return None


def shift(d, amount):
    """moves a direction `amount` tenths away from its staff (up when above, down when below)"""
    sign = 1 if d.get("placement", "above") == "above" else -1
    for dt in d.iter("direction-type"):
        for c in dt:
            if c.tag in ("words", "dynamics", "metronome"):
                cur = float(c.get("relative-y") or 0)
                c.set("relative-y", str(int(cur + sign * amount)))


def only_words(d):
    return all(c.tag == "words" for dt in d.iter("direction-type") for c in dt) and d.find(".//words") is not None


def onset(d):
    """the direction's position in its bar, in divisions, from the backups and forwards before it"""
    t = 0
    for el in d.getparent():
        if el is d:
            return t
        if el.tag == "note" and el.find("chord") is None:
            t += int(el.findtext("duration") or 0)
        elif el.tag == "backup":
            t -= int(el.findtext("duration") or 0)
        elif el.tag == "forward":
            t += int(el.findtext("duration") or 0)
    return t


TEXT = ("dir", "dynam", "tempo")


def main(coll_file, pieces_dir):
    data = json.load(open(coll_file))
    report = defaultdict(lambda: defaultdict(int))
    for piece, cs in data.items():
        if not cs:
            continue
        path = f"{pieces_dir}/{piece}/score.musicxml"
        tree = etree.parse(path)
        root = tree.getroot()
        smap = staff_map(root)

        def locate(cls, text, attrs, bar):
            if cls not in TEXT or not attrs.get("staff"):
                return None
            n = int(attrs["staff"].split()[0])
            if n not in smap:
                return None
            part, local = smap[n]
            return find_direction(part, bar, local, text, cls, attrs.get('tstamp'))

        seen = set()
        for c in cs:
            key = (c["kind"], c["bar"], c["ta"], c["tb"])
            if key in seen:
                continue
            seen.add(key)
            a = locate(c["ca"], c["ta"], c["A"], c["bar"])
            b = locate(c.get("cb"), c["tb"], c["B"], c["bar"])
            if c["kind"] == "text-on-text" and a is not None and b is not None and a is not b:
                if a.get('_done') or b.get('_done'):
                    continue
                first, second = sorted([a, b], key=lambda d: (onset(d), list(d.getparent()).index(d)))
                if onset(first) == onset(second) and only_words(first) and only_words(second) \
                        and first.get("placement") == second.get("placement"):
                    w = first.find(".//words")
                    w.text = f"{(w.text or '').strip()}, {direction_text(second)}"
                    second.getparent().remove(second)
                    first.set('_done', '1')
                    report[piece]["merged"] += 1
                elif not second.get('_moved'):
                    shift(second, STEP)
                    second.set('_moved', '1')
                    report[piece]["stacked"] += 1
            elif c["kind"] in ("text-on-lyrics",):
                d = a if a is not None else b
                if d is None or d.get('_moved'):
                    continue
                part = d.getparent().getparent()
                sung = part.find(".//lyric") is not None
                if sung and d.get("placement") == "below":
                    d.set("placement", "above")
                    report[piece]["above the staff"] += 1
                else:
                    shift(d, STEP)
                    report[piece]["stacked"] += 1
                d.set('_moved', '1')
            elif c["kind"] in ("hairpin-on-text", "text-on-note"):
                d = a if a is not None else b
                if d is None or d.get('_moved'):
                    continue
                shift(d, STEP)
                d.set('_moved', '1')
                report[piece]["stacked"] += 1
        for el in root.iter('direction'):
            for k in ('_done', '_moved'):
                if k in el.attrib:
                    del el.attrib[k]
        if report.get(piece):
            tree.write(path, xml_declaration=True, encoding="UTF-8", doctype=tree.docinfo.doctype or None)
    for p, r in report.items():
        print(p, dict(r))


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
