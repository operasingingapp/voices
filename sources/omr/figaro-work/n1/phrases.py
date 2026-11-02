import sys, xml.etree.ElementTree as ET, json
def words(path):
    r=ET.parse(path).getroot(); out={}
    for p in r.findall('part'):
        if p.get('id') not in ('P1','P2'): continue
        role='susanna' if p.get('id')=='P1' else 'figaro'
        seq=[]  # (bar, word, rest_before)
        cur=''; startbar=None; gap=False
        for m in p.findall('measure'):
            b=int(m.get('number'))
            for n in m.iter('note'):
                if n.find('rest') is not None:
                    if int(n.findtext('duration'))>=12: gap=True
                    continue
                l=n.find('lyric')
                if l is None: continue
                t=' '.join(x.text for x in l.findall('text'))
                if not cur: startbar=b
                cur+=t
                if l.findtext('syllabic') in ('single','end'):
                    seq.append((startbar,cur,gap)); cur=''; gap=False
        out[role]=seq
    return out
W=words(sys.argv[1])
for role,seq in W.items():
    print('=== ',role)
    ph=[]; 
    for b,w,g in seq:
        if g or not ph: ph.append([b,[]])
        ph[-1][1].append(w)
    for b,ws in ph: print(b,' '.join(ws))
