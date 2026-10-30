"""
Parse a Digitale Mozart-Edition libretto text (pdftotext -layout of the DME critical edition PDF) into structured
data: acts, scenes (heading, who enters), speeches by character, each line marked as recitative or set verse (the
edition indents set verse further than recitative), and stage directions.

    pdftotext -layout LV_9.pdf lv9.txt && python3 parse_dme.py lv9.txt out.json
"""
import json, re, sys

src, out = sys.argv[1:3]
lines = open(src, encoding='utf-8').read().split('\n')
# drop page furniture
skip = re.compile(r'(Le nozze di Figaro KV|Kritische Edition|©\d{4} by Digitale|dme\.mozarteum\.at)')
lines = [l.replace('\f', '') for l in lines if not skip.search(l)]

CAST_START = next(i for i, l in enumerate(lines) if l.strip() == 'ATTO PRIMO')
ROMAN = {'PRIMO': 1, 'SECONDO': 2, 'TERZO': 3, 'QUARTO': 4}
SPEAKER = re.compile(r"^([A-ZÀ-Ý][A-ZÀ-Ý' ,]+?)(?:\s+\((.*)\))?$")

acts, act, scene, cur = [], None, None, None
pending_dir = []

def text_col(l):
    m = re.match(r'^(\s*\d+)?(\s*)(\S)', l)
    return len(m.group(1) or '') + len(m.group(2)) if m else None

i = CAST_START
while i < len(lines):
    raw = lines[i]; s = raw.strip(); i += 1
    if not s: continue
    m = re.match(r'^ATTO (PRIMO|SECONDO|TERZO|QUARTO)$', s)
    if m:
        act = {'act': ROMAN[m.group(1)], 'setting': '', 'scenes': []}; acts.append(act); scene = None; continue
    if s.startswith('Fine dell'): continue
    m = re.match(r'^SCENA (\w+)$', s)
    if m:
        scene = {'scene': m.group(1), 'heading': '', 'items': []}; act['scenes'].append(scene); cur = None; continue
    if act and scene is None:
        act['setting'] += (' ' if act['setting'] else '') + s; continue
    if scene is not None and not scene['items'] and cur is None and raw.startswith(s) and not SPEAKER.match(s) or (scene is not None and scene['heading'] and not scene['items'] and cur is None and raw == s and not s.isupper()):
        scene['heading'] += (' ' if scene['heading'] else '') + s; continue
    if raw == s and SPEAKER.match(s) and s.upper() == s:
        m = SPEAKER.match(s)
        cur = {'who': m.group(1).strip(), 'lines': []}; scene['items'].append(cur)
        if m.group(2): cur['lines'].append({'kind': 'dir', 'text': m.group(2)})
        continue
    num = re.match(r'^\s*(\d+)\s', raw)
    body = re.sub(r'^\s*\d+(?=\s)', '', raw).strip() if num else s
    col = text_col(raw)
    if body.startswith('(') or (cur and cur['lines'] and cur['lines'][-1]['kind'] == 'dir' and not cur['lines'][-1]['text'].rstrip().endswith(')')):
        if cur is None:
            scene['items'].append({'who': None, 'lines': [{'kind': 'dir', 'text': body}]})
        elif cur['lines'] and cur['lines'][-1]['kind'] == 'dir' and not cur['lines'][-1]['text'].rstrip().endswith(')'):
            cur['lines'][-1]['text'] += ' ' + body
        else:
            cur['lines'].append({'kind': 'dir', 'text': body})
        continue
    if cur is None:
        scene['heading'] += ' ' + s; continue
    kind = 'verse' if col is not None and col >= 9 else 'recit'
    cur['lines'].append({'kind': kind, 'text': body, **({'n': int(num.group(1))} if num else {})})

json.dump(acts, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
for a in acts:
    print('Act', a['act'], '|', a['setting'][:70], '|', len(a['scenes']), 'scenes')
    for sc in a['scenes']:
        who = sorted({it['who'] for it in sc['items'] if it['who']})
        v = sum(1 for it in sc['items'] for l in it['lines'] if l['kind'] == 'verse')
        r = sum(1 for it in sc['items'] for l in it['lines'] if l['kind'] == 'recit')
        print(f"  {sc['scene']:>6} recit {r:3} verse {v:3}  {', '.join(who)}  ::  {sc['heading'][:80]}")
