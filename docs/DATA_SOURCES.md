# Data sources and status labels

| Data | Source | Status in app | Licence / note |
|---|---|---|---|
| Base map, building footprints, heights (`render_height`) | OpenStreetMap via OpenFreeMap vector tiles (OpenMapTiles schema), style `https://tiles.openfreemap.org/styles/bright` | OPEN MAP DATA; a height of exactly 5 m (default) is marked ESTIMATED | © OpenStreetMap contributors, ODbL; OpenFreeMap is free with attribution |
| Schools, kindergartens, hospitals, clinics, universities, fire stations, parks, shops, bus stops, residential land use, main roads, Syr Darya | OpenStreetMap via Overpass API (`overpass-api.de`, fallback `overpass.kumi.systems`); one query, cached 7 days in the browser | OPEN MAP DATA | ODbL. Completeness varies: unmapped does not mean absent |
| Place search | OSM Nominatim, on explicit user action only, at most 1 request per second | OPEN MAP DATA | Nominatim usage policy |
| Population baseline 316,800 | Akimat of Kyzylorda, gov.kz ("The city has a population of 316.8 thousand people") | VERIFIED | 2020 census: 242,462 in the city proper (Wikipedia, citing the census) |
| Reference point 44.85278 N, 65.50917 E | Task brief / geodatos.net | VERIFIED | Wikipedia lists 44.85 N 65.5167 E |
| Kyzylorda Airport 44.70694 N, 65.59250 E | Wikipedia (KZO/UAOO) | VERIFIED | — |
| University, railway station, akimat, stadium, mosques | OSM features (names and coordinates) loaded live | OPEN MAP DATA | Not shown offline. Korkyt Ata University address "Aiteke bi 29A" per korkyt.edu.kz |
| All capacities, costs, rates, growth | QALA assumptions (`DEFAULTS` in `js/engine.js`) | ESTIMATED | Editable; not official statistics or procurement prices |
| Traffic loads, vehicles | QALA deterministic model | SIMULATED | Not real-time traffic |
| Offline geometry (buildings, roads, river, facilities named "Demo …") | Generated deterministically in `js/data.js` | DEMONSTRATION | **Schematic, not a survey of Kyzylorda** |
| Competitor facts | esri.com (ArcGIS Urban product pages); hel.fi (Helsinki 3D) | cited on the Business Model page | — |

Satellite imagery is **not** bundled. Users can add a licensed XYZ tile URL in Settings.
