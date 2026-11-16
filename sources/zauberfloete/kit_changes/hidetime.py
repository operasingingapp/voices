"""hidetime.py FILE.xml BAR,BAR,... : time signatures at these bars are kept for counting but not printed
(partial bars split at a double bar / segno, and the restatement after them)"""
import re,sys
f,bars=sys.argv[1],{b for b in sys.argv[2].split(",") if b}
s=open(f).read()
def fix(m):
    if m.group(1) in bars:
        return re.sub(r'<time>', '<time print-object="no">', m.group(0))
    return m.group(0)
s=re.sub(r'<measure number="(\d+)"[^>]*>.*?</measure>', fix, s, flags=re.S)
open(f,'w').write(s); print("time hidden at", sorted(bars, key=int))
