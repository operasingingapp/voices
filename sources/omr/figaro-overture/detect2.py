import numpy as np, json, glob
from PIL import Image
def groups(xs,gap=14):
    bl=[]
    for x in xs:
        if bl and x-bl[-1][-1]<=gap: bl[-1].append(x)
        else: bl.append([x])
    return [int(np.mean(g)) for g in bl]
out=[]
for f in sorted(glob.glob('hi/p-*.pgm')):
    a=np.array(Image.open(f))<150
    H,W=a.shape
    ys=np.where(a.sum(1)>W*0.33)[0]
    lines=groups(ys,2)
    staves=[]; i=0
    while i+4<len(lines):
        g=lines[i:i+5]; d=np.diff(g)
        if d.min()>=14 and d.max()<=21 and all(a[y-1:y+2,:].any(0).sum()>W*0.6 for y in g): staves.append((g[0],g[-1])); i+=5
        else: i+=1
    for k in range(0,len(staves)-1,2):
        (t1,b1),(t2,b2)=staves[k],staves[k+1]
        def det(s,gp):
            w=lambda v: v|np.roll(v,1)|np.roll(v,-1)
            return groups(np.where(w(a[t1:b1+1].mean(0)>=s)&w(a[t2:b2+1].mean(0)>=s)&w(a[b1:t2].mean(0)>=gp))[0])
        strict=det(0.95,0.6); loose=det(0.95,0.25)
        bl=list(strict)
        while True:
            d=np.diff(bl); med=np.median(d)
            j=int(np.argmax(d))
            if d[j]<1.55*med: break
            c=[x for x in loose if bl[j]+0.3*med<x<bl[j+1]-0.3*med]
            if not c: break
            mid=(bl[j]+bl[j+1])/2; bl.insert(j+1,min(c,key=lambda x:abs(x-mid)))
        out.append({"page":int(f[-5]),"top":t1,"bot":b2,"barlines":bl})
json.dump(out,open('sys300.json','w'))
from collections import defaultdict; p=defaultdict(list)
for s in out: p[s['page']].append(len(s['barlines'])-1)
print(dict(p), sum(sum(v) for v in p.values()), len(out))
