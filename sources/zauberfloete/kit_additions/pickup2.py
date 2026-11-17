# pickup2.py FILE.xml BEATS TYPE : bar 1 was built in a short metre (e.g. SEGS "1/3/8/..;2/6/8/..");
# make bar 1 an implicit pickup shown in BEATS/TYPE and drop bar 2's restated time (generalises kit/pickup.py)
import re,sys
f,B,T=sys.argv[1],sys.argv[2],sys.argv[3]; s=open(f).read()
def fix(part):
    part=re.sub(r'<measure number="1"( [^>]*)?>', lambda m: '<measure number="1" implicit="yes">' if 'implicit' not in m[0] else m[0], part,count=1)
    m1=re.search(r'<measure number="1"[^>]*>.*?</measure>',part,re.S)
    part=part.replace(m1[0],re.sub(r'<beats>\d+</beats>(\s*)<beat-type>\d+</beat-type>',rf'<beats>{B}</beats>\1<beat-type>{T}</beat-type>',m1[0],count=1),1)
    m2=re.search(r'<measure number="2"[^>]*>.*?</measure>',part,re.S)
    return part.replace(m2[0],re.sub(r'\s*<time>.*?</time>','',m2[0],count=1,flags=re.S),1)
parts=re.split(r'(?=<part id=)',s)
open(f,'w').write(''.join([parts[0]]+[fix(p) for p in parts[1:]])); print('pickup fixed',B,T)
