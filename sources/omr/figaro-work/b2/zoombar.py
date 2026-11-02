"""zoombar.py BAR [BAR..] OUT.png : piano staves of printed bars, zoomed"""
import json, sys
from PIL import Image
M = json.load(open('barmap.json')); bars = [int(x) for x in sys.argv[1:-1]]; ims = []
for o in M:
    for s in o['bars']:
        if s[0] in bars:
            im = Image.open(f"pg-{o['page']:02d}.pgm"); st = o['staves']
            c = im.crop((max(0, s[1] - 40), st[-2][0] - 110, min(im.width, s[2] + 40), st[-1][1] + 110))
            ims.append(c.resize((c.width * 2, c.height * 2)))
W = sum(i.width for i in ims) + 20 * len(ims); H = max(i.height for i in ims)
out = Image.new('L', (W, H), 255); x = 0
for i in ims: out.paste(i, (x, 0)); x += i.width + 20
out.save(sys.argv[-1])
