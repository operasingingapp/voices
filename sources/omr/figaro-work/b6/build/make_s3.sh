set -e
cd /home/claude/ext/figaro/b6
T=/home/claude/ext/figaro/tools
$T/build.sh build/V5.txt build/P5.txt build/fin5_built.xml "1/4/4/-3/Allegro;80/4/4/-3/Recitativo;126/3/8/-2/Molto Andante;167/4/4/-2/Allegro;328/3/8/1/Allegro con spirito;398/2/4/0/Andante;467/4/4/-1/Allegro molto;605/6/8/-2/Andante;697/4/4/-3/Allegro assai" "Finale: Esci omai, garzon malnato" "C:Il Conte:Conte:F/4,T:La Contessa:Cont.:G/2,S:Susanna:Sus.:G/2,F:Figaro:Fig.:F/4,A:Antonio:Ant.:F/4,M:Marcellina:Marc.:G/2,B:Bartolo:Bart.:F/4,O:Basilio:Bas.:G/2/-1" | tail -1
sed -i '/<!DOCTYPE/d' build/fin5_built.xml
cd build
python3 cut.py fin5_built.xml s3a.xml 328 467 P1,P2,P3,P4,P9 "Finale: Signori, di fuori son già i suonatori" 150 >/dev/null
python3 ../../b3/xfix.py s3a.xml s3b.xml fixes_s3.txt | tail -1
python3 $T/fix64.py s3b.xml s3.xml "P5:80:1:1;P5:81:1:1;P5:82:1:1;P5:82:1:1.5"
python3 $T/settempo.py s3.xml "1:150;71:72;140:152"
python3 ../../b3/reqacc.py s3.xml | tail -1
python3 $T/reorder.py s3.xml P3,P2,P1,P4,P5
