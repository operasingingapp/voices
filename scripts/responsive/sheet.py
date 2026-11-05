"""Contact sheet: one image per device (all screens side by side), or per screen (all devices).
   python3 sheet.py <dir> device <name> | screen <name>   -> <dir>/sheet-<kind>-<name>.png"""
import sys, glob, os
from PIL import Image, ImageDraw
d, kind, name = sys.argv[1], sys.argv[2], sys.argv[3]
files = sorted(glob.glob(f"{d}/*__{name}.png") if kind == "device" else glob.glob(f"{d}/{name}__*.png"))
scale = float(sys.argv[4]) if len(sys.argv) > 4 else 0.5
ims = []
for f in files:
    im = Image.open(f).convert("RGB")
    im = im.resize((int(im.width * scale), int(im.height * scale)))
    ims.append((os.path.basename(f).replace(".png", ""), im))
cols = int(sys.argv[5]) if len(sys.argv) > 5 else 4
rows = [ims[i:i + cols] for i in range(0, len(ims), cols)]
W = max(sum(im.width for _, im in r) + 12 * len(r) for r in rows)
H = sum(max(im.height for _, im in r) + 30 for r in rows)
out = Image.new("RGB", (W, H), (70, 70, 70))
dr = ImageDraw.Draw(out)
y = 0
for r in rows:
    x = 0
    for label, im in r:
        dr.text((x + 4, y + 6), label, fill=(255, 255, 255))
        out.paste(im, (x, y + 24))
        x += im.width + 12
    y += max(im.height for _, im in r) + 30
p = f"{d}/sheet-{kind}-{name}.png"
out.save(p)
print(p, out.size)
