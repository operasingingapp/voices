import sys, xml.etree.ElementTree as ET
t=ET.parse(sys.argv[1]); a,b=int(sys.argv[2]),int(sys.argv[3])
import sys
D=int(sys.argv[4]) if len(sys.argv)>4 else 12
for m in t.getroot().iter('measure'):
    n=int(m.get('number'))
    if not a<=n<=b: continue
    pos=0; last=0; out={}
    for e in m:
        if e.tag=='backup': pos-=int(e.find('duration').text)
        elif e.tag=='forward': pos+=int(e.find('duration').text)
        elif e.tag=='note':
            d=int(e.find('duration').text) if e.find('duration') is not None else 0
            ch=e.find('chord') is not None
            st=e.find('staff').text; v=e.find('voice').text
            on=last if ch else pos
            p='r' if e.find('rest') is not None else (e.find('pitch/step').text+({1:'#',-1:'b',0:''}[int(float(e.findtext('pitch/alter') or 0))])+e.find('pitch/octave').text)
            if e.find('grace') is not None: p+='(gr)'
            out.setdefault((st,v),[]).append(f"{on/D:g}:{p}/{d/D:g}")
            if not ch: last=pos; pos+=d
    print(n,' || '.join(f"S{k[0]}v{k[1]} "+' '.join(x) for k,x in sorted(out.items())))
