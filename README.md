# Counterpart (MVP)

A tablet-friendly web app for opera singers: learn a role from an interactive score with multitrack playback and language support, then rehearse with an accompanist from **one shared musical position**. A production editor can publish numbered production versions with approved cuts and comments.

> **Content status.** The library contains two short **original development fixtures**, written for this MVP: *Lume di sera* (an aria for soprano and piano) and *Già l'alba chiama* (a terzetto for soprano, tenor, baritone and piano). They are **not genuine repertoire**, and the repertoire requirement is **not** met. The app labels them as fixtures everywhere they appear.

---

## Run it

Requirements: Node.js ≥ 22.13 (the app uses the built-in `node:sqlite`) and npm.

```bash
npm install
npm run setup        # import the prepared content into data/content and create test accounts
npm run dev          # API on :3001 + Vite on :5173  → open http://localhost:5173
```

Production-style run (one port):

```bash
npm run build
npm start            # http://localhost:3000   (set CP_SECURE_COOKIES=1 behind HTTPS)
```

### Test accounts (password `counterpart-demo`)

| Username | Who | Access |
|---|---|---|
| `elena` | Elena Ricci | **Editor** of “Lume di sera — studio production” |
| `sofia` | Sofia Marin | Performer, role **Clara (soprano)** |
| `marco` | Marco Bellini | Performer, **accompanist** |
| `luca` | Luca Ferri | Registered but **not invited** (for testing access control) |

The seed publishes **version 1** of the production: the original edition plus one phrasing comment. Editors can invite more people with single-use links (Production settings → People).

### Demonstration path (≈5 minutes, two browser windows)

1. **Learn alone.** Sign in as `sofia`, choose **Practise** on *Lume di sera*, then choose **Clara only**.
   - Pick the passage “Lume di sera / Vento d'aprile (A), 1st time” and open **Language**: libretto, gloss, translation, IPA, and **Hear spoken / Hear slowly**.
   - **Select bars** → tap m. 5 and m. 6 → **Loop these bars**. Set the tempo to 80%, turn on **Count-in** and press play.
   - In **Mixer**, try **Sing along (mute my line)**. In **My notes**, add a note.
2. **Join the accompanist.** In a second window, sign in as `marco` → Library → *Production settings* → **Start rehearsal** (version 1). In Sofia's window, go to the Library and click **Join rehearsal**.
3. **Follow the shared position.** Marco taps a bar and Sofia's red rehearsal marker lands on the same bar in her own layout. When Marco plays, the marker follows. Sofia can scroll or tap elsewhere to browse, then use **Back to rehearsal position**. Marco can hand control to Sofia from the Rehearsal panel.
4. **Practise the approved cut.** As `elena`, open Production settings and add a cut from m. 13 to m. 16. Try m. 12–13 first to see an unsupported boundary flagged. Publish version 2. The open rehearsal is notified but stays on version 1. Start a new rehearsal on version 2 and play from m. 11 (2nd time): playback goes straight from m. 12 to m. 17.

`npm run demo` records the same scenario automatically. It produces `demo-output/raw/{sofia,marco}/*.webm` and screenshots, and `demo-output/counterpart-demo.mp4` is a side-by-side cut of both devices. Videos have no sound, because the headless browser has no audio device.

### "O mio babbino caro" practice app (no server)

`standalone.html` is a separate practice app for Puccini's aria. It needs no server and no account. It is published as a claude.ai artifact.

- `npm run dev:aria` opens it in the Vite dev server. Run `npm run import` once first.
- `npm run build:aria` writes `dist-standalone/`. The page uses `assets/app.js`, which embeds the score, the piano SoundFont and the spoken-line recordings. It also loads `assets/spessasynth_processor.min.js`.
- Each sung line is shown above its first bar with its Italian text, IPA and translation, plus a speaker button. The words light up as the music reaches them. The Words panel also has a word-by-word gloss and a slow option.
- Speech uses the device's Italian voice when there is one. Otherwise it plays the bundled eSpeak NG recordings, which sound robotic and are placeholders.
- Notes and settings are kept in this browser only.
- The score is an **unverified transcription made from memory and from letter-note sources**. Check it against a printed edition (Ricordi 1918, IMSLP) before you use it to learn the aria. Forzano's libretto is in the public domain in the US but protected in the EU until the end of 2040.

---

## What is implemented

**Practice workspace** (the score fills most of the screen; the language panel and mixer collapse)
- OpenSheetMusicDisplay notation with a **Full score** view and a **selected-role** view. The singer's role view shows only her line; for the piano role, the full score serves as the vocal score.
- Role selection. Entrance **cues**: chips under the score in role view, plus a Cues panel with “what you hear before you come in” and **Play from cue**.
- Play / pause / stop. **Seeking by passage**: every repeat pass is listed separately, e.g. “(A), 2nd time”. Tap any bar to go there.
- **Live tempo** from 40% to 150% without pitch change. **Measure-range loops**, a one-bar **count-in** and optional **auto-scroll**.
- **Mute, solo and volume per part.** What is shown and what is heard are independent: you can hide other voices and still hear them. A “Sing along” preset mutes your own line.
- The yellow **highlighter** cursor and bar wash are drawn from the audio clock. The location readout shows bar, beat, repeat pass and passage, and says whether that is your playback, your cursor or the rehearsal position.

**Language panel**, linked to the phrase at the current position for the selected role:
- Original text, word-by-word gloss with **gloss groups** for phrases that don't translate word for word, natural translation and IPA.
- The word on the sounding note is highlighted. Words can span several notes (melismas), and several words can share one note (elisions such as *dolce‿e*).
- Verse 2 of a repeated passage is shown on the 2nd pass. In ensembles, the other voices' simultaneous text is shown too.
- Spoken pronunciation at normal and slow speed. Missing material is shown honestly: “Spoken pronunciation has not been prepared for this phrase yet”, or “no slow recording; plays the normal recording at 70% with pitch kept”.

**Private notes.** Each note is attached to a bar and beat and stored on the server. Only its author can read it; editors get 404. A note can apply to one production or to every practice of the piece.

**Shared rehearsal** (a mode of the same workspace):
- Private sessions for chosen production members, pinned to one published version.
- One leader, and control can be handed over. Only the leader's device produces sound; everyone else follows.
- The shared marker is sent as **musical identifiers** `{measure index, beat offset, repeat occurrence, note id}` and validated by the server against the pinned version. Each client places it in its own layout.
- While the leader plays, followers extrapolate briefly from the reported speed.
- “Follow rehearsal” toggle, independent browsing and **Back to rehearsal position**. Shared loop boundaries.
- Connection, leader and audio-device status. A disconnected client shows “not live”: dashed grey marker, banner and readout.

**Production workspace**
- Choose one of the prepared pieces, invite people with single-use links and assign roles (editor, or performer/accompanist).
- Whole-measure **cuts** with validation. Ties or words crossing a boundary, partial repeats and partial endings are **flagged for editorial correction** and block publishing. Tempo/metre changes inside a cut and partly cut phrases produce warnings.
- Shared **passage comments**. Performers can file **correction requests**; libretto and notation are never edited directly.
- **Publish** a numbered version with a change summary. Published versions are immutable: there is no update path in the code, and SQLite triggers abort any `UPDATE`/`DELETE`. Later edits stay in the draft.
- New releases are announced in active sessions and practice screens without changing them.
- Cuts appear in the score as blue-pencil hatching with the traditional **vi–** … **–de** brackets, and every part skips them.

**Access.** Real accounts with scrypt-hashed passwords, httpOnly SameSite cookies, an origin check on writes and a sign-in rate limit. Every production, rehearsal, content and notes endpoint, and the WebSocket join, checks permissions on the server. Unknown production and “not a member” return the same 404.

---

## Architecture

```
content/pieces/<id>/            prepared by the editorial team
  manifest.json                 stable edition id/version, explicit part→channel mapping, roles, passages, licences
  score.musicxml                corrected MusicXML; every <note> has a stable id
  language.json                 phrases: words [text, gloss, IPA], gloss groups, translation, IPA, audio refs, review status
  audio/*.mp3                   spoken pronunciations
        │  scripts/import-content.ts  (validates; fails loudly)
        ▼
data/content/<id>/edition.json  measures, tempo marks, repeats, notes (onset/duration/pitch/ties/lyrics), mapping
data/content/<id>/language.json phrases aligned to note ids (melismas and elisions resolved)

shared/timeline.ts   Performance: unfolds repeats into occurrences, applies cuts, tempo map,
                     sounding note events (ties merged only when the tie really continues), perfQ ↔ seconds,
                     musical position ↔ timeline
shared/cuts.ts       cut validation          shared/cues.ts   entrances and cues
src/audio/engine.ts  scheduler on ONE clock (AudioContext.currentTime) with 120 ms look-ahead
src/audio/spessaPort.ts  SpessaSynth AudioWorklet + piano-only SoundFont
src/score/           OSMD rendering + layout index (musical position ↔ this client's pixels)
server/              Express 5 + ws + node:sqlite: auth, productions, versions, notes, realtime sessions
```

**One clock.** The engine keeps *anchors* `(clock time, timeline position, tempo factor)`. Every note-on and note-off, count-in click and loop jump is scheduled from the current anchor. The cursor position is computed from the same anchors at the time actually reaching the speakers (`getOutputTimestamp`).
- A tempo change adds an anchor at the scheduling frontier, so audio and highlight stay consistent and all parts share it.
- A loop wrap adds an anchor at the loop end. Everything still sounding is released there, and held notes are re-attacked at the loop start.
- SpessaSynth cannot cancel events it has already queued. So stop, pause and seek fade the master gain, schedule a timed “all sound off” after the last queued event, and start new audio only after that point.
- Overlapping notes of the same pitch on one channel are reference-counted, so one note's release cannot cut another short.

**Explicit mapping.** MusicXML part IDs and staves map to app part keys and synth channels in the manifest. The fixtures deliberately use channel orders that differ from the part order; the importer rejects unmapped staves and duplicate or percussion channels. Playback events are derived from the MusicXML at import. A separate MIDI file is not required (see gaps below).

**Repeats.** Each performed bar knows its notated measure and its **occurrence**. Positions, loops, language verses and the shared marker carry the occurrence, so “m. 9, 2nd time” is unambiguous.

---

## Libraries and licences (checked during the build)

| Component | Version | Licence | Notes |
|---|---|---|---|
| OpenSheetMusicDisplay | 2.2.1 | BSD-3-Clause | Notation; layout index built from its graphical model |
| spessasynth_lib / spessasynth_core | 4.3.14 / 4.3.22 | Apache-2.0 | AudioWorklet synth; timed events via `{ time }` verified in headless Chromium |
| GeneralUser GS (piano only) | 2.0.3, commit `684543d` | GeneralUser GS License v2.0 (use and modification in software allowed) | Cut down to Acoustic Grand Piano (2.2 MB) by `scripts/build-soundbank.ts`. Provenance record: `public/soundbank/counterpart-piano.licence.json`. **Caveat:** the author says the origin of some samples can't be confirmed with certainty, so review before commercial release. |
| React 18, Express 5, ws 8, Vite 8, Vitest 5, Playwright 1.63 | | MIT / Apache-2.0 | |
| Charis SIL, Atkinson Hyperlegible Next (via @fontsource) | | OFL-1.1 | Charis is used for libretto and IPA because of its full IPA coverage |
| eSpeak NG (espeakng-loader 0.2.4) | 1.52 | GPL-3.0 | Used **offline only** to create placeholder audio; not shipped with the app |

**Substitutions.** None to the preferred components. SQLite comes from Node's built-in `node:sqlite`, so there are no native builds; it is still marked experimental in Node 22. Playback events are derived from MusicXML rather than a separate MIDI file, which the brief allows.

---

## Tests and results

```bash
npm test             # unit + API tests (Vitest)       → 29 passed
npm run test:e2e     # browser tests (Playwright, fresh seeded server on :3100) → 9 passed (rehearsal test also repeated 3× without failures)
npm run typecheck    # clean
```

All results below come from **headless Chromium** with the real synthesiser. Audio was checked by measuring the synthesised signal with Web Audio analysers; nobody listened to it.

| Completion check | Where verified | Measured result (latest run) |
|---|---|---|
| Each part can be muted or soloed independently | e2e `practice` · unit `engine` | Per-channel RMS. All 4 parts were audible (0.010–0.018). Tenor muted: tenor **0**, others audible. Soprano soloed: piano, baritone and tenor **0**. With only Clara's line shown, all 4 parts were still audible. |
| Tempo changes preserve pitch and synchronisation | e2e `practice` · unit `engine` | Tenor B♭3 measured at **232.83 Hz at 100% and at 50%** (FFT bins are 1.35 Hz wide). After live tempo changes, notes from different parts at the same musical position had **0 timing mismatches**. |
| Stop, seek, cuts and loops leave no stuck notes | e2e `practice` · unit `engine`, `timeline` | 0 synth voices and silent output after stop, after seek-while-playing then pause, and after a 2-bar loop ending in a held chord had wrapped (at most 15 voices while looping). Ties into a cut end at the barline. |
| Highlighting follows audible playback | e2e `practice` · unit `engine` | 10 samples: the cursor always sat between the last audibly started note and the next scheduled one, inside the right bar's box. |
| Language content matches the selected phrase | e2e `practice` | Passes 1 and 2 of section A show verse 1 and verse 2 respectively. B shows its gloss groups. The sounding word is highlighted. Davide's missing recording is reported honestly. |
| Two sessions follow the same position despite different layouts | e2e `rehearsal` | Layouts: accompanist 7 systems, singer (portrait, own line) 4 systems. A tap on m. 9 lands inside the singer's own m. 9 box. While playing, the follower stayed within **0.02–0.17 quarter notes** of the leader (under 0.15 s at ♩ = 66). |
| Followers can browse independently and return | e2e `rehearsal` | Tapping or scrolling detaches the follower; “Back to rehearsal position” returns to the shared bar. The leader is unaffected. |
| A disconnected session is not presented as live | e2e `rehearsal` · unit `api` | With the network relay cut: the singer saw “Connection lost… not live”, a dashed marker and a stale readout, and the accompanist saw her as “not connected”. After reconnecting she caught up with a move made while she was offline. |
| Production cuts affect every part consistently | e2e `production` · unit `timeline`, `engine` | Bars heard: 11 → 12 → **17** → 18. No note-on from any part inside m. 13–16. Piano and soprano both enter at m. 17. |
| Publishing an update does not mutate an active rehearsal | e2e `rehearsal` · unit `api` | Both participants were notified, the session stayed on version 1 (28 performed bars), and the server kept accepting positions in bars that version 2 cuts. |
| Private notes remain private and persist | e2e `practice` · unit `api` | The note survived a reload. Elena saw nothing, and her edit/delete attempts returned 404. |
| Uninvited users cannot access the production | e2e `production` · unit `api` | 404 for the page, versions, rehearsals and comments. WebSocket join refused. A used invitation link cannot be reused. |

Five real bugs were found and fixed by these tests:
- The leader's position reports were being reset by re-renders.
- Re-applying an unchanged shared loop moved the leader's cursor.
- Vocal lines were 30–40 dB too quiet because of a filter setting.
- Repeat passes were merged in the passage list.
- Invalid MusicXML `<direction>` elements made OSMD drop the last two bars.

---

## Missing assets and unfinished work

- **Repertoire.** The two pieces are original fixtures. Real arias and ensembles with corrected MusicXML, matching language material and licence records still need to be prepared and imported. The pipeline and manifest format are ready for them.
- **Pronunciation recordings.** No ElevenLabs recordings exist. Clara's phrases have clearly labelled **placeholder machine speech (eSpeak NG)**: the aria has normal and slow versions, and the terzetto has normal only. Davide's and Ettore's phrases have **no audio**, which shows the missing-asset state. To replace a placeholder, drop the reviewed file into `audio/` and set `"kind": "recorded", "reviewed": true`.
- **Language review.** All Italian text, glosses, translations and IPA were written for the fixtures and are marked *unreviewed*. No diction coach or Italian speaker has checked them.
- **No device testing and no expert musical review.** Everything was tested in headless Chromium on Linux only. Nothing has run on an iPad or in Safari, on a phone or with real speakers, and no musician has judged the sound or the notation. Two specific risks:
  - iOS can silence Web Audio when the hardware mute switch is on.
  - Real-world latency between the two devices hasn't been measured on real networks.
- **Sound bank provenance.** Fine for development. Before release, review the sample provenance or swap in a bank with fully documented sources, e.g. Salamander Grand Piano (CC-BY).
- **Not implemented (by design for the MVP):**
  - payments, public uploads, music recognition, audio/video calls and live-singing tracking;
  - email delivery, password reset and an admin UI;
  - comment threads or replies;
  - per-participant cursors;
  - synchronised audio on several devices.
- **Known limits:**
  - MIDI files aren't imported; playback is derived from MusicXML.
  - Partly cut repeats and first/second endings are flagged rather than supported. Endings are implemented in the timeline but not exercised by any fixture.
  - Follower extrapolation is capped at 1.2 s.
  - The JavaScript bundle is 1.85 MB (no code splitting).
  - Accessibility has keyboard play/pause, labelled controls and text labels alongside colour, but has not been formally audited.

---

## Repository map

```
content/      prepared pieces (manifest, MusicXML, language, audio) and vendor licence
data/content/ imported content (generated by `npm run import`)
public/soundbank/ piano SoundFont + licence record
scripts/      compose-fixtures.ts (fixture MusicXML), import-content.ts, build-soundbank.ts,
              fetch-generaluser-gs.sh, tts-placeholders.py
server/       app.ts (REST), realtime.ts (WebSocket sessions), productions.ts, auth.ts, db.ts, seed.ts
shared/       types, timeline, cuts, cues (used by client, server and tests)
src/          React client: pages/, workspace/ panels, score/ (OSMD + layout index), audio/ (engine)
tests/        unit/ (Vitest), e2e/ (Playwright), demo/ (recorded walkthrough)
```
