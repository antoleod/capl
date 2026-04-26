import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { UPLOAD_DIR, OUTPUT_DIR } from './constants.js';
import { renderVideo, activeJobs } from './renderer.js';
import { parseDurationToSeconds } from './utils.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/outputs', express.static(OUTPUT_DIR));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const sid = req.headers['x-session-id'] || uuidv4();
    const dir = join(UPLOAD_DIR, sid);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}${extname(file.originalname)}`);
  },
});

const upload = multer({ storage, limits: { fileSize: 500 * 1024 * 1024 } });

// Health check
app.get('/health', (_req, res) => res.json({ ok: true, ffmpeg: true }));

// Upload photos (multipart)
app.post('/upload/photos', upload.array('photos', 100), (req, res) => {
  try {
    const files = (req.files || []).map((f) => f.path);
    res.json({ ok: true, files });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Upload audio (multipart)
app.post('/upload/audio', upload.single('audio'), (req, res) => {
  try {
    res.json({ ok: true, file: req.file?.path });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Render endpoint
app.post('/render', async (req, res) => {
  try {
    const jobId = uuidv4();
    const {
      imagePaths,
      audioPath,
      durationLabel,
      style,
      quality,
      aspect,
      audioSettings,
      fps,
      bitrate,
      transition,
    } = req.body;

    if (!imagePaths || imagePaths.length === 0) {
      return res.status(400).json({ ok: false, error: 'No images provided.' });
    }

    const totalDuration = parseDurationToSeconds(durationLabel);
    if (totalDuration <= 0) {
      return res.status(400).json({ ok: false, error: 'Invalid duration.' });
    }

    const job = {
      id: jobId,
      imagePaths,
      audioPath,
      durationLabel,
      style,
      quality,
      aspect,
      audioSettings,
      targetFps: fps,
      targetBitrate: bitrate,
      transition,
    };

    res.json({ ok: true, jobId, status: 'processing' });

    // Start render after response
    setImmediate(async () => {
      try {
        const outputPath = await renderVideo(job);
        const outputUrl = `/outputs/${jobId}.mp4`;
        console.log(`[${jobId}] Done: ${outputPath}`);
        // You can store in a DB or notify via websocket; for now, poll GET /status/:id
      } catch (err) {
        console.error(`[${jobId}] Render failed:`, err.message);
      }
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Poll status
app.get('/status/:jobId', (req, res) => {
  const { jobId } = req.params;
  const outputFile = join(OUTPUT_DIR, `${jobId}.mp4`);
  if (existsSync(outputFile)) {
    return res.json({ ok: true, status: 'done', url: `/outputs/${jobId}.mp4` });
  }
  if (activeJobs.has(jobId)) {
    return res.json({ ok: true, status: 'processing', progress: 45 });
  }
  res.json({ ok: true, status: 'unknown' });
});

// Cleanup job
app.delete('/job/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const out = join(OUTPUT_DIR, `${jobId}.mp4`);
    if (existsSync(out)) {
      const { unlink } = await import('fs/promises');
      await unlink(out);
    }
    const proc = activeJobs.get(jobId);
    if (proc) proc.kill();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`Caply server running on http://localhost:${PORT}`);
});
