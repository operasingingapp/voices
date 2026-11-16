#!/bin/bash
# mkpiece.sh DIR CODE "SEGS" "TITLE" "SINGERS" [POST...]  (run from build/) ; POST steps are shell commands run in DIR with $X = xml
set -e; D=$1; C=$2; K=/home/claude/work/kit
cd $D; python3 $K/cleanv.py VM_$C.txt VM.clean.txt
bash $K/build.sh VM.clean.txt PM_$C.txt $C.xml "$3" "$4" "$5" 2>&1 | grep -iE "warn|error|Trace|missing" | grep -v "0 missing" || true
python3 $K/fix64.py $C.xml $C.xml >/dev/null; python3 $K/clef0fix.py $C.xml >/dev/null; python3 $K/fixtup.py $C.xml $C.xml >/dev/null
shift 5; X=$C.xml; for s in "$@"; do eval "$s"; done
python3 -c "import music21 as m;s=m.converter.parse('$C.xml');print('$C parsed',[len(p.getElementsByClass('Measure')) for p in s.parts])"
rm -rf rend; python3 $K/mkrend.py $C.xml PM_$C.txt rend >/dev/null 2>&1
