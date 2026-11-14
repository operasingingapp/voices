"""respell.py : correct misprinted words in song scores and their language files together.

Each fix: (song, bar, lyric verse, old syllable(s), new syllable(s), old word letters, new word).
The score's syllable text in that bar of the voice part is replaced; the word in language.json (and the sources'
draft/filled copies) whose letters match is renamed, keeping its punctuation, and a gloss note about the misprint
is dropped. Run once.
"""
import json, re, unicodedata, glob
ROOT = "/home/claude/voices"
FIX = [
 ("schubert-die-forelle", "31", 1, "lien", "lein", "Bächlien", "Bächlein"),
 ("schubert-du-bist-die-ruh", "45", 1, "die", "dei", "diener", "deiner"),
 ("schubert-ave-maria", "12", None, "end", "tend", "bitend", "bittend"),
 ("schubert-erlkonig", "94", 1, "sing", "sin", "singgen", "singen"),
 ("schumann-der-nussbaum", "13", 1, "lich", "lieb", "lichliche", "liebliche"),
 ("brahms-wiegenlied", "17", 1, "wir", "wie", "wirder", "wieder"),
 ("strauss-cacilie", "36", 1, "scha", "schaf", "weltschafendem", "weltschaffendem"),
 ("mahler-ging-heut-morgen-ubers-feld", "35", 1, "chem,", "chen,", "Glöckchem", "Glöckchen"),
 ("mahler-ging-heut-morgen-ubers-feld", "66", 1, "fleng", "fing", "fleng", "fing"),
 ("mahler-ging-heut-morgen-ubers-feld", "72", 1, "kein", "keln", "funkein", "funkeln"),
 ("mahler-ging-heut-morgen-ubers-feld", "108", 1, "Nuu", "Nun", "Nuu", "Nun"),
 ("berlioz-absence", "46", 1, "maux,", "meaux,", "hamaux", "hameaux"),
 ("chausson-le-colibri", "34", 1, "ò", "ô", "ò", "ô"),
 ("chausson-le-colibri", "35", 1, "eut", "eût", "eut", "eût"),
 ("massenet-elegie", "22", 1, "cœr", "cœur", "cœr", "cœur"),
 ("tosti-ideale", "10", 1, "no", "not", "note", "notte"),
 ("gounod-serenade", "8", 1, "te", "tes", "chante", "chantes"),
 ("faure-lydia", "11", 1, "lui", "luit", "lui", "luit"),
 ("faure-lydia", "29", 1, "meur,", "meurs,", "meur", "meurs"),
 ("faure-lydia", "33", 1, "Ò", "Ô", "Ò", "Ô"),
 ("faure-les-roses-d-ispahan", "17", 1, "fruis,", "frais,", "fruis", "frais"),
 ("faure-les-roses-d-ispahan", "46", 1, "voi", "vol", "voi", "vol"),
 ("debussy-mandoline", "36", 1, "bre", "bres", "ombre", "ombres"),
 ("debussy-c-est-l-extase-langoureuse", "23", 1, "su", "sur", "susure", "susurre"),
 ("debussy-c-est-l-extase-langoureuse", "44", 1, "s'e", "s'ex", "s'exale", "s'exhale"),
 ("debussy-c-est-l-extase-langoureuse", "45", 1, "xa", "ha", None, None),
 ("debussy-green", "39", 1, "rout.", "ront.", "délasserout", "délasseront"),
 ("berlioz-villanelle", "13", 1, "Tout", "Tous", "Tout", "Tous"),
 ("berlioz-villanelle", "28", 1, "vois", "voit", "vois", "voit"),
]
def letters(s):
    s = unicodedata.normalize("NFC", s.lower())
    return "".join(c for c in s if c.isalpha())
MIS = re.compile(r"\s*[\(\[;,]?\s*[^()\[\];]*(misprint|typo|misspel|printed as|score has|score spells|score's spelling|as printed|for “?\w+”? \(|intended)[^()\[\]]*[\)\]]?", re.I)
done = []
for song, bar, verse, old, new, wold, wnew in FIX:
    p = f"{ROOT}/content/pieces/song-{song}/score.musicxml"
    x = open(p, encoding="utf-8").read()
    i = x.index('<part id="P1"'); j = x.index("</part>", i)
    part = x[i:j]
    m = re.search(r'<measure number="%s"[^>]*>.*?</measure>' % re.escape(bar), part, re.S)
    seg = m.group(0)
    if verse is None:
        pat = r"(<text>)%s(</text>)" % re.escape(old)
    else:
        pat = r'(<lyric number="%d"[^>]*>(?:(?!</lyric>).)*?<text>)%s(</text>)' % (verse, re.escape(old))
    seg2, n = re.subn(pat, lambda mm: mm.group(1) + new + mm.group(2), seg, count=1, flags=re.S)
    assert n == 1, (song, bar, old)
    part = part[:m.start()] + seg2 + part[m.end():]
    open(p, "w", encoding="utf-8").write(x[:i] + part + x[j:])
    if not wold:
        continue
    for f in [f"{ROOT}/content/pieces/song-{song}/language.json"]:
        d = json.load(open(f)); hit = 0
        for ph in d["phrases"]:
            for w in ph["words"]:
                if letters(w[0]) == letters(wold) and (verse is None or ph["verse"] == verse or True):
                    w[0] = w[0].replace(wold, wnew) if wold in w[0] else w[0].replace(wold.capitalize(), wnew.capitalize())
                    w[1] = MIS.sub("", w[1]).strip(" ,;") or w[1]
                    hit += 1
            ph["original"] = " ".join(w[0] for w in ph["words"])
        assert hit, (song, wold)
        json.dump(d, open(f, "w"), ensure_ascii=False, indent=1)
    for f in glob.glob(f"{ROOT}/sources/songs/song-{song}/draft.json") + glob.glob(f"/home/claude/ext/songs/song-{song}/draft.json"):
        d = json.load(open(f))
        for ph in d["phrases"]:
            for w in ph["words"]:
                if letters(w[0]) == letters(wold): w[0] = w[0].replace(wold, wnew)
        json.dump(d, open(f, "w"), ensure_ascii=False, indent=1)
    for f in glob.glob(f"{ROOT}/sources/songs/song-{song}/filled.json") + glob.glob(f"/home/claude/ext/songs/song-{song}/filled.json"):
        d = json.load(open(f))
        for ph in d["phrases"]:
            for w in ph[1]:
                if letters(w[0]) == letters(wold): w[0] = w[0].replace(wold, wnew); w[1] = MIS.sub("", w[1]).strip(" ,;") or w[1]
        json.dump(d, open(f, "w"), ensure_ascii=False, indent=1)
    done.append(f"{song}: {wold} → {wnew}")
print("\n".join(done))
