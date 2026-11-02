"""mkpiece.py CONFIG.json : put a finished number into the app (content dir, manifest, PIECE_INFO, role lists, Verovio).
CONFIG: {id,title,subtitle,kind,act,score,lang,pages,bars,afterText,roles:[[roleId,name,voiceType,xmlPartId,listUnderRole]],
         piano:xmlPartId, facts:{key,time,tempo}, portrait, note, about, spellings}"""
import json, sys, os, shutil, re
C = json.load(open(sys.argv[1])); V = "/home/claude/voices"
d = f"{V}/content/pieces/{C['id']}"; os.makedirs(d, exist_ok=True)
shutil.copy(C["score"], f"{d}/score.musicxml")
L = json.load(open(C["lang"])); L["editionId"] = C["id"]; json.dump(L, open(f"{d}/language.json", "w"), ensure_ascii=False, indent=1)
roles = [{"id": r[0], "name": r[1], "voiceType": r[2], "partKey": r[0]} for r in C["roles"]]
pm = [{"key": "piano", "label": "Piano", "shortLabel": "Piano", "kind": "piano", "source": {"xmlPartId": C["piano"], "staves": [1, 2]},
       "channel": 0, "program": 0, "velocityScale": 0.8, "defaultVolume": 0.7}]
for i, r in enumerate(C["roles"]):
    pm.append({"key": r[0], "label": f"{r[1]} ({r[2]})", "shortLabel": r[1], "kind": "voice", "roleId": r[0], "source": {"xmlPartId": r[3]},
               "channel": 3 + i, "program": 0, "velocityScale": 0.85, "defaultVolume": 1.0})
man = {"editionId": C["id"], "editionVersion": "1.0.0-klengel", "title": C["title"], "subtitle": C["subtitle"], "kind": C["kind"].lower(), "fixture": False,
       "pedal": "classical", "composer": "Wolfgang Amadeus Mozart", "librettist": "Lorenzo Da Ponte", "language": "it",
       "files": {"musicxml": "score.musicxml", "language": "language.json", "audioDir": "audio"}, "roles": roles, "partMapping": pm,
       "passages": [{"id": "a", "label": "The whole piece", "start": "1", "end": str(C["bars"])}],
       "licences": [
        {"item": "Music", "source": "W. A. Mozart, Le nozze di Figaro, K. 492 (1786)", "author": "Wolfgang Amadeus Mozart (1756–1791)", "licence": "Public domain", "notes": ""},
        {"item": "Libretto text", "source": "Lorenzo Da Ponte, libretto of Le nozze di Figaro (1786)", "author": "Lorenzo Da Ponte (1749–1838)", "licence": "Public domain", "notes": "Words as printed in the Breitkopf vocal score."},
        {"item": "Score (score.musicxml)", "source": f"Breitkopf & Härtel vocal score (Edition Breitkopf 1716, about 1900), pages {C['pages']}", "author": "Paul Klengel (1854–1935), piano reduction", "licence": "Public domain",
         "notes": "Written out from the printed pages: sung lines and piano each transcribed independently (the piano's second reading from a scan where one was supplied), disagreements settled on the page by a separate judge, then checked bar by bar by an independent checker and corrected."},
        {"item": "IPA, gloss and translation", "source": "Written for this app", "author": "Counterpart development team", "licence": "CC0 1.0", "notes": "Unreviewed by a diction coach."}]}
json.dump(man, open(f"{d}/manifest.json", "w"), ensure_ascii=False, indent=1)
# PIECE_INFO
p = f"{V}/src/standalone/pieces.tsx"; s = open(p).read()
if f'"{C["id"]}": {{' not in s:
    f = C["facts"]
    entry = f'''  "{C["id"]}": {{
    portrait: "{C["portrait"]}",
    opera: "Le nozze di Figaro",
    kind: "{C["kind"]}",
    facts: {{
      key: {json.dumps(f["key"], ensure_ascii=False)},
      time: {json.dumps(f["time"], ensure_ascii=False)},
      tempo: {json.dumps(f["tempo"], ensure_ascii=False)},
    }},
    notePlaceholder: {json.dumps(C["note"], ensure_ascii=False)},
    about: (
      <>
        <p>
          {C["about"]}
          Written out from the printed pages: the sung lines and the piano each read independently, every disagreement settled on the page by a separate judge, then
          checked bar by bar against the page by an independent checker and corrected. Only the Italian words are kept, with the engraving's spellings{C.get("spellings","")}.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  }},
'''
    k = s.index(f'  "{C["afterText"]}": {{')
    s = s[:k] + entry + s[k:]; open(p, "w").write(s)
# roles
os.chdir(V)
for r in C["roles"]:
    if len(r) > 4 and r[4]:
        os.system(f'python3 scripts/tools/addpiece.py {r[4]} "{C["title"]}" "{C["kind"]}" "{C["act"]}" {C["id"]}')
# verovio
e = f"{V}/src/score/engines.ts"; s = open(e).read()
if f'"{C["id"]}"' not in s:
    s = s.replace('new Set<string>([', f'new Set<string>(["{C["id"]}", '); open(e, "w").write(s)
print("piece in place:", C["id"])
