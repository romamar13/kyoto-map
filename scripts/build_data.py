#!/usr/bin/env python3
"""Merge data/parts/*.json + data/photo_cache.json into data/places.json.
Photos come from scripts/fetch_photos.py (+ fill_photos.py / prune_photos.py for fixes).
"""
import glob, json, math, os, time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

# Places whose Japanese name alone is ambiguous in Google Maps search
GMAPS = {
    8: '京都ゑびす神社', 11: '円通寺 京都市左京区岩倉', 22: '法輪寺 嵐山', 38: '光明寺 長岡京市', 46: '松ヶ崎大黒天',
    64: '清凉寺 嵯峨釈迦堂', 74: '等持院 京都', 79: '横川中堂 比叡山', 88: '哲学の道', 89: '花見小路通',
    90: '巽橋 祇園白川', 91: '二寧坂', 97: '月桂冠大倉記念館', 99: '京都駅ビル', 101: '鴨川デルタ', 104: '平等院表参道',
}


def km(a, b):
    r = math.pi / 180
    x = math.sin((b[0] - a[0]) * r / 2) ** 2 + math.cos(a[0] * r) * math.cos(b[0] * r) * math.sin((b[1] - a[1]) * r / 2) ** 2
    return 2 * 6371 * math.asin(math.sqrt(x))


places = sorted([p for f in glob.glob('data/parts/*.json') for p in json.load(open(f))], key=lambda p: p['id'])
photos = json.load(open('data/photo_cache.json'))
wc = json.load(open('data/wiki_coords.json')) if os.path.exists('data/wiki_coords.json') else {}
for p in places:
    p['photos'] = [{k: v for k, v in ph.items() if k != 'title'} for ph in photos.get(str(p['id']), [])]
    if p['id'] in GMAPS:
        p['gmaps_query'] = GMAPS[p['id']]
    w = wc.get(str(p['id']))
    if w and km((p['lat'], p['lng']), w) > 0.8:
        print(f'#{p["id"]} {p["name_en"]}: coords differ from wiki by {km((p["lat"], p["lng"]), w):.1f} km')
json.dump({'updated': time.strftime('%Y-%m-%d'), 'places': places}, open('data/places.json', 'w'), ensure_ascii=False, separators=(',', ':'))
print(f'{len(places)} places, {sum(len(p["photos"]) for p in places)} photos')
