import { chromium } from 'playwright';
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
const errs=[]; page.on('pageerror', e => errs.push(e.message));
await page.goto('http://127.0.0.1:8765/index.html');
await page.waitForFunction(() => window.Q && Q.M && document.getElementById('loading').hidden, null, { timeout: 40000 });
await page.waitForTimeout(3000); await page.click('[data-o]').catch(()=>{});
await page.evaluate(() => { QPitch.start(2); document.querySelector('[data-p="play"]').click(); });
for (let k=0;k<=10;k++){ await page.waitForTimeout(4200); const s = await page.evaluate(() => [document.querySelector('.pstep')?.textContent, document.querySelector('.pcap h3')?.textContent, Q.S.proposals.map(p=>p.type).join(',')]); console.log(JSON.stringify(s)); if (k===4) await page.screenshot({path:'/tmp/shots2/p_res.png'}); if (k===7) await page.screenshot({path:'/tmp/shots2/p_cmp.png'}); if (k===8) await page.screenshot({path:'/tmp/shots2/p_biz.png'}); if (k===9) await page.screenshot({path:'/tmp/shots2/p_end.png'}); await page.evaluate(() => document.querySelector('[data-p="next"]').click()); }
console.log(errs.join('\n')||'no errors'); await browser.close();
