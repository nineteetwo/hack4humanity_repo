# hack4humanity_repo — Dolphy

Daily mental wellness app: FastAPI backend + a plain HTML/CSS/JS frontend,
served by the **same** server.

## Project layout

```
app/           FastAPI backend (routers, models, auth, chess engine, ...)
public/        Frontend — index.html, app.html, login.html, signup.html,
               profil.html, quest.html, styles.css, and all the *.js files.
               Served directly by FastAPI's StaticFiles at "/".
requirements.txt
```

## Running locally

1. Create a Postgres database matching `DATABASE_URL` (see `app/config.py`
   for the default, or set your own in a `.env` file — see below).
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. (Optional) create a `.env` file to override defaults, e.g.:
   ```
   DATABASE_URL=postgresql://user:pass@localhost:5432/dolphy
   JWT_SECRET=change-me
   ```
4. Start the server:
   ```bash
   uvicorn app.main:app --reload
   ```
5. Open **http://localhost:8000/** — this now serves `public/index.html`
   directly (the root URL is no longer a bare JSON health check). The API
   itself lives under `/auth`, `/users`, `/lessons`, `/quests`,
   `/leaderboard`, `/chess`, and a lightweight health check is available at
   `/api/health`.

Because the frontend and API are served from the same origin/port, no CORS
configuration is required for local development — `api.js`'s `BASE_URL`
already points at `http://localhost:8000`.
