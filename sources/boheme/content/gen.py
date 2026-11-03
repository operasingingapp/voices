import re, json, sys
SRC = "/home/claude/ext/boheme/draft/app-boheme.md"
R = "/home/claude/voices/src/standalone/"
md = open(SRC, encoding="utf-8").read()
lines = md.split("\n")
q = lambda s: json.dumps(s, ensure_ascii=False)

def section(name):
    start = next(i for i,l in enumerate(lines) if l.startswith("# " + name))
    end = next((i for i in range(start+1, len(lines)) if lines[i].startswith("# ")), len(lines))
    return lines[start:end]

# STORY
story = section("STORY")[1].strip()
# acts
acts = []
for l in section("STORY")[2:]:
    if l.startswith("## "): acts.append({"title": l[3:].strip(), "where": None, "paras": []})
    elif l.startswith("where: "): acts[-1]["where"] = l[7:].strip()
    elif l.startswith("- "): acts[-1]["paras"].append(l[2:].strip())
# cast
cast = []
for l in section("CAST"):
    m = re.match(r"- \[C-(\w+)\] (.+?) \(([^)]*)\): (.+)$", l)
    if m: cast.append(dict(id=m[1], name=m[2], voice=m[3], desc=m[4]))
# running order
sc = section("RUNNING ORDER")
scenes = []
for i,l in enumerate(sc):
    m = re.match(r"\[S(\d+)\] (Act \d) \| (.+?) \| (.+?) \| sings: (.+?) \| on stage: (.+)$", l)
    if m:
        what = sc[i+2].strip()
        who = [x.strip() for x in m[5].split(",")]
        also = [] if m[6].strip()=="-" else [x.strip() for x in m[6].split(",")]
        scenes.append(dict(n=int(m[1]), act=m[2], title=m[3], kind=m[4], who=who, also=also, what=what))
assert len(scenes)==30, len(scenes)
# arcs
arcs = {}
for l in section("CHARACTER ARCS"):
    m = re.match(r"\[A-(\w+)-\d+\] .+? · (Act \d): (.+)$", l)
    if m: arcs.setdefault(m[1], []).append((m[2], m[3]))
# when
whens = {}
for l in section('"WHEN"'):
    m = re.match(r"\[W-\d+\] (.+?) — when: (.+)$", l)
    if m: whens[m[1]] = m[2]
assert len(whens)==9
# lists check
for l in section("EACH CHARACTER"):
    m = re.match(r"\[L-(\w+)\] .+?: (.+)$", l)
    if m:
        lst = [x.strip() for x in m[2].split(" | ")]
        derived = [s["title"] for s in scenes if m[1] in s["who"]]
        assert lst == derived, (m[1], lst, derived)
ids = [c["id"] for c in cast]
for s in scenes:
    for x in s["who"]+s["also"]: assert x in ids, x

# ---- scenes.ts block
out = ["  boheme: ["]
for act in ["Act 1","Act 2","Act 3","Act 4"]:
    out.append(f'    ...A({q(act)}, [')
    for s in [s for s in scenes if s["act"]==act]:
        parts = [q(s["title"]), q(s["kind"]), "[" + ", ".join(q(x) for x in s["who"]) + "]", q(s["what"])]
        if s["also"]: parts.append("[" + ", ".join(q(x) for x in s["also"]) + "]")
        out.append("      [" + ", ".join(parts) + "],")
    out.append("    ]),")
out.append("  ],")
scenes_block = "\n".join(out)

# ---- synopses block
out = ["  boheme: ["]
for a in acts:
    out += ["    {", f'      title: {q(a["title"])},', f'      where: {q(a["where"])},', "      paras: ["]
    out += [f"        {q(p)}," for p in a["paras"]]
    out += ["      ],", "    },"]
out.append("  ],")
syn_block = "\n".join(out)

# ---- arcs block
out = ["  // ---------------- La bohème ----------------"]
for cid in ids:
    out.append(f'  "boheme:{cid}": [')
    for act, text in arcs[cid]:
        out.append(f"    {{ act: {q(act)}, text: {q(text)} }},")
    out.append("  ],")
arcs_block = "\n".join(out)

# ---- operas entry
AVATAR = dict(rodolfo="curls", mimi="long", musetta="hat", marcello="short", colline="beard",
              schaunard="hat", benoit="beard", alcindoro="hat", parpignol="cap", sergente="cap", doganiere="cap")
first = {  # existing first-pass pieces, kept as they were (title, kind), with the scene they match
  "rodolfo": [("Che gelida manina","Aria · Act 1","Ah!… Che gelida manina"),("O soave fanciulla","Duet with Mimì · Act 1","O soave fanciulla"),("O Mimì, tu più non torni","Duet with Marcello · Act 4","O Mimì tu più non torni")],
  "mimi": [("Sì, mi chiamano Mimì","Aria · Act 1","Si. Mi chiamano Mimì"),("O soave fanciulla","Duet with Rodolfo · Act 1","O soave fanciulla"),("Donde lieta uscì","Aria · Act 3","Vai?… Donde lieta uscì")],
  "musetta": [("Quando m'en vo'","Waltz · Act 2","Quando me'n vo'")],
  "marcello": [("O Mimì, tu più non torni","Duet with Rodolfo · Act 4","O Mimì tu più non torni")],
  "colline": [("Vecchia zimarra, senti","Aria · Act 4","Vecchia zimarra")],
}
byTitle = {s["title"]: s for s in scenes}
chars = []
for c in cast:
    voice = c["voice"]; desc = c["desc"]
    if ";" in voice:
        v, note = [x.strip() for x in voice.split(";",1)]
        voice = v; desc = f"{desc} ({note[0].upper()}{note[1:]}.)"
    pieces = []
    have = set()
    for t,k,st in first.get(c["id"], []):
        p = {"title": t, "kind": k}
        if st in whens: p["when"] = whens[st]
        pieces.append(p); have.add(st)
    # a WHEN line for a number this singer sings, with no first-pass entry to carry it
    for st, w in whens.items():
        s = byTitle[st]
        if c["id"] in s["who"] and st not in have:
            pieces.append({"title": st, "kind": f'{s["kind"]} · {s["act"]}', "id": f'{s["act"]}: {st}', "when": w})
    chars.append({"id": c["id"], "name": c["name"], "voice": voice, "desc": desc, "avatar": AVATAR[c["id"]], "pieces": pieces})
entry = {"id":"boheme","title":"La bohème","composer":"Puccini","composerFull":"Giacomo Puccini","year":1896,"librettist":"Luigi Illica and Giuseppe Giacosa","lang":"it","chars":chars}
entry_txt = "\n".join(" "+l for l in json.dumps(entry, indent=1, ensure_ascii=False).split("\n"))

def replace_between(path, start_pat, end_pat, new):
    t = open(path, encoding="utf-8").read()
    i = t.index(start_pat); j = t.index(end_pat, i)
    t = t[:i] + new + t[j:]
    open(path, "w", encoding="utf-8").write(t)

replace_between(R+"scenes.ts", "  boheme: [\n", "\n\n  tosca: [", scenes_block)
replace_between(R+"synopses.tsx", "  boheme: [\n", "\n\n  tosca: [", syn_block)
replace_between(R+"arcs.ts", "  // ---------------- La bohème ----------------", "\n\n  // ---------------- Tosca", arcs_block)
replace_between(R+"operas.ts", ' {\n  "id": "boheme",', ',\n {\n  "id": "tosca",', entry_txt)
replace_between(R+"opera-extra.ts", "  boheme:\n    ", "\n  tosca:", "  boheme:\n    " + q(story) + ",")
print("ok")
