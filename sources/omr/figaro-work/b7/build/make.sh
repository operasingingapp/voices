set -e
cd /home/claude/ext/figaro/b7
T=/home/claude/ext/figaro/tools
$T/build.sh trans/VM_aria.txt trans/PM_aria.txt build/aria_built.xml "1/4/4/-3/Allegro vivace;92/4/4/-3/Adagio;96/4/4/-3/Tempo I" "Aria: Non so più cosa son, cosa faccio" "H:Cherubino:Ch.:G/2" >/dev/null
python3 ../b3/xfix.py build/aria_built.xml build/aria_cur.xml build/fixes_aria.txt | tail -1
sed -i '/<!DOCTYPE/d' build/aria_cur.xml; python3 $T/settempo.py build/aria_cur.xml "1:152;92:50;96:152"
$T/build.sh trans/VM_terz.txt trans/PM_terz.txt build/terz2.xml "1/4/4/-2/Allegro assai;121/4/4/-2/Recitativo;129/4/4/-2/in tempo" "Terzetto: Cosa sento!" "S:Susanna:S.:G/2,O:Basilio:Bas.:G/2/-1,C:Il Conte:Gf.:F/4" >/dev/null
python3 ../b3/reqacc_old.py build/terz2.xml --fix build/terz_cur.xml 2>&1 | tail -1
sed -i '/<!DOCTYPE/d' build/terz_cur.xml; python3 $T/settempo.py build/terz_cur.xml "1:152;121:80;129:152"
