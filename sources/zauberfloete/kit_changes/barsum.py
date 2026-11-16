"""barsum.py FILE.xml : every measure of every part/staff/voice adds up to the measure's time signature (divisions exact)"""
import sys, xml.etree.ElementTree as ET
from collections import defaultdict
r=ET.parse(sys.argv[1]).getroot(); bad=0
for p in r.findall('part'):
    div=None; beats=None
    for m in p.findall('measure'):
        a=m.find('attributes')
        if a is not None:
            if a.find('divisions') is not None: div=int(a.findtext('divisions'))
            t=a.find('time')
            if t is not None: beats=(int(t.findtext('beats')),int(t.findtext('beat-type')))
        L=div*4*beats[0]//beats[1]; tot=defaultdict(int)
        for n in m.findall('note'):
            if n.find('chord') is not None or n.find('grace') is not None: continue
            tot[(n.findtext('staff') or '1',n.findtext('voice'))]+=int(n.findtext('duration'))
        for k,v in tot.items():
            if v!=L: bad+=1; print(p.get('id'),m.get('number'),k,v,'!=',L)
print('barsum problems:',bad)
