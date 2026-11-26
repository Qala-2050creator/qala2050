# QALA 2050 — AI Urban Digital Twin Platform

**«Қаланың болашағын салмай тұрып көр!» · Design Tomorrow. Before Building It.**

🌐 **Live site:** https://qala-2050creator.github.io/qala2050/ · ⬇️ **Download:** green *Code → Download ZIP* button, or `dist/QALA2050.html` (one-file app)

A working web digital twin of **Kyzylorda, Kazakhstan**, designed as the **QALA 2050 Urban Lab**: warm paper, graphite ink, cobalt and terracotta, Golos Text (Kazakh / Russian / English), light and dark themes. It lets you place hypothetical schools, housing, parks, roads, bridges and solar plants on the real city map. A transparent simulation engine then recalculates school load, accessibility, traffic, environment, budget, risk and a City Health Index.

## What runs where

| Mode | When | Map | Analytics data |
|---|---|---|---|
| **Live** | Opened from any web host or local server **with internet** | MapLibre GL JS + OpenFreeMap vector tiles: real OpenStreetMap building footprints, extruded with `render_height` | OpenStreetMap features via Overpass API (schools, clinics, parks, bus stops, main roads, Syr Darya), cached for 7 days |
| **Offline demo** | No internet, or a sandboxed preview that blocks map servers (such as the claude.ai artifact view) | Built-in canvas 2.5D renderer | Bundled **schematic** geometry, labelled DEMONSTRATION DATA everywhere |

The app picks the mode by itself (`Settings → Always use offline demo mode` forces offline). Every module, calculation, report and Pitch Mode step works in both modes.

## Run locally

No build step and no dependencies. It is plain HTML, CSS and JavaScript.

```bash
cd qala2050
python3 -m http.server 8080        # or: npx serve .
# open http://localhost:8080
```

Opening `index.html` directly with a double-click also works. A local server is still recommended, because some browsers restrict `file://` storage.

### Offline competition kit (optional)
To run the **live MapLibre renderer without CDN access**, download `maplibre-gl.js` and `maplibre-gl.css` (v4.7.1, BSD-3-Clause) into `vendor/`. Without internet the tiles are still unavailable, so the app falls back to the offline demo, which needs nothing.

## Deploy (free)

- **GitHub Pages:** push this folder to a repository, then go to Settings → Pages → Deploy from branch → `/ (root)`.
- **Netlify / Cloudflare Pages:** drag and drop this folder. There is no build command and the publish directory is `.`.

After deploying, open the URL. The live map should load and show the badge "OPEN MAP DATA".

## Tests

```bash
node --test tests/engine.test.cjs     # 23 engine/data/i18n tests
```
Browser smoke and interaction tests used during development are described in `docs/TEST_REPORT.md`.

## Pitch deck

`pitch/QALA2050_PitchDeck_KZ.pptx` (editable) and `.pdf` contain 10 slides in Kazakh, with speaker notes. To rebuild them:
```bash
cd pitch && NODE_PATH=$(npm root -g) node build_deck.js    # needs pptxgenjs, react, react-dom, react-icons, sharp
FOUNDER="Your Name" node build_deck.js                     # change presenter name
```
Scripts: `pitch/PITCH_SCRIPTS_KZ.md` (2 and 3 minutes). Jury questions: `pitch/JURY_QA_KZ.md`.

## Structure

```
index.html          shell
css/app.css         design system (midnight navy, cyan, emerald, amber, red)
js/i18n.js          kk (default) / ru / en dictionaries — identical key sets (tested)
js/engine.js        deterministic simulation engine (pure, Node-testable)
js/data.js          Overpass loader + offline demo dataset + verified landmarks
js/map-live.js      MapLibre/OpenFreeMap adapter (3D buildings, screening, picking)
js/map-lite.js      offline canvas 2.5D adapter (same API)
js/core.js          shared scenario state, undo/redo, persistence, map sync, shell
js/views.js         16 module panels
js/mayor.js         AI Mayor (rule-based; optional Claude when hosted as a claude.ai artifact)
js/reports.js       HTML / CSV / JSON / PNG exports
js/pitch.js         Pitch Mode, 10-slide web presentation, business model page
tests/              Node tests
pitch/              deck generator, deck, PDF, scripts, Q&A, screenshots
docs/               methodology, data sources, test report, roadmap
```

## AI and API keys
There is no paid API and no key in the frontend. AI Mayor uses a transparent rule engine by default. When the page runs as a claude.ai artifact with the `sample` capability, the user can switch AI Mayor to Claude. The rule engine's numbers are still passed in as context. To add another LLM, put it behind your own backend and see `.env.example`.

## Honesty rules built into the product
- Every metric carries a status label: VERIFIED, OPEN MAP DATA, ESTIMATED, SIMULATED, DEMONSTRATION or UNAVAILABLE.
- Unknown building attributes show as *unavailable* and are never invented.
- Traffic is simulated, not real-time. The flood module is an educational proxy, not a forecast. Costs are hypothetical, not procurement prices. Revenue figures are hypotheses with no customers.
- AI Mayor never claims municipal authority. Citizen reports are never sent to the akimat.

## Attribution
Map data © OpenStreetMap contributors (ODbL), https://www.openstreetmap.org/copyright · Vector tiles: OpenFreeMap · Renderer: MapLibre GL JS · Data queries: Overpass API · Font: Inter (OFL).
