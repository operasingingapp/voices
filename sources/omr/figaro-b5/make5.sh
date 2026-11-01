#!/bin/bash
# make5.sh : build the numbers of pages 101-119 from the merged transcriptions, finish, triplets, fixes, tempo
set -e
cd /home/claude/ext/figaro/b5
CSH="C:La Contessa:Cont.:G/2,S:Susanna:Sus.:G/2,H:Cherubino:Cher.:G/2"
build() { # name voices piano fifths beats title tempoword singers tupletbars tempo
  python3 ../b4/mk4.py trans/$2 trans/$3 $1_built.xml $4 $5 "$6" "$7" "$8" > /dev/null
  python3 ../b2/finish2.py $1_built.xml $1_cur.xml > /dev/null
  python3 tup.py $1_cur.xml $1_cur.xml $9 > /dev/null
  python3 dedupe.py $1_cur.xml
  [ -f fixes_$1.txt ] && python3 ../b3/xfix.py $1_cur.xml $1_cur.xml fixes_$1.txt > /dev/null
  python3 ../b3/reqacc.py $1_cur.xml 2>&1 | tail -1
  python3 - $1_cur.xml ${10} <<'PY'
import sys, xml.etree.ElementTree as ET
f, tempo = sys.argv[1], sys.argv[2]
head = open(f).read().split("<score-partwise", 1)[0]
t = ET.parse(f); r = t.getroot(); m = r.find('part').find('measure')
# a short first bar (pickup) is marked implicit
if 'aria' in f:
    for part in r.findall('part'): part.find('measure').set('implicit', 'yes')
# printed "tr" words become trill marks on the note that starts where the word stands, on that staff
for part in r.findall('part'):
    for m in part.findall('measure'):
        pos = 0; last = 0; dirs = []; notes = []
        for e in list(m):
            if e.tag == 'backup': pos -= int(e.findtext('duration'))
            elif e.tag == 'forward': pos += int(e.findtext('duration'))
            elif e.tag == 'direction' and (e.findtext('direction-type/words') or '').strip() == 'tr': dirs.append((pos, e.findtext('staff'), e))
            elif e.tag == 'note':
                on = last if e.find('chord') is not None else pos
                if e.find('chord') is None and e.find('grace') is None: last = pos; pos += int(e.findtext('duration'))
                if e.find('rest') is None and e.find('grace') is None: notes.append((on, e))
        for q, st, d in dirs:
            cand = sorted([(on, n) for on, n in notes if on >= q and (st is None or n.findtext('staff') == st)], key=lambda x: x[0])
            if not cand: continue
            nxt = cand[0][1]
            no = nxt.find('notations')
            if no is None:
                no = ET.Element('notations'); ks = list(nxt)
                j = max(k for k, x in enumerate(ks) if x.tag in ('type','dot','accidental','time-modification','stem','staff','beam')) + 1; nxt.insert(j, no)
            ET.SubElement(ET.SubElement(no, 'ornaments'), 'trill-mark'); m.remove(d)
if not any(s.get('tempo') for s in r.iter('sound')):
    m = r.find('part').find('measure')
    d = ET.Element('direction', placement='above'); ET.SubElement(ET.SubElement(d, 'direction-type'), 'words').text = ''
    ET.SubElement(d, 'sound', tempo=tempo)
    kids = list(m); j = next((i for i, x in enumerate(kids) if x.tag == 'note'), len(kids)); m.insert(j, d)
ET.indent(t, space='  ')
with open(f, 'wb') as o: o.write(head.encode()); t.write(o, encoding='utf-8', xml_declaration=False)
PY
}
build recitA VM_recitA.txt PM_recitA.txt 0 4 "Le nozze di Figaro: Recitativo (Quanto duolmi, Susanna)" "Recitativo" "$CSH" "" ${T_RA:-81}
build recitB VM_recitB.txt PM_recitB.txt 0 4 "Le nozze di Figaro: Recitativo (Bravo! che bella voce!)" "Recitativo" "$CSH" "" ${T_RB:-81}
build recitC VM_recitC.txt PM_recitC.txt 0 4 "Le nozze di Figaro: Recitativo (Quante buffonerie!)" "Recitativo" "$CSH,O:Il Conte:Conte:F/4" "" ${T_RC:-83}
[ -f trans/PM_canzona.txt ] && build canzona VM_canzona.txt PM_canzona.txt -2 2 "Le nozze di Figaro: No. 11 Canzona (Voi che sapete)" "Andante con moto" "H:Cherubino:Cher.:G/2" "14,16,67,69" ${T_CA:-53}
[ -f trans/PM_aria.txt ] && build aria VM_aria.txt PM_aria.txt 1 2 "Le nozze di Figaro: No. 12 Aria (Venite, inginocchiatevi)" "Allegretto" "S:Susanna:Sus.:G/2" "111,112,113,114" ${T_AR:-84}
true
