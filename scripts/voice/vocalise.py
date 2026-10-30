"""Score -> MusicXML for Cantai: every sung syllable becomes VOWEL (melisma notes keep no lyric, so the vowel carries
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
    if lyr.get('number', '1') not in ('1', None) and lyr.get('number') != '1':
        lyr.clear(); lyr.tag = 'drop'; continue
    ext = lyr.find('extend')
    for c in list(lyr):
        if c.tag not in ('extend',): lyr.remove(c)
    s = ET.SubElement(lyr, 'syllabic'); s.text = 'single'
    t = ET.SubElement(lyr, 'text'); t.text = VOWEL
    if ext is not None: lyr.remove(ext); lyr.append(ext)
    n += 1
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
tree.write(dst, encoding='UTF-8', xml_declaration=True)
print(dst, n, 'syllables')
