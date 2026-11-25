import { chromium } from 'playwright';
const url = process.argv[2] || 'http://127.0.0.1:8765/index.html';
const out = process.argv[3] || '/tmp/shots';
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-webgl'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
const errs = [];
page.on('pageerror', e => errs.push('PAGEERROR ' + e.message + '\n' + (e.stack||'').split('\n').slice(0,3).join('\n')));
page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
await page.goto(url);
await page.waitForFunction(() => window.Q && Q.M && document.getElementById('loading').hidden, null, { timeout: 40000 });
await page.waitForTimeout(3200);
const fs = await import('fs'); fs.mkdirSync(out, { recursive: true });
await page.click('[data-o]').catch(()=>{});
await page.screenshot({ path: out + '/01_overview.png' });
const views = ['city','build','traffic','eco','disaster','budget','citizen','future','infra','biz','mayor','compare','reports','model','settings'];
for (const v of views) {
  await page.evaluate(v => Q.open(v), v); await page.waitForTimeout(500);
  await page.screenshot({ path: out + '/v_' + v + '.png' });
}
console.log('mode', await page.evaluate(() => Q.mode), 'D', await page.evaluate(() => Q.D.mode));
console.log(errs.length ? errs.join('\n') : 'NO ERRORS');
await browser.close();
