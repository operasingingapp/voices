"""Score -> MusicXML for Cantai: every sung syllable becomes VOWEL (\"text\": the words as written) (melisma notes keep no lyric, so the vowel carries
on), tempos scaled by SCALE; with PART_ID, only that singer (and the piano) is kept.
    python3 vocalise.py IN.musicxml OUT.musicxml SCALE [VOWEL] [PART_ID]"""
import sys, re
import xml.etree.ElementTree as ET
src, dst, scale = sys.argv[1], sys.argv[2], float(sys.argv[3])
VOWEL = sys.argv[4] if len(sys.argv) > 4 else 'a'
KEEP = sys.argv[5] if len(sys.argv) > 5 else None  # a singer's part id: keep only that singer (and the piano)
tree = ET.parse(src); root = tree.getroot()
if KEEP:
    pl = root.find('part-list')
    names = {sp.get('id'): (sp.findtext('part-name') or '') for sp in pl.findall('score-part')}
    drop = {i for i, n in names.items() if i != KEEP and 'piano' not in n.lower()}
    for sp in list(pl.findall('score-part')):
        if sp.get('id') in drop: pl.remove(sp)
    # tempo marks often live in the top part only: carry them into the first part kept, at the same place
    parts = root.findall('part')
    kept = [pt for pt in parts if pt.get('id') not in drop]
    if kept and any(s.get('tempo') for pt in parts if pt.get('id') in drop for s in pt.iter('sound')) and not any(s.get('tempo') for s in kept[0].iter('sound')):
        src = next(pt for pt in parts if pt.get('id') in drop and any(s.get('tempo') for s in pt.iter('sound')))
        tgt = {m.get('number'): m for m in kept[0].findall('measure')}
        for m in src.findall('measure'):
            t, pos = tgt.get(m.get('number')), 0
            for el in list(m):
                if el.tag == 'note' and el.find('chord') is None: pos += int(el.findtext('duration') or 0)
                elif el.tag == 'backup': pos -= int(el.findtext('duration') or 0)
                elif el.tag == 'forward': pos += int(el.findtext('duration') or 0)
                elif el.tag == 'direction' and t is not None and el.find('sound') is not None and el.find('sound').get('tempo'):
                    import copy
                    d = copy.deepcopy(el)
                    for o in d.findall('offset'): d.remove(o)
                    if pos: ET.SubElement(d, 'offset').text = str(pos)
                    at = next((i for i, c in enumerate(t) if c.tag not in ('print', 'attributes')), len(t))
                    t.insert(at, d)
    for pt in list(root.findall('part')):
        if pt.get('id') in drop: root.remove(pt)
n = 0
for lyr in root.iter('lyric'):
    if lyr.get('number', '1') != '1':
        lyr.clear(); lyr.tag = 'drop'; continue
    n += 1
    if VOWEL == 'text': continue  # the words as written
    ext = lyr.find('extend')
    for c in list(lyr):
        if c.tag not in ('extend',): lyr.remove(c)
    s = ET.SubElement(lyr, 'syllabic'); s.text = 'single'
    t = ET.SubElement(lyr, 'text'); t.text = VOWEL
    if ext is not None: lyr.remove(ext); lyr.append(ext)
for note in root.iter('note'):
    for d in [c for c in note if c.tag == 'drop']: note.remove(d)
fmt = lambda v: ('%.2f' % v).rstrip('0').rstrip('.')
for s in root.iter('sound'):
    if s.get('tempo'): s.set('tempo', fmt(float(s.get('tempo')) * scale))
for p in root.iter('per-minute'):
    try: p.text = fmt(float(p.text) * scale)
    except ValueError: pass
# A tempo given only as a word ("Andante") and a <sound tempo> is read by MuseScore per beat of the metre: in 2/2,
# per half note, twice as fast as meant (MusicXML's sound tempo is always quarter notes). An explicit metronome
# mark in quarter notes leaves no doubt.
for d in root.iter('direction'):
    snd = d.find('sound')
    if snd is None or not snd.get('tempo') or d.find('.//metronome') is not None: continue
    dt = ET.Element('direction-type'); met = ET.SubElement(dt, 'metronome', {'parentheses': 'yes'})
    ET.SubElement(met, 'beat-unit').text = 'quarter'; ET.SubElement(met, 'per-minute').text = snd.get('tempo')
    d.insert(list(d).index(d.find('direction-type')) + 1 if d.find('direction-type') is not None else 0, dt)
# TEMPO_JSON: the app's own tempo map (scripts/voice/app-tempo.ts) replaces the score's tempo marks, so the render
# keeps exactly the app's time (its steady pulse, and its fermatas as written into that map: the score's fermatas
# are dropped so they are not held twice). Each point is an invisible metronome mark in the first part.
import os, json as _json
if os.environ.get('TEMPO_JSON'):
    pts = _json.load(open(os.environ['TEMPO_JSON']))
    for d in list(root.iter('direction')):
        snd = d.find('sound')
        if snd is not None and snd.get('tempo'):
            del snd.attrib['tempo']
        for dt in list(d.findall('direction-type')):
            if dt.find('metronome') is not None: d.remove(dt)
    for parent in root.iter():
        for c in [c for c in parent if c.tag == 'fermata']: parent.remove(c)
    # a notation program places a tempo mark on a note, not between notes (an <offset> is ignored): put each mark
    # just before a note or rest that starts at its position, in whichever part has one there
    def events(m, div):
        """(position in quarters, index in the measure) of each note or rest that starts somewhere new"""
        pos, out = 0, []
        for i, el in enumerate(list(m)):
            if el.tag == 'note':
                if el.find('chord') is None:
                    out.append((round(pos / div, 4), i))
                    if el.find('grace') is None: pos += int(el.findtext('duration') or 0)
            elif el.tag == 'backup': pos -= int(el.findtext('duration') or 0)
            elif el.tag == 'forward': pos += int(el.findtext('duration') or 0)
        return out
    parts = []
    for pt in root.findall('part'):
        div, meas = 1, {}
        for m in pt.findall('measure'):
            dv = m.find('attributes/divisions')
            if dv is not None: div = int(dv.text)
            meas[m.get('number')] = (m, div)
        parts.append(meas)
    missed = 0
    for pt in sorted(pts, key=lambda x: -x['q']):  # from the end of each bar, so earlier indices stay valid
        placed = False
        for meas in parts:
            m, dv = meas[str(pt['measure'])]
            at = next((i for q, i in events(m, dv) if abs(q - pt['q']) < 1e-3), None)
            if at is None: continue
            d = ET.Element('direction', {'placement': 'above'})
            dt = ET.SubElement(d, 'direction-type')
            met = ET.SubElement(dt, 'metronome', {'print-object': 'no'})
            ET.SubElement(met, 'beat-unit').text = 'quarter'
            ET.SubElement(met, 'per-minute').text = fmt(pt['bpm'] * scale)
            ET.SubElement(d, 'sound', {'tempo': fmt(pt['bpm'] * scale)})
            m.insert(at, d)
            placed = True
            break
        missed += not placed
    if missed: print('tempo marks with no note to sit on:', missed, file=sys.stderr)
tree.write(dst, encoding='UTF-8', xml_declaration=True)
print(dst, n, 'syllables')
