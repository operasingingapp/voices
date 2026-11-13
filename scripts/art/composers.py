"""Build the composer portraits from the user's composers.fig (unzipped): each composer's cut-out over the colour of
the portrait's original backdrop, with the same paper grain as the character art, at the app's two sizes.

    python3 scripts/art/composers.py <unzipped composers.fig> <out dir>

writes composer-<id>-portrait.webp (720 x 964) and composer-<id>-face.webp (320 x 320). In that Figma file the frame
named "Johannes Brahms" holds Verdi and "Frame 9" holds Brahms: the images are picked by hash below, not by frame name.
"""
import numpy as np, os, json, sys
FIG, OUT = sys.argv[1], sys.argv[2]
from PIL import Image, ImageFilter
COLS = json.loads('{"handel": "#d30d0f", "mozart": "#921112", "vivaldi": "#790001", "faure": "#4a1b3e", "puccini": "#7f1012", "tchaikovsky": "#4d2d45", "bizet": "#615934", "rstrauss": "#112e2a", "wagner": "#595126", "rossini": "#565330", "brahms": "#660413", "beethoven": "#d10808", "haydn": "#056538", "verdi": "#033c26", "bach": "#9a0409"}')
CUT = {"handel":"38e4289f22ea","mozart":"ecf959a526d6","vivaldi":"27d33c8fb60d","faure":"ffdd2db6ba62","puccini":"d0d65df90166","tchaikovsky":"a218febde4e9","bizet":"24f075fbd806","rstrauss":"08d635be10fb","wagner":"b0c402cd1a7a","rossini":"c87a9944d0d0","brahms":"9e744d05b498","beethoven":"fd51184d3a32","haydn":"97549252bd2a","verdi":"ce265d70f0b1","bach":"317f7027ec20"}
full = {h[:12]: h for h in os.listdir(os.path.join(FIG, 'images'))}
def grain(size, seed, strength=7.0):
    rng = np.random.default_rng(seed); w, h = size
    def layer(blur, amount):
        n = rng.normal(0, 1, (h, w)).astype(np.float32)
        if blur:
            im = Image.fromarray(((n * 32) + 128).clip(0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(blur))
            n = np.asarray(im).astype(np.float32) - 128; n /= max(n.std(), 1e-3)
        return n * amount
    k = strength / 7.0
    return layer(0, 5.0 * k) + layer(0.6, 2.0 * k) + layer(8, 1.2 * k)
def comp(cut, bg, size, seed):
    a = np.asarray(cut).astype(np.float32) / 255; al = a[..., 3:4]
    rgb = np.array([int(bg[i:i+2], 16) for i in (1, 3, 5)], np.float32)
    back = np.broadcast_to(rgb, (size[1], size[0], 3)) + grain(size, seed)[..., None]
    return Image.fromarray((a[..., :3] * 255 * al + back * (1 - al)).clip(0, 255).astype(np.uint8))
os.makedirs(OUT, exist_ok=True)
for i, (n, h) in enumerate(CUT.items()):
    im = Image.open(os.path.join(FIG, 'images', full[h])).convert('RGBA'); W, H = im.size
    # portrait 720x964: cover-fit, centred, top-anchored
    sc = max(720 / W, 964 / H); p = im.resize((round(W * sc), round(H * sc)), Image.LANCZOS)
    x0 = (p.width - 720) // 2; p = p.crop((x0, 0, x0 + 720, 964))
    comp(p, COLS[n], (720, 964), i * 7).save(os.path.join(OUT, f'composer-{n}-portrait.webp'), quality=80, method=6)
    # face 320: head and shoulders square from the top of the figure
    bb = im.getbbox(); side = int(W * 0.78); cx = W // 2; top = max(0, bb[1] - int(W * 0.04))
    f = im.crop((cx - side // 2, top, cx + side // 2, top + side)).resize((320, 320), Image.LANCZOS)
    comp(f, COLS[n], (320, 320), i * 7 + 1).save(os.path.join(OUT, f'composer-{n}-face.webp'), quality=82, method=6)
print('ok')
