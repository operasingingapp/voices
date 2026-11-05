/**
 * The tempo as a metronome number (♩ = 104) rather than a percentage: − and + step along a metronome's marks
 * (Maelzel's scale: 2 apart up to 60, then 3, 4, 6 and 8), so the number is always one a teacher would name.
 */
const MARKS: number[] = [];
for (let b = 30; b <= 60; b += 2) MARKS.push(b);
MARKS.push(63, 66, 69, 72);
for (let b = 76; b <= 120; b += 4) MARKS.push(b);
for (let b = 126; b <= 144; b += 6) MARKS.push(b);
for (let b = 152; b <= 400; b += 8) MARKS.push(b);

/** the next mark below (dir -1) or above (dir 1) this tempo */
export function nextMark(bpm: number, dir: -1 | 1): number {
  if (dir < 0) {
    for (let i = MARKS.length - 1; i >= 0; i--) if (MARKS[i] < bpm - 0.5) return MARKS[i];
    return MARKS[0];
  }
  for (const m of MARKS) if (m > bpm + 0.5) return m;
  return MARKS[MARKS.length - 1];
}

/** slowest and fastest the music may be played, as a share of its printed tempo */
export const MIN_FACTOR = 0.4;
export const MAX_FACTOR = 1.5;

/** The speed factor one metronome step slower or faster, from the printed tempo `printed` and the factor now. */
export function stepFactor(printed: number, factor: number, dir: -1 | 1): number {
  if (!(printed > 0)) return factor;
  const target = nextMark(Math.round(printed * factor), dir);
  // back on the printed tempo when a step passes it, so it is easy to land on again
  const crossed = (dir < 0 && factor > 1 + 1e-3 && target < printed) || (dir > 0 && factor < 1 - 1e-3 && target > printed);
  const f = crossed ? 1 : target / printed;
  return Math.min(MAX_FACTOR, Math.max(MIN_FACTOR, f));
}
