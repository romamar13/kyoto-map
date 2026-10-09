"""Per-city data locations. Select the city with the CITY env var (default: kyoto)."""
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CITY = os.environ.get('CITY', 'kyoto')
if CITY == 'kyoto':
    DATA, OUT, PHOTO_URL = 'data', 'data/places.json', 'photos/'
else:
    DATA, OUT, PHOTO_URL = f'data/{CITY}', f'data/{CITY}.json', f'photos/{CITY}/'
PARTS = os.path.join(ROOT, DATA, 'parts')
CACHE_PATH = os.path.join(ROOT, DATA, 'photo_cache.json')
COORDS_PATH = os.path.join(ROOT, DATA, 'wiki_coords.json')
LINES_PATH = os.path.join(ROOT, DATA, 'lines.json')
OUT_PATH = os.path.join(ROOT, OUT)
PHOTOS = os.path.join(ROOT, PHOTO_URL)
os.makedirs(PHOTOS, exist_ok=True)
