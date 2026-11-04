"""barmatch.py A.txt B.txt : align two readings bar-by-bar on content (pitches, piano or voice token files).
Prints only the places where the bar numbering of A and B goes out of step (a bar missing, extra, or split)."""
import re, sys
from collections import Counter
def load(f):
    D = {}
    for l in open(f):
        m = re.match(r'^(\d+) (\w+):\s*(.*)$', l.strip())
        if not m: continue
        toks = re.sub(r'"[^"]*"', '', m.group(3)).split()
        c = D.setdefault(int(m.group(1)), Counter())
        for t in toks:
            if ':' not in t or t.startswith(('dyn:', 'word:', 'clef:')): continue
            if t.startswith(('trem1:', 'trem2:')): t = t.split(':', 1)[1].replace('|', '+')
            if t.startswith('g:'): t = t[2:]
            p = t.rsplit(':', 1)[0]
            if p == 'r': continue
            for x in p.split('+'): c[x.replace('n', '')] += 1
    return D
def sim(a, b):
    if not a and not b: return 1.0
    return sum((a & b).values()) / max(sum((a | b).values()), 1)
A, B = load(sys.argv[1]), load(sys.argv[2])
ka, kb = sorted(A), sorted(B)
n, m = len(ka), len(kb); G = 0.45
S = [[0.0] * (m + 1) for _ in range(n + 1)]; T = [[None] * (m + 1) for _ in range(n + 1)]
for i in range(1, n + 1): S[i][0] = -G * i; T[i][0] = 'a'
for j in range(1, m + 1): S[0][j] = -G * j; T[0][j] = 'b'
for i in range(1, n + 1):
    for j in range(1, m + 1):
        opts = [(S[i-1][j-1] + sim(A[ka[i-1]], B[kb[j-1]]) - 0.5, 'd'), (S[i-1][j] - G, 'a'), (S[i][j-1] - G, 'b')]
        # split bar: two A bars == one B bar, or vice versa
        if i > 1: opts.append((S[i-2][j-1] + sim(A[ka[i-2]] + A[ka[i-1]], B[kb[j-1]]) - 0.5 - 0.1, 'aa'))
        if j > 1: opts.append((S[i-1][j-2] + sim(A[ka[i-1]], B[kb[j-2]] + B[kb[j-1]]) - 0.5 - 0.1, 'bb'))
        S[i][j], T[i][j] = max(opts)
i, j, path = n, m, []
while i or j:
    t = T[i][j]; path.append((t, i, j))
    if t == 'd': i -= 1; j -= 1
    elif t == 'a': i -= 1
    elif t == 'b': j -= 1
    elif t == 'aa': i -= 2; j -= 1
    else: i -= 1; j -= 2
path.reverse(); off = 0; bad = 0
for t, i, j in path:
    if t == 'a': print(f'A bar {ka[i-1]} has no match in B'); bad += 1
    elif t == 'b': print(f'B bar {kb[j-1]} has no match in A'); bad += 1
    elif t == 'aa': print(f'A bars {ka[i-2]}+{ka[i-1]} = B bar {kb[j-1]} (split bar?)'); bad += 1
    elif t == 'bb': print(f'B bars {kb[j-2]}+{kb[j-1]} = A bar {ka[i-1]} (split bar?)'); bad += 1
    elif ka[i-1] != kb[j-1] and (not path or True):
        d = kb[j-1] - ka[i-1]
        if d != off: print(f'numbering offset now {d:+d} from A bar {ka[i-1]} / B bar {kb[j-1]}'); off = d
print('# alignment problems:', bad, '| final offset', off, file=sys.stderr)
if len(sys.argv) > 3:  # write B renumbered to A's bars; B bars without a one-to-one match are dropped (the judge reads those fresh)
    mp = {}
    for t, i, j in path:
        if t == 'd': mp[kb[j-1]] = ka[i-1]
    o = []
    for l in open(sys.argv[2]):
        m = re.match(r'^(\d+)( .*)$', l.rstrip('\n'))
        if m:
            if int(m.group(1)) in mp: o.append(f"{mp[int(m.group(1))]}{m.group(2)}")
        elif not l.startswith('# sys'): o.append(l.rstrip('\n'))
    open(sys.argv[3], 'w').write('\n'.join(o) + '\n')
    print('# wrote', sys.argv[3], len(mp), 'bars matched of', len(ka), file=sys.stderr)
