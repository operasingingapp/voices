# Illustrations

Every picture is optimised before it goes in here. Never add an original export.

- **Source:** the Figma file of character and opera art (not kept in the repository: it is about 400 MB). Each
  character has a portrait frame (1792 × 2400) and a round face frame (1500 × 1500); each opera a cover frame
  (2901 × 1619) and a square frame (1600 × 1600). The figures are cut-outs on transparent backgrounds.
- **Building them:** `node scripts/art/figma-nodes.cjs <unzipped>/canvas.fig <unzipped>/nodes2.json`, then
  `python3 scripts/art/build.py <unzipped> scripts/art src/standalone/images` (the .fig file is a zip: unzip it to
  `<unzipped>/x`). Each frame is drawn exactly as placed in Figma (crop, scale, mirroring), the cut-out over the
  backdrop chosen in `scripts/art/palette.json`, with a very fine grain on the backdrop only. A few frames hold a
  flat-colour copy of a picture; the build uses its cut-out instead (checked pixel for pixel).
- **Which picture is whose:** `scripts/art/chars.json` (opera:character → the image for the portrait and the face).
- **Colours:** each backdrop complements its costume (a teal coat on apricot, a red dress on sea-teal). The build
  also writes `../art-tones.json`: the character's card colours (soft, strong, deep), a pale tint of the backdrop's
  complement, so the card and the picture contrast and belong together (a candy-pink complement is turned to a warm
  peach-clay). The app uses them for the character's card, chips and practice screen.
- **Format:** WebP. Character portrait `<opera>-<character>-portrait.webp` 720 × 964, quality 80; face
  `<opera>-<character>-face.webp` 320 × 320, quality 82; opera cover `<opera>-cover.webp` 1600 × 893, quality 72;
  circle `<opera>-square.webp` 480 × 480, quality 80.
- **Registering:** `../opera-extra.ts` picks every file up by name; add the description of a new portrait to
  `PORTRAIT_ALT` (or of a cover to `COVER_ALT`).
- **Replacing a picture:** overwrite the file under the same name. The build adds a short fingerprint to each
  published file name, so a new picture never shows the old cached one.

## Composers

- **Files:** `composer-<id>-portrait.webp` 720 × 964 (quality 80) and `composer-<id>-face.webp` 320 × 320 (quality
  82), for bach, beethoven, bizet, brahms, faure, handel, haydn, mozart, puccini, rossini, rstrauss, tchaikovsky,
  verdi, vivaldi and wagner. Built like the character art: the cut-out over the colour of the portrait's original
  backdrop, with the same paper grain.
- **Portraits (and Bizet's face):** from the user's `composers.fig` (unzipped):
  `python3 scripts/art/composers.py <unzipped composers.fig> src/standalone/images`. The images are picked by their
  hash in the script, not by frame name: in that file the frame named "Johannes Brahms" holds Verdi and "Frame 9"
  holds Brahms.
- **Faces:** the user reframed them as 700 × 700 circle frames in `composers_1.fig`. Unzip it to `<dir>/x`, run
  `node scripts/art/figma-nodes.cjs <dir>/x/canvas.fig <dir>/nodes2.json`, then
  `python3 scripts/art/composer-faces.py <dir> src/standalone/images` (after `composers.py`, which writes the plain
  crops first). Each frame is drawn exactly as placed, mirrored layers included (Haydn and Wagner face the other way
  on purpose). Bizet has no circle frame and keeps the plain crop. `composer-faces.py` reuses the colours, cut-outs
  and grain from the part of `composers.py` before its build loop (it splits that file at `os.makedirs(OUT`).
- **Registering:** `../composers.ts` picks the files up by name and holds what each portrait shows (`ALT`).
