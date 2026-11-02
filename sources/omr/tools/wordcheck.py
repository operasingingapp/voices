"""wordcheck.py VOICES.txt [...] : join each singer's syllables into words and check every word against the 1786
libretto (DME critical text, lv9.txt). Reports words not in the libretto, and words whose accents/apostrophes differ
from the libretto spelling (the print may differ on purpose: then keep the print, but look at it)."""
import re, sys, unicodedata
from collections import defaultdict
def strip(w): return ''.join(c for c in unicodedata.normalize('NFD', w) if unicodedata.category(c) != 'Mn')
def key(w): return re.sub(r"[^a-z]", "", strip(w.lower()))
lib = defaultdict(set)
for w0 in re.findall(r"[A-Za-zÀ-ÿ'’]+", open('/home/claude/ext/figaro/lv9.txt', encoding='utf-8').read().replace('’', "'")):
    for w in [w0] + re.split(r"(?<=')", w0):
        if w.strip("'"): lib[key(w)].add(w.lower().strip("'"))
for f in sys.argv[1:]:
    words = []
    for l in open(f, encoding='utf-8'):
        m = re.match(r'^(\d+) (\w+): (.*)$', l.strip())
        if not m: continue
        for s in re.findall(r'"([^"]*)"', m.group(3)): words.append((int(m.group(1)), m.group(2), s))
    cur = defaultdict(str); start = {}
    out = []
    for b, who, s in words:
        if who not in start or not cur[who]: start[who] = b
        cur[who] += s.rstrip('-')
        if not s.endswith('-'):
            for w in re.split(r"[_\s]+", cur[who]):
                w = w.strip(".,;:!?«»\"()…")
                if not w: continue
                parts = [w] if key(w) in lib else [x for x in re.split(r"(?<=')", w) if x]  # dell'onor -> dell' + onor
                for p in parts:
                    k = key(p)
                    if not k: continue
                    if k not in lib: out.append(f"{start[who]} {who}: '{p}' NOT IN LIBRETTO")
                    elif p.lower().strip("'") not in lib[k]: out.append(f"{start[who]} {who}: '{p}' libretto has {sorted(lib[k])}")
            cur[who] = ''
    print(f"== {f}: {len(out)} to look at"); print('\n'.join(out))
