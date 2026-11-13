/**
 * Choral works: requiems, masses, oratorios and passions, each with its chorus parts and its soloists. Written for
 * this app. None has music here yet (`music` stays false until a work's parts can be practised).
 */
export interface ChoralWork {
  id: string;
  title: string;
  /** the key and catalogue number, or the work's other name ("in D minor, K. 626", "The Creation") */
  subtitle: string;
  /** short, as the catalogues name him ("Mozart"): finds the composer's portrait (composers.ts) */
  composer: string;
  composerFull: string;
  /** as a programme gives it: "1742", "c. 1715" */
  year: string;
  /** the language it is sung in (a BCP 47 tag) */
  lang: string;
  about: string;
  /** more credits after "Music by": "Completed by Franz Xaver Süssmayr" */
  credits?: { role: string; name: string }[];
  soloists: string[];
  chorus: ChorusPart[];
  /** its parts can be practised here */
  music: boolean;
}
export type ChorusPart = "Soprano" | "Alto" | "Tenor" | "Bass";

const SATB: ChorusPart[] = ["Soprano", "Alto", "Tenor", "Bass"];
const QUARTET = ["Soprano", "Alto", "Tenor", "Bass"];

export const LANGUAGE_NAMES: Record<string, string> = { en: "English", la: "Latin", de: "German" };

export const CHORAL_WORKS: ChoralWork[] = [
  {
    id: "messiah",
    title: "Messiah",
    subtitle: "",
    composer: "Handel",
    composerFull: "George Frideric Handel",
    year: "1742",
    lang: "en",
    about: "Handel's English oratorio on Bible texts chosen by Charles Jennens, from the prophecy of Christ's coming to the Resurrection. First performed in Dublin in 1742.",
    soloists: QUARTET,
    chorus: SATB,
    music: false,
  },
  {
    id: "mozart-requiem",
    title: "Requiem",
    subtitle: "in D minor, K. 626",
    composer: "Mozart",
    composerFull: "Wolfgang Amadeus Mozart",
    year: "1791",
    lang: "la",
    about: "Mozart's setting of the Latin Mass for the Dead, left unfinished at his death in December 1791 and completed by his pupil Franz Xaver Süssmayr.",
    credits: [{ role: "Completed by", name: "Franz Xaver Süssmayr" }],
    soloists: QUARTET,
    chorus: SATB,
    music: false,
  },
  {
    id: "faure-requiem",
    title: "Requiem",
    subtitle: "in D minor, Op. 48",
    composer: "Fauré",
    composerFull: "Gabriel Fauré",
    year: "1888",
    lang: "la",
    about: "Fauré's setting of the Latin Mass for the Dead. It leaves out the Dies irae and ends with In paradisum. First performed in Paris in 1888; the version for full orchestra followed in 1900.",
    soloists: ["Soprano", "Baritone"],
    chorus: SATB,
    music: false,
  },
  {
    id: "gloria",
    title: "Gloria",
    subtitle: "in D major, RV 589",
    composer: "Vivaldi",
    composerFull: "Antonio Vivaldi",
    year: "c. 1715",
    lang: "la",
    about: "Vivaldi's setting of the Gloria from the Latin Mass, in twelve movements, written for the Ospedale della Pietà in Venice.",
    soloists: ["Soprano I", "Soprano II", "Alto"],
    chorus: SATB,
    music: false,
  },
  {
    id: "coronation-mass",
    title: "Coronation Mass",
    subtitle: "in C major, K. 317",
    composer: "Mozart",
    composerFull: "Wolfgang Amadeus Mozart",
    year: "1779",
    lang: "la",
    about: "Mozart's Mass in C major, written in Salzburg in 1779.",
    soloists: QUARTET,
    chorus: SATB,
    music: false,
  },
  {
    id: "st-john-passion",
    title: "St John Passion",
    subtitle: "BWV 245",
    composer: "Bach",
    composerFull: "Johann Sebastian Bach",
    year: "1724",
    lang: "de",
    about: "Bach's setting of the Passion story from the Gospel of John, first performed in Leipzig on Good Friday 1724.",
    soloists: ["Evangelist (tenor)", "Jesus (bass)", ...QUARTET],
    chorus: SATB,
    music: false,
  },
  {
    id: "creation",
    title: "Die Schöpfung",
    subtitle: "The Creation",
    composer: "Haydn",
    composerFull: "Joseph Haydn",
    year: "1798",
    lang: "de",
    about: "Haydn's oratorio of the Creation, drawn from Genesis and Milton's Paradise Lost. First performed in Vienna in 1798.",
    soloists: ["Gabriel (soprano)", "Uriel (tenor)", "Raphael (bass)", "Eve (soprano)", "Adam (bass)"],
    chorus: SATB,
    music: false,
  },
  {
    id: "brahms-requiem",
    title: "Ein deutsches Requiem",
    subtitle: "Op. 45",
    composer: "Brahms",
    composerFull: "Johannes Brahms",
    year: "1868",
    lang: "de",
    about: "Brahms's Requiem on German Bible texts he chose himself. First performed complete in Leipzig in 1869.",
    soloists: ["Soprano", "Baritone"],
    chorus: SATB,
    music: false,
  },
  {
    id: "christmas-oratorio",
    title: "Weihnachtsoratorium",
    subtitle: "Christmas Oratorio, BWV 248",
    composer: "Bach",
    composerFull: "Johann Sebastian Bach",
    year: "1734",
    lang: "de",
    about: "Bach's six cantatas for the Christmas season, from Christmas Day to Epiphany, first performed in Leipzig in 1734–35.",
    soloists: ["Evangelist (tenor)", ...QUARTET],
    chorus: SATB,
    music: false,
  },
  {
    id: "elijah",
    title: "Elijah",
    subtitle: "Op. 70",
    composer: "Mendelssohn",
    composerFull: "Felix Mendelssohn",
    year: "1846",
    lang: "en",
    about: "Mendelssohn's oratorio on the prophet Elijah, first performed in Birmingham in 1846.",
    soloists: ["Elijah (baritone)", "Soprano", "Alto", "Tenor"],
    chorus: SATB,
    music: false,
  },
];

export const findWork = (id: string): ChoralWork | undefined => CHORAL_WORKS.find((w) => w.id === id);
