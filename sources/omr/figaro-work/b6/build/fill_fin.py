import json, re, sys
F = '/home/claude/ext/figaro/b6/build/lang_fin.json'

NOTES = ("Libretto by Lorenzo Da Ponte (1786). Words follow the engraving's spelling (quà, quì, sà, nò, da for dà, "
         "si for sì in 'si barbaro' and 'si gran torto', scola, commune, mertan/merta, vo', vel/ve'l, nol, cos' è, un', "
         "femminee; anima is printed split as 'ani ma', and 'mai tremiti' stands for ma i tremiti). IPA follows sung Italian "
         "conventions: stressed syllable marked, elisions (two words on one note in the score) joined with ‿, open e/o as ɛ/ɔ, "
         "intervocalic s voiced, così with [s] as in the model; 'ani ma' is sung a.ni‿ma, 'mai' in m. 258 as one syllable (ma i). "
         "Translation literal, for meaning.")

# lexicon: normalized word -> gloss=ipa
LEXSRC = """
esci=come out=ˈɛʃ.ʃi|omai=now at last=oˈma.i|garzon=boy=ɡarˈdzon|malnato=ill-born=malˈna.to|sciagurato=wretch=ʃa.ɡuˈra.to
non=not=non|tardar=delay=tarˈdar|ah=ah=ˈa|signore=my lord=siɲˈɲo.re|quel=that=kwel|furore=fury=fuˈro.re|per=for=per
lui=him=ˈlu.i|fammi=makes me=ˈfam.mi|il=the=il|cor=heart=ˈkɔr|tremar=tremble=treˈmar|e=and=e|d'opporvi=to oppose me=dopˈpor.vi
ancor=still=anˈkor|osate=you dare=oˈza.te|no=no=ˈnɔ|sentite=listen=senˈti.te|via=come on=ˈvi.a|parlate=speak=parˈla.te
giuro=I swear=ˈdʒu.ro|al=to=al|ciel=heaven=ˈtʃɛl|ch'ogni=that every=ˈkoɲ.ɲi|sospetto=suspicion=sosˈpɛt.to|lo=the=lo
stato=state=ˈsta.to|in=in=in|che=that=ke|trovate=you find=troˈva.te|sciolto=loosened=ˈʃɔl.to|collo=neck=ˈkɔl.lo
nudo=bare=ˈnu.do|petto=chest=ˈpɛt.to|seguitate=go on=se.ɡwiˈta.te|vestir=to dress in=vesˈtir|femminee=women's=femˈmi.ne.e
spoglie=clothes=ˈspɔʎ.ʎe|comprendo=I understand=komˈprɛn.do|indegna=unworthy=inˈdeɲ.ɲa|moglie=wife=ˈmoʎ.ʎe|mi=myself=mi
vo'=I want=ˈvɔ|tosto=at once=ˈtɔs.to|vendicar=avenge=ven.diˈkar|fa=does=ˈfa|torto=wrong=ˈtɔr.to|trasporto=outburst=trasˈpɔr.to
m'oltraggiate=you insult me=mol.tradˈdʒa.te|a=by=a|dubitar=doubting=du.biˈtar|quà=here=ˈkwa|la=the=la|chiave=key=ˈkja.ve
egli=he=ˈeʎ.ʎi|è=is=ˈɛ|innocente=innocent=in.noˈtʃɛn.te|voi=you=ˈvo.i|sapete=know=saˈpe.te|so=I know=ˈsɔ|niente=nothing=ˈnjɛn.te
va=go=ˈva|lontan=far=lonˈtan|dagli=from the=ˈdaʎ.ʎi|occhi=eyes=ˈɔk.ki|miei=my=ˈmjɛ.i|un'=a=un|infida=faithless=inˈfi.da
empia=wicked=ˈɛm.pja|sei=you are=ˈsɛ.i|cerchi=you seek=ˈtʃer.ki|d'infamar=to disgrace=din.faˈmar|vado=I'm going=ˈva.do
sì=yes=ˈsi|ascolto=I listen=asˈkol.to|ma=but=ma|son=I am=son|rea=guilty=ˈrɛ.a|vel=it to you=vel|leggo=I read=ˈlɛɡ.ɡo
volto=face=ˈvol.to|mora=let him die=ˈmɔ.ra|cieca=blind=ˈtʃɛ.ka|gelosia=jealousy=dʒe.loˈzi.a|qualche=some=ˈkwal.ke
eccesso=excess=etˈtʃɛs.so|gli=him=ʎi|far=do=ˈfar|più=more=ˈpju|sia=let him be=ˈsi.a|ria=wicked=ˈri.a|cagion=cause=kaˈdʒon
del=of=del|mio=my=ˈmi.o|penar=suffering=peˈnar|susanna=Susanna=suˈzan.na|cos'=what=ˈkɔz|stupore=amazement=stuˈpo.re
brando=sword=ˈbran.do|prendete=take=prenˈde.te|paggio=page=ˈpad.dʒo|uccidete=kill=ut.tʃiˈde.te|vedetelo=see him=veˈde.te.lo
scola=lesson=ˈskɔ.la|storia=story=ˈstɔ.rja|mai=ever=ˈma.i|questa=this=ˈkwe.sta|v'è=is there=ˈvɛ|là=there=ˈla|testa=head=ˈtɛ.sta
girando=spinning=dʒiˈran.do|confusa=confused=konˈfu.za|han=they have=an|san=they know=san|come=how=ˈko.me|sola=alone=ˈso.la
guardate=look=ɡwarˈda.te|quì=here=ˈkwi|ascoso=hidden=asˈko.zo|sarà=he must be=saˈra|guardiamo=let's look=ɡwarˈdja.mo
morta=dead=ˈmɔr.ta|fiato=breath=ˈfja.to|manca=fails=ˈman.ka|lieta=cheerful=ˈljɛ.ta|franca=confident=ˈfran.ka|salvo=safety=ˈsal.vo
di=of=di|già=already=ˈdʒa|sbaglio=mistake=ˈzbaʎ.ʎo|presi=I made=ˈpre.zi|appena=hardly=apˈpe.na|credo=I believe=ˈkre.do
se=if=se|v'offesi=I offended you=vofˈfe.zi|perdono=pardon=perˈdo.no|vi=you=vi|chiedo=I ask=ˈkjɛ.do|burla=joke=ˈbur.la
simile=such=ˈsi.mi.le|poi=after all=ˈpɔ.i|crudeltà=cruelty=kru.delˈta|le=the=le|vostre=your=ˈvɔ.stre|follie=follies=folˈli.e
mertan=deserve=ˈmɛr.tan|pietà=pity=pjeˈta|io=I=ˈi.o|v'amo=love you=ˈva.mo|nol=not it=nol|dite=say=ˈdi.te|ve'l=it to you=vel
mentite=you lie=menˈti.te|l'empia=the wicked one=ˈlɛm.pja|l'infida=the faithless one=linˈfi.da|ognora=always=oɲˈɲo.ra
v'inganna=deceives you=viŋˈɡan.na|quell'=that=kwel|ira=anger=ˈi.ra|m'aita=help me=maˈi.ta|calmar=calm=kalˈmar|così=thus=koˈsi
si=oneself=si|condanna=condemns=konˈdan.na|chi=whoever=ki|può=can=ˈpwɔ|sospettar=suspect=sos.petˈtar|adunque=so then=aˈduŋ.kwe
fede=faith=ˈfe.de|d'un=of a=dun|ani=soul (ani-)=ˈa.ni|amante=loving=aˈman.te|fiera=cruel=ˈfjɛ.ra|mercede=reward=merˈtʃe.de
doveva=was to=doˈve.va|sperar=hope for=speˈrar|signora=madam=siɲˈɲo.ra|rosina=Rosina=roˈzi.na|crudele=cruel man=kruˈdɛ.le
quella=that woman=ˈkwel.la|sono=I am=ˈso.no|misero=wretched=ˈmi.ze.ro|oggetto=object=odˈdʒɛt.to|vostro=your=ˈvɔ.stro
abbandono=abandonment=ab.banˈdo.no|avete=you have=aˈve.te|diletto=delight=diˈlɛt.to|disperar=despair=di.speˈrar
confuso=confused=konˈfu.zo|pentito=repentant=penˈti.to|troppo=too much=ˈtrɔp.po|punito=punished=puˈni.to|abbiate=have=abˈbja.te
soffrir=to suffer=sofˈfrir|gran=great=ˈɡran|quest'=this=kwest|alma=soul=ˈal.ma|sà=knows how=ˈsa|nò=no=ˈnɔ
rinchiuso=shut in=rinˈkju.zo|fu=it was=ˈfu|sol=only=ˈsol|provarvi=to test you=proˈvar.vi|tremiti=tremblings=ˈtrɛ.mi.ti|i=the=i
palpiti=palpitations=ˈpal.pi.ti|burlarvi=to tease you=burˈlar.vi|un=a=un|foglio=letter=ˈfɔʎ.ʎo|barbaro=barbarous=ˈbar.ba.ro
figaro=Figaro=ˈfi.ɡa.ro|basilio=Basilio=baˈzi.ljo|perfidi=traitors=ˈpɛr.fi.di|voglio=I want=ˈvɔʎ.ʎo|merta=deserves=ˈmɛr.ta
agli=to the=ˈaʎ.ʎi|altri=others=ˈal.tri|da=gives=ˈda|ebben=well then=ebˈbɛn|piace=it pleases=ˈpja.tʃe|commune=mutual=komˈmu.ne
pace=peace=ˈpa.tʃe|inflessibile=unbending=in.flesˈsi.bi.le|con=with=kon|me=me=ˈme|quanto=how much=ˈkwan.to|dolce=soft=ˈdol.tʃe
core=heart=ˈkɔ.re|donne=women=ˈdɔn.ne
"""
LEX = {}
for item in LEXSRC.replace('\n', '|').split('|'):
    item = item.strip()
    if not item:
        continue
    k, g, ipa = item.split('=')
    LEX[k] = (g, ipa)

def norm(w):
    return re.sub(r"[^\w'’]", '', w.lower())

S = {}
def P(role, pid, tr, ov='', gg=()):
    S[(role, pid)] = (tr, ov, gg)

C, T, U = 'count', 'countess', 'susanna'
P(C,'c1',"Come out now, ill-born boy, wretch, don't delay!","0‿")
P(T,'c1',"Ah! my lord,")
P(T,'c2',"that fury")
P(T,'c3',"makes my heart tremble for him,","2‿",[([2,3,4,5],"makes my heart tremble")])
P(T,'c4',"makes my heart tremble for him,","2‿",[([2,3,4,5],"makes my heart tremble")])
P(T,'c5',"makes my heart tremble for him.","2‿",[([2,3,4,5],"makes my heart tremble")])
P(C,'c2',"And you still dare to oppose me?","1‿")
P(C,'c3',"and you still dare to oppose me?","1‿")
P(T,'c6',"No, listen,")
P(C,'c4',"Come on, speak,")
P(T,'c7',"no, listen...")
P(C,'c5',"come on, speak,")
P(C,'c6',"speak,")
P(C,'c7',"speak!")
P(T,'c8',"I swear to heaven that every suspicion,","0‿")
P(T,'c9',"that every suspicion...")
P(T,'c10',"and the state in which you find him,","4‿;5:him=il;4:which")
P(T,'c11',"his neck uncovered,","0‿;1:his",[([0,1,2],"collar undone")])
P(T,'c12',"his chest bare...","0‿;1:his")
P(C,'c8',"His neck uncovered!","0‿;1:his",[([0,1,2],"collar undone")])
P(C,'c9',"his chest bare!","0‿;1:his")
P(C,'c10',"go on!")
P(T,'c13',"To dress in women's clothes...","0:in order")
CMP = "1‿"
P(C,'c11',"Ah! I understand, unworthy wife;",CMP)
P(C,'c12',"I want to take revenge at once,","0:myself",[([0,1,3],"I want to avenge myself")])
P(T,'c14',"That outburst wrongs me,","0:to me",[([0,1,2],"wrongs me")])
P(C,'c13',"ah! I understand, unworthy wife,",CMP)
P(T,'c15',"you insult me by doubting;","0‿")
P(C,'c14',"I want to take revenge at once,","0:myself",[([0,1,3],"I want to avenge myself")])
P(T,'c16',"that outburst wrongs me,","0:to me",[([0,1,2],"wrongs me")])
P(C,'c15',"ah! I understand, unworthy wife,",CMP)
P(T,'c17',"you insult me,")
P(C,'c16',"I want to take revenge at once, I want to take revenge at once, I want to take revenge at once.","0:myself;4:myself;8:myself",
  [([0,1,3],"I want to avenge myself"),([4,5,7],"I want to avenge myself"),([8,9,11],"I want to avenge myself")])
P(T,'c18',"you insult me by doubting, you insult me by doubting, you insult me by doubting.","0‿;3‿;6‿")
P(C,'c17',"The key, here!",'',[([0],"give here")])
P(T,'c19',"He is innocent!","0‿;1‿")
P(C,'c18',"the key, here!",'',[([0],"give here")])
P(T,'c20',"he is innocent!","0‿;1‿")
P(T,'c21',"You know...")
P(C,'c19',"I know nothing!")
P(C,'c20',"Get out of my sight! You are a faithless, a wicked woman, and you seek to disgrace me,","2‿;6‿;11:me",
  [([0,1,2,3,4],"get out of my sight")])
P(C,'c21',"and you seek to disgrace me.","1:me")
P(T,'c22',"I'm going...")
P(T,'c23',"yes...")
P(C,'c22',"I'm not listening,")
P(T,'c24',"but...")
P(T,'c25',"but...")
P(C,'c23',"I'm not listening,")
P(T,'c26',"I'm not guilty!")
P(C,'c24',"I read it in your face!","1‿",[([2,3],"in your face")])
P(C,'c25',"Let him die, let him die,")
P(T,'c27',"Ah! blind jealousy")
P(C,'c26',"let him die, let him die,")
P(T,'c28',"makes him commit some excess,","0‿;3:makes",[([2,3,4],"makes him do")])
P(C,'c27',"let him die, let him die, and let him be no more,","1‿;5:let him be",[([3,4,5],"let him be no more")])
P(T,'c29',"ah! blind jealousy")
P(C,'c28',"wicked cause,")
P(C,'c29',"wicked cause of my suffering!")
P(T,'c30',"makes him commit some excess.","0‿;3:makes",[([2,3,4],"makes him do")])
P(C,'c30',"Ah! I understand!")
P(T,'c31',"That wrongs me,","0:to me",[([0,1,2],"wrongs me")])
P(C,'c31',"unworthy wife.")
P(T,'c32',"that outburst!")
P(C,'c32',"Let him die, let him die,")
P(T,'c33',"Ah! blind jealousy")
P(C,'c33',"let him die, let him die,")
P(T,'c34',"makes him commit some excess,","0‿;3:makes",[([2,3,4],"makes him do")])
P(C,'c34',"let him die, let him die, and let him be no more,","1‿;5:let him be",[([3,4,5],"let him be no more")])
P(T,'c35',"ah! blind jealousy")
P(C,'c35',"wicked cause,")
P(C,'c36',"wicked cause of my suffering, wicked cause of my suffering, wicked cause of my suffering, of my suffering.")
P(T,'c36',"makes him commit some excess, makes him commit some excess, makes him commit some excess, makes him commit some excess.",
  "0‿;5‿;10‿;15‿;3:makes;8:makes;13:makes;18:makes",
  [([2,3,4],"makes him do"),([7,8,9],"makes him do"),([12,13,14],"makes him do"),([17,18,19],"makes him do")])
P(C,'c37',"Susanna!")
P(T,'c37',"Susanna!")
P(U,'s1',"My lord!")
P(U,'s2',"What is this amazement?","2:this",[([0,1],"what is")])
P(U,'s3',"Take your sword, kill the page!","0:your")
P(U,'s4',"that ill-born page, see him here, that ill-born page, see him here.")
P(C,'c38',"What a lesson!","0:what a")
P(T,'c38',"What story is this? Susanna is in there!","1‿;0:what;3:ever",[([0,1,2,3,4],"what on earth is this")])
P(C,'c39',"my head is spinning, what a lesson!","3:for me;4:goes;5:what a",[([2,3,4],"is spinning for me")])
P(U,'s5',"Their heads are muddled, they don't know what's happening, their heads are muddled, they don't know what's happening, their heads are muddled, they don't know what's happening.",
  "0‿;8‿;16‿;2:their;10:their;18:their;7:it goes;15:it goes;23:it goes",
  [([0,1,2,3],"they're in a muddle"),([4,5,6,7],"don't know what's going on"),([8,9,10,11],"they're in a muddle"),
   ([12,13,14,15],"don't know what's going on"),([16,17,18,19],"they're in a muddle"),([20,21,22,23],"don't know what's going on")])
P(T,'c39',"what story is this? Susanna is in there!","1‿;0:what;3:ever",[([0,1,2,3,4],"what on earth is this")])
P(C,'c40',"my head is spinning.","3:for me;4:goes",[([2,3,4],"is spinning for me")])
P(C,'c41',"Are you alone?")
P(U,'s6',"Look!")
P(U,'s7',"he must be hidden here,","0‿")
P(C,'c42',"Let's look!")
P(U,'s8',"look!")
P(C,'c43',"let's look!")
P(U,'s9',"he must be hidden here, look!","0‿")
P(C,'c44',"he must be hidden here,","0‿")
P(U,'s10',"look!")
P(C,'c45',"let's look!")
P(U,'s11',"he must be hidden here.","0‿")
P(C,'c46',"he must be hidden here.","0‿")
P(T,'c40',"Susanna,")
P(T,'c41',"I'm half dead,",'',[([0,1],"I'm faint")])
P(T,'c42',"my breath")
P(T,'c43',"fails me.","0:me")
P(U,'s12',"Be more cheerful, more confident: he is already safe.","5‿;6:he is",[([4,5],"in safety"),([7,8],"already")])
P(C,'c47',"What a mistake I made!","0:what a;2:ever")
P(C,'c48',"what a mistake I made!","0:what a;2:ever")
P(C,'c49',"I can hardly believe it;","2:it")
P(C,'c50',"if I wronged you","0‿;1:with",[([1,2,3],"wrongly offended you")])
P(C,'c51',"I beg your pardon,")
P(C,'c52',"I beg your pardon;")
P(C,'c53',"but to play such a joke")
P(C,'c54',"is cruel after all.")
P(U,'s13',"Your follies deserve no pity, your follies deserve no pity.")
P(T,'c44',"Your follies deserve no pity, your follies deserve no pity.")
P(C,'c55',"I love you!")
P(T,'c45',"Don't say it!")
P(C,'c56',"I swear it to you!")
P(T,'c46',"You're lying!")
P(T,'c47',"I'm the wicked one, the faithless one,")
P(T,'c48',"who always deceives you.","0‿;0:who")
P(C,'c57',"That anger, Susanna,")
P(C,'c58',"help me to calm.","0‿;1:to")
P(U,'s14',"That's how anyone who suspects is condemned, that's how anyone who suspects is condemned.",
  "1:is;7:is",[([1,2],"is condemned"),([7,8],"is condemned")])
P(T,'c49',"So the faith")
P(T,'c50',"of a loving soul","1‿;2‿;2:soul (-ma)",[([1,2],"soul")])
P(T,'c51',"was to hope for so cruel a reward?","0:so")
P(C,'c59',"That anger, Susanna,")
P(C,'c60',"help me to calm.","0‿;1:to")
P(U,'s15',"That's how anyone who suspects is condemned, that's how anyone who suspects is condemned.",
  "1:is;7:is",[([1,2],"is condemned"),([7,8],"is condemned")])
P(U,'s16',"Madam!")
P(T,'c52',"Cruel man!")
P(C,'c61',"Rosina!")
P(T,'c53',"I am no longer that woman.","0:any more",[([0,2],"no longer")])
P(T,'c54',"but the wretched object","0‿;2‿")
P(T,'c55',"of your abandonment","1‿")
P(T,'c56',"whom you delight in driving to despair.","0‿;0:whom;4:make",[([1,2],"you delight"),([4,5],"drive to despair")])
P(C,'c62',"Confused, repentant,")
P(U,'s17',"Confused, repentant, he is punished too much, he is punished too much, have pity, have, have pity.",
  "2:he is;5:he is",[([8,9],"have pity"),([11,12],"have pity")])
P(C,'c63',"I'm punished too much,")
P(T,'c57',"Cruel man!")
P(T,'c58',"cruel man")
P(C,'c64',"ah!")
P(C,'c65',"I'm punished too much, have pity, have, have pity.","",[([3,4],"have pity"),([6,7],"have pity")])
P(T,'c59',"This soul cannot bear to suffer so great a wrong, ah! no, this soul cannot.",
  "1:so=ˈsi;6:not;12:not;7:can;13:can",[([0,1,2,3],"to suffer so great a wrong"),([6,7],"cannot"),([12,13],"cannot")])
P(C,'c66',"But the page shut in...","0‿")
P(T,'c60',"It was only to test you;")
P(C,'c67',"but the trembling, the palpitations...","1‿;0:but the=maj")
P(T,'c61',"it was only to tease you.")
P(C,'c68',"but so barbarous a letter?","0‿;3:so=ˈsi")
FIG = "1‿;2‿;5‿;6:to;8:through"
P(U,'s18',"The letter is Figaro's, and (it came) to you through Basilio...",FIG,[([0,1],"Figaro's")])
P(T,'c62',"The letter is Figaro's, and (it came) to you through Basilio...",FIG,[([0,1],"Figaro's")])
P(C,'c69',"Ah! traitors, I want...","1‿")
P(C,'c70',"I want...")
PER = "3‿;4‿;11‿;12‿;3:who;11:who;6:not it;14:not it"
PGG = [([3,4,5,6,7],"who doesn't grant it to others"),([11,12,13,14,15],"who doesn't grant it to others")]
P(U,'s19',"He who doesn't grant pardon to others doesn't deserve it, he who doesn't grant pardon to others doesn't deserve it.",PER,PGG)
P(T,'c63',"He who doesn't grant pardon to others doesn't deserve it, he who doesn't grant pardon to others doesn't deserve it.",PER,PGG)
P(C,'c71',"Well then, if you please,","2:to you",[([2,3],"you please")])
P(C,'c72',"let peace be mutual;","0‿")
P(C,'c73',"Rosina will not be unbending with me.","0‿;5:will be")
P(T,'c64',"Ah, how much, Susanna,")
P(T,'c65',"I am soft of heart!","2:of",[([1,2,3],"soft-hearted")])
P(T,'c66',"who (will ever again believe) in the fury of women","1‿;2:in the",[([0,1,2,3],"in women's fury")])

d = json.load(open(F, encoding='utf-8'))
d['notes'] = NOTES
seen = set()
for p in d['phrases']:
    key = (p['role'], p['id'])
    tr, ov, gg = S[key]
    seen.add(key)
    n = len(p['words'])
    gl = []; ip = []; el = [False] * n
    for w in p['words']:
        k = norm(w[0])
        if k not in LEX:
            sys.exit('missing lex %r in %s' % (k, key))
        g, i = LEX[k]
        gl.append(g); ip.append(i)
    for item in [x.strip() for x in ov.split(';') if x.strip()]:
        m = re.match(r'^(\d+)(‿?)(?::([^=]*))?(?:=(.*))?$', item)
        if not m:
            sys.exit('bad ov %r %s' % (item, key))
        idx = int(m.group(1))
        assert idx < n, (key, item)
        if m.group(2): el[idx] = True
        if m.group(3) is not None: gl[idx] = m.group(3)
        if m.group(4) is not None: ip[idx] = m.group(4)
    parts = []
    for j, w in enumerate(p['words']):
        w[1], w[2] = gl[j], ip[j]
        parts.append(ip[j] + ('‿' if el[j] and j < n - 1 else ' '))
    p['translation'] = tr
    p['ipa'] = ''.join(parts).strip()
    for a, _ in gg:
        assert all(0 <= x < n for x in a), (key, a)
    p['glossGroups'] = [{"words": list(a), "gloss": b} for a, b in gg]
missing = set(S) - seen
assert not missing, missing
json.dump(d, open(F, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('filled', len(seen), 'of', len(d['phrases']))
