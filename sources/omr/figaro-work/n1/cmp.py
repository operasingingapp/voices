import re,sys
def load(p):
    V={}
    for line in open(p,encoding='utf-8'):
        line=line.strip()
        m=re.match(r'(\d+)\s+([SF]):\s*(.*)$',line)
        if not m: continue
        toks=[(t,l) for t,l in re.findall(r'(\S+?)(?:\s+"([^"]*)")?(?=\s|$)',m.group(3)) if not t.startswith('"')]
        V[(int(m.group(1)),m.group(2))]=toks
    return V
A=load(sys.argv[1]); B=load(sys.argv[2])
keys=sorted(set(A)|set(B))
nd=0
for k in keys:
    a=A.get(k,[]); b=B.get(k,[])
    na=[t for t,_ in a]; nb=[t for t,_ in b]
    la=[l for _,l in a if l]; lb=[l for _,l in b if l]
    if na!=nb or la!=lb:
        nd+=1
        print(f"{k[0]} {k[1]}:")
        if na!=nb: print("   A notes:",' '.join(na)); print("   B notes:",' '.join(nb))
        if la!=lb: print("   A words:",' | '.join(la)); print("   B words:",' | '.join(lb))
print('differing bar-lines:',nd,'of',len(keys))
