"""build2.py: the five Zauberflöte duets and trios of batch 2 into the app (content/pieces, sources/zauberfloete)."""
import json, os, shutil, subprocess, glob, sys
import xml.etree.ElementTree as ET
sys.path.insert(0, '/home/claude/work/zf_in')
from phrases import build as phrases
from runall2 import P, LEX, TR
V = '/home/claude/voices'; IN = '/home/claude/work/zf_in/b2'; KIT = '/home/claude/ext/giovanni/kit'
VOICE = {'tamino': ('Tamino', 'Tenor'), 'pamina': ('Pamina', 'Soprano'), 'papageno': ('Papageno', 'Baritone'),
         'queen': ('The Queen of the Night', 'Soprano'), 'sarastro': ('Sarastro', 'Bass'), 'monostatos': ('Monostatos', 'Tenor'),
         'tenor': ('Chorus of priests (tenors)', 'Tenor'), 'bass': ('Chorus of priests (basses)', 'Bass'),
         'priest1': ('First Priest', 'Tenor'), 'priest2': ('Second Priest', 'Bass'), 'knabe1': ('First Boy', 'Treble'),
         'knabe2': ('Second Boy', 'Treble'), 'knabe3': ('Third Boy', 'Treble')}
SHORT = {'queen': 'Queen', 'tenor': 'Chorus T.', 'bass': 'Chorus B.'}
REC = lambda b, k: f'Böhm 1964 {b}, Klemperer 1964 {k}'
# sid: editionId, title, subtitle, kind, number, pages, bars-words, tempo spec, recordings, passages
PIECES = {
    'S13': ('mozart-du-feines-taubchen', 'Du feines Täubchen, nur herein!', 'Monostatos, Pamina and Papageno: trio from Die Zauberflöte, Act 1', 'terzetto',
            'No. 6, Terzett', '45–47', '1:154:Allegro molto', 'Klemperer 1964 1:55, Böhm 1964 1:47, Abbado 2005 1:48, Christie 1995 1:53',
            [('a', 'The whole trio', '1', '71')]),
    'S15': ('mozart-bei-mannern-welche-liebe-fuhlen', 'Bei Männern, welche Liebe fühlen', 'Pamina and Papageno: duet from Die Zauberflöte, Act 1', 'duet',
            'No. 7, Duett', '49–51', '1:47:Andantino', 'Klemperer 1964 3:34, Böhm 1964 3:18, Solti 1969 3:10, Abbado 2005 2:59, Christie 1995 2:55',
            [('a', 'First verse', '1', '18'), ('b', 'Second verse', '19', '50')]),
    'S27': ('mozart-bewahret-euch-vor-weibertucken', 'Bewahret euch vor Weibertücken', 'The two priests: duet from Die Zauberflöte, Act 2', 'duet',
            'No. 11, Duett', '83', '1:93:Allegretto', 'Klemperer 1964 1:09, Böhm 1964 0:54, Abbado 2005 1:00, Christie 1995 1:09',
            [('a', 'The whole duet', '1', '25')]),
    'S38': ('mozart-seid-uns-zum-zweitenmal-willkommen', 'Seid uns zum zweitenmal willkommen', 'The three boys: trio from Die Zauberflöte, Act 2', 'terzetto',
            'No. 16, Terzett', '102–104', '1:72:Allegretto', 'Klemperer 1964 1:55, Abbado 2005 1:34, Christie 1995 1:24, Jacobs 2010 1:27',
            [('a', 'The whole trio', '1', '36')]),
    'S44': ('mozart-soll-ich-dich-theurer', "Soll ich dich, Theurer! nicht mehr seh'n?", 'Pamina, Tamino and Sarastro: trio from Die Zauberflöte, Act 2', 'terzetto',
            'No. 19, Terzett', '109–113', '1:101:Andante moderato', 'Klemperer 1964 3:16, Abbado 2005 2:54, Jacobs 2010 2:39, Christie 1995 4:41',
            [('a', 'The whole trio', '1', '78')]),
}
NOTES = {
    'S13': 'The print spells "Sclaven" and "Hass" and prints Papageno\'s "Aha!" as "A ha!" under two notes.',
    'S15': 'The two verses are printed one after the other. The print spells "versüsset", "Creatur" and "Edler\'s".',
    'S27': 'Both priests are printed on one staff (tenor above, bass below); each has his own line here. The print spells "liess".',
    'S38': 'The First and Second Boys share one staff in the print; each boy has his own line here. The print spells "Muthes".',
    'S44': 'The print has "sehn" and "wiedersehn" without an apostrophe but "seh\'n" in Sarastro\'s "wir seh\'n uns wieder", and spells "Theurer" and "tödtliche". Sarastro sings "ihr Wink soll ihm Gesetze sein" where Tamino sings "mir". In bar 37 the print gives Tamino no German syllable under his F; he sings "wie" with Pamina.',
}
IPA = ('IPA follows sung German stage diction: final -er, -ern as [ɐ]; the prefixes er-, ver-, zer- with [ɛr]; r elsewhere rolled or '
       'flipped; ch as [ç] after front vowels and [x] after back vowels; glottal stops [ʔ] before initial vowels; final b d g devoiced.')

report = []
for sid, (eid, title, sub, kind, num, pages, tspec, recs, passages) in PIECES.items():
    nv, parts = P[sid]
    xmlf = glob.glob(f'{IN}/{sid}_*/*.musicxml')[0]
    d = f'{V}/content/pieces/{eid}'; os.makedirs(d, exist_ok=True)
    shutil.copy(xmlf, f'{d}/score.musicxml')
    for cmd in (['python3', f'{KIT}/tempomap.py', f'{d}/score.musicxml', tspec], ['python3', '/home/claude/work/zf_in/b1/_kit_changes/tempodedupe.py', f'{d}/score.musicxml']):
        r = subprocess.run(cmd, capture_output=True, text=True)
        if r.returncode: print(r.stdout, r.stderr); sys.exit(1)
    root = ET.parse(f'{d}/score.musicxml').getroot()
    pname = {sp.get('id'): sp.findtext('part-name') for sp in root.iter('score-part')}
    bars = len(root.find('part').findall('measure'))
    ph, probs = phrases(sid, xmlf, parts, nv, extra_lex=LEX, trans=TR.get(sid))
    if [x for x in probs if 'a copy is used' not in x]: print(probs); sys.exit(1)
    cnt = {}
    for p in ph:
        cnt[p['role']] = cnt.get(p['role'], 0) + 1; p['id'] = f"{p['role'][:2]}{cnt[p['role']]}"
        p['startMeasure'] = str(p['startMeasure'])
    phr = [{k: p[k] for k in ('id', 'role', 'verse', 'occurrence', 'startMeasure', 'original', 'translation', 'ipa', 'words', 'glossGroups', 'audio')} for p in ph]
    L = {'editionId': eid, 'language': 'de', 'review': {'status': 'unreviewed-fixture'},
         'notes': 'Libretto by Emanuel Schikaneder (1791). Words as printed in the Edition Peters vocal score, which the app follows where it '
                  'differs from the libretto. ' + NOTES[sid] + ' ' + IPA, 'phrases': phr}
    json.dump(L, open(f'{d}/language.json', 'w'), ensure_ascii=False, indent=1)
    roles, pm = [], [{'key': 'piano', 'label': 'Piano', 'shortLabel': 'Piano', 'kind': 'piano', 'source': {'xmlPartId': None, 'staves': [1, 2]},
                      'channel': 0, 'program': 0, 'velocityScale': 0.8, 'defaultVolume': 0.7}]
    ch = 3
    for pid, nm in pname.items():
        if nm == 'Piano': pm[0]['source']['xmlPartId'] = pid; continue
        rid = parts.get(nm)
        if rid is None:   # a divided chorus line: plays, not practised
            pm.append({'key': f'chorus-{pid.lower()}', 'label': nm.replace('Chor der Priester', 'Chorus of priests'), 'shortLabel': nm.split('(')[-1].rstrip(')'),
                       'kind': 'chorus', 'source': {'xmlPartId': pid}, 'channel': ch, 'program': 0, 'velocityScale': 0.75, 'defaultVolume': 0.55}); ch += 1; continue
        name, vt = VOICE[rid]
        roles.append({'id': rid, 'name': name, 'voiceType': vt, 'partKey': rid})
        pm.append({'key': rid, 'label': f'{name} ({vt})', 'shortLabel': SHORT.get(rid, name), 'kind': 'voice', 'roleId': rid,
                   'source': {'xmlPartId': pid}, 'channel': ch, 'program': 0, 'velocityScale': 0.85, 'defaultVolume': 1.0}); ch += 1
    M = {'editionId': eid, 'editionVersion': '1.0.0-peters', 'title': title, 'subtitle': sub, 'kind': kind, 'fixture': False, 'pedal': 'classical',
         'composer': 'Wolfgang Amadeus Mozart', 'librettist': 'Emanuel Schikaneder', 'language': 'de',
         'files': {'musicxml': 'score.musicxml', 'language': 'language.json', 'audioDir': 'audio'}, 'roles': roles, 'partMapping': pm,
         'passages': [{'id': a, 'label': b, 'start': c, 'end': e} for a, b, c, e in passages],
         'licences': [
             {'item': 'Music', 'source': f'W. A. Mozart, Die Zauberflöte, K. 620 (1791), {num}', 'author': 'Wolfgang Amadeus Mozart (1756–1791)', 'licence': 'Public domain', 'notes': ''},
             {'item': 'Libretto text', 'source': 'Emanuel Schikaneder, libretto of Die Zauberflöte (1791)', 'author': 'Emanuel Schikaneder (1751–1812)',
              'licence': 'Public domain', 'notes': 'Words as printed in the Edition Peters vocal score.'},
             {'item': 'Score (score.musicxml)', 'source': f'Edition Peters vocal score, piano reduction by Gustav F. Kogel (Leipzig, plate 7794; IMSLP #225460), pages {pages} ({bars} bars)',
              'author': 'Gustav F. Kogel, piano reduction as printed', 'licence': 'Public domain',
              'notes': ('Written out from the printed pages by two independent readers, with a judge settling every difference and a sweep for '
                        'the marks, then a fresh check until clean, and checked against the print again here; every bar of every part adds up. '
                        'The Italian translation and the stage directions are left out. '
                        f'Playback tempo from the median length of complete recordings ({recs}).')},
             {'item': 'IPA, gloss and translation', 'source': 'Written for this app', 'author': 'Counterpart development team', 'licence': 'CC0 1.0',
              'notes': "The IPA was checked against Nico Castel's published libretto (Leyerle Publications); this app is not affiliated with Castel or his publisher. Unreviewed by a diction coach."}]}
    json.dump(M, open(f'{d}/manifest.json', 'w'), ensure_ascii=False, indent=1)
    sd = f'{V}/sources/zauberfloete/{sid.lower()}'; os.makedirs(sd, exist_ok=True)
    for f in glob.glob(f'{IN}/{sid}_*/*'): shutil.copy(f, sd + '/' + os.path.basename(f).replace(' ', '_'))
    report.append((sid, eid, bars, len(phr)))
os.makedirs(f'{V}/sources/zauberfloete/tools', exist_ok=True)
for f in ['phrases.py', 'words.py', 'runall.py', 'runall2.py', 'tempo.py', 'build.py', 'build2.py', 'pagecmp.py']: shutil.copy(f'/home/claude/work/zf_in/{f}', f'{V}/sources/zauberfloete/tools/')
shutil.copytree(f'{IN}/kit_additions', f'{V}/sources/zauberfloete/kit_additions', dirs_exist_ok=True)
shutil.copy(f'{IN}/BATCH2_SUMMARY.md', f'{V}/sources/zauberfloete/BATCH2_SUMMARY.md')
for x in report: print(x)
