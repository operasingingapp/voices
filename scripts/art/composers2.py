"""The composer portraits from the user's later Figma files (composers_1_1, composers_2, composers_3): each frame named
after its composer, a 1792 x 2400 portrait and a 1000 x 1000 face, holding the cut-out exactly as placed. Each is drawn
over its own pale backdrop with the same tone and paper grain as composers.py, at the app's two sizes.

    python3 scripts/art/composers2.py <dir with the unzipped .fig folders, each with nodes.json> <out dir>

nodes.json comes from scripts/art/figma-nodes.cjs. Prints the composers it wrote as "id|short name|full name"."""
import json, os, sys
from PIL import Image
FIGS, OUT = sys.argv[1], sys.argv[2]
src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'composers.py')).read().split("os.makedirs(OUT")[0]
src = src.replace("full = {h[:12]: h for h in os.listdir(os.path.join(FIG, 'images'))}", "")
g = {}; exec(src, g)
comp = g['comp']
# full name in the Figma frame -> (id, the short name the catalogues use)
NAMES = {
 'Mahler': ('mahler', 'Mahler'), 'Claude Debussy': ('debussy', 'Debussy'), 'Robert Schumann': ('schumann', 'Schumann'),
 'Hugo Wolf': ('wolf', 'Wolf'), 'Arthur Somervell': ('somervell', 'Somervell'), 'Roger Quilter': ('quilter', 'Quilter'),
 'Charles Gounod': ('gounod', 'Gounod'), 'Ernest Chausson': ('chausson', 'Chausson'), 'Gaetano Donizetti': ('donizetti', 'Donizetti'),
 'Felix Mendelssohn': ('mendelssohn', 'Mendelssohn'), 'Mozart': ('mozart', 'Mozart'), 'George Frideric Handel': ('handel', 'Handel'),
 'Joseph Haydn': ('haydn', 'Haydn'), 'Verdi': ('verdi', 'Verdi'), 'Reynaldo Hahn': ('hahn', 'Hahn'),
 'Francesco Paolo Tosti': ('tosti', 'Tosti'), 'Jules Massenet': ('massenet', 'Massenet'), 'Hector Berlioz': ('berlioz', 'Berlioz'),
 'George Butterworth': ('butterworth', 'Butterworth'), 'Fernando Obradors': ('obradors', 'Obradors'),
 'Clara Schumann': ('claraschumann', 'Clara Schumann'), 'Monteverdi': ('monteverdi', 'Monteverdi'), 'Giulio Caccini': ('caccini', 'Caccini'),
 'Giacomo Carissimi': ('carissimi', 'Carissimi'), 'Antonio Cesti': ('cesti', 'Cesti'), 'Alessandro Stradella': ('stradella', 'Stradella'),
 'Salvator Rosa': ('rosa', 'Rosa'), 'Giovanni Legrenzi': ('legrenzi', 'Legrenzi'), 'Alessandro Scarlatti': ('scarlatti', 'Scarlatti'),
 'Giovanni Bononcini': ('bononcini', 'Bononcini'), 'Antonio Caldara': ('caldara', 'Caldara'), 'Francesco Gasparini': ('gasparini', 'Gasparini'),
 'ntonio Lotti': ('lotti', 'Lotti'), 'Benedetto Marcello': ('marcello', 'Marcello'), 'Giuseppe Torelli': ('torelli', 'Torelli'),
 'Francesco Durante': ('durante', 'Durante'), 'Giovanni Battista Pergolesi': ('pergolesi', 'Pergolesi'), 'Giovanni Paisiello': ('paisiello', 'Paisiello'),
 'Tommaso Giordani': ('giordani', 'Giordani'), 'Vincenzo Bellini': ('bellini', 'Bellini'), 'alessandro Parisotti': ('parisotti', 'Parisotti'),
 'Stefano Donaudy': ('donaudy', 'Donaudy'), 'Ottorino Respighi': ('respighi', 'Respighi'), 'Eduardo di Capua': ('dicapua', 'di Capua'),
 'Ernesto De Curtis': ('decurtis', 'De Curtis'), 'Henry Purcell': ('purcell', 'Purcell'), 'Thomas Arne': ('arne', 'Arne'),
 'Christoph Willibald Gluck': ('gluck', 'Gluck'), 'Henri Duparc': ('duparc', 'Duparc'), 'Maurice Ravel': ('ravel', 'Ravel'),
 'Manuel de Falla': ('falla', 'Falla'), 'Enrique Granados': ('granados', 'Granados'), 'Antonín Dvořák': ('dvorak', 'Dvořák'),
 'Edvard Grieg': ('grieg', 'Grieg'), 'Sergei Rachmaninoff': ('rachmaninoff', 'Rachmaninoff'), 'Charles Ives': ('ives', 'Ives'),
}
FULL = {'Mahler': 'Gustav Mahler', 'Mozart': 'Wolfgang Amadeus Mozart', 'Verdi': 'Giuseppe Verdi', 'Monteverdi': 'Claudio Monteverdi',
        'ntonio Lotti': 'Antonio Lotti', 'alessandro Parisotti': 'Alessandro Parisotti'}
# pale backdrops, each composer his own, in turn (the ones the first portraits had are kept)
PALE = ['#a9c4e0', '#e8b4b8', '#b9d3a8', '#e6c27a', '#c4b0dc', '#9fcfc0', '#e0a98c', '#b4bfe0', '#d6c08a', '#a6d0cf',
        '#d8b4d4', '#c2d2a4', '#e9c99a', '#8fc1bd', '#e3b38f', '#b3c7e8', '#c9b48a', '#d9a3a0', '#a7c9dd', '#c7c49a']
COLS = dict(g['COLS'])
def render(fig, frame, nodes, W, H):
    """the frame as Figma draws it: its visible layers' cut-outs, cover-fit in their rectangles, clipped to the frame"""
    images = {i[:12]: i for i in os.listdir(f'{fig}/images')}
    fw, fh = frame['size']['x'], frame['size']['y']
    s = W / fw
    out = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    for r in [k for k in nodes if k['parent'] == frame['id'] and k.get('visible') is not False]:
        cut = next((p for p in r['paints'] if p['type'] == 'IMAGE' and p.get('visible') is not False and p.get('hash')), None)
        if not cut: continue
        im = Image.open(f"{fig}/images/{images[cut['hash'][:12]]}").convert('RGBA')
        t = r['transform']; w, h = r['size']['x'], r['size']['y']
        fx, fy = t['m00'] < 0, t['m11'] < 0
        x = t['m02'] - w if fx else t['m02']; y = t['m12'] - h if fy else t['m12']
        sc = max(w / im.width, h / im.height)
        tw, th = im.width * sc * s, im.height * sc * s
        px, py = x * s + (w * s - tw) / 2, y * s + (h * s - th) / 2
        part = im.resize((max(1, round(tw)), max(1, round(th))), Image.LANCZOS)
        if fx: part = part.transpose(Image.FLIP_LEFT_RIGHT)
        if fy: part = part.transpose(Image.FLIP_TOP_BOTTOM)
        layer = Image.new('RGBA', (W, H), (0, 0, 0, 0)); layer.paste(part, (round(px), round(py)), part)
        out = Image.alpha_composite(out, layer)
    return out
os.makedirs(OUT, exist_ok=True)
done = {}
k = 0
# the later files win over the earlier ones; mozart.fig's frames kept the name of the page they were copied from
FILES = [('composers_1_1', None), ('composers_2', None), ('composers_3', None), ('mozart_new', 'Mozart')]
for f, rename in FILES:
    fig = f'{FIGS}/{f}'
    if not os.path.exists(f'{fig}/nodes.json'): continue
    nodes = json.load(open(f'{fig}/nodes.json'))
    for fr in [x for x in nodes if x['type'] == 'FRAME' and x.get('size')]:
        name = rename or fr['name'].replace('⁠', '').strip()
        if name not in NAMES: continue
        cid, short = NAMES[name]
        if cid not in COLS:
            COLS[cid] = PALE[k % len(PALE)]; k += 1
        seed = sum(map(ord, cid))
        if round(fr['size']['x']) == 1792:
            comp(render(fig, fr, nodes, 720, 964), COLS[cid], (720, 964), seed).save(f'{OUT}/composer-{cid}-portrait.webp', quality=80, method=6)
            done.setdefault(cid, set()).add('portrait')
        elif round(fr['size']['x']) == 1000:
            comp(render(fig, fr, nodes, 320, 320), COLS[cid], (320, 320), seed + 1).save(f'{OUT}/composer-{cid}-face.webp', quality=82, method=6)
            done.setdefault(cid, set()).add('face')
        done.setdefault(cid, set()).add(f'{short}|{FULL.get(name, name)}')
for cid, v in done.items():
    names = [x for x in v if '|' in x][0]
    print(f"{cid}|{names}|{'portrait' in v}|{'face' in v}")
