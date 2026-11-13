/**
 * The pieces that open in the practice screen: their data (imported by scripts/import-content.ts) and the few words
 * about each that the data does not carry (the opera, the portrait, the facts and credits shown in the drawers).
 */
import type { ReactNode } from "react";
import type { CompiledEdition, CompiledLanguage } from "../../shared/types";

// Each piece's data loads only when the piece opens (one small file per piece), so the app starts at once however
// many pieces it holds.
// Each file arrives gzip-compressed as base64 (the "?z" import, vite.standalone.config.ts) and is inflated here.
async function inflate(b64: string): Promise<string> {
  const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const stream = new Blob([bin]).stream().pipeThrough(new DecompressionStream("gzip"));
  return new Response(stream).text();
}
const zipped = (rec: Record<string, () => Promise<string>>) =>
  Object.fromEntries(Object.entries(rec).map(([k, load]) => [k, () => load().then(inflate)])) as Record<string, () => Promise<string>>;
const zjson = <T,>(rec: Record<string, () => Promise<string>>) =>
  Object.fromEntries(Object.entries(zipped(rec)).map(([k, load]) => [k, () => load().then((t) => JSON.parse(t) as T)])) as Record<string, () => Promise<T>>;
const editions = zjson<CompiledEdition>(
  import.meta.glob(["../../data/content/*/edition.json", "!../../data/content/cp-fx-*/**", "!../../data/content/site-*/**"], { query: "?z", import: "default" }) as Record<
    string,
    () => Promise<string>
  >,
);
const languages = zjson<CompiledLanguage>(
  import.meta.glob(["../../data/content/*/language.json", "!../../data/content/cp-fx-*/**", "!../../data/content/site-*/**"], { query: "?z", import: "default" }) as Record<
    string,
    () => Promise<string>
  >,
);
const editionData = new Map<string, CompiledEdition>();
const languageData = new Map<string, CompiledLanguage>();
// the scores travel in each piece's own file, loaded when the piece opens (bundled into the app, they made it too large to publish)
const scores = zipped(
  import.meta.glob(["../../data/content/*/score.musicxml", "!../../data/content/cp-fx-*/**", "!../../data/content/site-*/**"], {
    query: "?z",
    import: "default",
  }) as Record<string, () => Promise<string>>,
);
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
    const ed = editions[`../../data/content/${id}/edition.json`]?.().then((e) => void editionData.set(id, e));
    const la = languages[`../../data/content/${id}/language.json`]?.().then((l) => void languageData.set(id, l));
    const load = scores[`../../data/content/${id}/score.musicxml`];
    const sc = (load ? load() : Promise.reject(new Error(`score ${id}: missing`))).then((t) => void scoreText.set(id, t));
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
          written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
      tempo: "Printed metronome marks: Andante lento ♩ = 40 (bar 2), Andante calmo ♩ = 54 (bar 15) and Allegretto moderato ♩ = 144 (bar 31). Chosen, as no number is printed: bar 1 ♩ = 48 (the Sostenendo largamente ♩ = 48 that ends “Che gelida manina” carried on, as nothing new is printed over Mimì’s “Si. Mi”); Lentamente (bar 26) ♩ = 40 (the printed Andante lento of bar 2, whose “Mi chiamano Mimì” it brings back); Andante molto sostenuto (bar 49) ♩ = 46 (the Andante calmo’s 54 held back by about a sixth); I° tempo, Andante agitando appena (bar 60) and I tempo, ma calmo (bar 66) ♩ = 54 (the Andante calmo, whose music returns). The free cadenza of bar 70 (senza rigore di tempo) keeps the beat. The written rall., rit. and allarg. are played as a gradual slowing over the bars they cover (affrett., string. and accel. as a quickening), then back to the tempo; fermatas are held",
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
          written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "puccini-chi-guardi": {
    portrait: "boheme:rodolfo",
    opera: "La bohème",
    kind: "Scene with chorus",
    facts: {
      key: "A♭ major (4 flats) for bars 1-13; F major (1 flat) for bars 14-17; G major (1 sharp) for bars 18-36; E major (4 sharps) for bars 37-54; F major (1 flat) for bars 55-77; D major (2 sharps) for bars 78-103; A major (3 sharps) from bar 104 (Tempo I) to the end",
      time: "3/4 for bars 1-17; 2/4 for bars 18-23; 6/8 for bars 24-36; 3/4 for bars 37-52, with a single bar of 4/4 (C) at 53 and 3/4 at 54; 2/4 for bars 55-98; 3/4 for bars 99-103; 2/4 from bar 104 to the end",
      tempo: "Printed metronome marks: Allegretto moderato ♩. = 76 (bar 24, 6/8), Andante mosso ♩ = 80 (bar 37) and Allegretto giocoso ♩ = 132 (bar 55). Chosen, as no number is printed: Lo stesso movimento ma sostenendo (bar 1, 3/4) ♩ = 104 (the crotchet of “Aranci, datteri!”, whose last tempo is ♩ = 112, kept and held back a little, as “Aranci” itself holds back its own “un poco sostenuto”); Moderato assai (bar 18, 2/4, Parpignol far off) ♩ = 84 (a moderate pace, slower than the café scene around it); Brillante (bar 44) ♩ = 88 (the Andante mosso’s 80 quickened by about a tenth); Poco meno (bar 46) ♩ = 80 (a tenth slower again); Più mosso (bar 78, the mothers) ♩ = 144 (a tenth faster than 132, to the nearest metronome mark); Molto sostenuto (bar 99, the crying boy, a piacere) ♩ = 72 (half the Più mosso’s beat); Tempo I (Allegretto giocoso, bar 104) ♩ = 132, the printed tempo of bar 55. The written rall., rit. and allarg. are played as a gradual slowing over the bars they cover, then back to the tempo; Rodolfo’s “senza rallentare” (bar 43) keeps the tempo; fermatas are held",
    },
    notePlaceholder: "At the Café Momus Rodolfo presents Mimì to his friends; Parpignol’s toy cart; the friends order supper",
    about: (
      <>
        <p>
          “Chi guardi?”, Act 2: Rodolfo, a little jealous, asks Mimì whom she is looking at. Marcello, Schaunard and Colline carry a table out of the
          Café Momus and shout for the waiter; far off, Parpignol the toy seller cries his wares. Rodolfo brings Mimì to the table and presents her in
          verse (“Questa è Mimì, gaia fioraia”); the friends laugh at his fine words and admit her in mock Latin. The children swarm round Parpignol’s
          cart while the friends order roast venison, a turkey, Rhine wine and lobster; the mothers scold the children, a boy cries for a trumpet, Mimì
          orders custard, and the children follow Parpignol away.
        </p>
        <p>
          Score: vocal score pages 100-110 (from figure (8), “Chi guardi?”, to the end of page 110, before figure (15), 119 bars), from Carlo
          Carignani’s piano reduction in the G. Ricordi &amp; C. vocal score, public domain. Written out from the printed pages: the sung lines and the
          piano each read independently, every disagreement settled on the page by a separate judge, then checked against the page and corrected. Only
          the Italian words are kept, with the print’s spellings (Mimì’s “crêma” with its circumflex). The chorus is heard with the piano and shown in
          the score, but it has no words to practise here. The print gives the girls and students, the children (in two parts from bar 63), the mothers
          and a crying boy their own staves where they sing, seven in all; here they are gathered into four staves by voice, sopranos (the girls in bar
          13, the mothers in bars 77-97), the students’ tenors and two children’s staves (the first also carrying the boy’s “Vo’ la tromba”, bars
          99-100), with each group named where it comes in. Every note and syllable is kept: groups sharing a staff never sing in the same bar, except the
          girls’ two soprano lines in bar 13, written as two voices. The printed metronome marks are the Allegretto moderato’s ♩. = 76, the Andante
          mosso’s ♩ = 80 and the Allegretto giocoso’s ♩ = 132; the other tempos are chosen as stated under Tempo.
        </p>
        <p>
          Music by Giacomo Puccini and text by Luigi Illica and Giuseppe Giacosa (1896), both public domain. The IPA, word meanings and translation were
          written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "puccini-signorina-mimi": {
    portrait: "boheme:marcello",
    opera: "La bohème",
    kind: "Scene with chorus",
    facts: {
      key: "A major (3 sharps) for bars 1-87; A flat major (4 flats) for bars 88-164 (from Musetta’s arrival); no sharps or flats from bar 165 (Un poco meno, “Tu non mi guardi!”) to the end",
      time: "2/4 for bars 1-84, with single bars of 3/4 at 7, 16, 32, 43, 68 and 70; 3/4 for bars 85-87; 9/8 for bars 88-164, with 3/4 at 119-120, 127-128 and 148-149; 3/4 for bars 165-171; 4/4 (C) from bar 172 to the end",
      tempo: "Printed metronome mark: Allegro moderato ♩. = 132 (bar 88, 9/8). Chosen, as no number is printed: bars 1-87 ♩ = 132, the I.º tempo (Allegretto giocoso ♩ = 132, printed on page 106 and restored on page 110) carried on, as figure (15) prints no new tempo; lusingando un poco (bar 55) and sostenendo un poco (bar 59) ♩ = 120, each until its printed a tempo (bars 57 and 61); Sostenendo appena (bar 117) ♩. = 126; ritenendo (bar 127) and ritenuto (bar 133) ♩. = 112, then a tempo (bar 128) ♩. = 126 and al tempo I.º (bar 134) ♩. = 132, the printed Allegro moderato; the 3/4 bars inside the 9/8 keep the bar’s length (♩ = ♩., the print sets them against 9/8 with the same bar lines); Un poco meno (bar 165, 3/4) ♩ = 120 (the 9/8 beat taken as the crotchet and held back a little); Sostenendo (bar 172, 4/4) ♩ = 112. The written rall., rit. and allarg. are played as a gradual slowing over the bars they cover (affrett., string. and accel. as a quickening), then back to the tempo; fermatas are held",
    },
    notePlaceholder: "At the Café Momus: Mimì shows off her bonnet; the toast; Musetta arrives with Alcindoro and tries to make Marcello look at her",
    about: (
      <>
        <p>
          “Signorina Mimì, che dono raro”, Act 2 at the Café Momus. Marcello asks what rare gift Rodolfo has given Mimì; she shows her pink bonnet,
          long wished for: he read what her heart was hiding. Schaunard and Colline mock the poet, Marcello sighs over the age of illusions, Mimì
          finds love sweeter than honey, Marcello says it depends on the palate, and Schaunard and Colline change the subject with a toast. Then
          Musetta sweeps in with old Alcindoro trailing behind her. Marcello paints her portrait (name Musetta, surname Temptation, a bird that feeds
          on hearts); she throws a plate, scolds the waiter and her escort, and plots to make Marcello give in: “Tu non mi guardi!”.
        </p>
        <p>
          Score: vocal score pages 111-129 (from figure (15), “Signorina Mimì”, to the end of page 129, 188 bars), from Carlo Carignani’s piano
          reduction in the G. Ricordi &amp; C. vocal score, public domain. Written out from the printed pages: the sung lines and the piano each read
          independently, every disagreement settled on the page by a separate judge, then checked against the page and corrected. Only the Italian
          words are kept, with the print’s spellings. Where the print sets a singer in 3/4 against 9/8 with the same bar lines (bars 119-120,
          127-128, 133-135 and 148-149), the line is written in the bar’s own metre with the same timing. The chorus is heard with the piano and
          shown in the score, but it has no words to practise here. The print gives the shopwomen two staves and the girls and the students one each;
          here they are gathered into two staves by voice, sopranos and tenors, with each group named where it comes in. Every note and syllable is
          kept: the two shopwomen’s lines, which answer each other and overlap in bars 95-96, are written as two voices (bars 95, 96 and 98). The
          printed metronome mark is the Allegro moderato’s ♩. = 132; the other tempos are chosen as stated under Tempo.
        </p>
        <p>
          Music by Giacomo Puccini and text by Luigi Illica and Giuseppe Giacosa (1896), both public domain. The IPA, word meanings and translation were
          written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "puccini-quando-men-vo": {
    portrait: "boheme:musetta",
    opera: "La bohème",
    kind: "Waltz and ensemble",
    facts: {
      key: "E major (4 sharps) throughout",
      time: "3/4, with a single bar of 4/4 (C) at 32 (Alcindoro’s “Quel canto scurrile”, in triplets)",
      tempo: "Printed metronome mark: Tempo di valzer lento ♩ = 104 (bar 1). Chosen, as no number is printed: sottolineando ritenendo (bar 17) ♩ = 96, until the a tempo of bar 19 (♩ = 104); appena animando (bar 49, piano, the ensemble begins) ♩ = 108 (the nearest metronome mark above the waltz); poco sostenuto (bar 57, figure 24) ♩ = 96 (about 7% held back, as Aranci’s Sostenendo un poco); a tempo (bar 65, “So ben, le angoscie tue”) ♩ = 104, the waltz’s tempo; sostenendo (bar 71, beat 2) ♩ = 92 (held back by about a tenth), a tempo (bar 73) ♩ = 104; un poco sostenendo (bar 74, figure 25) ♩ = 96, the pace “Ahi! qual dolore” takes up. The written rall., rit. and allarg. are played as a gradual slowing over the bars they cover (affrett., string., incalz. and accel. as a quickening), then back to the tempo; fermatas are held",
    },
    notePlaceholder: "Musetta sings her waltz at Marcello to win him back, while Alcindoro squirms and the others look on",
    about: (
      <>
        <p>
          “Quando me’n vo’”, Musetta’s waltz at the Café Momus, Act 2. Musetta sings, for Marcello to hear, how people stop and stare when she walks
          alone in the street, and how she savours the longing in their eyes; then she turns on him: she knows he is suffering and will not say so.
          Marcello asks his friends to tie him to his chair, Alcindoro frets about what people will say. Mimì sees that Musetta is in love with
          Marcello, and Rodolfo tells her their story; Schaunard is sure Marcello will give in, Colline prefers his pipe and a Greek text. As the
          waltz returns in full, Musetta declares she will do as she pleases and decides to get rid of the old man.
        </p>
        <p>
          Score: vocal score pages 130-140 (from figure (21), Tempo di valzer lento, page 130, to the end of page 140 system 1, 77 bars), from
          Carlo Carignani’s piano reduction in the G. Ricordi &amp; C. vocal score, public domain. Written out from the printed pages: the sung lines
          and the piano each read independently, every disagreement settled on the page by a separate judge, then checked against the page and
          corrected. Only the Italian words are kept, with the print’s spellings (“Cosi” without its accent, “angoscie”). The printed metronome mark
          is the Tempo di valzer lento’s ♩ = 104; the other tempos are chosen as stated under Tempo.
        </p>
        <p>
          Music by Giacomo Puccini and text by Luigi Illica and Giuseppe Giacosa (1896), both public domain. The IPA, word meanings and translation were
          written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "puccini-ahi-qual-dolore": {
    portrait: "boheme:musetta",
    opera: "La bohème",
    kind: "Scene",
    facts: {
      key: "E major (4 sharps) throughout",
      time: "3/4 throughout",
      tempo: "No metronome mark is printed in this passage. I.º tempo (bar 5) is the printed first tempo of Musetta’s waltz, Tempo di valzer lento ♩ = 104 (page 130). Chosen, as no number is printed: Musetta’s cry “strillando, quasi a piacere” (bar 1, the piano silent, col canto) and the piano’s a tempo (bar 3) ♩ = 96 (the waltz’s “un poco sostenendo” pace just before, as Aranci’s Sostenendo un poco); a tempo Sostenuto (bar 19, the waltz tune fff) ♩ = 92 (the I.º tempo held back by about a tenth, to the nearest metronome mark); Meno (bar 22) ♩ = 84 (about a tenth slower again); ancora più Lento (bar 27) ♩ = 76 (slower still, a tenth). The written rall., rit. and allarg. are played as a gradual slowing over the bars they cover (affrett., string. and accel. as a quickening), then back to the tempo; fermatas are held",
    },
    notePlaceholder: "Musetta fakes a pain in her foot and sends Alcindoro off for new shoes; she and Marcello fall into each other’s arms; the bill arrives",
    about: (
      <>
        <p>
          “Ahi! qual dolore”, the end of Musetta’s waltz scene at the Café Momus. Musetta cries out that her foot hurts and has Alcindoro unlace her
          shoe, then sends him running to the shoemaker for another pair. Marcello, overcome, sings that his youth is not dead and his heart would still
          open to her; Mimì and Rodolfo see that Musetta loves Marcello, Schaunard and Colline enjoy the comedy. Alcindoro hides the shoe in his
          waistcoat and runs off; Musetta and Marcello embrace (“Marcello!” “Sirena!”), and a waiter brings the bill.
        </p>
        <p>
          Score: vocal score pages 140-145 (from Musetta’s “Ahi! qual dolore”, page 140 system 2, to the bar before the Allegro alla marcia on page
          145, 29 bars), from Carlo Carignani’s piano reduction in the G. Ricordi &amp; C. vocal score, public domain. Written out from the printed
          pages: the sung lines and the piano each read independently, every disagreement settled on the page by a separate judge, then checked
          against the page and corrected. Only the Italian words are kept, with the print’s spellings. Musetta’s first “Ahi!” is printed with crossed
          noteheads, shouted. The offstage drums’ separate staff that begins on page 145 is left out. No metronome mark is printed here; the tempos
          are chosen as stated under Tempo.
        </p>
        <p>
          Music by Giacomo Puccini and text by Luigi Illica and Giuseppe Giacosa (1896), both public domain. The IPA, word meanings and translation were
          written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "puccini-caro": {
    portrait: "boheme:musetta",
    opera: "La bohème",
    kind: "Finale",
    facts: {
      key: "B♭ major (2 flats) throughout",
      time: "2/4, with a single bar of 3/4 at 125 (allargando e sostenendo, tutta forza)",
      tempo: "Printed metronome mark: Allegro alla marcia ♩ = 132 (bar 1), which holds to the last page (the print’s “ogni battuta di 2/4 equivale a un quarto di 3/4” only lines up the offstage drums with the bar before). Chosen, as no number is printed: the closing allarg. e sostenendo (bar 125) broadens over its bar to ♩ = 104 (about four-fifths of the march, to the nearest metronome mark) and holds there to the end, with the stent. of bar 128 slowing the last chords further. The written allarg. and stent. are played as a gradual slowing over the bars they cover; fermatas are held",
    },
    notePlaceholder: "The bill is steep and Schaunard’s money has gone; the military tattoo marches through; Musetta is carried off in triumph and Alcindoro is left to pay",
    about: (
      <>
        <p>
          “Caro!”, the end of Act 2 at the Café Momus. The friends look at the bill: it is steep, and Schaunard’s money has vanished. Far off the
          military tattoo is heard drawing nearer, and the children, girls, students and townsfolk run back and forth to see where it will come
          from. Musetta has the waiter add the friends’ bill to her own and leaves both at Alcindoro’s place: “the gentleman who was here with me
          pays”, and where he sat let him find her farewell. The drum major marches past; Musetta, with only one shoe, is lifted up by Marcello and
          Colline and carried off behind the band, the friends and the whole crowd following and cheering her. Alcindoro comes back with the new
          shoes, is handed the bill and falls into a chair.
        </p>
        <p>
          Score: vocal score pages 145-166 (from the Allegro alla marcia, page 145 system 2, to the end of Act 2, 129 bars), from Carlo Carignani’s
          piano reduction in the G. Ricordi &amp; C. vocal score, public domain. Written out from the printed pages: the sung lines and the piano each
          read independently, every disagreement settled on the page by a separate judge, then checked against the page and corrected. Only the
          Italian words are kept, with the print’s spellings (“danaro”, “biricchin”); Musetta’s “date a me-”, printed with a trailing hyphen as if
          cut off, is given as “me”. The chorus is heard with the piano and shown in the score, but it has no words to practise here. The print gives
          the children, the girls, the students, the townsfolk (sopranos and tenors), the sellers and the mothers and boys at the windows their own
          staves where they sing, eight groups in all; here they are gathered into four staves by voice, sopranos, children, tenors and basses, with
          each group named where it comes in. Every note and syllable is kept: where two groups on one staff sing at the same time (from bar 48 on,
          the girls and the townswomen, the students and the townsmen), the second is written as a second voice on the staff. The offstage drums’
          separate staff (pages 145-162) is left out. Mimì sings only the friends’ “Lesti!” (bars 87-88), on one staff with Musetta and Rodolfo.
          The printed metronome mark is the Allegro alla marcia’s ♩ = 132; the closing tempo is chosen as stated under Tempo.
        </p>
        <p>
          Music by Giacomo Puccini and text by Luigi Illica and Giuseppe Giacosa (1896), both public domain. The IPA, word meanings and translation were
          written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "puccini-ohe-la-le-guardie": {
    portrait: "boheme:musetta",
    opera: "La bohème",
    kind: "Prelude and scene with chorus",
    facts: {
      key: "1 flat (D minor colouring over a held D-A fifth) for bars 1-30 and 50-78; D major (2 sharps) for bars 31-49 and from bar 79 (the tavern song) to the end",
      time: "2/4 throughout, from a one-eighth upbeat",
      tempo: "Printed metronome mark: Andantino mosso ♩ = 112 (bar 1, the start of Act 3), which returns with the printed “a tempo” at figure (4) (bar 114) and holds to the end. Chosen, as no number is printed: Poco più mosso (bar 109, the men’s “Trallerallè” in the tavern) ♩ = 120, a little faster, to the nearest metronome mark. The written quasi rit., poco rall. and rall. are played as a gradual slowing over the bars they cover, then back to the tempo; the fermata (bar 144) is held",
    },
    notePlaceholder: "Dawn in the snow at the toll gate: street sweepers bang to be let in, Musetta sings in the tavern, milkmaids, carters and peasant women pass through",
    about: (
      <>
        <p>
          “Ohè, là, le guardie!”, the opening of Act 3 at the Barrière d’Enfer, a toll gate on the edge of Paris, at first light in February. Snow is
          falling; the customs men doze round a brazier. Behind the closed gate, street sweepers stamp and shout to be let in: they are the sweepers
          from Gentilly, and it is freezing. A customs officer goes to open for them. From the tavern by the gate come a drinking song, clinking glasses
          and laughter, and Musetta’s voice: if there is pleasure in the glass, there is love on young lips. The sergeant has the gate opened for the
          day: milk women come through calling good morning, carters crack their whips, and peasant women with baskets of butter, cheese, chickens and
          eggs pass the gate, agree to meet at noon and go their separate ways.
        </p>
        <p>
          Score: vocal score pages 167-176 (from the start of Act 3 to the end of page 176 system 3, before figure (6), 174 bars), from Carlo
          Carignani’s piano reduction in the G. Ricordi &amp; C. vocal score, public domain. Written out from the printed pages: the sung lines and the
          piano each read independently, every disagreement settled on the page by a separate judge, then checked against the page and corrected. Only
          the Italian words are kept, with the print’s spellings. The chorus is heard with the piano and shown in the score, but it has no words to
          practise here. The print gives the street sweepers, the women and the men singing in the tavern, the milk women, the carters and two groups of
          peasant women their own staves, eleven parts in all; here they are gathered into three staves by voice, sopranos and contraltos, tenors and
          basses, with each group named where it comes in. Every note is kept: parts printed in chords on one staff, or singing the same words in the
          same rhythm, are written as chords, and where the two groups of peasant women sing in the same bar the second is a second voice on the staff.
          The shouted notes, printed without noteheads, are written with x noteheads. The printed metronome mark is the Andantino mosso’s ♩ = 112; the
          Poco più mosso is chosen as stated under Tempo.
        </p>
        <p>
          Music by Giacomo Puccini and text by Luigi Illica and Giuseppe Giacosa (1896), both public domain. The IPA, word meanings and translation were
          written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "puccini-sa-dirmi": {
    portrait: "boheme:mimi",
    opera: "La bohème",
    kind: "Scene",
    facts: {
      key: "D major (2 sharps) for bars 1-3; F major (1 flat) from bar 4 (Lento molto) to the end",
      time: "2/4 throughout",
      tempo: "Printed: Andantino mosso ♩ = 112, the metronome mark at the start of Act 3 (page 167), which is the tempo of bars 1-3 and returns as “I.° Tempo” at bar 23; and Lento molto (bar 4) with the printed relation half note = quaver, the old bar becoming the new quaver: ♪ = 56, so ♩ = 28. Chosen, as no number is printed: Allegro (bar 9, a single loud chord and held rests) ♩ = 120; Andante (bar 10, Mimì a piacere, the piano following her) ♩ = 66, so that her quaver triplets move at the pace of anxious speech, and the same for the a tempo of bar 15. The written rall. and rit. are played as a gradual slowing over the bars they cover (the rall. of bars 1-3 into the Lento molto), then on to the next tempo; fermatas are held",
    },
    notePlaceholder: "Mimì, coughing, comes to the toll gate at dawn and asks for the tavern where Marcello paints; she sends a message that she is waiting",
    about: (
      <>
        <p>
          “Sa dirmi, scusi, qual’è l’osteria”, Act 3 at the Barrière d’Enfer, at dawn in February. Mimì comes in from the rue d’Enfer looking about
          her, and is stopped by a violent fit of coughing. She asks the customs sergeant for the tavern where a painter works, and he points it out.
          A serving woman comes out, and Mimì asks her to find the painter Marcello: she must speak to him, she is in a great hurry, he is to be told,
          quietly, that Mimì is waiting. At the gate the sergeant stops a passer-by’s basket, a customs officer finds it empty and lets him through;
          from the Hospice of Maria Theresa the bell rings for matins, and it becomes a grey winter day.
        </p>
        <p>
          Score: vocal score pages 176-179 (from figure (6), page 176 system 4, to the end of page 179 system 2, before Marcello’s “Mimì?!” at
          figure (8), 44 bars), from Carlo Carignani’s piano reduction in the G. Ricordi &amp; C. vocal score, public domain. Written out from the
          printed pages: the sung lines and the piano each read independently, every disagreement settled on the page by a separate judge, then
          checked against the page and corrected. Only the Italian words are kept, with the print’s spellings (“qual’è”). The sergeant’s “Ehi,” is
          printed without a notehead, shouted. The matins bell (“Campanelle”), printed under the piano’s right hand and from page 179 on a small
          staff of its own, is played in the piano’s right hand. The printed metronome mark is Act 3’s Andantino mosso ♩ = 112, with the printed
          relation that sets the Lento molto; the other tempos are chosen as stated under Tempo.
        </p>
        <p>
          Music by Giacomo Puccini and text by Luigi Illica and Giuseppe Giacosa (1896), both public domain. The IPA, word meanings and translation were
          written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "puccini-mimi-marcello": {
    portrait: "boheme:mimi",
    opera: "La bohème",
    kind: "Duet",
    facts: {
      key: "F major (1 flat) for bars 1-20; B♭ major (2 flats) from bar 21 (Andante, figure (9)); G major (1 sharp) from bar 75 (Andante mosso) to the end",
      time: "2/4 (bars 1-5), 3/4 (Moderato, bars 6-13), 3/8 (Vivo, bars 14-20), 3/4 (Andante, bars 21-74), 2/4 from bar 75 to the end",
      tempo: "Printed metronome mark: Andante ♩ = 48 at figure (9) (bar 21), which returns as “I.° Tempo” at bar 52 and, as “Andante mosso (lo stesso movimento)”, at bar 75. Bars 1-3 continue the previous scene’s Andantino mosso ♩ = 112, the metronome mark at the start of Act 3 (page 167). Chosen, as no number is printed: Allegro (bar 4, Marcello’s cry and Mimì’s quick reply) ♩ = 120, as in the previous scene; Moderato (bar 6, Marcello’s easy chatter) ♩ = 88; Vivo (bar 14, 3/8) one beat a bar at ♩. = 108, as Act 1’s Vivo; Sostenendo molto (bar 45, “Mi grida ad ogni istante”) ♩ = 40, to the I.° Tempo; Lento a piacere (bar 80, the piano col canto) ♩ = 40; Allegretto (bar 83, figure (14)) ♩ = 100, Act 1’s printed Allegretto come prima; Poco meno (bar 101) ♩ = 92, about a tenth slower. The written rall., rit., stent. and poco affrett. are played as a gradual change over the bars they cover, then back to the tempo",
    },
    notePlaceholder: "Marcello comes out of the tavern and finds Mimì; she tells him Rodolfo’s jealousy is killing their love and begs him to help them part",
    about: (
      <>
        <p>
          “Mimì?!”, Act 3 at the Barrière d’Enfer, on a grey winter morning. Marcello comes out of the tavern and is surprised to find Mimì: she was
          hoping to find him there. He and Musetta have lived at the tavern for a month at the innkeeper’s expense, she teaching the guests to sing
          and he painting soldiers on the front; it is cold, and he asks her in. Rodolfo is inside, so she cannot go in. In tears she tells him that
          Rodolfo loves her and runs from her, eaten up by jealousy: a step, a word, a trinket make him suspicious; at night he watches her while she
          pretends to sleep and tells her to find another lover. Marcello says that people like them should not live together, and she asks him to
          help them part. Rodolfo arrived an hour before dawn and fell asleep on a bench; he wakes and comes towards the door, and Marcello sends her
          home, but she hides near the tavern.
        </p>
        <p>
          Score: vocal score pages 179-191 (from Marcello’s entrance, page 179 system 3, across the Allegro at figure (8), to the end of page 191,
          before Rodolfo comes out, 113 bars), from Carlo Carignani’s piano reduction in the G. Ricordi &amp; C. vocal score, public domain. Written
          out from the printed pages: the sung lines and the piano each read independently, every disagreement settled on the page by a separate
          judge, then checked against the page and corrected. Only the Italian words are kept, with the print’s spellings (“lascjarci” with its j,
          “Perchè”, “passeggieri”). The instrumental line printed on its own staff above the piano on page 191 is played in the piano’s right hand.
          The printed metronome mark is the Andante’s ♩ = 48 at figure (9); the other tempos are chosen as stated under Tempo.
        </p>
        <p>
          Music by Giacomo Puccini and text by Luigi Illica and Giuseppe Giacosa (1896), both public domain. The IPA, word meanings and translation were
          written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "puccini-marcello-finalmente": {
    portrait: "boheme:rodolfo",
    opera: "La bohème",
    kind: "Duet",
    facts: {
      key: "D major (2 sharps) for bars 1-12; E major (4 sharps) from bar 13 (Allegro moderato, figure (16)); C major (no sharps or flats) from bar 58 (figure (19), “Mimì è una civetta”) to the end",
      time: "6/8 for bars 1-38 (from bar 28 Rodolfo’s line is printed in 2/4, bar for bar against the piano’s 6/8); 2/4 from bar 39 (“Se non ride e sfavilla”) to the end",
      tempo: "Printed metronome mark: Allegro moderato ♩. = 126 at figure (16) (bar 13). The 2/4 from bar 39 is its “a tempo”, taken bar for bar (♩ = ♩.), as Rodolfo’s own 2/4 bars already run against the piano’s 6/8 from bar 28: ♩ = 126. Chosen, as no number is printed: Moderato con moto (bar 1) ♩. = 100, about four fifths of the Allegro moderato; Rodolfo’s a piacere “Io voglio separarmi da Mimì” (bars 7-8, piano col canto) ♩. = 84, a tempo at bar 9; Meno (bar 35, “Dei pazzi è l’amor tetro”) ♩. = 112, a tenth slower; after the rall. of bars 80-81 no a tempo is printed until bar 92, so bars 82-91 (Rodolfo’s a piacere “Ebbene no, non lo son” and the Sostenendo at figure (20), “Invan, invan nascondo”) stay at ♩ = 100, a tempo ♩ = 126 at bar 92. The written string., allarg., rit., rall., poco allarg. and accel. are played as a gradual change over the bars they cover, then back to the tempo",
    },
    notePlaceholder: "Rodolfo tells Marcello he wants to leave Mimì, calls her a flirt, then admits he loves her and is afraid, while she listens hidden",
    about: (
      <>
        <p>
          “Marcello. Finalmente!”, Act 3 at the Barrière d’Enfer, on a grey winter morning. Rodolfo comes out of the tavern and runs to Marcello:
          nobody can hear them, and he wants to leave Mimì. Once before he thought his heart was dead, and her blue eyes brought it back to life;
          now it is weary again. Marcello tells him that a gloomy love that makes people cry is for madmen, and calls him jealous, hot-tempered,
          moody, stubborn. Mimì, who had hidden behind a plane tree, overhears them. Rodolfo says Mimì is a flirt who plays up to every man, and
          that a little viscount is making eyes at her. Marcello does not believe him, and Rodolfo gives in: he loves Mimì more than anything in
          the world, but he is afraid.
        </p>
        <p>
          Score: vocal score pages 192-198 (from Rodolfo’s entrance at the top of page 192, Moderato con moto, to page 198 without its last bar,
          which holds Rodolfo’s upbeat to “Mimì è tanto malata!”, 112 bars), from Carlo Carignani’s piano reduction in the G. Ricordi &amp; C.
          vocal score, public domain. Written out from the printed pages: the sung lines and the piano each read independently, every
          disagreement settled on the page by a separate judge, then checked against the page and corrected. Only the Italian words are kept,
          with the print’s spellings (“volubil”, “sgonnella”, “lusinghier”, “sincer”). Rodolfo’s bars printed in 2/4 against the piano’s 6/8
          (bars 28-38) are written into the 6/8 bars. The printed metronome mark is the Allegro moderato’s ♩. = 126 at figure (16); the other
          tempos are chosen as stated under Tempo.
        </p>
        <p>
          Music by Giacomo Puccini and text by Luigi Illica and Giuseppe Giacosa (1896), both public domain. The IPA, word meanings and translation were
          written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "puccini-mimi-e-tanto-malata": {
    portrait: "boheme:rodolfo",
    opera: "La bohème",
    kind: "Scene",
    facts: {
      key: "C major (no sharps or flats) for bar 1, Rodolfo’s upbeat; F minor (4 flats) from bar 2 (Lento triste, figure (21)); F major (1 flat) from bar 36 (a tempo Sostenendo); G major (1 sharp) from bar 52 (Allegretto mosso, figure (25), Musetta’s laughter) to the end",
      time: "2/4 for bars 1-23; 3/4 for bars 24-28; 2/4 for bars 29-42; 4/8 for bars 43-47 (“Facile alla paura”); 3/4 for bars 48-51 (figure (24)); 9/8 from bar 52 to the end (the piano’s bars 54-55 are printed in 3/4, its crotchet against the voice’s dotted crotchet)",
      tempo: "Printed metronome marks: Lento triste ♩ = 48 at figure (21) (bar 2) and Sostenuto molto ♩ = 40 (bar 8, “Una terribil tosse”); the a tempo bars that follow, from figure (22), return to ♩ = 40. Printed relations: Lo stesso movimento at the 4/8 (bar 43), bar for bar, ♩ = 48; Lo stesso movimento ♪ = ♩ at the 3/4 (bar 48, figure (24)), the old quaver becoming the new crotchet, ♩ = 96. Bar 1, Rodolfo’s upbeat, continues the previous scene’s rall. at ♩ = 100. Chosen, as no number is printed: I tempo ma agitando un poco (bar 29, figure (23)) ♩ = 52, the Lento triste a little quicker; the rall. of bars 33-35 held at ♩ = 42 to the fermatas; a tempo Sostenendo (bar 36) ♩ = 48, the Lento triste; Allegretto mosso (bar 52, figure (25), 9/8) ♩. = 96, the crotchet of the 3/4 before it. The written allarg., rit., rall., poco rall., affrett. and rall. molto are played as a gradual change over the bars they cover, then back to the tempo; fermatas are held",
    },
    notePlaceholder: "Rodolfo tells Marcello that Mimì is dying and he is too poor to save her; Mimì, hidden, hears it, and her coughing gives her away",
    about: (
      <>
        <p>
          “Mimì è tanto malata!”, Act 3 at the Barrière d’Enfer, on a grey winter morning. Having admitted that he loves Mimì and is afraid, Rodolfo
          tells Marcello why: Mimì is gravely ill and weaker every day. A terrible cough shakes her, and her pale cheeks are flushed. His room is a
          cold den where the fire has gone out and the north wind blows through; she sings and smiles, and he is eaten by remorse, the cause of the
          illness that is killing her. She is a hothouse flower, withered by poverty, and love is not enough to bring her back to life. Mimì,
          hidden behind the trees, hears that she is dying; her sobs and coughing give her away, and Rodolfo runs to her, says he was frightened
          over nothing and tries to take her into the warm tavern, but the stale air would stifle her. Musetta’s laughter is heard from inside;
          Marcello runs in to find out who she is laughing with, and Mimì says goodbye.
        </p>
        <p>
          Score: vocal score pages 198-205 (from the last bar of page 198, Rodolfo’s upbeat “Mi-” (tristamente), to the end of page 205, before
          figure (26), 60 bars), from Carlo Carignani’s piano reduction in the G. Ricordi &amp; C. vocal score, public domain. Written out from the
          printed pages: the sung lines and the piano each read independently, every disagreement settled on the page by a separate judge, then
          checked against the page and corrected. Only the Italian words are kept, with the print’s spellings (“terribil”, “cagion”, “tepor”,
          “Chè?!”, “m’ássale”). Marcello’s “Ah la civetta! Imparerai.” is marked parlato but printed with pitches, and is sung here. The piano’s
          bars 54-55, printed in 3/4 against the singers’ 9/8, are written into the 9/8 bars. The printed metronome marks are the Lento triste’s
          ♩ = 48 and the Sostenuto molto’s ♩ = 40, with the printed Lo stesso movimento relations; the other tempos are chosen as stated under Tempo.
        </p>
        <p>
          Music by Giacomo Puccini and text by Luigi Illica and Giuseppe Giacosa (1896), both public domain. The IPA, word meanings and translation were
          written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "puccini-donde-lieta-usci": {
    portrait: "boheme:mimi",
    opera: "La bohème",
    kind: "Aria",
    facts: {
      key: "D-flat major (5 flats) from figure (26); A major (3 sharps) from bar 29 (“Bada… sotto il guanciale”); D-flat major again from bar 34 (“serbarla a ricordo d’amor”) to the end",
      time: "2/4 for bars 1-6; 3/4 for bars 7-12 (Andantino); 2/4 for bars 13-15; 4/4 from bar 16 (figure (27)), with 3/4 in bars 19-20 and 5/4 in bars 22-23 (“quel cerchietto d’or, e il libro di preghiere”), 4/4 again from bar 24 to the end",
      tempo: "Printed metronome marks: Lento molto ♪ = 66 at figure (26) (♩ = 33) and Andantino mosso ♩ = 84 at figure (27) (bar 16, “Ascolta, ascolta”); the a tempo bars after it, including figure (29) in the last bar, return to ♩ = 84. Chosen, as no number is printed: Andantino espressivo (bar 7) ♩ = 58, the score’s own printed Andantino (♩ = 56-58) with nothing to make it quicker; Lento (bar 14, “Addio, senza rancor”) ♩ = 40, a little quicker than the Lento molto; Mimì’s ritenuto on “Ascolta, a-” and the broadening of bars 33-36 (stent., poco allarg., rit.) held at ♩ = 67 until the a tempo. The written poco rit., rall., molto rit. and animando are played as a gradual change over the bars they cover, then back to the tempo; fermatas are held",
    },
    notePlaceholder: "Mimì says goodbye without bitterness, asks Rodolfo to gather her few things for the porter, and leaves him her pink bonnet",
    about: (
      <>
        <p>
          “Donde lieta uscì”, Act 3 at the Barrière d’Enfer. Mimì has overheard Rodolfo say that she is dying and that he is too poor to
          save her; Marcello has run back into the tavern. Rodolfo asks “Vai?”, and she answers with her farewell: she will go back
          alone to the little room she left so happily when he called her, and make her artificial flowers again. She says goodbye
          without bitterness and asks him to gather her few things, the little gold ring and the prayer book in her drawer, into an
          apron, and she will send the porter for them. Under the pillow is her pink bonnet: if he likes, he may keep it to remember
          their love.
        </p>
        <p>
          Score: vocal score pages 206-209 (from figure (26), Lento molto, to the bar of figure (29) on page 209, 39 bars), from Carlo
          Carignani’s piano reduction in the G. Ricordi &amp; C. vocal score, public domain. Written out from the printed pages: the
          sung lines and the piano each read independently, every disagreement settled on the page by a separate judge, then
          checked against the page and corrected. Only the Italian words are kept, with the print’s spellings (“intesser”, “fior”,
          “rancor”). The last bar is also the first bar of the next piece: it holds Mimì’s last syllable, and Rodolfo’s “Dunque è
          proprio fi-”, which is sung as the start of “Dunque è proprio finita!” and is not part of this piece’s words. Rodolfo’s
          part, printed in the treble clef, is written at sounding pitch. The printed metronome marks are the Lento molto’s ♪ = 66
          and the Andantino mosso’s ♩ = 84; the other tempos are chosen as stated under Tempo.
        </p>
        <p>
          Music by Giacomo Puccini and text by Luigi Illica and Giuseppe Giacosa (1896), both public domain. The IPA, word meanings and translation were
          written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "puccini-addio-dolce-svegliare": {
    portrait: "boheme:mimi",
    opera: "La bohème",
    kind: "Quartet",
    facts: {
      key: "D-flat major (5 flats) for bars 1-5, from figure (29); G-flat major (6 flats) from bar 6 (figure (30), “Addio dolce svegliare”) to the end of the act",
      time: "4/4 for bars 1-3; 3/4 from bar 4 to the end",
      tempo: "Printed metronome mark: Andante con moto ♩ = 92 at figure (30) (bar 6); the a tempo bars after it return to ♩ = 92. The first bar (figure (29), a tempo) is the last bar of “Donde lieta uscì” and keeps its Andantino mosso, ♩ = 84. Chosen, as no number is printed: Più lento (bar 66, “Sempre tua per la vita”) ♩ = 76, about a fifth slower, a section heading that holds to the end of the act; the piano’s Sostenendo after figure (35) (bar 81) ♩ = 69, a tenth slower again; the piano’s ritenuto molto (bars 35-36) held at ♩ = 63 until the a tempo. The written poco rit., rit., rall., allarg. and affrett. are played as a gradual change over the bars they cover, then back to the tempo; fermatas are held",
    },
    notePlaceholder: "Mimì and Rodolfo say goodbye to their life together and agree to part only when spring comes, while Marcello and Musetta quarrel and part in a fury",
    about: (
      <>
        <p>
          “Dunque è proprio finita!… Addio dolce svegliare”, the end of Act 3 at the Barrière d’Enfer. Rodolfo answers Mimì’s farewell:
          so it is really over. Together they say goodbye to waking up side by side, to the quarrels and jealousy, to the kisses he
          turned into rhymes; but being alone in winter is unbearable, and in spring the sun keeps everyone company, so they agree to
          stay together until the flowers come. Meanwhile Marcello catches Musetta flirting with a stranger in the tavern; their row
          spills out into the snow, ends in shouted insults, and Musetta storms off. Mimì and Rodolfo walk away together, singing,
          from offstage, that they will part when the flowers return, as the curtain falls.
        </p>
        <p>
          Score: vocal score pages 209-222 (from the bar of figure (29), page 209 system 3 bar 2, to the end of Act 3, 86 bars), from
          Carlo Carignani’s piano reduction in the G. Ricordi &amp; C. vocal score, public domain. Written out from the printed
          pages: the sung lines and the piano each read independently, every disagreement settled on the page by a separate judge,
          then checked against the page and corrected. Only the Italian words are kept, with the print’s spellings (“Niuno”,
          “lascieremo” beside “lascerem”, “Fo’all’amor”, “vò”). The first bar is also the last bar of the previous piece: it holds
          Mimì’s last syllable of “senza rancor”, which is not part of this piece’s words, and Rodolfo’s first words. Musetta’s and
          Marcello’s shouted insults are printed without noteheads and are written with cross noteheads. Rodolfo’s part, printed in
          the treble clef, is written at sounding pitch. The printed metronome mark is the Andante con moto’s ♩ = 92; the other
          tempos are chosen as stated under Tempo.
        </p>
        <p>
          Music by Giacomo Puccini and text by Luigi Illica and Giuseppe Giacosa (1896), both public domain. The IPA, word meanings and translation were
          written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "puccini-in-un-coupe": {
    portrait: "boheme:rodolfo",
    opera: "La bohème",
    kind: "Scene",
    facts: {
      key: "No key signature (no sharps or flats) from the start of Act 4 to the end of the scene; the keys are written with accidentals",
      time: "3/8 for bars 1-26 (Allegro vivo, one beat a bar); 9/8 for bars 27-36 (“Non batte o non lo sento”; the piano’s right hand in bars 29-30 is printed in 3/4, Musetta’s waltz against the 9/8); 3/8 for bars 37-54; 2/4 from bar 55 (“Era in carrozza”) to the end",
      tempo: "Printed metronome mark: Allegro vivo ♩. = 108 at the start of the act. Printed relations: Lo stesso movimento at the 9/8 (bar 27) and at the 2/4 (bar 55); the quaver stays the same through both, so the 9/8 keeps ♩. = 108 and the 2/4 runs at ♩ = 162 (the reading that fits the recordings: taking the 2/4’s crotchet at 108 would make the scene longer than Toscanini’s, Leinsdorf’s and Solti’s performances before the Andantino is even reached). Chosen, as no number is printed: the a piacere of “Che penna infame!” and “Che infame pennello!” (bars 74-75) ♩ = 108; Sostenuto (bar 76) and Andantino (bar 77) ♩ = 60, timed from six complete recordings (median 1:22) and below the Andantino mosso ♩ = 84 that follows; the closing rall. (bar 81) held at ♩ = 48 to the end. Fermatas are held",
    },
    notePlaceholder: "Back in the garret, Rodolfo and Marcello pretend to work and to have forgotten Musetta and Mimì, and each sees through the other",
    about: (
      <>
        <p>
          “In un coupè?”, the start of Act 4, months later, back in the garret. Marcello is at his easel and Rodolfo at his table, both
          pretending to work. Rodolfo has seen Musetta riding in a carriage with a pair of horses and footmen in livery; he asked her
          about her heart, and she laughed that she could not feel it beating under all that velvet. Marcello says he is delighted,
          but Rodolfo can see him gnawing at himself while he laughs. Marcello answers in kind: he has seen Mimì in a carriage, dressed
          like a queen; Rodolfo says he is glad of it, and Marcello knows he is lying. They go back to work, give up, throw down pen
          and brush, and Marcello secretly takes a silk ribbon from his pocket and kisses it.
        </p>
        <p>
          Score: vocal score pages 223-227 (from the start of the Quadro quarto to the double bar at the end of page 227, 85 bars),
          from Carlo Carignani’s piano reduction in the G. Ricordi &amp; C. vocal score, public domain. Written out from the printed
          pages: the sung lines and the piano each read independently, every disagreement settled on the page by a separate judge,
          then checked against the page and corrected. Only the Italian words are kept, with the print’s spellings (“coupè”, “Tò”,
          “davver”, “Lavoriam”). Rodolfo’s part, printed in the treble clef, is written at sounding pitch. The piano’s right hand in
          bars 29-30, printed in 3/4 inside the 9/8 bars, is written as duplets. The printed metronome mark is the Allegro vivo’s
          ♩. = 108; the other tempos are chosen as stated under Tempo.
        </p>
        <p>
          Music by Giacomo Puccini and text by Luigi Illica and Giuseppe Giacosa (1896), both public domain. The IPA, word meanings and translation were
          written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "puccini-o-mimi-tu-piu-non-torni": {
    portrait: "boheme:rodolfo",
    opera: "La bohème",
    kind: "Duet",
    facts: {
      key: "No key signature (no sharps or flats) throughout; the keys are written with accidentals",
      time: "4/4 (common time) for bars 1-8; one bar of 2/4 (bar 9, “gioventù!”); 4/4 from figure (3) (bar 10) to the end",
      tempo: "Printed metronome mark: Andantino mosso ♩ = 84 (bar 1); the a tempo bars (bars 16, 17, 19 and 21) and the piano’s calm close (bar 26) return to it. Chosen, as no number is printed: Sostenendo (bar 12, “egli mi traccia”) ♩ = 76, a tenth slower; poco allarg. (bar 14) held at ♩ = 70; molto sost. (bar 18, “E… tu, cuffietta lieve”) ♩ = 60; the trattenuto of bar 20 held at ♩ = 60 until the a tempo; the cres. e affrettando of bars 21-23 rises to ♩ = 94 and is kept there through the printed “senza rall.” until the rall. of bar 25, which broadens from ♩ = 76; the closing rall. molto starts at ♩ = 68 and ends near 46. The written appena rall., poco rall., rall. molto, poco allarg., stent. and the closing rall. molto are played as a gradual change over the bars they cover, then back to the tempo; fermatas are held. Performances take this duet much more broadly (about 2½-3¼ min in four complete recordings against 1½ min at the printed tempo)",
    },
    notePlaceholder: "Rodolfo and Marcello each try to work, and each, to himself, mourns the woman he has lost: Rodolfo over Mimì’s bonnet, Marcello over a painting that keeps turning into Musetta",
    about: (
      <>
        <p>
          “O Mimì tu più non torni”, Act 4 in the garret, straight after “In un coupè?”. The two friends have given up pretending to work,
          and each sings to himself. Rodolfo thinks of Mimì, who will not come back: the happy days, her little hands, her scented hair,
          her snow-white neck, his youth that went by so fast. Marcello cannot understand why his brush, whatever he sets out to paint,
          skies or fields, winter or spring, keeps drawing two dark eyes and a teasing mouth: Musetta’s face, all charm and all deceit,
          while she enjoys herself and his weak heart still calls for her. Rodolfo takes from the drawer the pink bonnet Mimì left under
          the pillow when she went, the keeper of their happiness, and presses it to his heart, since their love is dead.
        </p>
        <p>
          Score: vocal score pages 228-231 (from the double bar at the top of page 228 to the end of system 2 on page 231, 29 bars),
          from Carlo Carignani’s piano reduction in the G. Ricordi &amp; C. vocal score, public domain. Written out from the printed
          pages: the sung lines and the piano each read independently, every disagreement settled on the page by a separate judge,
          then checked against the page and corrected. Only the Italian words are kept, with the print’s spellings (“guancial”,
          “poichè”, “ancor”) and the brackets in which the whole duet is printed. Rodolfo’s part, printed in the treble clef, is
          written at sounding pitch. The printed metronome mark is the Andantino mosso’s ♩ = 84; the other tempos are chosen as stated
          under Tempo.
        </p>
        <p>
          Music by Giacomo Puccini and text by Luigi Illica and Giuseppe Giacosa (1896), both public domain. The IPA, word meanings and translation were
          written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "puccini-vecchia-zimarra": {
    portrait: "boheme:colline",
    opera: "La bohème",
    kind: "Aria",
    facts: {
      key: "C-sharp minor (4 sharps) from figure (19) to bar 36; A major (3 sharps) for the Andantino, bars 37-42 (Schaunard’s “Filosofo, ragioni!”); G major (1 sharp) from figure (20) (bar 43) to the end",
      time: "2/4 for bars 1-36; 3/4 for bars 37-42 (Andantino); 6/8 from figure (20) (bar 43) to the end",
      tempo: "Printed metronome mark: Allegretto moderato e triste ♩ = 63 at figure (19); the a tempo bars return to it. Chosen, as no number is printed: Meno (bar 28, “Schaunard, ognuno per diversa via”) ♩ = 56, a tenth slower, to the nearest metronome mark; Andantino (bar 37) ♩ = 56, the score’s own printed Andantino; Andantino mosso at figure (20) (bar 43, Calmo, the piano alone) ♩. = 56, the Andantino’s beat carried over as the 6/8 beat (checked against recordings); the rall. of bar 18 held at ♩ = 50 until the a tempo at bar 23. The written poco rit., rall., molto rit. and affrett. are played as a gradual change over the bars they cover, then back to the tempo; fermatas are held",
    },
    notePlaceholder: "Colline says goodbye to the old coat he is about to pawn for Mimì, then takes Schaunard away to leave her alone with Rodolfo",
    about: (
      <>
        <p>
          “Vecchia zimarra”, Act 4 in the garret. Mimì is lying on the bed, dying; Musetta and Marcello have gone to sell her earrings
          for medicine and a muff. Colline takes off his old greatcoat: it must go up the “sacred mount”, the pawnshop, while he stays
          below. He thanks it for never bowing its threadbare back to the rich and powerful, and for the philosophers and poets that
          have passed through its pockets, and says goodbye to it as to a faithful friend. Then he tells Schaunard that each of them
          will do a kind deed: he will pawn the coat, and Schaunard will leave the two alone. Schaunard agrees and follows him out,
          and the piano plays on alone as Mimì and Rodolfo are left together.
        </p>
        <p>
          Score: vocal score pages 258-261 (from figure (19) to page 261 system 3 bar 2, the bar before figure (21), 59 bars), from
          Carlo Carignani’s piano reduction in the G. Ricordi &amp; C. vocal score, public domain. Written out from the printed pages:
          the sung lines and the piano each read independently, every disagreement settled on the page by a separate judge, then
          checked against the page and corrected. Only the Italian words are kept, with the print’s spellings and punctuation. The
          printed metronome mark is the Allegretto moderato e triste’s ♩ = 63; the other tempos are chosen as stated under Tempo.
        </p>
        <p>
          Music by Giacomo Puccini and text by Luigi Illica and Giuseppe Giacosa (1896), both public domain. The IPA, word meanings and translation were
          written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "puccini-che-ora-sia": {
    portrait: "boheme:schaunard",
    opera: "La bohème",
    kind: "Scene",
    facts: {
      key: "No key signature for bars 1-15; E major (4 sharps) from bar 16 to bar 79; no key signature (C major) from bar 80 (“Porgimi il nappo!”); A major (3 sharps) from figure (10) (bar 118, the dances); D major (2 sharps) from bar 131 (the quadrille); four flats from figure (12) (bar 170) to the end",
      time: "4/4 for the first two bars (the duet’s last chord); 2/4 for bar 3; 6/8 from figure (5) (bar 4), with 2/4 stretches in bars 41-43 and 46-73; 6/8 again in bars 74-79; 2/4 from bar 80; 3/8 for the Fandango (bars 125-130); 6/8 for the quadrille (bars 131-144); 2/4 for the duel from figure (11), with 4/8 in bars 156-163 (“one bar is worth two of the previous ones”); 2/4 from bar 164 to the end",
      tempo: "Printed metronome marks: Allegro ♩. = 126 at figure (5) (bar 4), Allegretto mosso ♩ = 120 at figure (10) (bar 118), Allegro ♩. = 72 (bar 125, 3/8) and Allegro spigliato ♩ = 132 at figure (12) (bar 170). Printed relations: Lo stesso movimento at the quadrille keeps ♩. = 72; in the 4/8 bars of the duel one bar lasts as long as two of the 2/4 bars before (♩ = 63); Come prima returns to the duel’s Allegro. The 2/4 bars inside the Allegro keep its beat (♩ = 126): the 6/8’s quavers come back as triplets, and the recordings fit it. Chosen, as no number is printed: the duet’s last chord ♩ = 57 (where the duet’s closing rall. molto has arrived), mosso ♩ = 92 and the a tempo of bar 3 ♩ = 84; the Allegro of bars 82 and 145 ♩ = 126, as at figure (5); Vivo at figure (9) ♩ = 138; Andantino mosso (bar 108) ♩ = 84, the score’s printed Andantino mosso; the Sostenendo bars a tenth slower (♩ = 112; ♩. = 66 in the quadrille); Schaunard’s and Colline’s a piacere bars at two-thirds of the running tempo. The written rit., rall. and affrettando are played as a gradual change over the bars they cover; the affrettando into figure (12) and the closing incalzando keep their quicker tempo to the next section. Timed against eight complete recordings (about 4 min); fermatas are held",
    },
    notePlaceholder: "The four friends dine on four rolls and a herring as if at a banquet, dance, and fight a mock duel with the fire shovel and tongs until the door bursts open",
    about: (
      <>
        <p>
          “Che ora sia?”, Act 4 in the garret. Rodolfo, hiding his feelings, asks the time: the hour of yesterday’s dinner, says
          Marcello. Schaunard and Colline come in with four rolls and a salted herring, and the four sit down as if to a feast fit for
          Carnival, with a bottle of water in Colline’s hat as champagne on ice, offering one another trout, salmon and parrot’s tongue.
          Colline has no time to stay: the King has summoned him to the ministry. Schaunard climbs on a chair to make a speech and is
          shouted down; a ballet, then, with singing. They push the table aside and call out dances, gavotte, minuet, pavane,
          fandango, and settle on a quadrille. Rodolfo and Marcello dance it as gentleman and lady while Schaunard takes offence and
          he and Colline fight a duel with the fire shovel and tongs, and the other two dance round them, until the door bursts open.
        </p>
        <p>
          Score: vocal score pages 231-247 (from Rodolfo’s “Che ora sia?” over the last chord of the duet, page 231 system 3, to the
          bar where the door bursts open, page 247 system 3 bar 3, 200 bars), from Carlo Carignani’s piano reduction in the G. Ricordi
          &amp; C. vocal score, public domain. Written out from the printed pages: the sung lines and the piano each read independently,
          every disagreement settled on the page by a separate judge, then checked against the page and corrected. Only the Italian
          words are kept, with the print’s spellings (“Sciampagna”, “m’inpingua”, “minister”, “cimiter”). Rodolfo’s part, printed in
          the treble clef, is written at sounding pitch. Marcello’s “La prego.”, Colline’s “Balancez!” and Schaunard’s “Assaggia.”
          are spoken, printed with stems but no noteheads, and are written with cross noteheads. The printed metronome marks are
          the Allegro’s ♩. = 126, the Allegretto mosso’s ♩ = 120, the 3/8 Allegro’s ♩. = 72 and the Allegro spigliato’s ♩ = 132;
          the other tempos are chosen as stated under Tempo.
        </p>
        <p>
          Music by Giacomo Puccini and text by Luigi Illica and Giuseppe Giacosa (1896), both public domain. The IPA, word meanings and translation were
          written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "puccini-musetta": {
    portrait: "boheme:musetta",
    opera: "La bohème",
    kind: "Scene",
    facts: {
      key: "Four flats for the first bar (the end of the previous scene, as the door bursts open); no key signature (C major) from bar 2 (Allegro moderato agitato, “C’è Mimì”) to bar 40; two sharps from figure (14) (bar 41, Andante mesto, Musetta’s story) to bar 63; one sharp from figure (16) (bar 64, Lento) to bar 82; no key signature from bar 83 (Andante, “è assai buona Musetta”) to the end",
      time: "2/4 for bars 1-40; 4/4 from figure (14) (bar 41), with one bar of 2/4 (bar 46); 2/4 from figure (16) (bar 64); 3/4 from figure (17) (bar 81) to the end",
      tempo: "No metronome mark is printed in this scene, so every value is chosen. The first bar keeps the previous scene’s closing tempo (♩ = 148). Allegro moderato agitato (bar 2) ♩ = 104; Meno molto (bar 13) ♩ = 72, about two-thirds of it; Andante mesto at figure (14) ♩ = 60, a sad Andante below the score’s printed Andante moderato (♩ = 88); the piano’s “a tempo, ma sostenendo” (bar 50) ♩ = 54, a tenth slower; Lento at figure (16) ♩ = 48, the score’s printed Lento triste of Act 3; Allegretto mosso at figure (17) and bar 87 ♩ = 120, the score’s printed Allegretto mosso of this act (figure (10)); Andante (bar 83) ♩ = 60. The allarg. and rall. molto of bars 33-40 are played over all the bars they cover, the poco rall. and poco rit. of bars 92-93 and 99-100 are held at ♩ = 108 until the a tempo, and the other written rall., rit., allarg., affrett. and string. are played as a gradual change, then back to the tempo; fermatas are held. Timed against seven complete recordings (about 5½ min, with the pauses and the broadening that the map does not play)",
    },
    notePlaceholder: "Musetta brings in the dying Mimì; there is nothing in the house, and Musetta gives Marcello her earrings to sell for medicine and a doctor and goes to buy Mimì a muff",
    about: (
      <>
        <p>
          “Musetta!”, Act 4 in the garret. The door bursts open on the friends’ mock duel and Musetta comes in: Mimì is with her, too ill
          to climb the last stairs. They bring her in and lay her on the bed. Musetta tells the others how she heard that Mimì had left
          her viscount and was dying, and found her dragging herself along the street, saying she wanted to die near Rodolfo. Mimì feels
          better here, and Rodolfo is overjoyed to hear her voice. There is nothing in the house, no coffee, no wine, and Schaunard
          whispers to Colline that she will be dead within half an hour. Mimì’s hands are cold and she wishes for a muff; she greets
          the friends one by one and tells Marcello that Musetta is good. Musetta takes off her earrings for Marcello to sell for a
          cordial and a doctor, and goes with him to buy the muff herself: it may be the last thing Mimì ever asks for.
        </p>
        <p>
          Score: vocal score pages 247-257 (from Marcello’s “Mu-” as Musetta appears in the doorway, page 247 system 3 bar 4, to the
          last bar of page 257, 107 bars), from Carlo Carignani’s piano reduction in the G. Ricordi &amp; C. vocal score, public domain.
          Written out from the printed pages: the sung lines and the piano each read independently, every disagreement settled on the
          page by a separate judge, then checked against the page and corrected. Only the Italian words are kept, with the print’s
          spellings (“Viscontino”, “veggo”, “cordial”, “Pel”). The first bar is the last bar of the previous scene’s music, before the
          double bar. Rodolfo’s part, printed in the treble clef, is written at sounding pitch. Marcello’s “Sst”, printed with a stem
          but no notehead, is written with a cross notehead. No metronome mark is printed in this scene; the tempos are chosen as
          stated under Tempo.
        </p>
        <p>
          Music by Giacomo Puccini and text by Luigi Illica and Giuseppe Giacosa (1896), both public domain. The IPA, word meanings and translation were
          written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "puccini-sono-andati": {
    portrait: "boheme:mimi",
    opera: "La bohème",
    kind: "Duet",
    facts: {
      key: "No key signature for bars 1-4 (figure (21), leading into E-flat); E-flat major (3 flats) from bar 5 (“Sono andati?”) to bar 57; B-flat major (2 flats) from figure (24) (bar 58, “Te lo rammenti”) to the end",
      time: "4/4 for bars 1-22; 2/4 from bar 23 (“Lo stesso movimento”) to the end",
      tempo: "Printed metronome mark: Allegretto un po’ sostenuto ♩ = 108 at figure (24) (bar 58); the a tempo bars after it return to ♩ = 108. Chosen, as no number is printed: Più sostenuto at figure (21) ♩ = 50, a tenth under the previous piece’s Andantino mosso beat; Andante calmo (bar 5) ♩ = 54, the score’s own printed Andante calmo (Act 1, “Mi chiamano Mimì”); Lo stesso movimento (bar 23) keeps that beat, ♩ = 54; Più sostenuto (bar 30, “Mi chiamano Mimì”) ♩ = 48, a tenth slower; Allegretto mosso (bar 41) ♩ = 120, a tenth quicker than the Allegretto un po’ sostenuto that follows; Andantino affettuoso (bar 101) ♩ = 58, the printed mark of the same heading over the same music in “Che gelida manina”. The sostenendo of bars 17-22 is held at ♩ = 49 after its poco rit., the rall. of bars 88-90 at ♩ = 78 and the rall. of bars 96-100 at ♩ = 86 until the next tempo. The written poco rit., rit., rall., rall. molto and accelerando are played as a gradual change over the bars they cover, then back to the tempo; fermatas are held",
    },
    notePlaceholder: "Left alone with Rodolfo, the dying Mimì tells him he is her whole life, and they remember the night they met",
    about: (
      <>
        <p>
          “Sono andati?”, Act 4 in the garret. Colline and Schaunard have gone out, and Mimì, who was only pretending to sleep, opens
          her eyes: she wanted to be alone with Rodolfo. She has so much to tell him, or just one thing, as vast as the sea: he is
          her love and her whole life. Is she still pretty? As lovely as the dawn, he says; no, she answers, as lovely as a sunset.
          She sings the words with which she introduced herself (“Mi chiamano Mimì”), Rodolfo gives her back the pink bonnet he has
          kept against his heart, and together they remember the night they met: her candle blown out, the key she dropped, his
          hunting for it in the dark, and how quickly he found it. Softly she repeats his first words to her, “Che gelida manina”,
          until a fit of coughing cuts her short.
        </p>
        <p>
          Score: vocal score pages 261-269 (from figure (21), page 261 system 3 bar 3, to the end of page 269 system 3, before “Oh
          Dio! Mimì!”, 109 bars), from Carlo Carignani’s piano reduction in the G. Ricordi &amp; C. vocal score, public domain.
          Written out from the printed pages: the sung lines and the piano each read independently, every disagreement settled on
          the page by a separate judge, then checked against the page and corrected. Only the Italian words are kept, with the
          print’s spellings and punctuation (“perchè”, “buio,e” printed as one). Rodolfo’s part, printed in the treble clef, is
          written at sounding pitch. The printed metronome mark is the Allegretto un po’ sostenuto’s ♩ = 108; the other tempos are
          chosen as stated under Tempo.
        </p>
        <p>
          Music by Giacomo Puccini and text by Luigi Illica and Giuseppe Giacosa (1896), both public domain. The IPA, word meanings and translation were
          written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "puccini-oh-dio-mimi": {
    portrait: "boheme:mimi",
    opera: "La bohème",
    kind: "Scene",
    facts: {
      key: "One sharp for bars 1-23 (the harmony moves freely over it, to A major at the Andantino sostenuto, bar 22); D-flat major (5 flats) from figure (28) (bar 24, “morbido”) to the end",
      time: "3/4 for bars 1-4; 2/4 from figure (26) (bar 5); 4/4 from bar 8 (Andantino con moto); 3/4 from figure (27) (bar 13); 4/4 for bars 22-23 (Andantino sostenuto); 2/4 from figure (28) (bar 24) to the end",
      tempo: "Printed metronome mark: Allegro moderato ♩ = 120 (bar 1); the a tempo of bar 4 returns to it. Chosen, as no number is printed: Andantino con moto (bar 8) ♩ = 84, the score’s printed Andantino mosso; Allegretto at figure (27) (bar 13) ♩ = 116, the score’s printed Allegretto; Andantino sostenuto (bar 22) ♩ = 50, a tenth under the score’s printed Andantino; Andante lento at figure (28) (bar 24) ♩ = 40, the score’s printed Andante lento in 2/4 (Act 1, “Mi chiamano Mimì”). Rodolfo’s quasi a piacere (bar 3) and the a piacere dialogue of bars 15-18 are held at two-thirds of the tempo until the printed a tempo; the slowing of bars 9-11 is held at ♩ = 67, and Mimì’s last phrases (rall. e morendo, sempre più affievolendosi) at ♩ = 32 from bar 43, then the molto rall. to the end. The other written rall., rit. and rall. molto are played as a gradual change, then back to the tempo; fermatas are held. Timed against complete recordings (about 2¾ min, with the pauses and the broadening that the map does not play)",
    },
    notePlaceholder: "Mimì chokes and rallies; Musetta brings her the muff, which she takes for Rodolfo’s gift, and she drifts off to sleep",
    about: (
      <>
        <p>
          “Oh Dio! Mimì!”, Act 4 in the garret. Mimì has been remembering, with Rodolfo, the night they met, when a fit of choking
          cuts her short and she falls back. At Rodolfo’s cry Schaunard runs in; Mimì opens her eyes and smiles: it is nothing, she
          is well, and she will be good. Musetta and Marcello come back: Marcello has seen the doctor, who is on his way, and brings
          a cordial. Musetta gives Mimì the muff she wished for. Mimì thinks it is Rodolfo’s present, thanks him and scolds him for
          spending so much, and when she sees him crying tells him she is well. With her hands warm in the muff, she drifts off to
          sleep.
        </p>
        <p>
          Score: vocal score pages 269-273 (from page 269 system 4, Allegro moderato, to the end of page 273, the “lunga pausa”
          before figure (29), 48 bars), from Carlo Carignani’s piano reduction in the G. Ricordi &amp; C. vocal score, public
          domain. Written out from the printed pages: the sung lines and the piano each read independently, every disagreement
          settled on the page by a separate judge, then checked against the page and corrected. Only the Italian words are kept,
          with the print’s spellings and punctuation (“Quì”, “perchè”). Rodolfo’s part, printed in the treble clef, is written at
          sounding pitch. The printed metronome mark is the Allegro moderato’s ♩ = 120; the other tempos are chosen as stated
          under Tempo.
        </p>
        <p>
          Music by Giacomo Puccini and text by Luigi Illica and Giuseppe Giacosa (1896), both public domain. The IPA, word meanings and translation were
          written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "puccini-che-ha-detto-il-medico": {
    portrait: "boheme:musetta",
    opera: "La bohème",
    kind: "Finale",
    facts: {
      key: "Two sharps from figure (29) (it opens on a B minor chord) to bar 33; four sharps from figure (31) (bar 34, “Coraggio”) to the end, which closes on C-sharp minor chords",
      time: "2/4 from figure (29); one bar of 6/8 (bar 18, “Non credo”, “Marcello, è spirata…”); 2/4 again from figure (30) (bar 19); 4/4 at figure (31) (bar 34), 3/4 for bars 35-36, 4/4 from bar 37 to the end",
      tempo: "No metronome mark is printed in this piece. Chosen and timed against complete recordings (about 2½ min, with the pauses the map does not play): Andante lento e sostenuto at figure (29) ♩ = 52, the score’s printed Andante lento in common time (Act 1, “Che gelida manina”), as the recordings take this part well above the 2/4 Andante lento’s ♩ = 40; the a tempo at figure (30) returns to it; Largo sostenuto at figure (31) (bar 34) ♩ = 46, broader than the score’s other Largo sostenuto (♩ = 58), as the recordings take the last page; Grave (bar 42) ♩ = 40. Musetta’s quasi a piacere aside and Colline’s a piacere words keep the running tempo. The written rall. (bar 18) and poco rall. (bar 41) are played as a gradual change, then back to the tempo; fermatas, including the lunga pause of bar 30, are held",
    },
    notePlaceholder: "Musetta prays for Mimì while the friends whisper; Schaunard finds that she has died, and Rodolfo is the last to understand",
    about: (
      <>
        <p>
          “Che ha detto il medico?”, the end of Act 4 and of the opera, in the garret. Mimì has fallen asleep, and Rodolfo quietly
          asks Marcello about the doctor: he is coming. Musetta warms the medicine over the spirit lamp and, almost without knowing
          it, murmurs a prayer to the Madonna for Mimì, breaking off to ask for something to shield the flickering flame: she herself
          does not deserve forgiveness, but Mimì is an angel. Rodolfo still hopes; Musetta does not think it is serious. Schaunard
          looks at the bed and whispers to Marcello that she has died. Colline comes back with the money from his coat. Rodolfo
          hangs Musetta’s cape over the window to keep the sun off Mimì’s face, tells Colline that she is resting, and then sees how
          the others are looking at him. Marcello embraces him (“Coraggio”), and Rodolfo throws himself on Mimì’s body, crying her
          name.
        </p>
        <p>
          Score: vocal score pages 274-277 (from figure (29), Andante lento e sostenuto, to the last bar of the opera, 45 bars), from
          Carlo Carignani’s piano reduction in the G. Ricordi &amp; C. vocal score, public domain. Written out from the printed
          pages: the sung lines and the piano each read independently, every disagreement settled on the page by a separate judge,
          then checked against the page and corrected. Only the Italian words are kept, with the print’s spellings and punctuation
          (“perchè”, “Madonna santa io sono indegna di perdono”). The whispered and choked words (Colline’s “Come va?”, Rodolfo’s
          “Vedi? È tranquilla” and “Che vuol dire quell’andare e venire…”, Marcello’s “Coraggio”) are printed with stems but no
          noteheads and are written with cross noteheads. Rodolfo’s part, printed in the treble clef, is written at sounding pitch.
          No metronome mark is printed; the tempos are chosen as stated under Tempo.
        </p>
        <p>
          Music by Giacomo Puccini and text by Luigi Illica and Giuseppe Giacosa (1896), both public domain. The IPA, word meanings and translation were
          written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1786), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications), wherever his printed transcription is legible; this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
  "mozart-deh-vieni-alla-finestra": {
    portrait: "giovanni:dongiovanni",
    opera: "Don Giovanni",
    kind: "Canzonetta",
    facts: {
      key: "D major",
      time: "6/8 (the Schirmer print shows C, but every bar holds six eighths, Mozart's own metre)",
      tempo: "Allegretto, played at a dotted quarter = 48 (♩ = 72), about 1¾ minutes, the median of five recordings (Fricsay, Giulini, Davis, Böhm, Karajan); Mozart gives the word only",
    },
    notePlaceholder: "Keep it light and easy over the plucked accompaniment: a serenade, not a declaration",
    about: (
      <>
        <p>
          Act 2. Don Giovanni has swapped hat and cloak with Leporello and sent him off with Donna Elvira, so that he can have the street
          to himself and serenade her maid. Alone under the window, accompanying himself on the mandolin, he begs her to come to the
          window and console his tears, or he will die before her eyes: her mouth is sweeter than honey and her heart is sugar; let her
          not be cruel, but at least let herself be seen.
        </p>
        <p>
          Score: No. 16, the Canzonetta (vocal score pages 174–175, 44 bars), from the G. Schirmer vocal score (New York, 1900; IMSLP
          #68957), public domain. Written out from the printed pages: the sung line and the piano each read by two independent readers,
          every disagreement settled on the page by a judge, then checked bar by bar and checked again by a fresh checker. The print
          shows a C time signature, but every bar holds six eighths: the canzonetta is written here in 6/8, Mozart's own metre. The
          piano imitates the mandolin over pizzicato strings; the cue words are left out. The small note in bar 10 is an appoggiatura.
          Only the Italian words are kept, with the print's spelling and punctuation (“gioja”).
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1787), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-ah-fuggi-il-traditor": {
    portrait: "giovanni:elvira",
    opera: "Don Giovanni",
    kind: "Aria",
    facts: {
      key: "D major",
      time: "3/4",
      tempo: "Allegro, played at ♩ = 105, about 1¼ minutes, the median of five recordings (Fricsay, Giulini, Davis, Böhm, Karajan); Mozart gives the word only",
    },
    notePlaceholder: "Firm and urgent, in strict time: the dotted rhythms drive the warning, so keep them crisp to the end",
    about: (
      <>
        <p>
          Act 1. Don Giovanni has just talked the peasant bride Zerlina into following him to his house when Donna Elvira, the lady
          he abandoned, steps between them. Giovanni whispers to Zerlina that the poor woman is in love with him and must be humoured,
          but Elvira turns to the girl: run from the traitor and do not let him speak; his lips lie and his eyes deceive. Let her own
          suffering teach Zerlina how far to trust that heart, and let her danger make the girl afraid. She leads Zerlina away,
          leaving Giovanni alone.
        </p>
        <p>
          Score: No. 8, the Aria (vocal score pages 69–71, 45 bars), from the G. Schirmer vocal score (New York, 1900; IMSLP
          #68957), public domain. Written out from the printed pages: the sung line and the piano each read by two independent readers,
          every disagreement settled on the page by a judge, then checked bar by bar and checked again by a fresh checker. The last
          three bars are for the piano alone. Only the Italian words are kept, with the print's spelling and punctuation (“Da miei”,
          where the libretto has “Da' miei”).
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1787), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-finchan-dal-vino": {
    portrait: "giovanni:dongiovanni",
    opera: "Don Giovanni",
    kind: "Aria",
    facts: {
      key: "B-flat major",
      time: "2/4",
      tempo: "Presto, played at a half note = 116 (♩ = 232), under 1½ minutes, the median of five recordings (Fricsay, Giulini, Davis, Böhm, Karajan); Mozart gives the word only",
    },
    notePlaceholder: "Breathless but exact: light, short notes at full speed, with the words crisp on every eighth",
    about: (
      <>
        <p>
          Act 1. Leporello has just told his master how he got Donna Elvira out of the way and kept the peasants drinking at the
          house. Delighted, Don Giovanni orders a great party: while the wine keeps their heads hot, bring in any girl from the
          square, and let them dance without any order, the minuet, the follia and the allemande all at once. Meanwhile he will
          flirt with this one and that, and by tomorrow morning his list will be some ten names longer.
        </p>
        <p>
          Score: No. 11, the Aria (vocal score pages 100–104, 160 bars), from the G. Schirmer vocal score (New York, 1900; IMSLP
          #68957), public domain. Written out from the printed pages: the sung line and the piano each read by two independent readers,
          every disagreement settled on the page by a judge, then checked bar by bar and checked again by a fresh checker. Leporello is
          on stage but does not sing. Only the Italian words are kept, with the print's spelling and punctuation (“l'alemana”,
          “menuetto”, and “folia” once for “follia”).
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1787), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-la-ci-darem-la-mano": {
    portrait: "giovanni:zerlina",
    opera: "Don Giovanni",
    kind: "Duettino",
    facts: {
      key: "A major",
      time: "2/4 (Andante) for bars 1–49; 6/8 (Allegro) from the one-eighth upbeat in bar 50 to the end",
      tempo: "Andante, played at ♩ = 43, then Allegro at a dotted quarter ≈ 57 (♩ = 86), about 3½ minutes in all, the median of five recordings (Fricsay, Giulini, Böhm, Haitink, Karajan); their tracks are not split at the Allegro, so its eighth note is set to the Andante's sixteenth; the fermata on “Andiam!” is held; Mozart gives the words only",
    },
    notePlaceholder: "Zerlina's line warms as she gives in: keep the Andante unhurried and let the 6/8 dance",
    about: (
      <>
        <p>
          Act 1. Don Giovanni has sent Masetto away and is alone with Zerlina on her wedding day. He takes her hand: over there, in
          his little house, she will say yes; it is not far, let them go. She wants to and does not want to; her heart trembles a
          little, she would be happy, but he may be making a fool of her, and she is sorry for Masetto. He promises to change her
          lot; she feels she cannot hold out much longer, and gives in. In the Allegro they sing together, arm in arm, of an innocent
          love that will ease their sorrows.
        </p>
        <p>
          Score: No. 7, the Duettino (vocal score pages 64–68, 83 bars), from the G. Schirmer vocal score (New York, 1900; IMSLP
          #68957), public domain. Written out from the printed pages: the sung lines and the piano each read by two independent
          readers, every disagreement settled on the page by a judge, then checked bar by bar and checked again by a fresh checker.
          The one-eighth upbeat to the Allegro is kept as its own short bar (bar 50), and in bar 49 the voices are completed with an
          unprinted eighth rest. Only the Italian words are kept, with the print's spelling and punctuation (“cangierò”, and “tuo
          sorte” where the libretto has “tua sorte”).
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1787), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-batti-batti": {
    portrait: "giovanni:zerlina",
    opera: "Don Giovanni",
    kind: "Aria",
    facts: {
      key: "F major",
      time: "2/4 (Andante grazioso) from the one-quarter upbeat in bar 1 to the fermata in bar 61; 6/8 (Allegro) from the three-eighth upbeat in bar 62 to the end",
      tempo: "Andante grazioso, played at ♩ = 47, then Allegro at a dotted quarter ≈ 63 (♩ = 94), about 3¾ minutes in all, the median of five recordings (Fricsay, Giulini, Böhm, Haitink, Karajan); their tracks are not split at the Allegro, so its eighth note is set to the Andante's sixteenth; the fermata on “core” is held; Mozart gives the words only",
    },
    notePlaceholder: "Coax, don't plead: keep the 2/4 light and lilting, then let the 6/8 smile once Masetto gives in",
    about: (
      <>
        <p>
          Act 1. Masetto is sulking after finding his bride Zerlina with Don Giovanni, and will not let her touch him. She offers
          herself to his anger: let him beat his poor Zerlina, she will stand there like a lamb and wait for the blows; he may tear
          her hair and pluck out her eyes, and afterwards she will happily kiss his dear hands. Then she sees that he has not the heart
          to do it. In the quicker 6/8 she makes peace with him, and they will spend their nights and days in happiness. Masetto is
          on stage but does not sing.
        </p>
        <p>
          Score: No. 12, the Aria (vocal score pages 106–110, 101 bars), from the G. Schirmer vocal score (New York, 1900; IMSLP
          #68957), public domain. Written out from the printed pages: the sung line and the piano each read by two independent readers,
          every disagreement settled on the page by a judge, then checked bar by bar and checked again by a fresh checker. The upbeats
          are kept as their own short bars (bar 1, and bar 62 at the Allegro), and bar 61 is the one-quarter bar with the fermatas. In
          bars 53–58 the piano's pairs of 64th notes are written so that each trill figure fills its sixteenth exactly. Only the
          Italian words are kept, with the print's spelling and punctuation (“Lascierò”, “straziar mi il crine”, “in contento”, and
          “Masétto” with the print's accent once).
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1787), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-soave-sia-il-vento": {
    portrait: "cosi:fiordiligi",
    opera: "Così fan tutte",
    kind: "Terzettino",
    facts: {
      key: "E major",
      time: "¢ (alla breve)",
      tempo: "Andante (in Peters' brackets), played at a half note ≈ 27 (♩ = 53), about 3 minutes, from two recordings (Rattle 2:56, Klemperer 3:15); Mozart gives the word only",
    },
    notePlaceholder: "Keep the line smooth and quiet, and listen to the other two",
    about: (
      <>
        <p>
          Watching the boat that carries the officers disappear, the sisters and Don Alfonso pray together: may the wind be gentle, the waves calm, and
          every element answer their wishes kindly. At the end the sisters go out, leaving Alfonso alone.
        </p>
        <p>
          Score: No. 10, the Terzettino (vocal score pages 64–68, 41 bars), from Kurt Soldan's piano reduction in the Edition Peters vocal score (Edition
          Peters Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: the sung lines and the piano each read by two
          independent readers, every disagreement settled on the page by a judge, a separate sweep for dynamics, slurs and other marks, then checked bar by
          bar by a fresh checker. The small notes in bar 12 are grace notes; the last three bars are for the piano alone. Only the Italian words are kept,
          with the print's spelling and punctuation.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-cosi-sinfonia": {
    // no one sings it: the cast list's first character stands for the opera
    portrait: "cosi:fiordiligi",
    opera: "Così fan tutte",
    kind: "Overture",
    facts: {
      key: "C major",
      time: "¢ (alla breve)",
      tempo: "Andante at ♩ = 67, then Presto at a half note = 136 (♩ = 272), about 4½ minutes: set from the lengths of four complete recordings (Jacobs, Muti, Cantelli, Böhm); Mozart gives the words only",
    },
    notePlaceholder: "",
    about: (
      <>
        <p>
          The orchestra plays alone with the curtain down: a short slow Andante, then a fast Presto. The curtain rises only during the first number.
        </p>
        <p>
          Score: the “Ouvertura”, vocal score pages 1–6 (261 bars), from Kurt Soldan's piano reduction in the Edition Peters vocal score (Edition Peters
          Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: each page range read by two independent readers, every
          disagreement settled on the page by a judge, a separate sweep for dynamics, slurs and other marks, then checked bar by bar by fresh checkers. The
          instrument cues printed over the staves are left off; the editorial [f] of bar 1 is played as a plain f. Mozart gives no metronome number; the
          tempos are taken from the lengths of four complete recordings.
        </p>
        <p>Music by Wolfgang Amadeus Mozart (1790), public domain.</p>
      </>
    ),
  },
  "mozart-la-mia-dorabella": {
    portrait: "cosi:ferrando",
    opera: "Così fan tutte",
    kind: "Terzetto",
    facts: {
      key: "G major",
      time: "4/4",
      tempo: "Allegro, played at ♩ = 123 (about 2 minutes, the median of four complete recordings: Jacobs, Harnoncourt, Muti, Böhm): Mozart gives the word only",
    },
    notePlaceholder: "Ferrando and Guglielmo swear by their fiancées; Don Alfonso would rather drop the subject",
    about: (
      <>
        <p>
          In a coffee house, Ferrando says his Dorabella could never betray him: heaven made her as faithful as she is beautiful. Guglielmo says the same of
          his Fiordiligi. Their grey-haired friend Don Alfonso would rather drop the subject, but they insist: if he has hinted that women can be
          unfaithful, he must prove it, or draw his sword and end the friendship. Alfonso calls it madness to go looking for a misfortune that only makes you
          wretched once you find it, while each officer says that anyone who lets slip a word against her cuts him to the quick.
        </p>
        <p>
          Score: No. 1, the Terzetto (vocal score pages 7–12, 61 bars), from Kurt Soldan's piano reduction in the Edition Peters vocal score (Edition
          Peters Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: the sung lines and the piano each read by two
          independent readers, every disagreement settled on the page by a judge, a separate sweep for dynamics and slurs, then checked bar by bar by a fresh
          checker. Only the Italian words are kept, with the print's spellings (quà, cel'); the stage direction and instrument cues are left out. The
          eighths of the last bar, beamed in threes, are read as triplets.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-fuor-la-spada": {
    portrait: "cosi:guglielmo",
    opera: "Così fan tutte",
    kind: "Recitative",
    facts: {
      key: "No key signature: it moves through several keys",
      time: "4/4",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 93, from the lengths of three complete recordings (Böhm, Jacobs, Gardiner; about 1 minute)",
    },
    notePlaceholder: "Speak it first, then sing: the officers are hot-headed, Alfonso unruffled",
    about: (
      <>
        <p>
          Swords drawn, Guglielmo tells Don Alfonso to choose which of them he will fight. Alfonso calmly replies that he is a man of peace who fights
          duels only at the dinner table. Ferrando demands that he either fight or say why he thinks their sweethearts capable of infidelity. Alfonso swears
          he is not joking: he only wants to know whether their beauties are goddesses or women of flesh and blood like everyone else. When the two admit
          that they are women, he laughs at their simple faith in finding fidelity in women.
        </p>
        <p>
          Score: the recitative after No. 1 (vocal score pages 12–13, 25 bars), from Kurt Soldan's piano reduction in the Edition Peters vocal score
          (Edition Peters Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: the sung lines and the piano each read
          by two independent readers, every disagreement settled on the page by a judge, then checked bar by bar by a fresh checker. Where the print
          gives a second rhythm for the German words, the Italian rhythm is kept. Only the Italian words are kept, with the print's spellings ('la spada,
          sciegliete, perchè). The last bar is printed as a half bar, leading straight into No. 2.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-e-la-fede-delle-femmine": {
    portrait: "cosi:alfonso",
    opera: "Così fan tutte",
    kind: "Terzetto",
    facts: {
      key: "E major",
      time: "¢ (alla breve)",
      tempo: "Allegro, played at a half note = 97 (♩ = 194), about 1 minute: the median length of three complete recordings (Böhm, Gardiner, Barenboim); Mozart gives the word only",
    },
    notePlaceholder: "Alfonso teases lightly; the officers answer with fire",
    about: (
      <>
        <p>
          Don Alfonso jokes that women's faithfulness is like the Arabian phoenix: everyone says it exists, no one knows where. Ferrando cries that
          Dorabella is the phoenix, Guglielmo that Fiordiligi is. Alfonso answers that it is neither one nor the other: there never was one, and there
          never will be.
        </p>
        <p>
          Score: No. 2, the Terzetto (vocal score pages 14–16, 55 bars), from Kurt Soldan's piano reduction in the Edition Peters vocal score (Edition
          Peters Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: the sung lines and the piano each read by two
          independent readers, every disagreement settled on the page by a judge, a separate sweep for dynamics and other marks, then checked bar by bar by
          a fresh checker. Only the Italian words are kept, with the print's spelling (femmine); the misprint “fedc” in bar 1 is read as “fede”, and the
          stage directions and instrument cues are left out. The last bar, a single beat, holds Ferrando's first syllables of the next recitative.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-scioccherie-di-poeti": {
    portrait: "cosi:ferrando",
    opera: "Così fan tutte",
    kind: "Recitative",
    facts: {
      key: "No key signature: it moves through several keys",
      time: "4/4",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 103, from the median length of seven recordings (Böhm, Haitink, Solti, Nézet-Séguin, Currentzis, Gardiner, Marriner; about 1½ minutes)",
    },
    notePlaceholder: "Speak it first: the officers quick and sure of themselves, Alfonso amused",
    about: (
      <>
        <p>
          The two officers call Don Alfonso's phoenix poets' nonsense and old men's foolishness. Asked what proof they have that their sweethearts will stay
          true, they list long experience, noble upbringing, lofty thinking, promises and oaths; Alfonso adds tears, sighs, caresses and fainting fits, and
          laughs. He offers to show them, today, that their women are like all the others, and they bet him a hundred zecchini. They swear as soldiers of
          honour not to drop a hint to their “Penelopes” and to do whatever he tells them, and look forward to having their fun at his expense; Guglielmo
          wonders what they will do with the money.
        </p>
        <p>
          Score: the recitative after No. 2 (vocal score pages 17–19, 39 bars), from Kurt Soldan's piano reduction in the Edition Peters vocal score
          (Edition Peters Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: the sung lines and the piano each read
          by two independent readers, every disagreement settled on the page by a judge, then checked bar by bar by fresh checkers. Where the print gives a
          second rhythm for the German words, the Italian rhythm is kept. Only the Italian words are kept, with the print's spellings (Poeti, cóstanti,
          sièn, Penelopi). Ferrando's first word begins in the last bar of No. 2, so this piece starts on its last syllable, and Guglielmo's last word
          runs on into No. 3.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-una-bella-serenata": {
    portrait: "cosi:ferrando",
    opera: "Così fan tutte",
    kind: "Terzetto",
    facts: {
      key: "C major",
      time: "4/4",
      tempo: "Allegro, played at ♩ = 128 (about 2½ minutes, the median of five recordings: Böhm, Gardiner, Jacobs, Marriner, Cantelli); Mozart gives the word only",
    },
    notePlaceholder: "Light and quick: three men already celebrating a bet they think they have won",
    about: (
      <>
        <p>
          Ferrando plans to spend his winnings on a serenade for his goddess, Guglielmo on a banquet in honour of Venus. Don Alfonso asks if he will be one
          of the guests; certainly, they say, and all three look forward to drinking toast after toast to the god of love. They go off, and the piano ends
          the scene alone.
        </p>
        <p>
          Score: No. 3, the Terzetto (vocal score pages 20–24, 76 bars), from Kurt Soldan's piano reduction in the Edition Peters vocal score (Edition
          Peters Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: the sung lines and the piano each read by two
          independent readers, every disagreement settled on the page by a judge, a separate sweep for dynamics and other marks, then checked bar by bar by
          fresh checkers. Only the Italian words are kept, with the print's spellings (si Signor, anch' io). The first bar also holds Guglielmo's last two
          syllables of the recitative before, where the print has them.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-ah-guarda-sorella": {
    portrait: "cosi:fiordiligi",
    opera: "Così fan tutte",
    kind: "Duetto",
    facts: {
      key: "A major",
      time: "3/8, then 2/4 (Allegro)",
      tempo: "Andante at an eighth note = 70 (♩ = 35), then Allegro at ♩ = 93, with a short Adagio cadenza (♩ = 40); about 5 minutes in all, the median of four recordings (Böhm, Jacobs, Muti, Cantelli). The recordings do not mark where the Allegro starts, so the balance between the two speeds is an estimate; Mozart gives the words only",
    },
    notePlaceholder: "Each sister sings her own portrait: Fiordiligi proud, Dorabella fiery; then the vow together",
    about: (
      <>
        <p>
          In a garden by the sea, the sisters Fiordiligi and Dorabella each gaze at the portrait she wears at her side. Fiordiligi asks whether a finer
          mouth or a nobler face could be found; Dorabella points to the fire in the eyes of hers. One sees a warrior and a lover, the other a face that
          charms and threatens, and each declares herself happy. Together, in a quicker section, they swear that if their hearts ever change, Love may make
          them suffer for the rest of their lives.
        </p>
        <p>
          Score: No. 4, the Duetto (vocal score pages 25–30, 154 bars), from Kurt Soldan's piano reduction in the Edition Peters vocal score (Edition Peters
          Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: the sung lines and the piano each read by two
          independent readers, every disagreement settled on the page by a judge, a separate sweep for dynamics, slurs and other marks, then checked bar by
          bar by fresh checkers. Only the Italian words are kept, and the grace notes are written as Peters prints them.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-mi-par-che-stamattina": {
    portrait: "cosi:fiordiligi",
    opera: "Così fan tutte",
    kind: "Recitative",
    facts: {
      key: "No key signature: it moves through several keys",
      time: "4/4",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 94, from the median length of five recordings (Böhm, Haitink, Solti, Nézet-Séguin, Currentzis; about 1¼ minutes)",
    },
    notePlaceholder: "Speak it first: the sisters playful, then alarmed when Alfonso comes in alone",
    about: (
      <>
        <p>
          Fiordiligi feels like being a little mad this morning: there is a fire in her veins, and she plans to play a trick on Guglielmo when he comes.
          Dorabella feels something new too, and would swear that their weddings are not far off. Fiordiligi reads her palm and finds marriage there, soon.
          But why are their bridegrooms so late? It is already six. Instead of the officers it is Don Alfonso who arrives, alone and apparently in tears,
          and the sisters beg him to tell them what has happened.
        </p>
        <p>
          Score: the recitative after No. 4 (vocal score pages 31–32, 29 bars), from Kurt Soldan's piano reduction in the Edition Peters vocal score
          (Edition Peters Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: the sung lines and the piano each read
          by two independent readers, every disagreement settled on the page by a judge, then checked bar by bar by a fresh checker. Where the print gives a
          second rhythm for the German words, the Italian rhythm is kept. Only the Italian words are kept, with the print's spellings (stamattina,
          Guglielmo, astrologarti, Pì). The singers' names follow the print: Dorabella asks Alfonso what has happened and says “L'amante…”, Fiordiligi
          “L'idol mio…”, the other way round from common libretto editions. The last bar, two beats, leads straight into No. 5, where Don Alfonso finishes
          his line.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-vorrei-dir": {
    portrait: "cosi:alfonso",
    opera: "Così fan tutte",
    kind: "Aria",
    facts: {
      key: "F minor",
      time: "¢ (alla breve)",
      tempo: "Allegro agitato, played at a half note = 123 (♩ = 246), under a minute: from Böhm's recording (0:40, which includes the three bars of “Barbaro fato” at the end of the recitative before); Mozart gives the words only",
    },
    notePlaceholder: "Breathless and broken: Alfonso is acting, but it has to sound real",
    about: (
      <>
        <p>
          Don Alfonso arrives alone in the garden, apparently too upset to speak. He stammers that he would like to tell the sisters something but has not
          the heart: his lips falter, and his voice will not come out but sticks halfway. What will they do, what will he do? It is a terrible blow, nothing
          could be worse, and he pities the sisters and their lovers alike. The audience knows that he is acting a part in his own wager.
        </p>
        <p>
          Score: No. 5, the Aria (vocal score pages 33–34, 38 bars), from Kurt Soldan's piano reduction in the Edition Peters vocal score (Edition Peters
          Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: the sung line and the piano each read by two
          independent readers, every disagreement settled on the page by a judge, a separate sweep for dynamics and other marks, then checked bar by bar
          by a fresh checker. Only the Italian words are kept, with the print's spelling (quà). The first bar holds “fato!”, the end of Don Alfonso's
          line “Barbaro fato!”, which begins in the last bar of the recitative before; the print sets it at the start of the aria.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-stelle-per-carita": {
    portrait: "cosi:fiordiligi",
    opera: "Così fan tutte",
    kind: "Recitative",
    facts: {
      key: "No key signature: it moves through several keys",
      time: "4/4",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 99, from Böhm's recording (about 1 minute)",
    },
    notePlaceholder: "Speak it first: the sisters frantic, Alfonso grave and slow to tell",
    about: (
      <>
        <p>
          Fiordiligi begs Don Alfonso not to let them die of suspense; he tells the sisters to arm themselves with constancy. Dorabella fears that her
          beloved is dead, and Fiordiligi asks the same of hers: not dead, he says, but little better. Wounded? Ill? No: a royal order calls them to the
          battlefield, and they must leave at once. There is no way to stop it, and the poor men have not the courage to face the sisters, but if they
          wish to say goodbye, the officers are ready. Don Alfonso calls them in.
        </p>
        <p>
          Score: the recitative after No. 5 (vocal score pages 34–36, 23 bars), from Kurt Soldan's piano reduction in the Edition Peters vocal score
          (Edition Peters Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: the sung lines and the piano each read
          by two independent readers, every disagreement settled on the page by a judge, then checked bar by bar by a fresh checker. Where the print gives
          a second rhythm for the German words, the Italian rhythm is kept. Only the Italian words are kept, with the print's spellings (Oh Dei, Che caso
          dunque?, Nè).
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-sento-o-dio": {
    portrait: "cosi:guglielmo",
    opera: "Così fan tutte",
    kind: "Quintetto",
    facts: {
      key: "E♭ major",
      time: "¢ (alla breve)",
      tempo: "Andante, played at a half note = 56 (♩ = 112), about 4 minutes: estimated from two recordings (Kuijken 4:49, Hager 4:25) whose tracks also hold the recitative that follows, so about 45 seconds were taken off; Mozart gives the word only",
    },
    notePlaceholder: "Hushed and held: a sham farewell for the men, a real one for the sisters",
    about: (
      <>
        <p>
          Guglielmo's feet will hardly carry him forward; Ferrando's trembling lips cannot speak, and Don Alfonso reminds them that a hero shows his valour
          in terrible moments. The sisters tell them to finish the job and plunge their swords into their hearts. The officers blame fate; Dorabella cries
          to Ferrando that he shall not go, Fiordiligi to Guglielmo that she will die at his feet first. Aside, the officers ask Alfonso whether he sees
          how it is; he tells them to hold firm and judge by the end. All five lament that fate cheats human hopes; the audience knows the departure is a
          sham.
        </p>
        <p>
          Score: No. 6, the Quintetto (vocal score pages 36–47, 108 bars), from Kurt Soldan's piano reduction in the Edition Peters vocal score (Edition
          Peters Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: each of its three page ranges read by two
          independent readers, every disagreement settled on the page by a judge, a separate sweep for dynamics and other marks, then checked bar by bar by
          three fresh checkers, one per page range. Only the Italian words are kept, with the print's spellings (Sento, o Dio; l'abbro; avante); the
          asides in brackets and the editorial [f] in bar 1 are kept as printed. Two printed slurs that cross between staves, in bars 103 and 107, cannot
          be written in the file and are left out.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-non-piangere-idol-mio": {
    portrait: "cosi:guglielmo",
    opera: "Così fan tutte",
    kind: "Recitative",
    facts: {
      key: "No key signature: it moves through several keys",
      time: "4/4",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 75, from the median length of five recordings (Haitink, Solti, Nézet-Séguin, Currentzis, Marriner; just under a minute)",
    },
    notePlaceholder: "Speak it first: tender goodbyes, then the sisters' dark talk of swords and dying",
    about: (
      <>
        <p>
          Guglielmo and Ferrando tell their brides not to weep or despair; Don Alfonso says the tears are only natural. Each sister wonders whether she
          will ever see her lover again. Fiordiligi asks Guglielmo to leave her his sword, to kill her if cruel fate should strike him; Dorabella says she
          would die of grief and needs no sword. The men ask them not to speak of such dark omens: the gods will protect their peace of mind.
        </p>
        <p>
          Score: the recitative after No. 6 (vocal score pages 48–49, 17 bars; Peters notes that it is often left out), from Kurt Soldan's piano reduction
          in the Edition Peters vocal score (Edition Peters Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: the
          sung lines and the piano each read by two independent readers, every disagreement settled on the page by a judge, then checked bar by bar by a
          fresh checker. Where the print gives a second rhythm for the German words, the Italian rhythm is kept. Only the Italian words are kept, with the
          print's spellings (Non piangere, cagion, Dei).
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-al-fato-dan-legge": {
    portrait: "cosi:ferrando",
    opera: "Così fan tutte",
    kind: "Duettino",
    facts: {
      key: "B♭ major",
      time: "2/4",
      tempo: "Andante, played at ♩ = 56 (about 1½ minutes, the median of five recordings: Haitink, Solti, Nézet-Séguin, Currentzis, Marriner); Mozart gives the word only",
    },
    notePlaceholder: "Smooth and tender, the two voices moving together; the men are in on the joke",
    about: (
      <>
        <p>
          The two officers tell their sweethearts that those lovely eyes rule fate: Love protects them, and no cruel star dares to disturb their peace. Each
          asks his beloved to turn a calm face to him, and says he hopes to come back happily to her arms. The sisters and Don Alfonso listen; the audience
          knows that the officers are not really going to war.
        </p>
        <p>
          Score: No. 7, the Duettino (vocal score pages 49–51, 38 bars; Peters notes that it is often left out), from Kurt Soldan's piano reduction in the
          Edition Peters vocal score (Edition Peters Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: the sung
          lines and the piano each read by two independent readers, every disagreement settled on the page by a judge, a separate sweep for dynamics, slurs
          and other marks, then checked bar by bar by a fresh checker. Only the Italian words are kept, with the print's spellings (Guglielmo's lóro in
          bar 8, and spere for spero in bar 23). A possible small turn over Guglielmo's part in bar 32 is too uncertain on the page to write.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-la-commedia-e-graziosa": {
    portrait: "cosi:alfonso",
    opera: "Così fan tutte",
    kind: "Recitative",
    facts: {
      key: "No key signature: it moves through several keys",
      time: "4/4",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 70, from the median length of six recordings (Böhm, Haitink, Solti, Nézet-Séguin, Currentzis, Marriner; about half a minute)",
    },
    notePlaceholder: "Speak it first: Alfonso amused aside, Ferrando theatrical, the sisters fainting",
    about: (
      <>
        <p>
          Aside, Don Alfonso enjoys the comedy: both officers play their parts well. A drum roll sounds in the distance, and Ferrando cries that it is the
          fatal drum that parts him from his treasure. Alfonso points out the boat; Fiordiligi feels faint, Dorabella says she is dying.
        </p>
        <p>
          Score: the recitative after No. 7 (vocal score page 51, 8 bars), from Kurt Soldan's piano reduction in the Edition Peters vocal score (Edition
          Peters Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: the sung lines and the piano each read by two
          independent readers, every disagreement settled on the page by a judge, then checked bar by bar by a fresh checker. Where the print gives a
          second rhythm for the German words, the Italian rhythm is kept. Only the Italian words are kept, as printed: Don Alfonso's aside is in brackets,
          and comedia has one m.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-bella-vita-militar": {
    // no one in the cast sings it: the cast list's first character stands for the opera, as for the sinfonia
    portrait: "cosi:fiordiligi",
    opera: "Così fan tutte",
    kind: "Coro",
    facts: {
      key: "D major",
      time: "¢ (alla breve)",
      tempo: "Maestoso, played at a half note = 67 (♩ = 134), about 1½ minutes, the median of six recordings (Böhm, Haitink, Solti, Nézet-Séguin, Currentzis, Marriner); Mozart gives the word only",
    },
    notePlaceholder: "Bright and martial: a march heard from afar as the boat comes in",
    about: (
      <>
        <p>
          A march is heard from afar as a boat comes in to the shore. Soldiers, men and women sing the joys of a soldier's life: a new place every day,
          plenty today and little tomorrow, now on land and now at sea. The din of trumpets and fifes and the roar of guns and shells strengthen arm and
          spirit, which long only for victory. The two couples and Don Alfonso watch.
        </p>
        <p>
          Score: No. 8, the Coro (vocal score pages 52–54, 51 bars), from Kurt Soldan's piano reduction in the Edition Peters vocal score (Edition Peters
          Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: the sung lines and the piano each read by two
          independent readers, every disagreement settled on the page by a judge, a separate sweep for dynamics and other marks, then checked bar by bar by
          a fresh checker. The sopranos and altos share one staff in the print and are written here as two parts; the print gives no words under the
          basses. The first bar is the one-beat upbeat. Only the Italian words are kept, with the print's spellings.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-non-ve-piu-tempo-amici": {
    portrait: "cosi:alfonso",
    opera: "Così fan tutte",
    kind: "Recitative",
    facts: {
      key: "No key signature: it moves through several keys",
      time: "4/4",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 103, from Böhm's recording (about half a minute)",
    },
    notePlaceholder: "Speak it first: Alfonso brisk, the lovers' endearments broken off",
    about: (
      <>
        <p>
          Don Alfonso says there is no more time: they must go where destiny, or rather duty, calls them. The four lovers exchange broken endearments, and
          Fiordiligi begs for just one more moment. Alfonso tells them the regiment's boat has already left; they must catch it in a lighter boat where a
          few friends are waiting. The officers ask for a last embrace, and the sisters say they are dying of grief.
        </p>
        <p>
          Score: the recitative after No. 8 (vocal score pages 55–56, 12 bars), from Kurt Soldan's piano reduction in the Edition Peters vocal score
          (Edition Peters Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: the sung lines and the piano each read
          by two independent readers, every disagreement settled on the page by a judge, then checked bar by bar by a fresh checker. Where the print gives
          a second rhythm for the German words, the Italian rhythm is kept. Only the Italian words are kept, with the print's spellings (v'e without its
          accent, Muojo). The sisters' last words, “Muojo d'affanno”, run on into No. 9, which begins on the same page: this piece ends on “d'af-”.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-di-scrivermi-ogni-giorno": {
    portrait: "cosi:fiordiligi",
    opera: "Così fan tutte",
    kind: "Quintetto",
    facts: {
      key: "F major, then D major for the chorus",
      time: "4/4, then ¢ (alla breve) for the chorus",
      tempo: "Andante, played at ♩ = 53, then the chorus Maestoso at a half note = 67 (♩ = 134, the pace of “Bella vita militar”); about 2¾ minutes in all, from the median lengths of five recordings (Böhm, Haitink, Solti, Nézet-Séguin, Currentzis); Mozart gives the words only",
    },
    notePlaceholder: "Broken by sobs: the sisters mean every word, the officers are acting, Alfonso can hardly keep a straight face",
    about: (
      <>
        <p>
          Through their tears the sisters ask their lovers to swear to write every day, twice a day if they can; the officers tell them to be sure of it,
          and the sisters ask them to stay true. Aside, Don Alfonso says he will burst if he does not laugh. With repeated goodbyes all four say their
          hearts are breaking. Then the chorus sings again of the soldier's life as the boat moves off, and the sisters stand motionless on the shore.
        </p>
        <p>
          Score: No. 9, the Quintetto with the chorus “Bella vita militar” sung again (vocal score pages 56–62, 53 bars), from Kurt Soldan's piano
          reduction in the Edition Peters vocal score (Edition Peters Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed
          pages: each of its two page ranges read by two independent readers, every disagreement settled on the page by a judge, a separate sweep for
          dynamics and other marks, then checked bar by bar by two fresh checkers (one left-hand note corrected in bar 8). Only the Italian words are kept,
          with the print's broken words and ellipses. The first bar opens with the sisters' “-fanno”, the end of “Muojo d'affanno” from the recitative
          before. The sopranos and altos share one staff in the print and are written here as two parts. A printed slur that crosses from the right hand
          to the left in bars 7–8 cannot be written in the file and is left out.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-dove-son": {
    portrait: "cosi:dorabella",
    opera: "Così fan tutte",
    kind: "Recitative",
    facts: {
      key: "No key signature: it moves through several keys",
      time: "4/4",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 75, from the median length of five recordings (Böhm, Haitink, Solti, Nézet-Séguin, Currentzis; just under a minute)",
    },
    notePlaceholder: "Speak it first: Dorabella dazed, Alfonso brisk, Fiordiligi watching the boat go",
    about: (
      <>
        <p>
          Dorabella comes to as if from a trance and asks where they are; gone, says Don Alfonso. He tells the sisters to take heart: their sweethearts
          are waving to them from far away. The sisters wish them a good journey, watch the boat vanish, and pray that it reaches the camp safely. Alfonso
          adds a wish of his own: that heaven keep the lovers safe for them and the friends for him.
        </p>
        <p>
          Score: the recitative after No. 9 (vocal score pages 63–64, 17 bars), from Kurt Soldan's piano reduction in the Edition Peters vocal score
          (Edition Peters Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: the sung lines and the piano each read
          by two independent readers, every disagreement settled on the page by a judge, then checked bar by bar by a fresh checker. Only the Italian words
          are kept, with the print's spellings (Oh Dei). It leads straight into No. 10.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-non-son-cattivo-comico": {
    portrait: "cosi:alfonso",
    opera: "Così fan tutte",
    kind: "Recitative",
    facts: {
      key: "No key signature: it moves through several keys",
      time: "4/4",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 100, kept for the closing Allegro moderato too, from the median length of five recordings (Böhm, Haitink, Solti, Nézet-Séguin, Currentzis; about 1 minute)",
    },
    notePlaceholder: "Speak it first: Alfonso alone and pleased with himself, then the proverb sung out",
    about: (
      <>
        <p>
          Alone, Don Alfonso congratulates himself on his acting. The two champions of Venus and Mars are waiting for him at the place they agreed, and he
          must join them. All the grimaces and play-acting are so much the better for him: people like that change their minds fastest, and the poor
          fools have bet a hundred zecchini on a woman. Over the orchestra he sings a proverb: whoever builds his hopes on a woman's heart is ploughing the
          sea, sowing the sand and trying to catch the wind in a net.
        </p>
        <p>
          Score: the recitative after No. 10 (vocal score pages 69–70, 26 bars), from Kurt Soldan's piano reduction in the Edition Peters vocal score
          (Edition Peters Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: the sung line and the piano each read by
          two independent readers, every disagreement settled on the page by a judge, then checked bar by bar by a fresh checker. Bars 1–13 are secco
          recitative; from bar 14 the proverb is set with orchestra, Allegro moderato. Only the Italian words are kept, with the print's spelling
          (femmina) and its quotation marks around the proverb.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-che-vita-maledetta": {
    // Despina opens it; she has no picture yet, so the cast list's avatar shows
    portrait: "cosi:despina",
    opera: "Così fan tutte",
    kind: "Recitative",
    facts: {
      key: "No key signature: it moves through several keys",
      time: "4/4",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 94, from the median length of five recordings (Böhm, Haitink, Solti, Nézet-Séguin, Currentzis; about 1 minute)",
    },
    notePlaceholder: "Speak it first: Despina grumbling, then the sisters bursting in",
    about: (
      <>
        <p>
          Despina, the sisters' maid, is making chocolate and grumbling: a lady's maid slaves from morning to night and gets nothing for herself. She has
          been whisking for half an hour and is left with only the smell, so she tastes it and finds it delicious. Her mistresses burst in in despair;
          when she offers them their breakfast, they throw everything aside, and Fiordiligi calls for a blade or poison. Despina asks what on earth has
          happened.
        </p>
        <p>
          Score: the recitative before No. 11 (vocal score pages 71–72, 23 bars), from Kurt Soldan's piano reduction in the Edition Peters vocal score
          (Edition Peters Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: the sung lines and the piano each read
          by two independent readers, then checked bar by bar by a fresh checker. Where the print gives a second rhythm for the German words, the Italian
          rhythm is kept. Only the Italian words are kept, with the print's spellings (Per Bacco vo assagiarlo). The last bar, three beats, leads into
          No. 11.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-ah-scostati-smanie-implacabili": {
    portrait: "cosi:dorabella",
    opera: "Così fan tutte",
    kind: "Recitative and aria",
    facts: {
      key: "E♭ major (the aria; the recitative has no key signature)",
      time: "4/4, then ¢ (alla breve) for the aria",
      tempo: "The recitative at ♩ = 89, then the aria Allegro agitato at a half note = 107 (♩ = 214); about 3 minutes in all, from the median lengths of six recordings (Böhm, Haitink, Solti, Nézet-Séguin, Currentzis, and Gardiner for the recitative); the recitative's Allegro assai and Maestoso keep its pace; Mozart gives the words only",
    },
    notePlaceholder: "Over the top on purpose: real grief, played as grand tragedy",
    about: (
      <>
        <p>
          Dorabella orders Despina away: let her fear what a desperate love can do. She wants the windows shut; she hates the light, the air she breathes
          and herself, and asks to be left alone. In the aria she says that the torments in her soul will not stop until her anguish kills her, and that if
          she lives, the horrible sound of her sighs will make her a wretched example of fatal love to the Furies.
        </p>
        <p>
          Score: No. 11, the Recitativo ed Aria (vocal score pages 73–79, 126 bars), from Kurt Soldan's piano reduction in the Edition Peters vocal score
          (Edition Peters Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: the recitative and the aria each read by
          two independent readers, every disagreement settled on the page by a judge, a separate sweep for dynamics and other marks, then checked bar by bar
          by three fresh checkers (two errors in the recitative corrected). Only the Italian words are kept, with the print's spelling (finchè). The
          left hand's A flat in bar 51 is kept as printed, though the harmony suggests A natural, and the cut signs printed at bars 104 and 112 are not
          written in.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-signora-dorabella": {
    portrait: "cosi:despina",
    opera: "Così fan tutte",
    kind: "Recitative",
    facts: {
      key: "No key signature: it moves through several keys",
      time: "4/4",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 97, from two recordings (Rattle 2:10, Klemperer 2:21; about 2¼ minutes)",
    },
    notePlaceholder: "Speak it first: Despina breezy and cynical, the sisters tragic and offended",
    about: (
      <>
        <p>
          Despina hears that the sisters' lovers have left Naples for the battlefield and laughs: they will come back covered in laurels, and if they die,
          so much the better, since the sisters lose two men and keep all the others. Fiordiligi and Dorabella say they would die without Guglielmo and
          Ferrando. Despina answers that no woman has ever died of love: one man is as good as another, because none of them is worth anything. Instead of
          wasting time in tears they should amuse themselves, as their sweethearts surely will in camp. Dorabella protests at this insult to such
          faithful souls; Despina says such fairy tales are for children.
        </p>
        <p>
          Score: the recitative after No. 11 (vocal score pages 80–83, 55 bars), from Kurt Soldan's piano reduction in the Edition Peters vocal score
          (Edition Peters Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: the sung lines and the piano each read
          by two independent readers, every disagreement settled on the page by a judge, then checked bar by bar by a fresh checker. Where the print gives
          a second rhythm for the German words, the Italian rhythm is kept. Only the Italian words are kept, with the print's spellings (Guglielmo, buon'
          ora, più tosto, perchè, and Fiordiligi's “Divertirvi?”). The last bar, three beats, leads straight into No. 12.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-in-uomini-in-soldati": {
    portrait: "cosi:despina",
    opera: "Così fan tutte",
    kind: "Aria",
    facts: {
      key: "F major",
      time: "2/4, then 6/8",
      tempo: "Allegretto, played at ♩ = 60, then a dotted quarter = 72 (♩ = 108) in 6/8; about 2¾ minutes, set to come close to two recordings (Rattle 2:46, Klemperer 3:11); Mozart gives the word only",
    },
    notePlaceholder: "Mocking and light: Despina enjoys shocking her mistresses",
    about: (
      <>
        <p>
          Fidelity, from men, from soldiers? Despina laughs at the idea. Men are all made of the same dough: the leaves on the trees and the breezes are
          steadier than they are, and false tears, lying looks and deceitful words are their chief qualities. They love only their own pleasure, then
          despise women and deny them affection. So women should pay them back in the same coin and love for convenience and vanity. She ends with a
          carefree tra-la-la.
        </p>
        <p>
          Score: No. 12, the Aria (vocal score pages 83–87, 93 bars), from Kurt Soldan's piano reduction in the Edition Peters vocal score (Edition Peters
          Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: the sung line and the piano each read by two
          independent readers, every disagreement settled on the page by a judge, a separate sweep for dynamics, words and slurs, then checked bar by bar
          by two fresh checkers (one tie corrected, one completed). The first bar is the one-eighth upbeat; the last five bars are for the piano alone.
          Only the Italian words are kept, with the print's spelling (nè). A printed slur that crosses into the left hand's middle voice (bars 41–45) is
          written in the left hand only.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-che-silenzio": {
    portrait: "cosi:alfonso",
    opera: "Così fan tutte",
    kind: "Recitative",
    facts: {
      key: "No key signature: it moves through several keys",
      time: "4/4",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 93, from three recordings (Rattle 2:37, Klemperer 2:47, Jacobs 2:54; about 2¾ minutes)",
    },
    notePlaceholder: "Speak it first: Alfonso scheming aloud, then sparring with a cheeky Despina",
    about: (
      <>
        <p>
          Alone in the sisters' silent room, Don Alfonso decides they must be consoled while the two trusting lovers go and put on the disguises he
          ordered. He fears Despina might recognise them and upset his plans, so a little present at the right moment, and part of the secret, should win
          her over. He calls her: she tells him an old man can do nothing for a girl, until he shows her a gold coin. He offers her twenty scudi if she can
          bring two fine fellows into her mistresses' favour; she asks whether they are young, handsome and rich, and he asks whether he may bring them in.
        </p>
        <p>
          Score: the recitative after No. 12 (vocal score pages 87–91, 65 bars), from Kurt Soldan's piano reduction in the Edition Peters vocal score
          (Edition Peters Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: the sung lines and the piano each read
          by two independent readers, every disagreement settled on the page by a judge, then checked bar by bar by a fresh checker (three errors
          corrected). Where the print gives a second rhythm for the German words, the Italian rhythm is kept. Only the Italian words are kept, with the
          print's spellings (macchine, vorebbe, quà, and Despina's “Me lo dona?” and “è loro il mio giulebbe”). The last bar, printed short before
          “attacca Nr. 13”, is filled out with rests.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-alla-bella-despinetta": {
    portrait: "cosi:alfonso",
    opera: "Così fan tutte",
    kind: "Sestetto",
    facts: {
      key: "C major",
      time: "4/4, then 3/4, then ¢ (alla breve)",
      tempo: "Allegro, played at ♩ = 132, then the Allegro in 3/4 at ♩ = 165 and the Molto Allegro at a half note = 110 (♩ = 220); about 4⅔ minutes in all, estimated (Jacobs takes 4:23); Mozart gives the words only",
    },
    notePlaceholder: "Six people, six agendas: the officers ham it up, Despina giggles, the sisters are outraged",
    about: (
      <>
        <p>
          Don Alfonso presents his friends to Despina: their happiness depends on her. The two officers, disguised as 'Albanians', beg her by the hand they
          kiss to turn their sweethearts' eyes kindly on them. Despina laughs at their faces, clothes and moustaches: Wallachians or Turks? Since even she
          does not know them, the men are sure the disguise will hold. The sisters call for Despina and order her to throw the strangers out; the suitors,
          with Despina, beg forgiveness and declare their love. The sisters are beside themselves with spite and fury, which delights the officers and
          makes Despina and Don Alfonso a little suspicious, and each sister silently asks her absent lover's pardon.
        </p>
        <p>
          Score: No. 13, the Sestetto (vocal score pages 91–109, 220 bars), from Kurt Soldan's piano reduction in the Edition Peters vocal score (Edition
          Peters Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: five page ranges, each read by two independent
          readers, every disagreement settled on the page by a judge, a separate sweep for dynamics and other marks, then checked bar by bar by five fresh
          checkers (all clean). Three slips in the print's right hand are set right (bars 109, 113 and 220). The first bar is the one-quarter upbeat. Only
          the Italian words are kept, with the print's spellings (o ti so pentir, Mi da, quì, and Don Alfonso's “non ci ravvisa”).
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-che-susurro": {
    portrait: "cosi:alfonso",
    opera: "Così fan tutte",
    kind: "Recitative",
    facts: {
      key: "No key signature: it moves through several keys",
      time: "4/4",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 82, from the median of six recordings (Böhm, Haitink, Solti, Nézet-Séguin, Currentzis, Marriner; most of their tracks run on into “Temerari”, so this recitative's share was taken in proportion; about 2 minutes)",
    },
    notePlaceholder: "Speak it first: Alfonso playing innocent, the officers overdoing it, the sisters scandalised",
    about: (
      <>
        <p>
          Don Alfonso comes in as if drawn by the noise: are the girls mad, rousing the whole neighbourhood? Dorabella points to the men in their house, and
          Fiordiligi adds: on such a day, after such a blow! Alfonso pretends to recognise his dearest friends, quietly tells them to play along, and
          assures Despina that he knows them. The two declare that Love has led them here: like moths to the sisters' radiant eyes they flutter, begging
          for pity in plaintive verse. Fiordiligi is outraged at their daring, and Dorabella asks her sister what they should do.
        </p>
        <p>
          Score: the recitative after No. 13 (vocal score pages 109–112, 43 bars), from Kurt Soldan's piano reduction in the Edition Peters vocal score
          (Edition Peters Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: the sung lines and the piano each read
          by two independent readers, every disagreement settled on the page by a judge, then checked bar by bar by a fresh checker (one error
          corrected). Where the print gives a second rhythm for the German words, the Italian rhythm is kept; two bars printed an eighth too long are set
          right. Only the Italian words are kept, with the print's spellings (perchè). Dorabella's last words, “Sorella, che facciamo?”, run on into No. 14,
          which begins on the same page: this piece ends on “fac-”.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-come-scoglio": {
    portrait: "cosi:fiordiligi",
    opera: "Così fan tutte",
    kind: "Recitative and aria",
    facts: {
      key: "B♭ major (the aria; the recitative has no key signature)",
      time: "4/4",
      tempo: "The recitative Allegro at ♩ = 80 (estimated), then the aria Andante maestoso at ♩ = 66, Allegro at ♩ = 126 and Più Allegro at ♩ = 144, set to come close to Jacobs (4:29 for the aria); about 5½ minutes in all, the aria about 4¼; Mozart gives the words only",
    },
    notePlaceholder: "Grand and unshakeable, with huge leaps: Fiordiligi means every word",
    about: (
      <>
        <p>
          Fiordiligi orders the intruders out: their infamous words shall not profane the sisters' ears and hearts, and no one will ever seduce them from
          the faith they have sworn to their lovers until death. In the aria she says that, as a rock stands unmoved against wind and storm, her soul is
          ever strong in faith and love; the flame that consoles them was born with them, and only death can change their hearts. She tells the suitors to
          respect this example of constancy and give up their cruel hopes.
        </p>
        <p>
          Score: No. 14, the Recitativo ed Aria (vocal score pages 112–120, 153 bars), from Kurt Soldan's piano reduction in the Edition Peters vocal score
          (Edition Peters Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: the recitative and the aria in three
          page ranges, each read by two independent readers, every disagreement settled on the page by a judge, a separate sweep for dynamics and other
          marks, then checked bar by bar by four fresh checkers (one error corrected). The first bar opens with Dorabella's “-ciamo?”, the end of the
          recitative before. A small-note alternative printed in bar 38 is left out. Only the Italian words are kept, with the print's spellings, among
          them “speraza” for the long run on speranza in bars 119–126.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-ah-non-partite": {
    portrait: "cosi:ferrando",
    opera: "Così fan tutte",
    kind: "Recitative",
    facts: {
      key: "No key signature: it moves through several keys",
      time: "4/4",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 92, from the median length of five recordings (Böhm, Haitink, Solti, Nézet-Séguin, Currentzis; about 1 minute)",
    },
    notePlaceholder: "Speak it first: the officers pleading, Alfonso coaxing, the sisters icy",
    about: (
      <>
        <p>
          As the sisters turn to leave, Ferrando begs Fiordiligi to stay and Guglielmo begs Dorabella. Guglielmo asks Don Alfonso aside how it is going;
          wait, he says, and asks the girls not to make him look foolish: a little kindness would not hurt, since these are gentlemen and his friends.
          Fiordiligi asks whether she should really listen; Guglielmo pleads that the sisters' heavenly eyes have wounded them, that only the balm of love
          can heal it, and that if they will not open their hearts for one moment, they will see the most faithful of lovers die at their feet.
        </p>
        <p>
          Score: the recitative after No. 14 (vocal score pages 120–121, 23 bars), from Kurt Soldan's piano reduction in the Edition Peters vocal score
          (Edition Peters Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: the sung lines and the piano each read
          by two independent readers, every disagreement settled on the page by a judge, then checked bar by bar by a fresh checker (clean). Where the
          print gives a second rhythm for the German words, the Italian rhythm is kept. Only the Italian words are kept, with the print's spellings,
          including its misprint “babara” for barbara in bar 2. It leads into No. 15.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-non-siate-ritrosi": {
    portrait: "cosi:guglielmo",
    opera: "Così fan tutte",
    kind: "Aria",
    facts: {
      key: "G major",
      time: "2/4",
      tempo: "Andantino, played at ♩ = 88, about 1½ minutes, the median of seven recordings (Böhm, Haitink, Solti, Nézet-Séguin, Currentzis, Gardiner, Marriner); Mozart gives the word only",
    },
    notePlaceholder: "Light and swaggering: Guglielmo is enjoying the joke",
    about: (
      <>
        <p>
          Guglielmo asks the sisters' charming eyes not to be shy but to dart a loving glance or two their way: make the suitors happy, and they will make
          the sisters happy in return. Look, touch, examine: two dear madcaps, strong and well built, with a fine foot, a fine eye and a fine nose, and
          moustaches that may be called the triumph of manhood and the plumes of love.
        </p>
        <p>
          Score: No. 15, the Aria (vocal score pages 122–124, 68 bars), from Kurt Soldan's piano reduction in the Edition Peters vocal score (Edition Peters
          Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: the sung line and the piano each read by two
          independent readers, every disagreement settled on the page by a judge, a separate sweep for dynamics and other marks, then checked bar by bar by
          a fresh checker (clean). The first bar is the one-eighth upbeat. Only the Italian words are kept, with the print's spellings (quà, po). Mozart
          wrote this aria to replace “Rivolgete a lui lo sguardo” (No. 15a), which Peters prints after it.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-rivolgete-a-lui-lo-sguardo": {
    portrait: "cosi:guglielmo",
    opera: "Così fan tutte",
    kind: "Aria",
    facts: {
      key: "D major",
      time: "4/4, then ¢ (alla breve)",
      tempo: "Allegro, played at ♩ = 138, then the Allegro molto at a half note = 108 (♩ = 216); about 5 minutes, estimated (no timing was found, since most recordings leave this aria out); Mozart gives the words only",
    },
    notePlaceholder: "A long comic boast: keep it buoyant and let the list of heroes tumble out",
    about: (
      <>
        <p>
          Guglielmo asks Fiordiligi to look at Ferrando and see how he freezes and burns for her, and Dorabella to look into his own eyes and read there
          what his lips cannot say. Then he boasts: Orlando in love is nothing beside them, and their equals are not to be found from Vienna to Canada.
          They are Croesuses in wealth and Narcissuses in beauty, stronger than the Cyclops, as learned as Aesop; when they dance, the great Le Picq gives
          way, and their trills put the nightingale to shame. The sisters storm out, and he hails them as heroines of constancy.
        </p>
        <p>
          Score: No. 15a, the Aria K. 584 (vocal score pages 125–134, 195 bars), Mozart's first aria for this place, replaced by No. 15 before the first
          performance; from Kurt Soldan's piano reduction in the Edition Peters vocal score (Edition Peters Nr. 4474, edited by Georg Schünemann), public
          domain. Written out from the printed pages: three page ranges, each read by two independent readers, every disagreement settled on the page by
          a judge, a separate sweep for dynamics and other marks, then checked bar by bar by four fresh checkers (all clean). The small naturals printed
          over two trills (bars 116 and 118) cannot be written in the file; the last five bars are for the piano alone. Only the Italian words are kept,
          with the print's spellings (confronte, usignuolo, Pich ne).
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-e-voi-ridete": {
    portrait: "cosi:alfonso",
    opera: "Così fan tutte",
    kind: "Terzetto",
    facts: {
      key: "G major",
      time: "3/4",
      tempo: "Molto Allegro, played at a dotted half = 67 (♩ = 200), estimated (just under a minute; no separate timing was found); Mozart gives the words only",
    },
    notePlaceholder: "Fast and light: the officers helpless with laughter, Alfonso hushing them",
    about: (
      <>
        <p>
          Alone with Don Alfonso, the two officers laugh uncontrollably. What is the matter? They know already. Alfonso tells them to laugh quietly: if the
          sisters heard them and found them out, the whole affair would be ruined. They feel they will burst with laughing; aside, Alfonso says their
          laughter makes him laugh too, but he knows it will end in tears.
        </p>
        <p>
          Score: No. 16, the Terzetto (vocal score pages 134–139, 61 bars), from Kurt Soldan's piano reduction in the Edition Peters vocal score (Edition
          Peters Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: two page ranges, each read by two independent
          readers, every disagreement settled on the page by a judge, a separate sweep for dynamics and other marks, then checked bar by bar by a fresh
          checker (clean). The piano's running eighths are triplets. Only the Italian words are kept, with the print's spellings (dee, and Don Alfonso's
          misprint “ri” for vi in bar 18).
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
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
