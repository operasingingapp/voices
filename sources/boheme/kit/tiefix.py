"""tiefix.py FILE : for every note with <tie type="start"> whose pitch has no tie stop in the same part/staff/voice at the
next onset, add <tie type="stop"/> and <notations><tied type="stop"/> to the matching note there (same voice first, else
same staff). Fixes chords where the same pitch is tied in two voices."""
import sys, xml.etree.ElementTree as ET
f = sys.argv[1]; head = open(f).read().split('<score-partwise', 1)[0]
t = ET.parse(f); r = t.getroot(); fixed = 0
def key(n): return (n.findtext('pitch/step'), n.findtext('pitch/alter') or '0', n.findtext('pitch/octave'))
for P in r.findall('part'):
    ev = []  # (abs onset, measure idx, note)
    base = 0
    for m in P.findall('measure'):
        pos = 0; last = 0; mlen = 0
        for e in m:
            if e.tag == 'backup': pos -= int(e.findtext('duration'))
            elif e.tag == 'forward': pos += int(e.findtext('duration'))
            elif e.tag == 'note':
                d = int(e.findtext('duration') or 0); ch = e.find('chord') is not None
                on = last if ch else pos
                if e.find('grace') is None and e.find('rest') is None: ev.append((base + on, d, e))
                if not ch: last = pos; pos += d
            mlen = max(mlen, pos)
        base += mlen
    for on, d, n in ev:
        if not any(x.get('type') == 'start' for x in n.findall('tie')): continue
        cands = [x for o, dd, x in ev if o == on + d and key(x) == key(n) and x.findtext('staff') == n.findtext('staff')]
        if not cands or any(any(y.get('type') == 'stop' for y in x.findall('tie')) and x.findtext('voice') == n.findtext('voice') for x in cands): continue
        same = [x for x in cands if x.findtext('voice') == n.findtext('voice')]
        tgt = (same or cands)[0]
        if any(y.get('type') == 'stop' for y in tgt.findall('tie')): continue
        i = [j for j, c in enumerate(list(tgt)) if c.tag in ('duration',)][0] + 1
        el = ET.Element('tie', type='stop'); tgt.insert(i, el)
        no = tgt.find('notations')
        if no is None: no = ET.SubElement(tgt, 'notations')
        ET.SubElement(no, 'tied', type='stop'); fixed += 1
open(f, 'w').write(head + ET.tostring(r, encoding='unicode'))
print('tiefix: added', fixed, 'tie stops')
