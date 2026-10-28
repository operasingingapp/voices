import React, { useEffect, useState } from "react";
import { ARCS, type ArcStep } from "./arcs";
import { OPERAS } from "./operas";
import { SCENES, type Scene } from "./scenes";
/**
 * The full story of each opera, act by act, written for this app (not taken from any programme or book).
 * `where` is the setting of the act; the paragraphs follow the order of the music.
 */
export interface Act {
  title: string;
  where?: string;
  paras: string[];
}

export const SYNOPSES: Record<string, Act[]> = {
  figaro: [
    {
      title: "Act 1",
      where: "Count Almaviva's castle near Seville, the morning of the wedding",
      paras: [
        "Figaro measures the room the Count has given him and Susanna for after their wedding. Susanna points out why it is so close to the Count's own: he means to pursue her. Figaro swears to outwit his master.",
        "Old Doctor Bartolo and his housekeeper Marcellina have their own plan. Figaro once borrowed money from Marcellina and promised to marry her if he could not pay it back, and Bartolo, who has a grudge against Figaro, is glad to help her claim him.",
        "The young page Cherubino, in love with every woman in the house, has been dismissed after the Count found him with the gardener's daughter Barbarina. He begs Susanna to plead for him, then hides when the Count arrives to flirt with her. The Count hides in turn when the music master Basilio comes gossiping about Cherubino and the Countess, bursts out in anger, and finds the page in the armchair.",
        "Figaro brings in the villagers to thank the Count for giving up the old right of a lord over his servants' brides, hoping to force the wedding at once. The Count puts it off, and packs Cherubino off to his regiment, while Figaro teases the boy about the soldier's life ahead.",
      ],
    },
    {
      title: "Act 2",
      where: "The Countess's room",
      paras: [
        "Alone, the Countess grieves for her husband's lost love (“Porgi, amor”). Figaro has a plan: an anonymous note will make the Count believe his wife has a lover, and Susanna will agree to meet the Count in the garden, where Cherubino, dressed as a girl, will go in her place.",
        "The women are dressing Cherubino when the Count knocks. The page hides in the closet, the Count hears a noise and, suspicious, takes the Countess with him to fetch tools to break the door. Susanna slips into the closet; Cherubino jumps from the window. When the door is opened, out steps Susanna, and the Count has to ask his wife's pardon.",
        "The gardener Antonio arrives complaining that a man jumped onto his flowers. Figaro claims it was him, and bluffs his way through the paper the man dropped: Cherubino's commission. Then Marcellina, Bartolo and Basilio arrive with her claim on Figaro, and the Count happily promises to judge it.",
      ],
    },
    {
      title: "Act 3",
      where: "A hall in the castle, prepared for the wedding",
      paras: [
        "Sent by the Countess, Susanna agrees to meet the Count in the garden that night, but he overhears her tell Figaro their case is won and swears he will not lose to a servant.",
        "At the hearing Figaro is ordered to pay Marcellina or marry her, until a birthmark proves he is the son Marcellina and Bartolo lost long ago. Susanna arrives with money to pay the debt, sees Figaro embracing Marcellina and slaps him, then learns the truth, and the new family rejoices.",
        "The Countess, waiting for Susanna, remembers the happy days of her marriage and hopes to win her husband back (“E Susanna non vien!… Dove sono”). She dictates a note to Susanna setting the time and place of the meeting (“Sull'aria”), sealed with a pin the Count is to send back.",
        "The village girls bring flowers, Cherubino among them in a dress, and is found out. At the wedding celebrations Susanna slips the note to the Count, who pricks his finger on the pin.",
      ],
    },
    {
      title: "Act 4",
      where: "The castle garden, at night",
      paras: [
        "Barbarina has lost the pin she was to return to Susanna. From her Figaro learns of the note, believes Susanna is betraying him, and hides to catch her, raging against women. Susanna, who knows he is listening, sings of her longing for her lover (“Deh vieni, non tardar”), and he takes it for the Count.",
        "In the dark the Countess and Susanna have swapped clothes. Cherubino flirts with the ‘Susanna’ who is really the Countess; the Count woos his own wife, thinking her Susanna. Figaro recognises Susanna's voice under the Countess's cloak and pays her back by courting her as ‘the Countess’ until they make up.",
        "The Count finds Figaro with ‘his wife’, calls everyone out and refuses all pardon, until the real Countess steps forward. He kneels and asks her forgiveness, she gives it, and the long day ends in celebration.",
      ],
    },
  ],

  giovanni: [
    {
      title: "Act 1",
      where: "Seville, in the seventeenth century",
      paras: [
        "At night Leporello waits outside the Commendatore's house while his master Don Giovanni, masked, tries to seduce the Commendatore's daughter Donna Anna. She chases him out crying for help; her father challenges the stranger and is killed. Anna and her fiancé Don Ottavio swear vengeance.",
        "Giovanni comes upon Donna Elvira, a lady he seduced and abandoned in Burgos, who is searching for him. He slips away, and Leporello shows her the catalogue of his master's conquests (“Madamina”).",
        "A country wedding: Giovanni invites the bride Zerlina and her groom Masetto to his palace and, alone with Zerlina, all but persuades her to come away with him (“Là ci darem la mano”). Elvira interrupts and warns her, and warns Anna and Ottavio too. Anna recognises Giovanni's voice as her father's killer's and tells Ottavio the story of that night.",
        "Zerlina makes peace with the jealous Masetto. At Giovanni's party three masked guests arrive: Anna, Ottavio and Elvira. Giovanni drags Zerlina off, she screams, and he tries to blame Leporello; the three unmask and accuse him, but he escapes.",
      ],
    },
    {
      title: "Act 2",
      where: "Seville",
      paras: [
        "Giovanni swaps cloaks with Leporello so that the servant can lead Elvira away while he serenades her maid (“Deh, vieni alla finestra”). Still disguised, he sends Masetto's armed friends off in the wrong directions and beats Masetto; Zerlina consoles him.",
        "Leporello, taken for his master, is cornered by Anna, Ottavio, Zerlina, Masetto and Elvira, unmasks and escapes. Ottavio vows to bring Giovanni to justice; Elvira, betrayed again, still pities him (“Mi tradì”).",
        "In a graveyard the statue of the Commendatore speaks. Giovanni makes the terrified Leporello invite it to dinner, and the statue accepts. Anna asks Ottavio to wait for her love until she has mourned her father.",
        "At supper Elvira begs Giovanni to change his life; he laughs at her. The statue enters, demands that he repent, and is refused again and again; flames rise and Giovanni is dragged down to hell. The others resolve their futures and point the moral: so end all evildoers.",
      ],
    },
  ],

  zauberfloete: [
    {
      title: "Act 1",
      where: "A wild, rocky place; then Sarastro's temple",
      paras: [
        "Prince Tamino, chased by a serpent, faints; three Ladies of the Queen of the Night kill it. The bird-catcher Papageno arrives and claims the deed, and the Ladies padlock his mouth. They show Tamino a portrait of the Queen's daughter Pamina, and he falls in love with it (“Dies Bildnis ist bezaubernd schön”).",
        "The Queen appears, grieving for Pamina, carried off by Sarastro, and promises her to Tamino if he rescues her. Tamino is given a magic flute, Papageno a set of magic bells, and three Spirits will guide them.",
        "In Sarastro's realm Pamina is guarded by the Moor Monostatos. Papageno finds her and tells her a prince loves her; together they sing of love between man and woman. At the temple a Speaker tells Tamino that Sarastro is no tyrant; Tamino plays his flute and hears Papageno's pipes answer.",
        "Monostatos catches Pamina and Papageno, but the magic bells set his slaves dancing. Sarastro arrives; Pamina confesses she tried to escape from Monostatos, who is punished. Tamino and Pamina see each other for the first time, and are led away to be tested.",
      ],
    },
    {
      title: "Act 2",
      where: "Sarastro's temple and its grounds",
      paras: [
        "The priests agree that Tamino may undergo the trials. The first is silence: the Ladies tempt the two men to speak, and Tamino holds firm while Papageno chatters.",
        "Monostatos tries to steal a kiss from the sleeping Pamina. Her mother appears, gives her a dagger and demands that she kill Sarastro (“Der Hölle Rache”). Sarastro tells Pamina that in these halls there is no revenge.",
        "Tamino, bound to silence, will not answer Pamina, and she believes he no longer loves her (“Ach, ich fühl's”). In despair she thinks of death until the Spirits stop her. Papageno is promised a wife, an old woman who turns into the young Papagena and then vanishes.",
        "Tamino and Pamina pass through fire and water together, protected by the flute. Papageno, about to hang himself for loneliness, remembers his bells, and Papagena returns. The Queen, her Ladies and Monostatos storm the temple and are cast into the night, and the sun rises on Sarastro's realm.",
      ],
    },
  ],

  barbiere: [
    {
      title: "Act 1",
      where: "Seville: a square, then Doctor Bartolo's house",
      paras: [
        "At dawn Count Almaviva serenades Rosina under the window of her guardian, old Doctor Bartolo. Figaro, the barber and fixer of the town, arrives singing of his busy life (“Largo al factotum”) and promises to get the Count into the house; the Count sings again as ‘Lindoro’, a poor student, so that Rosina will love him for himself.",
        "Rosina, determined to have her Lindoro (“Una voce poco fa”), gives Figaro a letter for him. The music master Basilio warns Bartolo that the Count is in town and advises slander to drive him off.",
        "The Count bursts in disguised as a drunken soldier billeted on the house. In the uproar the police arrive to arrest him, he quietly shows the officer who he is, and everyone is left stunned.",
      ],
    },
    {
      title: "Act 2",
      where: "Doctor Bartolo's house",
      paras: [
        "The Count returns as ‘Don Alonso’, a music teacher sent in place of a sick Basilio, and gives Rosina her singing lesson under Bartolo's nose. Figaro, shaving Bartolo, steals the key to the balcony. When the real Basilio appears, a purse persuades him he has a fever and should go to bed.",
        "Bartolo, suspicious, shows Rosina her own letter and convinces her Lindoro is only a go-between for the Count; hurt, she agrees to marry Bartolo at once. A storm passes.",
        "The Count and Figaro climb in by the balcony. The Count reveals who he is and Rosina is overjoyed, but the ladder has been taken away. The notary Bartolo sent for marries the Count and Rosina instead, with a bribed Basilio as witness. Bartolo arrives too late and consoles himself with the dowry.",
      ],
    },
  ],

  elisir: [
    {
      title: "Act 1",
      where: "A village in the Basque country",
      paras: [
        "The shy villager Nemorino adores the rich and clever Adina, who laughs as she reads her farmhands the tale of Tristan and the love potion. The swaggering Sergeant Belcore marches in with his soldiers and courts Adina at once; she tells Nemorino plainly that she is fickle.",
        "The travelling quack Doctor Dulcamara arrives selling a cure for everything. Nemorino asks for Isolde's love potion and is sold a bottle of Bordeaux, which will work, he is told, in a day.",
        "Tipsy and sure of himself, Nemorino ignores Adina. Stung, she agrees to marry Belcore in six days; then orders call the soldiers away the next morning, and she agrees to marry him that very day. Nemorino begs her to wait one more day.",
      ],
    },
    {
      title: "Act 2",
      where: "Adina's farm, at the wedding feast",
      paras: [
        "Dulcamara and Adina sing a barcarolle for the guests, but Adina keeps finding reasons not to sign the contract. Nemorino needs money for more elixir and enlists in Belcore's regiment for twenty scudi.",
        "The village girls learn that Nemorino's rich uncle has died and left him everything, and crowd round him; he, not knowing, thinks the elixir is working. Dulcamara tells Adina that Nemorino sold his freedom for her, and she understands what she feels. Nemorino sees a tear on her cheek and knows she loves him (“Una furtiva lagrima”).",
        "Adina buys back his enlistment papers and confesses her love. Belcore shrugs off the loss, and Dulcamara sells out his stock to a village convinced the elixir made Nemorino rich and loved.",
      ],
    },
  ],

  rigoletto: [
    {
      title: "Act 1",
      where: "Mantua, in the sixteenth century: the Duke's palace, then a street at night",
      paras: [
        "At a ball the Duke of Mantua boasts that one woman is as good as another. His hunchbacked jester Rigoletto mocks the courtiers, and then Count Monterone, whose daughter the Duke has seduced. The Duke has Monterone arrested, and Monterone curses them both.",
        "On his way home, troubled by the curse, Rigoletto meets the assassin Sparafucile, who offers his services. Rigoletto compares the two of them, one killing with a blade, the other with his tongue. At home he visits his daughter Gilda, whom he keeps hidden from the world.",
        "The Duke, disguised as a poor student, ‘Gualtier Maldè’, has been watching Gilda at church; he slips into the courtyard and declares his love, and she dreams of his name after he has gone (“Caro nome”). The courtiers, believing Gilda to be Rigoletto's mistress, trick him into helping them carry her off. Too late, he remembers the curse.",
      ],
    },
    {
      title: "Act 2",
      where: "The Duke's palace",
      paras: [
        "The Duke, hearing that Gilda has been brought to the palace, hurries to her. Rigoletto searches for his daughter among the laughing courtiers and turns on them in fury. Gilda runs out and, alone with her father, tells him how she was deceived. Rigoletto swears vengeance on the Duke.",
      ],
    },
    {
      title: "Act 3",
      where: "Sparafucile's inn by the river",
      paras: [
        "Rigoletto shows Gilda, still in love, the Duke flirting with Sparafucile's sister Maddalena (“La donna è mobile”). He pays Sparafucile to kill the Duke and sends Gilda off to Verona dressed as a man.",
        "A storm breaks. Maddalena begs her brother to spare the handsome stranger, and Sparafucile agrees to kill whoever next comes to the door instead. Gilda, overhearing, knocks, and is stabbed.",
        "Rigoletto collects the sack with the body and gloats, until he hears the Duke singing in the distance. He opens the sack to find his dying daughter. The curse is fulfilled.",
      ],
    },
  ],

  traviata: [
    {
      title: "Act 1",
      where: "Paris: a party at Violetta's house",
      paras: [
        "Violetta Valéry, a celebrated courtesan, is giving a party, though she has been ill. Alfredo Germont, who has loved her from afar, leads the drinking song and, alone with her, declares his love. She laughs it off but gives him a flower to bring back when it has faded.",
        "Alone, she wonders whether this could be real love (“Ah, fors'è lui”), then tells herself she must stay free and live for pleasure (“Sempre libera”), while Alfredo's voice is heard outside.",
      ],
    },
    {
      title: "Act 2",
      where: "A country house near Paris; then a party at Flora's",
      paras: [
        "Months later Violetta and Alfredo live happily in the country. Alfredo discovers she has been selling her possessions to pay for it and rushes to Paris to raise money.",
        "While he is away his father, Giorgio Germont, calls on Violetta and demands that she give Alfredo up: the scandal threatens his daughter's marriage. After a long struggle she agrees, writes Alfredo a letter of farewell and leaves. Alfredo reads it, and his father's attempt to comfort him with memories of home falls on deaf ears.",
        "At Flora's party Violetta arrives with her old protector, Baron Douphol. Alfredo wins heavily from the Baron at cards, then, before everyone, throws his winnings at Violetta as payment. His father rebukes him, and the Baron challenges him to a duel.",
      ],
    },
    {
      title: "Act 3",
      where: "Violetta's bedroom, a month later",
      paras: [
        "Violetta is dying of consumption and nearly penniless. She rereads a letter from Germont: Alfredo knows the truth and is on his way. She bids farewell to her past (“Addio, del passato”).",
        "Alfredo arrives and they dream of leaving Paris together (“Parigi, o cara”), but she is too weak. Germont comes to ask her forgiveness. Violetta feels a sudden rush of strength, and dies.",
      ],
    },
  ],

  carmen: [
    {
      title: "Act 1",
      where: "A square in Seville, by the cigarette factory",
      paras: [
        "Micaëla, a girl from his village, comes looking for the corporal Don José, and leaves before he arrives. The cigarette girls come out on their break, and Carmen sings that love is a wild bird (Habanera), then throws a flower at José, the one man not watching her.",
        "Micaëla returns with a letter and a kiss from José's mother, and he resolves to marry Micaëla. A fight breaks out in the factory; Carmen has slashed another girl, and José is ordered to guard her. She bewitches him with a song about a tavern by the ramparts (Seguidilla), and he lets her escape. He is arrested.",
      ],
    },
    {
      title: "Act 2",
      where: "Lillas Pastia's tavern, two months later",
      paras: [
        "Carmen and her friends dance. The bullfighter Escamillo comes in with his admirers, sings of the ring (Toreador song) and is taken with Carmen; she puts him off. The smugglers want Carmen for a job, but she is waiting for José, just released from prison.",
        "Carmen dances for José; when the bugle calls him back to barracks she mocks him for leaving. He shows her the flower she threw, kept all through his imprisonment (Flower song). When his officer, Zuniga, arrives and orders him out, José draws his sword, and now he has no choice but to join the smugglers.",
      ],
    },
    {
      title: "Act 3",
      where: "The smugglers' camp in the mountains",
      paras: [
        "Carmen is tiring of José's jealousy. Telling fortunes with her friends, she turns up death again and again. Micaëla, frightened but determined, has come to find José (“Je dis que rien ne m'épouvante”).",
        "Escamillo arrives looking for Carmen and fights José until the others part them; he invites everyone to his next bullfight. Micaëla tells José his mother is dying, and he goes with her, warning Carmen they will meet again.",
      ],
    },
    {
      title: "Act 4",
      where: "Outside the bullring in Seville",
      paras: [
        "The crowd cheers the procession, and Carmen arrives on Escamillo's arm. Her friends warn her José is near; she stays to face him.",
        "José begs her to come back to him. She tells him it is over, and throws away the ring he gave her. As the crowd inside acclaims Escamillo's victory, José stabs her, and gives himself up.",
      ],
    },
  ],

  boheme: [
    {
      title: "Act 1",
      where: "A garret in the Latin Quarter of Paris, Christmas Eve",
      paras: [
        "The poet Rodolfo and the painter Marcello burn a manuscript to keep warm. Their friends, the philosopher Colline and the musician Schaunard, arrive with food and money; they get rid of the landlord Benoît and set off for the Café Momus, Rodolfo staying behind to finish an article.",
        "There is a knock: their neighbour Mimì, whose candle has blown out. She drops her key and they search for it in the dark; their hands meet (“Che gelida manina”). She tells him about her simple life (“Sì, mi chiamano Mimì”), and they go out to join the others in love (“O soave fanciulla”).",
      ],
    },
    {
      title: "Act 2",
      where: "The Café Momus",
      paras: [
        "In the Christmas Eve crowd Rodolfo buys Mimì a bonnet and introduces her to his friends. Marcello's old love Musetta sweeps in with her rich admirer Alcindoro and sets out to win Marcello back with a song about how men look at her (“Quando m'en vo”). She sends Alcindoro off on an errand, falls into Marcello's arms, and leaves him the bill.",
      ],
    },
    {
      title: "Act 3",
      where: "A toll gate on the edge of Paris, February",
      paras: [
        "Mimì, coughing, finds Marcello at the inn where he and Musetta live, and tells him Rodolfo's jealousy is unbearable. Rodolfo comes out and tells Marcello he wants to leave her, blaming her flirting; pressed, he admits the real reason: Mimì is gravely ill and he is too poor to care for her. Mimì, hidden, hears everything.",
        "Mimì and Rodolfo say goodbye without bitterness (“Donde lieta uscì”) and agree to stay together until the spring, while Marcello and Musetta quarrel loudly.",
      ],
    },
    {
      title: "Act 4",
      where: "The garret, months later",
      paras: [
        "Rodolfo and Marcello, both apart from their lovers, try to work and cannot. The four friends clown about until Musetta rushes in: Mimì is with her, dying, and wanted to see Rodolfo. Musetta gives Marcello her earrings to sell for medicine, and Colline goes to pawn his coat (“Vecchia zimarra”).",
        "Alone, Mimì and Rodolfo remember the night they met. The others return with a muff to warm her hands. She falls asleep and, without anyone noticing at first, dies.",
      ],
    },
  ],

  tosca: [
    {
      title: "Act 1",
      where: "The church of Sant'Andrea della Valle, Rome, June 1800",
      paras: [
        "Cesare Angelotti, an escaped political prisoner, hides in the church. The painter Mario Cavaradossi, at work on a Magdalene, compares her to his lover, the singer Floria Tosca (“Recondita armonia”), and promises to help Angelotti escape.",
        "Tosca arrives, jealous of the blonde Magdalene. When she has gone, Cavaradossi takes Angelotti to his villa. The police chief Baron Scarpia arrives on Angelotti's trail and uses a fan left behind to stir Tosca's jealousy. As the Te Deum begins, he gloats that he will have both the painter and Tosca.",
      ],
    },
    {
      title: "Act 2",
      where: "Scarpia's rooms in the Palazzo Farnese",
      paras: [
        "Cavaradossi is brought in and interrogated, then tortured within Tosca's hearing until she reveals Angelotti's hiding place. News comes of Napoleon's victory at Marengo, and Cavaradossi, defiant, is dragged away to be shot.",
        "Scarpia names his price for Cavaradossi's life: Tosca herself. She asks why God has abandoned her, who lived for art and love (“Vissi d'arte”), then agrees. Scarpia orders a ‘mock’ execution and writes a safe-conduct; as he comes to claim her, she stabs him with a knife from the table.",
      ],
    },
    {
      title: "Act 3",
      where: "The roof of the Castel Sant'Angelo, before dawn",
      paras: [
        "Cavaradossi, waiting to die, remembers nights with Tosca (“E lucevan le stelle”). She runs in with the safe-conduct and tells him the execution will be a pretence: he must fall convincingly.",
        "The soldiers fire. Tosca finds that the bullets were real and Cavaradossi is dead. Scarpia's murder has been discovered, his men come running, and Tosca leaps from the battlements.",
      ],
    },
  ],

  butterfly: [
    {
      title: "Act 1",
      where: "A house on a hill above Nagasaki, around 1900",
      paras: [
        "The American naval lieutenant Pinkerton has leased a house, and a fifteen-year-old bride, through the marriage broker Goro. The consul Sharpless warns him the girl takes it seriously; Pinkerton toasts the day he will marry ‘a real American wife’.",
        "Cio-Cio-San, Butterfly, arrives with her relatives. She has secretly taken up her husband's religion, and when her uncle, a Buddhist priest, curses her for it, her family disowns her. Pinkerton comforts her, and they sing of their love as night falls.",
      ],
    },
    {
      title: "Act 2",
      where: "Butterfly's house, three years later",
      paras: [
        "Pinkerton has not come back. Butterfly, with her maid Suzuki and her small son, is sure that one fine day his ship will appear (“Un bel dì vedremo”). Sharpless brings a letter from Pinkerton but cannot bring himself to read it all; she refuses the rich Prince Yamadori, and shows Sharpless the child.",
        "A cannon announces Pinkerton's ship. Butterfly and Suzuki fill the house with flowers, and she waits up all night with the child.",
      ],
    },
    {
      title: "Act 3",
      where: "Butterfly's house, at dawn (in the two-act version, the second part of Act 2)",
      paras: [
        "Pinkerton arrives with Sharpless and his American wife, Kate, who will bring up the boy. Overcome with remorse, Pinkerton cannot face Butterfly and leaves.",
        "Butterfly sees Kate and understands. She agrees to give up her son if Pinkerton comes for him himself, blindfolds the child, and kills herself with her father's dagger as Pinkerton is heard calling her name.",
      ],
    },
  ],

  schicchi: [
    {
      title: "The opera",
      where: "Florence, 1299: the bedroom of Buoso Donati, who has just died. In one act",
      paras: [
        "Buoso's relatives kneel weeping round his bed, until they hear a rumour that he has left everything to the monks. They hunt for the will, and the young Rinuccio finds it; before handing it over he makes his aunt Zita promise he can marry Lauretta, daughter of Gianni Schicchi, and sends for her father. The will confirms the worst.",
        "Rinuccio says only Schicchi can save them. The relatives sneer at the newcomer from the country; Rinuccio praises Florence and its new men. Schicchi arrives with Lauretta and, insulted, refuses to help, until Lauretta begs him (“O mio babbino caro”).",
        "Nobody yet knows Buoso is dead. Schicchi has the body hidden, climbs into the bed and, imitating the dead man's voice, fools the doctor. Each relative secretly bribes him for the best property. The women dress him in Buoso's nightclothes, and he warns them that forging a will means exile and the loss of a hand, for all of them.",
        "Before the notary Schicchi dictates the new will and leaves the house, the mill and the mule to ‘my devoted friend Gianni Schicchi’. The relatives can say nothing. When the notary has gone he drives them out, looting as they go, and Lauretta and Rinuccio embrace. Schicchi asks the audience to forgive him, given the happy ending.",
      ],
    },
  ],
};

/** A name as it appears in the story ("The Countess" is "the Countess" mid-sentence; "Don Giovanni" may be just "Giovanni"). */
function namePattern(name: string): RegExp {
  const bare = name.replace(/^(The|Don|Donna)\s+/i, "");
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(${[name, bare].map(esc).join("|")})(?![\\p{L}])`, "giu");
}

/**
 * The acts, each with its setting and its story; your role's name stands out so you can follow your part.
 * `level` is the heading level of the act titles, to fit the page around them.
 */
export function SynopsisActs({ acts, you, level = 3, after }: { acts: Act[]; you?: string; level?: 2 | 3 | 4; after?: (i: number) => React.ReactNode }) {
  const H = `h${level}` as "h2" | "h3" | "h4";
  const mark = (text: string) => {
    if (!you) return text;
    const parts = text.split(namePattern(you));
    return parts.map((p, i) => (i % 2 === 1 ? <b key={i} className="syn-you">{p}</b> : p));
  };
  return (
    <div className="syn">
      {acts.map((a, ai) => (
        <section key={a.title} className="syn-act">
          <H className="syn-title">{a.title}</H>
          {a.where && <p className="syn-where">{a.where}</p>}
          {a.paras.map((p, i) => (
            <p key={i} className="syn-p">
              {mark(p)}
            </p>
          ))}
          {after?.(ai)}
        </section>
      ))}
    </div>
  );
}

/** "The Countess's story" */
export function storyOf(name: string): string {
  return `${name}’s story`;
}

/** The opera's numbers, each with what happens and who else sings in it. */
function SceneList({ scenes, opera, you }: { scenes: Scene[]; opera: string; you?: string }) {
  const o = OPERAS.find((x) => x.id === opera);
  const name = (id: string) => o?.chars.find((c) => c.id === id)?.name ?? id;
  return (
    <ol className="syn-scenes">
      {scenes.map((sc, i) => {
        const sings = !!you && sc.who.includes(you);
        const silent = !!you && !sings && !!sc.also?.includes(you);
        const others = sc.who.filter((w) => w !== you).map(name);
        return (
          <li key={i} className={sings ? "mine" : silent ? "mine silent" : undefined}>
            <span className="sc-head">
              <b lang={o?.lang}>{sc.title}</b>
              <small>{sc.kind}</small>
            </span>
            <span className="sc-what">{sc.what}</span>
            {you && (silent || others.length > 0) && (
              <span className="sc-with">
                {silent && <em>On stage, silent</em>}
                {silent && others.length > 0 && " · "}
                {others.length > 0 && `${silent ? "Sung by" : "With"} ${others.join(", ")}`}
              </span>
            )}
            {!you && sc.who.length > 0 && <span className="sc-with">{sc.who.map(name).join(", ")}</span>}
          </li>
        );
      })}
    </ol>
  );
}

/** Group a running order by act, keeping the order acts first appear in. */
function byAct(scenes: Scene[]): [string, Scene[]][] {
  const out = new Map<string, Scene[]>();
  for (const sc of scenes) out.set(sc.act, [...(out.get(sc.act) ?? []), sc]);
  return [...out];
}

/**
 * One character's path: for each act they are in, what happens to them, then every number they sing in it,
 * arias, duets, ensembles and finales alike.
 */
export function ArcSteps({ opera, character, steps, level = 3 }: { opera: string; character: string; steps: ArcStep[]; level?: 2 | 3 | 4 }) {
  const H = `h${level}` as "h2" | "h3" | "h4";
  const all = SCENES[opera] ?? [];
  const mine = all.filter((sc) => sc.who.includes(character) || sc.also?.includes(character));
  const sung = all.filter((sc) => sc.who.includes(character)).length;
  const acts = byAct(mine);
  const actName = (a: string) => a.replace(/\s*\(.*\)$/, "");
  const count = sung;
  const silentCount = mine.length - sung;
  // every act they are in: those with a summary, and any where they only join an ensemble
  const order = [...new Set([...(SCENES[opera] ?? []).map((sc) => actName(sc.act)), ...steps.map((x) => x.act)])].filter(
    (a) => steps.some((x) => x.act === a) || acts.some(([b]) => actName(b) === a),
  );
  return (
    <div className="syn syn-arc">
      {count > 0 && (
        <p className="syn-count">
          Sings in {count} {count === 1 ? "number" : "numbers"}
          {silentCount > 0 && `, on stage without singing in ${silentCount} more`}
        </p>
      )}
      {order.map((act) => {
        const st = steps.find((x) => x.act === act);
        const here = acts.find(([a]) => actName(a) === act)?.[1] ?? [];
        return (
          <section key={act} className="syn-act">
            <H className="syn-title">{act}</H>
            {st && <p className="syn-p">{st.text}</p>}
            {here.length > 0 && <SceneList scenes={here} opera={opera} you={character} />}
          </section>
        );
      })}
    </div>
  );
}

/**
 * The story, two ways: one character's path through it, and the whole opera act by act (with every number
 * of the act folded under its story). Without a character only the whole opera is shown.
 */
export function Story({
  opera,
  character,
  name,
  level = 3,
  idBase = "story",
}: {
  opera: string;
  character?: string;
  name?: string;
  level?: 2 | 3 | 4;
  idBase?: string;
}) {
  const arc = character ? ARCS[`${opera}:${character}`] : undefined;
  const acts = SYNOPSES[opera];
  const [tab, setTab] = useState<"arc" | "all">(arc ? "arc" : "all");
  useEffect(() => setTab(arc ? "arc" : "all"), [opera, character, arc]);
  if (!acts && !arc) return null;
  const both = !!arc && !!acts && !!name;
  const numbers = byAct(SCENES[opera] ?? []);
  return (
    <div className="story">
      {both && (
        <div className="cp-seg story-tabs" role="tablist" aria-label="Which story">
          <button type="button" role="tab" id={`${idBase}-arc`} aria-selected={tab === "arc"} aria-controls={`${idBase}-panel`} onClick={() => setTab("arc")}>
            {storyOf(name!)}
          </button>
          <button type="button" role="tab" id={`${idBase}-all`} aria-selected={tab === "all"} aria-controls={`${idBase}-panel`} onClick={() => setTab("all")}>
            The whole opera
          </button>
        </div>
      )}
      <div id={`${idBase}-panel`} role={both ? "tabpanel" : undefined} aria-labelledby={both ? `${idBase}-${tab}` : undefined}>
        {tab === "arc" && arc && character ? (
          <ArcSteps opera={opera} character={character} steps={arc} level={level} />
        ) : acts ? (
          <SynopsisActs
            acts={acts}
            you={name}
            level={level}
            after={(i) => {
              const list = numbers[i]?.[1];
              return list?.length ? (
                <details className="syn-numbers">
                  <summary>Every number in {acts[i].title === "The opera" ? "the opera" : acts[i].title.toLowerCase().replace("act", "Act")} · {list.length}</summary>
                  <SceneList scenes={list} opera={opera} />
                </details>
              ) : null;
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
