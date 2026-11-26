import { chromium } from 'playwright';
const O = '/tmp/qala-shots/', URL = 'http://127.0.0.1:8765/index.html';
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
const errs = []; page.on('pageerror', e => errs.push('PAGEERROR ' + e.message + ' ' + (e.stack || '').split('\n')[1]));
await page.goto(URL);
await page.waitForFunction(() => window.Q && Q.M && document.getElementById('loading').hidden, null, { timeout: 40000 });
await page.waitForTimeout(3000); await page.click('[data-o]').catch(() => {});
await page.addStyleTag({ content: '#toasts{display:none!important}' });
await page.screenshot({ path: O + 'overview.png' });

const box = await page.locator('#map canvas').boundingBox();
await page.evaluate(() => Q.open('build'));
await page.click('[data-ty="residential"]'); await page.mouse.click(box.x + box.width * 0.7, box.y + box.height * 0.45); await page.keyboard.press('Escape');
await page.evaluate(() => { Q.S.selId = Q.S.proposals[0] && Q.S.proposals[0].id; Q.changed(true); }); await page.waitForTimeout(400);
await page.screenshot({ path: O + 'build.png' });
await page.evaluate(() => Q.open('build')); await page.waitForTimeout(200); await page.evaluate(() => { Q.S.selId = null; Q.changed(true); }); await page.waitForTimeout(300); await page.screenshot({ path: O + 'shelf.png' });
for (const v of ['traffic', 'eco', 'disaster', 'budget', 'citizen', 'future', 'infra', 'compare', 'reports', 'model', 'settings', 'city']) { await page.evaluate(v => Q.open(v), v); await page.waitForTimeout(450); await page.screenshot({ path: O + v + '.png' }); }
await page.evaluate(() => Q.open('biz')); await page.mouse.click(box.x + box.width * 0.62, box.y + box.height * 0.4); await page.mouse.click(box.x + box.width * 0.8, box.y + box.height * 0.6); await page.waitForTimeout(300); await page.screenshot({ path: O + 'biz.png' });
await page.evaluate(() => Q.open('mayor')); await page.click('[data-q="1"]'); await page.waitForTimeout(300); await page.screenshot({ path: O + 'mayor.png' });
await page.evaluate(() => Q.open('citizen')); await page.click('#cPick'); await page.mouse.click(box.x + box.width * 0.6, box.y + box.height * 0.5); await page.fill('#cText', 'Көше шамы жанбайды'); await page.click('#cForm button[type=submit]'); await page.waitForTimeout(300); await page.screenshot({ path: O + 'citizen2.png' });
await page.evaluate(() => Q.open('disaster')); await page.click('[data-dis="flood"]'); await page.evaluate(() => { const r = document.getElementById('dLvl'); r.value = 3; r.dispatchEvent(new Event('input')); }); await page.waitForTimeout(300); await page.screenshot({ path: O + 'flood.png' });
// pitch 3 min
await page.evaluate(() => { QPitch.start(3); document.querySelector('[data-p="play"]').click(); });
for (const k of [0, 3, 5, 7, 8, 10]) { await page.evaluate(k => { const cur = document.querySelector('.pstep'); }, k); }
for (let k = 0; k <= 10; k++) { await page.waitForTimeout(k === 2 || k === 4 || k === 6 ? 3600 : 1500); if ([0, 3, 5, 7, 8, 10].includes(k)) await page.screenshot({ path: O + 'pitch' + k + '.png' }); await page.evaluate(() => document.querySelector('[data-p="next"]').click()); }
await page.keyboard.press('Escape');
// dark
await page.click('#uiThemeBtn'); await page.waitForTimeout(400); await page.evaluate(() => Q.open('overview')); await page.waitForTimeout(400); await page.screenshot({ path: O + 'dark.png' }); await page.click('#uiThemeBtn');
// languages
for (const l of ['ru', 'en', 'kk']) { await page.click(`#langSw [data-l="${l}"]`); await page.waitForTimeout(300); await page.screenshot({ path: O + 'lang_' + l + '.png' }); }
// tablet & mobile
await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(500); await page.evaluate(() => Q.open('build')); await page.waitForTimeout(300); await page.screenshot({ path: O + 'tablet.png' });
await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(500); await page.evaluate(() => Q.open('overview')); await page.waitForTimeout(400); await page.screenshot({ path: O + 'mobile.png' });
await page.evaluate(() => Q.open('build')); await page.waitForTimeout(300); await page.screenshot({ path: O + 'mobile_build.png' });
// overflow check: any element in panel/nav/top wider than its parent
const ov = await page.evaluate(() => [...document.querySelectorAll('#top *, #nav *, #panel *, #bottom .bgrp')].filter(e => e.scrollWidth > e.clientWidth + 2 && getComputedStyle(e).overflowX === 'visible' && e.clientWidth > 0 && !['svg','path','rect','circle','g'].includes(e.tagName.toLowerCase())).slice(0, 12).map(e => e.tagName + '.' + e.className + ':' + (e.textContent || '').slice(0, 30)));
console.log('mobile overflow', JSON.stringify(ov));
console.log(errs.length ? errs.join('\n') : 'NO PAGE ERRORS');
await browser.close();
