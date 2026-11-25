import { chromium } from 'playwright';
const out = '/tmp/shots2'; const fs = await import('fs'); fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, acceptDownloads: true });
const errs = []; page.on('pageerror', e => errs.push('PAGEERROR ' + e.message + ' ' + (e.stack||'').split('\n')[1]));
await page.goto('http://127.0.0.1:8765/index.html');
await page.waitForFunction(() => window.Q && Q.M && document.getElementById('loading').hidden, null, { timeout: 40000 });
await page.waitForTimeout(3000); await page.click('[data-o]').catch(()=>{});
const log = async (label, fn) => { try { const r = await page.evaluate(fn); console.log(label, JSON.stringify(r)); } catch (e) { console.log(label, 'ERR', e.message); } };
// Build: choose residential and click on map center
await page.evaluate(() => Q.open('build'));
await page.click('[data-ty="residential"]');
const box = await page.locator('#map canvas').boundingBox();
await page.mouse.click(box.x + box.width * 0.62, box.y + box.height * 0.45);
await page.waitForTimeout(400);
await page.click('[data-ty="school"]'); await page.mouse.click(box.x + box.width * 0.66, box.y + box.height * 0.40); await page.waitForTimeout(300);
await page.click('[data-ty="park"]'); await page.mouse.click(box.x + box.width * 0.58, box.y + box.height * 0.52); await page.waitForTimeout(300);
await page.keyboard.press('Escape');
await log('props', () => Q.S.proposals.map(p => p.type + ':' + (p._screen ? p._screen.warn.map(w=>w.k).join('|') : '')));
await log('chi', () => [Q.M0.chi.toFixed(2), Q.M.chi.toFixed(2), Q.M.capex/1e9]);
await page.evaluate(() => { Q.S.selId = Q.S.proposals[0].id; Q.changed(true); }); await page.waitForTimeout(300);
await page.screenshot({ path: out + '/build_sel.png' });
// edit floors via range
await page.evaluate(() => { const r = document.getElementById('eF'); r.value = 20; r.dispatchEvent(new Event('change')); });
await log('floors', () => Q.S.proposals[0].floors);
// undo/redo
await page.click('#bUndo'); await log('afterUndo floors', () => Q.S.proposals[0].floors); await page.click('#bRedo'); await log('afterRedo', () => Q.S.proposals[0].floors);
// duplicate & delete
await page.click('#eDup'); await log('n after dup', () => Q.S.proposals.length); await page.click('#eDel'); await log('n after del', () => Q.S.proposals.length);
// drag proposal 0
await page.evaluate(() => { Q.S.selId = Q.S.proposals[0].id; Q.changed(true); });
const p0 = await page.evaluate(() => { const p = Q.S.proposals[0]; const xy = QEngine.toXY(p.lng, p.lat); const s = Q.map.proj(xy[0], xy[1], 0); return s; });
await page.mouse.move(box.x + p0[0], box.y + p0[1] - 3); await page.mouse.down(); await page.mouse.move(box.x + p0[0] + 60, box.y + p0[1] + 20, { steps: 6 }); await page.mouse.up();
await log('dragged', () => [Q.S.proposals[0].lng, Q.S.proposals[0].lat]);
// traffic closure
await page.evaluate(() => Q.open('traffic')); await page.click('#tClose');
const rd = await page.evaluate(() => { const r = Q.D.roads.find(r => r.cls === 'primary'); const xy = QEngine.toXY(r.mid[0], r.mid[1]); return Q.map.proj(xy[0], xy[1], 0); });
await page.mouse.click(box.x + rd[0], box.y + rd[1]); await log('closures', () => [Q.S.closures.length, Q.M.traffic.index.toFixed(3)]);
await page.click('#tPlay'); await page.waitForTimeout(900); await page.screenshot({ path: out + '/traffic_play.png' }); await page.evaluate(() => Q.togglePlay(false));
// eco trees
await page.evaluate(() => Q.open('eco')); await page.click('#ecoTree'); await page.mouse.click(box.x + box.width*0.5, box.y + box.height*0.5); await log('trees', () => [Q.S.trees.length, Q.M.treeCount, Q.M.greenPerCap.toFixed(2)]);
await page.screenshot({ path: out + '/eco.png' });
// disaster flood
await page.evaluate(() => Q.open('disaster')); await page.evaluate(() => { const r = document.getElementById('dLvl'); r.value = 4; r.dispatchEvent(new Event('input')); }); await page.waitForTimeout(300);
await page.screenshot({ path: out + '/flood.png' });
for (const k of ['heat','drought','fire','failure','water','closure','evac']) { await page.evaluate(k => { const s = document.getElementById('dType'); s.value = k; s.dispatchEvent(new Event('change')); }, k); await page.waitForTimeout(150); }
// budget optimiser
await page.evaluate(() => Q.open('budget')); await page.click('[data-b="50000000000"]'); await page.click('#optRun'); await page.waitForTimeout(200); await log('opt', () => Q.lastOpt && Q.lastOpt.items.map(i=>i.type+'x'+i.count));
await page.click('#optApply').catch(e=>console.log('noapply')); await page.waitForTimeout(300); await log('after plan', () => [Q.S.proposals.length, Q.M.chi.toFixed(1), Q.M.overrun]);
await page.evaluate(() => Q.open('budget')); await page.screenshot({ path: out + '/budget.png' });
// citizen
await page.evaluate(() => Q.open('citizen')); await page.click('#cPick'); await page.mouse.click(box.x + box.width*0.55, box.y + box.height*0.5);
await page.fill('#cText', 'Шам жанбайды'); await page.click('#cForm button[type=submit]');
for (let i=0;i<3;i++){ await page.evaluate(i => { Q.S.citizen.push({ id: 'cx'+i, cat: 'light', text: 'demo '+i, lng: Q.S.citizen[0].lng + i*0.0005, lat: Q.S.citizen[0].lat, status: 'submitted', votes: 0, t: Date.now() }); Q.changed(true); }, i); }
await page.click('[data-vote]').catch(()=>{}); await log('citizen', () => [Q.S.citizen.length, Q.citizenClusters().groups.length, Q.S.citizen.reduce((a,c)=>a+(c.votes||0),0)]);
await page.screenshot({ path: out + '/citizen.png' });
// future
await page.evaluate(() => Q.open('future')); await page.click('[data-fy="2050"]'); await page.waitForTimeout(400); await page.screenshot({ path: out + '/future.png' }); await log('fut', () => [Q.M.props.filter(p=>p.future).length, Q.M.pop|0]);
await page.click('[data-fy="2025"]');
// infra
await page.evaluate(() => Q.open('infra')); await page.waitForTimeout(200); await page.click('#iPlace').catch(()=>console.log('no iPlace')); await log('infra placed', () => Q.S.proposals.length);
await page.evaluate(() => Q.open('infra')); await page.screenshot({ path: out + '/infra.png' });
// biz
await page.evaluate(() => Q.open('biz')); await page.mouse.click(box.x + box.width*0.55, box.y + box.height*0.45); await page.mouse.click(box.x + box.width*0.75, box.y + box.height*0.6); await page.waitForTimeout(200); await page.screenshot({ path: out + '/biz.png' });
// mayor
await page.evaluate(() => Q.open('mayor')); for (const i of [1,2,3,4,5,6]) { await page.click(`[data-q="${i}"]`); await page.waitForTimeout(250); }
await page.fill('#mIn', 'What should we do?'); await page.click('#mForm button'); await page.waitForTimeout(300);
await log('chat', () => document.querySelectorAll('#chat .msg.ai').length); await page.screenshot({ path: out + '/mayor.png' });
// compare
await page.evaluate(() => Q.open('compare')); await page.click('#cmpSplit'); await page.waitForTimeout(900); await page.screenshot({ path: out + '/compare.png' }); await page.click('#cmpSplit');
// reports downloads
await page.evaluate(() => Q.open('reports'));
for (const r of ['scenarioReport','budgetCsv','compareReport','citizenCsv','exportJson','screenshot']) { const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 5000 }).catch(()=>null), page.click(`[data-rep="${r}"]`)]); console.log('download', r, dl ? dl.suggestedFilename() : 'NONE'); if (dl) await dl.saveAs(out + '/' + dl.suggestedFilename()); }
// language
for (const l of ['ru','en','kk']) { await page.click(`#langSw [data-l="${l}"]`); await page.waitForTimeout(250); await page.evaluate(() => Q.open('overview')); await page.screenshot({ path: out + '/lang_' + l + '.png' }); }
// settings, theme
await page.evaluate(() => Q.open('settings')); await page.click('#tTheme'); await page.waitForTimeout(200); await page.screenshot({ path: out + '/day.png' }); await page.click('#tTheme');
// measure
await page.click('#tMeasure'); await page.mouse.click(box.x+500, box.y+400); await page.mouse.click(box.x+700, box.y+450); await log('measure', () => Q.measureLen().toFixed(0)); await page.click('#tMeasure');
// building click info
await page.evaluate(() => Q.open('city'));
const b = await page.evaluate(() => { const it = Q.map.items.filter(i => i.o).slice(-1)[0]; const r = it.ring; const xy = [(r[0][0]+r[2][0])/2, (r[0][1]+r[2][1])/2]; return Q.map.proj(xy[0], xy[1], it.h); });
await page.mouse.click(box.x + b[0], box.y + b[1]); await page.waitForTimeout(200); await log('info', () => !document.getElementById('info').hidden); await page.screenshot({ path: out + '/info.png' });
// search
await page.fill('#gSearch', 'Demo school'); await page.waitForTimeout(200); await log('search', () => document.querySelectorAll('#gRes .res').length);
// pitch
await page.evaluate(() => G = 0).catch(()=>{});
await page.evaluate(() => QPitch.start(2)); await page.waitForTimeout(1500); await page.screenshot({ path: out + '/pitch0.png' });
for (let k=1;k<=10;k++){ await page.evaluate(() => document.querySelector('[data-p="next"]').click()); await page.waitForTimeout(k===4||k===6?2600:1800); await page.screenshot({ path: out + '/pitch' + k + '.png' }); }
await page.evaluate(() => document.querySelector('[data-p="prev"]').click()); await page.waitForTimeout(1500);
await page.keyboard.press('Escape'); await log('after pitch restore', () => [Q.S.proposals.length, QPitch.isOn()]);
// deck
await page.evaluate(() => QPitch.openDeck()); await page.waitForTimeout(500);
for (let i=0;i<10;i++){ await page.screenshot({ path: out + '/deck' + (i+1) + '.png' }); await page.keyboard.press('ArrowRight'); await page.waitForTimeout(700); }
await page.keyboard.press('Escape');
// mobile
await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(600); await page.evaluate(() => Q.open('build')); await page.waitForTimeout(400); await page.screenshot({ path: out + '/mobile.png' });
await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(400); await page.screenshot({ path: out + '/tablet.png' });
console.log(errs.length ? errs.join('\n') : 'NO PAGE ERRORS');
await browser.close();
