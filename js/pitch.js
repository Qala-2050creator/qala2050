/* QALA 2050 — Investor Pitch Mode (drives the real app), web presentation deck, business-model page. */
(function (G) {
  'use strict';
  const Q = G.Q, E = G.QEngine, t = (...a) => Q.t(...a), esc = Q.esc, $ = Q.$;
  let P = null;           // pitch session
  const DUR = { 2: [6, 8, 9, 13, 10, 14, 13, 12, 14, 13, 8], 3: [9, 12, 13, 19, 15, 21, 20, 18, 21, 20, 12] };
  const STEPS = 11;

  async function pickOrigin() {
    if (Q.map.kind !== 'live') return [0, 0];
    const cands = [[0, 0], [600, 0], [-600, 0], [0, 700], [0, -500], [900, 900], [-900, 900], [1200, -300], [-1200, 300]];
    for (const o of cands) {
      const sc = E.pitchScenario(Q.D, Q.S.assumptions, o); let ok = true;
      for (const p of sc.imp) { const d = E.derive(p, E.mergeA(Q.S.assumptions)); const r = Q.map.checkSite(d.ring); if (r && !r.unknown && (r.water || (r.buildings && !d.c.road))) { ok = false; break; } }
      if (ok) return o;
    }
    return [0, 0];
  }
  const site = () => E.toLL(E.PITCH.res[0] + P.o[0], E.PITCH.res[1] + P.o[1]);
  const loc = M => E.local(M, Q.D, E.toXY(...site()), 800);

  async function run(k, fast) {
    const d = fast ? 0 : 1, S = Q.S;
    P.cap = { h: t('ps' + k + 'h'), b: t('ps' + k + 'b') }; P.card = null;
    if (k === 0) { S.proposals = []; S.trees = []; S.closures = []; S.futureYear = 2025; S.budget = 50e9; Q.before = false; Object.assign(S.layers, { traffic: false, gaps: false, heat: false, flood: false, future: false }); Q.gapSvc = 'school'; Q.changed(true); P.splash = true; }
    if (k >= 1) P.splash = false;
    if (k === 1) await Q.map.flyTo({ center: [65.509, 44.845], zoom: Q.map.kind === 'live' ? 12.4 : 12.2, pitch: 40, bearing: -20, duration: 3500 * d });
    if (k === 2) { const ll = site(); await Q.map.flyTo({ center: ll, zoom: Q.map.kind === 'live' ? 15.3 : 14.6, pitch: 60, bearing: 35, duration: 3200 * d }); if (!P.oDone) { P.o = await pickOrigin(); P.oDone = true; } }
    if (k === 3) { S.layers.gaps = true; S.layers.traffic = true; Q.changed(true); const L = loc(Q.M); P.cap.b = t('ps3b', { s: Q.pct(Q.M.school.pressure), c: Q.pct(Q.M.cov.park.share), tr: Q.n(Q.M.traffic.index, 2) }); void L; await Q.map.flyTo({ center: site(), zoom: Q.map.kind === 'live' ? 14.4 : 13.9, pitch: 50, bearing: 10, duration: 2000 * d }); }
    if (k === 4) { const sc = E.pitchScenario(Q.D, S.assumptions, P.o); S.proposals = sc.res.map(p => Object.assign({ rot: 0, w: 80, l: 60, capacity: 0, budget: 0, name: t('pitchRes') }, p)); S.selId = null; S.layers.gaps = false; Q.changed(true); await Q.map.flyTo({ center: site(), zoom: Q.map.kind === 'live' ? 15.8 : 15.2, pitch: 60, bearing: 50, duration: 2200 * d }); }
    if (k === 5) { const sc = E.pitchScenario(Q.D, S.assumptions, P.o), L0 = E.local(sc.M0, Q.D, E.toXY(...site()), 800), L1 = E.local(sc.M1, Q.D, E.toXY(...site()), 800); P.cap.b = t('ps5b', { pop: Q.n(sc.M1.pop - sc.M0.pop), s0: Q.pct(L0.schoolPressure), s1: Q.pct(L1.schoolPressure), t0: Q.n(L0.traffic, 2), t1: Q.n(L1.traffic, 2), cost: Q.kzt(sc.M1.capexC) }); S.layers.traffic = true; Q.changed(true); }
    if (k === 6) { const sc = E.pitchScenario(Q.D, S.assumptions, P.o); S.proposals = sc.imp.map(p => Object.assign({ rot: 0, capacity: 0, budget: 0, name: p.type === 'residential' ? t('pitchRes') : '' }, p)); Q.changed(true); await Q.map.flyTo({ center: site(), zoom: Q.map.kind === 'live' ? 15.4 : 14.9, pitch: 58, bearing: -30, duration: 2400 * d }); }
    if (k === 7) { const sc = E.pitchScenario(Q.D, S.assumptions, P.o), x = E.toXY(...site()), L1 = E.local(sc.M1, Q.D, x, 800), L2 = E.local(sc.M2, Q.D, x, 800); P.cap.b = t('ps7b', { s1: Q.pct(L1.schoolPressure), s2: Q.pct(L2.schoolPressure), p1: Q.pct(L1.park), p2: Q.pct(L2.park), b1: Q.pct(L1.transit), b2: Q.pct(L2.transit) }); S.layers.gaps = true; Q.changed(true); }
    if (k === 8) { const sc = E.pitchScenario(Q.D, S.assumptions, P.o), x = E.toXY(...site()), L = [sc.M0, sc.M1, sc.M2].map(M => E.local(M, Q.D, x, 800)); S.layers.gaps = false; Q.changed(true);
      P.card = `<h3>${esc(t('ps8h'))}</h3><table class="tbl"><thead><tr><th></th><th>${esc(t('pcBase'))}</th><th>${esc(t('pcRes'))}</th><th>${esc(t('pcImp'))}</th></tr></thead><tbody>
        <tr><td>${esc(t('kPop'))} (800 ${esc(t('m'))})</td>${L.map(l => `<td>${Q.n(l.pop)}</td>`).join('')}</tr>
        <tr><td>${esc(t('iSchoolPress'))}</td>${L.map(l => `<td>${Q.pct(l.schoolPressure)}</td>`).join('')}</tr>
        <tr><td>${esc(t('covPark'))}</td>${L.map(l => `<td>${Q.pct(l.park)}</td>`).join('')}</tr>
        <tr><td>${esc(t('covTransit'))}</td>${L.map(l => `<td>${Q.pct(l.transit)}</td>`).join('')}</tr>
        <tr><td>${esc(t('kTraffic'))}</td>${L.map(l => `<td>${Q.n(l.traffic, 2)}</td>`).join('')}</tr>
        <tr><td>${esc(t('chi'))} (${esc(t('city'))})</td>${[sc.M0, sc.M1, sc.M2].map(M => `<td>${Q.n(M.chi, 1)}</td>`).join('')}</tr>
        <tr><td>${esc(t('capex'))}</td>${[sc.M0, sc.M1, sc.M2].map(M => `<td>${Q.kzt(M.capexC)}</td>`).join('')}</tr></tbody></table><p class="muted sm">${Q.badge('MODEL')} ${esc(t('pitchNote'))}</p>`; }
    if (k === 9) { P.card = bizCard(); Q.map.flyTo({ center: [65.509, 44.846], zoom: Q.map.kind === 'live' ? 13 : 12.5, pitch: 45, bearing: -10, duration: 3000 * d }); }
    if (k === 10) { P.card = null; P.splash = 'end'; Q.award('pitch'); }
    draw();
  }
  function bizCard() { const pr = Q.pricing(); return `<h3>${esc(t('ps9h'))}</h3><div class="g3">${[['tierFree', 0], ['tierEnt', pr.ent], ['tierCon', pr.con], ['tierMun', pr.mun]].map(([k, v]) => `<div class="tier"><b>${esc(t(k))}</b><span>${v ? Q.kzt(v) + (k === 'tierMun' ? ' / ' + t('yr') : ' / ' + t('mo')) : esc(t('free'))}</span></div>`).join('')}</div><ol class="road">${[1, 2, 3, 4, 5, 6].map(i => `<li>${esc(t('ph' + i))}</li>`).join('')}</ol><p class="muted sm">${esc(t('bmNote'))}</p>`; }
  function draw() {
    const el = $('#pitch'); if (!P) { el.hidden = true; return; }
    el.hidden = false;
    el.innerHTML = `${P.splash ? `<div class="splash ${P.splash === 'end' ? 'end' : ''}"><div class="logo-xl">${G.QIcons.logo}<span>QALA <b>2050</b></span></div><p class="eyebrow">${esc(t('labName'))} · Kyzylorda</p><p class="slogan">«${esc(t('slogan'))}»</p><p class="slogan2">${esc(t('sloganEn'))}</p>${P.splash === 'end' ? `<p class="final">«${esc(t('finalStatement'))}»</p><p class="muted">${esc(Q.S.presenter)}</p>` : ''}</div>` : ''}
      ${P.card ? `<div class="pcard">${P.card}</div>` : ''}
      <div class="pcap"><div class="pstep">${P.k + 1} / ${STEPS}</div><h3>${esc(P.cap.h)}</h3><p>${esc(P.cap.b)}</p><div class="pprog"><i style="width:${(P.k + 1) / STEPS * 100}%"></i></div>
        <div class="pctl"><button class="btn" data-p="prev" title="${esc(t('prev'))}">◀</button><button class="btn pri" data-p="play">${P.auto ? '❚❚ ' + esc(t('pause')) : '▶ ' + esc(t('resume'))}</button><button class="btn" data-p="next" title="${esc(t('next'))}">▶</button><button class="btn" data-p="restart">↺ ${esc(t('restart'))}</button>
        <span class="seg"><button class="${P.min === 2 ? 'on' : ''}" data-p="m2">2 ${esc(t('min'))}</button><button class="${P.min === 3 ? 'on' : ''}" data-p="m3">3 ${esc(t('min'))}</button></span><button class="btn" data-p="fs">⛶</button><button class="btn" data-p="exit">✕ ${esc(t('exit'))}</button><span class="ptip">${esc(t('pitchTip'))}</span></div></div>`;
    el.querySelectorAll('[data-p]').forEach(b => b.onclick = () => ctl(b.dataset.p));
  }
  function schedule() { clearTimeout(P.timer); if (!P.auto || P.k >= STEPS - 1) return; P.timer = setTimeout(() => go(P.k + 1), DUR[P.min][P.k] * 1000); }
  async function go(k) {
    if (!P) return; k = Math.max(0, Math.min(STEPS - 1, k)); const tok = ++P.tok;
    if (k < P.k + 1 && k !== P.k + 1) { for (let i = 0; i < k; i++) { if (tok !== P.tok) return; P.k = i; await run(i, true); } }
    P.k = k; await run(k, false); if (tok === P.tok) schedule();
  }
  function ctl(c) {
    if (!P) return;
    if (c === 'next') go(P.k + 1); else if (c === 'prev') go(P.k - 1); else if (c === 'restart') go(0);
    else if (c === 'play') { P.auto = !P.auto; draw(); schedule(); }
    else if (c === 'm2' || c === 'm3') { P.min = +c[1]; draw(); schedule(); }
    else if (c === 'fs') { try { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); } catch (e) { } }
    else if (c === 'exit') stop();
  }
  function key(e) { if (!P) return; if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); ctl('next'); } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); ctl('prev'); } else if (e.key === ' ') { e.preventDefault(); ctl('play'); } else if (e.key === 'Escape') stop(); }
  function start(min) {
    if (P) stop();
    P = { k: -1, tok: 0, auto: true, min: min === 3 ? 3 : 2, o: [0, 0], oDone: false, snap: JSON.stringify({ p: Q.S.proposals, tr: Q.S.trees, c: Q.S.closures, l: Q.S.layers, y: Q.S.futureYear, b: Q.S.budget, sel: Q.S.selId }) };
    document.body.classList.add('pitching'); Q.togglePlay(false); document.addEventListener('keydown', key); go(0);
  }
  function stop() {
    if (!P) return; clearTimeout(P.timer); const s = JSON.parse(P.snap); P = null;
    Object.assign(Q.S, { proposals: s.p, trees: s.tr, closures: s.c, layers: s.l, futureYear: s.y, budget: s.b, selId: s.sel }); Q.before = false;
    document.body.classList.remove('pitching'); document.removeEventListener('keydown', key); $('#pitch').hidden = true; Q.changed(true); Q.renderShell();
  }

  /* ---------------- business model (configurable, hypothetical) ---------------- */
  Q.pricing = () => Object.assign({ ent: 14990, con: 149990, mun: 12e6, uni: 1.5e6, custom: 4e6 }, Q.S.pricing || {});
  Q.customers = () => Object.assign({ ent: [20, 120, 400, 900, 1600], con: [2, 10, 30, 60, 100], mun: [0, 1, 3, 7, 12], uni: [1, 3, 6, 10, 14], custom: [0, 2, 5, 9, 14] }, Q.S.customers || {});
  Q.revenue = () => { const p = Q.pricing(), c = Q.customers(); return [0, 1, 2, 3, 4].map(i => c.ent[i] * p.ent * 12 + c.con[i] * p.con * 12 + c.mun[i] * p.mun + c.uni[i] * p.uni + c.custom[i] * p.custom); };
  Q.views.model = {
    sub: 'bmSub',
    form: () => { const p = Q.pricing(), c = Q.customers(); return `<div class="warn w-info">${esc(t('bmNote'))}</div><h4>${esc(t('segments'))}</h4><div class="chips">${['mun', 'con', 'dev', 'inv', 'ent', 'uni', 'plan', 'res'].map(k => `<span class="chip on">${esc(t('seg_' + k))}</span>`).join('')}</div>
      <h4>${esc(t('pricing'))} ${Q.badge('EST')}</h4><div class="ucost">${[['ent', 'tierEnt', t('mo')], ['con', 'tierCon', t('mo')], ['mun', 'tierMun', t('yr')], ['uni', 'tierUni', t('yr')], ['custom', 'tierCustom', t('project')]].map(([k, l, u]) => `<label><span>${esc(t(l))}</span><input type="number" min="0" step="1000" data-pr="${k}" value="${p[k]}"><em>₸/${esc(u)}</em></label>`).join('')}</div><p class="muted sm">${esc(t('tierFree'))}: ${esc(t('free'))} · ${esc(t('munRange'))}</p>
      <h4>${esc(t('custCounts'))}</h4><div class="scroll"><table class="tbl inp"><thead><tr><th></th>${[1, 2, 3, 4, 5].map(y => `<th>${esc(t('yrN', { n: y }))}</th>`).join('')}</tr></thead><tbody>${['ent', 'con', 'mun', 'uni', 'custom'].map(k => `<tr><td>${esc(t('tier' + { ent: 'Ent', con: 'Con', mun: 'Mun', uni: 'Uni', custom: 'Custom' }[k]))}</td>${c[k].map((v, i) => `<td><input type="number" min="0" step="1" data-cu="${k}:${i}" value="${v}"></td>`).join('')}</tr>`).join('')}</tbody></table></div>`; },
    bind: el => {
      el.querySelectorAll('[data-pr]').forEach(i => i.onchange = () => { Q.S.pricing = Object.assign(Q.pricing(), { [i.dataset.pr]: Math.max(0, +i.value || 0) }); Q.save(); Q.refreshView(); });
      el.querySelectorAll('[data-cu]').forEach(i => i.onchange = () => { const [k, n] = i.dataset.cu.split(':'); const c = Q.customers(); c[k][+n] = Math.max(0, Math.round(+i.value || 0)); Q.S.customers = c; Q.save(); Q.refreshView(); });
    },
    results: () => { const r = Q.revenue(), mx = Math.max(...r, 1); return `<section class="card"><h4>${esc(t('revScenario'))} ${Q.badge('DEMO')}</h4>${Q.hb(r.map((v, i) => ({ l: t('yrN', { n: i + 1 }), v, txt: Q.kzt(v) })), mx)}<p class="muted sm">${esc(t('revNote'))}</p></section>
      <section class="card"><h4>${esc(t('gtm'))}</h4><ol class="road">${[1, 2, 3, 4, 5, 6].map(i => `<li>${esc(t('ph' + i))}</li>`).join('')}</ol></section>
      <section class="card"><h4>${esc(t('competitors'))}</h4><div class="scroll"><table class="tbl stack"><thead><tr><th></th><th>QALA 2050</th><th>Esri ArcGIS Urban</th><th>Helsinki 3D</th></tr></thead><tbody>
        <tr><td>${esc(t('cmpType'))}</td><td>${esc(t('cq_type'))}</td><td>${esc(t('ca_type'))}</td><td>${esc(t('ch_type'))}</td></tr>
        <tr><td>${esc(t('cmpScen'))}</td><td>✓ ${esc(t('cq_scen'))}</td><td>✓ ${esc(t('ca_scen'))}</td><td>${esc(t('ch_scen'))}</td></tr>
        <tr><td>${esc(t('cmpLang'))}</td><td>KK / RU / EN</td><td>${esc(t('ca_lang'))}</td><td>${esc(t('ch_lang'))}</td></tr>
        <tr><td>${esc(t('cmpCit'))}</td><td>✓ ${esc(t('cq_cit'))}</td><td>${esc(t('ca_cit'))}</td><td>${esc(t('ch_cit'))}</td></tr>
        <tr><td>${esc(t('cmpData'))}</td><td>${esc(t('cq_data'))}</td><td>${esc(t('ca_data'))}</td><td>${esc(t('ch_data'))}</td></tr></tbody></table></div>
        <p class="muted sm">${esc(t('compSrc'))}: <a href="https://www.esri.com/en-us/arcgis/products/arcgis-urban/overview" target="_blank" rel="noopener">esri.com</a> · <a href="https://www.hel.fi/en/decision-making/information-on-helsinki/maps-and-geospatial-data/helsinki-3d" target="_blank" rel="noopener">hel.fi</a></p><p class="sm">${esc(t('positioning'))}</p></section>`; }
  };

  /* ---------------- interactive 10-slide web presentation ---------------- */
  function openDeck() {
    const sc = E.pitchScenario(Q.D, Q.S.assumptions, [0, 0]), x = E.toXY(...E.toLL(E.PITCH.res[0], E.PITCH.res[1])), L = [sc.M0, sc.M1, sc.M2].map(M => E.local(M, Q.D, x, 800));
    let shot = ''; try { shot = Q.map.screenshot(); } catch (e) { }
    const rev = Q.revenue();
    const S = [
      `<div class="sl-title"><div class="logo-xl">${G.QIcons.logo}<span>QALA<b>2050</b></span></div><h1>${esc(t('d1t'))}</h1><p class="slogan">«${esc(t('slogan'))}»</p><p>${esc(t('d1b'))}</p><p class="muted">${esc(Q.S.presenter)}</p></div>`,
      `<h2>${esc(t('d2t'))}</h2><div class="g5">${[1, 2, 3, 4, 5].map(i => `<div class="dk"><b>${esc(t('d2p' + i))}</b><span>${esc(t('d2d' + i))}</span></div>`).join('')}</div><p class="muted">${esc(t('d2note'))}</p>`,
      `<h2>${esc(t('d3t'))}</h2><p class="lead">${esc(t('d3b'))}</p><div class="flow">${['d5a', 'd5b', 'd5c', 'd5d', 'd5e'].map(k => `<span>${esc(t(k))}</span>`).join('<i>→</i>')}</div>`,
      `<h2>${esc(t('d4t'))}</h2>${shot ? `<img class="shot" src="${shot}" alt="${esc(t('d4alt'))}">` : ''}<p class="muted">${esc(t('d4b', { m: Q.mode === 'live' ? t('dsLive') : t('dsOffline') }))}</p>`,
      `<h2>${esc(t('d5t'))}</h2><div class="flow big">${['d5a', 'd5b', 'd5c', 'd5d', 'd5e'].map(k => `<span>${esc(t(k))}</span>`).join('<i>→</i>')}</div><p>${esc(t('d5b2'))}</p>`,
      `<h2>${esc(t('d6t'))}</h2><table class="tbl big"><thead><tr><th></th><th>${esc(t('pcBase'))}</th><th>${esc(t('pcRes'))}</th><th>${esc(t('pcImp'))}</th></tr></thead><tbody><tr><td>${esc(t('iSchoolPress'))}</td>${L.map(l => `<td>${Q.pct(l.schoolPressure)}</td>`).join('')}</tr><tr><td>${esc(t('covPark'))}</td>${L.map(l => `<td>${Q.pct(l.park)}</td>`).join('')}</tr><tr><td>${esc(t('covTransit'))}</td>${L.map(l => `<td>${Q.pct(l.transit)}</td>`).join('')}</tr><tr><td>${esc(t('capex'))}</td>${[sc.M0, sc.M1, sc.M2].map(M => `<td>${Q.kzt(M.capexC)}</td>`).join('')}</tr></tbody></table><p class="muted">${Q.badge('DEMO')} ${esc(t('d6note', { d: Q.D.mode === 'osm' ? 'OpenStreetMap' : t('srcDemo') }))}</p>`,
      `<h2>${esc(t('d7t'))}</h2><div class="g5">${['mun', 'con', 'inv', 'uni', 'ent'].map(k => `<div class="dk"><b>${esc(t('seg_' + k))}</b></div>`).join('')}</div><p>${esc(t('d7b'))}</p>`,
      `<h2>${esc(t('d8t'))}</h2><div class="g3">${[['tierFree', 0], ['tierEnt', Q.pricing().ent], ['tierCon', Q.pricing().con], ['tierMun', Q.pricing().mun]].map(([k, v]) => `<div class="tier"><b>${esc(t(k))}</b><span>${v ? Q.kzt(v) : esc(t('free'))}</span></div>`).join('')}</div>${Q.hb(rev.map((v, i) => ({ l: t('yrN', { n: i + 1 }), v, txt: Q.kzt(v) })), Math.max(...rev))}<p class="muted">${esc(t('revNote'))}</p>`,
      `<h2>${esc(t('d9t'))}</h2><div class="g2d"><ul>${[1, 2, 3, 4, 5].map(i => `<li>${esc(t('d9a' + i))}</li>`).join('')}</ul><ol class="road">${[1, 2, 3, 4, 5, 6].map(i => `<li>${esc(t('ph' + i))}</li>`).join('')}</ol></div>`,
      `<div class="sl-title"><h2>${esc(t('d10t'))}</h2><p class="lead">${esc(t('d10b'))}</p><p class="final">«${esc(t('finalStatement'))}»</p><div class="logo-xl sm">${G.QIcons.logo}<span>QALA<b>2050</b></span></div><p class="muted">${esc(Q.S.presenter)}</p></div>`
    ];
    const el = $('#deck'); el.hidden = false;
    el.innerHTML = `<div class="deck-sc" id="deckSc">${S.map((h, i) => `<section class="slide" id="sl${i + 1}"><div class="sl-in">${h}</div><span class="sl-n">${i + 1} / 10</span></section>`).join('')}</div><div class="deck-ctl"><button class="btn" id="dPrev">◀</button><span id="dNum">1 / 10</span><button class="btn" id="dNext">▶</button><button class="btn" id="dFs">⛶</button><button class="btn" id="dClose">✕ ${esc(t('exit'))}</button></div>`;
    const sc2 = $('#deckSc'); let i = 0;
    const to = n => { i = Math.max(0, Math.min(9, n)); sc2.children[i].scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' }); $('#dNum').textContent = (i + 1) + ' / 10'; };
    sc2.addEventListener('scroll', () => { const n = Math.round(sc2.scrollLeft / sc2.clientWidth); if (n !== i) { i = n; $('#dNum').textContent = (i + 1) + ' / 10'; } });
    $('#dPrev').onclick = () => to(i - 1); $('#dNext').onclick = () => to(i + 1); $('#dClose').onclick = closeDeck;
    $('#dFs').onclick = () => { try { document.fullscreenElement ? document.exitFullscreen() : el.requestFullscreen(); } catch (e) { } };
    Q._deckKey = e => { if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); to(i + 1); } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); to(i - 1); } else if (e.key === 'Escape') closeDeck(); };
    document.addEventListener('keydown', Q._deckKey);
  }
  function closeDeck() { $('#deck').hidden = true; $('#deck').innerHTML = ''; document.removeEventListener('keydown', Q._deckKey); }
  G.QPitch = { start, stop, openDeck, closeDeck, isOn: () => !!P };
})(window);
