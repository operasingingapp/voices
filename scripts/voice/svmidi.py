"""
Make Synthesizer V MIDI files for an aria's sung line on a vowel.
 - one note per sung note (ties joined); a new syllable sings "ah", a note inside a melisma sings "-" (SV carries
   the vowel on, legato, like a real run)
 - the score's meters and tempo map, so the render lines up with the app bar for bar
 - split into tracks of at most LIMIT notes, cut at rests where possible (trial voices only sing 40 notes per group)
    python3 svmidi.py PIECE_ID PART "Title - Role" OUT_DIR
"""
import json, sys, os, mido
piece, part, title, out = sys.argv[1:5]
LIMIT = 38
E = json.load(open(f'/home/claude/voices/data/content/{piece}/edition.json'))
meas = {m['idx']: m for m in E['measures']}
S = sorted((n for n in E['notes'] if n['part'] == part), key=lambda n: meas[n['m']]['startQ'] + n['q'])
ev = []
for n in S:
    Q = meas[n['m']]['startQ'] + n['q']
    if n['tieStop'] and ev and ev[-1]['midi'] == n['midi'] and abs(ev[-1]['end'] - Q) < 1e-6:
        ev[-1]['end'] = Q + n['dur']; continue
    ev.append({'q': Q, 'end': Q + n['dur'], 'midi': n['midi'], 'vel': n['vel'], 'new': bool(n.get('lyrics')), 'bar': n['m'] + 1})
ev[0]['new'] = True
# chunks
chunks, i = [], 0
while i < len(ev):
    if len(ev) - i <= LIMIT: chunks.append(ev[i:]); break
    best = None
    for j in range(i + LIMIT, i + 15, -1):  # break before note j
        gap = ev[j]['q'] - ev[j - 1]['end']
        if gap > 1e-6: best = j; break
    if best is None:
        best = next(j for j in range(i + LIMIT, i, -1) if ev[j]['new'])
    chunks.append(ev[i:best]); i = best
for c in chunks: c[0]['new'] = True
TPB = 960
def tick(q): return round(q * TPB)
def write(scale, label):
    f = mido.MidiFile(type=1, ticks_per_beat=TPB)
    meta = []
    prev_time = None
    for m in E['measures']:
        if m['time'] != prev_time:
            meta.append((tick(m['startQ']), mido.MetaMessage('time_signature', numerator=m['time'][0], denominator=m['time'][1])))
            prev_time = m['time']
        for t in m.get('tempos', []):
            meta.append((tick(m['startQ'] + t['q']), mido.MetaMessage('set_tempo', tempo=round(60e6 / (t['bpm'] * scale)))))
    t0 = mido.MidiTrack(); t0.append(mido.MetaMessage('track_name', name=title)); last = 0
    for at, msg in sorted(meta, key=lambda x: x[0]):
        msg.time = at - last; last = at; t0.append(msg)
    f.tracks.append(t0)
    for k, c in enumerate(chunks):
        tr = mido.MidiTrack(); tr.append(mido.MetaMessage('track_name', name=f'Part {k + 1} (bars {c[0]["bar"]}-{c[-1]["bar"]})'))
        last = 0
        for e in c:
            a, b = tick(e['q']), tick(e['end'])
            tr.append(mido.MetaMessage('lyrics', text='ah' if e['new'] else '-', time=a - last))
            tr.append(mido.Message('note_on', note=e['midi'], velocity=e['vel'], time=0))
            tr.append(mido.Message('note_off', note=e['midi'], velocity=0, time=b - a)); last = b
        f.tracks.append(tr)
    p = os.path.join(out, f'{title} - ah - {label}.mid'); f.save(p); return p
os.makedirs(out, exist_ok=True)
print(write(1.0, 'normal')); print(write(0.7, '70 percent'))
print(len(ev), 'notes in', len(chunks), 'parts:', [(len(c), c[0]['bar'], c[-1]['bar']) for c in chunks])
