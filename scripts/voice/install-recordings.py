import json, subprocess, os, glob
D='/home/claude/voices/src/standalone/recordings'
for a in sorted(glob.glob('/home/claude/ext/rec2/*.align.json')):
    base=os.path.basename(a)[:-len('.align.json')]
    pc,lab=base.rsplit('-',1)
    for part in ('soprano','fiordiligi','dorabella','alfonso'):
        if pc.endswith('-'+part): piece=pc[:-len(part)-1]; break
    A=json.load(open(a))
    out=f'{D}/{piece}'; os.makedirs(out,exist_ok=True)
    name=part+('' if lab=='100' else '-70')
    subprocess.run(['ffmpeg','-v','error','-y','-i',f'/home/claude/ext/rec2/{base}.wav','-ac','1','-af','loudnorm=I=-20:TP=-1.5:LRA=18','-ar','44100','-c:a','libmp3lame','-b:a','112k',f'{out}/{name}.mp3'],check=True)
    json.dump({'source':'Cantai (MuseScore Studio), on "ah"; rendered from the score'+('' if lab=='100' else ' at 70% of its tempo'),
               'tempo':1 if lab=='100' else 0.7,'duration':A['duration'],'onsets':{r['id']:r['audio'] for r in A['notes']}},
              open(f'{out}/{name}.json','w'),separators=(',',':'))
    print(piece,name,os.path.getsize(f'{out}/{name}.mp3')//1024,'KB')
