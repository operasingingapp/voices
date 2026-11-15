"""Sottovoce songs promo: the 3D coin intro, then the app itself, recorded on the desktop layout, one feature at a time
with the camera moving in on what matters and a line saying what it is, then the 3D end around the name.

    python3 promo4.py <v|w> <out.mp4> [--stills 10,20,...]
"""
import sys, os, json, bisect, subprocess
from PIL import Image, ImageDraw, ImageFont, ImageFilter

MODE, OUT = sys.argv[1], sys.argv[2]
STILLS = [float(x) for x in sys.argv[4].split(',')] if len(sys.argv) > 4 and sys.argv[3] == '--stills' else None
PORT = MODE == 'v'
W, H = (1080, 1920) if PORT else (1920, 1080)
FPS = 30
HERE = '/home/claude/work/promo2'
D3 = f'{HERE}/{"v3d" if PORT else "w3d"}'
CUT = json.load(open(f'{D3}/cut.json'))
N3 = len([f for f in os.listdir(D3) if f.endswith('.jpg')])
# two recordings of the same tour: one sharp (twice the pixels, a few frames a second) for the calm moments, one
# smooth (about twenty frames a second) for playback
SC = '/tmp/claude-0/-home-claude/3ebe1904-2cd5-5bf6-b252-ae0b967f4c22/scratchpad'
SRCS = {}
for key, d in (('x2', f'{SC}/rec2x'), ('x1', f'{SC}/rec1x')):
    R = json.load(open(f'{d}/index.json'))
    SRCS[key] = dict(dir=d, FT=[t for i, t in R['frames']], FI=[i for i, t in R['frames']], MK=dict(R['marks']), TAPS=R['taps'])
SMOOTH = {'play', 'mute'}
def src_of(m): return SRCS['x1' if m[0] in SMOOTH else 'x2']
FONTS = '/home/claude/work/promo3d/fonts'
def font(w, px): return ImageFont.truetype(f'{FONTS}/jost-latin-{w}-normal.woff', int(px))
PAPER, INK = (251, 250, 247), (26, 24, 20)
def clamp(x): return max(0.0, min(1.0, x))
def ease(x): x = clamp(x); return 1 - (1 - x) ** 3
def eio(x): x = clamp(x); return 4 * x ** 3 if x < .5 else 1 - (-2 * x + 2) ** 3 / 2

FULL = (0, 0, 1440, 900)
# name, seconds, line, how the recording runs [(from u, recording time)], where the camera looks [(from u, rect in page px)]
MOMENTS = [
    ('find', 5.8, 'Find a song by language, level or composer.', [(0, 0.2)], [(0, (330, 30, 1420, 430)), (3.6, (200, 0, 1440, 640))]),
    ('page', 5.6, 'Every song comes with its story.', [(0, 0.3)], [(0, (330, 60, 1410, 530)), (2.9, (330, 560, 1430, 800))]),
    ('play', 6.6, 'Press play: the voice sings, the piano plays, the words light up.', [(0, 0.5)], [(0, (0, 60, 1440, 290)), (3.1, (0, 60, 1440, 700))]),
    ('mute', 6.2, 'Mute the voice and sing it yourself, with the piano.', [(0, 0.3)], [(0, (0, 560, 760, 900)), (3.0, (0, 40, 1440, 700))]),
    ('ipa', 4.6, 'IPA and translation under every line.', [(0, 0.2)], [(0, (0, 40, 1440, 300))]),
    ('word', 5.2, 'Tap any word: what it means, how it sounds.', [(0, 0.2)], [(0, (330, 40, 1150, 540))]),
    ('wordsview', 5.0, 'The whole text, line by line, translated.', [(0, 0.2)], [(0, FULL), (1.1, (120, 70, 1320, 600))]),
    ('pageview', 5.0, 'Or the score, a full page at a time.', [(0, 0.2)], [(0, FULL), (1.6, (0, 40, 1440, 820))]),
    ('loop', 4.4, 'Loop the bars you are working on.', [(0, 0.2)], [(0, (0, 320, 1100, 900))]),
    ('note', 6.4, 'Pencil in your own notes.', [(0, 0.9)], [(0, (0, 330, 1000, 720)), (4.6, (0, 300, 1300, 760))]),
    ('pdf', 7.0, 'Save the score, or the text with its translation, as a PDF.', [(0, 1.9), (3.0, 3.75)], [(0, FULL), (3.0, FULL), (3.8, (280, 110, 1440, 900))]),
]
XF = 0.45
T_APP = CUT[0]
STARTS = []; t = T_APP + 0.3
for m in MOMENTS: STARTS.append(t); t += m[1]
T_APP_END = t
END_N = N3 - int(round(CUT[1] * FPS))
TOTAL = T_APP_END + END_N / FPS

_cache = {}
def _load(S, k):
    key = (S['dir'], k)
    if key not in _cache:
        if len(_cache) > 24: _cache.clear()
        _cache[key] = Image.open(f"{S['dir']}/f/{k:05d}.jpg").convert('RGB')
    return _cache[key]
def rec_frame(S, ts):
    # between two close frames, blend, so motion stays smooth
    FT, FI = S['FT'], S['FI']
    i = max(0, bisect.bisect_right(FT, ts) - 1)
    a = _load(S, FI[i])
    if i + 1 < len(FT) and FT[i + 1] - FT[i] < 0.4:
        w = (ts - FT[i]) / (FT[i + 1] - FT[i])
        if w > 0.05: return Image.blend(a, _load(S, FI[i + 1]), min(1, w))
    return a
def rec_time(m, u):
    name, _, _, runs, _ = m
    r = runs[0]
    for x in runs:
        if u >= x[0]: r = x
    return src_of(m)['MK'][name] + r[1] + (u - r[0])
def cam_rect(m, u):
    beats = m[4]; cur = beats[0][1]
    for k, (bu, rect) in enumerate(beats):
        if u >= bu:
            prev = beats[k - 1][1] if k else rect
            p = eio((u - bu) / 0.9)
            cur = tuple(prev[j] + (rect[j] - prev[j]) * p for j in range(4))
    return cur

# where the app may sit on the frame; the line goes under it (wide) or over it (tall)
if PORT: AX0, AY0, AX1, AY1 = 24, 330, W - 24, H - 60
else: AX0, AY0, AX1, AY1 = 70, 46, W - 70, H - 150
def transform(rect):
    rw, rh = rect[2] - rect[0], rect[3] - rect[1]
    s = min((AX1 - AX0) / rw, (AY1 - AY0) / rh)
    cx, cy = (rect[0] + rect[2]) / 2, (rect[1] + rect[3]) / 2
    return s, (AX0 + AX1) / 2 - cx * s, (AY0 + AY1) / 2 - cy * s

def paper_bg():
    bg = Image.new('RGB', (W, H), PAPER)
    v = Image.radial_gradient('L').resize((W, H), Image.BILINEAR)
    edge = Image.new('RGB', (W, H), (226, 219, 208))
    return Image.composite(edge, bg, v.point(lambda x: int(clamp((x - 90) / 165) * 170)))
BG = paper_bg()
GRAIN = [Image.merge('RGB', [Image.effect_noise((W // 2, H // 2), 60).resize((W, H), Image.NEAREST)] * 3) for _ in range(4)]

def draw_app(img, m, u, alpha=1.0):
    """the recorded page placed by the camera; it shows through a frame that never runs past the area kept for it, so
    a close-up stays inside the same rounded window, with its shadow, and the line under it stays clear"""
    S = src_of(m)
    s, ox, oy = transform(cam_rect(m, u))
    rt = rec_time(m, u)
    src = rec_frame(S, rt)
    fx0, fy0 = max(AX0, ox), max(AY0, oy)
    fx1, fy1 = min(AX1, ox + 1440 * s), min(AY1, oy + 900 * s)
    x0, y0, x1, y1 = (fx0 - ox) / s, (fy0 - oy) / s, (fx1 - ox) / s, (fy1 - oy) / s
    k2 = src.width / 1440
    tw, th = int(round(fx1 - fx0)), int(round(fy1 - fy0))
    crop = src.crop((int(x0 * k2), int(y0 * k2), int(x1 * k2), int(y1 * k2))).resize((max(1, tw), max(1, th)), Image.LANCZOS).convert('RGBA')
    d = ImageDraw.Draw(crop)
    for tt, x, y in S['TAPS']:
        a = rt - tt
        if -0.05 < a < 0.8:
            k = clamp(a / 0.22); fade = 1 - clamp((a - 0.35) / 0.45)
            r = (26 - 7 * k) * s; px, py = (x - x0) * s, (y - y0) * s
            d.ellipse((px - r, py - r, px + r, py + r), fill=(26, 24, 20, int(60 * fade)), outline=(255, 255, 255, int(220 * fade)), width=max(2, int(3 * s)))
    rad = 22
    sh = Image.new('L', (W // 6, H // 6), 0)
    ImageDraw.Draw(sh).rounded_rectangle((fx0 / 6, (fy0 + 20) / 6, fx1 / 6, (fy1 + 20) / 6), rad / 6, fill=int(95 * alpha))
    sh = sh.filter(ImageFilter.GaussianBlur(6)).resize((W, H), Image.BILINEAR)
    img.paste((60, 45, 30), (0, 0), sh)
    mask = Image.new('L', (tw, th), 0); ImageDraw.Draw(mask).rounded_rectangle((0, 0, tw - 1, th - 1), rad, fill=int(255 * alpha))
    img.paste(crop.convert('RGB'), (int(round(fx0)), int(round(fy0))), mask)

CAP = font(500, 46 if PORT else 40)
def wrap(d, s, f, mw):
    out, line = [], ''
    for w in s.split():
        tt = (line + ' ' + w).strip()
        if d.textlength(tt, font=f) > mw and line: out.append(line); line = w
        else: line = tt
    return out + [line]
def draw_caption(img, text, a, dy):
    if a <= 0.01: return
    d = ImageDraw.Draw(img)
    lines = wrap(d, text, CAP, W * (0.84 if PORT else 0.7))
    lh = CAP.size * 1.32
    cy = (190 if PORT else H - 80) + dy
    y = cy - lh * len(lines) / 2
    for l in lines:
        w = d.textlength(l, font=CAP)
        c = tuple(int(PAPER[j] + (INK[j] - PAPER[j]) * a) for j in range(3))
        d.text(((W - w) / 2, y), l, font=CAP, fill=c); y += lh

def moment_at(t):
    for k in range(len(MOMENTS) - 1, -1, -1):
        if t >= STARTS[k]: return k
    return 0
def app_frame(t, rise=0.0):
    img = BG.copy()
    k = moment_at(t); m = MOMENTS[k]; u = t - STARTS[k]
    nxt = k + 1 < len(MOMENTS) and u > m[1] - XF
    if nxt:
        a = eio((u - (m[1] - XF)) / XF)
        tmp = BG.copy(); draw_app(tmp, m, u); draw_app(img, MOMENTS[k + 1], 0)
        img = Image.blend(tmp, img, a)
    else:
        if rise > 0:
            tmp = BG.copy(); draw_app(tmp, m, u); img = Image.blend(img, tmp, 1 - rise)
        else: draw_app(img, m, u)
    for j in (k - 1, k, k + 1):
        if 0 <= j < len(MOMENTS):
            uj = t - STARTS[j]
            pin = ease((uj + 0.1) / 0.5); pout = ease((uj - MOMENTS[j][1] + XF + 0.05) / 0.35) if j < len(MOMENTS) - 1 else ease((t - T_APP_END + 0.1) / 0.4)
            draw_caption(img, MOMENTS[j][2], pin * (1 - pout) * (1 - rise), (1 - pin) * 24 - pout * 18)
    g = GRAIN[int(t * FPS) % 4]
    return Image.blend(img, g, 0.03)

def frame_at(t):
    if t < T_APP:
        return Image.open(f'{D3}/{int(round(t * FPS)):04d}.jpg').convert('RGB')
    if t < STARTS[0]:
        a = Image.open(f'{D3}/{int(round(T_APP * FPS)) - 1:04d}.jpg').convert('RGB')
        return Image.blend(a, app_frame(STARTS[0]), eio((t - T_APP) / (STARTS[0] - T_APP)))
    if t < T_APP_END:
        return app_frame(t)
    k = int(round(CUT[1] * FPS)) + int(round((t - T_APP_END) * FPS))
    end = Image.open(f'{D3}/{min(k, N3 - 1):04d}.jpg').convert('RGB')
    if t < T_APP_END + 0.5:
        return Image.blend(app_frame(T_APP_END - 0.001), end, eio((t - T_APP_END) / 0.5))
    return end

if STILLS:
    for s in STILLS: frame_at(s).save(f'{OUT}-{s}.jpg', quality=86)
    print('total', round(TOTAL, 1), [round(x, 1) for x in STARTS])
    sys.exit()
ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                       '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '21', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', OUT + '.tmp.mp4'], stdin=subprocess.PIPE)
for f in range(int(TOTAL * FPS)):
    ff.stdin.write(frame_at(f / FPS).tobytes())
ff.stdin.close(); assert ff.wait() == 0; os.replace(OUT + '.tmp.mp4', OUT)
print('seconds', round(TOTAL, 2))
