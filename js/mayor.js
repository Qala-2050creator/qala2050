/* QALA 2050 — AI Mayor: virtual urban-planning advisor.
 * Default: transparent rule-based engine over the shared scenario state (labelled as such).
 * Optional: when the page runs as a claude.ai artifact with the `sample` capability, answers can come from Claude.
 * Never claims municipal authority. No API keys in the frontend. */
(function (G) {
  'use strict';
  const Q = G.Q, E = G.QEngine, t = (...a) => Q.t(...a), esc = Q.esc;
  const chat = [];
  const SVCMAP = { school: ['school', 'school'], kindergarten: ['kinder', 'kindergarten'], park: ['park', 'park'], bus_stop: ['transit', 'bus_stop'], clinic: ['health', 'clinic'] };

  function recs(M, M0) {
    const r = [];
    if (M.overrun > 0) r.push({ lvl: 'crit', title: t('rBudgetT'), text: t('rBudget', { x: Q.kzt(M.overrun) }), action: 'open:budget' });
    if (M.school.pressure > 1) r.push({ lvl: 'warn', title: t('rSchoolT'), text: t('rSchool', { p: Q.pct(M.school.pressure), n: Q.n(M.school.demand - M.school.cap) }), action: 'site:school' });
    if (M.traffic.index > 0.75 && M.traffic.bott[0]) r.push({ lvl: 'warn', title: t('rTrafficT'), text: t('rTraffic', { r: M.traffic.bott[0].name || t('unnamedRoad'), v: Q.n(M.traffic.bott[0].vc, 2) }), action: 'open:traffic' });
    if (M.cov.kinder.share < 0.4) r.push({ lvl: 'info', title: t('rKinderT'), text: t('rKinder', { p: Q.pct(M.cov.kinder.share) }), action: 'site:kindergarten' });
    if (M.cov.park.share < 0.35) r.push({ lvl: 'info', title: t('rParkT'), text: t('rPark', { p: Q.pct(M.cov.park.share) }), action: 'site:park' });
    if (M.cov.transit.share < 0.5) r.push({ lvl: 'info', title: t('rTransitT'), text: t('rTransit', { p: Q.pct(M.cov.transit.share) }), action: 'site:bus_stop' });
    if (M.flood.props.length) r.push({ lvl: 'warn', title: t('rFloodT'), text: t('rFlood', { n: M.flood.props.length }), action: 'open:disaster' });
    if (M.renew < 0.02) r.push({ lvl: 'info', title: t('rSolarT'), text: t('rSolar'), action: 'type:solar' });
    void M0; return r;
  }
  function act(a) {
    const [k, v] = a.split(':');
    if (k === 'open') { Q.open(v); return; }
    if (k === 'type') { Q.placeType = v; Q.open('build'); Q.map.cursor('crosshair'); return; }
    if (k === 'site') { const s = SVCMAP[v]; const rad = Q.M.A.radius[s[0] === 'health' ? 'clinic' : s[0]]; const site = E.bestSite(Q.M, s[0], rad); if (!site) { Q.notify(t('noGap'), 'info'); return; } Q.addProposal(s[1], site.ll); Q.open('build'); Q.map.flyTo({ center: site.ll, zoom: 15.6, pitch: 55, duration: 1400 }); }
  }
  function applyPlan(res) {
    let M = Q.M, n = 0;
    const svcOf = { school: 'school', kindergarten: 'kinder', clinic: 'health', hospital: 'health', park: 'park', bus_stop: 'transit', sports: 'sport' };
    Q.commit(S => {
      for (const it of res.items) for (let i = 0; i < Math.min(it.count, 12); i++) {
        const svc = svcOf[it.type]; let ll = null;
        if (svc) { const st = E.bestSite(M, svc, M.A.radius[svc === 'health' ? 'clinic' : svc]); if (st) ll = st.ll; }
        if (!ll) { const a = (n * 137.5) * Math.PI / 180, r = 2600 + 220 * n; ll = E.toLL(Math.cos(a) * r, 600 + Math.sin(a) * r); }
        const c = E.CATALOG[it.type]; S.proposals.push({ id: 'p' + (S.seq++), type: it.type, lng: ll[0], lat: ll[1], rot: 0, w: c.w, l: c.l, floors: c.floors, capacity: 0, budget: 0, name: '' }); n++;
        M = E.compute(Q.scenarioState(), Q.D);
      }
    });
    Q.notify(t('planApplied', { n }), 'ok'); Q.open('build');
  }

  /* --------- rule-based structured answers --------- */
  const has = (q, w) => w.some(x => q.includes(x));
  function intent(q) {
    q = q.toLowerCase();
    if (has(q, ['2050', 'болашақ', 'будущ', 'future', '2040'])) return 'future';
    if (has(q, ['миллиард', 'млрд', 'billion', 'бюджет', 'budget', 'теңге', 'тенге'])) return 'budget';
    if (has(q, ['сол жағалау', 'левобереж', 'левый берег', 'left bank', 'тұрғын үй', 'жил', 'housing', 'residential'])) return 'housing';
    if (has(q, ['мектеп', 'школ', 'school'])) return 'school';
    if (has(q, ['кептеліс', 'пробк', 'traffic', 'congestion', 'затор', 'көлік'])) return 'traffic';
    if (has(q, ['саябақ', 'парк', 'park', 'жасыл', 'зелен', 'green'])) return 'park';
    return 'general';
  }
  function withProps(extra, over) { return E.compute(Q.scenarioState(Object.assign({ proposals: Q.S.proposals.concat(extra) }, over || {})), Q.D); }
  function answer(q) {
    const M = Q.M, k = intent(q), A = M.A, dlt = (a, b, d, inv, u) => strip(Q.delta(b, a, d, inv, u));
    const base = { data: t('mData', { pop: Q.n(M.pop), src: Q.D.mode === 'osm' ? 'OpenStreetMap (Overpass)' : t('srcDemo'), n: Q.n(Q.D.fac.length), p: Q.S.proposals.length }), limits: t('mLimits') + (Q.D.mode === 'demo' ? ' ' + t('mLimitsDemo') : '') };
    let o = {}, site = null, M2 = null, cost = 0;
    if (k === 'school') {
      site = E.bestSite(M, 'school', A.radius.school); const p = site && { id: 'tmp', type: 'school', lng: site.ll[0], lat: site.ll[1] };
      if (p) { M2 = withProps([p]); cost = E.derive(p, A, Q.S.unitCosts).capex; }
      o = { problem: t('m_school_p', { p: Q.pct(M.school.pressure), c: Q.pct(M.school.cov) }), action: site ? t('m_school_a', { lat: site.ll[1].toFixed(4), lng: site.ll[0].toFixed(4), n: Q.n(site.gain) }) : t('noGap'), impact: M2 ? t('m_imp_school', { d: dlt(M.school.cov * 100, M2.school.cov * 100, 1, false, ' pp'), p: dlt(M.school.pressure * 100, M2.school.pressure * 100, 1, true, '%') }) : '—', risks: t('m_school_r'), alt: t('m_school_alt'), next: t('m_school_n') };
    } else if (k === 'housing') {
      const ll = E.toLL(300, -3000), p = { id: 'tmp', type: 'residential', lng: ll[0], lat: ll[1], floors: 12 };
      M2 = withProps([p]); cost = E.derive(p, A, Q.S.unitCosts).capex; site = { ll };
      const L0 = E.local(M, Q.D, E.toXY(ll[0], ll[1]), 1200), L1 = E.local(M2, Q.D, E.toXY(ll[0], ll[1]), 1200);
      o = { problem: t('m_house_p'), action: t('m_house_a'), impact: t('m_imp_house', { pop: Q.n(M2.pop - M.pop), s: Q.pct(L1.schoolPressure), tr: dlt(M.traffic.index, M2.traffic.index, 3, true), sc: Q.pct(L1.school), tc: Q.pct(L1.transit) }) + (L0.pop < 1 ? ' ' + t('m_house_empty') : ''), risks: t('m_house_r'), alt: t('m_house_alt'), next: t('m_house_n') };
    } else if (k === 'budget') {
      const b = 10e9, w = { edu: 1, health: 1, green: 1, mobility: 1, housing: 0.5, energy: 0.5, resilience: 0.7 }, res = E.optimise(b, w, Q.S.assumptions, Q.S.unitCosts, M);
      cost = res.spent; const list = res.items.map(i => Q.typeName(i.type) + ' ×' + i.count + ' (' + Q.kzt(i.cost) + ')').join('; ');
      o = { problem: t('m_bud_p'), action: t('m_bud_a', { l: list || '—' }), impact: t('m_imp_bud'), risks: t('m_bud_r'), alt: t('m_bud_alt'), next: t('m_bud_n') };
      Q.lastOpt = res; o._plan = true;
    } else if (k === 'traffic') {
      const b = M.traffic.bott[0]; const xy = b ? b.xy : [0, 0]; const extra = [0, 1, 2, 3].map(i => { const ll = E.toLL(xy[0] + (i - 1.5) * 180, xy[1] + 120); return { id: 'tmp' + i, type: 'bus_stop', lng: ll[0], lat: ll[1] }; });
      M2 = withProps(extra, { transitBoost: true }); cost = extra.reduce((s, p) => s + E.derive(p, A, Q.S.unitCosts).capex, 0); site = b ? { ll: b.mid } : null;
      o = { problem: t('m_tr_p', { i: Q.n(M.traffic.index, 2), r: b ? (b.name || t('unnamedRoad')) : '—', v: b ? Q.n(b.vc, 2) : '—' }), action: t('m_tr_a'), impact: t('m_imp_tr', { d: dlt(M.traffic.index, M2.traffic.index, 3, true) }), risks: t('m_tr_r'), alt: t('m_tr_alt'), next: t('m_tr_n') };
    } else if (k === 'park') {
      site = E.bestSite(M, 'park', A.radius.park); const p = site && { id: 'tmp', type: 'park', lng: site.ll[0], lat: site.ll[1] };
      if (p) { M2 = withProps([p]); cost = E.derive(p, A, Q.S.unitCosts).capex; }
      o = { problem: t('m_park_p', { g: Q.n(M.greenPerCap, 1), c: Q.pct(M.cov.park.share) }), action: site ? t('m_park_a', { lat: site.ll[1].toFixed(4), lng: site.ll[0].toFixed(4), n: Q.n(site.gain) }) : t('noGap'), impact: M2 ? t('m_imp_park', { d: dlt(M.cov.park.share * 100, M2.cov.park.share * 100, 1, false, ' pp'), h: dlt(M.heat.city * 100, M2.heat.city * 100, 1, true) }) : '—', risks: t('m_park_r'), alt: t('m_park_alt'), next: t('m_park_n') };
    } else if (k === 'future') {
      const R = ['green', 'economic', 'balanced'].map(s => [s, E.compute(Object.assign(Q.scenarioState({ strategy: s, futureYear: 2050 }), { futureProposals: E.futureProposals(s, 2050) }), Q.D)]).sort((a, b) => b[1].chi - a[1].chi);
      const best = R[0]; cost = best[1].futureCapex;
      o = { problem: t('m_fut_p'), action: t('m_fut_a', { s: t('str_' + best[0]), c: Q.n(best[1].chi, 1) }), impact: R.map(([s, m]) => t('str_' + s) + ': ' + t('chi') + ' ' + Q.n(m.chi, 1) + ', ' + t('kTraffic') + ' ' + Q.n(m.traffic.index, 2)).join(' · '), risks: t('m_fut_r'), alt: t('m_fut_alt'), next: t('m_fut_n') };
    } else {
      const r = recs(M, Q.M0);
      o = { problem: r.length ? r[0].title + ': ' + r[0].text : t('noRecs'), action: r.slice(0, 3).map(x => x.title).join('; ') || '—', impact: t('m_gen_i', { c: Q.n(M.chi, 1) }), risks: t('m_gen_r'), alt: t('m_gen_alt'), next: t('m_gen_n') };
    }
    o.data = base.data; o.limits = base.limits; o.budget = cost ? Q.kzt(cost) + ' ' + t('m_costNote') : '—'; o._site = site; o._k = k;
    return o;
  }
  const strip = h => String(h).replace(/<[^>]+>/g, '');
  const FIELDS = ['problem', 'data', 'action', 'impact', 'budget', 'risks', 'alt', 'limits', 'next'];
  function render(el) {
    el.innerHTML = chat.map((m, i) => m.q !== undefined ? `<div class="msg me">${esc(m.q)}</div>` : `<div class="msg ai"><div class="ai-h">${esc(t('mayorName'))} <span class="st st-${m.src === 'claude' ? 'MODEL' : 'RULE'}">${esc(m.src === 'claude' ? t('claudeEngine') : t('ruleBased'))}</span></div>${FIELDS.map((f, j) => m.a[f] ? `<div class="ans"><b>${j + 1}. ${esc(t('mf_' + f))}</b><span>${esc(m.a[f])}</span></div>` : '').join('')}<div class="row wrap">${m.a._site ? `<button class="lnk" data-fly="${i}">${esc(t('flyTo'))}</button>` : ''}${m.a._plan ? `<button class="lnk" data-plan="${i}">${esc(t('optApply'))}</button>` : ''}</div></div>`).join('');
    el.querySelectorAll('[data-fly]').forEach(b => b.onclick = () => { const s = chat[+b.dataset.fly].a._site; Q.map.flyTo({ center: s.ll, zoom: 15.4, pitch: 55, duration: 1400 }); });
    el.querySelectorAll('[data-plan]').forEach(b => b.onclick = () => Q.lastOpt && applyPlan(Q.lastOpt));
    el.scrollTop = el.scrollHeight;
  }
  let sample = null, sampleChecked = false;
  async function checkSample() { if (sampleChecked) return sample; sampleChecked = true; try { if (G.claude && G.claude.use) sample = await Promise.race([G.claude.use('sample'), new Promise(r => setTimeout(() => r(null), 2500))]); } catch (e) { sample = null; } return sample; }
  async function engineLabel(el) {
    const s = await checkSample(); if (!el) return;
    if (!s) { el.textContent = t('ruleEngine'); return; }
    el.innerHTML = `<label class="chk"><input type="checkbox" id="mClaude" ${Q.S.aiMode === 'claude' ? 'checked' : ''}> ${esc(t('useClaude'))}</label>`;
    el.querySelector('#mClaude').onchange = e => { Q.S.aiMode = e.target.checked ? 'claude' : 'rules'; Q.save(); };
  }
  async function askClaude(q, rule) {
    const M = Q.M, ctx = { city: 'Kyzylorda, Kazakhstan', lang: Q.S.lang, dataMode: Q.D.mode, population: Math.round(M.pop), cityHealthIndex: +M.chi.toFixed(1), scores: Object.fromEntries(Object.entries(M.scores).map(([k, v]) => [k, Math.round(v)])), trafficIndex: +M.traffic.index.toFixed(3), schoolPressure: +M.school.pressure.toFixed(3), coverage: Object.fromEntries(Object.entries(M.cov).map(([k, v]) => [k, +v.share.toFixed(3)])), greenPerCapita: +M.greenPerCap.toFixed(2), budgetKZT: M.budget, capexKZT: Math.round(M.capexC), proposals: Q.S.proposals.map(p => ({ type: p.type, lat: p.lat, lng: p.lng })), year: Q.S.futureYear, strategy: Q.S.strategy, ruleEngineDraft: Object.fromEntries(FIELDS.map(f => [f, rule[f]])) };
    const prompt = `You are "AI Mayor", a virtual urban-planning ADVISOR inside the QALA 2050 demo for Kyzylorda. You are NOT the real mayor and have no municipal authority. Use only the scenario data below; all figures are model outputs or assumptions, not official statistics. Reply in language code "${Q.S.lang}" (kk = Kazakh, ru = Russian, en = English). Return ONLY a JSON object with string fields: problem, data, action, impact, budget, risks, alt, limits, next. Keep each field under 60 words. Do not invent numbers that are not in the data.\nDATA: ${JSON.stringify(ctx)}\nQUESTION: ${q}`;
    const res = await sample.json(prompt, { modelTier: 'default', cache: false });
    const out = {}; for (const f of FIELDS) out[f] = typeof res[f] === 'string' ? res[f].slice(0, 600) : rule[f];
    return out;
  }
  async function ask(q, el) {
    chat.push({ q }); render(el); Q.award('mayor');
    const rule = answer(q); let a = rule, src = 'rules';
    if (Q.S.aiMode === 'claude' && await checkSample()) {
      const wait = { a: { problem: t('thinking') }, src: 'claude' }; chat.push(wait); render(el);
      try { a = Object.assign(await askClaude(q, rule), { _site: rule._site, _plan: rule._plan }); src = 'claude'; } catch (e) { Q.notify(t('claudeFail'), 'warn'); }
      chat.pop();
    }
    chat.push({ a, src }); render(el);
  }
  G.QMayor = { recs, act, applyPlan, ask, answer, intent, restore: render, engineLabel };
})(window);
