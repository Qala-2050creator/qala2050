/* QALA 2050 — boot & global controls */
(function (G) {
  'use strict';
  const Q = G.Q, t = (...a) => Q.t(...a), $ = Q.$, $$ = Q.$$, esc = Q.esc;
  Q.setLang = l => { Q.S.lang = l; Q.save(); Q.renderShell(); Q.refreshView(true); Q.changed(true); Q.award('lang'); };
  Q.setTheme = th => { Q.S.theme = th; Q.save(); Q.map && Q.map.setTheme(th); Q.map2 && Q.map2.setTheme(th); $('#tTheme').textContent = th === 'night' ? '☾' : '☀'; };
  Q.setUiTheme = u => { Q.S.uiTheme = u; document.documentElement.dataset.ui = u; Q.setTheme(u === 'dark' ? 'night' : 'day'); const b = $('#uiThemeBtn'); if (b) b.textContent = u === 'dark' ? '☀' : '☾'; };
  function topbar() {
    $('#logo').innerHTML = G.QIcons.logo;
    const cities = [['kzo', 'cityKzo', false], ['ast', 'cityAst', true], ['ala', 'cityAla', true], ['shy', 'cityShy', true], ['tur', 'cityTur', true]];
    const cs = $('#citySel'); const fill = () => { cs.innerHTML = cities.map(([v, k, dis]) => `<option value="${v}"${dis ? ' disabled' : ''}>${esc(t(k))}${dis ? ' — ' + esc(t('planned')) : ''}</option>`).join(''); };
    fill(); Q._fillCities = fill;
    $$('#langSw button').forEach(b => b.onclick = () => Q.setLang(b.dataset.l));
    $('#gear').onclick = () => Q.open('settings');
    $('#uiThemeBtn').onclick = () => Q.setUiTheme(Q.S.uiTheme === 'dark' ? 'light' : 'dark');
    $('#profileBtn').onclick = () => Q.open('overview');
    $('#pitchBtn').onclick = () => Q.modal(`<h3>${esc(t('pitchMode'))}</h3><p>${esc(t('pitchIntro'))}</p><div class="row end wrap"><button class="btn" data-m="deck">${esc(t('nav_present'))}</button><button class="btn" data-m="3">▶ 3 ${esc(t('min'))}</button><button class="btn pri" data-m="2">▶ 2 ${esc(t('min'))}</button></div>`, b => b.querySelectorAll('[data-m]').forEach(x => x.onclick = () => { Q.closeModal(); if (x.dataset.m === 'deck') G.QPitch.openDeck(); else G.QPitch.start(+x.dataset.m); }));
    $('#brand').onclick = e => { e.preventDefault(); Q.open('overview'); };
    $('#burger').onclick = () => document.body.classList.toggle('nav-open');
    $('#kpiBtn').onclick = () => { if (G.innerWidth > 1180) document.body.classList.toggle('right-off'); else document.body.classList.toggle('right-open'); setTimeout(() => { if (Q.map && Q.map.map) Q.map.map.resize(); }, 260); };
    $('#dataStatus').onclick = () => { Q.open('settings'); };
    $('#nav').onclick = e => { const b = e.target.closest('.nav-i'); if (b) Q.open(b.dataset.v); };
    const bell = $('#bell'), notes = $('#notes');
    bell.onclick = () => { notes.hidden = !notes.hidden; Q.notes.forEach(n => n.read = true); $('#noteCount').hidden = true; notes.innerHTML = Q.notes.length ? Q.notes.map(n => `<div class="note n-${n.lvl}"><span>${esc(n.msg)}</span><em>${n.t.toLocaleTimeString(Q.locale(), { hour: '2-digit', minute: '2-digit' })}</em></div>`).join('') : `<p class="muted">${esc(t('noNotes'))}</p>`; };
    document.addEventListener('click', e => { if (!notes.hidden && !notes.contains(e.target) && e.target !== bell) notes.hidden = true; const gr = $('#gRes'); if (!gr.hidden && !e.target.closest('.gsearch')) gr.hidden = true; });
    const gs = $('#gSearch'), gr = $('#gRes'); let list = [];
    const show = () => { gr.hidden = !gs.value.trim(); gr.innerHTML = list.map((x, i) => `<button class="res" data-i="${i}"><b>${esc(x.n)}</b><span>${esc(x.k)}</span></button>`).join('') + (Q.mode === 'live' && gs.value.trim().length > 2 ? `<button class="res" id="gNom"><b>🔎 ${esc(t('searchOSM'))}</b><span>Nominatim</span></button>` : '') + (!list.length ? `<p class="muted sm">${esc(t('noResults'))}</p>` : '');
      gr.querySelectorAll('[data-i]').forEach(b => b.onclick = () => { const x = list[+b.dataset.i]; gr.hidden = true; Q.map.flyTo({ center: x.ll, zoom: 16.2, pitch: 55, duration: 1400 }); if (x.sel) { Q.S.selId = x.sel; Q.open('build'); } else if (x.hit) setTimeout(() => Q.showInfo(x.hit, x.ll), 900); });
      const nb = $('#gNom'); if (nb) nb.onclick = async () => { try { list = await Q.nominatim(gs.value.trim()); show(); } catch (e) { Q.notify(t('nNomFail'), 'warn'); } }; };
    gs.oninput = () => { list = Q.search(gs.value); show(); };
    gs.onkeydown = e => { if (e.key === 'Enter' && list[0]) { Q.map.flyTo({ center: list[0].ll, zoom: 16.2, pitch: 55, duration: 1400 }); gr.hidden = true; } };
  }
  function tools() {
    $('#tZin').onclick = () => Q.map.zoomBy(1); $('#tZout').onclick = () => Q.map.zoomBy(-1);
    $('#tNorth').onclick = () => Q.map.resetNorth();
    $('#t3d').onclick = () => { const on = Q.map.getView().pitch < 5; Q.map.set3D(on); $('#t3d').textContent = on ? '2D' : '3D'; };
    let orbit = 0; $('#tOrbit').onclick = e => { if (orbit) { clearInterval(orbit); orbit = 0; e.currentTarget.classList.remove('on'); return; } e.currentTarget.classList.add('on'); orbit = setInterval(() => { const v = Q.map.getView(); Q.map.setView(Object.assign(v, { bearing: v.bearing + 0.35 })); Q.renderCompass(); }, 30); };
    $('#tFull').onclick = () => { try { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); } catch (e) { Q.notify(t('nFsFail'), 'warn'); } };
    $('#tMeasure').onclick = e => { Q.tool = Q.tool === 'measure' ? null : 'measure'; e.currentTarget.classList.toggle('on', Q.tool === 'measure'); if (!Q.tool) Q.measure = []; Q.map.cursor(Q.tool ? 'crosshair' : ''); Q.syncMap(); Q.renderMeasure(); };
    $('#tReset').onclick = () => Q.resetCamera();
    $('#tTheme').onclick = () => Q.setTheme(Q.S.theme === 'night' ? 'day' : 'night');
    $('#tShot').onclick = () => G.QReports.screenshot();
    document.addEventListener('keydown', e => {
      if (G.QPitch.isOn() || !$('#deck').hidden || e.target.matches('input,textarea,select')) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? Q.doRedo() : Q.doUndo(); }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); Q.doRedo(); }
      else if (e.key === 'Escape') { Q.placeType = null; Q.tool = null; Q.map && Q.map.cursor(''); Q.closeModal(); Q.hideInfo(); Q.refreshView(true); }
      else if ((e.key === 'Delete' || e.key === 'Backspace') && Q.S.view === 'build' && Q.getSel()) { const id = Q.S.selId; Q.commit(S => { S.proposals = S.proposals.filter(x => x.id !== id); S.selId = null; }); }
      else if (e.key.toLowerCase() === 'r' && Q.getSel()) { const p = Q.getSel(); Q.commit(() => { p.rot = ((p.rot || 0) + 15 + 180) % 360 - 180; }); }
    });
  }
  function onboarding() {
    if (Q.S.onboarded) return;
    Q.modal(`<div class="onb"><div class="logo-xl sm">${G.QIcons.logo}<span>QALA<b>2050</b></span></div><p class="slogan">«${esc(t('slogan'))}»</p><ol>${[1, 2, 3].map(i => `<li><b>${esc(t('onb' + i + 'h'))}</b> ${esc(t('onb' + i))}</li>`).join('')}</ol><p class="muted sm">${esc(t('onbData'))}</p><div class="row end"><button class="btn pri" data-o>${esc(t('onbGo'))}</button></div></div>`, b => { b.querySelector('[data-o]').onclick = () => { Q.S.onboarded = true; Q.save(); Q.closeModal(); }; });
  }
  async function boot() {
    topbar(); tools(); Q.renderShell(); document.documentElement.dataset.ui = Q.S.uiTheme; Q.setTheme(Q.S.theme); const ub = $('#uiThemeBtn'); if (ub) ub.textContent = Q.S.uiTheme === 'dark' ? '☀' : '☾';
    const re = Q.renderShell; Q.renderShell = () => { re(); Q._fillCities && Q._fillCities(); };
    Q.refreshView(true);
    try { await Q.bootMap(); } catch (e) { console.error(e); Q.setLoading(null); Q.notify('Map error: ' + (e && e.message), 'warn'); }
    Q.open(Q.S.view || 'overview'); onboarding();
    G.addEventListener('resize', () => { Q.renderScale(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})(window);
