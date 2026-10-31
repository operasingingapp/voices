#!/bin/bash
# make.sh PIECE : build PIECE_cur.xml from voices + scan piano + piano rewrites + fixes
set -e
P=$1
cat trans/M_*.txt > voices.txt
python3 build2.py $P voices.txt ${P}_built.xml 2>&1 | grep -v "^$" || true
python3 finish2.py ${P}_built.xml ${P}_a.xml > /dev/null
cp ${P}_a.xml ${P}_b.xml
for f in trans/PM_*.txt; do python3 apply_piano_sel.py ${P}_b.xml $f ${P}_b.xml; done
[ -f fixes_$P.txt ] && python3 fix2.py ${P}_b.xml fixes_$P.txt ${P}_b.xml
python3 finish2.py ${P}_b.xml ${P}_cur.xml
