# barsum.py FILE.xml : every bar of every part (each voice) adds up to its time signature; bar 1 may be a pickup
import sys, music21
s = music21.converter.parse(sys.argv[1]); bad = 0
for p in s.parts:
    ts = None
    for m in p.getElementsByClass('Measure'):
        if m.timeSignature: ts = m.timeSignature
        full = ts.barDuration.quarterLength
        vs = m.voices or [m]
        for v in vs:
            d = sum(n.duration.quarterLength for n in v.notesAndRests if not n.duration.isGrace)
            if abs(d - full) > 1e-6 and not (m.number == 1 and m.paddingLeft):
                bad += 1; print(p.partName or p.id, 'bar', m.number, 'voice', getattr(v,'id','-'), d, '!=', full)
print(sys.argv[1], 'bars not adding up:', bad)
