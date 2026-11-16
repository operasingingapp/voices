"""phrases.py: the app's phrases for a Zauberflöte piece from the libretto draft (ext/zauber/draft/lib/Lnn.json) and the
score's sung words. The score's words win (the print's spelling and punctuation); the draft gives the translation, the
glosses and the IPA. Lines the score repeats (which the draft gives once) are added: a whole repeated line becomes its own
phrase (a copy), a repeated fragment joins the phrase before it. Prints every word the draft could not supply."""
import json, re, difflib, copy, unicodedata, sys
sys.path.insert(0, '/home/claude/work/zf_in')
from words import score_words

norm = lambda s: re.sub(r'[^a-zäöüß]', '', s.lower())


def build(sid, xmlf, parts, nverses=1, verse_of_part=None, extra_lex=None, trans=None):
    """parts: {score part name: app role}. Returns (phrases, problems)."""
    D = json.load(open(f'/home/claude/ext/zauber/draft/lib/L{sid[1:]}.json'))['phrases']
    lex = {}
    for p in D:
        for w in p['words']: lex.setdefault(norm(w[0]), w)
    lex.update(extra_lex or {})
    SW = score_words(xmlf)
    out, problems, counter = [], [], {}
    for pname, role in parts.items():
        drafts = [p for p in D if p['role'] == role or (role in ('tenor', 'bass') and p['role'] == 'chorus')]
        streams = SW[pname]
        per = len(drafts) // nverses if nverses > 1 else len(drafts)
        for vi, (v, stream) in enumerate(sorted(streams.items())):
            dv = drafts[vi * per:(vi + 1) * per] if nverses > 1 else drafts
            sw = [(b, t) for b, t in stream if norm(t)]
            dw = [(i, j) for i, p in enumerate(dv) for j in range(len(p['words']))]
            a = [norm(dv[i]['words'][j][0]) for i, j in dw]; bn = [norm(t) for _, t in sw]
            def fit(k, d):
                """how many score words from k make draft line d (fuzzy for print-vs-libretto words), or 0"""
                ws = [x for x in (norm(w[0]) for w in dv[d]['words']) if x]
                if not ws or k >= len(bn): return 0
                if bn[k] != ws[0] and (min(len(bn[k]), len(ws[0])) < 5 or difflib.SequenceMatcher(None, bn[k], ws[0]).ratio() < 0.8): return 0
                best = (0, 0)
                for n in range(max(1, len(ws) - 2), len(ws) + 3):
                    r = difflib.SequenceMatcher(None, bn[k:k + n], ws, autojunk=False).ratio()
                    if r > best[0] + 1e-9: best = (r, n)
                return best[1] if best[0] >= 0.75 else 0
            segs, used, k = [], [], 0
            unused = list(range(len(dv)))
            while k < len(sw):
                hit = None
                if unused and (n := fit(k, unused[0])): hit = (unused[0], n, False)
                if hit is None:
                    for u in dict.fromkeys(used):
                        m = fit(k, u)
                        if m and (hit is None or m > hit[1]): hit = (u, m, True)
                if hit is None:   # a line the print sings out of the libretto's order
                    for u in unused[1:]:
                        if (n := fit(k, u)): hit = (u, n, False); break
                if hit:
                    d, n, rep = hit
                    segs.append([d, list(range(k, k + n)), rep])
                    if not rep: used.append(d); unused.remove(d)
                    k += n; continue
                if segs and segs[-1][0] == 'frag': segs[-1][1].append(k)
                else: segs.append(['frag', [k], True])
                k += 1
            # a repeated fragment joins the line it anticipates ("ich fühl' es, ich fühl' es, wie ..."), else the one before
            merged = []
            for i, sg in enumerate(segs):
                if sg[0] != 'frag': merged.append(sg); continue
                fw = [bn[x] for x in sg[1]]
                nx = segs[i + 1] if i + 1 < len(segs) else None
                nw = [x for x in (norm(w[0]) for w in dv[nx[0]]['words']) if x] if nx and nx[0] != 'frag' else []
                st = lambda xs: [x.rstrip('e') for x in xs]
                cut = len(fw)   # the longest tail of the fragment that begins the next line goes to it
                for c in range(len(fw)):
                    if nx and len(fw) - c <= len(nw) and st(nw[:len(fw) - c]) == st(fw[c:]): cut = c; break
                head, tail = sg[1][:cut], sg[1][cut:]
                if tail: nx[1][:0] = tail; nx[2] = True
                if head:
                    if merged: merged[-1][1].extend(head); merged[-1][2] = True
                    else: merged.append([None, head, True])
            segs = merged
            nxt = len(dv) if not unused else unused[0]
            for d in unused: problems.append(f'{sid} {role} v{v}: draft line not sung here (a copy is used): {dv[d]["original"]}')
            for d, idxs, rep in segs:
                src = dv[d] if d is not None else None
                words = []
                for k in idxs:
                    t = sw[k][1]; w = lex.get(norm(t))
                    if w is None:
                        problems.append(f'{sid} {role} v{v} bar {sw[k][0]}: no gloss/IPA for "{t}"'); w = [t, '?', '?']
                    words.append([t, w[1], w[2]])
                gl = []
                if src and len(src['words']) == len(words) and all(norm(x[0]) == norm(y[0]) for x, y in zip(src['words'], words)):
                    gl = copy.deepcopy(src.get('glossGroups', []))
                counter[role] = counter.get(role, 0) + 1
                ph = {'id': f'{role[:1] if not role.startswith("chorus") else "k"}{counter[role]}' if False else None,
                      'role': role, 'verse': int(v), 'occurrence': int(v) if nverses > 1 else 1,
                      'startMeasure': sw[idxs[0]][0],
                      'original': ' '.join(w[0] for w in words),
                      'translation': (trans or {}).get((role, sw[idxs[0]][0])) or (src['translation'] if src else '?'),
                      'ipa': ' '.join(w[2] for w in words),
                      'words': words, 'glossGroups': gl, 'audio': {}}
                if src is None: problems.append(f'{sid} {role} v{v}: words with no draft line: {ph["original"]}')
                out.append(ph)
    return out, problems


if __name__ == '__main__':
    import glob
    sid = sys.argv[1]; nv = int(sys.argv[2]); parts = dict(x.split('=') for x in sys.argv[3:])
    xmlf = glob.glob(f'/home/claude/work/zf_in/b1/{sid}_*/*.musicxml')[0]
    ph, pr = build(sid, xmlf, parts, nv)
    for p in ph: print(p['role'], 'v', p['verse'], 'bar', p['startMeasure'], '|', p['original'], '|', p['translation'][:50])
    print('\n'.join(pr) or 'ok')
