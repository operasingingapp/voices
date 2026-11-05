/**
 * A singer's notes, kept on this device: each piece (and, in an ensemble, each role in it) has its own list in
 * localStorage. The practice screen writes them; Home reads them back to show the latest few.
 */
export interface Note {
  id: string;
  /** the bar, as an index into the edition's measures */
  m: number;
  /** quarter notes into that bar */
  q: number;
  body: string;
  at: string;
  /** a singer's mark instead of (or as well as) words: shown on the score by its sign */
  mark?: MarkId;
}
/** The marks singers pencil into scores most: one tap puts one on the bar you are on. */
export type MarkId = "breath" | "slow" | "push" | "look" | "careful";
export const MARKS: { id: MarkId; sign: string; label: string }[] = [
  { id: "breath", sign: "’", label: "Breathe" },
  { id: "slow", sign: "↓", label: "Don’t rush" },
  { id: "push", sign: "→", label: "Move on" },
  { id: "look", sign: "◉", label: "Look up" },
  { id: "careful", sign: "!", label: "Careful" },
];
/** what a note shows on the score: its mark's sign and name, or the start of its words */
export const noteLabel = (n: Note) => {
  const mk = MARKS.find((x) => x.id === n.mark);
  if (mk) return `${mk.sign} ${n.body && n.body !== mk.label ? n.body : mk.label}`.slice(0, 26);
  return n.body.length > 24 ? `${n.body.slice(0, 23)}…` : n.body;
};
/** every piece's notes on this device (each piece and role keeps its own list) */
export const NOTE_KEY_RE = /^cp:(.+:notes|babbino:notes)$/;
/** "O mio babbino caro" keeps the key its notes had before there were other pieces */
const BABBINO = "puccini-o-mio-babbino-caro";
/** The storage key of one piece's notes, for the role sung in it (only an ensemble's notes are kept per role). */
export function notesKey(editionId: string, roleId: string | undefined, roles: number): string {
  if (editionId === BABBINO) return "cp:babbino:notes";
  return roles > 1 && roleId ? `cp:${editionId}:${roleId}:notes` : `cp:${editionId}:notes`;
}
/** The piece (and, for an ensemble, the role) a notes key belongs to. */
export function parseNotesKey(key: string): { editionId: string; roleId?: string } | null {
  if (!NOTE_KEY_RE.test(key)) return null;
  if (key === "cp:babbino:notes") return { editionId: BABBINO };
  const parts = key.slice(3, -":notes".length).split(":");
  return parts.length === 1 ? { editionId: parts[0] } : { editionId: parts[0], roleId: parts[1] };
}
export function allNotes(): Record<string, Note[]> {
  const out: Record<string, Note[]> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !NOTE_KEY_RE.test(k)) continue;
      const v = JSON.parse(localStorage.getItem(k) ?? "[]");
      if (Array.isArray(v) && v.length) out[k] = v;
    }
  } catch {
    /* storage unavailable */
  }
  return out;
}
