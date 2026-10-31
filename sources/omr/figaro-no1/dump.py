import xml.etree.ElementTree as ET,sys
r=ET.parse(sys.argv[1]).getroot(); a,b=int(sys.argv[2]),int(sys.argv[3])
D=int(r.find(".//divisions").text)
for p in r.findall('part'):
  for m in p.findall('measure'):
    n=int(m.get('number'))
    if not a<=n<=b: continue
    pos=0; last=0; out={}
    for e in m:
        if e.tag=='backup': pos-=int(e.findtext('duration'))
        elif e.tag=='forward': pos+=int(e.findtext('duration'))
        elif e.tag=='note':
            d=int(e.findtext('duration') or 0); ch=e.find('chord') is not None
            on=last if ch else pos
            if e.find('rest') is not None: pn='r'
            else:
                al=float(e.findtext('pitch/alter') or 0); pn=e.findtext('pitch/step')+{1:'#',-1:'b',0:''}[int(al)]+e.findtext('pitch/octave')
            if e.find('grace') is not None: pn+='(g)'
            ly=[x.findtext('text') for x in e.findall('lyric')]
            out.setdefault((e.findtext('staff'),e.findtext('voice')),[]).append(f"{on/D:g}:{pn}/{d/D:g}"+(f"[{'|'.join(l or '' for l in ly)}]" if ly else ''))
            if not ch and e.find('grace') is None: last=pos; pos+=d
    print(p.get('id'),n,' || '.join(f"s{k[0]}v{k[1]} "+' '.join(v) for k,v in sorted(out.items())))
