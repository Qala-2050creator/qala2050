/* QALA 2050 — reports & exports (HTML / CSV / JSON / PNG). */
(function (G) {
  'use strict';
  const Q = G.Q, E = G.QEngine, t = (...a) => Q.t(...a), esc = Q.esc;
  const stamp = () => new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
  const csv = rows => '﻿' + rows.map(r => r.map(v => { const s = String(v === undefined || v === null ? '' : v); return /[",;\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(',')).join('\n');
  const doc = (title, body) => `<!DOCTYPE html><html lang="${Q.S.lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>body{font:15px/1.5 Inter,system-ui,sans-serif;max-width:900px;margin:32px auto;padding:0 20px;color:#0f172a}h1{font-size:28px;margin:0 0 4px}h2{font-size:19px;margin-top:28px;border-bottom:1px solid #cbd5e1;padding-bottom:4px}table{border-collapse:collapse;width:100%;font-size:13px}td,th{border-bottom:1px solid #e2e8f0;padding:6px 8px;text-align:left}td:not(:first-child),th:not(:first-child){text-align:right}.tag{display:inline-block;font-size:11px;padding:1px 6px;border-radius:4px;background:#e2e8f0;margin-left:6px}.note{color:#475569;font-size:13px}code{background:#f1f5f9;padding:1px 4px;border-radius:3px}</style></head><body>${body}<p class="note">QALA 2050 · ${esc(t('repFooter'))} · ${new Date().toLocaleString(Q.locale())}</p></body></html>`;
  const tag = s => `<span class="tag">${esc(t('st_' + s))}</span>`;
  function metricRows(M) {
    return [[t('kPop'), Q.n(M.pop), M.pop === M.popBase ? 'VERIFIED' : 'MODEL'], [t('chi'), Q.n(M.chi, 1), 'MODEL'], [t('kTraffic'), Q.n(M.traffic.index, 3), 'SIM'], [t('iSchoolPress'), Q.pct(M.school.pressure, 1), 'EST'], [t('covSchool'), Q.pct(M.school.cov, 1), 'EST'], [t('covHealth'), Q.pct(M.cov.health.share, 1), 'EST'], [t('covPark'), Q.pct(M.cov.park.share, 1), 'EST'], [t('covTransit'), Q.pct(M.cov.transit.share, 1), 'EST'], [t('kGreen'), Q.n(M.greenPerCap, 2) + ' ' + t('m2'), 'EST'], [t('heatIdx'), Q.n(M.heat.city * 100, 1), 'EST'], [t('co2'), Q.n(M.co2), 'EST'], [t('water'), Q.n(M.waterDemand) + ' ' + t('m3d'), 'EST'], [t('energy'), Q.n(M.energy, 1) + ' ' + t('gwh'), 'EST'], [t('capex'), Q.kzt(M.capexC), 'EST'], [t('jobs'), Q.n(M.jobs), 'EST'], [t('kRisk'), Q.n(M.risk, 1), 'MODEL']];
  }
  const R = G.QReports = {
    scenarioReport() {
      const M = Q.M, M0 = Q.M0;
      const body = `<h1>QALA 2050 — ${esc(t('repScenario'))}</h1><p>${esc(t('city'))}: Kyzylorda · ${esc(t('dsMap'))}: ${esc(Q.mode === 'live' ? 'OpenFreeMap / OpenStreetMap' : t('srcDemo'))} ${tag(Q.mode === 'live' ? 'OPEN' : 'DEMO')} · ${esc(t('dsAnalytics'))}: ${esc(Q.D.mode === 'osm' ? 'Overpass / OpenStreetMap' : t('srcDemo'))} ${tag(Q.D.mode === 'osm' ? 'OPEN' : 'DEMO')}</p>
        <p class="note">${esc(t('repDisclaimer'))}</p>
        <h2>${esc(t('cmpBase'))}</h2><table><thead><tr><th></th><th>${esc(t('baseline'))}</th><th>${esc(t('scenario'))}</th><th></th></tr></thead><tbody>${metricRows(M).map((r, i) => `<tr><td>${esc(r[0])}</td><td>${esc(metricRows(M0)[i][1])}</td><td>${esc(r[1])}</td><td>${tag(r[2])}</td></tr>`).join('')}</tbody></table>
        <h2>${esc(t('sc_transport'))} … ${esc(t('sc_resilience'))}</h2><table><tbody>${Object.keys(E.WEIGHTS).map(k => `<tr><td>${esc(t('sc_' + k))} (${Math.round(E.WEIGHTS[k] * 100)}%)</td><td>${Q.n(M0.scores[k], 1)}</td><td>${Q.n(M.scores[k], 1)}</td></tr>`).join('')}</tbody></table>
        <h2>${esc(t('proposals'))} (${M.props.filter(p => !p.future).length})</h2><table><thead><tr><th>${esc(t('object'))}</th><th>${esc(t('iCoords'))}</th><th>${esc(t('pCap'))}</th><th>${esc(t('capex'))}</th><th>${esc(t('screening'))}</th></tr></thead><tbody>${M.props.filter(p => !p.future).map(p => { const s = E.screen(p, Q.D, Q.S.proposals, Q.S.assumptions); return `<tr><td>${esc(p.name || Q.typeName(p.type))}</td><td>${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}</td><td>${Q.n(p.d.cap)} ${esc(t('u_' + p.d.c.capU))}</td><td>${Q.kzt(p.d.capex)}</td><td>${esc(s.warn.length ? s.warn.map(w => t('w_' + w.k, { n: w.n || '' })).join('; ') : t('w_ok'))}</td></tr>`; }).join('')}</tbody></table>
        ${Q.S.futureYear > 2025 ? `<h2>${esc(t('nav_future'))}: ${Q.S.futureYear} · ${esc(t('str_' + Q.S.strategy))}</h2><p>${esc(t('futNote'))}</p><p>${esc(t('futBudget'))}: ${Q.kzt(M.futureCapex)}</p>` : ''}
        <h2>${esc(t('methodology'))}</h2>${['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10', 'f11'].map(k => `<p><code>${esc(t(k))}</code></p>`).join('')}<p>${esc(t('chiFormula'))}</p><p class="note">${esc(t('chiNotOfficial'))}</p>
        <h2>${esc(t('assumptions'))}</h2><table><tbody>${Object.entries(M.A).filter(([, v]) => typeof v !== 'object').map(([k, v]) => `<tr><td>${esc(t('a_' + k) !== 'a_' + k ? t('a_' + k) : k)}</td><td>${esc(v)}</td></tr>`).join('')}</tbody></table>`;
      Q.download('QALA2050_scenario_' + stamp() + '.html', doc('QALA 2050 — ' + t('repScenario'), body), 'text/html');
    },
    budgetCsv() {
      const M = Q.M, rows = [[t('object'), t('iCategory'), 'lat', 'lng', t('pCap'), t('u_' + 'units'), 'GFA_m2', 'capex_KZT', 'opex_KZT_per_year', 'lifetime_years', 'lifecycle_KZT', 'jobs', 'status']];
      for (const p of M.props.filter(x => !x.future)) rows.push([p.name || Q.typeName(p.type), p.type, p.lat, p.lng, Math.round(p.d.cap), t('u_' + p.d.c.capU), Math.round(p.d.gfa), Math.round(p.d.capex), Math.round(p.d.opex), p.d.life, Math.round(p.d.capex + p.d.opex * p.d.life), Math.round(p.d.jobs), p.budget ? 'USER_BUDGET' : 'ESTIMATED']);
      rows.push([], ['budget_KZT', Math.round(M.budget)], ['capex_with_contingency_KZT', Math.round(M.capexC)], ['remaining_KZT', Math.round(M.remaining)], ['note', t('budNote')]);
      Q.download('QALA2050_budget_' + stamp() + '.csv', csv(rows), 'text/csv');
    },
    compareReport() {
      const a = Q.S.compare.a, b = Q.S.compare.b, A = Q.metricsFor(a), B = Q.metricsFor(b), ra = metricRows(A), rb = metricRows(B);
      const body = `<h1>QALA 2050 — ${esc(t('repCompare'))}</h1><p>A: ${esc(a)} · B: ${esc(b)}</p><p class="note">${esc(t('repDisclaimer'))}</p><table><thead><tr><th></th><th>A</th><th>B</th><th></th></tr></thead><tbody>${ra.map((r, i) => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td>${esc(rb[i][1])}</td><td>${tag(r[2])}</td></tr>`).join('')}</tbody></table>
        <h2>${esc(t('chi'))}</h2><table><tbody>${Object.keys(E.WEIGHTS).map(k => `<tr><td>${esc(t('sc_' + k))}</td><td>${Q.n(A.scores[k], 1)}</td><td>${Q.n(B.scores[k], 1)}</td><td>${Q.n(B.scores[k] - A.scores[k], 1)}</td></tr>`).join('')}</tbody></table>`;
      Q.download('QALA2050_compare_' + stamp() + '.html', doc('QALA 2050 — ' + t('repCompare'), body), 'text/html');
    },
    citizenCsv() {
      const rows = [['id', 'category', 'status', 'votes', 'date', 'lat_approx', 'lng_approx', 'text']];
      for (const c of Q.S.citizen || []) rows.push([c.id, c.cat, c.status, c.votes || 0, new Date(c.t).toISOString().slice(0, 10), c.lat.toFixed(3), c.lng.toFixed(3), c.text]);
      Q.download('QALA2050_citizen_anonymised_' + stamp() + '.csv', csv(rows), 'text/csv');
    },
    exportJson() { Q.download('QALA2050_scenario_' + stamp() + '.json', JSON.stringify(Object.assign(Q.scenarioData(), { exported: new Date().toISOString(), app: 'QALA 2050' }), null, 1), 'application/json'); },
    importJson(file) {
      const fr = new FileReader(); fr.onload = () => {
        try {
          const j = JSON.parse(fr.result); if (!j || !Array.isArray(j.proposals)) throw new Error('format');
          const ok = j.proposals.filter(p => E.CATALOG[p.type] && Number.isFinite(+p.lng) && Number.isFinite(+p.lat)).map(p => ({ id: 'p' + (Q.S.seq++), type: p.type, lng: +p.lng, lat: +p.lat, rot: +p.rot || 0, w: +p.w || 0, l: +p.l || 0, floors: +p.floors || 0, capacity: +p.capacity || 0, budget: +p.budget || 0, name: String(p.name || '').slice(0, 50) }));
          Q.commit(S => { S.proposals = ok; S.trees = Array.isArray(j.trees) ? j.trees.filter(x => Number.isFinite(+x.lng)).map(x => ({ lng: +x.lng, lat: +x.lat, n: +x.n || 50 })) : []; S.closures = Array.isArray(j.closures) ? j.closures.map(String) : []; if (+j.budget > 0) S.budget = +j.budget; if ([2025, 2030, 2040, 2050].includes(+j.futureYear)) S.futureYear = +j.futureYear; if (['green', 'economic', 'balanced'].includes(j.strategy)) S.strategy = j.strategy; });
          Q.notify(t('nImported', { n: ok.length }), 'ok');
        } catch (e) { Q.notify(t('nImportFail'), 'warn'); }
      }; fr.readAsText(file);
    },
    screenshot() {
      try {
        const src = Q.map.screenshot(), im = new Image();
        im.onload = () => { const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d'); x.drawImage(im, 0, 0); const s = Math.max(1, im.width / 1400); x.font = `600 ${Math.round(14 * s)}px Inter, sans-serif`; const label = 'QALA 2050 · Kyzylorda · ' + (Q.mode === 'live' ? '© OpenStreetMap contributors, OpenFreeMap' : t('st_DEMO') + ' — ' + t('srcDemo')); const w = x.measureText(label).width; x.fillStyle = 'rgba(7,15,29,.75)'; x.fillRect(10 * s, im.height - 34 * s, w + 20 * s, 26 * s); x.fillStyle = '#e2e8f0'; x.fillText(label, 20 * s, im.height - 16 * s); c.toBlob(b => Q.download('QALA2050_map_' + stamp() + '.png', b, 'image/png'), 'image/png'); };
        im.src = src;
      } catch (e) { Q.notify(t('nShotFail'), 'warn'); }
    },
    methodology() { Q.open('settings'); setTimeout(() => { const m = document.getElementById('method'); if (m) { m.open = true; m.scrollIntoView({ behavior: 'smooth' }); } }, 80); }
  };
})(window);
