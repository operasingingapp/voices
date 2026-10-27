import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import editionJson from "../../data/content/puccini-o-mio-babbino-caro/edition.json";
import languageJson from "../../data/content/puccini-o-mio-babbino-caro/language.json";
import scoreXml from "../../data/content/puccini-o-mio-babbino-caro/score.musicxml?raw";
import { Performance, beatInfo } from "../../shared/timeline";
import type { CompiledEdition, CompiledLanguage } from "../../shared/types";
import { usePlayback } from "../audio/usePlayback";
import type { LineInstrument } from "../audio/samplerPort";
import { useLocalSetting, useTicker } from "../hooks";
import { ScoreView, stripCrop, type CursorReading, type Flag, type MarkerReading } from "../score/ScoreView";
import type { Lane, ScoreLayout } from "../score/layout";
import { PORTRAITS } from "./opera-extra";
import { decorate, syllableRanges, type Deco, type SylProgress } from "./syllables";
import { buildTips, type TipLine } from "./tips";
import { onVoicesChanged, speak, stopSpeaking, voiceInfo } from "./speech";

const edition = editionJson as unknown as CompiledEdition;
const language = languageJson as unknown as CompiledLanguage;
const LANGUAGE_NAMES: Record<string, string> = { it: "Italian", de: "German", fr: "French", ru: "Russian", cs: "Czech", es: "Spanish", en: "English", la: "Latin" };
const ORIGINAL = LANGUAGE_NAMES[language.language] ?? "Original";
/** Typographic apostrophes for display: l’anello, vo’, I’d (the data keeps plain ones). */
const curly = (t: string) => t.replace(/'/g, "\u2019");

// Offline placeholder recordings, used only when the device has no Italian voice.
const audioModules = import.meta.glob("../../data/content/puccini-o-mio-babbino-caro/audio/*.mp3", {
  query: "?inline",
  import: "default",
  eager: true,
}) as Record<string, string>;
const audioUrl = (file?: string) => (file ? Object.entries(audioModules).find(([k]) => k.endsWith(`/${file}`))?.[1] : undefined);

const voicePart = edition.parts.find((p) => p.kind === "voice")!;
const pianoPart = edition.parts.find((p) => p.kind === "piano")!;

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
      const inVoice = dir.closest("part")?.getAttribute("id") === voicePart.source.xmlPartId;
      const tempoMark =
        !!Array.from(dir.children).find((c) => c.nodeName === "sound")?.getAttribute("tempo") ||
        types.some((dt) => Array.from(dt.children).some((c) => c.nodeName === "rehearsal" || c.nodeName === "metronome"));
      // stage directions under the voice ("Lauretta (in ginocchio…)") would push the syllables down along the whole line
      const words = types.flatMap((dt) => Array.from(dt.children)).map((c) => (c.nodeName === "words" ? (c.textContent ?? "").trim() : null));
      const stageDirection = inVoice && words.length > 0 && words.every((w) => w !== null && (w.length > 20 || /^[A-Z][a-z]+$/.test(w)));
      // piano pedal brackets: a pianist's marking; drawn far below the bass staff they cost the whole line
      // its size, and a singer reading along does not use them
      const pedalOnly = types.length > 0 && types.every((dt) => Array.from(dt.children).every((c) => c.nodeName === "pedal"));
      if (playbackOnly || (inVoice && tempoMark) || stageDirection || pedalOnly) dir.parentNode?.removeChild(dir);
    }
    for (const lyric of Array.from(doc.getElementsByTagName("lyric"))) {
      const texts = Array.from(lyric.children).filter((c) => c.nodeName === "text");
      // typographic apostrophes, as in print: l’anello, vo’
      for (const t of texts) t.textContent = (t.textContent ?? "").replace(/'/g, "\u2019");
      if (texts.length < 2) continue;
      // two syllables on one note are joined by the undertie (vo’‿an, re‿in); MuseScore's elision glyph is dropped
      texts[0].textContent = texts
        .map((t) => (t.textContent ?? "").replace(/[\uE551\u203F]/g, "").trim())
        .filter(Boolean)
        .join("\u203F");
      for (const t of texts.slice(1)) lyric.removeChild(t);
      for (const e of Array.from(lyric.children).filter((c) => c.nodeName === "elision")) lyric.removeChild(e);
    }
    return new XMLSerializer().serializeToString(doc);
  } catch {
    return xml;
  }
}
const displayXml = prepareForDisplay(scoreXml);

/** Tempo words in force in each bar ("Andantino ingenuo"), shown in the bar box. */
const tempoWords: string[] = (() => {
  let cur = "";
  return edition.measures.map((m) => {
    for (const t of m.tempos) if (t.text && !/^\s*\.\d+\s*$/.test(t.text)) cur = t.text.trim();
    return cur;
  });
})();

interface Note {
  id: string;
  m: number;
  q: number;
  body: string;
  at: string;
}
const NOTES_KEY = "cp:babbino:notes";
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
      <path fill="none" stroke="currentColor" strokeWidth="2" d="M3 5h18v14H3zM8 5v14M13 5v14M18 5v14" />
      <path fill="currentColor" d="M6.5 5h3v8h-3zM16.5 5h3v8h-3zM11.5 5h3v8h-3z" opacity="0" />
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
  sliders: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M4 7h9M17 7h3M4 17h3M11 17h9" />
      <circle cx="15" cy="7" r="2.2" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="9" cy="17" r="2.2" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
};

const LINE_SOUNDS: { id: LineInstrument; label: string }[] = [
  { id: "piano", label: "Piano" },
  { id: "oboe", label: "Oboe" },
  { id: "violin", label: "Violin" },
];
/** volume slider (0–100, 80 = the part's normal level) to gain: squared, so the slider feels even to the ear */
const volGain = (v: number, base: number) => base * (Math.max(0, v) / 80) ** 2;

type Drawer = "context" | "tips" | "notes" | "about";
type View = "music" | "words";
type OpenWord = { lineId: string; k: number; left: number; top: number };
/** The fixed padding stripCrop adds around the drawn band, in px (does not scale with zoom). */
const CROP_PAD = 36;
/** Largest size of the music: comfortable on a music stand, still a few bars per screen. */
const MAX_ZOOM = 1.15;

function fmtTime(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Three tips shown once, the first time you practise, each next to what it explains. */
const TIPS = [
  { sel: ".now-it", text: "Tap any word for its meaning and how to say it." },
  { sel: ".view-switch", text: "Words shows the whole text, without the notes." },
  { sel: ".part-fade", text: "Fade the piano so your own line stands out." },
];
const TIPS_KEY = "cp:tipsDone";

export function Practice({
  onBack,
  roleName,
  learned,
  onToggleLearned,
  context,
  inOpera,
}: {
  onBack: () => void;
  roleName: string;
  learned?: boolean;
  onToggleLearned?: () => void;
  /** what is happening in the opera when this is sung */
  context?: string;
  /** where it falls in the opera's running order */
  inOpera?: { n: number; total: number; before?: string; after?: string; opera: string };
}) {
  // steady pulse for learning (the file's bar-by-bar rubato smoothed away), or the expressive reading
  const [steady, setSteady] = useLocalSetting("p:steady", true);
  const perf = useMemo(() => new Performance(edition, [], { tempo: steady ? "steady" : "smooth", pedal: true }), [steady]);
  const pb = usePlayback(perf, edition.parts);
  const engine = pb.engine;

  const [pianoFaded, setPianoFaded] = useLocalSetting("p:pianoFaded", true);
  const [hearVoice, setHearVoice] = useLocalSetting("p:hearVoice", true);
  const [hearPiano, setHearPiano] = useLocalSetting("p:hearPiano", true);
  const [countIn, setCountIn] = useLocalSetting("p:countin", true);
  // how loud each part is (80 = normal), and what the sung line is played on
  const [vol, setVol] = useLocalSetting<{ voice: number; piano: number }>("p:vol", { voice: 80, piano: 80 });
  const [lineSound, setLineSound] = useLocalSetting<LineInstrument>("p:lineSound", "piano");
  const [soundLoading, setSoundLoading] = useState(false);
  const [mixOpen, setMixOpen] = useState(false);
  const [drawer, setDrawer] = useState<Drawer | null>(null);
  const [openWord, setOpenWord] = useState<OpenWord | null>(null);
  const [view, setView] = useLocalSetting<View>("p:view", "music");
  // words view: the IPA under each line can be hidden
  const [showIpa, setShowIpa] = useLocalSetting("p:ipa", true);
  // pronunciation tips: in full where a sound first occurs, a quiet mark on the words it applies to later
  // pronunciation tips live in one place: a strip above the words (and the music card's header), about the
  // line you are on; only that line's letters are marked, so the rest stays two clean columns
  const [showTips, setShowTips] = useLocalSetting("p:tipsBar", true);
  const tips = useMemo(() => buildTips(language.phrases as unknown as TipLine[]), []);
  const sylRanges = useMemo(() => new Map(language.phrases.map((ph) => [ph.id, syllableRanges(ph)])), []);
  const [tipIdx, setTipIdx] = useState(0);
  const [tipOpen, setTipOpen] = useState(false);
  const [tip, setTip] = useState<number>(() => {
    try {
      return localStorage.getItem(TIPS_KEY) ? -1 : 0;
    } catch {
      return -1;
    }
  });
  const [tipPos, setTipPos] = useState<{ left: number; top: number; above: boolean; arrow: number; w: number } | null>(null);
  const endTips = () => {
    setTip(-1);
    try {
      localStorage.setItem(TIPS_KEY, "1");
    } catch {
      /* storage unavailable */
    }
  };
  useLayoutEffect(() => {
    if (tip < 0) return;
    const placeTip = () => {
      const el = document.querySelector<HTMLElement>(TIPS[tip].sel);
      if (!el || !el.getClientRects().length || getComputedStyle(el).visibility === "hidden") {
        if (tip < TIPS.length - 1) setTip(tip + 1);
        else endTips();
        return;
      }
      const r = el.getBoundingClientRect();
      const w = Math.min(320, window.innerWidth - 32);
      const cx = r.left + r.width / 2;
      const left = Math.max(16, Math.min(cx - w / 2, window.innerWidth - 16 - w));
      const below = r.bottom + 160 < window.innerHeight;
      setTipPos({ left, top: below ? r.bottom + 14 : r.top - 14, above: !below, arrow: Math.max(18, Math.min(w - 18, cx - left)), w });
    };
    placeTip();
    window.addEventListener("resize", placeTip);
    return () => window.removeEventListener("resize", placeTip);
  }, [tip, view]);
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
  const fit = natural && stageH ? (stageH - 24 - CROP_PAD) / natural : Infinity;
  const effZoom = Math.max(0.55, Math.min(MAX_ZOOM, Math.floor(fit * 40) / 40));
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
  }, [engine, hearVoice, hearPiano, vol]);
  useEffect(() => {
    const port = pb.port;
    if (!port?.setInstrument) return;
    let alive = true;
    setSoundLoading(lineSound !== "piano");
    port
      .setInstrument(voicePart.channel, lineSound)
      .catch(() => undefined)
      .finally(() => alive && setSoundLoading(false));
    return () => {
      alive = false;
    };
  }, [pb.port, lineSound]);
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
      language.phrases.map((ph) => ({
        ph,
        startQ: perf.toPerfQ({ m: ph.startM, q: ph.startQ, occ: ph.occurrence }),
        endQ: perf.toPerfQ({ m: ph.endM, q: ph.endQ, occ: ph.occurrence }),
      })),
    [perf],
  );
  const currentQ = useCallback(() => (engine ? engine.displayQ() : 0), [engine]);
  const q = useTicker(() => Math.round(currentQ() * 16) / 16, 80);
  const playing = engine?.state === "playing";

  const current = useMemo(() => {
    const cur = spans.findIndex((s) => q >= s.startQ - 1e-6 && q < s.endQ - 1e-6);
    if (cur >= 0) return { idx: cur, sounding: true };
    const next = spans.findIndex((s) => s.startQ > q);
    return { idx: next >= 0 ? next : spans.length - 1, sounding: false };
  }, [spans, q]);

  const soundingIds = useMemo(() => {
    const ev = perf.notes.find((n) => n.part === voicePart.key && n.onQ <= q + 1e-6 && n.offQ > q + 1e-6);
    return new Set(ev?.ids ?? []);
  }, [perf, q]);

  // the line shown in the panel: the one being sung, otherwise the next one
  const shown = spans[current.idx];
  // the tips for that line (at most two: the ones that start here come first)
  const lineTips = (tips.lineTips.get(shown.ph.id) ?? []).slice(0, 2);
  useEffect(() => {
    setTipIdx(0);
    setTipOpen(false);
  }, [shown.ph.id]);
  const curTip = showTips && lineTips.length ? lineTips[tipIdx % lineTips.length] : null;
  const litTip = curTip?.tip.id ?? null;
  // where each sung note lies on the timeline, by note id (a tied note: the whole tie)
  const voiceSpan = useMemo(() => {
    const m = new Map<string, { on: number; off: number }>();
    for (const n of perf.notes) if (n.part === voicePart.key) for (const id of n.ids) if (!m.has(id)) m.set(id, { on: n.onQ, off: n.offQ });
    return m;
  }, [perf]);
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

  const sayPhrase = async (id: string, slow = false) => {
    const ph = language.phrases.find((p) => p.id === id)!;
    if (engine?.state === "playing") engine.pause();
    setSpeakingId(id);
    await speak({ text: ph.original, normalUrl: audioUrl(ph.audio.normal?.file), slowUrl: audioUrl(ph.audio.slow?.file) }, slow);
    setSpeakingId((s) => (s === id ? null : s));
  };
  const sayWord = async (key: string, text: string, slow = false) => {
    if (engine?.state === "playing") engine.pause();
    setSpeakingWord(key);
    await speak({ text: text.replace(/[.,;:!?«»“”]+/g, "") }, slow);
    setSpeakingWord((k) => (k === key ? null : k));
  };
  useEffect(() => () => stopSpeaking(), []);

  const play = async () => {
    if (!engine || !pb.port) return;
    stopSpeaking();
    setSpeakingId(null);
    await pb.port.resume();
    engine.play();
  };

  const onTap = (pos: { m: number; q: number }) => {
    const occs = perf.occurrences(pos.m);
    if (occs.length) goTo(occs[0].startQ + pos.q);
  };

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
  const beatSymbol = bi.unitQ === 1.5 ? "♩." : bi.unitQ === 0.5 ? "♪" : "♩";
  const beatBpm = Math.round((perf.bpmAt(q) / bi.unitQ) * (engine?.tempo ?? 1));
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
    (window as unknown as Record<string, unknown>).__cp = { perf, layout: () => layoutRef.current, engine, currentQ, port: pb.port };
  });

  const wordCard = (lineId: string, k: number, close: () => void) => {
    const line = language.phrases.find((p) => p.id === lineId);
    const w = line?.words[k];
    if (!line || !w) return null;
    const groups = line.glossGroups.filter((g) => g.words.includes(k));
    const key = `${lineId}:${k}`;
    return (
      <>
        <div className="wc-head">
          <span className="wc-word" lang="it">
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
          {deviceVoice ? (
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
              <span className="wc-note">This device has no Italian voice for single words.</span>
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
            className={`now-word${sung ? " w-done" : ""}${lit ? " sung" : ""}${openWord?.lineId === ph.id && openWord.k === k ? " open" : ""}`}
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
      if (sp.startQ - prevEnd >= 2.9) out.push({ kind: "gap", key: `gap-${i}`, startQ: prevEnd, endQ: sp.startQ, label: i === 0 ? "Piano introduction" : "Piano" });
      out.push({ kind: "line", key: sp.ph.id, i });
      prevEnd = sp.endQ;
    });
    if (perf.totalQ - prevEnd >= 2.9) out.push({ kind: "gap", key: "gap-end", startQ: prevEnd, endQ: perf.totalQ, label: "Piano ending" });
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
    if (!box || view !== "words") return;
    if (performance.now() - wordsTouched.current < 3000) return;
    const el = box.querySelector<HTMLElement>(`[data-key="${activeKey}"]`);
    if (!el) return;
    // keep the line being sung in the upper third, so the lines coming next are in view
    box.scrollTo({ top: Math.max(0, el.offsetTop - box.clientHeight * 0.3), behavior: playing ? "smooth" : "auto" });
  }, [activeKey, view, playing]);

  const status = countLeft ? `Count-in ${countLeft}` : pb.status === "loading" ? "Loading the piano…" : null;
  const qNow = Math.max(0, q);
  const tf = engine?.tempo ?? 1;
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

  return (
    <div className={`practice is-${view}`}>
      <header className="p-head gutter">
        <button type="button" className="cp-icon-btn" onClick={onBack} aria-label={`Back to ${roleName}`}>
          {Icon.back}
        </button>
        <div className="p-title">
          <p className="cp-eyebrow">Aria · {roleName} · Gianni Schicchi</p>
          <h1 lang="it">{edition.title}</h1>
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
          <button
            type="button"
            className="cp-btn details-btn"
            aria-label={`Details: the scene, notes${notes.length ? ` (${notes.length})` : ""} and about`}
            aria-pressed={!!drawer}
            onClick={() => setDrawer(drawer ? null : context ? "context" : "notes")}
          >
            {Icon.info}
            <span className="label">Details</span>
            {learned && <span className="details-done" aria-hidden="true">{Icon.check}</span>}
          </button>
        </div>
      </header>

      {/* the line: a card with one quiet header row (where you are, and how to hear it) above the words */}
      <section className={`now-panel${current.sounding ? " is-now" : ""}${showIpa ? "" : " no-ipa"}`} data-testid="now-panel">
        <div className="line-card">
          <div className="now-bar">
            <p className="now-meta">
              <span className="now-dot" aria-hidden="true" />
              {current.sounding ? "Now singing" : q < spans[0].startQ ? "First line" : "Next"}
            </p>
            {!playing && curTip && (
              <button
                type="button"
                className="now-tip"
                onClick={(e) => {
                  const el = (e.currentTarget.closest(".line-card")?.querySelectorAll<HTMLElement>(".now-it .now-word") ?? [])[curTip.word];
                  if (el) openWordAt(shown.ph.id, curTip.word, el);
                }}
              >
                {Icon.tip}
                <span>
                  {curTip.tip.title} ·{" "}
                  <i className="now-tip-word" lang="it">
                    {curly(shown.ph.words[curTip.word]?.text.replace(/[.,;:!?]+$/, "") ?? "")}
                  </i>
                </span>
              </button>
            )}
            <div className="now-tools">
              <div className="now-listen" role="group" aria-label="Hear this line spoken">
                <button type="button" className="nl-btn" onClick={() => sayPhrase(shown.ph.id)} aria-pressed={speakingId === shown.ph.id}>
                  {Icon.speaker}
                  <span>Hear it</span>
                </button>
                <button type="button" className="nl-btn nl-slow" onClick={() => sayPhrase(shown.ph.id, true)} aria-label="Hear it slowly" title="Slowly">
                  {Icon.slow}
                </button>
              </div>
              <button type="button" className="nl-chip" aria-pressed={showIpa} onClick={() => setShowIpa(!showIpa)} title={showIpa ? "Hide the IPA" : "Show the IPA"}>
                IPA
              </button>
            </div>
          </div>
          <div className="now-body">
            <button type="button" className="now-step" onClick={() => stepLine(-1)} aria-label="Back to the start of this line, or the line before">
              {Icon.left}
            </button>
            <div className="now-inner" aria-live="polite">
              <p className={`now-it${nowSyl ? " in-progress" : ""}`} lang="it">
                {lineWords(shown.ph, nowSyl, !playing ? litTip : null)}
              </p>
              <p className="now-ipa" lang="it-fonipa">
                [{shown.ph.ipa}]
              </p>
              <p className="now-tr">{curly(shown.ph.translation)}</p>
              {view === "music" && cardFor(shown.ph.id, "now-card-word")}
            </div>
            <button type="button" className="now-step" onClick={() => stepLine(1)} aria-label="Next line">
              {Icon.right}
            </button>
          </div>
        </div>
      </section>

      <main className="p-stage" ref={stageRef} onPointerDown={() => view === "music" && openWord && setOpenWord(null)}>
        <ScoreView
          xml={displayXml}
          edition={edition}
          perf={perf}
          visibleXmlParts={null}
          zoom={effZoom}
          cursor={cursorRef}
          marker={markerRef}
          scrollTarget={playing ? "cursor" : "none"}
          loop={null}
          selection={null}
          cuts={[]}
          flags={flags}
          onTap={onTap}
          onFlag={() => setDrawer("notes")}
          onUserScroll={() => undefined}
          onLayout={onLayout}
          strip
          joinTopStaff={false}
          ink="#0b0b0b"
          fadedXmlParts={pianoFaded ? [pianoPart.source.xmlPartId] : []}
          nowNoteParts={pianoFaded ? [voicePart.source.xmlPartId] : [voicePart.source.xmlPartId, pianoPart.source.xmlPartId]}
        />
      </main>

      {view === "words" && (
        <div
          className={`words-view${playing ? " is-playing" : ""}`}
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
                <button type="button" className="w-chip" aria-pressed={showIpa} onClick={() => setShowIpa(!showIpa)} title={showIpa ? "Hide the IPA" : "Show the IPA"}>
                  IPA
                </button>
                <button type="button" className="w-chip" aria-pressed={showTips} onClick={() => setShowTips(!showTips)} title={showTips ? "Hide the pronunciation tips" : "Show the pronunciation tips"}>
                  {Icon.tip}
                  Tips
                </button>
              </span>
              {showTips && (
                <div className={`tipstrip${curTip ? "" : " empty"}`} aria-live="polite">
                  {curTip ? (
                    <>
                      <button type="button" className="ts-main" aria-expanded={tipOpen} onClick={() => setTipOpen(!tipOpen)}>
                        {Icon.tip}
                        <span className="ts-where">Bar {edition.measures[shown.ph.startM].number}</span>
                        <span className="ts-title">{curTip.tip.title}</span>
                        <span className="ts-word" lang="it">
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
                              <span className="w-gap-long">You come in at bar {entry} · </span>
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
                    <p className={`w-it${isNow && nowSyl ? " in-progress" : ""}`} lang="it">
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
                  <p className="w-tr">{curly(sp.ph.translation)}</p>
                  {cardFor(sp.ph.id)}
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* where you are, and the progress line to scrub: in the dock, right above the playback buttons */}
      <div className="p-timeline gutter">
        <div className="tl-label" data-testid="location">
          <b>{status ?? `Bar ${loc.number} · ${beat}`}</b>
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
          <span className="tl-line done" style={{ width: `${pct}%` }} />
          {spans.map((s, i) => {
            const a = frac(s.startQ) * 100;
            const b = frac(s.endQ) * 100;
            const fill = Math.min(100, Math.max(0, ((pct - a) / Math.max(0.001, b - a)) * 100));
            return (
              <span key={s.ph.id} className={`tl-seg${i === current.idx && current.sounding ? " now" : ""}`} style={{ left: `${a}%`, width: `${b - a}%` }}>
                <i style={{ width: `${fill}%` }} />
              </span>
            );
          })}
          <span className="tl-head" style={{ left: `${pct}%` }} />
        </div>
        <div className="tl-time">
          {fmtTime(perf.qToSec(qNow) / tf)} <span>/ {fmtTime(total / tf)}</span>
        </div>
      </div>

      <footer className="p-bar gutter">
        <div className="bar-parts" role="group" aria-label="Parts">
          <button
            type="button"
            className="part"
            aria-pressed={hearVoice}
            onClick={() => setHearVoice(!hearVoice)}
            aria-label={hearVoice ? `${roleName}'s line plays. Mute it to sing it yourself` : `${roleName}'s line is muted. Play it`}
          >
            <span className="part-face you" data-tone="pink" aria-hidden="true">
              <img className="face-img" src={PORTRAITS["schicchi:lauretta"].face} alt="" />
            </span>
            <span className="part-text">
              <b>{roleName}</b>
              <small>{hearVoice ? "Her line plays" : "Muted: you sing"}</small>
            </span>
            <span className="part-icon">{hearVoice ? Icon.speaker : Icon.muted}</span>
          </button>
          <button type="button" className="part" aria-pressed={hearPiano} onClick={() => setHearPiano(!hearPiano)} aria-label={hearPiano ? "The piano plays. Mute it" : "The piano is muted. Play it"}>
            <span className="part-face piano" aria-hidden="true">
              {Icon.piano}
            </span>
            <span className="part-text">
              <b>Piano</b>
              <small>{hearPiano ? "Plays" : "Muted"}</small>
            </span>
            <span className="part-icon">{hearPiano ? Icon.speaker : Icon.muted}</span>
          </button>
          <button
            type="button"
            className="cp-btn part-fade mix-btn"
            aria-haspopup="dialog"
            aria-expanded={mixOpen}
            aria-label="Sound: volume of each part, and what the sung line is played on"
            onClick={() => setMixOpen(!mixOpen)}
          >
            {Icon.sliders}
            <span>Sound</span>
          </button>
          {mixOpen && (
            <div className="mix-pop" role="dialog" aria-label="Sound">
              <div className="mix-row">
                <span className="part-face you" data-tone="pink" aria-hidden="true">
                  <img className="face-img" src={PORTRAITS["schicchi:lauretta"].face} alt="" />
                </span>
                <div className="mix-main">
                  <div className="mix-head">
                    <b>{roleName}'s line</b>
                    <span>{hearVoice ? `${vol.voice}%` : "Muted"}</span>
                  </div>
                  <input
                    type="range"
                    className="cp-slider"
                    min={0}
                    max={100}
                    step={5}
                    value={vol.voice}
                    style={{ ["--fill" as string]: `${vol.voice}%` }}
                    aria-label={`${roleName}'s line: volume`}
                    onChange={(e) => {
                      setVol({ ...vol, voice: Number(e.target.value) });
                      if (!hearVoice) setHearVoice(true);
                    }}
                  />
                  <div className="mix-inst">
                    <span>Played on</span>
                    <div className="cp-seg" role="group" aria-label={`${roleName}'s line is played on`}>
                      {LINE_SOUNDS.map((o) => (
                        <button key={o.id} type="button" aria-pressed={lineSound === o.id} onClick={() => setLineSound(o.id)}>
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {soundLoading && <p className="mix-note">Loading the {lineSound}…</p>}
                </div>
              </div>
              <div className="mix-row">
                <span className="part-face piano" aria-hidden="true">
                  {Icon.piano}
                </span>
                <div className="mix-main">
                  <div className="mix-head">
                    <b>Piano</b>
                    <span>{hearPiano ? `${vol.piano}%` : "Muted"}</span>
                  </div>
                  <input
                    type="range"
                    className="cp-slider"
                    min={0}
                    max={100}
                    step={5}
                    value={vol.piano}
                    style={{ ["--fill" as string]: `${vol.piano}%` }}
                    aria-label="Piano: volume"
                    onChange={(e) => {
                      setVol({ ...vol, piano: Number(e.target.value) });
                      if (!hearPiano) setHearPiano(true);
                    }}
                  />
                </div>
              </div>
              {(vol.voice !== 80 || vol.piano !== 80) && (
                <button type="button" className="mix-reset" onClick={() => setVol({ voice: 80, piano: 80 })}>
                  Back to the usual balance
                </button>
              )}
            </div>
          )}
          {view === "music" && (
          <button
            type="button"
            className="cp-btn part-fade"
            aria-pressed={pianoFaded}
            onClick={() => setPianoFaded(!pianoFaded)}
            aria-label={pianoFaded ? "The piano part is faded. Show it clearly" : "Fade the piano part"}
            title={pianoFaded ? "Show the piano clearly" : "Fade the piano"}
          >
            {Icon.fade}
            <span>Fade piano</span>
          </button>
          )}
        </div>

        <div className="bar-transport">
          <button type="button" className="cp-icon-btn bar-stop" onClick={() => engine?.stop()} aria-label="Stop and go back to the start">
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
        </div>

        <div className="bar-right">
          <div className="cp-tempo">
            <button type="button" className="cp-icon-btn" aria-label="Slower" onClick={() => engine?.setTempoFactor(Math.max(0.4, +((engine?.tempo ?? 1) - 0.05).toFixed(2)))}>
              {Icon.minus}
            </button>
            <div className="cp-tempo__value" data-testid="tempo">
              <b>{tempoPct}%</b>
              <span>
                <span className="cp-beat">{beatSymbol}</span> ≈ {beatBpm}
              </span>
            </div>
            <button type="button" className="cp-icon-btn" aria-label="Faster" onClick={() => engine?.setTempoFactor(Math.min(1.5, +((engine?.tempo ?? 1) + 0.05).toFixed(2)))}>
              {Icon.plus}
            </button>
          </div>
          <button
            type="button"
            className="cp-toggle"
            aria-pressed={steady}
            onClick={() => setSteady(!steady)}
            title={steady ? "Steady pulse. Turn off to hear the score's rubato" : "With the score's rubato. Turn on for a steady pulse"}
          >
            Steady
          </button>
          <button type="button" className="cp-toggle" aria-pressed={countIn} onClick={() => setCountIn(!countIn)}>
            Count-in
          </button>
        </div>
        {pb.status === "error" && <p className="dock-status">{pb.error}</p>}
      </footer>

        {drawer && (
          <aside className="p-drawer" aria-label="Lines, notes and about">
            <div className="p-drawer-head">
              <div className="cp-seg" role="tablist" aria-label="Panel">
                {((context ? ["context", "tips", "notes", "about"] : ["tips", "notes", "about"]) as Drawer[]).map((d) => (
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
                  <p className="tips-intro">How the words are spoken, in the order you meet them. Tap one to go to its line.</p>
                  <ol>
                    {tips.list.map((t) => {
                      const i = spans.findIndex((sp) => sp.ph.id === t.lineId);
                      const sp = spans[i];
                      const word = sp?.ph.words[t.word]?.text.replace(/[.,;:!?]+$/, "") ?? "";
                      return (
                        <li key={t.id}>
                          <button type="button" onClick={() => sp && goTo(sp.startQ - 0.0001)}>
                            <small>
                              Bar {sp ? edition.measures[sp.ph.startM].number : ""} · <span lang="it">{curly(word)}</span>
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
                      <dd>A♭ major, after a 4-bar introduction</dd>
                    </div>
                    <div>
                      <dt>Time</dt>
                      <dd>6/8 (the introduction in 3/4)</dd>
                    </div>
                    <div>
                      <dt>Tempo</dt>
                      <dd>Andantino ingenuo, ♩. ≈ 33 (♪ = 100), the engraving's marking: Puccini gives no number</dd>
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
                      <textarea id="note-input" value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} placeholder="Breathe after “caro”, keep the line through “mi piace”" />
                      <button type="submit" className="cp-btn cp-btn--ink">
                        Save note
                      </button>
                    </form>
                  </section>
                  {notes.length === 0 && <p className="wc-note">Notes stay in this browser on this device. Tap the music first to choose the bar.</p>}
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
                  <p>
                    Score: engraving by{" "}
                    <a href="https://www.cafe-puccini.dk" target="_blank" rel="noreferrer">
                      www.cafe-puccini.dk
                    </a>{" "}
                    (MuseScore, 8 January 2023), licensed{" "}
                    <a href="https://creativecommons.org/licenses/by-nc-nd/4.0/" target="_blank" rel="noreferrer">
                      Creative Commons BY-NC-ND
                    </a>
                    . Played unchanged, for non-commercial use. On screen it is shown on one line; the tempo and rehearsal marks appear in the bar box, the
                    engraving's playback-only tempo numbers and the opening stage direction are left off the line, and joined syllables use ‿.
                  </p>
                  <p>
                    Music by Giacomo Puccini (public domain). Text by Giovacchino Forzano, first published 1918: public domain in the US, still protected in the EU
                    until 2040. The IPA, word meanings and translation were written for this app and have not yet been reviewed by a diction coach.
                  </p>
                  <p>
                    Spoken lines use your device's Italian voice when it has one ({deviceVoice ? `here: ${voiceInfo(false).kind === "device" ? (voiceInfo(false) as { name: string }).name : ""}` : "none found here, so robotic placeholder recordings play"}).
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
                    Oboe and violin for the sung line: recordings from{" "}
                    <a href="https://github.com/sgossner/VSCO-2-CE" target="_blank" rel="noreferrer">
                      VS Chamber Orchestra: Community Edition
                    </a>{" "}
                    by Versilian Studios, in the public domain (CC0). The piano's pedalling follows the edition's marks where it has them, and
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
            <b>That's the whole aria.</b>
            {learned ? " It's marked as learned." : " Do you know it now?"}
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
      {tip >= 0 && tipPos && (
        <div
          className={`tip${tipPos.above ? " above" : ""}`}
          style={{ left: tipPos.left, top: tipPos.top, width: tipPos.w }}
          role="dialog"
          aria-label={`Tip ${tip + 1} of ${TIPS.length}`}
        >
          <span className="tip-arrow" style={{ left: tipPos.arrow }} />
          <p>
            <b>
              Tip {tip + 1} of {TIPS.length}
            </b>
            {TIPS[tip].text}
          </p>
          <div className="tip-actions">
            <button type="button" className="cp-btn cp-btn--ghost" onClick={endTips}>
              Skip tips
            </button>
            <button type="button" className="cp-btn cp-btn--ink" onClick={() => (tip < TIPS.length - 1 ? setTip(tip + 1) : endTips())}>
              {tip < TIPS.length - 1 ? "Next" : "Got it"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
