# Caply Video Generation Flow

This document maps the complete video generation pipeline from UI click to final MP4 output.

---

## 1. Frontend — User Interface & Initiation

**File:** `caply/src/App.tsx`

### `generate()` (lines 146–189)
Triggered when the user clicks "Create Story". It:
1. Uploads photos via `POST /upload/photos`.
2. Uploads audio (if any) via `POST /upload/audio`.
3. Sends render request via `POST /render` with all settings (duration, style, quality, aspect, audio settings, fps, bitrate, transition).
4. Receives a `jobId` and starts polling server status every 2 seconds.

### `pollStatus()` (lines 130–138)
Polls `GET /status/:jobId`. When `status === "done"` it sets the output URL so the `<video>` tag can show the result.

### `handleExport()` (lines 191–203)
Triggered when the user clicks "Download MP4". Fetches the final video blob from the server and triggers a browser download.

---

## 2. Backend — Express API & Job Orchestration

**File:** `caply-server/server.js`

### Endpoints
- `POST /upload/photos` — receives multipart images, stores them under `uploads/`.
- `POST /upload/audio` — receives multipart audio file, stores it under `uploads/`.
- `POST /render` — validates input, creates a `jobId`, responds immediately, then spawns the render process asynchronously via `setImmediate`.
- `GET /status/:jobId` — checks if `outputs/:jobId.mp4` exists; if not, returns the current `jobStatus` Map entry.
- `DELETE /job/:jobId` — deletes the output file and kills the active FFmpeg process if still running.

### FFmpeg Verification
On startup the server verifies that FFmpeg is available via `ffmpeg-static` and exits if not found.

---

## 3. Backend — FFmpeg Video Renderer

**File:** `caply-server/renderer.js`

### `renderVideo(job)` (lines 42–116)
This is the core generator. It builds an FFmpeg command that produces the final MP4.

#### Steps performed:
1. **Resolve parameters**
   - `totalDuration` from `durationLabel` (e.g. "30s").
   - `resolution` from `quality` + `aspect`.
   - `fps`, `bitrate` from settings or defaults.
   - `perImage = totalDuration / imagePaths.length`.

2. **Build concat demuxer file** (`concat.txt`)
   - Lists every image with its display duration.
   - Repeats the last image+duration so FFmpeg knows the total length.
   - Saved under `uploads/:jobId/concat.txt`.

3. **Video filter (`-vf`)**
   - Scales each image to the target resolution while preserving aspect ratio.
   - Pads with black bars (`pad=…:black`) to fill the frame.
   - Converts to YUV420p for compatibility.
   - If more than one image and transition is not `"none"`, applies fade in/out (`fade=t=in…,fade=t=out…`).

4. **Video encoding**
   - `libx264`, target bitrate, fast preset, `+faststart` for web playback.
   - Capped to `totalDuration` with `-t`.

5. **Audio pipeline (optional)**
   - Adds second input `-i audioPath`.
   - Applies audio filters in order:
     - `atrim` (trim start/end)
     - `aloop` (loop if enabled)
     - `afade` (fade in at 0, fade out at `totalDuration - fadeOut`)
     - `volume`
   - Encodes to AAC 192 kbps / 48 kHz.
   - `-shortest` ensures output stops when the video ends.

6. **Progress tracking**
   - Parses FFmpeg stderr for `time=HH:MM:SS.ms`.
   - Computes `pct = (currentTime / totalDuration) * 100`.
   - Updates `jobStatus` Map so `/status/:jobId` reflects live progress.

7. **Output**
   - Saves final file to `outputs/:jobId.mp4`.

---

## 4. Supporting Files

| File | Role |
|------|------|
| `caply-server/utils.js` | `parseDurationToSeconds`, `getResolution`, `getFps`, `getBitrate` helpers. |
| `caply-server/constants.js` | `UPLOAD_DIR` and `OUTPUT_DIR` paths. |
| `caply_ai_video_creator.jsx` | Older standalone UI mock (no real backend integration). |

---

## Quick Reference: FFmpeg Args Built by `renderVideo`

```text
-f concat -safe 0 -i uploads/:jobId/concat.txt
-vf "fps=30,scale=W:H:force_original_aspect_ratio=decrease,pad=W:H:(ow-iw)/2:(oh-ih)/2:black,format=yuv420p[,fade=t=in:st=0:d=0.6,fade=t=out:st=X:d=0.6]"
-r 30
-c:v libx264
-b:v 8M
-preset fast
-pix_fmt yuv420p
-movflags +faststart
-t <totalDuration>
[-i audio.mp3]
[-af "atrim=start=0,atrim=end=30,aloop=loop=-1:size=2e+09,afade=t=in:st=0:d=1,afade=t=out:st=29:d=1,volume=1"]
[-shortest]
[-c:a aac]
[-b:a 192k]
[-ar 48000]
outputs/:jobId.mp4
```
