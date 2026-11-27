# fill.py IN OUT: every singer code gets a line in every bar; an empty divisi line (b/c) copies its main line (unison)
import re,sys
CODES="V F A G B D M K1 K1b K1c K3 K3b K4 K4b".split()
L=open(sys.argv[1]).read().split('\n'); bars={}; order=[]
for i,l in enumerate(L):
    m=re.match(r'(\d+) (\w+): (.*)$',l)
    if m: bars.setdefault(int(m[1]),{})[m[2]]=i
def rest(body): return not re.search(r'(?<![\w"])[A-G][#bn]?\d', re.sub(r'"[^"]*"','',body))
add={}; nfill=0; ncopy=0
for b,d in bars.items():
    for c in CODES:
        main=c.rstrip('bc') if c[-1] in 'bc' and c.startswith('K') else None
        # two notes: K1b and K1c share the lower one, so an empty c line copies its b line when that sings
        if main and c.endswith('c') and main+'b' in d and not rest(L[d[main+'b']].split(': ',1)[1]): main=main+'b'
        if main and main in d:
            mb=L[d[main]].split(': ',1)[1]
            if c not in d or rest(L[d[c]].split(': ',1)[1]):
                if not rest(mb):
                    line=f"{b} {c}: {mb}"; ncopy+=1
                    if c in d: L[d[c]]=line
                    else: add.setdefault(d[main],[]).append(line)
                    continue
        if c not in d:
            add.setdefault(max(d.values()),[]).append(f"{b} {c}: r:q."); nfill+=1
out=[]
for i,l in enumerate(L):
    out.append(l); out+=add.get(i,[])
open(sys.argv[2],'w').write('\n'.join(out)); print('filled',nfill,'unison copies',ncopy)
