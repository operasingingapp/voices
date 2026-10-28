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
        "After the overture, Figaro measures the room the Count has given him and Susanna for after their wedding, while she tries on her bridal hat. Susanna points out why the room is so close to the Count's own: he means to pursue her. Alone, Figaro swears that if the Count wants to dance, Figaro will call the tune.",
        "Old Doctor Bartolo and his housekeeper Marcellina have their own plan. Figaro once borrowed money from Marcellina and promised to marry her if he could not pay it back, and Bartolo, who has a grudge against Figaro, relishes the chance of revenge by law. Marcellina and Susanna trade elaborately polite insults in the doorway.",
        "The young page Cherubino, in love with every woman in the house, has been dismissed after the Count found him with the gardener's daughter Barbarina. He begs Susanna to plead for him and pours out his confusion about love. When the Count arrives to flirt with Susanna, Cherubino hides behind the armchair; the Count hides in turn when the music master Basilio comes gossiping about Cherubino and the Countess, bursts out in anger, and finds the page in the armchair.",
        "Figaro brings in the villagers to thank the Count for giving up the old right of a lord over his servants' brides, hoping to force the wedding at once. The Count puts it off, and packs Cherubino off to his regiment, while Figaro teases the boy about the soldier's life ahead.",
      ],
    },
    {
      title: "Act 2",
      where: "The Countess's room",
      paras: [
        "Alone, the Countess grieves for her husband's lost love (“Porgi, amor”). Figaro has a plan: an anonymous note will make the Count believe his wife has a lover, and Susanna will agree to meet the Count in the garden, where Cherubino, dressed as a girl, will go in her place. Cherubino sings the Countess the song he has written for her (“Voi che sapete”), and Susanna dresses him up.",
        "The Count knocks. The page hides in the closet; the Count hears a noise and, when the Countess says it is Susanna, orders her to come out. Suspicious, he takes the Countess with him to fetch tools to break the door. Susanna slips into the closet, and Cherubino jumps from the window. The Countess, back with the Count, confesses it is Cherubino inside; the door opens, out steps Susanna, and the Count has to ask his wife's pardon.",
        "The gardener Antonio arrives complaining that a man jumped onto his flowers. Figaro claims it was him, and, prompted by the women, bluffs his way through the paper the man dropped: Cherubino's commission. Then Marcellina, Bartolo and Basilio arrive with her claim on Figaro, and the Count happily promises to judge it.",
      ],
    },
    {
      title: "Act 3",
      where: "A hall in the castle, prepared for the wedding",
      paras: [
        "Sent by the Countess, Susanna promises the Count a meeting in the garden that night, muddling her yeses and noes. As she leaves he overhears her whisper to Figaro that their case is won, and alone he swears he will not lose to a servant.",
        "At the hearing Figaro is ordered to pay Marcellina or marry her, until a birthmark proves he is the son Marcellina and Bartolo lost long ago. Susanna arrives with money to pay the debt, sees Figaro embracing Marcellina and slaps him, then learns the truth, and the new family rejoices while the Count fumes.",
        "Barbarina takes Cherubino off to dress him as a girl. The Countess, waiting for Susanna, remembers the happy days of her marriage and hopes to win her husband back (“E Susanna non vien!… Dove sono”). Antonio tells the Count that Cherubino never left: his hat is at Barbarina's. The Countess dictates a note to Susanna setting the time and place of the meeting (“Sull'aria”), sealed with a pin the Count is to send back.",
        "The village girls bring the Countess flowers, Cherubino among them in a dress; he is found out, and saved when Barbarina asks the Count for him as her husband. A march brings in the double wedding, Figaro and Susanna, Marcellina and Bartolo. During the fandango Susanna slips the note to the Count, who pricks his finger on the pin, and he invites everyone to the evening's celebrations.",
      ],
    },
    {
      title: "Act 4",
      where: "The castle garden, at night",
      paras: [
        "Barbarina has lost the pin she was to return to Susanna. From her Figaro learns of the note and believes Susanna is betraying him; Marcellina, now on Susanna's side, goes to warn her (and, in her often-cut aria, reflects that only humans mistreat their mates). Figaro posts Basilio and Bartolo nearby to come when he whistles. Basilio, in an aria also often cut, tells how a donkey's skin once saved him: it pays to give way to the powerful. Hiding in the dark, Figaro warns all men to open their eyes to women (“Aprite un po' quegli occhi”).",
        "Susanna and the Countess come out in each other's clothes. Susanna, who knows Figaro is listening, sings of her longing for her lover (“Deh vieni, non tardar”), and he takes it for the Count.",
        "In the dark Cherubino flirts with the ‘Susanna’ who is really the Countess, and the Count woos his own wife, thinking her Susanna. Figaro recognises Susanna's voice under the Countess's cloak and pays her back by courting her as ‘the Countess’ until they make up. The Count finds Figaro with ‘his wife’, calls everyone out and refuses all pardon, until the real Countess steps forward. He kneels and asks her forgiveness (“Contessa, perdono”), she gives it, and the long day ends in celebration.",
      ],
    },
  ],

  giovanni: [
    {
      title: "Act 1",
      where: "Seville, in the seventeenth century",
      paras: [
        "The overture begins with the solemn chords that will return when the Commendatore's statue comes to supper. At night Leporello grumbles on watch outside the Commendatore's house while his master Don Giovanni, masked, tries to seduce the Commendatore's daughter Donna Anna. She chases him out crying for help; her father challenges the stranger and is killed. Anna finds the body, and she and her fiancé Don Ottavio swear vengeance.",
        "Giovanni comes upon a lady lamenting the man who abandoned her, and finds it is Donna Elvira, whom he seduced and left in Burgos. He slips away, leaving Leporello to show her the catalogue of his master's conquests (“Madamina”): in Spain alone, a thousand and three.",
        "A country wedding: Zerlina and Masetto celebrate with the villagers. Giovanni invites them all to his palace and sends the jealous Masetto away, furious; alone with Zerlina, he all but persuades her to come away with him (“Là ci darem la mano”). Elvira interrupts, warns her and leads her off, then warns Anna and Ottavio too, while Giovanni tells them she is mad.",
        "As Giovanni leaves, Anna recognises his voice as her father's killer's and tells Ottavio the story of that night, demanding vengeance (“Or sai chi l'onore”); Ottavio sings that her peace is his (“Dalla sua pace”, added for Vienna). Giovanni orders a party with wine and dancing (“Fin ch'han dal vino”), and Zerlina makes peace with Masetto (“Batti, batti”).",
        "At the party three masked guests arrive, Anna, Ottavio and Elvira, praying for heaven's protection. Three orchestras play three dances at once; Giovanni drags Zerlina off and she screams. He tries to blame Leporello, but the three unmask and accuse him, and he escapes.",
      ],
    },
    {
      title: "Act 2",
      where: "Seville",
      paras: [
        "Leporello wants to quit; a purse changes his mind. Giovanni swaps cloaks with him and, hidden, sings words of love to Elvira at her window while Leporello mimes them; she comes down, and Leporello, as ‘Giovanni’, leads her away. Giovanni serenades her maid (“Deh, vieni alla finestra”). Still disguised, he sends Masetto's armed friends off in all directions and beats Masetto; Zerlina comforts him (“Vedrai, carino”).",
        "Leporello, trying to slip away from Elvira, is cornered in a dark courtyard by Anna, Ottavio, Zerlina and Masetto; all think they have caught Giovanni, until he unmasks, pleads for mercy and escapes. Ottavio vows to bring Giovanni to justice (“Il mio tesoro”). In the Vienna version Zerlina catches Leporello and threatens him with a razor before he escapes again, and Elvira, betrayed once more, still pities Giovanni (“Mi tradì”).",
        "In a graveyard the statue of the Commendatore speaks. Giovanni makes the terrified Leporello invite it to supper, and the statue accepts. Anna asks Ottavio to wait for her love until she has mourned her father (“Non mi dir”).",
        "At supper a wind band plays tunes from the operas of the day, Figaro's “Non più andrai” among them. Elvira begs Giovanni to change his life; he laughs at her. The statue enters, demands that he repent, and is refused again and again; flames rise and Giovanni is dragged down to hell. The others find Leporello, plan their futures and sing the moral: so end all evildoers.",
      ],
    },
  ],

  cosi: [
    {
      title: "Act 1",
      where: "Naples: a coffee house, a garden by the sea, the sisters' house",
      paras: [
        "The overture's slow introduction closes on the motto the men will later sing to ‘Così fan tutte’, then races off. In a coffee house, the young officers Ferrando and Guglielmo swear that their fiancées, the sisters Dorabella and Fiordiligi, could never be unfaithful. The old philosopher Don Alfonso doubts it, and refuses to fight over it: women's faithfulness, he says, is like the Arabian phoenix, which everyone talks of and nobody has seen. The officers bet him a hundred sequins and promise to do exactly as he says for a day, and plan how they will spend their winnings on a serenade and a banquet.",
        "In a garden by the sea, the sisters gaze at their lovers' portraits and swear eternal love (“Ah guarda, sorella”). Alfonso arrives, too ‘upset’ to speak, and breaks the news: the officers are ordered to war at once (“Vorrei dir”). The lovers part in anguish (“Sento, o Dio”); a chorus of soldiers sings of military life, and after tearful farewells (“Di scrivermi ogni giorno”) the boat sails. The sisters and Alfonso pray for a gentle wind and calm waves (“Soave sia il vento”). Alone, Alfonso scoffs that whoever trusts a woman's heart ploughs the sea and sows in the sand.",
        "At home the maid Despina brings chocolate; Dorabella rages at her torments and swears she will die (“Smanie implacabili”). Despina laughs: men, and soldiers above all, are never faithful, so the sisters should amuse themselves (“In uomini, in soldati”). Alfonso bribes Despina to help him introduce two foreign suitors: Ferrando and Guglielmo in disguise as ‘Albanians’. Despina does not recognise them, and the sisters, outraged to find men in their house, order them out (“Alla bella Despinetta”). Alfonso passes the strangers off as his old friends, and when they declare their love Fiordiligi declares she stands as firm as a rock (“Come scoglio”). Guglielmo boasts of their charms, and the sisters walk out (“Non siate ritrosi”).",
        "The officers laugh at Alfonso, sure they have won (“E voi ridete?”), but he holds them to their promise; told to wait in the garden without dinner, Ferrando sings that love is food enough (“Un'aura amorosa”). Despina offers Alfonso to run the scheme herself. In the garden the sisters are lamenting when the ‘Albanians’ burst in, swallow ‘arsenic’ and collapse. Despina, disguised as a doctor, revives them with a great magnet, and the ‘cured’ men demand a kiss, which the sisters furiously refuse.",
      ],
    },
    {
      title: "Act 2",
      where: "The sisters' house, the garden by the sea, and a richly decorated hall",
      paras: [
        "Despina tells the sisters that a girl of fifteen should know every trick of love (“Una donna a quindici anni”), and they agree a little flirting can do no harm: Dorabella chooses the dark one, Guglielmo, and Fiordiligi the fair one, Ferrando, so each picks the other's lover (“Prenderò quel brunettino”). In the garden the ‘Albanians’ serenade them from a decorated boat (“Secondate, aurette amiche”). Too shy to speak, they let Despina and Alfonso join their hands with the sisters' (“La mano a me date”), and the couples are left together.",
        "Walking in the garden, Guglielmo wins Dorabella: he gives her a heart-shaped locket and takes Ferrando's portrait from her (“Il core vi dono”). Fiordiligi sends Ferrando away (“Ah, lo veggio”, often cut), and alone she begs her absent lover's forgiveness for her wavering heart (“Per pietà, ben mio, perdona”). Ferrando tells Guglielmo that Fiordiligi held firm; Guglielmo shows him Dorabella's gift of his portrait, and tells the ladies they do it to so many (“Donne mie, la fate a tanti”). Betrayed and mocked, Ferrando finds he still loves Dorabella (“Tradito, schernito”), and Alfonso insists the test goes on.",
        "Dorabella confesses to Fiordiligi and urges her to give in: love is a little thief (“È amore un ladroncello”). Fiordiligi resolves to follow Guglielmo to war in uniform, but Ferrando appears and begs her to kill him with his sword, and she gives in (“Fra gli amplessi”), while Guglielmo watches in horror. Alfonso tells the two furious officers to marry their fiancées all the same: everyone blames women, but he forgives them, because they all do it, and the three sing ‘Così fan tutte’.",
        "A double wedding is prepared, and the couples toast each other while Guglielmo mutters. Despina, disguised as a notary, reads the contract and the sisters sign, when the soldiers' chorus is heard: the officers are back. The ‘Albanians’ hide, and Ferrando and Guglielmo return as themselves, find the contract and rage. They reveal the disguise, Despina is unmasked, the sisters beg forgiveness, and all are reconciled, praising the one who takes life as it comes, guided by reason.",
      ],
    },
  ],
  zauberfloete: [
    {
      title: "Act 1",
      where: "A wild, rocky place; then Sarastro's temple",
      paras: [
        "The overture opens and is cut through at its centre by three solemn chords. Prince Tamino, chased by a serpent, faints; three Ladies of the Queen of the Night kill it. The bird-catcher Papageno arrives singing about himself (“Der Vogelfänger bin ich ja”), claims he killed the serpent, and the Ladies padlock his mouth for the lie. They show Tamino a portrait of the Queen's daughter Pamina, and he falls in love with it (“Dies Bildnis ist bezaubernd schön”).",
        "The Queen appears, grieving for Pamina, carried off by Sarastro, and promises her to Tamino if he rescues her (“O zittre nicht”). The Ladies take the padlock off Papageno, give Tamino a magic flute and Papageno a set of magic bells, and promise three Spirits to guide them.",
        "In Sarastro's realm Pamina is guarded by the Moor Monostatos. Papageno finds her, and he and Monostatos frighten each other off; he tells her a prince loves her, and together they sing of love between man and wife (“Bei Männern”).",
        "The Spirits lead Tamino to the temple, where a Speaker tells him Sarastro is no tyrant. His flute charms the animals, and Papageno's pipes answer it. Monostatos catches Pamina and Papageno, but the magic bells set his slaves dancing. Sarastro arrives; Pamina confesses she tried to escape from Monostatos, who is punished. Tamino and Pamina see each other for the first time, and are led away to be tested.",
      ],
    },
    {
      title: "Act 2",
      where: "Sarastro's temple and its grounds",
      paras: [
        "The priests assemble to a solemn march and agree that Tamino may undergo the trials; Sarastro asks Isis and Osiris to guide the young couple. Two priests warn Tamino and Papageno against women's wiles and bind them to silence. The Ladies tempt the two men to speak, and Tamino holds firm while Papageno chatters.",
        "Monostatos tries to steal a kiss from the sleeping Pamina. Her mother appears, gives her a dagger and demands that she kill Sarastro (“Der Hölle Rache”). Sarastro tells Pamina that in these halls there is no revenge (“In diesen heil'gen Hallen”).",
        "An old woman tells Papageno she is eighteen and has a sweetheart called Papageno, and vanishes. The Spirits bring food and give back the flute and bells. Tamino's flute calls Pamina, but bound to silence he will not answer her, and she believes he no longer loves her (“Ach, ich fühl's”). The priests rejoice that Tamino will soon be one of them, and the lovers say goodbye before the last trials, Sarastro promising they will meet again.",
        "Papageno wishes for a sweetheart (“Ein Mädchen oder Weibchen”); the old woman returns, turns into the young Papagena, and is taken from him. In despair Pamina thinks of death until the Spirits stop her. Tamino and Pamina pass through fire and water together, protected by the flute. Papageno, about to hang himself for loneliness, remembers his bells, and Papagena returns (“Pa-pa-pa”). The Queen, her Ladies and Monostatos storm the temple and are cast into the night, and the sun rises on Sarastro's realm.",
      ],
    },
  ],

  barbiere: [
    {
      title: "Act 1",
      where: "Seville: a square, then Doctor Bartolo's house",
      paras: [
        "After the overture, at dawn, Count Almaviva serenades Rosina under the window of her guardian, old Doctor Bartolo, with hired musicians, and gets no answer (“Ecco, ridente in cielo”). Figaro, the barber and fixer of the town, arrives singing of his busy life (“Largo al factotum”). The Count sings again, as ‘Lindoro’, a poor student, so that Rosina will love him for himself, and she answers from the window. For gold, Figaro plans the Count's way into the house: as a drunken soldier billeted there.",
        "Indoors, Rosina is determined to have her Lindoro (“Una voce poco fa”). The music master Basilio warns Bartolo that the Count is in town and advises slander to drive him off (“La calunnia”). Figaro tells Rosina that Lindoro loves her; she has already written him a letter. Bartolo, noticing ink on her finger and a sheet of paper missing, tells her a doctor of his standing is not so easily fooled.",
        "The Count bursts in as the drunken soldier, demands a billet and slips Rosina a note. In the uproar the police arrive to arrest him; he quietly shows the officer who he is, and everyone is left stunned.",
      ],
    },
    {
      title: "Act 2",
      where: "Doctor Bartolo's house",
      paras: [
        "The Count returns as ‘Don Alonso’, a music teacher sent in place of a sick Basilio, and gives Rosina her singing lesson under Bartolo's nose, the lovers whispering while Bartolo dozes. Bartolo sings an old-fashioned song of his own, and Figaro arrives to shave him, stealing the key to the balcony.",
        "When the real Basilio appears, a purse and everyone's insistence persuade him he has a fever and should go to bed. Bartolo overhears the lovers and throws everyone out. The maid Berta sings of the madness of love.",
        "Bartolo shows Rosina her own letter and convinces her Lindoro is only a go-between for the Count; hurt, she agrees to marry Bartolo at once. A storm passes.",
        "The Count and Figaro climb in by the balcony. The Count reveals who he is and Rosina is overjoyed, but the ladder has been taken away. The notary Bartolo sent for marries the Count and Rosina instead, with a bribed Basilio as witness. Bartolo arrives too late; the Count tells him to give up (in an aria often cut), and Bartolo consoles himself with the dowry.",
      ],
    },
  ],

  elisir: [
    {
      title: "Act 1",
      where: "A village in the Basque country",
      paras: [
        "After a short prelude, the harvesters rest in the shade. The shy villager Nemorino adores the rich and clever Adina (“Quanto è bella”), who laughs as she reads her farmhands the tale of Tristan and the love potion (“Della crudele Isotta”). The swaggering Sergeant Belcore marches in with his soldiers and proposes to Adina on the spot. Alone with Nemorino, she tells him plainly that she is as fickle as the breeze; he answers that he is as constant as a river to the sea.",
        "The travelling quack Doctor Dulcamara arrives selling a cure for everything (“Udite, udite, o rustici”). Nemorino asks for Isolde's love potion and is sold a bottle of Bordeaux, which will work, he is told, in a day; he drinks it at once.",
        "Tipsy and sure of himself, Nemorino ignores Adina, who is stung. When Belcore proposes again, she agrees to marry him in six days, and Nemorino laughs. Then orders call the soldiers away the next morning, and Adina agrees to marry Belcore that very day. Nemorino begs her to wait one more day and calls desperately for the doctor.",
      ],
    },
    {
      title: "Act 2",
      where: "Adina's farm, at the wedding feast",
      paras: [
        "At the wedding feast Belcore toasts love and wine, and Dulcamara and Adina sing a barcarolle for the guests. The notary arrives, but Adina keeps finding reasons not to sign. Nemorino begs Dulcamara for a stronger dose and has no money; to pay for it he enlists in Belcore's regiment for twenty scudi (“Venti scudi”).",
        "Giannetta tells the village girls that Nemorino's rich uncle has died and left him everything. They crowd round him; he, not knowing, thinks the elixir is working, and Adina is jealous. Dulcamara tells Adina that Nemorino sold his freedom for her, and she understands what she feels. Nemorino has seen a tear on her cheek and knows she loves him (“Una furtiva lagrima”).",
        "Adina buys back his enlistment papers (“Prendi, per me sei libero”) and confesses her love. Belcore shrugs off the loss; the lovers learn of the inheritance, and Dulcamara sells out his stock to a village convinced the elixir made Nemorino rich and loved.",
      ],
    },
  ],

  rigoletto: [
    {
      title: "Act 1",
      where: "Mantua, in the sixteenth century: the Duke's palace, then a street at night",
      paras: [
        "A brief, dark prelude sounds the curse. At a ball the Duke of Mantua boasts that one woman is as good as another (“Questa o quella”) and courts Countess Ceprano under her husband's nose, while his hunchbacked jester Rigoletto mocks the Count; the courtiers plan revenge on the jester. Count Monterone bursts in to accuse the Duke of seducing his daughter. Rigoletto mocks him, the Duke has him arrested, and Monterone curses them both.",
        "On his way home, troubled by the curse, Rigoletto meets the assassin Sparafucile, who offers his services. Alone, he compares the two of them, one killing with a blade, the other with his tongue (“Pari siamo”). At home he embraces his daughter Gilda, whom he keeps hidden from the world, will not tell her his name or their past, and orders her nurse to guard her.",
        "The Duke, disguised as a poor student, ‘Gualtier Maldè’, has been watching Gilda at church; he slips into the courtyard and declares his love, and she dreams of his name after he has gone (“Caro nome”). The courtiers, believing Gilda to be Rigoletto's mistress, trick him, blindfolded, into holding the ladder while they carry her off. Too late, he remembers the curse.",
      ],
    },
    {
      title: "Act 2",
      where: "The Duke's palace",
      paras: [
        "The Duke, who went back and found the house empty, mourns Gilda's abduction (“Parmi veder le lagrime”). The courtiers tell him how they carried off ‘Rigoletto's mistress’, and that she is here in the palace; he hurries to her.",
        "Rigoletto searches for his daughter among the laughing courtiers, then turns on them in fury and begs (“Cortigiani, vil razza dannata”). Gilda runs out and, alone with her father, tells him how she was courted and deceived (“Tutte le feste al tempio”). As Monterone is led past to prison, Rigoletto swears vengeance on the Duke (“Sì, vendetta”), while Gilda begs mercy for the man she still loves.",
      ],
    },
    {
      title: "Act 3",
      where: "Sparafucile's inn by the river",
      paras: [
        "Outside the inn, Gilda still loves the Duke; her father will show her the truth. Inside, the Duke sings that women are fickle (“La donna è mobile”) and flirts with Sparafucile's sister Maddalena, while Gilda watches heartbroken and Rigoletto promises revenge (“Bella figlia dell'amore”). Rigoletto sends Gilda off to Verona dressed as a man and pays Sparafucile to kill the Duke, who takes a room for the night.",
        "A storm breaks. Maddalena begs her brother to spare the handsome stranger, and Sparafucile agrees to kill whoever next comes to the door instead. Gilda, overhearing, knocks, and is stabbed.",
        "Rigoletto collects the sack with the body and gloats, until he hears the Duke singing in the distance. He opens the sack to find his dying daughter, who asks his forgiveness. The curse is fulfilled.",
      ],
    },
  ],

  traviata: [
    {
      title: "Act 1",
      where: "Paris: a party at Violetta's house",
      paras: [
        "A quiet prelude in high strings foretells Violetta's illness, then sings the melody of her later plea, “Amami, Alfredo”. Violetta Valéry, a celebrated courtesan, is giving a party, though she has been ill. Gastone introduces Alfredo Germont, who called every day while she was ill. Alfredo leads the drinking song (“Libiamo”), and Violetta answers.",
        "Violetta feels faint, and the guests go in to dance. Alone with her, Alfredo declares a year's love (“Un dì, felice”). She laughs it off but gives him a flower to bring back when it has faded. At dawn the guests take their leave.",
        "Alone, she wonders whether this could be real love (“Ah, fors'è lui”), then tells herself she must stay free and live for pleasure (“Sempre libera”), while Alfredo's voice is heard from beneath the balcony.",
      ],
    },
    {
      title: "Act 2",
      where: "A country house near Paris; then a party at Flora's",
      paras: [
        "Months later Violetta and Alfredo live happily in the country (“De' miei bollenti spiriti”). From her maid Annina, Alfredo discovers she has been selling her possessions to pay for it, and he rushes to Paris to raise money. A letter brings Violetta an invitation to Flora's party that night, and a visitor is announced.",
        "It is Alfredo's father, Giorgio Germont. He demands that she give Alfredo up: the scandal threatens his daughter's marriage. After a long struggle she agrees (“Dite alla giovine”). She writes Alfredo a letter of farewell and, as he returns, begs him to love her as she loves him (“Amami, Alfredo”), then leaves. Alfredo reads the letter; his father's attempt to comfort him with memories of home (“Di Provenza il mar”) falls on deaf ears, and seeing Flora's invitation he goes after her.",
        "At Flora's party, guests dressed as gypsies and matadors entertain the company. Violetta arrives with her old protector, Baron Douphol. Alfredo wins heavily from the Baron at cards. Violetta begs Alfredo to leave and, to protect him, says she loves the Baron; before everyone, Alfredo throws his winnings at her as payment. His father arrives and rebukes him, and the Baron challenges him to a duel.",
      ],
    },
    {
      title: "Act 3",
      where: "Violetta's bedroom, a month later",
      paras: [
        "The prelude to Act 1 returns, sadder still. Violetta is dying of consumption and nearly penniless; the doctor tells Annina she has only hours to live. Violetta rereads a letter from Germont: the Baron was wounded in the duel, Alfredo knows the truth and is on his way. She bids farewell to her past (“Addio, del passato”), while outside the Carnival crowd passes in the street.",
        "Alfredo arrives and they dream of leaving Paris together (“Parigi, o cara”), but she is too weak even to dress, and cries out against dying so young. Germont comes to ask her forgiveness. She gives Alfredo a portrait of herself, feels a sudden rush of strength, and dies.",
      ],
    },
  ],

  carmen: [
    {
      title: "Act 1",
      where: "A square in Seville, by the cigarette factory",
      paras: [
        "The prelude brings the bullfight music and the Toreador tune, then, darkly, the motif of fate. Soldiers lounge in the square; Micaëla, a girl from his village, comes looking for the corporal Don José, and leaves before he arrives with the changing of the guard.",
        "The cigarette girls come out on their break, and the young men wait for Carmen. She sings that love is a wild bird (Habanera), then throws a flower at José, the one man not watching her. Micaëla returns with a letter and a kiss from José's mother, and he resolves to marry Micaëla.",
        "A fight breaks out in the factory: Carmen has slashed another girl. Brought out under arrest, she answers the officer Zuniga only with a song, and José is left to guard her. She bewitches him with a song about a tavern by the ramparts (Seguidilla); on the way to prison she pushes him over and escapes, and José is arrested.",
      ],
    },
    {
      title: "Act 2",
      where: "Lillas Pastia's tavern, two months later",
      paras: [
        "An entr'acte plays the tune of José's song. Carmen and her friends Frasquita and Mercédès dance for the officers. The crowd hails the bullfighter Escamillo, who sings of the ring (Toreador song) and is taken with Carmen; she puts him off. The smugglers Dancaïre and Remendado want the women for a job, but Carmen is waiting for José, just released from prison, whose song is heard as he approaches.",
        "Carmen dances for José; when the bugle calls him back to barracks she mocks him for leaving. He shows her the flower she threw, kept all through his imprisonment (Flower song). When his officer, Zuniga, returns and orders him out, José draws his sword, and now he has no choice but to join the smugglers in the mountains.",
      ],
    },
    {
      title: "Act 3",
      where: "The smugglers' camp in the mountains",
      paras: [
        "After a quiet entr'acte for flute and harp, the smugglers make camp at night. Carmen is tiring of José's jealousy. Telling fortunes with her friends, she turns up death again and again. The women go off to charm the customs men while the smugglers get the goods through.",
        "Micaëla, frightened but determined, has come to find José (“Je dis que rien ne m'épouvante”). Escamillo arrives looking for Carmen and fights José until the others part them; he invites everyone to his next bullfight. Micaëla is found and tells José his mother is dying; he goes with her, warning Carmen they will meet again, as Escamillo's song fades in the distance.",
      ],
    },
    {
      title: "Act 4",
      where: "Outside the bullring in Seville",
      paras: [
        "After a fiery entr'acte, the crowd gathers outside the bullring and cheers the procession of the bullfighters. Carmen arrives on Escamillo's arm, and they pledge their love before he goes in (“Si tu m'aimes, Carmen”). Her friends warn her José is near; she stays to face him.",
        "José begs her to come back to him. She tells him it is over, and throws away the ring he gave her. As the crowd inside acclaims Escamillo's victory, José stabs her, and gives himself up.",
      ],
    },
  ],

  boheme: [
    {
      title: "Act 1",
      where: "A garret in the Latin Quarter of Paris, Christmas Eve",
      paras: [
        "The poet Rodolfo and the painter Marcello, freezing, burn Rodolfo's play to keep warm, and the philosopher Colline joins them. The musician Schaunard arrives with food, wood and money, and they plan Christmas Eve at the Café Momus. The landlord Benoît comes for the rent; they ply him with wine, get him boasting of his flirtations, and throw him out in mock outrage. The friends set off, Rodolfo staying behind to finish an article.",
        "There is a knock: their neighbour Mimì, whose candle has blown out on the stairs. She drops her key and they search for it in the dark; their hands meet (“Che gelida manina”). She tells him about her simple life embroidering flowers (“Sì, mi chiamano Mimì”). His friends call up from the street, and Rodolfo and Mimì, in love (“O soave fanciulla”), go out to join them.",
      ],
    },
    {
      title: "Act 2",
      where: "The Latin Quarter and the Café Momus",
      paras: [
        "In the Christmas Eve crowd, among the street sellers and the toy-seller Parpignol, Rodolfo buys Mimì a bonnet and introduces her to his friends at the Café Momus. Marcello's old love Musetta sweeps in with her rich, elderly admirer Alcindoro and sets out to win Marcello back with a waltz about how men look at her (“Quando m'en vo”).",
        "She sends Alcindoro off to buy her new shoes and falls into Marcello's arms. A military band passes; the friends march off behind it with the crowd, leaving Alcindoro the bill.",
      ],
    },
    {
      title: "Act 3",
      where: "A toll gate on the edge of Paris, February",
      paras: [
        "At dawn customs men let in the farm women, while from the tavern Musetta's voice is heard among the revellers. Mimì, coughing, finds Marcello, who lives at the inn with Musetta, and tells him Rodolfo's jealousy is tearing them apart.",
        "Rodolfo comes out and tells Marcello he wants to leave her, blaming her flirting; pressed, he admits the real reason: Mimì is gravely ill and he is too poor to care for her. Mimì, hidden, hears everything, and her coughing gives her away. Hearing Musetta laugh inside, Marcello runs back into the tavern.",
        "Mimì says goodbye without bitterness (“Donde lieta uscì”): he may keep the bonnet. She and Rodolfo agree to stay together until the spring, while Marcello and Musetta quarrel and part.",
      ],
    },
    {
      title: "Act 4",
      where: "The garret, months later",
      paras: [
        "Rodolfo and Marcello, both apart from their lovers, try to work and cannot. Colline and Schaunard bring a meagre supper, and the four clown about with a mock dance and duel, until Musetta rushes in: Mimì is with her, too weak to climb the stairs, and wanted to see Rodolfo before she dies. Musetta gives Marcello her earrings to sell for medicine and goes with him to fetch a muff, and Colline goes to pawn his coat (“Vecchia zimarra”).",
        "Alone, Mimì and Rodolfo remember the night they met. The others return; Musetta gives Mimì the muff and prays. Mimì drifts away, and the friends realise she has died before Rodolfo does.",
      ],
    },
  ],

  tosca: [
    {
      title: "Act 1",
      where: "The church of Sant'Andrea della Valle, Rome, June 1800",
      paras: [
        "Three crashing chords, the motif of the police chief Scarpia, and the curtain rises. Cesare Angelotti, an escaped political prisoner, finds the key his sister left and hides in her family chapel. The Sacristan potters in, grumbling. The painter Mario Cavaradossi, at work on a Magdalene, compares her to his lover, the singer Floria Tosca (“Recondita armonia”). Angelotti reveals himself, and Cavaradossi promises to help him, until Tosca's voice calls from outside.",
        "Tosca arrives, jealous of the blonde Magdalene, and arranges to meet Cavaradossi that night. When she has gone, a cannon announces the escape, and Cavaradossi leads Angelotti off to hide at his villa.",
        "The Sacristan brings news of a victory over Napoleon, and the choirboys celebrate until Scarpia arrives on Angelotti's trail and finds a fan left behind. Tosca returns; Scarpia uses the fan to stir her jealousy, and she leaves in tears. As the Te Deum begins, he gloats that he will have both the painter and Tosca.",
      ],
    },
    {
      title: "Act 2",
      where: "Scarpia's rooms in the Palazzo Farnese",
      paras: [
        "At supper Scarpia savours the pleasure of taking by force. Cavaradossi is brought in and questioned while Tosca's voice is heard in a cantata below. Tosca arrives; Cavaradossi is taken to the next room and tortured within her hearing until she reveals Angelotti's hiding place. News comes that Napoleon has won at Marengo after all; Cavaradossi cries out in triumph and is dragged away to be shot.",
        "Scarpia names his price for Cavaradossi's life: Tosca herself. She asks why God has abandoned her, who lived for art and love (“Vissi d'arte”). Word comes that Angelotti has killed himself; Tosca agrees. Scarpia orders a ‘mock’ execution and writes a safe-conduct; as he comes to claim her, she stabs him with a knife from the table.",
      ],
    },
    {
      title: "Act 3",
      where: "The roof of the Castel Sant'Angelo, before dawn",
      paras: [
        "Dawn over Rome: a shepherd boy sings in the distance and church bells ring. Cavaradossi, waiting to die, is allowed to write a last letter and remembers nights with Tosca (“E lucevan le stelle”). She runs in with the safe-conduct, tells him how she got it, and explains that the execution will be a pretence: he must fall convincingly.",
        "The soldiers fire. Tosca finds that the bullets were real and Cavaradossi is dead. Scarpia's murder has been discovered, his men come running, and Tosca leaps from the battlements.",
      ],
    },
  ],

  butterfly: [
    {
      title: "Act 1",
      where: "A house on a hill above Nagasaki, around 1900",
      paras: [
        "A busy string fugue leads straight in. The American naval lieutenant Pinkerton has leased a house, and a fifteen-year-old bride, through the marriage broker Goro, who shows him round and introduces the maid, Suzuki. The consul Sharpless arrives; Pinkerton toasts the Yankee who takes his pleasure wherever he roams (“Dovunque al mondo”), while Sharpless warns him the girl takes it seriously. Pinkerton drinks to the day he will marry ‘a real American wife’.",
        "Cio-Cio-San, Butterfly, arrives with her friends, the happiest girl in Japan, and tells Sharpless about her family, once rich, and her age. Her relatives gossip about the groom. She shows Pinkerton her few treasures, among them the dagger her father used to kill himself, and tells him she has secretly taken up his religion. The marriage is signed before the commissioner; Sharpless leaves with a last warning, and the guests drink a toast.",
        "Her uncle, a Buddhist priest, bursts in and curses her for abandoning her gods, and her family disowns her. Pinkerton sends them away and comforts her; as night falls, with Suzuki heard at her prayers, they sing of their love (“Viene la sera”).",
      ],
    },
    {
      title: "Act 2",
      where: "Butterfly's house, three years later",
      paras: [
        "Pinkerton has not come back, and the money is running out. Suzuki prays and doubts he will return; Butterfly is sure that one fine day his ship will appear (“Un bel dì vedremo”).",
        "Sharpless brings a letter from Pinkerton but cannot bring himself to read it all. Goro brings the rich Prince Yamadori to court her, and she refuses him: she is an American wife. When Sharpless gently suggests Pinkerton may never return, she shows him her son (“Che tua madre”).",
        "A cannon announces Pinkerton's ship. Butterfly and Suzuki fill the house with flowers (“Scuoti quella fronda di ciliegio”), and she dresses in her wedding robe. As a wordless chorus hums in the distance, she keeps watch all night while Suzuki and the child fall asleep.",
      ],
    },
    {
      title: "Act 3",
      where: "Butterfly's house, at dawn (in the two-act version, the second part of Act 2)",
      paras: [
        "An orchestral intermezzo passes the night; dawn breaks over the harbour with distant sailors' voices. Suzuki persuades Butterfly to rest, and she carries the sleeping child upstairs, singing him a lullaby.",
        "Pinkerton arrives with Sharpless, and Suzuki learns of the American wife waiting in the garden. Overcome with remorse, Pinkerton cannot face Butterfly (“Addio, fiorito asil”) and leaves.",
        "Butterfly comes down, sees Kate Pinkerton and understands. Kate offers to bring up the boy, and Butterfly agrees, if Pinkerton comes for him himself in half an hour. Alone, she takes her father's dagger, says goodbye to her son (“Tu, piccolo iddio”), blindfolds him, and kills herself as Pinkerton is heard calling her name.",
      ],
    },
  ],
  schicchi: [
    {
      title: "The opera",
      where: "Florence, 1299: the bedroom of Buoso Donati, who has just died. In one act",
      paras: [
        "Buoso's relatives kneel weeping round his bed, until they hear a rumour that he has left everything to the monks. They hunt for the will, and the young Rinuccio finds it; before handing it over he makes his aunt Zita promise he can marry Lauretta, daughter of Gianni Schicchi, and sends for her father. The will confirms the worst.",
        "The relatives despair and turn on old Simone. Rinuccio says only Schicchi can save them; the relatives sneer at the newcomer from the country, and Rinuccio praises Florence and its new men (“Firenze è come un albero fiorito”). Schicchi arrives with Lauretta and, insulted by Zita, refuses to help; the lovers fear they will be parted, until Lauretta begs her father (“O mio babbino caro”). He reads the will while the lovers sigh.",
        "Schicchi has an idea. He sends Lauretta out to the terrace to feed the bird, so that she knows nothing of the fraud. Nobody yet knows Buoso is dead: Schicchi has the body hidden, climbs into the bed and, imitating the dead man's voice, fools the doctor. Then he explains his plan (“Si corre dal notaio”): he will be Buoso, and dictate a new will.",
        "The relatives squabble over the mule, the house and the mills of Signa, and each secretly bribes Schicchi for them. The women dress him in Buoso's nightclothes, and he warns them that forging a will means exile and the loss of a hand, for all of them (“Addio, Firenze”).",
        "Before the notary Schicchi dictates the new will and leaves the mule, the house and the mills to ‘my devoted friend Gianni Schicchi’. The relatives can say nothing. When the notary has gone he drives them out, looting as they go, and Lauretta and Rinuccio look out over Florence together. Schicchi asks the audience to forgive him, given the happy ending.",
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
            {/* the character's name alone: "…'s story" did not fit a phone's half of the switch */}
            {name}
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
