#!/usr/bin/env python3
"""Top up places with < 3 photos using Wikimedia Commons file search."""
import json, os, re, subprocess, sys, glob
sys.path.insert(0, os.path.dirname(__file__))
from fetch_photos import api, download, BAD, CACHE_PATH, PHOTOS, ROOT

# Hand-tuned search terms where the name alone is too ambiguous
TERMS = {
    8: ['Ebisu Jinja Kyoto Higashiyama', 'ゑびす神社 京都'], 11: ['円通寺 (京都市)', 'Entsuji Kyoto Hiei view garden'], 13: ['Genkoan Kyoto window', '源光庵 京都'],
    18: ['法界寺 日野', 'Hokaiji Fushimi Kyoto'], 27: ['Jonan-gu Kyoto shrine', '城南宮 本殿'], 46: ['松ヶ崎大黒天 京都'],
    90: ['Gion Shirakawa', 'Tatsumi-bashi Kyoto'], 104: ['Byodoin Omotesando Uji', '宇治 抹茶 店 平等院'], 106: ['Rurikoin Kyoto Yase'],
}

def search(term):
    d = api('commons', {'action': 'query', 'generator': 'search', 'gsrnamespace': 6, 'gsrlimit': 15,
                        'gsrsearch': f'{term} filetype:bitmap', 'prop': 'imageinfo',
                        'iiprop': 'url|size|mime|extmetadata', 'iiurlwidth': 960,
                        'iiextmetadatafilter': 'Artist|LicenseShortName'})
    pages = sorted(d.get('query', {}).get('pages', []), key=lambda p: p.get('index', 99))
    return [(p['title'], p['imageinfo'][0]) for p in pages if p.get('imageinfo')]

cache = json.load(open(CACHE_PATH))
for pid, terms in TERMS.items():
    photos = cache.get(str(pid), [])
    if len(photos) >= 3:
        continue
    seen = {ph['page'] for ph in photos}
    for term in terms:
        for title, ii in search(term):
            if len(photos) >= 4:
                break
            if ii.get('descriptionurl') in seen or BAD.search(title) or ii.get('mime') != 'image/jpeg':
                continue
            w, h = ii.get('width', 0), ii.get('height', 0)
            if w < 700 or h < 450 or not (0.6 < w / h < 2.4):
                continue
            n = len(photos) + 1
            full = os.path.join(PHOTOS, f'{pid}-{n}.jpg')
            if not download(ii.get('thumburl') or ii['url'], full):
                continue
            thumb = os.path.join(PHOTOS, f'{pid}-{n}-t.jpg')
            subprocess.run(['sips', '-Z', '200', '-s', 'formatOptions', '70', full, '--out', thumb], capture_output=True)
            meta = ii.get('extmetadata', {})
            artist = re.sub(r'<[^>]+>', '', meta.get('Artist', {}).get('value', '')).strip()
            lic = meta.get('LicenseShortName', {}).get('value', '')
            photos.append({'src': f'photos/{pid}-{n}.jpg', 'thumb': f'photos/{pid}-{n}-t.jpg', 'page': ii.get('descriptionurl'),
                           'credit': ', '.join(x for x in [artist[:60], lic] if x) or 'Wikimedia Commons', 'title': title})
            seen.add(ii.get('descriptionurl'))
    cache[str(pid)] = photos
    json.dump(cache, open(CACHE_PATH, 'w'), ensure_ascii=False, indent=1)
    print(pid, len(photos), [p.get('title', '')[5:50] for p in photos], flush=True)
