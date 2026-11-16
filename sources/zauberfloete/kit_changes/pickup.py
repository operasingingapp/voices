# pickup.py FILE.xml : bar 1 was built in 1/8 (SEGS "1/1/8/..;2/2/4/..") -> make it an implicit pickup bar in 2/4 and drop bar 2's restated time
import re,sys
f=sys.argv[1]; s=open(f).read()
PB,PT,RB,RT=(sys.argv[2:6] if len(sys.argv)>5 else ('1','8','2','4'))  # pickup beats/type, real beats/type
def fix(part):
    part=re.sub(r'<measure number="1"( [^>]*)?>', lambda m: '<measure number="1" implicit="yes">' if 'implicit' not in m[0] else m[0], part,count=1)
    part=re.sub(r'<beats>'+PB+r'</beats>(\s*)<beat-type>'+PT+r'</beat-type>',r'<beats>'+RB+r'</beats>\1<beat-type>'+RT+r'</beat-type>',part,count=1)
    m2=re.search(r'<measure number="2"[^>]*>.*?</measure>',part,re.S)
    return part.replace(m2[0],re.sub(r'\s*<time>.*?</time>','',m2[0],count=1,flags=re.S),1)
parts=re.split(r'(?=<part id=)',s)
open(f,'w').write(''.join([parts[0]]+[fix(p) for p in parts[1:]])); print('pickup fixed')
