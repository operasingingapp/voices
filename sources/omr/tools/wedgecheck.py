"""wedgecheck.py FILE.xml : every hairpin closes, and no hairpin starts while another with the same number is still open
on the same staff (events taken in time order within each bar; an end and a start at the same moment: the end first)"""
import sys, xml.etree.ElementTree as ET
r = ET.parse(sys.argv[1]).getroot(); bad = 0
for p in r.findall('part'):
    open_ = {}
    for m in p.findall('measure'):
        pos = 0; ev = []
        for i, e in enumerate(m):
            if e.tag == 'note':
                if e.find('chord') is None: last = pos; pos += int(e.findtext('duration') or 0)
            elif e.tag == 'backup': pos -= int(e.findtext('duration'))
            elif e.tag == 'forward': pos += int(e.findtext('duration'))
            elif e.tag == 'direction':
                w = e.find('.//wedge')
                if w is None: continue
                off = int(e.findtext('offset') or 0)
                ev.append((pos + off, 0 if w.get('type') == 'stop' else 1, i, (e.findtext('staff') or '1', w.get('number') or '1'), w.get('type')))
        for t, _, _, k, typ in sorted(ev):
            b = m.get('number')
            if typ == 'stop':
                if k not in open_: bad += 1; print(f"bar {b} staff {k[0]}: hairpin end with nothing open")
                open_.pop(k, None)
            elif typ in ('crescendo', 'diminuendo'):
                if k in open_: bad += 1; print(f"bar {b} staff {k[0]}: {typ} starts while the hairpin from bar {open_[k]} is still open")
                open_[k] = b
    for k, b in open_.items(): bad += 1; print(f"staff {k[0]}: hairpin from bar {b} never ends")
print("wedge problems:", bad); sys.exit(1 if bad else 0)
