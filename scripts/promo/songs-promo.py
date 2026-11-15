"""Sottovoce promo: composers' faces fall in circles, collide and fill the screen, then burst apart to reveal the text.

    python3 promo.py <W> <H> <out.mp4> [--frames 30,90,...]   (frames: write PNG stills only)
"""
import sys, os, math, random, subprocess
import pymunk
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H, OUT = int(sys.argv[1]), int(sys.argv[2]), sys.argv[3]
STILLS = [int(x) for x in sys.argv[5].split(',')] if len(sys.argv) > 5 and sys.argv[4] == '--frames' else None
FPS = 30
T_FILL, T_BURST, T_END = 4.6, 5.0, 16.0
N = int(T_END * FPS)
PORT = W < H
S = min(W, H) / 1080  # scale

FONTS = '/tmp/claude-0/-home-claude/3ebe1904-2cd5-5bf6-b252-ae0b967f4c22/scratchpad/fonts/node_modules/@fontsource'
def font(fam, w, st, px):
    return ImageFont.truetype(f'{FONTS}/{fam}/files/{fam}-latin-{w}-{st}.woff', int(px))
PAPER, INK, MUTED, GO = (251, 250, 247), (26, 24, 20), (119, 114, 106), (23, 64, 44)

IMG = '/home/claude/voices/src/standalone/images'
ids = sorted(f[9:-10] for f in os.listdir(IMG) if f.startswith('composer-') and f.endswith('-face.webp'))
random.seed(7)
random.shuffle(ids)
faces = {i: Image.open(f'{IMG}/composer-{i}-face.webp').convert('RGB') for i in ids}

# ---- physics: drop circles until the screen is full ----
space = pymunk.Space(); space.gravity = (0, 2600 * S)
walls = [pymunk.Segment(space.static_body, a, b, 4) for a, b in [((0, H), (W, H)), ((0, -4000), (0, H)), ((W, -4000), (W, H))]]
for w in walls: w.elasticity, w.friction = 0.3, 0.6
space.add(*walls)
area = 0; bodies = []
rnd = random.Random(3)
plan = []  # (drop time, radius, x, id)
k = 0; t = 0.0
target = W * H * 1.3
while area < target:
    r = rnd.uniform(70, 150) * S * (1.15 if not PORT else 1)
    plan.append((t, r, rnd.uniform(r, W - r), ids[k % len(ids)])); k += 1
    area += math.pi * r * r
    t += 3.6 / (target / (math.pi * (110 * S) ** 2))
sizes = {}
def face(i, r):
    key = (i, int(r))
    if key not in sizes:
        d = int(2 * r)
        im = faces[i].resize((d, d), Image.LANCZOS)
        m = Image.new('L', (d * 4, d * 4), 0); ImageDraw.Draw(m).ellipse((0, 0, d * 4 - 1, d * 4 - 1), fill=255)
        im.putalpha(m.resize((d, d), Image.LANCZOS))
        sizes[key] = im
    return sizes[key]

# ---- text ----
def ease(x): x = max(0, min(1, x)); return 1 - (1 - x) ** 3
if PORT:
    H1, H2 = font('cormorant-garamond', 500, 'normal', 150 * S), font('cormorant-garamond', 500, 'italic', 150 * S)
    FEAT, LOGO, SMALL = font('jost', 400, 'normal', 50 * S), font('cormorant-garamond', 500, 'italic', 150 * S), font('jost', 400, 'normal', 38 * S)
else:
    H1, H2 = font('cormorant-garamond', 500, 'normal', 130 * S), font('cormorant-garamond', 500, 'italic', 130 * S)
    FEAT, LOGO, SMALL = font('jost', 400, 'normal', 40 * S), font('cormorant-garamond', 500, 'italic', 140 * S), font('jost', 400, 'normal', 32 * S)
HEAD = [('Hundreds of', H1), ('art songs', H1), ('and Lieder.', H2)] if PORT else [('Hundreds of art songs', H1), ('and Lieder.', H2)]
FEATS = ['The words, translated line by line', 'IPA for every word', 'Every word spoken, said right',
         'A piano that slows down and loops', 'Score and texts to download as PDF']
T_FEAT0, T_FEATD = 6.2, 0.55
T_LOGO = 12.4

def ctext(d, y, s, f, fill, alpha=1, dy=0):
    w = d.textlength(s, font=f)
    c = tuple(int(PAPER[j] + (fill[j] - PAPER[j]) * alpha) for j in range(3))
    d.text(((W - w) / 2, y + dy), s, font=f, fill=c)

def draw_text(im, t):
    d = ImageDraw.Draw(im)
    out = ease((t - T_LOGO) / 0.6)  # the headline and list leave for the logo
    lh = H1.size * 0.98
    head_h = lh * len(HEAD)
    feat_gap = FEAT.size * 1.9
    block = head_h + 70 * S + feat_gap * len(FEATS)
    y0 = (H - block) / 2 - H1.size * 0.15
    if out < 1:
        for n, (s, f) in enumerate(HEAD):
            ctext(d, y0 + n * lh, s, f, INK, 1 - out, -40 * S * out)
        y = y0 + head_h + 70 * S
        lw = max(d.textlength(x, font=FEAT) for x in FEATS) + 50 * S
        x = (W - lw) / 2 + 50 * S
        for n, s in enumerate(FEATS):
            p = ease((t - T_FEAT0 - n * T_FEATD) / 0.5)
            a = p * (1 - out)
            if a <= 0: continue
            cy = y + n * feat_gap + FEAT.size * 0.62
            rr = 9 * S
            gc = tuple(int(PAPER[j] + (GO[j] - PAPER[j]) * a) for j in range(3))
            d.ellipse((x - 40 * S - rr, cy - rr, x - 40 * S + rr, cy + rr), fill=gc)
            c = tuple(int(PAPER[j] + (INK[j] - PAPER[j]) * a) for j in range(3))
            d.text((x + 30 * S * (1 - p), y + n * feat_gap), s, font=FEAT, fill=c)
    a = ease((t - T_LOGO - 0.4) / 0.8)
    if a > 0:
        ctext(d, H / 2 - LOGO.size * 0.8, 'Sottovoce', LOGO, INK, a, 30 * S * (1 - a))
        ctext(d, H / 2 + LOGO.size * 0.45, 'Opera · Songs · Choral', SMALL, MUTED, a, 30 * S * (1 - a))

# ---- run ----
ff = None
if not STILLS:
    ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                           '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', OUT + '.tmp.mp4'], stdin=subprocess.PIPE)
pi = 0; burst = False
final_ring = None
for fr in range(N):
    t = fr / FPS
    while pi < len(plan) and plan[pi][0] <= t:
        _, r, x, i = plan[pi]; pi += 1
        b = pymunk.Body(1, pymunk.moment_for_circle(1, 0, r)); b.position = (x, -r - rnd.uniform(0, 300 * S))
        b.angular_velocity = rnd.uniform(-1, 1)
        c = pymunk.Circle(b, r); c.elasticity, c.friction = 0.35, 0.5
        space.add(b, c); bodies.append((b, r, i))
    if not burst and t >= T_BURST:
        burst = True
        space.remove(*walls); space.gravity = (0, 0)
        for b, r, i in bodies:
            v = b.position - (W / 2, H / 2)
            dist = max(1, v.length)
            b.velocity = v / dist * (1500 * S + rnd.uniform(0, 700 * S) + dist * 0.8) + (rnd.uniform(-200, 200) * S, rnd.uniform(-200, 200) * S)
            b.angular_velocity = rnd.uniform(-3, 3)
    for _ in range(4): space.step(1 / FPS / 4)
    im = Image.new('RGB', (W, H), PAPER)
    if t >= T_BURST - 0.2: draw_text(im, t)
    for b, r, i in bodies:
        x, y = b.position
        if x < -r or x > W + r or y < -r or y > H + r: continue
        f = face(i, r)
        rot = f.rotate(-math.degrees(b.angle) * 0.15, resample=Image.BICUBIC)  # a gentle tilt, faces stay upright
        im.paste(rot, (int(x - r), int(y - r)), rot)
    # flash-free cut to the logo's quiet faces: a row of faces under the logo
    if t >= T_LOGO + 0.6:
        row = ['schubert', 'schumann', 'faure', 'debussy', 'tosti', 'brahms', 'mozart'] if PORT else ['schubert', 'schumann', 'brahms', 'faure', 'debussy', 'tosti', 'mahler', 'puccini', 'mozart']
        rr = 70 * S; gap = rr * 2 - 18 * S
        x0 = W / 2 - gap * (len(row) - 1) / 2
        for n, i in enumerate(row):
            a = ease((t - T_LOGO - 0.6 - n * 0.08) / 0.5)
            if a <= 0: continue
            f = face(i, rr)
            yy = H / 2 - LOGO.size * 0.75 - rr - 30 * S + 30 * S * (1 - a)
            ring = Image.new('RGBA', (int(2 * rr + 8 * S),) * 2, (0, 0, 0, 0))
            ImageDraw.Draw(ring).ellipse((0, 0, ring.width - 1, ring.height - 1), fill=PAPER + (255,))
            ring.paste(f, (int(4 * S), int(4 * S)), f)
            if a < 1: ring.putalpha(ring.getchannel('A').point(lambda v: int(v * a)))
            im.paste(ring, (int(x0 + n * gap - ring.width / 2), int(yy - ring.height / 2)), ring)
    if STILLS:
        if fr in STILLS: im.save(f'{OUT}-{fr}.png')
        if fr >= max(STILLS): break
    else:
        ff.stdin.write(im.tobytes())
if ff:
    ff.stdin.close(); assert ff.wait() == 0; os.replace(OUT + '.tmp.mp4', OUT)
