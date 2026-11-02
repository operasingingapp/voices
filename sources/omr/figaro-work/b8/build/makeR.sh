set -eo pipefail
cd /home/claude/ext/figaro/b8
T=/home/claude/ext/figaro/tools
b(){ $T/build.sh trans/VM_$1.txt trans/PM_$1.txt build/d$1_built.xml "$2" "$3" "$4" | tail -1; [ -f build/fixes$1.txt ] || printf 'timesym 1 common\n' > build/fixes$1.txt; python3 ../b3/xfix.py build/d$1_built.xml build/d$1.xml build/fixes$1.txt | tail -1; sed -i '/<!DOCTYPE/d' build/d$1.xml; python3 $T/settempo.py build/d$1.xml "$5"; }
b 15R "1/4/4/0/Recitativo" "Recitativo: Che imbarazzo è mai questo!" "S:Susanna:S.:G/2,T:La Contessa:Gn.:G/2,C:Il Conte:Gf.:F/4" "1:100"
b 16R "1/4/4/0/Recitativo" "Recitativo: E perchè fosti meco" "S:Susanna:S.:G/2,C:Il Conte:Gf.:F/4,F:Figaro:F.:F/4" "1:100"
b 18R "1/4/4/0/Recitativo" "Recitativo: È decisa la lite" "M:Marcellina:M.:G/2,U:Don Curzio:Curz.:G/2/-1,C:Il Conte:Gf.:F/4,F:Figaro:F.:F/4,B:Bartolo:Brt.:F/4" "1:100"
b 19R "1/4/4/0/Recitativo;17/4/4/0/Andante a tempo" "Recitativo: Eccovi, o caro amico" "S:Susanna:S.:G/2,M:Marcellina:M.:G/2,F:Figaro:F.:F/4,B:Bartolo:Brt.:F/4" "1:100;17:72"
b 20R "1/4/4/0/Recitativo" "Recitativo: Andiam, andiam, bel paggio" "R:Barbarina:Barb.:G/2,H:Cherubino:Cher.:G/2" "1:100"
