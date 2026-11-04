# stitch.py OUT IN1 IN2 ... : join chunk files (sung or piano) into one, renumbering bars (each chunk starts at bar 1)
import re,sys
out=[]; off=0
for f in sys.argv[2:]:
    mx=0
    for l in open(f):
        m=re.match(r'(\d+)(\s+\S+:.*)',l)
        if m and not l.startswith('#'):
            b=int(m[1]); mx=max(mx,b); out.append(f"{b+off}{m[2]}\n"); continue
        l=re.sub(r'(starts bar |^# bar |JUDGE bar |MARKS bar |FIX bar |^# )(\d+)', lambda x: x[1]+str(int(x[2])+off) if x[1]!='# ' else x[0], l)
        out.append(l)
    out.append(f"# ---- end of {f} (bars {off+1}-{off+mx})\n"); off+=mx
open(sys.argv[1],'w').write(''.join(out)); print('bars',off)
