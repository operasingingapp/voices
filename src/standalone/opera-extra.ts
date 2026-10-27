/** A short story for each opera, and the full running order where we have it. Written for this app. */
import figaroCover from "./images/figaro-cover.webp";
import figaroSquare from "./images/figaro-square.webp";
import countessFace from "./images/figaro-countess-face.webp";
import countessPortrait from "./images/figaro-countess-portrait.webp";
import susannaFace from "./images/figaro-susanna-face.webp";
import susannaPortrait from "./images/figaro-susanna-portrait.webp";
import annaFace from "./images/giovanni-anna-face.webp";
import annaPortrait from "./images/giovanni-anna-portrait.webp";
import zerlinaFace from "./images/giovanni-zerlina-face.webp";
import zerlinaPortrait from "./images/giovanni-zerlina-portrait.webp";
import elviraFace from "./images/giovanni-elvira-face.webp";
import elviraPortrait from "./images/giovanni-elvira-portrait.webp";
import giovanniCover from "./images/giovanni-cover.webp";
import giovanniSquare from "./images/giovanni-square.webp";
import paminaFace from "./images/zauberflote-pamina-face.webp";
import paminaPortrait from "./images/zauberflote-pamina-portrait.webp";
import taminoFace from "./images/zauberflote-tamino-face.webp";
import taminoPortrait from "./images/zauberflote-tamino-portrait.webp";
import papagenoFace from "./images/zauberflote-papageno-face.webp";
import papagenoPortrait from "./images/zauberflote-papageno-portrait.webp";
import queenFace from "./images/zauberflote-queen-face.webp";
import queenPortrait from "./images/zauberflote-queen-portrait.webp";
import zauberfloteCover from "./images/zauberflote-cover.webp";
import zauberfloteSquare from "./images/zauberflote-square.webp";
import laurettaFace from "./images/lauretta-face.webp";
import laurettaPortrait from "./images/lauretta-portrait.webp";
import schicchiFace from "./images/schicchi-schicchi-face.webp";
import schicchiPortrait from "./images/schicchi-schicchi-portrait.webp";
import schicchiCover from "./images/schicchi-cover.webp";
import schicchiSquare from "./images/schicchi-square.webp";

/** Portraits for the characters that have one (key: "opera:character"): a full portrait and a face crop for circles. */
export const PORTRAITS: Record<string, { portrait: string; face: string; alt: string }> = {
  "schicchi:schicchi": {
    portrait: schicchiPortrait,
    face: schicchiFace,
    alt: "Gianni Schicchi in a red cap and red robe, white beard and moustache, holding the will and smiling slyly.",
  },
  "schicchi:lauretta": {
    portrait: laurettaPortrait,
    face: laurettaFace,
    alt: "Lauretta in a red dress with a white shawl and a pearl earring, looking up.",
  },
  "figaro:susanna": {
    portrait: susannaPortrait,
    face: susannaFace,
    alt: "Susanna in a rose dress, white apron and maid's cap, holding a folded letter and smiling over her shoulder.",
  },
  "figaro:countess": {
    portrait: countessPortrait,
    face: countessFace,
    alt: "The Countess in a lavender gown with powdered hair and a pearl earring, holding an open fan.",
  },
  "giovanni:anna": {
    portrait: annaPortrait,
    face: annaFace,
    alt: "Donna Anna in black and violet, a white handkerchief at her throat, looking away with a stern, grieving face.",
  },
  "giovanni:zerlina": {
    portrait: zerlinaPortrait,
    face: zerlinaFace,
    alt: "Zerlina in a green bodice and white sleeves, a ribbon in her hair, smiling sideways.",
  },
  "giovanni:elvira": {
    portrait: elviraPortrait,
    face: elviraFace,
    alt: "Donna Elvira in deep red, auburn hair loosely pinned, a hand at her heart and tears in her eyes.",
  },
  "zauberfloete:tamino": {
    portrait: taminoPortrait,
    face: taminoFace,
    alt: "Tamino in a deep teal robe with white sleeves, holding the golden flute and smiling, his dark hair tied back.",
  },
  "zauberfloete:papageno": {
    portrait: papagenoPortrait,
    face: papagenoFace,
    alt: "Papageno in a green cloak and a feathered hat, holding his panpipes and grinning upwards.",
  },
  "zauberfloete:pamina": {
    portrait: paminaPortrait,
    face: paminaFace,
    alt: "Pamina in flowing lilac and white, dark hair in a long braid, a hand at her heart, looking up.",
  },
  "zauberfloete:queen": {
    portrait: queenPortrait,
    face: queenFace,
    alt: "The Queen of the Night in a violet cloak with a high collar, a crown of silver spikes in her long white hair, one hand raised.",
  },
};

/** Illustrations for the operas that have one: a wide cover, a square crop for the opera's circle, and what it shows. */
export const ART: Record<string, { cover: string; square: string; alt: string }> = {
  zauberfloete: {
    cover: zauberfloteCover,
    square: zauberfloteSquare,
    alt: "By moonlight, Tamino holds the golden flute and gazes at Pamina; Papageno, with a bird on his hand, grins beside them, and the Queen of the Night reaches towards them.",
  },
  giovanni: {
    cover: giovanniCover,
    square: giovanniSquare,
    alt: "Don Giovanni, smiling, takes Zerlina's hand while Donna Elvira points at him in fury and Donna Anna looks on in distress.",
  },
  figaro: {
    cover: figaroCover,
    square: figaroSquare,
    alt: "Figaro points out a folded letter to Susanna as the Countess smiles behind her fan; the Count watches darkly and Cherubino peeps round the door.",
  },
  schicchi: {
    cover: schicchiCover,
    square: schicchiSquare,
    alt: "Gianni Schicchi, in a red cap, reads the will while Buoso's relatives crowd round the bed; Florence beyond the window.",
  },
};

export const STORIES: Record<string, string> = {
  figaro:
    "On their wedding day, Figaro and Susanna, servants of Count Almaviva, set out to outwit the Count, who wants Susanna for himself. With the neglected Countess they plot disguises and swapped letters, and by nightfall in the garden the Count is caught out and begs his wife's forgiveness.",
  giovanni:
    "Don Giovanni seduces his way across Spain and kills the Commendatore while escaping from Donna Anna. Pursued by Anna, Don Ottavio and the abandoned Donna Elvira, he keeps scheming, until the Commendatore's statue accepts his mocking invitation to dinner and drags him to hell.",
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

export interface Number {
  title: string;
  kind: string;
  /** character ids who sing in it */
  who: string[];
  /** the piece (in a character's list) it corresponds to, for a direct link */
  piece?: { character: string; index: number };
}

/** Gianni Schicchi is one act; the running order of its scenes and numbers. */
export const NUMBERS: Record<string, Number[]> = {
  schicchi: [
    { title: "Mourning Buoso", kind: "Ensemble", who: ["zita", "rinuccio", "nella", "ciesca", "simone"] },
    { title: "The rumour, and the search for the will", kind: "Ensemble", who: ["zita", "rinuccio", "nella", "ciesca", "simone"] },
    { title: "Avete torto… Firenze è come un albero fiorito", kind: "Aria", who: ["rinuccio"], piece: { character: "rinuccio", index: 0 } },
    { title: "Schicchi's arrival and the quarrel with Zita", kind: "Scene", who: ["schicchi", "lauretta", "rinuccio", "zita"], piece: { character: "lauretta", index: 0 } },
    { title: "Addio, speranza bella", kind: "Duet", who: ["lauretta", "rinuccio"], piece: { character: "lauretta", index: 1 } },
    { title: "O mio babbino caro", kind: "Aria", who: ["lauretta"], piece: { character: "lauretta", index: 2 } },
    { title: "Addio, speranza bella (reprise)", kind: "Duet over the reading of the will", who: ["lauretta", "rinuccio", "schicchi"], piece: { character: "lauretta", index: 3 } },
    { title: "Back from the terrace", kind: "Short exchange", who: ["lauretta", "schicchi"], piece: { character: "lauretta", index: 4 } },
    { title: "The doctor's visit", kind: "Scene · Schicchi as Buoso", who: ["schicchi"] },
    { title: "Si corre dal notaio", kind: "Aria", who: ["schicchi"], piece: { character: "schicchi", index: 0 } },
    { title: "The relatives bargain", kind: "Ensemble", who: ["zita", "nella", "ciesca", "simone", "rinuccio"] },
    { title: "Spogliati, bambolino", kind: "Trio", who: ["nella", "ciesca", "zita"], piece: { character: "zita", index: 0 } },
    { title: "Prima un avvertimento", kind: "Schicchi's warning", who: ["schicchi"], piece: { character: "schicchi", index: 1 } },
    { title: "The new will", kind: "Scene · with the notary", who: ["schicchi", "zita", "nella", "ciesca", "simone", "rinuccio"] },
    { title: "Lauretta mia", kind: "Love duet", who: ["lauretta", "rinuccio"], piece: { character: "lauretta", index: 5 } },
    { title: "Ditemi voi, signori", kind: "Schicchi's words to the audience, spoken", who: ["schicchi"], piece: { character: "schicchi", index: 2 } },
  ],
};
