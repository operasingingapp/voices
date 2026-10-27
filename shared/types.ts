/**
 * Shared data model for Counterpart.
 *
 * Musical positions are always expressed with musical identifiers
 * (score version, measure index, offset in quarter notes, performance occurrence, note id)
 * and never with page numbers or screen coordinates.
 */

export type PartKind = "voice" | "piano";

/** Explicit mapping from a notated part (MusicXML part + staves) to a playback channel. */
export interface PlaybackPart {
  key: string; // stable app-level part key, e.g. "soprano", "piano"
  label: string; // "Clara (Soprano)"
  shortLabel: string; // "Clara"
  kind: PartKind;
  roleId?: string;
  source: { xmlPartId: string; staves?: number[] };
  channel: number; // MIDI channel used by the synth (explicit, never inferred from order)
  program: number; // GM program (0 = Acoustic Grand Piano)
  velocityScale: number; // vocal lines use a softer touch
  defaultVolume: number; // 0..1
}

export interface Role {
  id: string;
  name: string; // character name
  voiceType: string; // "Soprano"
  partKey: string;
}

export interface TempoMark {
  q: number; // offset in quarters inside the measure
  bpm: number; // quarter notes per minute
  text?: string;
}

export interface MeasureInfo {
  idx: number; // 0-based index in the notated score (stable measure identifier)
  number: string; // printed measure number
  startQ: number; // written start (uncut, unrepeated), in quarters
  durQ: number;
  time: [number, number];
  tempos: TempoMark[];
  repeatStart?: boolean;
  repeatEnd?: { times: number };
  endings?: { numbers: number[]; type: "start" | "stop" | "discontinue" }[];
  rehearsal?: string;
  words?: { q: number; text: string }[];
  /** sustain-pedal marks written in the edition (part = PlaybackPart.key) */
  pedals?: { q: number; part: string; type: "start" | "stop" | "change" }[];
}

export interface LyricSyllable {
  text: string;
  syllabic: "single" | "begin" | "middle" | "end";
}

export interface NoteLyric {
  verse: number; // MusicXML lyric number
  syllables: LyricSyllable[]; // more than one when an elision joins words on one note
  extend?: boolean;
}

export interface NoteInfo {
  id: string; // stable note identifier from the MusicXML <note id>
  part: string; // PlaybackPart.key
  xmlPart: string;
  staff: number;
  voice: string;
  m: number; // measure idx
  q: number; // onset in quarters inside the measure
  dur: number; // notated duration in quarters
  midi: number;
  vel: number; // 1..127 before part scaling
  tieStart: boolean;
  tieStop: boolean;
  fermata?: boolean;
  /**
   * Tremolo: "single" repeats this note; "start"/"stop" alternate it with the next note (a fingered
   * tremolo, e.g. octaves). marks = number of strokes or beams (3 = demisemiquavers).
   */
  tremolo?: { type: "single" | "start" | "stop"; marks: number };
  /** Trill: alternates with `upper` (MIDI), the next note up the scale. */
  trill?: { upper: number };
  lyrics?: NoteLyric[];
}

export interface Passage {
  id: string;
  label: string;
  startM: number; // measure idx
  endM: number; // inclusive measure idx
}

export interface LicenceRecord {
  item: string;
  source: string;
  author: string;
  licence: string;
  notes?: string;
}

export interface CompiledEdition {
  schema: 1;
  editionId: string;
  editionVersion: string;
  scoreVersionId: string; // `${editionId}@${editionVersion}#${hash}`
  contentHash: string;
  title: string;
  subtitle?: string;
  kind: "aria" | "ensemble";
  fixture: boolean;
  fixtureNotice?: string;
  composer: string;
  librettist: string;
  language: string;
  keySignature: string;
  parts: PlaybackPart[];
  roles: Role[];
  measures: MeasureInfo[];
  notes: NoteInfo[];
  passages: Passage[];
  licences: LicenceRecord[];
  files: { musicxml: string; language: string };
  importedAt: string;
}

/* ---------- language ---------- */

export interface WordEntry {
  text: string; // as written in the libretto, including punctuation
  gloss: string; // word-by-word English gloss
  ipa: string;
  noteIds: string[]; // notes this word is sung on (several notes for melismas; shared notes for elisions)
}

export interface GlossGroup {
  words: number[]; // indices into words
  gloss: string; // when a phrase does not translate word-for-word (idiom, reordering)
}

export interface AudioAsset {
  file: string; // relative to the edition's content folder
  kind: "recorded" | "placeholder-tts";
  speed: "normal" | "slow";
  provenance: string;
  reviewed: boolean;
}

export interface Phrase {
  id: string;
  roleId: string;
  verse: number; // lyric verse (1 unless a repeated passage has new words)
  occurrence: number; // which performance occurrence of the passage this phrase is sung in
  startM: number;
  startQ: number;
  endM: number;
  endQ: number;
  original: string;
  words: WordEntry[];
  /** Sung syllables in order, each on its note, as printed in the score (an elided note carries two). */
  syllables?: { noteId: string; text: string; word: number }[];
  glossGroups: GlossGroup[];
  translation: string;
  ipa: string;
  audio: { normal?: AudioAsset; slow?: AudioAsset };
  missing: string[]; // honest list of assets that are not available
  review: { status: "unreviewed-fixture" | "reviewed"; by?: string; date?: string };
}

export interface CompiledLanguage {
  schema: 1;
  editionId: string;
  language: string;
  phrases: Phrase[];
}

export interface CatalogEntry {
  editionId: string;
  editionVersion: string;
  scoreVersionId: string;
  title: string;
  subtitle?: string;
  kind: "aria" | "ensemble";
  fixture: boolean;
  fixtureNotice?: string;
  composer: string;
  roles: Role[];
  measures: number;
  durationSec: number;
  hasRepeats: boolean;
  keySignature: string;
  time: string;
  languageStatus: { phrases: number; withAudio: number; reviewed: number };
}

/* ---------- positions ---------- */

export interface MusicalPos {
  m: number; // measure idx
  q: number; // quarters from the start of the measure
  occ?: number; // performance occurrence (repeated passages)
  noteId?: string;
}

/** A measure-range loop expressed with musical identifiers. */
export interface LoopRange {
  start: { m: number; occ: number };
  end: { m: number; occ: number }; // inclusive
}

/* ---------- production ---------- */

export type Permission = "editor" | "performer";

export interface Cut {
  id: string;
  startM: number; // inclusive measure idx
  endM: number; // inclusive measure idx
  status: "ok" | "flagged";
  issues: CutIssue[];
  createdBy?: string;
  createdAt?: string;
}

export interface CutIssue {
  severity: "error" | "warning";
  code: string;
  message: string;
  m?: number;
}

export interface PassageComment {
  id: string;
  kind: "editorial" | "correction";
  startM: number;
  startQ: number;
  endM: number;
  endQ: number;
  body: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  status: "open" | "resolved";
  versionNumber?: number | null; // correction requests record the version they were filed against
}

export interface VersionSnapshot {
  editionId: string;
  scoreVersionId: string;
  cuts: Cut[];
  comments: PassageComment[];
}

export interface ProductionVersion {
  number: number;
  summary: string;
  publishedAt: string;
  publishedBy: string;
  snapshot: VersionSnapshot;
}

/* ---------- rehearsal realtime ---------- */

export interface RehearsalParticipant {
  userId: string;
  name: string;
  roles: string[];
  permission: Permission;
  connected: boolean;
  lastSeen: number;
}

export interface RehearsalPlayback {
  state: "playing" | "paused" | "stopped";
  pos: MusicalPos; // last reported musical position
  perfQ: number; // position on the version's performance timeline (same for all participants)
  qPerSec: number; // current speed, for short extrapolation by followers
  tempoFactor: number;
  sentAt: number; // server time ms when received
}

export interface RehearsalState {
  sessionId: string;
  productionId: string;
  versionNumber: number;
  name: string;
  leaderId: string;
  leaderName: string;
  audioDevice: string; // description of the one device producing sound
  marker: MusicalPos;
  markerSource: "manual" | "playback";
  playback: RehearsalPlayback;
  loop: LoopRange | null;
  participants: RehearsalParticipant[];
  seq: number;
  endedAt?: string | null;
}
