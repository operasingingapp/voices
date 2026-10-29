"""Build the app's character and opera art from the user's Figma file: each frame's crop exactly as placed in
Figma, the cut-out over a chosen backdrop with a paper grain, saved at the app's sizes. Also writes the
tones (card colours) that go with each backdrop."""
import json, glob, os, sys, colorsys
import numpy as np
from PIL import Image, ImageFilter
FIG, TOOLS, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
H = {os.path.basename(f)[:6]: f for f in glob.glob(f'{FIG}/x/images/*')}
nodes = json.load(open(f'{FIG}/nodes2.json'))
chars = json.load(open(f'{TOOLS}/chars.json'))
pal = json.load(open(f'{TOOLS}/palette.json'))
kids = {}
for x in nodes: kids.setdefault(x['parent'], []).append(x)
frames = [x for x in nodes if x['type'] == 'FRAME' and x['parent'] == '0:1']
# flat-colour images and the cut-out with the same picture (checked pixel for pixel)
CUTOUT = {'fe348f': 'd201fa', '3b62b0': '2351a6', '8592af': 'ee0895', '130313': 'ff8c08', 'afda86': '4f735b', 'e8c371': 'd637af'}
SIZES = {'portrait': (720, 964), 'face': (320, 320), 'cover': (1600, 893), 'square': (480, 480)}
_cache = {}
def img(h):
    if h not in _cache: _cache[h] = Image.open(H[h]).convert('RGBA')
    return _cache[h]

def kind(fr):
    return {(1792, 2400): 'portrait', (1500, 1500): 'face', (2901, 1619): 'cover', (1600, 1600): 'square'}.get((round(fr['size']['x']), round(fr['size']['y'])))

def layers(fr):
    """the visible image layers of a frame: (hash, x, y, w, h) in frame px"""
    out = []
    for r in kids.get(fr['id'], []):
        if r.get('visible') is False: continue
        for p in r['paints']:
            if p['type'] == 'IMAGE' and p.get('visible') is not False:
                t = r['transform']
                fx, fy = t['m00'] < 0, t['m11'] < 0
                # a mirrored layer: its position is the far edge
                x = t['m02'] - r['size']['x'] if fx else t['m02']
                y = t['m12'] - r['size']['y'] if fy else t['m12']
                out.append((p['hash'][:6], x, y, r['size']['x'], r['size']['y'], fx, fy))
    return out

def grain(size, seed, strength=7.0):
    """paper grain, as in the Figma backdrops: a fine speckle over a medium grain and a soft mottling,
    so a flat colour reads as printed paper. strength is the speckle's size in 0-255 levels at the output size."""
    rng = np.random.default_rng(seed)
    w, h = size
    def layer(blur, amount):
        n = rng.normal(0, 1, (h, w)).astype(np.float32)
        if blur:
            im = Image.fromarray(((n * 32) + 128).clip(0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(blur))
            n = np.asarray(im).astype(np.float32) - 128
            n /= max(n.std(), 1e-3)
        return n * amount
    k = strength / 7.0
    # fine: a speckle at pixel size, a little grain just above it, and only a hint of mottling
    return layer(0, 5.0 * k) + layer(0.6, 2.0 * k) + layer(8, 1.2 * k)

def render(fr, bg, out_size, seed, replace=None, keep_scene=False):
    W, Hh = round(fr['size']['x']), round(fr['size']['y'])
    s = out_size[0] / W
    ow, oh = out_size
    figure = Image.new('RGBA', (ow, oh), (0, 0, 0, 0))
    for h, x, y, w, hh, fx, fy in layers(fr):
        h = (replace or {}).get(h, CUTOUT.get(h, h))
        im = img(h)
        # FILL: scale to cover the rectangle, centred
        sc = max(w / im.width, hh / im.height)
        tw, th = im.width * sc * s, im.height * sc * s
        px = x * s + (w * s - tw) / 2
        py = y * s + (hh * s - th) / 2
        part = im.resize((max(1, round(tw)), max(1, round(th))), Image.LANCZOS)
        if fx: part = part.transpose(Image.FLIP_LEFT_RIGHT)
        if fy: part = part.transpose(Image.FLIP_TOP_BOTTOM)
        figure.alpha_composite(part, (round(px), round(py))) if px >= 0 and py >= 0 else figure.paste(part, (round(px), round(py)), part)
    a = np.asarray(figure).astype(np.float32) / 255
    alpha = a[..., 3:4]
    if keep_scene:
        base = a[..., :3] * 255
        g = grain((ow, oh), seed, 5.0)[..., None]
        return Image.fromarray((base + g).clip(0, 255).astype(np.uint8))
    rgb = np.array([int(bg[i:i + 2], 16) for i in (1, 3, 5)], np.float32)
    back = np.broadcast_to(rgb, (oh, ow, 3)) + grain((ow, oh), seed)[..., None]
    outp = a[..., :3] * 255 * alpha + back * (1 - alpha)
    return Image.fromarray(outp.clip(0, 255).astype(np.uint8))

def tones(bg):
    """the card colours that go with a backdrop: pale tints of the backdrop's own hue, so a card and its picture
    read as one (a lavender picture on a pale lavender card); quiet enough for the ink on them"""
    r, g, b = (int(bg[i:i + 2], 16) / 255 for i in (1, 3, 5))
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    hexc = lambda hh, ll, ss: '#%02x%02x%02x' % tuple(round(v * 255) for v in colorsys.hls_to_rgb(hh, ll, ss))
    sat = min(max(s, 0.18), 0.32)
    return {'soft': hexc(h, 0.955, sat), 'strong': hexc(h, 0.90, sat), 'deep': hexc(h, 0.74, sat * 1.1), 'back': bg}

os.makedirs(OUT, exist_ok=True)
manifest = {}
for i, (key, c) in enumerate(chars.items()):
    opera, ch = key.split(':')
    bg = pal[key]
    for k in ('portrait', 'face'):
        fr = next(f for f in frames if kind(f) == k and c[k] in [CUTOUT.get(l[0], l[0]) for l in layers(f)])
        im = render(fr, bg, SIZES[k], seed=i * 7 + (k == 'face'))
        # mirrored where the picture should face the other way
        if c.get('flip'): im = im.transpose(Image.FLIP_LEFT_RIGHT)
        im.save(f'{OUT}/{opera}-{ch}-{k}.webp', quality=88, method=6)
    manifest[key] = tones(bg)
OPF = {'figaro': 'Le nozze di Figaro', 'giovanni': 'Don Giovanni', 'cosi': 'Cosi fan tutte', 'zauberfloete': 'Magic Flute', 'barbiere': 'Barbiere di Sevigla',
       'traviata': 'La traviata', 'carmen': 'Carmen', 'butterfly': 'Madama Butterfly', 'schicchi': 'Gianni Schicchi'}
for j, (op, name) in enumerate(OPF.items()):
    bg = pal['op:' + op]
    for k in ('cover', 'square'):
        fr = next(f for f in frames if f['name'] == name and kind(f) == k)
        scene = bg is None
        if op == 'carmen' and k == 'square':
            # no cut-out of the square picture: the cover's cut-out, as a square, on the same backdrop
            cov = next(f for f in frames if f['name'] == name and kind(f) == 'cover')
            big = render(cov, bg, (2901, 1619), seed=900)
            x0 = (2901 - 1619) // 2
            im = big.crop((x0, 0, x0 + 1619, 1619)).resize(SIZES[k], Image.LANCZOS)
        else:
            im = render(fr, bg, SIZES[k], seed=500 + j * 3 + (k == 'square'), keep_scene=scene)
        im.save(f'{OUT}/{op}-{k}.webp', quality=84 if k == 'cover' else 88, method=6)
    if bg: manifest['op:' + op] = tones(bg)
json.dump(manifest, open(f'{OUT}/tones.json', 'w'), indent=1)
print('done', len(manifest))
