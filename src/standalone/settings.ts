/** Practice settings shared by the practice screen and the Settings page (kept in this browser). */
import type { LineInstrument } from "../audio/samplerPort";

export type LineChoice = LineInstrument | "auto";

/** A recorded singer, where the piece has one for this line: offered first and chosen by "Automatic". */
export const SINGER = { id: "singer" as LineInstrument, label: "Singer" };

/** What the sung line can be played on (the singer only where a recording exists). */
export const lineSounds = (sung: boolean) => (sung ? [SINGER, ...LINE_SOUNDS] : LINE_SOUNDS);

/** What the sung line can be played on. */
export const LINE_SOUNDS: { id: LineInstrument; label: string }[] = [{ id: "piano", label: "Piano" }];

/**
 * The automatic choice: the recorded singer where there is one (see resolveLine), otherwise the piano. The wind
 * instruments are no longer offered: the piano, balanced to sing above the accompaniment, is clearer.
 */
export function autoInstrument(_voiceType: string): LineInstrument {
  return "piano";
}

export const AUTO_NOTE = "The recorded singer where the piece has one, otherwise the piano, always a little above the accompaniment.";

/** the instrument a choice means; `sung`: this line has a recorded singer (then "Automatic" is the singer) */
export function resolveLine(choice: string, voiceType: string, sung = false): LineInstrument {
  if (choice === "auto") return sung ? "singer" : autoInstrument(voiceType);
  return lineSounds(sung).some((o) => o.id === choice) ? (choice as LineInstrument) : sung ? "singer" : autoInstrument(voiceType);
}
