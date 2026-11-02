set -eo pipefail
cd /home/claude/ext/figaro/b11
T=/home/claude/ext/figaro/tools
b(){ $T/build.sh trans/VM_$1.txt trans/PM_$1.txt build/d$1_built.xml "$2" "$3" "$4" | tail -1; python3 ../b3/xfix.py build/d$1_built.xml build/d$1.xml build/fixes$1.txt | tail -1; sed -i '/<!DOCTYPE/d' build/d$1.xml; python3 $T/settempo.py build/d$1.xml "$5"; }
b 12 "1/4/4/0/Recitativo" "Recitativo: Dunque voi non aprite?" "C:Il Conte:Gf.:F/4,T:La Contessa:Gn.:G/2" "1:100"
b 13 "1/4/4/1/Allegro assai" "No. 14 Duettino: Aprite, presto, aprite" "S:Susanna:S.:G/2,H:Cherubino:Ch.:G/2" "1:144"
b 14 "1/4/4/0/Recitativo" "Recitativo: Oh guarda il demonietto!" "S:Susanna:S.:G/2" "1:100"
b 15 "1/4/4/0/Recitativo" "Recitativo: Tutto è come il lasciai" "C:Il Conte:Gf.:F/4,T:La Contessa:Gn.:G/2" "1:100"
python3 $T/reorder.py build/d12.xml P2,P1,P3; python3 $T/reorder.py build/d15.xml P2,P1,P3
