#!/bin/bash
# make4.sh : build both numbers from the merged transcriptions, finish, triplet groups, fixes
set -e
cd /home/claude/ext/figaro/b4
python3 mk4.py trans/VM_recit.txt trans/PM_recit.txt recit_built.xml 0 4 "Le nozze di Figaro: Recitativo (Tutto ancor non ho perso)" "Recitativo" "M:Marcellina:M.:G/2,S:Susanna:S.:G/2"
python3 mk4.py trans/VM_duet.txt trans/PM_duet.txt duet_built.xml 3 4 "Le nozze di Figaro: No. 5 Duettino (Via resti servita)" "Allegro" "S:Susanna:S.:G/2,M:Marcellina:M.:G/2"
for p in recit duet; do
  python3 /home/claude/ext/figaro/b2/finish2.py ${p}_built.xml ${p}_cur.xml > /dev/null
  python3 tup.py ${p}_cur.xml ${p}_cur.xml 1,59,63 > /dev/null
  python3 dedupe.py ${p}_cur.xml
  [ -f fixes_$p.txt ] && python3 /home/claude/ext/figaro/b3/xfix.py ${p}_cur.xml ${p}_cur.xml fixes_$p.txt > /dev/null
  python3 /home/claude/ext/figaro/b3/reqacc.py ${p}_cur.xml 2>&1 | tail -1
done
python3 - <<'PY'
import xml.etree.ElementTree as ET
for f,tempo in (('recit_cur.xml',75),('duet_cur.xml',132)):
    head=open(f).read().split("<score-partwise",1)[0]
    t=ET.parse(f); r=t.getroot(); m=r.find('part').find('measure')
    if any(s.get('tempo') for s in r.iter('sound')): continue
    d=ET.Element('direction',placement='above'); ET.SubElement(ET.SubElement(d,'direction-type'),'words').text=''
    ET.SubElement(d,'sound',tempo=str(tempo))
    kids=list(m); j=next((i for i,x in enumerate(kids) if x.tag=='note'),len(kids)); m.insert(j,d)
    ET.indent(t,space='  ')
    with open(f,'wb') as o: o.write(head.encode()); t.write(o,encoding='utf-8',xml_declaration=False)
PY
