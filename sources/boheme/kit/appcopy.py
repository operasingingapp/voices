# appcopy.py NEW.xml OLD_APP.xml OUT.xml [DROP_PART]: the app's copy of a rebuilt score: drop the ossia part, and carry over
# the tempo map (<sound tempo> per bar) of the previous app copy, via settempo.py
import re, sys, subprocess, xml.etree.ElementTree as ET
new, old, out = sys.argv[1:4]; drop = sys.argv[4] if len(sys.argv) > 4 else None
s = open(new).read()
if drop:
    s, n1 = re.subn(rf'\n\s*<score-part id="{drop}">.*?</score-part>', '', s, count=1, flags=re.S)
    s, n2 = re.subn(rf'\n\s*<part id="{drop}">.*?</part>', '', s, count=1, flags=re.S)
    assert n1 == n2 == 1 and f'id="{drop}"' not in s
open(out, 'w').write(s)
tm = []
for p in ET.parse(old).getroot().findall('part'):
    for m in p.findall('measure'):
        for snd in m.iter('sound'):
            if snd.get('tempo'): tm.append((int(m.get('number')), snd.get('tempo')))
tm = sorted(set(tm))
spec = ";".join(f"{b}:{t}" for b, t in tm)
print(subprocess.run(["python3", "/home/claude/ext/figaro/tools/settempo.py", out, spec], capture_output=True, text=True).stdout.strip(), spec)
