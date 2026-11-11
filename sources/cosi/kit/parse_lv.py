"""parse_lv.py lv311.txt out.json : DME 'Kritische Edition des vertonten Textes' (pdftotext -layout) -> sections.
Section = a number ('N° ...') or a 'Recitativo' heading. Items in order: scene markers, speeches (who + lines), directions."""
import json, re, sys
src, out = sys.argv[1:3]
L = [l.replace('\f', '') for l in open(src, encoding='utf-8').read().split('\n')]
skip = re.compile(r'(Così fan tutte ossia La scuola|Kritische Edition des vertonten|©\d{4} by Digitale|dme\.mozarteum\.at)')
L = [l for l in L if not skip.search(l)]
start = next(i for i, l in enumerate(L) if l.strip() == 'ATTO PRIMO')
ACT = {'PRIMO': 1, 'SECONDO': 2}
TEMPO = re.compile(r'^(\[?\d*\.?)?(tempo\d+x\{.*\}|(Allegro|Andante|Adagio|Allegretto|Larghetto|Maestoso|Presto|Moderato|Molto|Più|Piu|A tempo|Andantino|Largo|Tempo|Recitativo)\b.*)$')
secs, sec, act, scene, setting = [], None, 0, None, ''
pending = []   # scene markers before the first section of a scene
cur = None; in_dir = False; want_tempo = False; scene_head = False
def new_sec(label):
    global sec, cur, want_tempo
    sec = {'label': label, 'act': act, 'scene': scene, 'tempo': '', 'items': list(pending)}; pending.clear()
    secs.append(sec); cur = None; want_tempo = True
def add(item):
    (sec['items'] if sec else pending).append(item)
for raw in L[start:]:
    s = raw.strip()
    if not s: continue
    m = re.match(r'^ATTO (PRIMO|SECONDO)$', s)
    if m: act = ACT[m[1]]; sec = None; cur = None; scene_head = 'setting'; continue
    if s.startswith('Fine dell'): continue
    m = re.match(r'^SCENA (\w+)$', s)
    if m:
        scene = m[1]; it = {'scene': scene, 'heading': ''}; add(it); cur = None; scene_head = it; continue
    if re.match(r'^(N° ?\d+\w*.*|Recitativo.*)$', s) and raw.startswith(s):
        new_sec(s); scene_head = None; continue
    if scene_head == 'setting':
        if sec is None and not pending: setting = (setting + ' ' + s).strip()
        add({'setting': s}); continue
    if isinstance(scene_head, dict) and raw.startswith(s) and not (s.upper() == s and re.search('[A-Z]', s)):
        scene_head['heading'] = (scene_head['heading'] + ' ' + s).strip(); continue
    scene_head = None
    if raw.startswith(s) and TEMPO.match(s):
        if sec and not any('who' in i for i in sec['items']) and not sec['tempo']: sec['tempo'] = re.sub(r'tempo\d+x\{(.*)\}', r'\1', s)
        else: add({'tempo': s})
        continue
    if raw.startswith(s) and re.match(r"^[A-Z][A-Z' ,]+(\.| [a-z(].*)$", s) and not s.startswith('('):
        add({'heading': s}); continue
    num = re.match(r'^\s*(\d+)\s', raw)
    body = re.sub(r'^\s*\d+(?=\s)', '', raw).strip()
    if raw.startswith(s) and s.upper() == s and re.search('[A-Z]', s) and not s.startswith('('):
        cur = {'who': s, 'lines': []}; add(cur); in_dir = False; want_tempo = False; continue
    if body.startswith('(') or in_dir:
        d = {'dir': body}
        if in_dir: (cur['lines'][-1] if cur and cur['lines'] and 'dir' in cur['lines'][-1] else (sec or {'items': pending})['items'][-1])['dir'] += ' ' + body
        else:
            if cur: cur['lines'].append(d)
            else: add(d)
        in_dir = not body.rstrip().endswith(')') and body.count('(') > body.count(')') or (in_dir and not body.rstrip().endswith(')'))
        continue
    if cur is None and sec:
        prev = next((i for x in reversed(secs[:-1]) for i in reversed(x['items']) if 'who' in i), None)
        cur = {'who': prev['who'] if prev else '?', 'lines': [], 'continued': True}; add(cur)
    if cur is None:
        add({'dir': '?? ' + s}); continue
    cur['lines'].append({'text': body, **({'n': int(num[1])} if num else {})})
for k, s in enumerate(secs):
    s['id'] = f'L{k+1:02d}'
    s['items'] = [i for i in s['items'] if not ('who' in i and not i['lines'])]
json.dump(secs, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
for s in secs:
    who = []
    for i in s['items']:
        if 'who' in i:
            for w in re.split(r',\s*|\s+E\s+', i['who']):
                if w not in who: who.append(w)
    n = sum(1 for i in s['items'] if 'who' in i for l in i['lines'] if 'text' in l)
    first = next((l['text'] for i in s['items'] if 'who' in i for l in i['lines'] if 'text' in l), '')
    print(f"{s['id']} A{s['act']} sc{s['scene']:<5} {s['label'][:28]:28} {s['tempo'][:18]:18} {n:3} | {first[:40]:40} | {', '.join(who)}")
odd = [(s['id'], i['dir']) for s in secs for i in s['items'] if 'dir' in i and i['dir'].startswith('??')]
print('ODD', len(odd)); [print(' ', o) for o in odd[:30]]
# move scene markers that end a section to the start of the next one; write a readable text version
for a, b in zip(secs, secs[1:]):
    k = len(a['items'])
    while k and ('scene' in a['items'][k-1] or 'heading' in a['items'][k-1] or 'setting' in a['items'][k-1]): k -= 1
    if k < len(a['items']):
        b['items'][:0] = a['items'][k:]; del a['items'][k:]
for s in secs:
    sc = next((i['scene'] for i in s['items'] if 'scene' in i), None)
    if sc and s['items'] and 'scene' in s['items'][0]: s['scene'] = sc
json.dump(secs, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
with open(out.replace('.json', '.txt'), 'w', encoding='utf-8') as f:
    for s in secs:
        f.write(f"\n===== {s['id']} | Act {s['act']} | {s['label']} | {s['tempo']}\n")
        for i in s['items']:
            if 'scene' in i: f.write(f"  [SCENA {i['scene']}] {i['heading']}\n")
            elif 'setting' in i: f.write(f"  [SETTING] {i['setting']}\n")
            elif 'heading' in i: f.write(f"  [HEADING] {i['heading']}\n")
            elif 'tempo' in i: f.write(f"  [TEMPO] {i['tempo']}\n")
            elif 'dir' in i: f.write(f"  ({i['dir'].strip('()')})\n")
            else:
                f.write(f"{i['who']}{' (cont.)' if i.get('continued') else ''}\n")
                for l in i['lines']:
                    f.write(f"    ({l['dir'].strip('()')})\n" if 'dir' in l else f"  {l.get('n',''):>4} {l['text']}\n")
