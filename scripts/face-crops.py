"""
Round face pictures (`-face.webp`) for every portrait, framed the same way:
- the whole head (hair included, as far as the chin) is centred left to right;
- the eyes sit a little above the middle (42% from the top), as in a portrait photograph;
- the head fills about two thirds of the circle.
Measurements are fractions of the original picture's width (x) and height (y), read off a grid.
Run: python3 scripts/face-crops.py --save   (writes into src/standalone/images)
"""
import sys
from PIL import Image, ImageDraw

A = '/mnt/user-data/attachments/3ebe1904-2cd5-5bf6-b252-ae0b967f4c22'
S = '/tmp/claude-0/-home-claude/3ebe1904-2cd5-5bf6-b252-ae0b967f4c22/scratchpad'
OUT = '/home/claude/counterpart/src/standalone/images'
EYES_AT = 0.48   # eye line, from the top of the circle
FILL_H = 0.56    # head height (hair top to chin) as a share of the circle
FILL_W = 0.80    # head width (back of the hair to the nose) may not exceed this

# name: (original, head left, head right, head top, chin, eye line, file)
HEADS = {
    'lauretta': ('e3d13b2c', 0.22, 0.72, 0.06, 0.28, 0.17, 'lauretta-face.webp'),
    'susanna':  ('31f53142', 0.26, 0.70, 0.07, 0.26, 0.185, 'figaro-susanna-face.webp'),
    'countess': ('fc986fff', 0.35, 0.72, 0.04, 0.26, 0.165, 'figaro-countess-face.webp'),
    'anna':     ('a4233f41', 0.22, 0.66, 0.02, 0.23, 0.125, 'giovanni-anna-face.webp'),
    'zerlina':  ('24b0edc1', 0.33, 0.75, 0.04, 0.25, 0.15, 'giovanni-zerlina-face.webp'),
    'elvira':   ('05afa2df', 0.32, 0.78, 0.02, 0.25, 0.13, 'giovanni-elvira-face.webp'),
    'schicchi': ('2eca766d', 0.27, 0.67, 0.05, 0.26, 0.155, 'schicchi-schicchi-face.webp'),
    'queen':    ('65353125', 0.39, 0.64, 0.10, 0.25, 0.20, 'zauberflote-queen-face.webp'),
    'pamina':   ('56875217', 0.36, 0.60, 0.08, 0.21, 0.125, 'zauberflote-pamina-face.webp'),
    'tamino':   ('33c1e0bf', 0.34, 0.67, 0.07, 0.22, 0.13, 'zauberflote-tamino-face.webp'),
    'papageno': ('d3d8fa2b', 0.39, 0.72, 0.09, 0.23, 0.14, 'zauberflote-papageno-face.webp'),
}


def frame(im, l, r, t, b, eye):
    W, H = im.size
    hw, hh = (r - l) * W, (b - t) * H
    side = round(max(hh / FILL_H, hw / FILL_W))
    cx = (l + r) / 2 * W
    top = eye * H - EYES_AT * side
    x0, y0 = round(cx - side / 2), round(top)
    # near an edge: extend the plain background rather than moving the head off centre
    if y0 < 0 or x0 < 0 or x0 + side > W or y0 + side > H:
        pt, pl = max(0, -y0), max(0, -x0)
        pr, pb = max(0, x0 + side - W), max(0, y0 + side - H)
        band = im.crop((0, 0, W, max(4, H // 60))).resize((1, 1), Image.BOX).getpixel((0, 0))
        big = Image.new('RGB', (W + pl + pr, H + pt + pb), band)
        big.paste(im, (pl, pt))
        im, x0, y0 = big, x0 + pl, y0 + pt
    return im.crop((x0, y0, x0 + side, y0 + side)).resize((320, 320), Image.LANCZOS)


if __name__ == '__main__':
    save = '--save' in sys.argv
    tiles = []
    for name, (f, l, r, t, b, eye, out) in HEADS.items():
        c = frame(Image.open(f'{A}/{f}-image.png').convert('RGB'), l, r, t, b, eye)
        if save:
            c.save(f'{OUT}/{out}', 'WEBP', quality=82, method=6)
        s = c.resize((160, 160), Image.LANCZOS)
        m = Image.new('L', (160, 160), 0)
        ImageDraw.Draw(m).ellipse((0, 0, 159, 159), fill=255)
        tile = Image.new('RGB', (160, 160), 'white')
        tile.paste(s, (0, 0), m)
        tiles.append(tile)
    sheet = Image.new('RGB', (170 * len(tiles), 160), 'white')
    for i, tile in enumerate(tiles):
        sheet.paste(tile, (i * 170, 0))
    sheet.save(f'{S}/faces-check.png')
