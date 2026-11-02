set -eo pipefail
cd /home/claude/ext/figaro/b12
T=/home/claude/ext/figaro/tools
$T/build.sh trans/VM_10.txt trans/PM_10.txt build/d10_built.xml "1/4/4/0/Recitativo" "Recitativo: Che novità!" "C:Il Conte:Gf.:F/4,T:La Contessa:Gn.:G/2" | tail -1
python3 ../b3/xfix.py build/d10_built.xml build/d10.xml build/fixes10.txt | tail -1
sed -i '/<!DOCTYPE/d' build/d10.xml
python3 $T/settempo.py build/d10.xml "1:100"
python3 $T/reorder.py build/d10.xml P2,P1,P3
$T/build.sh trans/VM_11.txt trans/PM_11.txt build/d11_built.xml "1/3/4/0/Allegro spirituoso;124/3/4/0/a tempo" "No. 13 Terzetto: Susanna, or via, sortite" "S:Susanna:S.:G/2,T:La Contessa:Gn.:G/2,C:Il Conte:Gf.:F/4" | tail -1
python3 ../b3/xfix.py build/d11_built.xml build/d11.xml build/fixes11.txt | tail -1
sed -i '/<!DOCTYPE/d' build/d11.xml
python3 $T/settempo.py build/d11.xml "1:144;124:144"
