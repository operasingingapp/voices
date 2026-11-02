#!/bin/bash
# build.sh VOICES PIANO OUT.xml SEGS TITLE SINGERS  -> full pipeline (no fixes), then reqacc report
set -e
F=/home/claude/ext/figaro; T=$(mktemp -d)
python3 $F/b6/mk6.py "$1" "$2" $T/a.xml "$4" "$5" "$6"
python3 $F/b2/finish2.py $T/a.xml $T/b.xml
python3 $F/b5/tup.py $T/b.xml $T/c.xml
python3 $F/b5/dedupe.py $T/c.xml
python3 $F/b2/beam.py $T/c.xml "$3"
sed -i '/<!DOCTYPE/d' "$3"
python3 $F/b3/reqacc.py "$3" | tail -5
