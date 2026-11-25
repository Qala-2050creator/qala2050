/* QALA 2050 — data sources.
 * 1) OSM mode: live OpenStreetMap features via the Overpass API (status OPEN MAP DATA), cached locally.
 * 2) Demo mode: bundled schematic geometry generated deterministically (status DEMONSTRATION DATA).
 *    Demo geometry is NOT a survey of Kyzylorda: it only keeps the app usable offline. */
(function (G) {
  'use strict';
  const E = G.QEngine;
  const BBOX = [44.79, 65.40, 44.90, 65.62];             // S, W, N, E — Kyzylorda urban area (approx.)
  const OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
  const CACHE_KEY = 'qala.osm.v2', CACHE_DAYS = 7;

  // Landmarks with independently verified coordinates (shown in every mode)
  const VERIFIED = [
    { id: 'lm-center', key: 'lmCenter', lng: 65.50917, lat: 44.85278, src: 'Task brief / geodatos.net; Wikipedia lists 44.85°N 65.5167°E', status: 'VERIFIED' },
    { id: 'lm-airport', key: 'lmAirport', lng: 65.5925, lat: 44.70694, src: 'Wikipedia — Kyzylorda Airport (KZO/UAOO) 44.70694°N 65.59250°E', status: 'VERIFIED' }
  ];

  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const LL = (x, y) => E.toLL(x, y);

  /* ---------------- Demo (offline) dataset ---------------- */
  function demo(popBase) {
    const r = rng(2050);
    const riverXY = [[[9000, -3900], [6500, -3100], [4200, -2400], [2200, -1950], [0, -1750], [-1800, -1600], [-3600, -1150], [-5400, -350], [-7200, 250], [-9500, 500]]];
    const riverWidth = 190;
    const roads = []; let rid = 0;
    const addRoad = (pts, cls, name, bridgeTest) => {
      // split into ~800 m segments for link-level traffic analysis
      for (let i = 1; i < pts.length; i++) {
        const [a, b] = [pts[i - 1], pts[i]], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(L / 800));
        for (let k = 0; k < n; k++) {
          const p0 = [a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n], p1 = [a[0] + (b[0] - a[0]) * (k + 1) / n, a[1] + (b[1] - a[1]) * (k + 1) / n];
          const m = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2];
          const bridge = !!bridgeTest && riverXY.some(l => E.distPtLine(m, l) < riverWidth * 1.6);
          roads.push({ id: 'd' + (rid++), name, cls, bridge, xy: [p0, p1], coords: [LL(...p0), LL(...p1)], mid: LL(...m) });
        }
      }
    };
    addRoad([[-5600, 0], [5600, 0]], 'primary', 'Demo avenue A');
    addRoad([[-5600, 1200], [5600, 1200]], 'primary', 'Demo avenue B');
    addRoad([[-5600, -900], [-3000, -700], [3200, -1000], [5600, -1400]], 'secondary', 'Demo riverside road');
    addRoad([[-5000, 2500], [5600, 2500]], 'secondary', 'Demo avenue C');
    addRoad([[-4400, 3800], [5200, 3800]], 'tertiary', 'Demo street D');
    addRoad([[-6400, 4600], [6400, 4600], [7600, 2000], [7600, -2600]], 'trunk', 'Demo bypass');
    addRoad([[7600, -2600], [8600, -9000], [9500, -16300]], 'trunk', 'Demo airport road', true);
    for (const x of [-4000, -2000, 2000, 4000]) addRoad([[x, -900], [x, 4600]], x === 2000 ? 'primary' : 'secondary', 'Demo street ' + (x / 1000 + 5));
    addRoad([[0, 4600], [0, -1000], [0, -3600]], 'primary', 'Demo central axis', true);
    addRoad([[-3000, -700], [-3000, -2800]], 'secondary', 'Demo west crossing', true);
    addRoad([[-2600, -3000], [2600, -3200]], 'secondary', 'Demo left-bank avenue');
    // vacant reserves kept clear for future-scenario plots
    const reserves = [[300, -3000], [-200, -3300], [-600, -2600], [800, -2700], [3900, 1300], [3500, 1600], [3600, 900], [4100, 1000], [-3300, 2100], [-3000, 2500], [-3600, 1800], [-2700, 2800], [5400, 2400], [5300, -800], [2200, 3200]];
    const nearRoad = (x, y, m) => roads.some(rd => E.distPtLine([x, y], rd.xy) < m);
    const nearRiver = (x, y, m) => riverXY.some(l => E.distPtLine([x, y], l) < m);
    const reserved = (x, y) => reserves.some(c => Math.hypot(c[0] - x, c[1] - y) < 330);
    const buildings = []; let bid = 0;
    const cell = 230;
    for (let gx = -5400; gx <= 5400; gx += cell) for (let gy = -3900; gy <= 4400; gy += cell) {
      const cx = gx + cell / 2, cy = gy + cell / 2, dc = Math.hypot(cx * 0.9, (cy - 800) * 1.1);
      if (cy < -1300 && !(cx > -2600 && cx < 2600 && cy > -4000)) continue;    // left bank: only the new district
      if (nearRiver(cx, cy, 330) || reserved(cx, cy)) continue;
      const density = cy < -1300 ? 0.45 : Math.max(0.18, 1 - dc / 6200);
      if (r() > density + 0.15) continue;
      const n = 1 + Math.floor(r() * (dc < 2500 ? 4 : 3));
      for (let k = 0; k < n; k++) {
        const x = gx + 25 + r() * (cell - 50), y = gy + 25 + r() * (cell - 50);
        if (nearRoad(x, y, 32) || nearRiver(x, y, 260)) continue;
        const central = dc < 2200, house = !central && r() < 0.62;
        const w = house ? 12 + r() * 6 : 18 + r() * 40, l = house ? 10 + r() * 6 : 14 + r() * 22;
        const levels = house ? 1 + (r() < 0.25 ? 1 : 0) : (central ? [5, 5, 9, 9, 12, 4, 3][Math.floor(r() * 7)] : [5, 4, 3, 2, 9][Math.floor(r() * 5)]);
        const cat = house ? 'house' : (r() < 0.78 ? 'apartments' : (r() < 0.5 ? 'commercial' : 'public'));
        const rot = r() < 0.7 ? 0 : 8 - r() * 16;
        const ll = LL(x, y), ring = E.rectRing(ll[0], ll[1], w, l, rot);
        buildings.push({ id: 'b' + (bid++), cat, levels, h: levels * (house ? 3.2 : 3.1), ring, ringXY: ring.map(q => E.toXY(q[0], q[1])), cxy: [x, y], area: w * l, src: 'demo' });
      }
    }
    // homes aggregated to 460 m cells, weighted by residential floor area, normalised to the population assumption
    const agg = new Map(); let totGFA = 0;
    for (const b of buildings) if (b.cat === 'house' || b.cat === 'apartments') {
      const k = Math.floor(b.cxy[0] / 460) + ':' + Math.floor(b.cxy[1] / 460), g = b.area * b.levels;
      const a = agg.get(k) || { x: 0, y: 0, g: 0 }; a.x += b.cxy[0] * g; a.y += b.cxy[1] * g; a.g += g; agg.set(k, a); totGFA += g;
    }
    const homes = [...agg.values()].map(a => ({ xy: [a.x / a.g, a.y / a.g], w: popBase * a.g / totGFA }));
    // facilities (demo)
    const fac = []; let fid = 0;
    const spots = buildings.filter(b => b.cat !== 'house');
    const put = (cat, n, prefix, filter) => { const pool = spots.filter(filter || (() => true)); for (let i = 0; i < n && pool.length; i++) { const b = pool[Math.floor(r() * pool.length)]; const ll = LL(b.cxy[0], b.cxy[1]); fac.push({ id: 'f' + (fid++), cat, name: prefix + ' ' + (i + 1), lng: ll[0], lat: ll[1], xy: b.cxy.slice(), src: 'demo' }); if (cat !== 'transit' && cat !== 'cafe' && cat !== 'grocery') b.cat = 'public'; } };
    put('school', 26, 'Demo school'); put('kinder', 20, 'Demo kindergarten'); put('clinic', 7, 'Demo clinic'); put('hospital', 4, 'Demo hospital', b => Math.hypot(b.cxy[0], b.cxy[1] - 900) < 3200);
    put('university', 2, 'Demo university', b => Math.hypot(b.cxy[0], b.cxy[1] - 600) < 1800); put('sport', 5, 'Demo sports facility'); put('fire', 3, 'Demo fire station');
    put('cafe', 38, 'Demo cafe'); put('restaurant', 22, 'Demo restaurant'); put('grocery', 44, 'Demo grocery'); put('pharmacy', 26, 'Demo pharmacy'); put('gym', 7, 'Demo gym');
    put('hotel', 6, 'Demo hotel', b => Math.hypot(b.cxy[0], b.cxy[1] - 600) < 2500); put('mall', 2, 'Demo mall'); put('education', 9, 'Demo education centre'); put('business', 10, 'Demo office'); put('coworking', 1, 'Demo coworking');
    // bus stops every ~650 m along primary/secondary roads
    let bs = 0; roads.forEach((rd, i) => { if ((rd.cls === 'primary' || rd.cls === 'secondary') && i % 1 === 0 && !rd.bridge) { const m = E.toXY(rd.mid[0], rd.mid[1]); fac.push({ id: 'f' + (fid++), cat: 'transit', name: 'Demo bus stop ' + (++bs), lng: rd.mid[0], lat: rd.mid[1], xy: m, src: 'demo' }); } });
    // parks
    const parks = [[-800, 600, 420, 260], [1500, 1900, 300, 220], [-2600, 1500, 260, 200], [2900, -300, 300, 160], [-1200, -1150, 900, 120], [1200, -1300, 800, 110], [-4300, 600, 220, 200], [3300, 3100, 260, 220], [600, -3600, 380, 200]]
      .map(([x, y, w, l], i) => { const ll = LL(x, y); return { id: 'p' + i, name: 'Demo park ' + (i + 1), ring: E.rectRing(ll[0], ll[1], w, l, 0), xy: [x, y], area: w * l }; });
    parks.forEach(p => { const ll = LL(p.xy[0], p.xy[1]); fac.push({ id: 'f' + (fid++), cat: 'park', name: p.name, lng: ll[0], lat: ll[1], xy: p.xy, area: p.area, src: 'demo' }); });
    const greenArea = parks.reduce((t, p) => t + p.area, 0) * 6.5;   // + street trees & yards (assumption)
    return finish({
      mode: 'demo', status: 'DEMONSTRATION', buildings, homes, fac, roads, parks, riverXY, riverWidth,
      riverLL: riverXY.map(l => l.map(p => LL(p[0], p[1]))), greenArea,
      greenXY: parks.map(p => [p.xy[0], p.xy[1], p.area]), builtXY: buildings.map(b => [b.cxy[0], b.cxy[1], b.area])
    });
  }

  function finish(D) {
    D.landmarks = VERIFIED.slice().concat(D.landmarks || []);
    const xs = [], ys = []; D.homes.forEach(h => { xs.push(h.xy[0]); ys.push(h.xy[1]); });
    D.bboxXY = [Math.min(...xs, -6000), Math.min(...ys, -4000), Math.max(...xs, 6000), Math.max(...ys, 5000)];
    D.roads.forEach(r => { if (!r.xy) r.xy = r.coords.map(c => E.toXY(c[0], c[1])); if (!r.mid) r.mid = r.coords[Math.floor(r.coords.length / 2)]; });
    D.fac.forEach(f => { if (!f.xy) f.xy = E.toXY(f.lng, f.lat); });
    return D;
  }

  /* ---------------- OSM (Overpass) dataset ---------------- */
  function query() {
    const b = BBOX.join(',');
    return `[out:json][timeout:90];(
nwr["amenity"~"^(school|kindergarten|hospital|clinic|doctors|university|college|fire_station|townhall|cafe|restaurant|fast_food|pharmacy|bank)$"](${b});
nwr["shop"~"^(supermarket|convenience|mall|department_store|greengrocer)$"](${b});
nwr["leisure"~"^(park|garden|stadium|sports_centre|fitness_centre|playground)$"](${b});
nwr["tourism"="hotel"](${b});nwr["office"](${b});nwr["railway"="station"](${b});nwr["amenity"="place_of_worship"]["name"](${b});
node["highway"="bus_stop"](${b});
way["landuse"="residential"](${b});
);out tags center bb qt;
way["highway"~"^(trunk|primary|secondary|tertiary)$"](${b});out tags geom qt;
way["waterway"="river"](${b});out geom qt;`;
  }
  function catOf(t) {
    const a = t.amenity, s = t.shop, l = t.leisure;
    if (a === 'school') return 'school'; if (a === 'kindergarten') return 'kinder'; if (a === 'hospital') return 'hospital';
    if (a === 'clinic' || a === 'doctors') return 'clinic'; if (a === 'university' || a === 'college') return 'university';
    if (a === 'fire_station') return 'fire'; if (a === 'cafe') return 'cafe'; if (a === 'restaurant' || a === 'fast_food') return 'restaurant';
    if (a === 'pharmacy') return 'pharmacy'; if (a === 'townhall') return 'government'; if (a === 'place_of_worship') return 'worship';
    if (a === 'bank' || t.office) return 'business';
    if (s === 'mall' || s === 'department_store') return 'mall'; if (s) return 'grocery';
    if (l === 'park' || l === 'garden') return 'park'; if (l === 'fitness_centre') return 'gym'; if (l === 'stadium' || l === 'sports_centre') return 'sport'; if (l === 'playground') return 'playground';
    if (t.tourism === 'hotel') return 'hotel'; if (t.highway === 'bus_stop') return 'transit'; if (t.railway === 'station') return 'station';
    if (t.landuse === 'residential') return 'residential';
    return null;
  }
  const nm = t => t['name:kk'] || t.name || t['name:ru'] || t['name:en'] || '';
  function bbArea(bb) { if (!bb) return 0; const a = E.toXY(bb.minlon, bb.minlat), b = E.toXY(bb.maxlon, bb.maxlat); return Math.abs((b[0] - a[0]) * (b[1] - a[1])); }

  function normaliseOSM(json, popBase) {
    const fac = [], resid = [], roads = [], rivers = [], landmarks = [];
    for (const el of json.elements || []) {
      const t = el.tags || {};
      if (el.type === 'way' && t.highway && el.geometry) {
        const coords = el.geometry.map(g => [+g.lon.toFixed(6), +g.lat.toFixed(6)]);
        // split long ways (~1 km) for link-level loading
        const parts = []; let cur = [coords[0]], L = 0;
        for (let i = 1; i < coords.length; i++) { L += E.distLL(coords[i - 1], coords[i]); cur.push(coords[i]); if (L > 1000 && i < coords.length - 1) { parts.push(cur); cur = [coords[i]]; L = 0; } }
        parts.push(cur);
        parts.forEach((c, k) => { if (c.length > 1) roads.push({ id: 'w' + el.id + '-' + k, name: nm(t), cls: t.highway, lanes: +t.lanes || 0, bridge: t.bridge === 'yes', coords: c, osm: el.id }); });
        continue;
      }
      if (el.type === 'way' && t.waterway === 'river' && el.geometry) { rivers.push({ name: nm(t), ll: el.geometry.map(g => [g.lon, g.lat]) }); continue; }
      const cat = catOf(t); if (!cat) continue;
      const lat = el.lat !== undefined ? el.lat : el.center ? el.center.lat : el.bounds ? (el.bounds.minlat + el.bounds.maxlat) / 2 : null;
      const lng = el.lon !== undefined ? el.lon : el.center ? el.center.lon : el.bounds ? (el.bounds.minlon + el.bounds.maxlon) / 2 : null;
      if (lat === null || lng === null) continue;
      const area = el.bounds ? bbArea(el.bounds) * 0.65 : 0;
      if (cat === 'residential') { resid.push({ xy: E.toXY(lng, lat), a: Math.max(area, 2000) }); continue; }
      const f = { id: el.type[0] + el.id, cat, name: nm(t), lng, lat, area, src: 'osm', osm: el.type + '/' + el.id, addr: [t['addr:street'], t['addr:housenumber']].filter(Boolean).join(' ') };
      fac.push(f);
      if ((cat === 'university' || cat === 'station' || cat === 'government' || (cat === 'sport' && t.leisure === 'stadium') || cat === 'worship') && f.name) landmarks.push({ id: 'lm-' + f.id, name: f.name, lng, lat, src: 'OpenStreetMap ' + f.osm, status: 'OPEN MAP DATA', cat });
    }
    if (!fac.length || !roads.length) throw new Error('OSM response incomplete');
    const totA = resid.reduce((t, x) => t + x.a, 0) || 1;
    let homes = resid.map(x => ({ xy: x.xy, w: popBase * x.a / totA }));
    if (homes.length < 10) {              // sparse residential mapping: fall back to distributing population around mapped schools/shops
      const pts = fac.filter(f => ['school', 'kinder', 'grocery', 'transit'].includes(f.cat));
      homes = pts.map(f => ({ xy: E.toXY(f.lng, f.lat), w: popBase / pts.length }));
    }
    const parks = fac.filter(f => f.cat === 'park');
    const riverXY = rivers.map(r => r.ll.map(p => E.toXY(p[0], p[1])));
    return finish({
      mode: 'osm', status: 'OPEN MAP DATA', buildings: [], homes, fac, roads, parks: [], riverXY, riverLL: rivers.map(r => r.ll), riverWidth: 200,
      greenArea: parks.reduce((t, p) => t + p.area, 0), greenXY: parks.map(p => { const xy = E.toXY(p.lng, p.lat); return [xy[0], xy[1], p.area]; }),
      builtXY: resid.map(x => [x.xy[0], x.xy[1], x.a * 0.28]), landmarks
    });
  }

  async function loadOSM(popBase, onStatus) {
    try { const c = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); if (c && Date.now() - c.t < CACHE_DAYS * 864e5) return Object.assign(normaliseOSM(c.j, popBase), { cachedAt: c.t }); } catch (e) { /* storage unavailable */ }
    let lastErr;
    for (const url of OVERPASS) {
      try {
        onStatus && onStatus('fetch');
        const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 45000);
        const res = await fetch(url, { method: 'POST', body: 'data=' + encodeURIComponent(query()), headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, signal: ctl.signal });
        clearTimeout(to);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const j = await res.json();
        const D = normaliseOSM(j, popBase);
        try { // store a slimmed copy
          const slim = { elements: j.elements.map(e => ({ type: e.type, id: e.id, lat: e.lat, lon: e.lon, center: e.center, bounds: e.bounds, tags: e.tags, geometry: e.geometry && e.geometry.map(g => ({ lat: +g.lat.toFixed(5), lon: +g.lon.toFixed(5) })) })) };
          localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), j: slim }));
        } catch (e) { /* quota */ }
        return D;
      } catch (e) { lastErr = e; }
    }
    throw lastErr || new Error('Overpass unavailable');
  }
  function clearCache() { try { localStorage.removeItem(CACHE_KEY); } catch (e) { } }

  G.QData = { BBOX, VERIFIED, demo, loadOSM, normaliseOSM, clearCache, query };
  if (typeof module !== 'undefined' && module.exports) module.exports = G.QData;
})(typeof window !== 'undefined' ? window : globalThis);
