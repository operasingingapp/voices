set -eo pipefail
cd /home/claude/ext/figaro/b8
T=/home/claude/ext/figaro/tools
$T/build.sh trans/VM_17.txt trans/PM_17.txt build/d17_built.xml "1/4/4/0/Maestoso;5/4/4/0/Presto;14/4/4/0/Andante;17/4/4/0/Allegro;41/2/2/2/Allegro maestoso;88/2/2/2/Allegro assai" "No. 17 Recitativo ed Aria: Hai già vinta la causa!" "C:Il Conte:Gf.:F/4" | tail -2
python3 ../b3/xfix.py build/d17_built.xml build/d17_cur.xml build/fixes17.txt | tail -1
sed -i '/<!DOCTYPE/d' build/d17_cur.xml
python3 $T/settempo.py build/d17_cur.xml "1:60;5:108;14:60;17:116;41:132;88:152"
