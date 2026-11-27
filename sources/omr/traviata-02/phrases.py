"""phrases.py XML OUT.json ROLEMAP : per soloist part, the sung text cut into phrases at sentence ends (. ? ! … ;) or a rest of
a half bar or more; each phrase keeps the bar of its first syllable and its words (an elision _ keeps two words on one note)."""
import sys, json, re, xml.etree.ElementTree as ET
X, OUT, RM = sys.argv[1], sys.argv[2], json.loads(sys.argv[3])
# optional 4th argument: the rest (in quarter notes) that ends a phrase; default a half note
GAP = float(sys.argv[4]) if len(sys.argv) > 4 else 2.0
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
                if rest >= GAP * div and cur and not word: close()
                continue
            rest = 0
            for l in e.findall('lyric')[:1]:
                t = '_'.join(x.text or '' for x in l.findall('text')); syl = l.findtext('syllabic') or 'single'
                if cur is None: cur = {'role': role, 'startMeasure': bar, 'words': []}
                if not word: wb = bar
                word += t
                if syl in ('single', 'end'):
                    parts = word.split('_')
                    for k, w in enumerate(parts):
                        if k: cur.setdefault('joins', []).append(len(cur['words']) - 1)
                        cur['words'].append(w); cur.setdefault('bars', []).append(wb)
                    if re.search(r'[.?!…;]["»]?$', word): close()
                    word = ''
    close()
# a capital letter after a word with no stop starts a new sentence (the print drops the full stop); a phrase over LONG
# words is cut after a comma once it holds at least 6 words
LONG = int(sys.argv[5]) if len(sys.argv) > 5 else 0
def cut(x):
    ws, bs, js = x['words'], x['bars'], set(x.get('joins', []))
    out, st = [], 0
    for i in range(1, len(ws)):
        if i - 1 in js: continue
        cap = LONG and ws[i][:1].isupper() and not re.search(r'[.?!…;,:]["»]?$', ws[i-1])
        com = LONG and i - st >= 6 and re.search(r',$', ws[i-1]) and len(ws) - st > LONG
        if cap or com: out.append((st, i)); st = i
    out.append((st, len(ws)))
    for a, b in out:
        y = {'role': x['role'], 'startMeasure': bs[a], 'words': ws[a:b]}
        j = [k - a for k in js if a <= k < b - 1]
        if j: y['joins'] = j
        yield y
res = [y for x in res for y in cut(x)]
json.dump(res, open(OUT, 'w'), ensure_ascii=False, indent=0); print(len(res), 'phrases')
for x in res: print(x['role'], x['startMeasure'], ' '.join(x['words']))
