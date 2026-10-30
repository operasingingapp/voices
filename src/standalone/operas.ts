import { SCENES, type Scene } from "./scenes";

/** Well-known operas, their main characters and the arias and ensembles they sing. A first pass from the scores' titles, to be checked. */
export type AvatarKind = "short" | "cap" | "bun" | "long" | "curls" | "hood" | "beard" | "hat" | "crown";
export interface Piece {
  title: string;
  kind: string;
  editionId?: string;
  /** stable key for progress; defaults to the title */
  id?: string;
  /** where it falls in the opera */
  when?: string;
  /** what is happening, and what the character wants, in a few sentences */
  context?: string;
}
export interface Character { id: string; name: string; voice: string; desc: string; avatar: AvatarKind; pieces: Piece[] }
export interface Opera { id: string; title: string; composer: string; composerFull: string; year: number; librettist: string; lang: string; chars: Character[] }

export const OPERAS: Opera[] = [
 {
  "id": "figaro",
  "title": "Le nozze di Figaro",
  "composer": "Mozart",
  "composerFull": "Wolfgang Amadeus Mozart",
  "year": 1786,
  "librettist": "Lorenzo Da Ponte",
  "lang": "it",
  "chars": [
   {
    "id": "figaro",
    "name": "Figaro",
    "voice": "Bass-baritone",
    "desc": "The Count's valet, about to marry Susanna.",
    "avatar": "short",
    "pieces": [
     {
      "title": "Cinque, dieci, venti",
      "kind": "Duet with Susanna · Act 1"
     },
     {
      "title": "Se vuol ballare",
      "kind": "Cavatina · Act 1"
     },
     {
      "title": "Non più andrai",
      "kind": "Aria · Act 1"
     },
     {
      "title": "Aprite un po' quegli occhi",
      "kind": "Aria · Act 4"
     }
    ]
   },
   {
    "id": "susanna",
    "name": "Susanna",
    "voice": "Soprano",
    "desc": "The Countess's maid, about to marry Figaro.",
    "avatar": "bun",
    "pieces": [
     {
      "title": "Cinque, dieci, venti",
      "kind": "Duet with Figaro · Act 1"
     },
     {
      "title": "Venite, inginocchiatevi",
      "kind": "Aria · Act 2"
     },
     {
      "title": "Sull'aria… che soave zeffiretto",
      "kind": "Letter duet with the Countess · Act 3"
     },
     {
      "title": "Deh vieni, non tardar",
      "kind": "Aria · Act 4"
     }
    ]
   },
   {
    "id": "countess",
    "name": "The Countess",
    "voice": "Soprano",
    "desc": "Countess Almaviva, neglected by her husband.",
    "avatar": "crown",
    "pieces": [
     {
      "title": "Porgi, amor",
      "kind": "Cavatina · Act 2"
     },
     {
      "title": "E Susanna non vien!",
      "kind": "Recitative · Act 3",
      "editionId": "mozart-e-susanna-non-vien",
      "when": "Act 3, alone, while Susanna meets the Count",
      "context": "Alone, the Countess waits for Susanna: tonight they will swap clothes so that she can catch her own husband. She worries the plan is too bold for so jealous a man, then turns bitter: the Count who loved her, then wronged her, then betrayed her, has brought her so low that she must ask her own maid for help."
     },
     {
      "title": "Dove sono",
      "kind": "Aria · Act 3",
      "editionId": "mozart-dove-sono",
      "when": "Straight after the recitative E Susanna non vien!",
      "context": "Still alone, the Countess remembers the happy days when the Count loved her and asks where his promises have gone. The slow, singing first part looks back; in the quick ending she finds a sudden hope that her faithfulness may yet win back his ungrateful heart."
     },
     {
      "title": "Sull'aria… che soave zeffiretto",
      "kind": "Letter duet with Susanna · Act 3"
     }
    ]
   },
   {
    "id": "count",
    "name": "Count Almaviva",
    "voice": "Baritone",
    "desc": "Figaro's master.",
    "avatar": "crown",
    "pieces": [
     {
      "title": "Hai già vinta la causa… Vedrò mentr'io sospiro",
      "kind": "Recitative and aria · Act 3"
     }
    ]
   },
   {
    "id": "cherubino",
    "name": "Cherubino",
    "voice": "Mezzo-soprano",
    "desc": "The Count's young page, sung by a woman.",
    "avatar": "curls",
    "pieces": [
     {
      "title": "Non so più cosa son",
      "kind": "Aria · Act 1"
     },
     {
      "title": "Voi che sapete",
      "kind": "Canzona · Act 2"
     }
    ]
   },
   {
    "id": "bartolo",
    "name": "Doctor Bartolo",
    "voice": "Bass",
    "desc": "A doctor from Seville.",
    "avatar": "beard",
    "pieces": [
     {
      "title": "La vendetta",
      "kind": "Aria · Act 1"
     }
    ]
   }
  ]
 },
 {
  "id": "giovanni",
  "title": "Don Giovanni",
  "composer": "Mozart",
  "composerFull": "Wolfgang Amadeus Mozart",
  "year": 1787,
  "librettist": "Lorenzo Da Ponte",
  "lang": "it",
  "chars": [
   {
    "id": "dongiovanni",
    "name": "Don Giovanni",
    "voice": "Baritone",
    "desc": "A young, reckless nobleman.",
    "avatar": "short",
    "pieces": [
     {
      "title": "Là ci darem la mano",
      "kind": "Duet with Zerlina · Act 1"
     },
     {
      "title": "Fin ch'han dal vino",
      "kind": "Aria · Act 1"
     },
     {
      "title": "Deh, vieni alla finestra",
      "kind": "Canzonetta · Act 2"
     }
    ]
   },
   {
    "id": "leporello",
    "name": "Leporello",
    "voice": "Bass",
    "desc": "Don Giovanni's servant.",
    "avatar": "cap",
    "pieces": [
     {
      "title": "Notte e giorno faticar",
      "kind": "Introduction · Act 1"
     },
     {
      "title": "Madamina, il catalogo è questo",
      "kind": "Aria · Act 1"
     }
    ]
   },
   {
    "id": "anna",
    "name": "Donna Anna",
    "voice": "Soprano",
    "desc": "The Commendatore's daughter.",
    "avatar": "bun",
    "pieces": [
     {
      "title": "Or sai chi l'onore",
      "kind": "Aria · Act 1"
     },
     {
      "title": "Non mi dir",
      "kind": "Aria · Act 2"
     }
    ]
   },
   {
    "id": "elvira",
    "name": "Donna Elvira",
    "voice": "Soprano",
    "desc": "A lady Don Giovanni abandoned.",
    "avatar": "hat",
    "pieces": [
     {
      "title": "Ah, chi mi dice mai",
      "kind": "Aria · Act 1"
     },
     {
      "title": "Mi tradì quell'alma ingrata",
      "kind": "Aria · Act 2"
     }
    ]
   },
   {
    "id": "zerlina",
    "name": "Zerlina",
    "voice": "Soprano",
    "desc": "A young country bride.",
    "avatar": "long",
    "pieces": [
     {
      "title": "Là ci darem la mano",
      "kind": "Duet with Don Giovanni · Act 1"
     },
     {
      "title": "Batti, batti, o bel Masetto",
      "kind": "Aria · Act 1"
     },
     {
      "title": "Vedrai, carino",
      "kind": "Aria · Act 2"
     }
    ]
   },
   {
    "id": "ottavio",
    "name": "Don Ottavio",
    "voice": "Tenor",
    "desc": "Donna Anna's fiancé.",
    "avatar": "curls",
    "pieces": [
     {
      "title": "Dalla sua pace",
      "kind": "Aria · Act 1"
     },
     {
      "title": "Il mio tesoro",
      "kind": "Aria · Act 2"
     }
    ]
   },
   {
    "id": "masetto",
    "name": "Masetto",
    "voice": "Bass",
    "desc": "Zerlina's bridegroom, a young peasant.",
    "avatar": "cap",
    "pieces": [
     {
      "title": "Ho capito, signor sì",
      "kind": "Aria · Act 1"
     }
    ]
   },
   {
    "id": "commendatore",
    "name": "Il Commendatore",
    "voice": "Bass",
    "desc": "Donna Anna's father, who returns as a statue.",
    "avatar": "beard",
    "pieces": [
     {
      "title": "O statua gentilissima",
      "kind": "Duet with Leporello and Don Giovanni · Act 2"
     },
     {
      "title": "Già la mensa è preparata",
      "kind": "Finale · Act 2"
     }
    ]
   }
  ]
 },
 {
  "id": "cosi",
  "title": "Così fan tutte",
  "composer": "Mozart",
  "composerFull": "Wolfgang Amadeus Mozart",
  "year": 1790,
  "librettist": "Lorenzo Da Ponte",
  "lang": "it",
  "chars": [
   {
    "id": "fiordiligi",
    "name": "Fiordiligi",
    "voice": "Soprano",
    "desc": "A lady from Ferrara, engaged to Guglielmo.",
    "avatar": "bun",
    "pieces": [
     {
      "title": "Soave sia il vento",
      "kind": "Terzettino · Act 1",
      "editionId": "mozart-soave-sia-il-vento",
      "when": "Act 1, on the shore at Naples, as the officers' boat sails",
      "context": "Don Alfonso has bet Ferrando and Guglielmo that their fiancées will not stay faithful for a day, and the officers have pretended to be called to war. Fiordiligi and Dorabella, in tears, watch the boat carry their lovers away, and with Alfonso, who is in on the trick, they pray for a gentle wind, calm waves and every element kind to their wishes. The sisters mean every word; Alfonso is already planning the officers' return in disguise."
     }
    ]
   },
   {
    "id": "dorabella",
    "name": "Dorabella",
    "voice": "Mezzo-soprano",
    "desc": "Fiordiligi's sister, engaged to Ferrando.",
    "avatar": "long",
    "pieces": [
     {
      "title": "Soave sia il vento",
      "kind": "Terzettino · Act 1",
      "editionId": "mozart-soave-sia-il-vento",
      "when": "Act 1, on the shore at Naples, as the officers' boat sails",
      "context": "Don Alfonso has bet Ferrando and Guglielmo that their fiancées will not stay faithful for a day, and the officers have pretended to be called to war. Fiordiligi and Dorabella, in tears, watch the boat carry their lovers away, and with Alfonso, who is in on the trick, they pray for a gentle wind, calm waves and every element kind to their wishes. The sisters mean every word; Alfonso is already planning the officers' return in disguise."
     }
    ]
   },
   {
    "id": "despina",
    "name": "Despina",
    "voice": "Soprano",
    "desc": "The sisters' maid.",
    "avatar": "cap",
    "pieces": []
   },
   {
    "id": "ferrando",
    "name": "Ferrando",
    "voice": "Tenor",
    "desc": "An officer, engaged to Dorabella.",
    "avatar": "curls",
    "pieces": []
   },
   {
    "id": "guglielmo",
    "name": "Guglielmo",
    "voice": "Baritone",
    "desc": "An officer, engaged to Fiordiligi.",
    "avatar": "short",
    "pieces": []
   },
   {
    "id": "alfonso",
    "name": "Don Alfonso",
    "voice": "Bass",
    "desc": "An old philosopher who doubts women's constancy.",
    "avatar": "beard",
    "pieces": [
     {
      "title": "Soave sia il vento",
      "kind": "Terzettino · Act 1",
      "editionId": "mozart-soave-sia-il-vento",
      "when": "Act 1, on the shore at Naples, as the officers' boat sails",
      "context": "Don Alfonso has bet Ferrando and Guglielmo that their fiancées will not stay faithful for a day, and the officers have pretended to be called to war. Fiordiligi and Dorabella, in tears, watch the boat carry their lovers away, and with Alfonso, who is in on the trick, they pray for a gentle wind, calm waves and every element kind to their wishes. The sisters mean every word; Alfonso is already planning the officers' return in disguise."
     }
    ]
   }
  ]
 },
 {
  "id": "zauberfloete",
  "title": "Die Zauberflöte",
  "composer": "Mozart",
  "composerFull": "Wolfgang Amadeus Mozart",
  "year": 1791,
  "librettist": "Emanuel Schikaneder",
  "lang": "de",
  "chars": [
   {
    "id": "tamino",
    "name": "Tamino",
    "voice": "Tenor",
    "desc": "A prince.",
    "avatar": "curls",
    "pieces": [
     {
      "title": "Dies Bildnis ist bezaubernd schön",
      "kind": "Aria · Act 1"
     }
    ]
   },
   {
    "id": "pamina",
    "name": "Pamina",
    "voice": "Soprano",
    "desc": "The Queen of the Night's daughter.",
    "avatar": "long",
    "pieces": [
     {
      "title": "Bei Männern, welche Liebe fühlen",
      "kind": "Duet with Papageno · Act 1"
     },
     {
      "title": "Ach, ich fühl's",
      "kind": "Aria · Act 2"
     }
    ]
   },
   {
    "id": "papageno",
    "name": "Papageno",
    "voice": "Baritone",
    "desc": "A bird-catcher.",
    "avatar": "hat",
    "pieces": [
     {
      "title": "Der Vogelfänger bin ich ja",
      "kind": "Aria · Act 1"
     },
     {
      "title": "Bei Männern, welche Liebe fühlen",
      "kind": "Duet with Pamina · Act 1"
     },
     {
      "title": "Ein Mädchen oder Weibchen",
      "kind": "Aria · Act 2"
     },
     {
      "title": "Pa-pa-pa",
      "kind": "Duet with Papagena · Act 2"
     }
    ]
   },
   {
    "id": "queen",
    "name": "The Queen of the Night",
    "voice": "Soprano",
    "desc": "Pamina's mother.",
    "avatar": "crown",
    "pieces": [
     {
      "title": "O zittre nicht, mein lieber Sohn",
      "kind": "Recitative and aria · Act 1"
     },
     {
      "title": "Der Hölle Rache",
      "id": "Der Hölle Rache kocht in meinem Herzen",
      "kind": "Aria · Act 2",
      "editionId": "mozart-der-holle-rache",
      "when": "Act 2, at night in Sarastro's grounds, to Pamina",
      "context": "The Queen of the Night appears to her daughter Pamina, who lies sleeping in Sarastro's garden, and drives off Monostatos. She learns that Tamino has joined Sarastro's brotherhood, and she has lost the power of the sun circle that her husband left to Sarastro. She gives Pamina a dagger and orders her to kill Sarastro: if she will not, the Queen will disown her for ever and break every bond of nature between them. She ends by calling on the gods of vengeance to hear a mother's oath."
     }
    ]
   },
   {
    "id": "sarastro",
    "name": "Sarastro",
    "voice": "Bass",
    "desc": "Leader of the priests of Isis and Osiris.",
    "avatar": "beard",
    "pieces": [
     {
      "title": "O Isis und Osiris",
      "kind": "Aria with chorus · Act 2"
     },
     {
      "title": "In diesen heil'gen Hallen",
      "kind": "Aria · Act 2"
     }
    ]
   }
  ]
 },
 {
  "id": "barbiere",
  "title": "Il barbiere di Siviglia",
  "composer": "Rossini",
  "composerFull": "Gioachino Rossini",
  "year": 1816,
  "librettist": "Cesare Sterbini",
  "lang": "it",
  "chars": [
   {
    "id": "figarob",
    "name": "Figaro",
    "voice": "Baritone",
    "desc": "The barber of Seville.",
    "avatar": "short",
    "pieces": [
     {
      "title": "Largo al factotum",
      "kind": "Cavatina · Act 1"
     }
    ]
   },
   {
    "id": "rosina",
    "name": "Rosina",
    "voice": "Mezzo-soprano",
    "desc": "Doctor Bartolo's ward.",
    "avatar": "bun",
    "pieces": [
     {
      "title": "Una voce poco fa",
      "kind": "Cavatina · Act 1"
     }
    ]
   },
   {
    "id": "almaviva",
    "name": "Count Almaviva",
    "voice": "Tenor",
    "desc": "A nobleman in love with Rosina.",
    "avatar": "curls",
    "pieces": [
     {
      "title": "Ecco, ridente in cielo",
      "kind": "Cavatina · Act 1"
     }
    ]
   },
   {
    "id": "basilio",
    "name": "Don Basilio",
    "voice": "Bass",
    "desc": "Rosina's music teacher.",
    "avatar": "hat",
    "pieces": [
     {
      "title": "La calunnia è un venticello",
      "kind": "Aria · Act 1"
     }
    ]
   },
   {
    "id": "bartolob",
    "name": "Doctor Bartolo",
    "voice": "Bass",
    "desc": "Rosina's guardian.",
    "avatar": "beard",
    "pieces": [
     {
      "title": "A un dottor della mia sorte",
      "kind": "Aria · Act 1"
     }
    ]
   }
  ]
 },
 {
  "id": "elisir",
  "title": "L'elisir d'amore",
  "composer": "Donizetti",
  "composerFull": "Gaetano Donizetti",
  "year": 1832,
  "librettist": "Felice Romani",
  "lang": "it",
  "chars": [
   {
    "id": "nemorino",
    "name": "Nemorino",
    "voice": "Tenor",
    "desc": "A shy young farmer.",
    "avatar": "curls",
    "pieces": [
     {
      "title": "Quanto è bella, quanto è cara",
      "kind": "Cavatina · Act 1"
     },
     {
      "title": "Una furtiva lagrima",
      "kind": "Romanza · Act 2"
     }
    ]
   },
   {
    "id": "adina",
    "name": "Adina",
    "voice": "Soprano",
    "desc": "A wealthy, clever landowner.",
    "avatar": "bun",
    "pieces": [
     {
      "title": "Della crudele Isotta",
      "kind": "Aria with chorus · Act 1"
     },
     {
      "title": "Prendi, per me sei libero",
      "kind": "Aria · Act 2"
     }
    ]
   },
   {
    "id": "dulcamara",
    "name": "Doctor Dulcamara",
    "voice": "Bass",
    "desc": "A travelling quack.",
    "avatar": "hat",
    "pieces": [
     {
      "title": "Udite, udite, o rustici",
      "kind": "Aria · Act 1"
     }
    ]
   },
   {
    "id": "belcore",
    "name": "Belcore",
    "voice": "Baritone",
    "desc": "A sergeant.",
    "avatar": "cap",
    "pieces": [
     {
      "title": "Come Paride vezzoso",
      "kind": "Cavatina · Act 1"
     }
    ]
   }
  ]
 },
 {
  "id": "rigoletto",
  "title": "Rigoletto",
  "composer": "Verdi",
  "composerFull": "Giuseppe Verdi",
  "year": 1851,
  "librettist": "Francesco Maria Piave",
  "lang": "it",
  "chars": [
   {
    "id": "rigoletto",
    "name": "Rigoletto",
    "voice": "Baritone",
    "desc": "The Duke's court jester.",
    "avatar": "cap",
    "pieces": [
     {
      "title": "Pari siamo",
      "kind": "Monologue · Act 1"
     },
     {
      "title": "Cortigiani, vil razza dannata",
      "kind": "Aria · Act 2"
     },
     {
      "title": "Bella figlia dell'amore",
      "kind": "Quartet · Act 3"
     }
    ]
   },
   {
    "id": "gilda",
    "name": "Gilda",
    "voice": "Soprano",
    "desc": "Rigoletto's daughter.",
    "avatar": "long",
    "pieces": [
     {
      "title": "Caro nome",
      "kind": "Aria · Act 1"
     },
     {
      "title": "Bella figlia dell'amore",
      "kind": "Quartet · Act 3"
     }
    ]
   },
   {
    "id": "duke",
    "name": "The Duke of Mantua",
    "voice": "Tenor",
    "desc": "A charming, faithless ruler.",
    "avatar": "crown",
    "pieces": [
     {
      "title": "Questa o quella",
      "kind": "Ballata · Act 1"
     },
     {
      "title": "La donna è mobile",
      "kind": "Canzone · Act 3"
     },
     {
      "title": "Bella figlia dell'amore",
      "kind": "Quartet · Act 3"
     }
    ]
   },
   {
    "id": "maddalena",
    "name": "Maddalena",
    "voice": "Contralto",
    "desc": "Sparafucile's sister.",
    "avatar": "hat",
    "pieces": [
     {
      "title": "Bella figlia dell'amore",
      "kind": "Quartet · Act 3"
     }
    ]
   }
  ]
 },
 {
  "id": "traviata",
  "title": "La traviata",
  "composer": "Verdi",
  "composerFull": "Giuseppe Verdi",
  "year": 1853,
  "librettist": "Francesco Maria Piave",
  "lang": "it",
  "chars": [
   {
    "id": "violetta",
    "name": "Violetta Valéry",
    "voice": "Soprano",
    "desc": "A Parisian courtesan.",
    "avatar": "bun",
    "pieces": [
     {
      "title": "Libiamo ne' lieti calici",
      "kind": "Brindisi with Alfredo and chorus · Act 1"
     },
     {
      "title": "È strano… Ah, fors'è lui… Sempre libera",
      "kind": "Scena and aria · Act 1"
     },
     {
      "title": "Pura siccome un angelo",
      "kind": "Duet with Germont · Act 2"
     },
     {
      "title": "Addio, del passato",
      "kind": "Aria · Act 3"
     },
     {
      "title": "Parigi, o cara",
      "kind": "Duet with Alfredo · Act 3"
     }
    ]
   },
   {
    "id": "alfredo",
    "name": "Alfredo Germont",
    "voice": "Tenor",
    "desc": "A young man in love with Violetta.",
    "avatar": "curls",
    "pieces": [
     {
      "title": "Libiamo ne' lieti calici",
      "kind": "Brindisi with Violetta and chorus · Act 1"
     },
     {
      "title": "De' miei bollenti spiriti",
      "kind": "Aria · Act 2"
     },
     {
      "title": "Parigi, o cara",
      "kind": "Duet with Violetta · Act 3"
     }
    ]
   },
   {
    "id": "germont",
    "name": "Giorgio Germont",
    "voice": "Baritone",
    "desc": "Alfredo's father.",
    "avatar": "beard",
    "pieces": [
     {
      "title": "Pura siccome un angelo",
      "kind": "Duet with Violetta · Act 2"
     },
     {
      "title": "Di Provenza il mar, il suol",
      "kind": "Aria · Act 2"
     }
    ]
   },
   {
    "id": "flora",
    "name": "Flora Bervoix",
    "voice": "Mezzo-soprano",
    "desc": "Violetta's friend, who gives the party in Act 2.",
    "avatar": "long",
    "pieces": []
   },
   {
    "id": "douphol",
    "name": "Baron Douphol",
    "voice": "Baritone",
    "desc": "Violetta's protector, and Alfredo's rival.",
    "avatar": "beard",
    "pieces": []
   },
   {
    "id": "annina",
    "name": "Annina",
    "voice": "Soprano",
    "desc": "Violetta's maid.",
    "avatar": "bun",
    "pieces": []
   }
  ]
 },
 {
  "id": "carmen",
  "title": "Carmen",
  "composer": "Bizet",
  "composerFull": "Georges Bizet",
  "year": 1875,
  "librettist": "Henri Meilhac and Ludovic Halévy",
  "lang": "fr",
  "chars": [
   {
    "id": "carmen",
    "name": "Carmen",
    "voice": "Mezzo-soprano",
    "desc": "A cigarette-factory worker in Seville.",
    "avatar": "long",
    "pieces": [
     {
      "title": "L'amour est un oiseau rebelle",
      "kind": "Habanera · Act 1"
     },
     {
      "title": "Près des remparts de Séville",
      "kind": "Seguidilla · Act 1"
     },
     {
      "title": "Les tringles des sistres tintaient",
      "kind": "Chanson bohème · Act 2"
     }
    ]
   },
   {
    "id": "jose",
    "name": "Don José",
    "voice": "Tenor",
    "desc": "A corporal of dragoons.",
    "avatar": "short",
    "pieces": [
     {
      "title": "Parle-moi de ma mère",
      "kind": "Duet with Micaëla · Act 1"
     },
     {
      "title": "La fleur que tu m'avais jetée",
      "kind": "Flower song · Act 2"
     }
    ]
   },
   {
    "id": "micaela",
    "name": "Micaëla",
    "voice": "Soprano",
    "desc": "A young woman from José's village.",
    "avatar": "bun",
    "pieces": [
     {
      "title": "Parle-moi de ma mère",
      "kind": "Duet with Don José · Act 1"
     },
     {
      "title": "Je dis que rien ne m'épouvante",
      "kind": "Aria · Act 3"
     }
    ]
   },
   {
    "id": "escamillo",
    "name": "Escamillo",
    "voice": "Baritone",
    "desc": "A celebrated toreador.",
    "avatar": "hat",
    "pieces": [
     {
      "title": "Votre toast, je peux vous le rendre",
      "kind": "Toreador song · Act 2"
     }
    ]
   }
  ]
 },
 {
  "id": "boheme",
  "title": "La bohème",
  "composer": "Puccini",
  "composerFull": "Giacomo Puccini",
  "year": 1896,
  "librettist": "Luigi Illica and Giuseppe Giacosa",
  "lang": "it",
  "chars": [
   {
    "id": "rodolfo",
    "name": "Rodolfo",
    "voice": "Tenor",
    "desc": "A poet.",
    "avatar": "curls",
    "pieces": [
     {
      "title": "Che gelida manina",
      "kind": "Aria · Act 1"
     },
     {
      "title": "O soave fanciulla",
      "kind": "Duet with Mimì · Act 1"
     },
     {
      "title": "O Mimì, tu più non torni",
      "kind": "Duet with Marcello · Act 4"
     }
    ]
   },
   {
    "id": "mimi",
    "name": "Mimì",
    "voice": "Soprano",
    "desc": "A seamstress, Rodolfo's neighbour.",
    "avatar": "long",
    "pieces": [
     {
      "title": "Sì, mi chiamano Mimì",
      "kind": "Aria · Act 1"
     },
     {
      "title": "O soave fanciulla",
      "kind": "Duet with Rodolfo · Act 1"
     },
     {
      "title": "Donde lieta uscì",
      "kind": "Aria · Act 3"
     }
    ]
   },
   {
    "id": "musetta",
    "name": "Musetta",
    "voice": "Soprano",
    "desc": "A singer, Marcello's on-and-off love.",
    "avatar": "hat",
    "pieces": [
     {
      "title": "Quando m'en vo'",
      "kind": "Waltz · Act 2"
     }
    ]
   },
   {
    "id": "marcello",
    "name": "Marcello",
    "voice": "Baritone",
    "desc": "A painter.",
    "avatar": "short",
    "pieces": [
     {
      "title": "O Mimì, tu più non torni",
      "kind": "Duet with Rodolfo · Act 4"
     }
    ]
   },
   {
    "id": "colline",
    "name": "Colline",
    "voice": "Bass",
    "desc": "A philosopher.",
    "avatar": "beard",
    "pieces": [
     {
      "title": "Vecchia zimarra, senti",
      "kind": "Aria · Act 4"
     }
    ]
   }
  ]
 },
 {
  "id": "tosca",
  "title": "Tosca",
  "composer": "Puccini",
  "composerFull": "Giacomo Puccini",
  "year": 1900,
  "librettist": "Luigi Illica and Giuseppe Giacosa",
  "lang": "it",
  "chars": [
   {
    "id": "tosca",
    "name": "Floria Tosca",
    "voice": "Soprano",
    "desc": "A celebrated singer.",
    "avatar": "bun",
    "pieces": [
     {
      "title": "Vissi d'arte",
      "kind": "Aria · Act 2"
     }
    ]
   },
   {
    "id": "cavaradossi",
    "name": "Mario Cavaradossi",
    "voice": "Tenor",
    "desc": "A painter, Tosca's lover.",
    "avatar": "curls",
    "pieces": [
     {
      "title": "Recondita armonia",
      "kind": "Aria · Act 1"
     },
     {
      "title": "E lucevan le stelle",
      "kind": "Aria · Act 3"
     }
    ]
   },
   {
    "id": "scarpia",
    "name": "Baron Scarpia",
    "voice": "Baritone",
    "desc": "Chief of the Roman police.",
    "avatar": "short",
    "pieces": [
     {
      "title": "Tre sbirri, una carrozza… Te Deum",
      "kind": "Act 1 finale with chorus"
     },
     {
      "title": "Ha più forte sapore",
      "kind": "Aria · Act 2"
     }
    ]
   }
  ]
 },
 {
  "id": "butterfly",
  "title": "Madama Butterfly",
  "composer": "Puccini",
  "composerFull": "Giacomo Puccini",
  "year": 1904,
  "librettist": "Luigi Illica and Giuseppe Giacosa",
  "lang": "it",
  "chars": [
   {
    "id": "ciociosan",
    "name": "Cio-Cio-San",
    "voice": "Soprano",
    "desc": "Madama Butterfly, a young geisha.",
    "avatar": "bun",
    "pieces": [
     {
      "title": "Viene la sera",
      "kind": "Love duet with Pinkerton · Act 1"
     },
     {
      "title": "Un bel dì, vedremo",
      "kind": "Aria · Act 2"
     },
     {
      "title": "Scuoti quella fronda di ciliegio",
      "kind": "Flower duet with Suzuki · Act 2"
     },
     {
      "title": "Tu, tu, piccolo iddio",
      "kind": "Final scene"
     }
    ]
   },
   {
    "id": "pinkerton",
    "name": "B. F. Pinkerton",
    "voice": "Tenor",
    "desc": "A lieutenant in the US Navy.",
    "avatar": "cap",
    "pieces": [
     {
      "title": "Dovunque al mondo",
      "kind": "Aria · Act 1"
     },
     {
      "title": "Viene la sera",
      "kind": "Love duet with Cio-Cio-San · Act 1"
     },
     {
      "title": "Addio, fiorito asil",
      "kind": "Aria · final act"
     }
    ]
   },
   {
    "id": "suzuki",
    "name": "Suzuki",
    "voice": "Mezzo-soprano",
    "desc": "Cio-Cio-San's maid.",
    "avatar": "hood",
    "pieces": [
     {
      "title": "Scuoti quella fronda di ciliegio",
      "kind": "Flower duet with Cio-Cio-San · Act 2"
     }
    ]
   },
   {
    "id": "sharpless",
    "name": "Sharpless",
    "voice": "Baritone",
    "desc": "The US consul in Nagasaki.",
    "avatar": "beard",
    "pieces": [
     {
      "title": "Ora a noi",
      "kind": "Letter scene with Cio-Cio-San · Act 2"
     }
    ]
   },
   {
    "id": "goro",
    "name": "Goro",
    "voice": "Tenor",
    "desc": "The marriage broker.",
    "avatar": "hat",
    "pieces": []
   },
   {
    "id": "bonze",
    "name": "The Bonze",
    "voice": "Bass",
    "desc": "Cio-Cio-San's uncle, a Buddhist priest.",
    "avatar": "beard",
    "pieces": []
   },
   {
    "id": "kate",
    "name": "Kate Pinkerton",
    "voice": "Mezzo-soprano",
    "desc": "Pinkerton's American wife.",
    "avatar": "bun",
    "pieces": []
   }
  ]
 },
 {
  "id": "schicchi",
  "title": "Gianni Schicchi",
  "composer": "Puccini",
  "composerFull": "Giacomo Puccini",
  "year": 1918,
  "librettist": "Giovacchino Forzano",
  "lang": "it",
  "chars": [
   {
    "id": "schicchi",
    "name": "Gianni Schicchi",
    "voice": "Baritone",
    "desc": "A shrewd Florentine, Lauretta's father.",
    "avatar": "cap",
    "pieces": [
     {
      "title": "Si corre dal notaio",
      "kind": "Aria"
     },
     {
      "title": "Prima un avvertimento",
      "kind": "Warning to the relatives"
     },
     {
      "title": "Ditemi voi, signori",
      "kind": "Final words to the audience"
     }
    ]
   },
   {
    "id": "lauretta",
    "name": "Lauretta",
    "voice": "Soprano",
    "desc": "Schicchi's daughter, in love with Rinuccio.",
    "avatar": "bun",
    "pieces": [
     {
      "id": "arrival",
      "context": "Schicchi arrives with Lauretta to find the relatives in mourning and in a rage. While Zita insults him and refuses to let Rinuccio marry a girl without a dowry, the two lovers can only snatch a few quiet words, and Lauretta reminds Rinuccio of his promise.",
      "title": "Schicchi's arrival and the quarrel with Zita",
      "kind": "Scene · short lines with Rinuccio, Schicchi and Zita",
      "when": "Schicchi arrives with Lauretta; Zita refuses the match"
     },
     {
      "id": "addio",
      "context": "With the families at each other's throats, Lauretta and Rinuccio fear they will not be married by May Day. Their farewell to hope floats in long, lyrical phrases above the quarrel.",
      "title": "Addio, speranza bella",
      "kind": "Duet with Rinuccio",
      "when": "The lovers' farewell as the families fall out"
     },
     {
      "id": "babbino",
      "context": "Schicchi has just refused to help the Donati family. Lauretta kneels and pleads with him: she loves Rinuccio, she wants to buy the ring, and if she cannot have him she will throw herself into the Arno. Half heartfelt, half a daughter who knows exactly how to move her father, it works: he agrees to look at the will.",
      "title": "O mio babbino caro",
      "kind": "Aria",
      "editionId": "puccini-o-mio-babbino-caro",
      "when": "Lauretta begs her father to help"
     },
     {
      "id": "addio-reprise",
      "context": "Schicchi reads the will and declares there is nothing to be done. The lovers take up their farewell again, until he stops: he has an idea.",
      "title": "Addio, speranza bella (reprise)",
      "kind": "Duet with Rinuccio, over Schicchi",
      "when": "While Schicchi reads the will"
     },
     {
      "id": "terrace",
      "context": "Schicchi sends Lauretta out to the terrace to feed the bird, so that she knows nothing of the fraud to come. She calls back that the bird will not eat; he tells her to give it some water.",
      "title": "Back from the terrace",
      "kind": "Short exchange with Schicchi",
      "when": "Sent out to feed the bird, she calls back in"
     },
     {
      "id": "lauretta-mia",
      "context": "The new will is made, Schicchi has chased the relatives out, and Lauretta has her dowry. Lauretta and Rinuccio look out over Florence, which seems to them like paradise: a short, radiant duet to end the opera.",
      "title": "Lauretta mia",
      "kind": "Love duet with Rinuccio",
      "when": "The ending, looking out over Florence"
     }
    ]
   },
   {
    "id": "rinuccio",
    "name": "Rinuccio",
    "voice": "Tenor",
    "desc": "Zita's nephew, in love with Lauretta.",
    "avatar": "curls",
    "pieces": [
     {
      "title": "Avete torto… Firenze è come un albero fiorito",
      "kind": "Aria"
     },
     {
      "title": "Lauretta mia",
      "kind": "Love duet with Lauretta"
     }
    ]
   },
   {
    "id": "zita",
    "name": "Zita",
    "voice": "Contralto",
    "desc": "Buoso's cousin, Rinuccio's aunt.",
    "avatar": "hood",
    "pieces": [
     {
      "title": "Spogliati, bambolino",
      "kind": "Trio with Nella and La Ciesca"
     }
    ]
   },
   {
    "id": "nella",
    "name": "Nella",
    "voice": "Soprano",
    "desc": "Gherardo's wife.",
    "avatar": "long",
    "pieces": [
     {
      "title": "Spogliati, bambolino",
      "kind": "Trio with Zita and La Ciesca"
     }
    ]
   },
   {
    "id": "ciesca",
    "name": "La Ciesca",
    "voice": "Mezzo-soprano",
    "desc": "Marco's wife.",
    "avatar": "hat",
    "pieces": [
     {
      "title": "Spogliati, bambolino",
      "kind": "Trio with Zita and Nella"
     }
    ]
   },
   {
    "id": "simone",
    "name": "Simone",
    "voice": "Bass",
    "desc": "Buoso's cousin, Marco's father.",
    "avatar": "beard",
    "pieces": []
   }
  ]
 }
];

/* ------------------------------------------------------------------------------------------------
   Each character's music is every number they sing in, in the order of the opera, taken from the
   checked running order (scenes.ts). The pieces listed above are the first pass: each is matched to
   its number and keeps what only it has (the music to practise, the scene notes, its progress key).
   ------------------------------------------------------------------------------------------------ */

/** a first-pass title → the running order's title, where the two differ */
const ALIAS: Record<string, string> = {
  "Sull'aria… che soave zeffiretto": "Sull'aria",
  "Mi tradì quell'alma ingrata": "In quali eccessi… Mi tradì",
  "Pa-pa-pa": "Bald prangt, den Morgen zu verkünden",
  "Vecchia zimarra, senti": "Vecchia zimarra",
  "Tre sbirri, una carrozza… Te Deum": "Va, Tosca!… Te Deum",
  "Ha più forte sapore": "Tosca è un buon falco… Ha più forte sapore",
  "Tu, tu, piccolo iddio": "Con onor muore… Tu, piccolo iddio",
  "Ora a noi": "The letter",
};
const norm = (t: string) =>
  t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
function matchScene(title: string, list: Scene[]): Scene | undefined {
  const exact = ALIAS[title] ?? title;
  const byTitle = list.find((s) => s.title === exact);
  if (byTitle) return byTitle;
  const head = norm(title).split(" ").slice(0, 2).join(" ");
  return list.find((s) => norm(s.title).startsWith(head)) ?? list.find((s) => norm(s.title).includes(head));
}
const actOf = (act: string) => act.replace(/\s*\(.*\)$/, "");

/** the first-pass list's progress keys by position, so places saved by number can be found again */
export const FIRST_PASS_KEYS: Record<string, string[]> = {};
/** first-pass pieces that could not be placed in the running order (should stay empty) */
export const UNPLACED: string[] = [];

for (const opera of OPERAS) {
  const scenes = SCENES[opera.id] ?? [];
  for (const ch of opera.chars) {
    const first = ch.pieces;
    FIRST_PASS_KEYS[`${opera.id}:${ch.id}`] = first.map((p) => p.id ?? p.title);
    const sung = scenes.filter((s) => s.who.includes(ch.id));
    const claimed = new Map<Scene, Piece>();
    for (const p of first) {
      const s = matchScene(p.title, sung);
      if (!s || claimed.has(s)) UNPLACED.push(`${opera.id}:${ch.id} ${p.title}`);
      else claimed.set(s, p);
    }
    ch.pieces = sung.map((s) => {
      const old = claimed.get(s);
      const act = actOf(s.act);
      return {
        title: old?.editionId ? old.title : s.title,
        kind: act === "The opera" ? s.kind : `${s.kind} · ${act}`,
        id: old ? (old.id ?? old.title) : `${act}: ${s.title}`,
        ...(old?.editionId ? { editionId: old.editionId } : {}),
        ...(old?.when ? { when: old.when } : {}),
        context: old?.context ?? s.what,
      };
    });
  }
}

/** The opera in order, number by number, each linked to a character's piece where someone in the cast sings it. */
export interface RunningNumber {
  title: string;
  kind: string;
  act: string;
  who: string[];
  piece?: { character: string; index: number };
}
export const RUNNING: Record<string, RunningNumber[]> = {};
for (const opera of OPERAS) {
  const scenes = SCENES[opera.id] ?? [];
  RUNNING[opera.id] = scenes.map((s) => {
    // a character's pieces are the numbers they sing, in order: the link is this number's place among them,
    // preferring a singer whose piece has music to practise
    let piece: RunningNumber["piece"];
    for (const id of s.who) {
      const ch = opera.chars.find((c) => c.id === id);
      const index = scenes.filter((x) => x.who.includes(id)).indexOf(s);
      if (!ch || index < 0) continue;
      if (ch.pieces[index]?.editionId) {
        piece = { character: id, index };
        break;
      }
      piece ??= { character: id, index };
    }
    return { title: s.title, kind: s.kind, act: actOf(s.act), who: s.who, ...(piece ? { piece } : {}) };
  });
}

/**
 * The lists as the app had them before the last check (version 2), rebuilt from today's running order and the few
 * changes that check made, so a place saved then by its position can be found again.
 */
const V2_NEW = new Set([
  "Quante buffonerie!… Che novità!",
  "E perché fosti meco",
  "Si ridesta in ciel l'aurora",
  "Flora's invitation",
  "Ohè, là, le guardie!",
  // added with the overtures, preludes and entr'actes; the instrumental ones have no singers and change no list
  "Scorrendo uniti remota via",
  "Possente amor mi chiama",
  "Dormi amor mio",
]);
const V2_ADDED: Record<string, string[]> = {
  "Contro un cor che accende amore": ["almaviva"],
  "O soave fanciulla": ["marcello", "colline"],
  "Voi! Cavaradossi!": ["tosca"],
  "Ancora un passo or via… Quanto cielo! Quanto mar!": ["sharpless", "pinkerton"],
  "The relatives bargain": ["schicchi"],
  "Addio, fiorito asil": ["sharpless"],
};
const V2_REMOVED: Record<string, string[]> = {
  "Bel conforto al mietitore… Quanto è bella": ["adina"],
  "The letter": ["suzuki"],
};
export const V2_KEYS: Record<string, string[]> = {};
for (const opera of OPERAS) {
  const scenes = SCENES[opera.id] ?? [];
  for (const ch of opera.chars) {
    const now = scenes.filter((s) => s.who.includes(ch.id));
    V2_KEYS[`${opera.id}:${ch.id}`] = scenes
      .filter((s) => !V2_NEW.has(s.title))
      .filter((s) => {
        const who = new Set(s.who);
        for (const id of V2_ADDED[s.title] ?? []) who.delete(id);
        for (const id of V2_REMOVED[s.title] ?? []) who.add(id);
        return who.has(ch.id);
      })
      .map((s) => {
        const i = now.indexOf(s);
        return i >= 0 ? ch.pieces[i].id! : `${actOf(s.act)}: ${s.title}`;
      });
  }
}
