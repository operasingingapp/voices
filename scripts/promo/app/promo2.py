"""Sottovoce songs promo: the 3D intro (composers' coins, the headline), four moments recorded from the app on a
phone, each with its line, and the 3D end (a volley of coins around the name).

    python3 promo2.py <v|w> <out.mp4> [--stills 10,20,...]
"""
import sys, os, json, bisect, subprocess, random
from PIL import Image, ImageDraw, ImageFont, ImageFilter

MODE, OUT = sys.argv[1], sys.argv[2]
STILLS = [float(x) for x in sys.argv[4].split(',')] if len(sys.argv) > 4 and sys.argv[3] == '--stills' else None
PORT = MODE == 'v'
W, H = (1080, 1920) if PORT else (1920, 1080)
FPS = 30
HERE = os.path.dirname(os.path.abspath(__file__))
D3 = f'{HERE}/{"v3d" if PORT else "w3d"}'
CUT = json.load(open(f'{D3}/cut.json'))
N3 = len([f for f in os.listdir(D3) if f.endswith('.jpg')])
REC = '/tmp/claude-0/-home-claude/3ebe1904-2cd5-5bf6-b252-ae0b967f4c22/scratchpad/rec'
R = json.load(open(f'{REC}/index.json'))
FT = [t for i, t in R['frames']]; FI = [i for i, t in R['frames']]
MK = dict(R['marks'])
TAPS = R['taps']
FONTS = '/home/claude/work/promo3d/fonts'
def font(w, px, it=False): return ImageFont.truetype(f'{FONTS}/jost-latin-{w}-{"italic" if it else "normal"}.woff', int(px))
PAPER, INK, MUTED, GO = (251, 250, 247), (26, 24, 20), (110, 105, 97), (23, 64, 44)
def clamp(x): return max(0.0, min(1.0, x))
def ease(x): x = clamp(x); return 1 - (1 - x) ** 3
def eio(x): x = clamp(x); return 4 * x ** 3 if x < .5 else 1 - (-2 * x + 2) ** 3 / 2

# ---- the four moments: where each comes from in the recording, and its words ----
D = 3.9                     # how long each moment holds
XF = 0.4                    # cross-fade between moments
SCENES = [
    ('find', 0.7, 'Find your song.', 'Hundreds of songs, by composer, language and level.'),
    ('page', 0.1, 'Know the song.', 'Who wrote the words, when, and what it is about.'),
    ('words', 0.5, 'Every word, understood.', 'IPA, what each word means, and how it sounds.'),
    ('sing', 0.25, 'Sing it with the piano.', 'The accompaniment plays and your words light up.'),
]
T_APP = CUT[0]                       # the app part starts where the 3D intro is cut
T_IN = 0.7                           # the phone rises in
T_APP_END = T_APP + T_IN + D * len(SCENES)
T_OUT = 0.5                          # the phone leaves, the end comes in
END_N = N3 - int(round(CUT[1] * FPS))
TOTAL = T_APP_END + END_N / FPS

_cache = {}
def rec_frame(ts):
    i = max(0, bisect.bisect_right(FT, ts) - 1)
    k = FI[i]
    if k not in _cache:
        if len(_cache) > 40: _cache.clear()
        _cache[k] = Image.open(f'{REC}/f/{k:05d}.jpg').convert('RGB')
    return _cache[k]

# ---- the phone ----
if PORT:
    SH = 1250; SW = round(SH * 430 / 932); PCX, PCY = W / 2, H * 0.61
else:
    SH = 880; SW = round(SH * 430 / 932); PCX, PCY = W * 0.68, H / 2
BZ = 14; RO = 64; RI = RO - BZ
def rmask(w, h, r):
    m = Image.new('L', (w * 3, h * 3), 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, w * 3 - 1, h * 3 - 1), r * 3, fill=255)
    return m.resize((w, h), Image.LANCZOS)
SMASK = rmask(SW, SH, RI)
BODY = Image.new('RGBA', (SW + 2 * BZ, SH + 2 * BZ), (0, 0, 0, 0))
BODY.paste((22, 20, 18, 255), (0, 0), rmask(SW + 2 * BZ, SH + 2 * BZ, RO))
ImageDraw.Draw(BODY).rounded_rectangle((1, 1, BODY.width - 2, BODY.height - 2), RO, outline=(70, 66, 60, 255), width=2)
pad = 120
SHADOW = Image.new('RGBA', (BODY.width + 2 * pad, BODY.height + 2 * pad), (0, 0, 0, 0))
SHADOW.paste((40, 30, 20, 95), (pad, pad + 30), rmask(BODY.width, BODY.height, RO))
SHADOW = SHADOW.filter(ImageFilter.GaussianBlur(46))

def paper_bg():
    bg = Image.new('RGB', (W, H), PAPER)
    v = Image.new('L', (W // 4, H // 4), 0); vd = ImageDraw.Draw(v)
    for k in range(60):
        f = k / 60; vd.ellipse((W / 8 - W / 8 * (1.5 - f), H / 8 - H / 8 * (1.5 - f), W / 8 + W / 8 * (1.5 - f), H / 8 + H / 8 * (1.5 - f)), fill=int(255 * f))
    v = v.filter(ImageFilter.GaussianBlur(20)).resize((W, H), Image.BILINEAR)
    edge = Image.new('RGB', (W, H), (228, 221, 210))
    return Image.composite(bg, Image.blend(bg, edge, 0.55), v)
BG = paper_bg()
rnd = random.Random(5)
GRAIN = []
for _ in range(4):
    g = Image.effect_noise((W // 2, H // 2), 60).resize((W, H), Image.NEAREST)
    GRAIN.append(g)

def screen_at(t):
    """the phone's screen at time t of the app part: each moment's recording, cross-fading into the next"""
    u = t - T_APP - T_IN
    n = max(0, min(len(SCENES) - 1, int(u // D)))
    def frame_of(k, uu):
        name, off = SCENES[k][0], SCENES[k][1]
        return rec_frame(MK[name] + off + max(0, uu))
    im = frame_of(n, u - n * D)
    x = (u - (n + 1) * D + XF) / XF
    if n + 1 < len(SCENES) and x > 0:
        im = Image.blend(im, frame_of(n + 1, 0), eio(x))
    if u < 0: im = frame_of(0, 0)
    return im.resize((SW, SH), Image.LANCZOS), n, u

def draw_taps(layer, t, n, u):
    # a finger's touch: a soft dark ring that presses and lets go where the recording tapped
    d = ImageDraw.Draw(layer)
    name, off = SCENES[n][0], SCENES[n][1]
    rt = MK[name] + off + u
    for tt, x, y in TAPS:
        a = rt - tt
        if -0.05 < a < 0.75:
            k = clamp(a / 0.22); fade = 1 - clamp((a - 0.3) / 0.45)
            r = (34 - 8 * k) * SW / 430
            sx, sy = x * SW / 430, y * SH / 932
            d.ellipse((sx - r, sy - r, sx + r, sy + r), fill=(26, 24, 20, int(70 * fade)), outline=(255, 255, 255, int(200 * fade)), width=3)

TITLE, SUB = (font(500, 78), font(400, 42)) if PORT else (font(500, 70), font(400, 34))
def wrap(d, s, f, mw):
    out, line = [], ''
    for w in s.split():
        tt = (line + ' ' + w).strip()
        if d.textlength(tt, font=f) > mw and line: out.append(line); line = w
        else: line = tt
    return out + [line]
def caption(img, t, n, u):
    d = ImageDraw.Draw(img)
    for k in (n - 1, n, n + 1):
        if k < 0 or k >= len(SCENES): continue
        s0 = k * D - (XF if k else 0)
        p_in = ease((u - s0) / 0.5) if k else ease((t - T_APP - 0.25) / 0.6)
        p_out = ease((u - (k + 1) * D + XF) / 0.35) if k < len(SCENES) - 1 else ease((t - T_APP_END + 0.05) / 0.4)
        a = p_in * (1 - p_out)
        if a <= 0.01: continue
        dy = (1 - p_in) * 40 - p_out * 30
        title, sub = SCENES[k][2], SCENES[k][3]
        if PORT:
            mw = W * 0.82; lines = wrap(d, sub, SUB, mw)
            y = 180 + dy
            tw = d.textlength(title, font=TITLE)
            d.text(((W - tw) / 2, y), title, font=TITLE, fill=mix(INK, a))
            for j, l in enumerate(lines):
                lw = d.textlength(l, font=SUB); d.text(((W - lw) / 2, y + 110 + j * 56), l, font=SUB, fill=mix(MUTED, a))
        else:
            mw = 600; lines = wrap(d, sub, SUB, mw)
            x = 230; y = H / 2 - 70 + dy - len(lines) * 24
            d.text((x, y), title, font=TITLE, fill=mix(INK, a))
            for j, l in enumerate(lines): d.text((x, y + 100 + j * 48), l, font=SUB, fill=mix(MUTED, a))
def mix(c, a): return tuple(int(PAPER[j] + (c[j] - PAPER[j]) * a) for j in range(3))

def app_frame(t):
    img = BG.copy()
    sc, n, u = screen_at(t)
    p_in = ease((t - T_APP) / T_IN)
    p_out = eio((t - T_APP_END + 0.05) / T_OUT) if t > T_APP_END - 0.05 else 0
    oy = (1 - p_in) * (H * 0.75) + p_out * (H * 0.75)
    caption(img, t, n, u)
    bx, by = int(PCX - BODY.width / 2), int(PCY - BODY.height / 2 + oy)
    img.paste(SHADOW, (bx - pad, by - pad), SHADOW)
    img.paste(BODY, (bx, by), BODY)
    layer = sc.convert('RGBA'); draw_taps(layer, t, n, u)
    img.paste(layer, (bx + BZ, by + BZ), SMASK)
    g = GRAIN[int(t * FPS) % 4]
    img = Image.blend(img, Image.merge('RGB', (g, g, g)), 0.035)
    return img

def frame_at(t):
    if t < T_APP:
        return Image.open(f'{D3}/{int(round(t * FPS)):04d}.jpg').convert('RGB')
    if t < T_APP + 0.35:  # the last of the intro fades into the app's page as the phone starts up
        a = Image.open(f'{D3}/{int(round(T_APP * FPS)) - 1:04d}.jpg').convert('RGB')
        return Image.blend(a, app_frame(t), ease((t - T_APP) / 0.35))
    if t < T_APP_END:
        return app_frame(t)
    k = int(round(CUT[1] * FPS)) + int(round((t - T_APP_END) * FPS))
    end = Image.open(f'{D3}/{min(k, N3 - 1):04d}.jpg').convert('RGB')
    if t < T_APP_END + T_OUT:
        return Image.blend(app_frame(t), end, eio((t - T_APP_END) / T_OUT))
    return end

if STILLS:
    for s in STILLS: frame_at(s).save(f'{OUT}-{s}.jpg', quality=88)
    sys.exit()
ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                       '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', OUT + '.tmp.mp4'], stdin=subprocess.PIPE)
for f in range(int(TOTAL * FPS)):
    ff.stdin.write(frame_at(f / FPS).tobytes())
ff.stdin.close(); assert ff.wait() == 0; os.replace(OUT + '.tmp.mp4', OUT)
print('seconds', round(TOTAL, 2))
