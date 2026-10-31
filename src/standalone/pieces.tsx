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
    scoreXml: byId(scores, id, "score.musicxml") as string,
    info: PIECE_INFO[id],
  };
}
