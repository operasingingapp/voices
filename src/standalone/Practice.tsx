import { packedUrl, preloadVoicePacks } from "./voicePack";
import { MAX_FACTOR, MIN_FACTOR, stepFactor } from "./metronome";
import { foldIpa, foldTranslation, trailingRepeat } from "./repeat";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as RPointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Story, storyOf } from "./synopses";
import { Performance, beatInfo, type PerfMeasure } from "../../shared/timeline";
import type { CompiledEdition, CompiledLanguage } from "../../shared/types";
import { usePlayback } from "../audio/usePlayback";
import type { LineInstrument } from "../audio/samplerPort";
import { useLocalSetting, useTicker } from "../hooks";
import { ScoreView, stripCrop, type CursorReading, type Flag, type MarkerReading } from "../score/ScoreView";
import type { Lane, ScoreLayout } from "../score/layout";
import { ART_TONES, PORTRAITS } from "./opera-extra";
import { decorate, syllableRanges, type Deco, type SylProgress } from "./syllables";
import { buildTips, type TipLine } from "./tips";
import { onVoicesChanged, setSpeechLanguage, speak, stopSpeaking, voiceInfo } from "./speech";
import { pieceData, type PieceInfo } from "./pieces";
import { Avatar } from "./flow";
import { useBackToClose } from "./nav";
import { OPERAS } from "./operas";
import { lineSounds, resolveLine, type LineChoice } from "./settings";
import { allNotes, MARKS, noteLabel, notesKey, NOTE_KEY_RE, type MarkId, type Note } from "./notes";
import { annotateXml, circled, engravePages, fontFaceCss, openInTab, printDocument, printHtml } from "../score/printScore";

/*
 * The piece on screen. Only one practice screen is open at a time, so the piece's data lives here, set by
 * Practice (below) before its screen renders; the screen is keyed by piece, so everything else starts afresh.
 */
let pieceId = "";
/** in an ensemble, the character you sing (a role id in the piece); the other voices are your partners */
let roleId = "";
let roleVoiceType = "";
/** PORTRAITS key of the character you sing */
let portraitKey = "";
let otherVoices: CompiledEdition["parts"] = [];
/** every sung part, and the score's parts (xml ids) in the file's order */
let voiceParts: CompiledEdition["parts"] = [];
let xmlOrder: string[] = [];
let info: PieceInfo;
let edition: CompiledEdition;
let language: CompiledLanguage;
const LANGUAGE_NAMES: Record<string, string> = { it: "Italian", de: "German", fr: "French", ru: "Russian", cs: "Czech", es: "Spanish", en: "English", la: "Latin" };
let ORIGINAL = "Original";
/** the language code of the piece on screen, for lang attributes and speech */
let LANG = "it";
/** Typographic apostrophes for display: l’anello, vo’, I’d (the data keeps plain ones). */
const curly = (t: string) => t.replace(/'/g, "\u2019");

// Offline placeholder recordings, used only when the device has no voice for the piece's language (separate
// files, fetched only when played: inlined, they added a megabyte to the app's first download).
const audioModules = import.meta.glob(["../../data/content/*/audio/*.mp3", "!../../data/content/cp-fx-*/**"], {
  query: "?url",
  import: "default",
  eager: true,
}) as Record<string, string>;
const audioUrl = (file?: string) => (file ? audioModules[`../../data/content/${pieceId}/audio/${file}`] : undefined);

// Recorded singers: a sung line rendered from the score at the score's tempo (recordings/<piece>/<part>.mp3) and
// at 70% (<part>-70.mp3), with where each of its notes starts in the recording (.json, scripts/voice/align.py).
// Each is fetched the first time it is sung.
const recordingFiles = import.meta.glob("./recordings/*/*.mp3", { query: "?url", import: "default", eager: true }) as Record<string, string>;
const recordingMaps = import.meta.glob("./recordings/*/*.json", { import: "default", eager: true }) as Record<string, { onsets: Record<string, number> }>;
const recordingsOf = (partKey: string) =>
  Object.entries(recordingFiles).flatMap(([path, url]) => {
    const m = new RegExp(`^\\./recordings/${pieceId}/${partKey}(?:-(\\d+))?\\.mp3$`).exec(path);
    const map = m && recordingMaps[path.replace(/\.mp3$/, ".json")];
    return m && map ? [{ tempo: m[1] ? Number(m[1]) / 100 : 1, url, onsets: map.onsets }] : [];
  });
const sungOf = (partKey: string) => recordingsOf(partKey).length > 0;
/** the speeds a recorded singer offers: those it was rendered at (re-timing further would be heard) */
const SUNG_TEMPOS = [0.7, 1];

// The real voice: recordings made with ElevenLabs (scripts/voices.ts), the voice set in voice.config.json.
import voiceConfig from "../../voice.config.json";
interface VoiceManifest {
  voiceId: string;
  voiceName?: string;
  clips: Record<string, { text: string; file: string; words?: [number, number][]; sung?: { file: string; words: [number, number][] } }>;
  words: Record<string, string>;
}
let voices: VoiceManifest[] = [];
const defaultVoiceId = (voiceConfig as { voiceId: string }).voiceId;
/** the voice chosen for the piece's language in voice.config.json (Italian: voiceId; others: languages.<code>) */
const languageVoiceId = (voiceType = roleVoiceType) => {
  const cfg = voiceConfig as { languages?: Record<string, { voiceId?: string }>; male?: Record<string, { voiceId?: string }> };
  // a piece sung by a man uses the language's man's voice, where one is set
  const male = /tenor|baritone|bass|countertenor/i.test(voiceType) ? cfg.male?.[LANG]?.voiceId : undefined;
  return male || (LANG === "it" ? defaultVoiceId : (cfg.languages?.[LANG]?.voiceId ?? ""));
};
const voiceById = (id: string) =>
  voices.find((m) => m.voiceId === id) ?? voices.find((m) => m.voiceId === languageVoiceId()) ?? voices[0] ?? null;
const voiceLabel = (m: VoiceManifest) => (m.voiceName ?? "Voice").split(" - ")[0];
const voiceUrl = (file?: string) => packedUrl(file);
const plainText = (t: string) => t.replace(/[’‘]/g, "'").replace(/\s+/g, " ").trim();
const wordKey = (t: string) => plainText(t).replace(/[.,;:!?«»“”"()—–-]+/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
/** the recorded line (a repeated line uses the first recording of the same words) */
function lineClip(voice: VoiceManifest | null, id: string, original: string) {
  if (!voice) return null;
  const c = voice.clips[id] ?? Object.entries(voice.clips).find(([k, v]) => !k.endsWith("-slow") && !k.startsWith("join") && v.text === plainText(original))?.[1];
  if (!c) return null;
  // always the line as the voice spoke it: never stretched to the music's rhythm (that sounds robotic); the tortoise
  // plays the same recording slower
  const file = c.file;
  const words = c.words;
  return { normal: voiceUrl(file), slow: voiceUrl(file), words, slowWords: words };
}
const wordUrlIn = (voice: VoiceManifest | null, text: string) => (voice ? voiceUrl(voice.words[wordKey(text)]) : undefined);

let voicePart: CompiledEdition["parts"][number];
let pianoPart: CompiledEdition["parts"][number];

/**
 * Display-only preparation of the supplied engraving (the file itself stays unchanged):
 * - MuseScore exported its hidden playback tempo changes (e.g. "♩ = 79" plus ".4") as visible marks;
 *   they drive playback through edition.json and are not drawn.
 * - The voice part's tempo and rehearsal marks move to the bar box, so the full sung line can sit
 *   right above the notes.
 * - Elided syllables arrive as separate <text> pieces joined by the SMuFL glyph U+E551, which the
 *   renderer cannot draw; they are shown as one syllable with the undertie ‿.
 */
function prepareForDisplay(xml: string): string {
  try {
    const doc = new DOMParser().parseFromString(xml, "application/xml");
    if (doc.getElementsByTagName("parsererror").length) return xml;
    for (const dir of Array.from(doc.getElementsByTagName("direction"))) {
      const types = Array.from(dir.children).filter((c) => c.nodeName === "direction-type");
      const playbackOnly =
        types.length > 0 &&
        types.every((dt) =>
          Array.from(dt.children).every((c) => c.nodeName === "metronome" || (c.nodeName === "words" && /^\s*\.\d+\s*$/.test(c.textContent ?? ""))),
        );
      // any sung part (an ensemble's parts can be put in any order, so none keeps marks above it)
      const inVoice = voiceParts.some((v) => v.source.xmlPartId === dir.closest("part")?.getAttribute("id"));
      const tempoMark =
        !!Array.from(dir.children).find((c) => c.nodeName === "sound")?.getAttribute("tempo") ||
        types.some((dt) => Array.from(dt.children).some((c) => c.nodeName === "rehearsal" || c.nodeName === "metronome"));
      // stage directions under the voice ("Lauretta (in ginocchio…)") would push the syllables down along the whole line
      const words = types.flatMap((dt) => Array.from(dt.children)).map((c) => (c.nodeName === "words" ? (c.textContent ?? "").trim() : null));
      const stageDirection = inVoice && words.length > 0 && words.every((w) => w !== null && (w.length > 20 || /^[A-Z][a-z]+$/.test(w)));
      // the number's heading printed over the first staff ("Nr. 10. Terzettino"): the title says it already
      const heading = inVoice && words.length > 0 && words.every((w) => w !== null && /^(Nr|No|N)\.?\s*\d+/.test(w));
      // piano pedal brackets: a pianist's marking; drawn far below the bass staff they cost the whole line
      // its size, and a singer reading along does not use them
      const pedalOnly = types.length > 0 && types.every((dt) => Array.from(dt.children).every((c) => c.nodeName === "pedal"));
      if (playbackOnly || (inVoice && tempoMark) || stageDirection || heading || pedalOnly) dir.parentNode?.removeChild(dir);
    }
    for (const lyric of Array.from(doc.getElementsByTagName("lyric"))) {
      const texts = Array.from(lyric.children).filter((c) => c.nodeName === "text");
      // typographic apostrophes, as in print: l’anello, vo’
      for (const t of texts) t.textContent = (t.textContent ?? "").replace(/'/g, "\u2019");
      // melisma lines: drawn far too long by the renderer (even under "sò…?", like a crossing-out), and the
      // highlighted syllables already show what is held, so they are left off
      for (const e of Array.from(lyric.children).filter((c) => c.nodeName === "extend")) lyric.removeChild(e);
      if (texts.length < 2) continue;
      // two syllables on one note are joined by the undertie (vo’‿an, re‿in); MuseScore's elision glyph is dropped
      texts[0].textContent = texts
        .map((t) => (t.textContent ?? "").replace(/[\uE551\u203F]/g, "").trim())
        .filter(Boolean)
        // hair spaces keep the undertie between the two syllables instead of under their letters
        .join("\u200A\u203F\u200A");
      for (const t of texts.slice(1)) lyric.removeChild(t);
      for (const e of Array.from(lyric.children).filter((c) => c.nodeName === "elision")) lyric.removeChild(e);
    }
    return new XMLSerializer().serializeToString(doc);
  } catch {
    return xml;
  }
}
let displayXml = "";

/** The score with its parts in another order (top to bottom), for an ensemble arranged the way you want to read it. */
function reorderXml(xml: string, order: string[]): string {
  try {
    const doc = new DOMParser().parseFromString(xml, "application/xml");
    const list = doc.getElementsByTagName("part-list")[0];
    if (!list) return xml;
    // brackets joining parts would no longer match the new order
    for (const g of Array.from(list.getElementsByTagName("part-group"))) g.parentNode?.removeChild(g);
    const sps = Array.from(list.getElementsByTagName("score-part"));
    for (const id of order) {
      const el = sps.find((x) => x.getAttribute("id") === id);
      if (el) list.appendChild(el);
    }
    const root = doc.documentElement;
    const parts = Array.from(root.children).filter((c) => c.nodeName === "part");
    for (const id of order) {
      const el = parts.find((x) => x.getAttribute("id") === id);
      if (el) root.appendChild(el);
    }
    return new XMLSerializer().serializeToString(doc);
  } catch {
    return xml;
  }
}

/** Tempo words in force in each bar ("Andantino ingenuo"), shown in the bar box. */
let tempoWords: string[] = [];
const tempoWordsOf = (edition: CompiledEdition): string[] => {
  let cur = "";
  return edition.measures.map((m) => {
    for (const t of m.tempos) if (t.text && !/^\s*\.\d+\s*$/.test(t.text)) cur = t.text.trim();
    return cur;
  });
};

/** add notes from an export file; a note already here (same id) is kept as it is. Returns how many were added. */
function mergeNotes(file: unknown): number {
  const f = file as { app?: string; notes?: Record<string, Note[]> };
  if (!f || f.app !== "sottovoce-notes" || typeof f.notes !== "object") throw new Error("not a notes file");
  let added = 0;
  for (const [k, list] of Object.entries(f.notes ?? {})) {
    if (!NOTE_KEY_RE.test(k) || !Array.isArray(list)) continue;
    let cur: Note[] = [];
    try {
      cur = JSON.parse(localStorage.getItem(k) ?? "[]");
    } catch {
      cur = [];
    }
    const have = new Set(cur.map((n) => n.id));
    for (const n of list) {
      if (!n || typeof n.id !== "string" || typeof n.m !== "number" || typeof n.q !== "number" || have.has(n.id)) continue;
      cur.push({ id: n.id, m: n.m, q: n.q, body: String(n.body ?? ""), at: String(n.at ?? new Date().toISOString()), ...(n.mark ? { mark: n.mark } : {}) });
      added++;
    }
    cur.sort((a, b) => a.m - b.m || a.q - b.q);
    localStorage.setItem(k, JSON.stringify(cur));
  }
  return added;
}
/** offer the file to save: through the app's own download prompt when the page runs inside Claude, else a plain download link */
async function saveFile(filename: string, text: string) {
  const w = window as unknown as { claude?: { use: (n: string) => Promise<{ save: (o: { filename: string; data: Blob }) => Promise<unknown> } | null> } };
  const dl = w.claude ? await w.claude.use("downloads").catch(() => null) : null;
  const blob = new Blob([text], { type: "application/json" });
  if (dl) return dl.save({ filename, data: blob });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
let NOTES_KEY = "cp:babbino:notes";

const displayCache = new Map<string, string>();
/** Make `id` the piece on screen (see the top of this file). */
function loadPiece(id: string, character?: string) {
  if (pieceId === id && (!character || roleId === character)) return;
  const d = pieceData(id);
  pieceId = id;
  info = d.info;
  edition = d.edition;
  // your part: the voice of the character you sing (an ensemble has several), the others sing with you
  const vparts = edition.parts.filter((p) => p.kind === "voice");
  voicePart = vparts.find((p) => p.roleId === character) ?? vparts[0];
  otherVoices = vparts.filter((p) => p !== voicePart);
  voiceParts = vparts;
  const role = edition.roles.find((r) => r.partKey === voicePart.key) ?? edition.roles[0];
  roleId = role?.id ?? "";
  roleVoiceType = role?.voiceType ?? "";
  portraitKey = edition.roles.length > 1 ? `${info.portrait.split(":")[0]}:${roleId}` : info.portrait;
  // every character's lines; the screen shows one character's at a time (yours, unless you choose another)
  language = d.language;
  ORIGINAL = LANGUAGE_NAMES[language.language] ?? "Original";
  LANG = language.language || "it";
  setSpeechLanguage(LANG);
  voices = (d.voices as VoiceManifest[]).filter((m) => m.voiceId);
  pianoPart = edition.parts.find((p) => p.kind === "piano")!;
  if (!displayCache.has(id)) displayCache.set(id, prepareForDisplay(d.scoreXml));
  displayXml = displayCache.get(id)!;
  xmlOrder = [...displayXml.matchAll(/<score-part id="([^"]+)"/g)].map((m) => m[1]);
  tempoWords = tempoWordsOf(edition);
  // Babbino's notes keep their first key, so nobody loses them
  NOTES_KEY = notesKey(id, roleId, edition.roles.length);
}
function loadNotes(): Note[] {
  try {
    return JSON.parse(localStorage.getItem(NOTES_KEY) ?? "[]");
  } catch {
    return [];
  }
}
function saveNotes(n: Note[]) {
  try {
    localStorage.setItem(NOTES_KEY, JSON.stringify(n));
  } catch {
    /* storage unavailable */
  }
}

/** characters in a line, so a long one can be set smaller and still fit the words box */
const lineLen = (ph: { words: { text: string }[] }) => ph.words.reduce((n, w) => n + w.text.length + 1, 0);

/** The beat's note drawn as a small icon (♩, ♩. or ♪), so it stands centred beside the figures at any size (the font
    glyphs sat high or low depending on the font that supplied them). */
export function BeatNote({ symbol }: { symbol: string }) {
  const dotted = symbol === "♩.";
  const eighth = symbol === "♪";
  return (
    <svg className="beat-note" width={dotted ? 14 : 11} height="18" viewBox={`0 0 ${dotted ? 14 : 11} 18`} aria-hidden="true">
      <ellipse cx="4.2" cy="14.2" rx="3.9" ry="2.9" transform="rotate(-22 4.2 14.2)" fill="currentColor" />
      <rect x="7" y="1" width="1.4" height="13.4" fill="currentColor" />
      {eighth && <path d="M8.4 1c.4 2.2 2.6 3.2 2.4 6-.1 1.2-.6 2-1.1 2.6.3-1.6-.2-3.4-1.3-4.2z" fill="currentColor" />}
      {dotted && <circle cx="11.6" cy="14" r="1.4" fill="currentColor" />}
    </svg>
  );
}
export const Icon = {
  tip: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  ),
  back: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  speaker: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M3.5 9H8l5-4.5v15L8 15H3.5z" />
      <path fill="none" stroke="currentColor" strokeWidth="2" d="M16.2 8.6a4.8 4.8 0 0 1 0 6.8M18.8 6a8.5 8.5 0 0 1 0 12" />
    </svg>
  ),
  muted: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M3.5 9H8l5-4.5v15L8 15H3.5z" />
      <path fill="none" stroke="currentColor" strokeWidth="2" d="M16 9l5 6M21 9l-5 6" />
    </svg>
  ),
  eye: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="none" stroke="currentColor" strokeWidth="2" d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" fill="currentColor" />
    </svg>
  ),
  eyeOff: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="none" stroke="currentColor" strokeWidth="2" d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM4 4l16 16" />
    </svg>
  ),
  piano: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="2.5" y="5" width="19" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M7.25 13v6M12 13v6M16.75 13v6" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path fill="currentColor" d="M5.9 5.9h2.7V13H5.9zM10.65 5.9h2.7V13h-2.7zM15.4 5.9h2.7V13h-2.7z" />
    </svg>
  ),
  loop: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17 4.5l2.5 2.5L17 9.5M19.2 7H8.5A3.5 3.5 0 0 0 5 10.5V11M7 19.5L4.5 17 7 14.5M4.8 17h10.7a3.5 3.5 0 0 0 3.5-3.5V13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  chevUp: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 14.5L12 8.5l6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  again: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4.5v3.8h3.8" />
    </svg>
  ),
  fromStart: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M6 5h2.2v14H6zM19 5.6v12.8L9.4 12z" />
    </svg>
  ),
  up: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 14.5L12 8.5l6 6" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  down: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 9.5l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  left: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14.5 5.5L8 12l6.5 6.5" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  right: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9.5 5.5L16 12l-6.5 6.5" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M12 10.5v6M12 7.2v.1" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.2" />
    </svg>
  ),
  music: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="none" stroke="currentColor" strokeWidth="2" d="M9 17.5V5.5l10-2v12" />
      <circle cx="6.5" cy="17.5" r="2.5" fill="currentColor" />
      <circle cx="16.5" cy="15.5" r="2.5" fill="currentColor" />
    </svg>
  ),
  lines: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="none" stroke="currentColor" strokeWidth="2" d="M4 6.5h16M4 12h16M4 17.5h10" />
    </svg>
  ),
  note: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="none" stroke="currentColor" strokeWidth="2" d="M5 19l1-4L16 5l3 3L9 18zM14 7l3 3" />
    </svg>
  ),
  fade: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" />
    </svg>
  ),
  prev: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect fill="currentColor" x="5" y="5" width="2.5" height="14" />
      <path fill="currentColor" d="M19 5v14L8.5 12z" />
    </svg>
  ),
  next: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M5 5v14l10.5-7z" />
      <rect fill="currentColor" x="16.5" y="5" width="2.5" height="14" />
    </svg>
  ),
  play: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M7 4.5v15L19.5 12z" />
    </svg>
  ),
  pause: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect fill="currentColor" x="6" y="5" width="4" height="14" />
      <rect fill="currentColor" x="14" y="5" width="4" height="14" />
    </svg>
  ),
  stop: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect fill="currentColor" x="6" y="6" width="12" height="12" />
    </svg>
  ),
  minus: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="none" stroke="currentColor" strokeWidth="2" d="M5 12h14" />
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="none" stroke="currentColor" strokeWidth="2" d="M12 5v14M5 12h14" />
    </svg>
  ),
  close: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="none" stroke="currentColor" strokeWidth="2" d="M6 6l12 12M18 6L6 18" />
    </svg>
  ),
  // slowly: a tortoise, as in most pronunciation tools
  slow: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" d="M3.5 15.5c.4-4.2 3.6-7 7.6-7s7.2 2.8 7.6 7z" />
      <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M18.6 13.2h1.3a1.7 1.7 0 0 0 0-3.4h-.6M7 15.5v2.6M15 15.5v2.6M8.3 9.6l2.8 5.9 2.8-5.9" />
    </svg>
  ),
  metronome: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9.2 3.5h5.6L18.5 20.5H5.5z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 16.5l4.5-8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M7.5 16.5h9" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
  sliders: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M4 7h9M17 7h3M4 17h3M11 17h9" />
      <circle cx="15" cy="7" r="2.2" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="9" cy="17" r="2.2" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
};


/** volume slider (0–100, 80 = the part's normal level) to gain: squared, so the slider feels even to the ear */
const volGain = (v: number, base: number) => base * (Math.max(0, v) / 80) ** 2;

type Drawer = "context" | "tips" | "notes" | "about";
type View = "music" | "split" | "words";
type OpenWord = { lineId: string; k: number; left: number; top: number };
/** The fixed padding stripCrop adds around the drawn band, in px (does not scale with zoom). */
export const CROP_PAD = 36;
/** Largest size of the music: comfortable on a music stand, still a few bars per screen. */
// a large screen (an iPad on a music stand) gets the music larger rather than empty space around it
export const MAX_ZOOM = 1.3;
/** Height of a standard line of music at zoom 1 (px): voice over piano with markings, measured on Babbino. */
export const STANDARD_LINE_H = 570;

export function fmtTime(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

const TIPS_KEY = "cp:guide3";

type PracticeProps = {
  onBack: () => void;
  /** opens the side panel (roles and their pieces) over the screen */
  onMenu?: () => void;
  /** opens the opera's page (from the line under the title) */
  onOpera?: () => void;
  roleName: string;
  learned?: boolean;
  onToggleLearned?: () => void;
  /** what is happening in the opera when this is sung */
  context?: string;
  /** where it falls in the opera's running order */
  inOpera?: { n: number; total: number; before?: string; after?: string; opera: string };
  /** in an ensemble: sing another character's line (opens that character's piece) */
  onSing?: (roleId: string) => void;
};

/** The practice screen for one piece (an edition id from pieces.tsx). */
export function Practice({ editionId, character, ...props }: PracticeProps & { editionId: string; character?: string }) {
  loadPiece(editionId, character);
  return <PracticeScreen key={`${editionId}:${roleId}`} {...props} />;
}

/** a character's face: the portrait when there is one, otherwise the cast list's simple avatar */
function RoleFace({ k }: { k: string }) {
  const art = PORTRAITS[k];
  if (art) return <img className="face-img" src={art.face} alt="" />;
  const [o, c] = k.split(":");
  const ch = OPERAS.find((x) => x.id === o)?.chars.find((x) => x.id === c);
  return ch ? <Avatar kind={ch.avatar} /> : null;
}
const partnerKey = (p: CompiledEdition["parts"][number]) => `${info.portrait.split(":")[0]}:${p.roleId}`;

function PracticeScreen({
  onBack,
  onMenu,
  onOpera,
  roleName,
  learned,
  onToggleLearned,
  context,
  inOpera,
  onSing,
}: PracticeProps) {
  // steady pulse for learning (the file's bar-by-bar rubato smoothed away), or the expressive reading
  // (always steady now: the switch is gone from the bar)
  const steady = true;
  // The piano keeps the steady practice tempo. A recorded singer was rendered at that same timing (the vocalise
  // scores carry the app's tempo map), so the voice plays as recorded; where a take still differs, it is fitted.
  const perf = useMemo(() => new Performance(edition, [], { tempo: steady ? "steady" : "smooth", pedal: true }), [steady]);
  // the piano accompanies: its loudest moments are tamed so it never hammers under the voice
  const playParts = useMemo(() => edition.parts.map((p) => (p.kind === "piano" ? { ...p, velocityCeiling: 52 } : p)), []);
  const pb = usePlayback(perf, playParts);
  const engine = pb.engine;

  const [pianoFaded, setPianoFaded] = useLocalSetting("p:pianoFaded", true);
  // the music as one long line that scrolls sideways (default), or laid out in systems like a printed page
  const [pageView, setPageView] = useLocalSetting("p:pageView", false);
  const [hearVoice, setHearVoice] = useLocalSetting("p:hearVoice", true);
  const [hearPiano, setHearPiano] = useLocalSetting("p:hearPiano", true);
  // an ensemble: each of the other singers' lines on its own (heard or not, how loud, on what, shown in the score or not),
  // the score's parts in the order you choose, and whose words the line card and the words view show
  const ens = edition.roles.length > 1;
  type LineSet = { hear?: boolean; vol?: number; inst?: LineChoice; show?: boolean; fade?: boolean };
  const [lineSets, setLineSets] = useLocalSetting<Record<string, LineSet>>(`p:lines:${pieceId}`, {});
  const setLine = (key: string, patch: LineSet) => setLineSets({ ...lineSets, [key]: { ...lineSets[key], ...patch } });
  const [order, setOrder] = useLocalSetting<string[]>(`p:order:${pieceId}`, []);
  const orderedIds = useMemo(() => {
    const saved = order.filter((id) => xmlOrder.includes(id));
    return [...saved, ...xmlOrder.filter((id) => !saved.includes(id))];
  }, [order]);
  const partByXml = (xid: string) => (xid === voicePart.source.xmlPartId ? voicePart : edition.parts.find((x) => x.source.xmlPartId === xid)!);
  // in an ensemble the score shows the singers and leaves the piano out unless you ask for it (you still hear it):
  // six staves do not fit a landscape screen at a readable size
  const showOf = (p: CompiledEdition["parts"][number]) => lineSets[p.key]?.show ?? !(ens && p.kind === "piano");

  // Hold a singer's face in the bar to choose what their line plays on: keep holding, slide to a sound and let go
  // (or let go first and tap one). A short tap still mutes and unmutes.
  type HoldMenu = { key: string; name: string; voiceType: string; rect: DOMRect; active: string | null; drag: boolean };
  const [holdMenu, setHoldMenu] = useState<HoldMenu | null>(null);
  const holdRef = useRef<{ timer: number; x: number; y: number; fired: boolean } | null>(null);
  const holdSwallowClick = useRef(false);
  const holdOptAt = (x: number, y: number) =>
    (document.elementFromPoint(x, y) as HTMLElement | null)?.closest<HTMLElement>("[data-hold-opt]")?.dataset.holdOpt ?? null;
  // your own line's sound is one setting shared with Arrange and Settings; the others' are per line
  const pickHold = (key: string, id: string) => {
    if (key === voicePart.key) setLineSound(id as LineChoice);
    else setLine(key, { inst: id as LineChoice });
    setHoldMenu(null);
  };
  const holdHandlers = (p: CompiledEdition["parts"][number], name: string) => {
    const open = (el: HTMLElement, drag: boolean) =>
      setHoldMenu({ key: p.key, name, voiceType: voiceTypeOf(p), rect: el.getBoundingClientRect(), active: null, drag });
    return {
      onPointerDown: (e: RPointerEvent<HTMLButtonElement>) => {
        if (e.button !== 0) return;
        const el = e.currentTarget;
        const pid = e.pointerId;
        holdSwallowClick.current = false;
        const h = { timer: 0, x: e.clientX, y: e.clientY, fired: false };
        h.timer = window.setTimeout(() => {
          h.fired = true;
          holdSwallowClick.current = true;
          // keep the finger's moves and its release coming here while it slides over the menu
          try {
            el.setPointerCapture(pid);
          } catch {
            /* the pointer is gone */
          }
          try {
            navigator.vibrate?.(12);
          } catch {
            /* no vibration here */
          }
          open(el, true);
        }, 380);
        holdRef.current = h;
      },
      onPointerMove: (e: RPointerEvent<HTMLButtonElement>) => {
        const h = holdRef.current;
        if (!h) return;
        if (!h.fired) {
          if (Math.hypot(e.clientX - h.x, e.clientY - h.y) > 10) {
            clearTimeout(h.timer);
            holdRef.current = null;
          }
          return;
        }
        const id = holdOptAt(e.clientX, e.clientY);
        setHoldMenu((m) => (m && m.active !== id ? { ...m, active: id } : m));
      },
      onPointerUp: (e: RPointerEvent<HTMLButtonElement>) => {
        const h = holdRef.current;
        holdRef.current = null;
        if (!h) return;
        clearTimeout(h.timer);
        if (!h.fired) return;
        const id = holdOptAt(e.clientX, e.clientY);
        if (id) pickHold(p.key, id);
        else setHoldMenu((m) => (m ? { ...m, drag: false, active: null } : m));
      },
      onPointerCancel: () => {
        const h = holdRef.current;
        holdRef.current = null;
        if (!h) return;
        clearTimeout(h.timer);
        if (h.fired) setHoldMenu((m) => (m ? { ...m, drag: false, active: null } : m));
      },
      onClickCapture: (e: React.MouseEvent) => {
        if (!holdSwallowClick.current) return;
        holdSwallowClick.current = false;
        e.preventDefault();
        e.stopPropagation();
      },
      // a face is a picture: without this a mouse drag would pick the image up and cancel the hold
      onDragStart: (e: React.DragEvent) => e.preventDefault(),
      onContextMenu: (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        open(e.currentTarget, false);
      },
    };
  };
  useEffect(() => {
    if (!holdMenu || holdMenu.drag) return;
    const away = (e: Event) => {
      if (!(e.target as HTMLElement).closest?.(".hold-menu")) setHoldMenu(null);
    };
    const key = (e: KeyboardEvent) => e.key === "Escape" && setHoldMenu(null);
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", key);
    };
  }, [holdMenu]);
  const hiddenIds = orderedIds.filter((xid) => !showOf(partByXml(xid)));
  // which lines the score shows (the music line is sized afresh when this changes)
  const naturalKeyRef = useRef("");
  naturalKeyRef.current = `${hiddenIds.join(",")}|${pageView}`;
  /** several lines' settings changed at once (a preset) */
  const patchLines = (patches: Record<string, LineSet>) => {
    const next = { ...lineSets };
    for (const [k, v] of Object.entries(patches)) next[k] = { ...next[k], ...v };
    setLineSets(next);
  };
  const lineName = (p: CompiledEdition["parts"][number]) => (p.kind === "piano" ? "Piano" : p.shortLabel);
  // beside the staves in the line view: each part's abbreviation, as a printed score has it (Sus., Cont., Fig.)
  const laneAbbr = useMemo(() => {
    const out: Record<string, string> = {};
    try {
      const doc = new DOMParser().parseFromString(displayXml, "application/xml");
      for (const sp of Array.from(doc.getElementsByTagName("score-part"))) {
        const id = sp.getAttribute("id") ?? "";
        const ab = sp.getElementsByTagName("part-abbreviation")[0]?.textContent?.trim();
        const nm = sp.getElementsByTagName("part-name")[0]?.textContent?.trim() ?? "";
        const p = edition.parts.find((x) => x.source.xmlPartId === id);
        const base = p?.kind === "piano" ? "Pno." : ab && ab.length <= 6 ? ab : (p?.shortLabel ?? nm).replace(/^(Il|La|Lo|Don|Donna|The)\s+/i, "").slice(0, 4) + ".";
        if (id) out[id] = base;
      }
    } catch {
      /* names stay */
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const shownXml = useMemo(() => (orderedIds.join() === xmlOrder.join() ? displayXml : reorderXml(displayXml, orderedIds)), [orderedIds]);
  const moveLine = (i: number, dir: -1 | 1) => {
    const next = [...orderedIds];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setOrder(next);
  };
  /** move a line to another place in the list (dragged, or "to the top") */
  const placeLine = (from: number, to: number) => {
    if (from === to) return;
    const next = [...orderedIds];
    const [x] = next.splice(from, 1);
    next.splice(to, 0, x);
    setOrder(next);
  };
  const meOnTop = orderedIds[0] === voicePart.source.xmlPartId;
  const scoreOrder = orderedIds.join() === xmlOrder.join();
  // dragging a line by its handle in the Arrange panel
  const rowsRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{ from: number; over: number } | null>(null);
  const dragOver = (clientY: number, from: number) => {
    // near the panel's top or bottom edge, the panel scrolls along
    const pop = rowsRef.current?.closest<HTMLElement>(".mix-pop");
    if (pop) {
      const pr = pop.getBoundingClientRect();
      if (clientY < pr.top + 48) pop.scrollTop -= 14;
      else if (clientY > pr.bottom - 48) pop.scrollTop += 14;
    }
    const rows = Array.from(rowsRef.current?.querySelectorAll<HTMLElement>(".mix-line") ?? []);
    let over = rows.length - 1;
    for (let k = 0; k < rows.length; k++) {
      const r = rows[k].getBoundingClientRect();
      if (clientY < r.top + r.height / 2) {
        over = k;
        break;
      }
    }
    setDrag({ from, over });
  };
  // a menu on a staff's name in the score
  const [laneMenu, setLaneMenu] = useState<{ xid: string; left: number; top: number } | null>(null);
  // a singer's face in the bar: tapped, it opens a small menu (sound on/off; in the score clear, faded or hidden)
  const [faceMenu, setFaceMenu] = useState<{ key: string; left: number; bottom: number } | null>(null);
  useBackToClose(!!faceMenu, () => setFaceMenu(null));
  useEffect(() => {
    if (!faceMenu) return;
    const down = (e: PointerEvent) => {
      if (!(e.target as HTMLElement).closest(".face-menu, .bar-parts .part, .pg-piano")) setFaceMenu(null);
    };
    const key = (e: KeyboardEvent) => e.key === "Escape" && setFaceMenu(null);
    window.addEventListener("pointerdown", down);
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("keydown", key);
    };
  }, [faceMenu]);
  const openFaceMenu = (key: string, el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    setFaceMenu((m) => (m?.key === key ? null : { key, left: Math.max(8, Math.min(r.left, window.innerWidth - 240)), bottom: window.innerHeight - r.top + 8 }));
  };
  useBackToClose(!!laneMenu, () => setLaneMenu(null));
  useEffect(() => {
    if (!laneMenu) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !(e.target as HTMLElement).closest(".lane-menu, .lane-label")) setLaneMenu(null);
    };
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", close);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", close);
    };
  }, [laneMenu]);
  const [wordsRole, setWordsRole] = useState(roleId);
  const wordsPart = voiceParts.find((p) => p.roleId === wordsRole) ?? voicePart;
  const wordsName = edition.roles.find((r) => r.id === wordsRole)?.name ?? roleName;
  // the small menus in the line card's header: whose words (an ensemble), and what to show under them
  const [cardMenu, setCardMenu] = useState<null | "words" | "show">(null);
  useBackToClose(!!cardMenu, () => setCardMenu(null));
  useEffect(() => {
    if (!cardMenu) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !(e.target as HTMLElement).closest(".card-menu, .card-menu-btn")) setCardMenu(null);
    };
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", close);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", close);
    };
  }, [cardMenu]);
  const whoPick = ens ? (
    <span className="card-menu-wrap">
      <button
        type="button"
        className="card-menu-btn words-btn"
        aria-haspopup="menu"
        aria-expanded={cardMenu === "words"}
        onClick={() => setCardMenu(cardMenu === "words" ? null : "words")}
        aria-label={`Words shown: ${wordsName}${wordsRole === roleId ? " (you)" : ""}. Choose whose words`}
      >
        <span className="cmb-k">Words</span>
        <b>{wordsName}</b>
        {Icon.down}
      </button>
      {cardMenu === "words" && (
        <span className="card-menu" role="menu" aria-label="Whose words to show">
          {voiceParts.map((p) => {
            const on = p.roleId === wordsRole;
            return (
              <button
                key={p.key}
                type="button"
                role="menuitemradio"
                aria-checked={on}
                onClick={() => {
                  if (p.roleId) setWordsRole(p.roleId);
                  setCardMenu(null);
                }}
              >
                <span className="cm-check" aria-hidden="true">{on ? Icon.check : null}</span>
                <span>{p.shortLabel}</span>
                {p === voicePart && <em className="cmb-you">you</em>}
              </button>
            );
          })}
        </span>
      )}
    </span>
  ) : null;
  // the line card takes the colours of the character whose words it shows
  const cardTone = (() => {
    const t = ART_TONES[ens ? `${portraitKey.split(":")[0]}:${wordsRole}` : portraitKey];
    return t ? ({ "--line-bg": `color-mix(in srgb, ${t.strong} 55%, ${t.soft})`, "--line-ring": t.deep } as CSSProperties) : undefined;
  })();
  // the singer's own colours (chosen with their picture) for "you" on this screen, instead of the default pink
  const practiceTone = (() => {
    const t = ART_TONES[portraitKey];
    return t ? ({ "--you": t.deep, "--tone-soft": t.soft, "--tone-strong": t.strong, "--tone-deep": t.deep } as CSSProperties) : undefined;
  })();
  const voiceTypeOf = (p: CompiledEdition["parts"][number]) => edition.roles.find((r) => r.partKey === p.key)?.voiceType ?? "";
  const [countIn, setCountIn] = useLocalSetting("p:countin", true);
  // how loud each part is (80 = normal), and what the sung line is played on
  const [vol, setVol] = useLocalSetting<{ voice: number; piano: number }>("p:vol3", { voice: 80, piano: 60 });
  const hearOf = (p: CompiledEdition["parts"][number]) =>
    p === voicePart ? hearVoice : p.kind === "piano" ? hearPiano : (lineSets[p.key]?.hear ?? p.kind === "chorus");
  const setHear = (p: CompiledEdition["parts"][number], x: boolean) =>
    p === voicePart ? setHearVoice(x) : p.kind === "piano" ? setHearPiano(x) : setLine(p.key, { hear: x });

  // "auto" (the default) picks by the role's voice; a choice that no longer exists (the violin) does too
  const [lineChoice, setLineSound] = useLocalSetting<LineChoice>("p:lineSound2", "piano");
  const lineSound: LineInstrument = resolveLine(lineChoice, roleVoiceType, sungOf(voicePart.key));
  // the spoken voice (while we compare voices, more than one may be bundled)
  const [voiceSel, setVoiceSel] = useLocalSetting<string>("p:voice", defaultVoiceId);
  // an ensemble's lines are spoken in the voice of the character whose words are shown (a man's for a man)
  const voiceFor = (role: string) => (ens && voices.find((m) => m.voiceId === languageVoiceId(edition.roles.find((r) => r.id === role)?.voiceType ?? ""))) || voiceById(voiceSel);
  const voice = voiceFor(wordsRole);
  const wordUrl = (text: string) => wordUrlIn(voice, text);
  const [soundLoading, setSoundLoading] = useState(false);
  const [mixOpen, setMixOpen] = useState(false);
  const [drawer, setDrawer] = useState<Drawer | null>(null);
  // back (the gesture, or the browser's) closes what is open over the music, one thing at a time
  useBackToClose(!!drawer, () => setDrawer(null));
  useBackToClose(mixOpen, () => setMixOpen(false));
  const [openWord, setOpenWord] = useState<OpenWord | null>(null);
  useBackToClose(!!openWord, () => setOpenWord(null));
  const [viewSaved, setView] = useLocalSetting<View>("p:view", "music");
  // "Both" (the words beside the music) is gone: a saved choice of it opens the music
  const view: View = viewSaved === "split" ? "music" : viewSaved;
  // the score is on screen in Music and in Both (Both shows the words beside it where there is room)
  const musicOn = view !== "words";
  // Words in an ensemble: the whole text, everyone's lines in the order sung (yours in full ink, the others faded), or
  // "Just mine". The music's line card keeps its own choice of whose words it shows.
  const [justMine, setJustMine] = useLocalSetting("p:wordsMine", false);
  const allWords = ens && view === "words" && !justMine;
  const phrases = useMemo(
    () => (!ens || allWords ? language.phrases : language.phrases.filter((p) => p.roleId === (view === "words" ? roleId : wordsRole))),
    [ens, allWords, view, wordsRole],
  );
  // the line box over the music can be put away altogether (the score gets the room); a button in the header brings it back
  const [cardOn, setCardOn] = useLocalSetting("p:card", true);
  // while the music plays the box shows the words only; a tap on it brings its tools back for a few seconds
  // (as a video player's controls do), and they stay while you use them
  const [cardPeek, setCardPeek] = useState(false);
  const peekTimer = useRef<number | undefined>(undefined);
  const peekCard = useCallback(() => {
    setCardPeek(true);
    window.clearTimeout(peekTimer.current);
    peekTimer.current = window.setTimeout(() => setCardPeek(false), 4000);
  }, []);
  useEffect(() => () => window.clearTimeout(peekTimer.current), []);
  // words view: the IPA under each line can be hidden
  const [showIpa, setShowIpa] = useLocalSetting("p:ipa", false);
  const [showTr, setShowTr] = useLocalSetting("p:tr", true);
  // minimal: the line as plain text on a thin rule, nothing else (the music gets the room)
  // (the "minimal" card is gone: while the music plays the card is words only by itself)
  const minimal = false;
  // pronunciation tips: in full where a sound first occurs, a quiet mark on the words it applies to later
  // pronunciation tips live in one place: a strip above the words (and the music card's header), about the
  // line you are on; only that line's letters are marked, so the rest stays two clean columns
  const [showTips, setShowTips] = useLocalSetting("p:tipsBar", true);
  // the pronunciation tips are worked out for Italian; other languages have none yet
  const tips = useMemo(() => buildTips(LANG === "it" ? (phrases as unknown as TipLine[]) : []), [phrases]);
  const hasTips = tips.list.length > 0;
  const sylRanges = useMemo(() => new Map(phrases.map((ph) => [ph.id, syllableRanges(ph)])), [phrases]);
  const [tipIdx, setTipIdx] = useState(0);
  const [tipOpen, setTipOpen] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [speakingWord, setSpeakingWord] = useState<string | null>(null);
  const [notes, setNotes] = useState<Note[]>(loadNotes);
  // adding a note: tap Notes, then tap the bar; the small note card opens right there (also for a note's tag on the score)
  const [notePick, setNotePick] = useState(false);
  const [noteEdit, setNoteEdit] = useState<null | { id: string | null; m: number; q: number; body: string; mark?: MarkId }>(null);
  // where the finger last touched the screen: a new note opens right there, on the score, like writing on the page
  const lastTap = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => {
    const on = (e: PointerEvent) => {
      if (!(e.target as HTMLElement | null)?.closest?.(".note-card")) lastTap.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("pointerdown", on, true);
    return () => window.removeEventListener("pointerdown", on, true);
  }, []);
  const [notesMsg, setNotesMsg] = useState("");
  // the score for print (Save as PDF), with your notes written on it: being made, or what became of it
  const [printState, setPrintState] = useState<"idle" | "busy" | "tab" | "blocked" | "noTab" | "failed">("idle");
  const printDoc = useRef<{ key: string; html: string } | null>(null);
  const printScore = async () => {
    if (printState === "busy") return;
    setPrintState("busy");
    try {
      const mine = voicePart.source.xmlPartId;
      // every part, as the printed vocal score has them (all the voices and the piano's two staves, whatever the
      // screen hides), in the order you chose
      const visible: string[] | null = null;
      const sorted = [...notes].sort((a, b) => a.m - b.m || a.q - b.q);
      const key = JSON.stringify([visible, orderedIds, sorted]);
      if (printDoc.current?.key !== key) {
        const list = sorted.map((n, i) => {
          const meas = edition.measures[n.m];
          const bi = beatInfo(meas?.time ?? [4, 4]);
          const at = n.q / bi.unitQ;
          const beat = Math.floor(at + 1e-6) + 1;
          const part = at - (beat - 1);
          const frac = part > 0.2 && part < 0.3 ? "¼" : part > 0.45 && part < 0.55 ? "½" : part > 0.7 && part < 0.8 ? "¾" : "";
          const mk = MARKS.find((x) => x.id === n.mark);
          return {
            n: i + 1,
            m: n.m,
            q: n.q,
            words: `${circled(i + 1)} ${noteLabel(n)}`,
            where: `Bar ${meas?.number ?? n.m + 1}, beat ${beat}${frac}`,
            // a mark with words of its own is named before them, unless the words already begin with its name
            sign: mk ? `${mk.sign}${n.body === mk.label || n.body.toLowerCase().startsWith(mk.label.toLowerCase()) ? "" : ` ${mk.label}:`}` : undefined,
            text: n.body,
          };
        });
        const xml = annotateXml(shownXml, mine, list.filter((x) => edition.measures[x.m]));
        const pages = await engravePages(xml, visible);
        const rights = /<rights[^>]*>([^<]*)<\/rights>/.exec(displayXml)?.[1];
        const credits = rights ? new DOMParser().parseFromString(`<r>${rights}</r>`, "application/xml").documentElement.textContent ?? "" : "";
        const html = printHtml({ title: edition.title, running: `${roleName} · ${info.opera}`, credits, pages, notes: list, fontCss: fontFaceCss(["Charis SIL"]) });
        printDoc.current = { key, html };
      }
      const how = await printDocument(printDoc.current.html);
      setPrintState(how === "dialog" ? "idle" : how);
    } catch {
      setPrintState("failed");
    }
  };
  const [, setVoicesTick] = useState(0);
  const layoutRef = useRef<ScoreLayout | null>(null);

  // the line of music always fits the space under the text: no vertical scrolling, with or without the piano
  const stageRef = useRef<HTMLElement>(null);
  const [stageH, setStageH] = useState(0);
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setStageH(el.clientHeight));
    ro.observe(el);
    setStageH(el.clientHeight);
    return () => ro.disconnect();
  }, []);
  const [natural, setNatural] = useState(0);
  const naturalRef = useRef(0);
  naturalRef.current = natural;
  // One size for every piece: the zoom is set for a standard line (voice and piano with slurs, dynamics and words
  // above and below, as in Babbino), not for this piece's own height. Fitting each piece to the space made a
  // plain recitative 40% larger than an aria, with crowded words; a taller piece still shrinks to fit.
  const fit = natural && stageH ? (stageH - 24 - CROP_PAD) / Math.max(natural, STANDARD_LINE_H) : Infinity;
  // with the line box hidden and the bar folded there is far more height: the music grows a little into it, but
  // not to poster size (a phone shows too few bars, an iPad's notes look shouted)
  // a tablet held upright has height to spare: the line may grow a little more there
  const roomCap = typeof window === "undefined" ? 0.8 : window.innerWidth < 700 ? 0.65 : window.innerHeight > window.innerWidth * 1.15 ? 0.95 : 0.8;
  const fitZoom = Math.max(0.55, Math.min(MAX_ZOOM, roomCap, Math.floor(fit * 40) / 40));
  // while the music plays the size holds (redrawing then would compete with the sound): opening the full bar
  // over a playing piece on a phone leaves the music as it is until you pause
  const heldZoom = useRef<number | null>(null);
  if (engine?.state !== "playing") heldZoom.current = null;
  else if (heldZoom.current === null) heldZoom.current = fitZoom;
  const effZoom = heldZoom.current ?? fitZoom;
  const effZoomRef = useRef(effZoom);
  effZoomRef.current = effZoom;
  const naturalSeen = useRef("");
  const stageHRef = useRef(0);
  stageHRef.current = stageH;
  const onLayout = (l: ScoreLayout) => {
    layoutRef.current = l;
    const c = stripCrop(l);
    if (!c) return;
    const n = (c.h - CROP_PAD) / effZoomRef.current;
    // The line's height at a new size is not exactly proportional (words and slurs settle differently), so the
    // fitted size could flip between two values for ever, re-drawing the score each time (it froze the page with
    // the piano shown in a duet). For the same lines on the same screen the height only grows; a change of lines
    // or of screen starts afresh.
    const key = `${naturalKeyRef.current}|${stageHRef.current}`;
    if (key !== naturalSeen.current) {
      naturalSeen.current = key;
      setNatural(n);
      return;
    }
    setNatural((o) => (n > o + 3 ? n : o));
  };

  useEffect(() => onVoicesChanged(() => setVoicesTick((x) => x + 1)), []);
  useEffect(() => engine?.setCountIn(countIn), [engine, countIn]);
  useEffect(() => {
    if (!engine) return;
    engine.setMix(voicePart.key, { muted: !hearVoice, solo: false, volume: volGain(vol.voice, voicePart.defaultVolume) });
    engine.setMix(pianoPart.key, { muted: !hearPiano, solo: false, volume: volGain(vol.piano, pianoPart.defaultVolume) });
    // the other singers are silent until you add them; the chorus sings unless you mute it
    for (const p of [...otherVoices, ...edition.parts.filter((x) => x.kind === "chorus")]) {
      const ls = lineSets[p.key] ?? {};
      engine.setMix(p.key, { muted: !(ls.hear ?? p.kind === "chorus"), solo: false, volume: volGain(ls.vol ?? 80, p.defaultVolume) });
    }
  }, [engine, hearVoice, hearPiano, vol, lineSets]);
  // the sung line's lowest and highest notes, so an instrument can take it an octave down when needed
  const voiceRange = useMemo<[number, number]>(() => {
    const ms = edition.notes.filter((n) => n.part === voicePart.key).map((n) => n.midi);
    return [Math.min(...ms), Math.max(...ms)];
  }, []);
  // sounds still arriving (recorded singers, instruments for the sung lines): play waits for them, so the
  // music never starts after the moving line
  const pendingLoads = useRef(new Set<Promise<unknown>>());
  const track = <T,>(pr: Promise<T>): Promise<T> => {
    const done = pr.catch(() => undefined);
    pendingLoads.current.add(done);
    void done.finally(() => pendingLoads.current.delete(done));
    return pr;
  };
  const [preparing, setPreparing] = useState(false);
  // the recorded singers, placed on this performance's timeline (before their instruments are chosen below)
  useEffect(() => {
    const port = pb.port;
    if (!port?.setRecording) return;
    // the port outlives the piece: drop any other piece's singers first, or they would sing along here
    port.keepRecordings?.(voiceParts.filter((p) => sungOf(p.key)).map((p) => p.channel));
    for (const p of voiceParts) {
      const recs = recordingsOf(p.key);
      if (!recs.length) continue;
      const placed = recs.map((rec) => {
        const pts = perf.notes
          .filter((n) => n.part === p.key && rec.onsets[n.ids[0]] !== undefined)
          .map((n) => [perf.qToSec(n.onQ), rec.onsets[n.ids[0]], perf.qToSec(n.offQ)] as const)
          .sort((a, b) => a[0] - b[0]);
        return { tempo: rec.tempo, url: rec.url, map: { perf: pts.map((x) => x[0]), audio: pts.map((x) => x[1]), ends: pts.map((x) => x[2]) } };
      });
      track(port.setRecording(p.channel, placed)).catch(() => undefined);
    }
  }, [pb.port, perf]);
  // leaving the piece: its singers go too
  useEffect(() => {
    const port = pb.port;
    return () => port?.keepRecordings?.([]);
  }, [pb.port]);
  useEffect(() => {
    const port = pb.port;
    if (!port?.setInstrument) return;
    let alive = true;
    setSoundLoading(lineSound !== "piano");
    track(port.setInstrument(voicePart.channel, lineSound, voiceRange))
      .catch(() => undefined)
      .finally(() => alive && setSoundLoading(false));
    return () => {
      alive = false;
    };
  }, [pb.port, lineSound, voiceRange]);
  // The room suits the pedalling. Puccini is pedalled with the harmony (and its own Ped. marks), so the
  // default hall is enough; Mozart is pedalled lightly, beat by beat, to keep the texture clear, and
  // without a little more hall that clean playing sounds dry: the room gives it the warmth instead.
  useEffect(() => {
    pb.port?.setRoom?.(edition.pedal === "classical" ? 1.35 : 1);
  }, [pb.port]);
  // the other singers' lines: each on the instrument chosen for it, by default the one for its own voice, so they are easy to tell apart
  const instOf = (p: CompiledEdition["parts"][number]) => resolveLine(lineSets[p.key]?.inst ?? "auto", voiceTypeOf(p), sungOf(p.key));
  const instKey = otherVoices.map(instOf).join(",");
  useEffect(() => {
    const port = pb.port;
    if (!port?.setInstrument) return;
    for (const p of otherVoices) {
      const ms = edition.notes.filter((n) => n.part === p.key).map((n) => n.midi);
      track(port.setInstrument(p.channel, instOf(p), [Math.min(...ms), Math.max(...ms)])).catch(() => undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pb.port, instKey]);
  // the sound panel closes on a tap elsewhere or Escape
  useEffect(() => {
    if (!mixOpen) return;
    const down = (e: PointerEvent) => {
      const t = e.target as HTMLElement;
      if (mixOpen && !t.closest(".mix-pop, .mix-btn")) setMixOpen(false);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMixOpen(false);
    };
    window.addEventListener("pointerdown", down);
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("keydown", key);
    };
  }, [mixOpen]);

  // lines on the timeline
  const spans = useMemo(
    () =>
      phrases
        .map((ph) => ({
          ph,
          startQ: perf.toPerfQ({ m: ph.startM, q: ph.startQ, occ: ph.occurrence }),
          endQ: perf.toPerfQ({ m: ph.endM, q: ph.endQ, occ: ph.occurrence }),
        }))
        .sort((a, b) => a.startQ - b.startQ || Number(b.ph.roleId === roleId) - Number(a.ph.roleId === roleId)),
    [perf, phrases],
  );
  const currentQ = useCallback(() => (engine ? engine.displayQ() : 0), [engine]);
  // the play position on a 1/16 grid, except near a line's start (a triplet or other off-grid onset): there it
  // is the start itself, so rounding never puts it just before its own line ("Next line" would stick)
  const q = useTicker(() => {
    const r = currentQ();
    const s = spans.find((x) => r >= x.startQ - 0.001 && r < x.startQ + 1 / 32);
    return s ? s.startQ : Math.round(r * 16) / 16;
  }, 80);
  const [starting, setStarting] = useState(false);
  const playing = engine?.state === "playing";
  // the screen's playing shape (also for the moment just before the music starts)
  const live = playing || starting;
  // the box keeps the height it had when the music started: a rest (three dots) or a short line never makes
  // the score below jump while you sing
  const lineCardRef = useRef<HTMLDivElement>(null);
  // the sung line is kept on one line: set smaller until it fits (down to 70% of its size); a line still too long
  // breaks into two even halves rather than one long line and a stray word
  const itRef = useRef<HTMLParagraphElement>(null);
  const itFit = useRef({ text: "", w: 0 });
  const fitLine = useCallback(() => {
    const el = itRef.current;
    if (!el) return;
    el.style.fontSize = "";
    el.style.whiteSpace = "nowrap";
    const base = parseFloat(getComputedStyle(el).fontSize);
    const need = el.scrollWidth;
    const have = el.clientWidth;
    const size = need > have ? Math.floor(((base * have) / need) * 0.97) : base;
    if (size >= base * 0.7 && size < base) el.style.fontSize = `${size}px`;
    // never forced onto one line: should the measure be off (a font still loading), the line wraps in even halves
    // rather than running out of the box
    el.style.whiteSpace = "";
    itFit.current = { text: el.textContent ?? "", w: have };
  }, []);
  useLayoutEffect(() => {
    const el = itRef.current;
    if (el && (el.textContent !== itFit.current.text)) fitLine();
  });
  useEffect(() => {
    const ro = new ResizeObserver(() => fitLine());
    if (lineCardRef.current) ro.observe(lineCardRef.current);
    document.fonts?.ready.then(() => fitLine());
    const onFonts = () => fitLine();
    document.fonts?.addEventListener?.("loadingdone", onFonts);
    return () => {
      ro.disconnect();
      document.fonts?.removeEventListener?.("loadingdone", onFonts);
    };
  }, [fitLine]);
  const [cardH, setCardH] = useState(0);
  useLayoutEffect(() => {
    if (live) setCardH(lineCardRef.current?.offsetHeight ?? 0);
    else setCardH(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live]);

  const current = useMemo(() => {
    const cur = spans.findIndex((s) => q >= s.startQ - 1e-6 && q < s.endQ - 1e-6);
    if (cur >= 0) return { idx: cur, sounding: true };
    const next = spans.findIndex((s) => s.startQ > q);
    return { idx: next >= 0 ? next : spans.length - 1, sounding: false };
  }, [spans, q]);

  const soundingIds = useMemo(() => {
    // the part singing the line in view (the whole text mixes the singers' lines)
    const role = spans[current.idx]?.ph.roleId;
    const key = voiceParts.find((p) => p.roleId === role)?.key ?? wordsPart.key;
    const ev = perf.notes.find((n) => n.part === key && n.onQ <= q + 1e-6 && n.offQ > q + 1e-6);
    return new Set(ev?.ids ?? []);
  }, [perf, q, wordsPart, spans, current.idx]);

  // the line shown in the panel: the one being sung, otherwise the next one
  const shown = spans[current.idx];
  // the tips for that line (at most two: the ones that start here come first)
  // one tip per line at most: the one that matters most there
  const lineTips = (tips.lineTips.get(shown.ph.id) ?? []).slice(0, 1);
  useEffect(() => {
    setTipIdx(0);
    setTipOpen(false);
  }, [shown.ph.id]);
  const curTip = showTips && lineTips.length ? lineTips[tipIdx % lineTips.length] : null;
  const litTip = curTip?.tip.id ?? null;
  // where each sung note lies on the timeline, by note id (a tied note: the whole tie)
  const voiceSpan = useMemo(() => {
    const m = new Map<string, { on: number; off: number }>();
    const keys = new Set([wordsPart.key, ...voiceParts.map((p) => p.key)]);
    for (const n of perf.notes) if (keys.has(n.part)) for (const id of n.ids) if (!m.has(id)) m.set(id, { on: n.onQ, off: n.offQ });
    return m;
  }, [perf, wordsPart]);
  // the line in progress: which syllables are sung already, and which are on the note sounding now
  // ("bel", then "lo"; two when an elision puts them on one note). null: the line has not begun.
  const nowSyl = useMemo<SylProgress | null>(() => {
    if (!current.sounding) return null;
    const now = new Set<number>();
    const done = new Set<number>();
    (shown.ph.syllables ?? []).forEach((sy, i) => {
      if (soundingIds.has(sy.noteId)) now.add(i);
      else if ((voiceSpan.get(sy.noteId)?.off ?? Infinity) <= q + 1e-6) done.add(i);
    });
    return { now, done };
  }, [current.sounding, shown.ph, soundingIds, voiceSpan, q]);
  useEffect(() => {
    if (view === "music") setOpenWord(null);
  }, [shown.ph.id, view]);

  const goTo = useCallback((pq: number) => engine?.seek(pq), [engine]);
  const stepLine = (dir: -1 | 1) => {
    const i = current.idx;
    if (dir < 0) {
      const into = q - spans[i].startQ;
      goTo(spans[into > 0.75 || !current.sounding ? Math.max(0, i - (current.sounding ? 0 : 1)) : Math.max(0, i - 1)].startQ - 0.0001);
    } else goTo(spans[Math.min(spans.length - 1, current.sounding ? i + 1 : i)].startQ - 0.0001);
  };

  // while a recorded line is spoken, the word being said is marked in the text
  const [spokenWord, setSpokenWord] = useState<{ lineId: string; k: number } | null>(null);
  const sayPhrase = async (id: string, slow = false) => {
    const ph = phrases.find((p) => p.id === id)!;
    if (engine?.state === "playing") engine.pause();
    setSpeakingId(id);
    // each line in the voice of the character who sings it (a man's for a man)
    const rec = lineClip(voiceFor(ph.roleId ?? wordsRole), id, ph.original);
    const times = slow ? rec?.slowWords : rec?.words;
    await speak(
      { text: ph.original, normalUrl: audioUrl(ph.audio.normal?.file), slowUrl: audioUrl(ph.audio.slow?.file), recorded: rec ? { normal: rec.normal, slow: rec.slow } : undefined },
      slow,
      times
        ? (sec) => {
            const k = sec < 0 ? -1 : times.findIndex(([a, b]) => sec >= a - 0.03 && sec < b + 0.05);
            setSpokenWord((o) => (k < 0 ? null : o?.lineId === id && o.k === k ? o : { lineId: id, k }));
          }
        : undefined,
    );
    setSpokenWord(null);
    setSpeakingId((s) => (s === id ? null : s));
  };
  const sayWord = async (key: string, text: string, slow = false) => {
    if (engine?.state === "playing") engine.pause();
    setSpeakingWord(key);
    const url = wordUrl(text);
    await speak({ text: text.replace(/[.,;:!?«»“”]+/g, ""), recorded: url ? { normal: url, slow: url } : undefined }, slow);
    setSpeakingWord((k) => (k === key ? null : k));
  };
  useEffect(() => () => stopSpeaking(), []);
  // this piece's recordings only, once the piano is ready (and a moment later), so the music always comes first
  const soundReady = pb.status === "ready";
  useEffect(() => {
    if (!soundReady) return;
    const files = voices.flatMap((m) => Object.values((m as unknown as { clips?: Record<string, { file?: string }> }).clips ?? {}).map((c) => c.file ?? ""));
    const t = window.setTimeout(() => preloadVoicePacks(files.filter(Boolean)), 1500);
    return () => window.clearTimeout(t);
  }, [soundReady]);

  const play = async () => {
    if (!engine || !pb.port) return;
    stopSpeaking();
    setSpeakingId(null);
    await pb.port.resume();
    // wait (at most 20 s) for the voices still loading, so the count-in and the line start with the sound
    if (pendingLoads.current.size) {
      setPreparing(true);
      await Promise.race([Promise.all([...pendingLoads.current]), new Promise((r) => setTimeout(r, 20000))]);
      setPreparing(false);
    }
    // the screen first takes its playing shape (words-only card, folded bar on a phone: the music is redrawn
    // larger), then the music starts, so that redrawing never competes with the sound for the processor
    setStarting(true);
    await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 30))));
    setStarting(false);
    engine.play();
  };

  // Loop: the bars of one line (with the bar before it when the line starts on a downbeat, so the
  // accompaniment leads you in), or bars tapped in the score while looping (the loop grows to take them in)
  const [loop, setLoop] = useState<{ startQ: number; endQ: number } | null>(null);
  // just after the loop button: a line saying how to choose the bars, and the edges pulse
  const [loopHint, setLoopHint] = useState(false);
  // the last loop is kept (for this piece and role) when you switch looping off: switching it on brings it back,
  // until you clear it
  const loopKey = `cp:loop:${portraitKey}:${edition.editionId}`;
  const [savedLoop, setSavedLoop] = useState<{ startQ: number; endQ: number } | null>(() => {
    try {
      return JSON.parse(localStorage.getItem(loopKey) ?? "null");
    } catch {
      return null;
    }
  });
  useEffect(() => {
    if (!loop) return;
    setSavedLoop(loop);
    try {
      localStorage.setItem(loopKey, JSON.stringify(loop));
    } catch {
      /* storage unavailable */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loop]);
  const clearLoop = () => {
    setLoop(null);
    setSavedLoop(null);
    setLoopHint(false);
    try {
      localStorage.removeItem(loopKey);
    } catch {
      /* storage unavailable */
    }
  };
  useEffect(() => {
    if (!loop) setLoopHint(false);
  }, [loop]);
  // on a phone the bar folds to one slim row while the music plays (the score gets the room); a tap opens it
  // phones: the bar is one slim row (play, loop, speed); the arrow opens every control, and closes them again
  const [barOpen, setBarOpen] = useLocalSetting("p:barOpen", false);
  const [speedPop, setSpeedPop] = useState(false);
  // the other singers' row: which edges have more faces beyond them
  const othersRef = useRef<HTMLDivElement>(null);
  const [othersMore, setOthersMore] = useState("");
  const othersEdges = useCallback(() => {
    const el = othersRef.current;
    if (!el) return;
    const l = el.scrollLeft > 2;
    const r = el.scrollLeft + el.clientWidth < el.scrollWidth - 2;
    const v = `${l ? " more-l" : ""}${r ? " more-r" : ""}`;
    setOthersMore((o) => (o === v ? o : v));
  }, []);
  useEffect(() => {
    const el = othersRef.current;
    if (!el) return;
    othersEdges();
    const ro = new ResizeObserver(othersEdges);
    ro.observe(el);
    const mo = new MutationObserver(othersEdges);
    mo.observe(el, { childList: true });
    return () => (ro.disconnect(), mo.disconnect());
  }, [othersEdges, barOpen]);
  useEffect(() => {
    if (!speedPop) return;
    const off = (e: PointerEvent) => {
      if (!(e.target as HTMLElement).closest(".tl-speed")) setSpeedPop(false);
    };
    window.addEventListener("pointerdown", off);
    return () => window.removeEventListener("pointerdown", off);
  }, [speedPop]);
  useEffect(() => engine?.setLoop(loop), [engine, loop]);
  const barAt = (pq: number) => perf.measures.find((pm) => pq >= pm.startQ - 1e-6 && pq < pm.startQ + pm.durQ - 1e-6) ?? perf.measures[perf.measures.length - 1];
  const loopLine = () => {
    const sp = spans[current.idx];
    const first = barAt(Math.max(0, sp.startQ - 0.5));
    const last = barAt(Math.max(sp.startQ, sp.endQ - 1e-3));
    const range = { startQ: first.startQ, endQ: last.startQ + last.durQ };
    setLoop(range);
    if (engine && engine.state !== "playing") engine.seek(range.startQ);
  };
  const loopBars = loop
    ? (() => {
        const a = perf.locate(loop.startQ).number;
        const b = perf.locate(loop.endQ - 1e-3).number;
        return a === b ? `bar ${a}` : `bars ${a}–${b}`;
      })()
    : "";
  // choosing the bars to loop: the loop button asks for the first bar, then the last (or "just this line")
  const [loopPick, setLoopPick] = useState<null | { first: PerfMeasure | null }>(null);
  useBackToClose(!!loopPick, () => setLoopPick(null));
  const onTap = (pos: { m: number; q: number }) => {
    if (notePick) {
      setNotePick(false);
      setNoteEdit({ id: null, m: pos.m, q: Math.round(pos.q * 2) / 2, body: "" });
      return;
    }
    const occs = perf.occurrences(pos.m);
    if (!occs.length) return;
    const pm = occs[0];
    if (loopPick) {
      if (!loopPick.first) {
        setLoopPick({ first: pm });
        if (engine && engine.state !== "playing") engine.seek(pm.startQ);
        return;
      }
      const a = loopPick.first.startQ <= pm.startQ ? loopPick.first : pm;
      const b = loopPick.first.startQ <= pm.startQ ? pm : loopPick.first;
      const range = { startQ: a.startQ, endQ: b.startQ + b.durQ };
      setLoop(range);
      setLoopPick(null);
      if (engine && engine.state !== "playing") engine.seek(range.startQ);
      return;
    }
    if (loop && (pm.startQ < loop.startQ - 1e-6 || pm.startQ >= loop.endQ - 1e-6)) {
      setLoop({ startQ: Math.min(loop.startQ, pm.startQ), endQ: Math.max(loop.endQ, pm.startQ + pm.durQ) });
      return;
    }
    goTo(pm.startQ + pos.q);
  };

  // choosing a loop in the score itself: drag across bars (mouse) or long-press a bar (touch); then drag its handles
  const rangeFrom = useRef<PerfMeasure | null>(null);
  const onRange = (from: { m: number; q: number }, to: { m: number; q: number }, phase: "press" | "start" | "move" | "end") => {
    const at = (m: number) => perf.occurrences(m)[0];
    const a = at(from.m);
    if (!a) return;
    setLoopPick(null);
    if (phase === "press") {
      const r = { startQ: a.startQ, endQ: a.startQ + a.durQ };
      setLoop(r);
      if (engine && engine.state !== "playing") engine.seek(r.startQ);
      return;
    }
    if (phase === "start") {
      // starting a drag on an edge bar of the current loop moves that edge (the other end stays)
      let anchor = a;
      if (loop) {
        const f = barAt(loop.startQ);
        const z = barAt(loop.endQ - 1e-3);
        if (z.startQ > f.startQ + 1e-6) {
          if (Math.abs(a.startQ - f.startQ) < 1e-6) anchor = z;
          else if (Math.abs(a.startQ - z.startQ) < 1e-6) anchor = f;
        }
      }
      rangeFrom.current = anchor;
    }
    const A = rangeFrom.current ?? a;
    const B = at(to.m) ?? a;
    const r = { startQ: Math.min(A.startQ, B.startQ), endQ: Math.max(A.startQ + A.durQ, B.startQ + B.durQ) };
    setLoop((o) => (o && Math.abs(o.startQ - r.startQ) < 1e-6 && Math.abs(o.endQ - r.endQ) < 1e-6 ? o : r));
    if (phase === "end" && engine && engine.state !== "playing") engine.seek(r.startQ);
  };
  const onLoopEdge = (k: "s" | "e", h: { m: number; q: number } | null, step?: number) => {
    if (!loop) return;
    const F = barAt(loop.startQ);
    const Z = barAt(loop.endQ - 1e-3);
    let r: { startQ: number; endQ: number } | null = null;
    if (step) {
      const ms = perf.measures;
      const M = ms[ms.indexOf(k === "s" ? F : Z) + step];
      if (!M) return;
      r = k === "s" ? (M.startQ > Z.startQ + 1e-6 ? null : { startQ: M.startQ, endQ: loop.endQ }) : M.startQ < F.startQ - 1e-6 ? null : { startQ: loop.startQ, endQ: M.startQ + M.durQ };
    } else if (h) {
      const o = perf.occurrences(h.m)[0];
      if (!o) return;
      // a bar the edge is dragged a little way into is taken in (a quarter of it is enough), so the loop follows
      // the finger rather than waiting for the far half of a long bar
      const qEnd = h.q > o.durQ * 0.25 ? o.startQ + o.durQ : o.startQ;
      const qStart = h.q < o.durQ * 0.75 ? o.startQ : o.startQ + o.durQ;
      r = k === "s" ? { startQ: Math.min(qStart, Z.startQ), endQ: loop.endQ } : { startQ: loop.startQ, endQ: Math.max(qEnd, F.startQ + F.durQ) };
    }
    if (r && (Math.abs(r.startQ - loop.startQ) > 1e-6 || Math.abs(r.endQ - loop.endQ) > 1e-6)) setLoop(r);
  };

  // where you stopped, per piece and role: shown on the role card ("Continue · bar 23") and where the piece opens next time
  const atKey = `cp:at:${portraitKey}:${edition.editionId}`;
  const restored = useRef(false);
  const lastQ = useRef(0);
  lastQ.current = q;
  useEffect(() => {
    if (!engine || pb.status !== "ready" || restored.current) return;
    restored.current = true;
    try {
      type Saved = { q?: number; tempo?: number; loop?: { startQ: number; endQ: number } | null; mix?: { hv?: boolean; hp?: boolean; pf?: boolean; lines?: typeof lineSets } };
      const v = JSON.parse(localStorage.getItem(atKey) ?? "null") as Saved | null;
      // opened from Home: "resume" brings back the place, loop, speed and mix; "start" begins clean;
      // "note" opens at the bar of one of your notes
      let open: { ed?: string; mode?: string; at?: number; m?: number; q?: number } | null = null;
      try {
        open = JSON.parse(sessionStorage.getItem("cp:open") ?? "null");
      } catch {
        /* storage unavailable */
      }
      const mode = open && open.ed === edition.editionId && Date.now() - (open.at ?? 0) < 60000 ? open.mode : null;
      if (mode) sessionStorage.removeItem("cp:open");
      const noteAt = mode === "note" && typeof open?.m === "number" ? perf.occurrences(open.m)[0] : undefined;
      if (mode === "start" || noteAt) {
        setLoop(null);
        if (engine.state !== "playing") engine.seek(noteAt ? noteAt.startQ + Math.max(0, Math.min(noteAt.durQ, open?.q ?? 0)) : 0);
      } else {
        if (v?.q && v.q > 0 && v.q < perf.totalQ - 1 && engine.state !== "playing") engine.seek(v.q);
        if (mode === "resume" && v) {
          if (v.tempo) engine.setTempoFactor(v.tempo);
          if (v.loop && v.loop.endQ > v.loop.startQ) setLoop(v.loop);
          const mx = v.mix;
          if (mx) {
            if (typeof mx.hv === "boolean") setHearVoice(mx.hv);
            if (typeof mx.hp === "boolean") setHearPiano(mx.hp);
            if (typeof mx.pf === "boolean") setPianoFaded(mx.pf);
            if (mx.lines && typeof mx.lines === "object") setLineSets(mx.lines);
          }
        }
      }
    } catch {
      /* storage unavailable */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, pb.status]);
  useEffect(() => {
    if (!engine || playing) return;
    const save = () => {
      if (!restored.current) return;
      try {
        // the last position this screen showed (on leaving, the engine may already be stopped)
        const q = lastQ.current;
        // where you stopped, and how (for Home's "Pick up where you left off")
        const lb: [string, string] | null = loop ? [perf.locate(loop.startQ).number, perf.locate(Math.max(loop.startQ, loop.endQ - 0.001)).number] : null;
        const loopLineN = loop
          ? spans.findIndex((r) => {
              const a = barAt(Math.max(0, r.startQ - 0.5));
              const z = barAt(Math.max(r.startQ, r.endQ - 0.001));
              return Math.abs(a.startQ - loop.startQ) < 1e-6 && Math.abs(z.startQ + z.durQ - loop.endQ) < 1e-6;
            }) + 1
          : 0;
        localStorage.setItem(
          atKey,
          JSON.stringify({
            q,
            bar: perf.locate(q).number,
            of: perf.locate(Math.max(0, perf.totalQ - 0.001)).number,
            p: perf.totalQ ? Math.min(1, Math.max(0, q / perf.totalQ)) : 0,
            t: Date.now(),
            loop: loop ?? null,
            lb,
            loopLine: loopLineN,
            tempo: engine?.tempo ?? 1,
            mix: { hv: hearVoice, hp: hearPiano, pf: pianoFaded, lines: lineSets },
          }),
        );
      } catch {
        /* storage unavailable */
      }
    };
    save();
    return save;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, playing, Math.round(q), loop, engine?.tempo, hearVoice, hearPiano, pianoFaded, lineSets]);

  // the screen stays on while the music plays (a tablet on a music stand must not dim mid-aria)
  useEffect(() => {
    if (!playing || !("wakeLock" in navigator)) return;
    let lock: { release: () => Promise<void> } | null = null;
    let alive = true;
    const take = () =>
      (navigator as unknown as { wakeLock: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } }).wakeLock
        .request("screen")
        .then((l) => {
          if (alive) lock = l;
          else void l.release();
        })
        .catch(() => undefined);
    take();
    // the lock is dropped when the page is hidden; take it again on return
    const vis = () => document.visibilityState === "visible" && take();
    document.addEventListener("visibilitychange", vis);
    return () => {
      alive = false;
      document.removeEventListener("visibilitychange", vis);
      lock?.release().catch(() => undefined);
    };
  }, [playing]);

  // keyboard: space plays and pauses, arrows move by line
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (["INPUT", "TEXTAREA"].includes(t.tagName)) return;
      if (e.code === "Space" && t.tagName !== "BUTTON") {
        e.preventDefault();
        if (engine?.state === "playing") engine.pause();
        else play();
      }
      if (e.key === "Escape") setOpenWord(null);
      if (e.key === "ArrowLeft") stepLine(-1);
      if (e.key === "ArrowRight") stepLine(1);
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  });

  const cursorRef = useRef<() => CursorReading | null>(() => null);
  cursorRef.current = () => (engine ? { q: engine.displayQ(), show: true, playing: engine.state === "playing", label: engine.state === "playing" ? "Playing" : "You are here" } : null);
  const markerRef = useRef<() => MarkerReading | null>(() => null);
  // one flag per bar: the first note's label, and how many more there are (the panel lists them all)
  const flags: Flag[] = notes
    .filter((n, i) => notes.findIndex((x) => x.m === n.m) === i)
    .map((n) => {
      const more = notes.filter((x) => x.m === n.m).length - 1;
      return { id: n.id, m: n.m, q: n.q, kind: "note", label: more ? `${noteLabel(n)}  +${more}` : noteLabel(n) };
    });

  const loc = perf.locate(q);
  const bi = beatInfo(edition.measures[loc.m].time);
  const beat = Math.floor(loc.beat + 1e-6);
  const countLeft = engine ? engine.countInRemaining() : 0;
  // With a recorded singer the speed is one it was rendered at (100% or 70%): further re-timing would be heard.
  // Otherwise − and + move in steps of 5%.
  const singing = (lineSound === "singer" && hearVoice) || otherVoices.some((p) => instOf(p) === "singer" && hearOf(p));
  const tf0 = engine?.tempo ?? 1;
  // − and + step along a metronome's marks (♩ = 120, 126, 132 …), from the tempo of the passage you are in;
  // the whole piece moves with it, in proportion
  const printedBeat = perf.bpmAt(q) / (bi.unitQ === 2 ? 1 : bi.unitQ === 0.5 && bi.beats === 3 && perf.bpmAt(q) * 2 >= 240 ? 1.5 : bi.unitQ);
  const slower = () => engine?.setTempoFactor(singing ? SUNG_TEMPOS[0] : stepFactor(printedBeat, tf0, -1));
  const faster = () => engine?.setTempoFactor(singing ? 1 : stepFactor(printedBeat, tf0, 1));
  const canSlower = singing ? tf0 > SUNG_TEMPOS[0] + 1e-3 : tf0 > MIN_FACTOR + 1e-3;
  const canFaster = singing ? tf0 < 1 - 1e-3 : tf0 < MAX_FACTOR - 1e-3;
  // the singer starts singing (or a speed is restored): take the nearer of its speeds
  useEffect(() => {
    if (!engine || !singing || SUNG_TEMPOS.some((x) => Math.abs(x - engine.tempo) < 1e-3)) return;
    engine.setTempoFactor(engine.tempo < 0.85 ? SUNG_TEMPOS[0] : 1);
  }, [engine, singing, tf0]);
  // the speed in the beat a singer feels; in 2/2 it is given in quarter notes, as the playback mark is (a half-note glyph is not in every font)
  // a fast 3/8 is felt "in one" (Puccini's ALL.º VIVACE ♩. = 108): above 240 eighths a minute it is shown in dotted quarters
  const oneInThree = bi.unitQ === 0.5 && bi.beats === 3 && perf.bpmAt(q) * 2 >= 240;
  const shownQ = bi.unitQ === 2 ? 1 : oneInThree ? 1.5 : bi.unitQ;
  const beatSymbol = shownQ === 1.5 ? "♩." : shownQ === 0.5 ? "♪" : "♩";
  const beatBpm = Math.round((perf.bpmAt(q) / shownQ) * (engine?.tempo ?? 1));
  const printedBpm = Math.round(perf.bpmAt(q) / shownQ);
  const asPrinted = Math.abs((engine?.tempo ?? 1) - 1) < 1e-3;
  const tempoLabel = asPrinted ? `Tempo ${beatBpm} beats a minute, as printed` : `Tempo ${beatBpm} beats a minute. Back to the printed ${printedBpm}`;
  const deviceVoice = voiceInfo(false).kind === "device";
  const [finished, setFinished] = useState(false);
  const lastPlayingQ = useRef(0);
  useEffect(() => {
    if (!engine) return;
    let wasPlaying = engine.state === "playing";
    const iv = setInterval(() => {
      if (engine.state === "playing") lastPlayingQ.current = engine.displayQ();
    }, 150);
    const off = engine.subscribe(() => {
      const st = engine.state;
      if (wasPlaying && st === "stopped" && lastPlayingQ.current > perf.totalQ - 4) setFinished(true);
      if (st === "playing") setFinished(false);
      wasPlaying = st === "playing";
    });
    return () => {
      clearInterval(iv);
      off();
    };
  }, [engine, perf]);
  // facts for the context panel, read from the score itself where possible
  const range = useMemo(() => {
    const midis = perf.notes.filter((n) => n.part === voicePart.key).map((n) => n.midi);
    const name = (m: number) => `${["C", "D♭", "D", "E♭", "E", "F", "G♭", "G", "A♭", "A", "B♭", "B"][m % 12]}${Math.floor(m / 12) - 1}`;
    return midis.length ? `${name(Math.min(...midis))} – ${name(Math.max(...midis))}` : "";
  }, [perf]);

  useEffect(() => {
    (window as unknown as Record<string, unknown>).__cp = { perf, layout: () => layoutRef.current, engine, currentQ, port: pb.port, natural: () => naturalRef.current, zoom: () => effZoomRef.current };
  });

  const wordCard = (lineId: string, k: number, close: () => void) => {
    const line = phrases.find((p) => p.id === lineId);
    const w = line?.words[k];
    if (!line || !w) return null;
    const groups = line.glossGroups.filter((g) => g.words.includes(k));
    const key = `${lineId}:${k}`;
    return (
      <>
        <div className="wc-head">
          <span className="wc-word" lang={LANG}>
            {curly(w.text.replace(/[.,;:!?]+$/, ""))}
          </span>
          <button type="button" className="cp-icon-btn cp-icon-btn--ghost" aria-label="Close" onClick={close}>
            {Icon.close}
          </button>
        </div>
        <div className="wc-ipa" lang="it-fonipa">
          [{w.ipa}]
        </div>
        {(tips.byWord.get(`${lineId}:${k}`) ?? []).map((t) => (
          <p key={t.id} className="wc-tip">
            {Icon.tip}
            <span>
              <b>{t.title}.</b> {t.body}
            </span>
          </p>
        ))}
        <div className="wc-mean">{w.gloss}</div>
        {groups.map((g, i) => (
          <div key={i} className="wc-group">
            ↳ {g.gloss}
          </div>
        ))}
        <div className="wc-line">
          <span className="cp-eyebrow">Whole line</span>
          <span>{curly(line.translation)}</span>
        </div>
        <div className="wc-actions">
          {wordUrl(w.text) ? (
            <button type="button" className="cp-btn cp-btn--ink" onClick={() => sayWord(key, w.text)} aria-pressed={speakingWord === key}>
              {Icon.speaker} Hear the word
            </button>
          ) : deviceVoice ? (
            <>
              <button type="button" className="cp-btn cp-btn--ink" onClick={() => sayWord(key, w.text)} aria-pressed={speakingWord === key}>
                {Icon.speaker} Hear the word
              </button>
              <button type="button" className="cp-btn" onClick={() => sayWord(key, w.text, true)}>
                Slowly
              </button>
            </>
          ) : (
            <>
              <button type="button" className="cp-btn cp-btn--ink" onClick={() => sayPhrase(lineId)}>
                {Icon.speaker} Hear the line
              </button>
              <span className="wc-note">This device has no {ORIGINAL} voice for single words.</span>
            </>
          )}
        </div>
      </>
    );
  };

  // a tapped word opens its card under it, kept on screen
  const openWordAt = (lineId: string, k: number, el: HTMLElement) => {
    const pr = (el.offsetParent as HTMLElement | null)?.getBoundingClientRect() ?? { left: 0 };
    const cardW = Math.min(360, window.innerWidth - 32);
    const want = pr.left + el.offsetLeft + el.offsetWidth / 2 - cardW / 2;
    const left = Math.max(16, Math.min(want, window.innerWidth - 16 - cardW)) - pr.left;
    setOpenWord((o) => (o?.lineId === lineId && o.k === k ? null : { lineId, k, left, top: el.offsetTop + el.offsetHeight + 10 }));
  };
  /**
   * One line's words. prog: how far the line has been sung: letters already sung in full ink, the
   * syllable(s) on the sounding note lit, the rest of the line lighter until it is sung. Two syllables
   * joined on one note across a word gap (an elision, "vo’‿an") are lit as one shape, in their own colour,
   * and always carry the tie mark ‿ between the words.
   * tip: the tip whose letters to mark in this line (null: none).
   */
  const lineWords = (ph: (typeof spans)[number]["ph"], prog: SylProgress | null, tip: string | null = null) => {
    const syl = sylRanges.get(ph.id) ?? [];
    // word gaps closed by an elision: the last syllable of word k-1 and the first of word k share a note
    const joinAt = new Map<number, { left: number; right: number }>();
    syl.forEach((a, i) => {
      const b = syl[i + 1];
      if (b && b.noteId === a.noteId && b.word === a.word + 1) joinAt.set(b.word, { left: i, right: i + 1 });
    });
    const joined = new Set([...joinAt.values()].flatMap((j) => [j.left, j.right]));
    // words sung again at the end of the line are shown once, followed by how many times
    const rep = trailingRepeat(ph.words.map((w) => w.text));
    const blockOf = (k: number) => (rep && k >= rep.head ? Math.floor((k - rep.head) / rep.len) : 0);
    let rc = 0;
    if (rep && prog) {
      const now = syl.findIndex((r, i) => prog.now.has(i) && r.word >= rep.head);
      if (now >= 0) rc = blockOf(syl[now].word);
      else syl.forEach((r, i) => prog.done.has(i) && r.word >= rep.head && (rc = Math.max(rc, blockOf(r.word))));
    }
    const shownWords = rep ? ph.words.slice(0, rep.head + rep.len) : ph.words;
    const out = shownWords.map((_, j) => {
      const k = rep && j >= rep.head ? j + rc * rep.len : j;
      const w = ph.words[k];
      const ranges: Deco[] = [];
      if (tip) for (const m of tips.marks.get(`${ph.id}:${k}`) ?? []) if (m.tip === tip) ranges.push({ from: m.from, to: m.to, cls: "w-mark anchor" });
      const mine = syl.map((r, i) => ({ r, i })).filter(({ r }) => r.word === k);
      const text = curly(w.text);
      for (const { r, i } of mine) {
        if (!prog) continue;
        const lit = prog.now.has(i);
        if (!lit && !prog.done.has(i)) continue;
        // a joined syllable reaches the word's edge, so the shape runs on through the apostrophe and the gap
        const atJoin = joined.has(i);
        const from = atJoin && joinAt.get(k)?.right === i ? 0 : r.from;
        const to = atJoin && joinAt.get(k + 1)?.left === i ? text.length : r.to;
        ranges.push({ from, to, cls: lit ? (atJoin ? `syl-join${joinAt.get(k)?.right === i ? " syl-join-r" : " syl-join-l"}` : "syl-now") : "syl-done" });
      }
      const sung = !!prog && mine.length > 0 && mine.every(({ i }) => prog.done.has(i));
      const lit = !!prog && mine.some(({ i }) => prog.now.has(i));
      const join = joinAt.get(k);
      const joinOn = !!prog && !!join && prog.now.has(join.left);
      return (
        <span key={`${ph.id}:${j}`}>
          {j > 0 &&
            (join && !(rep && j === rep.head && rc > 0) ? (
              <span className={`w-join${joinOn ? " on" : ""}`} title="Sung together on one note">
                {"\u203F"}
              </span>
            ) : tip === "link" && tips.links.has(`${ph.id}:${k - 1}`) ? (
              <span className="w-tie"> </span>
            ) : (
              " "
            ))}
          <button
            type="button"
            className={`now-word${sung ? " w-done" : ""}${lit ? " sung" : ""}${spokenWord?.lineId === ph.id && spokenWord.k === k ? " spoken" : ""}${openWord?.lineId === ph.id && openWord.k === k ? " open" : ""}`}
            aria-label={`${w.text}: show meaning`}
            onClick={(e) => {
              e.stopPropagation();
              openWordAt(ph.id, k, e.currentTarget);
            }}
          >
            {decorate(text, ranges)}
          </button>
        </span>
      );
    });
    if (rep)
      out.push(
        <span key="rep" className={`w-rep${prog && rc > 0 ? " on" : ""}`} title={`Sung ${rep.times} times`}>
          {prog && rc > 0 ? `${rc + 1}/${rep.times}` : `×${rep.times}`}
        </span>,
      );
    return out;
  };
  const cardFor = (lineId: string, extra = "") =>
    openWord?.lineId === lineId ? (
      <div className={`word-card ${extra}`} style={{ left: openWord.left, top: openWord.top }} role="dialog" aria-label="Word meaning" onClick={(e) => e.stopPropagation()}>
        {wordCard(lineId, openWord.k, () => setOpenWord(null))}
      </div>
    ) : null;

  // the words view: every line, with the piano's bars between them
  const blocks = useMemo(() => {
    type Block = { kind: "gap"; key: string; startQ: number; endQ: number; label: string } | { kind: "line"; key: string; i: number };
    const out: Block[] = [];
    let prevEnd = 0;
    const minGap = allWords ? 7.9 : 2.9;
    spans.forEach((sp, i) => {
      if (sp.startQ - prevEnd >= (i === 0 ? 2.9 : minGap))
        out.push({ kind: "gap", key: `gap-${i}`, startQ: prevEnd, endQ: sp.startQ, label: i === 0 ? (ens ? "Introduction" : "Piano introduction") : ens ? "Rest" : "Piano" });
      out.push({ kind: "line", key: sp.ph.id, i });
      prevEnd = Math.max(prevEnd, sp.endQ);
    });
    if (perf.totalQ - prevEnd >= 2.9) out.push({ kind: "gap", key: "gap-end", startQ: prevEnd, endQ: perf.totalQ, label: ens ? "Ending" : "Piano ending" });
    return out;
  }, [spans, perf, allWords]);
  const barsOf = (a: number, b: number) => {
    const m0 = edition.measures[perf.locate(a).m].number;
    const m1 = edition.measures[perf.locate(Math.max(a, b - 0.01)).m].number;
    return m0 === m1 ? `bar ${m0}` : `bars ${m0}–${m1}`;
  };
  const activeKey = (() => {
    if (current.sounding) return spans[current.idx].ph.id;
    const gap = blocks.find((b) => b.kind === "gap" && q >= b.startQ - 1e-6 && q < b.endQ - 1e-6);
    return gap ? gap.key : spans[current.idx].ph.id;
  })();
  const wordsRef = useRef<HTMLDivElement>(null);
  const wordsTouched = useRef(0);
  useEffect(() => {
    const box = wordsRef.current;
    if (!box || view === "music") return;
    if (performance.now() - wordsTouched.current < 3000) return;
    const el = box.querySelector<HTMLElement>(`[data-key="${activeKey}"]`);
    if (!el) return;
    // keep the line being sung in the upper third, so the lines coming next are in view
    box.scrollTo({ top: Math.max(0, el.offsetTop - box.clientHeight * 0.3), behavior: playing ? "smooth" : "auto" });
  }, [activeKey, view, playing]);
  // when you scroll away from the line being sung, a pill takes you back to it
  const [wordsAway, setWordsAway] = useState<"up" | "down" | null>(null);
  const checkAway = () => {
    const box = wordsRef.current;
    const el = box?.querySelector<HTMLElement>(`[data-key="${activeKey}"]`);
    if (!box || !el) return setWordsAway(null);
    const top = el.offsetTop - box.scrollTop;
    setWordsAway(top + el.offsetHeight < 60 ? "up" : top > box.clientHeight - 80 ? "down" : null);
  };
  useEffect(checkAway, [activeKey, view]);
  const backToNow = () => {
    const box = wordsRef.current;
    const el = box?.querySelector<HTMLElement>(`[data-key="${activeKey}"]`);
    wordsTouched.current = 0;
    if (box && el) box.scrollTo({ top: Math.max(0, el.offsetTop - box.clientHeight * 0.3), behavior: "smooth" });
  };

  const status = countLeft ? `Count-in ${countLeft}` : pb.status === "loading" ? "Loading the piano…" : preparing ? "Loading the voices…" : null;
  const qNow = Math.max(0, q);
  const tf = engine?.tempo ?? 1;
  // a rest while playing: how many beats until your next line (the panel counts you in on the last three)
  const restBeats = playing && !current.sounding && shown.startQ > q ? (perf.qToSec(shown.startQ) - perf.qToSec(q)) / tf / (60 / Math.max(20, beatBpm)) : 0;
  const resting = restBeats > 0;
  const restLit = Math.min(3, Math.max(0, 4 - Math.ceil(restBeats)));
  const total = perf.totalSec;
  const frac = (pq: number) => Math.min(1, Math.max(0, perf.qToSec(Math.max(0, pq)) / total));
  const pct = frac(qNow) * 100;

  // the progress line: tap or drag to move through the aria
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const seekAt = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const f = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    goTo(perf.secToQ(f * total));
  };

  /* ------------------------------------------------------------------------------------------------
     The guide: the first time a piece opens, a short rehearsal done for real. Each step lights one control
     (the rest dims and does not respond), says what to do, and moves on when you have done it. At the end
     (or on skipping) everything goes back as it was.
     ------------------------------------------------------------------------------------------------ */
  type GuideStep = { id: string; part: string; sel: string[]; title: string; text: string; done?: () => boolean; holeRight?: number; skipIf?: () => boolean; /** menus or panels this step opens: lit with it, and left open; any other is closed when the step begins */ pops?: string; /** said once the step is done, while you see or hear what changed */ after?: string; /** how long that moment lasts (ms) */ dwell?: number };
  // a step that changes half-way (the guide muted, then brought back) re-reads itself
  const [, forceGuide] = useState(0);
  const [guide, setGuide] = useState<number>(() => {
    try {
      return localStorage.getItem(TIPS_KEY) ? -2 : -1;
    } catch {
      return -2;
    }
  });
  const [guideOk, setGuideOk] = useState(false);
  const guideStart = useRef<{ idx: number; pianoShown: boolean; hearVoice: boolean; loop: typeof loop; view: View; tempo: number; hadLoop: string | null; shown: string; shows: Record<string, boolean>; notes: number; noteIds: string[]; lineSets: Record<string, LineSet>; pianoFaded: boolean; hearPiano: boolean; vol: { voice: number; piano: number } } | null>(null);
  const pianoShownNow = showOf(pianoPart);
  const firstBar = perf.measures[0];
  // what has happened during the current step: music heard, a loop gone round, the line or a word spoken, a line hidden
  const gTrack = useRef<{ handleLet: boolean; loopAt: number | null; [k: string]: unknown } & Record<string, any>>({ handleLet: false, loopAt: null, mutedSeen: false, played: false, wrapped: false, spoke: false, wordSpoke: false, noteOpened: false, hidOnce: false, slowOnce: false, muteOnce: false, otherOnce: false, sawWords: false, lastQ: 0 });
  const steps: GuideStep[] = [
    { id: "listen", part: "Listen", sel: ['.bar-transport [data-testid="play"]', '.bar-transport [data-testid="pause"]'], title: "Press play and listen", text: "The lit word follows the music. Press pause when you’re ready.", done: () => gTrack.current.played && !playing },
    { id: "say", part: "The words", sel: [".now-listen"], title: "Hear the line spoken", text: "Tap the speaker. The tortoise says it slowly.", done: () => gTrack.current.spoke && !speakingId },
    { id: "word", part: "The words", sel: [".word-card .wc-actions .cp-btn--ink", ".now-it"], title: "Hear a word", text: openWord ? "Tap Hear the word." : "Tap any word in the line.", done: () => gTrack.current.wordSpoke && !speakingWord },
    { id: "loop", part: "Work on a passage", sel: [".bar-loop"], title: "Loop a passage", text: "Tap Loop. The bar you’re on is marked and will repeat.", done: () => !!loop },
    { id: "edge", part: "Work on a passage", sel: [".ov-lh-e", ".ov-lh-s"], title: "Choose the bars", text: "Drag the lit purple handle outwards, along the music, to take in more bars.", done: () => gTrack.current.handleLet && !gTrack.current.holding && !!loop && gTrack.current.loopAt !== null && loop.endQ - loop.startQ > gTrack.current.loopAt + 1e-6 },
    { id: "playloop", part: "Work on a passage", sel: ['.bar-transport [data-testid="play"]', '.bar-transport [data-testid="pause"]'], title: "Play the loop", text: "Press play and listen for it to come round.", after: "It repeats until you stop it. Leave it playing.", dwell: 3000, done: () => gTrack.current.wrapped },
    { id: "unloop", part: "Work on a passage", sel: [".bar-loop"], title: "Stop looping", text: "Tap Loop again. The music carries on from there, through the whole piece.", after: "Back to the whole piece. Leave it playing.", dwell: 2500, done: () => !loop },
    { id: "more", part: "Work on a passage", sel: [".bar-more"], title: "More controls", text: "Tap the arrow to open them. The music keeps playing.", done: () => barOpen, skipIf: () => barOpen || !window.matchMedia("(max-width: 640px)").matches },
    { id: "slower", part: "Work on a passage", sel: ['[aria-label="Slower"]:not([disabled])', '[aria-label="Slower"]'], title: "Make it easier", text: "Tap − to slow it down while it plays.", after: "Slower, at the same pitch. Tap − again for slower still, + to speed up.", dwell: 5000, done: () => !!guideStart.current && (engine?.tempo ?? 1) < guideStart.current.tempo - 0.01 },
    gTrack.current.mutedSeen
      ? { id: "mute", part: "Work on a passage", pops: ".face-menu", sel: faceMenu ? [".face-menu .fm-hear"] : [".bar-parts > .part:first-child"], title: "Bring the guide back", text: faceMenu ? "Tap “Play my line”." : "Sing a little into the gap. Then tap your face to bring your line back.", after: "Your line is back on the piano. Mute it whenever you want to sing alone.", dwell: 3000, done: () => hearVoice }
      : { id: "mute", part: "Work on a passage", pops: ".face-menu", sel: faceMenu ? [".face-menu .fm-hear"] : [".bar-parts > .part:first-child"], title: "Sing it yourself", text: faceMenu ? "Tap “Mute: I sing it”." : "Your line plays softly on the piano as a guide. To sing it yourself, tap your face.", done: () => false },
    { id: "others", part: "Work on a passage", pops: ".face-menu", sel: faceMenu ? [".face-menu .fm-hear"] : [".bar-others .part:first-child"], title: "Add another singer", text: faceMenu ? "Tap “Play this line”." : "The other roles are silent until you want them. Tap a face to add one.", after: "Now they sing with you. Hold a face to choose their sound.", dwell: 5000, done: () => otherVoices.some((p) => lineSets[p.key]?.hear === true), skipIf: () => otherVoices.length === 0 },
    { id: "words", part: "Your score", sel: gTrack.current.sawWords ? [".view-switch button:first-child"] : [".view-switch button:nth-child(2)"], title: gTrack.current.sawWords ? "Read, then come back" : "The whole text", text: gTrack.current.sawWords ? "Every line, with its translation. Take your time; tap Music when you’re done." : "Tap Words to see every line of the piece with its translation.", done: () => gTrack.current.sawWords && view === "music" },
    { id: "arrange", part: "Your score", pops: ".mix-pop", sel: [".mix-btn:not(.notes-btn)"], title: "Arrange", text: "Tap Arrange: each line’s sound, volume and order, and what shows in the score.", done: () => mixOpen },
    { id: "volume", part: "Your score", pops: ".mix-pop", sel: mixOpen ? [".mix-line:has(.part-face.piano) .mix-line-vol"] : [".mix-btn:not(.notes-btn)"], title: "Balance the piano", text: mixOpen ? "The music is playing. Drag the piano’s slider left to make it softer." : "Tap Arrange again.", after: "Softer piano, same voices. Every line has its own slider.", dwell: 4000, done: () => !!guideStart.current && Math.abs(vol.piano - guideStart.current.vol.piano) >= 10 },
    { id: "hide", part: "Your score", pops: ".mix-pop", sel: mixOpen ? [".mix-line:has(.part-face.piano) .mix-toggles button:nth-child(2)"] : [".mix-btn:not(.notes-btn)"], title: "Read only the voices", text: mixOpen ? "Tap the eye on the piano’s row." : "Tap Arrange again.", after: "The piano part has left the score; it still plays. Tap its eye again any time to bring it back.", dwell: 5000, done: () => !showOf(pianoPart) },
    { id: "notes", part: "Your score", pops: noteEdit ? ".note-card" : undefined, sel: noteEdit ? [".note-card"] : notePick ? [".score-scroll"] : [".notes-btn"], title: "Write a note", text: noteEdit ? "Write your note, then Save. Or close the card." : notePick ? "Now tap the bar your note is for." : "Tap Notes, then choose a bar.", after: "Your note sits over its bar. Tap it any time to change it.", dwell: 3500, done: () => !!guideStart.current && (notes.length > guideStart.current.notes || (!noteEdit && gTrack.current.noteOpened)) },
  ];
  const step = guide >= 0 ? steps[guide] : null;
  // the step as it reads now (a step can change half-way: slower, then back to speed), for code that runs on a timer
  const stepNow = useRef(step);
  stepNow.current = step;
  // where the music stood when a step began (a step done by moving through the piece compares with it)
  const guideQ = useRef<number | null>(null);
  // what has happened during this step: music heard, a loop gone round, the line or a word spoken
  // steps that do not apply on this screen, settled when the tour starts (for the count)
  const guideSkip = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (guide < 0) return;
    const t = gTrack.current;
    if (playing && guideQ.current !== null && Math.abs(q - guideQ.current) > 1) t.played = true;
    if (playing && q < t.lastQ - 0.5) t.wrapped = true;
    t.lastQ = q;
    if (speakingId) t.spoke = true;
    if (speakingWord) t.wordSpoke = true;
    if (noteEdit) t.noteOpened = true;
    if (view === "words") t.sawWords = true;
    if (steps[guide]?.id === "mute" && !hearVoice && !t.mutedSeen) {
      t.mutedSeen = true;
      forceGuide((x) => x + 1);
    }
    if (guideStart.current && JSON.stringify(orderedIds.map((x) => showOf(partByXml(x)))) !== guideStart.current.shown) t.hidOnce = true;
    if (guideStart.current && (engine?.tempo ?? 1) < guideStart.current.tempo - 0.01) t.slowOnce = true;
    if (guideStart.current && hearVoice !== guideStart.current.hearVoice) t.muteOnce = true;
    if (otherVoices.some((p) => lineSets[p.key]?.hear === true)) t.otherOnce = true;
  });
  useEffect(() => {
    gTrack.current = { handleLet: false, loopAt: loop ? loop.endQ - loop.startQ : null, mutedSeen: false, played: false, wrapped: false, spoke: false, wordSpoke: false, noteOpened: false, hidOnce: false, slowOnce: false, muteOnce: false, otherOnce: false, sawWords: false, lastQ: q };
    guideQ.current = guide >= 0 ? q : null;
    // the loop is set: put the strip away so the bar is clear for playing
    if (guide >= 0 && steps[guide]?.id === "playloop") setLoopHint(false);
    // the loop part is over: the singing steps play the music straight on, without the loop
    // the practising starts on the score (the words step left the full text open)
    if (guide >= 0 && steps[guide]?.id === "loop") setView("music");
    // making it yours starts quiet: the loop and the music stop
    // your score: the music rests while you read and arrange
    if (guide >= 0 && steps[guide]?.part === "Your score" && steps[guide]?.id !== "volume" && engine?.state === "playing") engine.pause();
    // balancing the piano is done by ear: the music plays while you drag
    if (guide >= 0 && steps[guide]?.id === "volume" && engine && engine.state !== "playing") void play();
    // each step starts clean: a menu or panel left open by an earlier step (Arrange, a face's menu, the note card)
    // closes, unless this step is about it
    if (guide >= 0) {
      const pops = steps[guide]?.pops ?? "";
      if (!pops.includes("mix-pop")) setMixOpen(false);
      if (!pops.includes("face-menu")) setFaceMenu(null);
      if (!pops.includes("hold-menu")) setHoldMenu(null);
      if (steps[guide]?.id !== "notes") {
        setNoteEdit(null);
        setNotePick(false);
      }
    }
    // on a phone the practising controls live in the folded bar: keep it open from here on, even if "More controls" was passed over
    if (guide >= 0 && guide > steps.findIndex((g) => g.id === "more") && !barOpen) setBarOpen(true);
    if (guide >= 0 && steps[guide]?.id === "edge" && !loop) {
      const pm = barAt(Math.max(0, q));
      setLoop({ startQ: pm.startQ, endQ: pm.startQ + pm.durQ });
      gTrack.current.loopAt = pm.durQ;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guide]);
  const putBack = () => {
    const g = guideStart.current;
    if (engine?.state === "playing") engine.pause();
    setOpenWord(null);
    if (g) {
      setHearVoice(g.hearVoice);
      setLineSets(g.lineSets);
      setPianoFaded(g.pianoFaded);
      setHearPiano(g.hearPiano);
      setVol(g.vol);
      // a note written to try it out goes again: only the notes you had before the tour stay
      const kept = loadNotes().filter((n) => g.noteIds.includes(n.id));
      setNotes(kept);
      saveNotes(kept);
      setMixOpen(false);
      setNotePick(false);
      setNoteEdit(null);
      setView(g.view);
      engine?.setTempoFactor(g.tempo);
      setLoop(g.loop);
      setLoopHint(false);
      try {
        if (g.hadLoop) localStorage.setItem(loopKey, g.hadLoop);
        else localStorage.removeItem(loopKey);
      } catch {
        /* storage unavailable */
      }
      setSavedLoop(g.hadLoop ? JSON.parse(g.hadLoop) : null);
    }
  };
  const endGuide = (put = true) => {
    if (put) putBack();
    setGuide(-2);
    try {
      localStorage.setItem(TIPS_KEY, "1");
    } catch {
      /* storage unavailable */
    }
  };
  const startGuide = () => {
    let hadLoop: string | null = null;
    try {
      hadLoop = localStorage.getItem(loopKey);
    } catch {
      /* storage unavailable */
    }
    guideStart.current = { idx: current.idx, pianoShown: pianoShownNow, hearVoice, loop, view, tempo: engine?.tempo ?? 1, hadLoop, shown: JSON.stringify(orderedIds.map(() => true)), shows: {}, notes: notes.length, noteIds: notes.map((n) => n.id), lineSets, pianoFaded, hearPiano, vol };
    // every tour starts from the same picture, aria or ensemble: every line and the piano shown in the score (the
    // piano faded, as usual), your line playing softly on the piano, the other singers silent, the piano playing,
    // full speed. What you had is kept and comes back at the end.
    setLineSets(Object.fromEntries(orderedIds.map((x) => [partByXml(x).key, { show: true }])));
    setPianoFaded(true);
    setHearPiano(true);
    setHearVoice(true);
    engine?.setTempoFactor(1);
    guideSkip.current = new Set(steps.filter((g) => g.skipIf?.()).map((g) => g.id));
    setLoop(null);
    setView("music");
    setGuide(0);
  };
  const advance = (from: number) => {
    let n = from + 1;
    while (n < steps.length && steps[n].skipIf?.()) n++;
    // the passage repeats; leave it playing on a step that needs no sound, and close a word card left open
    setOpenWord(null);
    // the last step done: put everything back now, so the closing card's "back as they were" is already true
    if (n >= steps.length) putBack();
    setGuide(n < steps.length ? n : steps.length);
  };
  // moving through the steps by hand, either way (a step that does not apply here is passed over)
  const lastStep = (() => {
    let n = steps.length - 1;
    while (n > 0 && guideSkip.current.has(steps[n].id)) n--;
    return n;
  })();
  const firstStep = (from: number) => {
    let n = from - 1;
    while (n >= 0 && guideSkip.current.has(steps[n].id)) n--;
    return n < 0;
  };
  const goBackStep = (from: number) => {
    let n = from - 1;
    while (n >= 0 && guideSkip.current.has(steps[n].id)) n--;
    if (n < 0) return;
    if (engine?.state === "playing") engine.pause();
    setOpenWord(null);
    setGuideOk(false);
    setGuide(n);
  };
  const nextStep = () => {
    if (engine?.state === "playing") engine.pause();
    setGuideOk(false);
    advance(guide);
  };
  // the tour again, from anywhere (the end card, the Show menu): what was changed goes back first
  const replayGuide = () => {
    if (guide >= 0 || guide === steps.length) putBack();
    setCardMenu(null);
    window.setTimeout(startGuide, 0);
  };
  // a step done: a tick for a moment, then the next one
  useEffect(() => {
    if (step && !guideOk && step.done?.()) setGuideOk(true);
  });
  useEffect(() => {
    if (!guideOk) return;
    // the piano gone from the score: Arrange closes so you see the score without it while the card explains
    if (steps[guide]?.id === "hide") setMixOpen(false);
    const t = window.setTimeout(() => {
      setGuideOk(false);
      advance(guide);
    }, steps[guide]?.dwell ?? 700);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guideOk, guide]);
  // where the lit control is, and where the card goes
  // the control the current step lights, the only one that answers while the step waits
  const litEl = useRef<HTMLElement | null>(null);
  const [guideBox, setGuideBoxRaw] = useState<{ hole: { x: number; y: number; w: number; h: number }; left: number; top: number; above: boolean; w: number } | null>(null);
  // the light is re-measured every 300 ms; only a real move re-draws the screen (a fresh object each time would
  // re-render the whole practice page, score included, three times a second)
  const setGuideBox = (b: typeof guideBox) => setGuideBoxRaw((prev) => (JSON.stringify(prev) === JSON.stringify(b) ? prev : b));
  useLayoutEffect(() => {
    if (!step) {
      setGuideBox(null);
      return;
    }
    const place = () => {
      const seen = (e: Element | null): e is HTMLElement => !!e && (e as HTMLElement).getClientRects().length > 0 && getComputedStyle(e).display !== "none" && getComputedStyle(e).visibility !== "hidden";
      // a control the guide points at must be on the screen with room to use it (a loop edge at the very edge of a phone is not)
      const onScreen = (e: Element) => {
        const b = e.getBoundingClientRect();
        return b.left >= 8 && b.right <= window.innerWidth - 8 && b.bottom > 0 && b.top < window.innerHeight;
      };
      const st = stepNow.current ?? step;
      const cands = st.sel.flatMap((q) => [...document.querySelectorAll(q)]).filter(seen);
      const el = cands.find(onScreen) ?? cands[0];
      litEl.current = el ?? null;
      if (!el) {
        const w = Math.min(340, window.innerWidth - 32);
        setGuideBox({ hole: { x: -9999, y: -9999, w: 0, h: 0 }, left: (window.innerWidth - w) / 2, top: window.innerHeight / 2 - 100, above: false, w });
        return;
      }
      let r: { left: number; top: number; width: number; height: number } = el.getBoundingClientRect();
      // a menu or panel opened from the lit control (your face's menu, Arrange, the note card) is part of the step:
      // the light takes it in, and the card moves out of its way
      for (const pop of st.pops ? document.querySelectorAll(st.pops) : []) {
        // a control inside the menu is lit on its own: the light goes on just that button
        if (!seen(pop) || pop.contains(el)) continue;
        const pr = pop.getBoundingClientRect();
        const l = Math.min(r.left, pr.left), t = Math.min(r.top, pr.top);
        r = { left: l, top: t, width: Math.max(r.left + r.width, pr.right) - l, height: Math.max(r.top + r.height, pr.bottom) - t };
      }
      const pad = 6;
      // room to drag: to the right of an end edge, to the left of a start edge
      const extra = st.holeRight ?? 0;
      const leftward = el.classList.contains("ov-lh-s");
      const hx = Math.max(4, r.left - pad - (leftward ? extra : 0));
      const hole = { x: hx, y: Math.max(4, r.top - pad), w: Math.min(window.innerWidth - 8 - hx, r.width + pad * 2 + extra), h: Math.min(window.innerHeight - 8, r.height + pad * 2) };
      const w = Math.min(340, window.innerWidth - 32);
      const cx = hole.x + hole.w / 2;
      const left = Math.max(16, Math.min(cx - w / 2, window.innerWidth - 16 - w));
      const below = hole.y + hole.h + 210 < window.innerHeight;
      const aboveOk = hole.y - 12 > 200;
      // no room above or below (a tall panel): the card goes beside the light, on the side with more room
      if (!below && !aboveOk) {
        const rightRoom = window.innerWidth - (hole.x + hole.w);
        if (rightRoom >= w + 24 || hole.x - w - 12 >= 16) {
          setGuideBox({ hole, left: rightRoom >= w + 24 ? hole.x + hole.w + 12 : hole.x - w - 12, top: 16, above: false, w });
          return;
        }
        // a panel filling the screen (Arrange on a phone): the card goes to the top or the bottom, wherever it
        // leaves the control you are asked to tap uncovered
        const tr = el.getBoundingClientRect();
        const cardH = 190;
        const atTop = tr.top > cardH + 24;
        setGuideBox({ hole, left, top: atTop ? 12 : window.innerHeight - 12, above: !atTop, w });
        return;
      }
      // the card rests at the top of the screen, clear of the music and the words; only when the control it points
      // at is up there too does it sit just under that control instead
      const centred = Math.max(16, (window.innerWidth - w) / 2);
      // on a phone the top of the screen is the line of words; a control down in the practice bar gets its card just
      // above the bar instead, over the lower score, so the words stay in sight
      const pbar = document.querySelector(".p-bar");
      const overBar = pbar ? Math.min(pbar.getBoundingClientRect().top, hole.y) - 8 : 0;
      if (window.innerWidth <= 640 && pbar && (pbar.contains(el) || !!el.closest(".face-menu")) && !el.closest(".mix-pop") && overBar > 220) {
        setGuideBox({ hole, left: centred, top: overBar, above: true, w });
        return;
      }
      if (hole.y > 210) setGuideBox({ hole, left: centred, top: 12, above: false, w });
      else setGuideBox({ hole, left, top: hole.y + hole.h + 12, above: false, w });
    };
    place();
    const t = window.setInterval(place, 300);
    window.addEventListener("resize", place);
    return () => {
      window.clearInterval(t);
      window.removeEventListener("resize", place);
    };
  }, [guide, view, barOpen, !!loop, playing, notePick, !!noteEdit, mixOpen, !!faceMenu, step?.title, step?.sel.join(",")]);
  // only the lit control (and the guide's card) answers while a step waits
  // the loop step is done when a handle has been dragged and let go (not while it is still moving)
  useEffect(() => {
    if (step?.id !== "edge") return;
    let held = false;
    const down = (e: PointerEvent) => {
      if ((e.target as Element | null)?.closest?.(".ov-lh")) {
        held = true;
        gTrack.current.holding = true;
      }
    };
    const up = () => {
      if (!held) return;
      held = false;
      window.setTimeout(() => {
        gTrack.current.holding = false;
        gTrack.current.handleLet = true;
        forceGuide((x) => x + 1);
      }, 60);
    };
    document.addEventListener("pointerdown", down, true);
    window.addEventListener("pointerup", up, true);
    window.addEventListener("pointercancel", up, true);
    return () => {
      document.removeEventListener("pointerdown", down, true);
      window.removeEventListener("pointerup", up, true);
      window.removeEventListener("pointercancel", up, true);
    };
  }, [step?.id]);
  // the step is the one thing to do: a tap anywhere else does nothing, and the lit control gives a nudge instead.
  // Scrolling and reading stay free; the card (End tour) always answers.
  useEffect(() => {
    if (!step) return;
    const usesPop = step.id === "notes";
    const allowed = (t: EventTarget | null) => {
      if (!(t instanceof Node)) return false;
      const n = t instanceof Element ? t : t.parentElement;
      if (!n) return false;
      if (n.closest(".tip")) return true;
      if (litEl.current && litEl.current.contains(n)) return true;
      if (usesPop && step.pops && n.closest(step.pops)) return true;
      // the loop is stretched by either of its handles
      if (step.id === "edge" && n.closest(".ov-lh")) return true;
      return false;
    };
    const nudge = () => {
      const h = document.querySelector(".guide-hole");
      if (!h) return;
      h.classList.remove("nudge");
      void (h as HTMLElement).offsetWidth;
      h.classList.add("nudge");
    };
    const stop = (e: Event) => {
      if (allowed(e.target)) return;
      e.stopPropagation();
      // a press only reaches the app's own handlers, so stopping it is enough and the page still scrolls; a click, and
      // a press on a slider or a menu, are stopped for good
      const native = (e.target as Element | null)?.closest?.("input, select, textarea, label");
      if (e.type === "click" || e.type === "dblclick" || e.type === "contextmenu" || native) e.preventDefault();
      if (e.type === "pointerdown") nudge();
    };
    const key = (e: KeyboardEvent) => {
      // typing a note, and Tab / Escape, are left alone; the practice shortcuts wait for the tour
      if (e.key === "Tab" || e.key === "Escape" || allowed(e.target)) return;
      if ((e.target as Element | null)?.closest?.("textarea, input")) return;
      e.preventDefault();
      e.stopPropagation();
    };
    const evs = ["pointerdown", "mousedown", "touchstart", "click", "dblclick", "contextmenu"] as const;
    for (const t of evs) document.addEventListener(t, stop, { capture: true, passive: false });
    document.addEventListener("keydown", key, true);
    return () => {
      for (const t of evs) document.removeEventListener(t, stop, { capture: true });
      document.removeEventListener("keydown", key, true);
    };
  }, [step]);
  const guideUi =
    guide === -1 && pb.status === "ready" ? (
      <div className="guide-intro" role="dialog" aria-modal="true" aria-labelledby="guide-h">
        <div className="tip guide-intro-card">
          <p>
            <strong className="tip-title" id="guide-h">
              Take a quick tour?
            </strong>
            One minute. You’ll try each control once.
          </p>
          <div className="tip-actions">
            <button type="button" className="cp-btn cp-btn--ghost tip-skip" onClick={() => endGuide(false)}>
              Not now
            </button>
            <button type="button" className="cp-btn cp-btn--ink" onClick={startGuide}>
              Start tour
            </button>
          </div>
        </div>
      </div>
    ) : guide === steps.length ? (
      <div className="guide-intro" role="dialog" aria-modal="true" aria-labelledby="guide-h">
        <div className="tip guide-intro-card">
          <p>
            <strong className="tip-title" id="guide-h">
              You’re ready
            </strong>
            Your settings are back as they were. You can take the tour again any time from Show, above the words.
          </p>
          <div className="tip-actions">
            <button type="button" className="cp-btn cp-btn--ghost tip-skip" onClick={replayGuide}>
              Take the tour again
            </button>
            <button type="button" className="cp-btn cp-btn--ink" onClick={() => endGuide(false)}>
              Start singing
            </button>
          </div>
        </div>
      </div>
    ) : step && guideBox ? (
      <>
        <div className="guide-scrim" aria-hidden="true">
          <span className={`guide-hole${guideOk ? " ok" : ""}`} style={{ left: guideBox.hole.x, top: guideBox.hole.y, width: guideBox.hole.w, height: guideBox.hole.h }} />
        </div>
        <div className={`tip${guideBox.above ? " above" : ""}${guideOk ? " ok" : ""}`} style={{ left: guideBox.left, top: guideBox.top, width: guideBox.w }} role="dialog" aria-label={`Guide: ${step.title}`}>
          <p>
            <b>
              {step.part} · {steps.slice(0, guide + 1).filter((g) => !guideSkip.current.has(g.id)).length} of {steps.length - guideSkip.current.size}
            </b>
            <strong className="tip-title">
              {guideOk && <span className="tip-ok">{Icon.check}</span>}
              {step.title}
            </strong>
            {guideOk && step.after ? step.after : step.text}
          </p>
          <div className="tip-dots" aria-hidden="true">
            {steps.map((_, i) => (
              <i key={i} className={i === guide ? "on" : i < guide ? "done" : ""} />
            ))}
          </div>
          <div className="tip-actions">
            <button type="button" className="cp-btn cp-btn--ghost tip-skip" onClick={() => endGuide(true)}>
              End tour
            </button>
          </div>
        </div>
      </>
    ) : null;

  return (
    <div className={`practice is-${view}${loop && loopHint ? " loop-hint" : ""}`} style={practiceTone}>
      <header className="p-head gutter">
        {onMenu && (
          <button type="button" className="cp-icon-btn p-menu" onClick={onMenu} aria-label="Your roles and pieces">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4.5 7h15M4.5 12h15M4.5 17h15" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
            </svg>
          </button>
        )}
        <button type="button" className="cp-icon-btn" onClick={onBack} aria-label={`Back to ${roleName}`}>
          {Icon.back}
        </button>
        <div className="p-title">
          <h1 lang={LANG}>{edition.title}</h1>
          <p className="p-sub">
            <span className="p-kind">{info.kind} · </span>
            <a href="#" className="p-sub-link" onClick={(e) => (e.preventDefault(), onBack())}>
              {roleName}
            </a>{" "}
            ·{" "}
            {onOpera ? (
              <a href="#" className="p-sub-link" onClick={(e) => (e.preventDefault(), onOpera())} lang={LANG}>
                <i>{info.opera}</i>
              </a>
            ) : (
              <i lang={LANG}>{info.opera}</i>
            )}
          </p>
        </div>
        <div className="p-tools">
          <div className="cp-seg view-switch" role="group" aria-label="What to show">
            <button type="button" aria-pressed={view === "music"} onClick={() => setView("music")}>
              {Icon.music}
              <span className="label">Music</span>
            </button>
            <button type="button" aria-pressed={view === "words"} onClick={() => setView("words")}>
              {Icon.lines}
              <span className="label">Words</span>
            </button>
          </div>
          {musicOn && (
            <div className="cp-seg view-switch layout-switch" role="group" aria-label="How the music is laid out">
              <button type="button" aria-pressed={!pageView} onClick={() => setPageView(false)} title="One line, scrolling sideways">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" d="M2.5 8.5h14M2.5 12h14M2.5 15.5h14" />
                  <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M18.5 8.5 22 12l-3.5 3.5" />
                </svg>
                <span className="label">Line</span>
              </button>
              <button type="button" aria-pressed={pageView} onClick={() => setPageView(true)} title="Page: systems one under another, scrolling down">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="4.5" y="2.5" width="15" height="19" rx="2.5" fill="none" stroke="currentColor" strokeWidth="2" />
                  <path fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" d="M8 7.5h8M8 10h8M8 14.5h8M8 17h8" />
                </svg>
                <span className="label">Page</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* the line: a card with one quiet header row (where you are, and how to hear it) above the words */}
      <section
        className={`now-panel${cardOn || !musicOn ? "" : " card-off"}${current.sounding ? " is-now" : ""}${live && musicOn && !cardPeek && !cardMenu ? " is-playing" : ""}${live && musicOn && cardPeek ? " peek" : ""}${showIpa ? "" : " no-ipa"}${showTr ? "" : " no-tr"}${!showIpa && !showTr ? " compact" : ""}${minimal && musicOn ? " minimal" : ""}`}
        data-testid="now-panel"
        onPointerDown={() => live && musicOn && peekCard()}
      >
        <div className="line-card" ref={lineCardRef} style={live && cardH ? { ...cardTone, minHeight: cardH } : cardTone}>
          <div className="now-bar">
            <p className="now-meta">
              {/* an ensemble's card heads with the singers (whose words); a solo's with where you are */}
              {whoPick ?? (
                <>
                  <span className="now-dot" aria-hidden="true" />
                  {current.sounding ? "Now singing" : q < spans[0].startQ ? "First line" : "Next"}
                </>
              )}
            </p>
            {/* no tip strip in the card (the card is the words while you sing): a dotted word carries the line's
                tip, and tapping it opens the word with its sound and the tip */}
            <div className="now-tools">
              <div className="now-listen" role="group" aria-label="Hear this line spoken">
                <button type="button" className="nl-btn" onClick={() => sayPhrase(shown.ph.id)} aria-pressed={speakingId === shown.ph.id} aria-label="Hear this line spoken" title="Hear it">
                  {Icon.speaker}
                </button>
                <button type="button" className="nl-btn nl-slow" onClick={() => sayPhrase(shown.ph.id, true)} aria-label="Hear it slowly" title="Slowly">
                  {Icon.slow}
                </button>
              </div>
              {/* what to show under the words: set once, so it lives in a small menu, not on every line */}
              <span className="card-menu-wrap">
                <button
                  type="button"
                  className="card-menu-btn show-btn"
                  aria-haspopup="menu"
                  aria-expanded={cardMenu === "show"}
                  onClick={() => setCardMenu(cardMenu === "show" ? null : "show")}
                  aria-label="Show under the words: IPA, English, pronunciation tips"
                  title="Show"
                >
                  <span>Show</span>
                  {Icon.down}
                </button>
                {cardMenu === "show" && (
                  <span className="card-menu card-menu--end" role="menu" aria-label="Show under the words">
                    <button type="button" role="menuitemcheckbox" aria-checked={showIpa} onClick={() => setShowIpa(!showIpa)}>
                      <span className="cm-check" aria-hidden="true">{showIpa ? Icon.check : null}</span>
                      <span>IPA</span>
                    </button>
                    <button type="button" role="menuitemcheckbox" aria-checked={showTr} onClick={() => setShowTr(!showTr)}>
                      <span className="cm-check" aria-hidden="true">{showTr ? Icon.check : null}</span>
                      <span>English</span>
                    </button>
                    {hasTips && (
                      <button type="button" role="menuitemcheckbox" aria-checked={showTips} onClick={() => setShowTips(!showTips)}>
                        <span className="cm-check" aria-hidden="true">{showTips ? Icon.check : null}</span>
                        <span>Pronunciation tips</span>
                      </button>
                    )}
                    <span className="cm-sep" role="separator" />
                    <button type="button" role="menuitem" onClick={replayGuide}>
                      <span className="cm-check" aria-hidden="true" />
                      <span>Take the tour</span>
                    </button>
                  </span>
                )}
              </span>
              {/* fold the box away to one line, to give the music the room */}
              <button type="button" className="card-fold" onClick={() => setCardOn(false)} aria-label="Fold the words box to one line" title="Fold">
                {Icon.up}
              </button>
            </div>
          </div>
          <div className="now-body">
            <button type="button" className="now-step" onClick={() => stepLine(-1)} aria-label="Back to the start of this line, or the line before">
              {Icon.left}
            </button>
            <div className={`now-inner${resting ? " resting" : ""}`} aria-live="polite">
              {/* while the music plays on between your lines: three dots that light one by one on the last
                  three beats before you come in, and the next line, small, to get ready for */}
              {resting && (
                <div className="now-rest" aria-hidden="true">
                  <span className="rest-dots">
                    {[0, 1, 2].map((i) => (
                      <i key={i} className={i < restLit ? "on" : ""} />
                    ))}
                  </span>
                  <span className="rest-next" lang={LANG}>
                    {shown.ph.words.map((w) => w.text).join(" ")}
                  </span>
                </div>
              )}
              <p ref={itRef} className={`now-it${nowSyl ? " in-progress" : ""}${lineLen(shown.ph) > 110 ? " longer" : lineLen(shown.ph) > 64 ? " long" : ""}`} lang={LANG}>
                {lineWords(shown.ph, nowSyl, !playing ? litTip : null)}
              </p>
              <p className="now-ipa" lang="it-fonipa">
                [{(() => { const r = trailingRepeat(shown.ph.words.map((w) => w.text)); return r ? foldIpa(shown.ph.ipa, r.times) : shown.ph.ipa; })()}]
              </p>
              {showTr && <p className="now-tr">{curly((() => { const r = trailingRepeat(shown.ph.words.map((w) => w.text)); return r ? foldTranslation(shown.ph.translation, r.times) : shown.ph.translation; })())}</p>}
              {musicOn && cardFor(shown.ph.id, "now-card-word")}
            </div>
            <button type="button" className="now-step" onClick={() => stepLine(1)} aria-label="Next line">
              {Icon.right}
            </button>
          </div>
        </div>
      </section>
      {/* folded: the line in one row; tap it to unfold the box */}
      {musicOn && !cardOn && (
        <button type="button" className="card-strip" onClick={() => setCardOn(true)} aria-label="Unfold the words box">
          <span className="cs-text" lang={LANG}>
            {shown.ph.original}
          </span>
          <span className="cs-chev" aria-hidden="true">
            {Icon.down}
          </span>
        </button>
      )}

      <main className="p-stage" ref={stageRef} onPointerDown={() => musicOn && openWord && setOpenWord(null)}>
        <ScoreView
          xml={shownXml}
          edition={edition}
          perf={perf}
          visibleXmlParts={hiddenIds.length ? orderedIds.filter((x) => !hiddenIds.includes(x)) : null}
          laneLabels={Object.fromEntries(orderedIds.map((x) => [x, lineName(partByXml(x)) + (x === voicePart.source.xmlPartId ? " · you" : "")]))}
          laneFaces={laneAbbr}
          laneYou={voicePart.source.xmlPartId}
          onLaneLabel={(xid, el) => {
            const r = el.getBoundingClientRect();
            setLaneMenu((m) => (m?.xid === xid ? null : { xid, left: r.left, top: r.bottom + 6 }));
          }}
          tintXmlParts={[voicePart.source.xmlPartId]}
          zoom={effZoom}
          cursor={cursorRef}
          marker={markerRef}
          scrollTarget={playing ? "cursor" : "none"}
          loop={loop}
          selection={noteEdit ? { startM: noteEdit.m, endM: noteEdit.m } : loopPick?.first ? { startM: loopPick.first.m, endM: loopPick.first.m } : null}
          cuts={[]}
          flags={flags}
          onTap={onTap}
          onRange={onRange}
          onLoopEdge={onLoopEdge}
          onFlag={(f) => {
            const n = notes.find((x) => x.id === f.id);
            if (n) setNoteEdit({ id: n.id, m: n.m, q: n.q, body: n.mark && MARKS.find((x) => x.id === n.mark)?.label === n.body ? "" : n.body, mark: n.mark });
          }}
          onUserScroll={() => undefined}
          onLayout={onLayout}
          strip={!pageView}
          joinTopStaff={false}
          ink="#0b0b0b"
          fadedXmlParts={[
            ...(pianoFaded && !hiddenIds.includes(pianoPart.source.xmlPartId) ? [pianoPart.source.xmlPartId] : []),
            ...voiceParts.filter((p) => p !== voicePart && (lineSets[p.key]?.fade ?? true) && showOf(p)).map((p) => p.source.xmlPartId),
          ]}
          softFadedXmlParts={voiceParts.filter((p) => p !== voicePart).map((p) => p.source.xmlPartId)}
          nowNoteParts={pianoFaded ? [voicePart.source.xmlPartId] : [voicePart.source.xmlPartId, pianoPart.source.xmlPartId]}
        />
      </main>

      {faceMenu &&
        (() => {
          const isPiano = faceMenu.key === pianoPart.key;
          const p = isPiano ? pianoPart : voiceParts.find((x) => x.key === faceMenu.key);
          if (!p) return null;
          const mine = p === voicePart;
          const on = mine ? hearVoice : isPiano ? hearPiano : (lineSets[p.key]?.hear ?? false);
          const shown = showOf(p);
          const faded = isPiano ? pianoFaded : mine ? !!lineSets[p.key]?.fade : (lineSets[p.key]?.fade ?? true);
          const name = isPiano ? "Piano" : mine ? roleName : p.shortLabel;
          const setLook = (look: "show" | "fade" | "hide") => {
            if (look === "hide") return setLine(p.key, { show: false });
            if (isPiano) {
              setLine(p.key, { show: true });
              setPianoFaded(look === "fade");
            } else setLine(p.key, { show: true, fade: look === "fade" });
          };
          const done = (f: () => void) => () => {
            f();
            setFaceMenu(null);
          };
          const look = !shown ? "hide" : faded ? "fade" : "show";
          return (
            <div className="lane-menu face-menu" role="menu" aria-label={name} style={{ left: faceMenu.left, bottom: faceMenu.bottom, top: "auto" }}>
              <p className="lane-menu-title">
                {name}
                {mine && <em className="mix-you">you</em>}
              </p>
              <button type="button" role="menuitem" className="fm-hear" onClick={done(() => (mine ? setHearVoice(!on) : isPiano ? setHearPiano(!on) : setLine(p.key, { hear: !on })))}>
                {on ? Icon.muted : Icon.speaker}
                <span>{on ? (mine ? "Mute: I sing it" : isPiano ? "Mute the piano" : "Mute: sung live") : isPiano ? "Play the piano" : mine ? "Play my line" : "Play this line"}</span>
              </button>
              <div className="face-menu-look" role="group" aria-label="In the score">
                <button type="button" role="menuitemradio" aria-checked={look === "show"} onClick={done(() => setLook("show"))}>
                  {Icon.eye}
                  <span>Show</span>
                </button>
                <button type="button" role="menuitemradio" aria-checked={look === "fade"} onClick={done(() => setLook("fade"))}>
                  {Icon.fade}
                  <span>Fade</span>
                </button>
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={look === "hide"}
                  disabled={mine || (shown && hiddenIds.length >= orderedIds.length - 1)}
                  onClick={done(() => setLook("hide"))}
                >
                  {Icon.eyeOff}
                  <span>Hide</span>
                </button>
              </div>
            </div>
          );
        })()}
      {laneMenu &&
        (() => {
          const i = orderedIds.indexOf(laneMenu.xid);
          const p = partByXml(laneMenu.xid);
          const name = lineName(p);
          const on = hearOf(p);
          const done = (f: () => void) => () => {
            f();
            setLaneMenu(null);
          };
          return (
            <div className="lane-menu" role="menu" aria-label={name} style={{ left: Math.min(laneMenu.left, window.innerWidth - 260), top: laneMenu.top }}>
              <p className="lane-menu-title">
                {name}
                {p === voicePart && <em className="mix-you">you</em>}
              </p>
              <button type="button" role="menuitem" disabled={i === 0} onClick={done(() => placeLine(i, 0))}>
                {Icon.up}
                <span>Put at the top</span>
              </button>
              <button type="button" role="menuitem" disabled={i === 0} onClick={done(() => moveLine(i, -1))}>
                {Icon.up}
                <span>Move up</span>
              </button>
              <button type="button" role="menuitem" disabled={i === orderedIds.length - 1} onClick={done(() => moveLine(i, 1))}>
                {Icon.down}
                <span>Move down</span>
              </button>
              <button type="button" role="menuitem" disabled={hiddenIds.length >= orderedIds.length - 1} onClick={done(() => setLine(p.key, { show: false }))}>
                {Icon.eyeOff}
                <span>Hide in the score</span>
              </button>
              <button type="button" role="menuitem" className="fm-hear" onClick={done(() => setHear(p, !on))}>
                {on ? Icon.muted : Icon.speaker}
                <span>{on ? (p.kind === "piano" ? "Mute the piano" : "Mute: sung live") : "Play this line"}</span>
              </button>
              {p.kind === "voice" && p !== voicePart && onSing && p.roleId && (
                <button type="button" role="menuitem" onClick={done(() => onSing(p.roleId!))}>
                  {Icon.music}
                  <span>Sing {name}'s part</span>
                </button>
              )}
              <button type="button" role="menuitem" className="lane-menu-more" onClick={done(() => setMixOpen(true))}>
                {Icon.sliders}
                <span>Arrange all lines…</span>
              </button>
            </div>
          );
        })()}

      {view === "words" && (
        <div
          className={`words-view${playing ? " is-playing" : ""}${showTr ? "" : " no-tr"}`}
          ref={wordsRef}
          onPointerDown={(e) => {
            wordsTouched.current = performance.now();
            if (openWord && !(e.target as HTMLElement).closest(".word-card, .now-word")) setOpenWord(null);
          }}
          onWheel={() => (wordsTouched.current = performance.now())}
          onScroll={checkAway}
          data-testid="words-view"
        >
          {wordsAway === "up" && (
            <button type="button" className="w-back w-back--up" onClick={backToNow}>
              {Icon.up}
              Back to bar {loc.number}
            </button>
          )}
          <div className="w-grid">
            {/* side by side, as in a libretto: the original with its IPA, the translation level with it */}
            <div className="w-cols">
              <span className="w-col-orig">
                <b>{ORIGINAL}</b>
              </span>
              <span className="w-col-tr">
                <b>English</b>
              </span>
              {/* what to show: toggles that show their state (lit = shown), as on the music view's card */}
              <span className="w-tools" role="group" aria-label="Show with the words">
                {ens && (
                  // whose lines: everyone's (the whole scene) or only yours (to memorise)
                  <span className="w-seg" role="group" aria-label="Whose lines to show">
                    <button type="button" aria-pressed={!justMine} onClick={() => setJustMine(false)}>
                      Everyone
                    </button>
                    <button type="button" aria-pressed={justMine} onClick={() => setJustMine(true)} aria-label="Only my lines">
                      Mine
                    </button>
                  </span>
                )}
                <button type="button" className="w-chip" aria-pressed={showIpa} onClick={() => setShowIpa(!showIpa)} title={showIpa ? "Hide the IPA" : "Show the IPA"}>
                  IPA
                </button>
                <button type="button" className="w-chip" aria-pressed={showTr} onClick={() => setShowTr(!showTr)} title={showTr ? "Hide the English" : "Show the English"}>
                  English
                </button>
                {hasTips && (
                  <button type="button" className="w-chip" aria-pressed={showTips} onClick={() => setShowTips(!showTips)} title={showTips ? "Hide the pronunciation tips" : "Show the pronunciation tips"}>
                  {Icon.tip}
                  Tips
                </button>
                )}
              </span>
              {showTips && hasTips && (
                <div className={`tipstrip${curTip ? "" : " empty"}`} aria-live="polite">
                  {curTip ? (
                    <>
                      <button type="button" className="ts-main" aria-expanded={tipOpen} onClick={() => setTipOpen(!tipOpen)}>
                        {Icon.tip}
                        <span className="ts-where">Bar {edition.measures[shown.ph.startM].number}</span>
                        <span className="ts-title">{curTip.tip.title}</span>
                        <span className="ts-word" lang={LANG}>
                          {curly(shown.ph.words[curTip.word]?.text.replace(/[.,;:!?]+$/, "") ?? "")}
                        </span>
                        <span className="ts-short">{curTip.tip.short}</span>
                        <span className="ts-more" aria-hidden="true">
                          {tipOpen ? "Less" : "More"}
                        </span>
                      </button>
                      {lineTips.length > 1 && (
                        <button
                          type="button"
                          className="ts-next"
                          aria-label="The other tip for this line"
                          onClick={() => {
                            setTipIdx((x) => x + 1);
                            setTipOpen(false);
                          }}
                        >
                          {(tipIdx % lineTips.length) + 1} of {lineTips.length}
                          {Icon.right}
                        </button>
                      )}
                      {tipOpen && (
                        <p className="ts-body">
                          {curTip.tip.body}
                          {curTip.tip.also.length > 0 && <span className="w-tip-also"> Also: {curTip.tip.also.join(", ")}.</span>}
                        </p>
                      )}
                    </>
                  ) : (
                    <span className="ts-none">
                      {Icon.tip}
                      Bar {edition.measures[shown.ph.startM].number}: nothing new to notice in this line.
                    </span>
                  )}
                </div>
              )}
            </div>
            {blocks.map((bk) => {
              if (bk.kind === "gap") {
                // the piano alone: a band you can see at a glance is a rest for you, as long as it lasts;
                // while it plays it fills like the progress line and counts down to your entrance
                const on = bk.key === activeKey;
                const secs = (perf.qToSec(bk.endQ) - perf.qToSec(bk.startQ)) / tf;
                const left = Math.max(0, (perf.qToSec(bk.endQ) - perf.qToSec(Math.max(bk.startQ, qNow))) / tf);
                const fill = on ? Math.min(1, Math.max(0, (qNow - bk.startQ) / Math.max(0.001, bk.endQ - bk.startQ))) : 0;
                const after = blocks.slice(blocks.indexOf(bk) + 1).find((b) => b.kind === "line");
                const entry = after && after.kind === "line" ? edition.measures[perf.locate(spans[after.i].startQ).m].number : null;
                return (
                  <button
                    key={bk.key}
                    type="button"
                    data-key={bk.key}
                    className={`w-gap${on ? " now" : ""}`}
                    onClick={() => goTo(bk.startQ + 0.0001)}
                    aria-label={`${bk.label}, ${barsOf(bk.startQ, bk.endQ)}: play from here`}
                  >
                    <span className="w-gap-band">
                      <span className="w-gap-fill" style={{ width: `${(fill * 100).toFixed(1)}%` }} aria-hidden="true" />
                      <span className="w-gap-main">
                        {Icon.piano}
                        <b>{bk.label}</b>
                        <span className="w-gap-bars">{barsOf(bk.startQ, bk.endQ)}</span>
                      </span>
                      <span className="w-gap-side">
                        {on && playing ? (
                          entry ? (
                            <>
                              <span className="w-gap-long">
                                {after && after.kind === "line" && spans[after.i].ph.roleId !== roleId
                                  ? `${edition.roles.find((r) => r.id === spans[after.i].ph.roleId)?.name ?? "The next singer"} comes`
                                  : "You come"}{" "}
                                in at bar {entry} ·{" "}
                              </span>
                              {Math.ceil(left)} s
                            </>
                          ) : (
                            `${Math.ceil(left)} s`
                          )
                        ) : (
                          `${Math.round(secs)} s`
                        )}
                      </span>
                    </span>
                  </button>
                );
              }
              const sp = spans[bk.i];
              const isNow = current.sounding && bk.i === current.idx;
              const isNext = !current.sounding && bk.i === current.idx && activeKey === sp.ph.id;
              const past = sp.endQ <= qNow + 1e-6 && !isNow;
              // the whole text of an ensemble: who sings each line (a face where the singer changes), yours in
              // full ink and the others faded, the line before each of yours (your cue) a little stronger, and
              // lines sung at the same time joined
              const bi = blocks.indexOf(bk);
              const prevB = blocks
                .slice(0, bi)
                .reverse()
                .find((b) => b.kind === "line");
              const nextB = blocks.slice(bi + 1).find((b) => b.kind === "line");
              const prevSp = prevB?.kind === "line" ? spans[prevB.i] : null;
              const nextSp = nextB?.kind === "line" ? spans[nextB.i] : null;
              const role = sp.ph.roleId;
              const mine = !allWords || role === roleId;
              const together = allWords && !!prevSp && prevSp.ph.roleId !== role && sp.startQ < prevSp.endQ - 1e-6;
              const showFace = allWords && (!prevSp || prevSp.ph.roleId !== role);
              const cue = allWords && !mine && !!nextSp && nextSp.ph.roleId === roleId;
              const singer = edition.roles.find((r) => r.id === role)?.name ?? "";
              // a speech: the run of lines one singer sings before the other answers (yours get one highlight band)
              const speechEnd = allWords && (!nextSp || nextSp.ph.roleId !== role || nextB !== blocks[bi + 1]);
              return (
                <article
                  key={bk.key}
                  data-key={bk.key}
                  className={`w-line${isNow ? " now" : ""}${isNext ? " next" : ""}${past ? " past" : ""}${allWords ? ` script${mine ? " mine" : " other"}` : ""}${cue ? " cue" : ""}${together ? " together" : ""}${showFace ? " speech-start" : ""}${speechEnd ? " speech-end" : ""}`}
                  onClick={() => goTo(sp.startQ - 0.0001)}
                  aria-current={isNow ? "true" : undefined}
                >
                  {allWords ? (
                    // the margin, as in a script: only who sings, at the start of each speech
                    <span className="w-gut" title={`${singer}, ${barsOf(sp.startQ, sp.endQ)}`}>
                      {showFace && (
                        <span className="w-who">
                          <span className="w-who-face" aria-hidden="true">
                            <RoleFace k={`${info.portrait.split(":")[0]}:${role}`} />
                          </span>
                          <span className="w-who-name">
                            {singer}
                            {mine && <em className="w-who-you">you</em>}
                          </span>
                        </span>
                      )}
                    </span>
                  ) : null}
                  {allWords ? (
                    <span className="w-bar w-bar-col">{edition.measures[perf.locate(sp.startQ).m].number}</span>
                  ) : (
                    <span className="w-bar" title={barsOf(sp.startQ, sp.endQ)}>
                      {edition.measures[perf.locate(sp.startQ).m].number}
                    </span>
                  )}
                  <div className="w-orig">
                    <p className={`w-it${isNow && nowSyl ? " in-progress" : ""}`} lang={LANG}>
                      {lineWords(sp.ph, isNow ? nowSyl : null, sp.ph.id === shown.ph.id ? litTip : null)}
                    </p>
                    {showIpa && (
                      <p className="w-ipa" lang="it-fonipa">
                        [{sp.ph.ipa}]
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    className="w-hear"
                    aria-label={`Hear “${sp.ph.original}” spoken`}
                    aria-pressed={speakingId === sp.ph.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      sayPhrase(sp.ph.id);
                    }}
                  >
                    {Icon.speaker}
                  </button>
                  {showTr && <p className="w-tr">{curly(sp.ph.translation)}</p>}
                  {cardFor(sp.ph.id)}
                </article>
              );
            })}
          </div>
          {wordsAway === "down" && (
            <button type="button" className={`w-back w-back--down`} onClick={backToNow}>
              {Icon.up}
              Back to bar {loc.number}
            </button>
          )}
        </div>
      )}

      {/* where you are, and the progress line to scrub: in the dock, right above the playback buttons */}
      {loop && loopHint && (
        <div className="loop-pick gutter" role="status">
          <span className="lp-icon" aria-hidden="true">
            {Icon.loop}
          </span>
          <p>
            <b>Looping {loopBars}.</b> Drag the purple edges to change it.
          </p>
          <button
            type="button"
            className="cp-btn lp-btn"
            onClick={() => {
              loopLine();
              setLoopHint(false);
            }}
          >
            This line
          </button>
          <button type="button" className="cp-btn lp-btn" onClick={clearLoop} title="Forget this loop">
            Clear
          </button>
          <button type="button" className="cp-btn lp-btn lp-done" onClick={() => setLoopHint(false)}>
            Done
          </button>
        </div>
      )}
      <div className="p-timeline gutter">
        <div className="tl-label" data-testid="location">
          <b className="tl-bar">{status ?? `Bar ${loc.number}`}</b>
          {loop && !status && (
            <button type="button" className="tl-loop-chip" onClick={() => setLoopHint(true)} aria-label={`Looping ${loopBars}. Change or clear the loop`}>
              {Icon.loop}
              {loopBars.replace("bars ", "").replace("bar ", "")}
            </button>
          )}
          <span>{tempoWords[loc.m] || " "}</span>
        </div>
        <div
          className="tl-track"
          ref={trackRef}
          role="slider"
          tabIndex={0}
          aria-label="Where you are in the aria"
          aria-valuemin={0}
          aria-valuemax={Math.round(total)}
          aria-valuenow={Math.round(perf.qToSec(qNow))}
          aria-valuetext={`Bar ${loc.number}, beat ${beat}`}
          onPointerDown={(e) => {
            dragging.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            seekAt(e.clientX);
          }}
          onPointerMove={(e) => dragging.current && seekAt(e.clientX)}
          onPointerUp={() => (dragging.current = false)}
          onPointerCancel={() => (dragging.current = false)}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
              e.preventDefault();
              e.stopPropagation();
              goTo(perf.secToQ(Math.min(total, Math.max(0, perf.qToSec(qNow) + (e.key === "ArrowLeft" ? -5 : 5)))));
            }
          }}
        >
          <span className="tl-line" />
          {loop && <span className="tl-loop" style={{ left: `${frac(loop.startQ) * 100}%`, width: `${(frac(loop.endQ) - frac(loop.startQ)) * 100}%` }} />}
          <span className="tl-line done" style={{ width: `${pct}%` }} />
          {/* each phrase you sing as a soft rounded bar, the rests between them as the hairline; only phrases
              whose gap would be a sliver at this width are joined, so it never reads as dashes */}
          {(() => {
            const out: [number, number][] = [];
            for (const sp of spans) {
              const a = frac(sp.startQ) * 100;
              const b = frac(sp.endQ) * 100;
              const last = out[out.length - 1];
              if (last && a - last[1] < 1.2) last[1] = Math.max(last[1], b);
              else out.push([a, b]);
            }
            return out.map(([a, b]) => {
              const w = Math.max(b - a, 1.2);
              const fill = Math.min(100, Math.max(0, ((pct - a) / w) * 100));
              return (
                <span key={a} className="tl-pass" style={{ left: `${a}%`, width: `${w}%` }}>
                  <i style={{ width: `${fill}%` }} />
                </span>
              );
            });
          })()}
          <span className="tl-head" style={{ left: `${pct}%` }} />
        </div>
        <div className="tl-time">
          {fmtTime(perf.qToSec(qNow) / tf)} <span>/ {fmtTime(total / tf)}</span>
        </div>
        {/* phone, folded bar: the speed as a chip at the end of this row; − and + open above it */}
        {!barOpen && (
          <div className="tl-speed">
            <button type="button" className={`tl-speed-chip${asPrinted ? "" : " changed"}`} aria-expanded={speedPop} aria-label={`${tempoLabel.split(".")[0]}. Change it`} onClick={() => setSpeedPop(!speedPop)}>
              <BeatNote symbol={beatSymbol} />
              {beatBpm}
            </button>
            {speedPop && (
              <div className="tl-speed-pop" role="group" aria-label="Speed">
                <button type="button" className="cp-icon-btn" aria-label="Slower" onClick={slower} disabled={!canSlower}>
                  {Icon.minus}
                </button>
                <b>
                  <BeatNote symbol={beatSymbol} /> = {beatBpm}
                </b>
                <button type="button" className="cp-icon-btn" aria-label="Faster" onClick={faster} disabled={!canFaster}>
                  {Icon.plus}
                </button>
                <button type="button" className="tl-speed-reset" onClick={() => engine?.setTempoFactor(1)} disabled={asPrinted} aria-label={`Back to the printed tempo, ${printedBpm}`}>
                  {Icon.again}
                  {printedBpm}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {holdMenu &&
        createPortal(
          (() => {
            const choice = holdMenu.key === voicePart.key ? lineChoice : (lineSets[holdMenu.key]?.inst ?? "auto");
            const sung = sungOf(holdMenu.key);
            const auto = resolveLine("auto", holdMenu.voiceType, sung);
            const W = 240;
            const left = Math.max(8, Math.min(window.innerWidth - W - 8, holdMenu.rect.left + holdMenu.rect.width / 2 - W / 2));
            const opts: { id: string; label: string; note?: string }[] = [
              { id: "auto", label: "Automatic", note: lineSounds(sung).find((o) => o.id === auto)?.label },
              ...lineSounds(sung).map((o) => ({ id: o.id, label: o.label })),
            ];
            return (
              <div
                className={`hold-menu${holdMenu.drag ? " is-drag" : ""}`}
                role="menu"
                aria-label={`What ${holdMenu.name}'s line plays on`}
                style={{ left, width: W, bottom: window.innerHeight - holdMenu.rect.top + 10 }}
              >
                <p className="hold-menu-title">{holdMenu.name}’s line plays on</p>
                {opts.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    role="menuitemradio"
                    aria-checked={choice === o.id}
                    data-hold-opt={o.id}
                    className={holdMenu.active === o.id ? "is-active" : undefined}
                    onClick={() => pickHold(holdMenu.key, o.id)}
                  >
                    <span className="cm-check" aria-hidden="true">{choice === o.id ? Icon.check : null}</span>
                    <span>{o.label}</span>
                    {o.note && <small>{o.note}</small>}
                  </button>
                ))}
              </div>
            );
          })(),
          document.body,
        )}
      <footer className={`p-bar gutter ens${barOpen ? "" : " folded"}`}>
        <div className="bar-parts many" role="group" aria-label="Parts">
          <button
            type="button"
            className="part"
            aria-pressed={hearVoice}
            aria-haspopup="menu"
            onClick={(e) => openFaceMenu(voicePart.key, e.currentTarget)}
            {...holdHandlers(voicePart, roleName)}
            aria-label={hearVoice ? `${roleName}'s line plays. Mute it to sing it yourself` : `${roleName}'s line is muted. Play it`}
            title={`${roleName} (you): ${hearVoice ? "plays" : "muted, you sing"}`}
          >
            <span className="part-face you" data-tone="pink" aria-hidden="true">
              <RoleFace k={portraitKey} />
            </span>
            <span className="part-text">
              <b>{roleName}</b>
              <small>{hearVoice ? `${/tenor|baritone|bass|countertenor/i.test(roleVoiceType) ? "His" : "Her"} line plays` : "Muted: you sing"}</small>
            </span>
            <span className="part-icon">{hearVoice ? Icon.speaker : Icon.muted}</span>
          </button>
          {/* the others, the piano and Arrange: one row of its own on phone (elsewhere it simply flows on) */}
          <div className="bar-mix">
          {/* the other singers: with many voices they scroll sideways, a soft edge showing there are more */}
          <div
            className={`bar-others${othersMore}`}
            ref={othersRef}
            onScroll={othersEdges}
            onWheel={(e) => {
              // a mouse wheel turns the row of faces sideways when they do not all fit
              const el = e.currentTarget;
              if (el.scrollWidth <= el.clientWidth + 2 || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
              el.scrollLeft += e.deltaY;
            }}
          >
          {orderedIds
            .map(partByXml)
            .filter((p) => otherVoices.includes(p))
            .map((p) => {
              const on = lineSets[p.key]?.hear ?? false;
              return (
                <button
                  key={p.key}
                  type="button"
                  className="part"
                  aria-pressed={on}
                  aria-haspopup="menu"
                  onClick={(e) => openFaceMenu(p.key, e.currentTarget)}
                  {...holdHandlers(p, p.shortLabel)}
                  aria-label={`${p.shortLabel}'s line ${on ? "plays. Mute it" : "is muted. Play it"}`}
                  title={`${p.shortLabel}: ${on ? "plays" : "muted, sung live"}`}
                >
                  <span className="part-face" aria-hidden="true">
                    <RoleFace k={partnerKey(p)} />
                  </span>
                  <span className="part-text">
                    <b>{p.shortLabel}</b>
                    <small>{on ? "Plays" : "Muted"}</small>
                  </span>
                  <span className="part-icon">{on ? Icon.speaker : Icon.muted}</span>
                </button>
              );
            })}
          </div>
          {(() => {
            // the piano as one group: heard or not, and in the score hidden, faded or clear (a tap moves to the next)
            const shownP = showOf(pianoPart);
            return (
              <div className="piano-group" role="group" aria-label="Piano">
                {/* the piano: one button, like the singers' faces; a tap opens the same menu (sound; shown, faded or hidden) */}
                <button
                  type="button"
                  className="pg-btn pg-piano"
                  aria-pressed={hearPiano}
                  aria-haspopup="menu"
                  onClick={(e) => openFaceMenu(pianoPart.key, e.currentTarget)}
                  aria-label={`Piano: ${hearPiano ? "plays" : "muted"}${musicOn ? `, ${!shownP ? "hidden" : pianoFaded ? "faded" : "shown"} in the score` : ""}`}
                  title={`Piano: ${hearPiano ? "plays" : "muted"}${musicOn ? `, ${!shownP ? "hidden" : pianoFaded ? "faded" : "shown"}` : ""}`}
                >
                  {hearPiano ? Icon.piano : Icon.muted}
                </button>
              </div>
            );
          })()}
          <button
            type="button"
            className="cp-btn part-fade mix-btn"
            aria-haspopup="dialog"
            aria-expanded={mixOpen}
            aria-label={ens ? "Arrange: who you sing, and how each line sounds and shows" : "Arrange: how each line sounds and shows"}
            onClick={() => setMixOpen(!mixOpen)}
          >
            {Icon.sliders}
            <span>Arrange</span>
          </button>
          {/* your notes and marks: opens the panel at the bar you are on */}
          <button
            type="button"
            className="cp-btn part-fade mix-btn notes-btn"
            aria-pressed={notePick}
            aria-label={notePick ? "Cancel adding a note" : "Add a note: then tap the bar it belongs to"}
            onClick={() => {
              setDrawer(null);
              setNoteEdit(null);
              setMixOpen(false);
              setNotePick(!notePick);
            }}
          >
            {Icon.note}
            <span>Notes{notes.length ? ` \u00b7 ${notes.length}` : ""}</span>
          </button>
          </div>
          {mixOpen && <button type="button" className="mix-scrim" aria-label="Close Arrange" tabIndex={-1} onClick={() => setMixOpen(false)} />}
          {mixOpen && (
            <div className="mix-pop ens" role="dialog" aria-label="Arrange">
                <>
                  <div className="mix-head">
                    <p className="mix-title">Arrange</p>
                    <button type="button" className="cp-btn cp-btn--ink mix-done" onClick={() => setMixOpen(false)}>
                      Done
                    </button>
                  </div>
                  {onSing && voiceParts.length > 1 && (
                    <div className="mix-sing">
                      <span className="mix-sub">You sing</span>
                      <div className="cp-seg mix-names" role="group" aria-label="The character you sing">
                        {voiceParts.map((p) => (
                          <button key={p.key} type="button" aria-pressed={p === voicePart} onClick={() => p !== voicePart && p.roleId && onSing(p.roleId)}>
                            <span className="mix-chip-face" aria-hidden="true">
                              <RoleFace k={partnerKey(p)} />
                            </span>
                            {p.shortLabel}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="mix-sing mix-order">
                    <div className="mix-order-head">
                      <span className="mix-sub">Each line: sound, show, volume, instrument and order</span>
                      <div className="cp-seg" role="group" aria-label="Order of the lines">
                        <button type="button" aria-pressed={scoreOrder} onClick={() => setOrder([])}>
                          As in the score
                        </button>
                        <button
                          type="button"
                          aria-pressed={meOnTop && !scoreOrder}
                          onClick={() => placeLine(orderedIds.indexOf(voicePart.source.xmlPartId), 0)}
                        >
                          My line on top
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="mix-rows" ref={rowsRef}>
                  {orderedIds.map((xid, i) => {
                    const p = partByXml(xid);
                    const isPiano = p.kind === "piano";
                    const isYou = p === voicePart;
                    const ls = lineSets[p.key] ?? {};
                    const on = hearOf(p);
                    const v = isYou ? vol.voice : isPiano ? vol.piano : (ls.vol ?? 80);
                    const name = lineName(p);
                    const inst = isYou ? lineSound : instOf(p);
                    const dragging = drag?.from === i;
                    const dropHere = drag && drag.over === i && drag.from !== i ? (drag.over < drag.from ? " drop-above" : " drop-below") : "";
                    return (
                      <div className={`mix-line${dragging ? " dragging" : ""}${dropHere}${on ? "" : " off"}`} key={xid}>
                        <button
                          type="button"
                          className="mix-handle"
                          aria-label={`Drag to move ${name}`}
                          title="Drag to move"
                          onPointerDown={(e) => {
                            e.currentTarget.setPointerCapture(e.pointerId);
                            setDrag({ from: i, over: i });
                          }}
                          onPointerMove={(e) => drag && dragOver(e.clientY, drag.from)}
                          onPointerUp={() => {
                            if (drag) placeLine(drag.from, drag.over);
                            setDrag(null);
                          }}
                          onPointerCancel={() => setDrag(null)}
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
                          </svg>
                        </button>
                        <span className={`part-face${isPiano ? " piano" : ""}${isYou ? " you" : ""}`} aria-hidden="true">
                          {isPiano ? Icon.piano : <RoleFace k={partnerKey(p)} />}
                        </span>
                        <b className="mix-line-name">
                          {name}
                          {isYou && <em className="mix-you">you</em>}
                        </b>
                        <span className="mix-toggles">
                          <button type="button" className="mix-mini" aria-pressed={on} onClick={() => setHear(p, !on)} aria-label={on ? `Mute ${name}` : `Play ${name}`} title={on ? "Plays" : "Muted: sung live"}>
                            {on ? Icon.speaker : Icon.muted}
                          </button>
                          {/* show or hide the line in the score, as the face menu does */}
                          <button
                            type="button"
                            className="mix-mini"
                            aria-pressed={showOf(p)}
                            disabled={showOf(p) && hiddenIds.length >= orderedIds.length - 1}
                            onClick={() => setLine(p.key, { show: !showOf(p) })}
                            aria-label={showOf(p) ? `Hide ${name} in the score` : `Show ${name} in the score`}
                            title={showOf(p) ? "Shown in the score" : "Hidden in the score"}
                          >
                            {showOf(p) ? Icon.eye : Icon.eyeOff}
                          </button>
                          {/* faded (grey) or in full ink, as the face menu does */}
                          {(() => {
                            const faded = isPiano ? pianoFaded : isYou ? !!lineSets[p.key]?.fade : (lineSets[p.key]?.fade ?? true);
                            return (
                              <button
                                type="button"
                                className="mix-mini"
                                aria-pressed={faded}
                                disabled={!showOf(p)}
                                onClick={() => (isPiano ? setPianoFaded(!faded) : setLine(p.key, { fade: !faded }))}
                                aria-label={faded ? `Show ${name} in full ink` : `Fade ${name} in the score`}
                                title={faded ? "Faded in the score" : "In full ink"}
                              >
                                {Icon.fade}
                              </button>
                            );
                          })()}
                        </span>
                        <input
                          type="range"
                          className="cp-slider mix-line-vol"
                          min={0}
                          max={100}
                          step={5}
                          value={v}
                          style={{ ["--fill" as string]: `${v}%` }}
                          aria-label={`${name}: volume`}
                          onChange={(e) => {
                            const x = Number(e.target.value);
                            if (isYou) setVol({ ...vol, voice: x });
                            else if (isPiano) setVol({ ...vol, piano: x });
                            else setLine(p.key, { vol: x });
                            if (!on) setHear(p, true);
                          }}
                        />
                        {isPiano ? (
                          <span className="mix-line-inst none" />
                        ) : (
                          <label className="mix-line-inst">
                            <select
                              value={isYou ? lineChoice : (lineSets[p.key]?.inst ?? "auto")}
                              onChange={(e) => (isYou ? setLineSound(e.target.value as LineChoice) : setLine(p.key, { inst: e.target.value as LineChoice }))}
                              aria-label={`${name}'s line is played on`}
                            >
                              <option value="auto">Automatic ({lineSounds(sungOf(p.key)).find((o) => o.id === resolveLine("auto", voiceTypeOf(p), sungOf(p.key)))?.label})</option>
                              {lineSounds(sungOf(p.key)).map((o) => (
                                <option key={o.id} value={o.id}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
                          </label>
                        )}
                        <span className="mix-arrows">
                          <button type="button" className="mix-mini" disabled={i === 0} onClick={() => moveLine(i, -1)} aria-label={`Move ${name} up`} title="Move up">
                            {Icon.up}
                          </button>
                          <button type="button" className="mix-mini" disabled={i === orderedIds.length - 1} onClick={() => moveLine(i, 1)} aria-label={`Move ${name} down`} title="Move down">
                            {Icon.down}
                          </button>
                        </span>
                      </div>
                    );
                  })}
                  </div>
                  {soundLoading && <p className="mix-note">Loading the instruments…</p>}
                </>
              {!ens && voices.length > 1 && (
                <div className="mix-row">
                  <span className="part-face piano" aria-hidden="true">
                    {Icon.speaker}
                  </span>
                  <div className="mix-main">
                    <div className="mix-head">
                      <b>Spoken {ORIGINAL}</b>
                    </div>
                    <div className="mix-inst">
                      <div className="cp-seg" role="group" aria-label="Voice for the spoken lines and words">
                        {voices.map((m) => (
                          <button key={m.voiceId} type="button" aria-pressed={voice?.voiceId === m.voiceId} onClick={() => setVoiceSel(m.voiceId)}>
                            {voiceLabel(m)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {(vol.voice !== 80 || vol.piano !== 60 || Object.keys(lineSets).length > 0 || order.length > 0) && (
                <button
                  type="button"
                  className="mix-reset"
                  onClick={() => {
                    setVol({ voice: 80, piano: 60 });
                    setLineSets({});
                    setOrder([]);
                  }}
                >
                  Back to the usual balance
                </button>
              )}
            </div>
          )}
        </div>

        <div className="bar-transport">
          <button
            type="button"
            className="cp-icon-btn bar-start"
            onClick={async () => {
              if (!engine) return;
              engine.seek(0);
              if (engine.state !== "playing") await play();
            }}
            disabled={pb.status !== "ready"}
            aria-label="Play from the start"
            title="From the start"
          >
            {Icon.fromStart}
          </button>
          {/* phone, folded bar: again from this line (or the one just sung), and play */}
          <button
            type="button"
            className="cp-icon-btn bar-again"
            onClick={async () => {
              if (!engine) return;
              stepLine(-1);
              if (engine.state !== "playing") await play();
            }}
            disabled={pb.status !== "ready"}
            aria-label="Again from the start of this line"
            title="Again from this line"
          >
            {Icon.again}
          </button>
          <button type="button" className="cp-icon-btn bar-stop" onClick={() => engine?.stop()} aria-label="Stop and go back to the start" title="Stop">
            {Icon.stop}
          </button>
          {playing ? (
            <button type="button" className="cp-icon-btn cp-icon-btn--ink cp-icon-btn--stand" onClick={() => engine?.pause()} aria-label="Pause" data-testid="pause">
              {Icon.pause}
            </button>
          ) : (
            <button type="button" className="cp-icon-btn cp-icon-btn--ink cp-icon-btn--stand" onClick={play} disabled={pb.status !== "ready"} aria-label="Play" data-testid="play">
              {Icon.play}
            </button>
          )}
          <button
            type="button"
            className="cp-icon-btn bar-loop"
            aria-pressed={!!loop}
            onClick={() => {
              if (loop) {
                setLoop(null);
                setLoopHint(false);
                return;
              }
              // the last loop again; or the bar you are on, its two edges ready to drag out over the bars you want
              if (savedLoop && savedLoop.endQ <= perf.totalQ + 1e-6) {
                setLoop(savedLoop);
                if (engine && engine.state !== "playing") engine.seek(savedLoop.startQ);
              } else {
                const pm = barAt(Math.max(0, q));
                setLoop({ startQ: pm.startQ, endQ: pm.startQ + pm.durQ });
              }
              setLoopHint(true);
            }}
            aria-label={loop ? `Looping ${loopBars}. Stop looping` : loopPick ? "Cancel choosing a loop" : "Loop: choose the bars"}
            title={loop ? `Looping ${loopBars}: tap bars in the score to add them` : "Loop: choose the bars"}
          >
            {Icon.loop}
          </button>
        </div>

        <div className="bar-right">
          <div className="cp-tempo">
            {/* − ♩ = 130 + as one control: the metronome number of the passage you are in; tap it for the printed tempo */}
            <div className="cp-speed" role="group" aria-label="Tempo">
              <button type="button" className="cp-icon-btn" aria-label="Slower" onClick={slower} disabled={!canSlower}>
                {Icon.minus}
              </button>
              <button
                type="button"
                className={`cp-tempo__value${asPrinted ? "" : " changed"}`}
                data-testid="tempo"
                onClick={() => engine?.setTempoFactor(1)}
                aria-disabled={asPrinted}
                aria-label={tempoLabel}
                title={asPrinted ? "As printed" : `Back to the printed ${beatSymbol} = ${printedBpm}`}
              >
                <BeatNote symbol={beatSymbol} />
                <span className="cp-eq">=</span>
                <b>{beatBpm}</b>
              </button>
              <button type="button" className="cp-icon-btn" aria-label="Faster" onClick={faster} disabled={!canFaster}>
                {Icon.plus}
              </button>
            </div>
          </div>
          <button
            type="button"
            className="cp-toggle countin"
            aria-pressed={countIn}
            onClick={() => setCountIn(!countIn)}
            aria-label={countIn ? "Count-in on: a bar of clicks before the music. Turn it off" : "Count-in off. Turn it on"}
            title="Count-in"
          >
            {Icon.metronome}
            <span>Count-in</span>
          </button>
        </div>
        <button
          type="button"
          className={`cp-icon-btn bar-more${barOpen ? " open" : ""}`}
          onClick={() => setBarOpen(!barOpen)}
          aria-expanded={barOpen}
          aria-label={barOpen ? "Fewer controls" : "All the controls: singers, piano, speed details"}
          title={barOpen ? "Fewer" : "More"}
        >
          {Icon.chevUp}
        </button>
        {pb.status === "error" && <p className="dock-status">{pb.error}</p>}
        {/* "tap the bar": sits just above this bar, so it never covers the title or the words */}
        {notePick && guide < 0 && (
          <div className="note-pick" role="status">
            <span>Tap the bar your note is for</span>
            {/* your notes in a list, and the score to print with them */}
            <button
              type="button"
              className="cp-btn cp-btn--ghost"
              onClick={() => {
                setNotePick(false);
                setDrawer("notes");
              }}
            >
              All notes
            </button>
            <button type="button" className="cp-btn cp-btn--ghost" onClick={printScore} disabled={printState === "busy"} aria-busy={printState === "busy"}>
              {printState === "busy" ? "Preparing…" : "PDF"}
            </button>
            {printState === "blocked" && (
              <button type="button" className="cp-btn cp-btn--ghost" onClick={() => setPrintState(printDoc.current && openInTab(printDoc.current.html) ? "tab" : "noTab")}>
                Open in a new tab
              </button>
            )}
            <button type="button" className="cp-btn cp-btn--ghost" onClick={() => setNotePick(false)}>
              Cancel
            </button>
            {printState !== "idle" && printState !== "busy" && (
              <span className="note-pick-msg" role="status">
                {printState === "tab"
                  ? "The score opened in a new tab: print it there and choose Save as PDF."
                  : printState === "blocked"
                    ? "Printing is blocked here: open the score in a new tab."
                    : printState === "noTab"
                      ? "Open Sottovoce in its own browser tab, then try again."
                      : "The score could not be prepared. Try again."}
              </span>
            )}
          </div>
        )}
      </footer>

        {noteEdit &&
          (() => {
            const ed = noteEdit;
            const close = () => setNoteEdit(null);
            const save = () => {
              const mk = MARKS.find((x) => x.id === ed.mark);
              const body = ed.body.trim() || mk?.label || "";
              if (!body) return close();
              const n: Note = { id: ed.id ?? crypto.randomUUID(), m: ed.m, q: ed.q, body, at: new Date().toISOString(), ...(ed.mark ? { mark: ed.mark } : {}) };
              const next = [...notes.filter((x) => x.id !== n.id), n].sort((a, b) => a.m - b.m || a.q - b.q);
              setNotes(next);
              saveNotes(next);
              close();
            };
            return (
              <div
                className={`note-card${lastTap.current ? " at-tap" : ""}`}
                role="dialog"
                aria-label={`Note for bar ${edition.measures[ed.m].number}`}
                style={(() => {
                  const t = lastTap.current;
                  if (!t || typeof window === "undefined") return undefined;
                  // a small sticky note just below the tap, kept inside the screen
                  const w = Math.min(300, window.innerWidth - 24);
                  const h = 210;
                  const left = Math.max(12, Math.min(t.x - 24, window.innerWidth - w - 12));
                  const below = t.y + 14;
                  const top = below + h > window.innerHeight - 12 ? Math.max(12, t.y - h - 14) : below;
                  return { left, top, width: w };
                })()}
              >
                <div className="note-card-head">
                  <b>Bar {edition.measures[ed.m].number}</b>
                  <button type="button" className="cp-icon-btn cp-icon-btn--ghost" aria-label="Close" onClick={close}>
                    {Icon.close}
                  </button>
                </div>
                <textarea
                  autoFocus
                  value={ed.body}
                  placeholder=""
                  aria-label="Your note"
                  onChange={(e) => setNoteEdit({ ...ed, body: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) save();
                    if (e.key === "Escape") close();
                  }}
                />
                <div className="note-card-actions">
                  {ed.id && (
                    <button
                      type="button"
                      className="cp-btn cp-btn--ghost"
                      onClick={() => {
                        const next = notes.filter((x) => x.id !== ed.id);
                        setNotes(next);
                        saveNotes(next);
                        close();
                      }}
                    >
                      Delete
                    </button>
                  )}
                  <button
                    type="button"
                    className="cp-btn cp-btn--ghost"
                    onClick={() => {
                      close();
                      setDrawer("notes");
                    }}
                  >
                    All notes
                  </button>
                  <button type="button" className="cp-btn cp-btn--ink" disabled={!ed.body.trim()} onClick={save}>
                    Save
                  </button>
                </div>
              </div>
            );
          })()}
        {drawer && (
          <aside className="p-drawer" aria-label="Lines, notes and about">
            <div className="p-drawer-head">
              {drawer === "notes" ? (
                <h2 className="notes-title">Your notes{notes.length ? ` · ${notes.length}` : ""}</h2>
              ) : (
              <div className="cp-seg" role="tablist" aria-label="Panel">
                {((context ? ["context", "tips", "about"] : ["tips", "about"]) as Drawer[]).filter((d) => d !== "tips" || hasTips).map((d) => (
                  <button key={d} type="button" role="tab" aria-selected={drawer === d} onClick={() => setDrawer(d)}>
                    {d === "context" ? "The scene" : d === "tips" ? "Pronunciation" : d === "notes" ? `Notes${notes.length ? ` · ${notes.length}` : ""}` : "About"}
                  </button>
                ))}
              </div>
              )}
              <button type="button" className="cp-icon-btn cp-icon-btn--ghost" aria-label="Close the panel" onClick={() => setDrawer(null)}>
                {Icon.close}
              </button>
            </div>
            <div className="p-drawer-body">
              {drawer === "tips" && (
                <section className="tips-list">
                  <p className="cp-eyebrow">Pronunciation · {tips.list.length} tips</p>
                  <p className="tips-intro">Pronunciation, line by line. Tap one to go there.</p>
                  <ol>
                    {tips.list.map((t) => {
                      const i = spans.findIndex((sp) => sp.ph.id === t.lineId);
                      const sp = spans[i];
                      const word = sp?.ph.words[t.word]?.text.replace(/[.,;:!?]+$/, "") ?? "";
                      return (
                        <li key={t.id}>
                          <button type="button" onClick={() => sp && goTo(sp.startQ - 0.0001)}>
                            <small>
                              Bar {sp ? edition.measures[sp.ph.startM].number : ""} · <span lang={LANG}>{curly(word)}</span>
                            </small>
                            <b>{t.title}</b>
                            <span>{t.body}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ol>
                </section>
              )}
              {drawer === "context" && context && (
                <section className="ctx">
                  {onToggleLearned && (
                    <button type="button" className="cp-btn ctx-learned" role="checkbox" aria-checked={!!learned} onClick={onToggleLearned}>
                      <span className="pp-box">{Icon.check}</span>
                      {learned ? "Learned" : "Mark as learned"}
                    </button>
                  )}
                  <p className="cp-eyebrow">The scene</p>
                  <p className="ctx-text">{context}</p>
                  <dl className="ctx-facts">
                    <div>
                      <dt>Key</dt>
                      <dd>{info.facts.key}</dd>
                    </div>
                    <div>
                      <dt>Time</dt>
                      <dd>{info.facts.time}</dd>
                    </div>
                    <div>
                      <dt>Tempo</dt>
                      <dd>{info.facts.tempo}</dd>
                    </div>
                    {range && (
                      <div>
                        <dt>Range</dt>
                        <dd>{range}</dd>
                      </div>
                    )}
                    <div>
                      <dt>Length</dt>
                      <dd>About {fmtTime(perf.totalSec)} at the written tempo</dd>
                    </div>
                  </dl>
                  <details className="ctx-syn">
                    <summary>
                      <span>The story</span>
                      <small>
                        {storyOf(roleName)}, and the whole opera act by act
                      </small>
                    </summary>
                    <Story opera={portraitKey.split(":")[0]} character={portraitKey.split(":")[1]} name={roleName} level={4} idBase="ctx-story" />
                  </details>
                </section>
              )}
              {drawer === "notes" && (
                <>
                  <button
                    type="button"
                    className="cp-btn cp-btn--ink notes-add"
                    onClick={() => {
                      setDrawer(null);
                      setNotePick(true);
                    }}
                  >
                    {Icon.note} Add a note
                  </button>
                  {notes.length === 0 && <p className="wc-note">No notes yet. Tap Add a note, then the bar it belongs to.</p>}
                  {notes.map((n) => (
                    <article key={n.id} className="cp-note" style={{ maxWidth: "none" }}>
                      <div className="cp-note__head">
                        <button type="button" className="cp-tag cp-tag--ink" style={{ border: 0, cursor: "pointer" }} onClick={() => goTo(perf.occurrences(n.m)[0].startQ + n.q)}>
                          Bar {edition.measures[n.m].number}
                        </button>
                        <span>{new Date(n.at).toLocaleDateString()}</span>
                      </div>
                      <p>
                        {MARKS.find((x) => x.id === n.mark) && <span className="notes-mark-sign">{MARKS.find((x) => x.id === n.mark)!.sign} </span>}
                        {n.body}
                      </p>
                      <button
                        type="button"
                        className="cp-btn cp-btn--ghost"
                        style={{ justifySelf: "start" }}
                        onClick={() => {
                          setDrawer(null);
                          goTo(perf.occurrences(n.m)[0].startQ + n.q);
                          setNoteEdit({ id: n.id, m: n.m, q: n.q, body: n.mark && MARKS.find((x) => x.id === n.mark)?.label === n.body ? "" : n.body, mark: n.mark });
                        }}
                      >
                        Edit
                      </button>
                    </article>
                  ))}
                  <section className="notes-backup notes-print" aria-label="Download the score">
                    <p className="cp-eyebrow">On paper</p>
                    <p className="wc-note">
                      {notes.length
                        ? `The whole score on A4 pages, with your ${notes.length === 1 ? "note" : `${notes.length} notes and marks`} written in at ${notes.length === 1 ? "its" : "their"} bar and listed in full at the end.`
                        : "You have no notes for this piece yet, so the PDF is just the score."}{" "}
                      In the print window, choose Save as PDF.
                    </p>
                    <div className="notes-backup-row">
                      <button type="button" className="cp-btn cp-btn--ghost" onClick={printScore} disabled={printState === "busy"} aria-busy={printState === "busy"}>
                        {printState === "busy" ? "Preparing the score…" : "Download score (PDF)"}
                      </button>
                      {printState === "blocked" && (
                        <button
                          type="button"
                          className="cp-btn cp-btn--ghost"
                          onClick={() => setPrintState(printDoc.current && openInTab(printDoc.current.html) ? "tab" : "noTab")}
                        >
                          Open it in a new tab
                        </button>
                      )}
                    </div>
                    {printState !== "idle" && printState !== "busy" && (
                      <p className="wc-note" role="status">
                        {printState === "tab"
                          ? "The score opened in a new tab. Print it there and choose Save as PDF."
                          : printState === "blocked"
                            ? "This page may not open the print window here. Open the score in a new tab and print it from there."
                            : printState === "noTab"
                              ? "This page may not open a new tab either. Open Sottovoce in its own browser tab, then try again."
                              : "The score could not be prepared for print. Try again in a moment."}
                      </p>
                    )}
                  </section>
                  <section className="notes-backup" aria-label="Keep your notes safe">
                    <p className="cp-eyebrow">Keep them safe</p>
                    <p className="wc-note">Notes live in this browser only. Save a copy now and then, and open it on another device to bring them over.</p>
                    <div className="notes-backup-row">
                      <button
                        type="button"
                        className="cp-btn cp-btn--ghost"
                        onClick={async () => {
                          const data = { app: "sottovoce-notes", version: 1, savedAt: new Date().toISOString(), notes: allNotes() };
                          try {
                            await saveFile(`sottovoce-notes-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data, null, 1));
                            setNotesMsg("");
                          } catch {
                            setNotesMsg("The copy was not saved.");
                          }
                        }}
                      >
                        Save a copy of all notes
                      </button>
                      <label className="cp-btn cp-btn--ghost notes-open">
                        Open a copy
                        <input
                          type="file"
                          accept="application/json,.json"
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            e.target.value = "";
                            if (!f) return;
                            try {
                              const added = mergeNotes(JSON.parse(await f.text()));
                              const mine = loadNotes();
                              setNotes(mine);
                              setNotesMsg(added ? `${added} note${added === 1 ? "" : "s"} added.` : "Nothing new: these notes are already here.");
                            } catch {
                              setNotesMsg("That file is not a copy of Sottovoce notes.");
                            }
                          }}
                        />
                      </label>
                    </div>
                    {notesMsg && <p className="wc-note" role="status">{notesMsg}</p>}
                  </section>
                </>
              )}
              {drawer === "about" && (
                <section className="about">
                  {info.about}
                  <p>
                    {voice
                      ? `Spoken lines and words: a native ${ORIGINAL} voice (${voiceLabel(voice)}), made with ElevenLabs. It is spoken, not sung: how the words sound in ${ORIGINAL}, not how to sing them.`
                      : `Spoken lines use your device's ${ORIGINAL} voice when it has one (${deviceVoice ? `here: ${voiceInfo(false).kind === "device" ? (voiceInfo(false) as { name: string }).name : ""}` : "none found here, so robotic placeholder recordings play"}).`}
                  </p>
                  <p>
                    Piano:{" "}
                    <a href="https://www.ir.isas.jaxa.jp/~cyamauch/AccurateSalamander/" target="_blank" rel="noreferrer">
                      Noct-Salamander Grand Piano
                    </a>{" "}
                    by Chisato Yamauchi (Accurate-Salamander Project), retuned by Hiroharu Narikawa, from the{" "}
                    <a href="https://github.com/sfzinstruments/SalamanderGrandPiano" target="_blank" rel="noreferrer">
                      Salamander Grand Piano V3
                    </a>{" "}
                    by Alexander Holm, a Yamaha C5; licensed{" "}
                    <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noreferrer">
                      Creative Commons BY 3.0
                    </a>
                    . All 16 loudness levels, each note up to ten seconds.
                  </p>
                  <p>
                    The hall the piano sounds in: St Paul’s Hall, Huddersfield, from the{" "}
                    <a href="https://github.com/APL-Huddersfield/MAIR-Library-and-Renderer" target="_blank" rel="noreferrer">
                      MAIR library
                    </a>{" "}
                    by Hyunkook Lee and Connor Millns (Applied Psychoacoustics Lab, University of Huddersfield), licensed{" "}
                    <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">
                      Creative Commons BY 4.0
                    </a>
                    ; its reverberation shortened a little for practice.
                  </p>
                  {voiceParts.some((p) => sungOf(p.key)) && (
                    <p>
                      Singer: the line sung on “ah”, rendered from the score with{" "}
                      <a href="https://cantai.app/" target="_blank" rel="noreferrer">
                        Cantai
                      </a>{" "}
                      (a singing voice made from recordings of professional opera singers), re-timed to follow your tempo.
                    </p>
                  )}
                  <p>
                    Flute, clarinet, English horn, bassoon and oboe for the sung line: the{" "}
                    <a href="https://theremin.music.uiowa.edu/MIS.html" target="_blank" rel="noreferrer">
                      University of Iowa Musical Instrument Samples
                    </a>
                    , free to use without restrictions. English horn:{" "}
                    <a href="https://github.com/peastman/sso" target="_blank" rel="noreferrer">
                      Sonatina Symphonic Orchestra
                    </a>{" "}
                    by Mattias Westlund, licensed{" "}
                    <a href="https://creativecommons.org/licenses/sampling+/1.0/" target="_blank" rel="noreferrer">
                      Creative Commons Sampling Plus 1.0
                    </a>
                    . An instrument that cannot reach the line plays it an octave lower. The piano's pedalling follows the edition's marks where it has them, and
                    otherwise changes with the harmony, as an accompanist would.
                  </p>
                </section>
              )}
            </div>
          </aside>
        )}
      {finished && onToggleLearned && (
        <div className="finish-toast" role="status">
          <span className="ft-text">
            <b>End of the piece.</b>
            {learned ? " Marked as learned." : " Do you know it?"}
          </span>
          {!learned && (
            <button
              type="button"
              className="cp-btn cp-btn--ink"
              onClick={() => {
                onToggleLearned();
                setFinished(false);
              }}
            >
              {Icon.check} Mark as learned
            </button>
          )}
          <button type="button" className="cp-btn cp-btn--ghost" onClick={() => setFinished(false)}>
            {learned ? "Close" : "Not yet"}
          </button>
        </div>
      )}
      {guideUi}
    </div>
  );
}
