/* QALA 2050 — module panels. Each view: form() static controls, bind(), results() dynamic, onMapClick(). */
(function (G) {
  'use strict';
  const Q = G.Q, E = G.QEngine, t = (...a) => Q.t(...a), esc = Q.esc, $ = Q.$, $$ = Q.$$, V = Q.views;
  const sel = (id, opts, cur, lbl) => `<label class="fld"><span>${esc(lbl)}</span><select id="${id}">${opts.map(([v, n]) => `<option value="${esc(v)}"${String(v) === String(cur) ? ' selected' : ''}>${esc(n)}</option>`).join('')}</select></label>`;
  const num = (id, v, lbl, min, max, step, unit) => `<label class="fld"><span>${esc(lbl)}${unit ? ' <em>' + esc(unit) + '</em>' : ''}</span><input id="${id}" type="number" inputmode="decimal" value="${esc(v)}" min="${min}" max="${max}" step="${step || 1}"></label>`;
  const rng = (id, v, lbl, min, max, step, out) => `<label class="fld"><span>${esc(lbl)} <output id="${id}O">${esc(out)}</output></span><input id="${id}" type="range" value="${v}" min="${min}" max="${max}" step="${step || 1}"></label>`;
  const kv = (k, v, st) => `<div class="kv"><span>${esc(k)}</span><b>${v}</b>${st ? Q.badge(st) : ''}</div>`;
  const hb = (rows, max) => `<div class="hbars">${rows.map(r => `<div class="hb"><span>${esc(r.l)}</span><div class="bar"><i style="width:${Math.max(1, Math.min(100, r.v / (max || 1) * 100))}%;background:${r.c || 'var(--cy)'}"></i></div><b>${r.txt}</b></div>`).join('')}</div>`;
  Q.hb = hb;
  const dRow = (k, a, b, d, inv, unit, fmt) => { const f = fmt || (x => Q.n(x, d)); return `<tr><td>${esc(k)}</td><td>${f(a)}</td><td>${f(b)}</td><td>${Q.delta(b, a, d, inv, unit)}</td></tr>`; };
  Q.dRow = dRow;
  const impactTable = (A, B) => `<table class="tbl"><thead><tr><th></th><th>${esc(t('before'))}</th><th>${esc(t('after'))}</th><th>Δ</th></tr></thead><tbody>
    ${dRow(t('kPop'), A.pop, B.pop)}${dRow(t('iSchoolDem'), A.school.demand, B.school.demand, 0, true)}${dRow(t('iSchoolPress'), A.school.pressure * 100, B.school.pressure * 100, 1, true, '%')}
    ${dRow(t('covSchool'), A.school.cov * 100, B.school.cov * 100, 1, false, ' pp')}${dRow(t('covHealth'), A.cov.health.share * 100, B.cov.health.share * 100, 1, false, ' pp')}
    ${dRow(t('kTraffic'), A.traffic.index, B.traffic.index, 3, true)}${dRow(t('parkDem'), A.parkingDemand, B.parkingDemand, 0, true)}${dRow(t('kGreen'), A.greenPerCap, B.greenPerCap, 2)}
    ${dRow(t('water'), A.waterDemand, B.waterDemand, 0, true)}${dRow(t('energy'), A.energy, B.energy, 1, true)}${dRow(t('capex'), A.capexC / 1e9, B.capexC / 1e9, 2, true, ' ' + t('bn'))}
    ${dRow(t('jobs'), A.jobs, B.jobs)}${dRow(t('chi'), A.chi, B.chi, 1)}</tbody></table>`;
  Q.impactTable = impactTable;
  const GROUPS = [['edu', ['school', 'kindergarten', 'university']], ['hlth', ['hospital', 'clinic']], ['res', ['residential', 'apartment']], ['biz', ['shopping', 'business', 'hotel']], ['rec', ['stadium', 'sports', 'park', 'playground']], ['ind', ['factory']], ['mob', ['road', 'bridge', 'bus_stop', 'parking']], ['eng', ['solar', 'water']]];

  /* ============ OVERVIEW ============ */
  V.overview = {
    sub: 'ovSub',
    form: () => `<div class="hero"><p class="lead">${esc(t('ovLead'))}</p><div class="row wrap"><button class="btn pri" data-go="build">${esc(t('ovStart'))}</button><button class="btn" data-pitch="2">▶ ${esc(t('pitchMode'))}</button><button class="btn" data-go="mayor">${esc(t('nav_mayor'))}</button>${location.protocol === 'file:' ? '' : `<button class="btn" data-go="reports">⇩ ${esc(t('dlTitle'))}</button>`}</div></div>
      <label class="fld"><span>${esc(t('profName'))}</span><input id="profName" value="${esc(Q.S.profile.name)}" placeholder="${esc(t('profPh'))}" maxlength="40"></label>`,
    bind: el => { $$('[data-go]', el).forEach(b => b.onclick = () => Q.open(b.dataset.go)); $$('[data-pitch]', el).forEach(b => b.onclick = () => G.QPitch.start(+b.dataset.pitch)); $('#profName', el).oninput = e => { Q.S.profile.name = e.target.value; Q.save(); }; },
    results: () => {
      const M = Q.M, ach = Q.S.profile.ach, xp = Q.S.profile.xp || 0, lvl = 1 + Math.floor(xp / 300), wk = Q.weekly();
      const lb = Object.entries(Q.S.saved).map(([n, s]) => [n, s.chi || 0]).sort((a, b) => b[1] - a[1]).slice(0, 5);
      return `<section class="card"><h4>${esc(t('profile'))}</h4><div class="row"><div class="lvl">${lvl}</div><div><b>${esc(Q.S.profile.name || t('planner'))}</b><div class="muted sm">${Q.n(xp)} XP · ${esc(t('level'))} ${lvl}</div>${Q.bar((xp % 300) / 3)}</div></div></section>
      <section class="card"><h4>${esc(t('weekly'))}</h4><div class="mission ${wk.done ? 'done' : ''}"><b>${esc(t('mis_' + wk.k))}</b><span>${wk.done ? '✓ ' + esc(t('completed')) : esc(t('inProgress'))}</span></div></section>
      <section class="card"><h4>${esc(t('missions'))} <span class="muted sm">${Q.MISSIONS.filter(m => m.done).length}/${Q.MISSIONS.length}</span></h4>${Q.MISSIONS.map(m => `<div class="mission ${m.done ? 'done' : ''}"><b>${m.done ? '✓ ' : ''}${esc(t('mis_' + m.k))}</b><span>${esc(t('misd_' + m.k))}</span></div>`).join('')}<p class="muted sm">${esc(t('misNote'))}</p></section>
      <section class="card"><h4>${esc(t('achievements'))} <span class="muted sm">${Q.ACH.filter(k => ach[k]).length}/${Q.ACH.length}</span></h4><div class="achs">${Q.ACH.map(k => `<span class="ach ${ach[k] ? 'on' : ''}" title="${esc(t('achd_' + k))}">${esc(t('ach_' + k))}</span>`).join('')}</div></section>
      <section class="card"><h4>${esc(t('compMode'))}</h4>${lb.length ? `<ol class="lb">${lb.map(([n, c]) => `<li><span>${esc(n)}</span><b>${Q.n(c, 1)}</b></li>`).join('')}</ol>` : `<p class="muted">${esc(t('compEmpty'))}</p>`}<p class="muted sm">${esc(t('compNote'))}</p></section>
      <section class="card"><h4>${esc(t('history'))}</h4>${Q.S.history.length ? Q.S.history.slice(0, 6).map(h => `<div class="kv"><span>${esc(h.name)}</span><b>${Q.n(h.chi, 1)}</b><em class="muted sm">${new Date(h.t).toLocaleDateString(Q.locale())}</em></div>`).join('') : `<p class="muted">${esc(t('histEmpty'))}</p>`}</section>
      <section class="card"><h4>${esc(t('dataQ'))}</h4>${kv(t('dsMap'), esc(Q.mode === 'live' ? 'OpenFreeMap / OSM' : t('srcDemo')), Q.mode === 'live' ? 'OPEN' : 'DEMO')}${kv(t('dsAnalytics'), esc(Q.D.mode === 'osm' ? 'Overpass / OSM' : t('srcDemo')), Q.D.mode === 'osm' ? 'OPEN' : 'DEMO')}${kv(t('kPop'), Q.n(M.popBase), 'VERIFIED')}<p class="muted sm">${esc(t('popSrc'))}</p></section>`;
    }
  };

  /* ============ DIGITAL CITY ============ */
  V.city = {
    sub: 'citySub',
    form: () => `<label class="fld"><span>${esc(t('searchCity'))}</span><input id="cSearch" type="search" placeholder="${esc(t('searchPh'))}"></label><div id="cRes" class="results"></div>
      <h4>${esc(t('filters'))}</h4><div class="chips">${Object.keys(Q.S.facFilter).map(g => `<button class="chip ${Q.S.facFilter[g] ? 'on' : ''}" data-fg="${g}">${esc(t('fg_' + g))}</button>`).join('')}</div>
      ${sel('cSector', ['all', 'center', 'north', 'east', 'west', 'left', 'south'].map(s => [s, t('sec_' + s)]), Q.S.sector, t('district'))}<p class="muted sm">${esc(t('sectorNote'))}</p>
      <p class="hint">${esc(t('cityHint'))}</p>`,
    bind: el => {
      const inp = $('#cSearch', el), out = $('#cRes', el);
      inp.oninput = () => { const r = Q.search(inp.value); out.innerHTML = r.map((x, i) => `<button class="res" data-i="${i}"><b>${esc(x.n)}</b><span>${esc(x.k)}</span></button>`).join('') || (inp.value.length > 1 ? `<p class="muted sm">${esc(t('noResults'))}</p>` : ''); $$('.res', out).forEach(b => b.onclick = () => { const x = r[+b.dataset.i]; Q.map.flyTo({ center: x.ll, zoom: 16.2, pitch: 55, duration: 1400 }); if (x.hit) setTimeout(() => Q.showInfo(x.hit, x.ll), 900); }); };
      $$('[data-fg]', el).forEach(b => b.onclick = () => { Q.S.facFilter[b.dataset.fg] = !Q.S.facFilter[b.dataset.fg]; b.classList.toggle('on'); if (b.dataset.fg === 'residential') Q.S.layers.buildings = Q.S.facFilter.residential; Q.changed(); });
      $('#cSector', el).onchange = e => { Q.S.sector = e.target.value; Q.changed(); };
    },
    results: () => {
      const D = Q.D, counts = {}; for (const f of D.fac) counts[f.cat] = (counts[f.cat] || 0) + 1;
      const lm = D.landmarks.map(l => `<button class="res" data-ll="${l.lng},${l.lat}"><b>${esc(l.key ? t(l.key) : l.name)}</b>${Q.badge(l.status === 'VERIFIED' ? 'VERIFIED' : 'OPEN')}</button>`).join('');
      return `<h4>${esc(t('landmarks'))}</h4><div class="results">${lm}</div>${D.mode === 'demo' ? `<p class="muted sm">${esc(t('lmOffline'))}</p>` : ''}
        <h4>${esc(t('mapped'))} ${Q.badge(D.mode === 'osm' ? 'OPEN' : 'DEMO')}</h4>${hb(['school', 'kinder', 'university', 'hospital', 'clinic', 'park', 'sport', 'transit', 'fire'].map(k => ({ l: t('fc_' + k), v: counts[k] || 0, txt: Q.n(counts[k] || 0), c: Q.FCOL[k] })), Math.max(1, ...Object.values(counts)))}
        ${D.mode === 'osm' ? `<p class="muted sm">${esc(t('osmComplete'))}</p>` : ''}`;
    },
    bindResults: r => $$('[data-ll]', r).forEach(b => b.onclick = () => { const ll = b.dataset.ll.split(',').map(Number); Q.map.flyTo({ center: ll, zoom: 15.5, pitch: 55, duration: 1500 }); })
  };

  /* ============ BUILD SIMULATOR ============ */
  V.build = {
    sub: 'buildSub',
    form: () => `<div class="cat-grid">${GROUPS.map(([g, ts]) => `<div class="cg"><span class="cgl">${esc(t('grp_' + g))}</span>${ts.map(ty => `<button class="ty ${Q.placeType === ty ? 'on' : ''}" data-ty="${ty}" title="${esc(Q.typeName(ty))}"><i style="background:${E.CATALOG[ty].color}"></i>${esc(Q.typeName(ty))}</button>`).join('')}</div>`).join('')}</div>
      <p class="hint" id="placeHint">${esc(Q.placeType ? t('placeHint', { ty: Q.typeName(Q.placeType) }) : t('pickType'))}</p>`,
    bind: el => $$('[data-ty]', el).forEach(b => b.onclick = () => { Q.placeType = Q.placeType === b.dataset.ty ? null : b.dataset.ty; $$('[data-ty]', el).forEach(x => x.classList.toggle('on', x.dataset.ty === Q.placeType)); $('#placeHint', el).textContent = Q.placeType ? t('placeHint', { ty: Q.typeName(Q.placeType) }) : t('pickType'); Q.map.cursor(Q.placeType ? 'crosshair' : ''); }),
    onMapClick: e => {
      if (Q.placeType) { Q.addProposal(Q.placeType, e.lngLat); return true; }
      if (!(e.hit && e.hit.layer === 'proposals')) { if (Q.S.selId) { Q.S.selId = null; Q.changed(); } }
      return false;
    },
    results: () => {
      const p = Q.getSel(), list = Q.S.proposals;
      let h = '';
      if (p) {
        const r = Q.validate(p) || { warn: [], near: {} }, d = r.d || E.derive(p, E.mergeA(Q.S.assumptions), Q.S.unitCosts), c = E.CATALOG[p.type];
        const without = E.compute(Q.scenarioState({ proposals: Q.S.proposals.filter(x => x.id !== p.id) }), Q.D);
        h += `<section class="card edit"><div class="row sb"><h4><i class="sw" style="background:${c.color}"></i>${esc(p.name || Q.typeName(p.type))}</h4>${Q.badge('PROPOSED')}</div>
          <label class="fld"><span>${esc(t('pName'))}</span><input id="eName" value="${esc(p.name)}" maxlength="50" placeholder="${esc(Q.typeName(p.type))}"></label>
          <div class="g2">${num('eW', Math.round(d.w), c.kind === 'line' ? t('pWidth') : t('pW'), 2, 3000, 1, t('m'))}${num('eL', Math.round(d.l), c.kind === 'line' ? t('pLen') : t('pL'), 2, 6000, 1, t('m'))}</div>
          ${c.kind === 'bld' ? rng('eF', d.floors, t('pFloors'), 1, 40, 1, d.floors) : ''}
          ${rng('eR', p.rot || 0, t('pRot'), -180, 180, 5, (p.rot || 0) + '°')}
          <div class="g2">${num('eCap', p.capacity || '', t('pCap') + ' (' + t('u_' + c.capU) + ')', 0, 1e7, 1)}${num('eBud', p.budget ? Math.round(p.budget / 1e6) : '', t('pBudget'), 0, 1e7, 1, t('mn'))}</div>
          <p class="muted sm">${esc(t('autoVals', { cap: Q.n(d.capAuto) + ' ' + t('u_' + c.capU), cost: Q.kzt(d.capexAuto) }))}</p>
          <div class="row wrap"><button class="btn" id="eDup">${esc(t('duplicate'))}</button><button class="btn" id="eFly">${esc(t('flyTo'))}</button><button class="btn dng" id="eDel">${esc(t('remove'))}</button></div>
          <h5>${esc(t('screening'))}</h5>${r.warn.length ? r.warn.map(w => `<div class="warn w-${w.lvl}">${esc(t('w_' + w.k, { n: w.n || '' }))}</div>`).join('') : `<div class="warn w-ok">${esc(t('w_ok'))}</div>`}
          ${r.live && r.live.unknown ? `<p class="muted sm">${esc(t('w_zoom'))}</p>` : ''}<p class="muted sm">${esc(t('screenNote'))}</p>
          <h5>${esc(t('nearbySvc'))} <span class="muted sm">(${esc(t('straight'))})</span></h5><div class="near2">${Object.entries(r.near || {}).map(([k, v]) => `<span>${esc(t('fc_' + (k === 'transit' ? 'transit' : k)))}: <b>${Q.m(v)}</b></span>`).join('')}</div>
          <h5>${esc(t('impact'))} ${Q.badge('MODEL')}</h5>${impactTable(without, Q.M)}</section>`;
      } else h += `<p class="muted">${esc(t('noSel'))}</p>`;
      h += `<section class="card"><h4>${esc(t('proposals'))} (${list.length})</h4>${list.length ? list.map(x => `<button class="res ${x.id === Q.S.selId ? 'on' : ''}" data-pid="${x.id}"><b><i class="sw" style="background:${E.CATALOG[x.type].color}"></i>${esc(x.name || Q.typeName(x.type))}</b><span>${Q.kzt((Q.M.props.find(m => m.id === x.id) || { d: { capex: 0 } }).d.capex)}${x._screen && x._screen.warn.some(w => w.lvl === 'crit') ? ' · ⚠' : ''}</span></button>`).join('') : `<p class="muted">${esc(t('noProps'))}</p>`}</section>`;
      return h;
    },
    bindResults: r => {
      $$('[data-pid]', r).forEach(b => b.onclick = () => { Q.S.selId = b.dataset.pid; Q.changed(); });
      const p = Q.getSel(); if (!p) return;
      const upd = (k, v, final) => { if (final) Q.commit(() => { p[k] = v; }); else { p[k] = v; Q.changed(); } };
      const bindNum = (id, k, mul) => { const i = $('#' + id, r); if (i) i.onchange = () => { const v = i.value === '' ? 0 : +i.value * (mul || 1); upd(k, Number.isFinite(v) ? Math.max(0, v) : 0, true); }; };
      $('#eName', r).onchange = e => upd('name', e.target.value.slice(0, 50), true);
      bindNum('eW', 'w'); bindNum('eL', 'l'); bindNum('eCap', 'capacity'); bindNum('eBud', 'budget', 1e6);
      const rg = (id, k, suf) => { const i = $('#' + id, r); if (!i) return; i.oninput = () => { $('#' + id + 'O', r).textContent = i.value + (suf || ''); p[k] = +i.value; Q.syncMap(); }; i.onchange = () => Q.commit(() => { p[k] = +i.value; }); };
      rg('eF', 'floors'); rg('eR', 'rot', '°');
      $('#eDup', r).onclick = () => { const c = JSON.parse(JSON.stringify(p)); delete c._screen; c.name = (p.name || Q.typeName(p.type)) + ' 2'; const ll = E.toLL(...E.toXY(p.lng, p.lat).map((v, i) => v + (i ? -1 : 1) * (E.derive(p, E.mergeA()).w + 20))); Q.addProposal(p.type, ll, Object.assign(c, { id: undefined })); };
      $('#eFly', r).onclick = () => Q.map.flyTo({ center: [p.lng, p.lat], zoom: 16.5, pitch: 58, duration: 1200 });
      $('#eDel', r).onclick = () => Q.commit(S => { S.proposals = S.proposals.filter(x => x.id !== p.id); S.selId = null; });
    }
  };

  /* ============ TRAFFIC AI ============ */
  V.traffic = {
    sub: 'trafficSub',
    form: () => `${sel('tMode', ['morning', 'evening', 'offpeak'].map(m => [m, t('tm_' + m)]), Q.S.trafficMode, t('tMode'))}
      <label class="chk"><input type="checkbox" id="tTransit" ${Q.S.transitBoost ? 'checked' : ''}> ${esc(t('tTransit'))}</label>
      <div class="row wrap"><button class="btn ${Q.tool === 'close' ? 'on' : ''}" id="tClose">⛔ ${esc(t('tCloseTool'))}</button><button class="btn" id="tRoad">+ ${esc(Q.typeName('road'))}</button><button class="btn" id="tBridge">+ ${esc(Q.typeName('bridge'))}</button><button class="btn" id="tStop">+ ${esc(Q.typeName('bus_stop'))}</button><button class="btn" id="tPlay">${Q.playing ? '❚❚' : '▶'} ${esc(t('playTraffic'))}</button></div>
      <p class="hint">${esc(t('tHint'))}</p>`,
    bind: el => {
      $('#tMode', el).onchange = e => { Q.S.trafficMode = e.target.value; Q._m0k = null; Q.changed(); };
      $('#tTransit', el).onchange = e => Q.commit(S => { S.transitBoost = e.target.checked; });
      $('#tClose', el).onclick = e => { Q.tool = Q.tool === 'close' ? null : 'close'; e.target.classList.toggle('on', Q.tool === 'close'); Q.map.cursor(Q.tool ? 'crosshair' : ''); };
      const go = ty => { Q.placeType = ty; Q.open('build'); Q.map.cursor('crosshair'); };
      $('#tRoad', el).onclick = () => go('road'); $('#tBridge', el).onclick = () => go('bridge'); $('#tStop', el).onclick = () => go('bus_stop');
      $('#tPlay', el).onclick = () => { Q.togglePlay(); Q.refreshView(true); };
    },
    onMapClick: e => {
      if (Q.tool !== 'close') return false;
      const xy = E.toXY(e.lngLat[0], e.lngLat[1]); let best = null, bd = Infinity;
      for (const r of Q.D.roads) { const d = E.distPtLine(xy, r.xy); if (d < bd) { bd = d; best = r; } }
      if (best && bd < Math.max(60, Q.map.mpp() * 14)) Q.commit(S => { const i = S.closures.indexOf(best.id); if (i >= 0) S.closures.splice(i, 1); else S.closures.push(best.id); });
      return true;
    },
    results: () => {
      const M = Q.M, M0 = Q.M0, tr = M.traffic, demoReal = Q.D.mode === 'demo' && Q.mode === 'live';
      return `<section class="card"><h4>${esc(t('tIndex'))} ${Q.badge('SIM')}</h4><div class="big ${tr.index >= 0.9 ? 'crit' : tr.index >= 0.75 ? 'warn' : 'ok'}">${Q.n(tr.index, 3)}</div><div class="muted sm">${esc(t('vsBase'))}: ${Q.delta(tr.index, M0.traffic.index, 3, true)} · ${esc(t('tIndexD'))}</div>
        ${hb([{ l: t('cCrit'), v: tr.critical, txt: tr.critical, c: '#ef4444' }, { l: t('cHigh'), v: tr.high, txt: tr.high, c: '#f97316' }, { l: t('tSegs'), v: tr.segs.length, txt: tr.segs.length, c: '#64748b' }], tr.segs.length)}</section>
        <section class="card"><h4>${esc(t('tBott'))}</h4><table class="tbl"><thead><tr><th>${esc(t('road'))}</th><th>V/C</th><th>${esc(t('tLoad'))}</th></tr></thead><tbody>${tr.bott.map(s => `<tr data-ll="${s.mid[0]},${s.mid[1]}" class="clk"><td>${esc(s.name || t('unnamedRoad'))}${s.bridge ? ' 🌉' : ''}</td><td style="color:${E.congColor(s.vc)}">${Q.n(s.vc, 2)}</td><td>${Q.n(s.load)} / ${Q.n(s.cap)}</td></tr>`).join('')}</tbody></table>
        <p class="muted sm">${esc(t('tClosed'))}: ${Q.S.closures.length}${Q.S.closures.length ? ` <button class="lnk" id="tOpenAll">${esc(t('tOpenAll'))}</button>` : ''}</p></section>
        ${demoReal ? `<p class="warn w-warn">${esc(t('mbDemoAnalytics'))}</p>` : ''}
        <details class="card"><summary>${esc(t('method'))}</summary><p class="sm">${esc(t('tMethod'))}</p></details>`;
    },
    bindResults: r => { $$('tr[data-ll]', r).forEach(tr => tr.onclick = () => Q.map.flyTo({ center: tr.dataset.ll.split(',').map(Number), zoom: 15.6, pitch: 50, duration: 1200 })); const b = $('#tOpenAll', r); if (b) b.onclick = () => Q.commit(S => { S.closures = []; }); }
  };

  /* ============ ECO AI ============ */
  V.eco = {
    sub: 'ecoSub',
    form: () => `<div class="row wrap"><button class="btn ${Q.tool === 'tree' ? 'on' : ''}" id="ecoTree">🌳 ${esc(t('ecoTree'))}</button><button class="btn" id="ecoPark">+ ${esc(Q.typeName('park'))}</button><button class="btn" id="ecoSolar">+ ${esc(Q.typeName('solar'))}</button><button class="btn" id="ecoHeat">${esc(t('ly_heat'))}</button></div><p class="hint">${esc(t('ecoHint'))}</p>`,
    bind: el => {
      $('#ecoTree', el).onclick = e => { Q.tool = Q.tool === 'tree' ? null : 'tree'; e.target.classList.toggle('on', Q.tool === 'tree'); Q.map.cursor(Q.tool ? 'copy' : ''); };
      $('#ecoPark', el).onclick = () => { Q.placeType = 'park'; Q.open('build'); };
      $('#ecoSolar', el).onclick = () => { Q.placeType = 'solar'; Q.open('build'); };
      $('#ecoHeat', el).onclick = () => { Q.ecoHeat = Q.ecoHeat === false; Q.S.layers.heat = Q.ecoHeat; Q.changed(); };
    },
    onMapClick: e => { if (Q.tool !== 'tree') return false; Q.commit(S => { S.trees.push({ lng: +e.lngLat[0].toFixed(6), lat: +e.lngLat[1].toFixed(6), n: 50 }); }); Q.award('tree'); return true; },
    results: () => {
      const M = Q.M, M0 = Q.M0;
      return `<section class="card"><h4>${esc(t('ecoInd'))}</h4><table class="tbl"><thead><tr><th></th><th>${esc(t('baseline'))}</th><th>${esc(t('scenario'))}</th><th>Δ</th></tr></thead><tbody>
        ${dRow(t('greenArea') + ' (' + t('ha') + ')', M0.greenArea / 1e4, M.greenArea / 1e4, 1)}${dRow(t('kGreen') + ' (' + t('m2') + ')', M0.greenPerCap, M.greenPerCap, 2)}
        ${dRow(t('covPark'), M0.cov.park.share * 100, M.cov.park.share * 100, 1, false, ' pp')}${dRow(t('heatIdx'), M0.heat.city * 100, M.heat.city * 100, 1, true)}
        ${dRow(t('co2') , M0.co2, M.co2, 1, true)}${dRow(t('water'), M0.waterDemand, M.waterDemand, 0, true)}${dRow(t('energy'), M0.energy, M.energy, 1, true)}${dRow(t('renew'), M0.renew * 100, M.renew * 100, 2, false, '%')}
        ${dRow(t('trees'), M0.treeCount, M.treeCount)}</tbody></table>
        <p class="muted sm">${Q.badge('EST')} ${esc(t('ecoNote'))}</p></section>
        <section class="card"><h4>${esc(t('greenTarget'))}</h4>${hb([{ l: t('scenario'), v: M.greenPerCap, txt: Q.n(M.greenPerCap, 1) + ' ' + t('m2'), c: 'var(--em)' }, { l: t('benchmark'), v: M.A.greenTarget, txt: Q.n(M.A.greenTarget) + ' ' + t('m2'), c: '#64748b' }], Math.max(M.greenPerCap, M.A.greenTarget) * 1.1)}<p class="muted sm">${esc(t('greenTargetNote'))}</p></section>
        <details class="card"><summary>${esc(t('method'))}</summary><p class="sm">${esc(t('ecoMethod'))}</p></details>`;
    }
  };

  /* ============ DISASTER ============ */
  const DIS = ['flood', 'heat', 'drought', 'fire', 'failure', 'water', 'closure', 'evac'];
  V.disaster = {
    sub: 'disSub',
    form: () => `<div class="warn w-info">${esc(t('disBanner'))}</div>${sel('dType', DIS.map(k => [k, t('dis_' + k)]), Q.S.disaster, t('scenario'))}<div id="dCtl"></div>`,
    bind: el => { const draw = () => { const k = Q.S.disaster, c = $('#dCtl', el); c.innerHTML = k === 'flood' ? rng('dLvl', Q.S.floodLevel, t('dLevel'), 0, 6, 0.25, Q.n(Q.S.floodLevel, 2) + ' ' + t('m')) : k === 'heat' ? rng('dHeat', Q.S.heatC, t('dHeatC'), 1, 8, 0.5, '+' + Q.S.heatC + '°C') : (k === 'drought' || k === 'water') ? rng('dDr', Q.S.drought, t('dDrought'), 0, 60, 5, Q.S.drought + '%') : k === 'failure' ? sel('dFail', ['clinic', 'hospital', 'school', 'kinder', 'fire'].map(x => [x, t('fc_' + x)]), Q.S.failCat, t('dFailCat')) + rng('dFailS', Q.S.failShare * 100, t('dFailShare'), 10, 80, 10, Math.round(Q.S.failShare * 100) + '%') : k === 'closure' ? `<button class="btn" id="dGoTraffic">${esc(t('tCloseTool'))} →</button>` : '';
        const b = (id, f) => { const i = $('#' + id, c); if (i) i.oninput = () => { f(+i.value); Q.changed(); }; };
        b('dLvl', v => { Q.S.floodLevel = v; $('#dLvlO', c).textContent = Q.n(v, 2) + ' ' + t('m'); if (v >= 1) Q.award('flood'); }); b('dHeat', v => { Q.S.heatC = v; $('#dHeatO', c).textContent = '+' + v + '°C'; }); b('dDr', v => { Q.S.drought = v; $('#dDrO', c).textContent = v + '%'; }); b('dFailS', v => { Q.S.failShare = v / 100; $('#dFailSO', c).textContent = v + '%'; });
        const f = $('#dFail', c); if (f) f.onchange = () => { Q.S.failCat = f.value; Q.changed(); };
        const g = $('#dGoTraffic', c); if (g) g.onclick = () => { Q.open('traffic'); Q.tool = 'close'; Q.refreshView(true); };
      }; $('#dType', el).onchange = e => { Q.S.disaster = e.target.value; draw(); Q.changed(); }; draw(); },
    results: () => {
      const M = Q.M, k = Q.S.disaster, A = M.A; let h = '';
      const sev = s => `<span class="sev sev-${s > 0.15 ? 'crit' : s > 0.05 ? 'high' : s > 0.01 ? 'mod' : 'low'}">${esc(t(s > 0.15 ? 'cCrit' : s > 0.05 ? 'cHigh' : s > 0.01 ? 'cMod' : 'cLow'))}</span>`;
      if (k === 'flood') {
        const F = E.flood(Q.D, M.homes, M.props, Q.S.floodLevel, A);
        h = `<section class="card"><h4>${esc(t('dis_flood'))} · +${Q.n(Q.S.floodLevel, 2)} ${esc(t('m'))} ${Q.badge('DEMO')}</h4>${kv(t('dBand'), Q.m(F.band))}${kv(t('dExposed'), Q.n(F.exposed) + ' (' + Q.pct(F.share, 1) + ')', 'EST')}${kv(t('dBld'), Q.D.mode === 'demo' ? Q.n(F.buildings) : esc(t('unavailable')), Q.D.mode === 'demo' ? 'DEMO' : null)}${kv(t('dFac'), Q.n(F.fac.length))}${kv(t('dRoads'), Q.n(F.roads.length))}${kv(t('dProps'), Q.n(F.props.length))}${kv(t('severity'), sev(F.share))}
          ${F.fac.length ? `<ul class="near">${F.fac.slice(0, 8).map(f => `<li>${esc(t('fc_' + f.cat))}: ${esc(f.name)}</li>`).join('')}</ul>` : ''}</section>
          <section class="card"><h4>${esc(t('mitigation'))}</h4><ul class="near"><li>${esc(t('mit1'))}</li><li>${esc(t('mit2'))}</li><li>${esc(t('mit3'))}</li>${F.props.length ? `<li>${esc(t('mit4', { n: F.props.length }))}</li>` : ''}</ul></section>
          <details class="card"><summary>${esc(t('method'))}</summary><p class="sm">${esc(t('floodMethod', { s: Q.n(A.floodSlope * 100, 1) }))}</p></details>`;
      } else if (k === 'heat') {
        const hot = M.heat.cells.filter(c => c.v + Q.S.heatC * 0.04 > 0.62), pop = hot.reduce((s, c) => s + c.pop, 0);
        h = `<section class="card"><h4>${esc(t('dis_heat'))} · +${Q.S.heatC}°C ${Q.badge('EST')}</h4>${kv(t('dHotCells'), Q.n(hot.length) + ' / ' + Q.n(M.heat.cells.length))}${kv(t('dExposed'), Q.n(pop) + ' (' + Q.pct(pop / M.pop, 1) + ')', 'EST')}${kv(t('dVuln'), Q.n(pop * 0.08), 'EST')}${kv(t('severity'), sev(pop / M.pop / 2))}<p class="muted sm">${esc(t('heatNote'))}</p></section>
          <section class="card"><h4>${esc(t('mitigation'))}</h4><ul class="near"><li>${esc(t('mitH1'))}</li><li>${esc(t('mitH2'))}</li><li>${esc(t('mitH3'))}</li></ul></section>`;
        if (!Q.S.layers.heat) { Q.S.layers.heat = true; setTimeout(() => Q.syncMap(), 0); }
      } else if (k === 'drought' || k === 'water') {
        const sup = M.waterSupply * (1 - Q.S.drought / 100), def = Math.max(0, M.waterDemand - sup);
        h = `<section class="card"><h4>${esc(t('dis_' + k))} ${Q.badge('EST')}</h4>${kv(t('water'), Q.n(M.waterDemand) + ' ' + t('m3d'))}${kv(t('dSupply'), Q.n(sup) + ' ' + t('m3d'))}${kv(t('dDeficit'), Q.n(def) + ' ' + t('m3d') + ' (' + Q.pct(def / M.waterDemand, 1) + ')')}${kv(t('dPeople'), Q.n(def * 1000 / A.waterLpcd))}${kv(t('severity'), sev(def / M.waterDemand))}</section>
          <section class="card"><h4>${esc(t('mitigation'))}</h4><ul class="near"><li>${esc(t('mitW1'))}</li><li>${esc(t('mitW2'))}</li><li>${esc(t('mitW3'))}</li></ul></section>`;
      } else if (k === 'fire') {
        h = `<section class="card"><h4>${esc(t('dis_fire'))} ${Q.badge('EST')}</h4>${kv(t('dFireSt'), Q.n(Q.D.fac.filter(f => f.cat === 'fire').length), Q.D.mode === 'osm' ? 'OPEN' : 'DEMO')}${kv(t('dFireCov', { km: Q.n(A.radius.fire / 1000, 1) }), Q.pct(M.cov.fire.share, 1))}${kv(t('dUncov'), Q.n(M.pop * (1 - M.cov.fire.share)))}${kv(t('severity'), sev(1 - M.cov.fire.share))}<p class="muted sm">${esc(t('fireNote'))}</p></section>`;
      } else if (k === 'failure') {
        const cat = Q.S.failCat, all = Q.D.fac.filter(f => f.cat === cat), keep = all.filter((_, i) => (i % Math.max(1, Math.round(1 / Q.S.failShare))) !== 0);
        const svc = cat === 'fire' ? 'fire' : cat === 'school' ? 'school' : cat === 'kinder' ? 'kinder' : 'health';
        const others = cat === 'clinic' ? Q.D.fac.filter(f => f.cat === 'hospital') : cat === 'hospital' ? Q.D.fac.filter(f => f.cat === 'clinic') : [];
        const after = E.coverage(M.homes, keep.concat(others), A.radius[svc === 'health' ? 'clinic' : svc], svc === 'fire' ? 1 : A.detour);
        const before = svc === 'health' ? M.cov.health.share : M.cov[svc].share;
        h = `<section class="card"><h4>${esc(t('dis_failure'))}: ${esc(t('fc_' + cat))} ${Q.badge('SIM')}</h4>${kv(t('dOut'), Q.n(all.length - keep.length) + ' / ' + Q.n(all.length))}${kv(t('dCovBefore'), Q.pct(before, 1))}${kv(t('dCovAfter'), Q.pct(after.share, 1))}${kv(t('dLost'), Q.n(M.pop * Math.max(0, before - after.share)))}${kv(t('severity'), sev(Math.max(0, before - after.share)))}<p class="muted sm">${esc(t('failNote'))}</p></section>`;
      } else if (k === 'closure') {
        h = `<section class="card"><h4>${esc(t('dis_closure'))} ${Q.badge('SIM')}</h4>${kv(t('tClosed'), Q.n(Q.S.closures.length))}${kv(t('tIndex'), Q.n(M.traffic.index, 3) + ' ' + Q.delta(M.traffic.index, Q.M0.traffic.index, 3, true))}${kv(t('cCrit'), Q.n(M.traffic.critical))}</section>`;
      } else if (k === 'evac') {
        const main = Q.D.roads.filter(r => r.cls === 'trunk' || r.cls === 'primary'); const cv = E.coverage(M.homes, [], 0, 1); void cv;
        let ok = 0, tot = 0; for (const hm of M.homes) { tot += hm.w; let b = Infinity; for (const r of main) b = Math.min(b, E.distPtLine(hm.xy, r.xy)); if (b <= 600) ok += hm.w; }
        h = `<section class="card"><h4>${esc(t('dis_evac'))} ${Q.badge('EST')}</h4>${kv(t('dEvac'), Q.pct(ok / tot, 1))}${kv(t('dUncov'), Q.n(tot - ok))}${kv(t('severity'), sev(1 - ok / tot))}<p class="muted sm">${esc(t('evacNote'))}</p></section>`;
      }
      return h;
    }
  };

  /* ============ BUDGET AI ============ */
  V.budget = {
    sub: 'budSub',
    form: () => `<div class="seg wrap">${[1e9, 5e9, 10e9, 50e9].map(b => `<button class="${Q.S.budget === b ? 'on' : ''}" data-b="${b}">${Q.kzt(b)}</button>`).join('')}</div>${num('bCustom', Q.S.budget / 1e9, t('bCustom'), 0, 100000, 0.1, t('bn'))}
      <details class="card"><summary>${esc(t('unitCosts'))} ${Q.badge('EST')}</summary><p class="muted sm">${esc(t('unitNote'))}</p><div class="ucost">${E.TYPES.map(k => `<label><span>${esc(Q.typeName(k))}</span><input type="number" min="0" step="1000" data-uc="${k}" value="${Q.S.unitCosts[k] || E.CATALOG[k].costM2}"><em>${esc(E.CATALOG[k].kind === 'unit' ? t('perUnit') : t('perM2'))}</em></label>`).join('')}</div><button class="lnk" id="ucReset">${esc(t('resetDefaults'))}</button></details>
      <h4>${esc(t('optimiser'))} <span class="st st-RULE">${esc(t('ruleBased'))}</span></h4><p class="muted sm">${esc(t('optNote'))}</p>
      <div class="g2">${['edu', 'health', 'green', 'mobility', 'housing', 'energy', 'resilience'].map(k => rng('ow_' + k, (Q.optW || {})[k] !== undefined ? Q.optW[k] : 1, t('obj_' + k), 0, 3, 0.5, (Q.optW || {})[k] !== undefined ? Q.optW[k] : 1)).join('')}</div>
      <button class="btn pri" id="optRun">${esc(t('optRun'))}</button><div id="optOut"></div>`,
    bind: el => {
      $$('[data-b]', el).forEach(b => b.onclick = () => { Q.S.budget = +b.dataset.b; $$('[data-b]', el).forEach(x => x.classList.toggle('on', x === b)); $('#bCustom', el).value = Q.S.budget / 1e9; Q.award('budget'); Q.changed(); });
      $('#bCustom', el).onchange = e => { const v = +e.target.value; if (Number.isFinite(v) && v >= 0) { Q.S.budget = v * 1e9; Q.changed(); } else e.target.value = Q.S.budget / 1e9; };
      $$('[data-uc]', el).forEach(i => i.onchange = () => { const v = +i.value; if (Number.isFinite(v) && v > 0) Q.S.unitCosts[i.dataset.uc] = v; else { delete Q.S.unitCosts[i.dataset.uc]; i.value = E.CATALOG[i.dataset.uc].costM2; } Q.changed(); });
      $('#ucReset', el).onclick = () => { Q.S.unitCosts = {}; Q.refreshView(true); Q.changed(); };
      Q.optW = Q.optW || {}; $$('input[id^="ow_"]', el).forEach(i => i.oninput = () => { Q.optW[i.id.slice(3)] = +i.value; $('#' + i.id + 'O', el).textContent = i.value; });
      $('#optRun', el).onclick = () => {
        const w = {}; for (const k of ['edu', 'health', 'green', 'mobility', 'housing', 'energy', 'resilience']) w[k] = Q.optW[k] !== undefined ? Q.optW[k] : 1;
        const left = Math.max(0, Q.M.remaining), res = E.optimise(left, w, Q.S.assumptions, Q.S.unitCosts, Q.M); Q.lastOpt = res;
        $('#optOut', el).innerHTML = res.items.length ? `<p class="sm">${esc(t('optFor', { b: Q.kzt(left) }))}</p><table class="tbl"><tbody>${res.items.map(i => `<tr><td>${esc(Q.typeName(i.type))}</td><td>×${i.count}</td><td>${Q.kzt(i.cost)}</td></tr>`).join('')}<tr><td><b>${esc(t('total'))}</b></td><td></td><td><b>${Q.kzt(res.spent)}</b></td></tr></tbody></table><button class="btn" id="optApply">${esc(t('optApply'))}</button><p class="muted sm">${esc(t('optApplyNote'))}</p>` : `<p class="muted">${esc(t('optNone'))}</p>`;
        const ap = $('#optApply', el); if (ap) ap.onclick = () => G.QMayor.applyPlan(res);
      };
    },
    results: () => {
      const M = Q.M, us = M.props.filter(p => !p.future), grp = {};
      for (const p of us) grp[p.d.c.grp] = (grp[p.d.c.grp] || 0) + p.d.capex;
      const mx = Math.max(1, ...Object.values(grp));
      return `<section class="card"><h4>${esc(t('budSummary'))}</h4>${kv(t('budget'), Q.kzt(M.budget))}${kv(t('capex'), Q.kzt(M.capex))}${kv(t('contingency', { p: Q.n(M.A.contingency * 100) }), Q.kzt(M.capexC - M.capex))}${kv(t('remaining'), `<span class="${M.overrun > 0 ? 'crit' : 'ok'}">${Q.kzt(M.remaining)}</span>`)}${M.overrun > 0 ? `<div class="warn w-crit">${esc(t('overrunMsg', { x: Q.kzt(M.overrun) }))}</div>` : ''}
        ${kv(t('opex'), Q.kzt(M.opex) + ' / ' + t('yr'))}${kv(t('lifeCost'), Q.kzt(M.life))}${kv(t('jobs'), Q.n(M.jobs), 'EST')}${kv(t('cJobs'), Q.n(M.cJobs), 'EST')}${kv(t('payroll'), Q.kzt(M.payroll) + ' / ' + t('yr'), 'EST')}</section>
        <section class="card"><h4>${esc(t('allocation'))}</h4>${Object.keys(grp).length ? hb(Object.entries(grp).map(([g, v]) => ({ l: t('grp_' + g), v, txt: Q.kzt(v) })), mx) : `<p class="muted">${esc(t('noProps'))}</p>`}</section>
        <section class="card"><h4>${esc(t('breakdown'))}</h4><table class="tbl"><thead><tr><th>${esc(t('object'))}</th><th>${esc(t('capex'))}</th><th>${esc(t('opex'))}/${esc(t('yr'))}</th><th>${esc(t('lifeYrs'))}</th></tr></thead><tbody>${us.map(p => `<tr><td>${esc(p.name || Q.typeName(p.type))}${p.budget ? ' *' : ''}</td><td>${Q.kzt(p.d.capex)}</td><td>${Q.kzt(p.d.opex)}</td><td>${p.d.life}</td></tr>`).join('') || `<tr><td colspan="4" class="muted">${esc(t('noProps'))}</td></tr>`}</tbody></table><p class="muted sm">${esc(t('budNote'))}</p>
        <button class="btn" id="budCsv">⇩ ${esc(t('dlBudget'))}</button></section>`;
    },
    bindResults: r => { $('#budCsv', r).onclick = () => G.QReports.budgetCsv(); }
  };

  /* ============ CITIZEN VOICE ============ */
  const CC = ['road', 'light', 'waste', 'park', 'school', 'transport', 'infra', 'other'], CS = ['submitted', 'review', 'planned', 'progress', 'resolved'];
  V.citizen = {
    sub: 'citSub',
    form: () => `<div class="warn w-info">${esc(t('cNotOfficial'))}</div>
      <form id="cForm" class="card"><h4>${esc(t('cNew'))}</h4>${sel('cCat', CC.map(c => [c, t('cc_' + c)]), 'road', t('iCategory'))}
        <label class="fld"><span>${esc(t('cText'))}</span><textarea id="cText" maxlength="400" rows="3" required placeholder="${esc(t('cTextPh'))}"></textarea></label>
        <label class="fld"><span>${esc(t('cPhoto'))}</span><input id="cImg" type="file" accept="image/*"></label>
        <div class="row wrap"><button type="button" class="btn ${Q.tool === 'cpick' ? 'on' : ''}" id="cPick">📍 ${esc(t('cPick'))}</button><span id="cLoc" class="muted sm">${Q.cLoc ? Q.cLoc[1].toFixed(5) + ', ' + Q.cLoc[0].toFixed(5) : esc(t('cNoLoc'))}</span></div>
        <p class="muted sm">${esc(t('cPrivacy'))}</p><button class="btn pri" type="submit">${esc(t('submit'))}</button></form>
      <div class="g2">${sel('cfCat', [['all', t('all')]].concat(CC.map(c => [c, t('cc_' + c)])), Q.cf || 'all', t('filter'))}${sel('cfSt', [['all', t('all')]].concat(CS.map(c => [c, t('cs_' + c)])), Q.cfs || 'all', t('cStatus'))}</div>`,
    bind: el => {
      $('#cPick', el).onclick = e => { Q.tool = Q.tool === 'cpick' ? null : 'cpick'; e.target.classList.toggle('on', Q.tool === 'cpick'); Q.map.cursor(Q.tool ? 'crosshair' : ''); };
      $('#cfCat', el).onchange = e => { Q.cf = e.target.value; Q.refreshView(); }; $('#cfSt', el).onchange = e => { Q.cfs = e.target.value; Q.refreshView(); };
      $('#cForm', el).onsubmit = async ev => {
        ev.preventDefault(); const txt = $('#cText', el).value.trim(); if (!txt) return;
        if (!Q.cLoc) { Q.notify(t('cNeedLoc'), 'warn'); return; }
        let img = null; const f = $('#cImg', el).files[0]; if (f) { try { img = await downscale(f, 360); } catch (e) { Q.notify(t('cImgFail'), 'warn'); } }
        const id = 'c' + Date.now().toString(36);
        Q.S.citizen.push({ id, cat: $('#cCat', el).value, text: txt.slice(0, 400), img, lng: Q.cLoc[0], lat: Q.cLoc[1], status: 'submitted', votes: 0, t: Date.now() });
        Q.cLoc = null; Q.tool = null; Q.map.cursor(''); Q.award('report'); Q.notify(t('cThanks'), 'ok'); Q.refreshView(true); Q.changed();
      };
    },
    onMapClick: e => { if (Q.tool !== 'cpick') return false; Q.cLoc = e.lngLat; const l = $('#cLoc'); if (l) l.textContent = e.lngLat[1].toFixed(5) + ', ' + e.lngLat[0].toFixed(5); Q.tool = null; Q.map.cursor(''); $('#cPick') && $('#cPick').classList.remove('on'); Q.map.setData('measure', Q.FC([Q.pt(e.lngLat, {})])); return true; },
    results: () => {
      const voted = Q.S.voted || {}; const L = (Q.S.citizen || []).filter(c => (!Q.cf || Q.cf === 'all' || c.cat === Q.cf) && (!Q.cfs || Q.cfs === 'all' || c.status === Q.cfs)).sort((a, b) => (b.votes || 0) - (a.votes || 0));
      const cl = Q.citizenClusters();
      return `<section class="card"><h4>${esc(t('cClusters'))} <span class="st st-RULE">${esc(t('ruleBased'))}</span></h4>${cl.groups.length ? cl.groups.map(g => `<div class="rec rec-warn"><b>${esc(t('cc_' + g.cat))} × ${g.n}</b><span>${esc(t('cClusterTxt', { v: g.votes }))}</span><button class="lnk" data-ll="${g.ll}">${esc(t('flyTo'))}</button></div>`).join('') : `<p class="muted sm">${esc(t('cNoClusters'))}</p>`}</section>
        <section class="card"><h4>${esc(t('cList'))} (${L.length})</h4>${L.length ? L.map(c => `<div class="issue"><div class="row sb"><b>${esc(t('cc_' + c.cat))}</b><span class="pill" style="background:${Q.STATUSCOL[c.status]}">${esc(t('cs_' + c.status))}</span></div><p>${esc(c.text)}</p>${c.img ? `<img class="thumb" src="${esc(c.img)}" alt="">` : ''}<div class="row sb"><span class="muted sm">${new Date(c.t).toLocaleDateString(Q.locale())}</span><span><button class="btn sm" data-vote="${c.id}" ${voted[c.id] ? 'disabled' : ''}>▲ ${c.votes || 0}</button> <button class="lnk" data-ll="${c.lng},${c.lat}">${esc(t('flyTo'))}</button></span></div>
          ${Q.S.moderator ? `<div class="row wrap">${CS.map(s => `<button class="chip ${c.status === s ? 'on' : ''}" data-st="${c.id}:${s}">${esc(t('cs_' + s))}</button>`).join('')}<button class="lnk dng" data-delc="${c.id}">${esc(t('remove'))}</button></div>` : ''}</div>`).join('') : `<p class="muted">${esc(t('cEmpty'))}</p>`}
        <p class="muted sm">${esc(Q.S.moderator ? t('modOn') : t('modOff'))}</p></section>`;
    },
    bindResults: r => {
      $$('[data-ll]', r).forEach(b => b.onclick = () => Q.map.flyTo({ center: b.dataset.ll.split(',').map(Number), zoom: 16, duration: 1200 }));
      $$('[data-vote]', r).forEach(b => b.onclick = () => { const c = Q.S.citizen.find(x => x.id === b.dataset.vote); Q.S.voted = Q.S.voted || {}; if (!c || Q.S.voted[c.id]) return; c.votes = (c.votes || 0) + 1; Q.S.voted[c.id] = 1; Q.award('vote'); Q.changed(); });
      $$('[data-st]', r).forEach(b => b.onclick = () => { const [id, s] = b.dataset.st.split(':'); const c = Q.S.citizen.find(x => x.id === id); if (c) { c.status = s; Q.changed(); } });
      $$('[data-delc]', r).forEach(b => b.onclick = () => { Q.S.citizen = Q.S.citizen.filter(x => x.id !== b.dataset.delc); Q.changed(); });
    }
  };
  function downscale(file, max) { return new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => { const im = new Image(); im.onload = () => { const k = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', 0.7)); }; im.onerror = rej; im.src = fr.result; }; fr.onerror = rej; fr.readAsDataURL(file); }); }

  /* ============ FUTURE MODE ============ */
  V.future = {
    sub: 'futSub',
    form: () => `<div class="seg">${[2025, 2030, 2040, 2050].map(y => `<button class="${Q.S.futureYear === y ? 'on' : ''}" data-fy="${y}">${y === 2025 ? esc(t('baseline')) : y}</button>`).join('')}</div>
      <div class="strats">${['green', 'economic', 'balanced'].map((s, i) => `<button class="strat ${Q.S.strategy === s ? 'on' : ''}" data-st="${s}"><b>${'ABC'[i]}. ${esc(t('str_' + s))}</b><span>${esc(t('strd_' + s))}</span></button>`).join('')}</div><p class="warn w-info">${esc(t('futNote'))}</p>`,
    bind: el => { $$('[data-fy]', el).forEach(b => b.onclick = () => { Q.S.futureYear = +b.dataset.fy; if (Q.S.futureYear > 2025) Q.award('future'); Q.renderShell(); Q.refreshView(true); Q.changed(); }); $$('[data-st]', el).forEach(b => b.onclick = () => { Q.S.strategy = b.dataset.st; Q.refreshView(true); Q.changed(); }); },
    results: () => {
      const yrs = [2025, 2030, 2040, 2050], st = ['green', 'economic', 'balanced'];
      if (!Q._futCache || Q._futCache.k !== JSON.stringify([Q.S.assumptions, Q.S.proposals.length, Q.D.mode, Q.S.unitCosts])) {
        const res = {}; for (const s of st) res[s] = yrs.map(y => E.compute(Object.assign(Q.scenarioState({ strategy: s, futureYear: y }), { futureProposals: E.futureProposals(s, y) }), Q.D));
        Q._futCache = { k: JSON.stringify([Q.S.assumptions, Q.S.proposals.length, Q.D.mode, Q.S.unitCosts]), res };
      }
      const R = Q._futCache.res, cur = R[Q.S.strategy];
      const chart = (key, f, ttl) => { const W = 340, H = 150, P = 30; const vals = st.flatMap(s => R[s].map(f)); const mn = Math.min(...vals) * 0.97, mx = Math.max(...vals) * 1.03; const x = i => P + i * (W - P - 10) / 3, y = v => H - 22 - (v - mn) / ((mx - mn) || 1) * (H - 40); const col = { green: '#10b981', economic: '#f59e0b', balanced: '#22d3ee' };
        return `<figure class="lc"><figcaption>${esc(ttl)}</figcaption><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(ttl)}">${yrs.map((yy, i) => `<text x="${x(i)}" y="${H - 6}" text-anchor="middle">${yy}</text>`).join('')}<text x="4" y="${y(mx) + 4}">${Q.n(mx, key === 'chi' ? 0 : 2)}</text><text x="4" y="${y(mn) + 4}">${Q.n(mn, key === 'chi' ? 0 : 2)}</text>${st.map(s => `<polyline fill="none" stroke="${col[s]}" stroke-width="${s === Q.S.strategy ? 3 : 1.5}" points="${R[s].map((M, i) => x(i) + ',' + y(f(M))).join(' ')}"/>`).join('')}</svg><div class="lgnd">${st.map(s => `<span><i style="background:${col[s]}"></i>${esc(t('str_' + s))}</span>`).join('')}</div></figure>`; };
      return `<section class="card"><h4>${esc(t('str_' + Q.S.strategy))} ${Q.badge('MODEL')}</h4><div class="scroll"><table class="tbl"><thead><tr><th></th>${yrs.map(y => `<th>${y === 2025 ? esc(t('baseline')) : y}</th>`).join('')}</tr></thead><tbody>
        <tr><td>${esc(t('kPop'))}</td>${cur.map(M => `<td>${Q.n(M.pop / 1000, 0)}k</td>`).join('')}</tr>
        <tr><td>${esc(t('chi'))}</td>${cur.map(M => `<td>${Q.n(M.chi, 1)}</td>`).join('')}</tr>
        <tr><td>${esc(t('kTraffic'))}</td>${cur.map(M => `<td>${Q.n(M.traffic.index, 2)}</td>`).join('')}</tr>
        <tr><td>${esc(t('iSchoolPress'))}</td>${cur.map(M => `<td>${Q.pct(M.school.pressure)}</td>`).join('')}</tr>
        <tr><td>${esc(t('kGreen'))}</td>${cur.map(M => `<td>${Q.n(M.greenPerCap, 1)}</td>`).join('')}</tr>
        <tr><td>${esc(t('jobs'))}</td>${cur.map(M => `<td>${Q.n(M.jobs)}</td>`).join('')}</tr>
        <tr><td>${esc(t('co2'))}</td>${cur.map(M => `<td>${Q.n(M.co2)}</td>`).join('')}</tr>
        <tr><td>${esc(t('futBudget'))}</td>${cur.map(M => `<td>${Q.n(M.futureCapex / 1e9, 0)}</td>`).join('')}</tr>
        <tr><td>${esc(t('futObjects'))}</td>${cur.map(M => `<td>${M.props.filter(p => p.future).length}</td>`).join('')}</tr></tbody></table></div>
        <p class="muted sm">${esc(t('futBudgetNote'))} · ${esc(t('growthNote', { g: Q.n((E.mergeA(Q.S.assumptions).growth[Q.S.strategy]) * 100, 1) }))}</p></section>
        <section class="card">${chart('chi', M => M.chi, t('chi'))}${chart('tr', M => M.traffic.index, t('kTraffic'))}</section>`;
    }
  };

  /* ============ INFRASTRUCTURE ============ */
  const SVC = [['school', 'school', 'school'], ['kinder', 'kinder', 'kindergarten'], ['health', 'clinic', 'clinic'], ['park', 'park', 'park'], ['transit', 'transit', 'bus_stop'], ['sport', 'sport', 'sports'], ['fire', 'fire', null]];
  V.infra = {
    sub: 'infSub',
    form: () => `${sel('iSvc', SVC.map(s => [s[0], t('fc_' + s[1])]), Q.gapSvc || 'school', t('service'))}<p class="hint">${esc(t('infHint'))}</p>`,
    bind: el => { $('#iSvc', el).onchange = e => { Q.gapSvc = e.target.value; Q.changed(); }; },
    results: () => {
      const M = Q.M, svc = Q.gapSvc || 'school', s = SVC.find(x => x[0] === svc), cv = M.cov[svc], A = M.A;
      const rad = A.radius[svc === 'health' ? 'clinic' : svc];
      const site = s[2] ? E.bestSite(M, svc, rad) : null; Q._site = site && { ll: site.ll, type: s[2] };
      const rows = [['school', 'iSchoolDem', M.school], ['kinder', 'iKinder', M.kinder], ['beds', 'iBeds', M.beds], ['clinic', 'iClinic', M.clinic]];
      return `<section class="card"><h4>${esc(t('fc_' + s[1]))} — ${esc(t('accessShare'))} ${Q.badge('EST')}</h4><div class="big">${Q.pct(cv.share, 1)}</div><div class="muted sm">${esc(t('vsBase'))}: ${Q.delta(cv.share * 100, Q.M0.cov[svc].share * 100, 1, false, ' pp')}</div>
        ${kv(t('threshold'), Q.m(rad))}${kv(t('method'), esc(svc === 'fire' ? t('methStraight') : t('methWalk', { k: A.detour })))}${kv(t('uncovPop'), Q.n(cv.uncovered.reduce((a, h) => a + h.w, 0)))}
        ${site ? `<div class="rec rec-info"><b>${esc(t('candSite'))}</b><span>${esc(t('candTxt', { n: Q.n(site.gain), ty: Q.typeName(s[2]) }))}</span><div class="row"><button class="lnk" id="iFly">${esc(t('flyTo'))}</button><button class="btn sm pri" id="iPlace">${esc(t('placeHere'))}</button></div></div>` : `<p class="muted sm">${esc(t('noGap'))}</p>`}</section>
        <section class="card"><h4>${esc(t('capTable'))} ${Q.badge('EST')}</h4><table class="tbl"><thead><tr><th></th><th>${esc(t('demand'))}</th><th>${esc(t('capacity'))}</th><th>%</th></tr></thead><tbody>
        ${rows.map(([k, lbl, o]) => `<tr><td>${esc(t(lbl))}</td><td>${Q.n(o.demand)}</td><td>${Q.n(o.cap)}</td><td class="${o.pressure > 1 ? 'crit' : o.pressure > 0.9 ? 'warn' : 'ok'}">${Q.pct(o.pressure)}</td></tr>`).join('')}
        <tr><td>${esc(t('water'))}</td><td>${Q.n(M.waterDemand)}</td><td>${Q.n(M.waterSupply)}</td><td>${Q.pct(M.waterDemand / M.waterSupply)}</td></tr>
        <tr><td>${esc(t('energy'))}</td><td colspan="3">${Q.n(M.energy, 1)} ${esc(t('gwh'))}</td></tr></tbody></table><p class="muted sm">${esc(t('capNote'))}</p></section>
        <section class="card"><h4>${esc(t('allServices'))}</h4>${hb(SVC.map(x => ({ l: t('fc_' + x[1]), v: M.cov[x[0]].share * 100, txt: Q.pct(M.cov[x[0]].share), c: M.cov[x[0]].share > 0.7 ? 'var(--em)' : M.cov[x[0]].share > 0.4 ? 'var(--am)' : 'var(--rd)' })), 100)}</section>`;
    },
    bindResults: r => { const f = $('#iFly', r), p = $('#iPlace', r); if (f) f.onclick = () => Q.map.flyTo({ center: Q._site.ll, zoom: 15.5, duration: 1200 }); if (p) p.onclick = () => { Q.addProposal(Q._site.type, Q._site.ll); Q.open('build'); }; }
  };

  /* ============ BUSINESS INTELLIGENCE ============ */
  V.biz = {
    sub: 'bizSub',
    form: () => `${sel('bzCat', Object.keys(E.BIZ).map(k => [k, t('bz_' + k)]), Q.bizCat || 'cafe', t('bizCat'))}<p class="hint">${esc(t('bizHint'))}</p><button class="lnk" id="bzClear">${esc(t('clear'))}</button>`,
    bind: el => { $('#bzCat', el).onchange = e => { Q.bizCat = e.target.value; Q.refreshView(); }; $('#bzClear', el).onclick = () => { Q.bizPts = []; Q.map.setData('measure', Q.FC([])); Q.refreshView(); }; },
    onMapClick: e => { Q.bizPts = (Q.bizPts || []).concat([e.lngLat]).slice(-4); Q.map.setData('measure', Q.FC(Q.bizPts.map(p => Q.pt(p, {})))); Q.refreshView(); return true; },
    results: () => {
      const pts = Q.bizPts || [], cat = Q.bizCat || 'cafe';
      if (!pts.length) return `<p class="muted">${esc(t('bizEmpty'))}</p>`;
      const res = pts.map(p => E.bizScore(cat, p[0], p[1], Q.D, Q.M));
      return res.map((r, i) => `<section class="card"><div class="row sb"><h4>${esc(t('cand'))} ${i + 1}</h4><div class="big sm2 ${r.score >= 70 ? 'ok' : r.score >= 45 ? 'warn' : 'crit'}">${r.score}<small>/100</small></div></div>
        ${hb(Object.entries(r.parts).map(([k, [v, w]]) => ({ l: t('bp_' + k) + ' ×' + w, v: v * 100, txt: Q.n(v * 100) })), 100)}
        <div class="near2"><span>${esc(t('bp_residents'))}: <b>${Q.n(r.raw.residents)}</b></span><span>${esc(t('bpRoad'))}: <b>${Q.m(r.raw.roadM)}</b></span><span>${esc(t('bp_transit'))}: <b>${r.raw.stops}</b></span><span>${esc(t('bp_competition'))}: <b>${r.raw.competitors}</b></span><span>${esc(t('bp_institutions'))}: <b>${r.raw.institutions}</b></span></div>
        ${kv(t('bizInvest'), Q.kzt(r.invest), 'EST')}</section>`).join('') + `<p class="muted sm">${Q.badge(Q.D.mode === 'osm' ? 'OPEN' : 'DEMO')} ${esc(t('bizNote'))}</p>`;
    }
  };

  /* ============ AI MAYOR (UI; logic in mayor.js) ============ */
  V.mayor = {
    sub: 'mayorSub',
    form: () => `<div class="warn w-info">${esc(t('mayorNote'))}</div><div class="chips">${[1, 2, 3, 4, 5, 6].map(i => `<button class="chip q" data-q="${i}">${esc(t('mq' + i))}</button>`).join('')}</div>
      <form id="mForm" class="row"><input id="mIn" placeholder="${esc(t('mayorPh'))}" maxlength="300" aria-label="${esc(t('mayorPh'))}"><button class="btn pri">${esc(t('ask'))}</button></form>
      <div class="row sm"><span class="muted">${esc(t('engine'))}:</span><span id="mEng">${esc(t('ruleEngine'))}</span></div><div id="chat"></div>`,
    bind: el => {
      const ask = q => G.QMayor.ask(q, $('#chat', el));
      $$('[data-q]', el).forEach(b => b.onclick = () => ask(t('mq' + b.dataset.q)));
      $('#mForm', el).onsubmit = e => { e.preventDefault(); const v = $('#mIn', el).value.trim(); if (v) { ask(v); $('#mIn', el).value = ''; } };
      G.QMayor.restore($('#chat', el)); G.QMayor.engineLabel($('#mEng', el));
    }
  };

  /* ============ COMPARE ============ */
  V.compare = {
    sub: 'cmpSub',
    form: () => { const opts = [['baseline', t('baseline')], ['current', t('currentSc')], ['y:2030', '2030'], ['y:2040', '2040'], ['y:2050', '2050']].concat(Object.keys(Q.S.saved).map(n => [n, n])); return `<div class="g2">${sel('cmpA', opts, Q.S.compare.a, 'A')}${sel('cmpB', opts, Q.S.compare.b, 'B')}</div><button class="btn ${Q.map2 ? 'on' : ''}" id="cmpSplit">⧉ ${esc(t('splitMap'))}</button><p class="muted sm">${esc(t('splitNote'))}</p>`; },
    bind: el => {
      $('#cmpA', el).onchange = e => { Q.S.compare.a = e.target.value; Q.updateCompare(); Q.refreshView(); };
      $('#cmpB', el).onchange = e => { Q.S.compare.b = e.target.value; Q.updateCompare(); Q.refreshView(); };
      $('#cmpSplit', el).onclick = e => { if (Q.map2) Q.closeCompare(); else Q.openCompare(); e.target.classList.toggle('on', !!Q.map2); };
      Q.award('compare');
    },
    results: () => {
      const A = Q.metricsFor(Q.S.compare.a), B = Q.metricsFor(Q.S.compare.b); Q._cmp = { A, B };
      const pc = (a, b) => a ? Q.n((b - a) / Math.abs(a) * 100, 1) + '%' : '—';
      const rows = [['kPop', M => M.pop, 0], ['chi', M => M.chi, 1], ['kTraffic', M => M.traffic.index, 3, 1], ['covSchool', M => M.school.cov * 100, 1], ['covHealth', M => M.cov.health.share * 100, 1], ['covPark', M => M.cov.park.share * 100, 1], ['covTransit', M => M.cov.transit.share * 100, 1], ['iSchoolPress', M => M.school.pressure * 100, 1, 1], ['kGreen', M => M.greenPerCap, 2], ['heatIdx', M => M.heat.city * 100, 1, 1], ['co2', M => M.co2, 0, 1], ['capexAll', M => (M.capexC + M.futureCapex) / 1e9, 2, 1], ['jobs', M => M.jobs, 0], ['kRisk', M => M.risk, 1, 1], ['dExposedShort', M => M.flood.share * 100, 2, 1]];
      return `<section class="card"><div class="scroll"><table class="tbl"><thead><tr><th></th><th>A</th><th>B</th><th>Δ</th><th>Δ%</th></tr></thead><tbody>${rows.map(([k, f, d, inv]) => `<tr><td>${esc(t(k))}</td><td>${Q.n(f(A), d)}</td><td>${Q.n(f(B), d)}</td><td>${Q.delta(f(B), f(A), d, !!inv)}</td><td>${pc(f(A), f(B))}</td></tr>`).join('')}</tbody></table></div></section>
        <section class="card"><h4>${esc(t('cmpChart'))}</h4>${['transport', 'environment', 'infrastructure', 'access', 'economy', 'resilience'].map(k => `<div class="cmpbar"><span>${esc(t('sc_' + k))}</span><div class="bar ab"><i style="width:${A.scores[k]}%;background:#64748b"></i></div><div class="bar ab"><i style="width:${B.scores[k]}%;background:var(--cy)"></i></div><b>${Q.n(A.scores[k])} → ${Q.n(B.scores[k])}</b></div>`).join('')}<div class="lgnd"><span><i style="background:#64748b"></i>A</span><span><i style="background:var(--cy)"></i>B</span></div></section>
        <button class="btn pri" id="cmpDl">⇩ ${esc(t('dlCompare'))}</button>`;
    },
    bindResults: r => { $('#cmpDl', r).onclick = () => G.QReports.compareReport(); }
  };
  Q.openCompare = () => {
    document.body.classList.add('split'); const host = $('#map2'); host.hidden = false; host.innerHTML = '';
    const v = Q.map.getView();
    Q.map2 = Q.map.kind === 'live' ? new G.LiveMap(host, { style: Q.map.map.getStyle(), theme: Q.S.theme, center: v.center, zoom: v.zoom, pitch: v.pitch, bearing: v.bearing }) : new G.LiteMap(host, { theme: Q.S.theme });
    Q.map2.ready.then(() => { Q.map2.setBase(Q.D); Q.map2.setView(v); Q.updateCompare(); Q.map2.on('move', () => { if (Q.syncing === 1) return; Q.syncing = 2; Q.map.setView(Q.map2.getView()); Q.syncing = 0; }); });
    setTimeout(() => { if (Q.map.map) Q.map.map.resize(); }, 60); Q.updateCompare();
  };
  Q.closeCompare = () => { if (!Q.map2) return; Q.map2.destroy(); Q.map2 = null; document.body.classList.remove('split'); $('#map2').hidden = true; setTimeout(() => { if (Q.map.map) Q.map.map.resize(); }, 60); Q.syncMap(); };
  Q.updateCompare = () => { if (!Q.map2) return; const a = Q.S.compare.a, b = Q.S.compare.b; Q.syncMap(Q.map, Q.metricsFor(b), Q.stateFor(b)); Q.syncMap(Q.map2, Q.metricsFor(a), Q.stateFor(a)); $('#lblA').textContent = 'A · ' + (a === 'baseline' ? t('baseline') : a === 'current' ? t('currentSc') : a.replace('y:', '')); $('#lblB').textContent = 'B · ' + (b === 'baseline' ? t('baseline') : b === 'current' ? t('currentSc') : b.replace('y:', '')); };

  /* ============ REPORTS ============ */
  V.reports = {
    sub: 'repSub',
    form: () => `<div class="rep">${[['repScenario', 'scenarioReport'], ['repBudget', 'budgetCsv'], ['repCompare', 'compareReport'], ['repCitizen', 'citizenCsv'], ['repJson', 'exportJson'], ['repShot', 'screenshot'], ['repMethod', 'methodology']].map(([k, f]) => `<button class="btn" data-rep="${f}"><b>${esc(t(k))}</b><span>${esc(t(k + 'D'))}</span></button>`).join('')}
      <label class="btn file"><b>${esc(t('repImport'))}</b><span>${esc(t('repImportD'))}</span><input type="file" id="impJson" accept="application/json,.json" hidden></label></div><p class="muted sm">${esc(t('repNote'))}</p>
      ${location.protocol === 'file:' ? '' : `<h4>${esc(t('dlTitle'))}</h4><div class="rep">${[['QALA2050.html', 'dlApp', 'text/html'], ['QALA2050_PitchDeck_KZ.pptx', 'dlDeck', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'], ['QALA2050_PitchDeck_KZ.pdf', 'dlPdf', 'application/pdf'], ['QALA2050_project.zip', 'dlZip', 'application/zip']].map(([f, k, m]) => `<button class="btn" data-dl="${f}" data-mime="${m}"><b>⇩ ${esc(t(k))}</b><span>${esc(t(k + 'D'))}</span></button>`).join('')}</div>`}`,
    bind: el => { $$('[data-rep]', el).forEach(b => b.onclick = () => G.QReports[b.dataset.rep]()); $$('[data-dl]', el).forEach(b => b.onclick = async () => { try { const BLOB = { 'QALA2050_PitchDeck_KZ.pptx': '/_blob/e14c1ab61072dabf654e69c2e91ef7d8', 'QALA2050_project.zip': '/_blob/e1493613fb88315c74d2c611a70f2a89' }; let r = await fetch('downloads/' + b.dataset.dl).catch(() => null); if ((!r || !r.ok) && BLOB[b.dataset.dl]) r = await fetch(BLOB[b.dataset.dl]); if (!r || !r.ok) throw new Error('missing'); const blob = new Blob([await r.arrayBuffer()], { type: b.dataset.mime }); await Q.download(b.dataset.dl, blob, b.dataset.mime); } catch (e) { Q.notify(t('dlFail'), 'warn'); } }); $('#impJson', el).onchange = e => { const f = e.target.files[0]; if (f) G.QReports.importJson(f); }; }
  };

  /* ============ SETTINGS & METHODOLOGY ============ */
  const AKEYS = [['popBase', 1, 'people'], ['hhSize', 0.1, ''], ['schoolShare', 0.01, ''], ['preschoolShare', 0.005, ''], ['schoolCapRatio', 0.01, ''], ['kinderCapRatio', 0.01, ''], ['bedNeed', 0.1, '/1000'], ['bedBase', 0.1, '/1000'], ['waterLpcd', 5, 'L'], ['waterSupplyRatio', 0.01, ''], ['elecKwhCap', 50, 'kWh'], ['gridEF', 0.05, 't/MWh'], ['nonElecCO2Cap', 0.1, 't'], ['solarYield', 50, 'kWh/kWp'], ['resVehPerUnit', 0.05, ''], ['jobVehPerJob', 0.05, ''], ['laneCap', 50, 'veh/h'], ['greenTarget', 1, 'm²'], ['treeCanopy', 5, 'm²'], ['detour', 0.05, ''], ['contingency', 0.01, ''], ['floodSlope', 0.0005, 'm/m'], ['wageKZT', 10000, '₸']];
  V.settings = {
    sub: 'setSub',
    form: () => { const A = E.mergeA(Q.S.assumptions); return `
      ${sel('sLang', [['kk', 'Қазақша'], ['ru', 'Русский'], ['en', 'English']], Q.S.lang, t('language'))}${sel('sTheme', [['night', t('night')], ['day', t('day')]], Q.S.theme, t('mapTheme'))}
      <label class="fld"><span>${esc(t('presenter'))}</span><input id="sPres" value="${esc(Q.S.presenter)}" maxlength="60"></label>
      <label class="chk"><input type="checkbox" id="sOff" ${Q.S.forceOffline ? 'checked' : ''}> ${esc(t('forceOffline'))}</label>
      <label class="chk"><input type="checkbox" id="sMod" ${Q.S.moderator ? 'checked' : ''}> ${esc(t('moderator'))}</label>
      <label class="fld"><span>${esc(t('satUrl'))}</span><input id="sSat" value="${esc(Q.S.satUrl)}" placeholder="https://…/{z}/{x}/{y}.jpg"></label><p class="muted sm">${esc(t('satNote'))}</p>
      <div class="row wrap"><button class="btn" id="sRetry">${esc(t('retryLive'))}</button><button class="btn" id="sData">${esc(t('retry'))} OSM</button><button class="btn dng" id="sClear">${esc(t('clearData'))}</button></div>
      <details class="card" id="method" open><summary>${esc(t('methodology'))}</summary><p class="sm">${esc(t('methIntro'))}</p><div class="formulas">${['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10', 'f11'].map(k => `<p><code>${esc(t(k))}</code></p>`).join('')}</div>
        <h5>${esc(t('chiWeights'))}</h5><p class="sm">${Object.entries(E.WEIGHTS).map(([k, w]) => esc(t('sc_' + k)) + ' ' + Math.round(w * 100) + '%').join(' · ')}</p><p class="sm">${esc(t('chiFormula'))}</p><p class="muted sm">${esc(t('chiNotOfficial'))}</p>
        <h5>${esc(t('assumptions'))} ${Q.badge('EST')}</h5><div class="ucost">${AKEYS.map(([k, st, u]) => `<label><span>${esc(t('a_' + k))}</span><input type="number" step="${st}" data-ak="${k}" value="${A[k]}"><em>${esc(u)}</em></label>`).join('')}</div><button class="lnk" id="aReset">${esc(t('resetDefaults'))}</button>
        <h5>${esc(t('statusLegend'))}</h5><div class="stl">${['VERIFIED', 'OPEN', 'EST', 'SIM', 'DEMO', 'UNAVAILABLE'].map(s => `<div>${Q.badge(s)} <span class="sm">${esc(t('st_' + s + '_d'))}</span></div>`).join('')}</div></details>
      <details class="card"><summary>${esc(t('about'))}</summary><p class="sm">${esc(t('aboutTxt'))}</p><p class="sm">© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors (ODbL) · <a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> · <a href="https://maplibre.org" target="_blank" rel="noopener">MapLibre GL JS</a> · <a href="https://overpass-api.de" target="_blank" rel="noopener">Overpass API</a></p></details>`; },
    bind: el => {
      $('#sLang', el).onchange = e => Q.setLang(e.target.value);
      $('#sTheme', el).onchange = e => Q.setTheme(e.target.value);
      $('#sPres', el).onchange = e => { Q.S.presenter = e.target.value.slice(0, 60); Q.save(); };
      $('#sOff', el).onchange = e => { Q.S.forceOffline = e.target.checked; Q.save(); Q.retryLive(); };
      $('#sMod', el).onchange = e => { Q.S.moderator = e.target.checked; Q.save(); };
      $('#sSat', el).onchange = e => { const v = e.target.value.trim(); if (v && !/^https:\/\/.+\{z\}.+\{x\}.+\{y\}/.test(v)) { Q.notify(t('satBad'), 'warn'); return; } Q.S.satUrl = v; Q.save(); if (Q.map.setSatellite(v) === false && v) Q.notify(t('satLite'), 'warn'); };
      $('#sRetry', el).onclick = () => Q.retryLive(); $('#sData', el).onclick = () => Q.retryData();
      $('#sClear', el).onclick = () => Q.confirm(t('confirmClear'), () => { G.QData.clearCache(); Q.resetAll(); });
      $$('[data-ak]', el).forEach(i => i.onchange = () => { const v = +i.value; if (!Number.isFinite(v) || v < 0) { i.value = E.mergeA(Q.S.assumptions)[i.dataset.ak]; return; } Q.S.assumptions[i.dataset.ak] = v; Q._m0k = null; if (i.dataset.ak === 'popBase') { Q.notify(t('popChanged'), 'info'); } Q.changed(); });
      $('#aReset', el).onclick = () => { Q.S.assumptions = {}; Q._m0k = null; Q.refreshView(true); Q.changed(); };
    }
  };
})(window);
