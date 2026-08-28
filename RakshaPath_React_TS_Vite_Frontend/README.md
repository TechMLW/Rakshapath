# RakshaPath React + TypeScript + Vite frontend

Built from the supplied Stitch visual source.

## Important integration status

The Stitch ZIP was available and inspected. The backend/routing/AI project itself was **not present in the supplied files**, so this frontend does **not** pretend that backend connectivity exists.

The API layer is centralized at `src/services/api.ts`. It uses `VITE_API_BASE_URL` and contains clearly isolated placeholder paths that must be replaced with the actual backend contract after the backend project is supplied.

There is deliberately:
- no fake route geometry
- no hardcoded route coordinates
- no fake safety score
- no fake route success
- no fake incident submission success
- no fake GPS position

## Run

```bash
npm install
cp .env.example .env
# Set VITE_API_BASE_URL to the real backend URL
npm run dev
```

Windows PowerShell:
```powershell
copy .env.example .env
npm install
npm run dev
```

## Current pages

- Explore
- Route Planning
- Safety Around You
- Incident Reporting
- Live Navigation
- Profile / Settings

## Map

Leaflet + OpenStreetMap is used in `src/components/MapView.tsx`.

Only route geometry returned from `src/services/api.ts` is rendered.

## Backend contract still required

The frontend needs the actual backend source/API documentation to connect:
1. route request endpoint + request body
2. route response schema + geometry format
3. fastest/safest/balanced semantics
4. rerouting endpoint + payload/response
5. safety endpoint + response
6. incident reporting endpoint + multipart schema
7. authentication/CORS requirements

## Acceptance status

UI COMPLETE: Yes, based on supplied Stitch screens and design system.

FRONTEND FUNCTIONAL: Yes as an integration-ready React application; forms, navigation, map initialization, state, loading/error states and route rendering are implemented.

BACKEND CONNECTED: No — backend project/API contract was not supplied.

ROUTING CONNECTED: No — cannot truthfully claim this without the real backend contract.

AI DATA CONNECTED: No — backend/AI endpoints were not supplied.

REROUTING CONNECTED: No — backend endpoint was not supplied.

END-TO-END FUNCTIONAL: Not yet verifiable without the existing backend.

## Testing once backend is supplied

1. Start the actual backend.
2. Set `VITE_API_BASE_URL`.
3. Start Vite.
4. Enter real origin and destination.
5. Confirm browser Network shows the backend request.
6. Confirm backend logs show the request.
7. Confirm actual routing executes.
8. Confirm response matches the actual schema.
9. Map should render returned geometry.
10. Select returned route options.
11. Verify actual analytics.
12. Start navigation using selected returned route.
13. Trigger reroute through the real endpoint.
14. Verify the returned geometry replaces the previous geometry.
15. Load safety data using actual GPS and backend response.
16. Submit an incident and verify backend confirmation before showing success.

## Backend startup command

Not provided because the backend project was not included. Do not invent one.

## Files to modify after backend inspection

Primarily:
- `src/services/api.ts`
- `src/types/api.ts`

Possibly:
- `src/hooks/useRoutePlanner.ts`
- page components only where the actual response semantics require it

The backend itself should remain untouched unless an integration blocker is demonstrated.
