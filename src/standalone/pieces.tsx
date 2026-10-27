/**
 * The pieces that open in the practice screen: their data (imported by scripts/import-content.ts) and the few words
 * about each that the data does not carry (the opera, the portrait, the facts and credits shown in the drawers).
 */
import type { ReactNode } from "react";
import type { CompiledEdition, CompiledLanguage } from "../../shared/types";

const editions = import.meta.glob(["../../data/content/*/edition.json", "!../../data/content/cp-fx-*/**"], { eager: true, import: "default" }) as Record<
  string,
  CompiledEdition
>;
const languages = import.meta.glob(["../../data/content/*/language.json", "!../../data/content/cp-fx-*/**"], { eager: true, import: "default" }) as Record<
  string,
  CompiledLanguage
>;
const scores = import.meta.glob(["../../data/content/*/score.musicxml", "!../../data/content/cp-fx-*/**"], {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

export interface PieceInfo {
  /** PORTRAITS key, "opera:character" */
  portrait: string;
  opera: string;
  kind: string;
  facts: { key: string; time: string; tempo: string };
  notePlaceholder: string;
  /** score and rights paragraphs for the About drawer */
  about: ReactNode;
}

export const PIECE_INFO: Record<string, PieceInfo> = {
  "puccini-o-mio-babbino-caro": {
    portrait: "schicchi:lauretta",
    opera: "Gianni Schicchi",
    kind: "Aria",
    facts: {
      key: "A♭ major, after a 4-bar introduction",
      time: "6/8 (the introduction in 3/4)",
      tempo: "Andantino ingenuo, ♩. ≈ 33 (♪ = 100), the engraving's marking: Puccini gives no number",
    },
    notePlaceholder: "Breathe after “caro”, keep the line through “mi piace”",
    about: (
      <>
        <p>
          Score: engraving by{" "}
          <a href="https://www.cafe-puccini.dk" target="_blank" rel="noreferrer">
            www.cafe-puccini.dk
          </a>{" "}
          (MuseScore, 8 January 2023), licensed{" "}
          <a href="https://creativecommons.org/licenses/by-nc-nd/4.0/" target="_blank" rel="noreferrer">
            Creative Commons BY-NC-ND
          </a>
          . Played unchanged, for non-commercial use. On screen it is shown on one line; the tempo and rehearsal marks appear in the bar box, the engraving's
          playback-only tempo numbers and the opening stage direction are left off the line, and joined syllables use ‿.
        </p>
        <p>
          Music by Giacomo Puccini (public domain). Text by Giovacchino Forzano, first published 1918: public domain in the US, still protected in the EU until
          2040. The IPA, word meanings and translation were written for this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-dove-sono": {
    portrait: "figaro:countess",
    opera: "Le nozze di Figaro",
    kind: "Recitative and aria",
    facts: {
      key: "C major; the recitative moves through several keys",
      time: "Recitative in 4/4, Andantino in 2/4, Allegro in 4/4",
      tempo: "Recitative ♩ ≈ 80–100 (free in performance), Andantino ♩ = 60, Allegro ♩ = 144: the engraving's numbers, Mozart gives words only",
    },
    notePlaceholder: "Take time on “Dove sono”, breathe after “piacer”",
    about: (
      <>
        <p>
          Score: a piano-vocal engraving made in MuseScore 4.4, supplied by you; the engraver and licence are not stated in the file, so check them before
          sharing. One lyric typo is corrected (bar 99, “languire‿a”). On screen the tempo marks appear in the bar box and joined syllables use ‿.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
};

export interface PieceData {
  id: string;
  edition: CompiledEdition;
  language: CompiledLanguage;
  scoreXml: string;
  info: PieceInfo;
}

const byId = (rec: Record<string, unknown>, id: string, file: string) => rec[`../../data/content/${id}/${file}`];

export function hasPiece(id: string | undefined): id is string {
  return !!id && !!PIECE_INFO[id] && !!byId(editions, id, "edition.json");
}

export function pieceData(id: string): PieceData {
  return {
    id,
    edition: byId(editions, id, "edition.json") as CompiledEdition,
    language: byId(languages, id, "language.json") as CompiledLanguage,
    scoreXml: byId(scores, id, "score.musicxml") as string,
    info: PIECE_INFO[id],
  };
}
