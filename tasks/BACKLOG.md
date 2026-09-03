# BACKLOG.md — Deferred Work

This file contains work that is intentionally not part of the current PR.

`PHASES.md` is the source of truth for planned implementation order.

Do not pull backlog items into the current PR unless explicitly instructed.

---

## Deferred Features

### Tier 2

* [ ] Improve Threat Timeline interactions beyond the initial implementation.
* [ ] Expand Incident Report formatting and PDF export.
* [ ] Improve Attack History filtering/search.
* [ ] Expand Security Challenge phrase pool and challenge flows.

### Tier 3

* [ ] Improve Voice Fingerprint visualization after the basic 2D implementation.
* [ ] Improve simulated Global Threat Map interactions and presentation.

### Tier 4

* [ ] AI Security Analyst enhancements.
* [ ] Call/Conversation Simulator enhancements.

---

## Technical Improvements

These should only be addressed when they provide clear value to the hackathon demo.

* [x] Performance optimization after real latency measurements exist.
* [ ] ML inference optimization after profiling.
* [x] UI animation/performance optimization.
* [ ] Additional automated tests where they materially reduce risk.
* [ ] Improved database abstraction if SQLite limitations become relevant.
* [ ] Production-grade logging/observability.
* [ ] More comprehensive ML evaluation.
* [ ] More robust audio-format compatibility.
* [ ] Additional browser compatibility testing.

---

## Future / Post-Hackathon

Explicitly outside the current 2-day build unless priorities change.

* [ ] Production telecom integration.
* [ ] Real-time global threat intelligence.
* [ ] User authentication and account management.
* [ ] Multi-tenant architecture.
* [ ] Production database infrastructure.
* [ ] Mobile application.
* [ ] Training custom ML models.
* [ ] Large-scale model evaluation.
* [ ] Production deployment architecture.
* [ ] Enterprise integrations.
* [ ] Blockchain-related functionality.

---

## Known Scope-Creep Candidates

Do **not** start these merely because they seem cool during development:

* [ ] 3D voice fingerprint / Three.js visualization.
* [ ] Real external TTS in the golden demo path.
* [ ] Real external STT in the golden demo path.
* [ ] LLM-controlled security decisions.
* [ ] Complex authentication.
* [ ] Complex cloud infrastructure.
* [ ] Rewriting working components for architectural perfection.
* [ ] Building a second analysis pipeline specifically for Demo Mode.

---

## Agent-Discovered Backlog

Agents may add items here when they discover useful work that is outside the current PR.

Format:

```text
- [ ] [PR-XX] Short description — reason it was deferred.
```

Rules:

1. Do not implement the item in the current PR.
2. Add enough context for a future agent to understand why it exists.
3. If the item becomes important, move it into the appropriate `PHASES.md` PR through an explicit planning decision.
4. Never use this section as an excuse for scope creep.

---

## Completed / Resolved Backlog

Move completed backlog items here rather than deleting their history.

*(none yet)*
