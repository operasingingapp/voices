"""mkvdisp.py A.txt VDIFF_OUT SYSDIR OUT : voice dispute file from vdiff output, with system image per bar (from A's sys remarks)."""
import re, sys, os
A, VD, SYS, OUT = sys.argv[1:5]
sysof = {}; cur = None
for l in open(A):
    m = re.search(r'# (sys\d+) \(page (\d+)\)', l)
    if m: cur = os.path.join(SYS, f'{m.group(1)}_page{m.group(2)}.png')
    m = re.match(r'^(\d+) ', l)
    if m: sysof.setdefault(int(m.group(1)), cur)
o = []; n = 0
for l in open(VD):
    l = l.rstrip('\n'); m = re.match(r'^(\d+) (\w+)$', l)
    if m: o.append(f'== bar {m.group(1)} {m.group(2)}   image: {sysof.get(int(m.group(1)))}'); n += 1
    elif l.startswith('  A: '): o.append('X ' + l[5:])
    elif l.startswith('  B: '): o.append('Y ' + l[5:])
open(OUT, 'w').write('\n'.join(o) + '\n'); print(n, 'disputes')
