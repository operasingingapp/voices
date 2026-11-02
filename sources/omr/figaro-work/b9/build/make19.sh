set -e
cd /home/claude/ext/figaro/b9
T=/home/claude/ext/figaro/tools
$T/build.sh trans/VM_19.txt trans/PM_19.txt build/d19_built.xml "1/4/4/0/Andante;9/4/4/0/Allegretto;10/4/4/0/Andante;26/2/4/0/Andantino;77/4/4/0/Allegro" "No. 19 Recitativo ed Aria: E Susanna non vien! … Dove sono" "T:La Contessa:Gn.:G/2" | tail -2
python3 ../b3/xfix.py build/d19_built.xml build/d19.xml build/fixes19.txt | tail -1
sed -i '/<!DOCTYPE/d' build/d19.xml
python3 $T/settempo.py build/d19.xml "1:72;9:100;10:72;26:60;77:132"
