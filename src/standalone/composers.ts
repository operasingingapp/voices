/**
 * The composers' portraits (images/README.md): composer-<id>-portrait.webp (720 × 964) and composer-<id>-face.webp
 * (320 × 320), built from the user's composers.fig by scripts/art/composers.py. Each composer is found by the short
 * name the catalogues use ("Mozart", "Strauss"), so an opera or a choral work finds its composer's picture.
 */
const pics = import.meta.glob("./images/composer-*.webp", { eager: true, import: "default" }) as Record<string, string>;
const pic = (name: string) => pics[`./images/${name}.webp`];

export interface Composer {
  id: string;
  /** as the catalogues name him: "Mozart" */
  name: string;
  portrait?: string;
  face?: string;
  /** what the portrait shows (for screen readers) */
  alt?: string;
}

/** what each portrait shows */
const ALT: Record<string, [string, string]> = {
  arne: ["Arne", "Portrait of Thomas Arne."],
  bach: ["Bach", "Johann Sebastian Bach in a full white curled wig and a dark coat with a white cravat, on red."],
  beethoven: ["Beethoven", "Ludwig van Beethoven with wild dark hair, a white collar and a red scarf under a dark coat, on red."],
  bellini: ["Bellini", "Portrait of Vincenzo Bellini."],
  berlioz: ["Berlioz", "Portrait of Hector Berlioz."],
  bizet: ["Bizet", "Georges Bizet with dark curly hair, a full beard and round spectacles, in a dark coat, on olive green."],
  bononcini: ["Bononcini", "Portrait of Giovanni Bononcini."],
  brahms: ["Brahms", "Johannes Brahms with swept-back hair and a long grey-brown beard, in a dark coat and bow, on deep red."],
  butterworth: ["Butterworth", "Portrait of George Butterworth."],
  caccini: ["Caccini", "Portrait of Giulio Caccini."],
  caldara: ["Caldara", "Portrait of Antonio Caldara."],
  carissimi: ["Carissimi", "Portrait of Giacomo Carissimi."],
  cesti: ["Cesti", "Portrait of Antonio Cesti."],
  chausson: ["Chausson", "Portrait of Ernest Chausson."],
  claraschumann: ["Clara Schumann", "Portrait of Clara Schumann."],
  debussy: ["Debussy", "Portrait of Claude Debussy."],
  decurtis: ["De Curtis", "Portrait of Ernesto De Curtis."],
  dicapua: ["di Capua", "Portrait of Eduardo di Capua."],
  donaudy: ["Donaudy", "Portrait of Stefano Donaudy."],
  donizetti: ["Donizetti", "Portrait of Gaetano Donizetti."],
  duparc: ["Duparc", "Portrait of Henri Duparc."],
  durante: ["Durante", "Portrait of Francesco Durante."],
  dvorak: ["Dvořák", "Portrait of Antonín Dvořák."],
  falla: ["Falla", "Portrait of Manuel de Falla."],
  faure: ["Fauré", "Gabriel Fauré with wavy grey hair and a grey moustache, in a dark coat and black tie, on purple."],
  gasparini: ["Gasparini", "Portrait of Francesco Gasparini."],
  giordani: ["Giordani", "Portrait of Tommaso Giordani."],
  gluck: ["Gluck", "Portrait of Christoph Willibald Gluck."],
  gounod: ["Gounod", "Portrait of Charles Gounod."],
  granados: ["Granados", "Portrait of Enrique Granados."],
  grieg: ["Grieg", "Portrait of Edvard Grieg."],
  hahn: ["Hahn", "Portrait of Reynaldo Hahn."],
  handel: ["Handel", "Portrait of George Frideric Handel."],
  haydn: ["Haydn", "Portrait of Joseph Haydn."],
  ives: ["Ives", "Portrait of Charles Ives."],
  legrenzi: ["Legrenzi", "Portrait of Giovanni Legrenzi."],
  lotti: ["Lotti", "Portrait of Antonio Lotti."],
  mahler: ["Mahler", "Portrait of Gustav Mahler."],
  marcello: ["Marcello", "Portrait of Benedetto Marcello."],
  massenet: ["Massenet", "Portrait of Jules Massenet."],
  mendelssohn: ["Mendelssohn", "Portrait of Felix Mendelssohn."],
  monteverdi: ["Monteverdi", "Portrait of Claudio Monteverdi."],
  mozart: ["Mozart", "Portrait of Wolfgang Amadeus Mozart."],
  obradors: ["Obradors", "Portrait of Fernando Obradors."],
  paisiello: ["Paisiello", "Portrait of Giovanni Paisiello."],
  parisotti: ["Parisotti", "Portrait of Alessandro Parisotti."],
  pergolesi: ["Pergolesi", "Portrait of Giovanni Battista Pergolesi."],
  puccini: ["Puccini", "Giacomo Puccini with dark wavy hair and a moustache, in a brown overcoat and dark tie, on deep red."],
  purcell: ["Purcell", "Portrait of Henry Purcell."],
  quilter: ["Quilter", "Portrait of Roger Quilter."],
  rachmaninoff: ["Rachmaninoff", "Portrait of Sergei Rachmaninoff."],
  ravel: ["Ravel", "Portrait of Maurice Ravel."],
  respighi: ["Respighi", "Portrait of Ottorino Respighi."],
  rosa: ["Rosa", "Portrait of Salvator Rosa."],
  rossini: ["Rossini", "Gioachino Rossini with dark curls and sideburns, a white cravat and a deep red coat, on olive green."],
  rstrauss: ["Strauss", "Richard Strauss with receding wavy hair and a moustache, in a dark coat and high white collar, on dark teal."],
  scarlatti: ["Scarlatti", "Portrait of Alessandro Scarlatti."],
  schumann: ["Schumann", "Portrait of Robert Schumann."],
  somervell: ["Somervell", "Portrait of Arthur Somervell."],
  stradella: ["Stradella", "Portrait of Alessandro Stradella."],
  tchaikovsky: ["Tchaikovsky", "Pyotr Ilyich Tchaikovsky with short grey hair and a white beard, in a dark coat and tie, on purple."],
  torelli: ["Torelli", "Portrait of Giuseppe Torelli."],
  tosti: ["Tosti", "Portrait of Francesco Paolo Tosti."],
  verdi: ["Verdi", "Portrait of Giuseppe Verdi."],
  vivaldi: ["Vivaldi", "Antonio Vivaldi with long wavy red hair, a white lace cravat and a deep red cloak, on red."],
  wagner: ["Wagner", "Richard Wagner in a dark beret, with grey-brown hair and side whiskers, a dark bow and a deep red coat, on olive green."],
  wolf: ["Wolf", "Portrait of Hugo Wolf."],
};

export const COMPOSERS: Composer[] = Object.entries(ALT).map(([id, [name, alt]]) => ({ id, name, alt, portrait: pic(`composer-${id}-portrait`), face: pic(`composer-${id}-face`) }));

/** a composer by the short name a catalogue gives him; one without a portrait still has his name */
export function composerNamed(name: string): Composer {
  return COMPOSERS.find((c) => c.name === name) ?? { id: name.toLowerCase(), name };
}
