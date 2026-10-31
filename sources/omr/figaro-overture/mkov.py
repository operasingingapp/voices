import json, io, sys, verovio, cairosvg
from PIL import Image, ImageDraw
S=json.load(open('sys300.json'))
X=sys.argv[1]; OUTD=sys.argv[2]
tk=verovio.toolkit(); tk.loadData(open(X).read())
bar=1
for sy in S:
    pg=sy['page']; bl=sy['barlines']; nb=len(bl)-1
    im=Image.open(f'hi/p-{pg}.pgm')
    top=sy['top']-150; bot=sy['bot']+110
    k=(nb+2)//3; size=-(-nb//k)
    for g in range(k):
        i0=g*size; i1=min(nb,(g+1)*size)-1
        if i0>i1: continue
        x0,x1=bar+i0,bar+i1
        sc=im.crop((max(0,bl[i0]-30),max(0,top),min(im.width,bl[i1+1]+30),bot))
        sc=sc.resize((1500,int(sc.height*1500/sc.width)))
        tk.setOptions({"pageWidth":max(1200,(x1-x0+1)*600),"pageHeight":4000,"scale":55,"adjustPageHeight":True,"breaks":"none","header":"none","footer":"none"})
        tk.select({"measureRange":f"{x0}-{x1}"}); tk.redoLayout()
        rr=Image.open(io.BytesIO(cairosvg.svg2png(bytestring=tk.renderToSVG(1).encode(),background_color='white'))).convert('L')
        rr=rr.resize((1500,int(rr.height*1500/rr.width)))
        o=Image.new('L',(1500,sc.height+rr.height+50),255); o.paste(sc,(0,0)); o.paste(Image.new('L',(1500,4),0),(0,sc.height+5))
        ImageDraw.Draw(o).text((10,sc.height+14),f"bars {x0}-{x1} (page {pg})",fill=0)
        o.paste(rr,(0,sc.height+50))
        o.save(f'{OUTD}/o_bars{x0:03d}-{x1:03d}.png')
    bar+=nb
print('last bar',bar-1)
