/** Practice settings shared by the practice screen and the Settings page (kept in this browser). */
import type { LineInstrument } from "../audio/samplerPort";

export type LineChoice = LineInstrument | "auto";

/** What the sung line can be played on. */
export const LINE_SOUNDS: { id: LineInstrument; label: string }[] = [
  { id: "piano", label: "Piano" },
  { id: "oboe", label: "Oboe" },
  { id: "clarinet", label: "Clarinet" },
  { id: "english-horn", label: "English horn" },
  { id: "bassoon", label: "Bassoon" },
];

/**
 * The automatic choice: a wind instrument singing in the voice's own range. Oboe for sopranos, English horn
 * for mezzos and contraltos, clarinet for tenors (the bassoon is thin at a tenor's top), bassoon for
 * baritones and basses (a contrabassoon would sound an octave lower and blur the pitch).
 */
export function autoInstrument(voiceType: string): LineInstrument {
  const v = voiceType.toLowerCase();
  if (v.startsWith("mezzo") || v.startsWith("contralto") || v.startsWith("alto")) return "english-horn";
  if (v.startsWith("soprano")) return "oboe";
  if (v.startsWith("tenor")) return "clarinet";
  if (v.startsWith("bari") || v.startsWith("bass")) return "bassoon";
  return "piano";
}

export const AUTO_NOTE = "Oboe for sopranos, English horn for mezzos and contraltos, clarinet for tenors, bassoon for baritones and basses.";

export function resolveLine(choice: string, voiceType: string): LineInstrument {
  if (choice === "auto") return autoInstrument(voiceType);
  return LINE_SOUNDS.some((o) => o.id === choice) ? (choice as LineInstrument) : autoInstrument(voiceType);
}
