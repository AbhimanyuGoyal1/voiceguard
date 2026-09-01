# CURRENT.md — Current Agent Task

> This file is the immediate source of truth for what the next agent should work on.
> `PHASES.md` defines the roadmap; this file defines the current work.

## Project Status

**Project:** VoiceGuard
**Stage:** Phase 1 — Audio Foundation
**Current PR:** PR-02
**Current Branch:** `pr-02-audio-visualization`

---

## Current Task

### PR-02 — Live Waveform + Spectrogram

**Tier:** T1 — Audio Foundation
**Test:** `[TEST: skip]`

Implement client-side browser audio capture, recording controls, audio upload (file picker and drag/drop), and strict client-side audio validation.

### Scope

* Microphone permission handling & recording (start, pause/stop, re-record).
* Upload support (drag/drop and file picker) for `.wav`, `.mp3`, `.ogg`, `.webm`, `.m4a`, `.flac`.
* Client-side audio validation using Web Audio API:
  - Microphone permission denied (specific guidance).
  - No microphone/device found.
  - Unsupported audio formats.
  - Empty audio (0 bytes).
  - Audio too short (< 1.5s).
  - Silence-only audio (RMS amplitude check below threshold).
* Audio playback/review widget with waveform playback preview and metadata (duration, sample rate, channels, file size).
* Clean state output: Validated `AudioData` object (Blob, URL, metadata, PCM buffer).
* Zero backend calls in PR-01 per `PHASES.md`.

---

## Definition of Done

PR-01 is complete when:

* [ ] User can Record → Stop → Review → Re-record.
* [ ] User can Upload (picker or drag/drop) → Validate → Review.
* [ ] Specific validation errors are shown for:
  - Permission denied
  - No mic found
  - Audio too short (<1.5s)
  - Silence only
  - Empty or invalid audio file
* [ ] Audio preview player with play/pause/scrub works.
* [ ] Validated audio Blob & metadata are held in frontend state ready for PR-02/PR-03.
* [ ] No backend API calls made for audio processing yet.
* [ ] `npm run build` succeeds without lint or type errors.
* [ ] `MEMORY.md` is updated.
* [ ] `CURRENT.md` is updated for PR-02.
* [ ] PR branch pushed and execution stops for review.

---

## Files Expected to Change

Primarily:

```text
/frontend/src/types/audio.ts
/frontend/src/lib/audio-validator.ts
/frontend/src/hooks/use-audio-recorder.ts
/frontend/src/components/audio/audio-capture.tsx
/frontend/src/components/audio/audio-player.tsx
/frontend/src/app/page.tsx
/MEMORY.md
/tasks/CURRENT.md
```

---

## Next PR

After PR-01 is completed and reviewed:

**PR-02 — Live Waveform + Spectrogram**
Branch: `pr-02-audio-visualization`
