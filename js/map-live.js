/* QALA 2050 — LiveMap: MapLibre GL JS + OpenFreeMap vector tiles (OpenStreetMap data).
 * Real building footprints from the OpenMapTiles "building" layer, extruded with render_height.
 * API mirrors LiteMap. Requires network access to tiles.openfreemap.org. */
(function (G) {
  'use strict';
  const E = G.QEngine;
  const STYLE_URL = 'https://tiles.openfreemap.org/styles/bright';
  const LIBS = [
    ['https://cdnjs.cloudflare.com/ajax/libs/maplibre-gl/4.7.1/maplibre-gl.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/maplibre-gl/4.7.1/maplibre-gl.min.css'],
    ['https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js', 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css'],
    ['vendor/maplibre-gl.js', 'vendor/maplibre-gl.css']
  ];
  const NIGHT = { background: '#081322', water: '#0d2b48', park: '#0d2a22', land: '#0c1829', road: '#2a3c5a', roadMajor: '#36507a', rail: '#3a4660', boundary: '#34445f', text: '#a9bdd8', halo: '#081322' };

  function loadScript(src) { return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }
  function loadCss(href) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; document.head.appendChild(l); }
  async function withTimeout(p, ms) { let t; const r = await Promise.race([p, new Promise((_, rej) => { t = setTimeout(() => rej(new Error('timeout')), ms); })]); clearTimeout(t); return r; }

  /** Checks that tiles + library are reachable. Resolves to the style JSON or throws. */
  async function preflight() {
    const res = await withTimeout(fetch(STYLE_URL, { cache: 'force-cache' }), 7000);
    if (!res.ok) throw new Error('style HTTP ' + res.status);
    const style = await res.json();
    if (!G.maplibregl) {
      let ok = false;
      for (const [js, css] of LIBS) { try { await withTimeout(loadScript(js), 9000); loadCss(css); ok = !!G.maplibregl; if (ok) break; } catch (e) { /* next */ } }
      if (!ok) throw new Error('MapLibre library unavailable');
    }
    return style;
  }

  class LiveMap {
    constructor(el, opt) {
      this.el = el; this.kind = 'live'; this.h = {}; this.vis = {}; this.pending = {}; this.orig = []; this.theme = opt.theme || 'night';
      const ml = G.maplibregl;
      this.map = new ml.Map({
        container: el, style: opt.style, center: opt.center || [E.LNG0, E.LAT0], zoom: opt.zoom || 4.5, pitch: opt.pitch || 0, bearing: opt.bearing || 0,
        maxPitch: 75, attributionControl: false, preserveDrawingBuffer: true, hash: false, minZoom: 3
      });
      this.map.addControl(new ml.AttributionControl({ compact: true, customAttribution: '<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> · © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors' }), 'bottom-right');
      this.ready = new Promise((res, rej) => {
        this.map.on('load', () => { try { this._setup(); res(this); } catch (e) { rej(e); } });
        this.map.on('error', e => { this.emit('error', e && e.error); });
      });
      this.map.on('move', () => this.emit('move'));
      this.map.on('dataloading', () => this.emit('loading', true));
      this.map.on('idle', () => this.emit('loading', false));
    }
    on(ev, fn) { (this.h[ev] = this.h[ev] || []).push(fn); }
    emit(ev, a) { let r; for (const f of this.h[ev] || []) { const x = f(a); if (x !== undefined) r = x; } return r; }
    _setup() {
      const m = this.map, st = m.getStyle();
      this.layersBy = sl => st.layers.filter(l => l['source-layer'] === sl).map(l => l.id);
      this.waterLayers = this.layersBy('water'); this.roadLayers = this.layersBy('transportation');
      // hide the style's own building layers; we draw our own extrusion
      for (const id of this.layersBy('building')) m.setLayoutProperty(id, 'visibility', 'none');
      const firstSymbol = (st.layers.find(l => l.type === 'symbol') || {}).id;
      const src = id => m.addSource(id, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      ['heat', 'flood', 'gaps', 'traffic', 'future', 'proposals', 'sel', 'trees', 'fac', 'citizen', 'landmarks', 'measure', 'vehicles'].forEach(src);
      m.addLayer({ id: 'q-heat', type: 'fill', source: 'heat', paint: { 'fill-color': ['get', 'color'], 'fill-opacity': ['coalesce', ['get', 'opacity'], 0.4] } }, firstSymbol);
      m.addLayer({ id: 'q-flood', type: 'fill', source: 'flood', paint: { 'fill-color': ['coalesce', ['get', 'color'], '#3b82f6'], 'fill-opacity': ['coalesce', ['get', 'opacity'], 0.4] } }, firstSymbol);
      m.addLayer({ id: 'q-traffic', type: 'line', source: 'traffic', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': ['get', 'color'], 'line-width': ['interpolate', ['exponential', 1.6], ['zoom'], 11, 2, 14, 5, 17, 12], 'line-opacity': 0.92 } }, firstSymbol);
      m.addLayer({ id: 'q-gaps', type: 'circle', source: 'gaps', paint: { 'circle-color': ['get', 'color'], 'circle-radius': ['interpolate', ['linear'], ['zoom'], 11, 3, 15, 8], 'circle-opacity': 0.8 } });
      m.addLayer({
        id: 'q-3d', type: 'fill-extrusion', source: 'openmaptiles', 'source-layer': 'building', minzoom: 13,
        filter: ['!=', ['get', 'hide_3d'], true],
        paint: {
          'fill-extrusion-color': ['interpolate', ['linear'], ['coalesce', ['get', 'render_height'], 5], 0, '#2c3e5f', 12, '#3d5683', 30, '#5574a8', 60, '#7b97c9'],
          'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 13, 0, 14, ['coalesce', ['get', 'render_height'], 5]],
          'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0], 'fill-extrusion-opacity': 0.88
        }
      });
      const ext = (id, op) => m.addLayer({ id: 'q-' + id, type: 'fill-extrusion', source: id, paint: { 'fill-extrusion-color': ['get', 'color'], 'fill-extrusion-height': ['get', 'height'], 'fill-extrusion-base': ['coalesce', ['get', 'base'], 0], 'fill-extrusion-opacity': op } });
      ext('future', 0.7); ext('proposals', 0.95); ext('sel', 0.6);
      const circ = (id, r, extra) => m.addLayer(Object.assign({ id: 'q-' + id, type: 'circle', source: id, paint: { 'circle-color': ['coalesce', ['get', 'color'], '#22d3ee'], 'circle-radius': ['coalesce', ['get', 'r'], r], 'circle-stroke-color': ['coalesce', ['get', 'stroke'], '#ffffff'], 'circle-stroke-width': 1.5 } }, extra || {}));
      circ('trees', 2.5); circ('fac', 5); circ('citizen', 7); circ('landmarks', 6); circ('vehicles', 2.6);
      m.addLayer({ id: 'q-measure-l', type: 'line', source: 'measure', filter: ['==', ['geometry-type'], 'LineString'], paint: { 'line-color': '#c8643b', 'line-width': 2.5, 'line-dasharray': [2, 1.5] } });
      m.addLayer({ id: 'q-measure-p', type: 'circle', source: 'measure', filter: ['==', ['geometry-type'], 'Point'], paint: { 'circle-color': '#c8643b', 'circle-radius': 4 } });
      const font = ((st.layers.find(l => l.layout && l.layout['text-font']) || {}).layout || {})['text-font'] || ['Noto Sans Regular'];
      const lbl = (id, minz) => m.addLayer({ id: 'q-' + id + '-lbl', type: 'symbol', source: id, minzoom: minz, layout: { 'text-field': ['coalesce', ['get', 'label'], ''], 'text-font': font, 'text-size': 12, 'text-offset': [0, -1.3], 'text-anchor': 'bottom', 'text-optional': true }, paint: { 'text-color': '#23272f', 'text-halo-color': '#f4efe6', 'text-halo-width': 1.6 } });
      lbl('landmarks', 9); lbl('fac', 15); lbl('proposals', 14);
      this.ids = { heat: ['q-heat'], flood: ['q-flood'], traffic: ['q-traffic'], gaps: ['q-gaps'], buildings: ['q-3d'], future: ['q-future'], proposals: ['q-proposals', 'q-proposals-lbl'], sel: ['q-sel'], trees: ['q-trees'], fac: ['q-fac', 'q-fac-lbl'], citizen: ['q-citizen'], landmarks: ['q-landmarks', 'q-landmarks-lbl'], measure: ['q-measure-l', 'q-measure-p'], vehicles: ['q-vehicles'] };
      // remember original paint for day/night switching
      for (const l of st.layers) {
        if (l.id.startsWith('q-')) continue; const p = l.paint || {};
        for (const k of ['background-color', 'fill-color', 'line-color', 'text-color', 'text-halo-color', 'fill-outline-color']) if (p[k] !== undefined) this.orig.push([l.id, k, p[k], l]);
      }
      for (const id in this.pending) this.setData(id, this.pending[id]);
      for (const id in this.vis) this.setVisible(id, this.vis[id]);
      this.setTheme(this.theme);
      this._events();
    }
    _nightColor(l, k) {
      const sl = l['source-layer'] || '', id = l.id;
      if (k === 'background-color') return NIGHT.background;
      if (k === 'text-color') return NIGHT.text; if (k === 'text-halo-color') return NIGHT.halo;
      if (sl === 'water' || sl === 'waterway' || /water/.test(id)) return NIGHT.water;
      if (/park|grass|wood|forest|landcover|green/.test(id + sl)) return NIGHT.park;
      if (sl === 'transportation') return /motorway|trunk|primary/.test(id) ? NIGHT.roadMajor : /rail/.test(id) ? NIGHT.rail : NIGHT.road;
      if (sl === 'boundary') return NIGHT.boundary;
      return k === 'fill-outline-color' ? NIGHT.land : NIGHT.land;
    }
    setTheme(t) {
      this.theme = t; if (!this.ids) return;
      for (const [id, k, v, l] of this.orig) { try { this.map.setPaintProperty(id, k, t === 'night' ? this._nightColor(l, k) : v); } catch (e) { /* layer w/o property */ } }
      try {
        this.map.setPaintProperty('q-3d', 'fill-extrusion-color', t === 'night'
          ? ['interpolate', ['linear'], ['coalesce', ['get', 'render_height'], 5], 0, '#2c3e5f', 12, '#3d5683', 30, '#5574a8', 60, '#7b97c9']
          : ['interpolate', ['linear'], ['coalesce', ['get', 'render_height'], 5], 0, '#ddd5c7', 20, '#cbc1b0', 60, '#b3a893']);
      } catch (e) { }
    }
    setSatellite(url) {
      const m = this.map; if (!this.ids) return false;
      if (m.getLayer('q-sat')) m.removeLayer('q-sat'); if (m.getSource('q-sat')) m.removeSource('q-sat');
      if (!url) return true;
      m.addSource('q-sat', { type: 'raster', tiles: [url], tileSize: 256, attribution: 'Satellite imagery: user-configured provider' });
      m.addLayer({ id: 'q-sat', type: 'raster', source: 'q-sat', paint: { 'raster-opacity': 0.9 } }, 'q-heat');
      return true;
    }
    setBase() { /* base geometry comes from vector tiles */ }
    setData(id, fc) { const s = this.ids && this.map.getSource(id); if (s) s.setData(fc); else this.pending[id] = fc; }
    setVisible(id, on) { this.vis[id] = on; if (!this.ids || !this.ids[id]) return; for (const l of this.ids[id]) if (this.map.getLayer(l)) this.map.setLayoutProperty(l, 'visibility', on ? 'visible' : 'none'); }
    setAnimating() { }
    getView() { const c = this.map.getCenter(); return { center: [c.lng, c.lat], zoom: this.map.getZoom(), pitch: this.map.getPitch(), bearing: this.map.getBearing() }; }
    setView(v) { this.map.jumpTo({ center: v.center, zoom: v.zoom, pitch: v.pitch, bearing: v.bearing }); }
    flyTo(o) { return new Promise(res => { const reduce = G.matchMedia && G.matchMedia('(prefers-reduced-motion: reduce)').matches; this.map.once('moveend', () => res()); this.map.flyTo({ center: o.center || this.map.getCenter(), zoom: o.zoom !== undefined ? o.zoom : this.map.getZoom(), pitch: o.pitch !== undefined ? o.pitch : this.map.getPitch(), bearing: o.bearing !== undefined ? o.bearing : this.map.getBearing(), duration: reduce ? 0 : (o.duration !== undefined ? o.duration : 1600), essential: true, curve: 1.3 }); }); }
    zoomBy(d) { this.map.easeTo({ zoom: this.map.getZoom() + d, duration: 250 }); }
    rotateBy(d) { this.map.easeTo({ bearing: this.map.getBearing() + d, duration: 400 }); }
    resetNorth() { this.map.easeTo({ bearing: 0, duration: 500 }); }
    set3D(on) { this.map.easeTo({ pitch: on ? 55 : 0, duration: 600 }); }
    mpp() { const z = this.map.getZoom(), lat = this.map.getCenter().lat; return 156543.03 * Math.cos(lat * Math.PI / 180) / Math.pow(2, z); }
    cursor(c) { this.map.getCanvas().style.cursor = c || ''; }
    screenshot() { return this.map.getCanvas().toDataURL('image/png'); }
    _hitLayers() { return ['q-landmarks', 'q-citizen', 'q-fac', 'q-proposals', 'q-future', 'q-3d'].filter(l => this.map.getLayer(l) && this.map.getLayoutProperty(l, 'visibility') !== 'none'); }
    pickAt(point) {
      const fs = this.map.queryRenderedFeatures(point, { layers: this._hitLayers() });
      if (!fs.length) return null;
      const f = fs[0], layer = f.layer.id.replace('q-', '');
      if (layer === '3d') {
        const P = Object.assign({}, f.properties), ring = f.geometry.type === 'Polygon' ? f.geometry.coordinates[0] : f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates[0][0] : null;
        const around = [[point.x - 18, point.y - 18], [point.x + 18, point.y + 18]];
        const poi = this.map.queryRenderedFeatures(around).filter(x => x.sourceLayer === 'poi' && x.properties.name)[0];
        const hn = this.map.queryRenderedFeatures(around).filter(x => x.sourceLayer === 'housenumber')[0];
        const roads = [...new Set(this.map.queryRenderedFeatures([[point.x - 60, point.y - 60], [point.x + 60, point.y + 60]]).filter(x => x.sourceLayer === 'transportation_name' && x.properties.name).map(x => x.properties['name:kk'] || x.properties.name))].slice(0, 3);
        return { layer: 'buildings', props: { live: true, render_height: P.render_height, render_min_height: P.render_min_height, colour: P.colour, name: poi ? (poi.properties['name:kk'] || poi.properties.name) : null, poiClass: poi ? poi.properties.class : null, housenumber: hn ? hn.properties.housenumber : null, roads, ring }, ringLL: ring };
      }
      return { layer, props: f.properties };
    }
    checkSite(ringLL) {
      const m = this.map; if (!this.ids) return null;
      const pts = ringLL.map(c => m.project(c)); const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
      const W = m.getCanvas().clientWidth, H = m.getCanvas().clientHeight;
      if (Math.min(...xs) < 0 || Math.min(...ys) < 0 || Math.max(...xs) > W || Math.max(...ys) > H || m.getZoom() < 14) return { unknown: true };
      const box = [[Math.min(...xs), Math.min(...ys)], [Math.max(...xs), Math.max(...ys)]];
      const ringXY = ringLL.map(c => E.toXY(c[0], c[1]));
      const polysOf = f => f.geometry.type === 'Polygon' ? [f.geometry.coordinates[0]] : f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates.map(p => p[0]) : [];
      let b = 0; for (const f of m.queryRenderedFeatures(box, { layers: ['q-3d'] })) for (const r of polysOf(f)) { const rx = r.map(c => E.toXY(c[0], c[1])); if (rx.some(v => E.pip(v, ringXY)) || ringXY.some(v => E.pip(v, rx))) { b++; break; } }
      const c0 = pts.reduce((a, p) => [a[0] + p.x / pts.length, a[1] + p.y / pts.length], [0, 0]);
      const water = this.waterLayers.length ? m.queryRenderedFeatures([c0[0], c0[1]], { layers: this.waterLayers.filter(l => m.getLayer(l)) }).length > 0 : false;
      let roads = 0; for (const f of m.queryRenderedFeatures(box, { layers: this.roadLayers.filter(l => m.getLayer(l)) })) {
        const g = f.geometry, lines = g.type === 'LineString' ? [g.coordinates] : g.type === 'MultiLineString' ? g.coordinates : [];
        if (lines.some(l => l.some(c => E.pip(E.toXY(c[0], c[1]), ringXY)))) roads++;
      }
      return { buildings: b, water, roads };
    }
    _events() {
      const m = this.map; let drag = null;
      m.on('click', e => { if (drag && drag.moved) return; this.emit('click', { lngLat: [e.lngLat.lng, e.lngLat.lat], hit: this.pickAt(e.point), point: [e.point.x, e.point.y] }); });
      m.on('mousemove', e => { if (drag) { drag.moved = true; this.emit('drag', { lngLat: [e.lngLat.lng, e.lngLat.lat] }); } else this.emit('hover', { lngLat: [e.lngLat.lng, e.lngLat.lat] }); });
      const start = e => { const hit = this.pickAt(e.point); if (hit && this.emit('down', { lngLat: [e.lngLat.lng, e.lngLat.lat], hit }) === true) { e.preventDefault(); m.dragPan.disable(); drag = { moved: false }; } };
      const end = e => { if (!drag) return; const mv = drag.moved; m.dragPan.enable(); this.emit('up', { lngLat: [e.lngLat.lng, e.lngLat.lat], moved: mv }); setTimeout(() => { drag = null; }, 0); };
      m.on('mousedown', 'q-proposals', start); m.on('touchstart', 'q-proposals', start);
      m.on('mouseup', end); m.on('touchend', end);
      m.on('touchmove', e => { if (drag) { drag.moved = true; this.emit('drag', { lngLat: [e.lngLat.lng, e.lngLat.lat] }); } });
    }
    destroy() { this.map.remove(); }
  }
  G.LiveMap = LiveMap; G.LiveMap.preflight = preflight;
})(window);
