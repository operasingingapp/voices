/**
 * Import prepared pieces into the app's content store.
 *
 * Input  (per piece, prepared and reviewed by the editorial team):
 *   content/pieces/<id>/manifest.json   metadata, stable edition id, explicit part→channel mapping,
 *                                       passages, source & licence records
 *   content/pieces/<id>/score.musicxml  corrected MusicXML (notes carry stable id attributes)
 *   content/pieces/<id>/language.json   phrase-aligned libretto, gloss, translation, IPA, audio refs
 *   content/pieces/<id>/audio/*         spoken pronunciation files
 *
 * Output: data/content/<id>/{edition.json, language.json, score.musicxml, audio/*} and catalog.json
 *
 * The import fails loudly on anything the app cannot honour (unmapped staves, measure lengths that
 * do not add up, broken ties, words that do not match the sung syllables).
 *
 *   npx tsx scripts/import-content.ts
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, copyFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { DOMParser, type Element } from "@xmldom/xmldom";
import type {
  CatalogEntry,
  CompiledEdition,
  CompiledLanguage,
  LicenceRecord,
  LyricSyllable,
  MeasureInfo,
  NoteInfo,
  NoteLyric,
  Passage,
  Phrase,
  PlaybackPart,
  Role,
  AudioAsset,
} from "../shared/types";
import { Performance } from "../shared/timeline";

const SRC = process.env.CONTENT_SRC ?? "content/pieces";
const OUT = process.env.CONTENT_OUT ?? "data/content";

interface Manifest {
  editionId: string;
  editionVersion: string;
  title: string;
  subtitle?: string;
  kind: "aria" | "ensemble";
  fixture: boolean;
  fixtureNotice?: string;
  composer: string;
  librettist: string;
  language: string;
  files: { musicxml: string; language: string; audioDir: string };
  roles: Role[];
  partMapping: PlaybackPart[];
  passages: { id: string; label: string; start: string; end: string }[];
  licences: LicenceRecord[];
}

interface LanguageSource {
  editionId: string;
  language: string;
  review: { status: "unreviewed-fixture" | "reviewed"; by?: string; date?: string };
  phrases: {
    id: string;
    role: string;
    verse: number;
    occurrence: number;
    startMeasure: string;
    original: string;
    translation: string;
    ipa: string;
    words: [string, string, string][];
    glossGroups: { words: number[]; gloss: string }[];
    audio: { normal?: Omit<AudioAsset, "speed">; slow?: Omit<AudioAsset, "speed"> };
  }[];
}

class ImportError extends Error {}

const kids = (el: Element, name?: string): Element[] =>
  Array.from(el.childNodes as unknown as ArrayLike<Element>).filter((n) => n.nodeType === 1 && (!name || n.nodeName === name)) as Element[];
const kid = (el: Element, name: string): Element | undefined => kids(el, name)[0];
const txt = (el: Element | undefined): string | undefined => (el ? (el.textContent ?? "").trim() : undefined);
const num = (el: Element | undefined, d = 0): number => (el ? Number(txt(el)) : d);

const STEP: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

function parseScore(xml: string, manifest: Manifest, problems: string[]) {
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  const root = doc.documentElement as unknown as Element;
  if (!root || root.nodeName !== "score-partwise") throw new ImportError("Only partwise MusicXML is supported");

  const partIds = kids(kid(root, "part-list")!, "score-part").map((p) => p.getAttribute("id")!);
  for (const pm of manifest.partMapping) {
    if (!partIds.includes(pm.source.xmlPartId)) problems.push(`mapping '${pm.key}' refers to missing MusicXML part ${pm.source.xmlPartId}`);
  }
  const channels = manifest.partMapping.map((p) => p.channel);
  if (new Set(channels).size !== channels.length) problems.push("two playback parts share a MIDI channel");
  if (channels.includes(9)) problems.push("channel 9 (index 9, GM percussion) must not be used for pitched parts");

  const measures: MeasureInfo[] = [];
  const notes: NoteInfo[] = [];
  const ids = new Set<string>();
  let keySignature = "";

  kids(root, "part").forEach((partEl, partIndex) => {
    const xmlPart = partEl.getAttribute("id")!;
    let divisions = 1;
    let time: [number, number] = [4, 4];
    let fifths = 0; // key signature, for the upper note of a trill
    const vel = new Map<number, number>(); // staff -> velocity
    let startQ = 0;
    kids(partEl, "measure").forEach((mEl, mi) => {
      const number = mEl.getAttribute("number") ?? String(mi + 1);
      let pos = 0;
      let maxPos = 0;
      let lastOnset = 0;
      const info: MeasureInfo =
        partIndex === 0
          ? { idx: mi, number, startQ, durQ: 0, time, tempos: [] }
          : measures[mi] ?? (() => {
              throw new ImportError(`part ${xmlPart} has more measures than the first part`);
            })();
      let noteSeq = 0;
      // accidentals written earlier in this bar ("E5" → -1), which hold until the barline
      const barAlter = new Map<string, number>();
      for (const el of kids(mEl)) {
        switch (el.nodeName) {
          case "attributes": {
            if (kid(el, "divisions")) divisions = num(kid(el, "divisions"));
            if (kid(el, "key")) fifths = num(kid(kid(el, "key")!, "fifths"));
            const t = kid(el, "time");
            if (t) {
              time = [num(kid(t, "beats")), num(kid(t, "beat-type"))];
              if (partIndex === 0) info.time = time;
            }
            const k = kid(el, "key");
            if (k && mi === 0 && partIndex === 0) keySignature = keyName(num(kid(k, "fifths")), txt(kid(k, "mode")) ?? "major");
            break;
          }
          case "direction": {
            // MuseScore places tempo changes that fall inside a rest with <offset>, so honour it,
            // kept inside the bar.
            const offset = kid(el, "offset") ? num(kid(el, "offset")) : 0;
            const q = Math.max(0, pos + offset) / divisions;
            const sound = kid(el, "sound");
            const staff = kid(el, "staff") ? num(kid(el, "staff")) : 0;
            for (const dt of kids(el, "direction-type")) {
              const reh = kid(dt, "rehearsal");
              if (reh && partIndex === 0) info.rehearsal = txt(reh);
              const words = kid(dt, "words");
              if (words && partIndex === 0 && !sound?.getAttribute("tempo")) (info.words ??= []).push({ q, text: txt(words)! });
              // the edition's own sustain-pedal marks (Ped. … *), kept for playback
              const pedal = kid(dt, "pedal");
              const type = pedal?.getAttribute("type");
              if (type === "start" || type === "stop" || type === "change") {
                const mapping = manifest.partMapping.find(
                  (p) => p.source.xmlPartId === xmlPart && (!staff || !p.source.staves || p.source.staves.includes(staff)),
                );
                if (mapping) (info.pedals ??= []).push({ q, part: mapping.key, type });
              }
            }
            if (sound) handleSound(sound, q, staff);
            break;
          }
          case "sound":
            handleSound(el, pos / divisions, 0);
            break;
          case "backup":
            pos -= num(kid(el, "duration"));
            break;
          case "forward":
            pos += num(kid(el, "duration"));
            maxPos = Math.max(maxPos, pos);
            break;
          case "barline": {
            if (partIndex !== 0) break;
            const rep = kid(el, "repeat");
            if (rep?.getAttribute("direction") === "forward") info.repeatStart = true;
            if (rep?.getAttribute("direction") === "backward") info.repeatEnd = { times: Number(rep.getAttribute("times") ?? 2) };
            const end = kid(el, "ending");
            if (end)
              (info.endings ??= []).push({
                numbers: (end.getAttribute("number") ?? "1").split(/[,\s]+/).map(Number),
                type: end.getAttribute("type") as "start" | "stop" | "discontinue",
              });
            break;
          }
          case "note": {
            if (kid(el, "grace") || kid(el, "cue")) break;
            const dur = num(kid(el, "duration"));
            const isChord = !!kid(el, "chord");
            const onset = isChord ? lastOnset : pos;
            if (!isChord) {
              lastOnset = pos;
              pos += dur;
              maxPos = Math.max(maxPos, pos);
            }
            noteSeq++;
            const pitch = kid(el, "pitch");
            if (!pitch) break; // rest or unpitched
            const staff = kid(el, "staff") ? num(kid(el, "staff")) : 1;
            const voice = txt(kid(el, "voice")) ?? "1";
            const mapping = manifest.partMapping.find(
              (p) => p.source.xmlPartId === xmlPart && (!p.source.staves || p.source.staves.includes(staff)),
            );
            if (!mapping) {
              problems.push(`note in part ${xmlPart} staff ${staff} (m. ${number}) has no playback mapping`);
              break;
            }
            const id = el.getAttribute("id") || `${xmlPart}-m${number}-s${staff}-g${noteSeq}`;
            if (ids.has(id)) problems.push(`duplicate note id ${id}`);
            ids.add(id);
            const midi = (num(kid(pitch, "octave")) + 1) * 12 + STEP[txt(kid(pitch, "step"))!] + num(kid(pitch, "alter"), 0);
            barAlter.set(`${txt(kid(pitch, "step"))}${num(kid(pitch, "octave"))}`, num(kid(pitch, "alter"), 0));
            // a trill alternates with the next note up the scale: the key's, or as altered earlier in the bar, or as
            // marked over the trill (an accidental-mark)
            const orn = kids(el, "notations").flatMap((n) => kids(n, "ornaments"));
            const trillEl = orn.find((o) => kid(o, "trill-mark"));
            let trill: { upper: number } | undefined;
            if (trillEl) {
              const order = ["C", "D", "E", "F", "G", "A", "B"];
              const st = txt(kid(pitch, "step"))!;
              const i = order.indexOf(st);
              const upStep = order[(i + 1) % 7];
              const upOct = num(kid(pitch, "octave")) + (i === 6 ? 1 : 0);
              const sharps = ["F", "C", "G", "D", "A", "E", "B"];
              let alter = fifths > 0 && sharps.slice(0, fifths).includes(upStep) ? 1 : fifths < 0 && sharps.slice(7 + fifths).includes(upStep) ? -1 : 0;
              if (barAlter.has(`${upStep}${upOct}`)) alter = barAlter.get(`${upStep}${upOct}`)!;
              const mark = txt(kid(trillEl, "accidental-mark"));
              if (mark) alter = { sharp: 1, natural: 0, flat: -1, "double-sharp": 2, "flat-flat": -2 }[mark] ?? alter;
              trill = { upper: (upOct + 1) * 12 + STEP[upStep] + alter };
            }
            const ties = kids(el, "tie").map((t) => t.getAttribute("type"));
            const lyrics: NoteLyric[] = kids(el, "lyric").map((ly) => {
              const syllables: LyricSyllable[] = [];
              let syl: LyricSyllable["syllabic"] = "single";
              for (const c of kids(ly)) {
                if (c.nodeName === "syllabic") syl = txt(c) as LyricSyllable["syllabic"];
                if (c.nodeName === "text") {
                  syllables.push({ text: txt(c) ?? "", syllabic: syl });
                  syl = "single";
                }
              }
              return { verse: Number(ly.getAttribute("number") ?? 1), syllables, ...(kid(ly, "extend") ? { extend: true } : {}) };
            });
            const fermata = !!kids(el, "notations").some((n) => kid(n, "fermata"));
            const tremEl = kids(el, "notations")
              .flatMap((n) => kids(n, "ornaments"))
              .map((o) => kid(o, "tremolo"))
              .find((t) => !!t);
            const tremType = tremEl?.getAttribute("type");
            const tremolo = tremEl
              ? {
                  type: (tremType === "start" || tremType === "stop" ? tremType : "single") as "single" | "start" | "stop",
                  marks: Number(txt(tremEl) ?? 3) || 3,
                }
              : undefined;
            notes.push({
              id,
              part: mapping.key,
              xmlPart,
              staff,
              voice,
              m: mi,
              q: onset / divisions,
              dur: dur / divisions,
              midi,
              vel: vel.get(staff) ?? vel.get(0) ?? 72,
              tieStart: ties.includes("start"),
              tieStop: ties.includes("stop"),
              ...(fermata ? { fermata } : {}),
              ...(tremolo ? { tremolo } : {}),
              ...(trill ? { trill } : {}),
              ...(lyrics.length ? { lyrics } : {}),
            });
            break;
          }
        }
      }
      const durQ = maxPos / divisions;
      const expected = (time[0] * 4) / time[1];
      if (partIndex === 0) {
        info.durQ = durQ;
        if (Math.abs(durQ - expected) > 1e-6) problems.push(`m. ${number}: notated length ${durQ} quarters, time signature expects ${expected}`);
        measures.push(info);
        startQ += durQ;
      } else if (Math.abs(info.durQ - durQ) > 1e-6) {
        problems.push(`part ${xmlPart} m. ${number}: length ${durQ} differs from first part (${info.durQ})`);
      }

      function handleSound(sound: Element, q: number, staff: number) {
        const tempo = sound.getAttribute("tempo");
        if (tempo) {
          const words = kids(sound.parentNode as unknown as Element, "direction-type")
            .map((dt) => txt(kid(dt, "words")))
            .find(Boolean);
          const existing = info.tempos.find((t) => Math.abs(t.q - q) < 1e-6);
          if (existing) existing.bpm = Number(tempo);
          else info.tempos.push({ q, bpm: Number(tempo), ...(words ? { text: words } : {}) });
          info.tempos.sort((a, b) => a.q - b.q);
        }
        const dyn = sound.getAttribute("dynamics");
        if (dyn) {
          const v = Math.max(1, Math.min(127, Math.round(Number(dyn) * 0.9)));
          if (staff) vel.set(staff, v);
          else {
            vel.clear();
            vel.set(0, v);
          }
        }
      }
    });
  });

  for (const pm of manifest.partMapping) {
    if (!notes.some((n) => n.part === pm.key)) problems.push(`playback part '${pm.key}' has no notes`);
  }

  // tie consistency: every tie start must be continued by a tie stop on the same pitch where it ends
  const byPart = new Map<string, NoteInfo[]>();
  for (const n of notes) (byPart.get(n.part) ?? byPart.set(n.part, []).get(n.part)!).push(n);
  for (const n of notes.filter((x) => x.tieStart)) {
    const endM = Math.abs(n.q + n.dur - measures[n.m].durQ) < 1e-6 ? n.m + 1 : n.m;
    const endQ = endM === n.m ? n.q + n.dur : 0;
    const cont = byPart.get(n.part)!.find((x) => x.tieStop && x.midi === n.midi && x.m === endM && Math.abs(x.q - endQ) < 1e-6);
    if (!cont) problems.push(`tie from ${n.id} has no matching continuation`);
  }
  return { measures, notes, keySignature };
}

function keyName(fifths: number, mode: string): string {
  const major = ["C♭", "G♭", "D♭", "A♭", "E♭", "B♭", "F", "C", "G", "D", "A", "E", "B", "F♯", "C♯"];
  const minor = ["A♭", "E♭", "B♭", "F", "C", "G", "D", "A", "E", "B", "F♯", "C♯", "G♯", "D♯", "A♯"];
  return `${(mode === "minor" ? minor : major)[fifths + 7]} ${mode}`;
}

const normWord = (s: string) =>
  s
    .normalize("NFC")
    .toLowerCase()
    .replace(/[’`]/g, "'")
    // punctuation, spaces, hyphens, elision ties (‿, _ and SMuFL private-use glyphs such as U+E551)
    .replace(/[.,;:!?«»"“”()—–\-\s‿_-]/g, "");

/** Split printed text after its first `n` matched letters; trailing punctuation stays with the head. */
function splitPrinted(text: string, n: number): [string, string] {
  const chars = [...text];
  let i = 0;
  let got = 0;
  while (i < chars.length && got < n) got += normWord(chars[i++]).length;
  while (i < chars.length && !normWord(chars[i]) && chars[i] !== " ") i++;
  return [chars.slice(0, i).join(""), chars.slice(i).join("").trim()];
}

/** Align one phrase's words to the sung syllables of its role, returning note ids per word. */
function alignPhrase(
  ph: LanguageSource["phrases"][number],
  partKey: string,
  edition: { measures: MeasureInfo[]; notes: NoteInfo[] },
  problems: string[],
): { wordNotes: string[][]; syllables: { noteId: string; text: string; word: number }[]; start: { m: number; q: number }; end: { m: number; q: number } } | null {
  const startM = edition.measures.findIndex((m) => m.number === ph.startMeasure);
  if (startM < 0) {
    problems.push(`phrase ${ph.id}: measure ${ph.startMeasure} not found`);
    return null;
  }
  // single melodic line: one entry per onset (chord notes collapse onto the first)
  const line = edition.notes
    .filter((n) => n.part === partKey)
    .sort((a, b) => a.m - b.m || a.q - b.q)
    .filter((n, i, arr) => i === 0 || !(arr[i - 1].m === n.m && Math.abs(arr[i - 1].q - n.q) < 1e-6));
  const restsBetween = (a: NoteInfo, b: NoteInfo) => {
    const aEnd = edition.measures[a.m].startQ + a.q + a.dur;
    const bStart = edition.measures[b.m].startQ + b.q;
    return bStart - aEnd > 1e-6;
  };
  const lyricFor = (n: NoteInfo) => n.lyrics?.find((l) => l.verse === ph.verse);
  // A phrase may begin mid-bar (e.g. on a pickup after the previous phrase's last word):
  // try every word start in the starting bar and keep the first clean alignment.
  const candidates = line
    .map((n, idx) => ({ n, idx }))
    .filter(({ n }) => n.m >= startM && lyricFor(n) && ["begin", "single"].includes(lyricFor(n)!.syllables[0].syllabic));
  const firstBar = candidates.length ? candidates[0].n.m : -1;
  const tries = candidates.filter((c) => c.n.m === firstBar || c.n.m === startM);
  if (!tries.length) {
    problems.push(`phrase ${ph.id}: no verse-${ph.verse} lyrics from m. ${ph.startMeasure}`);
    return null;
  }
  let firstProblems: string[] | null = null;
  for (const t of tries) {
    const probs: string[] = [];
    const r = attempt(t.idx, probs);
    if (r && !probs.length) return r;
    firstProblems ??= probs;
  }
  problems.push(...(firstProblems ?? []));
  return null;

  // Words are matched by their letters, not by the syllabic flags: engravers' files often mark
  // elided syllables ("vo'‿an-") or join two words on one note inconsistently.
  function attempt(i0: number, probs: string[]): { wordNotes: string[][]; syllables: { noteId: string; text: string; word: number }[]; start: { m: number; q: number }; end: { m: number; q: number } } | null {
  const targets = ph.words.map(([t]) => normWord(t));
  const wordNotes: string[][] = targets.map(() => []);
  const syllables: { noteId: string; text: string; word: number }[] = [];
  let k = 0; // word being built
  let acc = ""; // letters of word k matched so far
  let lastWord = -1; // word that a following melisma or tied note belongs to
  for (let i = i0; i < line.length; i++) {
    const n = line[i];
    const prevN = line[i - 1];
    if (i > i0 && prevN && restsBetween(prevN, n)) {
      if (k >= targets.length) break;
      if (!acc) lastWord = -1;
    }
    const ly = lyricFor(n);
    // printed syllables: drop SMuFL glyphs and a trailing " -" some engravers type by hand
    const pieces = ly
      ? ly.syllables.map((s) => s.text.replace(/[\uE000-\uF8FF]/g, "").replace(/\s*-\s*$/, "").trim()).filter((t) => normWord(t))
      : [];
    if (!pieces.length) {
      // no syllable for this verse: melisma or tied continuation of the current or last word
      const w = acc ? k : lastWord;
      if (w < 0 || w >= targets.length) {
        if (k >= targets.length) break;
        continue;
      }
      wordNotes[w].push(n.id);
      continue;
    }
    if (k >= targets.length) break; // the next phrase starts here
    for (const piece of pieces) {
      let rest = normWord(piece);
      let printed = piece;
      while (rest) {
        if (k >= targets.length) {
          probs.push(`phrase ${ph.id}: extra sung syllable '${piece}' after the last word`);
          return null;
        }
        const need = targets[k].slice(acc.length);
        if (need.startsWith(rest)) {
          acc += rest;
          rest = "";
          syllables.push({ noteId: n.id, text: printed, word: k });
        } else if (need && rest.startsWith(need)) {
          acc += need; // one sung syllable closes this word and opens the next
          rest = rest.slice(need.length);
          const [head, tail] = splitPrinted(printed, need.length);
          syllables.push({ noteId: n.id, text: head, word: k });
          printed = tail;
        } else {
          probs.push(`phrase ${ph.id}: word ${k + 1} '${ph.words[k][0]}' does not match sung syllables '${acc}${rest}'`);
          return null;
        }
        if (!wordNotes[k].includes(n.id)) wordNotes[k].push(n.id);
        if (acc === targets[k]) {
          lastWord = k;
          k++;
          acc = "";
        }
      }
    }
  }
  if (k < targets.length) {
    probs.push(`phrase ${ph.id}: ${targets.length} words in language.json but only ${k} sung words found`);
    return null;
  }
  const first = edition.notes.find((n) => n.id === wordNotes[0][0])!;
  const lastIds = wordNotes[wordNotes.length - 1];
  const last = edition.notes.find((n) => n.id === lastIds[lastIds.length - 1])!;
  let endM = last.m;
  let endQ = last.q + last.dur;
  if (endQ >= edition.measures[endM].durQ - 1e-6 && endM + 1 < edition.measures.length) {
    endQ = edition.measures[endM].durQ;
  }
  return { wordNotes, syllables, start: { m: first.m, q: first.q }, end: { m: endM, q: endQ } };
  }
}

function importPiece(dir: string) {
  const problems: string[] = [];
  const manifest: Manifest = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8"));
  const xml = readFileSync(join(dir, manifest.files.musicxml), "utf8");
  const langSrcText = readFileSync(join(dir, manifest.files.language), "utf8");
  const langSrc: LanguageSource = JSON.parse(langSrcText);
  if (langSrc.editionId !== manifest.editionId) problems.push("language.json editionId does not match manifest");

  for (const r of manifest.roles)
    if (!manifest.partMapping.some((p) => p.key === r.partKey && p.kind === "voice")) problems.push(`role ${r.id} has no vocal part`);

  const { measures, notes, keySignature } = parseScore(xml, manifest, problems);
  // MusicXML (like MIDI) plays at ♩ = 120 until the first tempo mark
  if (measures.length && !measures[0].tempos.some((t) => t.q === 0)) measures[0].tempos.unshift({ q: 0, bpm: 120 });

  const passages: Passage[] = manifest.passages.map((p) => {
    const s = measures.findIndex((m) => m.number === p.start);
    const e = measures.findIndex((m) => m.number === p.end);
    if (s < 0 || e < s) problems.push(`passage ${p.id} has an invalid range`);
    return { id: p.id, label: p.label, startM: s, endM: e };
  });

  const hash = createHash("sha256").update(xml).update(JSON.stringify(manifest)).update(langSrcText);
  const audioDir = join(dir, manifest.files.audioDir);
  const audioFiles = existsSync(audioDir) ? readdirSync(audioDir).sort() : [];
  for (const f of audioFiles) hash.update(f).update(readFileSync(join(audioDir, f)));
  const contentHash = hash.digest("hex");

  const edition: CompiledEdition = {
    schema: 1,
    editionId: manifest.editionId,
    editionVersion: manifest.editionVersion,
    scoreVersionId: `${manifest.editionId}@${manifest.editionVersion}#${contentHash.slice(0, 10)}`,
    contentHash,
    title: manifest.title,
    subtitle: manifest.subtitle,
    kind: manifest.kind,
    fixture: manifest.fixture,
    fixtureNotice: manifest.fixtureNotice,
    composer: manifest.composer,
    librettist: manifest.librettist,
    language: manifest.language,
    keySignature,
    parts: manifest.partMapping,
    roles: manifest.roles,
    measures,
    notes,
    passages,
    licences: manifest.licences,
    files: { musicxml: "score.musicxml", language: "language.json" },
    importedAt: new Date().toISOString(),
  };

  // language
  const phrases: Phrase[] = [];
  for (const ph of langSrc.phrases) {
    const role = manifest.roles.find((r) => r.id === ph.role);
    if (!role) {
      problems.push(`phrase ${ph.id}: unknown role ${ph.role}`);
      continue;
    }
    const aligned = alignPhrase(ph, role.partKey, edition, problems);
    if (!aligned) continue;
    const missing: string[] = [];
    const audio: Phrase["audio"] = {};
    for (const speed of ["normal", "slow"] as const) {
      const a = ph.audio?.[speed];
      if (!a) {
        missing.push(speed === "normal" ? "Spoken pronunciation has not been prepared yet." : "No slow recording has been prepared.");
        continue;
      }
      if (!audioFiles.includes(a.file)) {
        missing.push(`Audio file ${a.file} is listed but was not delivered.`);
        continue;
      }
      audio[speed] = { ...a, speed };
    }
    if (ph.words.some((w) => !w[1])) missing.push("Word-by-word gloss is incomplete.");
    if (ph.words.some((w) => !w[2]) || !ph.ipa) missing.push("IPA has not been prepared yet.");
    if (!ph.translation) missing.push("Translation has not been prepared yet.");
    phrases.push({
      id: ph.id,
      roleId: ph.role,
      verse: ph.verse,
      occurrence: ph.occurrence,
      startM: aligned.start.m,
      startQ: aligned.start.q,
      endM: aligned.end.m,
      endQ: aligned.end.q,
      original: ph.original,
      words: ph.words.map(([text, gloss, ipa], k) => ({ text, gloss, ipa, noteIds: aligned.wordNotes[k] })),
      syllables: aligned.syllables,
      glossGroups: ph.glossGroups ?? [],
      translation: ph.translation,
      ipa: ph.ipa,
      audio,
      missing,
      review: langSrc.review,
    });
  }
  const language: CompiledLanguage = { schema: 1, editionId: manifest.editionId, language: langSrc.language, phrases };

  if (problems.length) {
    throw new ImportError(`${manifest.editionId}:\n  - ${problems.join("\n  - ")}`);
  }

  const out = join(OUT, manifest.editionId);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(join(out, "audio"), { recursive: true });
  writeFileSync(join(out, "edition.json"), JSON.stringify(edition));
  writeFileSync(join(out, "language.json"), JSON.stringify(language));
  copyFileSync(join(dir, manifest.files.musicxml), join(out, "score.musicxml"));
  for (const f of audioFiles) copyFileSync(join(audioDir, f), join(out, "audio", f));

  const perf = new Performance(edition);
  const entry: CatalogEntry = {
    editionId: edition.editionId,
    editionVersion: edition.editionVersion,
    scoreVersionId: edition.scoreVersionId,
    title: edition.title,
    subtitle: edition.subtitle,
    kind: edition.kind,
    fixture: edition.fixture,
    fixtureNotice: edition.fixtureNotice,
    composer: edition.composer,
    roles: edition.roles,
    measures: measures.length,
    durationSec: Math.round(perf.totalSec),
    hasRepeats: perf.measures.length > measures.length,
    keySignature,
    time: measures[0].time.join("/"),
    languageStatus: {
      phrases: phrases.length,
      withAudio: phrases.filter((p) => p.audio.normal).length,
      reviewed: phrases.filter((p) => p.review.status === "reviewed").length,
    },
  };
  const report = {
    editionId: edition.editionId,
    scoreVersionId: edition.scoreVersionId,
    measures: measures.length,
    performedMeasures: perf.measures.length,
    notes: notes.length,
    soundingEvents: perf.notes.length,
    parts: edition.parts.map((p) => `${p.key} ← ${p.source.xmlPartId}${p.source.staves ? ` staves ${p.source.staves}` : ""} → ch ${p.channel}`),
    phrases: phrases.map((p) => `${p.id} (${p.roleId}) m.${measures[p.startM].number}–${measures[p.endM].number} occ ${p.occurrence}: ${p.words.map((w) => `${w.text}[${w.noteIds.length}]`).join(" ")}${p.missing.length ? `  MISSING: ${p.missing.join(" ")}` : ""}`),
    durationSec: entry.durationSec,
  };
  return { entry, report };
}

function main() {
  mkdirSync(OUT, { recursive: true });
  const dirs = readdirSync(SRC).filter((d) => existsSync(join(SRC, d, "manifest.json")));
  const catalog: CatalogEntry[] = [];
  const reports = [];
  let failed = false;
  for (const d of dirs) {
    try {
      const { entry, report } = importPiece(join(SRC, d));
      catalog.push(entry);
      reports.push(report);
      console.log(`✔ ${entry.editionId}  ${report.scoreVersionId}`);
      for (const p of report.parts) console.log(`    part ${p}`);
      for (const p of report.phrases) console.log(`    phrase ${p}`);
      console.log(`    ${report.measures} measures → ${report.performedMeasures} performed, ${report.notes} notes → ${report.soundingEvents} sounding events, ${report.durationSec}s at score tempo`);
    } catch (e) {
      failed = true;
      console.error(`✘ ${d}: ${(e as Error).message}`);
    }
  }
  writeFileSync(join(OUT, "catalog.json"), JSON.stringify(catalog, null, 2));
  writeFileSync(join(OUT, "import-report.json"), JSON.stringify(reports, null, 2));
  if (failed) process.exit(1);
}

main();
