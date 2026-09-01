# RULES.md — How the Agent Must Behave

These rules define how agents must work on VoiceGuard.

**These rules override convenience.** If a task instruction conflicts with a rule here, the rule wins. Flag the conflict rather than silently choosing one.

The project is a hackathon build. Optimize for **demo reliability, engineering credibility, agent-token efficiency, and controlled scope**.

---

## 1. Git / PR Workflow — Mandatory

Every implementation task belongs to a specific PR defined in `PHASES.md`.

1. Before starting, read `tasks/CURRENT.md` and confirm the specified base branch.

2. If the current PR is based on `main`, confirm that `main` is up to date before branching.

3. Create a new branch for the PR:

   `pr-<number>-<kebab-slug>`

   Example:

   `pr-04-speaker-verification`

4. Do all work for that PR — and **only** that PR's scope — on this branch.

5. Never push directly to `main`.

6. Never force-push a shared branch.

7. Never merge branches yourself.

8. Commit using conventional-commit-style messages.

   Example:

   `feat(speaker-verification): add ECAPA-TDNN embedding pipeline`

9. Keep commits logically organized. There is no requirement for exactly one commit per PR.

10. Run the verification required by the PR specification in `PHASES.md`.

11. Update `MEMORY.md` with information a future session genuinely needs.

12. Update `tasks/CURRENT.md` to point to the next PR.

13. Check the completed PR in `tasks/BACKLOG.md`.

14. Push the branch:

`git push -u origin pr-<number>-<kebab-slug>`

15. **Stop after pushing.**

Do not:

* open a GitHub PR
* merge the PR
* push to `main`
* start the next PR

The human handles the final review and merge.

---

## 2. Testing Policy — Credit Conscious

We are optimizing for **hackathon velocity without sacrificing demo reliability**.

### Always run

* linting for changed code
* type-checking where applicable
* existing unit tests for the module being changed

Only run them when they are relevant and reasonably cheap.

### `[TEST: required]`

A PR marked `[TEST: required]` in `PHASES.md` requires stronger verification.

Use this for changes involving:

* ML inference
* speaker verification
* anti-spoof/deepfake detection
* risk-engine scoring
* analysis-state logic
* WebSocket analysis flow
* demo-critical functionality

Run the full test suite or the specific test file identified by the PR specification.

### `[TEST: skip]`

Appropriate for:

* pure styling
* documentation
* non-functional UI changes
* scaffolding/configuration with no logic changes

A manual smoke test is sufficient.

### Never

* Run the entire test suite "just in case."
* Re-run unchanged tests repeatedly.
* Spend significant agent tokens on low-value test repetition.

If a test fails:

1. Determine whether the failure is caused by the current PR.
2. Fix it within the PR if it is related.
3. If it is pre-existing and unrelated, document it in `MEMORY.md` under Known Bugs.
4. Do not expand the PR's scope merely to clean up unrelated failures.

---

# 3. Product Truth — Non-Negotiable

VoiceGuard must never misrepresent what it has actually done.

### Never fabricate ML results.

If a model is not connected:

* show an explicit placeholder/mock state
* label it clearly

Never present invented numbers as genuine inference.

Bad:

`Speaker Match: 94%`

when no speaker model actually ran.

Good:

`Speaker Verification: NOT AVAILABLE`

or:

`DEMO MODE — PRECOMPUTED RESULT`

### Never fabricate threat intelligence.

The Global Threat Map must explicitly display:

`SIMULATED THREAT INTELLIGENCE`

unless it is genuinely backed by real data.

Never present fabricated locations, attack counts, statistics, or incidents as real-world intelligence.

### Never misrepresent system state.

The UI must never imply that a capability is:

* live
* real-time
* model-generated
* externally sourced
* independently verified

when it is actually:

* simulated
* precomputed
* cached
* deterministic fixture data
* Demo Mode output

The UI must clearly communicate the actual state.

---

# 4. Demo Mode

Demo Mode is a **first-class product capability**, not a hidden hack.

### Demo Mode must be deterministic.

The same scenario input must produce the same result every time.

Do not introduce randomness unless the scenario explicitly requires a randomized variant.

### Demo scenarios may contain precomputed:

* audio
* transcripts
* speaker embeddings
* model outputs
* evidence
* risk scores
* timeline events
* analyst explanations

These are acceptable because they are explicitly presented as Demo Mode data.

### Demo Mode must use the same presentation pipeline where practical.

The goal is:

```text
Demo Scenario
      ↓
Analysis Event Model
      ↓
Risk / Evidence State
      ↓
Same Dashboard
```

Do not build a completely separate fake UI that behaves differently from the real system.

### Expensive assets should be precomputed.

TTS-generated attack audio, expensive analysis outputs, transcripts, or other costly resources may be generated before the demonstration.

The live demo must not depend on regenerating them.

---

# 5. External API / Dependency Policy

### Core VoiceGuard must work with zero external AI API keys configured.

The core product must not depend on:

* LLM APIs
* TTS APIs
* STT APIs
* hosted inference APIs

for its baseline functionality.

### No external service may be a single point of failure for a demo-critical feature.

If an external service is optional, it must have a deterministic fallback.

Examples:

```text
LLM
 ↓
Live explanation
 ↓ failure
Deterministic analyst
```

```text
TTS
 ↓
Pre-generated audio
```

```text
STT
 ↓
Precomputed transcript / local processing
```

### LLM rules

The LLM:

* never makes the security decision
* never determines the threat level
* never overrides the risk engine
* receives structured analysis results
* only explains an already-existing decision

The risk engine remains authoritative.

### LLM fallback

If an LLM request:

* fails
* times out
* exceeds 3 seconds

use the deterministic analyst fallback.

The UI should indicate when the analyst is using a fallback where appropriate.

### Prefer local computation.

If something can reasonably be implemented using:

* browser APIs
* our backend
* local computation
* pretrained local models
* deterministic fixtures

do not introduce an external API merely for convenience.

---

# 6. ML Rules

### Do not train large models from scratch unless explicitly approved.

Hackathon time should be spent on:

* inference
* integration
* calibration
* thresholding
* evaluation
* reliability

rather than unnecessary model training.

### Use pretrained models where appropriate.

Potential examples:

* ECAPA-TDNN for speaker embeddings
* AASIST / RawNet2 or another suitable pretrained anti-spoof model

The final model choice must be recorded in `docs/ML.md` and/or `docs/DECISIONS.md`.

### Precompute enrolled speaker embeddings.

Do not repeatedly calculate the same enrollment embedding when it can be safely cached.

### Model outputs must be calibrated.

A raw model logit is not automatically a meaningful UI percentage.

Before displaying:

`91% Synthetic`

we must understand how that number maps to the model output.

Document thresholds and calibration decisions.

### Never silently replace real inference with fabricated inference.

If a model fails:

```text
MODEL UNAVAILABLE
```

is preferable to a fake successful result.

---

# 7. Partial Analysis & Uncertainty

VoiceGuard must understand that analysis can be incomplete.

If one or more required signals fail, time out, or become unavailable:

**Do not silently produce a normal full-confidence verdict.**

Use an explicit state such as:

`PARTIAL_ANALYSIS`

Example:

```text
Speaker Verification      ✓
Authenticity Detection    —
Risk Assessment            PARTIAL
Confidence                 REDUCED
```

The UI should identify unavailable signals.

The risk engine must account for missing signals rather than pretending they exist.

### The system must distinguish:

* `ANALYZING`
* `COMPLETE`
* `PARTIAL_ANALYSIS`
* `THREAT_DETECTED`
* `VERIFICATION_REQUIRED`
* `DEGRADED_MODE`
* `DEMO_MODE`
* `RECONNECTING`
* `INVALID_AUDIO`
* `NO_MICROPHONE`
* `ERROR`

Do not collapse meaningful states into a generic loading/error state.

---

# 8. Audio Input Validation

Audio must be validated before expensive ML inference.

Handle explicitly:

* no microphone
* microphone permission denied
* silent audio
* audio that is too short
* unsupported codec
* invalid sample rate
* corrupted input
* insufficient signal quality

The user should receive a specific explanation and a sensible next action.

Where appropriate, provide a one-click path to Demo Mode.

---

# 9. WebSocket / Real-Time Resilience

The real-time analysis connection must handle:

* dropped connections
* reconnects
* delayed events
* duplicate events
* out-of-order events where relevant

Use reconnect-with-backoff.

The UI must never silently display stale analysis as current analysis.

During a disconnect, clearly communicate:

`RECONNECTING`

or another appropriate degraded state.

---

# 10. Risk Engine Rules

The Risk Engine is the authoritative security decision layer.

It may use signals such as:

* speaker similarity
* authenticity probability
* audio anomalies
* challenge results
* other validated analysis signals

The Risk Engine must:

* be deterministic for identical inputs
* have documented thresholds
* account for missing signals
* expose reasoning/evidence
* distinguish confidence from risk
* never delegate the security decision to an LLM

### Important distinction

**Risk ≠ Confidence.**

A high risk score does not automatically mean the system is highly confident.

Both concepts must remain separate in the architecture and UI.

---

# 11. UI / UX Rules

VoiceGuard should feel like a serious security product.

The UI should be:

* heavily interactive
* responsive to system state
* visually sophisticated
* information-dense without becoming cluttered
* understandable during a live presentation

### Animations must have purpose.

Animations should communicate:

* state transitions
* incoming audio
* analysis progress
* changing risk
* threat escalation
* evidence discovery
* system response

Avoid decorative animation that adds substantial implementation cost without improving comprehension or demo impact.

### Every major action should have visible feedback.

Examples:

```text
Start Analysis
      ↓
Waveform activates
      ↓
Analysis indicators appear
      ↓
Signals arrive
      ↓
Risk changes
      ↓
Threat state changes
```

Avoid buttons that appear to do nothing while backend work occurs invisibly.

---

# 12. Golden Path

The Golden Path defined in `PRD.md` is the highest-priority user journey.

Any change affecting the Golden Path must preserve or improve its reliability.

The Golden Path should be:

* deterministic where possible
* rehearsable
* fast
* visually compelling
* independent of fragile external APIs

Other features may receive less hardening if necessary.

The Golden Path must never be sacrificed to polish secondary features.

---

# 13. Threat Timeline as Observability

The Threat Timeline should represent meaningful system events.

Where practical, backend analysis events should feed the same timeline displayed to users.

Examples:

```text
AUDIO_RECEIVED
SPEAKER_ANALYSIS_STARTED
AUTHENTICITY_ANALYSIS_STARTED
SPEAKER_MATCH_UPDATED
AUTHENTICITY_RESULT_RECEIVED
RISK_RECALCULATED
THREAT_CLASSIFIED
CHALLENGE_ISSUED
CHALLENGE_FAILED
INCIDENT_CREATED
```

Do not create meaningless events merely to make the timeline look busy.

The timeline should be useful for:

1. the user
2. the hackathon demo
3. technical debugging

---

# 14. Database / Persistence

Persistence is not allowed to become a demo-critical dependency unless explicitly approved.

For the initial hackathon version:

* SQLite
* JSON fixtures
* in-memory session state

are acceptable where appropriate.

If the database becomes unavailable:

* live analysis should continue where possible
* current session state should remain usable
* persistence/history may degrade

A database outage must not automatically destroy the Golden Path.

---

# 15. Incident Reports

Incident display and PDF export are separate concerns.

The structured incident report must be available independently of PDF generation.

Correct flow:

```text
Threat
  ↓
Incident object
  ↓
On-screen report
  ↓
Optional PDF generation
```

If PDF generation fails:

* keep the on-screen report
* show an appropriate error
* allow retry

Never block incident creation because PDF generation failed.

---

# 16. Scope Discipline

Every PR has an explicit Definition of Done in `PHASES.md`.

Build **exactly that scope**.

If the PR is completed early:

**Stop.**

Do not automatically start the next PR.

Do not:

* refactor unrelated code
* redesign unrelated UI
* introduce speculative abstractions
* add "nice-to-have" features
* fix unrelated bugs

If you notice something useful outside the current scope:

Add it to:

`tasks/BACKLOG.md`

and continue with the assigned task.

Scope creep is one of the biggest risks to the hackathon timeline.

---

# 17. Architecture Preservation

Existing architectural decisions are recorded in:

`docs/DECISIONS.md`

Do not silently override them.

If an existing decision appears incorrect:

1. Identify the problem.
2. Explain the alternative.
3. Record the proposed change.
4. Only implement it if the current PR explicitly includes that architectural change.

Do not refactor working systems merely because a different implementation looks cleaner.

---

# 18. Dependency Discipline

Do not introduce a new dependency without justification.

For every new dependency, provide a one-line justification in:

`docs/DECISIONS.md`

or the PR summary.

Before adding a dependency, consider whether the requirement can reasonably be fulfilled using:

* existing dependencies
* browser APIs
* standard library
* existing project utilities

Avoid dependency proliferation.

---

# 19. Agent Context Discipline

Agent context is a limited resource.

Use it deliberately.

Before starting a PR, read:

1. `RULES.md`
2. `PRD.md`
3. `PHASES.md`
4. `tasks/CURRENT.md`

Then read only the documentation relevant to the current PR.

Do not unnecessarily load:

* unrelated source files
* unrelated documentation
* old project history
* completed PR specifications

### Inspect before implementing.

Before creating a new component, service, utility, or abstraction:

* search for existing implementations
* understand the current architecture
* reuse working components where possible

Do not create duplicate systems because the existing implementation was not inspected.

### MEMORY.md discipline

`MEMORY.md` is project memory, not a second PRD.

Keep it concise.

Record:

* architectural discoveries
* important decisions
* known bugs
* failed approaches
* important implementation details
* information a future agent genuinely needs

Do not copy entire sections from:

* `PRD.md`
* `PHASES.md`
* `RULES.md`
* source code

If a decision deserves a permanent architectural explanation, record it in:

`docs/DECISIONS.md`

and keep only the necessary reminder in `MEMORY.md`.

Never consume agent context by exploring unrelated parts of the repository "just in case."

---

# 20. Documentation Rules

Documentation should describe the system that actually exists.

Do not document planned functionality as completed functionality.

When an architectural change is made:

**Update the relevant documentation in the same PR.**

At minimum, consider whether the change affects:

* `PRD.md`
* `PHASES.md`
* `MEMORY.md`
* `docs/ARCHITECTURE.md`
* `docs/UI_UX.md`
* `docs/ML.md`
* `docs/DECISIONS.md`

Do not create documentation solely for the sake of having more documentation.

---

# 21. Security & Privacy

VoiceGuard is a security product demonstration.

Therefore:

* Do not log raw microphone audio unnecessarily.
* Do not expose secrets or API keys to the frontend.
* Do not commit credentials.
* Do not hardcode API keys.
* Validate uploaded audio.
* Treat user-provided audio as untrusted input.
* Keep external API credentials server-side.
* Clearly distinguish demo data from real user data.
* Do not claim production-grade security unless it has actually been implemented and tested.

---

# 22. Error Handling Philosophy

Errors should degrade gracefully whenever possible.

Prefer:

```text
FEATURE UNAVAILABLE
       ↓
Explain why
       ↓
Provide fallback
       ↓
Continue session
```

over:

```text
ERROR
 ↓
Entire application crashes
```

A failure in:

* LLM
* TTS
* STT
* database
* PDF generation
* one ML signal
* WebSocket connection

should affect only the functionality that actually depends on it.

Do not allow optional systems to become cascading failures.

---

# 23. When Something Is Ambiguous

If the task is ambiguous:

1. Check `PRD.md`.
2. Check `PHASES.md`.
3. Check `docs/DECISIONS.md`.
4. Check `MEMORY.md`.
5. Choose the most reasonable interpretation consistent with those documents.
6. Record the assumption in the PR summary if it materially affects the implementation.

Do not block on questions unless the ambiguity could cause the wrong system to be built entirely.

Do not invent requirements that contradict the existing product specification.

---

# 24. Definition of Done

A PR is not complete merely because the code compiles.

Before declaring completion:

* The requested functionality exists.
* The implementation stays within PR scope.
* Relevant tests/verification have passed.
* The Golden Path remains functional if affected.
* No secrets were introduced.
* New dependencies are justified.
* Relevant documentation is updated.
* `MEMORY.md` contains important discoveries.
* `tasks/CURRENT.md` is updated.
* `tasks/BACKLOG.md` is updated.
* The branch is pushed.
* The agent stops and reports what is ready for human review.

---

# 25. The Core VoiceGuard Principle

Above everything else:

> **VoiceGuard must be technically honest, demo-reliable, and resilient to failure.**

We would rather show:

`PARTIAL ANALYSIS`

than fabricate certainty.

We would rather show:

`DEMO MODE`

than pretend simulated data is real.

We would rather use:

`DETERMINISTIC ANALYST`

than make the entire demonstration depend on an LLM quota.

We would rather have **10 excellent interactions** than 50 broken features.

And we would rather stop at the end of the assigned PR than allow an agent to consume the remaining hackathon time "improving" things nobody asked for.
  