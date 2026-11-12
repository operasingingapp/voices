import { SCENES, type Scene } from "./scenes";
import catalog from "../../data/content/catalog.json";

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
    "desc": "The Count's valet, about to marry Susanna. (Mozart's score lists the role as a bass; today it is usually sung by a bass-baritone.)",
    "avatar": "short",
    "pieces": [
     {
      "title": "Cinque, dieci, venti",
      "kind": "Duet with Susanna · Act 1",
      "editionId": "mozart-cinque-dieci-venti"
     },
     {
      "title": "Se vuol ballare",
      "kind": "Cavatina · Act 1",
      "editionId": "mozart-se-vuol-ballare"
     },
     {
      "title": "Non più andrai",
      "kind": "Aria · Act 1",
      "editionId": "mozart-non-piu-andrai"
     },
     {
      "title": "Aprite un po' quegli occhi",
      "kind": "Aria · Act 4"
     },
     {
      "title": "Cosa stai misurando",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Cosa stai misurando",
      "editionId": "mozart-cosa-stai-misurando"
     },
     {
      "title": "Se a caso madama",
      "kind": "Duettino · Act 1",
      "id": "Act 1: Se a caso madama",
      "editionId": "mozart-se-a-caso-madama"
     },
     {
      "title": "Or bene, ascolta e taci",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Or bene, ascolta e taci",
      "editionId": "mozart-or-bene-ascolta-e-taci"
     },
     {
      "title": "Bravo, signor padrone!",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Bravo, signor padrone!",
      "editionId": "mozart-bravo-signor-padrone"
     },
     {
      "title": "Cos'è questa commedia",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Cos'è questa commedia",
      "editionId": "mozart-cos-e-questa-commedia"
     },
     {
      "title": "Evviva!",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Evviva! Evviva!",
      "editionId": "mozart-evviva"
     },
     {
      "title": "Vieni, cara Susanna",
      "kind": "Recitative · Act 2",
      "id": "Act 2: Vieni, cara Susanna",
      "editionId": "mozart-vieni-cara-susanna"
     },
     {
      "title": "Signori, di fuori son già i suonatori",
      "kind": "Finale · Act 2",
      "id": "Act 2: Signori, di fuori son già i suonatori",
      "editionId": "mozart-signori-di-fuori"
     },
     {
      "title": "Ah! signor, signor!",
      "kind": "Finale · Act 2",
      "id": "Act 2: Ah! signor, signor!",
      "editionId": "mozart-ah-signor-signor"
     },
     {
      "title": "Voi, signor, che giusto siete",
      "kind": "Finale · Act 2",
      "id": "Act 2: Voi, signor, che giusto siete",
      "editionId": "mozart-voi-signor-che-giusto-siete"
     },
     {
      "title": "E perchè fosti meco",
      "kind": "Recitative · Act 3",
      "id": "Act 3: E perchè fosti meco",
      "editionId": "mozart-e-perche-fosti-meco"
     },
     {
      "title": "È decisa la lite",
      "kind": "Recitative · Act 3",
      "id": "Act 3: È decisa la lite",
      "editionId": "mozart-e-decisa-la-lite"
     },
     {
      "title": "Eccovi, o caro amico",
      "kind": "Recitative · Act 3",
      "id": "Act 3: Eccovi, o caro amico",
      "editionId": "mozart-eccovi-o-caro-amico"
     },
     {
      "title": "Riconosci in questo amplesso",
      "kind": "Sestetto · Act 3",
      "id": "Act 3: Riconosci in questo amplesso",
      "editionId": "mozart-riconosci-in-questo-amplesso"
     },
     {
      "title": "Eh, cospettate!",
      "kind": "Recitative · Act 3",
      "id": "Act 3: Eh, cospettate!",
      "editionId": "mozart-eh-cospettate"
     },
     {
      "title": "Ecco la marcia",
      "kind": "Finale · Act 3",
      "id": "Act 3: Ecco la marcia",
      "editionId": "mozart-ecco-la-marcia"
     },
     {
      "title": "Barbarina, cos’hai?",
      "kind": "Recitative · Act 4",
      "id": "Act 4: Barbarina, cos’hai?",
      "editionId": "mozart-barbarina-coshai"
     },
     {
      "title": "Nel padiglione a manca",
      "kind": "Recitative · Act 4",
      "id": "Act 4: Nel padiglione a manca",
      "editionId": "mozart-nel-padiglione-a-manca"
     },
     {
      "title": "Tutto è disposto… Aprite un po' quegli occhi",
      "kind": "Aria · Act 4",
      "id": "Act 4: Tutto è disposto… Aprite un po' quegli occhi",
      "editionId": "mozart-tutto-e-disposto"
     },
     {
      "title": "Signora! ella mi disse",
      "kind": "Recitative · Act 4",
      "id": "Act 4: Signora! ella mi disse",
      "editionId": "mozart-signora-ella-mi-disse"
     },
     {
      "title": "Perfida! e in quella forma",
      "kind": "Recitative · Act 4",
      "id": "Act 4: Perfida! e in quella forma",
      "editionId": "mozart-perfida-e-in-quella-forma"
     },
     {
      "title": "Pian pianin, le andrò più presso",
      "kind": "Finale · Act 4",
      "id": "Act 4: Pian pianin, le andrò più presso",
      "editionId": "mozart-pian-pianin"
     },
     {
      "title": "Partito è alfin l'audace",
      "kind": "Finale · Act 4",
      "id": "Act 4: Partito è alfin l'audace",
      "editionId": "mozart-partito-e-alfin-l-audace"
     },
     {
      "title": "Tutto è tranquillo e placido",
      "kind": "Finale · Act 4",
      "id": "Act 4: Tutto è tranquillo e placido",
      "editionId": "mozart-tutto-e-tranquillo"
     },
     {
      "title": "Pace, pace, mio dolce tesoro!",
      "kind": "Finale · Act 4",
      "id": "Act 4: Pace, pace, mio dolce tesoro!",
      "editionId": "mozart-pace-pace"
     },
     {
      "title": "Questo giorno di tormenti",
      "kind": "Finale · Act 4",
      "id": "Act 4: Questo giorno di tormenti",
      "editionId": "mozart-questo-giorno-di-tormenti"
     },
     {
      "title": "Gente, gente, all'armi!",
      "kind": "Finale · Act 4",
      "id": "Act 4: Gente, gente, all'armi!",
      "editionId": "mozart-gente-gente-all-armi"
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
      "kind": "Duet with Figaro · Act 1",
      "editionId": "mozart-cinque-dieci-venti"
     },
     {
      "title": "Venite, inginocchiatevi",
      "kind": "Aria · Act 2",
      "editionId": "mozart-venite-inginocchiatevi"
     },
     {
      "title": "Sull'aria… che soave zeffiretto",
      "kind": "Letter duet with the Countess · Act 3"
     },
     {
      "title": "Deh vieni, non tardar",
      "kind": "Aria · Act 4"
     },
     {
      "title": "Cosa stai misurando",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Cosa stai misurando",
      "editionId": "mozart-cosa-stai-misurando"
     },
     {
      "title": "Se a caso madama",
      "kind": "Duettino · Act 1",
      "id": "Act 1: Se a caso madama",
      "editionId": "mozart-se-a-caso-madama"
     },
     {
      "title": "Or bene, ascolta e taci",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Or bene, ascolta e taci",
      "editionId": "mozart-or-bene-ascolta-e-taci"
     },
     {
      "title": "Basilio, in traccia tosto",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Basilio, in traccia tosto",
      "editionId": "mozart-basilio-in-traccia-tosto"
     },
     {
      "title": "Cos'è questa commedia",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Cos'è questa commedia",
      "editionId": "mozart-cos-e-questa-commedia"
     },
     {
      "title": "Evviva!",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Evviva! Evviva!",
      "editionId": "mozart-evviva"
     },
     {
      "title": "Vieni, cara Susanna",
      "kind": "Recitative · Act 2",
      "id": "Act 2: Vieni, cara Susanna",
      "editionId": "mozart-vieni-cara-susanna"
     },
     {
      "title": "Tutto ancor non ho perso",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Tutto ancor non ho perso",
      "editionId": "mozart-tutto-ancor-non-ho-perso"
     },
     {
      "title": "Via resti servita",
      "kind": "Duettino · Act 1",
      "id": "Act 1: Via resti servita",
      "editionId": "mozart-via-resti-servita"
     },
     {
      "title": "Quanto duolmi, Susanna",
      "kind": "Recitative · Act 2",
      "id": "Act 2: Quanto duolmi, Susanna",
      "editionId": "mozart-quanto-duolmi-susanna"
     },
     {
      "title": "Bravo! Che bella voce!",
      "kind": "Recitative · Act 2",
      "id": "Act 2: Bravo! Che bella voce!",
      "editionId": "mozart-bravo-che-bella-voce"
     },
     {
      "title": "Quante buffonerie!",
      "kind": "Recitative · Act 2",
      "id": "Act 2: Quante buffonerie!",
      "editionId": "mozart-quante-buffonerie"
     },
     {
      "title": "Susanna! Signore!",
      "kind": "Finale · Act 2",
      "id": "Act 2: Susanna! Signore!",
      "editionId": "mozart-susanna-signore"
     },
     {
      "title": "Taci, vien gente",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Taci, vien gente",
      "editionId": "mozart-taci-vien-gente"
     },
     {
      "title": "Cosa sento!",
      "kind": "Terzetto · Act 1",
      "id": "Act 1: Cosa sento!",
      "editionId": "mozart-cosa-sento"
     },
     {
      "title": "Crudel! perché finora",
      "kind": "Duet · Act 3",
      "id": "Act 3: Crudel! perché finora",
      "editionId": "mozart-crudel-perche-finora"
     },
     {
      "title": "Signori, di fuori son già i suonatori",
      "kind": "Finale · Act 2",
      "id": "Act 2: Signori, di fuori son già i suonatori",
      "editionId": "mozart-signori-di-fuori"
     },
     {
      "title": "Ah! signor, signor!",
      "kind": "Finale · Act 2",
      "id": "Act 2: Ah! signor, signor!",
      "editionId": "mozart-ah-signor-signor"
     },
     {
      "title": "Aprite, presto, aprite",
      "kind": "Duettino · Act 2",
      "id": "Act 2: Aprite, presto, aprite",
      "editionId": "mozart-aprite-presto-aprite"
     },
     {
      "title": "Oh guarda il demonietto!",
      "kind": "Recitative · Act 2",
      "id": "Act 2: Oh guarda il demonietto!",
      "editionId": "mozart-oh-guarda-il-demonietto"
     },
     {
      "title": "Susanna, or via, sortite",
      "kind": "Terzetto · Act 2",
      "id": "Act 2: Susanna, or via, sortite",
      "editionId": "mozart-susanna-or-via-sortite"
     },
     {
      "title": "Voi, signor, che giusto siete",
      "kind": "Finale · Act 2",
      "id": "Act 2: Voi, signor, che giusto siete",
      "editionId": "mozart-voi-signor-che-giusto-siete"
     },
     {
      "title": "Che imbarazzo è mai questo!",
      "kind": "Recitative · Act 3",
      "id": "Act 3: Che imbarazzo è mai questo!",
      "editionId": "mozart-che-imbarazzo"
     },
     {
      "title": "E perchè fosti meco",
      "kind": "Recitative · Act 3",
      "id": "Act 3: E perchè fosti meco",
      "editionId": "mozart-e-perche-fosti-meco"
     },
     {
      "title": "Eccovi, o caro amico",
      "kind": "Recitative · Act 3",
      "id": "Act 3: Eccovi, o caro amico",
      "editionId": "mozart-eccovi-o-caro-amico"
     },
     {
      "title": "Riconosci in questo amplesso",
      "kind": "Sestetto · Act 3",
      "id": "Act 3: Riconosci in questo amplesso",
      "editionId": "mozart-riconosci-in-questo-amplesso"
     },
     {
      "title": "Cosa mi narri?",
      "kind": "Recitative · Act 3",
      "id": "Act 3: Cosa mi narri?",
      "editionId": "mozart-cosa-mi-narri"
     },
     {
      "title": "Sull’aria",
      "kind": "Duettino · Act 3",
      "id": "Act 3: Sull’aria",
      "editionId": "mozart-sullaria"
     },
     {
      "title": "Piegato è il foglio",
      "kind": "Recitative · Act 3",
      "id": "Act 3: Piegato è il foglio",
      "editionId": "mozart-piegato-e-il-foglio"
     },
     {
      "title": "Queste sono, Madama",
      "kind": "Recitative · Act 3",
      "id": "Act 3: Queste sono, Madama",
      "editionId": "mozart-queste-sono-madama"
     },
     {
      "title": "Eh, cospettate!",
      "kind": "Recitative · Act 3",
      "id": "Act 3: Eh, cospettate!",
      "editionId": "mozart-eh-cospettate"
     },
     {
      "title": "Ecco la marcia",
      "kind": "Finale · Act 3",
      "id": "Act 3: Ecco la marcia",
      "editionId": "mozart-ecco-la-marcia"
     },
     {
      "title": "Signora! ella mi disse",
      "kind": "Recitative · Act 4",
      "id": "Act 4: Signora! ella mi disse",
      "editionId": "mozart-signora-ella-mi-disse"
     },
     {
      "title": "Giunse alfin il momento… Deh vieni, non tardar",
      "kind": "Aria · Act 4",
      "id": "Act 4: Giunse alfin il momento… Deh vieni, non tardar",
      "editionId": "mozart-giunse-alfin-il-momento"
     },
     {
      "title": "Va là, vecchia pedante",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Va là, vecchia pedante",
      "editionId": "mozart-va-la-vecchia-pedante"
     },
     {
      "title": "Pian pianin, le andrò più presso",
      "kind": "Finale · Act 4",
      "id": "Act 4: Pian pianin, le andrò più presso",
      "editionId": "mozart-pian-pianin"
     },
     {
      "title": "Partito è alfin l'audace",
      "kind": "Finale · Act 4",
      "id": "Act 4: Partito è alfin l'audace",
      "editionId": "mozart-partito-e-alfin-l-audace"
     },
     {
      "title": "Tutto è tranquillo e placido",
      "kind": "Finale · Act 4",
      "id": "Act 4: Tutto è tranquillo e placido",
      "editionId": "mozart-tutto-e-tranquillo"
     },
     {
      "title": "Pace, pace, mio dolce tesoro!",
      "kind": "Finale · Act 4",
      "id": "Act 4: Pace, pace, mio dolce tesoro!",
      "editionId": "mozart-pace-pace"
     },
     {
      "title": "Questo giorno di tormenti",
      "kind": "Finale · Act 4",
      "id": "Act 4: Questo giorno di tormenti",
      "editionId": "mozart-questo-giorno-di-tormenti"
     },
     {
      "title": "Gente, gente, all'armi!",
      "kind": "Finale · Act 4",
      "id": "Act 4: Gente, gente, all'armi!",
      "editionId": "mozart-gente-gente-all-armi"
     }
    ]
   },
   {
    "id": "countess",
    "name": "The Countess",
    "voice": "Soprano",
    "desc": "Rosina of Beaumarchais's play The Barber of Seville, now Countess Almaviva, neglected by her husband.",
    "avatar": "crown",
    "pieces": [
     {
      "title": "Porgi, amor",
      "kind": "Cavatina · Act 2",
      "editionId": "mozart-porgi-amor"
     },
     {
      "title": "E Susanna non vien!",
      "kind": "Recitative · Act 3",
      "editionId": "mozart-e-susanna-non-vien",
      "when": "Act 3, alone, waiting to hear how the Count took Susanna's promise of a meeting",
      "context": "Alone, the Countess waits for Susanna, anxious to know how the Count took Susanna's proposal. The plan seems bold with so jealous a husband, but what harm is there in changing clothes with Susanna under cover of night, to catch him herself? Then she turns bitter: the Count who loved her, then wronged her, then betrayed her, has brought her so low that she must ask her own maid for help."
     },
     {
      "title": "Dove sono",
      "kind": "Aria · Act 3",
      "editionId": "mozart-dove-sono",
      "when": "Straight after the recitative “E Susanna non vien!”",
      "context": "Still alone, the Countess remembers the happy days when the Count loved her and asks where his promises have gone. The slow, singing first part looks back; in the quick ending she clings to the hope that her faithfulness may yet win back his ungrateful heart."
     },
     {
      "title": "Sull'aria… che soave zeffiretto",
      "kind": "Letter duet with Susanna · Act 3"
     },
     {
      "title": "Vieni, cara Susanna",
      "kind": "Recitative · Act 2",
      "id": "Act 2: Vieni, cara Susanna",
      "editionId": "mozart-vieni-cara-susanna"
     },
     {
      "title": "Quanto duolmi, Susanna",
      "kind": "Recitative · Act 2",
      "id": "Act 2: Quanto duolmi, Susanna",
      "editionId": "mozart-quanto-duolmi-susanna"
     },
     {
      "title": "Bravo! Che bella voce!",
      "kind": "Recitative · Act 2",
      "id": "Act 2: Bravo! Che bella voce!",
      "editionId": "mozart-bravo-che-bella-voce"
     },
     {
      "title": "Quante buffonerie!",
      "kind": "Recitative · Act 2",
      "id": "Act 2: Quante buffonerie!",
      "editionId": "mozart-quante-buffonerie"
     },
     {
      "title": "Esci omai, garzon malnato",
      "kind": "Finale · Act 2",
      "id": "Act 2: Esci omai, garzon malnato",
      "editionId": "mozart-esci-omai-garzon-malnato"
     },
     {
      "title": "Susanna! Signore!",
      "kind": "Finale · Act 2",
      "id": "Act 2: Susanna! Signore!",
      "editionId": "mozart-susanna-signore"
     },
     {
      "title": "Signori, di fuori son già i suonatori",
      "kind": "Finale · Act 2",
      "id": "Act 2: Signori, di fuori son già i suonatori",
      "editionId": "mozart-signori-di-fuori"
     },
     {
      "title": "Ah! signor, signor!",
      "kind": "Finale · Act 2",
      "id": "Act 2: Ah! signor, signor!",
      "editionId": "mozart-ah-signor-signor"
     },
     {
      "title": "Dunque voi non aprite?",
      "kind": "Recitative · Act 2",
      "id": "Act 2: Dunque voi non aprite?",
      "editionId": "mozart-dunque-voi-non-aprite"
     },
     {
      "title": "Tutto è come il lasciai",
      "kind": "Recitative · Act 2",
      "id": "Act 2: Tutto è come il lasciai",
      "editionId": "mozart-tutto-e-come-il-lasciai"
     },
     {
      "title": "Che novità!",
      "kind": "Recitative · Act 2",
      "id": "Act 2: Che novità!",
      "editionId": "mozart-che-novita"
     },
     {
      "title": "Susanna, or via, sortite",
      "kind": "Terzetto · Act 2",
      "id": "Act 2: Susanna, or via, sortite",
      "editionId": "mozart-susanna-or-via-sortite"
     },
     {
      "title": "Voi, signor, che giusto siete",
      "kind": "Finale · Act 2",
      "id": "Act 2: Voi, signor, che giusto siete",
      "editionId": "mozart-voi-signor-che-giusto-siete"
     },
     {
      "title": "Che imbarazzo è mai questo!",
      "kind": "Recitative · Act 3",
      "id": "Act 3: Che imbarazzo è mai questo!",
      "editionId": "mozart-che-imbarazzo"
     },
     {
      "title": "Cosa mi narri?",
      "kind": "Recitative · Act 3",
      "id": "Act 3: Cosa mi narri?",
      "editionId": "mozart-cosa-mi-narri"
     },
     {
      "title": "Sull’aria",
      "kind": "Duettino · Act 3",
      "id": "Act 3: Sull’aria",
      "editionId": "mozart-sullaria"
     },
     {
      "title": "Piegato è il foglio",
      "kind": "Recitative · Act 3",
      "id": "Act 3: Piegato è il foglio",
      "editionId": "mozart-piegato-e-il-foglio"
     },
     {
      "title": "Queste sono, Madama",
      "kind": "Recitative · Act 3",
      "id": "Act 3: Queste sono, Madama",
      "editionId": "mozart-queste-sono-madama"
     },
     {
      "title": "Eh, cospettate!",
      "kind": "Recitative · Act 3",
      "id": "Act 3: Eh, cospettate!",
      "editionId": "mozart-eh-cospettate"
     },
     {
      "title": "Ecco la marcia",
      "kind": "Finale · Act 3",
      "id": "Act 3: Ecco la marcia",
      "editionId": "mozart-ecco-la-marcia"
     },
     {
      "title": "Signora! ella mi disse",
      "kind": "Recitative · Act 4",
      "id": "Act 4: Signora! ella mi disse",
      "editionId": "mozart-signora-ella-mi-disse"
     },
     {
      "title": "Perfida! e in quella forma",
      "kind": "Recitative · Act 4",
      "id": "Act 4: Perfida! e in quella forma",
      "editionId": "mozart-perfida-e-in-quella-forma"
     },
     {
      "title": "Pian pianin, le andrò più presso",
      "kind": "Finale · Act 4",
      "id": "Act 4: Pian pianin, le andrò più presso",
      "editionId": "mozart-pian-pianin"
     },
     {
      "title": "Partito è alfin l'audace",
      "kind": "Finale · Act 4",
      "id": "Act 4: Partito è alfin l'audace",
      "editionId": "mozart-partito-e-alfin-l-audace"
     },
     {
      "title": "Questo giorno di tormenti",
      "kind": "Finale · Act 4",
      "id": "Act 4: Questo giorno di tormenti",
      "editionId": "mozart-questo-giorno-di-tormenti"
     },
     {
      "title": "Gente, gente, all'armi!",
      "kind": "Finale · Act 4",
      "id": "Act 4: Gente, gente, all'armi!",
      "editionId": "mozart-gente-gente-all-armi"
     }
    ]
   },
   {
    "id": "count",
    "name": "Count Almaviva",
    "voice": "Baritone",
    "desc": "The Countess's husband, jealous of his wife though unfaithful himself, who has given up his feudal right over his servants' brides and would like it back for Susanna. (Mozart's score lists the role as a bass; today it is sung by a baritone.)",
    "avatar": "crown",
    "pieces": [
     {
      "title": "Hai già vinta la causa… Vedrò mentr'io sospiro",
      "kind": "Recitative and aria · Act 3"
     },
     {
      "title": "Basilio, in traccia tosto",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Basilio, in traccia tosto",
      "editionId": "mozart-basilio-in-traccia-tosto"
     },
     {
      "title": "Cos'è questa commedia",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Cos'è questa commedia",
      "editionId": "mozart-cos-e-questa-commedia"
     },
     {
      "title": "Evviva!",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Evviva! Evviva!",
      "editionId": "mozart-evviva"
     },
     {
      "title": "Quante buffonerie!",
      "kind": "Recitative · Act 2",
      "id": "Act 2: Quante buffonerie!",
      "editionId": "mozart-quante-buffonerie"
     },
     {
      "title": "Esci omai, garzon malnato",
      "kind": "Finale · Act 2",
      "id": "Act 2: Esci omai, garzon malnato",
      "editionId": "mozart-esci-omai-garzon-malnato"
     },
     {
      "title": "Susanna! Signore!",
      "kind": "Finale · Act 2",
      "id": "Act 2: Susanna! Signore!",
      "editionId": "mozart-susanna-signore"
     },
     {
      "title": "Taci, vien gente",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Taci, vien gente",
      "editionId": "mozart-taci-vien-gente"
     },
     {
      "title": "Cosa sento!",
      "kind": "Terzetto · Act 1",
      "id": "Act 1: Cosa sento!",
      "editionId": "mozart-cosa-sento"
     },
     {
      "title": "Crudel! perché finora",
      "kind": "Duet · Act 3",
      "id": "Act 3: Crudel! perché finora",
      "editionId": "mozart-crudel-perche-finora"
     },
     {
      "title": "Signori, di fuori son già i suonatori",
      "kind": "Finale · Act 2",
      "id": "Act 2: Signori, di fuori son già i suonatori",
      "editionId": "mozart-signori-di-fuori"
     },
     {
      "title": "Hai già vinta la causa!… Vedrò, mentr'io sospiro",
      "kind": "Recitative and aria · Act 3",
      "id": "Act 3: Hai già vinta la causa!",
      "editionId": "mozart-hai-gia-vinta"
     },
     {
      "title": "Ah! signor, signor!",
      "kind": "Finale · Act 2",
      "id": "Act 2: Ah! signor, signor!",
      "editionId": "mozart-ah-signor-signor"
     },
     {
      "title": "Dunque voi non aprite?",
      "kind": "Recitative · Act 2",
      "id": "Act 2: Dunque voi non aprite?",
      "editionId": "mozart-dunque-voi-non-aprite"
     },
     {
      "title": "Tutto è come il lasciai",
      "kind": "Recitative · Act 2",
      "id": "Act 2: Tutto è come il lasciai",
      "editionId": "mozart-tutto-e-come-il-lasciai"
     },
     {
      "title": "Che novità!",
      "kind": "Recitative · Act 2",
      "id": "Act 2: Che novità!",
      "editionId": "mozart-che-novita"
     },
     {
      "title": "Susanna, or via, sortite",
      "kind": "Terzetto · Act 2",
      "id": "Act 2: Susanna, or via, sortite",
      "editionId": "mozart-susanna-or-via-sortite"
     },
     {
      "title": "Voi, signor, che giusto siete",
      "kind": "Finale · Act 2",
      "id": "Act 2: Voi, signor, che giusto siete",
      "editionId": "mozart-voi-signor-che-giusto-siete"
     },
     {
      "title": "Che imbarazzo è mai questo!",
      "kind": "Recitative · Act 3",
      "id": "Act 3: Che imbarazzo è mai questo!",
      "editionId": "mozart-che-imbarazzo"
     },
     {
      "title": "E perchè fosti meco",
      "kind": "Recitative · Act 3",
      "id": "Act 3: E perchè fosti meco",
      "editionId": "mozart-e-perche-fosti-meco"
     },
     {
      "title": "È decisa la lite",
      "kind": "Recitative · Act 3",
      "id": "Act 3: È decisa la lite",
      "editionId": "mozart-e-decisa-la-lite"
     },
     {
      "title": "Riconosci in questo amplesso",
      "kind": "Sestetto · Act 3",
      "id": "Act 3: Riconosci in questo amplesso",
      "editionId": "mozart-riconosci-in-questo-amplesso"
     },
     {
      "title": "Io vi dico, signor",
      "kind": "Recitative · Act 3",
      "id": "Act 3: Io vi dico, signor",
      "editionId": "mozart-io-vi-dico-signor"
     },
     {
      "title": "Eh, cospettate!",
      "kind": "Recitative · Act 3",
      "id": "Act 3: Eh, cospettate!",
      "editionId": "mozart-eh-cospettate"
     },
     {
      "title": "Ecco la marcia",
      "kind": "Finale · Act 3",
      "id": "Act 3: Ecco la marcia",
      "editionId": "mozart-ecco-la-marcia"
     },
     {
      "title": "Pian pianin, le andrò più presso",
      "kind": "Finale · Act 4",
      "id": "Act 4: Pian pianin, le andrò più presso",
      "editionId": "mozart-pian-pianin"
     },
     {
      "title": "Partito è alfin l'audace",
      "kind": "Finale · Act 4",
      "id": "Act 4: Partito è alfin l'audace",
      "editionId": "mozart-partito-e-alfin-l-audace"
     },
     {
      "title": "Pace, pace, mio dolce tesoro!",
      "kind": "Finale · Act 4",
      "id": "Act 4: Pace, pace, mio dolce tesoro!",
      "editionId": "mozart-pace-pace"
     },
     {
      "title": "Questo giorno di tormenti",
      "kind": "Finale · Act 4",
      "id": "Act 4: Questo giorno di tormenti",
      "editionId": "mozart-questo-giorno-di-tormenti"
     },
     {
      "title": "Gente, gente, all'armi!",
      "kind": "Finale · Act 4",
      "id": "Act 4: Gente, gente, all'armi!",
      "editionId": "mozart-gente-gente-all-armi"
     }
    ]
   },
   {
    "id": "cherubino",
    "name": "Cherubino",
    "voice": "Mezzo-soprano",
    "desc": "The Count's young page, in love with every woman he sees; a trouser role, sung by a woman. (Mozart wrote the role for a soprano; today it is usually sung by a mezzo.)",
    "avatar": "curls",
    "pieces": [
     {
      "title": "Non so più cosa son",
      "kind": "Aria · Act 1",
      "editionId": "mozart-non-so-piu"
     },
     {
      "title": "Voi che sapete",
      "kind": "Canzona · Act 2",
      "editionId": "mozart-voi-che-sapete"
     },
     {
      "title": "Basilio, in traccia tosto",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Basilio, in traccia tosto",
      "editionId": "mozart-basilio-in-traccia-tosto"
     },
     {
      "title": "Evviva!",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Evviva! Evviva!",
      "editionId": "mozart-evviva"
     },
     {
      "title": "Quanto duolmi, Susanna",
      "kind": "Recitative · Act 2",
      "id": "Act 2: Quanto duolmi, Susanna",
      "editionId": "mozart-quanto-duolmi-susanna"
     },
     {
      "title": "Bravo! Che bella voce!",
      "kind": "Recitative · Act 2",
      "id": "Act 2: Bravo! Che bella voce!",
      "editionId": "mozart-bravo-che-bella-voce"
     },
     {
      "title": "Quante buffonerie!",
      "kind": "Recitative · Act 2",
      "id": "Act 2: Quante buffonerie!",
      "editionId": "mozart-quante-buffonerie"
     },
     {
      "title": "Aprite, presto, aprite",
      "kind": "Duettino · Act 2",
      "id": "Act 2: Aprite, presto, aprite",
      "editionId": "mozart-aprite-presto-aprite"
     },
     {
      "title": "Andiam, andiam, bel paggio",
      "kind": "Recitative · Act 3",
      "id": "Act 3: Andiam, andiam, bel paggio",
      "editionId": "mozart-andiam-bel-paggio"
     },
     {
      "title": "Eh, cospettate!",
      "kind": "Recitative · Act 3",
      "id": "Act 3: Eh, cospettate!",
      "editionId": "mozart-eh-cospettate"
     },
     {
      "title": "Perfida! e in quella forma",
      "kind": "Recitative · Act 4",
      "id": "Act 4: Perfida! e in quella forma",
      "editionId": "mozart-perfida-e-in-quella-forma"
     },
     {
      "title": "Va là, vecchia pedante",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Va là, vecchia pedante",
      "editionId": "mozart-va-la-vecchia-pedante"
     },
     {
      "title": "Pian pianin, le andrò più presso",
      "kind": "Finale · Act 4",
      "id": "Act 4: Pian pianin, le andrò più presso",
      "editionId": "mozart-pian-pianin"
     },
     {
      "title": "Questo giorno di tormenti",
      "kind": "Finale · Act 4",
      "id": "Act 4: Questo giorno di tormenti",
      "editionId": "mozart-questo-giorno-di-tormenti"
     },
     {
      "title": "Gente, gente, all'armi!",
      "kind": "Finale · Act 4",
      "id": "Act 4: Gente, gente, all'armi!",
      "editionId": "mozart-gente-gente-all-armi"
     }
    ]
   },
   {
    "id": "bartolo",
    "name": "Doctor Bartolo",
    "voice": "Bass",
    "desc": "A doctor from Seville, Rosina's old guardian, who has not forgiven Figaro for helping her marry the Count.",
    "avatar": "beard",
    "pieces": [
     {
      "title": "La vendetta",
      "kind": "Aria · Act 1",
      "editionId": "mozart-la-vendetta"
     },
     {
      "title": "Ed aspettaste il giorno",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Ed aspettaste il giorno",
      "editionId": "mozart-ed-aspettaste-il-giorno"
     },
     {
      "title": "Voi, signor, che giusto siete",
      "kind": "Finale · Act 2",
      "id": "Act 2: Voi, signor, che giusto siete",
      "editionId": "mozart-voi-signor-che-giusto-siete"
     },
     {
      "title": "È decisa la lite",
      "kind": "Recitative · Act 3",
      "id": "Act 3: È decisa la lite",
      "editionId": "mozart-e-decisa-la-lite"
     },
     {
      "title": "Eccovi, o caro amico",
      "kind": "Recitative · Act 3",
      "id": "Act 3: Eccovi, o caro amico",
      "editionId": "mozart-eccovi-o-caro-amico"
     },
     {
      "title": "Riconosci in questo amplesso",
      "kind": "Sestetto · Act 3",
      "id": "Act 3: Riconosci in questo amplesso",
      "editionId": "mozart-riconosci-in-questo-amplesso"
     },
     {
      "title": "Nel padiglione a manca",
      "kind": "Recitative · Act 4",
      "id": "Act 4: Nel padiglione a manca",
      "editionId": "mozart-nel-padiglione-a-manca"
     },
     {
      "title": "Hai diavoli nel corpo?",
      "kind": "Recitative · Act 4",
      "id": "Act 4: Hai diavoli nel corpo?",
      "editionId": "mozart-hai-diavoli-nel-corpo"
     },
     {
      "title": "Questo giorno di tormenti",
      "kind": "Finale · Act 4",
      "id": "Act 4: Questo giorno di tormenti",
      "editionId": "mozart-questo-giorno-di-tormenti"
     },
     {
      "title": "Gente, gente, all'armi!",
      "kind": "Finale · Act 4",
      "id": "Act 4: Gente, gente, all'armi!",
      "editionId": "mozart-gente-gente-all-armi"
     }
    ]
   },
   {
    "id": "marcellina",
    "name": "Marcellina",
    "voice": "Mezzo-soprano",
    "desc": "Housekeeper at the castle, once Bartolo's servant, who has lent Figaro money on his promise to marry her. (Mozart wrote the role for a soprano; today it is usually sung by a mezzo.)",
    "avatar": "bun",
    "pieces": [
     {
      "title": "Ed aspettaste il giorno",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Ed aspettaste il giorno",
      "editionId": "mozart-ed-aspettaste-il-giorno"
     },
     {
      "title": "Tutto ancor non ho perso",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Tutto ancor non ho perso",
      "editionId": "mozart-tutto-ancor-non-ho-perso"
     },
     {
      "title": "Via resti servita",
      "kind": "Duettino · Act 1",
      "id": "Act 1: Via resti servita",
      "editionId": "mozart-via-resti-servita"
     },
     {
      "title": "Voi, signor, che giusto siete",
      "kind": "Finale · Act 2",
      "id": "Act 2: Voi, signor, che giusto siete",
      "editionId": "mozart-voi-signor-che-giusto-siete"
     },
     {
      "title": "È decisa la lite",
      "kind": "Recitative · Act 3",
      "id": "Act 3: È decisa la lite",
      "editionId": "mozart-e-decisa-la-lite"
     },
     {
      "title": "Eccovi, o caro amico",
      "kind": "Recitative · Act 3",
      "id": "Act 3: Eccovi, o caro amico",
      "editionId": "mozart-eccovi-o-caro-amico"
     },
     {
      "title": "Riconosci in questo amplesso",
      "kind": "Sestetto · Act 3",
      "id": "Act 3: Riconosci in questo amplesso",
      "editionId": "mozart-riconosci-in-questo-amplesso"
     },
     {
      "title": "Barbarina, cos’hai?",
      "kind": "Recitative · Act 4",
      "id": "Act 4: Barbarina, cos’hai?",
      "editionId": "mozart-barbarina-coshai"
     },
     {
      "title": "Presto avvertiam Susanna",
      "kind": "Recitative · Act 4",
      "id": "Act 4: Presto avvertiam Susanna",
      "editionId": "mozart-presto-avvertiam-susanna"
     },
     {
      "title": "Il capro e la capretta",
      "kind": "Aria · Act 4",
      "id": "Act 4: Il capro e la capretta",
      "editionId": "mozart-il-capro-e-la-capretta"
     },
     {
      "title": "Signora! ella mi disse",
      "kind": "Recitative · Act 4",
      "id": "Act 4: Signora! ella mi disse",
      "editionId": "mozart-signora-ella-mi-disse"
     },
     {
      "title": "Questo giorno di tormenti",
      "kind": "Finale · Act 4",
      "id": "Act 4: Questo giorno di tormenti",
      "editionId": "mozart-questo-giorno-di-tormenti"
     },
     {
      "title": "Gente, gente, all'armi!",
      "kind": "Finale · Act 4",
      "id": "Act 4: Gente, gente, all'armi!",
      "editionId": "mozart-gente-gente-all-armi"
     }
    ]
   },
   {
    "id": "basilio",
    "name": "Don Basilio",
    "voice": "Tenor",
    "desc": "Susanna's singing master, the Count's go-between with her, and a gossip.",
    "avatar": "hat",
    "pieces": [
     {
      "title": "Basilio, in traccia tosto",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Basilio, in traccia tosto",
      "editionId": "mozart-basilio-in-traccia-tosto"
     },
     {
      "title": "Evviva!",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Evviva! Evviva!",
      "editionId": "mozart-evviva"
     },
     {
      "title": "Taci, vien gente",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Taci, vien gente",
      "editionId": "mozart-taci-vien-gente"
     },
     {
      "title": "Cosa sento!",
      "kind": "Terzetto · Act 1",
      "id": "Act 1: Cosa sento!",
      "editionId": "mozart-cosa-sento"
     },
     {
      "title": "Voi, signor, che giusto siete",
      "kind": "Finale · Act 2",
      "id": "Act 2: Voi, signor, che giusto siete",
      "editionId": "mozart-voi-signor-che-giusto-siete"
     },
     {
      "title": "Nel padiglione a manca",
      "kind": "Recitative · Act 4",
      "id": "Act 4: Nel padiglione a manca",
      "editionId": "mozart-nel-padiglione-a-manca"
     },
     {
      "title": "Hai diavoli nel corpo?",
      "kind": "Recitative · Act 4",
      "id": "Act 4: Hai diavoli nel corpo?",
      "editionId": "mozart-hai-diavoli-nel-corpo"
     },
     {
      "title": "In quegl'anni",
      "kind": "Aria · Act 4",
      "id": "Act 4: In quegl'anni",
      "editionId": "mozart-in-quegli-anni"
     },
     {
      "title": "Questo giorno di tormenti",
      "kind": "Finale · Act 4",
      "id": "Act 4: Questo giorno di tormenti",
      "editionId": "mozart-questo-giorno-di-tormenti"
     },
     {
      "title": "Gente, gente, all'armi!",
      "kind": "Finale · Act 4",
      "id": "Act 4: Gente, gente, all'armi!",
      "editionId": "mozart-gente-gente-all-armi"
     }
    ]
   },
   {
    "id": "curzio",
    "name": "Don Curzio",
    "voice": "Tenor",
    "desc": "The judge who hears Marcellina's case against Figaro.",
    "avatar": "short",
    "pieces": [
     {
      "title": "È decisa la lite",
      "kind": "Recitative · Act 3",
      "id": "Act 3: È decisa la lite",
      "editionId": "mozart-e-decisa-la-lite"
     },
     {
      "title": "Riconosci in questo amplesso",
      "kind": "Sestetto · Act 3",
      "id": "Act 3: Riconosci in questo amplesso",
      "editionId": "mozart-riconosci-in-questo-amplesso"
     },
     {
      "title": "Questo giorno di tormenti",
      "kind": "Finale · Act 4",
      "id": "Act 4: Questo giorno di tormenti",
      "editionId": "mozart-questo-giorno-di-tormenti"
     },
     {
      "title": "Gente, gente, all'armi!",
      "kind": "Finale · Act 4",
      "id": "Act 4: Gente, gente, all'armi!",
      "editionId": "mozart-gente-gente-all-armi"
     }
    ]
   },
   {
    "id": "barbarina",
    "name": "Barbarina",
    "voice": "Soprano",
    "desc": "The gardener's young daughter, Susanna's cousin, sweet on Cherubino; the Count has been flirting with her.",
    "avatar": "long",
    "pieces": [
     {
      "title": "Andiam, andiam, bel paggio",
      "kind": "Recitative · Act 3",
      "id": "Act 3: Andiam, andiam, bel paggio",
      "editionId": "mozart-andiam-bel-paggio"
     },
     {
      "title": "Queste sono, Madama",
      "kind": "Recitative · Act 3",
      "id": "Act 3: Queste sono, Madama",
      "editionId": "mozart-queste-sono-madama"
     },
     {
      "title": "Eh, cospettate!",
      "kind": "Recitative · Act 3",
      "id": "Act 3: Eh, cospettate!",
      "editionId": "mozart-eh-cospettate"
     },
     {
      "title": "L’ho perduta",
      "kind": "Cavatina · Act 4",
      "id": "Act 4: L’ho perduta",
      "editionId": "mozart-lho-perduta"
     },
     {
      "title": "Barbarina, cos’hai?",
      "kind": "Recitative · Act 4",
      "id": "Act 4: Barbarina, cos’hai?",
      "editionId": "mozart-barbarina-coshai"
     },
     {
      "title": "Nel padiglione a manca",
      "kind": "Recitative · Act 4",
      "id": "Act 4: Nel padiglione a manca",
      "editionId": "mozart-nel-padiglione-a-manca"
     },
     {
      "title": "Questo giorno di tormenti",
      "kind": "Finale · Act 4",
      "id": "Act 4: Questo giorno di tormenti",
      "editionId": "mozart-questo-giorno-di-tormenti"
     },
     {
      "title": "Gente, gente, all'armi!",
      "kind": "Finale · Act 4",
      "id": "Act 4: Gente, gente, all'armi!",
      "editionId": "mozart-gente-gente-all-armi"
     }
    ]
   },
   {
    "id": "antonio",
    "name": "Antonio",
    "voice": "Bass",
    "desc": "The Count's gardener, Susanna's uncle and Barbarina's father.",
    "avatar": "cap",
    "pieces": [
     {
      "title": "Ah! signor, signor!",
      "kind": "Finale · Act 2",
      "id": "Act 2: Ah! signor, signor!",
      "editionId": "mozart-ah-signor-signor"
     },
     {
      "title": "Io vi dico, signor",
      "kind": "Recitative · Act 3",
      "id": "Act 3: Io vi dico, signor",
      "editionId": "mozart-io-vi-dico-signor"
     },
     {
      "title": "Eh, cospettate!",
      "kind": "Recitative · Act 3",
      "id": "Act 3: Eh, cospettate!",
      "editionId": "mozart-eh-cospettate"
     },
     {
      "title": "Questo giorno di tormenti",
      "kind": "Finale · Act 4",
      "id": "Act 4: Questo giorno di tormenti",
      "editionId": "mozart-questo-giorno-di-tormenti"
     },
     {
      "title": "Gente, gente, all'armi!",
      "kind": "Finale · Act 4",
      "id": "Act 4: Gente, gente, all'armi!",
      "editionId": "mozart-gente-gente-all-armi"
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
    "desc": "A lady from Ferrara living in Naples, Dorabella's sister, engaged to Guglielmo.",
    "avatar": "bun",
    "pieces": [
     {
      "title": "Soave sia il vento",
      "kind": "Terzettino · Act 1",
      "editionId": "mozart-soave-sia-il-vento",
      "when": "Act 1, the boat carrying the officers is disappearing from sight, and the sisters wish it a safe voyage"
     },
     {
      "title": "Ah guarda, sorella",
      "kind": "Duetto · Act 1",
      "id": "Act 1: Ah guarda, sorella",
      "editionId": "mozart-ah-guarda-sorella",
      "when": "Act 1, in a garden by the sea, the sisters look at the portraits of their fiancés that they wear at their sides"
     },
     {
      "title": "Sento, o Dio, che questo piede",
      "kind": "Quintetto · Act 1",
      "id": "Act 1: Sento, o Dio, che questo piede",
      "editionId": "mozart-sento-o-dio",
      "when": "Act 1, Don Alfonso has told the sisters that a royal order sends the officers to war at once, and calls the two men in to say goodbye"
     },
     {
      "title": "Di scrivermi ogni giorno",
      "kind": "Quintetto · Act 1",
      "id": "Act 1: Di scrivermi ogni giorno",
      "editionId": "mozart-di-scrivermi-ogni-giorno",
      "when": "Act 1, after the soldiers' chorus: Don Alfonso says the regiment's boat has left and friends wait for the officers in a lighter boat, and the lovers embrace for the last time"
     },
     {
      "title": "Temerari, sortite… Come scoglio",
      "kind": "Recitative and aria · Act 1",
      "id": "Act 1: Temerari, sortite… Come scoglio",
      "editionId": "mozart-come-scoglio",
      "when": "Act 1, Don Alfonso has passed off the two moustached strangers as his dearest friends, and they have declared their love; Dorabella asks her sister what they should do"
     },
     {
      "title": "Prenderò quel brunettino",
      "kind": "Duetto · Act 2",
      "id": "Act 2: Prenderò quel brunettino",
      "when": "Act 2, Dorabella has persuaded Fiordiligi that a little amusement is no breach of faith, and asks which of the two strangers she wants; she has already chosen hers"
     },
     {
      "title": "Ei parte… Per pietà",
      "kind": "Recitative and rondò · Act 2",
      "id": "Act 2: Ei parte… Per pietà",
      "when": "Act 2, Ferrando has gone; Fiordiligi is alone, frightened by what she now feels"
     },
     {
      "title": "Fra gli amplessi in pochi istanti",
      "kind": "Duetto · Act 2",
      "id": "Act 2: Fra gli amplessi in pochi istanti",
      "when": "Act 2, Fiordiligi has sent for the officers' uniforms and put on a hat, meaning to join her fiancé at the front; Guglielmo and Don Alfonso are watching unseen"
     },
     {
      "title": "Mi par, che stamattina volentieri",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Mi par, che stamattina volentieri",
      "editionId": "mozart-mi-par-che-stamattina",
      "when": "Act 1, in the garden by the sea, straight after “Ah guarda, sorella”: the sisters have sworn on their fiancés' portraits to stay true, and are waiting for them to come"
     },
     {
      "title": "Stelle, per carità, Signor Alfonso",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Stelle, per carità, Signor Alfonso",
      "editionId": "mozart-stelle-per-carita",
      "when": "Act 1, in the garden by the sea, straight after “Vorrei dir”: Don Alfonso has stammered that he cannot bring himself to tell the sisters the terrible news"
     },
     {
      "title": "Non piangere, idol mio",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Non piangere, idol mio",
      "editionId": "mozart-non-piangere-idol-mio",
      "when": "Act 1, straight after “Sento, o Dio, che questo piede”: the sisters have begged the officers not to go, and all five have lamented that fate cheats human hopes"
     },
     {
      "title": "La comedia è graziosa",
      "kind": "Recitative · Act 1",
      "id": "Act 1: La comedia è graziosa",
      "editionId": "mozart-la-commedia-e-graziosa",
      "when": "Act 1, straight after “Al fato dan legge”: the officers have promised their sweethearts to come back happily to their arms"
     },
     {
      "title": "Non v'è più tempo, amici",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Non v'è più tempo, amici",
      "editionId": "mozart-non-ve-piu-tempo-amici",
      "when": "Act 1, straight after the soldiers' chorus “Bella vita militar”: the boat has come in to the shore to take the officers away"
     },
     {
      "title": "Dove son?",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Dove son?",
      "editionId": "mozart-dove-son",
      "when": "Act 1, on the shore, straight after “Di scrivermi ogni giorno”: the boat has carried the officers away to the sound of drums, and the sisters stand motionless"
     },
     {
      "title": "Che vita maledetta",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Che vita maledetta",
      "editionId": "mozart-che-vita-maledetta",
      "when": "Act 1, in a room in the sisters' house, after the officers have sailed: Despina, the sisters' maid, is alone, whisking their morning chocolate"
     },
     {
      "title": "Signora Dorabella, Signora Fiordiligi",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Signora Dorabella, Signora Fiordiligi",
      "editionId": "mozart-signora-dorabella",
      "when": "Act 1, straight after “Ah scostati… Smanie implacabili”: Dorabella has raged at her torments, and both sisters sit apart, beside themselves, while Despina wonders what has happened"
     },
     {
      "title": "Alla bella Despinetta",
      "kind": "Sestetto · Act 1",
      "id": "Act 1: Alla bella Despinetta",
      "editionId": "mozart-alla-bella-despinetta",
      "when": "Act 1, Don Alfonso has promised Despina twenty scudi to help two strangers win her mistresses' favour, and brings in the officers disguised as 'Albanians'"
     },
     {
      "title": "Che susurro, che strepito",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Che susurro, che strepito",
      "editionId": "mozart-che-susurro",
      "when": "Act 1, straight after “Alla bella Despinetta”: the sisters are raging at the two strangers in their house, and Don Alfonso comes in as if drawn by the noise"
     },
     {
      "title": "Ah non partite!",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Ah non partite!",
      "editionId": "mozart-ah-non-partite",
      "when": "Act 1, straight after “Come scoglio”: Fiordiligi has sworn to stay true until death, and the sisters turn to leave"
     }
    ]
   },
   {
    "id": "dorabella",
    "name": "Dorabella",
    "voice": "Mezzo-soprano",
    "desc": "A lady from Ferrara living in Naples, Fiordiligi's sister, engaged to Ferrando. (The score lists her as Soprano.)",
    "avatar": "long",
    "pieces": [
     {
      "title": "Soave sia il vento",
      "kind": "Terzettino · Act 1",
      "editionId": "mozart-soave-sia-il-vento",
      "when": "Act 1, the boat carrying the officers is disappearing from sight, and the sisters wish it a safe voyage"
     },
     {
      "title": "Ah guarda, sorella",
      "kind": "Duetto · Act 1",
      "id": "Act 1: Ah guarda, sorella",
      "editionId": "mozart-ah-guarda-sorella",
      "when": "Act 1, in a garden by the sea, the sisters look at the portraits of their fiancés that they wear at their sides"
     },
     {
      "title": "Sento, o Dio, che questo piede",
      "kind": "Quintetto · Act 1",
      "id": "Act 1: Sento, o Dio, che questo piede",
      "editionId": "mozart-sento-o-dio",
      "when": "Act 1, Don Alfonso has told the sisters that a royal order sends the officers to war at once, and calls the two men in to say goodbye"
     },
     {
      "title": "Di scrivermi ogni giorno",
      "kind": "Quintetto · Act 1",
      "id": "Act 1: Di scrivermi ogni giorno",
      "editionId": "mozart-di-scrivermi-ogni-giorno",
      "when": "Act 1, after the soldiers' chorus: Don Alfonso says the regiment's boat has left and friends wait for the officers in a lighter boat, and the lovers embrace for the last time"
     },
     {
      "title": "Ah scostati… Smanie implacabili",
      "kind": "Recitative and aria · Act 1",
      "id": "Act 1: Ah scostati… Smanie implacabili",
      "editionId": "mozart-ah-scostati-smanie-implacabili",
      "when": "Act 1, back at home, Dorabella has thrown the breakfast Despina brought on the floor and the sisters have torn off their jewellery; Despina asks what has happened"
     },
     {
      "title": "Prenderò quel brunettino",
      "kind": "Duetto · Act 2",
      "id": "Act 2: Prenderò quel brunettino",
      "when": "Act 2, Dorabella has persuaded Fiordiligi that a little amusement is no breach of faith, and asks which of the two strangers she wants; she has already chosen hers"
     },
     {
      "title": "Il core vi dono",
      "kind": "Duetto · Act 2",
      "id": "Act 2: Il core vi dono",
      "when": "Act 2, walking in the garden, Dorabella has just accepted Guglielmo's little gift of a heart"
     },
     {
      "title": "È amore un ladroncello",
      "kind": "Aria · Act 2",
      "id": "Act 2: È amore un ladroncello",
      "when": "Act 2, Fiordiligi has confessed that she loves the fair stranger but says she will master herself; Dorabella tells her she had better give in"
     },
     {
      "title": "Mi par, che stamattina volentieri",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Mi par, che stamattina volentieri",
      "editionId": "mozart-mi-par-che-stamattina",
      "when": "Act 1, in the garden by the sea, straight after “Ah guarda, sorella”: the sisters have sworn on their fiancés' portraits to stay true, and are waiting for them to come"
     },
     {
      "title": "Stelle, per carità, Signor Alfonso",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Stelle, per carità, Signor Alfonso",
      "editionId": "mozart-stelle-per-carita",
      "when": "Act 1, in the garden by the sea, straight after “Vorrei dir”: Don Alfonso has stammered that he cannot bring himself to tell the sisters the terrible news"
     },
     {
      "title": "Non piangere, idol mio",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Non piangere, idol mio",
      "editionId": "mozart-non-piangere-idol-mio",
      "when": "Act 1, straight after “Sento, o Dio, che questo piede”: the sisters have begged the officers not to go, and all five have lamented that fate cheats human hopes"
     },
     {
      "title": "La comedia è graziosa",
      "kind": "Recitative · Act 1",
      "id": "Act 1: La comedia è graziosa",
      "editionId": "mozart-la-commedia-e-graziosa",
      "when": "Act 1, straight after “Al fato dan legge”: the officers have promised their sweethearts to come back happily to their arms"
     },
     {
      "title": "Non v'è più tempo, amici",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Non v'è più tempo, amici",
      "editionId": "mozart-non-ve-piu-tempo-amici",
      "when": "Act 1, straight after the soldiers' chorus “Bella vita militar”: the boat has come in to the shore to take the officers away"
     },
     {
      "title": "Dove son?",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Dove son?",
      "editionId": "mozart-dove-son",
      "when": "Act 1, on the shore, straight after “Di scrivermi ogni giorno”: the boat has carried the officers away to the sound of drums, and the sisters stand motionless"
     },
     {
      "title": "Che vita maledetta",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Che vita maledetta",
      "editionId": "mozart-che-vita-maledetta",
      "when": "Act 1, in a room in the sisters' house, after the officers have sailed: Despina, the sisters' maid, is alone, whisking their morning chocolate"
     },
     {
      "title": "Signora Dorabella, Signora Fiordiligi",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Signora Dorabella, Signora Fiordiligi",
      "editionId": "mozart-signora-dorabella",
      "when": "Act 1, straight after “Ah scostati… Smanie implacabili”: Dorabella has raged at her torments, and both sisters sit apart, beside themselves, while Despina wonders what has happened"
     },
     {
      "title": "Alla bella Despinetta",
      "kind": "Sestetto · Act 1",
      "id": "Act 1: Alla bella Despinetta",
      "editionId": "mozart-alla-bella-despinetta",
      "when": "Act 1, Don Alfonso has promised Despina twenty scudi to help two strangers win her mistresses' favour, and brings in the officers disguised as 'Albanians'"
     },
     {
      "title": "Che susurro, che strepito",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Che susurro, che strepito",
      "editionId": "mozart-che-susurro",
      "when": "Act 1, straight after “Alla bella Despinetta”: the sisters are raging at the two strangers in their house, and Don Alfonso comes in as if drawn by the noise"
     },
     {
      "title": "Ah non partite!",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Ah non partite!",
      "editionId": "mozart-ah-non-partite",
      "when": "Act 1, straight after “Come scoglio”: Fiordiligi has sworn to stay true until death, and the sisters turn to leave"
     }
    ]
   },
   {
    "id": "despina",
    "name": "Despina",
    "voice": "Soprano",
    "desc": "The sisters' maid.",
    "avatar": "cap",
    "pieces": [
     {
      "title": "In uomini, in soldati",
      "kind": "Aria · Act 1",
      "id": "Act 1: In uomini, in soldati",
      "editionId": "mozart-in-uomini-in-soldati",
      "when": "Act 1, Despina has heard that the sisters' lovers have gone to war and told them to amuse themselves; Dorabella calls her talk an insult to faithful lovers"
     },
     {
      "title": "Una donna a quindici anni",
      "kind": "Aria · Act 2",
      "id": "Act 2: Una donna a quindici anni",
      "when": "Act 2, Despina is urging the sisters to let the two rich strangers adore them; asked what they should do, she answers: whatever they like, are they flesh and blood or not?"
     },
     {
      "title": "Che vita maledetta",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Che vita maledetta",
      "editionId": "mozart-che-vita-maledetta",
      "when": "Act 1, in a room in the sisters' house, after the officers have sailed: Despina, the sisters' maid, is alone, whisking their morning chocolate"
     },
     {
      "title": "Signora Dorabella, Signora Fiordiligi",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Signora Dorabella, Signora Fiordiligi",
      "editionId": "mozart-signora-dorabella",
      "when": "Act 1, straight after “Ah scostati… Smanie implacabili”: Dorabella has raged at her torments, and both sisters sit apart, beside themselves, while Despina wonders what has happened"
     },
     {
      "title": "Che silenzio, che aspetto di tristezza",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Che silenzio, che aspetto di tristezza",
      "editionId": "mozart-che-silenzio",
      "when": "Act 1, straight after “In uomini, in soldati”: Despina and the sisters have gone out, and Don Alfonso comes into the empty room alone"
     },
     {
      "title": "Alla bella Despinetta",
      "kind": "Sestetto · Act 1",
      "id": "Act 1: Alla bella Despinetta",
      "editionId": "mozart-alla-bella-despinetta",
      "when": "Act 1, Don Alfonso has promised Despina twenty scudi to help two strangers win her mistresses' favour, and brings in the officers disguised as 'Albanians'"
     },
     {
      "title": "Che susurro, che strepito",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Che susurro, che strepito",
      "editionId": "mozart-che-susurro",
      "when": "Act 1, straight after “Alla bella Despinetta”: the sisters are raging at the two strangers in their house, and Don Alfonso comes in as if drawn by the noise"
     }
    ]
   },
   {
    "id": "ferrando",
    "name": "Ferrando",
    "voice": "Tenor",
    "desc": "An officer, Dorabella's fiancé.",
    "avatar": "curls",
    "pieces": [
     {
      "title": "La mia Dorabella capace non è",
      "kind": "Terzetto · Act 1",
      "id": "Act 1: La mia Dorabella capace non è",
      "editionId": "mozart-la-mia-dorabella",
      "when": "Act 1, curtain up: in a coffee house, Ferrando and Guglielmo are defending their fiancées against their old friend Don Alfonso"
     },
     {
      "title": "È la fede delle femmine",
      "kind": "Terzetto · Act 1",
      "id": "Act 1: È la fede delle femmine",
      "editionId": "mozart-e-la-fede-delle-femmine",
      "when": "Act 1, the officers admit that their sweethearts are women, not goddesses, and Don Alfonso laughs at them for expecting fidelity from women"
     },
     {
      "title": "Una bella serenata",
      "kind": "Terzetto · Act 1",
      "id": "Act 1: Una bella serenata",
      "editionId": "mozart-una-bella-serenata",
      "when": "Act 1, the officers have bet Don Alfonso a hundred zecchini and sworn to obey him; Guglielmo asks what they will do with the money"
     },
     {
      "title": "Sento, o Dio, che questo piede",
      "kind": "Quintetto · Act 1",
      "id": "Act 1: Sento, o Dio, che questo piede",
      "editionId": "mozart-sento-o-dio",
      "when": "Act 1, Don Alfonso has told the sisters that a royal order sends the officers to war at once, and calls the two men in to say goodbye"
     },
     {
      "title": "Al fato dan legge",
      "kind": "Duettino · Act 1",
      "id": "Act 1: Al fato dan legge",
      "editionId": "mozart-al-fato-dan-legge",
      "when": "Act 1, during the farewell: Fiordiligi has asked Guglielmo for his sword, and the men ask the sisters not to speak of such dark omens"
     },
     {
      "title": "Di scrivermi ogni giorno",
      "kind": "Quintetto · Act 1",
      "id": "Act 1: Di scrivermi ogni giorno",
      "editionId": "mozart-di-scrivermi-ogni-giorno",
      "when": "Act 1, after the soldiers' chorus: Don Alfonso says the regiment's boat has left and friends wait for the officers in a lighter boat, and the lovers embrace for the last time"
     },
     {
      "title": "Un'aura amorosa",
      "kind": "Aria · Act 1",
      "id": "Act 1: Un'aura amorosa",
      "when": "Act 1, Don Alfonso sends the officers to wait in the garden for his orders; Guglielmo asks whether there will be no dinner, and Ferrando answers that supper will taste better after the battle"
     },
     {
      "title": "Secondate, aurette amiche",
      "kind": "Duetto con Coro · Act 2",
      "id": "Act 2: Secondate, aurette amiche",
      "when": "Act 2, Don Alfonso has hurried the sisters to the garden by the sea, where the two 'Albanians' wait in a boat decked with flowers, with musicians"
     },
     {
      "title": "Ah lo veggio quell'anima bella",
      "kind": "Aria · Act 2",
      "id": "Act 2: Ah lo veggio quell'anima bella",
      "when": "Act 2, Ferrando has followed Fiordiligi, who called him a snake and told him to go; he asks only for a kinder look, and sees her look at him and sigh"
     },
     {
      "title": "In qual fiero contrasto… Tradito, schernito",
      "kind": "Recitative and cavatina · Act 2",
      "id": "Act 2: In qual fiero contrasto… Tradito, schernito",
      "when": "Act 2, Guglielmo has gone; Ferrando is alone, torn between revenge and his love for Dorabella"
     },
     {
      "title": "Fra gli amplessi in pochi istanti",
      "kind": "Duetto · Act 2",
      "id": "Act 2: Fra gli amplessi in pochi istanti",
      "when": "Act 2, Fiordiligi has sent for the officers' uniforms and put on a hat, meaning to join her fiancé at the front; Guglielmo and Don Alfonso are watching unseen"
     },
     {
      "title": "Tutti accusan le donne",
      "kind": "Andante · Act 2",
      "id": "Act 2: Tutti accusan le donne",
      "when": "Act 2, both officers know that their fiancées have given in; Don Alfonso tells them to marry them anyway and asks them to learn a verse"
     },
     {
      "title": "Fuor la spada: scegliete",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Fuor la spada: scegliete",
      "editionId": "mozart-fuor-la-spada",
      "when": "Act 1, straight after the opening terzetto, in the coffee house: Don Alfonso has hinted that the officers' fiancées could be unfaithful, and they draw their swords on him"
     },
     {
      "title": "Scioccherie di poeti!",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Scioccherie di poeti!",
      "editionId": "mozart-scioccherie-di-poeti",
      "when": "Act 1, in the coffee house, straight after “È la fede delle femmine”: Don Alfonso has just compared women's fidelity to the Arabian phoenix, which everyone talks of and no one has found"
     },
     {
      "title": "Non piangere, idol mio",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Non piangere, idol mio",
      "editionId": "mozart-non-piangere-idol-mio",
      "when": "Act 1, straight after “Sento, o Dio, che questo piede”: the sisters have begged the officers not to go, and all five have lamented that fate cheats human hopes"
     },
     {
      "title": "La comedia è graziosa",
      "kind": "Recitative · Act 1",
      "id": "Act 1: La comedia è graziosa",
      "editionId": "mozart-la-commedia-e-graziosa",
      "when": "Act 1, straight after “Al fato dan legge”: the officers have promised their sweethearts to come back happily to their arms"
     },
     {
      "title": "Non v'è più tempo, amici",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Non v'è più tempo, amici",
      "editionId": "mozart-non-ve-piu-tempo-amici",
      "when": "Act 1, straight after the soldiers' chorus “Bella vita militar”: the boat has come in to the shore to take the officers away"
     },
     {
      "title": "Alla bella Despinetta",
      "kind": "Sestetto · Act 1",
      "id": "Act 1: Alla bella Despinetta",
      "editionId": "mozart-alla-bella-despinetta",
      "when": "Act 1, Don Alfonso has promised Despina twenty scudi to help two strangers win her mistresses' favour, and brings in the officers disguised as 'Albanians'"
     },
     {
      "title": "Che susurro, che strepito",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Che susurro, che strepito",
      "editionId": "mozart-che-susurro",
      "when": "Act 1, straight after “Alla bella Despinetta”: the sisters are raging at the two strangers in their house, and Don Alfonso comes in as if drawn by the noise"
     },
     {
      "title": "Ah non partite!",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Ah non partite!",
      "editionId": "mozart-ah-non-partite",
      "when": "Act 1, straight after “Come scoglio”: Fiordiligi has sworn to stay true until death, and the sisters turn to leave"
     },
     {
      "title": "E voi ridete?",
      "kind": "Terzetto · Act 1",
      "id": "Act 1: E voi ridete?",
      "editionId": "mozart-e-voi-ridete",
      "when": "Act 1, straight after “Non siate ritrosi”: the sisters have stormed out, leaving the two officers alone with Don Alfonso"
     }
    ]
   },
   {
    "id": "guglielmo",
    "name": "Guglielmo",
    "voice": "Baritone",
    "desc": "An officer, Fiordiligi's fiancé (the libretto spells his name Guilelmo).",
    "avatar": "short",
    "pieces": [
     {
      "title": "La mia Dorabella capace non è",
      "kind": "Terzetto · Act 1",
      "id": "Act 1: La mia Dorabella capace non è",
      "editionId": "mozart-la-mia-dorabella",
      "when": "Act 1, curtain up: in a coffee house, Ferrando and Guglielmo are defending their fiancées against their old friend Don Alfonso"
     },
     {
      "title": "È la fede delle femmine",
      "kind": "Terzetto · Act 1",
      "id": "Act 1: È la fede delle femmine",
      "editionId": "mozart-e-la-fede-delle-femmine",
      "when": "Act 1, the officers admit that their sweethearts are women, not goddesses, and Don Alfonso laughs at them for expecting fidelity from women"
     },
     {
      "title": "Una bella serenata",
      "kind": "Terzetto · Act 1",
      "id": "Act 1: Una bella serenata",
      "editionId": "mozart-una-bella-serenata",
      "when": "Act 1, the officers have bet Don Alfonso a hundred zecchini and sworn to obey him; Guglielmo asks what they will do with the money"
     },
     {
      "title": "Sento, o Dio, che questo piede",
      "kind": "Quintetto · Act 1",
      "id": "Act 1: Sento, o Dio, che questo piede",
      "editionId": "mozart-sento-o-dio",
      "when": "Act 1, Don Alfonso has told the sisters that a royal order sends the officers to war at once, and calls the two men in to say goodbye"
     },
     {
      "title": "Al fato dan legge",
      "kind": "Duettino · Act 1",
      "id": "Act 1: Al fato dan legge",
      "editionId": "mozart-al-fato-dan-legge",
      "when": "Act 1, during the farewell: Fiordiligi has asked Guglielmo for his sword, and the men ask the sisters not to speak of such dark omens"
     },
     {
      "title": "Di scrivermi ogni giorno",
      "kind": "Quintetto · Act 1",
      "id": "Act 1: Di scrivermi ogni giorno",
      "editionId": "mozart-di-scrivermi-ogni-giorno",
      "when": "Act 1, after the soldiers' chorus: Don Alfonso says the regiment's boat has left and friends wait for the officers in a lighter boat, and the lovers embrace for the last time"
     },
     {
      "title": "Non siate ritrosi",
      "kind": "Aria · Act 1",
      "id": "Act 1: Non siate ritrosi",
      "editionId": "mozart-non-siate-ritrosi",
      "when": "Act 1, the sisters are about to leave; Don Alfonso asks them for a little kindness towards his friends, and Guglielmo pleads for the two strangers"
     },
     {
      "title": "Rivolgete a lui lo sguardo",
      "kind": "Aria · Act 1",
      "id": "Act 1: Rivolgete a lui lo sguardo",
      "editionId": "mozart-rivolgete-a-lui-lo-sguardo",
      "when": "Act 1, the same moment as “Non siate ritrosi”, which replaced it: the sisters are about to leave, and Guglielmo pleads for the two strangers (Mozart's first aria for this spot, KV 584)"
     },
     {
      "title": "Secondate, aurette amiche",
      "kind": "Duetto con Coro · Act 2",
      "id": "Act 2: Secondate, aurette amiche",
      "when": "Act 2, Don Alfonso has hurried the sisters to the garden by the sea, where the two 'Albanians' wait in a boat decked with flowers, with musicians"
     },
     {
      "title": "Il core vi dono",
      "kind": "Duetto · Act 2",
      "id": "Act 2: Il core vi dono",
      "when": "Act 2, walking in the garden, Dorabella has just accepted Guglielmo's little gift of a heart"
     },
     {
      "title": "Donne mie, la fate a tanti",
      "kind": "Aria · Act 2",
      "id": "Act 2: Donne mie, la fate a tanti",
      "when": "Act 2, Guglielmo has shown Ferrando the portrait of Ferrando that he took from Dorabella, saying she gave it to him as a pledge, and Ferrando begs him for advice that he cannot give"
     },
     {
      "title": "Tutti accusan le donne",
      "kind": "Andante · Act 2",
      "id": "Act 2: Tutti accusan le donne",
      "when": "Act 2, both officers know that their fiancées have given in; Don Alfonso tells them to marry them anyway and asks them to learn a verse"
     },
     {
      "title": "Fuor la spada: scegliete",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Fuor la spada: scegliete",
      "editionId": "mozart-fuor-la-spada",
      "when": "Act 1, straight after the opening terzetto, in the coffee house: Don Alfonso has hinted that the officers' fiancées could be unfaithful, and they draw their swords on him"
     },
     {
      "title": "Scioccherie di poeti!",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Scioccherie di poeti!",
      "editionId": "mozart-scioccherie-di-poeti",
      "when": "Act 1, in the coffee house, straight after “È la fede delle femmine”: Don Alfonso has just compared women's fidelity to the Arabian phoenix, which everyone talks of and no one has found"
     },
     {
      "title": "Non piangere, idol mio",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Non piangere, idol mio",
      "editionId": "mozart-non-piangere-idol-mio",
      "when": "Act 1, straight after “Sento, o Dio, che questo piede”: the sisters have begged the officers not to go, and all five have lamented that fate cheats human hopes"
     },
     {
      "title": "Non v'è più tempo, amici",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Non v'è più tempo, amici",
      "editionId": "mozart-non-ve-piu-tempo-amici",
      "when": "Act 1, straight after the soldiers' chorus “Bella vita militar”: the boat has come in to the shore to take the officers away"
     },
     {
      "title": "Alla bella Despinetta",
      "kind": "Sestetto · Act 1",
      "id": "Act 1: Alla bella Despinetta",
      "editionId": "mozart-alla-bella-despinetta",
      "when": "Act 1, Don Alfonso has promised Despina twenty scudi to help two strangers win her mistresses' favour, and brings in the officers disguised as 'Albanians'"
     },
     {
      "title": "Che susurro, che strepito",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Che susurro, che strepito",
      "editionId": "mozart-che-susurro",
      "when": "Act 1, straight after “Alla bella Despinetta”: the sisters are raging at the two strangers in their house, and Don Alfonso comes in as if drawn by the noise"
     },
     {
      "title": "Ah non partite!",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Ah non partite!",
      "editionId": "mozart-ah-non-partite",
      "when": "Act 1, straight after “Come scoglio”: Fiordiligi has sworn to stay true until death, and the sisters turn to leave"
     },
     {
      "title": "E voi ridete?",
      "kind": "Terzetto · Act 1",
      "id": "Act 1: E voi ridete?",
      "editionId": "mozart-e-voi-ridete",
      "when": "Act 1, straight after “Non siate ritrosi”: the sisters have stormed out, leaving the two officers alone with Don Alfonso"
     }
    ]
   },
   {
    "id": "alfonso",
    "name": "Don Alfonso",
    "voice": "Bass-baritone",
    "desc": "An old philosopher, the two officers' friend. (The score lists him as Bass.)",
    "avatar": "beard",
    "pieces": [
     {
      "title": "Soave sia il vento",
      "kind": "Terzettino · Act 1",
      "editionId": "mozart-soave-sia-il-vento",
      "when": "Act 1, the boat carrying the officers is disappearing from sight, and the sisters wish it a safe voyage"
     },
     {
      "title": "La mia Dorabella capace non è",
      "kind": "Terzetto · Act 1",
      "id": "Act 1: La mia Dorabella capace non è",
      "editionId": "mozart-la-mia-dorabella",
      "when": "Act 1, curtain up: in a coffee house, Ferrando and Guglielmo are defending their fiancées against their old friend Don Alfonso"
     },
     {
      "title": "È la fede delle femmine",
      "kind": "Terzetto · Act 1",
      "id": "Act 1: È la fede delle femmine",
      "editionId": "mozart-e-la-fede-delle-femmine",
      "when": "Act 1, the officers admit that their sweethearts are women, not goddesses, and Don Alfonso laughs at them for expecting fidelity from women"
     },
     {
      "title": "Una bella serenata",
      "kind": "Terzetto · Act 1",
      "id": "Act 1: Una bella serenata",
      "editionId": "mozart-una-bella-serenata",
      "when": "Act 1, the officers have bet Don Alfonso a hundred zecchini and sworn to obey him; Guglielmo asks what they will do with the money"
     },
     {
      "title": "Vorrei dir",
      "kind": "Aria · Act 1",
      "id": "Act 1: Vorrei dir",
      "editionId": "mozart-vorrei-dir",
      "when": "Act 1, the sisters, waiting for their fiancés, see Don Alfonso arrive alone and apparently in tears, and beg him to tell them what has happened"
     },
     {
      "title": "Sento, o Dio, che questo piede",
      "kind": "Quintetto · Act 1",
      "id": "Act 1: Sento, o Dio, che questo piede",
      "editionId": "mozart-sento-o-dio",
      "when": "Act 1, Don Alfonso has told the sisters that a royal order sends the officers to war at once, and calls the two men in to say goodbye"
     },
     {
      "title": "Di scrivermi ogni giorno",
      "kind": "Quintetto · Act 1",
      "id": "Act 1: Di scrivermi ogni giorno",
      "editionId": "mozart-di-scrivermi-ogni-giorno",
      "when": "Act 1, after the soldiers' chorus: Don Alfonso says the regiment's boat has left and friends wait for the officers in a lighter boat, and the lovers embrace for the last time"
     },
     {
      "title": "Tutti accusan le donne",
      "kind": "Andante · Act 2",
      "id": "Act 2: Tutti accusan le donne",
      "when": "Act 2, both officers know that their fiancées have given in; Don Alfonso tells them to marry them anyway and asks them to learn a verse"
     },
     {
      "title": "Fuor la spada: scegliete",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Fuor la spada: scegliete",
      "editionId": "mozart-fuor-la-spada",
      "when": "Act 1, straight after the opening terzetto, in the coffee house: Don Alfonso has hinted that the officers' fiancées could be unfaithful, and they draw their swords on him"
     },
     {
      "title": "Scioccherie di poeti!",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Scioccherie di poeti!",
      "editionId": "mozart-scioccherie-di-poeti",
      "when": "Act 1, in the coffee house, straight after “È la fede delle femmine”: Don Alfonso has just compared women's fidelity to the Arabian phoenix, which everyone talks of and no one has found"
     },
     {
      "title": "Mi par, che stamattina volentieri",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Mi par, che stamattina volentieri",
      "editionId": "mozart-mi-par-che-stamattina",
      "when": "Act 1, in the garden by the sea, straight after “Ah guarda, sorella”: the sisters have sworn on their fiancés' portraits to stay true, and are waiting for them to come"
     },
     {
      "title": "Stelle, per carità, Signor Alfonso",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Stelle, per carità, Signor Alfonso",
      "editionId": "mozart-stelle-per-carita",
      "when": "Act 1, in the garden by the sea, straight after “Vorrei dir”: Don Alfonso has stammered that he cannot bring himself to tell the sisters the terrible news"
     },
     {
      "title": "Non piangere, idol mio",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Non piangere, idol mio",
      "editionId": "mozart-non-piangere-idol-mio",
      "when": "Act 1, straight after “Sento, o Dio, che questo piede”: the sisters have begged the officers not to go, and all five have lamented that fate cheats human hopes"
     },
     {
      "title": "La comedia è graziosa",
      "kind": "Recitative · Act 1",
      "id": "Act 1: La comedia è graziosa",
      "editionId": "mozart-la-commedia-e-graziosa",
      "when": "Act 1, straight after “Al fato dan legge”: the officers have promised their sweethearts to come back happily to their arms"
     },
     {
      "title": "Non v'è più tempo, amici",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Non v'è più tempo, amici",
      "editionId": "mozart-non-ve-piu-tempo-amici",
      "when": "Act 1, straight after the soldiers' chorus “Bella vita militar”: the boat has come in to the shore to take the officers away"
     },
     {
      "title": "Dove son?",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Dove son?",
      "editionId": "mozart-dove-son",
      "when": "Act 1, on the shore, straight after “Di scrivermi ogni giorno”: the boat has carried the officers away to the sound of drums, and the sisters stand motionless"
     },
     {
      "title": "Non son cattivo comico",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Non son cattivo comico",
      "editionId": "mozart-non-son-cattivo-comico",
      "when": "Act 1, on the shore, straight after “Soave sia il vento”: the sisters have gone, leaving Don Alfonso alone"
     },
     {
      "title": "Che silenzio, che aspetto di tristezza",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Che silenzio, che aspetto di tristezza",
      "editionId": "mozart-che-silenzio",
      "when": "Act 1, straight after “In uomini, in soldati”: Despina and the sisters have gone out, and Don Alfonso comes into the empty room alone"
     },
     {
      "title": "Alla bella Despinetta",
      "kind": "Sestetto · Act 1",
      "id": "Act 1: Alla bella Despinetta",
      "editionId": "mozart-alla-bella-despinetta",
      "when": "Act 1, Don Alfonso has promised Despina twenty scudi to help two strangers win her mistresses' favour, and brings in the officers disguised as 'Albanians'"
     },
     {
      "title": "Che susurro, che strepito",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Che susurro, che strepito",
      "editionId": "mozart-che-susurro",
      "when": "Act 1, straight after “Alla bella Despinetta”: the sisters are raging at the two strangers in their house, and Don Alfonso comes in as if drawn by the noise"
     },
     {
      "title": "Ah non partite!",
      "kind": "Recitative · Act 1",
      "id": "Act 1: Ah non partite!",
      "editionId": "mozart-ah-non-partite",
      "when": "Act 1, straight after “Come scoglio”: Fiordiligi has sworn to stay true until death, and the sisters turn to leave"
     },
     {
      "title": "E voi ridete?",
      "kind": "Terzetto · Act 1",
      "id": "Act 1: E voi ridete?",
      "editionId": "mozart-e-voi-ridete",
      "when": "Act 1, straight after “Non siate ritrosi”: the sisters have stormed out, leaving the two officers alone with Don Alfonso"
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
    "desc": "A poet, who shares the garret with his three friends.",
    "avatar": "curls",
    "pieces": [
     {
      "title": "Che gelida manina",
      "kind": "Aria · Act 1",
      "when": "Act 1, in the dark, as Rodolfo's hand finds Mimì's while they search for her key",
      "editionId": "puccini-che-gelida-manina"
     },
     {
      "title": "O soave fanciulla",
      "kind": "Duet with Mimì · Act 1",
      "when": "Act 1, the friends have gone; Rodolfo turns from the window and sees Mimì in the moonlight",
      "editionId": "puccini-o-soave-fanciulla"
     },
     {
      "title": "O Mimì, tu più non torni",
      "kind": "Duet with Marcello · Act 4",
      "when": "Act 4, back in the garret; both men have just pretended not to care about the women they lost"
     },
     {
      "title": "Si. Mi chiamano Mimì",
      "kind": "Aria · Act 1",
      "id": "Act 1: Si. Mi chiamano Mimì",
      "when": "Straight after “Che gelida manina”: now it is her turn to say who she is. (The print has “Si.” where the libretto has “Sì”, meaning “yes”.)",
      "editionId": "puccini-mi-chiamano-mimi"
     },
     {
      "title": "Quando me'n vo'",
      "kind": "Waltz and ensemble · Act 2",
      "id": "Act 2: Quando me'n vo'",
      "when": "Act 2, at the Café Momus, Musetta still has not made Marcello look at her",
      "editionId": "puccini-quando-men-vo"
     },
     {
      "title": "Vai?… Donde lieta uscì",
      "kind": "Aria · Act 3",
      "id": "Act 3: Vai?… Donde lieta uscì",
      "editionId": "puccini-donde-lieta-usci",
      "when": "Act 3, Mimì has overheard that she is dying, and Marcello has gone back into the tavern"
     },
     {
      "title": "Dunque è proprio finita!… Addio dolce svegliare",
      "kind": "Quartet · Act 3",
      "id": "Act 3: Dunque è proprio finita!… Addio dolce svegliare",
      "editionId": "puccini-addio-dolce-svegliare",
      "when": "Straight after “Donde lieta uscì”: Rodolfo answers her goodbye"
     },
     {
      "title": "Sono andati?",
      "kind": "Duet · Act 4",
      "id": "Act 4: Sono andati?",
      "editionId": "puccini-sono-andati",
      "when": "Act 4, the others have left; Mimì opens her eyes, alone with Rodolfo"
     },
     {
      "title": "Al Quartiere Latin ci attende Momus.",
      "kind": "Scene · Act 1",
      "id": "Act 1: Al Quartiere Latin ci attende Momus.",
      "editionId": "puccini-al-quartiere-latin"
     },
     {
      "title": "Questo Mar Rosso",
      "kind": "Scene · Act 1",
      "id": "Act 1: Questo Mar Rosso",
      "editionId": "puccini-questo-mar-rosso"
     },
     {
      "title": "Legna!",
      "kind": "Scene · Act 1",
      "id": "Act 1: Legna!",
      "editionId": "puccini-legna"
     },
     {
      "title": "Si può?..",
      "kind": "Scene · Act 1",
      "id": "Act 1: Si può?..",
      "editionId": "puccini-si-puo"
     },
     {
      "title": "Non sono in vena.",
      "kind": "Scene · Act 1",
      "id": "Act 1: Non sono in vena.",
      "editionId": "puccini-non-sono-in-vena"
     },
     {
      "title": "Ehi! Rodolfo!",
      "kind": "Scene · Act 1",
      "id": "Act 1: Ehi! Rodolfo!",
      "editionId": "puccini-ehi-rodolfo"
     },
     {
      "title": "Aranci, datteri!",
      "kind": "Scene with chorus · Act 2",
      "id": "Act 2: Aranci, datteri!",
      "editionId": "puccini-aranci-datteri"
     },
     {
      "title": "Chi guardi?…",
      "kind": "Scene with chorus · Act 2",
      "id": "Act 2: Chi guardi?…",
      "editionId": "puccini-chi-guardi"
     },
     {
      "title": "Signorina Mimì, che dono raro",
      "kind": "Scene with chorus · Act 2",
      "id": "Act 2: Signorina Mimì, che dono raro",
      "editionId": "puccini-signorina-mimi"
     },
     {
      "title": "Ahi! qual dolore",
      "kind": "Scene · Act 2",
      "id": "Act 2: Ahi! qual dolore",
      "editionId": "puccini-ahi-qual-dolore"
     },
     {
      "title": "Caro!",
      "kind": "Finale · Act 2",
      "id": "Act 2: Caro!",
      "editionId": "puccini-caro"
     },
     {
      "title": "Marcello. Finalmente!",
      "kind": "Duet · Act 3",
      "id": "Act 3: Marcello, finalmente!… Mimì è tanto malata",
      "editionId": "puccini-marcello-finalmente"
     },
     {
      "title": "Mimì è tanto malata!",
      "kind": "Scene · Act 3",
      "id": "Act 3: Mimì è tanto malata!",
      "editionId": "puccini-mimi-e-tanto-malata"
     },
     {
      "title": "In un coupè?",
      "kind": "Scene · Act 4",
      "id": "Act 4: In un coupè?",
      "when": "Act 4, months later, back in the garret: the two men pretend to work",
      "editionId": "puccini-in-un-coupe"
     },
     {
      "title": "Che ora sia?",
      "kind": "Scene · Act 4",
      "id": "Act 4: Che ora sia?",
      "when": "Act 4, Schaunard and Colline come back with four rolls and a herring",
      "editionId": "puccini-che-ora-sia"
     },
     {
      "title": "Musetta!",
      "kind": "Scene · Act 4",
      "id": "Act 4: Musetta!",
      "when": "Act 4, Musetta brings in the dying Mimì",
      "editionId": "puccini-musetta"
     }
    ]
   },
   {
    "id": "mimi",
    "name": "Mimì",
    "voice": "Soprano",
    "desc": "Rodolfo's neighbour, who embroiders flowers on linen and silk for a living; her real name is Lucia.",
    "avatar": "long",
    "pieces": [
     {
      "title": "Sì, mi chiamano Mimì",
      "kind": "Aria · Act 1",
      "when": "Straight after “Che gelida manina”: now it is her turn to say who she is. (The print has “Si.” where the libretto has “Sì”, meaning “yes”.)",
      "editionId": "puccini-mi-chiamano-mimi"
     },
     {
      "title": "O soave fanciulla",
      "kind": "Duet with Rodolfo · Act 1",
      "when": "Act 1, the friends have gone; Rodolfo turns from the window and sees Mimì in the moonlight",
      "editionId": "puccini-o-soave-fanciulla"
     },
     {
      "title": "Donde lieta uscì",
      "kind": "Aria · Act 3",
      "editionId": "puccini-donde-lieta-usci",
      "when": "Act 3, Mimì has overheard that she is dying, and Marcello has gone back into the tavern"
     },
     {
      "title": "Ah!… Che gelida manina",
      "kind": "Aria · Act 1",
      "id": "Act 1: Ah!… Che gelida manina",
      "when": "Act 1, in the dark, as Rodolfo's hand finds Mimì's while they search for her key",
      "editionId": "puccini-che-gelida-manina"
     },
     {
      "title": "Quando me'n vo'",
      "kind": "Waltz and ensemble · Act 2",
      "id": "Act 2: Quando me'n vo'",
      "when": "Act 2, at the Café Momus, Musetta still has not made Marcello look at her",
      "editionId": "puccini-quando-men-vo"
     },
     {
      "title": "Dunque è proprio finita!… Addio dolce svegliare",
      "kind": "Quartet · Act 3",
      "id": "Act 3: Dunque è proprio finita!… Addio dolce svegliare",
      "editionId": "puccini-addio-dolce-svegliare",
      "when": "Straight after “Donde lieta uscì”: Rodolfo answers her goodbye"
     },
     {
      "title": "Sono andati?",
      "kind": "Duet · Act 4",
      "id": "Act 4: Sono andati?",
      "editionId": "puccini-sono-andati",
      "when": "Act 4, the others have left; Mimì opens her eyes, alone with Rodolfo"
     },
     {
      "title": "Non sono in vena.",
      "kind": "Scene · Act 1",
      "id": "Act 1: Non sono in vena.",
      "editionId": "puccini-non-sono-in-vena"
     },
     {
      "title": "Ehi! Rodolfo!",
      "kind": "Scene · Act 1",
      "id": "Act 1: Ehi! Rodolfo!",
      "editionId": "puccini-ehi-rodolfo"
     },
     {
      "title": "Aranci, datteri!",
      "kind": "Scene with chorus · Act 2",
      "id": "Act 2: Aranci, datteri!",
      "editionId": "puccini-aranci-datteri"
     },
     {
      "title": "Chi guardi?…",
      "kind": "Scene with chorus · Act 2",
      "id": "Act 2: Chi guardi?…",
      "editionId": "puccini-chi-guardi"
     },
     {
      "title": "Signorina Mimì, che dono raro",
      "kind": "Scene with chorus · Act 2",
      "id": "Act 2: Signorina Mimì, che dono raro",
      "editionId": "puccini-signorina-mimi"
     },
     {
      "title": "Ahi! qual dolore",
      "kind": "Scene · Act 2",
      "id": "Act 2: Ahi! qual dolore",
      "editionId": "puccini-ahi-qual-dolore"
     },
     {
      "title": "Caro!",
      "kind": "Finale · Act 2",
      "id": "Act 2: Caro!",
      "editionId": "puccini-caro"
     },
     {
      "title": "Sa dirmi, scusi, qual'è l'osteria",
      "kind": "Scene · Act 3",
      "id": "Act 3: Sa dirmi, scusi, qual'è l'osteria",
      "editionId": "puccini-sa-dirmi"
     },
     {
      "title": "Mimì?!",
      "kind": "Duet · Act 3",
      "id": "Act 3: Mimì?!… Speravo di trovarvi qui",
      "editionId": "puccini-mimi-marcello"
     },
     {
      "title": "Marcello. Finalmente!",
      "kind": "Duet · Act 3",
      "id": "Act 3: Marcello, finalmente!… Mimì è tanto malata",
      "editionId": "puccini-marcello-finalmente"
     },
     {
      "title": "Mimì è tanto malata!",
      "kind": "Scene · Act 3",
      "id": "Act 3: Mimì è tanto malata!",
      "editionId": "puccini-mimi-e-tanto-malata"
     },
     {
      "title": "Musetta!",
      "kind": "Scene · Act 4",
      "id": "Act 4: Musetta!",
      "when": "Act 4, Musetta brings in the dying Mimì",
      "editionId": "puccini-musetta"
     }
    ]
   },
   {
    "id": "marcello",
    "name": "Marcello",
    "voice": "Baritone",
    "desc": "A painter, Rodolfo's closest friend, still in love with Musetta.",
    "avatar": "short",
    "pieces": [
     {
      "title": "O Mimì, tu più non torni",
      "kind": "Duet with Rodolfo · Act 4",
      "when": "Act 4, back in the garret; both men have just pretended not to care about the women they lost"
     },
     {
      "title": "O soave fanciulla",
      "kind": "Duet · Act 1",
      "id": "Act 1: O soave fanciulla",
      "when": "Act 1, the friends have gone; Rodolfo turns from the window and sees Mimì in the moonlight",
      "editionId": "puccini-o-soave-fanciulla"
     },
     {
      "title": "Quando me'n vo'",
      "kind": "Waltz and ensemble · Act 2",
      "id": "Act 2: Quando me'n vo'",
      "when": "Act 2, at the Café Momus, Musetta still has not made Marcello look at her",
      "editionId": "puccini-quando-men-vo"
     },
     {
      "title": "Dunque è proprio finita!… Addio dolce svegliare",
      "kind": "Quartet · Act 3",
      "id": "Act 3: Dunque è proprio finita!… Addio dolce svegliare",
      "editionId": "puccini-addio-dolce-svegliare",
      "when": "Straight after “Donde lieta uscì”: Rodolfo answers her goodbye"
     },
     {
      "title": "Al Quartiere Latin ci attende Momus.",
      "kind": "Scene · Act 1",
      "id": "Act 1: Al Quartiere Latin ci attende Momus.",
      "editionId": "puccini-al-quartiere-latin"
     },
     {
      "title": "Questo Mar Rosso",
      "kind": "Scene · Act 1",
      "id": "Act 1: Questo Mar Rosso",
      "editionId": "puccini-questo-mar-rosso"
     },
     {
      "title": "Legna!",
      "kind": "Scene · Act 1",
      "id": "Act 1: Legna!",
      "editionId": "puccini-legna"
     },
     {
      "title": "Si può?..",
      "kind": "Scene · Act 1",
      "id": "Act 1: Si può?..",
      "editionId": "puccini-si-puo"
     },
     {
      "title": "Ehi! Rodolfo!",
      "kind": "Scene · Act 1",
      "id": "Act 1: Ehi! Rodolfo!",
      "editionId": "puccini-ehi-rodolfo"
     },
     {
      "title": "Aranci, datteri!",
      "kind": "Scene with chorus · Act 2",
      "id": "Act 2: Aranci, datteri!",
      "editionId": "puccini-aranci-datteri"
     },
     {
      "title": "Chi guardi?…",
      "kind": "Scene with chorus · Act 2",
      "id": "Act 2: Chi guardi?…",
      "editionId": "puccini-chi-guardi"
     },
     {
      "title": "Signorina Mimì, che dono raro",
      "kind": "Scene with chorus · Act 2",
      "id": "Act 2: Signorina Mimì, che dono raro",
      "editionId": "puccini-signorina-mimi"
     },
     {
      "title": "Ahi! qual dolore",
      "kind": "Scene · Act 2",
      "id": "Act 2: Ahi! qual dolore",
      "editionId": "puccini-ahi-qual-dolore"
     },
     {
      "title": "Caro!",
      "kind": "Finale · Act 2",
      "id": "Act 2: Caro!",
      "editionId": "puccini-caro"
     },
     {
      "title": "Mimì?!",
      "kind": "Duet · Act 3",
      "id": "Act 3: Mimì?!… Speravo di trovarvi qui",
      "editionId": "puccini-mimi-marcello"
     },
     {
      "title": "Marcello. Finalmente!",
      "kind": "Duet · Act 3",
      "id": "Act 3: Marcello, finalmente!… Mimì è tanto malata",
      "editionId": "puccini-marcello-finalmente"
     },
     {
      "title": "Mimì è tanto malata!",
      "kind": "Scene · Act 3",
      "id": "Act 3: Mimì è tanto malata!",
      "editionId": "puccini-mimi-e-tanto-malata"
     },
     {
      "title": "In un coupè?",
      "kind": "Scene · Act 4",
      "id": "Act 4: In un coupè?",
      "when": "Act 4, months later, back in the garret: the two men pretend to work",
      "editionId": "puccini-in-un-coupe"
     },
     {
      "title": "Che ora sia?",
      "kind": "Scene · Act 4",
      "id": "Act 4: Che ora sia?",
      "when": "Act 4, Schaunard and Colline come back with four rolls and a herring",
      "editionId": "puccini-che-ora-sia"
     },
     {
      "title": "Musetta!",
      "kind": "Scene · Act 4",
      "id": "Act 4: Musetta!",
      "when": "Act 4, Musetta brings in the dying Mimì",
      "editionId": "puccini-musetta"
     }
    ]
   },
   {
    "id": "musetta",
    "name": "Musetta",
    "voice": "Soprano",
    "desc": "Marcello's old flame, a flirt who still loves him.",
    "avatar": "hat",
    "pieces": [
     {
      "title": "Quando me'n vo'",
      "kind": "Waltz · Act 2",
      "id": "Quando m'en vo'",
      "when": "Act 2, at the Café Momus, Musetta still has not made Marcello look at her",
      "editionId": "puccini-quando-men-vo"
     },
     {
      "title": "Dunque è proprio finita!… Addio dolce svegliare",
      "kind": "Quartet · Act 3",
      "id": "Act 3: Dunque è proprio finita!… Addio dolce svegliare",
      "editionId": "puccini-addio-dolce-svegliare",
      "when": "Straight after “Donde lieta uscì”: Rodolfo answers her goodbye"
     },
     {
      "title": "Signorina Mimì, che dono raro",
      "kind": "Scene with chorus · Act 2",
      "id": "Act 2: Signorina Mimì, che dono raro",
      "editionId": "puccini-signorina-mimi"
     },
     {
      "title": "Ahi! qual dolore",
      "kind": "Scene · Act 2",
      "id": "Act 2: Ahi! qual dolore",
      "editionId": "puccini-ahi-qual-dolore"
     },
     {
      "title": "Caro!",
      "kind": "Finale · Act 2",
      "id": "Act 2: Caro!",
      "editionId": "puccini-caro"
     },
     {
      "title": "Ohè, là, le guardie!",
      "kind": "Prelude and scene with chorus · Act 3",
      "id": "Act 3: Ohè, là, le guardie!",
      "editionId": "puccini-ohe-la-le-guardie"
     },
     {
      "title": "Musetta!",
      "kind": "Scene · Act 4",
      "id": "Act 4: Musetta!",
      "when": "Act 4, Musetta brings in the dying Mimì",
      "editionId": "puccini-musetta"
     }
    ]
   },
   {
    "id": "schaunard",
    "name": "Schaunard",
    "voice": "Baritone",
    "desc": "A musician, the friend who comes home with money.",
    "avatar": "hat",
    "pieces": [
     {
      "title": "Quando me'n vo'",
      "kind": "Waltz and ensemble · Act 2",
      "id": "Act 2: Quando me'n vo'",
      "when": "Act 2, at the Café Momus, Musetta still has not made Marcello look at her",
      "editionId": "puccini-quando-men-vo"
     },
     {
      "title": "Vecchia zimarra",
      "kind": "Aria · Act 4",
      "id": "Act 4: Vecchia zimarra",
      "when": "Act 4, Musetta and Marcello have gone for medicine and a muff for the dying Mimì",
      "editionId": "puccini-vecchia-zimarra"
     },
     {
      "title": "Al Quartiere Latin ci attende Momus.",
      "kind": "Scene · Act 1",
      "id": "Act 1: Al Quartiere Latin ci attende Momus.",
      "editionId": "puccini-al-quartiere-latin"
     },
     {
      "title": "Legna!",
      "kind": "Scene · Act 1",
      "id": "Act 1: Legna!",
      "editionId": "puccini-legna"
     },
     {
      "title": "Si può?..",
      "kind": "Scene · Act 1",
      "id": "Act 1: Si può?..",
      "editionId": "puccini-si-puo"
     },
     {
      "title": "Ehi! Rodolfo!",
      "kind": "Scene · Act 1",
      "id": "Act 1: Ehi! Rodolfo!",
      "editionId": "puccini-ehi-rodolfo"
     },
     {
      "title": "Aranci, datteri!",
      "kind": "Scene with chorus · Act 2",
      "id": "Act 2: Aranci, datteri!",
      "editionId": "puccini-aranci-datteri"
     },
     {
      "title": "Chi guardi?…",
      "kind": "Scene with chorus · Act 2",
      "id": "Act 2: Chi guardi?…",
      "editionId": "puccini-chi-guardi"
     },
     {
      "title": "Signorina Mimì, che dono raro",
      "kind": "Scene with chorus · Act 2",
      "id": "Act 2: Signorina Mimì, che dono raro",
      "editionId": "puccini-signorina-mimi"
     },
     {
      "title": "Ahi! qual dolore",
      "kind": "Scene · Act 2",
      "id": "Act 2: Ahi! qual dolore",
      "editionId": "puccini-ahi-qual-dolore"
     },
     {
      "title": "Caro!",
      "kind": "Finale · Act 2",
      "id": "Act 2: Caro!",
      "editionId": "puccini-caro"
     },
     {
      "title": "Che ora sia?",
      "kind": "Scene · Act 4",
      "id": "Act 4: Che ora sia?",
      "when": "Act 4, Schaunard and Colline come back with four rolls and a herring",
      "editionId": "puccini-che-ora-sia"
     },
     {
      "title": "Musetta!",
      "kind": "Scene · Act 4",
      "id": "Act 4: Musetta!",
      "when": "Act 4, Musetta brings in the dying Mimì",
      "editionId": "puccini-musetta"
     }
    ]
   },
   {
    "id": "colline",
    "name": "Colline",
    "voice": "Bass",
    "desc": "A philosopher, the friend with a coat full of books.",
    "avatar": "beard",
    "pieces": [
     {
      "title": "Vecchia zimarra, senti",
      "kind": "Aria · Act 4",
      "when": "Act 4, Musetta and Marcello have gone for medicine and a muff for the dying Mimì",
      "editionId": "puccini-vecchia-zimarra"
     },
     {
      "title": "Quando me'n vo'",
      "kind": "Waltz and ensemble · Act 2",
      "id": "Act 2: Quando me'n vo'",
      "when": "Act 2, at the Café Momus, Musetta still has not made Marcello look at her",
      "editionId": "puccini-quando-men-vo"
     },
     {
      "title": "Al Quartiere Latin ci attende Momus.",
      "kind": "Scene · Act 1",
      "id": "Act 1: Al Quartiere Latin ci attende Momus.",
      "editionId": "puccini-al-quartiere-latin"
     },
     {
      "title": "Questo Mar Rosso",
      "kind": "Scene · Act 1",
      "id": "Act 1: Questo Mar Rosso",
      "editionId": "puccini-questo-mar-rosso"
     },
     {
      "title": "Legna!",
      "kind": "Scene · Act 1",
      "id": "Act 1: Legna!",
      "editionId": "puccini-legna"
     },
     {
      "title": "Si può?..",
      "kind": "Scene · Act 1",
      "id": "Act 1: Si può?..",
      "editionId": "puccini-si-puo"
     },
     {
      "title": "Ehi! Rodolfo!",
      "kind": "Scene · Act 1",
      "id": "Act 1: Ehi! Rodolfo!",
      "editionId": "puccini-ehi-rodolfo"
     },
     {
      "title": "Aranci, datteri!",
      "kind": "Scene with chorus · Act 2",
      "id": "Act 2: Aranci, datteri!",
      "editionId": "puccini-aranci-datteri"
     },
     {
      "title": "Chi guardi?…",
      "kind": "Scene with chorus · Act 2",
      "id": "Act 2: Chi guardi?…",
      "editionId": "puccini-chi-guardi"
     },
     {
      "title": "Signorina Mimì, che dono raro",
      "kind": "Scene with chorus · Act 2",
      "id": "Act 2: Signorina Mimì, che dono raro",
      "editionId": "puccini-signorina-mimi"
     },
     {
      "title": "Ahi! qual dolore",
      "kind": "Scene · Act 2",
      "id": "Act 2: Ahi! qual dolore",
      "editionId": "puccini-ahi-qual-dolore"
     },
     {
      "title": "Caro!",
      "kind": "Finale · Act 2",
      "id": "Act 2: Caro!",
      "editionId": "puccini-caro"
     },
     {
      "title": "Che ora sia?",
      "kind": "Scene · Act 4",
      "id": "Act 4: Che ora sia?",
      "when": "Act 4, Schaunard and Colline come back with four rolls and a herring",
      "editionId": "puccini-che-ora-sia"
     },
     {
      "title": "Musetta!",
      "kind": "Scene · Act 4",
      "id": "Act 4: Musetta!",
      "when": "Act 4, Musetta brings in the dying Mimì",
      "editionId": "puccini-musetta"
     }
    ]
   },
   {
    "id": "benoit",
    "name": "Benoit",
    "voice": "Bass",
    "desc": "The friends' landlord, who comes for the rent.",
    "avatar": "beard",
    "pieces": [
     {
      "title": "Si può?..",
      "kind": "Scene · Act 1",
      "id": "Act 1: Si può?..",
      "editionId": "puccini-si-puo"
     }
    ]
   },
   {
    "id": "alcindoro",
    "name": "Alcindoro",
    "voice": "Bass",
    "desc": "Musetta's pompous elderly admirer.",
    "avatar": "hat",
    "pieces": [
     {
      "title": "Quando me'n vo'",
      "kind": "Waltz and ensemble · Act 2",
      "id": "Act 2: Quando me'n vo'",
      "when": "Act 2, at the Café Momus, Musetta still has not made Marcello look at her",
      "editionId": "puccini-quando-men-vo"
     },
     {
      "title": "Signorina Mimì, che dono raro",
      "kind": "Scene with chorus · Act 2",
      "id": "Act 2: Signorina Mimì, che dono raro",
      "editionId": "puccini-signorina-mimi"
     },
     {
      "title": "Ahi! qual dolore",
      "kind": "Scene · Act 2",
      "id": "Act 2: Ahi! qual dolore",
      "editionId": "puccini-ahi-qual-dolore"
     }
    ]
   },
   {
    "id": "parpignol",
    "name": "Parpignol",
    "voice": "Tenor",
    "desc": "A toy seller who wheels his cart through the Latin Quarter on Christmas Eve.",
    "avatar": "cap",
    "pieces": [
     {
      "title": "Chi guardi?…",
      "kind": "Scene with chorus · Act 2",
      "id": "Act 2: Chi guardi?…",
      "editionId": "puccini-chi-guardi"
     }
    ]
   },
   {
    "id": "sergente",
    "name": "Sergente",
    "voice": "Bass",
    "desc": "The sergeant of the customs post at the toll gate. (His few low notes would suit a bass or a baritone.)",
    "avatar": "cap",
    "pieces": [
     {
      "title": "Sa dirmi, scusi, qual'è l'osteria",
      "kind": "Scene · Act 3",
      "id": "Act 3: Sa dirmi, scusi, qual'è l'osteria",
      "editionId": "puccini-sa-dirmi"
     }
    ]
   },
   {
    "id": "doganiere",
    "name": "Doganiere",
    "voice": "Bass",
    "desc": "A customs officer at the toll gate. (His few low notes would suit a bass or a baritone.)",
    "avatar": "cap",
    "pieces": [
     {
      "title": "Ohè, là, le guardie!",
      "kind": "Prelude and scene with chorus · Act 3",
      "id": "Act 3: Ohè, là, le guardie!",
      "editionId": "puccini-ohe-la-le-guardie"
     },
     {
      "title": "Sa dirmi, scusi, qual'è l'osteria",
      "kind": "Scene · Act 3",
      "id": "Act 3: Sa dirmi, scusi, qual'è l'osteria",
      "editionId": "puccini-sa-dirmi"
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
  "Sull’aria": "Che soave zeffiretto",
  "Sull'aria… che soave zeffiretto": "Che soave zeffiretto",
  "Mi tradì quell'alma ingrata": "In quali eccessi… Mi tradì",
  "Pa-pa-pa": "Bald prangt, den Morgen zu verkünden",
  "Vecchia zimarra, senti": "Vecchia zimarra",
  "Che gelida manina": "Ah!… Che gelida manina",
  "Sì, mi chiamano Mimì": "Si. Mi chiamano Mimì",
  "Quando m'en vo'": "Quando me'n vo'",
  "Donde lieta uscì": "Vai?… Donde lieta uscì",
  "O Mimì, tu più non torni": "O Mimì tu più non torni",
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

/** who sings in each piece with music in the app (the score's roles), so a number one singer has music for can be
 * offered to everyone else who sings in that music */
const EDITION_ROLES = new Map((catalog as { editionId: string; roles: { id: string }[] }[]).map((e) => [e.editionId, new Set(e.roles.map((r) => r.id))]));
for (const opera of OPERAS) {
  const scenes = SCENES[opera.id] ?? [];
  // every number's music, whoever's list it came from
  const musicOf = new Map<Scene, Piece>();
  for (const ch of opera.chars) {
    const sung = scenes.filter((s) => s.who.includes(ch.id));
    const taken = new Set<Scene>();
    for (const p of [...ch.pieces].sort((x, y) => (y.editionId ? 1 : 0) - (x.editionId ? 1 : 0))) {
      const s = matchScene(p.title, sung);
      if (!s || taken.has(s)) continue;
      taken.add(s);
      if (p.editionId && !musicOf.has(s)) musicOf.set(s, p);
    }
  }
  for (const ch of opera.chars) {
    const first = ch.pieces;
    FIRST_PASS_KEYS[`${opera.id}:${ch.id}`] = first.map((p) => p.id ?? p.title);
    const sung = scenes.filter((s) => s.who.includes(ch.id));
    const claimed = new Map<Scene, Piece>();
    // a piece with music to practise claims its number before a first-pass entry without any
    for (const p of [...first].sort((x, y) => (y.editionId ? 1 : 0) - (x.editionId ? 1 : 0))) {
      const s = matchScene(p.title, sung);
      if (!s || claimed.has(s)) UNPLACED.push(`${opera.id}:${ch.id} ${p.title}`);
      else claimed.set(s, p);
    }
    ch.pieces = sung.map((s) => {
      let old = claimed.get(s);
      // no music in this singer's own list, but the number is in the app from someone else's, with this singer's part in it
      if (!old?.editionId) {
        const other = musicOf.get(s);
        if (other?.editionId && EDITION_ROLES.get(other.editionId)?.has(ch.id)) old = { ...other, id: old ? (old.id ?? old.title) : `${actOf(s.act)}: ${s.title}`, when: old?.when, context: old?.context };
      }
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
  /** a number no one sings (an overture, an entr'acte) whose music is in the app to hear */
  editionId?: string;
}
/** the instrumental numbers with music in the app: opera → the running order's title → edition */
const INSTRUMENTAL: Record<string, Record<string, string>> = {
  figaro: { Sinfonia: "mozart-figaro-sinfonia", "Giovani liete": "mozart-giovani-liete", "Giovani liete (repeated)": "mozart-giovani-liete-reprise", "Ricevete, o padroncina": "mozart-ricevete-o-padroncina" },
  cosi: { Sinfonia: "mozart-cosi-sinfonia", "Bella vita militar": "mozart-bella-vita-militar" },
};
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
    const editionId = s.who.length ? undefined : INSTRUMENTAL[opera.id]?.[s.title];
    return { title: s.title, kind: s.kind, act: actOf(s.act), who: s.who, ...(piece ? { piece } : {}), ...(editionId ? { editionId } : {}) };
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
  // added with the full Figaro cast (2026-10)
  "È Barbarina… Chi va là?",
  "Cosa stai misurando",
  "Or bene, ascolta e taci",
  "Ed aspettaste il giorno",
  "Tutto ancor non ho perso",
  "Va' là, vecchia pedante",
  "Taci, vien gente",
  "Basilio, in traccia tosto",
  "Perfida! e in quella forma",
  "Quanto duolmi, Susanna",
  "Bravo! Che bella voce!",
  "Dunque voi non aprite?",
  "Tutto è come il lasciai",
  "Che imbarazzo è mai questo!",
  "È decisa la lite",
  "Eccovi, o caro amico",
  "Cosa mi narri!",
  "Signor… se trattenete",
  "Hai diavoli nel corpo?",
  "Oh guarda il demonietto!",
  "Piegato è il foglio",
  "Susanna! Signore!",
  "Signori, di fuori son già i suonatori",
  "Ah! signor!",
  "Voi, signor, che giusto siete",
  "Amanti costanti",
  "Andate, amici!",
  "Gente, gente, all'armi!",
]);
const V2_ADDED: Record<string, string[]> = {
  "Contro un cor che accende amore": ["almaviva"],
  "O soave fanciulla": ["marcello", "colline"],
  "Voi! Cavaradossi!": ["tosca"],
  "Ancora un passo or via… Quanto cielo! Quanto mar!": ["sharpless", "pinkerton"],
  "The relatives bargain": ["schicchi"],
  "Addio, fiorito asil": ["sharpless"],
  "Signora! ella mi disse": ["figaro"],
};
const V2_REMOVED: Record<string, string[]> = {
  "Bel conforto al mietitore… Quanto è bella": ["adina"],
  "The letter": ["suzuki"],
  // Figaro's cast check: this recitative is Barbarina's; Figaro's own scene with Bartolo follows it
  "Nel padiglione a manca": ["figaro", "bartolo"],
  // the finales split into the score's sections: Susanna, Figaro and Bartolo now come in only in later sections of Act 2's
  "Esci omai, garzon malnato": ["susanna", "figaro", "bartolo"],
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

// Figaro's list has since been rebuilt to follow the score's table of contents piece by piece, so its old
// lists are kept as they were rather than rebuilt from today's running order
const FIGARO_V2: Record<string, string[]> = {
  "figaro:figaro": ["Cinque, dieci, venti", "Act 1: Se a caso madama", "Se vuol ballare", "Act 1: Giovani liete", "Non più andrai", "Act 2: Vieni, cara Susanna", "Act 2: Esci omai, garzon malnato", "Act 3: Riconosci in questo amplesso", "Act 3: Ecco la marcia", "Act 4: L'ho perduta, me meschina", "Act 4: Nel padiglione a manca", "Aprite un po' quegli occhi", "Act 4: Pian pianin le andrò più presso"],
  "figaro:susanna": ["Cinque, dieci, venti", "Act 1: Se a caso madama", "Act 1: Via resti servita", "Act 1: Cosa sento!", "Act 1: Giovani liete", "Act 2: Vieni, cara Susanna", "Venite, inginocchiatevi", "Act 2: Susanna, or via, sortite", "Act 2: Aprite, presto, aprite", "Act 2: Esci omai, garzon malnato", "Act 3: Crudel! perché finora", "Act 3: Riconosci in questo amplesso", "Sull'aria… che soave zeffiretto", "Act 3: Ricevete, o padroncina", "Act 3: Ecco la marcia", "Act 4: Signora, ella mi disse", "Deh vieni, non tardar", "Act 4: Pian pianin le andrò più presso"],
  "figaro:countess": ["Porgi, amor", "Act 2: Vieni, cara Susanna", "Act 2: Susanna, or via, sortite", "Act 2: Esci omai, garzon malnato", "E Susanna non vien!", "Dove sono", "Sull'aria… che soave zeffiretto", "Act 3: Ricevete, o padroncina", "Act 3: Ecco la marcia", "Act 4: Signora, ella mi disse", "Act 4: Pian pianin le andrò più presso"],
  "figaro:count": ["Act 1: Cosa sento!", "Act 1: Giovani liete", "Act 2: Susanna, or via, sortite", "Act 2: Esci omai, garzon malnato", "Act 3: Crudel! perché finora", "Hai già vinta la causa… Vedrò mentr'io sospiro", "Act 3: Riconosci in questo amplesso", "Act 3: Io vi dico, signor", "Act 3: Ricevete, o padroncina", "Act 3: Ecco la marcia", "Act 4: Pian pianin le andrò più presso"],
  "figaro:cherubino": ["Non so più cosa son", "Act 1: Giovani liete", "Voi che sapete", "Act 2: Aprite, presto, aprite", "Act 3: Andiam, andiam, bel paggio", "Act 3: Ricevete, o padroncina", "Act 4: Pian pianin le andrò più presso"],
  "figaro:bartolo": ["La vendetta", "Act 2: Esci omai, garzon malnato", "Act 3: Riconosci in questo amplesso", "Act 4: Nel padiglione a manca"],
};
Object.assign(V2_KEYS, FIGARO_V2);

// La bohème's running order has since been rebuilt from the vocal score section by section, so its old lists are
// kept as they were (the five characters the app had then) rather than rebuilt from today's running order
const BOHEME_V2: Record<string, string[]> = {
  "boheme:rodolfo": ["Act 1: Questo Mar Rosso", "Act 1: Schaunard's windfall", "Act 1: Benoît's visit", "Che gelida manina", "O soave fanciulla", "Act 2: Aranci, datteri!", "Act 2: Ensemble and retreat", "Act 3: Marcello, finalmente!… Mimì è tanto malata", "Act 3: Addio, dolce svegliare", "O Mimì, tu più non torni", "Act 4: Clowning", "Act 4: Musetta brings Mimì", "Act 4: Sono andati?", "Act 4: Finale"],
  "boheme:mimi": ["Act 1: Chi è là?… Che gelida manina", "Sì, mi chiamano Mimì", "O soave fanciulla", "Act 2: Aranci, datteri!", "Act 2: Ensemble and retreat", "Act 3: Mimì?!… Speravo di trovarvi qui", "Act 3: Marcello, finalmente!… Mimì è tanto malata", "Donde lieta uscì", "Act 3: Addio, dolce svegliare", "Act 4: Musetta brings Mimì", "Act 4: Sono andati?", "Act 4: Finale"],
  "boheme:musetta": ["Quando m'en vo'", "Act 2: Ensemble and retreat", "Act 3: Addio, dolce svegliare", "Act 4: Musetta brings Mimì", "Act 4: Finale"],
  "boheme:marcello": ["Act 1: Questo Mar Rosso", "Act 1: Schaunard's windfall", "Act 1: Benoît's visit", "Act 2: Aranci, datteri!", "Act 2: Quando m'en vo", "Act 2: Ensemble and retreat", "Act 3: Mimì?!… Speravo di trovarvi qui", "Act 3: Marcello, finalmente!… Mimì è tanto malata", "Act 3: Addio, dolce svegliare", "O Mimì, tu più non torni", "Act 4: Clowning", "Act 4: Musetta brings Mimì", "Act 4: Finale"],
  "boheme:colline": ["Act 1: Questo Mar Rosso", "Act 1: Schaunard's windfall", "Act 1: Benoît's visit", "Act 2: Aranci, datteri!", "Act 2: Ensemble and retreat", "Act 4: Clowning", "Act 4: Musetta brings Mimì", "Vecchia zimarra, senti", "Act 4: Finale"],
};
Object.assign(V2_KEYS, BOHEME_V2);
for (const id of ["schaunard", "benoit", "alcindoro", "parpignol", "sergente", "doganiere"]) V2_KEYS[`boheme:${id}`] = [];

// Così fan tutte's running order has since been rebuilt from the vocal score section by section, with every recitative,
// so its old lists are kept as they were rather than rebuilt from today's running order
const COSI_V2: Record<string, string[]> = {
  "cosi:fiordiligi": ["Act 1: Ah guarda, sorella", "Act 1: Sento, o Dio, che questo piede", "Act 1: Di scrivermi ogni giorno", "Soave sia il vento", "Act 1: Alla bella Despinetta", "Act 1: Temerari, sortite fuori… Come scoglio", "Act 1: Ah, che tutta in un momento", "Act 2: Prenderò quel brunettino", "Act 2: Ei parte… Per pietà, ben mio, perdona", "Act 2: Fra gli amplessi in pochi istanti", "Act 2: Fate presto, o cari amici"],
  "cosi:dorabella": ["Act 1: Ah guarda, sorella", "Act 1: Sento, o Dio, che questo piede", "Act 1: Di scrivermi ogni giorno", "Soave sia il vento", "Act 1: Ah, scostati!… Smanie implacabili", "Act 1: Alla bella Despinetta", "Act 1: Ah, che tutta in un momento", "Act 2: Prenderò quel brunettino", "Act 2: Il core vi dono", "Act 2: È amore un ladroncello", "Act 2: Fate presto, o cari amici"],
  "cosi:despina": ["Act 1: In uomini, in soldati", "Act 1: Che silenzio!", "Act 1: Alla bella Despinetta", "Act 1: Oh, la saria da ridere!", "Act 1: Ah, che tutta in un momento", "Act 2: Una donna a quindici anni", "Act 2: La mano a me date", "Act 2: Fate presto, o cari amici"],
  "cosi:ferrando": ["Act 1: La mia Dorabella capace non è", "Act 1: È la fede delle femmine", "Act 1: Una bella serenata", "Act 1: Sento, o Dio, che questo piede", "Act 1: Al fato dan legge quegli occhi vezzosi", "Act 1: Di scrivermi ogni giorno", "Act 1: Alla bella Despinetta", "Act 1: E voi ridete?", "Act 1: Un'aura amorosa", "Act 1: Ah, che tutta in un momento", "Act 2: Secondate, aurette amiche", "Act 2: La mano a me date", "Act 2: Barbara! perché fuggi?… Ah, lo veggio, quell'anima bella", "Act 2: In qual fiero contrasto… Tradito, schernito", "Act 2: Fra gli amplessi in pochi istanti", "Act 2: Tutti accusan le donne", "Act 2: Fate presto, o cari amici"],
  "cosi:guglielmo": ["Act 1: La mia Dorabella capace non è", "Act 1: È la fede delle femmine", "Act 1: Una bella serenata", "Act 1: Sento, o Dio, che questo piede", "Act 1: Al fato dan legge quegli occhi vezzosi", "Act 1: Di scrivermi ogni giorno", "Act 1: Alla bella Despinetta", "Act 1: Non siate ritrosi", "Act 1: E voi ridete?", "Act 1: Ah, che tutta in un momento", "Act 2: Secondate, aurette amiche", "Act 2: La mano a me date", "Act 2: Il core vi dono", "Act 2: Donne mie, la fate a tanti", "Act 2: Tutti accusan le donne", "Act 2: Fate presto, o cari amici"],
  "cosi:alfonso": ["Act 1: La mia Dorabella capace non è", "Act 1: È la fede delle femmine", "Act 1: Una bella serenata", "Act 1: Vorrei dir, e cor non ho", "Act 1: Sento, o Dio, che questo piede", "Act 1: Di scrivermi ogni giorno", "Soave sia il vento", "Act 1: Nel mare solca", "Act 1: Che silenzio!", "Act 1: Alla bella Despinetta", "Act 1: E voi ridete?", "Act 1: Oh, la saria da ridere!", "Act 1: Ah, che tutta in un momento", "Act 2: La mano a me date", "Act 2: Tutti accusan le donne", "Act 2: Fate presto, o cari amici"],
};
Object.assign(V2_KEYS, COSI_V2);
