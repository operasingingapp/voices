"""words.py FILE.xml : the sung text per part and verse, words rebuilt from syllables"""
import sys, xml.etree.ElementTree as ET
r=ET.parse(sys.argv[1]).getroot(); names={s.get('id'):s.findtext('part-name') for s in r.iter('score-part')}
for p in r.findall('part')[:-1]:
    V={}
    for n in p.iter('note'):
        for l in n.findall('lyric'):
            v=l.get('number'); t='_'.join(x.text for x in l.findall('text')); syl=l.findtext('syllabic')
            V.setdefault(v,[]).append(t+('' if syl in ('begin','middle') else ' '))
    for v,ws in sorted(V.items()):
        print(f'[{names[p.get("id")]} v{v}]', ''.join(ws))
