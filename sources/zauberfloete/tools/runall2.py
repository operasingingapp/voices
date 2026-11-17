import json, glob, sys, os
sys.path.insert(0, '/home/claude/work/zf_in')
from phrases import build, norm
P = {'S13': (1, {'Monostatos': 'monostatos', 'Pamina': 'pamina', 'Papageno': 'papageno'}),
     'S15': (1, {'Pamina': 'pamina', 'Papageno': 'papageno'}),
     'S27': (1, {'Erster Priester': 'priest1', 'Zweiter Priester': 'priest2'}),
     'S38': (1, {'Erster Knabe': 'knabe1', 'Zweiter Knabe': 'knabe2', 'Dritter Knabe': 'knabe3'}),
     'S44': (1, {'Pamina': 'pamina', 'Tamino': 'tamino', 'Sarastro': 'sarastro'})}
LEX = {'a': ['A', 'ah', 'ʔa'], 'ha': ['ha!', 'ha', 'haː'], 'ihm': ['ihm', 'to him', 'ʔiːm']}
TR = {'S13': {('papageno', '36'): 'Where am I, I wonder? Where can I be? Aha! Here I find people.'},
      'S44': {('sarastro', '19'): 'their sign shall be law to him.'}}
if __name__ == '__main__':
    for sid, (nv, parts) in P.items():
        xmlf = glob.glob(f'/home/claude/work/zf_in/b2/{sid}_*/*.musicxml')[0]
        ph, pr = build(sid, xmlf, parts, nv, extra_lex=LEX, trans=TR.get(sid))
        D = {norm(''.join(w[0] for w in p['words'])) for p in json.load(open(f'/home/claude/ext/zauber/draft/lib/L{sid[1:]}.json'))['phrases']}
        print('==', sid, len(ph))
        for p in ph:
            if norm(''.join(w[0] for w in p['words'])) not in D: print('  ', p['role'], 'bar', p['startMeasure'], '|', p['original'], '|', p['translation'])
        for x in pr: print('  !!', x)
