# Apex Health Dashboard

React + Vite SPA. Data access goes through `src/api/client.js` (`api`); the default implementation is in-memory (`src/mocks/in-memory/mockApi.js`).

**UI split:** patient (member) screens live under `src/views/patient/`; staff / admin dashboard screens under `src/views/staff/`. Routing is registered in `pages.config.js`.

See [`docs/FRONTEND_ARCHITECTURE.md`](docs/FRONTEND_ARCHITECTURE.md) for layers and MERN integration steps.

## Local development

```bash
npm install
npm run dev
```

Build: `npm run build` · Preview: `npm run preview`

Optional env:

- `VITE_API_MODE` — `mock` (default) or `http` (requires `src/api/http/createHttpApi.js` to be implemented).
- `VITE_API_BASE_URL` — Express API origin when using HTTP mode.
