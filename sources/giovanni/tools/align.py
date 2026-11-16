"""align.py SID XML : match the draft's phrases (draft/lib/SID.json) to the score's sung words, role by role.
Prints, per phrase, the start bar and any word that differs from the print; writes /home/claude/work/dg_in/out/SID.json:
{role: [[bar, word], ...]} (the score's words with the bar of their first note) and the phrase start bars."""
import sys, json, re, unicodedata
import xml.etree.ElementTree as ET
sid, xml = sys.argv[1], sys.argv[2]
NAMES = {'Don Giovanni': 'dongiovanni', 'Leporello': 'leporello', 'Donna Elvira': 'elvira', 'Zerlina': 'zerlina', 'Masetto': 'masetto',
         'Don Ottavio': 'ottavio', 'Donna Anna': 'anna'}
root = ET.parse(xml).getroot()
pname = {sp.get('id'): sp.findtext('part-name') for sp in root.iter('score-part')}
score = {}
for part in root.findall('part'):
    role = NAMES.get(pname.get(part.get('id')))
    if not role: continue
    words, cur = [], None
    for m in part.findall('measure'):
        bar = m.get('number')
        for n in m.findall('note'):
            for ly in n.findall('lyric'):
                if ly.get('number') not in (None, '1'): continue
                # a note can carry two syllables joined by an elision: <text>a</text><elision/><text>b</text>
                parts = []; syl = None
                for el in ly:
                    if el.tag == 'syllabic': syl = el.text
                    if el.tag == 'text': parts.append(el.text or '')
                txt = '_'.join(parts)
                if syl in ('single', 'begin') or cur is None:
                    if cur: words.append(cur)
                    cur = [bar, txt]
                else:
                    cur[1] += txt
                if syl in ('single', 'end'):
                    words.append(cur); cur = None
    if cur: words.append(cur)
    # split elided pairs into their words, each keeping the bar
    out = []
    for bar, w in words:
        for piece in w.split('_'):
            for x in piece.split():
                if x.strip(): out.append([bar, x])
    score[role] = out
norm = lambda s: re.sub(r"[^a-z]", '', unicodedata.normalize('NFD', s.lower()).replace('’', "'").encode('ascii', 'ignore').decode()).strip("'")
draft = json.load(open(f'/home/claude/ext/giovanni/draft/lib/{sid}.json'))
pos = {r: 0 for r in score}
res = []
for ph in draft['phrases']:
    roles = ph['role'].split('+')
    role = roles[0]
    if role not in score: print('NO PART', role, ph['original']); continue
    sw = score[role]; i = pos[role]
    ws = [w[0] for w in ph['words']]
    # find the first draft word in the score stream from i
    first = norm(ws[0])
    j = i
    while j < len(sw) and not (norm(sw[j][1]) and first.startswith(norm(sw[j][1]))): j += 1
    if j >= len(sw): print('LOST', sid, role, ph['original']); continue
    start = sw[j][0]; diffs = []; k = j
    for w in ws:
        # one draft word may be several score tokens (Donn' + Elvira, presentar + mi): join greedily
        target = norm(w); acc = ''; k0 = k
        while k < len(sw) and len(acc) < len(target) and target.startswith(acc + norm(sw[k][1])):
            acc += norm(sw[k][1]); k += 1
        if acc != target:
            k = k0
            if k < len(sw): diffs.append(f'{w}≠{sw[k][1]}'); k += 1
            else: diffs.append(f'{w}≠END')
    if j > i: diffs.insert(0, 'SKIPPED:' + ' '.join(x[1] for x in sw[i:j]))
    pos[role] = k
    res.append({'id': ph['id'], 'role': ph['role'], 'start': start, 'diffs': diffs})
    print(ph['id'], ph['role'], 'bar', start, '|', ph['original'][:50], '|', '; '.join(diffs))
for r in score:
    if pos[r] < len(score[r]): print('UNUSED', r, ' '.join(x[1] for x in score[r][pos[r]:]))
import os; os.makedirs('/home/claude/work/dg_in/out', exist_ok=True)
json.dump({'score': score, 'phrases': res}, open(f'/home/claude/work/dg_in/out/{sid}.json', 'w'), ensure_ascii=False, indent=1)
