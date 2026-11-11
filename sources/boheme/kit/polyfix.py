"""polyfix.py IN OUT "SEGS" : polymeter bars (same bar length, dotted quarter = quarter). Lines written in the other meter
(sum = 3/2 or 2/3 of the bar given by SEGS) are rewritten into the SEGS meter: x2/3 = drop a dot or make a triplet ('3');
x3/2 = add a dot or drop a triplet. Grace notes untouched. A remark is added before every rewritten line."""
import re, sys
from fractions import Fraction as F
IN, OUT, SEGS = sys.argv[1:4]
SEG = sorted((int(a), int(b), int(c)) for a, b, c, *_ in (x.split('/', 4) for x in SEGS.split(';')))
def blen(bar): n, d = [(b, c) for a, b, c in SEG if a <= bar][-1]; return F(4 * n, d)
D = {'w': F(4), 'h': F(2), 'q': F(1), 'e': F(1, 2), 's': F(1, 4), 'x': F(1, 8)}
DUR = re.compile(r':([whqesx])(\.*)(3)?(\{(\d+):(\d+)\})?(?=[^:]*$)')
def dur(tok):
    if tok.startswith('g:') or re.match(r'(dyn|hp|word|clef):', tok): return F(0)
    m = DUR.search(tok)
    if not m: return F(0)
    d = D[m[1]]; dd = d
    for _ in m[2]: dd /= 2; d += dd
    if m[3]: d = d * 2 / 3
    if m[4]: d = d * int(m[6]) / int(m[5])
    return d
def scale(tok, k):
    if tok.startswith('g:') or re.match(r'(dyn|hp|word|clef):', tok) or not DUR.search(tok): return tok
    m = DUR.search(tok); v, dots, t, tup = m[1], m[2], m[3], m[4]
    if tup:
        n, mm = int(m[5]), F(int(m[6])) * k
        if mm.denominator != 1: raise SystemExit(f'cannot scale tuplet token {tok}')
        new = v + dots + (f'{{{n}:{mm.numerator}}}' if n != mm.numerator else '')
        return tok[:m.start()] + ':' + new + tok[m.end():]
    if k == F(2, 3):
        new = (v + dots[:-1]) if dots else (v + '3' if not t else None)
    else:
        new = (v + '.') if not (t or dots) else (v + dots if t else v + dots + '{2:3}')
    if new is None: raise SystemExit(f'cannot scale {tok}')
    return tok[:m.start()] + ':' + new + tok[m.end():]
out = []
for l in open(IN, encoding='utf-8'):
    m = re.match(r'^(\d+)(\s+[A-Z]+\d{0,2}[a-z]?:\s*)(.*)$', l.rstrip('\n'))
    if not m or l.startswith('#'): out.append(l); continue
    bar = int(m[1]); toks = re.findall(r'"[^"]*"|\S+', m[3])
    tot = sum(dur(t) for t in toks if not t.startswith('"')); L = blen(bar)
    if tot == L: out.append(l); continue
    k = L / tot
    if k not in (F(2, 3), F(3, 2)): raise SystemExit(f'bar {bar}: line sums to {tot}, bar is {L}: {l}')
    new = [t if t.startswith('"') else scale(t, k) for t in toks]
    out.append(f'# POLY bar {bar}: line written in the other meter, rewritten x{k} into the bar\'s meter\n')
    out.append(f'{bar}{m[2]}{" ".join(new)}\n')
open(OUT, 'w', encoding='utf-8').write(''.join(out))
print('ok', sum(1 for l in out if l.startswith('# POLY')), 'lines rewritten')
