"""merge.py BASE.txt JUDGE.txt OUT.txt : BASE reading with judged bars replaced.
Piano: every RH/LH line of a judged bar is replaced by the judge's lines. Voices: the judged (bar, singer) line is replaced."""
import re, sys
base, judge, out = sys.argv[1:4]
J = {}
for l in open(judge):
    m = re.match(r'^(\d+) (\w+):', l)
    if m: J.setdefault(int(m.group(1)), []).append((m.group(2), l.rstrip('\n')))
piano = lambda k: re.match(r'^(RH|LH)\d$', k)
o = []; done = set()
for l in open(base):
    m = re.match(r'^(\d+) (\w+):', l)
    if m and int(m.group(1)) in J:
        b, k = int(m.group(1)), m.group(2); jl = J[b]
        if piano(k) and any(piano(x) for x, _ in jl):
            if (b, 'P') not in done: o += [x for kk, x in jl if piano(kk)]; done.add((b, 'P'))
            continue
        rep = [x for kk, x in jl if kk == k]
        if rep:
            o += rep; done.add((b, k)); continue
    o.append(l.rstrip('\n'))
miss = [(b, k) for b, jl in J.items() for k, _ in jl if not ((b, 'P') in done or (b, k) in done)]
if miss: print('judge lines not placed (no such bar/singer in base):', miss, file=sys.stderr)
open(out, 'w').write('\n'.join(o) + '\n')
