# Test report — QALA 2050

Date: 26 Nov 2026 · Environment: Linux sandbox **without internet**, Node 22, Google Chrome (headless, via Playwright 1.63).

## What was actually executed

| Check | Command | Result |
|---|---|---|
| Engine, data and i18n unit tests | `node --test tests/engine.test.cjs` | **23 / 23 pass** |
| JavaScript syntax | `node --check` on every `js/*.js` and `pitch/build_deck.js` | pass |
| TypeScript checkJs (engine, data, i18n) | `tsc --allowJs --checkJs --noEmit --strict false` | **0 errors**, after fixing 2 real findings (an unreachable `stadium` comparison; an array type in the pitch scenario) |
| TypeScript checkJs (UI modules) | same, on all of `js/` | ~600 type diagnostics, almost all TS2339 "property does not exist on Window" from intentional shared globals (`window.Q`, …). These are not runtime errors. Converting to typed modules is on the roadmap |
| Browser smoke test: boot and open all 16 modules | `tests/browser/smoke.mjs` | **0 page errors**. Console shows only the expected blocked network requests (fonts, OpenFreeMap) |
| Browser interaction test | `tests/browser/interact.mjs` | **0 page errors**. See the list below |
| Pitch Mode, 11 steps | `tests/browser/pitch.mjs` | correct objects at every step; user scenario restored on exit |
| Road closure on a visible link | `tests/browser/close.mjs` | closure registered; traffic recalculated |
| Deck | PptxGenJS → `validate.py` → LibreOffice PDF | validation **passed**; PDF has 10 pages; 10 slides each with speaker notes; visual QA done on rendered images |

### Interaction coverage (interact.mjs)
Placing residential, school and park objects by clicking the map, with screening warnings · selecting an object · editing floors · undo and redo · duplicate · delete · dragging an object · traffic simulation playback · planting virtual trees (green per person updates) · flood slider and all 8 disaster scenarios · budget presets · optimiser and "place plan on map" · citizen report with map location, voting and clustering · Future Mode 2050 (15 hypothetical objects, population 441k) · infrastructure gap finder "place here" · business suitability with 2 candidates · AI Mayor with all 6 Kazakh example questions plus one free question (7 structured answers) · split-map comparison · all 6 downloads (scenario HTML, budget CSV, comparison HTML, anonymised citizen CSV, scenario JSON, map PNG) · KK/RU/EN switching · day/night · distance measurement · clicking a building for its info panel · global search · Pitch Mode · 10-slide web presentation with keyboard navigation · mobile (390×844) and tablet (1024×768) layouts captured.

## What could NOT be tested here (be honest on stage)
- **Live mode** (MapLibre + OpenFreeMap tiles + Overpass data) could not be loaded, because the sandbox has no internet. The code follows the documented MapLibre GL JS 4.7 and OpenMapTiles schemas, but it has not been seen running. **Open the deployed site once before the competition** and check that the badge shows "OPEN MAP DATA", that buildings extrude at zoom ≥ 14, and that schools and parks appear after "Loading … (Overpass)".
- **Safari / MacBook**: not tested (Chrome only). The code uses standard APIs (Pointer Events, Canvas 2D, ResizeObserver) supported by current Safari.
- **Claude-backed AI Mayor** (artifact `sample` capability) and artifact downloads were not exercised from the sandbox.
- Real-world accuracy of the model was not tested: it is not calibrated against municipal data, and no such data was available.

## Known limitations
- The offline geometry is schematic. Offline screening conflicts refer to demo buildings, not real ones.
- Accessibility uses straight-line distance × 1.3, not a routed network.
- Live building screening needs the site to be on screen at zoom ≥ 14. Otherwise the app says so.
