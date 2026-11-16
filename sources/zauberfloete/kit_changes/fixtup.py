"""fixtup.py IN OUT : tuplet groups whose notes cannot have whole durations at 840/quarter (e.g. nine 64ths in the time
of eight) get durations spread so the group fills its exact span (e.g. 47,47,46,... = 420)"""
import sys, xml.etree.ElementTree as ET
from fractions import Fraction as F
IN,OUT=sys.argv[1:3]; head=open(IN).read().split("<score-partwise",1)[0]
t=ET.parse(IN); TY={'64th':F(1,16),'32nd':F(1,8),'16th':F(1,4),'eighth':F(1,2),'quarter':F(1),'half':F(2)}
fixed=0
for m in t.getroot().iter('measure'):
    notes=[n for n in m.findall('note') if n.find('chord') is None and n.find('grace') is None]
    i=0
    while i<len(notes):
        tm=notes[i].find('time-modification')
        if tm is None: i+=1; continue
        a,nn=tm.findtext('actual-notes'),tm.findtext('normal-notes'); j=i
        while j<len(notes) and notes[j].find('time-modification') is not None and notes[j].findtext('time-modification/actual-notes')==a and notes[j].findtext('time-modification/normal-notes')==nn and notes[j].findtext('voice')==notes[i].findtext('voice'):
            j+=1
        grp=notes[i:j]
        exact=[840*TY[n.findtext('type')]*(F(3,2) if n.find('dot') is not None else 1)*F(int(nn),int(a)) for n in grp]
        if any(e.denominator!=1 for e in exact):
            tot=0; acc=F(0); old=sum(int(n.findtext('duration')) for n in grp)
            for n,e in zip(grp,exact):
                acc+=e; d=round(acc)-tot; tot+=d
                n.find('duration').text=str(d)
            delta=tot-old; fixed+=1
            if delta:  # keep the next backup in step
                kids=list(m); k=kids.index(grp[-1])+1
                while k<len(kids) and kids[k].tag!='backup': k+=1
                if k<len(kids):
                    b=kids[k].find('duration'); b.text=str(int(b.text)+delta)
        i=j
t.write(OUT,encoding='unicode'); s=open(OUT).read(); open(OUT,'w').write(head+s if not s.startswith('<?xml') else s)
print('fixtup groups',fixed)
