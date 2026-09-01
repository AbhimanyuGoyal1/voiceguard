# CURRENT.md — Current Agent Task

> This file is the immediate source of truth for what the next agent should work on.
> `PHASES.md` defines the roadmap; this file defines the current work.

## Project Status

**Project:** VoiceGuard
**Stage:** Pre-build / Foundation
**Current PR:** PR-00
**Current Branch:** `pr-00-project-scaffolding`

---

## Current Task

### PR-00 — Project Scaffolding

**Tier:** T1 — Foundation
**Test:** `[TEST: skip]`

Build the initial VoiceGuard monorepo and establish the development environment.

### Scope

* Create `/frontend`

  * Next.js
  * TypeScript
  * Tailwind
  * shadcn/ui
* Create `/backend`

  * FastAPI
  * Python environment
  * dependency management choice documented
* Create `/ml`

  * model-loading structure
  * kept separate from FastAPI routing
* Configure `.env.example` files.
* Include optional placeholders for:

  * `LLM_API_KEY`
  * `TTS_API_KEY`
  * `STT_API_KEY`
* Ensure the application works without any of these keys.
* Create SQLite configuration.
* Implement:

```text
GET /health
```

* Connect the frontend to the backend health endpoint.
* Display a clear backend health indicator in the frontend.
* Record the chosen Python dependency-management approach in `docs/DECISIONS.md`.

---

## Definition of Done

PR-00 is complete when:

* [ ] Repository structure matches the architecture defined in `PRD.md`.
* [ ] Frontend starts successfully.
* [ ] Backend starts successfully.
* [ ] `/health` returns a successful response.
* [ ] Frontend successfully calls the real `/health` endpoint.
* [ ] Frontend displays `Backend: Healthy`.
* [ ] SQLite configuration exists.
* [ ] Optional AI API keys are not required to start or use the core application.
* [ ] No unnecessary features have been implemented.
* [ ] No ML models are integrated yet.
* [ ] No external AI API is required.
* [ ] Manual smoke check passes.
* [ ] `MEMORY.md` is updated with the actual architecture.
* [ ] `tasks/BACKLOG.md` is updated.
* [ ] `CURRENT.md` is moved to PR-01 after completion.

---

## Files Expected to Change

Primarily:

```text
/frontend/**
/backend/**
/ml/**
/.env.example
/docs/DECISIONS.md
/MEMORY.md
/tasks/BACKLOG.md
/tasks/CURRENT.md
```

Do not modify unrelated product features or implement later PRs.

---

## Dependencies

None.

This is the foundation PR.

---

## Next PR

After PR-00 is completed and manually verified:

**PR-01 — Audio Capture & Upload**

Branch:

```text
pr-01-audio-capture
```

Do not begin PR-01 work as part of PR-00.
