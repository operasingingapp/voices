"""Composer faces (320x320) from the user's 700x700 circle frames in composers_1.fig: each frame's crop exactly as
placed (incl. mirrored layers), the cut-out over the portrait's backdrop colour with the paper grain.
Usage: python3 scripts/art/composer-faces.py <unzipped fig dir with x/images and nodes2.json> <out dir>
(nodes2.json from scripts/art/figma-nodes.cjs). Bizet has no circle frame: placed by hand at the end to match."""
import json, os, sys
from PIL import Image
FIG, OUT = sys.argv[1], sys.argv[2]
src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'composers.py')).read().split("os.makedirs(OUT")[0]
src = src.replace("full = {h[:12]: h for h in os.listdir(os.path.join(FIG, 'images'))}", "")
g = {}; exec(src, g)
n = json.load(open(f'{FIG}/nodes2.json'))
H = {f[:6]: f'{FIG}/x/images/' + f for f in os.listdir(f'{FIG}/x/images')}
ORIG = {'a88028':'handel','d97278':'mozart','f3ee18':'vivaldi','d61fef':'faure','8a6d98':'bach','6c02b4':'verdi','8227cb':'haydn','ace9ee':'beethoven','c81d49':'brahms','e03d60':'puccini','f5bcf4':'rossini','23f448':'wagner','0dd835':'rstrauss','ca6c0c':'tchaikovsky'}
CUTH = {v[:6]: k for k, v in g['CUT'].items()}
for f in [x for x in n if x['type'] == 'FRAME' and round(x['size']['x']) == 700]:
    r = [k for k in n if k['parent'] == f['id']][0]
    ps = [p['hash'][:6] for p in r['paints'] if p['type'] == 'IMAGE']
    key = next(ORIG[h] for h in ps if h in ORIG); ch = next(h for h in ps if h in CUTH)
    cut = Image.open(H[ch]).convert('RGBA')
    t = r['transform']; w, h = r['size']['x'], r['size']['y']
    fx, fy = t['m00'] < 0, t['m11'] < 0
    x = t['m02'] - w if fx else t['m02']; y = t['m12'] - h if fy else t['m12']
    s = 320 / 700; sc = max(w / cut.width, h / cut.height)
    tw, th = cut.width * sc * s, cut.height * sc * s; px = x * s + (w * s - tw) / 2; py = y * s + (h * s - th) / 2
    part = cut.resize((round(tw), round(th)), Image.LANCZOS)
    if fx: part = part.transpose(Image.FLIP_LEFT_RIGHT)
    if fy: part = part.transpose(Image.FLIP_TOP_BOTTOM)
    fig = Image.new('RGBA', (320, 320), (0, 0, 0, 0)); fig.paste(part, (round(px), round(py)), part)
    i = list(g['CUT']).index(key)
    g['comp'](fig, g['COLS'][key], (320, 320), i * 7 + 1).save(f'{OUT}/composer-{key}-face.webp', quality=82, method=6)

# Bizet has no circle frame in the file: placed by hand to match the others (in a 700 px frame: the figure 580 wide,
# 60 from the left, at the top), so his head sits at the same size as theirs.
bz = Image.open(H[g['CUT']['bizet'][:6]]).convert('RGBA')
x, y, w = 60, 0, 580; s = 320 / 700
part = bz.resize((round(w * s), round(w * bz.height / bz.width * s)), Image.LANCZOS)
fig = Image.new('RGBA', (320, 320), (0, 0, 0, 0)); fig.paste(part, (round(x * s), round(y * s)), part)
g['comp'](fig, g['COLS']['bizet'], (320, 320), list(g['CUT']).index('bizet') * 7 + 1).save(f'{OUT}/composer-bizet-face.webp', quality=82, method=6)
