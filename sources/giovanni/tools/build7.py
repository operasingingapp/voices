"""build7.py: put the seven Act 2 recitatives of the transcriber's batch into the app (content/pieces, sources/giovanni).
Language files start from the drafts (ext/giovanni/draft/lib/Snn.json), with the score's words where the print differs, the
app's existing (Castel-checked) IPA for words already in Don Giovanni, and start bars from the score (align.py)."""
import json, os, re, shutil, subprocess, glob, copy
V = '/home/claude/voices'; G = '/home/claude/ext/giovanni'; IN = '/home/claude/work/dg_in/b1/Don_Giovanni_batch1_recits_7of12'
OUT = '/home/claude/work/dg_in/out'
NAMES = {'Don Giovanni': ('dongiovanni', 'Don Giovanni', 'Baritone'), 'Leporello': ('leporello', 'Leporello', 'Bass'),
         'Donna Elvira': ('elvira', 'Donna Elvira', 'Soprano'), 'Zerlina': ('zerlina', 'Zerlina', 'Soprano'),
         'Masetto': ('masetto', 'Masetto', 'Bass'), 'Don Ottavio': ('ottavio', 'Don Ottavio', 'Tenor')}
LETTER = {'dongiovanni': 'g', 'leporello': 'l', 'elvira': 'e', 'zerlina': 'z', 'masetto': 'm', 'ottavio': 'o'}
# (sid, editionId, title, pages, quarter-note tempo, [recordings (name, seconds)])
PIECES = [
    ('S34', 'mozart-leporello-signore', 'Leporello! Signore!', '162–164', [('Fricsay', 102), ('Böhm', 105), ('Karajan', 115)]),
    ('S36', 'mozart-amico-che-ti-par', 'Amico, che ti par?', '171–173', [('Fricsay', 115), ('Böhm', 123), ('Karajan', 29 + 97)]),
    ('S38', 'mozart-ve-gente-alla-finestra', "V'è gente alla finestra", '176–177', [('Fricsay', 67), ('Böhm', 67), ('Karajan', 4 + 67)]),
    ('S40', 'mozart-zitto-lascia-chio-senta', "Zitto, lascia ch'io senta!", '182–184', [('Fricsay', 41 + 75), ('Böhm', 51 + 103), ('Karajan', 48 + 86)]),
    ('S42', 'mozart-di-molte-faci-il-lume', "Di molte faci il lume s'avvicina", '187', [('Fricsay', 23), ('Böhm', 30), ('Karajan', 33)]),
    ('S45', 'mozart-dunque-quello-sei-tu', 'Dunque quello sei tu', '213', [('Fricsay', 22), ('Böhm', 21)]),
    ('S47', 'mozart-ferma-perfido-ferma', 'Ferma, perfido, ferma!', '217–218', [('Fricsay', 47), ('Böhm', 43)]),
]
# the print's words where the draft followed the libretto: (sid, draft word, printed word, IPA, note)
PRINT = [('S34', 'avvezzate;', 'avvezzaste;', 'av.vetˈtsa.ste', 'Leporello sings "avvezzaste" as printed (libretto: avvezzate).'),
         ('S40', 'questa', 'questo', 'ˈkwe.sto', 'Zerlina\'s "con questo tua pazza gelosia" as printed (libretto: questa).'),
         ('S47', 'qual', 'quel', 'kwel', 'Zerlina\'s "Con quel arte" as printed (libretto: qual).'),
         ('S47', 'ricorso', 'ricorsa', 'riˈkor.sa', 'Ottavio\'s "un ricorsa" as printed (libretto: ricorso).')]
# the app's Castel-checked forms of words already in Don Giovanni
SAME = {'lei': 'ˈlei', 'tu': 'tu', 'conosci': 'koˈnɔʃ.ʃi', 'cospetto': 'koˈspɛt.to', 'ahi': 'ˈai'}
norm = lambda s: re.sub(r"[^\w']", '', s.lower().replace('’', "'"))

def recit_tempo(q, recs):
    secs = sorted(s for n, s in recs)
    med = secs[len(secs) // 2] if len(secs) % 2 else (secs[len(secs) // 2 - 1] + secs[len(secs) // 2]) / 2
    return round(q * 60 / (med - 1.5)), med

report = []
for sid, eid, title, pages, recs in PIECES:
    src = glob.glob(f'{IN}/{sid}_*/')[0]
    xml = glob.glob(src + '*.musicxml')[0]
    d = f'{V}/content/pieces/{eid}'; os.makedirs(d, exist_ok=True)
    # --- score: the checked xml, with the tempo from the recordings
    root = open(xml).read()
    import xml.etree.ElementTree as ET
    r = ET.fromstring(root.split('?>', 1)[-1] if root.startswith('<?xml') else root)
    pname = {sp.get('id'): sp.findtext('part-name') for sp in r.iter('score-part')}
    quarters = {'S34': 184, 'S36': 184, 'S38': 108, 'S40': 188, 'S42': 36, 'S45': 42, 'S47': 56}[sid]
    bars = len(r.find('part').findall('measure'))
    tempo, med = recit_tempo(quarters, recs)
    shutil.copy(xml, f'{d}/score.musicxml')
    tm = subprocess.run(['python3', f'{G}/kit/tempomap.py', f'{d}/score.musicxml', f'1:{tempo}:Recit.'], capture_output=True, text=True)
    # --- language
    D = json.load(open(f'{G}/draft/lib/{sid}.json'))
    A = {p['id']: p for p in json.load(open(f'{OUT}/{sid}.json'))['phrases']}
    phrases, notes, counter = [], [], {}
    for ph in D['phrases']:
        for role in ph['role'].split('+'):
            p = copy.deepcopy(ph)
            for k in ('line', 'page', 'id'): p.pop(k, None)
            if 'note' in p: notes.append(p.pop('note'))
            p['role'] = role
            for (s, dw, pw, ipa, nt) in PRINT:
                if s != sid: continue
                for w in p['words']:
                    if w[0] == dw:
                        old = w[2]; w[0] = pw; w[2] = ipa
                        p['original'] = p['original'].replace(dw.rstrip(';,.!?'), pw.rstrip(';,.!?'), 1)
                        p['ipa'] = p['ipa'].replace(old, ipa, 1)
                        if nt not in notes: notes.append(nt)
            for w in p['words']:
                k = norm(w[0]).strip("'")
                if k in SAME and w[2] != SAME[k]:
                    old = w[2]; w[2] = SAME[k]; p['ipa'] = p['ipa'].replace(old, SAME[k], 1)
            counter[role] = counter.get(role, 0) + 1
            p['id'] = f'{LETTER[role]}{counter[role]}'
            p['verse'] = 1; p['occurrence'] = 1
            st = A.get(ph['id'], {}).get('start')
            if role != ph['role'].split('+')[0]:
                # the second singer of a shared line: find their bar in the score
                sc = json.load(open(f'{OUT}/{sid}.json'))['score'][role]
                first = norm(p['words'][0][0]).replace("'", '')
                st = next((b for b, w in reversed(sc) if norm(w).replace("'", '') == first), st)
            p['startMeasure'] = str(st)
            p['audio'] = {}
            p.setdefault('glossGroups', [])
            phrases.append({k: p[k] for k in ('id', 'role', 'verse', 'occurrence', 'startMeasure', 'original', 'translation', 'ipa', 'words', 'glossGroups', 'audio')})
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
    recs_txt = ', '.join(f'{n} {s // 60}:{s % 60:02d}' for n, s in recs)
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
              'notes': ('Written out from the printed pages by one reader, then checked bar by bar by a separate fresh checker; every bar of every part adds up. '
                        'The English singing translation and the stage directions are left out. Secco recitative: the keyboard is written as the piano. '
                        f'Playback tempo: free, as recitative is sung; played here at a speaking pace, ♩ = {tempo}, from the median length of '
                        f'{len(recs)} recordings ({recs_txt}).')},
             {'item': 'IPA, gloss and translation', 'source': 'Written for this app', 'author': 'Counterpart development team', 'licence': 'CC0 1.0',
              'notes': "The IPA was checked against Nico Castel's published libretto (Leyerle Publications); this app is not affiliated with Castel or his publisher. Unreviewed by a diction coach."}]}
    json.dump(M, open(f'{d}/manifest.json', 'w'), ensure_ascii=False, indent=1)
    # --- sources
    sd = f'{V}/sources/giovanni/{sid.lower()}'; os.makedirs(sd, exist_ok=True)
    for f in glob.glob(src + '*'): shutil.copy(f, sd + '/' + os.path.basename(f).replace(' ', '_'))
    report.append((sid, eid, bars, tempo, med, len(phrases), whos, tm.stdout.strip()[-80:]))
for x in report: print(x)
json.dump([[r[0], r[1], r[2], r[3], r[6]] for r in report], open('/home/claude/work/dg_in/built.json', 'w'), ensure_ascii=False)
