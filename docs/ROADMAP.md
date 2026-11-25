# Roadmap

| Phase | Goal | Key work |
|---|---|---|
| 1 — MVP (done) | Functional Kyzylorda digital twin | Live OSM 3D map, offline demo, 16 modules, engine and tests, Pitch Mode, deck |
| 2 — Validation | University and local expert review | Feedback from Korkyt Ata University faculty; improve OSM completeness for Kyzylorda (mapathon); calibrate assumptions |
| 3 — Municipal pilot (proposed) | Pilot with the city | Shared backend (PostgreSQL/PostGIS); moderation and official channels for citizen reports; real traffic counts; DEM-based flood with hydrologists |
| 4 — Kazakhstan cities | Multi-city | City configuration files (bbox, population, assumptions); routed network accessibility (OSRM/pgRouting); optional Eclipse SUMO |
| 5 — Central Asia | Regional | Uzbek and Kyrgyz localisation; regional cost libraries |
| 6 — International | Localisation | Licensing, SSO, data-protection compliance per country |

Technical backlog: TypeScript/Vite migration of the modules (currently zero-build JavaScript for offline portability), IndexedDB for larger OSM caches, CesiumJS terrain option, server-side LLM proxy.
