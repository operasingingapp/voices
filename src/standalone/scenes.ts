/**
 * Every opera, number by number: each aria, duet, ensemble, finale and the scenes between them, in the order of the
 * score, with who sings (ids from the cast in operas.ts; smaller parts not in that cast are named in the text) and
 * what happens. A character's own story is every entry they sing in. Written for this app.
 */
export interface Scene {
  act: string;
  title: string;
  kind: string;
  who: string[];
  what: string;
}

const A = (act: string, list: [string, string, string[], string][]): Scene[] => list.map(([title, kind, who, what]) => ({ act, title, kind, who, what }));

export const SCENES: Record<string, Scene[]> = {
  figaro: [
    ...A("Act 1", [
      ["Cinque… dieci… venti…", "Duettino", ["figaro", "susanna"], "Figaro measures the room for the marriage bed while Susanna tries on her bridal hat."],
      ["Se a caso madama", "Duettino", ["figaro", "susanna"], "Susanna explains why the Count has given them a room so close to his own: he wants her."],
      ["Bravo, signor padrone… Se vuol ballare", "Recitative and cavatina", ["figaro"], "Alone, Figaro vows that if the Count wants to dance, he will call the tune."],
      ["La vendetta", "Aria", ["bartolo"], "Bartolo agrees to help Marcellina hold Figaro to his promise of marriage, and relishes revenge by law."],
      ["Via resti servita", "Duettino", ["susanna"], "Susanna and Marcellina trade elaborately polite insults in the doorway."],
      ["Non so più cosa son, cosa faccio", "Aria", ["cherubino", "susanna"], "Cherubino, dismissed by the Count, begs Susanna for help and pours out his confusion about love."],
      ["Cosa sento!", "Trio", ["count", "susanna"], "The Count, hidden, hears Basilio's gossip about Cherubino and the Countess, bursts out, and finds the page hiding in the armchair."],
      ["Giovani liete", "Chorus", ["figaro", "susanna", "count", "cherubino"], "The villagers thank the Count for giving up his old right over his servants' brides; he puts the wedding off and sends Cherubino to the army."],
      ["Non più andrai", "Aria", ["figaro", "cherubino"], "Figaro teases Cherubino about the end of his life as a butterfly in the boudoir and the glories of army life."],
    ]),
    ...A("Act 2", [
      ["Porgi, amor", "Cavatina", ["countess"], "Alone, the Countess asks love to give her back her husband's heart, or let her die."],
      ["Figaro's plan", "Recitative", ["countess", "susanna", "figaro"], "Figaro explains: an anonymous note to make the Count jealous, and Cherubino dressed as Susanna to keep her rendezvous."],
      ["Voi che sapete", "Arietta", ["cherubino", "countess", "susanna"], "Cherubino sings the Countess the love song he has written for her."],
      ["Venite, inginocchiatevi", "Aria", ["susanna", "cherubino", "countess"], "Susanna dresses Cherubino as a girl, and admires the result."],
      ["Susanna, or via, sortite", "Trio", ["count", "countess", "susanna"], "The Count, hearing a noise in the closet, orders ‘Susanna’ to come out; the Countess forbids it, and Susanna watches from hiding."],
      ["Aprite, presto, aprite", "Duettino", ["susanna", "cherubino"], "While the Count fetches tools, Susanna takes Cherubino's place in the closet, and he jumps from the window."],
      ["Esci omai, garzon malnato", "Finale", ["count", "countess", "susanna", "figaro", "bartolo"], "The Countess confesses it is Cherubino inside; out steps Susanna, and the Count must beg pardon. Antonio complains of a man jumping onto his flowers, Figaro claims it was him and bluffs through Cherubino's dropped commission, and Marcellina, Bartolo and Basilio arrive with her claim."],
    ]),
    ...A("Act 3", [
      ["Crudel! perché finora", "Duet", ["count", "susanna"], "Sent by the Countess, Susanna promises the Count a meeting in the garden, muddling her yeses and noes."],
      ["Hai già vinta la causa!… Vedrò mentr'io sospiro", "Recitative and aria", ["count"], "Overhearing Susanna tell Figaro ‘the case is won’, the Count swears his servant will not have what he cannot."],
      ["Riconosci in questo amplesso", "Sextet", ["figaro", "bartolo", "count", "susanna"], "A birthmark proves Figaro is Marcellina and Bartolo's lost son. Susanna arrives, sees him embracing Marcellina, slaps him, then learns the truth; the Count fumes."],
      ["E Susanna non vien!… Dove sono", "Recitative and aria", ["countess"], "Waiting for Susanna, the Countess remembers the happy days of her marriage and hopes her constancy may yet change her husband's heart."],
      ["Sull'aria", "Duettino", ["countess", "susanna"], "The Countess dictates, and Susanna writes, the note that sets the time and place of the garden meeting, sealed with a pin."],
      ["Ricevete, o padroncina", "Chorus", ["countess", "susanna", "cherubino", "count"], "Village girls bring the Countess flowers; Cherubino, among them in a dress, is unmasked, and Barbarina asks the Count for him as her husband."],
      ["Ecco la marcia", "Finale", ["count", "countess", "susanna", "figaro", "bartolo"], "The double wedding of Figaro and Susanna, Marcellina and Bartolo. Susanna slips the note to the Count, who pricks his finger on the pin."],
    ]),
    ...A("Act 4", [
      ["L'ho perduta, me meschina", "Cavatina", ["figaro"], "Barbarina has lost the pin she was to return to Susanna; from her, Figaro learns of the rendezvous and thinks himself betrayed."],
      ["Il capro e la capretta", "Aria · often cut", [], "Marcellina, now on Susanna's side, sings that only humans mistreat their mates."],
      ["In quegli anni", "Aria · often cut", [], "Basilio explains how a donkey's skin once saved him: give way to the powerful."],
      ["Tutto è disposto… Aprite un po' quegli occhi", "Recitative and aria", ["figaro"], "Hiding in the dark, Figaro warns all men to open their eyes to women."],
      ["Giunse alfin il momento… Deh vieni, non tardar", "Recitative and aria", ["susanna"], "In the Countess's clothes, knowing Figaro is listening, Susanna sings of her longing for her lover."],
      ["Pian pianin le andrò più presso", "Finale", ["cherubino", "countess", "count", "figaro", "susanna", "bartolo"], "In the dark Cherubino flirts with the disguised Countess, the Count woos his own wife, and Figaro courts Susanna as ‘the Countess’ until they make up. The Count calls everyone and refuses pardon, until his true wife appears; he kneels (“Contessa, perdono”), she forgives, and all celebrate."],
    ]),
  ],

  giovanni: [
    ...A("Act 1", [
      ["Notte e giorno faticar", "Introduction", ["leporello", "anna", "dongiovanni"], "Leporello grumbles on watch; Giovanni flees Anna's room; the Commendatore challenges him and is killed."],
      ["Fuggi, crudele, fuggi", "Recitative and duet", ["anna", "ottavio"], "Anna finds her father dead, and she and Ottavio swear vengeance."],
      ["Ah, chi mi dice mai", "Aria", ["elvira", "dongiovanni", "leporello"], "Elvira searches for the man who left her; Giovanni comes to console the stranger, and finds it is her."],
      ["Madamina, il catalogo è questo", "Aria", ["leporello", "elvira"], "Leporello shows Elvira the catalogue of his master's conquests: in Spain alone, a thousand and three."],
      ["Giovinette che fate all'amore", "Duet and chorus", ["zerlina"], "Zerlina, Masetto and the villagers celebrate the wedding."],
      ["Ho capito, signor sì", "Aria", ["dongiovanni", "zerlina"], "Masetto, sent away by Giovanni, sees what is up and goes, furious."],
      ["Là ci darem la mano", "Duettino", ["dongiovanni", "zerlina"], "Giovanni persuades Zerlina to come away with him."],
      ["Ah, fuggi il traditor", "Aria", ["elvira", "zerlina", "dongiovanni"], "Elvira interrupts and warns Zerlina."],
      ["Non ti fidar, o misera", "Quartet", ["elvira", "anna", "ottavio", "dongiovanni"], "Elvira warns Anna and Ottavio; Giovanni says she is mad."],
      ["Don Ottavio, son morta!… Or sai chi l'onore", "Recitative and aria", ["anna", "ottavio"], "Anna recognises Giovanni's voice as her attacker's, tells Ottavio about that night, and demands vengeance."],
      ["Dalla sua pace", "Aria · added for Vienna, 1788", ["ottavio"], "Ottavio: her peace is his peace."],
      ["Fin ch'han dal vino", "Aria", ["dongiovanni"], "Giovanni orders a party, wine and dancing, to add ten more to his list."],
      ["Batti, batti, o bel Masetto", "Aria", ["zerlina"], "Zerlina invites Masetto to beat her, and wins him round."],
      ["Presto presto pria ch'ei venga… Protegga il giusto cielo", "Finale", ["dongiovanni", "leporello", "anna", "elvira", "zerlina", "ottavio"], "Three masked guests pray before the party; three orchestras play at once; Giovanni drags Zerlina off and she screams; he blames Leporello; Anna, Elvira and Ottavio unmask him, but he escapes."],
    ]),
    ...A("Act 2", [
      ["Eh via, buffone", "Duet", ["dongiovanni", "leporello"], "Leporello wants to quit; a purse changes his mind."],
      ["Ah, taci, ingiusto core", "Trio", ["elvira", "dongiovanni", "leporello"], "Elvira at her window; Giovanni, in Leporello's cloak, makes Leporello mime his master's love, and she comes down."],
      ["Deh, vieni alla finestra", "Canzonetta", ["dongiovanni"], "Giovanni serenades Elvira's maid with a mandolin."],
      ["Metà di voi qua vadano", "Aria", ["dongiovanni"], "As ‘Leporello’, Giovanni sends Masetto's armed friends off in all directions, then beats Masetto."],
      ["Vedrai, carino", "Aria", ["zerlina"], "Zerlina comforts Masetto with a remedy of her own."],
      ["Sola, sola in buio loco", "Sextet", ["elvira", "leporello", "ottavio", "anna", "zerlina"], "Leporello, still disguised, is cornered in the dark courtyard; all think they have caught Giovanni, and he unmasks."],
      ["Ah, pietà, signori miei", "Aria", ["leporello"], "Leporello pleads for mercy and slips away."],
      ["Il mio tesoro", "Aria", ["ottavio"], "Ottavio asks the others to comfort Anna while he brings Giovanni to justice."],
      ["Per queste tue manine", "Duet · added for Vienna, rarely sung", ["zerlina", "leporello"], "Zerlina catches Leporello, ties him to a chair and threatens him with a razor; he escapes."],
      ["In quali eccessi… Mi tradì", "Recitative and aria · added for Vienna", ["elvira"], "Betrayed again, Elvira still feels pity for Giovanni."],
      ["O statua gentilissima", "Duet", ["leporello", "dongiovanni"], "In the graveyard the Commendatore's statue speaks; Giovanni makes Leporello invite it to supper, and it nods."],
      ["Crudele?… Non mi dir", "Recitative and rondo", ["anna", "ottavio"], "Anna asks Ottavio to wait for her: she loves him, but must mourn."],
      ["Già la mensa è preparata", "Finale", ["dongiovanni", "leporello", "elvira", "anna", "zerlina", "ottavio"], "Supper with music (tunes from operas of the day, Figaro's “Non più andrai” among them); Elvira begs Giovanni to change; the statue arrives, demands repentance, is refused, and Giovanni is dragged to hell. The others find Leporello, plan their futures and sing the moral: so end all evildoers (this last scene was long left out in performance)."],
    ]),
  ],

  zauberfloete: [
    ...A("Act 1", [
      ["Zu Hilfe! Zu Hilfe!", "Introduction", ["tamino"], "Tamino, chased by a serpent, faints; three Ladies of the Queen kill it."],
      ["Der Vogelfänger bin ich ja", "Aria", ["papageno", "tamino"], "Papageno introduces himself, claims he killed the serpent, and has his mouth padlocked by the Ladies."],
      ["Dies Bildnis ist bezaubernd schön", "Aria", ["tamino"], "Tamino falls in love with Pamina's portrait."],
      ["O zittre nicht… Zum Leiden bin ich auserkoren", "Recitative and aria", ["queen", "tamino"], "The Queen grieves for her stolen daughter and promises her to Tamino."],
      ["Hm! hm! hm!", "Quintet", ["papageno", "tamino"], "The padlock comes off; Tamino gets the magic flute, Papageno the bells, and three Spirits to guide them."],
      ["Du feines Täubchen, nur herein", "Trio", ["pamina", "papageno"], "Monostatos threatens Pamina; Papageno appears, and each terrifies the other."],
      ["Bei Männern, welche Liebe fühlen", "Duet", ["pamina", "papageno"], "Pamina and Papageno sing of love between man and wife."],
      ["Zum Ziele führt dich diese Bahn", "Finale", ["tamino", "pamina", "papageno", "sarastro"], "The Spirits lead Tamino to the temple, where the Speaker tells him Sarastro is no tyrant; his flute charms animals. Papageno's bells set Monostatos's slaves dancing. Sarastro arrives; Pamina confesses she fled; Tamino and Pamina meet, and are taken to be tested."],
    ]),
    ...A("Act 2", [
      ["O Isis und Osiris", "March and aria with chorus", ["sarastro"], "The priests agree Tamino may be tested, and Sarastro asks the gods to guide the couple."],
      ["Bewahret euch vor Weibertücken", "Duet", ["tamino", "papageno"], "Two priests warn Tamino and Papageno against women's wiles and impose silence."],
      ["Wie? Wie? Wie?", "Quintet", ["tamino", "papageno"], "The Ladies tempt the two men to speak; Tamino holds firm."],
      ["Alles fühlt der Liebe Freuden", "Aria", ["pamina"], "Monostatos creeps up on the sleeping Pamina."],
      ["Der Hölle Rache kocht in meinem Herzen", "Aria", ["queen", "pamina"], "The Queen gives Pamina a dagger and demands that she kill Sarastro."],
      ["In diesen heil'gen Hallen", "Aria", ["sarastro", "pamina"], "Sarastro tells Pamina there is no vengeance in these halls."],
      ["Seid uns zum zweitenmal willkommen", "Trio", ["tamino", "papageno"], "The Spirits bring food and return the flute and bells. In the spoken scene around it an old woman tells Papageno she is eighteen and his sweetheart, and vanishes."],
      ["Ach, ich fühl's", "Aria", ["pamina", "tamino"], "Tamino will not speak to her, and Pamina believes his love is gone."],
      ["O Isis und Osiris, welche Wonne", "Chorus", [], "The priests rejoice that Tamino will soon be one of them."],
      ["Soll ich dich, Teurer, nicht mehr sehn?", "Trio", ["pamina", "tamino", "sarastro"], "Pamina and Tamino part before the final trials; Sarastro promises they will meet again."],
      ["Ein Mädchen oder Weibchen", "Aria", ["papageno"], "Papageno wishes for a sweetheart; an old woman becomes the young Papagena, and vanishes."],
      ["Bald prangt, den Morgen zu verkünden", "Finale", ["pamina", "tamino", "papageno", "queen", "sarastro"], "The Spirits stop Pamina's suicide. Tamino and Pamina pass through fire and water with the flute. Papageno, about to hang himself, rings his bells and finds Papagena (“Pa-pa-pa”). The Queen, her Ladies and Monostatos storm the temple and are cast into night; the sun rises."],
    ]),
  ],

  barbiere: [
    ...A("Act 1", [
      ["Piano, pianissimo… Ecco, ridente in cielo", "Introduction and cavatina", ["almaviva"], "At dawn the Count serenades Rosina with hired musicians, and gets no answer."],
      ["Largo al factotum", "Cavatina", ["figarob"], "Figaro, barber and fixer, the busiest man in Seville."],
      ["Se il mio nome saper voi bramate", "Canzone", ["almaviva", "rosina"], "The Count, as the poor student ‘Lindoro’, sings his name to Rosina, who answers from her window."],
      ["All'idea di quel metallo", "Duet", ["figarob", "almaviva"], "For gold, Figaro plans the Count's way into the house: disguised as a drunken soldier."],
      ["Una voce poco fa", "Cavatina", ["rosina"], "Rosina will have her Lindoro: sweet when let be, a viper when crossed."],
      ["La calunnia è un venticello", "Aria", ["basilio", "bartolob"], "Basilio advises slander to drive the Count out of town."],
      ["Dunque io son… tu non m'inganni?", "Duet", ["rosina", "figarob"], "Figaro tells Rosina Lindoro loves her; she has already written him a letter."],
      ["A un dottor della mia sorte", "Aria", ["bartolob", "rosina"], "Bartolo: a doctor of his standing is not so easily fooled. (Some performances use a later replacement aria, “Manca un foglio”.)"],
      ["Ehi, di casa… buona gente", "Finale", ["almaviva", "rosina", "bartolob", "basilio", "figarob"], "The ‘drunken soldier’ demands a billet and slips Rosina a note; the uproar brings the police, the Count quietly shows his rank, and everyone freezes in astonishment."],
    ]),
    ...A("Act 2", [
      ["Pace e gioia sia con voi", "Duet", ["almaviva", "bartolob"], "The Count returns as ‘Don Alonso’, a music teacher standing in for a sick Basilio."],
      ["Contro un cor che accende amore", "Aria (the lesson scene)", ["rosina", "almaviva", "bartolob"], "Rosina's singing lesson, with the lovers whispering under Bartolo's nose; Bartolo sings an old-fashioned song of his own."],
      ["Don Basilio!… Buona sera, mio signore", "Quintet", ["rosina", "almaviva", "figarob", "bartolob", "basilio"], "Basilio arrives; a purse and everyone's insistence persuade him he has a fever. Figaro shaves Bartolo, who overhears the lovers."],
      ["Il vecchiotto cerca moglie", "Aria", [], "The maid Berta on the madness of love."],
      ["Bartolo shows the letter", "Recitative", ["bartolob", "rosina"], "Bartolo convinces Rosina that Lindoro is only the Count's go-between; hurt, she agrees to marry Bartolo."],
      ["Temporale", "Storm", [], "A storm passes over the house."],
      ["Ah! qual colpo inaspettato!", "Trio", ["rosina", "almaviva", "figarob"], "The Count reveals who he is; the lovers' raptures delay Figaro's escape, and the ladder is gone."],
      ["Cessa di più resistere", "Recitative and aria", ["almaviva"], "The Count, now openly, tells Bartolo to give up (often cut)."],
      ["Di sì felice innesto", "Finaletto", ["almaviva", "rosina", "figarob", "bartolob", "basilio"], "The notary marries the Count and Rosina, with Basilio as witness; Bartolo keeps the dowry and all celebrate."],
    ]),
  ],

  elisir: [
    ...A("Act 1", [
      ["Bel conforto al mietitore… Quanto è bella", "Introduction and cavatina", ["nemorino", "adina"], "Harvest time; Nemorino watches Adina reading, and despairs of ever winning her."],
      ["Della crudele Isotta", "Cavatina", ["adina", "nemorino"], "Adina reads the tale of Tristan and the love potion, and laughs."],
      ["Come Paride vezzoso", "Cavatina", ["belcore", "adina", "nemorino"], "Sergeant Belcore arrives and proposes to Adina on the spot."],
      ["Chiedi all'aura lusinghiera", "Duet", ["adina", "nemorino"], "Adina tells Nemorino she is as fickle as the breeze; he says he is as constant as a river to the sea."],
      ["Udite, udite, o rustici", "Cavatina", ["dulcamara"], "Doctor Dulcamara sells his cure-all to the villagers."],
      ["Voglio dire, lo stupendo elisir", "Duet", ["nemorino", "dulcamara"], "Nemorino asks for Isolde's love potion and is sold a bottle of Bordeaux."],
      ["Esulti pur la barbara", "Duet", ["nemorino", "adina"], "Tipsy and sure of the potion, Nemorino ignores Adina, who is piqued."],
      ["In guerra ed in amore", "Trio", ["belcore", "adina", "nemorino"], "Adina agrees to marry Belcore in six days; Nemorino laughs."],
      ["Adina, credimi", "Finale", ["adina", "nemorino", "belcore", "dulcamara"], "Orders call the soldiers away; Adina agrees to marry Belcore that evening, and Nemorino begs her to wait one day."],
    ]),
    ...A("Act 2", [
      ["Io son ricco e tu sei bella", "Chorus and barcarolle", ["dulcamara", "adina"], "At the wedding feast Dulcamara and Adina perform a barcarolle; Adina delays signing."],
      ["Venti scudi", "Duet", ["nemorino", "belcore"], "Needing money for more elixir, Nemorino enlists in Belcore's regiment."],
      ["Saria possibile?", "Chorus", [], "Giannetta tells the girls that Nemorino's rich uncle has died and left him everything."],
      ["Dell'elisir mirabile", "Quartet", ["nemorino", "adina", "dulcamara"], "The girls fawn on Nemorino, who thinks it is the elixir; Adina is jealous."],
      ["Quanto amore! Ed io spietata!", "Duet", ["adina", "dulcamara"], "Dulcamara tells Adina what Nemorino has done for her, and she understands her heart."],
      ["Una furtiva lagrima", "Romanza", ["nemorino"], "Nemorino has seen a tear on Adina's cheek: she loves him."],
      ["Prendi, per me sei libero", "Aria", ["adina", "nemorino"], "Adina buys back his enlistment papers and confesses her love."],
      ["Ei corregge ogni difetto", "Finale", ["dulcamara", "adina", "nemorino", "belcore"], "Belcore shrugs off the loss, and the village buys up Dulcamara's elixir."],
    ]),
  ],

  rigoletto: [
    ...A("Act 1", [
      ["Della mia bella incognita… Questa o quella", "Scene and ballata", ["duke"], "At a ball, the Duke boasts that one woman is as good as another."],
      ["Partite? Crudele!", "Minuet and scene", ["duke", "rigoletto"], "The Duke courts Countess Ceprano while Rigoletto mocks her husband; the courtiers plot revenge on the jester."],
      ["Ch'io gli parli", "Scene", ["rigoletto", "duke"], "Count Monterone accuses the Duke of seducing his daughter; Rigoletto mocks him, the Duke has him arrested, and Monterone curses them both."],
      ["Quel vecchio maledivami!", "Duet", ["rigoletto"], "Rigoletto meets the assassin Sparafucile, who offers his services."],
      ["Pari siamo", "Monologue", ["rigoletto"], "Rigoletto: he kills with his tongue as Sparafucile does with a blade."],
      ["Figlia! Mio padre!", "Duet", ["rigoletto", "gilda"], "At home Rigoletto embraces Gilda, will not tell her his name or their past, and orders her nurse to guard her."],
      ["È il sol dell'anima", "Duet", ["duke", "gilda"], "The Duke, as the student ‘Gualtier Maldè’, slips into the courtyard and declares his love."],
      ["Gualtier Maldè… Caro nome", "Aria", ["gilda"], "Gilda dreams of the beloved name."],
      ["Zitti, zitti, moviamo a vendetta", "Finale", ["rigoletto", "gilda"], "The courtiers trick a blindfolded Rigoletto into holding the ladder while they carry Gilda off; too late he remembers the curse."],
    ]),
    ...A("Act 2", [
      ["Ella mi fu rapita!… Parmi veder le lagrime", "Scene and aria", ["duke"], "The Duke mourns Gilda's abduction, then learns she is in the palace and hurries to her."],
      ["Povero Rigoletto!… Cortigiani, vil razza dannata", "Scene and aria", ["rigoletto"], "Rigoletto searches for his daughter among the courtiers, rages, then begs."],
      ["Tutte le feste al tempio", "Duet", ["gilda", "rigoletto"], "Gilda tells her father how she was courted and deceived."],
      ["Sì, vendetta, tremenda vendetta", "Duet", ["rigoletto", "gilda"], "As Monterone is led to prison, Rigoletto swears vengeance; Gilda begs mercy for the Duke."],
    ]),
    ...A("Act 3", [
      ["E l'ami?", "Scene", ["rigoletto", "gilda"], "Outside Sparafucile's inn: Gilda still loves the Duke; her father will show her the truth."],
      ["La donna è mobile", "Canzone", ["duke"], "The Duke sings that women are fickle."],
      ["Bella figlia dell'amore", "Quartet", ["duke", "maddalena", "gilda", "rigoletto"], "The Duke woos Maddalena while Gilda watches heartbroken and Rigoletto promises revenge."],
      ["The bargain", "Scene", ["rigoletto", "gilda"], "Rigoletto sends Gilda to Verona dressed as a man and pays Sparafucile to kill the Duke."],
      ["Somiglia un Apollo", "Storm trio", ["maddalena", "gilda"], "Maddalena begs her brother to spare the stranger; he will kill whoever next comes to the door. Gilda, overhearing, knocks."],
      ["Della vendetta alfin giunge l'istante… V'ho ingannato", "Finale", ["rigoletto", "gilda", "duke"], "Rigoletto gloats over the sack, hears the Duke singing, and finds Gilda dying inside: the curse."],
    ]),
  ],

  traviata: [
    ...A("Act 1", [
      ["Dell'invito trascorsa è già l'ora", "Introduction", ["violetta", "alfredo"], "Violetta's party; Gastone introduces Alfredo, who called every day during her illness."],
      ["Libiamo ne' lieti calici", "Brindisi", ["alfredo", "violetta"], "Alfredo leads the drinking song; Violetta answers."],
      ["Un dì, felice, eterea", "Waltz and duet", ["alfredo", "violetta"], "Alfredo declares a year's love; Violetta laughs it off, but gives him a flower to return when it fades."],
      ["È strano!… Ah, fors'è lui… Sempre libera", "Scene and aria", ["violetta", "alfredo"], "Alone, she wonders if this is real love, then swears to stay free, while Alfredo's voice is heard outside."],
    ]),
    ...A("Act 2", [
      ["Lunge da lei… De' miei bollenti spiriti", "Scene and aria", ["alfredo"], "Months later, in the country, Alfredo is happy."],
      ["O mio rimorso!", "Cabaletta", ["alfredo"], "He learns Violetta is selling her things to pay for their life, and rushes to Paris."],
      ["Pura siccome un angelo… Dite alla giovine", "Duet", ["violetta", "germont"], "Germont demands Violetta give Alfredo up for his daughter's sake; she agrees."],
      ["Amami, Alfredo", "Scene", ["violetta", "alfredo"], "She writes her farewell, and before leaving begs Alfredo to love her as she loves him."],
      ["Di Provenza il mar, il suol", "Aria", ["germont", "alfredo"], "Germont tries to comfort Alfredo with memories of home; Alfredo sees Flora's invitation and resolves on revenge."],
      ["Noi siamo zingarelle… Di Madride noi siam mattadori", "Choruses", [], "At Flora's party, gypsies and matadors entertain the guests."],
      ["The card game", "Scene", ["alfredo", "violetta"], "Alfredo wins heavily at cards from Baron Douphol."],
      ["Invitato a qui seguirmi", "Duet", ["violetta", "alfredo"], "Violetta begs him to leave; to save him, she says she loves the Baron."],
      ["Ogni suo aver tal femmina… Alfredo, Alfredo, di questo core", "Finale", ["alfredo", "violetta", "germont"], "Alfredo throws his winnings at her as payment; Germont rebukes his son, and the Baron challenges him."],
    ]),
    ...A("Act 3", [
      ["Teneste la promessa… Addio, del passato", "Scene and aria", ["violetta"], "Dying, she rereads Germont's letter: Alfredo knows and is coming. She bids farewell to her past."],
      ["Parigi, o cara", "Duet", ["alfredo", "violetta"], "Alfredo returns; they dream of leaving Paris."],
      ["Gran Dio! morir sì giovane", "Duet", ["violetta", "alfredo"], "Too weak to dress, she cries out against dying so young."],
      ["Prendi, quest'è l'immagine", "Finale", ["violetta", "alfredo", "germont"], "Germont arrives to ask forgiveness; she gives Alfredo her portrait, feels a sudden strength, and dies."],
    ]),
  ],

  carmen: [
    ...A("Act 1", [
      ["Sur la place chacun passe", "Chorus and scene", ["micaela"], "Soldiers watch the square; Micaëla looks for Don José and leaves."],
      ["Avec la garde montante", "Children's chorus", ["jose"], "The guard changes; José arrives."],
      ["La cloche a sonné", "Chorus of the cigarette girls", [], "The girls come out on their break."],
      ["L'amour est un oiseau rebelle", "Habanera", ["carmen", "jose"], "Carmen: love is a wild bird. She throws her flower at José."],
      ["Parle-moi de ma mère", "Duet", ["micaela", "jose"], "Micaëla brings a letter and a kiss from his mother; José resolves to marry her."],
      ["Au secours!", "Chorus and scene", ["carmen", "jose"], "Carmen has slashed another girl; José arrests her, and she answers Zuniga with a song."],
      ["Près des remparts de Séville", "Seguidilla and duet", ["carmen", "jose"], "Carmen promises José love at Lillas Pastia's tavern if he lets her go."],
      ["Voici l'ordre; partez", "Finale", ["carmen", "jose"], "On the way to prison she pushes him over and escapes; José is arrested."],
    ]),
    ...A("Act 2", [
      ["Les tringles des sistres tintaient", "Gypsy song", ["carmen"], "Two months later, Carmen and her friends dance for the officers at the tavern."],
      ["Votre toast, je peux vous le rendre", "Toreador song", ["escamillo", "carmen"], "Escamillo sings of the ring and is taken with Carmen, who puts him off."],
      ["Nous avons en tête une affaire", "Quintet", ["carmen"], "The smugglers Dancaïre and Remendado want Carmen, Frasquita and Mercédès for a job; Carmen is waiting for José."],
      ["Halte-là! Dragon d'Alcala", "Song", ["jose"], "José, released, sings as he approaches."],
      ["Je vais danser en votre honneur… La fleur que tu m'avais jetée", "Duet and Flower song", ["carmen", "jose"], "Carmen dances for him; the bugle calls him back and she mocks him; he shows her the flower he kept."],
      ["Holà! Carmen! Holà!", "Finale", ["carmen", "jose"], "His officer Zuniga arrives, José draws on him, and must now join the smugglers in the mountains."],
    ]),
    ...A("Act 3", [
      ["Écoute, compagnon, écoute", "Sextet and chorus", ["carmen", "jose"], "The smugglers' camp at night; Carmen and José quarrel."],
      ["Mêlons! Coupons!… En vain pour éviter", "Card trio", ["carmen"], "Frasquita and Mercédès read happy fortunes; Carmen's cards show death, again and again."],
      ["Je dis que rien ne m'épouvante", "Aria", ["micaela"], "Micaëla, frightened but determined, has come to find José."],
      ["Je suis Escamillo", "Duet", ["escamillo", "jose"], "Escamillo comes for Carmen; he and José fight until the others part them."],
      ["Holà, holà, José!", "Finale", ["jose", "micaela", "carmen", "escamillo"], "Micaëla tells José his mother is dying; he goes, warning Carmen they will meet again."],
    ]),
    ...A("Act 4", [
      ["Les voici, voici la quadrille", "Chorus and procession", ["escamillo"], "The crowd outside the bullring cheers the procession."],
      ["Si tu m'aimes, Carmen", "Duet", ["escamillo", "carmen"], "Escamillo and Carmen pledge their love before he goes in to fight."],
      ["C'est toi! C'est moi!", "Final duet", ["carmen", "jose"], "José begs Carmen to come back; she throws away his ring, and as the crowd acclaims Escamillo, he kills her and gives himself up."],
    ]),
  ],

  boheme: [
    ...A("Act 1", [
      ["Questo Mar Rosso", "Scene", ["rodolfo", "marcello", "colline"], "Freezing in the garret, Rodolfo and Marcello burn a play to keep warm; Colline arrives."],
      ["Schaunard's windfall", "Scene", ["rodolfo", "marcello", "colline"], "Schaunard brings food, wood and money; they plan Christmas Eve at the Café Momus."],
      ["Benoît's visit", "Scene", ["rodolfo", "marcello", "colline"], "They get the landlord drunk and throw him out without paying the rent."],
      ["Chi è là?… Che gelida manina", "Scene and aria", ["rodolfo", "mimi"], "Rodolfo stays to write; Mimì knocks for a light, loses her key, and their hands meet."],
      ["Sì, mi chiamano Mimì", "Aria", ["mimi"], "Mimì tells him of her simple life embroidering flowers."],
      ["O soave fanciulla", "Duet", ["rodolfo", "mimi"], "They fall in love, and go out to join the others."],
    ]),
    ...A("Act 2", [
      ["Aranci, datteri!", "Crowd scene", ["rodolfo", "mimi", "marcello", "colline"], "The Latin Quarter on Christmas Eve; Rodolfo buys Mimì a bonnet and introduces her to his friends."],
      ["Quando m'en vo", "Waltz", ["musetta", "marcello"], "Musetta arrives with the old Alcindoro and sings to win Marcello back."],
      ["Ensemble and retreat", "Finale", ["musetta", "marcello", "rodolfo", "mimi", "colline"], "Musetta sends Alcindoro away, falls into Marcello's arms, and leaves him the bill as the friends march off behind the military band."],
    ]),
    ...A("Act 3", [
      ["Mimì?!… Speravo di trovarvi qui", "Duet", ["mimi", "marcello"], "At the toll gate at dawn Mimì tells Marcello Rodolfo's jealousy is tearing them apart."],
      ["Marcello, finalmente!… Mimì è tanto malata", "Scene", ["rodolfo", "marcello", "mimi"], "Rodolfo first blames her flirting, then confesses the truth: Mimì is dying and he is too poor to help. She overhears."],
      ["Donde lieta uscì", "Aria", ["mimi"], "Mimì's farewell: send back her things, but keep the bonnet."],
      ["Addio, dolce svegliare", "Quartet", ["rodolfo", "mimi", "marcello", "musetta"], "Rodolfo and Mimì agree to part in the spring, while Marcello and Musetta quarrel."],
    ]),
    ...A("Act 4", [
      ["O Mimì, tu più non torni", "Duet", ["rodolfo", "marcello"], "Back in the garret the two men pretend not to miss their lovers."],
      ["Clowning", "Scene", ["rodolfo", "marcello", "colline"], "Supper of bread and herring; a mock dance and duel."],
      ["Musetta brings Mimì", "Scene", ["musetta", "mimi", "rodolfo", "marcello", "colline"], "Mimì, too weak to climb the stairs, begged to be brought back to Rodolfo to die. Musetta gives Marcello her earrings to sell for medicine, and goes for a muff."],
      ["Vecchia zimarra", "Aria", ["colline"], "Colline says goodbye to his old coat and goes to sell it."],
      ["Sono andati?", "Duet", ["mimi", "rodolfo"], "Alone, Mimì and Rodolfo remember the night they met."],
      ["Finale", "Finale", ["mimi", "rodolfo", "musetta", "marcello", "colline"], "Musetta gives Mimì the muff and prays; Mimì drifts away, and the friends realise she has died before Rodolfo does."],
    ]),
  ],

  tosca: [
    ...A("Act 1", [
      ["Ah! Finalmente!", "Scene", [], "The escaped prisoner Angelotti hides in the Attavanti chapel; the Sacristan grumbles."],
      ["Recondita armonia", "Aria", ["cavaradossi"], "Cavaradossi compares his painted Magdalene to Tosca."],
      ["Voi! Cavaradossi!", "Scene", ["cavaradossi"], "Angelotti reveals himself and Cavaradossi promises help."],
      ["Mario! Mario!… Non la sospiri la nostra casetta", "Duet", ["tosca", "cavaradossi"], "Tosca, jealous of the blonde Magdalene, arranges to meet him tonight."],
      ["Un tal baccano in chiesa!", "Scene", ["scarpia"], "Scarpia arrives on Angelotti's trail and finds the Attavanti fan."],
      ["Tosca? Che non mi veda", "Scene", ["scarpia", "tosca"], "Scarpia uses the fan to inflame Tosca's jealousy; she leaves in tears."],
      ["Va, Tosca!… Te Deum", "Finale", ["scarpia"], "Scarpia gloats over his plans for the painter and for Tosca as the Te Deum rises."],
    ]),
    ...A("Act 2", [
      ["Tosca è un buon falco", "Scene", ["scarpia"], "At supper in the Palazzo Farnese, Scarpia savours conquest by force."],
      ["Meno male!… Dov'è Angelotti?", "Interrogation", ["scarpia", "cavaradossi", "tosca"], "Cavaradossi is questioned while Tosca's cantata is heard below; he is taken to be tortured."],
      ["Sale, ascende l'umana cantica… The torture", "Scene", ["tosca", "cavaradossi", "scarpia"], "Hearing his cries, Tosca reveals Angelotti's hiding place."],
      ["Vittoria! Vittoria!", "Scene", ["cavaradossi", "scarpia", "tosca"], "News of Napoleon's victory at Marengo; Cavaradossi defies Scarpia and is dragged away to be shot."],
      ["Già, mi dicon venal", "Scene", ["scarpia", "tosca"], "Scarpia names his price for Cavaradossi's life: Tosca herself."],
      ["Vissi d'arte", "Aria", ["tosca"], "Tosca asks why God has abandoned her, who lived for art and love."],
      ["Questo è il bacio di Tosca!", "Finale", ["tosca", "scarpia"], "Scarpia orders a ‘mock’ execution and writes a safe-conduct; as he claims her, she stabs him."],
    ]),
    ...A("Act 3", [
      ["Io de' sospiri", "Prelude", [], "Dawn over Rome; a shepherd boy sings."],
      ["E lucevan le stelle", "Aria", ["cavaradossi"], "Waiting to die, Cavaradossi remembers nights with Tosca."],
      ["O dolci mani", "Duet", ["tosca", "cavaradossi"], "Tosca arrives with the safe-conduct and tells him the execution will be a pretence."],
      ["The execution", "Finale", ["tosca", "cavaradossi"], "The bullets are real. Scarpia's murder is discovered, and Tosca leaps from the battlements."],
    ]),
  ],

  butterfly: [
    ...A("Act 1", [
      ["E soffitto… e pareti", "Scene", ["pinkerton", "suzuki"], "The broker Goro shows Pinkerton the house he has leased, and the servants."],
      ["Dovunque al mondo", "Aria", ["pinkerton", "sharpless"], "Pinkerton toasts the Yankee roaming the world; Sharpless warns him the girl is in earnest."],
      ["Ancora un passo or via… Quanto cielo! Quanto mar!", "Entrance", ["ciociosan"], "Butterfly arrives with her friends, the happiest girl in Japan."],
      ["Butterfly's treasures", "Scene", ["ciociosan", "pinkerton", "sharpless"], "She shows Pinkerton her few possessions, among them her father's dagger, and tells him she has taken up his faith."],
      ["The wedding", "Scene", ["ciociosan", "pinkerton", "sharpless", "suzuki"], "The ceremony and toasts."],
      ["Cio-Cio-San!", "Scene", ["ciociosan", "pinkerton"], "Her uncle the Bonze curses her for abandoning her gods; her family disowns her."],
      ["Viene la sera… Vogliatemi bene", "Love duet", ["ciociosan", "pinkerton", "suzuki"], "Pinkerton comforts her and they sing of their love as night falls."],
    ]),
    ...A("Act 2", [
      ["E Izaghi ed Izanami", "Scene", ["suzuki", "ciociosan"], "Three years on, Suzuki prays and doubts he will return."],
      ["Un bel dì vedremo", "Aria", ["ciociosan", "suzuki"], "Butterfly is sure: one fine day his ship will appear."],
      ["The letter", "Scene", ["sharpless", "ciociosan", "suzuki"], "Sharpless tries to read Pinkerton's letter; she refuses Prince Yamadori, and shows Sharpless her son (“Che tua madre”)."],
      ["Scuoti quella fronda di ciliegio", "Flower duet", ["ciociosan", "suzuki"], "A cannon announces Pinkerton's ship; they fill the house with flowers."],
      ["The vigil", "Humming chorus", ["ciociosan", "suzuki"], "Butterfly waits up all night with the child."],
    ]),
    ...A("Act 3 (Act 2, part 2, in the two-act version)", [
      ["Io so che alle sue pene", "Trio", ["sharpless", "pinkerton", "suzuki"], "At dawn Pinkerton arrives with Sharpless; Suzuki learns of his American wife."],
      ["Addio, fiorito asil", "Aria", ["pinkerton"], "Overcome with remorse, Pinkerton cannot face Butterfly, and leaves."],
      ["Suzuki! Dove sei?", "Scene", ["ciociosan", "suzuki", "sharpless"], "Butterfly sees Kate Pinkerton and understands; Kate offers to raise the child, and Butterfly agrees, if Pinkerton comes for him himself in half an hour."],
      ["Con onor muore… Tu, piccolo iddio", "Finale", ["ciociosan", "pinkerton"], "She says goodbye to her son and takes her life with her father's dagger as Pinkerton calls her name."],
    ]),
  ],

  schicchi: A("The opera", [
    ["Mourning Buoso", "Ensemble", ["zita", "rinuccio", "nella", "ciesca", "simone"], "Buoso Donati's relatives weep round his deathbed, loudly."],
    ["The rumour, and the search for the will", "Ensemble", ["zita", "rinuccio", "nella", "ciesca", "simone"], "Word is he left everything to the monks; they tear the room apart for the will."],
    ["Avete torto… Firenze è come un albero fiorito", "Aria", ["rinuccio"], "Rinuccio finds the will, gets Zita's consent to marry Lauretta, and praises Florence and its new men like Schicchi."],
    ["Schicchi's arrival and the quarrel with Zita", "Scene", ["schicchi", "lauretta", "rinuccio", "zita"], "Schicchi arrives with Lauretta; Zita insults them, and he refuses to help."],
    ["Addio, speranza bella", "Duet", ["lauretta", "rinuccio"], "The lovers fear they will be parted."],
    ["O mio babbino caro", "Aria", ["lauretta", "schicchi"], "Lauretta begs her father to help, or she will throw herself in the Arno."],
    ["Addio, speranza bella (reprise)", "Duet over the reading of the will", ["lauretta", "rinuccio", "schicchi"], "Schicchi reads the will while the lovers sigh."],
    ["Back from the terrace", "Short exchange", ["lauretta", "schicchi"], "Schicchi sends Lauretta out to feed the bird, and has an idea."],
    ["The doctor's visit", "Scene · Schicchi as Buoso", ["schicchi"], "Hidden in the bed, Schicchi fools the doctor with Buoso's voice."],
    ["Si corre dal notaio", "Aria", ["schicchi"], "Schicchi explains his plan: he will be Buoso and dictate a new will."],
    ["The relatives bargain", "Ensemble", ["zita", "nella", "ciesca", "simone", "rinuccio"], "They squabble over the mule, the house and the mills, and each secretly bribes Schicchi."],
    ["Spogliati, bambolino", "Trio", ["nella", "ciesca", "zita"], "The women dress Schicchi as Buoso."],
    ["Prima un avvertimento", "Schicchi's warning", ["schicchi"], "Forging a will means exile and the loss of a hand, for all of them: “Addio, Firenze”."],
    ["The new will", "Scene · with the notary", ["schicchi", "zita", "nella", "ciesca", "simone", "rinuccio"], "Schicchi leaves the best of everything to ‘his devoted friend Gianni Schicchi’, and the relatives cannot protest."],
    ["Lauretta mia", "Love duet", ["lauretta", "rinuccio"], "With the relatives driven out, the lovers look out over Florence."],
    ["Ditemi voi, signori", "Schicchi's words to the audience, spoken", ["schicchi"], "Schicchi asks the audience to forgive him, given the happy ending."],
  ]),
};
