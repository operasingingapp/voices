/** Practice settings shared by the practice screen and the Settings page (kept in this browser). */
import type { LineInstrument } from "../audio/samplerPort";

export type LineChoice = LineInstrument | "auto";

/** What the sung line can be played on. */
export const LINE_SOUNDS: { id: LineInstrument; label: string }[] = [
  { id: "voice", label: "Voice" },
  { id: "piano", label: "Piano" },
  { id: "oboe", label: "Oboe" },
  { id: "clarinet", label: "Clarinet" },
  { id: "english-horn", label: "English horn" },
  { id: "bassoon", label: "Bassoon" },
];

/**
 * The automatic choice: a sung voice (VocalSet singer f1, a soprano, on "ah") for sopranos and mezzos; for the
 * others a wind instrument singing in the voice's own range: English horn for contraltos, clarinet for tenors (the
 * bassoon is thin at a tenor's top), bassoon for baritones and basses (a contrabassoon would sound an octave lower
 * and blur the pitch).
 */
export function autoInstrument(voiceType: string): LineInstrument {
  const v = voiceType.toLowerCase();
  // a real singer's voice (VocalSet, singer f1) for the voices it suits; the instruments for the rest
  if (v.startsWith("soprano") || v.startsWith("mezzo")) return "voice";
  if (v.startsWith("contralto") || v.startsWith("alto")) return "english-horn";
  if (v.startsWith("tenor")) return "clarinet";
  if (v.startsWith("bari") || v.startsWith("bass")) return "bassoon";
  return "piano";
}

export const AUTO_NOTE = "A sung voice for sopranos and mezzos, English horn for contraltos, clarinet for tenors, bassoon for baritones and basses.";

export function resolveLine(choice: string, voiceType: string): LineInstrument {
  if (choice === "auto") return autoInstrument(voiceType);
  return LINE_SOUNDS.some((o) => o.id === choice) ? (choice as LineInstrument) : autoInstrument(voiceType);
}
