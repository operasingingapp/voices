# z.py page.png x0 y0 x1 y1 out  top:clef:step [top:clef:step]
import sys
from PIL import Image, ImageDraw
L="CDEFGAB"
a=sys.argv; im=Image.open(a[1]).convert('RGB'); x0,y0,x1,y1=map(int,a[2:6]); out=a[6]
Z=3; c=im.crop((x0,y0,x1,y1)).resize(((x1-x0)*Z,(y1-y0)*Z),Image.LANCZOS); d=ImageDraw.Draw(c)
for spec in a[7:]:
    top,clef,st=spec.split(':'); top=float(top); st=float(st)
    s,o=("F",5) if clef=="G" else ("A",3); i0=L.index(s)+7*o
    for k in range(-14,24):
        p=i0-k; y=(top+k*st-y0)*Z
        if not (0<y<c.height): continue
        col=(230,0,0) if k%2==0 else (0,110,230)
        d.line((0,y,25,y),fill=col,width=2); d.line((c.width-25,y,c.width,y),fill=col,width=2)
        for xx in range(30,c.width-30,9): d.point((xx,y),fill=col)
        d.text((28,y-12),L[p%7]+str(p//7),fill=col)
c.save(out)
