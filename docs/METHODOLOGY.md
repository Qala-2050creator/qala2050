# Methodology — QALA 2050 simulation engine (`js/engine.js`)

All indicators come from one deterministic, pure function, `compute(state, data)`. The map, charts, AI Mayor, reports and Pitch Mode all read the same shared scenario state. There is no randomness, and every ratio is bounded and protected against division by zero (`div(a, b, default)`). Every assumption below can be edited in **Settings → Methodology**. Unit costs are edited in **Budget AI**.

## Coordinates
Local tangent plane around the reference point 44.85278 N, 65.50917 E: x = Δlng × 111 320 × cos(lat₀) m, y = Δlat × 110 540 m. This is accurate to well under 1 % across the city.

## Proposed objects
| Quantity | Formula |
|---|---|
| Floor area (GFA) | width × length × floors (buildings); site area (parks, solar, parking…) |
| Dwelling units | GFA × 0.78 ÷ 65 m² |
| Residents | units × household size (3.4) |
| Capacity defaults | school GFA/12 m² per seat · kindergarten /14 · hospital /100 per bed · clinic /7 per visit/shift · university /15 · lane capacity 900 veh/h · solar 0.055 kW/m² · water plant 2 m³/day per m² |
| Construction cost | (GFA or site area or units) × unit cost; scenario total × (1 + 10 % contingency) |
| Operating cost / yr | capex × type rate (1.2–8 %) · lifecycle = capex + opex × lifetime |
| Jobs | GFA ÷ type ratio (e.g. offices 18 m²/job, factory 80 m²/job) |

## Population and services
- Baseline population **316,800** (Akimat of Kyzylorda, gov.kz, city with subordinate settlements). This is VERIFIED.
- Residents are spread over sample points. In OSM mode the weights follow OSM residential land-use area; in demo mode they follow residential floor area. Both are labelled ESTIMATED.
- School demand = population × 0.19. Existing seats = baseline demand × 0.92 (assumed). Load = demand ÷ capacity.
- Kindergarten: 0.085 share, 0.85 ratio. Beds: need 5.5 per 1,000, existing 5.0 per 1,000. Clinic: 2.2 visits/shift per 1,000 × 100.
- **Accessibility:** a resident counts as covered if straight-line distance × 1.3 (detour factor, "estimated walking") is within the threshold. Thresholds: school 1,000 m, kindergarten 500 m, clinic 1,500 m, park 500 m, bus stop 400 m, sport 1,200 m, fire 3,000 m (straight line). The UI states which method applies. A routed network model is on the roadmap.
- **Gap finder:** the uncovered sample point that would bring the most uncovered residents within the threshold.

## Traffic (SIMULATED — not real-time)
- Link capacity = lanes × 900 veh/h. Default lanes: trunk 4, primary 4, secondary 2, tertiary 2.
- Base load = capacity × class V/C (trunk 0.74, primary 0.70, secondary 0.56, tertiary 0.44) × time-of-day factor (morning 1.0, evening 1.08, off-peak 0.55) × background growth.
- Generated peak-hour trips = units × 0.45 + jobs × 0.30 (+ GFA × 0.012 for malls). They are assigned to links within 4 km with weight 1/(d + 300)² and multiplied by a 2.5 segment-exposure factor.
- A new road or bridge attracts min(35 %, new capacity ÷ (new + nearby capacity)) of nearby load. Nearby means within 1.2 km, or for bridges, any other bridge within 4 km.
- Each proposed bus stop trims link load within 600 m by 3 %, up to 15 %. Transit-priority mode applies −10 %.
- A closed link's load moves to the 4 nearest open links within 2 km, in proportion to capacity. Total load is conserved (tested).
- V/C classes: < 0.6 low, < 0.8 moderate, < 1.0 high, ≥ 1.0 critical. Traffic index = load-weighted mean V/C.

## Environment (ESTIMATED proxies)
- Green area = mapped parks + proposed parks/playgrounds + trees × 30 m² canopy. Benchmark 9 m²/person, a commonly cited planning reference.
- Heat proxy per 600 m cell = clamp(0.30 + 0.75 × density − 1.6 × green share, 0, 1). The city value is population-weighted.
- Electricity = population × 1,400 kWh + non-residential GFA × 150 kWh/m². Solar = MW × 1,500 kWh/kWp.
- CO₂ = (electricity − solar) × 0.6 t/MWh + population × 2.2 t (heating and transport).
- Water = population × 180 L/day. Supply = baseline demand × 1.12 + proposed water plants.

## Risk (educational demonstrations)
- **Flood:** no validated DEM is used. Terrain is assumed to rise 0.4 m per 100 m from the river centre-line, so band width = water rise ÷ 0.004. The model reports exposed residents, facilities, roads, proposals and (demo mode) buildings.
- **Heat:** proxy + 0.04 per °C. Cells above 0.62 count as "hot". Vulnerable residents are assumed at 8 %.
- **Drought / water:** supply reduced by the selected percentage, then compared with demand.
- **Facility failure:** every n-th facility of the chosen type is switched off, deterministically.
- **Evacuation:** residents within 600 m of trunk or primary roads.

## City Health Index (internal, not an official ranking)
CHI = 0.20·T + 0.20·E + 0.20·I + 0.15·A + 0.15·Ec + 0.10·R, with each category clamped to 0–100.
- T = 100 × clamp(1 − (index − 0.55) / 0.6)
- E = 50 × min(1, green per person ÷ 9) + 30 × (1 − heat) + 20 × min(1, renewable share ÷ 0.3)
- I = mean of capacity ÷ demand (capped at 1) for schools, kindergartens, beds, clinics and water, × 100
- A = mean coverage of school, kindergarten, health, park and transit, × 100
- Ec = 50 × min(1, jobs ratio ÷ 0.45) + 50 × budget health (1 − overrun ÷ budget)
- R = 50 × (1 − exposed share at the 2 m reference flood) + 30 × fire coverage + 20 × water reserve score
- Risk score = 100 − (0.5 R + 0.25 T + 0.25 I)

## Budget optimiser
A greedy benefit/cost knapsack over 11 candidate projects. Benefit = Σ objective weight × base benefit × need multiplier. The need multiplier grows when modelled load is above 1 or coverage is low. Each additional copy of the same project is worth 0.7 times the previous one, with at most 4 picks per project. The plan never exceeds the remaining budget (tested).

## Business suitability
Score = 0.30 × residents within 800 m + 0.20 × road proximity + 0.15 × bus stops within 400 m + 0.20 × (1 − competitors within 500 m ÷ 6) + 0.15 × institutions within 700 m, each normalised to 0–1. The score does not claim real demand or profitability.

## Future mode
Fifteen hypothetical objects per strategy are added in 2030, 2040 and 2050, in zones on the left bank, east and west. Background population growth is 1.0 % (green), 1.6 % (economic) or 1.3 % (balanced) per year. Future residential capacity absorbs that growth first, and the remainder densifies existing areas. These are not official plans.
