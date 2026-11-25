/* QALA 2050 — 10-slide Kazakh pitch deck generator (PptxGenJS).
 * Run from this folder:  node build_deck.js   → QALA2050_PitchDeck_KZ.pptx
 * Use-case numbers are computed live by the same engine the website uses (../js/engine.js). */
const path = require('path');
const pptxgen = require('pptxgenjs');
const React = require('react'), RDS = require('react-dom/server'), sharp = require('sharp');
const Lu = require('react-icons/lu');
require('../js/engine.js'); require('../js/data.js');
const E = globalThis.QEngine, QD = globalThis.QData;

const FOUNDER = process.env.FOUNDER || 'Ернұр Батырхан Төлеухан';   // editable
const SKILL = process.env.PPTX_SKILL || '';
const IMG = f => path.join(__dirname, 'img', f);

// ---- theme ----
const THEME = { name: 'QALA 2050', headFontFace: 'Arial', bodyFontFace: 'Arial', colors: { dk1: '060D1A', lt1: 'FFFFFF', dk2: '0E1A2E', lt2: 'E6EDF7', accent1: '22D3EE', accent2: '10B981', accent3: 'F59E0B', accent4: 'EF4444', accent5: 'A78BFA', accent6: '8EA3C0', hlink: '67E8F9', folHlink: 'A78BFA' } };
const HEX = THEME.colors;

// ---- numbers from the engine (offline demo dataset, same as the web app) ----
const D = QD.demo(316800);
const sc = E.pitchScenario(D, {}, [0, 0]);
const site = E.toXY(sc.res[0].lng, sc.res[0].lat);
const L = [sc.M0, sc.M1, sc.M2].map(M => E.local(M, D, site, 800));
const pct = v => Math.round(v * 100);
const bn = v => (v / 1e9).toFixed(1).replace('.', ',');
const price = { ent: 14990, con: 149990, mun: 12e6, uni: 1.5e6, custom: 4e6 };
const cust = { ent: [20, 120, 400, 900, 1600], con: [2, 10, 30, 60, 100], mun: [0, 1, 3, 7, 12], uni: [1, 3, 6, 10, 14], custom: [0, 2, 5, 9, 14] };
const rev = [0, 1, 2, 3, 4].map(i => cust.ent[i] * price.ent * 12 + cust.con[i] * price.con * 12 + cust.mun[i] * price.mun + cust.uni[i] * price.uni + cust.custom[i] * price.custom);
const mln = v => Math.round(v / 1e6);

async function icon(name, color, size = 256) {
  const svg = RDS.renderToStaticMarkup(React.createElement(Lu[name], { color: '#' + color, size: String(size) }));
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return 'image/png;base64,' + buf.toString('base64');
}

(async () => {
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_16x9';                    // 10 × 5.625 in
  pres.title = 'QALA 2050 — Қаланың цифрлық егізі'; pres.author = FOUNDER; pres.subject = 'Pizza Pitch'; pres.company = 'QALA 2050';
  pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
  const C = pres.SchemeColor;

  pres.defineSlideMaster({
    title: 'QALA_TITLE', background: { color: HEX.dk1 },
    objects: [{ placeholder: { options: { name: 'title', type: 'title', x: 0.6, y: 1.35, w: 5.3, h: 1.45, fontSize: 32, bold: true, color: C.background1, align: 'left', valign: 'top', margin: 0 }, text: '' } }]
  });
  pres.defineSlideMaster({
    title: 'QALA_CLOSE', background: { color: HEX.dk1 },
    objects: [{ placeholder: { options: { name: 'title', type: 'title', x: 0.6, y: 1.55, w: 8.8, h: 0.9, fontSize: 38, bold: true, color: C.background1, align: 'left', valign: 'top', margin: 0 }, text: '' } }]
  });
  pres.defineSlideMaster({
    title: 'QALA_CONTENT', background: { color: HEX.dk1 },
    objects: [
      { placeholder: { options: { name: 'title', type: 'title', x: 0.5, y: 0.32, w: 9.0, h: 0.62, fontSize: 26, bold: true, color: C.background1, align: 'left', valign: 'middle', margin: 0 }, text: '' } },
      { text: { text: 'QALA 2050', options: { x: 0.5, y: 5.22, w: 2.5, h: 0.28, fontSize: 10, bold: true, color: C.accent1, margin: 0 } } }
    ],
    slideNumber: { x: 9.0, y: 5.22, w: 0.5, h: 0.28, fontSize: 10, color: HEX.accent6, align: 'right' }
  });

  const card = (s, x, y, w, h, name, tint) => s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.08, fill: { color: HEX.dk2 }, line: { color: tint || '1F3150', width: 0.75 }, objectName: name });
  const txt = (s, t, o) => s.addText(t, Object.assign({ isTextBox: true, margin: 0, color: C.background2, fontSize: 14, valign: 'top' }, o));
  const caption = (s, t, y) => txt(s, t, { x: 0.5, y: y || 4.92, w: 9, h: 0.26, fontSize: 10, color: C.accent6, italic: true, objectName: 'caption' });

  // ---------- 1. Title ----------
  pres.addSection({ title: 'Ашылу' });
  let s = pres.addSlide({ masterName: 'QALA_TITLE', sectionTitle: 'Ашылу' });
  s.addImage({ path: IMG('hero.png'), x: 3.6, y: 0, w: 6.4, h: 5.625, sizing: { type: 'cover', w: 6.4, h: 5.625 }, objectName: 'hero map', altText: 'QALA 2050 қосымшасындағы Қызылорданың 3D цифрлық егізі (офлайн демо режимі)' });
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 6.2, h: 5.625, fill: { color: HEX.dk1, transparency: 8 }, line: { type: 'none' }, objectName: 'scrim' });
  s.addImage({ data: await icon('LuBuilding2', HEX.accent1), x: 0.6, y: 0.55, w: 0.55, h: 0.55, objectName: 'logo icon' });
  txt(s, [{ text: 'QALA ', options: { color: C.background1 } }, { text: '2050', options: { color: C.accent1 } }], { x: 1.3, y: 0.55, w: 3.5, h: 0.55, fontSize: 26, bold: true, valign: 'middle', objectName: 'logo' });
  s.addText('QALA 2050 — Қаланың цифрлық егізі', { placeholder: 'title' });
  txt(s, '«Қаланың болашағын салмай тұрып көр!»', { x: 0.6, y: 2.95, w: 5.4, h: 0.45, fontSize: 18, bold: true, color: C.accent1, objectName: 'slogan' });
  txt(s, 'Қызылорданың нақты картасындағы құрылыс шешімін ақша жұмсалмай тұрып тексеретін цифрлық егіз.', { x: 0.6, y: 3.5, w: 5.2, h: 0.75, fontSize: 15, color: C.background2, objectName: 'statement' });
  txt(s, FOUNDER, { x: 0.6, y: 4.55, w: 5, h: 0.32, fontSize: 14, bold: true, color: C.background1, objectName: 'founder' });
  txt(s, 'Негізін қалаушы және баяндамашы', { x: 0.6, y: 4.87, w: 5, h: 0.26, fontSize: 11, color: C.accent6, objectName: 'founder role' });
  s.addNotes('Сәлеметсіздер ме! Мен — ' + FOUNDER + '. Бұл — QALA 2050, Қызылорда қаласының цифрлық егізі. Біздің ұранымыз: «Қаланың болашағын салмай тұрып көр!». Яғни, кез келген мектепті, тұрғын үйді немесе жолды салмас бұрын оның қалаға әсерін экранда көріп, тексеруге болады. Слайдтағы карта — қосымшаның шынайы скриншоты (офлайн демо режимі).');

  // ---------- 2. Problem ----------
  pres.addSection({ title: 'Мәселе және шешім' });
  s = pres.addSlide({ masterName: 'QALA_CONTENT', sectionTitle: 'Мәселе және шешім' });
  s.addText('Қала өседі, шешімдер тексерілмейді', { placeholder: 'title' });
  const probs = [['LuCar', 'Көлік кептелісі', 'Жаңа аудандар сапарларды сол бірнеше көпір мен даңғылға қосады'], ['LuSchool', 'Инфрақұрылым жүктемесі', 'Мектеп, балабақша, емхана құрылыстан кеш қалады'], ['LuScale', 'Тең емес қолжетімділік', 'Кей аудандар саябақ пен көліктен алыс'], ['LuLeaf', 'Экология', 'Құрғақ климат, ыстық және су сұранысы'], ['LuBanknote', 'Қымбат қателер', 'Шешімді қаржы жұмсалғанға дейін тексеру қиын']];
  for (let i = 0; i < 5; i++) {
    const x = 0.5 + i * 1.82;
    card(s, x, 1.2, 1.66, 2.55, 'problem card ' + (i + 1));
    s.addShape(pres.shapes.OVAL, { x: x + 0.18, y: 1.38, w: 0.56, h: 0.56, fill: { color: '10304A' }, line: { type: 'none' }, objectName: 'icon bg ' + (i + 1) });
    s.addImage({ data: await icon(probs[i][0], HEX.accent1), x: x + 0.3, y: 1.5, w: 0.32, h: 0.32, objectName: 'icon ' + (i + 1) });
    txt(s, probs[i][1], { x: x + 0.14, y: 2.08, w: 1.42, h: 0.5, fontSize: 12, bold: true, color: C.background1, objectName: 'problem title ' + (i + 1) });
    txt(s, probs[i][2], { x: x + 0.14, y: 2.62, w: 1.42, h: 1.05, fontSize: 11, color: C.background2, objectName: 'problem text ' + (i + 1) });
  }
  txt(s, '316,8 мың', { x: 0.5, y: 4.0, w: 2.4, h: 0.6, fontSize: 34, bold: true, color: C.accent1, objectName: 'stat' });
  txt(s, 'Қызылорда қаласының халқы (бағынысты елді мекендерімен) — Қызылорда қаласы әкімдігі, gov.kz. Мұндай қалаға әр шешімнің әсерін алдын ала көру құралы керек.', { x: 3.0, y: 4.02, w: 6.5, h: 0.75, fontSize: 12, color: C.background2, objectName: 'stat note' });
  s.addNotes('Мәселе. Қала өседі: жаңа тұрғын үйлер салынады, бірақ мектеп, балабақша, емхана және жолдар олармен бірге өспейді. Нәтижесінде кептеліс, толып кеткен мектептер, саябаққа алыс аудандар пайда болады. Ең бастысы — шешімді қаражат жұмсалғанға дейін тексеру қиын. Қызылорданың халқы әкімдік деректері бойынша 316,8 мың. Бұл слайдта дереккөзсіз статистика жоқ.');

  // ---------- 3. Solution ----------
  s = pres.addSlide({ masterName: 'QALA_CONTENT', sectionTitle: 'Мәселе және шешім' });
  s.addText('Шешім: бір сценарийдегі цифрлық егіз', { placeholder: 'title' });
  txt(s, 'QALA 2050 нақты картаны, ашық симуляцияны және AI ұсыныстарын бір ортақ сценарийге біріктіреді. Пайдаланушы жобаны картаға қояды — барлық көрсеткіш бірден қайта есептеледі.', { x: 0.5, y: 1.15, w: 4.1, h: 1.6, fontSize: 15, color: C.background2, objectName: 'solution text' });
  txt(s, 'Әр сан белгіленген: тексерілген, ашық карта, бағаланған, симуляция немесе демо дерек.', { x: 0.5, y: 2.95, w: 4.1, h: 0.8, fontSize: 13, italic: true, color: C.accent1, objectName: 'labels note' });
  const pil = [['LuMap', 'Нақты карта', 'OpenStreetMap ғимараттары, жолдар, Сырдария — 3D'], ['LuCpu', 'Симуляция', 'Мектеп, көлік, экология, бюджет, тәуекел — бір қозғалтқыш'], ['LuSparkles', 'AI ұсыныстар', 'AI Әкім: мәселе → әрекет → әсер → бюджет → тәуекел']];
  for (let i = 0; i < 3; i++) {
    const y = 1.15 + i * 1.22;
    card(s, 5.0, y, 4.5, 1.05, 'pillar ' + (i + 1), i === 0 ? '22D3EE' : '1F3150');
    s.addShape(pres.shapes.OVAL, { x: 5.2, y: y + 0.24, w: 0.58, h: 0.58, fill: { color: '10304A' }, line: { type: 'none' }, objectName: 'pillar icon bg ' + (i + 1) });
    s.addImage({ data: await icon(pil[i][0], HEX.accent1), x: 5.33, y: y + 0.37, w: 0.32, h: 0.32, objectName: 'pillar icon ' + (i + 1) });
    txt(s, pil[i][1], { x: 6.0, y: y + 0.16, w: 3.3, h: 0.35, fontSize: 16, bold: true, color: C.background1, objectName: 'pillar title ' + (i + 1) });
    txt(s, pil[i][2], { x: 6.0, y: y + 0.52, w: 3.3, h: 0.45, fontSize: 12, color: C.background2, objectName: 'pillar text ' + (i + 1) });
  }
  s.addNotes('Шешім — QALA 2050. Бұл тек карта емес. Біз үш нәрсені біріктірдік: нақты географиялық деректер, ашық симуляция қозғалтқышы және AI ұсыныстары. Ең маңыздысы — бәрі бір ортақ сценарийде жұмыс істейді: картадағы өзгеріс диаграммаларға, бюджетке және ұсыныстарға бірден әсер етеді. Әр көрсеткіштің қайдан алынғаны белгіленген.');

  // ---------- 4. Live product ----------
  pres.addSection({ title: 'Өнім' });
  s = pres.addSlide({ masterName: 'QALA_CONTENT', sectionTitle: 'Өнім' });
  s.addText('Тірі өнім: жұмыс істейтін қосымша', { placeholder: 'title' });
  s.addImage({ path: IMG('product.png'), x: 0.5, y: 1.08, w: 6.4, h: 3.6, objectName: 'product screenshot', altText: 'QALA 2050 құрылыс симуляторының шынайы скриншоты' });
  const feats = [['Нақты карта', 'тірі режимде OpenStreetMap / OpenFreeMap'], ['3D ғимараттар', 'табандар биіктікке дейін көтеріледі'], ['Құрылыс басқаруы', '21 нысан түрі, сүйреу, бұру, болдырмау'], ['Талдау тақтасы', 'Қала денсаулығы индексі және KPI']];
  feats.forEach((f, i) => {
    const y = 1.08 + i * 0.92;
    card(s, 7.1, y, 2.4, 0.8, 'feature ' + (i + 1));
    txt(s, f[0], { x: 7.25, y: y + 0.1, w: 2.15, h: 0.3, fontSize: 14, bold: true, color: C.accent1, objectName: 'feature title ' + (i + 1) });
    txt(s, f[1], { x: 7.25, y: y + 0.42, w: 2.15, h: 0.34, fontSize: 10, color: C.background2, objectName: 'feature text ' + (i + 1) });
  });
  caption(s, 'Шынайы скриншот, макет емес. Офлайн демо режимі: схемалық геометрия. Хостингте карта нақты OSM ғимараттарымен ашылады.', 4.8);
  s.addNotes('Бұл — макет емес, жұмыс істейтін қосымшаның шынайы скриншоты. Сол жақта құрылыс симуляторы: 21 түрлі нысан — мектеп, аурухана, тұрғын үй, көпір, күн станциясы. Нысанды картаға қойып, сүйреп, бұрып, қабат санын өзгертуге болады; болдырмау және қайталау бар. Оң жақта — Қала денсаулығы индексі. Скриншот интернетсіз демо режимде түсірілді; хостингте карта OpenStreetMap-тің нақты ғимараттарымен ашылады. Тірі көрсетілімді Питч режимінде жасаймын.');

  // ---------- 5. Technology ----------
  s = pres.addSlide({ masterName: 'QALA_CONTENT', sectionTitle: 'Өнім' });
  s.addText('Негізгі технология', { placeholder: 'title' });
  const flow = [['LuDatabase', 'Географиялық деректер'], ['LuLayers', 'Цифрлық егіз'], ['LuCpu', 'Симуляция қозғалтқышы'], ['LuBrainCircuit', 'AI ұсыныстары'], ['LuLandmark', 'Шешімді қолдау']];
  for (let i = 0; i < 5; i++) {
    const x = 0.5 + i * 1.85;
    card(s, x, 1.15, 1.55, 1.35, 'flow ' + (i + 1), i === 2 ? '22D3EE' : '1F3150');
    s.addImage({ data: await icon(flow[i][0], HEX.accent1), x: x + 0.58, y: 1.3, w: 0.38, h: 0.38, objectName: 'flow icon ' + (i + 1) });
    txt(s, flow[i][1], { x: x + 0.08, y: 1.8, w: 1.39, h: 0.6, fontSize: 12, bold: true, color: C.background1, align: 'center', objectName: 'flow label ' + (i + 1) });
    if (i < 4) txt(s, '→', { x: x + 1.56, y: 1.6, w: 0.28, h: 0.4, fontSize: 18, bold: true, color: C.accent1, align: 'center', objectName: 'arrow ' + (i + 1) });
  }
  const mods = ['Цифрлық қала', 'Құрылыс симуляторы', 'Көлік AI', 'ЭКО AI', 'Апат симуляторы', 'Бюджет AI', 'Азамат үні', 'Болашақ 2030–2050', 'Инфрақұрылым', 'Бизнес талдау', 'AI Әкім', 'Салыстыру'];
  mods.forEach((m, i) => { const x = 0.5 + (i % 4) * 2.27, y = 2.85 + Math.floor(i / 4) * 0.52; s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: 2.12, h: 0.4, rectRadius: 0.06, fill: { color: '0F2236' }, line: { color: '1F3150', width: 0.5 }, objectName: 'module ' + (i + 1) }); txt(s, m, { x: x + 0.12, y: y + 0.06, w: 1.9, h: 0.28, fontSize: 12, color: C.background2, valign: 'middle', objectName: 'module label ' + (i + 1) }); });
  caption(s, 'MapLibre GL JS · OpenFreeMap · OpenStreetMap · Overpass API · детерминистік JS қозғалтқышы · ережелік AI Әкім · KK / RU / EN', 4.55);
  s.addNotes('Архитектура қарапайым және ашық: географиялық деректер — OpenStreetMap, карта — MapLibre мен OpenFreeMap. Олардың үстінде цифрлық егіз, одан кейін детерминистік симуляция қозғалтқышы: барлық формула құжатталған, болжамдарды өзгертуге болады. Соңында AI ұсыныстары мен шешім қабылдауды қолдау. Платформада он екі модуль бар, ақылы API кілтін қажет етпейді, үш тілде жұмыс істейді.');

  // ---------- 6. Use case ----------
  s = pres.addSlide({ masterName: 'QALA_CONTENT', sectionTitle: 'Өнім' });
  s.addText('Қолдану мысалы: болжамды тұрғын үй кешені', { placeholder: 'title' });
  s.addChart(pres.charts.BAR, [
    { name: 'Бастапқы', labels: ['Мектеп жүктемесі', 'Саябаққа қолжетімділік', 'Көлікке қолжетімділік'], values: [pct(L[0].schoolPressure), pct(L[0].park), pct(L[0].transit)] },
    { name: '+ тұрғын үй', labels: ['Мектеп жүктемесі', 'Саябаққа қолжетімділік', 'Көлікке қолжетімділік'], values: [pct(L[1].schoolPressure), pct(L[1].park), pct(L[1].transit)] },
    { name: '+ мектеп, саябақ, аялдама', labels: ['Мектеп жүктемесі', 'Саябаққа қолжетімділік', 'Көлікке қолжетімділік'], values: [pct(L[2].schoolPressure), pct(L[2].park), pct(L[2].transit)] }
  ], { x: 0.5, y: 1.05, w: 6.1, h: 3.6, barDir: 'col', barGrouping: 'clustered', chartColors: [HEX.accent6, HEX.accent3, HEX.accent1], showValue: true, dataLabelPosition: 'outEnd', dataLabelFormatCode: '0"%"', dataLabelColor: HEX.lt2, dataLabelFontSize: 10, dataLabelFontFace: '+mn-lt', showLegend: true, legendPos: 'b', legendColor: HEX.lt2, legendFontSize: 10, legendFontFace: '+mn-lt', catAxisLabelColor: HEX.lt2, catAxisLabelFontSize: 10, catAxisLabelFontFace: '+mn-lt', valAxisHidden: true, valGridLine: { style: 'none' }, catGridLine: { style: 'none' }, showTitle: true, title: '800 м аудан қамтуы, %', titleColor: HEX.lt2, titleFontSize: 12, titleFontFace: '+mn-lt', objectName: 'use case chart' });
  const stats = [['+' + Math.round(sc.M1.pop - sc.M0.pop).toLocaleString('ru-RU'), 'жаңа тұрғын (12 қабат)'], [bn(sc.M1.capexC) + ' млрд ₸', 'тұрғын үй құны (болжам)'], [bn(sc.M2.capexC - sc.M1.capexC) + ' млрд ₸', 'мектеп + саябақ + аялдамалар']];
  stats.forEach((st, i) => { const y = 1.1 + i * 1.18; card(s, 6.9, y, 2.6, 1.02, 'stat card ' + (i + 1)); txt(s, st[0], { x: 7.05, y: y + 0.1, w: 2.35, h: 0.5, fontSize: 24, bold: true, color: i ? C.accent3 : C.accent1, objectName: 'stat value ' + (i + 1) }); txt(s, st[1], { x: 7.05, y: y + 0.62, w: 2.35, h: 0.3, fontSize: 11, color: C.background2, objectName: 'stat label ' + (i + 1) }); });
  caption(s, 'ДЕМО ДЕРЕК: қосымша қозғалтқышы офлайн демо деректерінде есептеген болжамды сценарий; ресми жоба немесе болжам емес.', 4.8);
  s.addNotes(`Нақты мысал. Біз картаға 12 қабатты болжамды тұрғын үй кешенін қоямыз: шамамен ${Math.round(sc.M1.pop - sc.M0.pop)} жаңа тұрғын. 800 метрлік аудандағы мектеп жүктемесі ${pct(L[0].schoolPressure)}%-дан ${pct(L[1].schoolPressure)}%-ға өседі. Енді сол кезеңде мектеп, саябақ және екі аялдама қосамыз: мектеп жүктемесі ${pct(L[2].schoolPressure)}%-ға түседі, саябаққа қолжетімділік ${pct(L[2].park)}%, көлікке қолжетімділік ${pct(L[1].transit)}%-дан ${pct(L[2].transit)}%-ға дейін өседі. Бұл сандарды қосымшаның өз қозғалтқышы есептеді; бұл демонстрациялық сценарий.`);

  // ---------- 7. Market ----------
  pres.addSection({ title: 'Бизнес' });
  s = pres.addSlide({ masterName: 'QALA_CONTENT', sectionTitle: 'Бизнес' });
  s.addText('Мақсатты нарық', { placeholder: 'title' });
  const segs = [['LuLandmark', 'Әкімдіктер', 'жоспарлау және азаматтармен байланыс'], ['LuHardHat', 'Девелоперлер мен құрылыс', 'учаскені алдын ала тексеру'], ['LuTrendingUp', 'Инвесторлар', 'жоба әсерін бағалау'], ['LuGraduationCap', 'Университеттер', 'оқу және зерттеу'], ['LuBriefcase', 'Кәсіпкерлер', 'бизнеске орын таңдау']];
  for (let i = 0; i < 5; i++) {
    const x = 0.5 + i * 1.82;
    card(s, x, 1.15, 1.66, 1.75, 'segment ' + (i + 1));
    s.addImage({ data: await icon(segs[i][0], HEX.accent2), x: x + 0.18, y: 1.3, w: 0.4, h: 0.4, objectName: 'segment icon ' + (i + 1) });
    txt(s, segs[i][1], { x: x + 0.14, y: 1.82, w: 1.42, h: 0.5, fontSize: 12, bold: true, color: C.background1, objectName: 'segment title ' + (i + 1) });
    txt(s, segs[i][2], { x: x + 0.18, y: 2.34, w: 1.36, h: 0.5, fontSize: 10, color: C.background2, objectName: 'segment text ' + (i + 1) });
  }
  card(s, 0.5, 3.15, 9.0, 1.45, 'bottom-up');
  txt(s, 'Төменнен-жоғары болжам (5-жыл)', { x: 0.7, y: 3.28, w: 8.6, h: 0.32, fontSize: 14, bold: true, color: C.accent1, objectName: 'bottom-up title' });
  txt(s, `${cust.mun[4]} әкімдік лицензиясы · ${cust.uni[4]} университет · ${cust.con[4]} құрылыс компаниясы · ${cust.ent[4]} кәсіпкер · ${cust.custom[4]} арнайы талдау жобасы. Бірінші нарық — Қызылорда, кейін Қазақстанның басқа қалалары. Нарық көлемі дереккөзсіз статистикамен емес, осы тұтынушы санынан есептеледі.`, { x: 0.7, y: 3.66, w: 8.6, h: 0.85, fontSize: 12, color: C.background2, objectName: 'bottom-up text' });
  caption(s, 'Тұтынушы саны — гипотеза. Әзірге төлейтін клиент, келісімшарт немесе инвестор жоқ.', 4.8);
  s.addNotes('Біздің тұтынушылар — әкімдіктер, девелоперлер мен құрылыс компаниялары, инвесторлар, университеттер және кәсіпкерлер. Бастапқы нарық — Қызылорда, содан кейін Қазақстанның басқа қалалары. Нарықты дереккөзі жоқ үлкен сандармен емес, төменнен-жоғары есептейміз: бесінші жылы, мысалы, 12 әкімдік лицензиясы, 14 университет және т.б. Ашық айтамын: бұл гипотеза, әзірге төлейтін клиентіміз жоқ.');

  // ---------- 8. Business model ----------
  s = pres.addSlide({ masterName: 'QALA_CONTENT', sectionTitle: 'Бизнес' });
  s.addText('Бизнес-модель', { placeholder: 'title' });
  const tiers = [['Азамат', 'тегін'], ['Кәсіпкер PRO', '14 990 ₸ / ай'], ['Құрылыс PRO', '149 990 ₸ / ай'], ['Әкімдік лицензиясы', '5–20 млн ₸ / жыл']];
  tiers.forEach((tr, i) => { const y = 1.1 + i * 0.86; card(s, 0.5, y, 3.3, 0.74, 'tier ' + (i + 1), i === 3 ? '22D3EE' : '1F3150'); txt(s, tr[0], { x: 0.68, y: y + 0.1, w: 3.0, h: 0.28, fontSize: 13, bold: true, color: C.background1, objectName: 'tier name ' + (i + 1) }); txt(s, tr[1], { x: 0.68, y: y + 0.4, w: 3.0, h: 0.28, fontSize: 13, color: C.accent1, objectName: 'tier price ' + (i + 1) }); });
  s.addChart(pres.charts.BAR, [{ name: 'Табыс, млн ₸', labels: ['1-жыл', '2-жыл', '3-жыл', '4-жыл', '5-жыл'], values: rev.map(mln) }], { x: 4.1, y: 1.05, w: 5.4, h: 3.55, barDir: 'col', chartColors: [HEX.accent1], showValue: true, dataLabelPosition: 'outEnd', dataLabelFormatCode: '#,##0', dataLabelColor: HEX.lt2, dataLabelFontSize: 11, dataLabelFontFace: '+mn-lt', showLegend: false, catAxisLabelColor: HEX.lt2, catAxisLabelFontSize: 11, catAxisLabelFontFace: '+mn-lt', valAxisHidden: true, valGridLine: { style: 'none' }, catGridLine: { style: 'none' }, showTitle: true, title: 'Мысал табыс сценарийі, млн ₸', titleColor: HEX.lt2, titleFontSize: 12, titleFontFace: '+mn-lt', objectName: 'revenue chart' });
  caption(s, 'Тек мысал: гипотеза бойынша тұтынушы саны × өзгертілетін баға (университет 1,5 млн ₸/жыл, арнайы талдау 4 млн ₸/жоба). Нақты сату емес.', 4.8);
  s.addNotes(`Бизнес-модель: азаматтарға тегін, кәсіпкерлерге айына 14 990 теңге, құрылыс компанияларына айына 149 990 теңге, әкімдікке жылына 5–20 миллион теңгелік лицензия. Сондай-ақ университет лицензиясы және арнайы талдау. Диаграмма — мысал сценарийі: бесінші жылы шамамен ${mln(rev[4])} миллион теңге. Бұл гипотеза; баға мен клиент санын қосымшадағы Бизнес-модель бетінде өзгертуге болады.`);

  // ---------- 9. Advantage & roadmap ----------
  s = pres.addSlide({ masterName: 'QALA_CONTENT', sectionTitle: 'Бизнес' });
  s.addText('Бәсекелік артықшылық және жол картасы', { placeholder: 'title' });
  const adv = [['LuMap', 'Қазақстан қалаларына бейімделу'], ['LuLanguages', 'Қазақ, орыс, ағылшын тілдері'], ['LuBoxes', 'Бір сценарийдегі кешенді симуляция'], ['LuMessageSquare', 'Азаматтардың қатысуы кірістірілген'], ['LuBanknote', 'Ашық деректер, модульдік, қолжетімді']];
  for (let i = 0; i < 5; i++) { const y = 1.1 + i * 0.66; s.addShape(pres.shapes.OVAL, { x: 0.5, y, w: 0.46, h: 0.46, fill: { color: '10304A' }, line: { type: 'none' }, objectName: 'adv icon bg ' + (i + 1) }); s.addImage({ data: await icon(adv[i][0], HEX.accent1), x: 0.6, y: y + 0.1, w: 0.26, h: 0.26, objectName: 'adv icon ' + (i + 1) }); txt(s, adv[i][1], { x: 1.1, y: y + 0.06, w: 3.4, h: 0.36, fontSize: 13, color: C.background1, valign: 'middle', objectName: 'adv text ' + (i + 1) }); }
  const ph = ['MVP — Қызылорда', 'Университет пен сарапшылар тексеруі', 'Әкімдікпен пилот (ұсыныс)', 'Қазақстанның басқа қалалары', 'Орталық Азия', 'Халықаралық локализация'];
  s.addShape(pres.shapes.LINE, { x: 5.05, y: 1.3, w: 0, h: 3.25, line: { color: '2A4468', width: 1.5 }, objectName: 'timeline line' });
  ph.forEach((p, i) => { const y = 1.12 + i * 0.6; s.addShape(pres.shapes.OVAL, { x: 4.92, y: y + 0.08, w: 0.26, h: 0.26, fill: { color: i === 0 ? HEX.accent2 : HEX.dk2 }, line: { color: HEX.accent1, width: 1 }, objectName: 'phase dot ' + (i + 1) }); txt(s, (i + 1) + '-кезең  ' + p, { x: 5.35, y: y + 0.04, w: 4.15, h: 0.34, fontSize: 13, color: i === 0 ? C.accent2 : C.background2, bold: i === 0, valign: 'middle', objectName: 'phase ' + (i + 1) }); });
  caption(s, 'Біз алғашқы цифрлық егіз емеспіз (мыс. Helsinki 3D, Esri ArcGIS Urban бар). Артықшылық — жергілікті баға, тіл, азаматтар және кешенді сценарий.', 4.8);
  s.addNotes('Әлемде цифрлық егіздер бар: Хельсинкидің 3D моделі, Esri ArcGIS Urban. Біз алғашқымыз деп айтпаймыз. Біздің артықшылық — Қазақстан қалаларына бейімделу, қазақ-орыс-ағылшын тілдері, бір сценарийдегі кешенді симуляция, азаматтардың қатысуы және ашық деректерге негізделген қолжетімді баға. Жол картасы: бірінші кезең — дайын MVP, кейін университет пен сарапшылар тексеруі, әкімдікпен пилот, басқа қалалар, Орталық Азия және халықаралық нарық.');

  // ---------- 10. Final ----------
  pres.addSection({ title: 'Қорытынды' });
  s = pres.addSlide({ masterName: 'QALA_CLOSE', sectionTitle: 'Қорытынды' });
  s.addImage({ path: IMG('hero.png'), x: 0, y: 0, w: 10, h: 5.625, sizing: { type: 'cover', w: 10, h: 5.625 }, objectName: 'final map', altText: 'QALA 2050 цифрлық егізі' });
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 5.625, fill: { color: HEX.dk1, transparency: 18 }, line: { type: 'none' }, objectName: 'scrim' });
  s.addText('Ақылды болашақ Қызылорда', { placeholder: 'title' });
  txt(s, 'Ұсыныс: Қызылорда қаласымен пилот жоба. Әкімдікті, университеттерді және инвесторларды бірлесуге шақырамыз.', { x: 0.6, y: 2.65, w: 7.0, h: 0.8, fontSize: 16, color: C.background2, objectName: 'cta' });
  txt(s, '«Біз болашақты болжап қана қоймаймыз. Біз оны жобалаймыз!»', { x: 0.6, y: 3.65, w: 8.6, h: 0.5, fontSize: 20, bold: true, color: C.accent1, objectName: 'final statement' });
  txt(s, [{ text: 'QALA ', options: { color: C.background1, bold: true } }, { text: '2050', options: { color: C.accent1, bold: true } }, { text: '   ·   ' + FOUNDER, options: { color: C.background2 } }], { x: 0.6, y: 4.6, w: 8.6, h: 0.4, fontSize: 15, objectName: 'sign-off' });
  s.addNotes('Біздің көзқарасымыз — әр шешім алдын ала тексерілетін ақылды Қызылорда. Біз Қызылорда қаласымен пилот жобаны ұсынамыз және әкімдікті, университеттерді, инвесторларды бірлесуге шақырамыз. Біз болашақты болжап қана қоймаймыз. Біз оны жобалаймыз! Рақмет!');

  const out = path.join(__dirname, 'QALA2050_PitchDeck_KZ.pptx');
  await pres.writeFile({ fileName: out });
  if (SKILL) { const { applyTheme } = require(path.join(SKILL, 'scripts/apply_theme.js')); await applyTheme(out, THEME); }
  console.log('written', out, 'revenue', rev.map(mln), 'local', L.map(l => [pct(l.schoolPressure), pct(l.park), pct(l.transit)]));
})();
