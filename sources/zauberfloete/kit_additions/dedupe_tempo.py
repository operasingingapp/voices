# dedupe_tempo.py FILE.xml : after kit/tempomap.py, drop a words-only direction whose text equals a tempo direction's text in the same bar
import re, sys
f = sys.argv[1]; s = open(f).read(); n = 0
def fix(m):
    global n
    meas = m.group(0)
    dirs = re.findall(r'\s*<direction[^>]*>.*?</direction>', meas, re.S)
    withsound = {re.search(r'<words>(.*?)</words>', d).group(1) for d in dirs if '<sound tempo' in d and '<words>' in d}
    for d in dirs:
        w = re.search(r'<words>(.*?)</words>', d)
        if w and '<sound' not in d and w.group(1) in withsound:
            meas = meas.replace(d, '', 1); n += 1
    return meas
s = re.sub(r'<measure [^>]*>.*?</measure>', fix, s, flags=re.S)
open(f, 'w').write(s); print('tempo words deduped:', n)
