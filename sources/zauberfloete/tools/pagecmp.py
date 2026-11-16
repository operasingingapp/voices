"""pagecmp.py: each printed page of the Zauberflöte batch beside the delivered MusicXML's bars on that page (Verovio), in
halves when a page has more than three systems. Writes cmp/<sid>_p<page>_<h>.png"""
import re, glob, io, sys, verovio, cairosvg, numpy as np
import xml.etree.ElementTree as ET
from PIL import Image
IN = '/home/claude/work/zf_in/b1'; OUT = '/home/claude/work/zf_in/cmp'
sids = sys.argv[1:] or ['S05', 'S07', 'S09', 'S25', 'S32', 'S36', 'S40', 'S46']
for sid in sids:
    pm = glob.glob(f'{IN}/{sid}_*/PM_*.txt')[0]; xmlf = glob.glob(f'{IN}/{sid}_*/*.musicxml')[0]
    st = []
    for l in open(pm):
        m = re.search(r'page 0*(\d+) system (\d+) starts (?:inside )?bar (\d+)', l)
        if m and (not st or (int(m[1]), int(m[3])) != st[-1]): st.append((int(m[1]), int(m[3])))
    xml = open(xmlf).read()
    last = max(int(m.get('number')) for m in ET.parse(xmlf).getroot().find('part').findall('measure'))
    tk = verovio.toolkit(); tk.loadData(xml)
    bypage = {}
    for i, (pg, b) in enumerate(st):
        e = st[i + 1][1] - (0 if i + 1 < len(st) and st[i + 1][1] == b else 1) if i + 1 < len(st) else last
        bypage.setdefault(pg, []).append((b, max(b, e)))
    for pg, sysl in bypage.items():
        P0 = Image.open(f'/home/claude/ext/zauber/pages/p-{pg:03d}.png').convert('L')
        n = len(sysl); halves = [sysl[:(n + 1) // 2], sysl[(n + 1) // 2:]] if n > 3 else [sysl]
        A = np.array(P0) < 128; rows = np.where(A.sum(1) > A.shape[1] * 0.45)[0]
        top, bot = max(0, rows.min() - 120), min(P0.height, rows.max() + 160)
        for h, part in enumerate(halves):
            b, e = part[0][0], part[-1][1]
            tk.setOptions({"pageWidth": 2200, "pageHeight": 60000, "scale": 55, "adjustPageHeight": True, "breaks": "auto",
                           "header": "none", "footer": "none", "lyricSize": 4.5})
            tk.select({"measureRange": f"{b}-{e}"}); tk.redoLayout()
            rs = [Image.open(io.BytesIO(cairosvg.svg2png(bytestring=tk.renderToSVG(k).encode(), background_color='white'))).convert('L')
                  for k in range(1, tk.getPageCount() + 1)]
            R = Image.new('L', (max(r.width for r in rs), sum(r.height for r in rs)), 255); y = 0
            for r in rs: R.paste(r, (0, y)); y += r.height
            if len(halves) == 2:
                cut = top + (bot - top) * len(halves[0]) / n
                P = P0.crop((40, int(top if h == 0 else cut - 60), P0.width - 40, int(cut + 140 if h == 0 else bot)))
            else: P = P0.crop((40, int(top), P0.width - 40, int(bot)))
            P = P.resize((1500, int(P.height * 1500 / P.width)))
            R = R.resize((1500, int(R.height * 1500 / R.width)))
            C = Image.new('L', (3030, max(P.height, R.height)), 255); C.paste(P, (0, 0)); C.paste(R, (1530, 0))
            C.save(f'{OUT}/{sid}_p{pg}_{h}.png'); print(sid, pg, h, b, e, C.size)
