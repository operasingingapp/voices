import json,sys;from PIL import Image,ImageDraw
S=json.load(open('sys300.json'))
for pg in map(int,sys.argv[1:]):
  im=Image.open(f'pg-{pg:02d}.pgm').convert('RGB'); d=ImageDraw.Draw(im)
  for s in S:
    if s['page']!=pg: continue
    t=s['staves'][0][0]; b=s['staves'][-1][1]
    for x in s['barlines']: d.rectangle((x-4,t-30,x+4,b+30),fill=(255,0,0))
    for (a,c) in s['staves']: d.rectangle((5,a,30,c),fill=(0,0,255))
  im.resize((im.width*2//5,im.height*2//5)).save(f'/tmp/ov{pg+15}.png')
