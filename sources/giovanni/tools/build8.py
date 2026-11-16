"""build8.py: put the five Act 2 recitatives of the second delivery (S49 S51 S53 S55 S57) into the app.
As build7.py, with: words fixed to the print per phrase (a word may become two), start bars found by walking each role's
sung words in the score (so every phrase is placed or reported), Donna Anna and the Commendatore, and a sectioned tempo
map for S53 (Recit. / the Commendatore's two Adagio entries)."""
import json, os, re, shutil, subprocess, glob, copy, sys
import xml.etree.ElementTree as ET
V = '/home/claude/voices'; G = '/home/claude/ext/giovanni'; IN = '/home/claude/work/dg_in/b2/Don_Giovanni_batch1_recitatives'
OUT = '/home/claude/work/dg_in/out'
NAMES = {'Don Giovanni': ('dongiovanni', 'Don Giovanni', 'Baritone'), 'Leporello': ('leporello', 'Leporello', 'Bass'),
         'Donna Elvira': ('elvira', 'Donna Elvira', 'Soprano'), 'Zerlina': ('zerlina', 'Zerlina', 'Soprano'),
         'Masetto': ('masetto', 'Masetto', 'Bass'), 'Don Ottavio': ('ottavio', 'Don Ottavio', 'Tenor'),
         'Donna Anna': ('anna', 'Donna Anna', 'Soprano'), 'Commendatore': ('commendatore', 'Commendatore', 'Bass')}
LETTER = {'dongiovanni': 'g', 'leporello': 'l', 'elvira': 'e', 'zerlina': 'z', 'masetto': 'm', 'ottavio': 'o', 'anna': 'a',
          'commendatore': 'c'}
EST = 91  # the median of the seven Act 2 recitatives timed from recordings (107, 91, 99, 85, 76, 126, 77)
# (sid, editionId, title, pages, tempo spec, basis)
PIECES = [
    ('S49', 'mozart-restati-qua', 'Restati quà!', '223–224', f'1:{EST}:a tempo;13:{EST}:Recit.',
     f'♩ = {EST}, estimated: the median pace of the seven Act 2 recitatives already timed from recordings. This scene was added for '
     'the Vienna performances of 1788 and is left out of the recordings consulted (Fricsay 1959, Davis 1973).'),
    ('S51', 'mozart-amico-per-pieta', 'Amico, per pietà', '232–233', f'1:{EST}:Recit.',
     f'♩ = {EST}, estimated: the median pace of the seven Act 2 recitatives already timed from recordings. This scene was added for '
     'the Vienna performances of 1788 and is left out of the recordings consulted (Fricsay 1959, Davis 1973).'),
    ('S53', 'mozart-ah-ah-ah-questa-e-buona', 'Ah, ah, ah, ah, questa è buona', '239–244',
     '1:91:Recit.;51:50:Adagio;56:91:Recit.;61:50:Adagio;66:91:Recit.',
     'recitative ♩ = 91, from the median length of 2 recordings (Fricsay 3:48, Davis 4:14) after allowing about 34 seconds for the '
     "Commendatore's two Adagio entries, which are played at ♩ = 50 (estimated)."),
    ('S55', 'mozart-calmatevi-idol-mio', 'Calmatevi, idol mio', '250–251', '1:82:Recit.',
     '♩ = 82, from the median length of 2 recordings (Fricsay 0:59, Davis 0:43).'),
    ('S57', 'mozart-ah-si-segua-il-suo-passo', 'Ah, si segua il suo passo', '256', f'1:{EST}:Recit.',
     f'♩ = {EST}, estimated: the median pace of the seven Act 2 recitatives already timed from recordings. This short scene belongs '
     'to the Vienna version of 1788.'),
]
# the print's words where the draft followed the libretto: (sid, phrase, draft word, [(word, gloss, ipa)], note)
PRINT = [
    ('S51', 'S51-002', "d'acqua", [("d'aqua", 'of water', 'ˈdak.kwa')], 'Leporello\'s "d\'aqua" as printed (libretto: d\'acqua).'),
    ('S51', 'S51-007', 'veder', [('vedere', 'see', 'veˈde.re')], 'Leporello\'s "io vo\' vedere" as printed (libretto: veder).'),
    ('S51', 'S51-012', 'alle', [('alla', 'to the', 'ˈal.la')], 'Leporello\'s "alla calcagna" as printed (libretto: alle).'),
    ('S51', 'S51-024', "s'aspetta", [('si', 'it', 'si'), ('aspetta', 'is expected', 'aˈspɛt.ta')],
     'Zerlina\'s "a lui si aspetta" as printed (libretto: s\'aspetta); the print\'s accent "aspettà" is a misprint and is left off.'),
    ('S53', 'S53-007', "com'è", [('come', 'how', 'ˈko.me'), ('è', 'it has', 'ɛ')], 'Don Giovanni\'s "come è finito" as printed (libretto: com\'è).'),
    ('S53', 'S53-033', 'incontrai;', [('incontrahi;', 'I met', 'iŋ.konˈtrai')], 'Don Giovanni\'s "incontrahi" as printed, an old spelling of incontrai.'),
    ('S53', 'S53-042', 'mi', [('me', 'me', 'me')], 'Don Giovanni\'s "allora me prende" as printed (libretto: mi).'),
    ('S53', 'S53-076', 'terribili', [('terribile', 'terrible', 'terˈri.bi.le')], 'Leporello\'s "che terribile occhiato" as printed (libretto: terribili occhiate).'),
    ('S53', 'S53-076', 'occhiate', [('occhiato', 'look', 'okˈkja.to')], ''),
    ('S55', 'S55-011', 'sì', [('si', 'such', 'si')], 'Donna Anna\'s "in si tristi" as printed, without the accent.'),
    ('S57', 'S57-002', 'divider', [('dividere', 'share', 'diˈvi.de.re')], 'Ottavio\'s "dividere i martiri" as printed (libretto: divider).'),
    ('S53', 'S53-037', 'so.', [('sò.', 'know', 'ˈsɔ')], 'Leporello\'s and Don Giovanni\'s "sò" carry the print\'s accent.'),
    ('S53', 'S53-048', 'so', [('sò', 'know', 'ˈsɔ')], ''),
    ('S53', 'S53-052', 'E', [('È', 'and', 'e')], 'Leporello\'s "È mi dite" as printed (libretto: E).'),
    ('S53', 'S53-076', 'dà!', [('da!', 'gives', 'ˈda')], ''),
    ('S51', 'S51-010', 'galantuom!', [("galant'uom!", 'honest man', 'ga.lanˈtwɔm')], 'Leporello\'s "galant\'uom" as printed.'),
    ('S49', 'S49-005', 'vuoi…', [('vuoi?', 'you want', 'ˈvwɔi')], ''),
    ('S55', 'S55-009', 'amor…', [('amor.', 'love', 'aˈmor')], ''),
]
EXTRA_NOTES = {'S55': 'Donna Anna\'s "Ma il padre" is printed "Ma iì padre", a misprint; it is sung "il". The last bar is shared with No. 23: '
                      'its first word, Anna\'s "Crudele?", begins the next piece and is left out here.',
               'S49': 'Zerlina\'s "Restati quà!" is sung four times as printed.'}
norm = lambda s: re.sub(r"[^\w]", '', unicodedata.normalize('NFD', s.lower()).encode('ascii', 'ignore').decode()) if s else ''
import unicodedata


def score_tokens(xml):
    """{role: [(bar, token)]}: every sung word, split at elisions."""
    r = ET.parse(xml).getroot()
    pname = {sp.get('id'): sp.findtext('part-name') for sp in r.iter('score-part')}
    out = {}
    for part in r.findall('part'):
        nm = pname.get(part.get('id'))
        if nm not in NAMES: continue
        words, cur = [], None
        for m in part.findall('measure'):
            for n in m.findall('note'):
                for ly in n.findall('lyric'):
                    if ly.get('number') not in (None, '1'): continue
                    syl = ly.findtext('syllabic'); texts = [t.text or '' for t in ly.findall('text')]
                    for k, t in enumerate(texts):
                        if k == 0 and syl in ('middle', 'end') and cur: cur[1] += t
                        else:
                            if cur: words.append(cur)
                            cur = [m.get('number'), t]
        if cur: words.append(cur)
        out[NAMES[nm][0]] = [(b, norm(w)) for b, w in words if norm(w)]
    return out


report, problems = [], []
for sid, eid, title, pages, tspec, basis in PIECES:
    src = glob.glob(f'{IN}/{sid}_*/')[0]
    xml = glob.glob(src + '*.musicxml')[0]
    d = f'{V}/content/pieces/{eid}'; os.makedirs(d, exist_ok=True)
    r = ET.parse(xml).getroot()
    pname = {sp.get('id'): sp.findtext('part-name') for sp in r.iter('score-part')}
    bars = len(r.find('part').findall('measure'))
    shutil.copy(xml, f'{d}/score.musicxml')
    tm = subprocess.run(['python3', f'{G}/kit/tempomap.py', f'{d}/score.musicxml', tspec], capture_output=True, text=True)
    if tm.returncode: print(tm.stderr); sys.exit(1)
    tokens = score_tokens(xml)
    # --- language
    D = json.load(open(f'{G}/draft/lib/{sid}.json'))
    dphr = D['phrases']
    if sid == 'S49':  # Zerlina sings "Restati quà!" four times; the draft has it once
        first = dphr[0]; rep = [copy.deepcopy(first) for _ in range(3)]
        last = rep[2]
        last['original'] = 'Restati quà, quà, quà!'; last['ipa'] = 'ˈrɛ.sta.ti ˈkwa ˈkwa ˈkwa'
        last['words'] = [['Restati', 'stay', 'ˈrɛ.sta.ti'], ['quà,', 'here', 'ˈkwa'], ['quà,', 'here', 'ˈkwa'], ['quà!', 'here', 'ˈkwa']]
        last['translation'] = 'Stay right here, here, here!'
        for p in rep: p.pop('note', None)
        # order: z bar 3, z bar 5, l bar 7, z bar 9, z bar 11, l bar 13 ...
        dphr = [first, rep[0], dphr[1], rep[1], rep[2]] + dphr[2:]
        # "strascinarmi_a coda": the elided "a" joins the two lines into one phrase
        i = next(k for k, p in enumerate(dphr) if p.get('id') == 'S49-015'); a, b = copy.deepcopy(dphr[i]), dphr[i + 1]
        n = len(a['words'])
        a['original'] += ' ' + b['original']; a['translation'] = a['translation'] + ' ' + b['translation']
        a['ipa'] += ' ' + b['ipa']; a['words'] += copy.deepcopy(b['words'])
        a['glossGroups'] = a.get('glossGroups', []) + [dict(g, words=[w + n for w in g['words']]) for g in b.get('glossGroups', [])]
        dphr[i:i + 2] = [a]
    phrases, notes, counter, ptr = [], [], {}, {}
    for ph in dphr:
        for role in ph['role'].split('+'):
            p = copy.deepcopy(ph)
            for k in ('line', 'page', 'id'): p.pop(k, None)
            if 'note' in p: notes.append(p.pop('note'))
            p['role'] = role
            for (s, pid, dw, new, nt) in PRINT:
                if s != sid or pid != ph['id']: continue
                for i, w in enumerate(p['words']):
                    if w[0] == dw:
                        p['words'][i:i + 1] = [[a, g, ipa] for a, g, ipa in new]
                        p['original'] = p['original'].replace(dw.rstrip(';,.!?'), ' '.join(a for a, _, _ in new).rstrip(';,.!?'), 1)
                        p['ipa'] = p['ipa'].replace(w[2], ' '.join(ipa for _, _, ipa in new), 1)
                        if nt and nt not in notes: notes.append(nt)
                        break
                else:
                    problems.append(f'{sid} {pid}: {dw} not found')
            # start bar: walk this role's score words
            toks = tokens.get(role, []); k = ptr.get(role, 0)
            pw = [norm(w[0]) for w in p['words'] if norm(w[0])]
            # match the phrase's words to the score's, allowing an elided pair ("sce_il") as one or two tokens
            seq = ''.join(pw); start = None; got = ''; j = k
            while j < len(toks) and len(got) < len(seq):
                if start is None and not seq.startswith(toks[j][1]): j += 1; continue
                if start is None: start = toks[j][0]
                got += toks[j][1]; j += 1
            if got != seq:
                problems.append(f'{sid} {role} "{p["original"]}": score has "{got}" from bar {start}')
            if start is not None: ptr[role] = j
            counter[role] = counter.get(role, 0) + 1
            p['id'] = f'{LETTER[role]}{counter[role]}'
            p['verse'] = 1; p['occurrence'] = 1
            p['startMeasure'] = str(start)
            p['audio'] = {}
            p.setdefault('glossGroups', [])
            phrases.append({k2: p[k2] for k2 in ('id', 'role', 'verse', 'occurrence', 'startMeasure', 'original', 'translation', 'ipa', 'words', 'glossGroups', 'audio')})
    for role, toks in tokens.items():
        if ptr.get(role, 0) < len(toks): problems.append(f'{sid} {role}: score words left over from bar {toks[ptr.get(role, 0)][0]}: {[t for _, t in toks[ptr.get(role, 0):]][:8]}')
    if sid in EXTRA_NOTES: notes.append(EXTRA_NOTES[sid])
    L = {'editionId': eid, 'language': 'it', 'review': {'status': 'unreviewed-fixture'},
         'notes': 'Libretto by Lorenzo Da Ponte (1787). Words as sung in the Schirmer vocal score, which the app follows where it differs from the libretto. ' + ' '.join(notes),
         'phrases': phrases}
    json.dump(L, open(f'{d}/language.json', 'w'), ensure_ascii=False, indent=1)
    # --- manifest
    roles, pm = [], [{'key': 'piano', 'label': 'Piano', 'shortLabel': 'Piano', 'kind': 'piano', 'source': {'xmlPartId': None, 'staves': [1, 2]},
                      'channel': 0, 'program': 0, 'velocityScale': 0.8, 'defaultVolume': 0.7}]
    for pid, nm in pname.items():
        if nm == 'Piano': pm[0]['source']['xmlPartId'] = pid; continue
        rid, name, vt = NAMES[nm]
        roles.append({'id': rid, 'name': name, 'voiceType': vt, 'partKey': rid})
        pm.append({'key': rid, 'label': f'{name} ({vt})', 'shortLabel': name, 'kind': 'voice', 'roleId': rid, 'source': {'xmlPartId': pid},
                   'channel': 3 + len(roles) - 1, 'program': 0, 'velocityScale': 0.85, 'defaultVolume': 1.0})
    who = [x['name'] for x in roles]
    whos = ', '.join(who[:-1]) + ' and ' + who[-1] if len(who) > 1 else who[0]
    M = {'editionId': eid, 'editionVersion': '1.0.0-schirmer', 'title': title, 'subtitle': f'{whos}: recitative from Don Giovanni, Act 2',
         'kind': 'recitative', 'fixture': False, 'pedal': 'classical', 'composer': 'Wolfgang Amadeus Mozart', 'librettist': 'Lorenzo Da Ponte', 'language': 'it',
         'files': {'musicxml': 'score.musicxml', 'language': 'language.json', 'audioDir': 'audio'}, 'roles': roles, 'partMapping': pm,
         'passages': [{'id': 'a', 'label': 'The whole piece', 'start': '1', 'end': str(bars)}],
         'licences': [
             {'item': 'Music', 'source': 'W. A. Mozart, Don Giovanni, K. 527 (1787), Act 2', 'author': 'Wolfgang Amadeus Mozart (1756–1791)', 'licence': 'Public domain', 'notes': ''},
             {'item': 'Libretto text', 'source': 'Lorenzo Da Ponte, libretto of Don Giovanni (1787)', 'author': 'Lorenzo Da Ponte (1749–1838)', 'licence': 'Public domain',
              'notes': 'Words as printed in the Schirmer vocal score.'},
             {'item': 'Score (score.musicxml)', 'source': f'G. Schirmer vocal score, New York 1900 (plate 15147, IMSLP #68957), page{"s" if "–" in pages else ""} {pages} ({bars} bars)',
              'author': 'G. Schirmer, piano reduction as printed', 'licence': 'Public domain',
              'notes': ('Written out from the printed pages by one reader, checked bar by bar by a separate fresh checker, then checked again '
                        'against the print here; every bar of every part adds up. '
                        'The English singing translation and the stage directions are left out. Secco recitative: the keyboard is written as the piano. '
                        f'Playback tempo: free, as recitative is sung; played here at a speaking pace, {basis}')},
             {'item': 'IPA, gloss and translation', 'source': 'Written for this app', 'author': 'Counterpart development team', 'licence': 'CC0 1.0',
              'notes': "The IPA was checked against Nico Castel's published libretto (Leyerle Publications); this app is not affiliated with Castel or his publisher. Unreviewed by a diction coach."}]}
    json.dump(M, open(f'{d}/manifest.json', 'w'), ensure_ascii=False, indent=1)
    sd = f'{V}/sources/giovanni/{sid.lower()}'; os.makedirs(sd, exist_ok=True)
    for f in glob.glob(src + '*'): shutil.copy(f, sd + '/' + os.path.basename(f).replace(' ', '_'))
    report.append((sid, eid, bars, len(phrases), whos))
for x in report: print(x)
print('\n'.join(problems) or 'no problems')
json.dump([[r[0], r[1], r[2], r[4]] for r in report], open('/home/claude/work/dg_in/built8.json', 'w'), ensure_ascii=False)
