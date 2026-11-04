# cleanv.py IN OUT : strip slur parentheses from sung lines (the sung format has no slurs)
import re,sys
out=[]
for l in open(sys.argv[1]):
    if not l.startswith('#') and l.strip():
        parts=re.split(r'("[^"]*")',l)
        l=''.join(p if p.startswith('"') else re.sub(r'(:[whqesx.\d{}:]+[~*>^!t-]*)[()]+',r'\1',p) for p in parts)
    out.append(l)
open(sys.argv[2],'w').write(''.join(out))
