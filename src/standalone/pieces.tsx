/**
 * The pieces that open in the practice screen: their data (imported by scripts/import-content.ts) and the few words
 * about each that the data does not carry (the opera, the portrait, the facts and credits shown in the drawers).
 */
import type { ReactNode } from "react";
import type { CompiledEdition, CompiledLanguage } from "../../shared/types";

// Each piece's data loads only when the piece opens (one small file per piece), so the app starts at once however
// many pieces it holds.
const editions = import.meta.glob(["../../data/content/*/edition.json", "!../../data/content/cp-fx-*/**"], { import: "default" }) as Record<
  string,
  () => Promise<CompiledEdition>
>;
const languages = import.meta.glob(["../../data/content/*/language.json", "!../../data/content/cp-fx-*/**"], { import: "default" }) as Record<
  string,
  () => Promise<CompiledLanguage>
>;
const editionData = new Map<string, CompiledEdition>();
const languageData = new Map<string, CompiledLanguage>();
// the scores are separate files, fetched when a piece opens (bundled in, they made the app too large to publish)
const scoreUrls = import.meta.glob(["../../data/content/*/score.musicxml", "!../../data/content/cp-fx-*/**"], {
  query: "?url",
  import: "default",
  eager: true,
}) as Record<string, string>;
// the recorded voices' timings for each piece (word by word), fetched with the piece's words
const voiceManifests = import.meta.glob("../../content/pieces/*/voice/*/manifest.json", { import: "default" }) as Record<string, () => Promise<unknown>>;
const voiceData = new Map<string, unknown[]>();
const scoreText = new Map<string, string>();
const scoreLoading = new Map<string, Promise<void>>();
/** true when the piece's score is loaded and pieceData() can be used */
export const scoreReady = (id: string) => scoreText.has(id) && editionData.has(id) && languageData.has(id) && voiceData.has(id);
/** load the piece's score, data and words (once) */
export function loadScore(id: string): Promise<void> {
  if (scoreReady(id)) return Promise.resolve();
  let p = scoreLoading.get(id);
  if (!p) {
    const url = scoreUrls[`../../data/content/${id}/score.musicxml`];
    const ed = editions[`../../data/content/${id}/edition.json`]?.().then((e) => void editionData.set(id, e));
    const la = languages[`../../data/content/${id}/language.json`]?.().then((l) => void languageData.set(id, l));
    const sc = fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`score ${id}: ${r.status}`);
        return r.text();
      })
      .then((t) => void scoreText.set(id, t));
    const vo = Promise.all(
      Object.entries(voiceManifests)
        .filter(([k]) => k.includes(`/pieces/${id}/voice/`))
        .map(([, load]) => load()),
    ).then((ms) => void voiceData.set(id, ms));
    p = Promise.all([sc, ed, la, vo])
      .then(() => undefined)
      .catch((e) => {
        scoreLoading.delete(id);
        throw e;
      });
    scoreLoading.set(id, p);
  }
  return p;
}

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
  "puccini-al-quartiere-latin": {
    portrait: "boheme:rodolfo",
    opera: "La bohème",
    kind: "Scene",
    facts: {
      key: "G major, then G♭ major (6 flats) from “Io resto”",
      time: "2/4, then 6/8 (Andantino), then 3/8 (Allegro vivo)",
      tempo: "Allegretto ♩ = 116 and Andantino ♩. = 92 (printed metronome marks); Meno (bar 11) ♩ = 104 (chosen: a tenth slower, to the nearest metronome mark); Allegro vivo (I.º tempo) ♩. = 108 (no number printed: the first tempo of the opera, whose opening music returns here). The written rall., rit. and allarg. are played as a gradual slowing over the bars they cover (affrett., string. and accel. as a quickening), then back to the tempo; fermatas are held",
    },
    notePlaceholder: "Rodolfo stays to finish his article; the friends grope their way down the dark stairs",
    about: (
      <>
        <p>
          Score: “Al Quartiere Latin ci attende Momus”, Act 1 (vocal score pages 49-53, from figure 22, 79 bars), from Carlo Carignani’s piano reduction in the
          G. Ricordi &amp; C. vocal score, public domain. Written out from the printed pages: the sung lines and the piano each read independently, every
          disagreement settled on the page by a separate judge, then checked against the page and corrected. Only the Italian words are kept, with the print's
          spellings. The tempos are the printed metronome marks.
        </p>
        <p>
          Music by Giacomo Puccini and text by Luigi Illica and Giuseppe Giacosa (1896), both public domain. The IPA, word meanings and translation were
          written for this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "puccini-questo-mar-rosso": {
    portrait: "boheme:marcello",
    opera: "La bohème",
    kind: "Scene",
    facts: {
      key: "C major (no key signature); B♭ major (2 flats) from “Nei cieli bigi”; C major again from “Gran cor!”; G♭ major (6 flats) from “Pensier profondo”; the last bar is the D major (2 sharps) Allegro of the next scene",
      time: "3/8; 6/8 from “Nei cieli bigi”; 3/8 from “Rodolfo, io voglio dirti” (with one bar of 2/8); 6/8 from “Aguzza l’ingegno”; 2/4 from “Quest’intermezzi”; Vivo 3/8, then 2/4, 3/4, 3/8 and 2/4; the last bar 6/8",
      tempo: "Allegro vivace ♩. = 108 (printed metronome mark), kept by “Lo stesso movimento” in 6/8 and 3/8 and by “A tempo come prima”; from “Quest’intermezzi” 2/4 at ♩ = 108 (the piano keeps the 6/8 beat under the voices’ 2/4, so the bar keeps its length: ♩ = ♩.), kept by “Lo stesso movimento” in G♭; Vivo in 1 ♩. = 108 (no mark printed: the beat kept); 2/4 and 3/4 ♩ = 108; 3/8 ♩. = 108 (printed ♩ = ♩.); 2/4 ♩ = 108 (printed ♩. = ♩); the last bar, Allegro, ♩. = 108 (no mark printed). The written rall., rit. and allarg. are played as a gradual slowing over the bars they cover (affrett., string. and accel. as a quickening), then back to the tempo; fermatas are held",
    },
    notePlaceholder: "Marcello paints with frozen hands; Rodolfo feeds his play to the fire, act by act",
    about: (
      <>
        <p>
          Score: “Questo Mar Rosso”, the opening of Act 1 (vocal score pages 1-20, from the first bar to figure (10), 335 bars), from Carlo Carignani’s piano
          reduction in the G. Ricordi &amp; C. vocal score, public domain. Written out from the printed pages: the sung lines and the piano each read
          independently, every disagreement settled on the page by a separate judge, then checked against the page and corrected. Only the Italian words are
          kept, with the print's spellings. Rodolfo’s printed alternative notes in bar 201 are not shown. The tempo is the printed metronome mark (♩. = 108)
          carried through the printed “lo stesso movimento” and tempo equivalences.
        </p>
        <p>
          Music by Giacomo Puccini and text by Luigi Illica and Giuseppe Giacosa (1896), both public domain. The IPA, word meanings and translation were
          written for this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "puccini-legna": {
    portrait: "boheme:schaunard",
    opera: "La bohème",
    kind: "Scene",
    facts: {
      key: "D major (2 sharps); E♭ major (3 flats) from bar 56 (“Qua.”, “E mi presento”); D major again from bar 97 (“Il Costituzional!”); F major (1 flat) from bar 141 (Allegretto mosso, “Quando un’olezzo di frittelle”)",
      time: "6/8; 2/4 from bar 116 (“Che il diavolo vi porti”); 2/8 from bar 141 (Allegretto mosso); 3/4 from bar 171 (Moderato, “Un po’ di religione”); 6/8 from bar 176 (Tempo I)",
      tempo: "Allegretto mosso ♪ = 132 is the only printed metronome mark; the other values are chosen, as no number is printed: Allegro ♩. = 108 (the beat of “Questo Mar Rosso” kept: its last bar is this Allegro’s first); Meno (bars 107-109) ♩. = 96 (a tenth slower, to the nearest metronome mark); a tempo (bar 110) ♩. = 108; 2/4 from bar 116 ♩ = 108 (the beat kept); Poco meno ♩ = 100 (a little slower); Allegretto mosso ♪ = 132 (printed); Moderato ♩ = 66 (the printed ♪ = 132 kept); I.º Tempo (Allegro brillante) ♩. = 108 (the opening Allegro’s value, to which it returns). The written rall., rit. and allarg. are played as a gradual slowing over the bars they cover (affrett., string. and accel. as a quickening), then back to the tempo; fermatas are held",
    },
    notePlaceholder: "Schaunard comes home rich and tells how he earned it; nobody listens",
    about: (
      <>
        <p>
          Score: “Legna!”, Schaunard’s windfall, Act 1 (vocal score pages 20-33, from the bar after figure (10) to page 33 system 1 bar 2, 183 bars), from
          Carlo Carignani’s piano reduction in the G. Ricordi &amp; C. vocal score, public domain. Written out from the printed pages: the sung lines and the
          piano each read independently, every disagreement settled on the page by a separate judge, then checked against the page and corrected. Only the
          Italian words are kept, with the print's spellings; the shouted notes, printed without noteheads, keep their words. Schaunard’s printed alternative
          small notes (ossia) in bar 117 are not shown. The only printed metronome mark is the Allegretto mosso’s ♪ = 132; the other tempos are chosen as
          stated under Tempo.
        </p>
        <p>
          Music by Giacomo Puccini and text by Luigi Illica and Giuseppe Giacosa (1896), both public domain. The IPA, word meanings and translation were
          written for this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "puccini-si-puo": {
    portrait: "boheme:benoit",
    opera: "La bohème",
    kind: "Scene",
    facts: {
      key: "F major (1 flat) for the knock at the door; C major (no key signature) from bar 7 (Allegro vivo); G♭ major (6 flats) from bar 31 (Andantino mosso); E major (4 sharps) from bar 67 (Andantino); D♭ major (5 flats) from bar 90 (Lo stesso movimento); C major from bar 123; D major (2 sharps) from bar 126 (Allegro)",
      time: "2/4; 6/8 from bar 7 (with single bars of 9/8 at 63 and 109); 3/4 from bar 67; 6/8 from bar 90; 2/4 from bar 123",
      tempo: "Printed metronome marks: Allegro vivo ♩. = 152, Andantino mosso ♩. = 100, Andantino ♩ = 56, Lo stesso movimento ♩ = ♩., Allegro ♩ = 152. Chosen, as no number is printed: bars 1-6 ♩ = 108 (the Tempo I of “Legna!” carried on, its beat kept into the 2/4); Appena meno (bar 69) ♩ = 54 (just slower: one metronome step under 56); so at Lo stesso movimento (bar 90) ♩. = 54, as printed; Più mosso ♩. = 60, and from bar 110 ♩. = 66 (each a tenth faster, to the nearest metronome mark); Lento ♩. = 52, then ♩ = 52 in the 2/4 (the beat kept); Meno (bar 154) ♩ = 138 (a tenth slower). The written rall., rit. and allarg. are played as a gradual slowing over the bars they cover (affrett., string. and accel. as a quickening), then back to the tempo; fermatas are held",
    },
    notePlaceholder: "The landlord comes for the rent and leaves without it",
    about: (
      <>
        <p>
          Score: “Si può?..”, Benoit’s visit, Act 1 (vocal score pages 33-48, from page 33 system 1 bar 3 to the end of page 48, 160 bars), from Carlo
          Carignani’s piano reduction in the G. Ricordi &amp; C. vocal score, public domain. Written out from the printed pages: the sung lines and the piano
          each read independently, every disagreement settled on the page by a separate judge, then checked against the page and corrected. Only the Italian
          words are kept, with the print's spellings. The tempos are the printed metronome marks; where none is printed, a value is chosen as stated under
          Tempo.
        </p>
        <p>
          Music by Giacomo Puccini and text by Luigi Illica and Giuseppe Giacosa (1896), both public domain. The IPA, word meanings and translation were
          written for this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "puccini-non-sono-in-vena": {
    portrait: "boheme:rodolfo",
    opera: "La bohème",
    kind: "Scene",
    facts: {
      key: "G♭ major (6 flats); B major (5 sharps) from bar 7 (figure 25); D major (2 sharps) from bar 18 (Lento, “Chi è là!?”); G major (1 sharp) from bar 45 (Andante moderato, figure 26); B♭ major (2 flats) from bar 76 (Un poco più mosso, “sventata”)",
      time: "3/8 for the first bar; 2/4 from bar 2; 3/4 from bar 14; 4/4 (C) from bar 20; 3/4 from bar 25 (Allegro agitato); 2/4 from bar 38 (“Ed ora come faccio?”)",
      tempo: "Printed metronome marks: Andante moderato ♩ = 88 (bar 45) and Un poco più mosso ♩ = 126 (bar 76). Chosen, as no number is printed: bar 1 ♩. = 108 (the Allegro vivo that ends “Al Quartiere Latin” carried on: this bar is its last); Allegretto (a tempo, bar 2, and again at figure 25) ♩ = 116 (the printed Allegretto of “Al Quartiere Latin”, to which the a tempo returns); Lento (bar 18) ♩ = 52 (the value of the Lento in “Si può?”); Allegro agitato (bar 25) ♩ = 126 (a tenth faster than the Allegretto, to the nearest metronome mark); Allegretto sostenuto (bar 40) ♩ = 104 (the Allegretto held back a tenth); Lento a piacere (bar 42) ♩ = 52 (the earlier Lento); I. Tempo (come prima, bar 67) ♩ = 88 (the Andante moderato it returns to). The written rall., rit. and allarg. are played as a gradual slowing over the bars they cover (affrett., string. and accel. as a quickening), then back to the tempo; fermatas are held",
    },
    notePlaceholder: "Mimì knocks for a light, faints, leaves, and comes back for her lost key; both candles go out",
    about: (
      <>
        <p>
          Score: “Non sono in vena”, Mimì’s first entrance, Act 1 (vocal score pages 53-63, from the last bar of page 53 to the end of page 63, 155 bars),
          from Carlo Carignani’s piano reduction in the G. Ricordi &amp; C. vocal score, public domain. Written out from the printed pages: the sung lines
          and the piano each read independently, every disagreement settled on the page by a separate judge, then checked against the page and corrected.
          Only the Italian words are kept, with the print's spellings; Rodolfo’s “Ah!”, printed without a notehead, keeps its word. The only printed
          metronome marks are the Andante moderato’s ♩ = 88 and the Un poco più mosso’s ♩ = 126; the other tempos are chosen as stated under Tempo.
        </p>
        <p>
          Music by Giacomo Puccini and text by Luigi Illica and Giuseppe Giacosa (1896), both public domain. The IPA, word meanings and translation were
          written for this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "puccini-che-gelida-manina": {
    portrait: "boheme:rodolfo",
    opera: "La bohème",
    kind: "Aria",
    facts: {
      key: "D♭ major (5 flats); A♭ major (4 flats) from bar 46 (Andante lento, “In povertà mia lieta”, figure 32)",
      time: "2/4; 3/4 from bar 37 (Andante sostenuto, “chi son?”); 4/4 (C) from bar 46, with single bars of 2/4 at 61 and 70",
      tempo: "Printed metronome marks: Andantino affettuoso ♩ = 58 (bar 1) and Andante lento ♩ = 52 (bar 46). Chosen, as no number is printed: Andante sostenuto (bar 37) ♩ = 54 (between the printed 58 before it and 52 after it, on the slower side); Sostenendo largamente (bar 54, “Talor dal mio forziere”, to the end) ♩ = 48 (broader by about a tenth, to the nearest metronome mark). The written rall., rit. and allarg. are played as a gradual slowing over the bars they cover (affrett., string. and accel. as a quickening), then back to the tempo; fermatas are held",
    },
    notePlaceholder: "Rodolfo holds Mimì’s cold hand in the dark and tells her who he is",
    about: (
      <>
        <p>
          “Che gelida manina”, Rodolfo’s aria, Act 1: one of the best-known tenor arias. The print gives an optional high C on “speranza” (bars 65-66) as an
          alternative to the main line; the app shows the main line.
        </p>
        <p>
          Score: vocal score pages 64-69 (from figure (30) to page 69 system 3 bar 2, “dir!”, 72 bars), from Carlo Carignani’s piano reduction in the
          G. Ricordi &amp; C. vocal score, public domain. Written out from the printed pages: the sung lines and the piano each read independently, every
          disagreement settled on the page by a separate judge, then checked against the page and corrected. Only the Italian words are kept, with the
          print's spellings; Mimì’s “Ah!”, printed without a notehead, keeps its word. Rodolfo's printed alternative (the optional high C on 'speranza',
          bars 65-66) is not shown. The printed metronome marks are the Andantino affettuoso’s ♩ = 58 and the Andante lento’s ♩ = 52; the Andante
          sostenuto’s tempo is chosen as stated under Tempo.
        </p>
        <p>
          Music by Giacomo Puccini and text by Luigi Illica and Giuseppe Giacosa (1896), both public domain. The IPA, word meanings and translation were
          written for this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "puccini-mi-chiamano-mimi": {
    portrait: "boheme:mimi",
    opera: "La bohème",
    kind: "Aria",
    facts: {
      key: "4 flats (A♭ major, where “Che gelida manina” ends) for bar 1; D major (2 sharps) from bar 2 (Andante lento)",
      time: "4/4 (C) for bar 1; 2/4 from bar 2; 4/4 from bar 15 (Andante calmo), with a single bar of 2/4 at 20; 2/4 from bar 26 (Lentamente) through the Allegretto moderato; 4/4 from bar 49 (Andante molto sostenuto), with a single bar of 2/4 at 65",
      tempo: "Printed metronome marks: Andante lento ♩ = 40 (bar 2), Andante calmo ♩ = 54 (bar 15) and Allegretto moderato ♩ = 144 (bar 31). Chosen, as no number is printed: bar 1 ♩ = 52 (the Andante lento ♩ = 52 of “Che gelida manina” carried on, as nothing new is printed over Mimì’s “Si. Mi”); Lentamente (bar 26) ♩ = 40 (the printed Andante lento of bar 2, whose “Mi chiamano Mimì” it brings back); Andante molto sostenuto (bar 49) ♩ = 46 (the Andante calmo’s 54 held back by about a sixth); I° tempo, Andante agitando appena (bar 60) and I tempo, ma calmo (bar 66) ♩ = 54 (the Andante calmo, whose music returns). The free cadenza of bar 70 (senza rigore di tempo) keeps the beat. The written rall., rit. and allarg. are played as a gradual slowing over the bars they cover (affrett., string. and accel. as a quickening), then back to the tempo; fermatas are held",
    },
    notePlaceholder: "Mimì tells Rodolfo who she is: her embroidered flowers, her little white room, the first sun of spring",
    about: (
      <>
        <p>
          “Mi chiamano Mimì”, Mimì’s aria, Act 1: her answer to “Che gelida manina”. Rodolfo has one word in it, his “Sì.” in bar 25.
        </p>
        <p>
          Score: vocal score pages 69-74 (from page 69 system 3 bar 3, figure (35), Mimì’s “Si. Mi”, to the end of page 74, 71 bars), from Carlo
          Carignani’s piano reduction in the G. Ricordi &amp; C. vocal score, public domain. Written out from the printed pages: the sung lines and the
          piano each read independently, every disagreement settled on the page by a separate judge, then checked against the page and corrected. Only
          the Italian words are kept, with the print’s spellings (“Si.” without its accent at the start). The free cadenza of bar 70 is written with
          scaled tuplets so that it fits the bar. The printed metronome marks are the Andante lento’s ♩ = 40, the Andante calmo’s ♩ = 54 and the
          Allegretto moderato’s ♩ = 144; the other tempos are chosen as stated under Tempo.
        </p>
        <p>
          Music by Giacomo Puccini and text by Luigi Illica and Giuseppe Giacosa (1896), both public domain. The IPA, word meanings and translation were
          written for this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "puccini-ehi-rodolfo": {
    portrait: "boheme:rodolfo",
    opera: "La bohème",
    kind: "Scene",
    facts: {
      key: "D major (2 sharps)",
      time: "2/4",
      tempo: "Printed metronome mark: Allegretto come prima ♩ = 100 (bar 3). Chosen, as no number is printed: bars 1-2 (a piacere, the piano col canto) ♩ = 100, the Allegretto that follows, so the calls from the courtyard keep its pulse. The written rall., rit. and allarg. are played as a gradual slowing over the bars they cover (affrett., string. and accel. as a quickening), then back to the tempo; fermatas are held",
    },
    notePlaceholder: "The friends call from the courtyard; Rodolfo answers from the window; Mimì asks “Chi son?”",
    about: (
      <>
        <p>
          “Ehi! Rodolfo!”, Act 1: Schaunard, Colline and Marcello call up from the courtyard; Rodolfo opens the window, says he has three lines left to
          write and that he is not alone, and sends them on to the Café Momus; Mimì asks “Chi son?”. They go off singing “Momus, Momus”.
        </p>
        <p>
          Score: vocal score pages 75-77 (from figure (39) to the end of page 77, 28 bars), from Carlo Carignani’s piano reduction in the G. Ricordi
          &amp; C. vocal score, public domain. Written out from the printed pages: the sung lines and the piano each read independently, every
          disagreement settled on the page by a separate judge, then checked against the page and corrected. Only the Italian words are kept, with the
          print’s spellings. The printed metronome mark is the Allegretto come prima’s ♩ = 100; the a piacere opening is chosen as stated under Tempo.
        </p>
        <p>
          Music by Giacomo Puccini and text by Luigi Illica and Giuseppe Giacosa (1896), both public domain. The IPA, word meanings and translation were
          written for this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "puccini-o-soave-fanciulla": {
    portrait: "boheme:rodolfo",
    opera: "La bohème",
    kind: "Duet",
    facts: {
      key: "A major (3 sharps) for bars 1-23; C major (no sharps or flats) from bar 24 (Calmo) to the end",
      time: "4/4 (C), with a single bar of 2/4 at 16",
      tempo: "Printed metronome marks: Largo sostenuto ♩ = 58 (bar 1) and ♩ = 58 again at bar 31 (“Dammi il braccio”). Chosen, as no number is printed: Sempre più sostenuto (bar 17) ♩ = 52 (the Largo’s 58 held back by about a tenth, to the nearest metronome mark); Calmo (bar 24) ♩ = 52 (the same pace kept; the printed ♩ = 58 at bar 31 marks the return to the first tempo). The written rall., rit. and allarg. are played as a gradual slowing over the bars they cover (affrett., string. and accel. as a quickening), then back to the tempo; fermatas are held",
    },
    notePlaceholder: "Rodolfo sees Mimì in the moonlight; she asks to come to the Momus; they leave arm in arm singing “Amor!”",
    about: (
      <>
        <p>
          “O soave fanciulla”, the love duet that closes Act 1. Rodolfo turns from the window and sees Mimì in the moonlight; she draws back from his
          kiss, reminds him that his friends are waiting and asks to come too. They leave arm in arm for the Café Momus and sing their last “Amor!”
          from outside. Marcello, already in the street, is heard far off in bars 2-3 (“trovò la poesia”), ending the friends’ “Momus” chorus.
        </p>
        <p>
          Score: vocal score pages 78-82 (from figure (41), Largo sostenuto, to the end of Act 1, 44 bars), from Carlo Carignani’s piano reduction in
          the G. Ricordi &amp; C. vocal score, public domain. Written out from the printed pages: the sung lines and the piano each read independently,
          every disagreement settled on the page by a separate judge, then checked against the page and corrected. Only the Italian words are kept,
          with the print’s spellings. The print has no optional notes: Rodolfo ends on E and Mimì on the high C. The printed metronome marks are the
          Largo sostenuto’s ♩ = 58 and the ♩ = 58 of bar 31; the other tempos are chosen as stated under Tempo.
        </p>
        <p>
          Music by Giacomo Puccini and text by Luigi Illica and Giuseppe Giacosa (1896), both public domain. The IPA, word meanings and translation were
          written for this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "puccini-aranci-datteri": {
    portrait: "boheme:rodolfo",
    opera: "La bohème",
    kind: "Scene with chorus",
    facts: {
      key: "F major (1 flat) for bars 1-103; A flat major (4 flats) for bars 104-121; E major (4 sharps) for bars 122-140; A flat major again for bars 141-146; no sharps or flats for bars 147-167 (the laughing boys); F major again from bar 168 to the end",
      time: "2/8 for bars 1-103, 147-159 and 168-183; 3/4 for bars 104-146 and 160-167",
      tempo: "Printed metronome mark: Allegro focoso (in due) ♩ = 112 (bar 1): a 2/8 bar is one crotchet, beaten in two quavers. Chosen, as no number is printed: Lo stesso movimento, legato e un poco sostenuto (bar 104, 3/4) ♩ = 104 (the crotchet kept, ♩ = ♩, held back a little for “un poco sostenuto”); Sostenendo un poco (bar 130) ♩ = 96, then a tempo (bar 139) ♩ = 104; Lo stesso movimento ma un po’ più animando (bar 147, 2/8) ♩ = 120 (about 7% faster than the first tempo); Lo stesso movimento (bar 160, 3/4) ♩ = 120, animando poco a poco (bar 164) ♩ = 126; I. tempo come prima (bar 168, 2/8) ♩ = 112, the printed first tempo. The written rall., rit. and allarg. are played as a gradual slowing over the bars they cover (affrett., string. and accel. as a quickening), then back to the tempo; fermatas are held",
    },
    notePlaceholder: "Christmas Eve in the Latin Quarter: the sellers and the crowd; the friends shopping; Rodolfo buys Mimì a bonnet",
    about: (
      <>
        <p>
          “Aranci, datteri!”, the opening of Act 2: Christmas Eve in the Latin Quarter. Street sellers cry their oranges, dates, sweets and flowers, the
          crowd and the children push through, the café calls for its waiter. The friends go shopping: Schaunard haggles over a horn with a false D,
          Colline has his second-hand coat mended and finds a Runic grammar, Marcello offers his heart for a penny to the passing girls. Rodolfo buys
          Mimì a pink bonnet; she admires a coral necklace: he has a millionaire uncle, and if the good Lord sees sense he will buy her a far finer one.
          The townsfolk leave for the Café Momus.
        </p>
        <p>
          Score: vocal score pages 83-99 (from the start of Act 2 to the end of page 99, 183 bars), from Carlo Carignani’s piano reduction in the G.
          Ricordi &amp; C. vocal score, public domain. Written out from the printed pages: the sung lines and the piano each read independently, every
          disagreement settled on the page by a separate judge, then checked against the page and corrected. Only the Italian words are kept, with the
          print’s spellings. The chorus is heard with the piano and shown in the score, but it has no words to practise here. The print gives each
          chorus group (sellers, crowd, children, girls and students, townsfolk, café customers) its own staff where it sings, fifteen in all; here
          they are gathered into five staves by voice, sopranos, children, tenors and two bass lines, with each group named where it comes in. Every note
          and syllable is kept: groups sharing a staff never sing in the same bar, except the two sellers’ soprano lines, which sing the same words in
          the same rhythm and are written as chords, the crowd’s two sopranos in bar 73, written as two voices as printed, and bar 160, where the
          girls’ last laugh comes before the townsfolk’s first word. The printed metronome mark is the Allegro focoso’s ♩ = 112; the other tempos are
          chosen as stated under Tempo.
        </p>
        <p>
          Music by Giacomo Puccini and text by Luigi Illica and Giuseppe Giacosa (1896), both public domain. The IPA, word meanings and translation were
          written for this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-e-susanna-non-vien": {
    portrait: "figaro:countess",
    opera: "Le nozze di Figaro",
    kind: "Recitative",
    facts: {
      key: "Begins in C major and moves through several keys, ending ready for Dove sono",
      time: "4/4",
      tempo: "Andante at ♩ = 60, Allegretto at ♩ = 100, Andante at ♩ = 60 (about 1½ minutes; set from studio recordings)",
    },
    notePlaceholder: "Speak it first, then sing: let the words set the rhythm",
    about: (
      <>
        <p>
          Score: bars 1–25 of a piano-vocal engraving made in MuseScore 4.4, supplied by you; the engraver and licence are not stated in the file, so check
          them before sharing. Split from the aria at the double bar; nothing else changed. On screen the tempo marks appear in the bar box and joined
          syllables use ‿.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-e-perche-fosti-meco": {
    portrait: "figaro:susanna",
    opera: "Le nozze di Figaro",
    kind: "Recitative",
    facts: {
      key: "C major (no key signature)",
      time: "4/4",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 92, close to the studio recordings’ pace (about 45 seconds)",
    },
    notePlaceholder: "The Count asks why Susanna was so cold that morning",
    about: (
      <>
        <p>
          Score: the recitative “E perchè fosti meco” (vocal score pages 214-215, 18 bars), from Paul Klengel's piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain.
          Written out from the printed pages: the sung lines and the piano each read independently, every disagreement settled on the page by a separate judge, then
          checked bar by bar against the page by an independent checker and corrected. Only the Italian words are kept, with the engraving's spellings.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-hai-gia-vinta": {
    portrait: "figaro:count",
    opera: "Le nozze di Figaro",
    kind: "Aria",
    facts: {
      key: "C major (recitative), then D major (aria)",
      time: "4/4, then cut time (2/2)",
      tempo: "Maestoso at ♩ = 74, then Presto at ♩ = 134, then Andante at ♩ = 74, then Allegro at ♩ = 144, then Allegro maestoso at ♩ = 132, then Allegro assai at ♩ = 152 (about 4½ minutes; set from studio recordings)",
    },
    notePlaceholder: "The Count realises he may have been tricked, and vows revenge",
    about: (
      <>
        <p>
          Score: No. 17, the Count's recitative “Hai già vinta la causa!” and aria “Vedrò, mentr'io sospiro” (vocal score pages 216-223, 160 bars), from Paul Klengel's piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain.
          Written out from the printed pages: the sung lines and the piano each read independently, every disagreement settled on the page by a separate judge, then
          checked bar by bar against the page by an independent checker and corrected. Only the Italian words are kept, with the engraving's spellings.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-che-imbarazzo": {
    portrait: "figaro:count",
    opera: "Le nozze di Figaro",
    kind: "Recitative",
    facts: {
      key: "C major (no key signature)",
      time: "4/4",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 92, close to the studio recordings’ pace (about 2 minutes)",
    },
    notePlaceholder: "The Count puzzles over the day; Susanna comes to him",
    about: (
      <>
        <p>
          Score: the recitative “Che imbarazzo è mai questo!” (vocal score pages 205-209, 48 bars), from Paul Klengel's piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain.
          Written out from the printed pages: the sung lines and the piano each read independently, every disagreement settled on the page by a separate judge, then
          checked bar by bar against the page by an independent checker and corrected. Only the Italian words are kept, with the engraving's spellings.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-crudel-perche-finora": {
    portrait: "figaro:susanna",
    opera: "Le nozze di Figaro",
    kind: "Duet",
    facts: {
      key: "A minor, then A major from bar 29",
      time: "4/4",
      tempo: "Andante: played here at ♩ = 104 (about 3 minutes)",
    },
    notePlaceholder: "Susanna promises the Count a meeting in the garden",
    about: (
      <>
        <p>
          Score: No. 16, the Duet “Crudel! perchè finora” (vocal score pages 210-214, 72 bars), from Paul Klengel's piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain. The piano was read once from the page and once from a scan, every disagreement settled on the page.
          Written out from the printed pages: the sung lines and the piano each read independently, every disagreement settled on the page by a separate judge, then
          checked bar by bar against the page by an independent checker and corrected. Only the Italian words are kept, with the engraving's spellings (perchè, gioja, si for sì).
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-e-decisa-la-lite": {
    portrait: "figaro:curzio",
    opera: "Le nozze di Figaro",
    kind: "Recitative",
    facts: {
      key: "C major (no key signature)",
      time: "4/4",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 92, close to the studio recordings’ pace (about 1¾ minutes)",
    },
    notePlaceholder: "The judge rules that Figaro must pay or marry Marcellina",
    about: (
      <>
        <p>
          Score: the recitative “È decisa la lite” (vocal score pages 224-227, 38 bars), from Paul Klengel's piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain.
          Written out from the printed pages: the sung lines and the piano each read independently, every disagreement settled on the page by a separate judge, then
          checked bar by bar against the page by an independent checker and corrected. Only the Italian words are kept, with the engraving's spellings.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-eccovi-o-caro-amico": {
    portrait: "figaro:marcellina",
    opera: "Le nozze di Figaro",
    kind: "Recitative",
    facts: {
      key: "C major (no key signature)",
      time: "4/4",
      tempo: "Recitativo at ♩ = 92, then Andante a tempo at ♩ = 72 (about 50 seconds)",
    },
    notePlaceholder: "Bartolo agrees to marry Marcellina at last",
    about: (
      <>
        <p>
          Score: the recitative “Eccovi, o caro amico” (vocal score pages 245-246, 19 bars), from Paul Klengel's piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain.
          Written out from the printed pages: the sung lines and the piano each read independently, every disagreement settled on the page by a separate judge, then
          checked bar by bar against the page by an independent checker and corrected. Only the Italian words are kept, with the engraving's spellings.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-andiam-bel-paggio": {
    portrait: "figaro:barbarina",
    opera: "Le nozze di Figaro",
    kind: "Recitative",
    facts: {
      key: "C major (no key signature)",
      time: "4/4",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 92, close to the studio recordings’ pace (about 40 seconds)",
    },
    notePlaceholder: "Barbarina takes Cherubino home to dress him as a village girl",
    about: (
      <>
        <p>
          Score: the recitative “Andiam, andiam, bel paggio” (vocal score pages 247-248, 16 bars), from Paul Klengel's piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain.
          Written out from the printed pages: the sung lines and the piano each read independently, every disagreement settled on the page by a separate judge, then
          checked bar by bar against the page by an independent checker and corrected. Only the Italian words are kept, with the engraving's spellings.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-riconosci-in-questo-amplesso": {
    portrait: "figaro:marcellina",
    opera: "Le nozze di Figaro",
    kind: "Sestetto",
    facts: {
      key: "F major",
      time: "4/4",
      tempo: "Allegro moderato at ♩ = 120 (about 4¾ minutes; set from studio recordings)",
    },
    notePlaceholder: "Marcellina and Bartolo turn out to be Figaro's parents",
    about: (
      <>
        <p>
          Score: No. 18, the sextet “Riconosci in questo amplesso” (vocal score pages 228-244, 140 bars), from Paul Klengel's piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain.
          Written out from the printed pages: the sung lines and the piano each read independently, every disagreement settled on the page by a separate judge, then
          checked bar by bar against the page by an independent checker and corrected. Only the Italian words are kept, with the engraving's spellings.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-io-vi-dico-signor": {
    portrait: "figaro:antonio",
    opera: "Le nozze di Figaro",
    kind: "Recitative",
    facts: {
      key: "C major (no key signature)",
      time: "4/4",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 92, close to the studio recordings’ pace (about 30 seconds)",
    },
    notePlaceholder: "Antonio tells the Count that Cherubino is still in the castle, dressed as a girl",
    about: (
      <>
        <p>
          Score: the recitative “Io vi dico, signor” (vocal score pages 254-255, 12 bars), from Paul Klengel’s piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain.
          Written out from the printed pages: the sung lines and the piano each read independently, every disagreement settled on the page by a separate judge, then
          checked bar by bar against the page by an independent checker and corrected. Only the Italian words are kept, with the engraving's spellings.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-cosa-mi-narri": {
    portrait: "figaro:countess",
    opera: "Le nozze di Figaro",
    kind: "Recitative",
    facts: {
      key: "C major (no key signature)",
      time: "4/4",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 92, close to the studio recordings’ pace (about 35 seconds)",
    },
    notePlaceholder: "Susanna reports the Count’s anger; the Countess decides to write him a note",
    about: (
      <>
        <p>
          Score: the recitative “Cosa mi narri?” (vocal score pages 255-256, 13 bars), from Paul Klengel’s piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain.
          Written out from the printed pages: the sung lines and the piano each read independently, every disagreement settled on the page by a separate judge, then
          checked bar by bar against the page by an independent checker and corrected. Only the Italian words are kept, with the engraving's spellings.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-sullaria": {
    portrait: "figaro:countess",
    opera: "Le nozze di Figaro",
    kind: "Duettino",
    facts: {
      key: "B flat major",
      time: "6/8",
      tempo: "Allegretto at ♩. = 48, then Recitativo at ♩ = 92 (about 2½ minutes; set from studio recordings)",
    },
    notePlaceholder: "The Countess dictates a letter inviting the Count to the garden; Susanna writes it (No. 20)",
    about: (
      <>
        <p>
          Score: the duettino “Sull’aria” (vocal score pages 257-259, 62 bars), from Paul Klengel’s piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain.
          Written out from the printed pages: the sung lines and the piano each read independently, every disagreement settled on the page by a separate judge, then
          checked bar by bar against the page by an independent checker and corrected. Only the Italian words are kept, with the engraving's spellings.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-piegato-e-il-foglio": {
    portrait: "figaro:susanna",
    opera: "Le nozze di Figaro",
    kind: "Recitative",
    facts: {
      key: "C major (no key signature)",
      time: "4/4",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 92, close to the studio recordings’ pace (about 30 seconds)",
    },
    notePlaceholder: "The letter is folded and sealed with a pin",
    about: (
      <>
        <p>
          Score: the recitative “Piegato è il foglio” (vocal score pages 259-260, 11 bars), from Paul Klengel’s piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain.
          Written out from the printed pages: the sung lines and the piano each read independently, every disagreement settled on the page by a separate judge, then
          checked bar by bar against the page by an independent checker and corrected. Only the Italian words are kept, with the engraving's spellings.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-ricevete-o-padroncina": {
    portrait: "figaro:figaro",
    opera: "Le nozze di Figaro",
    kind: "Chorus",
    facts: {
      key: "G major",
      time: "6/8",
      tempo: "Grazioso at ♩. = 62 (about a minute; set from studio recordings)",
    },
    notePlaceholder: "The village girls bring flowers to the Countess (No. 21)",
    about: (
      <>
        <p>
          Score: the chorus “Ricevete, o padroncina” (vocal score pages 260-262, 37 bars), from Paul Klengel’s piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain.
          Written out from the printed pages: the sung lines and the piano each read independently, every disagreement settled on the page by a separate judge, then
          checked bar by bar against the page by an independent checker and corrected. Only the Italian words are kept, with the engraving's spellings.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-queste-sono-madama": {
    portrait: "figaro:barbarina",
    opera: "Le nozze di Figaro",
    kind: "Recitative",
    facts: {
      key: "C major (no key signature)",
      time: "4/4",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 92, close to the studio recordings’ pace (about 45 seconds)",
    },
    notePlaceholder: "Barbarina presents the girls; the Countess notices one shy “girl”",
    about: (
      <>
        <p>
          Score: the recitative “Queste sono, Madama” (vocal score pages 262-263, 17 bars), from Paul Klengel’s piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain.
          Written out from the printed pages: the sung lines and the piano each read independently, every disagreement settled on the page by a separate judge, then
          checked bar by bar against the page by an independent checker and corrected. Only the Italian words are kept, with the engraving's spellings.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-eh-cospettate": {
    portrait: "figaro:antonio",
    opera: "Le nozze di Figaro",
    kind: "Recitative",
    facts: {
      key: "C major (no key signature)",
      time: "4/4",
      tempo: "Recitativo at ♩ = 92, then Marcia at ♩ = 112 (about 2½ minutes)",
    },
    notePlaceholder: "Antonio unmasks Cherubino; Barbarina asks to marry him",
    about: (
      <>
        <p>
          Score: the recitative “Eh, cospettate!” (vocal score pages 264-270, 60 bars), from Paul Klengel’s piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain.
          Written out from the printed pages: the sung lines and the piano each read independently, every disagreement settled on the page by a separate judge, then
          checked bar by bar against the page by an independent checker and corrected. Only the Italian words are kept, with the engraving's spellings.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-ecco-la-marcia": {
    portrait: "figaro:figaro",
    opera: "Le nozze di Figaro",
    kind: "Finale",
    facts: {
      key: "C major",
      time: "4/4 (Marcia), 2/4, 3/4 (Andante), 4/4, 2/4",
      tempo: "Marcia at ♩ = 112, then Allegretto at ♩ = 112, then Andante at ♩ = 84, then Maestoso at ♩ = 100 and Recit. at ♩ = 92, then Allegretto at ♩ = 112 (about 6¼ minutes; set from Böhm’s recording, which times the sections separately)",
    },
    notePlaceholder: "The double wedding procession; the Count pricks his finger on Susanna’s note (No. 22)",
    about: (
      <>
        <p>
          Score: the finale “Ecco la marcia” (vocal score pages 270-281, 229 bars), from Paul Klengel’s piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain.
          Written out from the printed pages: the sung lines and the piano each read independently, every disagreement settled on the page by a separate judge, then
          checked bar by bar against the page by an independent checker and corrected. Only the Italian words are kept, with the engraving's spellings.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-lho-perduta": {
    portrait: "figaro:barbarina",
    opera: "Le nozze di Figaro",
    kind: "Cavatina",
    facts: {
      key: "F minor",
      time: "6/8",
      tempo: "Andante ♩. = 44 (about 1¾ minutes; set from studio recordings)",
    },
    notePlaceholder: "Barbarina has lost the pin she was to take to Susanna (No. 23)",
    about: (
      <>
        <p>
          Score: the cavatina “L’ho perduta” (vocal score pages 282-283, 36 bars), from Paul Klengel’s piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain.
          Written out from the printed pages: the sung lines and the piano each read independently, every disagreement settled on the page by a separate judge, then
          checked bar by bar against the page by an independent checker and corrected. Only the Italian words are kept, with the engraving's spellings.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-barbarina-coshai": {
    portrait: "figaro:figaro",
    opera: "Le nozze di Figaro",
    kind: "Recitative",
    facts: {
      key: "C major (no key signature)",
      time: "4/4",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 92, close to the studio recordings’ pace (about 2 minutes)",
    },
    notePlaceholder: "Figaro learns of the pin and thinks Susanna is deceiving him",
    about: (
      <>
        <p>
          Score: the recitative “Barbarina, cos’hai?” (vocal score pages 283-288, 50 bars), from Paul Klengel’s piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain.
          Written out from the printed pages: the sung lines and the piano each read independently, every disagreement settled on the page by a separate judge, then
          checked bar by bar against the page by an independent checker and corrected. Only the Italian words are kept, with the engraving's spellings.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-presto-avvertiam-susanna": {
    portrait: "figaro:marcellina",
    opera: "Le nozze di Figaro",
    kind: "Recitative",
    facts: {
      key: "C major (no key signature)",
      time: "4/4",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 92, close to the studio recordings’ pace (about 30 seconds)",
    },
    notePlaceholder: "Marcellina decides to warn Susanna",
    about: (
      <>
        <p>
          Score: the recitative “Presto avvertiam Susanna” (vocal score pages 288, 11 bars), from Paul Klengel’s piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain.
          Written out from the printed pages: the sung lines and the piano each read independently, every disagreement settled on the page by a separate judge, then
          checked bar by bar against the page by an independent checker and corrected. Only the Italian words are kept, with the engraving's spellings.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-il-capro-e-la-capretta": {
    portrait: "figaro:marcellina",
    opera: "Le nozze di Figaro",
    kind: "Aria",
    facts: {
      key: "G major",
      time: "3/4, then 4/4 from bar 54",
      tempo: "Tempo di Menuetto at ♩ = 100, Allegro at ♩ = 120 (about 3 minutes)",
    },
    notePlaceholder: "Marcellina stands up for women: only men are cruel to their mates",
    about: (
      <>
        <p>
          Score: No. 24, Marcellina’s aria “Il capro e la capretta” (vocal score pages 289-293, 94 bars), from Paul Klengel’s piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain.
          Written out from the printed pages: the sung lines and the piano each read independently, every disagreement settled on the page by a separate judge, then
          checked bar by bar against the page by an independent checker and corrected. Only the Italian words are kept, with the engraving's spellings.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-nel-padiglione-a-manca": {
    portrait: "figaro:barbarina",
    opera: "Le nozze di Figaro",
    kind: "Recitative",
    facts: {
      key: "C major (no key signature)",
      time: "4/4",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 92, close to the studio recordings’ pace (about 1¼ minutes)",
    },
    notePlaceholder: "Barbarina looks for the pavilion; Figaro gathers his witnesses",
    about: (
      <>
        <p>
          Score: the recitative “Nel padiglione a manca” (vocal score pages 293-296, 31 bars), from Paul Klengel’s piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain.
          Written out from the printed pages: the sung lines and the piano each read independently, every disagreement settled on the page by a separate judge, then
          checked bar by bar against the page by an independent checker and corrected. Only the Italian words are kept, with the engraving's spellings.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-hai-diavoli-nel-corpo": {
    portrait: "figaro:basilio",
    opera: "Le nozze di Figaro",
    kind: "Recitative",
    facts: {
      key: "C major (no key signature)",
      time: "4/4",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 92, close to the studio recordings’ pace (about 35 seconds)",
    },
    notePlaceholder: "Basilio explains to Bartolo why Figaro is in such a state",
    about: (
      <>
        <p>
          Score: the recitative “Hai diavoli nel corpo?” (vocal score pages 296-297, 13 bars), from Paul Klengel’s piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain.
          Written out from the printed pages: the sung lines and the piano each read independently, every disagreement settled on the page by a separate judge, then
          checked bar by bar against the page by an independent checker and corrected. Only the Italian words are kept, with the engraving's spellings.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-in-quegli-anni": {
    portrait: "figaro:basilio",
    opera: "Le nozze di Figaro",
    kind: "Aria",
    facts: {
      key: "B flat major",
      time: "4/4, 3/4 from bar 42, 4/4 from bar 102",
      tempo: "Andante at ♩ = 87, then Tempo di Menuetto at ♩ = 137, then Allegro at ♩ = 157 (about 4 minutes; set from studio recordings)",
    },
    notePlaceholder: "Basilio’s fable of the ass’s skin: never cross the powerful",
    about: (
      <>
        <p>
          Score: No. 25, Don Basilio’s aria “In quegl'anni” (vocal score pages 298-304, 138 bars), from Paul Klengel’s piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain.
          Written out from the printed pages: the sung lines and the piano each read independently, every disagreement settled on the page by a separate judge, then
          checked bar by bar against the page by an independent checker and corrected. Only the Italian words are kept, with the engraving's spellings.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-tutto-e-disposto": {
    portrait: "figaro:figaro",
    opera: "Le nozze di Figaro",
    kind: "Aria",
    facts: {
      key: "Recitative in C, aria in E flat major",
      time: "4/4",
      tempo: "Recitativo at ♩ = 92, then Andante at ♩ = 66, then Moderato at ♩ = 132 (about 4 minutes; set from studio recordings)",
    },
    notePlaceholder: "Figaro, sure Susanna is betraying him, warns all men about women",
    about: (
      <>
        <p>
          Score: No. 26, Figaro’s recitative and aria “Tutto è disposto … Aprite un po' quegli occhi” (vocal score pages 304-311, 111 bars), from Paul Klengel’s piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain.
          Written out from the printed pages: the sung lines and the piano each read independently, every disagreement settled on the page by a separate judge, then
          checked bar by bar against the page by an independent checker and corrected. Only the Italian words are kept, with the engraving's spellings.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-signora-ella-mi-disse": {
    portrait: "figaro:susanna",
    opera: "Le nozze di Figaro",
    kind: "Recitative",
    facts: {
      key: "C major (no key signature)",
      time: "4/4",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 92, close to the studio recordings’ pace (about 55 seconds)",
    },
    notePlaceholder: "The women arrive in each other's clothes; Figaro watches",
    about: (
      <>
        <p>
          Score: the recitative “Signora! ella mi disse” (vocal score pages 312-313, 21 bars), from Paul Klengel’s piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain.
          Written out from the printed pages: the sung lines and the piano each read independently, every disagreement settled on the page by a separate judge, then
          checked bar by bar against the page by an independent checker and corrected. Only the Italian words are kept, with the engraving's spellings.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-giunse-alfin-il-momento": {
    portrait: "figaro:susanna",
    opera: "Le nozze di Figaro",
    kind: "Aria",
    facts: {
      key: "Recitative in C, aria in F major",
      time: "4/4, aria 6/8",
      tempo: "Recitative Allegro vivace assai at ♩ = 92 (the voice declaims freely: the studio recordings take this recitative slower still), then the aria Andante at ♩. = 31 (♪ = 92) (about 4¼ minutes; set from studio recordings)",
    },
    notePlaceholder: "Susanna, knowing Figaro listens, sings of longing for her lover",
    about: (
      <>
        <p>
          Score: No. 27, Susanna’s recitative and aria “Giunse alfin il momento … Deh vieni, non tardar” (vocal score pages 314-317, 75 bars), from Paul Klengel’s piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain.
          Written out from the printed pages: the sung lines and the piano each read independently, every disagreement settled on the page by a separate judge, then
          checked bar by bar against the page by an independent checker and corrected. Only the Italian words are kept, with the engraving's spellings.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-perfida-e-in-quella-forma": {
    portrait: "figaro:cherubino",
    opera: "Le nozze di Figaro",
    kind: "Recitative",
    facts: {
      key: "C major (no key signature)",
      time: "4/4",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 92, close to the studio recordings’ pace (about 30 seconds)",
    },
    notePlaceholder: "Figaro despairs; Cherubino comes looking for Barbarina",
    about: (
      <>
        <p>
          Score: the recitative “Perfida! e in quella forma” (vocal score pages 317-318, 12 bars), from Paul Klengel’s piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain.
          Written out from the printed pages: the sung lines and the piano each read independently, every disagreement settled on the page by a separate judge, then
          checked bar by bar against the page by an independent checker and corrected. Only the Italian words are kept, with the engraving's spellings.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-va-la-vecchia-pedante": {
    portrait: "figaro:cherubino",
    opera: "Le nozze di Figaro",
    kind: "Recitative",
    facts: {
      key: "C major (no key signature)",
      time: "4/4",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 92, close to the studio recordings’ pace (about 2 minutes)",
    },
    notePlaceholder: "Cherubino rushes in: the Count has dismissed him",
    about: (
      <>
        <p>
          Score: the recitative “Va là, vecchia pedante” (vocal score pages 43-47, 42 bars), from Paul Klengel’s piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain.
          Written out from the printed pages: the sung lines and the piano each read independently, every disagreement settled on the page by a separate judge, then
          checked bar by bar against the page by an independent checker and corrected. Only the Italian words are kept, with the engraving's spellings.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-pian-pianin": {
    portrait: "figaro:cherubino",
    opera: "Le nozze di Figaro",
    kind: "Finale",
    facts: {
      key: "D major",
      time: "4/4",
      tempo: "Andante at ♩ = 72 (about 2¾ minutes; set, with “Partito è alfin l’audace” and “Tutto è tranquillo”, from the Levine and Harnoncourt recordings)",
    },
    notePlaceholder: "Cherubino flirts with the Countess, thinking she is Susanna",
    about: (
      <>
        <p>
          Score: the Act 4 finale (No. 28), section 1, “Pian pianin, le andrò più presso” (vocal score pages 318-328, 50 bars), from Paul Klengel’s piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain.
          Written out from the printed pages: the sung lines and the piano each read independently, every disagreement settled on the page by a separate judge, then
          checked bar by bar against the page by an independent checker and corrected. Only the Italian words are kept, with the engraving's spellings.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-partito-e-alfin-l-audace": {
    portrait: "figaro:count",
    opera: "Le nozze di Figaro",
    kind: "Finale",
    facts: {
      key: "G major",
      time: "4/4",
      tempo: "Con un poco più di moto at ♩ = 88, a little more motion than the Andante ♩ = 72 before it (about 2¾ minutes)",
    },
    notePlaceholder: "The Count woos his own wife, thinking she is Susanna",
    about: (
      <>
        <p>
          Score: the Act 4 finale (No. 28), section 2, “Partito è alfin l'audace” (vocal score pages 329-337, 58 bars), from Paul Klengel’s piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain.
          Written out from the printed pages: the sung lines and the piano each read independently, every disagreement settled on the page by a separate judge, then
          checked bar by bar against the page by an independent checker and corrected. Only the Italian words are kept, with the engraving's spellings.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-tutto-e-tranquillo": {
    portrait: "figaro:figaro",
    opera: "Le nozze di Figaro",
    kind: "Finale",
    facts: {
      key: "E flat major",
      time: "3/4",
      tempo: "Larghetto at ♩ = 56, then Allegro molto at ♩ = 176 (about 3¼ minutes)",
    },
    notePlaceholder: "Figaro knows Susanna's voice and pretends to woo ‘the Countess’",
    about: (
      <>
        <p>
          Score: the Act 4 finale (No. 28), section 3, “Tutto è tranquillo e placido” (vocal score pages 337-344, 166 bars), from Paul Klengel’s piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain.
          Written out from the printed pages: the sung lines and the piano each read independently, every disagreement settled on the page by a separate judge, then
          checked bar by bar against the page by an independent checker and corrected. Only the Italian words are kept, with the engraving's spellings.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-pace-pace": {
    portrait: "figaro:susanna",
    opera: "Le nozze di Figaro",
    kind: "Finale",
    facts: {
      key: "B flat major",
      time: "6/8",
      tempo: "Andante at ♩. = 64, the same simple Andante 6/8 as “Vostre dunque saran queste carte” in the Act 2 finale (about 2 minutes)",
    },
    notePlaceholder: "Figaro and Susanna make peace, then stage a love scene for the Count",
    about: (
      <>
        <p>
          Score: the Act 4 finale (No. 28), section 4, “Pace, pace, mio dolce tesoro!” (vocal score pages 345-348, 60 bars), from Paul Klengel’s piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain.
          Written out from the printed pages: the sung lines and the piano each read independently, every disagreement settled on the page by a separate judge, then
          checked bar by bar against the page by an independent checker and corrected. Only the Italian words are kept, with the engraving's spellings.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-questo-giorno-di-tormenti": {
    portrait: "figaro:figaro",
    opera: "Le nozze di Figaro",
    kind: "Finale",
    facts: {
      key: "D major",
      time: "4/4",
      tempo: "Allegro assai at ♩ = 200 (about 1½ minutes; set from studio recordings)",
    },
    notePlaceholder: "All celebrate: only love can end this mad day",
    about: (
      <>
        <p>
          Score: the Act 4 finale (No. 28), section 6, “Questo giorno di tormenti” (vocal score pages 356-362, 74 bars, to the end of the opera), from Paul Klengel’s piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain. The print sets the eleven singers on five shared staves; here each has their own line with the notes of their staff.
          Written out from the printed pages: the sung lines and the piano each read independently, every disagreement settled on the page by a separate judge, then
          checked bar by bar against the page by an independent checker and corrected. Only the Italian words are kept, with the engraving's spellings.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-gente-gente-all-armi": {
    portrait: "figaro:count",
    opera: "Le nozze di Figaro",
    kind: "Finale",
    facts: {
      key: "G major",
      time: "4/4",
      tempo: "Allegro assai at ♩ = 200, then Andante at ♩ = 58 (about 3½ minutes; set from studio recordings)",
    },
    notePlaceholder: "The Count is caught out: “Contessa, perdono”",
    about: (
      <>
        <p>
          Score: the Act 4 finale (No. 28), section 5, “Gente, gente, all'armi!” with the Andante “Contessa, perdono” (vocal score pages 348-356, 113 bars), from Paul Klengel’s piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain. Where the print sets several singers on one staff, each named singer here has their own line with the notes of that staff.
          Written out from the printed pages: the sung lines and the piano each read independently, every disagreement settled on the page by a separate judge, then
          checked bar by bar against the page by an independent checker and corrected. Only the Italian words are kept, with the engraving's spellings.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-dove-sono": {
    portrait: "figaro:countess",
    opera: "Le nozze di Figaro",
    kind: "Aria",
    facts: {
      key: "C major",
      time: "Andantino in 2/4, then Allegro in 4/4",
      tempo: "Andantino at ♩ = 44, then Allegro at ♩ = 120 (about 4 minutes; between the faster and broader studio recordings)",
    },
    notePlaceholder: "Take time on “Dove sono”, breathe after “piacer”",
    about: (
      <>
        <p>
          Score: bars 26–135 (here numbered from 1) of a piano-vocal engraving made in MuseScore 4.4, supplied by you; the engraver and licence are not
          stated in the file, so check them before sharing. One lyric typo is corrected (bar 74, “languire‿a”). On screen the tempo marks appear in the bar
          box and joined syllables use ‿.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-cinque-dieci-venti": {
    portrait: "figaro:susanna",
    opera: "Le nozze di Figaro",
    kind: "Duettino",
    facts: {
      key: "G major",
      time: "4/4",
      tempo: "Allegro, played at ♩ = 130 (about 2:40, as in most recordings): Mozart gives the word only",
    },
    notePlaceholder: "Figaro counts and measures; Susanna wants him to look at her hat",
    about: (
      <>
        <p>
          Score: No. 1, bars 1–88, from Paul Klengel's piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900),
          public domain. Read into MusicXML from the scan by you; the two sung lines and their words were rewritten from the printed pages, and the piano
          was checked bar by bar against them and corrected. Only the Italian words are kept. The words follow the engraving's spelling (pò, fè, quì,
          capello).
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-cosa-stai-misurando": {
    portrait: "figaro:figaro",
    opera: "Le nozze di Figaro",
    kind: "Recitative",
    facts: {
      key: "No key signature: it moves through several keys",
      time: "4/4",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 92, close to the studio recordings’ pace (about 50 seconds)",
    },
    notePlaceholder: "Speak it first, then sing: let the words set the rhythm",
    about: (
      <>
        <p>
          Score: the recitative after No. 1 (bars 89–107 of the vocal score, here numbered 1–19), from the same Breitkopf &amp; Härtel vocal score as the
          duettino, read from the scan and corrected against the printed pages.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-or-bene-ascolta-e-taci": {
    portrait: "figaro:susanna",
    opera: "Le nozze di Figaro",
    kind: "Recitative",
    facts: {
      key: "No key signature: it moves through several keys",
      time: "4/4",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 92, close to the studio recordings’ pace (about 1¾ minutes)",
    },
    notePlaceholder: "Speak it first, then sing: Susanna is telling, Figaro is finding out",
    about: (
      <>
        <p>
          Score: the recitative after No. 2 (bars 145–184 of the vocal score, here numbered 1–40) from Paul Klengel's piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain.
          Read into MusicXML from the scan by you; the sung lines were written out twice independently from the printed pages, the piano corrected bar by
          bar, and the whole checked until a full round, an accidentals pass and a fresh checker found nothing. Only the Italian words are kept.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-bravo-signor-padrone": {
    portrait: "figaro:figaro",
    opera: "Le nozze di Figaro",
    kind: "Recitative",
    facts: {
      key: "No key signature: it moves through several keys",
      time: "4/4",
      tempo: "Moderato at ♩ = 96 (an accompanied recitative: a shade above the secco recitatives’ speaking pace), then Andante at ♩ = 66 from bar 11 (about 40 seconds)",
    },
    notePlaceholder: "Bitter and quick, then slower as the plan forms",
    about: (
      <>
        <p>
          Score: the recitative before No. 3 (bars 185–198 of the vocal score, here numbered 1–14) from Paul Klengel's piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain.
          Read into MusicXML from the scan by you; the sung lines were written out twice independently from the printed pages, the piano corrected bar by
          bar, and the whole checked until a full round, an accidentals pass and a fresh checker found nothing. Only the Italian words are kept.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-ed-aspettaste-il-giorno": {
    portrait: "figaro:bartolo",
    opera: "Le nozze di Figaro",
    kind: "Recitative",
    facts: {
      key: "No key signature: it moves through several keys",
      time: "4/4",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 92, close to the studio recordings’ pace (about a minute)",
    },
    notePlaceholder: "Two old plotters: Marcellina eager, Bartolo savouring it",
    about: (
      <>
        <p>
          Score: the recitative after No. 3 (bars 330–351 of the vocal score, here numbered 1–22) from Paul Klengel's piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain.
          Read into MusicXML from the scan by you; the sung lines were written out twice independently from the printed pages, the piano corrected bar by
          bar, and the whole checked until a full round, an accidentals pass and a fresh checker found nothing. Only the Italian words are kept.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-la-vendetta": {
    portrait: "figaro:bartolo",
    opera: "Le nozze di Figaro",
    kind: "Aria",
    facts: {
      key: "D major",
      time: "Allegro con spirito in 4/4",
      tempo: "♩ = 138 (about 3 minutes; set from studio recordings): Mozart gives the words only",
    },
    notePlaceholder: "Pompous and pleased with himself: the patter in the middle must stay crisp",
    about: (
      <>
        <p>
          Score: No. 4 from Paul Klengel's piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain.
          Read into MusicXML from the scan by you; the sung line was written out twice independently from the printed pages, the piano rewritten from the
          print twice independently and reconciled, and the whole checked until a full round, an accidentals pass and two fresh checkers found nothing.
          Only the Italian words are kept. In bar 65 (bar 416 of the vocal score) the piano's last B is printed without a sign after a B♭ earlier in the
          split bar; it is played here as B natural, which the harmony needs.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-basilio-in-traccia-tosto": {
    portrait: "figaro:count",
    opera: "Le nozze di Figaro",
    kind: "Recitative",
    facts: {
      key: "No key signature: it moves through several keys",
      time: "4/4",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 92, close to the studio recordings’ pace (about a minute)",
    },
    notePlaceholder: "The Count is triumphant; Susanna is trapped",
    about: (
      <>
        <p>
          Score: the recitative after No. 7 (vocal score pages 72-74) from Paul Klengel's piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain.
          Written out from the printed pages: the sung lines and the piano each transcribed twice independently and reconciled, checked in several
          rounds, then checked again by independent checkers against the print; their findings (chorus dynamics, reminder signs) were added.
          Only the Italian words are kept, with the engraving's spellings.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-giovani-liete": {
    portrait: "figaro:figaro",
    opera: "Le nozze di Figaro",
    kind: "Chorus",
    facts: {
      key: "G major",
      time: "Allegro in 6/8",
      tempo: "Allegro at ♩. = 73 (about a minute; set from studio recordings)",
    },
    notePlaceholder: "Bright and light: the villagers are strewing flowers",
    about: (
      <>
        <p>
          Score: No. 8 (pages 74-76) from Paul Klengel's piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain.
          Written out from the printed pages: the sung lines and the piano each transcribed twice independently and reconciled, checked in several
          rounds, then checked again by independent checkers against the print; their findings (chorus dynamics, reminder signs) were added.
          Only the Italian words are kept, with the engraving's spellings.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-cos-e-questa-commedia": {
    portrait: "figaro:count",
    opera: "Le nozze di Figaro",
    kind: "Recitative",
    facts: {
      key: "No key signature: it moves through several keys",
      time: "4/4",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 92, close to the studio recordings’ pace (about 1½ minutes)",
    },
    notePlaceholder: "Figaro is pushing; the Count is playing for time",
    about: (
      <>
        <p>
          Score: the recitative after No. 8 (pages 76-79) from Paul Klengel's piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain.
          Written out from the printed pages: the sung lines and the piano each transcribed twice independently and reconciled, checked in several
          rounds, then checked again by independent checkers against the print; their findings (chorus dynamics, reminder signs) were added.
          Only the Italian words are kept, with the engraving's spellings.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-giovani-liete-reprise": {
    portrait: "figaro:figaro",
    opera: "Le nozze di Figaro",
    kind: "Chorus",
    facts: {
      key: "G major",
      time: "Allegro in 6/8",
      tempo: "Allegro at ♩. = 73 (about 50 seconds; set from studio recordings)",
    },
    notePlaceholder: "Bright and light, as before",
    about: (
      <>
        <p>
          Score: the reprise of No. 8 (pages 79-81) from Paul Klengel's piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain.
          Written out from the printed pages: the sung lines and the piano each transcribed twice independently and reconciled, checked in several
          rounds, then checked again by independent checkers against the print; their findings (chorus dynamics, reminder signs) were added.
          Only the Italian words are kept, with the engraving's spellings.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-evviva": {
    portrait: "figaro:figaro",
    opera: "Le nozze di Figaro",
    kind: "Recitative",
    facts: {
      key: "No key signature: it moves through several keys",
      time: "4/4",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 92, close to the studio recordings’ pace (about 1¼ minutes)",
    },
    notePlaceholder: "Cheerful on the surface; Cherubino is crestfallen",
    about: (
      <>
        <p>
          Score: the recitative before No. 9 (pages 81-83) from Paul Klengel's piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain.
          Written out from the printed pages: the sung lines and the piano each transcribed twice independently and reconciled, checked in several
          rounds, then checked again by independent checkers against the print; their findings (chorus dynamics, reminder signs) were added.
          Only the Italian words are kept, with the engraving's spellings.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-non-piu-andrai": {
    portrait: "figaro:figaro",
    opera: "Le nozze di Figaro",
    kind: "Aria",
    facts: {
      key: "C major",
      time: "Allegro in 4/4 (felt in two)",
      tempo: "♩ = 123 (about 3:45, as in most recordings): Mozart gives the word only",
    },
    notePlaceholder: "Mock-military: tease Cherubino, then march",
    about: (
      <>
        <p>
          Score: No. 9 (pages 84-89) from Paul Klengel's piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain.
          Written out from the printed pages: the sung lines and the piano each transcribed twice independently and reconciled, checked in several
          rounds, then checked again by independent checkers against the print; their findings (chorus dynamics, reminder signs) were added.
          Only the Italian words are kept, with the engraving's spellings.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-porgi-amor": {
    portrait: "figaro:countess",
    opera: "Le nozze di Figaro",
    kind: "Cavatina",
    facts: {
      key: "E♭ major",
      time: "Larghetto in 2/4",
      tempo: "♪ = 55 (about 3:40, as in most recordings): Mozart gives the word only",
    },
    notePlaceholder: "Long, even lines: grief held with dignity",
    about: (
      <>
        <p>
          Score: No. 10 (pages 90-91) from Paul Klengel's piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain.
          Written out from the printed pages: the sung lines and the piano each transcribed twice independently and reconciled, checked in several
          rounds, then checked again by independent checkers against the print; their findings (chorus dynamics, reminder signs) were added.
          Only the Italian words are kept, with the engraving's spellings.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-vieni-cara-susanna": {
    portrait: "figaro:countess",
    opera: "Le nozze di Figaro",
    kind: "Recitative",
    facts: {
      key: "No key signature in the recitative; the closing Allegretto is in F major",
      time: "4/4, with a Presto in 2/4 and an Allegretto in 3/4",
      tempo: "Recitativo at ♩ = 92, then Presto at ♩ = 176, then recitative again at ♩ = 92, then Allegretto at ♩ = 130 (about 4 minutes)",
    },
    notePlaceholder: "Plotting together: quick, conversational, and Figaro sure of himself",
    about: (
      <>
        <p>
          Score: the recitative after No. 10 (pages 92-100) from Paul Klengel's piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain.
          Written out from the printed pages: the sung lines and the piano each transcribed twice independently and reconciled, checked in several
          rounds, then checked again by independent checkers against the print; their findings (chorus dynamics, reminder signs) were added.
          Only the Italian words are kept, with the engraving's spellings.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-quanto-duolmi-susanna": {
    portrait: "figaro:countess",
    opera: "Le nozze di Figaro",
    kind: "Recitative",
    facts: {
      key: "No key signature: it moves through several keys",
      time: "4/4",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 92, close to the studio recordings’ pace (about 1¼ minutes)",
    },
    notePlaceholder: "The Countess frets; Susanna brings Cherubino in",
    about: (
      <>
        <p>
          Score: the recitative before No. 11 (vocal score pages 101-103) from Paul Klengel's piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain.
          Written out from the printed pages: the sung lines and the piano each transcribed twice independently and reconciled on the page, then
          checked by independent checkers until a full round was clean, followed by accidentals, slur and singer passes and a fresh final check.
          Only the Italian words are kept, with the engraving's spellings.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-non-so-piu": {
    portrait: "figaro:cherubino",
    opera: "Le nozze di Figaro",
    kind: "Aria",
    facts: {
      key: "E flat major",
      time: "4/4",
      tempo: "Allegro vivace: played here at ♩ = 152, with the Adagio (bars 92-95) at ♩ = 50 (about 3 minutes)",
    },
    notePlaceholder: "Cherubino can't stop talking about love",
    about: (
      <>
        <p>
          Score: No. 6, Cherubino's aria “Non so più cosa son, cosa faccio” (vocal score pages 48-51, 100 bars), from Paul Klengel's piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain.
          Written out from the printed pages: the sung lines and the piano each read independently, every disagreement settled on the page by a separate judge, then
          checked bar by bar against the page by an independent checker and corrected. Only the Italian words are kept, with the engraving's spellings (sò).
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-voi-che-sapete": {
    portrait: "figaro:cherubino",
    opera: "Le nozze di Figaro",
    kind: "Canzona",
    facts: {
      key: "B flat major",
      time: "2/4",
      tempo: "Andante con moto: played here at ♩ = 53 (about 3 minutes, as in the recordings by Jacobs and Harnoncourt)",
    },
    notePlaceholder: "Cherubino sings his song to the ladies",
    about: (
      <>
        <p>
          Score: No. 11 Canzona (vocal score pages 103-106) from Paul Klengel's piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain.
          Written out from the printed pages: the sung lines and the piano each transcribed twice independently and reconciled on the page, then
          checked by independent checkers until a full round was clean, followed by accidentals, slur and singer passes and a fresh final check.
          Only the Italian words are kept, with the engraving's spellings.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-bravo-che-bella-voce": {
    portrait: "figaro:countess",
    opera: "Le nozze di Figaro",
    kind: "Recitative",
    facts: {
      key: "No key signature: it moves through several keys",
      time: "4/4",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 92, close to the studio recordings’ pace (about a minute)",
    },
    notePlaceholder: "The ladies praise the song and start the disguise",
    about: (
      <>
        <p>
          Score: the recitative after No. 11 (vocal score pages 106-108) from Paul Klengel's piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain.
          Written out from the printed pages: the sung lines and the piano each transcribed twice independently and reconciled on the page, then
          checked by independent checkers until a full round was clean, followed by accidentals, slur and singer passes and a fresh final check.
          Only the Italian words are kept, with the engraving's spellings.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-venite-inginocchiatevi": {
    portrait: "figaro:susanna",
    opera: "Le nozze di Figaro",
    kind: "Aria",
    facts: {
      key: "G major",
      time: "2/4",
      tempo: "Allegretto: played here at ♩ = 84 (about 2 minutes 50 seconds, as in the recordings by Böhm, Jacobs and Harnoncourt)",
    },
    notePlaceholder: "Susanna dresses Cherubino as a girl",
    about: (
      <>
        <p>
          Score: No. 12 Aria (vocal score pages 109-113) from Paul Klengel's piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain.
          Written out from the printed pages: the sung lines and the piano each transcribed twice independently and reconciled on the page, then
          checked by independent checkers until a full round was clean, followed by accidentals, slur and singer passes and a fresh final check.
          Only the Italian words are kept, with the engraving's spellings. The opening upbeat counts as bar 1. In bar 40 the piano's C is printed without the sharp it has in bar 50; it is kept as printed.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-ah-signor-signor": {
    portrait: "figaro:antonio",
    opera: "Le nozze di Figaro",
    kind: "Finale",
    facts: {
      key: "F major (Allegro molto), then B flat major (Andante)",
      time: "4/4, then 6/8",
      tempo: "Allegro molto at ♩ = 202, then Andante at ♩. = 64, the same simple Andante 6/8 as “Pace, pace” in the Act 4 finale (about 5½ minutes; set from studio recordings)",
    },
    notePlaceholder: "Antonio storms in: someone jumped from the window onto his carnations",
    about: (
      <>
        <p>
          Score: the fourth section of the Act 2 Finale, No. 15, from Antonio's entrance “Ah! signor, signor!” through the Andante in 6/8 (vocal score pages 169-186, 230 bars), from Paul Klengel's piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain.
          Written out from the printed pages: the sung lines and the piano each read independently, every disagreement settled on the page by a separate judge, then
          checked bar by bar against the page by an independent checker and corrected. Only the Italian words are kept, with the engraving's spellings.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-voi-signor-che-giusto-siete": {
    portrait: "figaro:marcellina",
    opera: "Le nozze di Figaro",
    kind: "Finale",
    facts: {
      key: "E flat major",
      time: "4/4",
      tempo: "Allegro assai at ♩ = 205, then Più Allegro at ♩ = 270, then Prestissimo at ♩ = 324 (about 4 minutes; set from studio recordings)",
    },
    notePlaceholder: "Marcellina, Bartolo and Basilio arrive to claim Figaro's promise of marriage",
    about: (
      <>
        <p>
          Score: the fifth and last section of the Act 2 Finale, No. 15, from the entrance of Marcellina, Bartolo and Basilio “Voi, signor, che giusto siete” to the end of the act (vocal score pages 186-204, 243 bars), from Paul Klengel's piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain.
          Written out from the printed pages: the sung lines and the piano each read independently, every disagreement settled on the page by a separate judge, then
          checked bar by bar against the page by an independent checker and corrected. Only the Italian words are kept, with the engraving's spellings.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-signori-di-fuori": {
    portrait: "figaro:figaro",
    opera: "Le nozze di Figaro",
    kind: "Finale",
    facts: {
      key: "G major (Allegro con spirito), then C major (Andante)",
      time: "3/8, then 2/4",
      tempo: "Allegro con spirito at ♩. = 80, then Andante at ♩ = 63 (about 3 minutes; set from the Böhm and Gardiner recordings, which time the two sections separately); the last bar, the first of “Ah signor”’s Allegro molto, at its ♩ = 202",
    },
    notePlaceholder: "Figaro bursts in to fetch everyone for the wedding",
    about: (
      <>
        <p>
          Score: the third section of the Act 2 Finale, No. 15, from Figaro's entrance “Signori, di fuori son già i suonatori” through the Andante to the first chord of the Allegro molto (vocal score pages 159-169, 140 bars), from Paul Klengel's piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain.
          Written out from the printed pages: the sung lines and the piano each read independently, every disagreement settled on the page by a separate judge, then
          checked bar by bar against the page by an independent checker and corrected. Only the Italian words are kept, with the engraving's spellings (quì, sò, gia).
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-susanna-signore": {
    portrait: "figaro:susanna",
    opera: "Le nozze di Figaro",
    kind: "Finale",
    facts: {
      key: "B flat major",
      time: "3/8 (Molto Andante), then 4/4 (Allegro)",
      tempo: "Molto Andante at ♪ = 88, then Allegro at ♩ = 176, as the score changes tempo (about 5 minutes; set from the Böhm and Gardiner recordings, which time the two sections separately)",
    },
    notePlaceholder: "Susanna steps out of the closet, and the Count must beg pardon",
    about: (
      <>
        <p>
          Score: the second section of the Act 2 Finale, No. 15, from Susanna stepping out of the closet (“Susanna! Signore!”, Molto Andante) through the Allegro to Figaro's entrance (vocal score pages 147-159, 202 bars), from Paul Klengel's piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain.
          Written out from the printed pages: the sung lines and the piano each transcribed twice independently, every disagreement settled on the page by a separate judge, then
          checked bar by bar against the page by independent checkers. Only the Italian words are kept, with the engraving's spellings (“credera” for crederà, “cos' è”).
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-che-novita": {
    portrait: "figaro:count",
    opera: "Le nozze di Figaro",
    kind: "Recitative",
    facts: {
      key: "C major (no key signature)",
      time: "4/4",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 92, close to the studio recordings’ pace (about 1¼ minutes)",
    },
    notePlaceholder: "The Count finds the closet locked and grows suspicious",
    about: (
      <>
        <p>
          Score: the recitative “Che novità!” (Scena V) before No. 13 (vocal score pages 119-122, 28 bars), from Paul Klengel's piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain.
          Written out from the printed pages: the sung lines and the piano each read independently, every disagreement settled on the page by a separate judge, then
          checked bar by bar against the page by an independent checker and corrected. Only the Italian words are kept, with the engraving's spellings.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-susanna-or-via-sortite": {
    portrait: "figaro:countess",
    opera: "Le nozze di Figaro",
    kind: "Terzetto",
    facts: {
      key: "C major",
      time: "3/4",
      tempo: "Allegro spirituoso at ♩ = 144, with the short Recit. (bars 121-123) at ♩ = 92 (about 3 minutes)",
    },
    notePlaceholder: "The Count orders “Susanna” out of the closet; the Countess forbids it",
    about: (
      <>
        <p>
          Score: No. 13, the terzetto “Susanna, or via, sortite” (vocal score pages 123-131, 146 bars), from Paul Klengel's piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain.
          Written out from the printed pages: the sung lines and the piano each read independently, every disagreement settled on the page by a separate judge, then
          checked bar by bar against the page by an independent checker and corrected. Only the Italian words are kept, with the engraving's spellings.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-dunque-voi-non-aprite": {
    portrait: "figaro:count",
    opera: "Le nozze di Figaro",
    kind: "Recitative",
    facts: {
      key: "C major (no key signature)",
      time: "4/4",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 92, close to the studio recordings’ pace (about 55 seconds)",
    },
    notePlaceholder: "The Count decides to break the closet door open himself",
    about: (
      <>
        <p>
          Score: the recitative “Dunque voi non aprite?” before No. 14 (vocal score pages 132-133, 21 bars), from Paul Klengel's piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain.
          Written out from the printed pages: the sung lines and the piano each read independently, every disagreement settled on the page by a separate judge, then
          checked bar by bar against the page by an independent checker and corrected. Only the Italian words are kept, with the engraving's spellings.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-aprite-presto-aprite": {
    portrait: "figaro:cherubino",
    opera: "Le nozze di Figaro",
    kind: "Duettino",
    facts: {
      key: "G major",
      time: "4/4",
      tempo: "Allegro assai at ♩ = 160 (about a minute; set from studio recordings)",
    },
    notePlaceholder: "Susanna frees Cherubino, who jumps out of the window",
    about: (
      <>
        <p>
          Score: No. 14, the duettino “Aprite, presto, aprite” (vocal score pages 134-137, 44 bars), from Paul Klengel's piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain.
          Written out from the printed pages: the sung lines and the piano each read independently, every disagreement settled on the page by a separate judge, then
          checked bar by bar against the page by an independent checker and corrected. Only the Italian words are kept, with the engraving's spellings.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-oh-guarda-il-demonietto": {
    portrait: "figaro:susanna",
    opera: "Le nozze di Figaro",
    kind: "Recitative",
    facts: {
      key: "C major (no key signature)",
      time: "4/4",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 92, close to the studio recordings’ pace (about 20 seconds)",
    },
    notePlaceholder: "Susanna watches Cherubino run off and hides in the closet herself",
    about: (
      <>
        <p>
          Score: the recitative “Oh guarda il demonietto!” after No. 14 (vocal score pages 137, 7 bars), from Paul Klengel's piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain.
          Written out from the printed pages: the sung lines and the piano each read independently, every disagreement settled on the page by a separate judge, then
          checked bar by bar against the page by an independent checker and corrected. Only the Italian words are kept, with the engraving's spellings.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-tutto-e-come-il-lasciai": {
    portrait: "figaro:countess",
    opera: "Le nozze di Figaro",
    kind: "Recitative",
    facts: {
      key: "C major (no key signature)",
      time: "4/4",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 92, close to the studio recordings’ pace (about 1¼ minutes)",
    },
    notePlaceholder: "The Countess confesses that Cherubino is in the closet",
    about: (
      <>
        <p>
          Score: the recitative “Tutto è come il lasciai” before the Act 2 Finale (vocal score pages 138-140, 29 bars), from Paul Klengel's piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain.
          Written out from the printed pages: the sung lines and the piano each read independently, every disagreement settled on the page by a separate judge, then
          checked bar by bar against the page by an independent checker and corrected. Only the Italian words are kept, with the engraving's spellings.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-esci-omai-garzon-malnato": {
    portrait: "figaro:count",
    opera: "Le nozze di Figaro",
    kind: "Finale",
    facts: {
      key: "E flat major",
      time: "4/4",
      tempo: "Allegro at ♩ = 176, with the one-bar Recitativo (bar 80) at ♩ = 92 (about 3 minutes; set from studio recordings)",
    },
    notePlaceholder: "The key, the closet, and the Count's fury",
    about: (
      <>
        <p>
          Score: the opening section of the Act 2 Finale, No. 15, from “Esci omai, garzon malnato” to the Count going to open the closet (vocal score pages 141-147, bars 1-125), from Paul Klengel's piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain.
          Written out from the printed pages: the sung lines and the piano each transcribed twice independently, every disagreement settled on the page by a separate judge, then
          checked bar by bar against the page by independent checkers, who found it clean. In bar 80 the print marks “Recitativo”: the Count reads the paper freely.
          Only the Italian words are kept, with the engraving's spellings. The rest of the Finale follows section by section.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-cosa-sento": {
    portrait: "figaro:count",
    opera: "Le nozze di Figaro",
    kind: "Terzetto",
    facts: {
      key: "B flat major",
      time: "4/4",
      tempo: "Allegro assai at ♩ = 200, then Recitativo at ♩ = 92, then in tempo at ♩ = 200 (about 4½ minutes; set from studio recordings)",
    },
    notePlaceholder: "The Count steps out from behind the chair",
    about: (
      <>
        <p>
          Score: No. 7, the Terzetto “Cosa sento!” (vocal score pages 60-71, 221 bars), from Paul Klengel's piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain. In bars 121-128 the Count tells his story in recitative, then the Allegro assai returns.
          Written out from the printed pages: the sung lines and the piano each read independently, every disagreement settled on the page by a separate judge, then
          checked bar by bar against the page by an independent checker and corrected. Only the Italian words are kept, with the engraving's spellings (quì, ajutarti, jer).
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-taci-vien-gente": {
    portrait: "figaro:susanna",
    opera: "Le nozze di Figaro",
    kind: "Recitative",
    facts: {
      key: "No key signature: it moves through several keys",
      time: "4/4",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 92, close to the studio recordings’ pace, with the printed Andante of the piano’s run in bar 37 at ♩ = 72 (about 3½ minutes)",
    },
    notePlaceholder: "The armchair, the dressing gown, and Basilio at the door",
    about: (
      <>
        <p>
          Score: the recitative after No. 6, from “Taci, vien gente” to the Terzetto (vocal score pages 52-59, 83 bars), from Paul Klengel's piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain.
          Written out from the printed pages: the sung lines and the piano each transcribed twice independently, every disagreement settled on the page by a separate judge, then
          checked bar by bar against the page by an independent checker and corrected. Only the Italian words are kept, with the engraving's spellings (quì, rè, sò). Cherubino hides here and does not sing.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-quante-buffonerie": {
    portrait: "figaro:countess",
    opera: "Le nozze di Figaro",
    kind: "Recitative",
    facts: {
      key: "No key signature: it moves through several keys",
      time: "4/4",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 92, close to the studio recordings’ pace (about 2½ minutes)",
    },
    notePlaceholder: "The ribbon, the plaster, and the Count at the door",
    about: (
      <>
        <p>
          Score: the recitative after No. 12, up to the Count's entrance (vocal score pages 114-119) from Paul Klengel's piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain.
          Written out from the printed pages: the sung lines and the piano each transcribed twice independently and reconciled on the page, then
          checked by independent checkers until a full round was clean, followed by accidentals, slur and singer passes and a fresh final check.
          Only the Italian words are kept, with the engraving's spellings. In bar 54 the Count's “parlate?” is printed half a beat too long; it is read as eighths so the bar adds up.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-tutto-ancor-non-ho-perso": {
    portrait: "figaro:marcellina",
    opera: "Le nozze di Figaro",
    kind: "Recitative",
    facts: {
      key: "No key signature: it moves through several keys",
      time: "4/4",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 92, close to the studio recordings’ pace (about 35 seconds)",
    },
    notePlaceholder: "Marcellina plots aloud; Susanna's asides cut in",
    about: (
      <>
        <p>
          Score: the recitative before No. 5 (vocal score pages 37-38) from Paul Klengel's piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain.
          Written out from the printed pages: the sung lines and the piano each transcribed twice independently and reconciled on the page, then
          checked by independent checkers until a full round was clean, followed by accidentals, slur and singer passes and a fresh final check.
          Only the Italian words are kept, with the engraving's spellings. Marcellina's French “l'argent fait tout” is as printed.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-via-resti-servita": {
    portrait: "figaro:marcellina",
    opera: "Le nozze di Figaro",
    kind: "Duettino",
    facts: {
      key: "A major",
      time: "Allegro in 4/4",
      tempo: "♩ = 132 (about 2:15, as in the recordings by Gui, Harnoncourt and Jacobs): Mozart gives the word only",
    },
    notePlaceholder: "Exaggerated politeness: every curtsey is an insult",
    about: (
      <>
        <p>
          Score: No. 5 (pages 38-43) from Paul Klengel's piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain.
          Written out from the printed pages: the sung lines and the piano each transcribed twice independently and reconciled on the page, then
          checked by independent checkers until a full round was clean, followed by accidentals, slur and singer passes and a fresh final check.
          Only the Italian words are kept, with the engraving's spellings. The print has two slips that are kept as printed: “sa i” for “so i” (bar 19, Marcellina) and “Sibila” for “Sibilla” (bar 61, Susanna). Where the print gives a pickup note only to the German words, the Italian line rests, as printed.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-se-a-caso-madama": {
    portrait: "figaro:figaro",
    opera: "Le nozze di Figaro",
    kind: "Duettino",
    facts: {
      key: "B♭ major",
      time: "Allegro in 2/4",
      tempo: "Allegro ♩ = 116 (about 2:30, as in most recordings): Mozart gives the word only",
    },
    notePlaceholder: "Figaro is pleased with himself; Susanna lets the penny drop slowly",
    about: (
      <>
        <p>
          Score: No. 2 from Paul Klengel's piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain.
          Read into MusicXML from the scan by you; both sung lines were written out twice independently from the printed pages, the piano corrected bar by
          bar (bars 74–86, which the scan dropped, rewritten from the print), and the whole checked until a full round, an accidentals pass and two fresh
          checkers found nothing. Only the Italian words are kept.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-se-vuol-ballare": {
    portrait: "figaro:figaro",
    opera: "Le nozze di Figaro",
    kind: "Cavatina",
    facts: {
      key: "F major",
      time: "Allegretto in 3/4, with two Presto sections in 2/4",
      tempo: "Allegretto ♩ = 130, Presto ♩ = 176 (about 2:25, as in most recordings): Mozart gives the words only",
    },
    notePlaceholder: "Keep it light and mocking: the threat is in the words, not the volume",
    about: (
      <>
        <p>
          Score: No. 3 from Paul Klengel's piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain.
          Read into MusicXML from the scan by you; the sung line was written out twice independently from the printed pages, the piano corrected bar by
          bar, and the whole checked until a full round, an accidentals pass and two fresh checkers found nothing. Only the Italian words are kept, with the
          engraving's spellings (quà, pugnendo, rovescierò).
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-figaro-sinfonia": {
    // no one sings it: the opera's own picture stands for it
    portrait: "figaro:figaro",
    opera: "Le nozze di Figaro",
    kind: "Overture",
    facts: {
      key: "D major",
      time: "¢ (alla breve)",
      tempo: "Presto, played at a half note = 144 (♩ = 288): Mozart gives the word only",
    },
    notePlaceholder: "",
    about: (
      <>
        <p>
          Score: Paul Klengel's piano reduction in the Breitkopf &amp; Härtel vocal score (Edition Breitkopf 1716, about 1900), public domain. Read into
          MusicXML from the scan by you, then checked bar by bar against the printed pages and corrected: the tremolos, the right hand of bars 107–125
          (read in the wrong clef), a handful of wrong or extra notes, ties and lengths, and the closing notes of the trills. The instrument cues printed
          over the staves are left off. Mozart gives no metronome number; it plays at a half note = 144, about four minutes.
        </p>
        <p>Music by Wolfgang Amadeus Mozart (1786), public domain.</p>
      </>
    ),
  },
  "mozart-soave-sia-il-vento": {
    portrait: "cosi:fiordiligi",
    opera: "Così fan tutte",
    kind: "Terzettino",
    facts: {
      key: "E major",
      time: "2/2 (alla breve)",
      tempo: "Andante, ♩ ≈ 65: the engraving's playback number, Mozart gives the word only",
    },
    notePlaceholder: "Keep the line smooth and quiet, and listen to the other two",
    about: (
      <>
        <p>
          Score: a piano-vocal engraving made in MuseScore 3.6.1 (2021), supplied by you; the engraver and licence are not stated in the file, so check them
          before sharing. The three voices, labelled Fi., Do. and D.A. in the file, are named; the German singing translation printed under the Italian is
          left out; Dorabella's missing ‘e’ of elemento is restored in bar 17, and Don Alfonso's ‘be-’ in bar 26 is corrected to ‘ai’ (ai nostri desir). The
          stage direction at the end is given in English. On screen the tempo marks appear in the bar box and joined syllables use ‿.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for
          this app and have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-der-holle-rache": {
    portrait: "zauberfloete:queen",
    opera: "Die Zauberflöte",
    kind: "Aria",
    facts: {
      key: "D minor",
      time: "4/4",
      tempo: "Allegro assai, ♩ ≈ 144: the engraving's playback number, Mozart gives words only",
    },
    notePlaceholder: "Keep the staccato high notes light; breathe before “Hört”",
    about: (
      <>
        <p>
          Score: a piano-vocal engraving made in MuseScore 3.6.2 (2022), supplied by you; the engraver and licence are not stated in the file, so check them
          before sharing. The voice part, labelled Flute in the file, is renamed, and five syllable markings are corrected (Sarastro and Todesschmerzen in
          bars 13 and 15, ah in bar 39, zertrümmert in bar 57, erblassen in bars 86–87). The coloratura of bars 69–79 is sung on the one word Ban—de, as in
          the published scores; the engraving's two ‘ah’ restarts inside it are left out. On screen the tempo marks appear in the bar box.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Emanuel Schikaneder (1791), both public domain. The IPA, word meanings and translation were written for
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
  /** the piece's recorded voices (their manifests: clips and word timings) */
  voices: unknown[];
}

const byId = (rec: Record<string, unknown>, id: string, file: string) => rec[`../../data/content/${id}/${file}`];

export function hasPiece(id: string | undefined): id is string {
  return !!id && !!PIECE_INFO[id] && !!byId(editions, id, "edition.json");
}

/** the piece's title once its data has loaded */
export const pieceTitle = (id: string) => editionData.get(id)?.title;

export function pieceData(id: string): PieceData {
  return {
    id,
    edition: editionData.get(id) as CompiledEdition,
    language: languageData.get(id) as CompiledLanguage,
    scoreXml: scoreText.get(id) ?? "",
    info: PIECE_INFO[id],
    voices: voiceData.get(id) ?? [],
  };
}
