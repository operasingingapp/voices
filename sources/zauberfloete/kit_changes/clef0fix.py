"""clef0fix.py FILE.xml : a clef change written at the very start of bar 1 (clef:G as the first token) replaces the
part's opening clef instead of printing two clefs"""
import re,sys
f=sys.argv[1]; s=open(f).read()
pat=re.compile(r'(<measure number="1"[^>]*>\s*<attributes>.*?)(</attributes>\s*<attributes>\s*((?:<clef number="\d">.*?</clef>\s*)+)</attributes>)',re.S)
def fix(m):
    head=m.group(1)
    for c in re.findall(r'<clef number="(\d)">.*?</clef>',m.group(3),re.S):
        new=re.search(rf'<clef number="{c}">.*?</clef>',m.group(3),re.S).group(0)
        head=re.sub(rf'<clef number="{c}">.*?</clef>',new,head,count=1,flags=re.S)
    return head+'</attributes>'
s,n=pat.subn(fix,s); open(f,'w').write(s); print('clef0fix',n)
