/**
 * Each character's own path through the opera, act by act: only the acts they are in, told from their side.
 * Written for this app. Keyed "opera:character".
 */
export interface ArcStep {
  act: string;
  text: string;
}

export const ARCS: Record<string, ArcStep[]> = {
  // ---------------- Le nozze di Figaro ----------------
  "figaro:figaro": [
    { act: "Act 1", text: "On his wedding day Figaro measures the new room, until Susanna tells him why the Count wants them so close at hand. He vows to make the Count dance to his tune (“Se vuol ballare”), brings the villagers to press for the wedding, and teases Cherubino about army life (“Non più andrai”), after quietly telling him they must talk before he leaves." },
    { act: "Act 2", text: "Having kept Cherubino from leaving, he plots with the women: an anonymous note to make the Count jealous, and Cherubino in a dress to keep Susanna's rendezvous. Shown the note, he denies writing it. When the gardener complains of a man jumping from the window, Figaro claims it was him and bluffs through the dropped commission. Marcellina then arrives to claim him." },
    { act: "Act 3", text: "Ordered to pay Marcellina or marry her, he is saved by the mark on his arm: she and Bartolo are his long-lost parents. Susanna slaps him before she understands; then the family celebrates: there will be a double wedding today, and Marcellina hands back his IOU as his dowry. Confronted with Cherubino, he bluffs that they may both have jumped. At the wedding, where he leads Marcellina to the Countess while Bartolo leads Susanna to the Count, he sees the Count prick his finger on some lover's note." },
    { act: "Act 4", text: "Learning from Barbarina that the pin-sealed note he saw the Count receive came from Susanna, he believes she is betraying him. He brings Bartolo, Basilio and the workmen to the garden to come running at his whistle and witness it, and rails against women (“Aprite un po' quegli occhi”). After taking the slap the Count meant for Cherubino, he tells ‘the Countess’ that her husband is with his bride, then recognises Susanna's voice, though she is dressed as the Countess, pays her back by courting her, and they make up; only now does he learn of the women's plan, and they play a love scene to bait the Count, until the Count is caught out." },
  ],
  "figaro:susanna": [
    { act: "Act 1", text: "Susanna warns Figaro that the Count wants her and that Basilio pleads his case, trades sugary insults with Marcellina at the door (“Via resti servita”), and fends the Count off. Cherubino snatches the Countess's ribbon from her. She hides him in the armchair, but he is discovered anyway." },
    { act: "Act 2", text: "With the Countess she starts dressing Cherubino as a girl (“Venite, inginocchiatevi”). When the Count, suspecting a lover in the locked closet, goes off for tools to break it open, she lets the page out, sees him jump from the window, and takes his place, stepping out to the Count's confusion. In the finale she joins the Countess in reproaching the Count, admits the note was Figaro's, and prompts Figaro through the matter of the commission." },
    { act: "Act 3", text: "Sent by the Countess, she promises the Count a meeting in the garden (the Countess will go in her place, in her clothes, and Figaro must not know), hinting she will pay off Marcellina with the dowry he promised her, then whispers to Figaro that he has won his case without a lawyer, and the Count overhears. She comes to the trial with money to buy Figaro free. Finding Figaro embracing Marcellina, she slaps him, then learns Marcellina is his mother. She writes the note setting the rendezvous to the Countess's dictation (“Sull'aria”) and slips it to the Count at the wedding." },
    { act: "Act 4", text: "Figaro has learned of the meeting from Barbarina and thinks she means to betray him with the Count. Wearing the Countess's clothes, and warned by Marcellina that Figaro is hiding nearby, she knows he is listening and teases him with a song of longing (“Deh vieni, non tardar”). When he courts her as ‘the Countess’ she boxes his ears, then forgives him, and together they play out a love scene to bait the Count. When the Count drags everyone out of hiding, she comes out in the Countess's clothes and begs his pardon, until the real Countess appears." },
  ],
  "figaro:countess": [
    { act: "Act 2", text: "Alone, the Countess grieves for her husband's lost love (“Porgi, amor”) and agrees to Figaro's plan. Dressing Cherubino, she takes back her ribbon from his arm and dries his tears. When the Count, shown the anonymous note, hears a noise in the locked closet, she claims Susanna is in there and refuses to open it; when he comes back with tools she has to confess Cherubino is inside, only for Susanna to step out; the Count begs her pardon, and after reproaching him she grants it." },
    { act: "Act 3", text: "She sends Susanna to promise the Count a meeting in the garden, meaning to go herself in Susanna's clothes, without telling Figaro. Waiting, she worries over the bold plan and grows bitter at being brought so low (“E Susanna non vien!”), then remembers the happy days of her marriage and hopes to win her husband back (“Dove sono”). She dictates the note that sets the time and place (“Sull'aria”), sealed with one of her pins, and welcomes the village girls, among them Cherubino in disguise; when he is unmasked she has to face the Count's anger." },
    { act: "Act 4", text: "In Susanna's clothes she fends off Cherubino and is wooed by her own husband, who gives her a ring, then slips away into the pavilion on the right. When the Count refuses all pardon, she steps forward as herself and tries to kneel for the others; he stops her and begs her forgiveness, and she forgives him." },
  ],
  "figaro:count": [
    { act: "Act 1", text: "The Count tries to make a date with Susanna, hides from Basilio behind the armchair, overhears his gossip that Cherubino makes eyes at the Countess, and finds the page in the chair. When Figaro brings the villagers to thank him for giving up his feudal right, he promises the wedding but asks for a delay, and sends the page, who has overheard him courting Susanna, to his regiment." },
    { act: "Act 2", text: "An anonymous note makes him jealous. Hearing a noise in the locked closet, he fetches tools to break it open; his wife confesses Cherubino is inside, but out steps Susanna, and he has to beg her pardon. He questions Figaro over the note, Antonio's crushed carnations and the page's commission, and welcomes Marcellina's claim on Figaro." },
    { act: "Act 3", text: "Susanna agrees to meet him, but he overhears her telling Figaro he has won his case, and swears he will not lose to his servant (“Vedrò mentr'io sospiro”). The trial backfires when Figaro proves to be Marcellina's son. Antonio tells him Cherubino is still in the castle, and later unmasks the page among the village girls. Barbarina embarrasses him by asking for the page as her husband. He sits down to the wedding brooding on revenge, receives Susanna's note setting a meeting under the pines tonight and asking him to send back the pin, pricks his finger on its pin and keeps it, to send back through Barbarina as his answer." },
    { act: "Act 4", text: "In the garden Cherubino's kiss meant for ‘Susanna’ lands on him, and his slap meant for the page lands on Figaro. He courts ‘Susanna’, really his wife, and gives her a ring. Finding Figaro with ‘the Countess’, he calls everyone and refuses pardon though all kneel to him, until his true wife appears, and he begs her forgiveness (‘Contessa, perdono’)." },
  ],
  "figaro:cherubino": [
    { act: "Act 1", text: "Dismissed for being caught with Barbarina, the page begs Susanna to help him stay, snatches the Countess's ribbon from her, and pours out his confusion about love (“Non so più cosa son”). Hiding behind the armchair, then in it, he overhears the Count courting Susanna; discovered, he is packed off to the army, all the more quickly for what he heard." },
    { act: "Act 2", text: "He sings the Countess his love song (“Voi che sapete”) and is partly dressed as a girl. She finds her ribbon round his scratched arm and keeps it, and dries his tears when he nearly declares himself. He hides in the closet when the Count arrives, and escapes by jumping from the window, dropping his commission, which still lacks its seal." },
    { act: "Act 3", text: "Supposed to have left for Seville, he is dressed as a girl at Barbarina's house. Disguised among the village girls bringing flowers, he is found out, and tells the Count it was he who jumped from the window, and Barbarina puts the Count on the spot by asking for him as her husband." },
    { act: "Act 4", text: "In the dark garden, heading for the pavilion where Barbarina is waiting, he finds ‘Susanna’, really the Countess, flirts with her, and tries to steal a kiss, taunting her that he was behind the armchair this morning; the kiss lands on the Count. He escapes into the pavilion, and the Count's slap lands on Figaro. At the end the Count drags him out, the first of those hiding there." },
  ],
  "figaro:bartolo": [
    { act: "Act 1", text: "Doctor Bartolo still resents Figaro for helping Rosina marry the Count, and promises Marcellina revenge by law (“La vendetta”)." },
    { act: "Act 2", text: "He arrives with Marcellina and Basilio to press her claim on Figaro." },
    { act: "Act 3", text: "At the hearing the mark on Figaro's arm reveals that he is his and Marcellina's son, stolen as a baby. He agrees to marry Marcellina at last, and throws Figaro a purse of money as a wedding gift; at the double wedding he leads Susanna to the Count." },
    { act: "Act 4", text: "In the garden at night Figaro posts him and Basilio nearby, to come when he whistles and witness Susanna's betrayal. He comes running with the others at the end and sees the Count beg his wife's pardon." },
  ],
  "figaro:marcellina": [
    { act: "Act 1", text: "Marcellina holds a contract: Figaro borrowed money from her and promised to marry her if he could not repay it. With Bartolo's help she means to enforce it, and she trades sugary insults with Susanna at the door (“Via resti servita”)." },
    { act: "Act 2", text: "At the end of the act she arrives with Bartolo and Basilio to lay her claim before the Count, just as the Count, out of excuses for delaying the wedding, is longing for her to arrive." },
    { act: "Act 3", text: "The judge orders Figaro to pay or marry her, but a mark on his arm, which she names before seeing it, shows that he is her own long-lost son by Bartolo (“Riconosci in questo amplesso”). Mother and son embrace, and Bartolo agrees to marry her at last, so a double wedding is set for today. She gives Figaro back his IOU as his dowry, and at the wedding Figaro leads her to the Countess." },
    { act: "Act 4", text: "When Figaro learns of the pin and thinks Susanna false, she tells him to keep calm (‘Flemma, flemma’). Now on Susanna's side, she resolves to warn her of Figaro's suspicions and reflects that animals live at peace with their mates, while only women are treated cruelly by men (“Il capro e la capretta”). In the dark garden she warns the women that Figaro is there and hides in the pavilion, where the Count later finds her with Barbarina and Cherubino." },
  ],
  "figaro:basilio": [
    { act: "Act 1", text: "The music master brings the Count's advances to Susanna and spreads gossip about Cherubino and the Countess, not knowing the Count is hiding to hear it, and is caught out when the Count bursts from his hiding place (“Cosa sento!”). He is there when the villagers praise the Count and Cherubino is sent to the army." },
    { act: "Act 2", text: "Having delivered Figaro's anonymous note to the Count, he arrives at the end of the act with Marcellina and Bartolo to support her claim. (Off stage in Act 3, he is sent by the Count to find out whether Cherubino ever reached Seville.)" },
    { act: "Act 4", text: "Called by Figaro to the garden to witness Susanna's betrayal, he explains how he learned to give way to the powerful (“In quegli anni”). He waits nearby and comes running with the others at the end." },
  ],
  "figaro:curzio": [
    { act: "Act 3", text: "The judge rules that Figaro must pay Marcellina or marry her, and stays to see the case turned upside down when Figaro turns out to be her son (“Riconosci in questo amplesso”)." },
    { act: "Act 4", text: "In Mozart's score he is among those who come running with torches at the end, and sees the Count beg his wife's pardon." },
  ],
  "figaro:barbarina": [
    { act: "Act 3", text: "Sweet on Cherubino, she takes him home to dress him as a village girl, and brings him with the girls who give flowers to the Countess, passing him off as her cousin. When he is found out, she reminds the Count of the promises he made her when he kissed her, and asks for Cherubino as her husband." },
    { act: "Act 4", text: "Sent by the Count to return to Susanna, as his answer, the pin that sealed the love note Susanna slipped him at the wedding, she has lost it, and Figaro slips her another (“L'ho perduta, me meschina”), and lets slip the Count's message, ‘the seal of the pines’, which tells Figaro where the meeting will be. Then, in the dark garden, she waits with an orange, a pear and a ring-cake for Cherubino in the pavilion on the left, where the Count finds her at the end." },
  ],
  "figaro:antonio": [
    { act: "Act 2", text: "The gardener storms in, furious (the others say drunk), complaining that a man has jumped from the window onto his flowers, and hands Figaro the papers the man dropped, which the Count takes: Cherubino's commission." },
    { act: "Act 3", text: "He tells the Count that Cherubino has not gone to Seville, and later unmasks the page among the village girls by pulling off his bonnet and putting the page's own hat on his head." },
    { act: "Act 4", text: "He comes with torches at the end, sees his daughter Barbarina come out of hiding after the page, and sees the Count beg his wife's pardon." },
  ],

  // ---------------- Don Giovanni ----------------
  "giovanni:dongiovanni": [
    { act: "Act 1", text: "Masked, Don Giovanni flees Donna Anna's room and kills her father, the Commendatore. He slips away from Donna Elvira, sweeps the bride Zerlina off her feet (“Là ci darem la mano”), and throws a party (“Fin ch'han dal vino”) where his three masked accusers unmask him; he escapes." },
    { act: "Act 2", text: "He swaps cloaks with Leporello to serenade Elvira's maid (“Deh, vieni alla finestra”) and beats Masetto. In the graveyard he mocks the Commendatore's statue and invites it to supper. When it comes and demands that he repent, he refuses and is dragged down to hell." },
  ],
  "giovanni:leporello": [
    { act: "Act 1", text: "Leporello grumbles on watch while his master is inside the Commendatore's house. He shows Donna Elvira the catalogue of Giovanni's conquests (“Madamina”) and keeps the wedding guests busy at the party." },
    { act: "Act 2", text: "Disguised as his master, he leads Elvira away; cornered by the others, he unmasks and escapes. In the graveyard he is made to invite the statue to supper, and he watches, terrified, as his master is dragged to hell." },
  ],
  "giovanni:anna": [
    { act: "Act 1", text: "Donna Anna fights off a masked intruder and finds her father dead. She makes Don Ottavio swear vengeance. She recognises Giovanni's voice as her attacker's and tells Ottavio what happened that night (“Or sai chi l'onore”), then unmasks Giovanni at his own party." },
    { act: "Act 2", text: "She corners Leporello in Giovanni's cloak. She asks Ottavio to wait for her love while she mourns (“Non mi dir”), and at the end promises to marry him after a year." },
  ],
  "giovanni:elvira": [
    { act: "Act 1", text: "Donna Elvira arrives searching for the man who abandoned her in Burgos (“Ah, chi mi dice mai”) and finds it is Giovanni; Leporello shows her his catalogue. She warns Zerlina (“Ah, fuggi il traditor”) and Anna, and unmasks Giovanni at the party." },
    { act: "Act 2", text: "She is deceived by Leporello in Giovanni's cloak. Betrayed again, she still pities Giovanni (“Mi tradì”), and begs him at supper to change his life. In the end she retires to a convent." },
  ],
  "giovanni:zerlina": [
    { act: "Act 1", text: "On her wedding day Zerlina is charmed by Giovanni (“Là ci darem la mano”), until Elvira warns her. She makes peace with jealous Masetto (“Batti, batti”), and screams for help when Giovanni drags her off at the party." },
    { act: "Act 2", text: "She comforts the beaten Masetto (“Vedrai, carino”) and joins the hunt for Giovanni. At the end she and Masetto go home to supper." },
  ],
  "giovanni:ottavio": [
    { act: "Act 1", text: "Don Ottavio swears vengeance with Anna for her father's death. When she tells him Giovanni was the attacker, he resolves to set her mind at peace (“Dalla sua pace”) and goes masked to the party." },
    { act: "Act 2", text: "He vows to bring Giovanni to justice (“Il mio tesoro”) and, at the end, agrees to wait a year for Anna." },
  ],
  "giovanni:masetto": [
    { act: "Act 1", text: "On his wedding day Masetto is sent away by Giovanni, who wants Zerlina for himself; he goes, seething (“Ho capito, signor sì”). Zerlina wins him round (“Batti, batti”), and at the party he sees Giovanni drag her off." },
    { act: "Act 2", text: "He sets out with armed friends to kill Giovanni, but Giovanni, disguised as Leporello, sends them away and beats him. Zerlina comforts him (“Vedrai, carino”). At the end the two go home to supper." },
  ],
  "giovanni:commendatore": [
    { act: "Act 1", text: "Hearing his daughter Donna Anna cry for help, the Commendatore challenges the masked intruder, Don Giovanni, and is killed in the duel." },
    { act: "Act 2", text: "His statue speaks in the graveyard and accepts Giovanni's mocking invitation to supper. It comes, demands that Giovanni repent, and when he refuses, drags him down to hell." },
  ],

  // ---------------- Die Zauberflöte ----------------
  "cosi:fiordiligi": [
    { act: "Act 1", text: "Engaged to Guglielmo, Fiordiligi swears eternal love over his portrait and sees him off to war (“Soave sia il vento”). When two ‘Albanian’ strangers declare their love, she orders them out and swears to stand firm as a rock (“Come scoglio”), and refuses them a kiss even after they ‘poison’ themselves." },
    { act: "Act 2", text: "She agrees to a little harmless flirting and picks the fair one, Ferrando. She sends him away, and alone begs her lover's forgiveness (“Per pietà”). She resolves to follow Guglielmo to war in uniform, but Ferrando breaks down her resistance (“Fra gli amplessi”). She signs the marriage contract, is caught out, and begs forgiveness." },
  ],
  "cosi:dorabella": [
    { act: "Act 1", text: "Engaged to Ferrando, Dorabella sees him off to war (“Soave sia il vento”) and rages that she will die of grief (“Smanie implacabili”). She joins her sister in sending the ‘Albanian’ strangers away and refusing them a kiss." },
    { act: "Act 2", text: "Persuaded by Despina, she is the first to give in: she picks the dark one, Guglielmo, and gives him Ferrando's portrait for a heart-shaped locket (“Il core vi dono”). She urges her sister to yield too (“È amore un ladroncello”), signs the marriage contract, is caught out, and begs forgiveness." },
  ],
  "cosi:despina": [
    { act: "Act 1", text: "The sisters' maid laughs at their grief: men are never faithful, so pay them back (“In uomini, in soldati”). Bribed by Alfonso, she helps bring in the ‘Albanians’, takes charge of the plot, and in disguise as a doctor ‘cures’ their poisoning with a magnet." },
    { act: "Act 2", text: "She teaches the sisters how to play with men (“Una donna a quindici anni”) and joins the couples' hands (“La mano a me date”). Disguised as a notary she marries them, until the officers return, she is unmasked, and finds she was fooled as well." },
  ],
  "cosi:ferrando": [
    { act: "Act 1", text: "Sure of Dorabella's love, Ferrando bets Alfonso she will stay faithful, pretends to leave for war, and returns disguised as an ‘Albanian’ to court Fiordiligi. Sure of winning, he sings that love is food enough (“Un'aura amorosa”), and fakes poisoning to win a kiss." },
    { act: "Act 2", text: "Fiordiligi sends him away (“Ah, lo veggio”); then he learns Dorabella has given his portrait to Guglielmo, and finds that, betrayed and mocked, he still loves her (“Tradito, schernito”). He wins Fiordiligi at last (“Fra gli amplessi”), joins in ‘Così fan tutte’, and is reconciled at the end." },
  ],
  "cosi:guglielmo": [
    { act: "Act 1", text: "Sure of Fiordiligi's love, Guglielmo bets Alfonso she will stay faithful, pretends to leave for war, and returns disguised as an ‘Albanian’ to court Dorabella, boasting of their charms (“Non siate ritrosi”)." },
    { act: "Act 2", text: "He serenades the sisters (“Secondate, aurette amiche”) and wins Dorabella, taking Ferrando's portrait for a locket (“Il core vi dono”). He gloats over Ferrando's misfortune (“Donne mie, la fate a tanti”) until he watches Fiordiligi give in, joins in ‘Così fan tutte’, and is reconciled at the end." },
  ],
  "cosi:alfonso": [
    { act: "Act 1", text: "The old philosopher bets the officers a hundred sequins that their fiancées will not stay faithful for a day (“È la fede delle femmine”). He brings the false news of war (“Vorrei dir”), sees the men off (“Soave sia il vento”), bribes Despina and brings in the ‘Albanians’." },
    { act: "Act 2", text: "With Despina he pairs off the couples (“La mano a me date”) and keeps the test going. Having won, he tells the officers to marry their fiancées anyway, because all women do it (“Tutti accusan le donne”), and in the finale reveals the plot and brings everyone together." },
  ],
  "zauberfloete:tamino": [
    { act: "Act 1", text: "Saved from a serpent by the Queen's Ladies, Prince Tamino falls in love with Pamina's portrait (“Dies Bildnis”) and sets out with a magic flute to rescue her. At Sarastro's temple he learns Sarastro is no tyrant, and meets Pamina at last." },
    { act: "Act 2", text: "He keeps his vow of silence through every temptation, even when it breaks Pamina's heart. Together they pass through fire and water, protected by the flute, and are welcomed into the temple." },
  ],
  "zauberfloete:pamina": [
    { act: "Act 1", text: "Held in Sarastro's realm and guarded by Monostatos, Pamina learns from Papageno that a prince loves her, and they sing of love (“Bei Männern”). Caught trying to escape, she tells Sarastro the truth, and meets Tamino." },
    { act: "Act 2", text: "Her mother gives her a dagger to kill Sarastro. Tamino's silence makes her think he no longer loves her (“Ach, ich fühl's”), and she is about to take her life when the Spirits stop her. She walks with Tamino through fire and water." },
  ],
  "zauberfloete:papageno": [
    { act: "Act 1", text: "The bird-catcher (“Der Vogelfänger bin ich ja”) claims he killed the serpent and gets his mouth padlocked. Sent with Tamino and a set of magic bells, he finds Pamina and sings with her of love; his bells save them from Monostatos." },
    { act: "Act 2", text: "He fails the trial of silence but is promised a wife. Alone and despairing, he is about to hang himself when the Spirits remind him of his bells; Papagena appears (“Pa-pa-pa”)." },
  ],
  "zauberfloete:queen": [
    { act: "Act 1", text: "The Queen of the Night appears to Tamino, grieving for her daughter, taken by Sarastro, and promises Pamina to him if he rescues her (“O zittre nicht”)." },
    { act: "Act 2", text: "She gives Pamina a dagger and demands that she kill Sarastro (“Der Hölle Rache”). With her Ladies and Monostatos she storms the temple, and is cast into eternal night." },
  ],
  "zauberfloete:sarastro": [
    { act: "Act 1", text: "Sarastro hears Pamina's confession kindly, punishes Monostatos, and sends Tamino and Papageno to be tested." },
    { act: "Act 2", text: "He asks the gods to guide the young couple (“O Isis und Osiris”), tells Pamina there is no vengeance in these halls (“In diesen heil'gen Hallen”), and welcomes the lovers as the Queen's night is defeated." },
  ],

  // ---------------- Il barbiere di Siviglia ----------------
  "barbiere:figarob": [
    { act: "Act 1", text: "Figaro bursts in, the busiest man in Seville (“Largo al factotum”), and for a fee plans the Count's way into Bartolo's house. He carries Rosina's letter to ‘Lindoro’." },
    { act: "Act 2", text: "Shaving Bartolo during the music lesson, he steals the balcony key. That night he climbs in with the Count and makes sure the notary marries the right couple." },
  ],
  "barbiere:rosina": [
    { act: "Act 1", text: "Kept locked up by her guardian, Rosina is set on winning ‘Lindoro’, the student singing under her window (“Una voce poco fa”). She gives Figaro a letter for him." },
    { act: "Act 2", text: "Her lover comes as a music teacher. When Bartolo convinces her that Lindoro is only the Count's go-between, she agrees in anger to marry Bartolo, until Lindoro reveals that he is the Count, and they are married." },
  ],
  "barbiere:almaviva": [
    { act: "Act 1", text: "Count Almaviva serenades Rosina at dawn (“Ecco, ridente in cielo”), then sings as ‘Lindoro’, a poor student. With Figaro's plan he enters the house as a drunken soldier and causes chaos until the police arrive." },
    { act: "Act 2", text: "He returns as ‘Don Alonso’ to give Rosina her music lesson, climbs in at night, reveals who he is, and marries her under Bartolo's nose." },
  ],
  "barbiere:basilio": [
    { act: "Act 1", text: "The music master Basilio warns Bartolo that the Count is in town, and advises slander to get rid of him (“La calunnia”)." },
    { act: "Act 2", text: "Arriving in the middle of the lesson, he is bribed and told he has a fever (“Buona sera”). Bribed again, he is witness at Rosina's wedding to the Count." },
  ],
  "barbiere:bartolob": [
    { act: "Act 1", text: "Doctor Bartolo means to marry his ward Rosina himself. He tells her she won't fool a doctor of his standing (“A un dottor della mia sorte”), and is outraged by the drunken soldier." },
    { act: "Act 2", text: "Suspicious of the new music teacher, he turns Rosina against Lindoro and sends for the notary, only to find her married to the Count. He takes the dowry as consolation." },
  ],

  // ---------------- L'elisir d'amore ----------------
  "elisir:nemorino": [
    { act: "Act 1", text: "Shy Nemorino loves Adina (“Quanto è bella”) and buys a love potion from Dulcamara, cheap Bordeaux. Tipsy and confident, he ignores her, and she agrees to marry Belcore that very day." },
    { act: "Act 2", text: "He enlists to pay for more elixir. The village girls, who know he has inherited a fortune, crowd round him; he thinks it is the potion. Seeing a tear on Adina's cheek (“Una furtiva lagrima”), he knows she loves him, and she does." },
  ],
  "elisir:adina": [
    { act: "Act 1", text: "Adina laughs at the tale of Tristan's potion and warns Nemorino she is fickle. Stung by his sudden indifference, she agrees to marry Belcore at once." },
    { act: "Act 2", text: "She delays signing the marriage contract. Learning that Nemorino enlisted for her, she understands her heart, buys back his papers and confesses her love." },
  ],
  "elisir:dulcamara": [
    { act: "Act 1", text: "The quack doctor arrives selling a cure for everything (“Udite, udite, o rustici”) and sells Nemorino a bottle of wine as Isolde's elixir." },
    { act: "Act 2", text: "He sings a barcarolle with Adina at the wedding, tells her what Nemorino has done for her, and leaves with the whole village buying his elixir." },
  ],
  "elisir:belcore": [
    { act: "Act 1", text: "Sergeant Belcore marches in and proposes to Adina on the spot; to his delight she agrees to marry him, first in six days, then that evening." },
    { act: "Act 2", text: "He signs Nemorino up for twenty scudi, then loses Adina to him and shrugs: there are plenty of other women." },
  ],

  // ---------------- Rigoletto ----------------
  "rigoletto:rigoletto": [
    { act: "Act 1", text: "The Duke's jester mocks the courtiers and Count Monterone, who curses him. Haunted by the curse, he meets the assassin Sparafucile (“Pari siamo”) and visits his hidden daughter Gilda. Tricked by the courtiers, he helps them carry her off." },
    { act: "Act 2", text: "He searches the palace for Gilda and turns on the courtiers (“Cortigiani, vil razza dannata”). When she tells him how she was deceived, he swears vengeance on the Duke." },
    { act: "Act 3", text: "He shows Gilda the Duke's faithlessness and pays Sparafucile to kill him. Gloating over the sack, he hears the Duke singing and finds his dying daughter inside. The curse is fulfilled." },
  ],
  "rigoletto:gilda": [
    { act: "Act 1", text: "Kept hidden by her father, Gilda has fallen for a student she saw at church. When he appears and declares his love she dreams of his name (“Caro nome”), and is carried off by the courtiers." },
    { act: "Act 2", text: "Seduced by the Duke, she tells her father everything (“Tutte le feste al tempio”) and begs him to forgive the man she still loves." },
    { act: "Act 3", text: "She sees the Duke wooing Maddalena. Overhearing the plan to kill whoever comes to the door, she knocks, dressed as a man, and dies in her father's arms." },
  ],
  "rigoletto:duke": [
    { act: "Act 1", text: "The Duke boasts that one woman is as good as another (“Questa o quella”). Disguised as a poor student, he declares his love to Gilda." },
    { act: "Act 2", text: "He mourns her abduction (“Parmi veder le lagrime”) until he hears she is in the palace, and hurries to her." },
    { act: "Act 3", text: "At Sparafucile's inn he sings that women are fickle (“La donna è mobile”) and woos Maddalena, and leaves alive, never knowing who died in his place." },
  ],
  "rigoletto:maddalena": [
    { act: "Act 3", text: "Sparafucile's sister lures the Duke to the inn and flirts with him (“Bella figlia dell'amore”). Charmed, she begs her brother to spare him, and he agrees to kill the next stranger at the door instead." },
  ],

  // ---------------- La traviata ----------------
  "traviata:violetta": [
    { act: "Act 1", text: "Violetta, a celebrated courtesan, meets Alfredo at her party and laughs off his love. Alone, she wonders if this could be true love (“Ah, fors'è lui”), then swears to stay free (“Sempre libera”)." },
    { act: "Act 2", text: "She has given up Paris for Alfredo. His father demands she leave him for his family's sake, and she agrees, heartbroken. At Flora's party Alfredo insults her before everyone." },
    { act: "Act 3", text: "Dying and alone, she bids farewell to her past (“Addio, del passato”). Alfredo returns (“Parigi, o cara”), but too late; she dies in his arms." },
  ],
  "traviata:alfredo": [
    { act: "Act 1", text: "Alfredo leads the drinking song (“Libiamo”) and declares he has loved Violetta for a year (“Un dì, felice”)." },
    { act: "Act 2", text: "Happy in the country (“De' miei bollenti spiriti”), he learns she is selling her things for them, and rushes to Paris. Reading her farewell, he follows her to Flora's party and throws his winnings at her." },
    { act: "Act 3", text: "Knowing the truth at last, he returns to ask her forgiveness, and loses her." },
  ],
  "traviata:germont": [
    { act: "Act 2", text: "Giorgio Germont calls on Violetta to demand she give up his son, and is moved by her sacrifice. He tries to comfort Alfredo with memories of home (“Di Provenza il mar”) and rebukes him at Flora's party." },
    { act: "Act 3", text: "He writes to Violetta to tell her Alfredo knows the truth, and comes to ask her forgiveness as she dies." },
  ],

  // ---------------- Carmen ----------------
  "carmen:carmen": [
    { act: "Act 1", text: "Carmen sings that love is a wild bird (Habanera) and throws her flower at Don José. Arrested after a fight, she charms him into letting her escape (Seguidilla)." },
    { act: "Act 2", text: "At Lillas Pastia's tavern she meets Escamillo, dances for José, and taunts him when duty calls; after his fight with his officer he must join her smugglers." },
    { act: "Act 3", text: "Weary of José, she reads her fate in the cards and turns up death, again and again." },
    { act: "Act 4", text: "She arrives at the bullring with Escamillo, faces José, throws away his ring, and is killed." },
  ],
  "carmen:jose": [
    { act: "Act 1", text: "Corporal Don José receives Carmen's flower and his mother's message through Micaëla. Ordered to guard Carmen, he lets her escape, and is jailed." },
    { act: "Act 2", text: "Released, he goes to Carmen, shows her the flower he kept (“La fleur que tu m'avais jetée”), fights his officer, and must desert." },
    { act: "Act 3", text: "A jealous smuggler, he fights Escamillo, then leaves with Micaëla for his dying mother, warning Carmen they will meet again." },
    { act: "Act 4", text: "Outside the bullring he begs Carmen to come back, and kills her when she refuses." },
  ],
  "carmen:micaela": [
    { act: "Act 1", text: "Micaëla brings Don José a letter and a kiss from his mother (“Parle-moi de ma mère”)." },
    { act: "Act 3", text: "She braves the smugglers' mountain camp to find José (“Je dis que rien ne m'épouvante”) and takes him home to his dying mother." },
  ],
  "carmen:escamillo": [
    { act: "Act 2", text: "The bullfighter makes his entrance (Toreador song) and is taken with Carmen." },
    { act: "Act 3", text: "Seeking Carmen in the mountains, he fights José and invites everyone to his next fight in Seville." },
    { act: "Act 4", text: "He arrives at the bullring with Carmen and wins in the ring as she dies outside." },
  ],

  // ---------------- La bohème ----------------
  "boheme:rodolfo": [
    { act: "Act 1", text: "The poet burns his manuscript for warmth, stays behind to write, and meets his neighbour Mimì; their hands meet in the dark (“Che gelida manina”)." },
    { act: "Act 2", text: "He brings Mimì to the Café Momus and buys her a bonnet." },
    { act: "Act 3", text: "He tells Marcello the truth: Mimì is gravely ill and he is too poor to help her. Mimì overhears, and they agree to part in the spring." },
    { act: "Act 4", text: "Alone in the garret he cannot forget her. She is brought back to die, and they remember the night they met." },
  ],
  "boheme:mimi": [
    { act: "Act 1", text: "Mimì knocks for a light, loses her key, and tells Rodolfo about her life embroidering flowers (“Sì, mi chiamano Mimì”)." },
    { act: "Act 2", text: "At the Café Momus she meets Rodolfo's friends." },
    { act: "Act 3", text: "Coughing, she tells Marcello of Rodolfo's jealousy, overhears that she is dying, and bids Rodolfo a gentle farewell (“Donde lieta uscì”)." },
    { act: "Act 4", text: "Brought back to the garret by Musetta, she dies peacefully beside Rodolfo." },
  ],
  "boheme:musetta": [
    { act: "Act 2", text: "Musetta sweeps into the Café Momus with a rich admirer and wins Marcello back with her waltz (“Quando m'en vo”), leaving the admirer the bill." },
    { act: "Act 3", text: "She quarrels loudly with Marcello outside the inn." },
    { act: "Act 4", text: "She brings the dying Mimì to the garret, gives Marcello her earrings to sell for medicine, fetches a muff for Mimì's hands, and prays for her." },
  ],
  "boheme:marcello": [
    { act: "Act 1", text: "The painter freezes in the garret with Rodolfo and heads off to the Café Momus with his friends." },
    { act: "Act 2", text: "Musetta's waltz is aimed at him, and he gives in." },
    { act: "Act 3", text: "Mimì confides in him, and he hears from Rodolfo how ill she is." },
    { act: "Act 4", text: "Pining for Musetta, he helps care for Mimì in her last hour." },
  ],
  "boheme:colline": [
    { act: "Act 1", text: "The philosopher joins the friends' Christmas Eve feast and helps get rid of the landlord." },
    { act: "Act 2", text: "He joins his friends at the Café Momus on Christmas Eve, and marches off with them behind the military band." },
    { act: "Act 4", text: "To pay for Mimì's medicine he says goodbye to his old coat (“Vecchia zimarra”) and goes to sell it." },
  ],

  // ---------------- Tosca ----------------
  "tosca:tosca": [
    { act: "Act 1", text: "Floria Tosca visits her lover Cavaradossi in the church, jealous of the woman in his painting; Scarpia feeds her jealousy with a fan." },
    { act: "Act 2", text: "She hears Cavaradossi tortured and gives up Angelotti's hiding place. Scarpia names his price; she asks why God has abandoned her (“Vissi d'arte”), agrees, and stabs him." },
    { act: "Act 3", text: "She tells Cavaradossi the execution will be a pretence, finds him dead, and leaps from the castle walls." },
  ],
  "tosca:cavaradossi": [
    { act: "Act 1", text: "The painter compares his Magdalene to Tosca (“Recondita armonia”) and helps the escaped prisoner Angelotti hide." },
    { act: "Act 2", text: "Arrested and tortured, he defies Scarpia (“Vittoria!”) and is taken to be shot." },
    { act: "Act 3", text: "Waiting for dawn, he remembers Tosca (“E lucevan le stelle”). Told the execution is a sham, he faces the firing squad, and the bullets are real." },
  ],
  "tosca:scarpia": [
    { act: "Act 1", text: "The police chief tracks Angelotti to the church, uses a fan to stir Tosca's jealousy, and gloats during the Te Deum." },
    { act: "Act 2", text: "He tortures Cavaradossi, demands Tosca herself as the price of his life, arranges a ‘mock’ execution, and is stabbed by her." },
  ],

  // ---------------- Madama Butterfly ----------------
  "butterfly:ciociosan": [
    { act: "Act 1", text: "Cio-Cio-San, fifteen, marries Pinkerton, gives up her religion for him, and is cursed and disowned by her family. He comforts her, and they sing of their love." },
    { act: "Act 2", text: "Three years later she is sure he will return (“Un bel dì vedremo”), refuses Prince Yamadori, shows Sharpless her son, and fills the house with flowers when his ship arrives." },
    { act: "Act 3", text: "After a night's vigil she sees Pinkerton's American wife, agrees to give up her son, and takes her life with her father's dagger." },
  ],
  "butterfly:pinkerton": [
    { act: "Act 1", text: "The American lieutenant leases a house and a bride, ignores Sharpless's warning, and woos Butterfly on their wedding night." },
    { act: "Act 3", text: "He returns with his American wife, is overcome with remorse (“Addio, fiorito asil”), and arrives as Butterfly dies." },
  ],
  "butterfly:suzuki": [
    { act: "Act 1", text: "Butterfly's maid serves at the wedding and prays for her mistress." },
    { act: "Act 2", text: "She doubts Pinkerton will return, but helps fill the house with flowers (Flower duet) and keeps the night's vigil." },
    { act: "Act 3", text: "She learns the truth from Sharpless and is with Butterfly at the end." },
  ],
  "butterfly:sharpless": [
    { act: "Act 1", text: "The American consul warns Pinkerton that Butterfly takes the marriage seriously." },
    { act: "Act 2", text: "He brings Pinkerton's letter but cannot read her all of it, and is shaken to meet her son." },
    { act: "Act 3", text: "He returns with Pinkerton and his wife, and reproaches Pinkerton for what he has done." },
  ],

  // ---------------- Gianni Schicchi (one act) ----------------
  "schicchi:schicchi": [
    { act: "The opera", text: "Called in by Rinuccio to save the relatives' inheritance, Gianni Schicchi refuses until his daughter Lauretta begs him. He hides the body, climbs into Buoso's bed, dictates a new will to the notary, and leaves the best of it to himself, so the young couple can marry." },
  ],
  "schicchi:lauretta": [
    { act: "The opera", text: "Lauretta loves Rinuccio, but his family scorn her father. When Schicchi refuses to help them, she begs him, threatening to throw herself in the Arno if she cannot marry (“O mio babbino caro”). At the end she and Rinuccio embrace, free to marry." },
  ],
  "schicchi:rinuccio": [
    { act: "The opera", text: "Rinuccio finds the will, makes Zita promise he may marry Lauretta, and sends for Schicchi. When the will is read, he says only Schicchi can save them and praises Florence and its new men (“Firenze è come un albero fiorito”). Schicchi's trick lets him marry Lauretta." },
  ],
  "schicchi:zita": [
    { act: "The opera", text: "Buoso's cousin Zita leads the mourning, and the hunt for the will. She scorns Schicchi and his daughter, and is driven out of the house at the end." },
  ],
  "schicchi:nella": [
    { act: "The opera", text: "One of the relatives, Nella helps dress Schicchi as the dead man and is driven out with the others." },
  ],
  "schicchi:ciesca": [
    { act: "The opera", text: "La Ciesca joins the greedy relatives, secretly bribes Schicchi for the best property, and is driven out empty-handed." },
  ],
  "schicchi:simone": [
    { act: "The opera", text: "The oldest relative, Simone, knows the law. He hopes for the mills of Signa, and is driven out with the rest." },
  ],
};
