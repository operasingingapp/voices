"""xml2tok.py SCAN.xml [PIANO_PART_ID] : scan MusicXML piano part -> piano token lines (P6.md format), stdout.
Bars numbered by measure order (an implicit first measure = bar 0). Voices: staff1 -> RH1/RH2.., staff2 -> LH1/LH2."""
import sys, xml.etree.ElementTree as ET
from fractions import Fraction as F
r = ET.parse(sys.argv[1]).getroot()
def nnotes(p): return sum(1 for n in p.iter('note') if n.find('rest') is None)
parts = [p for p in r.findall('part') if any((s.text or '') == '2' for s in p.iter('staves'))]
# OMR puts the piano in different parts depending on the system layout: per measure, take the LAST
# two-staff part that has a note in that measure (the piano is always the bottom two staves).
PM = [p.findall('measure') for p in parts]
def pick(i):
    for ms in reversed(PM):
        if i < len(ms) and any(n.find('rest') is None for n in ms[i].iter('note')): return ms[i]
    return PM[-1][i]
class _P:
    def findall(self, _): return [pick(i) for i in range(len(PM[0]))]
part = _P()
TYPES = {'whole': 'w', 'half': 'h', 'quarter': 'q', 'eighth': 'e', '16th': 's', '32nd': 'x', '64th': 'x'}
LEN = {'w': F(4), 'h': F(2), 'q': F(1), 'e': F(1, 2), 's': F(1, 4), 'x': F(1, 8)}
def durtok(ql):
    for t, b in LEN.items():
        for dots, mul in (('', 1), ('.', F(3, 2)), ('..', F(7, 4))):
            if b * mul == ql: return t + dots
        if b * F(2, 3) == ql: return t + '3'
    return None
def pname(e):
    p = e.find('pitch'); a = int(float(p.findtext('alter') or 0))
    return p.findtext('step') + {0: '', 1: '#', -1: 'b', 2: '##', -2: 'bb'}[a] + p.findtext('octave')
DIV = {}
for p in parts:
    dv = 1
    for m in p.findall('measure'):
        d = m.find('attributes/divisions')
        if d is not None: dv = int(d.text)
        DIV[id(m)] = dv
for i, m in enumerate(part.findall('measure')):
    div = DIV[id(m)]
    bar = i if part.findall('measure')[0].get('implicit') == 'yes' else i + 1
    pos = F(0); last = F(0); ev = {}; dyn = []
    for e in m:
        if e.tag == 'backup': pos -= F(int(e.findtext('duration')), div)
        elif e.tag == 'forward': pos += F(int(e.findtext('duration')), div)
        elif e.tag == 'direction':
            st = e.findtext('staff') or '1'
            for dd in e.iter('dynamics'):
                for x in dd: dyn.append((pos, st, 'dyn:' + x.tag))
            for w in e.iter('words'):
                if w.text and 'cresc' in w.text: dyn.append((pos, st, 'word:cresc.'))
                if w.text and 'dim' in w.text: dyn.append((pos, st, 'word:dim.'))
        elif e.tag == 'note':
            g = e.find('grace') is not None; ch = e.find('chord') is not None
            dq = F(int(e.findtext('duration') or 0), div)
            on = last if ch else pos
            st = e.findtext('staff') or '1'; v = e.findtext('voice') or '1'
            key = (st, v)
            if e.find('rest') is not None: tok = None
            else: tok = pname(e)
            tie = any(t.get('type') == 'start' for t in e.findall('tie'))
            stac = e.find('notations/articulations/staccato') is not None
            L = ev.setdefault(key, [])
            if ch and L and L[-1][0] == on and L[-1][1] is not None and tok:
                L[-1][1].append(tok); L[-1][3] |= tie
            else:
                L.append([on, [tok] if tok else None, dq, tie, stac, g])
            if not ch and not g: last = pos; pos += dq
    # bar length
    blen = max([x[0] + x[2] for L in ev.values() for x in L] + [F(0)])
    for st, hand in (('1', 'RH'), ('2', 'LH')):
        vs = sorted(k for k in ev if k[0] == st)
        for n, k in enumerate(vs, 1):
            toks = []; cur = F(0)
            for on, pit, dq, tie, stac, g in sorted(ev[k], key=lambda x: (x[0], not x[5])):
                if on > cur and not g:
                    dt = durtok(on - cur); toks.append(f'r:{dt or "?" + str(on - cur)}'); cur = on
                for dp, ds, dt_ in dyn:
                    if ds == st and dp == on and n == 1 and not g: toks.append(dt_)
                dt = durtok(dq) if not g else 's'
                body = 'r' if pit is None else '+'.join(sorted(pit, key=lambda s: (int(s[-1]), 'CDEFGAB'.index(s[0]))))
                toks.append(('g:' if g else '') + f'{body}:{dt or "?" + str(dq)}' + ('~' if tie else '') + ('*' if stac else ''))
                if not g: cur = on + dq
            print(f'{bar} {hand}{n}: ' + ' '.join(toks))
