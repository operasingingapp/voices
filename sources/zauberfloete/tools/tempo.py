"""tempo.py: playback tempos from recording lengths. The delivered relative section tempos are kept and scaled together so
the piece, with its repeats, lasts the median recording length less 2 seconds."""
import glob, xml.etree.ElementTree as ET, statistics
REC = {'S05': [155, 160], 'S07': [276, 251], 'S09': [323, 308], 'S25': [176, 196], 'S32': [79, 83], 'S36': [244, 289],
       'S40': [271, 248], 'S46': [235, 259]}
def plan(xmlf):
    r = ET.parse(xmlf).getroot(); p = r.find('part'); div = None; bars = []; tempos = {}
    for m in p.findall('measure'):
        d = m.find('attributes/divisions'); div = int(d.text) if d is not None else div
        pos = mx = 0
        for e in m:
            if e.tag == 'note' and e.find('chord') is None and e.find('grace') is None: pos += int(e.findtext('duration') or 0); mx = max(mx, pos)
            elif e.tag == 'backup': pos -= int(e.findtext('duration'))
            elif e.tag == 'forward': pos += int(e.findtext('duration')); mx = max(mx, pos)
        for s in m.iter('sound'):
            if s.get('tempo'): tempos[m.get('number')] = float(s.get('tempo'))
        fw = any(rp.get('direction') == 'forward' for rp in m.iter('repeat'))
        bw = [int(rp.get('times') or 2) for rp in m.iter('repeat') if rp.get('direction') == 'backward']
        bars.append((m.get('number'), mx / div, fw, bw[0] if bw else 0))
    # expand repeats
    seq, start, i = [], 0, 0
    while i < len(bars):
        n, q, fw, bw = bars[i]
        if fw: start = i
        seq.append(i)
        if bw:
            seq += [j for _ in range(bw - 1) for j in range(start, i + 1)]
        i += 1
    return bars, seq, tempos
if __name__ == '__main__':
    for sid, recs in REC.items():
        xmlf = glob.glob(f'/home/claude/work/zf_in/b1/{sid}_*/*.musicxml')[0]
        bars, seq, tempos = plan(xmlf)
        cur = None; secs = 0
        tlist = []
        for i in seq:
            n, q, _, _ = bars[i]
            if n in tempos: cur = tempos[n]
            secs += q * 60 / cur
        target = statistics.median(recs) - 2
        f = secs / target
        print(sid, 'bars played', len(seq), 'est secs', round(secs), 'target', target, 'factor', round(f, 2), {k: round(v * f) for k, v in tempos.items()})
