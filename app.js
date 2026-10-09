'use strict';

const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

const CATS = {
  temple: { label: 'Храмы', one: 'Буддийский храм', color: 'var(--c-temple)' },
  shrine: { label: 'Святилища', one: 'Синтоистское святилище', color: 'var(--c-shrine)' },
  castle: { label: 'Замки и дворцы', one: 'Замок / дворец', color: 'var(--c-castle)' },
  garden: { label: 'Сады', one: 'Сад', color: 'var(--c-garden)' },
  nature: { label: 'Природа', one: 'Природа', color: 'var(--c-nature)' },
  street: { label: 'Улицы', one: 'Улица / квартал', color: 'var(--c-street)' },
  market: { label: 'Рынки', one: 'Рынок', color: 'var(--c-market)' },
  museum: { label: 'Музеи', one: 'Музей', color: 'var(--c-museum)' },
  other: { label: 'Другое', one: 'Достопримечательность', color: 'var(--c-other)' },
  shopping: { label: 'Шоппинг', one: 'Шоппинг', color: 'var(--c-street)' },
  view: { label: 'Виды', one: 'Смотровая / вид', color: 'var(--c-view)' },
  town: { label: 'Города', one: 'Город / поездка', color: 'var(--c-town)' },
};
/* ---------------- cities ---------------- */
const CITIES = {
  kyoto: {
    name: 'Киото',
    data: 'data/places.json',
    center: [35.0116, 135.7681], zoom: 12, minZoom: 9,
    bounds: [[34.4, 135.2], [35.6, 136.4]],
    hotel: {
      name: 'Shizutetsu Hotel Prezio Kyoto Shijo',
      name_ja: '静鉄ホテルプレジオ京都四条',
      lat: 35.00507, lng: 135.7549,
      address_ja: '京都市中京区西洞院通錦小路上る古西町452',
      address_en: '452 Konishi-cho, Nishinotoin-dori Nishikikoji-agaru, Nakagyo-ku, Kyoto 604-8227',
      phone: '075-741-7891',
      station: 'Метро «Сидзё» (линия Карасума) или Hankyu «Карасума» — 6 мин пешком; станции соединены под землёй',
    },
    chips: [
      { key: 'temple', label: 'Храмы', color: 'var(--c-temple)', test: (p) => p.category === 'temple' },
      { key: 'shrine', label: 'Святилища', color: 'var(--c-shrine)', test: (p) => p.category === 'shrine' },
      { key: 'nature', label: 'Сады и природа', color: 'var(--c-nature)', test: (p) => ['nature', 'garden'].includes(p.category) },
      { key: 'street', label: 'Улицы и рынки', color: 'var(--c-street)', test: (p) => ['street', 'market'].includes(p.category) },
      { key: 'museum', label: 'Музеи и другое', color: 'var(--c-museum)', test: (p) => ['museum', 'other', 'castle'].includes(p.category) },
    ],
    unesco: true,
    note: 'Номера 1–81 — как на карте Rakuyo Taxi, 82+ — дополнительные места.',
    offline: [[[34.86, 135.62], [35.14, 135.92], 10, 14], [[34.93, 135.66], [35.07, 135.81], 15, 15], [[34.96, 135.74], [35.04, 135.80], 16, 16]],
    districts: [],
  },
  tokyo: {
    name: 'Токио',
    data: 'data/tokyo.json',
    center: [35.68, 139.76], zoom: 12, minZoom: 8,
    bounds: [[34.7, 138.2], [37.0, 141.0]],
    hotel: {
      name: 'Dormy Inn Tokyo Hatchobori',
      name_ja: '亀島川温泉 新川の湯 ドーミーイン東京八丁堀',
      lat: 35.67443, lng: 139.78076,
      address_ja: '東京都中央区新川2-20-4',
      address_en: '2-20-4 Shinkawa, Chuo-ku, Tokyo 104-0033',
      phone: '03-5541-6700',
      station: 'JR Keiyo «Hatchobori» (выход B4) — 2 мин; метро Hibiya «Hatchobori», Tozai/Hibiya «Kayabacho» — 5–7 мин',
    },
    chips: [
      { key: 'culture', label: 'Культура', color: 'var(--c-temple)', test: (p) => p.kind === 'culture' },
      { key: 'shopping', label: 'Шоппинг', color: 'var(--c-street)', test: (p) => p.kind === 'shopping' },
      { key: 'town', label: 'Города и поездки', color: 'var(--c-town)', test: (p) => p.kind === 'town' },
      { key: 'view', label: 'Виды и парки', color: 'var(--c-view)', test: (p) => p.kind === 'view' },
    ],
    unesco: false,
    note: 'Цвет метки — тип места. Полупрозрачные зоны — районы Токио, нажмите на название района. «Города и поездки» — пригороды и города на день, в карточке есть блок «Как добраться».',
    offline: [[[35.55, 139.6], [35.8, 139.9], 10, 13], [[35.62, 139.66], [35.74, 139.83], 14, 15], [[35.65, 139.69], [35.72, 139.81], 16, 16]],
    // tourist districts drawn as soft zones; r in metres
    districts: [
      ['Асакуса', 35.7130, 139.7960, 650, 'Старый Токио: Сэнсо-дзи, Накамисэ, рикши, вид на Скайтри. Лучше рано утром или вечером, когда храм подсвечен.'],
      ['Уэно', 35.7135, 139.7735, 750, 'Парк с главными музеями (Национальный музей, зоопарк) и шумный рынок Амэёко под ж/д путями.'],
      ['Янака', 35.7255, 139.7670, 550, 'Довоенный Токио: храмы, кладбище, кошки, торговая улочка Янака Гиндза. Тихо и атмосферно.'],
      ['Акихабара', 35.6998, 139.7712, 480, 'Электроника, аниме, манга, ретро-игры, мэйд-кафе. По выходным главная улица Тюо-дори пешеходная.'],
      ['Канда · Дзимботё', 35.6960, 139.7590, 480, 'Квартал букинистов и карри-ресторанов, святилище Канда Мёдзин рядом с Акихабарой.'],
      ['Маруноути', 35.6812, 139.7650, 550, 'Деловой центр у станции Токио и Императорского дворца: красный кирпичный вокзал, Character Street.'],
      ['Нихонбаси', 35.6840, 139.7745, 450, 'Исторический торговый центр Эдо: мост Нихонбаси, универмаги Мицукоси и Такасимая.'],
      ['Гиндза', 35.6717, 139.7650, 580, 'Люкс-шоппинг, флагманы Uniqlo, Itoya, Ginza Six, театр Кабукидза. По выходным Тюо-дори пешеходная.'],
      ['Цукидзи', 35.6655, 139.7705, 380, 'Внешний рынок: суши, тамагояки, морепродукты с утра до обеда.'],
      ['Цукисима', 35.6625, 139.7830, 420, 'Улица мондзя-яки — местная еда, рядом с отелем.'],
      ['Хаттёбори · Сингава', 35.6745, 139.7800, 380, 'Наш район: тихий, у реки Камэдзима. До Гиндзы и Токио-эки — 1–2 станции.'],
      ['Фукагава · Киёсуми', 35.6790, 139.7975, 620, 'Сады Киёсуми, кофейни (Blue Bottle), Музей Фукагава Эдо, Томиока Хатимангу.'],
      ['Рёгоку', 35.6965, 139.7930, 480, 'Сумо: арена Кокугикан, школы борцов, тянко-набэ, музеи Хокусая и Эдо-Токио.'],
      ['Роппонги', 35.6628, 139.7314, 600, 'Арт-треугольник (Мори, Национальный центр искусств, Сантори), небоскрёбы и ночная жизнь.'],
      ['Адзабу · Токийская башня', 35.6575, 139.7445, 480, 'Токийская башня, храм Дзодзё-дзи, новый комплекс Адзабудай Хиллз с teamLab.'],
      ['Одайба', 35.6265, 139.7760, 1200, 'Искусственный остров: Гандам, Радужный мост, Мирайкан, торговые центры, вечерние виды на залив.'],
      ['Тоёсу', 35.6455, 139.7895, 650, 'Новый рыбный рынок с аукционом тунца и teamLab Planets.'],
      ['Сибуя', 35.6595, 139.7005, 600, 'Скрэмбл-перекрёсток, Хатико, Shibuya Sky, Parco (Nintendo, Pokémon), молодёжная мода.'],
      ['Харадзюку · Омотэсандо', 35.6700, 139.7065, 600, 'Такэсита-дори и каваий-культура, рядом — архитектурный бульвар Омотэсандо и Кэт-стрит.'],
      ['Синдзюку', 35.6925, 139.7010, 800, 'Небоскрёбы, бесплатная смотровая мэрии, Кабукитё, Омоидэ-ёкотё и Голден Гай, парк Синдзюку-гёэн.'],
      ['Икэбукуро', 35.7295, 139.7110, 600, 'Sunshine City, Pokémon Center Mega, Отомэ-роуд (аниме для девушек), Animate.'],
      ['Симокитадзава', 35.6615, 139.6680, 500, 'Винтаж, секонды, кофейни, маленькие театры и музыкальные клубы.'],
      ['Накамэгуро · Дайканьяма', 35.6475, 139.7005, 600, 'Канал Мэгуро, кафе, Tsutaya T-Site — спокойный стильный Токио.'],
      ['Эбису', 35.6467, 139.7105, 400, 'Yebisu Garden Place, музей пива, хорошие идзакаи и рамэн.'],
      ['Накано', 35.7075, 139.6655, 380, 'Накано Бродвей — рай для коллекционеров аниме, фигурок и ретро-игр.'],
      ['Коэндзи', 35.7050, 139.6495, 430, 'Винтаж, панк-сцена, дешёвые идзакаи — «альтернативный» Токио.'],
      ['Китидзёдзи', 35.7030, 139.5800, 650, 'Парк Инокасира, Музей Гибли, уютные торговые улочки.'],
      ['Сугамо', 35.7335, 139.7395, 380, '«Харадзюку для бабушек»: Дзидзо-дори, красное бельё на удачу, традиционные сладости.'],
    ],
  },
};
const CITY_KEY = CITIES[LS.get('city', 'kyoto')] ? LS.get('city', 'kyoto') : 'kyoto';
const CITY = CITIES[CITY_KEY];
const HOTEL = CITY.hotel;
// Kyoto keeps its original storage keys; other cities are namespaced
const ck = (k) => (CITY_KEY === 'kyoto' ? k : `${CITY_KEY}:${k}`);
const KIND_LABEL = { culture: 'Культура', shopping: 'Шоппинг', town: 'Поездка за город', view: 'Виды и парки' };

// SVG strokes can't use CSS variables, so polylines get plain hex colours
const LINE_COLORS = { street: '#e0901a', market: '#e0901a', nature: '#2f9a5a', garden: '#2f9a5a', other: '#6b7a8c', museum: '#6b7a8c', temple: '#3b5ba5', shrine: '#d24a2c', castle: '#7a4fa0', shopping: '#e0901a', view: '#2a8fb8', town: '#8a5a3c' };
const CROWD_TXT = ['', 'почти пусто', 'спокойно', 'умеренно', 'людно', 'очень людно'];

const state = {
  places: [],
  byId: new Map(),
  markers: new Map(),
  lines: new Map(), // id -> layer group with street/path polylines
  visited: new Set(LS.get(ck('visited'), [])),
  favs: new Set(LS.get(ck('favs'), [])),
  filter: LS.get(ck('filter'), { cat: 'all', must: false, unesco: false, fav: false, hideVisited: false }),
  q: '',
  sort: LS.get('sort', 'priority'),
  me: null,
  selected: null,
};

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------------- map ---------------- */
// Esri World Street Map: no key needed, English labels (readable without Japanese).
const TILE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';

const map = L.map('map', {
  zoomControl: false,
  attributionControl: true,
  maxZoom: 19,
  minZoom: CITY.minZoom,
  maxBounds: CITY.bounds,
  maxBoundsViscosity: 0.8,
  tap: false,
}).setView(LS.get(ck('view'), { c: CITY.center }).c, LS.get(ck('view'), { z: CITY.zoom }).z);

L.tileLayer(TILE_URL, {
  maxNativeZoom: 19,
  maxZoom: 19,
  crossOrigin: true, // CORS responses can be cached by the service worker for offline use
  attribution: 'Tiles © Esri',
}).addTo(map);
if (matchMedia('(min-width: 820px)').matches) L.control.zoom({ position: 'bottomright' }).addTo(map);

function updateLabelClass() {
  const z = map.getZoom();
  const el = map.getContainer();
  el.classList.toggle('hide-labels', z < 13);
  el.classList.toggle('hide-labels-minor', z < 15);
}
map.on('zoomend', updateLabelClass);
map.on('moveend', () => LS.set(ck('view'), { c: [map.getCenter().lat, map.getCenter().lng], z: map.getZoom() }));
updateLabelClass();

function pinHtml(p) {
  const cls = ['pin', 'p' + (p.priority || 2)];
  if (state.visited.has(p.id)) cls.push('visited');
  if (state.favs.has(p.id)) cls.push('fav');
  if (state.selected === p.id) cls.push('sel');
  return `<div class="${cls.join(' ')}" style="--c:${(CATS[p.category] || CATS.other).color}"><b><span>${p.id}</span></b></div>`;
}
function pinIcon(p) {
  const s = p.priority === 1 ? 36 : p.priority === 3 ? 24 : 30;
  return L.divIcon({ className: 'pinwrap', html: pinHtml(p), iconSize: [s, s], iconAnchor: [s / 2, s * 1.2], tooltipAnchor: [0, 0] });
}
function refreshMarker(id) {
  const m = state.markers.get(id);
  const p = state.byId.get(id);
  if (m && p) m.setIcon(pinIcon(p));
}

/* ---------------- time / open status (JST) ---------------- */
function jstNow() {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
  const h = +parts.find((x) => x.type === 'hour').value;
  const m = +parts.find((x) => x.type === 'minute').value;
  return h * 60 + m;
}
const toMin = (t) => { if (!t) return null; const [h, m] = t.split(':').map(Number); return h * 60 + (m || 0); };
function openStatus(p) {
  const o = toMin(p.open), c = toMin(p.close);
  if (o == null || c == null) return null;
  if (o === 0 && c >= 1440) return { open: true, text: 'Открыто всегда' };
  const n = jstNow();
  const isOpen = c > o ? n >= o && n < c : n >= o || n < c;
  if (isOpen) return { open: true, text: `Открыто до ${p.close}` };
  return { open: false, text: `Закрыто · откроется в ${p.open}` };
}

/* ---------------- distance ---------------- */
function distKm(a, b) {
  const R = 6371, r = Math.PI / 180;
  const dLat = (b[0] - a[0]) * r, dLng = (b[1] - a[1]) * r;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
// distance origin: current position if known, otherwise the hotel
const origin = () => (state.me ? { at: state.me, label: 'от вас' } : { at: [HOTEL.lat, HOTEL.lng], label: 'от отеля' });
const fmtDist = (km) => (km < 1 ? `${Math.round(km * 1000 / 10) * 10} м` : `${km.toFixed(km < 10 ? 1 : 0)} км`);

/* ---------------- filters ---------------- */
const CHIP_DEFS = [
  { key: 'all', label: 'Все' },
  { key: 'must', label: '★ Главное', flag: true },
  ...(CITY.unesco ? [{ key: 'unesco', label: 'ЮНЕСКО', flag: true }] : []),
  { key: 'fav', label: '♥ Избранное', flag: true },
  ...CITY.chips.map((c) => ({ ...c, cat: true })),
  { key: 'hideVisited', label: 'Скрыть посещённые', flag: true },
];

function renderChips() {
  const f = state.filter;
  $('#chips').innerHTML = CHIP_DEFS.map((c) => {
    let on;
    if (c.key === 'all') on = f.cat === 'all' && !f.must && !f.unesco && !f.fav;
    else if (c.flag) on = !!f[c.key];
    else on = f.cat === c.key;
    const dot = c.cat ? `<span class="dot" style="background:${c.color}"></span>` : '';
    return `<button class="chip${on ? ' on' : ''}" data-k="${c.key}">${dot}${c.label}</button>`;
  }).join('');
}
$('#chips').addEventListener('click', (e) => {
  const b = e.target.closest('.chip');
  if (!b) return;
  const k = b.dataset.k;
  const def = CHIP_DEFS.find((c) => c.key === k);
  const f = state.filter;
  if (k === 'all') Object.assign(f, { cat: 'all', must: false, unesco: false, fav: false });
  else if (def.flag) f[k] = !f[k];
  else f.cat = f.cat === k ? 'all' : k;
  LS.set(ck('filter'), f);
  applyFilter();
});

function matches(p) {
  const f = state.filter;
  if (f.must && p.priority !== 1) return false;
  if (f.unesco && !p.unesco) return false;
  if (f.fav && !state.favs.has(p.id)) return false;
  if (f.hideVisited && state.visited.has(p.id)) return false;
  if (f.cat !== 'all') {
    const chip = CITY.chips.find((c) => c.key === f.cat);
    if (chip && !chip.test(p)) return false;
  }
  if (state.q) {
    const hay = `${p.id} ${p.name_ru} ${p.name_en} ${p.name_ja} ${p.area} ${p.short}`.toLowerCase();
    if (!state.q.split(/\s+/).every((w) => hay.includes(w))) return false;
  }
  return true;
}

function visiblePlaces() { return state.places.filter(matches); }

function applyFilter() {
  renderChips();
  const vis = new Set(visiblePlaces().map((p) => p.id));
  for (const [id, m] of state.markers) {
    const on = vis.has(id) || state.selected === id;
    if (on && !map.hasLayer(m)) m.addTo(map);
    if (!on && map.hasLayer(m)) m.remove();
    const ln = state.lines.get(id);
    if (ln && on && !map.hasLayer(ln)) ln.addTo(map);
    if (ln && !on && map.hasLayer(ln)) ln.remove();
  }
  $('#count').textContent = `Список · ${vis.size}`;
  if ($('#list').classList.contains('open')) renderList();
}

let qTimer;
$('#q').addEventListener('input', (e) => {
  clearTimeout(qTimer);
  qTimer = setTimeout(() => {
    state.q = e.target.value.trim().toLowerCase();
    applyFilter();
    if (state.q && !$('#list').classList.contains('open')) openList();
  }, 150);
});
$('#q').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.target.blur(); openList(); } });

/* ---------------- sheets ---------------- */
const sheets = ['sheet', 'list', 'menu'];
function openSheet(id) {
  sheets.forEach((s) => { if (s !== id) closeSheet(s, true); });
  const el = document.getElementById(id);
  el.classList.add('open');
  el.setAttribute('aria-hidden', 'false');
}
function closeSheet(id, silent) {
  const el = document.getElementById(id);
  el.classList.remove('open', 'full');
  el.setAttribute('aria-hidden', 'true');
  el.style.transform = '';
  if (id === 'sheet' && state.selected != null) {
    const prev = state.selected;
    state.selected = null;
    refreshMarker(prev);
    if (!silent && location.hash) history.replaceState(null, '', location.pathname + location.search);
    applyFilter();
  }
  if (id === 'sheet' && !silent && location.hash === '#hotel') history.replaceState(null, '', location.pathname + location.search);
}
$('#sheet-close').onclick = () => closeSheet('sheet');
$('#list-close').onclick = () => closeSheet('list');
$('#menu-close').onclick = () => closeSheet('menu');
map.on('click', () => sheets.forEach((s) => closeSheet(s)));

// drag-to-dismiss / expand on mobile
function enableDrag(sheet) {
  const body = sheet.querySelector('.sheet-body');
  let y0 = null, dy = 0, fromGrab = false;
  sheet.addEventListener('touchstart', (e) => {
    fromGrab = !!e.target.closest('.grab');
    if (!fromGrab && body.scrollTop > 0) { y0 = null; return; }
    y0 = e.touches[0].clientY; dy = 0;
  }, { passive: true });
  sheet.addEventListener('touchmove', (e) => {
    if (y0 == null) return;
    dy = e.touches[0].clientY - y0;
    if (dy > 0 && (fromGrab || body.scrollTop <= 0)) {
      sheet.classList.add('dragging');
      sheet.style.transform = `translateY(${dy}px)`;
      if (!fromGrab) e.preventDefault();
    }
  }, { passive: false });
  sheet.addEventListener('touchend', () => {
    sheet.classList.remove('dragging');
    if (y0 == null) return;
    if (dy > 110) closeSheet(sheet.id);
    else if (dy < -40 && fromGrab) sheet.classList.add('full');
    sheet.style.transform = '';
    y0 = null;
  });
  sheet.querySelector('.grab').addEventListener('click', () => sheet.classList.toggle('full'));
}
sheets.forEach((s) => enableDrag(document.getElementById(s)));

/* ---------------- place details ---------------- */
const ICON_MAP = '<svg viewBox="0 0 24 24"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>';
const ICON_ROUTE = '<svg viewBox="0 0 24 24"><path d="M3 11l18-8-8 18-2-8-8-2z"/></svg>';
const ICON_CHECK = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const ICON_HEART = '<svg viewBox="0 0 24 24"><path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20z"/></svg>';

function gmapsUrl(p) {
  const q = p.gmaps_query || p.name_ja || p.name_en;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}
function routeUrl(p) {
  return `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}&travelmode=transit`;
}

function renderPlace(p) {
  const cat = CATS[p.category] || CATS.other;
  const st = openStatus(p);
  const t = p.ticket || {};
  const c = p.crowd || {};
  const photos = p.photos || [];
  const gallery = photos.length
    ? `<div class="gallery">${photos.map((ph, i) => `<img src="${esc(ph.src)}" alt="" loading="${i ? 'lazy' : 'eager'}" data-i="${i}">`).join('')}</div>`
    : `<div class="gallery-empty">Фото нет</div>`;
  const o = origin();
  const dist = ` · ${fmtDist(distKm(o.at, [p.lat, p.lng]))} ${o.label}`;
  const visited = state.visited.has(p.id), fav = state.favs.has(p.id);
  const crowdBar = c.level
    ? `<div class="crowd">${[1, 2, 3, 4, 5].map((i) => `<i class="${i <= c.level ? 'f' + c.level : ''}"></i>`).join('')}<span>${CROWD_TXT[c.level]} в пик</span></div>`
    : '';

  return `
    ${gallery}
    <div class="pd">
      <div class="pd-title">
        <div class="pd-num" style="background:${cat.color}">${p.id}</div>
        <div>
          <h1>${esc(p.name_ru)}</h1>
          <div class="sub">${esc(p.name_ja)} · ${esc(p.name_en)}</div>
        </div>
      </div>
      <div class="badges">
        ${st ? `<span class="badge ${st.open ? 'open' : 'closed'}">${st.text}</span>` : ''}
        ${p.priority === 1 ? '<span class="badge must">★ Must-see</span>' : ''}
        ${p.unesco ? '<span class="badge unesco">ЮНЕСКО</span>' : ''}
        <span class="badge">${p.kind === 'town' ? KIND_LABEL.town : cat.one}</span>
        <span class="badge">${esc(p.area)}${dist}</span>
        ${CITY_KEY === 'kyoto' && p.source === 'extra' ? '<span class="badge">не с карты такси</span>' : ''}
      </div>

      <div class="actions">
        <a class="btn primary" href="${gmapsUrl(p)}" target="_blank" rel="noopener">${ICON_MAP}Google Maps</a>
        <a class="btn" href="${routeUrl(p)}" target="_blank" rel="noopener">${ICON_ROUTE}Маршрут</a>
        <button class="btn ${visited ? 'on' : ''}" data-act="visited">${ICON_CHECK}${visited ? 'Посетил' : 'Отметить'}</button>
        <button class="btn ${fav ? 'fav-on' : ''}" data-act="fav">${ICON_HEART}${fav ? 'В избранном' : 'В избранное'}</button>
      </div>

      <p class="lead">${esc(p.description)}</p>

      ${p.tip ? `<div class="tipbox"><b>Как лучше посетить</b>${esc(p.tip)}</div>` : ''}

      <div class="facts">
        ${p.getting_there ? `<div class="fact"><div class="ic">🚆</div><div>
          <h3>Как добраться</h3>
          <p>${esc(p.getting_there)}</p>
        </div></div>` : ''}
        <div class="fact"><div class="ic">🕒</div><div>
          <h3>Время</h3>
          <p>${esc(p.hours)}</p>
          ${p.closed ? `<p class="muted">Выходные: ${esc(p.closed)}</p>` : ''}
          ${p.duration ? `<p class="muted">На посещение: ${esc(p.duration)}</p>` : ''}
        </div></div>
        <div class="fact"><div class="ic">🎟</div><div>
          <h3>Билеты</h3>
          <dl class="kv">
            <dt>Цена</dt><dd>${esc(t.price || '—')}</dd>
            <dt>Оплата</dt><dd>${esc(t.payment || '—')}</dd>
            <dt>Бронь</dt><dd>${esc(t.booking || '—')}</dd>
          </dl>
          ${t.note ? `<p class="muted" style="margin-top:6px">${esc(t.note)}</p>` : ''}
        </div></div>
        ${c.level ? `<div class="fact"><div class="ic">👥</div><div>
          <h3>Толпы</h3>
          ${crowdBar}
          ${c.best ? `<p><b>Лучше:</b> ${esc(c.best)}</p>` : ''}
          ${c.peak ? `<p class="muted">Пик: ${esc(c.peak)}</p>` : ''}
        </div></div>` : ''}
      </div>

      ${p.website ? `<span class="more"><a href="${esc(p.website)}" target="_blank" rel="noopener">Официальный сайт ↗</a></span>` : ''}
      ${photos.length ? `<p class="credit">Фото: Wikimedia Commons / Wikipedia</p>` : ''}
    </div>`;
}

function selectPlace(id, { fly = true, push = true } = {}) {
  const p = state.byId.get(id);
  if (!p) return;
  const prev = state.selected;
  state.selected = id;
  if (prev != null && prev !== id) refreshMarker(prev);
  refreshMarker(id);
  const m = state.markers.get(id);
  if (m && !map.hasLayer(m)) m.addTo(map);

  const body = $('#sheet-body');
  body.innerHTML = renderPlace(p);
  body.scrollTop = 0;
  openSheet('sheet');
  if (push && location.hash !== `#p${id}`) history.pushState({ p: id }, '', `#p${id}`);

  if (fly) flyAboveSheet(p.lat, p.lng);
}

// keep the point visible above the bottom sheet / right of the side panel
function flyAboveSheet(lat, lng) {
  const wide = matchMedia('(min-width: 820px)').matches;
  const z = Math.max(map.getZoom(), 14);
  const target = map.project([lat, lng], z);
  const off = wide ? L.point(-205, 0) : L.point(0, window.innerHeight * 0.28);
  map.flyTo(map.unproject(target.add(off), z), z, { duration: 0.5 });
}

/* ---------------- hotel ---------------- */
const ICON_BED = '<svg viewBox="0 0 24 24"><path d="M3 18V7M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5"/><circle cx="7" cy="11" r="1.6"/></svg>';
const hotelMarker = L.marker([HOTEL.lat, HOTEL.lng], {
  icon: L.divIcon({ className: 'pinwrap', html: `<div class="hotel-pin">${ICON_BED}</div>`, iconSize: [38, 38], iconAnchor: [19, 19] }),
  zIndexOffset: 3000,
}).addTo(map);
hotelMarker.bindTooltip('Наш отель', { permanent: true, direction: 'bottom', className: 'lbl hotel-lbl', offset: [0, 18] });
hotelMarker.on('click', openHotel);

function renderHotel() {
  const q = encodeURIComponent(HOTEL.name);
  return `<div class="pd" style="padding-top:22px">
    <div class="pd-title">
      <div class="pd-num hotel-num">${ICON_BED}</div>
      <div><h1>Наш отель</h1><div class="sub">${esc(HOTEL.name)}</div></div>
    </div>
    <div class="actions">
      <a class="btn primary" href="https://www.google.com/maps/dir/?api=1&destination=${q}&travelmode=transit" target="_blank" rel="noopener">${ICON_ROUTE}Домой</a>
      <a class="btn" href="https://www.google.com/maps/search/?api=1&query=${q}" target="_blank" rel="noopener">${ICON_MAP}Google Maps</a>
      <a class="btn" href="tel:${HOTEL.phone.replace(/-/g, '')}">📞 Позвонить</a>
      <button class="btn" data-act="copy">📋 Адрес</button>
    </div>
    <div class="taxi">
      <b>Для таксиста</b>
      <div class="taxi-name">${esc(HOTEL.name_ja)}</div>
      <div class="taxi-addr">${esc(HOTEL.address_ja)}</div>
      <div class="taxi-tel">TEL ${esc(HOTEL.phone)}</div>
    </div>
    <div class="facts">
      <div class="fact"><div class="ic">🚇</div><div><h3>Ближайшие станции</h3><p>${esc(HOTEL.station)}</p></div></div>
      <div class="fact"><div class="ic">📍</div><div><h3>Адрес</h3><p>${esc(HOTEL.address_en)}</p></div></div>
    </div>
  </div>`;
}
function openHotel() {
  if (state.selected != null) { const prev = state.selected; state.selected = null; refreshMarker(prev); }
  $('#sheet-body').innerHTML = renderHotel();
  $('#sheet-body').scrollTop = 0;
  openSheet('sheet');
  if (location.hash !== '#hotel') history.pushState({}, '', '#hotel');
  flyAboveSheet(HOTEL.lat, HOTEL.lng);
}
$('#btn-hotel').onclick = openHotel;

$('#sheet-body').addEventListener('click', (e) => {
  const img = e.target.closest('.gallery img');
  if (img) return openLightbox(state.byId.get(state.selected), +img.dataset.i);
  const row = e.target.closest('.row');
  if (row) return selectPlace(+row.dataset.id);
  const b = e.target.closest('[data-act]');
  if (!b) return;
  if (b.dataset.act === 'copy') {
    navigator.clipboard?.writeText(`${HOTEL.name_ja}\n${HOTEL.address_ja}`).then(() => toast('Адрес скопирован'), () => toast(HOTEL.address_ja));
    return;
  }
  const id = state.selected;
  const set = b.dataset.act === 'visited' ? state.visited : state.favs;
  set.has(id) ? set.delete(id) : set.add(id);
  LS.set(ck(b.dataset.act === 'visited' ? 'visited' : 'favs'), [...set]);
  if (b.dataset.act === 'visited' && set.has(id)) toast('Отмечено как посещённое ✓');
  refreshMarker(id);
  const sc = $('#sheet-body').scrollTop;
  $('#sheet-body').innerHTML = renderPlace(state.byId.get(id));
  $('#sheet-body').scrollTop = sc;
});

window.addEventListener('popstate', () => {
  const m = location.hash.match(/^#p(\d+)$/);
  if (m) selectPlace(+m[1], { push: false });
  else if (location.hash === '#hotel') openHotel();
  else closeSheet('sheet', true);
});

/* ---------------- lightbox ---------------- */
function openLightbox(p, i) {
  const tr = $('#lb-track');
  tr.innerHTML = p.photos.map((ph) => `<figure><img src="${esc(ph.src)}" alt="">${ph.page ? `<figcaption><a href="${esc(ph.page)}" target="_blank" rel="noopener">${esc(ph.credit || 'Wikimedia Commons')}</a></figcaption>` : ''}</figure>`).join('');
  $('#lightbox').classList.add('open');
  requestAnimationFrame(() => { tr.scrollLeft = tr.clientWidth * i; });
}
$('#lb-close').onclick = () => $('#lightbox').classList.remove('open');
$('#lb-track').addEventListener('click', (e) => { if (e.target.tagName !== 'A') $('#lightbox').classList.remove('open'); });

/* ---------------- list ---------------- */
function openList() { renderList(); openSheet('list'); }
$('#btn-list').onclick = openList;
$('#sort').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.sort === 'dist' && !state.me) { locate(true); toast('Пока считаю от отеля, определяю где вы…'); }
  state.sort = b.dataset.sort;
  LS.set('sort', state.sort);
  renderList();
});

function renderList() {
  [...$('#sort').children].forEach((b) => b.classList.toggle('on', b.dataset.sort === state.sort));
  let arr = visiblePlaces();
  const o = origin();
  if (state.sort === 'dist') arr.sort((a, b) => distKm(o.at, [a.lat, a.lng]) - distKm(o.at, [b.lat, b.lng]));
  else if (state.sort === 'num') arr.sort((a, b) => a.id - b.id);
  else arr.sort((a, b) => (a.priority - b.priority) || ((b.crowd?.level || 0) - (a.crowd?.level || 0)) || a.id - b.id);
  $('#list-title').textContent = state.q ? `Найдено: ${arr.length}` : `Места · ${arr.length}`;
  if (!arr.length) { $('#list-body').innerHTML = '<div class="empty">Ничего не найдено. Сбросьте фильтры.</div>'; return; }
  $('#list-body').innerHTML = arr.map((p) => {
    const cat = CATS[p.category] || CATS.other;
    const st = openStatus(p);
    const th = p.photos?.[0]
      ? `<img class="th" src="${esc(p.photos[0].thumb || p.photos[0].src)}" alt="" loading="lazy">`
      : `<div class="th ph" style="background:${cat.color}">${p.id}</div>`;
    const d = `<span>${state.me ? '📍' : '🏨'} ${fmtDist(distKm(o.at, [p.lat, p.lng]))}</span>`;
    return `<button class="row${state.visited.has(p.id) ? ' visited' : ''}" data-id="${p.id}">${th}<div>
      <div class="nm">${p.priority === 1 ? '★ ' : ''}${esc(p.name_ru)} <small>#${p.id}</small>${state.favs.has(p.id) ? ' <span style="color:#e0365a">♥</span>' : ''}${state.visited.has(p.id) ? ' ✓' : ''}</div>
      <div class="sh">${esc(p.short)}</div>
      <div class="mt">${d}${st ? `<span class="${st.open ? 'o' : ''}">${st.open ? '● ' : ''}${st.text}</span>` : ''}${p.crowd?.level ? `<span>👥 ${p.crowd.level}/5</span>` : ''}<span>${esc(p.area)}</span></div>
    </div></button>`;
  }).join('');
}
$('#list-body').addEventListener('click', (e) => {
  const r = e.target.closest('.row');
  if (r) selectPlace(+r.dataset.id);
});

/* ---------------- geolocation ---------------- */
let meMarker, meCircle, watchId;
function locate(silent) {
  if (!navigator.geolocation) return toast('Геолокация недоступна');
  if (watchId != null && state.me) { map.flyTo(state.me, Math.max(map.getZoom(), 15)); return; }
  let first = true;
  watchId = navigator.geolocation.watchPosition((pos) => {
    state.me = [pos.coords.latitude, pos.coords.longitude];
    const acc = Math.min(pos.coords.accuracy || 0, 1000);
    if (!meMarker) {
      meCircle = L.circle(state.me, { radius: acc, color: '#2a7cf0', weight: 1, opacity: 0.5, fillOpacity: 0.12, interactive: false }).addTo(map);
      meMarker = L.marker(state.me, { icon: L.divIcon({ className: '', html: '<div class="me-dot"></div>', iconSize: [22, 22] }), interactive: false, zIndexOffset: 4000 }).addTo(map);
    } else {
      meMarker.setLatLng(state.me);
      meCircle.setLatLng(state.me).setRadius(acc);
    }
    LS.set('geo', true);
    $('#btn-locate').classList.add('active');
    if (first) {
      first = false;
      if (!silent) map.flyTo(state.me, Math.max(map.getZoom(), 15));
      if ($('#list').classList.contains('open')) renderList();
    }
  }, (err) => {
    if (!silent) toast(err.code === 1 ? 'Нет доступа к геолокации — разрешите в Настройках → Safari/Конфиденциальность' : 'Не удалось определить местоположение');
    if (err.code === 1) LS.set('geo', false);
    if (watchId != null) navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }, { enableHighAccuracy: true, maximumAge: 15000, timeout: 20000 });
}
$('#btn-locate').onclick = () => locate(false);

// Show my position automatically once location was allowed before.
async function autoLocate() {
  let granted = LS.get('geo', false);
  try {
    const st = await navigator.permissions?.query({ name: 'geolocation' });
    if (st?.state === 'granted') granted = true;
    if (st?.state === 'denied') granted = false;
  } catch {}
  if (granted) locate(true);
}
autoLocate();
// iOS pauses the watch in background; restart it when the app comes back
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && LS.get('geo', false)) {
    if (watchId != null) navigator.geolocation.clearWatch(watchId);
    watchId = null;
    locate(true);
  }
});

/* ---------------- menu ---------------- */
$('#btn-menu').onclick = () => { renderMenu(); openSheet('menu'); };
function renderMenu() {
  const total = state.places.length;
  const legend = (CITY_KEY === 'kyoto' ? ['temple', 'shrine', 'castle', 'garden', 'street', 'museum'] : ['temple', 'shrine', 'museum', 'shopping', 'view', 'town', 'garden'])
    .map((k) => `<span><i style="background:${CATS[k].color}"></i>${CATS[k].label}</span>`).join('');
  $('#menu-body').innerHTML = `<div class="menu">
    <h2>${CITY.name}</h2>
    <div class="stat">
      <div><b>${state.visited.size}<small style="font-size:14px;color:var(--ink-3)"> / ${total}</small></b><span>посещено</span></div>
      <div><b>${state.favs.size}</b><span>в избранном</span></div>
    </div>
    <div class="legend">${legend}
      <span><i style="background:#888;outline:2px solid #ffd34d"></i>★ Must-see (крупнее)</span>
      <span><i style="background:#bbb"></i>Посещено (серое)</span>
    </div>
    <button class="btn" id="m-offline">⬇️&nbsp; Скачать карту и фото для офлайна</button>
    <div class="progress" id="m-prog" hidden><i></i></div>
    <p id="m-prog-t" hidden></p>
    <button class="btn" id="m-reset">↺&nbsp; Сбросить отметки «посетил»</button>
    <p>${CITY.note} Часы и цены собраны осенью 2026 и могут меняться — особенно в праздники и сезон клёнов. «Открыто сейчас» — по японскому времени и типичному графику, без учёта выходных.</p>
    <p>Установить как приложение: в Safari «Поделиться» → «На экран „Домой“».</p>
  </div>`;
  $('#m-reset').onclick = () => {
    if (!state.visited.size) return;
    const ids = [...state.visited];
    state.visited.clear(); LS.set(ck('visited'), []);
    ids.forEach(refreshMarker); renderMenu(); toast('Отметки сброшены');
  };
  $('#m-offline').onclick = downloadOffline;
}

/* ---------------- offline pack ---------------- */
function tileUrlsForBBox(b, zMin, zMax) {
  const urls = [];
  for (let z = zMin; z <= zMax; z++) {
    const p1 = map.project([b[1][0], b[0][1]], z).divideBy(256).floor();
    const p2 = map.project([b[0][0], b[1][1]], z).divideBy(256).floor();
    for (let x = p1.x; x <= p2.x; x++) for (let y = p1.y; y <= p2.y; y++) {
      urls.push(TILE_URL.replace('{z}', z).replace('{x}', x).replace('{y}', y));
    }
  }
  return urls;
}
async function downloadOffline() {
  const btn = $('#m-offline'), prog = $('#m-prog'), pt = $('#m-prog-t');
  btn.disabled = true; prog.hidden = false; pt.hidden = false;
  // city centre in detail, wider area less detailed
  const urls = [
    ...CITY.offline.flatMap(([sw, ne, z1, z2]) => tileUrlsForBBox([sw, ne], z1, z2)),
    ...state.places.flatMap((p) => (p.photos || []).flatMap((ph) => [ph.src, ph.thumb].filter(Boolean))),
  ];
  const cache = await caches.open('kyoto-runtime');
  let done = 0, fail = 0;
  const queue = urls.slice();
  async function worker() {
    while (queue.length) {
      const u = queue.shift();
      try {
        if (!(await cache.match(u))) {
          const r = await fetch(u, { mode: u.startsWith('http') ? 'cors' : 'same-origin' });
          if (r.ok) await cache.put(u, r); else fail++;
        }
      } catch { fail++; }
      done++;
      if (done % 10 === 0 || done === urls.length) {
        prog.firstElementChild.style.width = `${(done / urls.length) * 100}%`;
        pt.textContent = `${done} / ${urls.length}`;
      }
    }
  }
  await Promise.all(Array.from({ length: 6 }, worker));
  pt.textContent = fail ? `Готово, не скачалось: ${fail}` : `Готово — карта (${CITY.name}) и фото доступны без интернета`;
  btn.disabled = false;
}

/* ---------------- toast ---------------- */
let toastT;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200);
}

/* ---------------- districts ---------------- */
const DISTRICT_COLORS = ['#e05a47', '#3b7dd8', '#2f9a5a', '#c98a1b', '#8a5ad8', '#d2477e', '#1f9aa8'];
function drawDistricts() {
  CITY.districts.forEach(([name, lat, lng, r, note], i) => {
    const color = DISTRICT_COLORS[i % DISTRICT_COLORS.length];
    L.circle([lat, lng], { radius: r, color, weight: 1.5, dashArray: '5 6', opacity: 0.7, fillColor: color, fillOpacity: 0.09, interactive: false }).addTo(map);
    const lbl = L.marker([lat, lng], {
      icon: L.divIcon({ className: 'district', html: `<span style="--dc:${color}">${esc(name)}</span>`, iconSize: [0, 0] }),
      zIndexOffset: -1000,
    }).addTo(map);
    lbl.on('click', () => openDistrict(name, note, lat, lng));
  });
}
function openDistrict(name, note, lat, lng) {
  if (state.selected != null) { const prev = state.selected; state.selected = null; refreshMarker(prev); }
  const near = state.places
    .map((p) => ({ p, d: distKm([lat, lng], [p.lat, p.lng]) }))
    .filter((x) => x.d < 1.2).sort((a, b) => a.d - b.d).slice(0, 8);
  $('#sheet-body').innerHTML = `<div class="pd" style="padding-top:22px">
    <h1>${esc(name)}</h1>
    <p class="lead">${esc(note)}</p>
    <div class="actions"><a class="btn primary" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' Tokyo')}" target="_blank" rel="noopener">${ICON_MAP}Google Maps</a>
    <a class="btn" href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=transit" target="_blank" rel="noopener">${ICON_ROUTE}Маршрут</a></div>
    ${near.length ? `<h3 class="near-h">Места рядом</h3>` : ''}
  </div>
  ${near.map(({ p }) => `<button class="row" data-id="${p.id}">${p.photos?.[0] ? `<img class="th" src="${esc(p.photos[0].thumb || p.photos[0].src)}" alt="">` : `<div class="th ph" style="background:${(CATS[p.category] || CATS.other).color}">${p.id}</div>`}<div><div class="nm">${esc(p.name_ru)}</div><div class="sh">${esc(p.short)}</div></div></button>`).join('')}`;
  $('#sheet-body').scrollTop = 0;
  openSheet('sheet');
  flyAboveSheet(lat, lng);
}

/* ---------------- city switch ---------------- */
$('#btn-city').textContent = CITY.name;
document.title = `${CITY.name} · карта`;
$('#btn-city').onclick = () => {
  const keys = Object.keys(CITIES);
  const next = keys[(keys.indexOf(CITY_KEY) + 1) % keys.length];
  LS.set('city', next);
  location.replace(location.pathname + location.search);
};

/* ---------------- boot ---------------- */
async function boot() {
  const res = await fetch(CITY.data);
  const data = await res.json();
  state.places = data.places;
  for (const p of state.places) {
    state.byId.set(p.id, p);
    const m = L.marker([p.lat, p.lng], { icon: pinIcon(p), riseOnHover: true, zIndexOffset: p.priority === 1 ? 500 : p.priority === 3 ? -200 : 0 });
    m.bindTooltip(p.name_ru, { permanent: true, direction: 'bottom', className: 'lbl' + (p.priority === 1 ? '' : ' minor'), offset: [0, 2] });
    m.on('click', () => selectPlace(p.id, { fly: false }));
    state.markers.set(p.id, m);
    if (p.line) {
      // streets, paths and bridges are drawn along their real geometry
      const color = LINE_COLORS[p.category] || LINE_COLORS.other;
      const g = L.layerGroup([
        L.polyline(p.line, { color: '#fff', weight: 11, opacity: 0.85, lineCap: 'round', lineJoin: 'round', interactive: false }),
        L.polyline(p.line, { color, weight: 6, opacity: 0.95, lineCap: 'round', lineJoin: 'round' }),
      ]);
      g.eachLayer((l) => l.on('click', (e) => { L.DomEvent.stop(e); selectPlace(p.id, { fly: false }); }));
      state.lines.set(p.id, g);
    }
  }
  drawDistricts();
  applyFilter();
  const h = location.hash.match(/^#p(\d+)$/);
  if (h) selectPlace(+h[1], { push: false });
  else if (location.hash === '#hotel') openHotel();
  // refresh "open now" badges every minute
  setInterval(() => { if ($('#list').classList.contains('open')) renderList(); }, 60000);
}
boot().catch((e) => { console.error(e); toast('Не удалось загрузить данные'); });

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
