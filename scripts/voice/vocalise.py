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
tree.write(dst, encoding='UTF-8', xml_declaration=True)
print(dst, n, 'syllables')
