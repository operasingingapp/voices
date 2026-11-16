import json, glob, sys
sys.path.insert(0, '/home/claude/work/zf_in')
from phrases import build, norm
P = {'S05': (3, {'Papageno': 'papageno'}), 'S07': (1, {'Tamino': 'tamino'}), 'S09': (1, {'Königin der Nacht': 'queen'}),
     'S25': (1, {'Sarastro': 'sarastro', 'Chor der Priester (Tenor)': 'tenor', 'Chor der Priester (Bass)': 'bass'}),
     'S32': (2, {'Monostatos': 'monostatos'}), 'S36': (2, {'Sarastro': 'sarastro'}), 'S40': (1, {'Pamina': 'pamina'}),
     'S46': (1, {'Papageno': 'papageno'})}
LEX = {'ja': ['ja,', 'yes', 'jaː'], 'mein': ['mein', 'my', 'maen'], 'ganzes': ['ganzes', 'whole', 'ˈgan.tsəs'],
       'ruhe': ['Ruhe,', 'peace', 'ˈruː.ə'], 'elisium': ['Elisium', 'Elysium', 'ʔeˈlyː.zi.ʊm']}
TR = {'S40': {('pamina', '1'): 'Ah, I feel it, it has vanished, all my happiness gone for ever,'}}
if __name__ == '__main__':
    for sid, (nv, parts) in P.items():
        xmlf = glob.glob(f'/home/claude/work/zf_in/b1/{sid}_*/*.musicxml')[0]
        ph, pr = build(sid, xmlf, parts, nv, extra_lex=LEX, trans=TR.get(sid))
        D = {norm(''.join(w[0] for w in p['words'])): p for p in json.load(open(f'/home/claude/ext/zauber/draft/lib/L{sid[1:]}.json'))['phrases']}
        print('==', sid, len(ph))
        for p in ph:
            if norm(''.join(w[0] for w in p['words'])) not in D: print('  ', p['role'], 'bar', p['startMeasure'], '|', p['original'], '|', p['translation'])
        for x in pr: print('  !!', x)
