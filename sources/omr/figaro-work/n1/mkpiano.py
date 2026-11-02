import json, io, sys, numpy as np, verovio, cairosvg
from PIL import Image
S=json.load(open('systems.json'))
X=sys.argv[1]; OUTD=sys.argv[2]
# piano-only copy of the file
import xml.etree.ElementTree as ET
t=ET.parse(X); r=t.getroot()
for sp in list(r.find('part-list')):
    if sp.get('id')!='P3': r.find('part-list').remove(sp)
for p in list(r.findall('part')):
    if p.get('id')!='P3': r.remove(p)
tk=verovio.toolkit(); tk.loadData(ET.tostring(r,encoding='unicode'))
for sy in S:
    pg=sy['page']; b0,b1=sy['bars']; st=sy['staves']
    im=Image.open(f'pg-{pg}.pgm'); a=np.array(im)<140
    t_,b_=st[-2][0],st[-1][1]
    col=a[t_:b_+1,:].sum(0)>=(b_-t_+1)*0.92
    xs=np.where(col)[0]; bl=[]
    for x in xs:
        if bl and x-bl[-1][-1]<=8: bl[-1].append(x)
        else: bl.append([x])
    bl=[int(np.mean(g)) for g in bl]
    nb=b1-b0+1
    if len(bl)-1!=nb: bl=None
    top=st[-2][0]-170; bot=st[-1][1]+150
    groups=[(b0,b1)] if nb<=2 else [(b0,b0+(nb+1)//2-1),(b0+(nb+1)//2,b1)]
    for (x0,x1) in groups:
        if bl:
            L=bl[x0-b0]-40; R=bl[x1-b0+1]+40
        else:
            L=150+(im.width-270)*(x0-b0)/nb-40; R=150+(im.width-270)*(x1-b0+1)/nb+40
        sc=im.crop((int(max(0,L)),max(0,top),int(min(im.width,R)),bot))
        sc=sc.resize((1500,int(sc.height*1500/sc.width)))
        tk.setOptions({"pageWidth":max(1200,(x1-x0+1)*520),"pageHeight":3000,"scale":60,"adjustPageHeight":True,"breaks":"none","header":"none","footer":"none"})
        tk.select({"measureRange":f"{x0}-{x1}"}); tk.redoLayout()
        rr=Image.open(io.BytesIO(cairosvg.svg2png(bytestring=tk.renderToSVG(1).encode(),background_color='white'))).convert('L')
        rr=rr.resize((1500,int(rr.height*1500/rr.width)))
        o=Image.new('L',(1500,sc.height+rr.height+14),255); o.paste(sc,(0,0)); o.paste(Image.new('L',(1500,4),0),(0,sc.height+5)); o.paste(rr,(0,sc.height+14))
        o.save(f'{OUTD}/p_bars{x0:03d}-{x1:03d}.png')
print('ok')
