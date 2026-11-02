import json, sys, re
# Fill lang_aria.json / lang_recit.json. Entries keyed by (role, id).
# words: "gloss=ipa" separated by " | "; ipa ending with ‿ = elided into next word (score "_").
# Cross-word nasal assimilation (n -> m/ŋ/ɱ) is applied automatically when building the phrase ipa,
# unless the word carries punctuation; word-level ipa stays the isolated pronunciation.
D = {}
NOTES = {}
def P(f, role, pid, tr, words, gg=()):
    D.setdefault(f, {})[(role, pid)] = (tr, words, gg)

A = 'lang_aria.json'
R = 'lang_recit.json'
NOTES[A] = ("Libretto by Lorenzo Da Ponte (1786). Words follow the engraving's spelling (sò, foco, cangiar, desio, se for sé, "
            "all' acqua with a separated apostrophe and all ombra without one, all'erbe). IPA follows sung Italian conventions: "
            "stressed syllable marked, elisions (two words on one note in the score) joined with ‿, open e/o as ɛ/ɔ, intervocalic s voiced, "
            "nasal assimilation across and within words (n before p/b/m, k/g, f/v); desio is sung in three syllables (de.zi.o). "
            "Translation literal, for meaning.")
NOTES[R] = ("Libretto by Lorenzo Da Ponte (1786). Words follow the engraving's spelling (quì, rè, vò, mè, finchè, perchè, si for sì, "
            "ambasciato re for ambasciatore, crede a for credea, s'il, odii, sul tal, Aproposito, instruitelo, menzogne). "
            "IPA follows sung Italian conventions: stressed syllable marked, elisions (two words on one note in the score) joined with ‿, "
            "open e/o as ɛ/ɔ, intervocalic s voiced, nasal assimilation across and within words; mai, dei, destinai are sung in two "
            "syllables, instruitelo in five (in.stru.i.te.lo), diavol in two; ha is [a]. Translation literal, for meaning.")

# ---------------- aria ----------------
NONSO = ("I no longer know what I am, what I'm doing,",
         "not=non | know=ˈsɔ | any more=ˈpju | what=ˈkɔ.za | I am=ˈson | what=ˈkɔ.za | I do=ˈfat.tʃo",
         [([0, 1, 2], "I no longer know")])
ORDI1 = ("now I'm on fire, now I am ice,",
         "now=or | of=di | fire=ˈfɔ.ko‿ | now=ˈo.ra | I am=ˈso.no | of=di | ice=ˈɡjat.tʃo",
         [([1, 2], "on fire"), ([5, 6], "made of ice")])
CANG = ("every woman makes me change colour,",
        "every=ˈoɲ.ɲi | woman=ˈdɔn.na | change=kanˈdʒar | of=di | colour=koˈlo.re",
        [([2, 3, 4], "(makes me) change colour")])
PALP = ("every woman makes my heart race,",
        "every=ˈoɲ.ɲi | woman=ˈdɔn.na | me=mi | makes=ˈfa | throb=pal.piˈtar",
        [([2, 3, 4], "makes my heart race")])
PALP_END = ("every woman makes my heart race.",) + PALP[1:]
P(A, 'cherubino', 'c1', *NONSO)
P(A, 'cherubino', 'c2', *ORDI1)
P(A, 'cherubino', 'c3', *CANG)
P(A, 'cherubino', 'c4', *PALP)
P(A, 'cherubino', 'c5', *PALP)
P(A, 'cherubino', 'c6', *PALP_END)
P(A, 'cherubino', 'c7', "At the mere names of love, of delight,",
  "only=ˈso.lo‿ | at the=ai | names=ˈno.mi | of love=daˈmor | of=di | delight=diˈlɛt.to")
P(A, 'cherubino', 'c8', "my breast is stirred, my breast is shaken,",
  "me=mi | itself=si | is troubled=ˈtur.ba | me=mi | itself alters=ˈsal.te.ra‿ | the=il | breast=ˈpɛt.to",
  [([0, 1, 2], "is stirred in me"), ([3, 4], "is shaken in me")])
P(A, 'cherubino', 'c9', "and a longing forces me to speak of love",
  "and=e | to=a | speak=parˈla.re | me=mi | forces=ˈsfɔr.tsa | of love=daˈmo.re")
P(A, 'cherubino', 'c10', "a longing,", "a=un | longing=deˈzi.o")
P(A, 'cherubino', 'c11', "a longing that I can't explain, a longing,",
  "a=un | longing=deˈzi.o | that I=ˈki.o | not=non | can=ˈpɔs.so | explain=spjeˈɡar | a=un | longing=deˈzi.o")
P(A, 'cherubino', 'c12', "a longing that I can't explain.",
  "a=un | longing=deˈzi.o | that I=ˈki.o | not=non | can=ˈpɔs.so | explain=spjeˈɡar")
P(A, 'cherubino', 'c13', *NONSO)
P(A, 'cherubino', 'c14', *ORDI1)
P(A, 'cherubino', 'c15', *CANG)
P(A, 'cherubino', 'c16', *PALP)
P(A, 'cherubino', 'c17', *PALP)
P(A, 'cherubino', 'c18', *PALP_END)
P(A, 'cherubino', 'c19', "I talk of love when awake,",
  "I speak=ˈpar.lo | of love=daˈmor | waking=veʎˈʎan.do")
P(A, 'cherubino', 'c20', "I talk of love when dreaming, to the water, to the shade, to the mountains,",
  "I speak=ˈpar.lo | of love=daˈmor | dreaming=soɲˈɲan.do | to the=all | water=ˈak.kwa‿ | to the=all | shade=ˈom.bra‿ | to the=ai | mountains=ˈmon.ti")
P(A, 'cherubino', 'c21', "to the flowers, to the grass, to the springs,",
  "to the=ai | flowers=ˈfjo.ri‿ | to the=all | grass=ˈɛr.be‿ | to the=ai | springs=ˈfon.ti")
ECO = ("to the echo, to the air, to the winds, which carry the sound of the empty words away with them,",
       "to the=all | echo=ˈɛ.ko‿ | to the=all | air=ˈa.rja‿ | to the=ai | winds=ˈvɛn.ti | which=ke‿ | the=il | sound=ˈswɔn | of the=de | empty=ˈva.ni‿ | words=atˈtʃɛn.ti | carry=ˈpɔr.ta.no | away=ˈvi.a | with=kon | themselves=ˈse",
       [([12, 13], "carry away"), ([14, 15], "with them")])
P(A, 'cherubino', 'c22', *ECO)
P(A, 'cherubino', 'c23', "carry away with them.",
  "carry=ˈpɔr.ta.no | away=ˈvi.a | with=kon | themselves=ˈse", [([0, 1], "carry away"), ([2, 3], "with them")])
P(A, 'cherubino', 'c24', "I talk of love when awake, I talk of love when dreaming",
  "I speak=ˈpar.lo | of love=daˈmor | waking=veʎˈʎan.do | I speak=ˈpar.lo | of love=daˈmor | dreaming=soɲˈɲan.do")
P(A, 'cherubino', 'c25', "to the water, to the shade,",
  "to the=all | water=ˈak.kwa‿ | to the=all | shade=ˈom.bra")
P(A, 'cherubino', 'c26', "to the mountains, to the flowers,",
  "to the=ai | mountains=ˈmon.ti‿ | to the=ai | flowers=ˈfjo.ri")
P(A, 'cherubino', 'c27', "to the grass,", "to the grass=alˈlɛr.be")
P(A, 'cherubino', 'c28', "to the springs,", "to the=ai | springs=ˈfon.ti")
P(A, 'cherubino', 'c29', *ECO)
P(A, 'cherubino', 'c30', "carry away with them. And if I have no one to hear me,",
  "carry=ˈpɔr.ta.no | away=ˈvi.a | with=kon | themselves=ˈse | and=e | if=se | not=non | I have=ˈɔ | who=ki | may hear me=ˈmɔ.da",
  [([0, 1], "carry away"), ([2, 3], "with them"), ([6, 7, 8], "I have no one")])
P(A, 'cherubino', 'c31', "and if I have no one to hear me,",
  "and=e | if=se | not=non | I have=ˈɔ | who=ki | may hear me=ˈmɔ.da", [([2, 3, 4], "I have no one")])
CONME = ("I talk of love to myself,", "I speak=ˈpar.lo | of love=daˈmor | with=kon | me=ˈme",
         [([2, 3], "to myself")])
P(A, 'cherubino', 'c32', *CONME)
P(A, 'cherubino', 'c33', "to myself,", "with=kon | me=ˈme", [([0, 1], "to myself")])
P(A, 'cherubino', 'c34', "I talk of love to myself.", *CONME[1:])

# ---------------- recitative ----------------
P(R, 'susanna', 's1', "Hush, someone's coming — the Count!",
  "hush=ˈta.tʃi | comes=ˈvjɛn | people=ˈdʒɛn.te | the=il | Count=ˈkon.te", [([1, 2], "someone's coming")])
P(R, 'susanna', 's2', "oh, poor me!", "oh=ˈɔ | me=ˈme | wretched=meˈski.na", [([1, 2], "poor me")])
P(R, 'count', 'c1', "Susanna, you seem flustered and confused to me",
  "Susanna=suˈzan.na | you=tu | to me=mi | seem=ˈsem.bri | agitated=a.dʒiˈta.ta‿ | and=e | confused=koɱˈfu.za")
P(R, 'susanna', 's3', "My lord...", "my lord=siɲˈɲor")
P(R, 'susanna', 's4', "I beg your pardon...", "I=ˈi.o | ask=ˈkjɛ.do | pardon=ˈsku.za")
P(R, 'susanna', 's5', "but if by chance...", "but=ma | if=se | ever=ˈma.i")
P(R, 'susanna', 's6', "caught here", "here=ˈkwi | surprised=sorˈpre.za")
P(R, 'susanna', 's7', "for pity's sake! go away", "for=per | pity=ka.riˈta | leave=parˈti.te",
  [([0, 1], "for pity's sake")])
P(R, 'count', 'c2', "One moment, and I'll leave you,",
  "one=un | moment=moˈmen.to‿ | and=e | you=ti | I leave=ˈlaʃ.ʃo")
P(R, 'susanna', 's8', "I'm not listening to anything.", "not=non | I hear=ˈɔ.do | nothing=ˈnul.la")
P(R, 'count', 'c3', "listen!", "listen=ˈɔ.di")
P(R, 'count', 'c4', "A word or two:", "two=ˈdu.e | words=paˈrɔ.le", [([0, 1], "a word or two")])
P(R, 'count', 'c5', "you know that the King has named me ambassador to London;",
  "you=tu | know=ˈsa.i | that=ke‿ | ambassa-=am.baʃ.ʃaˈto‿ | -dor=re | to=a | London=ˈlon.dra‿ | the=il | King=ˈre | me=mi | declared=di.kjaˈrɔ",
  [([3, 4], "ambassador")])
P(R, 'count', 'c6', "I've decided to take Figaro with me.",
  "to=di | take=konˈdur | with me=ˈme.ko | Figaro=ˈfi.ɡa.ro | I decided=de.stiˈna.i")
P(R, 'susanna', 's9', "My lord, if I dared...", "my lord=siɲˈɲor | if=se‿ | I dared=oˈzas.si")
P(R, 'count', 'c7', "Speak, speak, my dear!", "speak=ˈpar.la | speak=ˈpar.la | my=ˈmi.a | dear=ˈka.ra")
P(R, 'count', 'c8', "and with the right you take over me today, as long as you live, ask, command, prescribe.",
  "and=e | with=kon | that=ˈkwel | right=ˈdrit.to | that today=ˈkɔd.dʒi | you take=ˈprɛn.di | over=su | me=ˈme | as long as=fiŋˈke | you=tu | live=ˈvi.vi | ask=ˈkjɛ.di | command=imˈpo.ni | prescribe=preˈskri.vi")
P(R, 'susanna', 's10', "Let me go, my lord, I take no rights, I want none, I understand none",
  "let me go=laʃˈʃa.te.mi | my lord=siɲˈɲor | rights=ˈdrit.ti | not=non | I take=ˈprɛn.do | not=non | of them=ne | I want=ˈvɔ | not=non | of them=ne‿ | I understand=inˈtɛn.do")
P(R, 'susanna', 's11', "Oh, unhappy me!", "oh=ˈɔ | me=ˈme‿ | unhappy=iɱ.feˈli.tʃe")
P(R, 'count', 'c9', "Ah no, Susanna, I want to make you happy!",
  "ah=ˈa | no=ˈnɔ | Susanna=suˈzan.na | I=ˈi.o | you=ti | want=ˈvɔ | make=ˈfar | happy=feˈli.tʃe")
P(R, 'count', 'c10', "you know well how much I love you;",
  "you=tu | well=ˈbɛn | know=ˈsa.i | how much=ˈkwan.to‿ | I=ˈi.o | love you=ˈta.mo")
P(R, 'count', 'c11', "Basilio has already told you everything; now listen, if for a few moments with me in the garden at nightfall...",
  "to=a | you=ˈte | Basilio=baˈzi.ljo | everything=ˈtut.to | already=ˈdʒa | told=ˈdis.se | now=or | listen=ˈsɛn.ti | if=se | for=per | few=ˈpɔ.ki | moments=moˈmen.ti | with me=ˈme.ko‿ | in=in | garden=dʒarˈdin | at the=sull | darkening=im.bruˈnir | of the=del | day=ˈdʒor.no",
  [([15, 16, 17, 18], "at nightfall")])
P(R, 'count', 'c12', "ah, for this favour I would pay...",
  "ah=ˈa | for=per | this=ˈkwe.sto | favour=faˈvo.re | I=ˈi.o | would pay=pa.ɡeˈrɛ.i")
P(R, 'basilio', 'b1', "He went out a little while ago",
  "he has=ˈɛ‿ | gone out=uʃˈʃi.to | little=ˈpɔ.ko | ago=ˈfa", [([2, 3], "a little while ago")])
P(R, 'count', 'c13', "Who's speaking?", "who=ki | speaks=ˈpar.la")
P(R, 'susanna', 's12', "O gods!", "O=ˈɔ | gods=ˈdɛ.i")
P(R, 'count', 'c14', "Go out, and let no one come in",
  "go out=ˈɛʃ.ʃi | and=e‿ | anyone=alˈkun | not=non | enter=ˈen.tri", [([2, 3, 4], "let no one come in")])
P(R, 'susanna', 's13', "That I should leave you here alone?",
  "that I=ˈki.o | you=vi | leave=ˈlaʃ.ʃo | here=ˈkwi | alone=ˈso.lo")
P(R, 'basilio', 'b2', "He'll be with Madame, I'll go and look for him.",
  "at=da | Madame=maˈda.ma | he will be=saˈra | I go=ˈva.do‿ | to=a | look for him=tʃerˈkar.lo",
  [([0, 1], "at Madame's")])
P(R, 'count', 'c15', "I'll put myself back here...", "here=ˈkwi | behind=ˈdjɛ.tro | myself=mi | I will put=porˈrɔ")
P(R, 'susanna', 's14', "Don't hide!", "not=non | yourself=vi | hide=tʃeˈla.te")
P(R, 'count', 'c16', "Be quiet, and see to it that he leaves.",
  "be quiet=ˈta.tʃi | and=e | try=ˈtʃer.ka | that he=ˈkɛ.i | leave=ˈpar.ta")
P(R, 'susanna', 's15', "Oh dear!", "alas=ˈɔ.i | me=ˈme", [([0, 1], "oh dear")])
P(R, 'susanna', 's16', "what are you doing!", "what=ke | you do=ˈfa.te")
P(R, 'basilio', 'b3', "Susanna, heaven save you;",
  "Susanna=suˈzan.na‿ | the=il | heaven=ˈtʃɛl | you=vi | save=ˈsal.vi")
P(R, 'basilio', 'b4', "would you by chance have seen the Count?",
  "would you have=aˈvre.ste‿ | by=a | chance=ˈka.zo | seen=veˈdu.to‿ | the=il | Count=ˈkon.te",
  [([1, 2], "by chance")])
P(R, 'susanna', 's17', "And what would the Count be doing with me? Come on, out you go.",
  "and=e | what=ˈkɔ.za | must=ˈde.ve | do=ˈfar | with me=ˈme.ko‿ | the=il | Count=ˈkon.te | courage=ˈa.ni.mo‿ | go out=uʃˈʃi.te",
  [([7, 8], "come on, out")])
P(R, 'basilio', 'b5', "Wait, listen, Figaro is looking for him.",
  "wait=as.petˈta.te | listen=senˈti.te | Figaro=ˈfi.ɡa.ro | for=di | him=ˈlu.i | looks=ˈtʃer.ka",
  [([3, 4, 5], "is looking for him")])
P(R, 'susanna', 's18', "Oh heavens!", "oh=ˈɔ | heaven=ˈtʃɛ.lo")
P(R, 'susanna', 's19', "the one looking for him is the man who, after you, hates him most.",
  "him=li | seeks=ˈtʃer.ka | who=ki | after=ˈdo.po | you=ˈvo.i | most=ˈpju | hates him=ˈlɔ.dja")
P(R, 'count', 'c17', "Let's see how he serves me.", "let's see=veˈdjam | how=ˈko.me | me=mi | serves=ˈsɛr.ve")
P(R, 'basilio', 'b6', "I have never heard in moral teaching that one who loves the wife should hate the husband; I mean that the Count loves you..",
  "I=ˈi.o | not=non | have=ˈɔ | ever=ˈma.i | in the=ˈnel.la | moral=moˈral | heard=senˈti.to | that one=ˈku.no | who loves=ˈka.mi | the=la | wife=ˈmoʎ.ʎe‿ | should hate=ˈɔ.dji | the=il | husband=maˈri.to | for=per | say=ˈdir | that=ke‿ | the=il | Count=ˈkon.te | loves you=ˈva.ma",
  [([14, 15], "that is to say")])
P(R, 'susanna', 's20', "Get out, vile agent of another's licentiousness: I have no need of your moral, of the Count, of his love...",
  "get out=sorˈti.te | vile=ˈvil | minister=miˈni.stro | of=dell | others'=alˈtru.i | unbridledness=sfre.naˈtet.tsa | I=ˈi.o | not=non | have=ˈɔ | need=ˈdwɔ.po | of the=ˈdel.la | your=ˈvɔ.stra | moral=moˈra.le | of the=del | Count=ˈkon.te | of=del | his=ˈsu.o‿ | love=aˈmor",
  [([7, 8, 9], "I have no need")])
P(R, 'basilio', 'b7', "There's no harm in it.", "not=non | there is=ˈtʃɛ‿ | any=alˈkun | harm=ˈma.le")
P(R, 'basilio', 'b8', "Everyone has his own tastes; I thought you would prefer as a lover, as all women do, a lord who is generous, prudent and wise to a young lout, to a page...",
  "has=ˈa | everyone=tʃaˈskun | the=i | his=ˈswɔ.i | tastes=ˈɡu.sti | I=ˈi.o | to myself=mi | believed=kreˈde | (-ed)=a | that=ke | prefer=pre.feˈrir | you should=doˈve.ste | as=per | lover=aˈman.te | as=ˈko.me | do=ˈfan | all=ˈtut.te | of them=ˈkwan.te | a=un | lord=siɲˈɲor | generous=li.beˈral | prudent=pruˈdɛn.te‿ | and=e | wise=ˈsad.dʒo | to=a‿ | a=un | young lout=dʒo.viˈna.stro | to=a | a=un | page=ˈpad.dʒo",
  [([6, 7, 8], "I thought"), ([16, 17], "all of them")])
P(R, 'susanna', 's21', "To Cherubino!", "to=a | Cherubino=ke.ruˈbi.no")
P(R, 'basilio', 'b9', "To Cherubino, little cherub of love, who this morning at daybreak was hanging around here trying to get in.",
  "to=a | Cherubino=ke.ruˈbi.no | cherub=ke.ruˈbin | of love=daˈmo.re | who today=ˈkɔd.dʒi | at the=sul | making=ˈfar | of the=del | day=ˈdʒor.no | was strolling=pas.sedˈdʒa.va | here=ˈkwi | around=inˈtor.no | to=per | enter=enˈtrar",
  [([5, 6, 7, 8], "at daybreak")])
P(R, 'susanna', 's22', "Malicious man, this is a lie.",
  "man=ˈwɔm | malicious=maˈliɲ.ɲo | a=un | imposture=im.poˈstu.ra‿ | is=ɛ | this=ˈkwe.sta")
P(R, 'basilio', 'b10', "Is it malice toward you for someone with eyes in his head? And that little song, tell me in confidence, I'm a friend and tell nothing to others: is it for you, for Madame?",
  "is=ˈɛ‿ | a=un | malicious one=maˈliɲ.ɲo | with=kon | you=ˈvo.i | who=ki‿ | has=ˈa | the=ʎi | eyes=ˈɔk.ki‿ | in=in | head=ˈtɛ.sta | and=e | that=ˈkwel.la | little song=kan.tsoˈnet.ta | tell me=ˈdi.te.mi‿ | in=in | confidence=koɱ.fiˈdɛn.tsa | I=ˈi.o | am=ˈso.no‿ | friend=aˈmi.ko | and=ed | to others=alˈtru.i | nothing=ˈnul.la | I tell=ˈdi.ko | is it=ˈɛ | for=per | you=ˈvo.i | for=per | Madame=maˈda.ma",
  [([8, 9, 10], "eyes in his head")])
P(R, 'susanna', 's23', "(Who the devil told him that?)",
  "who=ki | devil=ˈdja.vol | it to him=ʎel | has=ˈa | told=ˈdet.to", [([0, 1], "who the devil")])
P(R, 'basilio', 'b11', "By the way, my girl, teach him better,",
  "by the way=a.proˈpɔ.zi.to | daughter=ˈfiʎ.ʎa | instruct him=in.struˈi.te.lo | better=ˈmɛʎ.ʎo")
P(R, 'basilio', 'b12', "he looks at her at table so often, and with such immodesty, that if the Count notices...",
  "he=ˈeʎ.ʎi | her=la | looks at=ˈɡwar.da | at=a | table=ˈta.vo.la | so=ˈsi | often=ˈspes.so | and=e | with=kon | such=ˈta.le‿ | immodesty=im.moˈdɛ.stja | that=ke | if the=sil | Count=ˈkon.te | notices=sakˈkɔr.dʒe")
P(R, 'basilio', 'b13', "and on that point, you know, he is a beast.",
  "and=e | on the=sul | such=ˈtal | point=ˈpun.to | you know=saˈpe.te | he=ˈeʎ.ʎi‿ | is=ɛ | a=ˈu.na | beast=ˈbɛ.stja",
  [([1, 2, 3], "on that point")])
P(R, 'susanna', 's24', "Villain!", "villain=ʃel.leˈra.to")
P(R, 'susanna', 's25', "and why do you go about spreading such lies?",
  "and=e | why=perˈke | go=anˈda.te | you=ˈvo.i | such=ˈta.i | lies=menˈdzoɲ.ɲe | spreading=sparˈdʒɛn.do")
P(R, 'basilio', 'b14', "I?", "I=ˈi.o")
P(R, 'basilio', 'b15', "what an injustice!", "what=ke‿ | injustice=in.dʒuˈstit.tsja")
P(R, 'basilio', 'b16', "what I buy, I sell; to what everyone says I don't add a hair",
  "what=kwel | that=ke | buy=ˈkom.pro‿ | I=ˈi.o | sell=ˈven.do | to=a | what=kwel | that=ke | all=ˈtut.ti | say=ˈdi.ko.no | I=ˈi.o | not=non | add=adˈdʒuŋ.ɡo‿ | a=un | hair=ˈpe.lo",
  [([13, 14], "a single thing")])
P(R, 'count', 'c18', "What!", "how=ˈko.me")
P(R, 'count', 'c19', "what does everyone say?", "what=ke | say=ˈdi.kon | all=ˈtut.ti")
P(R, 'basilio', 'b17', "Oh, splendid!", "oh=ˈɔ | lovely=ˈbɛl.la")
P(R, 'susanna', 's26', "Oh heavens!", "oh=ˈɔ | heaven=ˈtʃɛ.lo")

PUNCT = re.compile(r"[,.;:!?)\]…]+$")
def assimilate(ipa, nxt):
    """n at the end of a word before p/b/m, k/ɡ, f/v of the next word."""
    if not ipa.endswith('n'):
        return ipa
    c = nxt.lstrip('ˈ')[:1]
    if c in 'pbm': return ipa[:-1] + 'm'
    if c in 'kɡ': return ipa[:-1] + 'ŋ'
    if c in 'fv': return ipa[:-1] + 'ɱ'
    return ipa

for f, ph in D.items():
    d = json.load(open(f))
    d['notes'] = NOTES[f]
    seen = set()
    for p in d['phrases']:
        key = (p['role'], p['id'])
        tr, ws, gg = ph[key]
        seen.add(key)
        items = [w.strip() for w in ws.split(' | ')]
        assert len(items) == len(p['words']), (f, key, len(items), len(p['words']))
        segs = []
        for w, it in zip(p['words'], items):
            g, ipa = it.split('=', 1)
            el = ipa.endswith('‿')
            ipa = ipa.rstrip('‿')
            w[1], w[2] = g, ipa
            segs.append([w[0], ipa, el])
        out = ''
        for i, (txt, ipa, el) in enumerate(segs):
            if i + 1 < len(segs) and not PUNCT.search(txt):
                ipa = assimilate(ipa, segs[i + 1][1])
            out += ipa + ('‿' if el else ' ')
        p['translation'] = tr
        p['ipa'] = out.strip()
        p['glossGroups'] = [{"words": list(a), "gloss": b} for a, b in gg]
    assert seen == set(ph), (f, set(ph) - seen)
    json.dump(d, open(f, 'w'), ensure_ascii=False, indent=1)
    print(f, 'ok', len(seen))
