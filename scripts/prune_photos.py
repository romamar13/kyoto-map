import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from citypaths import CACHE_PATH as CACHE, PHOTO_URL, ROOT
os.chdir(ROOT)
c=json.load(open(CACHE))
REMOVE={int(k):set(map(int,v.split(','))) for k,v in (a.split(':') for a in sys.argv[1:])}  # pid:1,3 (1-based)
for pid,rm in REMOVE.items():
    ph=c[str(pid)]
    keep=[p for i,p in enumerate(ph,1) if i not in rm]
    for i,p in enumerate(ph,1):
        if i in rm:
            for k in ('src','thumb'): 
                if os.path.exists(p[k]): os.remove(p[k])
    for i,p in enumerate(keep,1):
        for k,suf in (('src',''),('thumb','-t')):
            os.rename(p[k], p[k]+'.tmp')
    for i,p in enumerate(keep,1):
        for k,suf in (('src',''),('thumb','-t')):
            new=f'{PHOTO_URL}{pid}-{i}{suf}.jpg'; os.rename(p[k]+'.tmp', new); p[k]=new
    c[str(pid)]=keep
    print(pid,len(keep))
json.dump(c,open(CACHE,'w'),ensure_ascii=False,indent=1)
