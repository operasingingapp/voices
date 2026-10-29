import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
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
import { LINE_SOUNDS, resolveLine, type LineChoice } from "./settings";

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

// Offline placeholder recordings, used only when the device has no voice for the piece's language.
const audioModules = import.meta.glob(["../../data/content/*/audio/*.mp3", "!../../data/content/cp-fx-*/**"], {
  query: "?inline",
  import: "default",
  eager: true,
}) as Record<string, string>;
const audioUrl = (file?: string) => (file ? audioModules[`../../data/content/${pieceId}/audio/${file}`] : undefined);

// The real voice: recordings made with ElevenLabs (scripts/voices.ts), the voice set in voice.config.json.
import voiceConfig from "../../voice.config.json";
interface VoiceManifest {
  voiceId: string;
  voiceName?: string;
  clips: Record<string, { text: string; file: string; words?: [number, number][]; sung?: { file: string; words: [number, number][] } }>;
  words: Record<string, string>;
}
const voiceManifests = import.meta.glob("../../content/pieces/*/voice/*/manifest.json", { eager: true, import: "default" }) as Record<string, VoiceManifest>;
const voiceFiles = import.meta.glob(["../../content/voice-bank/*/sung/*.mp3", "../../content/voice-bank/*/words/*.mp3"], {
  query: "?url",
  import: "default",
  eager: true,
}) as Record<string, string>;
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
const voiceUrl = (file?: string) => (file ? voiceFiles[`../../${file}`] : undefined);
const plainText = (t: string) => t.replace(/[’‘]/g, "'").replace(/\s+/g, " ").trim();
const wordKey = (t: string) => plainText(t).replace(/[.,;:!?«»“”"()—–-]+/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
/** the recorded line (a repeated line uses the first recording of the same words) */
function lineClip(voice: VoiceManifest | null, id: string, original: string) {
  if (!voice) return null;
  const c = voice.clips[id] ?? Object.entries(voice.clips).find(([k, v]) => !k.endsWith("-slow") && !k.startsWith("join") && v.text === plainText(original))?.[1];
  if (!c) return null;
  // the line reshaped like the music (scripts/voices.ts, shapeLine); the tortoise plays the same one slower
  const file = c.sung?.file ?? c.file;
  const words = c.sung?.words ?? c.words;
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

interface Note {
  id: string;
  m: number;
  q: number;
  body: string;
  at: string;
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
  voices = Object.entries(voiceManifests)
    .filter(([k, m]) => k.includes(`/pieces/${id}/voice/`) && m.voiceId)
    .map(([, m]) => m);
  pianoPart = edition.parts.find((p) => p.kind === "piano")!;
  if (!displayCache.has(id)) displayCache.set(id, prepareForDisplay(d.scoreXml));
  displayXml = displayCache.get(id)!;
  xmlOrder = [...displayXml.matchAll(/<score-part id="([^"]+)"/g)].map((m) => m[1]);
  tempoWords = tempoWordsOf(edition);
  // Babbino's notes keep their first key, so nobody loses them
  NOTES_KEY = id === "puccini-o-mio-babbino-caro" ? "cp:babbino:notes" : edition.roles.length > 1 ? `cp:${id}:${roleId}:notes` : `cp:${id}:notes`;
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

const Icon = {
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
const CROP_PAD = 36;
/** Largest size of the music: comfortable on a music stand, still a few bars per screen. */
// a large screen (an iPad on a music stand) gets the music larger rather than empty space around it
const MAX_ZOOM = 1.3;
/** Height of a standard line of music at zoom 1 (px): voice over piano with markings, measured on Babbino. */
const STANDARD_LINE_H = 570;

function fmtTime(sec: number): string {
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
  const perf = useMemo(() => new Performance(edition, [], { tempo: steady ? "steady" : "smooth", pedal: true }), [steady]);
  const pb = usePlayback(perf, edition.parts);
  const engine = pb.engine;

  const [pianoFaded, setPianoFaded] = useLocalSetting("p:pianoFaded", true);
  const [hearVoice, setHearVoice] = useLocalSetting("p:hearVoice", true);
  const [hearPiano, setHearPiano] = useLocalSetting("p:hearPiano", true);
  // an ensemble: each of the other singers' lines on its own (heard or not, how loud, on what, shown in the score or not),
  // the score's parts in the order you choose, and whose words the line card and the words view show
  const ens = edition.roles.length > 1;
  type LineSet = { hear?: boolean; vol?: number; inst?: LineChoice; show?: boolean };
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
  const hiddenIds = orderedIds.filter((xid) => !showOf(partByXml(xid)));
  /** several lines' settings changed at once (a preset) */
  const patchLines = (patches: Record<string, LineSet>) => {
    const next = { ...lineSets };
    for (const [k, v] of Object.entries(patches)) next[k] = { ...next[k], ...v };
    setLineSets(next);
  };
  const lineName = (p: CompiledEdition["parts"][number]) => (p.kind === "piano" ? "Piano" : p.shortLabel);
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
  const phrases = useMemo(() => (ens ? language.phrases.filter((p) => p.roleId === wordsRole) : language.phrases), [ens, wordsRole]);
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
        {wordsRole === roleId && <em className="cmb-you">you</em>}
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
  const [vol, setVol] = useLocalSetting<{ voice: number; piano: number }>("p:vol", { voice: 80, piano: 80 });
  const hearOf = (p: CompiledEdition["parts"][number]) =>
    p === voicePart ? hearVoice : p.kind === "piano" ? hearPiano : (lineSets[p.key]?.hear ?? true);
  const setHear = (p: CompiledEdition["parts"][number], x: boolean) =>
    p === voicePart ? setHearVoice(x) : p.kind === "piano" ? setHearPiano(x) : setLine(p.key, { hear: x });

  // "auto" (the default) picks by the role's voice; a choice that no longer exists (the violin) does too
  const [lineChoice, setLineSound] = useLocalSetting<LineChoice>("p:lineSound", "auto");
  const lineSound: LineInstrument = resolveLine(lineChoice, roleVoiceType);
  // the spoken voice (while we compare voices, more than one may be bundled)
  const [voiceSel, setVoiceSel] = useLocalSetting<string>("p:voice", defaultVoiceId);
  // an ensemble's lines are spoken in the voice of the character whose words are shown (a man's for a man)
  const voice = (ens && voices.find((m) => m.voiceId === languageVoiceId(edition.roles.find((r) => r.id === wordsRole)?.voiceType ?? ""))) || voiceById(voiceSel);
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
  // the line box over the music can be put away altogether (the score gets the room); a button in the header brings it back
  const [cardOn, setCardOn] = useLocalSetting("p:card", true);
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
  const [noteDraft, setNoteDraft] = useState("");
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
  const roomCap = typeof window !== "undefined" && window.innerWidth < 700 ? 0.65 : 0.8;
  const fitZoom = Math.max(0.55, Math.min(MAX_ZOOM, roomCap, Math.floor(fit * 40) / 40));
  // while the music plays the size holds (redrawing then would compete with the sound): opening the full bar
  // over a playing piece on a phone leaves the music as it is until you pause
  const heldZoom = useRef<number | null>(null);
  if (engine?.state !== "playing") heldZoom.current = null;
  else if (heldZoom.current === null) heldZoom.current = fitZoom;
  const effZoom = heldZoom.current ?? fitZoom;
  const effZoomRef = useRef(effZoom);
  effZoomRef.current = effZoom;
  const onLayout = (l: ScoreLayout) => {
    layoutRef.current = l;
    const c = stripCrop(l);
    if (!c) return;
    const n = (c.h - CROP_PAD) / effZoomRef.current;
    setNatural((o) => (Math.abs(o - n) > 3 ? n : o));
  };

  useEffect(() => onVoicesChanged(() => setVoicesTick((x) => x + 1)), []);
  useEffect(() => engine?.setCountIn(countIn), [engine, countIn]);
  useEffect(() => {
    if (!engine) return;
    engine.setMix(voicePart.key, { muted: !hearVoice, solo: false, volume: volGain(vol.voice, voicePart.defaultVolume) });
    engine.setMix(pianoPart.key, { muted: !hearPiano, solo: false, volume: volGain(vol.piano, pianoPart.defaultVolume) });
    for (const p of otherVoices) {
      const ls = lineSets[p.key] ?? {};
      engine.setMix(p.key, { muted: !(ls.hear ?? true), solo: false, volume: volGain(ls.vol ?? 70, p.defaultVolume) });
    }
  }, [engine, hearVoice, hearPiano, vol, lineSets]);
  // the sung line's lowest and highest notes, so an instrument can take it an octave down when needed
  const voiceRange = useMemo<[number, number]>(() => {
    const ms = edition.notes.filter((n) => n.part === voicePart.key).map((n) => n.midi);
    return [Math.min(...ms), Math.max(...ms)];
  }, []);
  useEffect(() => {
    const port = pb.port;
    if (!port?.setInstrument) return;
    let alive = true;
    setSoundLoading(lineSound !== "piano");
    port
      .setInstrument(voicePart.channel, lineSound, voiceRange)
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
  const instOf = (p: CompiledEdition["parts"][number]) => resolveLine(lineSets[p.key]?.inst ?? "auto", voiceTypeOf(p));
  const instKey = otherVoices.map(instOf).join(",");
  useEffect(() => {
    const port = pb.port;
    if (!port?.setInstrument) return;
    for (const p of otherVoices) {
      const ms = edition.notes.filter((n) => n.part === p.key).map((n) => n.midi);
      port.setInstrument(p.channel, instOf(p), [Math.min(...ms), Math.max(...ms)]).catch(() => undefined);
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
      phrases.map((ph) => ({
        ph,
        startQ: perf.toPerfQ({ m: ph.startM, q: ph.startQ, occ: ph.occurrence }),
        endQ: perf.toPerfQ({ m: ph.endM, q: ph.endQ, occ: ph.occurrence }),
      })),
    [perf, phrases],
  );
  const currentQ = useCallback(() => (engine ? engine.displayQ() : 0), [engine]);
  const q = useTicker(() => Math.round(currentQ() * 16) / 16, 80);
  const [starting, setStarting] = useState(false);
  const playing = engine?.state === "playing";
  // the screen's playing shape (also for the moment just before the music starts)
  const live = playing || starting;

  const current = useMemo(() => {
    const cur = spans.findIndex((s) => q >= s.startQ - 1e-6 && q < s.endQ - 1e-6);
    if (cur >= 0) return { idx: cur, sounding: true };
    const next = spans.findIndex((s) => s.startQ > q);
    return { idx: next >= 0 ? next : spans.length - 1, sounding: false };
  }, [spans, q]);

  const soundingIds = useMemo(() => {
    const ev = perf.notes.find((n) => n.part === wordsPart.key && n.onQ <= q + 1e-6 && n.offQ > q + 1e-6);
    return new Set(ev?.ids ?? []);
  }, [perf, q, wordsPart]);

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
    for (const n of perf.notes) if (n.part === wordsPart.key) for (const id of n.ids) if (!m.has(id)) m.set(id, { on: n.onQ, off: n.offQ });
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
    const rec = lineClip(voice, id, ph.original);
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

  const play = async () => {
    if (!engine || !pb.port) return;
    stopSpeaking();
    setSpeakingId(null);
    await pb.port.resume();
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
      const v = JSON.parse(localStorage.getItem(atKey) ?? "null") as { q?: number } | null;
      if (v?.q && v.q > 0 && v.q < perf.totalQ - 1 && engine.state !== "playing") engine.seek(v.q);
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
        localStorage.setItem(atKey, JSON.stringify({ q, bar: perf.locate(q).number }));
      } catch {
        /* storage unavailable */
      }
    };
    save();
    return save;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, playing, Math.round(q)]);

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
  const flags: Flag[] = notes.map((n) => ({ id: n.id, m: n.m, q: n.q, kind: "note", label: n.body }));

  const loc = perf.locate(q);
  const bi = beatInfo(edition.measures[loc.m].time);
  const beat = Math.floor(loc.beat + 1e-6);
  const countLeft = engine ? engine.countInRemaining() : 0;
  const tempoPct = Math.round((engine?.tempo ?? 1) * 100);
  // the speed in the beat a singer feels; in 2/2 it is given in quarter notes, as the playback mark is (a half-note glyph is not in every font)
  const shownQ = bi.unitQ === 2 ? 1 : bi.unitQ;
  const beatSymbol = shownQ === 1.5 ? "♩." : shownQ === 0.5 ? "♪" : "♩";
  const beatBpm = Math.round((perf.bpmAt(q) / shownQ) * (engine?.tempo ?? 1));
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
    return ph.words.map((w, k) => {
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
        <span key={`${ph.id}:${k}`}>
          {k > 0 &&
            (join ? (
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
    spans.forEach((sp, i) => {
      if (sp.startQ - prevEnd >= 2.9)
        out.push({ kind: "gap", key: `gap-${i}`, startQ: prevEnd, endQ: sp.startQ, label: i === 0 ? (ens ? "Introduction" : "Piano introduction") : ens ? "Rest" : "Piano" });
      out.push({ kind: "line", key: sp.ph.id, i });
      prevEnd = sp.endQ;
    });
    if (perf.totalQ - prevEnd >= 2.9) out.push({ kind: "gap", key: "gap-end", startQ: prevEnd, endQ: perf.totalQ, label: ens ? "Ending" : "Piano ending" });
    return out;
  }, [spans, perf]);
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

  const status = countLeft ? `Count-in ${countLeft}` : pb.status === "loading" ? "Loading the piano…" : null;
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
  type GuideStep = { id: string; part: string; sel: string[]; title: string; text: string; done?: () => boolean; holeRight?: number; skipIf?: () => boolean };
  const [guide, setGuide] = useState<number>(() => {
    try {
      return localStorage.getItem(TIPS_KEY) ? -2 : -1;
    } catch {
      return -2;
    }
  });
  const [guideOk, setGuideOk] = useState(false);
  const guideStart = useRef<{ idx: number; pianoShown: boolean; hearVoice: boolean; loop: typeof loop; view: View; tempo: number; hadLoop: string | null } | null>(null);
  const pianoShownNow = showOf(pianoPart);
  const firstBar = perf.measures[0];
  const steps: GuideStep[] = [
    { id: "listen", part: "Listen", sel: ['.bar-transport [data-testid="play"]', '.bar-transport [data-testid="pause"]'], title: "Press play and listen", text: "The lit word follows the music. Press pause when you’re ready.", done: () => gTrack.current.played && !playing },
    { id: "say", part: "The words", sel: [".now-listen"], title: "Hear the line spoken", text: "Tap the speaker. The tortoise says it slowly.", done: () => gTrack.current.spoke && !speakingId },
    { id: "word", part: "The words", sel: [".word-card .wc-actions .cp-btn--ink", ".now-it"], title: "Hear a word", text: openWord ? "Tap Hear the word." : "Tap any word in the line.", done: () => gTrack.current.wordSpoke && !speakingWord },
    { id: "next", part: "The words", sel: [".now-body .now-step:last-child"], title: "Next line", text: "Tap › to move on. ‹ goes back.", done: () => guideQ.current !== null && Math.abs(q - guideQ.current) > 0.01 },
    { id: "words", part: "The words", sel: [".view-switch button:nth-child(2)"], title: "See the whole text", text: "Tap Words for the full text and translation.", done: () => view === "words" },
    { id: "music", part: "The words", sel: [".view-switch button:first-child"], title: "Back to the score", text: "Tap Music.", done: () => view === "music" },
    { id: "loop", part: "Loop", sel: [".bar-loop"], title: "Loop a bar", text: "Tap loop. The bar you’re on will repeat.", done: () => !!loop },
    { id: "edge", part: "Loop", sel: [".ov-lh-e"], holeRight: 140, title: "Add bars", text: "Drag the purple edge to the right.", done: () => !!loop && loop.endQ - loop.startQ > (barAt(loop.startQ).durQ ?? firstBar.durQ) + 1e-6 },
    { id: "playloop", part: "Loop", sel: ['.bar-transport [data-testid="play"]', '.bar-transport [data-testid="pause"]'], title: "Hear the loop", text: "Press play. Pause once you’ve heard it repeat.", done: () => gTrack.current.wrapped && !playing },
    { id: "more", part: "Sing", sel: [".bar-more"], title: "More controls", text: "Tap the arrow to open them.", done: () => barOpen, skipIf: () => barOpen || !window.matchMedia("(max-width: 640px)").matches },
    { id: "mute", part: "Sing", sel: [".bar-parts > .part:first-child"], title: "Mute your line", text: "Tap your face. Now you sing it.", done: () => !hearVoice },
    { id: "piano", part: "Sing", sel: [".piano-group .pg-btn:nth-child(2)"], title: pianoShownNow ? "Hide the piano part" : "Show the piano part", text: pianoShownNow ? "Tap the eye to see only the voices." : "Tap the eye to add the piano to the score.", done: () => !!guideStart.current && pianoShownNow !== guideStart.current.pianoShown },
    { id: "sing", part: "Sing", sel: ['.bar-transport [data-testid="play"]', '.bar-transport [data-testid="pause"]'], title: "Sing along", text: "Press play and sing your line. Pause when you’re done.", done: () => gTrack.current.played && !playing },
  ];
  const step = guide >= 0 ? steps[guide] : null;
  // where the music stood when a step began (a step done by moving through the piece compares with it)
  const guideQ = useRef<number | null>(null);
  // what has happened during this step: music heard, a loop gone round, the line or a word spoken
  // steps that do not apply on this screen, settled when the tour starts (for the count)
  const guideSkip = useRef<Set<string>>(new Set());
  const gTrack = useRef({ played: false, wrapped: false, spoke: false, wordSpoke: false, lastQ: 0 });
  useEffect(() => {
    if (guide < 0) return;
    const t = gTrack.current;
    if (playing && guideQ.current !== null && Math.abs(q - guideQ.current) > 1) t.played = true;
    if (playing && q < t.lastQ - 0.5) t.wrapped = true;
    t.lastQ = q;
    if (speakingId) t.spoke = true;
    if (speakingWord) t.wordSpoke = true;
  });
  useEffect(() => {
    gTrack.current = { played: false, wrapped: false, spoke: false, wordSpoke: false, lastQ: q };
    guideQ.current = guide >= 0 ? q : null;
    // the loop is set: put the strip away so the bar is clear for playing
    if (guide >= 0 && steps[guide]?.id === "playloop") setLoopHint(false);
    // the loop part is over: the singing steps play the music straight on, without the loop
    if (guide >= 0 && steps[guide]?.part === "Sing" && loop) {
      setLoop(null);
      setLoopHint(false);
    }
    if (guide >= 0 && steps[guide]?.id === "edge" && !loop) {
      const pm = barAt(Math.max(0, q));
      setLoop({ startQ: pm.startQ, endQ: pm.startQ + pm.durQ });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guide]);
  const putBack = () => {
    const g = guideStart.current;
    if (engine?.state === "playing") engine.pause();
    setOpenWord(null);
    if (g) {
      setHearVoice(g.hearVoice);
      setLine(pianoPart.key, { show: g.pianoShown });
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
    guideStart.current = { idx: current.idx, pianoShown: pianoShownNow, hearVoice, loop, view, tempo: engine?.tempo ?? 1, hadLoop };
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
    setGuide(n < steps.length ? n : steps.length);
  };
  // a step done: a tick for a moment, then the next one
  useEffect(() => {
    if (step && !guideOk && step.done?.()) setGuideOk(true);
  });
  useEffect(() => {
    if (!guideOk) return;
    const t = window.setTimeout(() => {
      setGuideOk(false);
      advance(guide);
    }, 650);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guideOk, guide]);
  // where the lit control is, and where the card goes
  const [guideBox, setGuideBox] = useState<{ hole: { x: number; y: number; w: number; h: number }; left: number; top: number; above: boolean; w: number } | null>(null);
  useLayoutEffect(() => {
    if (!step) {
      setGuideBox(null);
      return;
    }
    const place = () => {
      const seen = (e: Element | null): e is HTMLElement => !!e && (e as HTMLElement).getClientRects().length > 0 && getComputedStyle(e).display !== "none" && getComputedStyle(e).visibility !== "hidden";
      const el = step.sel.map((q) => document.querySelector(q)).find(seen);
      if (!el) {
        const w = Math.min(340, window.innerWidth - 32);
        setGuideBox({ hole: { x: -9999, y: -9999, w: 0, h: 0 }, left: (window.innerWidth - w) / 2, top: window.innerHeight / 2 - 100, above: false, w });
        return;
      }
      const r = el.getBoundingClientRect();
      const pad = 6;
      const hole = { x: Math.max(4, r.left - pad), y: Math.max(4, r.top - pad), w: Math.min(window.innerWidth - 8 - Math.max(4, r.left - pad), r.width + pad * 2 + (step.holeRight ?? 0)), h: Math.min(window.innerHeight - 8, r.height + pad * 2) };
      const w = Math.min(340, window.innerWidth - 32);
      const cx = hole.x + hole.w / 2;
      const left = Math.max(16, Math.min(cx - w / 2, window.innerWidth - 16 - w));
      const below = hole.y + hole.h + 210 < window.innerHeight;
      setGuideBox({ hole, left, top: below ? hole.y + hole.h + 12 : hole.y - 12, above: !below, w });
    };
    place();
    const t = window.setInterval(place, 300);
    window.addEventListener("resize", place);
    return () => {
      window.clearInterval(t);
      window.removeEventListener("resize", place);
    };
  }, [guide, view, barOpen, !!loop, playing]);
  // only the lit control (and the guide's card) answers while a step waits
  useEffect(() => {
    if (!step || !guideBox) return;
    const block = (e: Event) => {
      const t = e.target as HTMLElement;
      if (t.closest(".tip, .word-card, .ov-lh")) return;
      const pe = e as PointerEvent;
      const { x, y, w, h } = guideBox.hole;
      if (pe.clientX >= x && pe.clientX <= x + w && pe.clientY >= y && pe.clientY <= y + h) return;
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener("pointerdown", block, true);
    window.addEventListener("click", block, true);
    return () => {
      window.removeEventListener("pointerdown", block, true);
      window.removeEventListener("click", block, true);
    };
  }, [step, guideBox]);
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
            Your settings are back as they were. Replay the tour in Settings.
          </p>
          <div className="tip-actions">
            <button type="button" className="cp-btn cp-btn--ink" onClick={() => endGuide(true)}>
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
            {step.text}
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
            <button type="button" className="cp-btn" onClick={() => advance(guide)}>
              Skip
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
            {info.kind} ·{" "}
            <button type="button" className="p-sub-link" onClick={onBack}>
              {roleName}
            </button>{" "}
            ·{" "}
            {onOpera ? (
              <button type="button" className="p-sub-link" onClick={onOpera} lang={LANG}>
                <i>{info.opera}</i>
              </button>
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
        </div>
      </header>

      {/* the line: a card with one quiet header row (where you are, and how to hear it) above the words */}
      <section
        className={`now-panel${cardOn || !musicOn ? "" : " card-off"}${current.sounding ? " is-now" : ""}${live && musicOn ? " is-playing" : ""}${showIpa ? "" : " no-ipa"}${showTr ? "" : " no-tr"}${!showIpa && !showTr ? " compact" : ""}${minimal && musicOn ? " minimal" : ""}`}
        data-testid="now-panel"
      >
        <div className="line-card" style={cardTone}>
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
              <p className={`now-it${nowSyl ? " in-progress" : ""}`} lang={LANG}>
                {lineWords(shown.ph, nowSyl, !playing ? litTip : null)}
              </p>
              <p className="now-ipa" lang="it-fonipa">
                [{shown.ph.ipa}]
              </p>
              {showTr && <p className="now-tr">{curly(shown.ph.translation)}</p>}
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
          selection={loopPick?.first ? { startM: loopPick.first.m, endM: loopPick.first.m } : null}
          cuts={[]}
          flags={flags}
          onTap={onTap}
          onRange={onRange}
          onLoopEdge={onLoopEdge}
          onFlag={() => setDrawer("notes")}
          onUserScroll={() => undefined}
          onLayout={onLayout}
          strip
          joinTopStaff={false}
          ink="#0b0b0b"
          fadedXmlParts={pianoFaded && !hiddenIds.includes(pianoPart.source.xmlPartId) ? [pianoPart.source.xmlPartId] : []}
          nowNoteParts={pianoFaded ? [voicePart.source.xmlPartId] : [voicePart.source.xmlPartId, pianoPart.source.xmlPartId]}
        />
      </main>

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
              <button type="button" role="menuitem" onClick={done(() => setHear(p, !on))}>
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
          data-testid="words-view"
        >
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
                {whoPick}
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
                              <span className="w-gap-long">{wordsRole === roleId ? "You come" : `${wordsName} comes`} in at bar {entry} · </span>
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
              return (
                <article
                  key={bk.key}
                  data-key={bk.key}
                  className={`w-line${isNow ? " now" : ""}${isNext ? " next" : ""}${past ? " past" : ""}`}
                  onClick={() => goTo(sp.startQ - 0.0001)}
                  aria-current={isNow ? "true" : undefined}
                >
                  <span className="w-bar" title={barsOf(sp.startQ, sp.endQ)}>
                    {edition.measures[perf.locate(sp.startQ).m].number}
                  </span>
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
            <button type="button" className="tl-speed-chip" aria-expanded={speedPop} aria-label={`Speed ${tempoPct}%. Change it`} onClick={() => setSpeedPop(!speedPop)}>
              {Icon.slow}
              {tempoPct}%
            </button>
            {speedPop && (
              <div className="tl-speed-pop" role="group" aria-label="Speed">
                <button type="button" className="cp-icon-btn" aria-label="Slower" onClick={() => engine?.setTempoFactor(Math.max(0.4, +((engine?.tempo ?? 1) - 0.05).toFixed(2)))}>
                  {Icon.minus}
                </button>
                <b>{tempoPct}%</b>
                <button type="button" className="cp-icon-btn" aria-label="Faster" onClick={() => engine?.setTempoFactor(Math.min(1.5, +((engine?.tempo ?? 1) + 0.05).toFixed(2)))}>
                  {Icon.plus}
                </button>
                <button type="button" className="tl-speed-reset" onClick={() => engine?.setTempoFactor(1)} disabled={tempoPct === 100}>
                  100%
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <footer className={`p-bar gutter ens${barOpen ? "" : " folded"}`}>
        <div className="bar-parts many" role="group" aria-label="Parts">
          <button
            type="button"
            className="part"
            aria-pressed={hearVoice}
            onClick={() => setHearVoice(!hearVoice)}
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
          <div className={`bar-others${othersMore}`} ref={othersRef} onScroll={othersEdges}>
          {orderedIds
            .map(partByXml)
            .filter((p) => otherVoices.includes(p))
            .map((p) => {
              const on = lineSets[p.key]?.hear ?? true;
              return (
                <button
                  key={p.key}
                  type="button"
                  className="part"
                  aria-pressed={on}
                  onClick={() => setLine(p.key, { hear: !on })}
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
                {/* the piano itself is the sound switch: lit when it plays, struck through when muted */}
                <button
                  type="button"
                  className="pg-btn pg-piano"
                  aria-pressed={hearPiano}
                  onClick={() => setHearPiano(!hearPiano)}
                  aria-label={hearPiano ? "The piano plays. Mute it" : "The piano is muted. Play it"}
                  title={hearPiano ? "Piano: plays" : "Piano: muted"}
                >
                  {Icon.piano}
                </button>
                {musicOn && (
                  <>
                    <button
                      type="button"
                      className="pg-btn"
                      aria-pressed={shownP}
                      disabled={shownP && hiddenIds.length >= orderedIds.length - 1}
                      onClick={() => setLine(pianoPart.key, { show: !shownP })}
                      aria-label={shownP ? "The piano is shown in the score. Hide it" : "The piano is hidden in the score. Show it"}
                      title={shownP ? "Piano in the score: shown" : "Piano in the score: hidden"}
                    >
                      {shownP ? Icon.eye : Icon.eyeOff}
                    </button>
                    <button
                      type="button"
                      className="pg-btn"
                      aria-pressed={pianoFaded}
                      disabled={!shownP}
                      onClick={() => setPianoFaded(!pianoFaded)}
                      aria-label={pianoFaded ? "The piano is faded in the score. Show it clearly" : "Fade the piano in the score"}
                      title={pianoFaded ? "Piano faded" : "Piano clear"}
                    >
                      {Icon.fade}
                    </button>
                  </>
                )}
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
          </div>
          {mixOpen && (
            <div className="mix-pop ens" role="dialog" aria-label="Arrange the lines">
                <>
                  <p className="mix-title">Arrange the lines</p>
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
                      <span className="mix-sub">Each line: order, volume and instrument</span>
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
                    const v = isYou ? vol.voice : isPiano ? vol.piano : (ls.vol ?? 70);
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
                        <button type="button" className="mix-mini" aria-pressed={on} onClick={() => setHear(p, !on)} aria-label={on ? `Mute ${name}` : `Play ${name}`} title={on ? "Plays" : "Muted: sung live"}>
                          {on ? Icon.speaker : Icon.muted}
                        </button>
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
                              value={inst}
                              onChange={(e) => (isYou ? setLineSound(e.target.value as LineChoice) : setLine(p.key, { inst: e.target.value as LineChoice }))}
                              aria-label={`${name}'s line is played on`}
                            >
                              {LINE_SOUNDS.map((o) => (
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
                  <div className="mix-sing">
                    <span className="mix-sub">Hear</span>
                    <div className="cp-seg mix-names" role="group" aria-label="Who is heard">
                      {orderedIds.map(partByXml).map((p) => (
                        <button key={p.key} type="button" aria-pressed={hearOf(p)} onClick={() => setHear(p, !hearOf(p))}>
                          {hearOf(p) ? Icon.speaker : Icon.muted}
                          {lineName(p)}
                        </button>
                      ))}
                    </div>
                    <span className="mix-hint">
                      {ens ? "Mute anyone who is singing live." : "Mute your line to sing it yourself."}
                    </span>
                  </div>
                  <div className="mix-sing">
                    <span className="mix-sub">Show in the score</span>
                    <div className="cp-seg mix-names" role="group" aria-label="Who is shown in the score">
                      {orderedIds.map(partByXml).map((p) => {
                        const on = showOf(p);
                        return (
                          <button
                            key={p.key}
                            type="button"
                            aria-pressed={on}
                            disabled={on && hiddenIds.length >= orderedIds.length - 1}
                            onClick={() => setLine(p.key, { show: !on })}
                          >
                            {on ? Icon.eye : Icon.eyeOff}
                            {lineName(p)}
                          </button>
                        );
                      })}
                    </div>
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
              {(vol.voice !== 80 || vol.piano !== 80 || Object.keys(lineSets).length > 0 || order.length > 0) && (
                <button
                  type="button"
                  className="mix-reset"
                  onClick={() => {
                    setVol({ voice: 80, piano: 80 });
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
            {/* the beat it plays at, then the speed as a percentage between slower and faster */}
            <span className="cp-tempo__beat" aria-label={`About ${beatBpm} beats a minute`}>
              <span className="cp-beat">{beatSymbol}</span> = {beatBpm}
            </span>
            {/* − 100% + as one control */}
            <div className="cp-speed" role="group" aria-label="Speed">
            <button type="button" className="cp-icon-btn" aria-label="Slower" onClick={() => engine?.setTempoFactor(Math.max(0.4, +((engine?.tempo ?? 1) - 0.05).toFixed(2)))}>
              {Icon.minus}
            </button>
            <div className="cp-tempo__value" data-testid="tempo">
              <b>{tempoPct}%</b>
            </div>
            <button type="button" className="cp-icon-btn" aria-label="Faster" onClick={() => engine?.setTempoFactor(Math.min(1.5, +((engine?.tempo ?? 1) + 0.05).toFixed(2)))}>
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
      </footer>

        {drawer && (
          <aside className="p-drawer" aria-label="Lines, notes and about">
            <div className="p-drawer-head">
              <div className="cp-seg" role="tablist" aria-label="Panel">
                {((context ? ["context", "tips", "notes", "about"] : ["tips", "notes", "about"]) as Drawer[]).filter((d) => d !== "tips" || hasTips).map((d) => (
                  <button key={d} type="button" role="tab" aria-selected={drawer === d} onClick={() => setDrawer(d)}>
                    {d === "context" ? "The scene" : d === "tips" ? "Pronunciation" : d === "notes" ? `Notes${notes.length ? ` · ${notes.length}` : ""}` : "About"}
                  </button>
                ))}
              </div>
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
                  <section className="cp-field cp-field--note">
                    <p className="cp-eyebrow">
                      New note at bar {loc.number}, beat {beat}
                    </p>
                    <form
                      className="notes-form"
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!noteDraft.trim()) return;
                        const n: Note = { id: crypto.randomUUID(), m: loc.m, q: Math.round(loc.q * 2) / 2, body: noteDraft.trim(), at: new Date().toISOString() };
                        const next = [...notes, n].sort((a, b) => a.m - b.m || a.q - b.q);
                        setNotes(next);
                        saveNotes(next);
                        setNoteDraft("");
                      }}
                    >
                      <label className="cp-sr" htmlFor="note-input">
                        Note
                      </label>
                      <textarea id="note-input" value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} placeholder={info.notePlaceholder} />
                      <button type="submit" className="cp-btn cp-btn--ink">
                        Save note
                      </button>
                    </form>
                  </section>
                  {notes.length === 0 && <p className="wc-note">Notes are saved on this device. Tap a bar first to choose where.</p>}
                  {notes.map((n) => (
                    <article key={n.id} className="cp-note" style={{ maxWidth: "none" }}>
                      <div className="cp-note__head">
                        <button type="button" className="cp-tag cp-tag--ink" style={{ border: 0, cursor: "pointer" }} onClick={() => goTo(perf.occurrences(n.m)[0].startQ + n.q)}>
                          Bar {edition.measures[n.m].number}
                        </button>
                        <span>{new Date(n.at).toLocaleDateString()}</span>
                      </div>
                      <p>{n.body}</p>
                      <button
                        type="button"
                        className="cp-btn cp-btn--ghost"
                        style={{ justifySelf: "start" }}
                        onClick={() => {
                          const next = notes.filter((x) => x.id !== n.id);
                          setNotes(next);
                          saveNotes(next);
                        }}
                      >
                        Delete
                      </button>
                    </article>
                  ))}
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
                    <a href="https://github.com/sfzinstruments/SalamanderGrandPiano" target="_blank" rel="noreferrer">
                      Salamander Grand Piano V3
                    </a>{" "}
                    by Alexander Holm, a Yamaha C5, licensed{" "}
                    <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noreferrer">
                      Creative Commons BY 3.0
                    </a>
                    . Shortened to nine seconds a note and two loudness levels so it loads quickly.
                  </p>
                  <p>
                    Oboe, clarinet and bassoon for the sung line: recordings from{" "}
                    <a href="https://github.com/sgossner/VSCO-2-CE" target="_blank" rel="noreferrer">
                      VS Chamber Orchestra: Community Edition
                    </a>{" "}
                    by Versilian Studios, in the public domain (CC0). English horn:{" "}
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
