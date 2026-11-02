"""addpiece.py ROLE TITLE KIND ACT EDITIONID: list a piece under a Figaro role in operas.ts (idempotent)"""
import sys, re
role, title, kind, act, ed = sys.argv[1:6]
p = "src/standalone/operas.ts"; s = open(p).read()
if f'"editionId": "{ed}"' in s[: s.index('"id": "giovanni"') if '"id": "giovanni"' in s else len(s)] and s.count(f'"{ed}"') and f'"id": "{act}: {title}"' in s:
    # already listed for some role; still check this role below
    pass
i = s.index(f'"id": "{role}"')
j = s.index('"pieces": [', i)
if s.startswith('"pieces": []', j):   # empty list: open it up so the entry lands in this role
    s = s[:j] + '"pieces": [\n    ]' + s[j + len('"pieces": []'):]
k = s.index("\n    ]", j)
block = s[j:k]
if f'"editionId": "{ed}"' in block:
    print("already", role); sys.exit()
entry = f''',
     {{
      "title": "{title}",
      "kind": "{kind} · {act}",
      "id": "{act}: {title}",
      "editionId": "{ed}"
     }}'''
# the last entry ends with "\n     }"; an empty list takes the entry without its leading comma
if not block.strip().rstrip("[").strip().endswith("}"): entry = entry[1:]
s = s[:k] + entry + s[k:]
open(p, "w").write(s); print("added", role)
