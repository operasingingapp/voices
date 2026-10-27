# Illustrations

Every picture is optimised before it goes in here. Never add an original export.

- **Format:** WebP (Safari on iPad and iPhone shows it from iOS 14).
- **Opera cover** (`<opera>-cover.webp`): 1600 px wide, quality 72. About 150–220 KB.
- **Opera circle** (`<opera>-square.webp`): a 480 × 480 crop around the main figures, quality 80. About 25–30 KB.
- **Character portrait** (`<opera>-<character>`: `-portrait.webp` 720 px wide, quality 80; `-face.webp` 320 × 320 crop around the face, quality 82).
- Register covers in `ART` and portraits in `PORTRAITS` in `../opera-extra.ts`; the build emits them as separate files.
- **Replacing a picture:** overwrite the file under the same name. The build adds a short fingerprint to each published file name, so a new picture never shows the old cached one.
- **Face crops:** every `-face.webp` is cut around the centre of the face (the whole head, hair included), with the crop side 2.7 × the face height, so all faces sit in the middle of their circle at the same size. The measured centres are in `scripts/face-crops.py`; add a line there for each new portrait.
