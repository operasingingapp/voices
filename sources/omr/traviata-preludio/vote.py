import sys,re
sys.path.insert(0,'/home/claude/voices/sources/omr/tools')
import piano_dsl as P
ST={"C":0,"D":2,"E":4,"F":5,"G":7,"A":9,"B":11}; L="CDEFGAB"; KEY={"F":1,"C":1,"G":1,"D":1}
def ev(path,shift=False):
    D={}
    for line in open(path):
        line=line.strip()
        if not line or line.startswith("#"): continue
        m=re.match(r"(\d+)\s+(RH|LH)(\d):\s*(.*)$",line)
        D.setdefault(int(m.group(1)),{})[(m.group(2),int(m.group(3)))]=m.group(4).split()
    out={}
    for bar,vs in D.items():
        for (h,v),toks in vs.items():
            S=out.setdefault((bar,h),set())
            for on,el in P.notes_for(toks,1 if h=="RH" else 2,v)[0]:
                if el.tag!="note" or el.find("rest") is not None: continue
                p=el.find("pitch"); s=p.findtext("step"); o=int(p.findtext("octave")); a=int(p.findtext("alter") or 0)
                if shift and h=="LH" and bar<=16:
                    i=L.index(s)+12; s=L[i%7]; o=o+i//7; a=KEY.get(s,0)  # crude: re-key
                g=el.find("grace") is not None
                S.add((on,s+{0:"",1:"#",-1:"b"}.get(a,str(a))+str(o),0 if g else int(el.findtext("duration"))))
    return out
B,C,O=ev('B.txt'),ev('C.txt'),ev('O.txt',True)
for k in sorted(set(B)|set(C)|set(O)):
    b,c,o=B.get(k),C.get(k),O.get(k)
    if b==c==o: continue
    tag = "C=B" if c==b else "C=O" if c==o else "B=O" if b==o and b is not None else "ALL3"
    print(k[0],k[1],tag)
    if tag!="C=B" and tag!="C=O":
        for lab,x in (("B",b),("C",c),("O",o)):
            if x is None: print("  ",lab,"missing"); continue
            others=[y for y in (b,c,o) if y is not None and y is not x]
            com=set.intersection(*([x]+others)) if others else set()
            print("  ",lab,sorted(x-com))
