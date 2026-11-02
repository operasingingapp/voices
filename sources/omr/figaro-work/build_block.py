import json
cur={}
for line in open('/home/claude/ext/figaro/block-now.ts'):
    l=line.strip()
    if l.startswith('["'):
        a=json.loads(l.rstrip(',')); cur[a[0]]=a
def keep(t, title=None, kind=None, who=None, what=None, also=0):
    a=list(cur[t]); 
    if title: a[0]=title
    if kind: a[1]=kind
    if who is not None: a[2]=who
    if what: a[3]=what
    if also!=0:
        a=a[:4]+([also] if also else [])
    return a
def E(title,kind,who,what,also=None): return [title,kind,who,what]+([also] if also else [])
A1=[
 keep("Sinfonia"), keep("Cinque… dieci… venti…"), keep("Cosa stai misurando"), keep("Se a caso madama"), keep("Or bene, ascolta e taci"),
 E("Bravo, signor padrone!","Recitative",["figaro"],"Alone, Figaro sees the Count's plan: to take him to London as courier and Susanna as ‘secret ambassadress’. It shall not be, says Figaro."),
 E("Se vuol ballare","Cavatina",["figaro"],"If the little Count wants to dance, Figaro will play the tune; with cunning and pretence he will uncover every secret and overturn the Count's schemes."),
 keep("Ed aspettaste il giorno"), keep("La vendetta"), keep("Tutto ancor non ho perso"), keep("Via resti servita"), keep("Va' là, vecchia pedante"), keep("Non so più cosa son, cosa faccio"),
 E("Taci, vien gente","Recitative",["susanna","count","basilio"],"The Count arrives; Cherubino hides behind the armchair. The Count tells Susanna he has been made ambassador to London and asks her to meet him in the garden at dusk, until Basilio's voice is heard outside. The Count hides behind the armchair in his turn, while Cherubino slips into it and Susanna covers him with a dressing gown.",["cherubino"]),
 E("Susanna, il ciel vi salvi","Recitative",["basilio","susanna","count"],"Basilio, pleading the Count's suit to Susanna, hints that Cherubino, seen prowling round at dawn, is chasing her, and that he makes eyes at the Countess; Susanna angrily denies it. The hidden Count hears every word.",["cherubino"]),
 keep("Cosa sento!"), keep("Basilio, in traccia tosto"),
 E("Giovani liete","Coro",[],"Figaro brings the villagers, dressed in white, to strew flowers before the Count and praise him.",["figaro","susanna","count","basilio","cherubino"]),
 E("Cos'è questa commedia","Recitative",["count","figaro","susanna","basilio","cherubino"],"Figaro thanks the Count for abolishing the feudal right over his servants' brides, and asks him to cover Susanna today with the white bridal garment, the symbol of her purity. Trapped, the Count promises the ceremony but asks for a short delay, and mutters that Marcellina, who has a claim on Figaro, must be found."),
 E("Giovani liete (repeated)","Coro",[],"The villagers sing their chorus again and go.",["figaro","susanna","count","basilio","cherubino"]),
 E("Evviva! Evviva!","Recitative",["figaro","susanna","basilio","cherubino","count"],"Cherubino, downcast, begs the Count's pardon. The Count pardons him by making him an officer in his regiment in Seville, to leave at once; Susanna and Figaro beg a day's grace for him in vain. The Count makes him embrace Susanna ‘for the last time’, and Figaro quietly tells the page he must speak to him before he goes."),
 keep("Non più andrai"),
]
A2=[
 keep("Porgi, amor"), keep("Vieni, cara Susanna"), keep("Quanto duolmi, Susanna"), keep("Voi che sapete"), keep("Bravo! Che bella voce!"), keep("Venite, inginocchiatevi"),
 E("Quante buffonerie!","Recitative",["countess","susanna","cherubino"],"The Countess finds her ribbon (the one Cherubino snatched from Susanna) bound round a scratch on his arm, and sends Susanna for sticking plaster, then for another ribbon and one of the Countess's dresses for the disguise. Alone with her, Cherubino protests that her ribbon would heal him faster, weeps at having to leave and nearly declares himself; she dries his eyes."),
 E("Chi picchia alla mia porta?","Recitative",["countess","cherubino","count"],"The Count knocks at the locked door. In terror Cherubino hides in the closet; the Countess locks it and takes the key."),
 E("Che novità!","Recitative",["countess","count"],"The Count asks why she has locked herself in, and shows her the anonymous note, which tells of her rendezvous with a lover during the ball. A crash sounds from the closet, and she claims Susanna is in there."),
 keep("Susanna, or via, sortite"), keep("Dunque voi non aprite?"), keep("Aprite, presto, aprite"), keep("Oh guarda il demonietto!"), keep("Tutto è come il lasciai"),
 keep("Esci omai, garzon malnato"), keep("Susanna! Signore!"), keep("Signori, di fuori son già i suonatori"), keep("Ah! signor!"), keep("Voi, signor, che giusto siete"),
]
A3=[
 E("Che imbarazzo è mai questo!","Recitative",["count"],"Alone, the Count puzzles over the day's events: the anonymous note, Susanna in the closet, a man jumping from the window, Figaro claiming it was him. He has sent Basilio to find out whether Cherubino ever reached Seville."),
 E("Via! fatti core","Recitative",["countess","susanna","count"],"Unseen by the Count, at the back, the Countess urges Susanna to promise him the meeting in the garden (she will go in her place, and Figaro must not know), then hides. The Count muses that if Susanna has betrayed his secret he will marry Figaro to the old woman. Susanna asks him, on the Countess's behalf, for his smelling-salts flask, and hints that she could pay off Marcellina with the dowry he promised her.",["countess"]),
 keep("Crudel! perché finora"),
 E("E perché fosti meco","Recitative",["count","susanna"],"The Count asks why she was so cold that morning; she says Cherubino was there, and admits the flask was only a pretext to speak to him.",["countess"]),
 E("Ehi Susanna, ove vai?","Recitative",["figaro","susanna"],"Leaving, Susanna whispers to Figaro that his case is won without a lawyer, and the Count overhears.",["count"]),
 E("Hai già vinta la causa!","Recitative",["count"],"Overhearing ‘you have already won your case’, the Count swears to punish them. He means to see Figaro married to Marcellina, and counts on Antonio, Susanna's uncle, refusing his niece to a foundling."),
 E("Vedrò, mentr'io sospiro","Aria",["count"],"Shall he see a servant of his made happy while he himself sighs in vain? The thought torments him; he will have his revenge."),
 keep("È decisa la lite"), keep("Riconosci in questo amplesso"), keep("Eccovi, o caro amico"), keep("Andiam, andiam, bel paggio"), keep("E Susanna non vien!"), keep("Dove sono"), keep("Io vi dico, signor"), keep("Cosa mi narri!"),
 keep("Sull'aria", title="Che soave zeffiretto"), keep("Piegato è il foglio"),
 E("Ricevete, o padroncina","Coro",[],"Village girls bring the Countess flowers; among them is Cherubino in a dress.",["barbarina","countess","susanna","cherubino"]),
 E("Queste sono, Madame","Recitative",["barbarina","countess","susanna"],"Barbarina presents the girls, and passes Cherubino off as her cousin. The Countess kisses the ‘girl’ on the forehead and asks Susanna whether she doesn't look like someone (‘To the life,’ says Susanna).",["cherubino"]),
 E("Eh cospettate! È questi l'ufficiale","Recitative",["antonio","countess","susanna","count","cherubino","barbarina"],"Antonio the gardener arrives with the Count, pulls the girl's bonnet off the page and puts on Cherubino's head his own hat, left at Antonio's house, and unmasks him. The Countess first claims to be as surprised as her husband, then, pressed, admits they had meant to dress him up for the festivities. The Count vows to punish the page's disobedience; Barbarina reminds him of what he promised her when he kissed her, and asks for Cherubino as her husband."),
 keep("Signor… se trattenete"),
 keep("Ecco la marcia", kind="Finale, section 1 of 4"),
 keep("Amanti costanti", kind="Finale, section 2 of 4"),
 keep("Andate, amici!", kind="Finale, section 3 of 4", what="The Count invites everyone to the evening's celebrations, with fireworks, a great dance and a great supper, so that all may see how he treats those dear to him."),
 E("Amanti costanti (repeated)","Finale, section 4 of 4",[],"The chorus sings again in praise of the Count as the procession leaves.",["count","countess","susanna","figaro","marcellina","bartolo"]),
]
A4=[
 E("L'ho perduta, me meschina","Cavatina",["barbarina"],"In a small room, Barbarina has lost the pin that sealed the love note Susanna slipped the Count at the wedding. The Count gave it to her to take back to Susanna with the message ‘this is the seal of the pines’."),
 E("Barbarina, cos'hai?","Recitative",["figaro","barbarina","marcellina"],"Slipping her a pin taken from Marcellina, Figaro gets the message out of her, works out that the meeting is under the pines, and thinks Susanna has betrayed him."),
 E("Madre! Figlio!","Recitative",["figaro","marcellina"],"Marcellina tells him to keep calm (‘Flemma, flemma’): he cannot be sure who is fooling whom. But he storms off to avenge all husbands."),
 E("Presto, avvertiam Susanna","Recitative",["marcellina"],"Marcellina resolves to warn Susanna, whom she believes innocent: when her own interest is not at stake, every woman is inclined to defend her sex against ungrateful men."),
 E("Il capro e la capretta","Aria · often cut",["marcellina"],"Animals live at peace with their mates: the billy goat and the nanny goat, the ram and the ewe, even the lion and the lioness. Only women are treated cruelly by men."),
 keep("Nel padiglione a manca"), keep("È Barbarina… Chi va là?"), keep("Ha i diavoli nel corpo"), keep("In quegli anni"),
 E("Tutto è disposto","Recitative",["figaro"],"Alone in the dark, waiting to catch Susanna with the Count, Figaro rails at her ingratitude, and realises that at the wedding the Count was enjoying her note while he, watching, unknowingly laughed at himself.",["barbarina"]),
 E("Aprite un po' quegli occhi","Aria",["figaro"],"He warns all men to open their eyes and see what women really are: witches, sirens, owls, comets, vixens.",["barbarina"]),
 E("Signora, ella mi disse","Recitative",["susanna","marcellina"],"Susanna and the Countess come in each other's clothes. Marcellina has already warned Susanna that Figaro, who has learned of the meeting from Barbarina, would come; now she tells them he is here, and to keep their voices down, and hides.",["countess","figaro","barbarina"]),
 E("Parmi umida la notte","Recitative",["susanna","countess","figaro"],"Figaro watches from hiding, muttering. The Countess says the night feels damp and she will withdraw; Susanna, knowing Figaro is listening, says she will stay and take the fresh air under the trees, and the Countess hides.",["barbarina","marcellina"]),
 E("Giunse alfin il momento","Recitative",["susanna"],"Knowing Figaro can hear her, and is jealous, Susanna decides to tease him: at last the moment has come when she will be happy in the arms of her beloved.",["figaro","countess","barbarina","marcellina"]),
 E("Deh vieni, non tardar","Aria",["susanna"],"She sings of her longing for her lover: come, do not delay, my joy, in the night's quiet, and let me crown you with roses.",["figaro","countess","barbarina","marcellina"]),
 keep("Perfida! E in quella forma"), keep("Pian pianin le andrò più presso"), keep("Gente, gente, all'armi!"),
]
used=set()
def j(x): return json.dumps(x,ensure_ascii=False)
out=['  figaro: [']
for act,lst in [("Act 1",A1),("Act 2",A2),("Act 3",A3),("Act 4",A4)]:
    out.append(f'    ...A("{act}", [')
    for a in lst: out.append('      ['+', '.join(j(x) for x in a)+'],')
    out.append('    ]),')
out.append('  ],')
open('/home/claude/ext/figaro/block-new.ts','w').write('\n'.join(out)+'\n')
tot=len(A1)+len(A2)+len(A3)+len(A4); print('entries',tot)
titles=[a[0] for l in (A1,A2,A3,A4) for a in l]; assert len(titles)==len(set(titles))
