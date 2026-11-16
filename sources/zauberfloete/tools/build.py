"""build.py: the eight Zauberflöte pieces of batch 1 into the app (content/pieces, sources/zauberfloete)."""
import json, os, shutil, subprocess, glob, sys
import xml.etree.ElementTree as ET
sys.path.insert(0, '/home/claude/work/zf_in')
from phrases import build as phrases
from runall import P, LEX, TR
V = '/home/claude/voices'; IN = '/home/claude/work/zf_in/b1'; KIT = '/home/claude/ext/giovanni/kit'
VOICE = {'tamino': ('Tamino', 'Tenor'), 'pamina': ('Pamina', 'Soprano'), 'papageno': ('Papageno', 'Baritone'),
         'queen': ('The Queen of the Night', 'Soprano'), 'sarastro': ('Sarastro', 'Bass'), 'monostatos': ('Monostatos', 'Tenor'),
         'tenor': ('Chorus of priests (tenors)', 'Tenor'), 'bass': ('Chorus of priests (basses)', 'Bass')}
SHORT = {'queen': 'Queen', 'tenor': 'Chorus T.', 'bass': 'Chorus B.'}
REC = lambda b, k: f'Böhm 1964 {b}, Klemperer 1964 {k}'
# sid: editionId, title, subtitle, kind, number, pages, bars-words, tempo spec, recordings, passages
PIECES = {
    'S05': ('mozart-der-vogelfanger-bin-ich-ja', 'Der Vogelfänger bin ich ja', "Papageno's song from Die Zauberflöte, Act 1", 'aria',
            'No. 2, Lied', '22–23', '1:76:Andante', REC('2:35', '2:40'), [('a', 'The whole song (three verses)', '1', '52')]),
    'S07': ('mozart-dies-bildniss-ist-bezaubernd-schon', 'Dies Bildniss ist bezaubernd schön', "Tamino's aria from Die Zauberflöte, Act 1",
            'aria', 'No. 3, Arie', '25–27', '1:29:Larghetto', REC('4:36', '4:11'), [('a', 'The whole aria', '1', '64')]),
    'S09': ('mozart-o-zittre-nicht', 'O zittre nicht, mein lieber Sohn', "The Queen of the Night's recitative and aria from Die Zauberflöte, Act 1",
            'aria', 'No. 4, Recitativ und Arie', '27–31', '1:91:Allegro maestoso;11:72:Recit.;21:45:Largo;61:109:Allegro moderato',
            REC('5:23', '5:08'), [('a', 'O zittre nicht (recitative)', '1', '20'), ('b', 'Zum Leiden bin ich auserkoren (Largo)', '21', '60'),
                                   ('c', 'Du, du, du wirst sie zu befreien gehen (Allegro moderato)', '61', '103')]),
    'S25': ('mozart-o-isis-und-osiris', 'O Isis und Osiris', "Sarastro's aria with the chorus of priests from Die Zauberflöte, Act 2",
            'aria', 'No. 10, Arie mit Chor', '81–82', '1:54:Adagio', REC('2:56', '3:16'), [('a', 'The whole aria', '1', '55')]),
    'S32': ('mozart-alles-fuhlt-der-liebe-freuden', 'Alles fühlt der Liebe Freuden', "Monostatos's aria from Die Zauberflöte, Act 2", 'aria',
            'No. 13, Arie', '94–95', '1:135:Allegro', REC('1:19', '1:23'), [('a', 'The whole aria (two verses)', '1', '49')]),
    'S36': ('mozart-in-diesen-heilgen-hallen', "In diesen heil'gen Hallen", "Sarastro's aria from Die Zauberflöte, Act 2", 'aria',
            'No. 15, Arie', '100–101', '1:24:Larghetto', REC('4:04', '4:49'), [('a', 'The whole aria (two verses)', '1', '30')]),
    'S40': ('mozart-ach-ich-fuhls', "Ach, ich fühl's, es ist verschwunden", "Pamina's aria from Die Zauberflöte, Act 2", 'aria',
            'No. 17, Arie', '105–106', '1:29:Andante', REC('4:31', '4:08'), [('a', 'The whole aria', '1', '41')]),
    'S46': ('mozart-ein-madchen-oder-weibchen', 'Ein Mädchen oder Weibchen', "Papageno's aria from Die Zauberflöte, Act 2", 'aria',
            'No. 20, Arie', '114–119', '1:52:Andante;22:131:Allegro;45:52:Andante;66:131:Allegro;89:52:Andante;110:131:Allegro',
            REC('3:55', '4:19'), [('a', 'First stanza', '1', '44'), ('b', 'Second stanza', '45', '88'), ('c', 'Third stanza', '89', '140')]),
}
NOTES = {
    'S05': 'Three verses on one set of notes, sung through the repeat. The print\'s spellings are kept ("D\'rum", "schlief").',
    'S07': 'The print spells "Bildniss" and "gesehn".',
    'S09': 'The print\'s words are kept: "dies tiefgebeugte Mutterherz" (libretto: das tief betrübte), "Hülfe", and the Queen\'s added "ja".',
    'S25': 'The priests\' chorus: the tenors and basses sing the top line of their staff; where a staff divides, the lower line plays with the piano.',
    'S32': 'Two verses, sung through the repeat. The print\'s words are kept: "ich bin auch den Mädchen gut" (libretto: bin ich nicht von Fleisch und Blut), "herzt", "Höllengluth".',
    'S36': 'Two verses, sung through the repeat. The print spells "Verräther" and "vergiebt".',
    'S40': 'The print\'s words are kept: "ewig hin mein ganzes Glück" (bar 4; the libretto has only "ewig hin der Liebe Glück"), "verschwunden", "Nimmer kommt ihr", and "so wird Ruhe" before "so wird Ruh\'".',
    'S46': 'The three stanzas are written out. The print sings "Wird keine mir Liebe gewähren" second and "Ach, kann ich denn keiner von allen" last, the other way round from the libretto, and spells "Elisium" and "freun"; the IPA keeps the usual Elysium.',
}
IPA = ('IPA follows sung German stage diction: final -er, -ern as [ɐ]; the prefixes er-, ver-, zer- with [ɛr]; r elsewhere rolled or '
       'flipped; ch as [ç] after front vowels and [x] after back vowels; glottal stops [ʔ] before initial vowels; final b d g devoiced.')

report = []
for sid, (eid, title, sub, kind, num, pages, tspec, recs, passages) in PIECES.items():
    nv, parts = P[sid]
    xmlf = glob.glob(f'{IN}/{sid}_*/*.musicxml')[0]
    d = f'{V}/content/pieces/{eid}'; os.makedirs(d, exist_ok=True)
    shutil.copy(xmlf, f'{d}/score.musicxml')
    for cmd in (['python3', f'{KIT}/tempomap.py', f'{d}/score.musicxml', tspec], ['python3', f'{IN}/_kit_changes/tempodedupe.py', f'{d}/score.musicxml']):
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
                        f'Playback tempo from the length of two complete recordings ({recs}), with the piece\'s repeats.')},
             {'item': 'IPA, gloss and translation', 'source': 'Written for this app', 'author': 'Counterpart development team', 'licence': 'CC0 1.0',
              'notes': "The IPA was checked against Nico Castel's published libretto (Leyerle Publications); this app is not affiliated with Castel or his publisher. Unreviewed by a diction coach."}]}
    json.dump(M, open(f'{d}/manifest.json', 'w'), ensure_ascii=False, indent=1)
    sd = f'{V}/sources/zauberfloete/{sid.lower()}'; os.makedirs(sd, exist_ok=True)
    for f in glob.glob(f'{IN}/{sid}_*/*'): shutil.copy(f, sd + '/' + os.path.basename(f).replace(' ', '_'))
    report.append((sid, eid, bars, len(phr)))
os.makedirs(f'{V}/sources/zauberfloete/tools', exist_ok=True)
for f in ['phrases.py', 'words.py', 'runall.py', 'tempo.py', 'build.py', 'pagecmp.py']: shutil.copy(f'/home/claude/work/zf_in/{f}', f'{V}/sources/zauberfloete/tools/')
shutil.copytree(f'{IN}/_kit_changes', f'{V}/sources/zauberfloete/kit_changes', dirs_exist_ok=True)
shutil.copy(f'{IN}/BATCH_NOTES.md', f'{V}/sources/zauberfloete/BATCH1_NOTES.md')
for x in report: print(x)
