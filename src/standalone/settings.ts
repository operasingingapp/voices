/** Practice settings shared by the practice screen and the Settings page (kept in this browser). */
import type { LineInstrument } from "../audio/samplerPort";

export type LineChoice = LineInstrument | "auto";

/** A recorded singer, where the piece has one for this line: offered first in the menu. */
export const SINGER = { id: "singer" as LineInstrument, label: "Singer" };

/** What the sung line can be played on (the singer only where a recording exists). */
export const lineSounds = (sung: boolean) => (sung ? [SINGER, ...LINE_SOUNDS] : LINE_SOUNDS);

/** What the sung line can be played on. */
export const LINE_SOUNDS: { id: LineInstrument; label: string }[] = [
  { id: "piano", label: "Piano" },
  { id: "oboe", label: "Oboe" },
  { id: "clarinet", label: "Clarinet" },
  { id: "flute", label: "Flute" },
  { id: "english-horn", label: "English horn" },
];

/** The automatic choice: the piano for every voice (other instruments and a recorded singer stay a choice in the menu). */
export function autoInstrument(_voiceType: string): LineInstrument {
  return "piano";
}

export const AUTO_NOTE = "Piano for every voice.";

/** the instrument a choice means (`sung`: this line has a recorded singer, which can be chosen; "Automatic" is the piano) */
export function resolveLine(choice: string, voiceType: string, sung = false): LineInstrument {
  if (choice === "auto") return autoInstrument(voiceType);
  return lineSounds(sung).some((o) => o.id === choice) ? (choice as LineInstrument) : autoInstrument(voiceType);
}
