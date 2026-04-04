# Frontend architecture (Apex Health Dashboard)

## Layers

| Layer | Location | Role |
|--------|----------|------|
| **UI** | `src/components/`, `src/pages/` | Presentation only; compose feature components and hooks. |
| **Data access** | `src/api/client.js` | Single `api` object; swap mock vs HTTP without changing UI. |
| **Mocks** | `src/mocks/in-memory/mockApi.js` | In-memory stores + integrations. |
| **Static fallbacks** | `src/mocks/static/` | Dashboard-only placeholder rows when the store is empty. |
| **Hooks** | `src/features/*/hooks/` | Async orchestration, derived state (e.g. `useDashboardPageData`). |
| **Contexts** | `src/lib/*Context.jsx` | Cross-cutting UI state (auth shell, environment). |

## Switching to a MERN backend

1. Set `VITE_API_MODE=http` and `VITE_API_BASE_URL` (e.g. `https://api.example.com`).
2. Implement `src/api/http/createHttpApi.js` to return the same shape as the mock `api` object.
3. Update `src/api/client.js` to use `createHttpApi()` when `API_MODE === 'http'`.
4. Optionally replace `src/entities/*` re-exports to call HTTP-backed repositories instead of the in-memory module.

## Folder conventions

- `src/views/patient/` — patient portal: `pages/`, `components/home/` (patient dashboard widgets), `hooks/`, `config/patientNavigation.js`.
- `src/layouts/` — route shells (e.g. `AppLayout.jsx`).
- `src/app/providers/` — root provider composition.
- `src/components/` — shared UI (workouts, marketplace, env chrome) — not split by view unless patient-only (see `views/patient/components/home`).
- `src/components/ui/` — shadcn primitives (do not mix with domain logic).

## Anti-patterns to avoid

- Importing `@/mocks/*` from presentational components — use `api` from `@/api/client` or a hook.
- Duplicating `api.entities.*` calls across multiple pages — extract a hook or small service.
