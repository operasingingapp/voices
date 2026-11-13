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
  bach: ["Bach", "Johann Sebastian Bach in a full white curled wig and a dark coat with a white cravat, on red."],
  beethoven: ["Beethoven", "Ludwig van Beethoven with wild dark hair, a white collar and a red scarf under a dark coat, on red."],
  bizet: ["Bizet", "Georges Bizet with dark curly hair, a full beard and round spectacles, in a dark coat, on olive green."],
  brahms: ["Brahms", "Johannes Brahms with swept-back hair and a long grey-brown beard, in a dark coat and bow, on deep red."],
  faure: ["Fauré", "Gabriel Fauré with wavy grey hair and a grey moustache, in a dark coat and black tie, on purple."],
  handel: ["Handel", "George Frideric Handel in a full white curled wig, a lace cravat and a red coat embroidered in gold, on red."],
  haydn: ["Haydn", "Joseph Haydn in a white wig tied with a black ribbon, a lace cravat and a green coat edged in gold, on green."],
  mozart: ["Mozart", "Wolfgang Amadeus Mozart in a white wig tied with a black ribbon, a lace cravat and a red coat edged in gold, on red."],
  puccini: ["Puccini", "Giacomo Puccini with dark wavy hair and a moustache, in a brown overcoat and dark tie, on deep red."],
  rossini: ["Rossini", "Gioachino Rossini with dark curls and sideburns, a white cravat and a deep red coat, on olive green."],
  rstrauss: ["Strauss", "Richard Strauss with receding wavy hair and a moustache, in a dark coat and high white collar, on dark teal."],
  tchaikovsky: ["Tchaikovsky", "Pyotr Ilyich Tchaikovsky with short grey hair and a white beard, in a dark coat and tie, on purple."],
  verdi: ["Verdi", "Giuseppe Verdi in a black top hat, with white hair and a white beard, a dark bow and a deep red cloak, on green."],
  vivaldi: ["Vivaldi", "Antonio Vivaldi with long wavy red hair, a white lace cravat and a deep red cloak, on red."],
  wagner: ["Wagner", "Richard Wagner in a dark beret, with grey-brown hair and side whiskers, a dark bow and a deep red coat, on olive green."],
};

export const COMPOSERS: Composer[] = Object.entries(ALT).map(([id, [name, alt]]) => ({ id, name, alt, portrait: pic(`composer-${id}-portrait`), face: pic(`composer-${id}-face`) }));

/** a composer by the short name a catalogue gives him; one without a portrait still has his name */
export function composerNamed(name: string): Composer {
  return COMPOSERS.find((c) => c.name === name) ?? { id: name.toLowerCase(), name };
}
