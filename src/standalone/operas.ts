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
      "title": "Dove sono",
      "kind": "Recitative and aria · Act 3",
      "editionId": "mozart-dove-sono",
      "when": "Act 3, alone, while Susanna meets the Count",
      "context": "Alone, the Countess waits for Susanna: tonight she will dress as her maid to catch her own husband. She is ashamed of how low the Count has brought her, then remembers the happy days when he loved her, and ends in a sudden hope that her faithfulness may yet win back his ungrateful heart."
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
      "title": "Der Hölle Rache kocht in meinem Herzen",
      "kind": "Aria · Act 2"
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
