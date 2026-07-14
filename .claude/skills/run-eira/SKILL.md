---
name: run-eira
description: Use when launching or driving the Eira app (backend FastAPI + frontend Vue/Vite) — starting dev servers, smoke-testing, or debugging why the UI can't reach the API.
---

# Running Eira

Full-stack: **backend** (FastAPI, uv, port 8000) + **frontend** (Vue/Vite, port 5173).

## Start

```bash
./dev.sh
```

Run from repo root (`/Users/zubo/Projects/eira`). Kills anything already
listening on 8000/5173, launches both, `Ctrl-C` stops both (trap kills
process group).

URLs: backend docs `http://localhost:8000/docs`, frontend
`http://localhost:5173`.

## Known gotcha: CORS is port-hardcoded

`backend/app/main.py:24` — `allow_origins=["http://localhost:5173"]`.
If frontend ever binds to a different port (5173 already taken by a
stale process), API calls fail with a CORS error in the browser
console, not a connection error. `dev.sh` avoids this by freeing 5173
before starting. If you ever run frontend manually (`npm run dev`
without the script) and it prints a port other than 5173, that's why
API calls break — kill whatever's on 5173 and restart.

## First login: bootstrap caposala

Fresh/empty DB has no `reparto` and no user — backend startup
(`app/main.py:_seed_bootstrap_caposala`) auto-creates one reparto
(`settings.seed_reparto_nome`) and one `caposala` user if none exists
yet (checked by role, not by table-empty, so it also self-heals a
reparto-with-no-caposala state). Runs once per empty state, logged to
stdout as `[seed] ...`.

Login is **by numeric user id, not email** (`app/routers/auth.py:28`
reads `username` as `int(...)`) — the seeded caposala's id is printed
in that startup log line (first empty DB: `id=1`). Password is
`settings.seed_caposala_password` (`.env`-overridable, see
`app/core/config.py`).

```bash
curl -X POST http://localhost:8000/api/v1/auth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=1&password=dev-caposala-change-in-production"
```

## Verifying it's actually running (not just launched)

`curl` 200 on both ports proves the process is up, not that the app
works — Vue SPA serves 200 on the shell even if the API calls inside
fail. Drive it in a browser (Playwright MCP or similar): navigate to
`http://localhost:5173/`, check console for errors, confirm the login
page's reparto dropdown actually loads data from the backend.
