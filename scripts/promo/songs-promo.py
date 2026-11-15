"""Sottovoce promo, seen from above: composers' faces, all one size, slide in from every side like coins pushed across
a table, pack edge to edge until the screen is full, then scatter outwards; the headline then rises in word by word.

    python3 promo.py <W> <H> <out.mp4> [--frames 30,90,...]   (frames: write PNG stills only)
"""
import sys, os, math, random, subprocess
import pymunk
from PIL import Image, ImageDraw, ImageFont

W, H, OUT = int(sys.argv[1]), int(sys.argv[2]), sys.argv[3]
STILLS = [int(x) for x in sys.argv[5].split(',')] if len(sys.argv) > 5 and sys.argv[4] == '--frames' else None
FPS = 30
T_IN, T_BURST, T_END = 2.6, 4.0, 16.0
N = int(T_END * FPS)
PORT = W < H
S = min(W, H) / 1080

FONTS = '/tmp/claude-0/-home-claude/3ebe1904-2cd5-5bf6-b252-ae0b967f4c22/scratchpad/fonts/node_modules/@fontsource'
def font(fam, w, st, px): return ImageFont.truetype(f'{FONTS}/{fam}/files/{fam}-latin-{w}-{st}.woff', int(px))
PAPER, INK, MUTED, GO = (251, 250, 247), (26, 24, 20), (119, 114, 106), (23, 64, 44)
def mix(c, a): return tuple(int(PAPER[j] + (c[j] - PAPER[j]) * a) for j in range(3))
def ease(x): x = max(0, min(1, x)); return 1 - (1 - x) ** 3
def ease_io(x): x = max(0, min(1, x)); return 4 * x ** 3 if x < .5 else 1 - (-2 * x + 2) ** 3 / 2

IMG = '/home/claude/voices/src/standalone/images'
ids = sorted(f[9:-10] for f in os.listdir(IMG) if f.startswith('composer-') and f.endswith('-face.webp'))
rnd = random.Random(11); rnd.shuffle(ids)
R = 118 * S
D = int(2 * R)
def disc(i, d):
    im = Image.open(f'{IMG}/composer-{i}-face.webp').convert('RGB').resize((d, d), Image.LANCZOS)
    m = Image.new('L', (d * 4, d * 4), 0); ImageDraw.Draw(m).ellipse((0, 0, d * 4 - 1, d * 4 - 1), fill=255)
    im.putalpha(m.resize((d, d), Image.LANCZOS)); return im
FACE = {i: disc(i, D) for i in ids}

# ---- physics: no gravity; every face is pulled to the centre and settles into a tight packing ----
space = pymunk.Space(); space.gravity = (0, 0); space.damping = 0.25
C = pymunk.Vec2d(W / 2, H / 2)
half_diag = math.hypot(W, H) / 2 + R * 0.6
count = int(math.pi * half_diag ** 2 / (2 * math.sqrt(3) * R * R))
bodies = []
for n in range(count):
    a = rnd.uniform(0, 2 * math.pi)
    # start just outside the frame, on the line from the centre at this angle
    dx, dy = math.cos(a), math.sin(a)
    tx = (W / 2 + R) / abs(dx) if dx else 1e9; ty = (H / 2 + R) / abs(dy) if dy else 1e9
    dist = min(tx, ty) + rnd.uniform(0, 500 * S) + R
    b = pymunk.Body(1, float('inf'))  # never turns: the faces stay upright
    b.position = C + (dx * dist, dy * dist)
    sh = pymunk.Circle(b, R - 1.5 * S); sh.elasticity, sh.friction = 0.15, 0.4
    bodies.append([b, sh, ids[n % len(ids)], rnd.uniform(0, T_IN), False])
bodies.sort(key=lambda x: x[3])

def pull(b, dt):
    v = C - b.position; d = max(1, v.length)
    b.velocity += v / d * min(5200 * S, 9 * d) * dt

# ---- text ----
if PORT:
    H1, H2 = font('cormorant-garamond', 500, 'normal', 150 * S), font('cormorant-garamond', 500, 'italic', 150 * S)
    FEAT, LOGO, SMALL = font('jost', 400, 'normal', 50 * S), font('cormorant-garamond', 500, 'italic', 150 * S), font('jost', 400, 'normal', 38 * S)
    HEAD = [(['Hundreds', 'of'], H1), (['art', 'songs'], H1), (['and', 'Lieder.'], H2)]
else:
    H1, H2 = font('cormorant-garamond', 500, 'normal', 130 * S), font('cormorant-garamond', 500, 'italic', 130 * S)
    FEAT, LOGO, SMALL = font('jost', 400, 'normal', 40 * S), font('cormorant-garamond', 500, 'italic', 140 * S), font('jost', 400, 'normal', 32 * S)
    HEAD = [(['Hundreds', 'of', 'art', 'songs'], H1), (['and', 'Lieder.'], H2)]
FEATS = ['The words, translated line by line', 'IPA for every word', 'Every word spoken, said right',
         'A piano that slows down and loops', 'Score and texts to download as PDF']
T_HEAD = T_BURST + 0.75          # the words start rising once the faces have cleared the middle
T_FEAT0, T_FEATD = 6.6, 0.45
T_LOGO = 12.4

def rise_line(im, words, f, y, t0, t, fade_out):
    """a line whose words rise one by one out of a hidden baseline, each fading up as it comes"""
    d = ImageDraw.Draw(im)
    sp = d.textlength(' ', font=f)
    ws = [d.textlength(w, font=f) for w in words]
    x = (W - (sum(ws) + sp * (len(words) - 1))) / 2
    lh = int(f.size * 1.3)
    layer = Image.new('RGBA', (W, lh), (0, 0, 0, 0)); ld = ImageDraw.Draw(layer)
    for k, w in enumerate(words):
        p = ease((t - t0 - k * 0.09) / 0.75)
        if p > 0:
            a = p * (1 - fade_out)
            ld.text((x, f.size * 0.05 + (1 - p) * f.size * 0.9), w, font=f, fill=INK + (int(255 * a),))
        x += ws[k] + sp
    im.paste(layer, (0, int(y)), layer)

def draw_text(im, t):
    out = ease((t - T_LOGO) / 0.6)
    lh = H1.size * 0.98
    head_h = lh * len(HEAD)
    feat_gap = FEAT.size * 1.9
    block = head_h + 70 * S + feat_gap * len(FEATS)
    y0 = (H - block) / 2 - H1.size * 0.15
    if out < 1:
        for n, (words, f) in enumerate(HEAD):
            rise_line(im, words, f, y0 + n * lh - 40 * S * out, T_HEAD + n * 0.22, t, out)
        d = ImageDraw.Draw(im)
        y = y0 + head_h + 70 * S
        lw = max(d.textlength(s, font=FEAT) for s in FEATS) + 50 * S
        x = (W - lw) / 2 + 50 * S
        for n, s in enumerate(FEATS):
            p = ease((t - T_FEAT0 - n * T_FEATD) / 0.6); a = p * (1 - out)
            if a <= 0: continue
            cy = y + n * feat_gap + FEAT.size * 0.62; rr = 9 * S * ease((t - T_FEAT0 - n * T_FEATD) / 0.35)
            d.ellipse((x - 40 * S - rr, cy - rr, x - 40 * S + rr, cy + rr), fill=mix(GO, a))
            d.text((x + 24 * S * (1 - p), y + n * feat_gap), s, font=FEAT, fill=mix(INK, a))
    a = ease((t - T_LOGO - 0.4) / 0.8)
    if a > 0:
        d = ImageDraw.Draw(im)
        for s, f, yy, c in [('Sottovoce', LOGO, H / 2 - LOGO.size * 0.55, INK), ('Opera · Songs · Choral', SMALL, H / 2 + LOGO.size * 0.62, MUTED)]:
            w = d.textlength(s, font=f); d.text(((W - w) / 2, yy + 30 * S * (1 - a)), s, font=f, fill=mix(c, a))

ROW = ['schubert', 'schumann', 'faure', 'debussy', 'tosti', 'brahms', 'mozart'] if PORT else ['schubert', 'schumann', 'brahms', 'faure', 'debussy', 'tosti', 'mahler', 'puccini', 'mozart']
RR = int(70 * S)
ROWF = {i: disc(i, 2 * RR) for i in ROW}
def draw_row(im, t):
    gap = RR * 2 - 18 * S; x0 = W / 2 - gap * (len(ROW) - 1) / 2
    for n, i in enumerate(ROW):
        a = ease((t - T_LOGO - 0.6 - n * 0.07) / 0.5)
        if a <= 0: continue
        ring = Image.new('RGBA', (2 * RR + int(8 * S),) * 2, (0, 0, 0, 0))
        ImageDraw.Draw(ring).ellipse((0, 0, ring.width - 1, ring.height - 1), fill=PAPER + (255,))
        ring.paste(ROWF[i], (int(4 * S), int(4 * S)), ROWF[i])
        if a < 1: ring.putalpha(ring.getchannel('A').point(lambda v: int(v * a)))
        yy = H / 2 - LOGO.size * 0.55 - RR - 40 * S + 30 * S * (1 - a)
        im.paste(ring, (int(x0 + n * gap - ring.width / 2), int(yy - ring.height / 2)), ring)

ff = None
if not STILLS:
    ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                           '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', OUT + '.tmp.mp4'], stdin=subprocess.PIPE)
burst = False
SUB = 6
for fr in range(N):
    t = fr / FPS
    for e in bodies:
        if not e[4] and e[3] <= t:
            e[4] = True; b = e[0]
            v = C - b.position; b.velocity = v / v.length * (1100 * S)
            space.add(b, e[1])
    if not burst and t >= T_BURST:
        burst = True; space.damping = 1.0
        for e in bodies:
            b = e[0]; v = b.position - C; d = max(1, v.length)
            # the middle opens first, as if something pushed up from under the table
            b.velocity = v / d * (420 * S + d * 1.5) + (rnd.uniform(-60, 60) * S, rnd.uniform(-60, 60) * S)
    for _ in range(SUB):
        if not burst:
            for e in bodies:
                if e[4]: pull(e[0], 1 / FPS / SUB)
        space.step(1 / FPS / SUB)
    im = Image.new('RGB', (W, H), PAPER)
    if t >= T_HEAD - 0.1: draw_text(im, t)
    for b, sh, i, t0, live in bodies:
        if not live: continue
        x, y = b.position
        if x < -R or x > W + R or y < -R or y > H + R: continue
        im.paste(FACE[i], (int(round(x - R)), int(round(y - R))), FACE[i])
    if t >= T_LOGO + 0.6: draw_row(im, t)
    if STILLS:
        if fr in STILLS: im.save(f'{OUT}-{fr}.png')
        if fr >= max(STILLS): break
    else:
        ff.stdin.write(im.tobytes())
if ff:
    ff.stdin.close(); assert ff.wait() == 0; os.replace(OUT + '.tmp.mp4', OUT)
