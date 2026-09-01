# MEMORY.md — Living Project Memory

Read this file at the beginning of every coding session.

This file records the **current reality of the project** — what is actually implemented, important discoveries, decisions that affect future work, known problems, and demo-critical information.

Do not use this file as a roadmap.
Planned work belongs in `PHASES.md`.
Current task belongs in `tasks/CURRENT.md`.
Unplanned future work belongs in `tasks/BACKLOG.md`.

Keep entries short, factual, and dated.

---

# Current Status

**Last updated:** 2026-09-01

**Current PR:** PR-01
**Current phase:** Phase 1 — Audio Foundation
**Overall status:** PR-00 complete. Monorepo scaffolding, FastAPI backend with SQLite config, ML package structure, and Next.js frontend with live /health check indicator fully verified.

---

# Current Architecture

## Repository

```text
/
├── frontend/     # Next.js (App Router, TypeScript, Tailwind CSS v4, shadcn/ui)
├── backend/      # FastAPI / Python (async, SQLite via SQLAlchemy + aiosqlite)
├── ml/           # ML loading + inference utilities (isolated package)
├── docs/         # Architecture and technical documentation
├── tasks/        # Agent task management
├── RULES.md
├── PRD.md
├── PHASES.md
├── MEMORY.md
└── README.md
```

---

# PR History

Keep one short entry per completed PR.

```text
PR-00 — Complete — 2026-09-01: Monorepo scaffolding, FastAPI /health endpoint, SQLite setup, Next.js frontend health dashboard.
PR-01 — Not started
PR-02 — Not started
PR-03 — Not started
...
PR-20 — Not started
```

After completion:

```text
PR-00 — Complete — 2026-09-01
PR-01 — Complete — 2026-09-01
```

Add a one-line note only when something important needs to be remembered.

---

# Memory Maintenance Rules

1. **Facts over intentions.**
2. **Short over exhaustive.**
3. **Date important discoveries.**
4. **Never fabricate measurements, ML results, benchmarks, or test results.**
5. **Do not duplicate the PRD unnecessarily.**
6. **Do not turn MEMORY.md into a second roadmap.**
7. **Record decisions that future agents could otherwise accidentally reverse.**
8. **Record failed approaches so future agents don't repeat them.**
9. **Update this file at the end of every PR.**
10. **If something here becomes false, update or remove it immediately.**
