# Karaoke videos

Work-in-progress tools for the YouTube karaoke videos (run from /home/claude/work/video):
- timing.ts — note and syllable times from the app's own performance (score tempo)
- engrave-part.mjs — the singer's part engraved as pages (Verovio, Leipzig), with note x positions
- frame3.py — builds frame.html: the page, the karaoke line, tip pills, intro and close; `setTime(t)` draws any moment
- render.cjs — draws every frame in Chromium and encodes with the audio; shots.cjs — stills
- thumb.cjs — the thumbnail; collide_all.cjs — engraving collision audit over every piece in the app
