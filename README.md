# RakshaPath

**AI-Powered Intelligent Route Optimization & Community Safety Platform**
Smart India Hackathon 2026

## 1. Overview

RakshaPath computes safety-aware routes over a real road network (OpenStreetMap, via OSMnx/NetworkX) using A* pathfinding with pluggable cost profiles, augmented by community-reported hazards and ML risk models. A FastAPI backend exposes the routing/AI/community-reporting functionality; a React + TypeScript + Vite frontend (Google-Maps-style UI) consumes it.

This README describes the **final, consolidated** project — one backend, one frontend, no duplicates.

## 2. Problem Statement

Standard navigation apps optimize for time or distance only. Commuters — especially in cities with variable street lighting, flood risk, and inconsistent policing — need routes that can be optimized for *safety*, not just speed, and that can react to live hazard reports (waterlogging, blockages, poor lighting) rather than a static map.

## 3. Key Features

- Real A* routing over an actual OSM road graph (not simulated)
- Three route profiles: **Fastest**, **Safest**, **Balanced** — each a distinct edge-cost function, not a UI relabeling of the same path
- Dynamic rerouting endpoint that recomputes a route under an adjusted cost model
- Community incident reporting (hazards, accidents, lighting, **Lost & Found**) backed by PostGIS geospatial queries
- Real place-name geocoding (OpenStreetMap Nominatim) — the route planner is not limited to a fixed preset list
- ML risk-prediction modules for accidents/flooding/congestion (`src/ml/`, `src/ai/`)
- Honest degraded-state handling: when the database or a data source is unavailable, the UI says so — it does not fabricate a safety score or an empty-but-successful response

## 4. System Architecture

```
Frontend (React/Vite)  →  FastAPI backend  →  Routing Service (A*, NetworkX graph)
                                            →  PostgreSQL + PostGIS (reports, users)
                                            →  ML models (src/ai, src/ml) for risk scoring
```

The frontend never computes a route itself — it sends origin/destination coordinates to the backend and renders whatever the backend's A* implementation returns.

## 5. Frontend Architecture

`frontend/` — React 18 + TypeScript + Vite + Tailwind, Leaflet/OpenStreetMap map layer.

- `src/pages/` — Explore (map + quick plan), Routes (compare profiles), Safety, Reports, Navigation (live HUD), Profile
- `src/components/` — `MapView` (Leaflet rendering, route-color logic), `RouteCard`, `Sidebar`, `TopBar`, `MobileNav`
- `src/context/RoutePlannerContext.tsx` — centralized route-planning state (origin/destination, active hazard, selected route)
- `src/services/` — `routeService.ts` (backend routing calls), `safetyService.ts` (backend hazard-report calls), `locationService.ts` + `geocoding.ts` (real Nominatim geocoding), `mockData.ts` (presets/landmark shortcuts only — not used as a fallback for arbitrary input)
- `src/types/api.ts` — shared request/response types

## 6. Backend Architecture

`src/backend/` — FastAPI.

- `main.py` — app entrypoint, CORS, router registration
- `routes.py` — `/routes/optimize`, `/routes/reroute`
- `reports.py` — `/reports/` (GET/POST), `/reports/nearby` (PostGIS proximity query)
- `auth.py`, `models.py`, `schemas.py`, `database.py` — user auth (JWT) and SQLAlchemy/PostGIS setup
- `admin.py`, `notifications.py` — supporting endpoints

## 7. AI / Routing Architecture

- `src/graph/` — builds/caches the road network graph from OpenStreetMap (`graph_builder.py`, region config in `config.py`)
- `src/routing/` — `astar.py` (pathfinding), `edge_weights.py` (per-profile cost functions), `route_ranker.py`, `rerouting.py` (dynamic reroute logic), `route_analytics.py` (distance/time/safety scoring), `frontend_export.py` (GeoJSON/polyline formatting)
- `src/ai/` — `safety_score.py`, `flood_prediction.py`, `accident_prediction.py`, `congestion_prediction.py`, `explainable_ai.py`, `report_verification.py`
- `src/ml/` — trained model artifacts (`*.pkl`) and training/evaluation scripts

## 8. Route Optimization Profiles

Defined in `src/routing/edge_weights.py`:

| Profile | Cost function | 
|---|---|
| Fastest | `length × speed_factor(highway_type) × traffic × hazard` |
| Safest | `length × safety_factor(highway_type) × safety × crime × flood` |
| Balanced | `0.45 × fastest_cost + 0.55 × safest_cost` |

It is expected and acceptable for two or three profiles to converge on the same physical path when that path is genuinely optimal under all three cost functions — the frontend does not force artificial divergence.

**Route line colors** (fixed, applied in `frontend/src/components/MapView.tsx`):
- Safest → **Blue** (`#2563eb`)
- Fastest → **Red** (`#dc2626`)
- Balanced → **Green** (`#16a34a`)

The selected route is drawn thicker and at full opacity; non-selected routes are thinner and dimmed, but keep their profile color.

## 9. Dynamic Rerouting

`POST /routes/reroute` recomputes a path using `dynamic_weights` (a hazard-penalty multiplier consumed by `edge_weights.py`). This is real backend computation, not a frontend simulation.

**Known limitation**: the `{hazard_type, penalty_factor}` payload shape applies its multiplier *globally* to every edge of that cost type, not to a specific geographic location — so it can return the same geometry with the flag `rerouted: true` if the global penalty doesn't change which path is shortest. A truly localized detour would require the backend to expose per-edge node IDs to the caller, which it currently does not. This is flagged in the UI when triggered ("Simulate Road Hazard"), rather than being papered over with a fake detour.

## 10. Safety / Community Reporting

`GET /reports/` and `POST /reports/` are real, PostGIS-backed endpoints (see Phase 7 / §17 below for the current local DB status). The Safety page shows a heuristic score derived from nearby open reports, and explicitly renders **"—" / "Not measured by backend"** for lighting/patrol/traffic/crowd metrics, since the backend has no data source for those — it does not invent numbers for them.

## 11. Lost & Found

Added as a report category (`frontend/src/pages/Reports.tsx`), with sub-types: **Valuables, Personal Items, Documents, Electronics, Other**. The backend's `report_type` field is free text (see `src/backend/report_schemas.py`), so this required no backend/schema change — the sub-type is folded into the submitted `report_type` (e.g. `"Lost & Found: Electronics"`) and correctly re-classified when reports are displayed back on the Safety page.

## 12. Technology Stack

**Backend:** Python 3.13, FastAPI, SQLAlchemy 2, GeoAlchemy2, psycopg2, PostgreSQL + PostGIS, NetworkX, OSMnx, scikit-learn, pandas/numpy, uvicorn, python-jose (JWT), passlib/bcrypt
**Frontend:** React 18, TypeScript, Vite 6, Tailwind CSS, Leaflet, react-router-dom, lucide-react
**Testing:** pytest (backend/routing)

## 13. Folder Structure

```
sih-2026-airakshak/
├── src/
│   ├── backend/     FastAPI app, routes, auth, DB models
│   ├── ai/          ML-driven risk prediction & explainability
│   ├── graph/        OSM graph build/cache/config
│   ├── routing/      A*, edge weights, rerouting, analytics
│   ├── ml/           trained models + training scripts
│   └── tests/        pytest suite
├── frontend/         React + TS + Vite + Tailwind (Google-Maps-style UI)
├── data/graphs/       cached road network graphs (.graphml; regenerate via `python run.py graph`)
├── requirements.txt
├── pytest.ini
├── run.py            unified CLI: backend / frontend / graph / demo
├── .env.example       backend environment template
└── README.md
```

## 14. Requirements

- Python 3.11+ (developed on 3.13)
- Node.js 18+ and npm (a bundled copy exists at `.tools/node/` in this sandbox for convenience — not part of the shipped project; install Node normally elsewhere)
- PostgreSQL 14+ with the **PostGIS** extension

## 15. Environment Variables

Copy `.env.example` → `.env` at the repo root:

```
DATABASE_URL=postgresql://<user>:<password>@localhost:5432/raksha_path
# CORS_ORIGINS=http://localhost:5173,http://localhost:3000   (optional; sensible defaults exist)
```

Frontend: copy `frontend/.env.example` → `frontend/.env`:

```
VITE_API_BASE_URL=http://localhost:8000
```

## 16. PostgreSQL / PostGIS Setup

**Linux (Debian/Ubuntu):**
```bash
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib postgis
sudo systemctl start postgresql
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'your_password_here';"
sudo -u postgres createdb raksha_path
sudo -u postgres psql -d raksha_path -c "CREATE EXTENSION IF NOT EXISTS postgis;"
```
Then set `DATABASE_URL` in `.env` to match the password you chose.

**Windows:** install PostgreSQL via the official installer (postgresql.org) or `choco install postgresql`, enable the PostGIS extension via **Stack Builder** (bundled with the installer), then in `psql`:
```sql
CREATE DATABASE raksha_path;
\c raksha_path
CREATE EXTENSION IF NOT EXISTS postgis;
```

**Verify the connection works** before starting the backend:
```bash
psql "postgresql://<user>:<password>@localhost:5432/raksha_path" -c "SELECT PostGIS_Version();"
```

> The backend's `SQLAlchemy` engine (`src/backend/database.py`) reads `DATABASE_URL` from `.env` — there is no hidden fallback to a fake/mock data source. If PostgreSQL is unreachable, `/reports/` correctly returns a real `500` with the underlying exception; it does not silently return an empty or fabricated result.

## 17. Windows Setup

```powershell
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python run.py backend --reload
```
```powershell
cd frontend
copy .env.example .env
npm install
npm run dev
```
All backend/routing/graph code uses `pathlib.Path`, so there are no hardcoded Linux-only paths.

## 18. Linux Setup

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python run.py backend --reload
```
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## 19. Backend Startup

```bash
source venv/bin/activate
python run.py backend --port 8000 --reload
```
Health check: `curl http://localhost:8000/` → `{"message": "Raksha-Path Backend is running!"}`
DB check: `curl http://localhost:8000/test-db`

## 20. Frontend Startup

```bash
cd frontend
npm install
npm run dev
```
Opens on `http://localhost:5173`. `VITE_API_BASE_URL` in `frontend/.env` must point at the running backend.

## 21. Testing

Backend/routing test suite (28 tests, covering A*, edge weights, rerouting, graph building, route analytics, backend integration, benchmarks):
```bash
source venv/bin/activate
python -m pytest
```
Last run: **28 passed**.

Frontend build/typecheck:
```bash
cd frontend
npm run build
```
There is currently no automated frontend test suite (no `*.test.*`/`*.spec.*` files, no `test` script) — this is a genuine gap, not hidden.

## 22. Demo Procedure

1. Start PostgreSQL (§16), backend (§19), frontend (§20).
2. Open `http://localhost:5173`.
3. Type any real place name into Origin/Destination (e.g. *"Bhubaneswar Railway Station"* → *"KIIT University"*) — not just a preset.
4. Click **Calculate**. Verify in DevTools → Network that a real `POST /routes/optimize` request fires and a 200 with real `analytics` returns.
5. Confirm the route draws on the map with the correct colors (Safest=blue, Fastest=red, Balanced=green) and that switching profiles changes the request/response.
6. Click **Simulate Road Hazard** and confirm a real `POST /routes/reroute` fires.
7. Visit **Report Issue**, select **Lost & Found**, pick a sub-type, submit.
8. Visit **Safety Intel** and confirm it reflects real backend data (or a truthful "not available" state if the DB is down).

## 23. Known Limitations

- **PostgreSQL/PostGIS is not provisioned in this development sandbox** (confirmed: no `postgresql` service installed, connection refused on 5432). This is an infrastructure gap, not a code bug — `/routes/optimize` degrades gracefully without it (community-hazard overlay disabled), but `/reports/` (GET and POST) correctly returns a real `500` until a database is provisioned per §16.
- Only the `bhubaneswar` region has a cached road graph in `data/graphs/`; other regions listed in `src/graph/config.py` would trigger a live OSM download on first use (untested here).
- Dynamic rerouting's hazard penalty is global, not geographically localized (see §9).
- No automated frontend test suite exists yet.
- `SECRET_KEY` for JWT auth (`src/backend/auth.py`) has a clearly-labeled insecure development default — set a real `SECRET_KEY` environment variable before any real deployment.
- Only one frontend build has been visually/functionally verified end-to-end in this environment (Chromium via Playwright); it has not been tested in Firefox/Safari.

## 24. Future Scope

- Provision PostgreSQL/PostGIS in CI so the reports/safety path can be tested end-to-end automatically
- Localized (per-edge) dynamic hazard penalties for genuinely geo-targeted rerouting
- Additional region graphs pre-cached for the Northeast states already configured in `src/graph/config.py`
- Frontend automated test suite (component + e2e)
- Turn-by-turn live GPS tracking on the Navigation page (currently a static HUD layout)

## 25. Team Member Responsibilities

See in-code module ownership: `src/backend/` (API/auth), `src/routing/` + `src/graph/` (routing & optimization), `src/ai/` + `src/ml/` (risk prediction), `frontend/` (UI/UX).
