#!/bin/bash
# buildpiece.sh SNN [REND_DIR] : clean + build + (pickup) + xfix + checks, from SNN/config.sh
set -e
W=/home/claude/work; P=$1; cd $W/$P; source ./config.sh
python3 $W/kit/cleanv.py VM_$P.txt VM_$P.clean.txt
bash $W/kit/build.sh VM_$P.clean.txt PM_$P.txt $P.xml "$SEGS" "$TITLE" "$SINGERS" | tail -2
[ -n "$PICKUP" ] && python3 $W/kit_local/pickup2.py $P.xml $PICKUP
[ -s xfix.txt ] && python3 $W/kit/xfix.py $P.xml $P.xml xfix.txt && echo "xfix applied: $(wc -l < xfix.txt) lines"
[ -n "$TEMPO" ] && python3 $W/kit/tempomap.py $P.xml "$TEMPO" | head -1 && python3 $W/kit_local/dedupe_tempo.py $P.xml
python3 $W/kit/reqacc.py $P.xml | tail -1
python3 $W/kit_local/barsum.py $P.xml | tail -2
python3 -c "import music21; s=music21.converter.parse('$P.xml'); print('music21 ok', len(s.parts), 'staves')"
[ -n "$2" ] && python3 $W/kit/mkrend.py $P.xml PM_$P.txt $W/$2/ | tail -1
true
