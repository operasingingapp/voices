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
// the scores are separate files, fetched when a piece opens (bundled in, they made the app too large to publish)
const scoreUrls = import.meta.glob(["../../data/content/*/score.musicxml", "!../../data/content/cp-fx-*/**"], {
  query: "?url",
  import: "default",
  eager: true,
}) as Record<string, string>;
const scoreText = new Map<string, string>();
const scoreLoading = new Map<string, Promise<void>>();
/** true when the piece's score is loaded and pieceData() can be used */
export const scoreReady = (id: string) => scoreText.has(id);
/** load the piece's score (once) */
export function loadScore(id: string): Promise<void> {
  if (scoreText.has(id)) return Promise.resolve();
  let p = scoreLoading.get(id);
  if (!p) {
    const url = scoreUrls[`../../data/content/${id}/score.musicxml`];
    p = fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`score ${id}: ${r.status}`);
        return r.text();
      })
      .then((t) => void scoreText.set(id, t))
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
  "mozart-e-susanna-non-vien": {
    portrait: "figaro:countess",
    opera: "Le nozze di Figaro",
    kind: "Recitative",
    facts: {
      key: "Begins in C major and moves through several keys, ending ready for Dove sono",
      time: "4/4",
      tempo: "Free, as recitative is sung: the engraving plays it at ♩ ≈ 80–116; Mozart gives no tempo",
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
      tempo: "Recitative, free",
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
      tempo: "Maestoso, Presto, Andante and Allegro in the recitative, taken freely; Allegro maestoso at ♩ = 132, then Allegro assai at ♩ = 152 (about 5 minutes)",
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
      tempo: "Recitative, free",
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
      tempo: "Andante: played here at ♩ = 66 (about 3½ minutes)",
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
      tempo: "Recitative, free",
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
      tempo: "Recitative, free, then Andante a tempo at ♩ = 72",
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
      tempo: "Recitative, free",
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
  "mozart-dove-sono": {
    portrait: "figaro:countess",
    opera: "Le nozze di Figaro",
    kind: "Aria",
    facts: {
      key: "C major",
      time: "Andantino in 2/4, then Allegro in 4/4",
      tempo: "Andantino ♩ = 60, Allegro ♩ = 144: the engraving's numbers, Mozart gives words only",
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
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 116 (about 40 seconds, as in most recordings)",
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
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 112 (about 1:25, as in most recordings)",
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
      tempo: "Free: ♩ = 84, then Andante ♩ = 66 for the last four bars (about 45 seconds, as in most recordings)",
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
      tempo: "Free, as recitative is sung: played here at a speaking pace, ♩ = 92 (about a minute, as in most recordings)",
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
      tempo: "♩ = 124 (about 3:20, as in most recordings): Mozart gives the words only",
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
      tempo: "Free, as recitative is sung: played here at ♩ = 98 (about a minute, as in most recordings)",
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
      tempo: "♪. = 67 (♩ = 100; about 1:12, as in most recordings)",
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
      tempo: "Free, as recitative is sung: played here at ♩ = 98 (about 1:25, as in most recordings)",
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
      tempo: "♩ = 107 (about 55 seconds, as in most recordings)",
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
      tempo: "Free, as recitative is sung: played here at ♩ = 97 (about 1:10, as in most recordings)",
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
      tempo: "Recitative ♩ = 103, Presto ♩ = 176, Allegretto ♩ = 130 (about 3:30 in all, as in most recordings)",
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
      tempo: "Free, as recitative is sung: played here at ♩ = 81 (about 1 minute 25 seconds, as in the recordings by Jacobs and Harnoncourt)",
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
      tempo: "Free, as recitative is sung: played here at ♩ = 81 (about 1 minute 15 seconds, as in the recordings by Jacobs and Harnoncourt)",
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
      tempo: "Allegro molto at ♩ = 160, then Andante at ♩ = 66 (about 6 minutes)",
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
      tempo: "Allegro assai at ♩ = 168, then Più Allegro at ♩ = 192 and Prestissimo at ♩ = 232 (about 4 minutes)",
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
      tempo: "Allegro con spirito at ♩ = 150, then Andante at ♩ = 72, as the score changes tempo (about 4 minutes)",
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
      tempo: "Molto Andante at ♪ = 104, then Allegro at ♩ = 138, as the score changes tempo (about 5½ minutes)",
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
      tempo: "Recitative, free (about 1 minute)",
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
      tempo: "Allegro spirituoso at ♩ = 144 (about 4 minutes)",
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
      tempo: "Recitative, free (about 1 minute)",
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
      tempo: "Allegro assai at ♩ = 144 (about 1 minute)",
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
      tempo: "Recitative, free (under a minute)",
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
      tempo: "Recitative, free (about 1 minute)",
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
      tempo: "Allegro: played here at ♩ = 132 (about 4 minutes)",
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
      tempo: "Allegro assai: played here at ♩ = 152, with the Count's recitative (bars 121-128) at ♩ = 80 (about 4½ minutes)",
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
      tempo: "Free, as recitative is sung: played here at ♩ = 81 (about 4 minutes)",
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
      tempo: "Free, as recitative is sung: played here at ♩ = 83 (about 2 minutes 50 seconds, as in the recordings by Böhm, Harnoncourt and Jacobs)",
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
      tempo: "Free, as recitative is sung: played here at ♩ = 75 (about 45 seconds, as in the recordings by Gui, Harnoncourt and Jacobs)",
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
    scoreXml: scoreText.get(id) ?? "",
    info: PIECE_INFO[id],
  };
}
