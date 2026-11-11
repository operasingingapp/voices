#!/bin/bash
# build.sh VOICES PIANO OUT.xml SEGS TITLE SINGERS -> MusicXML (840 divisions per quarter; {n:m} tuplets)
set -e
K=/home/claude/ext/boheme/kit; T=$(mktemp -d)
python3 $K/mk6.py "$1" "$2" $T/a.xml "$4" "$5" "$6"
(cd $K && python3 $K/finish2.py $T/a.xml $T/b.xml)
python3 $K/tup.py $T/b.xml $T/c.xml
python3 $K/dedupe.py $T/c.xml
python3 $K/beam.py $T/c.xml "$3"
python3 $K/tiefix.py "$3"
sed -i '/<!DOCTYPE/d' "$3"
python3 $K/reqacc.py "$3" --fix "$3" | tail -3
python3 $K/reqacc.py "$3" | tail -2
