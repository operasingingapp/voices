# mkdisp.py A B PDIFF_OUT SYSDIR OUT : write piano dispute file with system image per bar
import re,sys,os
A,B,PD,SYS,OUT=sys.argv[1:6]
bars=sorted({int(l.split()[0]) for l in open(PD) if re.match(r'^\d+ ',l)})
def load(f):
    d={};sysof={};cur=None
    for l in open(f):
        m=re.search(r'# (sys\d+) \(page (\d+)\) starts[a-z ]* bar (\d+)',l)
        if m: cur=m.group(1)+'_page'+m.group(2)+'.png'; continue
        m=re.match(r'^(\d+) ',l)
        if m:
            b=int(m.group(1)); d.setdefault(b,[]).append(l.rstrip()); sysof.setdefault(b,cur)
    return d,sysof
a,sa=load(A); b,_=load(B)
o=[]
for n in bars:
    o.append(f"== bar {n}   image: {os.path.join(SYS,sa.get(n) or '?')}")
    o+= ['X '+l for l in a.get(n,['(missing)'])]+['Y '+l for l in b.get(n,['(missing)'])]
open(OUT,'w').write('\n'.join(o)+'\n'); print(len(bars),'bars')
