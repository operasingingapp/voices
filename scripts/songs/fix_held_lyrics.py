"""Lyric fixes to five OpenScore song scores whose words sit on the wrong notes or are missing (see notes per song)."""
from lxml import etree
import json
R='/home/claude/voices/content/pieces/song-'
def load(s):
    t=etree.parse(R+s+'/score.musicxml'); man=json.load(open(R+s+'/manifest.json'))
    pid=next(m['source']['xmlPartId'] for m in man['partMapping'] if m['key']=='voice')
    return t,next(p for p in t.getroot().iter('part') if p.get('id')==pid)
def notes(part,bar):
    m=next(x for x in part.iter('measure') if x.get('number')==bar); pos=last=0; out=[]
    for el in m:
        if el.tag=='note':
            if el.find('grace') is not None: continue
            ch=el.find('chord') is not None; on=last if ch else pos
            if not ch: last=pos; pos+=int(el.findtext('duration'))
            if el.find('rest') is None: out.append((on,el.findtext('voice') or '1',el))
        elif el.tag=='backup': pos-=int(el.findtext('duration'))
        elif el.tag=='forward': pos+=int(el.findtext('duration'))
    return out
def at(part,bar,on,voice): return next(n for o,v,n in notes(part,bar) if o==on and v==voice)
def lyr(n,verse): return next((l for l in n.iter('lyric') if l.get('number')==str(verse)),None)
def drop(n,verse):
    l=lyr(n,verse)
    if l is not None: n.remove(l)
def put(n,verse,text,syl):
    drop(n,verse)
    l=etree.Element('lyric',number=str(verse)); etree.SubElement(l,'syllabic').text=syl; etree.SubElement(l,'text').text=text
    ls=[x for x in n if x.tag=='lyric']; after=[x for x in n if x.tag in('play','listen')]
    # keep verses in order
    nxt=next((x for x in ls if int(x.get('number'))>verse),None)
    if nxt is not None: nxt.addprevious(l)
    elif after: after[0].addprevious(l)
    else: n.append(l)
def save(t,s): t.write(R+s+'/score.musicxml',xml_declaration=True,encoding='UTF-8',doctype=t.docinfo.doctype or None)

# Mahler: "Nicht bei Tag": the half and quarter G before "Tag" (bar 26) carry no words
s='mahler-ich-hab-ein-gluhend-messer'; t,p=load(s)
put(at(p,'26',0,'1'),1,'Nicht','single'); put(at(p,'26',1080,'1'),1,'bei','single'); save(t,s)
# Schumann, Wenn ich in deine Augen seh: "so werd' ich ganz und gar gesund": the two notes before "gar" (bar 7) are bare
s='schumann-wenn-ich-in-deine-augen-seh'; t,p=load(s)
put(at(p,'7',0,'2'),1,'ganz','single'); put(at(p,'7',3,'2'),1,'und','single'); save(t,s)
# Schubert, Frühlingssehnsucht bar 35: verses 2-4 share the second voice's rhythm (crotchet, quaver, quaver), as verse 4
# already shows; verses 2 and 3 had their syllables scattered over both voices out of order
s='schubert-fruhlingssehnsucht'; t,p=load(s)
a0,a18=at(p,'35',0,'1'),at(p,'35',18,'1'); b0,b12,b18=at(p,'35',0,'2'),at(p,'35',12,'2'),at(p,'35',18,'2')
for n in (a0,a18,b0,b12,b18):
    for v in (2,3): drop(n,v)
put(b0,2,'eilt','single'); put(b12,2,'sie','single'); put(b18,2,'da','begin')
put(b0,3,'grü','middle'); put(b12,3,'ssen','middle'); put(b18,3,'des','end')
save(t,s)
# Brahms, O liebliche Wangen bar 13: verse 1 "zu schau-en, zu grü-ssen": "schau-en," belongs on the first voice's A and G,
# "zu" on its last quaver; the second voice is verse 2's own rhythm ("Him-mel auf Er-den")
s='brahms-o-liebliche-wangen'; t,p=load(s)
put(at(p,'13',0,'1'),1,'schau','begin'); put(at(p,'13',2,'1'),1,'en,','end'); put(at(p,'13',10,'1'),1,'zu','single')
for o in (0,2): drop(at(p,'13',o,'2'),1)
save(t,s)
# Schumann, Weit weit bar 6: verse 3 "Handschuh mir geschenkt": "mir" sits on the first note, not the bar's last
s='schumann-weit-weit'; t,p=load(s)
drop(at(p,'6',10,'1'),3); put(at(p,'6',0,'1'),3,'mir','single'); save(t,s)
print('ok')
