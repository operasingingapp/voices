# fixes.py: fresh-check fixes on V_03.txt / P_03.txt (exact line replacements; rerun after stitch+fill)
import sys
FV = [
 ('166 A: C4:e "la" g:D4:e', '166 A: C4:e* "la" g:D4:e'),  # staccato under the slur end (fresh check pp.27-29)
]
FV += [
 ('53 A: Eb4:e "oc-"', '53 A: Eb4:e* "oc-"'),                 # staccato as in bars 31/41/49 (fresh check pp.20-23)
 ('58 A: A3:q.~ "va"', '58 A: hp:< A3:q.~ "va"'),               # crescendo over the voice, bars 58-59
 ('59 A: A3:e C4:e F3:e* "Li-"', '59 A: A3:e hp:end C4:e F3:e* "Li-"'),
]
FP = [
 ('17 RH1: hp:> F5+F6:q.~( hp:end', '17 RH1: hp:> G5+G6:q.~( hp:end'),   # bars 17-18 printed a step above bars 7-8
 ('18 RH1: F5+F6:e Eb5+Eb6:e D5+D6:e)', '18 RH1: G5+G6:e F5+F6:e Eb5+Eb6:e)'),
]
for path, F in (("V_03.txt", FV), ("P_03.txt", FP)):
    s = open(path).read()
    for a, b in F:
        if b in s: continue
        assert s.count(a) == 1, (path, a); s = s.replace(a, b)
    open(path, "w").write(s)
import re
s = open("V_03.txt").read()
# bar 130, every part: "te" on the 3rd 16th and "ab-" on the 4th, as printed (fresh check pp.24-26, confirmed on a 4x crop)
s, n = re.subn(r'^(130 \w+: .*)"te_ab-" ([A-G]\w*\d:s)$', r'\1"te" \2 "ab-"', s, flags=re.M)
open("V_03.txt", "w").write(s); print("bar 130 lines", n)
print("fixes applied")
