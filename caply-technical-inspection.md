# Caply Technical Inspection (React/Vite)

Scope: inspection only, no code modifications.

## 1) File Map

### Media upload
- `src/components/CaplyApp.tsx`
  - Central drop zone (`onDrop`) and routes files to `caply.onFilesAdd`.
- `src/components/MediaInput.tsx`
  - Main upload UI used by `CaplyApp` (file picker, progress UI, media preview/remove).
- `src/hooks/useCaply.ts`
  - Core upload state and handlers: `onFilesAdd`, `handlePhotos`, `handleAudio`, `removePhoto`, `removeVideo`, `removeAudio`.
  - Trigger for backend upload during generate: `uploadPhotos(...)`, `uploadAudio(...)`.
- `src/services/api.ts`
  - Transport layer for uploads via XHR: `uploadPhotos`, `uploadAudio`.
- `server/server.js`
  - Upload endpoint implementation with multer: `POST /upload/photos`.

### Timeline UI
- `src/components/MediaInput.tsx`
  - Current active media strip/grid preview used in app shell.
- `src/components/EditorUI.tsx`
  - Alternative timeline-like UI (video track + audio track) but not the active shell used by `App`.
- `src/hooks/useCaply.ts`
  - Timeline data source: `allMedia`, `mediaCount`, remove handlers, placeholder `reorderMedia`.

### Render/export flow
- `src/hooks/useCaply.ts`
  - `generate()` orchestrates upload -> start render -> polling.
  - `pollStatus()` tracks `GET /status/:id` and updates progress/phase.
  - `handleExport()` downloads final video.
- `src/services/api.ts`
  - `startRender`, `getStatus`, `downloadBlob`.
- `server/server.js`
  - `POST /render`, `GET /status/:id`, static `/outputs`.
- `server/renderer.js`
  - FFmpeg pipeline (`renderVideo`, `runFFmpeg`) and job progress publication (`jobStatus`).

### API calls
- `src/services/api.ts`
  - All client API calls are centralized here.
- `src/hooks/useCaply.ts`
  - Only consumer/orchestrator of those API calls.

### Server endpoints
- `POST /upload/photos` in `server/server.js`
- `POST /render` in `server/server.js`
- `GET /status/:id` in `server/server.js`
- Static assets:
  - `GET /uploads/*`
  - `GET /outputs/*`

## 2) Current Problems

1. Parameter mismatch between frontend and renderer (High)
- In `useCaply.ts`, render request sends `fps` and `bitrate`.
- In `server/renderer.js`, renderVideo expects `targetFps` and `targetBitrate`.
- Effect: custom FPS/bitrate from UI may be silently ignored and defaults used.

2. Endpoint naming inconsistency for audio upload (Medium)
- `uploadAudio()` posts to `/upload/photos` instead of a dedicated `/upload/audio`.
- It works only because backend route accepts both `files` and `audio` in same endpoint.
- Effect: unclear API contract, harder maintenance, easy breakage if backend is split later.

3. Render progress model is inconsistent (Medium)
- `pollStatus()` maps server processing progress into `50 + progress/2`.
- This creates an artificial 50-100 scale and can feel inaccurate/jumpy to users.

4. Retry logic likely stale-state bug (Medium)
- In `pollStatus()`, `retryCount` is read from closure while incrementing asynchronously.
- Stop condition `if (retryCount >= 10)` can lag and not stop exactly when intended.

5. Inactive/duplicate UI paths increase ambiguity (Low/Medium)
- `src/components/EditorUI.tsx` contains a full alternative editor/timeline but app entry is `CaplyApp`.
- Duplicate files also exist at repo root (`MediaInput.jsx`, `UploadBlock.tsx`) and under `src/components/upload/*`.
- Effect: onboarding friction and risk of editing wrong component.

6. Cleanup routine can fail on nested upload dirs (Low)
- `cleanupOldFiles()` uses `fs.unlink` for each entry; render writes directories like `uploads/<jobId>/concat.txt`.
- If cleanup reaches a directory entry, unlink may error (non-fatal but noisy).

7. Text encoding artifacts (Low)
- Multiple files show mojibake (`Ã`, `â€¦`) in comments/strings.
- Not critical to runtime but reduces maintainability.

## 3) Safest First Change

Safest first change: align render request field names between frontend and backend.

Why this first:
- High functional impact (ensures user-selected FPS/bitrate are honored).
- Very low blast radius (small, localized change).
- No UX redesign needed.

## 4) Exact Files That Should Be Edited

For the safest first change:
- `server/renderer.js`
  - Accept both `fps/bitrate` and `targetFps/targetBitrate` for backward compatibility.

Optional follow-up (still low risk):
- `src/services/api.ts`
  - Keep request shape explicit and documented (or migrate to canonical backend field names).
- `src/types/caply.ts` (only if adding stricter API typing there)
  - Reflect canonical render request fields.

For next issues:
- API contract clarity:
  - `server/server.js` (add dedicated `POST /upload/audio` or rename existing endpoint semantics)
  - `src/services/api.ts` (point `uploadAudio` to the dedicated endpoint)
- Retry/progress robustness:
  - `src/hooks/useCaply.ts` (retry logic and progress mapping)
- Structural cleanup:
  - `src/components/EditorUI.tsx` and duplicate root/UI files (`MediaInput.jsx`, `UploadBlock.tsx`, `src/components/upload/*`) after deciding canonical path.
- Cleanup robustness:
  - `server/server.js` cleanup function (`rm` recursive-safe handling for dirs).

## 5) Risk Level Per Change

1. Render field-name alignment (`server/renderer.js`)
- Risk: Low
- Reason: isolated logic, backward-compatible parsing possible.

2. Dedicated audio endpoint (`server/server.js` + `src/services/api.ts`)
- Risk: Medium
- Reason: contract change across client/server; needs endpoint coexistence during migration.

3. Retry logic fix (`src/hooks/useCaply.ts`)
- Risk: Low
- Reason: local state-handling fix; easy to verify with forced network errors.

4. Progress mapping adjustment (`src/hooks/useCaply.ts`)
- Risk: Low/Medium
- Reason: user-facing behavior change, but no backend impact.

5. Remove/merge duplicate UI flows (`src/components/*` + root duplicates)
- Risk: Medium/High
- Reason: high chance of accidental regression if wrong component path is removed.

6. Cleanup recursive-safe deletion (`server/server.js`)
- Risk: Low
- Reason: maintenance-only if implemented conservatively with directory checks.

7. Encoding cleanup (`*.tsx/*.js` affected)
- Risk: Low
- Reason: mostly non-functional text normalization.
