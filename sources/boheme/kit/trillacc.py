"""trillacc.py FILE "BAR:PITCH:sharp;..." : add <accidental-mark> (sharp/flat/natural) above the trill mark of that note."""
import sys, xml.etree.ElementTree as ET
f, spec = sys.argv[1:3]; head = open(f).read().split('<score-partwise', 1)[0]
want = [x.split(':') for x in spec.split(';')]
t = ET.parse(f); r = t.getroot(); n_ok = 0
for P in r.findall('part'):
    for m in P.findall('measure'):
        for bar, pitch, acc in want:
            if m.get('number') != bar: continue
            for n in m.findall('note'):
                p = (n.findtext('pitch/step') or '') + {'1': '#', '-1': 'b'}.get(n.findtext('pitch/alter') or '0', '') + (n.findtext('pitch/octave') or '')
                o = n.find('notations/ornaments')
                if p == pitch and o is not None and o.find('trill-mark') is not None and o.find('accidental-mark') is None:
                    a = ET.SubElement(o, 'accidental-mark'); a.text = acc; a.set('placement', 'above'); n_ok += 1
open(f, 'w').write(head + ET.tostring(r, encoding='unicode')); print('trillacc: added', n_ok)
