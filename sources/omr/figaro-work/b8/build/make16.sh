set -e
cd /home/claude/ext/figaro/b8
/home/claude/ext/figaro/tools/build.sh trans/VM_16.txt trans/PM_16.txt build/d16_built.xml "1/4/4/0/Andante;29/4/4/3/" "Duetto: Crudel! perchè finora" "S:Susanna:S.:G/2,C:Il Conte:Gf.:F/4" | tail -1
python3 ../b3/xfix.py build/d16_built.xml build/d16_cur.xml build/fixes16.txt | tail -1
sed -i '/<!DOCTYPE/d' build/d16_cur.xml
python3 /home/claude/ext/figaro/tools/settempo.py build/d16_cur.xml "1:88"
