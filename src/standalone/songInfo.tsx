import type { PieceInfo } from "./pieces";
import META from "./songMeta.json";
import { SONGS, songLanguage } from "./songs";

/**
 * Each song with music in the app (songMeta.json, written by scripts/songs/finish.py) as a piece the practice screen
 * can open: its facts (key, time, the tempo and where it comes from) and the About paragraphs on its sources.
 */
export interface SongMeta {
  editionId: string;
  key: string;
  time: string;
  tempo: string;
  tempoBasis: string;
  tempoWords: string;
  poet: string;
  openscore: string;
  imslp: string;
  transcription: string;
}
export const SONG_META = META as Record<string, SongMeta>;

const link = (href: string, text: string) => (
  <a href={href} target="_blank" rel="noreferrer">
    {text}
  </a>
);

export const SONG_PIECE_INFO: Record<string, PieceInfo> = Object.fromEntries(
  SONGS.filter((s) => SONG_META[s.id]).map((s) => {
    const m = SONG_META[s.id];
    const info: PieceInfo = {
      portrait: `songs:${s.id}`,
      opera: s.composerFull,
      kind: "Song",
      facts: {
        key: m.key,
        time: m.time,
        tempo: `${m.tempoWords ? `${m.tempoWords}, ` : ""}${m.tempo}, ${m.tempoBasis}`,
      },
      notePlaceholder: "Where to breathe, a word to colour, a vowel to keep open",
      about: (
        <>
          <p>
            Music by {s.composerFull}
            {m.poet ? `, words by ${m.poet}` : ""}. Sung in {songLanguage(s.lang)}. Both are in the public domain.
          </p>
          <p>
            Score: from the {link(m.openscore, "OpenScore Lieder Corpus")} (CC0), transcribed and proofread by its
            contributors{m.imslp ? <>, from {link(m.imslp, "the source on IMSLP")}</> : null}. Playback tempo set for this
            app.
          </p>
          <p>
            Pronunciation (IPA), word meanings and translation: written for this app. They have not yet been reviewed
            by a diction coach.
          </p>
        </>
      ),
    };
    return [m.editionId, info];
  }),
);
