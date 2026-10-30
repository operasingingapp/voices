import json, subprocess, os
D='/home/claude/voices/src/standalone/recordings'
for line in open('/home/claude/ext/rec3/jobs.txt'):
    pc, part, sc, src = line.split()
    lab = '100' if sc == '1' else '70'
    base = f'/home/claude/ext/rec3/{pc}-{part}-{lab}'
    A = json.load(open(base + '.align.json'))
    out = f'{D}/{pc}'; os.makedirs(out, exist_ok=True)
    name = part + ('' if lab == '100' else '-70')
    subprocess.run(['python3', '/home/claude/voices/scripts/voice/encode-recording.py', src, f'{out}/{name}.mp3'], check=True)
    json.dump({'source': 'Cantai (MuseScore Studio), on "ah"; rendered from a score carrying the app\'s own timing' + ('' if lab == '100' else ', at 70%'),
               'tempo': float(sc), 'duration': A['duration'], 'onsets': {r['id']: r['audio'] for r in A['notes']}},
              open(f'{out}/{name}.json', 'w'), separators=(',', ':'))
