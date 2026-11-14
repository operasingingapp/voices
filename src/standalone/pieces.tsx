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
  "mozart-ah-chi-mi-dice-mai": {
    portrait: "giovanni:elvira",
    opera: "Don Giovanni",
    kind: "Trio",
    facts: {
      key: "E-flat major",
      time: "4/4",
      tempo: "Allegro, played at ♩ = 123, about 3½ minutes, the median of five recordings (Fricsay, Giulini, Böhm, Haitink, Karajan); the fermata on Giovanni's last “Signorina!” is held; Mozart gives the word only",
    },
    notePlaceholder: "Elvira is furious, not tragic: keep the Allegro driving and the leaps clean, and let the men's asides stay light",
    about: (
      <>
        <p>
          Act 1. Before dawn, on a street in Seville, Don Giovanni scents a woman nearby and draws Leporello aside to watch. It is a
          lady from Burgos, Donna Elvira, in travelling clothes: she asks who can tell her where the brute is whom she loved, to her
          shame, and who broke his word to her. If she finds him and he will not come back to her, she will wreak dreadful havoc on
          him and tear his heart out. Giovanni, who has not yet seen her face, decides that some poor girl left by her lover needs
          consoling; Leporello mutters that this is how he has consoled eighteen hundred. Giovanni steps forward: “Signorina!”
        </p>
        <p>
          Score: No. 3, the Trio (vocal score pages 32–37, 108 bars), from the G. Schirmer vocal score (New York, 1900; IMSLP
          #68957), public domain. Written out from the printed pages: the sung lines and the piano each read by two independent
          readers, every disagreement settled on the page by a judge, then checked bar by bar and checked again by a fresh checker.
          The last bar is also the first bar of the next piece: after the fermata it holds Elvira's “Chi è”, which is sung as the start
          of “Chi è là?” and is not part of this piece's words. Only the Italian words are kept, with the print's spelling and
          punctuation (“dov' è” on two notes, “e a me non torna ancor”, and Leporello's “otto cento” as two words).
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1787), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-giovanni-ouverture": {
    // no one sings it: the opera's own picture (the title role, first in the cast list) stands for it
    portrait: "giovanni:dongiovanni",
    opera: "Don Giovanni",
    kind: "Overture",
    facts: {
      key: "D minor (Andante, bars 1–30), then D major; the last bars turn towards F major and stop on a C major chord",
      time: "C (common time) throughout, as printed (Mozart writes alla breve)",
      tempo: "Andante ♩ = 58, then the fast section at a half note = 127, about 6 minutes in all, from the median (6:11) of five recordings (Fricsay, Giulini, Böhm, Haitink, Karajan); Mozart gives the words only",
    },
    notePlaceholder: "",
    about: (
      <>
        <p>
          The orchestra plays alone before the curtain rises: a slow, dark Andante in D minor, whose heavy chords return when the
          Commendatore's statue comes to supper, then a quick, bright section in D major. Its last bars turn aside and stop on a held
          chord, and the first scene, Leporello's “Notte e giorno faticar”, follows straight on.
        </p>
        <p>
          Score: the Overture (vocal score pages 1–7, 292 bars), from the G. Schirmer vocal score (New York, 1900; IMSLP #68957),
          public domain. Written out from the printed pages: each page range read by two independent readers, every disagreement
          settled on the page by a judge, a separate sweep for dynamics, slurs and other marks, then checked bar by bar by fresh
          checkers. This print heads the fast section “Moderato.”, where most scores have Molto allegro; the word is kept as printed.
          Two accidentals missing in the print are supplied: C natural in the right hand in bar 152, and B-flat in the right hand in
          bar 166 (in unison with the left hand). The instrument cues printed over the staves are left off. Mozart gives no metronome
          number; the tempos are taken from the lengths of five complete recordings.
        </p>
        <p>Music by Wolfgang Amadeus Mozart (1787), public domain.</p>
      </>
    ),
  },
  "mozart-notte-e-giorno-faticar": {
    portrait: "giovanni:leporello",
    opera: "Don Giovanni",
    kind: "Introduction",
    facts: {
      key: "F major (one flat); from bar 149, as the duel begins, D minor under the same signature, and the Andante's darker harmony is written with accidentals",
      time: "4/4 (Molto allegro), after a two-beat upbeat bar, to bar 176; cut time (Andante) from bar 177 to the end",
      tempo: "Molto allegro, played at ♩ = 156, then Andante at ♩ = 52, about 6 minutes in all, the median of five recordings (Fricsay, Giulini, Klemperer, Böhm, Karajan); their tracks are not split at the Andante, so its triplet eighths are set to the Molto allegro's quarter notes; the fermatas are held; Mozart gives the words only",
    },
    notePlaceholder: "Leporello grumbles in quick, crisp patter; once the duel starts, everyone sings at once, and the Andante drops to a hush",
    about: (
      <>
        <p>
          Act 1, night, in front of the Commendatore's house. The Overture runs straight into it. Leporello, keeping watch while his
          master is inside, grumbles about toiling night and day for a man who values nothing, in wind and rain, eating badly and
          sleeping worse: he would like to be the gentleman himself and stop serving. Someone is coming, and he hides. Donna Anna
          rushes out clinging to a masked man, Don Giovanni, and will not let him go; he tells her she will never find out who he is,
          and she calls for help. Her father, the Commendatore, comes out sword in hand and challenges him. Giovanni at first refuses
          to fight an old man, then gives way, and in the Andante the Commendatore falls, dying, while Giovanni watches and Leporello,
          aside, does not know what to do or say.
        </p>
        <p>
          Score: No. 1, the Introduction (vocal score pages 8–19, 194 bars), from the G. Schirmer vocal score (New York, 1900; IMSLP
          #68957), public domain. Written out from the printed pages: the sung lines and the piano each read by two independent readers,
          every disagreement settled on the page by a judge, then checked bar by bar and checked again by fresh checkers, whose three
          findings were corrected. Bar 1 is the printed two-beat upbeat bar; a slur joining two chords in bars 36–37 cannot be shown
          here. Only the Italian words are kept, with the print's spelling and punctuation (“Scelerato”, “batiti”, “sò”, “quà”, “colla
          bella”, “già cade” and “affannoso”, where the libretto has “cadde” and “affannosa”).
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1787), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-mi-tradi": {
    portrait: "giovanni:elvira",
    opera: "Don Giovanni",
    kind: "Recitative and aria",
    facts: {
      key: "E♭ major (the aria; the recitative has no key signature)",
      time: "4/4; the aria begins with a one-beat upbeat bar",
      tempo: "The recitative Allegro assai at ♩ = 63, then the aria at ♩ = 133; about 6 minutes in all (the recitative about 2¼, the aria about 4), from the median lengths of five recordings with the two on separate tracks (Fricsay, Davis, Böhm, Haitink, Muti); the print gives no tempo word for the aria",
    },
    notePlaceholder: "Fury and pity in turn: declaim the recitative over the orchestra's outbursts, then keep the aria's long runs even and warm",
    about: (
      <>
        <p>
          Act 2. Alone, Donna Elvira is horrified by the crimes Don Giovanni has sunk into: heaven's anger cannot wait much longer, she
          seems to hear the thunderbolt already falling on his head and to see the abyss opening beneath him. Then she wonders at the
          conflict in her own heart. In the aria she admits that the ungrateful man betrayed her and made her unhappy, yet, betrayed and
          abandoned, she still pities him: when she thinks of her own suffering her heart cries out for revenge, but when she sees the
          danger he is in, it starts to pound for him.
        </p>
        <p>
          Score: No. 21c, the Recitativo ed Aria added for the Vienna production of 1788 (vocal score pages 234–239, 166 bars), from the
          G. Schirmer vocal score (New York, 1900; IMSLP #68957), public domain. Written out from the printed pages: the sung line and
          the piano each read by two independent readers, every disagreement settled on the page by a judge, then checked bar by bar and
          checked again by a fresh checker (one correction: the flat printed above the first trill in bar 15). The recitative is bars
          1–36; the aria starts in bar 37 with its one-beat upbeat, and its last five bars are for the piano alone. Only the Italian
          words are kept, with the print's spelling and punctuation (“quest' ambascie”, where the libretto has “queste ambasce”).
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1788), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-ho-capito": {
    portrait: "giovanni:masetto",
    opera: "Don Giovanni",
    kind: "Aria",
    facts: {
      key: "F major",
      time: "4/4 (C, four beats, not alla breve)",
      tempo: "Allegro di molto, played at ♩ = 235 (a half note ≈ 118), about 1⅔ minutes, the median of five recordings (Fricsay, Giulini, Böhm, Haitink, Karajan); Mozart gives the words only",
    },
    notePlaceholder: "Seething under the bows: clipped and quick, polite to the master's face, then the asides through clenched teeth",
    about: (
      <>
        <p>
          Act 1. Don Giovanni has taken a fancy to Zerlina on her wedding day and orders everyone off to his palace, keeping the bride
          behind; Masetto refuses to leave her until Giovanni shows him his sword. Masetto gives in, bowing and scraping: he has
          understood, he will make no more objections, a gentleman is a gentleman and must be obeyed. Under his breath he calls Zerlina
          a hussy who was always his ruin, tells Leporello he is coming and Zerlina to stay, it is all very decent, and sneers that the
          gentleman will make a lady of her too. Don Giovanni, Zerlina and Leporello are on stage but do not sing.
        </p>
        <p>
          Score: No. 6, the Aria (vocal score pages 58–61, 96 bars), from the G. Schirmer vocal score (New York, 1900; IMSLP
          #68957), public domain. Written out from the printed pages: the sung line and the piano each read by two independent readers,
          every disagreement settled on the page by a judge, then checked bar by bar and checked again by a fresh checker. Where the
          print slurs the piano's recurring tied left-hand chords both above and below, only the lower slur is kept. Only the Italian
          words are kept, with the print's spelling and punctuation (“giacche” and “fo” without accents, “Bricconaccia”, and
          “Cavaliera” with a capital).
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1787), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-madamina": {
    portrait: "giovanni:leporello",
    opera: "Don Giovanni",
    kind: "Aria",
    facts: {
      key: "D major",
      time: "4/4 (Allegro) for bars 1–84; 3/4 (Andante con moto) from bar 85 (“Nella bionda”) to the end",
      tempo: "Allegro, played at ♩ = 156 (a half note = 78), then Andante con moto at ♩ = 78, about 5½ minutes in all, the median of four recordings (Giulini, Haitink, Karajan, Jacobs); their tracks are not split at the Andante, so its quarter note is set to the Allegro's half note; the fermatas on “ma, in Ispagna”, “Ispagna!” and “maestosa” are held; Mozart gives the words only",
    },
    notePlaceholder: "Patter, not bluster: keep the Allegro's numbers quick and clear, then let the 3/4 turn smooth and confiding",
    about: (
      <>
        <p>
          Act 1. Don Giovanni has slipped away and left his servant to deal with Donna Elvira, the lady from Burgos he deserted.
          Leporello tells her she is neither the first nor the last, and shows her his master's catalogue of conquests, a list he
          drew up himself: in Italy six hundred and forty, in Germany two hundred and thirty-one, a hundred in France, ninety-one in
          Turkey, but in Spain already a thousand and three, women of every rank, every figure, every age. Then, more slowly, he
          describes his master's tastes: he praises a blonde for her graciousness, a brunette for her faithfulness, a pale one for
          her softness; in winter he likes them plump, in summer thin; the tall ones are stately, the tiny ones always pretty; old
          women he wins over for the pleasure of adding them to the list, but what he craves most is the young beginner. Rich or
          poor, ugly or lovely, as long as she wears a petticoat, you know what he does. Elvira is on stage but does not sing.
        </p>
        <p>
          Score: No. 4, the Aria (vocal score pages 42–49, 172 bars), from the G. Schirmer vocal score (New York, 1900; IMSLP
          #68957), public domain. Written out from the printed pages: the sung line and the piano each read by two independent readers,
          every disagreement settled on the page by a judge, then checked bar by bar and checked again by a fresh checker. Where the
          print adds stems for the English words under the Italian, the Italian rhythm is kept, and in bar 82, where the voice is
          printed in octaves, the lower notes are kept as the sung line. Only the Italian words are kept, with the print's spelling and
          punctuation (“amo” without its accent, “Almagna”, the numbers divided as printed, “sei cento”, “trent' una”, “di lodarla la
          gentilezza”, “citadine” once, and both “purchè” and “pur che”).
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1787), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-or-sai-chi-lonore": {
    portrait: "giovanni:anna",
    opera: "Don Giovanni",
    kind: "Recitative and aria",
    facts: {
      key: "D major (the aria; the recitative has no key signature)",
      time: "4/4",
      tempo: "The recitative's Allegro assai at ♩ = 114 and its two Andante passages at ♩ = 57 (half the speed, a proportion chosen for this app), the stringendo before the Tempo I played as a gradual quickening; then the aria Andante at ♩ = 100; about 6¼ minutes in all, from the median lengths of five recordings (Fricsay, Giulini, Böhm, Haitink, Karajan), which time the recitative and the aria separately; the fermatas are held; Mozart gives the words only",
    },
    notePlaceholder: "The recitative is a story told in shock: let the orchestra's outbursts drive it and the Andante narration hang; the aria is a command, broad and unbending",
    about: (
      <>
        <p>
          Act 1. Don Giovanni has just left Donna Anna and Don Ottavio, and his parting words have given him away: Anna cries out that
          he is the man who killed her father. She tells Ottavio what happened that night. Late, alone in her rooms, she saw a man
          wrapped in a cloak come in and took him at first for Ottavio; he came close without a word and tried to take her in his
          arms. She struggled and screamed, no one came; he stopped her mouth with one hand and held her with the other until she
          thought herself lost, but horror gave her strength and she tore herself free. She shouted for help and chased him into the
          street; her father came running, challenged him, and the stronger man killed the old man. In the aria she reminds Ottavio
          who tried to rob her of her honour and who took her father from her, bids him remember the wound and the bloodied ground,
          and demands vengeance.
        </p>
        <p>
          Score: No. 10a, the Recitativo accompagnato and Aria (vocal score pages 85–94, 140 bars), from the G. Schirmer vocal score
          (New York, 1900; IMSLP #68957), public domain. Written out from the printed pages: the sung lines and the piano each read
          by two independent readers, every disagreement settled on the page by a judge, then checked bar by bar and checked again
          by a fresh checker. Don Ottavio's part, printed in the treble clef, is written at sounding pitch. In bar 28 the print gives
          Anna one sixteenth too many, and one of her repeated A sharps is left out so the bar adds up. Only the Italian words are
          kept, with the print's spelling and punctuation (“Cosa è stato?”, “alquanta”, “sacre manto”, “e l'indegno”, “chieggio”).
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1787), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-il-mio-tesoro": {
    portrait: "giovanni:ottavio",
    opera: "Don Giovanni",
    kind: "Aria",
    facts: {
      key: "B♭ major",
      time: "2/2 (cut time)",
      tempo: "Andante grazioso, played at a half note = 46 (♩ = 92), about 4½ minutes, the median of five recordings (Fricsay, Davis, Böhm, Haitink, Karajan); the fermatas in bar 78 mark a cadenza point, held here with no cadenza added; Mozart gives the words only",
    },
    notePlaceholder: "Tender first, then resolute: keep the long lines smooth and the runs on “tornar” even, without forcing",
    about: (
      <>
        <p>
          Act 2. Leporello has slipped away after being unmasked, and the others now have no doubt that Don Giovanni killed the
          Commendatore. Don Ottavio asks his friends to go and comfort his beloved Donna Anna in the meantime, and to dry the tears
          from her eyes. Let them tell her that he has gone to avenge the wrongs done to her, and that he will come back only as the
          bearer of news of slaughter and death.
        </p>
        <p>
          Score: No. 21, the Aria (vocal score pages 218–222, 101 bars), from the G. Schirmer vocal score (New York, 1900; IMSLP
          #68957), public domain. Written out from the printed pages: the sung line and the piano each read by two independent
          readers, every disagreement settled on the page by a judge, then checked bar by bar and checked again by a fresh checker
          (one correction: a stray p in the left hand of bar 91 removed). Don Ottavio's part, printed in the treble clef, is written
          at sounding pitch. Bar 78 has the fermatas of the cadenza point; no cadenza is written. The last eight bars are for the
          piano alone. Only the Italian words are kept, with the print's spelling and punctuation (“cìglio” with its accent the first
          time, “di asciugar”, and “vogl' io” split over two notes in bars 85–86).
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1787), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-dalla-sua-pace": {
    portrait: "giovanni:ottavio",
    opera: "Don Giovanni",
    kind: "Aria",
    facts: {
      key: "G major",
      time: "2/4",
      tempo: "No tempo word in this print (most editions have Andante sostenuto), played at ♩ = 34 (an eighth note = 68), about 4¼ minutes, the median of five recordings (Fricsay, Giulini, Davis, Haitink, Karajan); the fermata in bar 36 is held, and its short lead-in is played as grace notes",
    },
    notePlaceholder: "Keep it hushed and long-breathed: one unbroken line over the slow pulse, and let the minor-key middle darken without pushing",
    about: (
      <>
        <p>
          Act 1. Donna Anna has left Don Ottavio alone after telling him that Don Giovanni is the man who killed her father. He can
          hardly believe a nobleman capable of such a crime, but resolves to find out the truth and either free her of her
          suspicion or avenge her. In the aria he sings that his peace of heart hangs on hers: what pleases her brings him back to
          life, what troubles her is his death. When she sighs he sighs with her, her anger and her tears are his own, and there is
          no joy for him while she has none. Mozart wrote the aria for the Vienna performances of 1788, for the tenor Francesco
          Morella; it was not part of the Prague première.
        </p>
        <p>
          Score: No. 10b, the Aria (vocal score pages 95–97, 74 bars), from the G. Schirmer vocal score (New York, 1900; IMSLP
          #68957), public domain. Written out from the printed pages: the sung line and the piano each read by two independent
          readers, every disagreement settled on the page by a judge, then checked bar by bar and checked again by a fresh checker.
          Don Ottavio's part, printed in the treble clef, is written at sounding pitch. After the fermata in bar 36 the print gives a
          short unmeasured lead-in in small notes, written here as grace notes. In bar 21 the right hand's F is an F natural, which
          the print leaves unmarked. The last four bars are for the piano alone. Only the Italian words are kept, with the print's
          spelling and punctuation (“quell' ira”, “le incresce”, and “ch'a lei” once in bar 41).
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1787; this aria 1788), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-non-mi-dir": {
    portrait: "giovanni:anna",
    opera: "Don Giovanni",
    kind: "Recitative and rondo",
    facts: {
      key: "F major (the rondo; the recitative has no key signature)",
      time: "4/4 for the recitative; the rondo's Larghetto in 2/4, its Allegretto moderato in 4/4",
      tempo: "The recitative's Risoluto opening at ♩ = 84 and its Larghetto at ♩ = 28 (three times slower, a proportion chosen for this app), then the rondo's Larghetto at ♩ = 30 and Allegretto moderato at ♩ = 104; about 7 minutes in all (the recitative about 2, the rondo about 5¼), from the median lengths of five recordings with the recitative and the rondo on separate tracks (Busch, Fricsay, Giulini, Davis, Böhm), the rondo divided between its two sections as in Haitink's and Muti's, which put the Allegretto moderato on its own track",
    },
    notePlaceholder: "Tender, not cold: let the Larghetto breathe and keep the Allegretto's runs light, as a promise rather than a display",
    about: (
      <>
        <p>
          Act 2. Don Ottavio has just called Donna Anna cruel for putting off their wedding. No, she answers: it grieves her too
          much to keep from him the happiness they have both wanted for so long, but what would the world say? He must not tempt
          her constancy; love pleads for him in her heart already. In the rondo she begs him not to call her cruel: he knows how she
          has loved him and how faithful she is. He must calm his torment if he does not want her to die of grief; perhaps one day
          heaven will take pity on her.
        </p>
        <p>
          Score: No. 23, the Recitativo e Rondo (vocal score pages 251–256, 116 bars), from the G. Schirmer vocal score (New York,
          1900; IMSLP #68957), public domain. Written out from the printed pages: the sung lines and the piano each read by two
          independent readers, every disagreement settled on the page by a judge, then checked bar by bar and checked again by a
          fresh checker (two corrections: the syllable “non” in bar 43, and no staccato dots in the left hand in bar 30). The first
          bar is also the last bar of the recitative before: it opens with Don Ottavio's “-dele!”, the end of his “Crudele!”, and
          he sings nothing else here. The recitative is bars 1–15; the rondo starts at bar 16 (Larghetto) and turns to Allegretto
          moderato at bar 64; its last four bars are for the piano alone. Only the Italian words are kept, with the print's
          spelling and punctuation (“oh Dio!”, “nostr' alma”).
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1787), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-vedrai-carino": {
    portrait: "giovanni:zerlina",
    opera: "Don Giovanni",
    kind: "Aria",
    facts: {
      key: "C major",
      time: "3/8 throughout",
      tempo: "Grazioso, played at ♩ = 44 (an eighth note = 88), about 3½ minutes, the median of five recordings (Fricsay, Giulini, Böhm, Haitink, Karajan); the fermatas on “sta?” and on the last “quà!” are held; Mozart gives the word only",
    },
    notePlaceholder: "Tender and teasing, never heavy: let the 3/8 sway and keep “sentilo battere” light as a heartbeat",
    about: (
      <>
        <p>
          Act 2. Don Giovanni, disguised as Leporello, has sent Masetto's armed friends off in all directions and beaten him.
          Zerlina finds him groaning on the ground and comforts him: if he is good, she has a fine remedy for him, a natural one,
          not at all unpleasant, that no apothecary can make. It is a balm she carries with her, and she will give it to him if he
          wants to try it. Does he want to know where she keeps it? She lays his hand on her heart: feel it beating, touch me here.
          Masetto is on stage but does not sing.
        </p>
        <p>
          Score: No. 18, the Aria (vocal score pages 184–187, 104 bars), from the G. Schirmer vocal score (New York, 1900; IMSLP
          #68957), public domain. Written out from the printed pages: the sung line and the piano each read by two independent
          readers, every disagreement settled on the page by a judge, then checked bar by bar and checked again by a fresh checker.
          Two misprints are corrected: in bar 82 Zerlina's E is a dotted eighth, as in bars 78 and 80, and in bar 4 the left hand
          gets a sixteenth rest to fill the bar. Only the Italian words are kept, with the print's spelling and punctuation (“t'el”,
          “quà”, and the added “no” in “non lo sa far, no”).
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1787), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-ah-pieta-signori-miei": {
    portrait: "giovanni:leporello",
    opera: "Don Giovanni",
    kind: "Aria",
    facts: {
      key: "G major",
      time: "4/4 (common time)",
      tempo: "Allegro assai, played at ♩ = 242 (a half note = 121), about 1¾ minutes, the median of five recordings (Giulini, Böhm, Fricsay, Haitink, Jacobs); Mozart gives the words only",
    },
    notePlaceholder: "Quick and nervous, never shouted: each excuse to a different listener, the patter clear, edging towards the door",
    about: (
      <>
        <p>
          Act 2. Leporello, wearing his master's hat and cloak, has been caught in the dark courtyard by Donna Elvira, Zerlina,
          Masetto and Don Ottavio, who take him for Don Giovanni and want to kill him. Unmasked, he begs them all for mercy. He
          grants that they are right, but the wrong is not his: his master has robbed him of his innocence. Then he turns to each
          in turn: to Elvira, that she will understand how it came about; about Masetto he knows nothing, and the girl can say that
          he has spent the last hour roaming around with her; to Ottavio he stammers about a fright, a mishap, light outside and
          dark inside, no way out, the door, the wall. While he talks he edges towards the door, and if he had only known, he
          would have run off that way, and he does.
        </p>
        <p>
          Score: No. 20, the Aria (vocal score pages 213–217, 106 bars), from the G. Schirmer vocal score (New York, 1900; IMSLP
          #68957), public domain. Written out from the printed pages: the sung line and the piano each read by two independent
          readers, every disagreement settled on the page by a judge, then checked bar by bar and checked again by a fresh checker.
          In bar 55 the print gives the voice one extra note for the English words only; it is kept, with no Italian word. The
          last four bars are for the piano alone. Only the Italian words are kept, with the print's spelling and punctuation
          (“Dò”, “sò” and “quà” with their accents, “Ah voi, Signore!”, “È un oretta”, “dentro oscuro”, “là porta”, “io me-ne vo”
          joined as one word, and the full stop after “per” in bar 97).
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1787), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-meta-di-voi": {
    portrait: "giovanni:dongiovanni",
    opera: "Don Giovanni",
    kind: "Aria",
    facts: {
      key: "F major",
      time: "4/4 (common time), after a one-sixteenth upbeat",
      tempo: "Andante con moto, played at ♩ = 114, about 3 minutes, the median of five recordings (Fricsay, Giulini, Klemperer, Böhm, Karajan); Mozart gives the words only",
    },
    notePlaceholder: "You are Giovanni playing Leporello: brisk and businesslike, giving orders with a straight face, enjoying the joke",
    about: (
      <>
        <p>
          Act 2. Don Giovanni, still in Leporello's hat and cloak, runs into Masetto and a band of armed peasants out hunting for him.
          Passing himself off as his own servant, he takes charge: half of them are to go one way and half the other, and search
          quietly, for the man cannot be far. If they find a man and a girl strolling in the square, or someone courting under a
          window, they should strike: that will be his master, in a hat with white plumes, a great cloak and a sword at his side.
          He hurries them off, and keeps Masetto alone with him: the two of them have the rest to do, and Masetto will soon see what.
        </p>
        <p>
          Score: No. 17, the Aria (vocal score pages 177–182, 85 bars), from the G. Schirmer vocal score (New York, 1900; IMSLP
          #68957), public domain. Written out from the printed pages: the sung line and the piano each read by two independent
          readers, every disagreement settled on the page by a judge, then checked bar by bar and checked again by a fresh checker.
          The aria begins with a one-sixteenth upbeat, written as a short first bar. The piano's left hand in bar 7 is garbled in the
          print and is written as in the parallel bar 50. The last eight bars are for the piano alone. Only the Italian words are
          kept, with the print's spelling and punctuation (“quà” with its accent, “sia” and the added “no!”, “uom'”, “passeggiam”,
          “dobbiam”, and “allamor”, which the print divides al-la-mor without an apostrophe in bar 15).
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1787), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-a-cenar-teco": {
    portrait: "giovanni:dongiovanni",
    opera: "Don Giovanni",
    kind: "Finale",
    facts: {
      key: "D minor (one flat), closing on a D major chord",
      time: "4/4 (common time) throughout: Andante, then Allegro from bar 122",
      tempo: "Andante at ♩ = 82, then Allegro at ♩ = 163, about 7 minutes in all, the median of five recordings with this scene on its own track or tracks (Giulini, Fricsay, Davis, Haitink, Barenboim), divided between the two sections as in Giulini's, Haitink's and Barenboim's, which put “Da qual tremore” on its own track; Mozart gives the words only",
    },
    notePlaceholder: "The statue's lines slow and immovable, Giovanni's defiant and quick, Leporello's whispered asides; then the Allegro's terror",
    about: (
      <>
        <p>
          Act 2, the finale. Don Giovanni is at supper when the statue of the Commendatore, whom he killed, comes in: it was
          invited, and it has come. Giovanni, astonished, orders Leporello to bring another supper, while Leporello, hiding, shakes
          as if with fever. The statue will not eat mortal food: other cares have brought it down from heaven. It asks Giovanni to
          come to supper with it in turn. Leporello begs him to refuse, but Giovanni will not be called a coward, accepts, and gives
          the statue his hand. Its grip is ice. Repent, it says, this is your last moment; again and again he answers no. Its time
          is up. Flames rise, a chorus of spirits calls him from below to a worse evil, and Giovanni, tormented, is dragged down to
          hell while Leporello looks on in terror.
        </p>
        <p>
          Score: the Act 2 Finale (No. 24) from the statue's entrance, Andante and Allegro (vocal score pages 273–282, 170 bars),
          from the G. Schirmer vocal score (New York, 1900; IMSLP #68957), public domain. Written out from the printed pages: the
          sung lines and the piano each read by two independent readers, every disagreement settled on the page by a judge, then
          checked bar by bar and checked again by fresh checkers, whose seven findings were corrected. Two misprints are corrected
          from the libretto: “mia” for “mai” in bar 74 and “eeffo” for “ceffo” in bar 149. The chorus of spirits (basses, from
          below) sings in bars 131–162 and is heard with the piano; it has no part to practise here. The first three bars and the
          last six are for the piano alone; the piece ends at the fermata before “Ah! dov'è il perfido?”. Only the Italian words are
          kept, with the print's spelling and punctuation (“un altra”, “dond'escono”, “Oibò”, “vè”, “sò”).
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1787), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-leporello-ove-sei": {
    portrait: "giovanni:leporello",
    opera: "Don Giovanni",
    kind: "Recitative",
    facts: {
      key: "One flat in the first bar, carried over from the Introduction; from bar 2 no key signature, as the recitative moves through several keys",
      time: "4/4",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 107, from the median length of five recordings (Fricsay, Giulini, Böhm, Haitink, Karajan; under 40 seconds)",
    },
    notePlaceholder: "Speak it first: two hushed voices in the dark, then Anna and Ottavio bursting in",
    about: (
      <>
        <p>
          Act 1, straight after the Commendatore's death. In the dark Don Giovanni calls softly for his servant. Leporello wants to know
          who is dead, his master or the old man; Giovanni snaps at the stupid question. Leporello congratulates him on a fine night's
          work, forcing the daughter and killing the father; Giovanni says the old man asked for it, and when Leporello asks what Donna
          Anna asked for, he tells him to keep quiet and come away, unless he wants something too. The last four bars begin the next scene:
          Donna Anna returns with Don Ottavio to help her father, and Ottavio swears to shed his blood: where is the villain?
        </p>
        <p>
          Score: the recitative after No. 1 (vocal score pages 19–20, 17 bars), from the G. Schirmer vocal score (New York, 1900; IMSLP
          #68957), public domain. Written out from the printed pages: the sung lines and the piano each read by two independent readers,
          every disagreement settled on the page by a judge, then checked bar by bar and checked again by a fresh checker (clean). Only
          the Italian words are kept, with the print's spelling (“quì”, “amazzar”, “scelerato”).
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1787), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-ma-qual-mai-soffre": {
    portrait: "giovanni:anna",
    opera: "Don Giovanni",
    kind: "Recitative and duet",
    facts: {
      key: "No key signature for the accompanied recitative, which moves through several keys; D minor (one flat) for the duet",
      time: "4/4, the duet starting with Anna's two-beat upbeat bar",
      tempo: "The recitative's Allegro assai at ♩ = 118 and its Maestoso and Andante at ♩ = 59 (half the speed, a proportion chosen for this app); the duet's Allegro and Tempo I at ♩ = 168, its Maestoso at ♩ = 84 and Adagio at ♩ = 56; about 6¾ minutes in all, from the median lengths of five recordings (Fricsay, Giulini, Böhm, Haitink, Karajan), which time the recitative and the duet separately; the fermatas are held; Mozart gives the words only",
    },
    notePlaceholder: "Anna's horror breaks over the orchestra in the recitative; in the duet, push Fuggi, crudele forward and let the oath ring out",
    about: (
      <>
        <p>
          Act 1, in front of the Commendatore's house. Donna Anna comes back with Don Ottavio and servants with torches and finds her
          father lying dead in his blood. She cries out over his wounds and his deathly face and faints. Ottavio sends for smelling
          salts and has the body carried away. When she comes round she pushes him off, taking him for the murderer, and begs to die
          too; he asks her to look at him, her own love. She asks his pardon, then where her father is; he tells her to put the bitter
          memory aside: in him she has both husband and father. She makes him swear to avenge her father's blood, and he swears it by
          her eyes and by their love, while their hearts are tossed between a hundred feelings.
        </p>
        <p>
          Score: No. 2, Recitativo e Duetto (vocal score pages 20–29, 222 bars), from the G. Schirmer vocal score (New York, 1900; IMSLP
          #68957), public domain. Written out from the printed pages: the sung lines and the piano each read by two independent readers,
          every disagreement settled on the page by a judge, then checked bar by bar and checked again by fresh checkers. Don Ottavio's
          part is written at sounding pitch. Kept as printed: the G sharp in the right hand in bar 74 (probably meant as G natural). Only
          the Italian words are kept, with the print's spelling (“del color di morte”, “fredde le membra”, “Ora ch'è morte”, “ajuti”,
          “rimembrenza” the second time).
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1787), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-orsu-spicciati-presto": {
    portrait: "giovanni:leporello",
    opera: "Don Giovanni",
    kind: "Recitative",
    facts: {
      key: "No key signature: it moves through several keys",
      time: "4/4",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 104, from the median length of five recordings (Fricsay, Giulini, Böhm, Haitink, Karajan; about 1½ minutes)",
    },
    notePlaceholder: "Speak it first: Leporello working up his courage, Giovanni brushing him off, then sniffing the air",
    about: (
      <>
        <p>
          Act 1, a street at dawn. Leporello has something important to say, but first makes his master swear not to get angry, and
          checks that nobody is listening. Then he tells him plainly that he lives like a scoundrel. Giovanni flares up, oath or no oath,
          and Leporello backs down at once. Friends again, Giovanni explains why he is here: he has fallen for a lady who is coming to his
          villa tonight. Suddenly he smells a woman nearby; Leporello marvels at his nose, and the two step aside to watch.
        </p>
        <p>
          Score: the recitative before No. 3 (vocal score pages 30–32, 38 bars), from the G. Schirmer vocal score (New York, 1900; IMSLP
          #68957), public domain. Written out from the printed pages: the sung lines and the piano each read by two independent readers,
          every disagreement settled on the page by a judge, then checked bar by bar and checked again by a fresh checker. The bass E in
          bar 35 is kept without the flat it probably needs, as printed. Only the Italian words are kept, with the print's spelling and
          punctuation (“Siamo soli?”, “Non, ne sò nulla”, “grand' uom”, Leporello's asides in brackets).
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1787), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-chi-e-la": {
    portrait: "giovanni:elvira",
    opera: "Don Giovanni",
    kind: "Recitative",
    facts: {
      key: "No key signature: it moves through several keys",
      time: "4/4",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 87, from the median length of five recordings (Fricsay, Giulini, Böhm, Haitink, Karajan; about 2¾ minutes)",
    },
    notePlaceholder: "Speak it first: Elvira's charge sheet in one breath, Giovanni smooth and evasive, Leporello's asides dry",
    about: (
      <>
        <p>
          Act 1, on a street in Seville. Don Giovanni has stepped forward to console the unknown lady, and she turns: it is Donna
          Elvira. She calls him a monster, a villain, a nest of lies; Leporello admires her choice of words. Giovanni begs her to
          calm down and let him speak, but she lists his crimes: he crept into her house, won her with cunning, vows and flattery,
          called her his wife, and after three days left Burgos and abandoned her. Giovanni says he had his reasons, and Leporello
          agrees. Telling her to ask his servant, Giovanni slips away while Leporello begins a pompous speech. Elvira finds him gone;
          Leporello tells her he is not worth a thought, that she is neither the first nor the last, and points to his book, full
          of the names of his master's conquests in every village and town.
        </p>
        <p>
          Score: the recitative between No. 3 and No. 4 (vocal score pages 38–41, 60 bars), from the G. Schirmer vocal score (New
          York, 1900; IMSLP #68957), public domain. Written out from the printed pages: the sung lines and the continuo each read by
          two independent readers, every disagreement settled on the page by a judge, then checked bar by bar and checked again by
          a fresh checker. The continuo is printed on one bass staff and is written here in the piano's left hand. Where the print
          adds a note for the English words, the Italian rhythm is kept, and in bar 32, where Elvira's bar is printed a sixteenth
          too long, one eighth is read as a sixteenth. Elvira's first words, “Chi è”, are sung in the last bar of the Trio before,
          so this piece begins with her “là?”. Only the Italian words are kept, with the print's spelling and punctuation (“sei
          qui”, “azion si nera”, “fuggi” and “m'inganno” without their accents, and Leporello's “conciossiacosa quando fosse che
          Il quadro non è tondo”).
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1787), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-in-questa-forma-dunque": {
    portrait: "giovanni:elvira",
    opera: "Don Giovanni",
    kind: "Recitative",
    facts: {
      key: "No key signature: it moves through several keys",
      time: "4/4",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 73, from the median length of five recordings (Giulini, Haitink, Karajan, Nézet-Séguin, Currentzis; about half a minute)",
    },
    notePlaceholder: "Speak it first: shock turning to fury, and the last lines already looking ahead to revenge",
    about: (
      <>
        <p>
          Act 1. Leporello has read Donna Elvira his master's catalogue of conquests and left her alone in the street. She sees
          now how she has been treated: the man she loved has betrayed her, and this is the reward that brute gives for her love.
          She wants revenge for her deceived heart. Before he can get away from her she must act and go after him; she feels
          nothing in her breast but vengeance, rage and spite.
        </p>
        <p>
          Score: the recitative between No. 4 and No. 5 (vocal score page 50, 10 bars), from the G. Schirmer vocal score (New York,
          1900; IMSLP #68957), public domain. Written out from the printed page: the sung line and the continuo each read by two
          independent readers, every disagreement settled on the page by a judge, then checked bar by bar by a fresh checker. The
          continuo is printed on one bass staff and is written here in the piano's left hand. In bar 3 the print gives Elvira one
          sixteenth too many; the note on “amor” is read as a sixteenth so the bar adds up. Only the Italian words are kept, with
          the print's spelling and punctuation (“il scellerato”, “all' amor mio!”). Many performances leave this recitative out.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1787), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-giovinette-che-fate-allamore": {
    portrait: "giovanni:zerlina",
    opera: "Don Giovanni",
    kind: "Duet and chorus",
    facts: {
      key: "G major",
      time: "6/8 (after a one-beat upbeat for the piano)",
      tempo: "Allegro, played at ♩ = 181 (a dotted quarter ≈ 60), about 1½ minutes, the median of five recordings (Fricsay, Giulini, Böhm, Haitink, Karajan); Mozart gives the word only",
    },
    notePlaceholder: "A country dance: light and bouncy in two, the chorus answering with la la re la la",
    about: (
      <>
        <p>
          Act 1. In the open country near Don Giovanni's palace, the peasants are celebrating the wedding of Zerlina and Masetto with
          singing and dancing. Zerlina tells the girls not to let their youth slip by: if your heart is bubbling over, here is the
          cure. Masetto tells the young men not to go roaming about: a madcap's fun soon ends, but his has hardly started. Each verse
          ends with the chorus's “Ah, che piacer, che piacer che sarà!” and a refrain of la la re la la, and the two sing the last
          verse together.
        </p>
        <p>
          Score: No. 5, the Duetto e Coro (vocal score pages 50–54, 87 bars), from the G. Schirmer vocal score (New York, 1900; IMSLP
          #68957), public domain. Written out from the printed pages: the sung lines and the piano each read by two independent
          readers, every disagreement settled on the page by a judge, then checked bar by bar and checked again by a fresh checker
          (one piano note corrected). The chorus is printed on two staves and written out as four parts; it is heard with the piano.
          Only the Italian words are kept, with the print's spelling (Giovinetti leggieri, vieni carino for both singers, e suoniamo,
          quà).
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1787), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-manco-male-e-partita": {
    portrait: "giovanni:dongiovanni",
    opera: "Don Giovanni",
    kind: "Recitative",
    facts: {
      key: "No key signature: it moves through several keys",
      time: "4/4 (C)",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 94, from the median length of five recordings (Fricsay, Giulini, Böhm, Haitink, Karajan; about 2¼ minutes)",
    },
    notePlaceholder: "Speak it first: Giovanni all charm, Leporello aside, Zerlina flattered, Masetto stubborn until he sees the sword",
    about: (
      <>
        <p>
          Act 1. Glad to be rid of Elvira, Don Giovanni comes upon the wedding party and greets the peasants: is this a wedding?
          Zerlina says she is the bride, Masetto that he is the groom, at the gentleman's service. Giovanni wants them all to be
          friends and offers them his protection, while Leporello eyes the girls. He orders Leporello to take everyone to his palace,
          give them chocolate, coffee, wine and ham, show them the garden, and above all keep Masetto happy. Masetto will not leave
          Zerlina; she tells him to go, she is in a gentleman's hands. When he protests, Giovanni silences him: if he does not go at
          once, he will be sorry.
        </p>
        <p>
          Score: the recitative between No. 5 and No. 6 (vocal score pages 55–57, 53 bars), from the G. Schirmer vocal score (New
          York, 1900; IMSLP #68957), public domain. Written out from the printed pages: the sung lines and the piano each read by two
          independent readers, every disagreement settled on the page by a judge, then checked bar by bar and checked again by a
          fresh checker. Where the print gives a second rhythm for the English words, the Italian rhythm is kept. Only the Italian
          words are kept, as printed: the asides are in brackets, and the print has C'e without an accent, prescuitti and galeria.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1787), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-alfin-siam-liberati": {
    portrait: "giovanni:dongiovanni",
    opera: "Don Giovanni",
    kind: "Recitative",
    facts: {
      key: "No key signature: it moves through several keys",
      time: "4/4 (C)",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 69, from the median length of five recordings (Fricsay, Giulini, Böhm, Haitink, Karajan; about 2 minutes)",
    },
    notePlaceholder: "Speak it first: Giovanni smooth and flattering, Zerlina tempted but wary",
    about: (
      <>
        <p>
          Act 1. Alone at last with Zerlina, Don Giovanni asks whether he did not get rid of that booby neatly. When she protests that
          Masetto is her husband, he scoffs: how could a nobleman bear to see such a sweet face ill-used by a country lout? Her
          promise is worth nothing; her eyes, lips and dainty fingers were made for another life. Zerlina hesitates: she has heard
          that gentlemen are seldom honest with women. Common people's slander, he says; he will marry her this very moment, in his
          little house nearby.
        </p>
        <p>
          Score: the recitative between No. 6 and No. 7 (vocal score pages 61–63, 35 bars), from the G. Schirmer vocal score (New
          York, 1900; IMSLP #68957), public domain. Written out from the printed pages: the sung lines and the piano each read by two
          independent readers, every disagreement settled on the page by a judge, then checked bar by bar and checked again by a
          fresh checker. Only the Italian words are kept, with the print's spelling (qual for quel, un altra, si belli, giojello).
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1787), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-fermati-scellerato": {
    portrait: "giovanni:elvira",
    opera: "Don Giovanni",
    kind: "Recitative",
    facts: {
      key: "No key signature: it moves through several keys",
      time: "4/4 (C)",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 83, from the median length of five recordings (Fricsay, Giulini, Böhm, Haitink, Karajan; about 45 seconds)",
    },
    notePlaceholder: "Speak it first: Elvira bursting in, Giovanni whispering to each woman in turn, Zerlina caught between them",
    about: (
      <>
        <p>
          Act 1. As Don Giovanni leads Zerlina away, Donna Elvira bars his path: heaven let her overhear his treachery, and she has
          come in time to save this innocent girl from his clutches. Zerlina is dismayed. Giovanni whispers to Elvira that he is only
          amusing himself, and Elvira answers aloud that she knows all too well how he amuses himself. When Zerlina asks whether it is
          true, he tells her softly that the poor woman is in love with him and that, being too kind-hearted, he has to pretend to love
          her back. The recitative runs straight on into Elvira's aria.
        </p>
        <p>
          Score: the recitative between No. 7 and No. 8 (vocal score pages 68–69, 16 bars), from the G. Schirmer vocal score (New York,
          1900; IMSLP #68957), public domain. Written out from the printed pages: the sung lines and the piano each read by two
          independent readers, every disagreement settled on the page by a judge, then checked bar by bar and checked again by a fresh
          checker. Only the Italian words are kept, as printed: Don Giovanni's aside is in brackets, and the print has “queste misera
          innocente” where the libretto has questa.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1787), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-mi-par-choggi-il-demonio": {
    portrait: "giovanni:dongiovanni",
    opera: "Don Giovanni",
    kind: "Recitative",
    facts: {
      key: "No key signature: it moves through several keys",
      time: "4/4",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 83, from the median length of four recordings (Fricsay, Giulini, Böhm, Karajan; just over a minute); the fermata in the last bar is held",
    },
    notePlaceholder: "Speak it first: Giovanni's grumbling asides against his smooth offer of help, then Elvira's outburst",
    about: (
      <>
        <p>
          Act 1. Don Giovanni grumbles that the devil seems to be enjoying himself today, setting himself against all his pleasant
          plans. Don Ottavio and Donna Anna, in mourning, come in: Ottavio says that tears are no use now and that they must think of
          vengeance, and Anna asks Giovanni, as a friend with a generous heart, for his help. Giovanni, relieved that they suspect
          nothing, puts his family, his sword, his possessions and his blood at their service, and asks Anna who has troubled her
          peace. At that moment Donna Elvira comes back and finds him again.
        </p>
        <p>
          Score: the recitative between No. 8 and No. 9 (vocal score pages 71–73, 24 bars), from the G. Schirmer vocal score (New York,
          1900; IMSLP #68957), public domain. Written out from the printed pages: the sung lines and the piano each read by two
          independent readers, every disagreement settled on the page by a judge, then checked bar by bar by a fresh checker. Only the
          Italian words are kept, with the print's spellings (“a' miei”, “perchè”, “fù”, “Donn' Anna”). In bar 19 the print has
          “servivi”, a misprint for “servirvi”: the word is kept as printed and its pronunciation is given as sung. Don Ottavio's
          part, printed in the treble clef an octave above his voice, is written at sounding pitch. The last bar, with Elvira's
          fermata, leads into the quartet “Non ti fidar, o misera”.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1787), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-non-ti-fidar-o-misera": {
    portrait: "giovanni:elvira",
    opera: "Don Giovanni",
    kind: "Quartet",
    facts: {
      key: "B-flat major",
      time: "4/4",
      tempo: "Andante, played at ♩ = 85, about 4 minutes, the median of five recordings (Fricsay, Giulini, Böhm, Haitink, Karajan); Mozart gives the word only",
    },
    notePlaceholder: "Elvira's line is noble, not hysterical: that is what makes Anna and Ottavio doubt. Keep Giovanni's asides quick and quiet",
    about: (
      <>
        <p>
          Act 1. Donna Anna and Don Ottavio have just asked Don Giovanni, as a friend, to help them find her father's murderer, when
          Donna Elvira comes back. She warns Anna not to trust that scoundrel's heart: he has already betrayed her and means to
          betray Anna too. Anna and Ottavio are struck by her noble bearing and her grief. Giovanni tells them the poor girl is out
          of her mind and asks to be left alone with her; Elvira begs them not to believe him. Anna and Ottavio feel a strange
          unease and do not know whom to believe. Ottavio will not leave until he knows the truth; Anna sees no sign of madness in
          Elvira's manner. Giovanni, afraid that going would make them suspicious, hushes Elvira, since people are gathering, while
          she declares that she has lost all caution and will tell everyone what he has done. His lowered voice and changing
          colour begin to decide Anna and Ottavio.
        </p>
        <p>
          Score: No. 9, the Quartet (vocal score pages 73–84, 88 bars), from the G. Schirmer vocal score (New York, 1900; IMSLP
          #68957), public domain. Written out from the printed pages: the sung lines and the piano each read by two independent
          readers, every disagreement settled on the page by a judge, then checked bar by bar and checked again by a fresh checker.
          Don Ottavio's part, printed in the treble clef, is written at sounding pitch. A few piano slurs that pass from one voice
          to another cannot be written in this format and are left out. Only the Italian words are kept, with the print's spelling
          and punctuation (“Il suo dolor”, “Restate, oh Dei”, Elvira's “pavento”, Ottavio's “se non so com' è l'affar”, “il suo
          tratto”, “scelerato”, and Giovanni's “Zitta, zitta”).
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1787), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-povera-sventurata": {
    portrait: "giovanni:dongiovanni",
    opera: "Don Giovanni",
    kind: "Recitative",
    facts: {
      key: "No key signature: it moves through several keys",
      time: "4/4",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 70, from the median length of five recordings (Fricsay, Giulini, Böhm, Haitink, Karajan; under half a minute)",
    },
    notePlaceholder: "Speak it first: smooth concern for Elvira, gallant to Anna, then off in a hurry",
    about: (
      <>
        <p>
          Act 1, after the quartet. Donna Elvira has stormed off, and Don Giovanni makes his excuses: the poor unhappy woman must be
          followed, so that she does nothing desperate. He begs the lovely Donna Anna's pardon, offers his services and says he will
          expect her and Ottavio at his house, then bids his friends goodbye and hurries after Elvira.
        </p>
        <p>
          Score: the recitative after No. 9 (vocal score page 85, 7 bars), from the G. Schirmer vocal score (New York, 1900; IMSLP
          #68957), public domain. Written out from the printed page: the sung line and the piano each read by two independent readers,
          every disagreement settled on the page by a judge, then checked bar by bar and checked again by a fresh checker (clean). It
          runs straight on (“attacca”) into No. 10a. Only the Italian words are kept, with the print's spelling.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1787), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-come-mai-creder-deggio": {
    portrait: "giovanni:ottavio",
    opera: "Don Giovanni",
    kind: "Recitative",
    facts: {
      key: "No key signature: it moves through several keys",
      time: "4/4",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 73, from the median length of five recordings (Fricsay, Giulini, Haitink, Karajan, Nézet-Séguin; about half a minute)",
    },
    notePlaceholder: "Thinking aloud: disbelief first, then the resolve of the last line, which leads into Dalla sua pace",
    about: (
      <>
        <p>
          Act 1. Donna Anna has told Don Ottavio that Don Giovanni is the man who killed her father, demanded vengeance and left.
          Alone, Ottavio cannot believe that a nobleman could be capable of so dark a crime. Every means must be tried to bring the
          truth to light: as her bridegroom and as her friend he feels it is his duty. He will either free her from her mistake
          or avenge her.
        </p>
        <p>
          Score: the recitative between No. 10a and No. 10b (vocal score page 94, 10 bars), from the G. Schirmer vocal score (New
          York, 1900; IMSLP #68957), public domain. Written out from the printed page: the sung line and the continuo each read by
          two independent readers, every disagreement settled on the page by a judge, then checked bar by bar by a fresh checker.
          Don Ottavio's part, printed in the treble clef, is written at sounding pitch; the continuo is printed on one bass staff
          and is written here in the piano's left hand. Only the Italian words are kept, with the print's spelling (“cavaliere”,
          “discoprire”, “Disingannar la voglio”). Mozart wrote this recitative, with the aria “Dalla sua pace” that follows, for
          the Vienna performances of 1788.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1787; this recitative 1788), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-io-deggio-ad-ogni-patto": {
    portrait: "giovanni:leporello",
    opera: "Don Giovanni",
    kind: "Recitative",
    facts: {
      key: "No key signature: it moves through several keys",
      time: "4/4",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 116, from the median length of five recordings (Fricsay, Giulini, Böhm, Karajan, Solti; about 1½ minutes)",
    },
    notePlaceholder: "Tell it as a story: Leporello's report runs on, Giovanni's “Bravo!” lands drier each time",
    about: (
      <>
        <p>
          Act 1. Leporello has made up his mind to leave his mad master for good, but here he comes, as carefree as ever. Giovanni asks
          whether all is going well; it is all going wrong, says Leporello, and tells him the story. He took the peasants to the house,
          kept them busy with chatter, sweet talk and lies, talked Masetto out of his jealousy and got everyone half drunk; then, just
          when the party was at its height, Zerlina turned up with Donna Elvira, who said every bad thing she could think of about
          Giovanni. Leporello let her rage, led her gently out of the garden, locked the door and left her in the street. Giovanni
          cannot praise him enough: Leporello began the job, and he will finish it with the country girls before night falls.
        </p>
        <p>
          Score: the recitative between No. 10b and No. 11 (vocal score pages 97–99, 45 bars), from the G. Schirmer vocal score (New
          York, 1900; IMSLP #68957), public domain. Written out from the printed pages: the sung lines and the piano each read by two
          independent readers, every disagreement settled on the page by a judge, then checked bar by bar by a fresh checker. Where the
          print gives a second rhythm for the English words (bar 12), the Italian rhythm is kept. Only the Italian words are kept, with
          the print's spellings (“quì”, “Giovanino”, “chiacchere”, “ubbriacchi”); where the libretto has “io mi cavai”, the print sets
          “a chiave a mi sottrai”.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1787), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-masetto-senti-un-po": {
    portrait: "giovanni:zerlina",
    opera: "Don Giovanni",
    kind: "Recitative",
    facts: {
      key: "No key signature: it moves through several keys",
      time: "4/4, with a one-beat last bar that leads straight into “Batti, batti”",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 77, from the median length of five recordings (Fricsay, Giulini, Böhm, Karajan, Solti; about 1¼ minutes)",
    },
    notePlaceholder: "Zerlina coaxing, Masetto sulking and then exploding; let her end soft enough to lead into “Batti, batti”",
    about: (
      <>
        <p>
          Act 1, in a garden. Zerlina tries to make up with Masetto, but he will not let her touch him: how could she, on their wedding
          day, go off alone with a stranger and put a mark of shame on an honest peasant? If it were not for the scandal, he would… She
          protests that she was deceived and is not to blame: the gentleman did not so much as touch her fingertips. Let him vent his
          anger on her, kill her if he likes, do anything he wants with her, so long as afterwards they make peace. Her last words lead
          straight into her aria “Batti, batti, o bel Masetto”.
        </p>
        <p>
          Score: the recitative between No. 11 and No. 12 (vocal score pages 104–105, 26 bars), from the G. Schirmer vocal score (New
          York, 1900; IMSLP #68957), public domain. Written out from the printed pages: the sung lines and the piano each read by two
          independent readers, every disagreement settled on the page by a judge, then checked bar by bar by a fresh checker. The last
          bar is the printed one-beat bar before the aria. Only the Italian words are kept, with the print's spellings (“perchè”, and
          “quelche” as one word); in bar 22 the print has “amazzami”, a misprint for “ammazzami”: the word is kept as printed and its
          pronunciation is given as sung.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1787), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-guarda-un-po-come-seppe": {
    portrait: "giovanni:masetto",
    opera: "Don Giovanni",
    kind: "Recitative",
    facts: {
      key: "No key signature: it moves through several keys",
      time: "4/4",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 100, from the median length of five recordings (Fricsay, Giulini, Böhm, Karajan, Solti; under 40 seconds)",
    },
    notePlaceholder: "Masetto's mood turns in a moment: rueful at first, then suspicious once he sees Zerlina's fear",
    about: (
      <>
        <p>
          Act 1. Masetto marvels at how the little witch has talked him round: men really are weak in the head. From inside the house
          Don Giovanni is heard ordering everything to be got ready for a great feast. Zerlina is frightened at the voice of the
          gentleman: he will come, and she wishes she could find a hole to hide in. Masetto's suspicion comes back at once: why is she
          afraid, why has she gone pale? Now he understands: she is afraid he will find out what really went on between them.
        </p>
        <p>
          Score: the recitative between No. 12 and No. 13 (vocal score page 111, 16 bars), from the G. Schirmer vocal score (New York,
          1900; IMSLP #68957), public domain. Written out from the printed page: the sung lines and the piano each read by two
          independent readers, every disagreement settled on the page by a judge, then checked bar by bar by a fresh checker. Don
          Giovanni sings his line from within the house. Only the Italian words are kept, with the print's spellings (“Monsù”,
          “perchè”, “com' è”).
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
  "mozart-si-puo-sapere": {
    portrait: "cosi:alfonso",
    opera: "Così fan tutte",
    kind: "Recitative",
    facts: {
      key: "No key signature: it moves through several keys",
      time: "4/4",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 100, estimated (no separate timing of this recitative was found; about 1 minute)",
    },
    notePlaceholder: "Speak it first: the officers smug and teasing, Alfonso unruffled",
    about: (
      <>
        <p>
          Don Alfonso asks what the two officers are laughing at; surely, says Guglielmo, they have every reason. Teasing, they ask how much he will pay to
          call off the bet: half, says Guglielmo; just twenty-four zecchini, says Ferrando. Alfonso calls them poor innocents and says they will talk again
          before evening; until tomorrow morning they owe him silence and obedience, and they are to wait for his orders in the little garden. Guglielmo
          asks whether they are to have no dinner; Ferrando answers that supper will taste all the better once the battle is won.
        </p>
        <p>
          Score: the recitative after No. 16 (vocal score pages 139–140, 27 bars), from Kurt Soldan's piano reduction in the Edition Peters vocal score
          (Edition Peters Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: the sung lines and the piano each read
          by two independent readers, every disagreement settled on the page by a judge, then checked bar by bar by a fresh checker (one error
          corrected). Where the print gives a second rhythm for the German words, the Italian rhythm is kept. Only the Italian words are kept, with the
          print's spellings (quà, Or bene). The last bar, two beats before “attacca Nr. 17”, is set as 2/4.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-unaura-amorosa": {
    portrait: "cosi:ferrando",
    opera: "Così fan tutte",
    kind: "Aria",
    facts: {
      key: "A major",
      time: "3/8",
      tempo: "Andante cantabile, played at an eighth note = 48 (♩ = 24), from Jacobs (4:59; about 5 minutes); Mozart gives the words only",
    },
    notePlaceholder: "Long, smooth lines on one breath: tender, never pushed",
    about: (
      <>
        <p>
          Guglielmo has asked whether there is to be no dinner; Ferrando answers that love is all the food he needs. A loving breath from their beloved
          will bring sweet refreshment to the heart, and a heart fed on the hope of love has no need of better food. At the end he goes out with Guglielmo
          to wait for Don Alfonso's orders.
        </p>
        <p>
          Score: No. 17, the Aria (vocal score pages 141–143, 80 bars), from Kurt Soldan's piano reduction in the Edition Peters vocal score (Edition
          Peters Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: the sung line and the piano each read by two
          independent readers, every disagreement settled on the page by a judge, a separate sweep for dynamics, slurs and ties, then checked bar by bar
          by a fresh checker (clean). The two tiny notes after the right hand's trills in bars 23–28 are written as grace notes, and the last seven bars
          are for the piano alone. Only the Italian words are kept, with the print's spellings (Un' aura, d'un esca, and “á-morosa” in bar 10).
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-oh-la-saria-da-ridere": {
    portrait: "cosi:alfonso",
    opera: "Così fan tutte",
    kind: "Recitative",
    facts: {
      key: "No key signature: it moves through several keys",
      time: "4/4",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 99, from Jacobs (2:37; about 2½ minutes)",
    },
    notePlaceholder: "Speak it first: Alfonso fishing, Despina full of worldly wisdom and taking charge",
    about: (
      <>
        <p>
          Alone, Don Alfonso wonders whether these two might really be the rare constant women; surely not. Despina reports that her mistresses are in the
          garden complaining to the air and the flies. She would laugh where they cry: when one lover goes, take two; love means pleasure and fun, and when
          it torments you it is no longer love. Alfonso asks how the suitors can win the sisters now that they have gone, and Despina takes charge of the
          whole plot: she has led a thousand men by the nose and can manage two women. She sends him to bring the rich gentlemen with the moustaches to her
          room by the little door, and promises that his friends will be singing victory before tomorrow.
        </p>
        <p>
          Score: the recitative after No. 17 (vocal score pages 144–147, 65 bars), from Kurt Soldan's piano reduction in the Edition Peters vocal score
          (Edition Peters Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: two page ranges, the sung lines and the
          piano each read by two independent readers, every disagreement settled on the page by a judge, then checked bar by bar by a fresh checker
          (clean). Where the print gives a second rhythm for the German words, the Italian rhythm is kept; two bars printed a sixteenth short are filled
          out. Only the Italian words are kept, with the print's spellings (sognarsi, funciulla, attendandomi, macchina, and Don Alfonso's “queste tue
          bestioline”). It ends “segue Nr. 18 Finale”.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-ah-che-tutta-in-un-momento": {
    portrait: "cosi:fiordiligi",
    opera: "Così fan tutte",
    kind: "Finale",
    facts: {
      key: "D major (the last bar, the first of the Allegro, in G major)",
      time: "2/4 (the last bar ¢)",
      tempo: "Andante, played at ♩ = 60, the last bar at the Allegro's ♩ = 166, from Jacobs (whose track for the finale's first 291 bars lasts 7:35; this section about 2 minutes); Mozart gives the word only",
    },
    notePlaceholder: "Two sisters, one long sigh: legato, sotto voce, the lines answering each other",
    about: (
      <>
        <p>
          The Act 1 finale opens in a little garden. Alone, Fiordiligi and Dorabella lament that their whole fate has changed in a single moment: life is now
          a sea of torment. As long as the cruel stars left them their dear loves, they did not know what sorrow or pining was. They do not know that
          Despina and Don Alfonso have a new plan for them.
        </p>
        <p>
          Score: the first section of the Act 1 Finale, No. 18 (vocal score pages 148–152, bars 1–62 of 697), from Kurt Soldan's piano reduction in the
          Edition Peters vocal score (Edition Peters Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: the whole
          finale read in fifteen page ranges, the sung lines and the piano each by two independent readers, every disagreement settled on the page by a
          judge, a separate sweep for dynamics and other marks, then checked by nine fresh proofreaders (three fixes). The last bar is the first bar of the
          Allegro, because the sisters' last syllable falls on its first beat; it also opens “Si mora si, si mora”. Only the Italian words are kept, with
          the print's spellings (Finchè, cos' eran, and the sisters' added “no!”).
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-si-mora-si-si-mora": {
    portrait: "cosi:ferrando",
    opera: "Così fan tutte",
    kind: "Finale",
    facts: {
      key: "G major",
      time: "¢ (alla breve), then 4/4 from “Il tragico spettacolo” (bar 45)",
      tempo: "Allegro, played at ♩ = 166 (a half note = 83), from Jacobs (whose track for the finale's first 291 bars lasts 7:35; this section about 2 minutes); Mozart gives the word only",
    },
    notePlaceholder: "Mock tragedy played dead straight: the men's despair over the top, the sisters truly frightened",
    about: (
      <>
        <p>
          Off stage, the two 'Albanians' cry that they will die to satisfy the cruel women, while Don Alfonso begs them to wait: there is still hope. The
          sisters are terrified by the shouting. The men burst in with cups, drink what they say is arsenic and throw the cups away; Don Alfonso confirms
          the poison will kill them in a few moments, and they beg the cruel women at least to come near and pity them. The sisters find the tragic sight
          freezes their hearts, and all five say the sunlight is growing dark and they tremble too much to speak. The audience knows the poison is a fake.
        </p>
        <p>
          Score: the second section of the Act 1 Finale, No. 18 (vocal score pages 152–158, bars 62–137 of 697), from Kurt Soldan's piano reduction in
          the Edition Peters vocal score (Edition Peters Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: the
          whole finale read in fifteen page ranges, the sung lines and the piano each by two independent readers, every disagreement settled on the page by
          a judge, a separate sweep for dynamics and other marks, then checked by nine fresh proofreaders (three fixes). The first bar is also the last bar
          of “Ah che tutta in un momento”: the sisters' “me” on its first beat belongs to that section. Only the Italian words are kept, with the print's
          spellings (Si mora si, oh Dei, Don Alfonso's “in pocchi istanti”, the officers' “il tristo effetto”).
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-giacche-a-morir-vicini": {
    portrait: "cosi:alfonso",
    opera: "Così fan tutte",
    kind: "Finale",
    facts: {
      key: "E♭ major",
      time: "4/4",
      tempo: "Allegro (no new word printed: the Allegro of “Si mora” goes on), played at ♩ = 166, from Jacobs (whose track for the finale's first 291 bars lasts 7:35; this section about 3¾ minutes)",
    },
    notePlaceholder: "Panic, then curiosity: the sisters edging closer, the officers barely keeping their faces straight",
    about: (
      <>
        <p>
          Since the poor men are about to die, Don Alfonso tells the sisters at least to show them some pity. The sisters call for help, then for Despina,
          who comes in and thinks the two are dead or dying; Don Alfonso tells her they poisoned themselves in despair. Despina says it would be shameful to
          abandon them: the sisters must hold them up while she and Alfonso run for a doctor and an antidote. Alone with the 'dying' men, the sisters are
          dismayed, while the officers say aside that no comedy could be better. The sisters edge closer, admire the interesting faces, find the heads cold
          and the pulses faint, and say these deaths would make them weep; aside, the officers note that the sisters' pity may end in love.
        </p>
        <p>
          Score: the third section of the Act 1 Finale, No. 18 (vocal score pages 159–168, bars 138–291 of 697), from Kurt Soldan's piano reduction in
          the Edition Peters vocal score (Edition Peters Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: the
          whole finale read in fifteen page ranges, the sung lines and the piano each by two independent readers, every disagreement settled on the page by
          a judge, a separate sweep for dynamics and other marks, then checked by nine fresh proofreaders (three fixes). It starts at the change to E♭
          major, with Don Alfonso's first words. Only the Italian words are kept, with the print's spellings (Giacchè, “Nessuno o Dio”, pur troppo,
          Dorabella's fredissima, gliel').
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-eccovi-il-medico": {
    portrait: "cosi:alfonso",
    opera: "Così fan tutte",
    kind: "Finale",
    facts: {
      key: "G major",
      time: "3/4",
      tempo: "Allegro, played at ♩ = 137, from Jacobs (3:00)",
    },
    notePlaceholder: "Despina's mock doctor: pompous Latin, a pedant's patter, then the magnet with a flourish",
    about: (
      <>
        <p>
          Don Alfonso brings in the doctor; aside, the officers recognise Despina in disguise. She greets the ladies in mock Latin and boasts that she
          speaks Greek, Arabic, Turkish, Vandal, Swabian and Tartar; Alfonso tells her to keep her languages and look at the patients. She asks the cause
          and nature of the potion, hot or cold, a little or a lot, at once or in doses, and the sisters and Alfonso explain: arsenic, out of love, in one
          gulp. Despina touches the men with a magnet, the mesmeric stone first found in Germany and made famous in France; they twitch and shake while
          the sisters hold their foreheads, then look around and recover, and the sisters and Alfonso declare the doctor worth a fortune.
        </p>
        <p>
          Score: the fourth section of the Act 1 Finale, No. 18 (vocal score pages 169–177, bars 292–428 of 697), from Kurt Soldan's piano reduction in
          the Edition Peters vocal score (Edition Peters Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: the
          whole finale read in fifteen page ranges, the sung lines and the piano each by two independent readers, every disagreement settled on the page by
          a judge, a separate sweep for dynamics and other marks, then checked by nine fresh proofreaders (three fixes). It ends with the bar of rest under
          a fermata before the Andante. Only the Italian words are kept, with the print's spellings (Despina's “so il turco e il vandalo” and “lo sveco”,
          Mesmerica, nell' Alemagna, corraggio, fù, sù) and the officers' aside in brackets.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-dove-son-cosi": {
    portrait: "cosi:ferrando",
    opera: "Così fan tutte",
    kind: "Finale",
    facts: {
      key: "B♭ major",
      time: "4/4",
      tempo: "Andante, played at ♩ = 56, from Jacobs (3:58; about 4 minutes); Mozart gives the word only",
    },
    notePlaceholder: "The men's mock-heroic awakening, the sisters prim, Despina and Alfonso soothing: everyone acting",
    about: (
      <>
        <p>
          The two men rise and ask where they are: before Jove's throne? Is this Pallas or Venus? No, each says, she is the goddess of his soul, known by
          her sweet face and her hand. Despina and Don Alfonso tell the sisters not to be afraid: these are after-effects of the poison. The sisters say such
          grimaces offend their honour, while the officers, aside, can hardly keep from laughing. When the men beg for a kind look, the sisters feel they
          can resist no longer; Despina and Alfonso promise that the magnetism will end the fit within a few hours.
        </p>
        <p>
          Score: the fifth section of the Act 1 Finale, No. 18 (vocal score pages 177–186, bars 429–484 of 697), from Kurt Soldan's piano reduction in
          the Edition Peters vocal score (Edition Peters Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: the
          whole finale read in fifteen page ranges, the sung lines and the piano each by two independent readers, every disagreement settled on the page by
          a judge, a separate sweep for dynamics and other marks, then checked by nine fresh proofreaders (three fixes). The cut Peters marks from “vi-”
          (bar 33) to “-de” (bar 48) is not made. Only the Italian words are kept, with the print's spellings (poss' io, poch' ore, bell' idol, “or or”,
          printed “or-or”) and the asides in brackets.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-dammi-un-bacio": {
    portrait: "cosi:ferrando",
    opera: "Così fan tutte",
    kind: "Finale",
    facts: {
      key: "D major",
      time: "¢ (alla breve)",
      tempo: "Allegro, played at a half note = 126 (♩ = 252), then Presto from bar 173 at ♩ = 300, from Jacobs (3:17; about 3¼ minutes); Mozart gives the words only",
    },
    notePlaceholder: "Fury against glee: the sisters' outrage in long lines, the other four chattering underneath",
    about: (
      <>
        <p>
          Each man begs the sister he is courting for one kiss, or he will die here. The sisters are outraged, but Despina and Don Alfonso tell them to
          humour the men out of kindness. The sisters refuse: too much is asked of a faithful, honest lover, and their faith and hearts are insulted. Aside,
          Despina and Alfonso laugh at the merriest little scene in the world and are sure such fire will turn to love; the officers cannot tell whether the
          anger is feigned or real, and would not want it to end in love. The sisters tell the 'poisoned' men to go to the devil, or they will be sorry; the
          act ends in this quarrel, with the sisters still faithful.
        </p>
        <p>
          Score: the sixth and last section of the Act 1 Finale, No. 18 (vocal score pages 187–205, bars 485–697 of 697), from Kurt Soldan's piano
          reduction in the Edition Peters vocal score (Edition Peters Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed
          pages: the whole finale read in fifteen page ranges, the sung lines and the piano each by two independent readers, every disagreement settled on
          the page by a judge, a separate sweep for dynamics and other marks, then checked by nine fresh proofreaders (three fixes). The Presto starts at
          bar 173, and the last six bars are for the piano alone. The cut Peters marks from “vi-” (bar 117) to “-de” (bar 145) is not made. Only the
          Italian words are kept, with the print's spellings (quell' ira, Despina's “si cangerà”, Dorabella's “se cresce il mio furor”).
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-andate-la": {
    portrait: "cosi:despina",
    opera: "Così fan tutte",
    kind: "Recitative",
    facts: {
      key: "No key signature: it moves through several keys",
      time: "4/4",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 105, from Jacobs (3:14; about 3¼ minutes)",
    },
    notePlaceholder: "Speak it first: Despina breezy and practical, the sisters scandalised but tempted",
    about: (
      <>
        <p>
          Despina tells the sisters they are odd girls: a woman should treat love lightly, never miss a chance, flirt gracefully and eat the fig without
          throwing away the apple. While their sweethearts are at the war they should “recruit” the two rich, handsome strangers who were ready to die for
          them; aside, she notes that the sisters seem to like the idea. Fiordiligi fears gossip and the wrong done to their fiancés; Despina will let it be
          known that the men come to see her, and says their boldness was only the effect of the poison. What should they do, then? Whatever they like:
          are they flesh and blood or not?
        </p>
        <p>
          Score: the recitative that opens Act 2 (vocal score pages 206–210, 85 bars), from Kurt Soldan's piano reduction in the Edition Peters vocal score
          (Edition Peters Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: two page ranges, the sung lines and the
          piano each read by two independent readers, every disagreement settled on the page by a judge, then checked bar by bar by a fresh checker
          (clean). Where the print gives a second rhythm for the German words, the Italian rhythm is kept. Only the Italian words are kept, with the
          print's spellings (coquettizar, forestieri, Per Bacco) and its asides in brackets. It ends “segue Nr. 19”.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-una-donna-a-quindici-anni": {
    portrait: "cosi:despina",
    opera: "Così fan tutte",
    kind: "Aria",
    facts: {
      key: "G major",
      time: "6/8",
      tempo: "Andante, played at ♩ = 60, then Allegretto at a dotted quarter = 65 (♩ = 97), from Jacobs (3:28; about 3½ minutes); Mozart gives the words only",
    },
    notePlaceholder: "Knowing and playful: Despina enjoying her own lesson",
    about: (
      <>
        <p>
          Despina gives her lesson: at fifteen a woman must know every fashion, where the devil keeps his tail, what is good and what is bad, and the little
          tricks that make men fall in love: how to fake laughter and tears and invent good excuses. She must listen to a hundred at once, talk to a
          thousand with her eyes, give hope to all, handsome or ugly, hide without getting flustered and lie without blushing; then, like a queen on her
          throne, she makes herself obeyed with “I can and I will”. Aside, she sees that the sisters like the lesson: long live Despina, who knows how to
          serve.
        </p>
        <p>
          Score: No. 19, the Aria (vocal score pages 211–215, 99 bars), from Kurt Soldan's piano reduction in the Edition Peters vocal score (Edition Peters
          Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: two page ranges, the sung line and the piano each read
          by two independent readers, every disagreement settled on the page by a judge, a separate sweep for dynamics and other marks, then checked bar by
          bar by two fresh checkers (one error corrected). The cut Peters marks from “vi-” (bar 36) to “-de” (bar 66) is not made: the whole aria is here.
          Only the Italian words are kept, with the print's spellings (quindici, Dee) and the aside in brackets.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-sorella-cosa-dici": {
    portrait: "cosi:fiordiligi",
    opera: "Così fan tutte",
    kind: "Recitative",
    facts: {
      key: "No key signature: it moves through several keys",
      time: "4/4",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 98, from Jacobs (1:40; about 1⅔ minutes)",
    },
    notePlaceholder: "Speak it first: Fiordiligi hesitant, Dorabella persuasive and already decided",
    about: (
      <>
        <p>
          Alone, Fiordiligi thinks Despina is mad and that girls already promised in marriage should not do such things. Dorabella sees no harm: if their
          fiancés never hear of it, that is the end of it, and if they do, the sisters will say the men came for Despina. Amusing themselves a little so as
          not to die of melancholy is not breaking faith. Fiordiligi gives in, but will not take the blame if trouble comes of it. Dorabella asks which of
          the two dandies she wants: “You decide.” She already has.
        </p>
        <p>
          Score: the recitative after No. 19 (vocal score pages 216–218, 41 bars), from Kurt Soldan's piano reduction in the Edition Peters vocal score
          (Edition Peters Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: the sung lines and the piano each read
          by two independent readers, every disagreement settled on the page by a judge, then checked bar by bar by a fresh checker (clean). Where the
          print gives a second rhythm for the German words, the Italian rhythm is kept. Only the Italian words are kept, with the print's spellings (suo
          vero dritto, sàpran, fê, scieglier). It ends at the double bar before No. 20.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-prendero-quel-brunettino": {
    portrait: "cosi:dorabella",
    opera: "Così fan tutte",
    kind: "Duetto",
    facts: {
      key: "B♭ major",
      time: "2/4",
      tempo: "Andante, played at ♩ = 60, estimated (about 2½ minutes; no timing was found); Mozart gives the word only",
    },
    notePlaceholder: "Light and teasing: two sisters sharing out the suitors, each delighted with her own plan",
    about: (
      <>
        <p>
          Dorabella will take the dark one, who seems the wittier; Fiordiligi will laugh and joke with the fair one. Dorabella will answer his sweet words
          playfully, Fiordiligi will imitate the other's sighs, and they imagine the men's “my love, I am dying” and “my lovely treasure”. Both look forward
          to the fun. The audience knows that the two men they are sharing out are their own fiancés in disguise, each now courting the other's sweetheart.
        </p>
        <p>
          Score: No. 20, the Duetto (vocal score pages 219–223, 78 bars), from Kurt Soldan's piano reduction in the Edition Peters vocal score (Edition
          Peters Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: two page ranges, the sung lines and the piano
          each read by two independent readers, every disagreement settled on the page by a judge, a separate sweep for dynamics and other marks, then
          checked bar by bar by a fresh checker (clean). The first bar is the one-eighth upbeat, and the last four bars are for the piano alone. Only the
          Italian words are kept, with the print's spellings (vo un po, dell' altro).
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-ah-correte-al-giardino": {
    portrait: "cosi:alfonso",
    opera: "Così fan tutte",
    kind: "Recitative",
    facts: {
      key: "No key signature: it moves through several keys",
      time: "4/4",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 100, estimated (Jacobs times this recitative together with No. 21; about ½ minute)",
    },
    notePlaceholder: "Speak it first: Alfonso bustling and full of promise, Dorabella curious",
    about: (
      <>
        <p>
          Don Alfonso hurries the sisters off to the garden: there is merriment, music and singing, a brilliant show, pure enchantment. Dorabella asks
          what on earth it can be; they will soon see. They go out, and the curtain closes for the change to the garden by the sea. Fiordiligi is on
          stage but does not sing.
        </p>
        <p>
          Score: the recitative after No. 20 (vocal score page 223, 9 bars), from Kurt Soldan's piano reduction in the Edition Peters vocal score
          (Edition Peters Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed page: the sung lines and the piano each read
          by two independent readers, every disagreement settled on the page by a judge, a separate sweep for marks, then checked bar by bar by a fresh
          checker (clean). Where the print gives a second rhythm for the German words, the Italian rhythm is kept. Only the Italian words are kept, with
          the print's punctuation. It ends “segue Nr. 21”.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-secondate-aurette-amiche": {
    portrait: "cosi:ferrando",
    opera: "Così fan tutte",
    kind: "Duetto con Coro",
    facts: {
      key: "E♭ major",
      time: "3/8",
      tempo: "Andante, played at an eighth note = 76 (♩ = 38), from Jacobs (3:12 together with the recitative before it; about 3 minutes); Mozart gives the word only",
    },
    notePlaceholder: "A serenade from a boat: two voices as one, smooth and tender, the chorus answering softly",
    about: (
      <>
        <p>
          In the garden by the sea, from a boat decked with flowers and with a band of musicians, Ferrando and Guglielmo, still disguised as the two
          'Albanians', ask the friendly breezes to favour their desires and carry their sighs to the goddess of their hearts: the breezes have heard their
          sorrows a thousand times, and should repeat it all to their beloved. The chorus of musicians takes up the request. As it ends, the two men step
          ashore wearing chains of flowers, and Don Alfonso and Despina lead them before the sisters, who stand silent and amazed.
        </p>
        <p>
          Score: No. 21, the Duetto con Coro (vocal score pages 224–227, 71 bars), from Kurt Soldan's piano reduction in the Edition Peters vocal score
          (Edition Peters Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: the sung lines and the piano each read
          by two independent readers, every disagreement settled on the page by a judge, a separate sweep for marks, then checked bar by bar by a fresh
          checker (one staccato that is not printed removed). The chorus (sopranos, altos, tenors and basses) has its own staves and is heard with the
          piano; where the print gives the basses no words they sing the tenors'. Only the Italian words are kept, with the print's spellings, including
          its misprint “mici” for miei.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-il-tutto-deponete": {
    portrait: "cosi:alfonso",
    opera: "Così fan tutte",
    kind: "Recitative",
    facts: {
      key: "No key signature: it moves through several keys",
      time: "4/4",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 100, estimated (no separate timing of this recitative was found; about 1 minute)",
    },
    notePlaceholder: "Speak it first: the suitors tongue-tied and overdoing it, the sisters cool, Alfonso losing patience",
    about: (
      <>
        <p>
          Don Alfonso has the servants put the flowers on the little tables and go back to the boat. The sisters ask what this masquerade is. Despina
          urges the men to speak up: Ferrando trembles from head to foot, and Guglielmo says love ties a true lover's limbs. The sisters invite them to
          say freely what they want, but each man tells the other to begin. Don Alfonso loses patience with such old-fashioned manners and tells Despina
          to do with one sister what he will do with the other.
        </p>
        <p>
          Score: the recitative after No. 21 (vocal score pages 227–228, 23 bars), from Kurt Soldan's piano reduction in the Edition Peters vocal score
          (Edition Peters Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: the sung lines and the piano each read
          by two independent readers, every disagreement settled on the page by a judge, a separate sweep for marks, then checked bar by bar by a fresh
          checker (clean). Where the print gives a second rhythm for the German words, the Italian rhythm is kept. Only the Italian words are kept, with
          the print's spellings (Cos' è, incorraggiteli). The last bar, two beats before “segue Nr. 22”, is set as 2/4.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-la-mano-a-me-date": {
    portrait: "cosi:alfonso",
    opera: "Così fan tutte",
    kind: "Quartetto",
    facts: {
      key: "D major",
      time: "6/8, with 4/4 for the Allegro (bars 51–59) and the Presto (from bar 71)",
      tempo: "Allegretto grazioso, played at a dotted quarter = 70 (♩ = 105), Allegro ♩ = 132, Tempo I ♩ = 105, then Presto ♩ = 200, fitted to Jacobs (2:18; about 2½ minutes); Mozart gives the words only",
    },
    notePlaceholder: "Mock-solemn and graceful: Alfonso pleads, the suitors echo him like sighing schoolboys, Despina briskly takes over",
    about: (
      <>
        <p>
          Don Alfonso takes one sister's hand and Despina the other's. Alfonso speaks for the suitors, who echo his last words: a trembling slave asks
          pardon, he offended only for a moment; now he suffers in silence and leaves them in peace; he cannot have what he wants, so he will want what
          he can. When the sisters only look and laugh, Despina answers for them: what is past is past, let the chain of servitude be broken; give your
          arm and sigh no more. Then she and Alfonso slip away, telling each other quietly that the girls will surely fall now.
        </p>
        <p>
          Score: No. 22, the Quartetto (vocal score pages 229–235, 91 bars), from Kurt Soldan's piano reduction in the Edition Peters vocal score
          (Edition Peters Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: two page ranges, the sung lines and
          the piano each read by two independent readers, every disagreement settled on the page by a judge, a separate sweep for marks, then checked bar
          by bar by two fresh checkers (clean). Despina's “Quello ch'è stato” is a short recitative inside the quartet (Allegro, Rezit., then a tempo),
          before Tempo I and the closing Presto. Only the Italian words are kept, with the print's spellings (pò, un schiavo, scordiamci, nè).
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-oh-che-bella-giornata": {
    portrait: "cosi:fiordiligi",
    opera: "Così fan tutte",
    kind: "Recitative",
    facts: {
      key: "No key signature: it moves through several keys",
      time: "4/4",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 80, from Jacobs (3:06; about 3 minutes)",
    },
    notePlaceholder: "Speak it first: awkward small talk, then Guglielmo laying it on thick and Dorabella teasing, wavering, giving in",
    about: (
      <>
        <p>
          The four make small talk about the weather and the trees, and Fiordiligi and Ferrando go off for a walk (“here comes the great crisis”, Ferrando
          whispers). Guglielmo tells Dorabella he feels so ill he could die; she suggests it is what is left of the poison, and teases him. He offers her
          a little gift, a heart, the symbol of his own that burns for her. She tells him not to tempt a faithful heart, but he presses on, and after a
          pause and a sigh she accepts it. Aside, Guglielmo is sorry for his friend (“poor Ferrando!”), but a soldier's honour is at stake.
        </p>
        <p>
          Score: the recitative after No. 22 (vocal score pages 235–238, 62 bars), from Kurt Soldan's piano reduction in the Edition Peters vocal score
          (Edition Peters Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: the sung lines and the piano each read
          by two independent readers, every disagreement settled on the page by a judge, a separate sweep for marks, then checked bar by bar by a fresh
          checker (clean). Where the print gives a second rhythm or extra notes for the German words, the Italian rhythm is kept; bar 57, at the dotted
          barline, is a 2/4 bar. Only the Italian words are kept, with the print's spellings (davvero, Oh Dei, and its misprint “Duc” for Due) and the
          asides in brackets. It ends “segue Nr. 23”.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-il-core-vi-dono": {
    portrait: "cosi:guglielmo",
    opera: "Così fan tutte",
    kind: "Duetto",
    facts: {
      key: "F major",
      time: "3/8",
      tempo: "Andante grazioso, played at an eighth note = 80 (♩ = 40), from Jacobs (4:36; about 4½ minutes); Mozart gives the words only",
    },
    notePlaceholder: "Graceful and flirtatious: the heartbeat in the music, Guglielmo coaxing, Dorabella giving way",
    about: (
      <>
        <p>
          Guglielmo gives Dorabella the heart and asks for hers; she takes his but says hers is no longer hers to give. Then why is it beating here? Each
          says it is their own little heart, which has gone to live with the other, and beats like this. He wants to put his heart where she wears her
          fiancé's portrait; she says it cannot stay there, but he tells her not to look, takes out the portrait and puts the heart in its place. Aside,
          she feels a Vesuvius in her breast and he pities poor Ferrando; then both rejoice in the happy exchange of hearts.
        </p>
        <p>
          Score: No. 23, the Duetto (vocal score pages 239–244, 121 bars), from Kurt Soldan's piano reduction in the Edition Peters vocal score (Edition
          Peters Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: two page ranges, the sung lines and the piano
          each read by two independent readers, every disagreement settled on the page by a judge, a separate sweep for marks, then checked bar by bar by
          a fresh checker (clean, apart from one slur from the right hand's lower to its upper voice that cannot be written in the file). The first bar is
          the one-eighth upbeat. Only the Italian words are kept, with the print's spellings (bell' idolo, me'l, quì) and the asides in brackets.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-barbara-perche-fuggi": {
    portrait: "cosi:ferrando",
    opera: "Così fan tutte",
    kind: "Recitative",
    facts: {
      key: "No key signature: it moves through several keys",
      time: "4/4",
      tempo: "An accompanied recitative: played at ♩ = 70, Allegro ♩ = 110, Adagio ♩ = 45, fitted to Jacobs (1:28; about 1½ minutes)",
    },
    notePlaceholder: "Speak it first: Ferrando pursuing, Fiordiligi flustered and fleeing, then his sudden hope",
    about: (
      <>
        <p>
          Ferrando follows Fiordiligi: why does she run away? She has seen an asp, a hydra, a basilisk; he answers that she sees in him every monster of
          the Libyan deserts. She says he wants to take away her peace; he says he wants to make her happy, and asks only for a look. She tells him to go,
          but he will not until she looks at him less fiercely, and then he sees that she looks at him and sighs.
        </p>
        <p>
          Score: the accompanied recitative before No. 24 (vocal score pages 245–246, 23 bars), from Kurt Soldan's piano reduction in the Edition Peters
          vocal score (Edition Peters Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: the sung lines and the
          piano each read by two independent readers, every disagreement settled on the page by a judge, a separate sweep for marks, then checked bar by
          bar by a fresh checker (clean). Allegro from bar 3, Adagio from bar 13. Where the print gives a second rhythm for the German words, the Italian
          rhythm is kept. Only the Italian words are kept, with the print's spellings (perchè, Pàrtiti). It ends “segue Nr. 24”; a footnote in the print
          says that by Mozart's autograph the aria is left out.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-ah-lo-veggio": {
    portrait: "cosi:ferrando",
    opera: "Così fan tutte",
    kind: "Aria",
    facts: {
      key: "B♭ major",
      time: "¢ (alla breve)",
      tempo: "Allegretto, played at a half note = 63 (♩ = 126), then Allegro at a half note = 80 (♩ = 160), fitted to Jacobs (4:00; about 4 minutes); Mozart gives the words only",
    },
    notePlaceholder: "Ardent and hopeful, then crushed: long lyrical lines that must stay light",
    about: (
      <>
        <p>
          Ferrando is sure that Fiordiligi's lovely soul cannot resist his tears: it is not made to rebel against kindly pity. In her look and her sighs
          a sweet ray of hope flashes into his heart; she is already answering his desires and yielding to love. But she flees and says nothing while he
          pines. He gives up his false hopes: the cruel one has condemned him to die.
        </p>
        <p>
          Score: No. 24, the Aria (vocal score pages 247–252, 134 bars), from Kurt Soldan's piano reduction in the Edition Peters vocal score (Edition
          Peters Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: two page ranges, the sung line and the piano
          each read by two independent readers, every disagreement settled on the page by a judge, a separate sweep for marks, then checked bar by bar by
          a fresh checker (one error corrected: the words in bars 107–108 were one note late). The first bar is the half-bar upbeat. The cut Peters marks
          from “vi-” (bar 58) to “-de” (bar 93) is not made: the whole aria is here. Only the Italian words are kept, with the print's spellings (sà).
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-ei-parte-per-pieta": {
    portrait: "cosi:fiordiligi",
    opera: "Così fan tutte",
    kind: "Recitative and rondò",
    facts: {
      key: "E major (the rondò; the recitative has no key signature)",
      time: "4/4 (the rondò opens with one bar of 2/4)",
      tempo: "The recitative at ♩ = 66, then the rondò Adagio at ♩ = 40 and Allegro moderato at ♩ = 88, fitted to Jacobs (1:32 and 7:40; about 9¼ minutes in all); Mozart gives the words only",
    },
    notePlaceholder: "Remorse first, then resolve: a long, noble line that must never sound heavy",
    about: (
      <>
        <p>
          Alone, Fiordiligi lets Ferrando go: she wants the cause of her weakness out of her sight. She tells herself this torment is the reward for her
          faults: she listened to a new lover's sighs and made a game of another's grief. What she now feels is no longer virtuous love but frenzy,
          anguish, remorse, fickleness and betrayal. In the rondò she begs her absent beloved to forgive the error of a loving soul, which will stay
          hidden among these trees; her courage and constancy will kill this wicked desire and wipe out the memory that shames her. Whom has this vain,
          ungrateful heart ever betrayed? His sincerity deserved a better reward.
        </p>
        <p>
          Score: No. 25, the Recitativo e Rondò (vocal score pages 253–261, 154 bars), from Kurt Soldan's piano reduction in the Edition Peters vocal
          score (Edition Peters Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: three page ranges, the sung line
          and the piano each read by two independent readers, every disagreement settled on the page by a judge, a separate sweep for dynamics, slurs and
          ties, then checked bar by bar by a fresh checker (clean). The recitative, which Peters prints from a manuscript in Florence because it is
          missing from the autograph, is bars 1–26; the rondò starts at bar 27. Two slurs in the right hand that cross from one voice to another, the cut
          signs at bars 106 and 121 and Peters' footnote on the autograph's reading in bars 66 and 96 are not written in. Only the Italian words are
          kept, with the print's spellings (fà, all' error, d'un alma).
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-amico-abbiamo-vinto": {
    portrait: "cosi:ferrando",
    opera: "Così fan tutte",
    kind: "Recitative",
    facts: {
      key: "No key signature: it moves through several keys",
      time: "4/4",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 100, with estimated tempos for the accompanied end (♩ = 60 senza tempo, then 120, 70 Andante and 120 Allegro), fitted to Jacobs (3:45; about 4 minutes)",
    },
    notePlaceholder: "Speak it first: Ferrando crowing, Guglielmo playing for time, then Ferrando's fury",
    about: (
      <>
        <p>
          Ferrando reports triumphantly to Guglielmo: he played the trembling, weeping, dying lover, and Fiordiligi laughed, joked, pretended pity, then
          drove him away, keeping herself pure as a dove for her Guglielmo. Guglielmo embraces him as his faithful Mercury. Sure of Dorabella, Ferrando
          asks how she behaved; Guglielmo hints at doubt, then shows him the little portrait she gave him as a pledge of her love. Ferrando recognises his
          own portrait and wants to tear the heart from her breast; Guglielmo holds him back: is she worth it? Ferrando cannot understand how she forgot
          so many promises so fast and begs for advice, which Guglielmo cannot give.
        </p>
        <p>
          Score: the recitative after No. 25 (vocal score pages 262–268, 97 bars), from Kurt Soldan's piano reduction in the Edition Peters vocal score
          (Edition Peters Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: two page ranges, the sung lines and the
          piano each read by two independent readers, every disagreement settled on the page by a judge, a separate sweep for dynamics and other marks,
          then checked bar by bar by a fresh checker (two errors corrected). Where the print gives a second rhythm for the German words, the Italian rhythm
          is kept. From Ferrando's “Il mio ritratto!” (bar 63) the strings come in, and the recitative stays accompanied to the end. Only the Italian
          words are kept, with the print's spellings (fù, sù, fè, pocchi, s'e diportata) and Guglielmo's asides in brackets. It ends “attacca Nr. 26”.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-donne-mie-la-fate-a-tanti": {
    portrait: "cosi:guglielmo",
    opera: "Così fan tutte",
    kind: "Aria",
    facts: {
      key: "G major",
      time: "2/4",
      tempo: "Allegretto, played at ♩ = 112, estimated from Jacobs (3:33, which includes the end of the recitative; about 3 minutes); Mozart gives the word only",
    },
    notePlaceholder: "Mock-gallant and quick: every “a tanti” a little sharper than the last",
    about: (
      <>
        <p>
          Guglielmo turns to women in general: they play this trick on so many men that, to tell the truth, when lovers complain he begins to sympathise.
          He is fond of women, everyone knows it, and he shows it every day; a thousand times he has drawn his sword for their honour and defended them
          with his words and still more with his heart. They are pretty and lovable, heaven gave them treasures and the Graces surround them from head to
          foot, but they do it to so many that it is past belief, and lovers who cry out certainly have good reason. He goes out.
        </p>
        <p>
          Score: No. 26, the Aria (vocal score pages 268–274, 176 bars), from Kurt Soldan's piano reduction in the Edition Peters vocal score (Edition
          Peters Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: two page ranges, the sung line and the piano
          each read by two independent readers, every disagreement settled on the page by a judge, a separate sweep for dynamics and other marks, then
          checked bar by bar by a fresh checker (clean). The cuts Peters marks (bars 59–85 and 108–136) are not made: the whole aria is here. Only the
          Italian words are kept, with the print's spellings (sà, perchè, segno d'amistà, sino ai piè); Guglielmo's “Ma… ma… ma…” is given without the
          dots.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-tradito-schernito": {
    portrait: "cosi:ferrando",
    opera: "Così fan tutte",
    kind: "Recitative and cavatina",
    facts: {
      key: "C minor (three flats), ending in C major (the recitative has no key signature)",
      time: "4/4, then ¢ (alla breve) for the cavatina",
      tempo: "The recitative at ♩ = 72, its Andante at ♩ = 60 (Jacobs 1:35), then the cavatina Allegro at ♩ = 125, estimated from Jacobs (6:08, which also includes the next recitatives); about 4 minutes in all; Mozart gives the words only",
    },
    notePlaceholder: "Rage that keeps turning into tenderness: let the “io sento” phrases sing",
    about: (
      <>
        <p>
          Alone, Ferrando is torn between thoughts and feelings he cannot sort out: his plight is so strange that no one, not even he, can advise him. Don
          Alfonso will laugh at his stupidity; he will take revenge and wipe that wicked woman out of his heart. Wipe her out? His heart speaks too
          strongly for her. In the cavatina, betrayed and scorned by her faithless heart, he feels that his soul still adores her and hears the voice of
          love for her. Don Alfonso and Guglielmo come in and stand at the back, listening.
        </p>
        <p>
          Score: No. 27, the Recitativo e Cavatina (vocal score pages 275–279, 103 bars), from Kurt Soldan's piano reduction in the Edition Peters vocal
          score (Edition Peters Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: two page ranges, the sung line
          and the piano each read by two independent readers, every disagreement settled on the page by a judge, a separate sweep for dynamics and other
          marks, then checked bar by bar by a fresh checker (clean). The recitative is bars 1–29; the cavatina starts with a one-eighth upbeat (bar 30,
          set as 1/8). Only the Italian words are kept, with the print's spellings (quell' iniqua, quest' alma).
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-bravo-questa-e-costanza": {
    portrait: "cosi:alfonso",
    opera: "Così fan tutte",
    kind: "Recitative",
    facts: {
      key: "No key signature: it moves through several keys",
      time: "4/4, then 6/8 for the last six bars",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 100, estimated (no separate timing of this recitative was found; about 1⅓ minutes)",
    },
    notePlaceholder: "Speak it first: Alfonso amused, Ferrando wounded, Guglielmo smug",
    about: (
      <>
        <p>
          Don Alfonso mocks Ferrando's constancy and promises to give him back his old calm: Fiordiligi has stayed faithful to Guglielmo, Dorabella has not
          to Ferrando, who calls it his shame. Guglielmo, pleased with himself, says one must make distinctions: could a bride fail a Guglielmo? He has
          “a little more merit”, and claims his fifty zecchini. Don Alfonso will pay, but first wants one more experiment: until tomorrow they are his
          slaves, on their word as soldiers. He will show them how foolish it is to sell the bird while it is still on the branch. They go out, and the
          curtain closes.
        </p>
        <p>
          Score: the recitative after No. 27 (vocal score pages 280–282, 35 bars), from Kurt Soldan's piano reduction in the Edition Peters vocal score
          (Edition Peters Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: the sung lines and the piano each read
          by two independent readers, every disagreement settled on the page by a judge, a separate sweep for dynamics and other marks, then checked bar by
          bar by a fresh checker (clean). Where the print gives a second rhythm for the German words, the Italian rhythm is kept. Don Alfonso's last
          lines, from bar 30, are a short arioso in 6/8 with the orchestra. Only the Italian words are kept, with the print's spellings (fù, Guglielmo, and
          Don Alfonso's “Venite; o spero”, where the libretto has io). It ends with the curtain.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-ora-vedo-che-siete": {
    portrait: "cosi:despina",
    opera: "Così fan tutte",
    kind: "Recitative",
    facts: {
      key: "No key signature: it moves through several keys",
      time: "4/4",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 100, estimated (no separate timing of this recitative was found; about 2½ minutes)",
    },
    notePlaceholder: "Speak it first: Despina approving, Dorabella giddy, Fiordiligi in turmoil",
    about: (
      <>
        <p>
          In a room of their house, Despina praises Dorabella for her good sense; Dorabella says she tried to resist, but that little devil could bring
          down a stone, and Despina agrees that girls must seize what little happiness comes their way. Fiordiligi bursts in, blaming them for the state
          she is in: she is in love, and not only with Guglielmo. Delighted, Dorabella pairs them off, the fair one for Fiordiligi and the dark one for
          herself. Fiordiligi reminds her of the two who left only this morning; Dorabella answers that they may die in the war, and if they come back,
          the sisters will be married and a thousand miles away. Fiordiligi says she will master herself; Despina tells her she will never manage it, and
          Dorabella that she had better give in.
        </p>
        <p>
          Score: the recitative before No. 28 (vocal score pages 282–286, 61 bars), from Kurt Soldan's piano reduction in the Edition Peters vocal score
          (Edition Peters Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: the sung lines and the piano each read
          by two independent readers, every disagreement settled on the page by a judge, a separate sweep for dynamics and other marks, then checked bar by
          bar by a fresh checker (clean). Where the print gives a second rhythm for the German words, the Italian rhythm is kept. From bar 56 Peters
          prints the music from a manuscript in Dresden (the autograph's version is in its appendix). Only the Italian words are kept, with the print's
          spellings (forestieri, muojano, pur troppo, Ma brava!). It ends “segue Nr. 28 Arie”.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-e-amore-un-ladroncello": {
    portrait: "cosi:dorabella",
    opera: "Così fan tutte",
    kind: "Aria",
    facts: {
      key: "B♭ major",
      time: "6/8",
      tempo: "Allegretto vivace, played at a dotted quarter = 72 (♩ = 109), from Jacobs (3:07; about 3 minutes); Mozart gives the words only",
    },
    notePlaceholder: "Light and knowing: Dorabella has given in and is enjoying it",
    about: (
      <>
        <p>
          Dorabella has already given in to her new suitor, and tells her sister to do the same. Love, she sings, is a little thief and a little serpent,
          which takes away peace and gives it back as it pleases. It slips through the eyes into the heart, puts the soul in chains and takes away its
          freedom. It brings sweetness and delight if you let it have its way, and fills you with bitterness if you fight it. If it settles in your breast
          and pecks at your heart, do everything it asks: she will do the same. She goes out with Despina.
        </p>
        <p>
          Score: No. 28, the Aria (vocal score pages 287–291, 113 bars), from Kurt Soldan's piano reduction in the Edition Peters vocal score (Edition
          Peters Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: two page ranges, the sung line and the piano
          each read by two independent readers, every disagreement settled on the page by a judge, a separate sweep for dynamics and other marks, then
          checked bar by bar by a fresh checker (clean). The first bar is the one-eighth upbeat, and the last six bars are for the piano alone. The cuts
          Peters marks (“vi-” to “-de”, twice) are not made: the whole aria is here. Only the Italian words are kept, with the print's spellings (ei toglie,
          in catena, quì) and its two misprinted syllables, “sc” for se (bar 46) and “t'empic” for t'empie (bar 59).
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-come-tutto-congiura": {
    portrait: "cosi:fiordiligi",
    opera: "Così fan tutte",
    kind: "Recitative",
    facts: {
      key: "No key signature: it moves through several keys",
      time: "4/4",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 89, from Jacobs (2:55; about 3 minutes)",
    },
    notePlaceholder: "Speak it first: Fiordiligi agitated, then decisive; Despina dry; the men's asides quick and low",
    about: (
      <>
        <p>
          Alone, Fiordiligi feels that everything conspires against her heart; she would rather die than give in, and regrets having opened her heart to
          her sister and her maid. The stranger must never come near her again. Unseen, Guglielmo cheers his faithful “Artemisia”. Then she has an idea:
          she sends Despina with the key to fetch two swords, two hats and two of their fiancés' uniforms, to order six post-horses and to send Dorabella
          to her; Don Alfonso quietly tells Despina to do as she is told, and Despina thinks her mistress has lost her wits. Fiordiligi will wear
          Ferrando's uniform, Dorabella Guglielmo's, and they will join their fiancés at the front, to fight and, if need be, die beside them. She throws
          off her headdress and puts on the hat, while Guglielmo marvels at such love; she hardly recognises herself.
        </p>
        <p>
          Score: the recitative between No. 28 and No. 29 (vocal score pages 292–296, 65 bars), from Kurt Soldan's piano reduction in the Edition Peters
          vocal score (Edition Peters Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: the sung lines and the
          piano each read by two independent readers, every disagreement settled on the page by a judge, then checked bar by bar by a fresh checker
          (clean). Where the print gives a second rhythm for the German words, the Italian rhythm is kept. Bars 40–42 are bracketed in the print, perhaps
          as an optional cut, and are kept. Peters prints this recitative from a manuscript in the Istituto musicale in Florence. Only the Italian words
          are kept, with the print's spellings (minaccierò, molti uniformi, abregè, medesma) and its asides in brackets. It ends “segue Nr. 29 Duett”.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-fra-gli-amplessi": {
    portrait: "cosi:fiordiligi",
    opera: "Così fan tutte",
    kind: "Duetto",
    facts: {
      key: "A major; C major from bar 40; A major again from the Larghetto (bar 76)",
      time: "¢ (alla breve); 3/4 for the Larghetto (bar 76); ¢ again for the Andante (bar 101)",
      tempo: "Adagio at a half note = 25 (♩ = 50), Con più moto at a half note = 35 (♩ = 70), Allegro at a half note = 75 (♩ = 150), Larghetto at ♩ = 40, Andante at a half note = 60 (♩ = 120), fitted to Jacobs (6:14; about 6¼ minutes); Mozart gives the words only",
    },
    notePlaceholder: "Fiordiligi's resolve giving way bar by bar; Ferrando pleading, then triumphant",
    about: (
      <>
        <p>
          In uniform, Fiordiligi imagines reaching her fiancé at the front, unrecognised, and his joy when he knows her. Ferrando comes in: meanwhile, he
          says, he will die of grief. He offers her the sword to strike him with, and will guide her hand if she has not the strength. She begs him to stop:
          she is tormented enough. Both sing that her constancy is beginning to waver; in this score Fiordiligi sings “la mia costanza” and Ferrando “la sua”.
          He asks for her heart or his death, kneels, and offers himself as husband, lover and more; she calls on heaven, tells him he has won, and they
          embrace, while Don Alfonso holds back Guglielmo, who has been watching.
        </p>
        <p>
          Score: No. 29, the Duetto (vocal score pages 296–304, 142 bars), from Kurt Soldan's piano reduction in the Edition Peters vocal score (Edition
          Peters Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: three page ranges, the sung lines and the piano
          each read by two independent readers, every disagreement settled on the page by a judge, a separate sweep for dynamics and other marks, then
          checked bar by bar by a fresh checker (clean). Ferrando's part, printed in the treble clef, sounds an octave lower; the last five bars are for
          the piano alone. The three cuts Peters marks (“vi-” to “-de”) are not made: the whole duet is here. Only the Italian words are kept, with the
          print's spellings (gioja, Abbracciamci) and its readings “in quest' abito verrò” (the libretto has morrò) and Ferrando's “la sua costanza”.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-ah-poveretto-me": {
    portrait: "cosi:guglielmo",
    opera: "Così fan tutte",
    kind: "Recitative",
    facts: {
      key: "No key signature: it moves through several keys",
      time: "4/4",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 98, from Jacobs (2:12; about 2¼ minutes)",
    },
    notePlaceholder: "Speak it first: Guglielmo furious, Ferrando mocking, Alfonso calm and amused",
    about: (
      <>
        <p>
          Guglielmo has seen and heard everything, and rages: he could tear out his beard and claw his skin. Fiordiligi, the Penelope and Artemisia of the
          age, is a hussy, a thief, a bitch. Ferrando comes in and throws Guglielmo's boast of “a little more merit” back at him. They want to punish the
          sisters; Don Alfonso's answer is to marry them. They would sooner marry Charon's boat, Vulcan's cave or the gate of hell. But at heart they love
          their “plucked crows”, says Don Alfonso: nature could not make two women of different stuff just for them, so take them as they are. He will
          arrange a double wedding this evening; first, they are to learn a verse.
        </p>
        <p>
          Score: the recitative between No. 29 and No. 30 (vocal score pages 305–308, 54 bars), from Kurt Soldan's piano reduction in the Edition Peters
          vocal score (Edition Peters Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: the sung lines and the
          piano each read by two independent readers, every disagreement settled on the page by a judge, then checked bar by bar by a fresh checker
          (clean). Where the print gives a second rhythm for the German words, the Italian rhythm is kept; bar 13, printed half a beat short, is filled
          out with an eighth rest. Peters notes that this recitative is missing from the autograph and prints it from a manuscript in Florence. Only the
          Italian words are kept, with the print's spellings (pur troppo, l'eccezzione, spennacchiate). It ends “segue Nr. 30. Andante”.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-tutti-accusan-le-donne": {
    portrait: "cosi:alfonso",
    opera: "Così fan tutte",
    kind: "Andante",
    facts: {
      key: "C major",
      time: "¢ (alla breve)",
      tempo: "Andante, played at a half note ≈ 31½ (♩ = 63), from Jacobs (1:39; about 1⅔ minutes); Mozart gives the word only",
    },
    notePlaceholder: "Worldly and unhurried: Alfonso's maxim, then the motto the officers have to repeat",
    about: (
      <>
        <p>
          Don Alfonso's verse: everyone blames women, but he excuses them if they change their love a thousand times a day. Some call it a vice, some a
          habit; to him it is a need of the heart. A deceived lover should blame not someone else's error but his own, since young and old, beautiful and
          ugly, all do it. “Repeat with me”, he says, and Ferrando and Guglielmo join him in the motto that gives the opera its title: “Così fan tutte!”
        </p>
        <p>
          Score: No. 30, the Andante (vocal score pages 308–309, 26 bars), from Kurt Soldan's piano reduction in the Edition Peters vocal score (Edition
          Peters Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: the sung lines and the piano each read by two
          independent readers, every disagreement settled on the page by a judge, a separate sweep for dynamics and other marks, then checked bar by bar
          by a fresh checker (clean). Ferrando's part, printed in the treble clef, sounds an octave lower. Only the Italian words are kept, with the
          print's spellings (ripetete, where the libretto has ripetetel).
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-vittoria-padroncini": {
    portrait: "cosi:despina",
    opera: "Così fan tutte",
    kind: "Recitative",
    facts: {
      key: "No key signature: it moves through several keys",
      time: "4/4",
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 100, estimated (no separate timing of this recitative was found; about ½ minute)",
    },
    notePlaceholder: "Speak it first: Despina breathless and proud of herself; the men's “Contentissimi” together",
    about: (
      <>
        <p>
          Despina runs in with the news: victory! The ladies are willing to marry the two “Albanians”. In the men's name she has promised that they will
          all leave together in about three days, and she has been sent to find a notary for the contract; the ladies are waiting in their room. Are they
          happy? “Very happy”, answer Ferrando, Don Alfonso and Guglielmo together. Despina, who does not know who the strangers really are, is proud that
          no plan fails once she is in it.
        </p>
        <p>
          Score: the recitative between No. 30 and No. 31 (vocal score page 310, 15 bars), from Kurt Soldan's piano reduction in the Edition Peters vocal
          score (Edition Peters Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed page: the sung lines and the piano each
          read by two independent readers, every disagreement settled on the page by a judge, then checked bar by bar by a fresh checker (clean). Where
          the print gives a second rhythm for the German words, the Italian rhythm is kept. The three men's “Contentissimi” is printed as chords on one
          staff and is given to them in the order the print names them. The last bar is for the piano alone, as the curtain closes. Only the Italian
          words are kept, with the print's spellings (notajo). It ends “segue Nr. 31 Finale”.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-fate-presto-o-cari-amici": {
    portrait: "cosi:despina",
    opera: "Così fan tutte",
    kind: "Finale",
    facts: {
      key: "C major",
      time: "4/4",
      tempo: "Allegro assai, played at ♩ = 173, from Jacobs (1:30); Mozart gives the word only",
    },
    notePlaceholder: "Bustle and brightness: Despina's orders crisp and quick, Don Alfonso pleased with himself",
    about: (
      <>
        <p>
          The Act 2 finale opens in a brightly lit hall, with a table laid for four. Despina hurries the servants: light the torches and lay the table
          richly, for her young mistresses' weddings are arranged; she sends the musicians to their places, and the chorus of servants and musicians
          repeats her orders. Don Alfonso comes in, praises the plenty and the elegance, and promises them a good tip from each bridegroom. The two
          couples are coming: let glad music greet them. As they go, Despina and Don Alfonso agree that no one has ever seen a finer little comedy.
        </p>
        <p>
          Score: the first section of the Act 2 Finale, No. 31 (vocal score pages 311–315, bars 1–65 of 671), from Kurt Soldan's piano reduction in the
          Edition Peters vocal score (Edition Peters Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: the whole
          finale read in fourteen page ranges, the sung lines and the piano each by two independent readers, every disagreement settled on the page by a
          judge, a separate sweep for dynamics and other marks, then checked by eight fresh proofreaders (five fixes). The chorus of servants and
          musicians has its own staves and is heard with the piano. Only the Italian words are kept, with the print's spellings (giá, finchè, quà,
          comediola, Don Alfonso's “s'avanzano”).
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-benedetti-i-doppi-coniugi": {
    portrait: "cosi:fiordiligi",
    opera: "Così fan tutte",
    kind: "Finale",
    facts: {
      key: "E♭ major",
      time: "¢ (alla breve)",
      tempo: "Andante, played at ♩ = 106 (a half note = 53), from Jacobs (4:03); Mozart gives the word only",
    },
    notePlaceholder: "A wedding march: the chorus warm and stately, the four lovers sweet on top, then the quick toasts",
    about: (
      <>
        <p>
          The chorus blesses the double couple and the charming brides, and wishes them children as beautiful as their mothers. The four lovers sing that
          everything here promises joy and love, and that the credit is dear Despina's; they call for more music while they sit down, and the chorus
          blesses them again. At table the 'Albanians' and the sisters trade compliments (“How lovely you are!”, “What eyes!”, “What a mouth!”) and
          clink glasses. The audience knows that each bridegroom is the other sister's fiancé.
        </p>
        <p>
          Score: the second section of the Act 2 Finale, No. 31 (vocal score pages 316–325, bars 66–172 of 671), from Kurt Soldan's piano reduction in
          the Edition Peters vocal score (Edition Peters Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: the
          whole finale read in fourteen page ranges, the sung lines and the piano each by two independent readers, every disagreement settled on the page by
          a judge, a separate sweep for dynamics and other marks, then checked by eight fresh proofreaders (five fixes). The chorus has its own staves and
          is heard with the piano. The cut Peters marks from “vi-” (bar 2) to “-de” (bar 60) is not made. Only the Italian words are kept, with the
          print's spellings (conjugi, gioja).
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-e-nel-tuo-nel-mio-bicchiero": {
    portrait: "cosi:fiordiligi",
    opera: "Così fan tutte",
    kind: "Finale",
    facts: {
      key: "E♭ major",
      time: "3/4 (the last bar ¢)",
      tempo: "Larghetto, played at ♩ = 50, the last bar at the Allegro's ♩ = 186, from Jacobs (whose track for the canon and the notary scene lasts 3:43; this section about 2 minutes); Mozart gives the word only",
    },
    notePlaceholder: "A canon: each voice the same tune, legato and dreamy; Guglielmo's aside muttered against it",
    about: (
      <>
        <p>
          Fiordiligi proposes a toast: in your glass and mine let every thought be drowned, and let no memory of the past remain in our hearts. Ferrando and
          then Dorabella take up the same tune, one after the other, in a canon. Guglielmo will not join in: under his breath he wishes the two vixens
          were drinking poison. They drink.
        </p>
        <p>
          Score: the third section of the Act 2 Finale, No. 31 (vocal score pages 325–328, bars 173–204 of 671), from Kurt Soldan's piano reduction in
          the Edition Peters vocal score (Edition Peters Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: the
          whole finale read in fourteen page ranges, the sung lines and the piano each by two independent readers, every disagreement settled on the page by
          a judge, a separate sweep for dynamics and other marks, then checked by eight fresh proofreaders (five fixes, one of them a tie in bar 3). The
          last bar is the first bar of the Allegro, because the toast's last syllables fall on its first beat; it also opens “Miei signori, tutto è
          fatto”. Only the Italian words are kept, with the print's spellings (the added “ah no” and nò) and Guglielmo's aside in brackets.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-miei-signori-tutto-e-fatto": {
    portrait: "cosi:alfonso",
    opera: "Così fan tutte",
    kind: "Finale",
    facts: {
      key: "E major (the first bar, the end of the toast, in E♭ major)",
      time: "¢ (alla breve)",
      tempo: "Allegro, played at ♩ = 186 (a half note = 93), from Jacobs (whose track for the canon and the notary scene lasts 3:43; this section about 2 minutes)",
    },
    notePlaceholder: "Mock solemnity: Despina's nasal notary droning, the lovers too impatient to listen",
    about: (
      <>
        <p>
          Don Alfonso announces that all is ready: the notary is on the stairs with the marriage contract. He fetches him, and in comes Despina, disguised
          as the notary Beccavivi, wishing them every happiness with professional dignity. Speaking through her nose, she reads out the contract:
          Fiordiligi is joined in marriage to Sempronio and her sister Dorabella to Tizio, ladies of Ferrara and noblemen of Albania. When she reaches the
          dowries, the four cut her short and call for the pen, and Despina and Don Alfonso applaud.
        </p>
        <p>
          Score: the fourth section of the Act 2 Finale, No. 31 (vocal score pages 328–333, bars 204–289 of 671), from Kurt Soldan's piano reduction in
          the Edition Peters vocal score (Edition Peters Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: the
          whole finale read in fourteen page ranges, the sung lines and the piano each by two independent readers, every disagreement settled on the page by
          a judge, a separate sweep for dynamics and other marks, then checked by eight fresh proofreaders (five fixes, one of them in bar 6). The first bar
          is also the last bar of “E nel tuo, nel mio bicchiero”: the words on its first beat belong to that section. Only the Italian words are kept,
          with the print's spellings (notajo, coll' usata, giudiziarie, legitima, soscriviam, Don Alfonso's “eccola”).
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-bella-vita-militar-finale": {
    portrait: "cosi:fiordiligi",
    opera: "Così fan tutte",
    kind: "Finale",
    facts: {
      key: "D major, then E♭ major from the Allegro (bar 21)",
      time: "¢ (alla breve); 3/4 from bar 21; ¢ again from bar 67",
      tempo: "Maestoso, played at ♩ = 90, then Allegro at ♩ = 128, from Jacobs (2:28); Mozart gives the words only",
    },
    notePlaceholder: "Panic in short breaths: Don Alfonso's mock horror, the sisters' frantic whispers, then their long worried line",
    about: (
      <>
        <p>
          Off stage, the soldiers' chorus heard in Act 1 sings again of the fine military life. What is that noise? Don Alfonso goes to look and cries out
          in mock horror: the sisters' fiancés are back and already landing. Everyone is in turmoil. The sisters push the two 'Albanians' into another
          room while Despina and Don Alfonso, and the men, ask what happens if they are seen. Don Alfonso tells the sisters to calm down and trust him,
          while they fear what will become of them if the deception is discovered. The audience knows the returning fiancés are the two men at the table.
        </p>
        <p>
          Score: the fifth section of the Act 2 Finale, No. 31 (vocal score pages 334–340, bars 290–371 of 671), from Kurt Soldan's piano reduction in
          the Edition Peters vocal score (Edition Peters Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: the
          whole finale read in fourteen page ranges, the sung lines and the piano each by two independent readers, every disagreement settled on the page by
          a judge, a separate sweep for dynamics and other marks, then checked by eight fresh proofreaders (five fixes). The soldiers' chorus off stage has
          its own staves and is heard with the piano. Only the Italian words are kept, with the print's spellings (rumor, sung by Despina too, tornaro,
          vò) and the print's li and ci.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-sani-e-salvi": {
    portrait: "cosi:ferrando",
    opera: "Così fan tutte",
    kind: "Finale",
    facts: {
      key: "B♭ major",
      time: "¢ (alla breve)",
      tempo: "Andante, played at ♩ = 88, then Con più moto from bar 48 at ♩ = 120, from Jacobs (2:45); Mozart gives the words only",
    },
    notePlaceholder: "The officers hearty and innocent-seeming, the sisters barely breathing, Despina brazen",
    about: (
      <>
        <p>
          Ferrando and Guglielmo, themselves again, return safe and sound to the arms of their most faithful brides: a royal counter-order has called them
          back. Don Alfonso greets them with pretended surprise. Why so pale and silent? Overcome with joy, says Don Alfonso, while aside the sisters feel
          they may die. Having his trunk put in the next room, Guglielmo finds a notary hidden there; Despina steps out and says she is back from a masked
          ball and came in to change. The men marvel at such a cunning girl, and she at herself; the sisters cannot understand it. Don Alfonso quietly drops
          the contract, and the men pick it up: a marriage contract?
        </p>
        <p>
          Score: the sixth section of the Act 2 Finale, No. 31 (vocal score pages 341–347, bars 372–440 of 671), from Kurt Soldan's piano reduction in
          the Edition Peters vocal score (Edition Peters Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: the
          whole finale read in fourteen page ranges, the sung lines and the piano each by two independent readers, every disagreement settled on the page by
          a judge, a separate sweep for dynamics and other marks, then checked by eight fresh proofreaders (five fixes, two of them in bars 6 and 24). Only
          the Italian words are kept, with the print's spellings (gioja, Guglielmo, cos' è, perchè, stà, notajo, Guglielmo's “cantratto”) and the
          sisters' aside in brackets.
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-giusto-ciel-voi-qui-scriveste": {
    portrait: "cosi:ferrando",
    opera: "Così fan tutte",
    kind: "Finale",
    facts: {
      key: "B♭ major",
      time: "4/4",
      tempo: "Allegro, played at ♩ = 140, then Andante from bar 26 at ♩ = 70, from Jacobs (whose track for this section and “A voi s'inchina” lasts 4:45; this section about 2½ minutes); Mozart gives the words only",
    },
    notePlaceholder: "Mock fury from the men, then the sisters' broken, pleading Andante",
    about: (
      <>
        <p>
          The men read the sisters' signatures: treachery! It is no use denying it, and rivers of blood will flow. They make for the other room, but the
          sisters stop them: they deserve death and ask for it; they see their fault too late, and beg the men to strike with the sword. Asked what
          happened, Fiordiligi points at Don Alfonso and Despina, the cruel one and the seductress. Don Alfonso says it is all too true, and the proof is
          shut in that room. The sisters tremble: why did he give the hidden strangers away?
        </p>
        <p>
          Score: the seventh section of the Act 2 Finale, No. 31 (vocal score pages 347–351, bars 441–495 of 671), from Kurt Soldan's piano reduction in
          the Edition Peters vocal score (Edition Peters Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: the
          whole finale read in fourteen page ranges, the sung lines and the piano each by two independent readers, every disagreement settled on the page by
          a judge, a separate sweep for dynamics and other marks, then checked by eight fresh proofreaders (five fixes, one of them in bar 17). Despina is
          on stage but does not sing. Only the Italian words are kept, with the print's spellings (contradirci, il scoprimento, the men's “si”, fù,
          perchè).
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-a-voi-sinchina": {
    portrait: "cosi:ferrando",
    opera: "Così fan tutte",
    kind: "Finale",
    facts: {
      key: "B♭ major, then C major from bar 25",
      time: "4/4; 3/8 from bar 6; ¢ (alla breve) from bar 36",
      tempo: "Allegretto, played at ♩ = 100, Andante (3/8) at ♩ = 60, Allegretto at ♩ = 100, then Andante con moto at ♩ = 120 (a half note = 60), from Jacobs (whose track for “Giusto ciel” and this section lasts 4:45; this section about 2¼ minutes); Mozart gives the words only",
    },
    notePlaceholder: "Exaggerated bows and mock gallantry from the men, the sisters thunderstruck, then a gentle, forgiving close",
    about: (
      <>
        <p>
          The men come back half in their 'Albanian' costume. With exaggerated bows Ferrando greets Fiordiligi as the knight from Albania; Guglielmo gives
          Dorabella back her portrait in exchange for the little heart; together they salute the magnetic doctor, Despina's disguise in Act 1. The sisters
          and Despina are thunderstruck, and the sisters point at Don Alfonso, who deceived them. He answers that his deception has undeceived their
          lovers, joins the couples' hands, and tells all four to embrace, be quiet and laugh, as he has. The sisters promise to make it up with faith and
          love; the men believe them but will not put it to the test. Despina does not know whether she is awake or dreaming: at least she has played the
          same trick on plenty of others.
        </p>
        <p>
          Score: the eighth section of the Act 2 Finale, No. 31 (vocal score pages 352–358, bars 496–575 of 671), from Kurt Soldan's piano reduction in
          the Edition Peters vocal score (Edition Peters Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed pages: the
          whole finale read in fourteen page ranges, the sung lines and the piano each by two independent readers, every disagreement settled on the page by
          a judge, a separate sweep for dynamics and other marks, then checked by eight fresh proofreaders (five fixes). The natural signs the print puts
          on the trills in bars 19 and 22 are not shown. Only the Italian words are kept, with the print's spellings (dell' Albania, coll' amore, molt'
          altri, gioja, vò, fò, the sisters' “babaro”).
        </p>
        <p>
          Music by Wolfgang Amadeus Mozart and text by Lorenzo Da Ponte (1790), both public domain. The IPA, word meanings and translation were written for this app; the IPA was checked against Nico Castel's published libretti (Leyerle Publications); this app is not affiliated with Castel or his publisher. They have not yet been reviewed by a diction coach.
        </p>
      </>
    ),
  },
  "mozart-fortunato-luom-che-prende": {
    portrait: "cosi:fiordiligi",
    opera: "Così fan tutte",
    kind: "Finale",
    facts: {
      key: "C major",
      time: "¢ (alla breve)",
      tempo: "Allegro molto, played at ♩ = 222 (a half note = 111), from Jacobs (1:44); Mozart gives the words only",
    },
    notePlaceholder: "Sotto voce at first, then full and bright: six voices as one, quick and light to the end",
    about: (
      <>
        <p>
          All six sing the moral together: happy is the man who takes everything the right way, and lets reason guide him through all that happens. What
          makes others weep will make him laugh, and amid the storms of the world he will find calm. The curtain falls.
        </p>
        <p>
          Score: the ninth and last section of the Act 2 Finale, No. 31 (vocal score pages 358–366, bars 576–671 of 671), from Kurt Soldan's piano
          reduction in the Edition Peters vocal score (Edition Peters Nr. 4474, edited by Georg Schünemann), public domain. Written out from the printed
          pages: the whole finale read in fourteen page ranges, the sung lines and the piano each by two independent readers, every disagreement settled on
          the page by a judge, a separate sweep for dynamics and other marks, then checked by eight fresh proofreaders (five fixes). The voices enter sotto
          voce at bar 9, and the last eight bars are for the piano alone. Only the Italian words are kept, with the print's spellings (fà, “si troverà”,
          Don Alfonso's “belba”).
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
