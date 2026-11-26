"""phrases.py XML OUT.json ROLEMAP : per soloist part, the sung text cut into phrases at sentence ends (. ? ! … ;) or a rest of
a half bar or more; each phrase keeps the bar of its first syllable and its words (an elision _ keeps two words on one note)."""
import sys, json, re, xml.etree.ElementTree as ET
X, OUT, RM = sys.argv[1], sys.argv[2], json.loads(sys.argv[3])
r = ET.parse(X).getroot(); names = {s.get('id'): s.findtext('part-name') for s in r.iter('score-part')}
res = []
for p in r.findall('part'):
    nm = names[p.get('id')]
    if nm not in RM: continue
    role = RM[nm]; cur = None; word = ''; div = 1; rest = 0
    def close():
        global cur
        if cur and cur['words']: res.append(cur)
        cur = None
    for m in p.findall('measure'):
        bar = m.get('number')
        for e in m:
            if e.tag == 'attributes' and e.findtext('divisions'): div = int(e.findtext('divisions'))
            if e.tag != 'note': continue
            if e.find('rest') is not None:
                rest += int(e.findtext('duration') or 0)
                if rest >= 2 * div and cur and not word: close()
                continue
            rest = 0
            for l in e.findall('lyric')[:1]:
                t = '_'.join(x.text or '' for x in l.findall('text')); syl = l.findtext('syllabic') or 'single'
                if cur is None: cur = {'role': role, 'startMeasure': bar, 'words': []}
                word += t
                if syl in ('single', 'end'):
                    parts = word.split('_')
                    for k, w in enumerate(parts):
                        if k: cur.setdefault('joins', []).append(len(cur['words']) - 1)
                        cur['words'].append(w)
                    if re.search(r'[.?!…;]["»]?$', word): close()
                    word = ''
    close()
json.dump(res, open(OUT, 'w'), ensure_ascii=False, indent=0); print(len(res), 'phrases')
for x in res: print(x['role'], x['startMeasure'], ' '.join(x['words']))
