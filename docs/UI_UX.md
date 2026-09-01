# UI_UX.md — VoiceGuard Interface & Experience Specification

## 1. Design Objective

VoiceGuard should feel like a **professional voice-security operations center combined with an audio-forensics laboratory**.

The interface must communicate:

> "A security system is actively examining this voice and building an evidence-backed trust decision."

It should NOT feel like:

* a generic SaaS dashboard
* a banking dashboard
* a basic audio recorder
* a chatbot
* a collection of unrelated cards
* a fake hacker movie interface

The visual complexity should come from **meaningful system activity**.

Every important animation should communicate:

* state
* evidence
* progression
* threat
* confidence
* system response

---

# 2. Visual Direction

## Overall aesthetic

**Dark cybersecurity operations center + audio forensics laboratory.**

Characteristics:

* dark background
* high contrast
* restrained accent colors
* glowing data visualizations
* glass/panel layering
* fine grid or technical background elements
* waveform/spectrogram visualization
* compact technical typography
* animated system states
* dense but organized information

The UI should feel sophisticated rather than overloaded.

---

# 3. Color Semantics

Colors communicate system state and must be consistent.

### Low Risk

Use a calm green/teal treatment.

Meaning:

```text
TRUSTED
LOW RISK
AUTHENTIC
VERIFIED
```

### Moderate Risk

Use amber/yellow.

Meaning:

```text
CAUTION
UNCERTAIN
ADDITIONAL VERIFICATION
```

### High Risk

Use orange.

Meaning:

```text
SUSPICIOUS
POTENTIAL IMPERSONATION
CHALLENGE REQUIRED
```

### Critical Risk

Use red.

Meaning:

```text
THREAT
LIKELY SYNTHETIC
IMPERSONATION DETECTED
SESSION BLOCKED
```

### Neutral/System

Use muted cool tones.

Meaning:

```text
IDLE
ANALYZING
WAITING
OFFLINE
RECONNECTING
```

Color must never be the only indicator of state. Text, icons and/or visual structure must reinforce it.

---

# 4. Main Application Layout

The primary dashboard should use a multi-panel operations-center layout.

Conceptually:

```text
┌─────────────────────────────────────────────────────────────┐
│ VOICEGUARD                         LIVE ●   DEMO / LIVE      │
├───────────────┬─────────────────────────────┬───────────────┤
│               │                             │               │
│ SYSTEM        │      LIVE AUDIO             │   RISK        │
│ STATUS        │      WAVEFORM               │   SCORE       │
│               │                             │               │
│ PIPELINE      │      SPECTROGRAM            │   00          │
│               │                             │               │
│               ├─────────────────────────────┤   LEVEL       │
│               │                             │               │
│               │      ANALYSIS SIGNALS       │               │
│               │                             │               │
├───────────────┴─────────────────────────────┴───────────────┤
│ THREAT TIMELINE / EVENTS                                    │
├─────────────────────────────────────────────────────────────┤
│ SPEAKER │ AUTHENTICITY │ EVIDENCE │ CHALLENGE │ INCIDENT    │
└─────────────────────────────────────────────────────────────┘
```

The exact grid can evolve during implementation, but the information hierarchy should remain.

---

# 5. Global Header

The header should always communicate system identity and operating state.

### Required elements

* VoiceGuard logo/name
* current system state
* Live / Demo mode
* connection status
* optional analyst status
* session identifier

Example:

```text
VOICEGUARD
VOICE SECURITY OPERATIONS

● SYSTEM ONLINE
MODE: LIVE
ANALYSIS CHANNEL: CONNECTED
```

When operating in Demo Mode:

```text
MODE: DEMO
DETERMINISTIC SCENARIO
```

The Demo indicator must never be hidden.

---

# 6. Persistent Mode / Fallback Indicator

A persistent status badge should exist somewhere in the primary UI.

Possible states:

```text
LIVE
DEMO MODE
PARTIAL ANALYSIS
RECONNECTING
ANALYST FALLBACK
DATABASE OFFLINE
```

Examples:

```text
● LIVE ANALYSIS
```

```text
◆ DEMO MODE
```

```text
⚠ PARTIAL ANALYSIS
```

```text
↻ RECONNECTING
```

The system must never silently degrade.

---

# 7. System State Machine UI

The dashboard should visually progress through analysis states.

### IDLE

Display:

```text
READY FOR VOICE ANALYSIS
Awaiting audio input
```

The interface should feel calm.

---

### RECORDING

The waveform becomes active.

Display:

```text
● RECORDING
Listening...
```

The recording control should visibly respond to microphone activity.

---

### ANALYZING

The dashboard transitions into forensic-analysis mode.

Possible visual sequence:

```text
AUDIO CAPTURE
     ↓
PREPROCESSING
     ↓
SPEAKER ANALYSIS
     ↓
AUTHENTICITY ANALYSIS
     ↓
RISK ENGINE
```

Individual pipeline stages should activate as they execute.

---

### PARTIAL ANALYSIS

This state must be visually distinct.

Example:

```text
⚠ PARTIAL ANALYSIS

Speaker verification       ✓ COMPLETE
Authenticity detection     ⚠ UNAVAILABLE
Risk assessment            LIMITED CONFIDENCE
```

Never show the interface as if a complete analysis occurred.

---

### COMPLETE

The dashboard settles into the final evidence state.

Panels animate from "processing" into their final values.

---

# 8. Live Audio Panel

The audio panel is one of the visual centerpieces.

It contains:

### Waveform

Real-time amplitude visualization.

During recording:

* continuously reacts to microphone input
* smoothly animates
* indicates silence/activity

During analysis:

* freezes or transitions into analysis visualization

### Spectrogram

Shows frequency information over time.

The spectrogram should make the system visibly feel like it is examining the audio rather than simply recording it.

---

# 9. Risk Score Visualization

The risk score is the most important single visual element.

It should be immediately understandable.

Example:

```text
        IMPERSONATION RISK

             87
          CRITICAL

     ████████████████████
```

The score should animate into position rather than instantly appearing.

### Risk transition

For example:

```text
ANALYZING
   ↓
34
   ↓
52
   ↓
71
   ↓
87
CRITICAL
```

The animation should communicate escalation.

Do not artificially animate a score through fake intermediate values during real analysis if those values were not actually computed.

For deterministic Demo Mode, controlled transitions are allowed because they are part of the deterministic fixture presentation.

---

# 10. Speaker Identity Card

Display:

```text
SPEAKER VERIFICATION

ENROLLED SPEAKER
Abhimanyu / Speaker 01

MATCH
94%

STATUS
MATCHED
```

For an unknown speaker:

```text
SPEAKER VERIFICATION

UNKNOWN SPEAKER

MATCH
18%

STATUS
NOT VERIFIED
```

The card should distinguish:

**identity match**

from

**authenticity**.

This distinction is fundamental to VoiceGuard.

---

# 11. Authenticity Card

Display:

```text
VOICE AUTHENTICITY

HUMAN
91%

SYNTHETIC
9%

STATUS
AUTHENTIC
```

For a clone:

```text
VOICE AUTHENTICITY

HUMAN
8%

SYNTHETIC
92%

STATUS
SYNTHETIC LIKELY
```

Never imply that a number came from ML if it is actually simulated.

---

# 12. The Core Visual Concept — Identity ≠ Authenticity

The dashboard should make the central product insight visually obvious.

A particularly important state is:

```text
SPEAKER MATCH
96% ✓

AUTHENTICITY
91% SYNTHETIC ⚠

──────────────────

IDENTITY MATCHED
BUT VOICE APPEARS SYNTHETIC

LIKELY VOICE CLONING ATTACK
```

This is the key "aha" moment of the product.

The system is not merely asking:

> "Does this sound like the enrolled person?"

It is asking:

> "Can this voice be trusted?"

---

# 13. WHY? — Explainability Panel

A prominent `WHY?` action should be available after analysis.

Clicking it should expand a detailed evidence view.

Example:

```text
WHY IS THIS HIGH RISK?

Speaker similarity            94%
Synthetic probability         91%
Spectral anomalies            HIGH
Prosody consistency           LOW
Temporal artifacts            DETECTED
```

Each evidence item should be interactive.

Clicking an item can highlight the relevant visualization.

For example:

```text
Synthetic probability
        ↓
Spectrogram region highlighted
        ↓
Explanation appears
```

The goal is to create a connection:

**Model signal → Evidence → Decision**

rather than displaying unexplained numbers.

---

# 14. Evidence Visualization

Evidence should be visually connected to the audio.

Potential interactions:

### Spectrogram selection

Selecting an anomaly can highlight a region of the spectrogram.

### Timeline event

Selecting:

```text
AUTHENTICITY ANOMALY DETECTED
```

moves the visualization to the corresponding moment.

### Speaker similarity

Selecting speaker verification highlights the embedding visualization.

This makes the dashboard feel like an investigation rather than a static report.

---

# 15. Threat Timeline

The timeline should represent the progression of the security investigation.

Example:

```text
● Voice detected
│
● Audio captured
│
● Speaker identified
│
● Authenticity analysis started
│
● Synthetic artifacts detected
│
● Risk elevated
│
● Threat confirmed
│
● Caller challenge issued
│
● Session blocked
```

Timeline events should be clickable.

Clicking an event changes the relevant dashboard state.

This allows the judge to scrub backward and see **why the system reached its decision**.

---

# 16. Attack Simulator

The Attack Simulator should feel like an attack being launched against the system.

Example:

```text
ATTACK SIMULATOR

SELECT ATTACK

[ Genuine Voice ]
[ AI Voice Clone ]
[ Replay Attack ]
[ Unknown Speaker ]

                 [ LAUNCH ATTACK ]
```

Launching an attack should not simply change a number.

The entire dashboard should react.

Example:

```text
ATTACK LAUNCHED
       ↓
Incoming voice detected
       ↓
Speaker match: HIGH
       ↓
Authenticity: SUSPICIOUS
       ↓
Risk escalating
       ↓
THREAT CONFIRMED
       ↓
CHALLENGE REQUIRED
```

This is one of the primary visual "wow" moments.

---

# 17. Security Challenge

When risk crosses the configured threshold:

```text
╔════════════════════════════════╗
║ CALLER VERIFICATION REQUIRED   ║
║                                ║
║ Please repeat:                 ║
║                                ║
║ "Blue mountains remember rain" ║
║                                ║
║ [ START CHALLENGE ]             ║
╚════════════════════════════════╝
```

The challenge should feel like an active defense mechanism rather than another form.

After response:

```text
ANALYZING RESPONSE...

Speaker integrity       ✓
Authenticity            ✗
Challenge integrity     ✗

VERIFICATION FAILED
```

---

# 18. Incident Report

The incident report should visually resemble a professional security incident record.

Sections:

```text
INCIDENT #VG-00042

THREAT
AI VOICE IMPERSONATION

SEVERITY
CRITICAL

IDENTITY MATCH
96%

AUTHENTICITY
92% SYNTHETIC

RISK
91 / 100

EVIDENCE
...

RECOMMENDED ACTION
BLOCK SESSION

TIMELINE
...
```

The report should be generated from actual analysis data.

---

# 19. Attack History

History should resemble a security operations event log.

Example:

```text
ATTACK HISTORY

CRITICAL   AI CLONE       18:42
HIGH       REPLAY         18:37
LOW        VERIFIED       18:31
MODERATE   UNKNOWN       18:25
```

Rows should be clickable.

Clicking one opens the corresponding incident.

---

# 20. Voice Fingerprint

The Voice Fingerprint panel uses the actual speaker embeddings.

Use a 2D visualization.

Concept:

```text
             ● ●
          ● ●
       ●
                         ×
                         ×
                  ×

       ENROLLED SPEAKER
       COMPARISON
       IMPOSTOR
```

The visualization should animate when new embeddings arrive.

It should communicate:

* clustering
* similarity
* separation
* outliers

This is not decorative data.

---

# 21. Global Threat Map

The world map is a visual context component.

It may use simulated data.

The map must visibly display:

```text
SIMULATED THREAT INTELLIGENCE
```

Never present simulated activity as real global threat intelligence.

Interaction:

* hover → country activity
* click → example incident
* animated activity indicators

The map is supporting visual depth, not the core security decision.

---

# 22. AI Security Analyst

If implemented, the Analyst appears as an optional investigation assistant.

Example:

```text
AI SECURITY ANALYST

THREAT ASSESSMENT

The speaker strongly matches the enrolled
identity, but the authenticity model detected
features consistent with synthetic generation.

Recommended action:
Require caller verification.
```

The analyst must clearly communicate its role:

```text
ANALYSIS EXPLANATION
NOT SECURITY AUTHORITY
```

If the LLM is unavailable:

```text
ANALYST: DETERMINISTIC FALLBACK
```

The fallback should still provide useful information.

---

# 23. Call Simulator

The optional call interface should feel like an incoming secure-call console.

Example:

```text
INCOMING CALL

UNKNOWN CALLER

VOICE SECURITY:
ANALYSIS PENDING

[ ACCEPT ]      [ DECLINE ]
```

Accepting the call transitions into the existing VoiceGuard pipeline.

It must not create a second independent analysis system.

---

# 24. Demo Mode UX

Demo Mode must be obvious.

Header:

```text
◆ DEMO MODE
```

Scenario panel:

```text
DEMO SCENARIOS

● Genuine Voice
● AI Voice Clone
● Replay Attack
● Unknown Speaker
```

Each scenario should have:

* description
* expected threat type
* launch action

Switching scenarios should not require a page reload.

---

# 25. Interaction Principles

## Principle 1 — Everything important should react

If the system changes state, the UI should communicate it.

Examples:

```text
ML starts
→ analysis indicators activate

Risk increases
→ risk visualization changes

Threat confirmed
→ threat panels activate

Challenge triggered
→ security-action panel appears
```

---

## Principle 2 — Avoid animation for decoration

Do not animate something simply because animation is possible.

Every meaningful animation should answer:

> "What system state does this communicate?"

---

## Principle 3 — Progressive disclosure

Do not show every piece of information simultaneously.

Primary view:

```text
Risk
Speaker
Authenticity
Audio
System state
```

Secondary detail:

```text
WHY?
Evidence
Timeline
Fingerprint
Incident
```

Advanced information should appear through interaction.

---

# 26. Loading and Analysis Experience

Avoid generic:

```text
Loading...
```

Instead use meaningful system states.

Example:

```text
● CAPTURE COMPLETE

01  PREPROCESSING       ✓
02  SPEAKER ANALYSIS   ✓
03  AUTHENTICITY       ●
04  RISK ENGINE        ○
05  DECISION           ○
```

This makes waiting feel like analysis rather than latency.

---

# 27. Error UX

Errors must be specific.

Bad:

```text
Something went wrong.
```

Good:

```text
MICROPHONE ACCESS DENIED

VoiceGuard cannot access your microphone.

Allow microphone access or use
Upload Audio instead.

[ TRY AGAIN ] [ UPLOAD AUDIO ]
```

Another example:

```text
NO AUDIO DEVICE DETECTED

No microphone was found.

You can still run Demo Mode.

[ OPEN DEMO MODE ]
```

---

# 28. Degraded States

Degradation should be visible but non-destructive.

Example:

```text
⚠ PARTIAL ANALYSIS

Authenticity model unavailable.

Speaker verification completed,
but the final risk assessment has
reduced confidence.

[ VIEW DETAILS ]
```

The interface should communicate that the system knows something went wrong.

---

# 29. WebSocket Disconnect

Never leave stale data looking live.

Display:

```text
↻ CONNECTION LOST

Reconnecting to analysis stream...

Last update:
2.4 seconds ago
```

When restored:

```text
✓ CONNECTION RESTORED
```

---

# 30. Responsive Design

Desktop is the primary target because the hackathon demonstration will likely use a large screen.

Priority:

1. Desktop
2. Laptop
3. Tablet

Mobile layout is not a project requirement.

The UI should still avoid hard-coded dimensions that make the desktop experience fragile.

---

# 31. Accessibility

Even though this is a visually intense application:

* text must remain readable
* important information cannot rely only on color
* buttons require clear labels
* keyboard interaction should work for critical controls
* animations should not prevent interaction
* contrast must remain sufficient

Accessibility should not destroy the visual aesthetic.

---

# 32. Performance Rules

The UI must remain responsive while audio/ML operations run.

Avoid:

* unnecessary re-renders
* excessive DOM animation
* huge visualization datasets
* expensive effects running continuously
* animation loops that continue when components are hidden

Real-time visualizations should be optimized independently from ML inference.

---

# 33. "Wow" Moments

The following moments should receive disproportionate polish.

### Wow Moment 1 — Live Audio

Judge speaks.

```text
MIC INPUT
     ↓
LIVE WAVEFORM
     ↓
SPECTROGRAM
```

The interface visibly reacts to their voice.

---

### Wow Moment 2 — AI Clone Attack

Launch:

```text
AI VOICE CLONE
```

The dashboard transitions through:

```text
VOICE DETECTED
      ↓
SPEAKER MATCH: 96%
      ↓
AUTHENTICITY: 91% SYNTHETIC
      ↓
RISK: CRITICAL
```

The key message appears:

```text
IDENTITY MATCHED
AUTHENTICITY FAILED
```

---

### Wow Moment 3 — WHY?

Judge clicks `WHY?`.

Evidence expands.

The relevant spectrogram regions and analysis signals become visually connected.

---

### Wow Moment 4 — Active Defense

The system responds:

```text
CALLER VERIFICATION REQUIRED
```

A challenge is issued.

The response fails.

The system escalates:

```text
THREAT CONFIRMED
SESSION BLOCKED
```

---

### Wow Moment 5 — Investigation

The judge opens the timeline.

They scrub through the incident and watch the dashboard reconstruct the decision.

This should communicate that VoiceGuard is not simply producing a number — it is building an evidence trail.

---

# 34. Demo Reliability Rules

The UI must always have a usable state.

Never allow:

* blank dashboard
* infinite spinner
* invisible fallback
* stale live-looking data
* unexplained numerical changes
* fake ML output presented as real
* simulated threat data presented as real

If something fails, the interface should explain the state and provide the best available fallback.

---

# 35. Core UX Hierarchy

When screen space is limited, prioritize:

```text
1. Risk
2. Threat status
3. Speaker verification
4. Authenticity detection
5. Audio visualization
6. WHY / Evidence
7. Timeline
8. Security Challenge
9. Incident Report
10. History
11. Voice Fingerprint
12. Threat Map
13. AI Analyst
```

Tier 1 functionality must remain visually dominant over Tier 3/4 features.

---

# 36. Final UX Principle

VoiceGuard should make the judge feel like they are watching a security investigation happen in real time.

The desired mental sequence is:

```text
"I spoke."
      ↓
"It heard me."
      ↓
"It identified the speaker."
      ↓
"It checked whether the audio was genuine."
      ↓
"It found something suspicious."
      ↓
"It explained why."
      ↓
"It challenged the caller."
      ↓
"It confirmed the threat."
      ↓
"It recorded the incident."
```

The interface succeeds when the entire security story is understandable **without requiring the presenter to explain every panel**.
