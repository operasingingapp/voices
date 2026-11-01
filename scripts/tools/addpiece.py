"""addpiece.py ROLE TITLE KIND ACT EDITIONID: list a piece under a Figaro role in operas.ts (idempotent)"""
import sys, re
role, title, kind, act, ed = sys.argv[1:6]
p = "src/standalone/operas.ts"; s = open(p).read()
if f'"editionId": "{ed}"' in s[: s.index('"id": "giovanni"') if '"id": "giovanni"' in s else len(s)] and s.count(f'"{ed}"') and f'"id": "{act}: {title}"' in s:
    # already listed for some role; still check this role below
    pass
i = s.index(f'"id": "{role}"')
j = s.index('"pieces": [', i)
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
# the last entry ends with "\n     }"
s = s[:k] + entry + s[k:]
open(p, "w").write(s); print("added", role)
