# mkrend.py XML PFILE OUTDIR [barOffset] : render each printed system's bars (from "# page NNN system K starts bar B" remarks)
import re,sys,io,os,verovio,cairosvg
from PIL import Image
X,PF,OUT=sys.argv[1:4]; off=int(sys.argv[4]) if len(sys.argv)>4 else 0
os.makedirs(OUT,exist_ok=True)
starts=[]
for l in open(PF):
    m=re.search(r'page 0*(\d+) system (\d+) starts bar (\d+)',l)
    if m: starts.append((int(m[1]),int(m[2]),int(m[3])))
import xml.etree.ElementTree as ET
last=max(int(m.get('number')) for m in ET.parse(X).getroot().find('part').findall('measure'))
tk=verovio.toolkit(); tk.loadData(open(X).read())
for i,(pg,sy,b) in enumerate(starts):
    e=(starts[i+1][2]-1) if i+1<len(starts) else last
    b+=off; e+=off
    tk.setOptions({"pageWidth":max(1400,(e-b+1)*550),"pageHeight":6000,"scale":50,"adjustPageHeight":True,"breaks":"none","header":"none","footer":"none","lyricSize":4.0})
    tk.select({"measureRange":f"{b}-{e}"}); tk.redoLayout()
    im=Image.open(io.BytesIO(cairosvg.svg2png(bytestring=tk.renderToSVG(1).encode(),background_color='white'))).convert('L')
    if im.width>2400: im=im.resize((2400,int(im.height*2400/im.width)))
    im.save(f"{OUT}/p{pg:03d}_s{sy}_bars{b:03d}-{e:03d}.png")
print(len(starts),'systems')
