# words.py VM.txt : rebuild each singer's sung text from syllables (hyphen joins), per singer in bar order
import re, sys, collections
T = collections.OrderedDict()
for line in open(sys.argv[1]):
    m = re.match(r'(\d+) ([A-Z]+\d?): (.*)', line.strip())
    if not m: continue
    for syl in re.findall(r'"([^"]*)"', m.group(3)):
        T.setdefault(m.group(2), []).append(syl)
for k, v in T.items():
    out = ''
    for s in v:
        s = s.replace('_', ' ')
        out += s[:-1] if s.endswith('-') else s + ' '
    print(k + ':', out.strip())
