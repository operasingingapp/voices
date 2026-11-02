set -eo pipefail
cd /home/claude/ext/figaro/b6
T=/home/claude/ext/figaro/tools
$T/build.sh build/V5.txt build/P5.txt build/fin5_built.xml "1/4/4/-3/Allegro;80/4/4/-3/Recitativo;126/3/8/-2/Molto Andante;167/4/4/-2/Allegro;328/3/8/1/Allegro con spirito;398/2/4/0/Andante;467/4/4/-1/Allegro molto;605/6/8/-2/Andante;697/4/4/-3/Allegro assai;783/4/4/-3/Più Allegro" "Finale: Esci omai, garzon malnato" "C:Il Conte:Conte:F/4,T:La Contessa:Cont.:G/2,S:Susanna:Sus.:G/2,F:Figaro:Fig.:F/4,A:Antonio:Ant.:F/4,M:Marcellina:Marc.:G/2,B:Bartolo:Bart.:F/4,O:Basilio:Bas.:G/2/-1" | tail -1
sed -i '/<!DOCTYPE/d' build/fin5_built.xml
cd build
python3 cut.py fin5_built.xml s5a.xml 697 939 P1,P2,P3,P4,P6,P7,P8,P9 "Finale: Voi, signor, che giusto siete" 132 >/dev/null
python3 ../../b3/xfix.py s5a.xml s5.xml fixes_s5.txt | tail -1
python3 $T/settempo.py s5.xml "1:168;87:192;211:232"
python3 ../../b3/reqacc.py s5.xml | tail -1
python3 ../../b3/xfix.py s5.xml s5.xml fixes_s5_post.txt | tail -1
python3 $T/reorder.py s5.xml P3,P2,P5,P7,P1,P4,P6,P8
