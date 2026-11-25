/* QALA 2050 — deterministic simulation engine.
 * Pure functions only: no DOM, no randomness, no network. Runs in browser and Node (tests).
 * Every formula is documented in docs/METHODOLOGY.md and in the in-app Methodology panel. */
(function (G) {
  'use strict';
  const LAT0 = 44.85278, LNG0 = 65.50917;               // Kyzylorda reference point (task brief / geodatos)
  const MX = 111320 * Math.cos(LAT0 * Math.PI / 180), MY = 110540; // metres per degree (local tangent plane)
  const clamp = (x, a, b) => Math.max(a, Math.min(b, Number.isFinite(x) ? x : a));
  const div = (a, b, d = 0) => (b === 0 || !Number.isFinite(b) || !Number.isFinite(a)) ? d : a / b;
  const toXY = (lng, lat) => [(lng - LNG0) * MX, (lat - LAT0) * MY];
  const toLL = (x, y) => [x / MX + LNG0, y / MY + LAT0];
  const dXY = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  function distLL(a, b) { return dXY(toXY(a[0], a[1]), toXY(b[0], b[1])); }
  function distPtSeg(p, a, b) {               // all XY metres
    const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy;
    let t = L ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L : 0; t = clamp(t, 0, 1);
    return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
  }
  function distPtLine(p, xyLine) { let m = Infinity; for (let i = 1; i < xyLine.length; i++) m = Math.min(m, distPtSeg(p, xyLine[i - 1], xyLine[i])); return m; }
  function pip(pt, ring) {                    // point in polygon, any consistent coordinates
    let ins = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i], [xj, yj] = ring[j];
      if (((yi > pt[1]) !== (yj > pt[1])) && (pt[0] < (xj - xi) * (pt[1] - yi) / ((yj - yi) || 1e-12) + xi)) ins = !ins;
    }
    return ins;
  }
  function segX(a, b, c, d) {                 // segments intersect
    const o = (p, q, r) => Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]));
    return o(a, b, c) !== o(a, b, d) && o(c, d, a) !== o(c, d, b);
  }
  function rectRing(lng, lat, w, l, rot) {    // footprint ring [lng,lat], w along x, l along y, rot degrees clockwise
    const [cx, cy] = toXY(lng, lat), r = (rot || 0) * Math.PI / 180, c = Math.cos(r), s = Math.sin(r);
    const pts = [[-w / 2, -l / 2], [w / 2, -l / 2], [w / 2, l / 2], [-w / 2, l / 2]].map(([x, y]) => toLL(cx + x * c + y * s, cy - x * s + y * c));
    pts.push(pts[0]); return pts;
  }
  function ringArea(ringLL) { const p = ringLL.map(q => toXY(q[0], q[1])); let a = 0; for (let i = 0, j = p.length - 1; i < p.length; j = i++) a += (p[j][0] + p[i][0]) * (p[j][1] - p[i][1]); return Math.abs(a / 2); }
  function lineLen(coords) { let L = 0; for (let i = 1; i < coords.length; i++) L += distLL(coords[i - 1], coords[i]); return L; }

  /* ---------- Construction catalogue (all values are editable ASSUMPTIONS) ---------- */
  // kind: bld = building (GFA = w*l*floors), area = flat site (area = w*l), line = linear (length l, width w), unit = per item
  // cap(p): default capacity from geometry. costM2: KZT per m² GFA / site m² / unit (hypothetical, NOT procurement prices)
  const CATALOG = {
    school:       { grp: 'edu',  kind: 'bld',  w: 80,  l: 60,  floors: 3,  color: '#38bdf8', costM2: 450000, opex: 0.045, life: 50, capU: 'seats',    cap: g => g / 12,  jobs: g => g / 140, svc: 'school' },
    kindergarten: { grp: 'edu',  kind: 'bld',  w: 50,  l: 40,  floors: 2,  color: '#7dd3fc', costM2: 420000, opex: 0.05,  life: 50, capU: 'places',   cap: g => g / 14,  jobs: g => g / 90,  svc: 'kinder' },
    university:   { grp: 'edu',  kind: 'bld',  w: 110, l: 70,  floors: 5,  color: '#0ea5e9', costM2: 480000, opex: 0.04,  life: 60, capU: 'students', cap: g => g / 15,  jobs: g => g / 110, svc: 'university' },
    hospital:     { grp: 'hlth', kind: 'bld',  w: 120, l: 60,  floors: 6,  color: '#f87171', costM2: 650000, opex: 0.08,  life: 50, capU: 'beds',     cap: g => g / 100, jobs: g => g / 40,  svc: 'hospital' },
    clinic:       { grp: 'hlth', kind: 'bld',  w: 40,  l: 30,  floors: 3,  color: '#fca5a5', costM2: 520000, opex: 0.07,  life: 50, capU: 'visits',   cap: g => g / 7,   jobs: g => g / 60,  svc: 'clinic' },
    residential:  { grp: 'res',  kind: 'bld',  w: 80,  l: 60,  floors: 12, color: '#c4b5fd', costM2: 330000, opex: 0.012, life: 60, capU: 'units',    cap: g => g * 0.78 / 65, jobs: g => g / 2500, res: true },
    apartment:    { grp: 'res',  kind: 'bld',  w: 60,  l: 16,  floors: 9,  color: '#a78bfa', costM2: 320000, opex: 0.012, life: 60, capU: 'units',    cap: g => g * 0.78 / 65, jobs: g => g / 3000, res: true },
    shopping:     { grp: 'biz',  kind: 'bld',  w: 120, l: 90,  floors: 3,  color: '#fbbf24', costM2: 380000, opex: 0.03,  life: 40, capU: 'jobs',     cap: g => g / 30,  jobs: g => g / 30,  attract: 0.012 },
    business:     { grp: 'biz',  kind: 'bld',  w: 50,  l: 40,  floors: 14, color: '#f59e0b', costM2: 400000, opex: 0.03,  life: 50, capU: 'jobs',     cap: g => g / 18,  jobs: g => g / 18 },
    hotel:        { grp: 'biz',  kind: 'bld',  w: 50,  l: 30,  floors: 10, color: '#fcd34d', costM2: 420000, opex: 0.05,  life: 40, capU: 'rooms',    cap: g => g / 45,  jobs: g => g / 120 },
    stadium:      { grp: 'rec',  kind: 'area', w: 180, l: 130, floors: 1,  h: 25, color: '#34d399', costM2: 350000, opex: 0.02, life: 50, capU: 'seats', cap: a => a * 0.64, jobs: a => a / 900, svc: 'sport', attract: 0.004 },
    sports:       { grp: 'rec',  kind: 'bld',  w: 70,  l: 50,  floors: 2,  color: '#6ee7b7', costM2: 380000, opex: 0.04,  life: 40, capU: 'visits',   cap: g => g / 10,  jobs: g => g / 250, svc: 'sport' },
    park:         { grp: 'green', kind: 'area', w: 220, l: 160, floors: 0, h: 2, color: '#22c55e', costM2: 18000, opex: 0.04, life: 40, capU: 'm2', cap: a => a, jobs: a => a / 15000, svc: 'park', green: 1 },
    playground:   { grp: 'green', kind: 'area', w: 40,  l: 30,  floors: 0, h: 2, color: '#86efac', costM2: 25000, opex: 0.05, life: 15, capU: 'm2', cap: a => a, jobs: () => 0, svc: 'park', green: 0.5 },
    factory:      { grp: 'ind',  kind: 'bld',  w: 140, l: 90,  floors: 1,  h: 14, color: '#94a3b8', costM2: 280000, opex: 0.03, life: 40, capU: 'jobs', cap: g => g / 80, jobs: g => g / 80 },
    road:         { grp: 'mob',  kind: 'line', w: 14,  l: 1200, floors: 0, h: 0.6, color: '#e2e8f0', costM2: 60000, opex: 0.02, life: 25, capU: 'veh/h', cap: (a, p) => Math.max(1, Math.floor(p.w / 3.5)) * 900, jobs: () => 0, road: true },
    bridge:       { grp: 'mob',  kind: 'line', w: 18,  l: 450, floors: 0, h: 6, color: '#cbd5e1', costM2: 900000, opex: 0.015, life: 80, capU: 'veh/h', cap: (a, p) => Math.max(1, Math.floor(p.w / 3.5)) * 900, jobs: () => 0, road: true, bridge: true },
    bus_stop:     { grp: 'mob',  kind: 'unit', w: 12,  l: 4,   floors: 0, h: 3, color: '#22d3ee', costM2: 6000000, opex: 0.06, life: 15, capU: 'stops', cap: () => 1, jobs: () => 0, svc: 'transit' },
    parking:      { grp: 'mob',  kind: 'area', w: 80,  l: 50,  floors: 0, h: 0.5, color: '#64748b', costM2: 45000, opex: 0.02, life: 25, capU: 'spaces', cap: a => a / 25, jobs: () => 0, parking: true },
    solar:        { grp: 'eng',  kind: 'area', w: 220, l: 150, floors: 0, h: 2.5, color: '#facc15', costM2: 18000, opex: 0.015, life: 25, capU: 'MW', cap: a => a * 0.055 / 1000, jobs: a => a / 20000, solar: true },
    water:        { grp: 'eng',  kind: 'area', w: 90,  l: 60,  floors: 0, h: 8, color: '#60a5fa', costM2: 250000, opex: 0.04, life: 50, capU: 'm3/day', cap: a => a * 2, jobs: a => a / 600, water: true }
  };
  const TYPES = Object.keys(CATALOG);

  /* ---------- Default assumptions (status ESTIMATED / ASSUMPTION unless noted) ---------- */
  const DEFAULTS = {
    popBase: 316800,          // VERIFIED: Akimat of Kyzylorda, gov.kz — city with subordinate settlements
    hhSize: 3.4, schoolShare: 0.19, preschoolShare: 0.085,
    schoolCapRatio: 0.92, kinderCapRatio: 0.85, bedNeed: 5.5, bedBase: 5.0,
    clinicNeedPer1000: 2.2,   // visits per shift needed per 1000 residents (proxy)
    waterLpcd: 180, waterSupplyRatio: 1.12, elecKwhCap: 1400, nonResKwhM2: 150, gridEF: 0.6, nonElecCO2Cap: 2.2,
    solarYield: 1500,         // kWh per kWp per year (assumption for south Kazakhstan)
    resVehPerUnit: 0.45, jobVehPerJob: 0.30, segExposure: 2.5, laneCap: 900,
    baseVC: { trunk: 0.74, primary: 0.70, secondary: 0.56, tertiary: 0.44 },
    lanes: { trunk: 4, primary: 4, secondary: 2, tertiary: 2 },
    mode: { morning: 1.0, evening: 1.08, offpeak: 0.55 },
    greenTarget: 9, treeCanopy: 30, baseJobsRatio: 0.40, jobsTarget: 0.45, wageKZT: 380000,
    radius: { school: 1000, kinder: 500, clinic: 1500, hospital: 3000, park: 500, transit: 400, sport: 1200, fire: 3000 },
    detour: 1.3, contingency: 0.10, floodSlope: 0.004, refFlood: 2.0, constructionJobsPerBn: 18,
    growth: { green: 0.010, economic: 0.016, balanced: 0.013 }
  };
  const WEIGHTS = { transport: 0.20, environment: 0.20, infrastructure: 0.20, access: 0.15, economy: 0.15, resilience: 0.10 };

  function mergeA(a) { const d = JSON.parse(JSON.stringify(DEFAULTS)); if (!a) return d; for (const k in a) { if (a[k] && typeof a[k] === 'object' && !Array.isArray(a[k])) d[k] = Object.assign(d[k] || {}, a[k]); else if (a[k] !== undefined && a[k] !== null && a[k] !== '') d[k] = a[k]; } return d; }

  /* ---------- Per-proposal derived quantities ---------- */
  function derive(p, A, unitCosts) {
    const c = CATALOG[p.type]; if (!c) return null;
    const w = clamp(+p.w || c.w, 2, 3000), l = clamp(+p.l || c.l, 2, 6000), fl = c.kind === 'bld' ? clamp(Math.round(+p.floors || c.floors), 1, 60) : 0;
    const area = w * l, gfa = c.kind === 'bld' ? area * fl : area;
    const base = c.kind === 'unit' ? 1 : gfa;
    const capAuto = c.cap(base, { w, l });
    const cap = (+p.capacity > 0) ? +p.capacity : capAuto;
    const unit = (unitCosts && +unitCosts[p.type] > 0) ? +unitCosts[p.type] : c.costM2;
    const capexAuto = (c.kind === 'unit' ? 1 : base) * unit;
    const capex = (+p.budget > 0) ? +p.budget : capexAuto;
    const height = c.kind === 'bld' ? fl * (c.h ? c.h : 3.3) : (c.h || 1);
    const units = c.res ? cap : 0;
    const pop = units * A.hhSize;
    const jobs = Math.max(0, c.jobs(base, { w, l }) || 0);
    const ring = rectRing(p.lng, p.lat, w, l, p.rot || 0);
    return { c, w, l, floors: fl, area, gfa, cap, capAuto, capex, capexAuto, unit, opex: capex * c.opex, life: c.life, height, units, pop, jobs, ring, xy: toXY(p.lng, p.lat) };
  }

  /* ---------- Coverage (straight-line × detour factor, documented) ---------- */
  function coverage(homes, facs, radius, detour) {
    if (!homes.length) return { share: 0, uncovered: [], dist: [] };
    const fx = facs.map(f => f.xy || toXY(f.lng, f.lat));
    let tot = 0, cov = 0; const unc = [], dist = [];
    for (const h of homes) {
      tot += h.w; let best = Infinity;
      for (const q of fx) { const d = Math.hypot(h.xy[0] - q[0], h.xy[1] - q[1]); if (d < best) best = d; }
      const walk = best * detour; dist.push(walk);
      if (walk <= radius) cov += h.w; else unc.push(h);
    }
    return { share: div(cov, tot), uncovered: unc, dist, radius };
  }

  /* ---------- Traffic: lightweight deterministic link-load model ---------- */
  function traffic(D, props, S, A, popFactor) {
    const modeF = (A.mode[S.trafficMode] || 1) * (S.transitBoost ? 0.9 : 1);
    const closed = new Set(S.closures || []);
    const segs = D.roads.map(r => {
      const cls = A.baseVC[r.cls] !== undefined ? r.cls : 'tertiary';
      const lanes = r.lanes || A.lanes[cls] || 2, cap = lanes * A.laneCap;
      const mid = r.mid || r.coords[Math.floor(r.coords.length / 2)];
      return { id: r.id, name: r.name, cls, bridge: !!r.bridge, coords: r.coords, cap, mid, xy: toXY(mid[0], mid[1]), load: cap * A.baseVC[cls] * modeF * popFactor, closed: closed.has(r.id), isNew: false };
    });
    // new roads / bridges become links that divert load from nearby links
    for (const p of props) if (p.d.c.road) {
      const a = toLL(p.d.xy[0], p.d.xy[1]);
      const seg = { id: 'new-' + p.id, name: p.name || p.type, cls: 'primary', bridge: !!p.d.c.bridge, coords: lineCoords(p), cap: p.d.cap, mid: a, xy: p.d.xy, load: 0, closed: false, isNew: true };
      const near = segs.filter(s => !s.isNew && (p.d.c.bridge ? s.bridge && dXY(s.xy, seg.xy) < 4000 : dXY(s.xy, seg.xy) < 1200));
      const capN = near.reduce((t, s) => t + s.cap, 0);
      const share = clamp(div(seg.cap, seg.cap + capN), 0, 0.35);
      for (const s of near) { const m = s.load * share; s.load -= m; seg.load += m; }
      segs.push(seg);
    }
    // generated peak-hour vehicle trips from proposals, distance-decay assignment
    for (const p of props) {
      const T = (p.d.units * A.resVehPerUnit + p.d.jobs * A.jobVehPerJob + (p.d.c.attract ? p.d.gfa * p.d.c.attract : 0)) * modeF;
      if (T <= 0) continue;
      const cand = segs.filter(s => !s.closed && dXY(s.xy, p.d.xy) < 4000);
      const ws = cand.map(s => 1 / Math.pow(dXY(s.xy, p.d.xy) + 300, 2));
      const sw = ws.reduce((a, b) => a + b, 0);
      cand.forEach((s, i) => { s.load += T * A.segExposure * div(ws[i], sw); });
    }
    // transit: each proposed bus stop trims nearby link load by 3 % (max 15 %)
    const stops = props.filter(p => p.type === 'bus_stop');
    if (stops.length) for (const s of segs) { const n = stops.filter(p => dXY(p.d.xy, s.xy) < 600).length; if (n) s.load *= 1 - Math.min(0.15, 0.03 * n); }
    // closures: re-route load to 4 nearest open links within 2 km, weighted by capacity
    for (const s of segs) if (s.closed && s.load > 0) {
      const alt = segs.filter(t => !t.closed && t !== s).map(t => [t, dXY(t.xy, s.xy)]).filter(x => x[1] < 2000).sort((a, b) => a[1] - b[1]).slice(0, 4);
      const capT = alt.reduce((t, x) => t + x[0].cap, 0);
      for (const [t] of alt) t.load += s.load * div(t.cap, capT);
      s.load = 0;
    }
    let num = 0, den = 0;
    for (const s of segs) { s.vc = s.closed ? 0 : div(s.load, s.cap); if (!s.closed) { num += s.load * s.vc; den += s.load; } }
    const index = div(num, den, 0);
    const bott = segs.filter(s => !s.closed).sort((a, b) => b.vc - a.vc).slice(0, 5);
    return { segs, index, bott, critical: segs.filter(s => s.vc >= 1).length, high: segs.filter(s => s.vc >= 0.8 && s.vc < 1).length };
  }
  function lineCoords(p) { const r = (p.rot || 0) * Math.PI / 180, L = p.d.l / 2; return [toLL(p.d.xy[0] - L * Math.sin(r), p.d.xy[1] - L * Math.cos(r)), toLL(p.d.xy[0] + L * Math.sin(r), p.d.xy[1] + L * Math.cos(r))]; }
  const congClass = vc => vc >= 1 ? 'critical' : vc >= 0.8 ? 'high' : vc >= 0.6 ? 'moderate' : 'low';
  const congColor = vc => vc >= 1 ? '#ef4444' : vc >= 0.8 ? '#f97316' : vc >= 0.6 ? '#eab308' : '#22c55e';

  /* ---------- Main computation: one shared scenario state → all metrics ---------- */
  function compute(S, D) {
    const A = mergeA(S.assumptions);
    const all = (S.proposals || []).concat(S.futureProposals || []);
    const props = all.map(p => Object.assign({}, p, { d: derive(p, A, S.unitCosts) })).filter(p => p.d);
    // population
    const growthPop = S.futureYear && S.futureYear > 2025 ? A.popBase * (Math.pow(1 + (A.growth[S.strategy] || 0.013), S.futureYear - 2025) - 1) : 0;
    const futRes = props.filter(p => p.future).reduce((t, p) => t + p.d.pop, 0);
    const userRes = props.filter(p => !p.future).reduce((t, p) => t + p.d.pop, 0);
    const densify = Math.max(0, growthPop - futRes);
    const pop = A.popBase + userRes + Math.max(growthPop, futRes);
    const hw = D.homes.reduce((t, h) => t + h.w, 0) || 1;
    const baseW = (A.popBase + densify) / hw;
    const homes = D.homes.map(h => ({ xy: h.xy, w: h.w * baseW }));
    for (const p of props) if (p.d.pop > 0) homes.push({ xy: p.d.xy, w: p.d.pop, prop: p.id });
    const units = props.reduce((t, p) => t + p.d.units, 0);
    // facilities: existing + proposed
    const fac = k => D.fac.filter(f => f.cat === k).concat(props.filter(p => p.d.c.svc === k).map(p => ({ xy: p.d.xy, prop: true })));
    const capOf = k => props.filter(p => p.d.c.svc === k).reduce((t, p) => t + p.d.cap, 0);
    // education
    const baseSchoolDemand = A.popBase * A.schoolShare, schoolDemand = pop * A.schoolShare;
    const schoolCap = baseSchoolDemand * A.schoolCapRatio + capOf('school');
    const kinderDemand = pop * A.preschoolShare, kinderCap = A.popBase * A.preschoolShare * A.kinderCapRatio + capOf('kinder');
    const bedDemand = pop / 1000 * A.bedNeed, bedCap = A.popBase / 1000 * A.bedBase + capOf('hospital');
    const clinicDemand = pop / 1000 * A.clinicNeedPer1000 * 100, clinicCap = A.popBase / 1000 * A.clinicNeedPer1000 * 100 * 0.95 + capOf('clinic');
    const cov = {
      school: coverage(homes, fac('school'), A.radius.school, A.detour),
      kinder: coverage(homes, fac('kinder'), A.radius.kinder, A.detour),
      health: coverage(homes, fac('clinic').concat(fac('hospital')), A.radius.clinic, A.detour),
      park: coverage(homes, D.fac.filter(f => f.cat === 'park').concat(props.filter(p => p.d.c.green).map(p => ({ xy: p.d.xy }))).concat((S.trees || []).map(t => ({ xy: toXY(t.lng, t.lat) }))), A.radius.park, A.detour),
      transit: coverage(homes, fac('transit'), A.radius.transit, A.detour),
      sport: coverage(homes, fac('sport'), A.radius.sport, A.detour),
      fire: coverage(homes, D.fac.filter(f => f.cat === 'fire'), A.radius.fire, 1)
    };
    // environment
    const treeCount = (S.trees || []).reduce((t, x) => t + (x.n || 1), 0);
    const greenBase = D.greenArea || A.popBase * 6;
    const greenNew = props.filter(p => p.d.c.green).reduce((t, p) => t + p.d.area * p.d.c.green, 0) + treeCount * A.treeCanopy;
    const greenArea = greenBase + greenNew, greenPerCap = div(greenArea, pop);
    const nonResGFA = props.filter(p => !p.d.c.res && p.d.c.kind === 'bld').reduce((t, p) => t + p.d.gfa, 0);
    const energy = (pop * A.elecKwhCap + nonResGFA * A.nonResKwhM2) / 1e6;          // GWh/yr
    const solarMW = props.filter(p => p.d.c.solar).reduce((t, p) => t + p.d.cap, 0);
    const solar = solarMW * 1000 * A.solarYield / 1e6;                                  // GWh/yr
    const renew = clamp(div(solar, energy), 0, 1);
    const co2 = (Math.max(0, energy - solar) * 1000 * A.gridEF + pop * A.nonElecCO2Cap) / 1000; // kt CO2/yr
    const waterDemand = pop * A.waterLpcd / 1000;                                         // m3/day
    const waterSupply = A.popBase * A.waterLpcd / 1000 * A.waterSupplyRatio + props.filter(p => p.d.c.water).reduce((t, p) => t + p.d.cap, 0);
    // heat proxy on 600 m grid
    const heat = heatGrid(D, homes, props, S, A);
    // traffic
    const popFactor = div(A.popBase + densify, A.popBase, 1);
    const tr = traffic(D, props, S, A, popFactor);
    const parkingDemand = units * 0.9 + props.reduce((t, p) => t + p.d.jobs * 0.25, 0);
    const parkingSupply = props.filter(p => p.d.c.parking).reduce((t, p) => t + p.d.cap, 0);
    // economy & budget
    const user = props.filter(p => !p.future), fut = props.filter(p => p.future);
    const capex = user.reduce((t, p) => t + p.d.capex, 0), capexC = capex * (1 + A.contingency);
    const opex = user.reduce((t, p) => t + p.d.opex, 0);
    const life = user.reduce((t, p) => t + p.d.capex + p.d.opex * p.d.life, 0);
    const futureCapex = fut.reduce((t, p) => t + p.d.capex, 0);
    const budget = +S.budget || 0, remaining = budget - capexC, overrun = Math.max(0, -remaining);
    const jobs = props.reduce((t, p) => t + p.d.jobs, 0);
    const jobsRatio = div(A.popBase * A.baseJobsRatio + jobs, pop);
    const cJobs = capex / 1e9 * A.constructionJobsPerBn;
    // resilience
    const fl = flood(D, homes, props, A.refFlood, A);
    // City Health Index
    const sc = {};
    sc.transport = 100 * clamp(1 - (tr.index - 0.55) / 0.6, 0, 1);
    sc.environment = 50 * clamp(greenPerCap / A.greenTarget, 0, 1) + 30 * (1 - heat.city) + 20 * clamp(renew / 0.3, 0, 1);
    const ratio = (c, d) => 100 * clamp(div(c, d, 1), 0, 1);
    sc.infrastructure = (ratio(schoolCap, schoolDemand) + ratio(kinderCap, kinderDemand) + ratio(bedCap, bedDemand) + ratio(clinicCap, clinicDemand) + ratio(waterSupply, waterDemand)) / 5;
    sc.access = 100 * (cov.school.share + cov.kinder.share + cov.health.share + cov.park.share + cov.transit.share) / 5;
    const budgetHealth = budget > 0 ? clamp(1 - div(overrun, budget), 0, 1) : (capex > 0 ? 0.5 : 1);
    sc.economy = 50 * clamp(jobsRatio / A.jobsTarget, 0, 1) + 50 * budgetHealth;
    sc.resilience = 50 * (1 - fl.share) + 30 * cov.fire.share + 20 * clamp(div(waterSupply, waterDemand) - 0.9, 0, 0.2) / 0.2;
    let total = 0; for (const k in WEIGHTS) { sc[k] = clamp(sc[k], 0, 100); total += sc[k] * WEIGHTS[k]; }
    const risk = clamp(100 - (sc.resilience * 0.5 + sc.transport * 0.25 + sc.infrastructure * 0.25), 0, 100);
    return {
      A, props, pop, popBase: A.popBase, growthPop, newResidents: userRes + futRes, units, homes,
      school: { demand: schoolDemand, cap: schoolCap, pressure: div(schoolDemand, schoolCap), cov: cov.school.share },
      kinder: { demand: kinderDemand, cap: kinderCap, pressure: div(kinderDemand, kinderCap), cov: cov.kinder.share },
      beds: { demand: bedDemand, cap: bedCap, pressure: div(bedDemand, bedCap) },
      clinic: { demand: clinicDemand, cap: clinicCap, pressure: div(clinicDemand, clinicCap), cov: cov.health.share },
      cov, greenArea, greenNew, greenPerCap, treeCount, energy, solar, solarMW, renew, co2, waterDemand, waterSupply,
      heat, traffic: tr, parkingDemand, parkingSupply,
      capex, capexC, opex, life, futureCapex, budget, remaining, overrun, jobs, jobsRatio, cJobs, payroll: jobs * A.wageKZT * 12,
      flood: fl, scores: sc, chi: total, risk
    };
  }

  function heatGrid(D, homes, props, S, A) {
    const cell = 600, b = D.bboxXY, cells = new Map();
    const key = (x, y) => Math.floor(x / cell) + ':' + Math.floor(y / cell);
    const get = (x, y) => { const k = key(x, y); let c = cells.get(k); if (!c) { c = { x: (Math.floor(x / cell) + 0.5) * cell, y: (Math.floor(y / cell) + 0.5) * cell, pop: 0, built: 0, green: 0 }; cells.set(k, c); } return c; };
    for (const h of homes) get(h.xy[0], h.xy[1]).pop += h.w;
    for (const bd of (D.builtXY || [])) get(bd[0], bd[1]).built += bd[2];
    for (const p of props) { const c = get(p.d.xy[0], p.d.xy[1]); if (p.d.c.green) c.green += p.d.area * p.d.c.green; else c.built += p.d.area; }
    for (const g of (D.greenXY || [])) get(g[0], g[1]).green += g[2];
    for (const t of (S.trees || [])) { const xy = toXY(t.lng, t.lat); get(xy[0], xy[1]).green += (t.n || 1) * A.treeCanopy; }
    const area = cell * cell; let num = 0, den = 0; const out = [];
    const maxPop = Math.max(1, ...[...cells.values()].map(c => c.pop));
    for (const c of cells.values()) {
      const dens = clamp(c.built / area * 2.5 + c.pop / maxPop * 0.5, 0, 1), gs = clamp(c.green / area, 0, 1);
      c.v = clamp(0.30 + 0.75 * dens - 1.6 * gs, 0, 1);
      num += c.v * c.pop; den += c.pop; if (c.pop > 0 || c.built > 0) out.push(c);
    }
    void b; return { cells: out, city: div(num, den, 0.5) };
  }

  function flood(D, homes, props, level, A) {
    const band = clamp(level, 0, 10) / A.floodSlope;            // metres from river centre-line (educational proxy)
    const riv = (D.riverXY || []);
    const dR = xy => riv.length ? Math.min(...riv.map(l => distPtLine(xy, l))) : Infinity;
    let exp = 0, tot = 0; const hit = [];
    for (const h of homes) { tot += h.w; const d = dR(h.xy); if (d <= band) { exp += h.w; hit.push(h); } }
    const facHit = D.fac.filter(f => ['school', 'kinder', 'hospital', 'clinic', 'fire'].includes(f.cat) && dR(f.xy) <= band);
    const propHit = props.filter(p => dR(p.d.xy) <= band);
    const roadHit = D.roads.filter(r => dR(toXY(r.mid[0], r.mid[1])) <= band);
    const bld = (D.builtXY || []).filter(b => dR(b) <= band).length;
    return { level, band, exposed: exp, share: div(exp, tot), homes: hit, fac: facHit, props: propHit, roads: roadHit, buildings: bld };
  }

  /* ---------- Placement screening (preliminary, NOT a land-use permit) ---------- */
  function screen(p, D, others, A0) {
    const A = mergeA(A0), d = derive(p, A); if (!d) return [];
    const warn = [];
    const ringXY = d.ring.map(q => toXY(q[0], q[1]));
    const riv = D.riverXY || [], halfW = (D.riverWidth || 160) / 2;
    const onWater = riv.some(l => distPtLine(d.xy, l) < halfW + Math.min(d.w, d.l) / 4) || (D.waterPolysXY || []).some(r => pip(d.xy, r));
    if (onWater && !d.c.bridge) warn.push({ k: 'water', lvl: 'crit' });
    if (d.c.bridge && !onWater) warn.push({ k: 'bridgeDry', lvl: 'warn' });
    const hitB = (D.buildings || []).filter(b => b.ring && (pip(b.cxy, ringXY) || b.ringXY.some(v => pip(v, ringXY)) || ringXY.some(v => pip(v, b.ringXY)))).length;
    if (hitB && !d.c.road) warn.push({ k: 'bldg', lvl: 'crit', n: hitB });
    if (!d.c.road) {
      const rx = D.roads.filter(r => r.xy && r.xy.some((v, i) => pip(v, ringXY) || (i && ringXY.some((c, j) => j && segX(r.xy[i - 1], v, ringXY[j - 1], c)))));
      if (rx.length) warn.push({ k: 'road', lvl: 'warn', n: rx.length });
    }
    const ov = others.filter(o => o.id !== p.id).map(o => derive(o, A)).filter(o => o && (pip(o.xy, ringXY) || ringXY.some(v => pip(v, o.ring.map(q => toXY(q[0], q[1]))))));
    if (ov.length) warn.push({ k: 'overlap', lvl: 'warn', n: ov.length });
    if (d.c.kind === 'bld' && d.floors >= 16) warn.push({ k: 'tall', lvl: 'info' });
    const near = {};
    for (const k of ['school', 'kinder', 'clinic', 'hospital', 'park', 'transit']) {
      let best = Infinity; for (const f of D.fac) if (f.cat === k) best = Math.min(best, dXY(f.xy, d.xy)); near[k] = best;
    }
    return { warn, near, d };
  }

  /* ---------- Budget optimiser: greedy benefit/cost knapsack with diminishing returns ---------- */
  function optimise(budget, weights, A0, unitCosts, M) {
    const A = mergeA(A0);
    // need multipliers grow with modelled shortage (pressure > 1) or low coverage
    const need = { edu: 1, health: 1, green: 1, mobility: 1, housing: 1, energy: 1, resilience: 1 };
    if (M) {
      need.edu = 1 + 3 * Math.max(0, M.school.pressure - 1) + 2 * Math.max(0, M.kinder.pressure - 1);
      need.health = 1 + 3 * Math.max(0, M.beds.pressure - 1) + (1 - M.cov.health.share);
      need.green = 1 + Math.max(0, 1 - M.greenPerCap / A.greenTarget) * 2 + (1 - M.cov.park.share);
      need.mobility = 1 + Math.max(0, M.traffic.index - 0.6) * 4 + (1 - M.cov.transit.share);
      need.energy = 1 + (1 - M.renew) * 0.5;
    }
    const cand = [
      { type: 'school', b: { edu: 5 } }, { type: 'kindergarten', b: { edu: 1.6 } }, { type: 'clinic', b: { health: 2.2 } },
      { type: 'hospital', b: { health: 8 } }, { type: 'park', b: { green: 0.8 } }, { type: 'bus_stop', n: 10, b: { mobility: 0.9 } },
      { type: 'road', b: { mobility: 1.8 } }, { type: 'residential', b: { housing: 6 } }, { type: 'solar', b: { energy: 1.0, green: 0.2 } },
      { type: 'sports', b: { health: 0.6, green: 0.2 } }, { type: 'water', b: { resilience: 1.6 } }
    ].map(c => { const d = derive({ type: c.type, lng: LNG0, lat: LAT0 }, A, unitCosts); return Object.assign(c, { cost: d.capex * (c.n || 1) * (1 + A.contingency), cnt: 0 }); });
    let left = budget; const pick = [];
    for (let guard = 0; guard < 400; guard++) {
      let best = null, bv = 0;
      for (const c of cand) {
        if (c.cost > left || c.cnt >= 4) continue;
        let v = 0; for (const k in c.b) v += (weights[k] || 0) * c.b[k] * need[k];
        v *= Math.pow(0.7, c.cnt); const r = v / (c.cost / 1e9);
        if (r > bv) { bv = r; best = c; }
      }
      if (!best || bv <= 0) break;
      best.cnt++; left -= best.cost; pick.push(best.type);
    }
    return { items: cand.filter(c => c.cnt).map(c => ({ type: c.type, count: c.cnt * (c.n || 1), cost: c.cnt * c.cost })), spent: budget - left, left };
  }

  /* ---------- Business location suitability (transparent weighted score) ---------- */
  const BIZ = {
    cafe: { comp: ['cafe'], inst: ['university', 'school', 'business'], invest: 25e6 },
    restaurant: { comp: ['restaurant', 'cafe'], inst: ['business', 'hotel'], invest: 60e6 },
    grocery: { comp: ['grocery'], inst: [], invest: 30e6 },
    mall: { comp: ['mall'], inst: [], invest: 4e9 },
    hotel: { comp: ['hotel'], inst: ['university', 'hospital'], invest: 1.2e9 },
    gym: { comp: ['gym'], inst: ['university'], invest: 45e6 },
    pharmacy: { comp: ['pharmacy'], inst: ['hospital', 'clinic'], invest: 20e6 },
    education: { comp: ['education'], inst: ['school'], invest: 15e6 },
    coworking: { comp: ['coworking'], inst: ['university', 'business'], invest: 40e6 },
    other: { comp: [], inst: [], invest: 30e6 }
  };
  function bizScore(cat, lng, lat, D, M) {
    const xy = toXY(lng, lat), b = BIZ[cat] || BIZ.other;
    const homes = M ? M.homes : D.homes;
    let res = 0; for (const h of homes) if (dXY(h.xy, xy) < 800) res += h.w;
    const totalW = homes.reduce((t, h) => t + h.w, 0);
    const resS = clamp(res / (totalW * 0.04), 0, 1);
    let road = Infinity; for (const r of D.roads) if (r.xy) road = Math.min(road, distPtLine(xy, r.xy));
    const roadS = clamp(1 - road / 600, 0, 1);
    const stops = D.fac.filter(f => f.cat === 'transit' && dXY(f.xy, xy) < 400).length;
    const trS = clamp(stops / 4, 0, 1);
    const comp = D.fac.filter(f => b.comp.includes(f.cat) && dXY(f.xy, xy) < 500).length;
    const compS = clamp(1 - comp / 6, 0, 1);
    const inst = D.fac.filter(f => b.inst.includes(f.cat) && dXY(f.xy, xy) < 700).length;
    const instS = b.inst.length ? clamp(inst / 3, 0, 1) : 0.5;
    const parts = { residents: [resS, 0.30], roads: [roadS, 0.20], transit: [trS, 0.15], competition: [compS, 0.20], institutions: [instS, 0.15] };
    let score = 0; for (const k in parts) score += parts[k][0] * parts[k][1];
    return { score: Math.round(score * 100), parts, raw: { residents: Math.round(res), roadM: Math.round(road), stops, competitors: comp, institutions: inst }, invest: b.invest };
  }

  /* ---------- Gap finder: best candidate site for a service ---------- */
  function bestSite(M, svc, radius) {
    const unc = (M.cov[svc] || M.cov.school).uncovered; if (!unc.length) return null;
    let best = null, bv = 0;
    const sample = unc.length > 400 ? unc.filter((_, i) => i % Math.ceil(unc.length / 400) === 0) : unc;
    for (const c of sample) { let v = 0; for (const h of unc) if (dXY(h.xy, c.xy) <= radius / (M.A.detour || 1.3)) v += h.w; if (v > bv) { bv = v; best = c; } }
    return best ? { ll: toLL(best.xy[0], best.xy[1]), gain: bv } : null;
  }

  /* ---------- Future scenarios (hypothetical, assumption-driven — not official plans) ---------- */
  // offsets in metres from reference point; zones: L = left bank (south), E = east, W = west, N = north
  const FUT = {
    green:    [[2030, 'park', -600, -2600, {}], [2030, 'residential', 300, -3000, { floors: 9 }], [2030, 'school', -200, -3300, {}], [2030, 'solar', 5200, 2600, {}], [2030, 'bus_stop', 0, -2900, {}],
               [2040, 'park', 3600, 900, {}], [2040, 'residential', 3900, 1300, { floors: 9 }], [2040, 'kindergarten', 3500, 1600, {}], [2040, 'solar', 5600, 2300, { w: 300 }], [2040, 'clinic', 4100, 1000, {}],
               [2050, 'park', -3600, 1800, { w: 300 }], [2050, 'residential', -3300, 2100, { floors: 9 }], [2050, 'school', -3000, 2500, {}], [2050, 'water', 2200, 3200, {}], [2050, 'solar', 5900, 1900, { w: 300 }]],
    economic: [[2030, 'business', 400, -2800, {}], [2030, 'residential', 900, -3200, { floors: 16 }], [2030, 'shopping', -500, -3000, {}], [2030, 'factory', 5200, -600, {}], [2030, 'road', 0, -2400, { rot: 90, l: 1600 }],
               [2040, 'residential', 3900, 1300, { floors: 16 }], [2040, 'business', 3300, 800, {}], [2040, 'hotel', 600, -2500, {}], [2040, 'factory', 5600, -1000, {}], [2040, 'school', 4200, 1700, {}],
               [2050, 'residential', -3300, 2100, { floors: 16 }], [2050, 'shopping', -2900, 2500, {}], [2050, 'business', -3600, 1600, {}], [2050, 'road', -3000, 900, { l: 1800 }], [2050, 'clinic', -2700, 2800, {}]],
    balanced: [[2030, 'residential', 300, -3000, { floors: 12 }], [2030, 'school', -200, -3300, {}], [2030, 'park', -700, -2600, {}], [2030, 'bus_stop', 0, -2900, {}], [2030, 'business', 800, -2700, {}],
               [2040, 'residential', 3900, 1300, { floors: 12 }], [2040, 'kindergarten', 3500, 1600, {}], [2040, 'park', 3600, 800, {}], [2040, 'clinic', 4200, 1000, {}], [2040, 'solar', 5600, 2300, {}],
               [2050, 'residential', -3300, 2100, { floors: 12 }], [2050, 'school', -3000, 2500, {}], [2050, 'park', -3700, 1700, {}], [2050, 'hospital', -2600, 1500, {}], [2050, 'water', 2200, 3200, {}]]
  };
  function futureProposals(strategy, year) {
    if (!year || year <= 2025) return [];
    return (FUT[strategy] || FUT.balanced).filter(r => r[0] <= year).map((r, i) => { const ll = toLL(r[2], r[3]); return Object.assign({ id: 'f-' + strategy + '-' + i, type: r[1], lng: ll[0], lat: ll[1], rot: 0, future: true, year: r[0] }, r[4]); });
  }

  /* Neighbourhood catchment metrics (radius r metres around a point) */
  function local(M, D, xy, r) {
    const A = M.A; let pop = 0; for (const h of M.homes) if (dXY(h.xy, xy) <= r) pop += h.w;
    const share = div(pop, M.pop);
    const nS = D.fac.filter(f => f.cat === 'school').length || 1;
    const schoolsIn = D.fac.filter(f => f.cat === 'school' && dXY(f.xy, xy) <= r).length;
    const capBase = M.A.popBase * A.schoolShare * A.schoolCapRatio / nS * schoolsIn;
    const capNew = M.props.filter(p => p.d.c.svc === 'school' && dXY(p.d.xy, xy) <= r).reduce((t, p) => t + p.d.cap, 0);
    const sDem = pop * A.schoolShare, sCap = capBase + capNew;
    const segs = M.traffic.segs.filter(s => !s.closed && dXY(s.xy, xy) <= r);
    let num = 0, den = 0; for (const s of segs) { num += s.load * s.vc; den += s.load; }
    const sub = (cv) => { let a = 0, b = 0; M.homes.forEach((h, i) => { if (dXY(h.xy, xy) <= r) { b += h.w; if (cv.dist[i] <= cv.radius) a += h.w; } }); return div(a, b); };
    return { pop, share, schoolDemand: sDem, schoolCap: sCap, schoolPressure: div(sDem, sCap, 9.99), traffic: div(num, den), park: sub(M.cov.park), transit: sub(M.cov.transit), school: sub(M.cov.school) };
  }

  /* Pitch demo scenario (hypothetical) — offsets in metres from the reference point */
  const PITCH = { res: [1500, 600, { floors: 12, name: '' }], school: [1760, 820], park: [1560, 780], stops: [[1500, 470], [1690, 640]] };
  function pitchScenario(D, A0, at) {
    const o = at || [0, 0], ll = (x, y) => toLL(x + o[0], y + o[1]);
    const r = ll(PITCH.res[0], PITCH.res[1]), s = ll(...PITCH.school), p = ll(...PITCH.park);
    const res = [{ id: 'pz1', type: 'residential', lng: r[0], lat: r[1], floors: 12 }];
    const imp = [...res, { id: 'pz2', type: 'school', lng: s[0], lat: s[1] }, { id: 'pz3', type: 'park', lng: p[0], lat: p[1] },
      ...PITCH.stops.map((q, i) => { const b = ll(q[0], q[1]); return { id: 'pz' + (4 + i), type: 'bus_stop', lng: b[0], lat: b[1] }; })];
    const base = { assumptions: A0 || {}, budget: 50e9, trafficMode: 'morning' };
    return { res, imp, M0: compute(Object.assign({ proposals: [] }, base), D), M1: compute(Object.assign({ proposals: res }, base), D), M2: compute(Object.assign({ proposals: imp, transitBoost: false }, base), D) };
  }

  const API = { LAT0, LNG0, toXY, toLL, distLL, distPtLine, pip, rectRing, ringArea, lineLen, clamp, div, CATALOG, TYPES, DEFAULTS, WEIGHTS, mergeA, derive, compute, traffic, coverage, flood, screen, optimise, BIZ, bizScore, bestSite, futureProposals, congClass, congColor, lineCoords, PITCH, pitchScenario, local };
  G.QEngine = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
