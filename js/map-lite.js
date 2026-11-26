/* QALA 2050 — LiteMap: dependency-free canvas 2.5D renderer.
 * Used when MapLibre/OpenFreeMap cannot be reached (offline demo, sandboxed previews).
 * Same adapter API as LiveMap so every module works in both modes. */
(function (G) {
  'use strict';
  const E = G.QEngine, RAD = Math.PI / 180, MPP0 = 156543.03 * Math.cos(E.LAT0 * RAD);
  const THEMES = {
    night: { casing: '#1b2a44', bg: '#070f1d', grid: 'rgba(80,120,180,0.06)', water: '#0f3357', waterEdge: '#1d5a8c', park: '#0f3b2c', road: { trunk: '#3b5378', primary: '#33496b', secondary: '#2a3d5c', tertiary: '#233450' }, wallA: [36, 52, 80], roof: [92, 122, 170], text: '#c9d6ea', halo: '#070f1d' },
    day:   { bg: '#ece6da', grid: 'rgba(34,68,168,0.07)', water: '#b7cbdd', waterEdge: '#7f9fbf', park: '#cfd8bd', road: { trunk: '#f7f3ea', primary: '#fbf8f1', secondary: '#f6f1e7', tertiary: '#f1ebdf' }, casing: '#c9bfae', wallA: [176, 168, 154], roof: [222, 214, 200], text: '#23272f', halo: '#f4efe6' }
  };
  const BCOL = { house: [0.92, 0.9, 0.85], apartments: [1, 1, 1], commercial: [1.05, 0.98, 0.85], public: [0.9, 1.0, 1.1] };

  function buffer(lineXY, half) {   // simple offset polygon of a polyline (vertex normals)
    const L = [], R = [];
    for (let i = 0; i < lineXY.length; i++) {
      const a = lineXY[Math.max(0, i - 1)], b = lineXY[Math.min(lineXY.length - 1, i + 1)];
      let dx = b[0] - a[0], dy = b[1] - a[1]; const n = Math.hypot(dx, dy) || 1; dx /= n; dy /= n;
      L.push([lineXY[i][0] - dy * half, lineXY[i][1] + dx * half]); R.push([lineXY[i][0] + dy * half, lineXY[i][1] - dx * half]);
    }
    return L.concat(R.reverse());
  }

  class LiteMap {
    constructor(el, opt) {
      this.el = el; this.kind = 'lite'; this.h = {}; this.data = {}; this.vis = {}; this.th = THEMES[(opt && opt.theme) || 'night'];
      this.v = { x: 0, y: 600, zoom: 12.4, bearing: -12, pitch: 52 };
      this.cv = document.createElement('canvas'); this.cv.className = 'lite-canvas'; el.appendChild(this.cv);
      this.ctx = this.cv.getContext('2d'); this.cache = document.createElement('canvas'); this.cacheKey = ''; this.ver = 0; this.anim = null; this.dyn = false;
      this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(el); this.resize();
      this._events(); this.ready = Promise.resolve(this);
    }
    on(ev, fn) { (this.h[ev] = this.h[ev] || []).push(fn); }
    emit(ev, a) { let r; for (const f of this.h[ev] || []) { const x = f(a); if (x !== undefined) r = x; } return r; }
    resize() { const r = this.el.getBoundingClientRect(), d = Math.min(2, G.devicePixelRatio || 1); this.W = Math.max(50, r.width); this.H = Math.max(50, r.height); this.dpr = d; for (const c of [this.cv, this.cache]) { c.width = this.W * d; c.height = this.H * d; } this.cv.style.width = this.W + 'px'; this.cv.style.height = this.H + 'px'; this.cacheKey = ''; this.redraw(); }
    s() { return Math.pow(2, this.v.zoom) / MPP0; }
    mpp() { return 1 / this.s(); }
    proj(x, y, z) {
      const b = this.v.bearing * RAD, p = this.v.pitch * RAD, s = this.s(), dx = x - this.v.x, dy = y - this.v.y;
      const u = dx * Math.cos(b) - dy * Math.sin(b), w = dx * Math.sin(b) + dy * Math.cos(b);
      return [this.W / 2 + u * s, this.H * 0.55 - (w * Math.cos(p) + (z || 0) * Math.sin(p)) * s, w];
    }
    unproj(sx, sy) {
      const b = this.v.bearing * RAD, p = this.v.pitch * RAD, s = this.s();
      const u = (sx - this.W / 2) / s, w = (this.H * 0.55 - sy) / (s * Math.cos(p));
      return [this.v.x + u * Math.cos(b) + w * Math.sin(b), this.v.y - u * Math.sin(b) + w * Math.cos(b)];
    }
    getView() { const ll = E.toLL(this.v.x, this.v.y); return { center: ll, zoom: this.v.zoom, pitch: this.v.pitch, bearing: this.v.bearing }; }
    setView(v) { const xy = E.toXY(v.center[0], v.center[1]); Object.assign(this.v, { x: xy[0], y: xy[1], zoom: v.zoom, pitch: v.pitch, bearing: v.bearing }); this.redraw(); }
    flyTo(o) {
      const from = Object.assign({}, this.v), xy = o.center ? E.toXY(o.center[0], o.center[1]) : [from.x, from.y];
      const to = { x: xy[0], y: xy[1], zoom: o.zoom !== undefined ? o.zoom : from.zoom, pitch: o.pitch !== undefined ? o.pitch : from.pitch, bearing: o.bearing !== undefined ? o.bearing : from.bearing };
      const dur = o.duration !== undefined ? o.duration : 1600, t0 = performance.now();
      let db = to.bearing - from.bearing; if (db > 180) db -= 360; if (db < -180) db += 360;
      return new Promise(res => {
        const reduce = G.matchMedia && G.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (dur <= 0 || reduce) { Object.assign(this.v, to); this.redraw(); this.emit('move'); return res(); }
        this.anim = () => {
          const k = Math.min(1, (performance.now() - t0) / dur), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
          this.v.x = from.x + (to.x - from.x) * e; this.v.y = from.y + (to.y - from.y) * e; this.v.zoom = from.zoom + (to.zoom - from.zoom) * e;
          this.v.pitch = from.pitch + (to.pitch - from.pitch) * e; this.v.bearing = from.bearing + db * e;
          this.emit('move'); if (k >= 1) { this.anim = null; res(); }
        };
        this.redraw();
      });
    }
    zoomBy(d) { return this.flyTo({ zoom: E.clamp(this.v.zoom + d, 9, 19), duration: 250 }); }
    rotateBy(d) { return this.flyTo({ bearing: this.v.bearing + d, duration: 400 }); }
    resetNorth() { return this.flyTo({ bearing: 0, duration: 500 }); }
    set3D(on) { return this.flyTo({ pitch: on ? 55 : 0, duration: 600 }); }
    setTheme(t) { this.th = THEMES[t] || THEMES.night; this.cacheKey = ''; this.redraw(); }
    setSatellite() { return false; }
    setBase(D) {
      this.D = D; this.ver++;
      this.riverPolys = (D.riverXY || []).map(l => buffer(l, (D.riverWidth || 180) / 2));
      this.bld = (D.buildings || []).map(b => ({ id: b.id, ring: b.ringXY, c: b.cxy, h: b.h, cat: b.cat, props: b }));
      this.parks = (D.parks || []).map(p => p.ring.map(q => E.toXY(q[0], q[1])));
      this.redraw();
    }
    setData(id, fc) {
      const feats = (fc && fc.features) || [];
      this.data[id] = feats.map(f => {
        const g = f.geometry, P = f.properties || {};
        if (g.type === 'Point') return { t: 'pt', xy: E.toXY(g.coordinates[0], g.coordinates[1]), P };
        if (g.type === 'LineString') return { t: 'ln', xy: g.coordinates.map(c => E.toXY(c[0], c[1])), P };
        if (g.type === 'Polygon') { const ring = g.coordinates[0].map(c => E.toXY(c[0], c[1])); let cx = 0, cy = 0; ring.forEach(q => { cx += q[0]; cy += q[1]; }); return { t: 'pg', ring, c: [cx / ring.length, cy / ring.length], P }; }
        return null;
      }).filter(Boolean);
      if (id !== 'vehicles') this.ver++;
      this.redraw();
    }
    setVisible(id, on) { this.vis[id] = on; this.ver++; this.redraw(); }
    visible(id) { return this.vis[id] !== false; }
    setAnimating(on) { this.dyn = on; this.redraw(); }
    redraw() { if (!this._raf) this._raf = requestAnimationFrame(() => this._frame()); }
    _frame() {
      this._raf = 0; if (this.anim) this.anim();
      const key = [this.v.x, this.v.y, this.v.zoom, this.v.pitch, this.v.bearing, this.W, this.H, this.ver].join('|');
      const c = this.ctx, d = this.dpr;
      if (key !== this.cacheKey) { this._drawStatic(this.cache.getContext('2d')); this.cacheKey = key; }
      c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, this.cv.width, this.cv.height); c.drawImage(this.cache, 0, 0);
      c.setTransform(d, 0, 0, d, 0, 0); this._drawDynamic(c);
      if (this.anim || this.dyn) this.redraw();
    }
    _poly(c, ring, z) { ring.forEach((q, i) => { const p = this.proj(q[0], q[1], z); i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); }); c.closePath(); }
    _drawStatic(c) {
      const T = this.th, d = this.dpr, s = this.s();
      c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = T.bg; c.fillRect(0, 0, this.cache.width, this.cache.height); c.setTransform(d, 0, 0, d, 0, 0);
      // 1 km grid
      c.strokeStyle = T.grid; c.lineWidth = 1; c.beginPath();
      for (let g = -20000; g <= 20000; g += 1000) { let a = this.proj(g, -20000), b = this.proj(g, 20000); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); a = this.proj(-20000, g); b = this.proj(20000, g); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
      c.stroke();
      if (!this.D) return;
      // heat cells
      if (this.visible('heat')) for (const f of this.data.heat || []) { c.globalAlpha = f.P.opacity || 0.45; c.fillStyle = f.P.color; c.beginPath(); this._poly(c, f.ring, 0); c.fill(); }
      c.globalAlpha = 1;
      // water & parks
      c.fillStyle = T.water; c.strokeStyle = T.waterEdge; c.lineWidth = 1.2;
      for (const r of this.riverPolys) { c.beginPath(); this._poly(c, r, 0); c.fill(); c.stroke(); }
      c.fillStyle = T.park; for (const r of this.parks) { c.beginPath(); this._poly(c, r, 0); c.fill(); }
      if (this.visible('flood')) for (const f of this.data.flood || []) { c.globalAlpha = f.P.opacity || 0.4; c.fillStyle = f.P.color || '#3b82f6'; c.beginPath(); this._poly(c, f.ring, 0.2); c.fill(); }
      c.globalAlpha = 1;
      // roads
      const traf = this.visible('traffic') && (this.data.traffic || []).length;
      const wd = { trunk: 22, primary: 18, secondary: 13, tertiary: 10 };
      if (T.casing) for (const r of this.D.roads) {
        c.strokeStyle = T.casing; c.lineWidth = Math.max(1.6, (wd[r.cls] || 10) * s + 2); c.lineCap = 'round';
        c.beginPath(); r.xy.forEach((q, i) => { const p = this.proj(q[0], q[1]); i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); }); c.stroke();
      }
      for (const r of this.D.roads) {
        c.strokeStyle = T.road[r.cls] || T.road.tertiary; c.lineWidth = Math.max(1, (wd[r.cls] || 10) * s); c.lineCap = 'round';
        c.beginPath(); r.xy.forEach((q, i) => { const p = this.proj(q[0], q[1]); i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); }); c.stroke();
      }
      if (traf) for (const f of this.data.traffic) {
        c.strokeStyle = f.P.color; c.lineWidth = Math.max(2, (f.P.wm || 14) * s * 0.8); c.globalAlpha = f.P.opacity || 0.95; if (f.P.dash) c.setLineDash([6, 5]);
        c.beginPath(); f.xy.forEach((q, i) => { const p = this.proj(q[0], q[1], 0.3); i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); }); c.stroke(); c.setLineDash([]);
      }
      c.globalAlpha = 1;
      if (this.visible('gaps')) for (const f of this.data.gaps || []) { const p = this.proj(f.xy[0], f.xy[1]); c.fillStyle = f.P.color; c.globalAlpha = 0.85; c.beginPath(); c.arc(p[0], p[1], f.P.r || 4, 0, 7); c.fill(); }
      c.globalAlpha = 1;
      // extruded objects, painter's algorithm (far → near)
      const items = [];
      const b = this.v.bearing * RAD, cb = Math.cos(b), sb = Math.sin(b);
      const depth = q => (q[0] - this.v.x) * sb + (q[1] - this.v.y) * cb;
      const onScreen = q => { const p = this.proj(q[0], q[1]); return p[0] > -200 && p[0] < this.W + 200 && p[1] > -400 && p[1] < this.H + 300; };
      if (this.visible('buildings') && this.bld) for (const o of this.bld) if (onScreen(o.c)) items.push({ ring: o.ring, c: o.c, h: o.h, base: 0, col: this._bcol(o), dpt: depth(o.c), o });
      for (const id of ['future', 'proposals', 'sel']) if (this.visible(id)) for (const f of this.data[id] || []) if (f.t === 'pg') items.push({ ring: f.ring, c: f.c, h: f.P.height || 3, base: f.P.base || 0, col: f.P.color, alpha: f.P.opacity || (id === 'future' ? 0.72 : 0.96), glow: id !== 'future', outline: f.P.outline, dpt: depth(f.c) - (id === 'sel' ? 1 : 0), id });
      items.sort((a, b2) => b2.dpt - a.dpt);
      const flat = this.v.pitch < 3 || s < 0.05;
      for (const it of items) this._extrude(c, it, flat);
      this.items = items;
    }
    _bcol(o) { const T = this.th, k = BCOL[o.cat] || BCOL.apartments, hk = Math.min(1.25, 0.85 + o.h / 120); return T.roof.map(v => Math.min(255, Math.round(v * k[0] * hk))); }
    _extrude(c, it, flat) {
      const ring = it.ring, n = ring.length - 1, top = it.base + it.h;
      const col = typeof it.col === 'string' ? hex(it.col) : it.col;
      c.globalAlpha = it.alpha || 1;
      if (!flat) {
        const b = this.v.bearing * RAD;
        for (let i = 0; i < n; i++) {
          const a = ring[i], q = ring[i + 1], ex = q[0] - a[0], ey = q[1] - a[1];
          const nx = ey, ny = -ex;                         // outward normal for CCW? check visibility either way
          const view = nx * Math.sin(b) + ny * Math.cos(b);  // facing camera if normal points toward -forward
          const shade = 0.55 + 0.35 * Math.abs(Math.cos(Math.atan2(ny, nx) - 0.8));
          if (view > 0 === this._ccw(ring)) continue;
          const p1 = this.proj(a[0], a[1], it.base), p2 = this.proj(q[0], q[1], it.base), p3 = this.proj(q[0], q[1], top), p4 = this.proj(a[0], a[1], top);
          c.fillStyle = rgb(col, shade * 0.85); c.beginPath(); c.moveTo(p1[0], p1[1]); c.lineTo(p2[0], p2[1]); c.lineTo(p3[0], p3[1]); c.lineTo(p4[0], p4[1]); c.closePath(); c.fill();
        }
      }
      c.fillStyle = rgb(col, 1); c.beginPath(); this._poly(c, ring, flat ? 0 : top); c.fill();
      if (it.glow || it.outline) { c.strokeStyle = it.outline || 'rgba(35,39,47,0.45)'; c.lineWidth = it.outline ? 2.2 : 0.8; c.stroke(); }
      c.globalAlpha = 1;
    }
    _ccw(r) { if (r._ccw !== undefined) return r._ccw; let a = 0; for (let i = 0; i < r.length - 1; i++) a += (r[i + 1][0] - r[i][0]) * (r[i + 1][1] + r[i][1]); return (r._ccw = a < 0); }
    _drawDynamic(c) {
      const T = this.th, s = this.s();
      const pts = (id, def) => { if (!this.visible(id)) return; for (const f of this.data[id] || []) if (f.t === 'pt') { const p = this.proj(f.xy[0], f.xy[1], f.P.z || 0); if (p[0] < -20 || p[0] > this.W + 20 || p[1] < -20 || p[1] > this.H + 20) continue; const r = f.P.r || def; c.fillStyle = f.P.color || '#2244a8'; c.strokeStyle = f.P.stroke || T.halo; c.lineWidth = 1.5; c.beginPath(); c.arc(p[0], p[1], r, 0, 7); c.fill(); if (r > 2.5) c.stroke(); if (f.P.ring) { c.strokeStyle = f.P.ring; c.lineWidth = 2; c.beginPath(); c.arc(p[0], p[1], r + 4, 0, 7); c.stroke(); } } };
      pts('trees', 2.2); pts('fac', 4.5); pts('citizen', 6); pts('vehicles', 2.4);
      if (this.visible('measure')) for (const f of this.data.measure || []) {
        if (f.t === 'ln') { c.strokeStyle = '#c8643b'; c.lineWidth = 2; c.setLineDash([6, 4]); c.beginPath(); f.xy.forEach((q, i) => { const p = this.proj(q[0], q[1]); i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); }); c.stroke(); c.setLineDash([]); }
        else { const p = this.proj(f.xy[0], f.xy[1]); c.fillStyle = '#c8643b'; c.beginPath(); c.arc(p[0], p[1], 4, 0, 7); c.fill(); }
      }
      // labels
      c.font = '600 12px "Golos Text", Inter, system-ui, sans-serif'; c.textAlign = 'center'; c.lineJoin = 'round';
      const lbl = (id, minZ) => { if (!this.visible(id) || this.v.zoom < minZ) return; for (const f of this.data[id] || []) if (f.t === 'pt' && f.P.label) { const p = this.proj(f.xy[0], f.xy[1], f.P.z || 0); if (p[0] < 0 || p[0] > this.W || p[1] < 0 || p[1] > this.H) continue; c.strokeStyle = T.halo; c.lineWidth = 3.5; c.strokeText(f.P.label, p[0], p[1] - 10); c.fillStyle = f.P.lc || T.text; c.fillText(f.P.label, p[0], p[1] - 10); } };
      pts('landmarks', 6); lbl('landmarks', 9); lbl('fac', 15.2); lbl('proposals', 14);
      void s;
    }
    pick(sx, sy) {
      const order = ['landmarks', 'citizen', 'fac'];
      for (const id of order) { if (!this.visible(id)) continue; const L = this.data[id] || []; for (let i = L.length - 1; i >= 0; i--) { const f = L[i]; if (f.t !== 'pt') continue; const p = this.proj(f.xy[0], f.xy[1], f.P.z || 0); if (Math.hypot(p[0] - sx, p[1] - sy) <= (f.P.r || 5) + 5) return { layer: id, props: f.P }; } }
      const items = this.items || [];
      for (let i = items.length - 1; i >= 0; i--) {   // near → far, test roof then footprint in screen space
        const it = items[i], top = it.base + it.h, flat = this.v.pitch < 3;
        const roof = it.ring.map(q => this.proj(q[0], q[1], flat ? 0 : top)), foot = it.ring.map(q => this.proj(q[0], q[1], 0));
        if (E.pip([sx, sy], roof) || E.pip([sx, sy], foot)) return it.o ? { layer: 'buildings', props: it.o.props, ringXY: it.ring } : { layer: it.id, props: (this.data[it.id].find(f => f.ring === it.ring) || {}).P };
      }
      return null;
    }
    checkSite() { return null; }          // demo geometry is screened by the engine itself
    screenshot() { return this.cv.toDataURL('image/png'); }
    cursor(c) { this.cv.style.cursor = c || ''; }
    _events() {
      const cv = this.cv; let drag = null; const ptrs = new Map();
      const pos = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
      const ll = p => { const xy = this.unproj(p[0], p[1]); return E.toLL(xy[0], xy[1]); };
      cv.addEventListener('contextmenu', e => e.preventDefault());
      cv.addEventListener('pointerdown', e => {
        cv.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, pos(e));
        const p = pos(e);
        if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; drag = { pinch: Math.hypot(a[0] - b[0], a[1] - b[1]), z: this.v.zoom, ang: Math.atan2(b[1] - a[1], b[0] - a[0]), br: this.v.bearing }; return; }
        const hit = this.pick(p[0], p[1]);
        if (e.button === 0 && hit && this.emit('down', { lngLat: ll(p), hit }) === true) { drag = { obj: true, p0: p, moved: false }; return; }
        drag = { p0: p, last: p, rot: e.button === 2 || e.ctrlKey || e.shiftKey, moved: false, v0: Object.assign({}, this.v), g0: this.unproj(p[0], p[1]) };
      });
      cv.addEventListener('pointermove', e => {
        const p = pos(e); if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, p);
        if (!drag) { this.emit('hover', { lngLat: ll(p) }); return; }
        if (drag.pinch && ptrs.size === 2) { const [a, b] = [...ptrs.values()]; this.v.zoom = E.clamp(drag.z + Math.log2(Math.hypot(a[0] - b[0], a[1] - b[1]) / drag.pinch), 9, 19); this.v.bearing = drag.br - (Math.atan2(b[1] - a[1], b[0] - a[0]) - drag.ang) / RAD; this.redraw(); this.emit('move'); return; }
        if (Math.hypot(p[0] - drag.p0[0], p[1] - drag.p0[1]) > 3) drag.moved = true;
        if (drag.obj) { if (drag.moved) this.emit('drag', { lngLat: ll(p) }); return; }
        if (drag.rot) { this.v.bearing = drag.v0.bearing + (p[0] - drag.p0[0]) * 0.4; this.v.pitch = E.clamp(drag.v0.pitch - (p[1] - drag.p0[1]) * 0.3, 0, 62); }
        else { this.v.x = drag.v0.x; this.v.y = drag.v0.y; const g = this.unproj(p[0], p[1]); this.v.x += drag.g0[0] - g[0]; this.v.y += drag.g0[1] - g[1]; }
        this.redraw(); this.emit('move');
      });
      const up = e => {
        ptrs.delete(e.pointerId); const p = pos(e);
        if (drag && drag.obj) { this.emit('up', { lngLat: ll(p), moved: drag.moved }); if (!drag.moved) this.emit('click', { lngLat: ll(p), hit: this.pick(p[0], p[1]), point: p }); }
        else if (drag && !drag.moved && !drag.pinch && e.button !== 2) this.emit('click', { lngLat: ll(p), hit: this.pick(p[0], p[1]), point: p });
        if (!ptrs.size) drag = null;
      };
      cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
      cv.addEventListener('wheel', e => {
        e.preventDefault(); const p = pos(e), g0 = this.unproj(p[0], p[1]);
        this.v.zoom = E.clamp(this.v.zoom - e.deltaY * 0.0022, 9, 19); const g1 = this.unproj(p[0], p[1]);
        this.v.x += g0[0] - g1[0]; this.v.y += g0[1] - g1[1]; this.redraw(); this.emit('move');
      }, { passive: false });
    }
    destroy() { this.ro.disconnect(); this.cv.remove(); }
  }
  function hex(h) { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function rgb(c, k) { return 'rgb(' + c.map(v => Math.max(0, Math.min(255, Math.round(v * k)))).join(',') + ')'; }
  LiteMap.buffer = buffer;
  G.LiteMap = LiteMap;
})(window);
