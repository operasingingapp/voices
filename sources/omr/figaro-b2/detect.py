"""Systems and barlines on 300 dpi pages of a vocal score: staves; systems = staves joined by the left system line;
bars from the piano pair (the last two staves), whose barlines run through the gap between them."""
import numpy as np, json, sys
from PIL import Image
def groups(xs,gap=14):
    bl=[]
    for x in xs:
        if bl and x-bl[-1][-1]<=gap: bl[-1].append(x)
        else: bl.append([x])
    return [int(np.mean(g)) for g in bl]
out=[]
pages=[int(x) for x in sys.argv[1:]] if len(sys.argv)>1 else range(1,22)
for pg in pages:
    a=np.array(Image.open(f'pg-{pg:02d}.pgm'))<150
    H,W=a.shape
    ys=np.where(a.sum(1)>W*0.33)[0]
    lines=groups(ys,2)
    staves=[]; i=0
    while i+4<len(lines):
        g=lines[i:i+5]; d=np.diff(g)
        if d.min()>=12 and d.max()<=22 and all(a[y-1:y+2,:].any(0).sum()>W*0.5 for y in g):
            staves.append((g[0],g[-1])); i+=5
        else: i+=1
    # left end of each staff
    lefts=[]
    for t,b in staves:
        xs=np.where(a[t:b+1].mean(0)>=0.95)[0]; lefts.append(int(xs.min()) if len(xs) else 0)
    # join consecutive staves into a system when a vertical line at the left connects them
    systems=[[0]]
    for k in range(1,len(staves)):
        (t0,b0),(t1,b1)=staves[k-1],staves[k]
        x=min(lefts[k-1],lefts[k])
        col=a[b0:t1, max(0,x-3):x+12]
        joined=col.any(1).mean()>0.9
        if joined: systems[-1].append(k)
        else: systems.append([k])
    for s in systems:
        st=[staves[k] for k in s]
        if len(st)<2:
            out.append({"page":pg,"staves":st,"barlines":[],"note":"single staff"}); continue
        (t1,b1),(t2,b2)=st[-2],st[-1]
        w=lambda v: v|np.roll(v,1)|np.roll(v,-1)
        def det(s_,gp):
            # a barline runs through every staff of the system (a chord's stem only through the piano's)
            m=w(a[b1:t2].mean(0)>=gp)
            for (tt,bb) in st: m&=w(a[tt:bb+1].mean(0)>=s_)
            return groups(np.where(m)[0])
        strict=det(0.85,0.25); loose=det(0.75,0.15)
        bl=list(strict)
        if len(bl)>=2:
            while True:
                d=np.diff(bl); med=np.median(d); j=int(np.argmax(d))
                if d[j]<1.6*med: break
                c=[x for x in loose if bl[j]+0.3*med<x<bl[j+1]-0.3*med]
                if not c: break
                mid=(bl[j]+bl[j+1])/2; bl.insert(j+1,min(c,key=lambda x:abs(x-mid)))
        # system end
        row=a[t1-2:t1+3]; r=row.sum(1).argmax(); xs=np.where(row[r])[0]
        R=int(xs.max()) if len(xs) else 0
        if bl and R-bl[-1]>60: bl.append(R)
        out.append({"page":pg,"staves":[list(map(int,x)) for x in st],"barlines":bl})
json.dump(out,open('sys300.json','w'))
tot=0
for s in out:
    n=max(0,len(s['barlines'])-1); tot+=n
    print(s['page'], len(s['staves']), n, end=' | ')
print('\ntotal', tot)
