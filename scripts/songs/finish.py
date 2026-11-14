"""finish.py EDITION_ID : write a song's language.json from its filled draft, set its tempo, and its app entry.

Reads /home/claude/ext/songs/<id>/draft.json (phrases cut by prep.py) and filled.json:
  {"tempo": {"bpm": N, "beat": "quarter"|"half"|"eighth"|"dotted-quarter", "basis": "..."},
   "phrases": [[translation, [[word, gloss], ...], phrase_ipa, gloss_group_or_null], ...]   (same order and words as the draft)
   "facts": {"key": "...", "time": "..."}, "notes": "..."}
Every word's IPA is the matching word of the phrase IPA (space separated; "‿" joins an elision into one word).
Writes language.json, the score's <sound tempo> (quarter notes per minute), and src/standalone/songMeta.json[<id>].
"""
import json, re, sys
ROOT = "/home/claude/voices"
eid = sys.argv[1]
W = f"/home/claude/ext/songs/{eid}"
draft = json.load(open(f"{W}/draft.json"))
filled = json.load(open(f"{W}/filled.json"))
info = json.load(open(f"{W}/info.json"))
ph_in = draft["phrases"]
ph_f = filled["phrases"]
assert len(ph_in) == len(ph_f), f"{len(ph_in)} draft phrases, {len(ph_f)} filled"
problems = []
out = []
for d, f in zip(ph_in, ph_f):
    tr, words, ipa, groups = (f + [None])[:4]
    dw = [w[0] for w in d["words"]]
    fw = [w[0] for w in words]
    if dw != fw:
        problems.append(f"{d['id']}: words differ: {dw} / {fw}")
        continue
    ipas = ipa.split()
    if len(ipas) != len(words):
        problems.append(f"{d['id']}: {len(words)} words, {len(ipas)} IPA words")
        continue
    gg = []
    for g in (groups or []):
        if isinstance(g, list) and len(g) == 2 and isinstance(g[0], list):
            gg.append({"words": g[0], "gloss": g[1]})
    if groups and isinstance(groups, list) and len(groups) == 2 and isinstance(groups[0], list) and isinstance(groups[1], str):
        gg = [{"words": groups[0], "gloss": groups[1]}]
    out.append({"id": d["id"], "role": "voice", "verse": d["verse"], "occurrence": d["occurrence"], "startMeasure": d["startMeasure"],
                "original": " ".join(dw), "translation": tr, "ipa": ipa,
                "words": [[w, g, i] for (w, g), i in zip(words, ipas)], "glossGroups": gg, "audio": {}})
if problems:
    print("\n".join(problems)); sys.exit(1)
lang = {"editionId": eid, "language": draft["language"], "review": {"status": "unreviewed"},
        "notes": filled.get("notes", ""), "phrases": out}
json.dump(lang, open(f"{ROOT}/content/pieces/{eid}/language.json", "w"), ensure_ascii=False, indent=1)
# tempo: quarter notes per minute for <sound tempo>
t = filled["tempo"]; mult = {"quarter": 1, "half": 2, "eighth": 0.5, "dotted-quarter": 1.5, "dotted-half": 3, "whole": 4}[t["beat"]]
q = round(t["bpm"] * mult, 2)
p = f"{ROOT}/content/pieces/{eid}/score.musicxml"
x = open(p, encoding="utf-8").read()
x = re.sub(r'<sound tempo="[\d.]+"\s*/>', "", x)
m = re.search(r'(<part id="[^"]+">\s*<measure[^>]*>)', x)
x = x[:m.end()] + f'<direction placement="above"><direction-type><words/></direction-type><sound tempo="{q}"/></direction>' + x[m.end():]
open(p, "w", encoding="utf-8").write(x)
meta_p = f"{ROOT}/src/standalone/songMeta.json"
try:
    meta = json.load(open(meta_p))
except FileNotFoundError:
    meta = {}
beat = {"quarter": "♩", "half": "half note", "eighth": "♪", "dotted-quarter": "♩.", "dotted-half": "dotted half", "whole": "whole note"}[t["beat"]]
meta[info["songId"]] = {"editionId": eid, "key": filled["facts"]["key"], "time": filled["facts"]["time"],
                        "tempo": f"{beat} = {t['bpm']}" + (f" (♩ = {q:g})" if t["beat"] != "quarter" else ""), "tempoBasis": t["basis"], "tempoWords": ", ".join(w.strip() for w in info["tempoWords"][:1] if w.strip()),
                        "poet": info["poet"], "openscore": info["openscore"], "imslp": info["imslp"], "transcription": info["transcription"]}
json.dump(dict(sorted(meta.items())), open(meta_p, "w"), ensure_ascii=False, indent=1)
print(eid, len(out), "phrases, tempo", q)
