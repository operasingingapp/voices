/**
 * Songs: art songs and arie antiche for one voice and piano, the repertoire a singer learns beside (and often before)
 * opera roles. Written for this app from the plan (the "100 Songs" sheet, now longer). None has music here
 * yet: `editionId` is set once a song's score can be practised (content/pieces/<editionId>/).
 */
export type SongLevel = "Beginner" | "Intermediate" | "Advanced";
export type SongGroup =
  | "Arie antiche"
  | "Italian song"
  | "Neapolitan song"
  | "German Lied"
  | "French mélodie"
  | "English song"
  | "Spanish song"
  | "Russian song"
  | "Nordic and Czech song";

export interface Song {
  id: string;
  title: string;
  /** short, as the catalogues name him ("Schubert"): finds the composer's portrait (composers.ts) */
  composer: string;
  /** in full, and honest about attributions ("attributed to Tommaso Giordani") */
  composerFull: string;
  /** the language it is sung in (BCP 47; "nap" Neapolitan, "zxx" no words) */
  lang: string;
  level: SongLevel;
  group: SongGroup;
  /** one line about it, shown on its page */
  note?: string;
  /** its score in the app (content/pieces/<editionId>), once it can be practised */
  editionId?: string;
}

/** the languages as a singer names them, in the order the filters show them */
export const SONG_LANGUAGES: [string, string][] = [
  ["it", "Italian"],
  ["nap", "Neapolitan"],
  ["de", "German"],
  ["fr", "French"],
  ["en", "English"],
  ["es", "Spanish"],
  ["ru", "Russian"],
  ["da", "Danish"],
  ["cs", "Czech"],
  ["arc", "Aramaic"],
  ["zxx", "No words"],
];
export const songLanguage = (lang: string) => SONG_LANGUAGES.find(([l]) => l === lang)?.[1] ?? lang;
export const SONG_LEVELS: SongLevel[] = ["Beginner", "Intermediate", "Advanced"];
export const SONG_GROUPS: SongGroup[] = [
  "Arie antiche",
  "Italian song",
  "Neapolitan song",
  "German Lied",
  "French mélodie",
  "English song",
  "Spanish song",
  "Russian song",
  "Nordic and Czech song",
];

export const SONGS: Song[] = [
  { id: "caccini-amarilli-mia-bella", title: "Amarilli, mia bella", composer: "Caccini", composerFull: "Giulio Caccini", lang: "it", level: "Beginner", group: "Arie antiche", note: "From Le nuove musiche (1602)" },
  { id: "giordani-caro-mio-ben", title: "Caro mio ben", composer: "Giordani", composerFull: "attributed to Tommaso Giordani", lang: "it", level: "Beginner", group: "Arie antiche", note: "Often the very first song a student learns" },
  { id: "caldara-sebben-crudele", title: "Sebben, crudele", composer: "Caldara", composerFull: "Antonio Caldara", lang: "it", level: "Beginner", group: "Arie antiche" },
  { id: "caldara-alma-del-core", title: "Alma del core", composer: "Caldara", composerFull: "Antonio Caldara", lang: "it", level: "Intermediate", group: "Arie antiche" },
  { id: "caldara-come-raggio-di-sol", title: "Come raggio di sol", composer: "Caldara", composerFull: "Antonio Caldara", lang: "it", level: "Intermediate", group: "Arie antiche", note: "Long legato lines" },
  { id: "caldara-selve-amiche", title: "Selve amiche", composer: "Caldara", composerFull: "Antonio Caldara", lang: "it", level: "Beginner", group: "Arie antiche" },
  { id: "paisiello-nel-cor-piu-non-mi-sento", title: "Nel cor più non mi sento", composer: "Paisiello", composerFull: "Giovanni Paisiello", lang: "it", level: "Beginner", group: "Arie antiche", note: "From the opera La molinara" },
  { id: "paisiello-chi-vuol-la-zingarella", title: "Chi vuol la zingarella", composer: "Paisiello", composerFull: "Giovanni Paisiello", lang: "it", level: "Intermediate", group: "Arie antiche" },
  { id: "monteverdi-lasciatemi-morire", title: "Lasciatemi morire", composer: "Monteverdi", composerFull: "Claudio Monteverdi", lang: "it", level: "Beginner", group: "Arie antiche", note: "Ariadne's lament, from L'Arianna" },
  { id: "scarlatti-le-violette", title: "Le violette", composer: "Scarlatti", composerFull: "Alessandro Scarlatti", lang: "it", level: "Intermediate", group: "Arie antiche" },
  { id: "scarlatti-gia-il-sole-dal-gange", title: "Già il sole dal Gange", composer: "Scarlatti", composerFull: "Alessandro Scarlatti", lang: "it", level: "Intermediate", group: "Arie antiche", note: "Popular with tenors" },
  { id: "scarlatti-o-cessate-di-piagarmi", title: "O cessate di piagarmi", composer: "Scarlatti", composerFull: "Alessandro Scarlatti", lang: "it", level: "Beginner", group: "Arie antiche" },
  { id: "scarlatti-sento-nel-core", title: "Sento nel core", composer: "Scarlatti", composerFull: "Alessandro Scarlatti", lang: "it", level: "Beginner", group: "Arie antiche" },
  { id: "scarlatti-spesso-vibra-per-suo-gioco", title: "Spesso vibra per suo gioco", composer: "Scarlatti", composerFull: "Alessandro Scarlatti", lang: "it", level: "Intermediate", group: "Arie antiche" },
  { id: "parisotti-se-tu-m-ami-se-sospiri", title: "Se tu m'ami, se sospiri", composer: "Parisotti", composerFull: "Alessandro Parisotti (long attributed to Pergolesi)", lang: "it", level: "Beginner", group: "Arie antiche", note: "Written by Parisotti himself" },
  { id: "pergolesi-nina", title: "Nina (Tre giorni son che Nina)", composer: "Pergolesi", composerFull: "attributed to Giovanni Battista Pergolesi", lang: "it", level: "Beginner", group: "Arie antiche" },
  { id: "stradella-pieta-signore", title: "Pietà, Signore", composer: "Stradella", composerFull: "attributed to Alessandro Stradella", lang: "it", level: "Intermediate", group: "Arie antiche" },
  { id: "durante-danza-danza-fanciulla-gentile", title: "Danza, danza, fanciulla gentile", composer: "Durante", composerFull: "Francesco Durante", lang: "it", level: "Intermediate", group: "Arie antiche", note: "Fast, good for diction" },
  { id: "durante-vergin-tutto-amor", title: "Vergin, tutto amor", composer: "Durante", composerFull: "Francesco Durante", lang: "it", level: "Beginner", group: "Arie antiche" },
  { id: "carissimi-vittoria-mio-core", title: "Vittoria, mio core", composer: "Carissimi", composerFull: "Giacomo Carissimi", lang: "it", level: "Intermediate", group: "Arie antiche" },
  { id: "marcello-il-mio-bel-foco", title: "Il mio bel foco", composer: "Marcello", composerFull: "attributed to Benedetto Marcello", lang: "it", level: "Intermediate", group: "Arie antiche", note: "A recitative, then the aria" },
  { id: "bononcini-per-la-gloria-d-adorarvi", title: "Per la gloria d'adorarvi", composer: "Bononcini", composerFull: "Giovanni Bononcini", lang: "it", level: "Beginner", group: "Arie antiche" },
  { id: "lotti-pur-dicesti-o-bocca-bella", title: "Pur dicesti, o bocca bella", composer: "Lotti", composerFull: "Antonio Lotti", lang: "it", level: "Intermediate", group: "Arie antiche" },
  { id: "torelli-tu-lo-sai", title: "Tu lo sai", composer: "Torelli", composerFull: "Giuseppe Torelli", lang: "it", level: "Beginner", group: "Arie antiche" },
  { id: "gluck-o-del-mio-dolce-ardor", title: "O del mio dolce ardor", composer: "Gluck", composerFull: "Christoph Willibald Gluck", lang: "it", level: "Intermediate", group: "Arie antiche", note: "From the opera Paride ed Elena" },
  { id: "cesti-intorno-all-idol-mio", title: "Intorno all'idol mio", composer: "Cesti", composerFull: "Antonio Cesti", lang: "it", level: "Intermediate", group: "Arie antiche" },
  { id: "rosa-star-vicino", title: "Star vicino", composer: "Rosa", composerFull: "attributed to Salvator Rosa", lang: "it", level: "Beginner", group: "Arie antiche" },
  { id: "gasparini-caro-laccio", title: "Caro laccio", composer: "Gasparini", composerFull: "Francesco Gasparini", lang: "it", level: "Beginner", group: "Arie antiche" },
  { id: "legrenzi-che-fiero-costume", title: "Che fiero costume", composer: "Legrenzi", composerFull: "Giovanni Legrenzi", lang: "it", level: "Beginner", group: "Arie antiche" },
  { id: "handel-lascia-ch-io-pianga", title: "Lascia ch'io pianga", composer: "Handel", composerFull: "George Frideric Handel", lang: "it", level: "Beginner", group: "Arie antiche", note: "From the opera Rinaldo" },
  { id: "bellini-vaga-luna-che-inargenti", title: "Vaga luna, che inargenti", composer: "Bellini", composerFull: "Vincenzo Bellini", lang: "it", level: "Intermediate", group: "Italian song" },
  { id: "bellini-malinconia-ninfa-gentile", title: "Malinconia, ninfa gentile", composer: "Bellini", composerFull: "Vincenzo Bellini", lang: "it", level: "Intermediate", group: "Italian song" },
  { id: "bellini-per-pieta-bell-idol-mio", title: "Per pietà, bell'idol mio", composer: "Bellini", composerFull: "Vincenzo Bellini", lang: "it", level: "Intermediate", group: "Italian song" },
  { id: "rossini-la-danza", title: "La danza", composer: "Rossini", composerFull: "Gioachino Rossini", lang: "it", level: "Advanced", group: "Italian song", note: "A tarantella: very fast patter" },
  { id: "rossini-la-promessa", title: "La promessa", composer: "Rossini", composerFull: "Gioachino Rossini", lang: "it", level: "Intermediate", group: "Italian song", note: "From Soirées musicales" },
  { id: "donizetti-me-voglio-fa-na-casa", title: "Me voglio fa' 'na casa", composer: "Donizetti", composerFull: "Gaetano Donizetti", lang: "nap", level: "Intermediate", group: "Italian song", note: "In Neapolitan" },
  { id: "tosti-ideale", title: "Ideale", composer: "Tosti", composerFull: "Francesco Paolo Tosti", lang: "it", level: "Intermediate", group: "Italian song" },
  { id: "tosti-l-ultima-canzone", title: "L'ultima canzone", composer: "Tosti", composerFull: "Francesco Paolo Tosti", lang: "it", level: "Intermediate", group: "Italian song" },
  { id: "tosti-a-vucchella", title: "'A vucchella", composer: "Tosti", composerFull: "Francesco Paolo Tosti", lang: "nap", level: "Intermediate", group: "Italian song", note: "Words by Gabriele D'Annunzio, in Neapolitan" },
  { id: "tosti-malia", title: "Malìa", composer: "Tosti", composerFull: "Francesco Paolo Tosti", lang: "it", level: "Intermediate", group: "Italian song" },
  { id: "donaudy-vaghissima-sembianza", title: "Vaghissima sembianza", composer: "Donaudy", composerFull: "Stefano Donaudy", lang: "it", level: "Intermediate", group: "Italian song" },
  { id: "respighi-nebbie", title: "Nebbie", composer: "Respighi", composerFull: "Ottorino Respighi", lang: "it", level: "Advanced", group: "Italian song", note: "Words by Ada Negri" },
  { id: "di-capua-o-sole-mio", title: "'O sole mio", composer: "di Capua", composerFull: "Eduardo di Capua", lang: "nap", level: "Intermediate", group: "Neapolitan song", note: "A tenor favourite" },
  { id: "de-curtis-torna-a-surriento", title: "Torna a Surriento", composer: "De Curtis", composerFull: "Ernesto De Curtis", lang: "nap", level: "Intermediate", group: "Neapolitan song" },
  { id: "verdi-stornello", title: "Stornello", composer: "Verdi", composerFull: "Giuseppe Verdi", lang: "it", level: "Intermediate", group: "Italian song" },
  { id: "schubert-an-die-musik", title: "An die Musik", composer: "Schubert", composerFull: "Franz Schubert", lang: "de", level: "Beginner", group: "German Lied" },
  { id: "schubert-standchen", title: "Ständchen (Leise flehen)", composer: "Schubert", composerFull: "Franz Schubert", lang: "de", level: "Intermediate", group: "German Lied", note: "From Schwanengesang" },
  { id: "schubert-heidenroslein", title: "Heidenröslein", composer: "Schubert", composerFull: "Franz Schubert", lang: "de", level: "Beginner", group: "German Lied" },
  { id: "schubert-die-forelle", title: "Die Forelle", composer: "Schubert", composerFull: "Franz Schubert", lang: "de", level: "Intermediate", group: "German Lied" },
  { id: "schubert-du-bist-die-ruh", title: "Du bist die Ruh", composer: "Schubert", composerFull: "Franz Schubert", lang: "de", level: "Intermediate", group: "German Lied" },
  { id: "schubert-ave-maria", title: "Ave Maria (Ellens dritter Gesang)", composer: "Schubert", composerFull: "Franz Schubert", lang: "de", level: "Intermediate", group: "German Lied", note: "Sung here to Schubert's German words" },
  { id: "schubert-gretchen-am-spinnrade", title: "Gretchen am Spinnrade", composer: "Schubert", composerFull: "Franz Schubert", lang: "de", level: "Advanced", group: "German Lied" },
  { id: "schubert-der-lindenbaum", title: "Der Lindenbaum", composer: "Schubert", composerFull: "Franz Schubert", lang: "de", level: "Intermediate", group: "German Lied", note: "From Winterreise" },
  { id: "schubert-nacht-und-traume", title: "Nacht und Träume", composer: "Schubert", composerFull: "Franz Schubert", lang: "de", level: "Advanced", group: "German Lied", note: "Very slow: a study in breath" },
  { id: "schubert-an-silvia", title: "An Silvia", composer: "Schubert", composerFull: "Franz Schubert", lang: "de", level: "Beginner", group: "German Lied" },
  { id: "schubert-erlkonig", title: "Erlkönig", composer: "Schubert", composerFull: "Franz Schubert", lang: "de", level: "Advanced", group: "German Lied" },
  { id: "schumann-widmung", title: "Widmung", composer: "Schumann", composerFull: "Robert Schumann", lang: "de", level: "Intermediate", group: "German Lied", note: "From Myrthen" },
  { id: "schumann-du-bist-wie-eine-blume", title: "Du bist wie eine Blume", composer: "Schumann", composerFull: "Robert Schumann", lang: "de", level: "Beginner", group: "German Lied" },
  { id: "schumann-im-wunderschonen-monat-mai", title: "Im wunderschönen Monat Mai", composer: "Schumann", composerFull: "Robert Schumann", lang: "de", level: "Beginner", group: "German Lied", note: "Dichterliebe, No. 1" },
  { id: "schumann-ich-grolle-nicht", title: "Ich grolle nicht", composer: "Schumann", composerFull: "Robert Schumann", lang: "de", level: "Advanced", group: "German Lied", note: "From Dichterliebe" },
  { id: "schumann-mondnacht", title: "Mondnacht", composer: "Schumann", composerFull: "Robert Schumann", lang: "de", level: "Intermediate", group: "German Lied", note: "From Liederkreis, Op. 39" },
  { id: "brahms-wiegenlied", title: "Wiegenlied (Guten Abend, gut' Nacht)", composer: "Brahms", composerFull: "Johannes Brahms", lang: "de", level: "Beginner", group: "German Lied" },
  { id: "brahms-von-ewiger-liebe", title: "Von ewiger Liebe", composer: "Brahms", composerFull: "Johannes Brahms", lang: "de", level: "Advanced", group: "German Lied" },
  { id: "brahms-die-mainacht", title: "Die Mainacht", composer: "Brahms", composerFull: "Johannes Brahms", lang: "de", level: "Advanced", group: "German Lied" },
  { id: "brahms-feldeinsamkeit", title: "Feldeinsamkeit", composer: "Brahms", composerFull: "Johannes Brahms", lang: "de", level: "Intermediate", group: "German Lied", note: "Popular with low voices" },
  { id: "mozart-abendempfindung", title: "Abendempfindung", composer: "Mozart", composerFull: "Wolfgang Amadeus Mozart", lang: "de", level: "Intermediate", group: "German Lied" },
  { id: "mozart-das-veilchen", title: "Das Veilchen", composer: "Mozart", composerFull: "Wolfgang Amadeus Mozart", lang: "de", level: "Beginner", group: "German Lied", note: "Words by Goethe" },
  { id: "beethoven-ich-liebe-dich", title: "Ich liebe dich (Zärtliche Liebe)", composer: "Beethoven", composerFull: "Ludwig van Beethoven", lang: "de", level: "Beginner", group: "German Lied" },
  { id: "strauss-zueignung", title: "Zueignung", composer: "Strauss", composerFull: "Richard Strauss", lang: "de", level: "Advanced", group: "German Lied" },
  { id: "strauss-morgen", title: "Morgen!", composer: "Strauss", composerFull: "Richard Strauss", lang: "de", level: "Advanced", group: "German Lied" },
  { id: "strauss-allerseelen", title: "Allerseelen", composer: "Strauss", composerFull: "Richard Strauss", lang: "de", level: "Advanced", group: "German Lied" },
  { id: "faure-apres-un-reve", title: "Après un rêve", composer: "Fauré", composerFull: "Gabriel Fauré", lang: "fr", level: "Intermediate", group: "French mélodie", note: "The most-sung French song" },
  { id: "faure-clair-de-lune", title: "Clair de lune", composer: "Fauré", composerFull: "Gabriel Fauré", lang: "fr", level: "Intermediate", group: "French mélodie", note: "Words by Verlaine" },
  { id: "faure-les-berceaux", title: "Les berceaux", composer: "Fauré", composerFull: "Gabriel Fauré", lang: "fr", level: "Intermediate", group: "French mélodie" },
  { id: "faure-lydia", title: "Lydia", composer: "Fauré", composerFull: "Gabriel Fauré", lang: "fr", level: "Beginner", group: "French mélodie" },
  { id: "faure-au-bord-de-l-eau", title: "Au bord de l'eau", composer: "Fauré", composerFull: "Gabriel Fauré", lang: "fr", level: "Intermediate", group: "French mélodie" },
  { id: "debussy-beau-soir", title: "Beau soir", composer: "Debussy", composerFull: "Claude Debussy", lang: "fr", level: "Intermediate", group: "French mélodie" },
  { id: "debussy-nuit-d-etoiles", title: "Nuit d'étoiles", composer: "Debussy", composerFull: "Claude Debussy", lang: "fr", level: "Intermediate", group: "French mélodie" },
  { id: "debussy-mandoline", title: "Mandoline", composer: "Debussy", composerFull: "Claude Debussy", lang: "fr", level: "Advanced", group: "French mélodie" },
  { id: "duparc-chanson-triste", title: "Chanson triste", composer: "Duparc", composerFull: "Henri Duparc", lang: "fr", level: "Advanced", group: "French mélodie" },
  { id: "duparc-l-invitation-au-voyage", title: "L'invitation au voyage", composer: "Duparc", composerFull: "Henri Duparc", lang: "fr", level: "Advanced", group: "French mélodie", note: "Words by Baudelaire" },
  { id: "hahn-si-mes-vers-avaient-des-ailes", title: "Si mes vers avaient des ailes", composer: "Hahn", composerFull: "Reynaldo Hahn", lang: "fr", level: "Beginner", group: "French mélodie" },
  { id: "hahn-a-chloris", title: "À Chloris", composer: "Hahn", composerFull: "Reynaldo Hahn", lang: "fr", level: "Intermediate", group: "French mélodie" },
  { id: "hahn-l-heure-exquise", title: "L'heure exquise", composer: "Hahn", composerFull: "Reynaldo Hahn", lang: "fr", level: "Intermediate", group: "French mélodie" },
  { id: "bizet-ouvre-ton-c-ur", title: "Ouvre ton cœur", composer: "Bizet", composerFull: "Georges Bizet", lang: "fr", level: "Intermediate", group: "French mélodie" },
  { id: "gounod-serenade", title: "Sérénade (Quand tu chantes)", composer: "Gounod", composerFull: "Charles Gounod", lang: "fr", level: "Intermediate", group: "French mélodie" },
  { id: "chausson-le-temps-des-lilas", title: "Le temps des lilas", composer: "Chausson", composerFull: "Ernest Chausson", lang: "fr", level: "Advanced", group: "French mélodie" },
  { id: "massenet-elegie", title: "Élégie", composer: "Massenet", composerFull: "Jules Massenet", lang: "fr", level: "Beginner", group: "French mélodie" },
  { id: "purcell-music-for-a-while", title: "Music for a while", composer: "Purcell", composerFull: "Henry Purcell", lang: "en", level: "Intermediate", group: "English song" },
  { id: "purcell-if-music-be-the-food-of-love", title: "If music be the food of love", composer: "Purcell", composerFull: "Henry Purcell", lang: "en", level: "Intermediate", group: "English song" },
  { id: "purcell-nymphs-and-shepherds", title: "Nymphs and Shepherds", composer: "Purcell", composerFull: "Henry Purcell", lang: "en", level: "Beginner", group: "English song" },
  { id: "arne-where-the-bee-sucks", title: "Where the bee sucks", composer: "Arne", composerFull: "Thomas Arne", lang: "en", level: "Beginner", group: "English song", note: "Words by Shakespeare" },
  { id: "quilter-now-sleeps-the-crimson-petal", title: "Now sleeps the crimson petal", composer: "Quilter", composerFull: "Roger Quilter", lang: "en", level: "Intermediate", group: "English song", note: "Words by Tennyson" },
  { id: "quilter-love-s-philosophy", title: "Love's Philosophy", composer: "Quilter", composerFull: "Roger Quilter", lang: "en", level: "Intermediate", group: "English song", note: "Words by Shelley" },
  { id: "butterworth-loveliest-of-trees", title: "Loveliest of trees", composer: "Butterworth", composerFull: "George Butterworth", lang: "en", level: "Intermediate", group: "English song", note: "From A Shropshire Lad" },
  { id: "obradors-del-cabello-mas-sutil", title: "Del cabello más sutil", composer: "Obradors", composerFull: "Fernando Obradors", lang: "es", level: "Intermediate", group: "Spanish song" },
  { id: "falla-nana", title: "Nana (Siete canciones populares)", composer: "Falla", composerFull: "Manuel de Falla", lang: "es", level: "Beginner", group: "Spanish song", note: "A lullaby" },
  { id: "granados-la-maja-dolorosa-no-1", title: "La maja dolorosa No. 1", composer: "Granados", composerFull: "Enrique Granados", lang: "es", level: "Advanced", group: "Spanish song", note: "From the Tonadillas" },
  { id: "rachmaninoff-vocalise", title: "Vocalise", composer: "Rachmaninoff", composerFull: "Sergei Rachmaninoff", lang: "zxx", level: "Advanced", group: "Russian song", note: "Sung on one vowel, with no words" },
  { id: "rachmaninoff-how-fair-this-spot", title: "How fair this spot (Zdes' khorosho)", composer: "Rachmaninoff", composerFull: "Sergei Rachmaninoff", lang: "ru", level: "Advanced", group: "Russian song" },
  { id: "schubert-der-tod-und-das-madchen", title: "Der Tod und das Mädchen", composer: "Schubert", composerFull: "Franz Schubert", lang: "de", level: "Intermediate", group: "German Lied", note: "Popular with low voices" },
  { id: "schubert-gute-nacht", title: "Gute Nacht", composer: "Schubert", composerFull: "Franz Schubert", lang: "de", level: "Intermediate", group: "German Lied", note: "Winterreise, No. 1" },
  { id: "schubert-der-leiermann", title: "Der Leiermann", composer: "Schubert", composerFull: "Franz Schubert", lang: "de", level: "Intermediate", group: "German Lied", note: "The last song of Winterreise" },
  { id: "schubert-das-wandern", title: "Das Wandern", composer: "Schubert", composerFull: "Franz Schubert", lang: "de", level: "Beginner", group: "German Lied", note: "Die schöne Müllerin, No. 1" },
  { id: "schubert-wohin", title: "Wohin?", composer: "Schubert", composerFull: "Franz Schubert", lang: "de", level: "Intermediate", group: "German Lied", note: "From Die schöne Müllerin" },
  { id: "schubert-auf-dem-wasser-zu-singen", title: "Auf dem Wasser zu singen", composer: "Schubert", composerFull: "Franz Schubert", lang: "de", level: "Advanced", group: "German Lied" },
  { id: "schubert-der-musensohn", title: "Der Musensohn", composer: "Schubert", composerFull: "Franz Schubert", lang: "de", level: "Intermediate", group: "German Lied", note: "Words by Goethe" },
  { id: "schumann-die-beiden-grenadiere", title: "Die beiden Grenadiere", composer: "Schumann", composerFull: "Robert Schumann", lang: "de", level: "Intermediate", group: "German Lied", note: "Words by Heine; popular with low voices" },
  { id: "schumann-der-nussbaum", title: "Der Nussbaum", composer: "Schumann", composerFull: "Robert Schumann", lang: "de", level: "Intermediate", group: "German Lied", note: "From Myrthen" },
  { id: "schumann-die-lotosblume", title: "Die Lotosblume", composer: "Schumann", composerFull: "Robert Schumann", lang: "de", level: "Intermediate", group: "German Lied", note: "From Myrthen" },
  { id: "schumann-fruhlingsnacht", title: "Frühlingsnacht", composer: "Schumann", composerFull: "Robert Schumann", lang: "de", level: "Advanced", group: "German Lied", note: "From Liederkreis, Op. 39" },
  { id: "schumann-waldesgesprach", title: "Waldesgespräch", composer: "Schumann", composerFull: "Robert Schumann", lang: "de", level: "Intermediate", group: "German Lied", note: "From Liederkreis, Op. 39" },
  { id: "schumann-im-rhein-im-heiligen-strome", title: "Im Rhein, im heiligen Strome", composer: "Schumann", composerFull: "Robert Schumann", lang: "de", level: "Intermediate", group: "German Lied", note: "From Dichterliebe" },
  { id: "schumann-seit-ich-ihn-gesehen", title: "Seit ich ihn gesehen", composer: "Schumann", composerFull: "Robert Schumann", lang: "de", level: "Beginner", group: "German Lied", note: "Frauenliebe und -leben, No. 1" },
  { id: "schumann-du-ring-an-meinem-finger", title: "Du Ring an meinem Finger", composer: "Schumann", composerFull: "Robert Schumann", lang: "de", level: "Intermediate", group: "German Lied", note: "From Frauenliebe und -leben" },
  { id: "brahms-vergebliches-standchen", title: "Vergebliches Ständchen", composer: "Brahms", composerFull: "Johannes Brahms", lang: "de", level: "Intermediate", group: "German Lied" },
  { id: "brahms-sapphische-ode", title: "Sapphische Ode", composer: "Brahms", composerFull: "Johannes Brahms", lang: "de", level: "Intermediate", group: "German Lied" },
  { id: "brahms-immer-leiser-wird-mein-schlummer", title: "Immer leiser wird mein Schlummer", composer: "Brahms", composerFull: "Johannes Brahms", lang: "de", level: "Advanced", group: "German Lied" },
  { id: "wolf-verborgenheit", title: "Verborgenheit", composer: "Wolf", composerFull: "Hugo Wolf", lang: "de", level: "Intermediate", group: "German Lied", note: "From the Mörike-Lieder" },
  { id: "wolf-das-verlassene-magdlein", title: "Das verlassene Mägdlein", composer: "Wolf", composerFull: "Hugo Wolf", lang: "de", level: "Intermediate", group: "German Lied", note: "From the Mörike-Lieder" },
  { id: "wolf-der-feuerreiter", title: "Der Feuerreiter", composer: "Wolf", composerFull: "Hugo Wolf", lang: "de", level: "Advanced", group: "German Lied", note: "From the Mörike-Lieder" },
  { id: "wolf-fussreise", title: "Fußreise", composer: "Wolf", composerFull: "Hugo Wolf", lang: "de", level: "Intermediate", group: "German Lied", note: "From the Mörike-Lieder" },
  { id: "wolf-auf-ein-altes-bild", title: "Auf ein altes Bild", composer: "Wolf", composerFull: "Hugo Wolf", lang: "de", level: "Intermediate", group: "German Lied", note: "From the Mörike-Lieder" },
  { id: "wolf-verschwiegene-liebe", title: "Verschwiegene Liebe", composer: "Wolf", composerFull: "Hugo Wolf", lang: "de", level: "Intermediate", group: "German Lied", note: "From the Eichendorff-Lieder" },
  { id: "strauss-standchen", title: "Ständchen (Mach auf, mach auf)", composer: "Strauss", composerFull: "Richard Strauss", lang: "de", level: "Advanced", group: "German Lied" },
  { id: "strauss-die-nacht", title: "Die Nacht", composer: "Strauss", composerFull: "Richard Strauss", lang: "de", level: "Intermediate", group: "German Lied" },
  { id: "strauss-cacilie", title: "Cäcilie", composer: "Strauss", composerFull: "Richard Strauss", lang: "de", level: "Advanced", group: "German Lied" },
  { id: "mahler-ich-bin-der-welt-abhanden-gekommen", title: "Ich bin der Welt abhanden gekommen", composer: "Mahler", composerFull: "Gustav Mahler", lang: "de", level: "Advanced", group: "German Lied", note: "From the Rückert-Lieder" },
  { id: "mahler-liebst-du-um-schonheit", title: "Liebst du um Schönheit", composer: "Mahler", composerFull: "Gustav Mahler", lang: "de", level: "Intermediate", group: "German Lied", note: "From the Rückert-Lieder" },
  { id: "mahler-ging-heut-morgen-ubers-feld", title: "Ging heut' morgen übers Feld", composer: "Mahler", composerFull: "Gustav Mahler", lang: "de", level: "Intermediate", group: "German Lied", note: "From Lieder eines fahrenden Gesellen" },
  { id: "mendelssohn-auf-flugeln-des-gesanges", title: "Auf Flügeln des Gesanges", composer: "Mendelssohn", composerFull: "Felix Mendelssohn", lang: "de", level: "Beginner", group: "German Lied", note: "Words by Heine" },
  { id: "beethoven-adelaide", title: "Adelaide", composer: "Beethoven", composerFull: "Ludwig van Beethoven", lang: "de", level: "Advanced", group: "German Lied" },
  { id: "wagner-traume", title: "Träume", composer: "Wagner", composerFull: "Richard Wagner", lang: "de", level: "Advanced", group: "German Lied", note: "From the Wesendonck-Lieder" },
  { id: "clara-schumann-liebst-du-um-schonheit", title: "Liebst du um Schönheit", composer: "Clara Schumann", composerFull: "Clara Schumann", lang: "de", level: "Intermediate", group: "German Lied", note: "Words by Rückert" },
  { id: "faure-les-roses-d-ispahan", title: "Les roses d'Ispahan", composer: "Fauré", composerFull: "Gabriel Fauré", lang: "fr", level: "Intermediate", group: "French mélodie" },
  { id: "faure-nell", title: "Nell", composer: "Fauré", composerFull: "Gabriel Fauré", lang: "fr", level: "Intermediate", group: "French mélodie" },
  { id: "faure-mandoline", title: "Mandoline", composer: "Fauré", composerFull: "Gabriel Fauré", lang: "fr", level: "Intermediate", group: "French mélodie", note: "Words by Verlaine" },
  { id: "faure-ici-bas", title: "Ici-bas!", composer: "Fauré", composerFull: "Gabriel Fauré", lang: "fr", level: "Beginner", group: "French mélodie" },
  { id: "faure-en-priere", title: "En prière", composer: "Fauré", composerFull: "Gabriel Fauré", lang: "fr", level: "Beginner", group: "French mélodie" },
  { id: "duparc-phidyle", title: "Phidylé", composer: "Duparc", composerFull: "Henri Duparc", lang: "fr", level: "Advanced", group: "French mélodie" },
  { id: "duparc-extase", title: "Extase", composer: "Duparc", composerFull: "Henri Duparc", lang: "fr", level: "Advanced", group: "French mélodie" },
  { id: "duparc-la-vie-anterieure", title: "La vie antérieure", composer: "Duparc", composerFull: "Henri Duparc", lang: "fr", level: "Advanced", group: "French mélodie", note: "Words by Baudelaire" },
  { id: "debussy-c-est-l-extase-langoureuse", title: "C'est l'extase langoureuse", composer: "Debussy", composerFull: "Claude Debussy", lang: "fr", level: "Advanced", group: "French mélodie", note: "From Ariettes oubliées" },
  { id: "debussy-il-pleure-dans-mon-c-ur", title: "Il pleure dans mon cœur", composer: "Debussy", composerFull: "Claude Debussy", lang: "fr", level: "Advanced", group: "French mélodie", note: "From Ariettes oubliées" },
  { id: "debussy-green", title: "Green", composer: "Debussy", composerFull: "Claude Debussy", lang: "fr", level: "Advanced", group: "French mélodie", note: "From Ariettes oubliées" },
  { id: "berlioz-villanelle", title: "Villanelle", composer: "Berlioz", composerFull: "Hector Berlioz", lang: "fr", level: "Intermediate", group: "French mélodie", note: "From Les nuits d'été" },
  { id: "berlioz-absence", title: "Absence", composer: "Berlioz", composerFull: "Hector Berlioz", lang: "fr", level: "Intermediate", group: "French mélodie", note: "From Les nuits d'été" },
  { id: "chausson-le-colibri", title: "Le colibri", composer: "Chausson", composerFull: "Ernest Chausson", lang: "fr", level: "Intermediate", group: "French mélodie" },
  { id: "ravel-kaddisch", title: "Kaddisch", composer: "Ravel", composerFull: "Maurice Ravel", lang: "arc", level: "Advanced", group: "French mélodie", note: "From Deux mélodies hébraïques" },
  { id: "tchaikovsky-none-but-the-lonely-heart", title: "None but the lonely heart (Net, tol'ko tot, kto znal)", composer: "Tchaikovsky", composerFull: "Pyotr Ilyich Tchaikovsky", lang: "ru", level: "Intermediate", group: "Russian song", note: "Words by Goethe, in Russian" },
  { id: "tchaikovsky-at-the-ball", title: "At the ball (Sred' shumnogo bala)", composer: "Tchaikovsky", composerFull: "Pyotr Ilyich Tchaikovsky", lang: "ru", level: "Intermediate", group: "Russian song" },
  { id: "rachmaninoff-lilacs", title: "Lilacs (Siren')", composer: "Rachmaninoff", composerFull: "Sergei Rachmaninoff", lang: "ru", level: "Intermediate", group: "Russian song" },
  { id: "rachmaninoff-in-the-silence-of-the-secret-night", title: "In the silence of the secret night (V molchan'i nochi taynoy)", composer: "Rachmaninoff", composerFull: "Sergei Rachmaninoff", lang: "ru", level: "Advanced", group: "Russian song" },
  { id: "grieg-jeg-elsker-dig", title: "Jeg elsker dig", composer: "Grieg", composerFull: "Edvard Grieg", lang: "da", level: "Beginner", group: "Nordic and Czech song", note: "Words by Hans Christian Andersen" },
  { id: "dvorak-songs-my-mother-taught-me", title: "Songs my mother taught me (Když mne stará matka)", composer: "Dvořák", composerFull: "Antonín Dvořák", lang: "cs", level: "Intermediate", group: "Nordic and Czech song", note: "From Gypsy Songs" },
  { id: "ives-the-circus-band", title: "The Circus Band", composer: "Ives", composerFull: "Charles Ives", lang: "en", level: "Intermediate", group: "English song" },
];

export const findSong = (id: string) => SONGS.find((s) => s.id === id);
