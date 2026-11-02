set -eo pipefail
cd /home/claude/ext/figaro/b6/build
T=/home/claude/ext/figaro/tools
python3 cut.py fin5_built.xml s4a.xml 467 696 P1,P2,P3,P4,P5,P9 "Finale: Ah! signor, signor!" 160 >/dev/null
python3 ../../b3/xfix.py s4a.xml s4.xml fixes_s4.txt | tail -1
python3 $T/settempo.py s4.xml "1:160;139:66"
python3 ../../b3/reqacc.py s4.xml | tail -1
python3 $T/reorder.py s4.xml P3,P2,P1,P4,P5,P6
