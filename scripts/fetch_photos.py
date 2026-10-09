#!/usr/bin/env python3
"""Batched Wikipedia photo + coordinate fetch (few API calls, friendly to rate limits).
Writes data/photo_cache.json ({id: [photo,...]}) and data/wiki_coords.json, downloads photos/<id>-<n>.jpg.
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
import glob, json, os, sys, re, subprocess, time, urllib.error, urllib.parse, urllib.request

from citypaths import ROOT, PHOTOS, PHOTO_URL, PARTS, CACHE_PATH, COORDS_PATH
UA = 'KyotoPersonalMap/1.0 (personal non-commercial trip map)'
MAXP = 4
BAD = re.compile(r'(map|karte|plan|logo|icon|flag|emblem|seal|crest|kamon|locator|diagram|signature|stamp|symbol|location|route|chart|位置|地図|紋|\.svg|\.png|\.gif|\.tif|\.webm|\.ogg|\.pdf)', re.I)


def api(lang, params):
    params = dict(params, format='json', formatversion=2)
    host = 'commons.wikimedia.org' if lang == 'commons' else f'{lang}.wikipedia.org'
    url = f'https://{host}/w/api.php'
    data = urllib.parse.urlencode(params).encode()
    for attempt in range(10):
        time.sleep(1)
        try:
            req = urllib.request.Request(url, data=data, headers={'User-Agent': UA})
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            wait = int(e.headers.get('Retry-After') or 0) or min(90, 5 * 2 ** attempt)
            print(f'  {e.code} {host}, wait {wait}s', flush=True)
            time.sleep(wait)
        except Exception as e:
            print('  err', e, flush=True)
            time.sleep(5)
    raise SystemExit('API keeps failing')


def query_all(lang, params):
    """Run a query following 'continue'; yields each response."""
    cont = {}
    while True:
        d = api(lang, dict(params, action='query', **cont))
        yield d
        if 'continue' not in d:
            break
        cont = d['continue']


def page_info(lang, titles):
    """{original_title: {'images': [...], 'lead': name, 'coords': (lat,lng)}}"""
    out = {}
    for i in range(0, len(titles), 50):
        chunk = titles[i:i + 50]
        alias = {t: t for t in chunk}
        pages = {}
        for d in query_all(lang, {'titles': '|'.join(chunk), 'redirects': 1, 'prop': 'images|pageimages|coordinates',
                                  'imlimit': 'max', 'piprop': 'name', 'colimit': 'max'}):
            q = d.get('query', {})
            for n in q.get('normalized', []) + q.get('redirects', []):
                for k, v in list(alias.items()):
                    if v == n['from']:
                        alias[k] = n['to']
            for p in q.get('pages', []):
                cur = pages.setdefault(p['title'], {'images': [], 'lead': None, 'coords': None})
                cur['images'] += [im['title'] for im in p.get('images', [])]
                if p.get('pageimage'):
                    cur['lead'] = 'File:' + p['pageimage'].replace('_', ' ')
                if p.get('coordinates'):
                    c = p['coordinates'][0]
                    cur['coords'] = (c['lat'], c['lon'])
        for orig, final in alias.items():
            if final in pages:
                out[orig] = pages[final]
    return out


def file_info(files):
    out = {}
    for i in range(0, len(files), 50):
        chunk = files[i:i + 50]
        for d in query_all('commons', {'titles': '|'.join(chunk), 'prop': 'imageinfo',
                                       'iiprop': 'url|size|mime|extmetadata', 'iiurlwidth': 960,
                                       'iiextmetadatafilter': 'Artist|LicenseShortName'}):
            for p in d.get('query', {}).get('pages', []):
                if p.get('imageinfo'):
                    out[p['title']] = p['imageinfo'][0]
    return out


def download(url, path):
    for attempt in range(6):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA})
            with urllib.request.urlopen(req, timeout=60) as r:
                data = r.read()
            open(path, 'wb').write(data)
            return True
        except urllib.error.HTTPError as e:
            wait = int(e.headers.get('Retry-After') or 0) or 5 * (attempt + 1)
            print(f'  dl {e.code}, wait {wait}s', flush=True)
            time.sleep(wait)
        except Exception:
            time.sleep(5)
    return False


def main():
    places = sorted([p for f in glob.glob(os.path.join(PARTS, '*.json')) for p in json.load(open(f))], key=lambda p: p['id'])
    cache = json.load(open(CACHE_PATH)) if os.path.exists(CACHE_PATH) else {}
    coords = {}

    info = {}
    for lang in ('en', 'ja'):
        titles = sorted({p[f'wiki_{lang}'] for p in places if p.get(f'wiki_{lang}')})
        info[lang] = page_info(lang, titles)
        print(lang, 'pages', len(info[lang]), flush=True)

    cands = {}
    for p in places:
        lst = []
        for lang in ('en', 'ja'):
            pi = info[lang].get(p.get(f'wiki_{lang}') or '')
            if not pi:
                continue
            if pi['coords'] and str(p['id']) not in coords:
                coords[str(p['id'])] = pi['coords']
            imgs = [x for x in pi['images'] if not BAD.search(x) and re.search(r'\.jpe?g$', x, re.I)]
            if pi['lead'] in imgs:
                imgs.remove(pi['lead']); imgs.insert(0, pi['lead'])
            for x in imgs:
                if x not in lst:
                    lst.append(x)
            if len(lst) >= 8:
                break
        cands[p['id']] = lst[:10]
    json.dump(coords, open(COORDS_PATH, 'w'), indent=1)

    need = sorted({f for pid, l in cands.items() if str(pid) not in cache for f in l})
    print('file infos needed', len(need), flush=True)
    fi = file_info(need)

    for p in places:
        pid = str(p['id'])
        if pid in cache:
            continue
        photos = []
        for f in cands[p['id']]:
            ii = fi.get(f)
            if not ii or ii.get('mime') != 'image/jpeg':
                continue
            w, h = ii.get('width', 0), ii.get('height', 0)
            if w < 700 or h < 450 or not (0.6 < w / h < 2.4):
                continue
            n = len(photos) + 1
            fn = f'{pid}-{n}.jpg'
            full = os.path.join(PHOTOS, fn)
            if not download(ii.get('thumburl') or ii['url'], full):
                continue
            thumb = os.path.join(PHOTOS, f'{pid}-{n}-t.jpg')
            subprocess.run(['sips', '-Z', '200', '-s', 'formatOptions', '70', full, '--out', thumb],
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            meta = ii.get('extmetadata', {})
            artist = re.sub(r'<[^>]+>', '', meta.get('Artist', {}).get('value', '')).strip()
            lic = meta.get('LicenseShortName', {}).get('value', '')
            photos.append({'src': f'{PHOTO_URL}{fn}', 'thumb': f'{PHOTO_URL}{pid}-{n}-t.jpg',
                           'page': ii.get('descriptionurl'), 'credit': ', '.join(x for x in [artist[:60], lic] if x) or 'Wikimedia Commons'})
            if len(photos) >= MAXP:
                break
        cache[pid] = photos
        json.dump(cache, open(CACHE_PATH, 'w'), ensure_ascii=False, indent=1)
        print(f'#{pid} {p["name_en"]}: {len(photos)} photos', flush=True)


if __name__ == '__main__':
    main()
