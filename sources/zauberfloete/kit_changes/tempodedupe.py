"""tempodedupe.py FILE.xml : drop a words-only tempo direction when the same measure has the same words with <sound tempo>"""
import re,sys
f=sys.argv[1]; s=open(f).read(); n=0
def fix(m):
    global n
    meas=m.group(0)
    withs=set(re.findall(r'<words>([^<]*)</words>\s*</direction-type>\s*<sound tempo',meas))
    for w in withs:
        pat=re.compile(r'\s*<direction placement="above">\s*<direction-type>\s*<words>'+re.escape(w)+r'</words>\s*</direction-type>\s*</direction>')
        meas,k=pat.subn('',meas,count=1); n+=k
    return meas
s=re.sub(r'<measure number="\d+"[^>]*>.*?</measure>',fix,s,flags=re.S)
open(f,'w').write(s); print('tempo words deduped',n)
