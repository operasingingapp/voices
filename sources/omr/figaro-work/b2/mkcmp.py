"""Comparison images: printed bars (above) vs the file rendered (below), ~3 bars each.
usage: python3 mkcmp.py FILE.xml OUTDIR FIRST LAST"""
import json, io, sys, verovio, cairosvg
from PIL import Image, ImageDraw
M = json.load(open('barmap.json'))
X, OUT, F, L = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
tk = verovio.toolkit(); tk.loadData(open(X).read())
import re as _re
FIRSTBAR = int(_re.search(r'<measure[^>]*number="(\d+)"', open(X).read()).group(1))
for o in M:
    segs = [s for s in o['bars'] if F <= s[0] <= L]
    if not segs: continue
    im = Image.open(f"pg-{o['page']:02d}.pgm")
    top = o['staves'][0][0] - 200; bot = o['staves'][-1][1] + 130
    n = len(segs); k = (n + 2) // 3; size = -(-n // k)
    for g in range(k):
        grp = segs[g * size:(g + 1) * size]
        if not grp: continue
        x0b, x1b = grp[0][0], grp[-1][0]
        sc = im.crop((max(0, grp[0][1] - 25), max(0, top), min(im.width, grp[-1][2] + 25), min(im.height, bot)))
        sc = sc.resize((1500, int(sc.height * 1500 / sc.width)))
        tk.setOptions({"pageWidth": max(1200, (x1b - x0b + 1) * 650), "pageHeight": 6000, "scale": 50, "adjustPageHeight": True,
                       "breaks": "none", "header": "none", "footer": "none", "lyricSize": 5.0})
        tk.select({"measureRange": f"{x0b - FIRSTBAR + 1}-{x1b - FIRSTBAR + 1}"}); tk.redoLayout()
        rr = Image.open(io.BytesIO(cairosvg.svg2png(bytestring=tk.renderToSVG(1).encode(), background_color='white'))).convert('L')
        rr = rr.resize((1500, int(rr.height * 1500 / rr.width)))
        img = Image.new('L', (1500, sc.height + rr.height + 50), 255); img.paste(sc, (0, 0))
        img.paste(Image.new('L', (1500, 4), 0), (0, sc.height + 5))
        ImageDraw.Draw(img).text((10, sc.height + 14), f"bars {x0b}-{x1b} (printed page {o['page'] + 15}, system {o['sys']})", fill=0)
        img.paste(rr, (0, sc.height + 50))
        img.save(f"{OUT}/c_bars{x0b:03d}-{x1b:03d}.png")
