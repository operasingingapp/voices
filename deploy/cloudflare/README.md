# Cloudflare deployment

- Site: Cloudflare Pages project `sottovoce` (https://sottovoce-382.pages.dev), the standalone build as assembled for
  the artifact (index.html + assets/), deployed with
  `npx wrangler pages deploy <assembled dir> --project-name sottovoce --branch main` run from this folder (it picks up
  `functions/`). Needs CLOUDFLARE_API_TOKEN (Pages: Edit, R2: Edit) and CLOUDFLARE_ACCOUNT_ID in the environment.
- `functions/_middleware.js`: the site is private while SITE_PASSWORD is set in the project's settings (a secret).
- `functions/a/[[path]].js`: `/a/<key>` serves `sottovoce-audio/<key>` through the site (R2 binding `AUDIO`, set in
  `wrangler.toml`), edge-cached (caches.default) and browser-cached for a year (`immutable`; JSON for 5 min), with byte
  ranges. On the site the app takes the grand piano from `/a/piano/` (grandPiano.ts: GRAND_BASE), elsewhere from r2.dev.
  `wrangler.toml` makes the file the source of the project's bindings on every deploy (secrets stay as set).
  Deploy (from the folder holding wrangler.toml and functions/):
  `npx wrangler pages deploy <assembled dir> --project-name sottovoce --branch main`.
- R2 `sottovoce-masters` (private): Pianoteq masters (FLAC). R2 `sottovoce-audio` (public, r2.dev): the app's
  compressed audio, e.g. `piano/<editionId>.m4a` for the grand piano (src/standalone/grandPiano.*), and since v2 the
  grand piano in 10 s chunks: `piano/v2/<eid>/NNN.m4a`, `piano/v2/lines/<eid>/<partKey>/NNN.m4a`, manifests and
  calibration files (scripts/audio/chunk-grand.py).
- Word recordings: the voice packs (src/standalone/voicepacks/*.mp3) are in the artifact's file store on claude.ai
  and, for the website, in `sottovoce-audio/voicepacks/<sha1>.mp3` (voicePack.ts picks by host). When packs change,
  upload the new ones there too.
