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
};
const HOTEL = {
  name: 'Shizutetsu Hotel Prezio Kyoto Shijo',
  name_ja: '静鉄ホテルプレジオ京都四条',
  lat: 35.00507, lng: 135.7549,
  address_ja: '京都市中京区西洞院通錦小路上る古西町452',
  address_en: '452 Konishi-cho, Nishinotoin-dori Nishikikoji-agaru, Nakagyo-ku, Kyoto 604-8227',
  phone: '075-741-7891',
  station: 'Метро «Сидзё» (линия Карасума) или Hankyu «Карасума» — 6 мин пешком; станции соединены под землёй',
};
const CROWD_TXT = ['', 'почти пусто', 'спокойно', 'умеренно', 'людно', 'очень людно'];

const state = {
  places: [],
  byId: new Map(),
  markers: new Map(),
  visited: new Set(LS.get('visited', [])),
  favs: new Set(LS.get('favs', [])),
  filter: LS.get('filter', { cat: 'all', must: false, unesco: false, fav: false, hideVisited: false }),
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
  minZoom: 9,
  maxZoom: 19,
  maxBounds: [[34.4, 135.2], [35.6, 136.4]],
  maxBoundsViscosity: 0.8,
  tap: false,
}).setView(LS.get('view', { c: [35.0116, 135.7681] }).c, LS.get('view', { z: 12 }).z);

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
map.on('moveend', () => LS.set('view', { c: [map.getCenter().lat, map.getCenter().lng], z: map.getZoom() }));
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
  { key: 'unesco', label: 'ЮНЕСКО', flag: true },
  { key: 'fav', label: '♥ Избранное', flag: true },
  { key: 'temple', label: 'Храмы', cat: true },
  { key: 'shrine', label: 'Святилища', cat: true },
  { key: 'nature', label: 'Сады и природа', cat: true },
  { key: 'street', label: 'Улицы и рынки', cat: true },
  { key: 'museum', label: 'Музеи и другое', cat: true },
  { key: 'hideVisited', label: 'Скрыть посещённые', flag: true },
];
const CAT_GROUPS = { nature: ['nature', 'garden'], street: ['street', 'market'], museum: ['museum', 'other', 'castle'] };

function renderChips() {
  const f = state.filter;
  $('#chips').innerHTML = CHIP_DEFS.map((c) => {
    let on;
    if (c.key === 'all') on = f.cat === 'all' && !f.must && !f.unesco && !f.fav;
    else if (c.flag) on = !!f[c.key];
    else on = f.cat === c.key;
    const dot = c.cat ? `<span class="dot" style="background:${(CATS[c.key] || CATS.other).color}"></span>` : '';
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
  LS.set('filter', f);
  applyFilter();
});

function matches(p) {
  const f = state.filter;
  if (f.must && p.priority !== 1) return false;
  if (f.unesco && !p.unesco) return false;
  if (f.fav && !state.favs.has(p.id)) return false;
  if (f.hideVisited && state.visited.has(p.id)) return false;
  if (f.cat !== 'all') {
    const g = CAT_GROUPS[f.cat] || [f.cat];
    if (!g.includes(p.category)) return false;
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
        <span class="badge">${cat.one}</span>
        <span class="badge">${esc(p.area)}${dist}</span>
        ${p.source === 'extra' ? '<span class="badge">не с карты такси</span>' : ''}
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
  const b = e.target.closest('[data-act]');
  if (!b) return;
  if (b.dataset.act === 'copy') {
    navigator.clipboard?.writeText(`${HOTEL.name_ja}\n${HOTEL.address_ja}`).then(() => toast('Адрес скопирован'), () => toast(HOTEL.address_ja));
    return;
  }
  const id = state.selected;
  const set = b.dataset.act === 'visited' ? state.visited : state.favs;
  set.has(id) ? set.delete(id) : set.add(id);
  LS.set(b.dataset.act === 'visited' ? 'visited' : 'favs', [...set]);
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
let meMarker, watchId;
function locate(silent) {
  if (!navigator.geolocation) return toast('Геолокация недоступна');
  if (watchId != null && state.me) { map.flyTo(state.me, Math.max(map.getZoom(), 15)); return; }
  let first = true;
  watchId = navigator.geolocation.watchPosition((pos) => {
    state.me = [pos.coords.latitude, pos.coords.longitude];
    if (!meMarker) meMarker = L.marker(state.me, { icon: L.divIcon({ className: '', html: '<div class="me-dot"></div>', iconSize: [18, 18] }), interactive: false, zIndexOffset: 1000 }).addTo(map);
    else meMarker.setLatLng(state.me);
    $('#btn-locate').classList.add('active');
    if (first) {
      first = false;
      if (!silent) map.flyTo(state.me, Math.max(map.getZoom(), 15));
      if ($('#list').classList.contains('open')) renderList();
    }
  }, (err) => {
    toast(err.code === 1 ? 'Нет доступа к геолокации' : 'Не удалось определить местоположение');
    watchId = null;
  }, { enableHighAccuracy: true, maximumAge: 15000, timeout: 20000 });
}
$('#btn-locate').onclick = () => locate(false);

/* ---------------- menu ---------------- */
$('#btn-menu').onclick = () => { renderMenu(); openSheet('menu'); };
function renderMenu() {
  const total = state.places.length;
  const legend = ['temple', 'shrine', 'castle', 'garden', 'street', 'museum']
    .map((k) => `<span><i style="background:${CATS[k].color}"></i>${CATS[k].label}</span>`).join('');
  $('#menu-body').innerHTML = `<div class="menu">
    <h2>Киото</h2>
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
    <p>Номера 1–81 — как на карте Rakuyo Taxi, 82+ — дополнительные места. Часы и цены собраны осенью 2026 и могут меняться — особенно в сезон сакуры/клёнов и на Новый год. «Открыто сейчас» — по японскому времени и типичному графику, без учёта выходных.</p>
    <p>Установить как приложение: в Safari «Поделиться» → «На экран „Домой“».</p>
  </div>`;
  $('#m-reset').onclick = () => {
    if (!state.visited.size) return;
    const ids = [...state.visited];
    state.visited.clear(); LS.set('visited', []);
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
  // central Kyoto in detail, wider area (Uji, Otsu, Arashiyama, Ohara) less detailed
  const urls = [
    ...tileUrlsForBBox([[34.86, 135.62], [35.14, 135.92]], 10, 14),
    ...tileUrlsForBBox([[34.93, 135.66], [35.07, 135.81]], 15, 15),
    ...tileUrlsForBBox([[34.96, 135.74], [35.04, 135.80]], 16, 16),
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
  pt.textContent = fail ? `Готово, не скачалось: ${fail}` : 'Готово — карта Киото и фото доступны без интернета';
  btn.disabled = false;
}

/* ---------------- toast ---------------- */
let toastT;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200);
}

/* ---------------- boot ---------------- */
async function boot() {
  const res = await fetch('data/places.json');
  const data = await res.json();
  state.places = data.places;
  for (const p of state.places) {
    state.byId.set(p.id, p);
    const m = L.marker([p.lat, p.lng], { icon: pinIcon(p), riseOnHover: true, zIndexOffset: p.priority === 1 ? 500 : p.priority === 3 ? -200 : 0 });
    m.bindTooltip(p.name_ru, { permanent: true, direction: 'bottom', className: 'lbl' + (p.priority === 1 ? '' : ' minor'), offset: [0, 2] });
    m.on('click', () => selectPlace(p.id, { fly: false }));
    state.markers.set(p.id, m);
  }
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
