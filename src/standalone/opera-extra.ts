/** A short story for each opera, and the full running order where we have it. Written for this app. */
import countessBravo from "./images/figaro-countess-bravo.mp4?url";
import countessBravoPoster from "./images/figaro-countess-bravo-poster.webp";
import artTones from "./art-tones.json";

/**
 * The illustrations (images/README.md): each character's portrait and face, each opera's cover and circle, as
 * <opera>-<character>-portrait|face.webp and <opera>-cover|square.webp. Built from the user's Figma file by
 * scripts/art/build.py: the figure over its own backdrop, with a fine grain.
 */
const pics = import.meta.glob("./images/*.webp", { eager: true, import: "default" }) as Record<string, string>;
const pic = (name: string) => pics[`./images/${name}.webp`];

/** what each portrait shows (for screen readers) */
const PORTRAIT_ALT: Record<string, string> = {
  "figaro:figaro": "Figaro in an olive waistcoat and white shirt, dark hair tied back, a ribbon in his hands.",
  "figaro:susanna": "Susanna in a dark teal dress with a white apron, dark hair pinned up, one hand held out.",
  "figaro:countess": "The Countess in lilac silk with white sleeves, grey hair piled high, a white fan in her hand.",
  "figaro:count": "Count Almaviva in a plum coat and grey waistcoat with a white jabot, dark hair tied back.",
  "figaro:cherubino": "Cherubino in a mustard coat and brown breeches, light brown hair, a letter held to his chest.",
  "giovanni:dongiovanni": "Don Giovanni in black with an olive cloak over one shoulder, smiling confidently.",
  "giovanni:leporello": "Leporello in a brown coat and red waistcoat, holding open a book and raising a finger.",
  "giovanni:anna": "Donna Anna in black and violet, dark hair loose, looking away with a stern, grieving face.",
  "giovanni:elvira": "Donna Elvira in deep red, auburn hair pinned up, a hand at her heart.",
  "giovanni:zerlina": "Zerlina in a green bodice and white blouse, brown hair tied back, a hand at her chin.",
  "cosi:fiordiligi": "Fiordiligi in a teal bodice with white sleeves, dark hair pinned with pearls, a letter at her heart.",
  "cosi:dorabella": "Dorabella in a red dress with white sleeves, red hair pinned up, holding a white fan.",
  "cosi:ferrando": "Ferrando in a gold-striped coat with a white jabot, dark hair, a hand at his chest.",
  "cosi:guglielmo": "Guglielmo in a dark teal coat with a white jabot, dark hair and a moustache, one hand open.",
  "cosi:alfonso": "Don Alfonso in a black coat and white shirt, grey hair, a hand at his collar.",
  "zauberfloete:tamino": "Tamino in an ochre tunic with white sleeves, holding the magic flute.",
  "zauberfloete:pamina": "Pamina in a blue dress, long brown hair, a hand at her heart, looking up.",
  "zauberfloete:papageno": "Papageno in a green cloak and a feathered cap, holding his panpipes and grinning.",
  "zauberfloete:queen": "The Queen of the Night in black and violet with a white cape, a silver crescent in her hair, one hand raised.",
  "zauberfloete:sarastro": "Sarastro in a dark robe with a white collar, a long white beard, his hands folded.",
  "barbiere:figarob": "Figaro the barber in a red waistcoat and white shirt, scissors in hand, pointing upwards.",
  "barbiere:rosina": "Rosina in a teal gown with white sleeves, a white flower in her dark hair, holding a letter.",
  "barbiere:almaviva": "Count Almaviva in a navy coat and gold waistcoat, a hand on his hip.",
  "barbiere:basilio": "Don Basilio in black with a tricorn hat, a hand at his chin, a rolled paper under his arm.",
  "barbiere:bartolob": "Doctor Bartolo in a burgundy coat and olive waistcoat, a grey wig, frowning.",
  "traviata:violetta": "Violetta in a deep red gown with a white wrap, long dark hair, a pearl at her ear.",
  "traviata:alfredo": "Alfredo in a black coat and cravat, dark hair, a hand at his lapel.",
  "traviata:germont": "Giorgio Germont in a black coat and grey waistcoat, grey hair, his hands at his waist.",
  "traviata:flora": "Flora in a deep plum gown with puffed sleeves, auburn hair pinned up, a hand at her collarbone.",
  "traviata:douphol": "Baron Douphol in a grey frock coat and dark waistcoat, dark hair, his hands clasped.",
  "traviata:annina": "Annina in a navy maid's dress with a white apron, dark hair pinned up, her hands folded.",
  "carmen:carmen": "Carmen in a red dress and dark red shawl, dark hair, one hand raised.",
  "carmen:jose": "Don José in a brown coat over a navy uniform, dark hair, a red flower in his hands.",
  "carmen:micaela": "Micaëla in a green dress and white shawl, a long braid over her shoulder, holding a letter.",
  "carmen:escamillo": "Escamillo in a black and gold bullfighter's jacket with a gold sash, a yellow cape over his arm.",
  "butterfly:ciociosan": "Cio-Cio-San in a red and white kimono, white flowers in her black hair.",
  "butterfly:pinkerton": "Pinkerton in a navy officer's uniform with gold buttons and stripes.",
  "butterfly:suzuki": "Suzuki in a teal kimono with a gold sash, dark hair tied back.",
  "schicchi:schicchi": "Gianni Schicchi in a red cap and red robe, white beard and moustache, holding the will and smiling slyly.",
  "schicchi:lauretta": "Lauretta in a red dress with white sleeves, brown hair, a hand at her chin.",
};
const COVER_ALT: Record<string, string> = {
  figaro: "Figaro and Susanna among the Countess with her fan, the Count and Cherubino.",
  giovanni: "Don Giovanni in his cloak among Donna Anna, Donna Elvira and Zerlina.",
  cosi: "Fiordiligi and Dorabella between their officers, with Don Alfonso and Despina looking on.",
  zauberfloete: "The Queen of the Night reaches over Pamina, while Tamino holds the flute.",
  barbiere: "Figaro with his scissors and Count Almaviva lean towards Rosina, who holds a letter.",
  traviata: "Violetta in red between Alfredo and his father Germont.",
  carmen: "Carmen with a rose in her hair, between Don José, Micaëla and Escamillo.",
  butterfly: "Pinkerton in uniform with Cio-Cio-San in her kimono, and Suzuki beside them.",
  schicchi: "Gianni Schicchi, in a red cap, reads the will while Buoso's relatives crowd round the bed; Florence beyond the window.",
};

/** Portraits for the characters that have one (key: "opera:character"): a full portrait and a face crop for circles. */
export const PORTRAITS: Record<string, { portrait: string; face: string; alt: string }> = Object.fromEntries(
  Object.entries(PORTRAIT_ALT)
    .map(([key, alt]) => [key, { portrait: pic(`${key.replace(":", "-")}-portrait`), face: pic(`${key.replace(":", "-")}-face`), alt }] as const)
    .filter(([, p]) => p.portrait && p.face),
);

/**
 * The colours that go with each picture (key: "opera:character", or "op:<opera>"): its backdrop, and the card
 * tones around it (soft, strong, deep): a pale tint of the backdrop's complement, so card and picture contrast
 * and belong together.
 */
export const ART_TONES = artTones as Record<string, { soft: string; strong: string; deep: string; back: string }>;

/** A role's applause when the whole role is learned (key: "opera:character"): a short film, and its last frame. */
export const BRAVO: Record<string, { video: string; poster: string }> = {
  "figaro:countess": { video: countessBravo, poster: countessBravoPoster },
};

/** Illustrations for the operas that have one: a wide cover, a square crop for the opera's circle, and what it shows. */
export const ART: Record<string, { cover: string; square: string; alt: string }> = Object.fromEntries(
  Object.entries(COVER_ALT)
    .map(([op, alt]) => [op, { cover: pic(`${op}-cover`), square: pic(`${op}-square`), alt }] as const)
    .filter(([, a]) => a.cover && a.square),
);

export const STORIES: Record<string, string> = {
  figaro:
    "On their wedding day, Figaro and Susanna, servants of Count Almaviva, set out to outwit the Count, who wants Susanna for himself. With the neglected Countess they plot disguises and swapped letters, and by nightfall in the garden the Count is caught out and begs his wife's forgiveness.",
  giovanni:
    "Don Giovanni seduces his way across Spain and kills the Commendatore while escaping from Donna Anna. Pursued by Anna, Don Ottavio and the abandoned Donna Elvira, he keeps scheming, until the Commendatore's statue accepts his mocking invitation to dinner and drags him to hell.",
  cosi:
    "In Naples, two officers bet the cynical Don Alfonso that their fiancées, the sisters Fiordiligi and Dorabella, will stay faithful. Pretending to go to war, they return disguised as ‘Albanians’ and each courts the other's lover, with the maid Despina's help. By evening both sisters have given in; the hoax is revealed, and the couples are reconciled.",
  zauberfloete:
    "Prince Tamino is sent by the Queen of the Night to rescue her daughter Pamina from Sarastro, and finds that Sarastro is wise and the Queen is not. With the bird-catcher Papageno he passes trials of silence, fire and water, and wins Pamina; Papageno finds his Papagena.",
  barbiere:
    "In Seville, Count Almaviva loves Rosina, the ward of old Doctor Bartolo, who means to marry her himself. With the help of Figaro, the town's barber and fixer, the Count tries disguise after disguise and finally marries Rosina under Bartolo's nose.",
  elisir:
    "Shy Nemorino loves the clever landowner Adina, who flirts with the swaggering Sergeant Belcore. He buys a love potion, really cheap wine, from the quack Dulcamara and enlists to pay for more; seeing what he has given up, Adina realises she loves him.",
  rigoletto:
    "Rigoletto, jester to the Duke of Mantua, hides his daughter Gilda from the court, but the Duke seduces her. Rigoletto hires an assassin to kill the Duke; Gilda, still in love, takes the Duke's place and dies in her father's arms.",
  traviata:
    "Violetta, a celebrated Paris courtesan, gives up her old life for Alfredo. His father persuades her to leave him for the sake of the family's name; Alfredo humiliates her in public, learns the truth too late, and comes back only as she is dying.",
  carmen:
    "In Seville the soldier Don José abandons his duty and his sweetheart Micaëla for Carmen and joins her smugglers. When Carmen tires of him and turns to the bullfighter Escamillo, José, desperate and jealous, kills her outside the bullring.",
  boheme:
    "In a Paris garret the poet Rodolfo falls in love with his neighbour Mimì, while the painter Marcello fights and makes up with Musetta. Poverty and jealousy part Rodolfo and Mimì, and they are together again only as she dies.",
  tosca:
    "Rome, 1800. The singer Floria Tosca's lover, the painter Cavaradossi, hides an escaped political prisoner. The police chief Scarpia tortures Cavaradossi and demands Tosca as the price of his life; she kills Scarpia, but the promised mock execution is real, and she leaps from the castle walls.",
  butterfly:
    "In Nagasaki the American naval officer Pinkerton marries the young Cio-Cio-San, Butterfly, and sails away. She waits three years with their child; when he returns with an American wife to take the boy, she takes her own life.",
  schicchi:
    "Florence, 1299. Buoso Donati is dead, and his greedy relatives find he has left everything to the monks. Rinuccio calls in the shrewd Gianni Schicchi, whose daughter Lauretta he wants to marry. Schicchi impersonates the dead man, dictates a new will, and leaves the best of it to himself, so the young lovers can marry.",
};

