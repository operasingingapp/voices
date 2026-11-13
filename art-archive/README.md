# Art archive

Pictures taken out of the app but kept to bring back.

- `characters/`: every character's portrait (`<opera>-<character>-portrait.webp`, 720 × 964) and face
  (`<opera>-<character>-face.webp`, 320 × 320), as built by `scripts/art/build.py`. Removed from the app on
  2026-11-14 (the app shows its drawn figures in their place); the composers' portraits stayed.

To bring them back: move the files back into `src/standalone/images/`. `src/standalone/opera-extra.ts` picks every
file up by name, and the alt texts in `PORTRAIT_ALT` are still there.
