#!/usr/bin/env python3
"""Fetch street/path geometry from OpenStreetMap (Overpass) for linear places -> data/lines.json"""
import json, os, time, urllib.parse, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UA = 'KyotoPersonalMap/1.0 (personal non-commercial trip map)'
# id: (name regex, bbox s,w,n,e used both for the query and to clip the result)
LINES = {
    82: ('竹林の小径|竹林の道', (35.0130, 135.6680, 35.0195, 135.6760)),
    83: ('^渡月橋$', (35.0100, 135.6750, 35.0150, 135.6800)),
    88: ('^哲学の道$', (35.0080, 135.7880, 35.0300, 135.8000)),
    89: ('^花見小路通?$', (34.9985, 135.7735, 35.0040, 135.7765)),
    90: ('^(白川南通|新橋通|白川筋)$', (35.0040, 135.7730, 35.0070, 135.7765)),
    91: ('二寧坂|二年坂|産寧坂|三年坂', (34.9940, 135.7790, 35.0000, 135.7830)),
    95: ('^錦小路通$', (35.0040, 135.7605, 35.0060, 135.7680)),
    96: ('^先斗町', (35.0030, 135.7690, 35.0100, 135.7730)),
    100: ('蹴上インクライン|蹴上傾斜鉄道|インクライン', (35.0065, 135.7880, 35.0120, 135.7930)),
}


def overpass(q):
    for attempt in range(5):
        try:
            req = urllib.request.Request('https://overpass-api.de/api/interpreter',
                                         data=urllib.parse.urlencode({'data': q}).encode(), headers={'User-Agent': UA})
            with urllib.request.urlopen(req, timeout=90) as r:
                return json.load(r)
        except Exception as e:
            print('  retry', e)
            time.sleep(10 * (attempt + 1))
    return {'elements': []}


out = {}
for pid, (rx, (s, w, n, e)) in LINES.items():
    d = overpass(f'[out:json][timeout:60];way["name"~"{rx}"]({s},{w},{n},{e});out geom;')
    segs = []
    for el in d.get('elements', []):
        pts = [(round(g['lat'], 6), round(g['lon'], 6)) for g in el.get('geometry', [])]
        # clip: keep runs of points inside the bbox
        run = []
        for la, lo in pts:
            if s <= la <= n and w <= lo <= e:
                run.append([la, lo])
            else:
                if len(run) > 1: segs.append(run)
                run = []
        if len(run) > 1: segs.append(run)
    out[str(pid)] = segs
    print(pid, rx, 'ways', len(d.get('elements', [])), 'segments', len(segs), 'points', sum(map(len, segs)))
    time.sleep(2)
json.dump(out, open(os.path.join(ROOT, 'data/lines.json'), 'w'))
