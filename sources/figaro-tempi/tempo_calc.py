import json,statistics
exec(open('tempo_data.py').read())
S=json.load(open('sections.json'))
GAP=1.5
def sec(t): m,s=t.split(':'); return int(m)*60+int(s)
def dur(v):
  L=v if isinstance(v,list) else [v]; return sum(sec(x)-GAP for x in L)
def now(members):
  t=0
  for p,idx in members:
    ss=S[p]['sections']; ids=range(len(ss)) if idx is None else idx
    t+=sum(ss[i]['quarters']*60/ss[i]['bpm'] for i in ids)
  return t
res={}
for g,(mem,recs) in G.items():
  T=now(mem); r={k:T/dur(v) for k,v in recs.items()}
  med=statistics.median(r.values()); res[g]=(T,r,med)
  print(f"{g:22s} now {T/60:5.2f}m  factor median {med:4.2f}  ", " ".join(f"{k[:3]}{x:.2f}" for k,x in r.items()))
json.dump({g:{"now":T,"r":r,"med":m} for g,(T,r,m) in res.items()},open('tempo_res.json','w'))
