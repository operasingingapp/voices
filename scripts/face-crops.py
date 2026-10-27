"""
Round face pictures (`-face.webp`) cut from each portrait (`-portrait.webp`), all framed by one rule:
- the head (hair to chin; not a bun, crown spikes, feathers or a long beard) is centred left to right;
- the head's middle sits a little above the circle's middle (47%), as in a portrait photograph;
- the head fills about 54% of the circle's height, so a ring or a crop at the edge never cuts into it.
Measurements are fractions of the portrait's width (x) and height (y), read off a grid.
Run: python3 scripts/face-crops.py --save   (writes into src/standalone/images; without --save, a preview sheet)
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw

IMG = Path(__file__).resolve().parent.parent / 'src/standalone/images'
FILL_H = 0.54   # head height as a share of the circle
FILL_W = 0.66   # head width may not exceed this share
MID_AT = 0.47   # where the head's middle sits, from the top of the circle (a little high, as in a portrait)

# portrait file stem: (head left, head right, head top, chin)
HEADS = {
    'figaro-countess': (0.35, 0.68, 0.055, 0.24),
    'figaro-susanna': (0.30, 0.70, 0.065, 0.305),
    'giovanni-anna': (0.38, 0.66, 0.03, 0.25),
    'giovanni-elvira': (0.35, 0.68, 0.033, 0.25),
    'giovanni-zerlina': (0.33, 0.70, 0.03, 0.27),
    'lauretta': (0.33, 0.72, 0.05, 0.30),
    'schicchi-schicchi': (0.27, 0.72, 0.11, 0.35),
    'zauberflote-pamina': (0.27, 0.62, 0.07, 0.32),
    'zauberflote-papageno': (0.29, 0.66, 0.13, 0.385),
    'zauberflote-queen': (0.35, 0.66, 0.19, 0.41),
    'zauberflote-tamino': (0.30, 0.72, 0.06, 0.33),
}


def frame(im, l, r, t, b):
    W, H = im.size
    hw, hh = (r - l) * W, (b - t) * H
    side = round(max(hh / FILL_H, hw / FILL_W))
    cx = (l + r) / 2 * W
    cy = (t + b) / 2 * H
    x0, y0 = round(cx - side / 2), round(cy - MID_AT * side)
    # near an edge: extend the plain background (sampled along that edge) rather than moving the head off centre
    if y0 < 0 or x0 < 0 or x0 + side > W or y0 + side > H:
        pt, pl = max(0, -y0), max(0, -x0)
        pr, pb = max(0, x0 + side - W), max(0, y0 + side - H)
        top_band = im.crop((0, 0, W, max(4, H // 80))).resize((1, 1), Image.BOX).getpixel((0, 0))
        big = Image.new('RGB', (W + pl + pr, H + pt + pb), top_band)
        big.paste(im, (pl, pt))
        # carry the picture's own edges outwards so the extension has no seam
        if pt:
            strip = im.crop((0, 0, W, 2)).resize((W, pt))
            big.paste(strip, (pl, 0))
        if pl:
            big.paste(im.crop((0, 0, 2, H)).resize((pl, H)), (0, pt))
        if pr:
            big.paste(im.crop((W - 2, 0, W, H)).resize((pr, H)), (pl + W, pt))
        im, x0, y0 = big, x0 + pl, y0 + pt
    return im.crop((x0, y0, x0 + side, y0 + side)).resize((320, 320), Image.LANCZOS)


if __name__ == '__main__':
    save = '--save' in sys.argv
    T = 180
    sheet = Image.new('RGB', (len(HEADS) * (T + 10) + 10, T + 20), 'white')
    mask = Image.new('L', (T, T), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, T - 1, T - 1), fill=255)
    for i, (stem, box) in enumerate(HEADS.items()):
        c = frame(Image.open(IMG / f'{stem}-portrait.webp').convert('RGB'), *box)
        if save:
            c.save(IMG / f'{stem}-face.webp', 'WEBP', quality=84, method=6)
        sheet.paste(c.resize((T, T), Image.LANCZOS), (10 + i * (T + 10), 10), mask)
    out = sys.argv[sys.argv.index('--sheet') + 1] if '--sheet' in sys.argv else '/tmp/faces.png'
    sheet.save(out)
    print('sheet:', out)
