import sys, xml.etree.ElementTree as ET
f, role, b0, b1 = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
r = ET.parse(f).getroot(); pn = {sp.get('id'): sp.findtext('part-name') for sp in r.iter('score-part')}
for p in r.findall('part'):
    if pn[p.get('id')] != role: continue
    for m in p.findall('measure'):
        if b0 <= int(m.get('number')) <= b1:
            out = []
            for n in m.findall('note'):
                for ly in n.findall('lyric'):
                    out.append('|'.join(f"{e.tag[0]}:{e.text}" for e in ly if e.tag in ('syllabic', 'text', 'elision')))
            print(m.get('number'), '  '.join(out))
