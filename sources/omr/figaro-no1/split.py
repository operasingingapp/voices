"""Split the corrected No. 1 into the Duettino (bars 1-88) and the recitative (89-107, renumbered 1-19)."""
import copy, sys
import xml.etree.ElementTree as ET
SRC = 'Act_1_Scene_1_corrected.xml'
head = open(SRC).read().split('<score-partwise', 1)[0]
def cut(a, b, out, title, tempo, first_attrs):
    t = ET.parse(SRC); r = t.getroot()
    r.find('work/work-title').text = title
    for p in r.findall('part'):
        ms = p.findall('measure')
        # attributes in force at bar a (divisions, key, time, clefs)
        state = {}
        for m in ms[:a]:
            for at in m.findall('attributes'):
                for c in at:
                    k = c.tag + (c.get('number') or '')
                    state[k] = copy.deepcopy(c)
        for m in ms:
            n = int(m.get('number'))
            if n < a or n > b:
                p.remove(m)
        keep = [m for m in p.findall('measure')]
        for i, m in enumerate(keep):
            m.set('number', str(i + 1))
        f = keep[0]
        at0 = f.find('attributes')
        if at0 is None:
            at0 = ET.Element('attributes'); f.insert(0, at0)
        order = ['divisions', 'key', 'time', 'staves', 'clef1', 'clef2', 'clef']
        have = {c.tag + (c.get('number') or '') for c in at0}
        new = ET.Element('attributes')
        for k in order:
            src = None
            for c in at0:
                if c.tag + (c.get('number') or '') == k: src = c
            if src is None and k in state and not (p.get('id') != 'P3' and k in ('staves', 'clef1', 'clef2')):
                src = state[k]
            if src is not None: new.append(copy.deepcopy(src))
        f.remove(at0); f.insert(0, new)
        # remove a final barline/time change artefacts beyond b: none
        if p.get('id') == 'P3' and tempo:
            d = ET.Element('direction', placement='above')
            ET.SubElement(ET.SubElement(d, 'direction-type'), 'words').text = tempo[0]
            ET.SubElement(d, 'sound', tempo=str(tempo[1]))
            # replace any existing tempo word direction at the start
            for old in f.findall('direction'):
                if old.find('direction-type/words') is not None and old.findtext('direction-type/words') in ('Allegro', 'Recitativo'):
                    f.remove(old)
            f.insert(1, d)
    # final barline
    for p in r.findall('part'):
        last = p.findall('measure')[-1]
        bl = ET.SubElement(last, 'barline', location='right'); ET.SubElement(bl, 'bar-style').text = 'light-heavy'
    ET.indent(t, space='  ')
    with open(out, 'wb') as fo:
        fo.write(head.encode()); t.write(fo, encoding='utf-8', xml_declaration=False)
cut(1, 88, 'app/duettino.musicxml', 'Le nozze di Figaro: No. 1 Duettino', ('Allegro', 138), True)
cut(89, 107, 'app/recit.musicxml', 'Le nozze di Figaro: Recitativo (Cosa stai misurando)', ('Recitativo', 100), True)
print('ok')
