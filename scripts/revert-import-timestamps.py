"""Undo data/content files whose only change after `npm run import` is the importedAt timestamp (compares parsed JSON)."""
import json, subprocess, sys
def strip(o):
    if isinstance(o, dict): return {k: strip(v) for k, v in o.items() if k != "importedAt"}
    if isinstance(o, list): return [strip(v) for v in o]
    return o
files = subprocess.run(["git", "diff", "--name-only", "--", "data/content"], capture_output=True, text=True).stdout.split()
kept = 0
for f in files:
    if not f.endswith(".json"): kept += 1; continue
    old = subprocess.run(["git", "show", f"HEAD:{f}"], capture_output=True, text=True).stdout
    try: same = strip(json.loads(old)) == strip(json.load(open(f)))
    except Exception: same = False
    if same: subprocess.run(["git", "checkout", "-q", "--", f])
    else: kept += 1; print("changed:", f)
print(f"{len(files)-kept} timestamp-only reverted, {kept} real changes kept")
