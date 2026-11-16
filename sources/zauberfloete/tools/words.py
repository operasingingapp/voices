"""words.py SID: the score's sung words per part and verse (lyric number), with the bar of each word."""
import sys, glob, xml.etree.ElementTree as ET
def score_words(xmlf):
    r = ET.parse(xmlf).getroot(); pname = {sp.get('id'): sp.findtext('part-name') for sp in r.iter('score-part')}
    out = {}
    for part in r.findall('part'):
        nm = pname[part.get('id')]
        if nm == 'Piano': continue
        cur = {}; words = {}
        for m in part.findall('measure'):
            for n in m.findall('note'):
                for ly in n.findall('lyric'):
                    v = ly.get('number') or '1'; syl = ly.findtext('syllabic'); texts = [t.text or '' for t in ly.findall('text')]
                    for k, t in enumerate(texts):
                        if k == 0 and syl in ('middle', 'end') and cur.get(v): cur[v][1] += t
                        else:
                            if cur.get(v): words.setdefault(v, []).append(cur[v])
                            cur[v] = [m.get('number'), t]
        for v, c in cur.items():
            if c: words.setdefault(v, []).append(c)
        out[nm] = words
    return out
if __name__ == '__main__':
    sid = sys.argv[1]; f = glob.glob(f'/home/claude/work/zf_in/b1/{sid}_*/*.musicxml')[0]
    for nm, ws in score_words(f).items():
        for v, w in sorted(ws.items()): print(f'{nm} v{v}:', ' '.join(t for b, t in w))
