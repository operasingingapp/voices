import DATA from "./songContext.json";

/**
 * What each song with music is about, written for the app (scripts/songs/context_data.py, built into
 * songContext.json by scripts/songs/build_context.py with the vocal range read from the score): the year it was
 * written, its story, where its words come from, what to listen for, and the cycle it belongs to.
 */
export interface SongCycle {
  title: string;
  composer: string;
  count: number;
  overview: string;
}
export interface SongContext {
  year: string;
  written: string;
  story: string;
  poem: string;
  music: string;
  cycle?: string;
  no?: number;
  range: { low: string; high: string; lowMidi: number; highMidi: number };
}
export const SONG_CYCLES = DATA.cycles as Record<string, SongCycle>;
export const SONG_CONTEXT = DATA.songs as Record<string, SongContext>;

/** the lowest and highest sung notes, as written in the score: "D4 – G5" */
export const rangeText = (r: SongContext["range"]) => `${r.low} – ${r.high}`;
