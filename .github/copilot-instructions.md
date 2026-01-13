Purpose
This file gives concise, actionable orientation for AI coding agents working in this repo.

Big picture
- Backend: `lently-backend/` — FastAPI app started from `lently-backend/main.py`. Routes live in `lently-backend/routes/` and are intentionally thin; business logic and external API calls live in `lently-backend/services/` (e.g. `youtube_service.py`, `ai_reply_service.py`). Shared models are in `lently-backend/models/` and cross-cutting middleware is in `lently-backend/middleware/` (error handling, rate limiting, auth).
- Frontend: `frontend/` — Vite + React + TypeScript. Components under `frontend/src/components/`, logic/hooks under `frontend/src/hooks/`, and client-side state under `frontend/src/stores/`.
- Config & secrets: `lently-backend/config/` holds `settings.py` (pydantic-settings) and `firebase.py` (initializes Firebase). The app prefers a service-account JSON file path (`firebase_credentials_path`) or base64/env var fallbacks.

Data flows & integration points
- Incoming HTTP -> router (routes/) -> service (services/) -> external API (YouTube, Firebase, Gemini, Paddle). See `main.py` for registered routers.
- Authentication: backend expects a Firebase ID token supplied as a Bearer token. Token verification happens via `lently-backend/config/firebase.py` and middleware; prefer using Firebase ID tokens for local testing.
- External APIs: YouTube client in `services/youtube_service.py`; Gemini/OpenAI calls live in `services/gemini_service.py` or related ai services. Payments use Paddle via `services/paddle_service.py`.

Development workflows (exact commands)
- Backend (recommended):
  - Create venv and install: `python -m venv .venv && source .venv/bin/activate && pip install -r lently-backend/requirements.txt`
  - Run locally: `cd lently-backend && python main.py` (or `uvicorn main:app --reload`).
  - Tests (backend): from repo root after activating venv run `pytest` or `python -m pytest`.
- Frontend:
  - Install & dev: `cd frontend && npm install && npm run dev` (scripts are in `frontend/package.json`).
  - Build: `cd frontend && npm run build`.

Project-specific conventions
- Keep route handlers thin: move business logic to `services/*_service.py`.
- Use Pydantic models in `models/` for request/response shapes.
- Use `config/settings.py` for runtime configuration; prefer environment variables over hard-coded secrets. Settings keys in use include `google_cloud_project`, `firebase_credentials_path`, `gemini_api_key`, `youtube_api_key`, `paddle_api_key_*`, `resend_api_key`, `frontend_url`, `environment`.
- Error handling funnels through `middleware/error_handler.py`; follow existing exception types in `utils/exceptions.py` when adding errors.

Sensitive files & safe push rules (must follow these exactly)
- NEVER commit service-account JSON files or local credential files (common pattern: `*-adminsdk-*.json`). Example local file observed in this workspace: `lently-backend/lently-saas-firebase-adminsdk-*.json` — keep it out of git.
- Add local credentials and runtime secrets to `.gitignore` and to `.env` (which should be gitignored). Example entries to ensure are ignored: `lently-backend/*.json` (service account JSON), `.env`, `.venv/`, `lently-backend/venv/`, `frontend/node_modules/`.
- If a secret is already committed, DO NOT push. Instead:
  1. Run `git rm --cached path/to/secret.json` to stop tracking the file locally.
  2. Add an entry to `.gitignore` to prevent re-adding.
  3. To remove it from remote history, coordinate with repository owner — use `git filter-repo` or BFG to scrub history (this is disruptive; do not run without owner approval).

Committing & pushing (safe procedure)
1. Inspect changes: `git status --porcelain` and review filenames only (never print file contents).
2. Ensure no secret-like filenames are staged: `git diff --name-only --staged` and grep for `adminsdk|firebase|credentials|secret|.env`.
3. If any sensitive file appears, unstage and remove from tracking: `git reset HEAD path && git rm --cached path && echo path >> .gitignore`.
4. Commit normal code changes with a focused message: `git add -A && git commit -m "<short, focused message>"`.
5. Push only after confirming remote exists: `git remote -v` and `git push origin <branch>`.

Quick file examples to inspect when changing behavior
- Auth / Firebase: `lently-backend/config/firebase.py`
- API entrypoint & routers: `lently-backend/main.py` and `lently-backend/routes/`
- External services: `lently-backend/services/youtube_service.py`, `lently-backend/services/ai_reply_service.py`, `lently-backend/services/gemini_service.py`, `lently-backend/services/paddle_service.py`
- Frontend scripts: `frontend/package.json`

If unsure
- Ask for the remote URL and explicit confirmation before creating or pushing commits that modify anything outside `frontend/src/` or `lently-backend/` (for example, removing tracked files from history requires owner approval).

End
If you want, I can now:
- create/update `.gitignore` entries to block local credentials and venvs,
- add this `.github/copilot-instructions.md` and commit it locally,
- then follow the safe push procedure (I will not push if secrets are found or if no remote is configured). Reply with the option you want.
