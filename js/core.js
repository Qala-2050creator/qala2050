/* QALA 2050 — application core: state, persistence, undo/redo, metrics, map sync, shell UI. */
(function (G) {
  'use strict';
  const E = G.QEngine, QD = G.QData;
  const Q = G.Q = { views: {}, notes: [], undo: [], redo: [] };
  const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  Q.$ = $; Q.$$ = $$;
  const esc = v => String(v === undefined || v === null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  Q.esc = esc;

  /* ---------------- i18n ---------------- */
  Q.t = (k, vars) => { const L = G.QI18N[Q.S.lang] || G.QI18N.kk; let s = L[k]; if (s === undefined) s = G.QI18N.en[k]; if (s === undefined) s = k; if (vars) for (const v in vars) s = s.split('{' + v + '}').join(vars[v]); return s; };
  const t = Q.t;
  Q.locale = () => ({ kk: 'kk-KZ', ru: 'ru-RU', en: 'en-GB' }[Q.S.lang] || 'kk-KZ');
  Q.n = (x, d) => Number.isFinite(x) ? x.toLocaleString(Q.locale(), { maximumFractionDigits: d === undefined ? 0 : d, minimumFractionDigits: d && d > 0 ? Math.min(d, 1) : 0 }) : '—';
  Q.pct = (x, d) => Number.isFinite(x) ? Q.n(x * 100, d === undefined ? 0 : d) + '%' : '—';
  Q.kzt = x => { if (!Number.isFinite(x)) return '—'; const a = Math.abs(x); return a >= 1e9 ? Q.n(x / 1e9, 2) + ' ' + t('bn') : a >= 1e6 ? Q.n(x / 1e6, 1) + ' ' + t('mn') : Q.n(x) + ' ₸'; };
  Q.m = x => !Number.isFinite(x) ? '—' : x >= 1000 ? Q.n(x / 1000, 2) + ' ' + t('km') : Q.n(x) + ' ' + t('m');
  Q.badge = s => `<span class="st st-${esc(s)}" title="${esc(t('st_' + s + '_d'))}">${esc(t('st_' + s))}</span>`;
  Q.typeName = k => t('ty_' + k);

  /* ---------------- state & persistence ---------------- */
  const KEY = 'qala.state.v1';
  const DEF = {
    lang: 'kk', theme: 'night', view: 'overview', proposals: [], trees: [], closures: [], trafficMode: 'morning', transitBoost: false,
    budget: 10e9, unitCosts: {}, assumptions: {}, futureYear: 2025, strategy: 'balanced', floodLevel: 2, disaster: 'flood', heatC: 4, drought: 25, failCat: 'clinic', failShare: 0.3,
    citizen: [], profile: { name: '', ach: {}, xp: 0 }, history: [], saved: {}, presenter: 'Ернұр Батырхан Төлеухан',
    layers: { buildings: true, proposals: true, fac: true, traffic: false, heat: false, flood: false, citizen: true, future: true, gaps: false, trees: true, landmarks: true },
    facFilter: { education: true, healthcare: true, residential: true, business: false, transportation: false, recreation: true, government: true, industrial: true, green: true },
    sector: 'all', forceOffline: false, satUrl: '', moderator: false, onboarded: false, aiMode: 'rules', seq: 1, selId: null, compare: { a: 'baseline', b: 'current' }
  };
  function load() { try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s) { const m = Object.assign(JSON.parse(JSON.stringify(DEF)), s); m.layers = Object.assign({}, DEF.layers, s.layers); m.facFilter = Object.assign({}, DEF.facFilter, s.facFilter); return m; } } catch (e) { } return JSON.parse(JSON.stringify(DEF)); }
  Q.S = load();
  if (Q.S.view === 'present') Q.S.view = 'overview';
  let saveT = 0;
  Q.save = () => { clearTimeout(saveT); saveT = setTimeout(() => { try { const c = Object.assign({}, Q.S); localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) { Q.notify(t('nStorage'), 'warn'); } }, 250); };
  Q.resetAll = () => { try { localStorage.removeItem(KEY); } catch (e) { } Q.S = JSON.parse(JSON.stringify(DEF)); Q.undo = []; Q.redo = []; Q.changed(true); Q.renderShell(); Q.open('overview'); };

  /* ---------------- undo / redo ---------------- */
  const snap = () => JSON.stringify({ p: Q.S.proposals, tr: Q.S.trees, c: Q.S.closures });
  Q.commit = (fn) => { Q.undo.push(snap()); if (Q.undo.length > 80) Q.undo.shift(); Q.redo = []; fn(Q.S); Q.changed(); };
  const restore = j => { const o = JSON.parse(j); Q.S.proposals = o.p; Q.S.trees = o.tr; Q.S.closures = o.c; Q.changed(); };
  Q.doUndo = () => { if (!Q.undo.length) return; Q.redo.push(snap()); restore(Q.undo.pop()); };
  Q.doRedo = () => { if (!Q.redo.length) return; Q.undo.push(snap()); restore(Q.redo.pop()); };

  /* ---------------- notifications & achievements ---------------- */
  Q.notify = (msg, lvl) => {
    Q.notes.unshift({ msg, lvl: lvl || 'info', t: new Date() }); Q.notes = Q.notes.slice(0, 30);
    const b = $('#noteCount'); if (b) { b.textContent = Math.min(9, Q.notes.filter(n => !n.read).length); b.hidden = false; }
    const toast = document.createElement('div'); toast.className = 'toast t-' + (lvl || 'info'); toast.textContent = msg; $('#toasts').appendChild(toast);
    setTimeout(() => toast.classList.add('out'), 3200); setTimeout(() => toast.remove(), 3800);
  };
  Q.ACH = ['first', 'five', 'save', 'report', 'vote', 'compare', 'mayor', 'flood', 'pitch', 'lang', 'budget', 'future', 'tree', 'mission'];
  Q.award = k => { const a = Q.S.profile.ach; if (a[k]) return; a[k] = Date.now(); Q.S.profile.xp = (Q.S.profile.xp || 0) + 50; Q.save(); Q.notify('🏅 ' + t('achUnlocked') + ': ' + t('ach_' + k), 'ok'); };

  /* ---------------- metrics ---------------- */
  Q.scenarioState = (over) => {
    const S = Object.assign({}, Q.S, over || {});
    const fp = E.futureProposals(S.strategy, S.futureYear);
    return Object.assign(S, { futureProposals: fp });
  };
  Q.recompute = () => {
    if (!Q.D) return;
    Q.M = E.compute(Q.scenarioState(), Q.D);
    const key = JSON.stringify([Q.S.assumptions, Q.S.trafficMode, Q.D.mode, Q.S.budget]);
    if (key !== Q._m0k) { Q.M0 = E.compute(Q.scenarioState({ proposals: [], trees: [], closures: [], futureYear: 2025, transitBoost: false }), Q.D); Q._m0k = key; }
    checkMissions();
  };
  let raf = 0;
  Q.changed = (now) => {
    Q.save();
    const run = () => { raf = 0; Q.recompute(); Q.syncMap(); Q.renderRight(); Q.renderBottom(); Q.refreshView(); };
    if (now) run(); else if (!raf) raf = requestAnimationFrame(run);
  };

  /* ---------------- missions (based on actual state) ---------------- */
  Q.MISSIONS = [
    { k: 'm1', test: (M, M0) => M.school.cov - M0.school.cov >= 0.02 && M.capex <= 10e9 && M.props.some(p => !p.future && p.type === 'school') },
    { k: 'm2', test: (M, M0) => M.props.some(p => !p.future && p.d.c.res) && M.traffic.index <= M0.traffic.index + 0.002 && M.overrun === 0 },
    { k: 'm3', test: (M, M0) => M.greenPerCap - M0.greenPerCap >= 0.2 },
    { k: 'm4', test: (M) => { const u = M.props.filter(p => !p.future); const r = u.filter(p => p.d.c.res); return r.some(rp => ['school', 'park', 'bus_stop'].every(ty => u.some(p => p.type === ty && E.distLL([p.lng, p.lat], [rp.lng, rp.lat]) < 1000))); } },
    { k: 'm5', test: (M) => Q.S.futureYear === 2050 && M.chi >= 70 && M.renew >= 0.03 }
  ];
  function checkMissions() { if (!Q.M || !Q.M0) return; for (const m of Q.MISSIONS) { m.done = !!m.test(Q.M, Q.M0); if (m.done && !Q.S.profile.ach['mission_' + m.k]) { Q.S.profile.ach['mission_' + m.k] = Date.now(); Q.S.profile.xp += 100; Q.notify('🎯 ' + t('missionDone') + ': ' + t('mis_' + m.k), 'ok'); Q.award('mission'); } } }
  Q.weekly = () => { const d = new Date(), w = Math.floor((d - new Date(d.getFullYear(), 0, 1)) / 6048e5); return Q.MISSIONS[w % Q.MISSIONS.length]; };

  /* ---------------- facilities & categories ---------------- */
  Q.FCOL = { school: '#38bdf8', kinder: '#7dd3fc', university: '#0ea5e9', education: '#93c5fd', hospital: '#f87171', clinic: '#fca5a5', pharmacy: '#fecaca', park: '#22c55e', playground: '#86efac', sport: '#34d399', transit: '#22d3ee', station: '#67e8f9', fire: '#fb923c', government: '#e879f9', worship: '#cbd5e1', business: '#f59e0b', cafe: '#fbbf24', restaurant: '#fbbf24', grocery: '#fcd34d', mall: '#f59e0b', hotel: '#fde68a', gym: '#fde047', coworking: '#facc15' };
  Q.FGROUP = { education: ['school', 'kinder', 'university', 'education'], healthcare: ['hospital', 'clinic', 'pharmacy'], residential: [], business: ['business', 'cafe', 'restaurant', 'grocery', 'mall', 'hotel', 'gym', 'coworking'], transportation: ['transit', 'station'], recreation: ['sport', 'playground'], government: ['government', 'fire', 'worship'], industrial: [], green: ['park'] };
  Q.sectorOf = (xy) => { const [x, y] = xy; if (y < -1500) return 'left'; if (Math.hypot(x, y - 500) < 2200) return 'center'; const a = Math.atan2(y - 500, x) * 180 / Math.PI; return a > 45 && a < 135 ? 'north' : (a >= -45 && a <= 45) ? 'east' : (a >= 135 || a <= -135) ? 'west' : 'south'; };
  Q.facVisible = f => { if (Q.S.sector !== 'all' && Q.sectorOf(f.xy) !== Q.S.sector) return false; for (const g in Q.FGROUP) if (Q.FGROUP[g].includes(f.cat)) return !!Q.S.facFilter[g]; return false; };

  /* ---------------- GeoJSON builders & map sync ---------------- */
  const FC = features => ({ type: 'FeatureCollection', features });
  const pt = (ll, P) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: ll }, properties: P });
  const pg = (ring, P) => ({ type: 'Feature', geometry: { type: 'Polygon', coordinates: [ring] }, properties: P });
  const ln = (c, P) => ({ type: 'Feature', geometry: { type: 'LineString', coordinates: c }, properties: P });
  Q.FC = FC; Q.pt = pt; Q.ln = ln; Q.pg = pg;
  const heatCol = v => v < 0.35 ? '#10b981' : v < 0.5 ? '#84cc16' : v < 0.62 ? '#eab308' : v < 0.75 ? '#f97316' : '#ef4444';
  Q.heatCol = heatCol;
  Q.STATUSCOL = { submitted: '#94a3b8', review: '#60a5fa', planned: '#a78bfa', progress: '#f59e0b', resolved: '#10b981' };
  Q.layerOn = id => {
    const v = Q.S.view, L = Q.S.layers;
    if (id === 'traffic') return L.traffic || v === 'traffic';
    if (id === 'heat') return L.heat || (v === 'eco' && Q.ecoHeat !== false);
    if (id === 'flood') return L.flood || (v === 'disaster' && Q.S.disaster === 'flood');
    if (id === 'gaps') return L.gaps || v === 'infra';
    if (id === 'future') return L.future && Q.S.futureYear > 2025 && !Q.before;
    if (id === 'proposals') return L.proposals && !Q.before;
    return L[id] !== false;
  };
  Q.syncMap = (mapRef, M, S0) => {
    const map = mapRef || Q.map; M = M || Q.M; const S = S0 || Q.S; if (!map || !M) return;
    const realMap = map.kind === 'live', demoOnReal = realMap && Q.D.mode === 'demo';
    const props = M.props.filter(p => !p.future), fut = M.props.filter(p => p.future);
    const lbl = p => p.name || Q.typeName(p.type);
    map.setData('proposals', FC(props.map(p => pg(p.d.ring, { id: p.id, color: p.d.c.color, height: p.d.height + (p.d.c.bridge ? 4 : 0), base: p.d.c.bridge ? 4 : 0, label: lbl(p), outline: p.id === S.selId ? '#ffffff' : null }))));
    map.setData('future', FC(fut.map(p => pg(p.d.ring, { id: p.id, color: '#a78bfa', height: p.d.height, label: Q.typeName(p.type) + ' ' + p.year }))));
    map.setData('fac', FC(demoOnReal ? [] : Q.D.fac.filter(Q.facVisible).map(f => pt([f.lng, f.lat], { id: f.id, cat: f.cat, color: Q.FCOL[f.cat] || '#94a3b8', r: f.cat === 'transit' ? 3 : 4.5, label: f.name, kind: 'fac' }))));
    map.setData('landmarks', FC(Q.D.landmarks.map(l => pt([l.lng, l.lat], { id: l.id, color: l.status === 'VERIFIED' ? '#22d3ee' : '#e2e8f0', r: 6, label: l.key ? t(l.key) : l.name, ring: l.status === 'VERIFIED' ? 'rgba(34,211,238,0.5)' : null, kind: 'landmark', status: l.status, src: l.src }))));
    map.setData('trees', FC((S.trees || []).map(tr => pt([tr.lng, tr.lat], { color: '#4ade80', r: 3 + Math.min(4, (tr.n || 1) / 20) }))));
    const clusters = Q.citizenClusters();
    map.setData('citizen', FC((S.citizen || []).map(c => pt([c.lng, c.lat], { id: c.id, color: Q.STATUSCOL[c.status] || '#94a3b8', r: 6, ring: clusters.ids.has(c.id) ? 'rgba(239,68,68,0.8)' : null, kind: 'citizen' }))));
    // traffic
    map.setData('traffic', FC(demoOnReal ? [] : M.traffic.segs.map(s => ln(s.coords, { color: s.closed ? '#64748b' : s.isNew ? '#22d3ee' : E.congColor(s.vc), wm: s.cls === 'trunk' ? 22 : s.cls === 'primary' ? 18 : 13, dash: s.closed ? 1 : 0, id: s.id }))));
    // heat
    map.setData('heat', FC(demoOnReal ? [] : M.heat.cells.map(c => { const h = 300; const r = [[c.x - h, c.y - h], [c.x + h, c.y - h], [c.x + h, c.y + h], [c.x - h, c.y + h], [c.x - h, c.y - h]].map(q => E.toLL(q[0], q[1])); return pg(r, { color: heatCol(c.v), opacity: 0.38 }); })));
    // flood band (educational proxy)
    const band = (S.floodLevel || 0) / M.A.floodSlope;
    map.setData('flood', FC(band > 0 ? (Q.D.riverXY || []).map(l => { const r = G.LiteMap.buffer(l, band + (Q.D.riverWidth || 180) / 2).map(q => E.toLL(q[0], q[1])); r.push(r[0]); return pg(r, { color: '#3b82f6', opacity: 0.33 }); }) : []));
    // access gaps
    const svc = Q.gapSvc || 'school', cv = M.cov[svc];
    map.setData('gaps', FC(demoOnReal || !cv ? [] : M.homes.map((h, i) => { const d = cv.dist[i]; return pt(E.toLL(h.xy[0], h.xy[1]), { color: d <= cv.radius ? '#10b981' : d <= cv.radius * 2 ? '#f59e0b' : '#ef4444', r: Math.max(3, Math.min(9, Math.sqrt(h.w) / 9)) }); })));
    map.setData('measure', FC(Q.measureFeatures()));
    for (const id of ['buildings', 'proposals', 'future', 'fac', 'landmarks', 'trees', 'citizen', 'traffic', 'heat', 'flood', 'gaps', 'measure']) map.setVisible(id, id === 'measure' ? true : Q.layerOn(id));
    if (map === Q.map) Q.renderLegend();
  };

  /* ---------------- vehicles (simulated, for visual playback) ---------------- */
  Q.playing = false;
  Q.togglePlay = (on) => {
    Q.playing = on === undefined ? !Q.playing : on; if (!Q.map) return;
    if (Q.playing && !Q.layerOn('traffic')) { Q.S.layers.traffic = true; Q.syncMap(); }
    Q.map.setVisible('vehicles', Q.playing); Q.map.setAnimating(Q.playing);
    clearInterval(Q._vt); if (Q.playing) { const t0 = performance.now(); Q._vt = setInterval(() => drawVehicles((performance.now() - t0) / 1000), 60); } else Q.map.setData('vehicles', FC([]));
    Q.renderBottom();
  };
  function drawVehicles(sec) {
    const M = Q.M; if (!M) return; const out = [];
    for (const s of M.traffic.segs) {
      if (s.closed || Q.D.mode === 'demo' && Q.map.kind === 'live') continue;
      const L = E.lineLen(s.coords), n = Math.min(14, Math.round(s.vc * L / 180));
      const speed = 0.08 * Math.max(0.15, 1.15 - Math.min(1.1, s.vc));
      for (let i = 0; i < n; i++) {
        let f = ((sec * speed * 600 / Math.max(L, 50)) + i / n + (s.id.length * 0.13)) % 1; if (i % 2) f = 1 - f;
        out.push(pt(along(s.coords, f), { color: s.vc >= 1 ? '#fecaca' : s.vc >= 0.8 ? '#fed7aa' : '#ecfeff', r: 2.4 }));
      }
    }
    Q.map.setData('vehicles', FC(out));
  }
  function along(c, f) { const L = E.lineLen(c) * f; let acc = 0; for (let i = 1; i < c.length; i++) { const d = E.distLL(c[i - 1], c[i]); if (acc + d >= L) { const k = (L - acc) / (d || 1); return [c[i - 1][0] + (c[i][0] - c[i - 1][0]) * k, c[i - 1][1] + (c[i][1] - c[i - 1][1]) * k]; } acc += d; } return c[c.length - 1]; }

  /* ---------------- measurement tool ---------------- */
  Q.measure = []; Q.measureFeatures = () => { const f = Q.measure.map(p => pt(p, {})); if (Q.measure.length > 1) f.push(ln(Q.measure, {})); return f; };
  Q.measureLen = () => { let L = 0; for (let i = 1; i < Q.measure.length; i++) L += E.distLL(Q.measure[i - 1], Q.measure[i]); return L; };

  /* ---------------- citizen clustering (rule-based) ---------------- */
  Q.citizenClusters = () => {
    const list = Q.S.citizen || [], groups = [], ids = new Set(), used = new Set();
    for (const a of list) {
      if (used.has(a.id) || a.status === 'resolved') continue;
      const g = list.filter(b => b.cat === a.cat && b.status !== 'resolved' && E.distLL([a.lng, a.lat], [b.lng, b.lat]) < 350);
      if (g.length >= 3) { g.forEach(b => { used.add(b.id); ids.add(b.id); }); groups.push({ cat: a.cat, n: g.length, ll: [g.reduce((s, b) => s + b.lng, 0) / g.length, g.reduce((s, b) => s + b.lat, 0) / g.length], votes: g.reduce((s, b) => s + (b.votes || 0), 0) }); }
    }
    return { groups, ids };
  };

  /* ---------------- downloads (artifact capability or blob link) ---------------- */
  Q.download = async (filename, data, mime) => {
    try {
      if (G.claude && G.claude.use) { const dl = await Promise.race([G.claude.use('downloads'), new Promise(r => setTimeout(() => r(null), 1500))]); if (dl) { await dl.save({ filename, data: typeof data === 'string' ? new Blob([data], { type: mime || 'text/plain' }) : data }); Q.notify(t('nSaved') + ': ' + filename, 'ok'); return; } }
    } catch (e) { if (e && e.code === 'declined') return; }
    try {
      const blob = data instanceof Blob ? data : new Blob([data], { type: (mime || 'text/plain') + ';charset=utf-8' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
      Q.notify(t('nSaved') + ': ' + filename, 'ok');
    } catch (e) { Q.notify(t('nDlFail'), 'warn'); }
  };
  Q.dataURLtoBlob = u => { const [h, b] = u.split(','), m = h.match(/:(.*?);/)[1], s = atob(b), a = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return new Blob([a], { type: m }); };

  /* ---------------- proposals ---------------- */
  Q.addProposal = (type, ll, extra) => {
    const c = E.CATALOG[type]; if (!c) return;
    const id = 'p' + (Q.S.seq++);
    const p = Object.assign({ id, type, lng: +ll[0].toFixed(6), lat: +ll[1].toFixed(6), rot: 0, w: c.w, l: c.l, floors: c.floors, capacity: 0, budget: 0, name: '' }, extra || {}); p.id = id; delete p._screen;
    Q.commit(S => { S.proposals.push(p); S.selId = id; });
    Q.validate(p, true);
    if (Q.S.proposals.length === 1) Q.award('first'); if (Q.S.proposals.length >= 5) Q.award('five');
    return p;
  };
  Q.getSel = () => Q.S.proposals.find(p => p.id === Q.S.selId);
  Q.validate = (p, announce) => {
    const r = E.screen(p, Q.D, Q.S.proposals, Q.S.assumptions); if (!r || !r.warn) return null;
    const live = Q.map && Q.map.checkSite ? Q.map.checkSite(r.d.ring) : null;
    const w = r.warn.slice(); const has = k => w.some(x => x.k === k);
    if (live && !live.unknown) {
      if (live.water && !r.d.c.bridge && !has('water')) w.push({ k: 'water', lvl: 'crit' });
      if (live.buildings && !r.d.c.road && !has('bldg')) w.push({ k: 'bldg', lvl: 'crit', n: live.buildings });
      if (live.roads && !r.d.c.road && !has('road')) w.push({ k: 'road', lvl: 'warn', n: live.roads });
    }
    r.warn = w; r.live = live; p._screen = r;
    if (announce && w.some(x => x.lvl === 'crit')) Q.notify(t('nConflict') + ': ' + w.filter(x => x.lvl === 'crit').map(x => t('w_' + x.k, { n: x.n || '' })).join('; '), 'warn');
    return r;
  };

  /* ---------------- map bootstrap ---------------- */
  Q.bootMap = async () => {
    const host = $('#map'); host.innerHTML = '';
    Q.setLoading(t('ldMap'));
    let live = null;
    if (!Q.S.forceOffline && G.LiveMap) {
      try { const style = await G.LiveMap.preflight(); live = new G.LiveMap(host, { style, theme: Q.S.theme, center: [66.9, 48.0], zoom: 4.2, pitch: 0 }); await Promise.race([live.ready, new Promise((_, r) => setTimeout(() => r(new Error('map load timeout')), 20000))]); }
      catch (e) { if (live) try { live.destroy(); } catch (x) { } live = null; host.innerHTML = ''; Q.mapErr = String(e && e.message || e); }
    }
    Q.map = live || new G.LiteMap(host, { theme: Q.S.theme });
    Q.mode = live ? 'live' : 'lite';
    if (live) { live.on('error', () => { Q.tileErrors = (Q.tileErrors || 0) + 1; if (Q.tileErrors === 3) Q.notify(t('nTileErr'), 'warn'); }); live.on('loading', on => { const el = $('#mapBusy'); if (el) el.hidden = !on; }); if (Q.S.satUrl) live.setSatellite(Q.S.satUrl); }
    // data
    Q.D = QD.demo(E.mergeA(Q.S.assumptions).popBase); Q.dataNote = null;
    if (live) {
      Q.setLoading(t('ldData'));
      try { Q.D = await QD.loadOSM(E.mergeA(Q.S.assumptions).popBase); }
      catch (e) { Q.dataNote = 'osmFail'; Q.notify(t('nOsmFail'), 'warn'); }
    }
    Q.map.setBase(Q.D);
    bindMap(Q.map);
    Q.recompute(); Q.syncMap(); Q.renderRight(); Q.renderBottom(); Q.renderStatus(); Q.refreshView(true);
    Q.setLoading(null);
    Q.map.on('move', () => { Q.renderScale(); Q.renderCompass(); if (Q.map2 && Q.syncing !== 2) { Q.syncing = 1; Q.map2.setView(Q.map.getView()); Q.syncing = 0; } });
    await Q.opening();
  };
  Q.opening = async () => {
    const m = Q.map;
    if (m.kind === 'live') { await m.flyTo({ center: [65.509, 44.842], zoom: 12.3, pitch: 35, bearing: -10, duration: 3800 }); await m.flyTo({ center: [65.506, 44.847], zoom: 15.2, pitch: 58, bearing: 28, duration: 3200 }); await m.flyTo({ center: [65.51, 44.846], zoom: 13.6, pitch: 52, bearing: -15, duration: 2200 }); }
    else { m.setView({ center: [65.509, 44.84], zoom: 10.2, pitch: 10, bearing: 30 }); await m.flyTo({ center: [65.509, 44.846], zoom: 12.6, pitch: 52, bearing: -12, duration: 2600 }); }
    Q.renderScale(); Q.renderCompass();
  };
  Q.home = { center: [65.51, 44.846], zoom: 13.4, pitch: 52, bearing: -15 };
  Q.resetCamera = () => Q.map.flyTo(Object.assign({}, Q.home, { zoom: Q.map.kind === 'live' ? 13.4 : 12.6, duration: 1200 }));

  function bindMap(map) {
    map.on('click', e => {
      const v = Q.views[Q.S.view];
      if (Q.tool === 'measure') { Q.measure.push(e.lngLat); Q.syncMap(); Q.renderMeasure(); return; }
      if (v && v.onMapClick && v.onMapClick(e) === true) return;
      if (e.hit && e.hit.layer === 'proposals' && e.hit.props && e.hit.props.id) { Q.S.selId = e.hit.props.id; if (Q.S.view !== 'build') Q.open('build'); else Q.changed(); return; }
      if (e.hit) Q.showInfo(e.hit, e.lngLat); else Q.hideInfo();
    });
    let dragId = null;
    map.on('down', e => { if (Q.S.view === 'build' && e.hit && e.hit.layer === 'proposals' && e.hit.props && e.hit.props.id) { dragId = e.hit.props.id; Q.S.selId = dragId; Q.undo.push(snap()); Q.redo = []; return true; } });
    map.on('drag', e => { if (!dragId) return; const p = Q.S.proposals.find(x => x.id === dragId); if (p) { p.lng = +e.lngLat[0].toFixed(6); p.lat = +e.lngLat[1].toFixed(6); Q.changed(); } });
    map.on('up', e => { if (dragId) { const p = Q.S.proposals.find(x => x.id === dragId); if (p && e.moved) Q.validate(p, true); dragId = null; Q.changed(); } });
    map.on('hover', e => { const c = $('#coords'); if (c) c.textContent = e.lngLat[1].toFixed(5) + ', ' + e.lngLat[0].toFixed(5); });
  }

  /* ---------------- info panel (Digital City Explorer) ---------------- */
  Q.showInfo = (hit, ll) => {
    const P = hit.props || {}, el = $('#info'); const row = (k, v, st) => `<div class="kv"><span>${esc(t(k))}</span><b>${v === null || v === undefined || v === '' ? '<i class="na">' + esc(t('unavailable')) + '</i>' : esc(v)}</b>${st ? Q.badge(st) : ''}</div>`;
    let h = '';
    const near = (xy) => {
      const out = []; for (const k of ['school', 'clinic', 'hospital', 'park', 'transit']) { let b = Infinity, nm = ''; for (const f of Q.D.fac) if (f.cat === k) { const d = Math.hypot(f.xy[0] - xy[0], f.xy[1] - xy[1]); if (d < b) { b = d; nm = f.name; } } if (b < Infinity) out.push(`<li>${esc(t('fc_' + k))}: <b>${Q.m(b)}</b> <span class="muted">${esc(nm)}</span></li>`); }
      let rb = Infinity, rn = ''; for (const r of Q.D.roads) { const d = E.distPtLine(xy, r.xy); if (d < rb) { rb = d; rn = r.name || t('unnamedRoad'); } }
      return { list: out.join(''), road: rb < 400 ? rn + ' (' + Q.m(rb) + ')' : null };
    };
    const xy = E.toXY(ll[0], ll[1]);
    if (hit.layer === 'buildings') {
      const live = !!P.live, ring = hit.ringLL || P.ring || null;
      const area = ring ? E.ringArea(ring) : (P.area || null);
      const hgt = live ? P.render_height : P.h, st = live ? (P.render_height === 5 || P.render_height === undefined ? 'EST' : 'OPEN') : 'DEMO';
      const nr = near(xy);
      h = `<h3>${esc(live ? (P.name || t('bldOSM')) : t('bldDemo'))}</h3>
        ${row('iCategory', live ? (P.poiClass || t('unavailable')) : t('bc_' + P.cat), live ? 'OPEN' : 'DEMO')}
        ${row('iAddress', live ? (P.housenumber ? (P.roads && P.roads[0] ? P.roads[0] + ', ' : '') + P.housenumber : null) : null, live && P.housenumber ? 'OPEN' : null)}
        ${row('iCoords', ll[1].toFixed(5) + ', ' + ll[0].toFixed(5))}
        ${row('iHeight', Number.isFinite(+hgt) ? Q.n(+hgt, 1) + ' ' + t('m') : null, st)}
        ${row('iFloors', live ? null : P.levels, live ? null : 'DEMO')}
        ${row('iArea', area ? Q.n(area) + ' ' + t('m2') : null, 'EST')}
        ${row('iRoad', live && P.roads && P.roads.length ? P.roads.join(', ') : nr.road, live ? 'OPEN' : Q.D.mode === 'demo' ? 'DEMO' : 'OPEN')}
        <div class="kv col"><span>${esc(t('iNearby'))}</span><ul class="near">${nr.list}</ul></div>
        <p class="note">${esc(live ? t('iHeightNote') : t('iDemoNote'))}</p>
        ${row('iSource', live ? 'OpenStreetMap · OpenMapTiles (OpenFreeMap)' : t('srcDemo'))}`;
      Q.map.setData('sel', FC(ring ? [pg(ring, { color: '#22d3ee', height: (+hgt || 5) + 0.6, base: 0 })] : []));
    } else if (hit.layer === 'fac') {
      const f = Q.D.fac.find(x => x.id === P.id) || {}; const nr = near(f.xy || xy);
      h = `<h3>${esc(f.name || t('fc_' + f.cat))}</h3>${row('iCategory', t('fc_' + f.cat), f.src === 'osm' ? 'OPEN' : 'DEMO')}${row('iAddress', f.addr || null, f.addr ? 'OPEN' : null)}${row('iCoords', (+f.lat).toFixed(5) + ', ' + (+f.lng).toFixed(5))}${row('iRoad', nr.road)}<div class="kv col"><span>${esc(t('iNearby'))}</span><ul class="near">${nr.list}</ul></div>${row('iSource', f.src === 'osm' ? 'OpenStreetMap ' + (f.osm || '') : t('srcDemo'))}`;
    } else if (hit.layer === 'landmarks') {
      h = `<h3>${esc(P.label)}</h3>${row('iCoords', ll[1].toFixed(5) + ', ' + ll[0].toFixed(5))}${row('iSource', P.src, P.status === 'VERIFIED' ? 'VERIFIED' : 'OPEN')}`;
    } else if (hit.layer === 'citizen') {
      const c = (Q.S.citizen || []).find(x => x.id === P.id); if (!c) return;
      h = `<h3>${esc(t('cc_' + c.cat))}</h3><p>${esc(c.text)}</p>${c.img ? `<img class="thumb" src="${esc(c.img)}" alt="">` : ''}${row('cStatus', t('cs_' + c.status))}${row('cVotes', c.votes || 0)}<p class="note">${esc(t('cNotOfficial'))}</p>`;
    } else if (hit.layer === 'future') {
      const p = Q.M.props.find(x => x.id === P.id); if (!p) return;
      h = `<h3>${esc(Q.typeName(p.type))} · ${p.year}</h3>${row('iCapacity', Q.n(p.d.cap) + ' ' + t('u_' + p.d.c.capU))}${row('bCapex', Q.kzt(p.d.capex), 'EST')}<p class="note">${esc(t('futNote'))}</p>`;
    } else return;
    el.innerHTML = `<button class="x" aria-label="${esc(t('close'))}" onclick="Q.hideInfo()">×</button>` + h; el.hidden = false;
  };
  Q.hideInfo = () => { const el = $('#info'); if (el) el.hidden = true; if (Q.map) Q.map.setData('sel', FC([])); };

  /* ---------------- shell rendering ---------------- */
  Q.NAV = ['overview', 'city', 'build', 'traffic', 'eco', 'disaster', 'budget', 'citizen', 'future', 'infra', 'biz', 'mayor', 'compare', 'reports', 'model', 'present', 'settings'];
  Q.renderShell = () => {
    document.documentElement.lang = Q.S.lang;
    $$('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    $$('[data-i18n-title]').forEach(el => { el.title = t(el.dataset.i18nTitle); el.setAttribute('aria-label', t(el.dataset.i18nTitle)); });
    $$('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
    $('#nav').innerHTML = Q.NAV.map(k => `<button class="nav-i${Q.S.view === k ? ' on' : ''}" data-v="${k}" title="${esc(t('nav_' + k))}">${G.QIcons[k] || ''}<span>${esc(t('nav_' + k))}</span></button>`).join('');
    $$('#langSw button').forEach(b => b.classList.toggle('on', b.dataset.l === Q.S.lang));
    $('#yearChip').textContent = Q.S.futureYear > 2025 ? Q.S.futureYear : t('baseline');
    Q.renderStatus();
  };
  Q.renderStatus = () => {
    const el = $('#dataStatus'); if (!el) return;
    const mapSt = Q.mode === 'live' ? 'OPEN' : 'DEMO', dSt = Q.D ? (Q.D.mode === 'osm' ? 'OPEN' : 'DEMO') : 'UNAVAILABLE';
    el.innerHTML = `<span class="dot ${Q.mode === 'live' ? 'ok' : 'warn'}"></span><span class="ds-t">${esc(Q.mode === 'live' ? t('dsLive') : t('dsOffline'))}</span>`;
    el.title = t('dsMap') + ': ' + t('st_' + mapSt) + ' · ' + t('dsAnalytics') + ': ' + t('st_' + dSt);
    const b = $('#mapBadge');
    if (b) b.innerHTML = `${Q.badge(mapSt)} <span>${esc(Q.mode === 'live' ? t('mbLive') : t('mbDemo'))}</span>${Q.D && Q.D.mode === 'demo' && Q.mode === 'live' ? ' · ' + Q.badge('DEMO') + ' <span>' + esc(t('mbDemoAnalytics')) + '</span> <button class="lnk" onclick="Q.retryData()">' + esc(t('retry')) + '</button>' : ''}${Q.mode === 'lite' && !Q.S.forceOffline ? ' <button class="lnk" onclick="Q.retryLive()">' + esc(t('retryLive')) + '</button>' : ''}`;
  };
  Q.retryData = async () => { Q.setLoading(t('ldData')); try { QD.clearCache(); Q.D = await QD.loadOSM(E.mergeA(Q.S.assumptions).popBase); Q.map.setBase(Q.D); Q.notify(t('nOsmOk'), 'ok'); } catch (e) { Q.notify(t('nOsmFail'), 'warn'); } Q.setLoading(null); Q._m0k = null; Q.changed(true); Q.renderStatus(); };
  Q.retryLive = async () => { Q.togglePlay(false); if (Q.map) Q.map.destroy(); Q.map = null; await Q.bootMap(); Q.notify(Q.mode === 'live' ? t('nLiveOk') : t('nLiveFail'), Q.mode === 'live' ? 'ok' : 'warn'); };
  Q.setLoading = msg => { const el = $('#loading'); if (!el) return; el.hidden = !msg; if (msg) $('#loadingMsg').textContent = msg; };

  Q.renderScale = () => {
    const el = $('#scale'); if (!el || !Q.map) return; const mpp = Q.map.mpp(); const target = mpp * 110;
    const nice = [10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000].find(v => v >= target * 0.6) || 20000;
    el.style.width = Math.round(nice / mpp) + 'px'; el.textContent = Q.m(nice);
  };
  Q.renderCompass = () => { const el = $('#compassN'); if (el && Q.map) el.style.transform = `rotate(${-Q.map.getView().bearing}deg)`; };
  Q.renderMeasure = () => { const el = $('#measureOut'); if (!el) return; el.hidden = Q.tool !== 'measure'; el.innerHTML = `${esc(t('measureLbl'))}: <b>${Q.m(Q.measureLen())}</b> <span class="muted">(${esc(t('straight'))})</span> <button class="lnk" onclick="Q.measure=[];Q.syncMap();Q.renderMeasure()">${esc(t('clear'))}</button>`; };

  Q.renderLegend = () => {
    const el = $('#legend'); if (!el) return; const it = [];
    if (Q.layerOn('traffic')) it.push(`<div class="lg-t">${esc(t('lgTraffic'))} ${Q.badge('SIM')}</div>` + [['#22c55e', 'cLow'], ['#eab308', 'cMod'], ['#f97316', 'cHigh'], ['#ef4444', 'cCrit'], ['#22d3ee', 'cNewLink'], ['#64748b', 'cClosed']].map(([c, k]) => `<span class="lg"><i style="background:${c}"></i>${esc(t(k))}</span>`).join(''));
    if (Q.layerOn('heat')) it.push(`<div class="lg-t">${esc(t('lgHeat'))} ${Q.badge('EST')}</div><div class="ramp"></div><div class="ramp-l"><span>${esc(t('low'))}</span><span>${esc(t('high'))}</span></div>`);
    if (Q.layerOn('flood') && Q.S.floodLevel > 0) it.push(`<div class="lg-t">${esc(t('lgFlood'))} ${Q.badge('DEMO')}</div><span class="lg"><i style="background:#3b82f6"></i>${esc(t('lgFloodBand', { m: Q.n(Q.S.floodLevel, 1) }))}</span>`);
    if (Q.layerOn('gaps')) it.push(`<div class="lg-t">${esc(t('lgGaps'))}: ${esc(t('fc_' + (Q.gapSvc === 'health' ? 'clinic' : Q.gapSvc === 'kinder' ? 'kinder' : Q.gapSvc || 'school')))} ${Q.badge('EST')}</div>` + [['#10b981', 'gIn'], ['#f59e0b', 'gNear'], ['#ef4444', 'gOut']].map(([c, k]) => `<span class="lg"><i style="background:${c}"></i>${esc(t(k))}</span>`).join(''));
    if (Q.layerOn('proposals') && Q.S.proposals.length) it.push(`<span class="lg"><i style="background:#c4b5fd;outline:1px solid #fff"></i>${esc(t('lgProposed'))}</span>`);
    if (Q.layerOn('future')) it.push(`<span class="lg"><i style="background:#a78bfa;opacity:.7"></i>${esc(t('lgFuture'))}</span>`);
    if (Q.layerOn('citizen') && (Q.S.citizen || []).length) it.push(`<span class="lg"><i style="background:#94a3b8"></i>${esc(t('lgCitizen'))}</span>`);
    it.push(`<span class="lg"><i style="background:#22d3ee;border-radius:50%"></i>${esc(t('lgVerified'))}</span>`);
    el.innerHTML = it.join('');
  };

  /* ---------------- right panel: KPIs, CHI, recommendations ---------------- */
  const delta = (a, b, d, inv, unit) => { const x = a - b; if (!Number.isFinite(x) || Math.abs(x) < Math.pow(10, -(d || 0)) / 2) return '<span class="dl z">±0</span>'; const good = inv ? x < 0 : x > 0; return `<span class="dl ${good ? 'up' : 'dn'}">${x > 0 ? '+' : '−'}${Q.n(Math.abs(x), d)}${unit || ''}</span>`; };
  Q.delta = delta;
  Q.ring = (v, size, label) => { const r = size / 2 - 7, c = 2 * Math.PI * r, col = v >= 75 ? '#10b981' : v >= 55 ? '#f59e0b' : '#ef4444'; return `<svg class="ring" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="${esc(label || '')} ${Math.round(v)}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" stroke="rgba(148,163,184,.18)" stroke-width="8" fill="none"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" stroke="${col}" stroke-width="8" fill="none" stroke-linecap="round" stroke-dasharray="${c * v / 100} ${c}" transform="rotate(-90 ${size / 2} ${size / 2})"/><text x="50%" y="52%" text-anchor="middle" dominant-baseline="middle" class="ring-v">${Math.round(v)}</text></svg>`; };
  Q.bar = (v, col) => `<div class="bar"><i style="width:${Math.max(0, Math.min(100, v))}%;background:${col || 'var(--cy)'}"></i></div>`;
  Q.renderRight = () => {
    const el = $('#right'); const M = Q.before ? Q.M0 : Q.M, M0 = Q.M0; if (!el || !M) return;
    const sc = M.scores, cats = ['transport', 'environment', 'infrastructure', 'access', 'economy', 'resilience'];
    const recs = G.QMayor ? G.QMayor.recs(M, M0).slice(0, 3) : [];
    el.innerHTML = `
      <section class="card chi"><div class="chi-top">${Q.ring(M.chi, 92, t('chi'))}<div><h4>${esc(t('chi'))} ${Q.badge('MODEL')}</h4><div class="muted sm">${esc(t('chiSub'))}</div><div class="chi-d">${esc(t('vsBase'))}: ${delta(M.chi, M0.chi, 1)}</div></div></div>
        ${cats.map(k => `<div class="cat"><span>${esc(t('sc_' + k))} <em>${Math.round(E.WEIGHTS[k] * 100)}%</em></span><b>${Math.round(sc[k])}</b>${Q.bar(sc[k], sc[k] >= 75 ? 'var(--em)' : sc[k] >= 55 ? 'var(--am)' : 'var(--rd)')}</div>`).join('')}
      </section>
      <section class="kpis">
        <div class="kpi"><span>${esc(t('kPop'))}</span><b>${Q.n(M.pop)}</b><small>${M.pop === M.popBase ? Q.badge('VERIFIED') : Q.badge('MODEL')} ${delta(M.pop, M0.pop)}</small></div>
        <div class="kpi"><span>${esc(t('kTraffic'))}</span><b>${Q.n(M.traffic.index, 2)}</b><small>${Q.badge('SIM')} ${delta(M.traffic.index, M0.traffic.index, 3, true)}</small></div>
        <div class="kpi"><span>${esc(t('kSchool'))}</span><b class="${M.school.pressure > 1 ? 'warn' : ''}">${Q.pct(M.school.pressure)}</b><small>${Q.badge('EST')} ${esc(t('ofCap'))}</small></div>
        <div class="kpi"><span>${esc(t('kGreen'))}</span><b>${Q.n(M.greenPerCap, 1)} ${esc(t('m2'))}</b><small>${Q.badge('EST')} ${delta(M.greenPerCap, M0.greenPerCap, 2)}</small></div>
        <div class="kpi"><span>${esc(t('kBudget'))}</span><b class="${M.overrun > 0 ? 'crit' : ''}">${Q.kzt(M.capexC)}</b><small>${esc(t('of'))} ${Q.kzt(M.budget)} · ${M.overrun > 0 ? '<span class="dl dn">' + esc(t('overrun')) + '</span>' : esc(t('left')) + ' ' + Q.kzt(M.remaining)}</small></div>
        <div class="kpi"><span>${esc(t('kRisk'))}</span><b class="${M.risk > 40 ? 'warn' : ''}">${Math.round(M.risk)}</b><small>${Q.badge('MODEL')} ${delta(M.risk, M0.risk, 0, true)}</small></div>
      </section>
      <section class="card"><h4>${esc(t('aiRecs'))} <span class="st st-RULE">${esc(t('ruleBased'))}</span></h4>${recs.length ? recs.map(r => `<div class="rec rec-${r.lvl}"><b>${esc(r.title)}</b><span>${esc(r.text)}</span>${r.action ? `<button class="lnk" data-act="${esc(r.action)}">${esc(t('doIt'))} →</button>` : ''}</div>`).join('') : `<p class="muted">${esc(t('noRecs'))}</p>`}</section>
      <section class="card"><h4>${esc(t('cmpBase'))}</h4><table class="mini"><tbody>
        <tr><td>${esc(t('kPop'))}</td><td>${Q.n(M0.pop)}</td><td>${Q.n(M.pop)}</td></tr>
        <tr><td>${esc(t('kTraffic'))}</td><td>${Q.n(M0.traffic.index, 2)}</td><td>${Q.n(M.traffic.index, 2)}</td></tr>
        <tr><td>${esc(t('covSchool'))}</td><td>${Q.pct(M0.school.cov)}</td><td>${Q.pct(M.school.cov)}</td></tr>
        <tr><td>${esc(t('covPark'))}</td><td>${Q.pct(M0.cov.park.share)}</td><td>${Q.pct(M.cov.park.share)}</td></tr>
        <tr><td>${esc(t('co2'))}</td><td>${Q.n(M0.co2)}</td><td>${Q.n(M.co2)}</td></tr>
      </tbody></table><p class="muted sm">${esc(t('cmpNote'))}</p></section>`;
    $$('[data-act]', el).forEach(b => b.onclick = () => G.QMayor.act(b.dataset.act));
  };

  /* ---------------- bottom panel ---------------- */
  Q.renderBottom = () => {
    const el = $('#bottom'); if (!el) return; const S = Q.S;
    const yrs = [2025, 2030, 2040, 2050];
    const layers = ['buildings', 'proposals', 'fac', 'traffic', 'heat', 'flood', 'gaps', 'citizen', 'future', 'trees'];
    const saved = Object.keys(S.saved || {});
    el.innerHTML = `
      <div class="bgrp"><span class="blbl">${esc(t('timeline'))}</span><div class="seg" role="group">${yrs.map(y => `<button class="${S.futureYear === y ? 'on' : ''}" data-year="${y}">${y === 2025 ? esc(t('baseline')) : y}</button>`).join('')}</div>
        <select id="bStrat" aria-label="${esc(t('strategy'))}">${['green', 'economic', 'balanced'].map(s => `<option value="${s}"${S.strategy === s ? ' selected' : ''}>${esc(t('str_' + s))}</option>`).join('')}</select></div>
      <div class="bgrp"><button class="btn ${Q.playing ? 'on' : ''}" id="bPlay">${Q.playing ? '❚❚ ' + esc(t('pause')) : '▶ ' + esc(t('playTraffic'))}</button>
        <select id="bMode" aria-label="${esc(t('tMode'))}">${['morning', 'evening', 'offpeak'].map(m => `<option value="${m}"${S.trafficMode === m ? ' selected' : ''}>${esc(t('tm_' + m))}</option>`).join('')}</select></div>
      <div class="bgrp layers"><span class="blbl">${esc(t('layers'))}</span>${layers.map(l => `<button class="chip ${Q.layerOn(l) ? 'on' : ''}" data-layer="${l}">${esc(t('ly_' + l))}</button>`).join('')}</div>
      <div class="bgrp"><div class="seg"><button class="${!Q.before ? 'on' : ''}" data-ba="after">${esc(t('after'))}</button><button class="${Q.before ? 'on' : ''}" data-ba="before">${esc(t('before'))}</button></div></div>
      <div class="bgrp"><button class="btn" id="bSave">💾 ${esc(t('save'))}</button><select id="bLoad" aria-label="${esc(t('load'))}"><option value="">${esc(t('load'))}…</option>${saved.map(n => `<option>${esc(n)}</option>`).join('')}</select>
        <button class="btn ic" id="bUndo" title="${esc(t('undo'))}" ${Q.undo.length ? '' : 'disabled'}>↶</button><button class="btn ic" id="bRedo" title="${esc(t('redo'))}" ${Q.redo.length ? '' : 'disabled'}>↷</button>
        <button class="btn" id="bReset">${esc(t('reset'))}</button><button class="btn pri" id="bExport">⇩ ${esc(t('export'))}</button></div>`;
    $$('[data-year]', el).forEach(b => b.onclick = () => { S.futureYear = +b.dataset.year; if (S.futureYear > 2025) Q.award('future'); Q.renderShell(); Q.changed(); });
    $('#bStrat').onchange = e => { S.strategy = e.target.value; Q.changed(); };
    $('#bPlay').onclick = () => Q.togglePlay();
    $('#bMode').onchange = e => { S.trafficMode = e.target.value; Q._m0k = null; Q.changed(); };
    $$('[data-layer]', el).forEach(b => b.onclick = () => { const k = b.dataset.layer; S.layers[k] = !Q.layerOn(k); if (k === 'heat') Q.ecoHeat = S.layers[k]; Q.changed(); });
    $$('[data-ba]', el).forEach(b => b.onclick = () => { Q.before = b.dataset.ba === 'before'; Q.syncMap(); Q.renderRight(); Q.renderBottom(); });
    $('#bSave').onclick = () => Q.saveScenarioDialog();
    $('#bLoad').onchange = e => { if (e.target.value) Q.loadScenario(e.target.value); };
    $('#bUndo').onclick = Q.doUndo; $('#bRedo').onclick = Q.doRedo;
    $('#bReset').onclick = () => Q.confirm(t('confirmReset'), () => Q.commit(S2 => { S2.proposals = []; S2.trees = []; S2.closures = []; S2.selId = null; }));
    $('#bExport').onclick = () => Q.open('reports');
  };

  /* ---------------- scenarios ---------------- */
  Q.scenarioData = () => ({ v: 1, proposals: Q.S.proposals, trees: Q.S.trees, closures: Q.S.closures, budget: Q.S.budget, unitCosts: Q.S.unitCosts, assumptions: Q.S.assumptions, futureYear: Q.S.futureYear, strategy: Q.S.strategy, trafficMode: Q.S.trafficMode, transitBoost: Q.S.transitBoost });
  Q.saveScenarioDialog = () => Q.prompt(t('scName'), t('scDefault') + ' ' + (Object.keys(Q.S.saved).length + 1), name => { if (!name) return; Q.S.saved[name] = Object.assign(Q.scenarioData(), { t: Date.now(), chi: Q.M.chi }); Q.S.history.unshift({ name, t: Date.now(), chi: Q.M.chi, n: Q.S.proposals.length }); Q.S.history = Q.S.history.slice(0, 30); Q.save(); Q.award('save'); Q.notify(t('nScSaved') + ': ' + name, 'ok'); Q.renderBottom(); Q.refreshView(); });
  Q.loadScenario = name => { const s = Q.S.saved[name]; if (!s) return; Q.commit(S => { S.proposals = JSON.parse(JSON.stringify(s.proposals || [])); S.trees = JSON.parse(JSON.stringify(s.trees || [])); S.closures = (s.closures || []).slice(); S.budget = s.budget || S.budget; S.unitCosts = Object.assign({}, s.unitCosts); S.assumptions = Object.assign({}, s.assumptions); S.futureYear = s.futureYear || 2025; S.strategy = s.strategy || 'balanced'; S.trafficMode = s.trafficMode || 'morning'; S.transitBoost = !!s.transitBoost; }); Q._m0k = null; Q.renderShell(); Q.notify(t('nScLoaded') + ': ' + name, 'ok'); };
  Q.metricsFor = key => {
    if (key === 'baseline') return Q.M0; if (key === 'current') return Q.M;
    if (key && key.startsWith('y:')) return E.compute(Q.scenarioState({ futureYear: +key.slice(2) }), Q.D);
    const s = Q.S.saved[key]; if (!s) return Q.M;
    return E.compute(Object.assign({}, Q.scenarioState(), s, { futureProposals: E.futureProposals(s.strategy || 'balanced', s.futureYear || 2025) }), Q.D);
  };
  Q.stateFor = key => {
    if (key === 'baseline') return Object.assign(Q.scenarioState(), { proposals: [], trees: [], closures: [], futureYear: 2025, futureProposals: [] });
    if (key === 'current') return Q.scenarioState();
    if (key && key.startsWith('y:')) return Q.scenarioState({ futureYear: +key.slice(2) });
    const s = Q.S.saved[key]; return s ? Object.assign({}, Q.scenarioState(), s, { futureProposals: E.futureProposals(s.strategy || 'balanced', s.futureYear || 2025) }) : Q.scenarioState();
  };

  /* ---------------- dialogs (no native alert/confirm/prompt in sandboxed frames) ---------------- */
  Q.modal = (html, onMount) => { const m = $('#modal'); m.innerHTML = `<div class="mbox" role="dialog" aria-modal="true">${html}</div>`; m.hidden = false; const box = m.firstChild; if (onMount) onMount(box); const f = box.querySelector('input,button'); if (f) f.focus(); m.onclick = e => { if (e.target === m) Q.closeModal(); }; return box; };
  Q.closeModal = () => { const m = $('#modal'); m.hidden = true; m.innerHTML = ''; };
  Q.confirm = (msg, ok) => Q.modal(`<p>${esc(msg)}</p><div class="row end"><button class="btn" data-c>${esc(t('cancel'))}</button><button class="btn pri" data-o>${esc(t('ok'))}</button></div>`, b => { b.querySelector('[data-c]').onclick = Q.closeModal; b.querySelector('[data-o]').onclick = () => { Q.closeModal(); ok(); }; });
  Q.prompt = (msg, def, ok) => Q.modal(`<label class="fld"><span>${esc(msg)}</span><input id="pIn" value="${esc(def || '')}" maxlength="60"></label><div class="row end"><button class="btn" data-c>${esc(t('cancel'))}</button><button class="btn pri" data-o>${esc(t('ok'))}</button></div>`, b => { const i = b.querySelector('#pIn'); const go = () => { const v = i.value.trim(); Q.closeModal(); ok(v); }; b.querySelector('[data-c]').onclick = Q.closeModal; b.querySelector('[data-o]').onclick = go; i.onkeydown = e => { if (e.key === 'Enter') go(); }; });

  /* ---------------- view router ---------------- */
  Q.open = (k) => {
    if (k === 'present') { G.QPitch && G.QPitch.openDeck(); return; }
    if (Q.S.view === 'compare' && k !== 'compare' && Q.closeCompare) Q.closeCompare();
    Q.S.view = k; Q.tool = null; Q.renderMeasure(); Q.save(); Q.hideInfo();
    $$('#nav .nav-i').forEach(b => b.classList.toggle('on', b.dataset.v === k));
    document.body.classList.remove('nav-open');
    Q.refreshView(true); Q.syncMap(); Q.renderBottom();
    if (G.innerWidth < 900) document.body.classList.add('panel-open');
  };
  Q.refreshView = (full) => {
    const v = Q.views[Q.S.view], el = $('#panel'); if (!el || !v) return;
    if (full || !el.dataset.v || el.dataset.v !== Q.S.view + Q.S.lang) {
      el.dataset.v = Q.S.view + Q.S.lang;
      el.innerHTML = `<header class="ph"><div><h2>${esc(t('nav_' + Q.S.view))}</h2>${v.sub ? `<p class="muted sm">${esc(t(v.sub))}</p>` : ''}</div><button class="x" onclick="document.body.classList.toggle('panel-min')" title="${esc(t('collapse'))}" aria-label="${esc(t('collapse'))}">–</button></header><div class="pbody">${v.form ? v.form() : ''}<div id="vres"></div></div>`;
      if (v.bind) v.bind(el);
    }
    const r = $('#vres', el); if (r && v.results && Q.M) { r.innerHTML = v.results(); if (v.bindResults) v.bindResults(r); }
  };

  /* ---------------- search ---------------- */
  Q.search = q => {
    q = (q || '').trim().toLowerCase(); if (q.length < 2 || !Q.D) return [];
    const out = [];
    for (const l of Q.D.landmarks) { const n = l.key ? t(l.key) : l.name; if (n.toLowerCase().includes(q)) out.push({ n, k: t('lgVerified'), ll: [l.lng, l.lat] }); }
    for (const f of Q.D.fac) if ((f.name || '').toLowerCase().includes(q) || t('fc_' + f.cat).toLowerCase().includes(q)) out.push({ n: f.name || t('fc_' + f.cat), k: t('fc_' + f.cat), ll: [f.lng, f.lat], hit: { layer: 'fac', props: { id: f.id } } });
    const seen = new Set(); for (const r of Q.D.roads) if (r.name && r.name.toLowerCase().includes(q) && !seen.has(r.name)) { seen.add(r.name); out.push({ n: r.name, k: t('road'), ll: r.mid }); }
    for (const p of Q.S.proposals) { const n = p.name || Q.typeName(p.type); if (n.toLowerCase().includes(q)) out.push({ n, k: t('lgProposed'), ll: [p.lng, p.lat], sel: p.id }); }
    return out.slice(0, 12);
  };
  Q.nominatim = async q => {   // live mode only; OSM Nominatim usage policy: ≤1 request/s, cached
    const now = Date.now(); if (Q._nomT && now - Q._nomT < 1100) return []; Q._nomT = now;
    const url = 'https://nominatim.openstreetmap.org/search?format=json&limit=6&accept-language=' + Q.S.lang + '&viewbox=' + [QD.BBOX[1], QD.BBOX[2], QD.BBOX[3], QD.BBOX[0]].join(',') + '&bounded=1&q=' + encodeURIComponent(q);
    const r = await fetch(url, { headers: { Accept: 'application/json' } }); if (!r.ok) throw new Error('nominatim'); const j = await r.json();
    return j.map(x => ({ n: x.display_name.split(',').slice(0, 2).join(','), k: 'Nominatim (OSM)', ll: [+x.lon, +x.lat] }));
  };
})(window);
